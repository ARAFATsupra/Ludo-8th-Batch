import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode, ready } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (room.status !== 'waiting') return errorResponse(400, 'GAME_STARTED', 'Game already started');

    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(403, 'NOT_IN_ROOM', 'Player not in room');

    player.ready = !!ready;
    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('update-ready error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};