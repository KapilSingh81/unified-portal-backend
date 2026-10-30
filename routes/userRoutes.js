import express from 'express';
import { Create, deleteUser, GetById, List, update } from '../controller/userController.js';

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User master APIs
 */

/**
 * @swagger
 * /api/user/create:
 *   post:
 *     summary: Create a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_id, role_id, user_name, password]
 *             properties:
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               user_name:
 *                 type: string
 *                 example: kapil
 *               password:
 *                 type: string
 *                 example: Secret@123
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 *       404:
 *         description: Company or role not found
 */
userRouter.post('/create', Create);

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Get users (filter by company_id and/or role_id)
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of users with role and company
 */
userRouter.get('/list', List);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get a single user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
userRouter.get('/:id', GetById);

/**
 * @swagger
 * /api/user/update/{id}:
 *   put:
 *     summary: Update a user (send only the fields to change)
 *     tags: [User]
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
 *             properties:
 *               user_name:
 *                 type: string
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               password:
 *                 type: string
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
userRouter.put('/update/:id', update);

/**
 * @swagger
 * /api/user/delete/{id}:
 *   delete:
 *     summary: Delete a user (soft delete) and remove its parent/child links
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
userRouter.delete('/delete/:id', deleteUser);

export default userRouter;
