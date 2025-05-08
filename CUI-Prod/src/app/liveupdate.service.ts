import { Injectable } from '@angular/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class LiveupdateService {
  private serverUrl = 'https://tvending.khamvong.com';

  constructor(private http: HttpClient,
    private apiService: ApiService

  ) { }

  async checkForUpdates(version: string): Promise<any> {
    try {
      const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
      const url = `${vending_server}/latest-bundle?bundleId=${version}`;
      console.log('Checking for updates at:', url);

      const latestBundle = await firstValueFrom(
        this.http.get<{ bundleId: string; url: string; channel: string }>(
          url
        )
      );

      console.log('Latest bundle:', JSON.stringify(latestBundle));


      const isNewBundleAvailable = await this.isNewBundleAvailable(latestBundle.bundleId);
      console.log('Is new bundle available:', isNewBundleAvailable);
      if (isNewBundleAvailable) {
        console.log('New bundle available, downloading...', latestBundle.url);
        await LiveUpdate.downloadBundle({
          url: latestBundle.url,
          bundleId: latestBundle.bundleId,
        });
        await LiveUpdate.setBundle({ bundleId: latestBundle.bundleId });
        await LiveUpdate.reload().then(() => {
          console.log('App reloaded with the new update');

        }).catch((error) => {
          console.log('Error reloading app:', error);
        });

        console.log('Bundle downloaded and set as next bundle.');
        return latestBundle;
      } else {
        console.log('No new bundle available.');
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  }


  async isNewBundleAvailable(latestBundleId: string): Promise<boolean> {
    try {
      const { bundleId: currentBundleId } = await LiveUpdate.getBundle();
      return latestBundleId !== currentBundleId;
    } catch (error) {
      console.error('Error checking bundle availability:', error);
      return false;
    }
  }

  async resetToDefaultBundle() {
    await LiveUpdate.reset();
    await LiveUpdate.reload();
  }
}