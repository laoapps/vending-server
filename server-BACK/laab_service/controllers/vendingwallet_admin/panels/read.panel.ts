import { FindMerchantFunc } from "../funcs/findMerchant.func";
import { Request, Response } from "express";
import { FindVendingLimiterFunc } from "../funcs/findVendingLimiter.func";
import { FindMerchantCoinFunc } from "../funcs/findMerchantCoin.func";
import { FindVendingLimiterCoinFunc } from "../funcs/findVendingLimiterCoin.func";
import { MerchantCoinTransferFunc } from "../funcs/merchantCoinTransfer.func";
import { LoginFunc } from "../funcs/login.func";
import { ShowMerchantCoinBalanceFunc } from "../funcs/showMerchantCoinBalance.func";
import { ShowVendingLimiterCoinBalanceFunc } from "../funcs/showVendingLimiterCoinBalance.func";
import { VendingLimiterCoinTransferFunc } from "../funcs/vendingLimiterCoinTransfer.func";
import { ShowMerchantReportFunc } from "../funcs/showMerchantReport.func";
import { ShowVendingLimiterReportFunc } from "../funcs/showVendingLimiterReport.func";
import { TextHashVerifyFunc } from "../funcs/textHashVerify.func";
import { QRHashVerifyFunc } from "../funcs/qrHashVerify.func";
import { FindVendingWalletFunc } from "../funcs/findVendingWallet.func";
import { FindVendingWalletCoinFunc } from "../funcs/findVendingWalletCoin.func";
import { VendingWalletCoinTransferFunc } from "../funcs/vendingWalletCoinTransfer.func";
import { ShowVendingWalletCoinBalanceFunc } from "../funcs/showVendingWalletCoinBalance.func";
import { ShowVendingWalletReportFunc } from "../funcs/showVendingWalletReport.func";
import { IENMessage, message, IStatus } from "../../../../services/laab.service";
import { FindEPINShortCodeFunc } from "../funcs/findEPINShortcode.func";
import { ShowEPINShortCodeFunc } from "../funcs/showEPINShortcode.func";
import { FindLockerWalletFunc } from "../funcs/findLockerWallet.func";
import { FindLockerWalletCoinFunc } from "../funcs/findLockerWalletCoin.func";
import { LockerWalletCoinTransferFunc } from "../funcs/lockerWalletCoinTransfer.func";
import { ShowLockerWalletCoinBalanceFunc } from "../funcs/showLockerWalletCoinBalance.func";
import { ShowLockerWalletReportFunc } from "../funcs/showLockerWalletReport.func";

export class ReadPanel {

    constructor() {
        
    }


    public FindMerchant(req: Request, res: Response) {
        try {
            const func = new FindMerchantFunc();
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

    public FindVendingLimiter(req: Request, res: Response) {
        try {
            const func = new FindVendingLimiterFunc();
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

    public FindVendingWallet(req: Request, res: Response) {
        try {
            const func = new FindVendingWalletFunc();
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

    public FindLockerWallet(req: Request, res: Response) {
        try {
            const func = new FindLockerWalletFunc();
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


    public FindMerchantCoin(req: Request, res: Response) {
        try {
            const func = new FindMerchantCoinFunc();
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

    public FindVendingLimiterCoin(req: Request, res: Response) {
        try {
            const func = new FindVendingLimiterCoinFunc();
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

    public FindVendingWalletCoin(req: Request, res: Response) {
        try {
            const func = new FindVendingWalletCoinFunc();
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

    public FindLockerWalletCoin(req: Request, res: Response) {
        try {
            const func = new FindLockerWalletCoinFunc();
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






    public Login(req: Request, res: Response) {
        try {
            const func = new LoginFunc();
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

    public TextHashVerify(req: Request, res: Response) {
        try {
            const func = new TextHashVerifyFunc();
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

    public QRHashVerify(req: Request, res: Response) {
        try {
            const func = new QRHashVerifyFunc();
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





    public MerchantCoinTransfer(req: Request, res: Response) {
        try {
            const func = new MerchantCoinTransferFunc();
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

    public VendingLimiterCoinTransfer(req: Request, res: Response) {
        try {
            const func = new VendingLimiterCoinTransferFunc();
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

    public VendingWalletCoinTransfer(req: Request, res: Response) {
        try {
            const func = new VendingWalletCoinTransferFunc();
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

    public LockerWalletCoinTransfer(req: Request, res: Response) {
        try {
            const func = new LockerWalletCoinTransferFunc();
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




    public ShowMerchantCoinBalance(req: Request, res: Response) {
        try {
            const func = new ShowMerchantCoinBalanceFunc();
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

    public ShowVendingLimiterCoinBalance(req: Request, res: Response) {
        try {
            const func = new ShowVendingLimiterCoinBalanceFunc();
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

    public ShowVendingWalletCoinBalance(req: Request, res: Response) {
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

    public ShowLockerWalletCoinBalance(req: Request, res: Response) {
        try {
            const func = new ShowLockerWalletCoinBalanceFunc();
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






    public ShowMerchantReport(req: Request, res: Response) {
        try {
            const func = new ShowMerchantReportFunc();
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

    public ShowVendingLimiterReport(req: Request, res: Response) {
        try {
            const func = new ShowVendingLimiterReportFunc();
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

    public ShowVendingWalletReport(req: Request, res: Response) {
        try {
            const func = new ShowVendingWalletReportFunc();
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

    public ShowLockerWalletReport(req: Request, res: Response) {
        try {
            const func = new ShowLockerWalletReportFunc();
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


    public FindEPINShortCode(req: Request, res: Response) {
        try {
            const func = new FindEPINShortCodeFunc();
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

    public ShowEPINShortCode(req: Request, res: Response) {
        try {
            const func = new ShowEPINShortCodeFunc();
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