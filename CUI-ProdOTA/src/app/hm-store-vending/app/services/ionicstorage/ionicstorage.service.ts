import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
@Injectable({
  providedIn: 'root'
})
export class IonicstorageService {
  dbStorage:Storage;
  constructor(private storage: Storage ) { 
    this.init()
  }
  async init() {
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this.dbStorage = storage;
  }
  set(k:string,v:any,dbname=''){
    return this.dbStorage.set(dbname+k,JSON.stringify({v,d:new Date()}));
  }


  setWithdate(k:string,v:any,d:Date){
    return this.dbStorage.set(k,JSON.stringify({v,d}));
  }

  get(k:string,dbname=''){
    return this.dbStorage.get(dbname+k);
  }
  async sharding(k:string,v:any,dbname=''){
    let x =await this.dbStorage.get(dbname+k);
    if(!Array.isArray(x))x=[];
    x.push({v,d:new Date()});
    return this.dbStorage.set(dbname+k,JSON.stringify(x));
  }
  async showShards(k:string,dbname=''){
    const s= await this.dbStorage.get(dbname+k);
    if(!Array.isArray(s))return [];
    return s;
  }
  async getShard(k:string,dbname=''){
    const s= await this.dbStorage.get(dbname+k);
    if(!Array.isArray(s))return [];
    return s[0];
  }

  keys(){
    return this.dbStorage.keys();
  }
  remove(k:string,dbname=''){
    return this.dbStorage.remove(dbname+k);
  }
  clear(){
    return this.dbStorage.clear();
  }
}
