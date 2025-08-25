import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
interface MachineData {
  machineId: string;
  owner: string;
  temperature?: number;
  status: 'Online' | 'Broken';
  lastUpdate?: string;
  versionId: string;
  device: string;
  data: string;
}

@Component({
  selector: 'app-onlinemachines',
  templateUrl: './onlinemachines.page.html',
  styleUrls: ['./onlinemachines.page.scss'],
})
export class OnlinemachinesPage implements OnInit, OnDestroy {
  private machinesSubject = new BehaviorSubject<MachineData[]>([]);
  machines$: Observable<MachineData[]> = this.machinesSubject.asObservable();
  onlineMachines$: Observable<MachineData[]>;
  brokenMachines$: Observable<MachineData[]>;
  private allMachinesUrl = environment.url+'/getAllMachines';
  private onlineMachinesUrl = environment.url+'/getOnlineMachines';
  private previousMachines: Map<string, MachineData> = new Map(); // Store previous machine data

  int: NodeJS.Timeout;

  constructor(private http: HttpClient) {
    // Initialize filtered observables with sorting
    this.onlineMachines$ = this.machines$.pipe(
      map(machines => machines.filter(machine => machine.status === 'Online').sort((a, b) => a.machineId.localeCompare(b.machineId)))
    );
    this.brokenMachines$ = this.machines$.pipe(
      map(machines => machines.filter(machine => machine.status === 'Broken').sort((a, b) => a.machineId.localeCompare(b.machineId)))
    );
  }

  ngOnInit() {
    this.loadData();
    this.int = setInterval(() => {
      this.loadData();
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.int);
  }

  refreshData() {
    this.loadData();
  }

  private loadData() {
    const token = localStorage.getItem('token');
    const shopPhonenumber = localStorage.getItem('shopPhonenumber');
    const secret = localStorage.getItem('secretLocal');

    forkJoin([
      this.http.post(this.allMachinesUrl, { secret, shopPhonenumber, token }),
      this.http.post(this.onlineMachinesUrl, { secret, shopPhonenumber, token })
    ]).subscribe({
      next: ([allMachinesResponse, onlineMachinesResponse]: [any, any]) => {
        const machines: MachineData[] = [];
        const onlineMachinesMap = new Map<string, any>();
        const now = new Date(); // Use current time dynamically

        // Build map of online machines by machineId
        onlineMachinesResponse.data
          .filter((item: any) => item && item.machine)
          .forEach((item: any) => {
            onlineMachinesMap.set(item.machine.machineId, item);
          });

        // Process all machines
        allMachinesResponse.data.forEach((machine: any) => {
          const onlineData = onlineMachinesMap.get(machine.machineId);
          const previousMachine = this.previousMachines.get(machine.machineId);
          let status: 'Online' | 'Broken' = 'Broken';
          let lastUpdate: string | undefined = previousMachine?.lastUpdate;
          let temperature: number | undefined = previousMachine?.temperature;
          let device: string = previousMachine?.device || 'Unknown';
          let data: string = previousMachine?.data || '{}';

          if (onlineData && onlineData.status && onlineData.status.t) {
            const lastUpdateTime = new Date(onlineData.status.t);
            const minutesDiff = (now.getTime() - lastUpdateTime.getTime()) / 1000 / 60;
            if (minutesDiff <= 5) {
              status = 'Online';
              lastUpdate = onlineData.status.t;
              temperature = onlineData.status.b.temperature;
              device = onlineData.status.b.device || 'Unknown';
              data = JSON.stringify(onlineData.status.b.data || {}) || '{}';
            } else {
              // Machine was online but last update is older than 5 minutes
              status = 'Broken';
            }
          } else if (previousMachine && previousMachine.status === 'Online') {
            // Machine was previously online but is missing from onlineMachinesResponse
            const lastUpdateTime = previousMachine.lastUpdate ? new Date(previousMachine.lastUpdate) : null;
            const minutesDiff = lastUpdateTime ? (now.getTime() - lastUpdateTime.getTime()) / 1000 / 60 : Infinity;
            if (minutesDiff > 5) {
              status = 'Broken';
            }
          }
          const d = machine?.data?machine?.data[0]:null;

          machines.push({
            machineId: machine.machineId,
            owner: d?.owner,
            temperature,
            status,
            lastUpdate,
            versionId: d?.versionId,
            device,
            data
          });
        });

        // Sort machines by machineId for consistent order
        machines.sort((a, b) => a.machineId.localeCompare(b.machineId));

        // Update previous machines map
        this.previousMachines.clear();
        machines.forEach(machine => this.previousMachines.set(machine.machineId, machine));

        // Emit updated machines
        this.machinesSubject.next(machines);
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.machinesSubject.next([]); // Reset to empty on error
      }
    });
  }
  exitApp(machineId: string) {
    const token = localStorage.getItem('token');
    const shopPhonenumber = localStorage.getItem('shopPhonenumber');
    const secret = localStorage.getItem('secretLocal');
    this.http.post(environment.url + '/exitAppMachineAdmin', { secret, shopPhonenumber, token, machineId }).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          alert('Exit app command sent successfully to machine ' + machineId);
        } else {
          alert('Failed to send exit app command: ' + res.message);
        }
      },
      error: (err) => {
        console.error('Error sending exit app command:', err);
        alert('Error sending exit app command: ' + err.message);
      }
    });
  }
}