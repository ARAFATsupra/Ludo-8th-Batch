import { state, loadSession, reconcileRoom, getMyPlayer, clearSession } from './state.js';
import { api } from './api.js';
import { ensurePlayerId, setPlayerInfo } from './auth.js';
import { CONFIG } from './config.js';
import { showScreen, toast, openModal, closeModal, copyToClipboard, refreshIcons } from './ui.js';
import { startPolling, stopPolling } from './poller.js';
import { initBoard, render as renderBoard, setMoveableTokens } from './board.js';
import { displayDice, resetDiceVisual } from './dice.js';
import { updateTurnUI, renderPlayerList, renderLeaderboard, startTurnTimer, stopTurnTimer } from './turns.js';
import { renderWaitingRoom } from './room.js';
import { handleChallengeUpdate, bindChallengeButtons } from './challenges.js';
import { renderChat, bindChat } from './chat.js';
import { bindReactions, processReactions } from './reactions.js';
import { startBackgroundMusic, stopBackgroundMusic, sfx, updateAudioSettings } from './sound.js';

// ============ Bootstrap ============
loadSession();

window.addEventListener('DOMContentLoaded', () => {
  initUI();
  refreshIcons();
  attemptReconnect();
});

// ============ UI Setup ============
function initUI() {
  document.getElementById('btn-play')?.addEventListener('click', () => {
    if (window.AudioContext || window.webkitAudioContext) { /* audio unlock */ }
    sfx.click();
    showScreen('registration');
    initRegistration();
  });

  document.getElementById('btn-how-to-play')?.addEventListener('click', () => openModal('how-to-play-modal'));
  document.getElementById('btn-close-htp')?.addEventListener('click', () => closeModal('how-to-play-modal'));
  document.getElementById('btn-settings-welcome')?.addEventListener('click', () => openModal('settings-modal'));
  document.getElementById('btn-close-settings')?.addEventListener('click', () => closeModal('settings-modal'));

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.nav));
  });

  // Settings
  const muteEl = document.getElementById('setting-mute');
  const musicEl = document.getElementById('setting-music');
  const sfxEl = document.getElementById('setting-sfx');
  if (muteEl) {
    muteEl.checked = state.audio.mute;
    muteEl.addEventListener('change', () => { state.audio.mute = muteEl.checked; updateAudioSettings(); if (!muteEl.checked) startBackgroundMusic(); });
  }
  if (musicEl) {
    musicEl.value = state.audio.music;
    musicEl.addEventListener('input', () => { state.audio.music = +musicEl.value; updateAudioSettings(); });
  }
  if (sfxEl) {
    sfxEl.value = state.audio.sfx;
    sfxEl.addEventListener('input', () => { state.audio.sfx = +sfxEl.value; updateAudioSettings(); });
  }

  document.getElementById('btn-sound')?.addEventListener('click', () => openModal('settings-modal'));
  document.getElementById('btn-menu')?.addEventListener('click', async () => {
    if (confirm('Leave the room?')) {
      try { await api.leaveRoom(); } catch {}
      stopPolling();
      clearSession();
      showScreen('welcome');
    }
  });

  // Waiting room
  document.getElementById('btn-copy-code')?.addEventListener('click', () => {
    copyToClipboard(state.roomCode || '').then(() => toast('Room code copied', 'success'));
  });
  document.getElementById('btn-ready')?.addEventListener('click', async () => {
    const me = getMyPlayer();
    if (!me) return;
    try { await api.updateReady(!me.ready); } catch (err) { toast(err.message, 'error'); }
  });
  document.getElementById('btn-start-game')?.addEventListener('click', async () => {
    try { await api.startGame(); } catch (err) { toast(err.message, 'error'); }
  });
  document.getElementById('btn-leave-waiting')?.addEventListener('click', async () => {
    try { await api.leaveRoom(); } catch {}
    stopPolling(); clearSession(); showScreen('welcome');
  });

  // Game
  initBoard(document.getElementById('game-board'), handleTokenClick);
  bindChat();
  bindReactions();
  bindChallengeButtons();

  document.getElementById('btn-roll')?.addEventListener('click', async () => {
    sfx.click();
    sfx.diceRoll();
    try {
      const data = await api.rollDice();
      if (data.room) applyRoomUpdate(data.room);
      setTimeout(() => sfx.diceLand(), 500);
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('btn-play-again')?.addEventListener('click', async () => {
    try { await api.startNewGame(); } catch (err) { toast(err.message, 'error'); }
  });
  document.getElementById('btn-leave-winner')?.addEventListener('click', async () => {
    try { await api.leaveRoom(); } catch {}
    stopPolling(); clearSession(); showScreen('welcome');
  });

  // Mobile nav
  document.querySelectorAll('[data-mobile-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-mobile-nav]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.mobileNav;
      document.getElementById('game-sidebar-left')?.classList.toggle('mobile-open', target === 'players');
      document.getElementById('game-sidebar-right')?.classList.toggle('mobile-open', target === 'chat');
    });
  });
}

// ============ Registration ============
function initRegistration() {
  const colorPicker = document.getElementById('color-picker');
  const avatarPicker = document.getElementById('avatar-picker');
  if (!colorPicker || !avatarPicker) return;

  if (!colorPicker.children.length) {
    CONFIG.COLORS.forEach((c, i) => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'color-swatch' + (i === 0 ? ' selected' : '');
      sw.style.background = c;
      sw.dataset.color = c;
      sw.addEventListener('click', () => {
        colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
      });
      colorPicker.appendChild(sw);
    });
  }

  if (!avatarPicker.children.length) {
    CONFIG.AVATARS.forEach((a, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-btn' + (i === 0 ? ' selected' : '');
      btn.dataset.avatar = a;
      btn.innerHTML = `<i data-lucide="${a}"></i>`;
      btn.addEventListener('click', () => {
        avatarPicker.querySelectorAll('.avatar-btn').forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
      });
      avatarPicker.appendChild(btn);
    });
    refreshIcons();
  }

  let roomAction = 'create';
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      roomAction = btn.dataset.action;
      document.getElementById('join-code-group').classList.toggle('hidden', roomAction !== 'join');
      document.getElementById('submit-label').textContent = roomAction === 'create' ? 'Create Room' : 'Join Room';
    });
  });

  const form = document.getElementById('registration-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    const color = document.querySelector('.color-swatch.selected')?.dataset.color;
    const avatar = document.querySelector('.avatar-btn.selected')?.dataset.avatar;
    const errEl = document.getElementById('registration-error');
    errEl.classList.add('hidden');

    if (!name || name.length < 3 || name.length > 20) {
      errEl.textContent = 'Name must be 3–20 characters'; errEl.classList.remove('hidden'); return;
    }
    if (!color || !avatar) {
      errEl.textContent = 'Pick a color and avatar'; errEl.classList.remove('hidden'); return;
    }

    try {
      ensurePlayerId();
      setPlayerInfo(name, color, avatar);

      let data;
      if (roomAction === 'create') {
        data = await api.createRoom({ name, color, avatar });
      } else {
        const code = document.getElementById('room-code').value.trim().toUpperCase();
        if (code.length !== 6) {
          errEl.textContent = 'Room code must be 6 characters'; errEl.classList.remove('hidden'); return;
        }
        data = await api.joinRoom({ roomCode: code, name, color, avatar });
      }

      state.roomCode = data.roomCode;
      reconcileRoom(data.room);
      localStorage.setItem('ludo-session', JSON.stringify({
        playerId: state.playerId, playerName: state.playerName,
        playerColor: state.playerColor, playerAvatar: state.playerAvatar,
        roomCode: state.roomCode
      }));

      startBackgroundMusic();
      routeToCurrentScreen();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  };
}

// ============ Reconnect ============
async function attemptReconnect() {
  if (!state.playerId || !state.roomCode) {
    showScreen('welcome');
    return;
  }
  toast('Reconnecting…');
  try {
    const data = await api.getRoom();
    reconcileRoom(data.room);
    startBackgroundMusic();
    routeToCurrentScreen();
  } catch (err) {
    clearSession();
    showScreen('welcome');
  }
}

// ============ Routing ============
function routeToCurrentScreen() {
  const room = state.room;
  if (!room) { showScreen('welcome'); return; }
  if (room.status === 'waiting') {
    showScreen('waiting');
    renderWaitingRoom();
  } else {
    showScreen('game');
    applyRoomUpdate(room);
  }
  if (!room._pollingStarted) {
    room._pollingStarted = true;
    startPolling(handlePollUpdate);
  }
}

// ============ Poll handling ============
function handlePollUpdate(room) {
  if (state.currentScreen === 'waiting' && room.status === 'waiting') {
    renderWaitingRoom();
    return;
  }
  if (room.status === 'waiting' && state.currentScreen !== 'waiting') {
    showScreen('waiting');
    renderWaitingRoom();
    return;
  }
  if (room.status !== 'waiting' && state.currentScreen !== 'game') {
    showScreen('game');
  }
  applyRoomUpdate(room);
}

function applyRoomUpdate(room) {
  // Route based on status
  if (room.status === 'waiting') {
    if (state.currentScreen !== 'waiting') showScreen('waiting');
    renderWaitingRoom();
    return;
  }

  if (state.currentScreen !== 'game') showScreen('game');

  // Determine moveable tokens
  const moveableSet = new Set();
  if (room.dice && room.currentTurn?.playerId === state.playerId && room.dice.moveableTokens) {
    room.dice.moveableTokens.forEach(tIdx => moveableSet.add(`${state.playerId}:${tIdx}`));
  }
  setMoveableTokens(moveableSet);

  // Update dice display
  displayDice(room.dice);

  // Render
  updateTurnUI();
  renderPlayerList();
  renderLeaderboard();
  renderBoard();
  renderChat();
  handleChallengeUpdate(room);
  processReactions();

  // Turn timer
  if (room.currentTurn && !room.activeChallenge && room.status === 'playing') startTurnTimer();
  else stopTurnTimer();

  // Winner
  if (room.status === 'finished' && room.winnerId) showWinner(room);
}

function showWinner(room) {
  const winner = room.players.find(p => p.id === room.winnerId);
  if (!winner) return;
  const overlay = document.getElementById('winner-overlay');
  if (!overlay) return;
  document.getElementById('winner-name').textContent = winner.name;
  const av = document.getElementById('winner-avatar');
  av.style.background = winner.color;
  av.innerHTML = `<i data-lucide="${winner.avatar}"></i>`;
  const statsEl = document.getElementById('winner-stats');
  statsEl.innerHTML = `Tokens in goal: ${(room.tokens[winner.id]||[]).filter(t=>t.pos>=118).length}/4<br>Total moves: ${room.moveCounter}`;
  const playAgainBtn = document.getElementById('btn-play-again');
  playAgainBtn.classList.toggle('hidden', winner.id !== room.hostId || state.playerId !== winner.id);
  overlay.classList.remove('hidden');
  refreshIcons();
  sfx.win();
}

async function handleTokenClick(tokenIndex) {
  sfx.tokenMove();
  try {
    const data = await api.moveToken(tokenIndex);
    if (data.room) applyRoomUpdate(data.room);
  } catch (err) {
    toast(err.message, 'error');
  }
}