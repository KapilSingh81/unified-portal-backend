import { Op } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty } from "../utils/validate.js";
import { menuModel, moduleModel } from "../models/index.js";

const Create = async (req, res) => {
    try {
        const { module_id, parent_menu_id, name, url, status } = req.body;
        if (!isUuid(module_id)) return ResponseService.badRequest(res, 'Valid module id is required');
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Menu name is required');

        const module = await moduleModel.findOne({ where: { id: module_id, is_deleted: false } });
        if (!module) return ResponseService.notFound(res, 'Module not found');

        if (parent_menu_id) {
            if (!isUuid(parent_menu_id)) return ResponseService.badRequest(res, 'Invalid parent menu id');
            const parent = await menuModel.findOne({ where: { id: parent_menu_id, module_id, is_deleted: false } });
            if (!parent) return ResponseService.notFound(res, 'Parent menu not found in this module');
        }

        const exists = await menuModel.findOne({
            where: { module_id, parent_menu_id: parent_menu_id ?? null, name: name.trim(), is_deleted: false },
        });
        if (exists) return ResponseService.badRequest(res, 'Menu already exist');

        const menu = await menuModel.create({
            module_id,
            parent_menu_id: parent_menu_id ?? null,
            name: name.trim(),
            url: url?.trim() || null,
            status: status ?? true,
        });
        return ResponseService.created(res, menu, 'Menu created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// flat list; ?module_id= & ?parent_menu_id= (parent_menu_id=null => top level menus)
const List = async (req, res) => {
    try {
        const { module_id, parent_menu_id } = req.query;
        const where = { is_deleted: false };
        if (module_id) {
            if (!isUuid(module_id)) return ResponseService.badRequest(res, 'Invalid module id');
            where.module_id = module_id;
        }
        if (parent_menu_id === 'null') where.parent_menu_id = null;
        else if (parent_menu_id) {
            if (!isUuid(parent_menu_id)) return ResponseService.badRequest(res, 'Invalid parent menu id');
            where.parent_menu_id = parent_menu_id;
        }
        const menus = await menuModel.findAll({
            where,
            include: [{ model: moduleModel, as: 'module', attributes: ['id', 'name', 'domain_id'], required: true }],
            order: [['name', 'ASC']],
        });
        return ResponseService.success(res, 'Success', menus);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// nested menu tree of one module (sidebar ke liye)
const Tree = async (req, res) => {
    try {
        const { module_id } = req.query;
        if (!isUuid(module_id)) return ResponseService.badRequest(res, 'Valid module id is required');

        const menus = await menuModel.findAll({
            where: { module_id, is_deleted: false },
            order: [['name', 'ASC']],
            raw: true,
        });
        const byId = new Map(menus.map((m) => [m.id, { ...m, children: [] }]));
        const roots = [];
        for (const node of byId.values()) {
            const parent = node.parent_menu_id && byId.get(node.parent_menu_id);
            (parent ? parent.children : roots).push(node);
        }
        return ResponseService.success(res, 'Success', roots);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid menu id is required');

        const menu = await menuModel.findOne({ where: { id, is_deleted: false } });
        if (!menu) return ResponseService.notFound(res, 'Menu not found');

        const { name, url, status, parent_menu_id } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Menu name is required');

        let newParent = menu.parent_menu_id;
        if (parent_menu_id !== undefined) {
            newParent = parent_menu_id || null;
            if (newParent) {
                if (!isUuid(newParent)) return ResponseService.badRequest(res, 'Invalid parent menu id');
                if (newParent === id) return ResponseService.badRequest(res, 'Menu cannot be its own parent');

                // loop check: naye parent ke upar chadhte hue kahin hum (id) to nahi mil rahe
                let cursor = await menuModel.findOne({ where: { id: newParent, module_id: menu.module_id, is_deleted: false } });
                if (!cursor) return ResponseService.notFound(res, 'Parent menu not found in this module');
                while (cursor) {
                    if (cursor.parent_menu_id === id) {
                        return ResponseService.badRequest(res, 'Invalid parent: it would create a loop');
                    }
                    cursor = cursor.parent_menu_id ? await menuModel.findByPk(cursor.parent_menu_id) : null;
                }
            }
        }

        const duplicate = await menuModel.findOne({
            where: { module_id: menu.module_id, parent_menu_id: newParent, name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Menu name already exist');

        await menu.update({
            name: name.trim(),
            url: url !== undefined ? (url?.trim() || null) : menu.url,
            status: status ?? menu.status,
            parent_menu_id: newParent,
        });
        return ResponseService.success(res, 'Menu updated successfully', menu);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid menu id is required');

        const menu = await menuModel.findOne({ where: { id, is_deleted: false } });
        if (!menu) return ResponseService.notFound(res, 'Menu not found');

        const childCount = await menuModel.count({ where: { parent_menu_id: id, is_deleted: false } });
        if (childCount > 0) return ResponseService.conflict(res, 'Menu has sub menus, delete them first');

        await menu.update({ is_deleted: true });
        return ResponseService.success(res, 'Menu deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, Tree, update, deleteMenu };
