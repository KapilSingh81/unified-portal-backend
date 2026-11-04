import express from 'express';
import Auth from '../middleware/auth.js';
import { Dashboard } from '../controller/paymentController.js';

const dashboardRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data for the logged-in user.
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: All modules with access and payment state for the logged-in user
 *     description: >
 *       Admin and super admin get every module with ACCESS_GRANTED.
 *       Other roles get every module too, with a state per module:
 *       NO_ACCESS (no menu assigned to the role in that module),
 *       PAYMENT_PENDING (menu access exists but the module is not paid for the user),
 *       or ACCESS_GRANTED (menu access exists and payment is done).
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modules with access state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_admin:
 *                       type: boolean
 *                       example: false
 *                     modules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: Reports
 *                           menu_count:
 *                             type: integer
 *                             nullable: true
 *                             example: 3
 *                           has_access:
 *                             type: boolean
 *                             example: true
 *                           is_payment:
 *                             type: boolean
 *                             example: false
 *                           state:
 *                             type: string
 *                             enum: [NO_ACCESS, PAYMENT_PENDING, ACCESS_GRANTED]
 *                             example: PAYMENT_PENDING
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: Please complete the payment to use this module
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
dashboardRouter.get('/', Auth, Dashboard);

export default dashboardRouter;