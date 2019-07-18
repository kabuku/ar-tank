import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  ActivatedRoute,
  Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';
import {Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {takeUntil} from 'rxjs/operators';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';
import {GameOptions} from '../models/game-options';
import {MainComponent} from '../components/main.component';

@Component({
  selector: 'at-main-page',
  template: `
    <at-main
      [assets]="assets"
      [loading]="loading"
      [gameOptions]="gameOptions"
    ></at-main>
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
      gunColor: 'gun',
      model: {
        scale: 1,
        mae: {x: 0, y: -0.5, z: 0},
        ushiro: {x: 0, y: -0.5, z: 0},
        hidari: {x: 0, y: -0.5, z: 0},
        migi: {x: 0, y: -0.5, z: 0},
      },
      machineName: 'dalailama',
      arSourceOptions: {
        sourceType: 'image',
        // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
        // hostPath: 'raspberrypi-dalailama.local',
        sourceUrl: 'https://raspberrypi-dalailama.local:8080/stream/video.mjpeg',
        displayHeight: 480,
        displayWidth: 640,
        sourceHeight: 240,
        sourceWidth: 320
        // sourceType: 'stream',
        // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
        // hostPath: 'raspberrypi-dalailama.local',
        // displayHeight: 480,
        // displayWidth: 640,
        // sourceHeight: 240,
        // sourceWidth: 320
      }
    };
  }

  ngOnInit() {
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
