import ResponseService from "../utils/httpService.js";

export const idleReports = async(req , res) => {
    try {
        

    } catch(err) {
        console.log(err.message);
        return ResponseService.error(res, err.message);
    }
}