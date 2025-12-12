// --- CONFIG ---
const TOTAL_HOURS = 5;
const SECONDS_PER_HOUR = 15;
const SLOTS_PER_HOUR = 5;

// --- INDIAN CONTEXT STORIES ---
const STORIES = [
  // HIGH TRP, LOW INFO (Masala/Fluff)
  {
    title: "Cricketer buys 5 Cr SUV: PICS!",
    type: "Fluff",
    rating: +15,
    info: -5,
  },
  {
    title: "Ambani Wedding: Who wore what?",
    type: "Fluff",
    rating: +12,
    info: -5,
  },
  {
    title: "Viral: Noida Road Rage Video",
    type: "Fluff",
    rating: +15,
    info: -2,
  },
  {
    title: "Actor spotted at Airport (Gym Look)",
    type: "Fluff",
    rating: +10,
    info: -2,
  },
  {
    title: "Zomato guy vs Customer: FIGHT!",
    type: "Fluff",
    rating: +18,
    info: -5,
  },

  // HIGH TRP, NEGATIVE INFO (Toxic Debates)
  {
    title: "DEBATE: Anchor Shouts for 20 Mins",
    type: "Scandal",
    rating: +20,
    info: -10,
  },
  {
    title: "Hindu-Muslim Debate: Shout Match",
    type: "Scandal",
    rating: +25,
    info: -15,
  },
  {
    title: "Politician Slaps Official on Cam",
    type: "Scandal",
    rating: +18,
    info: -5,
  },

  // LOW TRP, HIGH INFO (Vegetables)
  {
    title: "GST Council: New Tax Slab Details",
    type: "Policy",
    rating: -10,
    info: +20,
  },
  {
    title: "Groundwater Report: Crisis Ahead",
    type: "Policy",
    rating: -8,
    info: +25,
  },
  {
    title: "RBI Keeps Repo Rate Unchanged",
    type: "Policy",
    rating: -12,
    info: +15,
  },
  {
    title: "Farmer MSP Demands Explained",
    type: "Policy",
    rating: -5,
    info: +20,
  },
  {
    title: "Start-up IPO Regulations Update",
    type: "Policy",
    rating: -10,
    info: +15,
  },

  // BALANCED (Rare Gems)
  {
    title: "ISRO Launch Successful",
    type: "News",
    rating: +10,
    info: +10,
  },
  {
    title: "Election Phase 1: Voter Turnout",
    type: "News",
    rating: +8,
    info: +10,
  },
  {
    title: "New Metro Line Opens Today",
    type: "News",
    rating: +5,
    info: +5,
  },
];

// --- STATE ---
let state = {
  hour: 1,
  ratings: 50,
  info: 50,
  timeLeft: SECONDS_PER_HOUR,
  storiesAired: 0,
  gameInterval: null,
  spawnInterval: null,
  activeStories: [],
};

// --- CORE LOGIC ---
function startGame() {
  document.getElementById("start-modal").classList.remove("active");
  startRound();
}

function startRound() {
  // Reset Round State
  state.timeLeft = SECONDS_PER_HOUR;
  state.storiesAired = 0;
  state.activeStories = [];

  document.getElementById("news-feed").innerHTML = ""; // Clear board
  document.querySelectorAll(".slot").forEach((el, i) => {
    el.className = "slot";
    el.innerText = i + 1;
  });

  updateUI();

  // Start Timers
  clearInterval(state.gameInterval);
  clearInterval(state.spawnInterval);

  state.gameInterval = setInterval(gameTick, 1000);
  state.spawnInterval = setInterval(spawnStory, 750); // Slightly faster spawn
}

function gameTick() {
  state.timeLeft--;
  updateUI();

  if (state.timeLeft <= 0) {
    endRound("Deadline Missed!");
  }
}

function spawnStory() {
  // Don't overpopulate (Responsive limits)
  const maxStories = window.innerWidth < 600 ? 5 : 7;
  if (document.getElementById("news-feed").childElementCount > maxStories)
    return;

  const storyData = STORIES[Math.floor(Math.random() * STORIES.length)];
  const id = "story-" + Date.now() + Math.random();

  // Random Position (Keep within bounds)
  const container = document.getElementById("news-feed");
  // Ensure card fits on screen
  const maxX = container.clientWidth - 145; // Card width + padding
  const maxY = container.clientHeight - 110; // Card height + padding

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  const el = document.createElement("div");
  el.className = "story-card";
  el.style.left = Math.max(0, x) + "px";
  el.style.top = Math.max(0, y) + "px";
  el.id = id;

  let tagClass =
    storyData.type === "Scandal"
      ? "tag-scandal"
      : storyData.type === "Policy"
      ? "tag-policy"
      : storyData.type === "News"
      ? "tag-news"
      : "tag-fluff";

  el.innerHTML = `
      <span class="story-tag ${tagClass}">${storyData.type}</span>
      <div class="story-title">${storyData.title}</div>
      <div class="story-meta">
          <span>⭐ ${storyData.rating > 0 ? "+" : ""}${storyData.rating}</span>
          <span>🧠 ${storyData.info > 0 ? "+" : ""}${storyData.info}</span>
      </div>
  `;

  el.onmousedown = (e) => {
    e.stopPropagation();
    airStory(storyData, id);
  };
  // Touch support
  el.ontouchstart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    airStory(storyData, id);
  };

  container.appendChild(el);

  // Auto-remove after 3 seconds (The "Whack-a-mole" expiry)
  setTimeout(() => {
    const currentEl = document.getElementById(id);
    if (currentEl) {
      currentEl.classList.add("expiring");
      setTimeout(() => {
        if (currentEl) currentEl.remove();
      }, 1000);
    }
  }, 3000);
}

function airStory(data, id) {
  // Remove from feed
  const el = document.getElementById(id);
  if (el) el.remove();

  // Update Stats
  state.ratings = clamp(state.ratings + data.rating, 0, 100);
  state.info = clamp(state.info + data.info, 0, 100);

  // Update Slots UI
  state.storiesAired++;
  const slot = document.querySelectorAll(".slot")[state.storiesAired - 1];
  if (slot) {
    slot.classList.add("filled");
    slot.innerText = data.type; // Show type in slot
  }

  updateUI();

  // Check Round End
  if (state.storiesAired >= SLOTS_PER_HOUR) {
    endRound("Broadcast Complete!");
  }

  // Check Game Over (Early)
  if (state.ratings <= 0 || state.info <= 0) {
    gameOver();
  }
}

function endRound(reason) {
  clearInterval(state.gameInterval);
  clearInterval(state.spawnInterval);

  const m = document.getElementById("report-modal");
  const t = document.getElementById("report-title");
  const d = document.getElementById("report-desc");
  const b = document.getElementById("btn-next-hour");

  m.classList.add("active");
  t.innerText = `Hour ${state.hour} Ended`;
  d.innerText = reason;

  document.getElementById(
    "report-rating"
  ).innerText = `TRP: ${state.ratings}%`;
  document.getElementById(
    "report-info"
  ).innerText = `Info: ${state.info}%`;

  if (state.hour >= TOTAL_HOURS) {
    b.innerText = "See Final Results";
    b.onclick = gameOver;
  } else {
    b.innerText = "Start Next Hour";
    b.onclick = nextHour;
  }
}

function nextHour() {
  document.getElementById("report-modal").classList.remove("active");
  state.hour++;
  startRound();
}

function gameOver() {
  clearInterval(state.gameInterval);
  clearInterval(state.spawnInterval);

  const m = document.getElementById("report-modal");
  m.classList.add("active");
  const t = document.getElementById("report-title");
  const d = document.getElementById("report-desc");
  const b = document.getElementById("btn-next-hour");

  // End Game Logic
  if (state.ratings <= 0) {
    t.innerText = "FIRED!";
    t.style.color = "var(--danger)";
    d.innerText =
      "Your channel's ratings crashed. Advertisers pulled out. You are out of a job.";
  } else if (state.info <= 0) {
    t.innerText = "DEMOCRACY FAILED";
    t.style.color = "var(--danger)";
    d.innerText =
      "You have high ratings, but the public is totally misinformed. You failed your country.";
  } else if (state.ratings > 80 && state.info < 30) {
    t.innerText = "SENSATIONALIST";
    t.style.color = "#d4a017";
    d.innerText =
      "You are rich and famous, but your news is garbage. A hollow victory.";
  } else if (state.ratings > 50 && state.info > 50) {
    t.innerText = "LEGENDARY EDITOR";
    t.style.color = "var(--success)";
    d.innerText =
      "Incredible! You made money AND informed the public. The hardest job in the world.";
  } else {
    t.innerText = "SURVIVOR";
    t.style.color = "var(--text-main)";
    d.innerText =
      "You kept your job and the country is... okay. Not great, not terrible.";
  }

  b.innerText = "Play Again";
  b.onclick = () => location.reload();
}

function updateUI() {
  document.getElementById("val-timer").innerText = state.timeLeft + "s";
  
  // Update Progress Bars
  document.getElementById("bar-ratings").style.width = state.ratings + "%";
  document.getElementById("val-ratings").innerText = state.ratings + "%";
  
  document.getElementById("bar-info").style.width = state.info + "%";
  document.getElementById("val-info").innerText = state.info + "%";

  // Color changes for danger zones
  const timerEl = document.getElementById("val-timer");
  if (state.timeLeft < 5) {
    timerEl.style.color = "var(--danger)";
  } else {
    timerEl.style.color = "var(--text-main)";
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
