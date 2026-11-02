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
    committedRunAnswers: {}
  };

  function byId(id) {
    return document.getElementById(id);
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
  var elMenuBest = byId("menu-best-score");
  var elMenuProgress = byId("menu-progress");
  var elMenuStatus = byId("menu-status");
  var elMenuStorageNote = byId("menu-storage-note");

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

  function focusElement(node) {
    if (node && typeof node.focus === "function") {
      node.focus();
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
      var q = quotes[i];
      if (!q) {
        continue;
      }
      var searchFrom = 0;
      while (searchFrom <= fullText.length) {
        var idx = fullText.indexOf(q, searchFrom);
        if (idx === -1) {
          break;
        }
        intervals.push({ start: idx, end: idx + q.length });
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
      mark.textContent = fullText.slice(range.start, range.end);
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
    for (var i = 0; i < LEVEL_COUNT; i += 1) {
      var doorLevel = i + 1;
      var badge = elDoorBadges[i];
      badge.classList.remove("door-active", "door-unlocked");
      if (inDoor && doorLevel === state.level) {
        badge.classList.add("door-active");
        badge.textContent = "DOOR " + doorLevel + " · ACTIVE";
      } else if (doorLevel <= state.clearedDoors) {
        badge.classList.add("door-unlocked");
        badge.textContent = "DOOR " + doorLevel + " · UNLOCKED";
      } else {
        badge.textContent = "DOOR " + doorLevel + " · LOCKED";
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
    elHudProgress.textContent = state.currentIndex + 1 + " / " + totalInLevel;
    elHudTimer.textContent = state.timeLeft + "s";
    elHudTimer.classList.toggle("timer-low", state.timeLeft <= 20);

    var hearts = "";
    for (var i = 0; i < INITIAL_LIVES; i += 1) {
      hearts += i < state.lives ? "♥" : "♡";
    }
    elHudLives.textContent = hearts;
    elHudLives.setAttribute(
      "aria-label",
      state.lives + (state.lives === 1 ? " life" : " lives") + " remaining"
    );
    elHudScore.textContent = String(state.score);

    setButtonLabel(elBtnHint, state.hintAvailable ? "HINT (1)" : "HINT (0)", "[H]");
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
      focusElement(activeButtons[state.selectedMenuIndex]);
    }
    announce("Title screen.");
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

    elMessageTerminal.classList.remove("channel-email", "channel-sms", "channel-chat");
    elMessageTerminal.classList.add("channel-" + msg.channel);

    elTerminalDoorLabel.textContent = "// soc terminal · door " + state.level;
    elChannelBadge.textContent = msg.channel.toUpperCase();

    if (msg.channel === "email") {
      elSenderLabel.textContent = "From:";
    } else if (msg.channel === "sms") {
      elSenderLabel.textContent = "SMS:";
    } else {
      elSenderLabel.textContent = "";
    }

    renderTextWithHighlights(elMsgSender, msg.sender, []);

    if (msg.channel === "email" && msg.subject) {
      elMsgSubjectRow.classList.remove("hidden");
      renderTextWithHighlights(elMsgSubject, msg.subject, []);
    } else {
      elMsgSubjectRow.classList.add("hidden");
      clearChildren(elMsgSubject);
    }

    renderTextWithHighlights(elMsgBody, msg.body, []);

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

    var reasonText =
      reason === "time"
        ? "Time ran out. The 120-second lockdown timer for Door " + state.level + " reached zero."
        : "Out of lives. You used all " + INITIAL_LIVES + " lives on Door " + state.level + ".";

    elFailedDoorNum.textContent = String(state.level);
    elFailedReason.textContent = reasonText;
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
    } else {
      state.lives = Math.max(0, state.lives - 1);
      if (msg.is_phishing && !chosePhishing) {
        for (var i = 0; i < msg.red_flags.length; i += 1) {
          var cat = msg.red_flags[i].category;
          state.missedCategories[cat] = (state.missedCategories[cat] || 0) + 1;
        }
      }
    }

    elBtnPhishing.disabled = true;
    elBtnSafe.disabled = true;
    updateHud();

    var allQuotes = msg.red_flags.map(function (flag) {
      return flag.quote;
    });
    renderTextWithHighlights(elMsgSender, msg.sender, allQuotes);
    if (msg.channel === "email" && msg.subject) {
      renderTextWithHighlights(elMsgSubject, msg.subject, allQuotes);
    }
    renderTextWithHighlights(elMsgBody, msg.body, allQuotes);

    elFeedbackPanel.classList.remove("hidden", "feedback-correct", "feedback-wrong");
    elFeedbackPanel.classList.add(isCorrect ? "feedback-correct" : "feedback-wrong");

    var verdictText = isCorrect
      ? "CORRECT CLASSIFICATION (+100 PTS)"
      : "INCORRECT CLASSIFICATION (-1 LIFE)";
    var actualNature = msg.is_phishing
      ? "This message is a PHISHING attempt."
      : "This message is SAFE (legitimate).";

    if (state.lives <= 0) {
      actualNature += " You have no lives left on this door.";
    }

    elFeedbackVerdict.textContent = verdictText;
    elFeedbackSubtitle.textContent = actualNature;

    clearChildren(elFeedbackList);
    if (msg.is_phishing) {
      elFeedbackListTitle.textContent = "// red flags identified in message";
      for (var f = 0; f < msg.red_flags.length; f += 1) {
        var flag = msg.red_flags[f];
        var li = document.createElement("li");

        var catTag = document.createElement("span");
        catTag.className = "flag-category-tag";
        catTag.textContent = formatCategory(flag.category);
        li.appendChild(catTag);

        var quoteSpan = document.createElement("span");
        quoteSpan.className = "flag-quote-ref";
        quoteSpan.textContent = '"' + flag.quote + '"';
        li.appendChild(quoteSpan);

        li.appendChild(document.createTextNode("— " + flag.explanation));
        elFeedbackList.appendChild(li);
      }
    } else {
      elFeedbackListTitle.textContent = "// safe signals identified in message";
      for (var s = 0; s < msg.safe_signals.length; s += 1) {
        var safeLi = document.createElement("li");
        safeLi.textContent = msg.safe_signals[s];
        elFeedbackList.appendChild(safeLi);
      }
    }

    elFeedbackTip.textContent = msg.tip;

    var continueLabel = "CONTINUE";
    if (state.lives > 0 && state.currentIndex + 1 >= state.levelQueue.length) {
      continueLabel = "UNLOCK DOOR " + state.level;
    }
    setButtonLabel(elBtnContinue, continueLabel, "[ENTER]");

    announce(verdictText + ". " + actualNature + " Tip: " + msg.tip);
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

      if (stats.total === 0) {
        badgeSpan.textContent = "0 TESTED";
        badgeSpan.classList.add("badge-neutral");
      } else {
        var pct = Math.round((stats.caught / stats.total) * 100);
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

  function handleKeyDown(event) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    var key = event.key;

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
        submitDecision(true);
      } else if (key === "s" || key === "S") {
        event.preventDefault();
        submitDecision(false);
      } else if (key === "h" || key === "H") {
        event.preventDefault();
        useHint();
      }
    }
  }

  /* ---------- Init ---------- */

  function init() {
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

    elBtnPhishing.addEventListener("click", function () {
      submitDecision(true);
    });
    elBtnSafe.addEventListener("click", function () {
      submitDecision(false);
    });
    elBtnHint.addEventListener("click", useHint);
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

    if (elMobileMenuToggle && elSiteNavLinks) {
      elMobileMenuToggle.addEventListener("click", function () {
        var isOpen = elSiteNavLinks.classList.toggle("is-open");
        elMobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      var navLinks = elSiteNavLinks.querySelectorAll(".nav-link");
      for (var nl = 0; nl < navLinks.length; nl += 1) {
        navLinks[nl].addEventListener("click", function () {
          elSiteNavLinks.classList.remove("is-open");
          elMobileMenuToggle.setAttribute("aria-expanded", "false");
        });
      }
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
            focusElement(activeButtons[state.selectedMenuIndex]);
          }
        }
      })
      .catch(function () {
        elMenuStatus.textContent =
          "// error: scenario data could not be loaded. Run the game from a local HTTP server.";
        elMenuStatus.classList.remove("hidden");
      });
  }

  init();
})();
