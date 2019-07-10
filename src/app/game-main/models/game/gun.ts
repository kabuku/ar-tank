import * as THREE from 'three';
import {Fire} from 'three/examples/jsm/objects/Fire';
import {SpotLight} from 'three';

const DEFAULT_CHARGE_TIME = 1000;
const DEFAULT_GUN_FIRE_TIME = 500;
const DEFAULT_GUN_FIRE_LIGHT_INTENSITY = 1;

interface GunOptions {
  debug: boolean;
  chargeTime: number;
  gunFireTime: number;
  gunFireLightIntensity: number;
}

export class Gun extends THREE.Group {
  private gun: THREE.Group;
  private fireGroup: THREE.Group;
  private shooting = false;
  private chargeTime = 0; // ms
  public get chargingTime() {
    return this.chargeTime;
  }
  private gunFireTime = 0;
  private gunBoundingBox: THREE.Box3;
  private options: GunOptions;
  private originalRotation: THREE.Euler;

  constructor(private originGun: THREE.Group, options?: Partial<GunOptions>) {
    super();

    this.options = Object.assign(
      {
        debug: false,
        chargeTime: DEFAULT_CHARGE_TIME,
        gunFireTime: DEFAULT_GUN_FIRE_TIME,
        gunFireLightIntensity: DEFAULT_GUN_FIRE_LIGHT_INTENSITY
      },
      options
    );

    const gun = originGun.clone();
    gun.name = 'gun';
    const gunBox = new THREE.BoxHelper(gun);
    gunBox.name = 'gunBox';
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
    const plane = new THREE.PlaneBufferGeometry(1.5, 1.5);
    const fireGroup = new THREE.Group();
    this.add(fireGroup);

    const fire = new Fire(plane, {
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
    fire.rotation.y = Math.PI;
    fire.clearSources();
    fire.addSource(0.5, 0.1, 0.1, 1.0, 0.0, 1.0);
    fire.position.y -= new THREE.Box3().setFromObject(fire).min.y + 0.05;
    fireGroup.add(fire);
    this.fireGroup = fireGroup;
    const light = new THREE.PointLight(0xFFFFFF, this.options.gunFireLightIntensity, 1, 1.0);
    light.position.set(0.5, 0.5, -1.0);
    light.name = 'fireLight';
    this.fireGroup.add(light);
    if (this.options.debug) {
      this.fireGroup.add(new THREE.AxesHelper());
    }
  }

  public shot(): boolean {
    if (this.shooting) {
      return false;
    }

    if (this.chargeTime > 0) {
      return false;
    }

    this.initFire(
      new THREE.Vector3(0, 0.03, 0.52)
    );
    this.shooting = true;
    this.chargeTime = this.options.chargeTime;
    this.gunFireTime = this.options.gunFireTime;
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

      this.remove(this.fireGroup);
      this.gunFireTime = 0;
      this.shooting = false;
      this.rotation.set(this.originalRotation.x, this.originalRotation.y, this.originalRotation.z);
      return;
    }
    const scale = this.gunFireTime / this.options.gunFireTime;
    this.fireGroup.scale.set(scale, scale, scale);
    this.rotation.set(this.originalRotation.x + 10 * scale * Math.PI / 180, this.rotation.y, this.rotation.z);
    (this.fireGroup.getObjectByName('fireLight') as SpotLight).intensity = this.options.gunFireLightIntensity * scale;

  }

}
