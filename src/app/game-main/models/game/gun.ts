import {Assets} from '../assets';
import * as THREE from 'three';
import {Fire} from 'three/examples/jsm/objects/Fire';
import * as dat from 'dat.gui';

const CHARGE_TIME = 1000;
const GUN_FIRE_TIME = 500;


export class Gun extends THREE.Group {
  private gun: THREE.Group;
  private fire: Fire;
  private fireGroup: THREE.Group;
  private shooting = false;
  private chargeTime = 0; // ms
  public get chargingTime() {
    return this.chargeTime;
  }
  private gunFireTime = 0;
  private gunBoundingBox: THREE.Box3;
  private options: {debug: boolean};
  private originalRotation: THREE.Euler;

  constructor(private scene: THREE.Scene, private assets: Assets, options?: {debug: boolean}) {
    super();

    this.options = Object.assign({debug: false}, options);

    const gun = this.assets.gun.clone();

    const gunBox = new THREE.BoxHelper(gun);
    gunBox.geometry.computeBoundingBox();
    this.gunBoundingBox = new THREE.Box3().setFromObject(gun);
    this.gun = gun;
    this.add(gun);
    if (this.options.debug) {
      this.add(gunBox);
      // this.add(new THREE.GridHelper(10, 10));
      // this.add(new THREE.AxesHelper());
    }


  }

  private initFire(position: THREE.Vector3) {
    const gui = new dat.GUI();
    const plane = new THREE.PlaneBufferGeometry(1.5, 1.5);
    const fireGroup = new THREE.Group();
    this.add(fireGroup);

    this.fire = new Fire(plane, {
      textureWidth: 512,
      textureHeight: 512,
      debug: false,
      burnRate: 0,
      colorBias: 0.31,
      diffuse: 1.45,
      viscosity: 0,
      expansion: -1,
      swirl: 0,
      drag: 1,
      airSpeed: 19,
      speed: 500,
    });
    fireGroup.position.set(position.x, position.y, position.z);
    this.fire.rotation.y = Math.PI;
    this.fire.clearSources();
    this.fire.addSource(0.5, 0.1, 0.1, 1.0, 0.0, 1.0);
    this.fire.position.y -= new THREE.Box3().setFromObject(this.fire).min.y + 0.05;
    fireGroup.add(this.fire);
    this.fireGroup = fireGroup;
    const light = new THREE.PointLight(0xFFFFFF, 5, 1, 1.0);
    fireGroup.userData.light = light;
    this.scene.add(light);
  }

  public shot(): boolean {
    if (this.shooting) {
      return false;
    }

    if (this.chargeTime > 0) {
      return false;
    }

    this.initFire(
      new THREE.Vector3(0, this.gunBoundingBox.max.y - 0.1, this.gunBoundingBox.max.z)
    );
    this.shooting = true;
    this.chargeTime = CHARGE_TIME;
    this.gunFireTime = GUN_FIRE_TIME;
    this.originalRotation = this.rotation.clone();
    this.rotation.set(this.rotation.x + 10 * Math.PI / 180, this.rotation.y, this.rotation.z);
  }

  update(delta, now) {
    if (this.chargeTime > 0) {
      this.chargeTime = Math.max(0, this.chargeTime - delta * 1000);
    }

    if (!this.shooting) {
      return;
    }
    this.gunFireTime -= delta * 1000;
    if (this.gunFireTime < 0) {

      this.scene.remove(this.fireGroup.userData.light);
      this.remove(this.fireGroup);
      this.gunFireTime = 0;
      this.shooting = false;
      this.rotation.set(this.originalRotation.x, this.originalRotation.y, this.originalRotation.z);
      return;
    }
    const scale = this.gunFireTime / GUN_FIRE_TIME;
    this.fireGroup.scale.set(scale, scale, scale);
    this.rotation.set(this.originalRotation.x + 10 * scale * Math.PI / 180, this.rotation.y, this.rotation.z);
    this.fireGroup.userData.light.intensity = scale;

  }

}
