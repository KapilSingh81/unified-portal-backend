import express from 'express';
import { List } from '../controller/logController.js';

const logRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: AllLog
 *   description: Audit log (read only)
 */

/**
 * @swagger
 * /api/log/list:
 *   get:
 *     summary: Audit logs, newest first (paginated)
 *     tags: [AllLog]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *           example: role_permission_mapping
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: record_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: "{ rows, total, page, limit }"
 */
logRouter.get('/list', List);

export default logRouter;
