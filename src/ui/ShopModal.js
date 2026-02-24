import { SHOP_ITEMS } from '../data/shop.js';

export class ShopModal {
  constructor(container) {
    this.container = container;
    this.overlay = null;
    this.build();
  }

  build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `<div class="modal-card"><div class="modal-icon">🛒</div><div class="modal-title">商店</div><div class="shop-list"></div><button class="modal-ok-btn shop-close-btn">离开商店</button></div>`;
    this.container.appendChild(this.overlay);
    this.listEl = this.overlay.querySelector('.shop-list');
    this.closeBtn = this.overlay.querySelector('.shop-close-btn');
  }

  show(player, onBuy, onClose) {
    this.listEl.innerHTML = '';

    for (const item of SHOP_ITEMS) {
      const el = document.createElement('div');
      el.className = 'shop-item';
      el.innerHTML = `
        <span class="item-icon">${item.icon}</span>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
        </div>
        <button class="buy-btn" ${player.gold < item.price ? 'disabled' : ''}>💰${item.price}</button>
      `;
      const buyBtn = el.querySelector('.buy-btn');
      buyBtn.addEventListener('click', () => {
        const success = onBuy(item);
        if (success) {
          this.refreshPrices(player);
        }
      });
      this.listEl.appendChild(el);
    }

    const handler = () => {
      this.hide();
      onClose();
    };
    this.closeBtn.addEventListener('click', handler, { once: true });

    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
    });
  }

  refreshPrices(player) {
    const btns = this.listEl.querySelectorAll('.buy-btn');
    SHOP_ITEMS.forEach((item, i) => {
      if (btns[i]) {
        btns[i].disabled = player.gold < item.price;
      }
    });
  }

  hide() {
    this.overlay.classList.remove('visible');
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
  }
}
