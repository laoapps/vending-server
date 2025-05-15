import { NextFunction, Request, Response, Router } from 'express';
import Queue from "bull";
import events from "events";
import { ReadPanel as AdminReadPanel } from "../laab_service/controllers/vendingwallet_admin/panels/read.panel";
import { WritePanel as AdminWritePanel } from "../laab_service/controllers/vendingwallet_admin/panels/write.panel";
import { ReadPanel as ClientReadPanel } from "../laab_service/controllers/vendingwallet_client/panels/read.panel";
import { WritePanel as ClientWritePanel } from "../laab_service/controllers/vendingwallet_client/panels/write.panel";
import { ReadPanel as SubadminReadPanel } from "../laab_service/controllers/vendingwallet_subadmin/panels/read.panel";
import { WritePanel as SubadminWritePanel } from "../laab_service/controllers/vendingwallet_subadmin/panels/write.panel";
import { readActiveMmoneyUser, redisHost, redisPort, writeActiveMmoneyUser } from '../services/service';
import { SocketServerZDM8 } from './socketServerZDM8';
import { APIAdminAccess, IENMessage, IStatus, message } from '../services/laab.service';
import { InventoryZDM8 } from './inventoryZDM8';
import moment from 'moment';
import Cryto from 'crypto';
import axios from 'axios';
import PubNub from 'pubnub';

events.defaultMaxListeners = 100;
events.EventEmitter.prototype.setMaxListeners(100);
// const redisHost = process.env.REDIS_LOCAL_HOST || 'localhost';
// const redisPort = Number(process.env.REDIS_LOCAL_PORT) || 6379;

export let QCreateMerchant = new Queue('QCreateMerchant', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateMerchantCoin = new Queue('QCreateMerchantCoin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateVendingLimiter = new Queue('QCreateVendingLimiter', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateVendingLimiterCoin = new Queue('QCreateVendingLimiterCoin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateVendingWallet = new Queue('QCreateVendingWallet', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateVendingWalletCoin = new Queue('QCreateVendingWalletCoin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateLockerWallet = new Queue('QCreateLockerWallet', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateLockerWalletCoin = new Queue('QCreateLockerWalletCoin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QPaidValidation = new Queue('QPaidValidation', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateSMC = new Queue('QCreateSMC', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateEPIN = new Queue('QCreateEPIN', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QReCreateEPIN = new Queue('QReCreateEPIN', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCounterCashout_CashValidation = new Queue('QCounterCashout_CashValidation', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });


export let QCreateSubadmin = new Queue('QCreateSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QDeleteSubadmin = new Queue('QDeleteSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QAddProvideToSubadmin = new Queue('QAddProvideToSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QRemoveProvideFromSubadmin = new Queue('QRemoveProvideFromSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });

export class LaabVendingAPI {

    private ports = 31223;
    private ssocket: SocketServerZDM8 = {} as SocketServerZDM8;
    private inventoryZDM8: InventoryZDM8;

    private adminQueues: any = {
        QCreateMerchant:QCreateMerchant,
        QCreateMerchantCoin: QCreateMerchantCoin,
        QCreateVendingLimiter: QCreateVendingLimiter,
        QCreateVendingLimiterCoin: QCreateVendingLimiterCoin,
        QCreateVendingWallet: QCreateVendingWallet,
        QCreateVendingWalletCoin: QCreateVendingWalletCoin,
        QCreateLockerWallet: QCreateLockerWallet,
        QCreateLockerWalletCoin: QCreateLockerWalletCoin,
        QCounterCashout_CashValidation: QCounterCashout_CashValidation,
        QReCreateEPIN: QReCreateEPIN,

    }
    private adminReadPanel: AdminReadPanel;
    private adminWritePanel: AdminWritePanel;

    private clientQueues: any = {
        QPaidValidation: QPaidValidation,
        QCreateEPIN: QCreateEPIN,
        QCreateSMC: QCreateSMC,
    }
    private clientReadPanel: ClientReadPanel;
    private clientWritePanel: ClientWritePanel;

    private subadminQueues: any = {
        QCreateSubadmin: QCreateSubadmin,
        QDeleteSubadmin: QDeleteSubadmin,
        QAddProvideToSubadmin: QAddProvideToSubadmin,
        QRemoveProvideFromSubadmin: QRemoveProvideFromSubadmin,
    }
    private subadminReadPanel: SubadminReadPanel;
    private subadminWritePanel: SubadminWritePanel;

    constructor(router: Router,ssocket:SocketServerZDM8, inventoryZDM8: InventoryZDM8) {
        this.ssocket = ssocket;
        this.inventoryZDM8 = inventoryZDM8;
        
        this.adminReadPanel = new AdminReadPanel();
        this.adminWritePanel = new AdminWritePanel(this.adminQueues);

        this.clientReadPanel = new ClientReadPanel();
        this.clientWritePanel = new ClientWritePanel(this.clientQueues);

        this.subadminReadPanel = new SubadminReadPanel();
        this.subadminWritePanel = new SubadminWritePanel(this.subadminQueues);


        // merchant
        router.post('/laab/admin/create_merchant', APIAdminAccess, this.adminWritePanel.CreateMerchant.bind(this.adminWritePanel));
        router.post('/laab/admin/create_merchant_coin', APIAdminAccess, this.adminWritePanel.CreateMerchantCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_merchant', APIAdminAccess, this.adminReadPanel.FindMerchant.bind(this.adminReadPanel));
        router.post('/laab/admin/find_merchant_coin', APIAdminAccess, this.adminReadPanel.FindMerchantCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_merchant_coin_balance', APIAdminAccess, this.adminReadPanel.ShowMerchantCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/show_merchant_report', APIAdminAccess, this.adminReadPanel.ShowMerchantReport.bind(this.adminReadPanel));
        router.post('/laab/admin/merchant_coin_transfer', APIAdminAccess, this.adminReadPanel.MerchantCoinTransfer.bind(this.adminReadPanel));





        router.post('/laab/admin/login', this.adminReadPanel.Login.bind(this.adminReadPanel));
        router.post('/laab/admin/text_hash_verify', APIAdminAccess, this.adminReadPanel.TextHashVerify.bind(this.adminReadPanel));
        router.post('/laab/admin/qr_hash_verify', APIAdminAccess, this.adminReadPanel.QRHashVerify.bind(this.adminReadPanel));






        // vending limiter
        router.post('/laab/admin/create_vending_limiter', APIAdminAccess, this.adminWritePanel.CreateVendingLimiter.bind(this.adminWritePanel));
        router.post('/laab/admin/create_vending_limiter_coin', APIAdminAccess, this.adminWritePanel.CreateVendingLimiterCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_vending_limiter', APIAdminAccess, this.adminReadPanel.FindVendingLimiter.bind(this.adminReadPanel));
        router.post('/laab/admin/find_vending_limiter_coin', APIAdminAccess, this.adminReadPanel.FindVendingLimiterCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_limiter_coin_balance', APIAdminAccess, this.adminReadPanel.ShowVendingLimiterCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_limiter_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingLimiterCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_limiter_report', APIAdminAccess, this.adminReadPanel.ShowVendingLimiterReport.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_limiter_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingLimiterCoinTransfer.bind(this.adminReadPanel));




        // vending wallet
        router.post('/laab/admin/create_vending_wallet', APIAdminAccess, this.adminWritePanel.CreateVendingWallet.bind(this.adminWritePanel));
        router.post('/laab/admin/create_vending_wallet_coin', APIAdminAccess, this.adminWritePanel.CreateVendingWalletCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_vending_wallet', APIAdminAccess, this.adminReadPanel.FindVendingWallet.bind(this.adminReadPanel));
        router.post('/laab/admin/find_vending_wallet_coin', APIAdminAccess, this.adminReadPanel.FindVendingWalletCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_wallet_coin_balance', APIAdminAccess, this.adminReadPanel.ShowVendingWalletCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_wallet_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_wallet_report', APIAdminAccess, this.adminReadPanel.ShowVendingWalletReport.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_wallet_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/find_epinshortcode',   APIAdminAccess, this.adminReadPanel.FindEPINShortCode.bind(this.adminReadPanel));
        router.post('/laab/admin/show_epinshortcode',   APIAdminAccess, this.adminReadPanel.ShowEPINShortCode.bind(this.adminReadPanel));
        router.post('/laab/admin/counter_cashout_cash_validation', APIAdminAccess, this.adminWritePanel.CounterCashout_CashValidation.bind(this.adminWritePanel));
        router.post('/laab/admin/recreate_epin', APIAdminAccess, this.adminWritePanel.ReCreateEPIN.bind(this.adminWritePanel));





        // locker wallet
        router.post('/laab/admin/create_locker_wallet', APIAdminAccess, this.adminWritePanel.CreateVendingWallet.bind(this.adminWritePanel));
        router.post('/laab/admin/create_locker_wallet_coin', APIAdminAccess, this.adminWritePanel.CreateVendingWalletCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_locker_wallet', APIAdminAccess, this.adminReadPanel.FindVendingWallet.bind(this.adminReadPanel));
        router.post('/laab/admin/find_locker_wallet_coin', APIAdminAccess, this.adminReadPanel.FindVendingWalletCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_locker_wallet_coin_balance', APIAdminAccess, this.adminReadPanel.ShowVendingWalletCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/locker_wallet_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/show_locker_wallet_report', APIAdminAccess, this.adminReadPanel.ShowVendingWalletReport.bind(this.adminReadPanel));
        router.post('/laab/admin/locker_wallet_coin_transfer', APIAdminAccess, this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));





        // vending client
        router.post('/laab/client/paid_validation', this.APIMachineAccess, this.clientWritePanel.PaidValidation.bind(this.clientWritePanel));
        router.post('/laab/client/create_smart_contract', this.APIMachineAccess, this.clientWritePanel.CreateSMC.bind(this.clientWritePanel));
        router.post('/laab/client/create_epin', this.APIMachineAccess, this.clientWritePanel.CreateEPIN.bind(this.clientWritePanel));


        router.post('/laab/client/show_vending_wallet_coin_balance', this.APIMachineAccess, this.clientReadPanel.ShowVendinWalletCoinBalance.bind(this.clientReadPanel));
        router.post('/laab/client/cash_validation', this.APIMachineAccess, this.clientReadPanel.CashVendingLimiterValidation.bind(this.clientReadPanel));
        router.post('/laab/client/cash_vending_wallet_validation', this.APIMachineAccess, this.clientReadPanel.CashVendingWalletValidation.bind(this.clientReadPanel));
        router.post('/laab/client/cash_in_validation', this.APIMachineAccess, this.clientReadPanel.CashinValidation.bind(this.clientReadPanel));
        router.post('/laab/client/load_smart_contract', this.APIMachineAccess, this.clientReadPanel.LoadSMC.bind(this.clientReadPanel));
        router.post('/laab/client/transfer_validation', this.APIMachineAccess, this.clientReadPanel.TransferValidation.bind(this.clientReadPanel));





        router.post('/mmoney/client/cashout_validation', this.APIMachineAccess, (req: Request, res: Response) => {
            const d = req.body;
            try {
                if(!readActiveMmoneyUser(d.phonenumber)) throw new Error('Mmoney user was not verified')
                this.inventoryZDM8.creditMachineMMoney(d).then(run => {
                if (run.message != IENMessage.success) {
                    message([], run, IStatus.unsuccess, res);
                } else {
                    delete run.message;
                    message(run, IENMessage.success, IStatus.unsuccess, res);
                }
                writeActiveMmoneyUser(d.phonenumber,'')
            }).catch(error => message([], error.message, IStatus.unsuccess, res))
            // message([], IENMessage.notImplemented, IStatus.unsuccess, res);
            } catch (error) {
                message([], error.message, IStatus.unsuccess, res)
            }
            
        });





        // vending subadmin
        router.post('/laab/sub_admin/create_subadmin', APIAdminAccess, this.subadminWritePanel.CreateSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/delete_subadmin', APIAdminAccess, this.subadminWritePanel.DeleteSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/add_provide_to_subadmin', APIAdminAccess, this.subadminWritePanel.AddProvideToSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/remove_provide_from_subadmin', APIAdminAccess, this.subadminWritePanel.RemoveProvideFromSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/show_subadmin', APIAdminAccess, this.subadminReadPanel.ShowSubadmin.bind(this.subadminReadPanel));
        router.post('/laab/sub_admin/find_subadmin', APIAdminAccess, this.subadminReadPanel.FindSubadmin.bind(this.subadminReadPanel));
        router.post('/laab/sub_admin/find_epinshortcode', APIAdminAccess, this.subadminReadPanel.FindEPINShortcode.bind(this.subadminReadPanel));
        router.post('/laab/client/find_epinshortcode', APIAdminAccess, this.clientReadPanel.FindEPINShortcode.bind(this.clientReadPanel));



        //LVB API
        router.post('/lvb/api/qr', this.LVBAPIQR);
        router.post('/lvb/api/login', this.LVBAPILogin);
        router.post('/lvb/api/gettransaction', this.LVBAPIGetTransaction);
        router.post('/lvb/api/gettransactionbyid', this.LVBAPIGetTransactionByID);
        // callback payment
        router.post('/callback/lvb', this.LVBCallbackRecord);



        QCreateMerchant.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateMerchant(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateMerchantCoin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateMerchantCoin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateVendingLimiter.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateVendingLimiter(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateVendingLimiterCoin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateVendingLimiterCoin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateVendingWallet.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateVendingWallet(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateVendingWalletCoin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateVendingWalletCoin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateLockerWallet.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateLockerWallet(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateLockerWalletCoin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CreateLockerWalletCoin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCounterCashout_CashValidation.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._CounterCashout_CashValidation(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QReCreateEPIN.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.adminWritePanel._ReCreateEPIN(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });




        QPaidValidation.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.clientWritePanel._PaidValidation(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateSMC.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.clientWritePanel._CreateSMC(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QCreateEPIN.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.clientWritePanel._CreateEPIN(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });




        // sub admin
        QCreateSubadmin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.subadminWritePanel._CreateSubadmin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QDeleteSubadmin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.subadminWritePanel._DeleteSubadmin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QAddProvideToSubadmin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.subadminWritePanel._AddProvideToSubadmin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QRemoveProvideFromSubadmin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.subadminWritePanel._RemoveProvideFromSubadmin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        
    }


    private APIMachineAccess = (req: Request, res: Response, next: NextFunction) => {
        try {
            
            const data = req.body;
            if (!(data.token)) throw new Error(IENMessage.needToken);
            console.log(`token`, data.token);
            const run = this.ssocket.findMachineIdToken(data.token);
            console.log(`APIMachineAccess`, run);
            if (run == undefined || run != undefined && Object.entries(run).length == 0) throw new Error(IENMessage.invalidToken);
            req.body.machineId = run.machineId;

            next();

        } catch (error) {
            message([], error.message, IStatus.unsuccess, res);
        }
    }


    // MMONEY

    // UMONEY

    // PSV

    // BCEL


    // JDB
    // Content-Type : << Application/json >>
    // Authorization : << Bearer Token on authentication service >> 
    // SignedHash : << Hash data Key >>
    private  JDBAPIQR(req: Request, res: Response,) {
        const bill_no = new Date().getTime()+'';
        const mobileNo = req.body.mobileNo;
        const amount = req.body.amount;
        const terminalId = req.body.terminalId;
        const terminalLabel = req.body.terminalLabel;
        this.JDBAAPIAuthentication().then(r=>{
            const token = r;
            const x =this.JDBAAPIGenEMVCode(amount,bill_no,mobileNo,terminalId,terminalLabel,token);
            res.send(x);
        })
    }
    
    private  JDBAPICheckTransaction(req: Request, res: Response,) {

        const bill_no = req.body.bill_no;
        this.JDBAAPIAuthentication().then(r=>{
            const token = r;
            const x =this.JDBAAPICheckTransaction(bill_no,token);
            res.send(x);
        })
       

    }
    private async JDBAAPIAuthentication(){
        const url = 'url';
        const headers = {'Content-Type':'Application/json','Authorization':'','SignedHash':''};
        const x = {"requestId": new Date().getTime(), "DORKBOUAKHAM": "PARTNER", "clientId": "DORKBOUAKHAM", "clientScret": "7SZR89S5NRDL8IXNPVXQESSHM6ISAZURIBGJ4HZGMVMU7GX4UW5D3JNTYHKI8NX62T5CZX4BRKKL8QMG2O6DIHLGS02C4WMOPS77"
        }

        //        { "timestamp": "2022-10-28T09:09:31.249063+07:00", "success": true,
        // "status": "OK",
        // "message": "Transaction successful", "transactionId": "56498456465465",
        // "data": { "accessToken":
        // "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJOQ0MiLCJpYXQiOjE2NjY5MjI5NzEsImV4cCI6MTY2NjkyMzk3M X0.xlz6tk894chaXjaLz4dhJxxqIX7yK9T_d40ziFvb4SE",
        // "expiresIn": 999,
        // "tokenType": "Bearer" }
        
        const r = await axios.post(url,x,{headers});
        return r.data;
    }
    private async JDBAAPIGenEMVCode(
        amount:string,
        bill_no:string,
        mobileNo:string,
        terminalId:string,
        terminalLabel:string,
        token:string
        ){
        const url = 'https://dynamicqr.jdbbank.com.la:12000/api/uat/dynamic';
        const headers = {'Content-Type':'Application/json','Authorization':token,'SignedHash':''};

        const x = {
            "requestId":  new Date().getTime(), 
            "partnerId": "NCC",
            "mechantId": "xxxx", 
            "txnAmount": amount, 
            "billNumber": bill_no, 
            "terminalId": terminalId, 
            "terminalLabel": terminalLabel, 
            "mobileNo": mobileNo
        }
        headers.SignedHash= this.JDBAPIHashing(JSON.stringify(x));

        //        { "timestamp": "2022-10-28T09:09:31.249063+07:00", "success": true,
        // "status": "OK",
        // "message": "Transaction successful", "transactionId": "56498456465465",
        // "data": { "accessToken":
        // "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJOQ0MiLCJpYXQiOjE2NjY5MjI5NzEsImV4cCI6MTY2NjkyMzk3M X0.xlz6tk894chaXjaLz4dhJxxqIX7yK9T_d40ziFvb4SE",
        // "expiresIn": 999,
        // "tokenType": "Bearer" }
        const r = await axios.post(url,x,{headers});
        return r.data;
        // {
        //     "timestamp": "2022-11-03 13:56:21.806", "success": true,
        //     "message": "SUCCESS", "transactionId": "2022110314567895", "status": "OK",
        //     "data": {
        //     "mcid": "OKQBPBVPUSVI1LOJ9FYYFZBQ5", "emv":
        //     "00020101021238680016A005266284662577010832170418020300203259YBH6W1OMFDJ1EIQMU6XP5X5U520 4525153034185405200005802LA5910LaoLottery6009Vientiane62660112JDB547885468020100301004010050100 603NCC070912131212108010090106304A8D6"
        //     } }
    }
    private async JDBAAPICheckTransaction(
        bill_no:string,
        token:string
        ){
        const url = 'https://dynamicqr.jdbbank.com.la:12000/api/uat/dynamic';
        const headers = {'Content-Type':'Application/json','Authorization':token,'SignedHash':''};

        const x = {
            "requestId":new Date().getTime(),
            "billNumber":bill_no }
        
        headers.SignedHash= this.JDBAPIHashing(JSON.stringify(x));
        //        { "timestamp": "2022-10-28T09:09:31.249063+07:00", "success": true,
        // "status": "OK",
        // "message": "Transaction successful", "transactionId": "56498456465465",
        // "data": { "accessToken":
        // "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJOQ0MiLCJpYXQiOjE2NjY5MjI5NzEsImV4cCI6MTY2NjkyMzk3M X0.xlz6tk894chaXjaLz4dhJxxqIX7yK9T_d40ziFvb4SE",
        // "expiresIn": 999,
        // "tokenType": "Bearer" }
        const r = await axios.post(url,x,{headers});
        return r.data;
        // {
            // "timestamp": "2022-10-28 09:09:47.908", "success": true,
            // "message": "SUCCESS", "transactionId": "54545564654655", "status": "OK",
            // "data": {
            // "message": "SUCCESS",
            // "refNo": "001MBQR222260588",
            // "exReferenceNo": "WGMVWWJX0XLGQ6IVZ",
            // "merchantName": "PAYMENT TEST UAT",
            // "memo": "Yes Pay: From|NONG FAR |To| PAYMENT TEST UAT|hhhh |", "txnDateTime": "2022-10-27 12:15:18",
            // "txnAmount": 20000,
            // "billNumber": "520154788546",
            // "sourceAccount": "00120010010062660",
            // "sourceName": "NONG FAR",
            // "sourceCurrency": "LAK"
            // } }
    }
    private  JDBAPIHashing(originalString:string){
        const secretKeySpec='';
            try {
                return Cryto.createHmac('HmacSHA256', secretKeySpec).update(originalString).digest('hex');
            } catch (error) {
                console.log('JDBAPIHashing',error);
                return '';
            }
    }
    pubnub= new PubNub({
        // publishKey: "myPublishKey",
        subscribeKey: "sub-c-3014e386-6988-47bb-9fe0-2c5d7a61544c",
        userId: "314ba93e-7d3e-490f-aaa0-0b3da6b9b3ea",
      });

    private JDBAPIAddListener(cb:(message:string)=>void){
       
         this. pubnub.addListener({
            message: function (msg) {
            console.log(msg.message); 
            cb(msg.message);
            }
        });
    }
    private JDBAPISubscribe(channel:string //MerchantId+”_”+billNumber
        ){
        
        this.pubnub.subscribe({
            channels: [channel],
          });
    }




    // LVB


    private  LVBAPIQR(req: Request, res: Response,) {
        const transid = new Date().getTime()+'';
        const trans_description = req.body.trans_description;
        const amount = req.body.amount;
        const callback = req.body.callback;
        const issuedate = req.body.IssueDate;
        const payer = req.body.payer;
        const customer  = req.body.customer;

        const x =this.LVBOpenAPIRequestQR(transid,trans_description,amount,callback,issuedate,payer,customer);
        res.send(x);

    }
    private  LVBAPILogin(req: Request, res: Response,) {

        const x =this.LVBLogin_Request();
        res.send(x);
    }
    private LVBAPIGetTransaction(req: Request, res: Response,) {

        const from_date = req.body.from_date;
        const to_date = req.body.to_date;
        const state  = req.body.state||'PENDING';

        const x =this.LVBGet_TransactionID(from_date,to_date,state);
        res.send(x);
    }
    private LVBAPIGetTransactionByID(req: Request, res: Response,) {
        const bill_id = req.body.bill_id;

        const x =this.LVBGe_Transaction_ById(bill_id);
        res.send(x);
    }





    pk = 'eaYKHfjmy9UZ4KqdEs2uIpXgsEKYqj';
    Username = '055013_1'
    Password = 'ZIvsHAQyRJ2RfvcE'
    public  async LVBOpenAPIRequestQR(Trans_Id:string,Trans_Desc='test description',Amount='1',Callback_URL='https://laoapps.com:9006/callback/lvb',IssueDate=moment().format('YYMMDD'),Payer={Payer_Id:'',Payer_Name:'',Payer_Addr:''},Customer={Custmer_Id:'',Customer_Name:'',IssueDate:moment().format('YYMMDD')}){
        const url ='https://laovietbank.com.la:5678/v1/api/provider';

    const x = {
            "Service_Id": "055013", // default
            "Merchant_Id": "055013_1", // default
            "Merchant_Name": "DORK BUA KHAM TRADING IMPORT-EXPORT.CO.,LTD", // default
            "Trandate": moment().format('YYMMDD'),
            "Trans_Id": Trans_Id,
            "Trans_Desc": Trans_Desc,
            "Amount": Amount,
            "Curr": "LAK",
            "Payer_Id": Payer.Payer_Id,
            "Payer_Name":  Payer.Payer_Name,
            "Payer_Addr":  Payer.Payer_Addr,
            "Type": "809", // for QR
            "Custmer_Id":Customer.Custmer_Id,
            "Customer_Name": Customer.Customer_Name,
            "IssueDate": IssueDate,
            "Callback_URL": Callback_URL,
            "Secure_Code": ""
        }
        x.Secure_Code=this.HashLVB(x);
        const r = await axios.post(url,x);
        return this.verifyHashLVB(r.data,r.data.Secure_Code)?r.data:null;
        //  {
        //     "Service_Id": "055013",
        //     "Merchant_Id": "055013_1",
        //     "Trandate": "230926",
        //     "Trans_Id": "EPAY124112974",
        //     "Response_Code": "000",
        //     "Response_TxnCode": null,
        //     "List": null,
        //     "Redirect_Url": "00020101021238510016A00526628466257701087005041802030020308055013_15204533153034185405100005802LA59006009Vientiane62590113EPAY12411297402121122334455660518TTHD2309260021858306006304F703", // Qr code here
        //     "Secure_Code": "53d517944ffb836b0a0540401809e61e"
        // }

        
    }
    private verifyHashLVB(x:any,code:string){
        return this.HashLVB(x)==code;
    }
    private HashLVB(x:any){
        try {
            return Cryto.createHash('md5').update(this.pk+Object.keys(x).filter(v=>v!=='Secure_Code').join('')).digest("hex")
        } catch (error) {
            console.log(error);
            return '';
        }
    }
    private LVBCallbackRecord(req:Request,res:Response){
        console.log('print call back',req.body);
        // DO MORE HERE *TODO*
        res.send({status:1,description:'callback done'});
    }

    private async LVBLogin_Request(user={username:'055013_1',password:'ZIvsHAQyRJ2RfvcE'}){
        const url ='https://laovietbank.com.la:5678/v1/api/provider';

       const x = {
            "username": user.username,
            "password": user.password,
            "create_date": moment().format('yyyyMMddHHmiss’'),
            "secure_code": ''
        }
        x.secure_code=this.HashLVB(x);
        const r = await axios.post(url,x);
        return this.verifyHashLVB(r.data,r.data.Secure_Code)?r.data:null;
        // {
        //     "Response_Code": "000",
        //     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTU3Nzc3MDcsInN1YiI6IkxvZ2luIiwiaXNzIjoiTFZCIiwianRpIjoiSUQ6RU1TLVNFUlZFUi4zMkM2MkNGOTFFRTE5MTU6MjM3OSIsIlBsYXlsb2FkIjoie1xuICBcInNlcnZpY2VfaWRcIjpcIjA1NTAxM1wiLFxuICBcInNlcnZpY2VfcHJvZmlsZVwiOlwiMDU1MDEzXzFcIixcbiAgXCJzZXJ2aWNlX25hbWVcIjpcIkRPUksgQlVBIEtIQU0gVFJBRElORyBJTVBPUlQtRVhQT1JULkNPLixMVERcIlxufSIsImlhdCI6MTY5NTY5MTMwN30.uQQWTITYTEahLV4Ar5uMc4bBpuSIQsEzjEIZui1gqRk",
        //     "expire_date": "20230927082147"
        // }
        
        
    }
    private async LVBGet_TransactionID(from_date=moment().format('YYYYMMDD'),to_date=moment().format('YYYYMMDD'),state='PENDING'){
        const url ='https://laovietbank.com.la:5678/v1/api/provider';
        const x = {
            "from_date":from_date,
            "to_date":to_date,
            "state":state, //SUCCESS, EXPIRED, PENDING, FAILED, PROCESSING
            "secure_code":''
        }
        
         x.secure_code=this.HashLVB(x);
         const r = await axios.post(url,x);
         return r?.data;
        //  {
        //     "header": {
        //         "status": "000",
        //         "message": "Success"
        //     },
        //     "data": [
        //         {
        //             "bill_id": "EPAY124112974",
        //             "bill_amount": "10000",
        //             "bill_curr": "LAK",
        //             "bill_info": "Test Description",
        //             "payer_id": "112233445566",
        //             "payer_name": "Test Name",
        //             "paying_acc": null,
        //             "pay_amount": "10000",
        //             "charge_amount": null,
        //             "vendor_acc": "01000120015762",
        //             "state": "PENDING",
        //             "lvb_error_code": null,
        //             "lvb_error_desc": null,
        //             "seq": null,
        //             "vendor_error_code": null,
        //             "vendor_error_desc": null
        //         }
        //     ]
        // }
     }

     private async LVBGe_Transaction_ById(bill_id=''){
        const url ='https://laovietbank.com.la:5678/v1/api/provider/transaction/'+bill_id;
        const x = {
            "bill_id":bill_id,
            "secure_code":''
        }
        
         x.secure_code=this.HashLVB(x);
         const r = await axios.post(url,x);
         return r?.data;
        //  {
        //     "header": {
        //         "status": "000",
        //         "message": "Success"
        //     },
        //     "data": [
        //         {
        //             "bill_id": "EPAY124112974",
        //             "bill_amount": "10000",
        //             "bill_curr": "LAK",
        //             "bill_info": "Test Description",
        //             "payer_id": "112233445566",
        //             "payer_name": "Test Name",
        //             "paying_acc": null,
        //             "pay_amount": "10000",
        //             "charge_amount": null,
        //             "vendor_acc": "01000120015762",
        //             "state": "PENDING",
        //             "lvb_error_code": null,
        //             "lvb_error_desc": null,
        //             "seq": null,
        //             "vendor_error_code": null,
        //             "vendor_error_desc": null
        //         }
        //     ]
        // }
        
     }
}


// LVB Response code
const LVB_Response_codes=
[
    {
     "Response Code": 0,
     "Response Description": "Transaction Successfully"
    },
    {
     "Response Code": 1,
     "Response Description": "Invoices already paid"
    },
    {
     "Response Code": 2,
     "Response Description": "Invoice has expired"
    },
    {
     "Response Code": 3,
     "Response Description": "Customer information not found"
    },
    {
     "Response Code": 4,
     "Response Description": "OTP Authentication Timeout"
    },
    {
     "Response Code": 5,
     "Response Description": "Wrong OTP verification code"
    },
    {
     "Response Code": 6,
     "Response Description": "Service does not exist"
    },
    {
     "Response Code": 7,
     "Response Description": "Wrong signature"
    },
    {
     "Response Code": 8,
     "Response Description": "Access denied"
    },
    {
     "Response Code": 9,
     "Response Description": "No client defined yet"
    },
    {
     "Response Code": 10,
     "Response Description": "Wrong User and Password login"
    },
    {
     "Response Code": 11,
     "Response Description": "Duplicate data or duplicate trans_id"
    },
    {
     "Response Code": 12,
     "Response Description": "Unregistered service"
    },
    {
     "Response Code": 13,
     "Response Description": "Customer information already exists"
    },
    {
     "Response Code": 14,
     "Response Description": "Account not allowed to pay"
    },
    {
     "Response Code": 15,
     "Response Description": "Provider does not perform transaction reversal"
    },
    {
     "Response Code": 16,
     "Response Description": "Provider performed a failed transaction"
    },
    {
     "Response Code": 17,
     "Response Description": "Username LVB Online (CIF) does not exist"
    },
    {
     "Response Code": 18,
     "Response Description": "Can't get invoice information"
    },
    {
     "Response Code": 19,
     "Response Description": "The supplier is incorrect"
    },
    {
     "Response Code": 20,
     "Response Description": "Incorrect service"
    },
    {
     "Response Code": 21,
     "Response Description": "Can't find CMT on corebanking system"
    },
    {
     "Response Code": 22,
     "Response Description": "Can't find mobile on corebanking system"
    },
    {
     "Response Code": 25,
     "Response Description": "The customer has no invoice"
    },
    {
     "Response Code": 26,
     "Response Description": "Payment amount is different from the amount owed"
    },
    {
     "Response Code": 27,
     "Response Description": "Transaction amount exceeds the maximum limit for each transaction"
    },
    {
     "Response Code": 28,
     "Response Description": "Total transaction amount exceeds the maximum limit of the day"
    },
    {
     "Response Code": 29,
     "Response Description": "Total number of transactions exceeding the maximum limit of the day"
    },
    {
     "Response Code": 30,
     "Response Description": "The supplier's branch code has not been declared"
    },
    {
     "Response Code": 31,
     "Response Description": "Domestic debit card (ATM) information does not exist"
    },
    {
     "Response Code": 32,
     "Response Description": "Domestic debit card (ATM) not working"
    },
    {
     "Response Code": 33,
     "Response Description": "Account number does not exist"
    },
    {
     "Response Code": 34,
     "Response Description": "Customer account is temporarily detained"
    },
    {
     "Response Code": 35,
     "Response Description": "The payment account does not have enough balance to make a transaction"
    },
    {
     "Response Code": 36,
     "Response Description": "Payment account not working"
    },
    {
     "Response Code": 37,
     "Response Description": "Invalid LVB Online service registration status"
    },
    {
     "Response Code": 38,
     "Response Description": "The amount left in the account does not meet the minimum balance"
    },
    {
     "Response Code": 39,
     "Response Description": "Customer account at Provider is locked"
    },
    {
     "Response Code": 40,
     "Response Description": "Customer name is incorrect"
    },
    {
     "Response Code": 41,
     "Response Description": "Customers have not registered for the service at LVB or are not in an active state"
    },
    {
     "Response Code": 42,
     "Response Description": "Customers who have not registered for services at Provider"
    },
    {
     "Response Code": 43,
     "Response Description": "NULL data"
    },
    {
     "Response Code": 44,
     "Response Description": "Invalid amount"
    },
    {
     "Response Code": 45,
     "Response Description": "Negative amount"
    },
    {
     "Response Code": 46,
     "Response Description": "Debit card not working"
    },
    {
     "Response Code": 47,
     "Response Description": "Debit card not working"
    },
    {
     "Response Code": 48,
     "Response Description": "Debit card not working"
    },
    {
     "Response Code": 49,
     "Response Description": "The transaction amount is less than the minimum limit"
    },
    {
     "Response Code": 50,
     "Response Description": "Transaction pending"
    },
    {
     "Response Code": 51,
     "Response Description": "Invalid release date"
    },
    {
     "Response Code": 52,
     "Response Description": "Transaction exceeds the maximum daily OTP bypass limit for one customer"
    },
    {
     "Response Code": 53,
     "Response Description": "Transaction exceeds the maximum daily OTP bypass limit for a service"
    },
    {
     "Response Code": 54,
     "Response Description": "You have NOT changed your password of DV LVB Smart Banking for the first time. Please change your password for the first time at LVB Smart Banking application"
    },
    {
     "Response Code": 55,
     "Response Description": "User or Password is incorrect"
    },
    {
     "Response Code": 56,
     "Response Description": "Can't cross the bill"
    },
    {
     "Response Code": 57,
     "Response Description": "You are using LVB Online non-financial package. You need to register LVB Online for a financial package to use the service."
    },
    {
     "Response Code": 58,
     "Response Description": "Refund failed due to incorrect original transaction tran_id or original transaction failed"
    },
    {
     "Response Code": 59,
     "Response Description": "The refund transaction could not be made because the amount requested for refund is larger than the original transaction amount"
    },
    {
     "Response Code": 60,
     "Response Description": "There is an error in the OTP authentication process or the customer is temporarily locked out of OTP due to incorrect OTP input 5 times in a row"
    },
    {
     "Response Code": 61,
     "Response Description": "There was an error during OTP authentication"
    },
    {
     "Response Code": 62,
     "Response Description": "Unable to trust account balance"
    },
    {
     "Response Code": 63,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 64,
     "Response Description": "Error transaction. Please check your account balance and contact LVB's Customer Care Center for assistance in processing."
    },
    {
     "Response Code": 65,
     "Response Description": "You have not registered a phone number to receive OTP to pay for online transactions"
    },
    {
     "Response Code": 66,
     "Response Description": "This account is Invalid"
    },
    {
     "Response Code": 67,
     "Response Description": "You are using LVB Smart Banking non-financial package. You need to register for LVB Smart Banking financial package to use the service."
    },
    {
     "Response Code": 92,
     "Response Description": "Routing Error"
    },
    {
     "Response Code": 96,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 97,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 98,
     "Response Description": "Invalid payment card type"
    },
    {
     "Response Code": 99,
     "Response Description": "Payment information changed"
    },
    {
     "Response Code": 100,
     "Response Description": "Error transaction. Please contact your Service Provider for processing assistance."
    },
    {
     "Response Code": 101,
     "Response Description": "Message format incorrect\/Not defined Message"
    },
    {
     "Response Code": 102,
     "Response Description": "This currency is not supported"
    },
    {
     "Response Code": 103,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 104,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 105,
     "Response Description": "The transaction is canceled"
    },
    {
     "Response Code": 106,
     "Response Description": "BUNO phone number does not match LVB Online's phone number"
    },
    {
     "Response Code": 107,
     "Response Description": "The wallet code has been properly linked to the verified LVB online user"
    },
    {
     "Response Code": 108,
     "Response Description": "CIF number used for BUNO registration or processing at the counter"
    },
    {
     "Response Code": 109,
     "Response Description": "Wallet code is being processed at LVB counter"
    },
    {
     "Response Code": 110,
     "Response Description": "Wallet code linked"
    },
    {
     "Response Code": 111,
     "Response Description": "Unlinked wallet code"
    },
    {
     "Response Code": 112,
     "Response Description": "Need to enter OTP for transactions exceeding the limit"
    },
    {
     "Response Code": 113,
     "Response Description": "The account number has been linked to another e-wallet\/customer code of the Provider. Please unlink the old link before creating a new one."
    },
    {
     "Response Code": 114,
     "Response Description": "Transaction failed. Please try again later."
    },
    {
     "Response Code": 139,
     "Response Description": "Invalid credentials. Please enter correct information about LVB Smartbanking service"
    },
    {
     "Response Code": 140,
     "Response Description": "Invalid credentials. Please enter correct information about LVB Online service"
    },
    {
     "Response Code": 141,
     "Response Description": "Your current password has expired in accordance with LVB's regulations. We recommend that you change your password to continue using LVB Smartbanking service"
    },
    {
     "Response Code": 142,
     "Response Description": "LVB Smartbanking service is temporarily blocked for authentication on the transaction channel due to entering the wrong password more than the specified number of times. Please try again in 24 hours."
    }
   ]


