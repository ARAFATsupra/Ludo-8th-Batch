import { setRoom, getRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId, handleCors } from './_shared/validate.js';
import { CONFIG } from './_shared/_config.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export const handler = async (event) => {
  // Handle CORS preflight
  const cors = handleCors(event);
  if (cors) return cors;

  try {
    const playerId = getPlayerId(event);
    if (!playerId) return errorResponse(400, 'MISSING_PLAYER_ID', 'Player ID required');

    const body = parseBody(event);
    const { name, color, avatar } = body;

    if (!name || name.length < 3 || name.length > 20) {
      return errorResponse(400, 'INVALID_NAME', 'Name must be 3-20 chars');
    }

    // Generate unique room code
    let roomCode = null;
    for (let i = 0; i < 10; i++) {
      const code = genCode();
      const existing = await getRoom(code);
      if (!existing) { roomCode = code; break; }
    }
    if (!roomCode) return errorResponse(500, 'CODE_GEN_FAILED', 'Could not generate room code');

    const room = {
      roomCode,
      hostId: playerId,
      createdAt: Date.now(),
      sequence: 1,
      status: 'waiting',
      players: [{
        id: playerId, name, color, avatar,
        ready: false, online: true, lastSeen: Date.now(), index: 0,
        stats: { tokensInGoal: 0, challengesCompleted: 0, tokensCaptured: 0, doublesInRow: 0 }
      }],
      tokens: { [playerId]: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }] },
      currentTurn: null,
      moveCounter: 0,
      dice: null,
      activeChallenge: null,
      pendingTurnResult: null,
      messages: [],
      reactions: [],
      winnerId: null,
      turnNumber: 0,
      lastChallengeMove: 0,
      nextMessageId: 1,
      nextReactionId: 1
    };

    await setRoom(roomCode, room);
    return successResponse({ roomCode, room });
  } catch (err) {
    console.error('create-room error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};