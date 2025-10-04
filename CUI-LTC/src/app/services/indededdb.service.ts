import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IBillProcess } from './syste.model';


@Injectable({
  providedIn: 'root'
})
export class IndexedDBService extends Dexie {
  billProcesses!: Table<IBillProcess, number>;

  constructor() {
    super('VendingMachineDB'); // ชื่อฐานข้อมูล

    this.version(1).stores({
      billProcesses: '++transactionID, ownerUuid, position'
    });
  }

  // เพิ่มข้อมูล BillProcess ลงใน IndexedDB
  async addBillProcess(billProcess: IBillProcess) {
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