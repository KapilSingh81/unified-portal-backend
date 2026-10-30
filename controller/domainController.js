import { Op } from "sequelize";
import { domainModel, moduleModel } from "../models/index.js";
import ResponseService from "../utils/httpService.js";
import { isNonEmpty } from "../utils/validate.js";

const List = async (req, res) => {
    try {
        const domainData = await domainModel.findAll({
            where: { is_deleted: false },
            order: [['name', 'ASC']],
        });

        if (domainData.length === 0) {
            return ResponseService.notFound(res, 'No domains found');
        }

        return ResponseService.success(res, 'Success', domainData);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const Create = async (req, res) => {
    try {
        const { name, url, status } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Domain name is required');
        if (!isNonEmpty(url)) return ResponseService.badRequest(res, 'Domain url is required');

        const exists = await domainModel.findOne({ where: { name: name.trim(), is_deleted: false } });
        if (exists) return ResponseService.badRequest(res, 'Domain already exist');

        const domain = await domainModel.create({ name: name.trim(), url: url.trim(), status: status ?? true });
        return ResponseService.created(res, domain, 'Domain created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(id)) return ResponseService.badRequest(res, 'Valid domain id is required');

        const domain = await domainModel.findOne({ where: { id, is_deleted: false } });
        if (!domain) return ResponseService.notFound(res, 'Domain not found');

        const { name, url, status } = req.body;
        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Domain name is required');
        if (url !== undefined && !isNonEmpty(url)) return ResponseService.badRequest(res, 'Domain url cannot be empty');

        const duplicate = await domainModel.findOne({
            where: { name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Domain name already exist');

        await domain.update({
            name: name.trim(),
            url: url !== undefined ? url.trim() : domain.url,
            status: status ?? domain.status,
        });
        return ResponseService.success(res, 'Domain updated successfully', domain);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteDomain = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(id)) return ResponseService.badRequest(res, 'Valid domain id is required');

        const domain = await domainModel.findOne({ where: { id, is_deleted: false } });
        if (!domain) return ResponseService.notFound(res, 'Domain not found');

        const moduleCount = await moduleModel.count({ where: { domain_id: id, is_deleted: false } });
        if (moduleCount > 0) return ResponseService.conflict(res, 'Domain has modules, delete them first');

        await domain.update({ is_deleted: true });
        return ResponseService.success(res, 'Domain deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { List, Create, update, deleteDomain };