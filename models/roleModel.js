import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const roleModel = sequelize.define("role_master", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'company_master', key: 'id' },
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
},
    {
        tableName: "role_master",
        freezeTableName: true,
        timestamps: false,
    });
