import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IVendingMachineSale } from 'src/app/services/syste.model';

@Component({
  selector: 'app-sale-add',
  templateUrl: './sale-add.page.html',
  styleUrls: ['./sale-add.page.scss'],
})
export class SaleAddPage implements OnInit {

  showImage: (p: string) => string;
  s = {} as IVendingMachineSale;
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
    this.apiService.closeModal({ s: this.s })
  }

  handleInputChange(e:any) {
    console.log("input change")
    var file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];

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
  }
  cancel() {
    this.imageSrc = '';
  }




}
