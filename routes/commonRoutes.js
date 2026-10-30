import express from "express";
import Auth from "../middleware/auth.js";
import { companyDDList } from "../controller/commonController.js";

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


export default commonRouter;