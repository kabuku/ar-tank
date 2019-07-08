import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameMainRoutingModule } from './game-main-routing.module';
import { MainPageComponent } from './containers/main-page.component';
import {MainComponent} from './components/main.component';
import { SceneComponent } from './components/scene.component';


@NgModule({
  declarations: [MainPageComponent, MainComponent, SceneComponent],
  imports: [
    CommonModule,
    GameMainRoutingModule
  ]
})
export class GameMainModule { }
