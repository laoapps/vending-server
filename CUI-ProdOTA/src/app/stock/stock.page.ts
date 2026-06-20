import { Component, Input, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;

  stock: Array<IStock> = [];
  selectedItem: IStock;
  url = this.apiService.url;
  search = '';

  // Scrollbar properties
  scrollTop = 0;
  contentHeight = 0;
  viewHeight = 0;
  thumbHeight = 0;
  thumbTop = 0;
  isDragging = false;
  startY = 0;
  startThumbTop = 0;
  scrollInterval: any;

  constructor(public apiService: ApiService) {
    this.stock = apiService.stock;
    console.log('-----> STOCK :', this.stock);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateScrollbar();
    }, 1000);
  }

  async onScroll(event: any) {
    this.scrollTop = event.detail.scrollTop;
    await this.updateScrollbar();
  }

  async updateScrollbar() {
    if (!this.content) return;
    const scrollElement = await this.content.getScrollElement();
    if (!scrollElement) return;

    this.contentHeight = scrollElement.scrollHeight;
    this.viewHeight = scrollElement.clientHeight;

    if (this.contentHeight > this.viewHeight) {
      this.thumbHeight = Math.max((this.viewHeight / this.contentHeight) * this.viewHeight, 40);
      const scrollableHeight = this.contentHeight - this.viewHeight;
      const trackHeight = (this.viewHeight - 120) - this.thumbHeight; // Account for buttons (50px each + margins)
      this.thumbTop = (this.scrollTop / scrollableHeight) * trackHeight;
    } else {
      this.thumbHeight = 0;
    }
  }

  startScrollUp() {
    this.stopScroll();
    this.scrollInterval = setInterval(() => {
      this.content.scrollByPoint(0, -100, 100);
    }, 100);
  }

  startScrollDown() {
    this.stopScroll();
    this.scrollInterval = setInterval(() => {
      this.content.scrollByPoint(0, 100, 100);
    }, 100);
  }

  stopScroll() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  startDragging(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startY = (event instanceof MouseEvent) ? event.pageY : event.touches[0].pageY;
    this.startThumbTop = this.thumbTop;
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDragging(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const currentY = (event instanceof MouseEvent) ? event.pageY : event.touches[0].pageY;
    const deltaY = currentY - this.startY;
    const trackHeight = (this.viewHeight - 120) - this.thumbHeight;
    let newThumbTop = this.startThumbTop + deltaY;

    newThumbTop = Math.max(0, Math.min(newThumbTop, trackHeight));
    this.thumbTop = newThumbTop;

    const scrollableHeight = this.contentHeight - this.viewHeight;
    const targetScrollTop = (this.thumbTop / trackHeight) * scrollableHeight;
    this.content.scrollToPoint(0, targetScrollTop, 0);
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopDragging() {
    this.isDragging = false;
  }

  select(id: number) {
    this.selectedItem = this.stock.find(v => v.id == id);
    console.log('select', this.selectedItem);
    this.apiService.dismissModal(this.selectedItem)
  }
  close() {
    if (!this.selectedItem) return alert('Selecte on item please!');
    console.log(this.selectedItem);
    this.apiService.dismissModal(this.selectedItem)
  }
  removeStock(id: number) {
    const conf = confirm('Are you sure');
    if (!conf) return;
    const p = prompt('Type 123456');
    if (p !== '123456') return;
    const idx = this.apiService.stock.findIndex(v => v.id == id);
    if (idx != -1) {
      this.apiService.stock.splice(idx, 1);
      this.apiService.updateStockItems(this.apiService.stock);
    }
  }
  doFilter() {
    if (this.search)
      this.stock = this.apiService.stock.filter(v => v.name.toLowerCase().includes(this.search.toLowerCase()));
    else this.stock = this.apiService.stock;

    setTimeout(() => this.updateScrollbar(), 300);
  }
  ngOnInit() {
  }

  ngOnDestroy() {
    this.stopScroll();
  }

}
