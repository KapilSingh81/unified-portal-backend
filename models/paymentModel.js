import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const userModulePaymentModel = sequelize.define("user_module_payment", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    module_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'module_master', key: 'id' } },
    is_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: "user_module_payment",
    freezeTableName: true,
    timestamps: false,
    indexes: [{ name: "UQ_user_module_payment_pair", unique: true, fields: ["user_id", "module_id"] }],
});