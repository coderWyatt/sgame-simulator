import { RANDOM_EVENTS } from '../data/events.js';

export class EventSystem {
  constructor(player) {
    this.player = player;
    this.recentEvents = [];
  }

  rollEvent() {
    const chance = 0.55;
    if (Math.random() > chance) return null;

    const available = RANDOM_EVENTS.filter(e => !this.recentEvents.includes(e.id));
    if (available.length === 0) {
      this.recentEvents = [];
      return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    this.recentEvents.push(picked.id);
    if (this.recentEvents.length > 4) this.recentEvents.shift();
    return picked;
  }
}
