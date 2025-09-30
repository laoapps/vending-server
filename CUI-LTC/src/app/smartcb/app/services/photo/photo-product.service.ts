import { Injectable } from '@angular/core';
import { AppcachingserviceService } from '../caching/appcachingservice.service';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PhotoProductService {

  constructor(private caching: AppcachingserviceService) { }
  
  async getPhoto(k: string) {
    return await this.caching.get(k); // {v,d}
  }

  async saveCachingPhoto(k: string, d: Date,uuid:string) {
    const x = await this.getPhoto(k+uuid); //{v,d}
    // console.log(uuid);
    
    if (x) {
      const y = JSON.parse(x); //{v,d}
      if (new Date(y.d).getTime() != d.getTime()) {
        const w = await this.getBase64ImageFromUrl(k);

        console.log("update", new Date(y.d).getTime(), d.getTime());

        // return this.caching.set(k, w);
        return this.caching.setWithdate(k+uuid, w, d);
      } else {
        if (JSON.parse(x).v.indexOf('data:application/octet-stream') !=-1) {
          console.log("old");
          return x;
        }

        const w = await this.getBase64ImageFromUrl(k);
        return this.caching.setWithdate(k+uuid,w,d)

        // console.log("old");

        // return x
      }
    } else {

      const w = await this.getBase64ImageFromUrl(k);

      console.log("new");

      // return this.caching.set(k, w);
      return this.caching.setWithdate(k+uuid, w, d);
    }
  }

  async saveCachingPhoto2(k: string, v: any) {
    const w = await this.getBase64ImageFromUrl(k); // check caching then load from server and save
    return this.caching.set(k, w);
  }
  async getBase64ImageFromUrl(imageUrl: string) {
    // const url = environment.serverFile + 'file/download/' + imageUrl; // file manager
    const url = environment.serverFile + 'file/download/' + imageUrl; // file manager
    var res = await fetch(url);
    var blob = await res.blob();

    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener(
        'load',
        function () {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(blob);
    });
  }
}
