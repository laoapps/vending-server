import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppcachingserviceService } from './appcachingservice.service';


@Injectable({
  providedIn: 'root'
})
export class CachingService {

  constructor(private caching: AppcachingserviceService) { }

  async getPhoto(k: string) {
    return await this.caching.get(k); // {v,d}
  }

  async clearStorage() {
    return await this.caching.clear();
  }

  async saveCachingPhoto(k: string, d: Date,id: string) {
    const x = await this.getPhoto(k+id); //{v,d}

    if (x) {
      const y = JSON.parse(x); //{v,d}

      if (new Date(y.d).getTime() != d.getTime()) {

        const w = await this.getBase64ImageFromUrl(k);

        console.log('a', new Date(y.d).getTime(), d.getTime());

        // return this.caching.set(k, w);
        return this.caching.setWithdate(k+id, w, d);
      } else {

        console.log('b');

        if(JSON.parse(x).v.indexOf('data:application/octet-stream') !== -1){
          return x;
        }

        console.log('b but add new');

        const w = await this.getBase64ImageFromUrl(k);

        return this.caching.setWithdate(k+id, w, d);
      }
    } else {

      const w = await this.getBase64ImageFromUrl(k);

      console.log('c');

      // return this.caching.set(k, w);
      return this.caching.setWithdate(k+id, w, d);
    }

  }

  // async saveCachingPhoto(k: string, v: any, d: Date) {
  //   const x = await this.getPhoto(k); //{v,d}
  //   const y = JSON.parse(x); //{v,d}
  //   if (new Date(y.d).getTime() != d.getTime()) {
  //     const w = await this.getBase64ImageFromUrl(k); // check caching then load from server and save
  //     return this.caching.set(k, w);
  //   }
  //   return null;
  // }

  // async saveCachingPhoto(k: string, d: Date) {
  //   let x = await this.getPhoto(k); //{v,d}
  //   if(!x)x=  this.caching.set(k, '');
  //   const y = JSON.parse(x); //{v,d}
  //   if (new Date(y.d).getTime() != d.getTime()) {
  //     const w = await this.getBase64ImageFromUrl(k); // check caching then load from server and save
  //     return this.caching.set(k, w);
  //   }
  //   return new Promise<any>((resolve,reject)=>resolve(null));
  // }

  async saveCachingPhoto2(k: string, v: any) {
    const w = await this.getBase64ImageFromUrl(k); // check caching then load from server and save
    return this.caching.set(k, w);
  }
  async getBase64ImageFromUrl(imageUrl: string) {
    // const url = environment.serverFile+'file/download/' + imageUrl; // file manager
    const url = localStorage.getItem('url') || environment.url;
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        function() {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => reject(this);
      reader.readAsDataURL(blob);
    });
  }
}
