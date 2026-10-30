import { allLogModel } from "../models/index.js";

// all_log me entry. Log fail ho to main request fail nahi hoti.
// userId nahi mila (token me user nahi) to skip, kyunki all_log.user_id required hai.
export const logAction = async ({ userId, tableName, actionType, recordId, oldValues, newValues, transaction }) => {
    try {
        if (!userId) return;
        await allLogModel.create({
            user_id: userId,
            table_name: tableName,
            action_type: actionType,
            record_id: recordId ? String(recordId) : null,
            old_values: oldValues ? JSON.stringify(oldValues) : null,
            new_values: newValues ? JSON.stringify(newValues) : null,
        }, { transaction });
    } catch (error) {
        console.error("auditLog error:", error.message);
    }
};
