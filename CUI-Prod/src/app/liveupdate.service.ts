import { Injectable } from '@angular/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';

@Injectable({
  providedIn: 'root'
})
export class LiveupdateService {
  private serverUrl = 'https://tvending.khamvong.com';

  constructor(private http: HttpClient,
    private apiService: ApiService

  ) { }

  async checkForUpdates(): Promise<any> {
    try {
      const url = 'https://tvending.khamvong.com/latest-bundle?bundleId=1.0.104';
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
          this.apiService.reloadPage();

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