import { Router } from 'express';
import Queue from "bull";
import events from "events";
import { ReadPanel as AdminReadPanel } from "../laab_service/controllers/vendingwallet_admin/panels/read.panel";
import { WritePanel as AdminWritePanel } from "../laab_service/controllers/vendingwallet_admin/panels/write.panel";
import { ReadPanel as ClientReadPanel } from "../laab_service/controllers/vendingwallet_client/panels/read.panel";
import { redisHost, redisPort } from '../services/service';

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


export class LaabAPI {

    private queues: any = {
        QCreateMerchant:QCreateMerchant,
        QCreateMerchantCoin: QCreateMerchantCoin,
        QCreateVendingLimiter: QCreateVendingLimiter,
        QCreateVendingLimiterCoin: QCreateVendingLimiterCoin,
        QCreateVendingWallet: QCreateVendingWallet,
        QCreateVendingWalletCoin: QCreateVendingWalletCoin,
    }
    private adminReadPanel: AdminReadPanel;
    private adminWritePanel: AdminWritePanel;

    private clientReadPanel: ClientReadPanel;

    constructor(router: Router) {

        this.adminReadPanel = new AdminReadPanel();
        this.adminWritePanel = new AdminWritePanel(this.queues);

        this.clientReadPanel = new ClientReadPanel();

        // merchant
        router.post('/laab/admin/create_merchant', this.adminWritePanel.CreateMerchant.bind(this.adminWritePanel));
        router.post('/laab/admin/create_merchant_coin', this.adminWritePanel.CreateMerchantCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_merchant', this.adminReadPanel.FindMerchant.bind(this.adminReadPanel));
        router.post('/laab/admin/find_merchant_coin', this.adminReadPanel.FindMerchantCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_merchant_coin_balance', this.adminReadPanel.ShowMerchantCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/show_merchant_report', this.adminReadPanel.ShowMerchantReport.bind(this.adminReadPanel));
        router.post('/laab/admin/merchant_coin_transfer', this.adminReadPanel.MerchantCoinTransfer.bind(this.adminReadPanel));





        router.post('/laab/admin/login', this.adminReadPanel.Login.bind(this.adminReadPanel));
        router.post('/laab/admin/text_hash_verify', this.adminReadPanel.TextHashVerify.bind(this.adminReadPanel));
        router.post('/laab/admin/qr_hash_verify', this.adminReadPanel.QRHashVerify.bind(this.adminReadPanel));






        // vending limiter
        router.post('/laab/admin/create_vending_limiter', this.adminWritePanel.CreateVendingLimiter.bind(this.adminWritePanel));
        router.post('/laab/admin/create_vending_limiter_coin', this.adminWritePanel.CreateVendingLimiterCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_vending_limiter', this.adminReadPanel.FindVendingLimiter.bind(this.adminReadPanel));
        router.post('/laab/admin/find_vending_limiter_coin', this.adminReadPanel.FindVendingLimiterCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_limiter_coin_balance', this.adminReadPanel.ShowVendingLimiterCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_limiter_coin_transfer', this.adminReadPanel.VendingLimiterCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_limiter_report', this.adminReadPanel.ShowVendingLimiterReport.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_limiter_coin_transfer', this.adminReadPanel.VendingLimiterCoinTransfer.bind(this.adminReadPanel));




        // vending limiter
        router.post('/laab/admin/create_vending_wallet', this.adminWritePanel.CreateVendingWallet.bind(this.adminWritePanel));
        router.post('/laab/admin/create_vending_wallet_coin', this.adminWritePanel.CreateVendingWalletCoin.bind(this.adminWritePanel));
        router.post('/laab/admin/find_vending_wallet', this.adminReadPanel.FindVendingWallet.bind(this.adminReadPanel));
        router.post('/laab/admin/find_vending_wallet_coin', this.adminReadPanel.FindVendingWalletCoin.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_wallet_coin_balance', this.adminReadPanel.ShowVendingWalletCoinBalance.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_wallet_coin_transfer', this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));
        router.post('/laab/admin/show_vending_wallet_report', this.adminReadPanel.ShowVendingWalletReport.bind(this.adminReadPanel));
        router.post('/laab/admin/vending_wallet_coin_transfer', this.adminReadPanel.VendingWalletCoinTransfer.bind(this.adminReadPanel));





        // vending client
        router.post('/laab/client/show_vending_wallet_coin_balance', this.clientReadPanel.ShowVendinWalletCoinBalance.bind(this.clientReadPanel));
        router.post('/laab/client/cash_validation', this.clientReadPanel.CashValidation.bind(this.clientReadPanel));
        router.post('/laab/client/cash_in_validation', this.clientReadPanel.CashinValidation.bind(this.clientReadPanel));
        router.post('/laab/client/paid_validation', this.clientReadPanel.PaidValidation.bind(this.clientReadPanel));
        router.post('/laab/client/create_smart_contract', this.clientReadPanel.CreateSMC.bind(this.clientReadPanel));
        router.post('/laab/client/load_smart_contract', this.clientReadPanel.LoadSMC.bind(this.clientReadPanel));
        router.post('/laab/client/create_epin', this.clientReadPanel.CreateEPIN.bind(this.clientReadPanel));





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
    }
    
}


