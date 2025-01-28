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


  }

}
