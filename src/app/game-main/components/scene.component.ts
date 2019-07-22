import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {AxesHelper, CameraHelper, Raycaster} from 'three';
import {Assets} from '../models/assets';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Enemy} from '../models/game/enemy';
import * as Stats from 'stats.js';
import {Explosion} from '../models/game/fire';
import {GameOptions} from '../models/game-options';
import {Player} from '../models/game/player';
import {GameState} from '../models/game-state';
import {PlayerState} from '../models/player-state';

import {SpriteText2D, textAlign} from 'three-text2d';

const GAME_TIME_SEC = 65;
const START_COUNTDOWN_SEC = 5;


interface ThreeJSDebugWindow extends Window {
  scene: THREE.Scene;
  THREE: typeof THREE;
}

declare var window: ThreeJSDebugWindow;

class GameStats {
  shoot: boolean;
  damage: boolean;
  damaging: boolean;
  end: boolean;
  start: boolean;
  result: 'win' | 'loose';
}

interface EnemyMarker {
  name: string;
  patternFile: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

@Component({
  selector: 'at-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit {
  get enemyState(): PlayerState {
    return this._enemyState;
  }

  @Input()
  set enemyState(value: PlayerState) {
    this._enemyState = value;
  }

  get myState(): PlayerState {
    return this._myState;
  }

  @Input()
  set myState(value: PlayerState) {

    if (value.status === 'shot') {
      this.stats.shoot = true;
      return;
    } else if (value.status === 'hit') {
      this.stats.damage = true;
    }

    this._myState = value;
  }

  get gameState(): GameState {
    return this._gameState;
  }

  @Input()
  set gameState(value: GameState) {

    if (!this.gameState) {
      this._gameState = value;
      return;
    }

    if (this.gameState.status === 'prepared' && value.status === 'start') {
      this.startTime = value.lastUpdateTime;
      this.startStartCountdown();
    }
    this._gameState = value;
  }

  @Input()
  set gameOptions(value: Partial<GameOptions>) {
    this._gameOptions = value;
  }

  get gameOptions() {
    return this._gameOptions;
  }


  constructor() {
  }

  @Input() assets: Assets;

  startCountdown = '';

  timer = '';

  private animationFrameId: number;

  // tslint:disable-next-line:variable-name
  private _gameOptions: Partial<GameOptions>;

  @ViewChild('root', {static: false})
  private rootDiv: ElementRef;

  private hitTargets: THREE.Object3D[] = [];

  private explosions: Explosion[] = [];

  private stats: GameStats;

  private gameInitialized = false;

  private enemies: Enemy[] = [];

  private enemyMarkerRoots: THREE.Group[];

  private onRenderFcts: ((delta?: number, now?: number) => void)[];

  private startTime: number;

  private scene: THREE.Scene;

  // tslint:disable-next-line:variable-name
  private _gameState: GameState;
  // tslint:disable-next-line:variable-name
  private _myState: PlayerState;
  // tslint:disable-next-line:variable-name
  private _enemyState: PlayerState;

  private startStartCountdown() {

    const startCountdown = new SpriteText2D('5', {align: textAlign.center, font: '50px Arial', fillStyle: '#000000', antialias: true});
    startCountdown.translateZ(-100);
    this.scene.add(startCountdown);

    const intervalId = setInterval(() => {

      if (startCountdown.text === '開始') {
        clearInterval(intervalId);
        this.scene.remove(startCountdown);
        this.startGameTimer();
        return;
      }

      const dt = Math.floor((new Date().getTime() - this.startTime) / 1000);
      startCountdown.text = dt >= START_COUNTDOWN_SEC ? '開始' : `${START_COUNTDOWN_SEC - dt}`;

    }, 500);
  }

  private startGameTimer() {
    const countdown = new SpriteText2D('60', {align: textAlign.center, font: '50px Arial', fillStyle: '#000000', antialias: true});
    countdown.translateY(165);
    countdown.translateZ(-500);
    this.scene.add(countdown);
    const intervalId = setInterval(() => {
      const dt = Math.floor((new Date().getTime() - this.startTime) / 1000);
      if (dt <= GAME_TIME_SEC) {
        countdown.text = `${GAME_TIME_SEC - dt}`;
      } else {
        countdown.text = '0';
        clearInterval(intervalId);
      }
    }, 200);
  }

  ngAfterViewInit(): void {
    this.initGame();
  }

  start() {
    if (!this._gameOptions) {
      return;
    }
    if (this.gameInitialized) {
      while (this.rootDiv.nativeElement.lastChild) {
        this.rootDiv.nativeElement.removeChild(this.rootDiv.nativeElement.lastChild);
      }
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.initGame();
  }

  private initGame() {
    this.hitTargets = [];
    this.explosions = [];
    this.enemies = [];
    this.enemyMarkerRoots = [];
    this.stats = new GameStats();
    this.onRenderFcts = [];

    const {renderer, renderer2} = this.initRenderer();

    if (this.gameOptions.debug) {
      const stats = new Stats();
      stats.dom.style.position = 'absolute';
      stats.dom.style.top = '0px';
      stats.dom.style.zIndex = '100';
      this.rootDiv.nativeElement.appendChild(stats.dom);
      this.onRenderFcts.push(() => stats.update());
    }

    // init scene and camera
    const {scene, debugCamera, camera} = this.initWorld(renderer2);
    this.scene = scene;

    // init ar context, source
    const arToolkitContext = this.initAr(renderer, camera);

    // setup enemy
    this.setupEnemy(scene, arToolkitContext, camera);

    // setup explosions
    this.setupExplosions(scene, camera);

    // setup player
    this.setupPlayer(scene, renderer, camera);

    // render the scene
    this.onRenderFcts.push(() => {
      renderer.render(scene, camera);
      renderer2.render(scene, debugCamera);
    });

    // run the rendering loop
    let lastTimeMsec = null;
    const animate = (nowMsec) => {
      // keep looping
      this.animationFrameId = requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      this.onRenderFcts.forEach(onRenderFct => onRenderFct(deltaMsec / 1000, nowMsec / 1000));
    };
    this.animationFrameId = requestAnimationFrame(animate);
    this.gameInitialized = true;
  }

  private setupExplosions(scene, camera) {
    this.onRenderFcts.push((delta, now) => {
      this.explosions.filter(ex => ex.burnOut).forEach(ex => ex.parent.remove(ex));
      this.explosions = this.explosions.filter(ex => !ex.burnOut);
      this.explosions.forEach(explosion => {

        if (explosion.parent !== scene) {
          const cameraPos = camera.position.clone();
          const localCameraPos = explosion.parent.worldToLocal(cameraPos);
          explosion.lookAt(localCameraPos);
        } else {
          explosion.lookAt(camera.position);
        }
        explosion.update(delta, now);
      });
    });
  }

  private setupPlayer(scene: THREE.Scene, renderer: THREE.Renderer, camera: THREE.Camera) {
    const player = new Player(this.assets.gun, this.assets.sight, camera, {debug: this.gameOptions.debug});

    scene.add(player);
    renderer.domElement.addEventListener('click', () => this.stats.shoot = true);

    this.onRenderFcts.push((delta, now) => player.update(delta, now));

    let lastDamageTime = 0;
    this.onRenderFcts.push((delta, now) => {

      if (now - lastDamageTime > 3) {
        this.stats.damaging = false;
      }

      if (!this.stats.damage) {
        return;
      }

      this.stats.damaging = true;
      lastDamageTime = now;
      player.damage(now, this.myState.hp);
    });


    this.onRenderFcts.push(() => {

      if (!this.stats.shoot) {
        return;
      }
      this.stats.shoot = false;
      if (!player.shot()) {
        return;
      }
      const ray = new Raycaster(camera.position, new THREE.Vector3(0, 0, -1));
      const intersections = ray.intersectObjects(this.hitTargets, true);
      console.log('intersections', intersections);
      let ex: Explosion;
      if (intersections.length === 0) {
        console.log('intersections not found');

        // 遠いところに適当に爆発
        ex = new Explosion({direction: -1, position: new THREE.Vector3(0, 0, -10), fireTime: 2000});
        ex.name = 'explosion';
        scene.add(ex);
        this.explosions.push(ex);

        return;
      }
      const intersectionObject = intersections[0];
      if (intersectionObject.distance === 0) {
        console.log('not hit');
        // 遠いところに適当に爆発
        ex = new Explosion({direction: -1, position: new THREE.Vector3(0, 0, -10), fireTime: 2000});
        ex.name = 'explosion';
        scene.add(ex);
        this.explosions.push(ex);

        return;
      }
      if (intersectionObject.object.parent != null && intersectionObject.object.parent !== scene) {
        console.log('hit to enemy', intersectionObject.object);
        const vec = intersectionObject.point.clone();
        intersectionObject.object.parent.worldToLocal(vec);
        ex = new Explosion({direction: -1, position: vec, fireTime: 20000});
        intersectionObject.object.parent.add(ex);
      } else {
        console.log('hit to non-enemy');
        ex = new Explosion({direction: -1, position: intersectionObject.point.clone(), fireTime: 2000});
        scene.add(ex);
      }
      ex.name = 'explosion';
      this.explosions.push(ex);

      this.enemies
        .filter(enemy => enemy.parent.visible)
        .filter(enemy => intersectionObject.object.parent.uuid === enemy.uuid)
        .forEach(enemy => enemy.hit(intersectionObject.point.clone()));

    });
  }

  private initAr(renderer, camera) {
    let arToolkitSource: THREEx.ArToolkitSource;

    if (this._gameOptions.arSourceOptions.sourceType !== 'stream') {
      arToolkitSource = new THREEx.ArToolkitSource(this._gameOptions.arSourceOptions);
    } else {
      arToolkitSource = new THREEx.ArToolkitSource({...this._gameOptions.arSourceOptions, sourceType: 'video'});
    }
    arToolkitSource.init(() => {
      console.log('initialized');
      console.log(arToolkitSource.domElement);
      this.rootDiv.nativeElement.appendChild(arToolkitSource.domElement);
      onResize();
    });
    if (this._gameOptions.arSourceOptions.sourceType === 'image') {
      (arToolkitSource.domElement as HTMLImageElement).crossOrigin = 'anonymous';
    } else if (this._gameOptions.arSourceOptions.sourceType === 'stream') {
      (arToolkitSource.domElement as HTMLVideoElement).srcObject = this._gameOptions.arSourceOptions.stream;
    }
    // handle resize
    window.addEventListener('resize', () => {
      onResize();
    });

    function onResize() {
      arToolkitSource.copyElementSizeTo(renderer.domElement);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }
    }

    // create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      debug: this.gameOptions.debug,
      cameraParametersUrl: '/assets/data/data/camera_para.dat',
      detectionMode: 'mono',
      patternRatio: 0.8
    } as Partial<THREEx.ArToolkitContextOptions>);
    // initialize it
    arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // update artoolkit on every frame
    this.onRenderFcts.push(() => {
      if (arToolkitSource.ready === false) {
        return;
      }
      arToolkitContext.update(arToolkitSource.domElement);

    });
    return arToolkitContext;
  }

  private initWorld(renderer2: THREE.Renderer) {
    const scene = new THREE.Scene();

    const debugCamera = new THREE.PerspectiveCamera();
    debugCamera.lookAt(new THREE.Vector3(0, 0, 0));
    debugCamera.position.set(0, 5, -10);
    scene.add(new AxesHelper());
    new OrbitControls(debugCamera, renderer2.domElement);
    const camera = new THREE.Camera();
    scene.add(camera);
    scene.add(new CameraHelper(camera));
    const ambientLight = new THREE.HemisphereLight(0xcccccc, 1);
    scene.add(ambientLight);

    // for debug by chrome extension
    if (this.gameOptions.debug) {
      window.scene = scene;
      window.THREE = THREE;
    }
    return {scene, debugCamera, camera};
  }

  private initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(new THREE.Color(0xcccccc), 0);
    renderer.setSize(this.gameOptions.arSourceOptions.displayWidth, this.gameOptions.arSourceOptions.displayHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    this.rootDiv.nativeElement.appendChild(renderer.domElement);

    const renderer2 = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer2.setClearColor(new THREE.Color('lightgrey'), 1);
    renderer2.setSize(this.gameOptions.arSourceOptions.displayWidth, this.gameOptions.arSourceOptions.displayHeight);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = '0px';
    renderer2.domElement.style.left = `${this.gameOptions.arSourceOptions.displayWidth}px`;
    this.rootDiv.nativeElement.appendChild(renderer2.domElement);
    return {renderer, renderer2};
  }

  private setupEnemy(scene: THREE.Scene, arToolkitContext: THREEx.ArToolkitContext, camera: THREE.Camera) {
    const scale = this.gameOptions.model.scale || 1.2;
    const enemyMarkerOptions: EnemyMarker[] = [
      {
        name: 'enemy-mae',
        patternFile: 'pattern-mae.patt',
        position: new THREE.Vector3(this.gameOptions.model.mae.x, this.gameOptions.model.mae.y, this.gameOptions.model.mae.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 0, 0)
      },
      {
        name: 'enemy-ushiro',
        patternFile: 'pattern-usiro.patt',
        position: new THREE.Vector3(this.gameOptions.model.ushiro.x, this.gameOptions.model.ushiro.y, this.gameOptions.model.ushiro.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 180 * Math.PI / 180, 0)
      },
      {
        name: 'enemy-migi',
        patternFile: 'pattern-migi.patt',
        position: new THREE.Vector3(this.gameOptions.model.migi.x, this.gameOptions.model.migi.y, this.gameOptions.model.migi.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, -90 * Math.PI / 180, 0)
      },
      {
        name: 'enemy-hidari',
        patternFile: 'pattern-hidari.patt',
        position: new THREE.Vector3(this.gameOptions.model.hidari.x, this.gameOptions.model.hidari.y, this.gameOptions.model.hidari.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 90 * Math.PI / 180, 0)
      },
    ];

    enemyMarkerOptions.forEach(em => {
      const markerRoot = new THREE.Group();
      markerRoot.name = em.name;
      scene.add(markerRoot);
      const artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: `/assets/marker/${em.patternFile}?${new Date().getTime()}`
      });
      const enemy = new Enemy(this.assets.gun2, this.enemyState.image, {debug: true});
      enemy.position.set(em.position.x * scale, em.position.y * scale, em.position.z * scale);
      enemy.rotation.copy(em.rotation);
      enemy.scale.set(scale, scale, scale);
      markerRoot.add(enemy);
      this.onRenderFcts.push(enemy.update);
      this.enemies.push(enemy);
      this.hitTargets.push(markerRoot);
      this.enemyMarkerRoots.push(markerRoot);
    });

    // control enemy visibility
    this.onRenderFcts.push(() => {
      const visibleMarkers = this.enemyMarkerRoots.filter(markerRoot => markerRoot.visible);

      if (visibleMarkers.length < 2) {
        return;
      }
      visibleMarkers.sort((m1, m2) => Math.abs(m2.rotation.z) - Math.abs(m1.rotation.z)).forEach((marker, i) => {
        if (i !== 0) {
          marker.visible = false;
        }
      });

      // if (this.gameOptions.debug) {
      //   this.enemyMarkerRoots.map(markerRoot => {
      //     if (markerRoot.userData && markerRoot.userData.text) {
      //       markerRoot.remove(markerRoot.userData.text);
      //     }
      //     if (markerRoot.visible) {
      //
      //       const x = Math.round(markerRoot.rotation.x * 180 / Math.PI);
      //       const y = Math.round(markerRoot.rotation.y * 180 / Math.PI);
      //       const z = Math.round(markerRoot.rotation.z * 180 / Math.PI);
      //       const text = this.makeTextSprite(`${markerRoot.name} x:${x} y:${y} z:${z}`);
      //       text.position.copy(markerRoot.position);
      //       markerRoot.add(text);
      //       markerRoot.userData.text = text;
      //     }
      //   });
      // }
    });

  }

  // from https://stackoverflow.com/questions/23514274/three-js-2d-text-sprite-labels
  private makeTextSprite(message, parameters?): THREE.Sprite {
    if (parameters === undefined) {
      parameters = {};
    }
    const fontface = parameters.hasOwnProperty('fontface') ? parameters.fontface : 'Arial';
    const fontsize = parameters.hasOwnProperty('fontsize') ? parameters.fontsize : 18;
    const borderThickness = parameters.hasOwnProperty('borderThickness') ? parameters.borderThickness : 0;
    const borderColor = parameters.hasOwnProperty('borderColor') ? parameters.borderColor : {r: 0, g: 0, b: 0, a: 1.0};
    const backgroundColor = parameters.hasOwnProperty('backgroundColor') ? parameters.backgroundColor : {r: 255, g: 255, b: 255, a: 1.0};
    const textColor = parameters.hasOwnProperty('textColor') ? parameters.textColor : {r: 0, g: 0, b: 0, a: 1.0};

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold ' + fontsize + 'px ' + fontface;
    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    context.fillStyle = 'rgba(' + backgroundColor.r + ',' + backgroundColor.g + ',' + backgroundColor.b + ',' + backgroundColor.a + ')';
    context.strokeStyle = 'rgba(' + borderColor.r + ',' + borderColor.g + ',' + borderColor.b + ',' + borderColor.a + ')';

    context.lineWidth = borderThickness;

    const roundRect = (c, x, y, w, h, r) => {
      c.beginPath();
      c.moveTo(x, y + r);
      c.arc(x + r, y + h - r, r, Math.PI, Math.PI / 2, 1);
      c.arc(x + w - r, y + h - r, r, Math.PI / 2, 0, 1);
      c.arc(x + w - r, y + r, r, 0, Math.PI * 3 / 2, 1);
      c.arc(x + r, y + r, r, Math.PI * 3 / 2, Math.PI, 1);
      c.closePath();
    };
    roundRect(context, borderThickness / 2, borderThickness / 2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

    context.fillStyle = 'rgba(' + textColor.r + ', ' + textColor.g + ', ' + textColor.b + ', 1.0)';
    context.fillText(message, borderThickness, fontsize + borderThickness);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({map: texture});
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.002 * canvas.width, 0.0025 * canvas.height, 1);
    return sprite;
  }


}
