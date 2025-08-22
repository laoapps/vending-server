import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoadingService } from '../../../services/loading.service';
import { ApiService } from '../../../services/api.service';
import { UploadPictureService } from '../../../services/uploadPicture/upload-picture.service';

@Component({
  selector: 'app-add-devices',
  templateUrl: './add-devices.page.html',
  styleUrls: ['./add-devices.page.scss'],
  standalone: false,
})
export class AddDevicesPage implements OnInit {
  newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1,    description:{
    image:[]
  } };
  groups: any[] = [];
  @Input() data: any;
  @Input() title: any;
  public thumbnailPreview: string | null = null;
  public image_ = "../../../../assets/icon/add-image.png"
  public img_show:string | null = null;
  public img_Url:string | null = null;

  constructor(public m: LoadingService, private apiService: ApiService,
    private alertController: AlertController,
        public upload:UploadPictureService
    
  ) {}

  ngOnInit() {
    if (this.title === 'edit' && this.data) {
      this.newDevice = {
        name: this.data.name,
        tasmotaId: this.data.tasmotaId,
        zone: this.data.zone,
        groupId: this.data.groupId,
        description:this.data?.description || {image:[]},
      };
      if (this.data.pic) {
        this.img_show = this.data?.pic
      }else{
        this.img_show = ''
      }
    }
    this.load_group();
  }

  load_group() {
    this.m.onLoading('')
    this.apiService.getGroups().subscribe((groups) => {
      console.log('====================================');
      console.log('Groups loaded:', groups);
      console.log('====================================');
      this.groups = groups;
      this.m.onDismiss()
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load Groups fail!!')
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async addDevice() {
    if (
      !this.newDevice.name ||
      !this.newDevice.tasmotaId ||
      !this.newDevice.zone ||
      !this.newDevice.groupId || !this.img_Url
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }

    this.newDevice.description.image = [this.img_Url]

    console.log('====================================');
    console.log(this.newDevice);
    console.log('====================================');
    this.apiService
      .createDevice(
        this.newDevice.name,
        this.newDevice.tasmotaId,
        this.newDevice.zone,
        this.newDevice.groupId,
        this.newDevice.description
      )
      .subscribe(() => {
        this.m.onDismiss();
        this.newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1,description:{image:[]}};
        this.m.closeModal({ dismiss: true });
      }, (error) => {
        this.m.onDismiss();
        this.m.onAlert('Failed to create schedule package!!')
        console.error('Failed to create schedule package:', error);
      })
  }

  updateDevice() {
    if (
      !this.newDevice.name ||
      !this.newDevice.tasmotaId ||
      !this.newDevice.zone ||
      !this.newDevice.groupId
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }

    if (this.img_Url) {
      this.newDevice.description.image = [this.img_Url]
    }

    this.m.onLoading('')
    this.apiService.updateDevice(this.data.id, this.newDevice.name, this.newDevice.tasmotaId, this.newDevice.zone, this.newDevice.groupId,this.newDevice.description).subscribe((r) => {
      if (r) {
        this.m.onDismiss();
        this.m.closeModal({dismiss:true});
      }
    },error=>{
      this.m.onAlert('Failed to update device!!')
    });
  }


  // update photo

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

  triggerFileInput() {
    document.getElementById('thumbnailInput')?.click();
  }

  clearThumbnail() {
    this.img_show = null;
    this.img_Url = null;
    (document.getElementById('thumbnailInput') as HTMLInputElement).value = '';
  }
}
