import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const parentUserMappingModel = sequelize.define("parent_user_mapping", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    parent_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'user_master', key: 'id' },
    },
    child_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'user_master', key: 'id' },
    },
},
    {
        tableName: "parent_user_mapping",
        freezeTableName: true,
        timestamps: false,
        indexes: [
            { name: "UQ_parent_user_mapping_pair", unique: true, fields: ["parent_user_id", "child_user_id"] },
        ],
    });
