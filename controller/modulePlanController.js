import ResponseService from "../utils/httpService.js";
import { isUuid, isBool } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { roleModel, moduleModel } from "../models/index.js";
import { modulePlanModel, PLAN_TYPES } from "../models/modulePlanModel.js";

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];
const ALLOWED_TYPES = [...Object.keys(PLAN_TYPES), 'CUSTOM'];

const isAdminRole = async (roleId) => {
    const role = await roleModel.findOne({ where: { id: roleId, is_deleted: false }, raw: true });
    return !!role && ADMIN_ROLES.includes(role.name.trim().toLowerCase());
};

// keeps MONTHLY..YEARLY in order and puts CUSTOM last
const sortPlans = (plans) =>
    [...plans].sort((a, b) => {
        if (a.plan_type === 'CUSTOM') return 1;
        if (b.plan_type === 'CUSTOM') return -1;
        return a.duration_days - b.duration_days;
    });

// Admin: create or update the plans (amounts) of a module.
const Save = async (req, res) => {
    try {
        if (!(await isAdminRole(req.roleId))) {
            return res.status(403).json({ success: false, message: 'Access denied', errors: 403 });
        }

        const { module_id, plans } = req.body;
        if (!isUuid(module_id)) return ResponseService.badRequest(res, 'Valid module id is required');
        if (!Array.isArray(plans) || !plans.length) {
            return ResponseService.badRequest(res, 'plans must be a non-empty array');
        }

        const module = await moduleModel.findOne({ where: { id: module_id, is_deleted: false } });
        if (!module) return ResponseService.notFound(res, 'Module not found');

        const rows = new Map();
        for (const p of plans) {
            const type = String(p?.plan_type ?? '').toUpperCase();
            if (!ALLOWED_TYPES.includes(type)) {
                return ResponseService.badRequest(res, `plan_type must be one of ${ALLOWED_TYPES.join(', ')}`);
            }
            const amount = Number(p.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return ResponseService.badRequest(res, 'amount must be greater than 0');
            }
            if (p.status !== undefined && !isBool(p.status)) {
                return ResponseService.badRequest(res, 'status must be true or false');
            }

            // CUSTOM: amount is the rate per day, dates are chosen when the user buys
            const days = type === 'CUSTOM' ? 1 : PLAN_TYPES[type];
            rows.set(type, { plan_type: type, duration_days: days, amount: amount.toFixed(2), status: p.status ?? true });
        }

        for (const r of rows.values()) {
            const found = await modulePlanModel.findOne({ where: { module_id, plan_type: r.plan_type, is_deleted: false } });
            if (found) await found.update(r);
            else await modulePlanModel.create({ module_id, ...r });
        }

        await logAction({
            userId: req.userId, tableName: 'module_plan', actionType: 'UPDATE',
            recordId: module_id, newValues: [...rows.values()],
        });
        const saved = await modulePlanModel.findAll({ where: { module_id, is_deleted: false }, raw: true });
        return ResponseService.success(res, 'Plans saved successfully', sortPlans(saved));
    } catch (error) {
        console.error('ModulePlan Save error:', error);
        return ResponseService.error(res, error.message);
    }
};

// Any logged-in user: active plans of a module (shown when the module is clicked).
const List = async (req, res) => {
    try {
        const { module_id } = req.query;
        if (!isUuid(module_id)) return ResponseService.badRequest(res, 'Valid module id is required');

        const module = await moduleModel.findOne({
            where: { id: module_id, is_deleted: false }, attributes: ['id', 'name'], raw: true,
        });
        if (!module) return ResponseService.notFound(res, 'Module not found');

        const plans = await modulePlanModel.findAll({
            where: { module_id, status: true, is_deleted: false },
            attributes: ['id', 'plan_type', 'duration_days', 'amount'],
            raw: true,
        });

        const data = sortPlans(plans).map((p) => ({
            ...p,
            is_custom: p.plan_type === 'CUSTOM',
            per_day: p.plan_type === 'CUSTOM',   // for CUSTOM, amount is per day
        }));
        return ResponseService.success(res, 'Success', { module, plans: data });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// Admin: remove one plan (soft delete).
const remove = async (req, res) => {
    try {
        if (!(await isAdminRole(req.roleId))) {
            return res.status(403).json({ success: false, message: 'Access denied', errors: 403 });
        }
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid plan id is required');

        const plan = await modulePlanModel.findOne({ where: { id, is_deleted: false } });
        if (!plan) return ResponseService.notFound(res, 'Plan not found');

        const oldValues = plan.toJSON();
        await plan.update({ is_deleted: true });
        await logAction({ userId: req.userId, tableName: 'module_plan', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'Plan removed successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Save, List, remove };