import { state } from './state.js';
import { api } from './api.js';
import { sfx } from './sound.js';
import { toast } from './ui.js';

export function renderChat() {
  const container = document.getElementById('chat-messages');
  if (!container || !state.room) return;
  const messages = state.room.messages || [];
  container.innerHTML = '';

  let newCount = 0;
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'chat-msg' + (m.type === 'system' ? ' system' : '');
    if (m.type === 'system') {
      div.textContent = m.text;
    } else {
      div.innerHTML = `<span class="chat-author" style="color:${m.playerColor}">${escapeHtml(m.playerName)}:</span>${escapeHtml(m.text)}`;
    }
    container.appendChild(div);
    if (m.id > state.lastMessageId) { state.lastMessageId = m.id; newCount++; }
  });

  // unread badge if chat tab not active
  const tabChat = document.getElementById('tab-chat');
  const badge = document.getElementById('chat-unread');
  if (badge) {
    if (tabChat && !tabChat.classList.contains('active') && newCount > 0) {
      state.unreadChat += newCount;
      badge.textContent = state.unreadChat;
      badge.classList.remove('hidden');
    }
  }

  // Auto-scroll if near bottom
  const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  if (wasAtBottom) container.scrollTop = container.scrollHeight;

  if (newCount > 0 && state.currentScreen === 'game') sfx.chatNotify();
}

export async function sendChatMessage(text) {
  if (!text.trim()) return;
  try {
    await api.sendMessage(text.trim());
  } catch (err) {
    toast(err.message, 'error');
  }
}

export function bindChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send-chat');
  if (!sendBtn) return;

  sendBtn.addEventListener('click', () => {
    const text = input.value;
    input.value = '';
    sendChatMessage(text);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.value;
      input.value = '';
      sendChatMessage(text);
    }
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
      if (tab === 'chat') {
        state.unreadChat = 0;
        const badge = document.getElementById('chat-unread');
        if (badge) badge.classList.add('hidden');
      }
    });
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}