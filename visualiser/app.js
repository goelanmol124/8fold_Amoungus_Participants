// ===== Among Us LLM Replay Theater — Complete Rewrite =====

// --- Among Us Player Colors (12 distinct) ---
const PLAYER_COLORS = [
  '#c51111', // Red
  '#132ed2', // Blue
  '#11802d', // Green
  '#ee54bb', // Pink
  '#f07d0d', // Orange
  '#f6f657', // Yellow
  '#3f474e', // Black
  '#d7e1f1', // White
  '#6b2fbb', // Purple
  '#71491e', // Brown
  '#38fedb', // Cyan
  '#50ef39', // Lime
];

const PLAYER_COLOR_NAMES = [
  'Red', 'Blue', 'Green', 'Pink', 'Orange', 'Yellow',
  'Black', 'White', 'Purple', 'Brown', 'Cyan', 'Lime',
];

// --- Room Layout ---
const ROOM_DEFS = {
  'Cafeteria':      { x: 350, y: 15,  w: 185, h: 175, shape: 'octagon' },
  'Weapons':        { x: 585, y: 65,  w: 90, h: 80,  shape: 'rect' },
  'O2':             { x: 530, y: 165, w: 80,  h: 65,  shape: 'rect' },
  'Navigation':     { x: 740, y: 170, w: 60,  h: 90,  shape: 'rect' },
  'Shields':        { x: 585, y: 315, w: 90,  h: 85,  shape: 'rect' },
  'Communications': { x: 490, y: 385, w: 90, h: 55,  shape: 'rect' },
  'Storage':        { x: 370, y: 295, w: 100, h: 150,  shape: 'rect' },
  'Admin':          { x: 490, y: 240, w: 90,  h: 75,  shape: 'rect' },
  'Electrical':     { x: 260, y: 275, w: 95,  h: 65,  shape: 'rect' },
  'Lower Engine':   { x: 110, y: 300, w: 80, h: 75,  shape: 'rect' },
  'Security':       { x: 195, y: 185, w: 50,  h: 75,  shape: 'rect' },
  'Reactor':        { x: 40,  y: 175, w: 70, h: 100,  shape: 'rect' },
  'Upper Engine':   { x: 100,  y: 65,  w: 105, h: 80,  shape: 'rect' },
  'MedBay':         { x: 255, y: 155, w: 80,  h: 75,  shape: 'rect' },
};

// --- State ---
let gameData = null;
let currentRoundIdx = 0;
let totalRounds = 0;
let isPlaying = false;
let playSpeed = 1.0;
let playTimer = null;
let isMuted = false;
let playerColorMap = {};   // pid -> color hex
let playerNameMap = {};    // pid -> display name (team name or pid)
let killFeedEntries = [];  // accumulated events
let meetingAnimTimer = null;
let showingRoles = false;  // spectator mode toggle for role reveal

// --- Sound System ---
const sounds = {
  bgm: null,
  meeting: null,
  kill: null,
  eject: null,
  sabotage: null,
  crewmate_win: null,
  impostor_win: null,
  role_reveal: null,
  body_report: null,
  shh: null,
  sus: null,
  reactor_alarm: null,
};

function initSounds() {
  const sndPath = 'sounds/';
  sounds.bgm = new Audio('theme_song.mp3');
  sounds.bgm.loop = true;
  sounds.bgm.volume = 0.15;
  sounds.meeting = new Audio(sndPath + 'meeting.mp3');
  sounds.meeting.volume = 0.5;
  sounds.kill = new Audio(sndPath + 'kill.mp3');
  sounds.kill.volume = 0.6;
  sounds.eject = new Audio(sndPath + 'eject.mp3');
  sounds.eject.volume = 0.5;
  sounds.sabotage = new Audio(sndPath + 'sabotage.mp3');
  sounds.sabotage.volume = 0.35;
  sounds.crewmate_win = new Audio(sndPath + 'crewmate_win.mp3');
  sounds.crewmate_win.volume = 0.6;
  sounds.impostor_win = new Audio(sndPath + 'impostor_win.mp3');
  sounds.impostor_win.volume = 0.6;
  sounds.role_reveal = new Audio(sndPath + 'role_reveal.mp3');
  sounds.role_reveal.volume = 0.5;
  sounds.body_report = new Audio(sndPath + 'body_report.mp3');
  sounds.body_report.volume = 0.5;
  sounds.shh = new Audio(sndPath + 'shh.mp3');
  sounds.shh.volume = 0.5;
  sounds.sus = new Audio(sndPath + 'sus.mp3');
  sounds.sus.volume = 0.4;
  sounds.reactor_alarm = new Audio(sndPath + 'reactor_alarm.mp3');
  sounds.reactor_alarm.volume = 0.3;
  sounds.reactor_alarm.loop = true;
}

function playSound(key) {
  if (isMuted || !sounds[key]) return;
  const s = sounds[key];
  s.currentTime = 0;
  s.play().catch(() => {});
}

function stopSound(key) {
  if (!sounds[key]) return;
  sounds[key].pause();
  sounds[key].currentTime = 0;
}

function stopAllSounds() {
  for (const key of Object.keys(sounds)) {
    stopSound(key);
  }
}

// --- DOM Refs ---
const fileInput       = document.getElementById('fileInput');
const fileName        = document.getElementById('fileName');
const mapSvg          = document.getElementById('mapSvg');
const corridorsG      = document.getElementById('corridors');
const roomsG          = document.getElementById('rooms');
const bodiesG         = document.getElementById('bodies');
const playersG        = document.getElementById('players');
const roundBadge      = document.getElementById('roundNumber');
const gameResultDiv   = document.getElementById('gameResult');
const resultText      = document.getElementById('resultText');
const noFileOverlay   = document.getElementById('noFileOverlay');
const roundInfoTab    = document.getElementById('roundInfo');
const chatLogTab      = document.getElementById('chatLog');
const killFeedTab     = document.getElementById('killFeed');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const playBtn         = document.getElementById('playBtn');
const playIcon        = document.getElementById('playIcon');
const pauseIcon       = document.getElementById('pauseIcon');
const roundSlider     = document.getElementById('roundSlider');
const roundLabel      = document.getElementById('roundLabel');
const speedDown       = document.getElementById('speedDown');
const speedUp         = document.getElementById('speedUp');
const speedLabel      = document.getElementById('speedLabel');
const meetingOverlay  = document.getElementById('meetingOverlay');
const meetingTitle    = document.getElementById('meetingTitle');
const meetingMeta     = document.getElementById('meetingMeta');
const meetingTranscript = document.getElementById('meetingTranscript');
const meetingVoteSection = document.getElementById('meetingVoteSection');
const meetingResult   = document.getElementById('meetingResult');
const meetingVoteTally = document.getElementById('meetingVoteTally');
const muteBtn         = document.getElementById('muteBtn');
const muteIcon        = document.getElementById('muteIcon');
const fullscreenBtn   = document.getElementById('fullscreenBtn');
const rosterStrip     = document.getElementById('rosterStrip');
const rosterPlayers   = document.getElementById('rosterPlayers');
const crewCount       = document.getElementById('crewCount');
const impCount        = document.getElementById('impCount');
const taskFill        = document.getElementById('taskFill');
const taskLabel       = document.getElementById('taskLabel');
const phaseBadge      = document.getElementById('phaseBadge');
const sabotageOverlay = document.getElementById('sabotageOverlay');
const sabotageType    = document.getElementById('sabotageType');
const sabotageCountdown = document.getElementById('sabotageCountdown');
const shakeWrapper    = document.getElementById('shakeWrapper');
const redFlash        = document.getElementById('redFlash');
const eventTicker     = document.getElementById('eventTicker');
const startSplash     = document.getElementById('startSplash');
const splashImpostors = document.getElementById('splashImpostors');
const endScreen       = document.getElementById('endScreen');
const endContent      = document.getElementById('endContent');
const ejectOverlay    = document.getElementById('ejectOverlay');
const ejectCanvas     = document.getElementById('ejectCanvas');
const ejectText       = document.getElementById('ejectText');

// --- Animated Stars ---
function initStars() {
  const canvas = document.getElementById('starsCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const NUM_STARS = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.twinkle += s.twinkleSpeed;
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      // Slow drift
      s.y += s.speed;
      if (s.y > canvas.height + 5) {
        s.y = -5;
        s.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// --- Init ---
function init() {
  initSounds();
  initStars();
  drawMapStatic();
  bindEvents();
}

// ===== MAP DRAWING =====
function roomCenter(name) {
  const r = ROOM_DEFS[name];
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function drawMapStatic() {
  const existingBg = mapSvg.querySelector('.map-bg');
  if (!existingBg) {
    const bg = createSvgEl('image', {
      href: 'map.png',
      x: 0, y: 0,
      width: 836, height: 470,
      class: 'map-bg',
      preserveAspectRatio: 'xMidYMid meet',
    });
    mapSvg.insertBefore(bg, mapSvg.firstChild);
  }

  corridorsG.innerHTML = '';
  roomsG.innerHTML = '';
  for (const [name, def] of Object.entries(ROOM_DEFS)) {
    const g = createSvgEl('g', { 'data-room': name });
    const shape = createSvgEl('rect', {
      x: def.x, y: def.y, width: def.w, height: def.h,
      rx: 4, ry: 4,
      class: 'room-shape',
      id: `room-${name}`,
    });
    g.appendChild(shape);
    roomsG.appendChild(g);
  }
}

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// ===== PLAYER NAMING & COLORS =====
function setupPlayerIdentities() {
  const allRoles = gameData.all_roles || {};
  const teamMapping = gameData.team_mapping || {};
  const pids = Object.keys(allRoles).sort();

  playerColorMap = {};
  playerNameMap = {};

  for (let i = 0; i < pids.length; i++) {
    const pid = pids[i];
    playerColorMap[pid] = PLAYER_COLORS[i % PLAYER_COLORS.length];
    // Use team name if available, otherwise format player id
    if (teamMapping[pid]) {
      playerNameMap[pid] = teamMapping[pid];
    } else {
      playerNameMap[pid] = pid.replace('player_', 'P');
    }
  }
}

function getPlayerDisplayName(pid) {
  return playerNameMap[pid] || pid;
}

function getPlayerColor(pid) {
  return playerColorMap[pid] || '#888';
}

function getPlayerNameColor(pid) {
  const role = (gameData && gameData.all_roles) ? gameData.all_roles[pid] : null;
  return role === 'impostor' ? '#ff3e3e' : getPlayerColor(pid);
}

// ===== GAME DATA =====
function loadGame(data) {
  gameData = data;
  totalRounds = data.game_log.length;
  currentRoundIdx = 0;
  killFeedEntries = [];

  roundSlider.max = totalRounds - 1;
  roundSlider.value = 0;

  noFileOverlay.classList.add('hidden');

  setupPlayerIdentities();

  // Show game result badge
  if (data.winner) {
    gameResultDiv.classList.remove('hidden', 'crewmates-win', 'impostors-win');
    const isCrewWin = data.winner === 'crewmates';
    gameResultDiv.classList.add(isCrewWin ? 'crewmates-win' : 'impostors-win');
    const causeLabel = (data.cause || '').replace(/_/g, ' ');
    resultText.textContent = `${data.winner.toUpperCase()} WIN — ${causeLabel.toUpperCase()}`;
  } else {
    gameResultDiv.classList.add('hidden');
  }

  // Build roster
  buildRoster();
  rosterStrip.classList.remove('hidden');

  // Show start splash
  showStartSplash();
}

// ===== START SPLASH =====
function showStartSplash() {
  const allRoles = gameData.all_roles || {};
  const impostors = Object.entries(allRoles).filter(([, r]) => r === 'impostor').map(([pid]) => pid);

  splashImpostors.innerHTML = '';
  for (const pid of impostors) {
    const card = document.createElement('div');
    card.className = 'splash-impostor-card';
    card.style.borderColor = '#ff3e3e';
    card.style.color = '#ff3e3e';
    card.textContent = getPlayerDisplayName(pid);
    splashImpostors.appendChild(card);
  }

  startSplash.classList.remove('hidden');
  playSound('shh');

  setTimeout(() => {
    playSound('role_reveal');
  }, 1200);

  setTimeout(() => {
    startSplash.classList.add('hidden');
    // Start BGM
    if (!isMuted && sounds.bgm) {
      sounds.bgm.play().catch(() => {});
    }
    updateDisplay();
  }, 4500);
}

// ===== ROSTER =====
function buildRoster() {
  const allRoles = gameData.all_roles || {};
  const pids = Object.keys(allRoles).sort();
  rosterPlayers.innerHTML = '';

  for (const pid of pids) {
    const item = document.createElement('div');
    item.className = 'roster-item';
    item.id = `roster-${pid}`;
    item.innerHTML = `
      <span class="roster-color-dot" style="background:${getPlayerColor(pid)}"></span>
      <span class="roster-name" style="color:${getPlayerNameColor(pid)}">${escapeHtml(getPlayerDisplayName(pid))}</span>
      <span class="roster-location"></span>
    `;
    rosterPlayers.appendChild(item);
  }
}

function updateRoster(state) {
  const alivePlayers = state.alive_players || [];
  const playerLocs = state.player_locations || {};

  for (const pid of Object.keys(gameData.all_roles || {})) {
    const item = document.getElementById(`roster-${pid}`);
    if (!item) continue;
    const isAlive = alivePlayers.includes(pid);
    item.classList.toggle('dead', !isAlive);
    const locEl = item.querySelector('.roster-location');
    if (locEl) {
      locEl.textContent = playerLocs[pid] ? `@ ${playerLocs[pid]}` : '';
    }
  }
}

// ===== ALIVE COUNTER & TASK PROGRESS =====
function updateCounters(state) {
  const allRoles = gameData.all_roles || {};
  const alive = state.alive_players || [];
  let crews = 0, imps = 0;
  for (const pid of alive) {
    if (allRoles[pid] === 'impostor') imps++;
    else crews++;
  }
  crewCount.textContent = `${crews} Crew`;
  impCount.textContent = `${imps} Imp`;

  // Task progress (estimated from game log if available)
  const taskProg = state.task_progress;
  if (taskProg !== undefined && taskProg !== null) {
    const pct = Math.round(taskProg * 100);
    taskFill.style.width = pct + '%';
    taskLabel.textContent = `Tasks: ${pct}%`;
  }
}

// ===== DISPLAY UPDATE =====
function updateDisplay() {
  if (!gameData) return;
  const log = gameData.game_log[currentRoundIdx];
  const state = log.state || {};
  const rNum = log.round || currentRoundIdx + 1;
  const lastRound = gameData.game_log[totalRounds - 1].round || totalRounds;

  // Round badge
  roundBadge.textContent = String(rNum).padStart(2, '0');
  roundLabel.textContent = `${rNum} / ${lastRound}`;
  roundSlider.value = currentRoundIdx;

  // Show/hide game result only on last round
  if (gameData.winner) {
    gameResultDiv.classList.toggle('hidden', currentRoundIdx !== totalRounds - 1);
  }

  // Phase badge
  const hasMeeting = (gameData.meeting_history || []).some(m => m.round_called === rNum);
  phaseBadge.classList.remove('hidden', 'task-phase', 'meeting-phase');
  if (hasMeeting) {
    phaseBadge.classList.add('meeting-phase');
    phaseBadge.textContent = 'MEETING';
  } else {
    phaseBadge.classList.add('task-phase');
    phaseBadge.textContent = 'TASK PHASE';
  }

  // Sabotage overlay
  const sab = state.sabotage;
  if (sab && sab.type) {
    sabotageOverlay.classList.remove('hidden');
    sabotageOverlay.classList.add('active');
    sabotageType.textContent = `SABOTAGE: ${sab.type.toUpperCase()}`;
    if (sab.countdown !== undefined && sab.countdown !== null) {
      sabotageCountdown.textContent = `${sab.countdown}s`;
    } else {
      sabotageCountdown.textContent = '';
    }
    // Play reactor alarm if critical sabotage
    if (['reactor', 'o2'].includes(sab.type) && !sounds.reactor_alarm.paused === false) {
      if (sounds.reactor_alarm.paused) playSound('reactor_alarm');
    }
  } else {
    sabotageOverlay.classList.add('hidden');
    sabotageOverlay.classList.remove('active');
    stopSound('reactor_alarm');
  }

  updateRoomStates(state);
  updateBodies(state);
  updatePlayers(state);
  updateRoundInfo(log);
  updateChatTranscript(rNum);
  updateRoster(state);
  updateCounters(state);

  // Detect events for kill feed & animations
  detectEvents(log, rNum);
}

// ===== EVENT DETECTION =====
let prevAlivePlayers = null;

function detectEvents(log, rNum) {
  const state = log.state || {};
  const actions = log.actions || {};
  const results = log.results || {};
  const currentAlive = state.alive_players || [];

  // Detect kills
  for (const [pid, act] of Object.entries(actions)) {
    if (act.action === 'kill' && results[pid] && results[pid].success) {
      const victim = act.target;
      const entry = {
        type: 'kill',
        round: rNum,
        text: `${getPlayerDisplayName(pid)} killed ${getPlayerDisplayName(victim)}`,
        icon: '\u2620',
      };
      addKillFeedEntry(entry);
      addTickerEvent(entry.text, 'kill-event');

      // Animations
      triggerScreenShake();
      triggerRedFlash();
      playSound('kill');
    }

    if (act.action === 'report' && results[pid] && results[pid].success) {
      addTickerEvent(`${getPlayerDisplayName(pid)} reported a body!`, 'meeting-event');
      playSound('body_report');
    }

    if (act.action === 'call_emergency' && results[pid] && results[pid].success) {
      addTickerEvent(`${getPlayerDisplayName(pid)} called an emergency meeting!`, 'meeting-event');
    }

    if (act.action === 'sabotage' && results[pid] && results[pid].success) {
      const sabType = (act.target || 'unknown').toUpperCase();
      addKillFeedEntry({
        type: 'sabotage',
        round: rNum,
        text: `${getPlayerDisplayName(pid)} sabotaged ${sabType}`,
        icon: '\u26A0',
      });
      addTickerEvent(`SABOTAGE: ${sabType} activated!`, 'sabotage-event');
      playSound('sabotage');
    }
  }

  // Detect ejections from meetings at this round
  const meetings = (gameData.meeting_history || []).filter(m => m.round_called === rNum);
  for (const m of meetings) {
    if (m.voted_out) {
      const roleLabel = m.role_revealed ? ` (${m.role_revealed})` : '';
      addKillFeedEntry({
        type: 'eject',
        round: rNum,
        text: `${getPlayerDisplayName(m.voted_out)} was ejected${roleLabel}`,
        icon: '\u{1F680}',
      });
    }
  }

  prevAlivePlayers = [...currentAlive];
}

function addKillFeedEntry(entry) {
  // Avoid duplicates
  const exists = killFeedEntries.some(e =>
    e.type === entry.type && e.round === entry.round && e.text === entry.text
  );
  if (exists) return;
  killFeedEntries.push(entry);
  renderKillFeed();
}

function renderKillFeed() {
  let html = '';
  const entries = [...killFeedEntries].reverse();
  for (const e of entries) {
    html += `
      <div class="feed-entry ${e.type}">
        <span class="feed-icon">${e.icon}</span>
        <span class="feed-text">${escapeHtml(e.text)}</span>
        <span class="feed-round">R${e.round}</span>
      </div>
    `;
  }
  killFeedTab.innerHTML = html || '<div class="tab-placeholder">No events yet</div>';
}

// ===== TICKER =====
function addTickerEvent(text, className) {
  const item = document.createElement('div');
  item.className = `ticker-item ${className || ''}`;
  item.textContent = text;
  eventTicker.appendChild(item);

  // Remove old items (keep max 4)
  while (eventTicker.children.length > 4) {
    eventTicker.removeChild(eventTicker.firstChild);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (item.parentNode) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(-10px)';
      item.style.transition = 'all 0.3s';
      setTimeout(() => item.remove(), 300);
    }
  }, 5000);
}

// ===== SCREEN EFFECTS =====
function triggerScreenShake() {
  shakeWrapper.classList.add('shaking');
  setTimeout(() => shakeWrapper.classList.remove('shaking'), 500);
}

function triggerRedFlash() {
  redFlash.classList.add('active');
  setTimeout(() => redFlash.classList.remove('active'), 700);
}

// ===== ROOM STATES =====
function updateRoomStates(state) {
  const sab = state.sabotage;
  const sabRooms = sab ? Object.keys(sab.fix_progress || {}) : [];
  const bodyRooms = (state.bodies || []).map(b => b.location);

  for (const name of Object.keys(ROOM_DEFS)) {
    const shape = document.getElementById(`room-${name}`);
    if (!shape) continue;
    shape.classList.toggle('sabotaged', sabRooms.includes(name));
    shape.classList.toggle('has-body', bodyRooms.includes(name));
  }
}

// ===== BODIES =====
function updateBodies(state) {
  bodiesG.innerHTML = '';
  const bodies = state.bodies || [];
  const byRoom = {};
  for (const b of bodies) {
    if (!byRoom[b.location]) byRoom[b.location] = [];
    byRoom[b.location].push(b);
  }

  for (const [room, bs] of Object.entries(byRoom)) {
    if (!ROOM_DEFS[room]) continue;
    const center = roomCenter(room);
    const g = createSvgEl('g', { class: 'body-marker' });

    const circle = createSvgEl('circle', {
      cx: center.x, cy: center.y + 18,
      r: 10,
      fill: 'rgba(255,0,64,0.25)',
      stroke: '#ff0040',
      'stroke-width': 1.5,
    });
    g.appendChild(circle);

    const skull = createSvgEl('text', {
      x: center.x, y: center.y + 19,
      class: 'body-skull',
    });
    skull.textContent = '\u2620';
    g.appendChild(skull);

    if (bs.length > 1) {
      const countLabel = createSvgEl('text', {
        x: center.x + 12, y: center.y + 14,
        fill: '#ff0040',
        'font-size': '10',
        'font-weight': '700',
        'font-family': 'var(--font-mono)',
      });
      countLabel.textContent = `\u00D7${bs.length}`;
      g.appendChild(countLabel);
    }

    bodiesG.appendChild(g);
  }
}

// ===== PLAYERS =====
function updatePlayers(state) {
  const playerLocs = state.player_locations || {};
  const alivePlayers = state.alive_players || [];

  const roomStacks = {};
  for (const [pid, loc] of Object.entries(playerLocs)) {
    if (!roomStacks[loc]) roomStacks[loc] = [];
    roomStacks[loc].push(pid);
  }

  const existingGroups = playersG.querySelectorAll('.player-group');
  const currentPids = new Set(Object.keys(playerLocs));
  existingGroups.forEach(g => {
    if (!currentPids.has(g.dataset.pid)) g.remove();
  });

  for (const [loc, pids] of Object.entries(roomStacks)) {
    if (!ROOM_DEFS[loc]) continue;
    const center = roomCenter(loc);

    pids.sort();
    const cols = Math.min(pids.length, 4);

    for (let i = 0; i < pids.length; i++) {
      const pid = pids[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (col - (cols - 1) / 2) * 28;
      const offsetY = row * 28 + 16;

      const tx = center.x + offsetX;
      const ty = center.y + offsetY;

      const isAlive = alivePlayers.includes(pid);
      const color = getPlayerColor(pid);

      let group = playersG.querySelector(`[data-pid="${pid}"]`);
      if (!group) {
        group = createPlayerToken(pid, color);
        playersG.appendChild(group);
      }

      group.setAttribute('transform', `translate(${tx}, ${ty})`);
      group.classList.toggle('dead', !isAlive);

      const body = group.querySelector('.player-body');
      if (body && isAlive) body.setAttribute('fill', color);

      // Update label to team name
      const label = group.querySelector('.player-label');
      if (label) {
        const displayName = getPlayerDisplayName(pid);
        // Truncate long names
        label.textContent = displayName.length > 10 ? displayName.substring(0, 9) + '..' : displayName;
      }
    }
  }
}

function createPlayerToken(pid, color) {
  const g = createSvgEl('g', {
    class: 'player-group',
    'data-pid': pid,
  });

  const body = createSvgEl('rect', {
    x: -9, y: -11, width: 18, height: 20, rx: 7, ry: 7,
    class: 'player-body',
    fill: color,
  });
  g.appendChild(body);

  const visor = createSvgEl('ellipse', {
    cx: 4, cy: -4, rx: 5, ry: 3.5,
    class: 'player-visor',
  });
  g.appendChild(visor);

  const backpack = createSvgEl('rect', {
    x: -13, y: -4, width: 5, height: 10, rx: 2.5, ry: 2.5,
    fill: color, opacity: 0.7,
    class: 'player-body',
  });
  g.appendChild(backpack);

  const label = createSvgEl('text', {
    x: 0, y: 20,
    class: 'player-label',
  });
  const displayName = getPlayerDisplayName(pid);
  label.textContent = displayName.length > 10 ? displayName.substring(0, 9) + '..' : displayName;
  g.appendChild(label);

  return g;
}

// ===== ROUND INFO =====
function updateRoundInfo(log) {
  const actions = log.actions || {};
  const results = log.results || {};

  let html = '';
  for (const pid of Object.keys(actions).sort()) {
    const act = actions[pid];
    const res = results[pid] || {};
    const isSuccess = res.success;
    const statusClass = isSuccess ? 'success' : 'fail';
    const statusText = isSuccess ? 'SUCCESS' : `FAILED \u2014 ${res.reason || 'unknown'}`;
    const isKill = act.action === 'kill';
    const nameColor = getPlayerNameColor(pid);

    html += `
      <div class="action-entry ${statusClass}${isKill ? ' kill-action' : ''}">
        <div class="action-player" style="color:${nameColor}">${escapeHtml(getPlayerDisplayName(pid))}</div>
        <div class="action-detail">${act.action}${act.target ? ' \u2192 ' + escapeHtml(getPlayerDisplayName(act.target) || act.target) : ''}</div>
        <div class="action-result ${statusClass}">${statusText}</div>
      </div>
    `;
  }

  roundInfoTab.innerHTML = html || '<div class="tab-placeholder">No actions this round</div>';
}

// ===== CHAT TRANSCRIPT =====
function updateChatTranscript(roundNum) {
  const meetings = gameData.meeting_history || [];
  const currentMeetings = meetings.filter(m => m.round_called === roundNum);

  if (currentMeetings.length === 0) {
    chatLogTab.innerHTML = '<div class="no-meeting">No meeting this round.</div>';
    return;
  }

  let html = '';
  for (const m of currentMeetings) {
    html += `<div class="chat-header">EMERGENCY MEETING \u2014 ROUND ${roundNum}</div>`;
    html += `<div class="chat-meta">
      Trigger: <strong>${m.trigger}</strong> &nbsp;|&nbsp; Called by: <strong>${escapeHtml(getPlayerDisplayName(m.called_by))}</strong>
      ${m.body_found ? `<br>Body found: <strong>${escapeHtml(getPlayerDisplayName(m.body_found))}</strong> in <strong>${m.body_location}</strong>` : ''}
    </div>`;

    const transcript = m.transcript || [];
    for (const msg of transcript) {
      const nameColor = getPlayerNameColor(msg.speaker);
      const dotColor = getPlayerColor(msg.speaker);
      html += `
        <div class="chat-msg" style="border-left-color:${dotColor}">
          <div class="chat-speaker" style="color:${nameColor}">
            ${escapeHtml(getPlayerDisplayName(msg.speaker))}
            <span class="chat-rotation">R${msg.rotation}</span>
          </div>
          <div class="chat-text">${escapeHtml(msg.message)}</div>
        </div>
      `;
    }

    let resultLabel = 'NO EJECTION \u2014 SKIPPED';
    if (m.voted_out) {
      resultLabel = `${escapeHtml(getPlayerDisplayName(m.voted_out))} EJECTED${m.role_revealed ? ` (${m.role_revealed})` : ''}`;
    }
    html += `<div class="chat-vote-result">${resultLabel}</div>`;

    if (m.vote_tally) {
      html += '<div class="vote-tally">';
      for (const [target, count] of Object.entries(m.vote_tally)) {
        const tName = target === 'skip' ? 'Skip' : escapeHtml(getPlayerDisplayName(target));
        html += `<span class="vote-tally-item">${tName}: <span class="vote-count">${count}</span></span>`;
      }
      html += '</div>';
    }
  }

  chatLogTab.innerHTML = html;
}

// ===== MEETING OVERLAY (Auto-flowing) =====
let meetingTimers = []; // track ALL pending timers for clean teardown

function clearMeetingTimers() {
  for (const t of meetingTimers) clearTimeout(t);
  meetingTimers = [];
}

function addMeetingTimer(fn, delay) {
  const id = setTimeout(fn, delay);
  meetingTimers.push(id);
  return id;
}

function showMeeting(meeting) {
  // Clean up any previous meeting state
  clearMeetingTimers();
  meetingOverlay.classList.remove('hidden');
  meetingVoteSection.classList.add('hidden');

  // Lower BGM volume during meeting
  if (sounds.bgm) sounds.bgm.volume = 0.05;

  // Play meeting sound
  playSound('meeting');

  const triggerLabel = meeting.trigger === 'body_report' ? 'BODY REPORTED' : 'EMERGENCY MEETING';
  meetingTitle.textContent = triggerLabel;

  meetingMeta.innerHTML = `
    Round <strong>${meeting.round_called}</strong> &nbsp;|&nbsp;
    Called by: <strong>${escapeHtml(getPlayerDisplayName(meeting.called_by))}</strong>
    ${meeting.body_found ? `<br>Body: <strong>${escapeHtml(getPlayerDisplayName(meeting.body_found))}</strong> in <strong>${meeting.body_location}</strong>` : ''}
  `;

  // Build all messages hidden initially
  const transcript = meeting.transcript || [];
  let tHtml = '';
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    const nameColor = getPlayerNameColor(msg.speaker);
    const dotColor = getPlayerColor(msg.speaker);
    tHtml += `
      <div class="meeting-msg" data-msg-idx="${i}" style="border-left-color:${dotColor}">
        <div class="msg-speaker" style="color:${nameColor}">
          ${escapeHtml(getPlayerDisplayName(msg.speaker))}
          <span class="msg-rotation">R${msg.rotation}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.message)}</div>
      </div>
    `;
  }
  meetingTranscript.innerHTML = tHtml;
  meetingTranscript.scrollTop = 0;

  // Calculate per-message delay for good pacing
  // Target: entire discussion takes ~12-20 seconds regardless of message count
  // At 1x speed, aim for ~15s total discussion time
  const totalTargetMs = 15000 / Math.max(0.5, playSpeed);
  const perMsgDelay = Math.max(200, Math.min(1500, totalTargetMs / Math.max(1, transcript.length)));

  // Schedule each message reveal at staggered times
  const startDelay = 800; // initial pause after header appears

  for (let i = 0; i < transcript.length; i++) {
    const revealTime = startDelay + (i * perMsgDelay);
    addMeetingTimer(() => {
      const msgEl = meetingTranscript.querySelector(`[data-msg-idx="${i}"]`);
      if (msgEl) {
        msgEl.classList.add('visible');
        // Scroll just enough to bring this message into view at the bottom
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, revealTime);
  }

  // After all messages revealed, show vote result
  const allMsgsTime = startDelay + (transcript.length * perMsgDelay) + 1200;
  addMeetingTimer(() => showVoteResult(meeting), allMsgsTime);
}

function showVoteResult(meeting) {
  meetingVoteSection.classList.remove('hidden');

  // Scroll vote section into view
  meetingVoteSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  let rText = 'NO EJECTION \u2014 SKIPPED';
  if (meeting.voted_out) {
    rText = `${getPlayerDisplayName(meeting.voted_out).toUpperCase()} EJECTED`;
    if (meeting.role_revealed) {
      rText += ` (${meeting.role_revealed.toUpperCase()})`;
    }
  }
  meetingResult.textContent = rText;

  // Vote tally
  let tallyHtml = '';
  if (meeting.vote_tally) {
    for (const [target, count] of Object.entries(meeting.vote_tally)) {
      const tName = target === 'skip' ? 'Skip' : escapeHtml(getPlayerDisplayName(target));
      tallyHtml += `<span class="vote-tally-item">${tName}: <span class="vote-count">${count}</span></span>`;
    }
  }
  meetingVoteTally.innerHTML = tallyHtml;

  // After showing vote, either show ejection or dismiss
  const holdTime = 2500 / Math.max(0.5, playSpeed);
  addMeetingTimer(() => {
    hideMeeting();
    if (meeting.voted_out) {
      showEjection(meeting);
    } else {
      resumeAfterMeeting();
    }
  }, holdTime);
}

function hideMeeting() {
  meetingOverlay.classList.add('hidden');
  clearMeetingTimers();
  // Restore BGM volume
  if (sounds.bgm) sounds.bgm.volume = 0.15;
}

// ===== EJECTION ANIMATION =====
function showEjection(meeting) {
  ejectOverlay.classList.remove('hidden');
  playSound('eject');

  const pid = meeting.voted_out;
  const name = getPlayerDisplayName(pid);
  const color = getPlayerColor(pid);
  const roleRevealed = meeting.role_revealed;

  let text = `${name} was ejected.`;
  if (roleRevealed) {
    text = `${name} was ${roleRevealed === 'impostor' ? 'An Impostor' : 'not An Impostor'}.`;
  }
  ejectText.textContent = text;
  ejectText.style.color = roleRevealed === 'impostor' ? '#ff3e3e' : '#4dc9f6';

  // Draw ejection starfield + floating character
  const ctx = ejectCanvas.getContext('2d');
  ejectCanvas.width = window.innerWidth;
  ejectCanvas.height = window.innerHeight;

  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * ejectCanvas.width,
      y: Math.random() * ejectCanvas.height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 3 + 1,
    });
  }

  let charX = ejectCanvas.width * 0.3;
  let charY = ejectCanvas.height * 0.5;
  let charAngle = 0;
  let frame = 0;

  function drawEject() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ejectCanvas.width, ejectCanvas.height);

    // Stars scrolling
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
      ctx.fill();
      s.x -= s.speed;
      if (s.x < -5) { s.x = ejectCanvas.width + 5; s.y = Math.random() * ejectCanvas.height; }
    }

    // Draw the character floating and spinning
    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(charAngle);

    // Body (rounded rect via arc)
    ctx.fillStyle = color;
    ctx.beginPath();
    drawRoundRect(ctx, -20, -25, 40, 45, 15);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#a8e6ff';
    ctx.beginPath();
    ctx.ellipse(8, -10, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    drawRoundRect(ctx, -28, -8, 10, 22, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();

    charX += 1.5;
    charY += Math.sin(frame * 0.03) * 0.8;
    charAngle += 0.04;
    frame++;

    if (frame < 180) {
      requestAnimationFrame(drawEject);
    }
  }
  drawEject();

  // Dismiss ejection after animation
  setTimeout(() => {
    ejectOverlay.classList.add('hidden');
    resumeAfterMeeting();
  }, 6000);
}

function resumeAfterMeeting() {
  if (isPlaying) {
    scheduleNext();
  }
}

// ===== END SCREEN =====
function showEndScreen() {
  if (!gameData || !gameData.winner) return;

  const isCrewWin = gameData.winner === 'crewmates';
  endScreen.classList.remove('hidden', 'crew-win', 'imp-win');
  endScreen.classList.add(isCrewWin ? 'crew-win' : 'imp-win');

  // Stop BGM, play win sound
  stopSound('bgm');
  playSound(isCrewWin ? 'crewmate_win' : 'impostor_win');

  const causeLabel = (gameData.cause || '').replace(/_/g, ' ').toUpperCase();
  const allRoles = gameData.all_roles || {};

  let rolesHtml = '';
  const sorted = Object.entries(allRoles).sort((a, b) => {
    if (a[1] === 'impostor' && b[1] !== 'impostor') return -1;
    if (a[1] !== 'impostor' && b[1] === 'impostor') return 1;
    return a[0].localeCompare(b[0]);
  });

  for (const [pid, role] of sorted) {
    const cardClass = role === 'impostor' ? 'impostor-card' : 'crewmate-card';
    rolesHtml += `<div class="end-role-card ${cardClass}" style="border-color:${getPlayerNameColor(pid)}">
      <span style="color:${getPlayerNameColor(pid)}">${escapeHtml(getPlayerDisplayName(pid))}</span>
      <span style="opacity:0.6;margin-left:6px">${role}</span>
    </div>`;
  }

  endContent.innerHTML = `
    <div class="end-title">${isCrewWin ? 'CREWMATES WIN' : 'IMPOSTORS WIN'}</div>
    <div class="end-cause">${causeLabel}</div>
    <div class="end-roles">${rolesHtml}</div>
    <button class="end-dismiss" onclick="document.getElementById('endScreen').classList.add('hidden')">DISMISS</button>
  `;
}

// ===== PLAYBACK =====
function play() {
  isPlaying = true;
  playBtn.classList.add('playing');
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
  scheduleNext();
}

function pause() {
  isPlaying = false;
  playBtn.classList.remove('playing');
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  clearTimeout(playTimer);
}

function togglePlay() {
  if (isPlaying) pause();
  else play();
}

function scheduleNext() {
  clearTimeout(playTimer);
  if (!isPlaying) return;

  // Smart pacing: faster for boring rounds, slower for action
  let delay = Math.max(200, playSpeed * 1000);

  playTimer = setTimeout(() => {
    if (currentRoundIdx < totalRounds - 1) {
      currentRoundIdx++;
      updateDisplay();

      // Check for meeting — auto-show
      const rNum = gameData.game_log[currentRoundIdx].round || currentRoundIdx + 1;
      const meeting = (gameData.meeting_history || []).find(m => m.round_called === rNum);
      if (meeting) {
        // Don't pause — the meeting overlay will handle flow
        showMeeting(meeting);
        return; // Don't schedule next — meeting will call resumeAfterMeeting
      }

      // Check if last round — show end screen
      if (currentRoundIdx === totalRounds - 1) {
        setTimeout(() => showEndScreen(), 1500);
        pause();
        return;
      }

      scheduleNext();
    } else {
      pause();
    }
  }, delay);
}

function goToRound(idx) {
  currentRoundIdx = Math.max(0, Math.min(totalRounds - 1, idx));
  updateDisplay();
}

function setSpeed(val) {
  playSpeed = Math.max(0.2, Math.min(3.0, val));
  speedLabel.textContent = `${playSpeed.toFixed(1)}x`;
}

// ===== EVENTS =====
function bindEvents() {
  // File load
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        loadGame(data);
      } catch (err) {
        alert('Failed to parse JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Controls
  prevBtn.addEventListener('click', () => { if (currentRoundIdx > 0) { currentRoundIdx--; updateDisplay(); } });
  nextBtn.addEventListener('click', () => { if (currentRoundIdx < totalRounds - 1) { currentRoundIdx++; updateDisplay(); } });
  playBtn.addEventListener('click', togglePlay);
  roundSlider.addEventListener('input', (e) => goToRound(parseInt(e.target.value)));
  speedDown.addEventListener('click', () => setSpeed(playSpeed + 0.2));
  speedUp.addEventListener('click', () => setSpeed(playSpeed - 0.2));

  // Mute
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteIcon.textContent = isMuted ? '\u{1F507}' : '\u{1F50A}';
    if (isMuted) {
      stopAllSounds();
    } else {
      // Resume BGM if game is loaded
      if (gameData && sounds.bgm) sounds.bgm.play().catch(() => {});
    }
  });

  // Fullscreen
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const wasMeetingOpen = !meetingOverlay.classList.contains('hidden');
      const wasEjectOpen = !ejectOverlay.classList.contains('hidden');
      hideMeeting();
      endScreen.classList.add('hidden');
      ejectOverlay.classList.add('hidden');
      startSplash.classList.add('hidden');
      // Resume playback if we dismissed a meeting/ejection mid-flow
      if ((wasMeetingOpen || wasEjectOpen) && isPlaying) {
        resumeAfterMeeting();
      }
      return;
    }

    if (!meetingOverlay.classList.contains('hidden')) return;
    if (!gameData) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        pause();
        if (currentRoundIdx > 0) { currentRoundIdx--; updateDisplay(); }
        break;
      case 'ArrowRight':
        e.preventDefault();
        pause();
        if (currentRoundIdx < totalRounds - 1) { currentRoundIdx++; updateDisplay(); }
        break;
      case '+':
      case '=':
        setSpeed(playSpeed - 0.2);
        break;
      case '-':
      case '_':
        setSpeed(playSpeed + 0.2);
        break;
      case 'm':
      case 'M': {
        const rNum = gameData.game_log[currentRoundIdx].round || currentRoundIdx + 1;
        const meeting = (gameData.meeting_history || []).find(m => m.round_called === rNum);
        if (meeting) showMeeting(meeting);
        break;
      }
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'r':
      case 'R':
        // Toggle role reveal in roster
        showingRoles = !showingRoles;
        // This is a spectator feature — we don't implement full role hiding yet
        break;
    }
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ===== UTILS =====
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== START =====
init();
