import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (room.hostId !== playerId) return errorResponse(403, 'NOT_HOST', 'Only host can restart');

    room.status = 'waiting';
    room.winnerId = null;
    room.currentTurn = null;
    room.dice = null;
    room.activeChallenge = null;
    room.pendingTurnResult = null;
    room.moveCounter = 0;
    room.turnNumber = 0;

    for (const p of room.players) {
      p.ready = false;
      room.tokens[p.id] = [{pos:-1},{pos:-1},{pos:-1},{pos:-1}];
      p.stats = { tokensInGoal: 0, challengesCompleted: 0, tokensCaptured: 0, doublesInRow: 0 };
    }

    room.messages.push({
      id: room.nextMessageId++, playerId: 'system', playerName: 'System',
      playerColor: '#7c6fef', text: 'Room reset. Ready up for a new game!',
      timestamp: Date.now(), type: 'system'
    });

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('start-new-game error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};