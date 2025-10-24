import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { CUISaleProcess } from '../processes/cuiSale.process';
import { IENMessage } from 'src/app/models/base.model';
import { SaleReportPage } from '../sale-report/sale-report.page';
import { StockReportPage } from '../stock-report/stock-report.page';
import { ReportdropPage } from 'src/app/reportdrop/reportdrop.page';
import { IVendingMachineSale } from '../../services/syste.model';
import { NewReportSalePage } from 'src/app/new-report-sale/new-report-sale.page';

@Component({
  selector: 'app-cui-sale',
  templateUrl: './cui-sale.page.html',
  styleUrls: ['./cui-sale.page.scss'],
})
export class CuiSalePage implements OnInit {

  @Input() machineId: string;
  @Input() otp: string;
  @Input() _l: Array<IVendingMachineSale>;

  private cuisaleProcess: CUISaleProcess;

  lists: Array<IVendingMachineSale> = [];
  isShowSaleOnly = false;
  isListedByQtty = false;
  constructor(
    public apiService: ApiService
  ) {
    this.cuisaleProcess = new CUISaleProcess(this.apiService);
  }

  ngOnInit() {
    console.log(`_l der`, this._l);
    this.loadCUISaleList();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  loadCUISaleList(): Promise<IVendingMachineSale[]> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        //  await this.cashingService.clear();
        const params = {
          machineId: this.machineId
        }
        console.log(`params`, params);
        const run = await this.cuisaleProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.lists = run.data[0].lists.data;
        console.log(`list`, this.lists);

        if (this.lists != undefined && this.lists.length > 0) {
          // const instock = this.lists.filter(item => item.stock.id != -1);
          this.lists.forEach(v => {
            const x = this._l?.find(x => x.stock?.name === v.stock?.name);
            if (x) { v.stock.image = x.stock.image; v.stock.imageurl = x.stock.imageurl }
          })
        }
        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  sortByQuantityAndPrice(): void {
    this.lists.sort((a, b) => {
      const aPriceValid = a.stock?.price > 0;
      const bPriceValid = b.stock?.price > 0;

      // Prioritize items with price > 0
      if (aPriceValid && !bPriceValid) return -1;
      if (!aPriceValid && bPriceValid) return 1;

      // If both have price > 0 or both don't, sort by qtty
      return a.stock.qtty - b.stock.qtty;
    });
  }
  sortByPosition(): void {
    this.lists.sort((a, b) => a.position - b.position);
  }
  exportToExcel() {
    this.apiService.exportIVendingMachineSaleToExcel(this.lists);
  }
  showSaleSlot() {
    if (this.isListedByQtty) this.sortByPosition();
    this.isShowSaleOnly = true;
    this.isListedByQtty = false;

  }
  showAllSlots() {
    if (this.isListedByQtty) this.sortByPosition();
    this.isShowSaleOnly = false;
    this.isListedByQtty = false;

  }
  listByQtty() {
    this.isListedByQtty = true;
    this.isShowSaleOnly = true;

    this.sortByQuantityAndPrice();
  }
  NewSaleRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(NewReportSalePage, props).then(r => {
      r.present();
    });
  }

  saleRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(SaleReportPage, props).then(r => {
      r.present();
    });
  }


  stockRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(StockReportPage, props).then(r => {
      r.present();
    });
  }

  dropRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(ReportdropPage, props).then(r => {
      r.present();
    });
  }
}
