import { Component, Input, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';

@Component({
  selector: 'app-numberpad',
  templateUrl: './numberpad.page.html',
  styleUrls: ['./numberpad.page.scss'],
})
export class NumberpadPage implements OnInit {

  constructor(public api:ApiServiceService) { }

  ngOnInit() {
  }
  click(n:number){
    if(this.api.pn.length>=10) return;
    this.api.pn+=n;
  }
  close(){
    this.api.closeModal();
  }
  back(){
    if(this.api.pn.length>0){
      this.api.pn=this.api.pn.substring(0,this.api.pn.length-1);
    }
  }

}
