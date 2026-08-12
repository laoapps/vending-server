import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment-timezone';
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
  top5List: Array<any> = [];

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

  private formatReportNumber(value: number): string {
    return value != null ? Number(value).toLocaleString('en-US') : '0';
  }

  private formatReportDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
  }

  private getSaleReportCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body, .sale-report-doc {
        font-family: 'Noto Sans Lao', 'Phetsarath OT', 'DokChampa', Arial, sans-serif;
        font-size: 12px;
        color: #000;
        background: #fff;
      }
      .sale-report-doc { padding: 12mm 10mm; }
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
      .section-heading {
        font-size: 14px;
        font-weight: 800;
        margin: 16px 0 8px;
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
      thead.top5 th {
        background: #A41D4F !important;
      }
      .col-num { width: 36px; text-align: center; }
      .col-center { text-align: center; }
      .col-right { text-align: right; white-space: nowrap; }
      tfoot td {
        font-weight: 800;
        background: #f5d76e !important;
      }
    `;
  }

  private getSaleReportBodyHTML(): string {
    const top5Rows = this.top5List.map((sale, i) => `
        <tr>
          <td class="col-num">${i + 1}</td>
          <td>${sale.stock?.name ?? ''}</td>
          <td class="col-right">${this.formatReportNumber(sale.stock?.price)}</td>
          <td class="col-center">${this.formatReportNumber(sale.stock?.qtty)}</td>
          <td class="col-right">${this.formatReportNumber(sale.stock?.total)}</td>
        </tr>`).join('');

    const rows = this.saleSumerizeList.map((sale, i) => {
      const status = sale.paymentstatus == 'paid' ? 'ຈ່າຍແລ້ວ' : 'ເຄື່ອງຕົກແລ້ວ';
      return `
        <tr>
          <td class="col-num">${i + 1}</td>
          <td>${sale.stock?.name ?? ''}</td>
          <td class="col-right">${this.formatReportNumber(sale.stock?.price)}</td>
          <td class="col-center">${this.formatReportNumber(sale.stock?.qtty)}</td>
          <td class="col-right">${this.formatReportNumber(sale.stock?.total)}</td>
          <td class="col-center">${status}</td>
          <td>${this.formatReportDate(sale.createdAt)}</td>
        </tr>`;
    }).join('');

    return `
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
      <div class="value">${this.formatReportNumber(this.sum_qtty)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Subtotal</div>
      <div class="value">${this.formatReportNumber(this.sum_total)}</div>
    </div>
  </div>
  <div class="section-heading">Top 5 ສິນຄ້າຂາຍດີ / Best Sellers</div>
  <table>
    <thead class="top5">
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Price</th>
        <th>QTY</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${top5Rows || '<tr><td colspan="5" class="col-center">-</td></tr>'}
    </tbody>
  </table>
  <div class="section-heading">ລາຍການຍອດຂາຍທັງໝົດ / All Sales</div>
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
        <td class="col-center">${this.formatReportNumber(this.sum_qtty)}</td>
        <td class="col-right">${this.formatReportNumber(this.sum_total)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>`;
  }

  printSaleReport() {
    if (!this.saleSumerizeList?.length) {
      this.apiService.simpleMessage('ບໍ່ມີຂໍ້ມູນຍອດຂາຍໃຫ້ພິມ');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="lo">
<head>
  <meta charset="UTF-8"/>
  <title>Sale Report - ${this.machineId || ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${this.getSaleReportCSS()}
    body {
      padding: 12mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 10mm; }
  </style>
</head>
<body>
  ${this.getSaleReportBodyHTML()}
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

  async downloadSaleReportPDF() {
    if (!this.saleSumerizeList?.length) {
      this.apiService.simpleMessage('ບໍ່ມີຂໍ້ມູນຍອດຂາຍໃຫ້ດາວໂຫຼດ');
      return;
    }

    this.apiService.showLoadingLong('ກຳລັງສ້າງ PDF...');
    let container: HTMLDivElement | null = null;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      // Ensure Lao font is available for canvas capture
      if (!document.getElementById('sale-report-noto-font')) {
        const link = document.createElement('link');
        link.id = 'sale-report-noto-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap';
        document.head.appendChild(link);
      }
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 500));

      const A4_WIDTH_PX = 794;
      container = document.createElement('div');
      container.className = 'sale-report-doc';
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${A4_WIDTH_PX}px;
        background: #fff;
      `;

      const style = document.createElement('style');
      style.textContent = this.getSaleReportCSS();
      container.appendChild(style);

      const body = document.createElement('div');
      body.innerHTML = this.getSaleReportBodyHTML();
      container.appendChild(body);
      document.body.appendChild(container);

      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        heightLeft -= pageH;
      }

      const datePart = (this.fromDate || 'report').replace(/\//g, '-');
      pdf.save(`sale-report-${this.machineId || 'machine'}-${datePart}.pdf`);
    } catch (err) {
      console.error('Sale report PDF failed:', err);
      this.apiService.simpleMessage('ບໍ່ສາມາດສ້າງ PDF ໄດ້. ກະລຸນາລອງໃໝ່.');
    } finally {
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
      this.apiService.dismissLoading();
    }
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

  /** Shift YYYY-MM-DD by N calendar days without mutating the original. */
  private adjustDay(dateStr: string, days: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  /** Keep rows whose createdAt (UTC → Asia/Vientiane) falls in [fromDate, toDate]. */
  private filterByDateUTC7<T extends { createdAt?: string }>(
    data: T[],
    fromDate: string,
    toDate: string
  ): T[] {
    return data.filter((item) => {
      if (!item?.createdAt) return false;
      const date = moment.utc(item.createdAt).tz('Asia/Vientiane').format('YYYY-MM-DD');
      return date >= fromDate && date <= toDate;
    });
  }

  /** Re-aggregate sale rows after date filtering (same rules as FetchOrder). */
  private rebuildSaleSumerizeList(saleDetailList: any[]): any[] {
    const allsale = saleDetailList.map((item) => ({
      stock: { ...item.stock },
      machineId: item.machineId,
      paymentstatus: item.paymentstatus,
      dropAt: item.dropAt,
      createdAt: item.createdAt,
      position: item.position,
    }));

    const uniqueorder = allsale.filter(
      (obj, index) => allsale.findIndex((item) => item.stock.id == obj.stock.id) == index
    );
    const duplicateorder = allsale.filter(
      (obj, index) => allsale.findIndex((item) => item.stock.id == obj.stock.id) != index
    );

    for (let i = 0; i < uniqueorder.length; i++) {
      uniqueorder[i].stock.total = 0;
      if (duplicateorder?.length) {
        for (let j = 0; j < duplicateorder.length; j++) {
          if (uniqueorder[i].stock.id == duplicateorder[j].stock.id) {
            uniqueorder[i].stock.qtty += duplicateorder[j].stock.qtty;
          }
        }
      }
      uniqueorder[i].stock.total = uniqueorder[i].stock.qtty * uniqueorder[i].stock.price;
    }

    return uniqueorder;
  }

  /** Top 5 products by sold quantity (then total as tie-breaker). */
  private buildTop5List(saleSumerizeList: any[]): any[] {
    return [...(saleSumerizeList || [])]
      .sort((a, b) => {
        const qtyDiff = (b.stock?.qtty || 0) - (a.stock?.qtty || 0);
        if (qtyDiff !== 0) return qtyDiff;
        return (b.stock?.total || 0) - (a.stock?.total || 0);
      })
      .slice(0, 5);
  }

  process(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.lists = [];
        this.display = false;
        this.top5List = [];
        this.saleSumerizeList = [];
        this.saleDetailList = [];
        this.sum_qtty = 0;
        this.sum_total = 0;

        // User-selected range (unchanged for display / client-side filter)
        const userFromDate = this.fromDate;
        const userToDate = this.datetimeCustom ? this.fromDate : this.toDate;

        let params: any = {} as any;
        if (this.datetimeCustom == true) {
          params = {
            fromDate: this.adjustDay(userFromDate, -1),
            toDate: this.adjustDay(userFromDate, +1),
            machineId: this.machineId
          }
          this.currentdate = this.fromDate;

        } else if (this.moredatetimeCustom == true) {
          params = {
            fromDate: this.adjustDay(userFromDate, -1),
            toDate: this.adjustDay(userToDate, +1),
            machineId: this.machineId
          }
          this.currentdate = `From ${this.fromDate} to ${this.toDate}`;

        }

        const run = await this.loadVendingMachineSaleBillReportProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);



        console.log('=====> run', run.data[0].list);


        // Drop buffer-day rows: keep only UTC+7 dates inside the user's selection
        this.lists = this.filterByDateUTC7(run.data[0].lists || [], userFromDate, userToDate);
        this.saleDetailList = this.filterByDateUTC7(run.data[0].saleDetailList || [], userFromDate, userToDate);
        this.saleSumerizeList = this.rebuildSaleSumerizeList(this.saleDetailList);
        this.top5List = this.buildTop5List(this.saleSumerizeList);
        this.count = this.lists.length;
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
