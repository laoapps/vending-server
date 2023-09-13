import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-readme',
  templateUrl: './readme.page.html',
  styleUrls: ['./readme.page.scss'],
})
export class ReadmePage implements OnInit {

  isTabReadMe: boolean = true;
  isTabVersion: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}
