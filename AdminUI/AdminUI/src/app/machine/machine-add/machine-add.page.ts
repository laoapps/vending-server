import { Component, OnInit } from '@angular/core';
import { IMachineClientID } from '../../services/syste.model';
import { ApiService } from '../../services/api.service';
import * as uuid from "uuid";
import { IENMessage } from 'src/app/models/base.model';
import { FilemanagerApiService } from 'src/app/services/filemanager-api.service';

@Component({
  selector: 'app-machine-add',
  templateUrl: './machine-add.page.html',
  styleUrls: ['./machine-add.page.scss'],
})
export class MachineAddPage implements OnInit {

  showImage: (p: string) => string;
  s = {isActive:false} as IMachineClientID;
  loaded: boolean = false;
  imageSrc: string = '';

  constructor(public apiService: ApiService, private filemanagerAPIService: FilemanagerApiService) {
    this.showImage = this.apiService.showImage;
  }

  ngOnInit() {

  }
  close() {
    this.apiService.closeModal();
  }
  save() {
    this.s.photo= this.imageSrc;
    this.s.token = localStorage.getItem('lva_token');

    if (!(this.s.photo && this.s.token && this.s.file && this.s.filename && this.s.fileuuid)) {
      this.apiService.simpleMessage(IENMessage.parametersEmpty);
      return;
    }

    this.apiService.closeModal({ s: this.s });
  }

  handleInputChange(e:any) {
    console.log("input change")
    // var file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    var file = (e.target as HTMLInputElement).files[0];
    this.s.file = file;
    this.s.filename = file.name;
    this.s.fileuuid = uuid.v4();


    var pattern = /image-*/;
    var reader = new FileReader();

    if (!file.type.match(pattern)) {
      alert('invalid format');
      return;
    }

    this.loaded = false;

    reader.onload = this._handleReaderLoaded.bind(this);
    reader.readAsDataURL(file);
  }

  _handleReaderLoaded(e:any) {
    console.log("_handleReaderLoaded")
    var reader = e.target;
    this.imageSrc = reader.result;
    this.loaded = true;
    console.log(this.imageSrc);
    
  }
  cancel() {
    this.imageSrc = '';
  }

  

}
