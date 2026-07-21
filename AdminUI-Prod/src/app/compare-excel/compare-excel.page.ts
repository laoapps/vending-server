import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import * as Excel from 'exceljs';



@Component({
  selector: 'app-compare-excel',
  templateUrl: './compare-excel.page.html',
  styleUrls: ['./compare-excel.page.scss'],
})
export class CompareExcelPage implements OnInit {

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

      console.log('-----> FILE :', JSON.stringify(file));


      this.checkMissing(file).catch(err => {
        console.error('❌ Error checkMissing:', err.message);
      });
      // const rawData = await this.readExcelFile(file);
      // console.log('-----> rawData :', rawData);
      // const uniqueMap = new Map<string, any>();

      // for (const row of rawData) {
      //   const transactionNo = row['ເລກທູລະກຳ'];

      //   if (transactionNo && !uniqueMap.has(transactionNo)) {
      //     uniqueMap.set(transactionNo, row);
      //   }
      // }
    } catch (error) {
      console.error('Error onFileSelected:', error);
    }
  }


  async checkMissing(filePath: string, sheetName?: string) {
    try {
      const wb = new Excel.Workbook();
      console.log(`📂 กำลังอ่านไฟล์: ${JSON.stringify(filePath)}...`);
      await wb.xlsx.readFile(filePath);

      // 📍 แก้ไขตรงนี้: ถ้ามีระบุชื่อชีทให้ใช้ชื่อนั้น ถ้าไม่มีให้ดึงชีทแรก (worksheets[0])
      const sheet = sheetName ? wb.getWorksheet(sheetName) : wb.worksheets[0];

      if (!sheet) {
        console.error(`❌ ไม่พบชีทที่ต้องการในไฟล์นี้ (ระบุ: ${sheetName || 'ชีทแรก'})`);
        return;
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

      const missingIn1: string[] = [];
      const missingIn2: string[] = [];

      for (const [id2, rowNum] of list2.entries()) {
        if (!list1.has(id2)) {
          missingIn1.push(`- แถวที่ ${rowNum} ใน Excel: ID [${id2}]`);
        }
      }

      for (const [id1, rowNum] of list1.entries()) {
        if (!list2.has(id1)) {
          missingIn2.push(`- แถวที่ ${rowNum} ใน Excel: ID [${id1}]`);
        }
      }

      console.log('--- 🔴 รายการที่มีใน [ชุด 2] แต่หายไปจาก [ชุด 1] ---');
      if (missingIn1.length > 0) {
        console.log(missingIn1.join('\n'));
      } else {
        console.log('✅ ไม่มี (ครบถ้วน)');
      }

      console.log('\n--- 🔴 รายการที่มีใน [ชุด 1] แต่หายไปจาก [ชุด 2] ---');
      if (missingIn2.length > 0) {
        console.log(missingIn2.join('\n'));
      } else {
        console.log('✅ ไม่มี (ครบถ้วน)');
      }
    } catch (error) {
      console.log('-----> Error checkMissing :', error);
    }
  }

}
