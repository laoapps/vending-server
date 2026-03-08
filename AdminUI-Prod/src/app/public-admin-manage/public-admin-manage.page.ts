import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

interface PublicAdminEntry {
  phoneNumber: string;
  machineId: string;
}

@Component({
  selector: 'app-public-admin-manage',
  templateUrl: './public-admin-manage.page.html',
  styleUrls: ['./public-admin-manage.page.scss'],
  standalone: false,
})
export class PublicAdminManagePage implements OnInit {

  admins: PublicAdminEntry[] = [];
  newPhone = '';
  newMachineId = '';

  url = environment.url;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.loadAdmins();
  }

  async loadAdmins() {
    const loading = await this.loadingCtrl.create({ message: 'Loading public admins...' });
    await loading.present();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const res: any = await this.http.post(
        `${this.url}/getPublicAdmin`,
        { token }
      ).toPromise();

      if (res?.data && Array.isArray(res.data)) {
        this.admins = res.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Load admins failed:', err);
      const toast = await this.toastCtrl.create({
        message: err.message || 'Failed to load public admins',
        duration: 3500,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async addAdmin() {
    const phone = this.newPhone.trim();
    const machine = this.newMachineId.trim();

    if (!phone || !machine) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter both phone number and machine ID',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Optional: very basic Lao phone check (+856 or 020...)
    if (!phone.startsWith('+856') && !phone.startsWith('020')) {
      const toast = await this.toastCtrl.create({
        message: 'Phone should start with +856 or 020',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alreadyExists = this.admins.some(
      a => a.phoneNumber === phone && a.machineId === machine
    );

    if (alreadyExists) {
      const toast = await this.toastCtrl.create({
        message: 'This phone + machine combination already exists',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.admins.push({ phoneNumber: phone, machineId: machine });
    this.newPhone = '';
    this.newMachineId = '';

    // Auto save after add
    await this.saveChanges();
  }

  async removeAdmin(index: number) {
    const entry = this.admins[index];
    if (!entry) return;

    const alert = await this.alertCtrl.create({
      header: 'Remove Public Admin?',
      message: `Remove ${entry.phoneNumber} for machine ${entry.machineId}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            this.admins.splice(index, 1);
            await this.saveChanges();
          }
        }
      ]
    });

    await alert.present();
  }

  async saveChanges() {
    const loading = await this.loadingCtrl.create({ message: 'Saving changes...' });
    await loading.present();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res: any = await this.http.post(
        `${this.url}/setPublicAdmin`,
        {
          token,
          publicAdmin: this.admins
        }
      ).toPromise();

      // Optional: check if backend returned success
      if (res?.message !== 'succeeded') {
        throw new Error('Backend did not confirm success');
      }

      const toast = await this.toastCtrl.create({
        message: 'Public admin list updated successfully',
        duration: 2200,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (err: any) {
      console.error('Save failed:', err);
      const toast = await this.toastCtrl.create({
        message: err.message || 'Failed to save changes',
        duration: 3500,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      loading.dismiss();
    }
  }
}