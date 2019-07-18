import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Assets} from '../models/assets';
import {GameOptions} from '../models/game-options';
import {SceneComponent} from './scene.component';
import {MatDialog} from '@angular/material';
import {SettingFormDialogComponent} from './setting-form-dialog.component';

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

  @Output() gameOptionsChange = new EventEmitter<GameOptions>();

  constructor(public dialog: MatDialog) {
  }

  openSettingDialog() {
    const dialogRef = this.dialog.open(SettingFormDialogComponent, {
      width: '800px',
      data: this.gameOptions
    });
    dialogRef.afterClosed().subscribe(result => {
      this.gameOptions = result;
      this.gameOptionsChange.emit(this.gameOptions);
    });
  }

  start() {
    this.sceneRef.start();
  }

  ngOnInit() {
  }

}
