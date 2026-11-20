import { api } from './api.js';
import { state, reconcileRoom } from './state.js';
import { CONFIG } from './config.js';

let pollTimer = null;
let running = false;
let backoff = 0;
let onUpdateCallback = null;
let abortController = null;

export function startPolling(onUpdate) {
  onUpdateCallback = onUpdate;
  if (running) return;
  running = true;
  backoff = 0;
  tick();
}

export function stopPolling() {
  running = false;
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  if (abortController) { abortController.abort(); abortController = null; }
}

async function tick() {
  if (!running || !state.roomCode) return;
  abortController = new AbortController();
  try {
    const data = await api.getRoom();
    backoff = 0;
    if (reconcileRoom(data.room)) {
      if (onUpdateCallback) onUpdateCallback(data.room);
    }
  } catch (err) {
    backoff = Math.min(backoff + 500, CONFIG.POLL_BACKOFF_MAX);
  }
  if (!running) return;
  const interval = Math.min(CONFIG.POLL_INTERVAL + backoff, CONFIG.POLL_BACKOFF_MAX);
  pollTimer = setTimeout(tick, interval);
}