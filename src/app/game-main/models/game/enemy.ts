import * as THREE from 'three';
import {Gun} from './gun';
import {Sphere} from 'three';

interface EnemyOptions {
  debug: boolean;
  color: THREE.Color;
}

export class Enemy extends THREE.Group {

  private readonly gun: Gun;
  private options: EnemyOptions;
  private hitBall: THREE.Sphere;

  constructor(gun: THREE.Group, options?: Partial<EnemyOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      color: new THREE.Color(0xffffff),
    }, options);

    this.gun = new Gun(gun.clone(), {debug: this.options.debug, direction: -1});
    this.gun.name = 'enemyGun';
    this.gun.position.set(-0.533, 0, 0.423);
    this.add(this.gun);
    const body = this.createBody();
    this.add(body);
  }

  public shot() {
    this.gun.shot();
  }

  public intersectsSphere(box: THREE.Mesh): boolean {

    if (!this.visible) {
      return false;
    }


    const body = this.getObjectByName('enemyBody') as THREE.Mesh;
    body.geometry.computeBoundingSphere();
    this.hitBall = new Sphere(this.parent.getWorldPosition(new THREE.Vector3()), body.geometry.boundingSphere.radius * 1);
    this.add(new THREE.Mesh(
      new THREE.SphereBufferGeometry(this.hitBall.radius),
      new THREE.MeshBasicMaterial({transparent: true, opacity: 0.5, color: 0x00ff00})
    ));
    console.log(this.hitBall.center);
    box.geometry.computeBoundingBox();
    console.log(box.geometry.boundingBox);
    return this.hitBall.intersectsBox(box.geometry.boundingBox);
  }

  private createBody() {
    const bodyMaterial = new THREE.MeshBasicMaterial({color: this.options.color});
    const bodyGeometry = new THREE.BoxBufferGeometry();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'enemyBody';
    return body;
  }

  update = (delta: number, now: number) => {
    this.gun.update(delta, now);
  }


}
