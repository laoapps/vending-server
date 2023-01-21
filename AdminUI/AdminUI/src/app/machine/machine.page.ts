import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IMachineClientID } from '../services/syste.model';
import { MachineAddPage } from './machine-add/machine-add.page';
import { MachineDetailsPage } from './machine-details/machine-details.page';
import { SalePage } from '../sale/sale.page';



@Component({
  selector: 'app-machine',
  templateUrl: './machine.page.html',
  styleUrls: ['./machine.page.scss'],
})
export class MachinePage implements OnInit {
  _l = new Array<IMachineClientID>();    
  showImage!:(p:string)=>string;

  constructor(public apiService:ApiService) {
    this.showImage= this.apiService.showImage;
   }

  ngOnInit() {
    this.apiService.listMachine().subscribe(r=>{
      console.log(r);
      if(r.status){
        this._l.push(...r.data);
      }
      this.apiService.toast.create({message:r.message,duration:5000}).then(ry=>{
        ry.present();
      })
    })
  }
  new(){
    this.apiService.showModal(MachineAddPage).then(ro=>{
      ro?.present();
      ro?.onDidDismiss().then(r=>{
        console.log(r);
        if(r.data.s){
          this.apiService.addMachine(r.data.s)?.subscribe(rx=>{
            console.log(rx);
            if(rx.status){
              this._l.unshift(rx.data);
            }
            this.apiService.toast.create({message:rx.message,duration:5000}).then(ry=>{
              ry.present();
            })
            
          })
        }
      })
    })
  }
  edit(id:number){
    const s = this._l.find(v=>v.id==id);
    if(!s) return alert('Not found')
    this.apiService.showModal(MachineDetailsPage,{s}).then(ro=>{
      ro?.present();
      ro?.onDidDismiss().then(r=>{
        console.log(r);
        
        if(r.data.update){
          this.apiService.updateMachine(s,id).subscribe(rx=>{
            console.log(rx);
            if(rx.status){
              this._l.find((v,i)=>{
                if(v.id==rx.data.id){
                  this._l.splice(i,1,...[rx.data]);
                  return true;
                }
                return false;
              })
            }
            this.apiService.toast.create({message:rx.message,duration:5000}).then(ry=>{
              ry.present();
            })
            
          })
        }
      }).catch(e=>{
        console.log(e);
        
      })
    })
  }

  disable(id:number){
    const s = this._l.find(v=>v.id==id);
    if(!s) return alert('Not found')

          this.apiService.disableMachine(s.isActive!,id).subscribe(rx=>{
            console.log(rx);
            if(rx.status){
              this._l.find((v,i)=>{
                if(v.id==rx.data.id){
                  this._l.splice(i,1,...[rx.data]);
                  return true;
                }
                return false;
              })
            }
            this.apiService.toast.create({message:rx.message,duration:5000}).then(ry=>{
              ry.present();
            })
            
    })
  }
  sale(s:string){
    this.apiService.showModal(SalePage,{s}).then(ro=>{
      ro?.present();
      ro?.onDidDismiss().then(r=>{
        console.log(r);
      })
    });
  }
 
}




