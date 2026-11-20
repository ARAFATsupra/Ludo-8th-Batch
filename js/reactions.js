import { state } from './state.js';
import { api } from './api.js';

const ICON_MAP = {
  applause: 'hand', like: 'thumbs-up', celebrate: 'party-popper',
  surprise: 'zap', laugh: 'laugh'
};

let lastReactionId = 0;

export function bindReactions() {
  document.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await api.sendReaction(btn.dataset.reaction);
      } catch {}
    });
  });
}

export function processReactions() {
  if (!state.room || !state.room.reactions) return;
  const reactions = state.room.reactions;
  const newOnes = reactions.filter(r => r.id > lastReactionId);
  if (newOnes.length === 0) return;
  newOnes.forEach(r => {
    if (r.id > lastReactionId) lastReactionId = r.id;
    showFloatingReaction(r);
  });
}

function showFloatingReaction(r) {
  const layer = document.getElementById('reactions-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'floating-reaction';
  const icon = ICON_MAP[r.type] || 'star';
  el.innerHTML = `<i data-lucide="${icon}"></i>`;
  el.style.left = (30 + Math.random() * 40) + '%';
  el.style.top = (40 + Math.random() * 30) + '%';
  el.style.color = r.playerColor || '#7c6fef';
  layer.appendChild(el);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => el.remove(), 2100);
}