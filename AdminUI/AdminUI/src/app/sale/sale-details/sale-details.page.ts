import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IVendingMachineSale } from 'src/app/services/syste.model';

@Component({
  selector: 'app-sale-details',
  templateUrl: './sale-details.page.html',
  styleUrls: ['./sale-details.page.scss'],
})
export class SaleDetailsPage implements OnInit {

 
  showImage: (p: string) => string;
  @Input()s={} as IVendingMachineSale;
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
