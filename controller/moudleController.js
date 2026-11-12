import { Op } from "sequelize";
import { moduleModel, menuModel, domainModel, roleModel } from "../models/index.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty, isBool } from "../utils/validate.js";

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];

const isAdminRole = async (roleId) => {
    const role = await roleModel.findOne({ where: { id: roleId, is_deleted: false }, raw: true });
    return !!role && ADMIN_ROLES.includes(role.name.trim().toLowerCase());
};

const denyNonAdmin = (res) =>
    res.status(403).json({ success: false, message: 'Access denied', errors: 403 });

const checkDomain = async (domain_id) => {
    if (!isUuid(domain_id)) return { error: 'Valid domain id is required' };
    const domain = await domainModel.findOne({ where: { id: domain_id, is_deleted: false } });
    if (!domain) return { error: 'Domain not found', notFound: true };
    return { value: domain_id };
};

// blank, "null" and "undefined" mean "no filter"
const clean = (v) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return ['', 'null', 'undefined'].includes(s.toLowerCase()) ? undefined : s;
};

// Admin: all modules (portal + third-party), is_portal is an optional filter.
// Other users: only is_portal = false.
const List = async (req, res) => {
    try {
        const domain_id = clean(req.query.domain_id);
        const is_portal = clean(req.query.is_portal);
        const where = { is_deleted: false };
        const isAdmin = await isAdminRole(req.roleId);

        if (domain_id) {
            if (!isUuid(domain_id)) return ResponseService.badRequest(res, 'Invalid domain id');
            where.domain_id = domain_id;
        }

        if (!isAdmin) {
            where.is_portal = false;
        } else if (is_portal !== undefined) {
            if (!['true', 'false'].includes(is_portal.toLowerCase())) {
                return ResponseService.badRequest(res, 'is_portal must be true or false');
            }
            where.is_portal = is_portal.toLowerCase() === 'true';
        }

        const modules = await moduleModel.findAll({ where, order: [["name", "ASC"]] });        
        return ResponseService.success(res, "Success", modules);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const Create = async (req, res) => {
    try {
        const isAdmin = await isAdminRole(req.roleId);
        const { name, url, status, icon, domain_id, is_portal } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');
        if (is_portal !== undefined && !isBool(is_portal)) {
            return ResponseService.badRequest(res, 'is_portal must be true or false');
        }
        // only admin can create a portal module
        if (is_portal && !isAdmin) return denyNonAdmin(res);

        const domain = await checkDomain(domain_id);
        if (domain.error) {
            return domain.notFound
                ? ResponseService.notFound(res, domain.error)
                : ResponseService.badRequest(res, domain.error);
        }

        const exists = await moduleModel.findOne({
            where: { name: name.trim(), domain_id: domain.value, is_deleted: false },
        });
        if (exists) return ResponseService.badRequest(res, 'Module already exist');

        const module = await moduleModel.create({
            domain_id: domain.value,
            name: name.trim(),
            url: url?.trim() || null,
            status: status ?? true,
            icon: icon ?? null,
            is_portal: is_portal ?? false,
        });
        return ResponseService.created(res, module, 'Module created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid module id is required');

        const isAdmin = await isAdminRole(req.roleId);

        const module = await moduleModel.findOne({ where: { id, is_deleted: false } });
        if (!module) return ResponseService.notFound(res, 'Module not found');
        // non-admin cannot touch portal modules
        if (module.is_portal && !isAdmin) return denyNonAdmin(res);

        const { name, url, status, icon, domain_id, is_portal } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');
        if (is_portal !== undefined && !isBool(is_portal)) {
            return ResponseService.badRequest(res, 'is_portal must be true or false');
        }
        if (is_portal && !isAdmin) return denyNonAdmin(res);

        const domain = await checkDomain(domain_id);
        if (domain.error) {
            return domain.notFound
                ? ResponseService.notFound(res, domain.error)
                : ResponseService.badRequest(res, domain.error);
        }

        const duplicate = await moduleModel.findOne({
            where: { name: name.trim(), domain_id: domain.value, is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Module name already exist');

        await module.update({
            domain_id: domain.value,
            name: name.trim(),
            url: url !== undefined ? (url?.trim() || null) : module.url,
            status: status ?? module.status,
            icon: icon !== undefined ? icon : module.icon,
            is_portal: is_portal ?? module.is_portal,
        });
        return ResponseService.success(res, 'Module updated successfully', module);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid module id is required');

        const module = await moduleModel.findOne({ where: { id, is_deleted: false } });
        if (!module) return ResponseService.notFound(res, 'Module not found');
        // non-admin cannot delete portal modules
        if (module.is_portal && !(await isAdminRole(req.roleId))) return denyNonAdmin(res);

        const menuCount = await menuModel.count({ where: { module_id: id, is_deleted: false } });
        if (menuCount > 0) return ResponseService.conflict(res, 'Module has menus, delete them first');

        await module.update({ is_deleted: true });
        return ResponseService.success(res, 'Module deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { List, Create, update, deleteModule };