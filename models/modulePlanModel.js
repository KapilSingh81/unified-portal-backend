import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const PLAN_TYPES = { MONTHLY: 30, QUARTERLY: 90, HALF_YEARLY: 180, YEARLY: 365 };

export const modulePlanModel = sequelize.define("module_plan", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    module_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'module_master', key: 'id' } },
    plan_type: { type: DataTypes.STRING(20), allowNull: false },
    duration_days: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "module_plan", freezeTableName: true, timestamps: false });