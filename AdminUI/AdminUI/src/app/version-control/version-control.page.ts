import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FormUploadPage } from './_modals/form-upload/form-upload.page';

@Component({
  selector: 'app-version-control',
  templateUrl: './version-control.page.html',
  styleUrls: ['./version-control.page.scss'],
})
export class VersionControlPage implements OnInit {

  readmePage: boolean = true;
  versionPage: boolean = false;

  lastupdate: any = new Date();

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  openFormUpload() {
    this.apiService.showModal(FormUploadPage,{}).then(r=>{r?.present()});
  }

}
