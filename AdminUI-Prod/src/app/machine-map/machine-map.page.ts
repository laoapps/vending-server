import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';

declare const L: any;

interface MapMachine {
  machineId: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'Online' | 'Broken' | 'Unknown';
  owner: string;
  qtyToday: number;
  amountToday: number;
}

const HIDDEN_STORAGE_KEY = 'machineMapHiddenIds';

@Component({
  selector: 'app-machine-map',
  templateUrl: './machine-map.page.html',
  styleUrls: ['./machine-map.page.scss'],
})
export class MachineMapPage implements AfterViewInit, OnDestroy {
  private map: any;
  private markersLayer: any;
  private hiddenIds = new Set<string>();
  private salesUpdateSub?: Subscription;
  private todaySalesByMachine = new Map<string, { qtyToday: number; amountToday: number }>();
  private todaySalesHydrated = false;

  machines: MapMachine[] = [];
  listFilter = '';
  missingCount = 0;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    public apiService: ApiService,
    private ngZone: NgZone,
  ) {
    this.hiddenIds = this.loadHiddenIds();
  }

  get filteredMachines(): MapMachine[] {
    const q = this.listFilter.trim().toLowerCase();
    if (!q) return this.machines;
    return this.machines.filter(
      (m) =>
        m.machineId.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q),
    );
  }

  get visibleCount(): number {
    return this.machines.filter((m) => this.isVisible(m.machineId)).length;
  }

  get totalQtyToday(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.qtyToday) || 0), 0);
  }

  get totalAmountToday(): number {
    return this.machines.reduce((sum, m) => sum + (Number(m.amountToday) || 0), 0);
  }

  ngAfterViewInit() {
    this.initPage();
    this.hydrateTodaySalesOnce();
    this.salesUpdateSub = this.apiService.wsapi.salesUpdateSubscription.subscribe((payload) => {
      if (!payload?.machineId) return;
      this.ngZone.run(() => {
        this.applyTodaySalesUpdate(payload.machineId, payload.qtyToday, payload.amountToday);
      });
    });
  }

  ngOnDestroy() {
    this.salesUpdateSub?.unsubscribe();
    this.destroyMap();
  }

  goBack() {
    this.router.navigate(['/onlinemachines']);
  }

  async refresh() {
    await this.loadMachines();
    this.applyTodaySalesToList();
    this.renderMarkers();
  }

  formatAmount(amount?: number): string {
    return (Number(amount) || 0).toLocaleString('en-US');
  }

  isVisible(machineId: string): boolean {
    return !this.hiddenIds.has(machineId);
  }

  toggleMachine(machineId: string, visible: boolean) {
    if (visible) {
      this.hiddenIds.delete(machineId);
    } else {
      this.hiddenIds.add(machineId);
    }
    this.persistHiddenIds();
    this.renderMarkers(false);
  }

  showAll() {
    this.machines.forEach((m) => this.hiddenIds.delete(m.machineId));
    this.persistHiddenIds();
    this.renderMarkers();
  }

  hideAll() {
    this.machines.forEach((m) => this.hiddenIds.add(m.machineId));
    this.persistHiddenIds();
    this.renderMarkers(false);
  }

  private hydrateTodaySalesOnce() {
    if (this.todaySalesHydrated) return;
    this.todaySalesHydrated = true;
    this.apiService.loadAllVendingMachinesTodaySalesSummary().subscribe({
      next: (res: any) => {
        if (res?.status !== 1) return;
        const rows = res?.data?.rows || [];
        for (const row of rows) {
          if (!row?.machineId) continue;
          this.todaySalesByMachine.set(row.machineId, {
            qtyToday: Number(row.qtyToday) || 0,
            amountToday: Number(row.amountToday) || 0,
          });
        }
        this.applyTodaySalesToList();
        this.renderMarkers(false);
      },
      error: (err) => {
        console.error('today sales hydrate failed', err);
        this.todaySalesHydrated = false;
      },
    });
  }

  private applyTodaySalesUpdate(machineId: string, qtyToday: number, amountToday: number) {
    this.todaySalesByMachine.set(machineId, {
      qtyToday: Number(qtyToday) || 0,
      amountToday: Number(amountToday) || 0,
    });
    const m = this.machines.find((x) => x.machineId === machineId);
    if (m) {
      m.qtyToday = Number(qtyToday) || 0;
      m.amountToday = Number(amountToday) || 0;
      // new array ref so toolbar getters + list refresh reliably
      this.machines = [...this.machines];
      this.renderMarkers(false);
    }
  }

  private applyTodaySalesToList() {
    for (const m of this.machines) {
      const s = this.todaySalesByMachine.get(m.machineId);
      m.qtyToday = s?.qtyToday ?? 0;
      m.amountToday = s?.amountToday ?? 0;
    }
  }

  private async initPage() {
    try {
      await this.ensureLeaflet();
      this.initMap();
      await this.loadMachines();
      this.applyTodaySalesToList();
      this.renderMarkers();
    } catch (err: any) {
      console.error('Map init error:', err);
      this.errorMessage = err?.message || 'ไม่สามารถโหลดแผนที่ได้';
    }
  }

  private ensureLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const scriptId = 'leaflet-js';
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('โหลด Leaflet ไม่สำเร็จ')));
        if (typeof L !== 'undefined') resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('โหลด Leaflet ไม่สำเร็จ'));
      document.body.appendChild(script);
    });
  }

  private initMap() {
    if (this.map || typeof L === 'undefined') return;

    // Default center: Vientiane, Laos
    this.map = L.map('machine-map', {
      zoomControl: true,
    }).setView([17.9757, 102.6331], 7);

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      },
    );

    // Default to satellite view
    satellite.addTo(this.map);

    L.control
      .layers(
        {
          'ดาวเทียม': satellite,
          'แผนที่': street,
        },
        {},
        { position: 'topright' },
      )
      .addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markersLayer = null;
    }
  }

  private async loadMachines() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = localStorage.getItem('token');
      const secret = localStorage.getItem('secretLocal');
      const payload = { secret, shopPhonenumber: '', token };

      const [allRes, onlineRes] = await Promise.all([
        axios.post(`${environment.url}/getAllMachines`, payload),
        axios.post(`${environment.url}/getOnlineMachines`, payload),
      ]);

      const onlineMap = new Map<string, any>();
      onlineRes?.data?.data
        ?.filter((item: any) => item?.machine)
        ?.forEach((item: any) => onlineMap.set(item.machine.machineId, item));

      const now = new Date();
      const list: MapMachine[] = [];
      const allMachines = allRes?.data?.data || [];

      allMachines.forEach((machine: any) => {
        const d = machine?.data?.[0] || {};
        const lat = this.toCoord(d?.latitude);
        const lng = this.toCoord(d?.longitude);
        if (lat == null || lng == null) return;

        const onlineData = onlineMap.get(machine.machineId);
        let status: MapMachine['status'] = 'Broken';
        if (onlineData?.status?.t) {
          const lastTime = new Date(onlineData.status.t);
          const diffMin = (now.getTime() - lastTime.getTime()) / 60000;
          if (diffMin <= 5) status = 'Online';
        }

        const location = (d?.location != null && String(d.location).trim() !== '')
          ? String(d.location).trim()
          : '';

        const sales = this.todaySalesByMachine.get(machine.machineId);

        list.push({
          machineId: machine.machineId,
          location,
          latitude: lat,
          longitude: lng,
          status,
          owner: d?.ownerPhone ? String(d.ownerPhone) : 'Unknown',
          qtyToday: sales?.qtyToday ?? 0,
          amountToday: sales?.amountToday ?? 0,
        });
      });

      this.machines = list.sort((a, b) => a.machineId.localeCompare(b.machineId));
      this.missingCount = Math.max(0, allMachines.length - list.length);
    } catch (err: any) {
      console.error('Load machines for map error:', err);
      this.errorMessage = err?.message || 'โหลดข้อมูลตู้ไม่สำเร็จ';
      this.machines = [];
      this.missingCount = 0;
    } finally {
      this.loading = false;
    }
  }

  private toCoord(value: any): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private renderMarkers(fitBounds = true) {
    if (!this.map || !this.markersLayer || typeof L === 'undefined') return;

    this.markersLayer.clearLayers();

    const visible = this.machines.filter((m) => this.isVisible(m.machineId));
    if (!visible.length) {
      if (fitBounds) {
        this.map.setView([17.9757, 102.6331], 7);
      }
      setTimeout(() => this.map?.invalidateSize(), 150);
      return;
    }

    const bounds = L.latLngBounds([]);

    visible.forEach((m) => {
      const label = m.location || m.machineId;
      const statusClass = m.status === 'Online' ? 'online' : 'offline';
      const salesLine = `${m.qtyToday || 0} pcs · ${this.formatAmount(m.amountToday)} LAK`;

      const icon = L.divIcon({
        className: 'machine-marker',
        html: `
          <div class="marker-wrap ${statusClass}">
            <div class="marker-label">${this.escapeHtml(label)}</div>
            <div class="marker-sales">${this.escapeHtml(salesLine)}</div>
            <div class="marker-pin"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon });
      marker.bindPopup(`
        <div class="map-popup">
          <strong>${this.escapeHtml(m.machineId)}</strong><br/>
          ที่ตั้ง: ${this.escapeHtml(m.location || '-')}<br/>
          Status: ${m.status}<br/>
          Today: ${this.escapeHtml(salesLine)}<br/>
          Lat: ${m.latitude}<br/>
          Lng: ${m.longitude}
        </div>
      `);
      marker.addTo(this.markersLayer);
      bounds.extend([m.latitude, m.longitude]);
    });

    if (fitBounds && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.2));
    }

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private loadHiddenIds(): Set<string> {
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((id) => typeof id === 'string'));
    } catch {
      return new Set();
    }
  }

  private persistHiddenIds() {
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify([...this.hiddenIds]));
  }

  private escapeHtml(text: string): string {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
