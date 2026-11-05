import express from 'express';
import Auth from '../middleware/auth.js';
import { List, remove, Save } from '../controller/userPermissionController.js';

const userPermissionRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserPermission
 *   description: User-wise menu permissions. Role permissions apply by default; admin overrides are saved per user under the user's current role.
 */

/**
 * @swagger
 * /api/user-permission/save:
 *   post:
 *     summary: Replace the user-level menu permissions of a user (permissions [] falls back to the role)
 *     description: >
 *       Saves the admin's decision for a user. Rows are stored with the user's current role_id.
 *       Menus not sent here follow the role permission. A menu sent with all flags false is blocked for this user.
 *       can_add, can_edit or can_delete true forces can_view true.
 *     tags: [UserPermission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, permissions]
 *             properties:
 *               user_id:
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
 *         description: User permissions saved successfully
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
 *                   example: User permissions saved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     role_id:
 *                       type: string
 *                       format: uuid
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           menu_id:
 *                             type: string
 *                             format: uuid
 *                           can_view:
 *                             type: boolean
 *                           can_add:
 *                             type: boolean
 *                           can_edit:
 *                             type: boolean
 *                           can_delete:
 *                             type: boolean
 *       400:
 *         description: Invalid user id, invalid menus or invalid flag values
 *       404:
 *         description: User not found
 */
userPermissionRouter.post('/save', Auth, Save);

/**
 * @swagger
 * /api/user-permission/list:
 *   get:
 *     summary: All menus with the user's effective permissions (source is user, role or none)
 *     description: >
 *       Returns every menu with the permission the user currently gets.
 *       source "role" means inherited from the role, "user" means the admin changed it for this user,
 *       "none" means no permission. permission_id is set only when source is "user" and is used by the delete API.
 *     tags: [UserPermission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menus with checked, source and permission flags
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
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     role_id:
 *                       type: string
 *                       format: uuid
 *                     menus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: Users
 *                           url:
 *                             type: string
 *                             nullable: true
 *                           icon:
 *                             type: string
 *                             nullable: true
 *                           module_id:
 *                             type: string
 *                             format: uuid
 *                           module_name:
 *                             type: string
 *                             example: Master
 *                           parent_menu_id:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           checked:
 *                             type: boolean
 *                           source:
 *                             type: string
 *                             enum: [user, role, none]
 *                             example: role
 *                           permission_id:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           can_view:
 *                             type: boolean
 *                           can_add:
 *                             type: boolean
 *                           can_edit:
 *                             type: boolean
 *                           can_delete:
 *                             type: boolean
 *                           all_access:
 *                             type: boolean
 *                             description: true when view, add, edit and delete are all true
 *       400:
 *         description: Valid user id is required
 *       404:
 *         description: User not found
 */
userPermissionRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/user-permission/{id}:
 *   delete:
 *     summary: Remove one user override by permission_id (menu falls back to the role permission)
 *     tags: [UserPermission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: permission_id from the list API
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User permission removed successfully
 *       400:
 *         description: Valid id is required
 *       404:
 *         description: Permission mapping not found
 */
userPermissionRouter.delete('/:id', Auth, remove);

export default userPermissionRouter;