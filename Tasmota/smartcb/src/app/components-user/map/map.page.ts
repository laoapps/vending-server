import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import * as L from 'leaflet';
import { Map, tileLayer, marker, icon } from 'leaflet';
import { ShowDevicesPage } from '../show-devices/show-devices.page';
@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: false,

})
export class MapPage implements OnInit {
  map: Map;
  all_gorup:any = []
  StoreIcon = icon({
    iconUrl: "assets/hangmi-icon/marker_store.png",
    iconSize: [25, 45],
    iconAnchor: [10, 41],
    popupAnchor: [3, -35],
    shadowUrl: "assets/hangmi-icon/marker-shadow.png",
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
  });


  constructor(public apiService: ApiService, public m: LoadingService) {}


  ngOnInit() {
    this.load_data();
    setTimeout(() => {
      this.loadMap_add();
      // this.locatePosition();
      this.map.attributionControl.remove();
    }, 100);
  }

  load_data() {
    this.m.onLoading('');
  
    this.apiService.load_all_group().subscribe(
      (response: any[]) => {
        console.log('Received groups:', response);
        this.m.onDismiss();
  
        this.all_gorup = response;
  
        // Optional: clear existing markers if you store them
        // this.clearMarkers();
  
        setTimeout(() => {
          if (!this.all_gorup?.length) {
            console.warn('No groups found');
            return;
          }
    
          this.all_gorup.forEach(group => {
            const group_name = group?.name
            const lat = group?.description?.lat;
            const lng = group?.description?.lng;
    
            if (lat == null || lng == null) {
              console.warn('Skipping group without valid coordinates:', group);
              return;
            }
    
            const newMarker = marker([lat, lng], {
              icon: this.StoreIcon,
            }).addTo(this.map);
    
            newMarker.bindPopup(`Location: ${group_name}`);
            newMarker.openPopup();

            (newMarker as any).groupData = group; // Store group data in marker

          // Add click event listener to the marker
          newMarker.on('click', () => {
            // Access the group data when marker is clicked
            const clickedGroup = (newMarker as any).groupData;
            console.log('Clicked group:', clickedGroup);
            // You can do something with clickedGroup here, e.g., display it, pass it to another function, etc.
            // Example: alert(JSON.stringify(clickedGroup));
            this.m.showModal(ShowDevicesPage, { data: clickedGroup }).then((r) => {
                  if (r) {
                    r.present();
                    r.onDidDismiss().then((res) => {
                      if (res.data.dismiss) {
                      }
                    });
                  }
                });
          });



          });
        }, 500);
      },
      (error) => {
        this.m.onDismiss();
        this.m.alertError('Failed to load groups!');
        console.error('API load_all_group error:', error);
      }
    );
  }
  

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

    loadMap_add() {
      // new Map("id of the DOM element").setView([lat,long],zoomlevel);
      this.map = new Map('mapId').setView([17.996716, 102.573385], 12);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'  
      }).addTo(this.map);
    }

    addMarkersFromArray(coordsArray: { lat: number, lng: number }[]) {
     
    }

}
