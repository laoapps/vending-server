import * as sequelize from "sequelize";


import * as pg from 'pg';
import { BankNoteFactory, BankNoteModel, BankNoteStatic } from "./banknote.entity";
import { BillCashInFactory, BillCashInStatic } from "./billcash.entity";
import { EEntity } from "./system.model";
import { VendingMachineSaleFactory, VendingMachineSaleStatic } from "./vendingmachinesale.entity";
import { StockFactory, StockStatic } from "./stock.entity";
import { VendingMachineBillFactory, VendingMachineBillStatic } from "./vendingmachinebill.entity";
import { MachineIDFactory, MachineIDStatic } from "./machineid.entity";
import { MachineClientID, MachineClientIDFactory, MachineClientIDStatic } from "./machineclientid.entity";
import { VendingWalletFactory, VendingWalletStatic } from "./vw.entity";
import { EPINShortCodeFactory, EPINShortCodeStatic } from "./epinshortcode.entity";
import { SubadminFactory, SubadminStatic } from "./subadmin.entity";
import { LAABHashService } from "../services/laab.service";
import { VendingCashoutMMoneyFactory, VendingCashoutMMoneyStatic } from "./vendingcashoutmmoney.entity";
import { VendingMachineSaleReportFactory, VendingMachineSaleReportStatic } from "./vendingmachinesalereport.entity";
import { AdsFactory, AdsStatic } from "./ads.entity";
import { LogActivityFactory, LogActivityStatic } from "./logactivity.entity";
import { DoorFactory, DoorStatic } from "./doors.entity";
import { DoorPaymentFactory, DoorPaymentStatic } from "./doorpayment.entity";
import { VendingVersionFactory, VendingVersionStatic } from "./vendingversion.entity";
import { DropLogActivityFactory, DropLogActivityStatic } from "./droplogactivity.entity";
import { BundleFactory, BundleStatic } from "./appupdate.entity";


export let dbConnection: sequelize.Sequelize;
export let laabHashService: LAABHashService;
export let dropLogEntity: DropLogActivityStatic;
export let logEntity: LogActivityStatic;
export let bankNoteEntity: BankNoteStatic;
export let billCashEntity: BillCashInStatic;
export let vendingMachineSaleEntity: VendingMachineSaleStatic;
export let stockEntity: StockStatic;
export let vendingMachineBillEntity: VendingMachineBillStatic;
export let machineIDEntity: MachineIDStatic;
export let machineClientIDEntity: MachineClientIDStatic;
export let machineIDHistoryEntity: MachineIDStatic;
export let machineCashoutMMoneyEntity: VendingCashoutMMoneyStatic;
export let vendingMachineSaleReportEntity: VendingMachineSaleReportStatic;
export let adsEntity: AdsStatic;
export let doorEntity: DoorStatic;
export let doorPaymentEntity: DoorPaymentStatic;
export let vendingVersionEntity: VendingVersionStatic;

// LAAB
export let vendingWallet: VendingWalletStatic;
export let epinshortcodeEntity: EPINShortCodeStatic;
export let subadminEntity: SubadminStatic;


//

export let BundleEntity: BundleStatic;

export const initDB = () => {


    console.log(`BundleEntity sync`);
    BundleEntity = BundleFactory(EEntity.bundle, dbConnection);
    BundleEntity.sync().then(r => {
        console.log('BundleEntity synced', r);
    });



    laabHashService = new LAABHashService();
    DoorPaymentFactory(EEntity.DoorPayment, dbConnection).sync().then(() => {
        console.log(`DoorPayment sync`);
        doorPaymentEntity = DoorPaymentFactory(EEntity.DoorPayment, dbConnection);
    });
    DoorFactory(EEntity.Door, dbConnection).sync().then(() => {
        console.log(`Door sync`);
        doorEntity = DoorFactory(EEntity.Door, dbConnection);
    });
    LogActivityFactory(EEntity.logactivity, dbConnection).sync().then(() => {
        console.log(`vending wallet sync`);
        logEntity = LogActivityFactory(EEntity.logactivity, dbConnection);
    });
    DropLogActivityFactory(EEntity.droplogactivity, dbConnection).sync().then(() => {
        console.log(`vending wallet sync`);
        dropLogEntity = DropLogActivityFactory(EEntity.droplogactivity, dbConnection);
    });
    VendingVersionFactory(EEntity.vendingVersion, dbConnection).sync().then(() => {
        console.log(`vending version sync`);
        vendingVersionEntity = VendingVersionFactory(EEntity.vendingVersion, dbConnection);
    });



    adsEntity = AdsFactory(EEntity.ads, dbConnection).sync().then(() => {
        console.log(`vending wallet sync`);
        adsEntity = AdsFactory(EEntity.ads, dbConnection);
    });
    vendingWallet = VendingWalletFactory(EEntity.vendingwallet, dbConnection).sync().then(() => {
        console.log(`vending wallet sync`);
        vendingWallet = VendingWalletFactory(EEntity.vendingwallet, dbConnection);
    });
    epinshortcodeEntity = EPINShortCodeFactory(EEntity.epinshortcode, dbConnection).sync().then(() => {
        console.log(`epin shortcode entity sync`);
        epinshortcodeEntity = EPINShortCodeFactory(EEntity.epinshortcode, dbConnection);
    });
    subadminEntity = SubadminFactory(EEntity.subadmin, dbConnection).sync().then(() => {
        console.log(`sub admin entity sync`);
        subadminEntity = SubadminFactory(EEntity.subadmin, dbConnection);
    });
    machineCashoutMMoneyEntity = VendingCashoutMMoneyFactory(EEntity.vendingcashoutmmoney, dbConnection).sync().then(() => {
        console.log(`vending cashout mmoney entity sync`);
        machineCashoutMMoneyEntity = VendingCashoutMMoneyFactory(EEntity.vendingcashoutmmoney, dbConnection);
    });
    vendingMachineSaleReportEntity = VendingMachineSaleReportFactory(EEntity.vendingmachinesalereport, dbConnection).sync().then(() => {
        console.log(`vending machine sale report entity sync`);
        vendingMachineSaleReportEntity = VendingMachineSaleReportFactory(EEntity.vendingmachinesalereport, dbConnection);
    });

    bankNoteEntity = BankNoteFactory(EEntity.banknote, dbConnection); // public 
    bankNoteEntity.sync().then(r => {
        console.log('bankNoteEntity synced', r);
    });

    billCashEntity = BillCashInFactory(EEntity.billcash + '_', dbConnection); // private for user

    vendingMachineSaleEntity = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_', dbConnection);// private for shop
    stockEntity = StockFactory(EEntity.product + '_', dbConnection);// private for shop
    vendingMachineBillEntity = VendingMachineBillFactory(EEntity.vendingmachinebill + '_', dbConnection);// private for user


    machineIDEntity = MachineIDFactory(EEntity.machineID, dbConnection); // public
    machineIDEntity.sync().then(r => {
        console.log('machineIDEntity synced', r);

    });

    machineClientIDEntity = MachineClientIDFactory(EEntity.machineclientid, dbConnection); // public
    machineClientIDEntity.sync().then(r => {
        console.log('machineClientIDEntity synced', r);

    });

    machineIDHistoryEntity = MachineIDFactory(EEntity.machineIDHistory + '_', dbConnection); // private for machine


}

export const CreateDatabase = (prefix: string) => {
    return new Promise<boolean>((resolve, reject) => {
        try {
            let user = process.env.DATABASE_USER || 'postgres',
                password = process.env.DATABASE_PASSWORD || '5martH67',
                host = process.env.DATABASE_HOST || 'localhost', //0.0.0.0
                dbname = process.env.DATABASE_DB || 'dbvending',
                port = '5432';
            // host = process.env.DATABASE_HOST || host;
            // port = process.env.DATABASE_PORT || port;
            // dbname = process.env.DATABASE_DB || dbname;
            // user = process.env.DATABASE_USER || user;
            // password = process.env.DATABASE_PASSWORD || password;
            console.log(host, port, dbname, user, password);

            const p = new pg.Pool({ host, user, password, database: 'postgres' });
            p.query(`SELECT 1 FROM pg_database WHERE datname = '${dbname}'`).then(async r => {
                // console.log("createdab;: ",r,' ::dbname:: ',dbname);

                if (r.rowCount === 0) {
                    console.log('creating db', dbname, r);

                    await p.query(`CREATE DATABASE ${dbname}`);
                    await p.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
                }
                if (!dbConnection) {
                    dbConnection = new sequelize.Sequelize(
                        {
                            port: Number(port),
                            host,
                            database: dbname,
                            password,
                            username: user,
                            dialect: "postgres",
                            pool: {
                                min: 0,
                                max: 5,
                                acquire: 30000,
                                idle: 10000,
                            }
                        }
                    );
                    // dbConnection.sync();
                    initDB();
                    resolve(true);
                }
                else resolve(true);
            }).catch(e => {
                reject(e)
            });
        } catch (error) {
            console.error(error);
            reject(error)
        }
    })


}