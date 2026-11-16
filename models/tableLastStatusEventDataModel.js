import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const tableLastStatusEventDataModel = sequelize.define("tbl_last_status_eventdata", {
    fk_device_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.INTEGER, allowNull: true },
    speed: { type: DataTypes.DOUBLE, allowNull: true },
    time_stamp: { type: DataTypes.DATE, allowNull: true, defaultValue: 0 },
    engine_status_time: { type: DataTypes.DATE, allowNull: true, defaultValue: 0 },
}, {
    tableName: "tbl_last_status_eventdata",
    freezeTableName: true,
    timestamps: false,
});
