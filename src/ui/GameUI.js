import { EventModal } from './EventModal.js';
import { ShopModal } from './ShopModal.js';
import { getActionCost } from '../systems/ActionSystem.js';
import { getRankByIndex } from '../data/ranks.js';
import { HEROES, getHeroById } from '../data/heroes.js';
import { getDifficulty } from '../data/difficulty.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const STAT_DEFS = [
  { key: 'hp',      icon: '⚡', label: '精力', max: 'maxHp', cls: 'hp' },
  { key: 'combat',  icon: '🎯', label: '技术', max: 200,     cls: 'combat' },
  { key: 'morale',  icon: '😊', label: '心态', max: 100,     cls: 'morale' },
  { key: 'gold',    icon: '💰', label: '金币', max: 9999,    cls: 'gold' },
  { key: 'danger',  icon: '📱', label: '沉迷', max: 100,     cls: 'danger' },
];

function rng(base, range, mult) {
  const lo = Math.round(base * mult);
  const hi = Math.round((base + range) * mult);
  return lo === hi ? `${lo}` : `${lo}~${hi}`;
}

function getActions(diff) {
  const d = diff || getDifficulty('hard');
  return [
    { id: 'shop', icon: '🛒', name: '商店', desc: '花金币购买道具，恢复状态', tags: [
      { text: '不消耗时间', cls: 'neu' },
    ], fullWidth: true },
    { id: 'challenge', icon: '🏆', name: '排位', desc: '胜率取决于技术是否匹配段位', tags: [
      { text: `沉迷+(${rng(3,3,d.dangerMult)})`, cls: 'neg' },
      { text: `胜：升段 金币+(${rng(22,23,d.goldMult)}) 精力-(${rng(8,4,d.hpCostMult)})`, cls: 'pos' },
      { text: `败：掉段 心态-(${rng(8,7,d.moraleLossMult)}) 精力-(${rng(15,9,d.hpCostMult)})`, cls: 'neg' },
    ]},
    { id: 'boost', icon: '💼', name: '代练', desc: '帮别人打排位赚金币', tags: [
      { text: `金币+(${rng(40,25,d.goldMult)})`, cls: 'pos' },
      { text: `沉迷+(${rng(8,5,d.dangerMult)})`, cls: 'neg' },
      { text: `精力-(${rng(5,5,d.hpCostMult)})`, cls: 'neg' },
    ]},
    { id: 'train', icon: '🎯', name: '训练', desc: '消耗金币换技术提升', tags: [
      { text: `技术+(${rng(5,7,d.combatGainMult)})`, cls: 'pos' },
      { text: `金币-${Math.round(15 * d.trainCostMult)}`, cls: 'neg' },
    ]},
    { id: 'explore', icon: '📺', name: '观赛', desc: '看比赛学习，可能触发事件', tags: [
      { text: `技术+(${rng(3,4,d.combatGainMult)})`, cls: 'pos' },
      { text: `沉迷+(${rng(5,5,d.dangerMult)})`, cls: 'neg' },
    ]},
    { id: 'rest', icon: '☕', name: '小憩', desc: '恢复身心，降低沉迷', tags: [
      { text: `精力+(${rng(10,7,d.restBonus)})`, cls: 'pos' },
      { text: `心态+(${rng(5,4,d.restBonus)})`, cls: 'pos' },
      { text: '沉迷-(5~8)', cls: 'pos' },
    ]},
    { id: 'spar', icon: '🎮', name: '匹配', desc: '低压力练习，白银解锁', tags: [
      { text: `技术+(${rng(3,2,d.combatGainMult)})`, cls: 'pos' },
      { text: '心态+3', cls: 'pos' },
      { text: `沉迷+(${rng(2,2,d.dangerMult)})`, cls: 'neg' },
    ]},
  ];
}

export class GameUI {
  constructor(container, onAction) {
    this.container = container;
    this.onAction = onAction;
    this.eventModal = new EventModal(container);
    this.shopModal = new ShopModal(container);
    this.root = null;
    this.els = {};
    this.build();
  }

  build() {
    this.root = document.createElement('div');
    this.root.className = 'sim-root';

    this.root.innerHTML = `
      <div class="sim-topbar">
        <span class="topbar-accent"></span>
        <div class="topbar-brand">
          <span class="topbar-logo">🎮</span>
          <span class="topbar-title">排位模拟器</span>
          <span class="topbar-dot">·</span>
          <span class="topbar-sub">RANK SIMULATOR</span>
        </div>
        <div class="topbar-right">
          <span class="topbar-ver">v1.0</span>
          <button class="topbar-btn rules-btn">📖 规则</button>
          <button class="topbar-btn save-btn">💾 存档</button>
        </div>
      </div>
      <div class="sim-stats"></div>
      <div class="sim-scroll">
        <div class="scene-card">
          <div class="scene-title-row">
            <div class="scene-title"></div>
            <div class="scene-time-bar"><div class="scene-time-fill"></div></div>
          </div>
          <div class="scene-text"></div>
        </div>
        <div class="sim-actions"></div>
        <div class="sim-log-section">
          <div class="sim-log-header">
            <span class="log-header-icon">📋</span>
            <span class="log-header-title">操作记录</span>
            <span class="log-header-count"></span>
          </div>
          <div class="sim-log"></div>
        </div>
      </div>
      <div class="bottom-bar">
        <button class="sys-btn hero-btn" data-panel="hero">🦸<span>英雄</span></button>
        <button class="sys-btn friend-btn" data-panel="friend">🤝<span>好友</span></button>
        <button class="sys-btn quest-btn" data-panel="quest">📋<span>任务</span></button>
        <button class="sys-btn ach-btn" data-panel="ach">🏅<span>成就</span></button>
        <div class="bottom-sep"></div>
        <button class="bottom-btn sleep-btn">🌙 睡觉</button>
      </div>
    `;

    this.container.appendChild(this.root);

    this.els.stats      = this.root.querySelector('.sim-stats');
    this.els.sceneTitle = this.root.querySelector('.scene-title');
    this.els.sceneText  = this.root.querySelector('.scene-text');
    this.els.actions    = this.root.querySelector('.sim-actions');
    this.els.log        = this.root.querySelector('.sim-log');
    this.els.logCount   = this.root.querySelector('.log-header-count');
    this.els.scroll     = this.root.querySelector('.sim-scroll');
    this.els.timeBarFill  = this.root.querySelector('.scene-time-fill');
    this.els.timeBar      = this.root.querySelector('.scene-time-bar');

    this.sleepBtn = this.root.querySelector('.sleep-btn');
    this.sleepBtn.addEventListener('click', () => this.onAction('sleep'));

    this.saveBtn = this.root.querySelector('.save-btn');
    this.saveBtn.addEventListener('click', () => this.onAction('save'));

    this.rulesBtn = this.root.querySelector('.rules-btn');
    this.rulesBtn.addEventListener('click', () => this.showRules());

    this.root.querySelectorAll('.sys-btn').forEach(btn => {
      btn.addEventListener('click', () => this.onAction('panel:' + btn.dataset.panel));
    });

    this.buildStatBars();
    this.buildActions();
  }

  buildStatBars() {
    this.statEls = {};
    this.els.stats.innerHTML = `
      <div class="stats-header">
        <span class="stats-title">📊 召唤师状态</span>
        <div class="stats-header-right">
          <span class="stats-diff-tag"></span>
          <span class="stats-friend-tag"></span>
          <span class="stats-streak-tag"></span>
          <span class="stats-hero-tag"></span>
          <span class="stats-rank-badge"></span>
        </div>
      </div>`;
    this.rankBadge = this.els.stats.querySelector('.stats-rank-badge');
    this.heroTag = this.els.stats.querySelector('.stats-hero-tag');
    this.friendTag = this.els.stats.querySelector('.stats-friend-tag');
    this.streakTag = this.els.stats.querySelector('.stats-streak-tag');
    this.diffTag = this.els.stats.querySelector('.stats-diff-tag');
    this.streakTag = this.els.stats.querySelector('.stats-streak-tag');
    for (const s of STAT_DEFS) {
      const row = document.createElement('div');
      row.className = `stat-row ${s.cls}-row`;
      const maxLabel = typeof s.max === 'number' ? s.max : '';
      row.innerHTML = `
        <div class="stat-head">
          <span class="stat-icon">${s.icon}</span>
          <span class="stat-label">${s.label}</span>
          <span class="stat-num">0${maxLabel ? `<span class="stat-max">/${maxLabel}</span>` : ''}</span>
        </div>
        <div class="stat-bar-wrap"><div class="stat-fill ${s.cls}" style="width:0%"></div></div>
      `;
      this.els.stats.appendChild(row);
      this.statEls[s.key] = {
        fill: row.querySelector('.stat-fill'),
        num: row.querySelector('.stat-num'),
        row,
      };
    }
  }

  buildActions(player) {
    this.actionBtns = {};
    this.els.actions.innerHTML = '';
    const diff = player ? getDifficulty(player.difficultyId) : getDifficulty('hard');
    const actions = getActions(diff);
    for (const a of actions) {
      const cost = getActionCost(a.id, player);
      const btn = document.createElement('button');
      btn.className = `action-card${a.fullWidth ? ' full-width' : ''}`;
      btn.dataset.action = a.id;

      const costBadge = cost > 0 ? `<span class="act-cost">-${cost}h</span>` : '';
      const tagsHtml = (a.tags || []).map(t =>
        `<span class="act-tag ${t.cls}">${t.text}</span>`
      ).join('');

      btn.innerHTML = `
        <div class="act-header">
          <span class="act-icon">${a.icon}</span>
          <span class="act-name">${a.name}</span>
          ${costBadge}
        </div>
        <div class="act-desc">${a.desc}</div>
        <div class="act-tags">${tagsHtml}</div>
      `;
      btn.addEventListener('click', () => this.onAction(a.id));
      this.els.actions.appendChild(btn);
      this.actionBtns[a.id] = { btn, cost };
    }
  }

  show() { this.root.classList.add('visible'); }
  hide() { this.root.classList.remove('visible'); }

  refresh(player) {
    this._difficultyId = player.difficultyId;
    this._maxDays = player.maxDays;
    const overtime = player.getOvertimeHours();
    if (overtime > 0) {
      this.els.timeBar.style.display = 'none';
    } else {
      this.els.timeBar.style.display = '';
      const timePct = Math.min(100, (player.timeLeft / player.baseTime) * 100);
      this.els.timeBarFill.style.width = timePct + '%';
      this.els.timeBar.classList.remove('overtime');
      this.els.timeBar.classList.toggle('low', player.timeLeft <= 2);
    }

    const rank = player.getRank();
    this.rankBadge.textContent = `${rank.emoji} ${rank.name}`;

    const diff = getDifficulty(player.difficultyId);
    this.diffTag.textContent = `${diff.icon} ${diff.name}`;
    this.diffTag.style.color = diff.color;

    const hero = getHeroById(player.heroId);
    this.heroTag.textContent = `${hero.icon} ${hero.name}`;

    const activeFriend = player.activeFriendId
      ? player.friends.find(f => f.id === player.activeFriendId) : null;
    this.friendTag.textContent = activeFriend ? `🤝 ${activeFriend.icon} ${activeFriend.name}` : '';
    this.friendTag.style.display = activeFriend ? '' : 'none';

    if (player.winStreak >= 3) {
      this.streakTag.textContent = `🔥 ${player.winStreak}连胜`;
      this.streakTag.className = 'stats-streak-tag streak-win';
      this.streakTag.style.display = '';
    } else if (player.loseStreak >= 3) {
      this.streakTag.textContent = `😰 ${player.loseStreak}连败`;
      this.streakTag.className = 'stats-streak-tag streak-lose';
      this.streakTag.style.display = '';
    } else {
      this.streakTag.textContent = '';
      this.streakTag.className = 'stats-streak-tag';
      this.streakTag.style.display = 'none';
    }



    for (const s of STAT_DEFS) {
      const val = player[s.key] || 0;
      const maxVal = typeof s.max === 'string' ? (player[s.max] || 100) : s.max;
      const pct = Math.min(100, (val / maxVal) * 100);
      this.statEls[s.key].fill.style.width = pct + '%';
      const maxLabel = typeof s.max === 'number' ? `<span class="stat-max">/${s.max}</span>` : '';
      this.statEls[s.key].num.innerHTML = `${val}${maxLabel}`;
    }

    const actions = getActions(diff);
    for (const a of actions) {
      const cost = getActionCost(a.id, player);
      const { btn } = this.actionBtns[a.id];
      this.actionBtns[a.id].cost = cost;
      const costEl = btn.querySelector('.act-cost');
      if (costEl && cost > 0) costEl.textContent = `-${cost}h`;

      // 更新 tags 数值（难度变化时）
      const tagsEl = btn.querySelector('.act-tags');
      if (tagsEl) {
        tagsEl.innerHTML = (a.tags || []).map(t =>
          `<span class="act-tag ${t.cls}">${t.text}</span>`
        ).join('');
      }

      if (a.id === 'spar') {
        btn.disabled = !player.sparUnlocked || (cost > 0 && !player.canAffordAction(cost));
      } else if (a.id === 'shop') {
        btn.disabled = false;
      } else {
        btn.disabled = cost > 0 && !player.canAffordAction(cost);
      }
    }
  }

  setScene(scene) {
    this.els.sceneTitle.textContent = scene.title || '';
    const escaped = (scene.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    this.els.sceneText.innerHTML = escaped.replace(/\n/g, '<br>');
  }

  addLog(type, text, tag) {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;

    const tagMap = {
      system: { icon: '💬', label: '系统' },
      action: { icon: '🎮', label: '行动' },
      stat:   { icon: '📊', label: '数值' },
      rank:   { icon: '🏆', label: '段位' },
      quest:  { icon: '📋', label: '任务' },
      unlock: { icon: '🔓', label: '解锁' },
      shop:   { icon: '🛒', label: '商店' },
      event:  { icon: '🎲', label: '事件' },
      save:   { icon: '💾', label: '存档' },
    };

    const t = tagMap[tag];
    const tagHtml = t ? `<span class="log-tag log-tag-${tag}">${t.label}</span>` : '';
    const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g, '<br>');
    line.innerHTML = `${tagHtml}<span class="log-text">${escaped}</span>`;

    this.els.log.prepend(line);
    while (this.els.log.children.length > 50) {
      this.els.log.removeChild(this.els.log.lastChild);
    }
    this.els.logCount.textContent = this.els.log.children.length;
  }

  showActionResult(result, callback) {
    this.eventModal.show({
      icon: '',
      title: result.title,
      text: result.text,
      effects: result.changes,
      choices: null,
    }, () => callback());
  }

  showOvertimeConfirm(overtimeAfter, hpPen, combatPen, onConfirm, onCancel) {
    this.eventModal.show({
      icon: '⚠️',
      title: '即将透支！',
      text: `执行后将透支 ${overtimeAfter}h\n透支惩罚：精力 -${hpPen}，技术 -${combatPen}\n\n继续透支会让状态持续恶化，确定要继续吗？`,
      choices: [
        { text: '⚡ 继续熬夜', action: 'confirm', hint: '身体是革命的本钱...' },
        { text: '🌙 算了，去睡觉', action: 'cancel', hint: '明天再战' },
      ],
    }, (choice) => {
      if (choice.action === 'confirm') onConfirm();
      else onCancel();
    });
  }

  showDaySummary(summaryText, callback) {
    this.eventModal.show({
      icon: '🌙',
      title: '一天结束',
      text: summaryText,
      choices: null,
    }, () => callback());
  }

  showEvent(evt, onChoice) {
    this.eventModal.show({
      icon: evt.icon,
      title: evt.title,
      text: evt.text,
      choices: evt.choices,
    }, onChoice);
  }

  showEventToast({ icon, title, changes, duration }) {
    const labels = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷度' };
    const tags = [];
    if (changes) {
      for (const [k, v] of Object.entries(changes)) {
        if (v === 0) continue;
        const label = labels[k] || k;
        const cls = v > 0 ? (['danger'].includes(k) ? 'neg' : 'pos') : (['danger'].includes(k) ? 'pos' : 'neg');
        tags.push(`<span class="event-toast-tag ${cls}">${label} ${v > 0 ? '+' : ''}${v}</span>`);
      }
    }

    const el = document.createElement('div');
    el.className = 'event-toast';
    el.innerHTML = `
      <div class="event-toast-icon">${icon || '📢'}</div>
      <div class="event-toast-title">${title}</div>
      ${tags.length ? `<div class="event-toast-changes">${tags.join('')}</div>` : ''}
    `;
    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));

    const dur = duration || 1800;
    setTimeout(() => {
      el.classList.remove('visible');
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 350);
    }, dur);
  }

  showRankUp(rank, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'rank-up-overlay';
    overlay.innerHTML = `
      <div class="rank-up-emoji">${rank.emoji}</div>
      <div class="rank-up-text">段位晋升！</div>
      <div class="rank-up-sub">${rank.name}</div>
    `;
    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    setTimeout(() => {
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        callback();
      }, 500);
    }, 2000);
  }

  showGameOver(result) {
    this.eventModal.show({
      icon: result.emoji,
      title: result.won ? '🎊 恭喜通关！' : '😵 游戏结束',
      text: result.reason,
      choices: null,
      gameOver: true,
    }, () => {
      window.location.reload();
    });
  }

  showShop(player, onBuy, onClose) {
    this.shopModal.show(player, onBuy, onClose);
  }

  showSavePanel(gm, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'save-overlay';
    const panel = document.createElement('div');
    panel.className = 'save-panel';
    overlay.appendChild(panel);

    const renderSlots = () => {
      const slots = gm.getAllSlots();
      panel.innerHTML = `
        <div class="save-header">
          <span class="save-header-title">💾 存档管理</span>
          <button class="save-close-x">✕</button>
        </div>
        <div class="save-slots">
          ${slots.map(s => {
            const empty = !s.meta;
            const isAuto = s.id === 'auto';
            let info = '';
            if (!empty) {
              const rank = getRankByIndex(s.meta.rankIndex);
              const timeStr = s.meta.timestamp ? new Date(s.meta.timestamp).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
              info = `
                <div class="slot-info">
                  <span class="slot-name-text">${s.meta.name || '召唤师'}</span>
                  <span class="slot-detail">第${s.meta.day}天 · ${rank.emoji} ${rank.name}</span>
                  <span class="slot-time">${isAuto ? '睡觉前自动保存' : ''}${timeStr ? (isAuto ? ' · ' : '') + timeStr : ''}</span>
                </div>`;
            } else {
              info = '<div class="slot-info"><span class="slot-empty">空存档</span></div>';
            }
            const label = isAuto && !empty ? `自动·第${s.meta.day}天` : s.label;
            return `
              <div class="save-slot ${empty ? 'empty' : ''}" data-id="${s.id}">
                <div class="slot-label">${label}</div>
                ${info}
                <div class="slot-actions">
                  ${!isAuto ? `<button class="slot-btn slot-save" data-id="${s.id}">${empty ? '保存' : '覆盖'}</button>` : ''}
                  ${!empty ? `<button class="slot-btn slot-load" data-id="${s.id}">读取</button>` : ''}
                  ${!isAuto && !empty ? `<button class="slot-btn slot-del" data-id="${s.id}">删除</button>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      `;

      panel.querySelector('.save-close-x').onclick = close;

      panel.querySelectorAll('.slot-save').forEach(btn => {
        btn.onclick = () => showConfirm(`确定覆盖存档 ${btn.dataset.id} 吗？`, () => {
          gm.saveToSlot(btn.dataset.id);
          renderSlots();
        });
      });

      panel.querySelectorAll('.slot-load').forEach(btn => {
        btn.onclick = () => showConfirm('确定读取此存档吗？当前未保存的进度将丢失。', () => {
          gm.loadFromSlot(btn.dataset.id);
          close();
        });
      });

      panel.querySelectorAll('.slot-del').forEach(btn => {
        btn.onclick = () => showConfirm(`确定删除存档 ${btn.dataset.id} 吗？此操作不可恢复。`, () => {
          gm.deleteSlot(btn.dataset.id);
          renderSlots();
        });
      });
    };

    const showConfirm = (msg, onOk) => {
      const confirmEl = document.createElement('div');
      confirmEl.className = 'save-confirm-overlay';
      confirmEl.innerHTML = `
        <div class="save-confirm-card">
          <div class="save-confirm-msg">${msg}</div>
          <div class="save-confirm-actions">
            <button class="save-confirm-btn cancel">取消</button>
            <button class="save-confirm-btn ok">确定</button>
          </div>
        </div>
      `;
      overlay.appendChild(confirmEl);
      requestAnimationFrame(() => confirmEl.classList.add('visible'));

      confirmEl.querySelector('.cancel').onclick = () => {
        confirmEl.classList.remove('visible');
        setTimeout(() => confirmEl.remove(), 200);
      };
      confirmEl.querySelector('.ok').onclick = () => {
        confirmEl.classList.remove('visible');
        setTimeout(() => confirmEl.remove(), 200);
        onOk();
      };
    };

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      if (onClose) onClose();
    };

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    renderSlots();
  }

  showRules() {
    const maxDays = this._maxDays || 30;
    const diff = getDifficulty(this._difficultyId || 'hard');
    const d = diff;
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    overlay.innerHTML = `
      <div class="intro-card">
        <div class="intro-header">
          <div class="intro-title">📖 王者荣耀模拟器 (V1.0)</div>
          <div class="intro-tag">CONFIDENTIAL // SUMMONER'S RIFT DOCS</div>
        </div>
        <div class="intro-body">
          <div class="intro-section">
            <div class="intro-section-title">一、核心目标</div>
            <div class="intro-conditions">
              <div class="intro-cond-box win">
                <div class="cond-label">🏆 胜利条件</div>
                ${maxDays}天内<br>段位晋升至「👑 王者」
              </div>
              <div class="intro-cond-box lose">
                <div class="cond-label">💀 失败条件</div>
                精力归零 / 心态崩了<br>沉迷度满100
              </div>
            </div>
          </div>
          <div class="intro-section">
            <div class="intro-section-title">二、时间管理</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;margin-bottom:8px;">
              每天有 <b>10小时</b> 可支配时间，每个行动消耗不同时长。<br>
              可以<b style="color:var(--red)">透支</b>到最多24h，但会损失精力和技术！<br>
              点 <b style="color:#3b82f6">🌙 睡觉</b> 结束当天，按时休息恢复状态。
            </div>
            <div class="intro-res-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;">
              <div class="intro-res"><span class="res-icon">😴</span><span class="res-name">不透支</span><span class="res-desc">隔天精力+15 心态+5</span></div>
              <div class="intro-res"><span class="res-icon">🥱</span><span class="res-name">透支1~2h</span><span class="res-desc">每次行动 精力-3 技术-1</span></div>
              <div class="intro-res"><span class="res-icon">😵</span><span class="res-name">透支3~5h</span><span class="res-desc">每次行动 精力-5 技术-2</span></div>
              <div class="intro-res"><span class="res-icon">💀</span><span class="res-name">透支≥6h</span><span class="res-desc">每次行动 精力-8 技术-3 心态-5</span></div>
            </div>
          </div>
          <div class="intro-section">
            <div class="intro-section-title">三、段位升降</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;margin-bottom:8px;">
              打<b>排位</b>赢了直接<b style="color:var(--green)">升一个小段</b>，输了直接<b style="color:var(--red)">掉一个小段</b>。<br>青铜III是保底段位，不会再掉。技术越高，排位胜率越大。
            </div>
            <div class="intro-rank-flow">
              <span class="rank-item">🥉 青铜</span><span class="rank-arrow">→</span>
              <span class="rank-item">🥈 白银</span><span class="rank-arrow">→</span>
              <span class="rank-item">🥇 黄金</span><span class="rank-arrow">→</span>
              <span class="rank-item">💎 铂金</span><span class="rank-arrow">→</span>
              <span class="rank-item">💠 钻石</span><span class="rank-arrow">→</span>
              <span class="rank-item">🌟 星耀</span><span class="rank-arrow">→</span>
              <span class="rank-item">👑 王者</span>
            </div>
          </div>
          <div class="intro-section">
            <div class="intro-section-title">四、每日行动 <span style="font-size:11px;color:${d.color};font-weight:normal;margin-left:6px;padding:1px 6px;border-radius:3px;background:${d.color}22;">${d.icon} ${d.name}难度</span></div>
            <div class="intro-actions-list">
              <div class="intro-act-row"><span class="act-emoji">🏆</span><span class="act-label">排位</span><span class="act-effect">3h · 胜→金币+${rng(22,23,d.goldMult)} 精力-${rng(8,4,d.hpCostMult)} / 败→精力-${rng(15,9,d.hpCostMult)} 心态-${rng(8,7,d.moraleLossMult)} · 沉迷+${rng(3,3,d.dangerMult)}</span></div>
              <div class="intro-act-row"><span class="act-emoji">🎯</span><span class="act-label">训练</span><span class="act-effect">2h · 技术+${rng(5,7,d.combatGainMult)} · 金币-${Math.round(15*d.trainCostMult)}</span></div>
              <div class="intro-act-row"><span class="act-emoji">📺</span><span class="act-label">观赛</span><span class="act-effect">2h · 技术+${rng(3,4,d.combatGainMult)} · 沉迷+${rng(5,5,d.dangerMult)} · 触发随机事件</span></div>
              <div class="intro-act-row"><span class="act-emoji">💼</span><span class="act-label">代练</span><span class="act-effect">2h · 金币+${rng(40,25,d.goldMult)} · 沉迷+${rng(8,5,d.dangerMult)} · 精力-${rng(5,5,d.hpCostMult)}</span></div>
              <div class="intro-act-row"><span class="act-emoji">🎮</span><span class="act-label">匹配</span><span class="act-effect">1h · 技术+${rng(3,2,d.combatGainMult)} · 心态+3 · 沉迷+${rng(2,2,d.dangerMult)}（白银解锁）</span></div>
              <div class="intro-act-row"><span class="act-emoji">☕</span><span class="act-label">小憩</span><span class="act-effect">1h · 精力+${rng(10,7,d.restBonus)} · 心态+${rng(5,4,d.restBonus)} · 沉迷-5~8</span></div>
              <div class="intro-act-row"><span class="act-emoji">🛒</span><span class="act-label">商店</span><span class="act-effect">0h · 花金币买道具（可回精力/降沉迷等）</span></div>
            </div>
          </div>
          <div class="intro-section">
            <div class="intro-section-title">五、关键资源</div>
            <div class="intro-res-grid" style="grid-template-columns:1fr 1fr 1fr 1fr 1fr;">
              <div class="intro-res"><span class="res-icon">⚡</span><span class="res-name">精力</span><span class="res-desc">身体状态</span></div>
              <div class="intro-res"><span class="res-icon">🎯</span><span class="res-name">技术</span><span class="res-desc">游戏水平</span></div>
              <div class="intro-res"><span class="res-icon">😊</span><span class="res-name">心态</span><span class="res-desc">精神状态</span></div>
              <div class="intro-res"><span class="res-icon">💰</span><span class="res-name">金币</span><span class="res-desc">游戏货币</span></div>
              <div class="intro-res"><span class="res-icon">📱</span><span class="res-name">沉迷度</span><span class="res-desc">满100出局</span></div>
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">六、英雄系统</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;margin-bottom:8px;">
              共6位英雄可选，每位英雄有独特加成和副作用。用金币解锁后可随时切换。
            </div>
            <div class="intro-res-grid" style="grid-template-columns:1fr 1fr 1fr;">
              <div class="intro-res"><span class="res-icon">⚔️</span><span class="res-name">战士(免费)</span><span class="res-desc">胜率+3%</span></div>
              <div class="intro-res"><span class="res-icon">🗡️</span><span class="res-name">刺客(60金)</span><span class="res-desc">训练+25% 精力消耗+10%</span></div>
              <div class="intro-res"><span class="res-icon">🔮</span><span class="res-name">法师(60金)</span><span class="res-desc">技术+20% 心态恢复-15%</span></div>
              <div class="intro-res"><span class="res-icon">🛡️</span><span class="res-name">坦克(80金)</span><span class="res-desc">精力消耗-20% 技术-10%</span></div>
              <div class="intro-res"><span class="res-icon">🏹</span><span class="res-name">射手(80金)</span><span class="res-desc">金币+30% 沉迷+15%</span></div>
              <div class="intro-res"><span class="res-icon">💚</span><span class="res-name">辅助(100金)</span><span class="res-desc">心态恢复+30% 技术-15%</span></div>
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">七、天赋系统</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;margin-bottom:8px;">
              达到<b>白银/黄金/铂金/钻石/星耀</b>时各解锁一次天赋选择（3选1），永久生效。
            </div>
            <div class="intro-actions-list">
              <div class="intro-act-row"><span class="act-emoji">🥈</span><span class="act-label">白银</span><span class="act-effect">🦉 夜猫子(透支-30%) / 📚 速成天才(训练+20%) / 🛡️ 厚脸皮(败心态-25%)</span></div>
              <div class="intro-act-row"><span class="act-emoji">🥇</span><span class="act-label">黄金</span><span class="act-effect">💪 钢铁意志(精力-15%) / 🤑 招财进宝(金币+25%) / 🧘 心态大师(小憩心态+40%)</span></div>
              <div class="intro-act-row"><span class="act-emoji">💎</span><span class="act-label">铂金</span><span class="act-effect">🎯 关键先生(胜率+5%) / ⚡ 效率达人(行动-1h) / ❤️ 恢复体质(每日精力+10)</span></div>
              <div class="intro-act-row"><span class="act-emoji">💠</span><span class="act-label">钻石</span><span class="act-effect">👑 Carry之王(胜率+8%) / 🧠 防沉迷(沉迷-30%) / 🎰 孤注一掷(奖+40%罚+20%)</span></div>
              <div class="intro-act-row"><span class="act-emoji">🌟</span><span class="act-label">星耀</span><span class="act-effect">🚀 最后冲刺(属性+15%) / 🍀 幸运之星(事件+50%) / 🏃 持久作战(每日+2h)</span></div>
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">八、好友系统</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;">
              每次行动后<b>12%概率</b>遇到新好友（共15位）。可设为<b>双排伙伴</b>，排位时获得胜率/技术/心态/金币加成。每位好友性格各异，有独特对话。
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">九、每日任务</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;">
              每天从<b>37个任务池</b>随机抽取<b>3个任务</b>，覆盖排位/训练/休息/观赛/代练/匹配/商店等。完成后即时获得金币、精力、技术、心态等奖励。
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">十、成就系统</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;">
              共<b>15个成就</b>（初露锋芒、三连胜、五连胜、段位里程碑、小富翁、技术大师、完美一天等），达成条件后自动解锁并获得奖励。
            </div>
          </div>

          <div class="intro-section">
            <div class="intro-section-title">十一、随机事件</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.7;">
              每次行动后<b>40%概率</b>触发随机事件（共25个），按行动类型分类。事件提供多种选项：技术判定对决、花钱购买、闪避判定等，结果影响属性。
            </div>
          </div>

        </div>
        <div class="intro-footer">
          <button class="intro-start-btn">知道了 ✓</button>
        </div>
      </div>
    `;
    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    overlay.querySelector('.intro-start-btn').addEventListener('click', () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    });
  }

  // ========== 天赋选择弹窗 ==========
  showTalentChoice(tier, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay talent-modal';
    overlay.innerHTML = `
      <div class="modal-card talent-card">
        <div class="modal-icon">🌟</div>
        <div class="modal-title">天赋解锁 · ${tier.tier}</div>
        <div class="modal-text">恭喜达到${tier.tier}段位！选择一个天赋加成：</div>
        <div class="talent-choices"></div>
      </div>
    `;
    const choicesEl = overlay.querySelector('.talent-choices');
    for (const choice of tier.choices) {
      const btn = document.createElement('button');
      btn.className = 'talent-choice-btn';
      btn.innerHTML = `
        <span class="tc-icon">${choice.icon}</span>
        <div class="tc-info">
          <span class="tc-name">${choice.name}</span>
          <span class="tc-desc">${choice.desc}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        callback(choice);
      }, { once: true });
      choicesEl.appendChild(btn);
    }
    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  // ========== 好友遇见弹窗 ==========
  showFriendEncounter(friend, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay friend-encounter-modal';
    overlay.innerHTML = `
      <div class="modal-card friend-encounter-card">
        <div class="modal-icon">${friend.icon}</div>
        <div class="modal-title">遇到新朋友！</div>
        <div class="modal-text">${friend.icon} ${friend.name}：「${friend.lines.meet}」</div>
        <div class="fe-info">
          <span class="fe-tag fe-pos">🏆 胜率+${Math.round((friend.bonus.winRateBoost || 0) * 100)}%</span>
          ${friend.bonus.combatBonus ? `<span class="fe-tag fe-pos">🎯 技术+${friend.bonus.combatBonus}</span>` : ''}
          ${friend.bonus.moraleBonus ? `<span class="fe-tag fe-pos">😊 心态+${friend.bonus.moraleBonus}</span>` : ''}
          ${friend.bonus.goldBonus ? `<span class="fe-tag fe-pos">💰 金币+${friend.bonus.goldBonus}</span>` : ''}
          <span class="fe-tag fe-neg">📱 沉迷+${friend.dangerExtra}</span>
        </div>
        <div class="fe-sub">${friend.personality} · ${friend.tier}</div>
        <div class="fe-actions">
          <button class="fe-btn fe-accept">🤝 加好友</button>
          <button class="fe-btn fe-decline">👋 算了</button>
        </div>
      </div>
    `;
    overlay.querySelector('.fe-accept').addEventListener('click', () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      callback(true);
    }, { once: true });
    overlay.querySelector('.fe-decline').addEventListener('click', () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      callback(false);
    }, { once: true });
    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  // ========== 英雄面板 ==========
  showHeroPanel(player, onUnlock, onSelect, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    const panel = document.createElement('div');
    panel.className = 'panel-card hero-panel';
    overlay.appendChild(panel);

    const renderHeroes = () => {
      const currentHero = getHeroById(player.heroId);
      panel.innerHTML = `
        <div class="panel-header">
          <span class="panel-title">🦸 英雄选择</span>
          <span class="panel-sub">当前：${currentHero.icon} ${currentHero.name}</span>
          <button class="panel-close">✕</button>
        </div>
        <div class="panel-body">
          ${HEROES.map(h => {
            const unlocked = player.unlockedHeroes.includes(h.id);
            const active = player.heroId === h.id;
            return `
              <div class="hero-item ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}">
                <span class="hero-icon">${h.icon}</span>
                <div class="hero-info">
                  <span class="hero-name">${h.name}${active ? ' (使用中)' : ''}</span>
                  <span class="hero-desc">${h.desc}</span>
                </div>
                <div class="hero-action">
                  ${!unlocked
                    ? `<button class="hero-btn hero-unlock" data-id="${h.id}" ${player.gold < h.unlockCost ? 'disabled' : ''}>💰${h.unlockCost} 解锁</button>`
                    : active
                      ? `<span class="hero-active-tag">当前</span>`
                      : `<button class="hero-btn hero-select" data-id="${h.id}">选择</button>`}
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
      panel.querySelector('.panel-close').onclick = close;
      panel.querySelectorAll('.hero-unlock').forEach(btn => {
        btn.onclick = () => {
          if (onUnlock(btn.dataset.id)) renderHeroes();
        };
      });
      panel.querySelectorAll('.hero-select').forEach(btn => {
        btn.onclick = () => {
          onSelect(btn.dataset.id);
          renderHeroes();
        };
      });
    };

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      if (onClose) onClose();
    };

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    renderHeroes();
  }

  // ========== 好友面板 ==========
  showFriendPanel(player, onActivate, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    const panel = document.createElement('div');
    panel.className = 'panel-card friend-panel';
    overlay.appendChild(panel);

    const renderFriends = () => {
      panel.innerHTML = `
        <div class="panel-header">
          <span class="panel-title">🤝 好友列表</span>
          <span class="panel-sub">${player.friends.length} 位好友</span>
          <button class="panel-close">✕</button>
        </div>
        <div class="panel-body">
          ${player.friends.length === 0
            ? '<div class="panel-empty">还没有好友，在行动中有几率遇到新朋友~</div>'
            : `
              <div class="friend-item ${!player.activeFriendId ? 'active' : ''}">
                <span class="hero-icon">👤</span>
                <div class="hero-info">
                  <span class="hero-name">单排</span>
                  <span class="hero-desc">独自征战峡谷</span>
                </div>
                <div class="hero-action">
                  ${!player.activeFriendId
                    ? '<span class="hero-active-tag">当前</span>'
                    : '<button class="hero-btn friend-activate" data-id="">选择</button>'}
                </div>
              </div>
              ${player.friends.map(f => {
                const active = player.activeFriendId === f.id;
                return `
                  <div class="friend-item ${active ? 'active' : ''}">
                    <span class="hero-icon">${f.icon}</span>
                    <div class="hero-info">
                      <span class="hero-name">${f.name} <small style="color:var(--text-muted)">${f.personality}·${f.tier}</small></span>
                      <span class="hero-desc">胜率+${Math.round((f.bonus.winRateBoost||0)*100)}% ${f.bonus.combatBonus?'技术+'+f.bonus.combatBonus:''} ${f.bonus.moraleBonus?'心态+'+f.bonus.moraleBonus:''} ${f.bonus.goldBonus?'金币+'+f.bonus.goldBonus:''} 沉迷+${f.dangerExtra}</span>
                    </div>
                    <div class="hero-action">
                      ${active
                        ? '<span class="hero-active-tag">双排中</span>'
                        : `<button class="hero-btn friend-activate" data-id="${f.id}">双排</button>`}
                    </div>
                  </div>`;
              }).join('')}`
          }
        </div>
      `;
      panel.querySelector('.panel-close').onclick = close;
      panel.querySelectorAll('.friend-activate').forEach(btn => {
        btn.onclick = () => {
          onActivate(btn.dataset.id || null);
          renderFriends();
        };
      });
    };

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      if (onClose) onClose();
    };

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    renderFriends();
  }

  // ========== 任务面板 ==========
  showQuestPanel(player, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    const panel = document.createElement('div');
    panel.className = 'panel-card quest-panel';
    overlay.appendChild(panel);

    const quests = player.dailyQuests || [];
    const completed = quests.filter(q => q.completed).length;

    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">📋 每日任务</span>
        <span class="panel-sub">${completed}/${quests.length} 完成</span>
        <button class="panel-close">✕</button>
      </div>
      <div class="panel-body">
        ${quests.length === 0
          ? '<div class="panel-empty">今天没有任务</div>'
          : quests.map(q => {
            const rewardText = Object.entries(q.reward || {}).map(([k, v]) => {
              const labels = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷' };
              return `${labels[k]||k}+${v}`;
            }).join(' ');
            return `
              <div class="quest-item ${q.completed ? 'done' : ''}">
                <span class="quest-icon">${q.icon || '📋'}</span>
                <div class="quest-info">
                  <span class="quest-text">${q.text}</span>
                  <span class="quest-reward">🎁 ${rewardText}</span>
                </div>
                <span class="quest-status">${q.completed ? '✅' : ''}</span>
              </div>`;
          }).join('')}
      </div>
    `;

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      if (onClose) onClose();
    };
    panel.querySelector('.panel-close').onclick = close;

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  // ========== 成就面板 ==========
  showAchievementPanel(player, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    const panel = document.createElement('div');
    panel.className = 'panel-card ach-panel';
    overlay.appendChild(panel);

    const unlocked = player.achievements || [];

    const rewardLabel = (reward) => {
      const labels = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷' };
      return Object.entries(reward || {}).map(([k, v]) => `${labels[k]||k}+${v}`).join(' ');
    };

    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">🏅 成就</span>
        <span class="panel-sub">${unlocked.length}/${ACHIEVEMENTS.length} 解锁</span>
        <button class="panel-close">✕</button>
      </div>
      <div class="panel-body">
        ${ACHIEVEMENTS.map(a => {
          const got = unlocked.includes(a.id);
          return `
            <div class="ach-item ${got ? 'unlocked' : 'locked'}">
              <span class="ach-icon">${a.icon}</span>
              <div class="ach-info">
                <span class="ach-name">${a.name}${got ? ' ✓' : ''}</span>
                <span class="ach-desc">${a.desc}</span>
                <span class="ach-reward">🎁 ${rewardLabel(a.reward)}</span>
              </div>
              ${got ? '<span class="ach-badge">已解锁</span>' : '<span class="ach-badge ach-badge-lock">🔒</span>'}
            </div>`;
        }).join('')}
      </div>
    `;

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
      if (onClose) onClose();
    };
    panel.querySelector('.panel-close').onclick = close;

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  destroy() {
    if (this.root && this.root.parentNode) this.root.remove();
    this.eventModal.destroy();
    this.shopModal.destroy();
  }
}
