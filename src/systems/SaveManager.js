const SAVE_KEY = 'wz_sim_save';

export class SaveManager {
  save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }
}
