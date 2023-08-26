import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-hangmi-food-segment',
  templateUrl: './hangmi-food-segment.page.html',
  styleUrls: ['./hangmi-food-segment.page.scss'],
})
export class HangmiFoodSegmentPage implements OnInit {

  categoryList: Array<any> = [
    {
      icon: `fa-solid fa-bowl-food`,
      name: 'Food Category'
    },
    {
      icon: `fa-solid fa-bowl-food`,
      name: 'Food Category'
    },
    {
      icon: `fa-solid fa-bowl-food`,
      name: 'Food Category'
    },
    {
      icon: `fa-solid fa-bowl-food`,
      name: 'Food Category'
    },
    {
      icon: `fa-solid fa-bowl-food`,
      name: 'Food Category'
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
