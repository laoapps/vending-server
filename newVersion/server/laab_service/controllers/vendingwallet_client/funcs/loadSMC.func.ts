import { Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowCouponCoinWalletSMC, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { genCode, genModel, genQRCode } from "../../../../services/epin.service";
import { vendingWallet } from "../../../../entities";

export class LoadSMCFunc {

    private machineId:string;
    private page: number;
    private limit: number;

    private sender: string;

    private coinListId: string;
    private coinCode: string;

    private laabuuid: string;
    private coinwallet: string;

    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`smc list`, 1);

                this.InitParams(params);

                console.log(`smc list`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`smc list`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`smc list`, 4);

                const FindMyLAABWallet = await this.FindMyLAABWallet();
                if (FindMyLAABWallet != IENMessage.success) throw new Error(FindMyLAABWallet);

                console.log(`smc list`, 5);

                const ShowSMCList = await this.ShowSMCList();
                if (ShowSMCList != IENMessage.success) throw new Error(ShowSMCList);

                console.log(`smc list`, 6);

                console.log(`smc list`, 7);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
        this.page = params.page;
        this.limit = params.limit;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.page && this.limit)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.sender = translateUToSU(run.uuid);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;
                this.passkeys = run.passkeys;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindMyLAABWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.sender,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_FindMyWallet, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.laabuuid = run.data.info.name;
                this.coinwallet = this.coinListId + '_' + run.data.info.name + '__' + this.coinCode;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private ShowSMCList(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.coinwallet,
                    balance_status: 'remain balance',
                    page: this.page,
                    limit: this.limit,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                console.log(`params`, params);
                const run = await axios.post(LAAB_ShowCouponCoinWalletSMC, params);
                console.log(`response`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
                    page: this.page,
                    limit: this.limit,
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