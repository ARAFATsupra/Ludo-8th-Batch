import { CONFIG } from './config.js';
import { state } from './state.js';

let canvas, ctx;
let boardSize = 700;
let moveableTokens = new Set();
let onTokenClick = null;

const TRACK_LEN = 112;

export function initBoard(canvasEl, tokenClickHandler) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  onTokenClick = tokenClickHandler;
  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('click', handleClick);
}

function resize() {
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  const size = Math.min(w, h, 900);
  boardSize = Math.max(320, size);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = boardSize * dpr;
  canvas.height = boardSize * dpr;
  canvas.style.width = boardSize + 'px';
  canvas.style.height = boardSize + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function getPlayerOffset(player) {
  return (player.index ?? 0) * 4;
}

function cellToXY(cellIdx, radiusRatio = 0.38) {
  const cx = boardSize / 2, cy = boardSize / 2;
  const R = boardSize * radiusRatio;
  const angle = (cellIdx / TRACK_LEN) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R, angle };
}

function tokenXY(player, tokenPos) {
  const cx = boardSize / 2, cy = boardSize / 2;
  const offset = getPlayerOffset(player);
  const entryAngle = (offset / TRACK_LEN) * Math.PI * 2 - Math.PI / 2;

  if (tokenPos === -1) {
    // home base — outside track, at the player's angle
    const R = boardSize * 0.46;
    return { x: cx + Math.cos(entryAngle) * R, y: cy + Math.sin(entryAngle) * R };
  }
  if (tokenPos >= 112 && tokenPos <= 117) {
    // home stretch
    const idx = tokenPos - 112;
    const R = boardSize * 0.36 - (idx + 0.5) * (boardSize * 0.045);
    return { x: cx + Math.cos(entryAngle) * R, y: cy + Math.sin(entryAngle) * R };
  }
  if (tokenPos >= 118) {
    return { x: cx, y: cy };
  }
  // on track
  const cell = (offset + tokenPos) % TRACK_LEN;
  return cellToXY(cell);
}

export function setMoveableTokens(set) {
  moveableTokens = set instanceof Set ? set : new Set(set || []);
}

export function render() {
  if (!ctx) return;
  const room = state.room;
  const size = boardSize;
  const cx = size / 2, cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  if (!room || room.status === 'waiting') {
    ctx.fillStyle = '#9ea8d8';
    ctx.font = `16px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for game to start…', cx, cy);
    return;
  }

  // Track outer ring
  const R = size * 0.38;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(124,111,239,0.3)';
  ctx.lineWidth = Math.max(2, size * 0.015);
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Draw 112 track cells
  const cellDot = Math.max(3, size * 0.008);
  for (let i = 0; i < TRACK_LEN; i++) {
    const p = cellToXY(i);
    // Determine if any player has their safe zone here
    let isSafe = false;
    for (const player of room.players) {
      const offset = getPlayerOffset(player);
      for (let s = 108; s <= 111; s++) {
        if ((offset + s) % TRACK_LEN === i) { isSafe = true; break; }
      }
      if (isSafe) break;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, cellDot, 0, Math.PI * 2);
    ctx.fillStyle = isSafe ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.12)';
    ctx.fill();
  }

  // Draw home stretches
  for (const player of room.players) {
    const offset = getPlayerOffset(player);
    const angle = (offset / TRACK_LEN) * Math.PI * 2 - Math.PI / 2;
    for (let s = 0; s < 6; s++) {
      const r = R * 0.94 - (s + 1) * (R * 0.13);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, cellDot * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = player.color + '88';
      ctx.fill();
    }
  }

  // Goal center
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(240,180,41,0.5)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,180,41,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw tokens
  const tokenRadius = Math.max(6, size * 0.014);
  const overlapMap = new Map();

  for (const player of room.players) {
    const tokens = room.tokens[player.id] || [];
    tokens.forEach((t, tIdx) => {
      const pos = t.pos;
      let xy = tokenXY(player, pos);

      // overlap offset
      const key = `${Math.round(xy.x)},${Math.round(xy.y)}`;
      if (overlapMap.has(key)) {
        const count = overlapMap.get(key);
        const angle = (count * Math.PI * 2) / 4;
        xy = { x: xy.x + Math.cos(angle) * 6, y: xy.y + Math.sin(angle) * 6 };
        overlapMap.set(key, count + 1);
      } else {
        overlapMap.set(key, 1);
      }

      const isMoveable = moveableTokens.has(`${player.id}:${tIdx}`);
      const isMe = player.id === state.playerId;

      // token circle
      ctx.beginPath();
      ctx.arc(xy.x, xy.y, tokenRadius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();

      // glow for moveable
      if (isMoveable) {
        ctx.strokeStyle = '#f0b429';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(xy.x, xy.y, tokenRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240,180,41,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (isMe) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  // Highlight current player's tokens
  if (room.currentTurn) {
    const cp = room.players.find(p => p.id === room.currentTurn.playerId);
    if (cp) {
      ctx.font = `bold ${Math.max(11, size * 0.02)}px Inter, sans-serif`;
      ctx.fillStyle = '#e8eaf6';
      ctx.textAlign = 'center';
      ctx.fillText(`${cp.name}'s turn`, cx, size - 10);
    }
  }
}

function handleClick(e) {
  if (!canvas || !state.room || state.room.status !== 'playing') return;
  if (!state.room.currentTurn || state.room.currentTurn.playerId !== state.playerId) return;
  if (moveableTokens.size === 0) return;

  const rect = canvas.getBoundingClientRect();
  const scale = boardSize / rect.width;
  const mx = (e.clientX - rect.left) * scale;
  const my = (e.clientY - rect.top) * scale;

  const room = state.room;
  let best = null, bestDist = Infinity;

  room.players.forEach(player => {
    const tokens = room.tokens[player.id] || [];
    tokens.forEach((t, tIdx) => {
      const key = `${player.id}:${tIdx}`;
      if (!moveableTokens.has(key)) return;
      const xy = tokenXY(player, t.pos);
      const d = Math.hypot(mx - xy.x, my - xy.y);
      if (d < bestDist && d < boardSize * 0.05) { bestDist = d; best = { playerId: player.id, tokenIndex: tIdx }; }
    });
  });

  if (best && best.playerId === state.playerId && onTokenClick) {
    onTokenClick(best.tokenIndex);
  }
}