import { AfterViewInit, Component, Input, NgZone, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';

declare const L: any;

@Component({
  selector: 'app-pick-location-modal',
  templateUrl: './pick-location-modal.component.html',
  styleUrls: ['./pick-location-modal.component.scss'],
})
export class PickLocationModalComponent implements AfterViewInit, OnDestroy {
  @Input() latitude: number | string | null = null;
  @Input() longitude: number | string | null = null;
  @Input() title = 'เลือกพิกัดบนแผนที่';

  private map: any;
  private marker: any;
  private mapId = `pick-location-map-${Date.now()}`;

  selectedLat: number | null = null;
  selectedLng: number | null = null;
  errorMessage = '';
  loading = true;

  constructor(
    private modalCtrl: ModalController,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  get mapElementId(): string {
    return this.mapId;
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.selectedLat == null || this.selectedLng == null) {
      this.errorMessage = 'แตะบนแผนที่เพื่อเลือกตำแหน่ง';
      return;
    }
    this.modalCtrl.dismiss(
      {
        latitude: Number(this.selectedLat.toFixed(6)),
        longitude: Number(this.selectedLng.toFixed(6)),
      },
      'confirm',
    );
  }

  private async initMap() {
    try {
      await this.ensureLeaflet();
      const el = document.getElementById(this.mapId);
      if (!el || typeof L === 'undefined') {
        this.errorMessage = 'ไม่สามารถโหลดแผนที่ได้';
        this.loading = false;
        return;
      }

      const existing = this.parseCoord(this.latitude);
      const existingLng = this.parseCoord(this.longitude);
      const hasExisting = existing != null && existingLng != null;
      const center: [number, number] = hasExisting
        ? [existing!, existingLng!]
        : [17.9757, 102.6331];
      const zoom = hasExisting ? 16 : 12;

      this.map = L.map(this.mapId, { zoomControl: true }).setView(center, zoom);

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

      if (hasExisting) {
        this.setMarker(existing!, existingLng!);
      }

      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.ngZone.run(() => this.setMarker(lat, lng));
      });

      setTimeout(() => this.map?.invalidateSize(), 250);
      this.loading = false;
    } catch (err: any) {
      console.error('Pick location map error:', err);
      this.errorMessage = err?.message || 'ไม่สามารถโหลดแผนที่ได้';
      this.loading = false;
    }
  }

  private setMarker(lat: number, lng: number) {
    this.selectedLat = lat;
    this.selectedLng = lng;
    this.errorMessage = '';

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.ngZone.run(() => {
        this.selectedLat = pos.lat;
        this.selectedLng = pos.lng;
      });
    });
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private parseCoord(value: any): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
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
}
