import { Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class CreateEPINFunc {

    private machineId:string;
    private detail: any = {} as any;

    private sender: string;
    private receiver: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private name: string;
    private balance: number;

    private laabuuid: string;
    private coinwallet: string;
    private otps: Array<any> = [];
    private otpKey: Array<any> = [];
    private encryptCoinCode: string;
    private databaseValue: string;
    private clientValue: string;
    private code: Array<any> = [];
    private qrcode: Array<any> = [];

    private otpkeyFormat: any = {} as any;
    private vKey: string;
    private otp: string;
    private smcResponse: any = {} as any;

    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`cash in validation`, 1);

                this.InitParams(params);

                console.log(`cash in validation`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`cash in validation`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`cash in validation`, 4);

                const FindMyLAABWallet = await this.FindMyLAABWallet();
                if (FindMyLAABWallet != IENMessage.success) throw new Error(FindMyLAABWallet)

                const CreateEPINCoupon = await this.CreateEPINCoupon();
                if (CreateEPINCoupon != IENMessage.success) throw new Error(CreateEPINCoupon);

                console.log(`cash in validation`, 5);

                console.log(`cash in validation`, 6);

                console.log(`cash in validation`, 7);

                console.log(`cash in validation`, 8);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
        this.detail = params.detail;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.detail)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.ownerUuid = run.ownerUuid;
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
                // const suuid = translateUToSU(this.uuid);

                const params = {
                    sender: this.sender,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_FindMyWallet, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.laabuuid = run.data.name;
                this.coinwallet = this.coinListId + '_' + this.laabuuid + '__' + this.coinCode;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateEPINCoupon(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    name: this.detail.name,
                    link: this.detail.link,
                    price: this.detail.price,
                    sender: this.detail.sender,
                    usecode: false,
                    items: this.detail.items,
                    
                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }

                console.log(`-->`, params);

                const run = await axios.post(EPIN_Generate, params);
                console.log(`response`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
    
}