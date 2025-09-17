import { Component, OnInit } from '@angular/core';
import { PayQrPage } from '../pay-qr/pay-qr.page';
import { AddPhonenumberPage } from '../add-phonenumber/add-phonenumber.page';
import { LoadingService } from '../../services/loading/loading.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone:false
})
export class CartPage implements OnInit {
  public PostArray:any = []
  public Detail_product:any = []
  public calculateFinalPrice:any

  constructor(
    public m: LoadingService,
    public caching:PhotoProductService,
    public apiService: ApiService,
  ) { }

  async ngOnInit() {
    if (localStorage.getItem('cart') == null || localStorage.getItem('cart') == 'null' || localStorage.getItem('cart') == 'undefined') {
      return
    }else{
      this.load_data();
    }
    console.log('====================================');
    console.log(this.PostArray);
    console.log('====================================');
  }

  async load_data(){
    this.PostArray =  JSON.parse(localStorage.getItem('cart'))
    for (let i = 0; i < this.PostArray.length; i++) {
     const e = this.PostArray[i];
     const aa = await this.caching.saveCachingPhoto(e?.image[0], new Date(e?.updatedAt), e?.id + '');
     e['pic'] = JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
    }
  }

  ionViewWillEnter() {
    this.m.updateCartCount();
    // this.load_vat();
  }

  load_vat(){
    // this.m.onLoading('', 'ກະລຸນາລໍຖ້າ...');
    let data = {
      price:this.PostArray.reduce((a, b) => a + b.total_price, 0)
    }
    this.apiService.calculateVat(data).subscribe((r)=>{
      console.log('calculateVat',r);
      if (r.status == 1) {
        // this.m.onDismiss();
        this.calculateFinalPrice = r?.data;
      }else{
        // this.load.onDismiss();
        // this.load.alertError('alert_error.message_something_wrong');
      }
    },error=>{
      console.log('Error',error);
      // this.load.onDismiss();
      // this.load.alertError('alert_error.message_something_wrong');
    })
  }

  Click_DetailProduct(item){

  }
  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

    onClickBuy(){
      let qty = this.PostArray?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
      let total = this.PostArray?.reduce((sum, item) => sum + ((item.total_price || 0)), 0) || 0;
      this.m.showModal(PayQrPage,{Detail_product:this.PostArray,qty,total},'dialog-fullscreen').then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }

    CeilValue(val: number): number {
      return Math.ceil(val);
    }



    //==========


    Click_AddNew(){
      this.m.closeModal({dismiss:false})
    }

    Click_Delete(item) {
      console.log('====================================');
      console.log('Delete:', item);
      console.log('====================================');
    
      const cartStr = localStorage.getItem('cart');
      if (!cartStr) return;
    
      let cart = [];
      try {
        cart = JSON.parse(cartStr) || [];
      } catch (e) {
        console.error('Error parsing cart:', e);
        return;
      }
    
      // ຫາ index ຂອງສິນຄ້າ
      const index = cart.findIndex(v => v.uuid === item.uuid);
    
      if (index > -1) {
        cart.splice(index, 1); // ລົບ item ອອກ
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Updated cart:', cart);
        this.load_data();
        this.m.updateCartCount();
      } else {
        console.warn('Item not found in cart');
      }
    }

    async getqty(action: number, product_index: number) {
      if (action == 1) {
        if (this.PostArray[product_index].qty >= 100) {
          return;
        }
        this.PostArray[product_index].qty++;
        this.PostArray[product_index].total_price = this.PostArray[product_index].moreDetail.price * this.PostArray[product_index].qty;
  
  
        const newcart = JSON.parse(JSON.stringify(this.PostArray));
        for (let i = 0; i < newcart.length; i++) {
          const e = newcart[i];
          e['pic'] = '';
  
          for (let j = 0; j < e.addons?.length; j++) {
            const ea = e.addons[j];
            ea['pica'] = '';
          }
        }
  
  
        localStorage.setItem('cart', JSON.stringify(newcart));
  
      } else {
        if (this.PostArray[product_index].qty <= 1) {
          return;
        }
  
        // this.ismaxStock=false;
  
        this.PostArray[product_index].qty--;
        this.PostArray[product_index].total_price = this.PostArray[product_index].moreDetail.price * this.PostArray[product_index].qty;
  
        const newcart = JSON.parse(JSON.stringify(this.PostArray));
        for (let i = 0; i < newcart.length; i++) {
          const e = newcart[i];
          e['pic'] = '';
  
          for (let j = 0; j < e.addons?.length; j++) {
            const ea = e.addons[j];
            ea['pica'] = '';
          }
        }
        localStorage.setItem('cart', JSON.stringify(newcart));
      }
    }

    getTotalQty() {
      return this.PostArray?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    }
    
    getTotalPrice() {
      return this.PostArray?.reduce((sum, item) => sum + ((item.total_price || 0)), 0) || 0;
    }
    Check_cart(): boolean {
      try {
        const cart = localStorage.getItem('cart');
        if (!cart) return false;
    
        const cartItems = JSON.parse(cart);
        return Array.isArray(cartItems) && cartItems.length > 0;
      } catch (e) {
        console.error('Invalid cart data in localStorage', e);
        return false;
      }
    }






    // ==============================================================================================

    isoutofstock = true
    findDuplicates: { uuid: string, max: number }[] = [];
    public newStock = []
    productChecked = {} as any;
    shipment_price = 0;
    isfast = false;
    sumprice = 0
    selldelivery() {
      if (!this.PostArray.length) {
        this.m.ontoast('ກະລຸນາເພີ່ມສິນຄ້າທີ່ຈະຊີ້ກ່ອນ', 1500); return;
      }
  
      this.isoutofstock = false
  
  
      for (let i = 0; i < this.PostArray.length; i++) {
        const v = this.PostArray[i];
        v['index'] = i;
      }
      this.findDuplicates = []
  
  
      this.checkStock();
    }

    async checkStock() {
      const service_products = this.PostArray.filter(v => v.productTypes == 'ບໍລິການ')
      if (service_products.length) {
        if (service_products.length != this.PostArray.length) {
          this.m.alert_justOK('ບໍ່ອະນຸຍາດໃຫ້ສັ່ງຊື້ສິນຄ້າປະເພດບໍລິການຮ່ວມກັບສິນຄ້າທົ່ວໄປ')
          return;
        }
      }
  
      const senditem = JSON.parse(JSON.stringify(this.PostArray));
  
      const xy = [];
      senditem.forEach(v => {
        if (v.addons?.length) {
          xy.push(...v.addons);
        }
      })
      senditem.push(...xy)
  
      // =========== Check qty of same product ===========
  
      const fir = senditem.length;
      const end = [...new Set(senditem.map(v => v?.uuid))].length;
  
      console.log(fir);
      console.log(end);
  
      const lastStocks = await this.loadLatestStock_Selected(senditem.map(v => v?.uuid), senditem[0].storeUuid);
      this.getlastStock(lastStocks);
  
      console.log(lastStocks);
  
      if (fir != end) {
  
        console.log("hello");
  
        //sum qty duplicate products
        const itemsx = [];
        senditem.forEach(v => {
          const x = itemsx.find(vx => vx?.uuid == v?.uuid);
          if (x) {
            x['qty'] += v.qty;
          } else {
            itemsx.push(JSON.parse(JSON.stringify(v)));
          }
        })
  
        // compare
        for (let i = 0; i < lastStocks.length; i++) {
          const v = lastStocks[i];
          const x = itemsx.find(vx => vx?.uuid == v.productUuid && vx.qty > v.qtt);
          if (x) {
            this.findDuplicates.push({ uuid: x?.uuid, max: v.qtt });
          }
        }
  
        if (this.findDuplicates.length) {
          console.log('findDuplicates', this.findDuplicates);
          this.m.ontoast('ມີບາງສິນຄ້າບໍ່ພຽງພໍທີ່ຈະຂາຍ !', 1000)
          // this.m.ontoast('some products not enough for sell !', 1000)
  
          this.PostArray.forEach((c, i) => {
            this.checkDuplicates(c?.uuid, i)
            for (let index = 0; index < c.addons.length; index++) {
              const element = c.addons[index];
              this.checkDuplicates(c?.uuid, i, element.uuid)
            }
          });
  
          return;
        }
  
  
      }
  
      if (this.isoutofstock) {
        // this.m.ontoast('some products not enough for sell !', 1000)
      } else {
        this.addOrderData();
      }
    }

    addOrderData() {

      let order = { order: {}, detail: Array<any>() };
      let isServiceProduct = false;
  
      const getorder = JSON.parse(JSON.stringify(this.PostArray))
  
      if (getorder[0]?.productTypes == 'ບໍລິການ') {
        isServiceProduct = true
      }
  
      for (let i = 0; i < getorder?.length; i++) {
        const v = getorder[i];
  
        //======== get total first price of product ==========
        if (v.moreDetail?.firstprice) {
          v['totalfirstprice'] = v.moreDetail.firstprice * v.qty;
        } else {
          v['totalfirstprice'] = v.total_price
        }
  
        order.detail.push({
          orderUuid: '',
          itemUuid: v?.uuid,
          quantity: v.qty,
          value: v.moreDetail.price,
          totalValue: v.total_price,
          addons: v.addons,
        })
      }
  
      order.order = {
        customerName: '',
        totalQuantity: getorder.reduce((a, b) =>a + b.qty, 0),
        totalValue: getorder.reduce((a, b) => a + b.total_price, 0),
        shipmentDetails: {
          phoneNumber: '',
          selfservice: true,
          selfservicedetail: '',
          totalfirstprice: getorder.reduce((a, b) => a + Number(b.totalfirstprice + ''), 0),
          isServiceProduct: isServiceProduct
        },
        storeUuid: JSON.parse(localStorage.getItem('store'))?.uuid
      }

      this.m.showModal(AddPhonenumberPage,{},'dialog-input-phonenumber').then(r => {
        r.present();
        r.onDidDismiss().then(res => {
          if (res.data.dismiss) {
            console.log(res.data.data);
            order.order['shipmentDetails'].phoneNumber = res.data.data
            this.m.showModal(PayQrPage,{data:order},'dialog-fullscreen').then(rx => {
              rx.present();
              rx.onDidDismiss().then(rex =>{
                if (rex.data.dismiss) {
                  
                }
              })
            })
          }
        })
      })
    }




    loadLatestStock_Selected(pArray: Array<string>, storeuuid: string): Promise<any> {
      return new Promise<any>((resolve, reject) => {
  
        let data = {
          puuid: pArray,
          owneruuid: storeuuid,
        };
  
        this.apiService.loadseconproduct(data).subscribe((res) => {
          console.log('loadLatestStock_Selected', res);
  
          if (res.status == 1) {
  
            resolve(res.data.stock);
          } else {
            resolve(null);
          }
        }, (error) => {
          reject(error);
          console.log(this, error);
        }
        );
      })
  
    }

    getlastStock(stock_list) {
      this.newStock = []
      for (let index = 0; index < stock_list.length; index++) {
        const element = stock_list[index];
        this.newStock.push(element);
      }
  
      for (let i = 0; i < this.PostArray.length; i++) {
        const e = this.PostArray[i];
        // check Stock
        const b = this.newStock.filter(v => v.productUuid == e?.uuid);
        if (b.length) {
          if (b[0].qtt <= 0) {
            e.isActive = false;
          } else {
            if (e.qty > b[0].qtt) {
              e.qty = b[0].qtt
              e.total_price = e.moreDetail.price * e.qty;
              this.m.ontoast('ມີບາງສິນຄ້າບໍ່ພຽງພໍທີ່ຈະຂາຍ !', 1000)
              // this.m.ontoast('some products not enough for sell !', 1000)
              this.isoutofstock = true
            }
          }
  
  
          e['lastStock'] = b[0].qtt
        }
  
        //loop check addon isActive and check addon Stock
        for (let j = 0; j < e.addons?.length; j++) {
          const ee = e.addons[j];
          // check Stock
          const b = this.newStock.filter(v => v.productUuid == ee?.uuid);
          if (b.length) {
            if (b[0].qtt <= 0) {
              ee.isActive = false;
            } else {
              if (ee.qty > b[0].qtt) {
                ee.qty = b[0].qtt
                ee.total_price = ee.moreDetail.price * ee.qty;
                // this.m.ontoast('some addons not enough for sell !', 1000)
                this.m.ontoast('ມີບາງສິນຄ້າບໍ່ພຽງພໍທີ່ຈະຂາຍ !', 1000)
                this.isoutofstock = true
              }
            }
  
            ee['lastStock'] = b[0].qtt
  
          }
        }
  
  
      }
    }

    checkDuplicates(puuid: string, idx: number, auuid: string = '') {


      !this.productChecked[puuid + idx + auuid] ? this.productChecked[puuid + idx + auuid] = { index: idx, duplicated: false } : '';
  
  
      const selected = this.PostArray.filter(vx => vx?.uuid == puuid);
  
      // console.log(selected);
  
      const x = this.productChecked[puuid + idx + auuid] && this.productChecked[puuid + idx + auuid]?.index == idx ? this.productChecked[puuid + idx + auuid] : null;
  
      if (auuid) {
        const addonx = [];
  
        selected.map(v => { return { addons: v.addons } }).forEach(v => {
          addonx.push(...v.addons.filter(vx => vx?.uuid == auuid));
        })
  
        const a = this.findDuplicates.find(v => v?.uuid == auuid);
        let sum = 0;
        sum = addonx.reduce((a, b) => a + b.qty, 0);
        if (a?.max < sum) {
          this.isoutofstock = true
          if (x)
            x.duplicated = true;
          return true;
        }
        else {
          if (x)
            x.duplicated = false;
          return false
        }
  
      }
  
      // console.log(this.findDuplicates);
      // console.log(selected);
  
      const a = this.findDuplicates.find(v => v?.uuid == puuid && selected.find(vx => vx.index == idx));
  
      // console.log(a);
  
      let sum = 0;
      if (selected.length)
        sum = selected?.reduce((a, b) => a + b.qty, 0);
  
      // sum more with addons
      const selected_addons = this.PostArray
      const addonx = [];
      selected_addons.map(v => { return { addons: v.addons } }).forEach(v => {
        addonx.push(...v.addons.filter(vx => vx?.uuid == puuid));
      })
      let sumAddons = 0;
      sumAddons = addonx.reduce((a, b) => a + b.qty, 0);
  
      sum += sumAddons
  
      // console.log("sumAddons", sumAddons);
      // console.log('sum', sum);
      // console.log('max', a?.max);
  
      if (a?.max < sum) {
        this.isoutofstock = true
        if (x)
          x.duplicated = true;
  
        return true
      } else {
        if (x)
          x.duplicated = false;
  
        return false
      }
    }
}
