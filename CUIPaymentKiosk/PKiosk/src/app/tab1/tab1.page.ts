import { Component } from '@angular/core';
import { ApiServiceService } from '../api-service.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  machine:{bankNotes:Array<any>,badBN:Array<any>,notes:Array<any>}
  constructor(public apiService:ApiServiceService) {
    this.machine = apiService.machine;
  }

  refresh(){
    this.apiService.refresh();
  }
}
