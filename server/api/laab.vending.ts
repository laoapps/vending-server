import { NextFunction, Request, Response, Router } from 'express';
import Queue from "bull";
import events from "events";
import { ReadPanel as AdminReadPanel } from "../laab_service/controllers/vendingwallet_admin/panels/read.panel";
import { WritePanel as AdminWritePanel } from "../laab_service/controllers/vendingwallet_admin/panels/write.panel";
import { ReadPanel as ClientReadPanel } from "../laab_service/controllers/vendingwallet_client/panels/read.panel";
import { WritePanel as ClientWritePanel } from "../laab_service/controllers/vendingwallet_client/panels/write.panel";
import { ReadPanel as SubadminReadPanel } from "../laab_service/controllers/vendingwallet_subadmin/panels/read.panel";
import { WritePanel as SubadminWritePanel } from "../laab_service/controllers/vendingwallet_subadmin/panels/write.panel";
import { redisHost, redisPort } from '../services/service';
import { SocketServerZDM8 } from './socketServerZDM8';
import { APIAdminAccess, IENMessage, IStatus, message } from '../services/laab.service';

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
export let QPaidValidation = new Queue('QPaidValidation', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateSMC = new Queue('QCreateSMC', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCreateEPIN = new Queue('QCreateEPIN', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QReCreateEPIN = new Queue('QReCreateEPIN', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QCounterCashout_CashValidation = new Queue('QCounterCashout_CashValidation', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });


export let QCreateSubadmin = new Queue('QCreateSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QDeleteSubadmin = new Queue('QDeleteSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QAddProvideSubadmin = new Queue('QAddProvideSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });
export let QRemoveProvideSubadmin = new Queue('QRemoveProvideSubadmin', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });

export class LaabVendingAPI {

    private ports = 31223;
    private ssocket: SocketServerZDM8 = {} as SocketServerZDM8;

    private adminQueues: any = {
        QCreateMerchant:QCreateMerchant,
        QCreateMerchantCoin: QCreateMerchantCoin,
        QCreateVendingLimiter: QCreateVendingLimiter,
        QCreateVendingLimiterCoin: QCreateVendingLimiterCoin,
        QCreateVendingWallet: QCreateVendingWallet,
        QCreateVendingWalletCoin: QCreateVendingWalletCoin,
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
        QAddProvideSubadmin: QAddProvideSubadmin,
        QRemoveProvideSubadmin: QRemoveProvideSubadmin,
    }
    private subadminReadPanel: SubadminReadPanel;
    private subadminWritePanel: SubadminWritePanel;

    constructor(router: Router,ssocket:SocketServerZDM8) {
        this.ssocket = ssocket;
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




        // vending limiter
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
            message([], IENMessage.notImplemented, IStatus.unsuccess, res);
        });





        // vending subadmin
        router.post('/laab/sub_admin/create_subadmin', APIAdminAccess, this.subadminWritePanel.CreateSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/delete_subadmin', APIAdminAccess, this.subadminWritePanel.DeleteSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/add_provide_subadmin', APIAdminAccess, this.subadminWritePanel.AddProvideToSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/remove_provide_subadmin', APIAdminAccess, this.subadminWritePanel.RemoveProvideFromSubadmin.bind(this.subadminWritePanel));
        router.post('/laab/sub_admin/show_subadmin', APIAdminAccess, this.subadminReadPanel.ShowSubadmin.bind(this.subadminReadPanel));
        router.post('/laab/sub_admin/find_subadmin', APIAdminAccess, this.subadminReadPanel.FindSubadmin.bind(this.subadminReadPanel));






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
        QAddProvideSubadmin.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.subadminWritePanel._AddProvideToSubadmin(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
        QRemoveProvideSubadmin.process((job, done) => {
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
    
}


