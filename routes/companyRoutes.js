import express from 'express';
import { Create, deleteCompany, List, update } from '../controller/companyController.js';
import Auth from '../middleware/auth.js';

const companyRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company master APIs
 */

/**
 * @swagger
 * /api/company/create:
 *   post:
 *     summary: Create a company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
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
 *                 example: Wave Corp
 *               code:
 *                 type: string
 *                 example: WAVE01
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Name is missing or company already exists
 */
companyRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/company/list:
 *   get:
 *     summary: Get all companies
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies (newest first)
 */
companyRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/company/update/{id}:
 *   put:
 *     summary: Update a company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
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
 *                 example: Wave Infotech
 *               code:
 *                 type: string
 *                 example: WAVE01
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Name is missing or already exists
 *       404:
 *         description: Company not found
 */
companyRouter.put('/update/:id', Auth, update);

/**
 * @swagger
 * /api/company/delete/{id}:
 *   delete:
 *     summary: Delete a company (soft delete)
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       404:
 *         description: Company not found
 */
companyRouter.delete('/delete/:id', Auth, deleteCompany);

export default companyRouter;