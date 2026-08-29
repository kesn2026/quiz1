// server.js - Real-time Quiz Platform Server (Zero Dependency, Node.js 24+)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

// Find local IPv4 address for LAN QR Code access
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// In-Memory Game Rooms Store
const rooms = new Map();

// Helper: Generate 4-digit room PIN
function generateRoomPin() {
  let pin;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(pin));
  return pin;
}

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // API Endpoints
  if (pathname === '/api/info') {
    const localIp = getLocalIP();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      localIp,
      port: PORT,
      serverTime: Date.now(),
      playerUrl: `http://${localIp}:${PORT}/player.html`
    }));
    return;
  }

  // Static file routing
  if (pathname === '/' || pathname === '/host') {
    pathname = '/index.html';
  } else if (pathname === '/player') {
    pathname = '/player.html';
  }

  let filePath = path.join(PUBLIC_DIR, pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1><p><a href="/">홈으로 가기</a></p>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// RFC 6455 Lightweight WebSocket Implementation (Zero external npm dependency)
function createWebSocketServer(httpServer) {
  const clients = new Map();

  httpServer.on('upgrade', (req, socket, head) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');

    const client = {
      socket,
      id: crypto.randomBytes(8).toString('hex'),
      roomPin: null,
      role: null, // 'host' or 'player'
      nickname: null,
      avatar: '🐶',
      score: 0,
      streak: 0,
      lastAnswer: null
    };

    clients.set(socket, client);

    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 2) {
        const firstByte = buffer[0];
        const secondByte = buffer[1];
        const opcode = firstByte & 0x0f;
        const isMasked = (secondByte & 0x80) === 0x80;
        let payloadLen = secondByte & 0x7f;
        let offset = 2;

        if (opcode === 0x8) {
          socket.end();
          return;
        }

        if (payloadLen === 126) {
          if (buffer.length < 4) return;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) return;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        let maskingKey = null;
        if (isMasked) {
          if (buffer.length < offset + 4) return;
          maskingKey = buffer.slice(offset, offset + 4);
          offset += 4;
        }

        if (buffer.length < offset + payloadLen) return;

        const payload = buffer.slice(offset, offset + payloadLen);
        buffer = buffer.slice(offset + payloadLen);

        if (isMasked && maskingKey) {
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskingKey[i % 4];
          }
        }

        if (opcode === 0x1) {
          try {
            const message = JSON.parse(payload.toString('utf8'));
            handleClientMessage(client, message);
          } catch (e) {
            console.error('Invalid JSON received:', e.message);
          }
        } else if (opcode === 0x9) {
          sendRawFrame(socket, 0xa, payload);
        }
      }
    });

    socket.on('close', () => {
      handleClientDisconnect(client);
      clients.delete(socket);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
      handleClientDisconnect(client);
      clients.delete(socket);
    });
  });
}

function sendRawFrame(socket, opcode, payloadBuffer) {
  if (!socket.writable) return;
  const length = payloadBuffer.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = length;
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  socket.write(Buffer.concat([header, payloadBuffer]));
}

function sendJson(client, data) {
  if (!client || !client.socket || !client.socket.writable) return;
  const payload = Buffer.from(JSON.stringify(data), 'utf8');
  sendRawFrame(client.socket, 0x1, payload);
}

function broadcastToRoom(roomPin, data, filterFn = null) {
  const room = rooms.get(roomPin);
  if (!room) return;

  if (room.hostClient && (!filterFn || filterFn(room.hostClient))) {
    sendJson(room.hostClient, data);
  }

  for (const player of room.players.values()) {
    if (!filterFn || filterFn(player)) {
      sendJson(player, data);
    }
  }
}

function getLeaderboard(room) {
  const playerList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
    lastAnswerCorrect: p.lastAnswer ? p.lastAnswer.isCorrect : null,
    lastPointsAwarded: p.lastAnswer ? p.lastAnswer.points : 0
  }));

  playerList.sort((a, b) => b.score - a.score);

  let currentRank = 1;
  for (let i = 0; i < playerList.length; i++) {
    if (i > 0 && playerList[i].score < playerList[i - 1].score) {
      currentRank = i + 1;
    }
    playerList[i].rank = currentRank;
  }

  return playerList;
}

// Handle Client Messages
function handleClientMessage(client, msg) {
  const { type, payload } = msg;

  switch (type) {
    case 'CREATE_ROOM': {
      const pin = generateRoomPin();
      client.role = 'host';
      client.roomPin = pin;

      const room = {
        pin,
        hostClient: client,
        players: new Map(),
        state: 'LOBBY',
        quizList: payload?.quizList || [],
        currentQuestionIndex: -1,
        questionStartTime: 0,
        questionDuration: payload?.questionDuration || 20,
        answers: new Map()
      };

      rooms.set(pin, room);

      const localIp = getLocalIP();
      sendJson(client, {
        type: 'ROOM_CREATED',
        payload: {
          pin,
          localIp,
          port: PORT,
          playerUrl: `http://${localIp}:${PORT}/player.html?pin=${pin}`
        }
      });
      break;
    }

    case 'SET_QUIZ_LIST': {
      const room = rooms.get(client.roomPin);
      if (room && client.role === 'host') {
        room.quizList = payload.quizList || [];
        sendJson(client, {
          type: 'QUIZ_LIST_UPDATED',
          payload: { count: room.quizList.length }
        });
      }
      break;
    }

    case 'JOIN_ROOM': {
      const { pin, nickname, avatar } = payload;
      const room = rooms.get(pin);

      if (!room) {
        sendJson(client, {
          type: 'JOIN_ERROR',
          payload: { message: '존재하지 않는 방 번호(PIN)입니다.' }
        });
        return;
      }

      if (room.state !== 'LOBBY') {
        sendJson(client, {
          type: 'JOIN_ERROR',
          payload: { message: '이미 퀴즈가 진행 중입니다.' }
        });
        return;
      }

      client.role = 'player';
      client.roomPin = pin;
      client.nickname = (nickname || '익명참가자').trim().substring(0, 12);
      client.avatar = avatar || '🎉';
      client.score = 0;
      client.streak = 0;
      client.lastAnswer = null;

      room.players.set(client.id, client);

      sendJson(client, {
        type: 'JOIN_SUCCESS',
        payload: {
          pin,
          playerId: client.id,
          nickname: client.nickname,
          avatar: client.avatar
        }
      });

      const playerList = Array.from(room.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score
      }));

      broadcastToRoom(pin, {
        type: 'PLAYER_LIST_UPDATE',
        payload: {
          players: playerList,
          totalCount: playerList.length
        }
      });
      break;
    }

    case 'START_QUESTION': {
      const room = rooms.get(client.roomPin);
      if (!room || client.role !== 'host') return;

      const qIndex = payload?.questionIndex ?? (room.currentQuestionIndex + 1);
      if (qIndex >= room.quizList.length) {
        room.state = 'GAME_OVER';
        const leaderboard = getLeaderboard(room);
        broadcastToRoom(room.pin, {
          type: 'GAME_OVER',
          payload: {
            leaderboard,
            totalQuestions: room.quizList.length
          }
        });
        return;
      }

      room.currentQuestionIndex = qIndex;
      room.state = 'QUESTION';
      room.questionStartTime = Date.now();
      room.questionDuration = payload?.duration || 20;
      room.answers.clear();

      for (const p of room.players.values()) {
        p.lastAnswer = null;
      }

      const currentQ = room.quizList[qIndex];

      const hostPayload = {
        questionIndex: qIndex,
        totalQuestions: room.quizList.length,
        question: currentQ.question,
        options: currentQ.options,
        correctIndex: currentQ.correctIndex,
        explanation: currentQ.explanation || '',
        category: currentQ.category || '학습 퀴즈',
        duration: room.questionDuration,
        type: currentQ.type || 'choice'
      };

      const playerPayload = {
        questionIndex: qIndex,
        totalQuestions: room.quizList.length,
        question: currentQ.question,
        options: currentQ.options,
        duration: room.questionDuration,
        type: currentQ.type || 'choice'
      };

      sendJson(room.hostClient, {
        type: 'QUESTION_START',
        payload: hostPayload
      });

      for (const player of room.players.values()) {
        sendJson(player, {
          type: 'QUESTION_START',
          payload: playerPayload
        });
      }
      break;
    }

    case 'SUBMIT_ANSWER': {
      const room = rooms.get(client.roomPin);
      if (!room || client.role !== 'player' || room.state !== 'QUESTION') return;

      if (room.answers.has(client.id)) return;

      const { selectedIndex } = payload;
      const currentQ = room.quizList[room.currentQuestionIndex];
      if (!currentQ) return;

      const responseTimeMs = Date.now() - room.questionStartTime;
      const maxTimeMs = room.questionDuration * 1000;
      const isCorrect = (selectedIndex === currentQ.correctIndex);

      let pointsAwarded = 0;
      if (isCorrect) {
        const timeRatio = Math.max(0, 1 - (responseTimeMs / maxTimeMs));
        const speedBonus = Math.round(timeRatio * 500);
        const streakBonus = Math.min(client.streak * 50, 250);
        pointsAwarded = 500 + speedBonus + streakBonus;

        client.score += pointsAwarded;
        client.streak += 1;
      } else {
        client.streak = 0;
      }

      const answerRecord = {
        playerId: client.id,
        nickname: client.nickname,
        avatar: client.avatar,
        selectedIndex,
        isCorrect,
        points: pointsAwarded,
        responseTimeMs
      };

      room.answers.set(client.id, answerRecord);
      client.lastAnswer = answerRecord;

      sendJson(client, {
        type: 'ANSWER_RECEIVED',
        payload: {
          selectedIndex,
          totalSubmitted: room.answers.size,
          totalPlayers: room.players.size
        }
      });

      sendJson(room.hostClient, {
        type: 'ANSWER_COUNT_UPDATE',
        payload: {
          submittedCount: room.answers.size,
          totalPlayers: room.players.size
        }
      });

      if (room.answers.size >= room.players.size && room.players.size > 0) {
        sendJson(room.hostClient, {
          type: 'ALL_PLAYERS_ANSWERED',
          payload: { submittedCount: room.answers.size }
        });
      }
      break;
    }

    case 'REVEAL_ANSWER': {
      const room = rooms.get(client.roomPin);
      if (!room || client.role !== 'host') return;

      room.state = 'ANSWER_REVEAL';
      const currentQ = room.quizList[room.currentQuestionIndex];
      if (!currentQ) return;

      const optionCounts = (currentQ.options || []).map(() => 0);
      for (const ans of room.answers.values()) {
        if (ans.selectedIndex >= 0 && ans.selectedIndex < optionCounts.length) {
          optionCounts[ans.selectedIndex]++;
        }
      }

      sendJson(room.hostClient, {
        type: 'ANSWER_REVEALED',
        payload: {
          correctIndex: currentQ.correctIndex,
          explanation: currentQ.explanation || '',
          optionCounts,
          totalAnswers: room.answers.size
        }
      });

      for (const player of room.players.values()) {
        const ans = player.lastAnswer;
        sendJson(player, {
          type: 'ANSWER_REVEALED',
          payload: {
            correctIndex: currentQ.correctIndex,
            explanation: currentQ.explanation || '',
            yourAnswer: ans ? ans.selectedIndex : null,
            isCorrect: ans ? ans.isCorrect : false,
            pointsAwarded: ans ? ans.points : 0,
            currentScore: player.score,
            streak: player.streak
          }
        });
      }
      break;
    }

    case 'SHOW_LEADERBOARD': {
      const room = rooms.get(client.roomPin);
      if (!room || client.role !== 'host') return;

      room.state = 'LEADERBOARD';
      const leaderboard = getLeaderboard(room);

      broadcastToRoom(room.pin, {
        type: 'LEADERBOARD_UPDATE',
        payload: {
          leaderboard,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.quizList.length
        }
      });
      break;
    }

    case 'RESTART_GAME': {
      const room = rooms.get(client.roomPin);
      if (!room || client.role !== 'host') return;

      room.state = 'LOBBY';
      room.currentQuestionIndex = -1;
      room.answers.clear();

      for (const player of room.players.values()) {
        player.score = 0;
        player.streak = 0;
        player.lastAnswer = null;
      }

      const playerList = Array.from(room.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: 0
      }));

      broadcastToRoom(room.pin, {
        type: 'GAME_RESET',
        payload: {
          players: playerList,
          totalCount: playerList.length
        }
      });
      break;
    }
  }
}

function handleClientDisconnect(client) {
  if (!client || !client.roomPin) return;

  const room = rooms.get(client.roomPin);
  if (!room) return;

  if (client.role === 'host') {
    broadcastToRoom(client.roomPin, {
      type: 'HOST_DISCONNECTED',
      payload: { message: '강사(호스트)의 연결이 종료되었습니다.' }
    });
    rooms.delete(client.roomPin);
  } else if (client.role === 'player') {
    room.players.delete(client.id);
    room.answers.delete(client.id);

    const playerList = Array.from(room.players.values()).map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score
    }));

    broadcastToRoom(room.pin, {
      type: 'PLAYER_LIST_UPDATE',
      payload: {
        players: playerList,
        totalCount: playerList.length,
        leftPlayer: client.nickname
      }
    });
  }
}

createWebSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIP();
  console.log(`\n=====================================================`);
  console.log(`🎉 [QuizPang] 실시간 퀴즈 서버가 시작되었습니다!`);
  console.log(`👉 호스트(강사용) 화면 : http://localhost:${PORT}`);
  console.log(`📱 참가자(모바일) 주소 : http://${localIp}:${PORT}/player.html`);
  console.log(`=====================================================\n`);
});
