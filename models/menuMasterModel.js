import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { moduleModel } from "./moudleModel.js";

export const menuModel = sequelize.define("menu_master", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    module_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'module_master', key: 'id' },
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
        tableName: "menu_master",
        freezeTableName: true,
        timestamps: false,
    });


menuModel.belongsTo(moduleModel, { foreignKey: "module_id", as: "module" });
moduleModel.hasMany(menuModel, { foreignKey: "module_id", as: "menus" });

// self relation (parent_of). NO ACTION because MSSQL does not allow SET NULL/CASCADE on self-reference.
const selfFk = { foreignKey: "parent_menu_id", onDelete: "NO ACTION", onUpdate: "NO ACTION" };
menuModel.belongsTo(menuModel, { ...selfFk, as: "parent" });
menuModel.hasMany(menuModel, { ...selfFk, as: "children" });
