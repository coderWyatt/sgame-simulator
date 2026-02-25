import { PlayerManager } from './PlayerManager.js';
import { ActionSystem, getActionCost } from './ActionSystem.js';
import { EventSystem } from './EventSystem.js';
import { SaveManager } from './SaveManager.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { TALENTS } from '../data/talents.js';
import { QUEST_POOL } from '../data/quests.js';
import { FRIEND_POOL } from '../data/friends.js';
import { getHeroById } from '../data/heroes.js';

export class GameManager {
  constructor(ui) {
    this.ui = ui;
    this.player = new PlayerManager();
    this.actions = new ActionSystem(this.player);
    this.events = new EventSystem(this.player);
    this.save = new SaveManager();
    this.gameOver = false;
    this.actionLocked = false;
    this.resetDayStats();
  }

  resetDayStats() {
    this.dayStats = {
      actions: 0, rankWins: 0, rankLosses: 0, startRank: 0,
      overtimeActions: 0, trainCount: 0, restCount: 0,
      exploreCount: 0, boostCount: 0, sparCount: 0,
      shopBuys: 0, dangerGained: 0, promoted: 0,
      goldEarned: 0,
    };
  }

  newGame(playerName, difficultyId) {
    this.player.reset(difficultyId || 'hard');
    if (playerName) this.player.name = `ID：${playerName}`;
    this.gameOver = false;
    this.actionLocked = false;
    this.resetDayStats();
    this.dayStats.startRank = this.player.rankIndex;
    this.generateDailyQuests();
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', `第 1 天开始，当前 ${this.player.getRank().name}，${this.player.maxDays}天冲王者！`, 'system');
    this.save.clear();
  }

  loadGame() {
    const data = this.save.load();
    if (!data) return false;
    this.player.fromJSON(data);
    this.gameOver = false;
    this.actionLocked = false;
    this.resetDayStats();
    this.dayStats.startRank = this.player.rankIndex;
    if (!this.player.dailyQuests || this.player.dailyQuests.length === 0) this.generateDailyQuests();
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', '存档已加载。', 'save');
    return true;
  }

  saveGame() { this.save.save(this.player.toJSON()); }
  hasSave() { return this.save.hasSave(); }
  hasAnySave() { return this.save.hasAnySave(); }

  saveToSlot(slotId) {
    this.save.saveToSlot(slotId, this.player.toJSON());
    this.ui.addLog('good', `已保存到存档 ${slotId}`, 'save');
  }

  loadFromSlot(slotId) {
    let data;
    if (slotId === 'auto') {
      data = this.save.load();
    } else {
      data = this.save.loadFromSlot(slotId);
    }
    if (!data) return false;
    this.player.fromJSON(data);
    this.gameOver = false;
    this.actionLocked = false;
    this.resetDayStats();
    this.dayStats.startRank = this.player.rankIndex;
    if (!this.player.dailyQuests || this.player.dailyQuests.length === 0) this.generateDailyQuests();
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', slotId === 'auto' ? '自动存档已加载。' : `存档 ${slotId} 已加载。`, 'save');
    return true;
  }

  deleteSlot(slotId) {
    this.save.deleteSlot(slotId);
  }

  getAllSlots() {
    return this.save.getAllSlots();
  }

  openSavePanel() {
    if (this.gameOver) return;
    this.actionLocked = true;
    this.ui.showSavePanel(this, () => {
      this.actionLocked = false;
    });
  }

  getDayIntro() {
    const rank = this.player.getRank();
    const overtime = this.player.getOvertimeHours();
    const hero = getHeroById(this.player.heroId);
    const descs = [
      `你打开王者荣耀，准备开始今天的排位征程。`,
      `匹配队列中...来杯奶茶等一下吧。`,
      `你看了看战绩，觉得今天状态不错。`,
      `峡谷召唤你！是时候证明自己了。`,
      `好友列表一片灰色，只能自己solo排了。`,
      `你切换到排位模式，深呼一口气。`,
      `距离王者还差 ${18 - this.player.rankIndex} 个小段，冲！`,
      `段位保护卡还有3张，放心大胆冲！`,
    ];
    let desc = descs[this.player.day % descs.length];
    if (overtime > 0) {
      desc = `⚠️ 已透支 ${overtime}h，身体越来越吃不消了...`;
    }
    const timeDisplay = this.player.timeLeft >= 0
      ? `⏰ 行动时间剩余 ${this.player.timeLeft}h`
      : `⏰ 行动时间透支 ${Math.abs(this.player.timeLeft)}h`;

    const streakText = this.player.winStreak >= 3 ? ` · 🔥${this.player.winStreak}连胜`
      : this.player.loseStreak >= 3 ? ` · 😰${this.player.loseStreak}连败` : '';

    return {
      title: `📅 第 ${this.player.day}/${this.player.maxDays} 天 · ${timeDisplay}`,
      text: `${rank.emoji} ${rank.name} · ${hero.icon} ${hero.name} · ${this.player.name}${streakText}\n${desc}`,
    };
  }

  doAction(actionId) {
    if (this.gameOver || this.actionLocked) return;

    // Handle panel open actions
    if (actionId.startsWith('panel:')) {
      const panelName = actionId.slice(6);
      this.openPanel(panelName);
      return;
    }

    if (actionId === 'shop') {
      this.actionLocked = true;
      this.openShop();
      return;
    }

    if (actionId === 'save') {
      this.openSavePanel();
      return;
    }

    if (actionId === 'sleep') {
      this.doSleep();
      return;
    }

    const cost = getActionCost(actionId, this.player);
    if (!this.player.canAffordAction(cost)) return;

    const willOvertime = this.player.timeLeft - cost < 0;
    if (willOvertime) {
      this.actionLocked = true;
      const overtimeAfter = Math.abs(this.player.timeLeft - cost);
      let hpPen, combatPen;
      if (overtimeAfter >= 6) { hpPen = 8; combatPen = 3; }
      else if (overtimeAfter >= 3) { hpPen = 5; combatPen = 2; }
      else { hpPen = 3; combatPen = 1; }
      this.ui.showOvertimeConfirm(overtimeAfter, hpPen, combatPen, () => {
        this.actionLocked = false;
        this.executeAction(actionId, cost);
      }, () => {
        this.actionLocked = false;
      });
      return;
    }

    this.executeAction(actionId, cost);
  }

  executeAction(actionId, cost) {
    this.actionLocked = true;
    this.dayStats.actions++;

    // Track action counts for quests
    if (actionId === 'train') this.dayStats.trainCount++;
    if (actionId === 'rest') this.dayStats.restCount++;
    if (actionId === 'explore') this.dayStats.exploreCount++;
    if (actionId === 'boost') this.dayStats.boostCount++;
    if (actionId === 'spar') this.dayStats.sparCount++;

    const dangerBefore = this.player.danger;

    let result;
    switch (actionId) {
      case 'train':     result = this.actions.train(); break;
      case 'explore':   result = this.actions.explore(); break;
      case 'challenge': result = this.actions.challenge(); break;
      case 'rest':      result = this.actions.rest(); break;
      case 'spar':      result = this.actions.spar(); break;
      case 'boost':     result = this.actions.boost(); break;
      default: this.actionLocked = false; return;
    }

    this.player.spendTime(cost);

    // Track danger gained
    this.dayStats.dangerGained += Math.max(0, this.player.danger - dangerBefore);

    if (this.player.timeLeft < 0) {
      const overtime = this.player.getOvertimeHours();
      const penMult = 1 + this.player.getTalentEffect('overtimePenaltyMult') - 1;
      let hpPenalty, combatPenalty, moralePenalty = 0, tierMsg;
      if (overtime >= 6) {
        hpPenalty = 8; combatPenalty = 3; moralePenalty = 5;
        tierMsg = '💀 严重透支';
      } else if (overtime >= 3) {
        hpPenalty = 5; combatPenalty = 2;
        tierMsg = '😵 中度透支';
      } else {
        hpPenalty = 3; combatPenalty = 1;
        tierMsg = '🥱 轻度透支';
      }
      hpPenalty = Math.round(hpPenalty * penMult);
      combatPenalty = Math.round(combatPenalty * penMult);
      moralePenalty = Math.round(moralePenalty * penMult);

      this.player.hp -= hpPenalty;
      this.player.combat -= combatPenalty;
      this.player.morale -= moralePenalty;
      this.player.clampStats();
      this.dayStats.overtimeActions++;
      this.player.totalOvertimes++;

      if (!result.changes) result.changes = {};
      result.changes.hp = (result.changes.hp || 0) - hpPenalty;
      result.changes.combat = (result.changes.combat || 0) - combatPenalty;
      if (moralePenalty > 0) result.changes.morale = (result.changes.morale || 0) - moralePenalty;
      let penText = `精力-${hpPenalty} 技术-${combatPenalty}`;
      if (moralePenalty > 0) penText += ` 心态-${moralePenalty}`;
      result.text += `\n\n⚠️ ${tierMsg}（${overtime}h）！${penText}`;
    }

    if (actionId === 'challenge') {
      if (result.won) {
        this.dayStats.rankWins++;
        this.dayStats.promoted++;
      } else {
        this.dayStats.rankLosses++;
      }
    }

    this.ui.refresh(this.player);

    this.ui.showActionResult(result, () => {
      this.addChangesLog(result.changes);

      if (result.rankChanged && result.won && this.player.rankIndex >= 18) {
        this.gameOver = true;
        this.ui.showRankUp(this.player.getRank(), () => {
          this.ui.showGameOver({
            won: true,
            reason: `第 ${this.player.day} 天，你成功登顶王者！\n你是真正的最强召唤师！\n🔥 最高连胜：${this.player.maxWinStreak}\n🏅 成就解锁：${this.player.achievements.length}/${ACHIEVEMENTS.length}`,
            emoji: '👑',
          });
        });
        this.save.clear();
        return;
      }

      if (result.rankChanged && result.won) {
        this.ui.addLog('good', `⬆️ 晋升至 ${result.newRank.emoji} ${result.newRank.name}！`, 'rank');
      } else if (result.rankChanged && !result.won) {
        this.ui.addLog('bad', `⬇️ 掉段至 ${result.newRank.emoji} ${result.newRank.name}`, 'rank');
      }

      // Check achievements after action
      this.checkAchievements();
      // Check quests
      this.checkDailyQuests();

      // Check talent unlock (on rank up)
      if (result.rankChanged && result.won) {
        this.checkTalentUnlock(() => {
          this.continueAfterAction(actionId);
        });
        return;
      }

      this.continueAfterAction(actionId);
    });
  }

  continueAfterAction(actionId) {
    const evt = this.events.rollEvent(actionId);
    if (evt) {
      this.ui.showEvent(evt, (choice) => {
        this.resolveEventChoice(evt, choice, () => {
          // Check friend encounter (20% chance after any action)
          this.checkFriendEncounter(() => {
            this.afterAction();
          });
        });
      });
      return;
    }

    // Check friend encounter
    this.checkFriendEncounter(() => {
      this.afterAction();
    });
  }

  afterAction() {
    const check = this.checkGameOver();
    if (check) {
      this.gameOver = true;
      this.ui.showGameOver(check);
      this.save.clear();
      return;
    }

    if (this.player.rankIndex >= 3 && !this.player.sparUnlocked) {
      this.player.sparUnlocked = true;
      this.ui.addLog('info', '白银段位解锁了「匹配」行动！', 'unlock');
    }

    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.actionLocked = false;
  }

  doSleep() {
    if (this.gameOver || this.actionLocked) return;
    this.actionLocked = true;

    const overtime = this.player.getOvertimeHours();
    const rank = this.player.getRank();
    const rankDelta = this.player.rankIndex - this.dayStats.startRank;

    let rankSummary;
    if (rankDelta > 0) rankSummary = `⬆️ 升了 ${rankDelta} 个小段`;
    else if (rankDelta < 0) rankSummary = `⬇️ 掉了 ${Math.abs(rankDelta)} 个小段`;
    else rankSummary = `➡️ 段位不变`;

    let nextDayEffect;
    if (overtime > 0) {
      nextDayEffect = `⚠️ 透支了${overtime}h（惩罚已在行动时即时扣除）`;
    } else {
      nextDayEffect = `😴 按时休息 → 明天精力+15 心态+5`;
    }

    // Quest completion summary
    const completedQuests = this.player.dailyQuests.filter(q => q.completed);
    const questSummary = completedQuests.length > 0
      ? `✅ 任务完成 ${completedQuests.length}/${this.player.dailyQuests.length}`
      : `📋 任务完成 0/${this.player.dailyQuests.length}`;

    const summaryLines = [
      `📊 第 ${this.player.day} 天总结`,
      ``,
      `📍 当前段位：${rank.emoji} ${rank.name}`,
      `${rankSummary}`,
      ``,
      `🎮 行动次数：${this.dayStats.actions}`,
      this.dayStats.rankWins + this.dayStats.rankLosses > 0
        ? `🏆 排位：${this.dayStats.rankWins}胜 ${this.dayStats.rankLosses}负`
        : '',
      this.player.winStreak >= 3 ? `🔥 当前连胜：${this.player.winStreak}` : '',
      ``,
      questSummary,
      ``,
      nextDayEffect,
    ].filter(Boolean).join('\n');

    // Check morale 100 days achievement
    if (this.player.morale >= 100) {
      this.player.morale100Days++;
    } else {
      this.player.morale100Days = 0;
    }

    // Check perfect day achievement
    if (this.dayStats.rankWins >= 2 && this.dayStats.rankLosses === 0) {
      this.unlockAchievement('no_loss_day');
    }

    // Survivor achievement
    if (this.player.hp <= 10 && this.player.hp > 0) {
      this.unlockAchievement('survivor');
    }

    this.saveGame();
    this.ui.addLog('info', `💾 已自动保存（第${this.player.day}天）`, 'save');

    this.ui.showDaySummary(summaryLines, () => {
      // Apply talent daily bonuses
      const dailyHpBonus = this.player.getTalentEffect('dailyHpBonus');
      const extraTime = this.player.getTalentEffect('extraTime');

      this.player.advanceDay(overtime);

      if (dailyHpBonus > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + dailyHpBonus);
      }
      if (extraTime > 0) {
        this.player.timeLeft += extraTime;
        this.player.baseTime += extraTime;
      }

      this.resetDayStats();
      this.dayStats.startRank = this.player.rankIndex;

      // Generate new daily quests
      this.generateDailyQuests();

      this.ui.refresh(this.player);

      const check = this.checkGameOver();
      if (check) {
        this.gameOver = true;
        this.ui.showGameOver(check);
        this.save.clear();
        return;
      }

      if (this.player.rankIndex >= 3 && !this.player.sparUnlocked) {
        this.player.sparUnlocked = true;
        this.ui.addLog('info', '白银段位解锁了「匹配」行动！', 'unlock');
      }

      const dayStartSummary = this.generateDayStartSummary();
      this.ui.addLog('info', dayStartSummary.brief, 'system');
      if (dayStartSummary.suggestions.length > 0) {
        dayStartSummary.suggestions.forEach(suggestion => {
          this.ui.addLog('info', suggestion, 'system');
        });
      }

      // Show daily quests
      if (this.player.dailyQuests.length > 0) {
        const questText = this.player.dailyQuests.map(q => `  ${q.icon || '📋'} ${q.text}`).join('\n');
        this.ui.addLog('info', `今日任务：\n${questText}`, 'quest');
      }
      
      this.ui.refresh(this.player);
      this.ui.setScene(this.getDayIntro());
      this.actionLocked = false;
    });
  }

  openShop() {
    this.ui.showShop(this.player, (item) => {
      if (this.player.gold < item.price) {
        this.ui.addLog('bad', '金币不足！', 'shop');
        return false;
      }

      if (item.lottery) {
        return this.handleLottery(item);
      }

      this.player.gold -= item.price;
      const changes = this.player.applyEffects(item.effects);
      changes.gold = (changes.gold || 0) - item.price;
      this.player.totalShopBuys++;
      this.dayStats.shopBuys++;
      this.ui.refresh(this.player);
      this.ui.addLog('good', `购买了${item.name}！`, 'shop');
      this.addChangesLog(changes);
      this.checkAchievements();
      return { item, changes };
    }, () => {
      this.actionLocked = false;
    });
  }

  openPanel(name) {
    this.actionLocked = true;
    const unlock = () => { this.actionLocked = false; };
    switch (name) {
      case 'hero':
        this.ui.showHeroPanel(this.player,
          (heroId) => this.unlockHero(heroId),
          (heroId) => this.selectHero(heroId),
          unlock
        );
        break;
      case 'friend':
        this.ui.showFriendPanel(this.player,
          (friendId) => this.setActiveFriend(friendId),
          unlock
        );
        break;
      case 'quest':
        this.ui.showQuestPanel(this.player, unlock);
        break;
      case 'ach':
        this.ui.showAchievementPanel(this.player, unlock);
        break;
      default:
        unlock();
    }
  }

  handleLottery(item) {
    this.player.gold -= item.price;
    this.player.totalShopBuys++;
    this.dayStats.shopBuys++;
    const roll = Math.random();
    let reward, msg, type;

    if (roll < 0.005) {
      reward = { gold: 400, morale: 30, combat: 10, danger: -10 };
      msg = '🎰 头奖！！！金光闪闪！你简直是欧皇附体！';
      type = 'good';
    } else if (roll < 0.02) {
      reward = { gold: 200, morale: 20, combat: 5 };
      msg = '🎰 特等奖！运气爆棚，大赚一笔！';
      type = 'good';
    } else if (roll < 0.07) {
      reward = { gold: 100, morale: 10 };
      msg = '🎰 一等奖！今天手气真不错！';
      type = 'good';
    } else if (roll < 0.17) {
      reward = { gold: 55 };
      msg = '🎰 二等奖！小赚一笔~';
      type = 'good';
    } else if (roll < 0.35) {
      reward = { gold: 20 };
      msg = '🎰 回本了，不亏不赚。';
      type = 'info';
    } else {
      reward = {};
      msg = '🎰 没中奖...谢谢惠顾，下次一定！';
      type = 'bad';
    }

    const changes = this.player.applyEffects(reward);
    changes.gold = (changes.gold || 0) - item.price;
    this.ui.refresh(this.player);
    this.ui.addLog(type, msg, 'shop');
    if (Object.keys(changes).length > 0) this.addChangesLog(changes);
    this.checkAchievements();
    return { item: { ...item, name: msg }, changes, lottery: true, lotteryType: type };
  }

  resolveEventChoice(evt, choice, callback) {
    const eventBonus = this.player.getTalentEffect('eventBonus');

    if (choice.action === 'fight') {
      const diff = choice.difficulty || 0.5;
      const combatBonus = Math.min(this.player.combat * 0.003, 0.2);
      const winRate = Math.max(0.2, Math.min(0.8, (1 - diff) + combatBonus));
      const won = Math.random() < winRate;

      if (won) {
        let reward = { ...(choice.winEffects || { gold: 25, morale: 5 }) };
        if (eventBonus > 0) {
          for (const k of Object.keys(reward)) {
            if (reward[k] > 0) reward[k] = Math.round(reward[k] * (1 + eventBonus));
          }
        }
        const changes = this.player.applyEffects(reward);
        this.ui.refresh(this.player);
        this.ui.addLog('good', choice.winText || '对局胜利！', 'event');
        this.addChangesLog(changes);
        this.ui.showEventToast({ icon: '🏆', title: choice.winText || '对局胜利！', changes });
      } else {
        const penalty = choice.loseEffects || { hp: -20, morale: -10 };
        const changes = this.player.applyEffects(penalty);
        this.ui.refresh(this.player);
        this.ui.addLog('bad', choice.loseText || '对局失败...', 'event');
        this.addChangesLog(changes);
        this.ui.showEventToast({ icon: '😢', title: choice.loseText || '对局失败...', changes });
      }
      callback();
    } else if (choice.action === 'flee') {
      if (choice.effects) {
        const changes = this.player.applyEffects(choice.effects);
        this.ui.refresh(this.player);
        this.addChangesLog(changes);
        this.ui.showEventToast({ icon: '🏃', title: '你选择了回避', changes });
      } else {
        this.ui.showEventToast({ icon: '🏃', title: '你选择了回避', changes: null });
      }
      this.ui.addLog('info', '你选择了回避。', 'event');
      callback();
    } else if (choice.action === 'buy') {
      if (this.player.gold < (choice.cost || 0)) {
        this.ui.addLog('bad', '金币不足！', 'event');
        this.ui.showEventToast({ icon: '💸', title: '金币不足！', changes: null, duration: 1200 });
        callback();
        return;
      }
      this.player.gold -= (choice.cost || 0);
      let effects = { ...(choice.effects || {}) };
      if (eventBonus > 0) {
        for (const k of Object.keys(effects)) {
          if (effects[k] > 0) effects[k] = Math.round(effects[k] * (1 + eventBonus));
        }
      }
      const changes = this.player.applyEffects(effects);
      changes.gold = (changes.gold || 0) - (choice.cost || 0);
      this.ui.refresh(this.player);
      this.ui.addLog('good', '购买成功！', 'event');
      this.addChangesLog(changes);
      this.ui.showEventToast({ icon: '🛒', title: '购买成功！', changes });
      callback();
    } else if (choice.action === 'dodge') {
      const combatBonus = Math.min(this.player.combat * 0.005, 0.3);
      const dodged = Math.random() < (0.5 + combatBonus);
      if (dodged) {
        this.ui.addLog('good', '你的走位完美避开了！', 'event');
        this.ui.showEventToast({ icon: '⚡', title: '走位完美避开！', changes: null });
      } else {
        const changes = this.player.applyEffects({ hp: -15 });
        this.ui.refresh(this.player);
        this.ui.addLog('bad', '没躲过去，精力-15！', 'event');
        this.addChangesLog(changes);
        this.ui.showEventToast({ icon: '💥', title: '没躲过去！', changes });
      }
      callback();
    } else {
      if (choice.effects && Object.keys(choice.effects).length > 0) {
        let effects = { ...choice.effects };
        if (eventBonus > 0) {
          for (const k of Object.keys(effects)) {
            if (effects[k] > 0) effects[k] = Math.round(effects[k] * (1 + eventBonus));
          }
        }
        const changes = this.player.applyEffects(effects);
        this.ui.refresh(this.player);
        this.addChangesLog(changes);
        this.ui.showEventToast({ icon: evt.icon || '✅', title: choice.text || '事件完成', changes });
      } else {
        this.ui.showEventToast({ icon: evt.icon || '✅', title: choice.text || '事件完成', changes: null, duration: 1200 });
      }
      callback();
    }
  }

  checkGameOver() {
    if (this.player.hp <= 0) {
      return { won: false, reason: '你连续熬夜上分，精力彻底透支，身体亮起了红灯...\n医生说你需要好好休息，暂别峡谷了。', emoji: '🏥' };
    }
    if (this.player.morale <= 0) {
      return { won: false, reason: '连续的失败让你心态彻底崩了...\n你愤怒地卸载了游戏，发誓再也不打排位。', emoji: '💢' };
    }
    if (this.player.danger >= 100) {
      return { won: false, reason: '你沉迷游戏太深，完全忽略了现实生活...\n手机被家人没收了，排位之路到此结束。', emoji: '📵' };
    }
    if (this.player.day > this.player.maxDays) {
      return { won: false, reason: `${this.player.maxDays}天过去了，你依然没能登上王者...\n假期结束了，你只能放下手机回归现实。\n🏅 成就：${this.player.achievements.length}/${ACHIEVEMENTS.length}`, emoji: '⏰' };
    }
    return null;
  }

  addChangesLog(changes) {
    if (!changes) return;
    if (changes.gold > 0) this.dayStats.goldEarned += changes.gold;
    const labels = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷度' };
    const parts = [];
    for (const [k, v] of Object.entries(changes)) {
      if (v === 0) continue;
      const label = labels[k] || k;
      parts.push(`${label} ${v > 0 ? '+' : ''}${v}`);
    }
    if (parts.length > 0) {
      const isGood = Object.values(changes).some(v => v > 0);
      const isBad = Object.values(changes).some(v => v < 0);
      const cls = isGood && !isBad ? 'good' : isBad && !isGood ? 'bad' : 'info';
      this.ui.addLog(cls, parts.join('，'), 'stat');
    }
  }

  // ========== 成就系统 ==========
  checkAchievements() {
    const p = this.player;
    const checks = {
      'first_win':      () => p.totalWins >= 1,
      'win_streak_3':   () => p.maxWinStreak >= 3,
      'win_streak_5':   () => p.maxWinStreak >= 5,
      'reach_silver':   () => p.rankIndex >= 3,
      'reach_gold':     () => p.rankIndex >= 6,
      'reach_plat':     () => p.rankIndex >= 9,
      'reach_diamond':  () => p.rankIndex >= 12,
      'reach_star':     () => p.rankIndex >= 15,
      'rich_500':       () => p.gold >= 500,
      'combat_100':     () => p.combat >= 100,
      'shopaholic':     () => p.totalShopBuys >= 10,
      'night_owl':      () => p.totalOvertimes >= 10,
      'zen_master':     () => p.morale100Days >= 3,
    };

    for (const achDef of ACHIEVEMENTS) {
      if (p.achievements.includes(achDef.id)) continue;
      const checker = checks[achDef.id];
      if (checker && checker()) {
        this.unlockAchievement(achDef.id);
      }
    }
  }

  unlockAchievement(id) {
    if (this.player.achievements.includes(id)) return;
    const achDef = ACHIEVEMENTS.find(a => a.id === id);
    if (!achDef) return;
    this.player.achievements.push(id);
    const changes = this.player.applyEffects(achDef.reward);
    this.ui.refresh(this.player);
    this.ui.addLog('good', `🏅 成就解锁：${achDef.icon} ${achDef.name}！`, 'unlock');
    this.addChangesLog(changes);
  }

  // ========== 天赋系统 ==========
  checkTalentUnlock(callback) {
    for (const tier of TALENTS) {
      if (this.player.rankIndex >= tier.minRankIndex && !this.player.talentTiersClaimed.includes(tier.tier)) {
        this.ui.showTalentChoice(tier, (chosen) => {
          this.player.talents.push(chosen);
          this.player.talentTiersClaimed.push(tier.tier);
          this.ui.addLog('good', `🌟 天赋解锁：${chosen.icon} ${chosen.name} — ${chosen.desc}`, 'unlock');
          this.ui.refresh(this.player);
          callback();
        });
        return;
      }
    }
    callback();
  }

  // ========== 好友系统 ==========
  checkFriendEncounter(callback) {
    if (Math.random() > 0.12) { callback(); return; }
    if (this.player.friends.length >= FRIEND_POOL.length) { callback(); return; }

    const available = FRIEND_POOL.filter(f => !this.player.friends.find(pf => pf.id === f.id));
    if (available.length === 0) { callback(); return; }

    const newFriend = available[Math.floor(Math.random() * available.length)];
    this.ui.showFriendEncounter(newFriend, (accepted) => {
      if (accepted) {
        this.player.friends.push(newFriend);
        this.ui.addLog('good', `🤝 新好友：${newFriend.icon} ${newFriend.name} 加入了你的好友列表！`, 'unlock');
      }
      callback();
    });
  }

  setActiveFriend(friendId) {
    this.player.activeFriendId = friendId;
    if (friendId) {
      const f = this.player.friends.find(fr => fr.id === friendId);
      if (f) this.ui.addLog('info', `🤝 已选择 ${f.icon} ${f.name} 一起排位`, 'system');
    } else {
      this.ui.addLog('info', '👤 已切换为单排', 'system');
    }
    this.ui.refresh(this.player);
  }

  // ========== 英雄系统 ==========
  unlockHero(heroId) {
    const hero = getHeroById(heroId);
    if (this.player.unlockedHeroes.includes(heroId)) return false;
    if (this.player.gold < hero.unlockCost) return false;
    this.player.gold -= hero.unlockCost;
    this.player.unlockedHeroes.push(heroId);
    this.ui.addLog('good', `${hero.icon} 解锁英雄：${hero.name}！`, 'unlock');
    this.ui.refresh(this.player);
    return true;
  }

  selectHero(heroId) {
    if (!this.player.unlockedHeroes.includes(heroId)) return;
    this.player.heroId = heroId;
    const hero = getHeroById(heroId);
    this.ui.addLog('info', `${hero.icon} 已切换英雄：${hero.name}`, 'system');
    this.ui.refresh(this.player);
  }

  // ========== 赛季任务系统 ==========
  generateDailyQuests() {
    const pool = [...QUEST_POOL];
    const quests = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const q = pool.splice(idx, 1)[0];
      quests.push({ ...q, completed: false });
    }
    this.player.dailyQuests = quests;
  }

  checkDailyQuests() {
    let anyCompleted = false;
    for (const quest of this.player.dailyQuests) {
      if (quest.completed) continue;
      if (quest.check && quest.check(this.dayStats)) {
        quest.completed = true;
        anyCompleted = true;
        const changes = this.player.applyEffects(quest.reward);
        this.ui.addLog('good', `${quest.icon || '✅'} 任务完成：${quest.text}`, 'quest');
        this.addChangesLog(changes);
      }
    }
    if (anyCompleted) this.ui.refresh(this.player);
  }

  generateDayStartSummary() {
    const suggestions = [];
    const rank = this.player.getRank();
    const daysLeft = this.player.maxDays - this.player.day + 1;
    const rankDistance = 18 - this.player.rankIndex;
    
    const hpStatus = this.player.hp < 30 ? 'critical' : this.player.hp < 50 ? 'low' : this.player.hp < 70 ? 'medium' : 'good';
    const moraleStatus = this.player.morale < 30 ? 'critical' : this.player.morale < 50 ? 'low' : this.player.morale < 70 ? 'medium' : 'good';
    const combatStatus = this.player.combat < 30 ? 'low' : this.player.combat < 60 ? 'medium' : 'good';
    const dangerStatus = this.player.danger >= 70 ? 'critical' : this.player.danger >= 50 ? 'high' : this.player.danger >= 30 ? 'medium' : 'low';
    const goldStatus = this.player.gold < 20 ? 'low' : this.player.gold < 50 ? 'medium' : 'good';

    const statusEmojis = {
      hp: hpStatus === 'critical' ? '🔴' : hpStatus === 'low' ? '🟡' : '🟢',
      morale: moraleStatus === 'critical' ? '🔴' : moraleStatus === 'low' ? '🟡' : '🟢',
      combat: combatStatus === 'low' ? '🟡' : '🟢',
      danger: dangerStatus === 'critical' ? '🔴' : dangerStatus === 'high' ? '🟡' : '🟢',
      gold: goldStatus === 'low' ? '🟡' : '🟢'
    };

    const brief = `第 ${this.player.day} 天开始，可用 ${this.player.timeLeft}h · ` +
      `${statusEmojis.hp}精力${this.player.hp} ` +
      `${statusEmojis.morale}心态${this.player.morale} ` +
      `${statusEmojis.combat}技术${this.player.combat} ` +
      `${statusEmojis.danger}沉迷${this.player.danger} ` +
      `${statusEmojis.gold}金币${this.player.gold}`;

    if (hpStatus === 'critical') {
      suggestions.push('⚠️ 精力严重不足！强烈建议休息或小憩，否则游戏结束风险极高！');
    } else if (hpStatus === 'low') {
      suggestions.push('💪 精力偏低，建议优先休息恢复，避免透支影响后续行动。');
    }

    if (moraleStatus === 'critical') {
      suggestions.push('😰 心态崩溃边缘！建议小憩或看比赛放松，连续失败可能导致游戏结束！');
    } else if (moraleStatus === 'low') {
      suggestions.push('😊 心态偏低，可以通过匹配或小憩来调整心情。');
    }

    if (dangerStatus === 'critical') {
      suggestions.push('🚨 沉迷度过高！必须立即休息或处理现实事务，否则手机会被没收！');
    } else if (dangerStatus === 'high') {
      suggestions.push('⚠️ 沉迷度较高，建议适当休息，平衡游戏与生活。');
    }

    if (combatStatus === 'low') {
      suggestions.push('🎯 技术较低，建议多训练提升操作水平，增加排位胜率。');
    }

    if (goldStatus === 'low') {
      suggestions.push('💰 金币不足，可以考虑代练赚钱，但要注意精力消耗。');
    }

    if (rankDistance > 0) {
      const daysPerRank = daysLeft / rankDistance;
      if (daysPerRank < 1) {
        suggestions.push(`⏰ 时间紧迫！剩余 ${daysLeft} 天需升 ${rankDistance} 段，建议全力以赴排位！`);
      } else if (daysPerRank < 2) {
        suggestions.push(`📊 进度正常，剩余 ${daysLeft} 天需升 ${rankDistance} 段，保持稳定发挥。`);
      } else {
        suggestions.push(`✨ 进度领先！剩余 ${daysLeft} 天需升 ${rankDistance} 段，可以稳健发育。`);
      }
    }

    const criticalCount = [hpStatus, moraleStatus, dangerStatus].filter(s => s === 'critical').length;
    if (criticalCount >= 2) {
      suggestions.push('🏥 警告：多个关键状态处于危险水平，今天务必优先恢复状态！');
    }

    return { brief, suggestions };
  }
}
