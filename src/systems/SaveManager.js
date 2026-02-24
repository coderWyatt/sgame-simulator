const AUTO_KEY = 'wz_sim_save';
const SLOT_PREFIX = 'wz_sim_save_slot_';

export class SaveManager {
  save(data) {
    const wrapped = {
      data,
      meta: {
        timestamp: Date.now(),
        day: data.day,
        rankIndex: data.rankIndex,
        name: data.name,
      },
    };
    this._write(AUTO_KEY, wrapped);
  }

  load() {
    const raw = this._read(AUTO_KEY);
    if (!raw) return null;
    if (raw.data) return raw.data;
    return raw;
  }

  hasSave() {
    return !!localStorage.getItem(AUTO_KEY);
  }

  getAutoMeta() {
    const raw = this._read(AUTO_KEY);
    if (!raw) return null;
    if (raw.meta) return raw.meta;
    return { day: raw.day, rankIndex: raw.rankIndex, name: raw.name, timestamp: null };
  }

  clear() {
    localStorage.removeItem(AUTO_KEY);
  }

  saveToSlot(slotId, data) {
    const wrapped = {
      data,
      meta: {
        timestamp: Date.now(),
        day: data.day,
        rankIndex: data.rankIndex,
        name: data.name,
      },
    };
    this._write(SLOT_PREFIX + slotId, wrapped);
  }

  loadFromSlot(slotId) {
    const wrapped = this._read(SLOT_PREFIX + slotId);
    return wrapped ? wrapped.data : null;
  }

  deleteSlot(slotId) {
    localStorage.removeItem(SLOT_PREFIX + slotId);
  }

  getSlotInfo(slotId) {
    const wrapped = this._read(SLOT_PREFIX + slotId);
    return wrapped ? wrapped.meta : null;
  }

  getAllSlots() {
    const autoMeta = this.getAutoMeta();
    const slots = [
      {
        id: 'auto',
        label: '自动存档',
        meta: autoMeta,
      },
    ];
    for (let i = 1; i <= 3; i++) {
      slots.push({
        id: String(i),
        label: `存档 ${i}`,
        meta: this.getSlotInfo(i),
      });
    }
    return slots;
  }

  hasAnySave() {
    if (this.hasSave()) return true;
    for (let i = 1; i <= 3; i++) {
      if (this.getSlotInfo(i)) return true;
    }
    return false;
  }

  _write(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
}
