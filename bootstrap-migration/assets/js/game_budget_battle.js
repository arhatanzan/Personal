// --- CONFIG ---
let currentBudget = 100;
let corruptionRisk = 0;
const MAX_SLIDER = 60;

const DEALS = [
  { id: "builder", title: "Sell Park", gain: 30, risk: 25 },
  { id: "water", title: "Privatize Water", gain: 25, risk: 20 },
  { id: "corp", title: "Corp Donation", gain: 15, risk: 15 },
  { id: "data", title: "Sell Data", gain: 10, risk: 10 },
];

const SECTORS = [
  {
    id: "roads",
    icon: "🚧",
    name: "Infra & Roads",
    demand: 40,
    current: 20,
    reactions: {
      low: "RWA: 'Fix the potholes first!'",
      high: "Contractors: 'Excellent work sir.'",
    },
  },
  {
    id: "police",
    icon: "👮",
    name: "Police",
    demand: 35,
    current: 10,
    reactions: {
      low: "Media: 'City unsafe at night.'",
      high: "DGP: 'Force modernization on track.'",
    },
  },
  {
    id: "water",
    icon: "💧",
    name: "Water",
    demand: 30,
    current: 20,
    reactions: {
      low: "Slums: 'Water tanker mafia rules.'",
      high: "Public: 'Clean water for all!'",
    },
  },
  {
    id: "health",
    icon: "🏥",
    name: "Health",
    demand: 30,
    current: 20,
    reactions: {
      low: "Docs: 'No oxygen in clinics.'",
      high: "Union: 'Best healthcare in state.'",
    },
  },
  {
    id: "school",
    icon: "🎓",
    name: "Education",
    demand: 25,
    current: 20,
    reactions: {
      low: "Parents: 'School roof leaking.'",
      high: "Teachers: 'Digital classrooms approved.'",
    },
  },
];

function init() {
  renderDeals();
  renderSectors();
  calculateStats();
}

function renderDeals() {
  const c = document.getElementById("deals-container");
  DEALS.forEach((d) => {
    const wrapper = document.createElement("div");
    wrapper.className = "col-6 col-md-3";

    const b = document.createElement("button");
    b.className = "deal-btn w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2";
    b.id = `btn-${d.id}`;
    b.innerHTML = `<span class="deal-money">+₹${d.gain}Cr</span>${d.title}`;
    b.onclick = () => takeDeal(d);
    
    wrapper.appendChild(b);
    c.appendChild(wrapper);
  });
}

function takeDeal(d) {
  const btn = document.getElementById(`btn-${d.id}`);
  if (btn.classList.contains("taken")) return;

  currentBudget += d.gain;
  corruptionRisk += d.risk;
  btn.classList.add("taken");
  // Removed innerHTML overwrite to allow CSS ::after to handle the stamp

  const box = document.getElementById("reaction-box");
  box.innerText = `SECRET: Took money from ${d.title}. Risk up!`;
  box.className = "reaction-bar angry";

  calculateStats();
}

function renderSectors() {
  const grid = document.getElementById("sectors-grid");
  SECTORS.forEach((s, idx) => {
    const col = document.createElement("div");
    col.className = "col-12"; 

    const card = document.createElement("div");
    card.className = "sector-card h-100 p-2";

    // Calculate marker percentage
    const markerPos = (s.demand / MAX_SLIDER) * 100;

    // Refactored to use Bootstrap Grid for responsiveness instead of custom flex/order hacks
    card.innerHTML = `
          <div class="row align-items-center g-2">
              <!-- Name: Left on Desktop, Top-Left on Mobile -->
              <div class="col-6 col-md-3 order-1 order-md-1 d-flex align-items-center gap-2 fw-bold small">
                  ${s.icon} ${s.name}
              </div>
              
              <!-- Value: Right on Desktop, Top-Right on Mobile -->
              <div class="col-6 col-md-2 order-2 order-md-3 text-end fw-bold fs-6">
                  <span id="disp-${idx}">₹${s.current} Cr</span>
              </div>

              <!-- Slider: Middle on Desktop, Bottom on Mobile -->
              <div class="col-12 col-md-7 order-3 order-md-2">
                  <div class="slider-wrap position-relative w-100">
                      <div class="demand-marker" style="left: ${markerPos}%">
                          <span class="demand-label">Demand: ${s.demand}</span>
                      </div>
                      <input type="range" min="0" max="${MAX_SLIDER}" value="${s.current}" 
                          oninput="updateSector(${idx}, this.value)">
                  </div>
              </div>
          </div>
      `;
    col.appendChild(card);
    grid.appendChild(col);
  });
}

function updateSector(idx, val) {
  SECTORS[idx].current = parseInt(val);
  document.getElementById(`disp-${idx}`).innerText = `₹${val} Cr`;

  const s = SECTORS[idx];
  const box = document.getElementById("reaction-box");

  if (s.current < s.demand - 5) {
    box.innerText = s.reactions.low;
    box.className = "reaction-bar angry";
  } else if (s.current >= s.demand) {
    box.innerText = s.reactions.high;
    box.className = "reaction-bar happy";
  } else {
    box.innerText = "Stakeholders are watching closely...";
    box.className = "reaction-bar";
  }

  calculateStats();
}

function calculateStats() {
  const used = SECTORS.reduce((acc, s) => acc + s.current, 0);
  const left = currentBudget - used;

  const fundEl = document.getElementById("val-funds");
  fundEl.innerText = `₹${left} Cr`;

  const btn = document.getElementById("btn-submit");
  if (left < 0) {
    fundEl.classList.add("negative");
    btn.innerText = "Over Budget!";
    btn.disabled = true;
  } else {
    fundEl.classList.remove("negative");
    btn.innerText = "Finalize Budget";
    btn.disabled = false;
  }

  // Approval Calculation
  let app = 30;
  SECTORS.forEach((s) => {
    if (s.current >= s.demand) app += 10;
    else if (s.demand - s.current < 10) app += 5;
  });

  app -= corruptionRisk * 0.2;
  app = Math.min(100, Math.max(0, Math.floor(app)));

  document.getElementById("val-approval").innerText = `${app}%`;

  // Risk Meter
  document.getElementById("val-risk").style.width = `${corruptionRisk}%`;
  const rTxt = document.getElementById("risk-text");
  if (corruptionRisk > 50) {
    rTxt.innerText = "HIGH RISK";
    rTxt.style.color = "var(--danger)";
  } else {
    rTxt.innerText = "Safe";
    rTxt.style.color = "var(--text-light)";
  }
}

function finalizeBudget() {
  // Use Bootstrap 5 Modal API
  const modalEl = document.getElementById("end-modal");
  const modal = new bootstrap.Modal(modalEl);
  
  const t = document.getElementById("end-title");
  const d = document.getElementById("end-desc");
  const app = document.getElementById("val-approval").innerText;

  modal.show();

  // Chance of Scandal based on Risk
  if (Math.random() * 100 < corruptionRisk) {
    t.innerText = "SCANDAL EXPOSED!";
    t.style.color = "var(--danger)";
    d.innerHTML = `
          <strong>Breaking News:</strong> A whistleblower leaked details of your secret deals.
          <br><br>
          Public trust has collapsed. You are forced to resign.
          <br><br>
          <small>Lesson: Corruption is a shortcut to a dead end.</small>
      `;
  } else if (parseInt(app) >= 60) {
    t.innerText = "RE-ELECTED!";
    t.style.color = "var(--success)";
    d.innerHTML = `
          You balanced the budget and kept the city running.
          <br><br>
          <strong>Final Approval: ${app}</strong>
          <br>
          (You survived the term!)
      `;
  } else {
    t.innerText = "DEFEATED";
    t.style.color = "#d4a017";
    d.innerHTML = `
          Voters are unhappy with the poor services.
          <br><br>
          <strong>Final Approval: ${app}</strong>
          <br>
          (You lost the election.)
      `;
  }
}

init();