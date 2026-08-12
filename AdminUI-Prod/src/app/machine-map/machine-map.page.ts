import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { Subscription } from 'rxjs';
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
