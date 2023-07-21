import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";
import { writeMachineBalance } from "../../../../services/service";

// after cashout to mmoney success this function will transfer laab coin amount to mmoney finance wallet
export class MmoneyTransferValidationFunc {

    private mmoneyfinance: string = 'e9b4f7c0-278c-11ee-90e5-232e20c314f2';
    private machineId:string;
    private receiver: string;
    private cash: number;
    private description: string;

    private sender: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;


    private passkeys: string;
    private response: any = {} as any;

    constructor() {}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`transfer validation`, 1);

                this.InitParams(params);

                console.log(`transfer validation`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`transfer validation`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`transfer validation`, 4);

                const FindVendingMerchant = await this.FindVendingMerchant();
                if (FindVendingMerchant != IENMessage.success) throw new Error(FindVendingMerchant);

                console.log(`transfer validation`, 5);

                console.log(`transfer validation`, 6);

                console.log(`transfer validation`, 7);

                const TransferCoin = await this.TransferCoin();
                if (TransferCoin != IENMessage.success) throw new Error(TransferCoin);

                console.log(`transfer validation`, 8);

                console.log(`transfer validation`, 9);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
        this.receiver = this.mmoneyfinance;
        this.cash = params.cash;
        this.description = params.description;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.receiver && this.cash && this.description)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourVendingWallet);
                this.ownerUuid = run.ownerUuid;
                this.sender = translateUToSU(run.uuid);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;
                this.passkeys = run.passkeys;
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private TransferCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    coin_list_id: this.coinListId,
                    coin_code: this.coinCode,
                    sender: this.sender,
                    receiver: this.receiver,
                    amount: this.cash,
                    description: this.description,
                    limitBlock: 10,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_CoinTransfer, params);
                if (run.data.status != 1) return resolve(run.data.message);

                const h ={
                    hash:run.data.info.hash,
                    info:run.data.info.info
                } 
                const bill = {
                    sender: run.data.info.sender,
                    receiver: run.data.info.receiver,
                    coinname: run.data.info.coinName,
                    amount: run.data.info.amount,
                    datetime: run.data.info.datetime,
                    description: this.description,
                    qr: JSON.stringify(h)
                }

                writeMachineBalance(this.machineId, '0');

                this.response = {
                    ownerUuid: this.ownerUuid,
                    bill: bill,
                    h: h,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

}
