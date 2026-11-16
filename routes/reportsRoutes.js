import { distanceController } from "../controller/distanceController.js";
import Auth from "../middleware/auth.js";
import express from 'express';

const reportsRoutes = express.Router();


/**
 * @swagger
 * /api/report/distanceReport:
 *   post:
 *     summary: Total distance (km) of a user's devices between fromDate and toDate
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, fromDate, toDate]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Central user id whose devices are used
 *               deviceId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: >
 *                   Optional. Array of device ids to calculate. A single id (12)
 *                   or a comma-separated string ("11,12") is also accepted.
 *                   If omitted or empty, all devices of the user are used.
 *                 example: [11, 12]
 *               fromDate:
 *                 type: string
 *                 example: "2026-11-01"
 *               toDate:
 *                 type: string
 *                 example: "2026-11-15"
 *     responses:
 *       200:
 *         description: Distance summary
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
 *                     from:
 *                       type: string
 *                     to:
 *                       type: string
 *                     total_km:
 *                       type: number
 *                       example: 245.38
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           device_id:
 *                             type: integer
 *                           vehicle_no:
 *                             type: string
 *                           total_km:
 *                             type: number
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           device_id:
 *                             type: integer
 *                           vehicle_no:
 *                             type: string
 *                           date:
 *                             type: string
 *                           fromTime:
 *                             type: string
 *                             format: date-time
 *                           toTime:
 *                             type: string
 *                             format: date-time
 *                           distance_km:
 *                             type: number
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: No device found
 */
reportsRoutes.post("/distanceReport", Auth, distanceController);

export default reportsRoutes;