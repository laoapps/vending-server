import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-version-control',
  templateUrl: './version-control.page.html',
  styleUrls: ['./version-control.page.scss'],
})
export class VersionControlPage implements OnInit {

  lastupdate: any = new Date();

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  

}
