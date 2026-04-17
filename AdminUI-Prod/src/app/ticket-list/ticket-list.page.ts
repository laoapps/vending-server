import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ITicket, TicketStatus } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { TicketDetailModalComponent } from '../ticket-detail-modal/ticket-detail-modal.component';
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';


@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.page.html',
  styleUrls: ['./ticket-list.page.scss'],
})
export class TicketListPage implements OnInit {
  @Input() machineId!: string;  // Receive machineId from parent
  selectedStatus: TicketStatus = 'pending';
  tickets: ITicket[] = [];
  page = 1;
  limit = 20;
  hasMore = true;

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  async loadTickets(append = false) {
    try {
      const res = await this.apiService.getTicketsByStatus(this.selectedStatus, this.machineId, this.page, this.limit);
      
      if (res?.status === 1 && res.data?.data?.tickets) {
        const newTickets = res.data.data.tickets;
        if (append) {
          this.tickets = [...this.tickets, ...newTickets];
        } else {
          this.tickets = newTickets;
        }
        this.hasMore = newTickets.length === this.limit;
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    }
  }

  async loadMore(event: any) {
    this.page++;
    await this.loadTickets(true);
    event.target.complete();
    if (!this.hasMore) event.target.disabled = true;
  }

  async openTicketDetail(ticket: ITicket) {
    const modal = await this.modalCtrl.create({
      component: TicketDetailModalComponent,
      componentProps: { ticket }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.loadTickets(); // refresh list
    }
  }

async openCreateTicketModal() {
  const modal = await this.modalCtrl.create({
    component: CreateTicketModalComponent,
    cssClass: 'create-ticket-modal'   // optional for custom styling
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();
  if (data?.created) {
    this.loadTickets();   // refresh list
  }
}

  getStatusColor(status: TicketStatus): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'solving': return 'primary';
      case 'finished': return 'success';
      default: return 'medium';
    }
  }
}