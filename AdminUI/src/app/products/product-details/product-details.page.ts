import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IStock } from 'src/app/services/syste.model';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
})
export class ProductDetailsPage implements OnInit {
  @Input()s={}as IStock;
  showImage:(p:string)=>string;
  defaultS={}as IStock;
  constructor(public apiService:ApiService) { 
    this.showImage= this.apiService.showImage;
    this.defaultS= JSON.parse(JSON.stringify(this.s));
  }

  ngOnInit() {
    
  }
  close(){
    this.apiService.closeModal({update:false})
  }
  save(){
    let changed = false;
    Object.keys(this.s).forEach(k=>{
      if(this.s[k]!==this.defaultS[k])changed=true;
    });
    this.apiService.closeModal({update:changed})
  }

}
