import { state } from './state.js';
import { api } from './api.js';
import { CONFIG } from './config.js';

export function renderWaitingRoom() {
  const room = state.room;
  if (!room) return;

  const codeEl = document.getElementById('waiting-room-code');
  if (codeEl) codeEl.textContent = room.roomCode;

  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = `(${room.players.length}/${CONFIG.MAX_PLAYERS})`;

  const grid = document.getElementById('players-grid');
  if (!grid) return;
  grid.innerHTML = '';

  room.players.forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    const statusClass = !p.online ? '' : (p.ready ? 'ready' : 'online');
    const statusText = !p.online ? 'Offline' : (p.ready ? 'Ready' : 'Waiting');
    slot.innerHTML = `
      <div class="slot-avatar" style="background:${p.color}"><i data-lucide="${p.avatar}"></i></div>
      <div class="slot-info">
        <div class="slot-name">${escapeHtml(p.name)} ${p.id === room.hostId ? '<i data-lucide="crown" class="crown-icon"></i>' : ''}</div>
        <div class="slot-status ${statusClass}">${statusText}</div>
      </div>
    `;
    grid.appendChild(slot);
  });

  // Empty slots
  for (let i = room.players.length; i < CONFIG.MAX_PLAYERS; i++) {
    const slot = document.createElement('div');
    slot.className = 'player-slot empty';
    slot.textContent = `Slot ${i + 1}`;
    grid.appendChild(slot);
  }

  // Ready button state
  const me = state.room.players.find(p => p.id === state.playerId);
  const readyBtn = document.getElementById('btn-ready');
  if (readyBtn) {
    if (me?.ready) {
      readyBtn.innerHTML = '<i data-lucide="check-circle"></i> READY ✓';
      readyBtn.classList.add('btn-primary');
      readyBtn.classList.remove('btn-secondary');
    } else {
      readyBtn.innerHTML = '<i data-lucide="check-circle"></i> READY';
      readyBtn.classList.remove('btn-primary');
      readyBtn.classList.add('btn-secondary');
    }
  }

  // Start button (host only)
  const startBtn = document.getElementById('btn-start-game');
  if (startBtn) {
    const isHost = me && me.id === room.hostId;
    const readyCount = room.players.filter(p => p.ready).length;
    startBtn.classList.toggle('hidden', !isHost);
    startBtn.disabled = readyCount < 2;
    startBtn.style.opacity = readyCount < 2 ? '0.5' : '1';
  }

  if (window.lucide) lucide.createIcons();
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}