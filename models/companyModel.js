import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/db.config.js";

export const companyModel = sequelize.define("company_master", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
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
        tableName: "company_master",
        freezeTableName: true,
        timestamps: false,
        indexes: [
            {
                name: "UQ_company_master_code",
                unique: true,
                fields: ["code"],
                where: { code: { [Op.ne]: null } },
            },
        ],
    });
