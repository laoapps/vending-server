import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import axios from 'axios';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

interface TemperatureRow {
  id: number;
  uuid: string;
  createdAt: string;
  machineId: string;
  mstatus: {
    device: string;
    temperature: number;
  } | null;
  description: string | null;
  updatedAt: string;
}

@Component({
  selector: 'app-log-temp',
  templateUrl: './log-temp.page.html',
  styleUrls: ['./log-temp.page.scss']
})
export class LogTempPage implements OnInit {

  @Input() machineId: string;

  fromDate!: string;
  toDate!: string;

  loading = false;
  rows: TemperatureRow[] = [];

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // ตั้งค่า default (ย้อนหลัง 1 วัน)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.fromDate = this.formatDateForInput(yesterday);
    this.toDate = this.formatDateForInput(now);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2500,
      position: 'top'
    });
    toast.present();
  }

  async fetchReport() {
    if (!this.fromDate || !this.toDate) {
      this.showToast('Please select both From and To dates', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading data...',
      spinner: 'crescent'
    });
    await loading.present();
    this.loading = true;

    try {
      const token = localStorage.getItem('token'); // หรือใช้ token จาก env ก็ได้
      const url = `${environment.url}/reportLogsTemp`;

      const payload = {
        machineId: this.machineId,
        fromDate: this.fromDate.split('T')[0],
        toDate: this.toDate.split('T')[0],
        token
      };

      const headers = { 'Content-Type': 'application/json' };

      const response = await axios.post(url, payload, { headers });

      if (response.data?.data?.rows?.length) {
        this.rows = response.data.data.rows;
        this.showToast(`Loaded ${this.rows.length} records`, 'success');
      } else {
        this.rows = [];
        this.showToast('No data found', 'medium');
      }
    } catch (error: any) {
      console.error('API error:', error);
      this.showToast('Error fetching data', 'danger');
    } finally {
      this.loading = false;
      loading.dismiss();
      this.cdr.detectChanges();
    }
  }

  formatLocalTime(dateString: string): string {
    const date = new Date(dateString);
    // ปรับให้เป็น timezone +7
    date.setHours(date.getHours() + 7);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getTemperatureColor(temp?: number): string {
    if (temp === undefined || temp === null) return 'medium';
    if (temp < 5) return 'secondary';
    if (temp < 15) return 'success';
    if (temp < 30) return 'warning';
    return 'danger';
  }
}
