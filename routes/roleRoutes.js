import express from 'express';
import { Create, deleteRole, List, update } from '../controller/roleController.js';

const roleRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Role
 *   description: Role master APIs (company wise)
 */

/**
 * @swagger
 * /api/role/create:
 *   post:
 *     summary: Create a role
 *     tags: [Role]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_id, name]
 *             properties:
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Admin
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error or role already exists
 *       404:
 *         description: Company not found
 */
roleRouter.post('/create', Create);

/**
 * @swagger
 * /api/role/list:
 *   get:
 *     summary: Get roles (optionally of one company)
 *     tags: [Role]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of roles
 */
roleRouter.get('/list', List);

/**
 * @swagger
 * /api/role/update/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Role]
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
 *                 example: Manager
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 */
roleRouter.put('/update/:id', update);

/**
 * @swagger
 * /api/role/delete/{id}:
 *   delete:
 *     summary: Delete a role (soft delete). Blocked if users are still assigned.
 *     tags: [Role]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       409:
 *         description: Role is assigned to users
 */
roleRouter.delete('/delete/:id', deleteRole);

export default roleRouter;
