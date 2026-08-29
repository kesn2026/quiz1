// player.js - Mobile Player Client Logic
(function() {
  let ws = null;
  let myPlayerId = null;
  let currentPin = null;
  let selectedAvatar = '🐶';
  let myNickname = '';
  let hasAnsweredCurrent = false;

  const OPTION_SYMBOLS = ['▲', '◆', '●', '■'];

  // DOM Views
  const views = {
    join: document.getElementById('player-view-join'),
    waiting: document.getElementById('player-view-waiting'),
    question: document.getElementById('player-view-question'),
    result: document.getElementById('player-view-result'),
    gameover: document.getElementById('player-view-gameover')
  };

  function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[viewName]) {
      views[viewName].classList.add('active');
    }
  }

  // Check URL params for PIN
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    if (pinParam) {
      document.getElementById('input-pin').value = pinParam;
    }
  }

  function setupEventListeners() {
    // Avatar selection
    document.querySelectorAll('.avatar-choice').forEach(choice => {
      choice.addEventListener('click', () => {
        window.soundFx.playClick();
        document.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('active'));
        choice.classList.add('active');
        selectedAvatar = choice.dataset.avatar;
      });
    });

    // Join Button
    document.getElementById('btn-player-join').addEventListener('click', () => {
      window.soundFx.playClick();
      const pin = document.getElementById('input-pin').value.trim();
      const nickname = document.getElementById('input-nickname').value.trim() || '열정학습자';

      if (!pin || pin.length < 4) {
        alert('방 번호(PIN) 4자리를 정확히 입력해주세요.');
        return;
      }

      currentPin = pin;
      myNickname = nickname;
      connectWebSocketAndJoin(pin, nickname, selectedAvatar);
    });
  }

  // WebSocket Connection
  function connectWebSocketAndJoin(pin, nickname, avatar) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: { pin, nickname, avatar }
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
      console.log('WS disconnected');
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
      alert('서버 연결 중 문제가 발생했습니다.');
    };
  }

  function handleServerMessage(msg) {
    const { type, payload } = msg;

    switch (type) {
      case 'JOIN_SUCCESS': {
        myPlayerId = payload.playerId;
        document.getElementById('wait-nickname').textContent = `${payload.nickname} 님`;
        document.getElementById('wait-avatar').textContent = payload.avatar;
        document.getElementById('wait-pin').textContent = payload.pin;
        document.getElementById('player-status-badge').textContent = '입장 완료';

        window.soundFx.playCorrect();
        switchView('waiting');
        break;
      }

      case 'JOIN_ERROR': {
        alert(payload.message || '입장에 실패했습니다.');
        break;
      }

      case 'QUESTION_START': {
        hasAnsweredCurrent = false;
        renderQuestionScreen(payload);
        break;
      }

      case 'ANSWER_RECEIVED': {
        // Confirmation that server recorded the response
        break;
      }

      case 'ANSWER_REVEALED': {
        renderAnswerResult(payload);
        break;
      }

      case 'GAME_OVER': {
        renderGameOver(payload);
        break;
      }

      case 'HOST_DISCONNECTED': {
        alert(payload.message || '강사님의 연결이 종료되었습니다.');
        location.reload();
        break;
      }

      case 'GAME_RESET': {
        switchView('waiting');
        break;
      }
    }
  }

  // Render Question Screen on Mobile
  function renderQuestionScreen(data) {
    document.getElementById('player-status-badge').textContent = '답안 선택';
    document.getElementById('player-q-progress').textContent =
      `문제 ${data.questionIndex + 1} / ${data.totalQuestions}`;
    document.getElementById('player-q-text').textContent = data.question;

    const container = document.getElementById('player-choice-container');
    container.innerHTML = '';

    const isOX = (data.type === 'ox');

    data.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = `player-btn opt-${idx % 4} ${isOX ? (idx === 0 ? 'btn-ox-o' : 'btn-ox-x') : ''}`;

      const symbol = isOX ? (idx === 0 ? '⭕ O' : '❌ X') : OPTION_SYMBOLS[idx % 4];

      btn.innerHTML = `
        <div>${symbol}</div>
        <div class="player-btn-label">${escapeHtml(optText)}</div>
      `;

      btn.addEventListener('click', () => {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;
        window.soundFx.playClick();

        // Highlight selected button & dim others
        container.querySelectorAll('.player-btn').forEach(b => {
          b.disabled = true;
          b.style.opacity = '0.35';
        });
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.05)';
        btn.style.outline = '5px solid #ffffff';

        document.getElementById('player-status-badge').textContent = '답안 제출 완료!';

        // Send answer to server
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'SUBMIT_ANSWER',
            payload: { selectedIndex: idx }
          }));
        }
      });

      container.appendChild(btn);
    });

    switchView('question');
  }

  // Render Answer Result Feedback
  function renderAnswerResult(data) {
    const card = document.getElementById('player-feedback-card');
    const emojiEl = document.getElementById('fb-emoji');
    const titleEl = document.getElementById('fb-title');
    const pointsEl = document.getElementById('fb-points');
    const scoreEl = document.getElementById('fb-total-score');

    scoreEl.textContent = (data.currentScore || 0).toLocaleString();

    if (data.isCorrect) {
      card.className = 'feedback-box correct';
      emojiEl.textContent = '🎉 👏';
      titleEl.textContent = '정답입니다!';
      pointsEl.textContent = `+${(data.pointsAwarded || 0).toLocaleString()}점 획득!`;
      window.soundFx.playCorrect();
    } else {
      card.className = 'feedback-box wrong';
      emojiEl.textContent = '😅 💪';
      titleEl.textContent = '아쉽습니다!';
      pointsEl.textContent = '다음 문제에 도전해보세요!';
      window.soundFx.playWrong();
    }

    document.getElementById('player-status-badge').textContent = '결과 확인';
    switchView('result');
  }

  // Render Game Over on Mobile
  function renderGameOver(data) {
    const leaderboard = data.leaderboard || [];
    const me = leaderboard.find(p => p.id === myPlayerId);

    const rankEl = document.getElementById('player-final-rank');
    const scoreEl = document.getElementById('player-final-score');

    if (me) {
      let rankText = `${me.rank}등`;
      if (me.rank === 1) rankText = '👑 🥇 1등';
      else if (me.rank === 2) rankText = '🥈 2등';
      else if (me.rank === 3) rankText = '🥉 3등';

      rankEl.textContent = rankText;
      scoreEl.textContent = `총 ${me.score.toLocaleString()}점`;

      if (me.rank <= 3) {
        window.soundFx.playFanfare();
      } else {
        window.soundFx.playCorrect();
      }
    } else {
      rankEl.textContent = '참여 완료';
      scoreEl.textContent = '수고하셨습니다!';
    }

    document.getElementById('player-status-badge').textContent = '게임 종료';
    switchView('gameover');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkUrlParams();
    setupEventListeners();
  });
})();
