import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-billhistory',
  templateUrl: './billhistory.page.html',
  styleUrls: ['./billhistory.page.scss'],
})
export class BillhistoryPage implements OnInit {

  constructor(public apiService:ApiService) { }

  ngOnInit() {
  }
  close() {
    this.apiService.closeModal()
  }
}
