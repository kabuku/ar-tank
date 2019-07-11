import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {AxesHelper, CameraHelper, Color} from 'three';
import {Assets} from '../models/assets';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Gun} from '../models/game/gun';
import {Enemy} from "../models/game/enemy";

interface ThreeJSDebugWindow extends Window {
  scene: THREE.Scene;
  THREE: typeof THREE;
}

declare var window: ThreeJSDebugWindow;

class Stats {
  shoot: boolean;
}

@Component({
  selector: 'at-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit {

  @Input() assets: Assets;

  @ViewChild('root', {static: false})
  private rootDiv: ElementRef;

  private stats: Stats;

  constructor() {
  }

  ngAfterViewInit() {
    this.stats = new Stats();
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
    const arToolkitSource = new THREEx.ArToolkitSource({
      // to read from the webcam
      sourceType: 'webcam',
      displayHeight: 480,
      displayWidth: 640,
    });
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
    onRenderFcts.push((delta, now) => {
      playerGun.update(delta, now);
      if (!this.stats.shoot) {
        return;
      }
      this.stats.shoot = false;
      if (!playerGun.shot()) {
        return;
      }
      if (!markerRoot.visible) {
        return;
      }

      

      if ((-1 <= markerRoot.position.x && markerRoot.position.x <= 1)
        && (-1 <= markerRoot.position.y && markerRoot.position.y <= 1)
        && (-100 < markerRoot.position.z && markerRoot.position.z < 0)) {
        console.log("hit");
        enemy.hit();
      } else {
        console.log("not hit");
      }
    });

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
