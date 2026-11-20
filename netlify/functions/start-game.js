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
    if (room.hostId !== playerId) return errorResponse(403, 'NOT_HOST', 'Only host can start');
    if (room.status !== 'waiting') return errorResponse(400, 'INVALID_STATE', 'Game already started');

    const readyCount = room.players.filter(p => p.ready).length;
    if (readyCount < 2) return errorResponse(400, 'NOT_ENOUGH_READY', 'Need at least 2 ready players');

    room.status = 'playing';
    room.currentTurn = {
      playerId: room.players[0].id,
      playerIndex: 0,
      startedAt: Date.now()
    };
    room.dice = null;
    room.moveCounter = 0;
    room.turnNumber = 1;
    room.activeChallenge = null;
    room.pendingTurnResult = null;

    // Reset tokens
    for (const p of room.players) {
      room.tokens[p.id] = [{pos:-1},{pos:-1},{pos:-1},{pos:-1}];
      p.stats = { tokensInGoal: 0, challengesCompleted: 0, tokensCaptured: 0, doublesInRow: 0 };
    }

    room.messages.push({
      id: room.nextMessageId++,
      playerId: 'system', playerName: 'System', playerColor: '#9ea8d8',
      text: 'Game started!',
      timestamp: Date.now(), type: 'system'
    });

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('start-game error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};