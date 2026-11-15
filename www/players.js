/* 25 Real Players Roster (5x5 Grid Mapping for avatars.jpg) */
window.BOT_ROSTER = [
  { id: 1,  name: 'Priya Sharma',    cc: 'IN', row: 0, col: 0 },
  { id: 2,  name: 'Arjun Khan',      cc: 'PK', row: 0, col: 1 },
  { id: 3,  name: 'Ananya Iyer',     cc: 'IN', row: 0, col: 2 },
  { id: 4,  name: 'Jack Miller',     cc: 'US', row: 0, col: 3 },
  { id: 5,  name: 'Emma Wilson',     cc: 'UK', row: 0, col: 4 },

  { id: 6,  name: 'Marco Rossi',     cc: 'IT', row: 1, col: 0 },
  { id: 7,  name: 'Sofia Laurent',   cc: 'FR', row: 1, col: 1 },
  { id: 8,  name: 'David Okafor',    cc: 'NG', row: 1, col: 2 },
  { id: 9,  name: 'Isabella Santos', cc: 'BR', row: 1, col: 3 },
  { id: 10, name: 'Kenji Tanaka',    cc: 'JP', row: 1, col: 4 },

  { id: 11, name: 'Yuna Kim',        cc: 'KR', row: 2, col: 0 },
  { id: 12, name: 'Chen Wei',        cc: 'CN', row: 2, col: 1 },
  { id: 13, name: 'Fatima Al-Sayed', cc: 'EG', row: 2, col: 2 },
  { id: 14, name: 'Mehmet Demir',    cc: 'TR', row: 2, col: 3 },
  { id: 15, name: 'Anna Petrova',    cc: 'RU', row: 2, col: 4 },

  { id: 16, name: 'Carlos Mendez',   cc: 'ES', row: 3, col: 0 },
  { id: 17, name: 'Lucia Fernandez', cc: 'BR', row: 3, col: 1 },
  { id: 18, name: 'Amara Diallo',    cc: 'SN', row: 3, col: 2 },
  { id: 19, name: 'Rina Wijaya',     cc: 'ID', row: 3, col: 3 },
  { id: 20, name: 'Daniel Cruz',     cc: 'PH', row: 3, col: 4 },

  { id: 21, name: 'Aisha Johnson',   cc: 'US', row: 4, col: 0 },
  { id: 22, name: 'Liam O\'Connor',  cc: 'IE', row: 4, col: 1 },
  { id: 23, name: 'Maria Gomez',     cc: 'MX', row: 4, col: 2 },
  { id: 24, name: 'Zara Mensah',     cc: 'GH', row: 4, col: 3 },
  { id: 25, name: 'Oliver Schmidt',  cc: 'DE', row: 4, col: 4 }
];

window.renderFaceHTML = function(row, col) {
  const posX = col * 25;
  const posY = row * 25;
  return `<div class="real-face" style="background-position:${posX}% ${posY}%"></div>`;
};

window.humanAvatarHTML = function() {
  return `<svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#d97706"/>
    <circle cx="50" cy="40" r="21" fill="#ffd1a4"/>
    <ellipse cx="50" cy="85" rx="33" ry="22" fill="#78350f"/>
    <path d="M26 30 Q50 15 74 30 L80 34 L20 34 Z" fill="#1e293b"/>
    <circle cx="42" cy="40" r="3" fill="#111"/>
    <circle cx="58" cy="40" r="3" fill="#111"/>
    <path d="M43 52 Q50 58 57 52" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
};

/* Pick 4 completely fresh faces whenever player enters a new table */
window.lastTableBotIds = [];
window.pickFreshTableBots = function() {
  let available = window.BOT_ROSTER.filter(b => !window.lastTableBotIds.includes(b.id));
  if (available.length < 4) available = [...window.BOT_ROSTER];
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const chosen = available.slice(0, 4);
  window.lastTableBotIds = chosen.map(b => b.id);
  return chosen;
};