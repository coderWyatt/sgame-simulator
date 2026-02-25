export const TALENTS = [
  {
    tier: '白银',
    minRankIndex: 3,
    choices: [
      { id: 'night_owl',     icon: '🦉', name: '夜猫子',     desc: '透支惩罚减少30%',       effect: { overtimePenaltyMult: 0.7 } },
      { id: 'quick_learner', icon: '📚', name: '速成天才',   desc: '训练效果+20%',           effect: { trainBoost: 0.2 } },
      { id: 'thick_skin',    icon: '🛡️', name: '厚脸皮',     desc: '排位失败心态损失-25%',    effect: { lossMoraleMult: 0.75 } },
    ]
  },
  {
    tier: '黄金',
    minRankIndex: 6,
    choices: [
      { id: 'iron_will',     icon: '💪', name: '钢铁意志',   desc: '精力消耗-15%',           effect: { hpCostMult: 0.85 } },
      { id: 'gold_finger',   icon: '🤑', name: '招财进宝',   desc: '金币收入+25%',           effect: { goldBoost: 0.25 } },
      { id: 'zen_mode',      icon: '🧘', name: '心态大师',   desc: '小憩心态恢复+40%',        effect: { restMoraleMult: 1.4 } },
    ]
  },
  {
    tier: '铂金',
    minRankIndex: 9,
    choices: [
      { id: 'clutch_gene',   icon: '🎯', name: '关键先生',   desc: '排位胜率+5%',            effect: { winRateBoost: 0.05 } },
      { id: 'efficient',     icon: '⚡', name: '效率达人',   desc: '所有行动耗时-1h（最低1h）', effect: { timeSave: 1 } },
      { id: 'resilient',     icon: '❤️', name: '恢复体质',   desc: '每日基础精力恢复+10',      effect: { dailyHpBonus: 10 } },
    ]
  },
  {
    tier: '钻石',
    minRankIndex: 12,
    choices: [
      { id: 'carry_lord',    icon: '👑', name: 'Carry之王',  desc: '排位胜率+8%',            effect: { winRateBoost: 0.08 } },
      { id: 'anti_tilt',     icon: '🧠', name: '防沉迷大师', desc: '沉迷度增加-30%',          effect: { dangerMult: 0.7 } },
      { id: 'double_down',   icon: '🎰', name: '孤注一掷',   desc: '排位奖励+40%，但惩罚+20%', effect: { rankRewardMult: 1.4, rankPenaltyMult: 1.2 } },
    ]
  },
  {
    tier: '星耀',
    minRankIndex: 15,
    choices: [
      { id: 'final_push',    icon: '🚀', name: '最后冲刺',   desc: '所有属性获取+15%',        effect: { allGainBoost: 0.15 } },
      { id: 'lucky_star',    icon: '🍀', name: '幸运之星',   desc: '事件中好选项效果+50%',     effect: { eventBonus: 0.5 } },
      { id: 'endurance',     icon: '🏃', name: '持久作战',   desc: '每日基础时间+2h',          effect: { extraTime: 2 } },
    ]
  },
];
