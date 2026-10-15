import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { ApiService } from '../services/api.service';

type Scope = 'owner' | 'global';
type View = 'products' | 'channels' | 'machines';
type ProductAction = 'INCREASE' | 'KEEP' | 'REVIEW' | 'DISPOSE' | 'RELOAD';

/**
 * Product sales ranking: best/worst sellers per machine, per owner and globally,
 * with advice on which products need more qty/channels and which to dispose.
 * Opened as /product-sales-ranking?scope=owner|global&machineId=...
 */
@Component({
  selector: 'app-product-sales-ranking',
  templateUrl: './product-sales-ranking.page.html',
  styleUrls: ['./product-sales-ranking.page.scss'],
})
export class ProductSalesRankingPage implements OnInit {

  readonly actions: ProductAction[] = ['INCREASE', 'RELOAD', 'KEEP', 'REVIEW', 'DISPOSE'];
  readonly actionLabels: Record<ProductAction, string> = {
    INCREASE: 'Add qty / channels',
    RELOAD: 'Load again',
    KEEP: 'Keep',
    REVIEW: 'Low seller',
    DISPOSE: 'Dispose',
  };
  readonly actionColors: Record<ProductAction, string> = {
    INCREASE: 'success',
    RELOAD: 'tertiary',
    KEEP: 'primary',
    REVIEW: 'warning',
    DISPOSE: 'danger',
  };

  isSuperAdmin = false;
  scope: Scope = 'owner';
  view: View = 'products';
  fromDate = moment().subtract(29, 'days').format('YYYY-MM-DD');
  toDate = moment().format('YYYY-MM-DD');
  machineId = 'all';
  machineOptions: string[] = [];
  actionFilter: ProductAction | 'ALL' = 'ALL';
  search = '';

  loading = false;
  errorMessage = '';
  result: any = null;

  constructor(
    public apiService: ApiService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.isSuperAdmin = !!localStorage.getItem('secretLocal');
    const q = this.route.snapshot.queryParamMap;
    this.scope = q.get('scope') === 'global' && this.isSuperAdmin ? 'global' : 'owner';
    this.machineId = q.get('machineId') || 'all';
    this.load();
  }

  get isSingleMachine() {
    return this.machineId !== 'all';
  }

  get products(): any[] {
    const list: any[] = this.result?.products || [];
    const term = this.search.trim().toLowerCase();
    return list.filter(p =>
      (this.actionFilter === 'ALL' || p.action === this.actionFilter) &&
      (!term || String(p.productName || '').toLowerCase().includes(term))
    );
  }

  setRange(days: number) {
    this.toDate = moment().format('YYYY-MM-DD');
    this.fromDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
    this.load();
  }

  changeScope() {
    this.machineId = 'all';
    this.machineOptions = [];
    this.load();
  }

  selectMachine(machineId: string) {
    this.machineId = machineId || 'all';
    this.view = 'products';
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    const body = { fromDate: this.fromDate, toDate: this.toDate, machineId: this.machineId };
    const req = this.scope === 'global'
      ? this.apiService.loadGlobalProductSalesAnalytics(body)
      : this.apiService.loadProductSalesAnalytics(body);

    req.subscribe({
      next: (r) => {
        this.loading = false;
        if (!r?.status) {
          this.errorMessage = typeof r?.message === 'string' ? r.message : 'Failed to load sales ranking';
          this.result = null;
          return;
        }
        this.result = r.data;
        if (!this.isSingleMachine) {
          this.machineOptions = (r.data?.machines || []).map((m: any) => m.machineId);
        }
        // the channel list is not built for the global view and the machine list is pointless for one machine
        if ((this.view === 'channels' && !r.data?.channels?.length) ||
            (this.view === 'machines' && this.isSingleMachine)) {
          this.view = 'products';
        }
      },
      error: (err) => {
        this.loading = false;
        this.result = null;
        this.errorMessage = err?.message || 'Failed to load sales ranking';
      },
    });
  }

  rebuild() {
    if (!confirm(`Rebuild accumulated sales data from ${this.fromDate} to ${this.toDate}? It runs in the background.`)) return;
    this.apiService.rebuildProductSalesRollup({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (r) => alert(r?.status ? 'Rebuild started. Reload in a few minutes.' : 'Rebuild failed: ' + (r?.message || '')),
      error: (err) => alert('Rebuild failed: ' + (err?.message || err)),
    });
  }

  exportCsv() {
    const rows = this.products;
    if (!rows.length) return;
    const header = ['Rank', 'Product', 'Qty', 'Amount', 'Qty %', 'Amount %', 'Qty/day', 'ABC', 'Machines sold', 'Channels now',
      'Suggested channels/machine', 'Stock now', 'Days to empty', 'Action', 'Reason'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(p => [p.rank, p.productName, p.qty, p.amount, p.qtyShare, p.amountShare, p.qtyPerDay, p.abc,
      p.machinesSold, p.currentChannels, p.suggestedChannelsPerMachine, p.currentStock, p.daysToEmpty ?? '', p.action, p.reason].map(esc).join(','));
    const blob = new Blob(['﻿' + [header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `product-ranking_${this.scope}_${this.machineId}_${this.fromDate}_${this.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  barWidth(value: number, max: number) {
    return max > 0 ? Math.max(2, Math.round((value / max) * 100)) + '%' : '0%';
  }

  get maxProductQty() {
    return Math.max(0, ...(this.result?.products || []).map((p: any) => p.qty));
  }

  get maxChannelQty() {
    return Math.max(0, ...(this.result?.channels || []).map((c: any) => c.qty));
  }

  get maxMachineAmount() {
    return Math.max(0, ...(this.result?.machines || []).map((m: any) => m.amount));
  }
}
