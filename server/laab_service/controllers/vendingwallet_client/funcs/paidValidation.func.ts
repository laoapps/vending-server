import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, vendingWallet } from "../../../../entities";
import { v4 as uuid4 } from 'uuid';
import { EClientCommand, EEntity, EPaymentStatus, IVendingMachineSale } from "../../../../entities/system.model";
import { VendingMachineBillFactory, VendingMachineBillStatic } from "../../../../entities/vendingmachinebill.entity";
import { readMachineBalance, redisClient, writeErrorLogs, writeLogs, writeMachineBalance, writeSucceededRecordLog } from "../../../../services/service";
import { CashVendingLimiterValidationFunc } from "./cashLimiterValidation.func";
import { CashVendingWalletValidationFunc } from "./cashVendingWalletValidation.func";

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


    private passkeys: string;
    private transactionID: string;
    private amount: number;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`paid validation`, 1);

                this.InitParams(params);

                console.log(`paid validation`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`paid validation`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                const CreateBill = await this.CreateBill();
                if (CreateBill != IENMessage.success) throw new Error(CreateBill);

                console.log(`paid validation`, 4);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`paid validation`, 5);

                console.log(`paid validation`, 6);

                console.log(`paid validation`, 7);

                const TransferCoin = await this.TransferCoin();
                if (TransferCoin != IENMessage.success) throw new Error(TransferCoin);

                console.log(`paid validation`, 8);

                const CallBackConfirmBill = await this.CallBackConfirmBill();
                if (CallBackConfirmBill != IENMessage.success) throw new Error(CallBackConfirmBill);

                console.log(`paid validation`, 9);

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
        console.log(`params`, this.paidLAAB.data.ids);
        if (!(this.machineId && this.cash && this.description && this.paidLAAB)) return IENMessage.parametersEmpty;
        if (this.paidLAAB != undefined && Object.entries(this.paidLAAB).length == 0) return IENMessage.parametersEmpty;
        if (!
            (
                this.paidLAAB.command &&
                this.paidLAAB.data.clientId &&
                this.paidLAAB.time
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

    private CreateBill(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    machineId: this.machineId,
                    ownerUuid: this.ownerUuid,
                    command: this.paidLAAB.command,
                    ids: this.paidLAAB.data.ids,
                    value: this.paidLAAB.data.value,
                    clientId: this.paidLAAB.data.clientId,
                    time: this.paidLAAB.time
                }
                console.log(`params`, params);

                const run = await new CreateBill().Init(params);
                console.log(`after create bill`, run);
                if (run.message != IENMessage.success) throw new Error(run);

                this.transactionID = run.transactionID;
                this.amount = run.amount;

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
                const vendingBalance = readMachineBalance(this.machineId);
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
                let run: any = await axios.post(LAAB_CoinTransfer, params);
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
                    qr: JSON.stringify(h),
                    transactionID: this.transactionID
                }
                this.response = {
                    bill: bill,
                    message: IENMessage.success
                }

                
                if (vendingBalance != undefined && vendingBalance != null) {
                    const balance = Number(vendingBalance) - this.cash;
                    writeMachineBalance(this.machineId, String(balance));
                    return resolve(IENMessage.success);
                }

                run = await new CashVendingWalletValidationFunc().Init({ machineId: this.machineId });
                if (run.message != IENMessage.success) return resolve(run);
                writeMachineBalance(this.machineId, String(run.balance));
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CallBackConfirmBill(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const path = process.env.TEST_CALLBACK || 'http://localhost:9006';
                console.log(`path`, path);
                const params = {
                    command: EClientCommand.confirmLAAB,
                    data:{
                        tranid_client: this.transactionID,
                        amount: this.amount
                    }
                }
                console.log(`params`, params);
                const run = await axios.post(path, params);
                
                console.log(`confirm`, run.data);
                if (run.data.status != 1) {
                    writeErrorLogs(IENMessage.laabConfirmBillFail, run.data);
                    return resolve(IENMessage.confirmBillFail)
                } else {
                    writeSucceededRecordLog(IENMessage.laabConfirmBillSuccess, run.data);
                }

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

}

class CreateBill {

    private machineId: string;
    private ownerUuid: string;

    private command: string;
    private ids: Array<any> = [];
    private value: number;
    private clientId: string;
    private time: string;



    private checkIds: Array<any> = [];
    private transactionID: number;
    private bill: any = {} as any;
    private vendingMachineBillEntity: VendingMachineBillStatic;
    private response: any = {} as any;

    constructor() {}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                console.log(`create bill`, 1);

                this.InitParams(params);

                console.log(`create bill`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create bill`, 3);

                const AddCheckIds = this.AddCheckIds();
                if (AddCheckIds != IENMessage.success) throw new Error(AddCheckIds);

                console.log(`create bill`, 4);

                const ValidateValue = this.ValidateValue();
                if (ValidateValue != IENMessage.success) throw new Error(ValidateValue);

                this.SetBill();

                console.log(`create bill`, 5);

                const Connection = await this.Connection();
                if (Connection != IENMessage.success) throw new Error(Connection);

                console.log(`create bill`, 6);

                this.Connection();

                console.log(`create bill`, 7);

                const Commit = await this.Commit();
                if (Commit != IENMessage.success) throw new Error(Commit);

                console.log(`create bill`, 8);

                resolve(this.response);

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

        return IENMessage.success;
    }

    private ValidateValue(): string {
        const value = this.checkIds.reduce((a, b) => {
            return a + (b.stock.price * b.stock.qtty);
        }, 0);

        if (Number(value) != Number(this.value)) return IENMessage.validateValueFail;

        return IENMessage.success;
    }

    private SetBill(): void {
        this.transactionID = Number(Number(this.machineId.substring(this.machineId.length-5))+''+(new Date().getTime()));

        this.bill = {
            uuid: uuid4(),
            clientId: this.clientId,
            qr: '',
            transactionID: this.transactionID,
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

    private Connection(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const connect = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + this.ownerUuid, dbConnection)
                await connect.sync();
                this.vendingMachineBillEntity = connect;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        })
    }

    private Commit(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const run = await this.vendingMachineBillEntity.create(this.bill);
                if (!run) return resolve(IENMessage.commitFail);

                redisClient.setEx(this.transactionID + '--_', 60 * 15, this.ownerUuid);

                this.response = {
                    transactionID: this.transactionID,
                    amount: this.value,
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}