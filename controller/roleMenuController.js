import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isBool } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { roleModel, menuModel, moduleModel, rolePermissionMappingModel } from "../models/index.js";

const FLAGS = ['can_view', 'can_add', 'can_edit', 'can_delete'];

const Save = async (req, res) => {
    try {
        const { role_id, permissions } = req.body;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');
        if (!Array.isArray(permissions)) return ResponseService.badRequest(res, 'permissions must be an array');

        const byMenu = new Map();
        for (const p of permissions) {
            if (!p || !isUuid(p.menu_id)) return ResponseService.badRequest(res, 'Each permission needs a valid menu_id');

            const row = { menu_id: p.menu_id };
            const anyFlagSent = FLAGS.some((f) => p[f] !== undefined);
            for (const f of FLAGS) {
                if (p[f] !== undefined && !isBool(p[f])) {
                    return ResponseService.badRequest(res, `${f} must be true or false`);
                }
                row[f] = p[f] ?? false;
            }
            if (!anyFlagSent) row.can_view = true;
            if (row.can_add || row.can_edit || row.can_delete) row.can_view = true;

            byMenu.set(p.menu_id, row);
        }
        const rows = [...byMenu.values()];

        const role = await roleModel.findOne({ where: { id: role_id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found');

        if (rows.length) {
            const count = await menuModel.count({ where: { id: rows.map((r) => r.menu_id), is_deleted: false } });
            if (count !== rows.length) {
                return ResponseService.badRequest(res, 'One or more menus are invalid');
            }
        }

        const oldValues = await rolePermissionMappingModel.findAll({ where: { role_id }, raw: true });

        await sequelize.transaction(async (transaction) => {
            await rolePermissionMappingModel.destroy({ where: { role_id }, transaction });
            if (rows.length) {
                await rolePermissionMappingModel.bulkCreate(rows.map((r) => ({ role_id, ...r })), { transaction });
            }
        });

        await logAction({
            userId: req.userId, tableName: 'role_permission_mapping', actionType: 'UPDATE',
            recordId: role_id, oldValues, newValues: rows,
        });
        return ResponseService.success(res, 'Role permissions saved successfully', { role_id, permissions: rows });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// All menus with module name. checked = menu mapped to the role.
const List = async (req, res) => {
    try {
        const { role_id } = req.query;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');

        const [menus, permissions] = await Promise.all([
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
            rolePermissionMappingModel.findAll({
                where: { role_id },
                attributes: ['id', 'menu_id', ...FLAGS],
                raw: true,
            }),
        ]);

        const permByMenu = new Map(permissions.map((p) => [p.menu_id, p]));
        const data = menus.map(({ module, ...m }) => {
            const p = permByMenu.get(m.id);
            const flags = Object.fromEntries(FLAGS.map((f) => [f, p?.[f] ?? false]));
            return {
                ...m,
                module_name: module.name,
                checked: !!p,
                permission_id: p?.id ?? null,
                ...flags,
                all_access: FLAGS.every((f) => flags[f]),
            };
        });

        return ResponseService.success(res, 'Success', data);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid id is required');

        const row = await rolePermissionMappingModel.findByPk(id);
        if (!row) return ResponseService.notFound(res, 'Permission mapping not found');

        const oldValues = row.toJSON();
        await row.destroy();
        await logAction({ userId: req.userId, tableName: 'role_permission_mapping', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'Permission mapping removed successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Save, List, remove };