import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IBillSaveSale } from './services/syste.model';

@Injectable({
  providedIn: 'root'
})
export class Indexsavesale extends Dexie {
  billProcesses!: Table<IBillSaveSale, number>;

  constructor() {
    super('VendingMachineSaveSale');

    this.version(1).stores({
      billProcesses: '++transactionID, bills, dropPositionData'
    });
  }

  // เพิ่มข้อมูล BillProcess ลงใน IndexedDB
  async addBillProcess(billProcess: IBillSaveSale) {
    return await this.billProcesses.add(billProcess);
  }

  // ดึงข้อมูลทั้งหมด
  async getBillProcesses() {
    return await this.billProcesses.toArray();
  }

  // ดึงข้อมูล BillProcess ตาม transactionID
  async getBillProcessByTransactionID(transactionID: number) {
    return await this.billProcesses.get(transactionID);
  }

  // ลบข้อมูล BillProcess
  async deleteBillProcess(transactionID: number) {
    return await this.billProcesses.delete(transactionID);
  }

  async clearBillProcesses() {
    return await this.billProcesses.clear();
  }
}
