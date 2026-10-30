import express from 'express';
import { Assign, List } from '../controller/roleMenuController.js';

const roleMenuRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: RoleMenuMapping
 *   description: Menus accessible to the role.
 */

/**
 * @swagger
 * /api/role-menu/assign:
 *   post:
 *     summary: Replace the full set of menus of a role (menu_ids [] removes all)
 *     tags: [RoleMenuMapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_id, menu_ids]
 *             properties:
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               menu_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Role menus updated successfully
 *       400:
 *         description: Invalid menus or menus of another company
 *       404:
 *         description: Role not found
 */
roleMenuRouter.post('/assign', Assign);

/**
 * @swagger
 * /api/role-menu/list:
 *   get:
 *     summary: Menus assigned to a role
 *     tags: [RoleMenuMapping]
 *     parameters:
 *       - in: query
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of role-menu mappings with menu details
 */
roleMenuRouter.get('/list', List);

export default roleMenuRouter;
