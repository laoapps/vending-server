import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { UploadPictureService } from 'src/app/services/uploadPicture/upload-picture.service';

@Component({
  selector: 'app-add-pagekets',
  templateUrl: './add-pagekets.page.html',
  styleUrls: ['./add-pagekets.page.scss'],
  standalone: false,
})
export class AddPageketsPage implements OnInit {
  @Input() data: any;
  @Input() title: any;
  newSchedulePackage = {
    name: '',
    price: 0,
    conditionType: 'time_duration',
    conditionValue: 0,
    description:{
      image:[]
    }
  };
  public thumbnailPreview: string | null = null;
  public image_ = "../../../../assets/icon/add-image.png"
  public img_show:string | null = null;
  public img_Url:string | null = null;

  constructor(
    public m: LoadingService,
    private apiService: ApiService,
    private alertController: AlertController,
    public upload:UploadPictureService
  ) {}

  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
    if (this.title === 'edit' && this.data) {
      this.newSchedulePackage = {
        name: this.data?.name,
        price: this.data?.price,
        conditionType: this.data?.conditionType,
        conditionValue: this.data?.conditionValue,
        description:this.data?.description || {image:[]},
      };
      if (this.data.pic) {
        this.img_show = this.data?.pic
      }else{
        this.img_show = ''
      }
      console.log('====================================');
      console.log(this.newSchedulePackage);
      console.log('====================================');
    }
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async addSchedulePackage() {
    if (
      !this.newSchedulePackage.name ||
      this.newSchedulePackage.price <= 0 ||
      this.newSchedulePackage.conditionValue <= 0 || !this.img_Url
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }
    this.newSchedulePackage.description.image = [this.img_Url]
    console.log('====================================');
    console.log(this.newSchedulePackage);
    console.log('====================================');
    this.m.onLoading('')
    this.apiService
      .createSchedulePackage(
        this.newSchedulePackage.name,
        this.newSchedulePackage.price,
        this.newSchedulePackage.conditionType,
        this.newSchedulePackage.conditionValue,
        this.newSchedulePackage.description
      )
      .subscribe(
        () => {
          // this.loadData();
          this.m.onDismiss();
          this.m.closeModal({ dismiss: true });
          this.newSchedulePackage = {
            name: '',
            price: 0,
            conditionType: 'time_duration',
            conditionValue: 0,
            description:{
              image:[]
            }
          };
        },
        (error) => {
          this.m.onDismiss();
          this.m.onAlert('Failed to create schedule package!!')
          console.error('Failed to create schedule package:', error);
        }
      );
  }

  async editSchedulePackage(){
        if (
      !this.newSchedulePackage.name ||
      this.newSchedulePackage.price <= 0 ||
      this.newSchedulePackage.conditionValue <= 0
    ) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }

    if (this.img_Url) {
      this.newSchedulePackage.description.image = [this.img_Url]
    }


    console.log('====================================');
    console.log(this.newSchedulePackage);
    console.log('====================================');

    // return

    this.m.onLoading('')
    this.apiService
      .editSchedulePackage(
        this.data.id,
        this.newSchedulePackage.name,
        this.newSchedulePackage.price,
        this.newSchedulePackage.conditionType,
        this.newSchedulePackage.conditionValue,
        this.newSchedulePackage.description
      )
      .subscribe(
        () => {
          // this.loadData();
          this.m.onDismiss();
          this.m.closeModal({ dismiss: true });
          this.newSchedulePackage = {
            name: '',
            price: 0,
            conditionType: 'time_duration',
            conditionValue: 0,
            description:{
              image:[]
            }
          };
        },
        (error) => {
          this.m.onDismiss();
          this.m.onAlert('Failed to create schedule package!!')
          console.error('Failed to create schedule package:', error);
        }
      );
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

  triggerFileInput() {
    document.getElementById('thumbnailInput')?.click();
  }

  clearThumbnail() {
    this.img_show = null;
    this.img_Url = null;
    (document.getElementById('thumbnailInput') as HTMLInputElement).value = '';
  }
}
