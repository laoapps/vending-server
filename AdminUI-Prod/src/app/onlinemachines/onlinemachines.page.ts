import { Component, OnDestroy, OnInit } from '@angular/core';
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

interface MachineData {
  machineId: string;
  owner: string;
  temperature?: number;
  status: 'Online' | 'Broken';
  lastUpdate?: string;
  versionId: string;
  device: string;
  data: string;
}

@Component({
  selector: 'app-onlinemachines',
  templateUrl: './onlinemachines.page.html',
  styleUrls: ['./onlinemachines.page.scss'],
})
export class OnlinemachinesPage implements OnInit, OnDestroy {
  onlineMachines: MachineData[] = [];
  brokenMachines: MachineData[] = [];
  private allMachinesUrl = `${environment.url}/getAllMachines`;
  private onlineMachinesUrl = `${environment.url}/getOnlineMachines`;
  private intervalId: NodeJS.Timeout;

  constructor(public apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.intervalId = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  async refreshData() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const token = localStorage.getItem('token');
      const shopPhonenumber = '';
      const secret = localStorage.getItem('secretLocal');
      const payload = { secret, shopPhonenumber, token };

      // Fetch data concurrently with Axios
      const [allMachinesResponse, onlineMachinesResponse] = await Promise.all([
        axios.post(this.allMachinesUrl, payload),
        axios.post(this.onlineMachinesUrl, payload),
      ]);

      const machines: MachineData[] = [];
      const onlineMachinesMap = new Map<string, any>();
      const now = new Date();

      // Build map of online machines
      onlineMachinesResponse.data.data
        ?.filter((item: any) => item && item.machine)
        .forEach((item: any) => {
          onlineMachinesMap.set(item.machine.machineId, item);
        });

      // Process all machines
      allMachinesResponse.data.data.forEach((machine: any) => {
        const onlineData = onlineMachinesMap.get(machine.machineId);
        let status: 'Online' | 'Broken' = 'Broken';
        let lastUpdate: string | undefined;
        let temperature: number | undefined;
        let device = 'Unknown';
        let data = '{}';

        if (onlineData && onlineData.status && onlineData.status.t) {
          const lastUpdateTime = new Date(onlineData.status.t);
          const minutesDiff = (now.getTime() - lastUpdateTime.getTime()) / 1000 / 60;
          if (minutesDiff <= 5) {
            status = 'Online';
            lastUpdate = onlineData.status.t;
            temperature = onlineData.status.b.temperature;
            device = onlineData.status.b.device || 'Unknown';
            data = JSON.stringify(onlineData.status.b.data || {}) || '{}';
          }
        }

        const d = machine?.data?.[0] || null;

        machines.push({
          machineId: machine.machineId,
          owner: d?.owner || 'Unknown',
          temperature,
          status,
          lastUpdate,
          versionId: d?.versionId || 'N/A',
          device,
          data,
        });
      });

      // Sort and assign machines
      machines.sort((a, b) => a.machineId.localeCompare(b.machineId));
      this.onlineMachines = machines.filter((m) => m.status === 'Online');
      this.brokenMachines = machines.filter((m) => m.status === 'Broken');
    } catch (err) {
      console.error('Error loading data:', err);
      this.onlineMachines = [];
      this.brokenMachines = [];
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

  manage(owner: string, i: number = 1) {
    console.log('Manage action for owner:', this.onlineMachines);

    const pages = [
      null,
      MyaccountPage,
      MachinePage,
      ProductsPage,
      SalePage,
      EpinAdminPage,
      FindMyEpinPage,
      AdvertisementPage,
      VersionControlPage,
      ImagesproductPage,
    ];

    if (pages[i]) {
      this.apiService.showModal(pages[i], {}).then((r) => r?.present());
    }
  }
}