import { EventModal } from './EventModal.js';
import { ShopModal } from './ShopModal.js';
import { getActionCost } from '../systems/ActionSystem.js';

const STAT_DEFS = [
  { key: 'hp',      icon: '⚡', label: '精力', max: 'maxHp', cls: 'hp' },
  { key: 'combat',  icon: '🎯', label: '技术', max: 200,     cls: 'combat' },
  { key: 'morale',  icon: '😊', label: '心态', max: 100,     cls: 'morale' },
  { key: 'gold',    icon: '💰', label: '金币', max: 9999,    cls: 'gold' },
  { key: 'danger',  icon: '📱', label: '沉迷', max: 100,     cls: 'danger' },
];

const ACTIONS = [
  { id: 'train',     icon: '🎯', name: '训练', desc: '消耗金币换技术提升', tags: [
    { text: '技术+(5~12)', cls: 'pos' }, { text: '金币-15', cls: 'neg' },
  ]},
  { id: 'explore',   icon: '📺', name: '观赛', desc: '看比赛学习，可能触发事件', tags: [
    { text: '技术+(3~7)', cls: 'pos' }, { text: '沉迷+(5~10)', cls: 'neg' },
  ]},
  { id: 'challenge', icon: '🏆', name: '排位', desc: '胜率取决于技术是否匹配段位', tags: [
    { text: '沉迷+(3~6)', cls: 'neg' },
    { text: '胜：升段 金币+(15~34) 精力-(8~12)', cls: 'pos' },
    { text: '败：掉段 精力-(15~24) 心态-(8~15)', cls: 'neg' },
  ]},
  { id: 'rest',      icon: '☕', name: '小憩', desc: '恢复身心，降低沉迷', tags: [
    { text: '精力+(10~17)', cls: 'pos' }, { text: '心态+(5~9)', cls: 'pos' }, { text: '沉迷-(5~8)', cls: 'pos' },
  ]},
  { id: 'boost',     icon: '💼', name: '代练', desc: '帮别人打排位赚金币', tags: [
    { text: '金币+(30~50)', cls: 'pos' }, { text: '沉迷+(8~13)', cls: 'neg' }, { text: '精力-(5~10)', cls: 'neg' },
  ]},
  { id: 'shop',      icon: '🛒', name: '商店', desc: '花金币购买道具', tags: [
    { text: '不消耗时间', cls: 'neu' },
  ]},
  { id: 'spar',      icon: '🎮', name: '匹配', desc: '低压力练习，白银解锁', tags: [
    { text: '技术+(3~5)', cls: 'pos' }, { text: '心态+3', cls: 'pos' }, { text: '沉迷+(2~4)', cls: 'neg' },
  ]},
];

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
      <div class="sim-header">
        <div class="hero-info">
          <span class="hero-emoji"></span>
          <span class="hero-name"></span>
          <span class="rank-badge"></span>
        </div>
        <span class="turn-info"></span>
      </div>
      <div class="time-bar-section">
        <div class="time-bar-head">
          <span class="time-bar-label">🕐 今日剩余行动时间</span>
          <span class="time-bar-val"></span>
        </div>
        <div class="time-bar-track"><div class="time-bar-fill"></div></div>
      </div>
      <div class="sim-stats"></div>
      <div class="sim-scroll">
        <div class="scene-card"><div class="scene-title"></div><div class="scene-text"></div></div>
        <div class="sim-actions"></div>
        <div class="sleep-btn-wrap"></div>
        <div class="sim-log-section">
          <div class="sim-log-header">
            <span class="log-header-icon">📋</span>
            <span class="log-header-title">操作记录</span>
            <span class="log-header-count"></span>
          </div>
          <div class="sim-log"></div>
        </div>
      </div>
    `;

    this.container.appendChild(this.root);

    this.els.heroEmoji  = this.root.querySelector('.hero-emoji');
    this.els.heroName   = this.root.querySelector('.hero-name');
    this.els.rankBadge  = this.root.querySelector('.rank-badge');
    this.els.turnInfo   = this.root.querySelector('.turn-info');
    this.els.stats      = this.root.querySelector('.sim-stats');
    this.els.sceneTitle = this.root.querySelector('.scene-title');
    this.els.sceneText  = this.root.querySelector('.scene-text');
    this.els.actions    = this.root.querySelector('.sim-actions');
    this.els.log        = this.root.querySelector('.sim-log');
    this.els.logCount   = this.root.querySelector('.log-header-count');
    this.els.scroll     = this.root.querySelector('.sim-scroll');
    this.els.sleepWrap  = this.root.querySelector('.sleep-btn-wrap');
    this.els.timeBarVal  = this.root.querySelector('.time-bar-val');
    this.els.timeBarFill = this.root.querySelector('.time-bar-fill');

    this.buildStatBars();
    this.buildActions();
    this.buildSleepBtn();
  }

  buildStatBars() {
    this.statEls = {};
    this.els.stats.innerHTML = '';
    for (const s of STAT_DEFS) {
      const row = document.createElement('div');
      row.className = 'stat-row';
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

  buildActions() {
    this.actionBtns = {};
    this.els.actions.innerHTML = '';
    for (const a of ACTIONS) {
      const cost = getActionCost(a.id);
      const btn = document.createElement('button');
      btn.className = 'action-card';
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

  buildSleepBtn() {
    const btn = document.createElement('button');
    btn.className = 'sleep-btn';
    btn.innerHTML = '🌙 睡觉（结束今天）';
    btn.addEventListener('click', () => this.onAction('sleep'));
    this.els.sleepWrap.appendChild(btn);
    this.sleepBtn = btn;
  }

  show() { this.root.classList.add('visible'); }
  hide() { this.root.classList.remove('visible'); }

  refresh(player) {
    const rank = player.getRank();
    this.els.heroEmoji.textContent = player.emoji;
    this.els.heroName.textContent = player.name;
    this.els.rankBadge.textContent = `${rank.emoji} ${rank.name}`;
    this.els.turnInfo.textContent = `第${player.day}/${player.maxDays}天`;

    const overtime = player.getOvertimeHours();
    if (overtime > 0) {
      this.els.timeBarVal.textContent = `透支 ${overtime}h`;
      this.els.timeBarVal.classList.add('overtime');
      this.els.timeBarFill.style.width = '0%';
      this.els.timeBarFill.classList.add('low');
    } else {
      const timePct = Math.min(100, (player.timeLeft / player.baseTime) * 100);
      this.els.timeBarVal.textContent = `${player.timeLeft}h / ${player.baseTime}h`;
      this.els.timeBarVal.classList.remove('overtime');
      this.els.timeBarFill.style.width = timePct + '%';
      this.els.timeBarFill.classList.toggle('low', player.timeLeft <= 2);
    }

    for (const s of STAT_DEFS) {
      const val = player[s.key] || 0;
      const maxVal = typeof s.max === 'string' ? (player[s.max] || 100) : s.max;
      const pct = Math.min(100, (val / maxVal) * 100);
      this.statEls[s.key].fill.style.width = pct + '%';
      const maxLabel = typeof s.max === 'number' ? `<span class="stat-max">/${s.max}</span>` : '';
      this.statEls[s.key].num.innerHTML = `${val}${maxLabel}`;
    }

    for (const a of ACTIONS) {
      const { btn, cost } = this.actionBtns[a.id];
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
    this.els.sceneText.textContent = scene.text || '';
  }

  addLog(type, text) {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `· ${text}`;
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

  destroy() {
    if (this.root && this.root.parentNode) this.root.remove();
    this.eventModal.destroy();
    this.shopModal.destroy();
  }
}
