// host.js - Host / Teacher Dashboard Logic
(function() {
  let ws = null;
  let roomPin = null;
  let quizGenerator = new QuizGenerator();
  let currentQuizList = [];
  let currentQIndex = -1;
  let timerInterval = null;
  let timeLeft = 20;
  let isSoundEnabled = true;

  // Symbols for 4-choice options
  const OPTION_SYMBOLS = ['▲', '◆', '●', '■'];

  // DOM Elements
  const views = {
    setup: document.getElementById('view-setup'),
    lobby: document.getElementById('view-lobby'),
    arena: document.getElementById('view-arena'),
    leaderboard: document.getElementById('view-leaderboard'),
    gameover: document.getElementById('view-gameover')
  };

  function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[viewName]) {
      views[viewName].classList.add('active');
    }
  }

  // Init Quiz with Default Topic
  function initQuiz() {
    quizGenerator.generateFromTopic('스마트폰');
    renderCurrentPagePreview();
  }

  // Render question preview for setup screen
  function renderCurrentPagePreview() {
    const listEl = document.getElementById('preview-list');
    const questions = quizGenerator.getActivePageQuestions();
    listEl.innerHTML = '';

    questions.forEach((q, idx) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      
      let answerText = '';
      if (q.type === 'ox') {
        answerText = `정답: ${q.options[q.correctIndex]}`;
      } else {
        answerText = `정답: ${idx + 1}번 보기 [${q.options[q.correctIndex]}]`;
      }

      item.innerHTML = `
        <div class="preview-item-header">
          <span>Q${idx + 1}. [${q.category || '학습퀴즈'}]</span>
          <span>${q.type === 'ox' ? 'OX 퀴즈' : '4지선다'}</span>
        </div>
        <div class="preview-item-title">${escapeHtml(q.question)}</div>
        <div class="preview-item-answer">✅ ${escapeHtml(answerText)}</div>
      `;
      listEl.appendChild(item);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Setup UI Event Listeners
  function setupEventListeners() {
    // Top Sound Toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    soundBtn.addEventListener('click', () => {
      isSoundEnabled = window.soundFx.toggleSound();
      soundBtn.textContent = isSoundEnabled ? '🔊 소리 켬' : '🔇 소리 끔';
      if (isSoundEnabled) window.soundFx.playClick();
    });

    // Top New Quiz / Shuffle Button
    document.getElementById('btn-new-quiz-top').addEventListener('click', () => {
      window.soundFx.playClick();
      const topic = document.getElementById('topic-input').value || '스마트폰';
      quizGenerator.generateFromTopic(topic);
      renderCurrentPagePreview();
      showToast('새로운 5문항 퀴즈 세트가 생성되었습니다! 🎲');
    });

    // Setup Mode Tabs
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundFx.playClick();
        document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;
        document.getElementById('mode-panel-topic').style.display = (mode === 'topic' ? 'block' : 'none');
        document.getElementById('mode-panel-file').style.display = (mode === 'file' ? 'block' : 'none');
        document.getElementById('mode-panel-ai').style.display = (mode === 'ai' ? 'block' : 'none');
      });
    });

    // Topic Search Button
    document.getElementById('btn-generate-topic').addEventListener('click', () => {
      window.soundFx.playClick();
      const topic = document.getElementById('topic-input').value.trim();
      quizGenerator.generateFromTopic(topic || '스마트폰');
      renderCurrentPagePreview();
      showToast(`'${topic || '스마트폰'}' 주제로 퀴즈를 생성했습니다! ✨`);
    });

    document.getElementById('topic-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-generate-topic').click();
      }
    });

    // Quick Topic Badges
    document.querySelectorAll('.topic-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        window.soundFx.playClick();
        const topic = tag.dataset.topic;
        document.getElementById('topic-input').value = topic;
        quizGenerator.generateFromTopic(topic);
        renderCurrentPagePreview();
        showToast(`'${tag.textContent}' 퀴즈를 불러왔습니다! 🎯`);
      });
    });

    // 3-Pages Selector Tabs
    document.querySelectorAll('.page-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundFx.playClick();
        document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pageIdx = parseInt(btn.dataset.page, 10);
        quizGenerator.setActivePage(pageIdx);
        renderCurrentPagePreview();
      });
    });

    // Shuffle Current Page Button
    document.getElementById('btn-shuffle-current').addEventListener('click', () => {
      window.soundFx.playClick();
      const topic = document.getElementById('topic-input').value || '스마트폰';
      quizGenerator.generateFromTopic(topic);
      renderCurrentPagePreview();
      showToast('문제를 새로 섞었습니다! 🔄');
    });

    // File Drag & Drop
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileStatus = document.getElementById('file-status');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });

    async function handleFileUpload(file) {
      fileStatus.style.display = 'block';
      fileStatus.textContent = `⏳ '${file.name}' 파일을 분석하여 퀴즈를 생성하고 있습니다...`;
      try {
        await quizGenerator.parseAndGenerateFromFile(file);
        renderCurrentPagePreview();
        fileStatus.style.color = '#059669';
        fileStatus.textContent = `✅ '${file.name}' 분석 완료! 5문항 3세트 퀴즈가 준비되었습니다.`;
        window.soundFx.playCorrect();
      } catch (err) {
        fileStatus.style.color = '#ef4444';
        fileStatus.textContent = `❌ 파일 처리 오류: ${err.message}`;
        window.soundFx.playWrong();
      }
    }

    // AI Gemini Generation Button
    document.getElementById('btn-generate-ai').addEventListener('click', async () => {
      window.soundFx.playClick();
      const apiKey = document.getElementById('gemini-api-key').value.trim();
      const promptText = document.getElementById('ai-prompt-input').value.trim() || '스마트폰 기초';

      if (!apiKey) {
        // Fallback to internal knowledge procedural generation
        quizGenerator.generateFromTopic(promptText);
        renderCurrentPagePreview();
        showToast(`'${promptText}' 주제로 퀴즈를 생성했습니다! 💡`);
        return;
      }

      showToast('Gemini AI가 맞춤형 퀴즈를 제작 중입니다... ✨');
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `성인/어르신 대상 수업 퀴즈 15개를 만들어줘. 주제: "${promptText}".
JSON 배열 포맷으로만 응답해줘.
각 항목 필드:
- question (문제 내용, 읽기 쉽게)
- options (보기 4개 배열 또는 OX 2개 배열)
- correctIndex (0부터 시작하는 정답 인덱스)
- explanation (친절한 정답 설명)
- type ("choice" 또는 "ox")
- category ("${promptText}")`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const questions = JSON.parse(jsonText);
          if (Array.isArray(questions) && questions.length >= 5) {
            quizGenerator.currentPages = [
              questions.slice(0, 5),
              questions.slice(5, 10),
              questions.slice(10, 15)
            ];
            quizGenerator.activePageIndex = 0;
            renderCurrentPagePreview();
            showToast('Gemini AI 퀴즈가 성공적으로 생성되었습니다! 🎉');
            window.soundFx.playCorrect();
          }
        }
      } catch (err) {
        console.error(err);
        quizGenerator.generateFromTopic(promptText);
        renderCurrentPagePreview();
        showToast('로컬 생성기로 안전하게 전환하여 퀴즈를 완성했습니다.');
      }
    });

    // Create Multiplayer Room (Open QR)
    document.getElementById('btn-create-multi-room').addEventListener('click', () => {
      window.soundFx.playClick();
      currentQuizList = quizGenerator.getActivePageQuestions();
      connectWebSocketAndCreateRoom();
    });

    // Start Game from Lobby
    document.getElementById('btn-start-game-from-lobby').addEventListener('click', () => {
      window.soundFx.playClick();
      currentQIndex = 0;
      startQuestionOnServer(currentQIndex);
    });

    // Host In-Game Buttons
    document.getElementById('btn-reveal-answer').addEventListener('click', () => {
      window.soundFx.playClick();
      revealAnswerOnServer();
    });

    document.getElementById('btn-show-leaderboard').addEventListener('click', () => {
      window.soundFx.playClick();
      showLeaderboardOnServer();
    });

    document.getElementById('btn-next-question').addEventListener('click', () => {
      window.soundFx.playClick();
      currentQIndex++;
      startQuestionOnServer(currentQIndex);
    });

    document.getElementById('btn-lb-next-question').addEventListener('click', () => {
      window.soundFx.playClick();
      currentQIndex++;
      startQuestionOnServer(currentQIndex);
    });

    // Game Over Buttons
    document.getElementById('btn-play-again-same').addEventListener('click', () => {
      window.soundFx.playClick();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'RESTART_GAME' }));
      }
      switchView('lobby');
    });

    document.getElementById('btn-new-game-setup').addEventListener('click', () => {
      window.soundFx.playClick();
      switchView('setup');
    });
  }

  // WebSocket Setup & Room Creation
  function connectWebSocketAndCreateRoom() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        payload: {
          quizList: currentQuizList,
          questionDuration: 20
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('WS Connection closed');
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
    };
  }

  function handleServerMessage(msg) {
    const { type, payload } = msg;

    switch (type) {
      case 'ROOM_CREATED': {
        roomPin = payload.pin;
        document.getElementById('top-room-badge').style.display = 'block';
        document.getElementById('top-room-pin').textContent = roomPin;
        document.getElementById('lobby-pin-display').textContent = roomPin;
        document.getElementById('lobby-url-display').textContent = payload.playerUrl;

        // Render QR Code
        const qrContainer = document.getElementById('qr-code-target');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
          text: payload.playerUrl,
          width: 240,
          height: 240,
          colorDark: "#1e1b4b",
          colorLight: "#ffffff"
        });

        switchView('lobby');
        break;
      }

      case 'PLAYER_LIST_UPDATE': {
        renderLobbyPlayers(payload.players || []);
        break;
      }

      case 'QUESTION_START': {
        renderLiveQuestion(payload);
        break;
      }

      case 'ANSWER_COUNT_UPDATE': {
        document.getElementById('arena-answered-count').textContent =
          `${payload.submittedCount} / ${payload.totalPlayers}명 응답 완료`;
        break;
      }

      case 'ALL_PLAYERS_ANSWERED': {
        // Auto-reveal when all players answered
        revealAnswerOnServer();
        break;
      }

      case 'ANSWER_REVEALED': {
        handleAnswerRevealed(payload);
        break;
      }

      case 'LEADERBOARD_UPDATE': {
        renderLeaderboard(payload.leaderboard || []);
        break;
      }

      case 'GAME_OVER': {
        renderGameOver(payload.leaderboard || []);
        break;
      }

      case 'GAME_RESET': {
        renderLobbyPlayers(payload.players || []);
        switchView('lobby');
        break;
      }
    }
  }

  // Render Lobby Players
  function renderLobbyPlayers(players) {
    const grid = document.getElementById('lobby-players-grid');
    const countEl = document.getElementById('lobby-player-count');
    countEl.textContent = players.length;

    if (players.length === 0) {
      grid.innerHTML = `
        <div style="color: #94a3b8; font-size: 22px; font-weight: 700; margin: auto; text-align: center;">
          학습자분들이 QR코드를 스캔하여 입장하고 있습니다...<br>
          <span style="font-size: 18px;">(스마트폰 카메라로 QR 코드를 비추면 즉시 참여됩니다)</span>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    players.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'player-chip';
      chip.innerHTML = `
        <span class="player-chip-avatar">${p.avatar}</span>
        <span>${escapeHtml(p.nickname)}</span>
      `;
      grid.appendChild(chip);
    });
  }

  // Start Question on Server
  function startQuestionOnServer(index) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'START_QUESTION',
        payload: {
          questionIndex: index,
          duration: 20
        }
      }));
    }
  }

  // Render Live Question
  function renderLiveQuestion(data) {
    clearInterval(timerInterval);
    switchView('arena');

    document.getElementById('arena-q-progress').textContent =
      `문제 ${data.questionIndex + 1} / ${data.totalQuestions}`;
    document.getElementById('arena-question-text').textContent = data.question;
    document.getElementById('arena-answered-count').textContent = `0명 응답 중`;

    // Reset controls & explanation
    document.getElementById('arena-explanation-card').style.display = 'none';
    document.getElementById('btn-reveal-answer').style.display = 'inline-flex';
    document.getElementById('btn-show-leaderboard').style.display = 'none';
    document.getElementById('btn-next-question').style.display = 'none';

    // Render Options
    const grid = document.getElementById('arena-options-grid');
    grid.innerHTML = '';

    const isOX = (data.type === 'ox');
    grid.className = isOX ? 'options-grid ox-grid' : 'options-grid';

    data.options.forEach((optText, idx) => {
      const card = document.createElement('div');
      card.id = `option-card-${idx}`;
      card.className = `option-card opt-${idx % 4} ${isOX ? (idx === 0 ? 'ox-o' : 'ox-x') : ''}`;
      
      const symbol = isOX ? (idx === 0 ? '⭕' : '❌') : OPTION_SYMBOLS[idx % 4];

      card.innerHTML = `
        <div class="option-symbol">${symbol}</div>
        <div class="option-text">${escapeHtml(optText)}</div>
      `;
      grid.appendChild(card);
    });

    // Start Timer
    timeLeft = data.duration || 20;
    const timerEl = document.getElementById('arena-timer');
    timerEl.textContent = timeLeft;
    timerEl.classList.remove('warning');

    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;

      if (timeLeft <= 5) {
        timerEl.classList.add('warning');
        window.soundFx.playTick();
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        revealAnswerOnServer();
      }
    }, 1000);
  }

  // Reveal Answer on Server
  function revealAnswerOnServer() {
    clearInterval(timerInterval);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'RESTART_QUESTION' })); // safe check
      ws.send(JSON.stringify({ type: 'REVEAL_ANSWER' }));
    }
  }

  // Handle Answer Revealed
  function handleAnswerRevealed(data) {
    clearInterval(timerInterval);
    window.soundFx.playCorrect();

    // Highlight correct option & dim others
    const totalOptions = document.querySelectorAll('.option-card').length;
    for (let i = 0; i < totalOptions; i++) {
      const card = document.getElementById(`option-card-${i}`);
      if (card) {
        if (i === data.correctIndex) {
          card.classList.add('correct-answer');
        } else {
          card.classList.add('dimmed');
        }
      }
    }

    // Show Explanation
    const expCard = document.getElementById('arena-explanation-card');
    const expText = document.getElementById('arena-explanation-text');
    if (data.explanation) {
      expText.textContent = data.explanation;
      expCard.style.display = 'block';
    }

    // Toggle Buttons
    document.getElementById('btn-reveal-answer').style.display = 'none';
    document.getElementById('btn-show-leaderboard').style.display = 'inline-flex';
  }

  // Show Leaderboard on Server
  function showLeaderboardOnServer() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'SHOW_LEADERBOARD' }));
    }
  }

  // Render Leaderboard
  function renderLeaderboard(leaderboard) {
    switchView('leaderboard');
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '';

    const nextBtn = document.getElementById('btn-lb-next-question');
    if (currentQIndex + 1 >= currentQuizList.length) {
      nextBtn.textContent = '👑 최종 결과 및 시상대 보기! ▶';
    } else {
      nextBtn.textContent = `다음 문제(${currentQIndex + 2}번) 진행하기 ▶`;
    }

    leaderboard.forEach((player, idx) => {
      const item = document.createElement('div');
      item.className = `lb-item rank-${player.rank}`;

      let rankSymbol = `${player.rank}등`;
      if (player.rank === 1) rankSymbol = '🥇 1등';
      else if (player.rank === 2) rankSymbol = '🥈 2등';
      else if (player.rank === 3) rankSymbol = '🥉 3등';

      item.innerHTML = `
        <div class="lb-rank-badge">${rankSymbol}</div>
        <div class="lb-user-info">
          <span class="lb-avatar">${player.avatar}</span>
          <span>${escapeHtml(player.nickname)}</span>
        </div>
        <div class="lb-score">${player.score.toLocaleString()}점</div>
      `;
      listEl.appendChild(item);
    });
  }

  // Render Final Game Over & Podium
  function renderGameOver(leaderboard) {
    switchView('gameover');
    window.soundFx.playFanfare();
    if (typeof window.triggerConfetti === 'function') {
      window.triggerConfetti(150);
    }

    const podiumContainer = document.getElementById('podium-container');
    podiumContainer.innerHTML = '';

    const top3 = leaderboard.slice(0, 3);
    const orderConfig = [
      { rank: 2, class: 'podium-2', icon: '🥈', defaultName: '2등' },
      { rank: 1, class: 'podium-1', icon: '👑 🥇', defaultName: '1등' },
      { rank: 3, class: 'podium-3', icon: '🥉', defaultName: '3등' }
    ];

    orderConfig.forEach(cfg => {
      const p = leaderboard.find(item => item.rank === cfg.rank);
      const step = document.createElement('div');
      step.className = `podium-step ${cfg.class}`;

      if (p) {
        step.innerHTML = `
          <div class="podium-avatar">${p.avatar}</div>
          <div class="podium-name">${escapeHtml(p.nickname)}</div>
          <div class="podium-score">${p.score.toLocaleString()}점</div>
          <div class="podium-rank-num">${cfg.icon}</div>
        `;
      } else {
        step.innerHTML = `
          <div class="podium-avatar">✨</div>
          <div class="podium-name">-</div>
          <div class="podium-score">0점</div>
          <div class="podium-rank-num">${cfg.icon}</div>
        `;
      }
      podiumContainer.appendChild(step);
    });

    // Remaining rankings
    const finalListEl = document.getElementById('final-leaderboard-list');
    finalListEl.innerHTML = '';

    leaderboard.slice(3).forEach(player => {
      const item = document.createElement('div');
      item.className = 'lb-item';
      item.innerHTML = `
        <div class="lb-rank-badge">${player.rank}등</div>
        <div class="lb-user-info">
          <span class="lb-avatar">${player.avatar}</span>
          <span>${escapeHtml(player.nickname)}</span>
        </div>
        <div class="lb-score">${player.score.toLocaleString()}점</div>
      `;
      finalListEl.appendChild(item);
    });
  }

  // Simple Toast UI
  function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '28px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#1e1b4b';
      toast.style.color = '#ffffff';
      toast.style.padding = '14px 28px';
      toast.style.borderRadius = '30px';
      toast.style.fontSize = '20px';
      toast.style.fontWeight = '800';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      toast.style.zIndex = '10000';
      toast.style.transition = 'opacity 0.3s';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initQuiz();
    setupEventListeners();
  });
})();
