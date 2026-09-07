import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-admin-product-showcase',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './admin-product-showcase.page.html',
  styleUrls: ['./admin-product-showcase.page.scss'],
})
export class AdminProductShowcasePage implements OnInit {
  stocks: any[] = [];
  selected: any = null;
  form: any = this.empty();
  saving = false;

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  empty() {
    return {
      stockId: null,
      title: '',
      html: '',
      story: '',
      price: 0,
      video: '',
      photos: [] as string[],
      holdMs: 10000,
      videoMs: 12000,
      isActive: true,
    };
  }

  async loadStocks() {
    try {
      const rx: any = await this.api.http.post(this.api.url + 'listStock', {}).toPromise?.()
        || await (this.api as any).listStock?.();
      this.stocks = rx?.data || rx || [];
    } catch {
      this.stocks = [];
    }
  }

  pick(st: any) {
    this.selected = st;
    this.form = this.empty();
    this.form.stockId = st.id;
    this.form.title = st.name;
    this.form.price = st.price;
    this.loadOne(st.id);
  }

  async loadOne(stockId: number) {
    try {
      const rx: any =  this.api.post('productShowcaseList',{ stockId });
      const row = (rx?.data || [])[0];
      if (row) this.form = { ...this.empty(), ...row, photos: row.photos || [] };
    } catch {}
  }

  async save() {
    if (!this.form.stockId) return;
    this.saving = true;
    try {
      await this.api.post('productShowcaseSave', { data: this.form });
    } finally {
      this.saving = false;
    }
  }

  addPhoto(hash: string) {
    if (hash) this.form.photos = [...(this.form.photos || []), hash];
  }

  removePhoto(i: number) {
    this.form.photos = this.form.photos.filter((_, x) => x !== i);
  }
}