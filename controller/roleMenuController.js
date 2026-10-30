import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { findCompanyMenus } from "../utils/menuAccess.js";
import { roleModel, menuModel, roleMenuMappingModel } from "../models/index.js";

// Role ko accessible menus ka poora set replace karta hai (menu_ids: [] => sab hata do)
const Assign = async (req, res) => {
    try {
        const { role_id, menu_ids } = req.body;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');
        if (!Array.isArray(menu_ids) || !menu_ids.every(isUuid)) {
            return ResponseService.badRequest(res, 'menu_ids must be an array of valid ids');
        }

        const role = await roleModel.findOne({ where: { id: role_id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found');

        const ids = [...new Set(menu_ids)];
        if (ids.length) {
            const menus = await findCompanyMenus(role.company_id, ids);
            if (menus.length !== ids.length) {
                return ResponseService.badRequest(res, 'One or more menus are invalid or do not belong to this company');
            }
        }

        const oldRows = await roleMenuMappingModel.findAll({ where: { role_id }, attributes: ['menu_id'], raw: true });
        await sequelize.transaction(async (transaction) => {
            await roleMenuMappingModel.destroy({ where: { role_id }, transaction });
            if (ids.length) {
                await roleMenuMappingModel.bulkCreate(ids.map((menu_id) => ({ role_id, menu_id })), { transaction });
            }
        });
        await logAction({
            userId: req.userId, tableName: 'role_menu_mapping', actionType: 'UPDATE', recordId: role_id,
            oldValues: oldRows.map((r) => r.menu_id), newValues: ids,
        });
        return ResponseService.success(res, 'Role menus updated successfully', { role_id, menu_ids: ids });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const List = async (req, res) => {
    try {
        const { role_id } = req.query;
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');

        const rows = await roleMenuMappingModel.findAll({
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

export { Assign, List };
