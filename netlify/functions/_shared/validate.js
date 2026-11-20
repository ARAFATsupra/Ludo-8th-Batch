// netlify/functions/_shared/validate.js

// ─── RESPONSE HELPERS ───────────────────────────────────────────────────────

export function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, data })
  };
}

// FIXED: parameter order now matches how it is called everywhere:
// errorResponse(statusCode, code, message)
export function errorResponse(statusCode = 400, code = 'ERROR', message = 'An error occurred') {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: true, code, message })
  };
}

// ─── REQUEST PARSING ────────────────────────────────────────────────────────

export function parseBody(event) {
  try {
    if (!event.body) return {};
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// ─── PLAYER ID ──────────────────────────────────────────────────────────────

export function getPlayerId(event) {
  // Netlify lowercases all headers, so check lowercase only
  const fromHeader = event.headers?.['x-player-id'];
  if (fromHeader) return fromHeader.trim();
  const body = parseBody(event);
  return body.playerId || null;
}

// ─── TURN VALIDATION ────────────────────────────────────────────────────────

export function isPlayersTurn(gameState, playerId) {
  return gameState?.currentTurn?.playerId === playerId;
}

// ─── ROOM CODE ──────────────────────────────────────────────────────────────

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── CORS PREFLIGHT ─────────────────────────────────────────────────────────

export function handleCors(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Player-Id'
      },
      body: ''
    };
  }
  return null;
}

// ─── RATE LIMITING ──────────────────────────────────────────────────────────

const rateLimitMap = new Map();

export function checkRateLimit(playerId, maxPerSecond = 10) {
  const now = Date.now();
  const entry = rateLimitMap.get(playerId) || { count: 0, windowStart: now };

  if (now - entry.windowStart > 1000) {
    rateLimitMap.set(playerId, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  rateLimitMap.set(playerId, entry);
  return entry.count > maxPerSecond;
}

// ─── TIMESTAMP ──────────────────────────────────────────────────────────────

export function now() {
  return Date.now();
}