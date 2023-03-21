import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-positionlist',
  templateUrl: './positionlist.page.html',
  styleUrls: ['./positionlist.page.scss'],
})
export class PositionlistPage implements OnInit {
  @Input()position=new Array<number>();
  pos=[...new Array<number>(100).keys()];
  constructor(public apiService: ApiService) { }

  ngOnInit() {
    this.pos = this.pos.filter(v=>!this.position.includes(v));
  }
  select(p:number){
    this.apiService.closeModal(p);
  }
}
