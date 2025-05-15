import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_Register2, LAAB_RegisterCoin, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, vendingWallet } from "../../../../entities";

export class CreateMerchantCoinFunc {

    private transaction: Transaction;
    
    private ownerUuid:string;
    private coinListId: string;
    private coinCode: string;

    private uuid: string;
    private suuid: string;
    private walletType: string;
    private passkeys:string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {

                console.log(`create merchant coin`, 1);

                this.InitParams(params);

                console.log(`create merchant coin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create merchant coin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`create merchant coin`, 4);

                const RegisterCoinMerchant = await this.RegisterCoinMerchant();
                if (RegisterCoinMerchant != IENMessage.success) throw new Error(RegisterCoinMerchant);

                console.log(`create merchant coin`, 5);

                await this.transaction.commit();
                resolve(this.response);
                
            } catch (error) {

                await this.transaction.rollback();
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
                if (run == null) throw new Error(IENMessage.invalidMerchant);
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

    private RegisterCoinMerchant(): Promise<any> {
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
                console.log(`params`, params);
                const run = await axios.post(LAAB_RegisterCoin, params);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
                    name: run.data.info.name,
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}