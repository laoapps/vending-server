import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment.prod';

import Chart from 'chart.js/auto';
import { registerables } from 'chart.js';

// ──────────────────────────────────────────────
interface VendingBill {
  id: number;
  uuid: string;
  createdAt: string;
  vendingsales: VendingSale[];
  totalvalue: number;
  paymentmethod: string;
  paymentstatus: string;
  paymenttime: string;
  machineId: string;
  transactionID: string;
}

interface VendingSale {
  stock: {
    name: string;
    qtty: number;
    price: number;
    image?: string;
  };
  position: number;
}

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.page.html',
  styleUrls: ['./sales-report.page.scss'],
  standalone: false,
})
export class SalesReportPage implements OnInit {
  bills: VendingBill[] = [];
  dailySummary: Array<{ date: string; total: number; count: number; items: number }> = [];

  url = environment.url;

  chart: any;
  totalValue = 0;
  totalItems = 0;
  totalTransactions = 0;

  // User inputs
  phoneNumber: string = '';           // ← now entered by user
  fromDate: string = this.getTodayISO();
  toDate: string = this.getTodayISO();
  machineId: string = '96643001';     // can be made input later if needed

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    // Optional: you can pre-fill phoneNumber from localStorage if you want
    // this.phoneNumber = localStorage.getItem('lastPhoneNumber') || '';
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  async loadReport() {
    if (!this.phoneNumber?.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter phone number',
        duration: 2500,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    if (!this.machineId?.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter Machine ID',
        duration: 2500,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      const toast = await this.toastCtrl.create({
        message: 'No authentication token found. Please login.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Loading sales...' });
    await loading.present();

    try {
      const payload = {
        fromDate: this.fromDate,
        toDate: this.toDate,
        machineId: this.machineId,
        token,
        phoneNumber: this.phoneNumber.trim()
      };

      const res: any = await this.http.post(
        `${this.url}/loadPublicVendingMachineSaleBillReport`,
        payload
      ).toPromise();

      if (res?.data?.rows) {
        this.bills = res.data.rows;
        this.calculateSummary();
        this.createDailyChart();

        // Optional: remember last used phone number
        localStorage.setItem('lastPhoneNumber', this.phoneNumber.trim());
      } else {
        throw new Error('No sales data received');
      }
    } catch (err: any) {
      console.error('Report error:', err);
      const toast = await this.toastCtrl.create({
        message: err.message || 'Failed to load sales report',
        duration: 4000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      loading.dismiss();
    }
  }

  calculateSummary() {
    const map = new Map<string, { total: number; count: number; items: number }>();

    this.totalValue = 0;
    this.totalItems = 0;
    this.totalTransactions = this.bills.length;

    for (const bill of this.bills) {
      const created = new Date(bill.createdAt);
      const dayKey = created.toISOString().split('T')[0];

      const entry = map.get(dayKey) || { total: 0, count: 0, items: 0 };
      entry.total += bill.totalvalue;
      entry.count += 1;

      const itemsSold = bill.vendingsales.reduce((sum, s) => sum + (s.stock?.qtty || 1), 0);
      entry.items += itemsSold;

      map.set(dayKey, entry);

      this.totalValue += bill.totalvalue;
      this.totalItems += itemsSold;
    }

    this.dailySummary = Array.from(map.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  createDailyChart() {
    const ctx = document.getElementById('dailyChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.dailySummary.map(d => {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(d.date));
    });

    const totals = this.dailySummary.map(d => d.total / 1000);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sales (×1,000 kip)',
          data: totals,
          backgroundColor: 'rgba(54, 162, 235, 0.65)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  filterToday() {
    const today = this.getTodayISO();
    this.fromDate = today;
    this.toDate = today;
    this.loadReport();
  }
}