import {GameStatus, PlayerStatus} from './game-state';

export type GameCommand = 'init' | 'update-game-status' | 'update-player-status' | 'send';
export type GameEvent = 'workerInitialized';
export type RobotName = 'nobunaga'|'';

interface BaseGameWorkerMessage {
  command: GameCommand;
  data: any;
}


export interface InitWorkerMessage extends BaseGameWorkerMessage {
  command: 'init';
  data: {
    mqttBrokerHost: string;
    myRobotName: RobotName;
  };
}

export interface UpdateGameStatusWorkerMessage extends BaseGameWorkerMessage {
  command: 'update-game-status';
  data: GameStatus;
}

export interface UpdatePlayerStatusWorkerMessage extends BaseGameWorkerMessage {
  command: 'update-player-status';
  data: PlayerStatus;
}

export type GameWorkerMessage = InitWorkerMessage | UpdateGameStatusWorkerMessage | UpdatePlayerStatusWorkerMessage;

interface BaseGameWorkerEvent {
  event: GameEvent;
}

interface WorkerInitializedEvent extends BaseGameWorkerEvent {
  event: 'workerInitialized';
}

export type GameWorkerEvent = WorkerInitializedEvent;

