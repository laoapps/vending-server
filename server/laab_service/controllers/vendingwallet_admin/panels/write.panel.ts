import { Request, Response } from "express";
import { CreateMerchantFunc } from "../funcs/createMerchant.func";
import { CreateVendingLimiterFunc } from "../funcs/createVendingLimiter.func";
import { CreateMerchantCoinFunc } from "../funcs/createMerchantCoin.func";
import { CreateVendingLimiterCoinFunc } from "../funcs/createVendingLimiterCoin.func";
import { CreateVendingWalletFunc } from "../funcs/createVendingWallet.func";
import { CreateVendingWalletCoinFunc } from "../funcs/createVendingWalletCoin.func";
import { IENMessage, message, IStatus } from "../../../../services/laab.service";
import { CounterCashout_CashValidationFunc } from "../funcs/countercashout_cashValidation.func";
import { ReCreateEPINFunc } from "../funcs/recreateEPIN.func";

export class WritePanel {
    
    private queues: any = {} as any;
    constructor(queues: any){
        this.queues = queues;
    }

    public CreateMerchant(req: Request, res: Response) {
        try {
            const data = req.body;
            console.log(`init create`, req.body);
            this.queues.QCreateMerchant.add({ data }).then(job => {
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

    public CreateMerchantCoin(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateMerchantCoin.add({ data }).then(job => {
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

    public CreateVendingLimiter(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateVendingLimiter.add({ data }).then(job => {
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

    public CreateVendingLimiterCoin(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateVendingLimiterCoin.add({ data }).then(job => {
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

    public CreateVendingWallet(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateVendingWallet.add({ data }).then(job => {
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

    public CreateVendingWalletCoin(req: Request, res: Response) {
        try {
            const data = req.body;
            this.queues.QCreateVendingWalletCoin.add({ data }).then(job => {
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

    public CounterCashout_CashValidation(req: Request, res: Response) {
        try {

            const data = req.body;
            this.queues.QCounterCashout_CashValidation.add({ data }).then(job => {
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
    public ReCreateEPIN(req: Request, res: Response) {
        try {

            const data = req.body;
            this.queues.QReCreateEPIN.add({ data }).then(job => {
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








    public _CreateMerchant(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                console.log(`init process`);
                const func = new CreateMerchantFunc();
                const run = await func.Init(params);
                console.log(`_CreateMerchant`, run);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CreateMerchantCoin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateMerchantCoinFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CreateVendingLimiter(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateVendingLimiterFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CreateVendingLimiterCoin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateVendingLimiterCoinFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CreateVendingWallet(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateVendingWalletFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CreateVendingWalletCoin(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CreateVendingWalletCoinFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _CounterCashout_CashValidation(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new CounterCashout_CashValidationFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    public _ReCreateEPIN(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const func = new ReCreateEPINFunc();
                const run = await func.Init(params);
                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}