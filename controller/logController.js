import { Op } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";
import { allLogModel, userModel } from "../models/index.js";

// Filters: user_id, table_name, action_type, record_id, from, to (ISO date) + page, limit
const List = async (req, res) => {
    try {
        const { user_id, table_name, action_type, record_id, from, to } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

        const where = {};
        if (user_id) {
            if (!isUuid(user_id)) return ResponseService.badRequest(res, 'Invalid user id');
            where.user_id = user_id;
        }
        if (table_name) where.table_name = table_name;
        if (action_type) where.action_type = action_type.toUpperCase();
        if (record_id) where.record_id = record_id;

        if (from || to) {
            where.created_at = {};
            if (from) {
                const d = new Date(from);
                if (isNaN(d)) return ResponseService.badRequest(res, 'Invalid from date');
                where.created_at[Op.gte] = d;
            }
            if (to) {
                const d = new Date(to);
                if (isNaN(d)) return ResponseService.badRequest(res, 'Invalid to date');
                where.created_at[Op.lte] = d;
            }
        }

        const { rows, count } = await allLogModel.findAndCountAll({
            where,
            include: [{ model: userModel, as: 'actor', attributes: ['id', 'user_name'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset: (page - 1) * limit,
        });
        return ResponseService.success(res, 'Success', { rows, total: count, page, limit });
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { List };
