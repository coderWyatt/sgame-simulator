import { getRankByIndex } from '../data/ranks.js';

const MAX_DAYS = 30;
const BASE_TIME = 10;

export class PlayerManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.name = '召唤师';
    this.emoji = '🪄';
    this.hp = 100;
    this.maxHp = 100;
    this.combat = 10;
    this.morale = 80;
    this.gold = 50;
    this.danger = 0;

    this.rankIndex = 0;
    this.day = 1;
    this.maxDays = MAX_DAYS;
    this.timeLeft = BASE_TIME;
    this.baseTime = BASE_TIME;

    this.sparUnlocked = false;
  }

  getRank() {
    return getRankByIndex(this.rankIndex);
  }

  promote() {
    if (this.rankIndex < 18) {
      this.rankIndex++;
      return true;
    }
    return false;
  }

  demote() {
    if (this.rankIndex > 0) {
      this.rankIndex--;
      return true;
    }
    return false;
  }

  spendTime(hours) {
    this.timeLeft -= hours;
  }

  getOvertimeHours() {
    return this.timeLeft < 0 ? Math.abs(this.timeLeft) : 0;
  }

  getTotalUsed() {
    return this.baseTime - this.timeLeft;
  }

  canAffordAction(cost) {
    return this.getTotalUsed() + cost <= 24;
  }

  advanceDay(overtimeHours) {
    this.day++;

    if (overtimeHours >= 6) {
      this.hp -= 20;
      this.combat -= 5;
      this.morale -= 10;
    } else if (overtimeHours >= 3) {
      this.hp -= 10;
      this.combat -= 3;
      this.morale -= 5;
    } else if (overtimeHours > 0) {
      this.hp -= 5;
      this.combat -= 1;
    } else {
      this.hp = Math.min(this.maxHp, this.hp + 15);
      this.morale = Math.min(100, this.morale + 5);
    }

    this.timeLeft = BASE_TIME;
    this.baseTime = BASE_TIME;
    this.clampStats();
  }

  applyStat(key, value) {
    if (typeof value === 'number') {
      this[key] = (this[key] || 0) + value;
    } else if (Array.isArray(value)) {
      const [min, max] = value;
      this[key] = (this[key] || 0) + min + Math.floor(Math.random() * (max - min + 1));
    }
    this.clampStats();
  }

  applyEffects(effects) {
    const changes = {};
    for (const [key, val] of Object.entries(effects)) {
      const before = this[key] || 0;
      this.applyStat(key, val);
      changes[key] = (this[key] || 0) - before;
    }
    this.clampStats();
    return changes;
  }

  clampStats() {
    this.hp = Math.max(0, Math.min(this.hp, this.maxHp));
    this.combat = Math.max(0, this.combat);
    this.morale = Math.max(0, Math.min(100, this.morale));
    this.gold = Math.max(0, this.gold);
    this.danger = Math.max(0, Math.min(100, this.danger));
  }

  toJSON() {
    return {
      name: this.name, emoji: this.emoji,
      hp: this.hp, maxHp: this.maxHp,
      combat: this.combat,
      morale: this.morale, gold: this.gold, danger: this.danger,
      rankIndex: this.rankIndex,
      day: this.day, maxDays: this.maxDays,
      timeLeft: this.timeLeft, baseTime: this.baseTime,
      sparUnlocked: this.sparUnlocked,
    };
  }

  fromJSON(data) {
    Object.assign(this, data);
    this.clampStats();
  }
}
