import { getHeroById } from '../data/heroes.js';
import { getDifficulty } from '../data/difficulty.js';

const ACTION_COSTS = {
  train: 2,
  explore: 2,
  challenge: 3,
  rest: 1,
  spar: 1,
  boost: 2,
  shop: 0,
};

export function getActionCost(id, player) {
  let cost = ACTION_COSTS[id] || 0;
  if (player && cost > 0) {
    const timeSave = player.getTalentEffect('timeSave');
    if (timeSave > 0) cost = Math.max(1, cost - timeSave);
  }
  return cost;
}

function applyBoost(base, player, key) {
  const hero = getHeroById(player.heroId);
  let mult = 1;
  if (hero.bonus[key]) mult += hero.bonus[key];
  const talentVal = player.getTalentEffect(key);
  if (talentVal) mult += talentVal;
  return Math.round(base * mult);
}

export class ActionSystem {
  constructor(player) {
    this.player = player;
  }

  train() {
    const diff = getDifficulty(this.player.difficultyId);
    let combatGain = 5 + Math.floor(Math.random() * 8);
    combatGain = applyBoost(combatGain, this.player, 'trainBoost');
    combatGain = applyBoost(combatGain, this.player, 'combatGainBoost');
    combatGain = Math.round(combatGain * diff.combatGainMult);
    const goldCost = Math.round(15 * diff.trainCostMult);
    const learnSkill = Math.random() < 0.15;

    this.player.combat += combatGain;
    this.player.gold -= goldCost;

    const texts = [
      `你在训练营苦练走位和技能释放，技术提升了 ${combatGain} 点。`,
      `你反复练习连招combo，手速明显变快了。`,
      `你研究了高端局的打法思路，技术 +${combatGain}。`,
      `你跟着教学视频练了一下午，补刀和意识都提升了。`,
    ];
    const result = {
      title: '🎯 训练',
      text: texts[Math.floor(Math.random() * texts.length)],
      changes: { combat: combatGain, gold: -goldCost },
    };

    if (learnSkill) {
      const bonus = 3 + Math.floor(Math.random() * 5);
      this.player.combat += bonus;
      result.changes.combat += bonus;
      result.text += `\n💡 顿悟！你突然理解了高手的运营思路，额外技术 +${bonus}！`;
    }

    if (this.player.gold < 0) this.player.gold = 0;
    this.player.clampStats();
    return result;
  }

  explore() {
    const diff = getDifficulty(this.player.difficultyId);
    let combatGain = 3 + Math.floor(Math.random() * 5);
    combatGain = applyBoost(combatGain, this.player, 'combatGainBoost');
    combatGain = Math.round(combatGain * diff.combatGainMult);
    let dangerGain = 5 + Math.floor(Math.random() * 6);
    dangerGain = applyBoost(dangerGain, this.player, 'dangerMult');
    dangerGain = Math.round(dangerGain * diff.dangerMult);

    this.player.combat += combatGain;
    this.player.danger += dangerGain;
    this.player.clampStats();

    const texts = [
      `你看了几场KPL比赛直播，学到了很多东西。`,
      `你在游戏社区发了攻略帖，获得了不少关注。`,
      `你刷了一晚上教学视频，收获不少但也熬夜了。`,
      `你参加了一个王者玩家线下聚会，扩展了社交圈。`,
    ];
    return {
      title: '📺 观赛',
      text: texts[Math.floor(Math.random() * texts.length)],
      changes: { combat: combatGain, danger: dangerGain },
    };
  }

  challenge() {
    const diff = getDifficulty(this.player.difficultyId);
    const rank = this.player.getRank();
    const expectedCombat = 10 + this.player.rankIndex * 8;
    const combatRatio = this.player.combat / Math.max(1, expectedCombat);
    const techFactor = Math.pow(Math.min(combatRatio, 2), 1.5);
    const moraleBonus = (this.player.morale - 50) * 0.001;

    // Hero + talent + friend win rate boosts
    const hero = getHeroById(this.player.heroId);
    let extraWinRate = hero.bonus.winRateBoost || 0;
    extraWinRate += this.player.getTalentEffect('winRateBoost');

    // Friend bonus
    let friendBonus = 0;
    let friendCombatBonus = 0;
    let friendMoraleBonus = 0;
    let friendGoldBonus = 0;
    let friendDangerExtra = 0;
    const activeFriend = this.player.activeFriendId
      ? this.player.friends.find(f => f.id === this.player.activeFriendId)
      : null;
    if (activeFriend) {
      friendBonus = activeFriend.bonus.winRateBoost || 0;
      friendCombatBonus = activeFriend.bonus.combatBonus || 0;
      friendMoraleBonus = activeFriend.bonus.moraleBonus || 0;
      friendGoldBonus = activeFriend.bonus.goldBonus || 0;
      friendDangerExtra = activeFriend.dangerExtra || 0;
    }

    // Streak bonus
    let streakBonus = 0;
    if (this.player.winStreak >= 5) streakBonus = 0.05;
    else if (this.player.winStreak >= 3) streakBonus = 0.03;

    // Lose streak protection
    let loseProtect = false;
    if (this.player.loseStreak >= 3) loseProtect = true;

    const baseWinRate = techFactor * 0.55 + 0.1 + moraleBonus;
    const winRate = Math.max(0.1, Math.min(0.88, baseWinRate + extraWinRate + friendBonus + streakBonus + diff.winRateBonus));
    const won = Math.random() < winRate;

    let dangerGain = 3 + Math.floor(Math.random() * 4);
    dangerGain = applyBoost(dangerGain, this.player, 'dangerMult');
    dangerGain = Math.round(dangerGain * diff.dangerMult);
    dangerGain += friendDangerExtra;
    this.player.danger += dangerGain;

    const rewardMult = 1 + this.player.getTalentEffect('rankRewardMult') - 1 + this.player.getTalentEffect('allGainBoost');
    const penaltyMult = 1 + this.player.getTalentEffect('rankPenaltyMult') - 1;

    if (won) {
      let hpCost = 8 + Math.floor(Math.random() * 5);
      hpCost = applyBoost(hpCost, this.player, 'hpCostMult');
      hpCost = Math.round(hpCost * diff.hpCostMult);
      let goldGain = 22 + Math.floor(Math.random() * 24);
      goldGain = applyBoost(goldGain, this.player, 'goldBoost');
      goldGain = Math.round(goldGain * rewardMult * diff.goldMult) + friendGoldBonus;
      const combatGain = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 + friendCombatBonus : friendCombatBonus;

      // Streak bonus gold
      let streakGold = 0;
      if (this.player.winStreak >= 2) {
        streakGold = Math.min(this.player.winStreak * 8, 48);
      }
      goldGain += streakGold;

      this.player.hp -= hpCost;
      this.player.gold += goldGain;
      this.player.combat += combatGain;
      if (friendMoraleBonus > 0) this.player.morale += friendMoraleBonus;

      // Update streaks
      this.player.winStreak++;
      this.player.loseStreak = 0;
      this.player.totalWins++;
      if (this.player.winStreak > this.player.maxWinStreak) {
        this.player.maxWinStreak = this.player.winStreak;
      }

      const oldRank = rank.name;
      this.player.promote();
      const newRank = this.player.getRank();
      this.player.clampStats();

      const changes = { hp: -hpCost, gold: goldGain, danger: dangerGain };
      if (combatGain > 0) changes.combat = combatGain;
      if (friendMoraleBonus > 0) changes.morale = friendMoraleBonus;

      const texts = [
        `排位赛大胜！你在${rank.tier}局中carry全场！`,
        `MVP！队友疯狂点赞，你在${rank.tier}又赢了一把！`,
        `完美团战！你的操作带领团队拿下了胜利！`,
      ];
      let resultText = `${texts[Math.floor(Math.random() * texts.length)]}\n⬆️ ${oldRank} → ${newRank.emoji} ${newRank.name}`;
      if (this.player.winStreak >= 3) resultText += `\n🔥 ${this.player.winStreak}连胜！额外金币 +${streakGold}`;
      if (activeFriend) resultText += `\n🤝 ${activeFriend.icon} ${activeFriend.name}：「${activeFriend.lines.win}」`;

      return {
        title: '🏆 排位胜利！',
        text: resultText,
        changes,
        won: true,
        rankChanged: true,
        newRank,
      };
    } else {
      let hpLoss = 15 + Math.floor(Math.random() * 10);
      let moraleLoss = 8 + Math.floor(Math.random() * 8);
      moraleLoss = Math.round(moraleLoss * (1 + this.player.getTalentEffect('lossMoraleMult') - 1) * diff.moraleLossMult);
      hpLoss = Math.round(hpLoss * penaltyMult * diff.hpCostMult);

      this.player.hp -= hpLoss;
      this.player.morale -= moraleLoss;

      // Update streaks
      this.player.winStreak = 0;
      this.player.loseStreak++;

      // Lose streak protection: 50% chance not to demote
      const oldRank = rank.name;
      let demoted;
      if (loseProtect && Math.random() < 0.5) {
        demoted = false;
      } else {
        demoted = this.player.demote();
      }
      const newRank = this.player.getRank();
      this.player.clampStats();

      const texts = [
        `排位输了...队友互相甩锅，你的心态有点受影响。`,
        `遇到演员了，排位惨败，心态小崩。`,
        `对面太强了，被碾压了一局，有点上头。`,
      ];
      let resultText = texts[Math.floor(Math.random() * texts.length)];
      if (demoted) {
        resultText += `\n⬇️ ${oldRank} → ${newRank.emoji} ${newRank.name}`;
      } else if (loseProtect && this.player.rankIndex > 0) {
        resultText += `\n🛡️ 连败保护触发，段位不变！`;
      } else {
        resultText += `\n🛡️ 最低段位保护，段位不变。`;
      }
      if (this.player.loseStreak >= 3) resultText += `\n😰 ${this.player.loseStreak}连败中...`;
      if (activeFriend) resultText += `\n🤝 ${activeFriend.icon} ${activeFriend.name}：「${activeFriend.lines.lose}」`;

      return {
        title: '💔 排位失败',
        text: resultText,
        changes: { hp: -hpLoss, morale: -moraleLoss, danger: dangerGain },
        won: false,
        rankChanged: demoted,
        newRank,
      };
    }
  }

  rest() {
    const diff = getDifficulty(this.player.difficultyId);
    let hpGain = 10 + Math.floor(Math.random() * 8);
    hpGain = Math.round(hpGain * diff.restBonus);
    let moraleGain = 5 + Math.floor(Math.random() * 5);
    moraleGain = applyBoost(moraleGain, this.player, 'restMoraleMult');
    moraleGain = applyBoost(moraleGain, this.player, 'moraleGainMult');
    moraleGain = Math.round(moraleGain * diff.restBonus);
    let dangerDrop = 5 + Math.floor(Math.random() * 4);

    this.player.hp += hpGain;
    this.player.morale += moraleGain;
    this.player.danger -= dangerDrop;
    this.player.clampStats();

    const texts = [
      '你放下手机休息了一会，喝了杯水，精力恢复了一些。',
      '你做了几组拉伸运动，缓解了久坐的疲劳。',
      '你出去散了个步买了杯奶茶，心情好了点。',
      '你闭眼眯了一小会，感觉没那么累了。',
    ];
    return {
      title: '☕ 小憩',
      text: texts[Math.floor(Math.random() * texts.length)],
      changes: { hp: hpGain, morale: moraleGain, danger: -dangerDrop },
    };
  }

  spar() {
    const diff = getDifficulty(this.player.difficultyId);
    let combatGain = 3 + Math.floor(Math.random() * 3);
    combatGain = applyBoost(combatGain, this.player, 'combatGainBoost');
    combatGain = Math.round(combatGain * diff.combatGainMult);
    const moraleGain = 3;
    let dangerGain = 2 + Math.floor(Math.random() * 3);
    dangerGain = applyBoost(dangerGain, this.player, 'dangerMult');
    dangerGain = Math.round(dangerGain * diff.dangerMult);

    this.player.combat += combatGain;
    this.player.morale += moraleGain;
    this.player.danger += dangerGain;
    this.player.clampStats();

    const texts = [
      '你开了一把匹配练练手，轻松拿下。',
      '和朋友开了一把娱乐模式，顺便试了试新英雄。',
      '匹配模式里练了练意识和走位，有所收获。',
    ];
    return {
      title: '🎮 匹配',
      text: texts[Math.floor(Math.random() * texts.length)],
      changes: { combat: combatGain, morale: moraleGain, danger: dangerGain },
    };
  }

  boost() {
    const diff = getDifficulty(this.player.difficultyId);
    let goldGain = 40 + Math.floor(Math.random() * 26);
    goldGain = applyBoost(goldGain, this.player, 'goldBoost');
    goldGain = Math.round(goldGain * diff.goldMult);
    let dangerGain = 8 + Math.floor(Math.random() * 6);
    dangerGain = applyBoost(dangerGain, this.player, 'dangerMult');
    dangerGain = Math.round(dangerGain * diff.dangerMult);
    let hpCost = 5 + Math.floor(Math.random() * 6);
    hpCost = applyBoost(hpCost, this.player, 'hpCostMult');
    hpCost = Math.round(hpCost * diff.hpCostMult);
    const combatGain = Math.random() < 0.25 ? Math.floor(Math.random() * 3) + 1 : 0;

    this.player.gold += goldGain;
    this.player.danger += dangerGain;
    this.player.hp -= hpCost;
    this.player.combat += combatGain;
    this.player.clampStats();

    const texts = [
      '你帮别人打了几把代练，赚了不少零花钱。',
      '接了个青铜代练单，轻松碾压，到手一笔金币。',
      '帮朋友的小号上了几个段位，收了点辛苦费。',
      '代练了一把，虽然赚到了钱，但总感觉有点心虚。',
    ];
    const result = {
      title: '💼 代练',
      text: texts[Math.floor(Math.random() * texts.length)],
      changes: { gold: goldGain, danger: dangerGain, hp: -hpCost },
    };
    if (combatGain > 0) {
      result.changes.combat = combatGain;
      result.text += `\n💡 代练过程中顺便练了练手，技术 +${combatGain}。`;
    }
    return result;
  }
}
