export const RANKS = [
  { id: 'bronze_3',   name: '青铜III', tier: '青铜', sub: 3, emoji: '🥉' },
  { id: 'bronze_2',   name: '青铜II',  tier: '青铜', sub: 2, emoji: '🥉' },
  { id: 'bronze_1',   name: '青铜I',   tier: '青铜', sub: 1, emoji: '🥉' },
  { id: 'silver_3',   name: '白银III', tier: '白银', sub: 3, emoji: '🥈' },
  { id: 'silver_2',   name: '白银II',  tier: '白银', sub: 2, emoji: '🥈' },
  { id: 'silver_1',   name: '白银I',   tier: '白银', sub: 1, emoji: '🥈' },
  { id: 'gold_3',     name: '黄金III', tier: '黄金', sub: 3, emoji: '🥇' },
  { id: 'gold_2',     name: '黄金II',  tier: '黄金', sub: 2, emoji: '🥇' },
  { id: 'gold_1',     name: '黄金I',   tier: '黄金', sub: 1, emoji: '🥇' },
  { id: 'plat_3',     name: '铂金III', tier: '铂金', sub: 3, emoji: '💎' },
  { id: 'plat_2',     name: '铂金II',  tier: '铂金', sub: 2, emoji: '💎' },
  { id: 'plat_1',     name: '铂金I',   tier: '铂金', sub: 1, emoji: '💎' },
  { id: 'diamond_3',  name: '钻石III', tier: '钻石', sub: 3, emoji: '💠' },
  { id: 'diamond_2',  name: '钻石II',  tier: '钻石', sub: 2, emoji: '💠' },
  { id: 'diamond_1',  name: '钻石I',   tier: '钻石', sub: 1, emoji: '💠' },
  { id: 'star_3',     name: '星耀III', tier: '星耀', sub: 3, emoji: '🌟' },
  { id: 'star_2',     name: '星耀II',  tier: '星耀', sub: 2, emoji: '🌟' },
  { id: 'star_1',     name: '星耀I',   tier: '星耀', sub: 1, emoji: '🌟' },
  { id: 'king',       name: '王者',    tier: '王者', sub: 0, emoji: '👑' },
];

export function getRankByIndex(idx) {
  return RANKS[Math.min(Math.max(0, idx), RANKS.length - 1)];
}
