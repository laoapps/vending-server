import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';           // ← Import this
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';



interface IssueType {
  value: string;
  label: string;
}

@Component({
  selector: 'app-create-ticket-modal',
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.scss'],
  standalone: true,                    // ← Add this
  imports: [                           // ← Add this
    IonicModule,
    CommonModule,
    FormsModule                      // ← This fixes ngModel error
  ]
})
export class CreateTicketModalComponent implements OnInit {

  // Form Data
  issueType: string = '';
  title: string = '';
  description: string = '';

  // Photo handling
  photos: string[] = [];           // base64 or URLs
  isUploading = false;

  issueTypes: IssueType[] = [
    { value: 'item_not_drop', label: 'Item Did Not Drop' },
    { value: 'payment_pending', label: 'Payment Pending / Not Recognized' },
    { value: 'jammed', label: 'Machine Jammed' },
    { value: 'coin_stuck', label: 'Coin Stuck' },
    { value: 'display_error', label: 'Display / Touch Error' },
    { value: 'door_open', label: 'Door Open Issue' },
    { value: 'other', label: 'Other Issue' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {}

  // ==================== PHOTO HANDLING ====================

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        // preserveAspectRatio: true
      });

      if (image.base64String) {
        const base64 = `data:image/jpeg;base64,${image.base64String}`;
        this.photos.push(base64);
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }

  async pickFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (image.base64String) {
        const base64 = `data:image/jpeg;base64,${image.base64String}`;
        this.photos.push(base64);
      }
    } catch (err) {
      console.error('Gallery error:', err);
    }
  }

  removePhoto(index: number) {
    this.photos.splice(index, 1);
  }

  // ==================== SUBMIT ====================

  async submitTicket() {
    if (!this.issueType || !this.title) {
      this.showToast('Please fill Issue Type and Title', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creating ticket...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const payload = {
        machineId: this.apiService.machineId?.machineId,   // Make sure you have machineId in ApiService
        issueType: this.issueType,
        title: this.title.trim(),
        description: this.description.trim() || null,
        photos: this.photos   // Send base64 images (server should handle upload)
      };

      const res = await this.apiService.createTicket(payload);

      if (res?.status === 1) {
        this.showToast('Ticket created successfully!', 'success');
        this.modalCtrl.dismiss({ created: true, ticket: res.data });
      } else {
        this.showToast(res?.data?.message || 'Failed to create ticket', 'danger');
      }
    } catch (err: any) {
      console.error('Create ticket error:', err);
      this.showToast('Network error. Please try again.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}