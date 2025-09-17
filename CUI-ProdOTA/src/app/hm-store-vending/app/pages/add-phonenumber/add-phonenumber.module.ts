import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddPhonenumberPageRoutingModule } from './add-phonenumber-routing.module';

import { AddPhonenumberPage } from './add-phonenumber.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddPhonenumberPageRoutingModule
  ],
  declarations: [AddPhonenumberPage]
})
export class AddPhonenumberPageModule {}
