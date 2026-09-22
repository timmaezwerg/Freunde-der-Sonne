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
    '#kader': 'view-members'
  };
  const HASH_VIEW_MAP = {
    'view-leaderboard': '#tabelle',
    'view-events': '#spieltage',
    'view-members': '#kader'
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

    refreshActiveView();
  }

  function handleHashNavigation() {
    const hash = (window.location.hash || '').toLowerCase();
    if (VIEW_HASH_MAP[hash]) {
      switchView(VIEW_HASH_MAP[hash], false);
    }
  }

  window.addEventListener('hashchange', handleHashNavigation);

  function refreshActiveView() {
    const isAuthed = store.isAuthenticated();
    document.body.classList.toggle('auth-locked', !isAuthed);
    updateUserHeader();
    if (activeViewId === 'view-leaderboard') renderLeaderboard();
    if (activeViewId === 'view-events') renderEvents();
    if (activeViewId === 'view-members') renderMembers();
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

    function renderControlRows(roundKey, container) {
      if (!container) return;
      container.innerHTML = '';

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

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; padding: 4px 6px; background: rgba(255, 255, 255, 0.03); border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 800; width: 18px; color: ${row.simRank === 1 ? 'var(--sun-gold)' : row.simRank === 8 ? '#fca5a5' : 'var(--text-muted)'};">${row.simRank}.</span>
                  <div class="avatar-sm" style="width: 20px; height: 20px; font-size: 0.75rem; flex-shrink: 0;">${renderAvatar(row.avatar)}</div>
                  <span style="font-weight: 600;">${row.name}</span>
                  ${diffBadge}
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

    // Wintergrillen Verlierer Spotlight (Rank 8)
    const grillContainer = document.getElementById('grill-loser-container');
    const loser = leaderboard[leaderboard.length - 1];
    const seventhPlace = leaderboard[leaderboard.length - 2];
    const deficit = seventhPlace ? Math.max(0, seventhPlace.totalPoints - loser.totalPoints) : 0;

    if (loser) {
      grillContainer.innerHTML = `
        <div class="grill-loser-card">
          <div class="grill-warning-badge">
            <span>🔥</span> Drohendes Wintergrillen beim Verlierer
          </div>
          <div class="grill-card-body">
            <div class="grill-user-info">
              <div class="grill-avatar-wrapper">
                <div class="avatar" style="width: 48px; height: 48px; font-size: 1.3rem;">${renderAvatar(loser.avatar)}</div>
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; color: #ff9999;">
                  ${loser.name} steht am Grill! 🌭🥩
                </div>
                <div class="grill-notice">
                  Aktuell Letzter mit ${loser.totalPoints} Punkten (${deficit > 0 ? deficit + ' Pkt. Rückstand zu P7' : 'Punktgleich'})
                </div>
                <div class="grill-deficit">
                  Am Saisonende lädt Platz 8 alle Freunde zum Grillen & Bier ein!
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

        if (isAdmin) {
          // Admin view on upcoming event
          actionsHtml = `
            <button class="btn btn-primary btn-sm btn-edit-event" data-event-id="${evt.id}">
              <span>⚙️</span> Orga bearbeiten
            </button>
            <button class="btn btn-primary btn-sm btn-open-score-modal" data-event-id="${evt.id}">
              <span>⚖️</span> Wertung erfassen
            </button>
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
            <button class="btn btn-primary btn-sm btn-open-score-modal" data-event-id="${evt.id}">
              <span>⚖️</span> Wertung erfassen
            </button>
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

    document.querySelectorAll('.btn-open-score-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        openScoreEventModal(Number(btn.getAttribute('data-event-id')));
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

    if (!store.canScoreEvent(eventId, currentUserId)) {
      showToast('Nur der Organisator oder die Spielleitung darf die Wertung erfassen!', '🔒');
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
      alert('Fehler beim Speichern der Wertung.');
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

  function closeAllModals(force = false) {
    if (!force && !store.isAuthenticated()) {
      openUserPickerModal();
      return;
    }
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
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
    document.getElementById('edit-event-packing').value = (evt.packingList || []).join(', ');
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
    const packingList = packingRaw.split(',').map(s => s.trim()).filter(Boolean);

    const oldEvt = store.getEvent(eventId);
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
    nameInput.disabled = true; // Fixed group member name!

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

  document.getElementById('form-edit-member').addEventListener('submit', (e) => {
    e.preventDefault();
    const memberId = Number(document.getElementById('edit-member-id').value);
    const currentUserId = store.getCurrentUserId();
    const isAdmin = store.isAdmin();

    if (!isAdmin && memberId !== Number(currentUserId)) {
      showToast('Zugriff verweigert: Nur eigenes Profil änderbar!', '🔒');
      return;
    }

    const emojiVal = document.getElementById('edit-member-avatar').value.trim();
    const finalAvatar = currentEditingAvatar || emojiVal || '👤';

    // Keep group name fixed, only update nickname and avatar
    store.updateMember(memberId, {
      nickname: document.getElementById('edit-member-nickname').value.trim(),
      avatar: finalAvatar
    });

    closeAllModals();
    showToast('Profil aktualisiert!', finalAvatar);
    refreshActiveView();
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

    const loser = leaderboard[leaderboard.length - 1];
    if (loser) {
      text += `\n🥶 *Grill-Alarm:* ${loser.name} steht aktuell am Grill fürs Wintergrillen! 🌭🔥\n`;
    }

    if (nextUpcoming) {
      const org = store.getMember(nextUpcoming.organizerId)?.name || 'TBD';
      text += `\n📅 *Nächster Spieltag (${nextUpcoming.round}/8):*\n`;
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
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  initSimulator();
  initLocationAutocomplete();
  refreshActiveView();
  handleHashNavigation();
});

