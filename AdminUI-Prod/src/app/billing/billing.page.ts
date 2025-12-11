import { Component, Input, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ApiService } from '../services/api.service';
import *as moment from "moment-timezone";

@Component({
  selector: 'app-billing',
  templateUrl: './billing.page.html',
  styleUrls: ['./billing.page.scss'],
})
export class BillingPage implements OnInit {
  private token: string;
  _l: any[] = [];

  _lServer: any[] = [];
  bankInMyData: any = null;
  allMMoneyData: any[] = [];
  finalArrayData: any[] = [];

  myBankNoServerData: any[] = [];

  // billNotPaidData: any[] = [];
  myNotInBankNotPaidData: any[] = [];

  myNotInBankPaidData: any[] = [];
  fromDate: string;
  toDate: string;
  @Input() machineId: string;

  selectedFile: File | null = null;      // ✅ เก็บไฟล์ที่เลือกไว้
  dataExcel: any[] = [];                 // ✅ ข้อมูลจากไฟล์ Excel

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.token = localStorage.getItem('lva_token');
  }

  // mapBankInMy(data: any[]) {
  //   return data.filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString()))
  //     .map(item => ({
  //       "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
  //       "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
  //       "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
  //       "ວັນທີ": item["ວັນທີ"].toString()
  //     }));
  // }

  mapBankInMy(data: any[]) {
    // filter + map รายการปกติ
    const filtered = data
      .filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString()))
      .map(item => ({
        "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
        "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
        "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
        "ວັນທີ": item["ວັນທີ"].toString(),
        "ເລກຕູ້": this._lServer.find(
          item2 => item2["transactionID"] === item["ເລກທູລະກຳ"]
        )?.machineId ?? ""

      }));

    // -------- คำนวณข้อมูลสรุป --------

    // 1) จำนวนทั้งหมด
    const totalCount = filtered.length;

    // 2) รวมจำนวนเงินทั้งหมด
    const totalMoney = filtered.reduce((sum, item) => {
      return sum + Number(item["ຈຳນວນເງິນ"]);
    }, 0);

    // 3) อัตรา 4.5%
    const rate = 4.5;

    // 4) ค่าบริการ Franchise fee
    const franchiseFee = (totalMoney * rate) / 100;

    // -------- เพิ่ม 4 records ต่อท้าย --------

    const summaryRows = [
      {
        "ລາຍການສະຫຼຸບ": "ຈຳນວນທັງໝົດ",
        "ຈຳນວນທັງໝົດ": totalCount
      },
      {
        "ລາຍການສະຫຼຸບ": "ເງິນທັງໝົດ",
        "ຄ່າ": totalMoney
      },
      {
        "ລາຍການສະຫຼຸບ": "HM Franchase rate",
        "ຄ່າ": "4.5%"
      },
      {
        "ລາຍການສະຫຼຸບ": "HM Franchase fee",
        "ຄ່າ": franchiseFee
      }
    ];

    this.bankInMyData = [
      {
        "ຈຳນວນທັງໝົດ": totalCount
      },
      {
        "ເງິນທັງໝົດ": totalMoney
      },
      {
        "HMFranchaseRate": "4.5%"
      },
      {
        "HMFranchaseFee": franchiseFee
      }
    ];

    // return = ข้อมูลเดิม + 4 แถวสรุป
    return [...filtered, ...summaryRows];
  }



  // mapMyNotInBankNotPaid(data: any[]) {
  //   const EXCEL_LIMIT = 32767;

  //   return data.filter(item => this.isBetweenDateHM(item["createdAt"].toString())).map(item => {
  //     const sales = item['vendingsales'] || [];

  //     // 1) ตรวจว่ามี dropAt == null หรือไม่
  //     const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

  //     // 2) ย่อข้อมูล vendingsales
  //     const compactSales = sales.map((s: any) => ({
  //       position: s.position,
  //       dropAt: s.dropAt,
  //       machineId: s.machineId,
  //       name: s.stock?.name,
  //       price: s.stock?.price,
  //       qtty: s.qtty
  //     }));

  //     // 3) JSON string
  //     const refString = JSON.stringify(compactSales);
  //     const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

  //     // 4) สร้าง object ผลลัพธ์
  //     const result: any = {
  //       "ເລກທູລະກຳ": item["transactionID"],
  //       "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
  //       "ຊ່ອງທາງ": item["paymentref"],
  //       "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
  //     };

  //     // 5) ถ้ามี dropAt == null → เพิ่ม field ใหม่ *ก่อน ref*
  //     if (hasNullDropAt) {
  //       result["ພິເສດ"] = true;
  //     }

  //     // 6) ใส่ ref ต่อท้าย
  //     result["ref"] = safeRef;

  //     return result;
  //   });
  // }

  mapMyNotInBankNotPaid(data: any[]) {
    const EXCEL_LIMIT = 32767;

    // ⭐ 1) Filter + map ข้อมูลหลัก
    const mapped = data
      .filter(item => this.isBetweenDateHM(item["createdAt"].toString()))
      .map(item => {
        const sales = item['vendingsales'] || [];

        // ตรวจ dropAt null
        const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

        const compactSales = sales.map((s: any) => ({
          position: s.position,
          dropAt: s.dropAt,
          machineId: s.machineId,
          name: s.stock?.name,
          price: s.stock?.price,
          qtty: s.qtty
        }));

        const refString = JSON.stringify(compactSales);
        const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

        const result: any = {
          "ເລກທູລະກຳ": item["transactionID"],
          "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
          "ຊ່ອງທາງ": item["paymentref"],
          "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
          "ເລກຕູ້": item["machineId"] ?? ''
        };

        // ถ้ามี dropAt null → เพิ่ม field พิเศษ
        if (hasNullDropAt) {
          result["ພິເສດ"] = true;
        }

        result["ref"] = safeRef;

        return result;
      });


    // ⭐ 2) คำนวณ summary
    const totalCount = mapped.length;
    const totalMoney = mapped.reduce(
      (sum, item) => sum + Number(item["ຈຳນວນເງິນ"]),
      0
    );

    const rate = 4.5;
    const fee = totalMoney * (rate / 100);

    // ⭐ 3) เพิ่ม 1 แถวว่าง + summary 4 แถว
    // const emptyRow = { "": "" };

    const summaryRows = [
      { "ຈຳນວນທັງໝົດ": totalCount },
      { "ເງິນທັງໝົດ": totalMoney },
    ];

    this.myNotInBankNotPaidData = summaryRows;

    // ⭐ 4) return รวมทั้งหมด
    return [...mapped, ...summaryRows];
  }




  mapMyNotInBankPaid(data: any[]) {
    // return data.filter(item => this.isBetweenDateMMoney(item["txnDateTime"].toString())).
    //   map(item => ({
    //     "ເລກທູລະກຳ": item["billNumber"],
    //     "ຈຳນວນເງິນ": this.clearPrice(item["txnAmount"].toString()),
    //     "ຊ່ອງທາງ": item["refNo"],
    //     "ວັນທີ": item["txnDateTime"].toString()
    //   }));

    const filtered = data.filter(item => this.isBetweenDateMMoney(item["txnDateTime"].toString())).
      map(item => ({
        "ເລກທູລະກຳ": item["billNumber"],
        "ຈຳນວນເງິນ": this.clearPrice(item["txnAmount"].toString()),
        "ຊ່ອງທາງ": item["refNo"],
        "ວັນທີ": item["txnDateTime"].toString(),
        "ເລກຕູ້": this._lServer.find(
          item2 => item2["transactionID"] === item["billNumber"]
        )?.machineId ?? ""

      }));

    // -------- คำนวณข้อมูลสรุป --------

    // 1) จำนวนทั้งหมด
    const totalCount = filtered.length;

    // 2) รวมจำนวนเงินทั้งหมด
    const totalMoney = filtered.reduce((sum, item) => {
      return sum + Number(item["ຈຳນວນເງິນ"]);
    }, 0);

    // 3) อัตรา 4.5%
    const rate = 4.5;

    // 4) ค่าบริการ Franchise fee
    const franchiseFee = (totalMoney * rate) / 100;

    // -------- เพิ่ม 4 records ต่อท้าย --------
    const summaryRows = [
      {
        "ລາຍການສະຫຼຸບ": "ຈຳນວນທັງໝົດ",
        "ຄ່າ": totalCount
      },
      {
        "ລາຍການສະຫຼຸບ": "ເງິນທັງໝົດ",
        "ຄ່າ": totalMoney
      },

    ];

    this.myNotInBankPaidData = summaryRows;

    // return = ข้อมูลเดิม + 4 แถวสรุป
    return [...filtered, ...summaryRows];
  }

  mapMyBankNoServer(data: any[]) {
    // return data.filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString())).map(item => ({
    //   "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
    //   "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
    //   "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
    //   "ວັນທີ": item["ວັນທີ"].toString()
    // }));

    const filtered = data.filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString())).map(item => ({
      "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
      "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
      "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
      "ວັນທີ": item["ວັນທີ"].toString(),
      "ເລກຕູ້": this._lServer.find(
        item2 => item2["transactionID"] === item["ເລກທູລະກຳ"]
      )?.machineId ?? ""

    }));

    // -------- คำนวณข้อมูลสรุป --------

    // 1) จำนวนทั้งหมด
    const totalCount = filtered.length;

    // 2) รวมจำนวนเงินทั้งหมด
    const totalMoney = filtered.reduce((sum, item) => {
      return sum + Number(item["ຈຳນວນເງິນ"]);
    }, 0);


    // -------- เพิ่ม 4 records ต่อท้าย --------
    const summaryRows = [
      {
        "ລາຍການສະຫຼຸບ": "ຈຳນວນທັງໝົດ",
        "ຄ່າ": totalCount
      },
      {
        "ລາຍການສະຫຼຸບ": "ເງິນທັງໝົດ",
        "ຄ່າ": totalMoney
      }
    ];
    this.myBankNoServerData = summaryRows;

    return [...filtered, ...summaryRows];
  }


  mapAllMMoney(data: any[]) {
    // return data.filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString())).map(item => ({
    //   "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
    //   "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
    //   "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
    //   "ວັນທີ": item["ວັນທີ"].toString()
    // }));

    const filtered = data
      .filter(item => this.isBetweenDateMMoney(item["ວັນທີ"].toString()))
      .map(item => ({
        "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
        "ຈຳນວນເງິນ": this.clearPrice(item["ຈຳນວນເງິນ"].toString()),
        "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
        "ວັນທີ": item["ວັນທີ"].toString(),
        "ເລກຕູ້": this._lServer.find(
          item2 => item2["transactionID"] === item["ເລກທູລະກຳ"]
        )?.machineId ?? ""

      }));

    // -------- คำนวณข้อมูลสรุป --------

    // 1) จำนวนทั้งหมด
    const totalCount = filtered.length;

    // 2) รวมจำนวนเงินทั้งหมด
    const totalMoney = filtered.reduce((sum, item) => {
      return sum + Number(item["ຈຳນວນເງິນ"]);
    }, 0);

    // 3) อัตรา 4.5%
    const rate = 4.5;

    // 4) ค่าบริการ Franchise fee
    const franchiseFee = (totalMoney * rate) / 100;

    // -------- เพิ่ม 4 records ต่อท้าย --------
    const summaryRows = [
      {
        "ລາຍການສະຫຼຸບ": "ຈຳນວນທັງໝົດ",
        "ຄ່າ": totalCount
      },
      {
        "ລາຍການສະຫຼຸບ": "ເງິນທັງໝົດ",
        "ຄ່າ": totalMoney
      },
      {
        "ລາຍການສະຫຼຸບ": "HM Franchase rate",
        "ຄ່າ": "4.5%"
      },
      {
        "ລາຍການສະຫຼຸບ": "HM Franchase fee",
        "ຄ່າ": franchiseFee
      }
    ];
    this.allMMoneyData = summaryRows;

    // return = ข้อมูลเดิม + 4 แถวสรุป
    return [...filtered, ...summaryRows];
  }


  mapMyBankServer(data: any[]) {
    const EXCEL_LIMIT = 32767;

    return data.filter(item => this.isBetweenDateHM(item["createdAt"].toString())).map(item => {
      const sales = item['vendingsales'] || [];

      // 1) ตรวจว่ามี dropAt == null หรือไม่
      const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

      // 2) ย่อข้อมูล vendingsales
      const compactSales = sales.map((s: any) => ({
        position: s.position,
        dropAt: s.dropAt,
        machineId: s.machineId,
        name: s.stock?.name,
        price: s.stock?.price,
        qtty: s.qtty
      }));

      // 3) JSON string
      const refString = JSON.stringify(compactSales);
      const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

      // 4) สร้าง object ผลลัพธ์
      const result: any = {
        "ເລກທູລະກຳ": item["transactionID"],
        "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
        "ເລກຕູ້": item["machineId"] ?? ''
      };

      // 5) ถ้ามี dropAt == null → เพิ่ม field ใหม่ *ก่อน ref*
      if (hasNullDropAt) {
        result["ພິເສດ"] = true;
      }

      // 6) ใส่ ref ต่อท้าย
      result["ref"] = safeRef;

      return result;
    });
  }


  MapMyBillNotPaid(data: any[]) {
    const EXCEL_LIMIT = 32767;

    return data.filter(item => this.isBetweenDateHM(item["createdAt"].toString())).map(item => {
      const sales = item['vendingsales'] || [];

      // 1) ตรวจว่ามี dropAt == null หรือไม่
      const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

      // 2) ย่อข้อมูล vendingsales
      const compactSales = sales.map((s: any) => ({
        position: s.position,
        dropAt: s.dropAt,
        machineId: s.machineId,
        name: s.stock?.name,
        price: s.stock?.price,
        qtty: s.qtty
      }));

      // 3) JSON string
      const refString = JSON.stringify(compactSales);
      const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

      // 4) สร้าง object ผลลัพธ์
      const result: any = {
        "ເລກທູລະກຳ": item["transactionID"],
        "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
        "ຊ່ອງທາງ": item["paymentmethod"],
        "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
        "ເລກຕູ້": item["machineId"] ?? ''
      };

      // 5) ถ้ามี dropAt == null → เพิ่ม field ใหม่ *ก่อน ref*
      if (hasNullDropAt) {
        result["ພິເສດ"] = true;
      }

      // 6) ใส่ ref ต่อท้าย
      result["ref"] = safeRef;

      return result;
    });
  }

  MapMySaleServer(data: any[]) {
    const EXCEL_LIMIT = 32767;

    return data.filter(item => this.isBetweenDateHM(item["createdAt"].toString())).map(item => {
      const sales = item['vendingsales'] || [];

      // 1) ตรวจว่ามี dropAt == null หรือไม่
      const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

      // 2) ย่อข้อมูล vendingsales
      const compactSales = sales.map((s: any) => ({
        position: s.position,
        dropAt: s.dropAt,
        machineId: s.machineId,
        name: s.stock?.name,
        price: s.stock?.price,
        qtty: s.qtty
      }));

      // 3) JSON string
      const refString = JSON.stringify(compactSales);
      const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

      // 4) สร้าง object ผลลัพธ์
      const result: any = {
        "ເລກທູລະກຳ": item["transactionID"],
        "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
        "ເລກຕູ້": item["machineId"] ?? ''
      };

      // 5) ถ้ามี dropAt == null → เพิ่ม field ใหม่ *ก่อน ref*
      if (hasNullDropAt) {
        result["ພິເສດ"] = true;
      }

      // 6) ใส่ ref ต่อท้าย
      result["ref"] = safeRef;

      return result;
    });
  }


  MapMySaleSuccess(data: any[]) {
    const EXCEL_LIMIT = 32767;

    return data.filter(item => this.isBetweenDateHM(item["createdAt"].toString())).map(item => {
      const sales = item['vendingsales'] || [];

      // 1) ตรวจว่ามี dropAt == null หรือไม่
      const hasNullDropAt = sales.some((s: any) => s.dropAt == null);

      // 2) ย่อข้อมูล vendingsales
      const compactSales = sales.map((s: any) => ({
        position: s.position,
        dropAt: s.dropAt,
        machineId: s.machineId,
        name: s.stock?.name,
        price: s.stock?.price,
        qtty: s.qtty
      }));

      // 3) JSON string
      const refString = JSON.stringify(compactSales);
      const safeRef = refString.length > EXCEL_LIMIT ? "" : refString;

      // 4) สร้าง object ผลลัพธ์
      const result: any = {
        "ເລກທູລະກຳ": item["transactionID"],
        "ຈຳນວນເງິນ": this.clearPrice(item["totalvalue"].toString()),
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": this.convertTimeZone(item["createdAt"].toString()),
        "ເລກຕູ້": item["machineId"] ?? ''
      };

      // 5) ถ้ามี dropAt == null → เพิ่ม field ใหม่ *ก่อน ref*
      if (hasNullDropAt) {
        result["ພິເສດ"] = true;
      }

      // 6) ใส่ ref ต่อท้าย
      result["ref"] = safeRef;

      return result;
    });
  }
  clearPrice(price: string) {
    return parseInt(price?.replace(/\D/g, ''));
  }

  isBetweenDateMMoney(
    dateTime: string,

  ): boolean {
    const checkDate = new Date(dateTime);
    const start = new Date(this.fromDate + " 00:00:00");
    const end = new Date(this.toDate + " 23:59:59");
    end.setDate(end.getDate() - 1);
    return checkDate >= start && checkDate <= end;
  }

  isBetweenDateHM(
    utcDateTime: string,
  ): boolean {

    const utcDate = new Date(utcDateTime);

    if (isNaN(utcDate.getTime())) {
      return false;
    }

    const localTime = moment.utc(utcDateTime).tz("Asia/Bangkok").toDate();

    const start = new Date(this.fromDate + "T00:00:00");
    const end = new Date(this.toDate + "T23:59:59");
    end.setDate(end.getDate() - 1);

    return localTime >= start && localTime <= end;
  }

  convertTimeZone(utcDateTime: string) {
    // const utcDate = new Date(utcDateTime);
    const localTime = moment.utc(utcDateTime).tz("Asia/Bangkok").format('YYYY-MM-DD HH:mm:ss');

    return localTime;
  }


  exportAllSheets(
    bankInMy: any,               // ชุด 1
    myNotInBankNotPaid: any,     // ชุด 2
    myNotInBankPaid: any,        // ชุด 3
    myBankNoServer: any,         // ชุด 4
    myBankServer: any,            // ชุด 5
    billNotPaid: any,
    allSaleServer: any,
    allSaleSuccess: any,
    allMMoney: any

  ) {
    // 1) เตรียม workbook
    const wb = XLSX.utils.book_new();

    // 2) แปลงข้อมูลแต่ละชุดเป็น sheet
    const sheet1 = XLSX.utils.json_to_sheet(this.mapBankInMy(bankInMy));

    const sheet2 = XLSX.utils.json_to_sheet(this.mapMyNotInBankNotPaid(myNotInBankNotPaid));

    const sheet3 = XLSX.utils.json_to_sheet(this.mapMyNotInBankPaid(myNotInBankPaid));

    const sheet4 = XLSX.utils.json_to_sheet(this.mapMyBankNoServer(myBankNoServer));

    // const sheet5 = XLSX.utils.json_to_sheet(this.mapMyBankServer(myBankServer));
    const sheet6 = XLSX.utils.json_to_sheet(this.MapMyBillNotPaid(billNotPaid));

    // const sheet7 = XLSX.utils.json_to_sheet(this.MapMySaleServer(allSaleServer));
    // const sheet8 = XLSX.utils.json_to_sheet(this.MapMySaleSuccess(allSaleSuccess));
    const sheet9 = XLSX.utils.json_to_sheet(this.mapAllMMoney(allMMoney));


    const finalArray = this.mergeData(this.MapMySaleServer(allSaleServer), this.mapMyNotInBankNotPaid(myNotInBankNotPaid), this.mapMyNotInBankPaid(myNotInBankPaid));

    const sheet10 = XLSX.utils.json_to_sheet(this.mapAllData(finalArray));
    // console.log('----->1.ສັງລວມ :', [this.mapBankInMy(bankInMy)[0]]);
    // this.bankInMyData = this.mapBankInMy(bankInMy);
    // this.allMMoneyData = this.mapAllMMoney(allMMoney);
    // this.finalArrayData = this.mapAllData(finalArray);
    // this.myBankNoServerData = this.mapMyBankNoServer(myBankNoServer);
    // this.billNotPaidData = this.MapMyBillNotPaid(billNotPaid);
    // this.myNotInBankNotPaidData = this.mapMyNotInBankNotPaid(myNotInBankNotPaid);
    // this.myNotInBankPaidData = this.mapMyNotInBankPaid(myNotInBankPaid);



    // console.log('-----> 2.MMoney :', [this.mapAllMMoney(allMMoney)[0]]);
    // console.log('-----> 3.ການຂາຍທັງໝົດ :', [this.mapAllData(finalArray)[0]]);
    // console.log('-----> 4.ບິນທີ່ບໍ່ຮູ້ທີ່ມາຂອງເງິນ :', [this.mapMyBankNoServer(myBankNoServer)[0]]);
    // console.log('-----> 5.ບິນບໍ່ທັນຈ່າຍ :', [this.MapMyBillNotPaid(billNotPaid)[0]]);
    // console.log('-----> 6.ບິນຍິງຕົກເອງ :', [this.mapMyNotInBankNotPaid(myNotInBankNotPaid)[0]]);
    // console.log('-----> 7.ບິນທີ່ຕ້ອງທວງເງິນ :', this.mapMyNotInBankPaid(myNotInBankPaid)[0]);

    // 3) เพิ่มลง workbook พร้อมตั้งชื่อแต่ละแท็บ
    XLSX.utils.book_append_sheet(wb, sheet1, "1.ສັງລວມ(3-6-7)");

    XLSX.utils.book_append_sheet(wb, sheet9, "2.MMoney");
    // XLSX.utils.book_append_sheet(wb, sheet8, "ບິນທັງໝົດທີ່ຕົງກັນພ້ອມສິນຄ້າ");
    XLSX.utils.book_append_sheet(wb, sheet10, "3.ການຂາຍທັງໝົດ");
    // console.log('----->3 :', [this.MapMySaleServer(allSaleServer)[0]]);

    // XLSX.utils.book_append_sheet(wb, sheet2, "3.1.ບິນຍິງຕົກເອງ");
    // console.log('----->3.1 :', [this.mapMyNotInBankNotPaid(myNotInBankNotPaid)[0]]);

    // XLSX.utils.book_append_sheet(wb, sheet3, "3.2.ບິນທີ່ຕ້ອງທວງເງິນ");
    // console.log('----->3.2 :', [this.mapMyNotInBankPaid(myNotInBankPaid)[0]]);

    XLSX.utils.book_append_sheet(wb, sheet4, "4.ບິນທີ່ບໍ່ຮູ້ທີ່ມາຂອງເງິນ(2)");
    XLSX.utils.book_append_sheet(wb, sheet6, "5.ບິນບໍ່ທັນຈ່າຍ");

    XLSX.utils.book_append_sheet(wb, sheet2, "6.ບິນຍິງຕົກເອງ");
    XLSX.utils.book_append_sheet(wb, sheet3, "7.ບິນທີ່ຕ້ອງທວງເງິນ(7-2)");


    // XLSX.utils.book_append_sheet(wb, sheet4, "ບິນທີ່ບໍ່ຮູ້ທີ່ມາຂອງເງິນ");
    // XLSX.utils.book_append_sheet(wb, sheet5, "ບິນທີ່ມີໃນທະນາຄານແລະມີໃນserver");
    // XLSX.utils.book_append_sheet(wb, sheet6, "ບິນບໍ່ທັນຈ່າຍ");
    // XLSX.utils.book_append_sheet(wb, sheet7, "ການຂາຍທັງໝົດ");

    // 4) สร้างไฟล์ Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // 5) ชื่อไฟล์
    const filename = `ລາຍງານທັງໝົດ-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
    saveAs(blob, filename);
  }


  mergeData(data3: any[], data31: any[], data32: any[]) {
    const result: any[] = [];

    data3.forEach(main => {

      const match31 = data31.find(d => d['ເລກທູລະກຳ'] === main['ເລກທູລະກຳ']);
      const match32 = data32.find(d => d['ເລກທູລະກຳ'] === main['ເລກທູລະກຳ']);

      result.push({
        transactionID: main['ເລກທູລະກຳ'],
        totalvalue: main['ຈຳນວນເງິນ'],
        paymentref: main['ຊ່ອງທາງ'],
        vendingsales: main['ref'],
        createAt: main['ວັນທີ'] ?? '',
        // เงื่อนไขตามที่คุณต้องการ
        isSendDrop: !!match31,
        isRequest: !!match32,
        "ເລກຕູ້": this._lServer.find(
          item2 => item2["transactionID"] === main["ເລກທູລະກຳ"]
        )?.machineId ?? ""

      });

    });

    return result;
  }





  // mergeData(data3: any[], data31: any[], data32: any[]) {
  //   const result: any[] = [];

  //   // ---------- ขั้นที่ 1: ใช้ data3 เป็นหลัก ----------
  //   data3.forEach(main => {
  //     const match31 = data31.find(d => d['ເລກທູລະກຳ'] === main['ເລກທູລະກຳ']);
  //     const match32 = data32.find(d => d['ເລກທູລະກຳ'] === main['ເລກທູລະກຳ']);

  //     result.push({
  //       transactionID: main['ເລກທູລະກຳ'],
  //       totalvalue: main['ຈຳນວນເງິນ'],
  //       paymentref: main['ຊ່ອງທາງ'],
  //       vendingsales: main['ref'] || [],
  //       createAt: main['ວັນທີ'] ?? '',
  //       isSendDrop: !!match31,
  //       isRequest: !!match32,

  //     });
  //   });


  //   // ---------- ขั้นที่ 2: หาใน 3.1 ที่ไม่มีใน 3 ----------
  //   data31.forEach(drop => {
  //     const exists = result.find(r => r['ເລກທູລະກຳ'] === drop['ເລກທູລະກຳ']);

  //     if (!exists) {
  //       result.push({
  //         transactionID: drop['ເລກທູລະກຳ'],
  //         totalvalue: drop['ຈຳນວນເງິນ'],
  //         paymentref: drop['ຊ່ອງທາງ'],
  //         vendingsales: [],
  //         createAt: drop['ວັນທີ'] ?? '',
  //         isSendDrop: true,
  //         isRequest: false
  //       });
  //     }
  //   });


  //   // ---------- ขั้นที่ 3: หาใน 3.2 ที่ไม่มีใน 3 ----------
  //   data32.forEach(req => {
  //     const exists = result.find(r => r['ເລກທູລະກຳ'] === req['ເລກທູລະກຳ']);

  //     if (!exists) {
  //       result.push({
  //         transactionID: req['ເລກທູລະກຳ'],
  //         totalvalue: req['ຈຳນວນເງິນ'],
  //         paymentref: req['ຊ່ອງທາງ'],
  //         vendingsales: [],
  //         createAt: req['ວັນທີ'] ?? '',
  //         isSendDrop: false,
  //         isRequest: true      // เพราะมาจาก 3.2
  //       });
  //     }
  //   });

  //   return result;
  // }


  mapAllData(data: any[]) {
    // return data.map(item => ({
    //   "ເລກທູລະກຳ": item["transactionID"],
    //   "ຈຳນວນເງິນ": item["totalvalue"],
    //   "ຊ່ອງທາງ": item["paymentref"],
    //   "ວັນທີ": item["createAt"].toString(),
    //   "ref": item['vendingsales'],
    //   "ຍິງຕົກເອງ": item['isSendDrop'] ? 'YES' : '',
    //   "ຕ້ອງທວງເງິນ": item['isRequest'] ? 'YES' : '',
    // }));

    const filtered = data.map(item => ({
      "ເລກທູລະກຳ": item["transactionID"],
      "ຈຳນວນເງິນ": item["totalvalue"],
      "ຊ່ອງທາງ": item["paymentref"],
      "ວັນທີ": item["createAt"].toString(),
      "ref": item['vendingsales'],
      "ຍິງຕົກເອງ": item['isSendDrop'] ? 'YES' : '',
      "ຕ້ອງທວງເງິນ": item['isRequest'] ? 'YES' : '',
      "ເລກຕູ້": this._lServer.find(
        item2 => item2["transactionID"] === item["transactionID"]
      )?.machineId ?? ""

    }));

    // -------- คำนวณข้อมูลสรุป --------

    // 1) จำนวนทั้งหมด
    const totalCount = filtered.length;

    // 2) รวมจำนวนเงินทั้งหมด
    const totalMoney = filtered.reduce((sum, item) => {
      return sum + Number(item["ຈຳນວນເງິນ"]);
    }, 0);

    // 3) อัตรา 4.5%
    const rate = 4.5;

    // 4) ค่าบริการ Franchise fee
    const franchiseFee = (totalMoney * rate) / 100;

    // -------- เพิ่ม 4 records ต่อท้าย --------
    const summaryRows = [
      {
        "ລາຍການສະຫຼຸບ": "ຈຳນວນທັງໝົດ",
        "ຄ່າ": totalCount
      },
      {
        "ລາຍການສະຫຼຸບ": "ເງິນທັງໝົດ",
        "ຄ່າ": totalMoney
      }
    ];

    this.finalArrayData = summaryRows;

    return [...filtered, ...summaryRows];
  }

  // ✅ เมื่อเลือกไฟล์ Excel
  async onFileSelected(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      this.selectedFile = file;
      this.dataExcel = await this.readExcelFile(file);

      console.log('📘 อ่านไฟล์สำเร็จ:', this.dataExcel.length, 'แถว');
    } catch (error) {
      console.error('Error onFileSelected:', error);
    }
  }

  // ✅ เมื่อกดปุ่ม Process
  async onProcess() {
    try {
      if (!this.selectedFile) {
        alert('กรุณาเลือกไฟล์ Excel ก่อน');
        return;
      }

      const data = {
        machineId: this.machineId,
        fromDate: this.fromDate,
        toDate: this.toDate,
        token: this.token,
      };

      const dataServer = await this.apiService
        .loadVendingMachineSaleBillReport(data)
        .toPromise();

      const run = JSON.parse(JSON.stringify(dataServer['data']?.rows ?? []));
      const bankIds = new Set(this.dataExcel.map(b => b['ເລກທູລະກຳ']));
      const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));

      this._l = [];
      for (let index = 0; index < myNotInBank.length; index++) {
        const element = myNotInBank[index];
        const responseCheck = await this.apiService
          .checkLaoQRTransaction(element?.transactionID)
          .toPromise();

        if (responseCheck['status'] == 1) {
          this._l.push(responseCheck['data']?.data);
        }
      }

      console.log('✅ Bill Not Received:', this._l);
    } catch (error) {
      console.error('Error onProcess:', error);
    }
  }


  async onProcessBilling() {
    try {
      if (!this.selectedFile) {
        alert('กรุณาเลือกไฟล์ Excel ก่อน');
        return;
      }

      const data = {
        machineId: this.machineId,
        fromDate: this.fromDate,
        toDate: this.toDate,
        token: this.token,
      };

      const paramsData = {
        fromDate: this.fromDate,
        toDate: this.toDate,
        machineId: this.machineId,
        // ownerUuid: this.ownerUuid,
        token: this.token
      }

      const billNotPaid = await this.apiService.loadVendingMachineBillNotPaid(paramsData).toPromise();

      const billNotPaidData = JSON.parse(JSON.stringify(billNotPaid['data']?.rows ?? []));


      const dataServer = await this.apiService
        .loadVendingMachineSaleBillReport(data)
        .toPromise();


      const dataAllPa = {
        machineId: ['55555002', '55555003'],
        fromDate: this.fromDate,
        toDate: this.toDate,
        token: this.token,
      };

      const dataAll = await this.apiService
        .loadVendingMachineSaleBillReportManyMachine(dataAllPa)
        .toPromise();

      const run = JSON.parse(JSON.stringify(dataServer['data']?.rows ?? []));
      this._lServer = run;

      const runAll = JSON.parse(JSON.stringify(dataAll['data']?.rows ?? []));
      this._lServer = runAll;

      // console.log('-----> billPaid :', run);


      const bankIds = new Set(this.dataExcel.map(b => b["ເລກທູລະກຳ"]));
      const myIds = new Set(run.map(m => m.transactionID));

      // 1. bankTrand ที่มีใน mytrand
      const bankInMy = this.dataExcel.filter(b => myIds.has(b["ເລກທູລະກຳ"]));
      // console.log('-----> 1. bankTrand ที่มีใน mytrand :', bankInMy);
      // this.exportBankExcel(bankInMy);


      // 2. bankTrand ที่ไม่มีใน mytrand
      const bankNotInMy = this.dataExcel.filter(b => !myIds.has(b["ເລກທູລະກຳ"]));
      // console.log('-----> 2. bankTrand ที่ไม่มีใน mytrand :', bankNotInMy);
      let myBankNoServer = [];
      let myBankServer = [];
      for (let index = 0; index < bankNotInMy.length; index++) {
        const transactionID = bankNotInMy[index]['ເລກທູລະກຳ'];
        const data = {
          machineId: this.machineId,
          fromDate: this.fromDate,
          toDate: this.toDate,
          token: this.token,
          transactionID: transactionID
        };

        const responseServer = await this.apiService
          .checkDBTransaction(data)
          .toPromise();
        if (responseServer['status'] == 1) {
          myBankServer.push(responseServer['data']?.data);
        } else {
          myBankNoServer.push(bankNotInMy[index])
        }
      }



      // 3. mytrand ที่มีใน bankTrand
      const myInBank = run.filter(m => bankIds.has(m.transactionID));
      // console.log('-----> 3. mytrand ที่มีใน bankTrand :', myInBank);


      // 4. mytrand ที่ไม่มีใน bankTrand
      const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
      let myNotInBankNotPaid = [];
      let myNotInBankPaid = [];

      // console.log('-----> 4. mytrand ที่ไม่มีใน bankTrand :', myNotInBank);
      for (let index = 0; index < myNotInBank.length; index++) {
        const element = myNotInBank[index];
        const responseCheck = await this.apiService
          .checkLaoQRTransaction(element?.transactionID)
          .toPromise();

        if (responseCheck['status'] == 1) {
          myNotInBankPaid.push(responseCheck['data']?.data);
        } else {
          myNotInBankNotPaid.push(element)
        }
      }
      // console.log('-----> 5 myNotInBankNotPaid :', myNotInBankNotPaid);
      // this.exportMyNotInBankNotPaid(myNotInBankNotPaid);
      // console.log('-----> 6 myNotInBankPaid :', myNotInBankPaid);
      // this.exportMyNotInBankPaid(myNotInBankPaid);

      // console.log('-----> 7 myBankNoServer :', myBankNoServer);
      // this.exportMyBankNoServer(myBankNoServer);

      // console.log('-----> 8 myBankServer :', myBankServer);
      // this.exportMyBankServer(myBankServer);


      this.exportAllSheets(bankInMy, myNotInBankNotPaid, myNotInBankPaid, myBankNoServer, myBankServer, billNotPaidData, run, myInBank, this.dataExcel);


      // 4. mytrand ที่ไม่มีใน bankTrand
      // const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
    } catch (error) {
      console.error('Error onProcessBilling:', error);
    }
  }



  async onProcessBillingManyMachine() {
    try {
      if (!this.selectedFile) {
        alert('กรุณาเลือกไฟล์ Excel ก่อน');
        return;
      }

      const data = {
        machineId: ['55555002', '55555003'],
        fromDate: this.fromDate,
        toDate: this.toDate,
        token: this.token,
      };

      const paramsData = {
        fromDate: this.fromDate,
        toDate: this.toDate,
        machineId: this.machineId,
        // ownerUuid: this.ownerUuid,
        token: this.token
      }

      const billNotPaid = await this.apiService.loadVendingMachineBillNotPaidManyMachine(paramsData).toPromise();

      const billNotPaidData = JSON.parse(JSON.stringify(billNotPaid['data']?.rows ?? []));


      const dataServer = await this.apiService
        .loadVendingMachineSaleBillReportManyMachine(data)
        .toPromise();

      const run = JSON.parse(JSON.stringify(dataServer['data']?.rows ?? []));
      this._lServer = run;

      // console.log('-----> billPaid :', run);


      const bankIds = new Set(this.dataExcel.map(b => b["ເລກທູລະກຳ"]));
      const myIds = new Set(run.map(m => m.transactionID));

      // 1. bankTrand ที่มีใน mytrand
      const bankInMy = this.dataExcel.filter(b => myIds.has(b["ເລກທູລະກຳ"]));
      // console.log('-----> 1. bankTrand ที่มีใน mytrand :', bankInMy);
      // this.exportBankExcel(bankInMy);


      // 2. bankTrand ที่ไม่มีใน mytrand
      const bankNotInMy = this.dataExcel.filter(b => !myIds.has(b["ເລກທູລະກຳ"]));
      // console.log('-----> 2. bankTrand ที่ไม่มีใน mytrand :', bankNotInMy);
      let myBankNoServer = [];
      let myBankServer = [];
      for (let index = 0; index < bankNotInMy.length; index++) {
        const transactionID = bankNotInMy[index]['ເລກທູລະກຳ'];
        const data = {
          machineId: this.machineId,
          fromDate: this.fromDate,
          toDate: this.toDate,
          token: this.token,
          transactionID: transactionID
        };

        const responseServer = await this.apiService
          .checkDBTransactionMulti(data)
          .toPromise();
        if (responseServer['status'] == 1) {
          myBankServer.push(responseServer['data']?.data);
        } else {
          myBankNoServer.push(bankNotInMy[index])
        }
      }



      // 3. mytrand ที่มีใน bankTrand
      const myInBank = run.filter(m => bankIds.has(m.transactionID));
      // console.log('-----> 3. mytrand ที่มีใน bankTrand :', myInBank);


      // 4. mytrand ที่ไม่มีใน bankTrand
      const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
      let myNotInBankNotPaid = [];
      let myNotInBankPaid = [];

      // console.log('-----> 4. mytrand ที่ไม่มีใน bankTrand :', myNotInBank);
      for (let index = 0; index < myNotInBank.length; index++) {
        const element = myNotInBank[index];
        const responseCheck = await this.apiService
          .checkLaoQRTransaction(element?.transactionID)
          .toPromise();

        if (responseCheck['status'] == 1) {
          myNotInBankPaid.push(responseCheck['data']?.data);
        } else {
          myNotInBankNotPaid.push(element)
        }
      }


      this.exportAllSheets(bankInMy, myNotInBankNotPaid, myNotInBankPaid, myBankNoServer, myBankServer, billNotPaidData, run, myInBank, this.dataExcel);


      // 4. mytrand ที่ไม่มีใน bankTrand
      // const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
    } catch (error) {
      console.error('Error onProcessBilling:', error);
    }
  }

  // ✅ ยกเลิกไฟล์
  cancelFile() {
    this.selectedFile = null;
    this.dataExcel = [];
  }

  // ✅ อ่านไฟล์ Excel
  // private readExcelFile(file: File): Promise<any[]> {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = (e: any) => {
  //       try {
  //         const data = new Uint8Array(e.target.result);
  //         const workbook = XLSX.read(data, { type: 'array' });
  //         const firstSheet = workbook.SheetNames[0];
  //         const worksheet = workbook.Sheets[firstSheet];
  //         const json = XLSX.utils.sheet_to_json(worksheet);
  //         resolve(json);
  //       } catch (err) {
  //         reject(err);
  //       }
  //     };
  //     reader.onerror = reject;
  //     reader.readAsArrayBuffer(file);
  //   });
  // }

  private readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];

          // 🚨 แก้ปัญหาวันที่ถูกแปลงเป็นตัวเลข
          const json = XLSX.utils.sheet_to_json(worksheet, {
            raw: false     // สำคัญมาก
          });

          resolve(json);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }


  async checkBillNotPaid() {
    const body = {
      "machineId": this.machineId,
      "fromDate": this.fromDate,
      "toDate": this.toDate,
      "token": this.token
    };
    // console.log('checkBillNotPaid :', body);
    this.apiService.showLoading();
    const result = await this.apiService.checkAndConfirmBillToDeliver(body).toPromise();
    this.apiService.dismissLoading();
    if (result['status'] == 1) {
      this.apiService.alertSuccess('ກວດເຄື່ອງສຳເຫຼັດ');
    } else {
      this.apiService.alertError('ເກີດຂໍ້ຜິດພາດໃນການກວດເຄື່ອງ')
    }

  }
}
