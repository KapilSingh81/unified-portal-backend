import express from "express";
import Auth from "../middleware/auth.js";
import { companyDDList, roleDDList, domainDDList, moduleDDList, userDDList, customerDeviceDDLList, parentDDLList } from "../controller/commonController.js";

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

/**
 * @swagger
 * /api/common/customerDeviceDDLList:
 *   get:
 *     summary: Customer device dropdown list (id and vehicle_no). Admin must pass user_id, normal user gets own devices.
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required for admin (selected user). Ignored for normal users.
 *     responses:
 *       200:
 *         description: List of devices
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
 *                       vehicle_no:
 *                         type: string
 *                         example: GJ01AB1234
 *       403:
 *         description: Access denied
 */
commonRouter.get("/customerDeviceDDLList", Auth, customerDeviceDDLList);

/**
 * @swagger
 * /api/common/parentDDLList:
 *   get:
 *     summary: Parent user dropdown list (users who have at least one sub-user). Optional company filter.
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company id. If passed, only parents of that company's users are returned.
 *     responses:
 *       200:
 *         description: List of parent users
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
 *                       user_name:
 *                         type: string
 *                         example: rahul01
 *       400:
 *         description: Invalid company id
 */
commonRouter.get("/parentDDLList", Auth, parentDDLList);

export default commonRouter;