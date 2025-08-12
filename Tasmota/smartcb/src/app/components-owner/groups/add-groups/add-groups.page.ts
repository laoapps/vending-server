import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import * as L from 'leaflet';
import { Map, tileLayer, marker, icon } from 'leaflet';
import { Platform } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation'
@Component({
  selector: 'app-add-groups',
  templateUrl: './add-groups.page.html',
  styleUrls: ['./add-groups.page.scss'],
  standalone: false
})
export class AddGroupsPage implements OnInit {
  // newGroup = { name: '' };
  newGroup = {
    name: '',
    lat: '',
    lng: ''
  };
  map: Map;
  newMarker: any;
  currentPosition: any;


  myIcon = icon({
    iconUrl: "assets/hangmi-icon/marker.png",
    iconSize: [25, 45],
    iconAnchor: [10, 41],
    popupAnchor: [3, -35],
    shadowUrl: "assets/hangmi-icon/marker-shadow.png",
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
  });

  nowlocationIcon = icon({
    iconUrl: "assets/hangmi-icon/marker-icon-2x.png",
    iconSize: [25, 45],
    iconAnchor: [10, 41],
    popupAnchor: [3, -35],
    shadowUrl: "assets/hangmi-icon/marker-shadow.png",
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
  });
  StoreIcon = icon({
    iconUrl: "assets/hangmi-icon/marker_store.png",
    iconSize: [25, 45],
    iconAnchor: [10, 41],
    popupAnchor: [3, -35],
    shadowUrl: "assets/hangmi-icon/marker-shadow.png",
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
  });

  constructor(
    public apiService: ApiService,
    public m: LoadingService,
    public platform: Platform,
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.loadMap_add();
      this.locatePosition();
      this.map.attributionControl.remove();
    }, 100);

    // this.loadMap();
  }

    dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

    addGroup() {
      if (!this.newGroup.name) {
        return alert('empty!!!')
      }
      this.m.onLoading('')
    this.apiService.createGroup(this.newGroup.name).subscribe(() => {
      this.m.onDismiss();
      this.newGroup = { name: '' ,lat:'', lng:''};
      this.dismiss({ dismiss: true });
    },error=>{
      this.m.onDismiss();
      this.m.alertError('add Groups fail!!')
    });
  }

  loadMap_add() {
    // new Map("id of the DOM element").setView([lat,long],zoomlevel);
    this.map = new Map('mapId').setView([17.996716, 102.573385], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'  
    }).addTo(this.map);
  }

  loadMap() {
    // new Map("id of the DOM element").setView([lat,long],zoomlevel);
    this.map = new Map('mapId').setView([17.996716,102.573385], 11);
    // this.map.setZoom(15);
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(this.map);

    L.marker([17.996716,102.573385]).bindPopup('ຈຸດຮັບເຄື່ອງ!', { closeButton: false }).addTo(this.map).openPopup();

  }

  async mylo() {
    if (this.platform.is('cordova')) {
      try {
        // Request geolocation permission (this is for runtime permission checks)
        const perm = await Geolocation.requestPermissions();

        if (perm.location === 'granted') {
          // If permission is granted, check if GPS is enabled by attempting to get the position
          const position = await Geolocation.getCurrentPosition();
          console.log('GPS is enabled, position:', position);
        } else {
          alert('ກະລຸນາເປີດ GPS ໂທລະສັບຂອງທ່ານກ່ອນ !');
        }
      } catch (error) {
        // Handle error if GPS is not enabled or permission is denied
        this.m.ontoast("GPS ERROR : " + error.message, 1500);
      }
    }
    this.locatePosition();
  }

  locatePosition() {

    this.map.locate({ setView: true }).removeEventListener('locationfound').on('locationfound', async (e: any) => {
      console.log(e.latitude, e.longitude);
      //==== location now =======
      if (this.currentPosition)
        this.map.removeLayer(this.currentPosition)
      this.currentPosition = marker([e.latitude, e.longitude], {
        icon: this.nowlocationIcon,
      }).addTo(this.map);
      this.currentPosition.bindPopup('ທີ່ຢູ່ປັນຈຸບັນຂອງເຈົ້າ!', { closeButton: false }).openPopup();
      //=========================

      if (this.newMarker)
        this.map.removeLayer(this.newMarker)
      this.newMarker = marker([e.latitude, e.longitude], {
        draggable: true,
        icon: this.myIcon,
      }).addTo(this.map);


      // this.newMarker.bindPopup('ທີ່ຢູ່ຮັບສິນຄ້າ!', { closeButton: false }).openPopup();
    });

    this.map.attributionControl.remove();

  }

  

}
