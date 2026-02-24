import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager.js';
import { getRankByIndex } from '../data/ranks.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.saveManager = new SaveManager();
    this.createMenuDOM();
  }

  createMenuDOM() {
    const hasSave = this.saveManager.hasAnySave();
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.className = 'menu-overlay';
    this.menuOverlay.innerHTML = `
      <div class="menu-title-emoji">🎮</div>
      <div class="menu-title">王者荣耀</div>
      <div class="menu-subtitle">排位模拟器</div>
      <button class="menu-btn" id="btn-new-game">🏆 开始新游戏</button>
      <button class="menu-btn" id="btn-continue" ${hasSave ? '' : 'disabled'}>📖 继续游戏</button>
    `;
    document.getElementById('game-container').appendChild(this.menuOverlay);

    this.menuOverlay.querySelector('#btn-new-game').addEventListener('click', () => this.showNameInput());
    this.menuOverlay.querySelector('#btn-continue').addEventListener('click', () => this.showLoadPanel());
  }

  showLoadPanel() {
    this.loadOverlay = document.createElement('div');
    this.loadOverlay.className = 'name-overlay';

    const slots = this.saveManager.getAllSlots().filter(s => s.meta);

    if (slots.length === 1 && slots[0].id === 'auto') {
      this.startGame(true, 'auto');
      return;
    }

    const slotCards = slots.map(s => {
      const rank = getRankByIndex(s.meta.rankIndex);
      const timeStr = s.meta.timestamp ? new Date(s.meta.timestamp).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
      const isAuto = s.id === 'auto';
      const displayLabel = isAuto ? `自动·第${s.meta.day}天` : s.label;
      return `
        <button class="menu-load-slot" data-id="${s.id}">
          <span class="mls-label">${displayLabel}</span>
          <span class="mls-info">${s.meta.name || '召唤师'} · 第${s.meta.day}天 · ${rank.emoji} ${rank.name}</span>
          <span class="mls-time">${timeStr}</span>
        </button>`;
    }).join('');

    this.loadOverlay.innerHTML = `
      <div class="name-card" style="max-width:340px;">
        <div class="name-card-emoji">📂</div>
        <div class="name-card-title">选择存档</div>
        <div class="menu-load-list">${slotCards}</div>
        <button class="name-confirm-btn menu-load-back">← 返回</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.loadOverlay);
    requestAnimationFrame(() => this.loadOverlay.classList.add('visible'));

    this.loadOverlay.querySelectorAll('.menu-load-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        this.loadOverlay.classList.remove('visible');
        setTimeout(() => {
          this.loadOverlay.remove();
          this.startGame(true, btn.dataset.id);
        }, 300);
      });
    });

    this.loadOverlay.querySelector('.menu-load-back').addEventListener('click', () => {
      this.loadOverlay.classList.remove('visible');
      setTimeout(() => this.loadOverlay.remove(), 300);
    });
  }

  showNameInput() {
    this.nameOverlay = document.createElement('div');
    this.nameOverlay.className = 'name-overlay';
    this.nameOverlay.innerHTML = `
      <div class="name-card">
        <div class="name-card-emoji">⚔️</div>
        <div class="name-card-title">创建你的召唤师</div>
        <div class="name-card-sub">请输入你的ID</div>
        <div class="name-input-row">
          <div class="name-input-wrap">
            <span class="name-input-prefix">召唤师</span>
            <input type="text" class="name-input" maxlength="12" placeholder="输入ID..." autocomplete="off" />
          </div>
          <button class="name-random-btn" title="随机取名">🎲</button>
        </div>
        <div class="name-input-hint">2~12个字符，支持中英文和数字</div>
        <button class="name-confirm-btn" disabled>开始冲王者 →</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.nameOverlay);
    requestAnimationFrame(() => this.nameOverlay.classList.add('visible'));

    const input = this.nameOverlay.querySelector('.name-input');
    const btn = this.nameOverlay.querySelector('.name-confirm-btn');
    const randomBtn = this.nameOverlay.querySelector('.name-random-btn');

    input.addEventListener('input', () => {
      const val = input.value.trim();
      btn.disabled = val.length < 2;
    });

    randomBtn.addEventListener('click', () => {
      input.value = this.getRandomName();
      input.dispatchEvent(new Event('input'));
      randomBtn.classList.add('spin');
      setTimeout(() => randomBtn.classList.remove('spin'), 400);
    });

    const confirm = () => {
      const val = input.value.trim();
      if (val.length < 2) return;
      this.playerName = val;
      this.nameOverlay.classList.remove('visible');
      setTimeout(() => {
        this.nameOverlay.remove();
        this.showIntro();
      }, 300);
    };

    btn.addEventListener('click', confirm);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
    });

    setTimeout(() => input.focus(), 350);
  }

  showIntro() {
    this.introOverlay = document.createElement('div');
    this.introOverlay.className = 'intro-overlay';
    this.introOverlay.innerHTML = `
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
          <button class="intro-start-btn">我已阅读，开始冲分 →</button>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.introOverlay);

    requestAnimationFrame(() => this.introOverlay.classList.add('visible'));

    this.introOverlay.querySelector('.intro-start-btn').addEventListener('click', () => {
      this.introOverlay.classList.remove('visible');
      setTimeout(() => {
        this.introOverlay.remove();
        this.startGame(false);
      }, 300);
    });
  }

  getRandomName() {
    const prefixes = [
      '峡谷', '暴走', '无敌', '超神', '王者', '荣耀', '暗影', '疾风', '星辰',
      '绝世', '龙魂', '烈焰', '冰封', '天命', '至尊', '孤影', '逆风', '破晓',
      '月下', '深渊', '风暴', '铁血', '狂战', '寒冰', '追风',
    ];
    const suffixes = [
      '剑客', '射手', '法王', '战神', '刺客', '大佬', '猎手', '守护',
      '少年', '高手', '小白', '菜鸟', '奶爸', '萌新', '老六', '打野王',
      '上分人', '躺赢哥', '翻盘王', '带飞侠', '补刀怪', '走位秀',
    ];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.random() < 0.4 ? Math.floor(Math.random() * 100) : '';
    return `${p}${s}${num}`;
  }

  startGame(isContinue, slotId) {
    this.cleanupDOM();
    this.scene.start('GameScene', { continue: isContinue, playerName: this.playerName || '', slotId: slotId || 'auto' });
  }

  cleanupDOM() {
    if (this.menuOverlay) this.menuOverlay.remove();
    if (this.introOverlay) this.introOverlay.remove();
    if (this.nameOverlay) this.nameOverlay.remove();
  }

  shutdown() {
    this.cleanupDOM();
  }
}
