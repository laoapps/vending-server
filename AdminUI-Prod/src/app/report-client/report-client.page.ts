import { Component, Input, OnInit } from '@angular/core';
import axios from 'axios';
import { LoadingController, AlertController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-report-client',
  templateUrl: './report-client.page.html',
  styleUrls: ['./report-client.page.scss'],
})
export class ReportClientPage implements OnInit {
  @Input() machineId: string;

  fromDate: string = '';
  toDate: string = '';
  logs: any[] = [];

  constructor(
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    this.fromDate = formatDate(yesterday);
    this.toDate = formatDate(today);
  }

  async processReport() {
    if (!this.fromDate || !this.toDate) {
      this.showAlert('Please select both From and To dates');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading data...',
    });
    await loading.present();

    try {
      // const response = await axios.post('https://vending-service-api5.laoapps.com/zdm8/reportClientLog', );

      const body = {
        machineId: this.machineId,
        fromDate: this.fromDate,
        toDate: this.toDate,
        token: localStorage.getItem('lva_token')
      };

      const response = await this.apiService.getReportClientLogs(body).toPromise();
      this.logs = response?.data?.rows ?? [];
    } catch (err) {
      console.error(err);
      this.showAlert('Error fetching data');
    } finally {
      loading.dismiss();
    }
  }

  // แปลงเวลา UTC → GMT+7
  formatToGMT7(dateStr: string) {
    const date = new Date(dateStr);
    const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return local.toLocaleString('en-GB', { hour12: false });
  }

  // ตรวจว่า log เริ่มต้นด้วย Clicked slot
  isClickedSlot(logs: string[]): boolean {
    if (!logs || logs.length === 0) return false;
    return logs[0].startsWith('Clicked slot');
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Notification',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

}
