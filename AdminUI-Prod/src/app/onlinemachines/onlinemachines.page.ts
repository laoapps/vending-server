import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';
import { LogTempPage } from '../log-temp/log-temp.page';
import { MyaccountPage } from '../myaccount/myaccount.page';
import { MachinePage } from '../machine/machine.page';
import { ProductsPage } from '../products/products.page';
import { SalePage } from '../sale/sale.page';
import { EpinAdminPage } from '../epin-admin/epin-admin.page';
import { FindMyEpinPage } from '../find-my-epin/find-my-epin.page';
import { AdvertisementPage } from '../superadmin/advertisement/advertisement.page';
import { VersionControlPage } from '../version-control/version-control.page';
import { ImagesproductPage } from '../imagesproduct/imagesproduct.page';
import { SettingsModalPage } from '../settings-modal/settings-modal/settings-modal.page';
import { BillingPage } from '../billing/billing.page';
import { ReportClientPage } from '../report-client/report-client.page';
import { BillnotPaidPage } from '../billnot-paid/billnot-paid.page';
import { SaleReportPage } from '../sale/sale-report/sale-report.page';
import { StockReportPage } from '../sale/stock-report/stock-report.page';
import { IonContent, ModalController } from '@ionic/angular';
import { ReportCallbacklogPage } from '../report-callbacklog/report-callbacklog.page';
import { PaidOrdersModalComponent } from '../modals/paid-orders-modal/paid-orders-modal.component';
import { PickLocationModalComponent } from '../modals/pick-location-modal/pick-location-modal.component';
import { TicketListPage } from '../ticket-list/ticket-list.page';
import { SettingConfigPage } from '../setting-config/setting-config.page';
import { CompareExcelPage } from '../compare-excel/compare-excel.page';

interface MachineData {
  machineId: string;
  owner: string;
  temperature?: number;
  status: 'Online' | 'Broken';
  lastUpdate?: string;
  lastOnline?: string | null;
  versionId: string;
  device: string;
  data: string;
  otp: string;
  settings: any;
  showSecrets?: boolean;
  ownerUuid: string;
  imei?: string;
  createdAt?: string;
  location?: string;
  shopPhone?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  savingLocation?: boolean;
}

interface OwnerGroup {
  owner: string;
  location:string;
  machines: MachineData[];
  onlineCount: number;
  offlineCount: number;
  lastOnline: string | null;
  expanded: boolean;
}

@Component({
  selector: 'app-onlinemachines',
  templateUrl: './onlinemachines.page.html',
  styleUrls: ['./onlinemachines.page.scss'],
})
export class OnlinemachinesPage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  onlineMachines: MachineData[] = [];
  brokenMachines: MachineData[] = [];
  ownerGroups: OwnerGroup[] = [];

  totalCount = 0;
  onlineCount = 0;
  offlineCount = 0;

  viewMode: 'owners' | 'cards' = 'owners';

  private allMachinesUrl = `${environment.url}/getAllMachines`;
  private onlineMachinesUrl = `${environment.url}/getOnlineMachines`;
  private intervalId!: NodeJS.Timeout;
  private lastOnlineCache = new Map<string, string>();
  private expandedOwners = new Set<string>();

  showAllSecrets = true;
  isRefreshing = false;
  flashClass = '';

  constructor(public apiService: ApiService, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.loadData();
    this.intervalId = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  trackByMachine(_index: number, item: MachineData): string {
    return item.machineId;
  }

  trackByOwner(_index: number, item: OwnerGroup): string {
    return item.owner;
  }

  setViewMode(event: Event) {
    const customEvent = event as CustomEvent;
    const mode = customEvent?.detail?.value;
    if (mode === 'owners' || mode === 'cards') {
      this.viewMode = mode;
    }
  }

  toggleOwner(owner: string) {
    if (this.expandedOwners.has(owner)) {
      this.expandedOwners.delete(owner);
    } else {
      this.expandedOwners.add(owner);
    }
    this.ownerGroups = this.ownerGroups.map(g => ({
      ...g,
      expanded: this.expandedOwners.has(g.owner),
    }));
  }

  async refreshData() {
    this.isRefreshing = true;
    await this.loadData();
    this.triggerFlash();
    this.scrollToTop();
    setTimeout(() => this.isRefreshing = false, 600);
  }

  async testGenerateQR() {
    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = '';
      const secret = localStorage.getItem('secretLocal');
      await axios.post(`${environment.url}/testGenerateQR`, {
        secret,
        shopPhonenumber,
        token,
      }).then(r => {
        if (r?.data?.status === 1) {
          this.apiService.alertSuccess('ສ້າງ QR ສຳເຫຼັດ');
        } else {
          this.apiService.alertError(`ສ້າງ QR ບໍ່ສຳເຫຼັດ :${JSON.stringify(r?.data?.data)}`);
        }
      }).catch(err => {
        this.apiService.alertError(err);
      });
    } catch (error) {

    }
  }

  private async loadData() {
    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = '';
      const secret = localStorage.getItem('secretLocal');
      const payload = { secret, shopPhonenumber, token };

      const [allRes, onlineRes] = await Promise.all([
        axios.post(this.allMachinesUrl, payload),
        axios.post(this.onlineMachinesUrl, payload),
      ]);

      const onlineMap = new Map<string, any>();
      onlineRes.data.data
        ?.filter((item: any) => item?.machine)
        .forEach((item: any) => onlineMap.set(item.machine.machineId, item));

      const now = new Date();
      const machines: MachineData[] = [];

      allRes.data.data.forEach((machine: any) => {
        const onlineData = onlineMap.get(machine.machineId);
        let status: 'Online' | 'Broken' = 'Broken';
        let lastUpdate: string | undefined;
        let lastOnline: string | null = null;
        let temperature: number | undefined;
        let device = 'Unknown';
        let data = '{}';

        // Keep last-seen even when the cabinet is currently offline.
        // If this poll has no timestamp, reuse the previous value so the
        // Last online slot stays reserved instead of disappearing.
        if (onlineData?.status?.t) {
          lastOnline = onlineData.status.t;
          this.lastOnlineCache.set(machine.machineId, lastOnline);
          const lastTime = new Date(onlineData.status.t);
          const diffMin = (now.getTime() - lastTime.getTime()) / 60000;
          if (diffMin <= 5) {
            status = 'Online';
            lastUpdate = onlineData.status.t;
            temperature = onlineData.status.b?.temperature;
            device = onlineData.status.b?.device ?? 'Unknown';
            data = JSON.stringify(onlineData.status.b?.data || {});
          }
        } else if (this.lastOnlineCache.has(machine.machineId)) {
          lastOnline = this.lastOnlineCache.get(machine.machineId) || null;
        }

        const d = machine?.data?.[0] || null;
        const location = (d?.location != null && String(d.location).trim() !== '')
          ? String(d.location).trim()
          : '';
        const shopPhone = (d?.shopPhone != null && String(d.shopPhone).trim() !== '')
          ? String(d.shopPhone).trim()
          : '';
        const latitude = (d?.latitude != null && d?.latitude !== '' && Number.isFinite(Number(d.latitude)))
          ? Number(d.latitude)
          : '';
        const longitude = (d?.longitude != null && d?.longitude !== '' && Number.isFinite(Number(d.longitude)))
          ? Number(d.longitude)
          : '';

        machines.push({
          machineId: machine.machineId,
          owner: d?.ownerPhone ? String(d.ownerPhone) : 'Unknown',
          temperature,
          status,
          lastUpdate,
          lastOnline,
          versionId: d?.versionId || 'N/A',
          device,
          data,
          otp: machine.otp || 'N/A',
          settings: d || {},
          showSecrets: this.showAllSecrets,
          ownerUuid: machine.ownerUuid,
          imei: d?.imei ? String(d.imei) : 'Unknown',
          createdAt: machine?.createdAt,
          location,
          shopPhone,
          latitude,
          longitude,
        });
      });

      machines.sort((a, b) => a.machineId.localeCompare(b.machineId));

      this.onlineMachines = machines.filter(m => m.status === 'Online');
      this.brokenMachines = machines.filter(m => m.status === 'Broken');
      this.onlineCount = this.onlineMachines.length;
      this.offlineCount = this.brokenMachines.length;
      this.totalCount = machines.length;
      this.ownerGroups = this.buildOwnerGroups(machines);

    } catch (err) {
      console.error('Load error:', err);
      this.onlineMachines = [];
      this.brokenMachines = [];
      this.ownerGroups = [];
      this.totalCount = 0;
      this.onlineCount = 0;
      this.offlineCount = 0;
    }
  }

  private buildOwnerGroups(machines: MachineData[]): OwnerGroup[] {
    const map = new Map<string, OwnerGroup>();
    for (const m of machines) {
      const key = m.owner || 'Unknown';
      let g = map.get(key);
      if (!g) {
        g = {
          owner: key,
          location:m.location,
          machines: [],
          onlineCount: 0,
          offlineCount: 0,
          lastOnline: null,
          expanded: this.expandedOwners.has(key),
        };
        map.set(key, g);
      }
      g.machines.push(m);
      if (m.status === 'Online') g.onlineCount += 1;
      else g.offlineCount += 1;
      if (m.lastOnline) {
        if (!g.lastOnline || new Date(m.lastOnline) > new Date(g.lastOnline)) {
          g.lastOnline = m.lastOnline;
        }
      }
    }
    for (const g of map.values()) {
      g.machines.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Online' ? -1 : 1;
        return a.machineId.localeCompare(b.machineId);
      });
    }
    return [...map.values()].sort((a, b) => {
      if (b.onlineCount !== a.onlineCount) return b.onlineCount - a.onlineCount;
      return a.owner.localeCompare(b.owner);
    });
  }

  async openPickLocation(machine: MachineData) {
    if (!machine || machine.savingLocation) return;

    const modal = await this.modalCtrl.create({
      component: PickLocationModalComponent,
      componentProps: {
        latitude: machine.latitude,
        longitude: machine.longitude,
        title: machine.location || machine.machineId || 'เลือกพิกัดบนแผนที่',
      },
      cssClass: 'full-screen-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0.95],
      initialBreakpoint: 0.95,
      handle: false,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) return;

    machine.latitude = data.latitude;
    machine.longitude = data.longitude;
  }

  async updateLocation(machine: MachineData) {
    if (!machine?.machineId || machine.savingLocation) return;

    const location = (machine.location != null) ? String(machine.location).trim() : '';
    const shopPhone = (machine.shopPhone != null) ? String(machine.shopPhone).trim() : '';
    const latitudeRaw = machine.latitude;
    const longitudeRaw = machine.longitude;
    const latitude = (latitudeRaw != null && latitudeRaw !== '' && Number.isFinite(Number(latitudeRaw)))
      ? Number(latitudeRaw)
      : null;
    const longitude = (longitudeRaw != null && longitudeRaw !== '' && Number.isFinite(Number(longitudeRaw)))
      ? Number(longitudeRaw)
      : null;

    machine.location = location;
    machine.shopPhone = shopPhone;
    machine.latitude = latitude ?? '';
    machine.longitude = longitude ?? '';
    machine.savingLocation = true;

    try {
      const token = localStorage.getItem('token');
      const secret = localStorage.getItem('secretLocal');
      const response = await axios.post(`${environment.url}/updateMachineLocationAdmin`, {
        secret,
        shopPhonenumber: '',
        token,
        data: {
          machineId: machine.machineId,
          location,
          shopPhone,
          latitude,
          longitude,
        },
      });

      if (response?.data?.status === 1) {
        if (!machine.settings) machine.settings = {};
        machine.settings.location = location;
        machine.settings.shopPhone = shopPhone;
        machine.settings.latitude = latitude;
        machine.settings.longitude = longitude;
        this.apiService.alertSuccess('ອັບເດດທີ່ຕັ້ງສຳເຫຼັດ');
      } else {
        this.apiService.alertError(response?.data?.message || 'ອັບເດດທີ່ຕັ້ງບໍ່ສຳເຫຼັດ');
      }
    } catch (err: any) {
      console.error('Error updating location:', err);
      this.apiService.alertError(err?.message || err);
    } finally {
      machine.savingLocation = false;
    }
  }

  async exitApp(machineId: string) {
    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = '';
      const secret = localStorage.getItem('secretLocal');
      const response = await axios.post(`${environment.url}/exitAppMachineAdmin`, {
        secret,
        shopPhonenumber,
        token,
        data: { machineId },
      });

      if (response.data.status === 1) {
        alert(`Exit app command sent successfully to machine ${machineId}`);
      } else {
        alert(`Failed to send exit app command: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error('Error sending exit app command:', err);
      alert(`Error sending exit app command: ${err.message}`);
    }
  }

  async clearLogTemp() {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${environment.url}/clearLogsTemp`, {
        token,
      }).then(r => {
        this.apiService.alertSuccess('ລົບຂໍ້ມູນສຳເຫຼັດ');
      }).catch(err => {
        this.apiService.alertError(err);
      });
    } catch (error) {
      console.error('Error clearLogTemp:', error);
      alert(`Error clearLogTemp: ${error.message}`);
    }
  }

  async clearClientLogs() {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${environment.url}/clearClientLogs`, {
        token,
      }).then(r => {
        this.apiService.alertSuccess('ລົບຂໍ້ມູນສຳເຫຼັດ');
      }).catch(err => {
        this.apiService.alertError(err);
      });
    } catch (error) {
      console.error('Error clearLogTemp:', error);
      alert(`Error clearLogTemp: ${error.message}`);
    }
  }

  async clearCallbackLogs() {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${environment.url}/clearCallbackLogs`, {
        token,
      }).then(r => {
        this.apiService.alertSuccess('ລົບຂໍ້ມູນສຳເຫຼັດ');
      }).catch(err => {
        this.apiService.alertError(err);
      });
    } catch (error) {
      console.error('Error clearLogTemp:', error);
      alert(`Error clearLogTemp: ${error.message}`);
    }
  }

  async refreshMachine(machineId: string) {
    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = '';
      const secret = localStorage.getItem('secretLocal');
      const response = await axios.post(`${environment.url}/refreshMachineAdmin`, {
        secret,
        shopPhonenumber,
        token,
        data: { machineId },
      });

      if (response.data.status === 1) {
        alert(`Refresh command sent successfully to machine ${machineId}`);
      } else {
        alert(`Failed to send refresh command: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error('Error sending refresh command:', err);
      alert(`Error sending refresh command: ${err.message}`);
    }
  }

  showLogTemp(machineId: string) {
    this.apiService.modal
      .create({
        component: LogTempPage,
        componentProps: { machineId },
        cssClass: 'custom-modal',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  showClientLog(machineId: string) {
    this.apiService.modal
      .create({
        component: ReportClientPage,
        componentProps: { machineId },
        cssClass: 'custom-modal',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  showCallbackLogs() {
    this.apiService.modal
      .create({
        component: ReportCallbacklogPage,
        componentProps: {},
        cssClass: 'custom-modal',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  showSettings(settings: any) {
    this.apiService.modal
      .create({
        component: SettingsModalPage,
        componentProps: { settings },
        cssClass: 'custom-modal',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  showBilling(machineId: string, phoneNumber: string, ownerPhone: string) {
    localStorage.setItem('phoneNumberLocal', phoneNumber.slice(-8));
    localStorage.setItem('phoneMmoney', ownerPhone.slice(-8));

    this.apiService.modal
      .create({
        component: BillingPage,
        componentProps: { machineId: machineId },
        cssClass: 'custom-modal-full',
        backdropDismiss: true,
      })
      .then((modal) => modal.present());
  }

  showBillNotPaid(machineId: string, otp: string, ownerUuid: any) {
    this.apiService.showModal(BillnotPaidPage, { machineId: machineId, otp: otp, ownerUuid: ownerUuid }).then(r => {
      r.present();
      r.onDidDismiss().then(() => { });
    });
  }

  showReportSale(machineId: string, otp: string) {
    const props = { machineId: machineId, otp: otp };
    this.apiService.showModal(SaleReportPage, props).then(r => {
      r.present();
    });
  }

  showReportStock(machineId: string, otp: string) {
    const props = { machineId: machineId, otp: otp };
    this.apiService.showModal(StockReportPage, props).then(r => {
      r.present();
    });
  }

  manage(phoneNumber: string, i: number = 1) {
    localStorage.setItem('phoneNumberLocal', phoneNumber.slice(-8));
    this.apiService.router.navigate(['/tabs/tab1']);
  }

  triggerFlash() {
    this.flashClass = 'flash';
    setTimeout(() => this.flashClass = '', 600);
  }

  scrollToTop() {
    this.content?.scrollToTop(300);
  }

  toggleAllSecrets() {
    this.showAllSecrets = !this.showAllSecrets;
    [...this.onlineMachines, ...this.brokenMachines].forEach(m => m.showSecrets = this.showAllSecrets);
  }

  toggleMachineSecrets(machine: MachineData) {
    machine.showSecrets = !machine.showSecrets;
  }

  async openPaidOrdersModal() {
    const modal = await this.modalCtrl.create({
      component: PaidOrdersModalComponent,
      cssClass: 'full-screen-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0.95],
      initialBreakpoint: 0.95,
      handle: false,
    });
    await modal.present();
  }

  async openConfigMachine() {
    const modal = await this.modalCtrl.create({
      component: SettingConfigPage,
      cssClass: 'full-screen-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0.95],
      initialBreakpoint: 0.95,
      handle: false,
    });
    await modal.present();
  }

  openMachineMap() {
    this.apiService.router.navigate(['/machine-map']);
  }

  async openCompareExecl() {
    const modal = await this.modalCtrl.create({
      component: CompareExcelPage,
      cssClass: 'full-screen-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0.95],
      initialBreakpoint: 0.95,
      handle: false,
    });
    await modal.present();
  }

  async showTickets(machineId: string) {
    const modal = await this.modalCtrl.create({
      component: TicketListPage,
      componentProps: { machineId },
      cssClass: 'full-screen-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0.95],
      initialBreakpoint: 0.95,
      handle: false,
    });
    await modal.present();
  }
}
