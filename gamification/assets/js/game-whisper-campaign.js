// --- GAME CONFIG ---
const TARGET_SCORE = 60; // 60% is a landslide in a hostile district
const INITIAL_DAYS = 14; // Increased time
const INITIAL_INF = 180; // Increased budget

// --- INDIAN CONTEXT NARRATIVES (POOL) ---
const NARRATIVE_POOL = [
  {
    title: "Free Electricity Promise",
    type: "Freebie",
    cost: 40,
    power: 25,
    vir: 0.9,
    desc: "Promise 200 units free power.",
    hint: "High impact on poor/middle class.",
  },
  {
    title: "Temple/Mosque Renovation Fund",
    type: "Culture",
    cost: 30,
    power: 15,
    vir: 0.7,
    desc: "Donation drive for local temple/mosque.",
    hint: "Flips Traditionalists.",
  },
  {
    title: "Metro Extension Plan",
    type: "Policy",
    cost: 25,
    power: 10,
    vir: 0.4,
    desc: "Map of new metro lines.",
    hint: "Good for RWA/Students.",
  },
  {
    title: "Scandal: Non-Veg Tuesday",
    type: "Scandal",
    cost: 20,
    power: 12,
    vir: 0.8,
    desc: "Opponent ate chicken on holy day.",
    hint: "Cheap, high viral spread.",
  },
  {
    title: "Deepfake: Corruption Audio",
    type: "Scandal",
    cost: 60,
    power: 40,
    vir: 0.95,
    desc: "AI audio of opponent taking bribes.",
    hint: "Expensive but devastating.",
  },
  {
    title: "Cricket Match Screening",
    type: "Culture",
    cost: 15,
    power: 5,
    vir: 0.5,
    desc: "Free screening of India vs Pak.",
    hint: "Low impact, creates goodwill.",
  },
  {
    title: "Army Border Standoff",
    type: "Culture",
    cost: 35,
    power: 20,
    vir: 0.8,
    desc: "Rally to support our troops.",
    hint: "Universal appeal.",
  },
  {
    title: "Water Tanker Scam",
    type: "Scandal",
    cost: 30,
    power: 18,
    vir: 0.7,
    desc: "Expose water mafia links.",
    hint: "Effective in Slums/RWA.",
  },
  {
    title: "Scholarship Scheme",
    type: "Policy",
    cost: 20,
    power: 15,
    vir: 0.3,
    desc: "Tablets for toppers.",
    hint: "Students love this.",
  },
  {
    title: "Foreign Conspiracy",
    type: "Rumor",
    cost: 25,
    power: 10,
    vir: 0.9,
    desc: "Opponent funded by enemies.",
    hint: "WhatsApp favorites.",
  },
  {
    title: "Road Repair Blitz",
    type: "Policy",
    cost: 35,
    power: 15,
    vir: 0.5,
    desc: "Fix potholes overnight.",
    hint: "Auto Unions/RWA.",
  },
  {
    title: "Festival Bonus",
    type: "Freebie",
    cost: 50,
    power: 30,
    vir: 0.8,
    desc: "Cash transfer before Diwali.",
    hint: "Massive sway.",
  },
];

// --- NODES (ALL HOSTILE START) ---
// opinion: Starts very low (10-25)
// resist: 0.1 (Gullible) to 0.9 (Stubborn)
let NODES = [
  {
    id: "rwa",
    label: "RWA Uncles",
    x: 0.2,
    y: 0.17,
    opinion: 15,
    resist: 0.6,
  },
  {
    id: "kitty",
    label: "Kitty Party",
    x: 0.8,
    y: 0.17,
    opinion: 20,
    resist: 0.4,
  },
  {
    id: "students",
    label: "Student Union",
    x: 0.2,
    y: 0.67,
    opinion: 25,
    resist: 0.15,
  }, // Beachhead opportunity
  {
    id: "traders",
    label: "Traders Assoc",
    x: 0.8,
    y: 0.67,
    opinion: 10,
    resist: 0.7,
  },
  {
    id: "slum",
    label: "Slum Leaders",
    x: 0.5,
    y: 0.77,
    opinion: 20,
    resist: 0.1,
  }, // Beachhead opportunity
  {
    id: "auto",
    label: "Auto Union",
    x: 0.5,
    y: 0.47,
    opinion: 15,
    resist: 0.3,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Grp",
    x: 0.5,
    y: 0.17,
    opinion: 15,
    resist: 0.1,
  },
];

// --- EDGES ---
const LINKS = [
  { src: "rwa", tgt: "whatsapp" },
  { src: "kitty", tgt: "whatsapp" },
  { src: "rwa", tgt: "traders" },
  { src: "traders", tgt: "auto" },
  { src: "students", tgt: "auto" },
  { src: "slum", tgt: "auto" },
  { src: "students", tgt: "whatsapp" },
  { src: "kitty", tgt: "traders" },
];

// --- STATE ---
let state = {
  days: INITIAL_DAYS,
  influence: INITIAL_INF,
  dailyOptions: [],
  selectedNar: null,
  activeSpreading: false,
};

// --- SVG ENGINE ---
function initViz() {
  const linkLayer = document.getElementById('link-layer');
  const nodeLayer = document.getElementById('node-layer');
  
  // Clear existing
  linkLayer.innerHTML = '';
  nodeLayer.innerHTML = '';

  // 1. Draw Links
  // We use a fixed coordinate system (800x450) defined in viewBox
  const width = 800;
  const height = 450;

  // Helper to scale 0-1 coords to SVG coords
  const getX = (val) => val * width;
  const getY = (val) => val * height;

  // Draw connections
  LINKS.forEach((l) => {
    const s = NODES.find((n) => n.id === l.src);
    const t = NODES.find((n) => n.id === l.tgt);
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", getX(s.x));
    line.setAttribute("y1", getY(s.y));
    line.setAttribute("x2", getX(t.x));
    line.setAttribute("y2", getY(t.y));
    line.setAttribute("class", "link");
    // Store IDs for easy access during updates if needed, or just redraw
    // For simple updates, we can just re-render or update attributes. 
    // Let's give them IDs based on source-target
    line.id = `link-${l.src}-${l.tgt}`;
    linkLayer.appendChild(line);
  });

  // 2. Draw Nodes
  NODES.forEach((node, i) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", getX(node.x));
    circle.setAttribute("cy", getY(node.y));
    circle.setAttribute("r", 45); // Fixed radius in SVG units
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("id", `node-circle-${node.id}`);
    g.appendChild(circle);

    // Label (Name)
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", getX(node.x));
    label.setAttribute("y", getY(node.y)); // Center
    label.setAttribute("class", "node-label");
    
    // Simple text wrapping logic for SVG
    const words = node.label.split(' ');
    if(words.length > 1) {
        const tspan1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan1.textContent = words[0];
        tspan1.setAttribute("x", getX(node.x));
        tspan1.setAttribute("dy", "-0.4em");
        
        const tspan2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan2.textContent = words.slice(1).join(' ');
        tspan2.setAttribute("x", getX(node.x));
        tspan2.setAttribute("dy", "1.2em");
        
        label.appendChild(tspan1);
        label.appendChild(tspan2);
    } else {
        label.textContent = node.label;
    }
    g.appendChild(label);

    // Percentage Text (Below node)
    const percent = document.createElementNS("http://www.w3.org/2000/svg", "text");
    percent.setAttribute("x", getX(node.x));
    percent.setAttribute("y", getY(node.y) + 65); // Offset below circle
    percent.setAttribute("class", "node-percent");
    percent.setAttribute("id", `node-percent-${node.id}`);
    percent.textContent = Math.round(node.opinion) + "%";
    g.appendChild(percent);

    nodeLayer.appendChild(g);
  });
}

function updateViz() {
  // Update Links (Active Flow)
  LINKS.forEach((l) => {
    const s = NODES.find((n) => n.id === l.src);
    const t = NODES.find((n) => n.id === l.tgt);
    const line = document.getElementById(`link-${l.src}-${l.tgt}`);
    
    if (line) {
      if (s.infected && t.infected) {
        line.style.stroke = "#d4a017"; // Active Flow (Gold)
        line.style.strokeDasharray = "5, 5";
      } else {
        line.style.stroke = "#cbd5e1"; // Slate 300
        line.style.strokeDasharray = "none";
      }
    }
  });

  // Update Nodes
  NODES.forEach((node) => {
    const circle = document.getElementById(`node-circle-${node.id}`);
    const percent = document.getElementById(`node-percent-${node.id}`);
    
    if (circle && percent) {
      // Update Color
      circle.style.fill = getOpinionColor(node.opinion);
      
      // Border for infected
      if (node.infected) {
        circle.style.stroke = "#d4a017";
        circle.style.strokeWidth = "4px";
      } else {
        circle.style.stroke = "#fff";
        circle.style.strokeWidth = "2px";
      }

      // Update Text
      percent.textContent = Math.round(node.opinion) + "%";
    }
  });
}

function initGame() {
    // Initial render
    rollDailyNarratives();
    renderTargets();
    updateStats();
    initViz();
    updateViz();

    // Event Listeners
    document.getElementById("btn-plant").addEventListener("click", plantNarrative);
}

function startGame() {
  document.getElementById("start-modal").classList.remove("active");
}

function getOpinionColor(val) {
  if (val < 40) return "#ef4444"; // Hostile (Red)
  if (val > 60) return "#0f172a"; // Loyal (Navy/Slate)
  return "#64748b"; // Neutral (Slate 500)
}

// --- LOGIC ---

function rollDailyNarratives() {
  state.dailyOptions = [];
  let pool = [...NARRATIVE_POOL];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    state.dailyOptions.push(pool[idx]);
    pool.splice(idx, 1);
  }
  renderNarratives();
}

function selectNarrative(idx) {
  if (state.activeSpreading) return;
  state.selectedNar = state.dailyOptions[idx];

  document
    .querySelectorAll(".narrative-opt")
    .forEach((el) => el.classList.remove("selected"));
  const card = document.getElementById(`nar-card-${idx}`);
  if(card) card.classList.add("selected");

  checkButton();
}

function checkButton() {
  const btn = document.getElementById("btn-plant");
  if (state.selectedNar && state.influence >= state.selectedNar.cost) {
    btn.disabled = false;
    btn.innerText = `Plant Info (-${state.selectedNar.cost} Inf)`;
  } else {
    btn.disabled = true;
    btn.innerText = state.selectedNar
      ? "Not Enough Influence"
      : "Select Narrative";
  }
}

function plantNarrative() {
  const targetId = document.getElementById("target-select").value;
  const target = NODES.find((n) => n.id === targetId);

  state.influence -= state.selectedNar.cost;
  state.days--;

  target.infected = true;
  target.virus = state.selectedNar;

  startSimulation();
}

function startSimulation() {
  state.activeSpreading = true;
  document.getElementById("btn-plant").disabled = true;

  let ticks = 0;
  const maxTicks = 6;

  const interval = setInterval(() => {
    ticks++;

    NODES.forEach((n) => {
      let neighbors = [];
      LINKS.forEach((l) => {
        if (l.src === n.id)
          neighbors.push(NODES.find((x) => x.id === l.tgt));
        if (l.tgt === n.id)
          neighbors.push(NODES.find((x) => x.id === l.src));
      });

      let neighborSupport =
        neighbors.reduce((sum, nb) => sum + nb.opinion, 0) /
        (neighbors.length || 1);

      // --- HOSTILE DYNAMICS ---
      // If neighbors are hostile, resistance INCREASES.
      // If neighbors are loyal, resistance DECREASES (Peer Pressure).
      let dynamicResist = n.resist;
      if (neighborSupport > 55) dynamicResist -= 0.15;
      if (neighborSupport < 30) dynamicResist += 0.1;

      if (n.infected) {
        const boost = n.virus.power * (1 - Math.max(0, dynamicResist));
        n.opinion = Math.min(100, n.opinion + boost / 3);

        neighbors.forEach((nb) => {
          if (!nb.infected) {
            let chance =
              n.virus.vir - nb.resist + (neighborSupport > 50 ? 0.2 : 0);
            if (Math.random() < chance) {
              nb.infected = true;
              nb.virus = n.virus;
            }
          }
        });
      }
    });

    updateViz();
    updateStats();

    if (ticks >= maxTicks) {
      clearInterval(interval);
      endTurn();
    }
  }, 400);
}

function endTurn() {
  state.activeSpreading = false;
  NODES.forEach((n) => {
    n.infected = false;
    n.virus = null;
  });
  updateViz();

  checkWinLoss();
  rollDailyNarratives();
  state.selectedNar = null;
  checkButton();
}

function getAvgOpinion() {
  return Math.round(
    NODES.reduce((a, b) => a + b.opinion, 0) / NODES.length
  );
}

function updateStats() {
  const avg = getAvgOpinion();
  const opEl = document.getElementById("val-opinion");
  opEl.innerText = `${avg}%`;

  // Gradient background for Opinion stat box
  const opBox = opEl.closest('.stat-box');
  if (opBox) {
    // Use a subtle slate gradient
    opBox.style.background = `linear-gradient(to top, #e2e8f0 ${avg}%, #ffffff ${avg}%)`;
  }

  document.getElementById("val-influence").innerText = state.influence;
  document.getElementById("val-days").innerText = state.days;

  if (avg >= TARGET_SCORE) opEl.style.color = "var(--success)";
  else if (avg < 40) opEl.style.color = "var(--danger)";
  else opEl.style.color = "var(--text-main)";
}

function checkWinLoss() {
  const avg = getAvgOpinion();
  if (state.days <= 0 || state.influence < 15) {
    let title = "Election Result";
    let msg = "";
    let color = "";

    if (avg >= 85) {
      title = "DICTATORSHIP";
      msg = "Total Control. Opposition eliminated.";
      color = "var(--accent)";
    } else if (avg >= 60) {
      title = "VICTORY";
      msg = "You hijacked the election against all odds.";
      color = "var(--success)";
    } else {
      title = "DEFEAT";
      msg = "The incumbent crushed your rebellion.";
      color = "var(--danger)";
    }

    const m = document.getElementById("end-modal");
    const t = document.getElementById("end-title");
    t.innerText = title;
    t.style.color = color;
    document.getElementById(
      "end-desc"
    ).innerText = `${msg} Final Support: ${avg}%`;
    m.classList.add("active");
  }
}

// --- RENDERING ---
function renderNarratives() {
  const list = document.getElementById("narrative-list");
  list.innerHTML = "";
  state.dailyOptions.forEach((n, idx) => {
    const el = document.createElement("div");
    
    // Determine type for styling
    let typeSuffix = 
      n.type === "Rumor" || n.type === "Scandal"
        ? "rumor"
        : n.type === "Policy"
        ? "policy"
        : "culture";

    el.className = `narrative-opt opt-${typeSuffix}`;
    el.id = `nar-card-${idx}`;

    let tagClass = `tag-${typeSuffix}`;

    el.innerHTML = `
          <div class="nar-title">${n.title}</div>
          <div class="nar-cost-row">
            <span class="nar-cost">${n.cost} Inf</span>
          </div>
          <div class="nar-desc">${n.desc}</div>
          <div class="nar-tag-row">
            <span class="nar-tag ${tagClass}">${n.type}</span>
          </div>
          <div class="nar-hint">${n.hint}</div>
      `;
    el.onclick = () => selectNarrative(idx);
    list.appendChild(el);
  });
}

function renderTargets() {
  const sel = document.getElementById("target-select");
  sel.innerHTML = "";
  NODES.forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n.id;
    opt.innerText = `${n.label} (Current: ${Math.round(n.opinion)}%)`;
    sel.appendChild(opt);
  });
}

// Initialize on load
window.addEventListener('load', initGame);
