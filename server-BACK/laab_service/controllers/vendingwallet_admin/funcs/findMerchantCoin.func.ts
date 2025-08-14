import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class FindMerchantCoinFunc {

    private ownerUuid:string;
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

                console.log(`find merchant coin`, 1);

                this.InitParams(params);

                console.log(`find merchant coin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`find merchant coin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`find merchant coin`, 4);

                const FindMyCoinWallet = await this.FindMyCoinWallet();
                if (FindMyCoinWallet != IENMessage.success) throw new Error(FindMyCoinWallet);

                console.log(`find merchant coin`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.walletType = IVendingWalletType.merchant;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid)) return IENMessage.parametersEmpty;
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
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourMerchantCoin);

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