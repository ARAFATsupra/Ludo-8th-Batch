import { state, saveSession } from './state.js';

export function ensurePlayerId() {
  if (state.playerId) return state.playerId;
  let id;
  try { id = crypto.randomUUID(); } catch { id = 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  state.playerId = id;
  saveSession();
  return id;
}

export function setPlayerInfo(name, color, avatar) {
  state.playerName = name;
  state.playerColor = color;
  state.playerAvatar = avatar;
  saveSession();
}