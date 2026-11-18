/* TEACHER SIMULATOR: thirty students at five different levels, one pace
   slider, and phones. A student learns fully when the lesson matches their
   level, half when it is one off, and not at all otherwise or while on their
   phone. Tap a student to take their phone away; every confiscation makes the
   phones grabbier. One pace tops out at 40% even with no phones at all.

   ARCADE MODE (the Konami code): every student gets their own game at their
   own level. Your job changes from lecturing to coaching. When a student is
   ready to level up a gold "!" pops over them; tap them fast to level them up
   and build a combo. Miss it and they get stuck, which breaks your combo.
   It speeds up as it goes. Get a student to the top level and they master it. */

window.GAMES = window.GAMES || {};
window.GAMES.teacher = function (el, G) {
  const N = 30, COLS = 6, LESSON = 40, TICK = 250, ARCADE_T = 35;
  const SHIRT = ['#ff6ba3', '#f2c14e', '#8fd4a8', '#7fb3f2', '#c78ff2'];
  const HAIR = ['#4a3226', '#2a1d3a', '#c98a2a', '#8a5a3c', '#b8477a', '#1a1526'];
  const LEVEL = ['counting', 'adding', 'times tables', 'fractions', 'algebra'];
  const body = G.shell(el, 'Teacher Simulator', '30 students · 1 of you', '#7fb3f2', () => restart());
  let kids, pace, t, grab, run = null, arcade = false, learnSum, samples;
  // arcade state
  let score, combo, bestCombo, ups, mastered, pops;

  function reset() {
    const lv = []; for (let i = 0; i < N; i++) lv.push(i % 5);
    for (let i = lv.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lv[i], lv[j]] = [lv[j], lv[i]]; }
    // in arcade everybody starts low, so there's room to climb
    kids = lv.map((l, i) => ({ l: arcade ? Math.min(l, 2) : l, phone: false, hair: HAIR[i % HAIR.length], p: Math.random() * .6, ready: 0, stuck: false, done: false, flash: 0 }));
    pace = 2; t = 0; grab = 0; learnSum = 0; samples = 0;
    score = 0; combo = 0; bestCombo = 0; ups = 0; mastered = 0; pops = [];
  }
  function restart() { clearInterval(run); run = null; reset(); screen(true); }

  function mood(k) {
    if (k.phone) return 'phone';
    if (arcade) return k.stuck ? 'lost' : 'learn';
    const d = pace - k.l;
    return d === 0 ? 'learn' : Math.abs(d) === 1 ? 'half' : d > 0 ? 'lost' : 'bored';
  }
  function classLearning() {
    let s = 0;
    kids.forEach(k => { const m = mood(k); s += m === 'learn' ? 1 : m === 'half' ? .5 : 0; });
    return s / N;
  }

  function sceneSvg() {
    const W = 160, H = 104;
    let s = R(0, 0, W, H, arcade ? '#1a1030' : '#d9c39a') + R(0, 0, W, 30, arcade ? '#241a52' : '#c9b08a');
    if (!arcade) for (let x = 0; x < W; x += 10) s += R(x, 30, 1, 74, '#cdb68c');
    else for (let x = 0; x < W; x += 8) s += R(x, 30, 1, 74, '#211744');
    // chalkboard, or a scoreboard in arcade
    s += R(30, 3, 100, 22, arcade ? '#ff6ba3' : '#5c3a28') + R(32, 5, 96, 18, arcade ? '#110c28' : '#2f5248');
    s += `<text x="80" y="13" text-anchor="middle" class="tc-board">${arcade ? (combo > 1 ? 'COMBO x' + combo : 'ARCADE MODE') : 'TODAY: ' + LEVEL[pace].toUpperCase()}</text>`;
    s += `<text x="80" y="20" text-anchor="middle" class="tc-board small">${arcade ? 'tap the ! to level them up' : 'level ' + (pace + 1) + ' of 5'}</text>`;
    // teacher
    s += `<g transform="translate(14,10)">${rects(ART.avatar, PAL)}</g>` + R(12, 17, 11, 1, '#5c3a28');
    kids.forEach((k, i) => {
      const x = 14 + (i % COLS) * 23, y = 36 + Math.floor(i / COLS) * 13;
      const m = mood(k);
      const pal = Object.assign({}, PAL, { S: SHIRT[k.l], h: k.hair });
      s += `<g class="tc-kid${arcade && (k.ready || k.stuck) ? ' hot' : ''}" data-i="${i}">${R(x - 3, y - 9, 16, 19, 'transparent')}`;
      s += `<g transform="translate(${x},${y})">${rects(ART.student, pal)}</g>`;
      s += R(x - 2, y + 8, 12, 3, arcade ? '#473c8c' : '#9c7a52');
      if (arcade) {
        // their own little screen: a progress bar toward the next level
        s += R(x - 1, y + 8, 10, 3, '#0f0b24') + R(x, y + 9, Math.round(8 * Math.min(1, k.p)), 1, k.done ? '#f2c14e' : SHIRT[Math.min(4, k.l + 1)]);
        if (k.done) s += `<g transform="translate(${x + 1},${y - 8}) scale(.6)">${rects(ART.star, PAL)}</g>`;
        else if (k.ready) s += R(x + 1, y - 9, 6, 7, k.ready < 1.2 ? '#ff5a6e' : '#f2c14e') + `<text x="${x + 4}" y="${y - 3.2}" text-anchor="middle" class="tc-bang">!</text>`;
        else if (k.stuck) s += `<text x="${x + 4}" y="${y - 1}" class="tc-q">?</text>`;
        if (k.flash > 0) s += R(x - 3, y - 2, 14, 12, 'rgba(255,224,138,.45)');
      } else {
        if (m === 'phone') s += `<g transform="translate(${x + 9},${y + 2})">${rects(ART.phone, PAL)}</g>` + R(x + 9, y - 2, 3, 3, '#ff5a6e');
        if (m === 'lost') s += `<text x="${x + 4}" y="${y - 1}" class="tc-q">?</text>`;
        if (m === 'bored') s += `<text x="${x + 4}" y="${y - 1}" class="tc-z">z</text>`;
        if (m === 'learn') s += R(x + 3, y - 4, 2, 2, '#8fd4a8');
      }
      s += `</g>`;
    });
    pops.forEach(p => s += `<text x="${p.x}" y="${p.y - (1 - p.life) * 8}" text-anchor="middle" class="tc-pop" opacity="${Math.min(1, p.life * 2)}">${p.txt}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${s}</svg>`;
  }

  function hud() {
    if (arcade) {
      return `<div class="tc-meters">
        <div><span>SCORE</span><b class="num" style="color:var(--gold)">${score}</b></div>
        <div><span>COMBO</span><b class="num" style="color:var(--accent)">x${Math.max(1, combo)}</b></div>
        <div><span>LEVEL-UPS</span><b class="num" style="color:var(--green)">${ups}</b></div>
        <div><span>TIME</span><b class="num">${Math.max(0, Math.ceil(ARCADE_T - t))}s</b></div>
      </div>`;
    }
    const live = Math.round(classLearning() * 100);
    const avg = samples ? Math.round(100 * learnSum / samples) : 0;
    const phones = kids.filter(k => k.phone).length;
    return `<div class="tc-meters">
      <div><span>LEARNING NOW</span><b class="num">${live}%</b><div class="bar"><div class="bar-fill" style="width:${live}%;background:var(--green)"></div></div></div>
      <div><span>LESSON AVERAGE</span><b class="num">${avg}%</b></div>
      <div><span>PHONES OUT</span><b class="num" style="color:var(--red)">${phones}</b></div>
      <div><span>TIME</span><b class="num">${Math.max(0, Math.ceil(LESSON - t))}s</b></div>
    </div>`;
  }

  function draw() {
    const st = body.querySelector('.tc-stage'); if (!st) return;
    st.innerHTML = sceneSvg();
    body.querySelector('.tc-hud').innerHTML = hud();
  }

  function screen(start) {
    const best = G.S.games.teacher && G.S.games.teacher.arcadeBest;
    body.innerHTML = `<p class="gm-how">${arcade
      ? `<b>Arcade mode:</b> the cheat code gave every student their own game, at their own level. You’re not lecturing any more, you’re coaching. When a gold <b>!</b> pops up over a student, tap them to level them up. Chain them fast for a combo. Too slow and they get stuck.${best ? ` Your best: <b>${best}</b>.` : ''}`
      : 'Teach the class. Set the lesson level with the slider. Tap a student to take their phone away. The coloured shirts are their levels.'}</p>
      <div class="gm-stage tc-stage${arcade ? ' arcade' : ''}"></div>
      <div class="tc-hud"></div>
      <div class="tc-controls">${arcade ? '' : `<label class="tc-pace">LESSON LEVEL <input type="range" min="0" max="4" step="1" value="${pace}"><span class="tc-lv"></span></label>`}
        <div class="btn-row" style="margin:0">${start ? `<button class="btn" data-start>${arcade ? '▶ Start arcade' : 'Start the lesson'}</button>` : ''}</div></div>
      ${arcade ? '' : `<div class="tc-arcade">🔒 <span><b>Arcade mode is locked.</b> It gives every student their own game at their own level. A cheat code unlocks it, and one of the notifications in this essay knows the code.</span>${G.S.eggs.konami ? '<button class="btn" data-arcade>Play arcade</button>' : G.S.badges[3] ? '<button class="btn alt" data-code>Enter code</button>' : ''}</div>`}
      <div class="gm-out tc-out"></div>`;
    const code = body.querySelector('[data-code]');
    if (code) code.onclick = () => G.openDpad();
    const arc = body.querySelector('[data-arcade]');
    if (arc) arc.onclick = () => { clearInterval(run); arcade = true; reset(); screen(true); };
    const range = body.querySelector('input[type=range]');
    const lv = body.querySelector('.tc-lv');
    const show = () => { if (lv) lv.innerHTML = SHIRT.map((c, i) => `<i style="background:${c};outline:${i === pace ? '2px solid #fff' : 'none'}"></i>`).join(''); };
    if (range) range.oninput = () => { pace = +range.value; show(); draw(); };
    show();
    body.querySelector('.tc-stage').onpointerdown = e => {
      const g = e.target.closest('.tc-kid'); if (!g) return;
      const k = kids[+g.dataset.i];
      if (arcade) return tapArcade(k, +g.dataset.i);
      if (k.phone) { k.phone = false; grab += .006; G.blip([330, 220], .05); draw(); }
    };
    const sb = body.querySelector('[data-start]');
    if (sb) sb.onclick = () => { sb.remove(); arcade ? goArcade() : go(); };
    draw();
  }

  /* ---------- normal mode ---------- */
  function go() {
    clearInterval(run);
    t = 0; learnSum = 0; samples = 0;
    run = setInterval(() => {
      t += TICK / 1000;
      kids.forEach(k => {
        if (k.phone) return;
        const m = mood(k);
        const p = (.006 + .0012 * t + grab) * (m === 'learn' ? .6 : m === 'half' ? 1 : 2.2);
        if (Math.random() < p) k.phone = true;
      });
      learnSum += classLearning(); samples++;
      draw();
      if (t >= LESSON) finish();
    }, TICK);
  }

  function finish() {
    clearInterval(run); run = null;
    const avg = Math.round(100 * learnSum / samples);
    const out = body.querySelector('.tc-out');
    out.innerHTML = `<p>Lesson over. The class averaged <b>${avg}%</b> learning.</p>
      <p>Here’s the thing: with one pace for thirty kids, the best you can ever do is <b>40%</b>. That’s with your level matched to the middle, and with zero phones. Whatever level you pick, most of the room is bored or lost, and bored or lost kids reach for their phones. Every phone you confiscated made the rest grabbier.</p>
      <p>Now imagine giving each kid their own game.</p>
      <div class="btn-row"><button class="btn alt" data-again>Teach again</button></div>`;
    out.querySelector('[data-again]').onclick = restart;
    G.done('teacher', { best: Math.max(avg, (G.S.games.teacher && G.S.games.teacher.best) || 0) });
  }

  /* ---------- arcade mode ---------- */
  const FAST = 30;  // ticks per second in arcade, for smooth bars
  function goArcade() {
    clearInterval(run);
    t = 0;
    run = setInterval(() => {
      const dt = 1 / FAST;
      t += dt;
      const speed = 1 + t / 14;                 // it gets faster
      const win = Math.max(1.1, 2.6 - t / 20); // and the ! stays up for less time
      kids.forEach(k => {
        if (k.flash > 0) k.flash -= dt * 3;
        if (k.done || k.stuck) return;
        if (k.ready) {
          k.ready -= dt;
          if (k.ready <= 0) { k.ready = 0; k.stuck = true; if (combo > 1) G.blip([300, 200], .06); combo = 0; }
          return;
        }
        k.p += dt * speed * (.09 + Math.random() * .08);
        if (k.p >= 1) { k.p = 1; k.ready = win; }
      });
      pops.forEach(p => p.life -= dt * 1.4);
      pops = pops.filter(p => p.life > 0);
      draw();
      if (t >= ARCADE_T) finishArcade();
    }, 1000 / FAST);
  }

  function tapArcade(k, i) {
    if (!run || k.done) return;
    const x = 18 + (i % COLS) * 23, y = 30 + Math.floor(i / COLS) * 13;
    if (k.ready) {
      combo++; bestCombo = Math.max(bestCombo, combo);
      const pts = 10 * Math.min(combo, 10);
      score += pts;
      levelUp(k);
      pops.push({ x, y, txt: '+' + pts, life: 1 });
      G.blip([523 + Math.min(combo, 12) * 50, 784 + Math.min(combo, 12) * 50], .05);
      if (combo > 0 && combo % 5 === 0) {
        const r = el.querySelector('.tc-stage').getBoundingClientRect();
        G.confetti(r.left + r.width / 2, r.top + 30, 16 + combo);
        pops.push({ x: 80, y: 32, txt: 'COMBO x' + combo + '!', life: 1.2 });
      }
    } else if (k.stuck) {
      // unsticking helps them, but costs you the combo bonus
      score += 5;
      levelUp(k);
      pops.push({ x, y, txt: '+5', life: 1 });
      G.blip([440], .05);
    } else return;
    draw();
  }
  function levelUp(k) {
    k.ready = 0; k.stuck = false; k.p = 0; k.flash = 1; ups++;
    if (k.l >= 4) { k.done = true; mastered++; score += 50; G.blip([784, 1047, 1319], .06); }
    else k.l++;
  }

  function finishArcade() {
    clearInterval(run); run = null;
    const prevBest = (G.S.games.teacher && G.S.games.teacher.arcadeBest) || 0;
    const hi = score > prevBest;
    const out = body.querySelector('.tc-out');
    const r = el.querySelector('.tc-stage').getBoundingClientRect();
    G.confetti(r.left + r.width / 2, r.top + r.height / 2, 50);
    G.blip([523, 659, 784, 1047], .1);
    out.innerHTML = `<div class="hj-end"><div>${hi ? 'NEW HIGH SCORE!' : 'FINAL SCORE'}</div><b class="num">${score}</b><div>${ups} level-ups · ${mastered} mastered algebra · best combo x${bestCombo}</div></div>
      <p>Same thirty kids, same teacher. But nobody sat bored or lost, because everybody was working at their own level, and nobody reached for a phone. You stopped lecturing and started coaching, and the class climbed <b>${ups}</b> levels in ${ARCADE_T} seconds.</p>
      <p>That’s the cheat code. It’s also the pitch for gamified learning.</p>
      <div class="btn-row"><button class="btn" data-again>▶ Play arcade again</button><button class="btn alt" data-normal>Back to normal mode</button></div>`;
    out.querySelector('[data-again]').onclick = () => { reset(); screen(true); };
    out.querySelector('[data-normal]').onclick = () => { arcade = false; restart(); };
    G.done('teacher', { arcade: score, arcadeBest: Math.max(score, prevBest) });
  }

  document.addEventListener('konami', () => {
    clearInterval(run);
    arcade = true; reset(); screen(true);
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    G.toast('<b>ARCADE MODE UNLOCKED</b> tap the gold ! to level kids up', 'xp', 4000);
  });

  reset(); screen(true);
};
