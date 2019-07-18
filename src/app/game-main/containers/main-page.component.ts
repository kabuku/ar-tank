import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {GameOptionsService} from '../services/game-options.service';

@Component({
  selector: 'at-main-page',
  template: `
    <at-main
      [assets]="assets"
      [loading]="loading"
      [gameOptions]="gameOptions"
      (gameOptionsChange)="onChangeGameOptions($event)"
    ></at-main>
  `,
  styles: []
})
export class MainPageComponent implements OnInit, OnDestroy {
  public assets: Assets;
  public loading = true;
  public gameOptions: GameOptions;
  private worker: Worker;
  private subject = new Subject();

  @ViewChild(MainComponent, {static: false}) mainComponentRef: MainComponent;

  constructor(
    private store: Store<any>,
    private router: Router,
    private webrtc: WebrtcConnectionService,
    private gameOptionsService: GameOptionsService,
    activeRoute: ActivatedRoute) {
    activeRoute.data.subscribe((data: {assets: Assets}) => this.assets = data.assets);
    this.router.events.pipe(takeUntil(this.subject)).subscribe((routerEvent: Event) => this.checkRouterEvent(routerEvent));
    this.gameOptions = this.gameOptionsService.get();

    this.worker = new Worker('../game-logic.worker', {type: 'module'});

    this.worker.onmessage = ({data}) => {
      // TODO
    }
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

  ngOnDestroy(): void {
    this.worker.terminate();
  }

  onChangeGameOptions(value: GameOptions) {
    this.gameOptionsService.set(value);
    this.gameOptions = value;
  }
}
