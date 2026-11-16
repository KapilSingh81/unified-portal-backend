import express from "express";
import Auth from "../middleware/auth.js";
import { List ,GetById, Create, update, deleteReport } from "../controller/reportsMasterController.js";

const reportMasterRoutes = express.Router();

/**
 * @swagger
 * /api/reportMaster/get:
 *   get:
 *     summary: List all reports
 *     tags: [Report Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Optional. Filter by status
 *     responses:
 *       200:
 *         description: List of reports
 *       400:
 *         description: Invalid status
 */
reportMasterRoutes.get("/get", Auth, List);

/**
 * @swagger
 * /api/reportMaster/get/{id}:
 *   get:
 *     summary: Get a report by id
 *     tags: [Report Master]
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
 *         description: Report details
 *       400:
 *         description: Invalid report id
 *       404:
 *         description: Report not found
 */
reportMasterRoutes.get("/get/:id", Auth, GetById);

/**
 * @swagger
 * /api/reportMaster/create:
 *   post:
 *     summary: Create a report
 *     tags: [Report Master]
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
 *                 example: Distance Report
 *               url:
 *                 type: string
 *                 example: /reports/distance
 *               status:
 *                 type: boolean
 *                 example: true
 *               icon:
 *                 type: string
 *                 example: map
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Missing or invalid parameters, or report already exists
 */
reportMasterRoutes.post("/create", Auth, Create);

/**
 * @swagger
 * /api/reportMaster/update/{id}:
 *   put:
 *     summary: Update a report
 *     tags: [Report Master]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Distance Report
 *               url:
 *                 type: string
 *                 example: /reports/distance
 *               status:
 *                 type: boolean
 *                 example: true
 *               icon:
 *                 type: string
 *                 example: map
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Missing or invalid parameters, or report name already exists
 *       404:
 *         description: Report not found
 */
reportMasterRoutes.put("/update/:id", Auth, update);

/**
 * @swagger
 * /api/reportMaster/delete/{id}:
 *   delete:
 *     summary: Delete a report (soft delete)
 *     tags: [Report Master]
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
 *         description: Report deleted successfully
 *       400:
 *         description: Invalid report id
 *       404:
 *         description: Report not found
 */
reportMasterRoutes.delete("/delete/:id", Auth, deleteReport);

export default reportMasterRoutes;