import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { IStock } from 'src/app/services/syste.model';
import * as uuid from "uuid";

@Component({
  selector: 'app-product-add',
  templateUrl: './product-add.page.html',
  styleUrls: ['./product-add.page.scss'],
})
export class ProductAddPage implements OnInit {
  showImage: (p: string) => string;
  s = {isActive:false} as IStock;
  loaded: boolean = false;
  imageSrc: string = '';




  constructor(public apiService: ApiService) {
    this.showImage = this.apiService.showImage;
  }

  ngOnInit() {

  }
  close() {
    this.apiService.closeModal()
  }
  save() {
    this.s.image =this.imageSrc;
    // console.log(`---->`, this.s.image);
    this.s.token = localStorage.getItem('lva_token');
    
    if (!(this.s.image && this.s.token && this.s.file && this.s.filename && this.s.fileuuid)) {
      this.apiService.simpleMessage(IENMessage.parametersEmpty);
      return;
    }


    this.apiService.closeModal({ s: this.s })
  }

  handleInputChange(e:any) {
    console.log("input change")
    var file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    this.s.file = file;
    this.s.filename = file.name;
    this.s.fileuuid = uuid.v4();
    

    var pattern = /image-*/;  
    var reader = new FileReader();
    reader.addEventListener('load', event => {
      const s: string = event.target.result as any;
      (document.querySelector('.product_image') as HTMLImageElement).src = s;
      this.imageSrc = s;
      console.log(`img src`, this.imageSrc);
    });
    if (!file.type.match(pattern)) {
      alert('invalid format');
      return;
    }

    // this.loaded = false;

    // reader.onload = this._handleReaderLoaded.bind(this);
    reader.readAsDataURL(file);
  }

  _handleReaderLoaded(e:any) {
    console.log("_handleReaderLoaded");
    var reader = e.target;
    this.imageSrc = reader.result;
    this.loaded = true;
  }
  cancel() {
    this.imageSrc = '';
  }

}
