import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-customloading',
  templateUrl: './customloading.page.html',
  styleUrls: ['./customloading.page.scss'],
})
export class CustomloadingPage implements OnInit {
  @Input()message={message:'Loading.....'};
  @Input()duration=120000;
  t:any;
  constructor(private modal:ModalController) { }

  ngOnInit() {
    this.t=setTimeout(() => {
      if(this.t){
        clearTimeout(this.t);
        this.modal.dismiss();
      }
   
    }, this.duration);
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if(this.t)
    clearTimeout(this.t);
  }

}
