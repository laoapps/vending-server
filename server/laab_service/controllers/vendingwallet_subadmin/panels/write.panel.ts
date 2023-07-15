import { Request, Response } from "express";
import { IENMessage, message, IStatus } from "../../../../services/laab.service";
import { CreateSubAdminFunc } from "../funcs/createSubadmin.func";
import { AddProvideToSubadmin } from "../funcs/addProvideToSubadmin.func";
import { RemoveProvideFromSubadminFunc } from "../funcs/removeProvideFromSubadmin.func";
import { DeleteSubAdminFunc } from "../funcs/deleteSubadmin.func";

export class WritePanel {
    
    private queues: any = {} as any;
    constructor(queues: any){
        this.queues = queues;
    }

    public CreateSubadmin(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateSubadmin.add({ data }).then(job => {
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
    public DeleteSubadmin(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QDeleteSubadmin.add({ data }).then(job => {
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
    public AddProvideToSubadmin(req: Request, res: Response) {
        try {
            
            const data = req.body;
            this.queues.QAddProvideToSubadmin.add({ data }).then(job => {
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
    public RemoveProvideFromSubadmin(req: Request, res: Response) {
        try {

            const data = req.body;
            this.queues.QRemoveProvideFromSubadmin.add({ data }).then(job => {
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








    public _CreateSubadmin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateSubAdminFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _DeleteSubadmin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new DeleteSubAdminFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _AddProvideToSubadmin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new AddProvideToSubadmin();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _RemoveProvideFromSubadmin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new RemoveProvideFromSubadminFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }


}