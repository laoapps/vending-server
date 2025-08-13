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
      if (!this.newGroup.name || !this.newGroup.lat || !this.newGroup.lng) {
        this.m.onAlert('please input field!!')
        return
      }
      this.m.onLoading('')
      let data = {
        name:this.newGroup.name,
        description:{
          lat:this.newGroup.lat,
          lng:this.newGroup.lng
        }
      }
    this.apiService.createGroup(data).subscribe(() => {
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


  locatePosition(){
    this.map.locate({ setView: true }).removeEventListener('locationfound').on('locationfound', async (e: any) => {
      console.log(e.latitude, e.longitude);
      this.newGroup.lat = e.latitude
      this.newGroup.lng = e.longitude

      // Remove old marker if exists
      if (this.currentPosition) {
        this.map.removeLayer(this.currentPosition);
      }

      // Create draggable marker
      this.currentPosition = marker([e.latitude, e.longitude], {
        icon: this.nowlocationIcon,
        draggable: true
      }).addTo(this.map);

      // Popup
      this.currentPosition.bindPopup('ທີ່ຢູ່ປັນຈຸບັນຂອງເຈົ້າ!', { closeButton: false }).openPopup();

      // Listen for drag end event
      this.currentPosition.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        console.log("New Lat:", position.lat, "New Lng:", position.lng);
        // You can store them if needed
        this.newGroup.lat = position.lat;
        this.newGroup.lng = position.lng;
      });
    });

  this.map.attributionControl.remove();
  }

  

}
