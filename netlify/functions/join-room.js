import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId, handleCors } from './_shared/validate.js';
import { CONFIG } from './_shared/_config.js';

export const handler = async (event) => {
  // Handle CORS preflight
  const cors = handleCors(event);
  if (cors) return cors;

  try {
    const playerId = getPlayerId(event);
    if (!playerId) return errorResponse(400, 'MISSING_PLAYER_ID', 'Player ID required');

    const body = parseBody(event);
    const { roomCode, name, color, avatar } = body;

    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');
    if (!name || name.length < 3 || name.length > 20) {
      return errorResponse(400, 'INVALID_NAME', 'Name must be 3-20 chars');
    }

    const room = await getRoom(roomCode.toUpperCase());
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (room.status !== 'waiting') return errorResponse(400, 'GAME_IN_PROGRESS', 'Game already started');

    // Already in room — just refresh presence
    const existing = room.players.find(p => p.id === playerId);
    if (existing) {
      existing.lastSeen = Date.now();
      existing.online = true;
      room.sequence++;
      await setRoom(roomCode, room);
      return successResponse({ roomCode: roomCode.toUpperCase(), room });
    }

    if (room.players.length >= CONFIG.MAX_PLAYERS) {
      return errorResponse(400, 'ROOM_FULL', 'Room is full');
    }

    const nameTaken = room.players.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (nameTaken) return errorResponse(409, 'NAME_TAKEN', 'This name is already taken in the room');

    const newIdx = room.players.length;
    room.players.push({
      id: playerId, name, color, avatar,
      ready: false, online: true, lastSeen: Date.now(), index: newIdx,
      stats: { tokensInGoal: 0, challengesCompleted: 0, tokensCaptured: 0, doublesInRow: 0 }
    });
    room.tokens[playerId] = [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }];

    room.messages.push({
      id: room.nextMessageId++,
      playerId: 'system', playerName: 'System', playerColor: '#9ea8d8',
      text: `${name} joined the room`,
      timestamp: Date.now(), type: 'system'
    });
    if (room.messages.length > CONFIG.MAX_MESSAGES) {
      room.messages.splice(0, room.messages.length - CONFIG.MAX_MESSAGES);
    }

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ roomCode: roomCode.toUpperCase(), room });
  } catch (err) {
    console.error('join-room error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};