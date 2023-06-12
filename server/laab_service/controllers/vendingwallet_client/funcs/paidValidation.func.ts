import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, vendingWallet } from "../../../../entities";
import { v4 as uuid4 } from 'uuid';
import { EEntity, EPaymentStatus, IVendingMachineSale } from "../../../../entities/system.model";
import { VendingMachineBillFactory, VendingMachineBillStatic } from "../../../../entities/vendingmachinebill.entity";

export class PaidValidationFunc {

    private machineId:string;
    private cash: number;
    private description: string;
    private paidLAAB: any = {} as any;

    private sender: string;
    private receiver: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private name: string;
    private balance: number;

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

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`cash in validation`, 5);

                console.log(`cash in validation`, 6);

                console.log(`cash in validation`, 7);

                const TransferCoin = await this.TransferCoin();
                if (TransferCoin != IENMessage.success) throw new Error(TransferCoin);

                console.log(`cash in validation`, 8);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
        this.cash = params.cash;
        this.description = params.description;
        this.paidLAAB = params.paidLAAB;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.cash && this.description && this.paidLAAB)) return IENMessage.parametersEmpty;
        if (this.paidLAAB != undefined && Object.entries(this.paidLAAB).length == 0) return IENMessage.parametersEmpty;
        if (!
            (
                this.paidLAAB[0].command &&
                this.paidLAAB[0].data &&
                this.paidLAAB[0].dat.ids &&
                this.paidLAAB[0].data.value &&
                this.paidLAAB[0].data.clientId &&
                this.paidLAAB[0].time
            )
        ) return IENMessage.parametersEmpty;

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

    private CreateMachineClientID(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const clientId = this.paidLAAB.data.clientId
                const checkIds: Array<any> = [];
                const sale = this.paidLAAB.data.ids;



                sale.forEach(v => {
                    v.stock.qtty = 1;
                    const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                    y.stock.qtty = 1;
                    y.stock.image = '';
                    checkIds.push(y);
                });

                const value = checkIds.reduce((a, b) => {
                    return a + (b.stock.price * b.stock.qtty);
                }, 0);

                if (Number(value) != Number(this.paidLAAB.data.value)) return resolve(IENMessage.invalidValue);

                const transactionID = Number(Number(this.machineId.substring(this.machineId.length-5))+''+(new Date().getTime()));
                
                const bill = {
                    uuid: uuid4(),
                    clientId,
                    qr: '',
                    transactionID,
                    machineId: this.machineId,
                    hashM: '',
                    hashP: '',
                    paymentmethod: this.paidLAAB.command,
                    paymentref: '',
                    paymentstatus: EPaymentStatus.pending,
                    paymenttime: new Date(),
                    requestpaymenttime: new Date(),
                    totalvalue: value,
                    vendingsales: sale,
                    isActive: true,
                };

                const m = await machineClientIDEntity.findOne({ where: { machineId: this.ssocket.findMachineIdToken(d.token)?.machineId } });
                const ownerUuid = m?.ownerUuid || '';
                const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
                await ent.sync();

                ent.create(bill).then(r => {
                    console.log('SET transactionID by owner', ownerUuid);

                    redisClient.setEx(transactionID + '--_', 60 * 15, ownerUuid);
                    res.send(PrintSucceeded(d.command, r, EMessage.succeeded));
                });

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.receiver = translateUToSU(run.uuid);


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

    //
}

class CreateBill {

    private transaction: Transaction;

    private machineId: string;
    private ownerUuid: string;

    private command: string;
    private ids: Array<any> = [];
    private value: number;
    private clientId: string;
    private time: string;



    private checkIds: Array<any> = [];
    private bill: any = {} as any;
    private vendingMachineBillEntity: VendingMachineBillStatic;

    constructor() {}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private InitParams(params: any): void {
        this.machineId = params.machineId;
        this.ownerUuid = params.ownerUuid;
        this.command = params.command;
        this.ids = params.ids;
        this.value = params.value;
        this.clientId = params.clientId;
        this.time = params.time;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.ownerUuid && this.command && this.ids && this.value && this.clientId && this.time)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private AddCheckIds(): string {
        this.ids.forEach(v => {
            v.stock.qtty = 1;
            const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
            y.stock.qtty = 1;
            y.stock.image = '';
            this.checkIds.push(y);
        });

        if (this.checkIds != undefined && Object.entries(this.checkIds).length == 0) return IENMessage.addCheckIdsFail;
    }

    private ValidateValue(): string {
        const value = this.checkIds.reduce((a, b) => {
            return a + (b.stock.price * b.stock.qtty);
        }, 0);

        if (Number(value) != Number(this.value)) return IENMessage.validateValueFail;

        return IENMessage.success;
    }

    private SetBill(): void {
        const transactionID = Number(Number(this.machineId.substring(this.machineId.length-5))+''+(new Date().getTime()));

        this.bill = {
            uuid: uuid4(),
            clientId: this.clientId,
            qr: '',
            transactionID: transactionID,
            machineId: this.machineId,
            hashM: '',
            hashP: '',
            paymentmethod: this.command,
            paymentref: '',
            paymentstatus: EPaymentStatus.pending,
            paymenttime: new Date(),
            requestpaymenttime: new Date(),
            totalvalue: this.value,
            vendingsales: this.ids,
            isActive: true,
        }
    }

    private Connection(): void {
        this.vendingMachineBillEntity = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + this.ownerUuid, dbConnection);
    }

    private Commit(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const run = await this.vendingMachineBillEntity.create(this.bill, { transaction: this.transaction });
                if (!run) return resolve(IENMessage.commitFail);

                // redisClient.setEx(transactionID + '--_', 60 * 15, ownerUuid);


            } catch (error) {
                resolve(error.message);
            }
        });
    }
}