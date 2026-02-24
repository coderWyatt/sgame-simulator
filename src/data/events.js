export const RANDOM_EVENTS = [
  {
    id: 'afk_teammate',
    icon: '🚪',
    title: '队友挂机！',
    text: '你排到一把排位，结果有个队友开局就挂机了！4v5！',
    choices: [
      { text: '😤 坚持打完', hint: '技术判定，胜：金币+25 心态+10，败：精力-20 心态-10', action: 'fight', difficulty: 0.6 },
      { text: '😮‍💨 认了算了', hint: '心态-5，但省精力', action: 'ok', effects: { morale: -5 } }
    ]
  },
  {
    id: 'treasure',
    icon: '🎁',
    title: '登录奖励！',
    text: '系统发了一波福利，你领到了丰厚的登录奖励！',
    choices: [
      { text: '🎉 开心收下', hint: '金币+20~40', action: 'ok', effects: { gold: [20, 40] } },
    ]
  },
  {
    id: 'pro_friend',
    icon: '🤝',
    title: '大神好友！',
    text: '一个王者段位的大神主动加了你好友，要不要请教一下？',
    choices: [
      { text: '🎓 请教技术', hint: '技术+5~8', action: 'ok', effects: { combat: [5, 8] } },
      { text: '🍵 一起开黑', hint: '心态+10，技术+3', action: 'ok', effects: { morale: 10, combat: 3 } },
      { text: '👋 改天再说', hint: '无事发生', action: 'ok', effects: {} }
    ]
  },
  {
    id: 'version_update',
    icon: '🔄',
    title: '版本大更新！',
    text: '游戏迎来大版本更新，英雄平衡大调整，你常用的英雄被削了...',
    choices: [
      { text: '📚 研究新版本', hint: '沉迷度+15，但技术+10', action: 'ok', effects: { danger: 15, combat: 10 } },
      { text: '😑 先观望一下', hint: '沉迷度+3', action: 'ok', effects: { danger: 3 } }
    ]
  },
  {
    id: 'tournament',
    icon: '🏟️',
    title: '城市赛报名！',
    text: '本地正在举办王者荣耀城市赛，冠军有丰厚奖金！',
    choices: [
      { text: '🏆 报名参赛', hint: '高难度，胜：金币+50 心态+10，败：精力-25 心态-15', action: 'fight', difficulty: 0.65 },
      { text: '👀 去当观众', hint: '技术+5', action: 'ok', effects: { combat: 5 } }
    ]
  },
  {
    id: 'skin_sale',
    icon: '🛍️',
    title: '皮肤限时折扣！',
    text: '商城上架了你心仪已久的传说皮肤，限时5折！',
    choices: [
      { text: '💸 买买买 (30金)', hint: '心态+15，手感更好了', action: 'buy', cost: 30, effects: { morale: 15, combat: 2 } },
      { text: '🧘 忍住不买', hint: '心态-3，钱包保住了', action: 'ok', effects: { morale: -3 } }
    ]
  },
  {
    id: 'lucky_streak',
    icon: '🍀',
    title: '状态火热！',
    text: '你今天手感特别好，操作行云流水！',
    choices: [
      { text: '🔥 趁热多打几把', hint: '精力+15，技术+5，心态+10', action: 'ok', effects: { hp: 15, combat: 5, morale: 10 } },
    ]
  },
  {
    id: 'lag_spike',
    icon: '📶',
    title: '网络波动！',
    text: '打排位打到一半突然460！你的英雄在泉水疯狂转圈...',
    choices: [
      { text: '🔄 重连试试', hint: '技术判定，成功无事，失败精力-15', action: 'dodge' },
    ]
  },
  {
    id: 'carry_teammate',
    icon: '💪',
    title: '实力队友！',
    text: '这把排位你遇到了一个超强的队友，配合默契！',
    choices: [
      { text: '🤝 加好友组排', hint: '技术+5，心态+8', action: 'ok', effects: { combat: 5, morale: 8 } },
      { text: '👍 点赞后继续', hint: '心态+3', action: 'ok', effects: { morale: 3 } }
    ]
  },
  {
    id: 'rival',
    icon: '😤',
    title: '排位宿敌！',
    text: '你又排到了上次把你虐哭的那个对手，仇人见面分外眼红！',
    choices: [
      { text: '🔥 这次一定赢他', hint: '中等难度，胜：心态+15 技术+5，败：心态-20', action: 'fight', difficulty: 0.55 },
      { text: '😌 平常心对待', hint: '心态-3，但避免上头', action: 'ok', effects: { morale: -3 } }
    ]
  }
];
