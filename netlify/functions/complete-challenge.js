import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';
import { resolveChallenge } from './_shared/game.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode, action } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');
    if (action !== 'complete' && action !== 'skip') {
      return errorResponse(400, 'INVALID_ACTION', 'Action must be complete or skip');
    }

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (!room.activeChallenge) return errorResponse(400, 'NO_CHALLENGE', 'No active challenge');
    if (room.activeChallenge.targetPlayerId !== playerId) {
      return errorResponse(403, 'NOT_TARGET', 'Only the target player can resolve');
    }

    if (action === 'complete') {
      const player = room.players.find(p => p.id === playerId);
      if (player) player.stats.challengesCompleted = (player.stats.challengesCompleted || 0) + 1;
      room.messages.push({
        id: room.nextMessageId++, playerId: 'system', playerName: 'System',
        playerColor: '#34d399', text: `${player?.name || 'Player'} completed the challenge!`,
        timestamp: Date.now(), type: 'system'
      });
    } else {
      room.messages.push({
        id: room.nextMessageId++, playerId: 'system', playerName: 'System',
        playerColor: '#9ea8d8', text: `${room.players.find(p=>p.id===playerId)?.name || 'Player'} skipped the challenge`,
        timestamp: Date.now(), type: 'system'
      });
    }

    resolveChallenge(room, action);
    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('complete-challenge error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};