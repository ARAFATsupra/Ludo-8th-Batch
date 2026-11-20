import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, getPlayerId } from './_shared/validate.js';
import { advanceTurn, resolveChallenge } from './_shared/game.js';
import { CONFIG } from './_shared/_config.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    if (!playerId) return errorResponse('Player ID required', 'MISSING_PLAYER_ID', 400);
    const roomCode = event.queryStringParameters?.roomCode?.toUpperCase();
    if (!roomCode) return errorResponse('Room code required', 'MISSING_ROOM_CODE', 400)

    const room = await getRoom(roomCode);
    if (!room) return errorResponse('Room not found', 'ROOM_NOT_FOUND', 404)

    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(err.message, 'SERVER_ERROR', 500)

    let mutated = false;

    // Update player heartbeat
    const oldLastSeen = player.lastSeen;
    player.lastSeen = Date.now();
    player.online = true;
    if (Date.now() - oldLastSeen > 1000) mutated = true;

    // Mark others offline
    for (const p of room.players) {
      if (p.id !== playerId && p.online && Date.now() - p.lastSeen > CONFIG.OFFLINE_TIMEOUT_MS) {
        p.online = false; mutated = true;
      }
    }

    // Auto-resolve expired challenge
    if (room.activeChallenge && Date.now() - room.activeChallenge.startedAt > CONFIG.CHALLENGE_TIMEOUT_MS) {
      resolveChallenge(room, 'skip');
      mutated = true;
    }

    // Auto-advance on turn timeout (only if no active challenge)
    if (room.status === 'playing' && room.currentTurn && !room.activeChallenge) {
      const elapsed = Date.now() - room.currentTurn.startedAt;
      const currentPlayer = room.players.find(p => p.id === room.currentTurn.playerId);
      const currentOffline = currentPlayer && Date.now() - currentPlayer.lastSeen > CONFIG.OFFLINE_TIMEOUT_MS;
      const anyOnline = room.players.some(p => Date.now() - p.lastSeen <= CONFIG.OFFLINE_TIMEOUT_MS);

      if (anyOnline && (elapsed > CONFIG.TURN_TIMEOUT_MS || currentOffline)) {
        advanceTurn(room);
        mutated = true;
      }
    }

    if (mutated) room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('get-room error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};