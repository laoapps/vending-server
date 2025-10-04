import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import QrCodeWithLogo from 'qrcode-with-logos';
import { ModalController } from '@ionic/angular';
import { LoadingService } from '../../services/loading/loading.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ApiService } from '../../services/api.service';
import { EOrderStatus, EPaymentStatus } from '../../services/model.service';
@Component({
  selector: 'app-cart-qr',
  templateUrl: './cart-qr.page.html',
  styleUrls: ['./cart-qr.page.scss'],
  standalone: false
})
export class CartQrPage implements OnInit {
  @Input() productUuid = '';
  public PostArray: any = []
  public Detail_product: any = []
  public calculateFinalPrice: any
  public pic_qr_payment = '../../../assets/icon-hm-store-vending/laoqr.png';
  public pic_playstore = '../../../assets/images/playstoredownload.png';
  public pic_qr_android = '../../../assets/logo/laab_android.png';
  public pic_appstore = '../../../assets/images/icon-appstore-download.png';
  public pic_qr_ios = '../../../assets/logo/laab_ios.png';
  public pic_background = '../../../assets/icon-hm-store-vending/Season 1.png';
  drawCircle: Array<any> = [];
  parseGetTotalSale: any = {} as any;

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  videos: string[] = [
    '../../../assets/icon-hm-store-vending/vedio-show.mp4',
    '../../../assets/icon-hm-store-vending/vedio-show1.mp4'
  ];
  currentIndex = 0;

  phone: string = '';
  savedNumber: string | null = null;
  constructor(
    public m: LoadingService,
    public caching: PhotoProductService,
    public apiService: ApiService,
    public modalParent: ModalController
  ) { }

  ngAfterViewInit() {
    const player = this.videoPlayer?.nativeElement;

    // set first video
    player.src = this.videos[this.currentIndex];
    player.play();

    // when one video ends, play the next
    player.onended = () => {
      this.currentIndex = (this.currentIndex + 1) % this.videos.length;
      player.src = this.videos[this.currentIndex];
      player.play();
    };
  }

  async ngOnInit() {
    if (localStorage.getItem('cart') == null || localStorage.getItem('cart') == 'null' || localStorage.getItem('cart') == 'undefined') {
      return
    } else {
      this.load_data();
      // this.selldelivery()
    }
    console.log('====================================');
    console.log(this.PostArray);
    console.log('====================================');
  }

  autoSubmit(form: any) {
    console.log('====================================');
    console.log(this.phone);
    console.log('====================================');
    if (this.phone?.length === 8 && form.valid) {
      console.log('====================================');
      console.log('ni der');
      console.log('====================================');
      this.selldelivery();
    }
  }

  function_check_phonenumber() {
    if (!this.phone || this.phone?.length !== 8) {
      return false
    } else {
      return true
    }
  }
  // [{
  //   "id": 2, "mrp": "", "pic": "", "sku": "1758698178213", "name": "ຕຳຫມາກຮຸ່ງ", "spec":
  //     { "high": 1, "long": 1, "wide": 1, "weight": 1 },
  //   "tags": null, "unit": "",
  //   "uuid": "f45268ef-3dac-48e6-a565-d1f17dda1588", "brand": null,
  //   "image": ["716d5f4ee32439addb5530d71f1acb43"], "ismrp": false, "isActive": true,
  //   "createdAt": "2025-09-24T07:17:18.595Z", "productSN": null,
  //   "storeType": "onlinestore",
  //   "storeUuid": "77e3f140-db0a-4433-af16-704fc9577cd8",
  //   "updatedAt": "2025-09-24T07:17:18.596Z",
  //   "moreDetail": { "qtty": "99999", "price": 45000, "firstprice": 45000 }, "description": "", "productCode": null, "manufacturer": null, "productTypes": "ອື່ນໆ", "qty": 1, "total_price": 45000
  // }]
  async load_data() {
    this.PostArray = JSON.parse(localStorage.getItem('cart'));
    console.log('CART DATA', JSON.stringify(this.PostArray));

    console.log(this.productUuid);

    for (let i = 0; i < this.PostArray.length; i++) {
      const e = this.PostArray[i];
      if (this.productUuid) {
        if (e.uuid == this.productUuid) {
          await this.getqty(1, i);
        }
      }
      const aa = await this.caching.saveCachingPhoto(e?.image[0], new Date(e?.updatedAt), e?.id + '');
      e['pic'] = JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
    }
  }

  ionViewWillEnter() {
    this.m.updateCartCount();
    // this.genQrcode();
    // this.load_vat();
  }




  makeOrder(i) {
    let order = {
      order: {},
      detail: []
    }

    if (!JSON.parse(localStorage.getItem('store')) || JSON.parse(localStorage.getItem('store')) == null) {
      this.m.alertError('store not found!!')
      return
    }

    order.order = {
      orderStatus: EOrderStatus.accepted,
      customerName: "",
      customerToken: "",
      totalQuantity: i.order.totalQuantity,
      totalValue: i.order.totalValue,
      paymentType: { name: 'ຈ່າຍຕົ້ນທາງ' },
      shipmentDetails: {
        orderAddress: {
          village: "",
          district: "",
          province: "",
          location: { phone: this.phone || '' },
        },
        shipmentData: { name: 'ຮັບເຄື່ອງເອງ' },
        shipment_price: 0,
        totalproprice: i.order.totalValue,
        totalfirstprice: i.order.shipmentDetails?.totalfirstprice,
        isServiceProduct: i.order.shipmentDetails?.isServiceProduct,
        frompos: true, // for allow store can set completed order
        isfast: true,

        // ========= for self service mode
        selfservicedetail: i?.order?.shipmentDetails?.selfservicedetail,
        selfservice: true,
        isvending: false
      },
      storeUuid: i?.order?.storeUuid,
      apptype: JSON.parse(localStorage.getItem('store'))?.storeType,
      paymentStatus: EPaymentStatus.unpaid
    }

    for (let j = 0; j < i.detail.length; j++) {
      const e = i.detail[j];
      order.detail.push({
        orderUuid: '',
        itemUuid: e.itemUuid,
        quantity: e.quantity,
        value: e.value,
        totalValue: e.totalValue,
        addons: e.addons,
      })
    }

    console.log(order);
    // return
    this.apiService.changeQuotationsToOrder(order).subscribe(res => {
      console.log('changeQuotationsToOrder', res);
      if (res.status) {
        const data = {
          "txnAmount": i.order?.totalValue,
          "path": "order/updateLaabOrderPaid",
        }
        localStorage.setItem('vending', 'true')
        this.apiService.Genmmoneyqr_market(data, res?.data?.uuid, JSON.parse(localStorage.getItem('store'))?.uuid).subscribe((r) => {
          console.log('GenQr_market', r);
          if (r.status == 1) {
            this.m.onDismiss();
            this.genQrcode(r.data?.data)
          } else {
            this.m.onDismiss();;
            this.m.alertError('ເກີດຂໍ້ຜິດພາດ...');
          }
        }, error => {
          console.log('Error', error);
          this.m.onDismiss();
          this.m.alertError('ເກີດຂໍ້ຜິດພາດ...');
        })
      } else {
        this.m.ontoast('crate order fail!!', 1000)
      }
      this.m.onDismiss();
    }, error => {
      this.m.ontoast('crate order fail!!', 1000)
      console.log(error);
      this.m.onDismiss();
    })
  }







  public qrcode_logo: any;
  isPayment: boolean = false;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;
  genQrcode(data) {
    // this.load.onLoading('')
    let qrcode = new QrCodeWithLogo({
      content: data.emv,
      width: 250,
      logo: {
        src: this.pic_qr_payment,
        logoRadius: 10, // Optional: adjust for rounded corners
        borderRadius: 5, // Optional: adjust for border
        borderColor: '#ff00000', // Optional: white border
        borderWidth: 3, // Optional: border width
        bgColor: '#ffffff', // Optional: background color
        crossOrigin: 'Anonymous', // Optional: for CORS
      },
    });
    qrcode
      .getCanvas()
      .then((canvas) => {
        // this.load.onDismiss()
        this.qrcode_logo = canvas.toDataURL();
        // or do other things with image
        this.isPayment = true;
        this.countdownDestroyTimer = setInterval(async () => {
          this.countdownDestroy--;
          if (this.countdownDestroy <= 0) {
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            this.close();
            this.m.alert_justOK('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321').then((r) => {
                if (r) {
                  this.isPayment = false
                  this.phone = ""
                  this.close();
                }
              });
          }
        }, 1000);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  async close() {
    localStorage.removeItem('vending')
    clearInterval(this.countdownDestroyTimer);
    this.m.closeModal({ dismiss: true });
    let topModal = await this.modalParent.getTop();
    while (topModal) {
      await topModal.dismiss();
      topModal = await this.modalParent.getTop();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownDestroyTimer);
  }

  Click_DetailProduct(item) {

  }
  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClickBuy() {
    // let qty = this.PostArray?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    // let total = this.PostArray?.reduce((sum, item) => sum + ((item.total_price || 0)), 0) || 0;
    // this.m.showModal(PayQrPage,{Detail_product:this.PostArray,qty,total},'dialog-fullscreen').then((r) => {
    //   if (r) {
    //     r.present();
    //     r.onDidDismiss().then((res) => {
    //       if (res.data.dismiss) {
    //       }
    //     });
    //   }
    // });
  }

  CeilValue(val: number): number {
    return Math.ceil(val);
  }



  //==========


  Click_AddNew() {
    this.m.closeModal({ dismiss: false })
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
      if (cart.length != 0) {
        clearInterval(this.countdownDestroyTimer);
        this.load_data();
        this.m.updateCartCount();
      } else {
        this.m.updateCartCount();
        this.m.closeModal({ dismiss: false })
        clearInterval(this.countdownDestroyTimer);
      }
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
      // this.selldelivery();
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
      // this.selldelivery();
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
    // if (this.isPayment == true) {
    //   this.isPayment = false
    // }
    clearInterval(this.countdownDestroyTimer);
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
      totalQuantity: getorder.reduce((a, b) => a + b.qty, 0),
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

    this.makeOrder(order)

    // this.m.showModal(AddPhonenumberPage,{},'dialog-input-phonenumber').then(r => {
    //   r.present();
    //   r.onDidDismiss().then(res => {
    //     if (res.data.dismiss) {
    //       console.log(res.data.data);
    //       order.order['shipmentDetails'].phoneNumber = res.data.data
    //       this.m.showModal(PayQrPage,{data:order},'dialog-fullscreen').then(rx => {
    //         rx.present();
    //         rx.onDidDismiss().then(rex =>{
    //           if (rex.data.dismiss) {

    //           }
    //         })
    //       })
    //     }
    //   })
    // })
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
