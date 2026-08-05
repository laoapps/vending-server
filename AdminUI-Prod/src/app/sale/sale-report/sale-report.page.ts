import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingMachineSaleBillReportProcess } from '../processes/loadVendingMachineBillReport.process';
import { SaleReportViewPage } from 'src/app/sale-report-view/sale-report-view.page';
import { IFilteredData } from 'src/app/services/syste.model';
import { ReportBillingPage } from 'src/app/report-billing/report-billing.page';



@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.page.html',
  styleUrls: ['./sale-report.page.scss'],
})


export class SaleReportPage implements OnInit {



  private loadVendingMachineSaleBillReportProcess: LoadVendingMachineSaleBillReportProcess;

  @Input() machineId: string;
  @Input() otp: string;

  datetimeCustom: boolean = true;
  moredatetimeCustom: boolean = false;
  display: boolean = false;

  fromDate: string;
  toDate: string;

  lists: Array<any> = [];
  count: number = 0;
  saleDetailList: Array<any> = [];
  saleSumerizeList: Array<any> = [];

  currentdate: string = '';
  sum_qtty: number = 0;
  sum_total: number = 0;
  paymentstatus: string = '';



  exportOptions: Array<any> = [
    {
      icon: 'fa-solid fa-file-excel text-success',
      text: 'Export Excel'
    }
  ];

  constructor(
    public apiService: ApiService
  ) {
    this.loadVendingMachineSaleBillReportProcess = new LoadVendingMachineSaleBillReportProcess(this.apiService);
  }

  ngOnInit() {
    this.toggleButtons();
  }

  async exportToPDF() {
    this.apiService.modal
      .create({
        component: ReportBillingPage,
        componentProps: {
          saleCount: this.sum_qtty,
          totalCount: this.sum_total,
          fromDate: this.fromDate,
          toDate: this.toDate,
        },
        cssClass: 'custom-modal-full',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  printSaleReport() {
    if (!this.saleSumerizeList?.length) {
      this.apiService.simpleMessage('ບໍ່ມີຂໍ້ມູນຍອດຂາຍໃຫ້ພິມ');
      return;
    }

    const formatNumber = (value: number) =>
      value != null ? Number(value).toLocaleString('en-US') : '0';

    const formatDate = (value: string) => {
      if (!value) return '';
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const pad = (n: number) => String(n).padStart(2, '0');
      // Display in UTC+7 to match table pipe
      const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
    };

    const rows = this.saleSumerizeList.map((sale, i) => {
      const status = sale.paymentstatus == 'paid' ? 'ຈ່າຍແລ້ວ' : 'ເຄື່ອງຕົກແລ້ວ';
      return `
        <tr>
          <td class="col-num">${i + 1}</td>
          <td>${sale.stock?.name ?? ''}</td>
          <td class="col-right">${formatNumber(sale.stock?.price)}</td>
          <td class="col-center">${formatNumber(sale.stock?.qtty)}</td>
          <td class="col-right">${formatNumber(sale.stock?.total)}</td>
          <td class="col-center">${status}</td>
          <td>${formatDate(sale.createdAt)}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="lo">
<head>
  <meta charset="UTF-8"/>
  <title>Sale Report - ${this.machineId || ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans Lao', 'Phetsarath OT', 'DokChampa', Arial, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 12mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 10mm; }
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .sub-title {
      text-align: center;
      font-size: 12px;
      margin-bottom: 14px;
      color: #333;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
      margin-bottom: 14px;
      padding: 10px 12px;
      border: 1px solid #333;
    }
    .summary-item .label { font-size: 11px; color: #444; }
    .summary-item .value { font-size: 13px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #333;
      padding: 5px 6px;
      font-size: 11px;
      vertical-align: top;
    }
    thead th {
      background: #4a90d9 !important;
      color: #fff !important;
      font-weight: 700;
      text-align: center;
    }
    .col-num { width: 36px; text-align: center; }
    .col-center { text-align: center; }
    .col-right { text-align: right; white-space: nowrap; }
    tfoot td {
      font-weight: 800;
      background: #f5d76e !important;
    }
  </style>
</head>
<body>
  <div class="title">ລາຍງານຍອດຂາຍ / Sale Report</div>
  <div class="sub-title">Vending Machine Report</div>
  <div class="summary">
    <div class="summary-item">
      <div class="label">Machine</div>
      <div class="value">${this.machineId || '-'}</div>
    </div>
    <div class="summary-item">
      <div class="label">Date</div>
      <div class="value">${this.currentdate || '-'}</div>
    </div>
    <div class="summary-item">
      <div class="label">SubQTY</div>
      <div class="value">${formatNumber(this.sum_qtty)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Subtotal</div>
      <div class="value">${formatNumber(this.sum_total)}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Price</th>
        <th>QTY</th>
        <th>Total</th>
        <th>Status</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="col-right">ລວມ / Total</td>
        <td class="col-center">${formatNumber(this.sum_qtty)}</td>
        <td class="col-right">${formatNumber(this.sum_total)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
  <script>
    document.fonts.ready.then(function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 400);
    });
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=760');
    if (!win) {
      this.apiService.simpleMessage('Please allow popups for this site.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  toggleButtons() {
    const btns = (document.querySelectorAll('.section-buttons .item') as NodeListOf<HTMLHRElement>);
    btns.forEach((item, index) => {
      item.addEventListener('click', event => {
        item.classList.add('active');
        btns.forEach((obj, oindex) => {
          if (index != oindex) {
            obj.classList.remove('active');
          }
        });
      });
    });
  }

  async exportToExcel() {
    const dataToexport = this.filterData(this.lists)
    // console.log('dataToexport ', dataToexport);
    this.apiService.exportIVendingMachineReportSaleToExcel(dataToexport);


  }





  filterData(data: any[]): IFilteredData[] {
    return data.map((item) => {
      return {
        createdAt: item.createdAt,
        totalvalue: item.totalvalue,
        vendingsales: item.vendingsales.map((v: any) => ({
          position: v.position,
          dropAt: v.dropAt,
          name: v.stock.name,
          qtty: v.stock.qtty,
          price: v.stock.price,
        })),
      };
    });
  }

  displayDateTimeCustom() {
    if (this.datetimeCustom == false) {
      this.datetimeCustom = true;
      this.moredatetimeCustom = false;
      this.clearInput();
    }
  }
  displayMoreDateTimeCustom() {
    if (this.moredatetimeCustom == false) {
      this.datetimeCustom = false;
      this.moredatetimeCustom = true;
      this.clearInput();
    }
  }
  clearInput() {
    this.fromDate = undefined;
    this.toDate = undefined;
  }

  process(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.lists = [];
        this.display = false;

        let params: any = {} as any;
        if (this.datetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.fromDate,
            machineId: this.machineId
          }
          this.currentdate = this.fromDate;

        } else if (this.moredatetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.toDate,
            machineId: this.machineId
          }
          this.currentdate = `From ${this.fromDate} to ${this.toDate}`;

        }

        const run = await this.loadVendingMachineSaleBillReportProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);



        console.log('=====> run', run.data[0].list);


        this.lists = run.data[0].lists;
        this.count = run.data[0].count;
        this.saleDetailList = run.data[0].saleDetailList;
        this.saleSumerizeList = run.data[0].saleSumerizeList;
        if (this.count > 0) this.display = true;
        // console.log('=====> LIST :', this.lists.length, '=====>', this.lists);


        console.log(`saleSumerizeList der`, this.saleSumerizeList.length, '=====>', this.saleSumerizeList);
        this.sum_qtty = this.saleSumerizeList.reduce((a, b) => a + b.stock.qtty, 0);
        this.sum_total = this.saleSumerizeList.reduce((a, b) => a + b.stock.total, 0);



        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  view(list: any): void {
    const props = {
      machineId: this.machineId,
      currentdate: this.currentdate,
      list: list,
      saleDetailList: this.saleDetailList
    }
    this.apiService.showModal(SaleReportViewPage, props).then(r => {
      r.present();
    });
  }
}
