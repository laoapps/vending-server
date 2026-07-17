import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-compare-excel',
  templateUrl: './compare-excel.page.html',
  styleUrls: ['./compare-excel.page.scss'],
})
export class CompareExcelPage implements OnInit {
  dataExcel: any[] = [];
  dataExcel2: any[] = [];



  constructor() { }

  ngOnInit() {
  }


  markDuplicateRows(data: any[]): any[] {
    const countMap = new Map<string, number>();

    // นับจำนวน transaction ก่อน
    for (const row of data) {
      const transactionNo = row["ເລກທູລະກຳ"];
      if (!transactionNo) continue;

      countMap.set(transactionNo, (countMap.get(transactionNo) || 0) + 1);
    }

    // ใส่ field ຂໍ້ມູນຊ້ຳ
    for (const row of data) {
      const transactionNo = row["ເລກທູລະກຳ"];
      if (!transactionNo) continue;

      if ((countMap.get(transactionNo) || 0) > 1) {
        row["ຂໍ້ມູນຊ້ຳ"] = "ແມ່ນ";
      }
    }

    return data;
  }

  async onFileSelected(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;


      const rawData = await this.readExcelFile(file);
      // console.log('-----> rawData :', rawData);
      // const uniqueMap = new Map<string, any>();

      // for (const row of rawData) {
      //   const transactionNo = row['ເລກທູລະກຳ'];

      //   if (transactionNo && !uniqueMap.has(transactionNo)) {
      //     uniqueMap.set(transactionNo, row);
      //   }
      // }

      this.dataExcel = this.markDuplicateRows(Array.from(rawData.values()));

      console.log('📘 หลังตัดข้อมูลซ้ำ เหลือ:', this.dataExcel.length, 'แถว', 'DATA :', JSON.stringify(this.dataExcel));
      console.log('-----> dataExcel :', JSON.stringify(this.dataExcel[0]));


    } catch (error) {
      console.error('Error onFileSelected:', error);
    }
  }



  async onFileSelected2(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;


      const rawData = await this.readExcelFile(file);
      this.dataExcel2 = this.markDuplicateRows(Array.from(rawData.values()));
      console.log('📘 หลังตัดข้อมูลซ้ำ เหลือ:', this.dataExcel2.length, 'แถว', 'DATA :', JSON.stringify(this.dataExcel2));
    } catch (error) {
      console.error('Error onFileSelected:', error);
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
}
