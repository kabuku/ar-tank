import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {AxesHelper, CameraHelper, Color, Mesh} from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {Assets} from '../models/assets';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Gun} from '../models/game/gun';

class Data {
  positionX = 0.01;
  positionY = 0.01;
  positionZ = 0.01;
  rotationX = 0.0;
  rotationY = 0.0;
  rotationZ = 0.0;
  scale = 1;
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

  constructor() {
  }

  ngAfterViewInit() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha:false
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
    // window.scene = scene;
    // window.THREE = THREE;
////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////
    const arToolkitSource = new THREEx.ArToolkitSource({
      // to read from the webcam
      sourceType: 'webcam',
      displayHeight: 480,
      displayWidth: 640,
      // to read from an image
      // sourceType : 'image',
      // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',
      // to read from a video
      // sourceType : 'video',
      // sourceUrl : "https://storage.googleapis.com/kabuku-dev-ohashi-test/movie/headtracking.mp4",
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
    const artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
      type: 'pattern',
      patternUrl: '/assets/data/data/patt.hiro',
      // patternUrl: ""
      // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
    });
    console.log('artoolkitMarker', artoolkitMarker);

    console.log('arToolkitContext', arToolkitContext);

    //////////////////////////////////////////////////////////////////////////////////
    // 		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    const playerGun = new Gun(scene, this.assets, {debug: true});

    playerGun.position.set(0.116, -0.057, -0.317);
    playerGun.rotation.set(0, 185 * Math.PI / 180, -2 * Math.PI / 180);
    playerGun.scale.set(0.2, 0.2, 0.2);
    scene.add(playerGun);
    onRenderFcts.push((delta, now) => playerGun.update(delta, now));

    const m = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.5, transparent: true});
    const geo = new THREE.BoxBufferGeometry(3, 3, 3);
    const box = new THREE.Mesh(geo, m);
    box.position.set(0, -1.5, 0);
    const bbox = new THREE.BoxHelper(box, new Color(0xffff00));
    markerRoot.add(bbox);
    // markerRoot.add(new THREEx.ArMarkerHelper(artoolkitMarker).object3d);
    const videoTex = new THREE.VideoTexture(arToolkitSource.domElement as HTMLVideoElement);  // 映像をテクスチャとして取得
    videoTex.minFilter = THREE.NearestFilter;             // 映像テクスチャのフィルタ処理
    const cloak = new THREEx.ArMarkerCloak(videoTex);       // マーカ隠蔽(cloak)オブジェクト
    // @ts-ignore
    cloak.object3d.material.uniforms.opacity.value = 1.0; // cloakの不透明度
    markerRoot.add(cloak.object3d);

    const axis = new THREE.AxesHelper(10);

    markerRoot.add(axis);
    const gridHelper = new THREE.GridHelper(20, 5);  // 引数は サイズ、1つのグリッドの大きさ
    markerRoot.add(gridHelper);
    markerRoot.add(box);
    const bullets = [];
    const geometry = new THREE.IcosahedronBufferGeometry(1, 2);
    window.addEventListener('click', e => {
      playerGun.shot();
      const material = new THREE.MeshPhongMaterial({color: 0xb6c4c6});
      const object = new THREE.Mesh(geometry, material);
      object.position.set(camera.position.x, camera.position.y, camera.position.z);
      object.position.z -= 10;
      scene.add(object);
      bullets.push(object);
      onRenderFcts.push((delta, now) => {
        object.translateZ(-500 * delta);
      });
    });

// 	// add a torus knot
// var geometry	= new THREE.CubeGeometry(1,1,1);
// var material	= new THREE.MeshNormalMaterial({
// 	transparent : true,
// 	opacity: 0.5,
// 	side: THREE.DoubleSide
// });
// var mesh	= new THREE.Mesh( geometry, material );
// mesh.position.y	= geometry.parameters.height/2
// markerRoot.add( mesh );
// var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
// var material	= new THREE.MeshNormalMaterial();
// var mesh	= new THREE.Mesh( geometry, material );
// mesh.position.y	= 0.5
// // scene.add( mesh );
// onRenderFcts.push(function(){
// 	mesh.rotation.x += 0.1
// })
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
      const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0, 0, -1));
      const objs = ray.intersectObjects(scene.children, true);

      // if(objs.length > 0) {
      //     console.log("ray", objs);
      // }

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
