import express from "express";
import { login, logout } from "../controller/authController.js";
import Auth from "../middleware/auth.js";

const authRouter = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: skyAdmin
 *               password:
 *                 type: string
 *                 example: "admin@123"
 *     responses:
 *       200:
 *         description: Login successful, returns user and JWT token
 *       400:
 *         description: Invalid credentials or missing fields
 */
authRouter.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user (the token is revoked and cannot be used again)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successfully
 *       400:
 *         description: Token is required
 *       401:
 *         description: Unauthorized or token already revoked
 */
authRouter.post('/logout', Auth, logout);

export default authRouter;