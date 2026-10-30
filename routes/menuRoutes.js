import express from 'express';
import { Create, deleteMenu, List, Tree, update } from '../controller/menuController.js';

const menuRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu master APIs (parent_menu_id se sub-menu)
 */

/**
 * @swagger
 * /api/menu/create:
 *   post:
 *     summary: Create a menu (parent_menu_id optional for sub menu)
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
 *               parent_menu_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               name:
 *                 type: string
 *                 example: Visitor List
 *               url:
 *                 type: string
 *                 example: /visitors/list
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Menu created successfully
 *       404:
 *         description: Module or parent menu not found
 */
menuRouter.post('/create', Create);

/**
 * @swagger
 * /api/menu/list:
 *   get:
 *     summary: Flat list of menus
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: module_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: parent_menu_id
 *         description: Menu id, or the word null for top level menus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of menus
 */
menuRouter.get('/list', List);

/**
 * @swagger
 * /api/menu/tree:
 *   get:
 *     summary: Nested menu tree of a module
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menus with children[]
 */
menuRouter.get('/tree', Tree);

/**
 * @swagger
 * /api/menu/update/{id}:
 *   put:
 *     summary: Update a menu (parent change par loop check hota hai)
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
 *               parent_menu_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu updated successfully
 *       404:
 *         description: Menu not found
 */
menuRouter.put('/update/:id', update);

/**
 * @swagger
 * /api/menu/delete/{id}:
 *   delete:
 *     summary: Delete a menu (soft delete). Blocked if it has sub menus.
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
 *       409:
 *         description: Menu has sub menus
 */
menuRouter.delete('/delete/:id', deleteMenu);

export default menuRouter;
