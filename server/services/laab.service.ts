import { NextFunction, Request, Response } from "express";
import * as jwt from 'jsonwebtoken';
import {createClient}from 'redis';
import { compareSync, hashSync } from 'bcryptjs';
import axios from "axios";

const short = require('short-uuid');
const translate = short();

const LAABbase: string = process.env.LAAB_URL + '/api/v1/laoapps_ewallet/' || 'http://localhost:30000/api/v1/laoapps_ewallet/';
const EPINBase: string =  process.env.EPIN_URL + '/api/' || 'http://localhost:30001/api/';

export const LAAB_Register2: string = LAABbase + 'user/register2';
export const LAAB_FindMyWallet: string = LAABbase + 'user/find_my_wallet';
export const LAAB_GeneratePasskeys: string = LAABbase + 'user/get_passkeys';
export const LAAB_Login: string = LAABbase + 'user/login';

export const LAAB_FindVendingCoin: string = LAABbase + 'pex/coin_currency/search_currency_list_page';
export const LAAB_FindMyCoinWallet: string = LAABbase + 'pex/coin_currency/show_my_coin_wallet';
export const LAAB_ShowMyCoinWalletBalance: string = LAABbase + 'pex/coin_currency/show_sender_coin_to_coin_balance';
export const LAAB_RegisterCoin: string = LAABbase + 'pex/exchange_service/coin_register';
export const LAAB_CoinTransfer: string = LAABbase + 'pex/exchange_service/coin_to_coin_transaction';
export const LAAB_ShowIncomeReport: string = LAABbase + 'pex/coin_currency/show_sender_coin_to_coin_income_list';
export const LAAB_ShowExpendReport: string = LAABbase + 'pex/coin_currency/show_sender_coin_to_coin_expend_list';
export const LAAB_TextHashVerify: string = LAABbase + 'pex/coin_currency/coin_wallet_hash_verifying';
export const LAAB_QRHashVerify: string = LAABbase + 'pex/coin_currency/coin_wallet_hash_verifying_qrmode';

export const LAAB_GenerateVendingOTP: string = LAABbase + 'psmc/coupon/generate_vending_otp';
export const LAAB_CreateCouponCoinWalletSMC: string = LAABbase + 'psmc/coupon/coin_expend_transaction';
export const LAAB_ShowCouponCoinWalletSMC: string = LAABbase + 'psmc/coupon/show_coin_coupon_list_page';



export const EPIN_Generate: string = EPINBase + 'topup/generate';



// export const redisHost=process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost';
// export const redisPort = 6379;

const usermanagerkey: string = '04573b1b-22f5-47f8-979c-fe4bc137a857';
export const USERMANAGER_URL = process.env.USERMANAGER_HOST ? process.env.USERMANAGER_HOST : `http://localhost:4500`;
export const SetHeaders = { headers: { 'Content-Type': 'application/json', 'BackendKey': usermanagerkey } };


export const message = (data: any, message: string, status: number, res: Response) => {
    res.send({ info: data, message: message, status: status });
}

export enum IENMessage {
    thisIsNotYourToken = 'this is not your token',
    InvalidAuthorizeFormat = 'invalid authorize format',
    invalidToken = 'invalid token',
    needToken = 'need token!',
    laabConfirmBillFail = 'laab confirm bill fail',
    laabConfirmBillSuccess = 'laab confirm bill success',
    confirmBillFail = 'confirm bill fail',
    notFoundTransactionID = 'not found transaction ID',
    transactionTimeOut = 'transaction time out',
    validateValueFail = 'validate value fail',
    addCheckIdsFail = 'add check ids fail',
    invalidValue = 'invalid value',
    invalidCoin = 'invalid coin',
    cashValidationFail = 'cash validation fail',
    cashValidationFail001 = 'cash validation fail #001',
    cashValidationFail002 = 'cash validation fail #002',
    thisIsNotVendingCoin = 'this is not vending coin',
    merchantHasNotCreatedYet = 'merchant has not created yet',
    notFoundYourVendingWalletCoin = 'not found your vending wallet coin',
    notFoundYourVendingWallet = 'not found your vending wallet',
    invalidVendingWallet = 'invalid vending wallet',
    vendingWalletHasAlreadyExisted = 'vending wallet has already existed',
    invalidStatement = 'invalid statement',
    invalidSenderOrOwnerUuid = 'invalid sender or owneruuid',
    invalidVendingLimiter = 'invalid vending limiter',
    notFoundYourVendingLimiterCoin = 'not found your vending limiter coin',
    invalidMerchant = 'invalid merchant',
    notFoundYourMerchantCoin = 'not found your merchant coin',
    updatePasskeysFail = 'update passkeys fail',
    createDatabaseFail = 'create database fail',
    invalidReceiver = 'invalid receiver',
    invalidSender = 'invalid sender',
    notFoundSenderOrReceiver = 'not found sender or receiver',
    notFoundYourVendingLimiter = 'not found your vending limiter',
    notFoundYourMerchant = 'not found your merchant',
    vendingLimiterHasAlreadyExisted = 'vending limiter has already existed',
    merchantHasAlreadyExisted = 'merchant has already existed',
    commitFail = 'commit fail',
    success = 'success',
    parametersEmpty = 'parameters empty'
}

export enum IStatus {
    success = 1,
    unsuccess = 0
}


export const translateUToSU = (str: string): string => { return translate.fromUUID(str); }
export const translateSUToU = (str: string): string => { return translate.toUUID(str); }

export const jwtEncode = (data: any) => {
    try {
        return jwt.sign({
            data,
        }, IKeys.jwtKey, { expiresIn: '10000000000000H' });
    } catch (error) {
        console.log(error);
        return 'null';
    }
}

export enum IKeys {
    jwtKey = 'Dx4YsbptOGuHmL94qdC2YAPqsUFpzJkc',
}


export function decimalToHex (value: string, padding: number) {
    let hex: string = Number(value).toString(16);
    while(hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
  } 

export function hexToDecimal(value: string) {
    return parseInt(value, 16);
}

export function APIAdminAccess(req: Request, res: Response, next: NextFunction) {
    try {
        
        const func = new VerifyToken();
        const data = req.body;
        func.Init(data).then(run => {
            if (run.message != IENMessage.success) throw new Error(run);
            next();
        }).catch(error => message([], error.message, IStatus.unsuccess, res));

    } catch (error) {
        message([], error.message, IStatus.unsuccess, res);
    }
}


class VerifyToken {

    private token: string;
    private ownerUuid: string;
    private phonenumber: string;
    
    constructor() {}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {


                console.log(`verify token`, 1);

                this.InitParams(params);
        
                console.log(`verify token`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);
    
                console.log(`verify token`, 3);

                this.SetTypeOfParams();
    
                console.log(`verify token`, 4);

                const ConfirmOwnToken = await this.ConfirmOwnToken();
                if (ConfirmOwnToken != IENMessage.success) throw new Error(ConfirmOwnToken);
    
                console.log(`verify token`, 5);

                const VerifyFromUsermanager = await this.VerifyFromUsermanager();
                if (VerifyFromUsermanager.message != IENMessage.success) throw new Error(IENMessage.invalidToken)
                console.log(`verify token`, 6);

                resolve(VerifyFromUsermanager);
                
            } catch (error) {
                
                resolve(error.message);

            }
        });
    }

    private InitParams(params: any): void {
        console.log(params);
        
        this.token = params.token;
        this.ownerUuid = params.ownerUuid;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid)) return IENMessage.InvalidAuthorizeFormat;
        if (!(this.token)) return IENMessage.needToken;
        return IENMessage.success;
    }   
    
    private SetTypeOfParams(): void {
        this.token = String(this.token);
    }

    private ConfirmOwnToken(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const base64Payload = this.token.split('.')[1];
                const payload = Buffer.from(base64Payload, 'base64');
                const result = JSON.parse(payload.toString());
                const phonenumber: string = result.data.phoneNumber;
                this.phonenumber = phonenumber;
                console.log(`phonenumber`, phonenumber);
                

                // if ownerUuid is phonenumber we will decrypt token for find phone number and compare
                if (this.ownerUuid != undefined && this.ownerUuid != phonenumber) return resolve(IENMessage.thisIsNotYourToken);

                resolve(IENMessage.success);
                
    
            } catch (error) {
                
                resolve(error.message);
    
            }
        })
    }

    private VerifyFromUsermanager(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let validateTokenData: any = {
                    object: "authorize",
                    method: "validateToken",
                    data: {
                        token: this.token,
                        service: 'LAABWALLET'
                    }
                }
                console.log(`--->`, validateTokenData);
                const run = await axios.post(USERMANAGER_URL, validateTokenData, SetHeaders);
                console.log(`response`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);

                const response = {
                    phonenumber: this.phonenumber,
                    uuid: run.data.data[0],
                    message: IENMessage.success
                }
                resolve(response);

            } catch (error) {
                
                resolve(error.message);

            }
        });
    }
    
}