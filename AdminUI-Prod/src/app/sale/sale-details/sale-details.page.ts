import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IVendingMachineSale } from 'src/app/services/syste.model';

@Component({
  selector: 'app-sale-details',
  templateUrl: './sale-details.page.html',
  styleUrls: ['./sale-details.page.scss'],
})
export class SaleDetailsPage implements OnInit {

  @Input() machineId = '';
  showImage: (p: string) => string;
  @Input() s = {} as IVendingMachineSale;
  loaded: boolean = false;
  imageSrc: string = '';
  constructor(public apiService: ApiService) {
    this.showImage = this.apiService.showImage;
  }

  ngOnInit() {

  }
  close() {
    this.apiService.closeModal()
  }
  save() {
    this.apiService.disableSale(this.s.isActive, this.s.id).subscribe(rx => {
      console.log(rx);
      if (rx.status) {
        // this._l.find((v, i) => {
        //   if (v.id == rx.data.id) {
        //     this._l.splice(i, 1, ...[rx.data]);
        //     return true;
        //   }
        //   return false;
        // })
      }
      this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
        ry.present();
      })

    })
    this.apiService.closeModal({ s: this.s })
  }

  saveChange() {
    // console.log('S is :', this.s);

    this.apiService.closeModal({ s: this.s })
  }


  cancel() {
    this.imageSrc = '';
  }

}
