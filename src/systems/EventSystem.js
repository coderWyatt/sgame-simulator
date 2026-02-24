import { RANDOM_EVENTS } from '../data/events.js';

export class EventSystem {
  constructor(player) {
    this.player = player;
    this.recentEvents = [];
  }

  rollEvent(actionId) {
    if (Math.random() > 0.4) return null;

    const available = RANDOM_EVENTS.filter(e => {
      if (this.recentEvents.includes(e.id)) return false;
      if (e.triggerOn) return e.triggerOn.includes(actionId);
      return true;
    });

    if (available.length === 0) {
      this.recentEvents = [];
      const fallback = RANDOM_EVENTS.filter(e => {
        if (e.triggerOn) return e.triggerOn.includes(actionId);
        return true;
      });
      if (fallback.length === 0) return null;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    this.recentEvents.push(picked.id);
    if (this.recentEvents.length > 6) this.recentEvents.shift();
    return picked;
  }
}
