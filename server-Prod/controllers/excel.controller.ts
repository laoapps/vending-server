import { Request, Response } from "express";
import * as XLSX from "xlsx";
import momenttz from "moment-timezone";
import { SERVER_TIME_ZONE } from "../api/inventoryZDM8";
import { VendingMachineBillFactory } from "../entities/vendingmachinebill.entity";
import { EEntity, EMessage, EPaymentStatus } from "../entities/system.model";
import { dbConnection } from "../entities";
import { Op, where } from "sequelize";
import https from 'https';
import axios from "axios";
import { PrintError, PrintSucceeded } from "../services/service";



export const uploadExcelFile = async (req: Request, res: Response) => {
    try {

        const data = req.body;

        // ถ้าไม่มีไฟล์ส่งมา
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please select an Excel file."
            });
        }

        // อ่านไฟล์ Excel จาก Buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

        // อ่านชื่อ Sheet ทั้งหมด
        const sheetNames = workbook.SheetNames;

        // อ่านเฉพาะ Sheet แรก
        const sheetName = sheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const ownerUuid = res.locals["ownerUuid"];
        console.log('ownerUuid :', ownerUuid);

        const machineId = data.machineId;
        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();

        // แปลงข้อมูลเป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const runData = await getReportSale(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
        const run = JSON.parse(JSON.stringify(runData ?? []));


        const bankIds = new Set(jsonData.map(b => b["ເລກທູລະກຳ"]));
        const myIds = new Set(run.map(m => m.transactionID));

        // 1. bankTrand ที่มีใน mytrand
        const bankInMy = jsonData.filter(b => myIds.has(b["ເລກທູລະກຳ"]));

        // 2. bankTrand ที่ไม่มีใน mytrand
        const bankNotInMy = jsonData.filter(b => !myIds.has(b["ເລກທູລະກຳ"]));

        // 3. mytrand ที่มีใน bankTrand
        const myInBank = run.filter(m => bankIds.has(m.transactionID));

        // 4. mytrand ที่ไม่มีใน bankTrand
        const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));

        // console.log("✅ bankInMy:", bankInMy);
        console.log("❌ bankNotInMy:", bankNotInMy);
        // console.log("✅ myInBank:", myInBank);
        console.log("❌ myNotInBank:", myNotInBank);
        for (let index = 0; index < bankNotInMy.length; index++) {
            const element = bankNotInMy[index];
            const transaction = element['ເລກທູລະກຳ'] ?? '';
            console.log('transaction', transaction);

            const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
            const res = await ent.findOne({
                where: {
                    transactionID: transaction
                }
            });
            console.log('res :', res);



        }




        return res.status(200).json({
            success: true,
            sheetName,
            data: jsonData,
            run: run,
            bankInMy: bankInMy,
            bankNotInMy: bankNotInMy,
            myInBank: myInBank,
            myNotInBank: myNotInBank
        });
    } catch (error: any) {
        console.error("Error reading Excel:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process Excel file",
            error: error.message
        });
    }
};



export const uploadExcelFileAndCheckBillNotPaid = async (req: Request, res: Response) => {
    try {

        const data = req.body;

        // ถ้าไม่มีไฟล์ส่งมา
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please select an Excel file."
            });
        }

        // อ่านไฟล์ Excel จาก Buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

        // อ่านชื่อ Sheet ทั้งหมด
        const sheetNames = workbook.SheetNames;

        // อ่านเฉพาะ Sheet แรก
        const sheetName = sheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const ownerUuid = res.locals["ownerUuid"];
        // console.log('ownerUuid :', ownerUuid);

        const machineId = data.machineId;
        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();

        // แปลงข้อมูลเป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const runData = await getReportAllBill(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
        if (!runData) {
            return res.status(400).json({
                success: false,
                sheetName,
                data: [],
            });
        }
        const run = JSON.parse(JSON.stringify(runData ?? []));


        const bankIds = new Set(jsonData.map(b => b["ເລກທູລະກຳ"]));
        const myIds = new Set(run.map(m => m.transactionID));

        // 1. bankTrand ที่มีใน mytrand
        const bankInMy = jsonData.filter(b => myIds.has(b["ເລກທູລະກຳ"]));

        // 2. bankTrand ที่ไม่มีใน mytrand
        const bankNotInMy = jsonData.filter(b => !myIds.has(b["ເລກທູລະກຳ"]));

        // 3. mytrand ที่มีใน bankTrand
        const myInBank = run.filter(m => bankIds.has(m.transactionID));

        // 4. mytrand ที่ไม่มีใน bankTrand
        const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));

        // console.log("✅ bankInMy:", bankInMy);
        // console.log("❌ bankNotInMy:", bankNotInMy);
        // console.log("✅ myInBank:", myInBank); 
        // console.log("❌ myNotInBank:", myNotInBank);

        const NotgetMoney: string[] = [];

        await Promise.all(
            myNotInBank.map(async (element) => {
                const transaction = element.transactionID ?? '';
                const resCheck = await checkQRPaidMmoneyResponse(transaction);
                if (resCheck.status === 1) {
                    // console.log('transaction', transaction, '✅ Success');
                    NotgetMoney.push(transaction);
                } else {
                    console.log('transaction', transaction, '❌ Not Success');

                }
            })
        );

        return res.status(200).json({
            success: true,
            sheetName,
            data: NotgetMoney,
        });

    } catch (error: any) {
        console.error("Error reading Excel:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process Excel file",
            error: error.message
        });
    }
};




export const reportAllBill = async (req: Request, res: Response) => {
    try {

        const data = req.body;
        const ownerUuid = res.locals["ownerUuid"];
        // console.log('ownerUuid :', ownerUuid);

        const machineId = data.machineId;
        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();


        const runData = await getReportAllBill(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
        if (!runData) {
            return res.send(PrintSucceeded('reportAllBilling', [], EMessage.succeeded))
        }

        return res.send(PrintSucceeded('reportAllBilling', runData, EMessage.succeeded))


    } catch (error: any) {
        console.error("Error reading Excel:", error);
        return res.send(PrintError('reportAllBilling', error, EMessage.unknownError));
    }
};


export const reportAllBillNotPaid = async (req: Request, res: Response) => {
    try {

        const data = req.body;
        const ownerUuid = res.locals["ownerUuid"];
        // console.log('ownerUuid :', ownerUuid);

        const machineId = data.machineId;
        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();


        const runData = await getReportAllBillNotPaid(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
        if (!runData) {
            return res.send(PrintSucceeded('reportAllBilling', [], EMessage.succeeded))
        }

        return res.send(PrintSucceeded('reportAllBilling', runData, EMessage.succeeded))


    } catch (error: any) {
        console.error("Error reading Excel:", error);
        return res.send(PrintError('reportAllBilling', error, EMessage.unknownError));
    }
};


async function getReportSale(machineId: string, fromDate: string, toDate: string, ownerUuid: string) {
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
    const res = await ent.findAll(condition);
    return res;
}



async function getReportAllBill(machineId: string, fromDate: string, toDate: string, ownerUuid: string) {
    try {
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
                    // paymentstatus: { [Op.in]: [EPaymentStatus.paid, EPaymentStatus.delivered,] },
                    machineId: machineId,
                    createdAt: { [Op.between]: [fromDate, toDate] }
                },
                order: [['id', 'DESC']]
            }
        }
        const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
        const res = await ent.findAll(condition);
        return res;
    } catch (error) {
        console.log('Error getReportAllBill :', error);

        return null;
    }
}


async function getReportAllBillNotPaid(machineId: string, fromDate: string, toDate: string, ownerUuid: string) {
    try {
        let condition: any = {};
        condition = {
            where: {
                paymentstatus: { [Op.in]: [EPaymentStatus.pending,] },
                machineId: machineId,
                createdAt: { [Op.between]: [fromDate, toDate] }
            },
            order: [['id', 'DESC']]
        }
        const ent = VendingMachineBillFactory(EEntity.vendingmachinebill + '_' + ownerUuid, dbConnection);
        const res = await ent.findAll(condition);
        return res;
    } catch (error) {
        console.log('Error getReportAllBillNotPaid :', error);

        return null;
    }
}



function checkQRPaidMmoneyResponse(transactionID: string): Promise<{ status: number, message: any }> {
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
                resolve({ status: 1, message: res.data })
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