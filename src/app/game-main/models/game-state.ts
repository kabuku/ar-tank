
export type GameStatus = 'wait' | 'prepare' | 'prepared' | 'start' | 'end';
export type PlayerStatus = 'prepare'|'prepared'|'start'|'shot'|'hit'|'win'|'loose';

export interface GameState {
  gameStatus: GameStatus;
  myStatus: PlayerStatus;
  enemyStatus: PlayerStatus;
}
