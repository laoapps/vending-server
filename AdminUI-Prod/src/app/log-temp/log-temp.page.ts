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
  createdAt: string;
  timeDisplay: string;
  status: number;
  statusText: string;
  motorNumber?: number;
  maxCurrent?: number;
  avgCurrent?: number;
  runTime?: number;
  temperature: number;
  dropSuccess?: boolean;
  faultCode?: number;
  rawData: string;
  isHealthy?: boolean;
  healthStatus?: 'OK' | 'NO_SPIKE' | 'OVERCURRENT' | 'UNKNOWN';
  deviceType: 'ADH814' | 'VMC' | 'OTHER';
  vmcStatus?: string;  // For VMC simple status
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

  private parseADH814Data(log: MotorRunLog): ParsedMotorData | null {
    if (!log.mstatus?.data) return null;

    try {
      const jsonStr = log.mstatus.data;
      const match = jsonStr.match(/\{.*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);

      const date = new Date(log.createdAt);
      date.setHours(date.getHours() + 7);
      const timeDisplay = date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // A5 / A6
      if (parsed.executionStatus !== undefined || parsed.acknowledged !== undefined) {
        return {
          createdAt: log.createdAt,
          timeDisplay,
          status: parsed.executionStatus !== undefined ? 3 : 4,
          statusText: parsed.executionStatus !== undefined ? 'Start Motor' : 'ACK',
          motorNumber: parsed.motorNumber || 0,
          maxCurrent: 0,
          avgCurrent: 0,
          runTime: 0,
          temperature: log.mstatus?.temperature || 0,
          dropSuccess: true,
          faultCode: 0,
          rawData: parsed.rawData?.toUpperCase() || '',
          isHealthy: true,
          healthStatus: 'OK',
          deviceType: 'ADH814'
        };
      }

      // A3 - FULL MOTOR DIAGNOSTICS
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

        let healthStatus: 'OK' | 'NO_SPIKE' | 'OVERCURRENT' | 'UNKNOWN' = 'UNKNOWN';
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
          healthStatus,
          deviceType: 'ADH814'
        };
      }

      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  // VMC: Simple status only
  private parseVMCData(log: MotorRunLog): ParsedMotorData | null {
    if (!log.mstatus?.data) return null;

    try {
      const jsonStr = log.mstatus.data;
      const match = jsonStr.match(/\{.*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);

      const date = new Date(log.createdAt);
      date.setHours(date.getHours() + 7);
      const timeDisplay = date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      let statusText = 'VMC Online';
      if (parsed.rawData) {
        const hex = parsed.rawData.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
        if (hex.startsWith('fafb04')) {
          const code = hex.substring(10, 12);
          statusText = code === '01' ? 'VMC Dispensing' :
                       code === '02' ? 'VMC Dispensed' :
                       code === '03' ? 'VMC Failed' : 'VMC Status';
        }
      }

      return {
        createdAt: log.createdAt,
        timeDisplay,
        status: 10,
        statusText,
        motorNumber: 0,
        maxCurrent: 0,
        avgCurrent: 0,
        runTime: 0,
        temperature: log.mstatus?.temperature || 0,
        dropSuccess: true,
        faultCode: 0,
        rawData: parsed.rawData?.toUpperCase() || '',
        isHealthy: true,
        healthStatus: 'OK',
        deviceType: 'VMC',
        vmcStatus: statusText
      };
    } catch {
      return null;
    }
  }

  // Main parser — detects device type
  private parseLog(log: MotorRunLog): ParsedMotorData | null {
    if (!log.mstatus) {
      const date = new Date(log.createdAt);
      date.setHours(date.getHours() + 7);
      return {
        createdAt: log.createdAt,
        timeDisplay: date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 99,
        statusText: 'Device Online',
        motorNumber: 0,
        maxCurrent: 0,
        avgCurrent: 0,
        runTime: 0,
        temperature: log.mstatus?.temperature || 0,
        dropSuccess: true,
        faultCode: 0,
        rawData: '',
        isHealthy: true,
        healthStatus: 'OK',
        deviceType: 'OTHER'
      };
    }

    if (log.mstatus.device === 'ADH814') {
      return this.parseADH814Data(log);
    }

    if (log.mstatus.device?.includes('VMC') || log.mstatus.data?.includes('fafb')) {
      return this.parseVMCData(log);
    }

    // Fallback: just show temperature
    const date = new Date(log.createdAt);
    date.setHours(date.getHours() + 7);
    return {
      createdAt: log.createdAt,
      timeDisplay: date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 99,
      statusText: 'Device Online',
      motorNumber: 0,
      maxCurrent: 0,
      avgCurrent: 0,
      runTime: 0,
      temperature: log.mstatus.temperature || 0,
      dropSuccess: true,
      faultCode: 0,
      rawData: log.mstatus.data || '',
      isHealthy: true,
      healthStatus: 'OK',
      deviceType: 'OTHER'
    };
  }

  async fetchReport() {
    if (!this.fromDate || !this.toDate) {
      this.showToast('Please select both dates', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading device logs...',
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

  // Keep your existing getters and methods...
  get finishedRuns() { return this.parsedRows.filter(r => r.deviceType === 'ADH814' && r.status === 2); }
  get totalFinishedRuns() { return this.finishedRuns.length; }
  get healthyRuns() { return this.finishedRuns.filter(r => r.isHealthy).length; }
  get failedRuns() { return this.totalFinishedRuns - this.healthyRuns; }
  get successRate() { return this.totalFinishedRuns > 0 ? Math.round((this.healthyRuns / this.totalFinishedRuns) * 100) : 0; }

  getStatusColor(status: number): string {
    if (status === 99) return 'medium';
    if (status === 10) return 'tertiary';
    switch (status) {
      case 0: return 'medium';
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'primary';
      case 4: return 'secondary';
      default: return 'dark';
    }
  }

  getHealthColor(health: any): string {
    if (!health) return 'medium';
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
}