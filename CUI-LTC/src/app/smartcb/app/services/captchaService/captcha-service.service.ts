import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CaptchaServiceService {
  
  public url_UM = 'https://nocnoc-api.laoapps.com';

  constructor(
    public http: HttpClient
  ) { }
  _recapcha(param): Observable<any> {
    const headers = this.headerBase();
    return this.http.post(this.url_UM, param,{headers});
  }

  getCaptcha():Promise<any>{
    return new Promise<any>((resolve, reject) => {
      let data = {
        object: "authorize",
        method: "generate_captcha",
        data: {}
      }
      this._recapcha(data).subscribe((r)=>{
        console.log('_recapcha',r);
        if (r.status) {
          resolve(r.data)
        }else{
          resolve(null)
        }
      },(error)=>{
        resolve(null)
      })
    })
  }


  validateCaptchaAndSendOtp(captchaId:any,captchaInput:any,phoneNumber:any): Promise<any>{
    let new_phone:any
    if (phoneNumber.length == 14) {
      new_phone = phoneNumber
    }else{
      new_phone = "+85620" + phoneNumber
    }

    return new Promise<any>((resolve,reject)=>{
      let data = {
        object: "authorize",
        method: "validate_captcha",
        data:{ captchaId, input:captchaInput, phoneNumber:new_phone }
      }

      this._recapcha(data).subscribe((r)=>{
        console.log('_recapcha',r);
        if (r) {
          resolve(r) // sign up here
        }
      },(error)=>{
        resolve(null)
      })
    })
  }

  protected headerBase(): any {
    const token = localStorage.getItem('token');
    const myheader = new HttpHeaders({
      'Content-Type': 'application/json',
    })
      .set('token', token + '');
    // !token || myheader.set('token', token+'');
    return myheader;
  }
}
