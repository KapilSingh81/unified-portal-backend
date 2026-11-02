import { menuModel, moduleModel, domainModel } from "../models/index.js";

export const findCompanyMenus = (companyId, menuIds) =>
    menuModel.findAll({
        where: { id: menuIds, is_deleted: false },
        include: [{
            model: moduleModel,
            as: "module",
            required: true,
            attributes: [],
            where: { is_deleted: false },
        }],
    });
