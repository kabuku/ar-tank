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
import {Observable, Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {takeUntil} from 'rxjs/operators';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';
import {GameOptions} from '../models/game-options';
import {MainComponent} from '../components/main.component';
import {GameOptionsService} from '../services/game-options.service';
import {GameLogicService} from '../services/game-logic.service';
import {PlayerState} from '../models/player-state';
import {GameState, GameStatus} from '../models/game-state';

@Component({
  selector: 'at-main-page',
  template: `
    <at-main
      [assets]="assets"
      [loading]="loading"
      [gameState]="gameState$ | async"
      [myState]="myState$ | async"
      [enemyState]="enemyState$ | async"
      [gameOptions]="gameOptions"

      (gameOptionsChange)="onChangeGameOptions($event)"
      (updateGameStatus)="gameLogic.updateGameStatus($event)"
      (updateMyStatus)="gameLogic.updatePlayerState($event)"
      (updateEnemyStatus)="gameLogic.updateEnemyState($event)"
    ></at-main>
  `,
  styles: []
})
export class MainPageComponent implements OnInit, OnDestroy {
  public assets: Assets;
  public loading = true;
  public gameOptions: GameOptions;
  public gameState$: Observable<GameState>;
  public myState$: Observable<PlayerState>;
  public enemyState$: Observable<PlayerState>;
  private routerEventSubject = new Subject();

  @ViewChild(MainComponent, {static: false}) mainComponentRef: MainComponent;

  constructor(
    private store: Store<any>,
    private router: Router,
    private gameLogic: GameLogicService,
    private gameOptionsService: GameOptionsService,
    activeRoute: ActivatedRoute) {
    activeRoute.data.subscribe((data: {assets: Assets}) => this.assets = data.assets);
    activeRoute.queryParamMap.subscribe(async paramMap => {
      const myRobotName = paramMap.get('myName') || 'dalailama';
      const enemyRobotName = paramMap.get('enemyName') || 'nobunaga';
      const mqttBrokerHost = paramMap.get('host') || 'localhost';
      await this.gameLogic.init({mqttBrokerHost, myRobotName, enemyRobotName});
    });
    this.router.events.pipe(takeUntil(this.routerEventSubject)).subscribe((routerEvent: Event) => this.checkRouterEvent(routerEvent));

    this.gameOptions = this.gameOptionsService.get();

    this.gameState$ = this.gameLogic.gameState$;
    this.myState$ = this.gameLogic.myState$;
    this.enemyState$ = this.gameLogic.enemyState$;


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
      this.routerEventSubject.complete();
    }
  }

  ngOnDestroy(): void {
  }

  onChangeGameOptions(value: GameOptions) {
    this.gameOptionsService.set(value);
    this.gameOptions = value;
  }
}
