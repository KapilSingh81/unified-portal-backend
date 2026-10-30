import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { companyModel } from "../models/companyModel.js";
import { roleModel } from "../models/roleModel.js";
import { userModel } from "../models/userModel.js";
import ResponseService from "../utils/httpService.js";

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

        const token = jwt.sign(
            { id: isUser.id, company_id: isUser.company_id, role_id: isUser.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const user = isUser.toJSON();
        delete user.password;
        delete user.role_id;
        delete user.company_id;
        return ResponseService.success(res, 'Login successfully', { user, token });
    } catch (err) {
        console.error(err.message);
        return ResponseService.error(res, err.message);
    }
};

export const logout = async(req, res) => {

}