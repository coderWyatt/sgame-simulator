export const RANDOM_EVENTS = [
  // ===== 排位相关 (challenge) =====
  {
    id: 'afk_teammate',
    triggerOn: ['challenge'],
    icon: '🚪',
    title: '队友挂机！',
    text: '你排到一把排位，结果有个队友开局就挂机了！4v5！',
    choices: [
      { text: '😤 坚持打完', hint: '技术判定，胜：金币+25 心态+10，败：精力-20 心态-10', action: 'fight', difficulty: 0.6, winEffects: { gold: 25, morale: 10 }, loseEffects: { hp: -20, morale: -10 } },
      { text: '😮‍💨 认了算了', hint: '心态-5，但省精力', action: 'ok', effects: { morale: -5 } }
    ]
  },
  {
    id: 'carry_teammate',
    triggerOn: ['challenge'],
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
    triggerOn: ['challenge'],
    icon: '😤',
    title: '排位宿敌！',
    text: '你又排到了上次把你虐哭的那个对手，仇人见面分外眼红！',
    choices: [
      { text: '🔥 这次一定赢他', hint: '中等难度，胜：心态+15 技术+5，败：心态-20', action: 'fight', difficulty: 0.55, winEffects: { morale: 15, combat: 5 }, loseEffects: { morale: -20 } },
      { text: '😌 平常心对待', hint: '心态-3，但避免上头', action: 'ok', effects: { morale: -3 } }
    ]
  },
  {
    id: 'troll_pick',
    triggerOn: ['challenge'],
    icon: '🤡',
    title: '队友摆烂！',
    text: '队友选了个冷门英雄走辅助位，还说"相信我"...',
    choices: [
      { text: '🙏 选择相信', hint: '技术判定，胜：心态+15 技术+3，败：心态-15', action: 'fight', difficulty: 0.5, winEffects: { morale: 15, combat: 3 }, loseEffects: { morale: -15 } },
      { text: '😡 开始互喷', hint: '心态-10', action: 'ok', effects: { morale: -10 } }
    ]
  },
  {
    id: 'mvp_streak',
    triggerOn: ['challenge'],
    icon: '🌟',
    title: '连续MVP！',
    text: '你已经连续三把拿到MVP了，状态爆棚！',
    choices: [
      { text: '🔥 继续冲', hint: '技术+5，心态+10', action: 'ok', effects: { combat: 5, morale: 10 } },
      { text: '🧘 见好就收', hint: '心态+5', action: 'ok', effects: { morale: 5 } }
    ]
  },
  {
    id: 'report_warning',
    triggerOn: ['challenge'],
    icon: '⚠️',
    title: '被举报警告！',
    text: '上局被对面恶意举报了，系统发来扣分警告！虽然是误判，但心态有点受影响...',
    choices: [
      { text: '😤 不管了继续打', hint: '心态-8', action: 'ok', effects: { morale: -8 } },
      { text: '📝 申诉一下', hint: '精力-5，但心态+5', action: 'ok', effects: { hp: -5, morale: 5 } }
    ]
  },

  // ===== 训练相关 (train) =====
  {
    id: 'training_epiphany',
    triggerOn: ['train'],
    icon: '💡',
    title: '训练顿悟！',
    text: '你在训练中突然领悟了高手的运营思路，感觉打通了任督二脉！',
    choices: [
      { text: '🧠 深入研究', hint: '技术+8，精力-10', action: 'ok', effects: { combat: 8, hp: -10 } },
      { text: '📝 记录下来', hint: '技术+5', action: 'ok', effects: { combat: 5 } }
    ]
  },
  {
    id: 'training_boring',
    triggerOn: ['train'],
    icon: '😴',
    title: '训练枯燥...',
    text: '反复练习同样的操作，你觉得越来越无聊，注意力开始涣散...',
    choices: [
      { text: '💪 咬牙坚持', hint: '技术+3，心态-5', action: 'ok', effects: { combat: 3, morale: -5 } },
      { text: '🎵 放点音乐', hint: '心态+3，沉迷度+3', action: 'ok', effects: { morale: 3, danger: 3 } }
    ]
  },
  {
    id: 'coach_encounter',
    triggerOn: ['train'],
    icon: '🎓',
    title: '偶遇教练！',
    text: '训练营里遇到了一个职业战队的退役教练，他看了看你的操作给了些建议。',
    choices: [
      { text: '🙇 虚心请教 (20金)', hint: '技术+10', action: 'buy', cost: 20, effects: { combat: 10 } },
      { text: '👋 谢谢，下次吧', hint: '技术+2', action: 'ok', effects: { combat: 2 } }
    ]
  },
  {
    id: 'training_injury',
    triggerOn: ['train'],
    icon: '🤕',
    title: '手指抽筋！',
    text: '训练太猛了，你的手指突然抽筋了，疼得厉害...',
    choices: [
      { text: '🧊 冰敷休息', hint: '精力-10，心态+3', action: 'ok', effects: { hp: -10, morale: 3 } },
      { text: '💊 吃片止疼药 (10金)', hint: '精力-5', action: 'buy', cost: 10, effects: { hp: -5 } }
    ]
  },

  // ===== 观赛相关 (explore) =====
  {
    id: 'pro_friend',
    triggerOn: ['explore'],
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
    id: 'tournament',
    triggerOn: ['explore'],
    icon: '🏟️',
    title: '城市赛报名！',
    text: '本地正在举办王者荣耀城市赛，冠军有丰厚奖金！',
    choices: [
      { text: '🏆 报名参赛', hint: '高难度，胜：金币+50 心态+10，败：精力-25 心态-15', action: 'fight', difficulty: 0.65, winEffects: { gold: 50, morale: 10 }, loseEffects: { hp: -25, morale: -15 } },
      { text: '👀 去当观众', hint: '技术+5', action: 'ok', effects: { combat: 5 } }
    ]
  },
  {
    id: 'kpl_highlight',
    triggerOn: ['explore'],
    icon: '📺',
    title: 'KPL精彩操作！',
    text: '你看到了KPL选手一波教科书级的操作，反复观看了好几遍！',
    choices: [
      { text: '📖 仔细学习', hint: '技术+6，沉迷度+5', action: 'ok', effects: { combat: 6, danger: 5 } },
      { text: '🤩 纯粹欣赏', hint: '心态+5', action: 'ok', effects: { morale: 5 } }
    ]
  },
  {
    id: 'community_drama',
    triggerOn: ['explore'],
    icon: '🗣️',
    title: '社区大瓜！',
    text: '游戏社区爆出大瓜，某知名主播被曝代打上分，吃瓜吃到停不下来...',
    choices: [
      { text: '🍿 继续吃瓜', hint: '沉迷度+10，心态+5', action: 'ok', effects: { danger: 10, morale: 5 } },
      { text: '🚶 不看了', hint: '无事发生', action: 'ok', effects: {} }
    ]
  },

  // ===== 休息相关 (rest) =====
  {
    id: 'good_dream',
    triggerOn: ['rest'],
    icon: '💭',
    title: '做了个好梦！',
    text: '你梦到自己在KPL总决赛上carry全场拿了冠军，醒来心情大好！',
    choices: [
      { text: '😊 好兆头！', hint: '心态+10', action: 'ok', effects: { morale: 10 } }
    ]
  },
  {
    id: 'friend_invite',
    triggerOn: ['rest'],
    icon: '📱',
    title: '朋友来电！',
    text: '休息的时候朋友打来电话，约你出去吃饭逛街。',
    choices: [
      { text: '🍜 出去走走', hint: '精力+10，心态+8，沉迷度-8', action: 'ok', effects: { hp: 10, morale: 8, danger: -8 } },
      { text: '🏠 在家休息', hint: '精力+5', action: 'ok', effects: { hp: 5 } }
    ]
  },
  {
    id: 'sudden_insight',
    triggerOn: ['rest'],
    icon: '⚡',
    title: '灵光一闪！',
    text: '休息的时候突然想通了之前排位总犯的一个错误！',
    choices: [
      { text: '📝 赶紧记下来', hint: '技术+5', action: 'ok', effects: { combat: 5 } }
    ]
  },
  {
    id: 'family_nag',
    triggerOn: ['rest'],
    icon: '👨‍👩‍👦',
    title: '家人唠叨...',
    text: '休息时家人看到你一直在玩手机，开始念叨你要少玩点游戏...',
    choices: [
      { text: '😅 嘴上答应', hint: '心态-5', action: 'ok', effects: { morale: -5 } },
      { text: '🤝 认真反思', hint: '沉迷度-10，心态+3', action: 'ok', effects: { danger: -10, morale: 3 } }
    ]
  },

  // ===== 匹配相关 (spar) =====
  {
    id: 'streamer_match',
    triggerOn: ['spar'],
    icon: '🎬',
    title: '匹配到主播！',
    text: '你匹配到了一个人气主播，直播间几万人在看！',
    choices: [
      { text: '🔥 秀一波操作', hint: '技术判定，胜：心态+15 技术+3，败：心态-10', action: 'fight', difficulty: 0.5, winEffects: { morale: 15, combat: 3 }, loseEffects: { morale: -10 } },
      { text: '😏 低调行事', hint: '心态+3', action: 'ok', effects: { morale: 3 } }
    ]
  },
  {
    id: 'new_hero_discovery',
    triggerOn: ['spar'],
    icon: '🦸',
    title: '发现新英雄！',
    text: '你在匹配中试了一个从没玩过的英雄，竟然手感出奇地好！',
    choices: [
      { text: '🎯 多练几把', hint: '技术+5，沉迷度+5', action: 'ok', effects: { combat: 5, danger: 5 } },
      { text: '📌 记住了下次再说', hint: '技术+2', action: 'ok', effects: { combat: 2 } }
    ]
  },
  {
    id: 'noob_opponent',
    triggerOn: ['spar'],
    icon: '😎',
    title: '虐菜局！',
    text: '这把匹配对面全是新手，你轻松carry全场！',
    choices: [
      { text: '💪 大杀四方', hint: '心态+8，沉迷度+3', action: 'ok', effects: { morale: 8, danger: 3 } },
      { text: '🤝 带带新人', hint: '心态+5，技术+2', action: 'ok', effects: { morale: 5, combat: 2 } }
    ]
  },
  {
    id: 'spar_tryhard',
    triggerOn: ['spar'],
    icon: '🏅',
    title: '匹配遇高手！',
    text: '这把匹配对面实力很强，虽然是匹配但打起来跟排位一样激烈！',
    choices: [
      { text: '⚔️ 全力以赴', hint: '技术判定，胜：技术+5 心态+5，败：精力-8', action: 'fight', difficulty: 0.5, winEffects: { combat: 5, morale: 5 }, loseEffects: { hp: -8 } },
      { text: '😌 反正是匹配', hint: '心态+2', action: 'ok', effects: { morale: 2 } }
    ]
  },

  // ===== 代练相关 (boost) =====
  {
    id: 'client_praise',
    triggerOn: ['boost'],
    icon: '⭐',
    title: '客户好评！',
    text: '代练的客户对你的表现非常满意，给了额外的小费！',
    choices: [
      { text: '😊 开心收下', hint: '金币+20，心态+5', action: 'ok', effects: { gold: 20, morale: 5 } }
    ]
  },
  {
    id: 'boost_detection',
    triggerOn: ['boost'],
    icon: '🚨',
    title: '系统检测！',
    text: '代练时系统弹出了异常检测提示，差点被封号！你吓出一身冷汗...',
    choices: [
      { text: '😰 赶紧停手', hint: '沉迷度-5，心态-10', action: 'ok', effects: { danger: -5, morale: -10 } },
      { text: '🤫 小心继续', hint: '沉迷度+10，金币+15', action: 'ok', effects: { danger: 10, gold: 15 } }
    ]
  },
  {
    id: 'big_order',
    triggerOn: ['boost'],
    icon: '💰',
    title: '接到大单！',
    text: '有人出高价要你帮忙从白银打到钻石，但工作量不小...',
    choices: [
      { text: '💼 接下来', hint: '金币+40，精力-15，沉迷度+8', action: 'ok', effects: { gold: 40, hp: -15, danger: 8 } },
      { text: '🙅 太累了拒绝', hint: '心态+3', action: 'ok', effects: { morale: 3 } }
    ]
  },
  {
    id: 'boost_learn',
    triggerOn: ['boost'],
    icon: '🎯',
    title: '低段位新体验！',
    text: '代练低段位的时候，你尝试了一些骚操作，意外发现了新打法！',
    choices: [
      { text: '💡 记住这个打法', hint: '技术+5', action: 'ok', effects: { combat: 5 } },
      { text: '😏 低段位罢了', hint: '无事发生', action: 'ok', effects: {} }
    ]
  },

  // ===== 通用事件 (任何行动都可能触发) =====
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
    text: '突然460！你的英雄在泉水疯狂转圈...',
    choices: [
      { text: '🔄 重连试试', hint: '技术判定，成功无事，失败精力-15', action: 'dodge' },
    ]
  },
  {
    id: 'phone_overheat',
    icon: '🔥',
    title: '手机发烫！',
    text: '手机玩得太久了，烫得都拿不住了！',
    choices: [
      { text: '❄️ 休息一会', hint: '精力+5，沉迷度-3', action: 'ok', effects: { hp: 5, danger: -3 } },
      { text: '🧊 贴个散热片继续', hint: '精力-5，沉迷度+5', action: 'ok', effects: { hp: -5, danger: 5 } }
    ]
  },
  {
    id: 'gift_code',
    icon: '🎟️',
    title: '礼包码！',
    text: '你在社交媒体上刷到了一个官方礼包兑换码！',
    choices: [
      { text: '🎁 赶紧兑换', hint: '金币+15，精力+5', action: 'ok', effects: { gold: 15, hp: 5 } }
    ]
  },
  {
    id: 'exam_reminder',
    icon: '📚',
    title: '现实事务！',
    text: '你突然想起来明天有重要的事情要处理，有点焦虑...',
    choices: [
      { text: '😰 先处理正事', hint: '沉迷度-10，精力-8，心态+5', action: 'ok', effects: { danger: -10, hp: -8, morale: 5 } },
      { text: '🎮 管他呢继续玩', hint: '沉迷度+8，心态-5', action: 'ok', effects: { danger: 8, morale: -5 } }
    ]
  },
];
