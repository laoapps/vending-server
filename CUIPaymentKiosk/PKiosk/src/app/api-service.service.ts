import { Injectable } from '@angular/core';
import { WsapiServiceService } from './wsapi-service.service';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  machine = {bankNotes: [], badBN: [], notes:[]} as { bankNotes: Array<any>, badBN: Array<any>, notes: Array<any> };
  constructor(public wsApiService: WsapiServiceService) {
    this.wsApiService.dataSubscription.subscribe(v => {
      console.log('v', v);

      if (v) {
        this.machine.badBN.length=0;
        this.machine.badBN.push(...v.badBN);
        this.machine.bankNotes.length=0;
        this.machine.bankNotes.push(...v.bankNotes);
        this.machine.notes.length=0;
        this.machine.notes.push(...v.notes);
      }

    })
    this.wsApiService.connect();
  }
  refresh() {
    this.wsApiService.send('');
  }
}
