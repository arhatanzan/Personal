const TARGET_SCORE = 60;
const INITIAL_DAYS = 14;
const INITIAL_INF = 180;

const NARRATIVE_POOL = [
  { title: "Free Electricity Promise", type: "Freebie", cost:40, power:25, vir:0.9, desc:"Promise 200 units free power.", hint:"High impact on poor/middle class." },
  { title: "Temple/Mosque Renovation Fund", type:"Culture", cost:30, power:15, vir:0.7, desc:"Donation drive for local temple/mosque.", hint:"Flips Traditionalists." },
  { title: "Metro Extension Plan", type:"Policy", cost:25, power:10, vir:0.4, desc:"Map of new metro lines.", hint:"Good for RWA/Students." },
  { title: "Scandal: Non-Veg Tuesday", type:"Scandal", cost:20, power:12, vir:0.8, desc:"Opponent ate chicken on holy day.", hint:"Cheap, high viral spread." },
  { title: "Deepfake: Corruption Audio", type:"Scandal", cost:60, power:40, vir:0.95, desc:"AI audio of opponent taking bribes.", hint:"Expensive but devastating." },
  { title: "Cricket Match Screening", type:"Culture", cost:15, power:5, vir:0.5, desc:"Free screening of India vs Pak.", hint:"Low impact, creates goodwill." },
  { title: "Army Border Standoff", type:"Culture", cost:35, power:20, vir:0.8, desc:"Rally to support our troops.", hint:"Universal appeal." },
  { title: "Water Tanker Scam", type:"Scandal", cost:30, power:18, vir:0.7, desc:"Expose water mafia links.", hint:"Effective in Slums/RWA." },
  { title: "Scholarship Scheme", type:"Policy", cost:20, power:15, vir:0.3, desc:"Tablets for toppers.", hint:"Students love this." },
  { title: "Foreign Conspiracy", type:"Rumor", cost:25, power:10, vir:0.9, desc:"Opponent funded by enemies.", hint:"WhatsApp favorites." },
  { title: "Road Repair Blitz", type:"Policy", cost:35, power:15, vir:0.5, desc:"Fix potholes overnight.", hint:"Auto Unions/RWA." },
  { title: "Festival Bonus", type:"Freebie", cost:50, power:30, vir:0.8, desc:"Cash transfer before Diwali.", hint:"Massive sway." },
];

let NODES = [
  { id: "rwa", label: "RWA Uncles", x:0.2, y:0.2, opinion:15, resist:0.6 },
  { id: "kitty", label: "Kitty Party", x:0.8, y:0.2, opinion:20, resist:0.4 },
  { id: "students", label: "Student Union", x:0.2, y:0.8, opinion:25, resist:0.15 },
  { id: "traders", label: "Traders Assoc", x:0.8, y:0.8, opinion:10, resist:0.7 },
  { id: "slum", label: "Slum Leaders", x:0.5, y:0.9, opinion:20, resist:0.1 },
  { id: "auto", label: "Auto Union", x:0.5, y:0.5, opinion:15, resist:0.3 },
  { id: "whatsapp", label: "WhatsApp Grp", x:0.5, y:0.2, opinion:15, resist:0.1 },
];

const LINKS = [ { src:"rwa", tgt:"whatsapp" }, { src:"kitty", tgt:"whatsapp" }, { src:"rwa", tgt:"traders" }, { src:"traders", tgt:"auto" }, { src:"students", tgt:"auto" }, { src:"slum", tgt:"auto" }, { src:"students", tgt:"whatsapp" }, { src:"kitty", tgt:"traders" } ];

let state = { days: INITIAL_DAYS, influence: INITIAL_INF, dailyOptions: [], selectedNar: null, activeSpreading: false };

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

function startGame() { document.getElementById("start-modal").classList.remove("active"); rollDailyNarratives(); renderTargets(); updateStats(); resize(); draw(); }

function resize() {
  const wrap = document.getElementById("viz-wrapper");
  const controls = document.querySelector('.controls-container');
  if (window.innerWidth >= 768 && controls) {
    let desired = controls.clientHeight; const minH = 300; const maxH = Math.floor(window.innerHeight * 0.8); desired = Math.min(Math.max(desired, minH), maxH); wrap.style.height = desired + 'px';
  } else { wrap.style.height = ''; }
  const dpr = window.devicePixelRatio || 1; ctx.setTransform(1,0,0,1,0,0);
  canvas.width = wrap.clientWidth * dpr; canvas.height = wrap.clientHeight * dpr; ctx.scale(dpr, dpr); draw();
}
window.addEventListener("resize", resize); window.addEventListener("load", resize);

function draw() {
  const w = canvas.width / (window.devicePixelRatio || 1); const h = canvas.height / (window.devicePixelRatio || 1); ctx.clearRect(0,0,w,h);
  ctx.lineWidth = 2; LINKS.forEach(l => { const s = NODES.find(n=>n.id===l.src); const t = NODES.find(n=>n.id===l.tgt); ctx.beginPath(); ctx.moveTo(s.x * w, s.y * h); ctx.lineTo(t.x * w, t.y * h); if (s.infected && t.infected) { ctx.strokeStyle = "#d4a017"; ctx.setLineDash([5,5]); } else { ctx.strokeStyle = "#d1d5db"; ctx.setLineDash([]); } ctx.stroke(); });
  NODES.forEach(n => { const nx = n.x * w; const ny = n.y * h; const r = w < 400 ? 35 : 45; ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI*2); ctx.fillStyle = getOpinionColor(n.opinion); ctx.fill(); ctx.lineWidth = n.infected ? 4 : 2; ctx.strokeStyle = n.infected ? "#d4a017" : "#fff"; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; const fontSize = w < 400 ? 10 : 11; ctx.font = `bold ${fontSize}px sans-serif`; drawText(ctx, n.label, nx, ny, r * 1.8, fontSize * 1.1); ctx.fillStyle = "#0a2342"; ctx.font = `bold ${fontSize}px sans-serif`; ctx.fillText(`${Math.round(n.opinion)}%`, nx, ny + r + 14); });
}

function drawText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" "); let lines = []; let currentLine = words[0]; for (let i=1;i<words.length;i++){ let word = words[i]; let width = ctx.measureText(currentLine + " " + word).width; if (width < maxWidth) currentLine += " " + word; else { lines.push(currentLine); currentLine = word; } } lines.push(currentLine); let startY = y - ((lines.length -1) * lineHeight) / 2; lines.forEach((line,i)=>{ ctx.fillText(line, x, startY + i * lineHeight); });
}

function getOpinionColor(val) { if (val < 40) return "#7a2e2e"; if (val > 60) return "#0a2342"; return "#5a6673"; }

function rollDailyNarratives() { state.dailyOptions = []; let pool = [...NARRATIVE_POOL]; for (let i=0;i<3;i++){ const idx = Math.floor(Math.random()*pool.length); state.dailyOptions.push(pool[idx]); pool.splice(idx,1); } renderNarratives(); }

function selectNarrative(idx) { if (state.activeSpreading) return; state.selectedNar = state.dailyOptions[idx]; document.querySelectorAll(".narrative-opt").forEach(el=>el.classList.remove("selected")); document.getElementById(`nar-card-${idx}`).classList.add("selected"); checkButton(); }

function checkButton() { const btn = document.getElementById("btn-plant"); if (state.selectedNar && state.influence >= state.selectedNar.cost) { btn.disabled = false; btn.innerText = `Plant Info (-${state.selectedNar.cost} Inf)`; } else { btn.disabled = true; btn.innerText = state.selectedNar ? "Not Enough Influence" : "Select Narrative"; } }

document.getElementById("btn-plant").addEventListener("click", ()=>{
  const targetId = document.getElementById("target-select").value; const target = NODES.find(n=>n.id===targetId); state.influence -= state.selectedNar.cost; state.days--; target.infected = true; target.virus = state.selectedNar; startSimulation();
});

function startSimulation(){ state.activeSpreading = true; document.getElementById("btn-plant").disabled = true; let ticks = 0; const maxTicks = 6; const interval = setInterval(()=>{ ticks++; NODES.forEach(n=>{ let neighbors = []; LINKS.forEach(l=>{ if (l.src===n.id) neighbors.push(NODES.find(x=>x.id===l.tgt)); if (l.tgt===n.id) neighbors.push(NODES.find(x=>x.id===l.src)); }); let neighborSupport = neighbors.reduce((sum,nb)=>sum+nb.opinion,0)/(neighbors.length||1); let dynamicResist = n.resist; if (neighborSupport > 55) dynamicResist -= 0.15; if (neighborSupport < 30) dynamicResist += 0.1; if (n.infected) { const boost = n.virus.power * (1 - Math.max(0, dynamicResist)); n.opinion = Math.min(100, n.opinion + boost/3); neighbors.forEach(nb => { if (!nb.infected) { let chance = n.virus.vir - nb.resist + (neighborSupport > 50 ? 0.2 : 0); if (Math.random() < chance) { nb.infected = true; nb.virus = n.virus; } } }); } }); draw(); updateStats(); if (ticks >= maxTicks) { clearInterval(interval); endTurn(); } }, 400); }

function endTurn(){ state.activeSpreading = false; NODES.forEach(n=>{ n.infected = false; n.virus = null; }); draw(); checkWinLoss(); rollDailyNarratives(); state.selectedNar = null; checkButton(); }

function getAvgOpinion(){ return Math.round(NODES.reduce((a,b)=>a+b.opinion,0)/NODES.length); }

function updateStats(){ const avg = getAvgOpinion(); document.getElementById("val-opinion").innerText = `${avg}%`; document.getElementById("val-influence").innerText = state.influence; document.getElementById("val-days").innerText = state.days; const opEl = document.getElementById("val-opinion"); if (avg >= TARGET_SCORE) opEl.style.color = "var(--success)"; else if (avg < 40) opEl.style.color = "var(--danger)"; else opEl.style.color = "var(--text-main)"; }

function checkWinLoss(){ const avg = getAvgOpinion(); if (state.days <= 0 || state.influence < 15) { let title = "Election Result"; let msg = ""; let color = ""; if (avg >= 85) { title = "DICTATORSHIP"; msg = "Total Control. Opposition eliminated."; color = "var(--accent)"; } else if (avg >= 60) { title = "VICTORY"; msg = "You hijacked the election against all odds."; color = "var(--success)"; } else { title = "DEFEAT"; msg = "The incumbent crushed your rebellion."; color = "var(--danger)"; } const m = document.getElementById("end-modal"); const t = document.getElementById("end-title"); t.innerText = title; t.style.color = color; document.getElementById("end-desc").innerText = `${msg} Final Support: ${avg}%`; m.classList.add("active"); } }

function renderNarratives(){ const list = document.getElementById("narrative-list"); list.innerHTML = ""; state.dailyOptions.forEach((n, idx)=>{ const el = document.createElement("div"); el.className = "narrative-opt"; el.id = `nar-card-${idx}`; let tagClass = n.type === "Rumor" || n.type === "Scandal" ? "tag-rumor" : n.type === "Policy" ? "tag-policy" : "tag-culture"; el.innerHTML = `<div class="nar-top"><span>${n.title}</span><span class="nar-cost">${n.cost} Inf</span></div><div class="nar-desc">${n.desc}</div><span class="nar-tag ${tagClass}">${n.type}</span><span style="font-size:0.65rem; color:var(--text-light)">${n.hint}</span>`; el.onclick = () => selectNarrative(idx); list.appendChild(el); }); }

function renderTargets(){ const sel = document.getElementById("target-select"); sel.innerHTML = ""; NODES.forEach(n=>{ const opt = document.createElement("option"); opt.value = n.id; opt.innerText = `${n.label} (Current: ${Math.round(n.opinion)}%)`; sel.appendChild(opt); }); }

function sendHeight(){ const height = document.body.scrollHeight; parent.postMessage({ type: "resizeIframe", height: height }, "*"); }
window.addEventListener("load", sendHeight); if ("ResizeObserver" in window) { new ResizeObserver(sendHeight).observe(document.body); }
