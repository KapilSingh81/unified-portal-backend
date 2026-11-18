import { distanceController } from "../controller/distanceController.js";
import {
    idleReportController,
    idleDeviceDetailController,
} from "../controller/idleController.js";
import Auth from "../middleware/auth.js";
import express from "express";

const reportsRoutes = express.Router();

/**
 * @swagger
 * /api/report/distanceReport:
 *   post:
 *     summary: Datewise distance (km) of a user's devices between fromDate and toDate
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
 *                       example: "2026-11-01"
 *                     to:
 *                       type: string
 *                       example: "2026-11-15"
 *                     total_km:
 *                       type: string
 *                       example: "245.38"
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           device_id:
 *                             type: integer
 *                             example: 11
 *                           vehicle_no:
 *                             type: string
 *                             example: HR26DB4373
 *                           total_km:
 *                             type: string
 *                             example: "120.50"
 *                           daily:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 date:
 *                                   type: string
 *                                   example: "2026-11-01"
 *                                 device_id:
 *                                   type: integer
 *                                   example: 11
 *                                 vehicle_no:
 *                                   type: string
 *                                   example: HR26DB4373
 *                                 km:
 *                                   type: string
 *                                   example: "12.40"
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: No device found
 */
reportsRoutes.post("/distanceReport", Auth, distanceController);

/**
 * @swagger
 * /api/report/idleReports:
 *   post:
 *     summary: Idle report summary (ignition ON, speed 0) per device, without child data
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
 *                 example: d20b5f31-6ddc-4345-9405-e19cc5a78697
 *               deviceId:
 *                 description: Optional. Array or comma separated ids. If omitted, all devices of the user are returned.
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [11, 12]
 *               timeDuration:
 *                 description: Minimum idle duration in minutes. Default 0 returns all idle events.
 *                 type: number
 *                 default: 0
 *                 example: 2
 *               fromDate:
 *                 description: "YYYY-MM-DD or YYYY-MM-DD HH:mm"
 *                 type: string
 *                 example: "2026-11-01 05:00"
 *               toDate:
 *                 description: "YYYY-MM-DD or YYYY-MM-DD HH:mm"
 *                 type: string
 *                 example: "2026-11-15 08:00"
 *     responses:
 *       200:
 *         description: Success
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
 *                       example: "2026-11-01 05:00:00"
 *                     to:
 *                       type: string
 *                       example: "2026-11-15 08:00:59"
 *                     time_duration_minutes:
 *                       type: number
 *                       example: 2
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           device_id:
 *                             type: integer
 *                             example: 11
 *                           vehicle_no:
 *                             type: string
 *                             example: HR26DB4373
 *                           total_idle_count:
 *                             type: integer
 *                             example: 33
 *                           total_idle_duration:
 *                             type: string
 *                             example: "00:08:33"
 *       400:
 *         description: Validation error
 *       404:
 *         description: No device found
 *       500:
 *         description: Server error
 */
reportsRoutes.post("/idleReports", Auth, idleReportController);

/**
 * @swagger
 * /api/report/idleDeviceDetail:
 *   post:
 *     summary: Idle events (child data) of one device, paginated, called when a device row is clicked
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, deviceId, fromDate, toDate]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: d20b5f31-6ddc-4345-9405-e19cc5a78697
 *               deviceId:
 *                 description: Exactly one device id.
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [12]
 *               timeDuration:
 *                 description: Minimum idle duration in minutes. Send the same value as the summary call.
 *                 type: number
 *                 default: 0
 *                 example: 0
 *               page:
 *                 description: Page number, starts from 1.
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *               limit:
 *                 description: Events per page (max 200).
 *                 type: integer
 *                 default: 50
 *                 example: 50
 *               fromDate:
 *                 description: "YYYY-MM-DD or YYYY-MM-DD HH:mm"
 *                 type: string
 *                 example: "2026-11-18 10:00:00"
 *               toDate:
 *                 description: "YYYY-MM-DD or YYYY-MM-DD HH:mm"
 *                 type: string
 *                 example: "2026-11-18 12:30:00"
 *     responses:
 *       200:
 *         description: Success
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
 *                       example: "2026-11-18 10:00:00"
 *                     to:
 *                       type: string
 *                       example: "2026-11-18 12:30:59"
 *                     time_duration_minutes:
 *                       type: number
 *                       example: 0
 *                     device_id:
 *                       type: integer
 *                       example: 12
 *                     vehicle_no:
 *                       type: string
 *                       example: DL8CAS3463
 *                     total_idle_count:
 *                       type: integer
 *                       description: Total idle events in the full range (not just this page).
 *                       example: 33
 *                     total_idle_duration:
 *                       type: string
 *                       description: Total idle duration of the full range.
 *                       example: "00:08:33"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 50
 *                         total:
 *                           type: integer
 *                           example: 33
 *                         total_pages:
 *                           type: integer
 *                           example: 1
 *                         has_next:
 *                           type: boolean
 *                           example: false
 *                         has_prev:
 *                           type: boolean
 *                           example: false
 *                     idle:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           from_time:
 *                             type: string
 *                             example: "2026-11-18 10:22:24"
 *                           to_time:
 *                             type: string
 *                             example: "2026-11-18 10:22:58"
 *                           duration:
 *                             type: string
 *                             example: "00:00:34"
 *                           latitude:
 *                             type: number
 *                             example: 28.600715
 *                           longitude:
 *                             type: number
 *                             example: 77.215405
 *                           location:
 *                             type: string
 *                             nullable: true
 *                             example: Connaught Place, New Delhi
 *       400:
 *         description: Validation error (exactly one deviceId is required)
 *       404:
 *         description: No device found
 *       500:
 *         description: Server error
 */
reportsRoutes.post("/idleDeviceDetail", Auth, idleDeviceDetailController);

export default reportsRoutes;