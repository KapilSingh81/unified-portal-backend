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

        if (!decoded.company_id) {
            return ResponseService.unauthorized(res, "Company not assigned, contact admin");
        }

        req.companyId = decoded.company_id;
        req.userId = decoded.user_id ?? null; // token payload ka key apne hisaab se adjust karo
        next();
    } catch (error) {
        console.log(error);
        return ResponseService.error(res, error.message);
    }
};

export default Auth;