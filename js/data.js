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
  { id: 1, name: 'Lukas', nickname: 'Luki', avatar: '🎯', pin: '1234', color: '#38bdf8', isAdmin: false, lastActiveAt: null },
  { id: 2, name: 'Oli', nickname: 'Oli-Wan', avatar: '🧢', pin: '1234', color: '#ec4899', isAdmin: false, lastActiveAt: null },
  { id: 3, name: 'Sven', nickname: 'Der Stratege', avatar: '🧠', pin: '1234', color: '#a855f7', isAdmin: false, lastActiveAt: null },
  { id: 4, name: 'Tobi', nickname: 'Kraftpaket', avatar: '⚡', pin: '1234', color: '#facc15', isAdmin: false, lastActiveAt: null },
  { id: 5, name: 'Tomi', nickname: 'Sonnenanbeter', avatar: '☀️', pin: '1234', color: '#ea580c', isAdmin: false, lastActiveAt: null },
  { id: 6, name: 'Tim', nickname: 'Der Macher', avatar: '👑', pin: '2022', color: '#f59e0b', isAdmin: false, lastActiveAt: null },
  { id: 7, name: 'Gabi', nickname: 'Dauerläufer', avatar: '🏃‍♂️', pin: '1234', color: '#059669', isAdmin: false, lastActiveAt: null },
  { id: 8, name: 'Aaron', nickname: 'Glückspilz', avatar: '🍀', pin: '1234', color: '#a3e635', isAdmin: false, lastActiveAt: null }
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

const BEER_PROFILES = {
  'Rothaus Tannenzäpfle': {
    brewery: 'Badische Staatsbrauerei Rothaus',
    location: 'Grafenhausen (Hochschwarzwald)',
    abv: '5,1 % vol.',
    style: 'Pilsener',
    funFact: 'Wird auf 1.000 m Höhe mit reinstem Schwarzwälder Bergquellwasser und Tettnanger Aromahopfen gebraut. Das Markenzeichen auf dem Etikett ist das Schwarzwaldmädel „Biergit Kraft“!'
  },
  'Augustiner Helles': {
    brewery: 'Augustiner-Bräu Wagner',
    location: 'München',
    abv: '5,2 % vol.',
    style: 'Lagerbier Hell',
    funFact: 'Münchens älteste Brauerei (gegründet 1328 von Augustinermönchen). Wird bis heute aus traditionellen Holzfässern (Hirschen) gezapft und verzichtet komplett auf Fernseh- und Plakatwerbung!'
  },
  'Tegernseer Hell': {
    brewery: 'Herzoglich Bayerisches Brauhaus Tegernsee',
    location: 'Tegernsee',
    abv: '4,8 % vol.',
    style: 'Bayerisches Helles',
    funFact: 'Geht auf ein Benediktinerkloster aus dem Jahr 1050 zurück. Gilt bei Bierkennern als Inbegriff bayerischer Gemütlichkeit direkt am See.'
  },
  'Paulaner Münchner Hell': {
    brewery: 'Paulaner Brauerei',
    location: 'München',
    abv: '4,9 % vol.',
    style: 'Helles',
    funFact: 'Gegründet 1634 von den Mönchen des Paulanerordens. Auf dem Nockherberg wurde hier einst die weltberühmte Starkbiertradition begründet.'
  },
  'Schönbuch Ur-Edel': {
    brewery: 'Schönbuch Braumanufaktur',
    location: 'Böblingen',
    abv: '4,8 % vol.',
    style: 'Helles Vollbier',
    funFact: 'Heimische Handwerkskunst aus dem Ländle seit 1823. Mit Gerste von regionalen Landwirten und feinstem Tettnanger Aromahopfen veredelt.'
  },
  'Stuttgarter Hofbräu Herrenpils': {
    brewery: 'Stuttgarter Hofbräu',
    location: 'Stuttgart (Heslach)',
    abv: '4,9 % vol.',
    style: 'Pilsener',
    funFact: 'Einst offizieller Hoflieferant des Königs von Württemberg. Seit 1872 die herbe Stuttgarter Brautradition für echte Kesselbewohner.'
  },
  'Alpirsbacher Spezial': {
    brewery: 'Alpirsbacher Klosterbräu',
    location: 'Alpirsbach (Kinzigtal)',
    abv: '5,2 % vol.',
    style: 'Spezial / Export',
    funFact: 'Das Geheimnis: „Gebraut mit berühmtem Schwarzwälder Brauwasser aus eigenen Quellen.“ Vollmundig, bernsteinfarben und angenehm malzig.'
  },
  'Dinkelacker CD Privat': {
    brewery: 'Familienbrauerei Dinkelacker',
    location: 'Stuttgart',
    abv: '5,4 % vol.',
    style: 'Privatbier / Export',
    funFact: 'Benannt nach Brauereigründer Carl Dinkelacker („CD“). Seit 1888 das Stuttgarter Festtagsbier mit besonders langer Reifezeit im kalten Lagerkeller.'
  },
  'Weihenstephaner Helles': {
    brewery: 'Bayerische Staatsbrauerei Weihenstephan',
    location: 'Freising',
    abv: '4,8 % vol.',
    style: 'Helles',
    funFact: 'Die älteste noch bestehende Braustätte der Welt! Das Braurecht wurde bereits im Jahr 1040 verliehen – fast 1.000 Jahre Braukunst auf dem Weihenstephaner Berg.'
  },
  'Chiemseer Hell': {
    brewery: 'Brauerei Chiemsee (Rosenheim)',
    location: 'Rosenheim / Chiemgau',
    abv: '4,8 % vol.',
    style: 'Helles',
    funFact: 'Ein klassisches Alpenvorland-Helles, bekannt für seinen kristallklaren, mild-süffigen Geschmack und das Etikett mit Blick auf die Chiemgauer Berge.'
  },
  'Flensburger Pilsener': {
    brewery: 'Flensburger Brauerei',
    location: 'Flensburg',
    abv: '4,8 % vol.',
    style: 'Norddeutsches Pilsener',
    funFact: 'Kult aus dem hohen Norden mit dem legendären Bügelverschluss-„Plopp“! Extrem schlank, herb und gebraut mit Küstengerste und Felsquellwasser.'
  },
  'Jever Pilsener': {
    brewery: 'Friesisches Brauhaus zu Jever',
    location: 'Jever (Friesland)',
    abv: '4,9 % vol.',
    style: 'Friesisch-herbes Pils',
    funFact: 'Das friesisch-herbe Original: Durch das extrem weiche Brauwasser kann mehr Hopfen zugesetzt werden – daher der unverwechselbare, herbe Pils-Geschmack!'
  },
  'Paulaner Salvator': {
    brewery: 'Paulaner Brauerei',
    location: 'München',
    abv: '7,9 % vol.',
    style: 'Doppelbock',
    funFact: 'Der Urvater aller Starkbiere mit über 18% Stammwürze! Die Mönche nannten es „flüssiges Brot“, weil es die Fastenregeln im Frühjahr nicht brach.'
  },
  'Erdinger Weißbier': {
    brewery: 'Privatbrauerei Erdinger Weißbräu',
    location: 'Erding',
    abv: '5,3 % vol.',
    style: 'Hefe-Weizen',
    funFact: 'Die größte Weißbierbrauerei der Welt, bis heute in Familienbesitz. Besonderheit: Traditionelle Bayerische Flaschengärung nach Champagner-Art!'
  },
  'Franziskaner Hefe-Weissbier': {
    brewery: 'Spaten-Franziskaner-Bräu',
    location: 'München',
    abv: '5,0 % vol.',
    style: 'Naturtrübes Weißbier',
    funFact: 'Wird seit 1363 gebraut. Typisch sind die fruchtigen Aromen von Banane und Gewürznelke durch die feine obergärige Hefe.'
  },
  'Krombacher Pils': {
    brewery: 'Krombacher Brauerei',
    location: 'Kreuztal-Krombach',
    abv: '4,8 % vol.',
    style: 'Pilsener',
    funFact: 'Gebraut mit natürlichem Felsquellwasser aus dem Rothaargebirge. Seit vielen Jahren an der Spitze der meistgetrunkenen Pilsbiere Deutschlands.'
  },
  'Bitburger Premium Pils': {
    brewery: 'Bitburger Braugruppe',
    location: 'Bitburg (Eifel)',
    abv: '4,8 % vol.',
    style: 'Premium Pils',
    funFact: '„Bitte ein Bit!“ Gegründet 1817 in der Südeifel. Berühmt für die feine, lang anhaltende Hopfennote aus feinstem Siegelhopfen.'
  },
  'Beck’s Pilsener': {
    brewery: 'Brauerei Beck & Co.',
    location: 'Bremen',
    abv: '4,9 % vol.',
    style: 'Pilsener',
    funFact: 'Seit 1873 das Bremer Aushängeschild mit dem silbernen Schlüssel (Bremer Wappen) auf grünem Grund. Eines der international bekanntesten deutschen Biere.'
  },
  'Astra Urtyp': {
    brewery: 'Holsten-Brauerei / Astra',
    location: 'Hamburg (St. Pauli)',
    abv: '4,9 % vol.',
    style: 'Kult-Pils',
    funFact: '„Was dagegen?“ Das Kultbier vom Hamburger Kiez und den St. Pauli Landungsbrücken. Herb, ehrlich und unverwechselbar mit Herz und Anker.'
  },
  'Gösser Naturradler': {
    brewery: 'Brauerei Göss',
    location: 'Leoben (Steiermark / Österreich)',
    abv: '2,0 % vol.',
    style: 'Naturradler',
    funFact: 'Besteht aus echtem Vollbier und naturtrübem Zitronensaft – ganz ohne künstliche Aromen. Der absolute Sommer-Liebling aller Durstigen!'
  },
  'Schneider Weisse TAP 7': {
    brewery: 'Private Weissbierbrauerei Schneider Weisse',
    location: 'Kelheim',
    abv: '5,4 % vol.',
    style: 'Original Weissbier',
    funFact: 'Das Originalrezept von Georg I. Schneider aus dem Jahr 1872. Ein bernsteinfarbenes Traditions-Weißbier nach dem bayerischen Reinheitsgebot, offen vergoren.'
  },
  'Ayinger Urweisse': {
    brewery: 'Brauerei Aying',
    location: 'Aying',
    abv: '5,8 % vol.',
    style: 'Dunkles Hefe-Weißbier',
    funFact: 'Mehrfach bei den World Beer Awards als bestes dunkles Weißbier der Welt ausgezeichnet! Kräftig bernsteinfarben mit Noten von reifen Bananen und Malz.'
  },
  'Hacker-Pschorr Münchner Hell': {
    brewery: 'Hacker-Pschorr Bräu',
    location: 'München',
    abv: '5,0 % vol.',
    style: 'Helles im Bügelverschluss',
    funFact: '„Himmel der Bayern“ seit 1417! Wird traditionell in der rustikalen Bügelverschlussflasche ausgeschenkt und 100% naturbelassen gebraut.'
  },
  'Biergit Kraft Craft Beer': {
    brewery: 'Badische Staatsbrauerei Rothaus',
    location: 'Grafenhausen',
    abv: '5,5 % vol.',
    style: 'Black Forest Pale Ale',
    funFact: 'Ein modernes hopfenbetontes Craft Beer aus dem Schwarzwald. Kaltgehopft mit Cascade- und Mandarina-Bavaria-Hopfen für spritzige Zitrusnoten!'
  },
  'Stuttgarter Hofbräu Käpsele': {
    brewery: 'Stuttgarter Hofbräu',
    location: 'Stuttgart',
    abv: '4,9 % vol.',
    style: 'Schwäbisches Helles',
    funFact: 'Auf Schwäbisch ist ein „Käpsele“ ein schlaues Köpfchen! Mild gehopft, goldgelb und herrlich unkompliziert in der kompakten Euro-Flasche.'
  }
};

const DEFAULT_TIMBERSPORTS_QUIZ = {
  isUnlockedForAll: false, // Geheimmmodus: Anfangs nur für Tim & Admin sichtbar!
  isArchived: false,
  activeSubTab: 'beer', // 'beer' | 'saw' | 'trivia' | 'standings'
  beerTasting: {
    activeBeerIndex: 0, // 0..24
    beerPool: [
      'Rothaus Tannenzäpfle',
      'Augustiner Helles',
      'Tegernseer Hell',
      'Paulaner Münchner Hell',
      'Schönbuch Ur-Edel',
      'Stuttgarter Hofbräu Herrenpils',
      'Alpirsbacher Spezial',
      'Dinkelacker CD Privat',
      'Weihenstephaner Helles',
      'Chiemseer Hell',
      'Flensburger Pilsener',
      'Jever Pilsener',
      'Paulaner Salvator',
      'Erdinger Weißbier',
      'Franziskaner Hefe-Weissbier',
      'Krombacher Pils',
      'Bitburger Premium Pils',
      'Beck’s Pilsener',
      'Astra Urtyp',
      'Gösser Naturradler',
      'Schneider Weisse TAP 7',
      'Ayinger Urweisse',
      'Hacker-Pschorr Münchner Hell',
      'Biergit Kraft Craft Beer',
      'Stuttgarter Hofbräu Käpsele'
    ],
    solutions: Array(25).fill(null),
    guesses: {}, // { [memberId]: { [beerIndex]: "Beer Name" } }
    jokers: {}, // { [memberId]: beerIndex } -> 1x "Goldener Kronkorken" pro Freund
    stage1Revealed: false,
    stage2Revealed: false,
    stage3Revealed: false,
    countdown: null, // { activeBeerIndex, durationSeconds, startedAt, endsAt, isRunning }
    lockedBeers: Array(25).fill(false) // [boolean]: each beer index frozen when countdown expires or locked by admin
  },
  sawContest: {
    targetWeight: 1000,
    entries: {}, // { [memberId]: { cut1: number|null, cut2: number|null } }
    jokers: {}, // { [memberId]: boolean } -> 1x "Bullseye-Joker" (Abweichung <= 30g = +2 Bonuspunkte)
    revealed: false
  },
  trivia: {
    isFrozen: false,
    activeQuestionId: 1,
    countdown: null,
    revealed: false,
    jokers: {}, // { [memberId]: questionId } -> 1x "Holzfäller-Joker" (+1 Bonuspunkt bei Treffer)
    questions: [
      {
        id: 1,
        text: 'Welche maximale Motorleistung haben die getunten Kettensägen bei der Königsdisziplin "Hot Saw"?',
        options: ['Ca. 25 PS', 'Ca. 45 PS', 'Über 60 bis 80 PS', 'Über 120 PS'],
        correctAnswer: 'Über 60 bis 80 PS',
        funFact: 'Die getunten Kettensägen nutzen 2-Takt-Rennmotoren aus Schneemobilen mit bis zu 80 PS und Methanol. Ein 46 cm dicker Stamm wird oft in unter 6 Sekunden durchtrennt!',
        isFrozen: false,
        isResolved: false
      },
      {
        id: 2,
        text: 'Aus welcher Holzart bestehen traditionell die offiziellen Wettkampfblöcke bei den STIHL Timbersports?',
        options: ['Schwarzwälder Fichte', 'Weißkiefer (Weymouths-Kiefer)', 'Rotbuche', 'Kanadische Eiche'],
        correctAnswer: 'Weißkiefer (Weymouths-Kiefer)',
        funFact: 'Die Weymouths-Kiefer hat ein besonders homogenes Holz ohne störende Astlöcher oder Harzgallen. So hat jeder Athlet exakt denselben Widerstand im Stamm.',
        isFrozen: false,
        isResolved: false
      },
      {
        id: 3,
        text: 'Wie viele Holzscheiben ("Cookies") müssen bei der Disziplin "Stock Saw" von der Motorsäge abgesägt werden?',
        options: ['1 Scheibe von oben', '2 Scheiben: eine von unten, eine von oben', '3 Scheiben im Zickzack', '4 dünne Scheiben'],
        correctAnswer: '2 Scheiben: eine von unten, eine von oben',
        funFact: 'Beim „Cookie Cut“ muss der erste Schnitt von unten nach oben und der zweite von oben nach unten erfolgen. Wer die markierte 10-cm-Linie übersägt, wird sofort disqualifiziert!',
        isFrozen: false,
        isResolved: false
      },
      {
        id: 4,
        text: 'In welcher Disziplin klettern die Sportholzfäller mit Hilfe von Trittbrettern in Kerben einen 3m hohen Stamm hinauf?',
        options: ['Springboard', 'Underhand Chop', 'Single Buck', 'Standing Block Chop'],
        correctAnswer: 'Springboard',
        funFact: 'Ursprünglich nutzten Holzfäller im 19. Jahrhundert Trittbretter, um über die massiven Wurzelanläufe der Riesen-Mammutbäume in den Urwäldern Nordamerikas zu klettern.',
        isFrozen: false,
        isResolved: false
      },
      {
        id: 5,
        text: 'Wie lang ist die mächtige Einmann-Zugsäge bei der Disziplin "Single Buck"?',
        options: ['Ca. 1,20 m', 'Ca. 2,00 m', 'Ca. 2,80 m', 'Ca. 0,90 m'],
        correctAnswer: 'Ca. 2,00 m',
        funFact: 'Die 2 Meter lange Zugsäge hat rasiermesserscharfe Zähne, die von Hand millimetergenau gefeilt werden. Während des Sägens sprüht ein Helfer Petroleum auf das Blatt, damit es nicht klemmt.',
        isFrozen: false,
        isResolved: false
      }
    ],
    answers: {} // { [questionId]: { [memberId]: "Answer" } }
  }
};

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
    scores: [],
    timbersportsQuiz: JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ))
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
    isAdmin: Boolean(m.is_admin),
    lastActiveAt: m.last_active_at || null
  };
}

function toDbMember(m) {
  const row = {
    id: m.id,
    name: m.name,
    nickname: m.nickname,
    avatar: m.avatar,
    pin: m.pin,
    color: m.color,
    is_admin: Boolean(m.isAdmin),
    updated_at: new Date().toISOString()
  };
  if (m.lastActiveAt) {
    row.last_active_at = m.lastActiveAt;
  }
  return row;
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

  let timbersportsQuiz = e.timbersportsQuiz || e.timbersports_quiz || null;
  if (!timbersportsQuiz && e.packing_list && typeof e.packing_list === 'object') {
    timbersportsQuiz = e.packing_list.timbersportsQuiz || null;
  }
  if (!timbersportsQuiz && Number(e.id) === 8) {
    timbersportsQuiz = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ));
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
    scores: Array.isArray(e.scores) ? e.scores : [],
    timbersportsQuiz: timbersportsQuiz
  };
}

function toDbEvent(e) {
  let pendingJokers = e.pendingJokers || [];
  if (e.isSpecial || e.id === 9) {
    pendingJokers = e.isOrganizerOverridden ? ['override'] : [];
  }

  const packingPayload = {
    items: Array.isArray(e.packingList) ? e.packingList : [],
    rsvps: (e.rsvps && typeof e.rsvps === 'object') ? e.rsvps : {},
    timbersportsQuiz: e.timbersportsQuiz || null
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
    quiz_data: e.timbersportsQuiz || {},
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
          !this.state.events[0].id
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
          // Ensure event 8 has timbersportsQuiz
          const evt8 = this.state.events.find(e => e.id === 8);
          if (evt8) {
            if (!evt8.timbersportsQuiz) {
              evt8.timbersportsQuiz = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ));
            } else {
              if (!evt8.timbersportsQuiz.beerTasting) evt8.timbersportsQuiz.beerTasting = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ.beerTasting));
              if (!evt8.timbersportsQuiz.sawContest) evt8.timbersportsQuiz.sawContest = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ.sawContest));
              if (!evt8.timbersportsQuiz.trivia) evt8.timbersportsQuiz.trivia = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ.trivia));
            }
          }
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
    const evt8 = this.state.events.find(e => e.id === 8);
    if (evt8 && !evt8.timbersportsQuiz) {
      evt8.timbersportsQuiz = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ));
    }
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

    if (pinTrimmed === member.pin || pinTrimmed === adminPin || (member.id === 6 && pinTrimmed === '2022')) {
      if (member.id === 6) member.pin = '2022';
      this.setCurrentUser(member.id);
      this.recordMemberActivity(member.id);
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
      if (
        i > 0 && 
        leaderboard[i].totalPoints === leaderboard[i - 1].totalPoints &&
        leaderboard[i].wins === leaderboard[i - 1].wins &&
        leaderboard[i].podiums === leaderboard[i - 1].podiums
      ) {
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
      if (
        i > 0 && 
        simResults[i].simTotalPoints === simResults[i - 1].simTotalPoints &&
        simResults[i].wins === simResults[i - 1].wins &&
        simResults[i].podiums === simResults[i - 1].podiums
      ) {
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
      // 1. Fetch remote members, events & activity meta
      const [membersRes, eventsRes, activityRes] = await Promise.all([
        client.from('members').select('*').order('id', { ascending: true }),
        client.from('events').select('*').order('id', { ascending: true }),
        client.from('history_seasons').select('scores').eq('year', 9999).maybeSingle()
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
        if (activityRes && activityRes.data && activityRes.data.scores) {
          this.mergeActivityData(activityRes.data.scores);
        }
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
      this.state.members = remoteMembers.map(m => {
        const parsed = fromDbMember(m);
        const local = (this.state.members || []).find(lm => lm.id === parsed.id);
        if (local && local.lastActiveAt) {
          if (!parsed.lastActiveAt || new Date(local.lastActiveAt) > new Date(parsed.lastActiveAt)) {
            parsed.lastActiveAt = local.lastActiveAt;
          }
        }
        return parsed;
      });
    }
    if (Array.isArray(remoteEvents) && remoteEvents.length > 0) {
      this.state.events = remoteEvents.map(fromDbEvent);
    }
  }

  mergeActivityData(activityMap) {
    if (!activityMap || typeof activityMap !== 'object') return;
    let changed = false;
    (this.state.members || []).forEach(m => {
      const remoteTime = activityMap[m.id] || activityMap[String(m.id)];
      if (remoteTime) {
        if (!m.lastActiveAt || new Date(remoteTime) > new Date(m.lastActiveAt)) {
          m.lastActiveAt = remoteTime;
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  recordMemberActivity(memberId = null) {
    const currentId = this.getCurrentUserId();
    const mId = memberId !== null ? Number(memberId) : (currentId === 'admin' ? null : Number(currentId));
    if (!mId || isNaN(mId)) return;
    const member = this.getMember(mId);
    if (!member) return;

    const now = new Date();
    const nowIso = now.toISOString();

    if (member.lastActiveAt) {
      const lastDate = new Date(member.lastActiveAt);
      if (!isNaN(lastDate.getTime()) && (now.getTime() - lastDate.getTime()) < 2 * 60 * 1000) {
        return; // Throttled within 2 minutes
      }
    }

    member.lastActiveAt = nowIso;
    this.save();
    this.pushActivityToCloud(mId, nowIso);
  }

  async pushActivityToCloud(memberId, timestampIso) {
    const client = window.fdsSupabase && window.fdsSupabase.getClient();
    if (!client) return;

    const activityMap = {};
    (this.state.members || []).forEach(m => {
      if (m.lastActiveAt) activityMap[m.id] = m.lastActiveAt;
    });
    activityMap[memberId] = timestampIso;

    try {
      await client.from('history_seasons').upsert({
        year: 9999,
        title: 'fds_app_meta',
        summary: 'Member Activity Ledger',
        scores: activityMap,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('pushActivityToCloud error:', err);
    }

    // Also attempt direct update on members table if last_active_at column exists
    try {
      await client.from('members').update({ last_active_at: timestampIso }).eq('id', memberId);
    } catch (e) {}
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
            if (!updated.lastActiveAt && this.state.members[idx].lastActiveAt) {
              updated.lastActiveAt = this.state.members[idx].lastActiveAt;
            }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history_seasons' }, payload => {
        if (payload.new && payload.new.year === 9999 && payload.new.scores) {
          this.mergeActivityData(payload.new.scores);
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

  // --- Timbersports & Biertasting Special (Spieltag 8) ---
  getTimbersportsQuiz() {
    const evt8 = this.getEvent(8);
    if (!evt8) return JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ));
    if (!evt8.timbersportsQuiz) {
      evt8.timbersportsQuiz = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ));
      this.save(evt8);
    }
    if (evt8.timbersportsQuiz.beerTasting) {
      if (!Array.isArray(evt8.timbersportsQuiz.beerTasting.lockedBeers)) {
        evt8.timbersportsQuiz.beerTasting.lockedBeers = Array(25).fill(false);
      }
      if (!evt8.timbersportsQuiz.beerTasting.jokers) {
        evt8.timbersportsQuiz.beerTasting.jokers = {};
      }
      const cd = evt8.timbersportsQuiz.beerTasting.countdown;
      if (cd && cd.activeBeerIndex !== undefined && cd.endsAt && Date.now() >= cd.endsAt) {
        if (!evt8.timbersportsQuiz.beerTasting.lockedBeers[cd.activeBeerIndex]) {
          evt8.timbersportsQuiz.beerTasting.lockedBeers[cd.activeBeerIndex] = true;
          this.save(evt8);
        }
      }
    }
    if (evt8.timbersportsQuiz.sawContest) {
      if (!evt8.timbersportsQuiz.sawContest.jokers) {
        evt8.timbersportsQuiz.sawContest.jokers = {};
      }
    }
    if (evt8.timbersportsQuiz.trivia) {
      const tr = evt8.timbersportsQuiz.trivia;
      if (!tr.jokers) tr.jokers = {};
      if (tr.activeQuestionId === undefined || tr.activeQuestionId === null) {
        tr.activeQuestionId = tr.questions && tr.questions.length > 0 ? tr.questions[0].id : 1;
      }
      if (tr.revealed === undefined) {
        tr.revealed = false;
      }
      if (Array.isArray(tr.questions)) {
        tr.questions.forEach(q => {
          if (!q.funFact) {
            const defQ = DEFAULT_TIMBERSPORTS_QUIZ.trivia.questions.find(x => x.id === q.id);
            if (defQ && defQ.funFact) q.funFact = defQ.funFact;
          }
        });
      }
      const cd = tr.countdown;
      if (cd && cd.activeQuestionId !== undefined && cd.endsAt && Date.now() >= cd.endsAt) {
        const q = tr.questions && tr.questions.find(x => x.id === cd.activeQuestionId);
        if (q && !q.isFrozen) {
          q.isFrozen = true;
          this.save(evt8);
        }
      }
    }
    return evt8.timbersportsQuiz;
  }

  saveTimbersportsQuiz(quiz) {
    const evt8 = this.getEvent(8);
    if (!evt8) return false;
    evt8.timbersportsQuiz = quiz;
    this.save(evt8);
    return true;
  }

  isTimbersportsTabVisible() {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;
    if (this.isAdmin()) return true;
    if (Number(currentUserId) === 6) return true; // Tim
    const quiz = this.getTimbersportsQuiz();
    if (quiz && quiz.isUnlockedForAll && !quiz.isArchived) {
      return true;
    }
    return false;
  }

  canManageTimbersports() {
    return this.isAdmin();
  }

  setTimbersportsUnlocked(unlocked) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.isUnlockedForAll = Boolean(unlocked);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  setTimbersportsArchived(archived) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.isArchived = Boolean(archived);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  setTimbersportsSubTab(subTab) {
    const quiz = this.getTimbersportsQuiz();
    quiz.activeSubTab = subTab;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  setBeerTastingActiveBeer(index) {
    const quiz = this.getTimbersportsQuiz();
    quiz.beerTasting.activeBeerIndex = Number(index);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  isBeerLocked(beerIndex) {
    const quiz = this.getTimbersportsQuiz();
    const bt = quiz.beerTasting;
    if (!bt) return false;
    const idx = Number(beerIndex);
    const stage = idx < 10 ? 1 : (idx < 20 ? 2 : 3);
    if (stage === 1 && bt.stage1Revealed) return true;
    if (stage === 2 && bt.stage2Revealed) return true;
    if (stage === 3 && bt.stage3Revealed) return true;
    if (bt.lockedBeers && bt.lockedBeers[idx]) return true;

    const cd = bt.countdown;
    if (cd && cd.activeBeerIndex === idx) {
      const now = Date.now();
      if (cd.isRunning && cd.endsAt && now > cd.endsAt) return true;
      if (!cd.isRunning && cd.endsAt && now >= cd.endsAt) return true;
    }
    return false;
  }

  setBeerLocked(beerIndex, isLocked = true) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!Array.isArray(quiz.beerTasting.lockedBeers)) {
      quiz.beerTasting.lockedBeers = Array(25).fill(false);
    }
    quiz.beerTasting.lockedBeers[Number(beerIndex)] = Boolean(isLocked);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  saveBeerGuess(memberId, beerIndex, beerName) {
    if (memberId === 'admin') {
      return { success: false, message: 'Der Admin schenkt nur aus und tippt nicht mit.' };
    }
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.beerTasting.guesses) quiz.beerTasting.guesses = {};
    if (!quiz.beerTasting.guesses[memberId]) quiz.beerTasting.guesses[memberId] = {};
    
    const idx = Number(beerIndex);
    // Check if stage is already revealed
    const stage = idx < 10 ? 1 : (idx < 20 ? 2 : 3);
    if (stage === 1 && quiz.beerTasting.stage1Revealed) return { success: false, message: 'Etappe 1 ist bereits abgeschlossen!' };
    if (stage === 2 && quiz.beerTasting.stage2Revealed) return { success: false, message: 'Etappe 2 ist bereits abgeschlossen!' };
    if (stage === 3 && quiz.beerTasting.stage3Revealed) return { success: false, message: 'Etappe 3 ist bereits abgeschlossen!' };

    // Check if beer is locked/frozen
    if (quiz.beerTasting.lockedBeers && quiz.beerTasting.lockedBeers[idx]) {
      return { success: false, message: `Bier #${idx + 1} ist eingefroren – keine Änderungen mehr möglich!` };
    }

    // Check countdown expiration if timer is running for this beer
    const cd = quiz.beerTasting.countdown;
    if (cd && cd.activeBeerIndex === idx) {
      const now = Date.now();
      if (cd.isRunning && cd.endsAt && now > cd.endsAt) {
        if (!Array.isArray(quiz.beerTasting.lockedBeers)) quiz.beerTasting.lockedBeers = Array(25).fill(false);
        quiz.beerTasting.lockedBeers[idx] = true;
        this.saveTimbersportsQuiz(quiz);
        return { success: false, message: `Zeit abgelaufen! Bier #${idx + 1} ist jetzt eingefroren.` };
      }
      if (!cd.isRunning && cd.endsAt && now >= cd.endsAt) {
        return { success: false, message: `Die Verkostungsrunde für Bier #${idx + 1} wurde beendet.` };
      }
    }

    quiz.beerTasting.guesses[memberId][idx] = beerName;
    this.saveTimbersportsQuiz(quiz);
    return { success: true };
  }

  startBeerCountdown(beerIndex, durationSeconds) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!Array.isArray(quiz.beerTasting.lockedBeers)) {
      quiz.beerTasting.lockedBeers = Array(25).fill(false);
    }
    const newIdx = Number(beerIndex);

    // If there was a previous countdown on another beer, lock that previous beer!
    const prevCd = quiz.beerTasting.countdown;
    if (prevCd && prevCd.activeBeerIndex !== undefined && prevCd.activeBeerIndex !== newIdx) {
      quiz.beerTasting.lockedBeers[prevCd.activeBeerIndex] = true;
    }

    // Newly started beer is open
    quiz.beerTasting.lockedBeers[newIdx] = false;

    const dur = Math.max(5, Number(durationSeconds) || 60);
    const now = Date.now();
    quiz.beerTasting.countdown = {
      activeBeerIndex: newIdx,
      durationSeconds: dur,
      startedAt: now,
      endsAt: now + (dur * 1000),
      isRunning: true
    };
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  stopBeerCountdown() {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!Array.isArray(quiz.beerTasting.lockedBeers)) {
      quiz.beerTasting.lockedBeers = Array(25).fill(false);
    }
    if (quiz.beerTasting.countdown) {
      const activeIdx = quiz.beerTasting.countdown.activeBeerIndex;
      quiz.beerTasting.countdown.isRunning = false;
      quiz.beerTasting.countdown.endsAt = Date.now();
      if (activeIdx !== undefined && activeIdx !== null) {
        quiz.beerTasting.lockedBeers[activeIdx] = true;
      }
      this.saveTimbersportsQuiz(quiz);
    }
    return true;
  }

  extendBeerCountdown(extraSeconds = 30) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (quiz.beerTasting.countdown) {
      const now = Date.now();
      const currentEnds = Math.max(now, quiz.beerTasting.countdown.endsAt || now);
      quiz.beerTasting.countdown.endsAt = currentEnds + (extraSeconds * 1000);
      quiz.beerTasting.countdown.durationSeconds = (quiz.beerTasting.countdown.durationSeconds || 60) + extraSeconds;
      quiz.beerTasting.countdown.isRunning = true;
      this.saveTimbersportsQuiz(quiz);
    }
    return true;
  }

  resetBeerCountdown(beerIndex = null) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!Array.isArray(quiz.beerTasting.lockedBeers)) {
      quiz.beerTasting.lockedBeers = Array(25).fill(false);
    }
    const targetIdx = beerIndex !== null ? Number(beerIndex) : (quiz.beerTasting.countdown ? quiz.beerTasting.countdown.activeBeerIndex : quiz.beerTasting.activeBeerIndex);
    if (targetIdx !== undefined && targetIdx !== null) {
      quiz.beerTasting.lockedBeers[targetIdx] = false;
    }
    quiz.beerTasting.countdown = null;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  setBeerSolution(beerIndex, beerName) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!Array.isArray(quiz.beerTasting.solutions)) {
      quiz.beerTasting.solutions = Array(25).fill(null);
    }
    quiz.beerTasting.solutions[beerIndex] = beerName || null;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  revealBeerStage(stageNum, isRevealed) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (stageNum === 1) quiz.beerTasting.stage1Revealed = Boolean(isRevealed);
    if (stageNum === 2) quiz.beerTasting.stage2Revealed = Boolean(isRevealed);
    if (stageNum === 3) quiz.beerTasting.stage3Revealed = Boolean(isRevealed);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  updateBeerPool(newPool) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.beerTasting.beerPool = newPool;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  resetBeerPool() {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.beerTasting.beerPool = JSON.parse(JSON.stringify(DEFAULT_TIMBERSPORTS_QUIZ.beerTasting.beerPool));
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  saveSawEntry(memberId, cut1, cut2) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.sawContest.entries) quiz.sawContest.entries = {};
    quiz.sawContest.entries[memberId] = {
      cut1: (cut1 !== '' && cut1 !== null && cut1 !== undefined) ? Number(cut1) : null,
      cut2: (cut2 !== '' && cut2 !== null && cut2 !== undefined) ? Number(cut2) : null
    };
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  revealSawCuts(revealed) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.sawContest.revealed = Boolean(revealed);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  saveTriviaAnswer(questionId, memberId, answer) {
    if (memberId === 'admin') {
      return { success: false, message: 'Der Admin ist Spielleiter und nimmt nicht am Quiz teil.' };
    }
    const quiz = this.getTimbersportsQuiz();
    const qId = Number(questionId);
    const q = quiz.trivia.questions.find(x => x.id === qId);
    if (!q) return { success: false, message: 'Frage nicht gefunden!' };
    if (q.isResolved || quiz.trivia.revealed) return { success: false, message: 'Frage ist bereits aufgelöst!' };
    if (q.isFrozen || (quiz.trivia && quiz.trivia.isFrozen)) return { success: false, message: 'Antworten für diese Frage sind bereits gesperrt!' };

    // Check countdown expiration if timer is running for this question
    const cd = quiz.trivia.countdown;
    if (cd && cd.activeQuestionId === qId) {
      const now = Date.now();
      if (cd.isRunning && cd.endsAt && now > cd.endsAt) {
        q.isFrozen = true;
        this.saveTimbersportsQuiz(quiz);
        return { success: false, message: 'Zeit abgelaufen! Antworten sind für diese Frage gesperrt.' };
      }
      if (!cd.isRunning && cd.endsAt && now >= cd.endsAt) {
        return { success: false, message: 'Die Fragerunde wurde bereits beendet.' };
      }
    }

    if (!quiz.trivia.answers) quiz.trivia.answers = {};
    if (!quiz.trivia.answers[qId]) quiz.trivia.answers[qId] = {};
    quiz.trivia.answers[qId][memberId] = answer;
    this.saveTimbersportsQuiz(quiz);
    return { success: true };
  }

  setTriviaActiveQuestion(questionId) {
    const quiz = this.getTimbersportsQuiz();
    quiz.trivia.activeQuestionId = Number(questionId);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  startTriviaCountdown(questionId, durationSeconds) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    const qId = Number(questionId);
    const q = quiz.trivia.questions.find(x => x.id === qId);
    if (!q) return false;

    // Freeze any previous countdown question
    const prevCd = quiz.trivia.countdown;
    if (prevCd && prevCd.activeQuestionId && prevCd.activeQuestionId !== qId) {
      const prevQ = quiz.trivia.questions.find(x => x.id === prevCd.activeQuestionId);
      if (prevQ) prevQ.isFrozen = true;
    }

    // Unfreeze active question for the new round
    q.isFrozen = false;
    quiz.trivia.activeQuestionId = qId;

    const dur = Math.max(5, Number(durationSeconds) || 30);
    const now = Date.now();
    quiz.trivia.countdown = {
      activeQuestionId: qId,
      durationSeconds: dur,
      startedAt: now,
      endsAt: now + (dur * 1000),
      isRunning: true
    };
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  stopTriviaCountdown() {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (quiz.trivia.countdown) {
      const activeQId = quiz.trivia.countdown.activeQuestionId;
      quiz.trivia.countdown.isRunning = false;
      quiz.trivia.countdown.endsAt = Date.now();
      const q = quiz.trivia.questions.find(x => x.id === activeQId);
      if (q) q.isFrozen = true;
      this.saveTimbersportsQuiz(quiz);
    }
    return true;
  }

  extendTriviaCountdown(extraSeconds = 15) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (quiz.trivia.countdown) {
      const now = Date.now();
      const currentEnds = Math.max(now, quiz.trivia.countdown.endsAt || now);
      quiz.trivia.countdown.endsAt = currentEnds + (extraSeconds * 1000);
      quiz.trivia.countdown.durationSeconds = (quiz.trivia.countdown.durationSeconds || 30) + extraSeconds;
      quiz.trivia.countdown.isRunning = true;
      this.saveTimbersportsQuiz(quiz);
    }
    return true;
  }

  resetTriviaCountdown(questionId = null) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    const targetQId = questionId !== null ? Number(questionId) : (quiz.trivia.countdown ? quiz.trivia.countdown.activeQuestionId : quiz.trivia.activeQuestionId);
    const q = quiz.trivia.questions.find(x => x.id === targetQId);
    if (q) q.isFrozen = false;
    quiz.trivia.countdown = null;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  revealTriviaQuiz(isRevealed) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.trivia.revealed = Boolean(isRevealed);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  freezeTriviaQuestion(questionId, isFrozen) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    const q = quiz.trivia.questions.find(x => x.id === Number(questionId));
    if (!q) return false;
    q.isFrozen = Boolean(isFrozen);
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  freezeAllTriviaQuestions(isFrozen) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.trivia) quiz.trivia = { questions: [], answers: {} };
    quiz.trivia.isFrozen = Boolean(isFrozen);
    (quiz.trivia.questions || []).forEach(q => {
      q.isFrozen = Boolean(isFrozen);
    });
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  resolveTriviaQuestion(questionId, isResolved, correctAnswer = null) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    const q = quiz.trivia.questions.find(x => x.id === Number(questionId));
    if (!q) return false;
    q.isResolved = Boolean(isResolved);
    if (isResolved) {
      q.isFrozen = true;
    }
    if (correctAnswer) q.correctAnswer = correctAnswer;
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  addTriviaQuestion(questionData) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    const newId = (quiz.trivia.questions.length > 0 ? Math.max(...quiz.trivia.questions.map(q => q.id)) : 0) + 1;
    quiz.trivia.questions.push({
      id: newId,
      text: questionData.text,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer || '',
      isFrozen: false,
      isResolved: false
    });
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  deleteTriviaQuestion(questionId) {
    if (!this.canManageTimbersports()) return false;
    const quiz = this.getTimbersportsQuiz();
    quiz.trivia.questions = quiz.trivia.questions.filter(q => q.id !== Number(questionId));
    this.saveTimbersportsQuiz(quiz);
    return true;
  }

  setBeerJoker(memberId, beerIndex) {
    if (memberId === 'admin') return { success: false, message: 'Admin nimmt nicht teil.' };
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.beerTasting.jokers) quiz.beerTasting.jokers = {};
    const bIdx = Number(beerIndex);
    if (quiz.beerTasting.lockedBeers && quiz.beerTasting.lockedBeers[bIdx]) {
      return { success: false, message: 'Runde ist bereits beendet. Joker kann nicht mehr geändert werden.' };
    }
    const currentJoker = quiz.beerTasting.jokers[memberId];
    if (currentJoker === bIdx) {
      delete quiz.beerTasting.jokers[memberId];
      this.saveTimbersportsQuiz(quiz);
      return { success: true, active: false, message: 'Goldener Kronkorken entfernt.' };
    }
    quiz.beerTasting.jokers[memberId] = bIdx;
    this.saveTimbersportsQuiz(quiz);
    return { success: true, active: true, message: `Goldener Kronkorken auf Bier #${bIdx + 1} gesetzt! 👑` };
  }

  setTriviaJoker(memberId, questionId) {
    if (memberId === 'admin') return { success: false, message: 'Admin nimmt nicht teil.' };
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.trivia.jokers) quiz.trivia.jokers = {};
    const qId = Number(questionId);
    const q = quiz.trivia.questions.find(x => x.id === qId);
    if (!q) return { success: false, message: 'Frage nicht gefunden.' };
    if (q.isFrozen || q.isResolved || quiz.trivia.revealed) {
      return { success: false, message: 'Frage ist bereits beendet. Joker nicht mehr möglich.' };
    }
    const currentJoker = quiz.trivia.jokers[memberId];
    if (currentJoker === qId) {
      delete quiz.trivia.jokers[memberId];
      this.saveTimbersportsQuiz(quiz);
      return { success: true, active: false, message: 'Holzfäller-Joker entfernt.' };
    }
    quiz.trivia.jokers[memberId] = qId;
    this.saveTimbersportsQuiz(quiz);
    return { success: true, active: true, message: `Holzfäller-Joker auf Frage #${qId} gesetzt! 🃏` };
  }

  setSawJoker(memberId, active) {
    const quiz = this.getTimbersportsQuiz();
    if (!quiz.sawContest.jokers) quiz.sawContest.jokers = {};
    if (active === undefined) {
      quiz.sawContest.jokers[memberId] = !quiz.sawContest.jokers[memberId];
    } else {
      quiz.sawContest.jokers[memberId] = Boolean(active);
    }
    this.saveTimbersportsQuiz(quiz);
    return { success: true, active: quiz.sawContest.jokers[memberId], message: 'Bullseye-Joker aktualisiert! 🎯' };
  }

  calculateTimbersportsStandings() {
    const quiz = this.getTimbersportsQuiz();
    const members = this.getMembers();
    const bt = quiz.beerTasting;
    const saw = quiz.sawContest;
    const tr = quiz.trivia;

    // 1. Beer Points per member
    const beerScores = {};
    members.forEach(m => { beerScores[m.id] = { stage1: 0, stage2: 0, stage3: 0, jokerBonus: 0, total: 0 }; });

    // Stage 1 (0..9)
    for (let i = 0; i < 10; i++) {
      const sol = bt.solutions[i];
      if (sol && bt.stage1Revealed) {
        members.forEach(m => {
          if (bt.guesses[m.id] && bt.guesses[m.id][i] === sol) {
            beerScores[m.id].stage1++;
            beerScores[m.id].total++;
            if (bt.jokers && bt.jokers[m.id] === i) {
              beerScores[m.id].jokerBonus++;
              beerScores[m.id].total++;
            }
          }
        });
      }
    }
    // Stage 2 (10..19)
    for (let i = 10; i < 20; i++) {
      const sol = bt.solutions[i];
      if (sol && bt.stage2Revealed) {
        members.forEach(m => {
          if (bt.guesses[m.id] && bt.guesses[m.id][i] === sol) {
            beerScores[m.id].stage2++;
            beerScores[m.id].total++;
            if (bt.jokers && bt.jokers[m.id] === i) {
              beerScores[m.id].jokerBonus++;
              beerScores[m.id].total++;
            }
          }
        });
      }
    }
    // Stage 3 (20..24)
    for (let i = 20; i < 25; i++) {
      const sol = bt.solutions[i];
      if (sol && bt.stage3Revealed) {
        members.forEach(m => {
          if (bt.guesses[m.id] && bt.guesses[m.id][i] === sol) {
            beerScores[m.id].stage3++;
            beerScores[m.id].total++;
            if (bt.jokers && bt.jokers[m.id] === i) {
              beerScores[m.id].jokerBonus++;
              beerScores[m.id].total++;
            }
          }
        });
      }
    }

    // 2. Saw Contest Rankings
    const sawResults = members.map(m => {
      const entry = saw.entries && saw.entries[m.id];
      const c1 = entry ? entry.cut1 : null;
      const c2 = entry ? entry.cut2 : null;
      const hasBoth = c1 !== null && c1 !== undefined && c2 !== null && c2 !== undefined;
      const totalWeight = hasBoth ? (c1 + c2) : null;
      const diff = hasBoth ? Math.abs(totalWeight - saw.targetWeight) : 999999;
      const isJoker = Boolean(saw.jokers && saw.jokers[m.id]);
      const jokerHit = isJoker && hasBoth && diff <= 30;
      return { member: m, cut1: c1, cut2: c2, totalWeight, diff, hasBoth, isJoker, jokerHit };
    });

    sawResults.sort((a, b) => a.diff - b.diff);
    const sawPoints = {};
    sawResults.forEach((res, idx) => {
      let base = res.hasBoth ? Math.max(1, 8 - idx) : 0;
      if (res.jokerHit) {
        base += 2; // +2 Extra-Punkte für Treffer im Bullseye (<= 30g) mit Joker
      }
      sawPoints[res.member.id] = base;
    });

    // 3. Trivia points
    const triviaScores = {};
    const triviaJokerHits = {};
    members.forEach(m => { triviaScores[m.id] = 0; triviaJokerHits[m.id] = 0; });
    tr.questions.forEach(q => {
      const isCounted = Boolean(q.isResolved || tr.revealed);
      if (isCounted && q.correctAnswer) {
        members.forEach(m => {
          const ans = tr.answers && tr.answers[q.id] && tr.answers[q.id][m.id];
          if (ans === q.correctAnswer) {
            triviaScores[m.id]++;
            if (tr.jokers && tr.jokers[m.id] === q.id) {
              triviaScores[m.id]++; // +1 Bonuspunkt (Doppelte Punkte!)
              triviaJokerHits[m.id]++;
            }
          }
        });
      }
    });

    // 4. Combined Standings
    const standings = members.map(m => {
      const bPts = beerScores[m.id].total;
      const sPts = sawPoints[m.id] || 0;
      const tPts = triviaScores[m.id] || 0;
      const total = bPts + sPts + tPts;
      return {
        member: m,
        beerScore: beerScores[m.id],
        sawDetails: sawResults.find(r => r.member.id === m.id),
        sawPoints: sPts,
        triviaScore: tPts,
        triviaJokerHit: Boolean(triviaJokerHits[m.id] > 0),
        totalPoints: total
      };
    });

    standings.sort((a, b) => b.totalPoints - a.totalPoints);
    standings.forEach((st, idx) => {
      st.rank = idx + 1;
    });

    // 5. Fun-Awards (Titel des Tages)
    let bestBeerScore = -1;
    let beerSommelier = null;
    let bestSawDiff = 999999;
    let precisionSaw = null;
    let worstSawDiff = -1;
    let wildAxe = null;
    let bestTriviaScore = -1;
    let triviaMaster = null;

    standings.forEach(st => {
      if (st.beerScore.total > bestBeerScore && st.beerScore.total > 0) {
        bestBeerScore = st.beerScore.total;
        beerSommelier = { member: st.member, value: `${st.beerScore.total} Biere` };
      }
      if (st.sawDetails && st.sawDetails.hasBoth) {
        if (st.sawDetails.diff < bestSawDiff) {
          bestSawDiff = st.sawDetails.diff;
          precisionSaw = { member: st.member, value: `±${st.sawDetails.diff}g (${st.sawDetails.totalWeight}g)` };
        }
        if (st.sawDetails.diff > worstSawDiff) {
          worstSawDiff = st.sawDetails.diff;
          wildAxe = { member: st.member, value: `±${st.sawDetails.diff}g (${st.sawDetails.totalWeight}g)` };
        }
      }
      if (st.triviaScore > bestTriviaScore && st.triviaScore > 0) {
        bestTriviaScore = st.triviaScore;
        triviaMaster = { member: st.member, value: `${st.triviaScore} Pkt.` };
      }
    });

    standings.funAwards = {
      beerSommelier,
      precisionSaw,
      wildAxe,
      triviaMaster
    };

    return standings;
  }

  applyTimbersportsToEvent8() {
    const standings = this.calculateTimbersportsStandings();
    const evt8 = this.getEvent(8);
    if (!evt8) return false;

    const rawScores = standings.map((st, idx) => ({
      playerId: st.member.id,
      rank: idx + 1,
      points: 8 - idx
    }));

    return this.saveEventScoring(8, rawScores, true);
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
