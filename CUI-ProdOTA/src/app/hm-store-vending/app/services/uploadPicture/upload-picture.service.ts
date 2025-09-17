import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import * as uuid from "uuid";
import { LoadingService } from '../loading/loading.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UploadPictureService {
  public imgUrl = "";
  public imgBase64= "";
  public maxUpload = 5 * 1024 * 1024;
  public formData = new FormData();
  _Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNpZ25hdHVyZSI6IjA0ZWQxZTZlNDRiZjlkMTg4ZDc2MDkwYzU4YjIwNGQ0MDhhNGE5YWFhMTkxNzU1YjRkMjlmZmI0N2EzMjNkMTdiYjE0MmIwN2Q3NGZjZGZmNzUyMmU3MWM2NTRjZDVjZjNmYTViZDY5YTlmOWIzNzllYWZhYmJkZDVkMzg0NzNhZTMiLCJwaG9uZU51bWJlciI6Iis4NTYyMDU1NTE2MzIxIiwidXVpZCI6IjExMDg5MGEwLTcyYWYtMTFlYy05NzdiLTRmNTk1YzcxNTYyYSIsImlwIjoiMTI3LjAuMC4xIiwibWFjaGluZSI6IndpbmRvd3MiLCJvdGhlcmluZm8iOiJsYW9hcHAuY29tIiwibG9jYXRpb24iOiJ2aWVudGlhbmUifSwiaWF0IjoxNjU1Njk0MDQ5LCJleHAiOjM2MDAwMDAxNjU1Njk0MDUwfQ.mSFw_W0PBctartPVVRI2KjPOdVC4aFL6SdWX4RBv-0o";
  url = environment.serverFile;
  
  constructor(
    private toastController:ToastController,
    public load:LoadingService,
    public http: HttpClient
  ) { }

  async uploadImage(event) {
    this.imgBase64 = ""
    this.imgUrl =""
    this.load.onLoading("");
    try {
      console.log("event: ", event.target.files);
      const file: File = event.target.files[0];
      if (file.size > this.maxUpload) {
        const toast = await this.toastController.create({
          message:
            "File is too large, 5MB max ~" + file.size / 1024 / 1024 + "MB",
          duration: 3000,
        });
        this.load.onDismiss();
        return toast.present();
      }

      if (file) {
        this.formData = new FormData();
        this.formData.append("docs", file, file.name);
        this.formData.append("uuid", uuid.v4());

        console.log("::: ", this.formData.getAll("docs"));
        this.imgUrl = await this.saveFile(this.formData);
        console.log(this.imgUrl);
        
          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async (e: any) => {
            this.imgBase64 = e.target.result;
          };
        event.target.value = '';
        this.load.onDismiss();
      }
    } catch (error) {
      await this.load.onDismiss();
      await this.load.alertError("ໂຫລດຮູບພາບຜິດພາດ "+JSON.stringify(error));
      console.log(error);
    }
  }

  uploadFile(data: FormData): Observable<any> {
    const headers = this.headerBaseUpload(this._Token);
    return this.http.post(this.url + "/file/newstore", data, { headers: { token: this._Token } });
  }

  async saveFile(formData: FormData): Promise<string> {
    return new Promise<string>((resolve, rejects) => {
      this.uploadFile(formData).subscribe(
        (r) => {
          console.log("FILE UPLOADED", r);
          if (r.status == 1) {
            resolve(r.data[0].info.fileUrl)
          }else{
            rejects(new Error("error: "+r.message))
          }
        },
        (error) => {
          rejects(error)
        }
      );
    });
  }

  protected headerBaseUpload(tkn: string = ""): any {
    // let token = localStorage.getItem('token') ? localStorage.getItem('token') : tkn;
    var headers = new HttpHeaders()
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('token', tkn);
    return headers;
  }
}
