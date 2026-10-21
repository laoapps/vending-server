import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { from, lastValueFrom, of } from 'rxjs';
import { catchError, map, mergeMap, toArray } from 'rxjs/operators';
import { MachinePickerComponent } from 'src/app/sale/machine-picker/machine-picker.component';
import { ApiService } from 'src/app/services/api.service';

// opened by long-pressing Refresh: refreshes the current machine plus the selected machines of the same owner
@Component({
  selector: 'app-machine-refresh-many',
  standalone: true,
  imports: [CommonModule, IonicModule, MachinePickerComponent],
  templateUrl: './machine-refresh-many.component.html',
})
export class MachineRefreshManyComponent {
  @Input() machineId = '';
  extraMachineIds = new Array<string>();
  running = false;

  constructor(public apiService: ApiService) { }

  close() {
    this.apiService.closeModal();
  }

  async refreshAll() {
    if (this.running) return;
    this.running = true;
    const machineIds = [this.machineId, ...this.extraMachineIds];
    const loading = await this.apiService.load.create({ message: `Refreshing ${machineIds.length} machines...` });
    await loading.present();
    let results: Array<{ machineId: string, ok: boolean }> = [];
    try {
      results = await lastValueFrom(from(machineIds).pipe(
        mergeMap(machineId => this.apiService.refreshMachine({ machineId }).pipe(
          map(rx => ({ machineId, ok: !!rx.status })),
          catchError(e => {
            console.log(e);
            return of({ machineId, ok: false });
          })
        ), 3),
        toArray()
      ));
    } catch (error) {
      console.log(error);
    } finally {
      loading.dismiss();
      this.running = false;
    }
    const failed = machineIds.filter(id => !results.find(v => v.machineId == id && v.ok));
    let message = `Refreshed: ${machineIds.length - failed.length}/${machineIds.length}`;
    if (failed.length) message += `<br>Failed: ${failed.join(', ')}`;
    const alert = await this.apiService.alert.create({ header: 'Refresh machines', message, buttons: ['OK'] });
    await alert.present();
    if (!failed.length) this.close();
  }
}
