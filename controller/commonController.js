import { companyModel } from "../models/companyModel.js";
import { domainModel } from "../models/domainModel.js";
import { moduleModel } from "../models/moudleModel.js";
import { roleModel } from "../models/roleModel.js";
import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";

export const companyDDList = async (req, res) => {
    try {
        const companyData = await companyModel.findAll({
            where: { is_deleted: false },
            order: [['id', 'DESC']],
            attributes: ['id', 'name']
        });
        return ResponseService.success(res, 'success', companyData)

    } catch (error) {
        console.error(error.message);
        return ResponseService.error(error.message);

    }
};

export const roleDDList = async (req, res) => {
    try {
        const { company_id } = req.params;
        if (!company_id) {
            return ResponseService.badRequest(res, 'Valid company id is required');
        }

        const roles = await roleModel.findAll({
            where: { company_id, is_deleted: false, status: true },
            order: [['name', 'ASC']],
            attributes: ['id', 'name'],
        });
        return ResponseService.success(res, 'Success', roles);
    } catch (error) {
        console.error(error.message);
        return ResponseService.error(res, error.message);
    }
};

export const domainDDList = async (req, res) => {
    try {
        const domains = await domainModel.findAll({
            where: { is_deleted: false, status: true },
            order: [['name', 'ASC']],
            attributes: ['id', 'name'],
        });
        return ResponseService.success(res, 'Success', domains);
    } catch (error) {
        console.error(error.message);
        return ResponseService.error(res, error.message);
    }
};

export const moduleDDList = async (req, res) => {
    try {
        const { domain_id } = req.params;
        if (!(domain_id)) {
            return ResponseService.badRequest(res, 'Valid domain id is required');
        }

        const modules = await moduleModel.findAll({
            where: { domain_id, is_deleted: false, status: true },
            order: [['name', 'ASC']],
            attributes: ['id', 'name'],
        });
        return ResponseService.success(res, 'Success', modules);
    } catch (error) {
        console.error(error.message);
        return ResponseService.error(res, error.message);
    }
};


export const userDDList = async (req, res) => {
    try {
        const { company_id } = req.params;
        if (!isUuid(company_id)) {
            return ResponseService.badRequest(res, 'Valid company id is required');
        }

        if (req.companyId && req.companyId !== company_id) {
            return ResponseService.forbidden(res, 'Access denied');
        }

        const users = await userModel.findAll({
            where: { company_id, is_deleted: false, status: true },
            attributes: ['id', 'name', 'role_id'],
            order: [['name', 'ASC']],
            raw: true,
        });
        return ResponseService.success(res, 'Success', users);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};