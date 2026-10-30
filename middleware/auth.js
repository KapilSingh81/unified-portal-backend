import jwt from "jsonwebtoken";
import ResponseService from "../utils/httpService.js";

const Auth = async (req, res, next) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return ResponseService.unauthorized(res, "Unauthorized - Please login again");
        }
        const token = header.startsWith("Bearer ") ? header.slice(7) : header;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return ResponseService.unauthorized(
                res,
                err.name === "TokenExpiredError"
                    ? "Session expired - Please login again"
                    : "Unauthorized - Invalid token"
            );
        }

        if (!decoded.id) {
            return ResponseService.unauthorized(res, "Unauthorized - Invalid token");
        }
        if (!decoded.company_id) {
            return ResponseService.unauthorized(res, "Company not assigned, contact admin");
        }
        if (!decoded.role_id) {
            return ResponseService.unauthorized(res, "Role not assigned, contact admin");
        }

        req.userId = decoded.id;
        req.companyId = decoded.company_id;
        req.roleId = decoded.role_id;
        next();
    } catch (error) {
        console.log(error);
        return ResponseService.error(res, error.message);
    }
};

export default Auth;