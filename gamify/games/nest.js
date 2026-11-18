/* NEST: Tinbergen's egg, as an arcade game.
   Shiny fake eggs pop up all over the scene. Tap them fast to chain a combo
   (x2, x3, then x5 FEVER). Let one expire and the combo breaks, so your eyes
   stay locked on them. They escalate: bigger, shinier, buzzier, with
   notification dots. A rare golden one is a jackpot.
   Meanwhile your own egg sits in the nest, cooling. Tapping the nest warms
   it, silently, for no points, and it resets your combo. You can't have both.
   Every five fakes you chase, something in the bird's world quietly
   disappears. Keep your egg warm for all thirty seconds and it hatches, and
   the bird family flies with you for the rest of the essay. */

window.GAMES = window.GAMES || {};
window.GAMES.nest = function (el, G) {
  const DUR = 30, WINDOW = 1.25, START_WARM = 60, DECAY = 7, WARM_RATE = 30, PER_LOSS = 5;
  // where the bird sits on the nest, as % of the stage (sprite is 14x12 on a 160x92 scene)
  const SIT = { x: 37.5, y: 63 }, BW = 14 / 160 * 100, BH = 12 / 92 * 100;
  const TIERS = [[0, 1, ''], [5, 2, 'x2'], [10, 3, 'x3'], [20, 5, 'FEVER x5']];
  const LOSS = ['flowers', 'friends', 'sun', 'mate', 'leaves', 'grass', 'snow', 'night'];
  const LOST_NAME = { flowers: 'the flowers', friends: 'your friends', sun: 'the sun', mate: 'your mate', leaves: 'the leaves', grass: 'the grass', snow: 'autumn', night: 'the daylight' };
  let st = null, loop = null, gen = 0;
  const body = G.shell(el, 'Nest', 'high-score game', '#f2c14e', () => intro());

  /* ---------- drawing ---------- */
  function egg(w, h, cols, shine) {
    let s = '';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + .5 - w / 2) / (w / 2), ny = (y + .5 - h * .56) / (h * (y < h * .56 ? .56 : .44));
      if (nx * nx + ny * ny > 1) continue;
      const edge = nx * nx + ny * ny > .72;
      const lit = (x - w * .32) ** 2 + (y - h * .28) ** 2 < (w * .16) ** 2;
      s += R(x, y, 1, 1, lit && shine ? '#ffffff' : edge ? cols[1] : cols[0]);
    }
    return s;
  }
  const PALS = [['#f7d9a8', '#c99a5a'], ['#ffd27a', '#c98a2a'], ['#ffb7d3', '#d05a8f'], ['#9ad8ff', '#4a8ad0'],
    ['#ffe08a', '#e0702a'], ['#c7ff9a', '#4aa060'], ['#ff9ad0', '#9a3ad0'], ['#ff5a6e', '#9a1a3a']];
  function fakeEgg(tier, gold) {
    const w = 12 + tier, h = Math.round(w * 1.3);
    let s = egg(w, h, gold ? ['#ffe08a', '#c98a2a'] : PALS[tier], tier >= 1 || gold);
    if (tier >= 3 || gold) s += R(w - 3, 1, 1, 3, '#fff') + R(w - 4, 2, 3, 1, '#fff');
    if (tier >= 5 && !gold) s += R(w - 5, h - 6, 4, 4, '#ff5a6e') + R(w - 4, h - 5, 2, 2, '#fff');
    return `<svg class="px" viewBox="-1 -1 ${w + 2} ${h + 2}">${s}</svg>`;
  }
  function realEgg(warm, cold) {
    if (cold) return rects(ART.crackedEgg, PAL);
    const c = warm > 60 ? '#fff6dc' : warm > 35 ? '#ece6e6' : warm > 15 ? '#d4d6e4' : '#bcc4da';
    return rects(ART.realEgg, Object.assign({}, PAL, { c }));
  }
  function scene(lost, extra = '') {
    const has = k => LOSS.indexOf(k) >= lost;
    const W = 160, H = 92;
    const snow = !has('snow'), night = !has('night');
    const sky = night ? ['#141030', '#1b1442', '#241a52', '#2a1f5c'] :
      snow ? ['#5a6080', '#6a7090', '#7a809a', '#8a8fa8'] :
      !has('sun') ? ['#5a5a8a', '#6a6a9a', '#7a7aa8', '#8a8ab4'] : ['#6fb8e8', '#86c6ee', '#a0d4f2', '#c0e4f6'];
    let s = sky.map((c, i) => R(0, i * 18, W, 18, c)).join('');
    if (has('sun')) { s += R(130, 10, 10, 10, '#ffe08a') + R(128, 12, 14, 6, '#ffe08a') + R(132, 8, 6, 14, '#ffe08a') + R(132, 12, 6, 6, '#fff6dc'); }
    if (has('friends')) s += [[24, 14], [40, 22], [52, 12]].map(([x, y]) => R(x, y, 2, 1, '#2a1d3a') + R(x + 2, y + 1, 1, 1, '#2a1d3a') + R(x + 3, y, 2, 1, '#2a1d3a')).join('');
    const g1 = !has('grass') ? '#8a7a5a' : '#8fd4a8', g2 = !has('grass') ? '#6a5a3a' : '#3f7a5c';
    s += R(0, 76, W, 16, snow ? '#e8eef6' : g1) + R(0, 76, W, 2, snow ? '#ffffff' : g2);
    for (let x = 3; x < W; x += 7) s += R(x, 78 + (x % 3), 1, 2, snow ? '#c8d0e0' : g2);
    s += R(118, 34, 8, 42, '#5c3a28') + R(120, 34, 2, 42, '#8a5a3c') + R(96, 44, 24, 3, '#5c3a28');
    if (has('leaves')) {
      [[102, 18, 40, 18], [108, 10, 28, 10], [98, 28, 48, 12]].forEach(([x, y, w, h]) => { s += R(x, y, w, h, '#3f7a5c') + R(x + 3, y + 2, w - 10, 3, '#8fd4a8'); });
    } else if (snow) s += R(110, 32, 24, 2, '#ffffff') + R(96, 43, 24, 1, '#ffffff');
    if (has('mate')) s += `<g transform="translate(97,32)">${rects(ART.mate, PAL)}</g>`;
    if (has('flowers')) s += [[14, 72, '#ff6ba3'], [26, 70, '#f2c14e'], [142, 72, '#c78ff2'], [150, 70, '#ff6ba3']].map(([x, y, c]) => R(x, y + 2, 1, 4, '#3f7a5c') + R(x - 1, y, 3, 3, c) + R(x, y + 1, 1, 1, '#fff6dc')).join('');
    if (snow) { const rnd = (a => () => (a = a * 16807 % 2147483647) / 2147483647)(lost + 3); for (let i = 0; i < 40; i++) s += R(Math.floor(rnd() * W), Math.floor(rnd() * 76), 1, 1, '#ffffff'); }
    s += R(50, 70, 34, 7, '#8a5a3c') + R(48, 72, 38, 4, '#5c3a28');
    for (let x = 50; x < 84; x += 3) s += R(x, 70 + (x % 2), 2, 1, '#c9a070');
    return `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${s}${extra}</svg>`;
  }
  const birdOnNest = () => `<g transform="translate(60,58)">${rects(ART.bird, PAL)}</g>`;
  const eggInNest = (w, c) => `<g transform="translate(63,63)">${realEgg(w, c)}</g>`;
  // during play the bird is its own element, so the scene only draws the egg
  const nestExtra = () => eggInNest(st.warm, st.cold);

  /* ---------- screens ---------- */
  function intro() {
    gen++; clearInterval(loop); loop = null;
    st = null;
    const best = G.S.games.nest && G.S.games.nest.best;
    body.innerHTML = `<p class="gm-how">You are a bird. Shiny eggs will pop up. <b>Tap them fast</b> to build a combo, and don’t let any get away. Get the highest score you can.${best ? ` Your best: <b>${best}</b>.` : ''}</p>
      <p class="gm-how nest-quiet">Your own egg is in the nest. It stays warm while you sit on it. Tap the nest to fly home.</p>
      <div class="gm-stage">${scene(0, birdOnNest())}</div>
      <div class="btn-row"><button class="btn" data-go>▶ Play</button></div>`;
    body.querySelector('[data-go]').onclick = start;
  }

  function start() {
    gen++;
    const g = gen;
    st = { t: 0, score: 0, combo: 0, best: 0, last: -9, hits: 0, taps: 0, warm: START_WARM, cold: false, coldAt: 0,
      lost: 0, sitting: true, bx: SIT.x, eggs: [], nextSpawn: .4, id: 0, missed: 0, golds: 0 };
    body.innerHTML = `<div class="gm-stage nest-stage nest-live">
        <div class="nest-scene"></div>
        <div class="nest-layer"></div>
        <button class="nest-tap" aria-label="Warm your egg"></button>
        <div class="nest-bird sitting" style="left:${SIT.x}%;top:${SIT.y}%;width:${BW}%"><div class="nb-flip">${sprite(ART.bird, PAL)}</div></div>
        <div class="nest-timer"><i></i></div>
        <div class="nest-hud"><span class="nest-time">30s</span><span>SCORE <b class="num nest-score-n">0</b></span></div>
        <div class="nest-combo"><b></b><div class="nest-cbar"><i></i></div></div>
        <div class="nest-pops"></div>
      </div>`;
    const stage = body.querySelector('.nest-stage');
    stage.querySelector('.nest-tap').onpointerdown = e => { e.preventDefault(); brood(e); };
    stage.querySelector('.nest-layer').onpointerdown = e => {
      const b = e.target.closest('.nest-egg-btn'); if (!b) return;
      e.preventDefault(); hit(+b.dataset.id, e);
    };
    drawScene();
    let prev = performance.now();
    loop = setInterval(() => {
      if (g !== gen) return clearInterval(loop);
      const now = performance.now(), dt = Math.min(.1, (now - prev) / 1000); prev = now;
      tick(dt);
    }, 33);
  }

  function tier() { return Math.min(7, Math.floor(st.t / 3.6)); }
  function mult() { let m = TIERS[0]; for (const tr of TIERS) if (st.combo >= tr[0]) m = tr; return m; }
  const fever = () => st.combo >= 20;

  function tick(dt) {
    st.t += dt;
    // the real egg warms while you sit on it, and cools while you're away
    if (!st.cold) {
      st.warm = Math.min(100, st.warm + (st.sitting ? WARM_RATE : -DECAY) * dt);
      if (st.warm <= 0) { st.warm = 0; st.cold = true; st.coldAt = Math.ceil(st.t); drawScene(); }
      else if (Math.floor(st.warm / 20) !== st.warmBand) { st.warmBand = Math.floor(st.warm / 20); drawScene(); }
    }
    // spawn: faster over time, faster again in fever
    st.nextSpawn -= dt;
    const maxEggs = fever() ? 5 : 3 + Math.floor(st.t / 12);
    if (st.nextSpawn <= 0 && st.eggs.length < maxEggs) {
      spawn();
      st.nextSpawn = Math.max(.28, .85 - st.t * .018) * (fever() ? .6 : 1);
    }
    // eggs expire; a missed one breaks the combo
    const life = Math.max(.95, 1.9 - st.t * .03);
    st.eggs = st.eggs.filter(e => {
      if (st.t - e.born < life) return true;
      e.el.classList.add('gone'); setTimeout(() => e.el.remove(), 200);
      st.missed++;
      if (st.combo >= 3) { pop(e.x, e.y, 'combo lost', 'bad'); G.blip([260, 180], .06); }
      st.combo = 0;
      return false;
    });
    // the combo window drains
    if (st.combo && st.t - st.last > WINDOW) st.combo = 0;
    hud();
    if (st.t >= DUR) end();
  }

  function spawn() {
    const layer = body.querySelector('.nest-layer'); if (!layer) return;
    let x, y, tries = 0;
    do {
      x = 6 + Math.random() * 86; y = 6 + Math.random() * 58;
      tries++;
    } while (tries < 12 && ((x > 24 && x < 58 && y > 50) || st.eggs.some(e => Math.abs(e.x - x) < 11 && Math.abs(e.y - y) < 16)));
    const gold = st.t > 4 && Math.random() < .06;
    const tr = tier();
    const e = { id: ++st.id, x, y, born: st.t, gold };
    const b = document.createElement('button');
    b.className = 'nest-egg-btn' + (gold ? ' gold' : '') + (tr >= 6 ? ' buzz' : '');
    b.dataset.id = e.id;
    b.style.left = x + '%'; b.style.top = y + '%';
    b.style.width = (gold ? 46 : 30 + tr * 3.4) + 'px';
    b.setAttribute('aria-label', 'shiny egg');
    b.innerHTML = fakeEgg(gold ? 5 : tr, gold);
    e.el = b;
    layer.appendChild(b);
    st.eggs.push(e);
  }

  function hit(id, ev) {
    const e = st.eggs.find(x => x.id === id); if (!e) return;
    st.eggs = st.eggs.filter(x => x !== e);
    flyTo(e.x, e.y);
    e.el.classList.add('popped'); setTimeout(() => e.el.remove(), 220);
    const before = mult()[2];
    st.combo = st.t - st.last <= WINDOW || st.combo === 0 ? st.combo + 1 : 1;
    st.last = st.t;
    st.best = Math.max(st.best, st.combo);
    st.hits++;
    const m = mult();
    const pts = (e.gold ? 100 : 10) * m[1];
    if (e.gold) st.golds++;
    st.score += pts;
    pop(e.x, e.y, (e.gold ? 'JACKPOT +' : '+') + pts, e.gold ? 'gold' : m[1] >= 5 ? 'fever' : '');
    const p = Math.min(st.combo, 24);
    G.blip(e.gold ? [784, 1047, 1319, 1568] : [520 + p * 38, 780 + p * 38], .045);
    G.confetti(ev.clientX, ev.clientY, e.gold ? 30 : 6 + Math.min(st.combo, 20));
    if (m[2] && m[2] !== before) {
      pop(50, 30, m[2] + '!', m[1] >= 5 ? 'fever big' : 'big');
      G.blip([523, 659, 784, 1047, 1319], .06);
    }
    // every few fakes, the world quietly gets a little emptier
    const lost = Math.min(LOSS.length, Math.floor(st.hits / PER_LOSS));
    if (lost !== st.lost) {
      if (st.lost <= LOSS.indexOf('mate') && lost > LOSS.indexOf('mate')) mateFliesAway();
      if (st.lost <= LOSS.indexOf('friends') && lost > LOSS.indexOf('friends')) G.blip([1319, 988], .05);
      st.lost = lost; drawScene();
    }
  }

  // tap the nest: the bird flies home and sits on the egg until you chase another
  function brood() {
    if (st.cold) { pop(44, 62, 'too late', 'bad'); return; }
    if (st.sitting) return;
    st.sitting = true;
    st.taps++;
    st.combo = 0;            // the cost: no announcement, it just resets
    moveBird(SIT.x, SIT.y, true);
    pop(44, 58, '♥', 'warm');
    G.blip([392], .05);
  }
  // tap a fake egg: the bird leaves the nest and catches it
  function flyTo(x, y) {
    st.sitting = false;
    moveBird(x - BW / 2, y - BH / 2, false);
  }
  function moveBird(x, y, sit) {
    const b = body.querySelector('.nest-bird'); if (!b) return;
    b.classList.toggle('flip', x < st.bx - .5 ? true : x > st.bx + .5 ? false : b.classList.contains('flip'));
    st.bx = x;
    b.style.left = x + '%'; b.style.top = y + '%';
    b.classList.toggle('sitting', !!sit);
    b.classList.remove('catch'); void b.offsetWidth; if (!sit) b.classList.add('catch');
  }
  // the blue bird doesn't vanish, it leaves
  function mateFliesAway() {
    const stage = body.querySelector('.nest-stage'); if (!stage) return;
    const m = document.createElement('div');
    m.className = 'nest-mate-away';
    m.style.left = (97 / 160 * 100) + '%'; m.style.top = (32 / 92 * 100) + '%'; m.style.width = BW + '%';
    m.innerHTML = sprite(ART.mate, PAL);
    stage.appendChild(m);
    G.blip([880, 660, 440], .07);
    setTimeout(() => m.remove(), 2200);
  }

  function pop(x, y, txt, cls = '') {
    const box = body.querySelector('.nest-pops'); if (!box) return;
    const d = document.createElement('div');
    d.className = 'nest-pop ' + cls; d.textContent = txt;
    d.style.left = x + '%'; d.style.top = y + '%';
    box.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }

  function drawScene() {
    const sc = body.querySelector('.nest-scene'); if (!sc || !st) return;
    sc.innerHTML = scene(st.lost, nestExtra());
  }

  function hud() {
    const stage = body.querySelector('.nest-stage'); if (!stage) return;
    const left = Math.max(0, DUR - st.t);
    stage.querySelector('.nest-time').textContent = Math.ceil(left) + 's';
    const tb = stage.querySelector('.nest-timer i');
    tb.style.width = (100 * left / DUR) + '%';
    tb.parentNode.classList.toggle('low', left < 6);
    stage.querySelector('.nest-score-n').textContent = st.score;
    const m = mult(), c = stage.querySelector('.nest-combo');
    c.querySelector('b').textContent = st.combo > 1 ? `COMBO ${st.combo}${m[2] ? ' · ' + m[2] : ''}` : '';
    c.querySelector('i').style.width = st.combo > 1 ? Math.max(0, 100 * (1 - (st.t - st.last) / WINDOW)) + '%' : '0';
    c.classList.toggle('on', st.combo > 1);
    stage.classList.toggle('fever', fever());
  }

  function end() {
    clearInterval(loop); loop = null;
    const g = gen;
    const hatched = !st.cold;
    const prev = G.S.games.nest || {};
    const hi = st.score > (prev.best || 0);
    st.eggs.forEach(e => e.el.remove()); st.eggs = [];
    if (!st.cold) moveBird(SIT.x, SIT.y, true);
    const stage = body.querySelector('.nest-stage');
    stage.classList.remove('fever');
    stage.querySelector('.nest-combo').classList.remove('on');
    stage.insertAdjacentHTML('beforeend', `<div class="nest-score"><div>${hi ? 'NEW HIGH SCORE!' : 'FINAL SCORE'}</div><b class="num">${st.score}</b><div>best combo ${st.best}${st.golds ? ' · ' + st.golds + ' jackpot' + (st.golds > 1 ? 's' : '') : ''}</div></div>`);
    G.blip([523, 659, 784, 1047], .1);
    G.confettiAt(stage);
    // then the camera pulls back to the nest
    setTimeout(() => {
      if (g !== gen) return;
      const extra = hatched
        ? `<g transform="translate(60,58)">${rects(ART.bird, PAL)}</g><g transform="translate(84,66)"><g class="hatch">${rects(ART.chick, PAL)}</g></g>`
        : `<g transform="translate(63,63)">${rects(ART.crackedEgg, PAL)}</g>`;
      const lostThings = LOSS.slice(0, st.lost).map(k => LOST_NAME[k]);
      const lostLine = lostThings.length ? `While you chased them you lost ${lostThings.join(', ')}.` : 'You kept everything.';
      body.innerHTML = `<div class="gm-stage nest-stage nest-after">${scene(st.lost, extra)}</div>
        <div class="gm-out">${hatched
          ? `<p><b>Your egg hatched.</b> You tapped ${st.hits} shiny eggs for ${st.score} points, and you went back to the nest ${st.taps} times, for no points at all, breaking your combo every time. ${lostLine} The family will keep you company for the rest of the essay.</p>`
          : `<p><b>${st.score} points.</b> But look at the nest. Your own egg went cold ${st.coldAt} seconds in, and nothing told you. ${lostLine}</p>
             <p>The shiny eggs got the sounds, the combo, the confetti. Everything you lost went quietly.</p>`}
          <p>In the 1950s, Niko Tinbergen found that oystercatchers would abandon their own eggs to sit on giant plaster fakes, some too big to even climb onto. An instinct that says “bigger egg, better egg” can be beaten by a fake bigger than anything nature makes. That is a <b>supernormal stimulus</b>. Now look at your phone.</p></div>
        <div class="btn-row"><button class="btn" data-again>▶ Play again</button></div>`;
      body.querySelector('[data-again]').onclick = start;
      G.done('nest', { real: st.taps, fake: st.hits, best: Math.max(st.score, prev.best || 0), hatched: hatched || !!prev.hatched, lastHatched: hatched });
      if (hatched) G.startFlock(true);
      if (hatched && !prev.hatched) G.toast('<b>A chick!</b> The bird family will fly alongside you now. Look out for them in the sky.', 'xp', 5000);
    }, 2600);
  }

  intro();
};
