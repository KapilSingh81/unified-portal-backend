import express from 'express';
import { Create, deleteModule, List, update } from '../controller/moudleController.js';
import Auth from '../middleware/auth.js';

const moduleRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Module
 *   description: Module master APIs
 */

/**
 * @swagger
 * /api/module/list:
 *   get:
 *     summary: Get all modules (optionally filter by domain_id or is_portal)
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: domain_id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_portal
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of modules
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 7a9c2e41-5b3d-4f8a-9e6c-2d1b0a3c4e5f
 *                       domain_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: Visitor Management
 *                       url:
 *                         type: string
 *                         nullable: true
 *                         example: /visitors
 *                       icon:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: boolean
 *                         example: true
 *                       is_portal:
 *                         type: boolean
 *                         example: false
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
 *       400:
 *         description: Invalid domain id or is_portal
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       500:
 *         description: Server error
 */
moduleRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/module/create:
 *   post:
 *     summary: Create a module (domain_id is required)
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, domain_id]
 *             properties:
 *               domain_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Visitor Management
 *               url:
 *                 type: string
 *                 example: /visitors
 *               icon:
 *                 type: string
 *               status:
 *                 type: boolean
 *                 example: true
 *               is_portal:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Validation error / module already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Domain not found
 *       500:
 *         description: Server error
 */
moduleRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/module/update/{id}:
 *   put:
 *     summary: Update a module (domain_id is required)
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, domain_id]
 *             properties:
 *               domain_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Visitor Management
 *               url:
 *                 type: string
 *                 example: /visitors
 *               icon:
 *                 type: string
 *               status:
 *                 type: boolean
 *                 example: true
 *               is_portal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       400:
 *         description: Validation error / module name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module or domain not found
 *       500:
 *         description: Server error
 */
moduleRouter.put('/update/:id', Auth, update);

/**
 * @swagger
 * /api/module/delete/{id}:
 *   delete:
 *     summary: Delete a module (soft delete). Blocked if it has menus.
 *     tags: [Module]
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
 *         description: Module deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 *       409:
 *         description: Module has menus
 *       500:
 *         description: Server error
 */
moduleRouter.delete('/delete/:id', Auth, deleteModule);

export default moduleRouter;