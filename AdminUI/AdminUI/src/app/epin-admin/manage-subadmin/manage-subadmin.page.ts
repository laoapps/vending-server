import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-manage-subadmin',
  templateUrl: './manage-subadmin.page.html',
  styleUrls: ['./manage-subadmin.page.scss'],
})
export class ManageSubadminPage implements OnInit {

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

}
