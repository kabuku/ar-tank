import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameMainRoutingModule } from './game-main-routing.module';
import { MainPageComponent } from './containers/main-page.component';
import {MainComponent} from './components/main.component';
import { SceneComponent } from './components/scene.component';
import {MaterialModule} from '../material/material.module';
import {ReactiveFormsModule} from '@angular/forms';
import { SettingFormComponent } from './components/setting-form.component';
import {FlexLayoutModule} from '@angular/flex-layout';


@NgModule({
  declarations: [MainPageComponent, MainComponent, SceneComponent, SettingFormComponent],
  imports: [
    CommonModule,
    GameMainRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
  ]
})
export class GameMainModule { }
