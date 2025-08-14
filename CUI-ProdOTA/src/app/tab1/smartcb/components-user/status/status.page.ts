import { Component, OnInit } from '@angular/core';
import { LoadingService } from 'src/app/loading.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.page.html',
  styleUrls: ['./status.page.scss'],
  standalone: false,

})
export class StatusPage implements OnInit {

  constructor(public apiService: ApiService, public m: LoadingService) { }


  ngOnInit() {
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

}
