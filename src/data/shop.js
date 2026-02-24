export const SHOP_ITEMS = [
  { id: 'coffee',       icon: '☕', name: '冰美式',     desc: '精力 +35',                price: 20,  effects: { hp: 35 } },
  { id: 'redbull',      icon: '🥤', name: '功能饮料',   desc: '精力 +70',                price: 45,  effects: { hp: 70 } },
  { id: 'tutorial',     icon: '📚', name: '攻略大全',   desc: '技术 +6',                 price: 30,  effects: { combat: 6 } },
  { id: 'snack',        icon: '🍕', name: '夜宵外卖',   desc: '心态 +20',                price: 15,  effects: { morale: 20 } },
  { id: 'exercise',     icon: '🏃', name: '健身卡',     desc: '沉迷度 -15，精力 +10',    price: 35,  effects: { danger: -15, hp: 10 } },
  { id: 'movie',        icon: '🎬', name: '电影票',     desc: '沉迷度 -10，心态 +10',    price: 25,  effects: { danger: -10, morale: 10 } },
  { id: 'book',         icon: '📖', name: '课外读物',   desc: '沉迷度 -8',               price: 15,  effects: { danger: -8 } },
  { id: 'vacation',     icon: '🏖️', name: '周末出游',   desc: '精力全满，沉迷度 -20',    price: 80,  effects: { hp: 999, danger: -20 } },
];
