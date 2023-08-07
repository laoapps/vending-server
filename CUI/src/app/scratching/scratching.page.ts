import { Component, OnInit } from '@angular/core';
import { ScratchCard, SCRATCH_TYPE } from 'scratchcard-js';

@Component({
  selector: 'app-scratching',
  templateUrl: './scratching.page.html',
  styleUrls: ['./scratching.page.scss'],
})
export class ScratchingPage implements OnInit {
   scContainer = document.getElementById('js--sc--container');
   sc :any;
  constructor() { }

  ngOnInit() {
    setTimeout(() => {
      this.scContainer = document.getElementById('js--sc--container')
        this.sc=new ScratchCard(this.scContainer, {
      scratchType: SCRATCH_TYPE.LINE,
      containerWidth: this.scContainer?.offsetWidth,
      containerHeight: 300,
      imageForwardSrc: '../../assets/scratchcard.png',
      imageBackgroundSrc: '/images/result.png',
      htmlBackground: '',
      clearZoneRadius: 20,
      nPoints: 0,
      pointSize: 0,
      callback: function () {}
  })
    this.sc.init().then(() => {
      // Do what you want
      // ex: listen scratch.move event
      console.log('sc move');
      
    }).catch((error) => {
      // image not loaded
      console.log('sc move error');
      
    });
    this.sc.canvas.addEventListener('scratch.move', () => {
      let percent = this.sc.getPercent();
      console.log('scratch.move',percent);
      
      // ...
    });
    }, 2000);
  
  }

}
