import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyWallet, LAAB_Register2, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class FindMerchantFunc {

    private ownerUuid:string;
    private walletType: string;

    private coinListId: string;
    private coinCode: string;
    private coinName: string;

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

                const FindMyLAABWallet = await this.FindMyLAABWallet();
                if (FindMyLAABWallet != IENMessage.success) throw new Error(FindMyLAABWallet);

                console.log(`find merchant`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        console.log(`owner uuid der ni`, params.ownerUuid);
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
                this.coinName = run.coinName;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindMyLAABWallet(): Promise<any> {
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

                this.response = {
                    uuid: this.suuid,
                    coinListId: this.coinListId,
                    coinCode: this.coinCode,
                    coinName: this.coinName,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}