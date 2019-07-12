import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {AxesHelper, CameraHelper, Color, Raycaster} from 'three';
import {Assets} from '../models/assets';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Gun} from '../models/game/gun';
import {Enemy} from '../models/game/enemy';
import * as Stats from 'stats.js';
import {Explosion} from '../models/game/fire';
import {GameOptions} from '../models/game-options';

interface ThreeJSDebugWindow extends Window {
  scene: THREE.Scene;
  THREE: typeof THREE;
}

declare var window: ThreeJSDebugWindow;

class GameStats {
  shoot: boolean;
}

@Component({
  selector: 'at-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit {

  @Input() assets: Assets;

  @Input() gameOptions: Partial<GameOptions>;

  @ViewChild('root', {static: false})
  private rootDiv: ElementRef;

  private hitTargets: THREE.Object3D[] = [];

  private explosions: Explosion[] = [];

  private stats: GameStats;

  constructor() {
  }

  ngAfterViewInit() {

    this.gameOptions = Object.assign({
      arSourceOptions: {
        sourceType: 'webcam',
        displayHeight: 480,
        displayWidth: 640,
      }
    }, this.gameOptions);

    this.stats = new GameStats();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    renderer.setClearColor(new THREE.Color('#ffffff'), 0);
    renderer.setSize(640, 480);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    this.rootDiv.nativeElement.appendChild(renderer.domElement);

    const renderer2 = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer2.setClearColor(new THREE.Color('lightgrey'), 1);
    renderer2.setSize(640, 480);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = '0px';
    renderer2.domElement.style.left = '640px';
    this.rootDiv.nativeElement.appendChild(renderer2.domElement);

// array of functions for the rendering loop
    const onRenderFcts = [];

    const stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.zIndex = '100';
    this.rootDiv.nativeElement.appendChild(stats.dom);
    onRenderFcts.push(() => stats.update());


// init scene and camera
    const scene = new THREE.Scene();
//////////////////////////////////////////////////////////////////////////////////
// 		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////
// Create a camera

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

    // for dubug
    window.scene = scene;
    window.THREE = THREE;
////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

    let arToolkitSource: THREEx.ArToolkitSource;

    if (this.gameOptions.arSourceOptions.sourceType !== 'stream') {
      arToolkitSource = new THREEx.ArToolkitSource(this.gameOptions.arSourceOptions);
    } else {
      arToolkitSource = new THREEx.ArToolkitSource({...this.gameOptions.arSourceOptions, sourceType: 'video'});
      (arToolkitSource.domElement as HTMLVideoElement).srcObject = this.gameOptions.arSourceOptions.stream;
    }

    arToolkitSource.init(() => {
      this.rootDiv.nativeElement.appendChild(arToolkitSource.domElement);
      onResize();
    });
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

////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////
// create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      debug: false,
      cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
      detectionMode: 'mono'
    });
// initialize it
    arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

// update artoolkit on every frame
    onRenderFcts.push(() => {
      if (arToolkitSource.ready === false) {
        return;
      }
      arToolkitContext.update(arToolkitSource.domElement);

    });
////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////
    const markerRoot = new THREE.Group();
    scene.add(markerRoot);
    markerRoot.translateZ(-50);
    const artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
      type: 'pattern',
      patternUrl: '/assets/data/data/patt.hiro',
    });
    console.log('artoolkitMarker', artoolkitMarker);

    console.log('arToolkitContext', arToolkitContext);

    const enemy = new Enemy(this.assets.gun2, {debug: true});
    enemy.scale.set(3, 3, 3);
    enemy.rotation.set(-90 * Math.PI / 180, 0, 0);
    enemy.position.set(0, -1.5, 0);
    markerRoot.add(enemy);
    onRenderFcts.push(enemy.update);
    const bbox = new THREE.BoxHelper(enemy, new Color(0xffff00));
    markerRoot.add(bbox);
    // markerRoot.add(new THREEx.ArMarkerHelper(artoolkitMarker).object3d);
    const axis = new THREE.AxesHelper(10);
    markerRoot.add(axis);
    const gridHelper = new THREE.GridHelper(20, 5);  // 引数は サイズ、1つのグリッドの大きさ
    markerRoot.add(gridHelper);

    this.hitTargets.push(enemy.hitMesh);

    //////////////////////////////////////////////////////////////////////////////////
    // 		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    const playerGun = new Gun(this.assets.gun, {debug: true});
    playerGun.name = 'playerGun';
    playerGun.position.set(0.116, -0.057, -0.317);
    playerGun.rotation.set(0, 185 * Math.PI / 180, -2 * Math.PI / 180);
    playerGun.scale.set(0.2, 0.2, 0.2);
    scene.add(playerGun);
    renderer.domElement.addEventListener('click', () => this.stats.shoot = true);

    this.explosions = [];
    onRenderFcts.push((delta, now) => {
      this.explosions.filter(ex => ex.burnOut).forEach(ex => ex.parent.remove(ex));
      this.explosions = this.explosions.filter(ex => !ex.burnOut);
      this.explosions.forEach(explosion => explosion.update(delta, now));
    });

    onRenderFcts.push((delta, now) => {
      playerGun.update(delta, now);
      if (!this.stats.shoot) {
        return;
      }
      this.stats.shoot = false;
      if (!playerGun.shot()) {
        return;
      }
      const ray = new Raycaster(camera.position, new THREE.Vector3(0, 0, -1));

      const intersections = ray.intersectObjects(this.hitTargets);
      console.log('intersections', intersections);
      let ex: Explosion;
      if (intersections.length === 0) {
        console.log('intersections not found');

        // 遠いところに適当に爆発
        ex = new Explosion({direction: -1, position: new THREE.Vector3(0, 0, -10)});
        ex.name = 'explosion';
        scene.add(ex);
        this.explosions.push(ex);

        return;
      }
      const intersectionObject = intersections[0];
      if (intersectionObject.distance === 0) {
        // 遠いところに適当に爆発
        ex = new Explosion({direction: -1, position: new THREE.Vector3(0, 0, -10)});
        ex.name = 'explosion';
        scene.add(ex);
        this.explosions.push(ex);

        return;
      }
      if (intersectionObject.object.parent != null) {
        const vec = intersectionObject.point.clone();
        intersectionObject.object.parent.worldToLocal(vec);
        ex = new Explosion({direction: -1, position: vec});
        intersectionObject.object.parent.add(ex);
      } else {
        ex = new Explosion({direction: -1, position: intersectionObject.point.clone()});
        scene.add(ex);
      }
      ex.name = 'explosion';
      this.explosions.push(ex);

      if (intersectionObject.object.parent.uuid === enemy.uuid) {
        enemy.hit(intersectionObject.point.clone());
      }

    });

//////////////////////////////////////////////////////////////////////////////////
// 		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////
// render the scene
    onRenderFcts.push(() => {
      renderer.render(scene, camera);
    });
    onRenderFcts.push(() => {
      renderer2.render(scene, debugCamera);
    });

// run the rendering loop
    let lastTimeMsec = null;
    const pos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    pos.unproject(camera);

    requestAnimationFrame(function animate(nowMsec) {
      // keep looping
      requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      onRenderFcts.forEach(onRenderFct => {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    });
  }

}
