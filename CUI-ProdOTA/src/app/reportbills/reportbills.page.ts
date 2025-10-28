import { Component, OnInit } from '@angular/core';
import { IBillProcess, IStock } from '../services/syste.model';
import { IonicStorageService } from '../ionic-storage.service';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { ExcelService } from '../services/excel.service';
import * as moment from 'moment-timezone';
@Component({
  selector: 'app-reportbills',
  templateUrl: './reportbills.page.html',
  styleUrls: ['./reportbills.page.scss'],
})
export class ReportbillsPage implements OnInit {
  bills = new Array<IBillProcess>();
  byTimes = new Array<string>();
  f_sells = new Array<IBillProcess>();
  today_bills = new Array<IBillProcess>();
  url = this.apiService.url;
  totalSale = 0;
  sumSale = new Array<{ name: string, price: number, qtty: number, total: number, image: string, id: number }>();
  show = 1;
  constructor(public storage: IonicStorageService, public modal: ModalController, public apiService: ApiService, public excelService: ExcelService) { }

  ngOnInit() {
    this.storage.get('bill_', 'bills').then(rx => {
      const b = rx.v as Array<IBillProcess>;
      const bll = b ? b : [];
      bll.forEach(v => v.position = v.position);
      this.bills.push(...bll);
      this.todayBills(bll);
      this.summarize(this.bills.map(v => v.bill.vendingsales[0].stock));
    })
  }
  todayBills(v: Array<IBillProcess>) {
    this.today_bills = this.bills.filter(v => moment(v.bill.paymenttime).diff(new Date(), 'days') == 0);
  }
  summarize(v: Array<IStock>) {
    this.sumSale = new Array<{ name: string, price: number, qtty: number, total: number, image: string, id: number }>();
    v.forEach(v => {
      const x = this.sumSale.find(vx => vx.name == v.name);
      if (x != undefined) {
        x.qtty++;
        x.total = x.qtty * x.price;
      } else {
        this.sumSale.push({ name: v.name, price: v.price, qtty: 1, total: v.price, image: '', id: v.id })
      }
    });
    this.sumSale.sort((a, b) => b.total - a.total)
  }
  // setFilter(t: string) {
  //   if (!t) return this.f_sells = this.bills;
  //   this.f_sells = this.bills.filter(v => v.bill.updatedAt.toString() == t);
  // }
  close() {
    this.modal.dismiss();
  }
  clear() {
    const conf = confirm('Are you sure ?');
    if (!conf) return;
    const p = prompt('type 123456');
    if (p != '123456') return;
    this.bills.length = 0;
    this.storage.set('bill_', this.bills, 'bills');
    alert('Clear succeeded')
  }
  saveBillToExcel() {
    const x = [];
    this.bills.forEach(v => {
      x.push({ id: v.bill.id, price: v.bill.vendingsales[0].stock.price, position: v.position, totalvalue: v.bill.totalvalue, transaction: v.bill.transactionID, paymenmethod: v.bill.paymentmethod, paymentstatus: v.bill.paymentstatus, paymenttime: v.bill.paymenttime, requesttime: v.bill.requestpaymenttime })
    })
    this.excelService.exportAsExcelFile(x, 'billreport_' + new Date().getTime())
  }

  saveSumBillsToExcel() {
    const x = [];
    this.sumSale.forEach(v => {
      x.push({ name: v.name, price: v.price, qtty: v.qtty, total: v.total })
    })
    this.excelService.exportAsExcelFile(x, 'billreport_' + new Date().getTime());
  }
  saveTodayBillToExcel() {
    const x = [];
    this.today_bills.forEach(v => {
      x.push({ id: v.bill.id, price: v.bill.vendingsales[0].stock.price, position: v.position, totalvalue: v.bill.totalvalue, transaction: v.bill.transactionID, paymenmethod: v.bill.paymentmethod, paymentstatus: v.bill.paymentstatus, paymenttime: v.bill.paymenttime, requesttime: v.bill.requestpaymenttime })
    })
    this.excelService.exportAsExcelFile(x, 'billreport_' + new Date().getTime());
  }
}
