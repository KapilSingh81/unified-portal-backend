import { menuModel } from "../models/menuMasterModel.js";
import { moduleModel } from "../models/moudleModel.js";
import { userModulePaymentModel } from "../models/paymentModel.js";
import { roleModel } from "../models/roleModel.js";
import ResponseService from "../utils/httpService.js";
import { FLAGS, getEffectivePermissions } from "../utils/permission.js";

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];

const Dashboard = async (req, res) => {
    try {
        const userId = req.userId;
        const roleId = req.roleId;
        const now = new Date();

        const role = await roleModel.findOne({ where: { id: roleId, is_deleted: false }, raw: true });
        if (!role) return ResponseService.notFound(res, 'Role not found');
        const isAdmin = ADMIN_ROLES.includes(role.name.trim().toLowerCase());

        const modules = await moduleModel.findAll({
            where: { is_deleted: false, is_portal: false },
            attributes: ['id', 'domain_id', 'name', 'url', 'icon'],
            order: [['name', 'ASC']],
            raw: true,
        });
        const moduleIds = modules.map((m) => m.id);

        const allMenus = moduleIds.length
            ? await menuModel.findAll({
                where: { is_deleted: false, module_id: moduleIds },
                attributes: ['id', 'module_id'],
                raw: true,
            })
            : [];

        const totalByModule = new Map();
        for (const m of allMenus) {
            totalByModule.set(m.module_id, (totalByModule.get(m.module_id) || 0) + 1);
        }

        const accessByModule = new Map();
        const paymentByModule = new Map();

        if (!isAdmin) {
            const effective = await getEffectivePermissions(userId, roleId);
            for (const m of allMenus) {
                const p = effective.get(m.id);
                if (p && FLAGS.some((f) => p[f])) {
                    accessByModule.set(m.module_id, (accessByModule.get(m.module_id) || 0) + 1);
                }
            }

            const payments = await userModulePaymentModel.findAll({
                where: { user_id: userId },
                attributes: ['module_id', 'is_paid', 'starts_at', 'expires_at'],
                raw: true,
            });

            for (const p of payments) {
                const expiresAt = p.expires_at ? new Date(p.expires_at) : null;
                const notExpired = !expiresAt || expiresAt > now;
                const paid = !!p.is_paid;

                const entry = {
                    active: paid && notExpired, 
                    paid,
                    starts_at: p.starts_at ?? null,
                    expires_at: p.expires_at ?? null,
                };

                const prev = paymentByModule.get(p.module_id);
                if (
                    !prev ||
                    (entry.active && !prev.active) ||
                    (entry.active === prev.active &&
                        new Date(entry.expires_at || 0) > new Date(prev.expires_at || 0))
                ) {
                    paymentByModule.set(p.module_id, entry);
                }
            }
        }

        const data = modules.map((m) => {
            const total_menus = totalByModule.get(m.id) || 0;

            if (isAdmin) {
                return {
                    ...m, menu_count: total_menus, total_menus,
                    has_access: true, is_payment: true, expires_at: null,
                    state: 'ACCESS_GRANTED', message: null,
                };
            }

            const menu_count = accessByModule.get(m.id) || 0;
            const has_access = menu_count > 0;
            const pay = paymentByModule.get(m.id);
            const is_payment = pay?.active === true;

            let state = 'ACCESS_GRANTED';
            let message = null;
            if (!has_access) {
                state = 'NO_ACCESS';
                message = 'Please get access to at least one menu of this module';
            } else if (!is_payment) {
                state = 'PAYMENT_PENDING';
                message = 'Please complete the payment to use this module';
            }

            return {
                ...m, menu_count, total_menus, has_access, is_payment,
                expires_at: is_payment ? pay.expires_at : null,
                state, message,
            };
        });

        const summary = {
            total_modules: data.length,
            accessible_modules: data.filter((d) => d.state === 'ACCESS_GRANTED').length,
            accessible_menus: data.reduce((sum, d) => sum + d.menu_count, 0),
        };

        return ResponseService.success(res, 'Success', { is_admin: isAdmin, summary, modules: data });
    } catch (error) {
        const dbMessages = error.original?.errors?.map((e) => e.message);
        console.error('Dashboard error:', dbMessages ?? error);
        return ResponseService.error(res, dbMessages?.join(' | ') || error.message || 'Server error');
    }
};

export { Dashboard };