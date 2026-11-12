import { Op } from "sequelize";
import { moduleModel, menuModel, domainModel } from "../models/index.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty, isBool } from "../utils/validate.js";

const checkDomain = async (domain_id) => {
    if (!isUuid(domain_id)) return { error: 'Valid domain id is required' };
    const domain = await domainModel.findOne({ where: { id: domain_id, is_deleted: false } });
    if (!domain) return { error: 'Domain not found', notFound: true };
    return { value: domain_id };
};

// optional filters: ?domain_id=  ?is_portal=true|false
const List = async (req, res) => {
    try {
        const { domain_id, is_portal } = req.query;
        const where = { is_deleted: false };

        if (domain_id) {
            if (!isUuid(domain_id)) return ResponseService.badRequest(res, 'Invalid domain id');
            where.domain_id = domain_id;
        }
        if (is_portal !== undefined) {
            if (!['true', 'false'].includes(String(is_portal))) {
                return ResponseService.badRequest(res, 'is_portal must be true or false');
            }
            where.is_portal = String(is_portal) === 'true';
        }

        const modules = await moduleModel.findAll({ where, order: [["name", "ASC"]] });
        return ResponseService.success(res, "Success", modules);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const Create = async (req, res) => {
    try {
        const { name, url, status, icon, domain_id, is_portal } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');
        if (is_portal !== undefined && !isBool(is_portal)) {
            return ResponseService.badRequest(res, 'is_portal must be true or false');
        }

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

        const module = await moduleModel.findOne({ where: { id, is_deleted: false } });
        if (!module) return ResponseService.notFound(res, 'Module not found');

        const { name, url, status, icon, domain_id, is_portal } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');
        if (is_portal !== undefined && !isBool(is_portal)) {
            return ResponseService.badRequest(res, 'is_portal must be true or false');
        }

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

        const menuCount = await menuModel.count({ where: { module_id: id, is_deleted: false } });
        if (menuCount > 0) return ResponseService.conflict(res, 'Module has menus, delete them first');

        await module.update({ is_deleted: true });
        return ResponseService.success(res, 'Module deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { List, Create, update, deleteModule };