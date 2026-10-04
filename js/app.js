/* =========================================================
   Freunde der Sonne - Application Controller & View Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.fdsStore;

  // Cache DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const toastContainer = document.getElementById('toast-container');

  // Active filter state for events
  let currentEventFilter = 'all';
  let activeViewId = 'view-leaderboard';

  // --- 1. Navigation Controller ---
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetViewId = item.getAttribute('data-target');
      switchView(targetViewId);
    });
  });

  const VIEW_HASH_MAP = {
    '#tabelle': 'view-leaderboard',
    '#spieltage': 'view-events',
    '#kader': 'view-members',
    '#timbersports': 'view-timbersports'
  };
  const HASH_VIEW_MAP = {
    'view-leaderboard': '#tabelle',
    'view-events': '#spieltage',
    'view-members': '#kader',
    'view-timbersports': '#timbersports'
  };

  function switchView(viewId, updateHash = true) {
    activeViewId = viewId;
    navItems.forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-target') === viewId);
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === viewId);
    });

    // Scroll to top of content
    document.getElementById('main-content').scrollTop = 0;

    if (updateHash && HASH_VIEW_MAP[viewId] && window.location.hash !== HASH_VIEW_MAP[viewId]) {
      history.replaceState(null, '', HASH_VIEW_MAP[viewId]);
    }

    if (store.isAuthenticated() && !store.isAdmin()) {
      store.recordMemberActivity();
    }

    refreshActiveView();
  }

  function handleHashNavigation() {
    const hash = (window.location.hash || '').toLowerCase();
    if (VIEW_HASH_MAP[hash]) {
      switchView(VIEW_HASH_MAP[hash], false);
    }
  }

  window.addEventListener('hashchange', handleHashNavigation);

  function updateTimbersportsTabVisibility() {
    const isVisible = store.isTimbersportsTabVisible();
    const navItem = document.getElementById('nav-item-timbersports');
    if (navItem) {
      navItem.style.display = isVisible ? 'flex' : 'none';
      const quiz = store.getTimbersportsQuiz();
      const cd = quiz && quiz.beerTasting && quiz.beerTasting.countdown;
      const isCdActive = Boolean(cd && cd.isRunning && cd.endsAt && Date.now() < cd.endsAt);
      navItem.classList.toggle('has-live-countdown', isCdActive);
    }
    if (!isVisible && activeViewId === 'view-timbersports') {
      switchView('view-leaderboard');
    }
  }

  function refreshActiveView() {
    const isAuthed = store.isAuthenticated();
    document.body.classList.toggle('auth-locked', !isAuthed);
    updateUserHeader();
    updateTimbersportsTabVisibility();

    // Auto-compact header when not on table / leaderboard view
    const appHeader = document.querySelector('.app-header');
    const headerCollapseIcon = document.getElementById('header-collapse-icon');
    if (appHeader) {
      const isLeaderboard = activeViewId === 'view-leaderboard';
      const isManuallyCollapsed = appHeader.classList.contains('header-collapsed');
      if (!isLeaderboard) {
        appHeader.classList.add('compact-header');
      } else if (!isManuallyCollapsed) {
        appHeader.classList.remove('compact-header');
      }
      if (headerCollapseIcon) {
        headerCollapseIcon.textContent = isManuallyCollapsed ? '▼' : (isLeaderboard ? '▲' : '▼');
      }
    }

    if (activeViewId === 'view-leaderboard') renderLeaderboard();
    if (activeViewId === 'view-events') renderEvents();
    if (activeViewId === 'view-members') renderMembers();
    if (activeViewId === 'view-timbersports') renderTimbersports();
    if (!isAuthed) {
      openUserPickerModal();
    }
  }

  // Global UI refresh hook for Realtime updates
  window.fdsRefreshUI = () => {
    refreshActiveView();
  };

  // --- Micro-Interactions: Haptics & Solar Confetti ---
  function triggerHaptic(type = 'light') {
    if (!navigator.vibrate) return;
    try {
      if (type === 'light') navigator.vibrate(12);
      else if (type === 'medium') navigator.vibrate(28);
      else if (type === 'success') navigator.vibrate([20, 50, 20]);
      else if (type === 'celebrate') navigator.vibrate([40, 60, 40, 60, 80]);
    } catch (e) {}
  }

  function fireSolarConfetti() {
    triggerHaptic('celebrate');
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffb703', '#fb8500', '#ffd166', '#ffffff', '#8b5cf6', '#38bdf8', '#10b981'];
    const emojis = ['☀️', '👑', '⚡', '✨', '🥩'];
    const particles = [];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: Math.random() < 0.22 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008
      });
    }

    let animId = null;
    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach(p => {
        if (p.alpha <= 0) return;
        aliveCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.emoji) {
          ctx.font = `${p.size * 2}px sans-serif`;
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });

      if (aliveCount > 0) {
        animId = requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animId);
      }
    }

    renderFrame();
  }

  // --- Live Countdown Banner Engine ---
  let countdownTimerInterval = null;

  function renderCountdownBanner() {
    const container = document.getElementById('live-countdown-container');
    if (!container) return;

    const upcomingEvents = store.getEvents().filter(e => e.status !== 'completed');
    if (!upcomingEvents || upcomingEvents.length === 0) {
      container.innerHTML = '';
      if (countdownTimerInterval) clearInterval(countdownTimerInterval);
      return;
    }

    const nextEvent = upcomingEvents[0];
    const organizer = store.getMember(nextEvent.organizerId) || { name: 'Gruppe' };

    function updateTimer() {
      const timeMatch = (nextEvent.time || '18:00').match(/(\d{1,2}):(\d{2})/);
      const hours = timeMatch ? timeMatch[1].padStart(2, '0') : '18';
      const minutes = timeMatch ? timeMatch[2] : '00';
      const eventTarget = new Date(`${nextEvent.date}T${hours}:${minutes}:00`);

      const now = new Date();
      const diffMs = eventTarget - now;

      if (diffMs <= 0) {
        container.innerHTML = `
          <div class="countdown-card">
            <div class="countdown-header">
              <span class="countdown-title">⚡ HEUTE / JETZT</span>
              <span style="font-size: 0.72rem; color: var(--sun-gold); font-weight: 700;">Live</span>
            </div>
            <div class="countdown-event-name">${nextEvent.isSpecial ? '🥩' : `Spieltag ${nextEvent.round}:`} ${nextEvent.title} bei ${organizer.name}</div>
            <div style="font-size: 0.8rem; color: var(--sun-gold); font-weight: 700; text-align: center; padding: 4px;">
              Viel Erfolg allen Freunden der Sonne! ☀️
            </div>
          </div>
        `;
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / (3600 * 24));
      const hoursLeft = Math.floor((totalSec % (3600 * 24)) / 3600);
      const minutesLeft = Math.floor((totalSec % 3600) / 60);
      const secondsLeft = Math.floor(totalSec % 60);

      // DOM optimization: update existing elements without innerHTML thrashing every 1000ms
      const valEls = container.querySelectorAll('.countdown-val');
      if (valEls.length === 4 && container.querySelector('.countdown-grid')) {
        valEls[0].textContent = days;
        valEls[1].textContent = String(hoursLeft).padStart(2, '0');
        valEls[2].textContent = String(minutesLeft).padStart(2, '0');
        valEls[3].textContent = String(secondsLeft).padStart(2, '0');
        return;
      }

      container.innerHTML = `
        <div class="countdown-card">
          <div class="countdown-header">
            <span class="countdown-title">⏳ Nächster Spieltag</span>
            <span style="font-size: 0.72rem; color: var(--sun-gold); font-weight: 700;">${formatDate(nextEvent.date)} • ${nextEvent.time}</span>
          </div>
          <div class="countdown-event-name">
            ${nextEvent.isSpecial ? '🥩' : `Spieltag ${nextEvent.round}:`} ${nextEvent.title} (bei ${organizer.name})
          </div>
          <div class="countdown-grid">
            <div class="countdown-box">
              <div class="countdown-val">${days}</div>
              <div class="countdown-lbl">Tage</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val">${String(hoursLeft).padStart(2, '0')}</div>
              <div class="countdown-lbl">Std.</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val">${String(minutesLeft).padStart(2, '0')}</div>
              <div class="countdown-lbl">Min.</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val">${String(secondsLeft).padStart(2, '0')}</div>
              <div class="countdown-lbl">Sek.</div>
            </div>
          </div>
        </div>
      `;
    }

    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    updateTimer();
    countdownTimerInterval = setInterval(updateTimer, 1000);
  }

  // --- Calendar Export (.ics) ---
  function exportEventToCalendar(eventId) {
    triggerHaptic('medium');
    const evt = store.getEvent(Number(eventId));
    if (!evt) return;

    const organizer = store.getMember(evt.organizerId) || { name: 'Freunde der Sonne' };
    const timeMatch = (evt.time || '18:00').match(/(\d{1,2}):(\d{2})/);
    const hours = timeMatch ? parseInt(timeMatch[1], 10) : 18;
    const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;

    const startDate = new Date(`${evt.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    function toICSDateTime(d) {
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    const dtStart = toICSDateTime(startDate);
    const dtEnd = toICSDateTime(endDate);
    const dtStamp = toICSDateTime(new Date());

    const cleanTitle = `Freunde der Sonne: ${evt.title}`;
    const cleanDesc = `${evt.description || 'Spieltag der Freunde der Sonne'}\\nOrganisator: ${organizer.name}\\nTreffpunkt: ${evt.location}\\nApp: https://freunde-der-sonne.vercel.app`;
    const cleanLocation = evt.location || 'Treffpunkt wird bekannt gegeben';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Freunde der Sonne//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:fds-event-${evt.id}-${Date.now()}@freunde-der-sonne.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${cleanLocation}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spieltag_${evt.round || evt.id}_freunde_der_sonne.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Termin für Kalender erstellt! 📅', '☀️');
  }

  // --- Live Weather Widget (Open-Meteo API) ---
  const weatherCache = {};

  async function fetchEventWeather(locationStr, dateStr) {
    if (!locationStr || locationStr.toLowerCase().includes('bekannt gegeben') || locationStr.toLowerCase().includes('wird von')) {
      return null;
    }

    const cacheKey = `${locationStr}_${dateStr}`;
    if (weatherCache[cacheKey]) return weatherCache[cacheKey];

    try {
      const cleanLoc = locationStr.split(/[,&/]/)[0].trim();
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLoc)}&count=1&language=de&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) return null;
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) return null;

      const { latitude, longitude } = geoData.results[0];
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) return null;
      const forecastData = await forecastRes.json();

      if (!forecastData.daily || !forecastData.daily.time) return null;

      const dayIdx = forecastData.daily.time.indexOf(dateStr);
      if (dayIdx === -1) return null;

      const code = forecastData.daily.weathercode[dayIdx];
      const maxTemp = Math.round(forecastData.daily.temperature_2m_max[dayIdx]);
      const rainProb = forecastData.daily.precipitation_probability_max[dayIdx];

      let icon = '☀️';
      let desc = 'Sonnig';
      if (code === 0) { icon = '☀️'; desc = 'Klar & sonnig'; }
      else if ([1, 2].includes(code)) { icon = '🌤️'; desc = 'Heiter'; }
      else if (code === 3) { icon = '☁️'; desc = 'Bewölkt'; }
      else if ([45, 48].includes(code)) { icon = '🌫️'; desc = 'Neblig'; }
      else if ([51, 53, 55, 61, 63, 65].includes(code)) { icon = '🌧️'; desc = `Regen (${rainProb}%)`; }
      else if ([71, 73, 75].includes(code)) { icon = '❄️'; desc = 'Schneefall'; }
      else if ([80, 81, 82].includes(code)) { icon = '🌦️'; desc = `Schauer (${rainProb}%)`; }
      else if ([95, 96, 99].includes(code)) { icon = '⛈️'; desc = 'Gewitter'; }

      const result = {
        icon,
        desc,
        temp: `${maxTemp}°C`
      };

      weatherCache[cacheKey] = result;
      return result;
    } catch (e) {
      return null;
    }
  }

  async function loadEventWeatherBadge(eventId, locationStr, dateStr) {
    const el = document.getElementById(`weather-event-${eventId}`);
    if (!el) return;

    const weather = await fetchEventWeather(locationStr, dateStr);
    if (!weather) return;

    el.innerHTML = `
      <div class="event-weather-pill" title="Wetter-Vorhersage für den Spieltag (via Open-Meteo)">
        <span class="weather-icon">${weather.icon}</span>
        <span>${weather.temp} • ${weather.desc}</span>
      </div>
    `;
  }

  // --- Was-wäre-wenn? Szenarien-Simulator ---
  const simPredictions = {
    round7: {
      ranks: { 1: 1, 4: 2, 6: 3, 2: 4, 5: 5, 7: 6, 3: 7, 8: 8 },
      jokers: [3]
    },
    round8: {
      ranks: { 4: 1, 1: 2, 2: 3, 6: 4, 3: 5, 5: 6, 7: 7, 8: 8 },
      jokers: [4]
    }
  };

  let simulatorInitialized = false;

  function initSimulator() {
    if (simulatorInitialized) return;
    simulatorInitialized = true;

    const toggleBtn = document.getElementById('toggle-simulator');
    const content = document.getElementById('simulator-content');
    const chevron = document.getElementById('simulator-chevron');

    if (toggleBtn && content) {
      toggleBtn.addEventListener('click', () => {
        triggerHaptic('light');
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        if (chevron) {
          chevron.textContent = isHidden ? 'Schließen ▴' : 'Simulieren ▾';
        }
        if (isHidden) {
          renderSimulator();
        }
      });
    }

    const tabR7 = document.getElementById('btn-sim-tab-r7');
    const tabR8 = document.getElementById('btn-sim-tab-r8');
    const viewR7 = document.getElementById('sim-view-r7');
    const viewR8 = document.getElementById('sim-view-r8');

    if (tabR7 && tabR8) {
      tabR7.addEventListener('click', () => {
        triggerHaptic('light');
        tabR7.classList.add('active');
        tabR8.classList.remove('active');
        if (viewR7) viewR7.style.display = 'block';
        if (viewR8) viewR8.style.display = 'none';
      });

      tabR8.addEventListener('click', () => {
        triggerHaptic('light');
        tabR8.classList.add('active');
        tabR7.classList.remove('active');
        if (viewR8) viewR8.style.display = 'block';
        if (viewR7) viewR7.style.display = 'none';
      });
    }

    const btnReset = document.getElementById('btn-sim-reset-standard');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        triggerHaptic('medium');
        const lb = store.getLeaderboard();
        lb.forEach((m, idx) => {
          simPredictions.round7.ranks[m.id] = idx + 1;
          simPredictions.round8.ranks[m.id] = idx + 1;
        });
        simPredictions.round7.jokers = [3];
        simPredictions.round8.jokers = [4];
        renderSimulator();
        showToast('Standard-Prognose geladen!', '⚡');
      });
    }

    const btnSven = document.getElementById('btn-sim-sven-miracle');
    if (btnSven) {
      btnSven.addEventListener('click', () => {
        triggerHaptic('medium');
        simPredictions.round7.ranks[3] = 1;
        simPredictions.round7.ranks[1] = 2;
        simPredictions.round7.jokers = [3];
        simPredictions.round8.ranks[3] = 2;
        renderSimulator();
        showToast('🚀 Sven-Joker-Wunder simuliert (+16 Pkt.)!', '🧠');
      });
    }

    const btnTobi = document.getElementById('btn-sim-tobi-attack');
    if (btnTobi) {
      btnTobi.addEventListener('click', () => {
        triggerHaptic('medium');
        simPredictions.round7.ranks[4] = 1;
        simPredictions.round8.ranks[4] = 1;
        simPredictions.round8.jokers = [4];
        simPredictions.round7.ranks[1] = 4;
        simPredictions.round8.ranks[1] = 5;
        renderSimulator();
        showToast('⚡ Tobi greift nach der Krone (+24 Pkt.)!', '⚡');
      });
    }

    const btnCelebrate = document.getElementById('btn-sim-fire-celebration');
    if (btnCelebrate) {
      btnCelebrate.addEventListener('click', () => {
        fireSolarConfetti();
      });
    }
  }

  function renderSimulator() {
    const r7List = document.getElementById('sim-players-r7-list');
    const r8List = document.getElementById('sim-players-r8-list');
    const summaryBox = document.getElementById('sim-summary-box');
    const members = store.getMembers();

    const evt7 = store.getEvent(7);
    const isR7Done = Boolean(evt7 && evt7.status === 'completed');
    const tabR7 = document.getElementById('btn-sim-tab-r7');
    if (tabR7) {
      tabR7.textContent = isR7Done ? 'ST 7 (✅ Gewertet)' : 'ST 7 (Gabi)';
    }

    function renderControlRows(roundKey, container) {
      if (!container) return;
      container.innerHTML = '';

      if (roundKey === 'round7' && isR7Done) {
        container.innerHTML = `
          <div style="padding: 12px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; margin-bottom: 12px; font-size: 0.8rem; color: #38bdf8; line-height: 1.4;">
            ✅ <strong>Spieltag 7 ist bereits abgeschlossen!</strong><br>
            Die realen Ergebnisse von Spieltag 7 sind fest in der Wertung. Der Simulator berechnet nun die Entscheidung mit Spieltag 8.
          </div>
        `;
        return;
      }

      members.forEach(m => {
        const currentRank = simPredictions[roundKey].ranks[m.id] || 4;
        const hasJokerChecked = (simPredictions[roundKey].jokers || []).includes(m.id);
        const canUseJoker = m.id === 3 || m.id === 4;

        const row = document.createElement('div');
        row.className = 'sim-player-row';
        row.innerHTML = `
          <div class="sim-player-info">
            <div class="avatar-sm" style="width: 24px; height: 24px; font-size: 0.9rem; flex-shrink: 0;">${renderAvatar(m.avatar)}</div>
            <span class="sim-player-name">${m.name}</span>
          </div>
          <div class="sim-controls-group">
            <label style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">Platz:</label>
            <select class="sim-rank-select" data-round="${roundKey}" data-player="${m.id}">
              ${[1,2,3,4,5,6,7,8].map(r => `<option value="${r}" ${r === currentRank ? 'selected' : ''}>${r}. (${[0,8,7,6,5,4,3,2,1][r]}P)</option>`).join('')}
            </select>
            ${canUseJoker ? `
              <label class="sim-joker-toggle ${hasJokerChecked ? 'active' : ''}" title="Joker für diesen Spieltag zünden (Punkte x2)">
                <input type="checkbox" style="display: none;" class="sim-joker-checkbox" data-round="${roundKey}" data-player="${m.id}" ${hasJokerChecked ? 'checked' : ''}>
                <span>${hasJokerChecked ? '⚡ Joker!' : '🃏 Joker'}</span>
              </label>
            ` : ''}
          </div>
        `;

        container.appendChild(row);
      });
    }

    renderControlRows('round7', r7List);
    renderControlRows('round8', r8List);

    document.querySelectorAll('.sim-rank-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        triggerHaptic('light');
        const round = e.target.getAttribute('data-round');
        const pId = Number(e.target.getAttribute('data-player'));
        simPredictions[round].ranks[pId] = Number(e.target.value);
        updateSimOutcome();
      });
    });

    document.querySelectorAll('.sim-joker-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        triggerHaptic('medium');
        const round = e.target.getAttribute('data-round');
        const pId = Number(e.target.getAttribute('data-player'));
        const checked = e.target.checked;
        const jokers = simPredictions[round].jokers || [];
        if (checked) {
          if (!jokers.includes(pId)) jokers.push(pId);
          const otherRound = round === 'round7' ? 'round8' : 'round7';
          simPredictions[otherRound].jokers = (simPredictions[otherRound].jokers || []).filter(id => id !== pId);
        } else {
          simPredictions[round].jokers = jokers.filter(id => id !== pId);
        }
        renderSimulator();
      });
    });

    function updateSimOutcome() {
      const sim = store.simulateSeason(simPredictions);
      const math = store.getMathematicalOdds();

      if (!summaryBox) return;

      const winner = sim.winner;
      const loser = sim.loser;

      summaryBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
          <div>
            <div class="sim-crown-winner">👑 Sonnenkönig: ${winner.name} (${winner.simTotalPoints} Pkt.)</div>
            <div class="sim-grill-loser">🥩 Grillmeister: ${loser.name} (${loser.simTotalPoints} Pkt.)</div>
          </div>
          <span style="font-size: 0.72rem; color: #c4b5fd; font-weight: 700; background: rgba(139, 92, 246, 0.2); padding: 4px 8px; border-radius: var(--radius-sm);">
            Simulierte Endtabelle
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
          ${sim.table.map(row => {
            let diffBadge = '';
            if (row.rankDiff > 0) {
              diffBadge = `<span class="sim-rank-badge up">▲ +${row.rankDiff}</span>`;
            } else if (row.rankDiff < 0) {
              diffBadge = `<span class="sim-rank-badge down">▼ ${row.rankDiff}</span>`;
            } else {
              diffBadge = `<span class="sim-rank-badge same">=</span>`;
            }

            // Tie-break check in simulated table
            const simTied = sim.table.filter(r => r.id !== row.id && r.simTotalPoints === row.simTotalPoints);
            let simTieBreakHtml = '';
            if (simTied.length > 0) {
              const simHigher = simTied.filter(r => r.simRank < row.simRank);
              const simLower = simTied.filter(r => r.simRank > row.simRank);
              if (simLower.length > 0) {
                const opp = simLower[0];
                const crit = row.wins > opp.wins ? `${row.wins} Siege (vs. ${opp.wins})` : `${row.podiums} Podeste (vs. ${opp.podiums})`;
                simTieBreakHtml = `<span class="tiebreak-chip ahead" style="font-size: 0.6rem; padding: 1px 5px;" title="Tie-Break Vorteil vor ${opp.name} durch ${crit}">⚖️ ${crit}</span>`;
              } else if (simHigher.length > 0) {
                const opp = simHigher[simHigher.length - 1];
                const crit = row.wins < opp.wins ? `${row.wins} Siege (vs. ${opp.wins})` : `${row.podiums} Podeste (vs. ${opp.podiums})`;
                simTieBreakHtml = `<span class="tiebreak-chip behind" style="font-size: 0.6rem; padding: 1px 5px;" title="Tie-Break hinter ${opp.name} wegen ${crit}">⚖️ ${crit}</span>`;
              }
            }

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; padding: 4px 6px; background: rgba(255, 255, 255, 0.03); border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span style="font-weight: 800; width: 18px; color: ${row.simRank === 1 ? 'var(--sun-gold)' : row.simRank === 8 ? '#fca5a5' : 'var(--text-muted)'};">${row.simRank}.</span>
                  <div class="avatar-sm" style="width: 20px; height: 20px; font-size: 0.75rem; flex-shrink: 0;">${renderAvatar(row.avatar)}</div>
                  <span style="font-weight: 600;">${row.name}</span>
                  ${diffBadge}
                  ${simTieBreakHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: var(--text-muted); font-size: 0.7rem;">(+${row.simAddPoints} P)</span>
                  <strong style="color: #fff; font-size: 0.82rem;">${row.simTotalPoints} Pkt.</strong>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">
          💡 <strong>Rechnerische Chancen:</strong> Noch im Titelrennen: <strong>${math.canWinTitle.map(id => store.getMember(id)?.name).join(', ')}</strong> • Wintergrill-Gefahr: <strong>${math.canEndLast.map(id => store.getMember(id)?.name).join(', ')}</strong>
        </div>
      `;
    }

    updateSimOutcome();
  }

  // --- 1b. User Profile Header & Switcher ("Wer bist du?") ---
  function isImageAvatar(avatarVal) {
    if (!avatarVal || typeof avatarVal !== 'string') return false;
    return avatarVal.startsWith('data:image') || 
           avatarVal.startsWith('http') || 
           avatarVal.startsWith('assets/') || 
           avatarVal.startsWith('/') || 
           avatarVal.startsWith('./') ||
           /\.(png|jpe?g|webp|gif|svg)$/i.test(avatarVal);
  }

  function renderAvatar(avatarVal, extraClass = '') {
    if (!avatarVal) return '<span class="avatar-fallback">👤</span>';
    if (isImageAvatar(avatarVal)) {
      return `<img src="${avatarVal}" alt="Avatar" class="avatar-img ${extraClass}" onerror="this.outerHTML='👤'">`;
    }
    return avatarVal;
  }

  function setAvatarElement(el, avatarVal) {
    if (!el) return;
    el.innerHTML = renderAvatar(avatarVal);
  }

  function updateUserHeader() {
    const user = store.getCurrentUser();
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    if (!user) {
      if (avatarEl) setAvatarElement(avatarEl, '👤');
      if (nameEl) nameEl.textContent = 'Anmelden';
      return;
    }
    if (avatarEl) setAvatarElement(avatarEl, user.avatar);
    if (nameEl) nameEl.textContent = user.name;
  }

  function openUserPickerModal() {
    const isAuthed = store.isAuthenticated();
    const modal = document.getElementById('modal-select-user');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close-modal-btn');
    const titleEl = modal.querySelector('.modal-title');
    const subEl = modal.querySelector('.modal-header p');
    const logoutBtn = document.getElementById('btn-logout-user');

    if (!isAuthed) {
      if (closeBtn) closeBtn.style.display = 'none';
      if (titleEl) titleEl.textContent = '☀️ Wer bist du?';
      if (subEl) subEl.textContent = 'Bitte wähle dein Profil aus und gib deine PIN ein:';
      if (logoutBtn) logoutBtn.style.display = 'none';
    } else {
      if (closeBtn) closeBtn.style.display = 'block';
      if (titleEl) titleEl.textContent = '👤 Profil wechseln';
      if (subEl) subEl.textContent = 'Tippe auf ein Profil, um den aktiven Benutzer zu wechseln:';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    }

    const container = document.getElementById('user-picker-options');
    container.innerHTML = '';
    const members = store.getMembers();
    const currentId = store.getCurrentUserId();

    members.forEach(m => {
      const isCurrent = m.id === currentId;
      const card = document.createElement('div');
      card.className = `user-picker-card ${isCurrent ? 'active-user' : ''}`;
      card.innerHTML = `
        <div class="avatar-sm" style="font-size: 1.15rem; width: 38px; height: 38px;">${renderAvatar(m.avatar)}</div>
        <div class="user-picker-info">
          <span class="user-picker-name">${m.name}</span>
          <span class="user-picker-sub">${m.nickname || 'Freund der Sonne'}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        openPinLoginModal(m.id);
      });
      container.appendChild(card);
    });

    // Admin option card
    const adminCard = document.getElementById('btn-admin-login-picker');
    if (adminCard) {
      adminCard.classList.toggle('active-user', currentId === 'admin');
      adminCard.onclick = () => {
        openPinLoginModal('admin');
      };
    }

    modal.classList.add('open');
    updatePushNotificationButtonState();
  }

  document.getElementById('btn-user-switcher').addEventListener('click', openUserPickerModal);

  const btnToggleHeader = document.getElementById('btn-toggle-header');
  const headerBrand = document.querySelector('.header-brand');
  const toggleHeaderCollapse = () => {
    const appHeader = document.querySelector('.app-header');
    const headerCollapseIcon = document.getElementById('header-collapse-icon');
    if (appHeader) {
      const isCollapsed = appHeader.classList.toggle('header-collapsed');
      if (headerCollapseIcon) {
        headerCollapseIcon.textContent = isCollapsed ? '▼' : '▲';
      }
      triggerHaptic('light');
    }
  };

  if (btnToggleHeader) {
    btnToggleHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHeaderCollapse();
    });
  }
  if (headerBrand) {
    headerBrand.addEventListener('click', (e) => {
      // Don't trigger if clicked on child button (like btnToggleHeader itself)
      if (e.target.closest('#btn-toggle-header')) return;
      toggleHeaderCollapse();
    });
  }

  document.querySelectorAll('.btn-push-toggle, #btn-toggle-push-notifications').forEach(btn => {
    btn.addEventListener('click', togglePushNotifications);
  });

  const btnLogoutUser = document.getElementById('btn-logout-user');
  if (btnLogoutUser) {
    btnLogoutUser.addEventListener('click', () => {
      store.logout();
      showToast('Auf diesem Gerät abgemeldet.', '👋');
      closeAllModals(true);
      refreshActiveView();
    });
  }

  const btnForceReloadApp = document.getElementById('btn-force-reload-app');
  if (btnForceReloadApp) {
    btnForceReloadApp.addEventListener('click', () => {
      showToast('App wird aktualisiert...', '🔄');
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname + '?reload=' + Date.now());
      }, 300);
    });
  }

  // --- 1c. PIN Login Controller ---
  function openPinLoginModal(memberId) {
    let targetId = memberId;
    let avatar = '👤';
    let name = 'Mitglied';
    let sub = 'Gib deine persönliche 4-stellige PIN ein';

    if (memberId === 'admin' || String(memberId) === 'admin') {
      targetId = 'admin';
      const adminAcc = store.getAdminAccount();
      avatar = adminAcc.avatar;
      name = 'Administrator (Spielleitung)';
      sub = 'Gib die 4-stellige Master-Admin-PIN ein';
    } else {
      const member = store.getMember(memberId);
      if (!member) return;
      targetId = member.id;
      avatar = member.avatar;
      name = member.name;
      sub = 'Gib deine persönliche 4-stellige PIN ein';
    }

    document.getElementById('pin-target-user-id').value = targetId;
    setAvatarElement(document.getElementById('pin-login-avatar'), avatar);
    document.getElementById('pin-login-name').textContent = name;
    const subEl = document.querySelector('#modal-pin-login p');
    if (subEl) subEl.textContent = sub;

    const pinInput = document.getElementById('pin-login-input');
    pinInput.value = '';

    closeAllModals(true);
    document.getElementById('modal-pin-login').classList.add('open');
    setTimeout(() => pinInput.focus(), 150);
  }

  // Handle on-screen numeric keypad clicks
  document.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-key');
      const pinInput = document.getElementById('pin-login-input');
      if (val === 'clear') {
        pinInput.value = '';
      } else if (val === 'backspace') {
        pinInput.value = pinInput.value.slice(0, -1);
      } else {
        if (pinInput.value.length < 6) {
          pinInput.value += val;
        }
      }
    });
  });

  document.getElementById('form-pin-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const rawTargetId = document.getElementById('pin-target-user-id').value;
    const targetId = rawTargetId === 'admin' ? 'admin' : Number(rawTargetId);
    const pin = document.getElementById('pin-login-input').value;

    const res = store.login(targetId, pin);
    if (res.success) {
      document.body.classList.remove('auth-locked');
      closeAllModals(true);
      showToast(`Willkommen, ${res.member.name}! ☀️`, res.member.avatar);
      refreshActiveView();
    } else {
      showToast(res.message, '❌');
      document.getElementById('pin-login-input').value = '';
      document.getElementById('pin-login-input').focus();
    }
  });


  // --- 2. Toast Notification Helper ---
  function showToast(message, icon = '☀️') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconHtml = isImageAvatar(icon)
      ? `<img src="${icon}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle;">`
      : icon;
    toast.innerHTML = `<span>${iconHtml}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- 3. View: Leaderboard & Wintergrillen ---
  function renderLeaderboard() {
    const leaderboard = store.getLeaderboard();
    const completedEvents = store.getEvents().filter(e => e.status === 'completed' && !e.isSpecial && e.id !== 9);
    const currentUserId = store.getCurrentUserId();
    
    // Update completed badge
    const badge = document.getElementById('completed-rounds-badge');
    if (badge) {
      badge.textContent = `${completedEvents.length} / 8 Spieltage`;
    }

    // Rankings List (Rank 1 to 8 starts directly at the top)
    const listContainer = document.getElementById('rankings-list-container');
    listContainer.innerHTML = '';

    // Tie-break determination helper: Explains exactly why player A is ahead of player B with equal points
    function getTieBreakInfo(player, fullLeaderboard) {
      if (!player || player.totalPoints === 0) return null;
      // Find other players with the exact same totalPoints
      const tied = fullLeaderboard.filter(p => p.id !== player.id && p.totalPoints === player.totalPoints);
      if (tied.length === 0) return null;

      const higher = tied.filter(p => p.rank < player.rank);
      const lower = tied.filter(p => p.rank > player.rank);

      if (lower.length > 0) {
        // Ranked ahead of someone with equal points
        const opp = lower[0];
        if (player.wins > opp.wins) {
          return {
            type: 'ahead',
            shortText: `${player.wins} Siege (vs. ${opp.wins})`,
            fullText: `Tie-Break: ${player.name} führt vor ${opp.name} bei Punktgleichheit (${player.totalPoints} Pkt.) durch mehr Tagessiege (${player.wins} vs. ${opp.wins}).`
          };
        } else if (player.podiums > opp.podiums) {
          return {
            type: 'ahead',
            shortText: `${player.podiums} Podeste (vs. ${opp.podiums})`,
            fullText: `Tie-Break: ${player.name} führt vor ${opp.name} bei Punktgleichheit (${player.totalPoints} Pkt.) durch mehr Podestplätze (${player.podiums} vs. ${opp.podiums}).`
          };
        }
      }

      if (higher.length > 0) {
        // Ranked behind someone with equal points
        const opp = higher[higher.length - 1];
        if (player.wins < opp.wins) {
          return {
            type: 'behind',
            shortText: `${player.wins} Siege (vs. ${opp.wins})`,
            fullText: `Tie-Break: ${player.name} rangiert hinter ${opp.name} bei Punktgleichheit (${player.totalPoints} Pkt.) wegen weniger Tagessiegen (${player.wins} vs. ${opp.wins}).`
          };
        } else if (player.podiums < opp.podiums) {
          return {
            type: 'behind',
            shortText: `${player.podiums} Podeste (vs. ${opp.podiums})`,
            fullText: `Tie-Break: ${player.name} rangiert hinter ${opp.name} bei Punktgleichheit (${player.totalPoints} Pkt.) wegen weniger Podestplätzen (${player.podiums} vs. ${opp.podiums}).`
          };
        }
      }

      return null;
    }

    leaderboard.forEach((player, index) => {
      const rank = player.rank;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : rank === 8 ? 'rank-8' : '';

      // Joker status badge: Secret Jokers rule!
      let jokerBadgeHtml = '';
      if (player.jokerInfo.status === 'used') {
        jokerBadgeHtml = `<span class="joker-chip used" title="Joker eingesetzt bei Spieltag ${player.jokerInfo.round}">🔒 Joker genutzt</span>`;
      } else if (player.jokerInfo.status === 'pending') {
        if (player.id === currentUserId) {
          jokerBadgeHtml = `<span class="joker-chip pending" title="Dein Joker ist gesetzt (noch geheim)">⚡ Joker aktiv (Du)</span>`;
        } else {
          // Keep secret from other players until matchday completes!
          jokerBadgeHtml = `<span class="joker-chip available" title="Jahres-Joker noch verfügbar">🟢 Joker frei</span>`;
        }
      } else {
        jokerBadgeHtml = `<span class="joker-chip available" title="Jahres-Joker noch verfügbar">🟢 Joker frei</span>`;
      }

      // Tie-Break detection: Only when multiple players have the exact same total points!
      const tieBreakInfo = getTieBreakInfo(player, leaderboard);
      let tieBreakHtml = '';
      if (tieBreakInfo) {
        tieBreakHtml = `
          <span>•</span>
          <span class="tiebreak-chip ${tieBreakInfo.type}" 
                data-tiebreak-info="${encodeURIComponent(tieBreakInfo.fullText)}"
                title="${tieBreakInfo.fullText}">
            ⚖️ Tie-Break: ${tieBreakInfo.shortText}
          </span>
        `;
      }

      const card = document.createElement('div');
      card.className = `ranking-card ${rankClass}`;
      card.innerHTML = `
        <div class="rank-left">
          <div class="rank-position">
            ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank === 8 ? '🥩' : rank + '.'}
          </div>
          <div class="avatar" style="width: ${rank === 1 ? '46px' : '40px'}; height: ${rank === 1 ? '46px' : '40px'}; font-size: ${rank === 1 ? '1.35rem' : '1.15rem'};">
            ${renderAvatar(player.avatar)}
          </div>
          <div class="player-meta">
            <div class="player-name-row">
              <span class="player-name" style="${rank === 1 ? 'font-size: 1.05rem; font-weight: 800;' : ''}">${player.name}</span>
              ${rank === 1 ? '<span class="my-event-badge" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 800; font-size: 0.65rem; padding: 2px 7px;">👑 Sonnenkönig</span>' : ''}
              ${rank === 8 ? '<span class="my-event-badge" style="background: var(--grill-fire); color: #fff; font-weight: 800; font-size: 0.65rem; padding: 2px 7px;">🔥 Platz 8</span>' : ''}
            </div>
            <div class="player-subinfo">
              <span>${player.nickname || ''}</span>
              <span>•</span>
              ${jokerBadgeHtml}
              ${tieBreakHtml}
            </div>
          </div>
        </div>
        <div class="rank-right">
          <div class="player-points">
            <div class="score-num">${player.totalPoints}</div>
            <div class="score-unit">Pkt.</div>
          </div>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Attach click listeners to tie-break chips for easy mobile reading
    document.querySelectorAll('.tiebreak-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        const text = decodeURIComponent(chip.getAttribute('data-tiebreak-info') || '');
        if (text) showToast(text, '⚖️');
      });
    });

    // Wintergrillen Verlierer Spotlight (Rank 8 / Gleichstand am Tabellenende)
    const grillContainer = document.getElementById('grill-loser-container');
    const minPoints = leaderboard.length > 0 ? leaderboard[leaderboard.length - 1].totalPoints : 0;
    const tiedLosers = leaderboard.filter(m => m.totalPoints === minPoints);
    const nonLosers = leaderboard.filter(m => m.totalPoints > minPoints);
    const nextAbove = nonLosers.length > 0 ? nonLosers[nonLosers.length - 1] : null;
    const deficit = nextAbove ? Math.max(0, nextAbove.totalPoints - minPoints) : 0;

    if (tiedLosers.length > 0) {
      const isMulti = tiedLosers.length > 1;
      const loserNames = tiedLosers.map(l => l.name).join(' & ');
      const loserAvatars = tiedLosers.map(l => `<div class="avatar" style="width: 44px; height: 44px; font-size: 1.25rem;">${renderAvatar(l.avatar)}</div>`).join('');
      const headlineText = isMulti ? `${loserNames} stehen am Grill! 🌭🥩` : `${tiedLosers[0].name} steht am Grill! 🌭🥩`;
      const noticeText = isMulti
        ? `Punktgleich am Tabellenende mit je ${minPoints} Punkten (${deficit > 0 ? deficit + ' Pkt. Rückstand zu P' + (leaderboard.length - tiedLosers.length) : 'Gleichauf'})`
        : `Aktuell Letzter mit ${minPoints} Punkten (${deficit > 0 ? deficit + ' Pkt. Rückstand zu P7' : 'Punktgleich'})`;

      grillContainer.innerHTML = `
        <div class="grill-loser-card">
          <div class="grill-warning-badge">
            <span>🔥</span> ${isMulti ? 'Drohendes Wintergrillen bei den Verlierern' : 'Drohendes Wintergrillen beim Verlierer'}
          </div>
          <div class="grill-card-body">
            <div class="grill-user-info">
              <div class="grill-avatar-wrapper" style="display: flex; gap: 4px;">
                ${loserAvatars}
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; color: #ff9999;">
                  ${headlineText}
                </div>
                <div class="grill-notice">
                  ${noticeText}
                </div>
                <div class="grill-deficit">
                  Am Saisonende lädt der Tabellenletzte alle Freunde zum Grillen & Bier ein!
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Joker Radar Grid
    const radarContainer = document.getElementById('joker-radar-container');
    radarContainer.innerHTML = '';

    const members = store.getMembers();
    members.forEach(m => {
      const jokerInfo = store.getJokerStatus(m.id);
      let statusHtml = '';
      if (jokerInfo.status === 'used') {
        statusHtml = `<span class="joker-chip used" style="font-size: 0.65rem;">🔒 ST ${jokerInfo.round}</span>`;
      } else if (jokerInfo.status === 'pending') {
        if (m.id === currentUserId) {
          statusHtml = `<span class="joker-chip pending" style="font-size: 0.65rem;">⚡ ST ${jokerInfo.round} (Du)</span>`;
        } else {
          // Secret Joker rule: keep anonymous until revealed
          statusHtml = `<span class="joker-chip available" style="font-size: 0.65rem;">🟢 Bereit</span>`;
        }
      } else {
        statusHtml = `<span class="joker-chip available" style="font-size: 0.65rem;">🟢 Bereit</span>`;
      }

      const item = document.createElement('div');
      item.className = 'radar-item';
      item.innerHTML = `
        <div class="radar-player">
          <div class="avatar-sm">${renderAvatar(m.avatar)}</div>
          <span>${m.name}</span>
        </div>
        <div>${statusHtml}</div>
      `;
      radarContainer.appendChild(item);
    });

    // Populate Season 2026 Progression & Fieberkurve
    renderSeasonProgression();

    // Populate 2025 History
    renderHistory2025();

    // Live Countdown Banner for Next Matchday
    renderCountdownBanner();

    // Scenario Simulator
    initSimulator();
    renderSimulator();
  }

  // --- Season 2026 Progression & Fieberkurve Mechanics ---
  let feverChartSelectedPlayer = null;
  let currentProgressionTab = 'matrix';

  function calculateSeasonProgression() {
    const members = store.getMembers();
    const allEvents = store.getEvents();
    const regularEvents = allEvents
      .filter(e => !e.isSpecial && e.id !== 9)
      .sort((a, b) => a.round - b.round);
    
    const completedEvents = regularEvents.filter(e => e.status === 'completed');
    const maxRounds = 8;
    
    const runningTotals = {};
    const runningWins = {};
    const runningPodiums = {};
    members.forEach(m => {
      runningTotals[m.id] = 0;
      runningWins[m.id] = 0;
      runningPodiums[m.id] = 0;
    });

    const DISTINCT_CHART_COLORS = {
      1: '#38bdf8', // Lukas: Himmelblau 🎯
      2: '#ec4899', // Oli: Pink / Magenta 🧢
      3: '#a855f7', // Sven: Violett / Lila 🧠
      4: '#facc15', // Tobi: Helles Elektro-Gelb ⚡
      5: '#ea580c', // Tomi: Sonnen-Rotorange ☀️
      6: '#f59e0b', // Tim: Warmes Sonnen-Gold 👑
      7: '#059669', // Gabi: Dunkles Smaragdgrün 🏃‍♂️
      8: '#a3e635'  // Aaron: Helles, leuchtendes Limettengrün 🍀
    };

    const playerProgression = members.map(m => ({
      id: m.id,
      name: m.name,
      nickname: m.nickname,
      avatar: m.avatar,
      color: DISTINCT_CHART_COLORS[m.id] || m.color || '#f59e0b',
      roundScores: {},
      ranksByRound: {},
      cumPointsByRound: {},
      totalPoints: 0,
      currentRank: 1,
      rankDelta: 0
    }));

    completedEvents.forEach(evt => {
      const r = evt.round;
      if (evt.scores && Array.isArray(evt.scores)) {
        evt.scores.forEach(s => {
          const p = playerProgression.find(item => item.id === s.playerId);
          if (p) {
            p.roundScores[r] = {
              points: s.points,
              basePoints: s.basePoints || s.points,
              rank: s.rank,
              jokerApplied: !!s.jokerApplied,
              roundWinner: s.rank === 1
            };
            runningTotals[s.playerId] = (runningTotals[s.playerId] || 0) + s.points;
            if (s.rank === 1) runningWins[s.playerId] = (runningWins[s.playerId] || 0) + 1;
            if (s.rank <= 3) runningPodiums[s.playerId] = (runningPodiums[s.playerId] || 0) + 1;
          }
        });
      }

      // Standings after round r
      const roundStandings = members.map(m => ({
        playerId: m.id,
        cumPoints: runningTotals[m.id] || 0,
        wins: runningWins[m.id] || 0,
        podiums: runningPodiums[m.id] || 0
      }));

      roundStandings.sort((a, b) => {
        if (b.cumPoints !== a.cumPoints) return b.cumPoints - a.cumPoints;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.podiums - a.podiums;
      });

      for (let i = 0; i < roundStandings.length; i++) {
        if (i > 0 && roundStandings[i].cumPoints === roundStandings[i - 1].cumPoints &&
            roundStandings[i].wins === roundStandings[i - 1].wins &&
            roundStandings[i].podiums === roundStandings[i - 1].podiums) {
          roundStandings[i].rank = roundStandings[i - 1].rank;
        } else {
          roundStandings[i].rank = i + 1;
        }

        const p = playerProgression.find(item => item.id === roundStandings[i].playerId);
        if (p) {
          p.ranksByRound[r] = roundStandings[i].rank;
          p.cumPointsByRound[r] = roundStandings[i].cumPoints;
        }
      }
    });

    const lastRound = completedEvents.length > 0 ? completedEvents[completedEvents.length - 1].round : 0;
    const prevRound = completedEvents.length > 1 ? completedEvents[completedEvents.length - 2].round : 0;

    playerProgression.forEach(p => {
      p.totalPoints = runningTotals[p.id] || 0;
      p.currentRank = p.ranksByRound[lastRound] || 8;
      if (lastRound && prevRound && p.ranksByRound[lastRound] && p.ranksByRound[prevRound]) {
        p.rankDelta = p.ranksByRound[prevRound] - p.ranksByRound[lastRound];
      } else {
        p.rankDelta = 0;
      }
    });

    playerProgression.sort((a, b) => a.currentRank - b.currentRank || b.totalPoints - a.totalPoints);

    return {
      players: playerProgression,
      regularEvents,
      completedEvents,
      lastRound,
      maxRounds
    };
  }

  function renderSeasonProgression() {
    const matrixContainer = document.getElementById('season-matrix-container');
    const chartContainer = document.getElementById('fever-chart-container');
    if (!matrixContainer || !chartContainer) return;

    const progData = calculateSeasonProgression();

    renderSeasonMatrix(progData);
    renderChartFilterChips(progData);
    renderFeverChart(progData, feverChartSelectedPlayer);
    setupProgressionListeners(progData);
  }

  function renderSeasonMatrix(progData) {
    const container = document.getElementById('season-matrix-container');
    if (!container) return;

    let html = `
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="matrix-sticky-header">Spieler</th>
            <th>ST 1</th>
            <th>ST 2</th>
            <th>ST 3</th>
            <th>ST 4</th>
            <th>ST 5</th>
            <th>ST 6</th>
            <th>ST 7</th>
            <th>ST 8</th>
            <th style="color: var(--sun-gold);">Gesamt</th>
            <th>Platz</th>
          </tr>
        </thead>
        <tbody>
    `;

    progData.players.forEach(p => {
      const rankIcon = p.currentRank === 1 ? '🥇' : p.currentRank === 2 ? '🥈' : p.currentRank === 3 ? '🥉' : p.currentRank === 8 ? '🥩' : `${p.currentRank}.`;

      let trendHtml = '';
      if (p.rankDelta > 0) {
        trendHtml = `<span style="color: #10b981; font-weight: 800; font-size: 0.72rem; margin-left: 3px;" title="Verbessert um ${p.rankDelta} Plätze">▲ +${p.rankDelta}</span>`;
      } else if (p.rankDelta < 0) {
        trendHtml = `<span style="color: #ef4444; font-weight: 800; font-size: 0.72rem; margin-left: 3px;" title="Verschlechtert um ${Math.abs(p.rankDelta)} Plätze">▼ ${p.rankDelta}</span>`;
      } else {
        trendHtml = `<span style="color: var(--text-muted); font-size: 0.72rem; margin-left: 3px;" title="Platzierung unverändert">▬</span>`;
      }

      html += `
        <tr>
          <td class="matrix-sticky-col">
            <div class="matrix-player-cell">
              <span class="matrix-rank-badge">${rankIcon}</span>
              <div class="avatar-sm">${renderAvatar(p.avatar)}</div>
              <span style="color: ${p.color};">${p.name}</span>
            </div>
          </td>
      `;

      for (let r = 1; r <= 8; r++) {
        const score = p.roundScores[r];
        if (score) {
          if (score.jokerApplied) {
            html += `<td><span class="matrix-joker-badge" title="Joker eingesetzt! Verdoppelt auf ${score.points} Pkt.">${score.points} ⚡</span></td>`;
          } else if (score.roundWinner) {
            html += `<td><span class="matrix-points-val" style="color: #fbbf24; font-weight: 800;" title="Tagessieg!">${score.points} <span class="matrix-winner-badge">🥇</span></span></td>`;
          } else {
            html += `<td><span class="matrix-points-val">${score.points}</span></td>`;
          }
        } else if (r <= progData.lastRound) {
          html += `<td><span style="color: var(--text-muted);">-</span></td>`;
        } else {
          html += `<td><span style="color: var(--text-muted); opacity: 0.4;">-</span></td>`;
        }
      }

      html += `
          <td class="matrix-total-cell">${p.totalPoints}</td>
          <td style="white-space: nowrap; font-weight: 700; font-size: 0.8rem;">
            ${p.currentRank}. ${trendHtml}
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  function renderChartFilterChips(progData) {
    const container = document.getElementById('chart-filter-container');
    if (!container) return;

    let html = `
      <button type="button" class="chart-chip ${feverChartSelectedPlayer === null ? 'active' : ''}" data-player-id="all">
        <span>👥</span> Alle Spieler
      </button>
    `;

    progData.players.forEach(p => {
      const isSelected = feverChartSelectedPlayer === p.id;
      html += `
        <button type="button" class="chart-chip ${isSelected ? 'active' : ''}" data-player-id="${p.id}" style="--chip-color: ${p.color}; ${isSelected ? `border-color: ${p.color}; color: #fff; background: ${p.color}25;` : ''}">
          <span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p.color}; flex-shrink: 0;"></span>
          <div class="avatar-sm" style="width: 18px; height: 18px; font-size: 0.72rem; flex-shrink: 0;">${renderAvatar(p.avatar)}</div>
          <span style="white-space: nowrap;">${p.name}</span>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.chart-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.playerId;
        if (pId === 'all') {
          feverChartSelectedPlayer = null;
        } else {
          const numId = parseInt(pId, 10);
          feverChartSelectedPlayer = feverChartSelectedPlayer === numId ? null : numId;
        }
        renderChartFilterChips(progData);
        renderFeverChart(progData, feverChartSelectedPlayer);
      });
    });
  }

  function renderFeverChart(progData, selectedPlayerId = null) {
    const container = document.getElementById('fever-chart-container');
    if (!container) return;
    if (!progData) progData = calculateSeasonProgression();

    const lastRound = progData.lastRound || 1;
    const maxRounds = 8;
    const startX = 52;
    const stepX = 74;
    const startY = 30;
    const stepY = 30;

    let svg = `
      <svg class="fever-chart-svg" viewBox="0 0 620 285" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="fever-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Horizontal Rank Lines -->
    `;

    for (let k = 1; k <= 8; k++) {
      const y = startY + (k - 1) * stepY;
      if (k === 1) {
        svg += `
          <line x1="48" y1="${y}" x2="585" y2="${y}" stroke="rgba(245, 158, 11, 0.25)" stroke-width="1.2" />
          <text x="44" y="${y + 4}" fill="#f59e0b" font-size="11" font-weight="800" text-anchor="end">1. 👑</text>
        `;
      } else if (k === 8) {
        svg += `
          <line x1="48" y1="${y}" x2="585" y2="${y}" stroke="rgba(239, 68, 68, 0.25)" stroke-width="1.2" />
          <text x="44" y="${y + 4}" fill="#ef4444" font-size="11" font-weight="800" text-anchor="end">8. 🔥</text>
        `;
      } else {
        svg += `
          <line x1="48" y1="${y}" x2="585" y2="${y}" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
          <text x="44" y="${y + 4}" fill="#64748b" font-size="10.5" font-weight="600" text-anchor="end">${k}.</text>
        `;
      }
    }

    // Divider for completed rounds if between 1 and 7
    if (lastRound < maxRounds) {
      const dividerX = startX + (lastRound - 1) * stepX + (stepX / 2);
      svg += `
        <line x1="${dividerX}" y1="18" x2="${dividerX}" y2="248" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.2" stroke-dasharray="4 3" />
        <text x="${dividerX + 4}" y="23" fill="#f59e0b" font-size="8.5" font-weight="700">Aktueller Stand (ST ${lastRound})</text>
      `;
    }

    // X-Axis Matchday Labels
    for (let r = 1; r <= maxRounds; r++) {
      const x = startX + (r - 1) * stepX;
      const isCompleted = r <= lastRound;
      svg += `
        <text x="${x}" y="266" fill="${isCompleted ? '#94a3b8' : '#64748b'}" font-size="10.5" font-weight="${isCompleted ? '700' : '500'}" opacity="${isCompleted ? '1' : '0.6'}" text-anchor="middle">
          ST ${r}
        </text>
      `;
    }

    // Render Curves for Players
    const hasSelection = selectedPlayerId !== null;

    // Sort to draw selected player on top
    const sortedPlayers = [...progData.players].sort((a, b) => {
      if (a.id === selectedPlayerId) return 1;
      if (b.id === selectedPlayerId) return -1;
      return 0;
    });

    sortedPlayers.forEach(p => {
      const isSelected = selectedPlayerId === p.id;
      const strokeOpacity = !hasSelection ? 0.8 : (isSelected ? 1.0 : 0.16);
      const strokeWidth = isSelected ? 4 : (!hasSelection ? 2.5 : 1.5);
      const filterAttr = isSelected ? 'filter="url(#fever-glow)"' : '';

      const points = [];
      for (let r = 1; r <= lastRound; r++) {
        const rank = p.ranksByRound[r];
        if (rank) {
          points.push({
            round: r,
            rank: rank,
            x: startX + (r - 1) * stepX,
            y: startY + (rank - 1) * stepY
          });
        }
      }

      if (points.length > 0) {
        let pathD = '';
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          if (i === 0) {
            pathD += `M ${pt.x} ${pt.y}`;
          } else {
            const prev = points[i - 1];
            const dx = pt.x - prev.x;
            pathD += ` C ${prev.x + dx * 0.45} ${prev.y}, ${pt.x - dx * 0.45} ${pt.y}, ${pt.x} ${pt.y}`;
          }
        }

        svg += `
          <path d="${pathD}" fill="none" stroke="${p.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${strokeOpacity}" ${filterAttr} class="fever-chart-line" data-player-id="${p.id}" style="cursor: pointer; transition: stroke-width 0.2s, opacity 0.2s;" />
        `;

        // Dots for points
        points.forEach(pt => {
          const dotRadius = isSelected ? 5.5 : 4;
          const dotStrokeWidth = isSelected ? 2.5 : 2;
          svg += `
            <circle cx="${pt.x}" cy="${pt.y}" r="${dotRadius}" fill="${p.color}" stroke="#131929" stroke-width="${dotStrokeWidth}" opacity="${strokeOpacity > 0.3 ? 1 : 0.25}" class="fever-chart-dot" data-player-id="${p.id}" data-round="${pt.round}" style="cursor: pointer; transition: all 0.2s;" />
          `;
        });

        // If selected or highlighted, display label at end point
        if (isSelected && points.length > 0) {
          const lastPt = points[points.length - 1];
          svg += `
            <text x="${lastPt.x + 8}" y="${lastPt.y + 3.5}" fill="${p.color}" font-size="10.5" font-weight="800">
              ${p.name} (P${lastPt.rank})
            </text>
          `;
        }
      }
    });

    svg += `</svg>`;
    container.innerHTML = svg;

    setupFeverChartInteractions(container, progData);
  }

  function setupFeverChartInteractions(container, progData) {
    const tooltip = document.getElementById('fever-chart-tooltip');
    if (!tooltip) return;

    container.querySelectorAll('.fever-chart-dot, .fever-chart-line').forEach(el => {
      const showInfo = (e) => {
        const playerId = parseInt(el.dataset.playerId, 10);
        const round = el.dataset.round ? parseInt(el.dataset.round, 10) : null;
        const player = progData.players.find(p => p.id === playerId);
        if (!player) return;

        let content = '';
        const avatarHtml = `<span style="display:inline-flex; width: 20px; height: 20px; border-radius: 50%; overflow: hidden; align-items: center; justify-content: center; vertical-align: middle; margin-right: 4px;">${renderAvatar(player.avatar)}</span>`;

        if (round) {
          const score = player.roundScores[round];
          const rank = player.ranksByRound[round];
          const cumPts = player.cumPointsByRound[round];
          let extra = '';
          if (score) {
            extra = ` • Spieltag ${round}: +${score.points} Pkt.`;
            if (score.jokerApplied) extra += ' ⚡ (Joker)';
            if (score.roundWinner) extra += ' 🥇 (Tagessieg)';
          }
          content = `<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">${avatarHtml} <strong>${player.name}</strong> <span>• Nach ST ${round}:</span> <strong style="color: var(--sun-gold);">Platz ${rank}</strong> <span>(${cumPts} Pkt. gesamt)</span>${extra}</div>`;
        } else {
          content = `<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">${avatarHtml} <strong>${player.name}</strong> <span>• Aktuell:</span> <strong style="color: var(--sun-gold);">Platz ${player.currentRank}</strong> <span>(${player.totalPoints} Punkte)</span></div>`;
        }

        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
      };

      el.addEventListener('mouseenter', showInfo);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showInfo(e);
        const playerId = parseInt(el.dataset.playerId, 10);
        if (playerId) {
          feverChartSelectedPlayer = feverChartSelectedPlayer === playerId ? null : playerId;
          renderChartFilterChips(progData);
          renderFeverChart(progData, feverChartSelectedPlayer);
        }
      });
    });
  }

  function setupProgressionListeners(progData) {
    const toggle = document.getElementById('toggle-season-progression');
    const content = document.getElementById('season-progression-content');
    const chevron = document.getElementById('season-progression-chevron');
    if (toggle && content && !toggle._hasClickListener) {
      toggle._hasClickListener = true;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isClosed = !content.style.display || content.style.display === 'none';
        content.style.display = isClosed ? 'block' : 'none';
        if (chevron) {
          chevron.textContent = isClosed ? 'Schließen ▴' : 'Übersicht ▾';
        }
        if (isClosed && currentProgressionTab === 'chart') {
          renderFeverChart(progData, feverChartSelectedPlayer);
        }
      });
    }

    const btnMatrix = document.getElementById('btn-prog-matrix');
    const btnChart = document.getElementById('btn-prog-chart');
    const matrixView = document.getElementById('prog-matrix-view');
    const chartView = document.getElementById('prog-chart-view');

    if (btnMatrix && !btnMatrix._hasClickListener) {
      btnMatrix._hasClickListener = true;
      btnMatrix.addEventListener('click', () => {
        currentProgressionTab = 'matrix';
        btnMatrix.classList.add('active');
        btnChart.classList.remove('active');
        if (matrixView) matrixView.style.display = 'block';
        if (chartView) chartView.style.display = 'none';
      });
    }

    if (btnChart && !btnChart._hasClickListener) {
      btnChart._hasClickListener = true;
      btnChart.addEventListener('click', () => {
        currentProgressionTab = 'chart';
        btnChart.classList.add('active');
        btnMatrix.classList.remove('active');
        if (matrixView) matrixView.style.display = 'none';
        if (chartView) chartView.style.display = 'block';
        renderFeverChart(progData, feverChartSelectedPlayer);
      });
    }
  }

  function renderHistory2025() {
    const seasons = store.getHistoricalSeasons ? store.getHistoricalSeasons() : [];
    const season2025 = seasons.find(s => s.year === 2025);
    if (!season2025) return;

    const list = document.getElementById('history-2025-list');
    if (!list) return;
    list.innerHTML = '';

    season2025.scores.forEach(s => {
      const row = document.createElement('div');
      row.className = 'ranking-card';
      row.style.padding = '8px 12px';
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <div class="rank-left">
          <div class="rank-position" style="font-size: 0.85rem; min-width: 22px;">${s.rank === 1 ? '👑' : s.rank + '.'}</div>
          <div class="avatar-sm" style="width: 32px; height: 32px; font-size: 0.95rem;">${renderAvatar(s.avatar)}</div>
          <div class="player-meta">
            <span class="player-name" style="font-size: 0.88rem; font-weight: 700;">${s.name}</span>
            <span style="font-size: 0.68rem; color: var(--text-secondary);">Punkte je Spieltag: ${s.rounds.join(', ')}</span>
          </div>
        </div>
        <div class="rank-right">
          <div class="player-points">
            <div class="score-num" style="font-size: 1.15rem; font-weight: 800; color: var(--sun-gold);">${s.points}</div>
            <div class="score-unit">Pkt.</div>
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    const toggle = document.getElementById('toggle-history-2025');
    const content = document.getElementById('history-2025-content');
    const chevron = document.getElementById('history-2025-chevron');
    if (toggle && content && !toggle._hasClickListener) {
      toggle._hasClickListener = true;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isClosed = !content.style.display || content.style.display === 'none';
        content.style.display = isClosed ? 'block' : 'none';
        if (chevron) {
          chevron.textContent = isClosed ? 'Schließen ▴' : 'Tabelle 2025 ▾';
        }
      });
    }
  }

  // --- 4. View: Spieltage (Events) & Administration ---
  function renderEvents() {
    const eventsContainer = document.getElementById('events-list-container');
    eventsContainer.innerHTML = '';

    let events = store.getEvents();
    const currentUserId = store.getCurrentUserId();

    if (currentEventFilter === 'upcoming') {
      events = events.filter(e => e.status !== 'completed');
    } else if (currentEventFilter === 'completed') {
      events = events.filter(e => e.status === 'completed');
    }

    // Find the next upcoming event to highlight
    const nextUpcoming = store.getEvents().find(e => e.status !== 'completed');

    events.forEach(evt => {
      const organizer = store.getMember(evt.organizerId) || { name: 'Unbekannt', avatar: '👤' };
      const isAdmin = store.isAdmin();
      const isNext = nextUpcoming && nextUpcoming.id === evt.id;
      // STRICT ORGANIZER CHECK: Only the designated organizer sees "Dein Spieltag"!
      const isMyEvent = !isAdmin && evt.organizerId === currentUserId;
      const isFrozen = store.isEventFrozen(evt);
      const isCompleted = evt.status === 'completed';

      const isSpecial = evt.isSpecial || evt.id === 9;

      // 3-Column Symmetric Header Chips
      let roundChipHtml = '';
      if (isSpecial) {
        roundChipHtml = `
          <div class="event-header-chip chip-round" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(249, 115, 22, 0.22)); border-color: rgba(249, 115, 22, 0.5);">
            <span class="chip-label" style="color: #f97316;">Spezial</span>
            <span class="chip-value">🥩 Wintergrillen</span>
          </div>
        `;
      } else {
        roundChipHtml = `
          <div class="event-header-chip chip-round">
            <span class="chip-label">Spieltag</span>
            <span class="chip-value">${evt.round} von 8</span>
          </div>
        `;
      }

      let orgaChipHtml = '';
      if (isSpecial) {
        const round8Done = store.getEvent(8)?.status === 'completed';
        const orgaTitle = evt.isOrganizerOverridden
          ? `Grillmeister: ${organizer.name} (Vom Admin bestimmt)`
          : round8Done
            ? `Grillmeister: ${organizer.name} (Tabellenletzter der Saison 🥩)`
            : `Grillmeister: ${organizer.name} (Aktuell Letzter – final nach Spieltag 8)`;

        if (isAdmin) {
          orgaChipHtml = `
            <div class="event-header-chip chip-orga orga-admin" title="${orgaTitle}">
              <span class="chip-label">Grillmeister</span>
              <span class="chip-value">🥩 ${organizer.name}</span>
            </div>
          `;
        } else if (isMyEvent) {
          orgaChipHtml = `
            <div class="event-header-chip chip-orga orga-me" title="Du musst grillen! ${orgaTitle}">
              <span class="chip-label">Grillmeister</span>
              <span class="chip-value">🥩 Du grillst!</span>
            </div>
          `;
        } else {
          orgaChipHtml = `
            <div class="event-header-chip chip-orga" title="${orgaTitle}">
              <span class="chip-label">Grillmeister</span>
              <span class="chip-value">🥩 ${organizer.name}</span>
            </div>
          `;
        }
      } else if (isAdmin) {
        orgaChipHtml = `
          <div class="event-header-chip chip-orga orga-admin" title="Organisiert von ${organizer.name}">
            <span class="chip-label">Orga</span>
            <span class="chip-value">👤 ${organizer.name}</span>
          </div>
        `;
      } else if (isMyEvent) {
        orgaChipHtml = `
          <div class="event-header-chip chip-orga orga-me" title="Dein Spieltag!">
            <span class="chip-label">Orga</span>
            <span class="chip-value">👑 Dein Tag</span>
          </div>
        `;
      } else {
        orgaChipHtml = `
          <div class="event-header-chip chip-orga" title="Organisiert von ${organizer.name}">
            <span class="chip-label">Orga</span>
            <span class="chip-value">👤 ${organizer.name}</span>
          </div>
        `;
      }

      let statusChipHtml = '';
      if (isCompleted) {
        statusChipHtml = `
          <div class="event-header-chip chip-status status-completed">
            <span class="chip-label">Status</span>
            <span class="chip-value">✓ Beendet</span>
          </div>
        `;
      } else if (isFrozen && !isSpecial) {
        statusChipHtml = `
          <div class="event-header-chip chip-status status-frozen">
            <span class="chip-label">Status</span>
            <span class="chip-value">🔒 Gestartet</span>
          </div>
        `;
      } else if (isNext) {
        statusChipHtml = `
          <div class="event-header-chip chip-status status-next">
            <span class="chip-label">Status</span>
            <span class="chip-value">⚡ Nächster</span>
          </div>
        `;
      } else {
        statusChipHtml = `
          <div class="event-header-chip chip-status status-upcoming">
            <span class="chip-label">Status</span>
            <span class="chip-value">📅 Geplant</span>
          </div>
        `;
      }

      // Freeze notice banner if active and not completed (regular events only)
      let frozenBannerHtml = '';
      if (!isSpecial && isFrozen && !isCompleted) {
        frozenBannerHtml = `
          <div class="frozen-notice-banner">
            <span>🔒</span>
            <div><strong>Spieltag gestartet:</strong> Alle gesetzten Joker sind eingefroren (keine Änderungen mehr möglich).</div>
          </div>
        `;
      }

      // Secret Joker display (Pre-completion: names remain secret! Post-completion: revealed!)
      let pendingJokersHtml = '';
      if (!isSpecial) {
        if (!isCompleted) {
          const pendingList = evt.pendingJokers || [];
          if (pendingList.length > 0) {
            const hasMyJoker = !isAdmin && pendingList.includes(currentUserId);
            const count = pendingList.length;
            pendingJokersHtml = `
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">
                ${hasMyJoker ? `<span class="my-joker-active-badge">⚡ Dein Joker ist aktiv (geheim)</span>` : ''}
                <span class="secret-joker-badge">🎭 ${count} ${count === 1 ? 'geheimer Joker' : 'geheime Joker'} angemeldet (Auflösung am Ende)</span>
              </div>
            `;
          }
        } else {
          // Completed: reveal jokers!
          const revealedNames = (evt.scores || [])
            .filter(s => s.jokerApplied)
            .map(s => {
              const m = store.getMember(s.playerId);
              return m ? `${(m.avatar && !isImageAvatar(m.avatar)) ? m.avatar + ' ' : ''}${m.name}` : '';
            })
            .filter(Boolean);

          if (revealedNames.length > 0) {
            pendingJokersHtml = `
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--border-solar); border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 12px; font-size: 0.78rem; color: var(--sun-gold); display: flex; align-items: center; gap: 8px;">
                <span>🃏</span>
                <div><strong>Gespielte Joker (Punkte x2 verdoppelt):</strong> ${revealedNames.join(', ')}</div>
              </div>
            `;
          }
        }
      }

      // RSVP (Spieltags-Zusagen) for upcoming/open events
      let rsvpHtml = '';
      if (!isCompleted) {
        const rsvps = store.getRsvps(evt.id);
        const myStatus = (evt.rsvps && evt.rsvps[currentUserId]) || null;
        const yesCount = rsvps.yes.length;

        let attendeePills = rsvps.yes.map(m => `<span class="rsvp-chip chip-yes"><span class="avatar-sm" style="width: 16px; height: 16px; font-size: 0.65rem; display: inline-flex;">${renderAvatar(m.avatar)}</span> ${m.name}</span>`).join('');
        if (rsvps.late.length > 0) {
          attendeePills += rsvps.late.map(m => `<span class="rsvp-chip chip-late">⏰ <span class="avatar-sm" style="width: 16px; height: 16px; font-size: 0.65rem; display: inline-flex;">${renderAvatar(m.avatar)}</span> ${m.name}</span>`).join('');
        }
        if (rsvps.no.length > 0) {
          attendeePills += rsvps.no.map(m => `<span class="rsvp-chip chip-no">✕ <span class="avatar-sm" style="width: 16px; height: 16px; font-size: 0.65rem; display: inline-flex;">${renderAvatar(m.avatar)}</span> ${m.name}</span>`).join('');
        }

        rsvpHtml = `
          <div class="rsvp-container">
            <div class="rsvp-header-row">
              <span class="rsvp-title"><span>🙋‍♂️</span> Wer ist am Start?</span>
              <span class="rsvp-count-badge">${yesCount} von 8 Freunden dabei</span>
            </div>
            <div class="rsvp-actions-bar">
              <button type="button" class="rsvp-btn ${myStatus === 'yes' ? 'active-yes' : ''} btn-rsvp-action" data-event-id="${evt.id}" data-status="yes">
                <span>🟢</span> Dabei
              </button>
              <button type="button" class="rsvp-btn ${myStatus === 'late' ? 'active-late' : ''} btn-rsvp-action" data-event-id="${evt.id}" data-status="late">
                <span>🟡</span> Später
              </button>
              <button type="button" class="rsvp-btn ${myStatus === 'no' ? 'active-no' : ''} btn-rsvp-action" data-event-id="${evt.id}" data-status="no">
                <span>🔴</span> Fehle
              </button>
            </div>
            ${attendeePills ? `<div class="rsvp-attendees-summary">${attendeePills}</div>` : `<div style="font-size: 0.7rem; color: var(--text-muted);">Noch keine Rückmeldungen für diesen Spieltag.</div>`}
          </div>
        `;
      }

      // Packing Checklist Tags (Persistent with claiming & checkmark)
      let packingHtml = '';
      if (evt.packingList && evt.packingList.length > 0) {
        const isLocked = isCompleted || isFrozen;
        const rows = evt.packingList.map((item, idx) => {
          const text = typeof item === 'string' ? item : (item.text || '');
          const isChecked = typeof item === 'object' && Boolean(item.checked);
          const broughtBy = typeof item === 'object' ? item.broughtBy : null;
          const broughtMember = broughtBy ? store.getMember(broughtBy) : null;

          if (isLocked) {
            return `
              <div class="packing-item-row locked" style="opacity: 0.85;">
                <div class="packing-item-main" style="cursor: default;">
                  <input type="checkbox" style="accent-color: var(--sun-gold); cursor: default;" ${isChecked ? 'checked' : ''} disabled>
                  <span class="packing-item-text ${isChecked ? 'checked' : ''}">${text}</span>
                </div>
                ${broughtMember ? `
                  <span class="packing-claim-btn claimed" style="cursor: default; pointer-events: none; display: inline-flex; align-items: center; gap: 4px;">
                    <span class="avatar-sm" style="width: 16px; height: 16px; font-size: 0.65rem; display: inline-flex;">${renderAvatar(broughtMember.avatar)}</span>
                    <span>${broughtMember.name}</span>
                  </span>
                ` : ''}
              </div>
            `;
          }

          return `
            <div class="packing-item-row">
              <div class="packing-item-main btn-toggle-pack-check" data-event-id="${evt.id}" data-idx="${idx}">
                <input type="checkbox" style="accent-color: var(--sun-gold); cursor: pointer;" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation()">
                <span class="packing-item-text ${isChecked ? 'checked' : ''}">${text}</span>
              </div>
              <button type="button" class="packing-claim-btn ${broughtMember ? 'claimed' : ''} btn-claim-pack-item" data-event-id="${evt.id}" data-idx="${idx}" title="${broughtMember ? `Wird von ${broughtMember.name} mitgebracht` : 'Tippen, um dieses Mitbringsel zu übernehmen'}">
                ${broughtMember ? `
                  <span class="avatar-sm" style="width: 16px; height: 16px; font-size: 0.65rem; display: inline-flex;">${renderAvatar(broughtMember.avatar)}</span>
                  <span>${broughtMember.name}</span>
                ` : '+ Ich bring\'s mit'}
              </button>
            </div>
          `;
        }).join('');

        packingHtml = `
          <div class="packing-box" style="margin-top: 10px;">
            <div class="packing-box-title" style="margin-bottom: 6px;">
              <span>🎒</span> Packliste & Mitbringsel:
            </div>
            <div class="packing-items-list" style="display: flex; flex-direction: column; gap: 4px;">
              ${rows}
            </div>
          </div>
        `;
      }

      // Calendar Export Button for all events
      const calendarBtnHtml = `<button type="button" class="btn btn-secondary btn-sm btn-export-calendar" data-event-id="${evt.id}"><span>📅</span> Kalender</button>`;

      // Actions Builder
      let actionsHtml = '';

      if (isSpecial) {
        // Special Wintergrillen Event (no scoring, no jokers)
        if (isAdmin) {
          actionsHtml = `
            <button class="btn btn-primary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Details & Orga bearbeiten
            </button>
            <button class="btn btn-secondary btn-sm btn-toggle-wintergrillen-status" data-event-id="${evt.id}">
              <span>${isCompleted ? '🔓 Als geplant markieren' : '✓ Als beendet markieren'}</span>
            </button>
            ${calendarBtnHtml}
            <span style="font-size: 0.72rem; color: #fca5a5; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-sm);">
              🛡️ Admin-Modus
            </span>
          `;
        } else if (isMyEvent) {
          actionsHtml = `
            <button class="btn btn-primary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Grillfest planen & bearbeiten
            </button>
            ${calendarBtnHtml}
            <span style="font-size: 0.75rem; color: #f97316; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              🥩 Du bist Grillmeister
            </span>
          `;
        } else {
          actionsHtml = `
            ${calendarBtnHtml}
            <span style="font-size: 0.75rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
              🥩 Traditioneller Jahresabschluss (keine Wertung)
            </span>
          `;
        }
      } else if (isCompleted) {
        if (isAdmin) {
          // Admin can view, correct scores, edit details, or reopen!
          actionsHtml = `
            <button class="btn btn-secondary btn-sm btn-open-view-scores" data-event-id="${evt.id}">
              <span>🏆</span> Wertung ansehen
            </button>
            <button class="btn btn-primary btn-sm btn-admin-correct-scores" data-event-id="${evt.id}" style="background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #ef4444;">
              <span>✏️</span> Wertung korrigieren
            </button>
            <button class="btn btn-secondary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Details
            </button>
            <button class="btn btn-secondary btn-sm btn-admin-reopen-event" data-event-id="${evt.id}" style="color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);">
              <span>🔓</span> Wiedereröffnen
            </button>
            ${calendarBtnHtml}
          `;
        } else {
          // Regular members: strictly read-only!
          actionsHtml = `
            <button class="btn btn-secondary btn-sm btn-open-view-scores" data-event-id="${evt.id}">
              <span>🏆</span> Wertung ansehen
            </button>
            ${calendarBtnHtml}
            <span style="font-size: 0.72rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
              ✓ Abgeschlossen
            </span>
          `;
        }
      } else {
        // Open matchday
        const freezeBtnHtml = `
          <button class="btn btn-secondary btn-sm btn-toggle-freeze" data-event-id="${evt.id}">
            <span>${isFrozen ? '🔓 Freeze aufheben' : '🔒 Spieltag starten & Joker einfrieren'}</span>
          </button>
        `;

        const scoreBtnHtml = isFrozen
          ? `
            <button class="btn btn-primary btn-sm btn-open-score-modal" data-event-id="${evt.id}">
              <span>⚖️</span> Wertung erfassen
            </button>
          `
          : `
            <button class="btn btn-secondary btn-sm btn-open-score-modal" data-event-id="${evt.id}" title="Spieltag muss zuerst gestartet & Joker eingefroren werden">
              <span>🔒</span> Wertung erfassen <small style="opacity: 0.8; font-size: 0.72rem;">(Erst starten)</small>
            </button>
          `;

        if (isAdmin) {
          // Admin view on upcoming event
          actionsHtml = `
            <button class="btn btn-primary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Orga bearbeiten
            </button>
            ${scoreBtnHtml}
            ${calendarBtnHtml}
            ${freezeBtnHtml}
            <span style="font-size: 0.72rem; color: #fca5a5; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-sm);">
              🛡️ Admin-Modus
            </span>
          `;
        } else if (isMyEvent) {
          // Designated Organizer
          actionsHtml = `
            <button class="btn btn-primary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Spieltag bearbeiten
            </button>
            ${scoreBtnHtml}
            ${calendarBtnHtml}
            <span class="joker-blocked-chip" title="Kein Joker am eigenen Spieltag erlaubt">
              🚫 Kein Joker am eigenen Spieltag
            </span>
            ${freezeBtnHtml}
          `;
        } else {
          // Participant
          let jokerActionBtn = '';
          const isMyJokerPending = evt.pendingJokers && evt.pendingJokers.includes(currentUserId);

          if (isFrozen) {
            if (isMyJokerPending) {
              jokerActionBtn = `
                <span class="joker-chip pending" style="padding: 6px 12px; font-weight: 800;">
                  🔒 Dein Joker ist eingefroren (x2)
                </span>
              `;
            } else {
              jokerActionBtn = `
                <span class="joker-chip used" style="padding: 6px 10px;">
                  🔒 Spieltag gestartet (Keine Joker mehr möglich)
                </span>
              `;
            }
          } else {
            // Not frozen
            if (isMyJokerPending) {
              jokerActionBtn = `
                <button class="btn btn-joker-active btn-sm btn-toggle-my-joker" data-event-id="${evt.id}">
                  <span>⚡</span> Mein Joker gesetzt (Zurücknehmen)
                </button>
              `;
            } else {
              const check = store.canSetJoker(evt.id, currentUserId);
              if (check.allowed) {
                jokerActionBtn = `
                  <button class="btn btn-joker btn-sm btn-toggle-my-joker" data-event-id="${evt.id}">
                    <span>🃏</span> Meinen Joker setzen
                  </button>
                `;
              } else {
                jokerActionBtn = `
                  <span class="joker-chip used" style="padding: 6px 10px;">
                    🔒 ${check.reason || 'Joker nicht verfügbar'}
                  </span>
                `;
              }
            }
          }

          actionsHtml = `
            ${jokerActionBtn}
            ${calendarBtnHtml}
          `;
        }
      }

      if (Number(evt.id) === 8 && store.isTimbersportsTabVisible()) {
        actionsHtml = `
          <button type="button" class="btn btn-gold btn-sm btn-jump-timbersports" style="font-weight: 800; box-shadow: 0 4px 12px rgba(251, 133, 0, 0.4); margin-bottom: 6px;">
            <span>🪓</span> Zum Timbersports & Tasting Special ➔
          </button>
          ${actionsHtml}
        `;
      }

      // Treffpunkt display with interactive map link
      let locationDisplayHtml = evt.location || 'Wird noch bekannt gegeben';
      const isKnownLocation = evt.location && !evt.location.toLowerCase().includes('wird von') && !evt.location.toLowerCase().includes('bekannt gegeben');
      if (isKnownLocation) {
        const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(evt.location)}`;
        locationDisplayHtml = `
          <a href="${mapUrl}" target="_blank" rel="noopener" class="location-map-link" title="In Karten-App öffnen (Apple / Google Maps)">
            <span>${evt.location}</span>
            <span class="map-icon-tag">↗</span>
          </a>
        `;
      }

      const card = document.createElement('div');
      card.className = `event-card ${isNext ? 'featured' : ''}`;
      card.innerHTML = `
        <div class="event-header-row">
          ${roundChipHtml}
          ${orgaChipHtml}
          ${statusChipHtml}
        </div>

        <h3 class="event-title">${evt.title}</h3>

        <div class="event-organizer">
          <div class="avatar-sm">${renderAvatar(organizer.avatar)}</div>
          <span>Organisiert von <strong>${organizer.name}</strong></span>
        </div>

        <div class="event-meta-grid">
          <div class="meta-item">
            <span class="meta-label">📅 Datum & Zeit</span>
            <span class="meta-value">${formatDate(evt.date)} • ${evt.time}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">📍 Treffpunkt</span>
            <span class="meta-value">${locationDisplayHtml}</span>
          </div>
        </div>

        <div id="weather-event-${evt.id}"></div>

        ${evt.description ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.45;">${evt.description}</p>` : ''}

        ${frozenBannerHtml}
        ${pendingJokersHtml}
        ${rsvpHtml}
        ${packingHtml}

        <div class="event-actions-bar" style="flex-wrap: wrap;">
          ${actionsHtml}
        </div>
      `;

      eventsContainer.appendChild(card);

      // Async Weather Load for upcoming events
      if (!isCompleted) {
        loadEventWeatherBadge(evt.id, evt.location, evt.date);
      }
    });

    // Attach Event Listeners on event cards
    document.querySelectorAll('.btn-export-calendar').forEach(btn => {
      btn.addEventListener('click', () => {
        exportEventToCalendar(Number(btn.getAttribute('data-event-id')));
      });
    });

    document.querySelectorAll('.btn-jump-timbersports').forEach(btn => {
      btn.addEventListener('click', () => {
        switchView('view-timbersports');
      });
    });

    document.querySelectorAll('.btn-rsvp-action').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic('medium');
        const eventId = Number(btn.getAttribute('data-event-id'));
        const status = btn.getAttribute('data-status');
        store.setRsvp(eventId, currentUserId, status);
        showToast(`Rückmeldung gespeichert: ${status === 'yes' ? 'Dabei 🟢' : status === 'late' ? 'Später 🟡' : 'Fehle 🔴'}`, '🙋‍♂️');
        renderEvents();
      });
    });

    document.querySelectorAll('.btn-toggle-pack-check').forEach(el => {
      el.addEventListener('click', () => {
        const eventId = Number(el.getAttribute('data-event-id'));
        const evt = store.getEvent(eventId);
        if (evt && (evt.status === 'completed' || store.isEventFrozen(evt))) return;
        triggerHaptic('light');
        const idx = Number(el.getAttribute('data-idx'));
        store.togglePackingItem(eventId, idx);
        renderEvents();
      });
    });

    document.querySelectorAll('.btn-claim-pack-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = Number(btn.getAttribute('data-event-id'));
        const evt = store.getEvent(eventId);
        if (evt && (evt.status === 'completed' || store.isEventFrozen(evt))) return;
        triggerHaptic('medium');
        const idx = Number(btn.getAttribute('data-idx'));
        store.claimPackingItem(eventId, idx, currentUserId);
        renderEvents();
      });
    });
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditEventModal(btn.getAttribute('data-event-id'));
      });
    });

    // Helper to send push notification when matchday is started & frozen
    function notifyMatchdayFrozenAndStarted(evt) {
      if (!evt) return;
      const org = store.getMember(evt.organizerId)?.name || 'Organisator';
      const pendingCount = (evt.pendingJokers || []).length;
      const jokerInfo = pendingCount > 0
        ? `${pendingCount} geheime(r) Joker im Spiel! 🎭`
        : 'Keine Joker gesetzt.';
      dispatchPushNotification({
        title: `🔒 Spieltag ${evt.round} gestartet!`,
        body: `${evt.title} bei ${org}: Spieltag läuft & alle Joker sind eingefroren (${jokerInfo}). Mögen die Spiele beginnen! ☀️🏆`,
        eventId: evt.id,
        url: '/#spieltage'
      });
    }

    document.querySelectorAll('.btn-open-score-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = Number(btn.getAttribute('data-event-id'));
        const evt = store.getEvent(eventId);
        if (evt && evt.status !== 'completed' && !store.isEventFrozen(evt)) {
          const confirmStart = confirm(
            `🔒 Bevor die Wertung erfasst werden kann, muss der Spieltag gestartet und die Joker eingefroren werden!\n\nMöchtest du Spieltag ${evt.round} (${evt.title || 'Matchday'}) jetzt starten und alle Joker einfrieren?`
          );
          if (confirmStart) {
            const res = store.toggleEventFreeze(eventId);
            if (res.success && res.isFrozen) {
              showToast('🔒 Spieltag gestartet & Joker eingefroren!', '✅');
              notifyMatchdayFrozenAndStarted(evt);
              refreshActiveView();
              openScoreEventModal(eventId);
            } else {
              showToast(res.message || 'Fehler beim Starten des Spieltags.', '❌');
            }
          }
          return;
        }
        openScoreEventModal(eventId);
      });
    });

    document.querySelectorAll('.btn-admin-correct-scores').forEach(btn => {
      btn.addEventListener('click', () => {
        openScoreEventModal(Number(btn.getAttribute('data-event-id')), true);
      });
    });

    document.querySelectorAll('.btn-admin-reopen-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = Number(btn.getAttribute('data-event-id'));
        const evt = store.getEvent(eventId);
        if (confirm(`Spieltag ${evt?.round} wirklich wiedereröffnen? Die Wertung wird zurückgesetzt und kann neu eingetragen werden.`)) {
          const res = store.reopenEvent(eventId);
          if (res.success) {
            showToast(res.message, '🔓');
            refreshActiveView();
          } else {
            showToast(res.message, '❌');
          }
        }
      });
    });

    document.querySelectorAll('.btn-open-view-scores').forEach(btn => {
      btn.addEventListener('click', () => {
        openViewScoresModal(Number(btn.getAttribute('data-event-id')));
      });
    });

    document.querySelectorAll('.btn-toggle-my-joker').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.getAttribute('data-event-id');
        const res = store.toggleMyJoker(eventId);
        if (res.success) {
          showToast(res.message, res.action === 'added' ? '⚡' : '↩️');
          refreshActiveView();
        } else {
          alert(res.message);
        }
      });
    });

    document.querySelectorAll('.btn-toggle-freeze').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.getAttribute('data-event-id');
        const res = store.toggleEventFreeze(eventId);
        if (res.success) {
          showToast(res.message, res.isFrozen ? '🔒' : '🔓');
          if (res.isFrozen) {
            const evt = store.getEvent(eventId);
            notifyMatchdayFrozenAndStarted(evt);
          }
          refreshActiveView();
        } else {
          showToast(res.message, '❌');
        }
      });
    });

    document.querySelectorAll('.btn-toggle-wintergrillen-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = Number(btn.getAttribute('data-event-id'));
        const evt = store.getEvent(eventId);
        if (!evt) return;
        const nextStatus = evt.status === 'completed' ? 'upcoming' : 'completed';
        store.updateEvent(eventId, { status: nextStatus });
        showToast(`Wintergrillen-Status: ${nextStatus === 'completed' ? '✓ Beendet' : '📅 Geplant'}`, '🥩');
        renderEvents();
      });
    });
  }

  // Filter Chips handler
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentEventFilter = chip.getAttribute('data-filter');
      renderEvents();
    });
  });

  // --- 5. Modal: Scoring Erfassung & Admin-Korrektur ---
  function openScoreEventModal(eventId, isCorrection = false) {
    const evt = store.getEvent(eventId);
    if (!evt) return;
    const currentUserId = store.getCurrentUserId();
    const isAdmin = store.isAdmin();

    if (evt.status === 'completed' && !isCorrection) {
      if (isAdmin) {
        isCorrection = true;
      } else {
        showToast('Dieser Spieltag ist bereits abgeschlossen!', '✓');
        return;
      }
    }

    const isAuthorized = evt.organizerId === Number(currentUserId) || isAdmin;
    if (!isAuthorized) {
      showToast('Nur der Organisator oder die Spielleitung darf die Wertung erfassen!', '🔒');
      return;
    }

    if (!isCorrection && !store.isEventFrozen(evt)) {
      showToast('🔒 Bitte starte zuerst den Spieltag und friere die Joker ein!', '⚠️');
      return;
    }

    document.getElementById('score-event-id').value = evt.id;
    document.getElementById('score-event-is-correction').value = isCorrection ? '1' : '0';

    const correctionNotice = document.getElementById('score-correction-notice');
    const standardNotice = document.getElementById('score-standard-notice');
    const submitBtnIcon = document.getElementById('btn-submit-scoring-icon');
    const submitBtnText = document.getElementById('btn-submit-scoring-text');

    if (isCorrection) {
      document.getElementById('score-event-modal-title').textContent = `✏️ Wertung korrigieren: Spieltag ${evt.round}`;
      document.getElementById('score-event-modal-subtitle').textContent = `🛡️ Admin-Korrektur: ${evt.title}`;
      if (correctionNotice) correctionNotice.style.display = 'block';
      if (standardNotice) standardNotice.style.display = 'none';
      if (submitBtnIcon) submitBtnIcon.textContent = '💾';
      if (submitBtnText) submitBtnText.textContent = 'Korrektur speichern & Tabelle neu berechnen';
    } else {
      document.getElementById('score-event-modal-title').textContent = `⚖️ Wertung: Spieltag ${evt.round}`;
      document.getElementById('score-event-modal-subtitle').textContent = `${evt.title} • Orga: ${store.getMember(evt.organizerId)?.name}`;
      if (correctionNotice) correctionNotice.style.display = 'none';
      if (standardNotice) standardNotice.style.display = 'block';
      if (submitBtnIcon) submitBtnIcon.textContent = '🔒';
      if (submitBtnText) submitBtnText.textContent = 'Endgültig abschließen & werten';
    }

    const container = document.getElementById('score-inputs-container');
    container.innerHTML = '';

    const members = store.getMembers();

    const rankOptionsList = [
      { rank: 1, label: '🥇 1. Platz (8 Pkt.)' },
      { rank: 2, label: '🥈 2. Platz (7 Pkt.)' },
      { rank: 3, label: '🥉 3. Platz (6 Pkt.)' },
      { rank: 4, label: '4. Platz (5 Pkt.)' },
      { rank: 5, label: '5. Platz (4 Pkt.)' },
      { rank: 6, label: '6. Platz (3 Pkt.)' },
      { rank: 7, label: '7. Platz (2 Pkt.)' },
      { rank: 8, label: '8. Platz (1 Pkt.)' }
    ];

    const existingScores = evt.scores || [];

    members.forEach((m, idx) => {
      const existing = existingScores.find(s => s.playerId === m.id);
      // Secret Joker Rule: In regular scoring (!isCorrection), jokers are strictly SECRET!
      // Only in Admin Correction mode (on an already completed matchday) are jokers displayed.
      const showJoker = isCorrection ? (existing ? existing.jokerApplied : false) : false;

      const initialRank = existing ? existing.rank : (idx + 1);
      const basePoints = 9 - initialRank;
      const initialFinalPoints = showJoker ? basePoints * 2 : basePoints;

      const row = document.createElement('div');
      row.className = 'score-input-row';
      row.setAttribute('data-player-id', m.id);
      row.setAttribute('data-has-joker', showJoker ? '1' : '0');

      let rankOptionsHtml = '';
      rankOptionsList.forEach(opt => {
        rankOptionsHtml += `<option value="${opt.rank}" ${opt.rank === initialRank ? 'selected' : ''}>${opt.label}</option>`;
      });

      row.innerHTML = `
        <div class="score-player-info">
          <div class="avatar-sm">${renderAvatar(m.avatar)}</div>
          <div>
            <div class="score-player-name">${m.name}</div>
            ${showJoker ? '<div style="font-size: 0.68rem; color: #a78bfa; font-weight: 700;">⚡ Joker aktiv (x2)</div>' : ''}
          </div>
        </div>
        <div class="score-controls" style="display: flex; align-items: center; gap: 8px;">
          <select class="score-rank-select" data-player-id="${m.id}">
            ${rankOptionsHtml}
          </select>
          <div class="score-points-badge ${showJoker ? 'has-joker' : ''}" id="pts-badge-${m.id}">
            +${initialFinalPoints} Pkt.${showJoker ? ' ⚡' : ''}
          </div>
        </div>
      `;

      // Live change listener to dynamically update the calculated points
      const selectEl = row.querySelector('.score-rank-select');
      selectEl.addEventListener('change', (e) => {
        const chosenRank = Number(e.target.value);
        const pts = 9 - chosenRank;
        const finalPts = showJoker ? pts * 2 : pts;
        const badge = row.querySelector(`#pts-badge-${m.id}`);
        if (badge) {
          badge.textContent = `+${finalPts} Pkt.${showJoker ? ' ⚡' : ''}`;
        }
      });

      container.appendChild(row);
    });

    document.getElementById('modal-score-event').classList.add('open');
  }

  // Quick fill button in score modal: standard 1. to 8. place
  document.getElementById('btn-quick-fill-standard-scores').addEventListener('click', () => {
    const isCorrection = document.getElementById('score-event-is-correction').value === '1';
    const rows = document.querySelectorAll('#score-inputs-container .score-input-row');
    rows.forEach((row, idx) => {
      const playerId = Number(row.getAttribute('data-player-id'));
      const showJoker = isCorrection && (row.getAttribute('data-has-joker') === '1');
      const rankSelect = row.querySelector('.score-rank-select');
      const newRank = idx + 1;
      if (rankSelect) {
        rankSelect.value = String(newRank);
      }
      const pts = 9 - newRank;
      const finalPts = showJoker ? pts * 2 : pts;
      const badge = row.querySelector(`#pts-badge-${playerId}`);
      if (badge) {
        badge.textContent = `+${finalPts} Pkt.${showJoker ? ' ⚡' : ''}`;
      }
    });
    showToast('Standard-Plätze (1. bis 8.) vergeben!', '⚡');
  });

  // Submit scoring form
  document.getElementById('form-score-event').addEventListener('submit', (e) => {
    e.preventDefault();
    const eventId = Number(document.getElementById('score-event-id').value);
    const isCorrection = document.getElementById('score-event-is-correction').value === '1';
    const evt = store.getEvent(eventId);
    if (!evt) return;

    // Detect secret jokers before saving if !isCorrection
    const secretJokerPlayerIds = (!isCorrection && evt.pendingJokers) ? [...evt.pendingJokers] : [];

    const rows = document.querySelectorAll('#score-inputs-container .score-input-row');
    const rawScores = [];

    // Derive points directly from rank: Rank 1 = 8 Pkt, Rank 2 = 7 Pkt, ..., Rank 8 = 1 Pkt
    // Plätze können mehrfach vergeben werden (Gleichstand!)
    rows.forEach(row => {
      const playerId = Number(row.getAttribute('data-player-id'));
      const hasJoker = isCorrection ? (row.getAttribute('data-has-joker') === '1') : false;
      const rank = Number(row.querySelector('.score-rank-select').value);
      const basePoints = 9 - rank;

      rawScores.push({
        playerId,
        rank,
        points: basePoints,
        jokerApplied: hasJoker
      });
    });

    if (rawScores.length !== 8) {
      alert('Es müssen alle 8 Spieler gewertet werden!');
      return;
    }

    const success = store.saveEventScoring(eventId, rawScores, isCorrection);
    if (success) {
      closeAllModals();
      triggerHaptic('heavy');
      fireSolarConfetti();

      // If secret jokers were played on this matchday, open the Joker Reveal celebration modal!
      if (!isCorrection && secretJokerPlayerIds.length > 0) {
        const updatedEvt = store.getEvent(eventId);
        const revealContainer = document.getElementById('joker-reveal-list');
        const subtitleEl = document.getElementById('joker-reveal-subtitle');
        if (subtitleEl) {
          subtitleEl.textContent = `Spieltag ${evt.round} (${evt.title}) ist abgeschlossen. Folgende geheime Joker wurden soeben aufgedeckt:`;
        }
        if (revealContainer) {
          revealContainer.innerHTML = '';
          secretJokerPlayerIds.forEach(id => {
            const m = store.getMember(id) || { name: 'Mitglied', avatar: '👤' };
            const s = (updatedEvt?.scores || []).find(sc => sc.playerId === id);
            const basePts = s ? s.basePoints : 0;
            const finalPts = s ? s.points : 0;
            const rank = s ? s.rank : 0;

            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'space-between';
            card.style.padding = '12px 14px';
            card.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            card.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(255, 183, 3, 0.12) 100%)';
            card.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="avatar-sm" style="width: 38px; height: 38px; font-size: 1.15rem;">${renderAvatar(m.avatar)}</div>
                <div>
                  <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${m.name}</div>
                  <div style="font-size: 0.72rem; color: #c4b5fd;">${rank}. Platz (${basePts} Pkt. x 2 verdoppelt)</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 900; color: var(--sun-gold);">+${finalPts} Pkt.</div>
                <div style="font-size: 0.65rem; color: #a78bfa; font-weight: 700;">⚡ JOKER AKTIV</div>
              </div>
            `;
            revealContainer.appendChild(card);
          });
        }
        document.getElementById('modal-joker-reveal').classList.add('open');
      } else {
        showToast(isCorrection ? `Wertung für Spieltag ${evt.round} erfolgreich korrigiert! ✏️` : `Spieltag ${evt.round} erfolgreich abgeschlossen! 🏆`, '✓');
      }

      refreshActiveView();
    } else {
      if (!isCorrection && !store.isEventFrozen(evt)) {
        alert('Fehler: Der Spieltag muss zuerst gestartet und die Joker eingefroren werden!');
      } else {
        alert('Fehler beim Speichern der Wertung.');
      }
    }
  });

  const btnCloseJokerReveal = document.getElementById('btn-close-joker-reveal');
  if (btnCloseJokerReveal) {
    btnCloseJokerReveal.addEventListener('click', () => {
      closeAllModals();
      switchView('view-standings');
    });
  }

  // --- 5b. Modal: View Scores (Read-only for Completed Events) ---
  function openViewScoresModal(eventId) {
    const evt = store.getEvent(eventId);
    if (!evt) return;

    document.getElementById('view-scores-modal-title').textContent = `🏆 Spieltag ${evt.round}: ${evt.title}`;
    const organizer = store.getMember(evt.organizerId) || { name: 'Organisator', avatar: '👤' };
    document.getElementById('view-scores-modal-subtitle').textContent = `Orga: ${(organizer.avatar && !isImageAvatar(organizer.avatar)) ? organizer.avatar + ' ' : ''}${organizer.name} • ${formatDate(evt.date)}`;

    const container = document.getElementById('view-scores-list-container');
    container.innerHTML = '';

    if (!evt.scores || evt.scores.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.82rem;">Keine Wertungsdaten vorhanden.</p>';
    } else {
      // Sort scores by rank ascending
      const sorted = [...evt.scores].sort((a, b) => a.rank - b.rank);
      sorted.forEach(s => {
        const member = store.getMember(s.playerId) || { name: 'Unbekannt', avatar: '👤' };
        const isTop = s.rank === 1;
        const isLast = s.rank === 8;

        const item = document.createElement('div');
        item.className = `view-score-item ${isTop ? 'is-top' : ''} ${isLast ? 'is-last' : ''}`;
        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; width: 24px; text-align: center;">
              ${s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank === 8 ? '🥩' : s.rank + '.'}
            </div>
            <div class="avatar-sm">${renderAvatar(member.avatar)}</div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${member.name}</div>
              ${s.jokerApplied ? '<div style="font-size: 0.7rem; color: var(--sun-gold); font-weight: 700;">🃏 Joker eingesetzt! (' + (s.basePoints || s.points/2) + ' x 2 verdoppelt)</div>' : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: ${isTop ? 'var(--sun-gold)' : 'var(--text-primary)'};">
              +${s.points}
            </div>
            <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase;">Punkte</div>
          </div>
        `;
        container.appendChild(item);
      });
    }

    document.getElementById('modal-view-scores').classList.add('open');
  }

  // Format last activity timestamp for Admin: e.g. "Heute, 09:15 Uhr" or "23.09.2026, 09:15 Uhr"
  function formatLastActive(isoString) {
    if (!isoString) return 'Noch nicht erfasst';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Noch nicht erfasst';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const timeStr = `${hours}:${minutes} Uhr`;
    const dateStr = `${day}.${month}.${year}`;

    if (isToday) {
      return `Heute, ${timeStr}`;
    } else if (isYesterday) {
      return `Gestern, ${timeStr}`;
    }
    return `${dateStr}, ${timeStr}`;
  }

  // --- 6. View: Kader & Members ---
  function renderMembers() {
    const container = document.getElementById('members-list-container');
    container.innerHTML = '';

    const kaderInstr = document.getElementById('kader-instruction-text');
    if (kaderInstr) {
      if (store.isAdmin()) {
        kaderInstr.textContent = 'Als Spielleitung kannst du die Profile aller Freunde anpassen.';
      } else {
        kaderInstr.textContent = 'Tippe auf dein eigenes Profil (mit „Du“ markiert), um deinen Spitznamen oder Avatar anzupassen.';
      }
    }

    const leaderboard = store.getLeaderboard();
    const currentUserId = store.getCurrentUserId();
    updatePushNotificationButtonState();

    leaderboard.forEach(member => {
      const jokerInfo = store.getJokerStatus(member.id);
      let jokerDesc = '';
      if (jokerInfo.status === 'used') {
        jokerDesc = `🔒 Joker verbraucht (ST ${jokerInfo.round})`;
      } else if (jokerInfo.status === 'pending') {
        if (member.id === currentUserId) {
          jokerDesc = `⚡ Dein Joker ist aktiv (ST ${jokerInfo.round}, noch geheim)`;
        } else {
          // Secret Joker rule: keep anonymous until revealed
          jokerDesc = `🟢 Jahres-Joker bereit`;
        }
      } else {
        jokerDesc = `🟢 Jahres-Joker bereit`;
      }

      const isMe = member.id === currentUserId;
      const canEdit = store.isAdmin() || isMe;

      let editActionHtml = '';
      if (canEdit) {
        editActionHtml = `
          <button class="btn btn-secondary btn-sm" style="padding: 6px 10px; ${isMe ? 'border-color: var(--sun-gold); color: var(--sun-gold);' : ''}">
            <span>✏️</span> ${isMe ? 'Mein Profil' : 'Ändern'}
          </button>
        `;
      } else {
        editActionHtml = `
          <span style="font-size: 0.68rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; padding: 4px 6px;">
            🔒 Nur ${member.name}
          </span>
        `;
      }

      const card = document.createElement('div');
      card.className = 'ranking-card';
      if (isMe) {
        card.style.borderColor = 'rgba(255, 183, 3, 0.4)';
        card.style.background = 'rgba(255, 183, 3, 0.04)';
      }
      card.style.cursor = canEdit ? 'pointer' : 'default';
      card.innerHTML = `
        <div class="rank-left">
          <div class="avatar" style="width: 44px; height: 44px; font-size: 1.3rem;">
            ${renderAvatar(member.avatar)}
          </div>
          <div class="player-meta">
            <div class="player-name-row">
              <span class="player-name">${member.name}</span>
              ${member.rank === 1 ? '<span>👑</span>' : ''}
              ${member.rank === 8 ? '<span>🥩</span>' : ''}
              ${isMe ? '<span class="my-event-badge" style="font-size: 0.6rem; padding: 1px 6px;">Du</span>' : ''}
            </div>
            <div class="player-subinfo">
              <span>${member.nickname || 'Kein Spitzname'}</span>
              <span>•</span>
              <span style="font-weight: 700; color: var(--sun-gold);">${member.totalPoints} Pkt.</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--text-secondary); margin-top: 2px;">
              ${jokerDesc}
            </div>
            ${store.isAdmin() ? `
              <div class="admin-last-active" style="font-size: 0.68rem; color: #38bdf8; margin-top: 5px; display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; background: rgba(56, 189, 248, 0.08); border-radius: var(--radius-pill); border: 1px solid rgba(56, 189, 248, 0.22);" title="Admin-Info: Letzte Aktivität">
                <span>🕒</span>
                <span>Zuletzt aktiv: <strong>${formatLastActive(member.lastActiveAt)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
        <div>
          ${editActionHtml}
        </div>
      `;

      card.addEventListener('click', () => {
        if (canEdit) {
          openEditMemberModal(member.id);
        } else {
          showToast(`Du kannst nur dein eigenes Profil bearbeiten!`, '🔒');
        }
      });

      container.appendChild(card);
    });

    // Update Account & Security section
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      const accAvatar = document.getElementById('account-avatar');
      const accName = document.getElementById('account-name');
      const accRole = document.getElementById('account-role');
      const accBadge = document.getElementById('account-status-badge');
      if (accAvatar) setAvatarElement(accAvatar, currentUser.avatar);
      if (accName) accName.textContent = currentUser.name;
      if (accRole) {
        accRole.textContent = currentUser.id === 'admin' 
          ? '🛡️ Spielleitung • Volle Korrektur- & Zuteilungsrechte' 
          : '👤 Gruppenmitglied (PIN geschützt)';
      }
      if (accBadge) {
        accBadge.textContent = currentUser.id === 'admin' ? 'Spielleitung' : 'Eingeloggt';
      }

      // Only show Admin: Spieltage zuteilen button if logged in as Admin!
      const adminPanelBtn = document.getElementById('btn-open-admin-panel');
      if (adminPanelBtn) {
        adminPanelBtn.style.display = store.isAdmin() ? 'flex' : 'none';
      }

      // Hide "Daten & Verwaltung" card if not admin
      const dataMgmtCard = document.getElementById('card-data-management');
      if (dataMgmtCard) {
        dataMgmtCard.style.display = store.isAdmin() ? 'block' : 'none';
      }

      // Populate Admin Activity Overview
      if (store.isAdmin()) {
        const activityContainer = document.getElementById('admin-activity-list');
        if (activityContainer) {
          activityContainer.innerHTML = '';
          const members = store.getMembers();
          members.forEach(m => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05);';
            item.innerHTML = `
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="avatar" style="width: 24px; height: 24px; font-size: 0.95rem; flex-shrink: 0;">
                  ${renderAvatar(m.avatar)}
                </div>
                <strong style="color: #fff; font-size: 0.76rem;">${m.name}</strong>
                <span style="color: var(--text-muted); font-size: 0.68rem;">(${m.nickname || '–'})</span>
              </div>
              <div style="color: ${m.lastActiveAt ? '#38bdf8' : 'var(--text-muted)'}; font-size: 0.72rem; font-weight: 600;">
                ${formatLastActive(m.lastActiveAt)}
              </div>
            `;
            activityContainer.appendChild(item);
          });
        }
      }
    }
  }

  // --- 7. Modals Controllers ---

  // Close modals on X or backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('close-modal-btn')) {
        if (!store.isAuthenticated()) {
          // If in PIN modal, return to user selection
          if (modal.id === 'modal-pin-login') {
            document.getElementById('modal-pin-login').classList.remove('open');
            openUserPickerModal();
            return;
          }
          // Do not allow closing user picker before authentication
          return;
        }
        closeAllModals();
      }
    });
  });

  // Global Escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.isAuthenticated()) {
      closeAllModals();
    }
  });

  function closeAllModals(force = false) {
    if (!force && !store.isAuthenticated()) {
      openUserPickerModal();
      return;
    }
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  }

  // Modal 1: Edit Event
  function openEditEventModal(eventId) {
    const evt = store.getEvent(eventId);
    if (!evt) return;

    const currentUserId = store.getCurrentUserId();
    const organizer = store.getMember(evt.organizerId) || { name: 'Organisator', avatar: '👤' };
    const isSpecial = evt.isSpecial || evt.id === 9;

    // Strict authorization: Only the designated organizer may edit their matchday!
    if (!store.canEditEvent(eventId, currentUserId)) {
      showToast(`Zugriff verweigert: Nur ${organizer.name} darf dieses Event bearbeiten!`, '🔒');
      return;
    }

    document.getElementById('edit-event-id').value = evt.id;
    document.getElementById('edit-event-modal-title').textContent = isSpecial
      ? 'Wintergrillen 2026 bearbeiten'
      : `Spieltag ${evt.round} bearbeiten`;
    document.getElementById('edit-event-title').value = evt.title;
    document.getElementById('edit-event-date').value = evt.date;

    // Parse time into HH:MM for native <input type="time">
    let cleanTime = '';
    if (evt.time) {
      const match = evt.time.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        cleanTime = `${match[1].padStart(2, '0')}:${match[2]}`;
      } else {
        const hourMatch = evt.time.match(/(\d{1,2})/);
        if (hourMatch) {
          cleanTime = `${hourMatch[1].padStart(2, '0')}:00`;
        }
      }
    }
    document.getElementById('edit-event-time').value = cleanTime;
    document.getElementById('edit-event-location').value = evt.location || '';
    if (window.fdsUpdateLocationMapBtn) {
      window.fdsUpdateLocationMapBtn(evt.location || '');
    }
    const packingTexts = (evt.packingList || []).map(it => (typeof it === 'string' ? it : it.text || '')).filter(Boolean);
    document.getElementById('edit-event-packing').value = packingTexts.join(', ');
    document.getElementById('edit-event-desc').value = evt.description || '';

    // Organizer select: Fixed for normal events; flexible for Admin on Wintergrillen!
    const orgSelect = document.getElementById('edit-event-organizer');
    orgSelect.innerHTML = '';

    if (isSpecial && store.isAdmin()) {
      orgSelect.disabled = false;
      const optAuto = document.createElement('option');
      optAuto.value = 'auto';
      optAuto.textContent = '🤖 Automatisch (Tabellenletzter nach Spieltag 8)';
      if (!evt.isOrganizerOverridden) optAuto.selected = true;
      orgSelect.appendChild(optAuto);

      store.getMembers().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `👤 ${m.name} (Manuell als Grillmeister setzen)`;
        if (evt.isOrganizerOverridden && evt.organizerId === m.id) opt.selected = true;
        orgSelect.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = organizer.id;
      opt.textContent = `${(organizer.avatar && !isImageAvatar(organizer.avatar)) ? organizer.avatar + ' ' : ''}${organizer.name} (${isSpecial ? 'Grillmeister' : 'Organisator'})`;
      opt.selected = true;
      orgSelect.appendChild(opt);
      orgSelect.disabled = true; // Fixed role: no accidental organizer changes!
    }

    // Reset push checkbox to checked by default
    const pushCheckbox = document.getElementById('edit-event-send-push');
    if (pushCheckbox) pushCheckbox.checked = true;

    document.getElementById('modal-edit-event').classList.add('open');
  }

  document.getElementById('form-edit-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventId = Number(document.getElementById('edit-event-id').value);
    const packingRaw = document.getElementById('edit-event-packing').value;
    const newPackingTexts = packingRaw.split(',').map(s => s.trim()).filter(Boolean);
    const oldEvt = store.getEvent(eventId);
    const existingList = oldEvt && Array.isArray(oldEvt.packingList) ? oldEvt.packingList : [];
    const packingList = newPackingTexts.map(text => {
      const matched = existingList.find(item => (typeof item === 'string' ? item : item.text) === text);
      if (matched && typeof matched === 'object') {
        return { text, checked: Boolean(matched.checked), broughtBy: matched.broughtBy || null };
      }
      return { text, checked: false, broughtBy: null };
    });
    const isSpecial = oldEvt && (oldEvt.isSpecial || oldEvt.id === 9);
    const newTitle = document.getElementById('edit-event-title').value.trim();
    const newDate = document.getElementById('edit-event-date').value;
    const timeVal = document.getElementById('edit-event-time').value.trim();
    const newTime = timeVal ? `${timeVal} Uhr` : (oldEvt ? oldEvt.time : '');
    const newLocation = document.getElementById('edit-event-location').value.trim();
    const newDesc = document.getElementById('edit-event-desc').value.trim();
    const pushCheckbox = document.getElementById('edit-event-send-push');
    const shouldSendPush = pushCheckbox ? pushCheckbox.checked : false;

    // Detect specific changes for push notification text
    const changes = [];
    if (oldEvt) {
      if (oldEvt.date !== newDate) {
        changes.push(`📅 Datum neu: ${formatDate(newDate)}`);
      }
      if (oldEvt.time !== newTime) {
        changes.push(`⏰ Zeit: ${newTime || 'entfernt'}`);
      }
      if (oldEvt.location !== newLocation) {
        changes.push(`📍 Ort: ${newLocation}`);
      }
      if (oldEvt.title !== newTitle) {
        changes.push(`🏷️ Titel: ${newTitle}`);
      }
      if ((oldEvt.description || '').trim() !== newDesc) {
        changes.push(`ℹ️ Details aktualisiert`);
      }
    }

    const updatePayload = {
      title: newTitle,
      date: newDate,
      time: newTime,
      location: newLocation,
      packingList: packingList,
      description: newDesc
    };

    if (isSpecial && store.isAdmin()) {
      const orgVal = document.getElementById('edit-event-organizer').value;
      if (orgVal === 'auto') {
        updatePayload.isOrganizerOverridden = false;
        updatePayload.pendingJokers = [];
      } else {
        updatePayload.organizerId = Number(orgVal);
        updatePayload.isOrganizerOverridden = true;
        updatePayload.pendingJokers = ['override'];
      }
    }

    store.updateEvent(eventId, updatePayload);

    closeAllModals();
    showToast(isSpecial ? 'Wintergrillen-Details erfolgreich aktualisiert!' : 'Spieltag-Details erfolgreich aktualisiert!', '✅');
    renderEvents();

    // Dispatch push notification to all subscribed iPhones if enabled and there are changes
    if (shouldSendPush && changes.length > 0) {
      dispatchPushNotification({
        title: `☀️ Update: ${newTitle}`,
        body: changes.join(' • '),
        eventId: eventId,
        url: '/'
      });
    }
  });

  // Modal 3: Edit Member (Fixed names protection & ownership check)
  let currentEditingAvatar = '';

  function updateEditAvatarPreview(avatarVal) {
    const preview = document.getElementById('edit-member-avatar-preview');
    if (preview) {
      setAvatarElement(preview, avatarVal);
    }
    const resetBtn = document.getElementById('btn-reset-avatar-emoji');
    if (resetBtn) {
      resetBtn.style.display = isImageAvatar(avatarVal) ? 'inline-flex' : 'none';
    }
  }

  function openEditMemberModal(memberId) {
    const currentUserId = store.getCurrentUserId();
    const isAdmin = store.isAdmin();

    if (!isAdmin && Number(memberId) !== Number(currentUserId)) {
      showToast('Zugriff verweigert: Du kannst nur dein eigenes Profil bearbeiten!', '🔒');
      return;
    }

    const member = store.getMember(memberId);
    if (!member) return;

    document.getElementById('edit-member-id').value = member.id;
    const nameInput = document.getElementById('edit-member-name');
    nameInput.value = member.name;
    nameInput.disabled = false; // Name is editable by member or admin

    document.getElementById('edit-member-nickname').value = member.nickname || '';
    
    currentEditingAvatar = member.avatar || '👤';
    updateEditAvatarPreview(currentEditingAvatar);

    const emojiInput = document.getElementById('edit-member-avatar');
    if (isImageAvatar(currentEditingAvatar)) {
      emojiInput.value = '';
    } else {
      emojiInput.value = currentEditingAvatar;
    }

    // Reset file input
    const photoInput = document.getElementById('edit-member-photo-input');
    if (photoInput) photoInput.value = '';

    // Show/hide Admin single PIN reset box
    const pinResetBox = document.getElementById('admin-member-pin-reset-box');
    if (pinResetBox) {
      pinResetBox.style.display = isAdmin ? 'block' : 'none';
    }

    // Show/hide Admin info: last active
    const lastActiveBox = document.getElementById('admin-member-last-active-box');
    const lastActiveVal = document.getElementById('admin-member-last-active-val');
    if (lastActiveBox && lastActiveVal) {
      if (isAdmin) {
        lastActiveBox.style.display = 'block';
        lastActiveVal.textContent = formatLastActive(member.lastActiveAt);
      } else {
        lastActiveBox.style.display = 'none';
      }
    }

    document.getElementById('modal-edit-member').classList.add('open');
  }

  // Modal 2: Register Joker
  function openRegisterJokerModal(eventId) {
    const evt = store.getEvent(eventId);
    if (!evt) return;

    document.getElementById('joker-target-event-id').value = evt.id;

    const preview = document.getElementById('joker-event-preview');
    preview.innerHTML = `
      <div style="font-weight: 700; color: var(--sun-gold);">Spieltag ${evt.round}: ${evt.title}</div>
      <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
        📅 ${formatDate(evt.date)} • 📍 ${evt.location}
      </div>
    `;

    // Filter members that haven't used their joker yet
    const playerSelect = document.getElementById('joker-player-select');
    playerSelect.innerHTML = '';

    const members = store.getMembers();
    let countEligible = 0;

    members.forEach(m => {
      const status = store.getJokerStatus(m.id);
      if (status.status !== 'used') {
        countEligible++;
        const opt = document.createElement('option');
        opt.value = m.id;
        const isPendingHere = evt.pendingJokers && evt.pendingJokers.includes(m.id);
        opt.textContent = `${(m.avatar && !isImageAvatar(m.avatar)) ? m.avatar + ' ' : ''}${m.name} ${isPendingHere ? '(bereits für dieses Event gesetzt)' : ''}`;
        playerSelect.appendChild(opt);
      }
    });

    if (countEligible === 0) {
      playerSelect.innerHTML = '<option disabled>Alle 8 Freunde haben ihren Joker bereits verbraucht!</option>';
    }

    document.getElementById('modal-register-joker').classList.add('open');
  }

  document.getElementById('form-register-joker').addEventListener('submit', (e) => {
    e.preventDefault();
    const eventId = Number(document.getElementById('joker-target-event-id').value);
    const playerId = Number(document.getElementById('joker-player-select').value);

    if (!playerId) return;

    const res = store.registerJoker(playerId, eventId);
    if (res.success) {
      closeAllModals();
      showToast(res.message, '⚡');
      renderEvents();
      renderLeaderboard();
    } else {
      alert(res.message);
    }
  });

  // Wire photo input and emoji reset handlers for member profile editor
  const memberPhotoInput = document.getElementById('edit-member-photo-input');
  if (memberPhotoInput) {
    memberPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Center crop to 180x180 square JPEG
          const canvas = document.createElement('canvas');
          const size = 180;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          currentEditingAvatar = dataUrl;
          updateEditAvatarPreview(currentEditingAvatar);
          const emojiInp = document.getElementById('edit-member-avatar');
          if (emojiInp) emojiInp.value = '';
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const btnResetAvatarEmoji = document.getElementById('btn-reset-avatar-emoji');
  if (btnResetAvatarEmoji) {
    btnResetAvatarEmoji.addEventListener('click', () => {
      currentEditingAvatar = '👤';
      const emojiInp = document.getElementById('edit-member-avatar');
      if (emojiInp) emojiInp.value = '👤';
      updateEditAvatarPreview('👤');
    });
  }

  const memberEmojiInput = document.getElementById('edit-member-avatar');
  if (memberEmojiInput) {
    memberEmojiInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentEditingAvatar = val;
        updateEditAvatarPreview(val);
      }
    });
  }

  document.getElementById('form-edit-member').addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = Number(document.getElementById('edit-member-id').value);
    const currentUserId = store.getCurrentUserId();
    const isAdmin = store.isAdmin();

    if (!isAdmin && memberId !== Number(currentUserId)) {
      showToast('Zugriff verweigert: Nur eigenes Profil änderbar!', '🔒');
      return;
    }

    const member = store.getMember(memberId);
    if (!member) return;

    const emojiVal = document.getElementById('edit-member-avatar').value.trim();
    const finalAvatar = currentEditingAvatar || emojiVal || member.avatar || '👤';
    const nameVal = document.getElementById('edit-member-name').value.trim();
    const nicknameVal = document.getElementById('edit-member-nickname').value.trim();

    store.updateMember(memberId, {
      name: nameVal || member.name,
      nickname: nicknameVal,
      avatar: finalAvatar
    });

    closeAllModals();
    showToast('Profil aktualisiert! ☀️', finalAvatar);
    refreshActiveView();

    // Ensure immediate cloud push to Supabase
    try {
      const res = await store.pushMemberToCloud(store.getMember(memberId));
      if (res && res.error) {
        console.warn('pushMemberToCloud fehler:', res.error);
      }
    } catch (err) {
      console.warn('Fehler beim Speichern in Cloud:', err);
    }
  });

  // Admin Single PIN Reset inside Edit Member modal
  const btnAdminResetSinglePin = document.getElementById('btn-admin-reset-single-pin');
  if (btnAdminResetSinglePin) {
    btnAdminResetSinglePin.addEventListener('click', () => {
      const memberId = Number(document.getElementById('edit-member-id').value);
      const member = store.getMember(memberId);
      if (!member) return;

      if (confirm(`Möchtest du die PIN für ${member.name} wirklich auf den Standard 1234 zurücksetzen?`)) {
        const res = store.adminResetMemberPin(memberId, '1234');
        if (res && res.success) {
          showToast(`PIN für ${member.name} wurde auf 1234 zurückgesetzt!`, '🔑');
        } else {
          showToast((res && res.message) || 'Fehler beim Zurücksetzen der PIN', '❌');
        }
      }
    });
  }

  // --- Change PIN Controller ---
  document.getElementById('btn-open-change-pin').addEventListener('click', () => {
    document.getElementById('change-pin-old').value = '';
    document.getElementById('change-pin-new').value = '';
    document.getElementById('change-pin-confirm').value = '';
    document.getElementById('modal-change-pin').classList.add('open');
  });

  document.getElementById('form-change-pin').addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPin = document.getElementById('change-pin-old').value;
    const newPin = document.getElementById('change-pin-new').value;
    const confirmPin = document.getElementById('change-pin-confirm').value;

    if (newPin !== confirmPin) {
      showToast('Die neuen PINs stimmen nicht überein!', '❌');
      return;
    }

    let res;
    if (store.isAdmin()) {
      res = store.updateAdminPin(oldPin, newPin);
    } else {
      res = store.updateMemberPin(store.getCurrentUserId(), oldPin, newPin);
    }

    if (res.success) {
      closeAllModals();
      showToast(res.message, '🔑');
    } else {
      showToast(res.message, '❌');
    }
  });

  // Logout
  document.getElementById('btn-logout-account').addEventListener('click', () => {
    store.logout();
    showToast('Erfolgreich abgemeldet.', '🚪');
    openUserPickerModal();
  });

  // --- Admin Panel Controller ---
  document.getElementById('btn-open-admin-panel').addEventListener('click', () => {
    openAdminPanel();
  });

  function openAdminPanel() {
    const isAdmin = store.isAdmin();
    const gate = document.getElementById('admin-auth-gate');
    const content = document.getElementById('admin-content-area');

    if (isAdmin) {
      gate.style.display = 'none';
      content.style.display = 'block';
      renderAdminAllocations();
    } else {
      gate.style.display = 'block';
      content.style.display = 'none';
      document.getElementById('admin-gate-pin-input').value = '';
    }

    document.getElementById('modal-admin-panel').classList.add('open');
  }

  document.getElementById('btn-admin-gate-submit').addEventListener('click', () => {
    const enteredPin = document.getElementById('admin-gate-pin-input').value;
    if (store.verifyAdminPin(enteredPin)) {
      document.getElementById('admin-auth-gate').style.display = 'none';
      document.getElementById('admin-content-area').style.display = 'block';
      renderAdminAllocations();
      showToast('Admin-Zugriff freigeschaltet! 🛡️', '✅');
    } else {
      showToast('Falsche Admin-PIN', '❌');
    }
  });

  function renderAdminAllocations() {
    const container = document.getElementById('admin-allocations-list');
    container.innerHTML = '';
    const events = store.getEvents();
    const members = store.getMembers();

    events.forEach(evt => {
      const row = document.createElement('div');
      row.className = 'admin-allocation-row';
      const isCompleted = evt.status === 'completed';
      const isSpecial = evt.isSpecial || evt.id === 9;

      let options = '';
      if (isSpecial) {
        options = `
          <option value="auto" ${!evt.isOrganizerOverridden ? 'selected' : ''}>
            🤖 Auto (Tabellenletzter nach Spieltag 8)
          </option>
        ` + members.map(m => `
          <option value="${m.id}" ${(evt.isOrganizerOverridden && m.id === evt.organizerId) ? 'selected' : ''}>
            ${(m.avatar && !isImageAvatar(m.avatar)) ? m.avatar + ' ' : ''}${m.name} (Manuell überschreiben)
          </option>
        `).join('');
      } else {
        options = members.map(m => `
          <option value="${m.id}" ${m.id === evt.organizerId ? 'selected' : ''}>
            ${(m.avatar && !isImageAvatar(m.avatar)) ? m.avatar + ' ' : ''}${m.name}
          </option>
        `).join('');
      }

      row.innerHTML = `
        <div class="admin-event-info">
          <div class="admin-event-title">
            ${isSpecial ? '🥩 Spezial: ' + evt.title : 'Spieltag ' + evt.round + ': ' + evt.title}
            ${isCompleted ? '<span style="font-size: 0.68rem; color: #10b981; font-weight: 700; margin-left: 6px;">(✓ Abgeschlossen)</span>' : ''}
          </div>
          <div class="admin-event-sub">📅 ${formatDate(evt.date)} • ${evt.time}</div>
        </div>
        <div>
          <select class="admin-org-select" data-event-id="${evt.id}" ${isCompleted ? 'disabled style="opacity: 0.6; cursor: not-allowed;" title="Abgeschlossene Spieltage können nicht mehr geändert werden"' : ''}>
            ${options}
          </select>
        </div>
      `;
      container.appendChild(row);
    });

    // Populate member reset dropdown
    const resetSelect = document.getElementById('admin-reset-member-select');
    resetSelect.innerHTML = '';
    members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${(m.avatar && !isImageAvatar(m.avatar)) ? m.avatar + ' ' : ''}${m.name}`;
      resetSelect.appendChild(opt);
    });
  }

  document.getElementById('form-admin-allocations').addEventListener('submit', (e) => {
    e.preventDefault();
    const selects = document.querySelectorAll('.admin-org-select');
    selects.forEach(sel => {
      if (!sel.disabled) {
        const eventId = Number(sel.getAttribute('data-event-id'));
        const val = sel.value;
        const newOrgId = val === 'auto' ? 'auto' : Number(val);
        store.assignEventOrganizer(eventId, newOrgId);
      }
    });

    closeAllModals();
    showToast('Spieltage erfolgreich den Freunden zugeteilt! 💾', '🛡️');
    refreshActiveView();
  });

  document.getElementById('btn-admin-reset-pin-execute').addEventListener('click', () => {
    const memberId = Number(document.getElementById('admin-reset-member-select').value);
    const member = store.getMember(memberId);
    if (!member) return;

    if (confirm(`PIN für ${member.name} wirklich auf Standard (1234) zurücksetzen?`)) {
      const res = store.adminResetMemberPin(memberId, '1234');
      showToast(res.message, '🔑');
    }
  });

  // Modal 4: WhatsApp Share Generator
  function generateWhatsAppText() {
    const leaderboard = store.getLeaderboard();
    const completedEvents = store.getEvents().filter(e => e.status === 'completed' && !e.isSpecial && e.id !== 9);
    const nextUpcoming = store.getEvents().find(e => e.status !== 'completed');

    let text = `☀️ *FREUNDE DER SONNE 2026* ☀️\n`;
    text += `Stand nach Spieltag ${completedEvents.length} von 8:\n\n`;

    leaderboard.forEach(p => {
      const emoji = p.rank === 1 ? '👑' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank === 8 ? '🥩' : '▫️';
      const jokerFlag = p.jokerInfo.status === 'used' ? ' [Joker genutzt]' : '';
      text += `${emoji} *${p.rank}. ${p.name}* – ${p.totalPoints} Pkt.${jokerFlag}\n`;
    });

    const minPoints = leaderboard.length > 0 ? leaderboard[leaderboard.length - 1].totalPoints : 0;
    const tiedLosers = leaderboard.filter(p => p.totalPoints === minPoints);
    if (tiedLosers.length > 0) {
      if (tiedLosers.length > 1) {
        const names = tiedLosers.map(l => l.name).join(' & ');
        text += `\n🥶 *Grill-Alarm:* ${names} stehen aktuell punktgleich am Grill fürs Wintergrillen! 🌭🔥\n`;
      } else {
        text += `\n🥶 *Grill-Alarm:* ${tiedLosers[0].name} steht aktuell am Grill fürs Wintergrillen! 🌭🔥\n`;
      }
    }

    if (nextUpcoming) {
      const org = store.getMember(nextUpcoming.organizerId)?.name || 'TBD';
      if (nextUpcoming.isSpecial || nextUpcoming.id === 9) {
        text += `\n🔥 *Jahres-Highlight: Traditionelles Wintergrillen 2026:*\n`;
      } else {
        text += `\n📅 *Nächster Spieltag (${nextUpcoming.round}/8):*\n`;
      }
      text += `🏆 *${nextUpcoming.title}*\n`;
      text += `🗓 ${formatDate(nextUpcoming.date)} um ${nextUpcoming.time}\n`;
      text += `📍 Treffpunkt: ${nextUpcoming.location}\n`;
      text += `👤 Orga: ${org}\n`;
      if (nextUpcoming.packingList && nextUpcoming.packingList.length > 0) {
        const itemsStr = nextUpcoming.packingList
          .map(item => typeof item === 'string' ? item : (item.text || ''))
          .filter(Boolean)
          .join(', ');
        if (itemsStr) {
          text += `🎒 Mitbringen: ${itemsStr}\n`;
        }
      }
      if (nextUpcoming.pendingJokers && nextUpcoming.pendingJokers.length > 0) {
        text += `🎭 Geheime Joker: ${nextUpcoming.pendingJokers.length} angemeldet (wird am Ende aufgelöst!)\n`;
      }
    }

    const appUrl = window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : '';
    if (appUrl) {
      text += `\n🔗 *App öffnen:* ${appUrl}\n`;
    }
    text += `\n_Erstellt mit der Freunde der Sonne Web-App ☀️_`;
    return text;
  }

  function openWhatsAppModal() {
    const text = generateWhatsAppText();
    document.getElementById('whatsapp-text-content').textContent = text;
    document.getElementById('modal-share-whatsapp').classList.add('open');
  }

  document.getElementById('btn-share-trigger').addEventListener('click', openWhatsAppModal);
  document.getElementById('btn-share-whatsapp-tab').addEventListener('click', openWhatsAppModal);

  // Robust clipboard copy function supporting iOS Safari on HTTP/IP addresses
  function copyTextToClipboard(text) {
    return new Promise((resolve, reject) => {
      // 1. Try modern clipboard API if in secure context
      if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(resolve).catch(() => {
          execFallbackCopy(text).then(resolve).catch(reject);
        });
      } else {
        execFallbackCopy(text).then(resolve).catch(reject);
      }
    });
  }

  function execFallbackCopy(text) {
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '-9999px';
        ta.style.width = '2em';
        ta.style.height = '2em';
        ta.style.padding = '0';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.boxShadow = 'none';
        ta.style.background = 'transparent';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);

        ta.focus();
        ta.setSelectionRange(0, 999999);

        const success = document.execCommand('copy');
        document.body.removeChild(ta);
        if (success) {
          resolve();
        } else {
          reject(new Error('execCommand copy unsuccesful'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  document.getElementById('btn-copy-whatsapp').addEventListener('click', () => {
    const text = document.getElementById('whatsapp-text-content').textContent;
    copyTextToClipboard(text).then(() => {
      showToast('In Zwischenablage kopiert! Bereit zum Senden in WhatsApp 📲', '📋');
      closeAllModals();
    }).catch(() => {
      const preview = document.getElementById('whatsapp-text-content');
      if (preview && window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(preview);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      showToast('Text markiert – bitte kurz "Kopieren" antippen!', 'ℹ️');
    });
  });

  const btnDirectWhatsApp = document.getElementById('btn-open-whatsapp-direct');
  if (btnDirectWhatsApp) {
    btnDirectWhatsApp.addEventListener('click', () => {
      const text = document.getElementById('whatsapp-text-content').textContent;
      const encoded = encodeURIComponent(text);
      window.location.href = `whatsapp://send?text=${encoded}`;
      closeAllModals();
    });
  }

  // --- 8. Data Export, Import & Reset ---
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `freunde_der_sonne_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Daten als JSON exportiert', '📤');
  });

  document.getElementById('btn-import-data-trigger').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  document.getElementById('import-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.members && parsed.events) {
          store.state = parsed;
          store.save();
          showToast('Spielstand erfolgreich importiert!', '📥');
          renderLeaderboard();
        } else {
          alert('Ungültiges Dateiformat.');
        }
      } catch (err) {
        alert('Fehler beim Lesen der Datei.');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('Möchtest du wirklich alle Daten auf die ursprünglichen Demodaten zurücksetzen?')) {
      store.reset();
      showToast('Demodaten wiederhergestellt!', '🔄');
      renderLeaderboard();
      renderEvents();
      renderMembers();
    }
  });

  // Helper date formatter
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
        const dayPrefix = days[d.getDay()] || '';
        return `${dayPrefix} ${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  // --- Supabase Cloud Settings Modal Controller ---
  function openSupabaseSettingsModal() {
    if (!store.isAdmin()) {
      showToast('Nur die Spielleitung kann die Cloud-Verbindung konfigurieren.', '🔒');
      return;
    }
    const creds = window.fdsSupabase ? window.fdsSupabase.getCredentials() : { url: '', anonKey: '' };
    const urlInput = document.getElementById('supabase-input-url');
    const keyInput = document.getElementById('supabase-input-key');
    const infoBox = document.getElementById('supabase-status-info');

    if (urlInput) urlInput.value = creds.url;
    if (keyInput) keyInput.value = creds.anonKey;

    if (infoBox) {
      if (window.fdsSupabase && window.fdsSupabase.isConfigured()) {
        infoBox.style.display = 'block';
        infoBox.style.background = 'rgba(16, 185, 129, 0.12)';
        infoBox.style.color = '#34d399';
        infoBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        infoBox.innerHTML = `🟢 <strong>Verbunden mit Supabase:</strong><br><span style="word-break: break-all; font-size: 0.7rem;">${creds.url}</span>`;
      } else {
        infoBox.style.display = 'block';
        infoBox.style.background = 'rgba(245, 158, 11, 0.1)';
        infoBox.style.color = 'var(--sun-gold)';
        infoBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        infoBox.innerHTML = `ℹ️ <strong>Noch nicht verbunden:</strong> Die Daten werden derzeit lokal auf diesem Gerät gespeichert. Trage URL und Anon-Key deines Supabase-Projekts ein, um die Live-Synchronisation zu aktivieren.`;
      }
    }

    document.getElementById('modal-supabase-settings').classList.add('open');
  }

  const btnCloudStatus = document.getElementById('btn-cloud-status');
  if (btnCloudStatus) {
    btnCloudStatus.addEventListener('click', openSupabaseSettingsModal);
  }

  const btnOpenSupabase = document.getElementById('btn-open-supabase-settings');
  if (btnOpenSupabase) {
    btnOpenSupabase.addEventListener('click', openSupabaseSettingsModal);
  }

  const formSupabase = document.getElementById('form-supabase-settings');
  if (formSupabase) {
    formSupabase.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('supabase-input-url').value.trim();
      const anonKey = document.getElementById('supabase-input-key').value.trim();

      if (!url || !anonKey) return;

      if (window.fdsSupabase) {
        window.fdsSupabase.setCredentials(url, anonKey);
        closeAllModals();
        showToast('Verbinde mit Supabase...', '☁️');
        const success = await store.initCloudSync();
        if (success) {
          showToast('Erfolgreich mit Supabase verbunden! 🟢', '☁️');
        } else {
          showToast('Konnte nicht mit Supabase verbinden. Bitte URL/Key prüfen.', '❌');
        }
      }
    });
  }

  const btnDisconnectSupabase = document.getElementById('btn-disconnect-supabase');
  if (btnDisconnectSupabase) {
    btnDisconnectSupabase.addEventListener('click', () => {
      if (confirm('Möchtest du die Cloud-Verbindung trennen? (Deine lokalen Daten bleiben erhalten)')) {
        if (window.fdsSupabase) {
          window.fdsSupabase.setCredentials('', '');
        }
        store.updateCloudStatus('offline', 'Lokal');
        closeAllModals();
        showToast('Cloud-Verbindung getrennt (Lokal-Modus). 💾', 'ℹ️');
      }
    });
  }

  // =========================================================
  // --- Push Notifications Controller (Apple iOS Web Push) ---
  // =========================================================
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  async function updatePushNotificationButtonState() {
    const btns = document.querySelectorAll('.btn-push-toggle, #btn-toggle-push-notifications');
    if (!btns || btns.length === 0) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      btns.forEach(btn => {
        if (isIOS && !isStandalone) {
          btn.innerHTML = '<span>📲</span> Zum Home-Bildschirm hinzufügen für Push';
          btn.style.color = 'var(--text-muted)';
          btn.style.borderColor = 'var(--border-glass)';
        } else {
          btn.innerHTML = '<span>⚠️</span> Mitteilungen nicht unterstützt';
          btn.disabled = true;
        }
      });
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      // Automatische Erneuerung des Push-Abonnements bei VAPID-Key Rotation
      if (sub && window.FDS_VAPID_PUBLIC_KEY) {
        try {
          const expectedKeyBytes = urlBase64ToUint8Array(window.FDS_VAPID_PUBLIC_KEY);
          const currentKeyBuffer = sub.options ? sub.options.applicationServerKey : null;
          let needsUpdate = false;
          if (currentKeyBuffer) {
            const currentBytes = new Uint8Array(currentKeyBuffer);
            if (currentBytes.length !== expectedKeyBytes.length) {
              needsUpdate = true;
            } else {
              for (let i = 0; i < currentBytes.length; i++) {
                if (currentBytes[i] !== expectedKeyBytes[i]) {
                  needsUpdate = true;
                  break;
                }
              }
            }
          }
          if (needsUpdate) {
            console.log('🔄 VAPID-Schlüssel aktualisiert – erneuere Push-Abonnement automatisch...');
            const oldEndpoint = sub.endpoint;
            await sub.unsubscribe();
            const client = window.fdsSupabase ? window.fdsSupabase.getClient() : null;
            if (client) {
              await client.from('push_subscriptions').delete().eq('endpoint', oldEndpoint);
            }
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: expectedKeyBytes
            });
            const currentUserId = store.getCurrentUserId();
            const subRecord = {
              endpoint: sub.endpoint,
              p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
              auth: arrayBufferToBase64(sub.getKey('auth')),
              user_id: typeof currentUserId === 'number' ? currentUserId : null,
              user_agent: navigator.userAgent,
              updated_at: new Date().toISOString()
            };
            if (client) {
              await client.from('push_subscriptions').upsert(subRecord, { onConflict: 'endpoint' });
            }
            console.log('✅ Push-Abonnement mit neuem Schlüssel erneuert.');
          }
        } catch (autoRenewErr) {
          console.warn('Hinweis beim Prüfen des VAPID-Schlüssels:', autoRenewErr);
        }
      }

      btns.forEach(btn => {
        if (sub) {
          btn.innerHTML = '<span>🔔</span> Mitteilungen aktiv (Ausschalten)';
          btn.style.color = '#34d399';
          btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else {
          btn.innerHTML = '<span>🔔</span> Mitteilungen auf diesem iPhone aktivieren';
          btn.style.color = 'var(--sun-gold)';
          btn.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
      });
    } catch (err) {
      console.warn('Fehler beim Prüfen der Push-Subscription:', err);
    }
  }

  async function togglePushNotifications() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isIOS && !isStandalone) {
      alert('Wichtig für iOS / iPhone:\n\nUm Push-Mitteilungen auf dem iPhone zu erhalten, tippe unten in Safari auf das Teilen-Symbol (Viereck mit Pfeil nach oben) und wähle "Zum Home-Bildschirm".\n\nÖffne die App danach über das Icon auf deinem Home-Bildschirm!');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push-Mitteilungen werden von diesem Browser oder Modus leider nicht unterstützt.');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        // Unsubscribe
        const unsubscribed = await existingSub.unsubscribe();
        if (unsubscribed) {
          const client = window.fdsSupabase ? window.fdsSupabase.getClient() : null;
          if (client) {
            await client.from('push_subscriptions').delete().eq('endpoint', existingSub.endpoint);
          }
          showToast('Mitteilungen auf diesem Gerät deaktiviert.', '🔕');
          updatePushNotificationButtonState();
        }
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Mitteilungen wurden nicht erlaubt.', '⚠️');
        return;
      }

      const vapidKey = window.FDS_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        showToast('VAPID Public Key nicht konfiguriert.', '❌');
        return;
      }

      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      const client = window.fdsSupabase ? window.fdsSupabase.getClient() : null;
      const currentUserId = store.getCurrentUserId();
      const subRecord = {
        endpoint: newSub.endpoint,
        p256dh: arrayBufferToBase64(newSub.getKey('p256dh')),
        auth: arrayBufferToBase64(newSub.getKey('auth')),
        user_id: typeof currentUserId === 'number' ? currentUserId : null,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      };

      if (client) {
        const { error } = await client.from('push_subscriptions').upsert(subRecord, { onConflict: 'endpoint' });
        if (error) {
          console.error('Fehler beim Speichern der Subscription in Supabase:', error);
        }
      }

      showToast('Mitteilungen für dieses iPhone aktiviert! 🔔', '✅');
      updatePushNotificationButtonState();
    } catch (err) {
      console.error('Fehler beim Aktivieren von Push:', err);
      showToast('Fehler: ' + (err.message || 'Push-Aktivierung fehlgeschlagen'), '❌');
    }
  }

  async function dispatchPushNotification({ title, body, eventId, url }) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const customSecret = localStorage.getItem('fds_notify_secret');
      if (customSecret) {
        headers['x-fds-secret'] = customSecret;
      }
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ title, body, eventId, url })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sent > 0) {
          showToast(`📲 Push an ${data.sent} Gerät(e) gesendet!`, '🔔');
        } else {
          console.log('Push-Anfrage erfolgreich, aber derzeit keine aktiven Abonnenten.');
        }
      } else {
        console.warn('Push API antwortete mit Fehler:', res.status);
      }
    } catch (err) {
      console.warn('Netzwerkfehler beim Senden der Push-Mitteilung:', err);
    }
  }

  // Admin Send Test Push Button
  const btnAdminTestPush = document.getElementById('btn-admin-send-test-push');
  if (btnAdminTestPush) {
    btnAdminTestPush.addEventListener('click', async () => {
      showToast('Sende Test-Push an alle Geräte...', '📲');
      await dispatchPushNotification({
        title: '☀️ Freunde der Sonne (Test)',
        body: 'Push-Mitteilungen aufs iPhone funktionieren einwandfrei!',
        eventId: 0,
        url: '/'
      });
    });
  }

  // --- Location Autocomplete via OpenStreetMap / Photon ---
  function initLocationAutocomplete() {
    const input = document.getElementById('edit-event-location');
    const dropdown = document.getElementById('location-suggestions-dropdown');
    const spinner = document.getElementById('location-spinner');
    const mapBtn = document.getElementById('btn-open-map-preview');
    if (!input || !dropdown) return;

    let debounceTimer = null;

    window.fdsUpdateLocationMapBtn = function(query) {
      if (!mapBtn) return;
      const clean = (query || '').trim();
      const isValid = clean && !clean.toLowerCase().includes('wird von') && !clean.toLowerCase().includes('bekannt gegeben');
      if (isValid) {
        mapBtn.href = `https://maps.apple.com/?q=${encodeURIComponent(clean)}`;
        mapBtn.style.display = 'inline-flex';
      } else {
        mapBtn.style.display = 'none';
      }
    };

    input.addEventListener('input', () => {
      const query = input.value.trim();
      window.fdsUpdateLocationMapBtn(query);
      clearTimeout(debounceTimer);

      if (query.length < 3) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        if (spinner) spinner.style.display = 'none';
        return;
      }

      if (spinner) spinner.style.display = 'block';

      debounceTimer = setTimeout(async () => {
        try {
          // OpenStreetMap Photon geocoding API (optimized for German place search & address autocomplete)
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=de&limit=5`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Photon response error');
          const data = await res.json();

          const features = (data && data.features) ? data.features : [];
          dropdown.innerHTML = '';

          if (features.length === 0) {
            dropdown.style.display = 'none';
            if (spinner) spinner.style.display = 'none';
            return;
          }

          features.forEach(f => {
            const p = f.properties || {};
            const name = p.name || `${p.street || ''} ${p.housenumber || ''}`.trim() || 'Ort';
            
            const parts = [];
            if (p.street && p.name && p.name !== p.street) {
              parts.push(`${p.street} ${p.housenumber || ''}`.trim());
            }
            if (p.postcode || p.city || p.district) {
              parts.push(`${p.postcode || ''} ${p.city || p.district || ''}`.trim());
            }
            if (p.state && p.state !== p.city) {
              parts.push(p.state);
            }
            const subtitle = parts.filter(Boolean).join(', ');

            let fullAddress = name;
            if (subtitle && !name.includes(p.city || '')) {
              fullAddress = `${name} (${subtitle})`;
            } else if (subtitle) {
              fullAddress = `${name}, ${subtitle}`;
            }

            const item = document.createElement('div');
            item.className = 'location-suggestion-item';
            item.innerHTML = `
              <span class="suggestion-icon">📍</span>
              <div class="suggestion-content">
                <span class="suggestion-title">${name}</span>
                ${subtitle ? `<span class="suggestion-subtitle">${subtitle}</span>` : ''}
              </div>
            `;

            item.addEventListener('click', () => {
              input.value = fullAddress;
              dropdown.style.display = 'none';
              dropdown.innerHTML = '';
              window.fdsUpdateLocationMapBtn(fullAddress);
            });

            dropdown.appendChild(item);
          });

          dropdown.style.display = 'block';
        } catch (err) {
          console.warn('Hinweis bei der Ortssuche:', err);
          dropdown.style.display = 'none';
        } finally {
          if (spinner) spinner.style.display = 'none';
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  // =========================================================
  // TIMBERSPORTS AUDIO ENGINE & HELPERS (WEB AUDIO API)
  // =========================================================

  const fdsAudio = (() => {
    let ctx = null;
    let isMuted = localStorage.getItem('fds_sound_muted') === 'true';

    function getCtx() {
      if (isMuted) return null;
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    return {
      isMuted() { return isMuted; },
      toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem('fds_sound_muted', isMuted ? 'true' : 'false');
        return isMuted;
      },
      unlock() {
        if (!ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) ctx = new AudioCtx();
        }
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      },
      playTick(isUrgent = false) {
        const c = getCtx();
        if (!c) return;
        try {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(isUrgent ? 880 : 520, c.currentTime);
          gain.gain.setValueAtTime(isUrgent ? 0.22 : 0.12, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
          osc.stop(c.currentTime + 0.08);
        } catch (e) {}
      },
      playBuzzer() {
        const c = getCtx();
        if (!c) return;
        try {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, c.currentTime);
          osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.35);
          gain.gain.setValueAtTime(0.28, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
          osc.stop(c.currentTime + 0.35);
        } catch (e) {}
      },
      playPlopp() {
        const c = getCtx();
        if (!c) return;
        try {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, c.currentTime);
          osc.frequency.exponentialRampToValueAtTime(780, c.currentTime + 0.12);
          gain.gain.setValueAtTime(0.35, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
          osc.stop(c.currentTime + 0.15);
        } catch (e) {}
      },
      playJoker() {
        const c = getCtx();
        if (!c) return;
        try {
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, c.currentTime + (i * 0.07));
            gain.gain.setValueAtTime(0.001, c.currentTime + (i * 0.07));
            gain.gain.linearRampToValueAtTime(0.25, c.currentTime + (i * 0.07) + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (i * 0.07) + 0.28);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime + (i * 0.07));
            osc.stop(c.currentTime + (i * 0.07) + 0.28);
          });
        } catch (e) {}
      },
      playFanfare() {
        const c = getCtx();
        if (!c) return;
        try {
          [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, c.currentTime + (i * 0.09));
            gain.gain.setValueAtTime(0.2, c.currentTime + (i * 0.09));
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (i * 0.09) + 0.35);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime + (i * 0.09));
            osc.stop(c.currentTime + (i * 0.09) + 0.35);
          });
        } catch (e) {}
      }
    };
  })();

  // Prime & unlock iOS Safari Web Audio on first user tap/pointerdown anywhere on screen
  document.addEventListener('pointerdown', () => {
    fdsAudio.unlock();
  }, { once: true, passive: true });

  function openBeerSteckbrief(beerName) {
    const profile = (typeof BEER_PROFILES !== 'undefined' && BEER_PROFILES[beerName]) ? BEER_PROFILES[beerName] : {
      brewery: 'Brauspezialität',
      location: 'Deutschland',
      abv: '5,0 % vol.',
      style: 'Vollbier',
      funFact: 'Ein echtes Traditionsbier, gebraut nach dem deutschen Reinheitsgebot von 1516.'
    };

    const titleEl = document.getElementById('modal-steckbrief-title');
    const breweryEl = document.getElementById('modal-steckbrief-brewery');
    const bodyEl = document.getElementById('modal-steckbrief-body');

    if (titleEl) titleEl.textContent = beerName;
    if (breweryEl) breweryEl.textContent = profile.brewery;

    const quiz = store.getTimbersportsQuiz();
    const bt = quiz.beerTasting;
    const members = store.getMembers();

    const roundIndices = [];
    (bt.solutions || []).forEach((sol, rIdx) => {
      if (sol === beerName) roundIndices.push(rIdx);
    });

    let guessersHtml = '';
    if (roundIndices.length > 0) {
      const correctFriends = [];
      members.forEach(m => {
        const myGuesses = bt.guesses && bt.guesses[m.id];
        if (myGuesses) {
          const hit = roundIndices.some(rIdx => myGuesses[rIdx] === beerName);
          if (hit) correctFriends.push(m);
        }
      });

      if (correctFriends.length > 0) {
        guessersHtml = `
          <div style="font-size: 0.74rem; font-weight: 800; color: #34d399; margin-bottom: 6px;">
            ✓ Richtig blind erkannt von (${correctFriends.length}):
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${correctFriends.map(f => `
              <span class="ts-joker-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4);">
                ${renderAvatar(f.avatar)} ${f.name}
              </span>
            `).join('')}
          </div>
        `;
      } else {
        guessersHtml = `<div style="font-size: 0.78rem; color: var(--text-muted);">Keiner der Freunde hat dieses Bier blind erraten! 🙈</div>`;
      }
    } else {
      guessersHtml = `<div style="font-size: 0.78rem; color: var(--text-muted);">Dieses Bier war im offiziellen 25er-Pool enthalten.</div>`;
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="ts-steckbrief-grid">
          <div class="ts-steckbrief-stat">
            <div class="ts-steckbrief-stat-label">Alkoholgehalt</div>
            <div class="ts-steckbrief-stat-value">${profile.abv}</div>
          </div>
          <div class="ts-steckbrief-stat">
            <div class="ts-steckbrief-stat-label">Bierstil</div>
            <div class="ts-steckbrief-stat-value">${profile.style}</div>
          </div>
          <div class="ts-steckbrief-stat" style="grid-column: span 2;">
            <div class="ts-steckbrief-stat-label">Herkunft & Brauort</div>
            <div class="ts-steckbrief-stat-value">📍 ${profile.location}</div>
          </div>
        </div>

        <div class="ts-steckbrief-fact-card">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span>💡</span>
            <span style="font-weight: 800; font-size: 0.8rem; color: var(--sun-gold);">Brauerei-Fact</span>
          </div>
          <p style="font-size: 0.82rem; color: rgba(255,255,255,0.9); margin: 0; line-height: 1.45;">
            ${profile.funFact}
          </p>
        </div>

        <div class="ts-steckbrief-friends-section">
          ${guessersHtml}
        </div>
      `;
    }

    openModal('modal-beer-steckbrief');
  }

  // =========================================================
  // TIMBERSPORTS & BIERTASTING SPECIAL (SPIELTAG 8) CONTROLLER
  // =========================================================

  function renderTimbersports() {
    const quiz = store.getTimbersportsQuiz();
    const canManage = store.canManageTimbersports();
    const currentUserId = store.getCurrentUserId();
    const members = store.getMembers();

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-ts-sound-toggle');
    const soundIcon = document.getElementById('btn-ts-sound-icon');
    const soundText = document.getElementById('btn-ts-sound-text');
    if (btnSound && soundIcon && soundText) {
      const isMuted = fdsAudio.isMuted();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
      soundText.textContent = isMuted ? 'Sound aus' : 'Sound an';
      btnSound.onclick = () => {
        const nowMuted = fdsAudio.toggleMute();
        soundIcon.textContent = nowMuted ? '🔇' : '🔊';
        soundText.textContent = nowMuted ? 'Sound aus' : 'Sound an';
        triggerHaptic('light');
        if (!nowMuted) fdsAudio.playPlopp();
      };
    }

    // 1. Status Bar for Admin / Tim
    const adminStatusBar = document.getElementById('ts-admin-status-bar');
    const statusDot = document.getElementById('ts-status-dot');
    const statusText = document.getElementById('ts-status-text');
    const btnUnlock = document.getElementById('btn-ts-toggle-unlock');
    const btnArchive = document.getElementById('btn-ts-toggle-archive');

    if (adminStatusBar) {
      if (canManage) {
        adminStatusBar.style.display = 'flex';
        if (quiz.isArchived) {
          statusDot.className = 'ts-status-dot';
          statusText.textContent = '📦 Archiviert: Tab für niemanden sichtbar (auch Tim nicht)';
        } else if (quiz.isUnlockedForAll) {
          statusDot.className = 'ts-status-dot live';
          statusText.textContent = '🌍 Live: Für alle 8 Freunde freigeschaltet';
        } else {
          statusDot.className = 'ts-status-dot';
          statusText.textContent = '🔒 Geheim-Modus: Nur für Tim & Admin sichtbar';
        }

        btnUnlock.innerHTML = quiz.isUnlockedForAll 
          ? '<span>🔒</span> In Geheim-Modus versetzen' 
          : '<span>🔓</span> Für alle Freunde freischalten';
        btnUnlock.className = quiz.isUnlockedForAll ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';

        btnArchive.innerHTML = quiz.isArchived 
          ? '<span>📦</span> Tab archiviert (wieder einblenden)' 
          : '<span>📦</span> Tab archivieren';
      } else {
        adminStatusBar.style.display = 'none';
      }
    }

    // 2. Sub-Navigation Tabs
    const now = Date.now();
    const btCdRunning = Boolean(quiz.beerTasting && quiz.beerTasting.countdown && quiz.beerTasting.countdown.isRunning && quiz.beerTasting.countdown.endsAt && quiz.beerTasting.countdown.endsAt > now);
    const trCdRunning = Boolean(quiz.trivia && quiz.trivia.countdown && quiz.trivia.countdown.isRunning && quiz.trivia.countdown.endsAt && quiz.trivia.countdown.endsAt > now);

    let activeSub = quiz.activeSubTab || 'beer';

    // If an active countdown is running, automatically direct players to the running event
    if (!canManage) {
      if (trCdRunning) {
        activeSub = 'trivia';
        window._localTimbersportsSubTab = null;
      } else if (btCdRunning) {
        activeSub = 'beer';
        window._localTimbersportsSubTab = null;
      } else if (window._localTimbersportsSubTab) {
        activeSub = window._localTimbersportsSubTab;
      }
    }

    // Show/hide Admin-only beerpool tab in subnav
    const beerpoolTabBtn = document.getElementById('ts-tab-beerpool');
    const subnavBar = document.querySelector('.ts-subnav-bar');
    if (beerpoolTabBtn) {
      beerpoolTabBtn.style.display = canManage ? 'inline-flex' : 'none';
      if (subnavBar) subnavBar.classList.toggle('has-admin-tab', canManage);
    }

    document.querySelectorAll('.ts-subnav-btn').forEach(btn => {
      const sub = btn.getAttribute('data-ts-sub');
      btn.classList.toggle('active', sub === activeSub);

      // Pulse badge for active timers
      let pulseSpan = btn.querySelector('.ts-live-pulse-badge');
      const shouldPulse = (sub === 'beer' && btCdRunning) || (sub === 'trivia' && trCdRunning);
      if (shouldPulse) {
        if (!pulseSpan) {
          pulseSpan = document.createElement('span');
          pulseSpan.className = 'ts-live-pulse-badge';
          pulseSpan.textContent = '⏱️';
          btn.appendChild(pulseSpan);
        }
      } else if (pulseSpan) {
        pulseSpan.remove();
      }
    });

    document.querySelectorAll('.ts-subpanel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `ts-subpanel-${activeSub}`);
    });

    // 3. Render Active Subpanel
    if (activeSub === 'beer') renderTimbersportsBeer(quiz, canManage, currentUserId, members);
    if (activeSub === 'saw') renderTimbersportsSaw(quiz, canManage, currentUserId, members);
    if (activeSub === 'trivia') renderTimbersportsTrivia(quiz, canManage, currentUserId, members);
    if (activeSub === 'standings') renderTimbersportsStandings(quiz, canManage, currentUserId, members);
    if (activeSub === 'beerpool') renderTimbersportsBeerPool(quiz, canManage, currentUserId, members);
  }

  // --- Sub-Controller: Biertasting ---
  function renderTimbersportsBeer(quiz, canManage, currentUserId, members) {
    const bt = quiz.beerTasting;
    const cd = bt.countdown;
    const now = Date.now();

    // If countdown is running on a beer, players automatically focus on that active countdown beer
    let activeIdx = bt.activeBeerIndex !== undefined ? bt.activeBeerIndex : 0;
    if (!canManage) {
      if (cd && cd.isRunning && cd.endsAt && cd.endsAt > now && cd.activeBeerIndex !== undefined) {
        activeIdx = cd.activeBeerIndex;
        window._localBeerActiveIdx = cd.activeBeerIndex;
      } else if (window._localBeerActiveIdx !== undefined && window._localBeerActiveIdx !== null) {
        activeIdx = window._localBeerActiveIdx;
      }
    }

    const currentStage = activeIdx < 10 ? 1 : (activeIdx < 20 ? 2 : 3);
    const stageStart = currentStage === 1 ? 0 : (currentStage === 2 ? 10 : 20);
    const stageEnd = currentStage === 1 ? 10 : (currentStage === 2 ? 20 : 25);
    const isStageRevealed = currentStage === 1 ? bt.stage1Revealed : (currentStage === 2 ? bt.stage2Revealed : bt.stage3Revealed);

    // Beer frozen / lock state (persisted per beer!)
    const isBeerFrozen = Boolean(bt.lockedBeers && bt.lockedBeers[activeIdx]);

    // Countdown timing for this beer
    const isCdForActive = Boolean(cd && cd.activeBeerIndex === activeIdx);
    let cdRemaining = 0;
    let cdTotalSecs = 60;
    let isCdRunning = false;
    let isCdExpired = false;

    if (isCdForActive) {
      cdTotalSecs = cd.durationSeconds || 60;
      isCdRunning = Boolean(cd.isRunning);
      cdRemaining = Math.max(0, Math.ceil(((cd.endsAt || now) - now) / 1000));
      isCdExpired = cdRemaining <= 0 || (!isCdRunning && cd.endsAt && now >= cd.endsAt);
    }

    // Audio & Toast notification when a countdown starts for players
    if (!canManage && isCdRunning && cdRemaining > 0) {
      if (window._lastSeenActiveCountdownBeer !== activeIdx) {
        window._lastSeenActiveCountdownBeer = activeIdx;
        fdsAudio.playPlopp();
        triggerHaptic('medium');
        showToast(`⏱️ Spielleiter hat den Countdown für Bier #${activeIdx + 1} gestartet!`, '🍺');
      }
    }

    const isRoundLocked = isStageRevealed || isBeerFrozen || isCdExpired;

    // Update Stage Pills & Click Handlers to switch between Etappe 1, 2, and 3
    document.querySelectorAll('.ts-stage-pill').forEach(pill => {
      const pStage = Number(pill.getAttribute('data-ts-stage'));
      const isLocked = !canManage && (
        (pStage === 2 && !bt.stage1Revealed && bt.activeBeerIndex < 10) ||
        (pStage === 3 && !bt.stage2Revealed && bt.activeBeerIndex < 20)
      );
      pill.classList.toggle('locked', isLocked);
      pill.classList.toggle('active', pStage === currentStage);
      pill.onclick = () => {
        if (isLocked) {
          showToast(`Etappe ${pStage} startet erst nach Aufdeckung der vorherigen Etappe! ⏳`, '🔒');
          return;
        }
        let newIdx = 0;
        if (pStage === 1) newIdx = 0;
        else if (pStage === 2) newIdx = 10;
        else if (pStage === 3) newIdx = 20;

        const curIdx = bt.activeBeerIndex !== undefined ? bt.activeBeerIndex : 0;
        const sStart = pStage === 1 ? 0 : (pStage === 2 ? 10 : 20);
        const sEnd = pStage === 1 ? 10 : (pStage === 2 ? 20 : 25);
        if (curIdx >= sStart && curIdx < sEnd) {
          newIdx = curIdx;
        }

        if (!canManage) {
          window._localBeerActiveIdx = newIdx;
          triggerHaptic('light');
          renderTimbersports();
          return;
        }

        store.setBeerTastingActiveBeer(newIdx);
        triggerHaptic('light');
        renderTimbersports();
      };
    });

    // Served Banner
    const servedNameEl = document.getElementById('ts-served-name');
    const servedTagEl = document.getElementById('ts-served-tag');
    const sol = bt.solutions[activeIdx];
    const userGuesses = (bt.guesses && (bt.guesses[currentUserId] || bt.guesses[String(currentUserId)] || bt.guesses[Number(currentUserId)])) || {};
    const myCurrentGuess = userGuesses[activeIdx] !== undefined ? userGuesses[activeIdx] : userGuesses[String(activeIdx)];

    if (servedNameEl && servedTagEl) {
      if (canManage) {
        servedNameEl.innerHTML = `Bier #${activeIdx + 1}${sol ? ': <strong>' + sol + '</strong>' : ''}`;
        if (isStageRevealed && sol) {
          servedTagEl.textContent = 'Aufgedeckt ✓';
          servedTagEl.style.background = 'rgba(16, 185, 129, 0.25)';
          servedTagEl.style.color = '#34d399';
        } else if (activeIdx === 9 && (isBeerFrozen || isCdExpired) && !bt.stage1Revealed) {
          servedTagEl.textContent = '🏁 Etappe 1 fertig';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else if (activeIdx === 19 && (isBeerFrozen || isCdExpired) && !bt.stage2Revealed) {
          servedTagEl.textContent = '🏁 Etappe 2 fertig';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else if (isBeerFrozen || isCdExpired) {
          servedTagEl.textContent = '🔒 Runde eingefroren';
          servedTagEl.style.background = 'rgba(239, 68, 68, 0.2)';
          servedTagEl.style.color = '#fca5a5';
        } else if (isCdRunning) {
          servedTagEl.textContent = `⏱️ ${cdRemaining}s übrig`;
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else {
          servedTagEl.textContent = 'Bereit';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.2)';
          servedTagEl.style.color = 'var(--sun-gold)';
        }
      } else {
        if (isStageRevealed && sol) {
          servedNameEl.innerHTML = `Bier #${activeIdx + 1}: <strong>${sol}</strong>`;
          if (myCurrentGuess === sol) {
            servedTagEl.textContent = '✓ Richtig getippt!';
            servedTagEl.style.background = 'rgba(16, 185, 129, 0.25)';
            servedTagEl.style.color = '#34d399';
          } else {
            servedTagEl.textContent = myCurrentGuess ? `✗ Falsch (Tipp: ${myCurrentGuess})` : '✗ Falsch (Kein Tipp)';
            servedTagEl.style.background = 'rgba(239, 68, 68, 0.25)';
            servedTagEl.style.color = '#fca5a5';
          }
        } else if (activeIdx === 9 && (isBeerFrozen || isCdExpired) && !bt.stage1Revealed) {
          servedNameEl.textContent = `Probierglas #10 (Etappe 1 Finale)`;
          servedTagEl.textContent = '🏁 Etappe 1 beendet – Auswertung folgt';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else if (activeIdx === 19 && (isBeerFrozen || isCdExpired) && !bt.stage2Revealed) {
          servedNameEl.textContent = `Probierglas #20 (Etappe 2 Finale)`;
          servedTagEl.textContent = '🏁 Etappe 2 beendet – Auswertung folgt';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else if (isBeerFrozen || isCdExpired) {
          servedNameEl.textContent = `Probierglas #${activeIdx + 1}`;
          servedTagEl.textContent = '🔒 Runde eingefroren';
          servedTagEl.style.background = 'rgba(239, 68, 68, 0.2)';
          servedTagEl.style.color = '#fca5a5';
        } else if (isCdRunning) {
          servedNameEl.textContent = `Probierglas #${activeIdx + 1}`;
          servedTagEl.textContent = `⏱️ ${cdRemaining}s übrig`;
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.25)';
          servedTagEl.style.color = 'var(--sun-gold)';
        } else {
          servedNameEl.textContent = `Probierglas #${activeIdx + 1}`;
          servedTagEl.textContent = 'Runde läuft';
          servedTagEl.style.background = 'rgba(245, 158, 11, 0.2)';
          servedTagEl.style.color = 'var(--sun-gold)';
        }
      }
    }

    // Tasting Countdown Banner & Live Ticker
    const cdBanner = document.getElementById('ts-countdown-banner');
    const cdTitle = document.getElementById('ts-countdown-title');
    const cdSubtitle = document.getElementById('ts-countdown-subtitle');
    const cdDigits = document.getElementById('ts-countdown-digits');
    const cdProgress = document.getElementById('ts-countdown-progress-bar');
    const cdIcon = document.getElementById('ts-countdown-icon');

    if (window._tsBeerTimerInterval) {
      clearInterval(window._tsBeerTimerInterval);
      window._tsBeerTimerInterval = null;
    }

    if (cdBanner) {
      if (isStageRevealed) {
        cdBanner.style.display = 'none';
      } else if (isCdForActive) {
        cdBanner.style.display = 'block';
        if (isCdRunning && cdRemaining > 0) {
          cdBanner.className = 'card ts-countdown-banner' + (cdRemaining <= 10 ? ' urgent' : '');
          if (cdIcon) cdIcon.textContent = '⏱️';
          if (cdTitle) cdTitle.textContent = `Verkostungs-Countdown für Bier #${activeIdx + 1}`;
          if (cdSubtitle) cdSubtitle.textContent = `Tippe jetzt, bevor die Zeit abläuft!`;
          if (cdDigits) cdDigits.textContent = cdRemaining;
          if (cdProgress) cdProgress.style.width = `${Math.min(100, Math.max(0, (cdRemaining / cdTotalSecs) * 100))}%`;

          window._tsBeerTimerInterval = setInterval(() => {
            const curNow = Date.now();
            const curRem = Math.max(0, Math.ceil(((cd.endsAt || curNow) - curNow) / 1000));
            const digits = document.getElementById('ts-countdown-digits');
            const prog = document.getElementById('ts-countdown-progress-bar');
            const ban = document.getElementById('ts-countdown-banner');
            const admBadge = document.getElementById('ts-admin-timer-status-badge');
            const sTag = document.getElementById('ts-served-tag');

            if (digits) digits.textContent = curRem;
            if (prog) prog.style.width = `${Math.min(100, Math.max(0, (curRem / cdTotalSecs) * 100))}%`;
            if (ban) {
              if (curRem <= 10 && curRem > 0) ban.classList.add('urgent');
              else ban.classList.remove('urgent');
            }
            if (sTag) {
              sTag.textContent = `⏱️ ${curRem}s übrig`;
              if (curRem <= 10 && curRem > 0) {
                sTag.style.background = 'rgba(239, 68, 68, 0.25)';
                sTag.style.color = '#fca5a5';
              } else {
                sTag.style.background = 'rgba(245, 158, 11, 0.25)';
                sTag.style.color = 'var(--sun-gold)';
              }
            }
            if (admBadge) {
              admBadge.textContent = `Läuft: ${curRem}s`;
              admBadge.className = 'ts-admin-timer-status running';
            }

            if (curRem <= 5 && curRem > 0) {
              fdsAudio.playTick(curRem <= 3);
            }

            if (curRem <= 0) {
              clearInterval(window._tsBeerTimerInterval);
              window._tsBeerTimerInterval = null;
              fdsAudio.playBuzzer();
              triggerHaptic('warning');
              if (canManage) {
                store.setBeerLocked(activeIdx, true);

                // Auto-advance logic for Admin only:
                if (activeIdx === 9) {
                  // End of Etappe 1: Halt and wait for Admin to reveal Etappe 1
                  showToast(`Etappe 1 beendet! Warten auf Auswertung durch den Spielleiter. 🏁`, '⏳');
                } else if (activeIdx === 19) {
                  // End of Etappe 2: Halt and wait for Admin to reveal Etappe 2
                  showToast(`Etappe 2 beendet! Warten auf Auswertung durch den Spielleiter. 🏁`, '⏳');
                } else if (activeIdx >= 24) {
                  // Tasting completely finished
                  showToast(`Biertasting komplett abgeschlossen! 🏆`, '🎉');
                } else {
                  // Auto-advance to next beer
                  const nextBeer = activeIdx + 1;
                  showToast(`Zeit abgelaufen für Bier #${activeIdx + 1}! Weiter zu Bier #${nextBeer + 1} ➔`, '⏱️');
                  store.setBeerTastingActiveBeer(nextBeer);
                }
              } else {
                showToast(`Zeit abgelaufen für Bier #${activeIdx + 1}!`, '⏱️');
              }
              renderTimbersports();
            }
          }, 500);
        } else {
          cdBanner.className = 'card ts-countdown-banner expired';
          if (cdIcon) cdIcon.textContent = '⏳';
          if (cdTitle) cdTitle.textContent = `Zeit abgelaufen für Bier #${activeIdx + 1}!`;
          if (cdSubtitle) cdSubtitle.textContent = `Die Verkostungsrunde ist beendet. Tipps sind für dieses Bier gesperrt.`;
          if (cdDigits) cdDigits.textContent = '0';
          if (cdProgress) cdProgress.style.width = '0%';
        }
      } else {
        cdBanner.style.display = 'none';
      }
    }

    // Horizontal Beer Selector Row
    const selectorRow = document.getElementById('ts-beer-selector-row');
    if (selectorRow) {
      let pillsHtml = '';
      const maxAllowedBeer = bt.activeBeerIndex !== undefined ? bt.activeBeerIndex : 0;
      for (let i = stageStart; i < stageEnd; i++) {
        const isCurrent = i === activeIdx;
        const myGuess = userGuesses[i] !== undefined ? userGuesses[i] : userGuesses[String(i)];
        const isGuessed = Boolean(myGuess);
        const beerSol = bt.solutions[i];
        const isLockedPill = Boolean(bt.lockedBeers && bt.lockedBeers[i]);
        const isFutureLocked = !canManage && i > maxAllowedBeer && !isStageRevealed;

        let extraClass = '';
        let icon = isGuessed ? '✓' : '•';

        if (isFutureLocked) {
          extraClass = 'future-locked';
          icon = '🔒';
        } else if (isStageRevealed && beerSol) {
          if (myGuess && myGuess === beerSol) {
            extraClass = 'stage-correct';
            icon = '✓';
          } else {
            extraClass = 'stage-wrong';
            icon = '✗';
          }
        } else if (isLockedPill) {
          extraClass = isGuessed ? 'guessed locked' : 'locked';
          icon = isGuessed ? '✓' : '🔒';
        } else if (isGuessed) {
          extraClass = 'guessed';
        }

        pillsHtml += `
          <button type="button" class="ts-beer-num-pill ${isCurrent ? 'active' : ''} ${extraClass}" data-idx="${i}" ${isFutureLocked ? 'disabled' : ''} title="Bier #${i + 1}${isFutureLocked ? ' (Noch nicht ausgeschenkt)' : (isLockedPill ? ' (Eingefroren)' : '')}">
            <span class="num">#${i + 1}</span>
            <span class="status-icon">${icon}</span>
          </button>
        `;
      }
      selectorRow.innerHTML = pillsHtml;

      selectorRow.querySelectorAll('.ts-beer-num-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          const maxIdx = bt.activeBeerIndex !== undefined ? bt.activeBeerIndex : 0;
          if (!canManage && idx > maxIdx && !isStageRevealed) {
            showToast(`Bier #${idx + 1} wurde noch nicht ausgeschenkt! ⏳`, '🔒');
            return;
          }
          if (!canManage) {
            window._localBeerActiveIdx = idx;
            triggerHaptic('light');
            renderTimbersports();
            return;
          }
          store.setBeerTastingActiveBeer(idx);
          triggerHaptic('light');
          renderTimbersports();
        });
      });
    }

    // Active Beer Card Header & Options / Live Status
    const titleEl = document.getElementById('ts-current-beer-title');
    const hintEl = document.getElementById('ts-current-beer-hint');
    const pickBadge = document.getElementById('ts-current-pick-badge');
    const gridEl = document.getElementById('ts-beer-options-grid');

    if (canManage) {
      // --- ADMIN VIEW: Does NOT select a beer; monitors friends' submissions live ---
      const activeMembers = members.filter(m => m.id !== 'admin');
      const submittedCount = activeMembers.filter(m => {
        const mGuesses = (bt.guesses && (bt.guesses[m.id] || bt.guesses[String(m.id)] || bt.guesses[Number(m.id)])) || {};
        return Boolean(mGuesses[activeIdx] !== undefined ? mGuesses[activeIdx] : mGuesses[String(activeIdx)]);
      }).length;

      if (titleEl) titleEl.textContent = `📋 Live-Abgaben für Bier #${activeIdx + 1}`;
      if (hintEl) {
        hintEl.innerHTML = `<span style="color:var(--text-secondary);">Übersicht der Freunde – du schenkst als Spielleiter aus und nimmst nicht am Tippspiel teil.</span>`;
      }
      if (pickBadge) {
        pickBadge.textContent = `${submittedCount} / ${activeMembers.length} abgegeben`;
        pickBadge.className = 'ts-current-pick-badge ' + (submittedCount === activeMembers.length ? 'has-pick' : '');
      }

      const jokerSlotEl = document.getElementById('ts-beer-joker-slot');
      if (jokerSlotEl) {
        jokerSlotEl.innerHTML = '';
        jokerSlotEl.style.display = 'none';
      }

      if (gridEl) {
        let gridHtml = '';
        activeMembers.forEach(m => {
          const mGuesses = (bt.guesses && (bt.guesses[m.id] || bt.guesses[String(m.id)] || bt.guesses[Number(m.id)])) || {};
          const mGuess = mGuesses[activeIdx] !== undefined ? mGuesses[activeIdx] : mGuesses[String(activeIdx)];
          const hasGuessed = Boolean(mGuess);

          if (isStageRevealed && sol) {
            const isMatch = mGuess === sol;
            gridHtml += `
              <div class="ts-beer-opt ${isMatch ? 'revealed-correct' : 'revealed-wrong'}" style="pointer-events:none;">
                <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                <span class="beer-name">${m.name}</span>
                <span class="revealed-badge">${isMatch ? '✓ ' + mGuess : '✗ ' + (mGuess || 'Kein Tipp')}</span>
              </div>
            `;
          } else {
            gridHtml += `
              <div class="ts-beer-opt ${hasGuessed ? 'admin-friend-tipped' : ''}" style="pointer-events:none;">
                <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                <span class="beer-name">${m.name}</span>
                <span class="admin-tip-badge ${hasGuessed ? 'tipped' : 'pending'}">
                  ${hasGuessed ? '✓ Eingeloggt' : '⏳ Wartet...'}
                </span>
              </div>
            `;
          }
        });
        gridEl.innerHTML = gridHtml;
      }
    } else {
      // --- PLAYER VIEW: Normal guessing card ---
      if (titleEl) titleEl.textContent = `Tipp für Bier #${activeIdx + 1}`;
      if (hintEl) {
        if (isStageRevealed) {
          if (sol && myCurrentGuess && myCurrentGuess === sol) {
            hintEl.innerHTML = `<span style="color:#34d399; font-weight:700;">✓ Volltreffer! Dein Tipp auf „${sol}“ war genau richtig (+1 Punkt).</span>`;
          } else if (sol) {
            hintEl.innerHTML = `<span style="color:#fca5a5; font-weight:700;">✗ Leider daneben! Dein Tipp: ${myCurrentGuess ? '„' + myCurrentGuess + '“' : '<em>Kein Tipp</em>'} &nbsp;|&nbsp; Wahre Lösung: <strong style="color:#34d399;">${sol}</strong></span>`;
          } else {
            hintEl.textContent = 'Etappe aufgedeckt – Tipps sind gesperrt:';
          }
        } else if (activeIdx === 9 && (isBeerFrozen || isCdExpired) && !bt.stage1Revealed) {
          hintEl.innerHTML = `<span style="color:var(--sun-gold); font-weight:700;">🏁 Runde 10 beendet! Der Spielleiter wertet jetzt Etappe 1 aus und deckt auf. Danach startet automatisch Etappe 2!</span>`;
        } else if (activeIdx === 19 && (isBeerFrozen || isCdExpired) && !bt.stage2Revealed) {
          hintEl.innerHTML = `<span style="color:var(--sun-gold); font-weight:700;">🏁 Runde 20 beendet! Der Spielleiter wertet jetzt Etappe 2 aus und deckt auf. Danach startet automatisch Etappe 3!</span>`;
        } else if (isRoundLocked) {
          hintEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">🔒 Die Verkostungsrunde für Bier #${activeIdx + 1} ist beendet. Dein Tipp ist eingefroren.</span>`;
        } else {
          hintEl.textContent = 'Wähle dein getipptes Bier (einmal gewählte Biere sind für andere Runden gesperrt):';
        }
      }

      if (pickBadge) {
        if (isStageRevealed) {
          if (sol && myCurrentGuess && myCurrentGuess === sol) {
            pickBadge.textContent = `✓ Richtig: ${myCurrentGuess}`;
            pickBadge.className = 'ts-current-pick-badge revealed-correct';
          } else if (sol && myCurrentGuess) {
            pickBadge.textContent = `✗ Dein Tipp: ${myCurrentGuess}`;
            pickBadge.className = 'ts-current-pick-badge revealed-wrong';
          } else if (sol) {
            pickBadge.textContent = `✗ Kein Tipp (Wahr: ${sol})`;
            pickBadge.className = 'ts-current-pick-badge revealed-wrong';
          } else {
            pickBadge.textContent = myCurrentGuess || 'Kein Tipp';
            pickBadge.className = 'ts-current-pick-badge';
          }
        } else {
          const myJokerBeer = bt.jokers && (bt.jokers[currentUserId] !== undefined ? bt.jokers[currentUserId] : (bt.jokers[String(currentUserId)] !== undefined ? bt.jokers[String(currentUserId)] : bt.jokers[Number(currentUserId)]));
          const hasJokerOnThis = myJokerBeer === activeIdx;
          const jokerSuffix = hasJokerOnThis ? ' 👑 (Joker)' : '';

          if (myCurrentGuess) {
            pickBadge.textContent = `Tipp: ${myCurrentGuess}${jokerSuffix}`;
            pickBadge.className = 'ts-current-pick-badge has-pick';
          } else {
            pickBadge.textContent = hasJokerOnThis ? '👑 Joker gesetzt' : 'Noch kein Tipp';
            pickBadge.className = 'ts-current-pick-badge';
          }
        }
      }

      // Joker Button (Goldener Kronkorken) for Player View
      const myJokerBeer = bt.jokers && (bt.jokers[currentUserId] !== undefined ? bt.jokers[currentUserId] : (bt.jokers[String(currentUserId)] !== undefined ? bt.jokers[String(currentUserId)] : bt.jokers[Number(currentUserId)]));
      const hasJokerOnThis = myJokerBeer === activeIdx;
      let jokerBtnHtml = '';
      if (!isRoundLocked && !canManage) {
        if (hasJokerOnThis) {
          jokerBtnHtml = `
            <div class="ts-joker-banner-wrapper">
              <button type="button" class="ts-joker-btn active" id="btn-toggle-beer-joker">
                <span>👑</span> Goldener Kronkorken aktiv! (+1 Bonuspunkt bei Treffer)
              </button>
            </div>
          `;
        } else if (myJokerBeer !== undefined && myJokerBeer !== null) {
          jokerBtnHtml = `
            <div class="ts-joker-banner-wrapper">
              <button type="button" class="ts-joker-btn" id="btn-toggle-beer-joker">
                <span>👑</span> Kronkorken auf Bier #${activeIdx + 1} verschieben (+1 Bonus)
              </button>
              <div class="ts-joker-info-text">
                <span class="ts-joker-badge">👑 Gesetzter Kronkorken</span> liegt aktuell bei Bier #${myJokerBeer + 1}
              </div>
            </div>
          `;
        } else {
          jokerBtnHtml = `
            <div class="ts-joker-banner-wrapper">
              <button type="button" class="ts-joker-btn" id="btn-toggle-beer-joker">
                <span>👑</span> Goldener Kronkorken für Bier #${activeIdx + 1} setzen (+1 Bonuspunkt)
              </button>
            </div>
          `;
        }
      }

      // Render Joker outside the beer options grid
      const jokerSlotEl = document.getElementById('ts-beer-joker-slot');
      if (jokerSlotEl) {
        if (jokerBtnHtml) {
          jokerSlotEl.innerHTML = jokerBtnHtml;
          jokerSlotEl.style.display = 'block';
        } else {
          jokerSlotEl.innerHTML = '';
          jokerSlotEl.style.display = 'none';
        }
      }

      // Build map of used beers by current user in other rounds
      const usedBeersMap = {};
      Object.entries(userGuesses).forEach(([idxStr, bName]) => {
        const idx = Number(idxStr);
        if (idx !== activeIdx && bName) {
          usedBeersMap[bName] = idx + 1;
        }
      });

      const isAll3StagesRevealed = Boolean(bt.stage1Revealed && bt.stage2Revealed && bt.stage3Revealed);

      if (gridEl) {
        let gridHtml = '';

        (bt.beerPool || []).forEach(beerName => {
          const isSelected = myCurrentGuess === beerName;
          const isUsed = Boolean(usedBeersMap[beerName]);
          const usedNum = usedBeersMap[beerName];

          if (isStageRevealed) {
            const isCorrectGuess = Boolean(sol && isSelected && myCurrentGuess === sol);
            const isWrongGuess = Boolean(sol && isSelected && myCurrentGuess !== sol);
            const isTrueSolution = Boolean(sol && beerName === sol);
            const steckbriefBtn = isAll3StagesRevealed
              ? `<button type="button" class="btn btn-sm btn-secondary btn-beer-card-steckbrief" data-beer="${beerName}" style="padding: 2px 8px; font-size: 0.72rem; margin-left: auto;">ℹ️ Steckbrief</button>`
              : '';

            if (isCorrectGuess) {
              gridHtml += `
                <div class="ts-beer-opt revealed-correct">
                  <span class="beer-emoji">🍺</span>
                  <span class="beer-name">${beerName}</span>
                  <span class="revealed-badge">✓ Dein Treffer! (+1)</span>
                  ${steckbriefBtn}
                </div>
              `;
            } else if (isWrongGuess) {
              gridHtml += `
                <div class="ts-beer-opt revealed-wrong">
                  <span class="beer-emoji">🍺</span>
                  <span class="beer-name">${beerName}</span>
                  <span class="revealed-badge">✗ Dein Tipp (falsch)</span>
                  ${steckbriefBtn}
                </div>
              `;
            } else if (isTrueSolution) {
              gridHtml += `
                <div class="ts-beer-opt revealed-correct">
                  <span class="beer-emoji">🍺</span>
                  <span class="beer-name">${beerName}</span>
                  <span class="revealed-badge">✓ Wahre Lösung</span>
                  ${steckbriefBtn}
                </div>
              `;
            } else {
              gridHtml += `
                <div class="ts-beer-opt" style="opacity: 0.35; ${isAll3StagesRevealed ? 'cursor:pointer;' : 'pointer-events: none;'}">
                  <span class="beer-emoji">🍺</span>
                  <span class="beer-name">${beerName}</span>
                  ${steckbriefBtn}
                </div>
              `;
            }
          } else if (isSelected) {
            gridHtml += `
              <div class="ts-beer-opt selected" data-beer="${beerName}" style="${isRoundLocked ? 'cursor:default;' : ''}">
                <span class="beer-emoji">🍺</span>
                <span class="beer-name">${beerName}</span>
                <span class="pick-indicator">${isRoundLocked ? '🔒 Eingeloggt' : '✓ Gewählt'}</span>
              </div>
            `;
          } else if (isUsed) {
            gridHtml += `
              <div class="ts-beer-opt used" data-beer="${beerName}" data-used-num="${usedNum}" title="Bereits bei Bier #${usedNum} getippt">
                <span class="beer-emoji">🍺</span>
                <span class="beer-name">${beerName}</span>
                <span class="used-badge">🔒 Bei Bier #${usedNum} gewählt</span>
              </div>
            `;
          } else if (isRoundLocked) {
            gridHtml += `
              <div class="ts-beer-opt" style="opacity: 0.45; pointer-events: none;">
                <span class="beer-emoji">🍺</span>
                <span class="beer-name">${beerName}</span>
              </div>
            `;
          } else {
            gridHtml += `
              <div class="ts-beer-opt" data-beer="${beerName}">
                <span class="beer-emoji">🍺</span>
                <span class="beer-name">${beerName}</span>
              </div>
            `;
          }
        });
        gridEl.innerHTML = gridHtml;

        // Wire Joker button
        const btnJoker = document.getElementById('btn-toggle-beer-joker');
        if (btnJoker) {
          btnJoker.onclick = () => {
            const res = store.setBeerJoker(currentUserId, activeIdx);
            if (res.success) {
              if (res.active) fdsAudio.playJoker();
              showToast(res.message, res.active ? '👑' : 'ℹ️');
              renderTimbersports();
            } else {
              showToast(res.message, '⚠️');
            }
          };
        }

        // Wire Steckbrief buttons
        gridEl.querySelectorAll('.btn-beer-card-steckbrief').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bName = btn.getAttribute('data-beer');
            openBeerSteckbrief(bName);
          });
        });

        // Wire Used beers click feedback
        gridEl.querySelectorAll('.ts-beer-opt.used').forEach(opt => {
          opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const bName = opt.getAttribute('data-beer');
            const uNum = opt.getAttribute('data-used-num');
            triggerHaptic('warning');
            showToast(`„${bName}“ hast du bereits bei Bier #${uNum} eingeloggt! Jedes Bier darf nur einmal gewählt werden.`, '🔒');
          });
        });

        if (!isRoundLocked) {
          gridEl.querySelectorAll('.ts-beer-opt:not(.used):not([disabled])').forEach(opt => {
            opt.addEventListener('click', () => {
              const bName = opt.getAttribute('data-beer');
              if (!bName) return;
              const res = store.saveBeerGuess(currentUserId, activeIdx, bName);
              if (res.success) {
                fdsAudio.playPlopp();
                triggerHaptic('success');
                showToast(`Bier #${activeIdx + 1}: ${bName} eingeloggt! 🍺`, '✓');
                renderTimbersports();
              } else {
                triggerHaptic('warning');
                showToast(res.message, '⚠️');
              }
            });
          });
        }
      }
    }

    // Stage Intermediate Results & Reveal Box
    const revealBox = document.getElementById('ts-stage-reveal-box');
    if (revealBox) {
      if (!isStageRevealed) {
        revealBox.innerHTML = `
          <div style="text-align: center; padding: 12px 6px;">
            <div style="font-size: 1.6rem; margin-bottom: 6px;">⏳</div>
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 4px 0;">
              Zwischenabrechnung Etappe ${currentStage} (Bier ${stageStart + 1}–${stageEnd})
            </h4>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">
              Wird vom Administrator aufgedeckt, sobald alle Freunde ihre Tipps abgegeben haben.
            </p>
          </div>
        `;
      } else {
        // Detailed stage score summary
        const stageScores = members.map(m => {
          let correct = 0;
          const mGuesses = (bt.guesses && (bt.guesses[m.id] || bt.guesses[String(m.id)] || bt.guesses[Number(m.id)])) || {};
          for (let i = stageStart; i < stageEnd; i++) {
            const bSol = bt.solutions[i];
            const g = mGuesses[i] !== undefined ? mGuesses[i] : mGuesses[String(i)];
            if (bSol && g && bSol === g) correct++;
          }
          return { member: m, correct };
        });
        stageScores.sort((a, b) => b.correct - a.correct);

        // 1. Calculate player's personal score and summary for this stage
        const myStageGuesses = [];
        let myCorrectCount = 0;
        const totalInStage = stageEnd - stageStart;
        for (let i = stageStart; i < stageEnd; i++) {
          const bSol = bt.solutions[i];
          const mGuess = userGuesses[i] !== undefined ? userGuesses[i] : userGuesses[String(i)];
          const isMatch = Boolean(bSol && mGuess && bSol === mGuess);
          if (isMatch) myCorrectCount++;
          myStageGuesses.push({
            beerNum: i + 1,
            solution: bSol || '–',
            guess: mGuess || null,
            isMatch
          });
        }

        // Personal Summary Card (especially clear for the player!)
        let mySummaryBannerHtml = '';
        if (!canManage) {
          const itemsSummaryHtml = myStageGuesses.map(item => `
            <div class="ts-my-stage-item ${item.isMatch ? 'correct' : 'wrong'}">
              <span style="font-weight:700;">#${item.beerNum}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;" title="Tipp: ${item.guess || 'Kein Tipp'} | Wahr: ${item.solution}">
                ${item.guess ? item.guess : '<em style="color:var(--text-muted);">Kein Tipp</em>'}
              </span>
              <span style="font-weight:800; color:${item.isMatch ? '#34d399' : '#fca5a5'};">
                ${item.isMatch ? '✓' : '✗'}
              </span>
            </div>
          `).join('');

          mySummaryBannerHtml = `
            <div class="ts-my-stage-summary-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--sun-gold); font-weight: 800; letter-spacing: 0.5px;">
                    🎯 Deine Auswertung – Etappe ${currentStage}
                  </div>
                  <div style="font-size: 1.1rem; font-weight: 900; color: #fff; margin-top: 2px;">
                    ${myCorrectCount} von ${totalInStage} Biere richtig!
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.5rem; font-weight: 900; color: ${myCorrectCount > 0 ? '#34d399' : '#fca5a5'};">
                    +${myCorrectCount} Pkt
                  </div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; margin-top: 8px;">
                ${itemsSummaryHtml}
              </div>
            </div>
          `;
        }

        let tableRowsHtml = stageScores.map((sc, idx) => {
          const isMe = sc.member.id === currentUserId || Number(sc.member.id) === Number(currentUserId);
          return `
            <tr style="border-bottom: 1px solid var(--border-subtle); ${isMe ? 'background: rgba(245, 158, 11, 0.12); font-weight: 800;' : ''}">
              <td style="padding: 8px 6px; font-weight: 800; color: ${idx === 0 ? 'var(--sun-gold)' : 'var(--text-muted)'};">#${idx + 1}</td>
              <td style="padding: 8px 6px; display: flex; align-items: center; gap: 8px;">
                <span class="avatar-sm">${renderAvatar(sc.member.avatar)}</span>
                <strong>${sc.member.name}${isMe ? ' (Du)' : ''}</strong>
              </td>
              <td style="padding: 8px 6px; text-align: right; font-weight: 800; color: #34d399;">
                ${sc.correct} / ${totalInStage}
              </td>
            </tr>
          `;
        }).join('');

        let beerDetailsHtml = '';
        for (let i = stageStart; i < stageEnd; i++) {
          const bSol = bt.solutions[i] || 'Nicht erfasst';
          const friendGuesses = members.map(m => {
            const mGuesses = (bt.guesses && (bt.guesses[m.id] || bt.guesses[String(m.id)] || bt.guesses[Number(m.id)])) || {};
            const g = mGuesses[i] !== undefined ? mGuesses[i] : mGuesses[String(i)];
            const isMatch = g && g === bSol;
            const isMe = m.id === currentUserId || Number(m.id) === Number(currentUserId);
            return `
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: ${isMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isMatch ? '#34d399' : '#fca5a5'}; border: ${isMe ? '1px solid var(--sun-gold)' : 'none'};">
                ${m.name}${isMe ? ' (Du)' : ''}: ${g || '–'} ${isMatch ? '✓' : '✗'}
              </span>
            `;
          }).join(' ');

          const steckbriefBtnInDetail = (isAll3StagesRevealed && bSol && bSol !== 'Nicht erfasst')
            ? `<button type="button" class="btn btn-sm btn-secondary btn-beer-card-steckbrief" data-beer="${bSol}" style="padding: 1px 7px; font-size: 0.68rem; margin-left: 8px;">ℹ️ Steckbrief</button>`
            : '';

          beerDetailsHtml += `
            <div style="background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: 8px; border-left: 3px solid ${bSol ? 'var(--sun-gold)' : 'var(--border-subtle)'};">
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.8rem; margin-bottom: 4px;">
                <span>Bier #${i + 1}</span>
                <div style="display: flex; align-items: center;">
                  <span style="color: var(--sun-gold);">${bSol}</span>
                  ${steckbriefBtnInDetail}
                </div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${friendGuesses}
              </div>
            </div>
          `;
        }

        revealBox.innerHTML = `
          <div>
            ${mySummaryBannerHtml}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0;">
                📊 Gesamt-Rangliste Etappe ${currentStage} (Bier ${stageStart + 1}–${stageEnd})
              </h4>
              <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: 800;">Aufgedeckt ✓</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 12px;">
              <thead>
                <tr style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle);">
                  <th style="padding: 6px; text-align: left;">Rang</th>
                  <th style="padding: 6px; text-align: left;">Freund</th>
                  <th style="padding: 6px; text-align: right;">Treffer</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
            <details style="font-size: 0.76rem; color: var(--text-secondary); cursor: pointer;" ${!canManage ? 'open' : ''}>
              <summary style="font-weight: 700; color: var(--sun-gold); margin-bottom: 6px;">Detail-Auflösung aller Biere ansehen ▾</summary>
              ${beerDetailsHtml}
            </details>
          </div>
        `;

        revealBox.querySelectorAll('.btn-beer-card-steckbrief').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bName = btn.getAttribute('data-beer');
            openBeerSteckbrief(bName);
          });
        });
      }
    }

    // Admin Box for Biertasting
    const adminBox = document.getElementById('ts-beer-admin-box');
    if (adminBox) {
      if (canManage) {
        adminBox.style.display = 'block';

        // 1. Timer Controls
        const timerStatusBadge = document.getElementById('ts-admin-timer-status-badge');
        const customSecsInput = document.getElementById('ts-admin-custom-secs');
        const timerDurLabel = document.getElementById('btn-timer-dur-label');
        const btnStartTimer = document.getElementById('btn-start-beer-countdown');
        const btnExtendTimer = document.getElementById('btn-extend-beer-countdown');
        const btnStopTimer = document.getElementById('btn-stop-beer-countdown');
        const btnResetTimer = document.getElementById('btn-reset-beer-countdown');

        if (timerStatusBadge) {
          if (isCdForActive && isCdRunning && cdRemaining > 0) {
            timerStatusBadge.textContent = `Läuft: ${cdRemaining}s`;
            timerStatusBadge.className = 'ts-admin-timer-status running';
          } else if (isBeerFrozen || isCdExpired) {
            timerStatusBadge.textContent = 'Eingefroren';
            timerStatusBadge.className = 'ts-admin-timer-status expired';
          } else {
            timerStatusBadge.textContent = 'Bereit';
            timerStatusBadge.className = 'ts-admin-timer-status';
          }
        }

        // Timer presets chips
        document.querySelectorAll('.ts-timer-chip').forEach(chip => {
          chip.onclick = () => {
            document.querySelectorAll('.ts-timer-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const secs = chip.getAttribute('data-secs');
            if (customSecsInput) customSecsInput.value = secs;
            if (timerDurLabel) timerDurLabel.textContent = secs;
          };
        });

        if (customSecsInput) {
          customSecsInput.oninput = () => {
            const val = customSecsInput.value;
            if (timerDurLabel) timerDurLabel.textContent = val || '60';
            document.querySelectorAll('.ts-timer-chip').forEach(c => {
              c.classList.toggle('active', c.getAttribute('data-secs') === val);
            });
          };
        }

        if (btnStartTimer) {
          btnStartTimer.onclick = () => {
            const secs = customSecsInput ? Number(customSecsInput.value) || 60 : 60;
            store.startBeerCountdown(activeIdx, secs);
            triggerHaptic('success');
            showToast(`Verkostungs-Countdown gestartet (${secs}s)! ⏱️`, '🍺');
            renderTimbersports();
          };
        }

        if (btnExtendTimer) {
          btnExtendTimer.onclick = () => {
            store.extendBeerCountdown(30);
            triggerHaptic('light');
            showToast('Countdown um +30s verlängert! ⏱️', '✓');
            renderTimbersports();
          };
        }

        if (btnStopTimer) {
          btnStopTimer.onclick = () => {
            store.stopBeerCountdown();
            store.setBeerLocked(activeIdx, true);
            triggerHaptic('warning');

            if (activeIdx === 9) {
              showToast(`Bier #10 gestoppt! Etappe 1 beendet – bereit zur Auswertung & Aufdeckung! 🏁`, '⏹️');
            } else if (activeIdx === 19) {
              showToast(`Bier #20 gestoppt! Etappe 2 beendet – bereit zur Auswertung & Aufdeckung! 🏁`, '⏹️');
            } else if (activeIdx >= 24) {
              showToast(`Biertasting komplett beendet! 🏆`, '🎉');
            } else {
              const nextIdx = activeIdx + 1;
              store.setBeerTastingActiveBeer(nextIdx);
              showToast(`Bier #${activeIdx + 1} gestoppt & eingefroren! Weiter zu Bier #${nextIdx + 1} ➔`, '⏭️');
            }
            renderTimbersports();
          };
        }

        const btnAdminNextBeer = document.getElementById('btn-admin-next-beer');
        if (btnAdminNextBeer) {
          btnAdminNextBeer.onclick = () => {
            store.stopBeerCountdown();
            store.setBeerLocked(activeIdx, true);

            if (activeIdx === 9 && !bt.stage1Revealed) {
              showToast('Etappe 1 ist beendet! Bitte zuerst unten Etappe 1 aufdecken, um Etappe 2 zu starten. 📊', '⚠️');
              renderTimbersports();
              return;
            } else if (activeIdx === 19 && !bt.stage2Revealed) {
              showToast('Etappe 2 ist beendet! Bitte zuerst unten Etappe 2 aufdecken, um Etappe 3 zu starten. 📊', '⚠️');
              renderTimbersports();
              return;
            } else if (activeIdx >= 24) {
              showToast('Alle 25 Biere wurden bereits verkostet! 🏆', 'ℹ️');
              renderTimbersports();
              return;
            }

            const nextBeer = activeIdx + 1;
            store.setBeerTastingActiveBeer(nextBeer);
            triggerHaptic('success');
            showToast(`Weiter zu Bier #${nextBeer + 1}! 🍺`, '⏭️');
            renderTimbersports();
          };
        }

        if (btnResetTimer) {
          btnResetTimer.onclick = () => {
            store.resetBeerCountdown(activeIdx);
            triggerHaptic('light');
            showToast(`Timer & Sperre für Bier #${activeIdx + 1} zurückgesetzt! 🔄`, 'ℹ️');
            renderTimbersports();
          };
        }

        // Manual lock / unlock toggle
        const lockDescEl = document.getElementById('ts-beer-lock-state-desc');
        const lockToggleBtn = document.getElementById('btn-toggle-beer-lock');
        const lockIconEl = document.getElementById('btn-toggle-beer-lock-icon');
        const lockTextEl = document.getElementById('btn-toggle-beer-lock-text');

        if (lockDescEl) {
          if (isBeerFrozen) {
            lockDescEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">🔒 Status: Bier #${activeIdx + 1} ist eingefroren</span>`;
          } else if (isCdRunning) {
            lockDescEl.innerHTML = `<span style="color:var(--sun-gold); font-weight:700;">⏱️ Status: Countdown läuft (${cdRemaining}s)</span>`;
          } else {
            lockDescEl.innerHTML = `<span style="color:#34d399; font-weight:700;">🔓 Status: Bier #${activeIdx + 1} ist offen</span>`;
          }
        }

        if (lockToggleBtn) {
          if (isBeerFrozen) {
            if (lockIconEl) lockIconEl.textContent = '🔓';
            if (lockTextEl) lockTextEl.textContent = 'Bier freigeben';
            lockToggleBtn.className = 'btn btn-sm btn-secondary';
          } else {
            if (lockIconEl) lockIconEl.textContent = '🔒';
            if (lockTextEl) lockTextEl.textContent = 'Bier einfrieren';
            lockToggleBtn.className = 'btn btn-sm btn-outline';
          }

          lockToggleBtn.onclick = () => {
            const nextLocked = !isBeerFrozen;
            store.setBeerLocked(activeIdx, nextLocked);
            triggerHaptic('light');
            showToast(nextLocked ? `Bier #${activeIdx + 1} eingefroren!` : `Bier #${activeIdx + 1} wieder freigegeben!`, nextLocked ? '🔒' : '🔓');
            renderTimbersports();
          };
        }

        // 2. Populate active beer dropdown
        const selectActiveBeer = document.getElementById('admin-select-active-beer');
        if (selectActiveBeer) {
          let opts = '';
          for (let i = 0; i < 25; i++) {
            const isF = Boolean(bt.lockedBeers && bt.lockedBeers[i]);
            opts += `<option value="${i}" ${i === activeIdx ? 'selected' : ''}>Bier #${i + 1}${isF ? ' [Eingefroren]' : ''}</option>`;
          }
          selectActiveBeer.innerHTML = opts;
          selectActiveBeer.onchange = () => {
            store.setBeerTastingActiveBeer(Number(selectActiveBeer.value));
            renderTimbersports();
          };
        }

        // 3. Populate solution dropdown (only beers not yet assigned elsewhere)
        const selectSolution = document.getElementById('admin-select-beer-solution');
        if (selectSolution) {
          const assignedSolutions = bt.solutions || [];
          const currentSol = assignedSolutions[activeIdx] || '';
          
          // Beers already assigned to other indices
          const assignedElsewhere = new Set();
          assignedSolutions.forEach((s, idx) => {
            if (idx !== activeIdx && s) assignedElsewhere.add(s);
          });

          let opts = '<option value="">-- Noch keine Lösung eingetragen --</option>';
          (bt.beerPool || []).forEach(bName => {
            if (!assignedElsewhere.has(bName)) {
              opts += `<option value="${bName}" ${bName === currentSol ? 'selected' : ''}>${bName}</option>`;
            }
          });
          selectSolution.innerHTML = opts;
          selectSolution.onchange = () => {
            store.setBeerSolution(activeIdx, selectSolution.value);
            showToast(`Wahre Lösung für Bier #${activeIdx + 1} gespeichert!`, '🍺');
            renderTimbersports();
          };
        }

        // 4. Stage Action Buttons
        const stageActionsEl = document.getElementById('ts-admin-stage-actions');
        if (stageActionsEl) {
          stageActionsEl.innerHTML = `
            <button type="button" class="btn btn-sm ${bt.stage1Revealed ? 'btn-secondary' : 'btn-primary'}" id="btn-toggle-stage-1">
              <span>${bt.stage1Revealed ? '🔒' : '📊'}</span> Etappe 1 (1–10) ${bt.stage1Revealed ? 'verbergen' : 'aufdecken'}
            </button>
            <button type="button" class="btn btn-sm ${bt.stage2Revealed ? 'btn-secondary' : 'btn-primary'}" id="btn-toggle-stage-2">
              <span>${bt.stage2Revealed ? '🔒' : '📊'}</span> Etappe 2 (11–20) ${bt.stage2Revealed ? 'verbergen' : 'aufdecken'}
            </button>
            <button type="button" class="btn btn-sm ${bt.stage3Revealed ? 'btn-secondary' : 'btn-primary'}" id="btn-toggle-stage-3">
              <span>${bt.stage3Revealed ? '🔒' : '🏆'}</span> Etappe 3 (21–25) ${bt.stage3Revealed ? 'verbergen' : 'aufdecken'}
            </button>
          `;

          const b1 = document.getElementById('btn-toggle-stage-1');
          const b2 = document.getElementById('btn-toggle-stage-2');
          const b3 = document.getElementById('btn-toggle-stage-3');

          if (b1) b1.onclick = () => {
            const next = !bt.stage1Revealed;
            store.revealBeerStage(1, next);
            if (next) {
              fireSolarConfetti();
              if (activeIdx <= 9) {
                store.setBeerTastingActiveBeer(10);
                showToast('Etappe 1 aufgedeckt! Automatisch weiter zu Etappe 2 (Bier 11) ➔', '🎉');
              }
            }
            renderTimbersports();
          };
          if (b2) b2.onclick = () => {
            const next = !bt.stage2Revealed;
            store.revealBeerStage(2, next);
            if (next) {
              fireSolarConfetti();
              if (activeIdx <= 19) {
                store.setBeerTastingActiveBeer(20);
                showToast('Etappe 2 aufgedeckt! Automatisch weiter zu Etappe 3 (Bier 21) ➔', '🏆');
              }
            }
            renderTimbersports();
          };
          if (b3) b3.onclick = () => {
            const next = !bt.stage3Revealed;
            store.revealBeerStage(3, next);
            if (next) fireSolarConfetti();
            renderTimbersports();
          };
        }
      } else {
        adminBox.style.display = 'none';
      }
    }
  }

  // --- Sub-Controller: Sägewettbewerb ---
  function renderTimbersportsSaw(quiz, canManage, currentUserId, members) {
    const saw = quiz.sawContest;
    const isRevealed = Boolean(saw.revealed);
    const myEntry = (saw.entries && saw.entries[currentUserId]) || {};

    // Remote reveal celebration
    if (isRevealed && window._sawWasRevealed === false) {
      fdsAudio.playFanfare();
      fireSolarConfetti();
      triggerHaptic('celebrate');
      showToast('🪵 Die offizielle Säge-Rangliste wurde aufgedeckt!', '🏆');
    }
    window._sawWasRevealed = isRevealed;

    // Live alert for the player when their cuts are weighed by Admin
    if (!canManage && currentUserId !== 'admin') {
      const c1 = myEntry.cut1;
      const c2 = myEntry.cut2;
      const hasC1 = c1 !== null && c1 !== undefined;
      const hasC2 = c2 !== null && c2 !== undefined;

      if (window._prevSawState && window._prevSawState.user === currentUserId) {
        if (hasC1 && window._prevSawState.cut1 === null) {
          fdsAudio.playPlopp();
          triggerHaptic('success');
          showToast(`🪵 Schnitt 1 gewogen: ${c1}g!`, '⚖️');
        }
        if (hasC2 && window._prevSawState.cut2 === null) {
          const total = c1 + c2;
          const diff = Math.abs(total - saw.targetWeight);
          fdsAudio.playPlopp();
          triggerHaptic('success');
          showToast(`🪵 Beide Schnitte gewogen: Total ${total}g (±${diff}g)!`, '🎯');
        }
      }
      window._prevSawState = {
        user: currentUserId,
        cut1: hasC1 ? c1 : null,
        cut2: hasC2 ? c2 : null
      };
    }

    // Personal Card
    const mySawCard = document.getElementById('ts-my-saw-card');
    if (mySawCard) {
      if (canManage && currentUserId === 'admin') {
        mySawCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0;">🪵 Sägewettbewerb – Spielleiter</h4>
            <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: 800; background: ${isRevealed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${isRevealed ? '#34d399' : 'var(--sun-gold)'};">
              ${isRevealed ? 'Rangliste aufgedeckt ✓' : 'Rangliste geheim 🔒'}
            </span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
            Trage unten die Gewichte für Schnitt 1 und 2 ein. Die Freunde sehen ihr persönliches Ergebnis sofort nach dem Wiegen & Speichern. Die Gesamtrangliste bleibt geheim, bis du sie unten freigibst.
          </p>
        `;
      } else {
        const c1 = myEntry.cut1;
        const c2 = myEntry.cut2;
        const hasC1 = c1 !== null && c1 !== undefined;
        const hasC2 = c2 !== null && c2 !== undefined;
        const hasBoth = hasC1 && hasC2;
        const isJoker = Boolean(saw.jokers && saw.jokers[currentUserId]);

        let cut1Text = hasC1 ? `${c1} g` : 'Noch nicht gewogen';
        let cut2Text = hasC2 ? `${c2} g` : 'Noch nicht gewogen';
        let resultText = '';
        let bullseyeBadgeHtml = '';

        if (hasBoth) {
          const total = c1 + c2;
          const diff = Math.abs(total - saw.targetWeight);
          const isBullseye = diff <= 30;

          if (isBullseye) {
            bullseyeBadgeHtml = `
              <div class="ts-bullseye-badge bullseye" style="margin-top: 8px;">
                🎯 Bullseye getroffen! (±${diff}g)${isJoker ? ' • +2 Joker-Extrapunkte gesichert!' : ''}
              </div>
            `;
          } else if (diff <= 100) {
            bullseyeBadgeHtml = `
              <div class="ts-bullseye-badge good" style="margin-top: 8px;">
                🌲 Starke Sägeleistung! (±${diff}g)
              </div>
            `;
          } else if (diff > 250) {
            bullseyeBadgeHtml = `
              <div class="ts-bullseye-badge wild" style="margin-top: 8px;">
                🪓 Die Axt im Walde! (±${diff}g)
              </div>
            `;
          }

          resultText = `
            <div style="margin-top: 10px; padding: 10px; border-radius: var(--radius-sm); background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4);">
              <div style="font-size: 0.74rem; font-weight: 800; color: #34d399; text-transform: uppercase;">
                ${isRevealed ? 'Offizielles Endergebnis:' : 'Dein Gesamtergebnis (Rangliste noch geheim):'}
              </div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #fff; margin-top: 2px;">
                ${total} Gramm <span style="font-size: 0.85rem; color: var(--sun-gold);">(Abweichung: ${diff} g)</span>
              </div>
            </div>
            ${bullseyeBadgeHtml}
          `;
        } else if (hasC1 && !hasC2) {
          const diffToGoal = saw.targetWeight - c1;
          resultText = `
            <div style="margin-top: 10px; padding: 8px 10px; border-radius: var(--radius-sm); background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3);">
              <div style="font-size: 0.72rem; font-weight: 800; color: var(--sun-gold); text-transform: uppercase;">Tipp für Schnitt 2:</div>
              <div style="font-size: 0.82rem; color: var(--text-primary); margin-top: 2px;">
                Schnitt 1 wiegt <strong>${c1} g</strong>. Für exakt 1.000g brauchst du bei Schnitt 2 idealerweise <strong>${diffToGoal > 0 ? diffToGoal + ' g' : '0 g'}</strong>! 🪵
              </div>
            </div>
          `;
        }

        let jokerBtnHtml = '';
        if (!hasC1 && !isRevealed) {
          jokerBtnHtml = `
            <div style="margin-top: 10px;">
              <button type="button" class="ts-joker-btn ${isJoker ? 'active' : ''}" id="btn-toggle-saw-joker">
                <span class="joker-icon">🎯</span>
                <div class="joker-text">
                  <span class="joker-title">Bullseye-Wette (Joker) ${isJoker ? 'aktiviert! ✓' : ''}</span>
                  <span class="joker-desc">${isJoker ? 'Aktiv: Gesamtabweichung ≤ 30g bringt dir +2 Extrapunkte!' : 'Tippe hier: Gesamtabweichung ≤ 30g bringt dir +2 Extrapunkte!'}</span>
                </div>
              </button>
            </div>
          `;
        } else if (isJoker) {
          jokerBtnHtml = `
            <div style="margin-top: 8px;">
              <span class="ts-joker-badge active">🎯 Bullseye-Wette gesetzt (Eingefroren)</span>
            </div>
          `;
        }

        let badgeText = 'Noch nicht gewogen';
        let badgeBg = 'rgba(255, 255, 255, 0.1)';
        let badgeColor = 'var(--text-muted)';

        if (isRevealed) {
          badgeText = 'Aufgedeckt ✓';
          badgeBg = 'rgba(16, 185, 129, 0.25)';
          badgeColor = '#34d399';
        } else if (hasC1 && hasC2) {
          badgeText = 'Beide gewogen ✓';
          badgeBg = 'rgba(16, 185, 129, 0.2)';
          badgeColor = '#34d399';
        } else if (hasC1) {
          badgeText = 'Schnitt 1 gewogen ⚖️';
          badgeBg = 'rgba(245, 158, 11, 0.2)';
          badgeColor = 'var(--sun-gold)';
        }

        mySawCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0;">Deine Schnitte (Ziel: 1.000g)</h4>
            <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: 800; background: ${badgeBg}; color: ${badgeColor};">
              ${badgeText}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.82rem;">
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 10px; border-radius: var(--radius-sm); border: ${hasC1 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent'};">
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">SCHNITT 1:</div>
              <div style="font-weight: 800; color: ${hasC1 ? 'var(--sun-gold)' : '#fff'}; margin-top: 2px; font-size: ${hasC1 ? '1rem' : '0.82rem'};">${cut1Text}</div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 10px; border-radius: var(--radius-sm); border: ${hasC2 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent'};">
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">SCHNITT 2:</div>
              <div style="font-weight: 800; color: ${hasC2 ? 'var(--sun-gold)' : '#fff'}; margin-top: 2px; font-size: ${hasC2 ? '1rem' : '0.82rem'};">${cut2Text}</div>
            </div>
          </div>
          ${resultText}
          ${jokerBtnHtml}
        `;

        const btnSawJoker = document.getElementById('btn-toggle-saw-joker');
        if (btnSawJoker) {
          btnSawJoker.onclick = () => {
            const next = !isJoker;
            const res = store.setSawJoker(currentUserId, next);
            if (res.success) {
              if (res.active) fdsAudio.playJoker();
              triggerHaptic('success');
              showToast(res.active ? '🎯 Bullseye-Wette aktiviert! Ziel: ≤ 30g Abweichung!' : 'Bullseye-Wette deaktiviert.', '🎯');
              renderTimbersports();
            } else {
              showToast(res.message, '⚠️');
            }
          };
        }
      }
    }

    // Leaderboard Table
    const tableCard = document.getElementById('ts-saw-table-card');
    if (tableCard) {
      if (!isRevealed) {
        let statusListHtml = members.map(m => {
          const entry = (saw.entries && saw.entries[m.id]) || {};
          const c1 = entry.cut1 !== null && entry.cut1 !== undefined;
          const c2 = entry.cut2 !== null && entry.cut2 !== undefined;
          const isJoker = Boolean(saw.jokers && saw.jokers[m.id]);
          const jokerBadge = isJoker ? ' <span class="ts-joker-badge active" style="font-size:0.65rem; padding: 1px 6px;">🎯 Joker</span>' : '';
          let statusBadge = '';
          if (c1 && c2) {
            statusBadge = '<span style="color: #34d399; font-weight: 800;">Beide Schnitte gewogen 🪵</span>';
          } else if (c1) {
            statusBadge = '<span style="color: var(--sun-gold); font-weight: 700;">Schnitt 1 gewogen ⚖️</span>';
          } else {
            statusBadge = '<span style="color: var(--text-muted);">Noch nicht gesägt</span>';
          }

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.8rem;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                <strong>${m.name}</strong> ${jokerBadge}
              </div>
              <div>${statusBadge}</div>
            </div>
          `;
        }).join('');

        tableCard.innerHTML = `
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 10px 0;">🪵 Status des Sägewettbewerbs</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 10px;">
            Deine eigenen Schnitte siehst du oben direkt nach dem Wiegen. Die Gesamtrangliste mit allen Gewichten wird am Ende für alle aufgedeckt.
          </p>
          <div>${statusListHtml}</div>
        `;
      } else {
        // Compute and sort
        const results = members.map(m => {
          const entry = (saw.entries && saw.entries[m.id]) || {};
          const c1 = entry.cut1;
          const c2 = entry.cut2;
          const hasBoth = c1 !== null && c1 !== undefined && c2 !== null && c2 !== undefined;
          const total = hasBoth ? (c1 + c2) : null;
          const diff = hasBoth ? Math.abs(total - saw.targetWeight) : 999999;
          const isJ = Boolean(saw.jokers && saw.jokers[m.id]);
          const jHit = isJ && hasBoth && diff <= 30;
          return { member: m, cut1: c1, cut2: c2, total, diff, hasBoth, isJoker: isJ, jokerHit: jHit };
        });

        results.sort((a, b) => a.diff - b.diff);

        let rowsHtml = results.map((r, idx) => {
          let rankPoints = r.hasBoth ? Math.max(1, 8 - idx) : 0;
          let jokerBonusBadge = '';
          if (r.jokerHit) {
            rankPoints += 2;
            jokerBonusBadge = '<span class="ts-joker-badge active" style="margin-left: 4px;" title="Bullseye-Wette gewonnen (+2P)">🎯 +2P</span>';
          } else if (r.isJoker) {
            jokerBonusBadge = '<span class="ts-joker-badge" style="margin-left: 4px; opacity: 0.6;" title="Bullseye-Wette verfehlt">🎯</span>';
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 8px 6px; font-weight: 800; color: ${idx === 0 ? 'var(--sun-gold)' : 'var(--text-muted)'};">#${idx + 1}</td>
              <td style="padding: 8px 6px; display: flex; align-items: center; gap: 8px;">
                <span class="avatar-sm">${renderAvatar(r.member.avatar)}</span>
                <strong>${r.member.name}</strong> ${jokerBonusBadge}
              </td>
              <td style="padding: 8px 6px; text-align: center;">${r.cut1 ?? '–'}g</td>
              <td style="padding: 8px 6px; text-align: center;">${r.cut2 ?? '–'}g</td>
              <td style="padding: 8px 6px; text-align: center; font-weight: 800;">${r.total ?? '–'}g</td>
              <td style="padding: 8px 6px; text-align: right; color: ${r.diff < 50 ? '#34d399' : 'var(--sun-gold)'}; font-weight: 800;">
                ${r.hasBoth ? `±${r.diff}g` : '–'}
              </td>
              <td style="padding: 8px 6px; text-align: right; font-weight: 900; color: var(--sun-gold);">
                ${rankPoints} P
              </td>
            </tr>
          `;
        }).join('');

        tableCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0;">🪵 Offizielle Rangliste (1.000g)</h4>
            <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: 800;">Aufgedeckt ✓</span>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
              <thead>
                <tr style="color: var(--text-muted); font-size: 0.68rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle);">
                  <th style="padding: 6px; text-align: left;">Rang</th>
                  <th style="padding: 6px; text-align: left;">Freund</th>
                  <th style="padding: 6px; text-align: center;">S1</th>
                  <th style="padding: 6px; text-align: center;">S2</th>
                  <th style="padding: 6px; text-align: center;">Summe</th>
                  <th style="padding: 6px; text-align: right;">Diff</th>
                  <th style="padding: 6px; text-align: right;">Punkte</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // Admin Weighing Inputs
    const adminBox = document.getElementById('ts-saw-admin-box');
    if (adminBox) {
      if (canManage) {
        adminBox.style.display = 'block';

        const btnReveal = document.getElementById('btn-toggle-reveal-saw');
        const btnRevealText = document.getElementById('btn-toggle-reveal-saw-text');
        const btnRevealIcon = document.getElementById('btn-toggle-reveal-saw-icon');

        if (btnRevealText) btnRevealText.textContent = isRevealed ? 'Wiegungen wieder verbergen' : 'Wiegungen für alle aufdecken';
        if (btnRevealIcon) btnRevealIcon.textContent = isRevealed ? '🔒' : '🔓';

        if (btnReveal) {
          btnReveal.onclick = () => {
            const next = !saw.revealed;
            store.revealSawCuts(next);
            if (next) {
              fdsAudio.playFanfare();
              fireSolarConfetti();
            }
            renderTimbersports();
          };
        }

        const tableContainer = document.getElementById('ts-saw-admin-table');
        if (tableContainer) {
          const isUserTyping = tableContainer.contains(document.activeElement);
          if (!isUserTyping) {
            tableContainer.innerHTML = members.map(m => {
              const entry = (saw.entries && saw.entries[m.id]) || {};
              const c1 = entry.cut1 !== null && entry.cut1 !== undefined ? entry.cut1 : '';
              const c2 = entry.cut2 !== null && entry.cut2 !== undefined ? entry.cut2 : '';
              const isJoker = Boolean(saw.jokers && saw.jokers[m.id]);
              const jokerBadge = isJoker ? ' <span class="ts-joker-badge active" style="font-size:0.65rem; padding: 1px 6px;">🎯 Joker</span>' : '';

              return `
                <div class="ts-saw-admin-row">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                    <span style="font-weight: 700; font-size: 0.8rem;">${m.name}</span>
                    ${jokerBadge}
                  </div>
                  <div>
                    <input type="number" class="form-input saw-input-c1" data-member-id="${m.id}" value="${c1}" placeholder="S1 (g)" style="padding: 6px 8px; font-size: 0.78rem;">
                  </div>
                  <div>
                    <input type="number" class="form-input saw-input-c2" data-member-id="${m.id}" value="${c2}" placeholder="S2 (g)" style="padding: 6px 8px; font-size: 0.78rem;">
                  </div>
                </div>
              `;
            }).join('');
          }
        }

        const btnSave = document.getElementById('btn-save-saw-entries');
        if (btnSave) {
          btnSave.onclick = () => {
            const entriesMap = {};
            document.querySelectorAll('.saw-input-c1').forEach(inp1 => {
              const mId = Number(inp1.getAttribute('data-member-id'));
              const inp2 = document.querySelector(`.saw-input-c2[data-member-id="${mId}"]`);
              const v1 = inp1.value.trim();
              const v2 = inp2 ? inp2.value.trim() : '';
              entriesMap[mId] = {
                cut1: v1 !== '' ? Number(v1) : null,
                cut2: v2 !== '' ? Number(v2) : null
              };
            });
            store.saveSawEntries(entriesMap);
            triggerHaptic('success');
            showToast('Wiegungen erfolgreich gespeichert & übertragen! 🪵', '💾');
            renderTimbersports();
          };
        }
      } else {
        adminBox.style.display = 'none';
      }
    }
  }

  // --- Sub-Controller: Timbersports Wissensquiz ---
  function renderTimbersportsTrivia(quiz, canManage, currentUserId, members) {
    const questions = quiz.trivia.questions || [];
    const answers = quiz.trivia.answers || {};
    const tr = quiz.trivia;
    const isQuizRevealed = Boolean(tr.revealed);
    const activeMembers = members.filter(m => m.id !== 'admin');

    // Remote reveal celebration
    if (isQuizRevealed && window._triviaWasRevealed === false) {
      fdsAudio.playFanfare();
      fireSolarConfetti();
      triggerHaptic('celebrate');
      showToast('🏆 Das Wissensquiz wurde offiziell aufgelöst!', '🎉');
    }
    window._triviaWasRevealed = isQuizRevealed;

    if (questions.length === 0) {
      const container = document.getElementById('ts-trivia-active-card-container');
      if (container) {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 24px;">
            <p style="color: var(--text-muted); font-size: 0.85rem;">Noch keine Quizfragen vorhanden.</p>
          </div>
        `;
      }
      return;
    }

    const cd = tr.countdown;
    const now = Date.now();

    // Determine Active Question
    let activeQId = tr.activeQuestionId || questions[0].id;
    let activeIdx = questions.findIndex(x => x.id === activeQId);
    if (activeIdx === -1) {
      activeIdx = 0;
      activeQId = questions[0].id;
    }

    // If countdown is running on a question, all players MUST focus on that question!
    if (!canManage && cd && cd.isRunning && cd.endsAt && cd.endsAt > now && cd.activeQuestionId) {
      activeQId = cd.activeQuestionId;
      activeIdx = questions.findIndex(x => x.id === activeQId);
      if (activeIdx === -1) { activeIdx = 0; activeQId = questions[0].id; }
      window._localTriviaActiveQId = activeQId;
    } else if (!canManage && window._localTriviaActiveQId) {
      const localIdx = questions.findIndex(x => x.id === window._localTriviaActiveQId);
      if (localIdx !== -1) {
        activeQId = window._localTriviaActiveQId;
        activeIdx = localIdx;
      }
    }
    const activeQ = questions[activeIdx];

    // Countdown timing for Active Question
    const isCdForActive = Boolean(cd && cd.activeQuestionId === activeQId);
    let cdRemaining = 0;
    let cdTotalSecs = 30;
    let isCdRunning = false;
    let isCdExpired = false;

    if (isCdForActive) {
      cdTotalSecs = cd.durationSeconds || 30;
      isCdRunning = Boolean(cd.isRunning);
      cdRemaining = Math.max(0, Math.ceil(((cd.endsAt || now) - now) / 1000));
      isCdExpired = cdRemaining <= 0 || (!isCdRunning && cd.endsAt && now >= cd.endsAt);
    }

    // Audio & Toast notification when a countdown starts for players
    if (!canManage && isCdRunning && cdRemaining > 0) {
      if (window._lastSeenActiveCountdownTrivia !== activeQId) {
        window._lastSeenActiveCountdownTrivia = activeQId;
        fdsAudio.playPlopp();
        triggerHaptic('medium');
        showToast(`⏱️ Spielleiter hat den Countdown für Frage #${activeIdx + 1} gestartet!`, '🌲');
      }
    }

    const isQFrozen = Boolean(activeQ.isFrozen || isCdExpired || isQuizRevealed);
    const isQStarted = Boolean(isCdForActive || isQFrozen || isQuizRevealed || (answers[activeQId] && Object.keys(answers[activeQId]).length > 0));

    // 1. Question Selector Grid Pills (#1 .. #5)
    const selectorRow = document.getElementById('ts-trivia-selector-row');
    if (selectorRow) {
      let pillsHtml = '';
      questions.forEach((q, idx) => {
        const isCurrent = q.id === activeQId;
        const myAns = answers[q.id] && answers[q.id][currentUserId];
        const isAnswered = Boolean(myAns);
        const qCdForThis = Boolean(cd && cd.activeQuestionId === q.id);
        const qRunning = Boolean(qCdForThis && cd.isRunning && cd.endsAt && now < cd.endsAt);
        const qFrozen = Boolean(q.isFrozen || (qCdForThis && cd.endsAt && now >= cd.endsAt) || isQuizRevealed);

        let extraClass = '';
        let icon = '•';

        if (isCurrent) extraClass += ' active';

        if (qFrozen) {
          if (myAns) {
            if (myAns === q.correctAnswer) {
              extraClass += ' correct';
              icon = '✓';
            } else {
              extraClass += ' wrong';
              icon = '✗';
            }
          } else {
            extraClass += ' locked';
            icon = '🔒';
          }
        } else if (qRunning) {
          icon = '⏱️';
        } else if (isAnswered) {
          extraClass += ' answered';
          icon = '✓';
        } else {
          extraClass += ' locked';
          icon = '🔒';
        }

        pillsHtml += `
          <button type="button" class="ts-trivia-pill ${extraClass}" data-qid="${q.id}" title="Frage #${idx + 1}${qFrozen ? ' (Gesperrt)' : ''}">
            <span class="num">#${idx + 1}</span>
            <span class="status-icon">${icon}</span>
          </button>
        `;
      });
      selectorRow.innerHTML = pillsHtml;

      selectorRow.querySelectorAll('.ts-trivia-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const qId = Number(btn.getAttribute('data-qid'));
          if (canManage) {
            store.setTriviaActiveQuestion(qId);
          } else {
            window._localTriviaActiveQId = qId;
          }
          triggerHaptic('light');
          renderTimbersports();
        });
      });
    }

    // 2. Countdown Banner & Live Ticker
    const cdBanner = document.getElementById('ts-trivia-countdown-banner');
    const cdTitle = document.getElementById('ts-trivia-countdown-title');
    const cdSubtitle = document.getElementById('ts-trivia-countdown-subtitle');
    const cdDigits = document.getElementById('ts-trivia-countdown-digits');
    const cdProgress = document.getElementById('ts-trivia-countdown-progress-bar');
    const cdIcon = document.getElementById('ts-trivia-countdown-icon');

    if (window._tsTriviaTimerInterval) {
      clearInterval(window._tsTriviaTimerInterval);
      window._tsTriviaTimerInterval = null;
    }

    if (cdBanner) {
      if (isQuizRevealed) {
        cdBanner.style.display = 'none';
      } else if (isCdForActive) {
        cdBanner.style.display = 'block';
        if (isCdRunning && cdRemaining > 0) {
          cdBanner.className = 'card ts-countdown-banner' + (cdRemaining <= 5 ? ' urgent' : '');
          if (cdIcon) cdIcon.textContent = '⏱️';
          if (cdTitle) cdTitle.textContent = `Wissensquiz: Countdown für Frage #${activeIdx + 1}`;
          if (cdSubtitle) cdSubtitle.textContent = `Wähle deine Antwort, bevor die Zeit abläuft!`;
          if (cdDigits) cdDigits.textContent = cdRemaining;
          if (cdProgress) cdProgress.style.width = `${Math.min(100, Math.max(0, (cdRemaining / cdTotalSecs) * 100))}%`;

          window._tsTriviaTimerInterval = setInterval(() => {
            const curNow = Date.now();
            const curRem = Math.max(0, Math.ceil(((cd.endsAt || curNow) - curNow) / 1000));
            const digits = document.getElementById('ts-trivia-countdown-digits');
            const prog = document.getElementById('ts-trivia-countdown-progress-bar');
            const ban = document.getElementById('ts-trivia-countdown-banner');
            const admBadge = document.getElementById('ts-trivia-admin-status-badge');

            if (digits) digits.textContent = curRem;
            if (prog) prog.style.width = `${Math.min(100, Math.max(0, (curRem / cdTotalSecs) * 100))}%`;
            if (ban) {
              if (curRem <= 5 && curRem > 0) {
                ban.classList.add('urgent');
                fdsAudio.playTick(curRem <= 3);
              } else {
                ban.classList.remove('urgent');
              }
            }
            if (admBadge) {
              admBadge.textContent = `Läuft: ${curRem}s`;
              admBadge.className = 'ts-admin-timer-status running';
            }

            if (curRem <= 0) {
              clearInterval(window._tsTriviaTimerInterval);
              window._tsTriviaTimerInterval = null;
              fdsAudio.playBuzzer();
              store.stopTriviaCountdown();
              triggerHaptic('warning');
              showToast(`Zeit abgelaufen für Frage #${activeIdx + 1}!`, '⏳');
              renderTimbersports();
            }
          }, 500);
        } else {
          cdBanner.className = 'card ts-countdown-banner expired';
          if (cdIcon) cdIcon.textContent = '⏳';
          if (cdTitle) cdTitle.textContent = `Zeit abgelaufen für Frage #${activeIdx + 1}!`;
          if (cdSubtitle) cdSubtitle.textContent = `Antworten sind für diese Frage gesperrt.`;
          if (cdDigits) cdDigits.textContent = '0';
          if (cdProgress) cdProgress.style.width = '0%';
        }
      } else {
        cdBanner.style.display = 'none';
      }
    }

    // 3. Active Question Card (Single-Question Focus)
    const cardContainer = document.getElementById('ts-trivia-active-card-container');
    if (cardContainer) {
      if (!isQStarted && !canManage) {
        // Player sees locked placeholder for future / unstarted question
        cardContainer.innerHTML = `
          <div class="card ts-trivia-active-card">
            <div class="ts-trivia-active-header">
              <span class="ts-trivia-qnum-badge">FRAGE #${activeIdx + 1} VON ${questions.length}</span>
              <span class="ts-trivia-status-tag" style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted);">🔒 Noch nicht gestartet</span>
            </div>
            <div class="ts-trivia-locked-placeholder">
              <div style="font-size: 2.2rem; margin-bottom: 8px;">⏳</div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #fff; margin-bottom: 6px;">Warten auf Spielleiter...</div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); max-width: 320px; margin: 0 auto; line-height: 1.45;">
                Der Admin schaltet Frage #${activeIdx + 1} gleich mit dem Countdown scharf. Mach dich bereit! 🌲
              </p>
            </div>
          </div>
        `;
      } else {
        const myAns = answers[activeQ.id] && answers[activeQ.id][currentUserId];
        const isCorrect = isQFrozen && myAns === activeQ.correctAnswer;
        const isWrong = isQFrozen && Boolean(myAns) && myAns !== activeQ.correctAnswer;

        let badgeText = 'Offen';
        let badgeBg = 'rgba(255, 255, 255, 0.1)';
        let badgeColor = 'var(--text-muted)';

        if (isQFrozen) {
          if (isCorrect) {
            badgeText = '✓ Richtig (+1 Punkt)';
            badgeBg = 'rgba(16, 185, 129, 0.25)';
            badgeColor = '#34d399';
          } else if (isWrong) {
            badgeText = '✗ Falsch (0 P)';
            badgeBg = 'rgba(239, 68, 68, 0.25)';
            badgeColor = '#fca5a5';
          } else {
            badgeText = '⏳ Zeit abgelaufen';
            badgeBg = 'rgba(239, 68, 68, 0.2)';
            badgeColor = '#fca5a5';
          }
        } else if (isCdRunning) {
          badgeText = `⏱️ ${cdRemaining}s übrig`;
          badgeBg = 'rgba(245, 158, 11, 0.25)';
          badgeColor = 'var(--sun-gold)';
        } else if (canManage) {
          badgeText = 'Bereit zum Starten';
          badgeBg = 'rgba(245, 158, 11, 0.2)';
          badgeColor = 'var(--sun-gold)';
        }

        // Render Options
        const optLetters = ['A', 'B', 'C', 'D'];
        let optionsHtml = (activeQ.options || []).map((opt, oIdx) => {
          const isSelected = myAns === opt;
          const isTrueSolution = opt === activeQ.correctAnswer;
          const letter = optLetters[oIdx] || String.fromCharCode(65 + oIdx);

          let optClass = 'ts-trivia-opt-btn';
          let icon = '';

          if (isQFrozen || canManage) {
            // After countdown: reveal whether player was correct, and highlight true solution
            if (isTrueSolution) {
              optClass += ' correct';
              icon = '✓';
            } else if (isSelected && !isTrueSolution) {
              optClass += ' wrong';
              icon = '✗';
            } else {
              optClass += ' neutral';
              icon = '';
            }
          } else {
            // During countdown: simply show selection
            if (isSelected) {
              optClass += ' selected';
              icon = '●';
            } else {
              icon = '○';
            }
          }

          const isDisabled = isQFrozen || canManage || !isCdRunning;
          const safeOpt = String(opt).replace(/"/g, '&quot;');

          return `
            <button type="button" class="${optClass}" data-qid="${activeQ.id}" data-opt="${safeOpt}" ${isDisabled ? 'disabled' : ''}>
              <div class="ts-trivia-opt-content">
                <span class="ts-trivia-opt-letter">${letter}</span>
                <span class="ts-trivia-opt-text">${opt}</span>
              </div>
              <span class="ts-trivia-opt-icon">${icon}</span>
            </button>
          `;
        }).join('');

        // Individual Result Banner after Countdown (Danach)
        let resultCalloutHtml = '';
        if (isQFrozen && !canManage) {
          if (isCorrect) {
            resultCalloutHtml = `
              <div class="ts-trivia-result-callout correct">
                <span style="font-size: 1.3rem;">🎉</span>
                <div>
                  <div style="font-weight: 800; font-size: 0.88rem;">Volltreffer! (+1 Punkt)</div>
                  <div style="font-size: 0.78rem; opacity: 0.9;">Deine Antwort &bdquo;${myAns}&ldquo; war genau richtig!</div>
                </div>
              </div>
            `;
          } else if (isWrong) {
            resultCalloutHtml = `
              <div class="ts-trivia-result-callout wrong">
                <span style="font-size: 1.3rem;">✗</span>
                <div>
                  <div style="font-weight: 800; font-size: 0.88rem;">Leider daneben! (0 Punkte)</div>
                  <div style="font-size: 0.78rem; opacity: 0.9;">Du hast &bdquo;${myAns}&ldquo; gewählt. Die richtige Antwort war: <strong>${activeQ.correctAnswer}</strong>.</div>
                </div>
              </div>
            `;
          } else {
            resultCalloutHtml = `
              <div class="ts-trivia-result-callout expired">
                <span style="font-size: 1.3rem;">⏳</span>
                <div>
                  <div style="font-weight: 800; font-size: 0.88rem;">Zeit abgelaufen!</div>
                  <div style="font-size: 0.78rem; opacity: 0.9;">Keine Antwort eingeloggt. Richtige Antwort: <strong>${activeQ.correctAnswer}</strong>.</div>
                </div>
              </div>
            `;
          }
        }

        // Holzfäller-Joker (Punkte-Verdoppler)
        const myJokerQId = tr.jokers && tr.jokers[currentUserId];
        const isThisQJoker = myJokerQId === activeQ.id;
        const otherJokerQ = (myJokerQId && myJokerQId !== activeQ.id)
          ? questions.find(q => q.id === myJokerQId)
          : null;

        let jokerTriviaBtnHtml = '';
        if (!canManage) {
          if (isThisQJoker) {
            jokerTriviaBtnHtml = `
              <div style="margin-top: 12px;">
                <button type="button" class="ts-joker-btn active" id="btn-toggle-trivia-joker" ${isQFrozen ? 'disabled' : ''}>
                  <span class="joker-icon">🃏</span>
                  <div class="joker-text">
                    <span class="joker-title">Holzfäller-Joker aktiv! (+1 Bonuspunkt bei Treffer) ✓</span>
                    <span class="joker-desc">${isQFrozen ? 'Für diese Frage eingeloggt.' : 'Klicke hier, um den Joker wieder zu entfernen.'}</span>
                  </div>
                </button>
              </div>
            `;
          } else if (!isQFrozen) {
            const jokerDesc = otherJokerQ
              ? `Aktuell gesetzt bei Frage #${questions.indexOf(otherJokerQ) + 1}. Klicke, um ihn hierhin zu verschieben.`
              : 'Setze deinen 1x Joker auf deine sicherste Frage: doppelter Punkt bei Treffer!';
            jokerTriviaBtnHtml = `
              <div style="margin-top: 12px;">
                <button type="button" class="ts-joker-btn" id="btn-toggle-trivia-joker">
                  <span class="joker-icon">🃏</span>
                  <div class="joker-text">
                    <span class="joker-title">Holzfäller-Joker setzen (+1 Bonuspunkt)</span>
                    <span class="joker-desc">${jokerDesc}</span>
                  </div>
                </button>
              </div>
            `;
          } else if (otherJokerQ) {
            jokerTriviaBtnHtml = `
              <div style="margin-top: 8px; font-size: 0.74rem; color: var(--text-muted);">
                <span class="ts-joker-badge">🃏 Joker</span> bei Frage #${questions.indexOf(otherJokerQ) + 1}
              </div>
            `;
          }
        }

        // Anonymes Balkendiagramm (Tipp-Verteilung) nach Countdown
        let distributionHtml = '';
        if (isQFrozen) {
          const qAnswers = (answers && answers[activeQ.id]) || {};
          const totalAnswers = activeMembers.filter(m => qAnswers[m.id]).length;

          if (totalAnswers > 0) {
            const counts = {};
            (activeQ.options || []).forEach(opt => { counts[opt] = 0; });
            activeMembers.forEach(m => {
              const a = qAnswers[m.id];
              if (a && counts[a] !== undefined) counts[a]++;
            });

            const distRows = (activeQ.options || []).map((opt, oIdx) => {
              const letter = optLetters[oIdx] || '•';
              const count = counts[opt] || 0;
              const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
              const isCorrectOpt = opt === activeQ.correctAnswer;
              return `
                <div class="ts-dist-row">
                  <div class="ts-dist-label">
                    <strong>${letter}:</strong> ${opt} ${isCorrectOpt ? '✓' : ''}
                  </div>
                  <div class="ts-dist-bar-track">
                    <div class="ts-dist-bar-fill ${isCorrectOpt ? 'correct' : ''}" style="width: ${pct}%;"></div>
                  </div>
                  <div class="ts-dist-stat">${count} (${pct}%)</div>
                </div>
              `;
            }).join('');

            distributionHtml = `
              <div class="ts-trivia-distribution-card">
                <div class="ts-dist-header">
                  <span>📊 Tipp-Verteilung der Runde</span>
                  <span style="font-weight: normal; color: var(--text-muted);">${totalAnswers} von ${activeMembers.length} Freunden</span>
                </div>
                ${distRows}
              </div>
            `;
          }
        }

        // Fun-Fact ("Wusstest du schon?") Box
        let funFactHtml = '';
        if (isQFrozen && activeQ.funFact) {
          funFactHtml = `
            <div class="ts-trivia-funfact-box">
              <div class="ts-trivia-funfact-title">💡 Wusstest du schon?</div>
              <div class="ts-trivia-funfact-text">${activeQ.funFact}</div>
            </div>
          `;
        }

        cardContainer.innerHTML = `
          <div class="card ts-trivia-active-card">
            <div class="ts-trivia-active-header">
              <span class="ts-trivia-qnum-badge">FRAGE #${activeIdx + 1} VON ${questions.length}</span>
              <span class="ts-trivia-status-tag" style="background: ${badgeBg}; color: ${badgeColor};">
                ${badgeText}
              </span>
            </div>
            <div class="ts-trivia-question-text">${activeQ.text}</div>
            <div class="ts-trivia-options-grid">${optionsHtml}</div>
            ${jokerTriviaBtnHtml}
            ${resultCalloutHtml}
            ${distributionHtml}
            ${funFactHtml}
          </div>
        `;

        // Wire option clicks for players during active countdown
        if (!isQFrozen && !canManage && isCdRunning) {
          cardContainer.querySelectorAll('.ts-trivia-opt-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
              const qId = Number(btn.getAttribute('data-qid'));
              const opt = btn.getAttribute('data-opt');
              const res = store.saveTriviaAnswer(qId, currentUserId, opt);
              if (res.success) {
                triggerHaptic('success');
                showToast(`Antwort eingeloggt: ${opt}! 🎯`, '✓');
                renderTimbersports();
              } else {
                showToast(res.message, '⚠️');
              }
            });
          });
        }

        // Wire Trivia Joker button
        const btnTriviaJoker = cardContainer.querySelector('#btn-toggle-trivia-joker');
        if (btnTriviaJoker && !isQFrozen && !canManage) {
          btnTriviaJoker.onclick = () => {
            const nextTarget = isThisQJoker ? null : activeQ.id;
            const res = store.setTriviaJoker(currentUserId, nextTarget);
            if (res.success) {
              if (res.active) fdsAudio.playJoker();
              triggerHaptic('success');
              showToast(res.active ? `🃏 Holzfäller-Joker auf Frage #${activeIdx + 1} gesetzt!` : 'Holzfäller-Joker entfernt.', '🃏');
              renderTimbersports();
            } else {
              showToast(res.message, '⚠️');
            }
          };
        }
      }
    }

    // 4. Full Quiz Resolution & Leaderboard (when revealed)
    const resultsContainer = document.getElementById('ts-trivia-results-container');
    if (resultsContainer) {
      if (isQuizRevealed) {
        resultsContainer.style.display = 'block';

        // Calculate scores
        const scores = activeMembers.map(m => {
          let score = 0;
          let jokerHit = false;
          questions.forEach(q => {
            if (answers[q.id] && answers[q.id][m.id] === q.correctAnswer) {
              score++;
              if (tr.jokers && tr.jokers[m.id] === q.id) {
                score++;
                jokerHit = true;
              }
            }
          });
          return { member: m, score, jokerHit };
        });
        scores.sort((a, b) => b.score - a.score);

        let rowsHtml = scores.map((sc, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
          const isMe = Number(currentUserId) === sc.member.id;
          const jokerBadge = sc.jokerHit
            ? '<span class="ts-joker-badge active" style="margin-left: 4px;" title="Holzfäller-Joker verdoppelt (+1P)">🃏 +1P</span>'
            : '';

          return `
            <tr style="border-bottom: 1px solid var(--border-subtle); background: ${isMe ? 'rgba(251, 191, 36, 0.08)' : 'transparent'};">
              <td style="padding: 8px 6px; font-weight: 800; color: ${idx === 0 ? 'var(--sun-gold)' : 'var(--text-muted)'};">${medal}</td>
              <td style="padding: 8px 6px; display: flex; align-items: center; gap: 8px;">
                <span class="avatar-sm">${renderAvatar(sc.member.avatar)}</span>
                <strong>${sc.member.name}</strong> ${isMe ? '<span style="font-size: 0.68rem; color: var(--sun-gold);">(Du)</span>' : ''} ${jokerBadge}
              </td>
              <td style="padding: 8px 6px; text-align: right; font-weight: 900; font-size: 1rem; color: var(--sun-gold);">
                ${sc.score} / ${questions.length + 1} Pkt
              </td>
            </tr>
          `;
        }).join('');

        resultsContainer.innerHTML = `
          <div class="card" style="border-color: #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(19, 26, 42, 0.9) 100%); padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <h4 style="font-size: 1rem; font-weight: 900; color: #fff; margin: 0;">🏆 Offizielle Quiz-Rangliste</h4>
                <div style="font-size: 0.74rem; color: #34d399; margin-top: 2px;">Vollständig aufgelöst & gewertet</div>
              </div>
              <span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34d399; font-weight: 800;">Aufgedeckt ✓</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="color: var(--text-muted); font-size: 0.68rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle);">
                  <th style="padding: 6px; text-align: left;">Rang</th>
                  <th style="padding: 6px; text-align: left;">Freund</th>
                  <th style="padding: 6px; text-align: right;">Punkte</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      } else {
        resultsContainer.style.display = 'none';
      }
    }

    // 5. Admin Trivia Controls & Live Submission Monitor
    const adminBox = document.getElementById('ts-trivia-admin-box');
    if (adminBox) {
      if (canManage) {
        adminBox.style.display = 'block';

        // Timer Status Badge
        const admBadge = document.getElementById('ts-trivia-admin-status-badge');
        if (admBadge) {
          if (isCdRunning) {
            admBadge.textContent = `Läuft: ${cdRemaining}s`;
            admBadge.className = 'ts-admin-timer-status running';
          } else if (isQFrozen) {
            admBadge.textContent = 'Gesperrt 🔒';
            admBadge.className = 'ts-admin-timer-status expired';
          } else {
            admBadge.textContent = 'Bereit';
            admBadge.className = 'ts-admin-timer-status';
          }
        }

        // Indicator
        const indEl = document.getElementById('ts-trivia-admin-qindicator');
        if (indEl) indEl.textContent = `Frage ${activeIdx + 1} von ${questions.length}`;

        // Monitor Title & Count
        const monTitle = document.getElementById('ts-trivia-admin-monitor-title');
        const monBadge = document.getElementById('ts-trivia-admin-monitor-badge');
        const qAnswers = (answers && answers[activeQ.id]) || {};
        const answeredCount = activeMembers.filter(m => qAnswers[m.id]).length;

        if (monTitle) monTitle.textContent = `📋 Live-Abgaben für Frage #${activeIdx + 1}`;
        if (monBadge) {
          monBadge.textContent = `${answeredCount} / ${activeMembers.length} abgegeben`;
          monBadge.className = 'ts-current-pick-badge ' + (answeredCount === activeMembers.length ? 'has-pick' : '');
        }

        // Friend Grid
        const friendGrid = document.getElementById('ts-trivia-admin-friend-grid');
        if (friendGrid) {
          friendGrid.innerHTML = activeMembers.map(m => {
            const mAns = qAnswers[m.id];
            const hasAns = Boolean(mAns);
            const isJoker = Boolean(tr.jokers && tr.jokers[m.id] === activeQ.id);
            const jokerBadge = isJoker ? ' <span class="ts-joker-badge active" style="font-size:0.65rem; padding: 1px 6px;">🃏 Joker</span>' : '';

            if (isQFrozen) {
              const isMatch = mAns === activeQ.correctAnswer;
              return `
                <div class="ts-beer-opt ${isMatch ? 'revealed-correct' : 'revealed-wrong'}" style="pointer-events:none; padding: 8px 10px;">
                  <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                  <span style="flex:1; font-weight:700; font-size:0.78rem;">${m.name}</span>
                  ${jokerBadge}
                  <span class="revealed-badge" style="font-size:0.7rem;">${isMatch ? '✓ ' + mAns : '✗ ' + (mAns || 'Keine')}</span>
                </div>
              `;
            } else {
              return `
                <div class="ts-beer-opt ${hasAns ? 'admin-friend-tipped' : ''}" style="pointer-events:none; padding: 8px 10px;">
                  <span class="avatar-sm">${renderAvatar(m.avatar)}</span>
                  <span style="flex:1; font-weight:700; font-size:0.78rem;">${m.name}</span>
                  ${jokerBadge}
                  <span class="admin-tip-badge ${hasAns ? 'tipped' : 'pending'}" style="font-size:0.7rem;">
                    ${hasAns ? '✓ Eingeloggt' : '⏳ Überlegt...'}
                  </span>
                </div>
              `;
            }
          }).join('');
        }

        // Wire Chips
        const customInput = document.getElementById('input-trivia-timer-custom');
        document.querySelectorAll('.ts-trivia-timer-chip').forEach(chip => {
          chip.onclick = () => {
            document.querySelectorAll('.ts-trivia-timer-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            if (customInput) customInput.value = chip.getAttribute('data-secs');
          };
        });

        // Wire Start
        const btnStart = document.getElementById('btn-start-trivia-timer');
        if (btnStart) {
          btnStart.onclick = () => {
            const dur = customInput ? Number(customInput.value) || 30 : 30;
            store.startTriviaCountdown(activeQId, dur);
            fdsAudio.playPlopp();
            triggerHaptic('success');
            showToast(`Countdown für Frage #${activeIdx + 1} gestartet (${dur}s)! ⏱️`, '✓');
            renderTimbersports();
          };
        }

        // Wire Stop
        const btnStop = document.getElementById('btn-stop-trivia-timer');
        if (btnStop) {
          btnStop.onclick = () => {
            store.stopTriviaCountdown();
            triggerHaptic('warning');
            showToast(`Frage #${activeIdx + 1} gestoppt & gesperrt! ⏹️`, '⚠️');
            renderTimbersports();
          };
        }

        // Wire Extend
        const btnExtend = document.getElementById('btn-extend-trivia-timer');
        if (btnExtend) {
          btnExtend.onclick = () => {
            store.extendTriviaCountdown(15);
            triggerHaptic('light');
            showToast('Timer um +15s verlängert! ⏱️', '✓');
            renderTimbersports();
          };
        }

        // Wire Reset
        const btnReset = document.getElementById('btn-reset-trivia-timer');
        if (btnReset) {
          btnReset.onclick = () => {
            store.resetTriviaCountdown(activeQId);
            triggerHaptic('light');
            showToast(`Timer für Frage #${activeIdx + 1} zurückgesetzt! 🔄`, 'ℹ️');
            renderTimbersports();
          };
        }

        // Wire Prev / Next Question
        const btnPrev = document.getElementById('btn-prev-trivia-q');
        if (btnPrev) {
          btnPrev.onclick = () => {
            const prevIdx = Math.max(0, activeIdx - 1);
            store.setTriviaActiveQuestion(questions[prevIdx].id);
            triggerHaptic('light');
            renderTimbersports();
          };
        }

        const btnNext = document.getElementById('btn-next-trivia-q');
        if (btnNext) {
          btnNext.onclick = () => {
            const nextIdx = Math.min(questions.length - 1, activeIdx + 1);
            store.setTriviaActiveQuestion(questions[nextIdx].id);
            triggerHaptic('light');
            renderTimbersports();
          };
        }

        // Wire Final Reveal Toggle
        const btnRevealQuiz = document.getElementById('btn-toggle-reveal-trivia-quiz');
        const btnRevealText = document.getElementById('btn-reveal-trivia-text');
        const btnRevealIcon = document.getElementById('btn-reveal-trivia-icon');

        if (btnRevealText) btnRevealText.textContent = isQuizRevealed ? 'Auflösung wieder verbergen' : 'Quiz offiziell auflösen';
        if (btnRevealIcon) btnRevealIcon.textContent = isQuizRevealed ? '🔒' : '🎉';

        if (btnRevealQuiz) {
          btnRevealQuiz.onclick = () => {
            const nextState = !isQuizRevealed;
            store.revealTriviaQuiz(nextState);
            if (nextState) {
              fdsAudio.playFanfare();
              fireSolarConfetti();
            }
            triggerHaptic('medium');
            showToast(nextState ? 'Wissensquiz offiziell aufgelöst! 🎉' : 'Auflösung verborgen.', '🏆');
            renderTimbersports();
          };
        }

        // Wire Add Question Modal
        const btnAddQ = document.getElementById('btn-open-add-trivia-modal');
        if (btnAddQ) {
          btnAddQ.onclick = () => {
            openModal('modal-add-trivia-question');
          };
        }
      } else {
        adminBox.style.display = 'none';
      }
    }
  }

  // --- Sub-Controller: Gesamtwertung & Spieltag-8-Übernahme ---
  function renderTimbersportsStandings(quiz, canManage, currentUserId, members) {
    const standings = store.calculateTimbersportsStandings();
    const standingsCard = document.getElementById('ts-standings-card');

    if (standingsCard) {
      let rowsHtml = standings.map((st, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const isMe = Number(currentUserId) === st.member.id;

        const beerJokerBadge = st.beerScore && st.beerScore.jokerBonus
          ? ` <span class="ts-joker-badge active" style="margin-left: 2px;" title="Goldener Kronkorken getroffen (+1P)">👑 +${st.beerScore.jokerBonus}</span>`
          : '';
        const sawJokerBadge = st.sawDetails && st.sawDetails.jokerHit
          ? ` <span class="ts-joker-badge active" style="margin-left: 2px;" title="Bullseye-Wette gewonnen (+2P)">🎯 +2</span>`
          : '';
        const triviaJokerBadge = st.triviaJokerHit
          ? ` <span class="ts-joker-badge active" style="margin-left: 2px;" title="Holzfäller-Joker verdoppelt (+1P)">🃏 +1</span>`
          : '';

        return `
          <tr style="border-bottom: 1px solid var(--border-subtle); background: ${isMe ? 'rgba(251, 191, 36, 0.08)' : 'transparent'};">
            <td style="padding: 10px 6px; font-weight: 900; font-size: ${idx < 3 ? '1.1rem' : '0.85rem'}; color: ${idx === 0 ? 'var(--sun-gold)' : 'var(--text-muted)'};">
              ${medal}
            </td>
            <td style="padding: 10px 6px; display: flex; align-items: center; gap: 8px;">
              <span class="avatar-sm">${renderAvatar(st.member.avatar)}</span>
              <div>
                <strong>${st.member.name}</strong> ${isMe ? '<span style="font-size: 0.68rem; color: var(--sun-gold);">(Du)</span>' : ''}
              </div>
            </td>
            <td style="padding: 10px 6px; text-align: center; color: var(--sun-gold); font-weight: 700;">
              ${st.beerScore.total} P${beerJokerBadge}
            </td>
            <td style="padding: 10px 6px; text-align: center; color: #34d399; font-weight: 700;">
              ${st.sawPoints} P${sawJokerBadge}
            </td>
            <td style="padding: 10px 6px; text-align: center; color: #38bdf8; font-weight: 700;">
              ${st.triviaScore} P${triviaJokerBadge}
            </td>
            <td style="padding: 10px 6px; text-align: right; font-weight: 900; font-size: 1.05rem; color: #fff;">
              ${st.totalPoints}
            </td>
          </tr>
        `;
      }).join('');

      standingsCard.innerHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="color: var(--text-muted); font-size: 0.68rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle);">
                <th style="padding: 6px; text-align: left;">Platz</th>
                <th style="padding: 6px; text-align: left;">Freund</th>
                <th style="padding: 6px; text-align: center;">🍺 Bier</th>
                <th style="padding: 6px; text-align: center;">🪚 Sägen</th>
                <th style="padding: 6px; text-align: center;">🎯 Quiz</th>
                <th style="padding: 6px; text-align: right;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }

    // Render Fun-Awards (Titel des Tages)
    const funAwards = standings.funAwards || {};
    const awardsContainer = document.getElementById('ts-fun-awards-container');
    if (awardsContainer) {
      const hasAnyAward = Boolean(funAwards.beerSommelier || funAwards.precisionSaw || funAwards.wildAxe || funAwards.triviaMaster);
      if (hasAnyAward) {
        awardsContainer.innerHTML = `
          <div style="margin-top: 18px; margin-bottom: 8px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 4px 0;">
              🎖️ Titel des Tages (Fun-Awards)
            </h4>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">
              Ehrentitel für die besten Leistungen und größten Heldentaten des Finales.
            </p>
          </div>
          <div class="ts-fun-awards-grid">
            <div class="ts-award-card">
              <div class="ts-award-icon">🍺</div>
              <div class="ts-award-info">
                <div class="ts-award-title">Der Biersommelier</div>
                <div class="ts-award-winner">${funAwards.beerSommelier ? funAwards.beerSommelier.member.name : 'Noch offen'}</div>
                <div class="ts-award-value">${funAwards.beerSommelier ? funAwards.beerSommelier.value : '–'}</div>
              </div>
            </div>
            <div class="ts-award-card">
              <div class="ts-award-icon">🪚</div>
              <div class="ts-award-info">
                <div class="ts-award-title">Die Präzisionssäge</div>
                <div class="ts-award-winner">${funAwards.precisionSaw ? funAwards.precisionSaw.member.name : 'Noch offen'}</div>
                <div class="ts-award-value">${funAwards.precisionSaw ? funAwards.precisionSaw.value : '–'}</div>
              </div>
            </div>
            <div class="ts-award-card">
              <div class="ts-award-icon">🪵</div>
              <div class="ts-award-info">
                <div class="ts-award-title">Die Axt im Walde</div>
                <div class="ts-award-winner">${funAwards.wildAxe ? funAwards.wildAxe.member.name : 'Noch offen'}</div>
                <div class="ts-award-value">${funAwards.wildAxe ? funAwards.wildAxe.value : '–'}</div>
              </div>
            </div>
            <div class="ts-award-card">
              <div class="ts-award-icon">🧠</div>
              <div class="ts-award-info">
                <div class="ts-award-title">Der Waldmeister</div>
                <div class="ts-award-winner">${funAwards.triviaMaster ? funAwards.triviaMaster.member.name : 'Noch offen'}</div>
                <div class="ts-award-value">${funAwards.triviaMaster ? funAwards.triviaMaster.value : '–'}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        awardsContainer.innerHTML = '';
      }
    }

    const adminBox = document.getElementById('ts-standings-admin-box');
    if (adminBox) {
      adminBox.style.display = canManage ? 'block' : 'none';
      const btnApply = document.getElementById('btn-apply-timbersports-scores');
      if (btnApply) {
        btnApply.onclick = () => {
          if (confirm('Möchtest du die Platzierungen 1 bis 8 offiziell in Spieltag 8 übernehmen? Damit wird das Saison-Finale 2026 abgeschlossen und gewertet!')) {
            const ok = store.applyTimbersportsToEvent8();
            if (ok) {
              fireSolarConfetti();
              showToast('🏆 Saison-Finale 2026 erfolgreich abgeschlossen!', '☀️');
              setTimeout(() => {
                switchView('view-leaderboard');
              }, 1200);
            } else {
              showToast('Fehler beim Übernehmen der Wertung.', '❌');
            }
          }
        };
      }
    }
  }

  // --- Sub-Controller: Bier-Pool Verwaltung (Admin-Tab) ---
  function renderTimbersportsBeerPool(quiz, canManage, currentUserId, members) {
    if (!canManage) return;
    const bt = quiz.beerTasting;
    const pool = bt.beerPool || [];
    const solutions = bt.solutions || [];

    // Map which beer name is assigned to which round
    const assignedMap = {};
    solutions.forEach((sol, idx) => {
      if (sol) assignedMap[sol] = idx + 1;
    });

    // Update count badge
    const countBadge = document.getElementById('ts-pool-count-badge');
    if (countBadge) {
      countBadge.textContent = `${pool.length} Biere im Pool`;
    }

    const listEl = document.getElementById('ts-pool-list-items');
    if (listEl) {
      listEl.innerHTML = pool.map((beerName, idx) => {
        const assignedRound = assignedMap[beerName];
        const isAssigned = Boolean(assignedRound);

        return `
          <div class="ts-pool-item-row" style="display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.28); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-weight: 800; font-size: 0.78rem; color: var(--text-muted); width: 26px;">#${idx + 1}</span>
            <input type="text" class="form-input ts-pool-input" data-index="${idx}" value="${beerName}" style="flex: 1; padding: 6px 8px; font-size: 0.8rem;">
            ${isAssigned 
              ? `<span style="font-size: 0.7rem; padding: 3px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700; white-space: nowrap;">Bier #${assignedRound}</span>`
              : `<span style="font-size: 0.7rem; padding: 3px 7px; border-radius: 4px; background: rgba(255, 255, 255, 0.05); color: var(--text-muted); white-space: nowrap;">Frei</span>`
            }
            <button type="button" class="icon-btn btn-delete-pool-item" data-index="${idx}" title="Bier löschen" style="color: #fca5a5; font-size: 0.85rem; padding: 4px 6px;">
              🗑️
            </button>
          </div>
        `;
      }).join('');

      // Wire delete buttons
      listEl.querySelectorAll('.btn-delete-pool-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-index'));
          const currentPool = [...(bt.beerPool || [])];
          const bName = currentPool[idx];
          if (confirm(`"${bName}" wirklich aus dem Bier-Pool entfernen?`)) {
            currentPool.splice(idx, 1);
            store.updateBeerPool(currentPool);
            showToast(`"${bName}" entfernt!`, '🗑️');
            renderTimbersports();
          }
        });
      });
    }

    // Wire save buttons (top & bottom)
    const handleSave = () => {
      const inputs = document.querySelectorAll('.ts-pool-input');
      const newPool = [];
      inputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) newPool.push(val);
      });
      store.updateBeerPool(newPool);
      triggerHaptic('success');
      showToast('Bier-Pool erfolgreich gespeichert! 🍺', '💾');
      renderTimbersports();
    };

    const btnSaveTop = document.getElementById('btn-tab-save-all-beers');
    if (btnSaveTop) btnSaveTop.onclick = handleSave;

    const btnSaveBottom = document.getElementById('btn-tab-save-all-beers-bottom');
    if (btnSaveBottom) btnSaveBottom.onclick = handleSave;

    // Wire Add beer
    const btnAdd = document.getElementById('btn-tab-add-beer');
    const inputAdd = document.getElementById('input-tab-new-beer-name');
    if (btnAdd && inputAdd) {
      btnAdd.onclick = () => {
        const val = inputAdd.value.trim();
        if (!val) {
          showToast('Bitte einen Biernamen eingeben!', '⚠️');
          return;
        }
        const currentPool = [...(bt.beerPool || [])];
        if (currentPool.includes(val)) {
          showToast('Dieses Bier ist bereits im Pool vorhanden!', '⚠️');
          return;
        }
        currentPool.push(val);
        store.updateBeerPool(currentPool);
        inputAdd.value = '';
        triggerHaptic('success');
        showToast(`"${val}" hinzugefügt! 🍺`, '➕');
        renderTimbersports();
      };
    }

    // Wire reset to default
    const btnReset = document.getElementById('btn-reset-beer-pool-default');
    if (btnReset) {
      btnReset.onclick = () => {
        if (confirm('Möchtest du den Bier-Pool wirklich auf die Standard-25-Biere zurücksetzen?')) {
          store.resetBeerPool();
          triggerHaptic('success');
          showToast('Bier-Pool auf Standard (25 Biere) zurückgesetzt!', '🔄');
          renderTimbersports();
        }
      };
    }
  }

  // --- Modal Helpers: Beer Pool Management ---
  const btnOpenBeerPoolModal = document.getElementById('btn-open-beer-pool-modal');
  if (btnOpenBeerPoolModal) {
    btnOpenBeerPoolModal.addEventListener('click', () => {
      store.setTimbersportsSubTab('beerpool');
      renderTimbersports();
    });
  }

  function renderBeerPoolModal() {
    const quiz = store.getTimbersportsQuiz();
    const pool = quiz.beerTasting.beerPool || [];
    const listEl = document.getElementById('beer-pool-items-list');
    if (!listEl) return;

    listEl.innerHTML = pool.map((beer, idx) => `
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); width: 22px;">#${idx + 1}</span>
        <input type="text" class="form-input beer-pool-item-input" data-idx="${idx}" value="${beer}" style="padding: 6px 10px; font-size: 0.8rem; flex: 1;">
        <button type="button" class="icon-btn btn-delete-beer-pool-item" data-idx="${idx}" style="color: #fca5a5; font-size: 0.85rem;" title="Bier löschen">✕</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-delete-beer-pool-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        pool.splice(idx, 1);
        store.updateBeerPool(pool);
        renderBeerPoolModal();
      });
    });
  }

  const btnAddBeerToPool = document.getElementById('btn-add-beer-to-pool');
  if (btnAddBeerToPool) {
    btnAddBeerToPool.addEventListener('click', () => {
      const input = document.getElementById('input-new-beer-name');
      const val = input ? input.value.trim() : '';
      if (!val) return;
      const quiz = store.getTimbersportsQuiz();
      const pool = quiz.beerTasting.beerPool || [];
      pool.push(val);
      store.updateBeerPool(pool);
      input.value = '';
      renderBeerPoolModal();
    });
  }

  const btnSaveBeerPool = document.getElementById('btn-save-beer-pool');
  if (btnSaveBeerPool) {
    btnSaveBeerPool.addEventListener('click', () => {
      const inputs = document.querySelectorAll('.beer-pool-item-input');
      const newPool = [];
      inputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) newPool.push(val);
      });
      store.updateBeerPool(newPool);
      closeAllModals();
      showToast('Bier-Pool erfolgreich aktualisiert! 🍺', '✓');
      renderTimbersports();
    });
  }

  // --- Modal Helpers: Add Trivia Question ---
  const formAddTrivia = document.getElementById('form-add-trivia-question');
  if (formAddTrivia) {
    formAddTrivia.addEventListener('submit', (e) => {
      e.preventDefault();
      const qText = document.getElementById('trivia-input-question').value.trim();
      const o1 = document.getElementById('trivia-opt-1').value.trim();
      const o2 = document.getElementById('trivia-opt-2').value.trim();
      const o3 = document.getElementById('trivia-opt-3').value.trim();
      const o4 = document.getElementById('trivia-opt-4').value.trim();
      const selCorrect = document.getElementById('trivia-select-correct').value;

      const opts = [o1, o2, o3, o4];
      const correctAns = opts[Number(selCorrect) - 1] || o1;

      store.addTriviaQuestion({
        text: qText,
        options: opts,
        correctAnswer: correctAns
      });

      formAddTrivia.reset();
      closeAllModals();
      showToast('Quizfrage erfolgreich hinzugefügt! 🎯', '✓');
      renderTimbersports();
    });
  }

  // --- General Timbersports Tab Navigation Handlers ---
  document.querySelectorAll('.ts-subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-ts-sub');
      const canManage = store.canManageTimbersports();
      if (canManage) {
        store.setTimbersportsSubTab(sub);
      } else {
        window._localTimbersportsSubTab = sub;
      }
      triggerHaptic('light');
      renderTimbersports();
    });
  });

  const btnTsToggleUnlock = document.getElementById('btn-ts-toggle-unlock');
  if (btnTsToggleUnlock) {
    btnTsToggleUnlock.addEventListener('click', () => {
      const cur = store.getTimbersportsQuiz();
      const next = !cur.isUnlockedForAll;
      store.setTimbersportsUnlocked(next);
      triggerHaptic('medium');
      showToast(next ? 'Timbersports-Special ist jetzt für alle Freunde freigeschaltet! 🌍🪓' : 'Geheim-Modus aktiv: Nur für Tim & Admin sichtbar! 🔒', '🪓');
      refreshActiveView();
    });
  }

  const btnTsToggleArchive = document.getElementById('btn-ts-toggle-archive');
  if (btnTsToggleArchive) {
    btnTsToggleArchive.addEventListener('click', () => {
      const cur = store.getTimbersportsQuiz();
      const next = !cur.isArchived;
      store.setTimbersportsArchived(next);
      triggerHaptic('medium');
      showToast(next ? 'Timbersports-Tab archiviert.' : 'Timbersports-Tab wiederhergestellt.', '📦');
      refreshActiveView();
    });
  }

  // Register Service Worker for PWA Offline Cache & Apple Web Push
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('✅ ServiceWorker registriert:', reg.scope);
          updatePushNotificationButtonState();
        })
        .catch(err => {
          console.warn('⚠️ ServiceWorker Registrierung fehlgeschlagen:', err);
        });
    });
  }

  // Initial Boot
  if (store.isAuthenticated() && !store.isAdmin()) {
    store.recordMemberActivity();
  }
  initSimulator();
  initLocationAutocomplete();
  refreshActiveView();
  handleHashNavigation();
});

