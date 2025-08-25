import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
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

interface ReportResponse {
  command: string;
  data: {
    rows: TemperatureRow[];
    count: number;
    message: string;
  };
  message: string;
  code: string;
  status: number;
  transactionID: string;
}

@Component({
  selector: 'app-log-temp',
  templateUrl: './log-temp.page.html',
  styleUrls: ['./log-temp.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogTempPage implements OnInit, OnDestroy {
  @Input() machineId: string = '';

  // Date handling
  fromDate: string;
  toDate: string;
  
  // Data and state
  reportData: ReportResponse | null = null;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  paginatedData: TemperatureRow[] = [];
  
  // Cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private http: HttpClient,
    public modal: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // Set default date range (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    this.fromDate = this.formatDateForInput(yesterday);
    this.toDate = this.formatDateForInput(now);
  }

  ngOnInit() {
    if (this.machineId) {
      this.fetchReportData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Getters
  get isFormInvalid(): boolean {
    return !this.machineId || !this.fromDate || !this.toDate || 
           new Date(this.fromDate) >= new Date(this.toDate);
  }

  // Date handling
  private formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  private formatDateForApi(dateString: string): string {
    return new Date(dateString).toISOString().replace('T', ' ').slice(0, 19);
  }

  onFromDateChange(event: any) {
    this.fromDate = event.detail.value;
    this.validateDateRange();
  }

  onToDateChange(event: any) {
    this.toDate = event.detail.value;
    this.validateDateRange();
  }

  private validateDateRange() {
    if (this.fromDate && this.toDate && new Date(this.fromDate) >= new Date(this.toDate)) {
      this.error = 'From date must be before To date';
    } else {
      this.error = null;
    }
    this.cdr.detectChanges();
  }

  // Data fetching
  async fetchReportData() {
    if (this.isFormInvalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      return;
    }

    this.loading = true;
    this.error = null;
    this.reportData = null;
    this.cdr.detectChanges();

    const loadingIndicator = await this.loadingCtrl.create({
      message: 'Fetching temperature data...',
      spinner: 'crescent'
    });
    await loadingIndicator.present();

    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = localStorage.getItem('shopPhonenumber');
      const secret = localStorage.getItem('secretLocal');

      if (!token || !secret) {
        throw new Error('Missing authentication credentials');
      }

      const url = `${environment.url}/reportLogsTempAdmin`;
      const body = {
        secret,
        shopPhonenumber,
        token,
        machineId: this.machineId.trim(),
        fromDate: this.formatDateForApi(this.fromDate),
        toDate: this.formatDateForApi(this.toDate)
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      const response = await this.http.post<ReportResponse>(url, body, { headers })
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (response) {
        this.reportData = response;
        this.setupPagination();
        
        if (response.data.rows.length === 0) {
          await this.showToast('No data found for the selected criteria', 'primary');
        } else {
          await this.showToast(`Found ${response.data.count} temperature records`, 'success');
        }
      }
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
      await loadingIndicator.dismiss();
      this.cdr.detectChanges();
    }
  }

  private handleError(err: any) {
    console.error('Temperature report error:', err);
    
    if (err instanceof HttpErrorResponse) {
      switch (err.status) {
        case 401:
          this.error = 'Authentication failed. Please login again.';
          break;
        case 403:
          this.error = 'Access denied. You may not have permission to view this data.';
          break;
        case 404:
          this.error = 'Service not found. Please try again later.';
          break;
        case 500:
          this.error = 'Server error. Please try again later.';
          break;
        default:
          this.error = `Error ${err.status}: ${err.message || 'Unknown error occurred'}`;
      }
    } else {
      this.error = err.message || 'An unexpected error occurred';
    }
  }

  // Pagination
  private setupPagination() {
    if (!this.reportData?.data.rows) return;
    
    this.totalPages = Math.ceil(this.reportData.data.rows.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  private updatePaginatedData() {
    if (!this.reportData?.data.rows) {
      this.paginatedData = [];
      return;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.reportData.data.rows.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  // Utility functions
  trackByRowId(index: number, item: TemperatureRow): number {
    return item.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTemperatureColor(temperature: number | undefined): string {
    if (temperature === undefined || temperature === null) return 'medium';
    
    if (temperature < 0) return 'primary';
    if (temperature < 10) return 'secondary';
    if (temperature < 25) return 'success';
    if (temperature < 35) return 'warning';
    return 'danger';
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  async close() {
    await this.modal.dismiss();
  }
}