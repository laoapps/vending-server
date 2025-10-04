import { Request, Response } from "express";
import * as XLSX from "xlsx";
import momenttz from "moment-timezone";
import { SERVER_TIME_ZONE } from "../api/inventoryZDM8";
import { VendingMachineBillFactory } from "../entities/vendingmachinebill.entity";
import { EEntity, EPaymentStatus } from "../entities/system.model";
import { dbConnection } from "../entities";
import { Op, where } from "sequelize";


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
        console.log('ownerUuid :', ownerUuid);

        const machineId = data.machineId;
        const fromDate = momenttz.tz(data.fromDate, SERVER_TIME_ZONE).startOf('day').toDate();
        const toDate = momenttz.tz(data.toDate, SERVER_TIME_ZONE).endOf('day').toDate();

        // แปลงข้อมูลเป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const runData = await getReportAllBill(machineId, fromDate.toString(), toDate.toString(), ownerUuid);
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
}