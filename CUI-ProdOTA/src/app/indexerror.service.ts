import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { ILocalLog } from './services/syste.model';

@Injectable({
  providedIn: 'root'
})
export class IndexerrorService extends Dexie {
  billProcesses!: Table<ILocalLog, number>;

  constructor() {
    super('VendingMachineLog'); // ชื่อฐานข้อมูล

    this.version(2).stores({
      billProcesses: '++id' // ปรับสคีมาให้เข้ากับ IBillProcess ใหม่
    });
  }

  // เพิ่มข้อมูล BillProcess ลงใน IndexedDB
  async addBillProcess(billProcess: ILocalLog) {
    try {
      return await this.billProcesses.add(billProcess);
    } catch (error) {
      console.error('Failed to add bill process:', error);
    }

  }

  // ดึงข้อมูลทั้งหมด
  async getBillProcesses() {
    return await this.billProcesses.toArray();
  }

  async getAllErrorData() {
    return await this.billProcesses.toArray().then(processes => processes.map(process => process.errorData));
  }

  // ดึงข้อมูล BillProcess ตาม machineId


  // ลบข้อมูล BillProcess ตาม id
  async deleteBillProcess(id: number) {
    try {
      return await this.billProcesses.delete(id);
    } catch (error) {
      console.error('Failed to delete bill process:', error);
    }

  }

  // ลบข้อมูลทั้งหมดในตาราง billProcesses
  async clearAllBillProcesses() {
    try {
      await this.billProcesses.clear();
      return { success: true, message: 'All bill processes have been cleared.' };
    } catch (error) {
      return { success: false, message: `Failed to clear bill processes: ${error}` };
    }
  }

  // ลบทั้งฐานข้อมูล VendingMachineDB (ถ้าต้องการ)
  async deleteDatabase() {
    try {
      await this.delete();
      return { success: true, message: 'VendingMachineDB has been deleted.' };
    } catch (error) {
      return { success: false, message: `Failed to delete database: ${error}` };
    }
  }
}
