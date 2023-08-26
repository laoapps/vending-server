import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, IForwordKeys, LAAB_FORWARD_ShowWalletLAABCoinBalance, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class ShowVendingWalletCoinBalanceFunc {

    private ownerUuid:string;
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

                console.log(`show merchant coin balance`, 1);

                this.InitParams(params);

                console.log(`show merchant coin balance`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`show merchant coin balance`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`show merchant coin balance`, 4);

                const ShowMyCoinWalletBalance = await this.ShowMyCoinWalletBalance();
                if (ShowMyCoinWalletBalance != IENMessage.success) throw new Error(ShowMyCoinWalletBalance);

                console.log(`show merchant coin balance`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.name = params.name;
        this.machineClientId = params.machineId;
        this.walletType = IVendingWalletType.vendingWallet;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.name && this.machineClientId)) return IENMessage.parametersEmpty;
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