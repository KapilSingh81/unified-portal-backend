import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

// Permission table skip kiya hai: har (role, menu) row me direct true/false flags.
export const rolePermissionMappingModel = sequelize.define("role_permission_mapping", {
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
    can_view: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_edit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_delete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
},
    {
        tableName: "role_permission_mapping",
        freezeTableName: true,
        timestamps: false,
        indexes: [
            { name: "UQ_role_permission_mapping_pair", unique: true, fields: ["role_id", "menu_id"] },
        ],
    });
