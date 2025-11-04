import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-close-stytem',
  templateUrl: './close-stytem.page.html',
  styleUrls: ['./close-stytem.page.scss'],
})
export class CloseStytemPage implements OnInit {
  count = 6;
  machineuuid = this.apiService.machineuuid;
  t: any;
  constructor(
    public apiService: ApiService,
  ) { }

  ngOnInit() {
  }

  exitsApp() {

    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 6;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 6;
      const x = prompt('password');
      console.log(x, this.getPassword());

      if (!this.getPassword().endsWith(x.substring(6)) || !x.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;
      // this.apiService.showModal(SettingPage).then(r => {
      //   r.present();
      // })

      setTimeout(() => {
        console.log('EXITS APP');
        this.apiService.exitApp();
      }, 5000);

      if (this.t) {
        clearTimeout(this.t);
        this.t = null;
      }
    }
  }

  getPassword() {
    let x = '';
    this.machineuuid.split('').forEach(v => {
      !Number.isNaN(Number.parseInt(v)) ? x += v : '';
    })
    return x;
  }
}
