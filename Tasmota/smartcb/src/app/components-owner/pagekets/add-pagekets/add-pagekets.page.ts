import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-add-pagekets',
  templateUrl: './add-pagekets.page.html',
  styleUrls: ['./add-pagekets.page.scss'],
  standalone: false,
})
export class AddPageketsPage implements OnInit {
  @Input() data: any;
  @Input() title: any;
  newSchedulePackage = {
    name: '',
    price: 0,
    conditionType: 'time_duration',
    conditionValue: 0,
  };
  constructor(
    public m: LoadingService,
    private apiService: ApiService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    if (this.title === 'edit' && this.data) {
      this.newSchedulePackage = {
        name: this.data.name,
        price: this.data.price,
        conditionType: this.data.conditionType,
        conditionValue: this.data.conditionValue,
      };
    }
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async addSchedulePackage() {
    if (
      !this.newSchedulePackage.name ||
      this.newSchedulePackage.price <= 0 ||
      this.newSchedulePackage.conditionValue <= 0
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }
    this.m.onLoading('')
    this.apiService
      .createSchedulePackage(
        this.newSchedulePackage.name,
        this.newSchedulePackage.price,
        this.newSchedulePackage.conditionType,
        this.newSchedulePackage.conditionValue
      )
      .subscribe(
        () => {
          // this.loadData();
          this.m.onDismiss();
          this.m.closeModal({ dismiss: true });
          this.newSchedulePackage = {
            name: '',
            price: 0,
            conditionType: 'time_duration',
            conditionValue: 0,
          };
        },
        (error) => {
          this.m.onDismiss();
          this.m.onAlert('Failed to create schedule package!!')
          console.error('Failed to create schedule package:', error);
        }
      );
  }

  async editSchedulePackage(){
        if (
      !this.newSchedulePackage.name ||
      this.newSchedulePackage.price <= 0 ||
      this.newSchedulePackage.conditionValue <= 0
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }
    this.m.onLoading('')
    this.apiService
      .editSchedulePackage(
        this.data.id,
        this.newSchedulePackage.name,
        this.newSchedulePackage.price,
        this.newSchedulePackage.conditionType,
        this.newSchedulePackage.conditionValue
      )
      .subscribe(
        () => {
          // this.loadData();
          this.m.onDismiss();
          this.m.closeModal({ dismiss: true });
          this.newSchedulePackage = {
            name: '',
            price: 0,
            conditionType: 'time_duration',
            conditionValue: 0,
          };
        },
        (error) => {
          this.m.onDismiss();
          this.m.onAlert('Failed to create schedule package!!')
          console.error('Failed to create schedule package:', error);
        }
      );
  }
}
