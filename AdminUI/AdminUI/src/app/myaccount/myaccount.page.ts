import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.page.html',
  styleUrls: ['./myaccount.page.scss'],
})
export class MyaccountPage implements OnInit {

  constructor(public apiService: ApiService) { }

  ngOnInit() {
  }
  close() {
    this.apiService.closeModal()
  }
}
