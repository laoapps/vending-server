import { NextFunction, Request, Response } from "express";
import * as jwt from 'jsonwebtoken';
import {createClient}from 'redis';
import { compareSync, hashSync } from 'bcryptjs';
import axios from "axios";
import crypto from 'crypto';
import EC from 'elliptic';
const ec = new EC.ec('secp256k1');


const short = require('short-uuid');
const translate = short();

const LAABbase: string = process.env.LAAB_URL + '/api/v1/laoapps_ewallet/' || 'http://localhost:30000/api/v1/laoapps_ewallet/';
const EPINBase: string =  process.env.EPIN_URL + '/api/' || 'http://localhost:30001/api/';
export const Self_CALLBACK_CashValidation: string = `${process.env.TEST_CALLBACK}/laab/client/cash_validation` || `http://localhost:9006/laab/client/cash_validation`;
export const Self_CALLBACK_CashinValidation: string = `${process.env.TEST_CALLBACK}/laab/client/cash_in_validation` || `http://localhost:9006/laab/client/cash_in_validation`;

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
export const LAAB_ShowSMCExpendReport: string = LAABbase + 'pex/coin_currency/show_sender_coin_to_csmc_expend_list';
export const LAAB_TextHashVerify: string = LAABbase + 'pex/coin_currency/coin_wallet_hash_verifying';
export const LAAB_QRHashVerify: string = LAABbase + 'pex/coin_currency/coin_wallet_hash_verifying_qrmode';

export const LAAB_GenerateVendingOTP: string = LAABbase + 'psmc/coupon/generate_vending_otp';
export const LAAB_CreateCouponCoinWalletSMC: string = LAABbase + 'psmc/coupon/coin_expend_transaction';
export const LAAB_ShowCouponCoinWalletSMC: string = LAABbase + 'psmc/coupon/show_coin_coupon_list_page';

// forward
export const LAAB_FORWARD_ShowWalletLAABCoinBalance: string = LAABbase + 'forward/wallet/laab_coin/show_balance';


export const EPIN_Generate: string = EPINBase + 'topup/generate';
export const EPIN_FindQRScan: string = EPINBase + 'topup/findqrscan';
export const EPIN_QRScan: string = EPINBase + 'topup/qrscan';



// export const redisHost=process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost';
// export const redisPort = 6379;

const usermanagerkey: string = '04573b1b-22f5-47f8-979c-fe4bc137a857';
export const USERMANAGER_URL = process.env.USERMANAGER_HOST ? process.env.USERMANAGER_HOST : `http://localhost:4500`;
export const SetHeaders = { headers: { 'Content-Type': 'application/json', 'BackendKey': usermanagerkey } };


export const message = (data: any, message: string, status: number, res: Response) => {
    res.send({ info: data, message: message, status: status });
}

export enum IENMessage {
    updateUniqueVersionFail = 'update unique version fail',
    createVersionFail = 'create version fail',
    invalidFile = 'invalid file',
    updateVendingVersionDetailFail = 'update vending version detail fail',
    notFoundVendingVersion = 'not found vending version',
    saveVendingNewVersionFail = 'save vending new version fail',
    thisVersionHasAlreadyExisted = 'this version has already existed',
    invalidAnyVersion = 'invalid any version',
    invalidAnyMachineId = 'invalid any machine id',
    pleaseEnterAnyMachine = 'please enter any machine',
    invalidLockerWallet = 'invalid locker wallet',
    loadBalanceFail = 'load balance fail',
    youCanNotAddYourOwnToBeSubadminRole = 'you can not add your own to be sub admin role',
    invalidateToDate = 'invalid to date',
    invalidFromDate = 'invalid from date',
    invalidateRevertDate = 'invalid revert date',
    invalidBeginDate = 'invalid begin date',
    saveSaleReportFail = 'save sale report fail',
    invalidReportParameters = 'invalid report parameters',
    createMMoneyBillFail = 'create MMoney bill fail',
    notFoundBill = 'not found bill',
    createLAABBillFail = 'create LAAB bill fail',
    notFoundSubadmin = 'not found sub admin',
    incorrectImei = 'incorrect imei',
    notFoundMachine = 'not found machine id',
    notFoundMachineIdOrEmei = 'not found machine id or emei',
    notFoundMachineForRemove = 'not found machine for remove',
    thisSubAdminHasAlreadyProvidedThisMachine = 'this sub admin has already provided this machine',
    otherSubadminHasAlreadyProvidedThisMachine = 'other sub admin has already provided this machine',
    thisMachineIdHasAlreadyProvided = 'this machine id has already provided',
    dataUnmatch = 'data unmatch',
    invalidData = 'invalid data',
    createSubadminFail = 'create sub admin fail',
    subadminHasAlreadyCreateByThisOwnerVending = 'sub admin has already created by this owner vending',
    subadminHasNotLAABAccount = 'sub admin has not LAAB account',
    notImplemented = 'not implemented',
    detailUmatch = 'detail unmatch',
    scanQREPINsuccessButSaveLogEPINShortCodeFail = 'scan QREPIN success but save log EPIN short code fail',
    updateEPINShortCodeFail = 'update EPIN short code fail',
    notFoundEPINShortCode = 'not found EPIN short code',
    createEPINShortCodeFail = 'create EPIN short code fail',
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
            req.body.ownerUuid = run.uuid;
            req.body.ownerPhonenumber = run.phonenumber;
            // res.locals['ownerUuid'] = run.uuid;
            // res.locals['phonenumber'] = run.phonenumber;
            next();
        }).catch(error => message([], error.message, IStatus.unsuccess, res));

    } catch (error) {
        message([], error.message, IStatus.unsuccess, res);
    }
}


class VerifyToken {

    private token: string;
    
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
    }
    private ValidateParams(): string {
        if (!(this.token)) return IENMessage.needToken;
        return IENMessage.success;
    }   
    
    private SetTypeOfParams(): void {
        this.token = String(this.token);
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
                console.log(`response verify`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);

                const response = {
                    phonenumber: run.data.data[0].phoneNumber,
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

export class LAABHashService {

    constructor() {}

    public CalculateHash(s: string) {
        return crypto.createHash('sha256').update(s).digest('hex');
    }

    public Sign(hashTx: string = '', privateKey: string) {
        try {
            // Convert string to buffer 
            let data = Buffer.from(hashTx, 'hex');
            // Sign the data and returned signature in buffer 
            let signature = ec.sign(data, Buffer.from(privateKey, 'hex'), 'base64');
            // Convert returned buffer to base64
            // Export DER encoded signature in Array
            let derSign = signature.toDER('hex');
            return derSign;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

export enum IFranchiseStockSignature {
    publickey = `0484d25a8e14a1de4b92fa688a1ee75a9b7d615abb51c382f3fd5bbb09dcefaf366ff43508a84c56fab1e89221e9cc1a193109f5998d599fecaa1c860f48f95de3`,
    privatekey = `64bc06884c540d86f8c5c72097aca12a5fd03640a66b2e40039545d1f4975207`
}

// export enum ILAABKeys {
//     jwtotp = `ea718210b4d4dbcfdb0a663f8d914891aa20c38f265d8c6fe9c49f543de35555163d094bc3ec7dc9551216287dd2bb09991cc96ab07b2b4bd5cc1cd122c81399a557fd02bf18e8deb45fddd2fd35919c`
// }



export const IForwordKeys = { name: 'VENDING', value: `gEWMNBZPzTXKSWrCUPUeN4MMv2qUzaljKOFjkDQYGRGT2GQ5GGP6oPGf0p4lptfXjAZ97B8H8G1w96igMrXDPItVrrLVVrSYnHBX` }

