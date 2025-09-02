import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    this.enableEdgeToEdge();
  }

  async enableEdgeToEdge() {
  if (Capacitor.getPlatform() === 'android') {
    await EdgeToEdge.enable();
  }
}
}
