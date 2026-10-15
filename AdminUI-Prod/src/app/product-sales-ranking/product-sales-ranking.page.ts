import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { ApiService } from '../services/api.service';
import { I18nKey, Lang, LANG_STORAGE_KEY, translate } from './product-sales-ranking.i18n';

type Scope = 'owner' | 'global';
type View = 'products' | 'channels' | 'machines';
type Period = 'today' | '7' | '30' | '90' | 'custom';
type ProductAction = 'INCREASE' | 'KEEP' | 'REVIEW' | 'DISPOSE' | 'RELOAD';
type SortKey = 'amount' | 'qty' | 'rate';

interface MachineRef {
  ownerUuid: string;
  machineId: string;
  location?: string;
  shopPhone?: string;
  ownerPhone?: string;
}

/** a shop = all machines sharing one shopPhone ('' = machines without a shop phone) */
interface ShopRef {
  shopPhone: string;
  count: number;
  locations: string[];
}

interface ActionInfo {
  label: string;
  title: string;
  hint: string;
  icon: string;
  color: string;
}

const ACTION_STYLE: Record<ProductAction, { icon: string; color: string }> = {
  INCREASE: { icon: 'trending-up-outline', color: 'success' },
  RELOAD: { icon: 'refresh-circle-outline', color: 'tertiary' },
  KEEP: { icon: 'checkmark-circle-outline', color: 'primary' },
  REVIEW: { icon: 'alert-circle-outline', color: 'warning' },
  DISPOSE: { icon: 'trash-outline', color: 'danger' },
};

/** same threshold the server uses for "stock runs out soon" */
const LOW_COVER_DAYS = 3;

/**
 * Product sales ranking: best/worst sellers per machine, per owner and globally,
 * with advice on which products need more qty/channels and which to dispose.
 * Opened as /product-sales-ranking?scope=owner|global&machineIds=a,b&shopPhone=...
 */
@Component({
  selector: 'app-product-sales-ranking',
  templateUrl: './product-sales-ranking.page.html',
  styleUrls: ['./product-sales-ranking.page.scss'],
})
export class ProductSalesRankingPage implements OnInit {

  lang: Lang = 'en';
  /** labels follow the selected language; rebuilt by setLang() */
  actionInfo = {} as Record<ProductAction, ActionInfo>;
  /** order of the "What to do" cards: most urgent first */
  readonly todoActions: ProductAction[] = ['INCREASE', 'RELOAD', 'DISPOSE', 'REVIEW'];
  readonly filterActions: ProductAction[] = ['INCREASE', 'RELOAD', 'KEEP', 'REVIEW', 'DISPOSE'];

  isSuperAdmin = false;
  scope: Scope = 'owner';
  view: View = 'products';
  period: Period = '30';
  fromDate = moment().subtract(29, 'days').format('YYYY-MM-DD');
  toDate = moment().format('YYYY-MM-DD');
  /** picked machines; empty = all machines in the scope / owner */
  selectedIds: string[] = [];
  /** limit to one shop (by shopPhone); null = all shops, '' = machines without a shop phone */
  shop: string | null = null;
  catalog: MachineRef[] = [];
  shops: ShopRef[] = [];
  /** the analytics API is the old version (no `catalog`), so shop / machine filters are ignored */
  catalogMissing = false;
  /** catalog came from the same list the dashboard uses (getAllMachines / listMachine) */
  private catalogFromList = false;
  private catalogMap = new Map<string, MachineRef>();

  /** which inline dropdown is open */
  dropdown: 'shop' | 'machine' | null = null;
  shopSearch = '';
  pickerSearch = '';
  pickerDraft = new Set<string>();
  actionFilter: ProductAction | 'ALL' = 'ALL';
  readonly sortOptions: Array<{ key: SortKey; labelKey: I18nKey }> = [
    { key: 'amount', labelKey: 'amount' },
    { key: 'qty', labelKey: 'qty' },
    { key: 'rate', labelKey: 'sortRate' },
  ];
  sortBy: SortKey = 'amount';
  sortDesc = true;
  channelSort: 'slot' | 'qty' = 'slot';
  search = '';

  loading = false;
  errorMessage = '';
  result: any = null;

  // ---- view models: built once per change by refreshView(), never inside change detection ----
  /** rows drawn at once; "Show more" adds another page */
  readonly pageSize = 100;
  products: any[] = [];
  machines: any[] = [];
  channelGroups: Array<{ machineId: string; channels: any[] }> = [];
  productLimit = this.pageSize;
  machineLimit = this.pageSize;
  channelGroupLimit = 20;
  maxProductQty = 0;
  maxChannelQty = 0;
  maxMachineAmount = 0;
  private todoProducts = {} as Record<ProductAction, any[]>;
  shopCatalog: MachineRef[] = [];
  filteredShops: ShopRef[] = [];
  pickerGroups: Array<{ shopPhone: string; machines: MachineRef[] }> = [];
  private ranks = new Map<SortKey, Map<string, number>>();
  private machineRanks = new Map<SortKey, Map<string, number>>();

  constructor(
    public apiService: ApiService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANG_STORAGE_KEY); } catch { }
    this.setLang(saved === 'lo' ? 'lo' : 'en');
    this.isSuperAdmin = !!localStorage.getItem('secretLocal');
    const q = this.route.snapshot.queryParamMap;
    this.scope = q.get('scope') === 'global' && this.isSuperAdmin ? 'global' : 'owner';
    const ids = q.get('machineIds') || q.get('machineId') || '';
    this.selectedIds = ids.split(',').map(x => x.trim()).filter(x => x && x !== 'all');
    this.shop = q.has('shopPhone') ? (q.get('shopPhone') || '') : null;
    this.loadCatalog();
    this.load();
  }

  // ---- language -------------------------------------------------------------------------------

  setLang(lang: Lang) {
    this.lang = lang;
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { }
    this.actionInfo = {} as Record<ProductAction, ActionInfo>;
    (Object.keys(ACTION_STYLE) as ProductAction[]).forEach(a => {
      this.actionInfo[a] = {
        ...ACTION_STYLE[a],
        label: this.t(('act_' + a + '_label') as I18nKey),
        title: this.t(('act_' + a + '_title') as I18nKey),
        hint: this.t(('act_' + a + '_hint') as I18nKey),
      };
    });
    this.refreshView();
  }

  t(key: I18nKey | string, params?: Record<string, any>) {
    return translate(this.lang, key, params);
  }

  sortLabel(key: SortKey) {
    return this.t(this.sortOptions.find(o => o.key === key)?.labelKey || key);
  }

  /** advice reason in the selected language, from the same numbers the server used */
  reasonText(p: any): string {
    const d = this.result?.days || 0;
    switch (p.action as ProductAction) {
      case 'DISPOSE':
        return this.t('why_DISPOSE', { n: p.currentChannels, d });
      case 'RELOAD':
        return this.t('why_RELOAD');
      case 'INCREASE': {
        const parts: string[] = [];
        const now = this.isSingleMachine ? p.currentChannels : p.currentChannelsPerMachine;
        if (p.suggestedChannelsPerMachine > Math.round(p.currentChannelsPerMachine)) {
          parts.push(this.t(this.isSingleMachine ? 'why_addSlotsOne' : 'why_addSlots', { a: now, b: p.suggestedChannelsPerMachine }));
        }
        if (p.daysToEmpty !== null && p.daysToEmpty < LOW_COVER_DAYS) {
          parts.push(this.t('why_lowStock', { d: p.daysToEmpty }));
        }
        return parts.length ? this.t('why_INCREASE', { parts: parts.join('; ') }) : p.reason;
      }
      case 'REVIEW':
        return this.t('why_REVIEW');
      default:
        return this.t(p.abc === 'A' ? 'why_KEEP_A' : 'why_KEEP');
    }
  }

  get isSingleMachine() {
    return this.selectedIds.length === 1;
  }

  // ---- labels ---------------------------------------------------------------------------------

  machine(id: string): MachineRef {
    return this.catalogMap.get(id) || { machineId: id, ownerUuid: '' };
  }

  /** what people call the machine: its location, falling back to the machine ID */
  machineName(id: string) {
    return this.machine(id).location || id;
  }

  shopLabel(shopPhone: string) {
    return shopPhone || this.t('noShopPhone');
  }

  get scopeLabel() {
    return this.t(this.scope === 'global' ? 'allMachines' : 'allMyMachines');
  }

  /** e.g. "Shop 2055… · 3 machines" — used in the header and the printout */
  get selectionTitle() {
    const parts: string[] = [];
    if (this.shop !== null) parts.push(this.t('shopTitle', { phone: this.shopLabel(this.shop) }));
    if (this.selectedIds.length === 1) {
      parts.push(this.machineName(this.selectedIds[0]));
    } else if (this.selectedIds.length > 1) {
      parts.push(this.t('nMachines', { n: this.selectedIds.length }));
    } else if (!parts.length) {
      parts.push(this.scopeLabel);
    } else {
      parts.push(this.t('allMachines'));
    }
    return parts.join(' · ');
  }

  get shopButtonLabel() {
    if (this.shop === null) return this.t('allShops', { n: this.shops.length });
    const s = this.shops.find(x => x.shopPhone === this.shop);
    return this.shopLabel(this.shop) + (s ? ' · ' + this.t('nMachines', { n: s.count }) : '');
  }

  get machineButtonLabel() {
    if (!this.selectedIds.length) return this.t('allMachinesN', { n: this.shopCatalog.length });
    if (this.selectedIds.length <= 2) return this.selectedIds.map(id => this.machineName(id)).join(', ');
    return this.t('nMore', { name: this.machineName(this.selectedIds[0]), n: this.selectedIds.length - 1 });
  }

  /** machines the machine dropdown offers: only the chosen shop's when a shop is picked */
  private refreshShopCatalog() {
    this.shopCatalog = this.shop === null ? this.catalog : this.catalog.filter(m => (m.shopPhone || '') === this.shop);
  }

  // ---- filters --------------------------------------------------------------------------------

  setPeriod(p: Period) {
    this.period = p;
    if (p === 'custom') return;
    const days = p === 'today' ? 1 : Number(p);
    this.toDate = moment().format('YYYY-MM-DD');
    this.fromDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
    this.load();
  }

  changeScope() {
    this.selectedIds = [];
    this.shop = null;
    this.catalog = [];
    this.shops = [];
    this.shopCatalog = [];
    this.filteredShops = [];
    this.catalogFromList = false;
    this.actionFilter = 'ALL';
    this.loadCatalog();
    this.load();
  }

  // ---- shop dropdown --------------------------------------------------------------------------

  toggleDropdown(which: 'shop' | 'machine') {
    if (this.dropdown === which) {
      this.dropdown = null;
      return;
    }
    this.dropdown = which;
    if (which === 'shop') this.setShopSearch('');
    if (which === 'machine') {
      this.pickerDraft = new Set(this.selectedIds);
      this.setPickerSearch('');
    }
    setTimeout(() => (document.querySelector('.dd-panel input') as HTMLInputElement | null)?.focus());
  }

  setShopSearch(term: string) {
    this.shopSearch = term;
    const q = term.trim().toLowerCase();
    this.filteredShops = this.shops.filter(s => !q ||
      [s.shopPhone, ...s.locations].some(v => String(v || '').toLowerCase().includes(q)));
  }

  /** pick a shop: show all of its machines */
  selectShop(shopPhone: string | null) {
    this.dropdown = null;
    this.shop = shopPhone;
    this.selectedIds = [];
    this.actionFilter = 'ALL';
    this.refreshShopCatalog();
    this.load();
  }

  /** drill into one machine (from a machine row or a slot group) */
  selectMachine(machineId: string) {
    this.selectedIds = machineId ? [machineId] : [];
    this.view = 'products';
    this.actionFilter = 'ALL';
    this.load();
  }

  removeMachine(machineId: string) {
    this.selectedIds = this.selectedIds.filter(id => id !== machineId);
    this.load();
  }

  clearMachines() {
    this.selectedIds = [];
    this.load();
  }

  clearShop() {
    this.selectShop(null);
  }

  setActionFilter(a: ProductAction | 'ALL') {
    this.actionFilter = a;
    this.refreshView();
  }

  setSearch(term: string) {
    this.search = term;
    this.refreshView();
  }

  setChannelSort(sort: 'slot' | 'qty') {
    this.channelSort = sort;
    this.refreshView();
  }

  showAction(a: ProductAction | 'ALL') {
    this.setActionFilter(a);
    this.view = 'products';
    setTimeout(() => document.getElementById('psr-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // ---- machine dropdown -----------------------------------------------------------------------

  /** machines matching the search (location or machine ID), grouped by shop when no shop is picked */
  setPickerSearch(term: string) {
    this.pickerSearch = term;
    const q = term.trim().toLowerCase();
    const list = this.shopCatalog.filter(m => !q ||
      [m.location, m.machineId, m.shopPhone].some(v => String(v || '').toLowerCase().includes(q)));
    const groups = new Map<string, MachineRef[]>();
    for (const m of list) {
      const key = this.shop === null ? (m.shopPhone || '') : this.shop;
      const arr = groups.get(key) || [];
      arr.push(m);
      groups.set(key, arr);
    }
    this.pickerGroups = Array.from(groups.entries())
      .map(([shopPhone, machines]) => ({
        shopPhone,
        machines: machines.sort((a, b) => (a.location || a.machineId).localeCompare(b.location || b.machineId)),
      }))
      .sort((a, b) => (a.shopPhone ? 0 : 1) - (b.shopPhone ? 0 : 1) || a.shopPhone.localeCompare(b.shopPhone));
  }

  toggleDraft(id: string) {
    this.pickerDraft.has(id) ? this.pickerDraft.delete(id) : this.pickerDraft.add(id);
  }

  groupState(machines: MachineRef[]): 'all' | 'some' | 'none' {
    const n = machines.filter(m => this.pickerDraft.has(m.machineId)).length;
    return n === 0 ? 'none' : n === machines.length ? 'all' : 'some';
  }

  toggleGroup(machines: MachineRef[]) {
    const select = this.groupState(machines) !== 'all';
    machines.forEach(m => select ? this.pickerDraft.add(m.machineId) : this.pickerDraft.delete(m.machineId));
  }

  selectAllShown() {
    this.pickerGroups.forEach(g => g.machines.forEach(m => this.pickerDraft.add(m.machineId)));
  }

  applyPicker() {
    this.dropdown = null;
    // picking every machine is the same as "all", which keeps the request small
    const ids = Array.from(this.pickerDraft);
    this.selectedIds = ids.length === this.shopCatalog.length ? [] : ids;
    this.actionFilter = 'ALL';
    this.load();
  }

  // ---- data -----------------------------------------------------------------------------------

  load() {
    this.loading = true;
    this.errorMessage = '';
    const body: any = { fromDate: this.fromDate, toDate: this.toDate, machineIds: this.selectedIds };
    if (this.shop !== null) body.shopPhones = [this.shop];
    const req = this.scope === 'global'
      ? this.apiService.loadGlobalProductSalesAnalytics(body)
      : this.apiService.loadProductSalesAnalytics(body);

    req.subscribe({
      next: (r) => {
        this.loading = false;
        if (!r?.status) {
          this.errorMessage = typeof r?.message === 'string' ? r.message : this.t('loadFailed');
          this.result = null;
          return;
        }
        this.result = r.data;
        // the dashboard list wins; the analytics response is only a fallback
        if (!this.catalogFromList && Array.isArray(r.data?.catalog)) this.setCatalog(r.data.catalog);
        this.catalogMissing = !Array.isArray(r.data?.catalog);
        this.ranks = new Map(this.sortOptions.map(o => [o.key, new Map(
          this.sorted(r.data?.products || [], o.key, true).map((p: any, i: number) => [p.productKey, i + 1] as [string, number])
        )]));
        this.machineRanks = new Map(this.sortOptions.map(o => [o.key, new Map(
          this.sorted(r.data?.machines || [], o.key, true).map((m: any, i: number) => [m.machineId, i + 1] as [string, number])
        )]));
        if ((this.view === 'channels' && !r.data?.channels?.length) ||
            (this.view === 'machines' && this.isSingleMachine)) {
          this.view = 'products';
        }
        this.productLimit = this.machineLimit = this.pageSize;
        this.channelGroupLimit = 20;
        this.refreshView();
      },
      error: (err) => {
        this.loading = false;
        this.result = null;
        this.errorMessage = err?.message || this.t('loadFailed');
        this.refreshView();
      },
    });
  }

  /**
   * Machine list for the shop / machine dropdowns, fetched and mapped exactly like the
   * Vending Machine Dashboard (onlinemachines): getAllMachines for superadmin, listMachine for an owner.
   */
  private loadCatalog() {
    const scope = this.scope;
    const req = scope === 'global' ? this.apiService.getAllMachinesForAdmin() : this.apiService.listMachine('all');
    req.subscribe({
      next: (r: any) => {
        if (scope !== this.scope || !r?.status || !Array.isArray(r.data)) return;
        const list = (r.data as any[]).map(m => this.mapMachine(m)).filter(m => m.machineId);
        list.sort((a, b) => a.machineId.localeCompare(b.machineId));
        this.catalogFromList = true;
        this.setCatalog(list);
      },
      error: (err) => console.error('[productSalesRanking] machine list failed', err),
    });
  }

  /** same field mapping as onlinemachines.page.ts (machine.data[0]) */
  private mapMachine(machine: any): MachineRef {
    const d = Array.isArray(machine?.data) ? machine.data[0] : machine?.data;
    const str = (v: any) => (v != null && String(v).trim() !== '' ? String(v).trim() : '');
    return {
      machineId: machine?.machineId || '',
      ownerUuid: machine?.ownerUuid || '',
      location: str(d?.location),
      shopPhone: str(d?.shopPhone),
      ownerPhone: str(d?.ownerPhone),
    };
  }

  private setCatalog(catalog: MachineRef[]) {
    this.catalog = catalog;
    this.catalogMap = new Map(catalog.map(m => [m.machineId, m]));
    const shops = new Map<string, ShopRef>();
    for (const m of catalog) {
      const key = m.shopPhone || '';
      const sh = shops.get(key) || { shopPhone: key, count: 0, locations: [] };
      sh.count += 1;
      if (m.location && !sh.locations.includes(m.location)) sh.locations.push(m.location);
      shops.set(key, sh);
    }
    // shops with a phone first, "no shop phone" last
    this.shops = Array.from(shops.values())
      .sort((a, b) => (a.shopPhone ? 0 : 1) - (b.shopPhone ? 0 : 1) || a.shopPhone.localeCompare(b.shopPhone));
    this.refreshShopCatalog();
    this.setShopSearch(this.shopSearch);
  }

  rebuild() {
    if (!confirm(this.t('rebuildConfirm', { from: this.fromDate, to: this.toDate }))) return;
    this.apiService.rebuildProductSalesRollup({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (r) => alert(r?.status ? this.t('rebuildStarted') : this.t('rebuildFailed', { msg: r?.message || '' })),
      error: (err) => alert(this.t('rebuildFailed', { msg: err?.message || err })),
    });
  }

  // ---- view models ----------------------------------------------------------------------------

  /** rebuilds every list the template shows; call after data, filter, sort or language changes */
  refreshView() {
    const r = this.result;
    const all: any[] = r?.products || [];
    const q = this.search.trim().toLowerCase();
    for (const p of all) p._reason = this.reasonText(p);

    this.products = this.sorted(all.filter(p =>
      (this.actionFilter === 'ALL' || p.action === this.actionFilter) &&
      (!q || String(p.productName || '').toLowerCase().includes(q))
    ), this.sortBy, this.sortDesc);
    this.machines = this.sorted(r?.machines || [], this.sortBy, this.sortDesc);

    const groups = new Map<string, any[]>();
    for (const c of r?.channels || []) {
      const arr = groups.get(c.machineId) || [];
      arr.push(c);
      groups.set(c.machineId, arr);
    }
    this.channelGroups = Array.from(groups.entries()).map(([machineId, channels]) => ({
      machineId,
      channels: channels.sort((a, b) =>
        this.channelSort === 'slot' ? a.position - b.position : b.qty - a.qty || a.position - b.position),
    }));

    this.maxProductQty = all.reduce((m, p) => Math.max(m, p.qty), 0);
    this.maxChannelQty = (r?.channels || []).reduce((m: number, c: any) => Math.max(m, c.qty), 0);
    this.maxMachineAmount = (r?.machines || []).reduce((m: number, x: any) => Math.max(m, x.amount), 0);

    this.todoProducts = {} as Record<ProductAction, any[]>;
    for (const p of all) (this.todoProducts[p.action as ProductAction] ||= []).push(p);
  }

  get visibleProducts() {
    return this.products.length > this.productLimit ? this.products.slice(0, this.productLimit) : this.products;
  }

  get visibleMachines() {
    return this.machines.length > this.machineLimit ? this.machines.slice(0, this.machineLimit) : this.machines;
  }

  get visibleChannelGroups() {
    return this.channelGroups.length > this.channelGroupLimit ? this.channelGroups.slice(0, this.channelGroupLimit) : this.channelGroups;
  }

  setSort(key: SortKey) {
    if (this.sortBy === key) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortBy = key;
      this.sortDesc = true;
    }
    this.refreshView();
  }

  /**
   * Qty/day: with one machine every row shares the same period, so it ranks like Qty.
   * Across machines it is items per day per machine selling it, so a product that is only
   * in a few machines is compared fairly with one that is in all of them.
   */
  rate(row: any): number {
    const days = this.result?.days || 1;
    const machines = this.isSingleMachine || row.machineId ? 1 : Math.max(1, row.machinesSold || 0);
    return row.qty / days / machines;
  }

  private sortValue(row: any, key: SortKey): number {
    return key === 'rate' ? this.rate(row) : Number(row[key]) || 0;
  }

  private sorted(rows: any[], key: SortKey, desc: boolean): any[] {
    const dir = desc ? -1 : 1;
    return [...rows].sort((a, b) =>
      dir * (this.sortValue(a, key) - this.sortValue(b, key)) ||
      dir * ((Number(a.amount) || 0) - (Number(b.amount) || 0)) ||
      String(a.productName || a.machineId).localeCompare(String(b.productName || b.machineId)));
  }

  /** rank under the selected sort key (1 = best), independent of direction and filters */
  rankOf(p: any) {
    return this.ranks.get(this.sortBy)?.get(p.productKey) ?? p.rank;
  }

  rankOfMachine(m: any) {
    return this.machineRanks.get(this.sortBy)?.get(m.machineId) ?? m.rank;
  }

  productsFor(a: ProductAction): any[] {
    return this.todoProducts[a] || [];
  }

  pct(value: number, max: number) {
    return max > 0 ? Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100)) + '%' : '0%';
  }

  stockPct(c: any) {
    return c.max > 0 ? Math.min(100, Math.round((c.stock / c.max) * 100)) + '%' : '0%';
  }

  otherNames(c: any) {
    return (c.products || []).slice(1, 3).map((x: any) => x.productName).join(', ');
  }

  medal(rank: number) {
    return rank >= 1 && rank <= 3 ? 'medal-' + rank : '';
  }

  trackByKey(_: number, p: any) {
    return p.productKey;
  }

  trackByMachine(_: number, m: any) {
    return m.machineId;
  }

  trackByChannel(_: number, c: any) {
    return c.machineId + '|' + c.position;
  }

  // ---- export ---------------------------------------------------------------------------------

  exportCsv() {
    const rows = this.products;
    if (!rows.length) return;
    const header = [this.t('colRank'), this.t('colProduct'), this.t('colPrice'), this.t('qty'), this.t('amount'), this.t('colPctAmount'),
      this.t('sortRate'), 'ABC', this.t('colMachinesSold'), this.t('colSlotsSuggest'), this.t('colStock'), this.t('colDaysLeft'),
      this.t('colAdvice'), this.t('colReason')];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(p => [this.rankOf(p), p.productName, p.price, p.qty, p.amount, p.amountShare, this.rate(p).toFixed(2), p.abc,
      p.machinesSold, `${this.isSingleMachine ? p.currentChannels : p.currentChannelsPerMachine} → ${p.suggestedChannelsPerMachine}`,
      p.currentStock, p.daysToEmpty ?? '', this.actionInfo[p.action as ProductAction]?.title || p.action, this.reasonText(p)].map(esc).join(','));
    const blob = new Blob(['﻿' + [header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `product-ranking_${this.fileSlug}_${this.fromDate}_${this.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private get fileSlug() {
    return this.selectionTitle.replace(/[^\w\u0E80-\u0EFF]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || this.scope;
  }

  // ---- print ----------------------------------------------------------------------------------

  /** Opens a clean, print-ready report of what is on screen (owner / machines / period / filters). */
  printReport() {
    if (!this.result) return;
    const r = this.result;
    const esc = (v: any) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
    const n = (v: any, d = 0) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });

    const machineIds: string[] = (r.machines || []).map((m: any) => m.machineId);
    const machineList = machineIds.map(id => {
      const m = this.machine(id);
      return esc(m.location ? `${m.location} (${id})` : id);
    }).join(', ');

    const filterNote = this.actionFilter === 'ALL' ? '' : this.t('onlyX', { x: this.actionInfo[this.actionFilter].title });
    const sortNote = this.sortLabel(this.sortBy) + ' ' + this.t(this.sortDesc ? 'highLow' : 'lowHigh');

    const productRows = this.products.map(p => `
      <tr>
        <td class="c">${this.rankOf(p)}</td>
        <td>${esc(p.productName)}</td>
        <td class="r">${n(p.qty)}</td>
        <td class="r">${n(p.amount)}</td>
        <td class="r">${n(p.amountShare, 1)}%</td>
        <td class="r">${n(this.rate(p), 2)}</td>
        <td class="r">${this.isSingleMachine ? p.currentChannels : p.currentChannelsPerMachine}${p.suggestedChannelsPerMachine ? ' → ' + p.suggestedChannelsPerMachine : ''}</td>
        <td class="r">${p.currentStock}${p.daysToEmpty !== null ? ' / ' + p.daysToEmpty + ' d' : ''}</td>
        <td><b>${esc(this.actionInfo[p.action as ProductAction]?.label)}</b><br><small>${esc(this.reasonText(p))}</small></td>
      </tr>`).join('');

    const machineRows = machineIds.length > 1 ? this.machines.map(m => `
      <tr>
        <td class="c">${this.rankOfMachine(m)}</td>
        <td>${esc(m.location || '—')}</td>
        <td>${esc(m.machineId)}</td>
        <td>${esc(m.shopPhone || '')}</td>
        <td class="r">${n(m.amount)}</td>
        <td class="r">${n(m.amountShare, 1)}%</td>
        <td class="r">${n(m.qty)}</td>
        <td class="r">${n(this.rate(m), 1)}</td>
        <td>${esc(m.topProductName || '—')}</td>
      </tr>`).join('') : '';

    const html = `<!doctype html><html lang="${this.lang}"><head><meta charset="utf-8">
<title>${esc(this.t('reportTitle'))} – ${esc(this.selectionTitle)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Lao", "Phetsarath OT", sans-serif; color: #1f2328; margin: 24px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #a41d4f; }
  h2 { font-size: 14px; margin: 22px 0 8px; }
  .meta { color: #59636e; margin: 2px 0; }
  .kpis { display: flex; gap: 10px; margin: 14px 0; }
  .kpi { flex: 1; border: 1px solid #e6e8eb; border-radius: 8px; padding: 8px 10px; }
  .kpi span { display: block; color: #59636e; font-size: 11px; }
  .kpi b { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #e6e8eb; padding: 5px 6px; text-align: left; vertical-align: top; }
  th { background: #f5f6f7; font-size: 11px; }
  td small { color: #59636e; }
  .r { text-align: right; white-space: nowrap; } .c { text-align: center; }
  tr { page-break-inside: avoid; }
  @page { size: A4 landscape; margin: 12mm; }
</style></head><body>
  <h1>${esc(this.t('reportTitle'))}</h1>
  <p class="meta"><b>${esc(this.selectionTitle)}</b></p>
  <p class="meta">${esc(r.fromDate)} → ${esc(r.toDate)} (${esc(this.t('nDaysShort', { n: r.days }))}) · ${esc(this.t('printed', { time: moment().format('YYYY-MM-DD HH:mm') }))}</p>
  <p class="meta">${this.t('machinesList', { n: machineIds.length, list: machineList || '—' })}</p>
  <div class="kpis">
    <div class="kpi"><span>${esc(this.t('amount'))}</span><b>${n(r.totals.amount)}</b></div>
    <div class="kpi"><span>${esc(this.t('qty'))}</span><b>${n(r.totals.qty)}</b></div>
    <div class="kpi"><span>${esc(this.t('bills'))}</span><b>${n(r.totals.billCount)}</b></div>
    <div class="kpi"><span>${esc(this.t('productsSoldLoaded'))}</span><b>${r.totals.productsSold} / ${r.totals.productsLoaded}</b></div>
    ${this.todoActions.map(a => `<div class="kpi"><span>${esc(this.actionInfo[a].title)}</span><b>${r.actionCounts[a]}</b></div>`).join('')}
  </div>
  <h2>${esc(this.t('productsSorted', { x: sortNote }))}${esc(filterNote)}</h2>
  <table>
    <thead><tr><th class="c">#</th><th>${esc(this.t('colProduct'))}</th><th class="r">${esc(this.t('qty'))}</th>
      <th class="r">${esc(this.t('amount'))}</th><th class="r">${esc(this.t('colPctAmount'))}</th><th class="r">${esc(this.t('sortRate'))}</th>
      <th class="r">${esc(this.t('colSlotsSuggest'))}</th><th class="r">${esc(this.t('colStockDays'))}</th><th>${esc(this.t('colAdvice'))}</th></tr></thead>
    <tbody>${productRows || `<tr><td colspan="9">${esc(this.t('noProductsShort'))}</td></tr>`}</tbody>
  </table>
  ${machineRows ? `<h2>${esc(this.t('machines'))}</h2>
  <table>
    <thead><tr><th class="c">#</th><th>${esc(this.t('colLocation'))}</th><th>${esc(this.t('colMachineId'))}</th>
      <th>${esc(this.t('shopPhone'))}</th>
      <th class="r">${esc(this.t('amount'))}</th><th class="r">${esc(this.t('colPctAmount'))}</th><th class="r">${esc(this.t('qty'))}</th>
      <th class="r">${esc(this.t('sortRate'))}</th><th>${esc(this.t('colBest'))}</th></tr></thead>
    <tbody>${machineRows}</tbody>
  </table>` : ''}
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 200); };</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert(this.t('popupBlocked'));
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
