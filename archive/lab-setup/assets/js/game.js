(function (w, d, helpers) {
  function createGame(config) {
    const cfg = Object.assign(
      {
        currentBudget: 100,
        MAX_SLIDER: 60,
        DEALS: [],
        SECTORS: [],
        ids: {
          dealsContainer: "deals-container",
          sectorsGrid: "sectors-grid",
          valFunds: "val-funds",
          valApproval: "val-approval",
          valRisk: "val-risk",
          riskText: "risk-text",
          reactionBox: "reaction-box",
          btnSubmit: "btn-submit",
          endModal: "end-modal",
          endTitle: "end-title",
          endDesc: "end-desc",
        },
      },
      config || {}
    );

    let corruptionRisk = 0;

    function $(id) {
      return d.getElementById(id);
    }

    function renderDeals() {
      const c = $(cfg.ids.dealsContainer);
      if (!c) return;
      c.innerHTML = "";
      cfg.DEALS.forEach((d) => {
        const b = d3create("button");
        b.className = "deal-btn";
        b.id = `btn-${d.id}`;
        b.innerHTML = `<span class="deal-money">+₹${d.gain}Cr</span>${escapeHtml(d.title)}`;
        b.onclick = () => takeDeal(d);
        c.appendChild(b);
      });
    }

    function d3create(t) {
      return d.createElement(t);
    }

    function escapeHtml(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    }

    function takeDeal(deal) {
      const btn = $(`btn-${deal.id}`);
      if (!btn || btn.classList.contains("taken")) return;
      cfg.currentBudget += deal.gain;
      corruptionRisk += deal.risk || 0;
      btn.classList.add("taken");
      btn.innerHTML = `<span style="font-size:1.2rem">🤝</span>Deal Signed`;
      const box = $(cfg.ids.reactionBox);
      if (box) {
        box.innerText = `SECRET: Took money from ${deal.title}. Risk up!`;
        box.className = "reaction-bar angry";
      }
      calculateStats();
    }

    function renderSectors() {
      const grid = $(cfg.ids.sectorsGrid);
      if (!grid) return;
      grid.innerHTML = "";
      cfg.SECTORS.forEach((s, idx) => {
        const card = d3create("div");
        card.className = "sector-card";
        const markerPos = (s.demand / cfg.MAX_SLIDER) * 100;
        card.innerHTML = `
          <div class="sector-top">
            <span class="sector-name">${escapeHtml(s.icon || "")} ${escapeHtml(s.name)}</span>
            <span class="sector-current" id="disp-${idx}">₹${s.current} Cr</span>
          </div>
          <div class="slider-wrap">
            <div class="demand-marker" style="left: ${markerPos}%">
              <span class="demand-label">Demand: ${s.demand}</span>
            </div>
            <input type="range" min="0" max="${cfg.MAX_SLIDER}" value="${s.current}" oninput="window.__GAME.updateSector(${idx}, this.value)">
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function updateSector(idx, val) {
      val = parseInt(val, 10);
      cfg.SECTORS[idx].current = val;
      const disp = d.getElementById(`disp-${idx}`);
      if (disp) disp.innerText = `₹${val} Cr`;
      const s = cfg.SECTORS[idx];
      const box = $(cfg.ids.reactionBox);
      if (s && box) {
        if (s.current < s.demand - 5) {
          box.innerText = s.reactions && s.reactions.low ? s.reactions.low : "Stakeholders upset";
          box.className = "reaction-bar angry";
        } else if (s.current >= s.demand) {
          box.innerText = s.reactions && s.reactions.high ? s.reactions.high : "Stakeholders pleased";
          box.className = "reaction-bar happy";
        } else {
          box.innerText = "Stakeholders are watching closely...";
          box.className = "reaction-bar";
        }
      }
      calculateStats();
    }

    function calculateStats() {
      const used = cfg.SECTORS.reduce((acc, s) => acc + (s.current || 0), 0);
      const left = cfg.currentBudget - used;
      const fundEl = $(cfg.ids.valFunds);
      if (fundEl) fundEl.innerText = `₹${left} Cr`;
      const btn = $(cfg.ids.btnSubmit);
      if (left < 0) {
        fundEl && fundEl.classList.add("negative");
        if (btn) { btn.innerText = "Over Budget!"; btn.disabled = true; }
      } else {
        fundEl && fundEl.classList.remove("negative");
        if (btn) { btn.innerText = "Finalize Budget"; btn.disabled = false; }
      }
      let app = 30;
      cfg.SECTORS.forEach((s) => {
        if ((s.current || 0) >= (s.demand || 0)) app += 10;
        else if ((s.demand || 0) - (s.current || 0) < 10) app += 5;
      });
      app -= corruptionRisk * 0.2;
      app = Math.min(100, Math.max(0, Math.floor(app)));
      const appEl = $(cfg.ids.valApproval);
      if (appEl) appEl.innerText = `${app}%`;
      const riskFill = $(cfg.ids.valRisk);
      if (riskFill) riskFill.style.width = `${corruptionRisk}%`;
      const rTxt = $(cfg.ids.riskText);
      if (rTxt) {
        if (corruptionRisk > 50) { rTxt.innerText = "HIGH RISK"; rTxt.style.color = "var(--danger)"; }
        else { rTxt.innerText = "Safe"; rTxt.style.color = "var(--text-light)"; }
      }
    }

    function finalizeBudget() {
      const modal = $(cfg.ids.endModal);
      const t = $(cfg.ids.endTitle);
      const dsc = $(cfg.ids.endDesc);
      const app = $(cfg.ids.valApproval) && $(cfg.ids.valApproval).innerText;
      if (modal) modal.classList.add("active");
      if (Math.random() * 100 < corruptionRisk) {
        if (t) { t.innerText = "SCANDAL EXPOSED!"; t.style.color = "var(--danger)"; }
        if (dsc) dsc.innerHTML = `<strong>Breaking News:</strong> A whistleblower leaked details of your secret deals.<br><br>Public trust has collapsed. You are forced to resign.<br><br><small>Lesson: Corruption is a shortcut to a dead end.</small>`;
      } else if (parseInt(app) >= 60) {
        if (t) { t.innerText = "RE-ELECTED!"; t.style.color = "var(--success)"; }
        if (dsc) dsc.innerHTML = `You balanced the budget and kept the city running.<br><br><strong>Final Approval: ${app}</strong><br>(You survived the term!)`;
      } else {
        if (t) { t.innerText = "DEFEATED"; t.style.color = "#d4a017"; }
        if (dsc) dsc.innerHTML = `Voters are unhappy with the poor services.<br><br><strong>Final Approval: ${app}</strong><br>(You lost the election.)`;
      }
    }

    function init() {
      renderDeals();
      renderSectors();
      calculateStats();
      const btn = $(cfg.ids.btnSubmit);
      if (btn) btn.onclick = finalizeBudget;
      w.__GAME = w.__GAME || {};
      w.__GAME.updateSector = updateSector;
    }

    init();
    return { updateSector, calculateStats };
  }

  w.createGame = createGame;
})(window, document, window.SiteHelpers || {});
