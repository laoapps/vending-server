import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, LAAB_FindMyWallet, LAAB_Register2, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { Op } from "sequelize";
import { vendingWallet } from "../../../../entities";

export class MerchantCoinTransferFunc {

    private ownerUuid: string;
    private ownerCoinListId: string;
    private ownerCoinCode: string;
    private coinListId: string;
    private coinCode: string;
    private sender: string;
    private receiver: string;
    private description: string;
    private amount: number;
    private limitBlock: number;

    private walletType: string;
    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`merchant coin transfer`, 1);

                this.InitParams(params);

                console.log(`merchant coin transfer`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`merchant coin transfer`, 3);

                const FindSender = await this.FindSender();
                if (FindSender != IENMessage.success) throw new Error(FindSender);

                console.log(`merchant coin transfer`, 4);

                const TransferCoin = await this.TransferCoin();
                if (TransferCoin != IENMessage.success) throw new Error(TransferCoin);

                console.log(`merchant coin transfer`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.sender = params.sender;
        this.walletType = IVendingWalletType.merchant;
        this.receiver = params.receiver;
        this.amount = params.amount;
        this.description = params.description;
        this.limitBlock = params.limitBlock;
        this.coinListId = params.coinListId;
        this.coinCode = params.coinCode;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.sender && this.receiver && this.amount && this.description && this.limitBlock && this.coinListId && this.coinCode)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindSender(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const run = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: this.walletType } });
                if (run == null) return resolve(IENMessage.invalidSender);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.ownerCoinListId = run.coinListId;
                this.ownerCoinCode = run.coinCode;
                this.passkeys = run.passkeys;

                if (this.ownerCoinListId != this.coinListId && this.ownerCoinCode != this.coinCode) return resolve(IENMessage.thisIsNotVendingCoin);
                if (this.sender != this.suuid) return (IENMessage.invalidSender);

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
                    amount: this.amount,
                    description: this.description,
                    limitBlock: this.limitBlock,

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
                this.response = {
                    bill: bill,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}