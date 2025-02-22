import { Injectable } from '@angular/core';
import { IonicstorageService } from './ionicstorage.service';

@Injectable({
  providedIn: 'root'
})
export class AppcachingserviceService {
  dbname = 'cachingdb';
  constructor(public  ionicStorage: IonicstorageService) {}
  set(k: string, v: any) {
    return this.ionicStorage.set(this.dbname + k, v);
  }
  setWithdate(k: string, v: any,d: Date) {
    return this.ionicStorage.setWithdate(this.dbname + k, v,d);
  }
  get(k: string) {
    return this.ionicStorage.get(this.dbname + k);
  }
  keys() {
    return this.ionicStorage.keys();
  }
  remove(k: string) {
    return this.ionicStorage.remove(this.dbname + k);
  }
  clear(){
    return this.ionicStorage.clear();
  }
}
