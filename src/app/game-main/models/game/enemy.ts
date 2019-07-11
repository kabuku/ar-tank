import * as THREE from 'three';
import {Gun} from './gun';

const DEFAULT_HIT_POINT = 100;

interface EnemyOptions {
  debug: boolean;
  color: THREE.Color;
  hitPoint: number;
}

export class Enemy extends THREE.Group {

  private readonly gun: Gun;
  private options: EnemyOptions;
  public hitMesh: THREE.Mesh;
  // tslint:disable-next-line:variable-name
  private _hitPoint: number;

  public get hitPoint(): number {
    return this._hitPoint;
  }

  constructor(gun: THREE.Group, options?: Partial<EnemyOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      color: new THREE.Color(0xff0000),
      hitPoint: DEFAULT_HIT_POINT
    }, options);

    this._hitPoint = this.options.hitPoint;
    this.gun = new Gun(gun.clone(), {debug: this.options.debug, direction: -1});
    this.gun.name = 'enemyGun';
    this.gun.position.set(-0.533, 0, 0.423);
    this.add(this.gun);
    const body = this.createBody();
    this.add(body);

    this.hitMesh = new THREE.Mesh(body.geometry.clone(), new THREE.MeshBasicMaterial({transparent: true, opacity: 0}));
    this.add(this.hitMesh);
  }

  public shot() {
    this.gun.shot();
  }

  private createBody(): THREE.Mesh {
    const bodyMaterial = new THREE.MeshBasicMaterial({color: this.options.color});
    const bodyGeometry = new THREE.BoxBufferGeometry();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'enemyBody';
    return body;
  }

  update = (delta: number, now: number) => {
    this.gun.update(delta, now);
  };

  hit(position: THREE.Vector3) {
    this._hitPoint -= 10;

  }
}
