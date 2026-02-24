import { PlayerManager } from './PlayerManager.js';
import { ActionSystem, getActionCost } from './ActionSystem.js';
import { EventSystem } from './EventSystem.js';
import { SaveManager } from './SaveManager.js';

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
    this.dayStats = { actions: 0, rankWins: 0, rankLosses: 0, startRank: 0, overtimeActions: 0 };
  }

  newGame(playerName) {
    this.player.reset();
    if (playerName) this.player.name = `ID：${playerName}`;
    this.gameOver = false;
    this.actionLocked = false;
    this.resetDayStats();
    this.dayStats.startRank = this.player.rankIndex;
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', `第 1 天开始，当前 ${this.player.getRank().name}，30天冲王者！`);
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
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', '存档已加载。');
    return true;
  }

  saveGame() { this.save.save(this.player.toJSON()); }
  hasSave() { return this.save.hasSave(); }
  hasAnySave() { return this.save.hasAnySave(); }

  saveToSlot(slotId) {
    this.save.saveToSlot(slotId, this.player.toJSON());
    this.ui.addLog('good', `已保存到存档 ${slotId}`);
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
    this.ui.refresh(this.player);
    this.ui.setScene(this.getDayIntro());
    this.ui.addLog('info', slotId === 'auto' ? '自动存档已加载。' : `存档 ${slotId} 已加载。`);
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
    return {
      title: `📅 第 ${this.player.day}/${this.player.maxDays} 天 · ${timeDisplay}`,
      text: `${rank.emoji} ${rank.name} · ${this.player.name}\n${desc}`,
    };
  }

  doAction(actionId) {
    if (this.gameOver || this.actionLocked) return;

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

    const cost = getActionCost(actionId);
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

    if (this.player.timeLeft < 0) {
      const overtime = this.player.getOvertimeHours();
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
      this.player.hp -= hpPenalty;
      this.player.combat -= combatPenalty;
      this.player.morale -= moralePenalty;
      this.player.clampStats();
      this.dayStats.overtimeActions++;

      if (!result.changes) result.changes = {};
      result.changes.hp = (result.changes.hp || 0) - hpPenalty;
      result.changes.combat = (result.changes.combat || 0) - combatPenalty;
      if (moralePenalty > 0) result.changes.morale = (result.changes.morale || 0) - moralePenalty;
      let penText = `精力-${hpPenalty} 技术-${combatPenalty}`;
      if (moralePenalty > 0) penText += ` 心态-${moralePenalty}`;
      result.text += `\n\n⚠️ ${tierMsg}（${overtime}h）！${penText}`;
    }

    if (actionId === 'challenge') {
      if (result.won) this.dayStats.rankWins++;
      else this.dayStats.rankLosses++;
    }

    this.ui.refresh(this.player);

    this.ui.showActionResult(result, () => {
      this.addChangesLog(result.changes);

      if (result.rankChanged && result.won && this.player.rankIndex >= 18) {
        this.gameOver = true;
        this.ui.showRankUp(this.player.getRank(), () => {
          this.ui.showGameOver({
            won: true,
            reason: `第 ${this.player.day} 天，你成功登顶王者！\n你是真正的最强召唤师！`,
            emoji: '👑',
          });
        });
        this.save.clear();
        return;
      }

      if (result.rankChanged && result.won) {
        this.ui.addLog('good', `⬆️ 晋升至 ${result.newRank.emoji} ${result.newRank.name}！`);
      } else if (result.rankChanged && !result.won) {
        this.ui.addLog('bad', `⬇️ 掉段至 ${result.newRank.emoji} ${result.newRank.name}`);
      }

      const evt = this.events.rollEvent(actionId);
      if (evt) {
        this.ui.showEvent(evt, (choice) => {
          this.resolveEventChoice(evt, choice, () => {
            this.afterAction();
          });
        });
        return;
      }

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
      this.ui.addLog('info', '白银段位解锁了「匹配」行动！');
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
    if (overtime >= 6) {
      nextDayEffect = `💀 严重透支（${overtime}h）→ 明天精力-20 技术-5 心态-10`;
    } else if (overtime >= 3) {
      nextDayEffect = `😵 中度透支（${overtime}h）→ 明天精力-10 技术-3 心态-5`;
    } else if (overtime > 0) {
      nextDayEffect = `🥱 轻度透支（${overtime}h）→ 明天精力-5 技术-1`;
    } else {
      nextDayEffect = `😴 按时休息 → 明天精力+15 心态+5`;
    }

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
      ``,
      nextDayEffect,
    ].filter(Boolean).join('\n');

    this.saveGame();

    this.ui.showDaySummary(summaryLines, () => {
      this.player.advanceDay(overtime);
      this.resetDayStats();
      this.dayStats.startRank = this.player.rankIndex;
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
        this.ui.addLog('info', '白银段位解锁了「匹配」行动！');
      }

      this.ui.addLog('info', `第 ${this.player.day} 天开始，可用 ${this.player.timeLeft}h`);
      this.ui.refresh(this.player);
      this.ui.setScene(this.getDayIntro());
      this.actionLocked = false;
    });
  }

  openShop() {
    this.ui.showShop(this.player, (item) => {
      if (this.player.gold < item.price) {
        this.ui.addLog('bad', '金币不足！');
        return false;
      }

      if (item.lottery) {
        return this.handleLottery(item);
      }

      this.player.gold -= item.price;
      const changes = this.player.applyEffects(item.effects);
      changes.gold = (changes.gold || 0) - item.price;
      this.ui.refresh(this.player);
      this.ui.addLog('good', `购买了${item.name}！`);
      this.addChangesLog(changes);
      return { item, changes };
    }, () => {
      this.actionLocked = false;
    });
  }

  handleLottery(item) {
    this.player.gold -= item.price;
    const roll = Math.random();
    let reward, msg, type;

    if (roll < 0.005) {
      reward = { gold: 300, morale: 30, combat: 10, danger: -10 };
      msg = '🎰 头奖！！！金光闪闪！你简直是欧皇附体！';
      type = 'good';
    } else if (roll < 0.02) {
      reward = { gold: 150, morale: 20, combat: 5 };
      msg = '🎰 特等奖！运气爆棚，大赚一笔！';
      type = 'good';
    } else if (roll < 0.07) {
      reward = { gold: 80, morale: 10 };
      msg = '🎰 一等奖！今天手气真不错！';
      type = 'good';
    } else if (roll < 0.17) {
      reward = { gold: 40 };
      msg = '🎰 二等奖！小赚一笔~';
      type = 'good';
    } else if (roll < 0.35) {
      reward = { gold: 15 };
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
    this.ui.addLog(type, msg);
    if (Object.keys(changes).length > 0) this.addChangesLog(changes);
    return { item: { ...item, name: msg }, changes, lottery: true, lotteryType: type };
  }

  resolveEventChoice(evt, choice, callback) {
    if (choice.action === 'fight') {
      const diff = choice.difficulty || 0.5;
      const combatBonus = Math.min(this.player.combat * 0.003, 0.2);
      const winRate = Math.max(0.2, Math.min(0.8, (1 - diff) + combatBonus));
      const won = Math.random() < winRate;

      if (won) {
        const reward = choice.winEffects || { gold: 25, morale: 5 };
        const changes = this.player.applyEffects(reward);
        this.ui.refresh(this.player);
        this.ui.addLog('good', choice.winText || '对局胜利！');
        this.addChangesLog(changes);
      } else {
        const penalty = choice.loseEffects || { hp: -20, morale: -10 };
        const changes = this.player.applyEffects(penalty);
        this.ui.refresh(this.player);
        this.ui.addLog('bad', choice.loseText || '对局失败...');
        this.addChangesLog(changes);
      }
      callback();
    } else if (choice.action === 'flee') {
      if (choice.effects) {
        const changes = this.player.applyEffects(choice.effects);
        this.ui.refresh(this.player);
        this.addChangesLog(changes);
      }
      this.ui.addLog('info', '你选择了回避。');
      callback();
    } else if (choice.action === 'buy') {
      if (this.player.gold < (choice.cost || 0)) {
        this.ui.addLog('bad', '金币不足！');
        callback();
        return;
      }
      this.player.gold -= (choice.cost || 0);
      const effects = choice.effects || {};
      const changes = this.player.applyEffects(effects);
      changes.gold = (changes.gold || 0) - (choice.cost || 0);
      this.ui.refresh(this.player);
      this.ui.addLog('good', '购买成功！');
      this.addChangesLog(changes);
      callback();
    } else if (choice.action === 'dodge') {
      const combatBonus = Math.min(this.player.combat * 0.005, 0.3);
      const dodged = Math.random() < (0.5 + combatBonus);
      if (dodged) {
        this.ui.addLog('good', '你的走位完美避开了！');
      } else {
        const changes = this.player.applyEffects({ hp: -15 });
        this.ui.refresh(this.player);
        this.ui.addLog('bad', '没躲过去，精力-15！');
        this.addChangesLog(changes);
      }
      callback();
    } else {
      if (choice.effects && Object.keys(choice.effects).length > 0) {
        const changes = this.player.applyEffects(choice.effects);
        this.ui.refresh(this.player);
        this.addChangesLog(changes);
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
      return { won: false, reason: `${this.player.maxDays}天过去了，你依然没能登上王者...\n假期结束了，你只能放下手机回归现实。`, emoji: '⏰' };
    }
    return null;
  }

  addChangesLog(changes) {
    if (!changes) return;
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
      this.ui.addLog(cls, parts.join('，'));
    }
  }
}
