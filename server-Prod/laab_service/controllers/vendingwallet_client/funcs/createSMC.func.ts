import { Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, jwtEncode, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { genCode, genModel, genQRCode } from "../../../../services/epin.service";
import { dbConnection, epinshortcodeEntity, vendingWallet } from "../../../../entities";
import jwt from "jsonwebtoken";
import { writeMachineBalance } from "../../../../services/service";

export class CreateSMCFunc {

    private transaction: Transaction;
    private machineId:string;


    private phonenumber: string;
    private cash: number;
    private description: string;

    private sender: string;
    private receiver: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private name: string;
    private balance: number;

    private laabuuid: string;
    private coinwallet: string;
    private token: string;
    private otps: Array<any> = [];
    private otpKey: Array<any> = [];
    private otpkeyFormat: any = {} as any;
    private vKey: string;
    private otp: string;

    private detail: any = {} as any;
    private bill: any = {} as any;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {

                console.log(`create smc`, 1);

                this.InitParams(params);

                console.log(`create smc`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create smc`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`create smc`, 4);

                const FindMyLAABWallet = await this.FindMyLAABWallet();
                if (FindMyLAABWallet != IENMessage.success) throw new Error(FindMyLAABWallet);

                console.log(`create smc`, 5);

                const CreateOTPKey = await this.CreateOTPKey();
                if (CreateOTPKey != IENMessage.success) throw new Error(CreateOTPKey);

                console.log(`create smc`, 6);

                const CreateSmartContract = await this.CreateSmartContract();
                if (CreateSmartContract != IENMessage.success) throw new Error(CreateSmartContract);

                console.log(`create smc`, 7);

                const CreateEPINShortCode = await this.CreateEPINShortCode();
                if (CreateEPINShortCode != IENMessage.success) throw new Error(CreateEPINShortCode);

                console.log(`create smc`, 8);

                await this.transaction.commit();
                resolve(this.response);
                
            } catch (error) {

                await this.transaction.rollback();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
        this.phonenumber = params.phonenumber;
        this.cash = params.cash;
        this.description = params.description;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.phonenumber && this.cash && this.description)) return IENMessage.parametersEmpty;
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

                const params = {
                    sender: this.sender,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_FindMyWallet, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.laabuuid = run.data.info.name;
                this.coinwallet = this.coinListId + '_' + run.data.info.name + '__' + this.coinCode;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateOTPKey(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let otp: string = '';
                for(let i = 0; i < 1; i++) {
                    otp = '';
                    for(let i = 0; i < 10; i++) {
                        otp += Math.floor(Math.random() * 9);
                    }
                    if (this.otpKey.includes(otp)) {
                        i--;
                        continue;
                    }
                    this.otps.push(otp);
                    this.otpKey.push({ otp: otp, value: this.cash });
                }

                const jwtData = {
                    uuid: this.laabuuid
                }
                this.token = jwtEncode(jwtData);

                const format = {
                    data: {
                        smcType: 'coupon',
                        sender: this.coinwallet,
                        receiver: '',
                        criterias: [
                        {
                            otps: this.otpKey,
                            total_amount_using: this.cash
                        }
                        ],
                        validators: '',
                        judges: '',
                        amount: this.cash,
                        description: '',
                        limitBlock: 10
                    },
                    token: this.token,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }

                const run = await axios.post(LAAB_GenerateVendingOTP, format);
                if (run.data.status != 1) return resolve(run.data.message);

                delete format.phonenumber;
                delete format.passkeys;

                this.otpkeyFormat = format;
                this.vKey = run.data.info.verifyKey;
                this.otp = run.data.info.otp;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);     
            }
        });
    }

    private CreateSmartContract(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    key: this.vKey,
                    name: 'user_manager',
                    data: this.otpkeyFormat.data,
                    otp: this.otp,
                    
                    
                    // access by passkey
                    token: this.token,
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }

                const run = await axios.post(LAAB_CreateCouponCoinWalletSMC, params);
                if (run.data.status != 1) return resolve(run.data.message);

                const genEPINModel = genModel(this.coinListId);
                const qrcode = genQRCode(1, genEPINModel.clientValue);
                const code = genCode(1, genEPINModel.clientValue);

                this.detail = {
                    name: this.coinwallet,
                    link: run.data.info.smcResponse.smart_contract_link,
                    price: this.cash,
                    sender: this.coinwallet,
                    usecode: false,
                    items: [{
                        qrcode: qrcode,
                        code: code,
                        otps: this.otps,
                    }]
                }
                this.bill = run.data.info.bill;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateEPINShortCode(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    ownerUuid: this.ownerUuid,
                    creator: this.sender,
                    phonenumber: this.phonenumber,
                    SMC: {
                        detail: this.detail,
                        bill: this.bill,
                    },
                    EPIN: {
                        destination: '',
                        coinname: '',
                        name: ''
                    },
                    counter: {
                        cash:{
                            hash: '',
                            info: ''
                        }
                    }
                }

                const run = await epinshortcodeEntity.create(params, { transaction: this.transaction });
                if (!run) return resolve(IENMessage.createEPINShortCodeFail);
                
                writeMachineBalance(this.machineId, '0');

                this.response = {
                    detail: this.detail,
                    bill: this.bill,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}