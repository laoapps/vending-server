import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-report-billing',
  templateUrl: './report-billing.page.html',
  styleUrls: ['./report-billing.page.scss'],
})
export class ReportBillingPage implements OnInit {
  customerName: string = '';
  @Input() fromDate: string = '';
  @Input() toDate: string = '';
  @Input() saleCount: number = 0;
  @Input() totalCount: number = 0;

  franchisePercent: number = 10;
  electricTotal: number = 0;

  currentDate: string = '';
  invoiceNumber: string = '';
  isGeneratingPDF: boolean = false;

  constructor() { }

  ngOnInit() {
    this.currentDate = this.formatDate(new Date());
    this.invoiceNumber = this.generateInvoiceNumber();
    this.injectLaoFont();
  }

  // ===================================================
  // Inject Noto Sans Lao font into main page
  // (required so html2canvas can capture it correctly)
  // ===================================================
  private injectLaoFont() {
    if (document.getElementById('lao-font-link')) return;
    const link = document.createElement('link');
    link.id = 'lao-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  get franchiseAmount(): number {
    return Math.round(this.totalCount * this.franchisePercent / 100);
  }

  get totalFrandchise(): number {
    return this.franchiseAmount + (this.electricTotal || 0);
  }

  formatDate(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear().toString();
    return `${d}/${m}/${y}`;
  }

  generateInvoiceNumber(): string {
    const now = Date.now();
    const part1 = Math.floor(10000 + Math.random() * 90000);
    const part2 = Math.floor(100 + (now % 900));
    return `${part1}-${part2}`;
  }

  formatNumber(value: number): string {
    return value ? value.toLocaleString('en-US') : '0';
  }

  // ===================================================
  // Shared CSS for both print popup & PDF render div
  // ===================================================
  private getInvoiceCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body, .pdf-root {
        font-family: 'Noto Sans Lao', 'Phetsarath OT', 'DokChampa', Arial, sans-serif;
        font-size: 15px;
        color: #000;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-wrapper { width: 100%; background: #fff; }

      /* Header */
      .company-name {
        font-size: 19px;
        font-weight: 800;
        line-height: 1.5;
        margin-bottom: 4px;
      }
      .company-address, .company-contact {
        font-size: 13.5px;
        line-height: 1.7;
      }

      /* Meta row */
      .header-block {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .company-info { flex: 1; }
      .invoice-meta {
        text-align: right;
        font-size: 14px;
        line-height: 2;
      }
      .red-text { color: #cc0000; font-weight: 700; }

      /* Title */
      .invoice-title {
        text-align: center;
        font-size: 26px;
        font-weight: 800;
        text-decoration: underline;
        margin: 14px 0 18px;
      }

      /* Table */
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td {
        border: 1px solid #333;
        padding: 7px 11px;
        font-size: 14px;
      }
      .label-cell { font-weight: 600; white-space: nowrap; width: 80px; }
      .date-range-cell {
        text-align: right;
        font-weight: 700;
        white-space: nowrap;
        text-decoration: underline;
        width: 165px;
      }
      .header-row { background-color: #4a90d9 !important; color: #fff !important; }
      .header-row th { text-align: center; font-weight: 700; font-size: 14px; }
      .col-num   { width: 60px;  text-align: center; }
      .col-qty   { width: 60px;  text-align: center; }
      .col-total { width: 150px; text-align: right;  }
      .row-blue   { background-color: #a8d1e7 !important; font-weight: 600; }
      .row-yellow { background-color: #f5d76e !important; font-weight: 700; }
      .text-center { text-align: center; }
      .text-right  { text-align: right;  }
      .bold-text   { font-weight: 800; font-size: 15px; }

      /* Payment */
      .payment-info { font-size: 14px; margin: 12px 0; }
      .payment-note { text-decoration: underline; margin-bottom: 6px; }
      .payment-info p { margin: 3px 0; }

      /* Signature */
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-top: 56px;
        padding: 0 20px;
      }
      .signature-left, .signature-right {
        text-align: center;
        font-weight: 600;
        font-size: 14px;
      }
    `;
  }

  // ===================================================
  // Shared inner HTML body
  // ===================================================
  private getInvoiceBodyHTML(): string {
    return `
    <div class="invoice-wrapper">
      <div class="header-block">
        <div class="company-info">
          <div class="company-name">ບໍລິສັດ ດອກບົວຄຳ ການຄ້າ ຂາເຂົ້າ-ຂາອອກ ຈຳກັດ</div>
          <div class="company-address">ຮ່ອມ 1/3 ຖະໜົນສີທອງ ບ້ານປາກທ້າງ, ເມືອງ ສີໂຄດຕະບອງ ນະຄອນຫຼວງວຽງຈັນ</div>
          <div class="company-contact">ໂທ: 020 55516321/.02077868868/.02056924465.</div>
          <div class="company-contact">Email: dorkbouakham@gmail.com , touya.ra@gmail.com</div>
        </div>
        <div class="invoice-meta">
          <div><span class="red-text">ວັນທີ</span>&nbsp;&nbsp;${this.currentDate}</div>
          <div><span class="red-text">ເລກທີ</span>&nbsp;&nbsp;${this.invoiceNumber}</div>
        </div>
      </div>

      <div class="invoice-title">ໃບສະເໜີ</div>

      <table>
        <thead>
          <tr>
            <td class="label-cell">ລູກຄ້າ:</td>
            <td colspan="2">${this.customerName}</td>
            <td class="date-range-cell">${this.fromDate}-${this.toDate}</td>
          </tr>
          <tr class="header-row">
            <th class="col-num">ລຳດັບ</th>
            <th>ລາຍລະອຽດ</th>
            <th class="col-qty">ຈ/ນ</th>
            <th class="col-total">ຍອດຂາຍທັງໝົດ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-num">1</td>
            <td>ຂາຍໄດ້ທັງໝົດ</td>
            <td class="col-qty">${this.saleCount}</td>
            <td class="col-total text-right">${this.formatNumber(this.totalCount)}</td>
          </tr>
          <tr class="row-blue">
            <td class="col-num">2</td>
            <td colspan="2" class="text-center">ຍອດ${this.franchisePercent}%</td>
            <td class="col-total text-right">${this.formatNumber(this.franchiseAmount)}</td>
          </tr>
          <tr>
            <td class="col-num">3</td>
            <td colspan="2" class="text-center">ຄ່າໄຟ</td>
            <td class="col-total text-right">${this.formatNumber(this.electricTotal)}</td>
          </tr>
          <tr class="row-yellow">
            <td class="col-num">4</td>
            <td colspan="2" class="text-center">ລວມຍອດທີ່ຕ້ອງຈ່າຍ</td>
            <td class="col-total text-right bold-text">${this.formatNumber(this.totalFrandchise)}</td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <p class="payment-note">ກໍລະນີບໍ່ເອົາບິນອາກອນ ໂອນໃຫ້ບັນຊີເຈົ້າຂອງ ບໍລິສັດເລີຍ</p>
        <p><strong>Anousone Rabounthunh Mr</strong></p>
        <p><strong>LAK 010-12-11505525</strong></p>
        <p><strong>USD 090-12-0100409709-001</strong></p>
        <p><strong>M-Money: 55516321</strong></p>
      </div>

      <div class="signature-row">
        <div class="signature-left">ລາຍເຊັນລູກຄ້າ</div>
        <div class="signature-right">ກາບເງິນ</div>
      </div>
    </div>`;
  }

  // ===================================================
  // Full HTML doc for print popup
  // ===================================================
  private buildPrintHTML(): string {
    return `<!DOCTYPE html>
<html lang="lo">
<head>
  <meta charset="UTF-8"/>
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto Sans Lao:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${this.getInvoiceCSS()}
    @page { size: A4; margin: 0; }
    body { padding: 28mm 18mm 18mm 18mm; }
  </style>
</head>
<body>
  ${this.getInvoiceBodyHTML()}
  <script>
    // Wait for font to load before printing
    document.fonts.ready.then(function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 400);
    });
  <\/script>
</body>
</html>`;
  }

  // ===================================================
  // Print — popup window, font-aware auto-print
  // ===================================================
  printPage() {
    const win = window.open('', '_blank', 'width=960,height=760');
    if (!win) { alert('Please allow popups for this site.'); return; }
    win.document.write(this.buildPrintHTML());
    win.document.close();
  }

  // ===================================================
  // Download PDF — render hidden div → html2canvas → jsPDF
  // No print dialog, direct download
  // ===================================================
  async downloadPDF() {
    this.isGeneratingPDF = true;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      // A4 at 96dpi ≈ 794px wide. We render at this width so layout matches A4.
      const A4_WIDTH_PX = 794;

      // Build a hidden off-screen container
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${A4_WIDTH_PX}px;
        padding: 60px 56px 56px 56px;
        background: #fff;
        font-family: 'Noto Sans Lao', sans-serif;
      `;

      // Inject styles
      const style = document.createElement('style');
      style.textContent = this.getInvoiceCSS();
      container.appendChild(style);

      // Inject invoice body
      const body = document.createElement('div');
      body.innerHTML = this.getInvoiceBodyHTML();
      container.appendChild(body);

      document.body.appendChild(container);

      // Wait for fonts (already injected in ngOnInit) + small render settle
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 700));

      const canvas = await html2canvas(container, {
        scale: 3,                   // high-res capture
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297mm
      const imgH = (canvas.height / canvas.width) * pageW;

      // If content overflows A4, scale it to fit
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
      }

      pdf.save(`invoice-${this.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('ບໍ່ສາມາດສ້າງ PDF ໄດ້. ກະລຸນາລອງໃໝ່.');
    } finally {
      this.isGeneratingPDF = false;
    }
  }
}