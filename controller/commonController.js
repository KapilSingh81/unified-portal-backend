import { literal, Op } from "sequelize";
import { companyModel } from "../models/companyModel.js";
import { customerDeviceModel } from "../models/customerDeviceModel.js";
import { domainModel } from "../models/domainModel.js";
import { moduleModel } from "../models/moudleModel.js";
import { roleModel } from "../models/roleModel.js";
import { userModel } from "../models/userModel.js";
import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";
import { parseDateTime } from "../utils/helper.js";
import { tableEventDataLogModel } from "../models/tableEventDataLogModel.js";

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
            return res.status(403).json({ success: false, message: 'Access denied', errors: 403 });
        }

        const users = await userModel.findAll({
            where: { company_id, is_deleted: false, status: true },
            attributes: ['id', 'user_name', 'role_id'],
            order: [['user_name', 'ASC']],
            raw: true,
        });

        return ResponseService.success(res, 'Success', users);
    } catch (error) {
        const dbMessages = error.original?.errors?.map((e) => e.message);
        console.error('userDDList error:', dbMessages ?? error.message);
        return ResponseService.error(res, dbMessages?.join(' | ') ?? error.message);
    }
};

export const customerDeviceDDLList = async (req, res) => {
    try {
        const { userId, roleId } = req;
        const isAdmin = await roleModel.findOne({
            where: { id: roleId, is_deleted: false },
            attributes: ['name'],
            raw: true,
        })
        let targetUserId;
        if (isAdmin) {
            targetUserId = req.query.user_id;
            if (!targetUserId) {
                return ResponseService.success(res, 'Success', []);
            }
        } else {
            targetUserId = userId;
        };
        const devices = await customerDeviceModel.findAll({
            attributes: ['id', 'vehicle_no'],
            where: { CentralUserId: targetUserId },
            order: [['id', 'ASC']],
            raw: true,
        });

        return ResponseService.success(res, 'Success', devices);
    } catch (error) {
        const dbMessages = error.original?.errors?.map((e) => e.message);
        console.error('customerDeviceDDLList error:', dbMessages ?? error.message);
        return ResponseService.error(res, dbMessages?.join(' | ') ?? error.message);
    }
};

export const parentDDLList = async (req, res) => {
    try {
        const { company_id } = req.query;
        const childWhere = { is_deleted: false, parentId: { [Op.ne]: null } };
        if (company_id) {
            if (!isUuid(company_id)) return ResponseService.badRequest(res, 'Invalid company id');
            childWhere.company_id = company_id;
        }

        const rows = await userModel.findAll({
            where: childWhere,
            attributes: ['parentId'],
            group: ['parentId'],
            raw: true,
        });
        const parentIds = rows.map((r) => r.parentId);

        if (!parentIds.length) return ResponseService.success(res, 'Success', []);

        const parents = await userModel.findAll({
            where: { id: { [Op.in]: parentIds }, is_deleted: false },
            attributes: ['id', 'first_name', 'last_name', 'user_name'],
            order: [['first_name', 'ASC'], ['user_name', 'ASC']],
        });

        const data = parents.map((p) => ({
            id: p.id,
            name: [p.first_name, p.last_name].filter(Boolean).join(' '),
            user_name: p.user_name,
        }));
        return ResponseService.success(res, 'Success', data);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export const parseCommon = (body) => {
    const { userId, fromDate, toDate, timeDuration } = body;

    if (!userId) return { error: ["userId is required", 400] };
    if (!fromDate || !toDate) {
        return { error: ["fromDate and toDate are required", 400] };
    }

    const fromStr = parseDateTime(fromDate, false);
    const toStr = parseDateTime(toDate, true);
    if (!fromStr || !toStr) {
        return { error: ["Date format must be YYYY-MM-DD or YYYY-MM-DD HH:mm", 400] };
    }
    if (fromStr > toStr) return { error: ["Invalid date range", 400] };

    const minMinutes =
        timeDuration === undefined || timeDuration === null || timeDuration === ""
            ? 0
            : Number(timeDuration);
    if (!Number.isFinite(minMinutes) || minMinutes < 0) {
        return { error: ["Invalid timeDuration", 400] };
    }

    return { userId, fromStr, toStr, minMinutes, minSeconds: minMinutes * 60 };
};

// ---- Parse deviceId (array / "1,2" / single) ----
export const parseDeviceIds = (deviceId) => {
    const raw = Array.isArray(deviceId)
        ? deviceId
        : deviceId !== undefined && deviceId !== null && deviceId !== ""
            ? String(deviceId).split(",")
            : [];

    const ids = [...new Set(raw.map((id) => Number(String(id).trim())))];
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return null;
    return ids;
};

// ---- Fetch raw points, grouped by device ----
export const fetchPointsByDevice = async (deviceIds, fromStr, toStr, withLocation) => {
    const rows = await tableEventDataLogModel.findAll({
        attributes: [
            "fk_device_id",
            "latitude",
            "longitude",
            ...(withLocation ? ["location"] : []),
            "speed",
            "di1",
            [literal("CONVERT(varchar(19), time_stamp, 120)"), "time"],
        ],
        where: {
            fk_device_id: { [Op.in]: deviceIds },
            time_stamp: {
                [Op.gte]: literal(`CONVERT(datetime, '${fromStr}.000', 121)`),
                [Op.lte]: literal(`CONVERT(datetime, '${toStr}.997', 121)`),
            },
        },
        order: [
            ["fk_device_id", "ASC"],
            ["time_stamp", "ASC"],
        ],
        raw: true,
    });

    const byDevice = {};
    for (const r of rows) {
        (byDevice[Number(r.fk_device_id)] ??= []).push(r);
    }
    return byDevice;
};