import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { registerables } from 'chart.js';
import { firstValueFrom, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';

declare const L: any;

interface MapMachine {
  machineId: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'Online' | 'Broken' | 'Unknown';
  owner: string;
  qtyToday: number;
  amountToday: number;
  qtyMonth: number;
  amountMonth: number;
  /** ISO time of last live order (sales_update) for this machine */
  lastOrderAt?: string;
}

interface LatestOrderFlash {
  machineId: string;
  location: string;
  qtyToday: number;
  amountToday: number;
  at: string;
}

interface SaleOrderLine {
  stockId?: string | number;
  name: string;
  qty: number;
  price: number;
  total: number;
  position?: number | string;
  dropAt?: string;
}

interface SaleOrderBill {
  id?: number | string;
  createdAt: string;
  paymentstatus: string;
  totalvalue: number;
  transactionID?: string;
  lines: SaleOrderLine[];
  lineQty: number;
}

interface TopSaleProduct {
  rank: number;
  name: string;
  qty: number;
  amount: number;
  price: number;
}

interface PatternBucket {
  key: string;
  label: string;
  qty: number;
  amount: number;
  orderCount: number;
}

interface ProductPurchasePattern {
  name: string;
  qty: number;
  amount: number;
  bestDay: string;
  bestDayQty: number;
  bestSlot: string;
  bestSlotQty: number;
  days: PatternBucket[];
  slots: PatternBucket[];
}

type InsightPeriodKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth';

interface InsightPeriod {
  key: InsightPeriodKey;
  label: string;
  rangeLabel: string;
  fromDate: string;
  toDate: string;
  loading: boolean;
  error: string;
  orderCount: number;
  qty: number;
  amount: number;
  products: TopSaleProduct[];
  topProducts: TopSaleProduct[];
}

type MachineSortMode =
  | 'amountDesc'
  | 'amountAsc'
  | 'qtyDesc'
  | 'qtyAsc'
  | 'nameAsc'
  | 'nameDesc'
  | 'onlineFirst';

const HIDDEN_STORAGE_KEY = 'machineMapHiddenIds';
const SORT_STORAGE_KEY = 'machineMapSortMode';

Chart.register(...registerables);
@Component({
  selector: 'app-machine-map',
  templateUrl: './machine-map.page.html',
  styleUrls: ['./machine-map.page.scss'],
})
export class MachineMapPage implements AfterViewInit, OnDestroy {
  private map: any;
  private markersLayer: any;
  private markersById = new Map<string, any>();
  private hiddenIds = new Set<string>();
  private salesUpdateSub?: Subscription;
  private todaySalesByMachine = new Map<string, { qtyToday: number; amountToday: number }>();
  private todaySalesHydrated = false;
  private monthSalesByMachine = new Map<string, { qtyMonth: number; amountMonth: number }>();
  private monthSalesHydrated = false;
  private flashingIds = new Set<string>();
  private flashClearTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private latestOrderBannerTimer?: ReturnType<typeof setTimeout>;
  private readonly flashDurationMs = 2800;
  private readonly freshOrderWindowMs = 30000;

  machines: MapMachine[] = [];
  /** Shown briefly when a fresh live order arrives */
  latestOrder: LatestOrderFlash | null = null;
  /** YYYY-MM from month sales API */
  monthLabel = '';
  listFilter = '';
  mapSearch = '';
  mapSearchHint = '';
  selectedMachineId: string | null = null;
  sortMode: MachineSortMode = 'amountDesc';
  readonly sortOptions: Array<{ value: MachineSortMode; label: string }> = [
    { value: 'amountDesc', label: 'ຍອດເງິນຫຼາຍ → ໜ້ອຍ' },
    { value: 'amountAsc', label: 'ຍອດເງິນໜ້ອຍ → ຫຼາຍ' },
    { value: 'qtyDesc', label: 'ຈຳນວນຊິ້ນຫຼາຍ → ໜ້ອຍ' },
    { value: 'qtyAsc', label: 'ຈຳນວນຊິ້ນໜ້ອຍ → ຫຼາຍ' },
    { value: 'onlineFirst', label: 'ອອນລາຍກ່ອນ + ຍອດເງິນ' },
    { value: 'nameAsc', label: 'ຊື່ຕູ້ A → Z' },
    { value: 'nameDesc', label: 'ຊື່ຕູ້ Z → A' },
  ];
  missingCount = 0;
  loading = false;
  errorMessage = '';

  // Sale bill report panel (loadVendingMachineSaleBillReport)
  salesPanelOpen = false;
  salesMachine: MapMachine | null = null;
  salesFromDate = '';
  salesToDate = '';
  salesLoading = false;
  salesError = '';
  salesOrders: SaleOrderBill[] = [];
  salesOrderCount = 0;
  salesTab: 'orders' | 'top5' = 'orders';
  salesTopProducts: TopSaleProduct[] = [];

  // CEO insight split panel
  insightOpen = false;
  insightMachine: MapMachine | null = null;
  insightLoading = false;
  insightError = '';
  insightActivePeriod: InsightPeriodKey = 'today';
  insightPeriods: InsightPeriod[] = [];
  insightPatternRangeLabel = '';
  insightWeekdayStats: PatternBucket[] = [];
  insightHourStats: PatternBucket[] = [];
  insightSlotStats: PatternBucket[] = [];
  insightBestDay: PatternBucket | null = null;
  insightBestHour: PatternBucket | null = null;
  insightBestSlot: PatternBucket | null = null;
  insightSelectedSlotKey: string | null = null;
  insightProductPatterns: ProductPurchasePattern[] = [];
  /** Top products shown in overview table (capped for UI performance) */
  insightProductPatternsView: ProductPurchasePattern[] = [];
  /** Top products in selected time slot (capped, cached — not a getter) */
  insightSlotProductRankings: Array<{
    name: string;
    qty: number;
    bestDay: string;
    bestDayQty: number;
  }> = [];
  private insightPeriodChart: Chart | null = null;
  private insightProductChart: Chart | null = null;
  private insightWeekdayChart: Chart | null = null;
  private insightHourChart: Chart | null = null;
  private insightLoadToken = 0;

  constructor(
    private router: Router,
    public apiService: ApiService,
    private ngZone: NgZone,
  ) {
    this.hiddenIds = this.loadHiddenIds();
    this.sortMode = this.loadSortMode();
  }

  get filteredMachines(): MapMachine[] {
    const q = this.listFilter.trim().toLowerCase();
    const list = !q
      ? [...this.machines]
      : this.machines.filter(
          (m) =>
            m.machineId.toLowerCase().includes(q) ||
            m.location.toLowerCase().includes(q),
        );
    return this.sortMachines(list);
  }

  get visibleCount(): number {
    return this.machines.filter((m) => this.isVisible(m.machineId)).length;
  }

  get totalQtyToday(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.qtyToday) || 0), 0);
  }

  get totalAmountToday(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.amountToday) || 0), 0);
  }

  get totalQtyMonth(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.qtyMonth) || 0), 0);
  }

  get totalAmountMonth(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.amountMonth) || 0), 0);
  }

  get salesTotalAmount(): number {
    return this.salesOrders.reduce((sum, o) => sum + (Number(o.totalvalue) || 0), 0);
  }

  get salesTotalQty(): number {
    return this.salesOrders.reduce((sum, o) => sum + (Number(o.lineQty) || 0), 0);
  }

  onSortModeChange() {
    this.persistSortMode();
  }

  onListSearchKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = this.filteredMachines[0];
    if (first) this.focusMachine(first);
  }

  onMapSearchSubmit() {
    const q = this.mapSearch.trim().toLowerCase();
    if (!q) {
      this.mapSearchHint = '';
      return;
    }

    const matches = this.machines.filter(
      (m) =>
        m.machineId.toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q),
    );

    if (!matches.length) {
      this.mapSearchHint = 'ບໍ່ພົບຕູ້ທີ່ຄົ້ນຫາ';
      return;
    }

    const exactId = matches.find((m) => m.machineId.toLowerCase() === q);
    const exactLocation = matches.find((m) => (m.location || '').toLowerCase() === q);
    const target = exactId || exactLocation || matches[0];

    this.mapSearchHint =
      matches.length > 1 && !exactId && !exactLocation
        ? `ພົບ ${matches.length} ຕູ້ — ໄປທີ່ ${target.machineId}`
        : '';
    this.listFilter = this.mapSearch.trim();
    this.focusMachine(target);
  }

  focusMachine(m: MapMachine, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!m) return;

    if (!this.isVisible(m.machineId)) {
      this.hiddenIds.delete(m.machineId);
      this.persistHiddenIds();
    }

    this.selectedMachineId = m.machineId;
    this.renderMarkers(false);
    this.flyToMachine(m);
    this.openInsightPanel(m);
  }

  openInsightPanel(m: MapMachine) {
    this.insightMachine = m;
    this.insightOpen = true;
    this.insightError = '';
    this.insightActivePeriod = 'today';
    this.insightPeriods = this.buildEmptyInsightPeriods();
    this.resetPurchasePatterns();
    this.loadInsightData();
    setTimeout(() => this.map?.invalidateSize(), 220);
  }

  closeInsightPanel() {
    this.insightOpen = false;
    this.insightMachine = null;
    this.insightPeriods = [];
    this.insightError = '';
    this.insightLoading = false;
    this.resetPurchasePatterns();
    this.destroyInsightCharts();
    setTimeout(() => this.map?.invalidateSize(), 220);
  }

  setInsightPeriod(key: InsightPeriodKey) {
    this.insightActivePeriod = key;
    // Only refresh period/product charts — avoid recreating all charts (can freeze UI)
    setTimeout(() => {
      this.renderInsightPeriodChartOnly();
      this.renderInsightProductChartOnly();
    }, 40);
  }

  get insightActive(): InsightPeriod | null {
    return this.insightPeriods.find((p) => p.key === this.insightActivePeriod) || null;
  }

  get insightSelectedSlot(): PatternBucket | null {
    if (!this.insightSelectedSlotKey) return null;
    return this.insightSlotStats.find((s) => s.key === this.insightSelectedSlotKey) || null;
  }

  selectInsightSlot(key: string, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.insightSelectedSlotKey === key) return;
    this.insightSelectedSlotKey = key;
    this.updateSlotProductRankings();
  }

  refreshInsight() {
    if (!this.insightMachine) return;
    this.loadInsightData();
  }

  trackByName(_i: number, item: { name: string }): string {
    return item.name;
  }

  trackBySlotKey(_i: number, item: PatternBucket): string {
    return item.key;
  }

  private sortMachines(list: MapMachine[]): MapMachine[] {
    const byId = (a: MapMachine, b: MapMachine) => a.machineId.localeCompare(b.machineId);
    return list.sort((a, b) => {
      switch (this.sortMode) {
        case 'amountAsc':
          return (a.amountToday || 0) - (b.amountToday || 0) || byId(a, b);
        case 'qtyDesc':
          return (b.qtyToday || 0) - (a.qtyToday || 0) || byId(a, b);
        case 'qtyAsc':
          return (a.qtyToday || 0) - (b.qtyToday || 0) || byId(a, b);
        case 'nameAsc':
          return byId(a, b);
        case 'nameDesc':
          return byId(b, a);
        case 'onlineFirst': {
          const ao = a.status === 'Online' ? 0 : 1;
          const bo = b.status === 'Online' ? 0 : 1;
          return ao - bo || (b.amountToday || 0) - (a.amountToday || 0) || byId(a, b);
        }
        case 'amountDesc':
        default:
          return (b.amountToday || 0) - (a.amountToday || 0) || byId(a, b);
      }
    });
  }

  private loadSortMode(): MachineSortMode {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY) as MachineSortMode | null;
      const allowed = this.sortOptions.map((o) => o.value);
      if (raw && (allowed as string[]).includes(raw)) return raw;
    } catch { /* ignore */ }
    return 'amountDesc';
  }

  private persistSortMode() {
    localStorage.setItem(SORT_STORAGE_KEY, this.sortMode);
  }

  ngAfterViewInit() {
    this.initPage();
    this.hydrateTodaySalesOnce();
    this.hydrateMonthSalesOnce();
    this.salesUpdateSub = this.apiService.wsapi.salesUpdateSubscription.subscribe((payload) => {
      if (!payload?.machineId) return;
      this.ngZone.run(() => {
        this.applyTodaySalesUpdate(
          payload.machineId,
          payload.qtyToday,
          payload.amountToday,
          payload.timestamp,
        );
      });
    });
  }

  ngOnDestroy() {
    this.salesUpdateSub?.unsubscribe();
    this.flashClearTimers.forEach((t) => clearTimeout(t));
    this.flashClearTimers.clear();
    if (this.latestOrderBannerTimer) clearTimeout(this.latestOrderBannerTimer);
    this.destroyInsightCharts();
    this.destroyMap();
  }

  isFlashing(machineId: string): boolean {
    return this.flashingIds.has(machineId);
  }

  formatOrderTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  formatOrderRelative(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diffSec < 5) return 'ຫາກໍ່ນີ້';
    if (diffSec < 60) return `${diffSec} ວິ ທີ່ແລ້ວ`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ນາທີທີ່ແລ້ວ`;
    return this.formatOrderTime(iso);
  }

  goBack() {
    this.router.navigate(['/onlinemachines']);
  }

  async refresh() {
    await this.loadMachines();
    this.applyTodaySalesToList();
    this.applyMonthSalesToList();
    this.renderMarkers();
  }

  formatAmount(amount?: number): string {
    return (Number(amount) || 0).toLocaleString('en-US');
  }

  openSalesPanel(m: MapMachine, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.salesMachine = m;
    this.salesOrders = [];
    this.salesTopProducts = [];
    this.salesOrderCount = 0;
    this.salesTab = 'orders';
    this.salesError = '';
    const today = this.toDateInputValue(new Date());
    const monthStart = this.toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    this.salesFromDate = monthStart;
    this.salesToDate = today;
    this.salesPanelOpen = true;
    this.loadSalesOrders();
  }

  closeSalesPanel() {
    this.salesPanelOpen = false;
    this.salesMachine = null;
    this.salesOrders = [];
    this.salesTopProducts = [];
    this.salesError = '';
    this.salesLoading = false;
    this.salesTab = 'orders';
  }

  setSalesTab(tab: 'orders' | 'top5') {
    this.salesTab = tab;
  }

  loadSalesOrders() {
    if (!this.salesMachine?.machineId) return;
    if (!this.salesFromDate || !this.salesToDate) {
      this.salesError = 'ເລືອກວັນທີ່ເລີ່ມ ແລະ ວັນທີ່ສິ້ນສຸດ';
      return;
    }
    if (this.salesFromDate > this.salesToDate) {
      this.salesError = 'ວັນທີ່ເລີ່ມຕ້ອງບໍ່ຫຼາຍກວ່າວັນທີ່ສິ້ນສຸດ';
      return;
    }

    this.salesLoading = true;
    this.salesError = '';
    this.salesOrders = [];
    this.salesTopProducts = [];

    const token = localStorage.getItem('token') || localStorage.getItem('lva_token');
    const ownerPhone = String(this.salesMachine.owner || '');
    const shopPhonenumber = ownerPhone.replace(/\D/g, '').slice(-8);

    this.apiService
      .loadVendingMachineSaleBillReport({
        machineId: this.salesMachine.machineId,
        fromDate: this.salesFromDate,
        toDate: this.salesToDate,
        token,
        shopPhonenumber: shopPhonenumber || undefined,
      })
      .subscribe({
        next: (res: any) => {
          this.salesLoading = false;
          if (res?.status !== 1) {
            this.salesError = res?.message || 'ໂຫຼດຍອດຂາຍບໍ່ສຳເລັດ';
            return;
          }
          const rows = res?.data?.rows || [];
          this.salesOrderCount = Number(res?.data?.count) || rows.length;
          this.salesOrders = this.mapSaleBills(rows);
          this.salesTopProducts = this.buildTopProducts(this.salesOrders, 5);
        },
        error: (err) => {
          console.error('load sales orders failed', err);
          this.salesLoading = false;
          this.salesError = err?.message || 'ໂຫຼດຍອດຂາຍບໍ່ສຳເລັດ';
        },
      });
  }

  paymentStatusLabel(status?: string): string {
    if (status === 'paid') return 'ຈ່າຍແລ້ວ';
    if (status === 'delivered') return 'ເຄື່ອງຕົກແລ້ວ';
    return status || '-';
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private mapSaleBills(rows: any[]): SaleOrderBill[] {
    return (rows || []).map((bill) => {
      const lines: SaleOrderLine[] = (Array.isArray(bill?.vendingsales) ? bill.vendingsales : []).map(
        (vs: any) => {
          const qty = Number(vs?.stock?.qtty) || 1;
          const price = Number(vs?.stock?.price) || 0;
          return {
            stockId: vs?.stock?.id ?? vs?.stock?.uuid,
            name: vs?.stock?.name || '-',
            qty,
            price,
            total: qty * price,
            position: vs?.position,
            dropAt: vs?.dropAt || undefined,
          };
        },
      );
      const lineQty = lines.reduce((s, l) => s + (l.qty || 0), 0);
      return {
        id: bill?.id,
        createdAt: bill?.createdAt,
        paymentstatus: bill?.paymentstatus,
        totalvalue: Number(bill?.totalvalue) || 0,
        transactionID: bill?.transactionID,
        lines,
        lineQty: lineQty || lines.length || 1,
      };
    });
  }

  private buildTopProducts(orders: SaleOrderBill[], limit = 5): TopSaleProduct[] {
    const map = new Map<string, { name: string; qty: number; amount: number; price: number }>();
    for (const order of orders) {
      for (const line of order.lines) {
        const key = String(line.stockId ?? `${line.name}|${line.price}`);
        const cur = map.get(key) || {
          name: line.name,
          qty: 0,
          amount: 0,
          price: line.price,
        };
        cur.qty += Number(line.qty) || 0;
        cur.amount += Number(line.total) || 0;
        map.set(key, cur);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty || b.amount - a.amount)
      .slice(0, limit)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        qty: p.qty,
        amount: p.amount,
        price: p.price,
      }));
  }

  private buildProductsAscending(orders: SaleOrderBill[]): TopSaleProduct[] {
    const map = new Map<string, { name: string; qty: number; amount: number; price: number }>();
    for (const order of orders) {
      for (const line of order.lines) {
        const key = String(line.stockId ?? `${line.name}|${line.price}`);
        const cur = map.get(key) || {
          name: line.name,
          qty: 0,
          amount: 0,
          price: line.price,
        };
        cur.qty += Number(line.qty) || 0;
        cur.amount += Number(line.total) || 0;
        map.set(key, cur);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.qty - b.qty || a.amount - b.amount || a.name.localeCompare(b.name))
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        qty: p.qty,
        amount: p.amount,
        price: p.price,
      }));
  }

  private buildEmptyInsightPeriods(): InsightPeriod[] {
    const ranges = this.getInsightDateRanges();
    return [
      { key: 'today', label: 'ມື້ນີ້ (Real-time)', ...ranges.today, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
      { key: 'yesterday', label: 'ມື້ວານ', ...ranges.yesterday, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
      { key: 'thisWeek', label: 'ອາທິດນີ້', ...ranges.thisWeek, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
      { key: 'lastWeek', label: 'ອາທິດກ່ອນ', ...ranges.lastWeek, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
      { key: 'thisMonth', label: 'ເດືອນນີ້', ...ranges.thisMonth, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
      { key: 'lastMonth', label: 'ເດືອນກ່ອນ', ...ranges.lastMonth, loading: true, error: '', orderCount: 0, qty: 0, amount: 0, products: [], topProducts: [] },
    ];
  }

  private getInsightDateRanges(): Record<
    InsightPeriodKey,
    { fromDate: string; toDate: string; rangeLabel: string }
  > {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dow = today.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() + mondayOffset);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const fmt = (d: Date) => this.toDateInputValue(d);
    const label = (a: Date, b: Date) =>
      a.getTime() === b.getTime() ? fmt(a) : `${fmt(a)} → ${fmt(b)}`;

    return {
      today: { fromDate: fmt(today), toDate: fmt(today), rangeLabel: label(today, today) },
      yesterday: { fromDate: fmt(yesterday), toDate: fmt(yesterday), rangeLabel: label(yesterday, yesterday) },
      thisWeek: { fromDate: fmt(thisWeekStart), toDate: fmt(today), rangeLabel: label(thisWeekStart, today) },
      lastWeek: { fromDate: fmt(lastWeekStart), toDate: fmt(lastWeekEnd), rangeLabel: label(lastWeekStart, lastWeekEnd) },
      thisMonth: { fromDate: fmt(thisMonthStart), toDate: fmt(today), rangeLabel: label(thisMonthStart, today) },
      lastMonth: { fromDate: fmt(lastMonthStart), toDate: fmt(lastMonthEnd), rangeLabel: label(lastMonthStart, lastMonthEnd) },
    };
  }

  private async loadInsightData() {
    if (!this.insightMachine?.machineId) return;
    const machine = this.insightMachine;
    const token = ++this.insightLoadToken;
    this.insightLoading = true;
    this.insightError = '';

    const authToken = localStorage.getItem('token') || localStorage.getItem('lva_token');
    const ownerPhone = String(machine.owner || '');
    const shopPhonenumber = ownerPhone.replace(/\D/g, '').slice(-8);
    const patternOrders: SaleOrderBill[] = [];
    let patternFrom = '';
    let patternTo = '';

    await Promise.all(
      this.insightPeriods.map(async (period) => {
        period.loading = true;
        period.error = '';
        try {
          const res: any = await firstValueFrom(
            this.apiService.loadVendingMachineSaleBillReport({
              machineId: machine.machineId,
              fromDate: period.fromDate,
              toDate: period.toDate,
              token: authToken,
              shopPhonenumber: shopPhonenumber || undefined,
            }),
          );
          if (token !== this.insightLoadToken) return;
          if (res?.status !== 1) {
            period.error = res?.message || 'ໂຫຼດບໍ່ສຳເລັດ';
            period.orderCount = 0;
            period.qty = 0;
            period.amount = 0;
            period.products = [];
            period.topProducts = [];
            return;
          }
          const rows = res?.data?.rows || [];
          const orders = this.mapSaleBills(rows);
          period.orderCount = Number(res?.data?.count) || orders.length;
          period.qty = orders.reduce((s, o) => s + (Number(o.lineQty) || 0), 0);
          period.amount = orders.reduce((s, o) => s + (Number(o.totalvalue) || 0), 0);
          period.products = this.buildProductsAscending(orders);
          period.topProducts = this.buildTopProducts(orders, 5);

          // Use this month + last month for purchase-behavior overview
          if (period.key === 'thisMonth' || period.key === 'lastMonth') {
            patternOrders.push(...orders);
            if (!patternFrom || period.fromDate < patternFrom) patternFrom = period.fromDate;
            if (!patternTo || period.toDate > patternTo) patternTo = period.toDate;
          }
        } catch (err: any) {
          if (token !== this.insightLoadToken) return;
          console.error('insight period load failed', period.key, err);
          period.error = err?.message || 'ໂຫຼດບໍ່ສຳເລັດ';
          period.orderCount = 0;
          period.qty = 0;
          period.amount = 0;
          period.products = [];
          period.topProducts = [];
        } finally {
          if (token === this.insightLoadToken) period.loading = false;
        }
      }),
    );

    if (token !== this.insightLoadToken) return;
    this.insightLoading = false;
    this.insightPeriods = [...this.insightPeriods];
    this.applyPurchasePatterns(patternOrders, patternFrom, patternTo);
    setTimeout(() => this.renderInsightCharts(), 80);
  }

  private async refreshInsightTodayRealtime() {
    if (!this.insightOpen || !this.insightMachine) return;
    const period = this.insightPeriods.find((p) => p.key === 'today');
    if (!period) return;

    const machine = this.insightMachine;
    const authToken = localStorage.getItem('token') || localStorage.getItem('lva_token');
    const ownerPhone = String(machine.owner || '');
    const shopPhonenumber = ownerPhone.replace(/\D/g, '').slice(-8);
    period.loading = true;

    try {
      const res: any = await firstValueFrom(
        this.apiService.loadVendingMachineSaleBillReport({
          machineId: machine.machineId,
          fromDate: period.fromDate,
          toDate: period.toDate,
          token: authToken,
          shopPhonenumber: shopPhonenumber || undefined,
        }),
      );
      if (!this.insightOpen || this.insightMachine?.machineId !== machine.machineId) return;
      if (res?.status === 1) {
        const orders = this.mapSaleBills(res?.data?.rows || []);
        period.orderCount = Number(res?.data?.count) || orders.length;
        period.qty = orders.reduce((s, o) => s + (Number(o.lineQty) || 0), 0);
        period.amount = orders.reduce((s, o) => s + (Number(o.totalvalue) || 0), 0);
        period.products = this.buildProductsAscending(orders);
        period.topProducts = this.buildTopProducts(orders, 5);
        period.error = '';
      }
    } catch (err) {
      console.error('insight today realtime refresh failed', err);
    } finally {
      period.loading = false;
      this.insightPeriods = [...this.insightPeriods];
      if (this.insightActivePeriod === 'today') {
        setTimeout(() => this.renderInsightCharts(), 40);
      } else {
        setTimeout(() => this.renderInsightPeriodChartOnly(), 40);
      }
    }
  }

  private destroyInsightCharts() {
    this.insightPeriodChart?.destroy();
    this.insightProductChart?.destroy();
    this.insightWeekdayChart?.destroy();
    this.insightHourChart?.destroy();
    this.insightPeriodChart = null;
    this.insightProductChart = null;
    this.insightWeekdayChart = null;
    this.insightHourChart = null;
  }

  private renderInsightCharts() {
    this.renderInsightPeriodChartOnly();
    this.renderInsightProductChartOnly();
    this.renderInsightWeekdayChartOnly();
    this.renderInsightHourChartOnly();
  }

  private resetPurchasePatterns() {
    this.insightPatternRangeLabel = '';
    this.insightWeekdayStats = [];
    this.insightHourStats = [];
    this.insightSlotStats = [];
    this.insightBestDay = null;
    this.insightBestHour = null;
    this.insightBestSlot = null;
    this.insightSelectedSlotKey = null;
    this.insightProductPatterns = [];
    this.insightProductPatternsView = [];
    this.insightSlotProductRankings = [];
  }

  private weekdayLabel(dayIndex: number): string {
    // JS: 0=Sun ... 6=Sat
    const labels = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
    return labels[dayIndex] || '-';
  }

  private timeSlotForHour(hour: number): { key: string; label: string } {
    if (hour >= 6 && hour < 11) return { key: 'morning', label: 'ຕອນເຊົ້າ (06-11)' };
    if (hour >= 11 && hour < 14) return { key: 'noon', label: 'ຕອນທ່ຽງ (11-14)' };
    if (hour >= 14 && hour < 17) return { key: 'afternoon', label: 'ຕອນບ່າຍ (14-17)' };
    if (hour >= 17 && hour < 20) return { key: 'evening', label: 'ຕອນແລງ (17-20)' };
    if (hour >= 20) return { key: 'night', label: 'ຕອນຄ່ຳ (20-24)' };
    return { key: 'late', label: 'ຕອນດຶກ (00-06)' };
  }

  private applyPurchasePatterns(orders: SaleOrderBill[], fromDate: string, toDate: string) {
    if (!orders.length) {
      this.resetPurchasePatterns();
      this.insightPatternRangeLabel = fromDate && toDate ? `${fromDate} → ${toDate}` : '';
      return;
    }

    this.insightPatternRangeLabel = fromDate && toDate ? `${fromDate} → ${toDate}` : '';

    const weekdayMap = new Map<number, PatternBucket>();
    for (let d = 0; d < 7; d++) {
      weekdayMap.set(d, {
        key: String(d),
        label: this.weekdayLabel(d),
        qty: 0,
        amount: 0,
        orderCount: 0,
      });
    }

    const hourMap = new Map<number, PatternBucket>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, {
        key: String(h),
        label: `${String(h).padStart(2, '0')}:00`,
        qty: 0,
        amount: 0,
        orderCount: 0,
      });
    }

    const slotOrder = ['morning', 'noon', 'afternoon', 'evening', 'night', 'late'];
    const slotMap = new Map<string, PatternBucket>();
    for (const key of slotOrder) {
      const meta = this.timeSlotForHour(
        key === 'morning' ? 8 : key === 'noon' ? 12 : key === 'afternoon' ? 15 : key === 'evening' ? 18 : key === 'night' ? 21 : 2,
      );
      slotMap.set(key, { key, label: meta.label, qty: 0, amount: 0, orderCount: 0 });
    }

    type ProdAgg = {
      name: string;
      qty: number;
      amount: number;
      days: Map<number, number>;
      slots: Map<string, number>;
    };
    const productMap = new Map<string, ProdAgg>();

    for (const order of orders) {
      const dt = new Date(order.createdAt);
      if (Number.isNaN(dt.getTime())) continue;
      const day = dt.getDay();
      const hour = dt.getHours();
      const slot = this.timeSlotForHour(hour);
      const orderQty = Number(order.lineQty) || order.lines.reduce((s, l) => s + (l.qty || 0), 0) || 1;
      const orderAmount = Number(order.totalvalue) || 0;

      const w = weekdayMap.get(day)!;
      w.orderCount += 1;
      w.qty += orderQty;
      w.amount += orderAmount;

      const h = hourMap.get(hour)!;
      h.orderCount += 1;
      h.qty += orderQty;
      h.amount += orderAmount;

      const s = slotMap.get(slot.key)!;
      s.orderCount += 1;
      s.qty += orderQty;
      s.amount += orderAmount;

      for (const line of order.lines) {
        const key = String(line.stockId ?? `${line.name}|${line.price}`);
        const cur = productMap.get(key) || {
          name: line.name,
          qty: 0,
          amount: 0,
          days: new Map<number, number>(),
          slots: new Map<string, number>(),
        };
        const q = Number(line.qty) || 0;
        cur.qty += q;
        cur.amount += Number(line.total) || 0;
        cur.days.set(day, (cur.days.get(day) || 0) + q);
        cur.slots.set(slot.key, (cur.slots.get(slot.key) || 0) + q);
        productMap.set(key, cur);
      }
    }

    // Display week starting Monday
    const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
    this.insightWeekdayStats = weekdayOrder.map((d) => weekdayMap.get(d)!);
    this.insightHourStats = Array.from({ length: 24 }, (_, i) => hourMap.get(i)!);
    this.insightSlotStats = slotOrder.map((k) => slotMap.get(k)!);

    const pickBest = (list: PatternBucket[]) =>
      [...list].sort((a, b) => b.qty - a.qty || b.amount - a.amount)[0] || null;

    this.insightBestDay = pickBest(this.insightWeekdayStats);
    this.insightBestHour = pickBest(this.insightHourStats);
    this.insightBestSlot = pickBest(this.insightSlotStats);
    this.insightSelectedSlotKey = this.insightBestSlot?.key || null;

    this.insightProductPatterns = Array.from(productMap.values())
      .map((p) => {
        const days: PatternBucket[] = weekdayOrder.map((d) => ({
          key: String(d),
          label: this.weekdayLabel(d),
          qty: p.days.get(d) || 0,
          amount: 0,
          orderCount: 0,
        }));
        const slots: PatternBucket[] = slotOrder.map((k) => ({
          key: k,
          label: slotMap.get(k)!.label,
          qty: p.slots.get(k) || 0,
          amount: 0,
          orderCount: 0,
        }));
        const bestDay = [...days].sort((a, b) => b.qty - a.qty)[0];
        const bestSlot = [...slots].sort((a, b) => b.qty - a.qty)[0];
        return {
          name: p.name,
          qty: p.qty,
          amount: p.amount,
          bestDay: bestDay?.qty ? bestDay.label : '-',
          bestDayQty: bestDay?.qty || 0,
          bestSlot: bestSlot?.qty ? bestSlot.label : '-',
          bestSlotQty: bestSlot?.qty || 0,
          days,
          slots,
        } as ProductPurchasePattern;
      })
      .sort((a, b) => b.qty - a.qty || b.amount - a.amount);

    this.insightProductPatternsView = this.insightProductPatterns.slice(0, 20);
    this.updateSlotProductRankings();
  }

  private updateSlotProductRankings() {
    const key = this.insightSelectedSlotKey;
    if (!key) {
      this.insightSlotProductRankings = [];
      return;
    }
    this.insightSlotProductRankings = this.insightProductPatterns
      .map((p) => {
        const slot = p.slots.find((s) => s.key === key);
        return {
          name: p.name,
          qty: slot?.qty || 0,
          bestDay: p.bestDay,
          bestDayQty: p.bestDayQty,
        };
      })
      .filter((p) => p.qty > 0)
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  private chartBaseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      resizeDelay: 200,
    };
  }

  private renderInsightWeekdayChartOnly() {
    const canvas = document.getElementById('insight-weekday-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.insightWeekdayChart?.destroy();
    this.insightWeekdayChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.insightWeekdayStats.map((d) => d.label),
        datasets: [
          {
            label: 'ຈຳນວນຊິ້ນ',
            data: this.insightWeekdayStats.map((d) => d.qty),
            backgroundColor: 'rgba(25, 118, 210, 0.7)',
            borderColor: '#1976d2',
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...this.chartBaseOptions(),
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'ມື້ໃນອາທິດທີ່ຄົນຊື້ຫຼາຍ' },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderInsightHourChartOnly() {
    const canvas = document.getElementById('insight-hour-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.insightHourChart?.destroy();
    this.insightHourChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.insightHourStats.map((h) => h.label),
        datasets: [
          {
            label: 'ຈຳນວນຊິ້ນ',
            data: this.insightHourStats.map((h) => h.qty),
            borderColor: '#e65100',
            backgroundColor: 'rgba(230, 81, 0, 0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
          },
        ],
      },
      options: {
        ...this.chartBaseOptions(),
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'ເວລາໃນມື້ທີ່ຄົນຊື້ຫຼາຍ' },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderInsightPeriodChartOnly() {
    const canvas = document.getElementById('insight-period-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const labels = this.insightPeriods.map((p) => p.label.replace(' (Real-time)', ''));
    const amounts = this.insightPeriods.map((p) => (Number(p.amount) || 0) / 1000);
    const qtys = this.insightPeriods.map((p) => Number(p.qty) || 0);

    this.insightPeriodChart?.destroy();
    this.insightPeriodChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'ຍອດເງິນ (×1,000 LAK)',
            data: amounts,
            backgroundColor: 'rgba(25, 118, 210, 0.7)',
            borderColor: 'rgba(25, 118, 210, 1)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'ຈຳນວນຊິ້ນ',
            data: qtys,
            type: 'line' as const,
            borderColor: '#e65100',
            backgroundColor: 'rgba(230, 81, 0, 0.15)',
            tension: 0.25,
            yAxisID: 'y1',
          },
        ] as any,
      },
      options: {
        ...this.chartBaseOptions(),
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'ສົມທຽບຍອດຂາຍຕາມຊ່ວງເວລາ' },
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: { display: true, text: '×1,000 LAK' },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'ຊິ້ນ' },
          },
        },
      },
    });
  }

  private renderInsightProductChartOnly() {
    const canvas = document.getElementById('insight-product-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const period = this.insightActive;
    // Top 5 best sellers: show highest first in horizontal chart (top of chart)
    const products = [...(period?.topProducts || [])].reverse();
    const labels = products.map((p) => p.name);
    const qtys = products.map((p) => p.qty);
    const amounts = products.map((p) => (Number(p.amount) || 0) / 1000);

    this.insightProductChart?.destroy();
    this.insightProductChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'ຈຳນວນ (ຊິ້ນ)',
            data: qtys,
            backgroundColor: 'rgba(46, 125, 50, 0.7)',
            borderColor: '#2e7d32',
            borderWidth: 1,
          },
          {
            label: 'ຍອດເງິນ (×1,000 LAK)',
            data: amounts,
            backgroundColor: 'rgba(106, 27, 154, 0.55)',
            borderColor: '#6a1b9a',
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        ...this.chartBaseOptions(),
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: `Top 5 ສິນຄ້າຂາຍດີ · ${period?.label || ''}`,
          },
        },
        scales: {
          x: { beginAtZero: true },
        },
      },
    });
  }

  isVisible(machineId: string): boolean {
    return !this.hiddenIds.has(machineId);
  }

  toggleMachine(machineId: string, visible: boolean) {
    if (visible) {
      this.hiddenIds.delete(machineId);
    } else {
      this.hiddenIds.add(machineId);
    }
    this.persistHiddenIds();
    this.renderMarkers(false);
  }

  showAll() {
    this.machines.forEach((m) => this.hiddenIds.delete(m.machineId));
    this.persistHiddenIds();
    this.renderMarkers();
  }

  hideAll() {
    this.machines.forEach((m) => this.hiddenIds.add(m.machineId));
    this.persistHiddenIds();
    this.renderMarkers(false);
  }

  private hydrateTodaySalesOnce() {
    if (this.todaySalesHydrated) return;
    this.todaySalesHydrated = true;
    this.apiService.loadAllVendingMachinesTodaySalesSummary().subscribe({
      next: (res: any) => {
        if (res?.status !== 1) return;
        const rows = res?.data?.rows || [];
        for (const row of rows) {
          if (!row?.machineId) continue;
          this.todaySalesByMachine.set(row.machineId, {
            qtyToday: Number(row.qtyToday) || 0,
            amountToday: Number(row.amountToday) || 0,
          });
        }
        this.applyTodaySalesToList();
        this.renderMarkers(false);
      },
      error: (err) => {
        console.error('today sales hydrate failed', err);
        this.todaySalesHydrated = false;
      },
    });
  }

  private hydrateMonthSalesOnce() {
    if (this.monthSalesHydrated) return;
    this.monthSalesHydrated = true;
    this.apiService.loadAllVendingMachinesMonthSalesSummary().subscribe({
      next: (res: any) => {
        if (res?.status !== 1) return;
        this.monthLabel = res?.data?.month || '';
        const rows = res?.data?.rows || [];
        for (const row of rows) {
          if (!row?.machineId) continue;
          this.monthSalesByMachine.set(row.machineId, {
            qtyMonth: Number(row.qtyMonth) || 0,
            amountMonth: Number(row.amountMonth) || 0,
          });
        }
        this.applyMonthSalesToList();
        this.renderMarkers(false);
      },
      error: (err) => {
        console.error('month sales hydrate failed', err);
        this.monthSalesHydrated = false;
      },
    });
  }

  private applyTodaySalesUpdate(
    machineId: string,
    qtyToday: number,
    amountToday: number,
    timestamp?: string,
  ) {
    const at = timestamp && !Number.isNaN(new Date(timestamp).getTime())
      ? timestamp
      : new Date().toISOString();
    const qty = Number(qtyToday) || 0;
    const amount = Number(amountToday) || 0;

    this.todaySalesByMachine.set(machineId, { qtyToday: qty, amountToday: amount });
    const m = this.machines.find((x) => x.machineId === machineId);
    if (m) {
      m.qtyToday = qty;
      m.amountToday = amount;
      m.lastOrderAt = at;
      // new array ref so toolbar getters + list refresh reliably
      this.machines = [...this.machines];
      this.renderMarkers(false);
      if (this.insightOpen && this.insightMachine?.machineId === machineId) {
        this.insightMachine = { ...m };
        this.refreshInsightTodayRealtime();
      }
    }

    // Only animate for fresh live events (skip BehaviorSubject replay of old payload)
    if (this.isFreshOrder(at)) {
      this.triggerOrderFlash(machineId, m?.location || '', qty, amount, at);
    }
  }

  private isFreshOrder(iso: string): boolean {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() - t <= this.freshOrderWindowMs;
  }

  private triggerOrderFlash(
    machineId: string,
    location: string,
    qtyToday: number,
    amountToday: number,
    at: string,
  ) {
    this.flashingIds.add(machineId);
    const prev = this.flashClearTimers.get(machineId);
    if (prev) clearTimeout(prev);
    this.flashClearTimers.set(
      machineId,
      setTimeout(() => {
        this.flashingIds.delete(machineId);
        this.flashClearTimers.delete(machineId);
        this.renderMarkers(false);
      }, this.flashDurationMs),
    );

    this.latestOrder = { machineId, location, qtyToday, amountToday, at };
    if (this.latestOrderBannerTimer) clearTimeout(this.latestOrderBannerTimer);
    this.latestOrderBannerTimer = setTimeout(() => {
      this.latestOrder = null;
      this.latestOrderBannerTimer = undefined;
    }, this.flashDurationMs + 1200);

    this.renderMarkers(false);
  }

  private applyTodaySalesToList() {
    for (const m of this.machines) {
      const s = this.todaySalesByMachine.get(m.machineId);
      m.qtyToday = s?.qtyToday ?? 0;
      m.amountToday = s?.amountToday ?? 0;
    }
  }

  private applyMonthSalesToList() {
    for (const m of this.machines) {
      const s = this.monthSalesByMachine.get(m.machineId);
      m.qtyMonth = s?.qtyMonth ?? 0;
      m.amountMonth = s?.amountMonth ?? 0;
    }
    // new array ref so toolbar month totals refresh
    this.machines = [...this.machines];
  }

  private async initPage() {
    try {
      await this.ensureLeaflet();
      this.initMap();
      await this.loadMachines();
      this.applyTodaySalesToList();
      this.applyMonthSalesToList();
      this.renderMarkers();
    } catch (err: any) {
      console.error('Map init error:', err);
      this.errorMessage = err?.message || 'ບໍ່ສາມາດໂຫຼດແຜນທີ່ໄດ້';
    }
  }

  private ensureLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const scriptId = 'leaflet-js';
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('ໂຫຼດແຜນທີ່ບໍ່ສຳເລັດ')));
        if (typeof L !== 'undefined') resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('ໂຫຼດແຜນທີ່ບໍ່ສຳເລັດ'));
      document.body.appendChild(script);
    });
  }

  private initMap() {
    if (this.map || typeof L === 'undefined') return;

    // Default center: Vientiane, Laos
    this.map = L.map('machine-map', {
      zoomControl: true,
    }).setView([17.9757, 102.6331], 7);

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      },
    );

    // Default to satellite view
    satellite.addTo(this.map);

    L.control
      .layers(
        {
          'ດາວທຽມ': satellite,
          'ແຜນທີ່': street,
        },
        {},
        { position: 'topright' },
      )
      .addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markersLayer = null;
    }
  }

  private async loadMachines() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = localStorage.getItem('token');
      const secret = localStorage.getItem('secretLocal');
      const payload = { secret, shopPhonenumber: '', token };

      const [allRes, onlineRes] = await Promise.all([
        axios.post(`${environment.url}/getAllMachines`, payload),
        axios.post(`${environment.url}/getOnlineMachines`, payload),
      ]);

      const onlineMap = new Map<string, any>();
      onlineRes?.data?.data
        ?.filter((item: any) => item?.machine)
        ?.forEach((item: any) => onlineMap.set(item.machine.machineId, item));

      const now = new Date();
      const list: MapMachine[] = [];
      const allMachines = allRes?.data?.data || [];
      const prevLastOrder = new Map(
        this.machines
          .filter((m) => m.lastOrderAt)
          .map((m) => [m.machineId, m.lastOrderAt as string]),
      );

      allMachines.forEach((machine: any) => {
        const d = machine?.data?.[0] || {};
        const lat = this.toCoord(d?.latitude);
        const lng = this.toCoord(d?.longitude);
        if (lat == null || lng == null) return;

        const onlineData = onlineMap.get(machine.machineId);
        let status: MapMachine['status'] = 'Broken';
        if (onlineData?.status?.t) {
          const lastTime = new Date(onlineData.status.t);
          const diffMin = (now.getTime() - lastTime.getTime()) / 60000;
          if (diffMin <= 5) status = 'Online';
        }

        const location = (d?.location != null && String(d.location).trim() !== '')
          ? String(d.location).trim()
          : '';

        const sales = this.todaySalesByMachine.get(machine.machineId);
        const monthSales = this.monthSalesByMachine.get(machine.machineId);

        list.push({
          machineId: machine.machineId,
          location,
          latitude: lat,
          longitude: lng,
          status,
          owner: d?.ownerPhone ? String(d.ownerPhone) : 'Unknown',
          qtyToday: sales?.qtyToday ?? 0,
          amountToday: sales?.amountToday ?? 0,
          qtyMonth: monthSales?.qtyMonth ?? 0,
          amountMonth: monthSales?.amountMonth ?? 0,
          lastOrderAt: prevLastOrder.get(machine.machineId),
        });
      });

      this.machines = list.sort((a, b) => a.machineId.localeCompare(b.machineId));
      this.missingCount = Math.max(0, allMachines.length - list.length);
    } catch (err: any) {
      console.error('Load machines for map error:', err);
      this.errorMessage = err?.message || 'ໂຫຼດຂໍ້ມູນຕູ້ບໍ່ສຳເລັດ';
      this.machines = [];
      this.missingCount = 0;
    } finally {
      this.loading = false;
    }
  }

  private toCoord(value: any): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private flyToMachine(m: MapMachine) {
    if (!this.map || typeof L === 'undefined') return;
    const latLng: [number, number] = [m.latitude, m.longitude];
    this.map.flyTo(latLng, Math.max(this.map.getZoom(), 16), { duration: 0.75 });
    setTimeout(() => {
      const marker = this.markersById.get(m.machineId);
      marker?.openPopup();
      this.map?.invalidateSize();
    }, 800);
  }

  private renderMarkers(fitBounds = true) {
    if (!this.map || !this.markersLayer || typeof L === 'undefined') return;

    this.markersLayer.clearLayers();
    this.markersById.clear();

    const visible = this.machines.filter((m) => this.isVisible(m.machineId));
    if (!visible.length) {
      if (fitBounds) {
        this.map.setView([17.9757, 102.6331], 7);
      }
      setTimeout(() => this.map?.invalidateSize(), 150);
      return;
    }

    const bounds = L.latLngBounds([]);

    visible.forEach((m) => {
      const label = m.location || m.machineId;
      const statusClass = m.status === 'Online' ? 'online' : 'offline';
      const flashClass = this.isFlashing(m.machineId) ? 'order-flash' : '';
      const selectedClass = this.selectedMachineId === m.machineId ? 'selected' : '';
      const salesLine = `${m.qtyToday || 0} ຊິ້ນ · ${this.formatAmount(m.amountToday)} LAK`;
      const monthLine = `ເດືອນນີ້: ${m.qtyMonth || 0} ຊິ້ນ · ${this.formatAmount(m.amountMonth)} LAK`;
      const lastOrderLine = m.lastOrderAt
        ? `ຄຳສັ່ງລ່າສຸດ: ${this.formatOrderTime(m.lastOrderAt)}`
        : '';
      const statusLabel = m.status === 'Online' ? 'ອອນລາຍ' : 'ອອບລາຍ';

      const icon = L.divIcon({
        className: 'machine-marker',
        html: `
          <div class="marker-wrap ${statusClass} ${flashClass} ${selectedClass}">
            <div class="marker-label">${this.escapeHtml(label)}</div>
            <div class="marker-sales">${this.escapeHtml(salesLine)}</div>
            <div class="marker-month">${this.escapeHtml(monthLine)}</div>
            ${lastOrderLine ? `<div class="marker-last-order">${this.escapeHtml(lastOrderLine)}</div>` : ''}
            <div class="marker-pin"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon });
      marker.bindPopup(`
        <div class="map-popup">
          <strong>${this.escapeHtml(m.machineId)}</strong><br/>
          ທີ່ຕັ້ງ: ${this.escapeHtml(m.location || '-')}<br/>
          ສະຖານະ: ${statusLabel}<br/>
          ມື້ນີ້: ${this.escapeHtml(salesLine)}<br/>
          ${this.escapeHtml(monthLine)}<br/>
          ${lastOrderLine ? `${this.escapeHtml(lastOrderLine)}<br/>` : ''}
          Lat: ${m.latitude}<br/>
          Lng: ${m.longitude}
        </div>
      `);
      marker.on('click', () => {
        this.ngZone.run(() => {
          this.selectedMachineId = m.machineId;
          this.openInsightPanel(m);
        });
      });
      marker.addTo(this.markersLayer);
      this.markersById.set(m.machineId, marker);
      bounds.extend([m.latitude, m.longitude]);
    });

    if (fitBounds && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.2));
    }

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private loadHiddenIds(): Set<string> {
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((id) => typeof id === 'string'));
    } catch {
      return new Set();
    }
  }

  private persistHiddenIds() {
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify([...this.hiddenIds]));
  }

  private escapeHtml(text: string): string {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
