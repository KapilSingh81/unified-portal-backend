import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const userPermissionMappingModel = sequelize.define("user_permission_mapping", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    role_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'role_master', key: 'id' } },
    menu_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'menu_master', key: 'id' } },
    can_view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_add: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_delete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: "user_permission_mapping",
    freezeTableName: true,
    timestamps: false,
    indexes: [
        { name: "UQ_user_permission_mapping_pair", unique: true, fields: ["user_id", "menu_id"] },
    ],
});