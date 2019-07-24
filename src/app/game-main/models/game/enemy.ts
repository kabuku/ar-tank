import * as THREE from 'three';
import {Gun} from './gun';
import {Explosion} from './fire';

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
  private hp: number;
  // tslint:disable-next-line:variable-name

  constructor(gun: THREE.Group, image: string, options?: Partial<EnemyOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      color: new THREE.Color(0x000000),
      hitPoint: DEFAULT_HIT_POINT
    }, options);

    this.hp = this.options.hitPoint;
    this.gun = new Gun(gun.clone(), {debug: this.options.debug, direction: -1});
    this.gun.name = 'enemyGun';
    this.gun.position.set(-0.533, 0, 0.423);
    this.add(this.gun);
    const body = this.createBody(image);
    this.add(body);

    this.hitMesh = new THREE.Mesh(body.geometry.clone(), new THREE.MeshBasicMaterial({transparent: true, opacity: 0}));
    this.add(this.hitMesh);
  }

  public shot() {
    this.gun.shot();
  }

  private createBody(image: string): THREE.Mesh {
    const black = new THREE.MeshBasicMaterial({color: this.options.color});
    const materials = [
      black,
      black,
      black,
      black,
      this.createFace(image),
      black,
      black
    ];

    const bodyGeometry = new THREE.BoxBufferGeometry(1, 2.08, 1.94);
    const body = new THREE.Mesh(bodyGeometry, materials);
    body.name = 'enemyBody';
    return body;
  }

  private createFace(image: string): THREE.Material {
    const img = document.createElement('img');
    img.src = image;
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    const faceMaterial = new THREE.MeshBasicMaterial({map: texture, overdraw: 1});
    return faceMaterial;
  }

  update = (delta: number, now: number) => {
    this.gun.update(delta, now);
  };

  damage(hp: number) {
    this.hp = hp;
    const damageRate = hp / this.options.hitPoint;
    if (damageRate <= 0.8) {

    } else if (damageRate <= 0.5) {

    } else if (damageRate <= 0.2) {

    } else if (damageRate <= 0.1) {

    }
  }
  endGame(result: 'win'|'draw'|'lose') {
    if (result === 'win') {
      this.win();
    } else if (result === 'draw') {
      this.draw();
    } else {
      this.lose();
    }
  }
  private draw() {

  }

  private lose() {

  }
  private win() {

  }

}
