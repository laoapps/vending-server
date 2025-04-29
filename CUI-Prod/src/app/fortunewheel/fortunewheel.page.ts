import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fortunewheel',
  templateUrl: './fortunewheel.page.html',
  styleUrls: ['./fortunewheel.page.scss'],
})
export class FortunewheelPage implements OnInit {

  constructor() { }
  ctx: CanvasRenderingContext2D;
  spinEl: HTMLDivElement;
  sectors = [
    { color: '#f82', label: 'Stack' },
    { color: '#0bf', label: '10' , image: '../../assets/coins/LAAB.png'},
    { color: '#fb0', label: '200' },
    { color: '#0fb', label: '50' },
    { color: '#b0f', label: '100' },
    { color: '#f0b', label: '5' },
    { color: '#bf0', label: '500' },
    { color: '#f82', label: 'Stack' },
    { color: '#0bf', label: '10' },
    { color: '#fb0', label: '200' },
    { color: '#0fb', label: '50' },
    { color: '#b0f', label: '100' , image: '../../assets/coins/money-coin.png' },
    { color: '#f0b', label: '5' },
    { color: '#bf0', label: '500'},
    { color: '#f0b', label: '5' },
    { color: '#bf0', label: '500'},
    { color: '#f0b', label: '5' },
    { color: '#bf0', label: '500'},
    { color: '#f0b', label: '5' },
    { color: '#bf0', label: '500'}
  ]
  tot = 0;
  dia = 0;
  rad = 0;
  TAU = 0;
  arc = 0;

  friction = 0.991 // 0.995=soft, 0.99=mid, 0.98=hard
  angVel = 0 // Angular velocity
  ang = 0 // Angle in radians

  getIndex = () => Math.floor(this.tot - (this.ang / this.TAU) * this.tot) % this.tot
  ngOnInit() {
    this.ctx = (document.querySelector('#wheel') as HTMLCanvasElement).getContext('2d');
    this.spinEl = document.querySelector('#spin') as HTMLDivElement
    this.tot = this.sectors.length
    this.dia = this.ctx.canvas.width;
    this.rad = this.dia / 2;
    this.TAU = 2 * Math.PI;
    this.arc = this.TAU / this.sectors.length
    this.init()
  }
  rand = (m, M) => Math.random() * (M - m) + m

  drawSector(sector, i) {
    const ang = this.arc * i
    this.ctx.save()
    // COLOR
    this.ctx.beginPath()
    this.ctx.fillStyle = sector.color
    this.ctx.moveTo(this.rad, this.rad)
    this.ctx.arc(this.rad, this.rad, this.rad, ang, ang + this.arc)
    this.ctx.lineTo(this.rad, this.rad)
    this.ctx.fill()
    // TEXT
    this.ctx.translate(this.rad, this.rad)
    this.ctx.rotate(ang + this.arc / 2)
    this.ctx.textAlign = 'right'
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 30px sans-serif'
    this.ctx.fillText(sector.label, this.rad - 10, 10)
    //
    // image
    const that = this;
    // const coinSize = {w:60,h:60}
    // console.log('check IMAGES');
    // if (sector.image) {
    //   const img = new Image();
    //   img.src = sector.image;
    //   img.onload = function () {
        
    //     that.ctx.drawImage(img, that.rad , 0 , coinSize.w, coinSize.h); // Or at whatever offset you like
    //     console.log('DRAW IMAGES');
    //   };
      
    // }
    
    this.ctx.restore()
  }

  rotate() {
    const sector = this.sectors[this.getIndex()];
    this.ctx.canvas.style.transform = `rotate(${this.ang - Math.PI / 2}rad)`;
    this.spinEl.textContent = !this.angVel ? 'SPIN' : sector.label;
    this.spinEl.style.background = sector.color;
  }

  frame() {
    if (!this.angVel) return
    this.angVel *= this.friction // Decrement velocity by friction
    if (this.angVel < 0.002) this.angVel = 0 // Bring to stop
    this.ang += this.angVel // Update angle
    this.ang %= this.TAU // Normalize angle
    this.rotate()
  }

  engine() {
    this.frame()
    requestAnimationFrame(this.engine.bind(this))
  }

  init() {
    this.sectors.forEach(this.drawSector.bind(this))
    this.rotate() // Initial rotation
    this.engine() // Start engine
    this.spinEl.addEventListener('click', () => {
      if (!this.angVel) this.angVel = this.rand(0.25, 0.45)
    })
  }


}
