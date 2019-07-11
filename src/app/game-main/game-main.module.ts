import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameMainRoutingModule } from './game-main-routing.module';
import { MainPageComponent } from './containers/main-page.component';
import {MainComponent} from './components/main.component';
import { SceneComponent } from './components/scene.component';
import {MaterialModule} from '../material/material.module';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [MainPageComponent, MainComponent, SceneComponent],
  imports: [
    CommonModule,
    GameMainRoutingModule,
    MaterialModule,
    ReactiveFormsModule
  ]
})
export class GameMainModule { }
