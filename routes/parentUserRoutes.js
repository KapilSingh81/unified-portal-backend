import express from 'express';
import { Create, List, remove } from '../controller/parentUserController.js';

const parentUserRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: ParentUserMapping
 *   description: User hierarchy (parent -> child)
 */

/**
 * @swagger
 * /api/parent-user/create:
 *   post:
 *     summary: Link a child user under a parent user (same company, no loops)
 *     tags: [ParentUserMapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parent_user_id, child_user_id]
 *             properties:
 *               parent_user_id:
 *                 type: string
 *                 format: uuid
 *               child_user_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Mapping created successfully
 *       409:
 *         description: Mapping already exists
 */
parentUserRouter.post('/create', Create);

/**
 * @swagger
 * /api/parent-user/list:
 *   get:
 *     summary: Children of a parent, or parents of a child (one of the two ids is required)
 *     tags: [ParentUserMapping]
 *     parameters:
 *       - in: query
 *         name: parent_user_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: child_user_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of mappings with parent and child users
 */
parentUserRouter.get('/list', List);

/**
 * @swagger
 * /api/parent-user/delete/{id}:
 *   delete:
 *     summary: Remove a mapping
 *     tags: [ParentUserMapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mapping removed successfully
 *       404:
 *         description: Mapping not found
 */
parentUserRouter.delete('/delete/:id', remove);

export default parentUserRouter;
