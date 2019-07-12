import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router, Event, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {map, takeUntil} from 'rxjs/operators';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';
import {GameOptions} from '../models/game-options';

@Component({
  selector: 'at-main-page',
  template: `
    <div>
    <at-main
      [assets]="assets"
      [loading]="loading"
    ></at-main>
      <div></div>
      {{gameOptions | json}}
      <at-setting-form [(gameOptions)]="gameOptions"></at-setting-form>

    </div>
  `,
  styles: []
})
export class MainPageComponent implements OnInit {
  public assets: Assets;
  public loading = true;
  public gameOptions: GameOptions;
  public stream: Observable<MediaStream>;
  private subject = new Subject();


  constructor(
    private store: Store<any>,
    private router: Router,
    private webRtc: WebrtcConnectionService,
    activeRoute: ActivatedRoute) {
    activeRoute.data.subscribe((data: {assets: Assets}) => this.assets = data.assets);
    this.router.events.pipe(takeUntil(this.subject)).subscribe((routerEvent: Event) => this.checkRouterEvent(routerEvent));
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
