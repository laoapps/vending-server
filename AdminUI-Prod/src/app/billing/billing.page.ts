import { Component, Input, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
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

  // ✅ ยกเลิกไฟล์
  cancelFile() {
    this.selectedFile = null;
    this.dataExcel = [];
  }

  // ✅ อ่านไฟล์ Excel
  private readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const json = XLSX.utils.sheet_to_json(worksheet);
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
