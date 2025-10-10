import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { ApiService } from '../services/api.service';


@Component({
  selector: 'app-billing',
  templateUrl: './billing.page.html',
  styleUrls: ['./billing.page.scss'],
})
export class BillingPage implements OnInit {
  private token: string;


  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.token = localStorage.getItem('lva_token');

  }

  async onFileSelected(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // ✅ รออ่านไฟล์ก่อน
      const dataExcel = await this.readExcelFile(file);

      // ✅ จากนั้นค่อยเรียก API แล้วรอผลลัพธ์
      const data = {
        machineId: '66660004',
        fromDate: '2025-10-01',
        toDate: '2025-10-10',
        token: this.token,
      };

      const dataServer = await this.apiService.loadVendingMachineSaleBillReport(data).toPromise();
      const run = JSON.parse(JSON.stringify(dataServer['data']?.rows ?? []));



      const bankIds = new Set(dataExcel.map(b => b["ເລກທູລະກຳ"]));
      console.log('📊 ข้อมูลจากไฟล์ Excel:', bankIds);
      console.log('loadVendingMachineSaleBillReport :', run);



      const myNotInBank = run.filter(m => !bankIds.has(m.transactionID));

      console.log('All Data :', myNotInBank);


    } catch (error) {
      console.error('Error onFileSelected :', error);
    }
  }

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

}
