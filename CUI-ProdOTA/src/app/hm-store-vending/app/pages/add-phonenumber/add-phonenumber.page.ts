import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading/loading.service';

@Component({
  selector: 'app-add-phonenumber',
  templateUrl: './add-phonenumber.page.html',
  styleUrls: ['./add-phonenumber.page.scss'],
  standalone:false
})
export class AddPhonenumberPage implements OnInit {
  phone: string = '';
  savedNumber: string | null = null;
  constructor(
    public m: LoadingService,
  ) { }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  submit() {
    if (!this.phone) return;
    const digits = this.phone.replace(/\D+/g, '');
    console.log('====================================');
    console.log(digits);
    console.log('====================================');
    this.savedNumber = `${digits}`;
    this.m.closeModal({dismiss:true,data:this.savedNumber})
  }

  ngOnInit() {
  }

}
