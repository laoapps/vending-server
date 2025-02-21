import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowExpendReport, LAAB_ShowIncomeReport, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class ShowMerchantReportFunc {

    private ownerUuid:string;
    private sender: string;
    private walletType: string;
    private page: number;
    private limit: number;
    private statement: string;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`find merchant`, 1);

                this.InitParams(params);

                console.log(`find merchant`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`find merchant`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`find merchant`, 4);

                const LoadReport = await this.LoadReport();
                if (LoadReport != IENMessage.success) throw new Error(LoadReport);

                console.log(`find merchant`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.sender = params.sender;
        this.walletType = IVendingWalletType.merchant;
        this.page = params.page;
        this.limit = params.limit;
        this.statement = params.statement;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.sender && this.page && this.limit && this.statement)) return IENMessage.parametersEmpty;
        if (this.statement != 'income' && this.statement != 'expend') return IENMessage.invalidStatement;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: this.walletType } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.passkeys = run.passkeys;
                
                const coinListId: string = this.sender.split('_')[0];
                const coinCode: string = this.sender.split('_')[3];
                if (coinListId != run.coinListId && coinCode != run.coinCode) return resolve(IENMessage.invalidCoin);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private LoadReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.sender,
                    page: this.page,
                    limit: this.limit,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }
                console.log();
                let run: any = {} as any;
                if (this.statement == 'income') {
                    run = await axios.post(LAAB_ShowIncomeReport, params);
                    if (run.data.status != 1) return resolve(run.data.message);

                } else if (this.statement == 'expend') {
                    run = await axios.post(LAAB_ShowExpendReport, params);
                    if (run.data.status != 1) return resolve(run.data.message);

                }


                this.response = {
                    page: run.data.info.page,
                    limit: run.data.info.limit,
                    rows: run.data.info.rows,
                    count: Number(run.data.info.count),
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}