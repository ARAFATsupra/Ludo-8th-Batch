import { state } from './state.js';
import { CONFIG } from './config.js';

let timerInterval = null;

export function startTurnTimer() {
  stopTurnTimer();
  timerInterval = setInterval(updateTurnTimer, 500);
  updateTurnTimer();
}

export function stopTurnTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTurnTimer() {
  const el = document.getElementById('turn-timer');
  if (!el || !state.room || !state.room.currentTurn) { if (el) el.textContent = '—'; return; }
  const elapsed = (Date.now() - state.room.currentTurn.startedAt) / 1000;
  const remaining = Math.max(0, CONFIG.TURN_TIMEOUT_SEC - elapsed);
  el.textContent = Math.ceil(remaining);
  el.style.color = remaining < 10 ? 'var(--warning)' : '';
}

export function updateTurnUI() {
  const room = state.room;
  if (!room) return;
  const nameEl = document.getElementById('current-turn-name');
  if (nameEl) {
    if (room.currentTurn) {
      const p = room.players.find(pl => pl.id === room.currentTurn.playerId);
      nameEl.textContent = p ? p.name : '—';
      if (p && p.id === state.playerId) nameEl.style.color = 'var(--positive)';
      else nameEl.style.color = '';
    } else {
      nameEl.textContent = '—';
    }
  }

  // Move counter
  const badge = document.getElementById('move-counter-badge');
  if (badge) badge.textContent = `Move ${room.moveCounter}`;

  // Challenge progress
  const bar = document.getElementById('challenge-progress-bar');
  if (bar) {
    const progress = (room.moveCounter % CONFIG.MOVE_CHALLENGE_INTERVAL) / CONFIG.MOVE_CHALLENGE_INTERVAL * 100;
    bar.style.width = progress + '%';
  }

  // Roll button state
  const rollBtn = document.getElementById('btn-roll');
  if (rollBtn) {
    const isMyTurn = room.currentTurn && room.currentTurn.playerId === state.playerId;
    const canRoll = isMyTurn && !room.dice && !room.activeChallenge && room.status === 'playing';
    rollBtn.disabled = !canRoll;
    rollBtn.style.opacity = canRoll ? '1' : '0.4';
  }
}

export function renderPlayerList() {
  const container = document.getElementById('game-player-list');
  if (!container || !state.room) return;
  const room = state.room;
  container.innerHTML = '';

  room.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row';
    if (room.currentTurn && room.currentTurn.playerId === p.id) row.classList.add('active');
    if (!p.online) row.classList.add('offline');
    const tokens = room.tokens[p.id] || [];
    const inGoal = tokens.filter(t => t.pos >= CONFIG.GOAL_PROGRESS).length;
    row.innerHTML = `
      <div class="pr-avatar" style="background:${p.color}">
        <i data-lucide="${p.avatar}"></i>
      </div>
      <span class="pr-name">${escapeHtml(p.name)}${p.id === room.hostId ? ' 👑' : ''}</span>
      <span class="pr-tokens">${inGoal}/4</span>
    `;
    container.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

export function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container || !state.room) return;
  const room = state.room;
  const sorted = [...room.players].map(p => {
    const tokens = room.tokens[p.id] || [];
    return {
      player: p,
      inGoal: tokens.filter(t => t.pos >= CONFIG.GOAL_PROGRESS).length,
      captured: p.stats?.tokensCaptured || 0,
      challenges: p.stats?.challengesCompleted || 0
    };
  }).sort((a, b) => b.inGoal - a.inGoal || b.captured - a.captured || b.challenges - a.challenges);

  container.innerHTML = '';
  sorted.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (i === 0 ? ' top' : '');
    row.innerHTML = `
      <span class="lb-rank">${i + 1}</span>
      <div class="pr-avatar" style="background:${item.player.color};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center">
        <i data-lucide="${item.player.avatar}" style="width:11px;height:11px;color:#fff"></i>
      </div>
      <span class="pr-name" style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(item.player.name)}</span>
      <span class="pr-tokens">${item.inGoal}/4</span>
    `;
    container.appendChild(row);
  });
  if (window.lucide) lucide.createIcons();
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}