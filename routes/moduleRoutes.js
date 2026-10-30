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
 *     summary: Get all modules of logged-in user's company (optionally filtered by domain)
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: domain_id
 *         required: false
 *         description: Filter modules of a single domain
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
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
 *                         example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
 *                       name:
 *                         type: string
 *                         example: Visitor Management
 *                       url:
 *                         type: string
 *                         nullable: true
 *                         example: /visitors
 *                       status:
 *                         type: boolean
 *                         example: true
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
 *                       domain:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
 *                           name:
 *                             type: string
 *                             example: Wave Corp Portal
 *                           company_id:
 *                             type: string
 *                             format: uuid
 *                             example: 9b1d4a7c-2e3f-4c5a-8d6b-1f0e9a8b7c6d
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       500:
 *         description: Server error
 */
moduleRouter.get('/list',Auth,  List);

/**
 * @swagger
 * /api/module/create:
 *   post:
 *     summary: Create a module under a domain
 *     tags: [Module]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [domain_id, name]
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
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Module created successfully
 *       404:
 *         description: Domain not found
 */
moduleRouter.post('/create',Auth, Create);

/**
 * @swagger
 * /api/module/update/{id}:
 *   put:
 *     summary: Update a module
 *     tags: [Module]
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
 *               url:
 *                 type: string
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       404:
 *         description: Module not found
 */
moduleRouter.put('/update/:id',Auth, update);

/**
 * @swagger
 * /api/module/delete/{id}:
 *   delete:
 *     summary: Delete a module (soft delete). Blocked if it has menus.
 *     tags: [Module]
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
 *       409:
 *         description: Module has menus
 */
moduleRouter.delete('/delete/:id',Auth, deleteModule);

export default moduleRouter;