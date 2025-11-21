import { Component, OnInit } from '@angular/core';
import { IonicStorageService } from '../ionic-storage.service';
import { IVendingMachineSale } from '../services/syste.model';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { ExcelService } from '../services/excel.service';
import dayjs from 'dayjs';
@Component({
  selector: 'app-reportrefillsale',
  templateUrl: './reportrefillsale.page.html',
  styleUrls: ['./reportrefillsale.page.scss'],
})
export class ReportrefillsalePage implements OnInit {
  sells = new Array<IVendingMachineSale>();
  f_sells = new Array<IVendingMachineSale>();
  url = this.apiService.url;
  byTimes = new Array<string>();
  constructor(public storage: IonicStorageService, public modalCtrl: ModalController, public apiService: ApiService, public excelService: ExcelService) { }

  ngOnInit() {
    const k = 'refillSaleStock';
    this.storage.get(k + '_', k).then(rx => {
      const b = rx.v as Array<IVendingMachineSale>;
      const s = b ? b : [];
      this.sells.push(...s);
      this.byTimes.push(...new Set(this.sells.map(v => v.updatedAt.toString())))
    })
  }
  setFilter(t: string) {
    if (!t) return this.f_sells = this.sells;
    this.f_sells = this.sells.filter(v => v.updatedAt.toString() == t);
  }
  close() {
    this.modalCtrl.dismiss();
  }
  clear() {
    const conf = confirm('Are you sure ?');
    if (!conf) return;
    const p = prompt('type 123456');
    if (p != '123456') return;

    const k = 'refillSaleStock';
    this.sells.length = 0;
    this.f_sells.length = 0;
    this.byTimes.length = 0;
    this.storage.set(k + '_', this.sells, k);
    alert('Clear succeeded')
  }
  saveToExcel() {
    const x = [];
    this.sells.forEach(v => {
      x.push({ id: v.stock.id, position: v.position, machineid: v.machineId, max: v.max, stockid: v.stock.id, price: v.stock.price, qtt: v.stock.qtty, name: v.stock.name })
    });
    this.excelService.exportAsExcelFile(x, 'refillreport_' + new Date().getTime())
  }
  exportJsonFile() {
    const x = [];
    this.sells.forEach(v => {
      x.push({ id: v.stock.id, position: v.position, machineid: v.machineId, max: v.max, stockid: v.stock.id, price: v.stock.price, qtt: v.stock.qtty, name: v.stock.name })
    });
    this.excelService.exportAsExcelFile(x, 'refillreport_' + new Date().getTime())
  }
  importExcel(even: any) {
    this.excelService.onFileChange(even);
    setTimeout(() => {
      const cf = confirm('Import this file?');
      if (!cf) return alert('Canceled');
      console.log('excel DATA', this.excelService.data);

      this.sells = this.excelService.data.data;
    }, 3000);
  }

}
