import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { VersionControlPage } from '../../version-control.page';
import { FormPreviewPage } from '../form-preview/form-preview.page';

@Component({
  selector: 'app-form-edit',
  templateUrl: './form-edit.page.html',
  styleUrls: ['./form-edit.page.scss'],
})
export class FormEditPage implements OnInit, OnDestroy {

  @Input() versionControlPage: VersionControlPage;
  @Input() list: any;
  @Input() isEdit: boolean = false;

  title: string;
  subtitle: string = '';
  elements: Array<any> = [];
  readme: Array<any> = [];

  reloadElement: any = {} as any;

  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { }

  ngOnInit() {
    this.loadContent();
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadElement);
  }

  loadContent() {
    if (this.list && this.list.header && this.list.readme) {
      this.title = this.list.header.title;
      this.subtitle = this.list.header.subtitle;

      this.readme = this.list.readme;
      for(let i = 0; i < this.readme.length; i++) {
        this.elements.push(1);
      }

      const sections = this.list.readme.map(item => item.section);
      const description: Array<string> = this.list.readme.map(item => item.description);
      const hightlight = this.list.readme.map(item => item.hightlight);

      this.reloadElement = setInterval(() => {
        clearInterval(this.reloadElement);
        const inputs_section = (document.querySelectorAll('.input-section') as NodeListOf<HTMLInputElement>);
        const inputs_description = (document.querySelectorAll('.input-description') as NodeListOf<HTMLTextAreaElement>);
        const inputs_hightlight = (document.querySelectorAll('.input-hight-light') as NodeListOf<HTMLTextAreaElement>);
        inputs_section.forEach((element, index) => element.value = sections[index]);
        inputs_description.forEach((element, index) => {
          element.value = Array.from(description[index]).join("\n");
        });        
        inputs_hightlight.forEach((element, index) => {
          element.value = Array.from(hightlight[index]).join("\n");
        });

      });
    }
  }

  close() {
    this.apiService.modal.dismiss();
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
        title: this.title,
        subtitle: this.subtitle,
        filename: this.list.file.filename,
        filesize: this.list.file.filesize
      }
      const props = {
        formUpload: this.modal,
        id: this.list.id,
        dataPack: dataPack,
        readme: this.readme,
        versionControlPage: this.versionControlPage,
        isEdit: true
      }
      this.apiService.showModal(FormPreviewPage,props).then(r=>{r?.present()});
    });
  }
}
