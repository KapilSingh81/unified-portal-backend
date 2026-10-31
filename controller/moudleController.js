import { Op } from "sequelize";
import { moduleModel, menuModel } from "../models/index.js";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty } from "../utils/validate.js";

const List = async (req, res) => {
    try {
        const modules = await moduleModel.findAll({
            where: { is_deleted: false },
            order: [["name", "ASC"]],
        });
        return ResponseService.success(res, "Success", modules);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const Create = async (req, res) => {
    try {
        const { name, url, status } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');

        const exists = await moduleModel.findOne({ where: { name: name.trim(), is_deleted: false } });
        if (exists) return ResponseService.badRequest(res, 'Module already exist');

        const module = await moduleModel.create({
            name: name.trim(),
            url: url?.trim() || null,
            status: status ?? true,
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

        const { name, url, status } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Module name is required');

        const duplicate = await moduleModel.findOne({
            where: { name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Module name already exist');

        await module.update({
            name: name.trim(),
            url: url !== undefined ? (url?.trim() || null) : module.url,
            status: status ?? module.status,
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