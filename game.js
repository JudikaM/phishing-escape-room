(function () {

  "use strict";



  var LEVEL_COUNT = 3;

  var LEVEL_DURATION_SECONDS = 120;

  var INITIAL_LIVES = 3;

  var POINTS_PER_CORRECT = 100;

  var BEST_SCORE_KEY = "phishing_escape_room_best_score";

  var PROGRESS_KEY = "phishing_escape_room_cleared_doors";

  var PERSIST_PROGRESS = true;



  var CATEGORY_LABELS = {

    fake_domain: "Fake Domain",

    urgency: "Urgency",

    sensitive_data: "Sensitive Data Request",

    malicious_attachment: "Malicious Attachment",

    fake_prize: "Fake Prize",

    disguised_link: "Disguised Link",

    suspicious_sender: "Suspicious Sender",

    unnatural_language: "Unnatural Language"

  };



  var state = {

    allMessages: [],

    loaded: false,

    screen: "menu",

    phase: "idle",

    level: 1,

    levelQueue: [],

    currentIndex: 0,

    score: 0,

    levelStartScore: 0,

    lives: INITIAL_LIVES,

    timeLeft: LEVEL_DURATION_SECONDS,

    timeLeftMs: LEVEL_DURATION_SECONDS * 1000,

    lastTickTime: null,

    hintAvailable: true,

    hintUsedOnCurrent: false,

    timerId: null,

    missedCategories: {},

    clearedDoors: 0,

    sessionBest: 0,

    selectedMenuIndex: 0,

    currentDoorAnswers: [],

    committedRunAnswers: {},

    soundEnabled: true,

    auditLog: [],

    streak: 0,

    maxStreak: 0,

    totalCorrect: 0,

    threatsNeutralized: 0,

    hintsUsedCount: 0,

    channelSuccess: { email: 0, sms: 0, chat: 0 },

    unlockedBadges: {}

  };



  function byId(id) {

    return document.getElementById(id);

  }

  function createSvgUseIcon(symbolId, className, width, height) {
    var tpl = byId("svg-tpl-icon");
    if (!tpl) return document.createElement("span");
    var node = tpl.cloneNode(true);
    node.removeAttribute("id");
    if (className) node.setAttribute("class", className);
    if (width) node.setAttribute("width", String(width));
    if (height) node.setAttribute("height", String(height));
    var use = node.querySelector("use");
    if (use) use.setAttribute("href", symbolId);
    return node;
  }



  var elWebsiteView = byId("website-view");

  var elTerminalView = byId("terminal-view");



  var screens = {

    howto: byId("howto-screen"),

    select: byId("select-screen"),

    game: byId("game-screen"),

    pause: byId("pause-screen"),

    unlocked: byId("unlocked-screen"),

    failed: byId("failed-screen"),

    end: byId("end-screen")

  };



  var elLiveAnnouncer = byId("live-announcer");

  var elStatusBanner = byId("status-banner");

  var elDoorBadges = [byId("door-1"), byId("door-2"), byId("door-3")];



  // Website & Title Menu

  var elNavPlayBtn = byId("nav-play-btn");

  var elBottomPlayBtn = byId("bottom-play-btn");

  var elMobileMenuToggle = byId("mobile-menu-toggle");

  var elSiteNavLinks = byId("site-nav-links");

  var elMenuStart = byId("menu-start-btn");

  var elMenuContinueItem = byId("menu-continue-item");

  var elMenuContinue = byId("menu-continue-btn");

  var elMenuContinueLabel = byId("menu-continue-label");

  var elMenuContinueMeta = byId("menu-continue-meta");

  var elMenuSelect = byId("menu-select-btn");

  var elMenuHowto = byId("menu-howto-btn");

  var elMenuAbout = byId("menu-about-btn");

  var elMenuEncyclopedia = byId("menu-encyclopedia-btn");

  var elMenuBadges = byId("menu-badges-btn");

  var elMenuBadgesMeta = byId("menu-badges-meta");

  var elMenuBest = byId("menu-best-score");

  var elMenuProgress = byId("menu-progress");

  var elMenuStatus = byId("menu-status");

  var elMenuStorageNote = byId("menu-storage-note");



  var elSiteSoundToggle = byId("site-sound-toggle");

  var elTermSoundToggle = byId("term-sound-toggle");

  var elSiteEncyclopediaBtn = byId("site-encyclopedia-btn");

  var elTermEncyclopediaBtn = byId("term-encyclopedia-btn");

  var elBtnFeedbackEncyclopedia = byId("btn-feedback-encyclopedia");

  var elSiteBadgesBtn = byId("site-badges-btn");

  var elTermBadgesBtn = byId("term-badges-btn");

  var elEndBadgesBtn = byId("end-badges-btn");

  var elSiteBadgesCount = byId("site-badges-count");



  var allTitleMenuButtons = [

    elMenuStart,

    elMenuContinue,

    elMenuSelect,

    elMenuHowto,

    elMenuAbout

  ];



  // How to play and select door

  var elHowtoBack = byId("howto-back-btn");

  var elSelectBack = byId("select-back-btn");

  var elDoorCards = [byId("select-door-1"), byId("select-door-2"), byId("select-door-3")];

  var elDoorStatuses = [byId("door-status-1"), byId("door-status-2"), byId("door-status-3")];



  // Game HUD and message

  var elHudLevel = byId("hud-level");

  var elHudProgress = byId("hud-progress");

  var elHudTimer = byId("hud-timer");

  var elHudLives = byId("hud-lives");

  var elHudScore = byId("hud-score");

  var elBtnPause = byId("btn-pause");



  var elMessageTerminal = byId("message-terminal");

  var elTerminalDoorLabel = byId("terminal-door-label");

  var elChannelBadge = byId("msg-channel-badge");

  var elSenderLabel = byId("sender-label");

  var elMsgSender = byId("msg-sender");

  var elMsgSubjectRow = byId("msg-subject-row");

  var elMsgSubject = byId("msg-subject");

  var elMsgBody = byId("msg-body");



  var elHintPanel = byId("hint-panel");

  var elHintText = byId("hint-text");



  var elBtnPhishing = byId("btn-phishing");

  var elBtnSafe = byId("btn-safe");

  var elBtnHint = byId("btn-hint");

  var elBtnContinue = byId("btn-continue");



  var elFeedbackPanel = byId("feedback-panel");

  var elFeedbackVerdict = byId("feedback-verdict");

  var elFeedbackSubtitle = byId("feedback-subtitle");

  var elFeedbackListTitle = byId("feedback-list-title");

  var elFeedbackList = byId("feedback-list");

  var elFeedbackTip = byId("feedback-tip");



  // Pause

  var elPauseDoorNum = byId("pause-door-num");

  var elPauseTime = byId("pause-time");

  var elPauseResume = byId("pause-resume-btn");

  var elPauseRestart = byId("pause-restart-btn");

  var elPauseMenu = byId("pause-menu-btn");



  // Door unlocked

  var elUnlockedDoorNum = byId("unlocked-door-num");

  var elUnlockedNote = byId("unlocked-note");

  var elUnlockedPoints = byId("unlocked-points");

  var elUnlockedBonus = byId("unlocked-bonus");

  var elUnlockedTotal = byId("unlocked-total");

  var elUnlockedNext = byId("unlocked-next-btn");

  var elUnlockedMenu = byId("unlocked-menu-btn");



  // Level failed

  var elFailedDoorNum = byId("failed-door-num");

  var elFailedReason = byId("failed-reason");

  var elFailedNote = byId("failed-note");

  var elFailedRetry = byId("failed-retry-btn");

  var elFailedMenu = byId("failed-menu-btn");



  // End

  var elEndTotalScore = byId("end-total-score");

  var elEndBestScore = byId("end-best-score");

  var elEndMissedCategory = byId("end-missed-category");

  var elEndFalseAlarms = byId("end-false-alarms");

  var elEndCategoryAccuracy = byId("end-category-accuracy");

  var elEndWrongList = byId("end-wrong-list");

  var elEndDetailView = byId("end-detail-view");

  var elReviewDetailTitle = byId("review-detail-title");

  var elReviewDetailClose = byId("review-detail-close");

  var elReviewDetailMeta = byId("review-detail-meta");

  var elReviewDetailBody = byId("review-detail-body");

  var elReviewDetailSignalsTitle = byId("review-detail-signals-title");

  var elReviewDetailSignalsList = byId("review-detail-signals-list");

  var elReviewDetailTip = byId("review-detail-tip");

  var elEndViewFellBtn = byId("end-view-fell-btn");

  var elBtnRestart = byId("btn-restart");

  var elEndMenu = byId("end-menu-btn");



  /* ---------- Helpers ---------- */



  function clearChildren(node) {

    while (node.firstChild) {

      node.removeChild(node.firstChild);

    }

  }



  function setButtonLabel(button, label, keyHint) {

    clearChildren(button);

    button.appendChild(document.createTextNode(keyHint ? label + " " : label));

    if (keyHint) {

      var span = document.createElement("span");

      span.className = "key-hint";

      span.textContent = keyHint;

      button.appendChild(span);

    }

  }



  function focusElement(node, options) {

    if (node && typeof node.focus === "function") {

      try {

        node.focus(options !== undefined ? options : { preventScroll: true });

      } catch (err) {

        node.focus();

      }

    }

  }



  function announce(message) {

    if (!elLiveAnnouncer) {

      return;

    }

    elLiveAnnouncer.textContent = "";

    window.setTimeout(function () {

      elLiveAnnouncer.textContent = message;

    }, 20);

  }



  function formatCategory(category) {

    return CATEGORY_LABELS[category] || category;

  }



  function shuffleArray(items) {

    var copy = items.slice();

    for (var i = copy.length - 1; i > 0; i -= 1) {

      var j = Math.floor(Math.random() * (i + 1));

      var temp = copy[i];

      copy[i] = copy[j];

      copy[j] = temp;

    }

    return copy;

  }



  /* ---------- Storage (always wrapped in try/catch) ---------- */



  function isStorageAvailable() {

    try {

      window.localStorage.getItem(BEST_SCORE_KEY);

      return true;

    } catch (err) {

      return false;

    }

  }



  function readStoredInt(key) {

    try {

      var parsed = parseInt(window.localStorage.getItem(key), 10);

      return isNaN(parsed) || parsed < 0 ? 0 : parsed;

    } catch (err) {

      return 0;

    }

  }



  function writeStoredInt(key, value) {

    try {

      window.localStorage.setItem(key, String(value));

      return true;

    } catch (err) {

      return false;

    }

  }



  function getBestScore() {

    return Math.max(readStoredInt(BEST_SCORE_KEY), state.sessionBest);

  }



  function saveBestScore(score) {

    var next = Math.max(getBestScore(), score);

    state.sessionBest = next;

    writeStoredInt(BEST_SCORE_KEY, next);

    return next;

  }



  function loadClearedDoors() {

    if (!PERSIST_PROGRESS) {

      return 0;

    }

    return Math.min(LEVEL_COUNT, readStoredInt(PROGRESS_KEY));

  }



  function saveClearedDoors() {

    if (!PERSIST_PROGRESS) {

      return;

    }

    writeStoredInt(PROGRESS_KEY, state.clearedDoors);

  }



  /* ---------- Zero-Dependency Web Audio API Sound Effects ---------- */



  var audioCtx = null;



  function getAudioCtx() {

    if (!state.soundEnabled || typeof window === "undefined") {

      return null;

    }

    try {

      if (!audioCtx) {

        var Ctx = window.AudioContext || window.webkitAudioContext;

        if (Ctx) {

          audioCtx = new Ctx();

        }

      }

      if (audioCtx && audioCtx.state === "suspended") {

        audioCtx.resume();

      }

      return audioCtx;

    } catch (e) {

      return null;

    }

  }



  function playSoundInspect() {

    var ctx = getAudioCtx();

    if (!ctx) return;

    try {

      var osc = ctx.createOscillator();

      var gain = ctx.createGain();

      var now = ctx.currentTime;

      osc.type = "sine";

      osc.frequency.setValueAtTime(440, now);

      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.11, now);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);

      gain.connect(ctx.destination);

      osc.start(now);

      osc.stop(now + 0.09);

    } catch (e) {}

  }



  function playSoundSuccess() {

    var ctx = getAudioCtx();

    if (!ctx) return;

    try {

      var now = ctx.currentTime;

      var notes = [523.25, 659.25, 783.99, 1046.5];

      for (var i = 0; i < notes.length; i += 1) {

        var osc = ctx.createOscillator();

        var gain = ctx.createGain();

        var startTime = now + i * 0.06;

        osc.type = "triangle";

        osc.frequency.setValueAtTime(notes[i], startTime);

        gain.gain.setValueAtTime(0.14, startTime);

        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);

        gain.connect(ctx.destination);

        osc.start(startTime);

        osc.stop(startTime + 0.3);

      }

    } catch (e) {}

  }



  function playSoundFailure() {

    var ctx = getAudioCtx();

    if (!ctx) return;

    try {

      var now = ctx.currentTime;

      var osc = ctx.createOscillator();

      var gain = ctx.createGain();

      osc.type = "sawtooth";

      osc.frequency.setValueAtTime(180, now);

      osc.frequency.linearRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.18, now);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);

      gain.connect(ctx.destination);

      osc.start(now);

      osc.stop(now + 0.36);

    } catch (e) {}

  }



  function playSoundUnlock() {

    var ctx = getAudioCtx();

    if (!ctx) return;

    try {

      var now = ctx.currentTime;

      var osc = ctx.createOscillator();

      var gain = ctx.createGain();

      osc.type = "sine";

      osc.frequency.setValueAtTime(220, now);

      osc.frequency.exponentialRampToValueAtTime(660, now + 0.22);

      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);

      gain.gain.linearRampToValueAtTime(0.15, now + 0.18);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);

      gain.connect(ctx.destination);

      osc.start(now);

      osc.stop(now + 0.5);

    } catch (e) {}

  }



  function syncSoundButtons() {

    var label = state.soundEnabled ? "AUDIO: ON" : "AUDIO: MUTED";

    var pressed = state.soundEnabled ? "true" : "false";

    if (elSiteSoundToggle) {

      var sText = elSiteSoundToggle.querySelector(".sound-label");
      if (sText) {
        sText.textContent = label;
      } else {
        elSiteSoundToggle.textContent = label;
      }

      elSiteSoundToggle.setAttribute("aria-pressed", pressed);

      elSiteSoundToggle.classList.toggle("is-muted", !state.soundEnabled);

    }

    if (elTermSoundToggle) {

      var tText = elTermSoundToggle.querySelector(".sound-label");
      if (tText) {
        tText.textContent = label;
      } else {
        elTermSoundToggle.textContent = label;
      }

      elTermSoundToggle.setAttribute("aria-pressed", pressed);

      elTermSoundToggle.classList.toggle("is-muted", !state.soundEnabled);

    }

  }



  function toggleSound() {

    state.soundEnabled = !state.soundEnabled;

    syncSoundButtons();

    if (state.soundEnabled) {

      playSoundInspect();

      announce("Audio effects enabled.");

    } else {

      announce("Audio effects muted.");

    }

  }




  /* ==================== ZERO-G ARENA (PRACTICE SANDBOX) ==================== */
  // A standalone, tactile practice mini-game: drag or fling floating message cards
  // into Quarantine (phishing) or the Safe Vault (legitimate). Points earned here
  // stay inside the arena and never change the run score, best score, audit log,
  // or badges, so the main game cannot be farmed through the sandbox.

  var ARENA_DECK_SIZE = 10;
  var ARENA_POINTS = 100;
  var ARENA_STREAK_STEP = 10;
  var ARENA_STREAK_CAP = 50;
  var ARENA_THROW_MS = 1600;
  var ARENA_DROP_OVERLAP = 0.28;
  var ARENA_MAGNET_RANGE = 120;
  var ARENA_RESULT_MS = 4600;

  var arena = {
    gravity: "zero",
    bodies: [],
    deck: [],
    deckTotal: 0,
    animId: null,
    lastTs: 0,
    score: 0,
    correct: 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    caught: 0,
    cleared: 0,
    missed: [],
    zones: null,
    drag: null,
    hot: { q: false, s: false },
    resultTimer: null,
    reducedMotion: false,
    returnFocus: null,
    bound: false
  };

  function arenaClamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function isArenaOpen() {
    var elModal = byId("arena-modal");
    return !!(elModal && !elModal.classList.contains("hidden"));
  }

  function arenaNow() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function measureArenaZones() {
    var stage = byId("arena-stage");
    var zoneQ = byId("arena-quarantine-vortex");
    var zoneS = byId("arena-safe-vault");
    if (!stage || !zoneQ || !zoneS) return null;

    var sr = stage.getBoundingClientRect();
    if (sr.width < 10 || sr.height < 10) return null;

    function rel(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    }

    var q = rel(zoneQ);
    var s = rel(zoneS);
    var w = sr.width;
    var h = sr.height;
    var pad = 8;
    var play;

    // Detect vertical top/bottom stacking (mobile layout) vs horizontal (desktop)
    var isVertical = Math.abs(q.y - s.y) > 70;

    if (isVertical) {
      var topZone = q.y < s.y ? q : s;
      var bottomZone = q.y < s.y ? s : q;
      var startY = topZone.y + topZone.h + pad;
      var endY = bottomZone.y - pad;
      play = {
        x: pad,
        y: startY,
        w: Math.max(100, w - pad * 2),
        h: Math.max(80, endY - startY)
      };
    } else {
      var left = q.x + q.w + pad;
      var right = s.x - pad;
      play = {
        x: left,
        y: pad,
        w: Math.max(120, right - left),
        h: Math.max(80, h - pad * 2 - 42)
      };
    }

    arena.zones = { q: q, s: s, play: play, w: w, h: h, compact: isVertical || w < 640 };
    return arena.zones;
  }

  function arenaMaxOnStage() {
    var z = arena.zones;
    if (!z) return 3;
    if (z.compact) return 2;
    return z.play.w >= 760 ? 4 : 3;
  }

  function buildArenaDeck() {
    var all = state.allMessages && state.allMessages.length ? state.allMessages : [];
    if (!all.length) return [];

    var phishing = shuffleArray(all.filter(function (m) { return m.is_phishing; }));
    var safe = shuffleArray(all.filter(function (m) { return !m.is_phishing; }));
    var size = Math.min(ARENA_DECK_SIZE, all.length);
    var wantPhishing = Math.min(phishing.length, Math.round(size * 0.6));
    var wantSafe = Math.min(safe.length, size - wantPhishing);

    var deck = phishing.slice(0, wantPhishing).concat(safe.slice(0, wantSafe));
    var leftovers = shuffleArray(phishing.slice(wantPhishing).concat(safe.slice(wantSafe)));
    while (deck.length < size && leftovers.length) {
      deck.push(leftovers.shift());
    }
    return shuffleArray(deck);
  }

  function splitArenaSender(sender) {
    var match = /^(.*?)\s*<([^>]+)>\s*$/.exec(sender || "");
    if (match) {
      return { name: match[1] || match[2], address: match[2] };
    }
    return { name: sender || "Unknown sender", address: "" };
  }

  function appendArenaAddress(parent, address) {
    var at = address.lastIndexOf("@");
    if (at === -1) {
      parent.textContent = address;
      return;
    }
    parent.appendChild(document.createTextNode(address.slice(0, at + 1)));
    var domain = document.createElement("span");
    domain.className = "zg-domain";
    domain.textContent = address.slice(at + 1);
    parent.appendChild(domain);
  }

  function channelLabel(channel) {
    if (channel === "sms") return "SMS";
    if (channel === "chat") return "Chat";
    return "Email";
  }

  function createArenaCard(body) {
    var msg = body.msg;
    var who = splitArenaSender(msg.sender);

    var card = document.createElement("article");
    card.className = "arena-capsule-card zg-card zg-ch-" + msg.channel;
    card.tabIndex = 0;
    card.setAttribute("aria-roledescription", "draggable message card");
    card.setAttribute(
      "aria-label",
      channelLabel(msg.channel) + " from " + msg.sender +
      ". Press Enter to read the full message, P to quarantine as phishing, or S to mark safe."
    );

    var inner = document.createElement("div");
    inner.className = "zg-card-inner";

    var top = document.createElement("div");
    top.className = "zg-card-top";
    var chip = document.createElement("span");
    chip.className = "zg-card-chip";
    var chIconId = msg.channel === "email" ? "#icon-mail" : (msg.channel === "sms" ? "#icon-sms" : "#icon-chat");
    var chipSvg = createSvgUseIcon(chIconId, "zg-chip-svg", 11, 11);
    chip.appendChild(chipSvg);
    var chipText = document.createElement("span");
    chipText.textContent = channelLabel(msg.channel);
    chip.appendChild(chipText);
    top.appendChild(chip);
    var peek = document.createElement("span");
    peek.className = "zg-card-peek";
    peek.textContent = "Tap to read";
    top.appendChild(peek);
    inner.appendChild(top);

    var name = document.createElement("strong");
    name.className = "zg-card-name";
    name.textContent = who.name;
    inner.appendChild(name);

    if (who.address) {
      var addr = document.createElement("div");
      addr.className = "zg-card-addr";
      appendArenaAddress(addr, who.address);
      inner.appendChild(addr);
    }

    if (msg.channel === "email" && msg.subject) {
      var subject = document.createElement("div");
      subject.className = "zg-card-subject";
      subject.textContent = msg.subject;
      inner.appendChild(subject);
    }

    var text = document.createElement("p");
    text.className = "zg-card-body";
    text.textContent = msg.body;
    inner.appendChild(text);

    var foot = document.createElement("div");
    foot.className = "zg-card-foot";
    foot.textContent = "Fling into a zone, or press P (phishing) / S (safe)";
    inner.appendChild(foot);

    card.appendChild(inner);

    card.addEventListener("pointerdown", function (e) {
      onArenaPointerDown(e, body);
    });

    card.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      var key = e.key;
      if (key === "p" || key === "P") {
        e.preventDefault();
        e.stopPropagation();
        classifyArenaBody(body, true);
      } else if (key === "s" || key === "S") {
        e.preventDefault();
        e.stopPropagation();
        classifyArenaBody(body, false);
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        e.stopPropagation();
        toggleArenaCardExpanded(body);
      }
    });

    return card;
  }

  function renderArenaBody(body) {
    if (!body.el) return;
    body.el.style.transform =
      "translate3d(" + body.x.toFixed(1) + "px," + body.y.toFixed(1) + "px,0) rotate(" +
      body.rot.toFixed(2) + "deg) scale(" + body.scale.toFixed(3) + ")";
  }

  function measureArenaBody(body) {
    if (!body.el) return;
    body.w = body.el.offsetWidth || body.w || 200;
    body.h = body.el.offsetHeight || body.h || 110;
  }

  function overlapArea(ax, ay, aw, ah, bx, by, bw, bh) {
    var ox = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
    var oy = Math.min(ay + ah, by + bh) - Math.max(ay, by);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }

  function bringArenaBodyToFront(body) {
    var top = 0;
    for (var i = 0; i < arena.bodies.length; i += 1) {
      top = Math.max(top, arena.bodies[i].z || 0);
    }
    body.z = top + 1;
    if (body.el) body.el.style.zIndex = String(10 + body.z);
  }

  function spawnArenaCard() {
    if (!arena.deck.length) return null;
    var container = byId("arena-capsules-container");
    var z = arena.zones || measureArenaZones();
    if (!container || !z) return null;

    var msg = arena.deck.shift();
    var body = {
      msg: msg,
      x: 0, y: 0, vx: 0, vy: 0,
      rot: 0, vRot: 0, scale: 1,
      w: 0, h: 0, z: 0,
      mode: "free",
      thrownAt: 0,
      absorb: null,
      expanded: false,
      hadFocus: false,
      el: null
    };

    body.el = createArenaCard(body);
    body.el.classList.add("is-spawning");
    container.appendChild(body.el);
    measureArenaBody(body);

    var best = null;
    var bestOverlap = Infinity;
    var spanX = Math.max(1, z.play.w - body.w);
    var spanY = Math.max(1, z.play.h - body.h);
    for (var t = 0; t < 16; t += 1) {
      var cx = z.play.x + Math.random() * spanX;
      var cy = z.play.y + Math.random() * spanY;
      var total = 0;
      for (var i = 0; i < arena.bodies.length; i += 1) {
        var o = arena.bodies[i];
        total += overlapArea(cx - 8, cy - 8, body.w + 16, body.h + 16, o.x, o.y, o.w, o.h);
      }
      if (total < bestOverlap) {
        bestOverlap = total;
        best = { x: cx, y: cy };
        if (total === 0) break;
      }
    }

    body.x = best.x;
    body.y = best.y;
    if (!arena.reducedMotion) {
      body.vx = (Math.random() - 0.5) * 1.1;
      body.vy = (Math.random() - 0.5) * 1.1;
      body.vRot = (Math.random() - 0.5) * 0.25;
      body.rot = (Math.random() - 0.5) * 5;
    }

    arena.bodies.push(body);
    bringArenaBodyToFront(body);
    renderArenaBody(body);

    setTimeout(function () {
      if (body.el) body.el.classList.remove("is-spawning");
    }, 420);

    return body;
  }

  function toggleArenaCardExpanded(body) {
    if (!body.el || body.mode === "absorbing") return;
    var willExpand = !body.expanded;

    for (var i = 0; i < arena.bodies.length; i += 1) {
      var other = arena.bodies[i];
      if (other !== body && other.expanded && other.el) {
        other.expanded = false;
        other.el.classList.remove("is-expanded");
        measureArenaBody(other);
      }
    }

    body.expanded = willExpand;
    body.el.classList.toggle("is-expanded", willExpand);
    measureArenaBody(body);
    bringArenaBodyToFront(body);

    if (willExpand) {
      body.vx = 0;
      body.vy = 0;
      body.vRot = 0;
      body.mode = "free";
      var z = arena.zones;
      if (z) {
        body.x = arenaClamp(body.x, z.play.x, Math.max(z.play.x, z.play.x + z.play.w - body.w));
        body.y = arenaClamp(body.y, z.play.y, Math.max(z.play.y, z.play.y + z.play.h - body.h));
      }
      announce("Reading message from " + body.msg.sender + ". " + body.msg.body);
    }
  }

  function arenaZoneHit(body) {
    var z = arena.zones;
    if (!z) return null;
    var area = Math.max(1, body.w * body.h);
    var oq = overlapArea(body.x, body.y, body.w, body.h, z.q.x, z.q.y, z.q.w, z.q.h) / area;
    var os = overlapArea(body.x, body.y, body.w, body.h, z.s.x, z.s.y, z.s.w, z.s.h) / area;
    var cx = body.x + body.w / 2;
    var cy = body.y + body.h / 2;
    var inQ = cx >= z.q.x && cx <= z.q.x + z.q.w && cy >= z.q.y && cy <= z.q.y + z.q.h;
    var inS = cx >= z.s.x && cx <= z.s.x + z.s.w && cy >= z.s.y && cy <= z.s.y + z.s.h;
    if (inQ || oq >= ARENA_DROP_OVERLAP || inS || os >= ARENA_DROP_OVERLAP) {
      return (inQ ? 1 : 0) + oq >= (inS ? 1 : 0) + os ? "q" : "s";
    }
    return null;
  }

  function distanceToRect(px, py, r) {
    var dx = Math.max(r.x - px, 0, px - (r.x + r.w));
    var dy = Math.max(r.y - py, 0, py - (r.y + r.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  function setArenaZoneHot(key, isHot) {
    if (arena.hot[key] === isHot) return;
    arena.hot[key] = isHot;
    var el = byId(key === "q" ? "arena-quarantine-vortex" : "arena-safe-vault");
    if (el) el.classList.toggle("is-hot", isHot);
  }

  function flashArenaZone(key, isCorrect) {
    var el = byId(key === "q" ? "arena-quarantine-vortex" : "arena-safe-vault");
    if (!el) return;
    var cls = isCorrect ? "is-flash-correct" : "is-flash-wrong";
    el.classList.remove("is-flash-correct", "is-flash-wrong");
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () {
      el.classList.remove(cls);
    }, 700);
  }

  function onArenaPointerDown(e, body) {
    if (body.mode === "absorbing" || arena.drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var stage = byId("arena-stage");
    if (!stage) return;
    e.preventDefault();

    var sr = stage.getBoundingClientRect();
    var px = e.clientX - sr.left;
    var py = e.clientY - sr.top;
    var now = arenaNow();

    arena.drag = {
      body: body,
      id: e.pointerId,
      offX: px - body.x,
      offY: py - body.y,
      lastX: px,
      lastY: py,
      lastT: now,
      startX: px,
      startY: py,
      startT: now,
      moved: false,
      vx: 0,
      vy: 0
    };

    body.mode = "dragging";
    body.vx = 0;
    body.vy = 0;
    body.el.classList.add("is-dragging");
    bringArenaBodyToFront(body);
    try {
      body.el.setPointerCapture(e.pointerId);
    } catch (err) {
      /* pointer capture is optional */
    }
    if (typeof body.el.focus === "function") {
      body.el.focus({ preventScroll: true });
    }
  }

  function onArenaPointerMove(e) {
    var d = arena.drag;
    if (!d || e.pointerId !== d.id) return;
    var stage = byId("arena-stage");
    if (!stage) return;

    var sr = stage.getBoundingClientRect();
    var px = e.clientX - sr.left;
    var py = e.clientY - sr.top;
    var now = arenaNow();
    var dt = Math.max(1, now - d.lastT);

    d.vx = d.vx * 0.45 + ((px - d.lastX) / dt) * 16.67 * 0.55;
    d.vy = d.vy * 0.45 + ((py - d.lastY) / dt) * 16.67 * 0.55;
    d.lastX = px;
    d.lastY = py;
    d.lastT = now;

    if (!d.moved && Math.abs(px - d.startX) + Math.abs(py - d.startY) > 7) {
      d.moved = true;
      if (d.body.expanded) toggleArenaCardExpanded(d.body);
    }

    d.body.x = px - d.offX;
    d.body.y = py - d.offY;
  }

  function onArenaPointerUp(e) {
    var d = arena.drag;
    if (!d || e.pointerId !== d.id) return;
    var body = d.body;
    arena.drag = null;

    if (body.el) {
      body.el.classList.remove("is-dragging");
      try {
        body.el.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* already released */
      }
    }

    if (body.mode !== "dragging") return;

    if (e.type === "pointercancel") {
      body.mode = "free";
      return;
    }

    var now = arenaNow();
    if (!d.moved && now - d.startT < 450) {
      body.mode = "free";
      toggleArenaCardExpanded(body);
      return;
    }

    var zone = arenaZoneHit(body);
    if (zone) {
      classifyArenaBody(body, zone === "q");
      return;
    }

    if (now - d.lastT > 90) {
      d.vx = 0;
      d.vy = 0;
    }

    body.vx = arenaClamp(d.vx, -32, 32);
    body.vy = arenaClamp(d.vy, -32, 32);
    body.vRot = arenaClamp(body.vx * 0.08, -2.2, 2.2);

    if (Math.hypot(body.vx, body.vy) > 3) {
      body.mode = "thrown";
      body.thrownAt = now;
    } else {
      body.mode = "free";
    }
  }

  function updateArenaStats() {
    var elScore = byId("arena-score-val");
    var elAcc = byId("arena-accuracy-val");
    var elStreak = byId("arena-streak-val");
    var elCaught = byId("arena-quarantined-val");
    var elCleared = byId("arena-safe-val");
    var elDeck = byId("arena-deck-val");
    if (elScore) elScore.textContent = String(arena.score);
    if (elAcc) {
      elAcc.textContent = arena.attempts
        ? Math.round((arena.correct / arena.attempts) * 100) + "%"
        : "--";
    }
    if (elStreak) elStreak.textContent = String(arena.streak);
    if (elCaught) elCaught.textContent = String(arena.caught);
    if (elCleared) elCleared.textContent = String(arena.cleared);
    if (elDeck) elDeck.textContent = arena.attempts + " / " + arena.deckTotal;
  }

  function arenaReasonText(msg) {
    if (msg.is_phishing && msg.red_flags && msg.red_flags.length) {
      var flag = msg.red_flags[0];
      return "\u201C" + flag.quote + "\u201D \u2014 " + flag.explanation;
    }
    if (!msg.is_phishing && msg.safe_signals && msg.safe_signals.length) {
      return msg.safe_signals[0];
    }
    return msg.tip || "";
  }

  function showArenaResult(msg, choseQuarantine, isCorrect, points) {
    var el = byId("arena-toast-banner");
    if (!el) return;

    var title;
    if (isCorrect) {
      title = choseQuarantine ? "Threat quarantined" : "Safe message cleared";
    } else {
      title = msg.is_phishing ? "Missed threat: this was phishing" : "False alarm: this message was safe";
    }

    clearChildren(el);
    el.className = "zg-result " + (isCorrect ? "is-correct" : "is-wrong");

    var icon = document.createElement("span");
    icon.className = "zg-result-icon";
    icon.setAttribute("aria-hidden", "true");
    var resSvg = createSvgUseIcon(isCorrect ? "#icon-check" : "#icon-cross", "zg-result-icon-svg", 14, 14);
    icon.appendChild(resSvg);
    el.appendChild(icon);

    var textWrap = document.createElement("div");
    textWrap.className = "zg-result-text";

    var head = document.createElement("div");
    head.className = "zg-result-head";
    var strong = document.createElement("strong");
    strong.className = "zg-result-title";
    strong.textContent = title;
    head.appendChild(strong);
    var pts = document.createElement("span");
    pts.className = "zg-result-points";
    pts.textContent = isCorrect ? "+" + points : "Streak reset";
    head.appendChild(pts);
    textWrap.appendChild(head);

    var reason = arenaReasonText(msg);
    if (reason) {
      var p = document.createElement("p");
      p.className = "zg-result-reason";
      p.textContent = reason;
      textWrap.appendChild(p);
    }

    el.appendChild(textWrap);

    if (arena.resultTimer) clearTimeout(arena.resultTimer);
    arena.resultTimer = setTimeout(function () {
      el.classList.add("hidden");
    }, ARENA_RESULT_MS);

    announce(title + ". " + reason);
  }

  function classifyArenaBody(body, choseQuarantine) {
    if (!body || body.mode === "absorbing") return;
    var z = arena.zones || measureArenaZones();
    if (!z) return;

    if (arena.drag && arena.drag.body === body) {
      arena.drag = null;
      if (body.el) body.el.classList.remove("is-dragging");
    }

    var msg = body.msg;
    var isCorrect = choseQuarantine === msg.is_phishing;
    var points = 0;

    arena.attempts += 1;
    if (isCorrect) {
      arena.correct += 1;
      arena.streak += 1;
      arena.bestStreak = Math.max(arena.bestStreak, arena.streak);
      points = ARENA_POINTS + Math.min(ARENA_STREAK_CAP, (arena.streak - 1) * ARENA_STREAK_STEP);
      arena.score += points;
      if (choseQuarantine) arena.caught += 1;
      else arena.cleared += 1;
      playSoundSuccess();
    } else {
      arena.streak = 0;
      arena.missed.push(msg);
      playSoundFailure();
    }

    var key = choseQuarantine ? "q" : "s";
    var target = z[key];
    body.hadFocus = document.activeElement === body.el;
    body.mode = "absorbing";
    body.expanded = false;
    body.absorb = {
      t0: arenaNow(),
      dur: arena.reducedMotion ? 0 : 460,
      x0: body.x,
      y0: body.y,
      tx: target.x + target.w / 2 - body.w / 2,
      ty: target.y + target.h / 2 - body.h / 2
    };
    if (body.el) {
      body.el.classList.remove("is-expanded");
      body.el.classList.add("is-absorbing", isCorrect ? "is-correct" : "is-wrong");
      body.el.setAttribute("aria-hidden", "true");
      body.el.tabIndex = -1;
    }

    flashArenaZone(key, isCorrect);
    showArenaResult(msg, choseQuarantine, isCorrect, points);
    updateArenaStats();
  }

  function finishArenaAbsorb(body) {
    var idx = arena.bodies.indexOf(body);
    if (idx !== -1) arena.bodies.splice(idx, 1);
    if (body.el && body.el.parentNode) body.el.parentNode.removeChild(body.el);
    body.el = null;

    var spawned = null;
    if (arena.deck.length) {
      spawned = spawnArenaCard();
    }

    if (body.hadFocus) {
      var next = spawned;
      if (!next) {
        for (var i = 0; i < arena.bodies.length; i += 1) {
          if (arena.bodies[i].mode !== "absorbing") {
            next = arena.bodies[i];
            break;
          }
        }
      }
      if (next && next.el) {
        next.el.focus({ preventScroll: true });
      }
    }

    if (!arena.deck.length && arena.bodies.length === 0) {
      setTimeout(showArenaSummary, arena.reducedMotion ? 0 : 450);
    }
  }

  function resolveArenaCollisions() {
    // Card-to-card collisions disabled: floating cards do not bounce off each other,
    // allowing smooth independent zero-g drift and effortless dragging/flinging.
  }

  function updateArenaPhysics(ts) {
    if (!isArenaOpen()) {
      arena.animId = null;
      return;
    }

    var k = arena.lastTs ? arenaClamp((ts - arena.lastTs) / 16.67, 0.25, 2.2) : 1;
    arena.lastTs = ts;

    var z = arena.zones || measureArenaZones();
    if (!z) {
      arena.animId = requestAnimationFrame(updateArenaPhysics);
      return;
    }

    var g = 0;
    if (arena.gravity === "down") g = 0.34;
    else if (arena.gravity === "up") g = -0.34;

    var now = arenaNow();
    var hotQ = false;
    var hotS = false;
    var finished = [];

    for (var i = 0; i < arena.bodies.length; i += 1) {
      var body = arena.bodies[i];
      if (!body.el) continue;

      if (body.mode === "absorbing") {
        var ab = body.absorb;
        var t = ab.dur ? arenaClamp((now - ab.t0) / ab.dur, 0, 1) : 1;
        var e = 1 - Math.pow(1 - t, 3);
        body.x = ab.x0 + (ab.tx - ab.x0) * e;
        body.y = ab.y0 + (ab.ty - ab.y0) * e;
        body.scale = 1 - 0.8 * e;
        body.rot += 6 * k * (1 - e);
        renderArenaBody(body);
        if (t >= 1) finished.push(body);
        continue;
      }

      var cx;
      var cy;

      if (body.mode === "dragging") {
        var d = arena.drag;
        var tilt = d ? arenaClamp(d.vx * 0.6, -9, 9) : 0;
        body.rot += (tilt - body.rot) * 0.25 * k;
        body.scale += (1.04 - body.scale) * 0.3 * k;
        cx = body.x + body.w / 2;
        cy = body.y + body.h / 2;
        if (distanceToRect(cx, cy, z.q) < 40) hotQ = true;
        if (distanceToRect(cx, cy, z.s) < 40) hotS = true;
        renderArenaBody(body);
        continue;
      }

      body.scale += (1 - body.scale) * 0.3 * k;

      if (body.expanded) {
        body.vx *= 0.7;
        body.vy *= 0.7;
        body.rot += (0 - body.rot) * 0.2 * k;
      } else if (body.mode === "thrown") {
        body.vy += g * 0.5 * k;
        cx = body.x + body.w / 2;
        cy = body.y + body.h / 2;
        var dq = distanceToRect(cx, cy, z.q);
        var ds = distanceToRect(cx, cy, z.s);
        var magnet = dq <= ds ? z.q : z.s;
        var dist = Math.min(dq, ds);
        if (dist < ARENA_MAGNET_RANGE) {
          var pull = 0.018 * (1 - dist / ARENA_MAGNET_RANGE) * k;
          body.vx += (magnet.x + magnet.w / 2 - cx) * pull;
          body.vy += (magnet.y + magnet.h / 2 - cy) * pull;
          if (magnet === z.q) hotQ = true;
          else hotS = true;
        }
        body.vx *= Math.pow(0.988, k);
        body.vy *= Math.pow(0.988, k);
      } else {
        body.vy += g * k;
        if (arena.gravity === "zero" && !arena.reducedMotion) {
          body.vx += (Math.random() - 0.5) * 0.03 * k;
          body.vy += (Math.random() - 0.5) * 0.03 * k;
          var speed = Math.hypot(body.vx, body.vy);
          if (speed > 1.6) {
            body.vx *= Math.pow(0.97, k);
            body.vy *= Math.pow(0.97, k);
          }
        } else {
          body.vx *= Math.pow(0.985, k);
          body.vy *= Math.pow(0.992, k);
        }
      }

      body.x += body.vx * k;
      body.y += body.vy * k;
      body.rot += body.vRot * k;
      body.vRot *= Math.pow(0.96, k);
      if (!arena.reducedMotion) body.rot += (0 - body.rot) * 0.01 * k;
      else body.rot = 0;

      if (body.mode === "thrown") {
        var hit = arenaZoneHit(body);
        if (hit) {
          classifyArenaBody(body, hit === "q");
          renderArenaBody(body);
          continue;
        }

        var minTX = 4;
        var maxTX = z.w - body.w - 4;
        var minTY = 4;
        var maxTY = z.h - body.h - 4;
        if (body.x < minTX) { body.x = minTX; body.vx = Math.abs(body.vx) * 0.6; }
        else if (body.x > maxTX) { body.x = maxTX; body.vx = -Math.abs(body.vx) * 0.6; }
        if (body.y < minTY) { body.y = minTY; body.vy = Math.abs(body.vy) * 0.6; }
        else if (body.y > maxTY) { body.y = maxTY; body.vy = -Math.abs(body.vy) * 0.6; }

        if (now - body.thrownAt > ARENA_THROW_MS || Math.hypot(body.vx, body.vy) < 1.1) {
          body.mode = "free";
        }
      } else {
        var minX = z.play.x;
        var maxX = Math.max(minX, z.play.x + z.play.w - body.w);
        var minY = z.play.y;
        var maxY = Math.max(minY, z.play.y + z.play.h - body.h);
        var bounce = arena.gravity === "zero" ? 0.9 : 0.45;

        if (body.x < minX) {
          var gapL = minX - body.x;
          body.x += gapL > 3 ? gapL * 0.22 * k : gapL;
          body.vx = Math.abs(body.vx) * bounce;
        } else if (body.x > maxX) {
          var gapR = body.x - maxX;
          body.x -= gapR > 3 ? gapR * 0.22 * k : gapR;
          body.vx = -Math.abs(body.vx) * bounce;
        }
        if (body.y < minY) {
          var gapT = minY - body.y;
          body.y += gapT > 3 ? gapT * 0.22 * k : gapT;
          body.vy = Math.abs(body.vy) * bounce;
        } else if (body.y > maxY) {
          var gapB = body.y - maxY;
          body.y -= gapB > 3 ? gapB * 0.22 * k : gapB;
          body.vy = -Math.abs(body.vy) * bounce;
        }
      }
    }

    resolveArenaCollisions();

    for (var r = 0; r < arena.bodies.length; r += 1) {
      var rb = arena.bodies[r];
      if (rb.mode !== "absorbing") renderArenaBody(rb);
    }

    setArenaZoneHot("q", hotQ);
    setArenaZoneHot("s", hotS);

    for (var f = 0; f < finished.length; f += 1) {
      finishArenaAbsorb(finished[f]);
    }

    arena.animId = requestAnimationFrame(updateArenaPhysics);
  }

  function showArenaSummary() {
    if (!isArenaOpen()) return;
    var elSummary = byId("arena-summary");
    if (!elSummary) return;

    var accuracy = arena.attempts ? Math.round((arena.correct / arena.attempts) * 100) : 0;
    var title;
    if (accuracy === 100) title = "Flawless triage";
    else if (accuracy >= 80) title = "Sharp eyes, analyst";
    else if (accuracy >= 50) title = "Good start, keep practicing";
    else title = "Keep training: review the misses";

    var elTitle = byId("arena-summary-title");
    var elScore = byId("arena-summary-score");
    var elAcc = byId("arena-summary-accuracy");
    var elStreak = byId("arena-summary-streak");
    var elNote = byId("arena-summary-note");
    var elMissed = byId("arena-summary-missed");

    if (elTitle) elTitle.textContent = title;
    if (elScore) elScore.textContent = String(arena.score);
    if (elAcc) elAcc.textContent = accuracy + "%";
    if (elStreak) elStreak.textContent = String(arena.bestStreak);
    if (elNote) {
      elNote.textContent = arena.correct + " of " + arena.attempts + " messages sorted correctly." +
        (arena.missed.length ? " Messages you missed:" : " No mistakes this round.");
    }

    if (elMissed) {
      clearChildren(elMissed);
      var shown = arena.missed.slice(0, 4);
      for (var i = 0; i < shown.length; i += 1) {
        var msg = shown[i];
        var li = document.createElement("li");
        li.className = msg.is_phishing ? "is-phishing" : "is-safe";
        var head = document.createElement("div");
        head.className = "zg-missed-head";
        var who = document.createElement("strong");
        who.textContent = splitArenaSender(msg.sender).name;
        head.appendChild(who);
        var tag = document.createElement("span");
        tag.className = "zg-missed-tag";
        tag.textContent = msg.is_phishing ? "Was phishing" : "Was safe";
        head.appendChild(tag);
        li.appendChild(head);
        var why = document.createElement("p");
        why.textContent = arenaReasonText(msg);
        li.appendChild(why);
        elMissed.appendChild(li);
      }
      elMissed.classList.toggle("hidden", shown.length === 0);
    }

    elSummary.classList.remove("hidden");
    var elAgain = byId("arena-play-again-btn");
    if (elAgain) focusElement(elAgain);
    announce("Round complete. " + title + ". Accuracy " + accuracy + " percent, score " + arena.score + ".");
  }

  function clearArenaCards() {
    for (var i = 0; i < arena.bodies.length; i += 1) {
      var b = arena.bodies[i];
      if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
      b.el = null;
    }
    arena.bodies = [];
    arena.drag = null;
    var container = byId("arena-capsules-container");
    if (container) clearChildren(container);
  }

  function startArenaRound() {
    clearArenaCards();
    if (arena.resultTimer) clearTimeout(arena.resultTimer);
    var elResult = byId("arena-toast-banner");
    if (elResult) elResult.classList.add("hidden");
    var elSummary = byId("arena-summary");
    if (elSummary) elSummary.classList.add("hidden");

    arena.score = 0;
    arena.correct = 0;
    arena.attempts = 0;
    arena.streak = 0;
    arena.bestStreak = 0;
    arena.caught = 0;
    arena.cleared = 0;
    arena.missed = [];
    setArenaZoneHot("q", false);
    setArenaZoneHot("s", false);

    arena.deck = buildArenaDeck();
    arena.deckTotal = arena.deck.length;

    var elEmpty = byId("arena-empty");
    if (elEmpty) elEmpty.classList.toggle("hidden", arena.deckTotal > 0);

    updateArenaStats();
    if (!arena.deckTotal) return;

    measureArenaZones();
    var count = Math.min(arenaMaxOnStage(), arena.deck.length);
    for (var i = 0; i < count; i += 1) {
      spawnArenaCard();
    }
  }

  function triggerGravitationalPulse() {
    if (!isArenaOpen()) return;
    playSoundUnlock();
    var stage = byId("arena-stage");
    var cx = 400;
    var cy = 260;
    if (stage) {
      stage.classList.remove("is-pulsing");
      void stage.offsetWidth;
      stage.classList.add("is-pulsing");
      setTimeout(function () {
        stage.classList.remove("is-pulsing");
      }, 700);
      var rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        cx = rect.width / 2;
        cy = rect.height / 2;
      }
    }
    var strength = arena.reducedMotion ? 4 : 14;
    for (var i = 0; i < arena.bodies.length; i += 1) {
      var b = arena.bodies[i];
      if (b.mode !== "free" || b.expanded) continue;
      var cardCenterX = b.x + (b.w ? b.w / 2 : 110);
      var cardCenterY = b.y + (b.h ? b.h / 2 : 55);
      var dx = cardCenterX - cx;
      var dy = cardCenterY - cy;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = dx / dist;
      var ny = dy / dist;
      b.vx += nx * strength + (Math.random() - 0.5) * (strength * 0.4);
      b.vy += ny * strength + (Math.random() - 0.5) * (strength * 0.4);
      b.vRot += (Math.random() - 0.5) * 3;
    }
    announce("Pulse released. Cards pushed apart.");
  }

  function setArenaGravityMode(mode) {
    arena.gravity = mode;
    playSoundInspect();
    var map = { zero: "arena-grav-zero", down: "arena-grav-down", up: "arena-grav-up" };
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        var btn = byId(map[key]);
        if (btn) {
          btn.classList.toggle("is-active", key === mode);
          btn.setAttribute("aria-pressed", key === mode ? "true" : "false");
        }
      }
    }
    if (mode === "zero" && !arena.reducedMotion) {
      for (var i = 0; i < arena.bodies.length; i += 1) {
        var b = arena.bodies[i];
        if (b.mode === "free" && !b.expanded) {
          b.vx += (Math.random() - 0.5) * 1.6;
          b.vy += (Math.random() - 0.5) * 1.6;
        }
      }
    }
    var labels = { zero: "zero gravity, cards float", down: "falling gravity", up: "rising gravity" };
    announce("Gravity set to " + labels[mode] + ".");
  }

  function trapArenaFocus(event) {
    var elModal = byId("arena-modal");
    if (!elModal) return;
    var nodes = elModal.querySelectorAll("button:not([disabled]), [tabindex=\"0\"]");
    var list = [];
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].offsetParent !== null) list.push(nodes[i]);
    }
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    var active = document.activeElement;
    if (event.shiftKey && (active === first || !elModal.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !elModal.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function openArenaModal() {
    var elModal = byId("arena-modal");
    if (!elModal) return;

    // Opening the sandbox during a live door pauses the run, so the door timer
    // and the P / S shortcuts can never act on the real message in the background.
    if (state.screen === "game") {
      pauseGame();
    }

    arena.returnFocus = document.activeElement;
    try {
      arena.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      arena.reducedMotion = false;
    }

    elModal.classList.remove("hidden");
    playSoundInspect();
    startArenaRound();

    if (!arena.animId) {
      arena.lastTs = 0;
      arena.animId = requestAnimationFrame(updateArenaPhysics);
    }

    focusElement(byId("arena-close-btn"));
    announce("Zero-G Arena opened. Practice mode: points here do not change your run score.");
  }

  function closeArenaModal() {
    var elModal = byId("arena-modal");
    if (!elModal || elModal.classList.contains("hidden")) return;

    elModal.classList.add("hidden");
    if (arena.animId) {
      cancelAnimationFrame(arena.animId);
      arena.animId = null;
    }
    if (arena.resultTimer) {
      clearTimeout(arena.resultTimer);
      arena.resultTimer = null;
    }
    clearArenaCards();
    setArenaZoneHot("q", false);
    setArenaZoneHot("s", false);

    if (state.screen === "pause" && elPauseResume) {
      focusElement(elPauseResume);
    } else if (arena.returnFocus && typeof arena.returnFocus.focus === "function" && document.contains(arena.returnFocus)) {
      arena.returnFocus.focus();
    }
    arena.returnFocus = null;
  }

  function bindArenaControls() {
    if (arena.bound) return;
    arena.bound = true;

    var elClose = byId("arena-close-btn");
    if (elClose) elClose.addEventListener("click", closeArenaModal);
    var elFooterClose = byId("arena-footer-close");
    if (elFooterClose) elFooterClose.addEventListener("click", closeArenaModal);
    var elSummaryClose = byId("arena-summary-close-btn");
    if (elSummaryClose) elSummaryClose.addEventListener("click", closeArenaModal);

    var elModal = byId("arena-modal");
    if (elModal) {
      elModal.addEventListener("click", function (e) {
        if (e.target === elModal) closeArenaModal();
      });
    }

    var elPulse = byId("arena-pulse-btn");
    if (elPulse) elPulse.addEventListener("click", triggerGravitationalPulse);
    var elReset = byId("arena-reset-btn");
    if (elReset) elReset.addEventListener("click", startArenaRound);
    var elAgain = byId("arena-play-again-btn");
    if (elAgain) elAgain.addEventListener("click", startArenaRound);

    var gravity = { "arena-grav-zero": "zero", "arena-grav-down": "down", "arena-grav-up": "up" };
    Object.keys(gravity).forEach(function (id) {
      var btn = byId(id);
      if (btn) {
        btn.addEventListener("click", function () {
          setArenaGravityMode(gravity[id]);
        });
      }
    });

    window.addEventListener("pointermove", onArenaPointerMove);
    window.addEventListener("pointerup", onArenaPointerUp);
    window.addEventListener("pointercancel", onArenaPointerUp);

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (!isArenaOpen()) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measureArenaZones();
        for (var i = 0; i < arena.bodies.length; i += 1) {
          measureArenaBody(arena.bodies[i]);
        }
      }, 120);
    });
  }

  /* ---------- Security Threat Encyclopedia (12 Vectors) ---------- */



  var SECURITY_ENCYCLOPEDIA = [

    {

      id: "typosquatting",

      name: "Typosquatting (Lookalike Domains)",

      category: "Domain & URLs",

      threatLevel: "High",

      mappedCategories: ["fake_domain"],

      shortDefinition: "Registering deceptive domain names that closely mimic legitimate brand names to fool victims into trusting fraudulent portals or spoofed messages.",

      attackVector: "Attackers exploit common visual similarities, such as substituting letters ('rn' for 'm', '0' for 'O') or appending words like '-verify', '-cancel', or '-prize' to a brand name.",

      sampleText: "From: HarborBank Rewards <rewards@harborbank-prize.example> — Notice how '-prize.example' is a separate domain from 'harborbank.example'.",

      redFlags: [

        "Subtle letter substitutions or extra hyphenated suffixes (-verify, -cancel, -support)",

        "Unfamiliar or mismatched top-level domains compared to the official organization",

        "Requests to enter banking or login details on a newly introduced external domain"

      ],

      defenseAdvice: "Always inspect the exact root domain before acting. Navigate to sensitive accounts using your own saved browser bookmarks rather than links in messages."

    },

    {

      id: "subdomain-cloaking",

      name: "Subdomain Cloaking (Disguised Links)",

      category: "Domain & URLs",

      threatLevel: "High",

      mappedCategories: ["disguised_link"],

      shortDefinition: "Placing a trusted brand name inside a subdomain prefix while the actual destination host belongs to an untrusted third party.",

      attackVector: "Because URLs read left-to-right, users often stop reading after seeing a familiar name at the start of a URL, missing that the real root domain at the end belongs to an attacker.",

      sampleText: "Verify your identity at horizonbank.example.account-unlock.test — The real host here is 'account-unlock.test', not 'horizonbank.example'.",

      redFlags: [

        "A known company name appears followed by multiple dots and a different root domain",

        "Long, convoluted URL prefixes designed to push the true domain off mobile screens",

        "Links claiming to be official recovery portals hosted on unrelated domains"

      ],

      defenseAdvice: "Read domain names from right to left (just before the first single slash '/') to identify the true root host controlling the server."

    },

    {

      id: "artificial-urgency",

      name: "Artificial Urgency & Panic Triggers",

      category: "Social Engineering",

      threatLevel: "Critical",

      mappedCategories: ["urgency"],

      shortDefinition: "Manufacturing strict countdown deadlines or severe consequences (account deletion, lost prizes, legal action) to rush victims into acting without verifying.",

      attackVector: "Social engineers trigger a fight-or-flight stress response so the recipient bypasses normal critical thinking and security checks.",

      sampleText: "Failure to respond within 24 hours will result in permanent account termination.",

      redFlags: [

        "Demands for immediate action within minutes or hours ('within 2 hours', 'right now')",

        "Threats of immediate account suspension, parcel return, or financial loss",

        "Claims that normal verification procedures must be skipped due to an emergency"

      ],

      defenseAdvice: "Pause whenever a message tries to rush you. Legitimate organizations provide reasonable notice and allow you to verify status inside their official app."

    },

    {

      id: "otp-harvesting",

      name: "Sensitive Data & OTP Harvesting",

      category: "Authentication & Identity",

      threatLevel: "Critical",

      mappedCategories: ["sensitive_data"],

      shortDefinition: "Tricking users into disclosing one-time passcodes (OTPs), passwords, payment card numbers, or national IDs directly over chat, SMS, or email.",

      attackVector: "Attackers initiate a login or transaction on your real account, then pose as support staff asking you to read back the 6-digit verification code sent to your phone.",

      sampleText: "Please tell me the 6-digit one-time passcode sent to your phone so I can verify your identity.",

      redFlags: [

        "Any person or bot asking you to share a one-time passcode or 2FA token",

        "Requests for bank account numbers, debit card details, or national ID numbers over email or chat",

        "Unsolicited links asking you to sign in with corporate Single Sign-On (SSO) on an unfamiliar host"

      ],

      defenseAdvice: "One-time passcodes and passwords are for your eyes only. Real support staff or automated systems will never ask you to tell them your verification code."

    },

    {

      id: "weaponized-attachments",

      name: "Malicious Attachments & APK Drops",

      category: "Payload & Execution",

      threatLevel: "Critical",

      mappedCategories: ["malicious_attachment"],

      shortDefinition: "Distributing mobile installer packages (.apk) or executable scripts disguised as parcel trackers, invoices, or contracts.",

      attackVector: "Attackers send delivery exceptions or urgent invoice notices instructing the user to sideload an application or run an executable attachment that compromises the device.",

      sampleText: "To avoid parcel return, download and install parcel-tracker.apk from fast-courier.example.",

      redFlags: [

        "Messages asking you to install an '.apk', '.exe', or '.scr' file to track a package or view an invoice",

        "Double extensions (such as 'invoice.pdf.exe') hiding binary executables",

        "Software downloads hosted on external links outside official app stores"

      ],

      defenseAdvice: "Never sideload APK files or run executable attachments from messages. Track packages only by typing your tracking number on the carrier's official site."

    },

    {

      id: "lottery-prize-scams",

      name: "Advance-Fee & Fake Prize Draws",

      category: "Social Engineering",

      threatLevel: "Moderate",

      mappedCategories: ["fake_prize"],

      shortDefinition: "Luring victims with unsolicited sweepstakes winnings, grants, or rewards that require entering banking details or paying a release fee.",

      attackVector: "By promising a high-value windfall ('50,000 credits') with a short claim window, scammers entice victims into surrendering financial credentials.",

      sampleText: "CLAIM NOW: You won 50,000 credits in our annual prize draw! Go to prize-claim.example immediately to enter your bank details.",

      redFlags: [

        "Winning a lottery, prize draw, or giveaway you never entered",

        "Requests for bank account details, card numbers, or processing fees to release a prize",

        "Generic greetings ('Dear Contestant') paired with countdown timers"

      ],

      defenseAdvice: "If you did not enter a contest, you cannot win it. Never provide banking or personal details to claim an unsolicited reward."

    },

    {

      id: "bec-impersonation",

      name: "Business Email & Chat Compromise (BEC)",

      category: "Social Engineering",

      threatLevel: "Critical",

      mappedCategories: ["suspicious_sender"],

      shortDefinition: "Impersonating company executives, coworkers, or support desks using external accounts to request confidential payroll data, wire transfers, or gift cards.",

      attackVector: "Attackers claim to be in a 'confidential board meeting' where they cannot take calls, pressuring employees to send sensitive files to an external address.",

      sampleText: "I am in a confidential board meeting right now and cannot take calls. Send the salary sheets to marcus-vance@executive-board.example.",

      redFlags: [

        "An executive claiming they cannot speak on the phone and demanding urgent off-channel action",

        "Reply-to or destination addresses on external domains (@executive-board.example)",

        "Unverified chat handles or generic 'Customer Support Desk' display names"

      ],

      defenseAdvice: "Always verify high-stakes or unusual requests from leadership or coworkers using a known, independent internal channel or phone extension."

    },

    {

      id: "recruitment-escrow-fraud",

      name: "Recruitment & Marketplace Escrow Scams",

      category: "Social Engineering",

      threatLevel: "High",

      mappedCategories: ["unnatural_language"],

      shortDefinition: "Fake high-paying remote job offers or marketplace buyers insisting on unverified third-party escrow portals to harvest identity and card data.",

      attackVector: "Scammers offer instant job placement without interviews or immediate full-price purchases, often exhibiting awkward phrasing while demanding bank or card numbers.",

      sampleText: "We are pleased of making you an immediate appointment... send your national identity number and bank account number to talent-onboarding.test.",

      redFlags: [

        "Awkward, unnatural grammar or overly formal phrasing in recruitment notices",

        "Job offers granted immediately without a standard interview process",

        "Marketplace buyers refusing official platform checkout and pushing third-party escrow links"

      ],

      defenseAdvice: "Legitimate employers never ask for national IDs or bank numbers before formal interviewing, and sellers should never enter card numbers to 'receive' escrow funds."

    },

    {

      id: "smishing",

      name: "Smishing (SMS Text Phishing)",

      category: "Mobile & Messaging",

      threatLevel: "High",

      mappedCategories: ["fake_domain", "disguised_link"],

      shortDefinition: "Phishing lures delivered via SMS text messages, exploiting mobile screen constraints to hide deceptive URLs or fake courier alerts.",

      attackVector: "Attackers send bulk SMS messages pretending to be banks or parcel couriers, embedding disguised links or malicious APK download instructions.",

      sampleText: "Horizon Bank Alert: Unusual login attempt detected... Restore your access at horizonbank.example.account-unlock.test.",

      redFlags: [

        "Text messages containing links to unlock bank accounts or reschedule deliveries",

        "Unfamiliar international or unverified sender numbers",

        "Urgent prompts to tap a link rather than open your installed mobile app"

      ],

      defenseAdvice: "Never tap links inside unexpected SMS alerts. Open your official banking or courier app directly from your home screen."

    },

    {

      id: "vishing",

      name: "Vishing (Voice Callback Phishing)",

      category: "Social Engineering",

      threatLevel: "High",

      mappedCategories: ["urgency", "sensitive_data"],

      shortDefinition: "Social engineering over phone calls or voice prompts where scammers impersonate fraud officers or IT staff to extract passcodes.",

      attackVector: "Often triggered by an alarming text or chat message about an unauthorized charge, prompting the victim to call a fake helpdesk number in a panic.",

      sampleText: "Alert: Unauthorized transaction detected. Call our fraud desk or reply with your 6-digit verification code to cancel.",

      redFlags: [

        "Messages urging you to call an unfamiliar phone number to cancel a charge",

        "Callers demanding your OTP code or password to 'verify your identity'",

        "High-pressure demands to stay on the line and not check your official app"

      ],

      defenseAdvice: "Never call phone numbers listed inside suspicious texts. Always dial the official number printed on the back of your payment card."

    },

    {

      id: "spf-dkim-dmarc",

      name: "Sender Authentication & Domain Verification",

      category: "Domain & URLs",

      threatLevel: "High",

      mappedCategories: ["fake_domain", "suspicious_sender"],

      shortDefinition: "Verifying that the sender's actual address and domain match the organization's authentic internal domain and communication protocols.",

      attackVector: "Display names can be set to anything ('HarborBank Rewards' or 'PhotoShare Copyright Protection'), while the actual address in angle brackets reveals an external domain.",

      sampleText: "From: PhotoShare Copyright Protection <notice@social-intellectual.example>",

      redFlags: [

        "Mismatch between the friendly display name and the domain after the '@' symbol",

        "External domains posing as internal IT or HR departments",

        "Messages asking you to bypass standard authenticated company portals"

      ],

      defenseAdvice: "Always check the full email address inside the '<...>' brackets, not just the sender's display name."

    },

    {

      id: "safe-signal-verification",

      name: "Recognizing Authentic Safe Signals",

      category: "Authentication & Identity",

      threatLevel: "Moderate",

      mappedCategories: [],

      shortDefinition: "Distinguishing legitimate security alerts that look alarming at first glance from actual phishing attacks, preventing costly false alarms.",

      attackVector: "Real security notices (such as password expiry reminders or new sign-in alerts) can look suspicious if you don't check how they ask you to act.",

      sampleText: "If you did not sign in recently, open your web browser, navigate to your saved CloudSync bookmark, and review your Active Sessions.",

      redFlags: [

        "False Alarm Trap: Marking a message as phishing just because it mentions 'Security Alert' or 'Password Expiry'",

        "Always check whether the message contains a deceptive link or instead directs you to your own bookmark/app",

        "Verify whether the sender domain matches the official internal or service domain (.internal.example)"

      ],

      defenseAdvice: "Legitimate security alerts never ask for your code or send reset links. Instead, they instruct you to use your own saved bookmarks or official app."

    }

  ];



  var activeEncyclopediaTermId = "typosquatting";

  var activeEncyclopediaCategory = "All";

  var activeEncyclopediaSearch = "";



  function getEncyclopediaTermByCategory(flagCategory) {

    for (var i = 0; i < SECURITY_ENCYCLOPEDIA.length; i += 1) {

      var term = SECURITY_ENCYCLOPEDIA[i];

      if (term.mappedCategories && term.mappedCategories.indexOf(flagCategory) !== -1) {

        return term.id;

      }

    }

    return "typosquatting";

  }



  function renderEncyclopediaModal() {

    var elCatWrap = byId("encyclopedia-categories");

    var elTermList = byId("encyclopedia-term-list");

    if (!elCatWrap || !elTermList) return;

    var elDropdownMenu = byId("enc-cat-dropdown-menu");
    var elCurrentLabel = byId("enc-cat-current-label");
    var elDropdownBtn = byId("enc-cat-dropdown-btn");

    if (elCurrentLabel) {
      elCurrentLabel.textContent = (activeEncyclopediaCategory === "All" ? "All Categories" : activeEncyclopediaCategory);
    }

    var categories = ["All", "Domain & URLs", "Social Engineering", "Authentication & Identity", "Mobile & Messaging", "Payload & Execution"];

    if (elDropdownMenu) {
      clearChildren(elDropdownMenu);
      for (var c = 0; c < categories.length; c += 1) {
        (function (catName) {
          var itemBtn = document.createElement("button");
          itemBtn.type = "button";
          var isSelected = (activeEncyclopediaCategory === catName);
          itemBtn.className = "enc-cat-dropdown-item" + (isSelected ? " is-selected" : "");
          itemBtn.setAttribute("role", "option");
          itemBtn.setAttribute("aria-selected", isSelected ? "true" : "false");

          var labelSpan = document.createElement("span");
          labelSpan.className = "enc-cat-dropdown-item-text";
          labelSpan.textContent = (catName === "All" ? "All Categories" : catName);
          itemBtn.appendChild(labelSpan);

          if (isSelected) {
            var checkSpan = document.createElement("span");
            checkSpan.className = "enc-cat-dropdown-item-check";
            checkSpan.textContent = "\u2713";
            checkSpan.setAttribute("aria-hidden", "true");
            itemBtn.appendChild(checkSpan);
          }

          itemBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            activeEncyclopediaCategory = catName;
            if (elDropdownMenu) elDropdownMenu.classList.add("hidden");
            if (elDropdownBtn) {
              elDropdownBtn.setAttribute("aria-expanded", "false");
              elDropdownBtn.classList.remove("is-open");
            }
            playSoundInspect();
            renderEncyclopediaModal();
          });

          elDropdownMenu.appendChild(itemBtn);
        })(categories[c]);
      }
    }



    var q = activeEncyclopediaSearch.toLowerCase().trim();

    var filtered = SECURITY_ENCYCLOPEDIA.filter(function (item) {

      var matchCat = activeEncyclopediaCategory === "All" || item.category === activeEncyclopediaCategory;

      if (!matchCat) return false;

      if (!q) return true;

      return (

        item.name.toLowerCase().indexOf(q) !== -1 ||

        item.shortDefinition.toLowerCase().indexOf(q) !== -1 ||

        item.category.toLowerCase().indexOf(q) !== -1

      );

    });



    clearChildren(elTermList);

    var activeTerm = null;

    for (var i = 0; i < filtered.length; i += 1) {

      if (filtered[i].id === activeEncyclopediaTermId) {

        activeTerm = filtered[i];

        break;

      }

    }

    if (!activeTerm) {

      activeTerm = filtered[0] || SECURITY_ENCYCLOPEDIA[0];

      if (activeTerm) {

        activeEncyclopediaTermId = activeTerm.id;

      }

    }



    if (filtered.length === 0) {

      var emptyP = document.createElement("p");

      emptyP.className = "soc-audit-empty";

      emptyP.textContent = "// no threat vectors match \"" + activeEncyclopediaSearch + "\"";

      elTermList.appendChild(emptyP);

    } else {

      for (var t = 0; t < filtered.length; t += 1) {
        (function (term) {
          var isCurrent = term.id === activeTerm.id;
          var itemBtn = document.createElement("button");
          itemBtn.type = "button";
          itemBtn.className = "enc-term-btn" + (isCurrent ? " is-selected is-active" : "");

          var titleSpan = document.createElement("span");
          titleSpan.className = "enc-term-btn-title";
          titleSpan.textContent = term.name;
          itemBtn.appendChild(titleSpan);

          var metaRow = document.createElement("div");
          metaRow.className = "enc-term-btn-meta";

          var catSpan = document.createElement("span");
          catSpan.className = "enc-term-btn-cat";
          catSpan.textContent = term.category;
          metaRow.appendChild(catSpan);

          var threatTag = document.createElement("span");
          var threatClass =
            term.threatLevel === "Critical"
              ? "threat-critical"
              : term.threatLevel === "High"
              ? "threat-high"
              : "threat-moderate";
          threatTag.className = "enc-threat-badge " + threatClass;
          threatTag.textContent = term.threatLevel.toUpperCase();
          metaRow.appendChild(threatTag);

          itemBtn.appendChild(metaRow);

          itemBtn.addEventListener("click", function () {
            activeEncyclopediaTermId = term.id;
            setTimeout(function () {
              if (window.innerWidth <= 920) {
                var detailPane = byId("encyclopedia-detail-pane");
                if (detailPane && typeof detailPane.scrollIntoView === "function") {
                  detailPane.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }
            }, 30);
            playSoundInspect();
            renderEncyclopediaModal();
          });
          elTermList.appendChild(itemBtn);
        })(filtered[t]);

      }

    }



    if (activeTerm) {

      var elCat = byId("enc-detail-category");

      var elName = byId("enc-detail-name");

      var elThreat = byId("enc-detail-threat");

      var elDef = byId("enc-detail-def");

      var elVec = byId("enc-detail-vector");

      var elEx = byId("enc-detail-example");

      var elFlags = byId("enc-detail-flags");

      var elAdv = byId("enc-detail-advice");



      if (elCat) elCat.textContent = "// " + activeTerm.category.toUpperCase();

      if (elName) elName.textContent = activeTerm.name;

      if (elThreat) {

        var tClass =
          activeTerm.threatLevel === "Critical"
            ? "threat-critical"
            : activeTerm.threatLevel === "High"
            ? "threat-high"
            : "threat-moderate";
        elThreat.textContent = activeTerm.threatLevel.toUpperCase() + " THREAT";
        elThreat.className = "dossier-pill pill-status enc-threat-badge " + tClass;
      }

      if (elDef) elDef.textContent = activeTerm.shortDefinition;

      if (elVec) elVec.textContent = activeTerm.attackVector;

      if (elEx) elEx.textContent = activeTerm.sampleText;

      if (elFlags) {

        clearChildren(elFlags);

        for (var f = 0; f < activeTerm.redFlags.length; f += 1) {

          var li = document.createElement("li");

          li.textContent = activeTerm.redFlags[f];

          elFlags.appendChild(li);

        }

      }

      if (elAdv) elAdv.textContent = activeTerm.defenseAdvice;

    }

  }



  function openEncyclopediaModal(termId) {

    var elModal = byId("encyclopedia-modal");

    if (!elModal) return;

    var elMenu = byId("enc-cat-dropdown-menu");
    if (elMenu && !elMenu.classList.contains("hidden")) {
      elMenu.classList.add("hidden");
    }
    var elDropdownBtn = byId("enc-cat-dropdown-btn");
    if (elDropdownBtn) {
      elDropdownBtn.setAttribute("aria-expanded", "false");
      elDropdownBtn.classList.remove("is-open");
    }

    if (termId) {

      activeEncyclopediaTermId = termId;

      activeEncyclopediaCategory = "All";

      activeEncyclopediaSearch = "";

      var elSearch = byId("encyclopedia-search");

      if (elSearch) elSearch.value = "";

    }

    playSoundInspect();

    renderEncyclopediaModal();

    elModal.classList.remove("hidden");

    var elClose = byId("encyclopedia-close-btn");

    focusElement(elClose);

    announce("Opened Security Threat Encyclopedia.");

  }



  function closeEncyclopediaModal() {

    var elMenu = byId("enc-cat-dropdown-menu");
    if (elMenu && !elMenu.classList.contains("hidden")) {
      elMenu.classList.add("hidden");
    }
    var elDropdownBtn = byId("enc-cat-dropdown-btn");
    if (elDropdownBtn) {
      elDropdownBtn.setAttribute("aria-expanded", "false");
      elDropdownBtn.classList.remove("is-open");
    }

    var elModal = byId("encyclopedia-modal");

    if (elModal && !elModal.classList.contains("hidden")) {

      elModal.classList.add("hidden");

    }

  }



  /* ---------- SOC Decision Audit Log (Last 5 Decisions) ---------- */



  var MAX_AUDIT_ENTRIES = 5;



  function formatAuditTime(ts) {

    try {

      var d = new Date(ts);

      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    } catch (e) {

      return "--:--:--";

    }

  }



  function addAuditEntry(msg, chosePhishing, isCorrect, pointsDelta) {

    var outcome = isCorrect

      ? chosePhishing ? "QUARANTINED THREAT" : "VERIFIED SAFE"

      : chosePhishing ? "FALSE ALARM" : "SECURITY BREACH";



    var entry = {

      id: msg.id,

      door: state.level,

      channel: msg.channel.toUpperCase(),

      sender: msg.sender,

      chosePhishing: chosePhishing,

      isCorrect: isCorrect,

      outcome: outcome,

      pointsDelta: pointsDelta,

      timestamp: Date.now()

    };



    state.auditLog = [entry].concat(state.auditLog).slice(0, MAX_AUDIT_ENTRIES);

    renderAuditLog();

  }



  function renderAuditLog() {

    var elList = byId("soc-audit-list");

    var elBadge = byId("audit-count-badge");

    var elCompPill = byId("audit-compliance-pill");

    var elCompRate = byId("audit-compliance-rate");

    if (!elList) return;



    var entries = state.auditLog;

    if (elBadge) {

      elBadge.textContent = entries.length + " / " + MAX_AUDIT_ENTRIES;

    }



    clearChildren(elList);

    if (entries.length === 0) {

      if (elCompPill) elCompPill.classList.add("hidden");

      var emptyP = document.createElement("p");

      emptyP.className = "soc-audit-empty";

      emptyP.textContent = "// no triage decisions audited in this session yet";

      elList.appendChild(emptyP);

      return;

    }



    var correctCount = 0;

    for (var i = 0; i < entries.length; i += 1) {

      if (entries[i].isCorrect) correctCount += 1;

    }

    var pct = Math.round((correctCount / entries.length) * 100);

    if (elCompPill && elCompRate) {

      elCompPill.classList.remove("hidden");

      elCompRate.textContent = pct + "% (" + correctCount + "/" + entries.length + ")";

    }



    for (var j = 0; j < entries.length; j += 1) {

      var item = entries[j];

      var row = document.createElement("div");

      row.className = "soc-audit-row " + (item.isCorrect ? "is-correct" : "is-wrong");



      var left = document.createElement("div");

      left.className = "soc-audit-left";



      var statusTag = document.createElement("span");

      statusTag.className = "soc-audit-status " + (item.isCorrect ? "tag-safe" : "tag-danger");

      statusTag.textContent = item.outcome;

      left.appendChild(statusTag);



      var metaSpan = document.createElement("span");

      metaSpan.className = "soc-audit-meta";

      metaSpan.textContent = "DOOR 0" + item.door + " · " + item.channel + " · " + item.id + " (" + item.sender.slice(0, 32) + ")";

      left.appendChild(metaSpan);



      var right = document.createElement("div");

      right.className = "soc-audit-right";



      var ptsSpan = document.createElement("span");

      ptsSpan.className = "soc-audit-pts " + (item.isCorrect ? "pts-pos" : "pts-neg");

      ptsSpan.textContent = item.isCorrect ? "+100 PTS" : "-1 LIFE";

      right.appendChild(ptsSpan);



      var timeSpan = document.createElement("span");

      timeSpan.className = "soc-audit-time";

      timeSpan.textContent = formatAuditTime(item.timestamp);

      right.appendChild(timeSpan);



      row.appendChild(left);

      row.appendChild(right);

      elList.appendChild(row);

    }

  }



  /* ---------- Cyber Defense Badges & Canvas PNG Credential Card Exporter ---------- */



  var BADGE_DEFINITIONS = [

    {

      id: "first-responder",

      title: "First Responder",

      description: "Successfully quarantine and neutralize your first phishing threat in the server room.",

      tier: "bronze",

      maxProgress: 1,

      hint: "Classify 1 phishing message accurately."

    },

    {

      id: "streak-5",

      title: "Hot Trail",

      description: "Achieve 5 accurate threat triage decisions in a row without a single error.",

      tier: "bronze",

      maxProgress: 5,

      hint: "Maintain a streak of 5 correct decisions."

    },

    {

      id: "streak-10",

      title: "Flawless Instinct",

      description: "Score 10 accurate decisions in a row without a false alarm or security breach.",

      tier: "gold",

      maxProgress: 10,

      hint: "Maintain a streak of 10 correct decisions."

    },

    {

      id: "omnichannel-master",

      title: "Omnichannel Master",

      description: "Successfully triage threats across all 3 channels: Email Gateway, SMS Relay, and Chat Terminal.",

      tier: "gold",

      maxProgress: 3,

      hint: "Make at least 1 correct call in Email, SMS, and Chat."

    },

    {

      id: "door-1-cleared",

      title: "Gateway Breacher",

      description: "Override the first blast door (Door 01 // Crude Scams) and advance deeper into the bay.",

      tier: "bronze",

      maxProgress: 1,

      hint: "Clear Door 01."

    },

    {

      id: "door-2-cleared",

      title: "Spear Shield",

      description: "Override the second blast door (Door 02 // Spear Phishing) under time pressure.",

      tier: "silver",

      maxProgress: 2,

      hint: "Clear Door 02."

    },

    {

      id: "escape-artist",

      title: "Containment Override",

      description: "Unlock all 3 security blast doors and escape the server room lockdown.",

      tier: "platinum",

      maxProgress: 3,

      hint: "Clear all 3 security doors."

    },

    {

      id: "score-1000",

      title: "SOC Commander",

      description: "Achieve a best run score of 1,000+ points through rapid and accurate triage.",

      tier: "gold",

      maxProgress: 1000,

      hint: "Reach 1,000 points in a run."

    },

    {

      id: "tactical-analyst",

      title: "Forensic Sleuth",

      description: "Use an analyst hint or complete 12 total accurate classifications during your session.",

      tier: "silver",

      maxProgress: 12,

      hint: "Reach 12 accurate decisions or deploy analyst hint."

    }

  ];



  var activePreviewBadge = null;

  var toastTimerId = null;



  function getBadgeProgressList() {

    var bestScore = Math.max(getBestScore(), state.score);

    var maxDoors = Math.max(state.clearedDoors, loadClearedDoors());

    var channelsDone =

      (state.channelSuccess.email > 0 ? 1 : 0) +

      (state.channelSuccess.sms > 0 ? 1 : 0) +

      (state.channelSuccess.chat > 0 ? 1 : 0);

    if (maxDoors >= 3) {

      channelsDone = 3;

    }



    var list = [];

    for (var i = 0; i < BADGE_DEFINITIONS.length; i += 1) {

      var def = BADGE_DEFINITIONS[i];

      var cur = 0;

      if (def.id === "first-responder") {

        cur = state.threatsNeutralized > 0 || bestScore >= 100 ? 1 : 0;

      } else if (def.id === "streak-5") {

        cur = Math.min(5, state.maxStreak);

      } else if (def.id === "streak-10") {

        cur = Math.min(10, state.maxStreak);

      } else if (def.id === "omnichannel-master") {

        cur = Math.min(3, channelsDone);

      } else if (def.id === "door-1-cleared") {

        cur = maxDoors >= 1 ? 1 : 0;

      } else if (def.id === "door-2-cleared") {

        cur = Math.min(2, maxDoors);

      } else if (def.id === "escape-artist") {

        cur = Math.min(3, maxDoors);

      } else if (def.id === "score-1000") {

        cur = Math.min(1000, bestScore);

      } else if (def.id === "tactical-analyst") {

        cur = state.hintsUsedCount > 0 ? 12 : Math.min(12, state.totalCorrect);

      }



      var isUnlocked = Boolean(state.unlockedBadges[def.id]) || cur >= def.maxProgress;

      if (isUnlocked && !state.unlockedBadges[def.id]) {

        state.unlockedBadges[def.id] = new Date().toLocaleDateString("en-US", {

          month: "short",

          day: "numeric",

          year: "numeric"

        });

      }

      var pct = isUnlocked ? 100 : Math.min(100, Math.round((cur / def.maxProgress) * 100));

      list.push({

        id: def.id,

        title: def.title,

        description: def.description,

        tier: def.tier,

        maxProgress: def.maxProgress,

        currentProgress: isUnlocked ? def.maxProgress : cur,

        progressPercentage: pct,

        hint: def.hint,

        isUnlocked: isUnlocked,

        unlockedAt: state.unlockedBadges[def.id] || ""

      });

    }

    return list;

  }



  function showAchievementToast(badge) {

    var elToast = byId("achievement-toast");

    var elTitle = byId("achievement-toast-title");

    var elDesc = byId("achievement-toast-desc");

    if (!elToast || !elTitle || !elDesc) return;



    elTitle.textContent = badge.title + " (" + badge.tier.toUpperCase() + ")";

    elDesc.textContent = badge.description;

    elToast.classList.remove("hidden");



    if (toastTimerId) {

      clearTimeout(toastTimerId);

    }

    toastTimerId = setTimeout(function () {

      elToast.classList.add("hidden");

    }, 5500);

  }



  function checkAndUpdateBadges(showToastOnNew) {

    var prevUnlocked = {};

    var keys = Object.keys(state.unlockedBadges);

    for (var k = 0; k < keys.length; k += 1) {

      prevUnlocked[keys[k]] = state.unlockedBadges[keys[k]];

    }



    var all = getBadgeProgressList();

    var unlockedCount = 0;

    var newlyUnlocked = null;



    for (var i = 0; i < all.length; i += 1) {

      if (all[i].isUnlocked) {

        unlockedCount += 1;

        if (!prevUnlocked[all[i].id] && !newlyUnlocked) {

          newlyUnlocked = all[i];

        }

      }

    }



    if (elSiteBadgesCount) {

      elSiteBadgesCount.textContent = unlockedCount + "/" + all.length;

    }

    if (elMenuBadgesMeta) {

      elMenuBadgesMeta.textContent = unlockedCount + " / " + all.length;

    }



    if (showToastOnNew && newlyUnlocked) {

      showAchievementToast(newlyUnlocked);

    }

  }



  function generateBadgeHash(str) {

    var hash = 0;

    for (var i = 0; i < str.length; i += 1) {

      hash = (hash << 5) - hash + str.charCodeAt(i);

      hash |= 0;

    }

    var hex = Math.abs(hash).toString(16);

    while (hex.length < 8) {

      hex = "0" + hex;

    }

    return "0x" + hex.toUpperCase();

  }



  function renderCredentialCardCanvas(badge) {

    var canvas = byId("badge-export-canvas");

    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");

    if (!ctx) return;



    var width = 1200;

    var height = 675;

    var callsignInput = byId("agent-callsign-input");

    var agentName = (callsignInput && callsignInput.value.trim()) ? callsignInput.value.trim() : "SOC Analyst";

    var bestScore = Math.max(getBestScore(), state.score);



    var tierColors = {

      platinum: { primary: "#00e5ff", glow: "rgba(0, 229, 255, 0.35)", label: "PLATINUM CLEARANCE" },

      gold: { primary: "#ffb800", glow: "rgba(255, 184, 0, 0.35)", label: "GOLD CLEARANCE" },

      silver: { primary: "#b0c4de", glow: "rgba(176, 196, 222, 0.35)", label: "SILVER CLEARANCE" },

      bronze: { primary: "#e67e22", glow: "rgba(230, 126, 34, 0.35)", label: "BRONZE CLEARANCE" }

    };

    var tier = tierColors[badge.tier] || tierColors.bronze;



    // Background gradient

    var bgGrad = ctx.createLinearGradient(0, 0, width, height);

    bgGrad.addColorStop(0, "#050912");

    bgGrad.addColorStop(0.5, "#0a1528");

    bgGrad.addColorStop(1, "#050912");

    ctx.fillStyle = bgGrad;

    ctx.fillRect(0, 0, width, height);



    // Subtle Cyber Grid

    ctx.strokeStyle = "rgba(0, 229, 255, 0.05)";

    ctx.lineWidth = 1;

    for (var x = 0; x < width; x += 40) {

      ctx.beginPath();

      ctx.moveTo(x, 0);

      ctx.lineTo(x, height);

      ctx.stroke();

    }

    for (var y = 0; y < height; y += 40) {

      ctx.beginPath();

      ctx.moveTo(0, y);

      ctx.lineTo(width, y);

      ctx.stroke();

    }



    // Radial glow

    var radGlow = ctx.createRadialGradient(200, 320, 20, 200, 320, 340);

    radGlow.addColorStop(0, tier.glow);

    radGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = radGlow;

    ctx.fillRect(0, 0, width, height);



    // Borders

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";

    ctx.lineWidth = 1.5;

    ctx.strokeRect(30, 30, width - 60, height - 60);



    ctx.strokeStyle = tier.primary;

    ctx.lineWidth = 2.5;

    ctx.strokeRect(45, 45, width - 90, height - 90);



    // Header

    ctx.font = "bold 16px monospace";

    ctx.fillStyle = tier.primary;

    ctx.fillText("SENTINEL: PHISHING ESCAPE ROOM // SOC CONTAINMENT CREDENTIAL", 75, 85);



    ctx.font = "14px monospace";

    ctx.fillStyle = "#8da4be";

    ctx.fillText("BADGE ID: " + badge.id.toUpperCase(), width - 360, 85);



    ctx.strokeStyle = "rgba(141, 164, 190, 0.28)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(75, 105);

    ctx.lineTo(width - 75, 105);

    ctx.stroke();



    // Left Emblem Circle & Hexagon

    var emblemX = 185;

    var emblemY = 320;

    var emblemR = 88;



    ctx.strokeStyle = tier.primary;

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(emblemX, emblemY, emblemR, 0, Math.PI * 2);

    ctx.stroke();



    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";

    ctx.lineWidth = 1.8;

    ctx.beginPath();

    for (var s = 0; s < 6; s += 1) {

      var angle = (s * Math.PI) / 3;

      var hx = emblemX + (emblemR - 20) * Math.cos(angle);

      var hy = emblemY + (emblemR - 20) * Math.sin(angle);

      if (s === 0) ctx.moveTo(hx, hy);

      else ctx.lineTo(hx, hy);

    }

    ctx.closePath();

    ctx.stroke();



    ctx.fillStyle = tier.primary;

    ctx.font = "bold 28px monospace";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText("SOC", emblemX, emblemY);

    ctx.textAlign = "left";

    ctx.textBaseline = "alphabetic";



    // Tier Pill under emblem

    ctx.fillStyle = "rgba(10, 18, 32, 0.9)";

    ctx.fillRect(emblemX - 75, emblemY + emblemR + 16, 150, 28);

    ctx.strokeStyle = tier.primary;

    ctx.lineWidth = 1;

    ctx.strokeRect(emblemX - 75, emblemY + emblemR + 16, 150, 28);



    ctx.font = "bold 11px monospace";

    ctx.fillStyle = tier.primary;

    ctx.textAlign = "center";

    ctx.fillText(tier.label, emblemX, emblemY + emblemR + 34);

    ctx.textAlign = "left";



    // Right Content

    var textX = 330;

    ctx.font = "bold 13px monospace";

    ctx.fillStyle = badge.isUnlocked ? "#00e68a" : "#ffb800";

    ctx.fillText(

      badge.isUnlocked

        ? "● STATUS: OFFICIALLY UNLOCKED & VERIFIED"

        : "○ STATUS: IN PROGRESS (" + badge.currentProgress + "/" + badge.maxProgress + ")",

      textX,

      160

    );



    ctx.font = "bold 36px sans-serif";

    ctx.fillStyle = "#f4f8fc";

    ctx.fillText(badge.title, textX, 210);



    ctx.font = "16px sans-serif";

    ctx.fillStyle = "#b0c4de";

    var words = badge.description.split(" ");

    var line = "";

    var lineY = 260;

    for (var n = 0; n < words.length; n += 1) {

      var testLine = line + words[n] + " ";

      if (ctx.measureText(testLine).width > 750 && n > 0) {

        ctx.fillText(line, textX, lineY);

        line = words[n] + " ";

        lineY += 26;

      } else {

        line = testLine;

      }

    }

    ctx.fillText(line, textX, lineY);



    // Requirement Box

    var boxY = Math.max(lineY + 32, 340);

    ctx.fillStyle = "rgba(10, 18, 32, 0.85)";

    ctx.fillRect(textX, boxY, 780, 84);

    ctx.strokeStyle = "#1e324f";

    ctx.strokeRect(textX, boxY, 780, 84);



    ctx.font = "12px monospace";

    ctx.fillStyle = "#8da4be";

    ctx.fillText("REQUIREMENT: " + badge.hint, textX + 20, boxY + 32);



    ctx.fillStyle = "#f4f8fc";

    ctx.font = "bold 13px monospace";

    ctx.fillText(

      "COMPLETION: " + badge.currentProgress + " / " + badge.maxProgress + " (" + badge.progressPercentage + "%)",

      textX + 20,

      boxY + 60

    );



    ctx.fillStyle = "#1e324f";

    ctx.fillRect(textX + 380, boxY + 46, 370, 16);

    ctx.fillStyle = badge.isUnlocked ? "#00e68a" : tier.primary;

    ctx.fillRect(textX + 380, boxY + 46, (370 * badge.progressPercentage) / 100, 16);



    // Footer Metadata

    var dateStr = badge.unlockedAt || "Active Simulation Session";

    ctx.font = "12px monospace";

    ctx.fillStyle = "#8da4be";

    ctx.fillText(

      "OPERATOR: " + agentName.toUpperCase() + " · BEST SCORE: " + bestScore + " PTS · DOORS CLEARED: " + state.clearedDoors + "/3",

      75,

      height - 75

    );

    ctx.fillText("AUTHENTICATED: " + dateStr + " · GOOGLE ANTIGRAVITY SOC ENGINE", 75, height - 54);



    // Stamp

    ctx.strokeStyle = tier.primary;

    ctx.lineWidth = 1.5;

    ctx.strokeRect(width - 320, height - 95, 245, 46);

    ctx.fillStyle = tier.primary;

    ctx.font = "bold 11px monospace";

    ctx.fillText("VERIFIED SOC CREDENTIAL", width - 305, height - 74);

    ctx.font = "10px monospace";

    ctx.fillStyle = "#b0c4de";

    ctx.fillText("HASH: " + generateBadgeHash(badge.id + agentName + bestScore), width - 305, height - 58);

  }



  function previewBadgeCard(badge) {

    activePreviewBadge = badge;

    var elSection = byId("badge-preview-section");

    var elTitle = byId("badge-preview-title");

    if (!elSection) return;

    if (elTitle) {

      elTitle.textContent = badge.title + " — Credential Preview";

    }

    elSection.classList.remove("hidden");

    renderCredentialCardCanvas(badge);

    elSection.scrollIntoView({ behavior: "smooth" });

  }



  function downloadActiveBadgeCard() {

    if (!activePreviewBadge) return;

    renderCredentialCardCanvas(activePreviewBadge);

    var canvas = byId("badge-export-canvas");

    if (!canvas || !canvas.toDataURL) return;

    try {

      var dataUrl = canvas.toDataURL("image/png");

      var link = document.createElement("a");

      link.download = "phishing-escape-room-" + activePreviewBadge.id + "-badge.png";

      link.href = dataUrl;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      playSoundSuccess();

    } catch (e) {}

  }



  function renderBadgesModal() {

    var elGrid = byId("badges-grid");

    var elSummary = byId("badges-summary-text");

    if (!elGrid) return;



    var all = getBadgeProgressList();

    var unlockedCount = 0;

    for (var i = 0; i < all.length; i += 1) {

      if (all[i].isUnlocked) unlockedCount += 1;

    }

    var pct = Math.round((unlockedCount / all.length) * 100);

    if (elSummary) {

      elSummary.textContent = unlockedCount + " of " + all.length + " Badges Unlocked (" + pct + "%) · Best Streak: " + state.maxStreak + "x";

    }



    clearChildren(elGrid);

    for (var b = 0; b < all.length; b += 1) {

      (function (badge) {

        var card = document.createElement("article");

        card.className = "badge-item-card tier-" + badge.tier + (badge.isUnlocked ? " is-unlocked" : " is-locked");



        var topRow = document.createElement("div");

        topRow.className = "badge-item-top";



        var tierTag = document.createElement("span");

        tierTag.className = "badge-tier-pill tier-" + badge.tier;

        tierTag.textContent = badge.tier.toUpperCase();

        topRow.appendChild(tierTag);



        var statusTag = document.createElement("span");

        statusTag.className = "badge-status-text " + (badge.isUnlocked ? "text-safe" : "text-muted");

        statusTag.textContent = badge.isUnlocked ? "✓ UNLOCKED" : "LOCKED (" + badge.currentProgress + "/" + badge.maxProgress + ")";

        topRow.appendChild(statusTag);

        card.appendChild(topRow);



        var titleH3 = document.createElement("h3");

        titleH3.className = "badge-item-title";

        titleH3.textContent = badge.title;

        card.appendChild(titleH3);



        var descP = document.createElement("p");

        descP.className = "badge-item-desc";

        descP.textContent = badge.description;

        card.appendChild(descP);



        var progWrap = document.createElement("div");
        progWrap.className = "badge-progress-wrap";

        var hintRow = document.createElement("div");
        hintRow.className = "badge-hint-row";

        var hintSpan = document.createElement("span");
        hintSpan.className = "badge-item-hint";
        hintSpan.textContent = badge.hint;
        hintRow.appendChild(hintSpan);

        var pctSpan = document.createElement("span");
        pctSpan.className = "badge-item-pct";
        pctSpan.textContent = badge.progressPercentage + "%";
        hintRow.appendChild(pctSpan);

        progWrap.appendChild(hintRow);

        var progEl = document.createElement("progress");
        progEl.className = "badge-progress-bar tier-" + badge.tier + (badge.isUnlocked ? " is-complete" : "");
        progEl.max = 100;
        progEl.value = badge.progressPercentage;
        progWrap.appendChild(progEl);

        card.appendChild(progWrap);

        var footDiv = document.createElement("div");
        footDiv.className = "badge-item-footer";

        var previewBtn = document.createElement("button");
        previewBtn.type = "button";
        previewBtn.className = "btn btn-outline btn-term-util badge-card-action-btn";
        previewBtn.textContent = "View Credential Card ↗";
        previewBtn.addEventListener("click", function () {
          playSoundInspect();
          previewBadgeCard(badge);
        });
        footDiv.appendChild(previewBtn);

        card.appendChild(footDiv);

        elGrid.appendChild(card);

      })(all[b]);

    }



    if (activePreviewBadge) {

      for (var p = 0; p < all.length; p += 1) {

        if (all[p].id === activePreviewBadge.id) {

          activePreviewBadge = all[p];

          renderCredentialCardCanvas(activePreviewBadge);

          break;

        }

      }

    }

  }



  function openBadgesModal() {

    var elModal = byId("badges-modal");

    if (!elModal) return;

    playSoundInspect();

    checkAndUpdateBadges(false);

    renderBadgesModal();

    elModal.classList.remove("hidden");

    var elClose = byId("badges-close-btn");

    focusElement(elClose);

    announce("Opened Security Operations Badges.");

  }



  function closeBadgesModal() {

    var elModal = byId("badges-modal");

    if (elModal && !elModal.classList.contains("hidden")) {

      elModal.classList.add("hidden");

    }

  }



  /* ---------- Rendering helpers ---------- */



  function renderTextWithHighlights(container, fullText, quotes) {

    clearChildren(container);

    if (!fullText) {

      return;

    }

    if (!quotes || quotes.length === 0) {

      container.appendChild(document.createTextNode(fullText));

      return;

    }



    var intervals = [];

    for (var i = 0; i < quotes.length; i += 1) {

      var item = quotes[i];

      if (!item) {

        continue;

      }

      var q = typeof item === "string" ? item : item.quote;

      var qIndex = typeof item === "object" && item !== null ? item.index : null;

      if (!q) {

        continue;

      }

      var searchFrom = 0;

      while (searchFrom <= fullText.length) {

        var idx = fullText.indexOf(q, searchFrom);

        if (idx === -1) {

          break;

        }

        intervals.push({ start: idx, end: idx + q.length, index: qIndex });

        searchFrom = idx + Math.max(1, q.length);

      }

    }



    if (intervals.length === 0) {

      container.appendChild(document.createTextNode(fullText));

      return;

    }



    intervals.sort(function (a, b) {

      if (a.start !== b.start) {

        return a.start - b.start;

      }

      return b.end - a.end;

    });



    var merged = [intervals[0]];

    for (var k = 1; k < intervals.length; k += 1) {

      var prev = merged[merged.length - 1];

      var curr = intervals[k];

      if (curr.start <= prev.end) {

        if (curr.end > prev.end) {

          prev.end = curr.end;

          if (!prev.index && curr.index) {

            prev.index = curr.index;

          }

        }

      } else {

        merged.push(curr);

      }

    }



    var cursor = 0;

    for (var m = 0; m < merged.length; m += 1) {

      var range = merged[m];

      if (range.start > cursor) {

        container.appendChild(document.createTextNode(fullText.slice(cursor, range.start)));

      }

      var mark = document.createElement("mark");

      mark.className = "quote-highlight";

      if (range.index) {

        mark.setAttribute("data-flag-index", String(range.index));

        var marker = document.createElement("span");

        marker.className = "flag-marker-badge";

        marker.textContent = String(range.index);

        marker.setAttribute("aria-hidden", "true");

        mark.appendChild(marker);

      }

      mark.appendChild(document.createTextNode(fullText.slice(range.start, range.end)));

      container.appendChild(mark);

      cursor = range.end;

    }



    if (cursor < fullText.length) {

      container.appendChild(document.createTextNode(fullText.slice(cursor)));

    }

  }



  function showStatusBanner(text) {

    if (!text) {

      elStatusBanner.textContent = "";

      elStatusBanner.classList.add("hidden");

      return;

    }

    elStatusBanner.textContent = text;

    elStatusBanner.classList.remove("hidden");

  }



  function updateDoorBadges() {

    var inDoor =

      state.screen === "game" || state.screen === "pause" || state.screen === "failed";

    var doorNames = ["Email", "SMS", "Chat"];

    for (var i = 0; i < LEVEL_COUNT; i += 1) {

      var doorLevel = i + 1;

      var badge = elDoorBadges[i];

      if (!badge) continue;

      badge.classList.remove("door-active", "door-unlocked", "door-locked");

      badge.removeAttribute("aria-current");

      var stateSpan = badge.querySelector(".door-step-state");

      var statusText = "LOCKED";

      if (inDoor && doorLevel === state.level) {

        badge.classList.add("door-active");

        badge.setAttribute("aria-current", "step");

        statusText = "ACTIVE";

      } else if (doorLevel <= state.clearedDoors) {

        badge.classList.add("door-unlocked");

        statusText = "CLEARED";

      } else {

        badge.classList.add("door-locked");

        statusText = "LOCKED";

      }

      if (stateSpan) {

        stateSpan.textContent = " · " + statusText;

      } else {

        badge.textContent = "0" + doorLevel + " " + doorNames[i] + " · " + statusText;

      }

    }

  }



  function setScreen(name) {

    state.screen = name;

    var isMenu = name === "menu";

    elWebsiteView.classList.toggle("hidden", !isMenu);

    elTerminalView.classList.toggle("hidden", isMenu);



    var keys = Object.keys(screens);

    for (var i = 0; i < keys.length; i += 1) {

      screens[keys[i]].classList.toggle("hidden", keys[i] !== name);

    }

    updateDoorBadges();

  }



  function scrollToTop() {

    window.scrollTo(0, 0);

  }



  /* ---------- Timer ---------- */



  function stopTimer() {

    if (state.timerId !== null) {

      window.clearInterval(state.timerId);

      state.timerId = null;

    }

    if (state.lastTickTime !== null) {

      var now = Date.now();

      var elapsed = now - state.lastTickTime;

      state.timeLeftMs = Math.max(0, state.timeLeftMs - elapsed);

      state.timeLeft = Math.max(0, Math.ceil(state.timeLeftMs / 1000));

      state.lastTickTime = null;

      updateHud();

    }

  }



  function startTimer() {

    stopTimer();

    state.lastTickTime = Date.now();

    state.timerId = window.setInterval(function () {

      if (state.screen !== "game" || state.phase !== "question") {

        return;

      }

      var now = Date.now();

      var elapsed = now - state.lastTickTime;

      state.lastTickTime = now;

      state.timeLeftMs = Math.max(0, state.timeLeftMs - elapsed);

      var prevSec = state.timeLeft;

      state.timeLeft = Math.max(0, Math.ceil(state.timeLeftMs / 1000));

      if (state.timeLeft !== prevSec) {

        updateHud();

      }

      if (state.timeLeftMs <= 0) {

        stopTimer();

        failLevel("time");

      }

    }, 100);

  }



  /* ---------- HUD ---------- */

  function updateHud() {

    var totalInLevel = state.levelQueue.length || 6;

    elHudLevel.textContent = state.level + " / " + LEVEL_COUNT;

    elHudProgress.textContent = (state.currentIndex + 1) + " / " + totalInLevel;

    elHudTimer.textContent = state.timeLeft + "s";

    elHudTimer.classList.toggle("timer-low", state.timeLeft <= 20);

    // Segmented Queue Progress Bar
    var elQueueSegments = byId("hud-queue-segments");
    if (elQueueSegments) {
      clearChildren(elQueueSegments);
      for (var s = 0; s < totalInLevel; s += 1) {
        var seg = document.createElement("div");
        seg.className = "queue-segment";
        if (s < state.currentDoorAnswers.length) {
          var ans = state.currentDoorAnswers[s];
          seg.classList.add(ans.isCorrect ? "segment-correct" : "segment-wrong");
        } else if (s === state.currentIndex) {
          seg.classList.add("segment-current");
        } else {
          seg.classList.add("segment-pending");
        }
        elQueueSegments.appendChild(seg);
      }
    }

    // Circular Countdown Ring & CSS Custom Property
    var timerPct = Math.max(0, Math.min(100, Math.round((state.timeLeft / LEVEL_DURATION_SECONDS) * 100)));
    if (elTerminalView) {
      elTerminalView.style.setProperty("--gp-timer-pct", String(timerPct));
    }
    var timerWrap = document.querySelector(".hud-timer-wrap");
    if (timerWrap) {
      timerWrap.classList.remove("timer-ok", "timer-warn", "timer-danger", "timer-paused");
      if (state.phase === "feedback") {
        timerWrap.classList.add("timer-paused");
      } else if (state.timeLeft <= 10) {
        timerWrap.classList.add("timer-danger");
      } else if (state.timeLeft <= 30) {
        timerWrap.classList.add("timer-warn");
      } else {
        timerWrap.classList.add("timer-ok");
      }
    }

    // Screen reader announcement strictly at 30s and 10s only
    if (state.phase === "question") {
      if (state.timeLeft === 30 && state.lastAnnouncedSec !== 30) {
        state.lastAnnouncedSec = 30;
        announce("30 seconds remaining on Door " + state.level);
      } else if (state.timeLeft === 10 && state.lastAnnouncedSec !== 10) {
        state.lastAnnouncedSec = 10;
        announce("10 seconds remaining on Door " + state.level);
      }
    }

    elHudLives.textContent = state.lives + " / " + INITIAL_LIVES;

    elHudLives.setAttribute(

      "aria-label",

      state.lives + (state.lives === 1 ? " life" : " lives") + " remaining"

    );

    // Visual Shield Icons for Lives
    var elShieldItems = document.querySelectorAll(".shield-glyph-item");
    for (var l = 0; l < elShieldItems.length; l += 1) {
      var item = elShieldItems[l];
      var isAlive = l < state.lives;
      item.classList.toggle("shield-alive", isAlive);
      item.classList.toggle("shield-lost", !isAlive);
      var useTag = item.querySelector("use");
      if (useTag) {
        useTag.setAttribute("href", isAlive ? "#icon-shield" : "#icon-shield-crack");
      }
    }

    elHudScore.textContent = String(state.score);

    setButtonLabel(elBtnHint, state.hintAvailable ? "HINT (1)" : "HINT (0)", "[H]");

    var elHintPill = byId("hint-count-pill");
    if (elHintPill) {
      elHintPill.textContent = state.hintAvailable ? "1" : "0";
    }

    elBtnHint.disabled =

      state.phase !== "question" || !state.hintAvailable || state.hintUsedOnCurrent;

  }



  /* ---------- Title Menu & Website Navigation ---------- */



  function getContinueDoor() {

    if (state.clearedDoors >= 1 && state.clearedDoors < LEVEL_COUNT) {

      return state.clearedDoors + 1;

    }

    return 0;

  }



  function highestAvailableDoor() {

    return Math.min(LEVEL_COUNT, state.clearedDoors + 1);

  }



  function getActiveTitleMenuButtons() {

    var list = [];

    for (var i = 0; i < allTitleMenuButtons.length; i += 1) {

      var btn = allTitleMenuButtons[i];

      if (!btn || btn.disabled) {

        continue;

      }

      var parentLi = btn.parentElement;

      if (parentLi && parentLi.classList.contains("hidden")) {

        continue;

      }

      list.push(btn);

    }

    return list;

  }



  function setSelectedMenuButton(targetBtn, shouldFocus) {

    var activeButtons = getActiveTitleMenuButtons();

    if (activeButtons.length === 0) {

      return;

    }

    var idx = activeButtons.indexOf(targetBtn);

    if (idx === -1) {

      idx = 0;

    }

    state.selectedMenuIndex = idx;



    for (var i = 0; i < allTitleMenuButtons.length; i += 1) {

      var btn = allTitleMenuButtons[i];

      if (btn) {

        btn.classList.toggle("is-selected", btn === activeButtons[idx]);

      }

    }

    if (shouldFocus) {

      focusElement(activeButtons[idx]);

    }

  }



  function moveMenuSelection(delta) {

    var activeButtons = getActiveTitleMenuButtons();

    if (activeButtons.length === 0) {

      return;

    }

    var count = activeButtons.length;

    var nextIndex = (state.selectedMenuIndex + delta + count) % count;

    setSelectedMenuButton(activeButtons[nextIndex], true);

  }



  function renderMenu() {

    elMenuBest.textContent = String(getBestScore());

    elMenuProgress.textContent = state.clearedDoors + " / " + LEVEL_COUNT;



    var elShowcaseBest = byId("showcase-best-score");

    var elShowcaseProgress = byId("showcase-progress");

    if (elShowcaseBest) {

      elShowcaseBest.textContent = String(getBestScore());

    }

    if (elShowcaseProgress) {

      elShowcaseProgress.textContent = state.clearedDoors + " / " + LEVEL_COUNT;

    }



    var highest = highestAvailableDoor();

    [2, 3].forEach(function (d) {

      var card = byId("showcase-card-" + d);

      var statusTag = byId("showcase-card-status-" + d);

      var lockIcon = byId("showcase-card-lock-" + d);

      if (card && statusTag) {

        var isAvail = d <= highest;

        card.classList.toggle("is-available", isAvail);

        card.classList.toggle("is-locked", !isAvail);

        statusTag.className = "card-status-tag " + (isAvail ? "tag-available" : "tag-locked");

        statusTag.textContent = isAvail ? "AVAILABLE" : "LOCKED";

        if (lockIcon) {

          lockIcon.textContent = isAvail ? "\u2192" : "\uD83D\uDD12";

          lockIcon.className = isAvail ? "action-arrow-icon" : "action-lock-icon";

        }

      }

    });



    var continueDoor = getContinueDoor();

    elMenuContinueItem.classList.toggle("hidden", continueDoor === 0);

    if (continueDoor) {

      elMenuContinueLabel.textContent = "CONTINUE";

      elMenuContinueMeta.textContent = "DOOR 0" + continueDoor;

    }



    elMenuStart.disabled = !state.loaded;

    elMenuContinue.disabled = !state.loaded;

    elMenuSelect.disabled = !state.loaded;

    elMenuStorageNote.classList.toggle("hidden", isStorageAvailable());



    checkAndUpdateBadges(false);

    syncSoundButtons();



    var defaultBtn = !state.loaded

      ? elMenuHowto

      : continueDoor

      ? elMenuContinue

      : elMenuStart;

    setSelectedMenuButton(defaultBtn, false);

  }



  function showMenu() {

    if (state.screen === "game" || state.screen === "pause" || state.screen === "failed") {

      state.score = state.levelStartScore;

    }

    stopTimer();

    state.phase = "idle";

    setScreen("menu");

    renderMenu();

    scrollToTop();

    var activeButtons = getActiveTitleMenuButtons();

    if (activeButtons[state.selectedMenuIndex]) {

      setSelectedMenuButton(activeButtons[state.selectedMenuIndex], false);

    }

    announce("Main menu.");

  }



  function scrollToSiteSection(sectionId, announcement) {

    if (state.screen !== "menu") {

      setScreen("menu");

      renderMenu();

    }

    var section = byId(sectionId);

    if (section) {

      section.scrollIntoView({ behavior: "smooth" });

      focusElement(section);

    }

    if (announcement) {

      announce(announcement);

    }

  }



  function showHowTo() {

    setScreen("howto");

    scrollToTop();

    focusElement(elHowtoBack);

    announce("How to play.");

  }



  function renderSelect() {

    for (var i = 0; i < LEVEL_COUNT; i += 1) {

      var door = i + 1;

      var card = elDoorCards[i];

      var available = door === 1 || state.clearedDoors >= door - 1;

      var cleared = door <= state.clearedDoors;

      card.disabled = !available;

      card.classList.toggle("door-card-cleared", cleared);

      if (cleared) {

        elDoorStatuses[i].textContent = "-> CLEARED · PLAY AGAIN";

      } else if (available) {

        elDoorStatuses[i].textContent = "-> AVAILABLE";

      } else {

        elDoorStatuses[i].textContent = "LOCKED · CLEAR DOOR " + (door - 1) + " FIRST";

      }

    }

  }



  function showSelect() {

    if (!state.loaded) {

      return;

    }

    setScreen("select");

    renderSelect();

    scrollToTop();

    focusElement(elDoorCards[highestAvailableDoor() - 1]);

    announce("Select door. " + highestAvailableDoor() + " of " + LEVEL_COUNT + " doors available.");

  }



  /* ---------- Level flow ---------- */

  function renderSenderBlock(senderStr, channel) {
    clearChildren(elMsgSender);
    var elAvatar = byId("channel-avatar");

    if (channel === "email") {
      var nameMatch = senderStr.match(/^([^<]+)<([^>]+)>/);
      var displayName = nameMatch ? nameMatch[1].trim() : senderStr;
      var emailAddr = nameMatch ? nameMatch[2].trim() : (senderStr.indexOf("@") !== -1 ? senderStr : "");

      var initials = "EM";
      var words = displayName.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        initials = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1 && words[0].length >= 2) {
        initials = words[0].slice(0, 2).toUpperCase();
      }
      if (elAvatar) {
        elAvatar.textContent = initials;
      }

      if (nameMatch) {
        var nameSpan = document.createElement("span");
        nameSpan.className = "sender-display-name";
        nameSpan.textContent = displayName + " ";
        elMsgSender.appendChild(nameSpan);

        var addrSpan = document.createElement("span");
        addrSpan.className = "sender-address-mono";
        addrSpan.appendChild(document.createTextNode("<"));

        var atPos = emailAddr.indexOf("@");
        if (atPos !== -1) {
          addrSpan.appendChild(document.createTextNode(emailAddr.slice(0, atPos + 1)));
          var domSpan = document.createElement("span");
          domSpan.className = "sender-domain-highlight";
          domSpan.textContent = emailAddr.slice(atPos + 1);
          addrSpan.appendChild(domSpan);
        } else {
          addrSpan.appendChild(document.createTextNode(emailAddr));
        }
        addrSpan.appendChild(document.createTextNode(">"));
        elMsgSender.appendChild(addrSpan);
      } else {
        var atPos2 = senderStr.indexOf("@");
        if (atPos2 !== -1) {
          elMsgSender.appendChild(document.createTextNode(senderStr.slice(0, atPos2 + 1)));
          var domSpan2 = document.createElement("span");
          domSpan2.className = "sender-domain-highlight";
          domSpan2.textContent = senderStr.slice(atPos2 + 1);
          elMsgSender.appendChild(domSpan2);
        } else {
          elMsgSender.appendChild(document.createTextNode(senderStr));
        }
      }
    } else if (channel === "sms") {
      if (elAvatar) {
        elAvatar.textContent = "SMS";
      }
      var smsSpan = document.createElement("span");
      smsSpan.className = "sms-sender-badge";
      smsSpan.textContent = senderStr;
      elMsgSender.appendChild(smsSpan);
    } else {
      if (elAvatar) {
        var cWords = senderStr.split(/\s+/).filter(Boolean);
        var cInit = cWords.length >= 2 ? (cWords[0][0] + cWords[1][0]).toUpperCase() : senderStr.slice(0, 2).toUpperCase();
        elAvatar.textContent = cInit;
      }
      var onlineDot = document.createElement("span");
      onlineDot.className = "chat-online-dot";
      onlineDot.setAttribute("aria-hidden", "true");
      elMsgSender.appendChild(onlineDot);

      var chatSpan = document.createElement("span");
      chatSpan.className = "chat-sender-name";
      chatSpan.textContent = senderStr;
      elMsgSender.appendChild(chatSpan);
    }
  }

  function getCurrentMessage() {

    return state.levelQueue[state.currentIndex] || null;

  }



  function renderCurrentMessage() {

    var msg = getCurrentMessage();

    if (!msg) {

      return;

    }



    state.phase = "question";

    state.hintUsedOnCurrent = false;



    elMessageTerminal.classList.remove("channel-email", "channel-sms", "channel-chat", "resolution-correct-glow", "resolution-wrong-shake");

    elMessageTerminal.classList.add("channel-" + msg.channel);

    // Subtle inspection scanline trigger
    elMessageTerminal.classList.remove("message-inspect-scan");
    void elMessageTerminal.offsetWidth;
    elMessageTerminal.classList.add("message-inspect-scan");



    elTerminalDoorLabel.textContent = "// soc terminal · door " + state.level;

    elChannelBadge.textContent = msg.channel.toUpperCase();



    if (msg.channel === "email") {

      elSenderLabel.textContent = "From:";

    } else if (msg.channel === "sms") {

      elSenderLabel.textContent = "SMS:";

    } else {

      elSenderLabel.textContent = "Chat:";

    }



    renderSenderBlock(msg.sender, msg.channel);



    if (msg.channel === "email" && msg.subject) {

      elMsgSubjectRow.classList.remove("hidden");

      renderTextWithHighlights(elMsgSubject, msg.subject, []);

    } else {

      elMsgSubjectRow.classList.add("hidden");

      clearChildren(elMsgSubject);

    }



    renderTextWithHighlights(elMsgBody, msg.body, []);

    // Detect file attachments in message body
    var elAttWrap = byId("msg-attachments-wrap");
    var elAttName = byId("attachment-chip-name");
    if (elAttWrap && elAttName) {
      var fileMatch = msg.body.match(/\b([a-zA-Z0-9_-]+\.(?:apk|zip|rar|exe|scr|iso|pdf|docx?|xlsx?))\b/i);
      if (fileMatch) {
        elAttName.textContent = fileMatch[1];
        elAttWrap.classList.remove("hidden");
      } else {
        elAttWrap.classList.add("hidden");
      }
    }

    // Microcopy confidence nudge
    var nudges = [
      "Inspect the sender address and root domain carefully",
      "Is there artificial pressure, urgency, or an extreme deadline?",
      "Check if the link matches the authentic service",
      "Legitimate entities never ask for confidential OTPs or passwords",
      "Verify unexpected requests via established out-of-band channels"
    ];
    var elNudgeText = byId("decision-nudge-text");
    if (elNudgeText) {
      elNudgeText.textContent = nudges[state.currentIndex % nudges.length];
    }



    elHintPanel.classList.add("hidden");

    elHintText.textContent = "";



    elFeedbackPanel.classList.add("hidden");

    elFeedbackPanel.classList.remove("feedback-correct", "feedback-wrong");



    elBtnPhishing.disabled = false;

    elBtnSafe.disabled = false;

    updateHud();



    focusElement(elMessageTerminal);

  }



  function startLevel(levelNumber, statusMessage) {

    stopTimer();

    state.level = levelNumber;

    state.levelStartScore = state.score;

    state.lives = INITIAL_LIVES;

    state.timeLeft = LEVEL_DURATION_SECONDS;

    state.timeLeftMs = LEVEL_DURATION_SECONDS * 1000;

    state.lastTickTime = null;

    state.hintAvailable = true;

    state.hintUsedOnCurrent = false;

    state.currentIndex = 0;

    state.currentDoorAnswers = [];



    var levelMessages = state.allMessages.filter(function (m) {

      return m.level === levelNumber;

    });

    state.levelQueue = shuffleArray(levelMessages);



    setScreen("game");

    syncSoundButtons();

    renderAuditLog();

    scrollToTop();

    showStatusBanner(statusMessage || "");

    renderCurrentMessage();

    startTimer();



    announce(statusMessage || "Door " + levelNumber + " started. 120 seconds on the clock.");

  }



  function startNewRun(door) {

    if (!state.loaded) {

      return;

    }

    state.score = 0;

    state.levelStartScore = 0;

    state.missedCategories = {};

    state.currentDoorAnswers = [];

    state.committedRunAnswers = {};

    startLevel(door, "");

  }



  function continueRun() {

    var door = getContinueDoor();

    if (!state.loaded || !door) {

      return;

    }

    startLevel(door, "");

  }



  function launchQuickPlay() {

    if (!state.loaded) {

      return;

    }

    var continueDoor = getContinueDoor();

    if (continueDoor) {

      continueRun();

    } else {

      startNewRun(1);

    }

  }



  function retryDoor() {

    state.score = state.levelStartScore;

    state.currentDoorAnswers = [];

    startLevel(state.level, "Door " + state.level + " restarted from the beginning.");

  }



  function failLevel(reason) {

    stopTimer();

    state.phase = "failed";

    state.currentDoorAnswers = [];

    state.streak = 0;

    playSoundFailure();



    var reasonText =

      reason === "time"

        ? "Time ran out. The 120-second lockdown timer for Door " + state.level + " reached zero."

        : "Out of lives. You used all " + INITIAL_LIVES + " lives on Door " + state.level + ".";



    elFailedDoorNum.textContent = String(state.level);

    elFailedReason.textContent = reasonText;

    // Constructive practice focus card
    var elPracticeContent = byId("failed-practice-content");
    if (elPracticeContent) {
      clearChildren(elPracticeContent);
      var missedCats = Object.keys(state.missedCategories);
      if (missedCats.length > 0) {
        for (var mc = 0; mc < Math.min(2, missedCats.length); mc += 1) {
          var mCat = missedCats[mc];
          var pItem = document.createElement("div");
          pItem.className = "practice-item";
          var pStrong = document.createElement("strong");
          pStrong.textContent = formatCategory(mCat) + ": ";
          pItem.appendChild(pStrong);

          var pAdvice = document.createElement("span");
          pAdvice.textContent = mCat === "fake_domain"
            ? "Inspect the full root domain before acting. Scammers use lookalike suffixes."
            : mCat === "urgency"
            ? "Severe deadlines or pressure tactics are crafted to rush you past red flags."
            : mCat === "sensitive_data"
            ? "Legitimate support never asks for confidential OTPs, passwords, or PINs."
            : mCat === "malicious_attachment"
            ? "Never install APKs, SCRs, or unverified executables distributed in messages."
            : "Look for artificial pressure and unverified external destinations.";
          pItem.appendChild(pAdvice);
          elPracticeContent.appendChild(pItem);
        }
      } else {
        var defItem = document.createElement("div");
        defItem.className = "practice-item";
        var defSpan = document.createElement("span");
        defSpan.textContent = reason === "time"
          ? "Scan sender addresses and root domains first to speed up classification."
          : "Examine sender root domains carefully; legitimate alerts tell you to check official apps.";
        defItem.appendChild(defSpan);
        elPracticeContent.appendChild(defItem);
      }
    }

    elFailedNote.textContent =

      "Retrying restarts Door " +

      state.level +

      " from the beginning with a new message order, 120 seconds, " +

      INITIAL_LIVES +

      " lives, and a fresh hint. Your score returns to " +

      state.levelStartScore +

      ".";



    setScreen("failed");

    scrollToTop();

    focusElement(elFailedRetry);

    announce("Door " + state.level + " failed. " + reasonText);

  }



  function completeLevel() {

    stopTimer();

    state.phase = "idle";

    playSoundUnlock();

    checkAndUpdateBadges(true);



    state.committedRunAnswers[state.level] = state.currentDoorAnswers.slice();

    state.currentDoorAnswers = [];



    var levelPoints = state.score - state.levelStartScore;

    var timeBonus = state.timeLeft;

    state.score += timeBonus;



    state.clearedDoors = Math.max(state.clearedDoors, state.level);

    saveClearedDoors();

    saveBestScore(state.score);



    elUnlockedDoorNum.textContent = String(state.level);

    elUnlockedPoints.textContent = String(levelPoints);

    elUnlockedBonus.textContent = "+" + timeBonus;

    elUnlockedTotal.textContent = String(state.score);

    // Mini "what you mastered" line
    var doorAnswers = state.committedRunAnswers[state.level] || [];
    var masteredCats = [];
    for (var a = 0; a < doorAnswers.length; a += 1) {
      var item = doorAnswers[a];
      if (item.isCorrect && item.message.is_phishing && item.message.red_flags) {
        for (var r = 0; r < item.message.red_flags.length; r += 1) {
          var cName = formatCategory(item.message.red_flags[r].category);
          if (masteredCats.indexOf(cName) === -1) {
            masteredCats.push(cName);
          }
        }
      }
    }
    var elMastery = byId("unlocked-mastery");
    if (elMastery) {
      clearChildren(elMastery);
      if (masteredCats.length > 0) {
        var mLabel = document.createElement("span");
        mLabel.className = "mastery-tag-label";
        mLabel.textContent = "PATTERNS NEUTRALIZED: ";
        elMastery.appendChild(mLabel);
        var mContent = document.createElement("span");
        mContent.className = "mastery-tag-list";
        mContent.textContent = masteredCats.slice(0, 3).join(" · ");
        elMastery.appendChild(mContent);
      }
    }



    if (state.level < LEVEL_COUNT) {

      elUnlockedNote.textContent =

        "Door " + state.level + " is open. Door " + (state.level + 1) + " is now available.";

      setButtonLabel(elUnlockedNext, "NEXT DOOR · DOOR " + (state.level + 1), "[ENTER]");

    } else {

      elUnlockedNote.textContent = "The final door is open. Your debrief is ready.";

      setButtonLabel(elUnlockedNext, "FINAL DEBRIEF", "[ENTER]");

    }



    setScreen("unlocked");

    scrollToTop();

    focusElement(elUnlockedNext);

    announce(

      "Door " +

        state.level +

        " unlocked. Door score " +

        levelPoints +

        ", time bonus " +

        timeBonus +

        ", run total " +

        state.score +

        "."

    );

  }



  function goNextDoor() {

    if (state.screen !== "unlocked") {

      return;

    }

    if (state.level < LEVEL_COUNT) {

      startLevel(state.level + 1, "");

    } else {

      showEndScreen();

    }

  }



  /* ---------- Pause ---------- */



  function pauseGame() {

    if (state.screen !== "game") {

      return;

    }

    if (state.phase !== "question" && state.phase !== "feedback") {

      return;

    }

    stopTimer();

    elPauseDoorNum.textContent = String(state.level);

    elPauseTime.textContent = state.timeLeft + "s";

    setScreen("pause");

    focusElement(elPauseResume);

    announce("Paused. Timer stopped at " + state.timeLeft + " seconds.");

  }



  function resumeGame() {

    if (state.screen !== "pause") {

      return;

    }

    setScreen("game");

    if (state.phase === "question") {

      startTimer();

      focusElement(elMessageTerminal);

    } else {

      focusElement(elBtnContinue);

    }

    announce("Resumed. " + state.timeLeft + " seconds remaining.");

  }



  /* ---------- Hints and answers ---------- */



  function useHint() {

    if (

      state.screen !== "game" ||

      state.phase !== "question" ||

      !state.hintAvailable ||

      state.hintUsedOnCurrent

    ) {

      return;

    }



    var msg = getCurrentMessage();

    if (!msg) {

      return;

    }



    state.hintsUsedCount += 1;

    playSoundInspect();



    state.hintAvailable = false;

    state.hintUsedOnCurrent = true;



    if (msg.is_phishing) {

      var bodyFlag = null;

      for (var i = 0; i < msg.red_flags.length; i += 1) {

        if (msg.body.indexOf(msg.red_flags[i].quote) !== -1) {

          bodyFlag = msg.red_flags[i];

          break;

        }

      }

      if (!bodyFlag && msg.red_flags.length > 0) {

        bodyFlag = msg.red_flags[0];

      }



      if (bodyFlag) {

        if (msg.body.indexOf(bodyFlag.quote) !== -1) {

          renderTextWithHighlights(elMsgBody, msg.body, [bodyFlag.quote]);

        } else if (msg.subject && msg.subject.indexOf(bodyFlag.quote) !== -1) {

          renderTextWithHighlights(elMsgSubject, msg.subject, [bodyFlag.quote]);

        } else {

          renderTextWithHighlights(elMsgSender, msg.sender, [bodyFlag.quote]);

        }

        var hintNotice =

          'Highlighted suspicious text "' +

          bodyFlag.quote +

          '" (' +

          formatCategory(bodyFlag.category) +

          ").";

        elHintText.textContent = hintNotice;

        elHintPanel.classList.remove("hidden");

        announce("Hint used: " + hintNotice);

      }

    } else {

      var safeHint =

        msg.safe_signals && msg.safe_signals.length > 0

          ? msg.safe_signals[0]

          : "No suspicious links or urgent demands detected.";

      elHintText.textContent = safeHint;

      elHintPanel.classList.remove("hidden");

      announce("Hint used: " + safeHint);

    }



    updateHud();

    checkAndUpdateBadges(true);

  }



  function submitDecision(chosePhishing) {

    if (state.screen !== "game" || state.phase !== "question") {

      return;

    }



    stopTimer();

    state.phase = "feedback";

    showStatusBanner("");



    var msg = getCurrentMessage();

    var isCorrect = chosePhishing === msg.is_phishing;



    state.currentDoorAnswers.push({

      message: msg,

      userDecision: chosePhishing,

      isCorrect: isCorrect,

      level: state.level

    });



    if (isCorrect) {

      state.score += POINTS_PER_CORRECT;

      playSoundSuccess();

      state.streak += 1;

      state.maxStreak = Math.max(state.maxStreak, state.streak);

      state.totalCorrect += 1;

      if (msg.is_phishing) {

        state.threatsNeutralized += 1;

      }

      if (state.channelSuccess[msg.channel] !== undefined) {

        state.channelSuccess[msg.channel] += 1;

      }

    } else {

      playSoundFailure();

      state.streak = 0;

      state.lives = Math.max(0, state.lives - 1);

      if (msg.is_phishing && !chosePhishing) {

        for (var i = 0; i < msg.red_flags.length; i += 1) {

          var cat = msg.red_flags[i].category;

          state.missedCategories[cat] = (state.missedCategories[cat] || 0) + 1;

        }

      }

    }



    addAuditEntry(msg, chosePhishing, isCorrect, isCorrect ? POINTS_PER_CORRECT : 0);

    checkAndUpdateBadges(true);



    elBtnPhishing.disabled = true;

    elBtnSafe.disabled = true;

    updateHud();

    // Pulse / glow feedback on message card
    elMessageTerminal.classList.remove("resolution-correct-glow", "resolution-wrong-shake");
    if (isCorrect) {
      elMessageTerminal.classList.add("resolution-correct-glow");
    } else {
      elMessageTerminal.classList.add("resolution-wrong-shake");
    }

    // Points / Lives delta chip
    var elDeltaChip = byId("feedback-delta-chip");
    if (elDeltaChip) {
      elDeltaChip.textContent = isCorrect ? "+100 PTS" : "-1 LIFE";
      elDeltaChip.className = "feedback-delta-chip " + (isCorrect ? "chip-safe" : "chip-danger");
    }

    // Float-up score chip on correct
    if (isCorrect) {
      var floatChip = byId("hud-score-chip");
      if (floatChip) {
        floatChip.classList.remove("hidden");
        floatChip.classList.remove("chip-animate");
        void floatChip.offsetWidth;
        floatChip.classList.add("chip-animate");
        setTimeout(function () {
          floatChip.classList.add("hidden");
        }, 1000);
      }
    }

    var flaggedQuotes = msg.is_phishing && msg.red_flags
      ? msg.red_flags.map(function (flag, idx) {
          return { quote: flag.quote, index: idx + 1 };
        })
      : [];

    renderTextWithHighlights(elMsgSender, msg.sender, flaggedQuotes);

    if (msg.channel === "email" && msg.subject) {

      renderTextWithHighlights(elMsgSubject, msg.subject, flaggedQuotes);

    }

    renderTextWithHighlights(elMsgBody, msg.body, flaggedQuotes);



    elFeedbackPanel.classList.remove("hidden", "feedback-correct", "feedback-wrong");

    elFeedbackPanel.classList.add(isCorrect ? "feedback-correct" : "feedback-wrong");



    var verdictHeadline = isCorrect
      ? (msg.is_phishing ? "Correct — it's phishing" : "Correct — this message is safe")
      : (msg.is_phishing ? "Security breach — this was phishing" : "False alarm — this message was safe");

    var actualNature = msg.is_phishing

      ? "This message is a PHISHING attempt."

      : "This message is SAFE (legitimate).";



    if (state.lives <= 0) {

      actualNature += " You have no lives left on this door.";

    }



    elFeedbackVerdict.textContent = verdictHeadline;

    elFeedbackSubtitle.textContent = actualNature;



    clearChildren(elFeedbackList);

    if (msg.is_phishing) {

      elFeedbackListTitle.textContent = "// red flags identified in message";

      for (var f = 0; f < msg.red_flags.length; f += 1) {

        var flag = msg.red_flags[f];

        var flagIdx = f + 1;

        var li = document.createElement("li");

        li.className = "flag-card-item";

        li.setAttribute("data-flag-index", String(flagIdx));

        li.setAttribute("tabindex", "0");

        var badge = document.createElement("span");

        badge.className = "flag-num-badge";

        badge.textContent = String(flagIdx);

        li.appendChild(badge);

        var cardContent = document.createElement("div");

        cardContent.className = "flag-card-content";

        var catTag = document.createElement("span");

        catTag.className = "flag-category-tag";

        catTag.textContent = formatCategory(flag.category);

        (function (flagCat) {

          catTag.setAttribute("role", "button");

          catTag.setAttribute("tabindex", "0");

          catTag.title = "View in Security Threat Encyclopedia";

          catTag.addEventListener("click", function () {

            openEncyclopediaModal(getEncyclopediaTermByCategory(flagCat));

          });

          catTag.addEventListener("keydown", function (e) {

            if (e.key === "Enter" || e.key === " ") {

              e.preventDefault();

              openEncyclopediaModal(getEncyclopediaTermByCategory(flagCat));

            }

          });

        })(flag.category);

        cardContent.appendChild(catTag);

        var quoteSpan = document.createElement("span");

        quoteSpan.className = "flag-quote-ref";

        quoteSpan.textContent = '"' + flag.quote + '"';

        cardContent.appendChild(quoteSpan);

        var explSpan = document.createElement("span");

        explSpan.className = "flag-explanation-text";

        explSpan.textContent = " — " + flag.explanation;

        cardContent.appendChild(explSpan);

        li.appendChild(cardContent);

        (function (itemLi, idxNum) {

          function setLinkedHighlight(active) {

            itemLi.classList.toggle("flag-item-active", active);

            var marks = elMessageTerminal.querySelectorAll('mark[data-flag-index="' + idxNum + '"]');

            for (var m = 0; m < marks.length; m += 1) {

              marks[m].classList.toggle("flag-highlight-active", active);

            }

          }

          itemLi.addEventListener("mouseenter", function () { setLinkedHighlight(true); });

          itemLi.addEventListener("mouseleave", function () { setLinkedHighlight(false); });

          itemLi.addEventListener("focus", function () { setLinkedHighlight(true); });

          itemLi.addEventListener("blur", function () { setLinkedHighlight(false); });

        })(li, flagIdx);

        elFeedbackList.appendChild(li);

      }

    } else {

      elFeedbackListTitle.textContent = "// safe signals identified in message";

      for (var s = 0; s < msg.safe_signals.length; s += 1) {

        var safeLi = document.createElement("li");

        safeLi.className = "safe-signal-card";

        var safeBadge = document.createElement("span");

        safeBadge.className = "safe-num-badge";

        safeBadge.textContent = "✓";

        safeLi.appendChild(safeBadge);

        var safeContent = document.createElement("div");

        safeContent.className = "safe-card-content";

        safeContent.textContent = msg.safe_signals[s];

        safeLi.appendChild(safeContent);

        elFeedbackList.appendChild(safeLi);

      }

    }



    elFeedbackTip.textContent = msg.tip;



    if (elBtnFeedbackEncyclopedia) {

      elBtnFeedbackEncyclopedia.onclick = function () {

        if (msg.is_phishing && msg.red_flags && msg.red_flags.length > 0) {

          openEncyclopediaModal(getEncyclopediaTermByCategory(msg.red_flags[0].category));

        } else {

          openEncyclopediaModal("safe-signal-verification");

        }

      };

    }



    var continueLabel = "CONTINUE";

    if (state.lives > 0 && state.currentIndex + 1 >= state.levelQueue.length) {

      continueLabel = "UNLOCK DOOR " + state.level;

    }

    setButtonLabel(elBtnContinue, continueLabel, "[ENTER]");



    announce(verdictHeadline + ". " + actualNature + " Tip: " + msg.tip);
    if (window.innerWidth <= 640 && elFeedbackPanel && typeof elFeedbackPanel.scrollIntoView === "function") {
      setTimeout(function () {
        elFeedbackPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }

    focusElement(elBtnContinue);

  }



  function continueAfterFeedback() {

    if (state.screen !== "game" || state.phase !== "feedback") {

      return;

    }



    if (state.lives <= 0) {

      failLevel("lives");

      return;

    }



    if (state.currentIndex + 1 < state.levelQueue.length) {

      state.currentIndex += 1;

      renderCurrentMessage();

      startTimer();

      return;

    }



    completeLevel();

  }



  /* ---------- End screen ---------- */



  function computeMostMissedCategory() {

    var bestCategory = null;

    var bestCount = 0;

    var keys = Object.keys(state.missedCategories);

    for (var i = 0; i < keys.length; i += 1) {

      var count = state.missedCategories[keys[i]];

      if (count > bestCount) {

        bestCount = count;

        bestCategory = keys[i];

      }

    }

    if (!bestCategory) {

      return "None — you did not mark any phishing message as safe.";

    }

    return formatCategory(bestCategory) + " (" + bestCount + " missed)";

  }



  function showEndScreen() {

    stopTimer();

    state.phase = "complete";

    var best = saveBestScore(state.score);

    var mostMissed = computeMostMissedCategory();



    elEndTotalScore.textContent = String(state.score);

    elEndBestScore.textContent = String(best);

    elEndMissedCategory.textContent = mostMissed;

    // Analyst rank calculation based on run accuracy
    var runAnswers = [];
    var dKeys = Object.keys(state.committedRunAnswers);
    for (var dk = 0; dk < dKeys.length; dk += 1) {
      runAnswers = runAnswers.concat(state.committedRunAnswers[dKeys[dk]]);
    }
    var totalQuestions = runAnswers.length;
    var correctCount = 0;
    for (var rc = 0; rc < runAnswers.length; rc += 1) {
      if (runAnswers[rc].isCorrect) correctCount += 1;
    }
    var accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;

    var elRank = byId("end-analyst-rank");
    if (elRank) {
      if (accuracy >= 95) {
        elRank.textContent = "THREAT HUNTER (LEVEL 4)";
      } else if (accuracy >= 80) {
        elRank.textContent = "SENIOR SOC ANALYST (LEVEL 3)";
      } else if (accuracy >= 65) {
        elRank.textContent = "CYBER DEFENSE ANALYST (LEVEL 2)";
      } else {
        elRank.textContent = "SOC TRIAGE OPERATOR (LEVEL 1)";
      }
    }

    var elRibbon = byId("end-new-best-ribbon");
    if (elRibbon) {
      elRibbon.classList.toggle("hidden", state.score < best);
    }



    renderRunReview();



    setScreen("end");

    scrollToTop();

    focusElement(elBtnRestart);

    announce(

      "Escape successful! Total score: " +

        state.score +

        ". Best score: " +

        best +

        ". Most missed red flag category: " +

        mostMissed

    );

  }



  function openWrongAnswerDetail(item) {

    var msg = item.message;

    elEndDetailView.classList.remove("hidden");



    elReviewDetailTitle.textContent =

      "INSPECTION: DOOR " + item.level + " · " + msg.channel.toUpperCase();



    clearChildren(elReviewDetailMeta);

    var senderLine = document.createElement("div");

    senderLine.className = "detail-meta-line";

    var senderPrefix = document.createElement("span");

    senderPrefix.className = "meta-prefix";

    senderPrefix.textContent =

      msg.channel === "email" ? "From: " : msg.channel === "sms" ? "SMS: " : "Sender: ";

    senderLine.appendChild(senderPrefix);

    var senderText = document.createElement("span");

    senderLine.appendChild(senderText);

    elReviewDetailMeta.appendChild(senderLine);



    var allQuotes = msg.red_flags

      ? msg.red_flags.map(function (f) {

          return f.quote;

        })

      : [];

    renderTextWithHighlights(senderText, msg.sender, allQuotes);



    if (msg.channel === "email" && msg.subject) {

      var subjectLine = document.createElement("div");

      subjectLine.className = "detail-meta-line";

      var subjPrefix = document.createElement("span");

      subjPrefix.className = "meta-prefix";

      subjPrefix.textContent = "Subject: ";

      subjectLine.appendChild(subjPrefix);

      var subjText = document.createElement("span");

      subjectLine.appendChild(subjText);

      elReviewDetailMeta.appendChild(subjectLine);

      renderTextWithHighlights(subjText, msg.subject, allQuotes);

    }



    renderTextWithHighlights(elReviewDetailBody, msg.body, allQuotes);



    clearChildren(elReviewDetailSignalsList);

    if (msg.is_phishing) {

      elReviewDetailSignalsTitle.textContent = "// red flags present in this message";

      for (var f = 0; f < msg.red_flags.length; f += 1) {

        var flag = msg.red_flags[f];

        var li = document.createElement("li");



        var catTag = document.createElement("span");

        catTag.className = "flag-category-tag";

        catTag.textContent = formatCategory(flag.category);

        li.appendChild(catTag);



        var qSpan = document.createElement("span");

        qSpan.className = "flag-quote-ref";

        qSpan.textContent = '"' + flag.quote + '"';

        li.appendChild(qSpan);



        li.appendChild(document.createTextNode(" — " + flag.explanation));

        elReviewDetailSignalsList.appendChild(li);

      }

    } else {

      elReviewDetailSignalsTitle.textContent = "// safe signals present in this message";

      for (var s = 0; s < msg.safe_signals.length; s += 1) {

        var safeLi = document.createElement("li");

        safeLi.textContent = msg.safe_signals[s];

        elReviewDetailSignalsList.appendChild(safeLi);

      }

    }



    elReviewDetailTip.textContent = msg.tip;



    elEndDetailView.scrollIntoView({ behavior: "smooth" });

    focusElement(elReviewDetailClose);

  }



  function renderRunReview() {

    var allAnswers = [];

    var doorKeys = Object.keys(state.committedRunAnswers);

    doorKeys.sort(function (a, b) {

      return Number(a) - Number(b);

    });

    for (var d = 0; d < doorKeys.length; d += 1) {

      allAnswers = allAnswers.concat(state.committedRunAnswers[doorKeys[d]]);

    }



    var falseAlarmsCount = 0;

    var wrongAnswers = [];

    for (var a = 0; a < allAnswers.length; a += 1) {

      var item = allAnswers[a];

      if (!item.isCorrect) {

        wrongAnswers.push(item);

        if (!item.message.is_phishing && item.userDecision === true) {

          falseAlarmsCount += 1;

        }

      }

    }

    elEndFalseAlarms.textContent = String(falseAlarmsCount);



    var catStats = {};

    var catKeys = Object.keys(CATEGORY_LABELS);

    for (var c = 0; c < catKeys.length; c += 1) {

      catStats[catKeys[c]] = { caught: 0, missed: 0, total: 0 };

    }



    for (var i = 0; i < allAnswers.length; i += 1) {

      var ans = allAnswers[i];

      if (ans.message.is_phishing && Array.isArray(ans.message.red_flags)) {

        var seenInMsg = {};

        for (var r = 0; r < ans.message.red_flags.length; r += 1) {

          var flagCategory = ans.message.red_flags[r].category;

          if (catStats[flagCategory] && !seenInMsg[flagCategory]) {

            seenInMsg[flagCategory] = true;

            catStats[flagCategory].total += 1;

            if (ans.isCorrect) {

              catStats[flagCategory].caught += 1;

            } else {

              catStats[flagCategory].missed += 1;

            }

          }

        }

      }

    }



    clearChildren(elEndCategoryAccuracy);

    // Sort weakest performance first (lowest percentage)
    catKeys.sort(function (a, b) {
      var pctA = catStats[a].total === 0 ? 101 : (catStats[a].caught / catStats[a].total);
      var pctB = catStats[b].total === 0 ? 101 : (catStats[b].caught / catStats[b].total);
      return pctA - pctB;
    });

    for (var k = 0; k < catKeys.length; k += 1) {

      var catKey = catKeys[k];

      var stats = catStats[catKey];

      var card = document.createElement("div");

      card.className = "category-accuracy-card";



      var titleDiv = document.createElement("div");

      titleDiv.className = "cat-card-header";

      var nameSpan = document.createElement("span");

      nameSpan.className = "cat-card-name";

      nameSpan.textContent = CATEGORY_LABELS[catKey];

      titleDiv.appendChild(nameSpan);



      var badgeSpan = document.createElement("span");

      badgeSpan.className = "cat-card-badge";



      var pct = stats.total === 0 ? 0 : Math.round((stats.caught / stats.total) * 100);

      if (stats.total === 0) {

        badgeSpan.textContent = "0 TESTED";

        badgeSpan.classList.add("badge-neutral");

      } else {

        badgeSpan.textContent = pct + "% (" + stats.caught + "/" + stats.total + ")";

        if (pct === 100) {

          badgeSpan.classList.add("badge-safe");

        } else if (pct >= 50) {

          badgeSpan.classList.add("badge-warn");

        } else {

          badgeSpan.classList.add("badge-danger");

        }

      }

      titleDiv.appendChild(badgeSpan);

      card.appendChild(titleDiv);

      // Horizontal Bar Track & Fill with --pct custom property
      var barTrack = document.createElement("div");
      barTrack.className = "cat-bar-track";
      var barFill = document.createElement("div");
      barFill.className = "cat-bar-fill";
      barFill.style.setProperty("--pct", pct + "%");
      if (stats.total > 0) {
        barFill.classList.add(pct === 100 ? "bar-safe" : pct >= 50 ? "bar-warn" : "bar-danger");
      }
      barTrack.appendChild(barFill);
      card.appendChild(barTrack);



      var detailP = document.createElement("p");

      detailP.className = "cat-card-detail";

      if (stats.total === 0) {

        detailP.textContent = "No messages with this pattern appeared in this run.";

      } else {

        detailP.textContent =

          stats.caught + " caught · " + stats.missed + " missed";

      }

      card.appendChild(detailP);



      elEndCategoryAccuracy.appendChild(card);

    }



    clearChildren(elEndWrongList);

    if (wrongAnswers.length === 0) {

      var perfectDiv = document.createElement("div");

      perfectDiv.className = "callout-safe";

      var strongP = document.createElement("strong");

      strongP.textContent = "// flawless triage:";

      perfectDiv.appendChild(strongP);

      perfectDiv.appendChild(

        document.createTextNode(" You correctly classified all 18 messages with zero errors.")

      );

      elEndWrongList.appendChild(perfectDiv);

    } else {

      for (var w = 0; w < wrongAnswers.length; w += 1) {

        (function (errItem) {

          var btn = document.createElement("button");

          btn.type = "button";

          btn.className = "wrong-card-btn";



          var headerDiv = document.createElement("div");

          headerDiv.className = "wrong-card-header";



          var tagSpan = document.createElement("span");

          tagSpan.className = "wrong-card-tag";

          tagSpan.textContent =

            "// door " + errItem.level + " · " + errItem.message.channel.toUpperCase();

          headerDiv.appendChild(tagSpan);



          var errSpan = document.createElement("span");

          errSpan.className = "wrong-card-err";

          var userText = errItem.userDecision ? "Marked PHISHING" : "Marked SAFE";

          var actualText = errItem.message.is_phishing ? "Actual: PHISHING" : "Actual: SAFE";

          errSpan.textContent = userText + " · " + actualText;

          headerDiv.appendChild(errSpan);



          btn.appendChild(headerDiv);



          var snippetP = document.createElement("p");

          snippetP.className = "wrong-card-snippet";

          var preview =

            errItem.message.channel === "email" && errItem.message.subject

              ? "Subject: " + errItem.message.subject

              : errItem.message.body.slice(0, 90) + "...";

          snippetP.textContent = preview;

          btn.appendChild(snippetP);



          var ctaSpan = document.createElement("span");

          ctaSpan.className = "wrong-card-cta";

          ctaSpan.textContent = "-> Click to inspect message breakdown";

          btn.appendChild(ctaSpan);



          btn.addEventListener("click", function () {

            openWrongAnswerDetail(errItem);

          });



          elEndWrongList.appendChild(btn);

        })(wrongAnswers[w]);

      }

    }



    elEndDetailView.classList.add("hidden");

  }



  /* ---------- Keyboard ---------- */



  function getPrimaryAction() {

    switch (state.screen) {

      case "menu":

        return function () {

          var activeButtons = getActiveTitleMenuButtons();

          var selectedBtn = activeButtons[state.selectedMenuIndex] || activeButtons[0];

          if (selectedBtn) {

            selectedBtn.click();

          }

        };

      case "howto":

        return showMenu;

      case "select":

        return function () {

          startNewRun(highestAvailableDoor());

        };

      case "game":

        return state.phase === "feedback" ? continueAfterFeedback : null;

      case "pause":

        return resumeGame;

      case "unlocked":

        return goNextDoor;

      case "failed":

        return retryDoor;

      case "end":

        return function () {

          startNewRun(1);

        };

      default:

        return null;

    }

  }



  function pulseButton(btn) {
    if (!btn) return;
    btn.classList.add("btn-pressed");
    setTimeout(function () {
      btn.classList.remove("btn-pressed");
    }, 120);
  }

  function handleKeyDown(event) {

    if (event.ctrlKey || event.altKey || event.metaKey) {

      return;

    }



    var key = event.key;

    // While the Zero-G Arena is open, keep every shortcut inside the sandbox.
    if (isArenaOpen()) {
      if (key === "Escape" || key === "Esc") {
        event.preventDefault();
        closeArenaModal();
      } else if (key === "Tab") {
        trapArenaFocus(event);
      }
      return;
    }



    if (state.screen === "menu") {

      if (key === "ArrowDown") {

        event.preventDefault();

        moveMenuSelection(1);

        return;

      }

      if (key === "ArrowUp") {

        event.preventDefault();

        moveMenuSelection(-1);

        return;

      }

    }



    if (key === "Escape" || key === "Esc") {

      var encModal = byId("encyclopedia-modal");

      if (encModal && !encModal.classList.contains("hidden")) {

        event.preventDefault();

        var encDropdown = byId("enc-cat-dropdown-menu");
        if (encDropdown && !encDropdown.classList.contains("hidden")) {
          encDropdown.classList.add("hidden");
          var encBtn = byId("enc-cat-dropdown-btn");
          if (encBtn) {
            encBtn.setAttribute("aria-expanded", "false");
            encBtn.classList.remove("is-open");
          }
          return;
        }

        closeEncyclopediaModal();

        return;

      }

      var badgesModal = byId("badges-modal");

      if (badgesModal && !badgesModal.classList.contains("hidden")) {

        event.preventDefault();

        closeBadgesModal();

        return;

      }

      if (state.screen === "game") {

        event.preventDefault();

        pauseGame();

      } else if (state.screen === "pause") {

        event.preventDefault();

        resumeGame();

      } else if (state.screen === "howto" || state.screen === "select") {

        event.preventDefault();

        showMenu();

      }

      return;

    }



    if (event.repeat) {

      if (key === "Enter") {

        event.preventDefault();

      }

      return;

    }



    if (key === "Enter") {

      var active = document.activeElement;

      if (active && active.tagName === "BUTTON" && !active.disabled) {

        return;

      }

      var primary = getPrimaryAction();

      if (primary) {

        event.preventDefault();

        primary();

      }

      return;

    }



    if (state.screen === "game" && state.phase === "question") {

      if (key === "p" || key === "P") {

        event.preventDefault();

        pulseButton(elBtnPhishing);

        submitDecision(true);

      } else if (key === "s" || key === "S") {

        event.preventDefault();

        pulseButton(elBtnSafe);

        submitDecision(false);

      } else if (key === "h" || key === "H") {

        event.preventDefault();

        pulseButton(elBtnHint);

        useHint();

      }

    }

  }



  /* ---------- Interactive Robot Companion (Beloved Cyber Droid) ---------- */

  function initRobotCompanion() {
    var elHead = document.getElementById("robot-head");
    var elEyesGroup = document.getElementById("robot-eyes-group");
    var elSpeech = document.getElementById("robot-speech-text");
    var elSpeechTag = document.getElementById("speech-mode-tag");
    var elSpeechBubble = document.getElementById("robot-speech-bubble");
    var elRobot = document.getElementById("soc-robot");
    var elBodyLayer = elRobot ? elRobot.querySelector(".robot-body-layer") : null;
    var elStage = elRobot ? elRobot.closest(".robot-stage") : null;
    var elShadow = elStage ? elStage.querySelector(".robot-shadow") : null;

    if (!elHead || !elRobot) {
      return;
    }

    var STANDBY_TEXT = "// SENTINEL BOT ONLINE \u00B7 READY FOR TRIAGE";
    var STANDBY_TAG = "STANDBY";

    var isInteractive = false;
    var isBotClosed = false;
    var idleTipIndex = 0;
    var speechFadeTimer = null;
    var blinkTimeoutId = null;
    var currentSpeechText = STANDBY_TEXT;
    var currentSpeechTag = STANDBY_TAG;

    var idleTips = [
      "// TIP: Legitimate security teams will never ask for your SMS OTP code.",
      "// TIP: Check sender domains carefully (.example vs lookalike typos).",
      "// TIP: Scammers create fake urgency to make you click without thinking.",
      "// TIP: In Door 01-03, press [H] to get an analyst hint (1 per door).",
      "// TIP: Never run unexpected attachments (.apk, .exe, .scr).",
      "// TIP: Use keyboard shortcuts: [P] Phishing \u00B7 [S] Safe \u00B7 [Enter] Next."
    ];

    var clickGreetings = [
      "// HELLO OPERATOR! Sentinel Bot is calibrated and ready to assist.",
      "// ALL SYSTEMS NOMINAL: Threat intelligence heuristics operational!",
      "// READY WHEN YOU ARE! Let's breach these blast doors together.",
      "// TIP: Stay alert! Attackers disguise links and impersonate staff on Door 02 & 03."
    ];
    var clickGreetingIndex = 0;

    function setSpeech(text, modeTag) {
      var nextTag = modeTag || STANDBY_TAG;
      if (text === currentSpeechText && nextTag === currentSpeechTag) {
        return;
      }
      currentSpeechText = text;
      currentSpeechTag = nextTag;

      if (speechFadeTimer) {
        clearTimeout(speechFadeTimer);
        speechFadeTimer = null;
      }

      if (elSpeechTag) {
        elSpeechTag.textContent = nextTag;
      }

      if (elSpeech) {
        elSpeech.style.opacity = "0.35";
        speechFadeTimer = setTimeout(function () {
          elSpeech.textContent = text;
          elSpeech.style.opacity = "1";
          speechFadeTimer = null;
        }, 95);
      }
    }

    function setEyeExpression(className) {
      if (!elEyesGroup) return;
      if (blinkTimeoutId) {
        clearTimeout(blinkTimeoutId);
        blinkTimeoutId = null;
      }
      elEyesGroup.classList.remove("is-closed", "is-happy", "is-alert", "is-wink", "is-blinking");
      if (className) {
        elEyesGroup.classList.add(className);
      }
    }

    var prefersReducedMotion = false;
    try {
      prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    // Cursor tracking state in 3D + springy click impulse + harmonic zero-G suspension
    var targetRotX = 0;
    var targetRotY = 0;
    var targetRotZ = 0;
    var targetHeadX = 0;
    var targetHeadY = 0;
    var targetEyeX = 0;
    var targetEyeY = 0;

    var curRotX = 0;
    var curRotY = 0;
    var curRotZ = 0;
    var curHeadX = 0;
    var curHeadY = 0;
    var curEyeX = 0;
    var curEyeY = 0;

    // Tactile spring impulse when clicking or waking the bot
    var impulseY = 0;
    var impulseVelY = 0;
    var impulsePitch = 0;
    var impulseRoll = 0;

    function triggerBotImpulse(velY, pitchDeg, rollDeg) {
      if (prefersReducedMotion) return;
      impulseVelY = velY;
      impulsePitch = pitchDeg;
      impulseRoll = rollDeg;
    }

    var rafId = null;

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function onPointerMove(e) {
      if (prefersReducedMotion || !elHead) return;

      // Measure relative to stable stage rect so floating bob never causes tracking feedback
      var refEl = elStage || elRobot;
      var rect = refEl.getBoundingClientRect();
      var centerX = rect.left + rect.width * 0.5;
      var centerY = rect.top + rect.height * 0.44;

      var dx = e.clientX - centerX;
      var dy = e.clientY - centerY;

      var maxDistX = Math.max(window.innerWidth * 0.45, 360);
      var maxDistY = Math.max(window.innerHeight * 0.45, 300);

      var normX = clamp(dx / maxDistX, -1, 1);
      var normY = clamp(dy / maxDistY, -1, 1);

      targetRotY = normX * 15;
      targetRotX = normY > 0 ? -normY * 12 : -normY * 9.5;
      targetRotZ = normX * 3.2;

      targetHeadX = normX * 5.5;
      targetHeadY = normY > 0 ? normY * 5.5 : normY * 4.5;

      targetEyeX = normX * 12;
      targetEyeY = normY > 0 ? normY * 9 : normY * 6.5;
    }

    function onPointerLeave() {
      targetRotX = 0;
      targetRotY = 0;
      targetRotZ = 0;
      targetHeadX = 0;
      targetHeadY = 0;
      targetEyeX = 0;
      targetEyeY = 0;
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    function updateTracking(now) {
      if (!prefersReducedMotion) {
        var t = (typeof now === "number" ? now : performance.now()) * 0.001;

        // Smooth harmonic zero-G levitation (true sine/cosine waves with phase lag)
        var primaryWave = Math.sin(t * 1.55);
        var headWave = Math.sin(t * 1.55 - 0.48);
        var secondarySway = Math.cos(t * 0.775);

        // Spring damping for click/wake impulse
        impulseVelY += (-impulseY * 0.18);
        impulseVelY *= 0.82;
        impulseY += impulseVelY;
        impulsePitch *= 0.86;
        impulseRoll *= 0.86;

        var lerpFactor = 0.085;
        curRotX += (targetRotX - curRotX) * lerpFactor;
        curRotY += (targetRotY - curRotY) * lerpFactor;
        curRotZ += (targetRotZ - curRotZ) * lerpFactor;
        curHeadX += (targetHeadX - curHeadX) * lerpFactor;
        curHeadY += (targetHeadY - curHeadY) * lerpFactor;

        curEyeX += (targetEyeX - curEyeX) * 0.12;
        curEyeY += (targetEyeY - curEyeY) * 0.12;

        // 1. Body levitation + subtle follow-through
        var bodyX = secondarySway * 1.4 + curHeadX * 0.26;
        var bodyY = primaryWave * 6.2 + curHeadY * 0.22 + impulseY * 0.65;
        var bodyRoll = Math.sin(t * 0.775) * 1.1 + curRotZ * 0.22 + impulseRoll * 0.35;

        if (elBodyLayer) {
          elBodyLayer.style.transform =
            "translate3d(" + bodyX.toFixed(2) + "px, " + bodyY.toFixed(2) + "px, 0px) " +
            "rotateZ(" + bodyRoll.toFixed(2) + "deg)";
        }

        // 2. Head magnetic suspension (floats with phase lag behind body for organic overlap)
        var headX = curHeadX + secondarySway * 1.8;
        var headY = curHeadY + headWave * 7.6 + impulseY;
        var headPitch = curRotX + Math.cos(t * 1.55 - 0.3) * 1.6 + impulsePitch;
        var headYaw = curRotY + Math.sin(t * 0.775) * 1.2;
        var headRoll = curRotZ + Math.cos(t * 0.775) * 0.9 + impulseRoll;

        if (elHead) {
          elHead.style.transform =
            "translate3d(" + headX.toFixed(2) + "px, " + headY.toFixed(2) + "px, 0px) " +
            "rotateX(" + headPitch.toFixed(2) + "deg) " +
            "rotateY(" + headYaw.toFixed(2) + "deg) " +
            "rotateZ(" + headRoll.toFixed(2) + "deg)";
        }

        // 3. Visor gaze tracking
        if (elEyesGroup) {
          elEyesGroup.style.transform =
            "translate3d(" + curEyeX.toFixed(2) + "px, " + curEyeY.toFixed(2) + "px, 0px)";
        }

        // 4. Synchronized floor shadow breathing
        if (elShadow) {
          var shadowScale = 0.92 + primaryWave * 0.09;
          var shadowOpacity = 0.35 + primaryWave * 0.11;
          elShadow.style.transform = "scale(" + shadowScale.toFixed(3) + ")";
          elShadow.style.opacity = shadowOpacity.toFixed(3);
        }

        // 5. Subtle counter-float on speech bubble
        if (elSpeechBubble) {
          var bubbleY = Math.sin(t * 1.55 - 0.95) * 2.2;
          elSpeechBubble.style.transform = "translate3d(0px, " + bubbleY.toFixed(2) + "px, 0px)";
        }
      }
      rafId = requestAnimationFrame(updateTracking);
    }

    rafId = requestAnimationFrame(updateTracking);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else if (!rafId) {
        rafId = requestAnimationFrame(updateTracking);
      }
    });

    // Natural blinking timer (guarded against overriding active expressions)
    var blinkCounter = 0;
    setInterval(function () {
      if (isInteractive || isBotClosed) return;
      blinkCounter += 1;
      var blinkClass = blinkCounter % 6 === 0 ? "is-wink" : "is-blinking";
      setEyeExpression(blinkClass);
      blinkTimeoutId = setTimeout(function () {
        blinkTimeoutId = null;
        if (isInteractive || isBotClosed) return;
        setEyeExpression(null);
      }, 160);
    }, 3800);

    // Rotating Idle Intel Tips (every 9s)
    setInterval(function () {
      if (isInteractive || isBotClosed) return;
      var pool = idleTips.slice();
      if (state.bestScore > 0) {
        pool.push("// RECORD: Current best triage score on record: " + state.bestScore + " PTS.");
      }
      if (state.unlockedDoors && state.unlockedDoors.length > 0) {
        pool.push("// CLEARANCE: Door 0" + state.unlockedDoors.length + " unlocked. Continue anytime!");
      }
      idleTipIndex = (idleTipIndex + 1) % pool.length;
      setSpeech(pool[idleTipIndex], "INTEL");
    }, 9000);

    function resetBotToNormal(withImpulse) {
      if (!isBotClosed && !isInteractive) return;
      isBotClosed = false;
      isInteractive = false;
      setEyeExpression(null);
      if (elSpeechBubble) {
        elSpeechBubble.classList.remove("is-active-comms");
      }
      if (withImpulse) {
        triggerBotImpulse(-2.6, 4.5, 0);
      }
      setSpeech(STANDBY_TEXT, STANDBY_TAG);
    }

    function handleBotActivate(e) {
      e.stopPropagation();
      isBotClosed = true;
      isInteractive = true;
      setEyeExpression("is-closed");
      if (elSpeechBubble) {
        elSpeechBubble.classList.add("is-active-comms");
      }
      var rollDir = clickGreetingIndex % 2 === 0 ? 4.2 : -4.2;
      triggerBotImpulse(3.8, -6.5, rollDir);

      var greeting = clickGreetings[clickGreetingIndex % clickGreetings.length];
      clickGreetingIndex += 1;
      setSpeech(greeting, "COMMS");
    }

    elRobot.addEventListener("click", handleBotActivate);
    if (elSpeechBubble) {
      elSpeechBubble.addEventListener("click", handleBotActivate);
    }

    window.addEventListener("click", function (e) {
      if (!isBotClosed) return;
      var target = e.target;
      if (elRobot && elRobot.contains(target)) return;
      if (elSpeechBubble && elSpeechBubble.contains(target)) return;
      if (target && target.closest && target.closest("[data-bot-reaction]")) return;
      resetBotToNormal(true);
    });

    // Menu reaction buttons
    var startBtn = document.getElementById("menu-start-btn");
    var continueBtn = document.getElementById("menu-continue-btn");
    var selectBtn = document.getElementById("menu-select-btn");
    var howtoBtn = document.getElementById("menu-howto-btn");
    var aboutBtn = document.getElementById("menu-about-btn");

    function attachMenuReaction(btn, text, modeTag, eyeClass) {
      if (!btn) return;
      btn.setAttribute("data-bot-reaction", "true");
      btn.addEventListener("mouseenter", function () {
        isBotClosed = false;
        isInteractive = true;
        if (elSpeechBubble) {
          elSpeechBubble.classList.remove("is-active-comms");
        }
        setEyeExpression(eyeClass || "is-alert");
        setSpeech(text, modeTag || "TACTICAL");
      });
      btn.addEventListener("mouseleave", function () {
        isBotClosed = false;
        isInteractive = false;
        setEyeExpression(null);
        setSpeech(STANDBY_TEXT, STANDBY_TAG);
      });
    }

    attachMenuReaction(startBtn, "// BREACH PROTOCOL: Commencing Door 01 containment triage!", "DEPLOY", "is-alert");
    attachMenuReaction(continueBtn, "// PROTOCOL: Resuming run from your latest cleared blast door.", "RESUME", "is-happy");
    attachMenuReaction(selectBtn, "// ACCESS OVERRIDE: Select clearance door (01 to 03).", "OVERRIDE", null);
    attachMenuReaction(howtoBtn, "// BRIEFING: [P] Phish \u00B7 [S] Safe \u00B7 [H] Hint \u00B7 [Esc] Pause.", "BRIEF", null);
    attachMenuReaction(aboutBtn, "// DIRECTIVE: Reviewing server room lockdown containment notes.", "INTEL", null);

    var encBtn = document.getElementById("menu-encyclopedia-btn");
    var badgesBtn = document.getElementById("menu-badges-btn");
    attachMenuReaction(encBtn, "// DATABASE: Threat Encyclopedia across 12 cyberattack vectors.", "INTEL", "is-alert");
    attachMenuReaction(badgesBtn, "// CLEARANCE: Review unlocked SOC badges and export credentials.", "HONORS", "is-happy");
    var arenaMenuBtn = document.getElementById("menu-arena-btn");
    attachMenuReaction(arenaMenuBtn, "// ZERO-G LAB: Fling message capsules in the Antigravity Arena!", "ZERO-G", "is-happy");
  }

  /* ---------- Init ---------- */



  function init() {

    initRobotCompanion();

    elMenuStart.addEventListener("click", function () {

      startNewRun(1);

    });

    elMenuContinue.addEventListener("click", continueRun);

    elMenuSelect.addEventListener("click", showSelect);

    elMenuHowto.addEventListener("click", showHowTo);

    elMenuAbout.addEventListener("click", function () {

      scrollToSiteSection("about", "About the mission.");

    });



    if (elNavPlayBtn) {

      elNavPlayBtn.addEventListener("click", launchQuickPlay);

    }

    if (elBottomPlayBtn) {

      elBottomPlayBtn.addEventListener("click", launchQuickPlay);

    }

    var elFooterCtaEncBtn = byId("footer-cta-enc-btn");
    if (elFooterCtaEncBtn) {
      elFooterCtaEncBtn.addEventListener("click", function () {
        openEncyclopediaModal(null);
      });
    }
    var elFooterCtaPlayBtn = byId("footer-cta-play-btn");
    if (elFooterCtaPlayBtn) elFooterCtaPlayBtn.addEventListener("click", launchQuickPlay);

    var elFooterLaunchTerminalBtn = byId("footer-launch-terminal-btn");
    if (elFooterLaunchTerminalBtn) elFooterLaunchTerminalBtn.addEventListener("click", launchQuickPlay);

    var elFooterOpenEncBtn = byId("footer-open-encyclopedia-btn");
    if (elFooterOpenEncBtn) {
      elFooterOpenEncBtn.addEventListener("click", function () {
        openEncyclopediaModal(null);
      });
    }

    var elFooterEncIconBtn = byId("footer-enc-icon-btn");
    if (elFooterEncIconBtn) {
      elFooterEncIconBtn.addEventListener("click", function () {
        openEncyclopediaModal(null);
      });
    }

    var elFooterBadgesIconBtn = byId("footer-badges-icon-btn");
    if (elFooterBadgesIconBtn) elFooterBadgesIconBtn.addEventListener("click", openBadgesModal);

    var footerActionBtns = document.querySelectorAll("[data-footer-action]");
    for (var fa = 0; fa < footerActionBtns.length; fa += 1) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var action = btn.getAttribute("data-footer-action");
          if (action === "encyclopedia") {
            openEncyclopediaModal(null);
          } else if (action === "badges") {
            openBadgesModal();
          } else if (action === "arena") {
            openArenaModal();
          }
        });
      })(footerActionBtns[fa]);
    }



    if (elSiteSoundToggle) elSiteSoundToggle.addEventListener("click", toggleSound);

    if (elTermSoundToggle) elTermSoundToggle.addEventListener("click", toggleSound);



    if (elSiteEncyclopediaBtn) {

      elSiteEncyclopediaBtn.addEventListener("click", function () {

        openEncyclopediaModal("typosquatting");

      });

    }

    if (elTermEncyclopediaBtn) {

      elTermEncyclopediaBtn.addEventListener("click", function () {

        openEncyclopediaModal("typosquatting");

      });

    }

    if (elMenuEncyclopedia) {

      elMenuEncyclopedia.addEventListener("click", function () {

        openEncyclopediaModal("typosquatting");

      });

    }



    var elEncClose = byId("encyclopedia-close-btn");

    var elEncFooterClose = byId("encyclopedia-footer-close");
    if (elEncFooterClose) elEncFooterClose.addEventListener("click", closeEncyclopediaModal);
    if (elEncClose) elEncClose.addEventListener("click", closeEncyclopediaModal);

    var elEncModal = byId("encyclopedia-modal");

    if (elEncModal) {

      elEncModal.addEventListener("click", function (e) {

        if (e.target === elEncModal) closeEncyclopediaModal();

      });

    }

    var elEncSearch = byId("encyclopedia-search") || byId("encyclopedia-search-input");

    if (elEncSearch) {

      elEncSearch.addEventListener("input", function (e) {

        activeEncyclopediaSearch = e.target.value;

        renderEncyclopediaModal();

      });

    }

    var elEncDropdownBtn = byId("enc-cat-dropdown-btn");
    var elEncDropdownMenu = byId("enc-cat-dropdown-menu");
    if (elEncDropdownBtn && elEncDropdownMenu) {
      elEncDropdownBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isHidden = elEncDropdownMenu.classList.contains("hidden");
        if (isHidden) {
          elEncDropdownMenu.classList.remove("hidden");
          elEncDropdownBtn.setAttribute("aria-expanded", "true");
          elEncDropdownBtn.classList.add("is-open");
        } else {
          elEncDropdownMenu.classList.add("hidden");
          elEncDropdownBtn.setAttribute("aria-expanded", "false");
          elEncDropdownBtn.classList.remove("is-open");
        }
      });
    }

    window.addEventListener("click", function (e) {
      var elMenu = byId("enc-cat-dropdown-menu");
      var elBtn = byId("enc-cat-dropdown-btn");
      if (elMenu && !elMenu.classList.contains("hidden")) {
        if (!elMenu.contains(e.target) && (!elBtn || !elBtn.contains(e.target))) {
          elMenu.classList.add("hidden");
          if (elBtn) {
            elBtn.setAttribute("aria-expanded", "false");
            elBtn.classList.remove("is-open");
          }
        }
      }
    });



    var elSiteArenaBtn = byId("site-arena-btn");
    if (elSiteArenaBtn) elSiteArenaBtn.addEventListener("click", openArenaModal);
    var elTermArenaBtn = byId("term-arena-btn");
    if (elTermArenaBtn) elTermArenaBtn.addEventListener("click", openArenaModal);
    var elMenuArenaBtn = byId("menu-arena-btn");
    if (elMenuArenaBtn) elMenuArenaBtn.addEventListener("click", openArenaModal);
    bindArenaControls();

    if (elSiteBadgesBtn) elSiteBadgesBtn.addEventListener("click", openBadgesModal);

    if (elTermBadgesBtn) elTermBadgesBtn.addEventListener("click", openBadgesModal);

    if (elMenuBadges) elMenuBadges.addEventListener("click", openBadgesModal);

    if (elEndBadgesBtn) elEndBadgesBtn.addEventListener("click", openBadgesModal);



    var elBadgesClose = byId("badges-close-btn");

    var elBadgesFooterClose = byId("badges-footer-close");
    if (elBadgesFooterClose) elBadgesFooterClose.addEventListener("click", closeBadgesModal);
    var elBadgePreviewClose = byId("badge-preview-close");
    if (elBadgePreviewClose) {
      elBadgePreviewClose.addEventListener("click", function () {
        var elSection = byId("badge-preview-section");
        if (elSection) elSection.classList.add("hidden");
      });
    }
    if (elBadgesClose) elBadgesClose.addEventListener("click", closeBadgesModal);

    var elBadgesModal = byId("badges-modal");

    if (elBadgesModal) {

      elBadgesModal.addEventListener("click", function (e) {

        if (e.target === elBadgesModal) closeBadgesModal();

      });

    }

    var elToastView = byId("achievement-toast-view-btn");

    if (elToastView) {

      elToastView.addEventListener("click", function () {

        var elToast = byId("achievement-toast");

        if (elToast) elToast.classList.add("hidden");

        openBadgesModal();

      });

    }

    var elBadgeDownloadBtn = byId("badge-download-btn");

    if (elBadgeDownloadBtn) elBadgeDownloadBtn.addEventListener("click", downloadActiveBadgeCard);

    var elCallsignInput = byId("agent-callsign-input");

    if (elCallsignInput) {

      elCallsignInput.addEventListener("input", function () {

        if (activePreviewBadge) renderCredentialCardCanvas(activePreviewBadge);

      });

    }



    allTitleMenuButtons.forEach(function (btn) {

      if (!btn) {

        return;

      }

      btn.addEventListener("mouseenter", function () {

        if (!btn.disabled) {

          setSelectedMenuButton(btn, false);

        }

      });

      btn.addEventListener("focus", function () {

        if (!btn.disabled) {

          setSelectedMenuButton(btn, false);

        }

      });

    });



    elHowtoBack.addEventListener("click", showMenu);

    elSelectBack.addEventListener("click", showMenu);



    elDoorCards.forEach(function (card) {

      card.addEventListener("click", function () {

        var door = parseInt(card.getAttribute("data-door"), 10);

        if (!card.disabled && door >= 1 && door <= LEVEL_COUNT) {

          startNewRun(door);

        }

      });

    });



    var elHeroStartCta = byId("hero-start-cta");

    if (elHeroStartCta) {

      elHeroStartCta.addEventListener("click", function () {

        if (!state.loaded) {

          return;

        }

        var continueDoor = getContinueDoor();

        if (continueDoor) {

          startNewRun(continueDoor);

        } else {

          startNewRun(1);

        }

      });

    }



    // Door Dossier Briefing Data & Modal Handling

    var DOOR_DOSSIERS = {

      1: {

        doorNum: 1,

        title: "DOOR 01 // EMAIL GATEWAY",

        channel: "EMAIL GATEWAY",

        tier: "TIER 1 \u00B7 CRUDE SCAMS",

        desc: "Mass automated phishing campaigns, lottery giveaways, and crude payload drops targeting corporate inboxes on the night shift. Scrutinize sender domains, fake delivery APKs, and urgency traps.",

        flags: [

          { title: "Lookalike Domains", desc: "Check sender addresses for typosquatting, generic handles, and unverified domains." },

          { title: "Artificial Urgency", desc: "Threats of instant account suspension crafted to bypass careful verification." },

          { title: "Disguised APK / Installers", desc: "Unexpected mobile package names (.apk) or executable attachments pretending to be tracking tools." }

        ],

        playText: "LAUNCH DOOR 01"

      },

      2: {

        doorNum: 2,

        title: "DOOR 02 // SMS RELAY",

        channel: "SMS RELAY",

        tier: "TIER 2 \u00B7 SPEAR PHISHING",

        desc: "Targeted smishing attacks, disguised subdomain links, and executive impersonation sent directly to analyst mobile relays. Separate urgent authentic updates from crafted traps.",

        flags: [

          { title: "Executive Impersonation", desc: "Private numbers claiming to be company executives demanding immediate action." },

          { title: "Subdomain Traps", desc: "URLs containing legitimate company names inside a subdomain on an untrusted host." },

          { title: "Sensitive OTP Demands", desc: "Direct messages asking you to reply with one-time passcodes or account passwords." }

        ],

        playText: "LAUNCH DOOR 02"

      },

      3: {

        doorNum: 3,

        title: "DOOR 03 // CHAT TERMINAL",

        channel: "CHAT TERMINAL",

        tier: "TIER 3 \u00B7 MIXED SIGNALS",

        desc: "Sophisticated workplace chat lures where authentic infrastructure alerts and carefully disguised credential harvesters look nearly identical. Exercise maximum scrutiny.",

        flags: [

          { title: "High-Pressure Recruitment", desc: "Unsolicited job placements, instant interviews, and escrow incentives skipping normal verification." },

          { title: "Internal Channel Handoffs", desc: "Chat handles requesting private channel handoffs and external direct downloads." },

          { title: "Mixed Legitimate Alerts", desc: "Carefully distinguish authentic system security notices from crafted social engineering." }

        ],

        playText: "LAUNCH DOOR 03"

      }

    };



    var activeDossierDoor = 1;

    var elDossierModal = byId("door-dossier-modal");

    var elDossierTitle = byId("dossier-door-title");

    var elDossierChannel = byId("dossier-channel-tag");

    var elDossierTier = byId("dossier-tier-tag");

    var elDossierStatus = byId("dossier-status-badge");

    var elDossierDesc = byId("dossier-desc");

    var elDossierFlag1Title = byId("dossier-flag-1-title");

    var elDossierFlag1Desc = byId("dossier-flag-1-desc");

    var elDossierFlag2Title = byId("dossier-flag-2-title");

    var elDossierFlag2Desc = byId("dossier-flag-2-desc");

    var elDossierFlag3Title = byId("dossier-flag-3-title");

    var elDossierFlag3Desc = byId("dossier-flag-3-desc");

    var elDossierPlayBtn = byId("dossier-play-btn");

    var elDossierPlayText = byId("dossier-play-text");

    var elDossierCloseBtn = byId("dossier-close-btn");

    var elDossierCancelBtn = byId("dossier-cancel-btn");



    function openDoorDossier(doorNum) {

      var data = DOOR_DOSSIERS[doorNum];

      if (!data || !elDossierModal) return;



      activeDossierDoor = doorNum;

      var highest = highestAvailableDoor();

      var isAvail = doorNum <= highest;



      if (elDossierTitle) elDossierTitle.textContent = data.title;

      if (elDossierChannel) elDossierChannel.textContent = data.channel;

      if (elDossierTier) elDossierTier.textContent = data.tier;

      if (elDossierStatus) {

        elDossierStatus.textContent = isAvail ? "AVAILABLE" : "LOCKED";

        elDossierStatus.className = "dossier-pill pill-status " + (isAvail ? "status-avail" : "status-locked");

      }



      if (elDossierDesc) elDossierDesc.textContent = data.desc;

      if (elDossierFlag1Title) elDossierFlag1Title.textContent = data.flags[0].title;

      if (elDossierFlag1Desc) elDossierFlag1Desc.textContent = data.flags[0].desc;

      if (elDossierFlag2Title) elDossierFlag2Title.textContent = data.flags[1].title;

      if (elDossierFlag2Desc) elDossierFlag2Desc.textContent = data.flags[1].desc;

      if (elDossierFlag3Title) elDossierFlag3Title.textContent = data.flags[2].title;

      if (elDossierFlag3Desc) elDossierFlag3Desc.textContent = data.flags[2].desc;



      if (elDossierPlayBtn && elDossierPlayText) {

        elDossierPlayBtn.disabled = !isAvail;

        if (isAvail) {

          elDossierPlayText.textContent = data.playText;

        } else {

          elDossierPlayText.textContent = "LOCKED · CLEAR 0" + (doorNum - 1);

        }

      }



      elDossierModal.classList.remove("hidden");

      if (isAvail && elDossierPlayBtn) {

        focusElement(elDossierPlayBtn);

      } else if (elDossierCloseBtn) {

        focusElement(elDossierCloseBtn);

      }

      announce("Opened briefing for Door 0" + doorNum);

    }



    function closeDoorDossier() {

      if (elDossierModal) {

        elDossierModal.classList.add("hidden");

      }

    }



    if (elDossierCloseBtn) {

      elDossierCloseBtn.addEventListener("click", closeDoorDossier);

    }

    if (elDossierCancelBtn) {

      elDossierCancelBtn.addEventListener("click", closeDoorDossier);

    }

    if (elDossierModal) {

      elDossierModal.addEventListener("click", function (e) {

        if (e.target === elDossierModal) {

          closeDoorDossier();

        }

      });

    }



    if (elDossierPlayBtn) {

      elDossierPlayBtn.addEventListener("click", function () {

        var highest = highestAvailableDoor();

        if (activeDossierDoor <= highest) {

          closeDoorDossier();

          startNewRun(activeDossierDoor);

        }

      });

    }



    window.addEventListener("keydown", function (e) {

      if (e.key === "Escape" && elDossierModal && !elDossierModal.classList.contains("hidden")) {

        closeDoorDossier();

      }

    });



    [1, 2, 3].forEach(function (doorNum) {

      var card = byId("showcase-card-" + doorNum);

      if (card) {

        card.addEventListener("click", function () {

          if (!state.loaded) {

            return;

          }

          openDoorDossier(doorNum);

        });

        card.addEventListener("keydown", function (e) {

          if (e.key === "Enter" || e.key === " ") {

            e.preventDefault();

            card.click();

          }

        });

      }

    });

    var tierCards = document.querySelectorAll(".editorial-tier-card[data-showcase-door]");
    for (var tc = 0; tc < tierCards.length; tc += 1) {
      (function (elCard) {
        var dNum = parseInt(elCard.getAttribute("data-showcase-door"), 10);
        if (!dNum) return;
        elCard.addEventListener("click", function () {
          if (!state.loaded) return;
          openDoorDossier(dNum);
        });
        elCard.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            elCard.click();
          }
        });
      })(tierCards[tc]);
    }

    var learnVectorCards = document.querySelectorAll(".threat-vector-card[data-learn-category]");
    for (var vc = 0; vc < learnVectorCards.length; vc += 1) {
      (function (elVector) {
        var catKey = elVector.getAttribute("data-learn-category");
        if (!catKey) return;
        elVector.addEventListener("click", function () {
          var termId = getEncyclopediaTermByCategory(catKey);
          openEncyclopediaModal(termId);
        });
        elVector.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            elVector.click();
          }
        });
      })(learnVectorCards[vc]);
    }



    elBtnPhishing.addEventListener("click", function () {
      pulseButton(elBtnPhishing);
      submitDecision(true);
    });

    elBtnSafe.addEventListener("click", function () {
      pulseButton(elBtnSafe);
      submitDecision(false);
    });

    elBtnHint.addEventListener("click", function () {
      pulseButton(elBtnHint);
      useHint();
    });

    var elAuditToggle = byId("soc-audit-toggle-btn");
    var elAuditPanel = byId("soc-audit-panel");
    if (elAuditToggle && elAuditPanel) {
      function toggleAuditDrawer() {
        var isExpanded = elAuditPanel.classList.toggle("is-expanded");
        elAuditToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      }
      elAuditToggle.addEventListener("click", toggleAuditDrawer);
      elAuditToggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleAuditDrawer();
        }
      });
    }

    elBtnContinue.addEventListener("click", continueAfterFeedback);

    elBtnPause.addEventListener("click", pauseGame);



    elPauseResume.addEventListener("click", resumeGame);

    elPauseRestart.addEventListener("click", retryDoor);

    elPauseMenu.addEventListener("click", showMenu);



    elUnlockedNext.addEventListener("click", goNextDoor);

    elUnlockedMenu.addEventListener("click", showMenu);



    elFailedRetry.addEventListener("click", retryDoor);

    elFailedMenu.addEventListener("click", showMenu);



    elBtnRestart.addEventListener("click", function () {

      startNewRun(1);

    });

    elEndMenu.addEventListener("click", showMenu);



    if (elReviewDetailClose) {

      elReviewDetailClose.addEventListener("click", function () {

        elEndDetailView.classList.add("hidden");

      });

    }



    if (elEndViewFellBtn) {

      elEndViewFellBtn.addEventListener("click", function () {

        scrollToSiteSection("if-you-fell-for-it", "Post-compromise recovery guide.");

      });

    }



    if (elSiteNavLinks) {

      var elSiteNav = document.querySelector(".site-nav");
      var elSiteNavInner = document.querySelector(".site-nav-inner");
      var elSiteBrand = document.querySelector(".site-nav-left") || document.querySelector(".site-brand");
      var elSiteNavActions = document.querySelector(".site-nav-actions");
      var lastMeasuredLinksWidth = 610;

      function syncAdaptiveTopNav() {
        if (!elSiteNav || !elSiteNavInner) return;

        var isCurrentlyCompact = elSiteNav.classList.contains("is-compact-nav") || window.innerWidth <= 1180;
        if (!isCurrentlyCompact && elSiteNavLinks.offsetWidth > 0) {
          lastMeasuredLinksWidth = Math.max(500, elSiteNavLinks.scrollWidth);
        }

        var innerWidth = elSiteNavInner.clientWidth || window.innerWidth;
        var brandWidth = elSiteBrand ? elSiteBrand.offsetWidth : 280;
        var menuBtnWidth = (elMobileMenuToggle && elMobileMenuToggle.offsetWidth > 0) ? (elMobileMenuToggle.offsetWidth + 10) : 0;
        var actionsWidth = elSiteNavActions ? Math.max(0, elSiteNavActions.offsetWidth - menuBtnWidth) : 210;
        var safetyBuffer = 56; // padding + comfortable breathing room before colliding

        var maxSideWidth = Math.max(brandWidth, actionsWidth);
        var shouldCompact = (window.innerWidth <= 1180) || (innerWidth < (maxSideWidth * 2 + lastMeasuredLinksWidth + safetyBuffer));

        if (shouldCompact) {
          elSiteNav.classList.add("is-compact-nav");
        } else {
          elSiteNav.classList.remove("is-compact-nav");
          if (elSiteNavLinks.classList.contains("is-open")) {
            elSiteNavLinks.classList.remove("is-open");
            if (elMobileMenuToggle) elMobileMenuToggle.setAttribute("aria-expanded", "false");
          }
        }
      }

      syncAdaptiveTopNav();
      window.addEventListener("resize", syncAdaptiveTopNav, { passive: true });
      if (typeof ResizeObserver !== "undefined" && elSiteNavInner) {
        var navResizeObserver = new ResizeObserver(function () {
          syncAdaptiveTopNav();
        });
        navResizeObserver.observe(elSiteNavInner);
      }

      if (elMobileMenuToggle) elMobileMenuToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = elSiteNavLinks.classList.toggle("is-open");
        elMobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      document.addEventListener("click", function (e) {
        if (elSiteNavLinks.classList.contains("is-open")) {
          if (!elSiteNavLinks.contains(e.target) && e.target !== elMobileMenuToggle) {
            elSiteNavLinks.classList.remove("is-open");
            if (elMobileMenuToggle) elMobileMenuToggle.setAttribute("aria-expanded", "false");
          }
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && elSiteNavLinks.classList.contains("is-open")) {
          elSiteNavLinks.classList.remove("is-open");
          if (elMobileMenuToggle) elMobileMenuToggle.setAttribute("aria-expanded", "false");
        }
      });



      var isManualClickScroll = false;
      var clickScrollTimeout = null;

      function setActiveNavLink(targetId) {
        var links = document.querySelectorAll(".site-nav-links .nav-link, .mobile-bottom-nav .nav-link");
        for (var i = 0; i < links.length; i += 1) {
          var href = links[i].getAttribute("href") || "";
          if (href === "#" + targetId || (targetId === "home" && href === "#home")) {
            links[i].classList.add("is-active");
          } else {
            links[i].classList.remove("is-active");
          }
        }
      }

      function updateScrollSpy() {
        if (isManualClickScroll) return;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var docHeight = document.documentElement.scrollHeight;
        var winHeight = window.innerHeight;

        // If near top, home is active
        if (scrollY < 200) {
          setActiveNavLink("home");
          return;
        }

        // If at bottom of page, last section is active
        if (scrollY + winHeight >= docHeight - 60) {
          setActiveNavLink("if-you-fell-for-it");
          return;
        }

        var sectionIds = ["home", "about", "how-to-play", "what-youll-learn", "if-you-fell-for-it"];
        var currentSection = "home";

        for (var s = 0; s < sectionIds.length; s += 1) {
          var el = document.getElementById(sectionIds[s]);
          if (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top <= 160) {
              currentSection = sectionIds[s];
            }
          }
        }

        setActiveNavLink(currentSection);
      }

      var scrollTicking = false;
      window.addEventListener("scroll", function () {
        if (!scrollTicking) {
          window.requestAnimationFrame(function () {
            updateScrollSpy();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });

      var navLinks = document.querySelectorAll(".site-nav-links .nav-link, .mobile-bottom-nav .nav-link");
      for (var nl = 0; nl < navLinks.length; nl += 1) {
        (function (link) {
          link.addEventListener("click", function (e) {
            var href = link.getAttribute("href") || "";
            if (href.charAt(0) === "#") {
              var targetId = href.substring(1);
              var targetEl = document.getElementById(targetId);
              if (targetEl) {
                e.preventDefault();
                isManualClickScroll = true;
                clearTimeout(clickScrollTimeout);
                setActiveNavLink(targetId);

                if (targetId === "home") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  var targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - 68;
                  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
                }

                if (window.history && window.history.pushState) {
                  window.history.pushState(null, "", href);
                }

                clickScrollTimeout = setTimeout(function () {
                  isManualClickScroll = false;
                }, 800);
              }
            }

            elSiteNavLinks.classList.remove("is-open");
            if (elMobileMenuToggle) {
              if (elMobileMenuToggle) elMobileMenuToggle.setAttribute("aria-expanded", "false");
            }
          });
        })(navLinks[nl]);
      }

      var brandLinks = document.querySelectorAll(".site-brand");
      for (var bl = 0; bl < brandLinks.length; bl += 1) {
        brandLinks[bl].addEventListener("click", function (e) {
          e.preventDefault();
          isManualClickScroll = true;
          clearTimeout(clickScrollTimeout);
          setActiveNavLink("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (window.history && window.history.pushState) {
            window.history.pushState(null, "", window.location.pathname + window.location.search);
          }
          clickScrollTimeout = setTimeout(function () {
            isManualClickScroll = false;
          }, 800);
        });
      }

      updateScrollSpy();
    }



    if ("scrollRestoration" in history) {

      history.scrollRestoration = "manual";

    }







    if (window.location.hash === "#home" || window.location.hash === "") {

      window.scrollTo(0, 0);

      requestAnimationFrame(function () {

        window.scrollTo(0, 0);

      });

    }



    document.addEventListener("keydown", handleKeyDown);



    state.clearedDoors = loadClearedDoors();

    setScreen("menu");

    renderMenu();



    fetch("scenarios.json")

      .then(function (response) {

        if (!response.ok) {

          throw new Error("Failed to load scenarios.json");

        }

        return response.json();

      })

      .then(function (data) {

        state.allMessages = Array.isArray(data.messages) ? data.messages : [];

        state.loaded = state.allMessages.length > 0;

        renderMenu();

        if (state.screen === "menu") {

          var activeButtons = getActiveTitleMenuButtons();

          if (activeButtons[state.selectedMenuIndex]) {

            setSelectedMenuButton(activeButtons[state.selectedMenuIndex], false);

          }

        }

      })

      .catch(function () {

        elMenuStatus.textContent =

          "// error: scenario data could not be loaded. Run the game from a local HTTP server.";

        elMenuStatus.classList.remove("hidden");

      });

  }



  function loadGitHubStars() {
    var starCountEl = byId("github-star-count");
    if (!starCountEl || typeof fetch !== "function") return;
    fetch("/api/stars")
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (
          data &&
          typeof data.stars === "number" &&
          Number.isInteger(data.stars) &&
          data.stars >= 0
        ) {
          starCountEl.textContent = String(data.stars);
          starCountEl.classList.remove("hidden");
        }
      })
      .catch(function () {
        // Keep hidden on failure
      });
  }

  loadGitHubStars();
  init();

})();

