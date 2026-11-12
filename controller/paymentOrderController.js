import crypto from "crypto";
import Razorpay from "razorpay";
import { sequelize } from "../config/db.config.js";
import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { moduleModel } from "../models/index.js";
import { modulePlanModel } from "../models/modulePlanModel.js";
import { paymentOrderModel } from "../models/paymentOrderModel.js";
import { userModulePaymentModel } from "../models/paymentModel.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

// Step 1: the user picked a plan -> create the Razorpay order. Amount comes from the DB.
const CreateOrder = async (req, res) => {
    try {
        const { plan_id } = req.body;
        if (!isUuid(plan_id)) return ResponseService.badRequest(res, 'Valid plan id is required');

        const plan = await modulePlanModel.findOne({ where: { id: plan_id, status: true, is_deleted: false } });
        if (!plan) return ResponseService.notFound(res, 'Plan not found');

        const module = await moduleModel.findOne({ where: { id: plan.module_id, is_deleted: false }, attributes: ['id', 'name'], raw: true });
        if (!module) return ResponseService.notFound(res, 'Module not found');

        const amountPaise = Math.round(Number(plan.amount) * 100);
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: `m${Date.now()}`.slice(0, 40),
            notes: { user_id: req.userId, module_id: module.id, plan_id: plan.id },
        });

        await paymentOrderModel.create({
            user_id: req.userId,
            module_id: module.id,
            plan_id: plan.id,
            amount: plan.amount,
            currency: 'INR',
            razorpay_order_id: order.id,
        });

        return ResponseService.success(res, 'Order created', {
            key_id: process.env.RAZORPAY_KEY_ID,
            order_id: order.id,
            amount: amountPaise,
            currency: 'INR',
            module_name: module.name,
            plan_type: plan.plan_type,
        });
    } catch (error) {
        console.error('CreateOrder error:', error);
        return ResponseService.error(res, error.message);
    }
};

// Step 2: Razorpay Checkout succeeded -> verify the signature and activate the module.
const Verify = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return ResponseService.badRequest(res, 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required');
        }

        const order = await paymentOrderModel.findOne({ where: { razorpay_order_id, user_id: req.userId } });
        if (!order) return ResponseService.notFound(res, 'Order not found');
        if (order.status === 'PAID') return ResponseService.success(res, 'Payment already verified');

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        const a = Buffer.from(expected);
        const b = Buffer.from(String(razorpay_signature));
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            await order.update({ status: 'FAILED', razorpay_payment_id });
            return ResponseService.badRequest(res, 'Payment verification failed');
        }

        const plan = await modulePlanModel.findByPk(order.plan_id);
        const now = new Date();

        await sequelize.transaction(async (transaction) => {
            await order.update({ status: 'PAID', razorpay_payment_id, paid_at: now }, { transaction });

            const existing = await userModulePaymentModel.findOne({
                where: { user_id: order.user_id, module_id: order.module_id }, transaction,
            });
            // renewing before expiry extends from the current expiry
            const start = existing?.expires_at && new Date(existing.expires_at) > now ? new Date(existing.expires_at) : now;
            const values = { is_paid: true, plan_id: order.plan_id, starts_at: start, expires_at: addDays(start, plan.duration_days) };

            if (existing) await existing.update(values, { transaction });
            else await userModulePaymentModel.create({ user_id: order.user_id, module_id: order.module_id, ...values }, { transaction });
        });

        await logAction({ userId: req.userId, tableName: 'module_payment_order', actionType: 'UPDATE', recordId: order.id, newValues: { status: 'PAID', razorpay_payment_id } });
        return ResponseService.success(res, 'Payment successful. Module activated');
    } catch (error) {
        console.error('Verify error:', error);
        return ResponseService.error(res, error.message);
    }
};

export { CreateOrder, Verify };