import { Op } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { companyModel, roleModel, userModel } from "../models/index.js";

const Create = async (req, res) => {
    try {
        const { company_id, name, status } = req.body;
        if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Valid company id is required');
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Role name is required');

        const company = await companyModel.findOne({ where: { id: company_id, is_deleted: false } });
        if (!company) return ResponseService.notFound(res, 'Company not found');

        const exists = await roleModel.findOne({ where: { company_id, name: name.trim(), is_deleted: false } });
        if (exists) return ResponseService.badRequest(res, 'Role already exist');

        const role = await roleModel.create({ company_id, name: name.trim(), status: status ?? true });
        await logAction({ userId: req.userId, tableName: 'role_master', actionType: 'CREATE', recordId: role.id, newValues: role.toJSON() });
        return ResponseService.created(res, role, 'Role created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const List = async (req, res) => {
    try {
        const { company_id } = req.query;
        const where = { is_deleted: false };
        if (company_id) {
            if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Invalid company id');
            where.company_id = company_id;
        }
        const roles = await roleModel.findAll({
            where,
            include: [{ model: companyModel, as: 'company', attributes: ['id', 'name'] }],
            order: [['name', 'ASC']],
        });
        return ResponseService.success(res, 'Success', roles);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid role id is required');

        const role = await roleModel.findOne({ where: { id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found');

        const { name, status } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Role name is required');

        const duplicate = await roleModel.findOne({
            where: { company_id: role.company_id, name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Role name already exist');

        const oldValues = role.toJSON();
        await role.update({ name: name.trim(), status: status ?? role.status });
        await logAction({ userId: req.userId, tableName: 'role_master', actionType: 'UPDATE', recordId: id, oldValues, newValues: role.toJSON() });
        return ResponseService.success(res, 'Role updated successfully', role);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid role id is required');

        const role = await roleModel.findOne({ where: { id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found');

        const userCount = await userModel.count({ where: { role_id: id, is_deleted: false } });
        if (userCount > 0) return ResponseService.conflict(res, 'Role is assigned to users, reassign them first');

        const oldValues = role.toJSON();
        await role.update({ is_deleted: true });
        await logAction({ userId: req.userId, tableName: 'role_master', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'Role deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, update, deleteRole };
