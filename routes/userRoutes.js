import express from 'express';
import { Create, deleteUser, GetById, List, update } from '../controller/userController.js';
import Auth from '../middleware/auth.js';

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
 *     description: >
 *       Admin can always create users. A non-admin can create users only if
 *       is_subchild_create is true for them. The new user's parentId is always
 *       the logged-in creator, and a non-admin creator can only assign the User role
 *       inside their own company.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_id, role_id, user_name, password, firstName, email]
 *             properties:
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               user_name:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Test@123
 *               firstName:
 *                 type: string
 *                 example: Test
 *               lastName:
 *                 type: string
 *                 example: User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testuser@example.com
 *               contact:
 *                 type: string
 *                 example: "9000000000"
 *               status:
 *                 type: boolean
 *                 default: true
 *               is_subchild_create:
 *                 type: boolean
 *                 default: false
 *                 description: If true, the new user can create their own sub-users
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error, user name already exists or email already exists
 *       403:
 *         description: Not allowed to create users, wrong company, or role other than User
 *       404:
 *         description: Creator, company or role not found
 */
userRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Get users (filter by company_id and/or role_id)
 *     description: Admin sees all users. A non-admin sees only their own sub-users (children, grandchildren and so on).
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *       400:
 *         description: Invalid company id or role id
 */
userRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get a single user
 *     description: Allowed for admin, for the user themselves, or for a user in their parent chain.
 *     tags: [User]
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
 *         description: User details
 *       400:
 *         description: Valid user id is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
userRouter.get('/:id', Auth, GetById);

/**
 * @swagger
 * /api/user/update/{id}:
 *   put:
 *     summary: Update a user (send only the fields to change)
 *     description: >
 *       Admin can update any user. A non-admin can update only users in their own
 *       sub-tree and can assign only the User role. Changing the role removes the
 *       user's user-level permission overrides, so the new role's permissions apply.
 *       is_subchild_create can be changed only by admin or by the user's direct
 *       parent (who must have the permission themselves).
 *     tags: [User]
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
 *             properties:
 *               user_name:
 *                 type: string
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               contact:
 *                 type: string
 *               status:
 *                 type: boolean
 *               is_subchild_create:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error, user name already exists or email already exists
 *       403:
 *         description: Access denied, or not allowed to change role or is_subchild_create
 *       404:
 *         description: User or role not found
 */
userRouter.put('/update/:id', Auth, update);

/**
 * @swagger
 * /api/user/delete/{id}:
 *   delete:
 *     summary: Delete a user (soft delete)
 *     description: >
 *       Admin can delete any user. A non-admin can delete only users in their own sub-tree.
 *       The user's direct children are moved to the deleted user's parent, and their
 *       parent/child links and permission overrides are removed.
 *     tags: [User]
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
 *         description: User deleted successfully
 *       400:
 *         description: Valid user id is required, or trying to delete yourself
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
userRouter.delete('/delete/:id', Auth, deleteUser);

export default userRouter;