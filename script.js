// Snake Water Gun Arena — script.js

(() => {
  'use strict';

  // ---------- Constants ----------
  // data-choice values from HTML: 0 = Snake, 1 = Water, -1 = Gun
  const CHOICES = {
    0: { name: 'SNAKE', emoji: '🐍', colorClass: 'green-text', icon: snakeIcon },
    1: { name: 'WATER', emoji: '💧', colorClass: 'blue-text', icon: waterIcon },
    '-1': { name: 'GUN', emoji: '🔫', colorClass: 'red-text', icon: gunIcon }
  };

  const ACHIEVEMENT_DEFS = [
    { id: 'first_victory', name: 'First Victory', desc: 'Win your first match', check: s => s.wins >= 1 },
    { id: 'on_a_roll', name: 'On a Roll', desc: 'Win 10 matches', check: s => s.wins >= 10 },
    { id: 'veteran', name: 'Veteran', desc: 'Win 50 matches', check: s => s.wins >= 50 },
    { id: 'dedicated', name: 'Dedicated', desc: 'Play 25 matches', check: s => s.total >= 25 },
    { id: 'champion', name: 'Champion', desc: 'Play 100 matches', check: s => s.total >= 100 },
    { id: 'hot_streak', name: 'Hot Streak', desc: 'Win 5 in a row', check: s => s.bestWinStreak >= 5 },
    { id: 'unstoppable', name: 'Unstoppable', desc: 'Win 10 in a row', check: s => s.bestWinStreak >= 10 },
    { id: 'record_breaker', name: 'Record Breaker', desc: 'Beat your win streak record', check: s => s.beatStreakRecordEvent === true },
    { id: 'sharpshooter', name: 'Sharpshooter', desc: '75%+ win rate (min 10 games)', check: s => s.decisive >= 10 && (s.wins / s.decisive) >= 0.75 }
  ];

  const STORAGE_KEY = 'swg_arena_save_v1';

  // ---------- State ----------
  let state = {
    playerName: '',
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,        // positive = win streak, negative = lose streak
    bestWinStreak: 0,
    worstLoseStreak: 0,
    history: [],             // [{ player: 0/1/-1, robot: 0/1/-1, result: 'win'|'lose'|'draw' }]
    achievements: {},        // id -> true
    soundOn: true,
    theme: 'dark'
  };

  let isRoundInProgress = false;

  // ---------- DOM References ----------
  const $ = (id) => document.getElementById(id);

  const entryScreen = $('entry-screen');
  const gameScreen = $('game-screen');
  const entryForm = $('entry-form');
  const nameInput = $('name-input');
  const startBtn = $('start-btn');

  const continueChoice = $('continue-choice');
  const continueName = $('continue-name');
  const continueBtn = $('continue-btn');
  const freshBtn = $('fresh-btn');

  const headerPlayerName = $('header-player-name');
  const idlePlayerName = $('idle-player-name');
  const profilePlayerName = $('profile-player-name');

  const arenaIdle = $('arena-idle');
  const vsStage = $('vs-stage');
  const thinkingState = $('thinking-state');
  const resultState = $('result-state');

  const pendingPlayerIcon = $('pending-player-icon');
  const pendingPlayerName = $('pending-player-name');
  const pendingPlayerChoice = $('pending-player-choice');

  const resultPlayerIcon = $('result-player-icon');
  const resultPlayerName = $('result-player-name');
  const resultPlayerChoice = $('result-player-choice');
  const resultRobotIcon = $('result-robot-icon');
  const resultRobotChoice = $('result-robot-choice');
  const resultBanner = $('result-banner');
  const playAgainBtn = $('play-again-btn');
  const confettiContainer = $('confetti-container');

  const choiceButtons = [$('btn-snake'), $('btn-water'), $('btn-gun')];

  const scoreWins = $('score-wins');
  const scoreLosses = $('score-losses');
  const scoreDraws = $('score-draws');
  const winRateValue = $('win-rate-value');
  const winRateFill = $('win-rate-fill');

  const profileTotal = $('profile-total');

  const statStreak = $('stat-streak');
  const statBestWin = $('stat-best-win');
  const statBestLose = $('stat-best-lose');
  const flameStreak = $('flame-streak');
  const flameBest = $('flame-best');

  const historyList = $('history-list');

  const achievementsToggle = $('achievements-toggle');
  const achievementsPanel = $('achievements-panel');
  const achievementsChevron = $('achievements-chevron');
  const achievementsGrid = $('achievements-grid');
  const achievementCount = $('achievement-count');

  const saveBtn = $('save-btn');
  const restartScoresBtn = $('restart-scores-btn');

  const soundToggle = $('sound-toggle');
  const soundOnIcon = $('sound-on-icon');
  const soundOffIcon = $('sound-off-icon');

  const themeToggle = $('theme-toggle');
  const moonIcon = $('moon-icon');
  const sunIcon = $('sun-icon');

  const newGameBtn = $('new-game-btn');

  const rulesBtn = $('rules-btn');
  const rulesModal = $('rules-modal');
  const closeRulesBtn = $('close-rules-btn');

  const toastContainer = $('toast-container');

  // ---------- Icon helpers (mirrors inline SVGs from HTML) ----------
  function snakeIcon() {
    return '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M16 21 C16 16 10 16 10 12 C10 8 16 8 16 4"/>' +
      '<ellipse cx="13.5" cy="3" rx="3" ry="2"/>' +
      '<path d="M16.3 2.4 L18.8 1.2 M16.3 2.4 L18.8 3.5" stroke-width="1.2"/>' +
      '<circle cx="13" cy="2.4" r="0.55" fill="currentColor" stroke="none"/>' +
      '</svg>';
  }
  function waterIcon() {
    return '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' +
      '</svg>';
  }
  function gunIcon() {
    return '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' +
      '<line x1="22" y1="12" x2="19" y2="12"/><line x1="5" y1="12" x2="2" y2="12"/>' +
      '<line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>' +
      '</svg>';
  }

  function iconHtmlFor(choice) {
    return CHOICES[String(choice)].icon();
  }

  function choiceLabelFor(choice) {
    const c = CHOICES[String(choice)];
    return c.name;
  }

  // ---------- Sound (simple WebAudio beeps, no external files needed) ----------
  let audioCtx = null;
  function ensureAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }
  function playTone(freq, duration, type, vol) {
    if (!state.soundOn) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }
  function playClickSound() { playTone(440, 0.08, 'square', 0.05); }
  function playWinSound() { playTone(660, 0.15, 'sine', 0.08); setTimeout(() => playTone(880, 0.18, 'sine', 0.08), 120); }
  function playLoseSound() { playTone(220, 0.25, 'sawtooth', 0.06); }
  function playDrawSound() { playTone(380, 0.18, 'triangle', 0.06); }

  // ---------- Persistence ----------
  function saveState(showToast) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showToast) showToastMsg('Progress saved!', 'success');
    } catch (e) {
      if (showToast) showToastMsg('Could not save progress.', 'info');
    }
  }

  function peekSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function loadState() {
    const parsed = peekSavedState();
    if (!parsed) return false;
    state = Object.assign({}, state, parsed);
    return true;
  }

  // ---------- Toasts ----------
  function showToastMsg(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  // ---------- Rendering ----------
  function renderNames() {
    headerPlayerName.textContent = state.playerName.toUpperCase();
    idlePlayerName.textContent = state.playerName.toUpperCase();
    profilePlayerName.textContent = state.playerName.toUpperCase();
  }

  function renderScoreboard() {
    scoreWins.textContent = state.wins;
    scoreLosses.textContent = state.losses;
    scoreDraws.textContent = state.draws;

    const total = state.wins + state.losses + state.draws;
    profileTotal.textContent = total;

    const decisive = state.wins + state.losses; // excludes draws

    if (decisive === 0) {
      winRateValue.textContent = '—';
      winRateFill.style.width = '0%';
    } else {
      const rate = Math.round((state.wins / decisive) * 100);
      winRateValue.textContent = rate + '%';
      winRateFill.style.width = rate + '%';
    }
  }

  function popScore(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function renderStats() {
    if (state.currentStreak > 0) {
      statStreak.textContent = state.currentStreak + 'W';
      statStreak.className = 'stat-val win';
      flameStreak.style.color = '#22c55e';
    } else if (state.currentStreak < 0) {
      statStreak.textContent = Math.abs(state.currentStreak) + 'L';
      statStreak.className = 'stat-val lose';
      flameStreak.style.color = '#ef4444';
    } else {
      statStreak.textContent = '0';
      statStreak.className = 'stat-val';
      flameStreak.style.color = '#94a3b8';
    }

    statBestWin.textContent = state.bestWinStreak;
    flameBest.style.color = state.bestWinStreak > 0 ? '#facc15' : '#94a3b8';
    statBestLose.textContent = state.worstLoseStreak;
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<li class="history-empty">No matches yet</li>';
      return;
    }
    const recent = state.history.slice(-12).reverse();
    historyList.innerHTML = recent.map(function (h) {
      return '<li class="history-item">' +
        '<span class="history-icons">' +
        '<span style="width:14px;height:14px;display:inline-flex;color:var(--foreground)">' + iconHtmlFor(h.player) + '</span>' +
        '<span>vs</span>' +
        '<span style="width:14px;height:14px;display:inline-flex;color:var(--foreground)">' + iconHtmlFor(h.robot) + '</span>' +
        '</span>' +
        '<span class="history-result ' + h.result + '">' + h.result.toUpperCase() + '</span>' +
        '</li>';
    }).join('');
  }

  function renderAchievements() {
    const unlockedIds = Object.keys(state.achievements).filter(function (k) { return state.achievements[k]; });
    achievementCount.textContent = unlockedIds.length + '/' + ACHIEVEMENT_DEFS.length;

    achievementsGrid.innerHTML = ACHIEVEMENT_DEFS.map(function (a) {
      const unlocked = !!state.achievements[a.id];
      return '<div class="achievement-badge ' + (unlocked ? 'unlocked' : '') + '" title="' + a.desc + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="' + (unlocked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' +
        '</svg>' +
        '<span class="achievement-badge-name">' + a.name + '</span>' +
        '</div>';
    }).join('');
  }

  function renderAll() {
    renderNames();
    renderScoreboard();
    renderStats();
    renderHistory();
    renderAchievements();
  }

  // ---------- Achievements check ----------
  function checkAchievements(beatStreakRecordEvent) {
    const snapshot = {
      wins: state.wins,
      total: state.wins + state.losses + state.draws,
      decisive: state.wins + state.losses,
      bestWinStreak: state.bestWinStreak,
      beatStreakRecordEvent: beatStreakRecordEvent
    };
    ACHIEVEMENT_DEFS.forEach(function (a) {
      if (!state.achievements[a.id] && a.check(snapshot)) {
        state.achievements[a.id] = true;
        showToastMsg('Achievement unlocked: ' + a.name + '!', 'achievement');
      }
    });
  }

  // ---------- Confetti ----------
  function launchConfetti() {
    confettiContainer.innerHTML = '';
    const colors = ['#8b5cf6', '#4ade80', '#60a5fa', '#facc15', '#f87171', '#e879f9'];
    const count = 26;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confettiContainer.appendChild(piece);
    }
    setTimeout(function () { confettiContainer.innerHTML = ''; }, 2000);
  }

  // ---------- Game Logic ----------
  function decideWinner(playerChoice, robotChoice) {
    if (playerChoice === robotChoice) return 'draw';
    // Snake(0) beats Water(1); Water(1) beats Gun(-1); Gun(-1) beats Snake(0)
    const beats = { 0: 1, 1: -1, '-1': 0 };
    return beats[String(playerChoice)] === robotChoice ? 'win' : 'lose';
  }

  function randomRobotChoice() {
    const options = [0, 1, -1];
    return options[Math.floor(Math.random() * options.length)];
  }

  function setChoiceButtonsDisabled(disabled) {
    choiceButtons.forEach(function (btn) { btn.disabled = disabled; });
  }

  function startRound(playerChoice) {
    if (isRoundInProgress) return;
    isRoundInProgress = true;
    playClickSound();
    setChoiceButtonsDisabled(true);

    arenaIdle.classList.add('hidden');
    vsStage.classList.remove('hidden');
    thinkingState.classList.remove('hidden');
    resultState.classList.add('hidden');

    pendingPlayerIcon.innerHTML = iconHtmlFor(playerChoice);
    pendingPlayerName.textContent = state.playerName.toUpperCase();
    pendingPlayerChoice.textContent = choiceLabelFor(playerChoice);

    const robotChoice = randomRobotChoice();
    const thinkDelay = 900 + Math.random() * 600;

    setTimeout(function () {
      finishRound(playerChoice, robotChoice);
    }, thinkDelay);
  }

  function finishRound(playerChoice, robotChoice) {
    const result = decideWinner(playerChoice, robotChoice);

    const prevBestWin = state.bestWinStreak;
    if (result === 'win') {
      state.wins++;
      state.currentStreak = state.currentStreak > 0 ? state.currentStreak + 1 : 1;
      state.bestWinStreak = Math.max(state.bestWinStreak, state.currentStreak);
      playWinSound();
    } else if (result === 'lose') {
      state.losses++;
      state.currentStreak = state.currentStreak < 0 ? state.currentStreak - 1 : -1;
      state.worstLoseStreak = Math.max(state.worstLoseStreak, Math.abs(state.currentStreak));
      playLoseSound();
    } else {
      state.draws++;
      state.currentStreak = 0;
      playDrawSound();
    }

    const beatStreakRecordEvent = result === 'win' && state.bestWinStreak > prevBestWin && prevBestWin > 0;

    state.history.push({ player: playerChoice, robot: robotChoice, result: result });

    thinkingState.classList.add('hidden');
    resultState.classList.remove('hidden');

    resultPlayerIcon.innerHTML = iconHtmlFor(playerChoice);
    resultPlayerName.textContent = state.playerName.toUpperCase();
    resultPlayerChoice.textContent = choiceLabelFor(playerChoice);
    resultRobotIcon.innerHTML = iconHtmlFor(robotChoice);
    resultRobotChoice.textContent = choiceLabelFor(robotChoice);

    resultBanner.textContent = result === 'win' ? 'YOU WIN!' : result === 'lose' ? 'YOU LOSE' : 'DRAW';
    resultBanner.className = 'result-banner ' + result;

    if (result === 'win') launchConfetti();

    checkAchievements(beatStreakRecordEvent);

    renderAll();
    popScore(result === 'win' ? scoreWins : result === 'lose' ? scoreLosses : scoreDraws);
    saveState(false);

    isRoundInProgress = false;
  }

  function resetToIdleArena() {
    vsStage.classList.add('hidden');
    arenaIdle.classList.remove('hidden');
    setChoiceButtonsDisabled(false);
  }

  function resetAllScores() {
    state.wins = 0;
    state.losses = 0;
    state.draws = 0;
    state.currentStreak = 0;
    state.bestWinStreak = 0;
    state.worstLoseStreak = 0;
    state.history = [];
    state.achievements = {};
    saveState(false);
    renderAll();
    resetToIdleArena();
    showToastMsg('All scores reset.', 'info');
  }

  // ---------- Theme & Sound ----------
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      moonIcon.style.display = '';
      sunIcon.style.display = 'none';
    } else {
      moonIcon.style.display = 'none';
      sunIcon.style.display = '';
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    if (gameScreen.classList.contains('active')) saveState(false);
  }

  function applySound(on) {
    state.soundOn = on;
    if (on) {
      soundOnIcon.style.display = '';
      soundOffIcon.style.display = 'none';
    } else {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = '';
    }
  }

  function toggleSound() {
    applySound(!state.soundOn);
    if (gameScreen.classList.contains('active')) saveState(false);
  }

  // ---------- Entry Flow ----------
  function freshStateForName(playerName) {
    return {
      playerName: playerName,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestWinStreak: 0,
      worstLoseStreak: 0,
      history: [],
      achievements: {},
      soundOn: state.soundOn,
      theme: state.theme
    };
  }

  function enterArena() {
    entryScreen.classList.remove('active');
    gameScreen.classList.add('active');
    renderAll();
    resetToIdleArena();
  }

  function handleNameSubmit(playerName) {
    const trimmedName = playerName.trim();
    const saved = peekSavedState();

    if (saved && saved.playerName && saved.playerName.toLowerCase() === trimmedName.toLowerCase()) {
      // Matching save found — ask whether to continue or start fresh
      continueName.textContent = saved.playerName;
      entryForm.classList.add('hidden');
      continueChoice.classList.remove('hidden');

      continueBtn.onclick = function () {
        loadState();
        state.playerName = saved.playerName;
        enterArena();
      };
      freshBtn.onclick = function () {
        state = freshStateForName(trimmedName);
        saveState(false);
        enterArena();
      };
    } else {
      // No matching save — start fresh immediately with this name
      state = freshStateForName(trimmedName);
      saveState(false);
      enterArena();
    }
  }

  function startNewGame() {
    gameScreen.classList.remove('active');
    entryScreen.classList.add('active');
    entryForm.classList.remove('hidden');
    continueChoice.classList.add('hidden');
    nameInput.value = '';
    startBtn.disabled = true;
    nameInput.focus();
  }

  // ---------- Achievements panel toggle ----------
  function toggleAchievementsPanel() {
    const isHidden = achievementsPanel.classList.contains('hidden');
    achievementsPanel.classList.toggle('hidden');
    achievementsChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  // ---------- Rules Modal ----------
  function openRulesModal() { rulesModal.classList.remove('hidden'); }
  function closeRulesModal() { rulesModal.classList.add('hidden'); }

  // ---------- Event Listeners ----------
  nameInput.addEventListener('input', function () {
    startBtn.disabled = nameInput.value.trim().length === 0;
  });

  entryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    handleNameSubmit(name);
  });

  choiceButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const choice = parseInt(btn.dataset.choice, 10);
      startRound(choice);
    });
  });

  playAgainBtn.addEventListener('click', resetToIdleArena);

  saveBtn.addEventListener('click', function () { saveState(true); });

  restartScoresBtn.addEventListener('click', function () {
    if (confirm('Reset all scores, streaks, history, and achievements?')) {
      resetAllScores();
    }
  });

  soundToggle.addEventListener('click', toggleSound);
  themeToggle.addEventListener('click', toggleTheme);
  newGameBtn.addEventListener('click', startNewGame);

  achievementsToggle.addEventListener('click', toggleAchievementsPanel);

  rulesBtn.addEventListener('click', openRulesModal);
  closeRulesBtn.addEventListener('click', closeRulesModal);
  rulesModal.addEventListener('click', function (e) {
    if (e.target === rulesModal) closeRulesModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if (key === 's' && !choiceButtons[0].disabled && gameScreen.classList.contains('active')) {
      startRound(0);
    } else if (key === 'w' && !choiceButtons[1].disabled && gameScreen.classList.contains('active')) {
      startRound(1);
    } else if (key === 'g' && !choiceButtons[2].disabled && gameScreen.classList.contains('active')) {
      startRound(-1);
    } else if (key === 'p' && !resultState.classList.contains('hidden')) {
      resetToIdleArena();
    } else if (key === 'm') {
      toggleSound();
    } else if (key === 't' && gameScreen.classList.contains('active')) {
      toggleTheme();
    } else if (key === 'n' && gameScreen.classList.contains('active')) {
      startNewGame();
    } else if (key === 'r' && gameScreen.classList.contains('active')) {
      if (confirm('Reset all scores, streaks, history, and achievements?')) {
        resetAllScores();
      }
    } else if (key === 'escape') {
      closeRulesModal();
    }
  });

  // ---------- Init ----------
  function init() {
    // Peek at any saved theme/sound preferences without entering the game directly —
    // the player must always type their name first.
    const saved = peekSavedState();
    applyTheme((saved && saved.theme) || 'dark');
    applySound(saved ? saved.soundOn !== false : true);

    entryScreen.classList.add('active');
    nameInput.focus();
  }

  init();
})();