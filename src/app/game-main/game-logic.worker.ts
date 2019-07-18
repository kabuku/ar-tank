/// <reference lib="webworker" />

import {Client, connect} from 'mqtt';
import {GameWorkerEvent, GameWorkerMessage} from './models/game-worker-message';
import {GameState} from './models/game-state';

class GameLogicWorker {
  gameState: GameState = {
    gameStatus: 'wait',
    myStatus: 'prepare',
    enemyStatus: 'prepare'
  };
  mqttClient: Client;
  myRobotName: string;
  constructor() {
    addEventListener('message', this.handleWorkerMessage);
  }

  handleWorkerMessage = async ({ data }: {data: GameWorkerMessage}) => {

    switch (data.command) {
      case 'init':
        this.mqttClient = await this.init(data.data);
        this.postMessage({event: 'workerInitialized'});
        return;
      case 'update-game-status':
        this.mqttClient.publish('game/status', `${new Date().toISOString()},${data.data}`);
        return;
      case 'update-player-status':
        this.gameState.myStatus = data.data;
        this.mqttClient.publish(`${this.myRobotName}/status`, `${new Date().toISOString()},${data.data}`);


    }

  };

  handleMQTTMessage = (topic: string, payload: Buffer) => {};

  async init({mqttBrokerHost, myRobotName}): Promise<Client> {
    this.myRobotName = myRobotName;
    const client = connect(`mqtt://${mqttBrokerHost}:9001`);
    return new Promise((resolve, reject) => this.mqttClient.on('connect', () => {
      client.subscribe('game/status');
      client.subscribe('robot-name');
      client.subscribe(`${myRobotName}/status`);
      client.on('message', this.handleMQTTMessage);
      resolve(client);
    }).on('error', err => reject(err)));
  }

  postMessage(event: GameWorkerEvent) {
    postMessage(event);
  }





}


