import axios from "axios";
import e, { NextFunction, Request, Response, Router } from "express";
import * as WebSocketServer from "ws";

import crypto from 'crypto';
import cryptojs from "crypto-js";
import * as uuid from "uuid";
import https from 'https';

import {

    findRealDB,
    PrintError,
    PrintSucceeded,
    readMerchantLimiterBalance,
    // readMachineLimiter,
    readMachineSetting,
    readMachineStatus,
    redisClient,
    writeErrorLogs,
    writeLogs,
    writeMachineSetting,
    writeSucceededRecordLog,
    readMachineBalance,
    writeACKConfirmCashIn,
    readACKConfirmCashIn,
    writeMachineBalance,
    writeMachineStatus,
    writeMachineSale,
    readMachineSale,
    base64ToFile,
    writeMachineLimiterBalance,
    findUuidByPhoneNumberOnUserManager,
    returnLog,
    writeActiveMmoneyUser,
    writeMachinePendingStock,
    readMachinePendingStock,
    writeMachineLockDrop,
    readMachineLockDrop,
    findPhoneNumberByUuidOnUserManager,
    generateTokenOnUserManager,
    parseMachineVMCStatus as parseMachineVMCStatus,
    readAminControl,
    setAdminControl,
    listMachineSaleLog,
    CheckMmoneyPaid,
    writeMachineSettingVersion,
    readMachineAdsVersion,
    readMachineSettingVersion,
    readMachineAds,
    generateChecksum,
    listVendingEventLogs,
    getVendingEvent,
    setVendingEvent,
} from "../services/service";
import {
    EClientCommand,
    EMACHINE_COMMAND,
    EMessage,
    IReqModel,
    IResModel,
    IStock,
    IVendingMachineBill,
    IVendingMachineSale,
    IMMoneyLogInRes,
    IMMoneyGenerateQR,
    IMMoneyGenerateQRRes,
    IMMoneyConfirm,
    IBillProcess,
    IBaseClass,
    EEntity,
    IMachineClientID,
    EPaymentStatus,
    IBillCashIn,
    IBankNote,
    IHashBankNote,
    IMMoneyLoginCashin,
    IMMoneyRequestRes,
    IVendingCloneMachineSale,
    IAds,
    ILoadVendingMachineSaleBillReport,
    IMMoneyGenerateQRPro,
    ILoadVendingMachineStockReport,
    ILaoQRGenerateQRRes,
    IMachineStatus,
    IDropPositionData,
    EVendingEvent,
    IVendingEventLog,
} from "../entities/system.model";
import moment, { now } from "moment";
import momenttz from "moment-timezone";
import { stringify, v4 as uuid4 } from "uuid";
import { setWsHeartbeat } from "ws-heartbeat/server";
import { SocketServerZDM8 } from "./socketServerZDM8";
import {
    MachineIDFactory,
    MachineIDStatic,
} from "../entities/machineid.entity";
import {
    adsEntity,
    ClientlogEntity,
    dbConnection,
    dropLogEntity,
    laabHashService,
    logEntity,
    LogsTempEntity,
    machineCashoutMMoneyEntity,
    machineClientIDEntity,
    machineIDEntity,
    ProductImageEntity,
    stockEntity,
    subadminEntity,
    vendingMachineSaleReportEntity,
    vendingVersionEntity,
    vendingWallet,
} from "../entities";
import {
    MachineClientID,
    MachineClientIDFactory,
    MachineClientIDModel,
} from "../entities/machineclientid.entity";
import { StockFactory } from "../entities/stock.entity";
import { VendingMachineSaleFactory } from "../entities/vendingmachinesale.entity";
import {
    VendingMachineBillFactory,
    VendingMachineBillModel,
    VendingMachineBillStatic,
} from "../entities/vendingmachinebill.entity";
import { Op } from "sequelize";
import fs from "fs";
import { getNanoSecTime } from "../services/service";
import { APIAdminAccess, IENMessage, IFranchiseStockSignature, IStatus, LAAB_CoinTransfer, message } from "../services/laab.service";
import { CashVendingLimiterValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashLimiterValidation.func";
import {
    BillCashInFactory,
    BillCashInStatic,
} from "../entities/billcash.entity";
import { CashinValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashinValidation.func";
import { FranchiseStockFactory, FranchiseStockStatic } from "../entities/franchisestock.entity";
import { MmoneyTransferValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/mmoneyTransferValidation.func";
import { IVendingWalletType } from "../laab_service/models/base.model";
import { log } from "console";
import { channel } from "diagnostics_channel";
import { LogActivity } from "../entities/logactivity.entity";
import { checkGenerateCount } from "../services/laoqr.service";
import { DeleteTransactionToCheck, GetTransactionToCheck } from "../services/mmoney.service";
import { IProductImage } from "../models/sys.model";
import { WarehouseFactory } from "../entities/warehouse.entity";
import { uploadExcelMemory } from "../middlewares/upload.middleware";
import { uploadExcelFile } from "../controllers/excel.controller";


export const SERVER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;


export class InventoryZDM8 implements IBaseClass {

    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerZDM8 = {} as SocketServerZDM8;
    notes = new Array<IBankNote>();
    hashNotes = new Array<IHashBankNote>();
    // stock = new Array<IStock>();
    // vendingOnSale = new Array<IVendingMachineSale>();
    // vendingBill = new Array<IVendingMachineBill>();
    // vendingBillPaid = new Array<IVendingMachineBill>();
    // clients = new Array<IMachineID>();

    delayTime = 5000;
    path = "/zdm8";
    production = true;

    //// QR MMONEY HERE
    // public phonenumber = this.production ? '2052396969':'2054445447'// '2058623333' : '2054445447'; //LTC. 2058623333 //2052899515
    // public walletId = this.production ? '2599087166' : '2843759248';// LTC
    // public phonenumber = this.production ? "2052396969" : "2054445447";
    // public walletId = "2843759248";

    // mmoneyusername = "dbk";
    // mmoneypassword = "dbk@2022";
    // mmoneyusername= '2c7eb4906d4ab65f72fc3d3c8eebeb65';

    qrmmoneywallet_id = 2558105967
    qrmmoneypassword = 112233
    // msisdn=2052743838  // machine 5010
    qrmmoneyusername = '32f2d9a78d94a935e2e6052d229f301e'


    ports = 31223;
    // clientResponse = new Array<IBillProcess>();
    wsClient = new Array<WebSocket>();
    machineClientlist = MachineClientIDFactory(
        EEntity.machineclientid,
        dbConnection
    );
    billCashEnt: BillCashInStatic = BillCashInFactory(
        EEntity.billcash + "_" + this.production,
        dbConnection
    );

    badBillCashEnt: BillCashInStatic = BillCashInFactory(
        EEntity.badbillcash + "_" + this.production,
        dbConnection
    );

    public machineIds = new Array<IMachineClientID>();




    CashInMMoneyRequesterId = 59
    CashInMMoneMMoneyName = 'LMM KIOS'
    CashInMMoneMMoneyUsername = 'lmmkios'
    CashInMMoneMMoneyPassword = 'Qh7~Lq9@'


    pathMMoneyLogin = 'https://api.mmoney.la/ewallet-ltc-api/oauth/token.service';
    pathMMoneyConfirm = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/confirm-cash-in.service';
    pathMMoneyInquiry = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/inquiry-cash-in.service';
    pathMMoneyRequest = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/request-cash-in.service';


    checkMachineIdToken(req: Request, res: Response, next: NextFunction) {
        const { token } = req.body;
        res.locals["machineId"] = this.findMachineIdToken(token);
        if (!res.locals["machineId"]) {
            return res.send(PrintError("MachineNotFound", [], EMessage.error, null));
        } else next();
    }
    checkMachineDisabled(req: Request, res: Response, next: NextFunction) {
        this.isMachineDisabled(res.locals["machineId"].machineId)
            .then((r) => {
                if (r) {
                    return res.send(
                        PrintError("machine was disabled", [], EMessage.error, null)
                    );
                } else next();
            })
            .catch((e) => {
                return res.send(PrintError("checkMachineDisabled", e, EMessage.error, null));
            });
    }
    isMachineDisabled(machineId: string) {
        return new Promise<boolean>((resolve, reject) => {
            machineClientIDEntity
                .findOne({ where: { machineId } })
                .then((r) => {
                    if (!r?.isActive) {
                        resolve(true);
                    } else resolve(false);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }
    initBankNotes() {
        this.notes.push({
            value: 1000,
            amount: 0,
            currency: "LAK",
            channel: 1,
            image: "lak1000.jpg",
        });
        this.notes.push({
            value: 2000,
            amount: 0,
            currency: "LAK",
            channel: 2,
            image: "lak2000.jpg",
        });
        this.notes.push({
            value: 5000,
            amount: 0,
            currency: "LAK",
            channel: 3,
            image: "lak5000.jpg",
        });
        this.notes.push({
            value: 10000,
            amount: 0,
            currency: "LAK",
            channel: 4,
            image: "lak10000.jpg",
        });
        this.notes.push({
            value: 20000,
            amount: 0,
            currency: "LAK",
            channel: 5,
            image: "lak20000.jpg",
        });
        this.notes.push({
            value: 50000,
            amount: 0,
            currency: "LAK",
            channel: 6,
            image: "lak50000.jpg",
        });
        this.notes.push({
            value: 100000,
            amount: 0,
            currency: "LAK",
            channel: 7,
            image: "lak100000.jpg",
        });
    }
    sumBN(BN) {
        const bn = new Array<any>();
        BN.forEach((v) => {
            if (!bn.length) {
                const y = JSON.parse(JSON.stringify(v));
                y.amount++;
                bn.push(y);
            } else {
                const x = bn.find((vx) => vx.value == v.value);
                if (x) x.amount++;
                else {
                    const x = JSON.parse(JSON.stringify(v));
                    x.amount++;
                    bn.push(x);
                }
            }
        });
        return bn;
    }




    constructor(router: Router, wss: WebSocketServer.Server) {
        this.billCashEnt.sync();
        this.badBillCashEnt.sync();
        this.initBankNotes();

        this.ssocket = new SocketServerZDM8(this.ports);

        this.wss = wss;
        try {
            this.initWs(wss);
            // load machine Id

            // load production for each machine id
            this.init();
            router.get(this.path + "/", async (req, res) => {
                console.log("TEST IS WORKING");
                res.send({ data: "test is working" });
            });
            router.post(this.path + "/", async (req, res) => {
                const d = req.body as IReqModel;
                try {
                    // console.log("POST Data", JSON.stringify(d.data));

                    if (d.command == EClientCommand.confirmMMoney) {
                        // console.log("CB COMFIRM", d);
                        const c = d.data as IMMoneyConfirm;
                        // c.wallet_ids
                        this.callBackConfirmMmoney(c?.qrcode)
                            .then((r) => {
                                res.send(
                                    PrintSucceeded(
                                        d.command,
                                        { bill: r, transactionID: c.tranid_client },
                                        EMessage.succeeded,
                                        returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error confirmMMoney");
                                writeLogs(c, "", "_E_Confirm");
                                res.send(PrintError(d.command, e, EMessage.error, null));
                            });
                    } else if (d.command == "processorder") {
                        // update bill for local process
                        // console.log("process orders", d);
                        // c.wallet_ids
                        try {
                            const { token, transactionID } = d.data;
                            const machineId =
                                this.findMachineIdToken(token)?.machineId;
                            if (!machineId) throw new Error("machine is not exist");
                            this.getBillProcess(machineId, (b) => {
                                const position = b.find(
                                    (v) => v.transactionID == transactionID
                                )?.position;
                                if (position) {
                                    this.setBillProces(machineId,
                                        b.filter((v) => v.transactionID != transactionID)
                                    );
                                    // console.log("submit_command", transactionID, position);
                                    res.send(
                                        PrintSucceeded(
                                            "submit command",
                                            this.ssocket.processOrder(
                                                machineId,
                                                position,
                                                transactionID
                                            ),
                                            EMessage.succeeded,
                                            null
                                        )
                                    );
                                } else {
                                    res.send(
                                        PrintError("submit command", [], "position not found", null)
                                    );
                                }
                            });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("init", error, EMessage.error, null));
                        }
                    } else {
                        const clientId = d.data.clientId + "";
                        // console.log('=====>Client ID', clientId);

                        let loggedin = false;
                        // console.log(' WS client length', this.wss.clients);

                        // this.wss.clients.forEach(v => {
                        //     console.log('WS CLIENT ID', v['clientId'], '==>' + clientId);
                        //     if (v['clientId'] == clientId)
                        //         loggedin = true;
                        // })
                        // console.log("Command", d);

                        this.wsClient.forEach((v) => {
                            if (v["clientId"] == clientId) { return loggedin = true };
                        });
                        const ws = this.wsClient.find(v => v['machineId'] === this.findMachineIdToken(d.token)?.machineId);
                        if (ws) ws['lastAction'] = Date.now();
                        if (!loggedin) {
                            if (ws) {
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(
                                            "ping",
                                            {
                                                command: "ping",
                                                production: this.production,
                                                setting: { refresh: true }
                                            },
                                            EMessage.succeeded,
                                            null
                                        )
                                    )
                                );
                                console.log('send refresh to machine', this.findMachineIdToken(d.token)?.machineId);
                                setTimeout(() => {
                                    ws.close(1000, 'not login yet');
                                }, 100);
                                console.log('close old connection and ask to re-login', this.findMachineIdToken(d.token)?.machineId);
                            }
                            throw new Error(EMessage.notloggedinyet);
                        }
                        else if (d.command == EClientCommand.list) {
                            const m = await machineClientIDEntity.findOne({
                                where: {
                                    machineId: this.findMachineIdToken(d.token)
                                        ?.machineId,
                                },
                            });
                            const ownerUuid = m?.ownerUuid || "";

                            const sEnt = VendingMachineSaleFactory(
                                EEntity.vendingmachinesale + "_" + ownerUuid,
                                dbConnection
                            );
                            await sEnt.sync();
                            sEnt
                                .findAll()
                                .then((r) => {
                                    res.send(PrintSucceeded("listSale", r, EMessage.succeeded, null));
                                })
                                .catch((e) => {
                                    res.send(PrintError("listSale", e, EMessage.error, null));
                                });
                        } else if (d.command == EClientCommand.buyMMoney) {



                            // console.log(" buyMMoney" + d.data.value);
                            const sale = d.data.ids as Array<IVendingMachineSale>; // item id
                            const machineId = this.findMachineIdToken(d.token);
                            // const position = d.data.position;
                            if (!machineId) throw new Error("Invalid token");
                            // console.log(" passed token", machineId);
                            if (!Array.isArray(sale)) throw new Error("Invalid array id");
                            // console.log(' sale is  id', sale);
                            if (await this.isMachineDisabled(machineId.machineId))
                                throw new Error("machine was disabled");
                            // console.log(' machine was enabled', sale);
                            const checkIds = Array<IVendingMachineSale>();
                            sale.forEach((v) => {
                                v.stock.qtty = 1;
                                const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                                y.stock.qtty = 1;
                                y.stock.image = "";
                                y.machineId = machineId.machineId
                                checkIds.push(y);
                            });
                            // console.log(' checkids', sale);

                            // console.log('checkIds', checkIds, 'ids', sale);

                            // if (checkIds.length < sale.length) throw new Error('some array id not exist or wrong qtty');

                            const value = checkIds.reduce((a, b) => {
                                return a + b.stock.price * b.stock.qtty;
                            }, 0);
                            // console.log(' sum by ids', sale);
                            // console.log('qtty', checkIds);
                            // console.log('ids', sale.length);

                            // console.log(" value" + d.data.value + " " + value);

                            if (Number(d.data.value) != value)
                                throw new Error("Invalid value" + d.data.value + " " + value);

                            // console.log(' value is valid', sale);
                            let a = machineId?.data?.find(v => v.settingName == 'setting');
                            let mId = a?.imei + ''; // for MMoney need 10 digits
                            // console.log(`check emei derrrrr`, mId);
                            if (!mId) throw new Error('MMoney need IMEI');


                            // const emei: string = 
                            // console.log(`emei -->`, emei, emei.length, `time -->`, time, time.length);
                            // const transactionID = emei + time;
                            const x = new Date().getTime();
                            // const transactionID = String(mId.substring(mId.length - 10)) + (x + '').substring(2);
                            const transactionID = String(mId.substring(mId.length - 8)) + (x + '').substring(5);
                            // console.log(`transactionID`, transactionID);
                            // const transactionID = Number(
                            //     Number(
                            //         mId.substring(0, mId.length - 10) // 21
                            //     ) +
                            //     "" +
                            //     new Date().getTime() 
                            // );
                            const qr = await this.generateBillMMoneyPro(
                                mId, // use this Imei for MMoney only, it is a phonenumber 2055555555
                                value,
                                transactionID + ''
                                // mId + '' + transactionID + ""
                            );
                            if (!qr.qrCode) throw new Error(EMessage.GenerateQRMMoneyFailed);
                            const bill = {
                                uuid: uuid4(),
                                clientId,
                                qr: qr.qrCode,
                                transactionID: transactionID as any,
                                machineId: machineId.machineId,
                                hashM: "",
                                hashP: "",
                                paymentmethod: d.command,
                                paymentref: qr.name,
                                paymentstatus: EPaymentStatus.pending,
                                paymenttime: new Date(),
                                requestpaymenttime: new Date(),
                                totalvalue: value,
                                vendingsales: sale,
                                isActive: true,
                            } as VendingMachineBillModel;

                            const m = await machineClientIDEntity.findOne({
                                where: {
                                    machineId: this.findMachineIdToken(d.token)
                                        ?.machineId,
                                },
                            });
                            const ownerUuid = m?.ownerUuid || "";
                            const ent = VendingMachineBillFactory(
                                EEntity.vendingmachinebill + "_" + ownerUuid,
                                dbConnection
                            );
                            await ent.sync();

                            ent.create(bill).then((r) => {
                                // console.log("SET transactionID by owner", ownerUuid);
                                redisClient.setex(qr.qrCode + EMessage.BillCreatedTemp, 60 * 3, ownerUuid);
                                res.send(PrintSucceeded(d.command, r, EMessage.succeeded, null));
                            });
                            const event: IVendingEventLog = {
                                machineId: machineId.machineId,
                                event: EVendingEvent.selling,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                                data: { data: bill, time: new Date() },//[{time, position, product, price,ip,data}
                                date: momenttz().tz(SERVER_TIME_ZONE).date(),
                                month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                                year: momenttz().tz(SERVER_TIME_ZONE).year()
                            };
                            await setVendingEvent(EVendingEvent.selling, event);
                        } else if (d.command == EClientCommand.buyLAOQR) {


                            const sale = d.data.ids as Array<IVendingMachineSale>;
                            const machineId = this.findMachineIdToken(d.token);
                            const phoneNumber = d?.data?.phone;

                            const checkCountGen = await checkGenerateCount(machineId?.machineId);
                            if (checkCountGen.status == 1) {
                                const wsx = this.wsClient.filter(v => v['machineId'] === machineId.machineId);
                                wsx.forEach(ws => {
                                    if (ws.readyState === WebSocketServer.OPEN)
                                        ws?.send(
                                            JSON.stringify(
                                                PrintSucceeded(
                                                    "ping",
                                                    {
                                                        command: "ping",
                                                        production: this.production,
                                                        setting: { refresh: true }
                                                    },
                                                    EMessage.succeeded,
                                                    null
                                                )
                                            )
                                        );
                                })
                                return res.send(PrintError(d.command, [], EMessage.LaoQRCount, null));
                            }

                            if (!machineId) return res.send(PrintError(d.command, [], EMessage.tokenNotFound, null));
                            if (!Array.isArray(sale)) throw new Error("Invalid array id");
                            if (await this.isMachineDisabled(machineId.machineId)) return res.send(PrintError(d.command, [], EMessage.machineisdisabled, null));

                            const checkIds = Array<IVendingMachineSale>();
                            sale.forEach((v) => {
                                v.stock.qtty = 1;
                                const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                                y.stock.qtty = 1;
                                y.stock.image = "";
                                y.machineId = machineId.machineId;
                                checkIds.push(y);
                            });

                            const value = checkIds.reduce((a, b) => a + b.stock.price * b.stock.qtty, 0);
                            if (Number(d.data.value) != value) return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));

                            const a = machineId?.data?.find(v => v.settingName == 'setting');
                            const mId = a?.imei + '';
                            const ownerPhone = a?.ownerPhone + '';
                            const owner = (a?.owner + '').trim();

                            if (!mId || !ownerPhone || !owner) {
                                return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));
                            }

                            // 🔁 พยายาม generate QR ไม่เกิน 3 ครั้ง
                            let qr;
                            let attempts = 0;
                            const maxAttempts = 3;
                            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                            while (attempts < maxAttempts) {
                                qr = await this.generateBillLaoQRPro(value, mId, owner, ownerPhone);
                                if (qr?.status === 'OK') break;
                                console.log('Attempt', attempts + 1, 'failed. Retrying...');
                                attempts++;
                                await delay(500);
                            }

                            if (!qr || qr.status !== 'OK') {
                                return res.send(PrintError(d.command, [], EMessage.generateQRFailed, null));
                            }

                            const qrData = qr.data.emv;
                            const bill = {
                                uuid: uuid4(),
                                clientId,
                                qr: qrData,
                                transactionID: qr.requestId ?? '',
                                machineId: machineId.machineId,
                                hashM: "",
                                hashP: "",
                                paymentmethod: d.command,
                                paymentref: qrData,
                                paymentstatus: EPaymentStatus.pending,
                                paymenttime: new Date(),
                                requestpaymenttime: new Date(),
                                totalvalue: value,
                                vendingsales: sale,
                                isActive: true,
                            } as VendingMachineBillModel;

                            const m = await machineClientIDEntity.findOne({
                                where: {
                                    machineId: machineId.machineId,
                                },
                            });
                            const ownerUuid = m?.ownerUuid || "";
                            const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + "_" + ownerUuid, dbConnection);
                            await ent.sync();

                            ent.create(bill).then(async (r) => {
                                redisClient.setex(qr.requestId + EMessage.BillCreatedTemp, 60 * 15, ownerUuid);
                                redisClient.save();

                                let result = (await redisClient.get(machineId.machineId + EMessage.ListTransaction)) ?? '[]';
                                let trandList: Array<any>;
                                try {
                                    trandList = JSON.parse(result);
                                    if (!Array.isArray(trandList)) {
                                        console.warn('trandList is not an array, initializing as empty array');
                                        trandList = [];
                                    }
                                } catch (error) {
                                    console.error('JSON parse error:', error.message);
                                    trandList = [];
                                }

                                if (trandList.length >= 5) {
                                    console.log('REMOVE FIRST TRAND');
                                    trandList.splice(0, 1);
                                }

                                trandList.push({
                                    transactionID: bill.transactionID,
                                    createdAt: new Date()
                                });

                                if (phoneNumber) {
                                    redisClient.setex(r.transactionID + EMessage.TransactionPhone, 60 * 15, JSON.stringify({
                                        phone: phoneNumber,
                                        orderBill: d?.data?.orderBill
                                    }));
                                    redisClient.save();
                                }

                                redisClient.setex(machineId.machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(trandList));
                                const event: IVendingEventLog = {
                                    machineId: machineId?.machineId,
                                    event: EVendingEvent.selling,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                                    data: { data: bill, time: new Date() },//[{time, position, product, price,ip,data}
                                    date: momenttz().tz(SERVER_TIME_ZONE).date(),
                                    month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                                    year: momenttz().tz(SERVER_TIME_ZONE).year()
                                };
                                await setVendingEvent(EVendingEvent.selling, event);
                                res.send(PrintSucceeded(d.command, r, EMessage.succeeded, null));
                            });
                        } else if (d.command == EClientCommand.buyTopUp) {
                            const sale = d.data.ids as Array<IVendingMachineSale>;
                            const machineId = this.findMachineIdToken(d.token);

                            if (!machineId) return res.send(PrintError(d.command, [], EMessage.tokenNotFound, null));
                            if (!Array.isArray(sale)) throw new Error("Invalid array id");
                            if (await this.isMachineDisabled(machineId.machineId)) return res.send(PrintError(d.command, [], EMessage.machineisdisabled, null));

                            const checkIds = Array<IVendingMachineSale>();
                            sale.forEach((v) => {
                                v.stock.qtty = 1;
                                const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                                y.stock.qtty = 1;
                                y.stock.image = "";
                                y.machineId = machineId.machineId;
                                checkIds.push(y);
                            });

                            const value = checkIds.reduce((a, b) => a + b.stock.price * b.stock.qtty, 0);
                            if (Number(d.data.value) != value) return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));

                            const a = machineId?.data?.find(v => v.settingName == 'setting');
                            const mId = a?.imei + '';
                            const ownerPhone = a?.ownerPhone + '';
                            const owner = (a?.owner + '').trim();

                            if (!mId || !ownerPhone || !owner) {
                                return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));
                            }
                            const x = new Date().getTime();

                            const transactionID = String(mId.substring(mId.length - 8)) + (x + '').substring(5);

                            const bill = {
                                uuid: uuid4(),
                                clientId,
                                qr: '',
                                transactionID: transactionID + '',
                                machineId: machineId.machineId,
                                hashM: "",
                                hashP: "",
                                paymentmethod: d.command,
                                paymentref: '',
                                paymentstatus: EPaymentStatus.pending,
                                paymenttime: new Date(),
                                requestpaymenttime: new Date(),
                                totalvalue: value,
                                vendingsales: sale,
                                isActive: true,
                            } as VendingMachineBillModel;

                            const m = await machineClientIDEntity.findOne({
                                where: {
                                    machineId: machineId.machineId,
                                },
                            });
                            const ownerUuid = m?.ownerUuid || "";
                            const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + "_" + ownerUuid, dbConnection);
                            await ent.sync();

                            ent.create(bill).then(async (r) => {
                                redisClient.setex(transactionID + EMessage.BillCreatedTemp, 60 * 15, ownerUuid);
                                redisClient.save();

                                let result = (await redisClient.get(machineId.machineId + EMessage.ListTransaction)) ?? '[]';
                                let trandList: Array<any>;
                                try {
                                    trandList = JSON.parse(result);
                                    if (!Array.isArray(trandList)) {
                                        console.warn('trandList is not an array, initializing as empty array');
                                        trandList = [];
                                    }
                                } catch (error) {
                                    console.error('JSON parse error:', error.message);
                                    trandList = [];
                                }

                                if (trandList.length >= 1) {
                                    console.log('REMOVE FIRST TRAND');
                                    trandList.splice(0, 1);
                                }

                                trandList.push({
                                    transactionID: bill.transactionID,
                                    createdAt: new Date()
                                });

                                redisClient.setex(machineId.machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(trandList));
                                res.send(PrintSucceeded(d.command, r, EMessage.succeeded, null));
                            });
                        }

                        //      {

                        //     const sale = d.data.ids as Array<IVendingMachineSale>;
                        //     const machineId = this.findMachineIdToken(d.token);
                        //     const checkCountGen = await checkGenerateCount(machineId?.machineId);
                        //     if (checkCountGen.status == 1) {
                        //         const ws = this.wsClient.find(v => v['machineId'] === machineId.machineId);
                        //         ws?.send(
                        //             JSON.stringify(
                        //                 PrintSucceeded(
                        //                     "ping",
                        //                     {
                        //                         command: "ping",
                        //                         production: this.production,
                        //                         setting: { refresh: true }
                        //                     },
                        //                     EMessage.succeeded,
                        //                     null
                        //                 )
                        //             )
                        //         );
                        //         return res.send(PrintError(d.command, [], EMessage.LaoQRCount, null));
                        //     }

                        //     if (!machineId) return res.send(PrintError(d.command, [], EMessage.tokenNotFound, null));

                        //     if (!Array.isArray(sale)) throw new Error("Invalid array id");

                        //     if (await this.isMachineDisabled(machineId.machineId)) return res.send(PrintError(d.command, [], EMessage.machineisdisabled, null));

                        //     const checkIds = Array<IVendingMachineSale>();
                        //     sale.forEach((v) => {
                        //         v.stock.qtty = 1;
                        //         const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                        //         y.stock.qtty = 1;
                        //         y.stock.image = "";
                        //         y.machineId = machineId.machineId
                        //         checkIds.push(y);
                        //     });

                        //     const value = checkIds.reduce((a, b) => {
                        //         return a + b.stock.price * b.stock.qtty;
                        //     }, 0);


                        //     if (Number(d.data.value) != value) return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));

                        //     let a = machineId?.data?.find(v => v.settingName == 'setting');


                        //     let mId = a?.imei + '';

                        //     if (!mId) return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));

                        //     let ownerPhone = a?.ownerPhone + '';

                        //     if (!ownerPhone) return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));

                        //     if (a.owner == null || a.owner == undefined || a.owner == "") return res.send(PrintError(d.command, [], EMessage.invalidDataAccess, null));




                        //     const qr = await this.generateBillLaoQRPro(
                        //         value,
                        //         mId + '',
                        //         (a.owner + '').trim(),
                        //         ownerPhone
                        //     );


                        //     if (qr.status != 'OK') return res.send(PrintError(d.command, [], EMessage.generateQRFailed, null));

                        //     const qrData = qr.data.emv;

                        //     const bill = {
                        //         uuid: uuid4(),
                        //         clientId,
                        //         qr: qrData,
                        //         transactionID: qr.requestId ?? '' + '',
                        //         machineId: machineId.machineId,
                        //         hashM: "",
                        //         hashP: "",
                        //         paymentmethod: d.command,
                        //         paymentref: qrData,
                        //         paymentstatus: EPaymentStatus.pending,
                        //         paymenttime: new Date(),
                        //         requestpaymenttime: new Date(),
                        //         totalvalue: value,
                        //         vendingsales: sale,
                        //         isActive: true,
                        //     } as VendingMachineBillModel;



                        //     const m = await machineClientIDEntity.findOne({
                        //         where: {
                        //             machineId: this.findMachineIdToken(d.token)
                        //                 ?.machineId,
                        //         },
                        //     });
                        //     const ownerUuid = m?.ownerUuid || "";
                        //     const ent = VendingMachineBillFactory(
                        //         EEntity.vendingmachinebill + "_" + ownerUuid,
                        //         dbConnection
                        //     );
                        //     await ent.sync();

                        //     ent.create(bill).then(async (r) => {

                        //         redisClient.setex(qr.requestId + EMessage.BillCreatedTemp, 60 * 15, ownerUuid);
                        //         redisClient.save();

                        //         let resule = (await redisClient.get(machineId.machineId + EMessage.ListTransaction)) ?? '[]';


                        //         let trandList: Array<any>;
                        //         try {
                        //             trandList = JSON.parse(resule);
                        //             if (!Array.isArray(trandList)) {
                        //                 console.warn('trandList is not an array, initializing as empty array');
                        //                 trandList = [];
                        //             }
                        //         } catch (error) {
                        //             console.error('JSON parse error:', error.message);
                        //             trandList = [];
                        //         }

                        //         if (trandList.length >= 1) {
                        //             console.log('REMOVE FIRST TRAND');
                        //             trandList.splice(0, 1);
                        //         }
                        //         trandList.push({
                        //             transactionID: bill.transactionID,
                        //             createdAt: new Date()
                        //         });

                        //         redisClient.setex(machineId.machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(trandList));


                        //         res.send(PrintSucceeded(d.command, r, EMessage.succeeded, null));
                        //     });
                        // }
                        else {
                            res.send(PrintError(d.command, [], EMessage.notsupport, null));
                        }
                    }
                } catch (error: any) {
                    console.log("error", error);
                    res.send(
                        PrintError(d.command, this.production || error, error.message, null)
                    );
                }
            });

            router.post(this.path + "/updateStatus", async (req, res) => {
                console.log('updateStatus', req.body);
                const d = req.body as IReqModel;
                // console.log(d.command, EClientCommand.VMC_MACHINE_STATUS, d.command == EClientCommand.VMC_MACHINE_STATUS)

                try {
                    const { token, transactionID, data } = d;

                    const machineId =
                        this.findMachineIdToken(token)?.machineId;
                    // console.log('token', token, 'machineId', machineId, machineId);
                    if (!machineId) throw new Error("Invalid token");
                    const m = await machineClientIDEntity.findOne({
                        where: {
                            machineId: this.findMachineIdToken(d.token)
                                ?.machineId,
                        },
                    });
                    if (!m) throw new Error(EMessage.machineNotExist);


                    if (d.command == EClientCommand.VMC_CREDIT_NOTE) {
                        this.creditMachineVMC(machineId, m.ownerUuid, transactionID, data, res).then(r => {
                            // console.log('CREDIT NOTE', r);
                            res.send(
                                PrintSucceeded(
                                    d.command,
                                    d.data,
                                    EMessage.succeeded,
                                    returnLog(req, res)
                                )
                            );
                        }).catch(e => {
                            res.send(PrintError("VMC_CREDIT_NOTE", e, EMessage.error, null));
                        });
                    }
                    else if (d.command == EClientCommand.VMC_MACHINE_STATUS) { // fafb52
                        // UPDATE machine status here 
                        const hex = data + '';
                        const mstatus = parseMachineVMCStatus(hex);
                        if (mstatus) {
                            mstatus.lastUpdate = new Date();
                            mstatus.device = 'VMC';
                        }


                        writeMachineStatus(machineId, mstatus);
                        console.log('VMC_MACHINE_STATUS', machineId, mstatus);

                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );
                    }

                    else if (d.command == EClientCommand.ADH814_STATUS) {
                        const mstatus = { temperature: data, device: 'ADH814' } as IMachineStatus;
                        console.log(`-----> ADH814 ${machineId}, status: ${JSON.stringify(mstatus)}`);

                        try {
                            LogsTempEntity.create({ machineId: machineId, mstatus: mstatus }).then(r => {
                            }).catch(e => {
                                console.log('error save temp to database', e);
                            });

                        } catch (error) {
                            console.log('Error save temp to database', error);
                        }

                        writeMachineStatus(machineId, mstatus)

                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );
                    }

                    else if (d.command == EClientCommand.VMC_DISPENSE || EClientCommand.VMC_DISPENSED || EClientCommand.VMC_DISPENSEFAILED) {

                        // update order status after deliverying here 
                        //FA FB 06 05 A6 01 00 00 3C 99 ==> 3C is 60 slot sent command
                        const hex = data + '';
                        const slot = parseInt(hex.substring(hex.length - 4, hex.length - 2), 16);
                        // if (data.substring(10, 12) == '01') { console.log('Dispensing', await dropLogEntity.create({ machineId: machineId, body: `Slot ${slot} is dispensing`, status: EClientCommand.VMC_DISPENSE })) }
                        // if (data.substring(10, 12) == '02') { console.log('Dispensed', await dropLogEntity.create({ machineId: machineId, body: `Slot ${slot} is dispensed`, status: EClientCommand.VMC_DISPENSED })) }
                        // if (data.substring(10, 12) == '03') { console.log('Drop failed', await dropLogEntity.create({ machineId: machineId, body: `Slot ${slot} is dispensefailed`, status: EClientCommand.VMC_DISPENSEFAILED })) }
                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );
                    }
                    else if (d.command == EClientCommand.VMC_UNKNOWN) {
                        // handle unknown command here
                        // console.log('VMC_UNKNOWN', data);
                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );
                    }
                    else if (d.command == EClientCommand.MACHINE_STATUS) {
                        // handle unknown command here
                        // console.log('MACHINE_STATUS', data);
                        // writeMachineStatus(machineId, mstatus);
                        // console.log('VMC_MACHINE_STATUS', data);
                        let mstatus = {} as IMachineStatus;
                        if (!data)
                            mstatus.lastUpdate = new Date();
                        mstatus.temperature = data?.temperature;
                        writeMachineStatus(machineId, mstatus);
                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );
                    }
                    else {
                        await LogActivity.create({
                            url: machineId,
                            body: `updateStatus ${d.command} ${data}`,
                            error: data
                        })
                        res.send(
                            PrintSucceeded(
                                d.command,
                                d.data,
                                'NOTHING ' + EMessage.succeeded,
                                returnLog(req, res)
                            )
                        );



                    }
                } catch (error) {
                    console.log('updateStatus error', error);
                    res.send(PrintError("updateStatus", error, EMessage.error, returnLog(req, res, true)));
                }

            });




            // router.post(this.path + "/creditMMoney", (req, res) => {
            //     const d = req.body as IReqModel;
            //     // this.creditMachineMMoney(d);
            //     // res.send({ message: "wait", status: 1 });
            // });
            router.post(this.path + "/refreshMachineAdmin",
                this.checkSuperAdmin,
                this.validateSuperAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;

                        const wsx = this.wsClient.filter(v => v['machineId'] === m);
                        wsx.forEach(ws => {
                            if (ws.readyState === WebSocketServer.OPEN)
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(
                                            "ping",
                                            {
                                                command: "ping",
                                                production: this.production,
                                                balance: {},
                                                limiter: {},
                                                merchant: {},
                                                mymmachinebalance: {},
                                                mymlimiterbalance: {},
                                                setting: { refresh: true },
                                                mstatus: {},
                                                mymstatus: {},
                                                mymsetting: {},
                                                mymlimiter: {},
                                                app_version: {},
                                                pendingStock: {},

                                                adsSetting: {},
                                                adsVersion: {},
                                                settingVersion: {},

                                            },
                                            EMessage.succeeded
                                            ,
                                            null
                                        )
                                    )
                                );
                        })


                        res.send(PrintSucceeded("refreshMachine", !!wsx, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                });

            router.post(this.path + '/wsalert',
                async (req, res) => {
                    try {
                        const machinetoken = req.body?.machinetoken;
                        if (!machinetoken) {
                            return res.send(PrintError('wsalert', null, EMessage.bodyIsEmpty))
                        }
                        const data = req.body?.data;
                        const machine = this.findMachineIdToken(machinetoken);
                        if (!machine) {
                            return res.send(PrintError('wsalert', null, EMessage.machineNotExist))
                        }

                        const resD = {} as IResModel;
                        resD.command = EMACHINE_COMMAND.wsalert;
                        // resD.message = EMessage.openstock;
                        resD.data = data;
                        this.sendWSToMachine(machine.machineId, resD)
                    } catch (error) {
                        res.send(PrintError('wsalert', error, EMessage.unknownError))
                    }

                }
            )
            router.post(this.path + "/refreshMachine",
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;

                        // const w = ws.find(v=>v['clientId']);
                        // console.log(`----------->`, m);

                        const wsx = this.wsClient.filter(v => v['machineId'] === m);
                        // ws.send(
                        //     JSON.stringify(
                        //         PrintSucceeded(
                        //             "ping",
                        //             {
                        //                 command: "ping",
                        //                 production: this.production,
                        //                 setting: { refresh: true }
                        //             },
                        //             EMessage.succeeded,
                        //             null
                        //         )
                        //     )
                        // );
                        wsx.forEach(ws => {
                            if (ws.readyState === WebSocketServer.OPEN)
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(
                                            "ping",
                                            {
                                                command: "ping",
                                                production: this.production,
                                                balance: {},
                                                limiter: {},
                                                merchant: {},
                                                mymmachinebalance: {},
                                                mymlimiterbalance: {},
                                                setting: { refresh: true },
                                                mstatus: {},
                                                mymstatus: {},
                                                mymsetting: {},
                                                mymlimiter: {},
                                                app_version: {},
                                                pendingStock: {},

                                                adsSetting: {},
                                                adsVersion: {},
                                                settingVersion: {},

                                            },
                                            EMessage.succeeded
                                            ,
                                            null
                                        )
                                    )
                                );
                        })


                        res.send(PrintSucceeded("refreshMachine", !!wsx, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                });

            router.post(this.path + "/validateHMVending",
                async (req, res) => {
                    try {
                        const token = req.body.token;
                        if (!token) {
                            return res.send(PrintError("validateHMVending", {}, EMessage.notallowed, returnLog(req, res, true)));
                        }
                        const machineData = this.findMachineIdToken(token);
                        if (!machineData) {
                            return res.send(PrintError('validateHMVending', null, EMessage.machineNotExist, returnLog(req, res, true)));
                        }
                        if (machineData.data?.length < 1) {
                            return res.send(PrintError('validateHMVending', null, EMessage.notallowed, returnLog(req, res, true)));
                        }
                        return res.send(PrintSucceeded('validateHMVending', { 'ownerUuid': machineData?.ownerUuid, 'merchantId': machineData?.data[0]?.owner, 'mobileNo': machineData?.data[0]?.ownerPhone, 'channel': machineData?.data[0]?.imei }, EMessage.succeeded))
                    } catch (error) {
                        res.send(PrintError("validateHMVending", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            );
            router.post(this.path + "/exitAppMachineAdmin",
                this.checkSuperAdmin,
                this.validateSuperAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;
                        const wsx = this.wsClient.filter(v => v['machineId'] === m);
                        wsx.forEach(ws => {
                            if (ws.readyState === WebSocketServer.OPEN)
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(
                                            "ping",
                                            {
                                                command: "ping",
                                                production: this.production,
                                                balance: {},
                                                limiter: {},
                                                merchant: {},
                                                mymmachinebalance: {},
                                                mymlimiterbalance: {},
                                                setting: { exit: true },
                                                mstatus: {},
                                                mymstatus: {},
                                                mymsetting: {},
                                                mymlimiter: {},
                                                app_version: {},
                                                pendingStock: {},

                                                adsSetting: {},
                                                adsVersion: {},
                                                settingVersion: {},
                                            },
                                            EMessage.succeeded,
                                            null
                                        )
                                    )
                                );
                        })

                        res.send(PrintSucceeded("exitMachineAdmin", !!wsx, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("exitMachineAdmin", error, EMessage.error, returnLog(req, res, true)));
                    }
                });
            router.post(this.path + "/exitAppMachine",
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;

                        // const w = ws.find(v=>v['clientId']);
                        // console.log(`----------->`, m);

                        const wsx = this.wsClient.filter(v => v['machineId'] === m);
                        // ws.send(
                        //     JSON.stringify(
                        //         PrintSucceeded(
                        //             "ping",
                        //             {
                        //                 command: "ping",
                        //                 production: this.production,
                        //                 setting: { exit: true }
                        //             },
                        //             EMessage.succeeded,
                        //             null
                        //         )
                        //     )
                        // );
                        wsx.forEach(ws => {
                            if (ws.readyState === WebSocketServer.OPEN)
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(
                                            "ping",
                                            {
                                                command: "ping",
                                                production: this.production,
                                                balance: {},
                                                limiter: {},
                                                merchant: {},
                                                mymmachinebalance: {},
                                                mymlimiterbalance: {},
                                                setting: { exit: true },
                                                mstatus: {},
                                                mymstatus: {},
                                                mymsetting: {},
                                                mymlimiter: {},
                                                app_version: {},
                                                pendingStock: {},

                                                adsSetting: {},
                                                adsVersion: {},
                                                settingVersion: {},
                                            },
                                            EMessage.succeeded,
                                            null
                                        )
                                    )
                                );
                        })



                        res.send(PrintSucceeded("exitAppMachine", !!wsx, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("exitAppMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                });

            router.post(
                this.path + "/getDeliveryingBills",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        let m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        m = JSON.parse(JSON.stringify(m));
                        const ownerUuid = m?.ownerUuid || "";
                        // const machineId = m?.machineId;
                        // console.log("getDeliveryingBills", m, ownerUuid);

                        this.getBillProcess(m.machineId, (b) => {
                            // console.log(
                            //     "getDeliveryingBills",
                            //     b,
                            //     b.filter((v) => v.ownerUuid == ownerUuid)
                            // );
                            res.send(
                                PrintSucceeded(
                                    "getDeliveryingBills",
                                    b.filter((v) => v.ownerUuid == ownerUuid),
                                    EMessage.succeeded, returnLog(req, res)

                                )
                            );
                        });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getDeliveryingBills", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/getPaidBills",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['machineId']?.ownerUuid || "";
                        // console.log('ownerUuid :', ownerUuid);

                        const machineId = res.locals['machineId']?.machineId;
                        // console.log('machineId :', machineId);

                        const entx = VendingMachineBillFactory(
                            EEntity.vendingmachinebillpaid + "_" + ownerUuid,
                            dbConnection
                        );
                        await entx.sync();

                        entx
                            .findAll({
                                where: {
                                    machineId, paymentstatus: EPaymentStatus.paid, createdAt: {
                                        [Op.gte]: momenttz().tz('UTC').subtract(15, 'minutes').toDate(),
                                        [Op.lte]: momenttz().tz('UTC').toDate(),
                                    },
                                },
                                order: [['createdAt', 'DESC']],
                            })
                            .then((r) => {
                                this.getBillProcess(machineId, (b) => {
                                    console.log("getPaidBills length", r.length, b.map(v => v.bill)?.length);
                                    console.log("getPaidBills", r.map(v => { return { t: v.transactionID, paymentstatus: v.paymentstatus } }), b.map(v => v.bill)?.length);
                                    const resx = {} as IResModel;
                                    resx.command = EMACHINE_COMMAND.waitingt;
                                    resx.message = EMessage.waitingt;
                                    resx.status = 1;
                                    resx.data = b.filter((v) => v.ownerUuid == ownerUuid && v?.bill?.paymentstatus == EPaymentStatus.paid);
                                    this.sendWSToMachine(machineId, resx);
                                    res.send(
                                        PrintSucceeded(
                                            "getPaidBills",
                                            resx.data, EMessage.succeeded, returnLog(req, res)
                                        )
                                    );
                                });
                                // res.send(PrintSucceeded("getPaidBills", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                res.send(PrintError("init", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getPaidBills", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/getBills",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const { token } = req.body;
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId;
                        const entx = VendingMachineBillFactory(
                            EEntity.vendingmachinebill + "_" + ownerUuid,
                            dbConnection
                        );
                        await entx.sync();

                        entx
                            .findAll({ where: { machineId } })
                            .then((r) => {
                                res.send(PrintSucceeded("getPaidBills", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                res.send(PrintError("getBills", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getBills", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            const allMachines = new Array<{ m: string; t: number }>();


            router.post(
                this.path + "/retryProcessBillNew",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = req.body.ownerUuid;
                        const transactionID = req.body.trandID;

                        const position = Number(req.query["position"]);
                        let ent = VendingMachineBillFactory(
                            EEntity.vendingmachinebill + "_" + ownerUuid,
                            dbConnection
                        );
                        await ent.sync();

                        const bill = await ent.findOne({
                            where: { transactionID: transactionID },
                        });

                        if (!bill) {
                            return res.send(PrintError("retryProcessBill", "bill not found", EMessage.billnotfound));
                        }


                        const dataStock = JSON.parse(JSON.stringify(bill.dataValues.vendingsales));

                        const hasPosition = dataStock.some((item: any) => item.position === position);

                        if (!hasPosition) {
                            console.log("ไม่พบ Position นี้");
                        } else {
                            const items = dataStock.filter((item: any) => item.position === position && !item.dropAt);
                            if (items.length === 0) {
                                // console.log("มีทุกตัวแล้ว");
                            } else {
                                // สุ่มเลือกตัวหนึ่งจากรายการที่ยังไม่มี dropAt
                                const randomIndex = Math.floor(Math.random() * items.length);
                                const selectedItem = items[randomIndex];
                                selectedItem.dropAt = new Date().toISOString();
                                // console.log("อัปเดตข้อมูล:", selectedItem);

                                bill.vendingsales = dataStock;
                                bill.changed("vendingsales", true);
                                await bill.save();
                                ent = null;
                            }
                        }

                        res.send(
                            PrintSucceeded(
                                "retryProcessBill",
                                {},
                                EMessage.succeeded, returnLog(req, res)
                            )
                        );
                        // }, 1000);
                    } catch (error) {
                        console.log(error);
                        writeErrorLogs(error.message, error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true)));
                        // writeMachineLockDrop(res.locals["machineId"]?.machineId);
                    }
                }
            );


            router.post(
                this.path + "/confirmPaidBill",
                // this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        // console.log('*****transactionList');

                        const machineId = req.body.machineId;
                        const transactionList: any = req.body.transactionList;



                        this.getBillProcess(machineId, async (b) => {

                            if (b.length == 0) {
                                // resolve(null);
                                return res.send(PrintError("confirmPaidBill", "bill not found", EMessage.billnotfound));
                            }

                            const withTransaction = [];

                            b.forEach((item) => {
                                if (transactionList.includes(item.transactionID)) {
                                    withTransaction.push(item);
                                } else {
                                    // withoutTransaction.push(item);
                                }
                            });

                            // console.log("อันที่มี transactionID:", withTransaction);

                            let billPaid = [];


                            for (let index = 0; index < withTransaction.length; index++) {
                                const element = withTransaction[index];
                                // console.log('*****element', element);
                                if (element.bill.paymentstatus == EPaymentStatus.paid) {
                                    billPaid.push(element);
                                } else {
                                    // billNotPaid.push(element);
                                }
                            }

                            // setImmediate(async () => {
                            // for (let index = 0; index < billPaid.length; index++) {
                            //     const element = billPaid[index];
                            //     let ent = VendingMachineBillFactory(
                            //         EEntity.vendingmachinebill + "_" + element['ownerUuid'],
                            //         dbConnection
                            //     );
                            //     const bill = await ent.findOne({
                            //         where: { transactionID: element.bill.transactionID },
                            //     });

                            //     bill.paymentstatus = EPaymentStatus.delivered;
                            //     bill.changed("paymentstatus", true);
                            //     await bill.save();
                            //     ent = null;

                            // }
                            // })

                            for (let index = 0; index < billPaid.length; index++) {
                                const element = billPaid[index];
                                let ent = VendingMachineBillFactory(
                                    EEntity.vendingmachinebill + "_" + element['ownerUuid'],
                                    dbConnection
                                );
                                await ent.sync();

                                const bill = await ent.findOne({
                                    where: { transactionID: element.bill.transactionID },
                                });

                                bill.paymentstatus = EPaymentStatus.delivered;
                                bill.changed("paymentstatus", true);
                                await bill.save();
                                ent = null;

                            }

                            let billNotPaid = b.filter(
                                (item) => !billPaid.some((a) => a.transactionID === item.transactionID)
                            );


                            // console.log('*****billPaid', billPaid);

                            // console.log('*****billNotPaid', billNotPaid);
                            this.setBillProces(machineId, billNotPaid);

                            const event: IVendingEventLog = {
                                machineId: machineId,
                                event: EVendingEvent.selling,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                                data: { data: billPaid, time: new Date() },//[{time, position, product, price,ip,data}
                                date: momenttz().tz(SERVER_TIME_ZONE).date(),
                                month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                                year: momenttz().tz(SERVER_TIME_ZONE).year()
                            };
                            await setVendingEvent(EVendingEvent.selling, event);

                        });

                        res.send(
                            PrintSucceeded(
                                "confirmPaidBill",
                                {},
                                EMessage.succeeded, returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        writeErrorLogs(error.message, error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true)));
                        // writeMachineLockDrop(res.locals["machineId"]?.machineId);
                    }
                }
            );



            router.post(
                this.path + "/checkCallbackMMoney",
                // this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        // console.log('*****transactionList');

                        const transactionID = req.body.transactionID;
                        if (!transactionID) {
                            return res.send(PrintError("checkCallbackMMoney", "bill not found", EMessage.transactionnotfound));
                        }

                        return res.send(
                            PrintSucceeded(
                                "confirmPaidBill",
                                {},
                                EMessage.succeeded, returnLog(req, res)
                            )
                        );

                        // return PrintError("checkCallbackMMoney", "bill not found", EMessage.transactionnotfound);


                    } catch (error) {
                        console.log(error);
                        writeErrorLogs(error.message, error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true)));
                        // writeMachineLockDrop(res.locals["machineId"]?.machineId);
                    }
                }
            );


            router.post(
                this.path + "/retryProcessBill",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        // console.log('start retryProcessBill');


                        writeMachineLockDrop(res.locals["machineId"]?.machineId, 'true');




                        const position = Number(req.query["position"]);
                        const transactionID = Number(req.query["T"] + "");
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId || "";
                        const that = this;
                        const mx = allMachines.find(v => v.m == machineId);
                        // console.log(' retryProcessBill', mx);
                        if (mx) {
                            if (moment().diff(moment(mx.t), 'milliseconds') < 3000) return res.send(
                                PrintError("retryProcessBill", [], EMessage.error + ' too fast', returnLog(req, res, true))
                            );
                            mx.t = moment.now();
                        } else {
                            allMachines.push({ m: machineId, t: moment.now() });
                        }

                        // setTimeout(() => {
                        // console.log(' retryProcessBill', 'getBillProcess', mx);

                        this.getBillProcess(machineId, (b) => {
                            try {
                                let x = b.find(
                                    (v) =>
                                        v.position == position &&
                                        v.transactionID == Number(transactionID + "") &&
                                        v.ownerUuid == ownerUuid
                                );
                                // console.log(
                                //     "processOrder",
                                //     machineId,
                                //     position,
                                //     transactionID
                                // );
                                // console.log(
                                //     "found x ",
                                //     x.ownerUuid,
                                //     x.position,
                                //     x.transactionID
                                // );
                                if (!x)
                                    throw new Error("transaction not found or wrong position");
                                //*** 1 time retry only for MMONEY ONly*/

                                const pos = this.ssocket.processOrder(
                                    machineId,
                                    position,
                                    transactionID
                                );
                                // put here to be 0% to be double drop
                                //that.setBillProces(
                                // b.filter((v) => v.transactionID != transactionID)
                                // );
                                // that.deductStock(transactionID, x.bill, position);

                                //   const retry = 1; // set config and get config at redis and deduct the retry times;
                                // 3% risk to be double drop
                                // console.log(' retryProcessBill', 'pos', pos);

                                if (pos.code) {
                                    that.setBillProces(machineId,
                                        b.filter((v) => v.transactionID != transactionID)
                                    );
                                    // console.log(' retryProcessBill', 'deduct', pos);
                                    that.deductStock(transactionID, x.bill, position);
                                    writeSucceededRecordLog(x?.bill, position);
                                    res.send(
                                        PrintSucceeded(
                                            "retryProcessBill",
                                            { position, bill: x?.bill, transactionID, pos },
                                            EMessage.succeeded, returnLog(req, res)
                                        )
                                    );
                                    writeMachineLockDrop(res.locals["machineId"]?.machineId);
                                } else {
                                    writeErrorLogs('error pos.code', pos);
                                    // console.log(' retryProcessBill', 'error pos', pos);

                                    res.send(
                                        PrintError("retryProcessBill", pos, EMessage.error, returnLog(req, res, true))
                                    );
                                    writeMachineLockDrop(res.locals["machineId"]?.machineId);
                                }
                            } catch (error) {
                                console.log("error retryProcessBill", error, returnLog(req, res, true));
                                writeErrorLogs(error.message, error);
                                res.send(
                                    PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true))
                                );
                                writeMachineLockDrop(res.locals["machineId"]?.machineId);
                            }
                        });
                        // }, 1000);
                    } catch (error) {
                        console.log(error);
                        writeErrorLogs(error.message, error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true)));
                        writeMachineLockDrop(res.locals["machineId"]?.machineId);
                    }
                }
            );
            router.get(
                this.path + "/getAllPaidBills",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId;
                        const entx = VendingMachineBillFactory(
                            EEntity.vendingmachinebillpaid + "_" + ownerUuid,
                            dbConnection
                        );
                        await entx.sync();

                        entx
                            .findAll()
                            .then((r) => {
                                res.send(
                                    PrintSucceeded("getAllPaidBills", r, EMessage.succeeded, returnLog(req, res))
                                );
                            })
                            .catch((e) => {
                                res.send(PrintError("getAllPaidBills", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getAllPaidBills", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.get(
                this.path + "/getAllBills",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId;
                        const entx = VendingMachineBillFactory(
                            EEntity.vendingmachinebill + "_" + ownerUuid,
                            dbConnection
                        );
                        await entx.sync();

                        entx
                            .findAll()
                            .then((r) => {
                                res.send(PrintSucceeded("getAllBills", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                res.send(PrintError("getAllBills", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getAllBills", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(this.path + "/getOnlineMachines",
                this.checkSuperAdmin,
                this.validateSuperAdmin,
                async (req, res) => {
                    try {
                        // console.log(" WS getOnlineMachines");
                        res.send(
                            PrintSucceeded(
                                "init",
                                await this.listOnlineMachines(),
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("init", error, EMessage.error, returnLog(req, res, true)));
                    }
                });
            router.post(this.path + "/updatewarehouse",
                this.checkSuperAdmin,
                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;
                        const d = req?.body?.data?.data;
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const ent = WarehouseFactory('warehouse_' + ownerUuid, dbConnection);
                        await ent.sync();

                        let result = {} as any;

                        result = await ent.create({ machineId: m, data: d });
                        res.send(PrintSucceeded("updatewarehouse", result, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updatewarehouse", error, EMessage.error, returnLog(req, res, true)));
                    }
                });
            router.post(this.path + "/getwarehouse",
                this.checkSuperAdmin,
                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req?.body?.data?.machineId;
                        const page = req?.body?.data?.page || 1;
                        const limit = req?.body?.data?.limit || 10;
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const ent = WarehouseFactory('warehouse_' + ownerUuid, dbConnection);
                        await ent.sync();
                        const machine = await ent.findOne({ where: { machineId: m }, order: [['createdAt', 'DESC']], offset: (page - 1), limit: limit });
                        res.send(PrintSucceeded("updatewarehouse", machine, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updatewarehouse", error, EMessage.error, returnLog(req, res, true)));
                    }
                });

            // Get Mmoney UserInof
            router.post(
                this.path + "/getMmoneyUserInfo",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const msisdn = req.query['phonenumber'];
                        axios
                            .post<IMMoneyGenerateQRRes>(
                                " https://qr.mmoney.la/pro/UserInfo",
                                { msisdn },
                                { headers: { 'lmm-key': 'va157f35a50374ba3a07a5cfa1e7fd5d90e612fb50e3bca31661bf568dcaa5c17' } }
                            )
                            .then((rx) => {
                                // console.log("getMmoneyUserInfo", rx);
                                if (rx.status) {
                                    writeActiveMmoneyUser(msisdn + '', JSON.stringify(rx.data));
                                    res.send(PrintSucceeded("getMmoneyUserInfo", rx.data, EMessage.succeeded, returnLog(req, res)));
                                } else {
                                    PrintError("getMmoneyUserInfo", [], EMessage.error, returnLog(req, res, true))
                                }
                            })
                            .catch((e) => {
                                PrintError("getMmoneyUserInfo", e.message, EMessage.error, returnLog(req, res, true))

                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getAllBills", error.message, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(this.path + "/listVendingEventLogs", this.checkAdmin, this.checkAdmin,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const date = Number(req.query["date"]) || momenttz().tz('UTC').date();
                        const month = Number(req.query["month"]) || momenttz().tz('UTC').month() + 1;
                        const year = Number(req.query["year"]) || momenttz().tz('UTC').year();
                        const page = Number(req.query["page"]) || 1;
                        const limit = Number(req.query["limit"]) || 100;
                        const offset = (page - 1) * limit;
                        // console.log('getVendingEventLog', date, month, year, page, limit, offset);
                        const r = await listVendingEventLogs(ownerUuid, date, month, year, offset, limit);
                        res.send(PrintSucceeded("getVendingEventLog", r, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getVendingEventLog", error, EMessage.error, returnLog(req, res, true)));
                    }
                });
            router.post(this.path + "/getVendingEventLog", this.checkAdmin, this.checkAdmin,
                async (req, res) => {
                    try {
                        const event = req.query["event"] + '' || '';
                        if (!event) return res.send(PrintError("getVendingEventLog", 'id is required', EMessage.error, returnLog(req, res, true)));
                        getVendingEvent(event).then(r => {
                            res.send(PrintSucceeded("getVendingEventLog", r, EMessage.succeeded, returnLog(req, res)));
                        }).catch(e => {
                            console.log(e);
                            res.send(PrintError("getVendingEventLog", e, EMessage.error, returnLog(req, res, true)));
                        })
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getVendingEventLog", error, EMessage.error, returnLog(req, res, true)));
                    }
                });

            router.post(
                this.path + "/addProduct",
                this.checkSuperAdmin,

                this.checkAdmin,

                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        try {
                            const ownerUuid = res.locals["ownerUuid"] || "";
                            const sEnt = StockFactory(
                                EEntity.product + "_" + ownerUuid,
                                dbConnection
                            );
                            // await sEnt.sync();
                            const o = req.body.data as IStock;
                            if (!o.name || !o.price)
                                return res.send(
                                    PrintError("addProduct", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                                );
                            // let base64Image = o.image.split(';base64,').pop();
                            // fs.writeFileSync(process.env._image_path+'/'+o.name+'_'+new Date().getTime(), base64Image+'', {encoding: 'base64'});
                            //    o.image= base64ToFile(o.image);
                            sEnt
                                .create(o)
                                .then((r) => {
                                    res.send(PrintSucceeded("addProduct", r, EMessage.succeeded, returnLog(req, res)));
                                })
                                .catch((e) => {
                                    console.log("error add product", e);

                                    res.send(PrintError("addProduct", e, EMessage.error, returnLog(req, res, true)));
                                });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/addProductImageSystem",
                this.checkSuperAdmin,

                this.checkAdmin,

                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        try {
                            const ownerUuid = res.locals["ownerUuid"] || "";
                            const sEnt = StockFactory(
                                EEntity.product + "_" + ownerUuid,
                                dbConnection
                            );
                            // await sEnt.sync();
                            const o = req.body.data as IProductImage;
                            if (!o.imageURL || !o.name || !o.price)
                                return res.send(
                                    PrintError("addProduct", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                                );
                            ProductImageEntity
                                .create(o)
                                .then((r) => {
                                    res.send(PrintSucceeded("addProduct", r, EMessage.succeeded, returnLog(req, res)));
                                })
                                .catch((e) => {
                                    console.log("error add product", e);

                                    res.send(PrintError("addProduct", e, EMessage.error, returnLog(req, res, true)));
                                });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/disableProduct",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = Number(req.query["id"]);
                        const isActive =
                            req.query["isActive"] + '' == 'no'
                                ? false
                                : true;
                        // console.log('req.query["isActive"]', !req.query["isActive"], req.query["isActive"], isActive,);

                        const sEnt = StockFactory(
                            EEntity.product + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findByPk(id)
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("disableProduct", [], EMessage.error, returnLog(req, res, true))
                                    );
                                // console.log('disableproduct', r);

                                r.isActive = isActive;
                                // console.log('disableproduct', r);
                                r.changed("isActive", true);
                                res.send(
                                    PrintSucceeded(
                                        "disableProduct",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error disable product", e);

                                res.send(PrintError("disableProduct", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/deleteProduct",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = Number(req.query["id"]);

                        const sEnt = StockFactory(
                            EEntity.product + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .destroy({ where: { id } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("deleteProduct", [], EMessage.error, returnLog(req, res, true))
                                    );
                                // console.log('deleteProduct', r);
                                res.send(
                                    PrintSucceeded(
                                        "deleteProduct",
                                        r,
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error deleteProduct", e);

                                res.send(PrintError("deleteProduct", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("deleteProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/listProduct",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];
                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const sEnt = StockFactory(
                            EEntity.product + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll({ where: { isActive: { [Op.in]: actives } } })
                            .then((r) => {
                                res.send(PrintSucceeded("listProduct", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error list product", e);

                                res.send(PrintError("listProduct", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/listProductImages",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];
                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        // const ownerUuid = res.locals["ownerUuid"] || "";
                        ProductImageEntity
                            .findAll({ where: { isActive: { [Op.in]: actives } } })
                            .then((r) => {
                                res.send(PrintSucceeded("listProductImages", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error listProductImages", e);

                                res.send(PrintError("listProductImages", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listProductImages", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/cloneSale",
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {

                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const o = req.body as IVendingCloneMachineSale;
                        if (!(ownerUuid && o.machineId && o.cloneMachineId)) return res.send(PrintError("cloneSale", [], EMessage.parametersEmpty, returnLog(req, res, true)));
                        const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + "_" + ownerUuid, dbConnection);
                        await sEnt.sync();
                        this.machineClientlist.findOne({ where: { machineId: o.machineId } }).then(r_findMachine => {
                            if (r_findMachine == null) return res.send(PrintError("cloneSale", [], EMessage.notfound, returnLog(req, res, true)));
                            this.machineClientlist.findOne({ where: { machineId: o.cloneMachineId } }).then(r_findCloneMachine => {
                                if (r_findCloneMachine == null) return res.send(PrintError("cloneSale", [], EMessage.notfoundCloneMachine, returnLog(req, res, true)));
                                sEnt.findAndCountAll({ where: { machineId: o.machineId } }).then(r_findMachineStock => {
                                    sEnt.findAndCountAll({ where: { machineId: o.cloneMachineId } }).then(r_findCloneMachineStock => {
                                        if (r_findCloneMachineStock.count == 0) return res.send(PrintError("cloneSale", [], EMessage.notFoundSaleForClone, returnLog(req, res, true)));

                                        let list: Array<any> = r_findMachineStock.rows;
                                        let cloneList: Array<any> = r_findCloneMachineStock.rows;
                                        let models: Array<any> = [];

                                        if (list != undefined && Object.entries(list).length > 0) {
                                            list.find(ml => {
                                                cloneList = cloneList.filter(mcl => mcl.stock.id !== ml.stock.id);
                                            });

                                        }

                                        for (let i = 0; i < cloneList.length; i++) {
                                            const data = {
                                                machineId: o.machineId,
                                                stock: cloneList[i].stock,
                                                position: cloneList[i].position,
                                                max: cloneList[i].max
                                            }
                                            models.push(data);
                                        }

                                        sEnt.bulkCreate(models).then(r_clonestock => {
                                            if (!r_clonestock) return res.send(PrintError("cloneSale error", [], EMessage.cloneStockFail, returnLog(req, res, true)));
                                            for (let i = 0; i < models.length; i++) {
                                                models[i].id = r_clonestock[i].id;
                                                models[i].uuid = r_clonestock[i].uuid;
                                                models[i].isActive = r_clonestock[i].isActive;
                                                models[i].createdAt = r_clonestock[i].createdAt;
                                                models[i].updatedAt = r_clonestock[i].updatedAt;
                                            }
                                            const loggg = [r_clonestock, list, cloneList, models];

                                            res.send(PrintSucceeded("cloneSale success", models, EMessage.succeeded, returnLog(req, res)));
                                        }).catch(error => res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true))));
                                    }).catch(error => res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true))));
                                }).catch(error => res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true))));
                            }).catch(error => res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true))));
                        }).catch(error => res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true))));

                    } catch (error) {
                        res.send(PrintError("cloneSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // normal version
            router.post(
                this.path + "/addSale",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    const ownerUuid = res.locals["ownerUuid"] || "";
                    const o = req.body.data as IVendingMachineSale;
                    const sEnt = VendingMachineSaleFactory(
                        EEntity.vendingmachinesale + "_" + ownerUuid,
                        dbConnection
                    );
                    await sEnt.sync();
                    this.machineClientlist
                        .findOne({ where: { machineId: o.machineId } })
                        .then((r) => {
                            if (!r)
                                return res.send(PrintError("addSale", [], EMessage.notfound, returnLog(req, res, true)));
                            if (!o.machineId || Number(o.position) == Number.NaN)
                                return res.send(
                                    PrintError("addSale", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                                );
                            const pEnt = StockFactory(
                                EEntity.product + "_" + ownerUuid,
                                dbConnection
                            );
                            pEnt.findByPk(o.stock.id).then((p) => {
                                if (!p)
                                    return res.send(
                                        PrintError("addSale", [], EMessage.productNotFound, returnLog(req, res, true))
                                    );
                                p.qtty = 0;
                                o.stock = p;
                                // console.log('addSale', o);

                                sEnt
                                    .findOne({ where: { position: o.position, machineId: o.machineId } })
                                    .then((rx) => {
                                        if (rx)
                                            return res.send(
                                                PrintError("addSale", [], EMessage.duplicatedPosition, returnLog(req, res, true))
                                            );
                                        sEnt
                                            .create(o)
                                            .then((r) => {
                                                res.send(
                                                    PrintSucceeded("addSale", r, EMessage.succeeded, returnLog(req, res))
                                                );
                                            })
                                            .catch((e) => {
                                                console.log("error add sale", e);
                                                res.send(PrintError("addSale", e, EMessage.error, returnLog(req, res, true)));
                                            });
                                    })
                                    .catch((e) => {
                                        console.log(e);

                                        res.send(PrintError("addSale", e, EMessage.error, returnLog(req, res, true)));
                                    });
                            });
                        });
                }
            );
            router.post(
                this.path + "/deleteSale",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = Number(req.query["id"]);
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .destroy({ where: { id } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(PrintError("deleteSale", [], EMessage.error, returnLog(req, res, true)));

                                res.send(PrintSucceeded("deleteSale", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error deleteSale", e);

                                res.send(PrintError("deleteSale", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("deleteSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/disableSale",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = Number(req.query["id"]);
                        const isActive = req.query["isActive"] + '' == 'no'
                            ? false
                            : true;
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findByPk(id)
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("disableSale", [], EMessage.error, returnLog(req, res, true))
                                    );
                                r.isActive = isActive;
                                r.changed("isActive", true);
                                res.send(
                                    PrintSucceeded(
                                        "disableSale",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error disable product", e);

                                res.send(PrintError("disableSale", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/updateSale",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const o = req.body.data as IVendingMachineSale;
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();

                        sEnt
                            .findByPk(o.id)
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("updateSale", [], EMessage.notfound, returnLog(req, res, true))
                                    );
                                const pEnt = StockFactory(
                                    EEntity.product + "_" + ownerUuid,
                                    dbConnection
                                );
                                pEnt
                                    .findByPk(o.stock.id)
                                    .then(async (p) => {
                                        if (!p)
                                            return res.send(
                                                PrintError("updateSale", [], EMessage.productNotFound, returnLog(req, res, true))
                                            );

                                        Object.keys(o).forEach((k) => {
                                            // console.log("changing", r[k]);
                                            if (["stock", "max"].includes(k)) {
                                                r[k] = o[k];
                                                r.changed("stock", true);
                                                // console.log("changed", r[k]);
                                            }
                                        });
                                        // r.changed('stock', true);
                                        // console.log("update Sale", r);

                                        res.send(
                                            PrintSucceeded(
                                                "updateSale",
                                                await r.save(),
                                                EMessage.succeeded
                                                , returnLog(req, res)
                                            )
                                        );
                                    })
                                    .catch((e) => {
                                        console.log("error updatesale", e);
                                        res.send(PrintError("updateSale", e, EMessage.error, returnLog(req, res, true)));
                                    });
                            })
                            .catch((e) => {
                                console.log("error updatesale", e);

                                res.send(PrintError("updateSale", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log("error update sale", error);
                        res.send(PrintError("updateSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/listSale",

                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];
                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll({ where: { isActive: { [Op.in]: actives } } })
                            .then((r) => {
                                res.send(PrintSucceeded("listSale", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error list sale", e);

                                res.send(PrintError("listSale", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            /// ADS 
            ///list
            router.post(
                this.path + "/listAds",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        // const isActive = req.query['isActive'];
                        // let actives = [];
                        // if (isActive == 'all') actives.push(...[true, false]);
                        // else actives.push(...isActive == 'yes' ? [true] : [false]);
                        // const ownerUuid = res.locals["ownerUuid"] || "";
                        // const sEnt = StockFactory(
                        //     EEntity.product + "_" + ownerUuid,
                        //     dbConnection
                        // );
                        // await sEnt.sync();
                        // sEnt
                        //     .findAll({ where: { isActive: { [Op.in]: actives } } })
                        //     .then((r) => {
                        //         res.send(PrintSucceeded("listProduct", r, EMessage.succeeded));
                        //     })
                        //     .catch((e) => {
                        //         console.log("error list product", e);

                        //         res.send(PrintError("listProduct", e, EMessage.error));
                        //     });
                        const r = [
                            {
                                name: 'Vending Machine How to 1',
                                description: 'How to purchase',
                                type: 'vdo',
                                url: 'https://www.youtube.com/shorts/Gq7WZ2hNG-Y'
                            },
                            {
                                name: 'Vending Machine How to 2',
                                description: 'How to cash-in',
                                type: 'vdo',
                                url: 'https://www.youtube.com/shorts/Gq7WZ2hNG-Y'
                            },
                            {
                                name: 'Vending Machine How to 3',
                                description: 'How to cash-out',
                                type: 'vdo',
                                url: 'https://www.youtube.com/shorts/9J3M-vh2oGs'
                            }
                        ];
                        res.send(PrintSucceeded("listAds", r, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // add ads
            router.post(
                this.path + "/addAds",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const ads = d.data as IAds;

                        if (!(ads.name && ads.description)) {
                            return res.send(PrintError("addAds", e, EMessage.parametersEmpty + '1', returnLog(req, res, true)));
                        }

                        if (ads.machines != undefined && Object.entries(ads.machines).length == 0 || ads.adsMedia != undefined && Object.entries(ads.adsMedia).length == 0) {
                            return res.send(PrintError("addAds", e, EMessage.parametersEmpty + '2', returnLog(req, res, true)));
                        }

                        ads.adsMedia.find(item => {
                            if (!(item.name && item.description && item.url && item.type)) {
                                return res.send(PrintError("addAds", e, EMessage.parametersEmpty + '3', returnLog(req, res, true)));
                            }
                        });

                        machineClientIDEntity.findAll({ where: { machineId: { [Op.in]: ads.machines } } }).then(run_machine => {
                            if (run_machine == undefined || Object.entries(run_machine).length != Object.entries(ads.machines).length) {
                                return res.send(PrintError("addAds", e, EMessage.invalidMachine, returnLog(req, res, true)));
                            }
                            adsEntity.create(ads).then((r) => {
                                res.send(PrintSucceeded("addAds", r, EMessage.succeeded, returnLog(req, res)));
                            })
                                .catch((e) => {
                                    res.send(PrintError("addAds", e, EMessage.error, returnLog(req, res, true)));
                                });
                        }).catch(error => {
                            res.send(PrintError("addAds", error, EMessage.error, returnLog(req, res, true)));
                        });

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addAds", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // clone ads
            router.post(
                this.path + "/cloneAds",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const id = d.data.id as number;
                        adsEntity.findByPk(id).then(a => {
                            if (a)
                                adsEntity
                                    .create(a.toJSON())
                                    .then((r) => {
                                        res.send(PrintSucceeded("cloneAds", r, EMessage.succeeded, returnLog(req, res, true)));
                                    })
                                    .catch((e) => {
                                        console.log("error cloneAds", e);

                                        res.send(PrintError("cloneAds", e, EMessage.error, returnLog(req, res, true)));
                                    });
                            else
                                res.send(PrintError("cloneAds failed not exist ", e, EMessage.error, returnLog(req, res, true)));
                        }).catch(error => {
                            console.log(error);
                            res.send(PrintError("cloneAds", error, EMessage.error, returnLog(req, res, true)));
                        })

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("cloneAds", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // remove ads
            router.post(
                this.path + "/removeAds",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const ads = d.data.ads as IAds;
                        const id = d.data.id as number
                        adsEntity
                            .create(ads)
                            .then((r) => {
                                r.destroy();
                                res.send(PrintSucceeded("addAds", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error addAds", e);

                                res.send(PrintError("addAds", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addAds", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            /// remove machines from ads
            router.post(
                this.path + "/removeMachineFromAds",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const machines = d.data.machines as Array<string>;
                        const id = d.data.id as number;
                        adsEntity
                            .findByPk(id)
                            .then((r) => {
                                r.machines = r.machines.filter(v => !machines.includes(v));
                                r.changed('machines', true);
                                r.save();
                                res.send(PrintSucceeded("removeMachineFromAds", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error lremoveMachineFromAds", e);

                                res.send(PrintError("removeMachineFromAds", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("removeMachineFromAds", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // load ads
            router.post(
                this.path + "/loadAds",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const existIds = d.data.existIds as Array<number>;
                        // console.log('loadAds', d.data);
                        const machineId = res.locals["machineId"];
                        if (!(machineId?.machineId)) throw new Error(EMessage.notfoundmachine);

                        adsEntity
                            .findAll({ where: { machines: { [Op.contains]: [machineId.machineId] } } })
                            .then((r) => {
                                const latest = r.filter(v => existIds.includes(v.id))?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                // console.log(`latest`, latest);
                                const deletingArray = new Array<number>();
                                if (!latest) return res.send(PrintSucceeded("loadAds", { deletingArray: existIds, newArray: r }, EMessage.succeeded, returnLog(req, res)));
                                // console.log(`deletingArray`, deletingArray);
                                existIds.forEach(v => {
                                    if (!r.find(r => r.id == v)) deletingArray.push(v);
                                })

                                const newArray = r.filter(v => new Date(v.createdAt).getTime() > new Date(latest.createdAt).getTime());
                                // console.log(`newArray`, newArray);
                                res.send(PrintSucceeded("loadAds", { deletingArray: deletingArray.map(item => item), newArray }, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error loadAds", e);

                                res.send(PrintError("loadAds", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("loadAds", error, EMessage.error, returnLog(req, res)));
                    }
                }
            );
            // list log machinesale timeline

            router.post(
                this.path + "/listMachineSaleLog",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // console.log('listMachineSaleLog', d.data);

                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        let limit = Number(req.query['limit']);
                        let skip = Number(req.query['skip']) || 0;
                        limit = limit > 0 ? limit : 100;
                        const offset = limit * skip;
                        const sales = await listMachineSaleLog(machineId, offset, limit)
                        res.send(
                            PrintSucceeded(
                                "listMachineSaleLog",
                                sales,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // Save Sale
            // redis
            // need to save to database as blockchain
            router.post(
                this.path + "/saveMachineSale",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // console.log('saveMachineSalexx', d.data);

                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId.machineId, dbConnection);
                        await sEnt.sync();

                        // sign

                        const run = await sEnt.findOne({ order: [['id', 'desc']] });
                        // console.log(`run der`, run);

                        const calculate = laabHashService.CalculateHash(JSON.stringify(d.data));
                        // console.log(`calculate der`, calculate);
                        const sign = laabHashService.Sign(calculate, IFranchiseStockSignature.privatekey);
                        // console.log(`sign der`, sign);
                        // console.log(`d data der`, d.data);
                        const list = new Array<IVendingMachineSale>();
                        list.push(...d.data);
                        list.forEach(v => v.machineId = machineId.machineId);
                        if (run == null) {

                            sEnt.create({
                                data: list,
                                hashM: sign,
                                hashP: 'null'
                            }).then(r => {
                                // console.log(`save stock successxxxxxx`);
                            }).catch(error => console.log(`save stock fail`));

                        } else {

                            sEnt.create({
                                data: list,
                                hashM: sign,
                                hashP: run.hashM
                            }).then(r => {
                                // console.log(`save stock successxxx`);
                            }).catch(error => console.log(`save stock fail`));

                        }

                        // console.log(`----> machine id der`, machineId.machineId);
                        const event: IVendingEventLog = {
                            machineId: machineId.machineId,
                            event: EVendingEvent.updating_stock,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                            data: { data: list, time: new Date() },//[{time, position, product, price,ip,data}
                            date: momenttz().tz(SERVER_TIME_ZONE).date(),
                            month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                            year: momenttz().tz(SERVER_TIME_ZONE).year()
                        };
                        await setVendingEvent(EVendingEvent.updating_stock, event);
                        res.send(
                            PrintSucceeded(
                                "saveMachineSale",
                                writeMachineSale(machineId.machineId, JSON.stringify(list)),
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/saveMachineSaleAndDrop",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;

                        const dropPositionData = req.body.dropPositionData;

                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId.machineId, dbConnection);
                        await sEnt.sync();


                        const run = await sEnt.findOne({ order: [['id', 'desc']] });

                        const calculate = laabHashService.CalculateHash(JSON.stringify(d.data));

                        const sign = laabHashService.Sign(calculate, IFranchiseStockSignature.privatekey);


                        const list = new Array<IVendingMachineSale>();
                        list.push(...d.data);
                        list.forEach(v => v.machineId = machineId.machineId);
                        if (run == null) {

                            sEnt.create({
                                data: list,
                                hashM: sign,
                                hashP: 'null'
                            }).then(r => {

                            }).catch(error => console.log(`save stock fail`));

                        } else {

                            sEnt.create({
                                data: list,
                                hashM: sign,
                                hashP: run.hashM
                            }).then(r => {

                            }).catch(error => console.log(`save stock fail`));

                        }

                        if (dropPositionData) {
                            try {
                                const ownerUuid = dropPositionData.ownerUuid;
                                const transactionID = dropPositionData.transactionID;

                                const position = dropPositionData.position;
                                let ent = VendingMachineBillFactory(
                                    EEntity.vendingmachinebill + "_" + ownerUuid,
                                    dbConnection
                                );
                                await ent.sync();
                                const bill = await ent.findOne({
                                    where: { transactionID: transactionID },
                                });

                                if (!bill) {
                                    // return res.send(PrintError("retryProcessBill", "bill not found", EMessage.billnotfound));
                                }


                                const dataStock = JSON.parse(JSON.stringify(bill.dataValues.vendingsales));

                                const hasPosition = dataStock.some((item: any) => item.position === position);

                                if (!hasPosition) {
                                    console.log("ไม่พบ Position นี้");
                                } else {
                                    const items = dataStock.filter((item: any) => item.position === position && !item.dropAt);
                                    if (items.length === 0) {
                                        // console.log("มีทุกตัวแล้ว");
                                    } else {
                                        // สุ่มเลือกตัวหนึ่งจากรายการที่ยังไม่มี dropAt
                                        const randomIndex = Math.floor(Math.random() * items.length);
                                        const selectedItem = items[randomIndex];
                                        selectedItem.dropAt = new Date().toISOString();
                                        // console.log("อัปเดตข้อมูล:", selectedItem);

                                        bill.vendingsales = dataStock;
                                        bill.changed("vendingsales", true);
                                        await bill.save();
                                        ent = null;
                                    }
                                }
                            } catch (err) {

                            }
                        }

                        const event: IVendingEventLog = {
                            machineId: machineId.machineId,
                            event: EVendingEvent.updating_stock,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                            data: { data: list, time: new Date() },//[{time, position, product, price,ip,data}
                            date: momenttz().tz(SERVER_TIME_ZONE).date(),
                            month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                            year: momenttz().tz(SERVER_TIME_ZONE).year()
                        };
                        await setVendingEvent(EVendingEvent.updating_stock, event);
                        const event2: IVendingEventLog = {
                            machineId: machineId.machineId,
                            event: EVendingEvent.dropConfirm,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                            data: { data: dropPositionData, time: new Date() },//[{time, position, product, price,ip,data}
                            date: momenttz().tz(SERVER_TIME_ZONE).date(),
                            month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                            year: momenttz().tz(SERVER_TIME_ZONE).year()
                        };
                        await setVendingEvent(EVendingEvent.dropConfirm, event2);
                        res.send(
                            PrintSucceeded(
                                "saveMachineSaleAndDrop",
                                writeMachineSale(machineId.machineId, JSON.stringify(list)),
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/cloneMachineCUI",
                this.checkSuperAdmin,
                this.authorizeSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    let list = new Array<IVendingMachineSale>();
                    try {
                        const d = req.body as IVendingCloneMachineSale;
                        // const isActive = req.query['isActive'];
                        const machineId = d.machineId;
                        const cloneMachineId = d.cloneMachineId;
                        if (!machineId) throw new Error("machine is not exist");


                        const run = await readMachineSale(cloneMachineId);
                        if (run != undefined && Object.entries(run).length > 0 || run != null) {
                            list = JSON.parse(run);
                            // console.log(`load from redis ----->`, list);

                        } else {
                            const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + cloneMachineId, dbConnection);
                            await sEnt.sync();

                            const x = await sEnt.findOne({ order: [['id', 'desc']] });
                            // console.log(`load from databasee ----->`, list);
                            list.push(...x.data);
                        }
                        list.forEach(v => {
                            v.machineId = machineId
                        })
                        writeMachineSale(machineId, JSON.stringify(list)),
                            res.send(
                                PrintSucceeded(
                                    "cloneMachineCUI",
                                    list,
                                    EMessage.succeeded
                                    , returnLog(req, res)
                                )
                            );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("cloneMachineCUI", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/readMachineSale",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");

                        let list: any = {} as any;
                        const run = await readMachineSale(machineId.machineId);
                        if (run != undefined && Object.entries(run).length > 0 || run != null) {
                            list = JSON.parse(run);
                            // console.log(`load from redis ----->`, list);

                        } else {
                            const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId.machineId, dbConnection);
                            await sEnt.sync();

                            list = await sEnt.findOne({ order: [['id', 'desc']] });
                            // console.log(`load from databasee ----->`, list);
                            list = list.data;
                        }

                        res.send(
                            PrintSucceeded(
                                "readMachineSale",
                                list,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/readMachineDeductStock",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");

                        readMachinePendingStock(machineId + '').then(r => {
                            let ax = JSON.parse(r) as Array<any>;
                            if (!ax || !Array.isArray(ax)) ax = [];
                            const pendingStock = ax.map(v => { return { transactionID: v?.transactionID, position: v?.position } })
                            res.send(
                                PrintSucceeded(
                                    "readMachineDeductStock",
                                    pendingStock,
                                    EMessage.succeeded
                                    , returnLog(req, res)
                                )
                            );

                        });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("readMachineDeductStock", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/confirmMachineDeductStock",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId = res.locals["machineId"];
                        const trans = d.data.trans as Array<any>;

                        if (!machineId) throw new Error("machine is not exit");
                        const xy = [];
                        // trans.forEach(v => {

                        for (let index = 0; index < trans.length; index++) {
                            const v = trans[index];
                            const transactionID = v.transactionID;
                            const position = v.position;

                            const r = await readMachinePendingStock(machineId?.machineId + '');

                            let x = JSON.parse(r) as Array<any>;
                            if (!x || !Array.isArray(x)) x = [];
                            const y = x.find(v => v?.transactionID == transactionID && position == v?.position);
                            if (y) {
                                writeMachinePendingStock(machineId?.machineId + "", x.filter(v => v?.transactionID != transactionID && position != v?.position))
                                xy.push(y);
                            }

                        }

                        // })
                        res.send(
                            PrintSucceeded(
                                "confirmMachineDeductStock",
                                xy,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("confirmMachineDeductStock", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/readMachineSaleForAdmin",
                this.checkSuperAdmin,


                this.checkAdmin,

                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        let list: any = {} as any;
                        // console.log(`readMachineSaleForAdmin`, machineId);
                        // const isActive = req.query['isActive'];
                        if (!machineId) throw new Error("machine is not exit");
                        const run = await readMachineSale(machineId);
                        if (run != undefined && Object.entries(run).length > 0 || run != null) {
                            list = JSON.parse(run);
                            // console.log(`load from redis ----->`, list);

                        } else {
                            const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId, dbConnection);
                            await sEnt.sync();

                            list = await sEnt.findOne({ order: [['id', 'desc']] });
                            // console.log(`load from databasee ----->`, list);
                            list = list.data;
                        }
                        res.send(
                            PrintSucceeded(
                                "readMachineSaleForAdmin",
                                list,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/refillMachineSale",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        // writeMachineSale(machineId.machineId,d.data);
                        const sEnt = FranchiseStockFactory(
                            EEntity.franchisestock + "_" + machineId.machineId,
                            dbConnection
                        );
                        await sEnt.sync();

                        // sign

                        const c = await sEnt.findOne({ order: [['id', 'desc']] });


                        res.send(
                            PrintSucceeded(
                                "refillMachineSale",
                                c.data,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );






            router.post(
                this.path + "/saveMachineSaleReport",
                // this.checkAdmin,

                // this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        res.send(
                            PrintSucceeded(
                                "readMachineSale",
                                JSON.parse(await readMachineSale(machineId.machineId)),
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );



            // franchise
            // list product from hangmi
            // list products from hangmi with product id
            // owner has to request to purchase 
            // pay
            // hangmi update sale with the purchasing request
            // save to database
            // cui request to update ( refresh, refill)






            // REPORT
            router.post(
                this.path + "/loadVendingMachineSaleBillReport",
                this.checkSuperAdmin,

                this.checkAdmin,

                async (req, res) => {
                    try {

                        const data = req.body;
                        const subadmin = res.locals['subadmin'];
                        // const parmas: ILoadVendingMachineSaleBillReport = {
                        //     ownerUuid: res.locals["ownerUuid"],
                        //     machineId: data.machineId,
                        //     fromDate: data.fromDate,
                        //     toDate: data.toDate
                        // }
                        // this._loadVendingMachineSaleBillReport(parmas).then(run => {
                        //     if (run.message != IENMessage.success) {
                        //         res.send(PrintError("report", run, EMessage.error, returnLog(req, res, true)));
                        //         return;
                        //     }
                        //     res.send(PrintSucceeded("report", run, EMessage.succeeded, returnLog(req, res)));
                        // }).catch(error => {
                        //     res.send(PrintError("report", error, EMessage.error, returnLog(req, res, true)));
                        // });

                        // const serverFromDate = moment.tz(fromDate, serverTimezone).startOf('day').toDate();
                        // const serverEndDate = moment.tz(endDate, serverTimezone).endOf('day').toDate();
                        const ownerUuid = res.locals["ownerUuid"];
                        const machineId = data.machineId;
                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET REPORT SALE ', machineId, fromDate.toString(), toDate.toString(), ownerUuid)

                        const run = await this.getReportSale(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        res.send(PrintError("report", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/loadVendingMachineDropPositionReport",
                this.checkSuperAdmin,

                this.checkAdmin,

                async (req, res) => {
                    try {

                        const data = req.body;
                        const machineId = data.machineId;
                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET DROP SALE ', machineId, fromDate.toString(), toDate.toString())
                        const run = await this.getReportDrop(machineId, fromDate.toString(), toDate.toString());
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        res.send(PrintError("report", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/loadVendingMachineStockReport",
                this.checkSuperAdmin,

                this.checkAdmin,

                (req, res) => {
                    try {

                        const data = req.body;
                        const parmas: ILoadVendingMachineStockReport = {
                            ownerUuid: res.locals["ownerUuid"],
                            machineId: data.machineId,
                            fromDate: data.fromDate,
                            toDate: data.toDate
                        }
                        this._loadVendingMachineStockReport(parmas).then(run => {
                            if (run.message != IENMessage.success) {
                                res.send(PrintError("report", run, EMessage.error, returnLog(req, res, true)));
                                return;
                            }
                            res.send(PrintSucceeded("report", run, EMessage.succeeded, returnLog(req, res)));
                        }).catch(error => {
                            res.send(PrintError("report", error, EMessage.error, returnLog(req, res, true)));
                        });

                    } catch (error) {
                        res.send(PrintError("report", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );



            router.post(
                this.path + "/machineSaleList",
                // this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),s
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // console.log(`machine id der`, res.locals['machineId']);
                        const isActive = req.query['isActive'];
                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        const m = await machineClientIDEntity.findOne({
                            where: {
                                machineId: machineId.machineId
                            },
                        });
                        const ownerUuid = m?.ownerUuid || "";

                        // const ownerUuid = res.locals["ownerUuid"] || "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll({ where: { isActive: { [Op.in]: actives }, machineId: machineId.machineId } })
                            .then((r) => {
                                res.send(PrintSucceeded("listSale", r, EMessage.succeeded, returnLog(req, res)));
                            })
                            .catch((e) => {
                                console.log("error list sale", e);

                                res.send(PrintError("listSale", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/listSaleByMachine",
                this.checkSuperAdmin,
                this.checkAdmin,

                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];
                        // console.log(`owneruuid der`, res.locals["ownerUuid"]);

                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        let ownerUuid = res.locals["ownerUuid"] || "";
                        const machineId = req.query["machineId"] + "";

                        const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();

                        sEnt
                            .findAll({ where: { machineId, isActive: { [Op.in]: actives } } })
                            .then((r) => {
                                res.send(
                                    PrintSucceeded("listSaleByMachine" + 'owneruuidder' + ownerUuid, r, EMessage.succeeded, returnLog(req, res))
                                );
                            })
                            .catch((e) => {
                                console.log("error listSaleByMachine", e);
                                res.send(PrintError("listSaleByMachine", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSaleByMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/reportStock",
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("reportStock", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // router.post(
            //     this.path + "/refreshMachine",
            //     this.checkToken,
            //     // this.checkToken.bind(this),
            //     // this.checkDisabled.bind(this),
            //     async (req, res) => {
            //         try {
            //             const {m} = req.body.data;
            //             const ws =this.wsClient.filter(v=>v['machineId']==m);
            //             const w = ws.find(v=>v['clientId']);
            //             const resx = {} as IResModel;
            //             resx.command = EMACHINE_COMMAND.refresh;
            //             resx.message = EMessage.refreshsucceeded;
            //             this.sendWS(w['clientId'],resx)
            //             res.send(PrintSucceeded("refreshMachine", !!w, EMessage.succeeded));

            //         } catch (error) {
            //             console.log(error);
            //             res.send(PrintError("addProduct", error, EMessage.error));
            //         }
            //     }
            // );

            router.post(
                this.path + "/addMachine",
                this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.authorizeSuperAdmin,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const o = req.body.data as IMachineClientID;

                        // console.log(`params der`, o, ownerUuid);
                        o.ownerUuid = ownerUuid || "";

                        if (!(o.ownerUuid && o.otp && o.machineId))
                            return res.send(
                                PrintError("addMachine", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                            );
                        if (o.machineId.length != 8 || Number.isNaN(o.machineId) || Number.isNaN(o.otp))
                            return res.send(
                                PrintError("addMachine", [], EMessage.InvalidMachineIdOrOTP, returnLog(req, res, true))
                            );

                        const findMerchant = await vendingWallet.findOne({ where: { ownerUuid: o.ownerUuid, walletType: IVendingWalletType.merchant } });
                        if (findMerchant == null) throw new Error(IENMessage.notFoundShop);

                        const x = await this.machineClientlist.findOne({
                            where: { machineId: o.machineId },
                        });
                        if (!x) {
                            // o.photo = base64ToFile(o.photo);
                            this.machineClientlist
                                .create(o)
                                .then((r) => {

                                    res.send(PrintSucceeded("addMachine", r, EMessage.succeeded, returnLog(req, res)));
                                    this.reinitMachines();
                                })
                                .catch((e) => {
                                    console.log(e);
                                    res.send(PrintError("addMachine", e, EMessage.error, returnLog(req, res, true)));
                                });
                        } else {
                            res.send(
                                PrintError("addMachine", "Machine ID exist", EMessage.error, returnLog(req, res, true))
                            );
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(
                this.path + "/addMachineNew",
                this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.authorizeSuperAdmin,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const o = req.body.data as IMachineClientID;

                        // console.log(`params der`, o, ownerUuid);
                        o.ownerUuid = ownerUuid || "";

                        if (!(o.ownerUuid && o.otp && o.machineId))
                            return res.send(
                                PrintError("addMachine", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                            );
                        if (o.machineId.length != 8 || Number.isNaN(o.machineId) || Number.isNaN(o.otp))
                            return res.send(
                                PrintError("addMachine", [], EMessage.InvalidMachineIdOrOTP, returnLog(req, res, true))
                            );

                        // const findMerchant = await vendingWallet.findOne({ where: { ownerUuid: o.ownerUuid, walletType: IVendingWalletType.merchant } });
                        // if (findMerchant == null) throw  new Error(IENMessage.notFoundShop);

                        const x = await this.machineClientlist.findOne({
                            where: { machineId: o.machineId },
                        });
                        if (!x) {
                            // o.photo = base64ToFile(o.photo);
                            this.machineClientlist
                                .create(o)
                                .then((r) => {

                                    res.send(PrintSucceeded("addMachine", r, EMessage.succeeded, returnLog(req, res)));
                                    this.reinitMachines();
                                })
                                .catch((e) => {
                                    console.log(e);
                                    res.send(PrintError("addMachine", e, EMessage.error, returnLog(req, res, true)));
                                });
                        } else {
                            res.send(
                                PrintError("addMachine", "Machine ID exist", EMessage.error, returnLog(req, res, true))
                            );
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/updateMachine",
                this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.authorizeSuperAdmin,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = req.query["id"] + "";
                        const o = req.body.data as IMachineClientID;
                        this.machineClientlist
                            .findOne({ where: { ownerUuid, id } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("updateMachine", [], EMessage.notfound, returnLog(req, res, true))
                                    );
                                r.otp = o.otp ? o.otp : r.otp;
                                // r.machineId = o.machineId ? o.machineId : r.machineId;
                                r.photo = o.photo ? base64ToFile(o.photo) : base64ToFile(r.photo);
                                // r.changed('isActive',true);

                                res.send(
                                    PrintSucceeded(
                                        "updateMachine",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                                this.reinitMachines();
                            })
                            .catch((e) => {
                                console.log("Error updateMachine", e);
                                res.send(PrintError("updateMachine", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updateMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/updateMachineSetting",

                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = req.query["id"] + "";

                        const o = req.body.data as IMachineClientID;
                        // console.log('OOOOOO', o);
                        console.log('UPDATE MACHINE SETTING');


                        this.machineClientlist
                            .findOne({ where: { ownerUuid, id } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("updateMachineSetting", [], EMessage.notfound, returnLog(req, res, true))
                                    );
                                if (!r.data) r.data = [];

                                if (!Array.isArray(o.data)) o.data = [];
                                o.data[0].allowVending = !o.data[0]?.allowVending ? false : true;
                                o.data[0].allowCashIn = !o.data[0]?.allowCashIn ? false : true;
                                o.data[0].light = o.data[0]?.light ?? { start: 3, end: 2 };
                                if (!Array.isArray(r.data)) r.data = [r.data];
                                let a = r.data.find(v => v.settingName == 'setting');

                                const x = o.data[0]?.allowVending;
                                const y = o.data[0]?.allowCashIn;
                                const w = o.data[0]?.light;
                                const z = o.data[0]?.highTemp || 10;
                                const u = o.data[0]?.lowTemp || 5;
                                const l = o.data[0]?.limiter || 100000;

                                const owner = o.data[0]?.owner;
                                const ownerPhone = o.data[0]?.ownerPhone || '';

                                const isAds = o.data[0]?.isAds || false;
                                const isMusicMuted = o.data[0]?.isMusicMuted || false;
                                const isRobotMuted = o.data[0]?.isRobotMuted || false;
                                const musicVolume = o.data[0]?.musicVolume || 0;
                                const adsList = o.data[0]?.adsList || [];
                                const versionId = o.data[0]?.versionId || '';
                                const qrPayment = o.data[0]?.qrPayment || false;
                                const isTopUp = o.data[0]?.isTopUp || false;


                                const imgh = o.data[0]?.imgHeader;
                                const imgf = o.data[0]?.imgFooter;
                                const imgl = o.data[0]?.imgLogo;
                                let t = o.data[0]?.imei || '';
                                if (t && t.length < 8) {
                                    throw new Error('Length can not be less than 8 ')
                                }

                                if (ownerPhone && ownerPhone.length < 8) {
                                    throw new Error('Length can not be less than 8 ')
                                }
                                if (!a) {
                                    a = { settingName: 'setting', allowVending: x, allowCashIn: y, lowTemp: u, highTemp: z, light: w, limiter: l, imei: t, imgHeader: imgh, imgFooter: imgf, imgLogo: imgl, isAds: isAds, isMusicMuted: isMusicMuted, isRobotMuted: isRobotMuted, musicVolume: musicVolume, adsList: adsList, versionId: versionId, qrPayment: qrPayment, isTopUp: isTopUp };
                                    r.data.push(a);
                                }
                                else {
                                    a.allowVending = x; a.allowCashIn = y, a.light = w; a.highTemp = z; a.lowTemp = u; a.limiter = l, a.imei = t; a.owner = owner, a.ownerPhone = ownerPhone;
                                    a.imgHeader = imgh;
                                    a.imgFooter = imgf;
                                    a.imgLogo = imgl;
                                    a.isAds = isAds;
                                    a.isMusicMuted = isMusicMuted;
                                    a.isRobotMuted = isRobotMuted;
                                    a.musicVolume = musicVolume;
                                    a.adsList = adsList;
                                    a.versionId = versionId;
                                    a.qrPayment = qrPayment;
                                    a.isTopUp = isTopUp;
                                }

                                // r.data = [a];
                                r.changed('data', true);
                                // console.log('updating machine setting', r.data);
                                const a2 = JSON.parse(JSON.stringify(r.data));
                                const s = a2.find(v => v.settingName == 'setting');
                                // s.owner = '';
                                // s.ownerPhone = '';
                                // s.imei = '';
                                await writeMachineSetting(r.machineId, a2);
                                writeMachineSettingVersion(r.machineId, a2);
                                this.machineIds.find(v => {
                                    if (v.machineId == r.machineId) {
                                        Object.assign(v, r);
                                    }
                                });
                                res.send(
                                    PrintSucceeded(
                                        "updateMachineSetting",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                                const wsx = this.wsClient.filter(v => v['machineId'] === r?.machineId);

                                /// WS send to client directly
                                // console.log('=====>S :', s);
                                wsx.forEach(ws => {
                                    if (ws.readyState === WebSocketServer.OPEN)
                                        ws?.send(
                                            JSON.stringify(
                                                PrintSucceeded(
                                                    "ping",
                                                    {
                                                        command: "ping",
                                                        production: this.production,
                                                        balance: r,
                                                        // limiter, merchant,
                                                        // mymmachinebalance, mymlimiterbalance,
                                                        setting: s,
                                                        //  mstatus, mymstatus,
                                                        // mymsetting,
                                                        // mymlimiter,
                                                        // app_version,
                                                        // pendingStock
                                                    },
                                                    EMessage.succeeded
                                                    ,
                                                    null
                                                )
                                            )
                                        );
                                })


                            })
                            .catch((e) => {
                                console.log("Error updateMachineSetting", e);
                                res.send(PrintError("updateMachineSetting", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updateMachineSetting", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/setAdminControl",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query["isActive"] + '' == 'yes'
                            ? 'yes'
                            : '';
                        setAdminControl(isActive);
                        res.send(
                            PrintSucceeded(
                                "setAdminControl",
                                isActive,
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(this.path + '/reportBillNotPaid',
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const ownerUuid = req.body.ownerUuid;
                        const machineId = req.body.machineId;
                        const data = req.body;

                        if (!ownerUuid || !machineId) {
                            res.send(PrintError("reportBillNotPaid", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };


                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET SALE BILL NOT PAID ', machineId, fromDate.toString(), toDate.toString())
                        const run = await this.getReportBillNotPaid(machineId, ownerUuid, fromDate.toString(), toDate.toString());
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        return res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('reportBillNotPaid :', error);
                        res.send(PrintError("reportBillNotPaid", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )

            router.post(this.path + '/reportClientLog',
                this.checkSuperAdmin,

                this.checkAdmin,

                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        const data = req.body;

                        if (!machineId) {
                            res.send(PrintError("reportClientLog", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };


                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET SALE BILL NOT PAID ', machineId, fromDate.toString(), toDate.toString())
                        const cksum = generateChecksum(machineId + fromDate.toString() + toDate.toString());
                        const resp = await redisClient.get(cksum);
                        if (resp) {
                            return res.send(PrintSucceeded("report", JSON.parse(resp), EMessage.succeeded, returnLog(req, res)));
                        }
                        const run = await this.getReportClientLog(machineId, fromDate.toString(), toDate.toString());
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        redisClient.setex(cksum, 60 * 1, JSON.stringify(response));
                        return res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('reportClientLog :', error);
                        res.send(PrintError("reportClientLog", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            )


            router.post(this.path + '/openstock',
                this.checkSuperAdmin,
                async (req, res) => {
                    try {
                        const machineToken = req.body.machineToken;
                        const secret = req.body.secret;
                        if (!machineToken || !secret) {
                            return res.send(PrintError('openstock', null, EMessage.bodyIsEmpty, returnLog(req, res, true)));
                        }

                        const machineData = this.findMachineIdToken(machineToken);
                        if (!machineData) {
                            return res.send(PrintError('openstock', null, EMessage.machineNotExist, returnLog(req, res, true)));
                        }
                        const secretData = await this.readMachineSecret(machineData.machineId + '');
                        if (secretData !== secret) {
                            return res.send(PrintError('openstock', null, EMessage.notallowed, returnLog(req, res, true)));
                        }
                        console.log('----->secret :', secretData);

                        const resD = {} as IResModel;
                        resD.command = EMACHINE_COMMAND.ping;
                        resD.message = EMessage.openstock;


                        resD.status = 1;
                        // resD.data = b.filter((v) => v.ownerUuid === ownerUuid);
                        this.sendWSToMachine(machineData.machineId, resD);


                        return res.send(PrintSucceeded('openstock', machineData, EMessage.succeeded, returnLog(req, res, true)));

                    } catch (error) {
                        console.error('Error openstock is :', JSON.stringify(error));
                        res.send(PrintError('openstock', error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(this.path + '/clearLocalBill',
                this.checkSuperAdmin,
                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        if (!machineId) {
                            return res.send(PrintError('clearLocalBill', null, EMessage.bodyIsEmpty, returnLog(req, res, true)));
                        }

                        const resD = {} as IResModel;
                        resD.command = EMACHINE_COMMAND.ping;
                        resD.message = EMessage.clearLocalBill;


                        resD.status = 1;
                        this.sendWSToMachine(machineId, resD);

                        return res.send(PrintSucceeded('openstock', machineId, EMessage.succeeded, returnLog(req, res, true)));

                    } catch (error) {
                        console.error('Error openstock is :', JSON.stringify(error));
                        res.send(PrintError('openstock', error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            router.post(this.path + '/openstock',
                this.checkSuperAdmin,
                async (req, res) => {
                    try {
                        const machineToken = req.body.machineToken;
                        const secret = req.body.secret;
                        if (!machineToken || !secret) {
                            return res.send(PrintError('openstock', null, EMessage.bodyIsEmpty, returnLog(req, res, true)));
                        }

                        const machineData = this.findMachineIdToken(machineToken);
                        if (!machineData) {
                            return res.send(PrintError('openstock', null, EMessage.machineNotExist, returnLog(req, res, true)));
                        }
                        const secretData = await this.readMachineSecret(machineData.machineId + '');
                        if (secretData !== secret) {
                            return res.send(PrintError('openstock', null, EMessage.notallowed, returnLog(req, res, true)));
                        }
                        console.log('----->secret :', secretData);

                        const resD = {} as IResModel;
                        resD.command = EMACHINE_COMMAND.ping;
                        resD.message = EMessage.openstock;


                        resD.status = 1;
                        // resD.data = b.filter((v) => v.ownerUuid === ownerUuid);
                        this.sendWSToMachine(machineData.machineId, resD);


                        return res.send(PrintSucceeded('openstock', machineData, EMessage.succeeded, returnLog(req, res, true)));

                    } catch (error) {
                        console.error('Error openstock is :', JSON.stringify(error));
                        res.send(PrintError('openstock', error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            )

            router.post(this.path + '/reportBilling', uploadExcelMemory.single('file'), this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.authorizeSuperAdmin, uploadExcelFile);

            router.post(this.path + '/reportLogsTemp',
                this.checkSuperAdmin,
                this.checkAdmin,

                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        const data = req.body;

                        if (!machineId) {
                            res.send(PrintError("reportLogsTemp", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };


                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET SALE BILL NOT PAID ', machineId, fromDate.toString(), toDate.toString())
                        const cksum = generateChecksum(machineId + fromDate.toString() + toDate.toString());
                        const resp = await redisClient.get(cksum);
                        if (resp) {
                            return res.send(PrintSucceeded("report", JSON.parse(resp), EMessage.succeeded, returnLog(req, res)));
                        }
                        const run = await this.getReportLogsTemp(machineId, fromDate.toString(), toDate.toString());
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        redisClient.setex(cksum, 60 * 1, JSON.stringify(response));
                        return res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('reportLogsTemp :', error);
                        res.send(PrintError("reportLogsTemp", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )


            router.post(this.path + '/clearLogsTemp',
                this.checkSuperAdmin,
                this.checkAdmin,
                async (req, res) => {
                    try {
                        const q = `DELETE FROM "LogsTemp" WHERE "createdAt" < NOW() - INTERVAL '24 hours';`
                        const bill = await LogsTempEntity.sequelize.query(q);
                        return res.send(PrintSucceeded("clearLogsTemp", bill, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('clearLogsTemp :', error);
                        res.send(PrintError("clearLogsTemp", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )

            router.post(this.path + '/reportLogsTempAdmin',
                this.checkSuperAdmin,
                this.validateSuperAdmin,

                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        const data = req.body;

                        if (!machineId) {
                            res.send(PrintError("reportLogsTemp", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };


                        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
                        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();
                        // console.log(' GET SALE BILL NOT PAID ', machineId, fromDate.toString(), toDate.toString())
                        const cksum = generateChecksum(machineId + fromDate.toString() + toDate.toString());
                        const resp = await redisClient.get(cksum);
                        if (resp) {
                            return res.send(PrintSucceeded("report", JSON.parse(resp), EMessage.succeeded, returnLog(req, res)));
                        }
                        const run = await this.getReportLogsTemp(machineId, fromDate.toString(), toDate.toString());
                        const response = {
                            rows: run.rows,
                            count: run.count,
                            message: IENMessage.success
                        }
                        redisClient.setex(cksum, 60 * 1, JSON.stringify(response));
                        return res.send(PrintSucceeded("report", response, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('reportLogsTemp :', error);
                        res.send(PrintError("reportLogsTemp", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )


            router.post(this.path + '/clearLogsTempAdmin',
                this.checkSuperAdmin,
                this.validateSuperAdmin,
                async (req, res) => {
                    try {
                        const q = `DELETE FROM "LogsTemp" WHERE "createdAt" < NOW() - INTERVAL '24 hours';`
                        const bill = await LogsTempEntity.sequelize.query(q);
                        return res.send(PrintSucceeded("clearLogsTemp", bill, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('clearLogsTemp :', error);
                        res.send(PrintError("clearLogsTemp", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )


            router.post(this.path + '/checkPaidMmoney',
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const transactionID = req.body.transactionID;
                        if (!transactionID) {
                            res.send(PrintError("checkPaidMmoney", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };
                        const result = await CheckMmoneyPaid(transactionID);
                        if (result.status == 0) {
                            res.send(PrintError("checkPaidMmoney", result.message, EMessage.error, returnLog(req, res, true)));
                            return;
                        }
                        return res.send(PrintSucceeded("report", result.message, EMessage.succeeded, returnLog(req, res)));
                    } catch (error) {
                        console.log('reportBillNotPaid :', error);
                        res.send(PrintError("reportBillNotPaid", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )


            router.post(this.path + '/sendDropAdmin',
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const transactionID = req.body.transactionID;
                        const ownerUuid = req.body.ownerUuid;
                        const bankname = req.body.bankname;

                        if (!transactionID || !ownerUuid || !bankname) {
                            res.send(PrintError("reportBillNotPaid", [], EMessage.bodyIsEmpty, returnLog(req, res, true)));
                            return;
                        };

                        const ent = VendingMachineBillFactory(
                            EEntity.vendingmachinebill + "_" + ownerUuid,
                            dbConnection
                        );
                        await ent.sync();
                        const bill = await ent.findOne({
                            where: { transactionID },
                        });
                        // console.log('=====>BILL IS :', bill);

                        if (!bill) {
                            return res.send(PrintError("reportBillNotPaid", [], EMessage.notfound, returnLog(req, res, true)));
                        }

                        if (bill.paymentstatus !== EPaymentStatus.pending) {
                            return res.send(PrintError("reportBillNotPaid", [], EMessage.exist, returnLog(req, res, true)));
                        }

                        bill.paymentstatus = EPaymentStatus.paid;
                        bill.changed("paymentstatus", true);
                        bill.paymentref = bankname + '';
                        bill.changed("paymentref", true);
                        bill.paymenttime = new Date();
                        bill.changed("paymenttime", true);
                        bill.paymentmethod = "LaoQR";
                        bill.changed("paymentmethod", true);

                        // console.log('=====>machineId', bill.machineId);

                        this.getBillProcess(bill.machineId, async (b) => {
                            bill.vendingsales.forEach((v, i) => {
                                v.stock.image = "";
                                b.push({
                                    ownerUuid,
                                    position: v.position,
                                    bill: bill.toJSON(),
                                    transactionID: getNanoSecTime(),
                                });
                            });

                            await bill.save();
                            // console.log("*****callBackConfirmLaoQR", JSON.stringify(b));

                            // WebSocket response
                            const resD = {} as IResModel;
                            resD.command = EMACHINE_COMMAND.waitingt;
                            resD.message = EMessage.waitingt;
                            resD.status = 1;
                            resD.data = b.filter((v) => v.ownerUuid === ownerUuid);
                            this.setBillProces(bill.machineId, b);
                            await redisClient.del(transactionID + EMessage.BillCreatedTemp);
                            let resule = (await redisClient.get(bill.machineId + EMessage.ListTransaction)) ?? '[]';
                            // let trandList: Array<any> = JSON.parse(resule);
                            // const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);

                            let trandList: Array<any> = [];
                            try {
                                const parsedData = JSON.parse(resule); // หรือ result ถ้าพิมพ์ผิด
                                if (!Array.isArray(parsedData)) {
                                    console.warn('Parsed data is not an array, initializing trandList as empty array:', parsedData);
                                    trandList = [];
                                } else {
                                    trandList = parsedData;
                                }
                            } catch (error) {
                                console.error('JSON parse error:', error.message);
                                trandList = [];
                            }

                            const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);
                            redisClient.setex(bill.machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(filteredData));
                            this.sendWSToMachine(bill.machineId, resD);
                            return res.send(PrintSucceeded("reportBillNotPaid", resD, EMessage.succeeded, returnLog(req, res)));
                        });
                    } catch (error) {
                        console.log('reportBillNotPaid :', error);
                        res.send(PrintError("reportBillNotPaid", error, EMessage.error, returnLog(req, res, true)));
                    }
                }

            )

            router.post(
                this.path + "/readAdminControl",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        res.send(
                            PrintSucceeded(
                                "setAdminControl",
                                await readAminControl(),
                                EMessage.succeeded
                                , returnLog(req, res)
                            )
                        );
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/disableMachine",
                this.checkSuperAdmin,

                this.checkAdmin,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const isActive = req.query["isActive"] + '' == 'no'
                            ? false
                            : true;
                        const id = req.query["id"] + "";
                        this.machineClientlist
                            .findOne({ where: { ownerUuid, id } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("disableMachine", [], EMessage.notfound, returnLog(req, res, true))
                                    );
                                r.isActive = isActive;
                                // r.changed('isActive',true);

                                res.send(
                                    PrintSucceeded(
                                        "disableMachine",
                                        await r?.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                                this.reinitMachines();
                            })
                            .catch((e) => {
                                console.log("Error disableMachine", e);
                                res.send(PrintError("disableMachine", e, EMessage.error, returnLog(req, res)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableMachine", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            router.post(
                this.path + "/resetCashing",
                this.checkSuperAdmin,

                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req.body.machineId;
                        const ws = this.wsClient.find(v => v['machineId'] == m);
                        // const w = ws.find(v=>v['clientId']);
                        // console.log(`----------->`, m);
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.resetCashing;
                        resx.message = EMessage.resetCashingSuccess;
                        resx.data = true;
                        this.sendWSToMachine(ws['machineId'], resx)
                        res.send(PrintSucceeded("resetCashing", !!ws, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("resetCashing", error, EMessage.error, returnLog(req, res, true)));
                    }
                });
            router.post(
                this.path + '/getAllMachines',
                this.checkSuperAdmin,
                this.validateSuperAdmin,

                async (req, res) => {
                    try {

                        const isActive = req.query['isActive']?.toString() || 'all';
                        const actives = isActive === 'true' ? [true] : isActive === 'false' ? [false] : [true, false];
                        const cacheKey = `machines:isActive:${isActive}`;

                        // Try to get data from Redis
                        const cachedData = await redisClient.get(cacheKey);
                        if (cachedData) {
                            return res.send(PrintSucceeded('getAllMachines', JSON.parse(cachedData), EMessage.succeeded, returnLog(req, res, true)));
                        }

                        // Fetch from database if cache miss
                        const machines = await this.machineClientlist.findAll({
                            where: { isActive: { [Op.in]: actives } },
                        });

                        // Store in Redis with 3-minute TTL (180 seconds)
                        await redisClient.setex(cacheKey, 180, JSON.stringify(machines));

                        res.send(PrintSucceeded('getAllMachines', machines, EMessage.succeeded, returnLog(req, res, true)));
                    } catch (error) {
                        console.error('Error in getAllMachines:', error);
                        res.send(PrintError('getAllMachines', error, EMessage.error, returnLog(req, res)));
                    }
                }
            );
            router.post(
                this.path + "/listMachine",
                //APIAdminAccess,
                this.checkSuperAdmin,

                this.checkAdmin,

                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];

                        let actives = [];
                        if (isActive === 'all') {
                            actives = [true, false];
                        } else if (isActive === 'true') {
                            actives = [true];
                        } else if (isActive === 'false') {
                            actives = [false];
                        } else {
                            // Default case if isActive is not provided or invalid
                            actives = [true, false];
                        }
                        // console.log('Active der', actives);

                        const ownerUuid = res.locals["ownerUuid"] || "";

                        this.machineClientlist.findAll({
                            where: {
                                ownerUuid,
                                isActive: { [Op.in]: actives }
                            }
                        }).then((r) => {
                            // console.log(' REST listMachine', r);

                            res.send(PrintSucceeded("listMachine", r, EMessage.succeeded, returnLog(req, res, true)));
                        })
                            .catch((e) => {
                                console.log("Error list machine", e);
                                res.send(PrintError("listMachine", e, EMessage.error, returnLog(req, res, true)));
                            });

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listMachine", error, EMessage.error, returnLog(req, res)));
                    }
                }
            );
            router.post(
                this.path + "/checkMyMmoney",
                //APIAdminAccess,
                // this.checkSuperAdmin,

                // this.checkAdmin,

                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const qr = req.body['qr'];

                        // const ownerUuid = res.locals["ownerUuid"] || "";

                        this.getMyMmoneyPro('', qr, new Date().getTime() + '').then((r) => {
                            res.send(PrintSucceeded("checkMyMmoney", r, EMessage.succeeded, returnLog(req, res, true)));
                        })
                            .catch((e) => {
                                console.log("Error checkMyMmoney", e);
                                res.send(PrintError("checkMyMmoney", e, EMessage.error, returnLog(req, res, true)));
                            });

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("checkMyMmoney", error, EMessage.error, returnLog(req, res)));
                    }
                }
            );
            router.post(
                this.path + "/loadLogs",
                //APIAdminAccess,
                // this.checkSuperAdmin,

                // this.checkAdmin,

                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        let limit = Number(req.query['limit']);
                        let skip = Number(req.query['skip']);
                        limit = limit > 0 ? limit : 5;
                        const offset = limit * skip;
                        // console.log(' REST loadLogs');


                        // const ownerUuid = res.locals["ownerUuid"] || "";

                        logEntity.findAndCountAll({ order: ['updatedAt', 'DESC'], limit, offset }).then((r) => {
                            res.send(PrintSucceeded("loadLogs", r, EMessage.succeeded, returnLog(req, res, true)));
                        })
                            .catch((e) => {
                                console.log("Error loadLogs", e);
                                res.send(PrintError("loadLogs", e, EMessage.error, returnLog(req, res, true)));
                            });

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("loadLogs", error, EMessage.error, returnLog(req, res)));
                    }
                }
            );
            // router.post(
            //     this.path + "/super_listMachine",
            //     // this.checkToken.bind(this),
            //     // this.isSuper.bind(this),
            //     // this.checkDisabled.bind(this),
            //     async (req, res) => {
            //         try {
            //             this.machineClientlist
            //                 .findAll()
            //                 .then((r) => {
            //                     res.send(PrintSucceeded("listMachine", r, EMessage.succeeded));
            //                 })
            //                 .catch((e) => {
            //                     console.log("Error list machine", e);
            //                     res.send(PrintError("listMachine", e, EMessage.error));
            //                 });
            //         } catch (error) {
            //             console.log(error);
            //             res.send(PrintError("listMachine", error, EMessage.error));
            //         }
            //     }
            // );
        } catch (error) {
            console.log(error);
        }
    }
    async listOnlineMachines(): Promise<Array<{ machine: any, status: any,settings:any }>> {
        const m = new Array<{ machine: any, status: any,settings:any }>();
        for (let index = 0; index < this.wsClient.length; index++) { m.push({ machine: this.findMachineId(this.wsClient[index]['machineId']), status: await readMachineStatus(this.wsClient[index]['machineId']),settings:await readMachineSetting(this.wsClient[index]['machineId']) }); }
        return m;
    }
    findOnlneMachine(machineId: string): any {
        return this.wsClient.find((v) => {
            if (machineId == v['machineId']) {
                return this.findMachineId(v['machineId']);
            } // v['machineId']
        })
    }
    authorizeSuperAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('authorizeSuperAdmin');
            if (!res.locals["superadmin"]) throw new Error('You are not superadmin');
            next();

        } catch (error) {
            console.log(error);

            res.status(400).end();
        }
    }
    authorizeSubAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('authorizeSubAdmin');
            if (!res.locals["subadmin"]) throw new Error('You are not Sub admin');
            next();

        } catch (error) {
            console.log(error);

            res.status(400).end();
        }
    }
    validateSuperAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('validateSuperAdmin');
            if (res.locals["secret"]) {
                next();
            } else {
                throw new Error('You are not superadmin');
            }
        } catch (error) {
            console.log(error);
            res.status(400).end();
        }
    }
    checkSuperAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('checkSupAdmin');
            const token = req.body.token;
            const secret = req.body.secret;
            let phoneNumber = req.body.shopPhonenumber;
            if (!token) throw new Error(EMessage.tokenNotFound);

            findRealDB(token).then((r) => {
                const uuid = r;
                if (!uuid) throw new Error(EMessage.notfound);
                // req['gamerUuid'] = gamerUuid;
                res.locals["superadmin"] = uuid;
                if (secret == 'e2f48898-3453-4214-9025-27e905b269d9') {
                    res.locals["secret"] = uuid;
                }
                if (phoneNumber && secret == 'e2f48898-3453-4214-9025-27e905b269d9') {
                    phoneNumber = `+85620${phoneNumber}`;
                    findUuidByPhoneNumberOnUserManager(phoneNumber).then(r_owneruuid => {
                        res.locals["ownerUuid"] = r_owneruuid.uuid;
                        next();
                    });
                } else {
                    res.locals["ownerUuid"] = uuid;
                    next();
                }
            })
                .catch((e) => {
                    console.log(e);
                    res.status(400).end();
                });

        } catch (error) {
            console.log(error);

            res.status(400).end();
        }
    }
    // checkSubAdmin(req: Request, res: Response, next: NextFunction) {
    //     console.log('checkSubAdmin');

    //     try {
    //         if (res.locals['ownerUuid']) {
    //             next();
    //         }
    //         else {
    //             const token = req.body.token;
    //             const phoneNumber = req.body.shopPhonenumber + '';
    //             if (!token) throw new Error(EMessage.tokenNotFound);
    //             findRealDB(token).then((r) => {
    //                 const uuid = r;
    //                 if (!uuid) throw new Error(EMessage.notfound);
    //                 // req['gamerUuid'] = gamerUuid;
    //                 res.locals["subadmin"] = uuid;
    //                 if (phoneNumber) {
    //                     findUuidByPhoneNumberOnUserManager(phoneNumber).then(r => {
    //                         const ownerUuid = r.uuid;
    //                         if (ownerUuid) {
    //                             subadminEntity.findOne({ where: { data: { uuid }, ownerUuid } }).then(subadmin => {
    //                                 if (subadmin != null) {
    //                                     res.locals["ownerUuid"] = subadmin.ownerUuid;
    //                                 } else {
    //                                     res.locals["ownerUuid"] = uuid;
    //                                     res.locals["subadmin"] = '';
    //                                 }
    //                                 next();
    //                             }).catch(error => {
    //                                 console.log(error);
    //                                 res.status(400).end();
    //                             });
    //                         } else {
    //                             res.locals["ownerUuid"] = uuid;
    //                             res.locals["subadmin"] = '';
    //                             next();
    //                         }
    //                     });
    //                 } else {
    //                     res.locals["ownerUuid"] = uuid;
    //                     res.locals["subadmin"] = '';
    //                     next();
    //                 }




    //             })
    //                 .catch((e) => {
    //                     console.log(e);
    //                     res.status(400).end();
    //                 });
    //         }

    //     } catch (error) {
    //         console.log(error);

    //         res.status(400).end();
    //     }
    // }
    checkAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('checkAdmin');
            if (res.locals['ownerUuid']) {
                next();
            }
            else {
                const token = req.body.token;
                if (!token) throw new Error(EMessage.tokenNotFound);
                findRealDB(token)
                    .then((r) => {
                        const ownerUuid = r;
                        if (!ownerUuid) throw new Error(EMessage.notfound);
                        // req['gamerUuid'] = gamerUuid;
                        res.locals["ownerUuid"] = ownerUuid;
                        next();
                    })
                    .catch((e) => {
                        console.log(e);
                        res.status(400).end();
                    });
            }
        } catch (error) {
            console.log(error);

            res.status(400).end();
        }
    }



    getBillProcess(machineId: string, cb: (b: IBillProcess[]) => void) {
        const k = "clientResponse" + machineId;
        try {
            redisClient
                .get(k)
                .then((r) => {
                    // console.log("clientResponse", "getBillProcess");
                    if (r) {
                        cb
                            ? cb(JSON.parse(r) as Array<IBillProcess>)
                            : cb(new Array<IBillProcess>());
                        !cb ? writeErrorLogs("error", { m: "call back empty" }) : "";
                    } else cb(new Array<IBillProcess>());
                })
                .catch((e) => {
                    console.log("error redis1", e);
                    cb(new Array<IBillProcess>());
                    writeErrorLogs("error", e);
                });
        } catch (error) {
            console.log("error redis3", error);
            cb(new Array<IBillProcess>());
            writeErrorLogs("error", error);
        }
    }
    setBillProces(machineId: string, b: IBillProcess[]) {
        const k = "clientResponse" + machineId;
        // console.log('----->setBillProces Key :', k);

        b.forEach((v) =>
            v.bill?.vendingsales?.forEach((v) =>
                v.stock ? (v.stock.image = "") : ""
            )
        );
        redisClient.set(k, JSON.stringify(b)).then(r => {
            // console.log('----->setBillProces Success :', r);
        }).catch(e => {
            console.log('----->setBillProces Error :', e);
        });
    }
    // keepBillProces(t:Array<number>) {

    //     const k = 'clientResponse';
    //     redisClient.get(k).then(r => {
    //         try {
    //             console.log('clientResponse','deleteBillProces',t);

    //             if (r) {
    //                 const c = JSON.parse(r) as IBillProcess[];
    //                 c ? redisClient.set(k, JSON.stringify(c.filter(v=>t.includes(v.transactionID)))) : '';
    //             }
    //         } catch (error) {
    //             console.log('error redis 2', error);
    //             writeErrorLogs('error', error);
    //         }
    //     })
    // }
    deductStock(transactionID: number, bill: any, position: any) {
        const that = this;
        const resx = {} as IResModel;
        resx.command = EMACHINE_COMMAND.confirm;
        resx.message = EMessage.confirmsucceeded;
        if (transactionID < 0)
            return console.log("deductStock ignore", transactionID);
        if ([22331, 1000].includes(transactionID)) {
            resx.status = 1;
            // console.log("deductStock 22231", transactionID);
            resx.transactionID = ((transactionID || -1) + '') + '';
            resx.data = { bill, position };
            //    return  cres?.res.send(PrintSucceeded('onMachineResponse '+re.transactionID, resx, EMessage.succeeded));
        } else {
            const idx =
                bill?.vendingsales?.findIndex((v) => v.position == position) || -1;
            idx == -1 || !idx ? "" : bill?.vendingsales?.splice(idx, 1);
            resx.status = 1;
            // console.log("deductStock xxx", transactionID);
            resx.transactionID = ((transactionID || -1) + '') + '';
            resx.data = { bill, position };
        }
        const clientId = bill?.clientId + "";
        // console.log("send", clientId, bill?.clientId, resx);
        // console.log("deductStock", transactionID);

        ///** always retry */
        const retry = -1; // set config and get config at redis and deduct the retry times;
        // if retry == -1 , it always retry
        /// TODO
        // that.setBillProces(b.filter(v => v.transactionID != re.transactionID));
        // writeSucceededRecordLog(cres?.bill, cres?.position);

        // TO MAKE SURE DEDUCT STOCK IS WORKING AND NEED CONFIRM

        readMachinePendingStock(bill?.machineId + '').then(r => {
            let x = JSON.parse(r) as Array<any>;
            if (!x || !Array.isArray(x)) x = [{ transactionID, position }];
            else {
                x.push({ transactionID, position });
            }
            writeMachinePendingStock(bill?.machineId + "", x)
            logEntity.create({ body: resx, url: 'deductStock' })
            that.sendWSToMachine(bill?.machineId + "", resx);
        })


        /// DEDUCT STOCK AT THE SERVER HERE

        // No need To update delivering status
        // const entx = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + cres?.ownerUuid, dbConnection);
        // entx.findAll({ where: { machineId: cres?.bill.machineId, paymentstatus: EPaymentStatus.paid } }).then(async rx => {
        //     try {
        //         const bill = rx.find(v => v.transactionID ==cres?.transactionID);
        //         if (bill) {
        //             bill.paymentstatus = EPaymentStatus.delivered;
        //             bill.changed('paymentstatus', true);
        //             bill.save();
        //         } else throw new Error(EMessage.transactionnotfound);

        //         // }
        //     } catch (error) {
        //         console.log(error);
        //     }
        // }).catch(e => {
        //     console.log('ERROR', e);

        // })
    }
    // processingCreditQueques=new Array<string>();
    createBN(clientId: string, transactionID: string, machineId: string) {
        const bsi = {} as IBillCashIn;
        bsi.clientId = clientId;
        bsi.createdAt = new Date();
        bsi.updatedAt = bsi.createdAt;
        bsi.transactionID = Number(machineId + transactionID);
        bsi.uuid = uuid4();
        bsi.userUuid; // later
        bsi.id; // auto

        bsi.isActive = true;

        bsi.badBankNotes = []; // update from machine
        bsi.bankNotes = []; // update from machine

        bsi.confirm; // update when cash has come
        bsi.confirmTime; // update when cash has come

        bsi.requestTime = new Date();
        // bsi.requestor = requestor;
        bsi.machineId = machineId;
        return bsi;
    }
    async creditMachineVMC(machineId: string, ownerUuid: string, transactionID: number, hash: string, res: Response, wsclientId: string = '') {

        try {

            let ack = await readACKConfirmCashIn(machineId + '' + transactionID);
            if (ack != 'yes') {
                // double check in database
                const r = await this.loadBillCash(machineId, transactionID)
                if (r?.length) {
                    await writeACKConfirmCashIn(machineId + '' + transactionID);
                    ack = 'yes';
                } else
                    await writeACKConfirmCashIn(machineId + '' + transactionID);
            } else {
                await writeACKConfirmCashIn(machineId + '' + transactionID);
                // throw new Error('TOO FAST ' + d.transactionID);
                // ack = 'yes';
            }
            const bsi = {} as IBillCashIn;
            bsi.clientId = wsclientId;
            bsi.createdAt = new Date();
            bsi.updatedAt = bsi.createdAt;
            bsi.transactionID = transactionID;
            bsi.uuid = uuid4();
            bsi.userUuid; // later
            bsi.id; // auto

            bsi.isActive = true;

            bsi.badBankNotes = []; // update from machine
            bsi.bankNotes = []; // update from machine

            bsi.confirm; // update when cash has come
            bsi.confirmTime; // update when cash has come

            bsi.requestTime = new Date();
            // bsi.requestor = requestor;
            bsi.machineId = machineId;

            if (ack == 'yes') {
                // reconfirm
                readMachineSetting(machineId).then(async r => {
                    let setting = {} as any
                    if (r) {
                        try {
                            setting = (JSON.parse(r))?.find(v => v.settingName == 'setting');
                        } catch (error) {
                            console.log('error parsing setting 2', error);
                            setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }; setting.limiter = 100000; setting.imei = '';
                        }
                    }
                    const balance = await readMerchantLimiterBalance(ownerUuid);
                    // const limiter = await readMachineLimiter(machineId.machineId);
                    this.updateBillCash(bsi, machineId, transactionID);
                    await writeACKConfirmCashIn(machineId + '' + transactionID);

                    res?.send(
                        JSON.stringify(
                            PrintSucceeded(EMACHINE_COMMAND.CREDIT_NOTE, balance, EMessage.succeeded, null)
                        )
                    )
                    // finish the process allow next queque with exist TransactionID
                    // console.log('finish the process allow next queque with exist TransactionID', transactionID);
                })

                return;
            }
            else {
                // create new bill for new credit
                if (!machineId) throw new Error("machine is not exist");
                // that.ssocket.terminateByClientClose(machineId.machineId)
                const hashnotes = this.initHashBankNotes(machineId);

                const hn = hashnotes.find((v) => v.hash == hash + "");
                if (hn == undefined || Object.entries(hn).length == 0) {
                    res?.send(
                        JSON.stringify(
                            PrintError(EMACHINE_COMMAND.CREDIT_NOTE, [], EMessage.invalidBankNote + " 0", null)
                        )
                    );
                    return;
                }
                // console.log("hn", hn);
                const bn = this.notes.find((v) => v.value == hn?.value);
                if (bn == undefined || Object.entries(bn).length == 0) {
                    res?.send(
                        JSON.stringify(PrintError(EMACHINE_COMMAND.CREDIT_NOTE, [], EMessage.invalidBankNote, null))
                    );
                    return;
                }
                // console.log("bn", bn);

                // *** CASH IN TO OLD LAAB
                const func = new CashinValidationFunc();
                const params = {
                    cash: bn?.value,
                    description: "VENDING LAAB CASH IN",
                    machineId: machineId,
                };
                // console.log(`cash in validation params`, params);


                func // OLD LAAB
                    .Init(params) // OLD LAAB
                    .then((run) => { // OLD LAAB
                        // console.log('RECORD THIS TRANSACTIION AS IT has been doen');
                        // // finish the process allow next queque 
                        // console.log('finish the process allow next queque ');
                        // writeACKConfirmCashIn(machineId + '' + transactionID);
                        // console.log(`response cash in validation`, run);
                        if (run.message != IENMessage.success) throw new Error(run);
                        bsi.bankNotes.push(bn);

                        this.updateBillCash(bsi, machineId, bsi.transactionID);
                        // console.log(`sw sender`, EMACHINE_COMMAND.CREDIT_NOTE, bsi, machineId);
                        // redisClient.set('_balance_' + ws['clientId'], bn.value);
                        // writeMachineBalance(machineId.machineId,bn.value+'')
                        readMachineSetting(machineId).then(async r => {
                            let setting = {} as any
                            if (r) {
                                try {
                                    setting = JSON.parse(r)?.find(v => v.settingName == 'setting');
                                } catch (error) {
                                    console.log('error parsing setting 2', error);
                                    setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }; setting.limiter = 100000; setting.imei = '';
                                }
                            }
                            const balance = await readMerchantLimiterBalance(ownerUuid);
                            // const limiter = await readMachineLimiter(machineId.machineId);

                            res?.send(
                                JSON.stringify(
                                    PrintSucceeded(EMACHINE_COMMAND.CREDIT_NOTE, balance, EMessage.succeeded, null)
                                )
                            )
                        })
                    }) // OLD LAAB
                    .catch((error) => { // OLD LAAB
                        console.log(`error cash in validation`, error.message); // OLD LAAB
                        bsi.badBankNotes.push(bn); // OLD LAAB
                        this.updateBadBillCash(bsi, machineId, bsi?.transactionID); // OLD LAAB

                        if (error.transferFail == true) {
                            console.log(`error`, error.message);
                            this.updateInsuffBillCash(bsi);
                        }

                        res?.send(JSON.stringify(PrintError(EMACHINE_COMMAND.CREDIT_NOTE, [], error.message, null)));
                    });
                // *** CASH IN TO OLD LAAB
                // const requestor = this.requestors.find(v => v.transID == d.data.transID);

                // if (!requestor) throw new Error('Requestor is not exist');

            }
        } catch (error) {
            console.log(error);
            res?.send(JSON.stringify(PrintError(EMACHINE_COMMAND.CREDIT_NOTE, [], error.message, null)));
        }
    }
    async creditMachineMMoney(d: IReqModel): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                console.log(`TEST DER -->`, 1);

                const that = this;
                let { phonenumber, cashInValue } = d.data;

                console.log(`TEST DER -->`, 2);

                // DEMO 1000 only
                // cashInValue = 1100;
                if (isNaN(cashInValue)) return reject(new Error('Invalid Cash In Value'));

                console.log(`TEST DER -->`, 3);

                // validate phonenumber for MMoney
                if (phonenumber?.length < 10 || isNaN(phonenumber) || phonenumber == '') return reject('Invalid Phonenumber');
                // find in redis

                console.log(`TEST DER -->`, 4);

                // imei
                d.transactionID = new Date().getTime();

                console.log(`TEST DER -->`, 5);

                let machineId = this.findMachineIdToken(d.token);
                if (!machineId) throw new Error("machine is not exit");

                console.log(`TEST DER -->`, 6);


                const ws = that.wsClient.find(
                    (v) => v["machineId"] == machineId.machineId + ""
                );
                const res = {} as IResModel;

                console.log(`TEST DER -->`, 7);

                res.command = d.command;
                res.message = EMessage.machineCredit;
                res.status = 1;
                // console.log(
                //     "creditMachine WS online machine",
                //     that.listOnlineMachines()
                // );

                console.log(`TEST DER -->`, 8);

                // create new bill for new credit
                if (!machineId) throw new Error("machine is not exist");

                console.log(`TEST DER -->`, 9);


                const sock = that.findOnlneMachine(machineId.machineId);
                if (!sock) throw new Error("machine is not online");

                console.log(`TEST DER -->`, 10);

                if (d?.token) {

                    console.log(`TEST DER -->`, 11);

                    // console.log("billCashIn", d?.data);

                    // *** cash in here
                    const bn = { amount: cashInValue, channel: -1 * cashInValue, value: cashInValue } as IBankNote;

                    console.log(`TEST DER -->`, 12);

                    // start Cash In MMoney
                    // ##here
                    const machineId = this.findMachineIdToken(d.token);
                    if (!machineId) throw new Error("Invalid token");

                    console.log(`TEST DER -->`, 13);

                    let a = machineId?.data?.find(v => v.settingName == 'setting');
                    let mId = a?.imei + ''; // for MMoney need 10 digits\

                    console.log(`TEST DER -->`, 14);

                    if (!mId) mId = machineId.machineId;

                    console.log(`TEST DER -->`, 15);
                    const x = new Date().getTime();
                    const transactionID = String(mId.substring(mId.length - 10)) + (x + '').substring(2);

                    console.log(`TEST DER -->`, 16);

                    const params = {
                        cash: cashInValue,
                        description: "LAAB CASH OUT TO MMONEY",
                        machineId: machineId.machineId,
                    };
                    const func = new MmoneyTransferValidationFunc();

                    console.log(`creditMachineMMoney`,);

                    func.Init(params).then(run => {
                        if (run.message != IENMessage.success) return resolve(run);
                        const ifError = run.ifError;
                        delete run.ifError;
                        let model = {
                            ownerUuid: run.ownerUuid,
                            data: {
                                phonenumber: phonenumber,
                                transactionID: transactionID,
                                cashInValue: cashInValue,
                                description: params.description,
                                machineId: machineId.machineId
                            },
                            LAAB: run.h,
                            MMoney: {},
                            message: ''
                        }

                        console.log(`creditMachineMMoney`, 2);

                        machineCashoutMMoneyEntity.create(model).then(run_createLAABLog => {
                            // console.log(`creditMachineMMoney`, 3, run_createLAABLog);
                            if (!run_createLAABLog) return resolve(IENMessage.createLAABBillFail);
                            machineCashoutMMoneyEntity.findOne({ where: { id: run_createLAABLog.id } }).then(run_findbill => {
                                // console.log(`creditMachineMMoney`, 4, run_findbill);
                                if (run_findbill == null) return resolve(IENMessage.notFoundBill);
                                this.refillMMoney(phonenumber, transactionID, cashInValue, params.description).then(refill => {
                                    // console.log(`creditMachineMMoney`, 5, refill);
                                    machineCashoutMMoneyEntity.update({ MMoney: refill }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {
                                        // console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                        if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                        model.MMoney = refill;
                                        model.message = IENMessage.success;
                                        // console.log(`creditMachineMMoney`, 7);
                                        resolve(model);
                                    }).catch(error => resolve(error.message));
                                }).catch(error => {

                                    // if transfer mmoney fail laab mmoney finance will auto transfer back to vending
                                    const params = ifError;

                                    console.log(`params error der`, params);
                                    axios.post(LAAB_CoinTransfer, params, { timeout: 10000 }).then(run_return => {
                                        console.log(`return error 1`, run_return.data);

                                        // if transfer back fail database will save data log
                                        if (run_return.data.status != 1) {
                                            console.log(`return error`, run_return.data);
                                            machineCashoutMMoneyEntity.update({ LAABReturn: run_return.data }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {
                                                console.log(`save return bill br sum led`, run_return.data);
                                                if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                                resolve(error.message);
                                            }).catch(error => resolve(error.message));
                                        }

                                        // if transfer back success database will save hash and info
                                        const h = {
                                            hash: run_return.data.info.hash,
                                            info: run_return.data.info.info
                                        }
                                        machineCashoutMMoneyEntity.update({ LAABReturn: h }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {
                                            // console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                            if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                            writeMachineBalance(ifError.machineId, ifError.vendingBalance);
                                            resolve(error.message);
                                        }).catch(error => resolve(`update bill return br sum led 001` + error.message));

                                    }).catch(error => {

                                        // if transfer back and everything fail database will save error data
                                        machineCashoutMMoneyEntity.update({ LAABReturn: error.message }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {

                                            // console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                            if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                            resolve(error.message);
                                        }).catch(error => resolve(`update bill return br sum led 002` + error.message));
                                    });

                                });
                            }).catch(error => resolve(error.message));
                        }).catch(error => resolve(error.message));
                    }).catch(error => {
                        console.log(`----> cash in from laab and transfer to mmoney fail`, error.message);
                        resolve(error.message);
                    });


                    // **** old function ****
                    // this.refillMMoney(phonenumber,  transactionID, cashInValue, 'LAAB CASH OUT TO MMONEY').then(rm => {

                    //     // start transfer in LAAB -- TO MMONEY WALLET
                    //     const func = new CashinValidationFunc();
                    //     const params = {
                    //         cash: cashInValue,
                    //         description: "VENDING LAAB CASH IN",
                    //         machineId: machineId.machineId,
                    //     };
                    //     console.log(`cash in validation params`, params);
                    //     func
                    //         .Init(params)
                    //         .then((run) => {
                    //             console.log('RECORD THIS TRANSACTIION AS IT has been doen');
                    //             // finish the process allow next queque 
                    //             console.log('finish the process allow next queque ');
                    //             writeACKConfirmCashIn(phonenumber + '' + d.transactionID);
                    //             console.log(`response cash in validation`, run);
                    //             if (run.message != IENMessage.success) throw new Error(run);
                    //             bsi.bankNotes.push(bn);
                    //             res.data = { clientId: ws["clientId"], billCashIn: bsi, bn };
                    //             that.updateBillCash(bsi, machineId.machineId, bsi.transactionID);
                    //             console.log(`sw sender`, d.command, res.data);
                    //             // redisClient.set('_balance_' + ws['clientId'], bn.value);
                    //             // writeMachineBalance(machineId.machineId, bn.value + '');
                    //             readMachineSetting(machineId.machineId).then(async r => {
                    //                 let setting = {} as any
                    //                 if (r) {
                    //                     try {
                    //                         setting = JSON.parse(r);
                    //                     } catch (error) {
                    //                         console.log('error parsing setting 2', error);
                    //                         setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true; setting.limiter = 100000;
                    //                         return reject(error);
                    //                     }
                    //                 }
                    //                 // const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                    //                 // const limiter = await readMachineLimiter(machineId.machineId);

                    //                 // that.ssocket.updateBalance(machineId.machineId, { balance: balance || 0, limiter: setting.limiter, setting, confirmCredit: true, transactionID: bsi.transactionID })
                    //                 ws.send(
                    //                     JSON.stringify(
                    //                         PrintSucceeded(d.command, res, EMessage.succeeded)
                    //                     )
                    //                 )
                    //                 return resolve(rm)
                    //             })
                    //         })
                    //         .catch((error) => {
                    //             console.log(`error cash in validation`, error.message);
                    //             bsi.badBankNotes.push(bn);
                    //             res.data = { clientId: ws["clientId"], billCashIn: bsi, bn };
                    //             that.updateBadBillCash(bsi, machineId?.machineId, bsi?.transactionID);

                    //             if (error.transferFail == true) {
                    //                 console.log(`error`, error.message);
                    //                 this.updateInsuffBillCash(bsi);

                    //             }

                    //             ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
                    //             return reject(error);
                    //         });

                    // }).catch(e => {
                    //     console.log('refillMMoney', e);
                    //     reject(e);
                    // })



                    // const requestor = this.requestors.find(v => v.transID == d.data.transID);

                    // if (!requestor) throw new Error('Requestor is not exist');
                } else {

                    console.log(`TEST DER ERROR -->`, 1);

                    // throw new Error(EMessage.MachineIdNotFound)
                    ws.send(
                        JSON.stringify(PrintError(d.command, [], EMessage.MachineIdNotFound, null))
                    );
                    return reject(new Error('Token not FOUND'));
                }
            } catch (error) {
                console.log('error credit machine', error,);
                return reject(error);
            }
        });
    }

    async creditMachine(d: IReqModel) {
        try {
            // console.log(`creditMachineDER`);

            const that = this;
            // find in redis
            let machineId = this.findMachineIdToken(d.token);
            let ack = await readACKConfirmCashIn(machineId.machineId + '' + d.transactionID);

            if (ack != 'yes') {
                // double check in database
                const r = await this.loadBillCash(machineId.machineId, d.transactionID)
                if (r?.length) {
                    await writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
                    ack = 'yes';
                } else
                    await writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
            } else {
                await writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
                // throw new Error('TOO FAST ' + d.transactionID);
                // ack = 'yes';
            }



            const ws = that.wsClient.find(
                (v) => v["machineId"] == machineId.machineId + ""
            );
            let wsclientId = '';
            if (ws) wsclientId = ws["clientId"];
            const res = {} as IResModel;

            res.command = d.command;
            res.message = EMessage.machineCredit;
            res.status = 1;
            // console.log(
            //     "creditMachine WS online machine",
            //     that.listOnlineMachines()
            // );

            // console.log('FOUND ACK EXIST TRANSACTIONID', ack, d.transactionID);

            const bsi = {} as IBillCashIn;
            bsi.clientId = wsclientId;
            bsi.createdAt = new Date();
            bsi.updatedAt = bsi.createdAt;
            bsi.transactionID = d.transactionID;
            bsi.uuid = uuid4();
            bsi.userUuid; // later
            bsi.id; // auto

            bsi.isActive = true;

            bsi.badBankNotes = []; // update from machine
            bsi.bankNotes = []; // update from machine

            bsi.confirm; // update when cash has come
            bsi.confirmTime; // update when cash has come

            bsi.requestTime = new Date();
            // bsi.requestor = requestor;
            bsi.machineId = machineId.machineId;

            if (ack == 'yes') {
                // reconfirm
                readMachineSetting(machineId.machineId).then(async r => {
                    let setting = {} as any
                    if (r) {
                        try {
                            setting = JSON.parse(r)?.find(v => v.settingName == 'setting');
                        } catch (error) {
                            console.log('error parsing setting 2', error);
                            setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }; setting.limiter = 100000; setting.imei = '';
                        }
                    }
                    const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                    // const limiter = await readMachineLimiter(machineId.machineId);
                    this.updateBillCash(bsi, machineId.machineId, d.transactionID);
                    await writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
                    // that.updateBalance(machineId.machineId, { balance: balance || 0, limiter: setting.limiter, setting, confirmCredit: true, transactionID: d.transactionID })
                    ws?.send(
                        JSON.stringify(
                            PrintSucceeded(d.command, res, EMessage.succeeded, null)
                        )
                    )
                    // finish the process allow next queque with exist TransactionID
                    // console.log('finish the process allow next queque with exist TransactionID', d.transactionID);
                })

                return;
            } else {
                // create new bill for new credit
                if (!machineId) throw new Error("machine is not exist");
                const sock = that.findOnlneMachine(machineId.machineId);
                if (!sock) throw new Error("machine is not online");
                // that.ssocket.terminateByClientClose(machineId.machineId)
                const hashnotes = this.initHashBankNotes(machineId.machineId);

                // console.log('hashnotes',hashnotes);


                if (d?.token) {


                    // console.log("billCashIn", d?.data);

                    // bsi.requestor = requestor;
                    // that.push(bsi);
                    //
                    const hn = hashnotes.find((v) => v.hash == d?.data + "");
                    if (hn == undefined || Object.entries(hn).length == 0) {
                        ws?.send(
                            JSON.stringify(
                                PrintError(d.command, [], EMessage.invalidBankNote + " 0", null)
                            )
                        );
                        return;
                    }
                    // console.log("hn", hn);
                    const bn = this.notes.find((v) => v.value == hn?.value);
                    if (bn == undefined || Object.entries(bn).length == 0) {
                        ws?.send(
                            JSON.stringify(PrintError(d.command, [], EMessage.invalidBankNote, null))
                        );
                        return;
                    }
                    // console.log("bn", bn);

                    // *** cash in here
                    const func = new CashinValidationFunc();
                    const params = {
                        cash: bn?.value,
                        description: "VENDING LAAB CASH IN",
                        machineId: machineId.machineId,
                    };
                    // console.log(`cash in validation params`, params);
                    func
                        .Init(params)
                        .then((run) => {
                            console.log('RECORD THIS TRANSACTIION AS IT has been doen');
                            // finish the process allow next queque 
                            console.log('finish the process allow next queque ');
                            writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
                            console.log(`response cash in validation`, run);
                            if (run.message != IENMessage.success) throw new Error(run);
                            bsi.bankNotes.push(bn);
                            res.data = { clientId: wsclientId, billCashIn: bsi, bn, machineId: machineId.machineId };
                            that.updateBillCash(bsi, machineId.machineId, bsi.transactionID);
                            console.log(`sw sender`, d.command, res.data, machineId.machineId);
                            // redisClient.set('_balance_' + ws['clientId'], bn.value);
                            // writeMachineBalance(machineId.machineId,bn.value+'')
                            readMachineSetting(machineId.machineId).then(async r => {
                                let setting = {} as any
                                if (r) {
                                    try {
                                        setting = JSON.parse(r)?.find(v => v.settingName == 'setting');
                                    } catch (error) {
                                        console.log('error parsing setting 2', error);
                                        setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }; setting.limiter = 100000; setting.imei = '';
                                    }
                                }
                                const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                                // const limiter = await readMachineLimiter(machineId.machineId);

                                // that.updateBalance(machineId.machineId, { balance: balance || 0, limiter: setting.limiter, setting, confirmCredit: true, transactionID: bsi.transactionID })
                                ws?.send(
                                    JSON.stringify(
                                        PrintSucceeded(d.command, res, EMessage.succeeded, null)
                                    )
                                )
                            })
                        })
                        .catch((error) => {
                            console.log(`error cash in validation`, error.message);
                            bsi.badBankNotes.push(bn);
                            res.data = { clientId: wsclientId, billCashIn: bsi, bn };
                            that.updateBadBillCash(bsi, machineId?.machineId, bsi?.transactionID);

                            if (error.transferFail == true) {
                                console.log(`error`, error.message);
                                this.updateInsuffBillCash(bsi);
                            }

                            ws?.send(JSON.stringify(PrintError(d.command, [], error.message, null)));
                        });

                    // const requestor = this.requestors.find(v => v.transID == d.data.transID);

                    // if (!requestor) throw new Error('Requestor is not exist');
                } else {
                    // throw new Error(EMessage.MachineIdNotFound)
                    ws?.send(
                        JSON.stringify(PrintError(d.command, [], EMessage.MachineIdNotFound, null))
                    );
                }
            }
        } catch (error) {
            console.log('error credit machine', error,);

        }


    }

    initHashBankNotes(machineId: string) {
        const hashNotes = Array<IHashBankNote>();
        for (let i = 0; i < this.notes.length; i++) {
            const x = JSON.parse(JSON.stringify(this.notes[i])) as IHashBankNote;
            x.hash = cryptojs
                .SHA256(machineId + this.notes[i].value * 100)
                .toString(cryptojs.enc.Hex);
            hashNotes.push(x);
        }
        return hashNotes;
    }
    init() {
        // load machines
        return new Promise<Array<IMachineClientID>>((resolve, reject) => {
            this.machineClientlist.sync().then((r) => {
                this.machineClientlist.findAll({ attributes: { exclude: ['photo'] } }).then((rx) => {
                    this.initMachineId(rx);
                    this.InitBillPaid(rx);
                });
            });

            const that = this;
            // this.onMachineCredit((d: IReqModel) => {
            //     that.creditMachine(d);
            // });



            // this.ssocket.onMachineResponse((re: IReqModel) => {
            //     const machineId = this.ssocket.findMachineIdToken(re.token);


            //     if (re.transactionID == -52) {

            //         writeMachineStatus(machineId.machineId, re.data);
            //         const ws = this.wsClient.find(v => v['machineId'] == machineId.machineId);
            //         const wsAdmins = this.wsClient.find(v => v['myMachineId']?.includes(machineId.machineId));
            //         // console.log('ws', 'wsAdmin', machineId);

            //         // const wsAdmin = this.wsClient.filter(v=>v['myMachineId'].includes(machineId.machineId));
            //         if (ws) {
            //             const resx = {} as IResModel;
            //             resx.command = EMACHINE_COMMAND.status;
            //             resx.message = EMessage.status;
            //             resx.data = re.data;
            //             resx.transactionID = re.transactionID + '';
            //             // save to redis
            //             // redisClient.set('_machinestatus_' + machineId.machineId, re.data);
            //             // console.log('writeMachineStatus', machineId.machineId, re.data);


            //             // send to machine client
            //             this.sendWSToMachine(machineId.machineId, resx);
            //             logEntity.create({ body: resx, superadmin: ws['ownerUuid'], subadmin: ws['ownerUuid'], ownerUuid: ws['ownerUuid'], url: 'onMachineResponse' })

            //             // this.sendWS(ws['clientId'], resx);
            //         }
            //         if (wsAdmins) {
            //             const resx = {} as IResModel;
            //             resx.command = EMACHINE_COMMAND.status;
            //             resx.message = EMessage.status;
            //             resx.data = re.data;
            //             resx.transactionID = re.transactionID + '';
            //             // save to redis
            //             // redisClient.set('_machinestatus_' + machineId.machineId, re.data);
            //             // console.log('writeMachineStatus', machineId.machineId, re.data);
            //             // send to machine client
            //             this.sendWSMyMachine(machineId.machineId, resx);
            //             logEntity.create({ body: resx, superadmin: wsAdmins['ownerUuid'], subadmin: wsAdmins['ownerUuid'], ownerUuid: wsAdmins['ownerUuid'], url: 'onMachineResponse' })
            //         }
            //         // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
            //         // fafb52
            //         // 21 //len
            //         // 54 // series
            //         // 00 // bill acceptor
            //         // 01 // coin acceptor
            //         // 00 // card reader status
            //         // 00 // tem controller status
            //         // 13 // temp
            //         // 00 // door 
            //         // 00000000 // bill change
            //         // 00000000 // coin change
            //         // 30303030303030303030
            //         // 13aaaaaaaaaaaaaa8d
            //         // // fafb header
            //         // // 52 command
            //         // // 01 length
            //         // // Communication number+ 
            //         // '00'//Bill acceptor status+ 
            //         // '00'//Coin acceptor status+ 
            //         // '00'// Card reader status+
            //         // '00'// Temperature controller status+ 
            //         // '00'// Temperature+ 
            //         // '00'// Door status+ 
            //         // '00 00 00 00'// Bill change(4 byte)+ 
            //         // '00 00 00 00'// Coin change(4 byte)+ 
            //         // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) + 
            //         // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
            //         // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)

            //         console.log('FAFB52', re.data);

            //         return;
            //     }
            //     console.log("onMachineResponse", re);
            //     console.log("onMachineResponse transactionID", re.transactionID);
            //     this.getBillProcess(machineId.machineId, (b) => {
            //         console.log('*****GetBillProcess', b);

            //         const cres = b.find((v) => v.transactionID == re.transactionID);
            //         try {
            //             const machineId = this.ssocket.findMachineIdToken(re.token);
            //             // writeMachineStatus(machineId.machineId, re.data);
            //             const ws = this.wsClient.find(v => v['machineId'] == machineId.machineId);
            //             const wsAdmins = this.wsClient.find(v => v['myMachineId']?.includes(machineId.machineId));
            //             const resx = {} as IResModel;
            //             resx.command = EMACHINE_COMMAND.status;
            //             resx.message = EMessage.status;
            //             resx.data = re.data;
            //             resx.transactionID = re.transactionID + '';
            //             if (wsAdmins) {
            //                 this.sendWSMyMachine(machineId.machineId, resx);
            //                 logEntity.create({ body: resx, superadmin: wsAdmins['ownerUuid'], subadmin: wsAdmins['ownerUuid'], ownerUuid: wsAdmins['ownerUuid'], url: 'onMachineResponse' })
            //             }
            //             if (ws) {
            //                 logEntity.create({ body: resx, superadmin: ws['ownerUuid'], subadmin: ws['ownerUuid'], ownerUuid: ws['ownerUuid'], url: 'onMachineResponse' })
            //                 this.sendWSToMachine(machineId.machineId, resx);
            //             }


            //             // vmc response with transactionId and buffer data
            //             // zdm8 reponse with transactionId

            //             // check by transactionId and command data (command=status)

            //             // if need to confirm with drop detect
            //             // we should use drop detect to audit
            //             // that.deductStock(re.transactionID, cres?.bill, cres?.position);

            //             // const resx = {} as IResModel;
            //             // resx.command = EMACHINE_COMMAND.confirm;
            //             // resx.message = EMessage.confirmsucceeded;
            //             // if (re.transactionID < 0) return console.log('onMachineResponse ignore', re);
            //             // if ([22331, 1000].includes(re.transactionID)) {

            //             //     resx.status = 1;
            //             //     console.log('onMachineResponse 22231', re);
            //             //     resx.transactionID = re.(transactionID || -1) + '';
            //             //     resx.data = { bill: cres?.bill, position: cres?.position };
            //             //     //    return  cres?.res.send(PrintSucceeded('onMachineResponse '+re.transactionID, resx, EMessage.succeeded));

            //             // } else {
            //             //     const idx = cres?.bill?.vendingsales?.findIndex(v => v.position == cres?.position) || -1;
            //             //     idx == -1 || !idx ? cres?.bill.vendingsales?.splice(idx, 1) : '';
            //             //     resx.status = 1;
            //             //     console.log('onMachineResponse xxx', re);
            //             //     resx.transactionID = re.(transactionID || -1) + '';
            //             //     resx.data = { bill: cres?.bill, position: cres?.position };
            //             // }
            //             // const clientId = cres?.bill.clientId + '';
            //             // console.log('send', clientId, cres?.bill?.clientId, resx);
            //             // console.log('onMachineResponse', re.transactionID);
            //             // console.log('keep', b.filter(v => v.transactionID != re.transactionID).map(v => v.transactionID));

            //             // ///** always retry */
            //             // const retry = -1; // set config and get config at redis and deduct the retry times;
            //             // // if retry == -1 , it always retry
            //             // /// TODO
            //             // // that.setBillProces(b.filter(v => v.transactionID != re.transactionID));
            //             // // writeSucceededRecordLog(cres?.bill, cres?.position);
            //             // if(ws)
            //             // that.sendWSToMachine(cres?.bill?.machineId + '', resx);
            //             // if(wsAdmins)
            //             // that.sendWSMyMachine(machineId.machineId, resx);
            //             // /// DEDUCT STOCK AT THE SERVER HERE

            //             // // No need To update delivering status
            //             // // const entx = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + cres?.ownerUuid, dbConnection);
            //             // // entx.findAll({ where: { machineId: cres?.bill.machineId, paymentstatus: EPaymentStatus.paid } }).then(async rx => {
            //             // //     try {
            //             // //         const bill = rx.find(v => v.transactionID ==cres?.transactionID);
            //             // //         if (bill) {
            //             // //             bill.paymentstatus = EPaymentStatus.delivered;
            //             // //             bill.changed('paymentstatus', true);
            //             // //             bill.save();
            //             // //         } else throw new Error(EMessage.transactionnotfound);

            //             // //         // }
            //             // //     } catch (error) {
            //             // //         console.log(error);
            //             // //     }
            //             // // }).catch(e => {
            //             // //     console.log('ERROR', e);

            //             // // })
            //         } catch (error) {
            //             console.log("error onMachineResponse", error);
            //             logEntity.create({ body: error, url: 'onMachineResponse' });
            //             // cres?.res.send(PrintError('onMachineResponse', error, EMessage.error));
            //         }
            //     });

            // });

            ////



            /// ****#### NEED TO UPDATE AND CHANGE LATER USING SOCKET UPDATE FROM LAAB 06072023
            // setInterval(() => {
            //     const onlineId = [];
            //     this.ssocket.machineIds.forEach((v, i) => {
            //         if (this.ssocket.findOnlneMachine(v.machineId)) {
            //             setTimeout(() => {
            //                 const func = new CashValidationFunc();
            //                 const params = {
            //                     machineId: v.machineId
            //                 }
            //                 func.Init(params).then(run => {
            //                     const response: any = run;
            //                     console.log(`response`, response);
            //                     if (response.message != IENMessage.success) {
            //                         console.log(`cash validate fail`, response?.message);
            //                         // socket.end();
            //                     }
            //                     writeMachineLimiterBalance(v.machineId,response?.balance);
            //                 }).catch(error => {
            //                     console.log(`cash validation error`, error.message);
            //                     // socket.end();
            //                 });
            //             }, 100 * i);
            //         }
            //     });

            // }, 10000)

        });
    }

    initMachineId(m: Array<IMachineClientID>) {
        this.machineIds.length = 0;
        // const data = JSON.parse(JSON.stringify(m));
        // console.log(`initMachineId`, data);
        this.machineIds.push(...m)
        // this.machineIds.forEach(v=>v.photo='');
        this.initMachineSetting(m);
        // init machine balance
        // init merchant limiter
        // init merchant balance
    }


    initMachineSetting(m: Array<IMachineClientID>) {
        m.forEach(async v => {
            if (!Array.isArray(v.data)) v.data = [];

            const x = v.data[0]?.allowVending || true;
            const y = v.data[0]?.allowCashIn || false;
            const w = v.data[0]?.light || { start: 4, end: 3 };
            const z = v.data[0]?.highTemp || 10;
            const u = v.data[0]?.lowTemp || 5;
            const l = v.data[0]?.limiter || 100000;
            const a = v.data.find(v => v.settingName == 'setting');
            if (!a) v.data.push({ settingName: 'setting', allowVending: x, allowCashIn: y, lowTemp: u, highTemp: z, light: w, limiter: l });
            else { a.allowVending = x; a.allowCashIn = y, a.light = w; a.highTemp = z; a.lowTemp = u; a.limiter = l }
            await writeMachineSetting(v.machineId, v.data);
            await writeMachineSettingVersion(v.machineId, v.data);
        })
    }
    findMachineIdToken(token: string) {
        try {
            // const list = this.machineIds.map(item => { return { machineid: item.machineId, otp: item.otp } });
            // console.log(`machineIds der`, list);

            // const model = list.filter(item => item.machineid == '11111111' && item.otp == '111111');
            // const hash = cryptojs.SHA256(model[0].machineid + model[0].otp).toString(cryptojs.enc.Hex);
            // console.log(`compare hash`, token == hash, token, hash);
            // const a = this.machineIds.find(v => cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) == token);
            // console.log(`a`, a);

            const result = this.machineIds.find(v => cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) == token);
            // console.log(`result der xxx`, this.machineIds);
            // console.log('filter ---->', this.machineIds.map(v => { m: cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) }));

            return result;

        } catch (error) {
            console.log(error);

        }
    }
    async InitBillPaid(rx: MachineClientIDModel[]) {
        try {
            // console.log('=====>InitBillPaid');
            for (let index = 0; index < rx.length; index++) {
                const element = rx[index].dataValues;
                // console.log('=====>InitBillPaid element', element);

                let ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + element.ownerUuid,
                    dbConnection
                );
                await ent.sync();
                const currentTime = new Date();
                const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000); // Subtract 1 hour in milliseconds
                ent.findAll({
                    where: {
                        paymentstatus: EPaymentStatus.paid,
                        createdAt: {
                            [Op.between]: [oneHourAgo, currentTime] // Records from 1 hour ago to now
                        }
                    },
                }).then(async r => {
                    // console.log('=====>InitBillPaid bill', r);
                    let dataForSave = [];
                    for (let index1 = 0; index1 < r.length; index1++) {
                        const element1 = r[index1].dataValues;
                        // console.log('=====>InitBillPaid element1', element1);
                        for (let index2 = 0; index2 < element1.vendingsales.length; index2++) {
                            const element2 = element1.vendingsales[index2];
                            const billData = {
                                ownerUuid: element.ownerUuid,
                                position: element2.position,
                                bill: element1,
                                transactionID: getNanoSecTime()
                            };
                            // console.log('=====>InitBillPaid element2', billData);
                            dataForSave.push(billData);
                        }

                        // console.log('=====>InitBillPaid dataForSave', dataForSave);
                        // element.machineId
                        this.setBillProces(element.machineId, dataForSave);

                    }
                }).catch(e => {
                    console.log('InitBillPaid error', e);
                });
            }

        } catch (error) {
            console.log('error InitBillPaid', error);
        }
    }

    loadBillCash(
        machineId: string,
        transactionID: number,
    ) {
        return new Promise<Array<IBillCashIn>>((resolve, reject) => {
            try {

                this.billCashEnt.findAll({ where: { transactionID, machineId } }).then(r => {
                    resolve(r)
                }).catch(e => {
                    console.log(e);

                });

            } catch (error) {
                console.log("Error update badbillcash", error);
            }
        })

    }
    loadBadBillCash(
        machineId: string,
        transactionID: number,
    ) {
        return new Promise<Array<IBillCashIn>>((resolve, reject) => {
            try {

                this.badBillCashEnt.findAll({ where: { transactionID, machineId } }).then(r => {
                    resolve(r)
                }).catch(e => {
                    console.log(e);

                });

            } catch (error) {
                console.log("Error load badbillcash", error);
            }
        })

    }
    updateBillCash(
        billCash: IBillCashIn,
        machineId: string,
        transactionID: number,
        provider = ""
    ) {
        try {

            this.billCashEnt.create(billCash).then((rx) => {
                // console.log(
                //     "SAVED BILL CASH-IN",
                //     provider + "_",
                //     EEntity.billcash +
                //     "_" +
                //     this.production +
                //     "_" +
                //     billCash?.requestor?.transData[0]?.accountRef
                // );
            });
            const mId = this.findMachineId(machineId);
            const mEnt: MachineIDStatic = MachineIDFactory(
                EEntity.machineIDHistory + "_" + this.production + "_" + machineId,
                dbConnection
            );
            mEnt.sync().then((r) => {
                mEnt
                    .create({
                        logintoken: "",
                        machineCommands: "",
                        machineId: mId?.machineId + "_" + mId?.otp,
                        machineIp: "",
                        bill: billCash,
                    })
                    .then((rx) => {
                        // console.log(
                        //     "SAVED MachineIDStatic",
                        //     EEntity.machineIDHistory +
                        //     "_" +
                        //     this.production +
                        //     "_" +
                        //     mId?.machineId
                        // );
                    })
                    .catch((e) => {
                        console.log("  mEnt.create", e);
                    });
            });
        } catch (error) {
            console.log("Error updateBillCash");
        }
    }
    findMachineId(machineId: string) {
        try {
            return this.machineIds.find(v => v.machineId == machineId);
        } catch (error) {
            console.log(error);

        }

    }
    updateBadBillCash(
        billCash: IBillCashIn,
        machineId: string,
        transactionID: number
    ) {
        try {

            this.badBillCashEnt.create(billCash).then((rx) => {
                // console.log(
                //     "SAVED BILL CASH-IN",
                //     EEntity.badbillcash + "_" + this.production
                // );
            });

            const mId = this.findMachineId(machineId);
            const mEnt: MachineIDStatic = MachineIDFactory(
                EEntity.machineIDHistory + "_" + this.production + "_" + machineId,
                dbConnection
            );
            mEnt.sync().then((r) => {
                mEnt
                    .create({
                        logintoken: "",
                        machineCommands: "",
                        machineId: mId?.machineId + "_" + mId?.otp,
                        machineIp: "",
                        bill: billCash,
                    })
                    .then((rx) => {
                        // console.log(
                        //     "SAVED MachineIDStatic",
                        //     EEntity.machineIDHistory + "_" + mId?.machineId
                        // );
                        // const i = this.billCashIn.findIndex(v => v.transactionID == transactionID && v.machineId == machineId);
                        // this.billCashIn.splice(i, 1);
                    })
                    .catch((e) => {
                        console.log("  mEnt.create", e);
                    });
            });
        } catch (error) {
            console.log("Error updateBillCash");
        }
    }
    updateInsuffBillCash(billCash: IBillCashIn) {
        try {
            const bEnt: BillCashInStatic = BillCashInFactory(
                EEntity.insuffbillcash + "_" + this.production,
                dbConnection
            );
            bEnt
                .sync()
                .then((r) => {
                    bEnt.create(billCash).then((rx) => {
                        console.log(
                            "SAVED BILL CASH-IN",
                            EEntity.insuffbillcash + "_" + this.production
                        );
                    });
                })
                .catch((e) => {
                    console.log(" bEnt.create", e);
                });
        } catch (error) {
            console.log("Error updateBillCash");
        }
    }
    reinitMachines() {
        this.machineClientlist.findAll({ attributes: { exclude: ['photo'] } }).then((rx) => {
            this.initMachineId(rx);
        });
    }
    getMyMmoney(PhoneUser: string, myqr: string, transID: string, type: string = 'PRO') {
        return new Promise<any>((resolve, reject) => {
            // generate QR from MMoney

            const qr = {
                qr: myqr,
                PhoneUser, // '2055220199',
                transID,
                type
            } as any;

            // console.log("MyQR", qr);

            axios
                .post<any>(
                    "https://qr.mmoney.la/app/VerifyQR",
                    qr,
                    { headers: { 'lmmkey': 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJNLU1vbmV5IiwiVXNlcm5hbWUiOiJNLU1vbmV5IFgiLCJleHAiOjE2OTIyMzk3ODAsImlhdCI6MTY5MjIzOTc4MH0.VUqTof1EQ8LSYjfSn6svaY7Pmn2NDLqlq5DMqjLnsro' } }
                )
                .then((rx) => {
                    console.log("getMyMmoney", rx);
                    if (rx.status) {
                        resolve(rx.data);
                    } else {
                        reject(new Error(rx.statusText));
                    }
                })
                .catch((e) => {
                    reject(e);
                });

        });
    }
    getMyMmoneyPro(PhoneUser: string, myqr: string, transID: string, type: string = 'PRO') {
        return new Promise<any>((resolve, reject) => {
            // generate QR from MMoney

            const qr = {
                qrstr: myqr
            } as any;

            // console.log("MyQR", qr);

            axios.post<any>("https://qr.mmoney.la/pro/VerifyMyQR", qr, { headers: { "Content-Type": "application/json", "lmm-key": "va157f35a50374ba3a07a5cfa1e7fd5d90e612fb50e3bca31661bf568dcaa5c17", timeout: 10000 } })
                .then((rx) => {
                    console.log("getMyMmoney", rx);
                    if (rx.status) {
                        resolve(rx.data);
                    } else {
                        reject(new Error(rx.statusText));
                    }
                })
                .catch((e) => {
                    reject(e);
                });

        });
    }

    generateBillMMoneyPro(merchantNumber: string, value: number, transID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney

            const qr = {
                amount: value + "",
                merchantNumber, // '2055220199',
                transID,
            } as IMMoneyGenerateQRPro;
            // console.log("QR", qr);

            axios
                .post<IMMoneyGenerateQRRes>(
                    "https://qr.mmoney.la/pro/GenerateQR_v2",
                    qr,
                    { headers: { 'lmm-key': 'va157f35a50374ba3a07a5cfa1e7fd5d90e612fb50e3bca31661bf568dcaa5c17' } }
                )
                .then((rx) => {
                    console.log("generateBillMMoneyPro", rx.data);
                    if (rx.status) {
                        resolve(rx.data as IMMoneyGenerateQRRes);
                    } else {
                        reject(new Error(rx.statusText));
                    }
                })
                .catch((e) => {
                    reject(e);
                });

        });
    }

    generateBillLaoQRPro(value: number, channel: string, mechantId: string, ownerPhone: string) {
        return new Promise<ILaoQRGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney

            const qr = {
                "requestId": "",
                "merchantId": mechantId, //DBK :25ATP48M8RD1MKJ4W8FGLGXYC
                "txnAmount": value,
                // "billNumber": "LQR123213131280004925277",
                "terminalId": ownerPhone, //Device Number ເບີຄົນຮັບເງິນ
                "terminalLabel": "laabxserver", // Device Name
                "mobileNo": ownerPhone, // CashIn to Wallet Number (Merchant)  ເບີຄົນຮັບເງິນ
                "channel": `VENDING_` + channel, // Vending Machine 
                "owner": "LAABX", // Merchant Name  LAABX
                // "callbackurl": "https://tvending.khamvong.com"
                "callbackurl": process.env.SERVER_URL
            }
            // console.log("LAOQR", qr);

            axios
                .post<ILaoQRGenerateQRRes>(
                    "https://laabx-api.laoapps.com/api/v1/laab/genmmoneyqr_vending",
                    qr,
                    { headers: { 'Content-Type': 'application/json', timeout: 10000 } }
                )
                .then((rx) => {
                    console.log("generateBillLaoQRPro", rx.data);
                    if (rx.status) {
                        resolve(rx.data.data as ILaoQRGenerateQRRes);
                    } else {
                        reject(new Error(rx.statusText));
                    }
                })
                .catch((e) => {
                    reject(e);
                });

        });
    }


    registerCallbackLaoQR(callbackurl: string, owner: string, description: any) {
        return new Promise<ILaoQRGenerateQRRes>((resolve, reject) => {
            const url = 'https://laab-notify.laoapps.com/api/v1/callback/registerCB_Mmoney_vending';
            const qr = {
                "callbackurl": callbackurl,
                "owner": owner,
                "description": description
            }
            // console.log("DTA", qr);

            axios
                .post(
                    url,
                    qr,
                    { headers: { 'Content-Type': 'application/json' } }
                )
                .then((rx) => {
                    // console.log("registerCallbackLaoQR", rx.data);
                    if (rx.status) {
                        resolve(rx.data.data as ILaoQRGenerateQRRes);
                    } else {
                        reject(new Error(rx.statusText));
                    }
                })
                .catch((e) => {
                    reject(e);
                });

        });
    }

    generateBillMMoneyDemo(phonenumber: string, value: number, transactionID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney
            this.loginQRMmoney()
                .then((r) => {
                    if (r) {
                        const qr = {
                            amount: value + "",
                            phonenumber, // '2055220199',
                            transactionID,
                        } as IMMoneyGenerateQR;
                        // console.log("QR", qr);

                        axios
                            .post<IMMoneyGenerateQRRes>(
                                "https://qr.mmoney.la/test/generateQR",
                                qr,
                                { headers: { "mmoney-token": this.mMoneyLoginRes.token } }
                            )
                            .then((rx) => {
                                // console.log("generateBillMMoney", rx);
                                if (rx.status) {
                                    resolve(rx.data as IMMoneyGenerateQRRes);
                                } else {
                                    reject(new Error(rx.statusText));
                                }
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        reject(new Error(EMessage.loginfailed));
                    }
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });
        });
    }
    mMoneyLoginRes = {} as IMMoneyLogInRes;
    loginQRMmoney() {
        // mmoneyusername='41f7c324712b46f08a939c4609a1d2e1';
        // mmoneypassword='112233'
        const username = this.production ? this.qrmmoneyusername : "test";
        const password = this.production ? this.qrmmoneypassword : "12345";
        return new Promise<IMMoneyLogInRes>((resolve, reject) => {
            try {
                // if (this.mMoneyLoginRes.expiresIn) {
                // if (
                //     new Date(this.mMoneyLoginRes.expiresIn).getTime() >
                //     new Date().getTime()
                // ) {
                //     return resolve(this.mMoneyLoginRes);
                // }
                // }
                axios
                    .post("https://qr.mmoney.la/test/login", { username, password })
                    .then((r) => {
                        // console.log(r);
                        if (r.status) {
                            this.mMoneyLoginRes = r.data as IMMoneyLogInRes;
                            this.mMoneyLoginRes.expiresIn =
                                moment().add(
                                    moment
                                        .duration(
                                            "PT" + this.mMoneyLoginRes.expiresIn.toUpperCase()
                                        )
                                        .asMilliseconds(),
                                    "milliseconds"
                                ) + "";
                            resolve(this.mMoneyLoginRes);
                        } else {
                            reject(new Error(EMessage.loginfailed));
                        }
                    })
                    .catch((e) => {
                        reject(e);
                    });
            } catch (error) {
                console.log(error);
            }
        });
    }

    callBackConfirmMmoney(qr: string) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log('QR code', qr);

                // const ownerUuid = (await redisClient.get(transactionID + EMessage.BillCreatedTemp)) || ""; TODO LATER
                const ownerUuid = (await redisClient.get(qr + EMessage.BillCreatedTemp)) || "";
                // console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid && this.production) {
                    // throw new Error(EMessage.TransactionTimeOut);
                    return resolve(null);
                }
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                await ent.sync();
                const bill = await ent.findOne({
                    where: { qr },
                });


                if (!bill) {
                    // throw new Error(EMessage.billnotfound);
                    // await redisClient.del(qr + EMessage.BillCreatedTemp);
                    return resolve(null);

                }

                // console.log('=====>BILL IS :', bill);


                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = bill.transactionID + '';
                bill.changed("paymentref", true);
                bill.paymenttime = new Date();
                bill.changed("paymenttime", true);
                bill.paymentmethod = "mmoney";
                bill.changed("paymentmethod", true);

                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.waitingt;
                res.message = EMessage.waitingt;
                res.status = 1;

                // save report here

                // let yy = new Array<WebSocketServer.WebSocket>();
                // console.log('=====>bill.machineId', bill.machineId);

                this.getBillProcess(bill.machineId, async (b) => {
                    // console.log('=====>DATA Redis', b);

                    bill.vendingsales.forEach((v, i) => {
                        v.stock.image = "";
                        b.push({
                            ownerUuid,
                            position: v.position,
                            bill: bill.toJSON(),
                            transactionID: getNanoSecTime(),
                        });
                    });

                    await bill.save();
                    // console.log("=====>callBackConfirmMmoney", b);



                    this.setBillProces(bill.machineId, b);
                    res.data = b.filter((v) => v.ownerUuid == ownerUuid);
                    this.sendWSToMachine(bill?.machineId + "", res);

                });

                resolve(bill);

            } catch (error) {
                console.log('error callBackConfirmMmoney', error);
                return resolve(null);
            }
        });
    }


    // callBackConfirmLaoQR(transactionID: string) {
    //     return new Promise<IVendingMachineBill>(async (resolve, reject) => {
    //         try {
    //             console.log('TransactionID', transactionID);
    //             const ownerUuid = (await redisClient.get(transactionID + EMessage.BillCreatedTemp)) || "";
    //             console.log("GET transactionID by owner", ownerUuid);
    //             if (!ownerUuid && this.production) {
    //                 // throw new Error(EMessage.TransactionTimeOut);
    //                 console.log(EMessage.TransactionTimeOut);
    //                 resolve(null);
    //             }
    //             console.log('=====>ownerUuid', ownerUuid);

    //             const ent = VendingMachineBillFactory(
    //                 EEntity.vendingmachinebill + "_" + ownerUuid,
    //                 dbConnection
    //             );
    //             const bill = await ent.findOne({
    //                 where: { transactionID },
    //             });
    //             console.log('=====>BILL IS :', bill);

    //             // if (!bill) throw new Error(EMessage.billnotfound);
    //             if (!bill) {
    //                 resolve(null);
    //             }


    //             if (bill.paymentstatus != EPaymentStatus.pending) {
    //                 resolve(null);
    //             }


    //             bill.paymentstatus = EPaymentStatus.paid;
    //             bill.changed("paymentstatus", true);
    //             bill.paymentref = bill.transactionID + '';
    //             bill.changed("paymentref", true);
    //             bill.paymenttime = new Date();
    //             bill.changed("paymenttime", true);
    //             bill.paymentmethod = "LaoQR";
    //             bill.changed("paymentmethod", true);

    //             console.log('=====>machineId', bill.machineId);


    //             // save report here

    //             // let yy = new Array<WebSocketServer.WebSocket>();
    //             this.getBillProcess(bill.machineId, async (b) => {

    //                 bill.vendingsales.forEach((v, i) => {
    //                     v.stock.image = "";
    //                     b.push({
    //                         ownerUuid,
    //                         position: v.position,
    //                         bill: bill.toJSON(),
    //                         transactionID: getNanoSecTime(),
    //                     });
    //                 });

    //                 await bill.save();

    //                 console.log("*****callBackConfirmLaoQR", JSON.stringify(b));




    //                 ///WS
    //                 const res = {} as IResModel;
    //                 res.command = EMACHINE_COMMAND.waitingt;
    //                 res.message = EMessage.waitingt;
    //                 res.status = 1;
    //                 res.data = b.filter((v) => v.ownerUuid == ownerUuid);
    //                 this.setBillProces(bill.machineId, b);
    //                 await redisClient.del(transactionID + EMessage.BillCreatedTemp);


    //                 // console.log('*****BILL CONFIRMED RES', res.data);
    //                 // this.sendWSToMachine(bill?.machineId + "", res);
    //                 //////


    //                 resolve(bill);
    //             });

    //         } catch (error) {
    //             console.log(error);
    //             reject(error);
    //         }
    //     });
    // }
    callBackConfirmLaoQR(transactionID: string, bankname: string) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log('TransactionID', transactionID);
                const ownerUuid = (await redisClient.get(transactionID + EMessage.BillCreatedTemp)) || "";
                // console.log("GET transactionID by owner", ownerUuid);

                // Early exit if ownerUuid is not found in production mode
                if (!ownerUuid && this.production) {
                    console.log(EMessage.TransactionTimeOut);
                    return resolve(null); // Add return to stop execution
                }
                // console.log('=====>ownerUuid', ownerUuid);

                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                await ent.sync();
                const bill = await ent.findOne({
                    where: { transactionID },
                });
                // console.log('=====>BILL IS :', bill);

                // Early exit if bill is not found
                if (!bill) {
                    return resolve(null); // Add return to stop execution
                }

                // Early exit if payment status is not pending
                if (bill.paymentstatus !== EPaymentStatus.pending) {
                    return resolve(null); // Add return to stop execution
                }

                // bill.vendingsales.length;

                // Update bill properties
                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = bankname + '';
                bill.changed("paymentref", true);
                bill.paymenttime = new Date();
                bill.changed("paymenttime", true);
                bill.paymentmethod = "LaoQR";
                bill.changed("paymentmethod", true);

                // console.log('=====>machineId', bill.machineId);

                // Process bill and save
                this.getBillProcess(bill.machineId, async (b) => {
                    bill.vendingsales.forEach((v, i) => {
                        v.stock.image = "";
                        b.push({
                            ownerUuid,
                            position: v.position,
                            bill: bill.toJSON(),
                            transactionID: getNanoSecTime(),
                        });
                    });

                    await bill.save();
                    // console.log("*****callBackConfirmLaoQR", JSON.stringify(b));

                    // WebSocket response
                    const res = {} as IResModel;
                    res.command = EMACHINE_COMMAND.waitingt;
                    res.message = EMessage.waitingt;
                    res.status = 1;
                    res.data = b.filter((v) => v.ownerUuid === ownerUuid);
                    this.setBillProces(bill.machineId, b);
                    await redisClient.del(transactionID + EMessage.BillCreatedTemp);
                    let resule = (await redisClient.get(bill.machineId + EMessage.ListTransaction)) ?? '[]';
                    // let trandList: Array<any> = JSON.parse(resule);
                    // const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);

                    let trandList: Array<any> = [];
                    try {
                        const parsedData = JSON.parse(resule); // หรือ result ถ้าพิมพ์ผิด
                        if (!Array.isArray(parsedData)) {
                            console.warn('Parsed data is not an array, initializing trandList as empty array:', parsedData);
                            trandList = [];
                        } else {
                            trandList = parsedData;
                        }
                    } catch (error) {
                        console.error('JSON parse error:', error.message);
                        trandList = []; // กำหนดเป็นอาร์เรย์ว่างถ้า parse ล้มเหลว
                    }

                    // ใช้ filter หลังจากยืนยันว่า trandList เป็นอาร์เรย์
                    const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);
                    redisClient.setex(bill.machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(filteredData));

                    await DeleteTransactionToCheck(bill.machineId)
                    this.sendWSToMachine(bill?.machineId + "", res);


                    setImmediate(async () => {
                        try {
                            let resultPhone: any = {};

                            try {
                                const redisData = await redisClient.get(transactionID + EMessage.TransactionPhone);
                                if (redisData) {
                                    try {
                                        resultPhone = JSON.parse(redisData);
                                    } catch (jsonErr) {
                                        console.warn("Redis JSON parse error:", jsonErr);
                                        resultPhone = {};
                                    }
                                }
                            } catch (redisErr) {
                                console.warn("Redis unavailable:", redisErr);
                                resultPhone = {};
                            }

                            if (resultPhone?.phone) {
                                const phone = "+85620" + resultPhone.phone;
                                const body = {
                                    name: phone,
                                    phoneNumber: phone,
                                    username: phone,
                                    password: "1234567890", // อย่าใช้ plain number เป็น password ถ้าไม่จำเป็น
                                    googleToken: { phoneNumber: phone, otp: "111111" },
                                    orderBill: resultPhone?.orderBill ?? [],
                                    trandID: transactionID,
                                };

                                const url = "https://hangmistore-api.laoapps.com/api/v1/authUM/register4";

                                try {
                                    await axios.post(url, body, { timeout: 10000 }); // กัน server ช้า
                                } catch (apiErr) {
                                    console.error("API request failed:", apiErr.message);
                                }
                            }
                        } catch (errorTopUp) {
                            console.error("Unexpected error give topup:", errorTopUp);
                        }
                    });




                    const event: IVendingEventLog = {
                        machineId: bill?.machineId,
                        event: EVendingEvent.sold,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                        data: { data: bill, time: new Date() },//[{time, position, product, price,ip,data}
                        date: momenttz().tz(SERVER_TIME_ZONE).date(),
                        month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                        year: momenttz().tz(SERVER_TIME_ZONE).year()
                    };
                    await setVendingEvent(EVendingEvent.sold, event);
                    return resolve(bill); // Add return to stop callback execution
                });

            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }

    findCallBackConfirmLaoQR(machineId: string) {
        return new Promise<IResModel>(async (resolve, reject) => {
            try {
                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.confirm;
                res.message = EMessage.waitingt;
                res.status = 1;

                // setImmediate(async () => {
                try {
                    const resultList = await GetTransactionToCheck(machineId);
                    if (resultList?.status === 1) {
                        // console.log('Get transaction list:', resultList.message);
                        for (let index = 0; index < resultList.message.length; index++) {
                            const transactionID = resultList.message[index].transactionID;
                            // console.log('=====>transactionID', transactionID);
                            const responseCheck = await this.checkQRPaidMmoneyResponse(transactionID);
                            if (responseCheck?.status === 1) {
                                await DeleteTransactionToCheck(machineId);
                            } else {
                                console.log('=====>Error checking QR payment:', responseCheck.message, 'Transaction ID:', transactionID);
                            }
                        }
                    } else {
                        console.log('=====>Error fetching transactions:', resultList.message);
                    }
                } catch (error) {
                    console.log('=====>Error in findCallBackConfirmLaoQR:', error);
                }
                // });
                this.getBillProcess(machineId, async (b) => {

                    if (b.length == 0) {
                        // throw new Error(EMessage.billnotfound);
                        // console.log('bill not found');
                        let resule = (await redisClient.get(machineId + EMessage.ListTransaction)) ?? '[]';
                        // let trandList: Array<any> = JSON.parse(resule);
                        // if (trandList.length > 0) {
                        //     // res.message = EMessage.billnotfound;

                        //     const result = isMoreThan50SecondsAgo(trandList[0].createdAt, new Date().toISOString());

                        //     if (result) {
                        //         console.log('More than 50 seconds have passed.');
                        //         this.checkQRPaidMmoney(trandList[0].transactionID, machineId);
                        //     } else {
                        //         console.log('Less than or equal to 50 seconds.');

                        //     }
                        // }

                        let trandList: Array<any> = [];
                        try {
                            const parsedData = JSON.parse(resule); // หรือ result ถ้าพิมพ์ผิด
                            if (!Array.isArray(parsedData)) {
                                console.warn('Parsed data is not an array, initializing trandList as empty array:', parsedData);
                                trandList = [];
                            } else {
                                trandList = parsedData;
                            }
                        } catch (error) {
                            console.error('JSON parse error:', error.message);
                            trandList = [];
                        }

                        if (trandList.length > 0) {
                            const firstItem = trandList[0];
                            if (firstItem && firstItem.createdAt) {
                                const result = isMoreThan5SecondsAgo(firstItem.createdAt, new Date().toISOString());
                                if (result) {
                                    console.log('More than 50 seconds have passed.');
                                    this.checkQRPaidMmoney(firstItem.transactionID, machineId);
                                } else {
                                    console.log('Less than or equal to 50 seconds.');
                                }
                            } else {
                                console.warn('First item or createdAt is missing:', firstItem);
                                // res.message = EMessage.billnotfound; // ถ้าต้องการตั้งค่า message
                            }
                        } else {
                            console.warn('trandList is empty');
                            // res.message = EMessage.billnotfound; // ถ้าต้องการตั้งค่า message
                        }

                        return resolve(null);
                    }

                    let billPaid = [];
                    // let billNotPaid = [];


                    for (let index = 0; index < b.length; index++) {
                        const element = b[index];
                        // console.log('*****element', element);
                        if (element.bill.paymentstatus == EPaymentStatus.paid) {
                            billPaid.push(element);
                        } else {
                            // billNotPaid.push(element);
                        }
                    }

                    // this.setBillProces(machineId, billNotPaid);

                    // console.log('*****billPaid', billPaid);
                    // console.log('*****billNotPaid', billNotPaid);

                    res.data = billPaid

                    if (billPaid.length == 0) {
                        let resule = (await redisClient.get(machineId + EMessage.ListTransaction)) ?? '[]';
                        // let trandList: Array<any> = JSON.parse(resule);
                        // if (trandList.length > 0) {
                        //     // res.message = EMessage.billnotfound;

                        //     const result = isMoreThan50SecondsAgo(trandList[0].createdAt, new Date().toISOString());

                        //     if (result) {
                        //         this.checkQRPaidMmoney(trandList[0].transactionID, machineId);
                        //         console.log('More than 50 seconds have passed.');
                        //     } else {
                        //         console.log('Less than or equal to 50 seconds.');
                        //     }
                        // }

                        let trandList: Array<any> = [];
                        try {
                            const parsedData = JSON.parse(resule); // หรือ result ถ้าพิมพ์ผิด
                            if (!Array.isArray(parsedData)) {
                                console.warn('Parsed data is not an array, initializing trandList as empty array:', parsedData);
                                trandList = [];
                            } else {
                                trandList = parsedData;
                            }
                        } catch (error) {
                            console.error('JSON parse error:', error.message);
                            trandList = [];
                        }

                        if (trandList.length > 0) {
                            const firstItem = trandList[0];
                            if (firstItem && firstItem.createdAt) {
                                const result = isMoreThan5SecondsAgo(firstItem.createdAt, new Date().toISOString());
                                if (result) {
                                    this.checkQRPaidMmoney(firstItem.transactionID, machineId);
                                    console.log('More than 50 seconds have passed.');
                                } else {
                                    console.log('Less than or equal to 50 seconds.');
                                }
                            } else {
                                console.warn('First item or createdAt is missing:', firstItem);
                                // res.message = EMessage.billnotfound;
                            }
                        } else {
                            console.warn('trandList is empty');
                            // res.message = EMessage.billnotfound;
                        }

                    }

                    ///
                    // 1. paid  , dont driect check
                    // 2. not paid, check in redis
                    // 2.1 if time of redis > 50s
                    // 2.2 if transaction paid delete from redis 
                    // 2.3 if transaction paid in redis and confirmed in redis like callback

                    ////

                    resolve(res);
                    // this.setBillProces(bill.machineId, filteredB);
                });


            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }



    refillMMoney(msisdn: string, transID: string, amount: number, description: any, remark1 = '', remark2 = '', remark3 = '', remark4 = '') {

        // const transID = machineId + (new Date().getTime());
        return new Promise<any>((resolve, reject) => {
            try {
                // const mySum = this.checkSum(msisdn, amount, description, remark1, remark2, remark3, remark4);
                // if (moment(this.mmMoneyLogin?.expiry).isBefore(moment()) || !this.mmMoneyLogin) {
                this.loginCashInMmoney().then(re => {
                    // this.loginTokenList.push({ m: r, t: transID });
                    // console.log('DATA mmMoneyLogin', re);

                    this.processRefillMmoney(msisdn, transID, amount, description, re.accessToken).then(r => {
                        // console.log('DATA processRefillMmoney', r);
                        resolve(r)
                    }).catch(e => {
                        console.log('ERROR processRefillMmoney');
                        reject(e)
                    });
                }).catch(e => {
                    console.log('ERROR loginMmoney', e);
                    reject(e)
                })
                // } else {
                //     this.processRefillMmoney(msisdn, transID, amount, description).then(r => {
                //         console.log('DATA processRefillMmoney', r);
                //         resolve(r)
                //     }).catch(e => {
                //         console.log('ERROR processRefillMmoney', e);
                //         reject(e)
                //     });
                // }
            } catch (error) {
                console.log('ERROR refillMMoney', error);
                reject(error)
            }

        })

    }


    checkQRPaidMmoneyResponse(transactionID: string): Promise<{ status: number, message: any }> {
        return new Promise<{ status: number, message: any }>(async (resolve, reject) => {

            try {
                const agent = new https.Agent({
                    rejectUnauthorized: false,
                });

                const API_BASE_URL = 'https://gateway.ltcdev.la/PartnerGenerateQR/checkTransactionByBillV3';

                const authUsername = 'lmm'
                const authPassword = 'Lmm@2024qaz2wsx'

                const authToken = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');

                const headers = {
                    "Authorization": `Basic ${authToken}`,
                    "username": 'Vendeex',
                    "password": 'vendeex@2025qaz2wsx',
                    "apikey": 'eb718666-b20e-4091-b964-67a61e06fffe',
                    "Content-Type": 'application/json'
                }

                const res = await axios.post(API_BASE_URL, {
                    requestId: transactionID,
                    billNumber: transactionID
                },
                    { headers, httpsAgent: agent, timeout: 10000 });

                if (res.data.success) {
                    axios.post(process.env.SERVER_URL, {
                        "command": "confirmLAOQR",
                        "data": {
                            "trandID": transactionID,
                            "bankname": res.data.data?.bankname ?? ''
                        }
                    }, {
                        headers: {
                            "Content-Type": 'application/json', timeout: 10000
                        }
                    }).then(async r => {
                        // console.log('=====>CONFIRM PAID', r.data);

                        return resolve({ status: 1, message: r.data });
                    }).catch(e => {
                        console.log('=====>CONFIRM ERROR', e);
                        return resolve({ status: 0, message: e });
                    })
                } else {
                    // console.log('=====> CHECK MMONEY NOT PAID', res.data);
                    return resolve({ status: 0, message: EMessage.LaoQRNotPaid });
                }
            } catch (error) {
                console.log('=====> CHECK MMONEY PAID ERROR', error);
                return resolve({ status: 0, message: error });
            }
        });
    }


    checkQRPaidMmoney(transactionID: string, machineId: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            // console.log('=====> CHECK MMONEY PAID', transactionID);

            const agent = new https.Agent({
                rejectUnauthorized: false,
            });

            const API_BASE_URL = 'https://gateway.ltcdev.la/PartnerGenerateQR/checkTransactionByBillV3';

            const authUsername = 'lmm'
            const authPassword = 'Lmm@2024qaz2wsx'

            const authToken = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');

            const headers = {
                "Authorization": `Basic ${authToken}`,
                "username": 'Vendeex',
                "password": 'vendeex@2025qaz2wsx',
                "apikey": 'eb718666-b20e-4091-b964-67a61e06fffe',
                "Content-Type": 'application/json'
            }

            const res = await axios.post(API_BASE_URL, {
                requestId: transactionID,
                billNumber: transactionID
            },
                { headers, httpsAgent: agent });

            // console.log('=====> CHECK MMONEY PAID', res.data);
            if (res.data.success) {
                // console.log('=====> CHECK MMONEY PAID', res.data);
                axios.post(process.env.SERVER_URL, {
                    "command": "confirmLAOQR",
                    "data": {
                        "trandID": transactionID,
                        "bankname": res.data.data?.bankname ?? ''
                    }
                }, {
                    headers: {
                        "Content-Type": 'application/json', timeout: 10000
                    }
                }).then(async r => {
                    // console.log('=====>CONFIRM', r.data);
                    let resule = (await redisClient.get(machineId + EMessage.ListTransaction)) ?? '[]';
                    // let trandList: Array<any> = JSON.parse(resule);
                    // const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);

                    let trandList: Array<any> = [];
                    try {
                        const parsedData = JSON.parse(resule); // หรือ result ถ้าพิมพ์ผิด
                        if (!Array.isArray(parsedData)) {
                            console.warn('Parsed data is not an array, initializing trandList as empty array:', parsedData);
                            trandList = [];
                        } else {
                            trandList = parsedData;
                        }
                    } catch (error) {
                        console.error('JSON parse error:', error.message);
                        trandList = [];
                    }

                    const filteredData = trandList.filter((item: any) => item.transactionID !== transactionID);
                    redisClient.setex(machineId + EMessage.ListTransaction, 60 * 5, JSON.stringify(filteredData));
                }).catch(e => {
                    console.log('=====>CONFIRM ERROR', e);
                })
            } else {
                // console.log('=====> CHECK MMONEY NOT PAID', res.data);
            }
            resolve(null);
        });
    }

    processRefillMmoney(msisdn: string, transID: string, value: number, remark: string, accessToken) {
        return new Promise<any>((resolve, reject) => {
            this.requestMmoneyCashin(msisdn, transID, value, accessToken, remark).then(r => {
                // console.log('DATA requestMmoneyCashin', r);
                // {
                //     "22162": "73494",
                //     "transData": [
                //         {
                //             "transCashInID": "20221018110924835233",
                //             "transStatus": "R",
                //             "accountNo": "XXXXXX6226",
                //             "accountNameEN": "Sengkham Latthamone",
                //             "accountRef": "2054656226",
                //             "accountType": "TC WALLET",
                //             "transExpiry": "2022-10-18 11:14:24.835"
                //         }
                //     ],
                //     "responseCode": "0000",
                //     "responseMessage": "Operation success",
                //     "responseStatus": "SUCCESS",
                //     "transID": "202210141402042100639",
                //     "processTime": 23,
                //     "serverDatetime": "2022-10-18 11:09:24",
                //     "serverDatetimeMs": 1666066164838
                // }
                const x = r.transData[0];
                this.confirmMmoneyCashin(value, r.transID, x.transCashInID, accessToken, remark).then(rx => {
                    // console.log('Succeeded confirmMmoneyCashin', rx);
                    resolve(rx)
                }).catch(e => {
                    console.log('ERROR confirm Mmoney Cashin', e);
                    reject(e);
                })
            }).catch(e => {
                console.log('ERROR requestMmoneyCashin', e);
                reject(e);
            })
        });
    }
    confirmMmoneyCashin(value, transID, transCashInID, accessToken: string, remark = 'Test Cash In') {
        const url = this.production ? this.pathMMoneyConfirm : 'http://115.84.121.101:31153/ewallet-ltc-api/cash-management/confirm-cash-in.service';
        return new Promise<any>((resolve, reject) => {
            const data = {
                apiKey: "efca1d20e1bdfc07b249e502f007fe0c",
                apiToken: accessToken, //this.loginTokenList.find(v => v.t == Number(transID + ''))?.m?.accessToken,
                transID,
                requestorID: this.production ? this.CashInMMoneyRequesterId : 69,
                transCashInID
            }

            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json', timeout: 10000
                }
            }).then(r => {
                // console.log('DATA confirmMmoneyCashin', r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR confirmMmoneyCashin', e);
                reject(e);
            })

        })

    }
    loginCashInMmoney() {
        const url = this.production ? this.pathMMoneyLogin : 'http://115.84.121.101:31153/ewallet-ltc-api/oauth/token.service';
        return new Promise<IMMoneyLoginCashin>((resolve, reject) => {
            // const data={
            //     username:'Dokbuakham',
            //     password:'Ko8-En6;',
            //     grant_type:'client_credentials'
            // }
            const params = new URLSearchParams();
            params.append('username', this.production ? this.CashInMMoneMMoneyUsername : 'Dokbuakham');
            params.append('password', this.production ? this.CashInMMoneMMoneyPassword : 'Ko8-En6;');
            params.append('grant_type', 'client_credentials');
            // console.log('PARAM LOGIN', url, params);

            axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded', timeout: 10000
                }
            }).then(r => {
                // console.log('DATA loginMmoney', url, r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR', e);
                reject(e);
            })
        })

    }
    checkSum(toMsisdn, amount, description, remark1, remark2, remark3, remark4) {
        //const hash = crypto.createHash('sha256').update(pwd).digest('base64');
        //const input_str = `REF,2055220199,150000,LAK,ໝາເຫດ,ເລກອ້າງອິງ01,ເລກອ້າງອິງ02,ເລກອ້າງອິງ03,ເລກອ້າງອິງ04,ltc`;


        const input_str = `REF,${toMsisdn},${amount},LAK,${description},${remark1},${remark2},${remark3},${remark4},ltc`;

        //const input_str = "REF,2055220199,1000,LAK,,,,,,ltc";
        const hash = crypto.createHash("sha256").update(input_str).digest("base64");

        return hash;
    }
    requestMmoneyCashin(msisdn: string, transID, value, accessToken: string, remark = this.production ? this.CashInMMoneMMoneyName : 'Test Dorkbouakham Cash-In') {
        const url = this.production ? this.pathMMoneyRequest : 'http://115.84.121.101:31153/ewallet-ltc-api/cash-management/request-cash-in.service';
        return new Promise<IMMoneyRequestRes>((resolve, reject) => {
            let data = {
                apiKey: "b7b7ef0830ff278262c72e57bc43d11f",
                apiToken: accessToken,
                transID,
                requestorID: this.production ? this.CashInMMoneyRequesterId : 69,
                toAccountOption: "REF",
                toAccountRef: msisdn,
                transAmount: value,
                transCurrency: "LAK",
                transRemark: remark,
                transRefCol1: "",
                transRefCol2: "",
                transRefCol3: "",
                transRefCol4: "",
                transCheckSum: ""
            }

            data.transCheckSum = this.checkSum(data.toAccountRef, value, data.transRemark, data.transRefCol1, data.transRefCol2, data.transRefCol3, data.transRefCol4);
            // console.log('IMMoneyRequestRes', data);
            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json', timeout: 10000
                }
            }).then(r => {
                // console.log('DATA requestMmoneyCashin', r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR requestMmoneyCashin', e);
                reject(e);
            })

        });

    }

    callBackConfirmLAAB(qr: string) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                // console.log('QR Code confirm', qr);

                const ownerUuid = (await redisClient.get(qr + EMessage.BillCreatedTemp)) || "";
                // console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid) throw new Error(EMessage.TransactionTimeOut);
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                await ent.sync();
                const bill = await ent.findOne({
                    where: { qr: qr },
                });

                if (!bill) throw new Error(EMessage.billnotfound);
                await redisClient.del(qr + EMessage.BillCreatedTemp);

                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = bill.transactionID + '';
                bill.changed("paymentref", true);
                bill.paymenttime = new Date();
                bill.changed("paymenttime", true);

                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.waitingt;
                res.message = EMessage.waitingt;
                res.status = 1;

                // let yy = new Array<WebSocketServer.WebSocket>();
                this.getBillProcess(bill?.machineId, async (b) => {
                    bill.vendingsales.forEach((v, i) => {
                        v.stock.image = "";
                        b.push({
                            ownerUuid,
                            position: v.position,
                            bill: bill.toJSON(),
                            transactionID: getNanoSecTime(),
                        });
                    });

                    await bill.save();
                    // console.log("callBackConfirmLAAB", b);
                    // console.log(
                    //     `bill?.machineId`,
                    //     bill?.machineId,
                    //     `owneruuid`,
                    //     ownerUuid
                    // );

                    // console.log(`s`);

                    this.setBillProces(bill?.machineId, b);
                    res.data = b.filter((v) => v.ownerUuid == ownerUuid);
                    this.sendWSToMachine(bill?.machineId + "", res);

                    resolve(bill);
                });
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }


    checkMachineId(machineId: string): IMachineClientID | null {
        return this.machineIds.find((v) => {
            if (v.machineId == machineId) {
                return v;
            }
        });

    }
    INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    checkWebSocketInactivity(ws: WebSocket) {
        return new Promise<boolean>((resolve, reject) => {
            const lastActivity = ws['lastAction'] ?? Date.now(); // Use nullish coalescing for clarity
            if (Date.now() - lastActivity > this.INACTIVITY_TIMEOUT_MS) {
                try {
                    ws.close(1000, 'No activity for 10 minutes');
                    console.log('WebSocket closed due to inactivity for 10 minutes');
                    resolve(true);
                } catch (error) {
                    console.error('Error closing WebSocket:', error);
                    resolve(true);
                }
            } else {
                resolve(false);
            }
        });

    }
    confirmDrop(machineId: string, transactionID: string, position: number) {
        return new Promise<IResModel>(async (resolve, reject) => {
            try {
                // implement later

                const event: IVendingEventLog = {
                    machineId: machineId,
                    event: EVendingEvent.dropConfirm,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                    data: { data: { transactionID, position }, time: new Date() },//[{time, position, product, price,ip,data}
                    date: momenttz().tz(SERVER_TIME_ZONE).date(),
                    month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                    year: momenttz().tz(SERVER_TIME_ZONE).year()
                };
                await setVendingEvent(EVendingEvent.dropConfirm, event);
            }
            catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }
    saveMachineSale(machineId: string, data: any) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const machine = this.checkMachineId(machineId);
                const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machine.machineId, dbConnection);
                await sEnt.sync();

                // sign

                const run = await sEnt.findOne({ order: [['id', 'desc']] });
                // console.log(`run der`, run);

                const calculate = laabHashService.CalculateHash(JSON.stringify(data));
                // console.log(`calculate der`, calculate);
                const sign = laabHashService.Sign(calculate, IFranchiseStockSignature.privatekey);
                // console.log(`sign der`, sign);
                // console.log(`d data der`, d.data);
                const list = new Array<IVendingMachineSale>();
                list.push(...data);
                list.forEach(v => v.machineId = machine.machineId);
                if (run == null) {

                    sEnt.create({
                        data: list,
                        hashM: sign,
                        hashP: 'null'
                    }).then(r => {
                        console.log(`save sales success`);
                    }).catch(error => console.log(`save stock fail`));

                } else {

                    sEnt.create({
                        data: list,
                        hashM: sign,
                        hashP: run.hashM
                    }).then(r => {
                        // console.log(`save stock successxxx`);
                    }).catch(error => console.log(`save stock fail`));

                }
                const event: IVendingEventLog = {
                    machineId: machineId,
                    event: EVendingEvent.updating_stock,// selling, sold, updating_stock, total_sale_today, machine_offline, no_sale , machine_is_online now, retry_delivery, restart, refresh
                    data: { data: list, time: new Date() },//[{time, position, product, price,ip,data}
                    date: momenttz().tz(SERVER_TIME_ZONE).date(),
                    month: momenttz().tz(SERVER_TIME_ZONE).month() + 1,
                    year: momenttz().tz(SERVER_TIME_ZONE).year()
                };
                await setVendingEvent(EVendingEvent.updating_stock, event);
            } catch (error) {
                console.log(`save stock error`, error);
            }
            resolve()
        });
    }

    initWs(wss: WebSocketServer.Server) {
        try {
            setWsHeartbeat(
                wss,
                (ws, data, binary) => {
                    // console.log("WS HEART BEAT", data);

                    if (data === '{"command":"ping"}') {


                    }
                },
                15000
            );

            wss.on("connection", (ws: WebSocket) => {


                ws.onopen = (ev: Event) => {
                };
                ws.onclose = (ev: CloseEvent) => {
                    this.wsClient = this.wsClient.filter((v) => v !== ws); // Remove from array
                    console.log('WebSocket closed:', ev.reason);
                };
                ws.onerror = (ev: Event) => {
                    console.log(" WS error", ev);
                    ws.close(); // Close on error
                };

                //connection is up, let's add a simple simple event
                ws.onmessage = async (ev: MessageEvent) => {
                    ws['isAlive'] = true;
                    let d: IReqModel = {} as IReqModel;
                    ws['isAlive'] = true;
                    ws['lastMessage'] = Date.now();
                    //login first
                    // add to wsClient only after login

                    try {
                        // const inactivityChecked = await this.checkWebSocketInactivity(ws);
                        // if (inactivityChecked) {
                        //      ws?.send(
                        //             JSON.stringify(
                        //                 PrintSucceeded(
                        //                     "ping",
                        //                     {
                        //                         command: "ping",
                        //                         production: this.production,
                        //                         setting: { refresh: true }
                        //                     },
                        //                     EMessage.succeeded,
                        //                     null
                        //                 )
                        //             )
                        //         );
                        //     return ws?.close(1000, 'No activity for 10 minutes');
                        // };
                        // console.log(" WS comming", ev.data.toString());

                        d = JSON.parse(ev.data.toString()) as IReqModel;

                        const res = {} as IResModel;
                        // if (d.command == EMACHINE_COMMAND.login) {
                        //     res.command = d.command;
                        //     res.message = EMessage.loginok;
                        //     res.status = 1;
                        //     if (d.token) {
                        //         const x = d.token as string;
                        //         console.log(
                        //             " WS online machine",
                        //             this.listOnlineMachines()
                        //         );
                        //         let machineId = this.findMachineIdToken(x);

                        //         if (!machineId) throw new Error("machine is not exit");
                        //         ws["machineId"] = machineId.machineId;
                        //         ws["clientId"] = uuid4();
                        //         res.data = { clientId: ws["clientId"] };
                        //         this.wsClient.push(ws);
                        //         return ws.send(
                        //             JSON.stringify(
                        //                 PrintSucceeded(d.command, res, EMessage.succeeded, null)
                        //             )
                        //         );
                        //     } else throw new Error(EMessage.MachineIdNotFound);
                        // }

                        if (d.command == EMACHINE_COMMAND.login) {
                            res.command = d.command;
                            res.message = EMessage.loginok;
                            res.status = 1;
                            if (d.token) {
                                const x = d.token as string;
                                // console.log(
                                //     " WS online machine",
                                //     this.listOnlineMachines()
                                // );
                                let machineId = this.findMachineIdToken(x);

                                if (!machineId) throw new Error("machine is not exist");
                                this.wsClient?.forEach((v, i) => {
                                    if (v) {
                                        if (v["machineId"] == machineId?.machineId) {
                                            v?.close(1000, 'Duplicate connection');
                                            console.log(`Closed duplicate connection for machineId: ${machineId?.machineId}`);
                                            return true;
                                        }
                                    }
                                });
                                ws["machineId"] = machineId?.machineId;
                                ws["clientId"] = uuid4();
                                res.data = { clientId: ws["clientId"] };

                                this.wsClient.push(ws);
                                console.log(`Machine connected: ${machineId?.machineId}`);
                                return ws.send(
                                    JSON.stringify(
                                        PrintSucceeded(d.command, res, EMessage.succeeded, null)
                                    )
                                );
                            } else throw new Error(EMessage.MachineIdNotFound);
                        }
                        else if (d.command == 'adminlogin') {
                            res.command = d.command;
                            res.message = EMessage.adminloginok;
                            res.status = 1;
                            const token = d.token as string;
                            // console.log('ws[myMachineId]', ws['myMachineId']);

                            redisClient.get('_admintoken_' + token).then(r => {
                                // console.log('admintoken', r);

                                if (r) {
                                    ws['ownerUuid'] = r;
                                    this.machineClientlist
                                        .findAll({ where: { ownerUuid: r } })
                                        .then((ry) => {
                                            if (ry) {
                                                const m = ry.map(v => v.machineId);
                                                // console.log('admintoken owneruuid machines', m);
                                                ws['myMachineId'] = m;
                                                ws["clientId"] = uuid4();
                                                this.wsClient.push(ws);
                                                ws.send(
                                                    JSON.stringify(
                                                        PrintSucceeded(d.command, res, EMessage.succeeded, null)
                                                    ));
                                            }
                                            else ws.close(1000);
                                        })
                                        .catch((e) => {
                                            console.log("Error list machine adminlogin", e);
                                            ws.close(1000);
                                        });
                                }
                                else {
                                    findRealDB(token)
                                        .then((rx) => {
                                            try {
                                                const ownerUuid = rx;
                                                // console.log('admintoken owneruuid', rx);
                                                if (!ownerUuid) throw new Error(EMessage.notfound);
                                                ws['ownerUuid'] = ownerUuid;
                                                this.machineClientlist
                                                    .findAll({ where: { ownerUuid } })
                                                    .then((ry) => {
                                                        if (ry) {
                                                            const m = ry.map(v => v.machineId);
                                                            // console.log('admintoken owneruuid machines', m);
                                                            redisClient.setex('_admintoken_' + token, 60 * 60 * 24, ownerUuid);
                                                            ws['myMachineId'] = m;
                                                            ws["clientId"] = uuid4();
                                                            this.wsClient.push(ws);
                                                            ws.send(
                                                                JSON.stringify(
                                                                    PrintSucceeded(d.command, res, EMessage.succeeded, null)
                                                                ));
                                                        }
                                                        else ws.close(1000);
                                                    })
                                                    .catch((e) => {
                                                        console.log("Error list machine adminlogin2", e);
                                                        ws.close(1000);
                                                    });
                                            } catch (error) {
                                                console.log(error);
                                                ws.close(1000)
                                            }

                                        })
                                        .catch((e) => {
                                            console.log(e);
                                            ws.close(1000);
                                        });
                                }

                            }).catch(e => {
                                console.log(e);
                                ws.close();
                            })

                            return;
                        }
                        else if (d.command == "ping") {
                            try {

                                let settingVersion = d?.data?.settingVersion;
                                let adsVersion = d?.data?.adsVersion;
                                let clientVersion = d?.data?.clientVersion;
                                // data 
                                let data = d?.data?.data ?? [];
                                const type = d['type'] ?? '';
                                if (type === 'errorLog' && data && data.length > 0) {

                                } else if (type === 'TempLog' && data && data.length > 0) {

                                }
                                else if (type === 'ConfirmDrop' && data && data.length > 0) {
                                    const dropPositionData = data.dropPositionData as IDropPositionData;
                                    await this.confirmDrop(ws['machineId'], dropPositionData?.transactionID, dropPositionData?.position);

                                }
                                else if (type === 'SaveSaleAndDrop' && data && data.length > 0) {
                                    const dropPositionData = data.dropPositionData as IDropPositionData;
                                    const saveSalve = data as Array<IVendingMachineSale>;
                                    await this.saveMachineSale(ws['machineId'], saveSalve);
                                    await this.confirmDrop(ws['machineId'], dropPositionData?.transactionID, dropPositionData?.position);

                                }
                                else if (type === 'SaveSale' && data && data.length > 0) {
                                    const dropPositionData = data.dropPositionData as IDropPositionData;
                                    const saveSalve = data as Array<IVendingMachineSale>;
                                    await this.saveMachineSale(ws['machineId'], saveSalve);

                                }

                                ///
                                console.log(`----->MachineId :${ws['machineId']} clientVersion`, clientVersion);


                                // console.log('=====>pingData', d.data);

                                // console.log('=====>adsVersion', adsVersion, 'settingVersion', settingVersion);

                                const serverAdsVersion = await readMachineAdsVersion(ws['machineId']);
                                const serverSettingVersion = await readMachineSettingVersion(ws['machineId']);
                                const adsSetting = adsVersion != serverAdsVersion ? await readMachineAds(ws['machineId']) : null;

                                // console.log("WS PING", ws['clientId'], ws['myMachineId']);
                                readMachineBalance(ws['machineId']).then(async r => {
                                    // console.log('machine balance', r);

                                    let x = await readMachineSetting(ws['machineId']);
                                    let mstatus = (await readMachineStatus(ws['machineId']))?.b;

                                    // console.log('clientid  setting', ws['machineId'], x);
                                    // console.log('clientid  status', ws['machineId'], mstatus);
                                    const mArray = ws['myMachineId'] ? ws['myMachineId'] as Array<string> : [] as Array<string>;

                                    const errorLog = d?.data?.errorLog ?? [];
                                    if (errorLog.length > 0) {
                                        // console.log('=====>errorLog', ws['machineId'], '==', errorLog);
                                        try {
                                            ClientlogEntity.create({ machineId: ws['machineId'], errorLog: errorLog }).then(r => {
                                            }).catch(e => {
                                            });

                                        } catch (error) {

                                        }

                                    }

                                    // console.log('myMachineId', mArray);
                                    let mymstatus = [];
                                    let mymsetting = [];
                                    let mymlimiterbalance = '0';
                                    let mymmachinebalance = [];
                                    let mymlimiter = [];
                                    let setting = {} as any;
                                    try {
                                        let y = [];
                                        if (!x) { setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }, setting.imei = '' }
                                        else {
                                            y = JSON.parse(x) as Array<any>;
                                            setting = y.find(v => v.settingName == 'setting');
                                        }

                                        mymlimiterbalance = (await readMerchantLimiterBalance(ws['ownerUuid'])) || '0';

                                        if (mArray.length) {
                                            for (let index = 0; index < mArray?.length; index++) {
                                                const element = mArray[index];
                                                let st = await readMachineStatus(element);
                                                if (!st) {
                                                    st = { b: {} } as any;
                                                }
                                                if (!st.b) {
                                                    st.b = {};
                                                }
                                                if (ws['machineId'] === element + '') {
                                                    if (mstatus) {
                                                        mstatus.lastUpdate = new Date();
                                                        st.b = mstatus;
                                                    }
                                                    else {
                                                        st.b.lastUpdate = new Date();
                                                    }
                                                    writeMachineStatus(ws['machineId'], st.b);
                                                }



                                                mymstatus.push({ machineId: element, mstatus: st.b });

                                                const msetting = JSON.parse(await readMachineSetting(element))?.find(v => v.settingName == 'setting');
                                                mymsetting.push({ msetting, machineId: element });


                                                const mb = JSON.parse((await readMachineBalance(element)) || '0');
                                                mymmachinebalance.push({ machineId: element, balance: mb });

                                                // const ml = JSON.parse((await readMachineLimiter(element)) || '100000');
                                                mymlimiter.push({ machineId: element, limiter: setting.limiter });
                                            }
                                        } else {
                                            let st = await readMachineStatus(ws['machineId']);
                                            if (!st) {
                                                st = { b: {} } as any;
                                            }
                                            if (!st.b) {
                                                st.b = {};
                                            }
                                            if (mstatus) {
                                                mstatus.lastUpdate = new Date();
                                                st.b = mstatus;
                                            }
                                            else {
                                                st.b.lastUpdate = new Date();
                                            }
                                            writeMachineStatus(ws['machineId'], st.b);
                                        }

                                        // console.log('clientid  my machinestatus', mymstatus, mymsetting, mymlimiterbalance);
                                    } catch (error) {
                                        console.log('parsing error setting', error);
                                        setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = { start: 3, end: 2 }; setting.limiter = 100000; setting.imei = '';
                                    }
                                    console.log('ready to pong');
                                    const limiter = setting.limiter; // TODO: Get limiter 
                                    const merchant = 0; // TODO:Get merchant balance


                                    ////**** CHECK BALANCE OF THIS VENDING MACHINE AND COMPARE TO LIMITER */

                                    // setting.allowCashIn = machineId.balance<setting.limiter;
                                    //// TODO: LATER WITH LAABX
                                    ///////////

                                    // control version
                                    let app_version = {} as any;
                                    const machine: string = ws['machineId'];
                                    let versionInfo: any = await redisClient.get(`${machine}_version`);
                                    if (versionInfo != null) {
                                        versionInfo = JSON.parse(versionInfo);
                                        app_version = {
                                            url: versionInfo.url,
                                            version: versionInfo.version,
                                            versionText: versionInfo.versionText,
                                            uuid: versionInfo.uuid
                                        }
                                    }

                                    // fixedhere
                                    const a = await readMachinePendingStock(ws['machineId'] + '');
                                    let ax = JSON.parse(a) as Array<any>;
                                    if (!ax || !Array.isArray(ax)) ax = [];
                                    const pendingStock = ax.map(v => { return { transactionID: v?.transactionID, position: v?.position } });

                                    /// FOR ADMIN 
                                    if (await readAminControl()) {
                                        setting.allowVending = false;
                                        setting.allowCashIn = false;
                                    }
                                    // 


                                    // console.log('FIND SETTING FOR REFRESH COMMAND', setting);

                                    setting.clientVersion = clientVersion;
                                    if (settingVersion === serverSettingVersion) {
                                        setting = null;
                                    }


                                    settingVersion = serverSettingVersion;
                                    adsVersion = serverAdsVersion;

                                    ws.send(
                                        JSON.stringify(
                                            PrintSucceeded(
                                                "ping",
                                                {
                                                    command: "ping",
                                                    production: this.production, // no versioning
                                                    balance: r,// no versioning
                                                    limiter,// no versioning
                                                    merchant,// no versioning
                                                    mymmachinebalance,// no versioning
                                                    mymlimiterbalance,// no versioning
                                                    setting,
                                                    mstatus,// no versioning
                                                    mymstatus,// no versioning
                                                    mymsetting,// no versioning
                                                    mymlimiter,// no versioning
                                                    app_version,// no versioning
                                                    pendingStock,// no versioning

                                                    adsSetting,
                                                    adsVersion,
                                                    settingVersion,
                                                    secret: await this.readMachineSecret(machine + '')

                                                },
                                                EMessage.succeeded
                                                ,
                                                null
                                            )
                                        )
                                    );
                                });
                                return;
                            } catch (error) {
                                console.log((error));

                            }


                        }
                        console.log("WS CLOSE");
                        ws.close();
                    } catch (error: any) {
                        console.log(" WS error", error);
                        ws.send(JSON.stringify(PrintError(d.command, [], error.message, null)));
                    }
                };
            });
        } catch (error) {
            console.log(error);
        }
    }

    generateTimeBasedSecret(inputString: string, intervalSeconds = 300, offset = 0) {
        const timestamp = Math.floor(Date.now() / 1000);
        const timeSlot = Math.floor(timestamp / intervalSeconds) - offset;
        const hmac = crypto.createHmac('sha256', inputString);
        hmac.update(timeSlot.toString());
        const secret = hmac.digest('hex');
        return {
            secret,
            expiresAt: (timeSlot + 1) * intervalSeconds * 1000
        };
    }

    // ADMIN_SECRET_KEY = '';

    generateTimeBasedSecretComplex({
        inputString = '',
        intervalSeconds = 300,
        offset = 0,
        hashAlgorithm = 'sha256',
        saltLength = 16,
        includeMetadata = true,
        pbkdf2Iterations = 10000,
        entropyBytes = 32
    } = {}) {
        // Input validation
        if (!inputString || typeof inputString !== 'string') {
            throw new Error('inputString must be a non-empty string');
        }
        if (!Number.isInteger(intervalSeconds) || intervalSeconds <= 0) {
            throw new Error('intervalSeconds must be a positive integer');
        }
        if (!['sha256', 'sha512', 'sha1'].includes(hashAlgorithm)) {
            throw new Error('hashAlgorithm must be sha256, sha512, or sha1');
        }
        if (!Number.isInteger(pbkdf2Iterations) || pbkdf2Iterations < 1000) {
            throw new Error('pbkdf2Iterations must be an integer >= 1000');
        }
        if (!Number.isInteger(entropyBytes) || entropyBytes < 16) {
            throw new Error('entropyBytes must be an integer >= 16');
        }

        // Generate entropy sources
        const salt = crypto.randomBytes(saltLength).toString('hex');
        const nonce = uuid4(); // Generate a unique nonce
        const entropySeed = crypto.randomBytes(entropyBytes).toString('hex');
        const counter = crypto.randomInt(0, 1000000).toString(); // Additional random counter

        // Calculate time slot with random perturbation (small, within 1 second)
        const timestamp = Math.floor(Date.now() / 1000);
        const perturbation = crypto.randomInt(0, 1000) / 1000; // 0 to 0.999 seconds
        const timeSlot = Math.floor((timestamp + perturbation) / intervalSeconds) - offset;

        // Derive HMAC key using PBKDF2
        const derivedKey = crypto.pbkdf2Sync(
            `${inputString}:${process.env.ADMIN_SECRET_KEY}`,
            salt,
            pbkdf2Iterations,
            32, // 256-bit key
            'sha256'
        ).toString('hex');

        // Inner HMAC: Combine time slot, nonce, and entropy seed
        const innerHmac = crypto.createHmac('sha512', derivedKey);
        innerHmac.update(`${timeSlot}: ${nonce}: ${entropySeed}: ${counter}`);
        const innerDigest = innerHmac.digest('hex');

        // Outer HMAC: Apply second layer with chosen algorithm
        const outerHmac = crypto.createHmac(hashAlgorithm, derivedKey + salt);
        outerHmac.update(innerDigest);
        const secret = outerHmac.digest('hex');

        // Prepare response
        const result = {
            secret,
            expiresAt: (timeSlot + 1) * intervalSeconds * 1000,
            salt,
            nonce,
            metadata: {}
        };

        // Include metadata if requested
        if (includeMetadata) {
            result.metadata = {
                generatedAt: timestamp * 1000,
                hashAlgorithm,
                timeSlot,
                version: '2.0.0', // Updated version
                pbkdf2Iterations,
                entropyBytes
            };
        }

        return result;
    }


    async readMachineSecret(machineId: string) {
        const now = Date.now();
        let storedSecret = JSON.parse((await redisClient.get(`secret: ${machineId}`) + '' || '{}')) as { secret: string, expiresAt: number };
        if (storedSecret && storedSecret.expiresAt > now) {
            return storedSecret.secret;
        }
        storedSecret = this.generateTimeBasedSecret(machineId);
        redisClient.set(`secret: ${machineId}`, JSON.stringify(storedSecret));
        return storedSecret.secret;
    }
    async readAdminMachineSecret(machineId: string) {
        const now = Date.now();
        let storedSecret = JSON.parse((await redisClient.get(`secret: ${machineId}`) + '' || '{}')) as { secret: string, expiresAt: number };
        if (storedSecret && storedSecret.expiresAt > now) {
            return storedSecret.secret;
        }
        storedSecret = this.generateTimeBasedSecret(machineId);
        redisClient.set(`secret: ${machineId}`, JSON.stringify(storedSecret));
        return storedSecret.secret;
    }




    sendWSMyMachine(machineId: string, resx: IResModel) {
        this.wsClient.forEach((v) => {
            const x = v["myMachineId"] as Array<string>;
            // console.log("WS SENDING", x, x?.includes(machineId), v?.readyState);
            if (x?.length && x?.includes(machineId) && v.readyState == WebSocketServer.OPEN) {
                // yy.push(v);
                // console.log("WS SENDING", x, v?.readyState);

                v.send(JSON.stringify(resx));
            }
        });


        // this.wss.clients.forEach(v=>{
        //     const x = v['clientId'] as string;
        //     if (x) {
        //         if (x == clientId) {
        //             // yy.push(v);
        //             console.log('WS SENDING',x,v.readyState);

        //             v.send(JSON.stringify(resx));
        //         }
        //     }
        // });
    }

    // sendWS(clientId: string, resx: IResModel) {
    //     this.wsClient.forEach((v) => {
    //         const x = v["clientId"] as string;
    //         // console.log("WS SENDING", x, x == clientId, v?.readyState);
    //         if (x && x == clientId) {
    //             // yy.push(v);
    //             // console.log("WS SENDING", x, v.readyState);

    //             v.send(JSON.stringify(resx));
    //         }
    //     });


    // this.wss.clients.forEach(v=>{
    //     const x = v['clientId'] as string;
    //     if (x) {
    //         if (x == clientId) {
    //             // yy.push(v);
    //             console.log('WS SENDING',x,v.readyState);

    //             v.send(JSON.stringify(resx));
    //         }
    //     }
    // });
    // }
    confirmMMoneyOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirmMmoney(c?.qrcode)
                .then((r) => {
                    if (r) {
                        resolve({ bill: r, transactionID: c.tranid_client });
                    } else {
                        resolve(null);
                    }
                })
                .catch((e) => {
                    console.log("error confirmMMoney");
                    reject(e);
                });
        });
    }

    confirmLaoQROrder(c: IMMoneyConfirm): Promise<{ bill: IVendingMachineBill | null, transactionID: string | null }> {
        return new Promise<{ bill: IVendingMachineBill | null, transactionID: string | null }>((resolve, reject) => {
            console.log('C is :', c);
            console.log('=====>ConfirmLAOQR  is :', c);


            this.callBackConfirmLaoQR(c.trandID, c.bankname).then((r) => {
                if (r) {
                    console.log('=====>ConfirmLAOQR  is not null', r);
                    resolve({ bill: r, transactionID: c.tranid_client });
                } else {
                    console.log('=====>ConfirmLAOQR  is null', c);

                    resolve(null);
                }
            })
                .catch((e) => {
                    console.log("error confirmLaoQROrder");
                    reject(e);
                });
        });
    }

    findLaoQROrderPaid(c: any) {
        return new Promise<any>((resolve, reject) => {
            // console.log('C findLaoQROrderPaid is :', c);
            // console.log('findLaoQRPaid  is :', c);

            this.findCallBackConfirmLaoQR(c.machineId).then((r) => {
                if (r) {
                    resolve({ bill: r });
                } else {
                    resolve(null);
                }
            })
                .catch((e) => {
                    console.log("error findLaoQROrderPaid");
                    reject(e);
                });
        });
    }
    confirmLAABOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirmLAAB(c.qrcode)
                .then((r) => {
                    resolve({ bill: r });
                })
                .catch((e) => {
                    console.log("error confirmLAABOder", e.message);
                    reject(e);
                });
        });
    }
    sendWSToMachine(machineId: string, resx: IResModel) {
        // console.log("wsclient", this.wsClient.length);

        this.wsClient.forEach((v) => {
            const x = v["machineId"] as string;
            // console.log("WS SENDING id", x, machineId, x == machineId, v?.readyState);
            if (x && x == machineId && v.readyState == WebSocketServer.OPEN) {
                // yy.push(v);
                // console.log("WS SENDING machine id", x, v?.readyState);
                // console.log('=====> RES CONFIRMED', JSON.stringify(resx));

                v.send(JSON.stringify(resx));
                return;
            }
        });
    }


    filterDuplicatePositions(response: IResModel): IResModel {
        // สร้าง Map เพื่อเก็บข้อมูลล่าสุดสำหรับแต่ละ position
        const positionMap = new Map<number, any>();

        // วนลูปผ่านข้อมูลและเก็บเฉพาะรายการล่าสุดของแต่ละ position
        response.data.forEach((item: any) => {
            const existingItem = positionMap.get(item.position);

            if (!existingItem || item.transactionID > existingItem.transactionID) {
                positionMap.set(item.position, item);
            }
        });

        // สร้าง response ใหม่โดยใช้ข้อมูลที่กรองแล้ว
        return {
            ...response,
            data: Array.from(positionMap.values())
        };
    }

    close() {
        this.wss.close();
        this.ssocket.server.close();
        this.ssocket.sclients.forEach((v) => {
            v.destroy();
        });
    }
    private async getReportSale(machineId: string, fromDate: string, toDate: string, ownerUuid: string) {
        let condition: any = {};
        if (machineId == 'all') {

            condition = {
                where: {
                    // paymentstatus: 'paid',              
                    paymentstatus: { [Op.in]: [EPaymentStatus.paid, EPaymentStatus.delivered] },

                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            condition = {
                where: {
                    paymentstatus: { [Op.in]: [EPaymentStatus.paid, EPaymentStatus.delivered] },
                    machineId: machineId,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
        await ent.sync();
        const res = await ent.findAndCountAll(condition);
        return res;
    }


    private async getReportDrop(machineId: string, fromDate: string, toDate: string) {
        let condition: any = {};
        if (machineId == 'all') {

            condition = {
                where: {
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            condition = {
                where: {
                    machineId: machineId,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        // const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
        // const res = await ent.findAndCountAll(condition);
        const res = await dropLogEntity.findAndCountAll(condition);
        return res;
    }

    private async getReportBillNotPaid(machineId: string, ownerUuid: string, fromDate: string, toDate: string) {
        let condition: any = {};
        if (machineId == 'all') {

            condition = {
                where: {
                    paymentstatus: EPaymentStatus.pending,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            condition = {
                where: {
                    machineId: machineId,
                    paymentstatus: EPaymentStatus.pending,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }

        const ent = VendingMachineBillFactory(
            EEntity.vendingmachinebill + "_" + ownerUuid,
            dbConnection
        );
        await ent.sync();
        const bill = await ent.findAndCountAll(condition);
        return bill;
    }


    private async getReportClientLog(machineId: string, fromDate: string, toDate: string) {
        let condition: any = {};
        if (machineId == 'all') {

            condition = {
                where: {
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            condition = {
                where: {
                    machineId: machineId,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }

        // const ent = VendingMachineBillFactory(
        //     EEntity.vendingmachinebill + "_" + ownerUuid,
        //     dbConnection
        // );
        // await ent.sync();
        const bill = await ClientlogEntity.findAndCountAll(condition);
        return bill;
    }


    private async getReportLogsTemp(machineId: string, fromDate: string, toDate: string) {
        let condition: any = {};
        if (machineId == 'all') {

            condition = {
                where: {
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            condition = {
                where: {
                    machineId: machineId,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }

        // const ent = VendingMachineBillFactory(
        //     EEntity.vendingmachinebill + "_" + ownerUuid,
        //     dbConnection
        // );
        // await ent.sync();
        const bill = await LogsTempEntity.findAndCountAll(condition);
        return bill;
    }

    // SaveMachineSaleReport(params: ISaveMachineSaleReport): Promise<any> {
    //     return new Promise<any> (async (resolve, reject) => {
    //         try {

    //             const timenow = new Date();
    //             const arr = params.data;
    //             if (arr != undefined && Object.entries(arr).length == 0) return resolve(IENMessage.invalidReportParameters);

    //             // same order
    //             let duplicate = arr.filter((obj, index) => 
    //                 arr.findIndex((item) => item.stock.id == obj.stock.id) !== index
    //             )
    //             // original
    //             let unique = arr.filter((obj, index) => 
    //                 arr.findIndex((item) => item.stock.id == obj.stock.id) === index
    //             )

    //             console.log(`show duplicate`, duplicate, `show unique`, unique);

    //             // merge same order
    //             let array: Array<any> = [];

    //             if (duplicate != undefined && Object.entries(duplicate).length > 0) {

    //                 for(let i = 0; i < unique.length; i++) {
    //                     let setarray = {
    //                         id: unique[i].stock.id,
    //                         name: unique[i].stock.id,
    //                         price: unique[i].stock.price,
    //                         qtty: unique[i].stock.qtty,
    //                         total: 0
    //                     }

    //                     for(let j = 0; j < duplicate.length; j++) {

    //                         if (unique[i].stock.id == duplicate[j].stock.id) {
    //                             setarray.qtty += duplicate[j].stock.qtty;
    //                         }

    //                     }

    //                     setarray.total += setarray.qtty * setarray.price;
    //                     array.push(setarray);
    //                 }

    //             }
    //             else 
    //             {
    //                 for(let i = 0; i < unique.length; i++) {
    //                     let setarray = {
    //                         id: unique[i].stock.id,
    //                         name: unique[i].stock.name,
    //                         price: unique[i].stock.price,
    //                         qtty: unique[i].stock.qtty,
    //                         total: unique[i].stock.qtty * unique[i].stock.price
    //                     }
    //                     array.push(setarray);
    //                 }
    //             }
    //             const run = await vendingMachineSaleReportEntity.findOne({ where: { machineId: params.machineId, createdAt: {[Op.gte]: timenow} } });
    //             if (run == null) {         
    //                 const model = {
    //                     machineId: params.machineId,
    //                     data: array,
    //                     subqty: array.reduce((a,b) => a + b.qtty, 0),
    //                     subtotal: array.reduce((a,b) => a + b.total, 0)
    //                 }
    //                 console.log(`model der`, model);
    //                 const save = await vendingMachineSaleReportEntity.create(model);
    //                 if (!save) return resolve(IENMessage.saveSaleReportFail);
    //             } else {
    //                 let predata: Array<any> = JSON.parse(JSON.stringify(run.data));
    //                 for(let i = 0; i < predata.length; i++) {
    //                     for(let j = 0; j < array.length; j++) {
    //                         if (predata[i].id == array[j].id) {
    //                             predata[i].qtty += array[j].qtty;
    //                             predata[i].total += array[j].total;
    //                         }
    //                     }
    //                 }
    //                 run.data = predata;
    //                 run.subqty = predata.reduce((a,b) => a + b.qtty ,0);
    //                 run.subtotal = predata.reduce((a,b) => a + b.total ,0);

    //                 const save = await run.save();
    //                 if (!save) return resolve(IENMessage.saveSaleReportFail);
    //             }

    //             resolve(IENMessage.success);

    //         } catch (error) {
    //             resolve(error.message);
    //         }
    //     });
    // }

    _loadVendingMachineSaleBillReport(params: ILoadVendingMachineSaleBillReport): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const func = new LoadVendingMachineSaleBillReport();
                const run = await func.Init(params);
                if (run.message != IENMessage.success) throw new Error(run);

                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
    _loadVendingMachineStockReport(params: ILoadVendingMachineStockReport): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const func = new LoadVendingMachineStockReport();
                const run = await func.Init(params);
                if (run.message != IENMessage.success) throw new Error(run);

                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}


export class LoadVendingMachineSaleBillReport {

    private ownerUuid: string;
    private fromDate: string;
    private toDate: string;
    private machineId: string;

    private currentdate: number;
    private parseFromDate: number;
    private parseToDate: number;
    private condition: any = {} as any;
    private vendingMachineBillEntity: VendingMachineBillStatic;
    private response: any = {} as any;
    constructor() { }

    public Init(params: ILoadVendingMachineSaleBillReport): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const ValidateBeginDate = this.ValidateBeginDate();
                if (ValidateBeginDate != IENMessage.success) throw new Error(ValidateBeginDate);

                this.SetCondition();

                this.Connection();

                const Report = await this.Report();
                if (Report != IENMessage.success) throw new Error(Report);

                resolve(this.response);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private InitParams(params: ILoadVendingMachineSaleBillReport): void {
        console.log(`params der`, params);
        this.ownerUuid = params.ownerUuid;
        this.fromDate = params.fromDate;
        this.toDate = params.toDate;
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.fromDate && this.toDate && this.machineId)) return IENMessage.parametersEmpty;

        this.currentdate = new Date(new Date().getFullYear() + '/' + Number(new Date().getMonth() + 1) + '/' + new Date().getDate()).getTime();
        return IENMessage.success;
    }

    private ValidateBeginDate(): string {
        this.parseFromDate = new Date(this.fromDate).getTime();
        this.parseToDate = new Date(this.toDate).getTime();

        if (this.parseFromDate == this.parseToDate) {
            if (this.parseFromDate > this.currentdate) return IENMessage.invalidFromDate;
        } else {
            if (this.parseFromDate > this.parseToDate) return IENMessage.invalidFromDate;
            if (this.parseToDate > this.currentdate) return IENMessage.invalidateToDate;
        }

        return IENMessage.success;
    }

    private SetCondition(): void {
        const date = new Date(this.toDate);
        const addday = date.setDate(date.getDate() + 1);
        this.toDate = String(new Date(addday));

        if (this.machineId == 'all') {

            this.condition = {
                where: {
                    paymentstatus: 'paid',
                    createdAt: { [Op.between]: [this.fromDate, this.toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        else {
            this.condition = {
                where: {
                    paymentstatus: 'paid',
                    machineId: this.machineId,
                    createdAt: { [Op.between]: [this.fromDate, this.toDate] }
                },
                order: [['id', 'DESC']]
            }
        }

    }

    private Connection(): void {
        this.vendingMachineBillEntity = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + this.ownerUuid, dbConnection);
    }

    private Report(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const run = await this.vendingMachineBillEntity.findAndCountAll(this.condition);
                this.response = {
                    rows: run.rows,
                    count: run.count,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);
            }
            catch (error) {
                console.log('=====> error Report', error);
                resolve(error.message);
            }
        });
    }


}

export class LoadVendingMachineStockReport {

    private ownerUuid: string;
    private fromDate: string;
    private toDate: string;
    private machineId: string;

    private currentdate: number;
    private parseFromDate: number;
    private parseToDate: number;
    private condition: any = {} as any;
    private franciseStockEntity: FranchiseStockStatic;
    private response: any = {} as any;
    constructor() { }

    public Init(params: ILoadVendingMachineStockReport): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const ValidateBeginDate = this.ValidateBeginDate();
                if (ValidateBeginDate != IENMessage.success) throw new Error(ValidateBeginDate);

                this.SetCondition();

                this.Connection();

                const Report = await this.Report();
                if (Report != IENMessage.success) throw new Error(Report);

                resolve(this.response);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private InitParams(params: ILoadVendingMachineSaleBillReport): void {
        console.log(`params der`, params);
        this.ownerUuid = params.ownerUuid;
        this.fromDate = params.fromDate;
        this.toDate = params.toDate;
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.fromDate && this.toDate && this.machineId)) return IENMessage.parametersEmpty;

        this.currentdate = new Date(new Date().getFullYear() + '/' + Number(new Date().getMonth() + 1) + '/' + new Date().getDate()).getTime();
        return IENMessage.success;
    }

    private ValidateBeginDate(): string {
        this.parseFromDate = new Date(this.fromDate).getTime();
        this.parseToDate = new Date(this.toDate).getTime();

        if (this.parseFromDate == this.parseToDate) {
            if (this.parseFromDate > this.currentdate) return IENMessage.invalidFromDate;
        } else {
            if (this.parseFromDate > this.parseToDate) return IENMessage.invalidFromDate;
            if (this.parseToDate > this.currentdate) return IENMessage.invalidateToDate;
        }

        return IENMessage.success;
    }

    private SetCondition(): void {
        const date = new Date(this.toDate);
        const addday = date.setDate(date.getDate() + 1);
        this.toDate = String(new Date(addday));

        this.condition = {
            where: {
                createdAt: { [Op.between]: [this.fromDate, this.toDate] }
            },
            order: [['id', 'DESC']]
        }

    }

    private Connection(): void {
        this.franciseStockEntity = FranchiseStockFactory(EEntity.franchisestock + '_' + this.machineId, dbConnection);
    }

    private Report(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const run = await this.franciseStockEntity.findAndCountAll(this.condition);
                this.response = {
                    rows: run.rows,
                    count: run.count,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);
            }
            catch (error) {
                resolve(error.message);
            }
        });
    }



}


function isMoreThan5SecondsAgo(fromTimeStr, toTimeStr, t = 5) {
    const from = new Date(fromTimeStr);
    const to = new Date(toTimeStr);
    const diffInSeconds = (to.getTime() - from.getTime()) / 1000;
    return diffInSeconds > t;
}