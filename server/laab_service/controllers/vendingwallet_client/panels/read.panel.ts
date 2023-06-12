import { CashValidationFunc } from "../funcs/cashValidation.func";
import { Request, Response } from "express";
import { CashinValidationFunc } from "../funcs/cashinValidation.func";
import { ShowVendingWalletCoinBalanceFunc } from "../funcs/showVendingWalletCoinBalance.func";
import { PaidValidationFunc } from "../funcs/paidValidation.func";
import { CreateSMCFunc } from "../funcs/createSMC.func";
import { LoadSMCFunc } from "../funcs/loadSMC.func";
import { CreateEPINFunc } from "../funcs/createEPIN.func";
import { IENMessage, message, IStatus } from "../../../../services/laab.service";

export class ReadPanel {

    constructor() {}

    public ShowVendinWalletCoinBalance(req: Request, res: Response) {
        try {
            const func = new ShowVendingWalletCoinBalanceFunc();
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

    public CashValidation(req: Request, res: Response) {
        try {
            const func = new CashValidationFunc();
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

    public CashinValidation(req: Request, res: Response) {
        try {
            const func = new CashinValidationFunc();
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

    // public PaidValidation(req: Request, res: Response) {
    //     try {
    //         const func = new PaidValidationFunc();
    //         const data = req.body;
    //         func.Init(data).then(run => {
    //             if (run.message != IENMessage.success) {
    //                 message([], run, IStatus.unsuccess, res);
    //             } else {
    //                 delete run.message;
    //                 message(run, IENMessage.success, IStatus.success, res);
    //             }

    //         }).catch(error => message([], error.message, IStatus.unsuccess, res));

    //     } catch (error) {
    //         message([], error.message, IStatus.unsuccess, res);
    //     }
    // }

    public CreateSMC(req: Request, res: Response) {
        try {
            const func = new CreateSMCFunc();
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

    public LoadSMC(req: Request, res: Response) {
        try {
            const func = new LoadSMCFunc();
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

    public CreateEPIN(req: Request, res: Response) {
        try {
            const func = new CreateEPINFunc();
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