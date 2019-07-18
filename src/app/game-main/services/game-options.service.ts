import {Injectable} from '@angular/core';
import {GameOptions} from '../models/game-options';

const LOCAL_STORAGE_KEY_NAME = 'gameOptions';
const DEFAULT_GAME_OPTIONS: GameOptions = {
  debug: true,
  gunColor: 'gun',
  model: {
    scale: 1,
    mae: {x: 0, y: -0.5, z: 0},
    ushiro: {x: 0, y: -0.5, z: 0},
    hidari: {x: 0, y: -0.5, z: 0},
    migi: {x: 0, y: -0.5, z: 0},
  },
  machineName: 'dalailama',
  arSourceOptions: {
    sourceType: 'image',
    // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
    // hostPath: 'raspberrypi-dalailama.local',
    sourceUrl: 'https://raspberrypi-dalailama.local:8080/stream/video.mjpeg',
    displayHeight: 480,
    displayWidth: 640,
    sourceHeight: 240,
    sourceWidth: 320
    // sourceType: 'stream',
    // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
    // hostPath: 'raspberrypi-dalailama.local',
    // displayHeight: 480,
    // displayWidth: 640,
    // sourceHeight: 240,
    // sourceWidth: 320
  }
};

@Injectable({
  providedIn: 'root'
})
export class GameOptionsService {


  constructor() {
  }

  get(): GameOptions {

    const gameOptionStr = localStorage.getItem(LOCAL_STORAGE_KEY_NAME);

    if (!gameOptionStr) {
      return deepClone(DEFAULT_GAME_OPTIONS);
    }

    try {
      return JSON.parse(gameOptionStr);
    } catch (e) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_NAME);
      return deepClone(DEFAULT_GAME_OPTIONS);
    }
  }

  set(value: GameOptions) {
    localStorage.setItem(LOCAL_STORAGE_KEY_NAME, JSON.stringify(value));
  }

  remove() {
    localStorage.removeItem(LOCAL_STORAGE_KEY_NAME);
  }


}
function deepClone<T>(source: T): T {
  const results: Partial<T> = {};
  for (const p in source) {
    if (typeof source[p] === 'object') {
      results[p] = deepClone(source[p]);
    } else {
      results[p] = source[p];
    }
  }
  return results as T;
}
