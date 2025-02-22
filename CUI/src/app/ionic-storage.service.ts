import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
@Injectable({
  providedIn: 'root'
})
export class IonicStorageService {
  dbStorage: Storage;
  constructor(private storage: Storage ) {
    this.init();
  }
  async init() {
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this.dbStorage = storage;
  }
  set(k: string,v: any,dbname=''){
    return new Promise<any>((resolve,reject)=>{
      this.dbStorage.set(dbname+k,JSON.stringify({v,d:new Date()})).then(r=>{
        resolve(r);
      }).catch(e=>{
        reject(e);
      });
    });

  }
  set2(k: string,v: string,dbname=''){
    return new Promise<any>((resolve,reject)=>{
      this.dbStorage.set(dbname+k,v).then(r=>{
        resolve(r);
      }).catch(e=>{
        reject(e);
      });
    });

  }
  get2(k: string,dbname=''){
    return new Promise<string>((resolve,reject)=>{
      this.dbStorage.get(dbname+k).then(r=>{
        resolve(r);
      }).catch(e=>{
        console.log('error',e);
        reject(e);
      });
    });
  }


  setWithdate(k: string,v: any,d: Date){
    return new Promise<any>((resolve,reject)=>{
      this.dbStorage.set(k,JSON.stringify({v,d})).then(r=>{
        resolve(r);
      }).catch(e=>{
        console.log('error',e);
        reject(e);
      });
    });

  }

  get(k: string,dbname=''){
    return new Promise<{v: any;d: Date}>((resolve,reject)=>{
      this.dbStorage.get(dbname+k).then(r=>{
        // console.log('storage GET',r);

        const rx = r?r:'{}';

        resolve(JSON.parse(rx) as {v: any;d: Date});
      }).catch(e=>{
        console.log('error',e);

        reject(e);
      });
    });
  }
  async sharding(k: string,v: any,dbname=''){
    let x =await this.dbStorage.get(dbname+k);
    if(!Array.isArray(x)){x=[];}
    x.push({v,d:new Date()});
    return this.dbStorage.set(dbname+k,JSON.stringify(x));
  }
  async showShards(k: string,dbname=''){
    const s= await this.dbStorage.get(dbname+k);
    if(!Array.isArray(s)){return [];}
    return s;
  }
  async getShard(k: string,dbname=''){
    const s= await this.dbStorage.get(dbname+k);
    if(!Array.isArray(s)){return [];}
    return s[0];
  }

  keys(){
    return this.dbStorage.keys();
  }
  remove(k: string,dbname=''){
    return this.dbStorage.remove(dbname+k);
  }
  clear(){
    return this.dbStorage.clear();
  }
}
