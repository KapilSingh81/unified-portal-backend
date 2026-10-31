import express from 'express';
import { Create, deleteMenu, List, update } from '../controller/menuController.js';
import Auth from '../middleware/auth.js';

const menuRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: APIs for managing menus of a module
 */

/**
 * @swagger
 * /api/menu/create:
 *   post:
 *     summary: Create a menu
 *     tags: [Menu]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module_id, name]
 *             properties:
 *               module_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Visitor List
 *               url:
 *                 type: string
 *                 example: /visitors/list
 *               icon:
 *                 type: string
 *                 example: fa-users
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Menu created successfully
 *       404:
 *         description: Module not found
 */
menuRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/menu/list:
 *   get:
 *     summary: List of menus (each menu includes its icon)
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: module_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of menus
 */
menuRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/menu/update/{id}:
 *   put:
 *     summary: Update a menu
 *     tags: [Menu]
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
 *               icon:
 *                 type: string
 *                 example: fa-users
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu updated successfully
 *       404:
 *         description: Menu not found
 */
menuRouter.put('/update/:id', Auth, update);

/**
 * @swagger
 * /api/menu/delete/{id}:
 *   delete:
 *     summary: Delete a menu (soft delete)
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menu deleted successfully
 *       404:
 *         description: Menu not found
 */
menuRouter.delete('/delete/:id', Auth, deleteMenu);

export default menuRouter;