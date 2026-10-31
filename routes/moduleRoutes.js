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
 *     summary: Get all modules
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
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
 *                         example: 
 *                       status:
 *                         type: boolean
 *                         example: true
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
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
 *     summary: Create a module
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Visitor Management
 *               url:
 *                 type: string
 *                 example: /visitors
 *               icon:
 *                 type: string
 *                 example: 
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Validation error / module already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
moduleRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/module/update/{id}:
 *   put:
 *     summary: Update a module
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Visitor Management
 *               url:
 *                 type: string
 *                 example: /visitors
 *               icon:
 *                 type: string
 *                 example: 
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       400:
 *         description: Validation error / module name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
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