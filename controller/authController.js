import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Op } from "sequelize";
import { companyModel } from "../models/companyModel.js";
import { roleModel } from "../models/roleModel.js";
import { userModel } from "../models/userModel.js";
import { revokedTokenModel } from "../models/revokedTokenModel.js";
import ResponseService from "../utils/httpService.js";
import { buildUserMenus } from "./portelMenuContoller.js";

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return ResponseService.badRequest(res, 'Username and password are required');
        }

        const isUser = await userModel.findOne({
            where: { user_name: username.trim(), is_deleted: false },
            include: [
                { model: roleModel, as: "role", attributes: ["id", "name"] },
                { model: companyModel, as: "company", attributes: ["id", "name"] },
            ],
        });
        if (!isUser) return ResponseService.badRequest(res, 'Invalid username or password');

        const isMatch = await bcrypt.compare(password, isUser.password);
        if (!isMatch) return ResponseService.badRequest(res, 'Invalid username or password');

        const access = await buildUserMenus(isUser.id, isUser.role_id);

        const token = jwt.sign(
            { id: isUser.id, company_id: isUser.company_id, role_id: isUser.role_id },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                issuer: "Skylabs",
                audience: "SkylabsGPS",
                subject: String(isUser.id),
                expiresIn: "1d",
            },
        );

        const user = isUser.toJSON();
        delete user.password;
        delete user.role_id;
        delete user.company_id;
        return ResponseService.success(res, 'Login successfully', { user, token, access });
    } catch (err) {
        console.error(err.message);
        return ResponseService.error(res, err.message);
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return ResponseService.badRequest(res, 'Token is required');

        const decoded = jwt.decode(token);
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

        // revoke this token (ignore if already revoked)
        await revokedTokenModel.findOrCreate({
            where: { token_hash: hashToken(token) },
            defaults: { user_id: req.userId, expires_at: expiresAt },
        });

        // clean up tokens that expired anyway
        await revokedTokenModel.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });

        return ResponseService.success(res, 'Logout successfully');
    } catch (err) {
        console.error(err.message);
        return ResponseService.error(res, err.message);
    }
};