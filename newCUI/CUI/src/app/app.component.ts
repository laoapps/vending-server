import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';
import { App } from '@capacitor/app';
import * as moment from 'moment';
import { Platform } from '@ionic/angular';
import { SettingPage } from './setting/setting.page';
import { EVendingIndex, VendingIndexServiceService } from './vending-index-service.service';

// Import LiveUpdate from the capacitor-live-update plugin
import { LiveUpdate } from '@capawesome/capacitor-live-update';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus: IAlive;
  uT = new Date();
  now = new Date();
  version = '';
  machineuuid = '11111111';
  t: any;
  count = 6;
  
  constructor(
    public apiService: ApiService,
    private platform: Platform,
    public vendingIndex: VendingIndexServiceService
  ) {
    this.platform.ready().then(() => {
      this.initializeApp();
    });

    this.checkOnlineStatus = apiService.wsAlive;
    setInterval(() => {
      this.now = new Date();
    }, 1000);
    setInterval(() => {
      this.uT = this.apiService.updateOnlineStatus();
    }, 5000);
  }

  async initializeApp() {
    await this.checkForLiveUpdate(); // Check for updates on app start

    App.addListener('pause', async () => {
      console.log('App moved to background, closing port...');
      this.closePort();
    });

    App.addListener('resume', async () => {
      console.log('App resumed');
      this.reopenPort();
    });
  }

  async checkForLiveUpdate() {
    try {
      // Sync with the server to check and download updates
      const result = await LiveUpdate.sync();
      console.log('LiveUpdate sync result:', result);

      // Check if a new bundle was downloaded
      if (result.nextBundleId) {
        console.log('New update applied, reloading app...');
        await LiveUpdate.reload(); // Reload the app to apply the update
        console.log('App reloaded with the new update');
      } else {
        console.log('No update available or no change needed');
      }
    } catch (error) {
      console.error('Error during live update sync:', error);
    }
  }

  // Existing methods (unchanged)
  showSetting() {
    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 6;
        console.log('re count');
        if (this.t) {
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 6;
      const x = prompt('password');
      console.log(x, this.getPassword());
      this.apiService.showModal(SettingPage).then((r) => {
        r.present();
      });
      if (this.t) {
        clearTimeout(this.t);
        this.t = null;
      }
    }
  }

  getPassword() {
    let x = '';
    this.machineuuid.split('').forEach((v) => {
      !Number.isNaN(Number.parseInt(v)) ? (x += v) : '';
    });
    return x;
  }

  autoCheckAppVersion() {
    this.apiService.checkAppVersion.subscribe((run) => {
      if (!run) return;
      console.log(`CHECK APP VERSION`, run);
    });
  }

  startActive() {
    const hour = new Date().getHours();
  }

  private closePort() {
    try {
      console.log('Port closed successfully.');
    } catch (error) {
      console.error('Error closing port:', error);
    }
  }

  private reopenPort() {
    try {
      console.log('Reopening port if necessary...');
    } catch (error) {
      console.error('Error reopening port:', error);
    }
  }
}