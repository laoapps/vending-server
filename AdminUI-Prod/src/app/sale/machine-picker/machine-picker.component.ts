import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { IMachineClientID } from 'src/app/services/syste.model';

// lists other machines of the same owner; the current machine is always included and not selectable
@Component({
  selector: 'app-machine-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './machine-picker.component.html',
  styleUrls: ['./machine-picker.component.scss'],
})
export class MachinePickerComponent implements OnInit {
  @Input() machineId = '';
  @Input() hint = 'Also apply to other machines (optional)';
  @Output() selectedChange = new EventEmitter<string[]>();

  machines = new Array<IMachineClientID>();
  filteredMachines = new Array<IMachineClientID>();
  selectedMachineIds = new Set<string>();
  machineSearch = '';
  machinesLoading = false;

  constructor(public apiService: ApiService) { }

  ngOnInit() {
    this.loadMachines();
  }

  loadMachines() {
    this.machinesLoading = true;
    this.apiService.listMachine().subscribe(r => {
      this.machinesLoading = false;
      if (!r.status) return;
      const all = (r.data || []) as Array<IMachineClientID>;
      const ownerUuid = all.find(m => m.machineId == this.machineId)?.ownerUuid || this.apiService.ownerUuid;
      if (!ownerUuid) return;
      this.machines = all.filter(m => m.machineId && m.machineId != this.machineId && m.ownerUuid == ownerUuid);
      this.filterMachines();
    }, error => {
      console.log(error);
      this.machinesLoading = false;
    });
  }
  filterMachines() {
    const q = (this.machineSearch || '').trim().toLowerCase();
    this.filteredMachines = q ? this.machines.filter(m => m.machineId.toLowerCase().includes(q)) : this.machines;
  }
  toggleMachine(machineId: string, checked: boolean) {
    if (checked) this.selectedMachineIds.add(machineId);
    else this.selectedMachineIds.delete(machineId);
    this.emit();
  }
  selectAllMachines() {
    this.filteredMachines.forEach(m => this.selectedMachineIds.add(m.machineId));
    this.emit();
  }
  clearMachines() {
    this.selectedMachineIds.clear();
    this.emit();
  }
  trackByMachineId(_: number, m: IMachineClientID) {
    return m.machineId;
  }
  private emit() {
    this.selectedChange.emit(Array.from(this.selectedMachineIds));
  }
}
