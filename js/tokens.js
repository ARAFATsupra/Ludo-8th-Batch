// helper — token utility functions used by board and turns
import { CONFIG } from './config.js';

export function tokenPosToCell(player, pos) {
  if (pos < 0 || pos >= CONFIG.TRACK_LENGTH) return -1;
  return (player.index * 4 + pos) % CONFIG.TRACK_LENGTH;
}

export function isSafeProgress(progress) {
  return progress === 0 || (progress >= 108 && progress <= 111);
}

export function tokensAtCell(room, cell) {
  const result = [];
  for (const p of room.players) {
    const tokens = room.tokens[p.id] || [];
    tokens.forEach((t, idx) => {
      if (t.pos < 0 || t.pos >= 112) return;
      const c = tokenPosToCell(p, t.pos);
      if (c === cell) result.push({ playerId: p.id, playerIndex: p.index, tokenIndex: idx, player: p });
    });
  }
  return result;
}