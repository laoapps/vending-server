import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-refillsale',
  templateUrl: './refillsale.page.html',
  styleUrls: ['./refillsale.page.scss'],
})
export class RefillsalePage implements OnInit {

  constructor(public apiService:ApiService) { }

  ngOnInit() {
  }
  close() {
    this.apiService.closeModal()
  }
}
