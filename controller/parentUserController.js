import ResponseService from "../utils/httpService.js";
import { isUuid } from "../utils/validate.js";
import { logAction } from "../utils/auditLog.js";
import { userModel, parentUserMappingModel } from "../models/index.js";

const USER_ATTRS = ['id', 'user_name', 'company_id', 'role_id'];

const Create = async (req, res) => {
    try {
        const { parent_user_id, child_user_id } = req.body;
        if (!isUuid(parent_user_id) || !isUuid(child_user_id)) {
            return ResponseService.badRequest(res, 'Valid parent_user_id and child_user_id are required');
        }
        if (parent_user_id === child_user_id) {
            return ResponseService.badRequest(res, 'User cannot be parent of himself');
        }

        const [parent, child] = await Promise.all([
            userModel.findOne({ where: { id: parent_user_id, is_deleted: false } }),
            userModel.findOne({ where: { id: child_user_id, is_deleted: false } }),
        ]);
        if (!parent) return ResponseService.notFound(res, 'Parent user not found');
        if (!child) return ResponseService.notFound(res, 'Child user not found');
        if (parent.company_id !== child.company_id) {
            return ResponseService.badRequest(res, 'Parent and child must belong to the same company');
        }

        const exists = await parentUserMappingModel.findOne({ where: { parent_user_id, child_user_id } });
        if (exists) return ResponseService.conflict(res, 'Mapping already exist');

        // loop check: parent ke upar ke saare ancestors me child nahi hona chahiye
        const seen = new Set([parent_user_id]);
        let frontier = [parent_user_id];
        while (frontier.length) {
            const rows = await parentUserMappingModel.findAll({ where: { child_user_id: frontier }, attributes: ['parent_user_id'], raw: true });
            frontier = [];
            for (const r of rows) {
                if (r.parent_user_id === child_user_id) {
                    return ResponseService.badRequest(res, 'Invalid mapping: it would create a loop');
                }
                if (!seen.has(r.parent_user_id)) {
                    seen.add(r.parent_user_id);
                    frontier.push(r.parent_user_id);
                }
            }
        }

        const mapping = await parentUserMappingModel.create({ parent_user_id, child_user_id });
        await logAction({ userId: req.userId, tableName: 'parent_user_mapping', actionType: 'CREATE', recordId: mapping.id, newValues: mapping.toJSON() });
        return ResponseService.created(res, mapping, 'Mapping created successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

// ?parent_user_id=  => us parent ke saare children
// ?child_user_id=   => us child ke saare parents
const List = async (req, res) => {
    try {
        const { parent_user_id, child_user_id } = req.query;
        if (!parent_user_id && !child_user_id) {
            return ResponseService.badRequest(res, 'parent_user_id or child_user_id is required');
        }
        const where = {};
        if (parent_user_id) {
            if (!isUuid(parent_user_id)) return ResponseService.badRequest(res, 'Invalid parent_user_id');
            where.parent_user_id = parent_user_id;
        }
        if (child_user_id) {
            if (!isUuid(child_user_id)) return ResponseService.badRequest(res, 'Invalid child_user_id');
            where.child_user_id = child_user_id;
        }
        const rows = await parentUserMappingModel.findAll({
            where,
            include: [
                { model: userModel, as: 'parent', attributes: USER_ATTRS, where: { is_deleted: false }, required: true },
                { model: userModel, as: 'child', attributes: USER_ATTRS, where: { is_deleted: false }, required: true },
            ],
        });
        return ResponseService.success(res, 'Success', rows);
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return ResponseService.badRequest(res, 'Valid mapping id is required');

        const mapping = await parentUserMappingModel.findByPk(id);
        if (!mapping) return ResponseService.notFound(res, 'Mapping not found');

        const oldValues = mapping.toJSON();
        await mapping.destroy();
        await logAction({ userId: req.userId, tableName: 'parent_user_mapping', actionType: 'DELETE', recordId: id, oldValues });
        return ResponseService.success(res, 'Mapping removed successfully');
    } catch (error) {
        return ResponseService.error(res, error.message);
    }
};

export { Create, List, remove };
