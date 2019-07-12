import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router, Event, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {map, takeUntil} from 'rxjs/operators';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';
import {GameOptions} from '../models/game-options';
import {MainComponent} from '../components/main.component';

@Component({
  selector: 'at-main-page',
  template: `
    <div>
    <at-main
      [assets]="assets"
      [loading]="loading"
      [gameOptions]="gameOptions"
    ></at-main>
      <div></div>
      {{gameOptions | json}}
      <at-setting-form [(gameOptions)]="gameOptions" (onConnect)="onConnect($event)"></at-setting-form>
      <button mat-raised-button (click)="mainComponentRef.start()">開始</button>
    </div>
  `,
  styles: []
})
export class MainPageComponent implements OnInit {
  public assets: Assets;
  public loading = true;
  public gameOptions: GameOptions;
  private subject = new Subject();

  @ViewChild(MainComponent, {static: false}) mainComponentRef: MainComponent;

  constructor(
    private store: Store<any>,
    private router: Router,
    private webrtc: WebrtcConnectionService,
    activeRoute: ActivatedRoute) {
    activeRoute.data.subscribe((data: {assets: Assets}) => this.assets = data.assets);
    this.router.events.pipe(takeUntil(this.subject)).subscribe((routerEvent: Event) => this.checkRouterEvent(routerEvent));
    this.gameOptions = {
      debug: true,
      arSourceOptions: {
        sourceType: 'stream',
        signalingPath: 'wss://raspberrypi.local:8090/stream/webrtc',
        hostPath: 'raspberrypi.local',
        displayHeight: 480,
        displayWidth: 640,
      }
    };

    if (this.gameOptions.arSourceOptions.sourceType === 'stream') {
      const {hostPath, signalingPath} = this.gameOptions.arSourceOptions;
      this.webrtc.connect(hostPath, signalingPath).subscribe(stream => {
        console.log(stream);
        if (this.gameOptions.arSourceOptions.sourceType === 'stream') {
          this.gameOptions.arSourceOptions.stream = stream;
          this.mainComponentRef.start();
        }
      });
    }
  }

  ngOnInit() {
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

  private checkRouterEvent(routerEvent: Event) {
    if (routerEvent instanceof NavigationStart) {
      this.loading = true;
    }
    if (routerEvent instanceof NavigationEnd ||
      routerEvent instanceof NavigationCancel ||
      routerEvent instanceof NavigationError) {
      this.loading = false;
      this.subject.complete();
    }
  }
}
