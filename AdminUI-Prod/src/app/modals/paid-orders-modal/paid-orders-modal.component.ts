import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription, interval } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';



@Component({
  selector: 'app-paid-orders-modal',
  templateUrl: './paid-orders-modal.component.html',
  styleUrls: ['./paid-orders-modal.component.scss'],
})
export class PaidOrdersModalComponent implements OnInit, OnDestroy {

  machines: any[] = [];
  loading = true;
  private refreshSub!: Subscription;
  private intervalSub!: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadData();

    // Auto refresh every 60 seconds
    this.intervalSub = interval(60000).subscribe(() => {
      this.loadData();
    });
  }

  async loadData() {
    this.loading = true;
    try {
      const allOrders = await this.apiService.getAllPaidOrders();

      // Group by machineId + calculate summary
      const grouped = new Map<string, any>();

      allOrders?.data?.data?.forEach((order: any) => {
        const bill = order.bill || order;
        const machineId = bill.machineId;

        if (!machineId) return;

        if (!grouped.has(machineId)) {
          grouped.set(machineId, {
            machineId,
            orders: [],
            totalSales: 0,
            totalValue: 0
          });
        }

        const group = grouped.get(machineId)!;
        group.orders.push(order);

        // Calculate totals
        group.totalSales += bill.vendingsales?.length || 0;
        group.totalValue += bill.totalvalue || 0;
      });

      // Sort by most recent activity (optional)
      this.machines = Array.from(grouped.values())
        .sort((a, b) => b.orders.length - a.orders.length);

    } catch (error) {
      console.error('Failed to load paid orders', error);
    } finally {
      this.loading = false;
    }
  }

  async refreshNow() {
    await this.loadData();
  }

  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy() {
    this.intervalSub?.unsubscribe();
  }
}