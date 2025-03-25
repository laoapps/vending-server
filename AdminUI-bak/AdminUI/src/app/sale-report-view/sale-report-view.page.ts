import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-sale-report-view',
  templateUrl: './sale-report-view.page.html',
  styleUrls: ['./sale-report-view.page.scss'],
})
export class SaleReportViewPage implements OnInit {

  @Input() machineId: string;
  @Input() currentdate: string;
  @Input() list: any;
  @Input() saleDetailList: Array<any>;

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

  filterList: Array<any> = [];
  filterListShow: Array<any> = [];
  filterListGroup: Array<any> = [];
  btnList: Array<any> = [];
  count: number = 0;
  page: number = 1;
  limit: number = 10;

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadFilter();
  }

  loadFilter(): void {
    if (this.saleDetailList != undefined && Object.entries(this.saleDetailList).length > 0) {
      const parseList = JSON.parse(JSON.stringify(this.saleDetailList));
      this.filterList = parseList.filter(item => item.stock.id == this.list.stock.id);
      console.log(`ff`, this.filterList);
      
      for(let i = 0; i < this.filterList.length; i++) {
        this.filterList[i].stock.total = 0;
        this.filterList[i].stock.total = this.filterList[i].stock.qtty * this.filterList[i].stock.price;
      }
      this.count = this.filterList.length;
      const totalPage = Math.ceil(this.count / this.limit);
      this.btnList = this.apiService.paginations(this.page, totalPage);

      if (this.filterList != undefined && this.filterList.length > this.limit) {
        for(let i = 0; i < this.limit; i++) {
          this.filterListShow.push(this.filterList[i]);
        }
      } else {
        for(let i = 0; i < this.filterList.length; i++) {
          this.filterListShow.push(this.filterList[i]);
        }
      }
      for(let i = 0; i < this.filterList.length; i+=this.limit) {
        const data = this.filterList.slice(i, i + this.limit);
        this.filterListGroup.push(data);
      }

    }
  }

  managePage(page: number) {
    let selected = page - 1;
    this.filterListShow = this.filterListGroup[selected];
    const totalPage = Math.ceil(this.filterList.length / this.limit);
    this.btnList = this.apiService.paginations(page, totalPage);
  }


}
