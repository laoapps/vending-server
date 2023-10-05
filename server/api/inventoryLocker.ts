import axios from "axios";
import e, { NextFunction, Request, Response, Router } from "express";
import * as WebSocketServer from "ws";
import { randomUUID } from "crypto";
import crypto from 'crypto';
import cryptojs from "crypto-js";
import * as uuid from "uuid";

import {
    broadCast,
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
    writeDoorDone,
    readDoorDone,
} from "../services/service";
import {
    EClientCommand,
    EZDM8_COMMAND,
    EMACHINE_COMMAND,
    EMessage,
    IMachineID,
    IMMoneyQRRes,
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
    ERedisCommand,
    EPaymentStatus,
    IBillCashIn,
    IBankNote,
    IHashBankNote,
    IMMoneyLoginCashin,
    IMMoneyRequestRes,
    IVendingCloneMachineSale,
    ISaveMachineSaleReport,
    IAds,
    ILoadVendingMachineSaleBillReport,
    IDoor,
    IDoorItem,
} from "../entities/system.model";
import moment, { now } from "moment";
import { stringify, v4 as uuid4 } from "uuid";
import { setWsHeartbeat } from "ws-heartbeat/server";
import { SocketServerZDM8 } from "./socketServerZDM8";
import {
    MachineIDFactory,
    MachineIDStatic,
} from "../entities/machineid.entity";
import {
    adsEntity,
    dbConnection,
    doorEntity,
    doorPaymentEntity,
    laabHashService,
    machineCashoutMMoneyEntity,
    machineClientIDEntity,
    machineIDEntity,
    stockEntity,
    subadminEntity,
    vendingMachineSaleReportEntity,
} from "../entities";
import {
    MachineClientID,
    MachineClientIDFactory,
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
import { APIAdminAccess, IENMessage, IFranchiseStockSignature, LAAB_CoinTransfer } from "../services/laab.service";
import { CashVendingLimiterValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashLimiterValidation.func";
import {
    BillCashInFactory,
    BillCashInStatic,
} from "../entities/billcash.entity";
import { CashinValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashinValidation.func";
import { FranchiseStockFactory } from "../entities/franchisestock.entity";
import { MmoneyTransferValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/mmoneyTransferValidation.func";
import { SocketServerLocker } from "./socketLocker";
import { loadVendingMachineSaleBillReport } from "./inventoryZDM8";
import { DoorFactory } from "../entities/doors.entity";
export class InventoryLocker implements IBaseClass {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerLocker = {} as SocketServerLocker;
    notes = new Array<IBankNote>();
    hashNotes = new Array<IHashBankNote>();
    // stock = new Array<IStock>();
    // vendingOnSale = new Array<IVendingMachineSale>();
    // vendingBill = new Array<IVendingMachineBill>();
    // vendingBillPaid = new Array<IVendingMachineBill>();
    // clients = new Array<IMachineID>();

    delayTime = 5000;
    path = "/locker";
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


    ports = 31226;
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
        res.locals["machineId"] = this.ssocket.findMachineIdToken(token);
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

        this.ssocket = new SocketServerLocker(this.ports);

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
                    console.log("POST Data", d);

                    if (d.command == EClientCommand.confirmMMoney) {
                        console.log("CB COMFIRM", d);
                        const c = d.data as IMMoneyConfirm;
                        // c.wallet_ids
                        this.callBackConfirmMmoney(c.tranid_client, Number(c.amount))
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
                        console.log("process orders", d);
                        // c.wallet_ids
                        try {
                            const { token, transactionID } = d.data;
                            const machineId =
                                this.ssocket.findMachineIdToken(token)?.machineId;
                            if (!machineId) throw new Error("machine is not exit");
                            this.getBillProcess((b) => {
                                const position = b.find(
                                    (v) => v.transactionID == transactionID
                                )?.position;
                                if (position) {
                                    this.setBillProces(
                                        b.filter((v) => v.transactionID != transactionID)
                                    );
                                    console.log("submit_command", transactionID, position);
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
                        let loggedin = false;
                        // console.log(' WS client length', this.wss.clients);

                        // this.wss.clients.forEach(v => {
                        //     console.log('WS CLIENT ID', v['clientId'], '==>' + clientId);
                        //     if (v['clientId'] == clientId)
                        //         loggedin = true;
                        // })
                        console.log("Command", d);

                        this.wsClient.find((v) => {
                            if (v["clientId"] == clientId) return (loggedin = true);
                        });
                        if (!loggedin) throw new Error(EMessage.notloggedinyet);
                        else if (d.command == EClientCommand.list) {
                            const m = await machineClientIDEntity.findOne({
                                where: {
                                    machineId: this.ssocket.findMachineIdToken(d.token)
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
                            console.log(" buyMMoney" + d.data.value);
                            const sale = d.data.ids as Array<IVendingMachineSale>; // item id
                            const machineId = this.ssocket.findMachineIdToken(d.token);
                            // const position = d.data.position;
                            if (!machineId) throw new Error("Invalid token");
                            console.log(" passed token", machineId);
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

                            console.log(" value" + d.data.value + " " + value);

                            if (Number(d.data.value) != value)
                                throw new Error("Invalid value" + d.data.value + " " + value);

                            // console.log(' value is valid', sale);
                            let a = machineId?.data?.find(v => v.settingName == 'setting');
                            let mId = a?.imei + ''; // for MMoney need 10 digits
                            console.log(`check emei derrrrr`, mId);
                            if (!mId) throw new Error('MMoney need IMEI');


                            // const emei: string = 
                            // console.log(`emei -->`, emei, emei.length, `time -->`, time, time.length);
                            // const transactionID = emei + time;
                            const x = new Date().getTime();
                            const transactionID = String(mId.substring(mId.length - 10)) + (x + '').substring(2);
                            console.log(`transactionID`, transactionID);
                            // const transactionID = Number(
                            //     Number(
                            //         mId.substring(0, mId.length - 10) // 21
                            //     ) +
                            //     "" +
                            //     new Date().getTime() 
                            // );
                            const qr = await this.generateBillMMoney(
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
                                    machineId: this.ssocket.findMachineIdToken(d.token)
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
                                console.log("SET transactionID by owner", ownerUuid);

                                redisClient.setEx(transactionID + "--_", 60 * 15, ownerUuid);
                                res.send(PrintSucceeded(d.command, r, EMessage.succeeded, null));
                            });
                        } else {
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
            // router.post(this.path + "/creditMMoney", (req, res) => {
            //     const d = req.body as IReqModel;
            //     // this.creditMachineMMoney(d);
            //     // res.send({ message: "wait", status: 1 });
            // });
            router.post(this.path + "/refreshMachine",
                this.checkSuperAdmin,
                this.checkSubAdmin,
                this.checkAdmin,
                async (req, res) => {
                    try {
                        const m = req.body.machineId;
                        const ws = this.wsClient.find(v => v['machineId'] == m);
                        // const w = ws.find(v=>v['clientId']);
                        console.log(`----------->`, m);
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.refresh;
                        resx.message = EMessage.refreshsucceeded;
                        resx.data = true;
                        this.sendWSToMachine(ws['machineId'], resx)
                        res.send(PrintSucceeded("refreshMachine", !!ws, EMessage.succeeded, returnLog(req, res)));

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error, returnLog(req, res, true)));
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
                        console.log("getDeliveryingBills", m, ownerUuid);

                        this.getBillProcess((b) => {
                            console.log(
                                "getDeliveryingBills",
                                b,
                                b.filter((v) => v.ownerUuid == ownerUuid)
                            );
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
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId;
                        const entx = VendingMachineBillFactory(
                            EEntity.vendingmachinebillpaid + "_" + ownerUuid,
                            dbConnection
                        );
                        entx
                            .findAll({
                                where: { machineId, paymentstatus: EPaymentStatus.paid },
                            })
                            .then((r) => {
                                res.send(PrintSucceeded("getPaidBills", r, EMessage.succeeded, returnLog(req, res)));
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
                this.path + "/retryProcessBill",
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const position = Number(req.query["position"]);
                        const transactionID = Number(req.query["T"] + "");
                        const m = await machineClientIDEntity.findOne({
                            where: { machineId: res.locals["machineId"]?.machineId },
                        });
                        const ownerUuid = m?.ownerUuid || "";
                        const machineId = m?.machineId || "";
                        const that = this;
                        const mx = allMachines.find(v => v.m == machineId);
                        if (mx) {
                            if (moment().diff(moment(mx.t), 'milliseconds') < 3000) return res.send(
                                PrintError("retryProcessBill", [], EMessage.error + ' too fast', returnLog(req, res, true))
                            );
                            mx.t = moment.now();
                        } else {
                            allMachines.push({ m: machineId, t: moment.now() });
                        }

                        // setTimeout(() => {
                        this.getBillProcess((b) => {
                            try {
                                let x = b.find(
                                    (v) =>
                                        v.position == position &&
                                        v.transactionID == Number(transactionID + "") &&
                                        v.ownerUuid == ownerUuid
                                );
                                console.log(
                                    "processOrder",
                                    machineId,
                                    position,
                                    transactionID
                                );
                                console.log(
                                    "found x ",
                                    x.ownerUuid,
                                    x.position,
                                    x.transactionID
                                );
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
                                if (pos.code) {
                                    that.setBillProces(
                                        b.filter((v) => v.transactionID != transactionID)
                                    );
                                    that.deductStock(transactionID, x.bill, position);
                                    writeSucceededRecordLog(x?.bill, position);
                                    res.send(
                                        PrintSucceeded(
                                            "retryProcessBill",
                                            { position, bill: x?.bill, transactionID, pos },
                                            EMessage.succeeded, returnLog(req, res)
                                        )
                                    );
                                } else {
                                    res.send(
                                        PrintError("retryProcessBill", pos, EMessage.error, returnLog(req, res, true))
                                    );
                                }
                            } catch (error) {
                                console.log("error retryProcessBill", error, returnLog(req, res, true));

                                res.send(
                                    PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true))
                                );
                            }
                        });
                        // }, 1000);
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true)));
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
            router.get(this.path + "/getOnlineMachines", async (req, res) => {
                try {
                    console.log(" WS getOnlineMachines");
                    res.send(
                        PrintSucceeded(
                            "init",
                            this.ssocket.listOnlineMachines(),
                            EMessage.succeeded
                            , returnLog(req, res)
                        )
                    );
                } catch (error) {
                    console.log(error);
                    res.send(PrintError("init", error, EMessage.error, returnLog(req, res, true)));
                }
            });


            router.post(
                this.path + "/addDoor",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,

                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        try {
                            const ownerUuid = res.locals["ownerUuid"] || "__";
                            // await sEnt.sync();
                            const o = req.body.data as IDoor;

                            if (Object(o.doorNumber) == 'undefined' || o.doorNumber == null || !ownerUuid)
                                return res.send(
                                    PrintError("addDoor", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                                );
                            o.ownerUuid = ownerUuid;
                            const d = await doorEntity.findOne({ where: { doorNumber: o.doorNumber, isDone: false } });
                            if (d) PrintError("addDoor", [], EMessage.doorExist, returnLog(req, res, true))
                            doorEntity
                                .create(o)
                                .then((r) => {

                                    res.send(PrintSucceeded("addDoor", r, EMessage.succeeded, returnLog(req, res)));
                                })
                                .catch((e) => {
                                    console.log("error add Door", e);

                                    res.send(PrintError("addDoor 1" + e, e, EMessage.error, returnLog(req, res, true)));
                                });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("addDoor 2" + error, error, EMessage.error, returnLog(req, res, true)));
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addDoor 3" + error, error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/deleteDoor",
                this.checkSuperAdmin,
                this.checkSubAdmin,
                this.checkAdmin,

                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        try {
                            const ownerUuid = res.locals["ownerUuid"] || "";
                            // await sEnt.sync();
                            const id = Number(req.query['id']);
                            const machineId = req.query['machineId'] + '';
                            const d = await doorEntity.findOne({ where: { id, machineId, ownerUuid } });
                            if (!d) PrintError("deleteDoor", [], EMessage.notexist, returnLog(req, res, true))
                            d.destroy()
                                .then((r) => {
                                    res.send(PrintSucceeded("deleteDoor", r, EMessage.succeeded, returnLog(req, res)));
                                })
                                .catch((e) => {
                                    console.log("error deleteDoor", e);

                                    res.send(PrintError("deleteDoor", e, EMessage.error, returnLog(req, res, true)));
                                });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("deleteDoor", error, EMessage.error, returnLog(req, res, true)));
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("deleteDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/finishDoor",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        // const id = Number(req.query["id"]);
                        const d = req.body as IReqModel;
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        const read = await readDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber);


                        if (read) {
                            // keep unlocking
                            const o = JSON.parse(read) as IDoor
                            this.ssocket.processOrder(machineId.machineId, o.doorNumber, new Date().getTime())
                        } else {

                            doorEntity
                                .findOne({ where: { doorNumber: d.data.doorNumber, cabinetNumber: d.data.cabinetNumber, machineId: machineId.machineId, isDone: false } })
                                .then(async (r) => {
                                    if (!r)
                                        return res.send(
                                            PrintError("finishDoor not found", [], EMessage.error, returnLog(req, res, true))
                                        );
                                    console.log('finishDoor', r);
                                    /// check Payment has been made 
                                    const p = doorPaymentEntity.findOne({ where: { machineId: machineId.machineId, isPaid: true } })
                                    /// check LAAB
                                    if (!p) return res.send(PrintError("finishDoor Payment not found", e, EMessage.error, returnLog(req, res, true)));
                                    r.isDone = true;
                                    console.log('finishDoor', r);
                                    r.changed("isDone", true);
                                    const dx = r.toJSON();
                                    dx.isDone = false;
                                    dx.door = null;
                                    dx.sendBy = '';
                                    dx.sentAt = null;
                                    dx.depositAt = null;
                                    dx.depositBy = '';
                                    doorEntity.create(dx).then(async rx => {
                                        console.log('clone new door exist');
                                        writeDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber, JSON.stringify(dx));
                                        // Unlock here                            
                                        this.ssocket.processOrder(machineId.machineId, dx.doorNumber, new Date().getTime())

                                        res.send(
                                            PrintSucceeded(
                                                "finishDoor",
                                                await r.save(),
                                                EMessage.succeeded
                                                , returnLog(req, res)
                                            )
                                        );
                                    })

                                })
                                .catch((e) => {
                                    console.log("error finishDoor Door", e);

                                    res.send(PrintError("finishDoor", e, EMessage.error, returnLog(req, res, true)));
                                });
                        }

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("finishDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/doorPayment",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const id = Number(req.query["id"]);
                        const d = req.body as IReqModel;
                        const machineId = this.ssocket.findMachineIdToken(d.token);

                        doorEntity
                            .findOne({ where: { id, machineId: machineId.machineId, isDone: false } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("door found", [], EMessage.error, returnLog(req, res, true))
                                    );
                                console.log('doorPayment', r);
                                /// check Payment has been made 
                                const p = doorPaymentEntity.findOne({ where: { machineId: machineId.machineId, isPaid: true } })

                                if (p) return res.send(PrintError("doorPayment found", e, EMessage.error, returnLog(req, res, true)));

                                /// check LAAB
                                res.send(
                                    PrintSucceeded(
                                        "doorPayment",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );

                            })
                            .catch((e) => {
                                console.log("error doorPayment Door", e);

                                res.send(PrintError("doorPayment", e, EMessage.error, returnLog(req, res, true)));
                            });


                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("doorPayment", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );

            // unlock for deposit
            router.post(
                this.path + "/unlockForDeposit",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        // const id = Number(req.query["id"]);
                        const d = req.body as IReqModel;
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        const read = await readDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber);


                        if (read) {
                            // keep unlocking
                            const o = JSON.parse(read) as IDoor
                            this.ssocket.processOrder(machineId.machineId, o.doorNumber, new Date().getTime())
                        } else {

                            doorEntity
                                .findOne({ where: { doorNumber: d.data.doorNumber, cabinetNumber: d.data.cabinetNumber, machineId: machineId.machineId, isDone: false } })
                                .then(async (r) => {
                                    if (!r)
                                        return res.send(
                                            PrintError("finishDoor not found", [], EMessage.error, returnLog(req, res, true))
                                        );
                                    console.log('finishDoor', r);
                                    /// check Payment has been made 
                                    const p = doorPaymentEntity.findOne({ where: { machineId: machineId.machineId, isPaid: true } })
                                    /// check LAAB
                                    if (!p) return res.send(PrintError("finishDoor Payment not found", e, EMessage.error, returnLog(req, res, true)));
                                    r.isDone = true;
                                    console.log('finishDoor', r);
                                    r.changed("isDone", true);
                                    const dx = r.toJSON();
                                    dx.isDone = false;
                                    /// TODO
                                    doorEntity.create(dx).then(async rx => {
                                        console.log('clone new door exist');
                                        writeDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber, JSON.stringify(dx));
                                        // Unlock here                            
                                        this.ssocket.processOrder(machineId.machineId, dx.doorNumber, new Date().getTime())

                                        res.send(
                                            PrintSucceeded(
                                                "finishDoor",
                                                await r.save(),
                                                EMessage.succeeded
                                                , returnLog(req, res)
                                            )
                                        );
                                    })

                                })
                                .catch((e) => {
                                    console.log("error finishDoor Door", e);

                                    res.send(PrintError("finishDoor", e, EMessage.error, returnLog(req, res, true)));
                                });
                        }

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("finishDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            // unlock for sale
            router.post(
                this.path + "/unlockForSale",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        // const id = Number(req.query["id"]);
                        const d = req.body as IReqModel;
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        const read = await readDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber);


                        if (read) {
                            // keep unlocking
                            const o = JSON.parse(read) as IDoor
                            this.ssocket.processOrder(machineId.machineId, o.doorNumber, new Date().getTime())
                        } else {

                            doorEntity
                                .findOne({ where: { doorNumber: d.data.doorNumber, cabinetNumber: d.data.cabinetNumber, machineId: machineId.machineId, isDone: false } })
                                .then(async (r) => {
                                    if (!r)
                                        return res.send(
                                            PrintError("finishDoor not found", [], EMessage.error, returnLog(req, res, true))
                                        );
                                    console.log('finishDoor', r);
                                    /// check Payment has been made 
                                    const p = doorPaymentEntity.findOne({ where: { machineId: machineId.machineId, isPaid: true } })
                                    /// check LAAB
                                    if (!p) return res.send(PrintError("finishDoor Payment not found", e, EMessage.error, returnLog(req, res, true)));
                                    r.isDone = true;
                                    console.log('finishDoor', r);
                                    r.changed("isDone", true);
                                    const dx = r.toJSON();
                                    dx.isDone = false;
                                    doorEntity.create(dx).then(async rx => {
                                        console.log('clone new door exist');
                                        writeDoorDone(machineId.machineId + '' + d?.data.cabinetNumber + '' + d?.data.doorNumber, JSON.stringify(dx));
                                        // Unlock here                            
                                        this.ssocket.processOrder(machineId.machineId, dx.doorNumber, new Date().getTime())

                                        res.send(
                                            PrintSucceeded(
                                                "finishDoor",
                                                await r.save(),
                                                EMessage.succeeded
                                                , returnLog(req, res)
                                            )
                                        );
                                    })

                                })
                                .catch((e) => {
                                    console.log("error finishDoor Door", e);

                                    res.send(PrintError("finishDoor", e, EMessage.error, returnLog(req, res, true)));
                                });
                        }

                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("finishDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );




            router.post(
                this.path + "/loadDoors",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        doorEntity
                            .findAll({ where: { machineId: machineId?.machineId } })
                            .then(async (r) => {

                                res.send(
                                    PrintSucceeded(
                                        "finishDoor",
                                        r,
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    ));

                            })
                            .catch((e) => {
                                console.log("error finishDoor Door", e);

                                res.send(PrintError("finishDoor", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("finishDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/listDoor",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                // this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        //   const machineId = res.locals['machineId']?.machineId
                        const machineId = req.body.machineId

                        doorEntity
                            .destroy({ where: { machineId } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("listDoor", [], EMessage.error, returnLog(req, res, true))
                                    );
                                console.log('listDoor', r);
                                res.send(
                                    PrintSucceeded(
                                        "listDoor",
                                        r,
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error listDoor", e);

                                res.send(PrintError("listDoor", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );
            router.post(
                this.path + "/listDoorByMachine",
                this.checkSuperAdmin,
                this.checkSubAdmin,
                this.checkAdmin,
                // this.checkToken,
                // this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const machineId = req.query['machineId'] + '' || '';

                        doorEntity
                            .destroy({ where: { ownerUuid, machineId } })
                            .then(async (r) => {
                                if (!r)
                                    return res.send(
                                        PrintError("listDoor", [], EMessage.error, returnLog(req, res, true))
                                    );
                                console.log('listDoor', r);
                                res.send(
                                    PrintSucceeded(
                                        "listDoor",
                                        r,
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error listDoor", e);

                                res.send(PrintError("listDoor", e, EMessage.error, returnLog(req, res, true)));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listDoor", error, EMessage.error, returnLog(req, res, true)));
                    }
                }
            );


            // 
            router.post(
                this.path + "/addDoorItem",
                // this.checkSuperAdmin,
                // this.checkSubAdmin,
                // this.checkAdmin,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    const d = req.body as IReqModel;
                    const doorItem = d.data as IDoorItem;
                    const machineId = res.locals['machineId']?.machineId
                    const id = Number(req.query["id"]);

                    doorEntity
                        .findOne({ where: { id, machineId: machineId } })
                        .then(async (r) => {
                            if (!r)
                                return res.send(
                                    PrintError("addDoorItem", [], EMessage.error, returnLog(req, res, true))
                                );
                            console.log('addDoorItem', r);

                            r.door = doorItem;
                            console.log('addDoorItem', r);
                            r.changed("door", true);
                            res.send(
                                PrintSucceeded(
                                    "addDoorItem",
                                    await r.save(),
                                    EMessage.succeeded
                                    , returnLog(req, res)
                                )
                            );

                        })
                        .catch((e) => {
                            console.log("error addDoorItem Door", e);

                            res.send(PrintError("addDoorItem", e, EMessage.error, returnLog(req, res, true)));
                        });

                }
            );





        } catch (error) {
            console.log(error);
        }
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
    checkSuperAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('checkSupAdmin');
            const token = req.body.token;
            const phoneNumber = req.body.shopPhonenumber + '';
            if (!token) throw new Error(EMessage.tokenNotFound);
            findRealDB(token).then((r) => {
                const uuid = r;
                if (!uuid) throw new Error(EMessage.notfound);
                // req['gamerUuid'] = gamerUuid;
                res.locals["superadmin"] = uuid;
                if (phoneNumber) {
                    findUuidByPhoneNumberOnUserManager(phoneNumber).then(r => {
                        res.locals["ownerUuid"] = r.uuid;
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
    checkSubAdmin(req: Request, res: Response, next: NextFunction) {
        console.log('checkSubAdmin');

        try {
            if (res.locals['ownerUuid']) {
                next();
            }
            else {
                const token = req.body.token;
                const phoneNumber = req.body.shopPhonenumber + '';
                if (!token) throw new Error(EMessage.tokenNotFound);
                findRealDB(token).then((r) => {
                    const uuid = r;
                    if (!uuid) throw new Error(EMessage.notfound);
                    // req['gamerUuid'] = gamerUuid;
                    res.locals["subadmin"] = uuid;
                    if (phoneNumber) {
                        findUuidByPhoneNumberOnUserManager(phoneNumber).then(r => {
                            const ownerUuid = r.uuid;
                            if (ownerUuid) {
                                subadminEntity.findOne({ where: { data: { uuid }, ownerUuid } }).then(subadmin => {
                                    if (subadmin != null) {
                                        res.locals["ownerUuid"] = subadmin.ownerUuid;
                                    } else {
                                        res.locals["ownerUuid"] = uuid;
                                        res.locals["subadmin"] = '';
                                    }
                                    next();
                                }).catch(error => {
                                    console.log(error);
                                    res.status(400).end();
                                });
                            } else {
                                res.locals["ownerUuid"] = uuid;
                                res.locals["subadmin"] = '';
                                next();
                            }
                        });
                    } else {
                        res.locals["ownerUuid"] = uuid;
                        res.locals["subadmin"] = '';
                        next();
                    }




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



    getBillProcess(cb: (b: IBillProcess[]) => void) {
        const k = "clientResponse";
        try {
            redisClient
                .get(k)
                .then((r) => {
                    console.log("clientResponse", "getBillProcess");
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
    setBillProces(b: IBillProcess[]) {
        const k = "clientResponse";
        b.forEach((v) =>
            v.bill?.vendingsales?.forEach((v) =>
                v.stock ? (v.stock.image = "") : ""
            )
        );
        redisClient.set(k, JSON.stringify(b));
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
            return console.log("onMachineResponse ignore", transactionID);
        if ([22331, 1000].includes(transactionID)) {
            resx.status = 1;
            console.log("onMachineResponse 22231", transactionID);
            resx.transactionID = transactionID || -1;
            resx.data = { bill, position };
            //    return  cres?.res.send(PrintSucceeded('onMachineResponse '+re.transactionID, resx, EMessage.succeeded));
        } else {
            const idx =
                bill?.vendingsales?.findIndex((v) => v.position == position) || -1;
            idx == -1 || !idx ? "" : bill?.vendingsales?.splice(idx, 1);
            resx.status = 1;
            console.log("onMachineResponse xxx", transactionID);
            resx.transactionID = transactionID || -1;
            resx.data = { bill, position };
        }
        const clientId = bill?.clientId + "";
        console.log("send", clientId, bill?.clientId, resx);
        console.log("onMachineResponse", transactionID);

        ///** always retry */
        const retry = -1; // set config and get config at redis and deduct the retry times;
        // if retry == -1 , it always retry
        /// TODO
        // that.setBillProces(b.filter(v => v.transactionID != re.transactionID));
        // writeSucceededRecordLog(cres?.bill, cres?.position);

        that.sendWSToMachine(bill?.machineId + "", resx);
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
    async creditMachineMMoney(d: IReqModel): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const that = this;
                let { phonenumber, cashInValue } = d.data;
                // DEMO 1000 only
                cashInValue = 1100;
                if (isNaN(cashInValue)) return reject(new Error('Invalid Cash In Value'));
                // validate phonenumber for MMoney
                if (phonenumber?.length < 10 || isNaN(phonenumber) || phonenumber == '') return reject('Invalid Phonenumber');
                // find in redis

                // imei
                d.transactionID = new Date().getTime();

                let machineId = this.ssocket.findMachineIdToken(d.token);
                if (!machineId) throw new Error("machine is not exit");



                const ws = that.wsClient.find(
                    (v) => v["machineId"] == machineId.machineId + ""
                );
                const res = {} as IResModel;

                res.command = d.command;
                res.message = EMessage.machineCredit;
                res.status = 1;
                console.log(
                    "creditMachine WS online machine",
                    that.ssocket.listOnlineMachines()
                );

                // create new bill for new credit
                if (!machineId) throw new Error("machine is not exist");
                const sock = that.ssocket.findOnlneMachine(machineId.machineId);
                if (!sock) throw new Error("machine is not online");
                if (d?.token) {
                    console.log("billCashIn", d?.data);

                    // *** cash in here
                    const bn = { amount: cashInValue, channel: -1 * cashInValue, value: cashInValue } as IBankNote;

                    // start Cash In MMoney
                    // ##here
                    const machineId = this.ssocket.findMachineIdToken(d.token);
                    if (!machineId) throw new Error("Invalid token");
                    let a = machineId?.data?.find(v => v.settingName == 'setting');
                    let mId = a?.imei + ''; // for MMoney need 10 digits\
                    if (!mId) throw new Error('MMoney need IMEI');
                    const x = new Date().getTime();
                    const transactionID = String(mId.substring(mId.length - 10)) + (x + '').substring(2);

                    const params = {
                        cash: cashInValue,
                        description: "LAAB CASH OUT TO MMONEY",
                        machineId: machineId.machineId,
                    };
                    const func = new MmoneyTransferValidationFunc();

                    console.log(`creditMachineMMoney`, 1);

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
                            console.log(`creditMachineMMoney`, 3, run_createLAABLog);
                            if (!run_createLAABLog) return resolve(IENMessage.createLAABBillFail);
                            machineCashoutMMoneyEntity.findOne({ where: { id: run_createLAABLog.id } }).then(run_findbill => {
                                console.log(`creditMachineMMoney`, 4, run_findbill);
                                if (run_findbill == null) return resolve(IENMessage.notFoundBill);
                                this.refillMMoney(phonenumber, transactionID, cashInValue, params.description).then(refill => {
                                    console.log(`creditMachineMMoney`, 5, refill);
                                    machineCashoutMMoneyEntity.update({ MMoney: refill }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {
                                        console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                        if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                        model.MMoney = refill;
                                        model.message = IENMessage.success;
                                        console.log(`creditMachineMMoney`, 7);
                                        resolve(model);
                                    }).catch(error => resolve(error.message));
                                }).catch(error => {

                                    // if transfer mmoney fail laab mmoney finance will auto transfer back to vending
                                    const params = ifError;

                                    console.log(`params error der`, params);
                                    axios.post(LAAB_CoinTransfer, params).then(run_return => {
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
                                            console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                            if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                            writeMachineBalance(ifError.machineId, ifError.vendingBalance);
                                            resolve(error.message);
                                        }).catch(error => resolve(`update bill return br sum led 001` + error.message));

                                    }).catch(error => {

                                        // if transfer back and everything fail database will save error data
                                        machineCashoutMMoneyEntity.update({ LAABReturn: error.message }, { where: { id: run_createLAABLog.id } }).then(run_createMMoneyLog => {

                                            console.log(`creditMachineMMoney`, 6, run_createMMoneyLog);
                                            if (!run_createMMoneyLog) return resolve(IENMessage.createMMoneyBillFail);
                                            resolve(error.message);
                                        }).catch(error => resolve(`update bill return br sum led 002` + error.message));
                                    });

                                });
                            }).catch(error => resolve(error.message));
                        }).catch(error => resolve(error.message));
                    }).catch(error => resolve(error.message));


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
            const that = this;
            // find in redis
            let machineId = this.ssocket.findMachineIdToken(d.token);
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
            console.log(
                "creditMachine WS online machine",
                that.ssocket.listOnlineMachines()
            );

            console.log('FOUND ACK EXIST TRANSACTIONID', ack, d.transactionID);

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
                            setting = JSON.parse(r);
                        } catch (error) {
                            console.log('error parsing setting 2', error);
                            setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true; setting.limiter = 100000; setting.imei = '';
                        }
                    }
                    const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                    // const limiter = await readMachineLimiter(machineId.machineId);
                    this.updateBillCash(bsi, machineId.machineId, d.transactionID);
                    await writeACKConfirmCashIn(machineId.machineId + '' + d.transactionID);
                    that.ssocket.updateBalance(machineId.machineId, { balance: balance || 0, limiter: setting.limiter, setting, confirmCredit: true, transactionID: d.transactionID })
                    ws?.send(
                        JSON.stringify(
                            PrintSucceeded(d.command, res, EMessage.succeeded, null)
                        )
                    )
                    // finish the process allow next queque with exist TransactionID
                    console.log('finish the process allow next queque with exist TransactionID', d.transactionID);
                })

                return;
            } else {
                // create new bill for new credit
                if (!machineId) throw new Error("machine is not exist");
                const sock = that.ssocket.findOnlneMachine(machineId.machineId);
                if (!sock) throw new Error("machine is not online");
                // that.ssocket.terminateByClientClose(machineId.machineId)
                const hashnotes = this.initHashBankNotes(machineId.machineId);

                // console.log('hashnotes',hashnotes);


                if (d?.token) {


                    console.log("billCashIn", d?.data);

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
                    console.log(`cash in validation params`, params);
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
                                        setting = JSON.parse(r);
                                    } catch (error) {
                                        console.log('error parsing setting 2', error);
                                        setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true; setting.limiter = 100000; setting.imei = '';
                                    }
                                }
                                const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                                // const limiter = await readMachineLimiter(machineId.machineId);

                                that.ssocket.updateBalance(machineId.machineId, { balance: balance || 0, limiter: setting.limiter, setting, confirmCredit: true, transactionID: bsi.transactionID })
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
                    this.ssocket.initMachineId(rx);
                });
            });

            const that = this;
            this.ssocket.onMachineCredit((d: IReqModel) => {
                that.creditMachine(d);
            });

        });
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
                console.log(
                    "SAVED BILL CASH-IN",
                    provider + "_",
                    EEntity.billcash +
                    "_" +
                    this.production +
                    "_" +
                    billCash?.requestor?.transData[0]?.accountRef
                );
            });
            const mId = this.ssocket.findMachineId(machineId);
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
                        console.log(
                            "SAVED MachineIDStatic",
                            EEntity.machineIDHistory +
                            "_" +
                            this.production +
                            "_" +
                            mId?.machineId
                        );
                    })
                    .catch((e) => {
                        console.log("  mEnt.create", e);
                    });
            });
        } catch (error) {
            console.log("Error updateBillCash");
        }
    }
    updateBadBillCash(
        billCash: IBillCashIn,
        machineId: string,
        transactionID: number
    ) {
        try {

            this.badBillCashEnt.create(billCash).then((rx) => {
                console.log(
                    "SAVED BILL CASH-IN",
                    EEntity.badbillcash + "_" + this.production
                );
            });

            const mId = this.ssocket.findMachineId(machineId);
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
                        console.log(
                            "SAVED MachineIDStatic",
                            EEntity.machineIDHistory + "_" + mId?.machineId
                        );
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
    refreshMachines() {
        this.machineClientlist.findAll({ attributes: { exclude: ['photo'] } }).then((rx) => {
            this.ssocket.initMachineId(rx);
        });
    }


    generateBillMMoney(phonenumber: string, value: number, transactionID: string) {
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
                        console.log("QR", qr);

                        axios
                            .post<IMMoneyGenerateQRRes>(
                                "https://qr.mmoney.la/test/generateQR",
                                qr,
                                { headers: { "mmoney-token": this.mMoneyLoginRes.token } }
                            )
                            .then((rx) => {
                                console.log("generateBillMMoney", rx);
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
                        console.log(r);
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

    callBackConfirmMmoney(transactionID: string, amount: number) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log("transactionID", transactionID, "value", amount);

                const ownerUuid = (await redisClient.get(transactionID + "--_")) || "";
                console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid && this.production)
                    throw new Error(EMessage.TransactionTimeOut);
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                const bill = await ent.findOne({
                    where: { transactionID, totalvalue: amount },
                });

                if (!bill) throw new Error(EMessage.billnotfound);
                await redisClient.del(transactionID + "--_");

                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = transactionID;
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
                this.getBillProcess(async (b) => {
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
                    console.log("callBackConfirmMmoney", b);

                    this.setBillProces(b);
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

    refillMMoney(msisdn: string, transID: string, amount, description, remark1 = '', remark2 = '', remark3 = '', remark4 = '') {

        // const transID = machineId + (new Date().getTime());
        return new Promise<any>((resolve, reject) => {
            try {
                // const mySum = this.checkSum(msisdn, amount, description, remark1, remark2, remark3, remark4);
                // if (moment(this.mmMoneyLogin?.expiry).isBefore(moment()) || !this.mmMoneyLogin) {
                this.loginCashInMmoney().then(re => {
                    // this.loginTokenList.push({ m: r, t: transID });
                    console.log('DATA mmMoneyLogin', re);

                    this.processRefillMmoney(msisdn, transID, amount, description, re.accessToken).then(r => {
                        console.log('DATA processRefillMmoney', r);
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

    processRefillMmoney(msisdn: string, transID: string, value: number, remark: string, accessToken) {
        return new Promise<any>((resolve, reject) => {
            this.requestMmoneyCashin(msisdn, transID, value, accessToken, remark).then(r => {
                console.log('DATA requestMmoneyCashin', r);
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
                    console.log('Succeeded confirmMmoneyCashin', rx);
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
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                console.log('DATA confirmMmoneyCashin', r.data);
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
            console.log('PARAM LOGIN', url, params);

            axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(r => {
                console.log('DATA loginMmoney', url, r.data);
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
            console.log('IMMoneyRequestRes', data);
            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                console.log('DATA requestMmoneyCashin', r.data);
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

    callBackConfirmLAAB(transactionID: string, amount: number) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log("transactionID", transactionID, "value", amount);

                const ownerUuid = (await redisClient.get(transactionID + "--_")) || "";
                console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid) throw new Error(EMessage.TransactionTimeOut);
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                const bill = await ent.findOne({
                    where: { transactionID, totalvalue: amount },
                });

                if (!bill) throw new Error(EMessage.billnotfound);
                await redisClient.del(transactionID + "--_");

                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = transactionID;
                bill.changed("paymentref", true);
                bill.paymenttime = new Date();
                bill.changed("paymenttime", true);

                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.waitingt;
                res.message = EMessage.waitingt;
                res.status = 1;

                // let yy = new Array<WebSocketServer.WebSocket>();
                this.getBillProcess(async (b) => {
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
                    console.log("callBackConfirmLAAB", b);
                    console.log(
                        `bill?.machineId`,
                        bill?.machineId,
                        `owneruuid`,
                        ownerUuid
                    );

                    console.log(`s`);

                    this.setBillProces(b);
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
        const x = this.ssocket.sclients.find((v) => {
            const x = v["machineId"] as IMachineClientID;
            if (x) {
                return x.machineId == machineId;
            }
            return false;
        });
        if (x) return x["machineId"] as IMachineClientID;
        return null;
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
                console.log("WS ZDM8");
                console.log(" WS new connection ", ws.url);

                console.log(" WS current connection is alive", ws["isAlive"]);

                ws.onopen = (ev: Event) => {
                    console.log(" WS open", ev);
                };

                // ws['isAlive'] = true;
                ws.onclose = (ev: CloseEvent) => {
                    this.wsClient.find((v, i) => {
                        if (v === ws) {
                            return this.wsClient.splice(i, 1);
                        }
                    });
                };
                ws.onerror = (ev: Event) => {
                    console.log(" WS error", ev);
                };

                //connection is up, let's add a simple simple event
                ws.onmessage = async (ev: MessageEvent) => {
                    let d: IReqModel = {} as IReqModel;
                    // ws['isAlive'] = true;
                    try {
                        console.log(" WS comming", ev.data.toString());

                        d = JSON.parse(ev.data.toString()) as IReqModel;

                        const res = {} as IResModel;
                        if (d.command == EMACHINE_COMMAND.login) {
                            res.command = d.command;
                            res.message = EMessage.loginok;
                            res.status = 1;
                            if (d.token) {
                                const x = d.token as string;
                                console.log(
                                    " WS online machine",
                                    this.ssocket.listOnlineMachines()
                                );
                                let machineId = this.ssocket.findMachineIdToken(x);

                                if (!machineId) throw new Error("machine is not exit");
                                ws["machineId"] = machineId.machineId;
                                ws["clientId"] = uuid4();
                                res.data = { clientId: ws["clientId"] };
                                this.wsClient.push(ws);
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
                                console.log('admintoken', r);

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
                                            else ws.close(0);
                                        })
                                        .catch((e) => {
                                            console.log("Error list machine adminlogin", e);
                                            ws.close(0);
                                        });
                                }
                                else {
                                    findRealDB(token)
                                        .then((rx) => {
                                            try {
                                                const ownerUuid = rx;
                                                console.log('admintoken owneruuid', rx);
                                                if (!ownerUuid) throw new Error(EMessage.notfound);
                                                ws['ownerUuid'] = ownerUuid;
                                                this.machineClientlist
                                                    .findAll({ where: { ownerUuid } })
                                                    .then((ry) => {
                                                        if (ry) {
                                                            const m = ry.map(v => v.machineId);
                                                            // console.log('admintoken owneruuid machines', m);
                                                            redisClient.setEx('_admintoken_' + token, 60 * 60 * 24, ownerUuid);
                                                            ws['myMachineId'] = m;
                                                            ws["clientId"] = uuid4();
                                                            this.wsClient.push(ws);
                                                            ws.send(
                                                                JSON.stringify(
                                                                    PrintSucceeded(d.command, res, EMessage.succeeded, null)
                                                                ));
                                                        }
                                                        else ws.close(0);
                                                    })
                                                    .catch((e) => {
                                                        console.log("Error list machine adminlogin2", e);
                                                        ws.close(0);
                                                    });
                                            } catch (error) {
                                                console.log(error);
                                                ws.close(0)
                                            }

                                        })
                                        .catch((e) => {
                                            console.log(e);
                                            ws.close(0);
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
                                console.log("WS PING", ws['clientId'], ws['myMachineId']);
                                readMachineBalance(ws['machineId']).then(async r => {
                                    console.log('machine balance', r);

                                    let x = await readMachineSetting(ws['machineId']);
                                    let mstatus = await readMachineStatus(ws['machineId']);

                                    console.log('clientid  setting', x);
                                    console.log('clientid  status', mstatus);
                                    const mArray = ws['myMachineId'] as Array<string>;
                                    // console.log('myMachineId', mArray);
                                    let mymstatus = [];
                                    let mymsetting = [];
                                    let mymlimiterbalance = '0';
                                    let mymmachinebalance = [];
                                    let mymlimiter = [];
                                    let setting = {} as any;
                                    try {
                                        let y = [];
                                        if (!x) { setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true, setting.imei = '' }
                                        else {
                                            y = JSON.parse(x) as Array<any>;
                                            setting = y.find(v => v.settingName == 'setting');
                                        }

                                        mymlimiterbalance = (await readMerchantLimiterBalance(ws['ownerUuid'])) || '0';

                                        for (let index = 0; index < mArray?.length; index++) {
                                            const element = mArray[index];

                                            mymstatus.push({ machineId: element, mstatus: await readMachineStatus(element) });

                                            const msetting = JSON.parse(await readMachineSetting(element));
                                            mymsetting.push({ msetting, machineId: element });




                                            const mb = JSON.parse((await readMachineBalance(element)) || '0');
                                            mymmachinebalance.push({ machineId: element, balance: mb });

                                            // const ml = JSON.parse((await readMachineLimiter(element)) || '100000');
                                            mymlimiter.push({ machineId: element, limiter: setting.limiter });
                                        }
                                        // console.log('clientid  my machinestatus', mymstatus, mymsetting, mymlimiterbalance);
                                    } catch (error) {
                                        console.log('parsing error setting', error);
                                        setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true; setting.limiter = 100000; setting.imei = '';
                                    }
                                    console.log('ready to pong');
                                    const limiter = setting.limiter; // TODO: Get limiter 
                                    const merchant = 0; // TODO:Get merchant balance
                                    ws.send(
                                        JSON.stringify(
                                            PrintSucceeded(
                                                "ping",
                                                { command: "ping", production: this.production, balance: r, limiter, merchant, mymmachinebalance, mymlimiterbalance, setting, mstatus, mymstatus, mymsetting, mymlimiter },
                                                EMessage.succeeded
                                                , null
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
    sendWSMyMachine(machineId: string, resx: IResModel) {
        this.wsClient.forEach((v) => {
            const x = v["myMachineId"] as Array<string>;
            // console.log("WS SENDING", x, x?.includes(machineId), v?.readyState);
            if (x?.length && x?.includes(machineId)) {
                // yy.push(v);
                // console.log("WS SENDING", x, v?.readyState);

                v.send(JSON.stringify(resx));
            }
        });

    }
    sendWS(clientId: string, resx: IResModel) {
        this.wsClient.find((v) => {
            const x = v["clientId"] as string;
            console.log("WS SENDING", x, x == clientId, v?.readyState);
            if (x && x == clientId) {
                // yy.push(v);
                console.log("WS SENDING", x, v.readyState);

                v.send(JSON.stringify(resx));
            }
        });


    }
    confirmMMoneyOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirmMmoney(c.tranid_client, Number(c.amount))
                .then((r) => {
                    resolve({ bill: r, transactionID: c.tranid_client });
                })
                .catch((e) => {
                    console.log("error confirmMMoney");
                    reject(e);
                });
        });
    }
    confirmLAABOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirmLAAB(c.tranid_client, Number(c.amount))
                .then((r) => {
                    resolve({ bill: r, transactionID: c.tranid_client });
                })
                .catch((e) => {
                    console.log("error confirmLAABOder");
                    reject(e);
                });
        });
    }
    sendWSToMachine(machineId: string, resx: IResModel) {
        console.log("wsclient", this.wsClient.length);

        this.wsClient.find((v) => {
            const x = v["machineId"] as string;
            console.log("WS SENDING id", x, machineId, x == machineId, v?.readyState);
            if (x && x == machineId) {
                // yy.push(v);
                console.log("WS SENDING machine id", x, v?.readyState);
                v.send(JSON.stringify(resx));
            }
        });
    }
    close() {
        this.wss.close();
        this.ssocket.server.close();
        this.ssocket.sclients.forEach((v) => {
            v.destroy();
        });
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

    loadVendingMachineSaleBillReport(params: ILoadVendingMachineSaleBillReport): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const func = new loadVendingMachineSaleBillReport();
                const run = await func.Init(params);
                if (run.message != IENMessage.success) throw new Error(run);

                resolve(run);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}





