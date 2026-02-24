import Phaser from 'phaser';
import { GameUI } from '../ui/GameUI.js';
import { GameManager } from '../systems/GameManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.isContinue = data?.continue || false;
    this.playerName = data?.playerName || '';
  }

  create() {
    const container = document.getElementById('game-container');
    this.ui = new GameUI(container, (actionId) => this.gm.doAction(actionId));
    this.gm = new GameManager(this.ui);

    if (this.isContinue && this.gm.hasSave()) {
      this.gm.loadGame();
    } else {
      this.gm.newGame(this.playerName);
    }

    this.ui.show();
  }

  cleanupDOM() {
    if (this.ui) this.ui.destroy();
  }

  shutdown() {
    this.cleanupDOM();
  }
}
