import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const userModel = sequelize.define("user_master", {
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
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'role_master', key: 'id' },
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { isEmail: true },
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    user_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(255),
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
        tableName: "user_master",
        freezeTableName: true,
        timestamps: false,
    });
