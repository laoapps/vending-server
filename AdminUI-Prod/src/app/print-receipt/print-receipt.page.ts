import { Component, Input, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ReceiptItem {
  no: number;
  description: string;
  qty: number | string;
  amount: number;
  isTotal?: boolean;
}

export interface ReceiptData {
  companyName: string;
  address: string;
  phones: string;
  emails: string;
  date: string;
  receiptNo: string;
  customerName: string;
  customerCode: string;
  installment: string;
  items: ReceiptItem[];
  bankInfo: {
    accountName: string;
    lakAccount: string;
    usdAccount: string;
    mMoney: string;
  };
  signedBy: string;
  signedByEn: string;
}

@Component({
  selector: 'app-print-receipt',
  templateUrl: './print-receipt.page.html',
  styleUrls: ['./print-receipt.page.scss'],
})
export class PrintReceiptPage implements OnInit {
  @Input() dateData: string;
  @Input() customerPhone: string;
  @Input() customerName: string;
  @Input() month: string;
  @Input() totalSaleCount: string;
  @Input() totalSalePrice: string;
  @Input() totalFranchiseCount: string;
  @Input() rate: string;
  @Input() docNumber: string;

  isExporting = false;

  receipt: ReceiptData = {
    companyName: 'ບໍລິສັດ ດອກບົວຄຳ ການຄ້າ ຂາເຂົ້າ-ຂາອອກ ຈຳກັດ',
    address: 'ຮ່ອມ 1/3 ຖະໜົນສີທອງ ບ້ານປາກທ້າງ, ເມືອງ ສີໂຄດຕະບອງ ນະຄອນຫຼວງວຽງຈັນ',
    phones: '020 55516321/.02077868868/.02056924465',
    emails: 'DorkBouaKham@gmail.com , touya.ra@gmail.com',
    date: '',
    receiptNo: '',
    customerName: '',
    customerCode: '',
    installment: '',
    items: [
      {
        no: 1,
        description: 'ລາຍການຂາຍໄດ້ທັງໝົດ',
        qty: 91,
        amount: 2668000,
      },
      {
        no: 2,
        description: 'ລວມ',
        qty: '',
        amount: 2668000,
        isTotal: true,
      },
      {
        no: 2,
        description: 'HM Franchise rate',
        qty: '',
        amount: 120060,
      },
    ],
    bankInfo: {
      accountName: 'Anousone Rabounthunh Mr',
      lakAccount: 'LAK 010-12-11505525',
      usdAccount: 'USD 090-12-0100409709-001',
      mMoney: 'M-Money: 55516321',
    },
    signedBy: '',
    signedByEn: '',
  };

  constructor() { }

  ngOnInit() {
    this.receipt.date = this.dateData;
    this.receipt.customerName = this.customerName;
    this.receipt.customerCode = this.customerPhone;
    this.receipt.installment = `ເດືອນ ${this.month}`;
    this.receipt.items[0].qty = this.totalSaleCount;
    this.receipt.items[0].amount = Number(this.totalSalePrice);
    this.receipt.items[1].amount = Number(this.totalSalePrice);
    this.receipt.items[2].amount = Number(this.totalFranchiseCount);
    this.receipt.items[2].qty = `${this.rate}%`;
    this.receipt.receiptNo = this.docNumber

  }

  formatNumber(n: number): string {
    return n.toLocaleString('en-US');
  }

  // printReceipt(): void {
  //   window.print();
  // }


  printReceipt(): void {
    const receiptEl = document.getElementById('receipt-content');
    if (!receiptEl) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="lo">
      <head>
        <meta charset="UTF-8">
        <title>ໃບເກັບເງິນ ${this.receipt.receiptNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Lao', Arial, sans-serif;
            font-size: 13px;
            padding: 20px;
            background: white;
            color: #1a1a1a;
          }
          .company-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
          .company-left { flex: 1; }
          .company-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.4; }
          .company-info { font-size: 12px; color: #444; margin: 2px 0; line-height: 1.5; }
          .company-right { text-align: right; min-width: 140px; padding-left: 16px; }
          .meta-row { display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; margin-bottom: 4px; }
          .meta-label { color: #555; }
          .meta-value { font-weight: 600; }
          .receipt-title { text-align: center; margin: 20px 0 16px; }
          .receipt-title h1 { font-size: 22px; font-weight: 700; text-decoration: underline; letter-spacing: 1px; }
          .table-container { overflow: visible; margin-bottom: 16px; }
          .receipt-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .receipt-table th, .receipt-table td { border: 1px solid #999; padding: 8px 10px; }
          .customer-row td { background: white; }
          .label-text { font-weight: 700; }
          .installment-cell { text-align: center; font-weight: 700; text-decoration: underline; }
          .header-row th { background: #e8e8e8; font-weight: 700; text-align: center; }
          .col-no { text-align: center; width: 48px; }
          .col-desc { text-align: left; }
          .col-qty { text-align: center; width: 80px; }
          .col-amount { text-align: right; width: 110px; font-family: 'Courier New', monospace; }
          .total-row { background: #cce5ff; }
          .total-row td { font-weight: 700; }
          .bank-section { margin: 16px 0 24px; font-size: 12.5px; line-height: 1.9; }
          .bank-title { text-decoration: underline; color: #222; margin-bottom: 4px; }
          .bank-account { font-weight: 700; color: #111; }
          .signature-section { display: flex; justify-content: flex-start; gap: 48px; margin-top: 44px; }
          .sig-block { text-align: center; min-width: 150px; }
          .sig-label { font-size: 13px; color: #222; }
          .sig-spacer { height: 60px; }
          .sig-name { font-size: 12px; color: #333; line-height: 1.6; margin-top: 6px; }
          .action-buttons { display: none !important; }
          @page { margin: 15mm; size: A4; }
        </style>
      </head>
      <body>${receiptEl.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  }


  // exportPDF(): void {
  //   this.isExporting = true;

  //   const html = this.buildReceiptHTML();
  //   const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  //   const url = URL.createObjectURL(blob);

  //   const printWindow = window.open(url, '_blank');
  //   if (printWindow) {
  //     printWindow.onload = () => {
  //       setTimeout(() => {
  //         printWindow.print();
  //         URL.revokeObjectURL(url);
  //         this.isExporting = false;
  //       }, 500);
  //     };
  //   } else {
  //     this.isExporting = false;
  //   }
  // }


  async exportPDF(): Promise<void> {
    this.isExporting = true;

    try {
      const element = document.getElementById('receipt-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If content exceeds one page, split across pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${this.customerName}(${this.month})_${this.receipt.receiptNo}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
    } finally {
      this.isExporting = false;
    }
  }

  private buildReceiptHTML(): string {
    const rows = this.receipt.items.map(item => `
      <tr class="${item.isTotal ? 'total-row' : ''}">
        <td class="col-no">${item.isTotal ? '' : item.no}</td>
        <td>${item.description}</td>
        <td class="col-qty">${item.qty}</td>
        <td class="col-amount">${this.formatNumber(item.amount)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="lo">
<head>
  <meta charset="UTF-8">
  <title>ໃບເກັບເງິນ ${this.receipt.receiptNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Lao', Arial, sans-serif; font-size: 13px; padding: 30px; }
    .company-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .company-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
    .company-info { font-size: 12px; color: #444; line-height: 1.6; }
    .meta-block { text-align: right; font-size: 13px; }
    .meta-row { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 4px; }
    .receipt-title { text-align: center; font-size: 22px; font-weight: 700; text-decoration: underline; margin: 20px 0 16px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .receipt-table th, .receipt-table td { border: 1px solid #999; padding: 8px 10px; }
    .header-row th { background: #e8e8e8; font-weight: 700; text-align: center; }
    .customer-row td { background: white; }
    .installment-cell { text-align: center; font-weight: 700; text-decoration: underline; }
    .col-no { text-align: center; width: 48px; }
    .col-qty { text-align: center; width: 80px; }
    .col-amount { text-align: right; width: 110px; font-family: 'Courier New', monospace; }
    .total-row { background: #cce5ff; }
    .total-row td { font-weight: 700; }
    .bank-section { margin: 16px 0 24px; font-size: 12.5px; line-height: 1.9; }
    .bank-title { text-decoration: underline; margin-bottom: 4px; }
    .bank-account { font-weight: 700; }
    .signature-section { display: flex; gap: 48px; margin-top: 44px; }
    .sig-block { text-align: center; min-width: 150px; }
    .sig-label { font-size: 13px; margin-bottom: 60px; }
    .sig-name { font-size: 12px; color: #333; line-height: 1.6; margin-top: 6px; }
    @page { margin: 15mm; size: A4; }
  </style>
</head>
<body>
  <div class="company-header">
    <div>
      <div class="company-name">${this.receipt.companyName}</div>
      <div class="company-info">${this.receipt.address}<br>ໂທ: ${this.receipt.phones}<br>Email: ${this.receipt.emails}</div>
    </div>
    <div class="meta-block">
      <div class="meta-row"><span>ວັນທີ</span><span><b>${this.receipt.date}</b></span></div>
      <div class="meta-row"><span>ເລກທີ</span><span><b>${this.receipt.receiptNo}</b></span></div>
    </div>
  </div>
  <div class="receipt-title">ໃບເກັບເງິນ</div>
  <table class="receipt-table">
    <tr class="customer-row">
      <td colspan="3"><b>ລູກຄ້າ:</b> ${this.receipt.customerName} ${this.receipt.customerCode}</td>
      <td class="installment-cell">${this.receipt.installment}</td>
    </tr>
    <tr class="header-row">
      <th class="col-no">ລຳດັບ</th><th>ລາຍລະອຽດ</th><th class="col-qty">ຈ/ນ</th><th class="col-amount">ລາຄາ</th>
    </tr>
    ${rows}
  </table>
  <div class="bank-section">
    <div class="bank-title">ກ່ອນໂອນເງິນລວດ ໂອນໃຫ້ບັນຊີຂ້າງລຸ່ມ ບໍລິສັດດຽວ</div>
    ${this.receipt.bankInfo.accountName}<br>
    <span class="bank-account">${this.receipt.bankInfo.lakAccount}</span><br>
    <span class="bank-account">${this.receipt.bankInfo.usdAccount}</span><br>
    <span class="bank-account">${this.receipt.bankInfo.mMoney}</span>
  </div>
  <div class="signature-section">
    <div class="sig-block"><div class="sig-label">ລາຍເຊັນລູກຄ້າ</div></div>
    <div class="sig-block"><div class="sig-label">ຜູ້ສັ່ງລວມ</div></div>
    <div class="sig-block">
      <div class="sig-label">ການເງິນ</div>
      <div class="sig-name">${this.receipt.signedBy}<br>${this.receipt.signedByEn}</div>
    </div>
  </div>
</body>
</html>`;
  }
}