const ACTION_COSTS = {
  train: 2,
  explore: 2,
  challenge: 3,
  rest: 1,
  spar: 1,
  boost: 2,
  shop: 0,
};

export function getActionCost(id) {
  return ACTION_COSTS[id] || 0;
}

export class ActionSystem {
  constructor(player) {
    this.player = player;
  }

  train() {
    const combatGain = 5 + Math.floor(Math.random() * 8);
    const goldCost = 15;
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
    const combatGain = 3 + Math.floor(Math.random() * 5);
    const dangerGain = 5 + Math.floor(Math.random() * 6);

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
    const rank = this.player.getRank();
    const expectedCombat = 10 + this.player.rankIndex * 8;
    const combatRatio = this.player.combat / Math.max(1, expectedCombat);
    const techFactor = Math.pow(Math.min(combatRatio, 2), 1.5);
    const moraleBonus = (this.player.morale - 50) * 0.001;
    const winRate = Math.max(0.1, Math.min(0.85, techFactor * 0.55 + 0.1 + moraleBonus));
    const won = Math.random() < winRate;

    const dangerGain = 3 + Math.floor(Math.random() * 4);
    this.player.danger += dangerGain;

    if (won) {
      const hpCost = 8 + Math.floor(Math.random() * 5);
      const goldGain = 15 + Math.floor(Math.random() * 20);
      const combatGain = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      this.player.hp -= hpCost;
      this.player.gold += goldGain;
      this.player.combat += combatGain;

      const oldRank = rank.name;
      this.player.promote();
      const newRank = this.player.getRank();
      this.player.clampStats();

      const changes = { hp: -hpCost, gold: goldGain, danger: dangerGain };
      if (combatGain > 0) changes.combat = combatGain;

      const texts = [
        `排位赛大胜！你在${rank.tier}局中carry全场！`,
        `MVP！队友疯狂点赞，你在${rank.tier}又赢了一把！`,
        `完美团战！你的操作带领团队拿下了胜利！`,
      ];
      return {
        title: '🏆 排位胜利！',
        text: `${texts[Math.floor(Math.random() * texts.length)]}\n⬆️ ${oldRank} → ${newRank.emoji} ${newRank.name}`,
        changes,
        won: true,
        rankChanged: true,
        newRank,
      };
    } else {
      const hpLoss = 15 + Math.floor(Math.random() * 10);
      const moraleLoss = 8 + Math.floor(Math.random() * 8);
      this.player.hp -= hpLoss;
      this.player.morale -= moraleLoss;

      const oldRank = rank.name;
      const demoted = this.player.demote();
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
      } else {
        resultText += `\n🛡️ 最低段位保护，段位不变。`;
      }
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
    const hpGain = 10 + Math.floor(Math.random() * 8);
    const moraleGain = 5 + Math.floor(Math.random() * 5);
    const dangerDrop = 5 + Math.floor(Math.random() * 4);

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
    const combatGain = 3 + Math.floor(Math.random() * 3);
    const moraleGain = 3;
    const dangerGain = 2 + Math.floor(Math.random() * 3);

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
    const goldGain = 30 + Math.floor(Math.random() * 21);
    const dangerGain = 8 + Math.floor(Math.random() * 6);
    const hpCost = 5 + Math.floor(Math.random() * 6);
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
