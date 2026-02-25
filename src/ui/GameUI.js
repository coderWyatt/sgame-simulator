import { EventModal } from './EventModal.js';
import { ShopModal } from './ShopModal.js';
import { getActionCost } from '../systems/ActionSystem.js';
import { getRankByIndex } from '../data/ranks.js';

const STAT_DEFS = [
  { key: 'hp',      icon: '⚡', label: '精力', max: 'maxHp', cls: 'hp' },
  { key: 'combat',  icon: '🎯', label: '技术', max: 200,     cls: 'combat' },
  { key: 'morale',  icon: '😊', label: '心态', max: 100,     cls: 'morale' },
  { key: 'gold',    icon: '💰', label: '金币', max: 9999,    cls: 'gold' },
  { key: 'danger',  icon: '📱', label: '沉迷', max: 100,     cls: 'danger' },
];

const ACTIONS = [
  { id: 'shop',      icon: '🛒', name: '商店', desc: '花金币购买道具，恢复状态', tags: [
    { text: '不消耗时间', cls: 'neu' },
  ], fullWidth: true },
  { id: 'challenge', icon: '🏆', name: '排位', desc: '胜率取决于技术是否匹配段位', tags: [
    { text: '精力-(8~24)', cls: 'neg' }, { text: '沉迷+(3~6)', cls: 'neg' },
    { text: '胜：升段 金币+(15~34)', cls: 'pos' },
    { text: '败：掉段 心态-(8~15)', cls: 'neg' },
  ]},
  { id: 'boost',     icon: '💼', name: '代练', desc: '帮别人打排位赚金币', tags: [
    { text: '金币+(30~50)', cls: 'pos' }, { text: '沉迷+(8~13)', cls: 'neg' }, { text: '精力-(5~10)', cls: 'neg' },
  ]},
  { id: 'train',     icon: '🎯', name: '训练', desc: '消耗金币换技术提升', tags: [
    { text: '技术+(5~12)', cls: 'pos' }, { text: '金币-15', cls: 'neg' },
  ]},
  { id: 'explore',   icon: '📺', name: '观赛', desc: '看比赛学习，可能触发事件', tags: [
    { text: '技术+(3~7)', cls: 'pos' }, { text: '沉迷+(5~10)', cls: 'neg' },
  ]},
  { id: 'rest',      icon: '☕', name: '小憩', desc: '恢复身心，降低沉迷', tags: [
    { text: '精力+(10~17)', cls: 'pos' }, { text: '心态+(5~9)', cls: 'pos' }, { text: '沉迷-(5~8)', cls: 'pos' },
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
      <div class="sim-topbar">
        <span class="topbar-accent"></span>
        <span class="topbar-logo">🎮</span>
        <span class="topbar-title">排位模拟器</span>
        <span class="topbar-dot">·</span>
        <span class="topbar-sub">RANK SIMULATOR</span>
        <span class="topbar-ver">v1.0</span>
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
        <button class="bottom-btn save-btn">💾 存档</button>
        <button class="bottom-btn rules-btn">📖 规则</button>
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

    this.buildStatBars();
    this.buildActions();
  }

  buildStatBars() {
    this.statEls = {};
    this.els.stats.innerHTML = '<div class="stats-header"><span class="stats-title">📊 召唤师状态</span><span class="stats-rank-badge"></span></div>';
    this.rankBadge = this.els.stats.querySelector('.stats-rank-badge');
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

  buildActions() {
    this.actionBtns = {};
    this.els.actions.innerHTML = '';
    for (const a of ACTIONS) {
      const cost = getActionCost(a.id);
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
    const escaped = (scene.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    this.els.sceneText.innerHTML = escaped.replace(/\n/g, '<br>');
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
                30天内<br>段位晋升至「👑 王者」
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
              <div class="intro-res"><span class="res-icon">😴</span><span class="res-name">不透支</span><span class="res-desc">精力+15 心态+5</span></div>
              <div class="intro-res"><span class="res-icon">🥱</span><span class="res-name">透支1~2h</span><span class="res-desc">精力-5 技术-1</span></div>
              <div class="intro-res"><span class="res-icon">😵</span><span class="res-name">透支3~5h</span><span class="res-desc">精力-10 技术-3</span></div>
              <div class="intro-res"><span class="res-icon">💀</span><span class="res-name">透支≥6h</span><span class="res-desc">精力-20 技术-5</span></div>
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
            <div class="intro-section-title">四、每日行动</div>
            <div class="intro-actions-list">
              <div class="intro-act-row"><span class="act-emoji">🏆</span><span class="act-label">排位</span><span class="act-effect">3h · 胜→金币15~34 / 败→精力-15~24 心态-8~15 · 沉迷+3~6</span></div>
              <div class="intro-act-row"><span class="act-emoji">🎯</span><span class="act-label">训练</span><span class="act-effect">2h · 技术+5~12 · 金币-15</span></div>
              <div class="intro-act-row"><span class="act-emoji">📺</span><span class="act-label">观赛</span><span class="act-effect">2h · 技术+3~7 · 沉迷+5~10 · 触发随机事件</span></div>
              <div class="intro-act-row"><span class="act-emoji">💼</span><span class="act-label">代练</span><span class="act-effect">2h · 金币+30~50 · 沉迷+8~13 · 精力-5~10</span></div>
              <div class="intro-act-row"><span class="act-emoji">🎮</span><span class="act-label">匹配</span><span class="act-effect">1h · 技术+3~5 · 心态+3 · 沉迷+2~4（白银解锁）</span></div>
              <div class="intro-act-row"><span class="act-emoji">☕</span><span class="act-label">小憩</span><span class="act-effect">1h · 精力+10~17 · 心态+5~9 · 沉迷-5~8</span></div>
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

  destroy() {
    if (this.root && this.root.parentNode) this.root.remove();
    this.eventModal.destroy();
    this.shopModal.destroy();
  }
}
