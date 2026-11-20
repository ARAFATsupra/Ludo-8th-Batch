import { getRoom, setRoom } from './_shared/blobs.js';
import { successResponse, errorResponse, parseBody, getPlayerId } from './_shared/validate.js';
import { advanceTurn, resetDiceForExtraRoll, isWinner, computeMoveableTokens } from './_shared/game.js';
import { CONFIG } from './_shared/_config.js';

export const handler = async (event) => {
  try {
    const playerId = getPlayerId(event);
    const body = parseBody(event);
    const { roomCode, tokenIndex } = body;
    if (!roomCode) return errorResponse(400, 'MISSING_ROOM_CODE', 'Room code required');
    if (tokenIndex == null || tokenIndex < 0 || tokenIndex > 3) {
      return errorResponse(400, 'INVALID_TOKEN', 'Token index must be 0-3');
    }

    const room = await getRoom(roomCode);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (room.status !== 'playing') return errorResponse(400, 'NOT_PLAYING', 'Game is not in progress');
    if (room.currentTurn?.playerId !== playerId) return errorResponse(403, 'NOT_YOUR_TURN', 'Not your turn');
    if (room.activeChallenge) return errorResponse(400, 'CHALLENGE_ACTIVE', 'Challenge is active');
    if (!room.dice) return errorResponse(400, 'NO_DICE', 'Roll the dice first');

    const player = room.players.find(p => p.id === playerId);
    if (!player) return errorResponse(403, 'NOT_IN_ROOM', 'Player not in room');

    // Recompute moveable to be safe
    const moveable = computeMoveableTokens(room, player, room.dice.total);
    if (!moveable.includes(tokenIndex)) {
      return errorResponse(400, 'INVALID_MOVE', 'That token cannot move with this roll');
    }

    const tokens = room.tokens[player.id];
    const token = tokens[tokenIndex];
    const total = room.dice.total;

    let newPos;
    if (token.pos < 0) newPos = 0;
    else newPos = token.pos + total;

    if (newPos > CONFIG.GOAL_PROGRESS) {
      return errorResponse(400, 'OVERSHOOT', 'Move would overshoot the goal');
    }
    token.pos = newPos;

    // Capture check
    let captured = 0;
    if (newPos > 0 && newPos < 112) {
      const myCell = (player.index * 4 + newPos) % 112;
      const isSafe = newPos >= 108 && newPos <= 111; // safe zones
      if (!isSafe) {
        for (const otherPlayer of room.players) {
          if (otherPlayer.id === player.id) continue;
          const otherTokens = room.tokens[otherPlayer.id] || [];
          for (const ot of otherTokens) {
            if (ot.pos < 0 || ot.pos >= 112) continue;
            const otherCell = (otherPlayer.index * 4 + ot.pos) % 112;
            const otherProgressSafe = ot.pos >= 108 && ot.pos <= 111;
            if (otherCell === myCell && !otherProgressSafe) {
              ot.pos = -1;
              captured++;
            }
          }
        }
      }
    }
    if (captured > 0) {
      player.stats.tokensCaptured = (player.stats.tokensCaptured || 0) + 1;
      room.messages.push({
        id: room.nextMessageId++, playerId: 'system', playerName: 'System',
        playerColor: '#f87171', text: `${player.name} captured ${captured} token${captured > 1 ? 's' : ''}!`,
        timestamp: Date.now(), type: 'system'
      });
    }

    // Track tokens in goal
    player.stats.tokensInGoal = tokens.filter(t => t.pos >= CONFIG.GOAL_PROGRESS).length;

    room.moveCounter++;
    const wasDouble = !!room.dice.isDouble;
    room.dice = null;

    // Win check
    if (isWinner(room, player)) {
      room.status = 'finished';
      room.winnerId = player.id;
      room.messages.push({
        id: room.nextMessageId++, playerId: 'system', playerName: 'System',
        playerColor: '#f0b429', text: `🏆 ${player.name} WINS!`,
        timestamp: Date.now(), type: 'system'
      });
      room.sequence++;
      await setRoom(roomCode, room);
      return successResponse({ room });
    }

    // Challenge check
    let triggerChallenge = false;
    if (room.moveCounter % CONFIG.MOVE_CHALLENGE_INTERVAL === 0 && room.moveCounter > 0) {
      triggerChallenge = true;
    } else if (Math.random() < CONFIG.RANDOM_CHALLENGE_CHANCE) {
      triggerChallenge = true;
    }

    if (triggerChallenge && room.players.length > 0) {
      // Fair rotation through players
      const targetIndex = (Math.floor(room.moveCounter / CONFIG.MOVE_CHALLENGE_INTERVAL) - 1 + room.players.length) % room.players.length;
      const targetPlayer = room.players[targetIndex] || room.players[0];
      const challengeIndex = (room.moveCounter * 7) % CONFIG.TOTAL_CHALLENGES;
      room.activeChallenge = {
        challengeIndex,
        targetPlayerId: targetPlayer.id,
        startedAt: Date.now(),
        status: 'active'
      };
      room.pendingTurnResult = { moverId: player.id, wasDouble };
      room.sequence++;
      await setRoom(roomCode, room);
      return successResponse({ room });
    }

    // No challenge — advance or give double
    if (wasDouble) resetDiceForExtraRoll(room);
    else advanceTurn(room);

    room.sequence++;
    await setRoom(roomCode, room);
    return successResponse({ room });
  } catch (err) {
    console.error('move-token error:', err);
    return errorResponse(500, 'SERVER_ERROR', err.message);
  }
};