import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { FormPreviewPage } from '../form-preview/form-preview.page';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-form-upload',
  templateUrl: './form-upload.page.html',
  styleUrls: ['./form-upload.page.scss'],
})
export class FormUploadPage implements OnInit {

  commit_version: string;
  title: string;
  subtitle: string;
  file: File = undefined;
  filename: string;
  filesize: string;
  elements: Array<any> = [];
  readme: Array<any> = [];


  reloadElement: any = {} as any;

  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { }

  ngOnInit() {
    this.loadPaper();
  }

  close() {
    this.apiService.modal.dismiss();
  }
  
  loadPaper() {

  }

  textAreaFormat(element: HTMLTextAreaElement) {
    const replaceBreak = element.value.replace(/\r?\n/g, '<br />').split('<br />');
    const array: Array<any> = [];
    for(let i = 0; i < replaceBreak.length; i++) {
      array.push(replaceBreak[i]);
    }
    return array;
  }

  addElement() {
    this.elements.push(1);
  }
  removeElement() {
    if (this.elements != undefined && Object.entries(this.elements).length > 0) {
      this.elements.splice(this.elements.length - 1, 1);
    }
    console.log(this.elements.length);
  }
  previewElement() {
    this.readme = [];

    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      const inputs_section = (document.querySelectorAll('.input-section') as NodeListOf<HTMLInputElement>);
      const inputs_description = (document.querySelectorAll('.input-description') as NodeListOf<HTMLTextAreaElement>);
      const inputs_hightlight = (document.querySelectorAll('.input-hight-light') as NodeListOf<HTMLTextAreaElement>);

      for(let i = 0; i < this.elements.length; i++) {

        const model = {
          section: inputs_section[i].value,
          description: this.textAreaFormat(inputs_description[i]),
          hightlight: this.textAreaFormat(inputs_hightlight[i]),
        }
        this.readme.push(model);
      }

      const dataPack = {
        file: this.file,
        commit_version: this.commit_version,
        title: this.title,
        subtitle: this.subtitle,
        filename: this.filename,
        filesize: this.filesize
      }
      const props = {
        formUpload: this.modal,
        dataPack: dataPack,
        readme: this.readme
      }
      console.log(`props`, props);
      this.apiService.showModal(FormPreviewPage,props).then(r=>{r?.present()});
    });
  }
  uploadFile(e: Event) {
    this.file = (e.target as HTMLInputElement).files[0];
    if (this.file)
    {
      this.filename = this.file.name;
      this.filesize = this.file.size + '';
    }
    else 
    {
      this.file = undefined;
      this.filename = '';
      this.filesize = '';
    }


    console.log(this.file, this.filename, this.filesize);
  }
}
