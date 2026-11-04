import express from 'express';
import { Save, List, remove } from '../controller/rolePermissionController.js';
import Auth from '../middleware/auth.js';

const rolePermissionRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: RolePermission
 *   description: Menus assigned to a role with view, add, edit and delete permissions.
 */

/**
 * @swagger
 * /api/role-permission/save:
 *   post:
 *     summary: Replace the full set of menus and permissions of a role (permissions [] removes all)
 *     description: >
 *       Menu mapping and its access are saved together. If a menu is sent without any flag,
 *       can_view defaults to true. can_add, can_edit or can_delete true forces can_view true.
 *     tags: [RolePermission]
 *     security:
 *       - bearerAuth: []
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
 *                       default: false
 *                     can_add:
 *                       type: boolean
 *                       default: false
 *                     can_edit:
 *                       type: boolean
 *                       default: false
 *                     can_delete:
 *                       type: boolean
 *                       default: false
 *     responses:
 *       200:
 *         description: Role permissions saved successfully
 *       400:
 *         description: Invalid role id, invalid menus or invalid flag values
 *       404:
 *         description: Role not found
 */
rolePermissionRouter.post('/save', Auth, Save);

/**
 * @swagger
 * /api/role-permission/list:
 *   get:
 *     summary: All menus with module name; checked is true for menus assigned to the role
 *     tags: [RolePermission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: All menus with checked and permission flags for the role
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
 *                       name:
 *                         type: string
 *                         example: Users
 *                       url:
 *                         type: string
 *                         nullable: true
 *                       icon:
 *                         type: string
 *                         nullable: true
 *                       module_id:
 *                         type: string
 *                         format: uuid
 *                       module_name:
 *                         type: string
 *                         example: Master
 *                       parent_menu_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       checked:
 *                         type: boolean
 *                       permission_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       can_view:
 *                         type: boolean
 *                       can_add:
 *                         type: boolean
 *                       can_edit:
 *                         type: boolean
 *                       can_delete:
 *                         type: boolean
 *                       all_access:
 *                         type: boolean
 *                         description: true when view, add, edit and delete are all true
 *       400:
 *         description: Valid role id is required
 */
rolePermissionRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/role-permission/{id}:
 *   delete:
 *     summary: Remove one role permission mapping by its id (permission_id from the list API)
 *     tags: [RolePermission]
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
 *         description: Permission mapping removed successfully
 *       400:
 *         description: Valid id is required
 *       404:
 *         description: Permission mapping not found
 */
rolePermissionRouter.delete('/:id', Auth, remove);

export default rolePermissionRouter;