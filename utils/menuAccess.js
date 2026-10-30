import { menuModel, moduleModel, domainModel } from "../models/index.js";

// Sirf wahi menus return karta hai jo given company ke domain/module ke andar aate hain.
export const findCompanyMenus = (companyId, menuIds) =>
    menuModel.findAll({
        where: { id: menuIds, is_deleted: false },
        include: [{
            model: moduleModel,
            as: "module",
            required: true,
            attributes: [],
            where: { is_deleted: false },
            include: [{
                model: domainModel,
                as: "domain",
                required: true,
                attributes: [],
                where: { company_id: companyId, is_deleted: false },
            }],
        }],
    });
