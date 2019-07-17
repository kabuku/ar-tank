import * as THREE from 'three';
import {Gun} from './gun';

const DEFAULT_HIT_POINT = 100;


interface PlayerOptions {
  debug: boolean;
  hitPoint: number;
}



export class Player extends THREE.Group {

  private readonly gun: Gun;
  // tslint:disable-next-line:variable-name
  private _hitPoint: number;

  constructor(gun: THREE.Group, sightTexture: THREE.Texture, private camera: THREE.Camera, private options: Partial<PlayerOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      hitPoint: DEFAULT_HIT_POINT
    }, options);

    this._hitPoint = this.options.hitPoint;
    this.gun = new Gun(gun.clone(), { debug: this.options.debug });
    this.gun.name = 'playerGun';
    this.gun.position.set(0.116, -0.057, -0.317);
    this.gun.rotation.set(0, 185 * Math.PI / 180, -2 * Math.PI / 180);
    this.gun.scale.set(0.2, 0.2, 0.2);
    this.add(this.gun);
  }

  update(delta, now) {
    this.gun.update(delta, now);
  }

  shot(): boolean {
    return this.gun.shot();
  }
}
