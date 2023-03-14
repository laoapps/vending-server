import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {
  wsurl = localStorage.getItem('wsurl') || 'ws://laoapps.com:9009/zdm8';
  url = localStorage.getItem('url') || 'http://laoapps.com:9009/zdm8';
  machineId = localStorage.getItem('machineId') || '12345678';
  otp = localStorage.getItem('otp') || '111111';
  contact = localStorage.getItem('contact') || '55516321';
  constructor() { }

  ngOnInit() {
  }
  save() {
    localStorage.setItem('wsurl', this.wsurl)
    localStorage.setItem('url', this.url)
    localStorage.setItem('machineId', this.machineId)
    localStorage.setItem('otp', this.otp)
    localStorage.setItem('contact', this.contact)
    window.location.reload();
  }

}
