import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IStock } from 'src/app/services/syste.model';

@Component({
  selector: 'app-productlist',
  templateUrl: './productlist.page.html',
  styleUrls: ['./productlist.page.scss'],
})
export class ProductlistPage implements OnInit {
  _l = new Array<IStock>();
  constructor(public apiService: ApiService) { }

  ngOnInit() {
    this.apiService.listProduct('yes').subscribe(r => {
      console.log(r);
      if (r.status) {
        this._l.push(...r.data);
      }
      this.apiService.toast.create({ message: r.message, duration: 2000 }).then(ry => {
        ry.present();
      })
    })
  }
  selectProduct(id:number){
    this.apiService.dismissModal(this._l.find(v=>v.id==id));
  }

}
