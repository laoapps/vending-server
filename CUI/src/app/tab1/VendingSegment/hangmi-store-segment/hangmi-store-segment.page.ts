import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-hangmi-store-segment',
  templateUrl: './hangmi-store-segment.page.html',
  styleUrls: ['./hangmi-store-segment.page.scss'],
})
export class HangmiStoreSegmentPage implements OnInit {

  categoryList: Array<any> = [
    {
      icon: `fa-solid fa-shirt`,
      name: 'Men clothing'
    },
    {
      icon: `fa-solid fa-child-dress`,
      name: 'Women clothing'
    },
    {
      icon: `fa-solid fa-ring`,
      name: 'accessory'
    },
    {
      icon: `fa-solid fa-bag-shopping`,
      name: 'Bag'
    },
    {
      icon: `fa-solid fa-shoe-prints`,
      name: 'Shoes'
    },
    
  ];

  productList: Array<any> = [
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    },
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    },
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    },
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    },
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    },
    {
      icon: `fa-solid fa-box`,
      name: 'comming soon',
      price: 80000
    }
  ]

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.myTab1.resetTabServicesSegement();
    this.apiService.modal.dismiss();
  }
}
