import {Component, Input, OnInit} from '@angular/core';
import {Assets} from '../models/assets';

@Component({
  selector: 'at-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @Input() loading: boolean;
  @Input() assets: Assets;

  constructor() { }

  ngOnInit() {
  }

}
