import express from "express";
import Auth from "../middleware/auth.js";
import { companyDDList, roleDDList, domainDDList, moduleDDList, userDDList } from "../controller/commonController.js";

const commonRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Common
 *   description: Common APIs
 */

/**
 * @swagger
 * /api/common/companyDDList:
 *   get:
 *     summary: Company dropdown list (id and name only)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active companies
 */
commonRouter.get("/companyDDList", Auth, companyDDList);

/**
 * @swagger
 * /api/common/roleDDList/{company_id}:
 *   get:
 *     summary: Role dropdown list for a company (id and name only)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company id
 *     responses:
 *       200:
 *         description: List of active roles of the company
 *       400:
 *         description: Invalid company id
 */
commonRouter.get("/roleDDList/:company_id", Auth, roleDDList);

/**
 * @swagger
 * /api/common/domainDDList:
 *   get:
 *     summary: Domain dropdown list (id and name only)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active domains
 */
commonRouter.get("/domainDDList", Auth, domainDDList);

/**
 * @swagger
 * /api/common/moduleDDList/{domain_id}:
 *   get:
 *     summary: Module dropdown list for a domain (id and name only)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domain_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Domain id
 *     responses:
 *       200:
 *         description: List of active modules of the domain
 *       400:
 *         description: Invalid domain id
 */
commonRouter.get("/moduleDDList/:domain_id", Auth, moduleDDList);

/**
 * @swagger
 * /api/common/userDDList/{company_id}:
 *   get:
 *     summary: User dropdown list for a company (id, name and role_id)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company id
 *     responses:
 *       200:
 *         description: List of active users of the company
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
 *                         example: Rahul Sharma
 *                       role_id:
 *                         type: string
 *                         format: uuid
 *       400:
 *         description: Invalid company id
 *       403:
 *         description: Access denied
 */
commonRouter.get("/userDDList/:company_id", Auth, userDDList);

export default commonRouter;