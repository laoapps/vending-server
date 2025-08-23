import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { clear } from 'console';


interface MachineData {
  machineId: string;
  owner: string;
  temperature?: number;
  isOnline: boolean;
  lastUpdate: string;
  versionId: string;
   device:string;
    data: any;
}
@Component({
  selector: 'app-onlinemachines',
  templateUrl: './onlinemachines.page.html',
  styleUrls: ['./onlinemachines.page.scss'],
})
export class OnlinemachinesPage implements OnInit,OnDestroy {
 private machinesSubject = new BehaviorSubject<MachineData[]>([]);
  machines$: Observable<MachineData[]> = this.machinesSubject.asObservable();
  private apiUrl = 'https://vending-service-api5.laoapps.com/zdm8/getOnlineMachines';
  int:NodeJS.Timeout;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
    this.int=setInterval(() => {
      this.loadData();
    }, 30000);
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    clearInterval(this.int);
  }
  refreshData() {
    this.loadData();
  }

  private loadData() {
    const token = localStorage.getItem('token');
    const shopPhonenumber = localStorage.getItem('shopPhonenumber');
    const secret = localStorage.getItem('secretLocal');
    this.http.post(this.apiUrl,{ token, shopPhonenumber, secret }).subscribe((response: any) => {
      const machines: MachineData[] = [];
      const uniqueMachines = new Map<string, any>();

      // Filter out entries without machine data and remove duplicates
      response.data
        .filter((item: any) => item && item.machine)
        .forEach((item: any) => {
          const machineId = item.machine.machineId;
          if (!uniqueMachines.has(machineId)) {
            uniqueMachines.set(machineId, item);
          }
        });

      // Process unique machines
      uniqueMachines.forEach((item) => {
        const machine = item.machine;
        const status = item.status;
        const now = new Date();
        const lastUpdate = new Date(status?.t);
        const isOnline = (now.getTime() - lastUpdate.getTime()) / 1000 / 60 <= 5;

        machines.push({
          machineId: machine.machineId,
          owner: machine.data[0].owner,
          temperature: status?.b?.temperature,
          isOnline: isOnline,
          lastUpdate: status?.t,
          versionId: machine.data[0].versionId,
          device: status?. b?.device || 'Unknown',
          data: JSON.stringify(status?. b?.data) || '{}'
        });
      });

      this.machinesSubject.next(machines);
    });
  }
}
