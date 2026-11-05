import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isBool } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { userModel, menuModel, moduleModel } from "../models/index.js";
import { FLAGS, getEffectivePermissions } from "../utils/permission.js";
import { userPermissionMappingModel } from "../models/userPermissionModel.js";

// Saves the admin's decision for a user. Rows are stored with the user's current role_id.
// permissions: [] clears all overrides (user follows the role).
const Save = async (req, res) => {
    try {
        const { user_id, permissions } = req.body;
        if (!isUuid(user_id)) return ResponseService.badRequest(res, 'Valid user id is required');
        if (!Array.isArray(permissions)) return ResponseService.badRequest(res, 'permissions must be an array');

        const byMenu = new Map();
        for (const p of permissions) {
            if (!p || !isUuid(p.menu_id)) return ResponseService.badRequest(res, 'Each permission needs a valid menu_id');
            const row = { menu_id: p.menu_id };
            for (const f of FLAGS) {
                if (p[f] !== undefined && !isBool(p[f])) {
                    return ResponseService.badRequest(res, `${f} must be true or false`);
                }
                row[f] = p[f] ?? false;
            }
            if (row.can_add || row.can_edit || row.can_delete) row.can_view = true;
            byMenu.set(p.menu_id, row);
        }
        const rows = [...byMenu.values()];

        const user = await userModel.findOne({ where: { id: user_id, is_deleted: false }, raw: true });
        if (!user) return ResponseService.notFound(res, 'User not found');
        const role_id = user.role_id;

        if (rows.length) {
            const count = await menuModel.count({ where: { id: rows.map((r) => r.menu_id), is_deleted: false } });
            if (count !== rows.length) return ResponseService.badRequest(res, 'One or more menus are invalid');
        }

        const oldValues = await userPermissionMappingModel.findAll({ where: { user_id }, raw: true });

        await sequelize.transaction(async (transaction) => {
            await userPermissionMappingModel.destroy({ where: { user_id }, transaction });
            if (rows.length) {
                await userPermissionMappingModel.bulkCreate(rows.map((r) => ({ user_id, role_id, ...r })), { transaction });
            }
        });

        await logAction({
            userId: req.userId, tableName: 'user_permission_mapping', actionType: 'UPDATE',
            recordId: user_id, oldValues, newValues: rows,
        });
        return ResponseService.success(res, 'User permissions saved successfully', { user_id, role_id, permissions: rows });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// All menus with the user's effective permission, plus what the role gives, so admin can compare.
const List = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!isUuid(user_id)) return ResponseService.badRequest(res, 'Valid user id is required');

        const user = await userModel.findOne({ where: { id: user_id, is_deleted: false }, raw: true });
        if (!user) return ResponseService.notFound(res, 'User not found');

        const [menus, effective, overrides] = await Promise.all([
            menuModel.findAll({
                where: { is_deleted: false },
                attributes: ['id', 'name', 'url', 'icon', 'module_id', 'parent_menu_id'],
                include: [{
                    model: moduleModel, as: 'module', attributes: ['name'],
                    required: true, where: { is_deleted: false },
                }],
                order: [['name', 'ASC']],
                raw: true,
                nest: true,
            }),
            getEffectivePermissions(user_id, user.role_id),
            userPermissionMappingModel.findAll({
                where: { user_id, role_id: user.role_id },
                attributes: ['id', 'menu_id'],
                raw: true,
            }),
        ]);

        const overrideIdByMenu = new Map(overrides.map((o) => [o.menu_id, o.id]));
        const data = menus.map(({ module, ...m }) => {
            const p = effective.get(m.id);
            const flags = Object.fromEntries(FLAGS.map((f) => [f, p?.[f] ?? false]));
            return {
                ...m,
                module_name: module.name,
                checked: FLAGS.some((f) => flags[f]),
                source: p?.source ?? 'none',   // 'user' = admin changed it, 'role' = inherited, 'none'
                permission_id: overrideIdByMenu.get(m.id) ?? null,
                ...flags,
                all_access: FLAGS.every((f) => flags[f]),
            };
        });

        return ResponseService.success(res, 'Success', { user_id, role_id: user.role_id, menus: data });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// Removes one override so the menu goes back to the role permission.
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid id is required');

        const row = await userPermissionMappingModel.findByPk(id);
        if (!row) return ResponseService.notFound(res, 'Permission mapping not found');

        const oldValues = row.toJSON();
        await row.destroy();
        await logAction({ userId: req.userId, tableName: 'user_permission_mapping', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'User permission removed successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Save, List, remove };