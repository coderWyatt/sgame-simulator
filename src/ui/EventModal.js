const STAT_LABELS = { hp: '精力', combat: '技术', morale: '心态', gold: '金币', danger: '沉迷度' };

export class EventModal {
  constructor(container) {
    this.container = container;
    this.overlay = null;
    this.build();
  }

  build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-icon"></div>
        <div class="modal-title"></div>
        <div class="modal-text"></div>
        <div class="modal-effects"></div>
        <div class="modal-choices"></div>
      </div>
    `;
    this.container.appendChild(this.overlay);

    this.els = {
      icon: this.overlay.querySelector('.modal-icon'),
      title: this.overlay.querySelector('.modal-title'),
      text: this.overlay.querySelector('.modal-text'),
      effects: this.overlay.querySelector('.modal-effects'),
      choices: this.overlay.querySelector('.modal-choices'),
    };
  }

  show(data, onDone) {
    this.els.icon.textContent = data.icon || '';
    this.els.title.textContent = data.title || '';
    this.els.text.textContent = data.text || '';

    this.els.effects.innerHTML = '';
    if (data.effects) {
      for (const [k, v] of Object.entries(data.effects)) {
        if (v === 0) continue;
        const tag = document.createElement('span');
        const numVal = Array.isArray(v) ? v[0] : v;
        tag.className = `effect-tag ${numVal > 0 ? (k === 'danger' ? 'negative' : 'positive') : (k === 'danger' ? 'positive' : 'negative')}`;
        const label = STAT_LABELS[k] || k;
        if (Array.isArray(v)) {
          tag.textContent = `${label} +${v[0]}~${v[1]}`;
        } else {
          tag.textContent = `${label} ${v > 0 ? '+' : ''}${v}`;
        }
        this.els.effects.appendChild(tag);
      }
    }

    this.els.choices.innerHTML = '';
    if (data.choices && data.choices.length > 0) {
      for (const c of data.choices) {
        const btn = document.createElement('button');
        btn.className = 'modal-choice-btn';
        btn.innerHTML = `${c.text}${c.hint ? `<span class="choice-hint">${c.hint}</span>` : ''}`;
        btn.addEventListener('click', () => {
          this.hide();
          onDone(c);
        }, { once: true });
        this.els.choices.appendChild(btn);
      }
    } else {
      const btn = document.createElement('button');
      btn.className = 'modal-ok-btn';
      btn.textContent = data.gameOver ? '重新开始' : '继续';
      btn.addEventListener('click', () => {
        this.hide();
        onDone();
      }, { once: true });
      this.els.choices.appendChild(btn);
    }

    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
    });
  }

  hide() {
    this.overlay.classList.remove('visible');
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) this.overlay.remove();
  }
}
