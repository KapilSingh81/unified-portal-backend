import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const revokedTokenModel = sequelize.define("revoked_token", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: "revoked_token",
    freezeTableName: true,
    timestamps: false,
});