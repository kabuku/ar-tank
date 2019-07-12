interface BaseArSourceOptions extends THREEx.ArToolkitSourceOptions {
  sourceType: 'webcam' | 'video' | 'image' | 'stream';
}

interface OriginalArSourceOptions extends BaseArSourceOptions {
  sourceType: 'webcam' | 'video' | 'image';
}

interface StreamArSourceOptions extends BaseArSourceOptions {
  sourceType: 'stream';
  stream: MediaStream;
}

export type ArSourceOptions = OriginalArSourceOptions | StreamArSourceOptions;

export interface GameOptions {
  debug: boolean;
  arSourceOptions: ArSourceOptions;
}
