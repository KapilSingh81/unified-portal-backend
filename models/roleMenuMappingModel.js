import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const roleMenuMappingModel = sequelize.define("role_menu_mapping", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'role_master', key: 'id' },
    },
    menu_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'menu_master', key: 'id' },
    },
},
    {
        tableName: "role_menu_mapping",
        freezeTableName: true,
        timestamps: false,
        indexes: [
            { name: "UQ_role_menu_mapping_pair", unique: true, fields: ["role_id", "menu_id"] },
        ],
    });
