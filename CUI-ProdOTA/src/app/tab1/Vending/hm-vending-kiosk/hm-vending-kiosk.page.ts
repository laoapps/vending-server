import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { IMachineId, IVendingMachineSale } from 'src/app/services/syste.model';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { BlockchainDbService } from 'src/app/blockchain-db';
import { CachingService } from 'src/app/services/caching.service';
import { IdleService } from 'src/app/services/idle.service';
import { WsapiService } from 'src/app/services/wsapi.service';
import { SettingPage } from 'src/app/setting/setting.page';
import { QrconfigMachinePage } from 'src/app/qrconfig-machine/qrconfig-machine.page';
import { environment } from 'src/environments/environment';
import { downloadPhotoUrl } from '../../../filemanager-url';


@Component({
  selector: 'app-hm-vending-kiosk',
  templateUrl: './hm-vending-kiosk.page.html',
  styleUrls: ['./hm-vending-kiosk.page.scss'],
})
export class HmVendingKioskPage implements OnInit, OnDestroy {
  hmLogo = 'assets/icon/logo.png';
  contact = localStorage.getItem('contact') || '55516321';
  filemanagerURL = (environment as any).filemanagerurl || '';
  url = environment.url;

  machineId = {} as IMachineId;
  saleList: IVendingMachineSale[] = [];
  orders: IVendingMachineSale[] = [];
  getTotalSale = { q: 0, t: 0 };
  currentBalance = { value: 0, currency: 'LAK' };
  isShowLaabTabEnabled = false;
  compensation = 0;
  _machineStatus: { status?: { temp?: string | number } } = { status: {} };
  serial: any = null;

  private tapCount = 6;
  private tapTimer: any = null;
  private loginSub: Subscription | null = null;
  private aliveSub: Subscription | null = null;
  lastUpdate = Date.now();

  constructor(
    private ref: ChangeDetectorRef,
    public apiService: ApiService,
    public platform: Platform,
    public modal: ModalController,
    public storage: IonicStorageService,
    public appCaching: CachingService,
    public blockchainDbService: BlockchainDbService,
    private idleService: IdleService,
    private WSAPIService: WsapiService,
  ) {
    this.machineId = this.apiService.machineId;
  }

  ngOnInit(): void {
    // Dock still calls apiService.myTab1.* — this PAGE is the host, not Tab1.
    this.apiService.myTab1 = this as any;
    this.bindWebsocket();
    this.saleList = ApiService.vendingOnSale || [];
    this.localLoad();
    this.loadStock();
    this.loadBalance();
    this.loadPhotos();
    this.connect();
  }

  ngOnDestroy(): void {
    if (this.tapTimer) clearTimeout(this.tapTimer);
    this.loginSub?.unsubscribe();
    this.aliveSub?.unsubscribe();
  }

  /** Subscribe only. AppComponent already owns connect/ping. Do not reconnect if OPEN. */
  private bindWebsocket(): void {
    const wsapi: any = this.apiService.wsapi || this.WSAPIService;

    this.loginSub = wsapi?.loginSubscription?.subscribe((rxx: any) => {
      if (!rxx) return;
      const data = rxx.data?.data || rxx.data || rxx;
      const clientId = data?.clientId || rxx.clientId;
      if (clientId && this.apiService.clientId) {
        this.apiService.clientId.clientId = clientId;
      }
      if (this.apiService.wsAlive) {
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = true;
      }
      this.loadStock();
      this.ref.detectChanges();
    });

    this.aliveSub = this.WSAPIService.aliveSubscription?.subscribe((res: any) => {
      this.lastUpdate = Date.now();
      if (this.apiService.wsAlive) {
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = true;
      }
      const r = res?.data?.setting;
      if (r?.refresh) this.apiService.reloadPage?.();
      if (r?.checkoutUiVersion != null && r?.checkoutUiVersion !== '') {
        this.apiService.applyRemoteCheckoutUiVersionAndReload(r.checkoutUiVersion);
      }
    });

    const socket: WebSocket | undefined =
      wsapi?.socket || wsapi?.ws || this.WSAPIService?.webSocket || (this.WSAPIService as any)?.ws;
    const open = socket?.readyState === WebSocket.OPEN || this.apiService.wsAlive?.isAlive;
    if (open) {
      return; // already logged in — ping is owned by wsapi.service.ts
    }
    try {
      if (typeof this.WSAPIService.reconnect === 'function') this.WSAPIService.reconnect();
      else if (typeof wsapi?.reconnect === 'function') wsapi.reconnect();
    } catch (e) {
      console.warn('WS reconnect', e);
    }
  }

  get filteredSaleList(): IVendingMachineSale[] {
    return this.saleList.filter(
      (sl) => sl.stock.qtty - this.checkCartCount(sl.position) > 0,
    );
  }

  trackByPosition(_i: number, sl: IVendingMachineSale) {
    return sl?.position;
  }

  checkCartCount(position: number): number {
    return this.orders.filter((o) => o.position == position).length;
  }

  addOrder(sl: IVendingMachineSale): void {
    try {
      this.idleService?.closeAds?.();
    } catch {}
    if (!sl?.stock || sl.stock.price == 0) return;
    if (this.checkCartCount(sl.position) >= sl.stock.qtty) return;
    if (this.getTotalSale.q >= 10) return;

    const line = JSON.parse(JSON.stringify(sl)) as IVendingMachineSale;
    line.stock.qtty = 1;
    this.orders = [...this.orders, line];
    this.recalcTotals();
    this.localSave();
    this.ref.detectChanges();
  }

  removeCart(index: number): void {
    if (index < 0 || index >= this.orders.length) return;
    this.orders = this.orders.filter((_, i) => i !== index);
    this.recalcTotals();
    this.localSave();
    this.ref.detectChanges();
  }

  clearCart(): void {
    this.orders = [];
    this.getTotalSale = { q: 0, t: 0 };
    this.localSave();
    this.ref.detectChanges();
  }

  recalcTotals(): void {
    this.getTotalSale = {
      q: this.orders.reduce((a, b) => a + (b.stock?.qtty || 1), 0),
      t: this.orders.reduce(
        (a, b) => a + (b.stock?.qtty || 1) * (b.stock?.price || 0),
        0,
      ),
    };
  }

  localSave(): void {
    try {
      localStorage.setItem('vendingPendingOrders', JSON.stringify(this.orders));
      localStorage.setItem('vendingPendingSum', JSON.stringify(this.getTotalSale));
    } catch {}
  }

  localLoad(): { orders: IVendingMachineSale[]; sum: { q: number; t: number } } {
    try {
      const orders = JSON.parse(localStorage.getItem('vendingPendingOrders') || '[]');
      const sum = JSON.parse(localStorage.getItem('vendingPendingSum') || '{"q":0,"t":0}');
      this.orders = Array.isArray(orders) ? [...orders] : [];
      this.getTotalSale = { q: sum?.q || 0, t: sum?.t || 0 };
      this.recalcTotals();
    } catch {
      this.orders = [];
      this.getTotalSale = { q: 0, t: 0 };
    }
    this.ref.detectChanges();
    return { orders: this.orders, sum: this.getTotalSale };
  }

  loadStock(): void {
    this.storage.get('saleStock', 'stock').then((s) => {
      try {
        const items = JSON.parse(JSON.stringify(s?.v ? s.v : ApiService.vendingOnSale || []));
        this.saleList = items;
        this.ref.detectChanges();
      } catch {}
    });
  }

  photoOf(sl: any, size = 256): string {
    const id = sl?.stock?.image;
    if (!id) return this.hmLogo;
    const cached = this.apiService?.imageList?.[id];
    if (typeof cached === 'string' && cached.startsWith('data:image')) return cached;
    if (typeof cached === 'string' && cached.startsWith('http')) return cached;
    return downloadPhotoUrl(id, size, size) || this.hmLogo;
  }

  onPhotoError(ev: Event, sl: any): void {
    const img = ev.target as HTMLImageElement;
    if (!img) return;
    const id = sl?.stock?.image;
    if (id && img.dataset['step'] !== '1') {
      img.dataset['step'] = '1';
      img.src = downloadPhotoUrl(id, 64, 64);
    }
  }

  async loadPhotos(): Promise<void> {
    if (!this.apiService.imageList) this.apiService.imageList = {};
    for (const sl of this.saleList || []) {
      const id = sl?.stock?.image;
      if (!id) continue;
      const cur = this.apiService.imageList[id];
      if (typeof cur === 'string' && (cur.startsWith('data:image') || cur.startsWith('http'))) {
        continue;
      }
      this.apiService.imageList[id] = downloadPhotoUrl(id, 256, 256);
    }
    this.ref.detectChanges();
  }

  async loadBalance(): Promise<void> {
    try {
      const id = this.machineId?.machineId;
      if (!id) return;
      this.currentBalance.value = await this.blockchainDbService.getLocalBalance(id);
      this.currentBalance.currency = localStorage.getItem('currency') || 'LAK';
    } catch {
      this.currentBalance.value = 0;
    }
  }

  handleRefresh(ev?: any): void {
    this.loadStock();
    this.localLoad();
    this.loadBalance();
    this.loadPhotos();
    setTimeout(() => ev?.target?.complete?.(), 600);
  }

  focusShelf(): void {
    document.getElementById('shelf')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCheckoutPaid(_bill: any): void {
    this.clearCart();
  }

  showSetting(): void {
    this.armTap(6, () => {
      this.apiService.showModal(SettingPage).then((r) => r?.present());
    });
  }

  showQrConfig(): void {
    this.armTap(6, () => {
      this.apiService.showModal(QrconfigMachinePage).then((r) => r?.present());
    });
  }

  private armTap(resetTo: number, action: () => void): void {
    if (!this.tapTimer) {
      this.tapTimer = setTimeout(() => {
        this.tapCount = resetTo;
        this.tapTimer = null;
      }, 1500);
    }
    if (--this.tapCount <= 0) {
      this.tapCount = resetTo;
      if (this.tapTimer) {
        clearTimeout(this.tapTimer);
        this.tapTimer = null;
      }
      action();
    }
  }

  topUpEwallet(): void {}
  openTestMotor(): void {}

  /** Host API the dock still calls via apiService.myTab1 */

  clearStockAfterLAABGo(): void {
    this.clearCart();
    this.loadStock();
  }

  refreshBalanceFromAnotherModal(n: number): void {
    this.currentBalance.value = Number(n) || 0;
    this.apiService.localBalance = this.currentBalance.value;
    this.ref.detectChanges();
  }

  async connect(): Promise<void> {
    try {
      this.serial = this.apiService.serialPort || this.serial;
    } catch {}
  }

  async loadPaidBills(): Promise<void> {
    // copy body from Tab1.loadPaidBills if remaining-drop modal is needed
  }

  async _processLoopCheckLaoQRPaid(): Promise<void> {
    // dock already polls QR; keep for old call sites
  }
}