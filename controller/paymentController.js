import { menuModel } from "../models/menuMasterModel.js";
import { moduleModel } from "../models/moudleModel.js";
import { userModulePaymentModel } from "../models/paymentModel.js";
import { roleMenuMappingModel } from "../models/roleMenuMappingModel.js";
import { roleModel } from "../models/roleModel.js";
import ResponseService from "../utils/httpService.js";

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];

const Dashboard = async (req, res) => {
    try {
        const userId = req.userId;
        const roleId = req.roleId;

        const role = await roleModel.findOne({ where: { id: roleId, is_deleted: false }, raw: true });
        if (!role) return ResponseService.notFound(res, 'Role not found');
        const isAdmin = ADMIN_ROLES.includes(role.name.trim().toLowerCase());

        const modules = await moduleModel.findAll({
            where: { is_deleted: false, is_portal: false },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']],
            raw: true,
        });

        const allMenus = await menuModel.findAll({
            where: { is_deleted: false },
            attributes: ['id', 'module_id'],
            raw: true,
        });
        const totalByModule = new Map();
        for (const m of allMenus) {
            totalByModule.set(m.module_id, (totalByModule.get(m.module_id) || 0) + 1);
        }

        const accessByModule = new Map();
        let paidByModule = new Map();

        if (!isAdmin) {
            const assigned = await roleMenuMappingModel.findAll({ where: { role_id: roleId }, attributes: ['menu_id'], raw: true });
            const assignedIds = new Set(assigned.map((a) => a.menu_id));

            for (const m of allMenus) {
                if (assignedIds.has(m.id)) {
                    accessByModule.set(m.module_id, (accessByModule.get(m.module_id) || 0) + 1);
                }
            }

            const payments = await userModulePaymentModel.findAll({ where: { user_id: userId }, attributes: ['module_id', 'is_paid'], raw: true });
            paidByModule = new Map(payments.map((p) => [p.module_id, p.is_paid]));
        }

        const data = modules.map((m) => {
            if (isAdmin) {
                return { ...m, menu_count: totalByModule.get(m.id) || 0, has_access: true, is_payment: true, state: 'ACCESS_GRANTED', message: null };
            }
            const menu_count = accessByModule.get(m.id) || 0;
            const has_access = menu_count > 0;
            const is_payment = paidByModule.get(m.id) === true;

            let state = 'ACCESS_GRANTED';
            let message = null;
            if (!has_access) {
                state = 'NO_ACCESS';
                message = 'Please get access to at least one menu of this module';
            } else if (!is_payment) {
                state = 'PAYMENT_PENDING';
                message = 'Please complete the payment to use this module';
            }
            return { ...m, menu_count, has_access, is_payment, state, message };
        });

        return ResponseService.success(res, 'Success', { is_admin: isAdmin, modules: data });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Dashboard };