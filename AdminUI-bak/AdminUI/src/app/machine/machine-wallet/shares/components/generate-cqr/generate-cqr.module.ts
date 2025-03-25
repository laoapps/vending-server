import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GenerateCqrPageRoutingModule } from './generate-cqr-routing.module';

import { GenerateCqrPage } from './generate-cqr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GenerateCqrPageRoutingModule
  ],
  declarations: [GenerateCqrPage]
})
export class GenerateCqrPageModule {}
