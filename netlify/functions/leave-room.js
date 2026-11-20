import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');

    const room = await getRoom(roomCode);
    if (!room) return successResponse({ ok: true });

    const player = room.players.find(p => p.id === playerId);
    if (!player) return successResponse({ ok: true });

    room.messages.push({
      id: room.nextMessageId++, playerId: 'system', playerName: 'System',
      playerColor: '#9ea8d8', text: `${player.name} left`,
      timestamp: Date.now(), type: 'system'
    });

    room.players = room.players.filter(p => p.id !== playerId);
    delete room.tokens[playerId];

    // Reindex remaining players
    room.players.forEach((p, i) => { p.index = i; });

    if (room.players.length === 0) {
      // Empty — leave as-is; will be cleaned up by TTL
    } else if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    // Advance turn if the leaving player had the turn
    if (room.currentTurn?.playerId === playerId) {
      room.currentTurn = { playerId: room.players[0].id, playerIndex: 0, startedAt: Date.now() };
      room.dice = null;
    }

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ ok: true, room });
  } catch (err) {
    console.error('leave-room error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};