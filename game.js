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

  /* ---------- Interactive Robot Companion (Beloved Cyber Droid) ---------- */
  function initRobotCompanion() {
    var elHead = document.getElementById("robot-head");
    var elEyesGroup = document.getElementById("robot-eyes-group");
    var elSpeech = document.getElementById("robot-speech-text");
    var elSpeechTag = document.getElementById("speech-mode-tag");
    var elRobot = document.getElementById("soc-robot");

    if (!elHead || !elRobot) {
      return;
    }

    var isInteractive = false;
    var idleTipIndex = 0;

    var idleTips = [
      "// TIP: Legitimate security teams will never ask for your SMS OTP code.",
      "// TIP: Check sender domains carefully (.example vs lookalike typos).",
      "// TIP: Scammers create fake urgency to make you click without thinking.",
      "// TIP: In Door 01-03, press [H] to get an analyst hint (1 per door).",
      "// TIP: Never run unexpected attachments (.apk, .exe, .scr).",
      "// TIP: Use keyboard shortcuts: [P] Phishing \u00B7 [S] Safe \u00B7 [Enter] Next."
    ];

    var clickGreetings = [
      "// HELLO OPERATOR! Sentinel AI is calibrated and ready to assist.",
      "// ALL SYSTEMS NOMINAL: Threat intelligence heuristics operational!",
      "// READY WHEN YOU ARE! Let's breach these blast doors together.",
      "// TIP: Stay alert! Attackers disguise links and impersonate staff on Door 02 & 03."
    ];
    var clickGreetingIndex = 0;

    function setSpeech(text, modeTag) {
      if (elSpeech) {
        elSpeech.style.opacity = "0.4";
        setTimeout(function () {
          elSpeech.textContent = text;
          elSpeech.style.opacity = "1";
        }, 120);
      }
      if (elSpeechTag && modeTag) {
        elSpeechTag.textContent = modeTag;
      }
    }

    function setEyeExpression(className) {
      if (!elEyesGroup) return;
      elEyesGroup.classList.remove("is-closed", "is-happy", "is-alert", "is-wink", "is-blinking");
      if (className) {
        elEyesGroup.classList.add(className);
      }
    }

    // Check accessibility: prefers-reduced-motion
    var prefersReducedMotion = false;
    try {
      prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    // Cursor tracking state variables in full 3D (Pitch, Yaw, Roll, Parallax)
    var targetRotX = 0; // Vertical pitch (nod down / up)
    var targetRotY = 0; // Horizontal turn (yaw left / right)
    var targetRotZ = 0; // Subtle curious roll
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

    var rafId = null;

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function onPointerMove(e) {
      if (prefersReducedMotion || !elHead) return;

      var rect = elHead.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var dx = e.clientX - centerX;
      var dy = e.clientY - centerY;

      // Dynamic viewport reach scaling for natural, responsive tracking
      var maxDistX = Math.max(window.innerWidth * 0.45, 360);
      var maxDistY = Math.max(window.innerHeight * 0.45, 300);

      var normX = clamp(dx / maxDistX, -1, 1);
      var normY = clamp(dy / maxDistY, -1, 1);

      // 1. Horizontal Turn (Yaw in 3D: -16deg to +16deg)
      // Turning head in 3D space to face cursor direction
      targetRotY = normX * 16;

      // 2. Vertical Nod / Pitch (Looking Down / Up: -13deg to +10deg)
      // When cursor is below the head (dy > 0, normY > 0), head tilts DOWN (negative rotateX)
      // When cursor is above the head (dy < 0, normY < 0), head tilts UP (positive rotateX)
      targetRotX = normY > 0 ? -normY * 13 : -normY * 10;

      // 3. Subtle Curious Cock (Roll Z: -3.5deg to +3.5deg)
      targetRotZ = normX * 3.5;

      // 4. Parallax Translation
      targetHeadX = normX * 6;
      // Head dips downward when looking down (+6px) and lifts when looking up (-5px)
      targetHeadY = normY > 0 ? normY * 6 : normY * 5;

      // 5. Visor Gaze & Eye Tracking (Independent Eye Glance inside Visor)
      targetEyeX = normX * 13;
      targetEyeY = normY > 0 ? normY * 10 : normY * 7;
    }

    function onPointerLeave() {
      // Smooth return to neutral forward-facing pose
      targetRotX = 0;
      targetRotY = 0;
      targetRotZ = 0;
      targetHeadX = 0;
      targetHeadY = 0;
      targetEyeX = 0;
      targetEyeY = 0;
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    // Smooth Lerp Animation Loop with requestAnimationFrame
    function updateTracking() {
      if (!prefersReducedMotion) {
        var lerpFactor = 0.09;
        curRotX += (targetRotX - curRotX) * lerpFactor;
        curRotY += (targetRotY - curRotY) * lerpFactor;
        curRotZ += (targetRotZ - curRotZ) * lerpFactor;
        curHeadX += (targetHeadX - curHeadX) * lerpFactor;
        curHeadY += (targetHeadY - curHeadY) * lerpFactor;

        curEyeX += (targetEyeX - curEyeX) * 0.12;
        curEyeY += (targetEyeY - curEyeY) * 0.12;

        if (elHead) {
          elHead.style.transform =
            "translate3d(" + curHeadX.toFixed(2) + "px, " + curHeadY.toFixed(2) + "px, 0px) " +
            "rotateX(" + curRotX.toFixed(2) + "deg) " +
            "rotateY(" + curRotY.toFixed(2) + "deg) " +
            "rotateZ(" + curRotZ.toFixed(2) + "deg)";
        }

        if (elEyesGroup) {
          elEyesGroup.style.transform =
            "translate3d(" + curEyeX.toFixed(2) + "px, " + curEyeY.toFixed(2) + "px, 0px)";
        }
      }
      rafId = requestAnimationFrame(updateTracking);
    }

    rafId = requestAnimationFrame(updateTracking);

    // Pause tracking when tab is hidden to conserve CPU
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(updateTracking);
      }
    });

    // Natural blinking timer
    var blinkCounter = 0;
    setInterval(function () {
      if (isInteractive) return;
      blinkCounter += 1;
      var blinkClass = blinkCounter % 6 === 0 ? "is-wink" : "is-blinking";
      setEyeExpression(blinkClass);
      setTimeout(function () {
        setEyeExpression(null);
      }, 160);
    }, 3800);

    // Rotating Idle Intel Tips (every 9s)
    setInterval(function () {
      if (isInteractive) return;
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

    // Click reaction: close eyes, deliver greeting
    var isBotClosed = false;

    function resetBotToNormal() {
      if (isBotClosed) {
        isBotClosed = false;
        isInteractive = false;
        setEyeExpression(null);
        setSpeech("// SENTINEL BOT ONLINE \u00B7 READY FOR TRIAGE", "STANDBY");
      }
    }

    if (elRobot) {
      elRobot.addEventListener("click", function (e) {
        e.stopPropagation();
        isBotClosed = true;
        isInteractive = true;
        setEyeExpression("is-closed");

        var greeting = clickGreetings[clickGreetingIndex % clickGreetings.length];
        clickGreetingIndex += 1;
        setSpeech(greeting, "COMMS");
      });
    }

    window.addEventListener("click", function (e) {
      if (isBotClosed && elRobot && !elRobot.contains(e.target)) {
        resetBotToNormal();
      }
    });

    window.addEventListener("pointerdown", function (e) {
      if (isBotClosed && elRobot && !elRobot.contains(e.target)) {
        resetBotToNormal();
      }
    });

    // Menu reaction buttons
    var startBtn = document.getElementById("menu-start-btn");
    var continueBtn = document.getElementById("menu-continue-btn");
    var selectBtn = document.getElementById("menu-select-btn");
    var howtoBtn = document.getElementById("menu-howto-btn");
    var aboutBtn = document.getElementById("menu-about-btn");

    function attachMenuReaction(btn, text, modeTag, eyeClass) {
      if (!btn) return;
      btn.addEventListener("mouseenter", function () {
        isInteractive = true;
        setEyeExpression(eyeClass || "is-alert");
        setSpeech(text, modeTag || "TACTICAL");
      });
      btn.addEventListener("mouseleave", function () {
        isInteractive = false;
        setEyeExpression(null);
        setSpeech("// SENTINEL BOT ONLINE \u00B7 READY FOR TRIAGE", "STANDBY");
      });
    }

    attachMenuReaction(startBtn, "// BREACH PROTOCOL: Commencing Door 01 containment triage!", "DEPLOY", "is-alert");
    attachMenuReaction(continueBtn, "// PROTOCOL: Resuming run from your latest cleared blast door.", "RESUME", "is-happy");
    attachMenuReaction(selectBtn, "// ACCESS OVERRIDE: Select clearance door (01 to 03).", "OVERRIDE", null);
    attachMenuReaction(howtoBtn, "// BRIEFING: [P] Phish \u00B7 [S] Safe \u00B7 [H] Hint \u00B7 [Esc] Pause.", "BRIEF", null);
    attachMenuReaction(aboutBtn, "// DIRECTIVE: Reviewing server room lockdown containment notes.", "INTEL", null);
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
        playText: "LAUNCH DOOR 01 (EMAIL)"
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
        playText: "LAUNCH DOOR 02 (SMS)"
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
        playText: "LAUNCH DOOR 03 (CHAT)"
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
          elDossierPlayText.textContent = "LOCKED - CLEAR DOOR 0" + (doorNum - 1) + " FIRST";
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

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    var homeLinks = document.querySelectorAll('a[href="#home"]');
    for (var hl = 0; hl < homeLinks.length; hl += 1) {
      homeLinks[hl].addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", window.location.pathname + window.location.search);
        }
      });
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

  init();
})();
