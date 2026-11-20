import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';
import { CONFIG } from './_shared/_config.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode, text } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');
    if (!text || text.length < 1 || text.length > 200) {
      return errorResponse(400, 'INVALID_TEXT', 'Message must be 1-200 chars');
    }

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(403, 'NOT_IN_ROOM', 'Player not in room');

    // Rate limit
    const recent = (room.messages || []).filter(m => m.playerId === playerId);
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      if (Date.now() - last.timestamp < CONFIG.CHAT_RATE_LIMIT_MS) {
        return errorResponse(429, 'RATE_LIMITED', 'Please wait before sending another message');
      }
    }

    room.messages.push({
      id: room.nextMessageId++,
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      text: String(text).slice(0, 200),
      timestamp: Date.now(),
      type: 'chat'
    });
    if (room.messages.length > CONFIG.MAX_MESSAGES) {
      room.messages.splice(0, room.messages.length - CONFIG.MAX_MESSAGES);
    }
    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('send-message error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};