export const QUEST_POOL = [
  // 排位相关
  { id: 'q_rank_1',    icon: '⚔️', text: '今天赢1场排位',              check: (s) => s.rankWins >= 1,      reward: { gold: 25 } },
  { id: 'q_rank_2',    icon: '🏆', text: '今天赢2场排位',              check: (s) => s.rankWins >= 2,      reward: { gold: 40, morale: 5 } },
  { id: 'q_rank_3',    icon: '👑', text: '今天赢3场排位',              check: (s) => s.rankWins >= 3,      reward: { gold: 60, combat: 3 } },
  { id: 'q_rank_total2', icon: '🎮', text: '今天打2场排位（不论胜负）', check: (s) => (s.rankWins + s.rankLosses) >= 2, reward: { gold: 18 } },
  { id: 'q_rank_total4', icon: '🕹️', text: '今天打4场排位（不论胜负）', check: (s) => (s.rankWins + s.rankLosses) >= 4, reward: { gold: 45, hp: 5 } },
  { id: 'q_no_loss',   icon: '🛡️', text: '今天排位不输（至少打1场）',   check: (s) => s.rankLosses === 0 && s.rankWins >= 1, reward: { gold: 30, morale: 8 } },
  { id: 'q_promote',   icon: '⬆️', text: '今天升至少1个小段',           check: (s) => s.promoted >= 1,      reward: { gold: 30, morale: 5 } },
  { id: 'q_promote_2', icon: '🚀', text: '今天升至少2个小段',           check: (s) => s.promoted >= 2,      reward: { gold: 60, morale: 10, combat: 2 } },

  // 训练相关
  { id: 'q_train_1',   icon: '🎯', text: '今天训练1次',                check: (s) => s.trainCount >= 1,    reward: { gold: 18 } },
  { id: 'q_train_2',   icon: '💪', text: '今天训练2次',                check: (s) => s.trainCount >= 2,    reward: { gold: 30, combat: 2 } },
  { id: 'q_train_3',   icon: '🏋️', text: '今天训练3次',                check: (s) => s.trainCount >= 3,    reward: { combat: 5, gold: 45 } },

  // 休息 / 观赛 / 其他行动
  { id: 'q_rest_1',    icon: '☕', text: '今天休息1次',                check: (s) => s.restCount >= 1,     reward: { hp: 10, gold: 8 } },
  { id: 'q_rest_2',    icon: '🛏️', text: '今天休息2次',                check: (s) => s.restCount >= 2,     reward: { hp: 15, morale: 5, gold: 12 } },
  { id: 'q_explore_1', icon: '📺', text: '今天观赛1次',                check: (s) => s.exploreCount >= 1,  reward: { combat: 3, gold: 10 } },
  { id: 'q_explore_2', icon: '📡', text: '今天观赛2次',                check: (s) => s.exploreCount >= 2,  reward: { combat: 5, morale: 3, gold: 15 } },
  { id: 'q_boost_1',   icon: '💨', text: '今天代练1次',                check: (s) => s.boostCount >= 1,    reward: { gold: 25 } },
  { id: 'q_spar_1',    icon: '🤺', text: '今天打1场匹配',              check: (s) => s.sparCount >= 1,     reward: { combat: 2, morale: 3, gold: 10 } },
  { id: 'q_spar_2',    icon: '⚡', text: '今天打2场匹配',              check: (s) => s.sparCount >= 2,     reward: { combat: 4, gold: 25 } },
  { id: 'q_shop_1',    icon: '🛍️', text: '今天去商店买1件商品',         check: (s) => s.shopBuys >= 1,      reward: { gold: 15 } },
  { id: 'q_shop_2',    icon: '🏬', text: '今天去商店买2件商品',         check: (s) => s.shopBuys >= 2,      reward: { gold: 30, morale: 3 } },

  // 综合挑战
  { id: 'q_actions_3', icon: '📋', text: '今天完成3个行动',             check: (s) => s.actions >= 3,        reward: { gold: 22 } },
  { id: 'q_actions_5', icon: '🔥', text: '今天完成5个行动',             check: (s) => s.actions >= 5,        reward: { gold: 38, hp: 5 } },
  { id: 'q_actions_7', icon: '💫', text: '今天完成7个行动',             check: (s) => s.actions >= 7,        reward: { gold: 55, combat: 3, morale: 5 } },
  { id: 'q_no_danger',  icon: '🧘', text: '今天沉迷度不增加',           check: (s) => s.dangerGained <= 0,  reward: { morale: 10, gold: 18 } },
  { id: 'q_balanced',   icon: '⚖️', text: '今天训练+排位各至少1次',     check: (s) => s.trainCount >= 1 && s.rankWins + s.rankLosses >= 1, reward: { gold: 25, combat: 2 } },
  { id: 'q_all_rounder',icon: '🌈', text: '今天做3种不同类型的行动',    check: (s) => { let c=0; if(s.rankWins+s.rankLosses>0)c++; if(s.trainCount>0)c++; if(s.restCount>0)c++; if(s.exploreCount>0)c++; if(s.sparCount>0)c++; if(s.boostCount>0)c++; return c>=3; }, reward: { gold: 30, morale: 5, combat: 2 } },
  { id: 'q_gold_earn',  icon: '💰', text: '今天累计获得80金币',         check: (s) => s.goldEarned >= 80,    reward: { morale: 8, gold: 15 } },
  { id: 'q_no_rest',    icon: '🔋', text: '今天不休息（至少2个行动）',   check: (s) => s.restCount === 0 && s.actions >= 2, reward: { gold: 22, combat: 2 } },
];
