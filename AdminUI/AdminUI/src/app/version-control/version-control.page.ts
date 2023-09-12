import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-version-control',
  templateUrl: './version-control.page.html',
  styleUrls: ['./version-control.page.scss'],
})
export class VersionControlPage implements OnInit {

  lists: Array<any> = [];
  page: number = 1;
  limit: number = 2;
  count: number;
  btnList: Array<any> = [];
  isActive: boolean = true;
  search: string = '';

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  

}
