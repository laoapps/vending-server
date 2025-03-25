import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoinTransferComponent } from './components/coin-transfer/coin-transfer.component';
import { CqrComponent } from './components/cqr/cqr.component';
import { ReportOptionsComponent } from './components/report-options/report-options.component';



@NgModule({
  declarations: [
    CoinTransferComponent,
    CqrComponent,
    ReportOptionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    CoinTransferComponent,
    CqrComponent,
    ReportOptionsComponent
  ]
})
export class SharesModule { }
