import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isBool } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { findCompanyMenus } from "../utils/menuAccess.js";
import { roleModel, menuModel, rolePermissionMappingModel } from "../models/index.js";

const FLAGS = ['can_view', 'can_edit', 'can_delete'];

const Save = async (req, res) => {
    try {
        const { role_id, permissions } = req.body;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return ResponseService.badRequest(res, 'permissions must be a non-empty array');
        }

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
            byMenu.set(p.menu_id, row); 
        }
        const rows = [...byMenu.values()];

        const role = await roleModel.findOne({ where: { id: role_id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found');

        const menus = await findCompanyMenus(role.company_id, rows.map((r) => r.menu_id));
        if (menus.length !== rows.length) {
            return ResponseService.badRequest(res, 'One or more menus are invalid or do not belong to this company');
        }

        const existing = await rolePermissionMappingModel.findAll({ where: { role_id, menu_id: rows.map((r) => r.menu_id) } });
        const existingByMenu = new Map(existing.map((e) => [e.menu_id, e]));
        const oldValues = existing.map((e) => e.toJSON());

        await sequelize.transaction(async (transaction) => {
            for (const r of rows) {
                const found = existingByMenu.get(r.menu_id);
                if (found) await found.update({ can_view: r.can_view, can_edit: r.can_edit, can_delete: r.can_delete }, { transaction });
                else await rolePermissionMappingModel.create({ role_id, ...r }, { transaction });
            }
        });

        await logAction({ userId: req.userId, tableName: 'role_permission_mapping', actionType: 'UPDATE', recordId: role_id, oldValues, newValues: rows });
        return ResponseService.success(res, 'Permissions saved successfully', rows);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const List = async (req, res) => {
    try {
        const { role_id } = req.query;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');

        const rows = await rolePermissionMappingModel.findAll({
            where: { role_id },
            include: [{
                model: menuModel, as: 'menu', required: true,
                attributes: ['id', 'name', 'url', 'module_id', 'parent_menu_id'],
                where: { is_deleted: false },
            }],
        });
        return ResponseService.success(res, 'Success', rows);
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
