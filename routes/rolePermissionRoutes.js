import express from 'express';
import { List, remove, Save } from '../controller/rolePermissionController.js';

const rolePermissionRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: RolePermissionMapping
 *   description: Role + Menu ke liye can_view / can_edit / can_delete (true/false)
 */

/**
 * @swagger
 * /api/role-permission/save:
 *   post:
 *     summary: Bulk save (upsert) permissions of a role. Missing flag = false.
 *     tags: [RolePermissionMapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_id, permissions]
 *             properties:
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [menu_id]
 *                   properties:
 *                     menu_id:
 *                       type: string
 *                       format: uuid
 *                     can_view:
 *                       type: boolean
 *                       example: true
 *                     can_edit:
 *                       type: boolean
 *                       example: false
 *                     can_delete:
 *                       type: boolean
 *                       example: false
 *     responses:
 *       200:
 *         description: Permissions saved successfully
 *       400:
 *         description: Invalid menus, or flags are not boolean
 *       404:
 *         description: Role not found
 */
rolePermissionRouter.post('/save', Save);

/**
 * @swagger
 * /api/role-permission/list:
 *   get:
 *     summary: Permissions of a role (with menu details)
 *     tags: [RolePermissionMapping]
 *     parameters:
 *       - in: query
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of role-permission mappings
 */
rolePermissionRouter.get('/list', List);

/**
 * @swagger
 * /api/role-permission/delete/{id}:
 *   delete:
 *     summary: Remove one permission mapping row
 *     tags: [RolePermissionMapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permission mapping removed successfully
 *       404:
 *         description: Permission mapping not found
 */
rolePermissionRouter.delete('/delete/:id', remove);

export default rolePermissionRouter;
