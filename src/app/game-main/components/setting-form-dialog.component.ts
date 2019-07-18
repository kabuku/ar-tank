import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {GameOptions} from '../models/game-options';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';

@Component({
  selector: 'at-setting-form-dialog',
  templateUrl: './setting-form-dialog.component.html',
  styleUrls: ['./setting-form-dialog.component.scss']
})
export class SettingFormDialogComponent {

  constructor(public dialogRef: MatDialogRef<SettingFormDialogComponent>,
              private webrtc: WebrtcConnectionService,
              @Inject(MAT_DIALOG_DATA) public gameOptions: GameOptions) {

    if (this.gameOptions.arSourceOptions.sourceType === 'stream' && !this.gameOptions.arSourceOptions.stream) {
      const {hostPath, signalingPath} = this.gameOptions.arSourceOptions;
      this.webrtc.connect(hostPath, signalingPath).subscribe(stream => {
        console.log(stream);
        if (this.gameOptions.arSourceOptions.sourceType === 'stream') {
          this.gameOptions.arSourceOptions.stream = stream;
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }


  onConnect(gameOptions: GameOptions) {
    if (!gameOptions.arSourceOptions
      || gameOptions.arSourceOptions.sourceType !== 'stream'
      || !gameOptions.arSourceOptions.hostPath
      || !gameOptions.arSourceOptions.signalingPath) {
      return;
    }
    const {hostPath, signalingPath} = gameOptions.arSourceOptions;
    this.webrtc.connect(hostPath, signalingPath).subscribe(stream => {
      if (gameOptions.arSourceOptions.sourceType === 'stream') {
        gameOptions.arSourceOptions.stream = stream;
      }
    });
  }
}
