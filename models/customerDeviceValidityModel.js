import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const customerDeviceValidityModel = sequelize.define("customer_device_validity", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    fk_device_id: { type: DataTypes.INTEGER, allowNull: true },
    current_point_type: { type: DataTypes.SMALLINT, allowNull: true },
    next_recharge_date: { type: DataTypes.DATEONLY, allowNull: true },
    customer_recharge_date: { type: DataTypes.DATEONLY, allowNull: true },
    creation_time: { type: DataTypes.DATEONLY, allowNull: true },
    last_update_time: { type: DataTypes.DATEONLY, allowNull: true },
}, {
    tableName: "customer_device_validity",
    freezeTableName: true,
    timestamps: false,
});