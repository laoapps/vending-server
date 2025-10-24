import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-new-report-sale',
  templateUrl: './new-report-sale.page.html',
  styleUrls: ['./new-report-sale.page.scss'],
})
export class NewReportSalePage implements OnInit {
  fromDate = new Date().toISOString().split('T')[0];
  toDate = new Date().toISOString().split('T')[0];
  showFromPicker = false;
  showToPicker = false;
  reports: any[] = [];

  constructor(private alertCtrl: AlertController) { }

  ngOnInit() { }

  onFromDateChange(event: any) {
    const customEvent = event as CustomEvent;
    this.fromDate = (customEvent.detail?.value as string)?.split('T')[0] || this.fromDate;
    this.showFromPicker = false;
  }

  onToDateChange(event: any) {
    const customEvent = event as CustomEvent;
    this.toDate = (customEvent.detail?.value as string)?.split('T')[0] || this.toDate;
    this.showToPicker = false;
  }

  async process() {
    const body = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      machineId: '66660006',
      token: localStorage.getItem('lva_token'),
      shopPhonenumber: '55516321',
      secret: 'e2f48898-3453-4214-9025-27e905b269d9',
    };

    try {
      const response = await axios.post(
        'https://vending-service-api5.laoapps.com/zdm8/loadVendingMachineSaleBillReport',
        body
      );

      if (response.data?.data?.rows) {
        this.reports = response.data.data.rows;
      } else {
        this.reports = [];
      }
    } catch (error) {
      console.error('API Error', error);
      this.reports = [];
    }
  }

  getTotalSales(): number {
    return this.reports.reduce((sum, report) => sum + (report.totalvalue || 0), 0);
  }

  getTotalItems(): number {
    return this.reports.reduce((sum, report) => sum + (report.vendingsales?.length || 0), 0);
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('paid') || statusLower.includes('success')) {
      return 'success';
    } else if (statusLower.includes('pending')) {
      return 'pending';
    } else if (statusLower.includes('failed') || statusLower.includes('cancel')) {
      return 'failed';
    }
    return 'default';
  }

  async viewDetails(vendingsales: any[]) {
    if (!vendingsales || vendingsales.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'Sales Details',
        message: 'No sales data available',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Calculate totals
    const totalQty = vendingsales.reduce((sum, v) => sum + (v.stock.qtty || 0), 0);
    const totalAmount = vendingsales.reduce((sum, v) => sum + (v.stock.price * v.stock.qtty || 0), 0);

    // Create styled table HTML
    let tableHTML = `
      <style>
        .sales-modal {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        .sales-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }
        .summary-item {
          text-align: center;
        }
        .summary-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
        }
        .sales-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .sales-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          background: white;
        }
        .sales-table thead {
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
        }
        .sales-table th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }
        .sales-table td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .sales-table tbody tr:last-child td {
          border-bottom: none;
        }
        .sales-table tbody tr:hover {
          background: #fafbfc;
        }
        .index-cell {
          width: 40px;
          text-align: center;
          font-weight: 600;
          color: #64748b;
        }
        .product-cell {
          font-weight: 500;
          color: #1e293b;
        }
        .qty-cell {
          text-align: center;
          width: 70px;
        }
        .qty-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
        }
        .price-cell {
          text-align: right;
          font-weight: 600;
          color: #059669;
          width: 100px;
        }
        .position-cell {
          text-align: center;
          font-family: 'Courier New', monospace;
          background: #fef3c7;
          color: #92400e;
          font-weight: 600;
          width: 80px;
        }
        .time-cell {
          font-size: 13px;
          color: #64748b;
          width: 140px;
        }
        .total-row {
          background: #f8fafc;
          font-weight: 700;
        }
        .total-row td {
          padding: 14px 12px;
          border-top: 2px solid #e2e8f0;
          color: #1e293b;
        }
      </style>
      
      <div class="sales-modal">
        <div class="sales-summary">
          <div class="summary-item">
            <div class="summary-label">Total Items</div>
            <div class="summary-value">${totalQty}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">${totalAmount.toLocaleString()} ₭</div>
          </div>
        </div>

        <div class="sales-table-wrapper">
          <table class="sales-table">
            <thead>
              <tr>
                <th class="index-cell">#</th>
                <th>Product Name</th>
                <th class="qty-cell">Qty</th>
                <th class="price-cell">Price</th>
                <th class="position-cell">Position</th>
                <th class="time-cell">Drop Time</th>
              </tr>
            </thead>
            <tbody>
    `;

    vendingsales.forEach((v, i) => {
      const dropTime = new Date(v.dropAt).toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      tableHTML += `
        <tr>
          <td class="index-cell">${i + 1}</td>
          <td class="product-cell">${v.stock.name}</td>
          <td class="qty-cell">
            <span class="qty-badge">${v.stock.qtty}</span>
          </td>
          <td class="price-cell">${(v.stock.price * v.stock.qtty).toLocaleString()} ₭</td>
          <td class="position-cell">${v.position}</td>
          <td class="time-cell">${dropTime}</td>
        </tr>
      `;
    });

    tableHTML += `
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL:</td>
                <td class="qty-cell"><span class="qty-badge">${totalQty}</span></td>
                <td class="price-cell" style="font-size: 16px;">${totalAmount.toLocaleString()} ₭</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    const alert = await this.alertCtrl.create({
      header: '📦 Sales Details',
      message: tableHTML,
      buttons: [{
        text: 'Close',
        role: 'cancel',
        cssClass: 'alert-button-confirm'
      }],
      cssClass: 'custom-sales-alert'
    });
    await alert.present();
  }
}