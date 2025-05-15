import { Request, Response } from "express";
import { IENMessage, IStatus, message } from "../../../../services/laab.service";
import { CreateVersionFunc } from "../funcs/createVersion.func";
import { EditContentVersionFunc } from "../funcs/editContentVersion.func";

export class WritePanel {

    private queues: any = {} as any;
    constructor(queues: any){
        this.queues = queues;
    }

    public CreateVersion(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateVendingVersion.add({ data }).then(job => {
                console.log(`here`);
                job.finished().then(run => {
                    if (run.message != IENMessage.success) {
                        message([], run, IStatus.unsuccess, res);
                    } else {
                        delete run.message;
                        message(run, IENMessage.success, IStatus.success, res);
                    }
                });
            });

        } catch (error) {
            message([], error.message, IStatus.unsuccess, res);
        }
    }

    public EditContentVersion(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QEditVendingContentVersion.add({ data }).then(job => {
                console.log(`here`);
                job.finished().then(run => {
                    if (run.message != IENMessage.success) {
                        message([], run, IStatus.unsuccess, res);
                    } else {
                        delete run.message;
                        message(run, IENMessage.success, IStatus.success, res);
                    }
                });
            });

        } catch (error) {
            message([], error.message, IStatus.unsuccess, res);
        }
    }






    public _CreateVersion(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateVersionFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _EditContentVersion(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new EditContentVersionFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}