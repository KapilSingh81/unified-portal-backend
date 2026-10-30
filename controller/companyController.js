import { Op } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { companyModel } from "../models/companyModel.js";

const normalizeCode = (code) => {
    if (code === undefined || code === null) return null;
    const value = String(code).trim().toUpperCase();
    return value === '' ? null : value;
};

const Create = async (req, res) => {
    try {
        const { name, status } = req.body;
        if (!name || !name.trim()) {
            return ResponseService.badRequest(res, 'Company name is required');
        }

        const code = normalizeCode(req.body.code);

        const checkCompany = await companyModel.findOne({
            where: { name: name.trim(), is_deleted: false },
        });
        if (checkCompany) {
            return ResponseService.badRequest(res, 'Company already exist');
        }

        if (code) {
            const checkCode = await companyModel.findOne({ where: { code } });
            if (checkCode) {
                return ResponseService.badRequest(res, 'Company code already exist');
            }
        }

        const company = await companyModel.create({
            name: name.trim(),
            code,
            status: status ?? true,
        });
        return ResponseService.created(res, company, 'Company created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const List = async (req, res) => {
    try {
        const companies = await companyModel.findAll({
            where: { is_deleted: false },
            order: [['id', 'DESC']],
        });
        return ResponseService.success(res, 'Success', companies);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return ResponseService.badRequest(res, 'Company id is required');

        const company = await companyModel.findOne({
            where: { id, is_deleted: false },
        });
        if (!company) return ResponseService.notFound(res, 'Company not found');

        const { name, status } = req.body;
        if (!name || !name.trim()) {
            return ResponseService.badRequest(res, 'Company name is required');
        }

        const duplicate = await companyModel.findOne({
            where: { name: name.trim(), is_deleted: false, id: { [Op.ne]: id } },
        });
        if (duplicate) {
            return ResponseService.badRequest(res, 'Company name already exist');
        }

        const code = req.body.code === undefined ? company.code : normalizeCode(req.body.code);

        if (code && code !== company.code) {
            const duplicateCode = await companyModel.findOne({
                where: { code, id: { [Op.ne]: id } },
            });
            if (duplicateCode) {
                return ResponseService.badRequest(res, 'Company code already exist');
            }
        }

        await company.update({
            name: name.trim(),
            code,
            status: status ?? company.status,
        });
        return ResponseService.success(res, 'Company updated successfully', company);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return ResponseService.badRequest(res, 'Company id is required');

        const company = await companyModel.findOne({
            where: { id, is_deleted: false },
        });
        if (!company) return ResponseService.notFound(res, 'Company not found');

        await company.update({ is_deleted: true });
        return ResponseService.success(res, 'Company deleted successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, update, deleteCompany };