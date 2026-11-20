import { state } from './state.js';

const screens = ['welcome','registration','waiting','game'];

export function showScreen(name) {
  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle('hidden', s !== name);
  });
  state.currentScreen = name;
  if (window.lucide) lucide.createIcons();
}

export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  if (type === 'error') el.style.borderColor = 'var(--warning)';
  else if (type === 'success') el.style.borderColor = 'var(--positive)';
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 300ms'; setTimeout(() => el.remove(), 300); }, 3500);
}

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch {}
  ta.remove();
  return Promise.resolve();
}

export function iconHTML(name, size = 16) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

export function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}