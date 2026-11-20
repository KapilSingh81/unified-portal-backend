import bcrypt from "bcrypt";
import { Op, QueryTypes, fn, col } from "sequelize";
import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import {
    companyModel, roleModel, parentUserMappingModel,
    userModel,
} from "../models/index.js";
import { userPermissionMappingModel } from "../models/userPermissionModel.js";
import { getActor, getSubtreeIds, provisionEmployee } from "../utils/helper.js";

const SAFE_ATTRS = { exclude: ['password'] };
const INCLUDE = [
    { model: roleModel, as: 'role', attributes: ['id', 'name'] },
    { model: companyModel, as: 'company', attributes: ['id', 'name'] },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_ROLE_NAME = 'Admin';
const USER_ROLE_NAME = 'User';

const canManage = async (actor, targetId) => {
    if (actor.isAdmin) return true;
    const ids = await getSubtreeIds(actor.user.id);
    return ids.includes(targetId);
};

const Create = async (req, res) => {
    try {
        const actor = await getActor(req.userId);
        if (!actor) return ResponseService.notFound(res, 'Creator not found');
        if (!actor.isAdmin && !actor.user.is_subchild_create) {
            return ResponseService.error(res, 'You are not allowed to create users', 403);
        }

        const {
            company_id, role_id, user_name, password, status,
            firstName, lastName, email, contact, is_subchild_create,
        } = req.body;

        if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Valid company id is required');
        if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Valid role id is required');
        if (!isNonEmpty(user_name)) return ResponseService.badRequest(res, 'User name is required');
        if (!isNonEmpty(password) || password.length < 6) {
            return ResponseService.badRequest(res, 'Password is required (min 6 characters)');
        }
        if (!isNonEmpty(firstName)) return ResponseService.badRequest(res, 'First name is required');
        if (!isNonEmpty(email) || !EMAIL_RE.test(email.trim())) {
            return ResponseService.badRequest(res, 'Valid email is required');
        }

        // Non-admin can only create inside own company
        if (!actor.isAdmin && company_id !== actor.user.company_id) {
            return ResponseService.error(res, 'You can only create users in your own company', 403);
        }

        const company = await companyModel.findOne({ where: { id: company_id, is_deleted: false } });
        if (!company) return ResponseService.notFound(res, 'Company not found');

        const role = await roleModel.findOne({ where: { id: role_id, company_id, is_deleted: false } });
        if (!role) return ResponseService.notFound(res, 'Role not found for this company');

        // Sub-users (child, grandchild, ...) can only be User role
        if (!actor.isAdmin && role.name !== USER_ROLE_NAME) {
            return ResponseService.error(res, 'Sub-users can only be created with the User role', 403);
        }

        const exists = await userModel.findOne({ where: { company_id, user_name: user_name.trim(), is_deleted: false } });
        if (exists) return ResponseService.badRequest(res, 'User name already exist');

        const emailLower = email.trim().toLowerCase();
        const emailExists = await userModel.findOne({ where: { email: emailLower, is_deleted: false } });
        if (emailExists) return ResponseService.badRequest(res, 'Email already exist');

        const user = await userModel.create({
            company_id,
            role_id,
            user_name: user_name.trim(),
            password: await bcrypt.hash(password, 10),
            status: status ?? true,
            first_name: firstName.trim(),
            last_name: lastName?.trim() || null,
            email: emailLower,
            contact: contact?.trim() || null,
            parentId: actor.user.id,
            is_subchild_create: !!is_subchild_create,
        });

        const data = user.toJSON();
        delete data.password;
        await logAction({ userId: req.userId, tableName: 'user_master', actionType: 'CREATE', recordId: user.id, newValues: data });

        const provision = await provisionEmployee({
            centralUserId: user.id,
            roleId: role.central_role_id ?? 0,
            userName: user.user_name,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            contact: user.contact,
            CentralParentUserId : user.parentId
        });
        if (!provision.ok) {
            console.error('ProvisionEmployee failed:', provision.error);
        }
        return ResponseService.created(res, data, 'User created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};


const lc = (v) => String(v).toLowerCase();

const List = async (req, res) => {
    try {
        const actor = await getActor(req.userId);
        if (!actor) return ResponseService.notFound(res, 'User not found');

        const { company_id, role_id, parent_id, deep } = req.query;
        const where = { is_deleted: false };
        if (company_id) {
            if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Invalid company id');
            where.company_id = company_id;
        }
        if (role_id) {
            if (!isUuid(role_id)) return ResponseService.badRequest(res, 'Invalid role id');
            where.role_id = role_id;
        }
        let allowedIds = actor.isAdmin ? null : await getSubtreeIds(actor.user.id);

        if (parent_id) {
            if (!isUuid(parent_id)) return ResponseService.badRequest(res, 'Invalid parent id');
            if (deep === 'true') {
                let ids = await getSubtreeIds(parent_id);
                if (allowedIds) {
                    const allowed = new Set(allowedIds.map(lc));
                    ids = ids.filter((i) => allowed.has(lc(i)));
                }
                allowedIds = ids;
            } else {
                where.parentId = parent_id;
            }
        }
        if (allowedIds) where.id = { [Op.in]: allowedIds };

        const users = await userModel.findAll({
            where,
            attributes: SAFE_ATTRS,
            include: INCLUDE,
            order: [['first_name', 'ASC'], ['user_name', 'ASC']],
        });
        const parentIds = [...new Set(users.map((u) => u.parentId).filter(Boolean))];
        const parents = parentIds.length
            ? await userModel.findAll({
                where: { id: { [Op.in]: parentIds } },
                attributes: ['id', 'first_name', 'last_name'],
            })
            : [];
        const parentMap = new Map(parents.map((p) => [lc(p.id), p]));

        // direct sub-user counts
        const userIds = users.map((u) => u.id);
        const counts = userIds.length
            ? await userModel.findAll({
                where: { parentId: { [Op.in]: userIds }, is_deleted: false },
                attributes: ['parentId', [fn('COUNT', col('id')), 'cnt']],
                group: ['parentId'],
                raw: true,
            })
            : [];
        const countMap = new Map(counts.map((c) => [lc(c.parentId), Number(c.cnt)]));

        const data = users.map((u) => {
            const row = u.toJSON();
            const p = u.parentId ? parentMap.get(lc(u.parentId)) : null;
            row.parentName = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : null;
            row.childCount = countMap.get(lc(u.id)) || 0;
            return row;
        });

        return ResponseService.success(res, 'Success', data);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const GetById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid user id is required');

        const actor = await getActor(req.userId);
        if (!actor) return ResponseService.notFound(res, 'User not found');
        if (id !== actor.user.id && !(await canManage(actor, id))) {
            return ResponseService.error(res, 'Access denied', 403);
        }
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

        const actor = await getActor(req.userId);
        if (!actor) return ResponseService.notFound(res, 'User not found');
        if (!(await canManage(actor, id))) {
            return ResponseService.error(res, 'Access denied', 403);
        }

        const user = await userModel.findOne({ where: { id, is_deleted: false } });
        if (!user) return ResponseService.notFound(res, 'User not found');

        const {
            user_name, role_id, password, status, firstName, lastName,
            email, contact, is_subchild_create,
        } = req.body;
        const changes = {};
        let roleChanged = false;

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
            if (!actor.isAdmin && role.name !== USER_ROLE_NAME) {
                return ResponseService.error(res, 'Sub-users can only have the User role', 403);
            }
            if (role_id !== user.role_id) {
                changes.role_id = role_id;
                roleChanged = true;
            }
        }
        if (password !== undefined) {
            if (!isNonEmpty(password) || password.length < 6) {
                return ResponseService.badRequest(res, 'Password must be at least 6 characters');
            }
            changes.password = await bcrypt.hash(password, 10);
        }
        if (status !== undefined) changes.status = status;

        if (firstName !== undefined) {
            if (!isNonEmpty(firstName)) return ResponseService.badRequest(res, 'First name cannot be empty');
            changes.first_name = firstName.trim();
        }
        if (lastName !== undefined) changes.last_name = lastName?.trim() || null;
        if (email !== undefined) {
            if (!isNonEmpty(email) || !EMAIL_RE.test(email.trim())) {
                return ResponseService.badRequest(res, 'Valid email is required');
            }
            const emailLower = email.trim().toLowerCase();
            const emailExists = await userModel.findOne({
                where: { email: emailLower, is_deleted: false, id: { [Op.ne]: id } },
            });
            if (emailExists) return ResponseService.badRequest(res, 'Email already exist');
            changes.email = emailLower;
        }
        if (contact !== undefined) changes.contact = contact?.trim() || null;

        // Admin, or the direct parent (who must hold the permission), can change the flag
        if (is_subchild_create !== undefined) {
            const isParent = user.parentId === actor.user.id;
            if (!actor.isAdmin && !isParent) {
                return ResponseService.error(res, 'Only admin or the parent user can change this permission', 403);
            }
            if (!actor.isAdmin && !actor.user.is_subchild_create) {
                return ResponseService.error(res, 'You do not have this permission yourself', 403);
            }
            changes.is_subchild_create = !!is_subchild_create;
        }

        const oldValues = user.toJSON();
        delete oldValues.password;

        await sequelize.transaction(async (transaction) => {
            await user.update(changes, { transaction });
            if (roleChanged) {
                await userPermissionMappingModel.destroy({ where: { user_id: id }, transaction });
            }
        });

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

        const actor = await getActor(req.userId);
        if (!actor) return ResponseService.notFound(res, 'User not found');
        if (id === actor.user.id) {
            return ResponseService.error(res, 'You cannot delete yourself', 400);
        }
        if (!(await canManage(actor, id))) {
            return ResponseService.error(res, 'Access denied', 403);
        }

        const user = await userModel.findOne({ where: { id, is_deleted: false } });
        if (!user) return ResponseService.notFound(res, 'User not found');

        const oldValues = user.toJSON();
        delete oldValues.password;

        await sequelize.transaction(async (transaction) => {
            // Re-parent direct children to the deleted user's parent so the tree stays connected
            await userModel.update(
                { parentId: user.parentId },
                { where: { parentId: id, is_deleted: false }, transaction }
            );
            await parentUserMappingModel.destroy({
                where: { [Op.or]: [{ parent_user_id: id }, { child_user_id: id }] },
                transaction,
            });
            await userPermissionMappingModel.destroy({ where: { user_id: id }, transaction });
            await user.update({ is_deleted: true }, { transaction });
        });
        await logAction({ userId: req.userId, tableName: 'user_master', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'User deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, GetById, update, deleteUser };