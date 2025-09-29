// src/app/settings-modal/settings-modal.page.ts
import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-settings-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Machine Settings</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item *ngFor="let key of objectKeys(settings)">
          <ion-label>
            <strong>{{ key | titlecase }}:</strong>
            <span *ngIf="isObject(settings[key])">{{ settings[key] | json }}</span>
            <span *ngIf="!isObject(settings[key])">{{ settings[key] }}</span>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class SettingsModalPage {
  settings: any;

  constructor(private modalController: ModalController) {}

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  dismiss() {
    this.modalController.dismiss();
  }
}