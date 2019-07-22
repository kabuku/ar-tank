
export type PlayerStatus = 'prepare'|'prepared'|'start'|'shot'|'hit'|'win'|'loose';

export interface PlayerState {
  lastUpdateTime: number;
  status: PlayerStatus;
  robotName: string;
  image: string|undefined;
  hp: number;
}
