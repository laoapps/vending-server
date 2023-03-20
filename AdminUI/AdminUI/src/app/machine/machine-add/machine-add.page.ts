import { Component, OnInit } from '@angular/core';
import { IMachineClientID } from '../../services/syste.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-machine-add',
  templateUrl: './machine-add.page.html',
  styleUrls: ['./machine-add.page.scss'],
})
export class MachineAddPage implements OnInit {

  showImage: (p: string) => string;
  s = {} as IMachineClientID;
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
    this.s.photo=this.imageSrc;
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
    console.log(this.imageSrc);
    
  }
  cancel() {
    this.imageSrc = '';
  }

  

}
