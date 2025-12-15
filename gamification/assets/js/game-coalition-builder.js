// --- GAME CONFIG ---
const TARGET_PASSED = 5;
const MAX_SEATS = 500;
const MY_SEATS = 150;
const THRESHOLD = 251;
const INITIAL_CAPITAL = 75; // Decreased from 100 for difficulty
const INITIAL_WEEKS = 10;
const WIN_REWARD = 10; // Decreased reward

// Party Archetypes
const PARTIES = [
  { id: 0, name: "Farmers Front", seats: 80 },
  { id: 1, name: "Corp Alliance", seats: 90 },
  { id: 2, name: "Sanskriti Dal", seats: 70 },
  { id: 3, name: "Youth Bloc", seats: 110 },
];

// Laws Deck (Harder affinities)
// 0 = Neutral, -1 = Dislike, -2 = Hate, 1 = Support, 2 = Love
const LAWS = [
  {
    title: "Green Energy Subsidy",
    desc: "Tax cuts for solar farms. Reduces diesel subsidies.",
    affinities: [-2, 1, -1, 2], // Farmers hate it (diesel)
  },
  {
    title: "Labor Code Reform",
    desc: "12-hour work shifts allowed. Easier hiring/firing.",
    affinities: [-1, 2, -1, 0], // Unions hate it, Corp loves it
  },
  {
    title: "Heritage Protection Act",
    desc: "Funds ancient sites but bans construction near them.",
    affinities: [-1, -2, 2, -1], // Corp hates land ban
  },
  {
    title: "Digital Privacy Bill",
    desc: "Strict data localization. Good for users, bad for big tech.",
    affinities: [0, -2, 0, 2], // Corp hates compliance costs
  },
  {
    title: "MSP Guarantee Act",
    desc: "Guarantees minimum crop prices. Huge cost to exchequer.",
    affinities: [2, -2, 0, -1], // Corp hates taxes, Youth worries about debt
  },
  {
    title: "Urban Infra Overhaul",
    desc: "Demolish old structures for flyovers.",
    affinities: [-1, 1, -2, 1], // Traditionalists hate demolition
  },
  {
    title: "University Autonomy",
    desc: "Reduces govt control over syllabus.",
    affinities: [0, 0, -2, 2], // Youth wants freedom, Trad wants control
  },
  {
    title: "Defense Budget Hike",
    desc: "Increases military spending by cutting social welfare.",
    affinities: [-1, 1, 2, -2], // Youth hates welfare cuts
  },
];

// --- STATE ---
let state = {
  capital: INITIAL_CAPITAL,
  weeks: INITIAL_WEEKS,
  passed: 0,
  currentLaw: null,
  partyStances: [],
  deckIndex: 0,
};

function initGame() {
  LAWS.sort(() => Math.random() - 0.5);

  state = {
    capital: INITIAL_CAPITAL,
    weeks: INITIAL_WEEKS,
    passed: 0,
    currentLaw: null,
    deckIndex: 0,
    partyStances: [false, false, false, false],
  };

  document.getElementById("end-modal").classList.remove("active");
  loadNextLaw();
  updateUI();
}

function loadNextLaw() {
  if (state.deckIndex >= LAWS.length) {
    state.deckIndex = 0;
    LAWS.sort(() => Math.random() - 0.5);
  }

  state.currentLaw = LAWS[state.deckIndex];
  state.deckIndex++;

  // Default stances based on affinity > 0
  state.partyStances = PARTIES.map((p, index) => {
    return state.currentLaw.affinities[index] > 0;
  });

  renderLawCard();
  renderParties();
  updateViz();
}

function renderLawCard() {
  document.getElementById("law-title").innerText = state.currentLaw.title;
  document.getElementById("law-desc").innerText = state.currentLaw.desc;
}

function renderParties() {
  const grid = document.getElementById("parties-grid");
  grid.innerHTML = "";

  PARTIES.forEach((p, index) => {
    const supports = state.partyStances[index];
    const affinity = state.currentLaw.affinities[index];

    // INCREASED DIFFICULTY COST FORMULA
    // Base cost 20. +15 for each level of disagreement.
    // Neutral (0) = 20. Dislike (-1) = 35. Hate (-2) = 50.
    let cost = 0;
    if (!supports) {
      // If affinity is positive but currently false (unlikely in this logic but possible if we add events), treat as 10
      if (affinity > 0) cost = 10;
      else cost = 20 + Math.abs(affinity) * 15;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "col-6"; // Fixed to 2 columns for better readability on 600px width

    const card = document.createElement("div");
    card.className = `party-card ${supports ? "is-ally" : "is-opp"} h-100`;

    // Check if player can afford
    const canAfford = state.capital >= cost;

    card.innerHTML = `
          <div class="party-header">
              <span class="party-name">${p.name}</span>
              <span class="party-seats">${p.seats}</span>
          </div>
          
          <span class="stance-tag ${supports ? "tag-yes" : "tag-no"}">
              ${supports ? "SUPPORTS" : "OPPOSES"}
          </span>

          ${
            !supports
              ? `
              <button class="negotiate-btn" 
                  style="${!canAfford ? "opacity:0.5" : ""}"
                  onclick="negotiate(${index}, ${cost})">
                  Negotiate (${cost} Cap)
              </button>
          `
              : '<div class="status-secured">SECURED</div>'
          }
      `;
    wrapper.appendChild(card);
    grid.appendChild(wrapper);
  });
}

function negotiate(partyIndex, cost) {
  if (state.capital >= cost) {
    state.capital -= cost;
    state.partyStances[partyIndex] = true;
    renderParties();
    updateUI();
    updateViz();
  } else {
    // Shake effect or simple alert
    const btn = document.getElementById("btn-vote");
    
    // Prevent interaction if button is busy
    if (btn.disabled) return;

    btn.innerText = "NOT ENOUGH CAPITAL!";
    btn.style.background = "var(--danger)";
    btn.style.borderColor = "var(--danger)";
    btn.style.color = "white";
    
    setTimeout(() => {
      // Reset to CSS defaults
      btn.innerText = "CALL VOTE";
      btn.style.background = "";
      btn.style.borderColor = "";
      btn.style.color = "";
    }, 1000);
  }
}

function updateViz() {
  let currentVotes = MY_SEATS;
  PARTIES.forEach((p, idx) => {
    if (state.partyStances[idx]) currentVotes += p.seats;
  });

  const myPercent = (MY_SEATS / MAX_SEATS) * 100;
  let allySeats = 0;
  PARTIES.forEach((p, idx) => {
    if (state.partyStances[idx]) allySeats += p.seats;
  });
  const allyPercent = (allySeats / MAX_SEATS) * 100;

  document.getElementById("bar-gov").style.width = myPercent + "%";
  document.getElementById("bar-allies").style.width = allyPercent + "%";
  document.getElementById("bar-opp").style.width =
    100 - myPercent - allyPercent + "%";

  const voteEl = document.getElementById("vote-total");
  voteEl.innerText = currentVotes;
  voteEl.style.color =
    currentVotes >= THRESHOLD ? "var(--success)" : "var(--danger)";
}

function updateUI() {
  document.getElementById("val-capital").innerText = state.capital;
  document.getElementById("val-weeks").innerText = state.weeks;
  document.getElementById(
    "val-passed"
  ).innerText = `${state.passed} / ${TARGET_PASSED}`;
  document.getElementById("val-capital").style.color =
    state.capital < 20 ? "var(--danger)" : "var(--accent)";
}

function callVote() {
  let currentVotes = MY_SEATS;
  PARTIES.forEach((p, idx) => {
    if (state.partyStances[idx]) currentVotes += p.seats;
  });

  if (currentVotes >= THRESHOLD) {
    // Success
    state.passed++;
    state.weeks--;
    state.capital += WIN_REWARD;
    showFeedback(true);
  } else {
    // Fail
    state.weeks -= 2; // Punishment
    state.capital -= 5; // Punishment
    showFeedback(false);
  }

  setTimeout(checkEndGame, 1000);
}

function showFeedback(success) {
  const btn = document.getElementById("btn-vote");

  btn.disabled = true;
  btn.style.background = success ? "var(--success)" : "var(--danger)";
  btn.innerText = success ? "PASSED!" : "REJECTED!";
  btn.style.color = "white";
  btn.style.borderColor = success ? "var(--success)" : "var(--danger)";

  setTimeout(() => {
    btn.disabled = false;
    // Reset to CSS defaults
    btn.style.background = "";
    btn.innerText = "CALL VOTE";
    btn.style.color = "";
    btn.style.borderColor = "";

    if (state.weeks > 0 && state.passed < TARGET_PASSED) {
      loadNextLaw();
      updateUI();
    }
  }, 1000);
}

function checkEndGame() {
  if (state.passed >= TARGET_PASSED) {
    endGame(
      true,
      "Coalition Victorious! You managed to pass your agenda. The government is stable."
    );
  } else if (state.weeks <= 0) {
    endGame(
      false,
      "Term Ended. You ran out of time before passing enough laws. The coalition has collapsed."
    );
  }
}

function endGame(win, msg) {
  const modal = document.getElementById("end-modal");
  const title = document.getElementById("modal-title");
  const desc = document.getElementById("modal-desc");

  title.innerText = win ? "Victory!" : "Defeat";
  title.style.color = win ? "var(--success)" : "var(--danger)";
  desc.innerText = msg;
  modal.classList.add("active");
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
