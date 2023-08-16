import axios from "axios";
import e, { NextFunction, Request, Response, Router, query } from "express";
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
    writeActiveMmoneyUser,
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
    IMMoneyGenerateQRPro,
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
    laabHashService,
    logEntity,
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
                    console.log("POST Data", d);

                    if (d.command == EClientCommand.confirmMMoney) {
                        console.log("CB COMFIRM", d);
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
                                y.machineId=machineId.machineId
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
                                redisClient.setEx(qr.qrCode + EMessage.BillCreatedTemp, 60 * 3, ownerUuid);
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
                                    writeErrorLogs('error pos.code',pos);
                                    res.send(
                                        PrintError("retryProcessBill", pos, EMessage.error, returnLog(req, res, true))
                                    );
                                }
                            } catch (error) {
                                console.log("error retryProcessBill", error, returnLog(req, res, true));
                                writeErrorLogs(error.message,error);
                                res.send(
                                    PrintError("retryProcessBill", error, EMessage.error, returnLog(req, res, true))
                                );
                            }
                        });
                        // }, 1000);
                    } catch (error) {
                        console.log(error);
                        writeErrorLogs(error.message,error);
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

            /// demo
            // router.get(this.path + "/submit_command", async (req, res) => {
            //     try {
            //         const machineId = req.query["machineId"] + "";
            //         const position = Number(req.query["position"])
            //             ? Number(req.query["position"])
            //             : 0;
            //         console.log(" WS submit command", machineId, position);
            //         const transactionID = 22331;
            //         const ws: any = this.wsClient.find(
            //             (v) => v["machineId"] + "" == machineId
            //         );
            //         const clientId = ws.clientId;
            //         const m = await machineClientIDEntity.findOne({
            //             where: { machineId },
            //         });
            //         const ownerUuid = m?.ownerUuid || "";
            //         this.getBillProcess((b) => {
            //             b.push({
            //                 ownerUuid,
            //                 position,
            //                 bill: { clientId, machineId } as IVendingMachineBill,
            //                 transactionID,
            //             });
            //             this.setBillProces(b);
            //             console.log("submit_command", transactionID, position);
            //             res.send(
            //                 PrintSucceeded(
            //                     "submit command",
            //                     this.ssocket.processOrder(machineId, position, transactionID),
            //                     EMessage.succeeded
            //                 )
            //             );
            //         });
            //     } catch (error) {
            //         console.log(error);
            //         res.send(PrintError("init", error, EMessage.error));
            //     }
            // });

            /// TODO : HERE
            // router.post(
            //     this.path + "/getSample",
            //     this.checkMachineIdToken.bind(this),
            //     //  this.checkMachineDisabled,
            //     async (req, res) => {
            //         try {
            //             // return res.send(PrintError('getFreeProduct', [], EMessage.error));
            //             const {
            //                 token,
            //                 data: { id, position, clientId },
            //             } = req.body;
            //             const machineId = res.locals["machineId"];
            //             const mc = await machineClientIDEntity.findOne({
            //                 where: { machineId: machineId?.machineId },
            //             });
            //             const ownerUuid = mc?.ownerUuid || "";
            //             const sEnt = VendingMachineSaleFactory(
            //                 EEntity.vendingmachinesale + "_" + ownerUuid,
            //                 dbConnection
            //             );
            //             await sEnt.sync();
            //             const sm = await sEnt.findAll({
            //                 where: {
            //                     stock: {
            //                         id,
            //                         price: 0,
            //                         // qtty: { [Op.gt]: [0] }
            //                     },
            //                     position,
            //                     isActive: true,
            //                 },
            //             });
            //             console.log("sm", sm.length);
            //             const m = sm.find((v) => v.stock.id == id)?.stock;
            //             console.log("s", m);
            //             console.log("token", token, "data,data");
            //             if (!m) throw new Error(EMessage.freeProductNotFoundInThisMachine);
            //             if (m?.price !== 0) throw new Error(EMessage.getFreeProductFailed);
            //             if (m?.qtty <= 0) throw new Error(EMessage.qttyistoolow);
            //             const transactionID = 1000;
            //             // const ws: any = (this.wsClient.find(v => v['machineId'] + '' == machineId));
            //             // const clientId = ws.clientId;
            //             this.getBillProcess((b) => {
            //                 b.push({
            //                     ownerUuid,
            //                     position,
            //                     bill: { clientId, machineId } as IVendingMachineBill,
            //                     transactionID,
            //                 });
            //                 this.setBillProces(b);
            //                 console.log("getFreeProduct", transactionID, position);

            //                 const x = this.ssocket.processOrder(
            //                     machineId?.machineId + "",
            //                     position,
            //                     transactionID
            //                 );
            //                 // writeSucceededRecordLog(m, position);
            //                 console.log(" WS submit command", machineId, position, x);

            //                 res.send(PrintSucceeded("submit command", x, EMessage.succeeded));
            //             });
            //         } catch (error) {
            //             console.log(error);
            //             res.send(PrintError("getFreeProduct", error, EMessage.error));
            //         }
            //     }
            // );
            // router.post(
            //     this.path + "/getFreeProduct",
            //     this.checkMachineIdToken.bind(this),
            //     //  this.checkMachineDisabled,
            //     async (req, res) => {
            //         try {
            //             // return res.send(PrintError('getFreeProduct', [], EMessage.error));
            //             const {
            //                 token,
            //                 data: { id, position, clientId },
            //             } = req.body;
            //             const machineId = res.locals["machineId"];
            //             const mc = await machineClientIDEntity.findOne({
            //                 where: { machineId: machineId?.machineId },
            //             });
            //             const ownerUuid = mc?.ownerUuid || "";
            //             const sEnt = VendingMachineSaleFactory(
            //                 EEntity.vendingmachinesale + "_" + ownerUuid,
            //                 dbConnection
            //             );
            //             await sEnt.sync();
            //             const sm = await sEnt.findAll({
            //                 where: {
            //                     stock: {
            //                         id,
            //                         price: 0,
            //                         // qtty: { [Op.gt]: [0] }
            //                     },
            //                     position,
            //                     isActive: true,
            //                 },
            //             });
            //             console.log("sm", sm.length);
            //             const m = sm.find((v) => v.stock.id == id)?.stock;
            //             console.log("s", m);
            //             console.log("token", token, "data,data");
            //             if (!m) throw new Error(EMessage.freeProductNotFoundInThisMachine);
            //             if (m?.price !== 0) throw new Error(EMessage.getFreeProductFailed);
            //             if (m?.qtty <= 0) throw new Error(EMessage.qttyistoolow);
            //             const transactionID = 1000;
            //             // const ws: any = (this.wsClient.find(v => v['machineId'] + '' == machineId));
            //             // const clientId = ws.clientId;
            //             this.getBillProcess((b) => {
            //                 b.push({
            //                     ownerUuid,
            //                     position,
            //                     bill: { clientId, machineId } as IVendingMachineBill,
            //                     transactionID,
            //                 });
            //                 this.setBillProces(b);
            //                 console.log("getFreeProduct", transactionID, position);

            //                 const x = this.ssocket.processOrder(
            //                     machineId?.machineId + "",
            //                     position,
            //                     transactionID
            //                 );
            //                 // writeSucceededRecordLog(m, position);
            //                 console.log(" WS submit command", machineId, position, x);

            //                 res.send(PrintSucceeded("submit command", x, EMessage.succeeded));
            //             });
            //         } catch (error) {
            //             console.log(error);
            //             res.send(PrintError("getFreeProduct", error, EMessage.error));
            //         }
            //     }
            // );
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
                                {msisdn},
                                { headers: { 'lmm-key':'va157f35a50374ba3a07a5cfa1e7fd5d90e612fb50e3bca31661bf568dcaa5c17' } }
                            )
                            .then((rx) => {
                                console.log("getMmoneyUserInfo", rx);
                                if (rx.status) {
                                    writeActiveMmoneyUser(msisdn+'',JSON.stringify(rx.data));
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
            router.post(
                this.path + "/addProduct",
                this.checkSuperAdmin,
                this.checkSubAdmin,
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
                this.path + "/disableProduct",
                this.checkSuperAdmin,
                this.checkSubAdmin,
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
                        console.log('req.query["isActive"]', !req.query["isActive"], req.query["isActive"], isActive,);

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
                                console.log('disableproduct', r);

                                r.isActive = isActive;
                                console.log('disableproduct', r);
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
                this.checkSubAdmin,
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
                                console.log('deleteProduct', r);
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
                this.checkSubAdmin,
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
                            .findAll({ where: { isActive: { [Op.or]: actives } } })
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
                this.path + "/cloneSale",
                this.checkSuperAdmin,
                this.checkSubAdmin,
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
                this.checkSubAdmin,
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
                                console.log('addSale', o);

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
                this.checkSubAdmin,
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
                this.checkSubAdmin,
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
                this.checkSubAdmin,
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
                                            console.log("changing", r[k]);
                                            if (["stock", "max"].includes(k)) {
                                                r[k] = o[k];
                                                r.changed("stock", true);
                                                console.log("changed", r[k]);
                                            }
                                        });
                                        // r.changed('stock', true);
                                        console.log("update Sale", r);

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
                this.checkSubAdmin,
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
                            .findAll({ where: { isActive: { [Op.or]: actives } } })
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
                        //     .findAll({ where: { isActive: { [Op.or]: actives } } })
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
                        console.log('loadAds', d.data);
                        const machineId = res.locals["machineId"];
                        if (!(machineId?.machineId)) throw new Error(EMessage.notfoundmachine);

                        adsEntity
                            .findAll({ where: { machines: { [Op.contains]: [machineId.machineId] } } })
                            .then((r) => {
                                const latest = r.filter(v => existIds.includes(v.id))?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                console.log(`latest`, latest);
                                const deletingArray = new Array<number>();
                                if (!latest) return res.send(PrintSucceeded("loadAds", { deletingArray: existIds, newArray: r }, EMessage.succeeded, returnLog(req, res)));
                                console.log(`deletingArray`, deletingArray);
                                existIds.forEach(v => {
                                    if (!r.find(r => r.id == v)) deletingArray.push(v);
                                })

                                const newArray = r.filter(v => new Date(v.createdAt).getTime() > new Date(latest.createdAt).getTime());
                                console.log(`newArray`, newArray);
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
                        console.log('saveMachineSalexx', d.data);

                        const machineId = res.locals["machineId"];
                        if (!machineId) throw new Error("machine is not exit");
                        const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId.machineId, dbConnection);
                        await sEnt.sync();

                        // sign

                        const run = await sEnt.findOne({ order: [['id', 'desc']] });
                        console.log(`run der`, run);

                        const calculate = laabHashService.CalculateHash(JSON.stringify(d.data));
                        console.log(`calculate der`, calculate);
                        const sign = laabHashService.Sign(calculate, IFranchiseStockSignature.privatekey);
                        console.log(`sign der`, sign);
                        console.log(`d data der`, d.data);
                        if (run == null) {

                            sEnt.create({
                                data: d.data,
                                hashM: sign,
                                hashP: 'null'
                            }).then(r => {
                                console.log(`save stock successxxxxxx`);
                            }).catch(error => console.log(`save stock fail`));

                        } else {

                            sEnt.create({
                                data: d.data,
                                hashM: sign,
                                hashP: run.hashM
                            }).then(r => {
                                console.log(`save stock successxxx`);
                            }).catch(error => console.log(`save stock fail`));

                        }

                        console.log(`----> machine id der`, machineId.machineId);

                        res.send(
                            PrintSucceeded(
                                "saveMachineSale",
                                writeMachineSale(machineId.machineId, JSON.stringify(d.data)),
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
                        if (run != null) {
                            list = JSON.parse(run);
                            console.log(`load from redis ----->`, list);

                        } else {
                            const sEnt = FranchiseStockFactory(EEntity.franchisestock + "_" + machineId.machineId, dbConnection);
                            await sEnt.sync();

                            list = await sEnt.findOne({ order: [['id', 'desc']] });
                            console.log(`load from databasee ----->`, list);
                            list=list.data;
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
                this.path + "/readMachineSaleForAdmin",
                this.checkSuperAdmin,
                this.checkSubAdmin,
             
                this.checkAdmin,
               
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const machineId = req.body.machineId;
                        console.log(`readMachineSaleForAdmin`, machineId);
                        // const isActive = req.query['isActive'];
                        if (!machineId) throw new Error("machine is not exit");
                        res.send(
                            PrintSucceeded(
                                "readMachineSale",
                                JSON.parse(await readMachineSale(machineId)),
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
                        const machineId =res.locals["machineId"];
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
                // this.checkSubAdmin,
                // this.checkSuperAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                this.checkMachineIdToken.bind(this),
                async (req, res) => {
                    try {
                        const d = req.body as IReqModel;
                        // const isActive = req.query['isActive'];
                        const machineId =res.locals["machineId"];
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
                this.checkSubAdmin,
                this.checkAdmin,
                
                (req, res) => {
                    try {

                        const data = req.body;
                        const subadmin = res.locals['subadmin'];
                        const parmas: ILoadVendingMachineSaleBillReport = {
                            ownerUuid: res.locals["ownerUuid"],
                            machineId: data.machineId,
                            fromDate: data.fromDate,
                            toDate: data.toDate
                        }
                        this.loadVendingMachineSaleBillReport(parmas).then(run => {
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
                        console.log(`machine id der`, res.locals['machineId']);
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
                            .findAll({ where: { isActive: { [Op.or]: actives }, machineId:  machineId.machineId } })
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
                this.checkSubAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];
                        console.log(`owneruuid der`, res.locals["ownerUuid"]);

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
                            .findAll({ where: { machineId, isActive: { [Op.or]: actives } } })
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
                this.checkSubAdmin,
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
                        o.ownerUuid = ownerUuid || "";
                        if (!o.otp || !o.machineId)
                            return res.send(
                                PrintError("addMachine", [], EMessage.bodyIsEmpty, returnLog(req, res, true))
                            );
                        if (o.machineId.length != 8 || Number.isNaN(o.machineId) || Number.isNaN(o.otp))
                            return res.send(
                                PrintError("addMachine", [], EMessage.InvalidMachineIdOrOTP, returnLog(req, res, true))
                            );

                        const x = await this.machineClientlist.findOne({
                            where: { machineId: o.machineId },
                        });
                        if (!x) {
                            // o.photo = base64ToFile(o.photo);
                            this.machineClientlist
                                .create(o)
                                .then((r) => {
                                    this.refreshMachines();
                                    res.send(PrintSucceeded("addMachine", r, EMessage.succeeded, returnLog(req, res)));
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
                                this.refreshMachines();
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
                this.checkSubAdmin,
                this.checkAdmin,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const id = req.query["id"] + "";

                        const o = req.body.data as IMachineClientID;
                        console.log('OOOOOO', o);

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
                                o.data[0].light = !o.data[0]?.light ? false : true;
                                if (!Array.isArray(r.data)) r.data = [r.data];
                                let a = r.data.find(v => v.settingName == 'setting');

                                const x = o.data[0]?.allowVending;
                                const y = o.data[0]?.allowCashIn;
                                const w = o.data[0]?.light;
                                const z = o.data[0]?.highTemp || 10;
                                const u = o.data[0]?.lowTemp || 5;
                                const l = o.data[0]?.limiter || 100000;

                                const imgh = o.data[0]?.imgHeader;
                                const imgf = o.data[0]?.imgFooter;
                                const imgl = o.data[0]?.imgLogo;
                                let t = o.data[0]?.imei || '';
                                if (t && t.length < 8) {
                                    throw new Error('Length can not be less than 8 ')
                                }
                                if (!a) {
                                    a = { settingName: 'setting', allowVending: x, allowCashIn: y, lowTemp: u, highTemp: z, light: w, limiter: l, imei: t, imgHeader: imgh, imgFooter: imgf, imgLogo: imgl };
                                    r.data.push(a);
                                }
                                else {
                                    a.allowVending = x; a.allowCashIn = y, a.light = w; a.highTemp = z; a.lowTemp = u; a.limiter = l, a.imei = t;
                                    a.imgHeader = imgh;
                                    a.imgFooter = imgf;
                                    a.imgLogo = imgl;
                                }

                                // r.data = [a];
                                r.changed('data', true);
                                console.log('updating machine setting', r.data);

                                writeMachineSetting(r.machineId, r.data);
                                res.send(
                                    PrintSucceeded(
                                        "updateMachineSetting",
                                        await r.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
                                this.refreshMachines();

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
                this.path + "/disableMachine",
                this.checkSuperAdmin,
                this.checkSubAdmin,
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
                                this.refreshMachines();
                                res.send(
                                    PrintSucceeded(
                                        "disableMachine",
                                        await r?.save(),
                                        EMessage.succeeded
                                        , returnLog(req, res)
                                    )
                                );
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
                this.path + "/listMachine",
                //APIAdminAccess,
                this.checkSuperAdmin,
                this.checkSubAdmin,
                this.checkAdmin,

                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const isActive = req.query['isActive'];

                        let actives = [];
                        if (isActive == 'all') actives.push(...[true, false]);
                        else actives.push(...isActive == 'yes' ? [true] : [false]);
                        const ownerUuid = res.locals["ownerUuid"] || "";

                        this.machineClientlist.findAll({
                            where: {
                                ownerUuid,
                                isActive: { [Op.or]: actives }
                            }
                        }).then((r) => {
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
            return console.log("deductStock ignore", transactionID);
        if ([22331, 1000].includes(transactionID)) {
            resx.status = 1;
            console.log("deductStock 22231", transactionID);
            resx.transactionID = transactionID || -1;
            resx.data = { bill, position };
            //    return  cres?.res.send(PrintSucceeded('onMachineResponse '+re.transactionID, resx, EMessage.succeeded));
        } else {
            const idx =
                bill?.vendingsales?.findIndex((v) => v.position == position) || -1;
            idx == -1 || !idx ? "" : bill?.vendingsales?.splice(idx, 1);
            resx.status = 1;
            console.log("deductStock xxx", transactionID);
            resx.transactionID = transactionID || -1;
            resx.data = { bill, position };
        }
        const clientId = bill?.clientId + "";
        console.log("send", clientId, bill?.clientId, resx);
        console.log("deductStock", transactionID);

        ///** always retry */
        const retry = -1; // set config and get config at redis and deduct the retry times;
        // if retry == -1 , it always retry
        /// TODO
        // that.setBillProces(b.filter(v => v.transactionID != re.transactionID));
        // writeSucceededRecordLog(cres?.bill, cres?.position);

        that.sendWSToMachine(bill?.machineId + "", resx);
        logEntity.create({body:resx,url:'deductStock'})

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
                // cashInValue = 1100;
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
                    if (!mId) mId=machineId.machineId;
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
            this.ssocket.onMachineResponse((re: IReqModel) => {
                if (re.transactionID == -52) {
                    const machineId = this.ssocket.findMachineIdToken(re.token);
                    writeMachineStatus(machineId.machineId, re.data);
                    const ws = this.wsClient.find(v => v['machineId'] == machineId.machineId);
                    const wsAdmins = this.wsClient.find(v => v['myMachineId']?.includes(machineId.machineId));
                    // console.log('ws', 'wsAdmin', machineId);

                    // const wsAdmin = this.wsClient.filter(v=>v['myMachineId'].includes(machineId.machineId));
                    if (ws) {
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.status;
                        resx.message = EMessage.status;
                        resx.data = re.data;
                        resx.transactionID=re.transactionID ;
                        // save to redis
                        // redisClient.set('_machinestatus_' + machineId.machineId, re.data);
                        // console.log('writeMachineStatus', machineId.machineId, re.data);


                        // send to machine client
                        this.sendWSToMachine(machineId.machineId, resx);
                        logEntity.create({body:resx,superadmin:ws['ownerUuid'],subadmin:ws['ownerUuid'],ownerUuid:ws['ownerUuid'],url:'onMachineResponse'})

                        // this.sendWS(ws['clientId'], resx);
                    }
                    if (wsAdmins) {
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.status;
                        resx.message = EMessage.status;
                        resx.data = re.data;
                        resx.transactionID=re.transactionID ;
                        // save to redis
                        // redisClient.set('_machinestatus_' + machineId.machineId, re.data);
                        // console.log('writeMachineStatus', machineId.machineId, re.data);
                        // send to machine client
                        this.sendWSMyMachine(machineId.machineId, resx);
                        logEntity.create({body:resx,superadmin:wsAdmins['ownerUuid'],subadmin:wsAdmins['ownerUuid'],ownerUuid:wsAdmins['ownerUuid'],url:'onMachineResponse'})
                    }
                    // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
                    // fafb52
                    // 21 //len
                    // 54 // series
                    // 00 // bill acceptor
                    // 01 // coin acceptor
                    // 00 // card reader status
                    // 00 // tem controller status
                    // 13 // temp
                    // 00 // door 
                    // 00000000 // bill change
                    // 00000000 // coin change
                    // 30303030303030303030
                    // 13aaaaaaaaaaaaaa8d
                    // // fafb header
                    // // 52 command
                    // // 01 length
                    // // Communication number+ 
                    // '00'//Bill acceptor status+ 
                    // '00'//Coin acceptor status+ 
                    // '00'// Card reader status+
                    // '00'// Temperature controller status+ 
                    // '00'// Temperature+ 
                    // '00'// Door status+ 
                    // '00 00 00 00'// Bill change(4 byte)+ 
                    // '00 00 00 00'// Coin change(4 byte)+ 
                    // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) + 
                    // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
                    // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)

                    console.log('FAFB52', re.data);

                    return;
                }
                console.log("onMachineResponse", re);
                console.log("onMachineResponse transactionID", re.transactionID);
                this.getBillProcess((b) => {
                    const cres = b.find((v) => v.transactionID == re.transactionID);
                    try {
                        const machineId = this.ssocket.findMachineIdToken(re.token);
                        // writeMachineStatus(machineId.machineId, re.data);
                        const ws = this.wsClient.find(v => v['machineId'] == machineId.machineId);
                        const wsAdmins = this.wsClient.find(v => v['myMachineId']?.includes(machineId.machineId));
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.status;
                        resx.message = EMessage.status;
                        resx.data = re.data;
                        resx.transactionID=re.transactionID ;
                        if(wsAdmins)
                        logEntity.create({body:resx,superadmin:wsAdmins['ownerUuid'],subadmin:wsAdmins['ownerUuid'],ownerUuid:wsAdmins['ownerUuid'],url:'onMachineResponse'})
                        if(ws)
                        logEntity.create({body:resx,superadmin:ws['ownerUuid'],subadmin:ws['ownerUuid'],ownerUuid:ws['ownerUuid'],url:'onMachineResponse'})

                        // vmc response with transactionId and buffer data
                        // zdm8 reponse with transactionId

                        // check by transactionId and command data (command=status)

                        // if need to confirm with drop detect
                        // we should use drop detect to audit
                        that.deductStock(re.transactionID, cres?.bill, cres?.position);

                        // const resx = {} as IResModel;
                        // resx.command = EMACHINE_COMMAND.confirm;
                        // resx.message = EMessage.confirmsucceeded;
                        // if (re.transactionID < 0) return console.log('onMachineResponse ignore', re);
                        // if ([22331, 1000].includes(re.transactionID)) {

                        //     resx.status = 1;
                        //     console.log('onMachineResponse 22231', re);
                        //     resx.transactionID = re.transactionID || -1;
                        //     resx.data = { bill: cres?.bill, position: cres?.position };
                        //     //    return  cres?.res.send(PrintSucceeded('onMachineResponse '+re.transactionID, resx, EMessage.succeeded));

                        // } else {
                        //     const idx = cres?.bill?.vendingsales?.findIndex(v => v.position == cres?.position) || -1;
                        //     idx == -1 || !idx ? cres?.bill.vendingsales?.splice(idx, 1) : '';
                        //     resx.status = 1;
                        //     console.log('onMachineResponse xxx', re);
                        //     resx.transactionID = re.transactionID || -1;
                        //     resx.data = { bill: cres?.bill, position: cres?.position };
                        // }
                        // const clientId = cres?.bill.clientId + '';
                        // console.log('send', clientId, cres?.bill?.clientId, resx);
                        // console.log('onMachineResponse', re.transactionID);
                        // console.log('keep', b.filter(v => v.transactionID != re.transactionID).map(v => v.transactionID));

                        // ///** always retry */
                        // const retry = -1; // set config and get config at redis and deduct the retry times;
                        // // if retry == -1 , it always retry
                        // /// TODO
                        // // that.setBillProces(b.filter(v => v.transactionID != re.transactionID));
                        // // writeSucceededRecordLog(cres?.bill, cres?.position);

                        // that.sendWSToMachine(cres?.bill?.machineId + '', resx);
                        // /// DEDUCT STOCK AT THE SERVER HERE

                        // // No need To update delivering status
                        // // const entx = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + cres?.ownerUuid, dbConnection);
                        // // entx.findAll({ where: { machineId: cres?.bill.machineId, paymentstatus: EPaymentStatus.paid } }).then(async rx => {
                        // //     try {
                        // //         const bill = rx.find(v => v.transactionID ==cres?.transactionID);
                        // //         if (bill) {
                        // //             bill.paymentstatus = EPaymentStatus.delivered;
                        // //             bill.changed('paymentstatus', true);
                        // //             bill.save();
                        // //         } else throw new Error(EMessage.transactionnotfound);

                        // //         // }
                        // //     } catch (error) {
                        // //         console.log(error);
                        // //     }
                        // // }).catch(e => {
                        // //     console.log('ERROR', e);

                        // // })
                    } catch (error) {
                        console.log("error onMachineResponse", error);
                        logEntity.create({body:error,url:'onMachineResponse'});
                        // cres?.res.send(PrintError('onMachineResponse', error, EMessage.error));
                    }
                });
            });

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


    generateBillMMoneyPro(merchantNumber: string, value: number, transID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney

                        const qr = {
                            amount: value + "",
                            merchantNumber, // '2055220199',
                            transID,
                        } as IMMoneyGenerateQRPro;
                        console.log("QR", qr);

                        axios
                            .post<IMMoneyGenerateQRRes>(
                                "https://qr.mmoney.la/pro/GenerateQR_v2",
                                qr,
                                { headers: { 'lmm-key':'va157f35a50374ba3a07a5cfa1e7fd5d90e612fb50e3bca31661bf568dcaa5c17' } }
                            )
                            .then((rx) => {
                                console.log("generateBillMMoneyPro", rx);
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

    callBackConfirmMmoney(qr:string) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log('QR code',qr);

                // const ownerUuid = (await redisClient.get(transactionID + EMessage.BillCreatedTemp)) || ""; TODO LATER
                const ownerUuid = (await redisClient.get(qr + EMessage.BillCreatedTemp)) || "";
                console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid && this.production)
                    throw new Error(EMessage.TransactionTimeOut);
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                const bill = await ent.findOne({
                    where: { qr },
                });

                if (!bill) throw new Error(EMessage.billnotfound);
                await redisClient.del(qr + EMessage.BillCreatedTemp);

                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = bill.transactionID+'';
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

    callBackConfirmLAAB(qr: string) {
        return new Promise<IVendingMachineBill>(async (resolve, reject) => {
            try {
                console.log('QR Code confirm',qr);

                const ownerUuid = (await redisClient.get(qr + EMessage.BillCreatedTemp)) || "";
                console.log("GET transactionID by owner", ownerUuid);
                if (!ownerUuid) throw new Error(EMessage.TransactionTimeOut);
                const ent = VendingMachineBillFactory(
                    EEntity.vendingmachinebill + "_" + ownerUuid,
                    dbConnection
                );
                const bill = await ent.findOne({
                    where: { qr:qr },
                });

                if (!bill) throw new Error(EMessage.billnotfound);
                await redisClient.del(qr + EMessage.BillCreatedTemp);

                bill.paymentstatus = EPaymentStatus.paid;
                bill.changed("paymentstatus", true);
                bill.paymentref = bill.transactionID+'';
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
    confirmMMoneyOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirmMmoney(c?.qrcode)
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


export class loadVendingMachineSaleBillReport {

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
                resolve(error.message);
            }
        });
    }

}


