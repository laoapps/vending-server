import { Component, OnInit } from '@angular/core';
import { ScratchCard, SCRATCH_TYPE } from 'scratchcard-js';

@Component({
  selector: 'app-scratching',
  templateUrl: './scratching.page.html',
  styleUrls: ['./scratching.page.scss'],
})
export class ScratchingPage implements OnInit {

  results = [
    '../../assets/scratch/bag.png',
    '../../assets/scratch/banana.png',
    '../../assets/scratch/cherries.png',
    '../../assets/scratch/pineapple.png',
    '../../assets/scratch/seven.png',
  ]
  constructor() { }

  ngOnInit() {
    setTimeout(() => {
      [...Array(9).keys()].forEach(v => {
        const c1 = document.getElementById('slot'+(v+1))
        const sc = new ScratchCard(c1, {
          scratchType: SCRATCH_TYPE.LINE,
          containerWidth: c1.offsetWidth,
          containerHeight: c1.offsetHeight,
          imageForwardSrc: '../../assets/scratchcard.png',
          imageBackgroundSrc:this.results[ Math.floor(Math.random() * this.results.length)],
          // htmlBackground: '',
          // brushSrc: 'https://switchy.a.cdnify.io/served/brush.png',
          clearZoneRadius: 20,
          nPoints: 0,
          pointSize: 0,
          percentToFinish: 60,
          callback: function () { }
        });
        c1.style.visibility='hidden'
        setTimeout(() => {
          (c1.children.item(0) as HTMLElement).style.position='absolute';
          (c1.children.item(0) as HTMLElement).style.zIndex='-1000';

          (c1.children.item(1) as HTMLElement).style.width='250px';
          (c1.children.item(1) as HTMLElement).style.height='250px';
          c1.style.visibility='visible'
        }, 500);
       
        sc.init().then(() => {
          // Do what you want
          // ex: listen scratch.move event
          console.log('sc move');
  
        }).catch((error) => {
          // image not loaded
          console.log('sc move error');
  
        });
        sc.canvas.addEventListener('scratch.move', () => {
          let percent = sc.getPercent();
          console.log('scratch.move', percent);
  
          // ...
        });
      })
     
    }, 2000);

  }

}
