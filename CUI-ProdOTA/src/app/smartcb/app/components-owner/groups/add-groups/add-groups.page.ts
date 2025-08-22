import { Component, Input, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Map, tileLayer, marker, icon } from 'leaflet';
import { Platform } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation'
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { UploadPictureService } from '../../../services/uploadPicture/upload-picture.service';
@Component({
  selector: 'app-add-groups',
  templateUrl: './add-groups.page.html',
  styleUrls: ['./add-groups.page.scss'],
  standalone: false
})
export class AddGroupsPage implements OnInit {
  @Input() title:any
  @Input() data:any
  newGroup = {
    name: '',
    description:{
      lat:'',
      lng:'',
      image: [],
      packages:[]
    }
  };
  map: Map;
  newMarker: any;
  currentPosition: any;
  public image_ = "../../../../assets/icon/add-image.png"
  public img_show:string | null = null;
  public img_Url:string | null = null;
  schedulePackages: any[] = [];
  public page = 1


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
    public upload:UploadPictureService
    
  ) { }

  ngOnInit() {
 
  }
  ionViewWillEnter() {
    if (this.title == 'edit') {
      console.log('====================================');
      console.log(this.data);
      console.log('====================================');
      this.newGroup.name = this.data?.name
      this.newGroup.description = this.data?.description
      console.log('====================================');
      console.log('newgroupd',this.newGroup.description);
      console.log('package length',this.newGroup.description.packages);
      console.log('====================================');
      setTimeout(() => {
        this.loadMap_add();
        this.map_Position();
        this.map.attributionControl.remove();
      }, 300); // Increased delay to 300ms
      if (this.data?.pic) {
        this.img_show = this.data?.pic
      }else{
        this.img_show = ''
      }
      if (this.newGroup.description.packages) {
        this.seleted = this.newGroup.description.packages
      }
      this.load_pageket();

    }else{
      setTimeout(() => {
        this.loadMap_add();
        this.locatePosition();
        this.map.attributionControl.remove();
      }, 200);
      this.load_pageket();
    }
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  load_pageket(){
    this.m.onLoading('')
    this.apiService.getSchedulePackages().subscribe(async (packages) => {
      console.log('====================================');
      console.log('packages',packages);
      console.log('====================================');
      this.schedulePackages = packages;
      this.m.onDismiss();
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load pageket fail!!')
    });
  }

    addGroup() {
      if (!this.newGroup.name || !this.newGroup.description.lat || !this.newGroup.description.lng || !this.img_Url || !this.newGroup.description.packages) {
        this.m.onAlert('please input field!!')
        return
      }
      this.newGroup.description.image = [this.img_Url]

      this.m.onLoading('')
      let data = {
        name:this.newGroup.name,
        description:this.newGroup.description
      }
      console.log('====================================');
      console.log('data sent',data);
      console.log('====================================');
      // return
    this.apiService.createGroup(data).subscribe(() => {
      this.m.onDismiss();
      this.newGroup = { name: '' ,description:{
        lat:'',
        lng:'',
        image: [],
        packages:[]
      }};
      this.dismiss({ dismiss: true });
    },error=>{
      this.m.onDismiss();
      this.m.alertError('add Groups fail!!')
    });
  }

  EditGroup(){
    if (this.img_Url) {
      this.newGroup.description.image = [this.img_Url]
    }
    if (!this.newGroup.name || !this.newGroup.description.lat || !this.newGroup.description.image || !this.newGroup.description.lng || !this.newGroup.description.packages) {
      this.m.onAlert('please input field!!')
      return
    }


    this.m.onLoading('')
    let data = {
      name:this.newGroup.name,
      description:this.newGroup.description
    }
    
    console.log('====================================');
    console.log('data sent',data);
    console.log('====================================');
    // return
  this.apiService.EditGroup(this.data.id,data).subscribe(() => {
    this.m.onDismiss();
    this.newGroup = { name: '' ,description:{
      lat:'',
      lng:'',
      image: [],
      packages:[]
    }};
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
      this.newGroup.description.lat = e.latitude
      this.newGroup.description.lng = e.longitude

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
        this.newGroup.description.lat = position.lat;
        this.newGroup.description.lng = position.lng;
      });
    });

  this.map.attributionControl.remove();
  }


  // =====================================open package
  seleted:any[] = []
  openPackageSelector(){
    this.page = 2
  }

  toggleSelection(id: string, checked: boolean) {
    console.log('====================================');
    console.log('id',id);
    console.log('checked',checked);
    console.log('seleted',typeof(this.seleted),this.seleted);
    console.log('====================================');
    if (checked) {
      this.seleted.push(id);
    } else {
      this.seleted = this.seleted.filter(x => x !== id);
    }
  }

  close(){
    if (this.newGroup.description.packages?.length || this.newGroup.description.packages?.length != this.seleted?.length) {
      this.page = 1
    }else{
      this.seleted = []
      this.page = 1
    }
    setTimeout(() => {
      this.loadMap_add();
      this.map_Position();
      this.map.attributionControl.remove();
    }, 300); // Increased delay to 300ms
  }

  Done(){
    if (this.seleted.length <= 0) {
      this.m.onAlert('please select package!!')
      return 
    }
    this.newGroup.description.packages = this.seleted
    this.page = 1
    setTimeout(() => {
      this.loadMap_add();
      this.map_Position();
      this.map.attributionControl.remove();
    }, 300); // Increased delay to 300ms
    console.log('====================================');
    console.log('selected',this.seleted);
    console.log('====================================');
  }

  map_Position(){
      // Remove old marker if exists
      if (this.currentPosition) {
      this.map.removeLayer(this.currentPosition);
    }

    // Create draggable marker
    this.currentPosition = marker([Number(this.newGroup.description.lat), Number(this.newGroup.description.lng)], {
      icon: this.nowlocationIcon,
      draggable: true
    }).addTo(this.map);

      // center map to this point
    this.map.setView([Number(this.newGroup.description.lat),  Number(this.newGroup.description.lng)], 16);

    // Popup
    this.currentPosition.bindPopup('ທີ່ຢູ່ປັນຈຸບັນຂອງເຈົ້າ!', { closeButton: false }).openPopup();

      // listen for drag end
    this.currentPosition.on('dragend', (event: any) => {
      const position = event.target.getLatLng();
      console.log("New Lat:", position.lat, "New Lng:", position.lng);

      this.newGroup.description.lat = position.lat;
      this.newGroup.description.lng = position.lng;
    });
  }

  // ================================== upload photo

  triggerFileInput() {
    document.getElementById('thumbnailInput')?.click();
  }

  clearThumbnail() {
    this.img_show = null;
    this.img_Url = null;
    (document.getElementById('thumbnailInput') as HTMLInputElement).value = '';
  }

  async onThumbnailFileChange(e){
    await this.upload.uploadImage(e);
    setTimeout(() => {
      if (this.upload.imgUrl && this.upload.imgBase64) {    
        this.img_show = this.upload.imgBase64
        this.img_Url = this.upload.imgUrl
        console.log('====================================');
        console.log(this.img_Url);
        console.log(this.img_show);
        console.log('====================================');
      }
    }, 200);
  }

  check_package(id){
    if (this.newGroup.description?.packages?.includes(id)) {
      return true
    }else{
      return false
    }
  }

  

}
