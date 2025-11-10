import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { PositionlistPage } from 'src/app/positionlist/positionlist.page';
import { ProductlistPage } from 'src/app/products/productlist/productlist.page';
import { ApiService } from 'src/app/services/api.service';
import { IVendingMachineSale } from 'src/app/services/syste.model';

@Component({
  selector: 'app-sale-add',
  templateUrl: './sale-add.page.html',
  styleUrls: ['./sale-add.page.scss'],
})
export class SaleAddPage implements OnInit {
  @Input() machineId = '';
  @Input() sales = new Array<IVendingMachineSale>();
  showImage: (p: string) => string;
  s = {} as IVendingMachineSale;
  loaded: boolean = false;
  imageSrc: string = '';


  constructor(public apiService: ApiService) {
    this.showImage = this.apiService.showImage;
    this.s.max = 5;
    this.s.position = 1;
  }

  ngOnInit() {
    this.s.machineId = this.machineId;
    this.s.isActive = false;
  }
  close() {
    this.apiService.closeModal();
  }
  save() {
    if (this.sales.find(v => v.position == this.s.position && this.s.position > 0)) return alert('Position was duplicated');

    this.apiService.closeModal({ s: this.s })
  }


  cancel() {
    this.imageSrc = '';
  }
  showProductList() {
    this.apiService.showModal(ProductlistPage).then(ro => {
      ro?.present();
      console.log('show product list');

      ro?.onDidDismiss().then(r => {
        console.log(`after close product list`, r);

        if (r.data) {
          console.log(`rrrr data`, r.data);
          this.s.stock = r.data.data;
        }
      }).catch(e => {
        console.log(e);

      })
    })
  }
  showPosition() {
    console.log(`sssss`, this.sales);
    console.log(`position`, this.sales.map(v => v.position).length);
    const position = this.sales.map(v => v.position).length ? this.sales.map(v => v.position) : []
    this.apiService.showModal(PositionlistPage, { position }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);

        if (r.data) {

          this.s.position = r.data;
          console.log(this.s);

        }
      }).catch(e => {
        console.log(e);

      })
    })
  }



}
