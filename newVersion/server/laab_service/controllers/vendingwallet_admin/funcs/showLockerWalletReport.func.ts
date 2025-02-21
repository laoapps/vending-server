import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowExpendReport, LAAB_ShowIncomeReport, LAAB_ShowSMCExpendReport, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class ShowLockerWalletReportFunc {

    private ownerUuid:string;
    private machineClientId: string;
    private sender: string;
    private walletType: string;
    private page: number;
    private limit: number;
    private statement: string;

    private uuid: string;
    private suuid: string;
    private coinListId: string;
    private coinCode: string;
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

                const FindVendingLimiterLAABWallet = await this.FindVendingLimiterLAABWallet();
                if (FindVendingLimiterLAABWallet != IENMessage.success) throw new Error(FindVendingLimiterLAABWallet);

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
        this.machineClientId = params.machineId;
        this.walletType = IVendingWalletType.lockerWallet;
        this.page = params.page;
        this.limit = params.limit;
        this.statement = params.statement;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.machineClientId && this.page && this.limit && this.statement)) return IENMessage.parametersEmpty;
        if (this.statement != 'income' && this.statement != 'expend' && this.statement != 'smc_expend') return IENMessage.invalidStatement;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, machineClientId: this.machineClientId, walletType: this.walletType } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.passkeys = run.passkeys;
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingLimiterLAABWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                // const suuid = translateUToSU(this.uuid);

                const params = {
                    sender: this.suuid,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_FindMyWallet, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.sender = this.coinListId + '_' + run.data.info.name + '__' + this.coinCode;
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
                let run: any = {} as any;
                if (this.statement == 'income') {
                    run = await axios.post(LAAB_ShowIncomeReport, params);
                    if (run.data.status != 1) return resolve(run.data.message);
                } else if (this.statement == 'expend') {
                    run = await axios.post(LAAB_ShowExpendReport, params);
                    if (run.data.status != 1) return resolve(run.data.message);
                } else if (this.statement == 'smc_expend') {
                    run = await axios.post(LAAB_ShowSMCExpendReport, params);
                    if (run.data.status != 1) return resolve(run.data.message);
                }

                this.response = {
                    page: run.data.info.page,
                    limit: run.data.info.limit,
                    rows: run.data.info.rows,
                    count: run.data.info.count,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}