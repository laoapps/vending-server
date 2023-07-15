import { Request, Response } from "express";
import { IENMessage, message, IStatus } from "../../../../services/laab.service";
import { FindSubadminFunc } from "../funcs/findSubadmin.func";
import { ShowSubadminFunc } from "../funcs/showSubadmin.func";

export class ReadPanel {

    constructor() {}

    public ShowSubadmin(req: Request, res: Response) {
        try {
            const func = new ShowSubadminFunc();
            const data = req.body;
            func.Init(data).then(run => {
                if (run.message != IENMessage.success) {
                    message([], run, IStatus.unsuccess, res);
                } else {
                    delete run.message;
                    message(run, IENMessage.success, IStatus.success, res);
                }

            }).catch(error => message([], error.message, IStatus.unsuccess, res));

        } catch (error) {
            message([], error.message, IStatus.unsuccess, res);
        }
    }

    public FindSubadmin(req: Request, res: Response) {
        try {
            const func = new FindSubadminFunc();
            const data = req.body;
            func.Init(data).then(run => {
                if (run.message != IENMessage.success) {
                    message([], run, IStatus.unsuccess, res);
                } else {
                    delete run.message;
                    message(run, IENMessage.success, IStatus.success, res);
                }

            }).catch(error => message([], error.message, IStatus.unsuccess, res));

        } catch (error) {
            message([], error.message, IStatus.unsuccess, res);
        }
    }

    


}