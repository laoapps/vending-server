import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, GestureController, IonModal, ModalController } from '@ionic/angular';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { LoadingService } from '../../services/loading/loading.service';
import { ApiService } from '../../services/api.service';
import { IProduct, IProductStocks } from '../../services/model.service';

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.page.html',
  styleUrls: ['./detail-product.page.scss'],
  standalone:false
})
export class DetailProductPage implements OnInit {
  public image = '../../../assets/icon-hm-store-vending/image.png'
  PostArray: any = [];
  @Input() Detail_product: any;
  // quantity: number = 1;
  public qty: number = 1;

  public propData0 = new Array<string>();
  public propData1 = new Array<string>();
  public specProperty = new Array<string>();
  public firSel: string = '';
  public secSel: string = '';
  public isProductSelected = true;
  public productStocks: IProductStocks;
  public minMax = '';
  public selectedProduct: IProduct;
  public minSel: string = '';
  public minPhoto: any = [];

  ngOnInit() {
    console.log('====================================');
    console.log(this.Detail_product);
    console.log('====================================');
    // this.loadpost_byproducttype_apptype(this.Detail_product?.name)

    if (this.Detail_product.secondaryProducts?.length > 0) {
      console.log('have secondary');

      const puuid = [];
      puuid.push(
        ...this.Detail_product.secondaryProducts.map((x) => {
          return x.productUuid;
        })
      );

      puuid.push(this.Detail_product.primaryProduct.product?.uuid);

      this.loadProductStocks(puuid);
    } else {
      console.log('have no secondary');

      // this.setProductSelection();

      this.loadLastestPrimaryStocks([this.Detail_product.primaryProduct?.product?.uuid]);
    }
  }

  ionViewWillEnter() {
    this.m.updateCartCount();
  }

  loadLastestPrimaryStocks(pArray: Array<string>) {
    let data = {
      puuid: pArray,
      owneruuid: this.Detail_product.ownerUuid,
    };

    this.apiService.loadseconproduct(data).subscribe(res => {
      console.log('loadLastestPrimaryStocks', res);
      this.Detail_product.primaryProduct.product.isActive = res.data.product[0].isActive;
      this.Detail_product.primaryProduct.product.moreDetail.qtty = res.data.stock[0].qtt;
      this.Detail_product.primaryProduct.inventory = res.data.stock[0];
      this.setProductSelection();
      console.log(this.Detail_product);
    }, error => {
      console.log(this, error);
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  constructor(public m: LoadingService,public router:Router,public alertController:AlertController,private apiService: ApiService,
    public caching:PhotoProductService,    public modalParent: ModalController,
  ) {}



  getQty(action: string) {
    console.log("asdasdasd");

    if (action == '+') {
      // if (this.qty < (this.getStockByProductUuid(this.selectedProduct?.uuid)?.qtt)) {

        this.qty += 1;
      // }
    } else if (action == '-') {
      if (this.qty > 1) {
        this.qty -= 1;
      }
    }
  }


  async loadpost_byproducttype_apptype(t: string) {
    localStorage.setItem('skip', '0')
    this.m.ontoast_fix('ກຳລັງໂຫລດຂໍ້ມູນ...');
    this.apiService.loadpost_byproducttype(t).subscribe(async res => {
      console.log('res of sarch', res);

      if (res.data.rows.length) {
        this.PostArray = res.data.rows;
        // this.count = res.data.count;
        for (let index = 0; index < this.PostArray.length; index++) {
          const element = this.PostArray[index];

          const aa = await this.caching.saveCachingPhoto(element.primaryProduct?.product?.image[0], new Date(element.primaryProduct?.product?.updatedAt), element.primaryProduct?.product?.id + '');
          element['pic'] = JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
        }
      } else {
        // this.isnull = 'yes';
        this.PostArray = [];

      }
      setTimeout(() => {
        this.m.onDismiss_toast();
      }, 1000);

    }, error => {
      console.log('error', error);
      setTimeout(() => {
        this.m.onDismiss_toast();
      }, 1000);
      // this.isnull = 'yes';


    })
  }

  onClickBuy(){
    // this.m.showModal(PayQrPage,{Detail_product:this.Detail_product,qty:this.qty},'dialog-fullscreen').then((r) => {
    //   if (r) {
    //     r.present();
    //     r.onDidDismiss().then((res) => {
    //       if (res.data.dismiss) {
    //       }
    //     });
    //   }
    // });
  }




  // =====================

  showtext() {
    if (this.selectedProduct) {
      if (Object.keys(this.selectedProduct).length == 0) {
        return true;
      }
    }
    return false;
  }

  showgetQty() {
    if (this.selectedProduct) {
      // console.log(this.selectedProduct,this.productStocks.stock.find(v=>v.productUuid==this.selectedProduct?.uuid));

      return !(this.selectedProduct.isActive && this.productStocks.stock.find(v => v.productUuid == this.selectedProduct?.uuid)?.qtt > 0)

      // if (Object.keys(this.selectedProduct).length == 0) {
      //   return true;
      // }
    }

    return false;
  }

  isAvailablePropData0(p: string) {
    if (this.specProperty.length == 2) {
      if (!this.secSel) return true;
      return this.productStocks.product.find(
        (v) =>
          (v.moreDetail.data[1] == p && v.moreDetail.data[0] == this.secSel) ||
          (v.moreDetail.data[0] == p && v.moreDetail.data[1] == this.secSel)
      );
    }
    return true;
  }

  getSelected1(v: string) {
    return v == this.secSel ? 'light' : '';
  }

  getSelected0(v: string) {
    return v == this.firSel ? 'light' : '';
  }

  showImageByPropData1(v: string) {
    this.minSel = '';

    if (!this.secSel || this.secSel != v) {
      this.secSel = v;
    } else this.secSel = '';
    this.setProductSelection();
  }

  async setProductSelection() {
    console.log("before", this.selectedProduct);
    console.log("specProperty", this.specProperty);

    if (this.specProperty.length == 2) {
      if (this.secSel && this.firSel) {
        this.selectedProduct = this.productStocks?.product?.find((v) => {
          return (
            (v.moreDetail.data[0] == this.firSel &&
              v.moreDetail.data[1] == this.secSel) ||
            (v.moreDetail.data[1] == this.firSel &&
              v.moreDetail.data[0] == this.secSel)
          );
        });
      } else {
        this.selectedProduct = {} as IProduct;
      }
    } else if (this.specProperty.length == 1) {
      if (this.firSel) {
        this.selectedProduct = this.productStocks?.product?.find((v) => {
          return v.moreDetail.data == this.firSel;
        });
      } else {
        this.selectedProduct = {} as IProduct;
      }
    } else {
      console.log("aaa");

      this.productStocks = {
        product: [this.Detail_product.primaryProduct.product],
        stock: [this.Detail_product.primaryProduct.inventory],
      } as IProductStocks;

      this.selectedProduct = this.Detail_product.primaryProduct.product;
      this.selectedProduct['pic'] = this.Detail_product['pic'];
    }
    console.log(this.selectedProduct);
    console.log(this.isProductSelected);
    this.isProductSelected = true;
    this.qty = 1;
  }

  isAvailablePropData1(p: string) {
    if (this.specProperty.length == 2) {
      if (!this.firSel) return true;
      return this.productStocks.product.find(
        (v) =>
          (v.moreDetail.data[1] == p && v.moreDetail.data[0] == this.firSel) ||
          (v.moreDetail.data[0] == p && v.moreDetail.data[1] == this.firSel)
      );
    }
    return true;
  }


  showImageByPropData0(v: string) {
    this.minSel = '';
    if (!this.firSel || this.firSel != v) {
      this.firSel = v;
    } else this.firSel = '';
    this.setProductSelection();
  }

  loadProductStocks(pArray: Array<string>) {
    // w=true;
    // if(w){
    //   const t = setInterval(() => {

    //     clearInterval(t)
    //   }, 3000);
    // }else
    let data = {
      puuid: pArray,
      owneruuid: this.Detail_product.ownerUuid,
    };

    this.apiService.loadseconproduct(data).subscribe(
      (res) => {
        console.log('load seconProduct', res);

        const x = res.data as IProductStocks;

        const y = { stock: [], product: [] } as IProductStocks;

        pArray.forEach(v => {

          y.product.push(x.product.find(vx => vx?.uuid == v));
          y.stock.push(x.stock.find(vx => vx.productUuid == v));
        })

        this.productStocks = y;

        const lastestStock = this.productStocks.stock.find(v => v.productUuid == this.Detail_product.primaryProduct.product?.uuid);
        if (lastestStock) {
          this.Detail_product.primaryProduct.inventory.qtt = lastestStock.qtt;
          this.Detail_product.primaryProduct.product.moreDetail.qtty = lastestStock.qtt;
        }

        const lastestActive = this.productStocks.product.find(v => v?.uuid == this.Detail_product.primaryProduct.product?.uuid);
        if (lastestActive) {
          this.Detail_product.primaryProduct.product.isActive = lastestActive.isActive;
        }
        this.minSel = this.productStocks.product[this.productStocks.product.length - 1]?.uuid;

        this.productStocks.product.forEach((v) => {
          if (v.moreDetail.prop) this.specProperty.push(...v.moreDetail.prop);
        });
        if (this.specProperty.length)
          this.specProperty = [...new Set(this.specProperty)];

        this.productStocks.product.forEach(async (v) => {
          if (Array.isArray(v.moreDetail.data)) {
            this.propData0.push(v.moreDetail.data[0]);
          } else {
            this.propData0.push(v.moreDetail.data);
          }

          // if (v['pic'] == '') {
          const aa = await this.caching.saveCachingPhoto(
            v.image,
            new Date(v.updatedAt),
            v.id + ''
          );
          v['pic'] = JSON.parse(aa).v.replace(
            'data:application/octet-stream',
            'data:image/jpeg'
          );
          // }
        });
        this.propData0 = [...new Set(this.propData0)];

        if (this.specProperty.length > 1) {
          this.productStocks.product.forEach((v) => {
            if (Array.isArray(v.moreDetail.data))
              this.propData1.push(v.moreDetail.data[1]);
            else this.propData1.push(v.moreDetail.data);
          });
          this.propData1 = [...new Set(this.propData1)];
        }
        this.setDefaultProductSelection();
        console.log(this.productStocks.product);
      },
      (error) => {
        console.log(this, error);
      }
    );
  }

  setDefaultProductSelection() {

    const a = this.productStocks.product.filter(v => v.isActive && this.productStocks.stock.find(vx => vx.qtt > 0 && v?.uuid == vx.productUuid));

    if (!a.length) {

      this.selectedProduct = {} as IProduct;
      // this.isProductSelected =false;
      return;
    }
    const p = a[a.length - 1];

    if (this.specProperty.length == 2) {
      this.firSel = p.moreDetail.data[0];
      this.secSel = p.moreDetail.data[1];
    } else if (this.specProperty.length == 1) {
      this.firSel = p.moreDetail.data;
    }

    this.isProductSelected = true;
    this.selectedProduct = p;
  }

  selectMiniPhoto(uuid: string) {
    this.minSel = uuid;
    this.isProductSelected = false;
    this.minPhoto = this.productStocks.product.find(
      (v) => v?.uuid == uuid
    ).pic;

    // console.log(this.minPhoto);


    // this.minPhoto = this.productStocks.product.find(
    //   (v) => v?.uuid == uuid
    // ).image;
  }

  onClick_add_cart() {
    console.log('====================================');
    console.log('Add to cart:', this.Detail_product);
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
  
    const product = this.Detail_product?.primaryProduct?.product;
    if (!product || !product.uuid) {
      this.m.onAlert('Invalid product');
      return;
    }
  
    // ກວດສອບວ່າມີແລ້ວບໍ
    const exists = cart.some(item => item.uuid === product.uuid);
  
    if (!exists) {
      let total_price = parseInt(this.Detail_product.primaryProduct?.product?.moreDetail.price) * this.qty;
      console.log('====================================');
      console.log(total_price);
      console.log('====================================');
      product['qty']= this.qty
      product['total_price'] = total_price
      cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('Added new product:', product);
      this.m.updateCartCount();
      this.m.closeModal({ dismiss: false });
    } else {
      this.m.onAlert('Product already in cart');
    }
  }
  


}
