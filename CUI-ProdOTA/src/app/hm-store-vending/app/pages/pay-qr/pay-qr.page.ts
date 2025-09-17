import { Component, Input, OnInit } from '@angular/core';
import QrCodeWithLogo from 'qrcode-with-logos';
import { ModalController } from '@ionic/angular';
import { LoadingService } from '../../services/loading/loading.service';
import { ApiService } from '../../services/api.service';
import { EOrderStatus, EPaymentStatus } from '../../services/model.service';
@Component({
  selector: 'app-pay-qr',
  templateUrl: './pay-qr.page.html',
  styleUrls: ['./pay-qr.page.scss'],
  standalone: false,
})
export class PayQrPage implements OnInit {
  public qrcode_logo: any;
  private intervalId: any;
  private totalSeconds = 5 * 60; // 1 minutes
  currentColor: string = 'color-red';
  private colorInterval: any;
  countdown: string = '';
  public pic_qr_payment = '../../../assets/icon-hm-store-vending/laoqr.png';
  @Input() data: any;
  public menus:any

  info_qr_code: any;
  parseGetTotalSale: any = {} as any;
  drawCircle: Array<any> = [];
  isPayment: boolean = false;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;

  bankList: Array<any> = [
    {
      image: `../../../assets/icon-hm-store-vending/laoqr.png`,
      name: 'Lao QR',
      title: 'Lao QR (optional)',
      detail: 'Pay your orders by using Lao QR One QRCode',
      value: 'LaoQR',
    },
  ];
  paymentList: Array<any> = [...this.bankList];

  constructor(public apiService: ApiService, public m: LoadingService,public modalParent:ModalController) {}

  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
    this.makeOrder();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownDestroyTimer);
  }


  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

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
            this.m
              .alert_justOK(
                'ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321'
              )
              .then((r) => {
                if (r) {
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


  makeOrder() {
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
      totalQuantity: this.data.order.totalQuantity,
      totalValue: this.data.order.totalValue,
      paymentType: { name: 'ຈ່າຍຕົ້ນທາງ' },
      shipmentDetails: {
        orderAddress: {
          village: "",
          district: "",
          province: "",
          location: { phone: this.data?.order?.shipmentDetails?.phoneNumber },
        },
        shipmentData: { name: 'ຮັບເຄື່ອງເອງ' },
        shipment_price: 0,
        totalproprice: this.data.order.totalValue,
        totalfirstprice: this.data.order.shipmentDetails?.totalfirstprice,
        isServiceProduct: this.data.order.shipmentDetails?.isServiceProduct,
        frompos: true, // for allow store can set completed order
        isfast: true,

        // ========= for self service mode
        selfservicedetail: this.data?.order?.shipmentDetails?.selfservicedetail,
        selfservice: true,
        isvending: false
      },
      storeUuid: this.data?.order?.storeUuid,
      apptype: JSON.parse(localStorage.getItem('store'))?.storeType,
      paymentStatus: EPaymentStatus.unpaid
    }

    for (let j = 0; j < this.data.detail.length; j++) {
      const e = this.data.detail[j];
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
          "txnAmount": this.data.order?.totalValue,
          "path":"order/updateLaabOrderPaid",
        }
        this.apiService.Genmmoneyqr_market(data,res?.data?.uuid,JSON.parse(localStorage.getItem('store'))?.uuid).subscribe((r)=>{
          console.log('GenQr_market',r);
          if (r.status == 1) {
            this.m.onDismiss();
            this.genQrcode(r.data?.data)
          }else{
            this.m.onDismiss();
            this.m.alertError('ເກີດຂໍ້ຜິດພາດ...');
          }
        },error=>{
          console.log('Error',error);
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

  async close() {
    clearInterval(this.countdownDestroyTimer);
    this.m.closeModal({ dismiss: true });
    let topModal = await this.modalParent.getTop();
    while (topModal) {
      await topModal.dismiss();
      topModal = await this.modalParent.getTop();
    }
  }

  startCountdown() {
    this.updateDisplay();
    this.intervalId = setInterval(() => {
      this.totalSeconds--;
      this.updateDisplay();

      if (this.totalSeconds <= 0) {
        clearInterval(this.intervalId);
        clearInterval(this.colorInterval);
        this.countdown = 'ໝົດເວລາ!';
      }
    }, 1000);
  }

  startColorChange() {
    const colors = ['color-black', 'color-red'];
    let index = 0;

    this.colorInterval = setInterval(() => {
      this.currentColor = colors[index];
      index = (index + 1) % colors.length;
    }, 1000);
  }

  updateDisplay() {
    const minutes = Math.floor(this.totalSeconds / 60);
    const seconds = this.totalSeconds % 60;
    this.countdown = `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(val: number): string {
    return val < 10 ? '0' + val : val.toString();
  }
}
