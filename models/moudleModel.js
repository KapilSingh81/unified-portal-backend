import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { domainModel } from "./domainModel.js";

export const moduleModel = sequelize.define("module_master", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    domain_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'domain_master', key: 'id' },
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
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
        tableName: "module_master",
        freezeTableName: true,
        timestamps: false,
    });


moduleModel.belongsTo(domainModel, { foreignKey: "domain_id", as: "domain" });
domainModel.hasMany(moduleModel, { foreignKey: "domain_id", as: "modules" });