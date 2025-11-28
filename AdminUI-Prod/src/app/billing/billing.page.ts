import { Component, Input, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.page.html',
  styleUrls: ['./billing.page.scss'],
})
export class BillingPage implements OnInit {
  private token: string;
  _l: any[] = [];
  fromDate: string;
  toDate: string;
  @Input() machineId: string;

  selectedFile: File | null = null;      // ✅ เก็บไฟล์ที่เลือกไว้
  dataExcel: any[] = [];                 // ✅ ข้อมูลจากไฟล์ Excel

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.token = localStorage.getItem('lva_token');
  }

  // exportBankExcel(bankInMyData: any) {
  //   const data = bankInMyData.map((item: any) => ({
  //     "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
  //     "ຈຳນວນເງິນ": item["ຈຳນວນເງິນ"],
  //     "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
  //     "ວັນທີ": item["ວັນທີ"].toString()
  //   }));

  //   // 1) สร้าง worksheet
  //   const ws = XLSX.utils.json_to_sheet(data);

  //   // 2) สร้าง workbook
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Bank Report");

  //   // 3) Convert → binary
  //   const excelBuffer = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   // 4) Download
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/octet-stream"
  //   });

  //   const filename = `ບິນທັງໝົດທີ່ຕົງກັນ-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
  //   saveAs(blob, filename);
  // }


  mapBankInMy(data: any[]) {
    return data.map(item => ({
      "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
      "ຈຳນວນເງິນ": item["ຈຳນວນເງິນ"],
      "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
      "ວັນທີ": item["ວັນທີ"].toString()
    }));
  }



  // exportMyNotInBankNotPaid(bankInMyData: any) {
  //   const data = bankInMyData.map((item: any) => ({
  //     "ເລກທູລະກຳ": item["transactionID"],
  //     "ຈຳນວນເງິນ": item["totalvalue"],
  //     "ຊ່ອງທາງ": item["paymentref"],
  //     "ວັນທີ": item["createdAt"].toString()
  //   }));

  //   // 1) สร้าง worksheet
  //   const ws = XLSX.utils.json_to_sheet(data);

  //   // 2) สร้าง workbook
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Bank Report");

  //   // 3) Convert → binary
  //   const excelBuffer = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   // 4) Download
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/octet-stream"
  //   });

  //   const filename = `ບິນທີ່ບໍ່ມີໃນທະນາຄານ-ບໍ່ໄດ້ຈ່າຍ-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
  //   saveAs(blob, filename);
  // }

  mapMyNotInBankNotPaid(data: any[]) {
    // return data.map(item => ({
    //   "ເລກທູລະກຳ": item["transactionID"],
    //   "ຈຳນວນເງິນ": item["totalvalue"],
    //   "ຊ່ອງທາງ": item["paymentref"],
    //   "ວັນທີ": item["createdAt"].toString()
    // }));

    const EXCEL_LIMIT = 32767;

    return data.map(item => {
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
        "ຈຳນວນເງິນ": item["totalvalue"],
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": item["createdAt"].toString(),
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


  // exportMyNotInBankPaid(bankInMyData: any) {
  //   const data = bankInMyData.map((item: any) => ({
  //     "ເລກທູລະກຳ": item["billNumber"],
  //     "ຈຳນວນເງິນ": item["txnAmount"],
  //     "ຊ່ອງທາງ": item["refNo"],
  //     "ວັນທີ": item["txnDateTime"].toString()
  //   }));

  //   // 1) สร้าง worksheet
  //   const ws = XLSX.utils.json_to_sheet(data);

  //   // 2) สร้าง workbook
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Bank Report");

  //   // 3) Convert → binary
  //   const excelBuffer = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   // 4) Download
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/octet-stream"
  //   });

  //   const filename = `ບິນທີ່ບໍ່ມີໃນທະນາຄານ-ຈ່າຍແລ້ວ-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
  //   saveAs(blob, filename);
  // }


  mapMyNotInBankPaid(data: any[]) {
    return data.map(item => ({
      "ເລກທູລະກຳ": item["billNumber"],
      "ຈຳນວນເງິນ": item["txnAmount"],
      "ຊ່ອງທາງ": item["refNo"],
      "ວັນທີ": item["txnDateTime"].toString()
    }));
  }


  // exportMyBankNoServer(bankInMyData: any) {
  //   const data = bankInMyData.map((item: any) => ({
  //     "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
  //     "ຈຳນວນເງິນ": item["ຈຳນວນເງິນ"],
  //     "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
  //     "ວັນທີ": item["ວັນທີ"].toString()
  //   }));

  //   // 1) สร้าง worksheet
  //   const ws = XLSX.utils.json_to_sheet(data);

  //   // 2) สร้าง workbook
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Bank Report");

  //   // 3) Convert → binary
  //   const excelBuffer = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   // 4) Download
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/octet-stream"
  //   });
  //   const filename = `ບິນທີ່ມີໃນທະນາຄານແລະບໍ່ມີໃນserver-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
  //   saveAs(blob, filename);
  // }

  mapMyBankNoServer(data: any[]) {
    return data.map(item => ({
      "ເລກທູລະກຳ": item["ເລກທູລະກຳ"],
      "ຈຳນວນເງິນ": item["ຈຳນວນເງິນ"],
      "ຊ່ອງທາງ": item["ຊ່ອງທາງ"],
      "ວັນທີ": item["ວັນທີ"].toString()
    }));
  }


  // exportMyBankServer(bankInMyData: any) {
  //   const data = bankInMyData.map((item: any) => ({
  //     "ເລກທູລະກຳ": item["transactionID"],
  //     "ຈຳນວນເງິນ": item["totalvalue"],
  //     "ຊ່ອງທາງ": item["paymentref"],
  //     "ວັນທີ": item["createdAt"].toString()
  //   }));

  //   // 1) สร้าง worksheet
  //   const ws = XLSX.utils.json_to_sheet(data);

  //   // 2) สร้าง workbook
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Bank Report");

  //   // 3) Convert → binary
  //   const excelBuffer = XLSX.write(wb, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   // 4) Download
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/octet-stream"
  //   });

  //   const filename = `ບິນທີ່ມີໃນທະນາຄານແລະມີໃນserver-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
  //   saveAs(blob, filename);
  // }

  mapMyBankServer(data: any[]) {
    // return data.map(item => ({
    //   "ເລກທູລະກຳ": item["transactionID"],
    //   "ຈຳນວນເງິນ": item["totalvalue"],
    //   "ຊ່ອງທາງ": item["paymentref"],
    //   "ວັນທີ": item["createdAt"].toString()
    // }));
    const EXCEL_LIMIT = 32767;

    return data.map(item => {
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
        "ຈຳນວນເງິນ": item["totalvalue"],
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": item["createdAt"].toString(),
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
    // return data.map(item => ({
    //   "ເລກທູລະກຳ": item["transactionID"],
    //   "ຈຳນວນເງິນ": item["totalvalue"],
    //   "ຊ່ອງທາງ": item["paymentmethod"],
    //   "ວັນທີ": item["createdAt"].toString()
    // }));
    const EXCEL_LIMIT = 32767;

    return data.map(item => {
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
        "ຈຳນວນເງິນ": item["totalvalue"],
        "ຊ່ອງທາງ": item["paymentmethod"],
        "ວັນທີ": item["createdAt"].toString(),
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

    return data.map(item => {
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
        "ຈຳນວນເງິນ": item["totalvalue"],
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": item["createdAt"].toString(),
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

    return data.map(item => {
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
        "ຈຳນວນເງິນ": item["totalvalue"],
        "ຊ່ອງທາງ": item["paymentref"],
        "ວັນທີ": item["createdAt"].toString(),
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



  exportAllSheets(
    bankInMy: any,               // ชุด 1
    myNotInBankNotPaid: any,     // ชุด 2
    myNotInBankPaid: any,        // ชุด 3
    myBankNoServer: any,         // ชุด 4
    myBankServer: any,            // ชุด 5
    billNotPaid: any,
    allSaleServer: any,
    allSaleSuccess: any

  ) {
    // 1) เตรียม workbook
    const wb = XLSX.utils.book_new();

    // 2) แปลงข้อมูลแต่ละชุดเป็น sheet
    const sheet1 = XLSX.utils.json_to_sheet(this.mapBankInMy(bankInMy));
    const sheet2 = XLSX.utils.json_to_sheet(this.mapMyNotInBankNotPaid(myNotInBankNotPaid));
    const sheet3 = XLSX.utils.json_to_sheet(this.mapMyNotInBankPaid(myNotInBankPaid));
    const sheet4 = XLSX.utils.json_to_sheet(this.mapMyBankNoServer(myBankNoServer));
    const sheet5 = XLSX.utils.json_to_sheet(this.mapMyBankServer(myBankServer));
    const sheet6 = XLSX.utils.json_to_sheet(this.MapMyBillNotPaid(billNotPaid));
    const sheet7 = XLSX.utils.json_to_sheet(this.MapMySaleServer(allSaleServer));
    const sheet8 = XLSX.utils.json_to_sheet(this.MapMySaleSuccess(allSaleSuccess));




    // 3) เพิ่มลง workbook พร้อมตั้งชื่อแต่ละแท็บ
    XLSX.utils.book_append_sheet(wb, sheet1, "ບິນທັງໝົດທີ່ຕົງກັນ");
    XLSX.utils.book_append_sheet(wb, sheet8, "ບິນທັງໝົດທີ່ຕົງກັນພ້ອມສິນຄ້າ");
    XLSX.utils.book_append_sheet(wb, sheet2, "ບິນຍິງຕົກເອງ");
    XLSX.utils.book_append_sheet(wb, sheet3, "ບິນທີ່ຕ້ອງທວງເງິນ");
    XLSX.utils.book_append_sheet(wb, sheet4, "ບິນທີ່ບໍ່ຮູ້ທີ່ມາຂອງເງິນ");
    XLSX.utils.book_append_sheet(wb, sheet5, "ບິນທີ່ມີໃນທະນາຄານແລະມີໃນserver");
    XLSX.utils.book_append_sheet(wb, sheet6, "ບິນບໍ່ທັນຈ່າຍ");
    XLSX.utils.book_append_sheet(wb, sheet7, "ການຂາຍທັງໝົດ");



    // 4) สร้างไฟล์ Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // 5) ชื่อไฟล์
    const filename = `ລາຍງານທັງໝົດ-(${this.machineId}-${this.fromDate}ຫາ${this.toDate}).xlsx`;
    saveAs(blob, filename);
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

      const run = JSON.parse(JSON.stringify(dataServer['data']?.rows ?? []));

      // console.log('-----> billPaid :', run);




      const bankIds = new Set(this.dataExcel.map(b => b["ເລກທູລະກຳ"]));
      const myIds = new Set(run.map(m => m.transactionID));

      // 1. bankTrand ที่มีใน mytrand
      const bankInMy = this.dataExcel.filter(b => myIds.has(b["ເລກທູລະກຳ"]));
      console.log('-----> 1. bankTrand ที่มีใน mytrand :', bankInMy);
      // this.exportBankExcel(bankInMy);


      // 2. bankTrand ที่ไม่มีใน mytrand
      const bankNotInMy = this.dataExcel.filter(b => !myIds.has(b["ເລກທູລະກຳ"]));
      console.log('-----> 2. bankTrand ที่ไม่มีใน mytrand :', bankNotInMy);
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
      console.log('-----> 3. mytrand ที่มีใน bankTrand :', myInBank);


      // 4. mytrand ที่ไม่มีใน bankTrand
      const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
      let myNotInBankNotPaid = [];
      let myNotInBankPaid = [];

      console.log('-----> 4. mytrand ที่ไม่มีใน bankTrand :', myNotInBank);
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
      console.log('-----> 5 myNotInBankNotPaid :', myNotInBankNotPaid);
      // this.exportMyNotInBankNotPaid(myNotInBankNotPaid);
      console.log('-----> 6 myNotInBankPaid :', myNotInBankPaid);
      // this.exportMyNotInBankPaid(myNotInBankPaid);

      console.log('-----> 7 myBankNoServer :', myBankNoServer);
      // this.exportMyBankNoServer(myBankNoServer);

      console.log('-----> 8 myBankServer :', myBankServer);
      // this.exportMyBankServer(myBankServer);


      this.exportAllSheets(bankInMy, myNotInBankNotPaid, myNotInBankPaid, myBankNoServer, myBankServer, billNotPaidData, run, myInBank);


      // 4. mytrand ที่ไม่มีใน bankTrand
      // const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));
    } catch (error) {
      console.error('Error onProcess:', error);
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
