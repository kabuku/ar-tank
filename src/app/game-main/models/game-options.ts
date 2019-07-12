interface BaseArSourceOptions extends Partial<THREEx.ArToolkitSourceOptions> {
  sourceType: 'webcam' | 'video' | 'image' | 'stream';
}

interface WebcamArSourceOptions extends BaseArSourceOptions {
  sourceType: 'webcam';
}

interface ExternalSourceArSourceOptions extends BaseArSourceOptions {
  sourceType: 'video' | 'image';
  sourceURL: string;
}

interface StreamArSourceOptions extends BaseArSourceOptions {
  sourceType: 'stream';
  stream?: MediaStream;

  hostPath: string;
  signalingPath: string;
}

export type ArSourceOptions = ExternalSourceArSourceOptions | WebcamArSourceOptions | StreamArSourceOptions;

export interface GameOptions {
  debug: boolean;
  arSourceOptions: ArSourceOptions;
}
