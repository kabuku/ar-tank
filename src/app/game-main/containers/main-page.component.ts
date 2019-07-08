import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router, Event, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {map, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'at-main-page',
  template: `
    <at-main
      [assets]="assets"
      [loading]="loading"
    ></at-main>
  `,
  styles: []
})
export class MainPageComponent implements OnInit {
  public assets: Assets;
  public loading = true;
  private subject = new Subject();
  constructor(private store: Store<any>, private router: Router, activeRoute: ActivatedRoute) {
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
