import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IBillProcessLocal } from './syste.model';


@Injectable({
  providedIn: 'root'
})
export class IndexdblocalService extends Dexie {
  billProcesses!: Table<IBillProcessLocal, number>;


  constructor() {
    super('VendingMachineLocalDB'); // ชื่อฐานข้อมูล

    this.version(1).stores({
      billProcesses: '++transactionID, machineId, position,max'
    });
  }

  // เพิ่มข้อมูล BillProcess ลงใน IndexedDB
  async addBillProcess(billProcess: IBillProcessLocal) {
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
}
