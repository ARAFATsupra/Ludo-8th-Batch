import { state } from './state.js';
import { api } from './api.js';
import { CONFIG } from './config.js';
import { CHALLENGES, getCategoryColor } from './challenge-data.js';
import { toast } from './ui.js';
import { sfx } from './sound.js';

let challengeTimer = null;
let currentChallengeKey = null;

export function handleChallengeUpdate(room) {
  const ac = room.activeChallenge;
  const overlay = document.getElementById('challenge-overlay');
  if (!overlay) return;

  if (!ac) {
    overlay.classList.add('hidden');
    if (challengeTimer) { clearInterval(challengeTimer); challengeTimer = null; }
    currentChallengeKey = null;
    return;
  }

  const key = `${ac.challengeIndex}:${ac.targetPlayerId}:${ac.startedAt}`;
  if (currentChallengeKey === key) {
    updateChallengeTimer(ac);
    return;
  }
  currentChallengeKey = key;

  // New challenge — populate overlay
  const challenge = CHALLENGES[ac.challengeIndex] || CHALLENGES[0];
  const target = room.players.find(p => p.id === ac.targetPlayerId);
  if (!target) { overlay.classList.add('hidden'); return; }

  document.getElementById('challenge-category').textContent = challenge.category;
  document.getElementById('challenge-category').style.background = getCategoryColor(challenge.category);
  document.getElementById('challenge-text').textContent = challenge.text;
  document.getElementById('challenge-player-name').textContent = target.name;
  document.getElementById('challenge-wait-name').textContent = target.name;

  const avatarEl = document.getElementById('challenge-avatar');
  avatarEl.style.background = target.color;
  avatarEl.innerHTML = `<i data-lucide="${target.avatar}"></i>`;

  const isSelf = target.id === state.playerId;
  document.getElementById('challenge-actions-self').classList.toggle('hidden', !isSelf);
  document.getElementById('challenge-actions-others').classList.toggle('hidden', isSelf);

  overlay.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
  sfx.challengeActivate();

  if (challengeTimer) clearInterval(challengeTimer);
  challengeTimer = setInterval(() => updateChallengeTimer(ac), 500);
  updateChallengeTimer(ac);
}

function updateChallengeTimer(ac) {
  const el = document.getElementById('challenge-timer');
  if (!el) return;
  const elapsed = (Date.now() - ac.startedAt) / 1000;
  const remaining = Math.max(0, CONFIG.CHALLENGE_TIMEOUT_SEC - elapsed);
  el.textContent = Math.ceil(remaining);
  el.style.color = remaining < 20 ? 'var(--warning)' : '';
}

export async function submitChallenge(action) {
  try {
    const data = await api.completeChallenge(action);
    sfx.challengeComplete();
    toast(action === 'complete' ? 'Challenge completed!' : 'Challenge skipped', 'success');
    return data.room;
  } catch (err) {
    toast(err.message, 'error');
    return null;
  }
}

export function bindChallengeButtons() {
  const completeBtn = document.getElementById('btn-challenge-complete');
  const skipBtn = document.getElementById('btn-challenge-skip');
  if (completeBtn) completeBtn.addEventListener('click', () => submitChallenge('complete'));
  if (skipBtn) skipBtn.addEventListener('click', () => submitChallenge('skip'));
}