import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { companyModel, roleModel, userModel, parentUserMappingModel } from "../models/index.js";

const SAFE_ATTRS = { exclude: ['password'] };
const INCLUDE = [
    { model: roleModel, as: 'role', attributes: ['id', 'name'] },
    { model: companyModel, as: 'company', attributes: ['id', 'name'] },
];

const Create = async (req, res) => {
    try {
        const { company_id, role_id, user_name, password, status } = req.body;
        if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Valid company id is required');
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');
        if (!isNonEmpty(user_name)) return ResponseService.badRequest(res, 'User name is required');
        if (!isNonEmpty(password) || password.length < 6) {
            return ResponseService.badRequest(res, 'Password is required (min 6 characters)');
        }

        const company = await companyModel.findOne({ where: { id: company_id, is_deleted: false } });
        if (!company) return ResponseService.notFound(res, 'Company not found');

        const role = await roleModel.findOne({ where: { id: role_id, company_id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found for this company');

        const exists = await userModel.findOne({ where: { company_id, user_name: user_name.trim(), is_deleted: false } });
        if (exists) return ResponseService.badRequest(res, 'User name already exist');

        const user = await userModel.create({
            company_id,
            role_id,
            user_name: user_name.trim(),
            password: await bcrypt.hash(password, 10),
            status: status ?? true,
        });
        const data = user.toJSON();
        delete data.password;
        await logAction({ userId: req.userId, tableName: 'user_master', actionType: 'CREATE', recordId: user.id, newValues: data });
        return ResponseService.created(res, data, 'User created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const List = async (req, res) => {
    try {
        const { company_id, role_id } = req.query;
        const where = { is_deleted: false };
        if (company_id) {
            if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Invalid company id');
            where.company_id = company_id;
        }
        if (role_id) {
            if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Invalid role id');
            where.role_id = role_id;
        }
        const users = await userModel.findAll({
            where,
            attributes: SAFE_ATTRS,
            include: INCLUDE,
            order: [['user_name', 'ASC']],
        });
        return ResponseService.success(res, 'Success', users);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const GetById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid user id is required');
        const user = await userModel.findOne({ where: { id, is_deleted: false }, attributes: SAFE_ATTRS, include: INCLUDE });
        if (!user) return ResponseService.notFound(res, 'User not found');
        return ResponseService.success(res, 'Success', user);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid user id is required');

        const user = await userModel.findOne({ where: { id, is_deleted: false } });
        if (!user) return ResponseService.notFound(res, 'User not found');

        const { user_name, role_id, password, status } = req.body;
        const changes = {};

        if (user_name !== undefined) {
            if (!isNonEmpty(user_name)) return ResponseService.badRequest(res, 'User name cannot be empty');
            const duplicate = await userModel.findOne({
                where: { company_id: user.company_id, user_name: user_name.trim(), is_deleted: false, id: { [Op.ne]: id } },
            });
            if (duplicate) return ResponseService.badRequest(res, 'User name already exist');
            changes.user_name = user_name.trim();
        }
        if (role_id !== undefined) {
            if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Invalid role id');
            const role = await roleModel.findOne({ where: { id: role_id, company_id: user.company_id, is_deleted: false } });
            if (!role) return ResponseService.notFound(res, 'Role not found for this company');
            changes.role_id = role_id;
        }
        if (password !== undefined) {
            if (!isNonEmpty(password) || password.length < 6) {
                return ResponseService.badRequest(res, 'Password must be at least 6 characters');
            }
            changes.password = await bcrypt.hash(password, 10);
        }
        if (status !== undefined) changes.status = status;

        const oldValues = user.toJSON();
        delete oldValues.password;
        await user.update(changes);
        const data = user.toJSON();
        delete data.password;
        await logAction({ userId: req.userId, tableName: 'user_master', actionType: 'UPDATE', recordId: id, oldValues, newValues: data });
        return ResponseService.success(res, 'User updated successfully', data);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid user id is required');

        const user = await userModel.findOne({ where: { id, is_deleted: false } });
        if (!user) return ResponseService.notFound(res, 'User not found');

        const oldValues = user.toJSON();
        delete oldValues.password;
        await sequelize.transaction(async (transaction) => {
            // parent/child links hata do, user soft delete
            await parentUserMappingModel.destroy({
                where: { [Op.or]: [{ parent_user_id: id }, { child_user_id: id }] },
                transaction,
            });
            await user.update({ is_deleted: true }, { transaction });
        });
        await logAction({ userId: req.userId, tableName: 'user_master', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'User deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, GetById, update, deleteUser };
