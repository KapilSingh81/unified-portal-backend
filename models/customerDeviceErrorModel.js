import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const customerDeviceErrorModel = sequelize.define("customer_device_error", {
    fk_device_id: { type: DataTypes.INTEGER, allowNull: false },
    device_last_data: { type: DataTypes.DATE, allowNull: true },
    device_live_data: { type: DataTypes.DATE, allowNull: true },
    device_heart_data: { type: DataTypes.DATE, allowNull: true },
    time_zone_error: { type: DataTypes.SMALLINT, allowNull: true },
    live_loc_error: { type: DataTypes.SMALLINT, allowNull: true },
    location_zero: { type: DataTypes.SMALLINT, allowNull: true },
}, {
    tableName: "customer_device_error",
    freezeTableName: true,
    timestamps: false,
});
