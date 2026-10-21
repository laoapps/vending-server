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
  // owner of the listed machines; saved selections are kept per owner in localStorage
  ownerUuid = '';
  hasSavedSelection = false;
  savedMessage = '';

  constructor(public apiService: ApiService) { }

  ngOnInit() {
    this.loadMachines();
  }

  loadMachines() {
    this.machinesLoading = true;
    this.apiService.listMachine().subscribe(r => {
      this.machinesLoading = false;
      if (!r.status) return;
      // listMachine is already scoped to the shop owner on the backend (same list as the machine page)
      const all = (r.data || []) as Array<IMachineClientID>;
      this.machines = all.filter(m => m.machineId && m.machineId != this.machineId);
      this.ownerUuid = all.find(m => m.machineId == this.machineId)?.ownerUuid || all[0]?.ownerUuid || '';
      this.filterMachines();
      this.restoreSelection();
    }, error => {
      console.log(error);
      this.machinesLoading = false;
    });
  }
  onSearch(value: string | null | undefined) {
    this.machineSearch = value || '';
    this.filterMachines();
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
  // the saved group includes the current machine, so it still works when opened from another machine of the group
  saveSelection() {
    if (!this.ownerUuid) return;
    const ids = [this.machineId, ...Array.from(this.selectedMachineIds)];
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(ids));
      this.hasSavedSelection = true;
      this.savedMessage = `Saved ${ids.length} machines`;
    } catch (error) {
      console.log(error);
      this.savedMessage = 'Could not save selection';
    }
  }
  forgetSelection() {
    try {
      localStorage.removeItem(this.storageKey());
    } catch (error) {
      console.log(error);
    }
    this.hasSavedSelection = false;
    this.savedMessage = 'Saved selection removed';
  }
  private restoreSelection() {
    if (!this.ownerUuid) return;
    let ids: Array<string> = [];
    try {
      const raw = JSON.parse(localStorage.getItem(this.storageKey()) || '[]');
      if (Array.isArray(raw)) ids = raw.filter(v => typeof v == 'string');
    } catch (error) {
      console.log(error);
    }
    if (!ids.length) return;
    this.hasSavedSelection = true;
    const saved = new Set(ids);
    this.machines.forEach(m => {
      if (saved.has(m.machineId)) this.selectedMachineIds.add(m.machineId);
    });
    this.savedMessage = `Loaded saved selection (${this.selectedMachineIds.size} other machines)`;
    this.emit();
  }
  private storageKey() {
    return 'saleMachinePicker_' + this.ownerUuid;
  }
  trackByMachineId(_: number, m: IMachineClientID) {
    return m.machineId;
  }
  private emit() {
    this.selectedChange.emit(Array.from(this.selectedMachineIds));
  }
}
