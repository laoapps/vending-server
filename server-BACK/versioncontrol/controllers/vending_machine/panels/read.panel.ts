import { Request, Response } from "express";
import { IENMessage, IStatus, message } from "../../../../services/laab.service";
import { LoadAllVersionFunc } from "../funcs/loadAllVersion.func";
import { SetUpdateVersionFunc } from "../funcs/setupdateVersion.func";

export class ReadPanel {

    constructor() {}

    public LoadAllVersion(req: Request, res: Response) {
        try {
            const func = new LoadAllVersionFunc();
            func.Init().then(run => {
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
    public SetUpdateVersion(req: Request, res: Response) {
        try {
            const data = req.body;
            const func = new SetUpdateVersionFunc();
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