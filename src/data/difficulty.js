/**
 * 难度配置
 * 各乘数用于修正关键数值：
 * - winRateBonus: 排位胜率额外加成
 * - goldMult: 金币收入乘数
 * - combatGainMult: 技术成长乘数
 * - hpCostMult: 精力消耗乘数
 * - moraleLossMult: 心态损失乘数
 * - dangerMult: 沉迷度增长乘数
 * - startGold: 初始金币
 * - startCombat: 初始技术
 * - maxDays: 最大天数
 * - restBonus: 休息恢复乘数
 */
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: '简单',
    icon: '🌱',
    color: '#22c55e',
    desc: '适合新手，收益更高，惩罚更轻',
    detail: '胜率↑ 金币↑ 惩罚↓ 40天',
    winRateBonus: 0.06,
    goldMult: 1.4,
    combatGainMult: 1.3,
    hpCostMult: 0.7,
    moraleLossMult: 0.6,
    dangerMult: 0.7,
    startGold: 80,
    startCombat: 15,
    maxDays: 40,
    restBonus: 1.3,
    trainCostMult: 0.7,
  },
  hard: {
    id: 'hard',
    name: '困难',
    icon: '🔥',
    color: '#f59e0b',
    desc: '标准体验，均衡挑战',
    detail: '标准数值 30天',
    winRateBonus: 0,
    goldMult: 1.0,
    combatGainMult: 1.0,
    hpCostMult: 1.0,
    moraleLossMult: 1.0,
    dangerMult: 1.0,
    startGold: 50,
    startCombat: 10,
    maxDays: 30,
    restBonus: 1.0,
    trainCostMult: 1.0,
  },
  pro: {
    id: 'pro',
    name: '职业',
    icon: '💀',
    color: '#ef4444',
    desc: '极限挑战，惩罚加重，时间更少',
    detail: '胜率↓ 金币↓ 惩罚↑ 22天',
    winRateBonus: -0.05,
    goldMult: 0.7,
    combatGainMult: 0.8,
    hpCostMult: 1.4,
    moraleLossMult: 1.5,
    dangerMult: 1.4,
    startGold: 30,
    startCombat: 8,
    maxDays: 22,
    restBonus: 0.8,
    trainCostMult: 1.3,
  },
};

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.hard;
}
