import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Assets} from '../models/assets';
import {from, Observable} from 'rxjs';
import {map, mergeAll, reduce, take} from 'rxjs/operators';
import * as THREE from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {TextureLoader} from 'three';


type AssetType = 'json' | 'obj+mtl' | 'texture';

interface AssetSource {
  type: AssetType;
  id: keyof Assets;
}

interface JSONAssetSource extends AssetSource {
  type: 'json';
  url: string;
}

interface MTLOBJAssetSource extends AssetSource {
  type: 'obj+mtl';
  path: string;
  obj: string;
  mtl: string;
}
interface TextureAssetSource extends AssetSource {
  type: 'texture';
  url: string;
}

type AssetSources = JSONAssetSource | MTLOBJAssetSource | TextureAssetSource;

interface LoadedAsset {
  id: keyof Assets;
  type: AssetType;
}

interface JSONLoadedAssets extends LoadedAsset {
  type: 'json';
  materials: THREE.Material[];
  geometry: THREE.Geometry;
}

interface MTLOBJLoadedAssets extends LoadedAsset {
  type: 'obj+mtl';
  group: THREE.Group;
}

interface TextureLoadedAssets extends LoadedAsset {
  type: 'texture';
  texture: THREE.Texture;
}


type LoadedAssets = JSONLoadedAssets | MTLOBJLoadedAssets | TextureLoadedAssets;

const assetSources: AssetSources[] = [
  {type: 'obj+mtl', id: 'gun', path: '/assets/models/gun/', obj: 'model.obj', mtl: 'materials.mtl'},
  {type: 'obj+mtl', id: 'gun2', path: '/assets/models/gun2/', obj: 'model.obj', mtl: 'materials.mtl'},
  {type: 'texture', id: 'flare', url: '/assets/models/flare/flare.png'},
];

@Injectable({
  providedIn: 'root'
})
export class AssetsResolveService implements Resolve<Assets> {

  constructor() {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Assets> | Promise<Assets> | Assets {

    return from(assetSources)
      .pipe(
        map<AssetSources, Promise<LoadedAssets>>(source => {
            switch (source.type) {
              case 'json':
                return new Promise(r => new THREE.JSONLoader().load(source.url, (geometry, materials) => r({
                  geometry,
                  materials,
                  type: source.type,
                  id: source.id
                } as JSONLoadedAssets)));
              case 'obj+mtl':
                return new Promise(r => {
                  const mtlLoader = new MTLLoader();
                  const loader = new OBJLoader();
                  mtlLoader.setPath(source.path);
                  mtlLoader.load(source.mtl, materials => {
                    materials.preload();
                    loader.setMaterials(materials).setPath(source.path).load(source.obj, group => {
                      r({id: source.id, type: source.type, group} as MTLOBJLoadedAssets);
                    });
                  });
                });
                case 'texture':
                  return new Promise(r => {
                    const loader = new TextureLoader();
                    loader.load(source.url, texture => r({id: source.id, type: source.type, texture}));
                  });
            }
          }
        ),
        mergeAll(),
        reduce<LoadedAssets, Partial<Assets>>((assets, asset) => {
          switch (asset.type) {
            case 'obj+mtl':
              assets[asset.id] = asset.group;
              break;
            case 'texture':
              assets[asset.id] = asset.texture;
              break;
          }
          return assets;
        }, {} as Partial<Assets>),
        take(1),
        map(asset => asset as Assets)
      );
  }
}
