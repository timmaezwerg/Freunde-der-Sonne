/* =========================================================
   Freunde der Sonne - Data Store & Game Mechanics
   Freunde: Lukas, Oli, Sven, Tobi, Tomi, Tim, Gabi, Aaron
   ========================================================= */

const STORAGE_KEY = 'fds_sonne_state_v10';
const CURRENT_USER_KEY = 'fds_current_user_id';
const MASTER_ADMIN_PIN = '7777';

const ADMIN_ACCOUNT = {
  id: 'admin',
  name: 'Administrator',
  nickname: 'Spielleitung',
  avatar: '🛡️',
  color: '#ef4444',
  isAdmin: true
};

const INITIAL_MEMBERS = [
  { id: 1, name: 'Lukas', nickname: 'Luki', avatar: '🎯', pin: '1234', color: '#38bdf8', isAdmin: false },
  { id: 2, name: 'Oli', nickname: 'Oli-Wan', avatar: '🧢', pin: '1234', color: '#ec4899', isAdmin: false },
  { id: 3, name: 'Sven', nickname: 'Der Stratege', avatar: '🧠', pin: '1234', color: '#a855f7', isAdmin: false },
  { id: 4, name: 'Tobi', nickname: 'Kraftpaket', avatar: '⚡', pin: '1234', color: '#facc15', isAdmin: false },
  { id: 5, name: 'Tomi', nickname: 'Sonnenanbeter', avatar: '☀️', pin: '1234', color: '#ea580c', isAdmin: false },
  { id: 6, name: 'Tim', nickname: 'Der Macher', avatar: '👑', pin: '1234', color: '#f59e0b', isAdmin: false },
  { id: 7, name: 'Gabi', nickname: 'Dauerläufer', avatar: '🏃‍♂️', pin: '1234', color: '#059669', isAdmin: false },
  { id: 8, name: 'Aaron', nickname: 'Glückspilz', avatar: '🍀', pin: '1234', color: '#a3e635', isAdmin: false }
];

const HISTORICAL_SEASONS = [
  {
    year: 2025,
    title: 'Saison 2025',
    winner: { name: 'Lukas (Luki)', points: 41, title: 'Sonnenkönig 2025 👑' },
    last: { name: 'Gabi & Tomi', points: 21, title: 'Grillmeister 2025 🥩' },
    summary: 'Lukas sicherte sich 2025 mit 41 Punkten die Krone der Sonne! Oli belegte Rang 2 mit 36 Punkten.',
    scores: [
      { rank: 1, name: 'Lukas (Luki)', points: 41, rounds: [5, 7, 7, 7, 6, 4, 5], avatar: '🎯' },
      { rank: 2, name: 'Oli', points: 36, rounds: [4, 6, 4, 5, 4, 6, 7], avatar: '🧢' },
      { rank: 3, name: 'Tim', points: 29, rounds: [1, 4, 5, 6, 5, 3, 5], avatar: '👑' },
      { rank: 4, name: 'Sven', points: 26, rounds: [3, 1, 6, 4, 3, 7, 2], avatar: '🧠' },
      { rank: 5, name: 'Tobi', points: 24, rounds: [1, 2, 5, 3, 7, 5, 1], avatar: '⚡' },
      { rank: 6, name: 'Gabi', points: 21, rounds: [6, 5, 3, 1, 1, 2, 3], avatar: '🏃‍♂️' },
      { rank: 7, name: 'Tomi', points: 21, rounds: [7, 3, 1, 2, 1, 1, 6], avatar: '☀️' }
    ]
  }
];

const INITIAL_EVENTS = [
  {
    id: 1,
    round: 1,
    title: 'Poker-Turnier & Drinks',
    organizerId: 2, // Oli
    date: '2026-01-24',
    time: '18:00 Uhr',
    location: 'Am Galgenberg 1, 73230 Kirchheim unter Teck',
    description: 'Auftakt-Spieltag 2026 bei Oli! Großes Texas Hold\'em Pokerturnier. Alle Plätze von 1 bis 8 wurden regulär ausgespielt – kein Spieler hat einen Joker gesetzt.',
    packingList: ['Pokerface', 'Gute Laune', 'Durst'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 1, rank: 1, basePoints: 8, points: 8, jokerApplied: false }, // Lukas (8)
      { playerId: 6, rank: 2, basePoints: 7, points: 7, jokerApplied: false }, // Tim (7)
      { playerId: 7, rank: 3, basePoints: 6, points: 6, jokerApplied: false }, // Gabi (6)
      { playerId: 5, rank: 4, basePoints: 5, points: 5, jokerApplied: false }, // Tomi (5)
      { playerId: 4, rank: 5, basePoints: 4, points: 4, jokerApplied: false }, // Tobi (4)
      { playerId: 3, rank: 6, basePoints: 3, points: 3, jokerApplied: false }, // Sven (3)
      { playerId: 8, rank: 7, basePoints: 2, points: 2, jokerApplied: false }, // Aaron (2)
      { playerId: 2, rank: 8, basePoints: 1, points: 1, jokerApplied: false }  // Oli (1)
    ]
  },
  {
    id: 2,
    round: 2,
    title: 'Quizduell-Meisterschaft',
    organizerId: 1, // Lukas
    date: '2026-03-13',
    time: '19:00 Uhr',
    location: 'QUIZ ZONE Stuttgart, Kesselstraße 17, 70327 Stuttgart',
    description: 'Wissensduell im Kneipenformat bei Lukas! Tim, Oli und Tomi haben vorab ihren Jahres-Joker gezündet und jeweils 12 Punkte (6x2) abgeräumt!',
    packingList: ['Allgemeinwissen', 'Schnelle Finger', 'Teamgeist'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 1, rank: 1, basePoints: 8, points: 8, jokerApplied: false }, // Lukas (8)
      { playerId: 4, rank: 1, basePoints: 8, points: 8, jokerApplied: false }, // Tobi (8)
      { playerId: 6, rank: 3, basePoints: 6, points: 12, jokerApplied: true }, // Tim (12 ⚡)
      { playerId: 2, rank: 3, basePoints: 6, points: 12, jokerApplied: true }, // Oli (12 ⚡)
      { playerId: 5, rank: 3, basePoints: 6, points: 12, jokerApplied: true }, // Tomi (12 ⚡)
      { playerId: 8, rank: 3, basePoints: 6, points: 6, jokerApplied: false }, // Aaron (6)
      { playerId: 7, rank: 7, basePoints: 4, points: 4, jokerApplied: false }, // Gabi (4)
      { playerId: 3, rank: 7, basePoints: 4, points: 4, jokerApplied: false }  // Sven (4)
    ]
  },
  {
    id: 3,
    round: 3,
    title: 'Lasertag Action',
    organizerId: 3, // Sven
    date: '2026-04-10',
    time: '18:30 Uhr',
    location: 'Laserbase Esslingen, Röntgenstraße 1, 73730 Esslingen am Neckar',
    description: 'Taktische Gefechte im Laser-Labyrinth bei Sven! Lukas schaltete seinen Joker scharf und sackte mit Rang 2 stolze 14 Punkte (7x2) ein.',
    packingList: ['Dunkle Kleidung', 'Hallenschuhe', 'Handtuch'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 2, rank: 1, basePoints: 8, points: 8, jokerApplied: false },  // Oli (8)
      { playerId: 1, rank: 2, basePoints: 7, points: 14, jokerApplied: true },  // Lukas (14 ⚡)
      { playerId: 6, rank: 3, basePoints: 6, points: 6, jokerApplied: false },  // Tim (6)
      { playerId: 4, rank: 4, basePoints: 5, points: 5, jokerApplied: false },  // Tobi (5)
      { playerId: 3, rank: 5, basePoints: 4, points: 4, jokerApplied: false },  // Sven (4)
      { playerId: 8, rank: 5, basePoints: 4, points: 4, jokerApplied: false },  // Aaron (4)
      { playerId: 5, rank: 7, basePoints: 0, points: 0, jokerApplied: false },  // Tomi (0)
      { playerId: 7, rank: 7, basePoints: 0, points: 0, jokerApplied: false }   // Gabi (0)
    ]
  },
  {
    id: 4,
    round: 4,
    title: 'Kegelabend & Bier',
    organizerId: 8, // Aaron
    date: '2026-05-16',
    time: '17:00 Uhr',
    location: 'TEV Fellbach Kegelbahn, Kienbachstraße 21, 70734 Fellbach',
    description: 'Volle Neun bei Aarons Heimspiel! Tomi sicherte sich 8 Punkte als Tagessieger. Gabi zündete ihren Joker und verdoppelte auf 10 Punkte (5x2)!',
    packingList: ['Hallensportschuhe', 'Durst', 'Gute Laune'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 5, rank: 1, basePoints: 8, points: 8, jokerApplied: false },  // Tomi (8)
      { playerId: 4, rank: 2, basePoints: 7, points: 7, jokerApplied: false },  // Tobi (7)
      { playerId: 3, rank: 3, basePoints: 6, points: 6, jokerApplied: false },  // Sven (6)
      { playerId: 7, rank: 4, basePoints: 5, points: 10, jokerApplied: true },  // Gabi (10 ⚡)
      { playerId: 8, rank: 5, basePoints: 4, points: 4, jokerApplied: false },  // Aaron (4)
      { playerId: 6, rank: 6, basePoints: 3, points: 3, jokerApplied: false },  // Tim (3)
      { playerId: 1, rank: 7, basePoints: 2, points: 2, jokerApplied: false },  // Lukas (2)
      { playerId: 2, rank: 8, basePoints: 0, points: 0, jokerApplied: false }   // Oli (0)
    ]
  },
  {
    id: 5,
    round: 5,
    title: 'Minigames Olympiade',
    organizerId: 5, // Tomi
    date: '2026-08-07',
    time: '16:00 Uhr',
    location: 'GAMER – Die Gameshow, Martinstraße 15, 73728 Esslingen am Neckar',
    description: 'Geschicklichkeits-Challenges & Garten-Minigames bei Tomi. Oli setzte sich durch und holte sich den Tagessieg mit 8 Punkten! Aaron zündete seinen Joker und verdoppelte auf 4 Punkte (2x2).',
    packingList: ['Bequeme Kleidung', 'Sneaker', 'Sonnenschutz'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 2, rank: 1, basePoints: 8, points: 8, jokerApplied: false },  // Oli (8)
      { playerId: 1, rank: 2, basePoints: 7, points: 7, jokerApplied: false },  // Lukas (7)
      { playerId: 3, rank: 3, basePoints: 6, points: 6, jokerApplied: false },  // Sven (6)
      { playerId: 6, rank: 4, basePoints: 5, points: 5, jokerApplied: false },  // Tim (5)
      { playerId: 4, rank: 5, basePoints: 4, points: 4, jokerApplied: false },  // Tobi (4)
      { playerId: 7, rank: 6, basePoints: 3, points: 3, jokerApplied: false },  // Gabi (3)
      { playerId: 8, rank: 7, basePoints: 2, points: 4, jokerApplied: true },   // Aaron (4 ⚡ Joker verbraucht)
      { playerId: 5, rank: 8, basePoints: 1, points: 1, jokerApplied: false }   // Tomi (1)
    ]
  },
  {
    id: 6,
    round: 6,
    title: 'Squash & Power-Match',
    organizerId: 4, // Tobi
    date: '2026-08-29',
    time: '14:00 Uhr',
    location: 'Match Center Filderstadt, Mahlestraße 70, 70794 Filderstadt',
    description: 'Rasante Duelle auf dem Squash-Court bei Tobi! Tobi dominierte sein Heim-Event mit 8 Punkten.',
    packingList: ['Squashschläger', 'Helle Hallensohlen', 'Handtuch', 'Viel Wasser'],
    status: 'completed',
    isFrozen: true,
    pendingJokers: [],
    scores: [
      { playerId: 4, rank: 1, basePoints: 8, points: 8, jokerApplied: false },  // Tobi (8)
      { playerId: 1, rank: 2, basePoints: 7, points: 7, jokerApplied: false },  // Lukas (7)
      { playerId: 2, rank: 3, basePoints: 6, points: 6, jokerApplied: false },  // Oli (6)
      { playerId: 5, rank: 4, basePoints: 5, points: 5, jokerApplied: false },  // Tomi (5)
      { playerId: 7, rank: 5, basePoints: 4, points: 4, jokerApplied: false },  // Gabi (4)
      { playerId: 6, rank: 6, basePoints: 3, points: 3, jokerApplied: false },  // Tim (3)
      { playerId: 3, rank: 7, basePoints: 2, points: 2, jokerApplied: false },  // Sven (2)
      { playerId: 8, rank: 8, basePoints: 0, points: 0, jokerApplied: false }   // Aaron (0)
    ]
  },
  {
    id: 7,
    round: 7,
    title: 'Spieltag 7 (Überraschungs-Event)',
    organizerId: 7, // Gabi
    date: '2026-10-09',
    time: '18:00 Uhr',
    location: 'Wird von Gabi bekannt gegeben',
    description: 'Der vorletzte Spieltag der Saison 2026! Tobi und Sven haben noch ihren Joker im Ärmel – wer greift nach der Krone oder wendet das Wintergrillen ab?',
    packingList: ['Gute Laune', 'Details folgen'],
    status: 'upcoming',
    isFrozen: false,
    pendingJokers: [],
    scores: []
  },
  {
    id: 8,
    round: 8,
    title: 'Großes Saison-Finale 2026',
    organizerId: 6, // Tim
    date: '2026-10-30',
    time: '18:30 Uhr',
    location: 'Wird von Tim bekannt gegeben',
    description: 'Das große Saison-Finale 2026 bei Tim! Wer wird neuer Sonnenkönig 👑 und wer muss als Tabellenletzter das Wintergrillen 🥩 für die Gruppe ausrichten?',
    packingList: ['Feierlaune', 'Details folgen'],
    status: 'upcoming',
    isFrozen: false,
    pendingJokers: [],
    scores: []
  },
  {
    id: 9,
    round: 9,
    isSpecial: true,
    title: 'Traditionelles Wintergrillen 2026',
    organizerId: 5, // Automatically last place after round 8; initially current 8th place (Tomi)
    isOrganizerOverridden: false,
    date: '2026-11-21',
    time: '17:00 Uhr',
    location: 'Wird vom Grillmeister bekannt gegeben',
    description: 'Das traditionelle Wintergrillen der Freunde der Sonne 🥩🔥! Der Tabellenletzte der Saison 2026 muss für die gesamte Truppe grillen und die Getränke stellen. Keine Spieltags-Wertung, keine Joker – einfach ein legendärer Jahresabschluss!',
    packingList: ['Riesiger Hunger', 'Durst auf Bier & Glühwein', 'Winterjacke & Handschuhe'],
    status: 'upcoming',
    isFrozen: false,
    pendingJokers: [],
    scores: []
  }
];

// --- Database to JavaScript Object Mapping Helpers ---
function fromDbMember(m) {
  return {
    id: Number(m.id),
    name: m.name,
    nickname: m.nickname || '',
    avatar: m.avatar || '👤',
    pin: String(m.pin || '1234'),
    color: m.color || '#38bdf8',
    isAdmin: Boolean(m.is_admin)
  };
}

function toDbMember(m) {
  return {
    id: m.id,
    name: m.name,
    nickname: m.nickname,
    avatar: m.avatar,
    pin: m.pin,
    color: m.color,
    is_admin: Boolean(m.isAdmin),
    updated_at: new Date().toISOString()
  };
}

function fromDbEvent(e) {
  const isSpecial = Number(e.id) === 9 || Number(e.round) === 9;
  const pendingJokers = Array.isArray(e.pending_jokers) ? e.pending_jokers : [];
  const isOrganizerOverridden = isSpecial && pendingJokers.includes('override');

  let packingItems = [];
  let rsvps = {};

  if (Array.isArray(e.packing_list)) {
    packingItems = e.packing_list.map(it => {
      if (typeof it === 'string') return { text: it, checked: false, broughtBy: null };
      return it;
    });
  } else if (e.packing_list && typeof e.packing_list === 'object') {
    const rawItems = Array.isArray(e.packing_list.items) ? e.packing_list.items : [];
    packingItems = rawItems.map(it => {
      if (typeof it === 'string') return { text: it, checked: false, broughtBy: null };
      return it;
    });
    rsvps = (e.packing_list.rsvps && typeof e.packing_list.rsvps === 'object') ? e.packing_list.rsvps : {};
  }

  if (e.rsvps && typeof e.rsvps === 'object' && Object.keys(e.rsvps).length > 0) {
    rsvps = e.rsvps;
  }

  return {
    id: Number(e.id),
    round: Number(e.round),
    isSpecial: isSpecial,
    isOrganizerOverridden: isOrganizerOverridden,
    title: e.title,
    organizerId: Number(e.organizer_id),
    date: e.date,
    time: e.time,
    location: e.location,
    description: e.description || '',
    packingList: packingItems,
    rsvps: rsvps,
    status: e.status || 'upcoming',
    isFrozen: Boolean(e.is_frozen),
    pendingJokers: pendingJokers,
    scores: Array.isArray(e.scores) ? e.scores : []
  };
}

function toDbEvent(e) {
  let pendingJokers = e.pendingJokers || [];
  if (e.isSpecial || e.id === 9) {
    pendingJokers = e.isOrganizerOverridden ? ['override'] : [];
  }

  const packingPayload = {
    items: Array.isArray(e.packingList) ? e.packingList : [],
    rsvps: (e.rsvps && typeof e.rsvps === 'object') ? e.rsvps : {}
  };

  return {
    id: e.id,
    round: e.round,
    title: e.title,
    organizer_id: e.organizerId,
    date: e.date,
    time: e.time,
    location: e.location,
    description: e.description,
    packing_list: packingPayload,
    status: e.status,
    is_frozen: Boolean(e.isFrozen),
    pending_jokers: pendingJokers,
    scores: e.scores || [],
    updated_at: new Date().toISOString()
  };
}

class DataStore {
  constructor() {
    this.init();
    setTimeout(() => {
      this.initCloudSync();
    }, 200);
  }

  init() {
    // Clean up any legacy storage keys to prevent memory clutter and stale data
    for (let i = 1; i <= 9; i++) {
      try { localStorage.removeItem(`fds_sonne_state_v${i}`); } catch (e) {}
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.reset();
    } else {
      try {
        this.state = JSON.parse(raw);
        // Validate state & guarantee 2026 data integrity
        if (
          !this.state.members || 
          this.state.members.length !== 8 || 
          !this.state.events || 
          this.state.events.length < 8 ||
          this.state.events[0].title !== 'Poker-Turnier & Drinks'
        ) {
          this.reset();
        } else {
          // Guarantee event 9 (Wintergrillen) exists
          if (!this.state.events.some(e => e.id === 9)) {
            const wg = INITIAL_EVENTS.find(e => e.id === 9);
            if (wg) {
              this.state.events.push(JSON.parse(JSON.stringify(wg)));
              this.save();
            }
          }
          // Normalize packingList and rsvps on all events
          this.state.events.forEach(evt => {
            if (!evt.rsvps || typeof evt.rsvps !== 'object') {
              evt.rsvps = {};
            }
            if (Array.isArray(evt.packingList)) {
              evt.packingList = evt.packingList.map(it => {
                if (typeof it === 'string') return { text: it, checked: false, broughtBy: null };
                return it;
              });
            } else {
              evt.packingList = [];
            }
          });
          this.syncWintergrillenOrganizer();
        }
      } catch (e) {
        console.error('Failed to parse localStorage data, resetting', e);
        this.reset();
      }
    }
  }

  syncWintergrillenOrganizer() {
    if (!this.state || !this.state.events) return;
    const wg = this.state.events.find(e => e.id === 9 || e.isSpecial);
    if (!wg) return;

    // If not overridden by Admin, dynamically reflect last place from leaderboard
    if (!wg.isOrganizerOverridden) {
      const lb = this.getLeaderboard();
      if (lb && lb.length > 0) {
        const loser = lb[lb.length - 1]; // rank 8 (Tabellenletzter)
        if (loser && loser.id && wg.organizerId !== loser.id) {
          wg.organizerId = loser.id;
        }
      }
    }
  }

  save(entity = null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    if (entity) {
      if (entity.round !== undefined) {
        this.pushEventToCloud(entity);
      } else if (entity.name !== undefined) {
        this.pushMemberToCloud(entity);
      }
    }
  }

  reset() {
    this.state = {
      members: JSON.parse(JSON.stringify(INITIAL_MEMBERS)),
      events: JSON.parse(JSON.stringify(INITIAL_EVENTS)),
      season: 2026
    };
    this.syncWintergrillenOrganizer();
    this.save();
    return this.state;
  }

  getMembers() {
    return this.state.members;
  }

  getMember(id) {
    return this.state.members.find(m => m.id === Number(id));
  }

  getEvents() {
    this.syncWintergrillenOrganizer();
    return this.state.events;
  }

  getEvent(id) {
    this.syncWintergrillenOrganizer();
    return this.state.events.find(e => e.id === Number(id));
  }

  // --- Authentication & Sessions ---
  getCurrentUserId() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      if (stored === 'admin') return 'admin';
      const id = Number(stored);
      if (this.getMember(id)) return id;
    }
    return null;
  }

  isAuthenticated() {
    return this.getCurrentUserId() !== null;
  }

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  getAdminAccount() {
    return { 
      ...ADMIN_ACCOUNT, 
      pin: this.state.adminPin || MASTER_ADMIN_PIN 
    };
  }

  getCurrentUser() {
    const currentId = this.getCurrentUserId();
    if (!currentId) return null;
    if (currentId === 'admin') {
      return this.getAdminAccount();
    }
    return this.getMember(currentId);
  }

  setCurrentUser(id) {
    if (id === 'admin') {
      localStorage.setItem(CURRENT_USER_KEY, 'admin');
      return true;
    }
    const member = this.getMember(id);
    if (member) {
      localStorage.setItem(CURRENT_USER_KEY, String(member.id));
      return true;
    }
    return false;
  }

  // Verify PIN & Login
  login(memberId, enteredPin) {
    const pinTrimmed = String(enteredPin).trim();
    const adminPin = this.state.adminPin || MASTER_ADMIN_PIN;

    // Special Admin Account Login
    if (memberId === 'admin' || String(memberId) === 'admin') {
      if (pinTrimmed === adminPin || pinTrimmed === MASTER_ADMIN_PIN) {
        this.setCurrentUser('admin');
        return { success: true, member: this.getAdminAccount() };
      }
      return { success: false, message: 'Falscher Admin-PIN-Code! Bitte erneut versuchen.' };
    }

    const member = this.getMember(memberId);
    if (!member) return { success: false, message: 'Mitglied nicht gefunden.' };

    if (pinTrimmed === member.pin || pinTrimmed === adminPin) {
      this.setCurrentUser(member.id);
      return { success: true, member };
    }
    return { success: false, message: 'Falscher PIN-Code! Bitte erneut versuchen.' };
  }

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  isAdmin() {
    return this.getCurrentUserId() === 'admin';
  }

  verifyAdminPin(pin) {
    const adminPin = this.state.adminPin || MASTER_ADMIN_PIN;
    return String(pin).trim() === adminPin;
  }

  updateAdminPin(oldPin, newPin) {
    const adminPin = this.state.adminPin || MASTER_ADMIN_PIN;
    if (String(oldPin).trim() !== adminPin) {
      return { success: false, message: 'Alte Admin-PIN ist nicht korrekt.' };
    }
    if (!newPin || String(newPin).trim().length < 4) {
      return { success: false, message: 'Die neue Admin-PIN muss mindestens 4 Ziffern haben.' };
    }
    this.state.adminPin = String(newPin).trim();
    this.save();
    return { success: true, message: 'Admin-PIN erfolgreich geändert!' };
  }

  // Member PIN update
  updateMemberPin(memberId, oldPin, newPin) {
    const member = this.getMember(memberId);
    if (!member) return { success: false, message: 'Mitglied nicht gefunden.' };

    if (String(oldPin).trim() !== member.pin && String(oldPin).trim() !== MASTER_ADMIN_PIN) {
      return { success: false, message: 'Alte PIN ist nicht korrekt.' };
    }
    if (!newPin || String(newPin).trim().length < 4) {
      return { success: false, message: 'Die neue PIN muss mindestens 4 Ziffern haben.' };
    }

    member.pin = String(newPin).trim();
    this.save(member);
    return { success: true, message: 'PIN erfolgreich geändert!' };
  }

  // Admin PIN Reset
  adminResetMemberPin(memberId, newPin) {
    const member = this.getMember(memberId);
    if (!member) return { success: false, message: 'Mitglied nicht gefunden.' };

    member.pin = String(newPin).trim();
    this.save(member);
    return { success: true, message: `PIN für ${member.name} wurde zurückgesetzt!` };
  }

  // --- Admin Event Organizer Allocation ---
  assignEventOrganizer(eventId, newOrganizerId) {
    const evt = this.getEvent(eventId);
    if (!evt) return { success: false, message: 'Ungültige Daten.' };

    if (evt.status === 'completed') {
      return { success: false, message: 'Abgeschlossene Spieltage können nicht mehr neu zugeteilt werden.' };
    }

    // Special handling for Wintergrillen (Event 9)
    if (evt.id === 9 || evt.isSpecial) {
      if (newOrganizerId === 'auto' || !newOrganizerId) {
        evt.isOrganizerOverridden = false;
        evt.pendingJokers = [];
        this.syncWintergrillenOrganizer();
        this.save(evt);
        return { success: true, message: 'Wintergrillen wird nun wieder automatisch durch den Tabellenletzten ausgerichtet!' };
      }
      const newOrg = this.getMember(newOrganizerId);
      if (!newOrg) return { success: false, message: 'Mitglied nicht gefunden.' };
      evt.organizerId = newOrg.id;
      evt.isOrganizerOverridden = true;
      evt.pendingJokers = ['override'];
      this.save(evt);
      return { success: true, message: `Wintergrillen wurde ${newOrg.name} als Grillmeister zugeteilt (Admin-Override)!` };
    }

    const newOrg = this.getMember(newOrganizerId);
    if (!newOrg) return { success: false, message: 'Ungültige Daten.' };

    const oldOrgId = evt.organizerId;
    evt.organizerId = newOrg.id;

    // Rule: If new organizer had a pending joker on this event, cancel it (own-event rule!)
    if (evt.pendingJokers && evt.pendingJokers.includes(newOrg.id)) {
      evt.pendingJokers = evt.pendingJokers.filter(id => id !== newOrg.id);
    }

    this.save(evt);
    return {
      success: true,
      message: `Spieltag ${evt.round} wurde ${newOrg.name} als Organisator zugeteilt!`
    };
  }

  // --- Freeze Logic (Spieltagsbeginn & Joker-Freeze) ---
  isEventFrozen(evt) {
    if (!evt) return false;
    if (evt.status === 'completed') return true;
    if (evt.isFrozen === true) return true;

    // Optional: Auto-freeze if date and time have passed
    if (evt.date && evt.time) {
      try {
        const timeMatch = evt.time.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0');
          const minutes = timeMatch[2];
          const eventDate = new Date(`${evt.date}T${hours}:${minutes}:00`);
          if (!isNaN(eventDate.getTime()) && new Date() >= eventDate) {
            return true;
          }
        }
      } catch (e) {
        // Fallback to manual flag
      }
    }
    return false;
  }

  toggleEventFreeze(eventId) {
    const evt = this.getEvent(eventId);
    if (!evt) return { success: false, message: 'Spieltag nicht gefunden.' };
    if (evt.status === 'completed') {
      return { success: false, message: 'Ein bereits abgeschlossener Spieltag kann nicht mehr verändert werden.' };
    }

    evt.isFrozen = !evt.isFrozen;
    this.save(evt);
    return {
      success: true,
      isFrozen: evt.isFrozen,
      message: evt.isFrozen 
        ? `Spieltag ${evt.round} gestartet! Alle gesetzten Joker sind jetzt eingefroren 🔒` 
        : `Freeze für Spieltag ${evt.round} aufgehoben.`
    };
  }

  // --- Role & Permissions Check ---
  canEditEvent(eventId, playerId = null) {
    const pId = playerId !== null ? playerId : this.getCurrentUserId();
    if (!pId) return false;
    const evt = this.getEvent(eventId);
    if (!evt) return false;
    // If completed: only Admin can edit event details!
    if (evt.status === 'completed') return this.isAdmin();
    // Normal event: organizer or admin
    return evt.organizerId === Number(pId) || this.isAdmin();
  }

  // Can score event: Organizer scores normally; Admin can also score or correct completed events!
  // Rule: For upcoming events, the matchday MUST be started & frozen first!
  canScoreEvent(eventId, playerId = null) {
    const pId = playerId !== null ? playerId : this.getCurrentUserId();
    if (!pId) return false;
    const evt = this.getEvent(eventId);
    if (!evt) return false;
    if (evt.id === 9 || evt.isSpecial) return false; // Wintergrillen has no scoring!
    // Once completed: ONLY the Admin can correct the scores!
    if (evt.status === 'completed') return this.isAdmin();
    // Open/upcoming event: must be organizer or admin AND matchday must be frozen (started)!
    const isAuthorized = evt.organizerId === Number(pId) || this.isAdmin();
    if (!isAuthorized) return false;
    return this.isEventFrozen(evt);
  }

  // Joker rules:
  // 1. Admin cannot use Joker!
  // 2. Cannot use Joker on own organized event!
  // 3. Cannot use Joker if already used this season!
  // 4. Cannot use Joker or change Joker if event is frozen (begonnen)!
  // 5. Cannot use Joker if event is completed!
  // 6. Wintergrillen has NO jokers!
  canSetJoker(eventId, playerId = null) {
    const pId = playerId !== null ? playerId : this.getCurrentUserId();
    if (!pId) {
      return { allowed: false, reason: 'Bitte melde dich zuerst mit deinem Profil an.' };
    }
    if (pId === 'admin') {
      return { allowed: false, reason: 'Das Adminkonto nimmt nicht an der Spieler-Wertung teil.' };
    }

    const evt = this.getEvent(eventId);
    if (!evt) return { allowed: false, reason: 'Spieltag existiert nicht.' };

    if (evt.id === 9 || evt.isSpecial) {
      return { allowed: false, reason: 'Beim Wintergrillen gibt es keine Joker!' };
    }

    if (this.isEventFrozen(evt)) {
      return {
        allowed: false,
        reason: '🔒 Spieltag ist gestartet – Joker sind eingefroren!'
      };
    }

    if (evt.organizerId === Number(pId)) {
      return {
        allowed: false,
        reason: '🚫 Am eigenen organisierten Spieltag ist der Joker nicht erlaubt!'
      };
    }

    if (evt.status === 'completed') {
      return {
        allowed: false,
        reason: 'Dieser Spieltag ist bereits abgeschlossen.'
      };
    }

    const jokerStatus = this.getJokerStatus(pId);
    if (jokerStatus.status === 'used') {
      return {
        allowed: false,
        reason: 'Du hast deinen Jahres-Joker in dieser Saison bereits eingelöst!'
      };
    }

    return { allowed: true };
  }

  // Toggle my Joker for an upcoming event
  toggleMyJoker(eventId, playerId = null) {
    const pId = playerId !== null ? playerId : this.getCurrentUserId();
    if (!pId) {
      return { success: false, message: 'Bitte melde dich zuerst mit deinem Profil an.' };
    }
    if (pId === 'admin') {
      return { success: false, message: 'Das Adminkonto kann keinen Joker setzen.' };
    }

    const eId = Number(eventId);
    const evt = this.getEvent(eId);
    if (!evt) return { success: false, message: 'Spieltag nicht gefunden.' };

    if (evt.status === 'completed') {
      return { success: false, message: 'Dieser Spieltag ist bereits abgeschlossen.' };
    }

    if (this.isEventFrozen(evt)) {
      return {
        success: false,
        message: '🔒 Spieltag ist bereits gestartet! Gesetzte Joker sind eingefroren und können nicht mehr verändert werden.'
      };
    }

    const isCurrentlyPending = evt.pendingJokers && evt.pendingJokers.includes(pId);

    if (isCurrentlyPending) {
      // Remove / cancel Joker
      this.cancelPendingJoker(pId, eId);
      return {
        success: true,
        action: 'removed',
        message: 'Joker für diesen Spieltag zurückgenommen.'
      };
    } else {
      // Check permission
      const check = this.canSetJoker(eId, pId);
      if (!check.allowed) {
        return { success: false, message: check.reason };
      }
      return this.registerJoker(pId, eId);
    }
  }

  // Register Joker before event starts
  registerJoker(playerId, eventId) {
    const pId = Number(playerId);
    const eId = Number(eventId);

    const check = this.canSetJoker(eId, pId);
    if (!check.allowed) {
      return { success: false, message: check.reason };
    }

    // Remove pending joker from any other event first
    this.state.events.forEach(evt => {
      if (evt.pendingJokers) {
        evt.pendingJokers = evt.pendingJokers.filter(id => id !== pId);
      }
    });

    const targetEvent = this.getEvent(eId);
    if (!targetEvent.pendingJokers) targetEvent.pendingJokers = [];
    targetEvent.pendingJokers.push(pId);

    this.save(targetEvent);
    return {
      success: true,
      action: 'added',
      message: `Joker für Spieltag ${targetEvent.round} scharf geschaltet! ⚡`
    };
  }

  cancelPendingJoker(playerId, eventId) {
    const targetEvent = this.getEvent(eventId);
    if (targetEvent && targetEvent.pendingJokers) {
      targetEvent.pendingJokers = targetEvent.pendingJokers.filter(id => id !== Number(playerId));
      this.save(targetEvent);
      return { success: true };
    }
    return { success: false };
  }

  getJokerStatus(playerId) {
    if (playerId === 'admin' || String(playerId) === 'admin') {
      return { status: 'none', eventId: null };
    }

    const pId = Number(playerId);
    if (isNaN(pId)) return { status: 'none', eventId: null };

    for (const evt of this.state.events) {
      if (evt.status === 'completed' && evt.scores) {
        const score = evt.scores.find(s => s.playerId === pId && s.jokerApplied);
        if (score) {
          return { status: 'used', eventId: evt.id, eventTitle: evt.title, round: evt.round };
        }
      }
    }

    for (const evt of this.state.events) {
      if (evt.status !== 'completed' && evt.pendingJokers && evt.pendingJokers.includes(pId)) {
        return { 
          status: 'pending', 
          eventId: evt.id, 
          eventTitle: evt.title, 
          round: evt.round,
          isFrozen: this.isEventFrozen(evt)
        };
      }
    }

    return { status: 'available', eventId: null };
  }

  updateEvent(eventId, fields) {
    const evt = this.getEvent(eventId);
    if (!evt) return false;
    // Completed events can only be updated by the Admin!
    if (evt.status === 'completed' && !this.isAdmin()) return false;
    Object.assign(evt, fields);
    this.save(evt);
    return true;
  }

  saveEventScoring(eventId, rawScores, isCorrection = false) {
    const evt = this.getEvent(eventId);
    if (!evt) return false;

    const isAlreadyCompleted = evt.status === 'completed';
    // If completed: only allowed if isCorrection AND isAdmin()!
    if (isAlreadyCompleted && (!isCorrection || !this.isAdmin())) return false;
    // Rule: Matchday MUST be started & frozen before scores can be saved!
    if (!isCorrection && !this.isEventFrozen(evt)) return false;

    const pendingJokers = evt.pendingJokers || [];
    const previousScores = evt.scores || [];

    evt.scores = rawScores.map(item => {
      const pId = Number(item.playerId);
      let isJoker = false;
      if (isAlreadyCompleted) {
        // In correction mode, preserve previously recorded joker status unless item explicitly overrides it
        const prev = previousScores.find(s => s.playerId === pId);
        isJoker = (item.jokerApplied !== undefined) ? Boolean(item.jokerApplied) : (prev ? Boolean(prev.jokerApplied) : false);
      } else {
        isJoker = pendingJokers.includes(pId);
      }

      const basePoints = Number(item.points);
      const finalPoints = isJoker ? basePoints * 2 : basePoints;

      return {
        playerId: pId,
        rank: Number(item.rank),
        basePoints: basePoints,
        points: finalPoints,
        jokerApplied: isJoker
      };
    });

    evt.status = 'completed';
    evt.isFrozen = true;
    evt.pendingJokers = [];

    this.save(evt);
    return true;
  }

  reopenEvent(eventId) {
    if (!this.isAdmin()) return { success: false, message: 'Nur das Adminkonto kann Spieltage wiedereröffnen.' };
    const evt = this.getEvent(eventId);
    if (!evt) return { success: false, message: 'Spieltag nicht gefunden.' };

    // Restore pending jokers from completed scores where jokerApplied was true
    const jokerPlayers = (evt.scores || []).filter(s => s.jokerApplied).map(s => s.playerId);
    evt.pendingJokers = jokerPlayers;
    evt.scores = [];
    evt.status = 'upcoming';
    evt.isFrozen = false;
    this.save(evt);
    return { success: true, message: `Spieltag ${evt.round} wurde wiedereröffnet! 🔓` };
  }

  getLeaderboard() {
    const members = this.getMembers();
    const completedEvents = this.state.events.filter(e => e.status === 'completed' && !e.isSpecial && e.id !== 9);

    const leaderboard = members.map(member => {
      let totalPoints = 0;
      let eventResults = [];
      let wins = 0;
      let podiums = 0;

      completedEvents.forEach(evt => {
        if (evt.scores) {
          const score = evt.scores.find(s => s.playerId === member.id);
          if (score) {
            totalPoints += score.points;
            eventResults.push({
              eventId: evt.id,
              round: evt.round,
              rank: score.rank,
              points: score.points,
              basePoints: score.basePoints || score.points,
              jokerApplied: score.jokerApplied
            });

            if (score.rank === 1) wins++;
            if (score.rank <= 3) podiums++;
          }
        }
      });

      const jokerInfo = this.getJokerStatus(member.id);

      return {
        ...member,
        totalPoints,
        completedCount: eventResults.length,
        eventResults,
        wins,
        podiums,
        jokerInfo
      };
    });

    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });

    for (let i = 0; i < leaderboard.length; i++) {
      if (i > 0 && leaderboard[i].totalPoints === leaderboard[i - 1].totalPoints) {
        leaderboard[i].rank = leaderboard[i - 1].rank;
      } else {
        leaderboard[i].rank = i + 1;
      }
    }

    return leaderboard;
  }

  getHistoricalSeasons() {
    return HISTORICAL_SEASONS;
  }

  updateMember(memberId, fields) {
    const member = this.getMember(memberId);
    if (!member) return false;
    Object.assign(member, fields);
    this.save(member);
    return true;
  }

  // --- RSVP (Spieltags-Zusagen) ---
  setRsvp(eventId, memberId, status) {
    const evt = this.getEvent(eventId);
    if (!evt) return { success: false, message: 'Spieltag nicht gefunden.' };
    if (!evt.rsvps || typeof evt.rsvps !== 'object') evt.rsvps = {};

    const mId = Number(memberId);
    // Toggle off if same status clicked again
    if (evt.rsvps[mId] === status) {
      delete evt.rsvps[mId];
    } else {
      evt.rsvps[mId] = status; // 'yes' | 'late' | 'no'
    }

    this.save(evt);
    return { success: true, rsvps: evt.rsvps };
  }

  getRsvps(eventId) {
    const evt = this.getEvent(eventId);
    const rsvps = (evt && evt.rsvps) || {};
    const members = this.getMembers();

    const result = {
      yes: [],
      late: [],
      no: [],
      none: []
    };

    members.forEach(m => {
      const status = rsvps[m.id];
      if (status === 'yes') result.yes.push(m);
      else if (status === 'late') result.late.push(m);
      else if (status === 'no') result.no.push(m);
      else result.none.push(m);
    });

    return result;
  }

  // --- Persistent Packing List with Item Claiming ---
  togglePackingItem(eventId, itemIdx) {
    const evt = this.getEvent(eventId);
    if (!evt || !evt.packingList || !evt.packingList[itemIdx]) return false;
    if (evt.status === 'completed' || this.isEventFrozen(evt)) return false;

    if (typeof evt.packingList[itemIdx] === 'string') {
      evt.packingList[itemIdx] = { text: evt.packingList[itemIdx], checked: true, broughtBy: null };
    } else {
      evt.packingList[itemIdx].checked = !evt.packingList[itemIdx].checked;
    }

    this.save(evt);
    return true;
  }

  claimPackingItem(eventId, itemIdx, memberId) {
    const evt = this.getEvent(eventId);
    if (!evt || !evt.packingList || !evt.packingList[itemIdx]) return false;
    if (evt.status === 'completed' || this.isEventFrozen(evt)) return false;

    const mId = Number(memberId);
    if (typeof evt.packingList[itemIdx] === 'string') {
      evt.packingList[itemIdx] = { text: evt.packingList[itemIdx], checked: false, broughtBy: mId };
    } else {
      const current = evt.packingList[itemIdx].broughtBy;
      evt.packingList[itemIdx].broughtBy = (current === mId) ? null : mId;
    }

    this.save(evt);
    return true;
  }

  // --- Was-wäre-wenn? Szenarien-Simulator (Spieltag 7 & 8) ---
  simulateSeason(predictions) {
    const currentLeaderboard = this.getLeaderboard();
    const rankPointsMap = [0, 8, 7, 6, 5, 4, 3, 2, 1];

    const simResults = currentLeaderboard.map(m => {
      let addPoints = 0;
      let r7Points = 0;
      let r8Points = 0;
      let r7Rank = null;
      let r8Rank = null;

      // Round 7
      if (predictions && predictions.round7 && predictions.round7.ranks) {
        const r7 = predictions.round7.ranks[m.id];
        if (r7 && r7 >= 1 && r7 <= 8) {
          r7Rank = r7;
          const base = rankPointsMap[r7] || 0;
          const isJoker = (predictions.round7.jokers || []).includes(m.id);
          r7Points = isJoker ? base * 2 : base;
          addPoints += r7Points;
        }
      }

      // Round 8
      if (predictions && predictions.round8 && predictions.round8.ranks) {
        const r8 = predictions.round8.ranks[m.id];
        if (r8 && r8 >= 1 && r8 <= 8) {
          r8Rank = r8;
          const base = rankPointsMap[r8] || 0;
          const isJoker = (predictions.round8.jokers || []).includes(m.id);
          r8Points = isJoker ? base * 2 : base;
          addPoints += r8Points;
        }
      }

      return {
        ...m,
        simTotalPoints: m.totalPoints + addPoints,
        simAddPoints: addPoints,
        simR7Points: r7Points,
        simR8Points: r8Points,
        simR7Rank: r7Rank,
        simR8Rank: r8Rank,
        originalRank: m.rank
      };
    });

    simResults.sort((a, b) => {
      if (b.simTotalPoints !== a.simTotalPoints) return b.simTotalPoints - a.simTotalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });

    for (let i = 0; i < simResults.length; i++) {
      if (i > 0 && simResults[i].simTotalPoints === simResults[i - 1].simTotalPoints) {
        simResults[i].simRank = simResults[i - 1].simRank;
      } else {
        simResults[i].simRank = i + 1;
      }
      simResults[i].rankDiff = simResults[i].originalRank - simResults[i].simRank;
    }

    const winner = simResults[0];
    const loser = simResults[simResults.length - 1];

    return {
      table: simResults,
      winner,
      loser
    };
  }

  getMathematicalOdds() {
    const lb = this.getLeaderboard();
    const potentialMax = {};
    const potentialMin = {};

    lb.forEach(m => {
      const hasJoker = m.jokerInfo.status === 'available';
      const maxAdd = hasJoker ? (16 + 8) : (8 + 8);
      const minAdd = (1 + 1);
      potentialMax[m.id] = m.totalPoints + maxAdd;
      potentialMin[m.id] = m.totalPoints + minAdd;
    });

    // Lowest possible points for leader Lukas (ID: 1)
    const lukasMin = potentialMin[1] || 48;
    const canWinTitle = lb.filter(m => potentialMax[m.id] >= lukasMin).map(m => m.id);

    // Highest possible points for Aaron (ID: 8)
    const aaronMax = potentialMax[8] || 36;
    const canEndLast = lb.filter(m => potentialMin[m.id] <= aaronMax).map(m => m.id);

    return {
      canWinTitle,
      canEndLast,
      potentialMax,
      potentialMin
    };
  }

  // --- Cloud Sync (Supabase) Integration ---
  updateCloudStatus(status, label) {
    const badge = document.getElementById('btn-cloud-status');
    const labelEl = document.getElementById('cloud-status-label');
    if (badge) {
      badge.className = `cloud-sync-badge ${status}`;
      if (status === 'connected') {
        badge.title = 'Supabase Cloud: Verbunden (Live-Echtzeit aktiv)';
      } else if (status === 'syncing') {
        badge.title = 'Supabase Cloud: Synchronisiere Daten...';
      } else if (status === 'error') {
        badge.title = 'Supabase Cloud: Verbindung getrennt oder Fehler';
      } else {
        badge.title = 'Supabase Cloud: Nicht konfiguriert (Lokal-Modus)';
      }
    }
    if (labelEl) {
      labelEl.textContent = label;
    }
  }

  async initCloudSync() {
    if (!window.fdsSupabase || !window.fdsSupabase.isConfigured()) {
      this.updateCloudStatus('offline', 'Lokal');
      return false;
    }

    const client = window.fdsSupabase.getClient();
    if (!client) {
      this.updateCloudStatus('offline', 'Lokal');
      return false;
    }

    this.updateCloudStatus('syncing', 'Sync...');

    try {
      // 1. Fetch remote members & events
      const [membersRes, eventsRes] = await Promise.all([
        client.from('members').select('*').order('id', { ascending: true }),
        client.from('events').select('*').order('id', { ascending: true })
      ]);

      if (membersRes.error || eventsRes.error) {
        console.warn('Supabase fetch error:', membersRes.error || eventsRes.error);
        this.updateCloudStatus('error', 'Fehler');
        return false;
      }

      const remoteMembers = membersRes.data || [];
      const remoteEvents = eventsRes.data || [];

      if (remoteMembers.length > 0 && remoteEvents.length > 0) {
        this.mergeRemoteData(remoteMembers, remoteEvents);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.updateCloudStatus('connected', 'Live');
        if (typeof window.fdsRefreshUI === 'function') {
          window.fdsRefreshUI();
        }
      } else {
        // If remote database is empty, seed it with our local 2026 data
        await this.pushAllToCloud();
      }

      // 2. Setup Realtime subscription
      this.setupRealtimeSubscription(client);
      return true;
    } catch (err) {
      console.warn('Supabase initCloudSync failed:', err);
      this.updateCloudStatus('error', 'Fehler');
      return false;
    }
  }

  mergeRemoteData(remoteMembers, remoteEvents) {
    if (Array.isArray(remoteMembers) && remoteMembers.length > 0) {
      this.state.members = remoteMembers.map(fromDbMember);
    }
    if (Array.isArray(remoteEvents) && remoteEvents.length > 0) {
      this.state.events = remoteEvents.map(fromDbEvent);
    }
  }

  setupRealtimeSubscription(client) {
    if (this.realtimeChannel) {
      try { client.removeChannel(this.realtimeChannel); } catch (e) {}
    }

    this.realtimeChannel = client.channel('fds-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, payload => {
        if (payload.new && payload.new.id) {
          const updated = fromDbMember(payload.new);
          const idx = this.state.members.findIndex(m => m.id === updated.id);
          if (idx !== -1) {
            this.state.members[idx] = updated;
          } else {
            this.state.members.push(updated);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          if (typeof window.fdsRefreshUI === 'function') window.fdsRefreshUI();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        if (payload.new && payload.new.id) {
          const updated = fromDbEvent(payload.new);
          const idx = this.state.events.findIndex(e => e.id === updated.id);
          if (idx !== -1) {
            this.state.events[idx] = updated;
          } else {
            this.state.events.push(updated);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          if (typeof window.fdsRefreshUI === 'function') window.fdsRefreshUI();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.updateCloudStatus('connected', 'Live');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.updateCloudStatus('error', 'Offline');
        }
      });
  }

  async pushMemberToCloud(member) {
    const client = window.fdsSupabase && window.fdsSupabase.getClient();
    if (!client || !member) return;
    try {
      await client.from('members').upsert(toDbMember(member));
    } catch (e) {
      console.warn('pushMemberToCloud error:', e);
    }
  }

  async pushEventToCloud(event) {
    const client = window.fdsSupabase && window.fdsSupabase.getClient();
    if (!client || !event) return;
    try {
      await client.from('events').upsert(toDbEvent(event));
    } catch (e) {
      console.warn('pushEventToCloud error:', e);
    }
  }

  async pushAllToCloud() {
    const client = window.fdsSupabase && window.fdsSupabase.getClient();
    if (!client) return;
    try {
      this.updateCloudStatus('syncing', 'Sync...');
      const mRows = this.state.members.map(toDbMember);
      const eRows = this.state.events.map(toDbEvent);
      await Promise.all([
        client.from('members').upsert(mRows),
        client.from('events').upsert(eRows)
      ]);
      this.updateCloudStatus('connected', 'Live');
    } catch (e) {
      console.warn('pushAllToCloud error:', e);
      this.updateCloudStatus('error', 'Fehler');
    }
  }
}

// Global data store singleton
window.fdsStore = new DataStore();
