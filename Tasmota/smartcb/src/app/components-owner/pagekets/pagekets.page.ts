import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { AddPageketsPage } from './add-pagekets/add-pagekets.page';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-pagekets',
  templateUrl: './pagekets.page.html',
  styleUrls: ['./pagekets.page.scss'],
  standalone: false,
})
export class PageketsPage implements OnInit {
  schedulePackages: any[] = [];

  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data(){
    this.apiService.getSchedulePackages().subscribe((packages) => {
      this.schedulePackages = packages;
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async deleteSchedulePackage(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this schedule package?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.apiService.deleteSchedulePackage(id).subscribe(
              () => {
                this.schedulePackages = [];
                this.load_data();
              },
              (error) => {
                console.error('Failed to delete schedule package:', error);
              }
            );
          },
        },
      ],
    });
    await alert.present();
  }

  openEditModal(item: any) {
    this.m.showModal(AddPageketsPage, { data: item,title:'edit' }).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.schedulePackages = [];
            this.load_data();
          }
        });
      }
    });

  }

  onClick_add() {
    this.m.showModal(AddPageketsPage,{title:'add'}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.schedulePackages = [];
            this.load_data();
          }
        });
      }
    });
  }
}
