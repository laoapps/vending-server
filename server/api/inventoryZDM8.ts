import axios from "axios";
import { NextFunction, Request, Response, Router } from "express";
import * as WebSocketServer from "ws";
import { randomUUID } from "crypto";
import cryptojs from "crypto-js";
import {
    broadCast,
    findRealDB,
    PrintError,
    PrintSucceeded,
    readMerchantLimiterBalance,
    readMachineLimiter,
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
} from "../entities/system.model";
import moment from "moment";
import { stringify, v4 as uuid4 } from "uuid";
import { setWsHeartbeat } from "ws-heartbeat/server";
import { SocketServerZDM8 } from "./socketServerZDM8";
import {
    MachineIDFactory,
    MachineIDStatic,
} from "../entities/machineid.entity";
import {
    dbConnection,
    machineClientIDEntity,
    machineIDEntity,
    stockEntity,
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
} from "../entities/vendingmachinebill.entity";
import { Op } from "sequelize";
import fs from "fs";
import { getNanoSecTime } from "../services/service";
import { APIAdminAccess, IENMessage } from "../services/laab.service";
import { CashValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashValidation.func";
import {
    BillCashInFactory,
    BillCashInStatic,
} from "../entities/billcash.entity";
import { CashinValidationFunc } from "../laab_service/controllers/vendingwallet_client/funcs/cashinValidation.func";
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
    production = false;

    // public phonenumber = this.production ? '2052396969':'2054445447'// '2058623333' : '2054445447'; //LTC. 2058623333 //2052899515
    // public walletId = this.production ? '2599087166' : '2843759248';// LTC
    public phonenumber = this.production ? "2052396969" : "2054445447";
    public walletId = "2843759248";

    mmoneyusername = "dbk";
    mmoneypassword = "dbk@2022";
    // mmoneyusername= '2c7eb4906d4ab65f72fc3d3c8eebeb65';
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

    checkMachineIdToken(req: Request, res: Response, next: NextFunction) {
        const { token } = req.body;
        res.locals["machineId"] = this.ssocket.findMachineIdToken(token);
        if (!res.locals["machineId"]) {
            return res.send(PrintError("MachineNotFound", [], EMessage.error));
        } else next();
    }
    checkMachineDisabled(req: Request, res: Response, next: NextFunction) {
        this.isMachineDisabled(res.locals["machineId"].machineId)
            .then((r) => {
                if (r) {
                    return res.send(
                        PrintError("machine was disabled", [], EMessage.error)
                    );
                } else next();
            })
            .catch((e) => {
                return res.send(PrintError("checkMachineDisabled", e, EMessage.error));
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
                        this.callBackConfirmMmoney(c.tranid_client, Number(c.amount))
                            .then((r) => {
                                res.send(
                                    PrintSucceeded(
                                        d.command,
                                        { bill: r, transactionID: c.tranid_client },
                                        EMessage.succeeded
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error confirmMMoney");
                                writeLogs(c, "", "_E_Confirm");
                                res.send(PrintError(d.command, e, EMessage.error));
                            });
                    } else if (d.command == "processorder") {
                        console.log("process orders", d);
                        // c.wallet_ids
                        try {
                            const { token, transactionID } = d.data;
                            const machineId =
                                this.ssocket.findMachineIdToken(token)?.machineId;
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
                                            EMessage.succeeded
                                        )
                                    );
                                } else {
                                    res.send(
                                        PrintError("submit command", [], "position not found")
                                    );
                                }
                            });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("init", error, EMessage.error));
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
                                    res.send(PrintSucceeded("listSale", r, EMessage.succeeded));
                                })
                                .catch((e) => {
                                    res.send(PrintError("listSale", e, EMessage.error));
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
                            const transactionID = Number(
                                Number(
                                    machineId.machineId.substring(machineId.machineId.length - 5)
                                ) +
                                "" +
                                new Date().getTime()
                            );
                            const qr = await this.generateBillMMoney(
                                value,
                                transactionID + ""
                            );
                            if (!qr.qrCode) throw new Error(EMessage.GenerateQRMMoneyFailed);
                            const bill = {
                                uuid: uuid4(),
                                clientId,
                                qr: qr.qrCode,
                                transactionID,
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
                                res.send(PrintSucceeded(d.command, r, EMessage.succeeded));
                            });
                        } else {
                            res.send(PrintError(d.command, [], EMessage.notsupport));
                        }
                    }
                } catch (error: any) {
                    console.log("error", error);
                    res.send(
                        PrintError(d.command, this.production || error, error.message)
                    );
                }
            });
            router.post(this.path + "/credit", (req, res) => {
                const d = req.body as IReqModel;
                // this.creditMachine(d);
                res.send({ message: "wait", status: 1 });
            });
            router.post(this.path + "/refresh", this.checkToken, async (req, res) => {
                try {
                    this.wsClient.find((v) => {
                        if (
                            v.OPEN &&
                            v["machineId"] == res.locals["machineId"]?.machineId &&
                            v["machineId"]
                        ) {
                            // v.send(JSON.stringify(PrintSucceeded('refresh', true, EMessage.succeeded)));
                            this.sendWSToMachine(
                                v["machineId"],
                                PrintSucceeded("refresh", true, EMessage.succeeded)
                            );
                        }
                    });
                    // this.wss.clients.forEach(v => {
                    //     if (v.OPEN && v['machineId'] == res.locals['machineId']?.machineId && v['machineId']) {
                    //         v.send(JSON.stringify(PrintSucceeded('refresh', true, EMessage.succeeded)));
                    //     }
                    // })

                    res.send(PrintSucceeded("refresh", true, EMessage.succeeded));
                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError("init", error, error.message));
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
                                    EMessage.succeeded
                                )
                            );
                        });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getDeliveryingBills", error, EMessage.error));
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
                                res.send(PrintSucceeded("getPaidBills", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                res.send(PrintError("init", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getPaidBills", error, EMessage.error));
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
                                res.send(PrintSucceeded("getPaidBills", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                res.send(PrintError("getBills", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getBills", error, EMessage.error));
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
                                PrintError("retryProcessBill", [], EMessage.error + ' too fast')
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
                                            EMessage.succeeded
                                        )
                                    );
                                } else {
                                    res.send(
                                        PrintError("retryProcessBill", pos, EMessage.error)
                                    );
                                }
                            } catch (error) {
                                console.log("error retryProcessBill", error);

                                res.send(
                                    PrintError("retryProcessBill", error, EMessage.error)
                                );
                            }
                        });
                        // }, 1000);
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("retryProcessBill", error, EMessage.error));
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
                                    PrintSucceeded("getAllPaidBills", r, EMessage.succeeded)
                                );
                            })
                            .catch((e) => {
                                res.send(PrintError("getAllPaidBills", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getAllPaidBills", error, EMessage.error));
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
                                res.send(PrintSucceeded("getAllBills", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                res.send(PrintError("getAllBills", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getAllBills", error, EMessage.error));
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
                        )
                    );
                } catch (error) {
                    console.log(error);
                    res.send(PrintError("init", error, EMessage.error));
                }
            });

            /// demo
            router.get(this.path + "/submit_command", async (req, res) => {
                try {
                    const machineId = req.query["machineId"] + "";
                    const position = Number(req.query["position"])
                        ? Number(req.query["position"])
                        : 0;
                    console.log(" WS submit command", machineId, position);
                    const transactionID = 22331;
                    const ws: any = this.wsClient.find(
                        (v) => v["machineId"] + "" == machineId
                    );
                    const clientId = ws.clientId;
                    const m = await machineClientIDEntity.findOne({
                        where: { machineId },
                    });
                    const ownerUuid = m?.ownerUuid || "";
                    this.getBillProcess((b) => {
                        b.push({
                            ownerUuid,
                            position,
                            bill: { clientId, machineId } as IVendingMachineBill,
                            transactionID,
                        });
                        this.setBillProces(b);
                        console.log("submit_command", transactionID, position);
                        res.send(
                            PrintSucceeded(
                                "submit command",
                                this.ssocket.processOrder(machineId, position, transactionID),
                                EMessage.succeeded
                            )
                        );
                    });
                } catch (error) {
                    console.log(error);
                    res.send(PrintError("init", error, EMessage.error));
                }
            });

            /// TODO : HERE
            router.post(
                this.path + "/getSample",
                this.checkMachineIdToken.bind(this),
                //  this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        // return res.send(PrintError('getFreeProduct', [], EMessage.error));
                        const {
                            token,
                            data: { id, position, clientId },
                        } = req.body;
                        const machineId = res.locals["machineId"];
                        const mc = await machineClientIDEntity.findOne({
                            where: { machineId: machineId?.machineId },
                        });
                        const ownerUuid = mc?.ownerUuid || "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        const sm = await sEnt.findAll({
                            where: {
                                stock: {
                                    id,
                                    price: 0,
                                    // qtty: { [Op.gt]: [0] }
                                },
                                position,
                                isActive: true,
                            },
                        });
                        console.log("sm", sm.length);
                        const m = sm.find((v) => v.stock.id == id)?.stock;
                        console.log("s", m);
                        console.log("token", token, "data,data");
                        if (!m) throw new Error(EMessage.freeProductNotFoundInThisMachine);
                        if (m?.price !== 0) throw new Error(EMessage.getFreeProductFailed);
                        if (m?.qtty <= 0) throw new Error(EMessage.qttyistoolow);
                        const transactionID = 1000;
                        // const ws: any = (this.wsClient.find(v => v['machineId'] + '' == machineId));
                        // const clientId = ws.clientId;
                        this.getBillProcess((b) => {
                            b.push({
                                ownerUuid,
                                position,
                                bill: { clientId, machineId } as IVendingMachineBill,
                                transactionID,
                            });
                            this.setBillProces(b);
                            console.log("getFreeProduct", transactionID, position);

                            const x = this.ssocket.processOrder(
                                machineId?.machineId + "",
                                position,
                                transactionID
                            );
                            // writeSucceededRecordLog(m, position);
                            console.log(" WS submit command", machineId, position, x);

                            res.send(PrintSucceeded("submit command", x, EMessage.succeeded));
                        });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getFreeProduct", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/getFreeProduct",
                this.checkMachineIdToken.bind(this),
                //  this.checkMachineDisabled,
                async (req, res) => {
                    try {
                        // return res.send(PrintError('getFreeProduct', [], EMessage.error));
                        const {
                            token,
                            data: { id, position, clientId },
                        } = req.body;
                        const machineId = res.locals["machineId"];
                        const mc = await machineClientIDEntity.findOne({
                            where: { machineId: machineId?.machineId },
                        });
                        const ownerUuid = mc?.ownerUuid || "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        const sm = await sEnt.findAll({
                            where: {
                                stock: {
                                    id,
                                    price: 0,
                                    // qtty: { [Op.gt]: [0] }
                                },
                                position,
                                isActive: true,
                            },
                        });
                        console.log("sm", sm.length);
                        const m = sm.find((v) => v.stock.id == id)?.stock;
                        console.log("s", m);
                        console.log("token", token, "data,data");
                        if (!m) throw new Error(EMessage.freeProductNotFoundInThisMachine);
                        if (m?.price !== 0) throw new Error(EMessage.getFreeProductFailed);
                        if (m?.qtty <= 0) throw new Error(EMessage.qttyistoolow);
                        const transactionID = 1000;
                        // const ws: any = (this.wsClient.find(v => v['machineId'] + '' == machineId));
                        // const clientId = ws.clientId;
                        this.getBillProcess((b) => {
                            b.push({
                                ownerUuid,
                                position,
                                bill: { clientId, machineId } as IVendingMachineBill,
                                transactionID,
                            });
                            this.setBillProces(b);
                            console.log("getFreeProduct", transactionID, position);

                            const x = this.ssocket.processOrder(
                                machineId?.machineId + "",
                                position,
                                transactionID
                            );
                            // writeSucceededRecordLog(m, position);
                            console.log(" WS submit command", machineId, position, x);

                            res.send(PrintSucceeded("submit command", x, EMessage.succeeded));
                        });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("getFreeProduct", error, EMessage.error));
                    }
                }
            );

            router.post(
                this.path + "/addProduct",
                this.checkToken,
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
                                    PrintError("addProduct", [], EMessage.bodyIsEmpty)
                                );
                            // let base64Image = o.image.split(';base64,').pop();
                            // fs.writeFileSync(process.env._image_path+'/'+o.name+'_'+new Date().getTime(), base64Image+'', {encoding: 'base64'});
                            sEnt
                                .create(o)
                                .then((r) => {
                                    res.send(PrintSucceeded("addProduct", r, EMessage.succeeded));
                                })
                                .catch((e) => {
                                    console.log("error add product", e);

                                    res.send(PrintError("addProduct", e, EMessage.error));
                                });
                        } catch (error) {
                            console.log(error);
                            res.send(PrintError("addProduct", error, EMessage.error));
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/disableProduct",
                this.checkToken,
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
                                        PrintError("disableProduct", [], EMessage.error)
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
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error disable product", e);

                                res.send(PrintError("disableProduct", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableProduct", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/listProduct",
                this.checkToken,
                // this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const sEnt = StockFactory(
                            EEntity.product + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll()
                            .then((r) => {
                                res.send(PrintSucceeded("listProduct", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                console.log("error list product", e);

                                res.send(PrintError("listProduct", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listProduct", error, EMessage.error));
                    }
                }
            );

            router.post(
                this.path + "/addSale",
                this.checkToken,
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
                                return res.send(PrintError("addSale", [], EMessage.notfound));
                            if (!o.machineId || Number(o.position) == Number.NaN)
                                return res.send(
                                    PrintError("addSale", [], EMessage.bodyIsEmpty)
                                );
                            const pEnt = StockFactory(
                                EEntity.product + "_" + ownerUuid,
                                dbConnection
                            );
                            pEnt.findByPk(o.stock.id).then((p) => {
                                if (!p)
                                    return res.send(
                                        PrintError("addSale", [], EMessage.productNotFound)
                                    );
                                o.stock = p;
                                p.qtty = 0;
                                sEnt
                                    .findOne({ where: { position: o.position } })
                                    .then((rx) => {
                                        if (rx)
                                            return res.send(
                                                PrintError("addSale", [], EMessage.duplicatedPosition)
                                            );
                                        sEnt
                                            .create(o)
                                            .then((r) => {
                                                res.send(
                                                    PrintSucceeded("addSale", r, EMessage.succeeded)
                                                );
                                            })
                                            .catch((e) => {
                                                console.log("error add sale", e);
                                                res.send(PrintError("addSale", e, EMessage.error));
                                            });
                                    })
                                    .catch((e) => {
                                        console.log(e);

                                        res.send(PrintError("addSale", e, EMessage.error));
                                    });
                            });
                        });
                }
            );
            router.post(
                this.path + "/deleteSale",
                this.checkToken,
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
                                    return res.send(PrintError("deleteSale", [], EMessage.error));

                                res.send(PrintSucceeded("deleteSale", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                console.log("error deleteSale", e);

                                res.send(PrintError("deleteSale", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("deleteSale", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/disableSale",
                this.checkToken,
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
                                        PrintError("disableSale", [], EMessage.error)
                                    );
                                r.isActive = isActive;
                                r.changed("isActive", true);
                                res.send(
                                    PrintSucceeded(
                                        "disableSale",
                                        await r.save(),
                                        EMessage.succeeded
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("error disable product", e);

                                res.send(PrintError("disableSale", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableSale", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/updateSale",
                this.checkToken,
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
                                        PrintError("updateSale", [], EMessage.notfound)
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
                                                PrintError("updateSale", [], EMessage.productNotFound)
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
                                            )
                                        );
                                    })
                                    .catch((e) => {
                                        console.log("error updatesale", e);
                                        res.send(PrintError("updateSale", e, EMessage.error));
                                    });
                            })
                            .catch((e) => {
                                console.log("error updatesale", e);

                                res.send(PrintError("updateSale", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log("error update sale", error);
                        res.send(PrintError("updateSale", error, EMessage.error));
                    }
                }
            );

            router.post(
                this.path + "/listSale",
                this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll()
                            .then((r) => {
                                res.send(PrintSucceeded("listSale", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                console.log("error list sale", e);

                                res.send(PrintError("listSale", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSale", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/listSaleByMachine",
                this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const machineId = req.query["machineId"] + "";
                        const sEnt = VendingMachineSaleFactory(
                            EEntity.vendingmachinesale + "_" + ownerUuid,
                            dbConnection
                        );
                        await sEnt.sync();
                        sEnt
                            .findAll({ where: { machineId } })
                            .then((r) => {
                                res.send(
                                    PrintSucceeded("listSaleByMachine", r, EMessage.succeeded)
                                );
                            })
                            .catch((e) => {
                                console.log("error listSaleByMachine", e);
                                res.send(PrintError("listSaleByMachine", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listSaleByMachine", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/reportStock",
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("reportStock", error, EMessage.error));
                    }
                }
            );

            router.post(
                this.path + "/addMachine",
                this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        const o = req.body.data as IMachineClientID;
                        o.ownerUuid = ownerUuid || "";
                        if (!o.otp || !o.machineId)
                            return res.send(
                                PrintError("addMachine", [], EMessage.bodyIsEmpty)
                            );

                        // r.changed('isActive',true);
                        const x = await this.machineClientlist.findOne({
                            where: { machineId: o.machineId },
                        });
                        if (!x) {
                            this.machineClientlist
                                .create(o)
                                .then((r) => {
                                    this.refreshMachines();
                                    res.send(PrintSucceeded("addMachine", r, EMessage.succeeded));
                                })
                                .catch((e) => {
                                    console.log(e);
                                    res.send(PrintError("addMachine", e, EMessage.error));
                                });
                        } else {
                            res.send(
                                PrintError("addMachine", "Machine ID exist", EMessage.error)
                            );
                        }
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("addProduct", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/updateMachine",
                this.checkToken,
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
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
                                        PrintError("updateMachine", [], EMessage.notfound)
                                    );
                                r.otp = o.otp ? o.otp : r.otp;
                                // r.machineId = o.machineId ? o.machineId : r.machineId;
                                r.photo = o.photo ? o.photo : r.photo;
                                // r.changed('isActive',true);

                                res.send(
                                    PrintSucceeded(
                                        "updateMachine",
                                        await r.save(),
                                        EMessage.succeeded
                                    )
                                );
                                this.refreshMachines();
                            })
                            .catch((e) => {
                                console.log("Error updateMachine", e);
                                res.send(PrintError("updateMachine", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updateMachine", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/updateMachineSetting",
                this.checkToken,
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
                                        PrintError("updateMachineSetting", [], EMessage.notfound)
                                    );
                                if (!r.data) r.data = [];

                                if (!Array.isArray(o.data)) o.data = [];
                                o.data[0].allowVending = o.data[0]?.allowVending == '' ? false : true;
                                o.data[0].allowCashIn = o.data[0]?.allowCashIn == '' ? false : true;
                                o.data[0].light = o.data[0]?.light == '' ? false : true;

                                const data = r.data.find(v => v.settingName == 'setting');

                                const x = o.data[0]?.allowVending || true;
                                const y = o.data[0]?.allowCashIn || true;
                                const w = o.data[0]?.light || true;
                                const z = o.data[0]?.highTemp || 10;
                                const u = o.data[0]?.lowTemp || 5;
                                const a = data.find(v => v.settingName == 'setting');
                                if (!a) r.data.push({ settingName: 'setting', allowVending: x, allowCashIn: y, lowTemp: u, highTemp: z, light: w });
                                else { a.allowVending = x; a.allowCashIn = y, a.light = w; a.highTemp = z; a.lowTemp = u }

                                r.data = data;
                                r.changed('data', true);

                                writeMachineSetting(r.machineId, r.data);
                                res.send(
                                    PrintSucceeded(
                                        "updateMachineSetting",
                                        await r.save(),
                                        EMessage.succeeded
                                    )
                                );
                                this.refreshMachines();

                            })
                            .catch((e) => {
                                console.log("Error updateMachineSetting", e);
                                res.send(PrintError("updateMachineSetting", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("updateMachineSetting", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/disableMachine",
                this.checkToken.bind(this),
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
                                        PrintError("disableMachine", [], EMessage.notfound)
                                    );
                                r.isActive = isActive;
                                // r.changed('isActive',true);
                                this.refreshMachines();
                                res.send(
                                    PrintSucceeded(
                                        "disableMachine",
                                        await r?.save(),
                                        EMessage.succeeded
                                    )
                                );
                            })
                            .catch((e) => {
                                console.log("Error disableMachine", e);
                                res.send(PrintError("disableMachine", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("disableMachine", error, EMessage.error));
                    }
                }
            );

            router.post(
                this.path + "/listMachine",
                //APIAdminAccess,
                this.checkToken,
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals["ownerUuid"] || "";
                        this.machineClientlist
                            .findAll({ where: { ownerUuid } })
                            .then((r) => {
                                res.send(PrintSucceeded("listMachine", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                console.log("Error list machine", e);

                                res.send(PrintError("listMachine", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listMachine", error, EMessage.error));
                    }
                }
            );
            router.post(
                this.path + "/super_listMachine",
                // this.checkToken.bind(this),
                // this.isSuper.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        this.machineClientlist
                            .findAll()
                            .then((r) => {
                                res.send(PrintSucceeded("listMachine", r, EMessage.succeeded));
                            })
                            .catch((e) => {
                                console.log("Error list machine", e);
                                res.send(PrintError("listMachine", e, EMessage.error));
                            });
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError("listMachine", error, EMessage.error));
                    }
                }
            );
        } catch (error) {
            console.log(error);
        }
    }

    checkToken(req: Request, res: Response, next: NextFunction) {
        try {
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
    processingCreditQueques=new Array<string>();
    async creditMachine(d: IReqModel) {
            try {
                const that = this;
                // check if it in the Queque
                if(this.processingCreditQueques.find(v=>v==d.transactionID+''))
                     throw new Error('TOO FAST '+d.transactionID);
                    else
                    this.processingCreditQueques.push(d.transactionID+'');


                // find in redis
                let ack = await readACKConfirmCashIn(d.transactionID + '');
                let machineId = this.ssocket.findMachineIdToken(d.token);
                if (!ack) {
                    // double check in database
                    const r = await this.loadBillCash(machineId.machineId, d.transactionID)
                    if (r?.length) {
                        await writeACKConfirmCashIn(d.transactionID + '');
                        ack = 'yes';
                    }
                }
                
                
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
    
                console.log('FOUND ACK EXIST TRANSACTIONID', ack, d.transactionID);
    
                const bsi = {} as IBillCashIn;
                bsi.clientId = ws["clientId"];
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
                
                if (ack) {
                    readMachineSetting(machineId.machineId).then(async r => {
                        let setting = {} as any
                        if (r) {
                            try {
                                setting = JSON.parse(r);
                            } catch (error) {
                                console.log('error parsing setting 2', error);
                                setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true;
                            }
                        }
                        const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                        const limiter = await readMachineLimiter(machineId.machineId);
                        this.updateBillCash(bsi, machineId.machineId, d.transactionID);
                        await writeACKConfirmCashIn(d.transactionID + '');
                        that.ssocket.updateBalance(machineId.machineId, { balance: balance || 0, limiter, setting, confirmCredit: true, transactionID: d.transactionID })
                        ws.send(
                            JSON.stringify(
                                PrintSucceeded(d.command, res, EMessage.succeeded)
                            )
                        )
                        // finish the process allow next queque with exist TransactionID
                        console.log('finish the process allow next queque with exist TransactionID',d.transactionID);
                        
                        this.processingCreditQueques = this.processingCreditQueques.filter(v=>v!==d.transactionID+'');
                    })
    
                    return;
                } else {
                    if (!machineId) throw new Error("machine is not exist");
                    const sock = that.ssocket.findOnlneMachine(machineId.machineId);
                    if (!sock) throw new Error("machine is not online");
                    // that.ssocket.terminateByClientClose(machineId.machineId)
                    const hashnotes = this.initHashBankNotes(machineId.machineId);
    
                    console.log('hashnotes',hashnotes);
                    
    
                    if (d?.token) {
    
    
                        console.log("billCashIn", d?.data);
    
                        // bsi.requestor = requestor;
                        // that.push(bsi);
                        //
                        const hn = hashnotes.find((v) => v.hash == d?.data + "");
                        if (hn != undefined && Object.entries(hn).length == 0) {
                            ws.send(
                                JSON.stringify(
                                    PrintError(d.command, [], EMessage.invalidBankNote + " 0")
                                )
                            );
                            return;
                        }
                        console.log("hn", hn);
                        const bn = this.notes.find((v) => v.value == hn?.value);
                        if (bn != undefined && Object.entries(bn).length == 0) {
                            ws.send(
                                JSON.stringify(PrintError(d.command, [], EMessage.invalidBankNote))
                            );
                            return;
                        }
                        console.log("bn", bn);
    
                        // *** cash in here
                        const func = new CashinValidationFunc();
                        const params = {
                            cash: bn.value,
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
                                
                                this.processingCreditQueques = this.processingCreditQueques.filter(v=>v!==d.transactionID+'');
                                writeACKConfirmCashIn(d.transactionID + '');
                                console.log(`response cash in validation`, run);
                                if (run.message != IENMessage.success) throw new Error(run);
                                bsi.bankNotes.push(bn);
                                res.data = { clientId: ws["clientId"], billCashIn: bsi, bn };
                                that.updateBillCash(bsi, machineId.machineId, bsi.transactionID);
                                console.log(`sw sender`, d.command, res.data);
                                redisClient.set('_balance_' + ws['clientId'], bn.value);
    
                                readMachineSetting(machineId.machineId).then(async r => {
                                    let setting = {} as any
                                    if (r) {
                                        try {
                                            setting = JSON.parse(r);
                                        } catch (error) {
                                            console.log('error parsing setting 2', error);
                                            setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true;
                                        }
                                    }
                                    const balance = await readMerchantLimiterBalance(machineId.ownerUuid);
                                    const limiter = await readMachineLimiter(machineId.machineId);
    
                                    that.ssocket.updateBalance(machineId.machineId, { balance: balance || 0, limiter, setting, confirmCredit: true, transactionID: bsi.transactionID })
                                    ws.send(
                                        JSON.stringify(
                                            PrintSucceeded(d.command, res, EMessage.succeeded)
                                        )
                                    )
                                })
                            })
                            .catch((error) => {
                                console.log(`error cash in validation`, error.message);
                                bsi.badBankNotes.push(bn);
                                res.data = { clientId: ws["clientId"], billCashIn: bsi, bn };
                                that.updateBadBillCash(bsi, machineId?.machineId, bsi?.transactionID);
    
                                if (error.transferFail == true) {
                                    console.log(`error`, error.message);
                                    this.updateInsuffBillCash(bsi);
                                }
    
                                ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
                            });
    
                        // const requestor = this.requestors.find(v => v.transID == d.data.transID);
    
                        // if (!requestor) throw new Error('Requestor is not exist');
                    } else {
                        // throw new Error(EMessage.MachineIdNotFound)
                        ws.send(
                            JSON.stringify(PrintError(d.command, [], EMessage.MachineIdNotFound))
                        );
                    }
                }
            } catch (error) {
                console.log('error credit machine',error,);
                
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
                    const ws = this.wsClient.find(v => v['machineId'] == machineId.machineId);
                    // const wsAdmin = this.wsClient.filter(v=>v['myMachineId'].includes(machineId.machineId));
                    if (ws) {
                        const resx = {} as IResModel;
                        resx.command = EMACHINE_COMMAND.status;
                        resx.message = EMessage.status;
                        resx.data = re.data;
                        // save to redis
                        redisClient.set('_machinestatus_' + machineId.machineId, re.data);
                        // send to machine client
                        this.sendWSMyMachine(machineId.machineId, resx);

                        this.sendWS(ws['clientId'], resx);
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
                        // cres?.res.send(PrintError('onMachineResponse', error, EMessage.error));
                    }
                });
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


    generateBillMMoney(value: number, transactionID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney
            this.loginMmoney()
                .then((r) => {
                    if (r) {
                        const qr = {
                            amount: value + "",
                            phonenumber: this.phonenumber, // '2055220199',
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
    loginMmoney() {
        // mmoneyusername='41f7c324712b46f08a939c4609a1d2e1';
        // mmoneypassword='112233'
        const username = this.production ? this.mmoneyusername : "test";
        const password = this.production ? this.mmoneypassword : "12345";
        return new Promise<IMMoneyLogInRes>((resolve, reject) => {
            try {
                if (this.mMoneyLoginRes.expiresIn) {
                    if (
                        new Date(this.mMoneyLoginRes.expiresIn).getTime() >
                        new Date().getTime()
                    ) {
                        return resolve(this.mMoneyLoginRes);
                    }
                }
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

    // }
    // setTask(bill: IVendingMachineBill, p: IVendingMachineSale, cbill: number, i: number) {
    //     return new Promise<any>((resolve, reject) => {
    //         setTimeout(() => {
    //             // const position = this.ssocket.processOrder(bill.machineId, p.position, bill.transactionID);
    //             writeSucceededRecordLog(bill, p.position);
    //             const res = {} as IResModel;
    //             res.command = EMACHINE_COMMAND.confirm;
    //             res.message = EMessage.confirmsucceeded;
    //             res.status = 1;
    //             res.data = { bill,position: p.position } as unknown as IBillProcess;
    //             let yy = new Array<WebSocketServer.WebSocket>();
    //             this.wss.clients.forEach(v => {
    //                 const x = v['clientId'] as string;
    //                 if (x) {
    //                     if (x == bill.clientId) {
    //                         yy.push(v);
    //                     }
    //                 }
    //             });
    //             yy.forEach(y => {
    //                 res.command = EMACHINE_COMMAND.waitingt;
    //                 // bill.transactionID;
    //                 // TODO: HAS TO CREATER  UnFINISHED TRANSACTION BILL
    //                 redisClient.get(ERedisCommand.waiting_transactionID).then(r => {
    //                     if (r) {
    //                         const a = JSON.parse(r);
    //                         a.push(res.data);
    //                         redisClient.set(ERedisCommand.waiting_transactionID, JSON.stringify(a));
    //                     } else {
    //                         redisClient.set(ERedisCommand.waiting_transactionID, JSON.stringify([res.data]));
    //                     }
    //                 })

    //                 y.send(JSON.stringify(res), e => {
    //                     if (e) console.log('ERROR SEND WS', e);
    //                 });
    //             })

    //         }, this.delayTime * i);
    //         resolve(true);
    //     })

    // }
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
                    console.log("WS HEART BEAT", data);

                    if (data === '{"command":"ping"}') {
                        // send pong if recieved a ping.
                        // redisClient.get('_balance_' + ws['clientId']).then(async r => {
                        //     console.log('clientid balance',r);

                        //     let x = await readMachineSetting(ws['machineId']);
                        //     let mstatus= await readMachineStatus(ws['machineId']);

                        //     console.log('clientid  setting',x);
                        //     console.log('clientid  status',x);
                        //     const mArray = ws['myMachineId'] as Array<string>;
                        //     let mymstatus = [];
                        //     let mymsetting= [];
                        //     let mymbalance =[];
                        //     let setting = {} as any;
                        //     try {


                        //         let y = [];
                        //         if (!x) { setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 3; setting.highTemp = 10; setting.light = true }
                        //         else {
                        //             y = JSON.parse(x) as Array<any>;
                        //             setting = y.find(v => v.settingName == 'setting');
                        //         }


                        //         for (let index = 0; index < mArray.length; index++) {
                        //             const element = mArray[index];
                        //             mymstatus.push(await readMachineStatus(element));
                        //             mymsetting.push(await readMachineSetting(element));
                        //             mymbalance.push(await readMachineBalance(element));
                        //         }
                        //         console.log('clientid  my machinestatus',mymstatus,mymsetting,mymbalance);
                        //     } catch (error) {
                        //         console.log('parsing error setting', error);
                        //         setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 3; setting.highTemp = 10; setting.light = true
                        //     }
                        //     console.log('ready to pong');
                        //     const limiter = 100000;
                        //     const merchant = 0;
                        //     ws.send(
                        //         JSON.stringify(
                        //             PrintSucceeded(
                        //                 "pong",
                        //                 { command: "ping", production: this.production, balance: r,limiter,merchant,mymbalance, setting ,mstatus,mymstatus,mymsetting},
                        //                 EMessage.succeeded
                        //             )
                        //         )
                        //     );
                        // });

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
                                        PrintSucceeded(d.command, res, EMessage.succeeded)
                                    )
                                );
                            } else throw new Error(EMessage.MachineIdNotFound);
                        }
                        else if (d.command == 'adminlogin') {
                            res.command = d.command;
                            res.message = EMessage.adminloginok;
                            res.status = 1;
                            const token = d.token as string;
                            console.log('ws[myMachineId]', ws['myMachineId']);

                            redisClient.get('_admintoken_' + token).then(r => {
                                console.log('admintoken', r);

                                if (r) {
                                    ws['ownerUuid'] = r;
                                    this.machineClientlist
                                        .findAll({ where: { ownerUuid: r } })
                                        .then((ry) => {
                                            if (ry) {
                                                const m = ry.map(v => v.machineId);
                                                console.log('admintoken owneruuid machines', m);
                                                ws['myMachineId'] = m;
                                                ws["clientId"] = uuid4();
                                                ws.send(
                                                    JSON.stringify(
                                                        PrintSucceeded(d.command, res, EMessage.succeeded)
                                                    ));
                                            }
                                            else ws.close(0);
                                        })
                                        .catch((e) => {
                                            console.log("Error list machine", e);
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
                                                            console.log('admintoken owneruuid machines', m);
                                                            redisClient.setEx('_admintoken_' + token, 60 * 60 * 24, ownerUuid);
                                                            ws['myMachineId'] = m;
                                                            ws["clientId"] = uuid4();
                                                            ws.send(
                                                                JSON.stringify(
                                                                    PrintSucceeded(d.command, res, EMessage.succeeded)
                                                                ));
                                                        }
                                                        else ws.close(0);
                                                    })
                                                    .catch((e) => {
                                                        console.log("Error list machine", e);
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
                                redisClient.get('_balance_' + ws['clientId']).then(async r => {
                                    console.log('clientid balance', r);

                                    let x = await readMachineSetting(ws['machineId']);
                                    let mstatus = await readMachineStatus(ws['machineId']);

                                    console.log('clientid  setting', x);
                                    console.log('clientid  status', mstatus);
                                    const mArray = ws['myMachineId'] as Array<string>;
                                    console.log('myMachineId', mArray);
                                    let mymstatus = [];
                                    let mymsetting = [];
                                    let mymlimiterbalance = '0';
                                    let mymmachinebalance = [];
                                    let mymlimiter = [];
                                    let setting = {} as any;
                                    try {


                                        let y = [];
                                        if (!x) { setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true }
                                        else {
                                            y = JSON.parse(x) as Array<any>;
                                            setting = y.find(v => v.settingName == 'setting');
                                        }

                                        mymlimiterbalance = (await readMerchantLimiterBalance(ws['ownerUuid'])) || '0';

                                        for (let index = 0; index < mArray?.length; index++) {
                                            const element = mArray[index];

                                            mymstatus.push(await readMachineStatus(element));

                                            const msetting = JSON.parse(await readMachineSetting(element));
                                            mymsetting.push({ msetting, machineId: element });




                                            const mb = JSON.parse((await readMachineBalance(element)) || '0');
                                            mymmachinebalance.push({ machineId: element, balance: mb });

                                            const ml = JSON.parse((await readMachineLimiter(element)) || '100000');
                                            mymlimiter.push({ machineId: element, balance: ml });
                                        }
                                        console.log('clientid  my machinestatus', mymstatus, mymsetting, mymlimiterbalance);
                                    } catch (error) {
                                        console.log('parsing error setting', error);
                                        setting.allowVending = true, setting.allowCashIn = true; setting.lowTemp = 5; setting.highTemp = 10; setting.light = true
                                    }
                                    console.log('ready to pong');
                                    const limiter = 100000;
                                    const merchant = 0;
                                    ws.send(
                                        JSON.stringify(
                                            PrintSucceeded(
                                                "ping",
                                                { command: "ping", production: this.production, balance: r, limiter, merchant, mymmachinebalance, mymlimiterbalance, setting, mstatus, mymstatus, mymsetting, mymlimiter },
                                                EMessage.succeeded
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
                        ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
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
            console.log("WS SENDING", x, x?.includes(machineId), v?.readyState);
            if (x?.length && x?.includes(machineId)) {
                // yy.push(v);
                console.log("WS SENDING", x, v?.readyState);

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
}


