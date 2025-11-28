// log-temp.page.ts — FULLY UPDATED & WORKING
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
    temperature: number | null;
    data: string;
  } | null;
  description: string | null;
  updatedAt: string;
}

interface ParsedMotorData {
  createdAt: string;
  timeDisplay: string;
  device: string;
  statusText: string;
  motorNumber?: number;
  maxCurrent?: number;
  avgCurrent?: number;
  runTime?: number;
  temperature?: number;
  dropSuccess?: boolean;
  faultCode?: number;
  rawData: string;
  healthStatus?: 'OK' | 'NO_SPIKE' | 'OVERCURRENT' | 'UNKNOWN' | 'VMC_DISPENSING' | 'VMC_SUCCESS' | 'VMC_FAILED';
  isHealthy?: boolean;
  isVMC?: boolean;
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
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'top' });
    toast.present();
  }

  // MAIN PARSER — SUPPORTS ADH814 + VMC + UNKNOWN
  private parseLog(log: MotorRunLog): ParsedMotorData | null {
    if (!log.mstatus?.data) return null;

    const date = new Date(log.createdAt);
    date.setHours(date.getHours() + 7); // Laos = UTC+7
    const timeDisplay = date.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const createdAt = date.toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const device = log.mstatus.device || 'Unknown';

    try {
      const jsonStr = log.mstatus.data;
      const match = jsonStr.match(/\{.*\}/);
      if (!match) return { createdAt, timeDisplay, device, statusText: 'Raw Data', rawData: jsonStr };

      const parsed = JSON.parse(match[0]);

      // A5 / A6 (ADH814)
      if (parsed.executionStatus !== undefined) {
        return {
          createdAt, timeDisplay, device,
          statusText: parsed.executionStatus === 0 ? 'Motor Started' : 'Motor Failed',
          motorNumber: parsed.motorNumber || 0,
          rawData: parsed.rawData?.toUpperCase() || '',
          healthStatus: parsed.executionStatus === 0 ? 'OK' : 'UNKNOWN'
        };
      }
      if (parsed.acknowledged !== undefined) {
        return {
          createdAt, timeDisplay, device,
          statusText: 'Result Acknowledged',
          rawData: parsed.rawData?.toUpperCase() || '',
          healthStatus: 'OK'
        };
      }

      // ADH814 A3 Poll
      if (parsed.rawData && parsed.rawData.toLowerCase().startsWith('00a3')) {
        const hex = parsed.rawData.replace(/[^0-9a-fA-F]/g, '');
        if (hex.length < 26) return null;

        const payloadHex = hex.slice(4, -4);
        const payloadBytes = payloadHex.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
        if (payloadBytes.length < 9) return null;

        const status = payloadBytes[0];
        const motorNumber = payloadBytes[1];
        const dropByte = payloadBytes[2];

        const maxCurrent = (payloadBytes[3] << 8) | payloadBytes[4];
        const avgCurrent = (payloadBytes[5] << 8) | payloadBytes[6];
        const runTime = (payloadBytes[7] / 10).toFixed(1);
        const temperature = payloadBytes[8] > 127 ? payloadBytes[8] - 256 : payloadBytes[8];

        const statusText = status === 0 ? 'Idle' : status === 1 ? 'Running' : 'Finished';
        const dropSuccess = (dropByte & 0x04) === 0;
        const faultCode = dropByte & 0x03;

        let healthStatus: ParsedMotorData['healthStatus'] = 'UNKNOWN';
        let isHealthy = true;

        if (status === 2) {
          if (maxCurrent < 1000) {
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
          createdAt, timeDisplay, device,
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

      // VMC PROTOCOL
      if (parsed.rawData && parsed.rawData.toLowerCase().startsWith('fafb04')) {
        const hex = parsed.rawData.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
        const statusByte = hex.substring(10, 12);

        let statusText = '';
        let healthStatus: ParsedMotorData['healthStatus'] = 'UNKNOWN';
        let isHealthy = true;

        if (statusByte === '01') { statusText = 'VMC: Dispensing'; healthStatus = 'VMC_DISPENSING'; }
        else if (statusByte === '02') { statusText = 'VMC: Dispensed'; healthStatus = 'VMC_SUCCESS'; }
        else if (statusByte === '03') { statusText = 'VMC: Failed'; healthStatus = 'VMC_FAILED'; isHealthy = false; }

        return {
          createdAt, timeDisplay, device,
          statusText,
          rawData: parsed.rawData.toUpperCase(),
          isHealthy,
          healthStatus,
          isVMC: true
        };
      }

      // Unknown / fallback
      return {
        createdAt, timeDisplay, device,
        statusText: 'Unknown Event',
        rawData: jsonStr,
        healthStatus: 'UNKNOWN'
      };

    } catch (error) {
      console.error('Parse error:', error);
      return {
        createdAt, timeDisplay, device,
        statusText: 'Parse Error',
        rawData: log.mstatus.data,
        healthStatus: 'UNKNOWN'
      };
    }
  }

  async fetchReport() {
    if (!this.fromDate || !this.toDate) {
      this.showToast('Please select both dates', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading machine logs...',
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
          .map(log => this.parseLog(log))
          .filter((item): item is ParsedMotorData => item !== null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.showToast(`Loaded ${this.parsedRows.length} events`, 'success');
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

  getHealthColor(health?: string): string {
    switch (health) {
      case 'OK': case 'VMC_SUCCESS': return 'success';
      case 'NO_SPIKE': case 'VMC_FAILED': return 'danger';
      case 'OVERCURRENT': case 'VMC_DISPENSING': return 'warning';
      default: return 'medium';
    }
  }

  toggleRawData() {
    this.showRawData = !this.showRawData;
  }
}