import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const customerDeviceModel = sequelize.define("customer_device", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fk_customer_id: { type: DataTypes.INTEGER, allowNull: false },
    fk_device_type: { type: DataTypes.INTEGER, allowNull: false },
    device_id: { type: DataTypes.STRING(32), allowNull: false },
    device_imei: { type: DataTypes.STRING(32), allowNull: true },
    device_uid: { type: DataTypes.STRING(32), allowNull: true },
    sim_phone_number: { type: DataTypes.STRING(16), allowNull: true },
    fk_sim_operator: { type: DataTypes.INTEGER, allowNull: true },
    fk_vehicle_type: { type: DataTypes.INTEGER, allowNull: true },
    vehicle_no: { type: DataTypes.STRING(32), allowNull: true },
    description: { type: DataTypes.STRING(128), allowNull: true },
    installation_on: { type: DataTypes.DATEONLY, allowNull: true },
    creation_time: { type: DataTypes.DATE, allowNull: true },
    last_update_on: { type: DataTypes.DATE, allowNull: true },
    device_maker_id: { type: DataTypes.INTEGER, allowNull: true },
    fk_device_maker_type: { type: DataTypes.INTEGER, allowNull: true },
    data_push: { type: DataTypes.STRING(45), allowNull: true },
    data_push_by: { type: DataTypes.STRING(128), allowNull: true },
    CentralUserId: { type: DataTypes.UUID, allowNull: false },
}, {
    tableName: "customer_device",
    freezeTableName: true,
    timestamps: false,
});