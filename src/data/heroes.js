export const HEROES = [
  { id: 'warrior',   icon: '⚔️', name: '战士',   desc: '均衡型，排位胜率+3%',
    bonus: { winRateBoost: 0.03 }, unlockCost: 0 },
  { id: 'assassin',  icon: '🗡️', name: '刺客',   desc: '训练效率+25%，精力消耗+10%',
    bonus: { trainBoost: 0.25, hpCostMult: 1.1 }, unlockCost: 60 },
  { id: 'mage',      icon: '🔮', name: '法师',   desc: '技术成长+20%，心态恢复-15%',
    bonus: { combatGainBoost: 0.2, moraleGainMult: 0.85 }, unlockCost: 60 },
  { id: 'tank',      icon: '🛡️', name: '坦克',   desc: '精力消耗-20%，技术成长-10%',
    bonus: { hpCostMult: 0.8, combatGainBoost: -0.1 }, unlockCost: 80 },
  { id: 'marksman',  icon: '🏹', name: '射手',   desc: '金币收入+30%，沉迷增加+15%',
    bonus: { goldBoost: 0.3, dangerMult: 1.15 }, unlockCost: 80 },
  { id: 'support',   icon: '💚', name: '辅助',   desc: '心态恢复+30%，技术成长-15%',
    bonus: { moraleGainMult: 1.3, combatGainBoost: -0.15 }, unlockCost: 100 },
];

export function getHeroById(id) {
  return HEROES.find(h => h.id === id) || HEROES[0];
}
