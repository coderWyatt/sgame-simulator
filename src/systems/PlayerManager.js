import { getRankByIndex } from '../data/ranks.js';
import { getDifficulty } from '../data/difficulty.js';

const BASE_TIME = 10;

export class PlayerManager {
  constructor() {
    this.reset();
  }

  reset(difficultyId) {
    const diff = getDifficulty(difficultyId || this.difficultyId || 'hard');
    this.difficultyId = diff.id;
    this.name = '召唤师';
    this.emoji = '🪄';
    this.hp = 100;
    this.maxHp = 100;
    this.combat = diff.startCombat;
    this.morale = 80;
    this.gold = diff.startGold;
    this.danger = 0;

    this.rankIndex = 0;
    this.day = 1;
    this.maxDays = diff.maxDays;
    this.timeLeft = BASE_TIME;
    this.baseTime = BASE_TIME;

    this.sparUnlocked = false;

    // 英雄系统
    this.heroId = 'warrior';
    this.unlockedHeroes = ['warrior'];

    // 成就系统
    this.achievements = [];
    this.totalWins = 0;
    this.totalShopBuys = 0;
    this.totalOvertimes = 0;
    this.morale100Days = 0;

    // 连胜/连败
    this.winStreak = 0;
    this.loseStreak = 0;
    this.maxWinStreak = 0;

    // 天赋系统
    this.talents = [];
    this.talentTiersClaimed = [];

    // 好友系统
    this.friends = [];
    this.activeFriendId = null;

    // 赛季任务
    this.dailyQuests = [];
    this.completedQuestIds = [];
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

    if (overtimeHours <= 0) {
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
      difficultyId: this.difficultyId,
      name: this.name, emoji: this.emoji,
      hp: this.hp, maxHp: this.maxHp,
      combat: this.combat,
      morale: this.morale, gold: this.gold, danger: this.danger,
      rankIndex: this.rankIndex,
      day: this.day, maxDays: this.maxDays,
      timeLeft: this.timeLeft, baseTime: this.baseTime,
      sparUnlocked: this.sparUnlocked,
      heroId: this.heroId,
      unlockedHeroes: this.unlockedHeroes,
      achievements: this.achievements,
      totalWins: this.totalWins,
      totalShopBuys: this.totalShopBuys,
      totalOvertimes: this.totalOvertimes,
      morale100Days: this.morale100Days,
      winStreak: this.winStreak,
      loseStreak: this.loseStreak,
      maxWinStreak: this.maxWinStreak,
      talents: this.talents,
      talentTiersClaimed: this.talentTiersClaimed,
      friends: this.friends,
      activeFriendId: this.activeFriendId,
      dailyQuests: this.dailyQuests,
      completedQuestIds: this.completedQuestIds,
    };
  }

  fromJSON(data) {
    Object.assign(this, data);
    if (!this.difficultyId) this.difficultyId = 'hard';
    if (!this.unlockedHeroes) this.unlockedHeroes = ['warrior'];
    if (!this.heroId) this.heroId = 'warrior';
    if (!this.achievements) this.achievements = [];
    if (!this.talents) this.talents = [];
    if (!this.talentTiersClaimed) this.talentTiersClaimed = [];
    if (!this.friends) this.friends = [];
    if (!this.dailyQuests) this.dailyQuests = [];
    if (!this.completedQuestIds) this.completedQuestIds = [];
    this.clampStats();
  }

  getTalentEffect(key) {
    let total = 0;
    for (const t of this.talents) {
      if (t.effect && t.effect[key] !== undefined) total += t.effect[key];
    }
    return total;
  }

  hasTalent(key) {
    return this.getTalentEffect(key) !== 0;
  }

  getDiff() {
    return getDifficulty(this.difficultyId);
  }
}
