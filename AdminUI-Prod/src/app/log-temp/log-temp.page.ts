import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import axios from 'axios';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

interface MotorRunLog {
  id: number;
  uuid: string;
  createdAt: string;
  machineId: string;
  mstatus: {
    device: string;
    temperature: number;
    data: string;
  } | null;
  description: string | null;
  updatedAt: string;
}

interface ParsedMotorData {
  createdAt: string;           // Fixed: from original log
  timeDisplay: string;         // Human readable time
  status: number;              // 0=Idle, 1=Running, 2=Finished
  statusText: string;
  motorNumber: number;
  maxCurrent: number;
  avgCurrent: number;
  runTime: number;             // seconds with 1 decimal
  temperature: number;
  dropSuccess: boolean;
  faultCode: number;
  rawData: string;
  isHealthy: boolean;
  healthStatus: 'OK' | 'NO_SPIKE' | 'OVERCURRENT' | 'UNKNOWN';
  isA5?: boolean;
  isA6?: boolean;
}

@Component({
  selector: 'app-log-temp',
  templateUrl: './log-temp.page.html',
  styleUrls: ['./log-temp.page.scss']
})
export class LogTempPage implements OnInit {

  @Input() machineId: string = '';

  fromDate!: string;
  toDate!: string;

  loading = false;
  rows: MotorRunLog[] = [];
  parsedRows: ParsedMotorData[] = [];
  showRawData = false;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
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
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  // CORRECTED: Parse ADH814 data properly
  private parseADH814Data(log: MotorRunLog): ParsedMotorData | null {
    if (!log.mstatus?.data) return null;

    try {
      const jsonStr = log.mstatus.data;
      const jsonMatch = jsonStr.match(/\{.*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);

      // Format time from real createdAt (+7 timezone)
      const date = new Date(log.createdAt);
      date.setHours(date.getHours() + 7);
      const timeDisplay = date.toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // A5 Command
      if (parsed.executionStatus !== undefined) {
        return {
          createdAt: log.createdAt,
          timeDisplay,
          status: 3,
          statusText: 'Start Motor',
          motorNumber: parsed.motorNumber || 0,
          maxCurrent: 0,
          avgCurrent: 0,
          runTime: 0,
          temperature: log.mstatus?.temperature || 0,
          dropSuccess: true,
          faultCode: 0,
          rawData: parsed.rawData?.toUpperCase() || '',
          isHealthy: parsed.executionStatus === 0,
          healthStatus: parsed.executionStatus === 0 ? 'OK' : 'UNKNOWN',
          isA5: true
        };
      }

      // A6 ACK
      if (parsed.acknowledged !== undefined) {
        return {
          createdAt: log.createdAt,
          timeDisplay,
          status: 4,
          statusText: 'ACK Sent',
          motorNumber: 0,
          maxCurrent: 0,
          avgCurrent: 0,
          runTime: 0,
          temperature: 0,
          dropSuccess: true,
          faultCode: 0,
          rawData: parsed.rawData?.toUpperCase() || '',
          isHealthy: true,
          healthStatus: 'OK',
          isA6: true
        };
      }

      // A3 Poll Response
      if (parsed.rawData && parsed.rawData.startsWith('00a3')) {
        const hex = parsed.rawData.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
        if (hex.length < 26) return null; // Need at least 13 bytes × 2

        const bytes: number[] = [];
        for (let i = 0; i < hex.length; i += 2) {
          bytes.push(parseInt(hex.substr(i, 2), 16));
        }

        if (bytes.length < 13) return null;

        const status = bytes[2];
        const motorNumber = bytes[3];
        const dropByte = bytes[5];

        // LITTLE-ENDIAN currents (CORRECT!)
        const maxCurrent = (bytes[7] << 8) | bytes[6];
        const avgCurrent = (bytes[9] << 8) | bytes[8];
        const runTime = (bytes[10] / 10).toFixed(1);
        const temperature = bytes[11] > 127 ? bytes[11] - 256 : bytes[11];

        const statusText = status === 0 ? 'Idle' :
          status === 1 ? 'Running' :
            status === 2 ? 'Finished' : 'Unknown';

        const dropSuccess = (dropByte & 0x04) === 0;
        const faultCode = dropByte & 0x03;

        // Health analysis only on finished runs
        let healthStatus: 'OK' | 'NO_SPIKE' | 'OVERCURRENT' | 'UNKNOWN' = 'UNKNOWN';
        let isHealthy = true;

        if (status === 2) {
          if (maxCurrent < 2000) {
            healthStatus = 'NO_SPIKE';
            isHealthy = false;
          } else if (maxCurrent > 8000) {
            healthStatus = 'OVERCURRENT';
            isHealthy = false;
          } else {
            healthStatus = 'OK';
          }
        }

        return {
          createdAt: log.createdAt,
          timeDisplay,
          status,
          statusText,
          motorNumber,
          maxCurrent,
          avgCurrent,
          runTime: parseFloat(runTime),
          temperature,
          dropSuccess,
          faultCode,
          rawData: parsed.rawData.toUpperCase(),
          isHealthy,
          healthStatus
        };
      }

      return null;
    } catch (error) {
      console.error('Parse error:', error, log.mstatus?.data);
      return null;
    }
  }

  async fetchReport() {
    if (!this.fromDate || !this.toDate) {
      this.showToast('Please select both dates', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Analyzing motor data...',
      spinner: 'crescent'
    });
    await loading.present();
    this.loading = true;

    try {
      const token = localStorage.getItem('token');
      const url = `${environment.url}/reportLogsTemp`;

      const payload = {
        machineId: this.machineId,
        fromDate: this.fromDate.split('T')[0],
        toDate: this.toDate.split('T')[0],
        token
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data?.data?.rows?.length) {
        this.rows = response.data.data.rows;

        this.parsedRows = this.rows
          .map(log => this.parseADH814Data(log))
          .filter((item): item is ParsedMotorData => item !== null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const finished = this.parsedRows.filter(r => r.status === 2);
        const failed = finished.filter(r => !r.isHealthy);

        if (failed.length > 0) {
          this.showToast(`${failed.length}/${finished.length} motors failed!`, 'danger');
        } else {
          this.showToast(`All ${finished.length} motors healthy`, 'success');
        }
      } else {
        this.rows = [];
        this.parsedRows = [];
        this.showToast('No data found', 'medium');
      }
    } catch (error: any) {
      console.error('API Error:', error);
      this.showToast('Failed to load data', 'danger');
    } finally {
      this.loading = false;
      loading.dismiss();
      this.cdr.detectChanges();
    }
  }

  formatLocalTime(dateString: string): string {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 7);
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  getStatusColor(status: number): string {
    switch (status) {
      case 0: return 'medium';
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'primary';
      case 4: return 'secondary';
      default: return 'dark';
    }
  }

  getHealthColor(health: ParsedMotorData['healthStatus']): string {
    switch (health) {
      case 'OK': return 'success';
      case 'NO_SPIKE': return 'danger';
      case 'OVERCURRENT': return 'warning';
      default: return 'medium';
    }
  }

  getMotorDisplay(num: number): string {
    return `#${num.toString().padStart(2, '0')}`;
  }

  toggleRawData() {
    this.showRawData = !this.showRawData;
  }
  // Add these getter methods to your component class
  get totalFinishedRuns(): number {
    return this.parsedRows.filter(r => r.status === 2).length;
  }

  get healthyRuns(): number {
    return this.parsedRows.filter(r => r.status === 2 && r.isHealthy).length;
  }

  get failedRuns(): number {
    return this.totalFinishedRuns - this.healthyRuns;
  }

  get successRate(): number {
    return this.totalFinishedRuns > 0
      ? Math.round((this.healthyRuns / this.totalFinishedRuns) * 100)
      : 0;
  }
}