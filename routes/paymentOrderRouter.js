import express from 'express';
import Auth from '../middleware/auth.js';
import { CreateOrder, Verify } from '../controller/paymentOrderController.js';

const paymentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Razorpay module payments
 */

/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     summary: Create a Razorpay order for the selected plan
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: key_id, order_id, amount (paise), currency to open Razorpay Checkout
 *       400:
 *         description: Valid plan id is required
 *       404:
 *         description: Plan or module not found
 */
paymentRouter.post('/create-order', Auth, CreateOrder);

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Verify the Razorpay payment signature and activate the module
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful. Module activated
 *       400:
 *         description: Verification failed
 *       404:
 *         description: Order not found
 */
paymentRouter.post('/verify', Auth, Verify);

export default paymentRouter;