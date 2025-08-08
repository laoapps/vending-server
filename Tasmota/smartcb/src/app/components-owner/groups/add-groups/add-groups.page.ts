import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-add-groups',
  templateUrl: './add-groups.page.html',
  styleUrls: ['./add-groups.page.scss'],
  standalone: false
})
export class AddGroupsPage implements OnInit {
  newGroup = { name: '' };
  constructor(
    public apiService: ApiService,
    public m: LoadingService,
    
  ) { }

  ngOnInit() {
  }

    dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

    addGroup() {
    if (!this.newGroup.name) {
      return alert('empty!!!')
    }
    this.apiService.createGroup(this.newGroup.name).subscribe(() => {
      this.newGroup = { name: '' };
      this.dismiss({ dismiss: true });
    });
  }

}
