import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, IForwordKeys, LAAB_FORWARD_ShowWalletLAABCoinBalance, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class VendingCashFunc {

    private machineClientId: string;
    private name: string;
    private walletType: string;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`show vending cash`, 1);

                this.InitParams(params);

                console.log(`show vending cash`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`show vending cash`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`show vending cash`, 4);

                const ShowMyCoinWalletBalance = await this.ShowMyCoinWalletBalance();
                if (ShowMyCoinWalletBalance != IENMessage.success) throw new Error(ShowMyCoinWalletBalance);

                console.log(`show vending cash`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.name = params.name;
        this.machineClientId = params.machineId;
        this.walletType = IVendingWalletType.vendingWallet;
    }

    private ValidateParams(): string {
        if (!(this.name && this.machineClientId)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineClientId, walletType: this.walletType } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.passkeys = run.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private ShowMyCoinWalletBalance(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    uuid: this.name,
                    forwardname: IForwordKeys.name,
                    forwardkey: IForwordKeys.value
                }


                const run = await axios.post(LAAB_FORWARD_ShowWalletLAABCoinBalance, params);
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourMerchantCoin);

                this.response = {
                    balance: run.data.info.balance,
                    message: IENMessage.success
                };



                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}