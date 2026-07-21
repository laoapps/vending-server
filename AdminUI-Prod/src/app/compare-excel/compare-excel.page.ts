import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import * as Excel from 'exceljs';

interface MissingExcelItem {
  id: string;
  rowNumber: number;
}

interface CompareExcelResult {
  fileName: string;
  sheetName: string;
  list1Count: number;
  list2Count: number;
  missingIn1: MissingExcelItem[];
  missingIn2: MissingExcelItem[];
}

@Component({
  selector: 'app-compare-excel',
  templateUrl: './compare-excel.page.html',
  styleUrls: ['./compare-excel.page.scss'],
})
export class CompareExcelPage implements OnInit {
  isLoading = false;
  errorMessage = '';
  result: CompareExcelResult | null = null;

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
    const input = event.target as HTMLInputElement;

    try {
      const file = input.files?.[0];
      if (!file) return;

      this.isLoading = true;
      this.errorMessage = '';
      this.result = null;
      await this.checkMissing(file);
      // const rawData = await this.readExcelFile(file);
      // console.log('-----> rawData :', rawData);
      // const uniqueMap = new Map<string, any>();

      // for (const row of rawData) {
      //   const transactionNo = row['ເລກທູລະກຳ'];

      //   if (transactionNo && !uniqueMap.has(transactionNo)) {
      //     uniqueMap.set(transactionNo, row);
      //   }
      // }
    } catch (error: any) {
      console.error('Error onFileSelected:', error);
      this.errorMessage = error?.message || 'ບໍ່ສາມາດອ່ານໄຟລ໌ Excel ໄດ້ ກະລຸນາລອງໃໝ່';
    } finally {
      this.isLoading = false;
      input.value = '';
    }
  }


  async checkMissing(file: File, sheetName?: string) {
    try {
      const wb = new Excel.Workbook();
      console.log(`📂 กำลังอ่านไฟล์: ${file.name}...`);
      const buffer = await file.arrayBuffer();
      await wb.xlsx.load(buffer);

      // 📍 แก้ไขตรงนี้: ถ้ามีระบุชื่อชีทให้ใช้ชื่อนั้น ถ้าไม่มีให้ดึงชีทแรก (worksheets[0])
      const sheet = sheetName ? wb.getWorksheet(sheetName) : wb.worksheets[0];

      if (!sheet) {
        throw new Error(`ບໍ່ພົບຊີດທີ່ຕ້ອງການໃນໄຟລ໌ນີ້ (ລະບຸ: ${sheetName || 'ຊີດທຳອິດ'})`);
      }

      console.log(`📄 กำลังตรวจสอบชีท: [${sheet.name}]`);

      const list1 = new Map<string, number>(); // เก็บ ID จากคอลัมน์ A
      const list2 = new Map<string, number>(); // เก็บ ID จากคอลัมน์ G

      // วนลูปอ่านข้อมูลทุกบรรทัด
      sheet.eachRow((row, rowNum) => {
        const id1 = String(row.getCell(1).value || '').trim();
        if (id1) list1.set(id1, rowNum);

        const id2 = String(row.getCell(7).value || '').trim();
        if (id2) list2.set(id2, rowNum);
      });

      console.log(`\n📊 จำนวนข้อมูล ชุดที่ 1 (คอลัมน์ A-D): ${list1.size} รายการ`);
      console.log(`📊 จำนวนข้อมูล ชุดที่ 2 (คอลัมน์ G-K): ${list2.size} รายการ\n`);

      const missingIn1: MissingExcelItem[] = [];
      const missingIn2: MissingExcelItem[] = [];

      for (const [id2, rowNum] of list2.entries()) {
        if (!list1.has(id2)) {
          missingIn1.push({ id: id2, rowNumber: rowNum });
        }
      }

      for (const [id1, rowNum] of list1.entries()) {
        if (!list2.has(id1)) {
          missingIn2.push({ id: id1, rowNumber: rowNum });
        }
      }

      this.result = {
        fileName: file.name,
        sheetName: sheet.name,
        list1Count: list1.size,
        list2Count: list2.size,
        missingIn1,
        missingIn2
      };

      console.log('--- 🔴 รายการที่มีใน [ชุด 2] แต่หายไปจาก [ชุด 1] ---');
      if (missingIn1.length > 0) {
        console.log(missingIn1.map(item => `- แถวที่ ${item.rowNumber} ใน Excel: ID [${item.id}]`).join('\n'));
      } else {
        console.log('✅ ไม่มี (ครบถ้วน)');
      }

      console.log('\n--- 🔴 รายการที่มีใน [ชุด 1] แต่หายไปจาก [ชุด 2] ---');
      if (missingIn2.length > 0) {
        console.log(missingIn2.map(item => `- แถวที่ ${item.rowNumber} ใน Excel: ID [${item.id}]`).join('\n'));
      } else {
        console.log('✅ ไม่มี (ครบถ้วน)');
      }
    } catch (error) {
      console.log('-----> Error checkMissing :', error);
      throw error;
    }
  }

}
