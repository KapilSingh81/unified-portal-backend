import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const paymentOrderModel = sequelize.define("module_payment_order", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    module_id: { type: DataTypes.UUID, allowNull: false },
    plan_id: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'INR' },
    razorpay_order_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    razorpay_payment_id: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'CREATED' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    paid_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "module_payment_order", freezeTableName: true, timestamps: false });