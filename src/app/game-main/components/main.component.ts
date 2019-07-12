import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Assets} from '../models/assets';
import {GameOptions} from '../models/game-options';
import {SceneComponent} from './scene.component';

@Component({
  selector: 'at-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild(SceneComponent, {static: false}) sceneRef: SceneComponent;

  @Input() loading: boolean;
  @Input() assets: Assets;
  @Input() gameOptions: GameOptions;

  constructor() { }

  start() {
    this.sceneRef.start();
  }

  ngOnInit() {
  }

}
