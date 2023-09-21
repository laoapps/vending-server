import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'machine',
    loadChildren: () => import('./machine/machine.module').then( m => m.MachinePageModule)
  },
  {
    path: 'products',
    loadChildren: () => import('./products/products.module').then( m => m.ProductsPageModule)
  },
  {
    path: 'sale',
    loadChildren: () => import('./sale/sale.module').then( m => m.SalePageModule)
  },
  {
    path: 'product-add',
    loadChildren: () => import('./products/product-add/product-add.module').then( m => m.ProductAddPageModule)
  },
  {
    path: 'product-details',
    loadChildren: () => import('./products/product-details/product-details.module').then( m => m.ProductDetailsPageModule)
  },
  {
    path: 'machine-details',
    loadChildren: () => import('./machine/machine-details/machine-details.module').then( m => m.MachineDetailsPageModule)
  },
  {
    path: 'machine-add',
    loadChildren: () => import('./machine/machine-add/machine-add.module').then( m => m.MachineAddPageModule)
  },
  {
    path: 'sale-add',
    loadChildren: () => import('./sale/sale-add/sale-add.module').then( m => m.SaleAddPageModule)
  },
  {
    path: 'sale-details',
    loadChildren: () => import('./sale/sale-details/sale-details.module').then( m => m.SaleDetailsPageModule)
  },
  {
    path: 'myaccount',
    loadChildren: () => import('./myaccount/myaccount.module').then( m => m.MyaccountPageModule)
  },
  {
    path: 'todaybill',
    loadChildren: () => import('./todaybill/todaybill.module').then( m => m.TodaybillPageModule)
  },
  {
    path: 'billhistory',
    loadChildren: () => import('./billhistory/billhistory.module').then( m => m.BillhistoryPageModule)
  },
  {
    path: 'refillsale',
    loadChildren: () => import('./refillsale/refillsale.module').then( m => m.RefillsalePageModule)
  },
  {
    path: 'productlist',
    loadChildren: () => import('./products/productlist/productlist.module').then( m => m.ProductlistPageModule)
  },
  {
    path: 'positionlist',
    loadChildren: () => import('./positionlist/positionlist.module').then( m => m.PositionlistPageModule)
  },



  // my account
  {
    path: 'generate-cqr',
    loadChildren: () => import('./myaccount/shares/components/generate-cqr/generate-cqr.module').then( m => m.GenerateCqrPageModule)
  },
  {
    path: 'coin-transfer-bill',
    loadChildren: () => import('./myaccount/shares/components/coin-transfer-bill/coin-transfer-bill.module').then( m => m.CoinTransferBillPageModule)
  },
  {
    path: 'cqr-scan',
    loadChildren: () => import('./myaccount/shares/components/cqr-scan/cqr-scan.module').then( m => m.CqrScanPageModule)
  },
  {
    path: 'cqr-payment',
    loadChildren: () => import('./myaccount/shares/components/cqr-payment/cqr-payment.module').then( m => m.CqrPaymentPageModule)
  },
  {
    path: 'hash-verify',
    loadChildren: () => import('./myaccount/shares/components/hash-verify/hash-verify.module').then( m => m.HashVerifyPageModule)
  },
  {
    path: 'show-qrhash-verify',
    loadChildren: () => import('./myaccount/shares/components/show-qrhash-verify/show-qrhash-verify.module').then( m => m.ShowQrhashVerifyPageModule)
  },
  {
    path: 'machine-wallet',
    loadChildren: () => import('./machine/machine-wallet/machine-wallet.module').then( m => m.MachineWalletPageModule)
  },




  //  my machine

  {
    path: 'generate-cqr',
    loadChildren: () => import('./machine/machine-wallet/shares/components/generate-cqr/generate-cqr.module').then( m => m.GenerateCqrPageModule)
  },
  {
    path: 'coin-transfer-bill',
    loadChildren: () => import('./machine/machine-wallet/shares/components/coin-transfer-bill/coin-transfer-bill.module').then( m => m.CoinTransferBillPageModule)
  },
  {
    path: 'cqr-scan',
    loadChildren: () => import('./machine/machine-wallet/shares/components/cqr-scan/cqr-scan.module').then( m => m.CqrScanPageModule)
  },
  {
    path: 'cqr-payment',
    loadChildren: () => import('./machine/machine-wallet/shares/components/cqr-payment/cqr-payment.module').then( m => m.CqrPaymentPageModule)
  },
  {
    path: 'hash-verify',
    loadChildren: () => import('./machine/machine-wallet/shares/components/hash-verify/hash-verify.module').then( m => m.HashVerifyPageModule)
  },
  {
    path: 'show-qrhash-verify',
    loadChildren: () => import('./machine/machine-wallet/shares/components/show-qrhash-verify/show-qrhash-verify.module').then( m => m.ShowQrhashVerifyPageModule)
  },
  {
    path: 'machine-wallet',
    loadChildren: () => import('./machine/machine-wallet/machine-wallet.module').then( m => m.MachineWalletPageModule)
  },
  {
    path: 'epin-management',
    loadChildren: () => import('./epin-admin/epin-admin.module').then( m => m.EpinAdminPageModule)
  },
  {
    path: 'epin-subadmin',
    loadChildren: () => import('./epin-subadmin/epin-subadmin.module').then( m => m.EpinSubadminPageModule)
  },
  {
    path: 'manage-subadmin',
    loadChildren: () => import('./epin-admin/manage-subadmin/manage-subadmin.module').then( m => m.ManageSubadminPageModule)
  },
  {
    path: 'manage-epin',
    loadChildren: () => import('./epin-admin/manage-epin/manage-epin.module').then( m => m.ManageEpinPageModule)
  },
  {
    path: 'manage-subadmin-info',
    loadChildren: () => import('./epin-admin/manage-subadmin-info/manage-subadmin-info.module').then( m => m.ManageSubadminInfoPageModule)
  },
  {
    path: 'manage-subadmin-create',
    loadChildren: () => import('./epin-admin/manage-subadmin-create/manage-subadmin-create.module').then( m => m.ManageSubadminCreatePageModule)
  },
  {
    path: 'epin-showcode',
    loadChildren: () => import('./epin-subadmin/epin-showcode/epin-showcode.module').then( m => m.EpinShowcodePageModule)
  },
  {
    path: 'cui-sale',
    loadChildren: () => import('./sale/cui-sale/cui-sale.module').then( m => m.CuiSalePageModule)
  },
  {
    path: 'sale-report',
    loadChildren: () => import('./sale/sale-report/sale-report.module').then( m => m.SaleReportPageModule)
  },
  {
    path: 'sale-report-view',
    loadChildren: () => import('./sale-report-view/sale-report-view.module').then( m => m.SaleReportViewPageModule)
  },
  {
    path: 'advertisement',
    loadChildren: () => import('./superadmin/advertisement/advertisement.module').then( m => m.AdvertisementPageModule)
  },
  {
    path: 'find-my-epin',
    loadChildren: () => import('./find-my-epin/find-my-epin.module').then( m => m.FindMyEpinPageModule)
  },
  {
    path: 'template',
    loadChildren: () => import('./template/template.module').then( m => m.TemplatePageModule)
  },
  {
    path: 'version-control',
    loadChildren: () => import('./version-control/version-control.module').then( m => m.VersionControlPageModule)
  },
  {
    path: 'form-upload',
    loadChildren: () => import('./version-control/_modals/form-upload/form-upload.module').then( m => m.FormUploadPageModule)
  },
  {
    path: 'form-preview',
    loadChildren: () => import('./version-control/_modals/form-preview/form-preview.module').then( m => m.FormPreviewPageModule)
  },
  {
    path: 'form-machine',
    loadChildren: () => import('./version-control/_modals/form-machine/form-machine.module').then( m => m.FormMachinePageModule)
  },
  {
    path: 'form-edit',
    loadChildren: () => import('./version-control/_modals/form-edit/form-edit.module').then( m => m.FormEditPageModule)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
