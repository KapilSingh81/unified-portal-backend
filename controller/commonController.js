import { companyModel } from "../models/companyModel.js";
import ResponseService from "../utils/httpService.js";

export const companyDDList = async(req, res) =>  {
    try {
        const companyData = await companyModel.findAll({
            where: { is_deleted: false },
            order: [['id', 'DESC']],
            attributes : ['id', 'name']
        });
        return ResponseService.success(res, 'success', companyData)

    } catch(error) {
        console.error(error.message);
        return ResponseService.error(error.message);
        
    }
}