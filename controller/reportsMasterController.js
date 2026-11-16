import { Op } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { isUuid, isNonEmpty, isBool } from "../utils/validate.js";
import { reportsMasterModel } from "../models/reportsModel.js";

const clean = (v) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return ['', 'null', 'undefined'].includes(s.toLowerCase()) ? undefined : s;
};

const List = async (req, res) => {
    try {
        const status = clean(req.query.status);
        const where = { is_deleted: false };

        if (status !== undefined) {
            if (!['true', 'false'].includes(status.toLowerCase())) {
                return ResponseService.badRequest(res, 'status must be true or false');
            }
            where.status = status.toLowerCase() === 'true';
        }

        const reports = await reportsMasterModel.findAll({ where, order: [["name", "ASC"]] });
        return ResponseService.success(res, "Success", reports);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const GetById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid report id is required');

        const report = await reportsMasterModel.findOne({ where: { id, is_deleted: false } });
        if (!report) return ResponseService.notFound(res, 'Report not found');

        return ResponseService.success(res, "Success", report);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const Create = async (req, res) => {
    try {
        const { name, url, status, icon } = req.body;

        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Report name is required');
        if (status !== undefined && !isBool(status)) {
            return ResponseService.badRequest(res, 'status must be true or false');
        }

        const exists = await reportsMasterModel.findOne({
            where: { name: name.trim(), is_deleted: false },
        });
        if (exists) return ResponseService.badRequest(res, 'Report already exist');

        const report = await reportsMasterModel.create({
            name: name.trim(),
            url: url?.trim() || null,
            status: status ?? true,
            icon: icon ?? null,
        });
        return ResponseService.created(res, report, 'Report created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid report id is required');

        const report = await reportsMasterModel.findOne({ where: { id, is_deleted: false } });
        if (!report) return ResponseService.notFound(res, 'Report not found');

        const { name, url, status, icon } = req.body;

        if (!isNonEmpty(name)) return ResponseService.badRequest(res, 'Report name is required');
        if (status !== undefined && !isBool(status)) {
            return ResponseService.badRequest(res, 'status must be true or false');
        }

        const duplicate = await reportsMasterModel.findOne({
            where: { name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) return ResponseService.badRequest(res, 'Report name already exist');

        await report.update({
            name: name.trim(),
            url: url !== undefined ? (url?.trim() || null) : report.url,
            status: status ?? report.status,
            icon: icon !== undefined ? icon : report.icon,
        });
        return ResponseService.success(res, 'Report updated successfully', report);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid report id is required');

        const report = await reportsMasterModel.findOne({ where: { id, is_deleted: false } });
        if (!report) return ResponseService.notFound(res, 'Report not found');

        await report.update({ is_deleted: true });
        return ResponseService.success(res, 'Report deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { List, GetById, Create, update, deleteReport };