import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OnlinemachinesPageRoutingModule } from './onlinemachines-routing.module';

import { OnlinemachinesPage } from './onlinemachines.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OnlinemachinesPageRoutingModule
  ],
  declarations: [OnlinemachinesPage]
})
export class OnlinemachinesPageModule {}
