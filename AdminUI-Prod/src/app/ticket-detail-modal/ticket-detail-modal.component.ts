import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';


import { ITicket, TicketStatus } from '../services/syste.model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-ticket-detail-modal',
  templateUrl: './ticket-detail-modal.component.html',
  styleUrls: ['./ticket-detail-modal.component.scss']
})
export class TicketDetailModalComponent {

  @Input() ticket!: ITicket;

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService
  ) {}

  async updateStatus(newStatus: TicketStatus) {
    try {
      const res = await this.apiService.updateTicketStatus(this.ticket.id, newStatus);
      if (res?.status === 1) {
        this.ticket.status = newStatus;
        if (newStatus === 'finished') this.ticket.resolvedAt = new Date().toISOString();
        
        // Notify parent to refresh list
        this.modalCtrl.dismiss({ updated: true });
      }
    } catch (err) {
      console.error('Failed to update status', err);
      // You can show toast here
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  getStatusColor(status: TicketStatus): string {
    return status === 'pending' ? 'warning' : status === 'solving' ? 'primary' : 'success';
  }

  viewPhoto(url: string) {
    // Optional: Open full screen image viewer
    console.log('View photo:', url);
  }
}