import { CONFIG } from './_config.js';

export function getPlayerOffset(player) {
  return (player.index || 0) * 4;
}

export function tokenCell(player, pos) {
  if (pos < 0 || pos >= 112) return -1;
  return (getPlayerOffset(player) + pos) % 112;
}

export function isSafeProgress(progress) {
  return progress === 0 || (progress >= 108 && progress <= 111);
}

export function computeMoveableTokens(room, player, total) {
  const tokens = room.tokens[player.id] || [];
  const moveable = [];
  const isSeven = total === 7;
  const isDouble = room.dice?.isDouble;

  tokens.forEach((t, idx) => {
    if (t.pos < 0) {
      if (isSeven || isDouble) moveable.push(idx);
    } else if (t.pos >= CONFIG.GOAL_PROGRESS) {
      // already at goal
    } else if (t.pos + total <= CONFIG.GOAL_PROGRESS) {
      moveable.push(idx);
    }
  });
  return moveable;
}

export function advanceTurn(room) {
  if (room.status !== 'playing') return;
  const n = room.players.length;
  if (n === 0) return;

  const currentIdx = room.currentTurn ? room.currentTurn.playerIndex : -1;
  const anyOnline = room.players.some(p => Date.now() - p.lastSeen <= CONFIG.OFFLINE_TIMEOUT_MS);

  for (let i = 1; i <= n; i++) {
    const nextIdx = (currentIdx + i) % n;
    const nextPlayer = room.players[nextIdx];
    if (!anyOnline || Date.now() - nextPlayer.lastSeen <= CONFIG.OFFLINE_TIMEOUT_MS) {
      room.currentTurn = {
        playerId: nextPlayer.id,
        playerIndex: nextIdx,
        startedAt: Date.now()
      };
      room.dice = null;
      room.turnNumber = (room.turnNumber || 0) + 1;
      return;
    }
  }
  // Everyone offline — fall back to next index
  const nextIdx = (currentIdx + 1) % n;
  room.currentTurn = {
    playerId: room.players[nextIdx].id,
    playerIndex: nextIdx,
    startedAt: Date.now()
  };
  room.dice = null;
}

export function resetDiceForExtraRoll(room) {
  room.dice = null;
  if (room.currentTurn) room.currentTurn.startedAt = Date.now();
}

export function isWinner(room, player) {
  const tokens = room.tokens[player.id] || [];
  return tokens.every(t => t.pos >= CONFIG.GOAL_PROGRESS);
}

export function resolveChallenge(room, action) {
  room.activeChallenge = null;
  const pending = room.pendingTurnResult;
  room.pendingTurnResult = null;
  if (pending) {
    if (pending.wasDouble) resetDiceForExtraRoll(room);
    else advanceTurn(room);
  }
  return room;
}