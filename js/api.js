import { state } from './state.js';

const BASE = '/.netlify/functions';

async function request(path, body, method = 'POST') {
  const headers = { 'Content-Type': 'application/json' };
  // Use lowercase header name — Netlify normalises all headers to lowercase
  if (state.playerId) headers['x-player-id'] = state.playerId;
  const opts = { method, headers };
  if (method === 'POST') opts.body = JSON.stringify(body || {});
  try {
    const res = await fetch(`${BASE}/${path}`, opts);
    const json = await res.json();
    if (json.error) throw new Error(json.message || 'Request failed');
    return json.data;
  } catch (err) {
    throw new Error(err.message || 'Network error');
  }
}

export const api = {
  createRoom: (data) => request('create-room', data),
  joinRoom: (data) => request('join-room', data),
  getRoom: () => request(`get-room?roomCode=${state.roomCode}`, null, 'GET'),
  updateReady: (ready) => request('update-ready', { roomCode: state.roomCode, ready }),
  startGame: () => request('start-game', { roomCode: state.roomCode }),
  rollDice: () => request('roll-dice', { roomCode: state.roomCode }),
  moveToken: (tokenIndex) => request('move-token', { roomCode: state.roomCode, tokenIndex }),
  completeChallenge: (action) => request('complete-challenge', { roomCode: state.roomCode, action }),
  sendMessage: (text) => request('send-message', { roomCode: state.roomCode, text }),
  sendReaction: (type) => request('send-reaction', { roomCode: state.roomCode, type }),
  leaveRoom: () => request('leave-room', { roomCode: state.roomCode }),
  startNewGame: () => request('start-new-game', { roomCode: state.roomCode })
};