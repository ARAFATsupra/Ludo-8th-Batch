import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';
import { CONFIG } from './_shared/_config.js';

const VALID = new Set(['applause', 'like', 'celebrate', 'surprise', 'laugh']);

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode, type } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');
    if (!VALID.has(type)) return errorResponse(400, 'INVALID_TYPE', 'Invalid reaction type');

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(403, 'NOT_IN_ROOM', 'Player not in room');

    room.reactions.push({
      id: room.nextReactionId++,
      playerId: player.id,
      playerColor: player.color,
      type,
      timestamp: Date.now()
    });
    if (room.reactions.length > CONFIG.MAX_REACTIONS) {
      room.reactions.splice(0, room.reactions.length - CONFIG.MAX_REACTIONS);
    }
    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('send-reaction error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};