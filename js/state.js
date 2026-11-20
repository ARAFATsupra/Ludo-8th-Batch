export const state = {
  playerId: null,
  playerName: null,
  playerColor: null,
  playerAvatar: null,
  roomCode: null,
  room: null,
  sequence: 0,
  lastChallengeKey: null,
  lastMessageId: 0,
  unreadChat: 0,
  audio: { mute: false, music: 30, sfx: 70 },
  currentScreen: 'welcome',
  lastDiceId: null,
  lastDiceRolled: false
};

export function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem('ludo-session') || '{}');
    state.playerId = s.playerId || null;
    state.playerName = s.playerName || null;
    state.playerColor = s.playerColor || null;
    state.playerAvatar = s.playerAvatar || null;
    state.roomCode = s.roomCode || null;
    const audio = JSON.parse(localStorage.getItem('ludo-audio') || '{}');
    state.audio = { ...state.audio, ...audio };
  } catch {}
}

export function saveSession() {
  localStorage.setItem('ludo-session', JSON.stringify({
    playerId: state.playerId, playerName: state.playerName,
    playerColor: state.playerColor, playerAvatar: state.playerAvatar,
    roomCode: state.roomCode
  }));
}

export function saveAudio() {
  localStorage.setItem('ludo-audio', JSON.stringify(state.audio));
}

export function clearSession() {
  state.playerId = null;
  state.playerName = null;
  state.playerColor = null;
  state.playerAvatar = null;
  state.roomCode = null;
  state.room = null;
  state.sequence = 0;
  localStorage.removeItem('ludo-session');
}

export function reconcileRoom(newRoom) {
  if (!newRoom) return false;
  if (newRoom.sequence < state.sequence) return false;
  state.sequence = newRoom.sequence;
  state.room = newRoom;
  return true;
}

export function getMyPlayer() {
  if (!state.room || !state.playerId) return null;
  return state.room.players.find(p => p.id === state.playerId);
}