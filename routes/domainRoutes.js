import express from 'express';
import { Create, deleteDomain, List, update } from '../controller/domainController.js';
import Auth from '../middleware/auth.js';

const domainRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Domain
 *   description: Domain master APIs
 */

/**
 * @swagger
 * /api/domain/list:
 *   get:
 *     summary: Get all domains
 *     tags: [Domain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of domains
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
 *                         example: 3f2b8c1e-9a4d-4e6b-8f21-7c5d0a1b2e34
 *                       name:
 *                         type: string
 *                         example: Wave Corp Portal
 *                       url:
 *                         type: string
 *                         example: https://portal.wavecorp.in
 *                       status:
 *                         type: boolean
 *                         example: true
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       404:
 *         description: No domains found
 *       500:
 *         description: Server error
 */
domainRouter.get('/list', Auth, List);

/**
 * @swagger
 * /api/domain/create:
 *   post:
 *     summary: Create a domain
 *     tags: [Domain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, url]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Wave Corp Portal
 *               url:
 *                 type: string
 *                 example: https://portal.wavecorp.in
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Domain created successfully
 *       400:
 *         description: Domain already exist or missing fields
 */
domainRouter.post('/create', Auth, Create);

/**
 * @swagger
 * /api/domain/update/{id}:
 *   put:
 *     summary: Update a domain
 *     tags: [Domain]
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
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Domain updated successfully
 *       404:
 *         description: Domain not found
 */
domainRouter.put('/update/:id', Auth, update);

/**
 * @swagger
 * /api/domain/delete/{id}:
 *   delete:
 *     summary: Delete a domain (soft delete). Blocked if it has modules.
 *     tags: [Domain]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Domain deleted successfully
 *       409:
 *         description: Domain has modules
 */
domainRouter.delete('/delete/:id', Auth, deleteDomain);

export default domainRouter;