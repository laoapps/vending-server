import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,

})
export class HistoryPage implements OnInit {

  constructor(public apiService: ApiService, public m: LoadingService) {}


  ngOnInit() {
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

}
