import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';
import { computeMoveableTokens, advanceTurn } from './_shared/game.js';
import { randomInt } from 'node:crypto';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (room.status !== 'playing') return errorResponse(400, 'NOT_PLAYING', 'Game is not in progress');
    if (!room.currentTurn || room.currentTurn.playerId !== playerId) {
      return errorResponse(403, 'NOT_YOUR_TURN', 'Not your turn');
    }
    if (room.activeChallenge) return errorResponse(400, 'CHALLENGE_ACTIVE', 'Challenge is active');
    if (room.dice) return errorResponse(400, 'ALREADY_ROLLED', 'Roll already in progress');

    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(403, 'NOT_IN_ROOM', 'Player not in room');

    const die1 = randomInt(1, 7);
    const die2 = randomInt(1, 7);
    const total = die1 + die2;
    const isDouble = die1 === die2;

    room.dice = {
      id: `d${Date.now()}${Math.random()}`,
      die1, die2, total, isDouble,
      rolledAt: Date.now()
    };

    const moveable = computeMoveableTokens(room, player, total);
    room.dice.moveableTokens = moveable;

    if (moveable.length === 0) {
      // Auto-forfeit
      room.messages.push({
        id: room.nextMessageId++, playerId: 'system', playerName: 'System',
        playerColor: '#9ea8d8', text: `${player.name} rolled ${die1}+${die2} — no valid moves, turn forfeited`,
        timestamp: Date.now(), type: 'system'
      });
      // But keep dice displayed briefly, then advance. Simpler: advance immediately, clear dice.
      room.dice = null;
      advanceTurn(room);
    }

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('roll-dice error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};