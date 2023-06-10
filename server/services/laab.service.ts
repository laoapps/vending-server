import { Response } from "express";
import * as jwt from 'jsonwebtoken';
import {createClient}from 'redis';
import { compareSync, hashSync } from 'bcryptjs';

const short = require('short-uuid');
const translate = short();

const LAABbase: string = 'http://localhost:30000/api/v1/laoapps_ewallet/';
const EPINBase: string = 'http://localhost:30001/api/';

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



export const redisHost=process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost';
export const redisPort = 6379;

export const message = (data: any, message: string, status: number, res: Response) => {
    res.send({ info: data, message: message, status: status });
}

export enum IENMessage {
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


