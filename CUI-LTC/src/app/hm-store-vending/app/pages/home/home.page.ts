import { Component } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { WsapiService } from 'src/app/services/wsapi.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { LoadingService } from '../../services/loading/loading.service';
import { ApiService } from '../../services/api.service';
import { CartQrPage } from '../cart-qr/cart-qr.page';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  public cat_list: any[] = []
  categories = ['Store', 'Foods', 'Drinks', 'Fruits'];
  selectedCategory = 'Store';
  post_list: any = [];
  List_store: any = []
  public currentCategory: any
  public skip = 0

  cart: any[] = [];
  private wsalertSubscription: { unsubscribe: () => void };

  constructor(public m: LoadingService, public router: Router, public alertController: AlertController, private apiService: ApiService,
    public caching: PhotoProductService, public modalParent: ModalController, public wsapi: WsapiService
  ) { }

  ngOnInit() {
    console.log('subscribe wsalertSubscription');
    this.wsalertSubscription = this.wsapi.onWsAlert(async (r) => {
      console.log('wsalert received:', r);
      if (r) {
        try {
          localStorage.removeItem('cart')
          console.log('wsalert processing:', r);
          let topModal = await this.modalParent.getTop();
          while (topModal) {
            await topModal.dismiss();
            topModal = await this.modalParent.getTop();
          }
          console.log('All modals dismissed');
        } catch (error) {
          console.error('Error dismissing modals:', error);
        }
      }
    });
  }

  ngOnDestroy(): void {
    console.log('unsubscribe wsalertSubscription');
    this.wsalertSubscription?.unsubscribe();
  }

  ionViewWillEnter() {
    localStorage.removeItem('cart');
    this.m.updateCartCount();
    this.load_many_store();
  }

  // async loadcategory() {
  //   localStorage.setItem('skip_tag', '1')
  //   this.m.onLoading('');
  //   // this.profile.cat_selmany_apptype({type:'onlinestore'}).subscribe(async res => {
  //   this.apiService.cat_selmany().subscribe(async res => {
  //     console.log('res', res);
  //     this.cat_list = res.data.rows
  //     for (let index = 0; index < this.cat_list.length; index++) {
  //       const element = this.cat_list[index];
  //       const aa = await this.caching.saveCachingPhoto(element?.image.pic[0], new Date(element?.updatedAt), element?.id + '');
  //       element['pic'] = JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
  //       if (element.name == 'ໝາກໄມ້' || element.name == 'ຜັກ') {
  //         element['category'] = 'Fruits'
  //       } else if (element.name == 'ອາຫານ' || element.name == 'ຜັດ' || element.name == 'ອາຫານທອດ' || element.name == 'ອາຫານຍໍາ' || element.name == 'ປະເພດຕໍາ' || element.name == 'ຕົ້ມ') {
  //         element['category'] = 'Foods'
  //       } else if (element.name = 'ເຄື່ອງດື່ມ') {
  //         element['category'] = 'Drinks'
  //       } else {
  //         element['category'] = 'Store'
  //       }
  //     }
  //     setTimeout(() => {
  //       this.m.onDismiss();
  //     }, 100);
  //     console.log(this.cat_list);
  //   }, errr => {
  //     setTimeout(() => {
  //       this.m.onDismiss();
  //     }, 100);
  //     console.log('load tag error', errr);
  //   })
  // }

  async loadcategory() {
    localStorage.setItem('skip_tag', '1');
    this.m.onLoading('');
  
    this.apiService.cat_selmany().subscribe(async res => {
      console.log('res', res);
      this.cat_list = res.data.rows;
  
      // ສ້າງວຽກທັງໝົດເປັນ array
      const tasks = this.cat_list.map(async (element: any) => {
        const aa = await this.caching.saveCachingPhoto(
          element?.image.pic[0],
          new Date(element?.updatedAt),
          element?.id + ''
        );
  
        element['pic'] = JSON.parse(aa).v.replace(
          'data:application/octet-stream',
          'data:image/jpeg'
        );
  
        if (['ໝາກໄມ້', 'ຜັກ'].includes(element.name)) {
          element['category'] = 'Fruits';
        } else if (
          ['ອາຫານ', 'ຜັດ', 'ອາຫານທອດ', 'ອາຫານຍໍາ', 'ປະເພດຕໍາ', 'ຕົ້ມ'].includes(element.name)
        ) {
          element['category'] = 'Foods';
        } else if (element.name === 'ເຄື່ອງດື່ມ') {
          element['category'] = 'Drinks';
        } else {
          element['category'] = 'Store';
        }
  
        return element;
      });
  
      // ລໍຖ້າໃຫ້ວຽກທັງໝົດສໍາເລັດ
      this.cat_list = await Promise.all(tasks);
  
      this.m.onDismiss();
      console.log(this.cat_list);
    }, errr => {
      this.m.onDismiss();
      console.log('load tag error', errr);
    });
  }
  

  async load_many_store() {
    this.m.onLoading('');
    let data = {
      storeType: 'onlinestore'
    }
    this.apiService.selmany_store(data).subscribe(async res => {
      console.log('res store', res);
      this.List_store = res.data.rows
      this.currentCategory = this.List_store[0]
      localStorage.setItem('store', JSON.stringify(this.List_store[0]))

      this.load_menu_detail(this.List_store[0])
      for (let index = 0; index < this.List_store.length; index++) {
        const element = this.List_store[index];
        const aa = await this.caching.saveCachingPhoto(element?.image, new Date(element?.updatedAt), element?.id + '');
        element['pic'] = JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
      }
      setTimeout(() => {
        this.m.onDismiss();
      }, 100);
      console.log(this.cat_list);
    }, errr => {
      setTimeout(() => {
        this.m.onDismiss();
      }, 100);
      console.log('load tag error', errr);
    })
  }

  load_menu_detail(storedata) {
    console.log('====================================');
    console.log(storedata);
    console.log('====================================');
    let data = {
      storeUuid: storedata?.uuid,
      skip: this.skip
    }
    this.apiService.loadpost_bystoreuuid(data).subscribe(res => {
      console.log('post list', res);
      if (res.data?.rows?.length > 0) {
        this.m.onDismiss();
        this.post_list = res.data.rows;
        this.post_list.forEach(async x => {
          const bb = await this.caching.saveCachingPhoto(x.primaryProduct.product.image[0], new Date(x.primaryProduct.product.updatedAt), x.primaryProduct.product.id + '');
          x['pic'] = JSON.parse(bb).v.replace('data:application/octet-stream', 'data:image/jpeg');
        });
      } else {
        this.post_list = [];
      }
    }, error => {
      console.log(this, error);
    })
  }

  onClick_select_store(item) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // If cart exists and is not empty
    if (cart.length > 0 && cart[0]?.storeUuid !== item.uuid) {
      // Different store → clear cart
      localStorage.removeItem('cart');
    }

    const a = JSON.parse(JSON.stringify(item))
    a.pic = ''

    // Common logic
    localStorage.setItem('store', JSON.stringify(a))
    this.currentCategory = a;
    this.skip = 0;
    this.post_list = [];
    this.m.updateCartCount();
    this.load_menu_detail(a);
  }


  open_cart() {
    this.m.showModal(CartQrPage, {}, 'dialog-fullscreen').then((r) => {
      // this.m.showModal(CartQrPage,{},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {

          }
        });
      }
    });
  }

  Click_DetailProduct(item) {
    // this.m.showModal(DetailProductPage,{Detail_product:item},'dialog-fullscreen').then((r) => {
    //   if (r) {
    //     r.present();
    //     r.onDidDismiss().then((res) => {
    //       if (res.data.dismiss) {

    //       }
    //     });
    //   }
    // });

    console.log('====================================');
    console.log('Add to cart:', item);
    console.log('====================================');

    const cartStr = localStorage.getItem('cart');
    let cart = [];

    if (cartStr) {
      try {
        cart = JSON.parse(cartStr) || [];
      } catch (e) {
        console.error('Error parsing cart:', e);
        cart = [];
      }
    }

    const product = item.primaryProduct?.product;
    if (!product || !product.uuid) {
      this.m.onAlert('Invalid product');
      return;
    }

    // ກວດສອບວ່າມີແລ້ວບໍ
    const exists = cart.some(item => item.uuid === product.uuid);

    if (!exists) {
      let total_price = parseInt(item.primaryProduct?.product?.moreDetail.price) * 1;
      console.log('====================================');
      console.log(total_price);
      console.log('====================================');
      product['qty'] = 1
      product['total_price'] = total_price
      cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('Added new product:', product);
      this.m.updateCartCount();

      this.m.showModal(CartQrPage, {}, 'dialog-fullscreen').then((r) => {
        // this.m.showModal(CartQrPage,{},'dialog-fullscreen').then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {

            }
          });
        }
      });
    } else {
      this.m.showModal(CartQrPage, { productUuid: product.uuid }, 'dialog-fullscreen').then((r) => {
        // this.m.showModal(CartQrPage,{},'dialog-fullscreen').then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {

            }
          });
        }
      });
    }


  }

  logout() {
    this.router.navigate(['tabs/tab1']);
  }

  show_use(item) {
    if (this.currentCategory?.uuid == item.uuid) {
      return true
    } else {
      return false
    }
  }



}
