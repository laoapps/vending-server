import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class FindVendingWalletCoinFunc {

    private ownerUuid:string;
    private machineClientId: string;
    private coinListId: string;
    private coinCode: string;
    private walletType: string;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                const FindMyCoinWallet = await this.FindMyCoinWallet();
                if (FindMyCoinWallet != IENMessage.success) throw new Error(FindMyCoinWallet);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.machineClientId = params.machineId;
        this.walletType = IVendingWalletType.vendingWallet;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.machineClientId)) return IENMessage.parametersEmpty;
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

    private FindMyCoinWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.suuid,
                    coin_list_id: this.coinListId,
                    coin_code: this.coinCode,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }

                const run = await axios.post(LAAB_FindMyCoinWallet, params);
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourVendingWalletCoin);

                this.response = {
                    name: run.data.info.name,
                    message: IENMessage.success
                };

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}