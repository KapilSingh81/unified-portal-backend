import express from 'express';
import { Save, List, remove } from '../controller/modulePlanController.js';
import Auth from '../middleware/auth.js';

const modulePlanRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: ModulePlan
 *   description: Module wise payment plans
 */

/**
 * @swagger
 * /api/module-plan/save:
 *   post:
 *     summary: Admin - create or update the plans and amounts of a module
 *     tags: [ModulePlan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module_id, plans]
 *             properties:
 *               module_id:
 *                 type: string
 *                 format: uuid
 *               plans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [plan_type, amount]
 *                   properties:
 *                     plan_type:
 *                       type: string
 *                       enum: [MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM]
 *                     amount:
 *                       type: number
 *                       example: 999
 *                     duration_days:
 *                       type: integer
 *                       description: Required only for CUSTOM
 *                     status:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Plans saved successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Module not found
 */
modulePlanRouter.post('/save', Auth, Save);

/**
 * @swagger
 * /api/module-plan/list:
 *   get:
 *     summary: Active plans and amounts of a module
 *     tags: [ModulePlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Module with its plans (id, plan_type, duration_days, amount)
 *       400:
 *         description: Valid module id is required
 *       404:
 *         description: Module not found
 */
modulePlanRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/module-plan/delete/{id}:
 *   delete:
 *     summary: Admin - remove one plan (soft delete)
 *     tags: [ModulePlan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plan removed successfully
 *       400:
 *         description: Valid plan id is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Plan not found
 */
modulePlanRouter.delete('/delete/:id', Auth, remove);

export default modulePlanRouter;