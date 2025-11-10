import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IENMessage } from '../models/base.model';
import { LoadVendingMachineSaleBillReportProcess } from '../sale/processes/loadVendingMachineBillReport.process';
import { EMessage } from '../services/syste.model';

@Component({
  selector: 'app-billnot-paid',
  templateUrl: './billnot-paid.page.html',
  styleUrls: ['./billnot-paid.page.scss'],
})
export class BillnotPaidPage implements OnInit {


  @Input() machineId: string;
  @Input() otp: string;
  @Input() ownerUuid: string;


  private workload: any = {} as any;


  datetimeCustom: boolean = true;
  moredatetimeCustom: boolean = false;
  display: boolean = false;


  fromDate: string;
  toDate: string;

  currentdate: string = '';
  sum_qtty: number = 0;
  sum_total: number = 0;

  saleSumerizeList: Array<any> = [];

  private token: string


  exportOptions: Array<any> = [
    {
      icon: 'fa-solid fa-file-pdf text-danger',
      text: 'Export PDF'
    },
    {
      icon: 'fa-solid fa-file-excel text-success',
      text: 'Export Excel'
    }
  ];

  constructor(
    public apiService: ApiService
  ) {

  }

  ngOnInit() {
    this.toggleButtons();
    this.token = localStorage.getItem('lva_token');
  }

  close() {
    this.apiService.modal.dismiss();
  }

  toggleButtons() {
    const btns = (document.querySelectorAll('.section-buttons .item') as NodeListOf<HTMLHRElement>);
    btns.forEach((item, index) => {
      item.addEventListener('click', event => {
        item.classList.add('active');
        btns.forEach((obj, oindex) => {
          if (index != oindex) {
            obj.classList.remove('active');
          }
        });
      });
    });
  }

  displayDateTimeCustom() {
    if (this.datetimeCustom == false) {
      this.datetimeCustom = true;
      this.moredatetimeCustom = false;
      this.clearInput();
    }
  }
  displayMoreDateTimeCustom() {
    if (this.moredatetimeCustom == false) {
      this.datetimeCustom = false;
      this.moredatetimeCustom = true;
      this.clearInput();
    }
  }
  clearInput() {
    this.fromDate = undefined;
    this.toDate = undefined;
  }


  process(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        // this.lists = [];
        this.display = false;

        let params: any = {} as any;
        if (this.datetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.fromDate,
            machineId: this.machineId
          }
          this.currentdate = this.fromDate;

        } else if (this.moredatetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.toDate,
            machineId: this.machineId
          }
          this.currentdate = `From ${this.fromDate} to ${this.toDate}`;

        }

        const paramsData = {
          fromDate: this.fromDate,
          toDate: this.toDate,
          machineId: this.machineId,
          ownerUuid: this.ownerUuid,
          token: this.token
        }
        this.workload = this.apiService.load.create({ message: 'loading...' });
        (await this.workload).present();
        this.apiService.loadVendingMachineBillNotPaid(paramsData).subscribe(async r => {
          (await this.workload).dismiss();
          const response: any = r;
          console.log('response', response);

          if (response.status != 1) throw new Error(response.message);


          this.saleSumerizeList = response.data.rows;
          console.log('Data', this.saleSumerizeList);
          this.display = true;
          resolve('success');
        }, async error => {
          (await this.workload).dismiss();
          this.apiService.simpleMessage(error.message);
          resolve(error.message);
        });
        // console.log('=====> run', run);



      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  SendDrop(transactionID: string, bankname: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const paramsData = {
          transactionID: transactionID,
          ownerUuid: this.ownerUuid,
          token: this.token,
          bankname: bankname
        }
        this.apiService.sendDropBill(paramsData).subscribe(async r => {
          const response: any = r;
          // console.log('response', response.data.status);
          if (response?.data?.status === 1) {
            resolve(EMessage.succeeded);
          } else {
            resolve(EMessage.error);
          }

        })
      } catch (error) {
        console.log('error', error);
        resolve(EMessage.error);
      }
    });

  }

  CheckPaid(transactionID: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const paramsData = {
          transactionID: transactionID,
          token: this.token
        }
        this.apiService.CheckBillPaidFromMmoney(paramsData).subscribe(async r => {
          const response: any = r;
          console.log('response', response.status);
          if (response.status == 1) {
            this.apiService?.alert.create({
              header: 'Paid',
              message: 'ຈ່າຍເງິນແລ້ວ',
              buttons: [
                {
                  text: 'OK',
                  handler: () => {
                    console.log('Confirm Okay');
                  }
                },
                // {
                //   text: 'ສັ່ງເຄື່ອງຕົກ',
                //   handler: () => {
                //     // console.log('Confirm Okay');
                //     this.SendDrop(transactionID,);
                //   }
                // },
              ]
            }).then(alert => {
              alert.present();
            });
          } else {
            this.apiService?.alert.create({
              header: 'Unpaid',
              message: 'ຍັງບໍ່ທັນໄດ້ຈ່າຍເງິນ',
              buttons: [
                {
                  text: 'OK',
                  handler: () => {
                    console.log('Confirm Okay');
                  }
                }
              ]
            }).then(alert => {
              alert.present();
            });
          }
        });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


  SendDropBill(transactionID: string, index: number) {
    this.apiService?.alert.create({
      header: 'Paid',
      inputs: [
        {
          name: 'bankname',
          type: 'text',
          placeholder: 'ຊື່ທະນາຄານ',
        },
        {
          name: 'textConfirm',
          type: 'text',
          placeholder: 'ຂໍ້ຄວາມຢືນຢັນ',
        },
      ],
      buttons: [
        {
          text: 'ຍົກເລີກ',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'ຕົກລົງ',
          handler: async (data) => {
            if (!data.bankname || !data.textConfirm) {
              console.log('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ');
              return false; // ไม่ปิด Alert
            }
            if (data.textConfirm != 'confirm') {
              return false;
            }
            // console.log('Bank Name:', data.bankname);
            // console.log('Text Confirm:', data.textConfirm);
            this.apiService.showLoading();
            const run = await this.SendDrop(transactionID, data.bankname);
            if (run != EMessage.succeeded) {
              this.apiService.toast.create({
                message: 'ຍິງເຄື່ອງຕົກບໍ່ສໍາເລັດ',
                duration: 2000
              }).then(toast => toast.present());
            } else {
              this.apiService.toast.create({
                message: 'ຍິງເຄື່ອງຕົກສໍາເລັດ',
                duration: 2000
              }).then(toast => toast.present());
            }
            this.saleSumerizeList.splice(index, 1);
            this.apiService.dismissLoading();
            return true;
          },
        },
      ]
    }).then(alert => {
      alert.present();
    });
  }

}
