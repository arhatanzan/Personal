// --- 50+ INDIAN CONTEXT CARDS ---
const DECK = [
  // POLICY & INFRA
  {
    text: "Detailed PDF: How the new Metro line alignment was chosen.",
    source: "Govt Portal",
    type: "Policy",
    effects: { engage: -10, polar: -5, info: +20 },
  },
  {
    text: "RTI Activist reveals breakdown of road repair funds.",
    source: "Citizen Watch",
    type: "Civic",
    effects: { engage: -5, polar: 0, info: +15 },
  },
  {
    text: "RBI announces new repo rate: Impact on your EMI explained.",
    source: "Econ Weekly",
    type: "Education",
    effects: { engage: -10, polar: -5, info: +25 },
  },
  {
    text: "High Court livestreams hearing on river pollution.",
    source: "Legal Update",
    type: "Civic",
    effects: { engage: -5, polar: 0, info: +10 },
  },
  {
    text: "Municipality releases fogging schedule for dengue prevention.",
    source: "City Corp",
    type: "Civic",
    effects: { engage: -5, polar: 0, info: +15 },
  },
  {
    text: "Explainer: The difference between State and Central taxes on fuel.",
    source: "FactCheck India",
    type: "Education",
    effects: { engage: -5, polar: -5, info: +20 },
  },
  {
    text: "Annual Budget: Education sector allocation increases by 2%.",
    source: "DD News",
    type: "Policy",
    effects: { engage: -10, polar: -2, info: +15 },
  },
  {
    text: "New guidelines issued for apartment RWA elections.",
    source: "Legal Blog",
    type: "Civic",
    effects: { engage: -15, polar: 0, info: +10 },
  },
  {
    text: "Documentary on the history of Indian Railways (1 hour long).",
    source: "Public TV",
    type: "Education",
    effects: { engage: -20, polar: -5, info: +20 },
  },
  {
    text: "Traffic Police explains new fines for driving on wrong side.",
    source: "Traffic Dept",
    type: "Policy",
    effects: { engage: +5, polar: +5, info: +15 },
  },
  {
    text: "Farmer explains how MSP calculation actually works.",
    source: "Rural Voice",
    type: "Policy",
    effects: { engage: -5, polar: -5, info: +20 },
  },
  {
    text: "ISRO announces launch date for new solar mission.",
    source: "Science Daily",
    type: "Education",
    effects: { engage: +10, polar: -5, info: +15 },
  },

  // OUTRAGE
  {
    text: "DEBATE NIGHT: Panelist throws water glass at opponent!",
    source: "Noida TV Hub",
    type: "Outrage",
    effects: { engage: +35, polar: +20, info: -10 },
  },
  {
    text: "Video: Politician forgets National Anthem lyrics? SHAMEFUL!",
    source: "Viral Clipz",
    type: "Outrage",
    effects: { engage: +30, polar: +25, info: -5 },
  },
  {
    text: "Celebrity spotted wearing shoes inside temple? OUTRAGE!",
    source: "Culture Warrior",
    type: "Outrage",
    effects: { engage: +25, polar: +15, info: -10 },
  },
  {
    text: "Opposition leader eats non-veg during holy month? PICS!",
    source: "24/7 Breaking",
    type: "Outrage",
    effects: { engage: +30, polar: +25, info: -5 },
  },
  {
    text: "WATCH: Two uncles fighting over parking spot in Delhi.",
    source: "Street Cam",
    type: "Distraction",
    effects: { engage: +25, polar: +5, info: 0 },
  },
  {
    text: "Anchor screams 'THE NATION WANTS TO KNOW' for 10 mins.",
    source: "Prime Time",
    type: "Outrage",
    effects: { engage: +40, polar: +20, info: -15 },
  },
  {
    text: "College students protest over canteen prices. 'ANTI-NATIONAL'?",
    source: "Angry Bird",
    type: "Outrage",
    effects: { engage: +25, polar: +30, info: -10 },
  },
  {
    text: "Actor says something dumb about history. Boycott trends.",
    source: "Twitter Trends",
    type: "Outrage",
    effects: { engage: +35, polar: +15, info: -10 },
  },

  // MISINFO & WHATSAPP
  {
    text: "FWD: UNESCO declares Indian National Anthem 'Best in Universe'.",
    source: "Family Group",
    type: "Misinfo",
    effects: { engage: +15, polar: +5, info: -10 },
  },
  {
    text: "Home Remedy: Put onions in socks to cure all viruses instantly!",
    source: "Grandma's Fwd",
    type: "Misinfo",
    effects: { engage: +20, polar: 0, info: -20 },
  },
  {
    text: "Secret GPS chip found in 2000 rupee notes? Watch Proof!",
    source: "Tech Truths?",
    type: "Misinfo",
    effects: { engage: +35, polar: +10, info: -25 },
  },
  {
    text: "NASA satellite image shows India lights up on Diwali only.",
    source: "WhatsApp Uni",
    type: "Misinfo",
    effects: { engage: +25, polar: 0, info: -5 },
  },
  {
    text: "Ancient aliens built the Kailasa temple? Scientists baffled!",
    source: "Mystery Tube",
    type: "Misinfo",
    effects: { engage: +20, polar: 0, info: -15 },
  },
  {
    text: "Nehru actually born in London? Secret birth certificate leak!",
    source: "History Redux",
    type: "Misinfo",
    effects: { engage: +30, polar: +25, info: -30 },
  },
  {
    text: "Eating only raw garlic cures blood pressure in 2 hours.",
    source: "Health Guru",
    type: "Misinfo",
    effects: { engage: +15, polar: 0, info: -15 },
  },
  {
    text: "World Bank CEO is actually an Indian guy named Raju? FWD!",
    source: "Pride Group",
    type: "Misinfo",
    effects: { engage: +15, polar: 0, info: -5 },
  },
  {
    text: "If you don't forward this to 10 people, bad luck for 7 years.",
    source: "Chain Msg",
    type: "Misinfo",
    effects: { engage: +10, polar: 0, info: -5 },
  },

  // POLARIZATION
  {
    text: "Why 'Those People' are secretly buying all the land in your city.",
    source: "Radical Blog",
    type: "Polarization",
    effects: { engage: +40, polar: +35, info: -20 },
  },
  {
    text: "Film Review: This movie attacks our culture and must be banned.",
    source: "Sanskari Reviews",
    type: "Polarization",
    effects: { engage: +30, polar: +25, info: -10 },
  },
  {
    text: "Opinion: Why state language imposition is destroying unity.",
    source: "Regional Voice",
    type: "Polarization",
    effects: { engage: +25, polar: +20, info: +5 },
  },
  {
    text: "Are 'Outsiders' stealing local jobs? Special Report.",
    source: "Local News",
    type: "Polarization",
    effects: { engage: +35, polar: +25, info: -10 },
  },
  {
    text: "True History: Why your ancestors were actually the kings of everything.",
    source: "Past Glory",
    type: "Polarization",
    effects: { engage: +25, polar: +15, info: -15 },
  },

  // DISTRACTION
  {
    text: "Cricketer buys a luxury SUV. See exclusive photos!",
    source: "Page 3 Daily",
    type: "Distraction",
    effects: { engage: +15, polar: -5, info: -5 },
  },
  {
    text: "Wedding Season: Who wore the most expensive Lehenga?",
    source: "BollyBuzz",
    type: "Distraction",
    effects: { engage: +20, polar: 0, info: -5 },
  },
  {
    text: "10 Reasons why Biryani is better than Pulao.",
    source: "Foodie Blog",
    type: "Distraction",
    effects: { engage: +15, polar: +5, info: 0 },
  },
  {
    text: "Viral Video: Dog riding a scooter in Bengaluru traffic.",
    source: "Cute Daily",
    type: "Distraction",
    effects: { engage: +25, polar: -10, info: 0 },
  },
  {
    text: "Which Star Kid is launching next? Click to see.",
    source: "Nepo News",
    type: "Distraction",
    effects: { engage: +15, polar: +5, info: -5 },
  },
  {
    text: "Memes about the heatwave that are too relatable.",
    source: "Meme page",
    type: "Distraction",
    effects: { engage: +20, polar: 0, info: 0 },
  },
  {
    text: "IPL Auction: Who became a millionaire overnight?",
    source: "CricInfo",
    type: "Distraction",
    effects: { engage: +25, polar: 0, info: 0 },
  },

  // CIVIC ISSUES
  {
    text: "Bangalore Techie stuck in traffic for 4 hours, builds app.",
    source: "Startup News",
    type: "Civic",
    effects: { engage: +15, polar: 0, info: +5 },
  },
  {
    text: "Monsoon Chaos: Mumbai local trains delayed by 20 mins.",
    source: "Commuter Alert",
    type: "Civic",
    effects: { engage: +10, polar: 0, info: +10 },
  },
  {
    text: "Power cuts expected in Sector 4 due to maintenance.",
    source: "Power Discom",
    type: "Civic",
    effects: { engage: +5, polar: +5, info: +15 },
  },
  {
    text: "Water tanker mafia exposed in sting operation.",
    source: "Investigate",
    type: "Civic",
    effects: { engage: +20, polar: +5, info: +15 },
  },
  {
    text: "Stray cattle menace on highway: Authority responds.",
    source: "Highway Patrol",
    type: "Civic",
    effects: { engage: +10, polar: +5, info: +10 },
  },
];

// --- CONFIGURATION ---
const GAME_CONFIG = {
  initialStats: {
    engagement: 50,
    polarization: 20,
    info: 30,
    maxTurns: 20
  },
  thresholds: {
    polarizationLimit: 100,
    engagementLimit: 0
  }
};

// --- STATE ---
let state = {
  engagement: GAME_CONFIG.initialStats.engagement,
  polarization: GAME_CONFIG.initialStats.polarization,
  info: GAME_CONFIG.initialStats.info,
  turn: 0,
  maxTurns: GAME_CONFIG.initialStats.maxTurns,
  weights: {},
  cardCounts: new Map(), // Tracks how many times a card has been shown
};

let currentCard = null;

function initGame() {
  state = {
    engagement: GAME_CONFIG.initialStats.engagement,
    polarization: GAME_CONFIG.initialStats.polarization,
    info: GAME_CONFIG.initialStats.info,
    turn: 0,
    maxTurns: GAME_CONFIG.initialStats.maxTurns,
    weights: {
      Policy: 1,
      Civic: 1,
      Outrage: 1,
      Misinfo: 1,
      Polarization: 1,
      Distraction: 1,
      Education: 1,
    },
    cardCounts: new Map(),
  };
  
  // Reset Custom Modal
  const modalEl = document.getElementById("game-over-modal");
  if (modalEl) {
    modalEl.classList.remove("active");
  }

  updateStatsUI();
  loadNextCard();
}

// --- LOGIC ---
function getWeightedRandomCard() {
  let typePool = [];
  for (let [type, weight] of Object.entries(state.weights)) {
    let count = Math.min(Math.floor(weight * 2), 20);
    for (let i = 0; i < count; i++) typePool.push(type);
  }

  let selectedType =
    typePool[Math.floor(Math.random() * typePool.length)];

  // Filter cards by TYPE and USAGE LIMIT (< 2)
  let candidates = DECK.filter(
    (c) => c.type === selectedType && (state.cardCounts.get(c) || 0) < 2
  );

  // Fallback: If all cards of this type are used up, pick ANY card with usage < 2
  if (candidates.length === 0) {
    candidates = DECK.filter((c) => (state.cardCounts.get(c) || 0) < 2);
  }

  // Emergency fallback: If everything is used up (unlikely), pick random
  if (candidates.length === 0)
    return DECK[Math.floor(Math.random() * DECK.length)];

  let chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Update count
  state.cardCounts.set(chosen, (state.cardCounts.get(chosen) || 0) + 1);

  return chosen;
}

function loadNextCard() {
  if (state.turn >= state.maxTurns) {
    endGame();
    return;
  }

  currentCard = getWeightedRandomCard();

  const cardEl = document.getElementById("active-card");
  cardEl.style.transform = "translate(0, 0) rotate(0deg)";
  cardEl.style.opacity = "1";

  cardEl.querySelector(".card-tag").innerText = currentCard.type;
  cardEl.querySelector(".card-content").innerText = currentCard.text;
  cardEl.querySelector(".card-source").innerText = currentCard.source;

  // Accessibility
  const feedback = document.getElementById("live-feedback");
  if(feedback) {
      feedback.innerText = `New card: ${currentCard.type}. ${currentCard.text}`;
  }
}

function handleChoice(action) {
  if (!currentCard) return;

  if (action === "boost") {
    state.engagement += currentCard.effects.engage;
    state.polarization += currentCard.effects.polar;
    state.info += currentCard.effects.info;

    // Viral Logic: Boost creates more of same type
    if (
      ["Misinfo", "Outrage", "Polarization"].includes(currentCard.type)
    ) {
      state.weights[currentCard.type] += 1.5;
      state.weights["Policy"] -= 0.5;
    }

    animateCard(1);
  } else {
    // Bury logic
    state.engagement -= 2;
    if (["Misinfo", "Outrage"].includes(currentCard.type)) {
      if (state.weights[currentCard.type] > 1)
        state.weights[currentCard.type] -= 0.2;
    }

    animateCard(-1);
  }

  // Normalize weights
  for (let key in state.weights) {
    if (state.weights[key] < 0.1) state.weights[key] = 0.1;
  }

  state.engagement = clamp(state.engagement, 0, 100);
  state.polarization = clamp(state.polarization, 0, 100);
  state.info = clamp(state.info, 0, 100);

  state.turn++;
  updateStatsUI();

  setTimeout(() => {
    if (state.engagement <= GAME_CONFIG.thresholds.engagementLimit)
      endGame(
        "Platform Dead",
        "Nobody is using your platform anymore. You ran out of funding."
      );
    else if (state.polarization >= GAME_CONFIG.thresholds.polarizationLimit)
      endGame(
        "Riots in the Streets",
        "Your algorithm stoked so much hate that internet services have been suspended."
      );
    else loadNextCard();
  }, 300);
}

function animateCard(direction) {
  const cardEl = document.getElementById("active-card");
  cardEl.style.transform = `translate(${
    direction * 250
  }px, 40px) rotate(${direction * 25}deg)`;
  cardEl.style.opacity = "0";
}

function updateStatsUI() {
  const engEl = document.getElementById("stat-engagement");
  const polEl = document.getElementById("stat-polarization");
  const infEl = document.getElementById("stat-info");

  const boxEng = document.getElementById("box-eng");
  const boxPol = document.getElementById("box-pol");
  const boxInf = document.getElementById("box-inf");

  if(engEl) engEl.innerText = Math.round(state.engagement) + "%";
  if(polEl) polEl.innerText = Math.round(state.polarization) + "%";
  if(infEl) infEl.innerText = Math.round(state.info) + "%";

  // Color Logic
  if(boxPol) setBoxState(boxPol, state.polarization, true, "rgba(239, 68, 68, 0.15)"); // Red
  if(boxInf) setBoxState(boxInf, state.info, false, "rgba(16, 185, 129, 0.15)"); // Green
  if(boxEng) setBoxState(boxEng, state.engagement, false, "rgba(15, 23, 42, 0.1)"); // Primary
}

function setBoxState(element, value, reverse, color) {
  // Apply linear gradient fill
  element.style.background = `linear-gradient(to top, ${color} ${value}%, #ffffff ${value}%)`;
}

function endGame(titleOverride = null, descOverride = null) {
  const title = document.getElementById("end-title");
  const desc = document.getElementById("end-desc");
  
  let finalTitle = "";
  let finalDesc = "";

  if (titleOverride) {
    finalTitle = titleOverride;
    finalDesc = descOverride;
  } else {
    if (state.info > 60 && state.polarization < 40) {
      finalTitle = "The Ideal Democracy";
      finalDesc =
        "You prioritized truth over clicks. Your platform isn't the most profitable, but the country is peaceful and informed.";
    } else if (state.info < 20 && state.engagement > 80) {
      finalTitle = "WhatsApp University Dean";
      finalDesc =
        "Your users are addicted but completely misinformed. You are rich, but society is dumber.";
    } else if (state.polarization > 70) {
      finalTitle = "Chaos Agent";
      finalDesc =
        "You amplified hate for engagement. The platform is booming, but neighbors are fighting in the streets.";
    } else {
      finalTitle = "Average Social Media";
      finalDesc =
        "A mix of cat videos, slight outrage, and occasional news. Nothing changed much.";
    }
  }
  
  if(title) title.innerText = finalTitle;
  if(desc) desc.innerText = finalDesc;

  const modalEl = document.getElementById("game-over-modal");
  if (modalEl) {
    modalEl.classList.add("active");
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") handleChoice("bury");
  if (e.key === "ArrowRight") handleChoice("boost");
});

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

// Expose functions to global scope for button clicks
window.handleChoice = handleChoice;
window.initGame = initGame;
