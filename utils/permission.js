import { rolePermissionMappingModel } from "../models/index.js";
import { userPermissionMappingModel } from "../models/userPermissionModel.js";

export const FLAGS = ['can_view', 'can_add', 'can_edit', 'can_delete'];

export const getEffectivePermissions = async (userId, roleId) => {
    const [rolePerms, userPerms] = await Promise.all([
        rolePermissionMappingModel.findAll({ where: { role_id: roleId }, attributes: ['menu_id', ...FLAGS], raw: true }),
        userPermissionMappingModel.findAll({ where: { user_id: userId, role_id: roleId }, attributes: ['menu_id', ...FLAGS], raw: true }),
    ]);

    const result = new Map();
    for (const p of rolePerms) result.set(p.menu_id, { ...p, source: 'role' });
    for (const p of userPerms) result.set(p.menu_id, { ...p, source: 'user' });
    return result;
};