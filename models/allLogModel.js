import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const allLogModel = sequelize.define("all_log", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'user_master', key: 'id' },
    },
    table_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    action_type: {
        type: DataTypes.STRING(20), // CREATE | UPDATE | DELETE
        allowNull: false,
    },
    record_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    old_values: {
        type: DataTypes.TEXT, // JSON string (nvarchar(max))
        allowNull: true,
    },
    new_values: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
},
    {
        tableName: "all_log",
        freezeTableName: true,
        timestamps: false,
    });
