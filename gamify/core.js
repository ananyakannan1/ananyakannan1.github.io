/* The ambient game layer: everything that runs across the whole essay.
   Games register in window.GAMES and get the API at the bottom (window.G).
   Progress lives in this reader's browser only; no accounts, no backend. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const today = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   STATE
   ============================================================ */
const KEY = 'gamify.v1';
const FRESH = () => ({
  xp: 0, xpRead: 0, got: {},           // got: every XP key already paid, so nothing pays twice
  progress: 10,
  badges: {},
  fomoClaimed: 0, fomoSeen: false,
  terms: {}, hunt: 0, huntOn: false,
  eggs: {}, stamps: {}, games: {}, scrollY: 0,
  foil: null, visits: [], comeback: false
});
let S;
try { S = Object.assign(FRESH(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); }
catch (e) { S = FRESH(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const listeners = [];
function changed() { save(); renderHud(); renderMap(); listeners.forEach(f => f()); }

/* ============================================================
   XP AND TITLES
   'read' XP is the only XP you get for reading. The reveal compares it with
   everything else, which is the twist: hunting pays better than reading.
   ============================================================ */
const EGGS = ['dot', 'konami', 'goodhart'];
const eggCount = () => EGGS.filter(e => S.eggs[e]).length;
const TITLES = [
  [0, 'Scroller'], [40, 'Skimmer'], [130, 'Reader'], [260, 'Close Reader'], [420, 'Scholar']
];
function titleFor() {
  if (EGGS.every(e => S.eggs[e])) return 'Hacker';
  let t = TITLES[0][1];
  for (const [min, name] of TITLES) if (S.xp >= min) t = name;
  return t;
}
/* XP is shown, not announced: a "+20" chip flies from where you earned it
   into the counter at the top. Only a few awards also get a toast. */
function award(key, amt, label, kind = 'play', from) {
  if (S.got[key]) return false;
  const before = titleFor();
  S.got[key] = 1;
  S.xp += amt;
  if (kind === 'read') S.xpRead += amt;
  flyXp(amt, from);
  if (label) toast(`<b>+${amt} XP</b> ${label}`, 'xp');
  const after = titleFor();
  if (after !== before) setTimeout(() => toast(`<b>LEVEL UP!</b> You are now a <b>${after}</b>.`, 'xp'), 700);
  changed();
  return true;
}

function flyXp(amt, from) {
  let x = innerWidth / 2, y = innerHeight * .7;
  if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  else if (from && from.x != null) { x = from.x; y = from.y; }
  const target = $('#hudXp').getBoundingClientRect();
  const c = document.createElement('div');
  c.className = 'flyxp'; c.textContent = '+' + amt + ' XP';
  c.style.left = x + 'px'; c.style.top = y + 'px';
  document.body.appendChild(c);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    c.style.transform = `translate(${target.left - x}px, ${target.top - y}px) scale(.7)`;
  }));
  setTimeout(() => {
    c.remove();
    const h = $('.hud-xp'); h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump');
    blip([1175], .03);
  }, 760);
}

/* ============================================================
   STAMPS: a collection card with visible empty slots
   ============================================================ */
const STAMPS = [
  ['nest', 'Nest', 'realEgg'], ['teacher', 'Teacher', 'student'], ['hijack', 'Hijack', 'heart'],
  ['spellbook', 'Spells', 'wizard'], ['dot', 'Secret Room', 'chestOpen'], ['konami', 'Cheat Code', 'star'],
  ['goodhart', 'Exploiter', 'slime'], ['comeback', 'Came Back', 'bell']
];
// One reader in twenty gets a foil stamp. Decided once, on the first visit.
if (S.foil === null || !STAMPS.some(x => x[0] === S.foil) && S.foil !== '') { S.foil = Math.random() < 0.05 ? STAMPS[Math.floor(Math.random() * STAMPS.length)][0] : ''; save(); }
function stamp(id) {
  if (S.stamps[id]) return;
  S.stamps[id] = 1;
  const s = STAMPS.find(x => x[0] === id);
  toast(`<b>EGG!</b> ${s ? s[1] : id}${S.foil === id ? ' <b>✦ FOIL ✦</b>' : ''}`, 'xp');
  bump('#hudStamps');
  changed();
}
function openStamps() {
  const n = Object.keys(S.stamps).length;
  modal(`<h3>Egg card</h3>
    <p class="flat">${n} of ${STAMPS.length} collected.</p>
    <div class="stampcard">${STAMPS.map(([id, name, a]) =>
      `<div class="stamp ${S.stamps[id] ? 'got' : ''} ${S.foil === id ? 'foil' : ''}">${S.stamps[id] ? art(a) : ''}${S.stamps[id] ? name : '?'}</div>`).join('')}</div>
    <div class="btn-row"><button class="btn" data-close>Keep reading</button></div>`);
}

/* ============================================================
   HUD
   ============================================================ */
function renderHud() {
  $('#hudTitle').textContent = titleFor();
  $('#hudXp').textContent = S.xp;
  $('#hudBar').style.width = S.progress + '%';
  $('#hudStampN').textContent = Object.keys(S.stamps).length;
  $('#hudStampOf').textContent = STAMPS.length;
  $('#hudEggN').textContent = eggCount();
  $('#hudKeys').hidden = !S.huntOn;
  $('#hudKeyN').textContent = S.hunt;
  $('#essay').classList.toggle('hunting', !!S.huntOn);
  const mp = $('#mapPct'); if (mp) mp.textContent = Math.round(S.progress);
}
function bump(sel) { const e = $(sel); if (!e) return; e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
function openEggs() {
  const E = [['dot', 'The grey dot', 'A tiny grey dot, near the very beginning.'], ['konami', 'The cheat code', 'A notification knows it. Try it on the classroom.'],
    ['goodhart', 'The exploit', 'One word breaks the spell game.']];
  modal(`<h3>Easter eggs</h3><p class="flat">Three secrets are tucked into this essay.</p>
    ${E.map(([id, n, h]) => `<p>${S.eggs[id] ? '✅' : '⬜'} <b>${n}</b><br><span class="flat">${S.eggs[id] ? 'Found!' : h}</span></p>`).join('')}
    <div class="btn-row"><button class="btn" data-close>Keep reading</button></div>`);
}

/* ============================================================
   TOASTS, MODAL, CONFETTI
   ============================================================ */
function toast(html, cls = '', ms = 2600, onClick) {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.innerHTML = html;
  if (onClick) t.addEventListener('click', () => { onClick(); kill(); });
  const box = $('#toasts');
  box.appendChild(t);
  // never more than three at once: the oldest makes room
  while (box.children.length > 3) box.firstElementChild.remove();
  let gone = false;
  function kill() { if (gone) return; gone = true; t.classList.add('out'); setTimeout(() => t.remove(), 320); }
  if (ms) setTimeout(kill, ms);
  return kill;
}
let modalClose = null;
function modal(html, onClose) {
  const m = $('#modal'), card = $('.modal-card', m);
  card.className = 'modal-card';
  card.innerHTML = html;
  m.hidden = false;
  modalClose = onClose || null;
  const first = card.querySelector('button, input'); if (first) first.focus();
  return card;
}
function closeModal() {
  $('#modal').hidden = true;
  const f = modalClose; modalClose = null; if (f) f();
}
document.addEventListener('click', e => {
  if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

function confetti(x, y, n = 26) {
  const cols = ['#f2c14e', '#ff6ba3', '#8fd4a8', '#7fb3f2', '#c78ff2', '#ffe08a'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.style.background = cols[i % cols.length];
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 110;
    c.style.setProperty('--dx', Math.round(Math.cos(a) * d / 4) * 4 + 'px');
    c.style.setProperty('--dy', Math.round((Math.sin(a) * d + 70) / 4) * 4 + 'px');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1200);
  }
}
function confettiAt(el) { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); }

/* A short square-wave blip, so rewards have a sound. Muted until the reader's
   first click, which browsers require anyway. */
let AC = null;
function blip(freqs = [660, 990], len = .07) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.04, AC.currentTime + i * len);
      g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + (i + 1) * len);
      o.connect(g); g.connect(AC.destination);
      o.start(AC.currentTime + i * len); o.stop(AC.currentTime + (i + 1) * len);
    });
  } catch (e) {}
}

/* ============================================================
   SKY AND ILLUSTRATIONS
   ============================================================ */
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function drawSky() {
  const rnd = seeded(7);
  let s = '';
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * 320), y = Math.floor(rnd() * 120), big = rnd() > .85;
    s += R(x, y, big ? 2 : 1, big ? 2 : 1, '#fbeaf1', ` opacity="${(.35 + rnd() * .6).toFixed(2)}"${rnd() > .7 ? ' class="twinkle"' : ''}`);
  }
  $('#sky').innerHTML = `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">${s}</svg>`;
}

// columns of a hillside, sampled per pixel column so the outline steps
function hill(w, base, amp, period, phase, color) {
  let s = '';
  for (let x = 0; x < w; x++) {
    const y = Math.round(base - amp * Math.sin(x / period + phase) - amp * .4 * Math.sin(x / (period * .37) + phase * 2));
    s += R(x, y, 1, 200, color);
  }
  return s;
}
function skyBands(w, h, cols) {
  const bh = Math.ceil(h / cols.length);
  return cols.map((c, i) => R(0, i * bh, w, bh, c)).join('');
}
function stars(w, h, n, seed) {
  const rnd = seeded(seed); let s = '';
  for (let i = 0; i < n; i++) s += R(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1, '#fbeaf1', ` opacity="${(.4 + rnd() * .6).toFixed(2)}"`);
  return s;
}
function moon(cx, cy, r) {
  let s = '';
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y);
    if (d <= r) s += R(cx + x, cy + y, 1, 1, d > r - 1 ? '#f0dfb0' : ((x - 2) ** 2 + (y + 1) ** 2 < 3 || (x + 2) ** 2 + (y - 2) ** 2 < 2) ? '#e8d49e' : '#fff6dc');
  }
  return s;
}
const ILLOS = {
  end() {
    const W = 160, H = 56;
    let s = skyBands(W, H, ['#1b1442', '#241a52', '#2f2160', '#3d2a6c', '#553578', '#74437f']);
    s += stars(W, 30, 36, 9) + moon(24, 12, 5);
    s += hill(W, 46, 2, 18, 0, '#3f6b5c');
    // an open book on the hill, glowing
    const bx = 62, by = 34;
    s += R(bx - 4, by - 4, 44, 16, 'rgba(255,224,138,.12)');
    s += R(bx, by, 17, 9, '#fff6dc') + R(bx + 19, by, 17, 9, '#fff6dc') + R(bx + 17, by + 1, 2, 9, '#c98a2a');
    s += R(bx, by + 9, 36, 2, '#b8477a');
    for (let i = 0; i < 3; i++) { s += R(bx + 2, by + 2 + i * 2, 12, 1, '#a99ac0'); }
    s += R(bx + 22, by + 8, 10, 1, '#fff6dc');
    return { s, W, H };
  }
};
function drawIllos() {
  $$('[data-illo]').forEach(f => {
    const fn = ILLOS[f.dataset.illo]; if (!fn) return;
    const { s, W, H, cap } = fn();
    f.innerHTML = `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" role="img" aria-label="pixel illustration">${s}</svg>${cap ? `<figcaption>${cap}</figcaption>` : ''}`;
  });
}
document.addEventListener('click', e => {
  if (e.target.closest('.greydot')) return openSecretRoom();
});

/* ============================================================
   SECRET ROOM (the grey dot) and THE HUNT
   The room turns five keywords into keys, marked 🔑, collected in any order.
   The point is that collecting them makes you skim, which the reveal names.
   ============================================================ */
function openSecretRoom() {
  if (!S.eggs.dot) {
    S.eggs.dot = 1; S.huntOn = true; S.keys = S.keys || {};
    blip([392, 523, 659, 784], .09);
    award('egg:dot', 50, 'Secret room found!', 'play', $('.greydot'));
    stamp('dot');
  }
  modal(`<h3>✦ Secret room ✦</h3>
    <p>You found the grey dot! In 1980 Warren Robinett hid his name in a room like this because Atari wouldn’t credit him. This one is here for the same reason: somebody made this, and hid a door for you to find.</p>
    <p class="useful"><b>A key hunt has started.</b> Five words in the essay now have a 🔑 next to them, above and below this point. Click all five. Your count is at the top of the screen.</p>
    <div class="btn-row"><button class="btn" data-close>Start hunting</button></div>`);
}
function armHunt() {
  const k = S.keys || {};
  $$('[data-hunt]').forEach(t => t.classList.toggle('hunt-done', !!k[t.dataset.hunt]));
}
function tryHunt(t) {
  if (!S.huntOn) return false;
  const n = t.dataset.hunt;
  S.keys = S.keys || {};
  if (!n || S.keys[n]) return false;
  S.keys[n] = 1;
  S.hunt = Object.keys(S.keys).length;
  blip([523, 659, 784]);
  confettiAt(t);
  award('hunt:' + n, 10, null, 'play', t);
  bump('#hudKeys');
  armHunt(); changed();
  if (S.hunt < 5) toast(`🔑 <b>Key ${S.hunt} of 5</b> ${5 - S.hunt} to go`, 'xp');
  else award('hunt:all', 50, 'All five keys found!', 'play', t);
  return true;
}

/* ============================================================
   JARGON TOOLTIPS
   ============================================================ */
const TERMS = {
  'attention economy': 'The market where your attention is the product, sold mostly to advertisers.',
  'milieu': 'A social or intellectual environment: your people and their ideas.',
  'cognitive warfare': 'Using information to shape how a population thinks, decides and pays attention.',
  'neuroplastic': 'Able to rewire. Young brains reshape themselves around whatever they repeatedly do.',
  'sisyphean': 'Endless and futile. Sisyphus was condemned to roll a boulder uphill forever, only to watch it roll back down.',
  'teleological': 'Goal-directed. Explaining things by the purpose they serve.',
  'flow state': 'Mihaly Csikszentmihalyi’s name for total absorption: clear goals, instant feedback, and a challenge matched to your skill.',
  'over-justification effect': 'Rewarding people for something they already enjoy can make them enjoy it less (Lepper, Greene & Nisbett, 1973).',
  'Goodhart’s law': 'Economist Charles Goodhart’s observation, in anthropologist Marilyn Strathern’s phrasing: when a measure becomes a target, it ceases to be a good measure.',
  'kind learning environments': 'Settings where feedback is fast and accurate, like chess. The opposite is “wicked”.',
  'variable reward': 'Rewards that arrive unpredictably. It is the schedule slot machines run on, and the hardest habit to break.',
  'affordances': 'What a thing makes possible or invites you to do. A door handle affords pulling.',
  'bespoke': 'Custom-made for one person, like a tailored suit.',
  'golden shares': 'A small stake that carries outsized legal power, like the right to veto company decisions.',
  'recidivism': 'When someone convicted of a crime goes on to reoffend.',
  'intergenerational mobility': 'How far a child’s income or status can end up from their parents’.',
  'macromolecular': 'Made of very large molecules. In food, that means fats, carbohydrates and proteins.',
  'dopaminergic': 'Involving dopamine, the brain chemical tied to motivation and wanting.',
  'entrains': 'Gradually falls into sync with an outside rhythm, the way your body clock syncs to daylight.',
  'entropy': 'Disorder and unpredictability. The more of it there is, the harder it is to know what happens next.',
  'supernormal stimulus': 'An exaggerated version of something an instinct evolved for, which triggers it harder than the real thing (Niko Tinbergen).'
};
let tipFor = null;
function showTip(t) {
  const tip = $('#tip'), term = t.dataset.term;
  let html = `<b>${term}</b>${TERMS[term] || ''}`;
  if (!S.terms[term]) html += `<span class="tip-cta">Click for +3 XP</span>`;
  tip.innerHTML = html; tip.hidden = false;
  const r = t.getBoundingClientRect();
  const w = tip.offsetWidth;
  tip.style.left = clamp(r.left + scrollX + r.width / 2 - w / 2, 8, document.documentElement.clientWidth - w - 8) + 'px';
  tip.style.top = (r.bottom + scrollY + 8) + 'px';
  tipFor = t;
}
// XP for a keyword is paid on click, never on hover
function claimTerm(t) {
  const term = t.dataset.term;
  if (S.terms[term]) return;
  S.terms[term] = 1;
  $$('.term').forEach(x => { if (x.dataset.term === term) x.classList.add('seen'); });
  award('term:' + term, 3, null, 'play', t);
}
function hideTip() { $('#tip').hidden = true; tipFor = null; }
function wireTerms() {
  $$('.term').forEach(t => {
    if (S.terms[t.dataset.term]) t.classList.add('seen');
    t.tabIndex = 0;
    t.addEventListener('mouseenter', () => showTip(t));
    t.addEventListener('mouseleave', hideTip);
    t.addEventListener('focus', () => showTip(t));
    t.addEventListener('blur', hideTip);
    t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); } });
    t.addEventListener('click', e => {
      e.stopPropagation();
      const hint = $('.click-hint', t);
      if (hint) { hint.remove(); t.classList.remove('has-hint'); }
      if (tryHunt(t)) { hideTip(); return; }
      const fresh = !S.terms[t.dataset.term];
      claimTerm(t);
      if (fresh) showTip(t); else tipFor === t ? hideTip() : showTip(t);
    });
  });
  // The first highlighted word in the essay teaches the rest: a sign until it's clicked.
  const first = $('.paper .term');
  if (first && !S.terms[first.dataset.term]) {
    first.classList.add('has-hint');
    first.insertAdjacentHTML('beforeend', '<span class="click-hint" aria-hidden="true">Click me and see what happens!</span>');
  }
  document.addEventListener('click', () => { if (tipFor) hideTip(); });
}
function wireFootnotes() {
  $$('.fnref').forEach(f => f.addEventListener('click', () => {
    location.hash = 'fn' + f.dataset.fn;
    award('fn:' + f.dataset.fn, 5, null, 'play', f);
  }));
}

/* ============================================================
   NOTIFICATIONS: six useless, two useful. You can't tell which until you click.
   ============================================================ */
const BADGES = [
  { tag: 'LOOT DROP', rarity: 'epic', tease: 'fun fact!', fact: 'The word <i>school</i> comes from the Greek <i>scholē</i>, which meant <b>leisure</b>.' },
  { tag: 'NEW MESSAGE', rarity: 'rare', tease: 'Someone replied to you', fact: '<i>Clue</i> comes from <i>clew</i>, a <b>ball of thread</b>, like the one Theseus unspooled to find his way out of the labyrinth.' },
  { tag: 'BONUS UNLOCKED', rarity: 'legendary', tease: 'You unlocked a bonus', useful: 'dot', fact: 'The first video game easter egg: Atari didn’t credit its designers, so in 1980 Warren Robinett hid his name in a <b>secret room</b> in <i>Adventure</i>, reachable only by finding an invisible grey dot.<br><br><span class="useful">There’s a grey dot hidden in this essay too. It’s near the very beginning, hiding in plain sight. Look closely.</span>' },
  { tag: 'SECRET FOUND', rarity: 'legendary', tease: 'Cheat code unlocked', useful: 'konami', fact: 'The Konami code exists because Kazuhisa Hashimoto found <i>Gradius</i> too hard to test, so he gave himself a cheat:<br><b class="num">↑ ↑ ↓ ↓ ← → ← → B A</b><br><br><span class="useful">Try it on the classroom above.</span>' },
  { tag: 'RARE ITEM', rarity: 'epic', tease: 'This will rewire your brain', fact: '<i>Nice</i> originally meant <b>ignorant</b>, from the Latin <i>nescius</i>, “not knowing.”' },
  { tag: 'TRENDING', rarity: 'rare', tease: 'Readers loved this part', fact: 'The dot over a lowercase <i>i</i> is called a <b>tittle</b>.' },
  { tag: 'DAILY REWARD', rarity: 'epic', tease: 'Trending in your network', fact: '<i>Glamour</i> began as a Scots form of <i>grammar</i>, back when learning was thought to be a kind of <b>magic spell</b>.' },
  // real footnotes, mixed in with the rest
  { tag: 'FOOTNOTE', rarity: 'rare', tease: '1 new footnote', footnote: true, fact: 'In doing research for this blogpost I realized I actually am not original in any way, and this is a phenomenon called a <a href="https://www.researchgate.net/publication/265122809_Supernormal_Stimuli_How_Primal_Urges_Overran_Their_Evolutionary_Purpose" target="_blank" rel="noopener">supernormal stimulus</a>.' },
  { tag: 'FOOTNOTE', rarity: 'rare', tease: '1 new footnote', footnote: true, fact: 'Seeing <a href="https://x.com/hekkiallmo/status/2106142938246025667?s=20" target="_blank" rel="noopener">this tweet</a> on my timeline was actually the thing that inspired me to make this essay.' },
  { tag: 'FOOTNOTE', rarity: 'rare', tease: '1 new footnote', footnote: true, fact: 'This was <a href="https://x.com/ananyaspilled/status/2103957419596668974" target="_blank" rel="noopener">one of my first projects</a> for my class.' },
  { tag: 'FOOTNOTE', rarity: 'rare', tease: '1 new footnote', footnote: true, fact: '<a href="https://x.com/ananyaspilled/status/2111994517310291991" target="_blank" rel="noopener">Another project</a> I did for my kids!' }
];
const BADGE_TOTAL = BADGES.length;

// Opening a notification pays a random amount of XP, once. Variable reward.
function openFact(b, id) {
  let prize = '';
  const firstEver = !Object.keys(S.badges).length;
  if (!S.badges[id]) {
    S.badges[id] = 1;
    const amt = [2, 3, 5, 5, 8, 12, 15][Math.floor(Math.random() * 7)];
    prize = `<div class="nb-prize">+${amt} XP</div>`;
    blip(amt >= 12 ? [523, 659, 784, 1047, 1319] : [784, 1175], .06);
    setTimeout(() => award('note:' + id, amt, null, 'play', $('.nb-prize')), 350);
    changed();
  }
  const card = modal(`${prize}${firstEver ? '<p class="nb-how">Clicking these gives you extra XP and some easter eggs. Try to find them all!</p>' : ''}<p class="nb-fact">${b.fact}</p>
    ${b.useful === 'konami' ? `<div class="btn-row"><button class="btn alt" data-dpad>On a phone? Open a d-pad</button></div>` : ''}
    <div class="btn-row"><button class="btn" data-close>Close</button></div>`);
  const d = card.querySelector('[data-dpad]');
  if (d) d.addEventListener('click', () => { closeModal(); openDpad(); });
}
function letterHtml(opened) {
  return `<span class="nl-slide"><span class="nl-art">${art(opened ? 'letterOpen' : 'letter')}</span></span>`;
}
// Flap up, note rising, then the note itself.
function playLetter(el, done) {
  const box = $('.nl-art', el);
  el.classList.add('opening');
  const frames = ['letterFlap', 'letterHalf', 'letterOpen'], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { box.innerHTML = art('letterOpen'); done(); return; }
  frames.forEach((f, i) => setTimeout(() => { box.innerHTML = art(f); }, 90 + i * 130));
  setTimeout(done, 90 + frames.length * 130 + 180);
}
function wireBadges() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const slot = e.target, id = +slot.dataset.badge, b = BADGES[id];
    io.unobserve(slot);
    setTimeout(() => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'nletter' + (S.badges[id] ? ' opened' : '');
      el.title = b.tease;
      el.setAttribute('aria-label', 'Open letter: ' + b.tease);
      el.innerHTML = letterHtml(S.badges[id]);
      el.addEventListener('click', () => {
        if (el.classList.contains('opening')) return;
        if (el.classList.contains('opened')) { openFact(b, id); return; }
        playLetter(el, () => { el.classList.remove('opening'); el.classList.add('opened'); openFact(b, id); });
      });
      slot.appendChild(el);
      if (!S.badges[id]) blip([880, 1319], .05);
    }, 500);
  }), { rootMargin: '0px 0px -25% 0px' });
  $$('.badge-slot').forEach(s => io.observe(s));
}


/* ============================================================
   KONAMI CODE: keyboard, or the d-pad for phones
   ============================================================ */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kpos = 0;
const GLYPHS = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', b: 'B', a: 'A' };
let trailT = null;
function konamiKey(k) {
  k = k.length === 1 ? k.toLowerCase() : k;
  if (!GLYPHS[k]) return;
  // pressing ↑ a third time keeps the two you have, as in the original
  kpos = k === KONAMI[kpos] ? kpos + 1 : (k === 'ArrowUp' && kpos === 2) ? 2 : (k === KONAMI[0] ? 1 : 0);
  const tr = $('#konamiTrail');
  if (kpos >= 2) {
    tr.innerHTML = KONAMI.map((x, i) => `<span class="${i < kpos ? '' : 'todo'}">${GLYPHS[x]}</span>`).join('');
    tr.hidden = false;
    clearTimeout(trailT); trailT = setTimeout(() => tr.hidden = true, 2500);
  } else tr.hidden = true;
  if (kpos === KONAMI.length) {
    kpos = 0;
    tr.hidden = true;
    const first = !S.eggs.konami;
    S.eggs.konami = 1;
    blip([523, 659, 784, 1047, 1319], .08);
    confetti(innerWidth / 2, innerHeight / 3, 60);
    if (first) { award('egg:konami', 50, 'CHEAT CODE ACTIVATED'); stamp('konami'); }
    bump('#hudEggs');
    $('#dpad').hidden = true;
    document.dispatchEvent(new CustomEvent('konami'));
  }
}
addEventListener('keydown', e => {
  // typing in a text box doesn't count; a focused slider does
  if (e.target.matches('textarea, input:not([type=range])')) return;
  if (GLYPHS[e.key.length === 1 ? e.key.toLowerCase() : e.key] && e.target.matches('input[type=range]')) e.preventDefault();
  konamiKey(e.key);
});
function openDpad() {
  const d = $('#dpad');
  d.innerHTML = `<span></span><button data-k="ArrowUp">↑</button><span></span><span></span><button data-k="b">B</button><button data-k="a">A</button>
    <button data-k="ArrowLeft">←</button><button data-k="ArrowDown">↓</button><button data-k="ArrowRight">→</button><span></span><button data-close-dpad style="grid-column:span 2;font-size:11px">close</button>`;
  d.hidden = false;
  d.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-close-dpad')) { d.hidden = true; return; }
    blip([440], .03);
    konamiKey(b.dataset.k);
  };
  const t = $('[data-game="teacher"]'); if (t) t.scrollIntoView({ block: 'center' });
  G.toast('Type <b>↑ ↑ ↓ ↓ ← → ← → B A</b> on your keyboard, or tap it here.', 'xp', 5000);
}

/* ============================================================
   READING: progress, sections, the over-justification bribe
   ============================================================ */
function trackReading() {
  const essay = $('#essay');
  const onScroll = () => {
    const r = essay.getBoundingClientRect();
    const rv = $('#reveal').getBoundingClientRect(), line = innerHeight * .6;
    // the essay fills the bar to 90%; the last stretch is the walk down to the reveal
    const inEssay = clamp((line - r.top) / r.height, 0, 1);
    const past = clamp((line - r.bottom) / Math.max(1, rv.top - r.bottom), 0, 1);
    const reached = rv.top < innerHeight * .5;
    const p = reached ? 100 : Math.min(99, Math.round(10 + 80 * inEssay + 10 * past));
    refreshStops();
    if (reached && S.progress < 100) questComplete();
    if (p > S.progress) { S.progress = p; renderHud(); renderMap(); }
    walkTo(p);
    if (booted) { S.scrollY = Math.round(scrollY); saveSoon(); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  renderMap();

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    io.unobserve(el);
    if (el.hasAttribute('data-overjust')) {
      award('overjust', 25, 'for reading this paragraph!', 'read');
      return;
    }
    const ch = el.closest('.ch');
    el.classList.add('lit', 'just');
    if (award('read:' + ch.dataset.ch, 20, null, 'read', $('svg', el))) blip([659, 988], .06);
  }), { rootMargin: '0px 0px -30% 0px' });
  // a flag at each section's subtitle (the intro has none); reaching the flag pays the reading XP
  $$('.ch:not(#reveal):not([data-ch="0"])').forEach(ch => {
    const cp = checkpointEl();
    ch.prepend(cp);
    if (S.got['read:' + ch.dataset.ch]) cp.classList.add('lit'); else io.observe(cp);
  });
  io.observe($('[data-overjust]'));
}
function checkpointEl() {
  const pole = R(3, 2, 2, 18, '#6a5d4d') + R(2, 0, 4, 2, '#f2c14e') + R(0, 20, 8, 2, '#2a1d3a');
  const down = R(5, 11, 7, 2, '#d3c9b7') + R(5, 13, 5, 2, '#c3b8a4') + R(5, 15, 3, 2, '#d3c9b7');
  const up = R(5, 2, 13, 2, '#ff6ba3') + R(5, 4, 11, 2, '#ff6ba3') + R(5, 6, 9, 2, '#e0508a') + R(5, 8, 6, 2, '#b8477a') + R(8, 4, 2, 2, '#ffe08a');
  const el = document.createElement('div');
  el.className = 'checkpoint';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<i></i><svg viewBox="0 0 18 22" shape-rendering="crispEdges">${pole}<g class="cp-down">${down}</g><g class="cp-up">${up}</g></svg><span class="cp-text">Checkpoint<span class="cp-xp">+20 XP</span></span><i></i>`;
  return el;
}
function questComplete() {
  S.progress = 100;
  award('quest', 50, null, 'read', $('#reveal'));
  renderHud(); renderMap(); save();
  blip([523, 659, 784, 1047, 1319], .09);
  confetti(innerWidth / 2, innerHeight / 3, 80);
  modal(`<h3>★ Quest complete ★</h3>
    <p>You reached the end. You’re a <b>${titleFor()}</b> with <b>${S.xp} XP</b>, ${Object.keys(S.stamps).length}/${STAMPS.length} eggs.</p>
    <p>Now for the reveal: every trick this essay used on you, and which ones worked.</p>
    <div class="btn-row"><button class="btn" data-close>Show me</button></div>`);
}
let saveT = null;
function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }

/* ============================================================
   QUEST MAP
   ============================================================ */
const MAP_W = 190, MAP_H = 500, LEDGER_W = 230;
// On tall screens the trail stretches to fill the panel; art and text keep their size.
let stretch = 1;
const NODES = [
  { ch: 0, label: 'Start', y: 30 }, { ch: 1, label: 'The Attention Economy', y: 100 }, { ch: 2, label: 'The Current Classroom', y: 185 },
  { ch: 3, label: 'The Answer', y: 258 }, { ch: 6, label: 'How to Gamify', y: 318 }, { ch: 4, label: 'The Catch?', y: 372 },
  { ch: 7, label: 'End of Essay', y: 428 }, { ch: 5, label: 'The Grand Reveal', y: 476 }
];
const pathX = y => Math.round(95 + 50 * Math.sin(y / stretch / 62));
const trailY = y => Math.round(y * stretch);
const CHESTS = [{ egg: 'dot', y: 58, ch: 0 }, { egg: 'konami', y: 240, ch: 2 }, { egg: 'goodhart', y: 402, ch: 4 }];
const GAME_PINS = [['nest', 155, 1], ['teacher', 225, 2], ['hijack', 292, 3], ['spellbook', 398, 4]];
// Phones get the ledger: a straight line with each game and chest under its section.
const isLedger = () => matchMedia('(max-width: 1180px)').matches;
const LEDGER = (() => {
  const ys = {}; let y = 20;
  NODES.forEach(n => {
    ys[n.ch] = y;
    y += 36 + (CHESTS.some(c => c.ch === n.ch) || GAME_PINS.some(g => g[2] === n.ch) ? 30 : 0);
  });
  return { ys, h: y - 14 };
})();
const nodeY = n => isLedger() ? LEDGER.ys[n.ch] : trailY(n.y);
function spriteAt(name, x, y, scale = 1) {
  const rows = ART[name];
  if (!rows) return '';   // a missing sprite should never take the whole page down
  const w = rows[0].length, h = rows.length;
  return `<g transform="translate(${Math.round(x - w * scale / 2)},${Math.round(y - h * scale / 2)}) scale(${scale})">${rects(rows, PAL)}</g>`;
}
// Each stop is tied to where its section really starts, so the walker arrives as you do.
let stops = null;
function refreshStops() {
  const e = $('#essay').getBoundingClientRect();
  stops = NODES.map(n => {
    if (n.ch === 5) return { p: 100, y: nodeY(n) };
    const sec = $(`.ch[data-ch="${n.ch}"]`);
    const t = sec ? sec.getBoundingClientRect().top : e.bottom;
    return { p: 10 + 80 * clamp((t - e.top) / e.height, 0, 1), y: nodeY(n) };
  });
  stops[0].p = 10;
}
function mapY(p) {
  if (!stops) return nodeY(NODES[0]);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i];
    if (p <= b.p) return a.y + (b.y - a.y) * clamp((p - a.p) / Math.max(.01, b.p - a.p), 0, 1);
  }
  return stops[stops.length - 1].y;
}
function labelLines(t, max = 14) {
  const lines = [''];
  t.split(' ').forEach(w => {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > max) lines.push(w); else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  });
  return lines;
}
// The walker follows where you are now; the lit trail remembers how far you got.
let walkP = null, walkY = null, walkUp = false, walkRaf = 0;
// Win Nest and the bird family flutters around you as you go. The JS only carries them along;
// the fluttering is CSS, two swaying motions with different timings so the path never repeats.
// [sprite, resting x and y if motion is off, seconds to sway across, seconds to sway down, catch-up speed]
const FAMILY = [['bird', -24, -6, 1.9, 1.3, .1], ['mate', 24, -10, 2.6, 1.7, .08], ['chick', 3, 24, 1.4, 2.3, .065]];
let flock = null;
const hasFamily = () => !!(S.games.nest && S.games.nest.hatched);
const flockTarget = () => walkY - 3;
function stepFlock() {
  if (!flock) return true;
  let settled = true;
  flock.forEach((y, i) => {
    const d = flockTarget() - y;
    if (Math.abs(d) > .5) settled = false;
    flock[i] = y + clamp(d * FAMILY[i][5], -2.8, 2.8);
  });
  return settled;
}
function placeWalker() {
  const w = $('#mapWalker'); if (!w || walkY == null) return;
  const ledger = isLedger(), ox = y => ledger ? 20 : pathX(y), oy = ledger ? 11 : 0;
  const hop = y => walkRaf && Math.floor(y / 7) % 2 ? -2 : 0;
  w.setAttribute('transform', `translate(${ox(walkY)},${Math.round(walkY + hop(walkY) + oy)})`);
  w.classList.toggle('up', walkUp);
  if (hasFamily() && !flock) flock = FAMILY.map(flockTarget);
  // the ledger has text to the right of you, so the birds' circle sits a little off-centre there
  if (flock) $$('#mapBody .map-family').forEach((g, i) => g.setAttribute('transform', `translate(${ox(flock[i]) + (ledger ? 12 : 0)},${Math.round(flock[i] + oy)})`));
}
function updateHere() {
  const el = $('#mapHere'); if (!el || !stops || walkP == null) return;
  let name = NODES[0].label;
  stops.forEach((s, i) => { if (walkP >= s.p - .01) name = NODES[i].label; });
  const text = 'You are here: ' + name;
  if (el.textContent !== text) el.textContent = text;
}
function walkStep() {
  const d = mapY(walkP) - walkY, moving = Math.abs(d) >= .4;
  if (moving) { walkUp = d < 0; walkY += clamp(d * .12, -2.8, 2.8); }
  else { walkY = mapY(walkP); walkUp = false; }
  const settled = stepFlock();
  walkRaf = moving || !settled ? requestAnimationFrame(walkStep) : 0;
  placeWalker();
}
function walkTo(p) {
  walkP = p;
  updateHere();
  if (walkY == null || matchMedia('(prefers-reduced-motion: reduce)').matches) { walkY = mapY(p); flock = null; placeWalker(); return; }
  if (!walkRaf) walkRaf = requestAnimationFrame(walkStep);
}
function signAt(g, x, y) {
  const played = S.games[g];
  // cream sign with a dark arrow until played, then gold with a pink arrow
  return spriteAt('sign', x, y, 2).replace(/#d9c39a/g, played ? '#ffe08a' : '#e9dcc0').replace(/#c98a2a/g, played ? '#e0508a' : '#5c3a28');
}
const chestAt = (c, x, y) => spriteAt(S.eggs[c.egg] ? 'chestOpen' : 'chest', x, y, 2);
function nodeMark(n, x, y, on) {
  return R(x - 8, y - 8, 16, 16, on ? '#f2c14e' : '#473c8c') + R(x - 5, y - 5, 10, 10, on ? '#ffe08a' : '#2a2259');
}
function trailMarkup(py) {
  let s = '';
  const H = trailY(MAP_H);
  // grass specks
  const rnd = seeded(21);
  for (let i = 0; i < 70 * stretch; i++) {
    const y = Math.floor(rnd() * H), x = Math.floor(rnd() * MAP_W);
    if (Math.abs(x - pathX(y)) > 14) s += R(x, y, 2, 3, '#3f7a5c') + R(x + 3, y + 1, 2, 2, '#3f7a5c');
  }
  // the dirt path: dots, filled where you've walked
  for (let y = 16; y < H - 10; y += 6) s += R(pathX(y) - 3, y, 6, 3, y <= py ? '#ffe08a' : '#3a2f4d');
  NODES.forEach(n => {
    const ny = nodeY(n), x = pathX(ny), on = py >= ny - 2, left = x > MAP_W / 2, lx = left ? x - 14 : x + 14;
    const lines = labelLines(n.label, Math.min(14, Math.floor((left ? lx : MAP_W - lx) / 7)));
    const tspans = lines.map((l, i) => `<tspan x="${lx}" dy="${i ? 11 : 0}">${l}</tspan>`).join('');
    s += `<g class="map-node" data-goto="${n.ch}">${nodeMark(n, x, ny, on)}<text class="map-label ${on ? 'on' : ''}" y="${ny + 4 - (lines.length - 1) * 5.5}" text-anchor="${left ? 'end' : 'start'}">${tspans}</text></g>`;
  });
  // signs stand on the outer side of the path, chests on the inner side
  GAME_PINS.forEach(([g, y0]) => { const y = trailY(y0); s += signAt(g, clamp(pathX(y) + (pathX(y) > 95 ? 26 : -26), 18, 172), y); });
  CHESTS.forEach(c => { const y = trailY(c.y); s += chestAt(c, clamp(pathX(y) + (pathX(y) > 95 ? -29 : 29), 18, 172), y); });
  return s;
}
function ledgerMarkup(py) {
  let s = R(18, 14, 4, LEDGER.h - 28, '#3a2f4d') + R(18, 14, 4, Math.max(0, py - 14), '#ffe08a');
  NODES.forEach(n => {
    const y = LEDGER.ys[n.ch], on = py >= y - 2;
    s += `<g class="map-node" data-goto="${n.ch}">${R(0, y - 14, LEDGER_W, 28, 'transparent')}${R(14, y - 6, 12, 12, on ? '#f2c14e' : '#473c8c')}<text class="map-label ${on ? 'on' : ''}" style="font-size:11px" x="46" y="${y + 4}">${n.label}</text></g>`;
    let x = 58;
    GAME_PINS.filter(g => g[2] === n.ch).forEach(([g]) => { s += signAt(g, x, y + 25); x += 34; });
    CHESTS.filter(c => c.ch === n.ch).forEach(c => { s += chestAt(c, x, y + 25); x += 34; });
  });
  return s;
}
function renderMap() {
  const body = $('#mapBody'); if (!body) return;
  const ledger = isLedger();
  const next = !ledger && body.clientWidth ? Math.max(1, (MAP_W * body.clientHeight / body.clientWidth) / MAP_H) : 1;
  if (Math.abs(next - stretch) > .005) {
    stretch = next;
    if (stops) refreshStops();
    if (walkP != null) walkY = mapY(walkP);
    flock = null;
  }
  const py = mapY(S.progress);
  // you, and the bird family if the egg hatched; placeWalker moves these groups
  const outlined = (n, sc = 3, oy = -11, o = 1.5) => [[-o, 0], [o, 0], [0, -o], [0, o]].map(([dx, dy]) => spriteAt(n, dx, dy + oy, sc).replace(/fill="#[0-9a-f]+"/g, 'fill="#fff6dc"')).join('') + spriteAt(n, 0, oy, sc);
  const family = hasFamily() ? FAMILY.map(([n, x, y, sx, sy], i) => `<g class="map-family"><g class="fam-x" style="--rest:${x}px;animation-duration:${sx}s;animation-delay:${-i * .8}s"><g class="fam-y" style="--rest:${y}px;animation-duration:${sy}s;animation-delay:${-i * .5}s"><g class="fam-float" style="animation-delay:${-i * .15}s"><g transform="scale(1.3)">${outlined(n, 1, -6, .75)}</g></g></g></g></g>`).join('') : '';
  const walker = `${family}<g id="mapWalker"><g class="w-front">${outlined('avatar')}</g><g class="w-back">${outlined('avatarBack')}</g></g>`;
  body.innerHTML = `<svg viewBox="0 0 ${ledger ? LEDGER_W : MAP_W} ${ledger ? LEDGER.h : trailY(MAP_H)}" shape-rendering="crispEdges">${ledger ? ledgerMarkup(py) : trailMarkup(py)}${walker}</svg>`;
  placeWalker();
}
matchMedia('(max-width: 1180px)').addEventListener('change', () => { refreshStops(); walkY = walkP == null ? null : mapY(walkP); renderMap(); });
addEventListener('resize', () => renderMap());
document.addEventListener('click', e => {
  const n = e.target.closest('[data-goto]');
  if (n) { $(`.ch[data-ch="${n.dataset.goto}"]`).scrollIntoView(); $('#map').classList.remove('open'); }
});

/* ============================================================
   COMEBACK: return on a later day and the essay notices
   ============================================================ */
function checkComeback() {
  const d = today();
  const before = S.visits.length && S.visits[S.visits.length - 1] !== d;
  if (!S.visits.includes(d)) S.visits.push(d);
  if (before && !S.comeback) {
    S.comeback = true;
    setTimeout(() => {
      toast('<b>You came back.</b> We noticed. Here’s an egg for your streak.', 'xp', 5000);
      award('comeback', 30, null); stamp('comeback');
    }, 1500);
  }
  save();
}

/* ============================================================
   THE FLOCK: hatch the real egg and the bird family stays with you,
   drifting through the sky behind the page every so often.
   ============================================================ */
let flockOn = false;
function startFlock(now) {
  if (flockOn) { if (now) flyOnce(); return; }
  flockOn = true;
  const loop = () => { flyOnce(); setTimeout(loop, 22000 + Math.random() * 20000); };
  setTimeout(loop, now ? 400 : 6000);
}
function flyOnce() {
  const box = $('#flock'); if (!box) return;
  const ltr = Math.random() < .6;
  const f = document.createElement('div');
  f.className = 'flock-run' + (ltr ? '' : ' rtl');
  f.style.top = (18 + Math.random() * 60) + 'vh';
  f.style.animationDuration = (20 + Math.random() * 8) + 's';
  const bird = (name, x, y, d) => `<div class="flock-bird" style="left:${x}px;top:${y}px;animation-delay:${d}s">${art(name)}</div>`;
  f.innerHTML = bird('bird', 22, 0, 0) + bird('mate', 0, 14, .2) + bird('chick', 46, 18, .4);
  box.appendChild(f);
  f.addEventListener('animationend', e => { if (e.target === f) f.remove(); });
}

/* ============================================================
   SAVE SCREEN: a returning reader picks Continue or New Game
   ============================================================ */
function hasSave() { return S.xp > 10 || Object.keys(S.games).length || S.progress > 15; }
function titleScreen() {
  modal(`<div class="save-scr">
    <div class="save-h">GAMIFIED</div>
    <div class="save-sub">gamification is the future of education</div>
    <button class="save-slot" data-cont>
      <span class="save-lbl">▶ CONTINUE</span>
      <span class="save-meta"><b>${titleFor()}</b> · ${S.xp} XP<br>${Object.keys(S.stamps).length}/${STAMPS.length} eggs${S.games.nest && S.games.nest.hatched ? ' · 🐣' : ''}</span>
    </button>
    <button class="save-slot new" data-new><span class="save-lbl">✦ NEW GAME</span><span class="save-meta">start over from the title</span></button>
    </div>`);
  const card = $('.modal-card');
  card.classList.add('save-card');
  card.setAttribute('aria-label', 'Continue or new game');
  $('[data-cont]', card).onclick = () => {
    closeModal();
    blip([523, 659, 784], .07);
    if (S.scrollY) scrollTo({ top: S.scrollY, behavior: 'instant' });
    toast('💾 <b>CHECKPOINT LOADED</b>', 'xp', 2200);
  };
  $('[data-new]', card).onclick = e => {
    const b = e.currentTarget;
    if (!b.classList.contains('sure')) { b.classList.add('sure'); b.querySelector('.save-meta').textContent = 'this erases your save. tap again to confirm'; return; }
    try { localStorage.removeItem(KEY); } catch (err) {}
    scrollTo(0, 0);
    location.reload();
  };
}

/* ============================================================
   GAME API
   ============================================================ */
window.GAMES = window.GAMES || {};
// Every game gets a restart button in its header, so any state can be replayed.
function shell(el, name, sub, trim, restart) {
  el.innerHTML = `<div class="gm" style="--trim:${trim}"><div class="gm-head"><span class="gm-name">${name}</span><span class="gm-sub">${sub}</span>${restart ? '<button class="gm-restart" title="Restart this game">↺ RESTART</button>' : ''}</div><div class="gm-body"></div></div>`;
  if (restart) el.querySelector('.gm-restart').onclick = () => { blip([440, 330], .05); restart(); };
  return el.querySelector('.gm-body');
}
window.G = {
  S, save, shell, changed, award, toast, modal, closeModal, confetti, confettiAt, blip, stamp,
  art, EGGS, eggCount, startFlock, titleFor, STAMPS, BADGE_TOTAL, BADGES, flyXp, bump, openDpad,
  onChange: f => listeners.push(f),
  done(game, data = {}) {
    const first = !S.games[game];
    S.games[game] = Object.assign(S.games[game] || {}, data, { done: true });
    if (first) { award('game:' + game, 40, null, 'play', $(`[data-game="${game}"]`)); stamp(game); }
    changed();
  }
};

let booted = false;
function boot() {
  const returning = hasSave();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  drawSky(); drawIllos(); renderHud(); renderMap();
  wireTerms(); wireFootnotes(); wireBadges(); trackReading(); armHunt();
  checkComeback();
  $('#hudStamps').addEventListener('click', openStamps);
  $('#hudEggs').addEventListener('click', openEggs);
  $$('.ico-star').forEach(e => e.innerHTML = art('star'));
  $$('.ico-stamp').forEach(e => e.innerHTML = art('chestOpen'));
  $$('.ico-egg').forEach(e => e.innerHTML = art('realEgg'));
  $$('.ico-chest').forEach(e => e.innerHTML = art('chest'));
  $$('.ico-sign').forEach(e => e.innerHTML = art('sign'));
  $('#hudMap').addEventListener('click', e => { e.stopPropagation(); $('#map').classList.toggle('open'); });
  document.addEventListener('click', e => { if (!e.target.closest('#map, #hudMap')) $('#map').classList.remove('open'); });
  if (!S.got.title) award('title', 10, 'You read the title! 10% done already.', 'read');
  if (S.games.nest && S.games.nest.hatched) startFlock();
  if (returning) titleScreen();
  setTimeout(() => booted = true, 600);
  // games mount once their scripts have loaded
  addEventListener('load', () => $$('[data-game]').forEach(el => {
    const g = window.GAMES[el.dataset.game];
    if (g) { try { g(el, window.G); } catch (err) { console.error(err); el.textContent = ''; } }
  }));
}
boot();
