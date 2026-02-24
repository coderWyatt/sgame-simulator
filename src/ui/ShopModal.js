import { SHOP_CATEGORIES } from '../data/shop.js';

const STAT_LABELS = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷度' };

export class ShopModal {
  constructor(container) {
    this.container = container;
    this.overlay = null;
    this.activeCategory = 0;
    this.scrollLock = false;
    this.onClose = null;
    this.build();
  }

  build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay shop-overlay';

    const catTabs = SHOP_CATEGORIES.map((c, i) =>
      `<button class="shop-cat-tab${i === 0 ? ' active' : ''}" data-idx="${i}">
        <span class="cat-icon">${c.icon}</span>
        <span class="cat-name">${c.name}</span>
      </button>`
    ).join('');

    this.overlay.innerHTML = `
      <div class="shop-panel">
        <div class="shop-header">
          <span class="shop-title">🛒 商店</span>
          <span class="shop-gold-display">💰 <span class="shop-gold-val">0</span></span>
          <button class="shop-close-x">✕</button>
        </div>
        <div class="shop-body">
          <div class="shop-sidebar">${catTabs}</div>
          <div class="shop-items-scroll"></div>
        </div>
      </div>
      <div class="shop-result-overlay"></div>
    `;

    this.container.appendChild(this.overlay);

    this.goldVal = this.overlay.querySelector('.shop-gold-val');
    this.sidebar = this.overlay.querySelector('.shop-sidebar');
    this.itemsScroll = this.overlay.querySelector('.shop-items-scroll');
    this.closeX = this.overlay.querySelector('.shop-close-x');
    this.catTabs = this.overlay.querySelectorAll('.shop-cat-tab');
    this.resultOverlay = this.overlay.querySelector('.shop-result-overlay');
  }

  show(player, onBuy, onClose) {
    this.player = player;
    this.onBuy = onBuy;
    this.onClose = onClose;
    this.goldVal.textContent = player.gold;
    this.activeCategory = 0;
    this.scrollLock = false;

    this.renderItems();
    this.setActiveTab(0);

    this.catTabs.forEach((tab, i) => {
      tab.onclick = () => {
        this.setActiveTab(i);
        this.scrollToCategory(i);
      };
    });

    this.itemsScroll.onscroll = () => {
      if (this.scrollLock) return;
      this.syncTabFromScroll();
    };

    this.closeX.onclick = () => {
      this.hide();
      this.onClose();
    };

    requestAnimationFrame(() => this.overlay.classList.add('visible'));
  }

  renderItems() {
    this.itemsScroll.innerHTML = '';
    this.sectionEls = [];

    for (const cat of SHOP_CATEGORIES) {
      const section = document.createElement('div');
      section.className = 'shop-section';
      section.dataset.catId = cat.id;

      const header = document.createElement('div');
      header.className = 'shop-section-header';
      header.innerHTML = `<span class="section-icon">${cat.icon}</span><span class="section-name">${cat.name}</span><span class="section-count">${cat.items.length}件</span>`;
      section.appendChild(header);

      for (const item of cat.items) {
        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
          <span class="item-icon">${item.icon}</span>
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.desc}</div>
          </div>
          <button class="buy-btn" ${this.player.gold < item.price ? 'disabled' : ''}>💰${item.price}</button>
        `;
        el.querySelector('.buy-btn').addEventListener('click', () => {
          const result = this.onBuy(item);
          if (result) {
            this.goldVal.textContent = this.player.gold;
            this.refreshPrices();
            this.showBuyResult(result);
          } else {
            this.showBuyResult({ item, changes: {}, failed: true });
          }
        });
        section.appendChild(el);
      }

      this.itemsScroll.appendChild(section);
      this.sectionEls.push(section);
    }
  }

  setActiveTab(idx) {
    this.activeCategory = idx;
    this.catTabs.forEach((t, i) => t.classList.toggle('active', i === idx));
    const activeTab = this.catTabs[idx];
    if (activeTab) {
      activeTab.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  scrollToCategory(idx) {
    const section = this.sectionEls[idx];
    if (!section) return;
    this.scrollLock = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { this.scrollLock = false; }, 500);
  }

  syncTabFromScroll() {
    const scrollTop = this.itemsScroll.scrollTop;
    const offset = 8;
    let active = 0;
    for (let i = 0; i < this.sectionEls.length; i++) {
      if (this.sectionEls[i].offsetTop - this.itemsScroll.offsetTop <= scrollTop + offset) {
        active = i;
      }
    }
    if (active !== this.activeCategory) {
      this.setActiveTab(active);
    }
  }

  refreshPrices() {
    const btns = this.itemsScroll.querySelectorAll('.buy-btn');
    let idx = 0;
    for (const cat of SHOP_CATEGORIES) {
      for (const item of cat.items) {
        if (btns[idx]) btns[idx].disabled = this.player.gold < item.price;
        idx++;
      }
    }
  }

  showBuyResult(result) {
    const { item, changes, lottery, lotteryType, failed } = result;

    let icon, title, colorClass;
    if (failed) {
      icon = '❌';
      title = '金币不足';
      colorClass = 'result-bad';
    } else if (lottery) {
      icon = '🎰';
      title = item.name;
      colorClass = lotteryType === 'good' ? 'result-good' : lotteryType === 'bad' ? 'result-bad' : 'result-info';
    } else {
      icon = item.icon;
      title = `购买成功：${item.name}`;
      colorClass = 'result-good';
    }

    let changeTags = '';
    if (!failed && changes) {
      changeTags = Object.entries(changes)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => {
          const label = STAT_LABELS[k] || k;
          const isPositive = k === 'danger' ? v < 0 : v > 0;
          return `<span class="sr-tag ${isPositive ? 'pos' : 'neg'}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
        }).join('');
    }

    const failedText = failed ? `<div class="sr-sub">买不起 ${item.icon} ${item.name}（需要 💰${item.price}）</div>` : '';

    this.resultOverlay.innerHTML = `
      <div class="shop-result-card ${colorClass}">
        <div class="sr-icon">${icon}</div>
        <div class="sr-title">${title}</div>
        ${failedText}
        ${changeTags ? `<div class="sr-tags">${changeTags}</div>` : ''}
        <div class="sr-gold">当前金币：💰 ${this.player.gold}</div>
        <div class="sr-actions">
          <button class="sr-btn sr-continue">🛒 继续购物</button>
          <button class="sr-btn sr-exit">🚪 离开商店</button>
        </div>
      </div>
    `;

    this.resultOverlay.classList.add('visible');

    this.resultOverlay.querySelector('.sr-continue').onclick = () => {
      this.resultOverlay.classList.remove('visible');
    };
    this.resultOverlay.querySelector('.sr-exit').onclick = () => {
      this.resultOverlay.classList.remove('visible');
      this.hide();
      if (this.onClose) this.onClose();
    };
  }

  hide() {
    this.overlay.classList.remove('visible');
    this.resultOverlay.classList.remove('visible');
    this.resultOverlay.innerHTML = '';
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
  }
}
