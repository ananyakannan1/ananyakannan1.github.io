/* MATCH THE HIJACK: a timed quiz on supernormal stimuli. Each vice is matched
   to the healthy system it hacks, with a combo multiplier and confetti. A wrong
   answer explains the hack. The last card is a trick. */

window.GAMES = window.GAMES || {};
window.GAMES.hijack = function (el, G) {
  // [vice, healthy system it hacks, the hack]
  const TABLE = [
    ['Porn', 'mate-seeking', 'Endless novel partners. It exploits the Coolidge effect: desire renews with each new partner.'],
    ['Gambling', 'learning from uncertain rewards', 'Random payouts. A variable-ratio reward is the most addictive schedule known, so you keep pulling.'],
    ['Video games', 'mastery and skill-building', 'Constant progress bars, levels and loot. Competence feedback, with no real-world skill gained.'],
    ['Junk food', 'calorie-seeking', 'Sugar, fat and salt combos tuned to a “bliss point” that doesn’t exist in nature.'],
    ['Social media', 'status and belonging', 'Likes are quantified social approval. Infinite scroll is novelty-foraging.'],
    ['Opioids', 'pain relief and social bonding', 'Your body’s own opioid system soothes physical and social pain, like loneliness. The drugs hijack both.'],
    ['Alcohol', 'feeling safe with your group', 'It chemically fakes the relaxed safety of being among people you trust.'],
    ['Nicotine and caffeine', 'alertness and focus', 'An on-demand attention boost, then withdrawal makes your baseline feel worse.'],
    ['Shopping', 'gathering resources and status', 'The thrill is in the getting, not the having. Hence buyer’s remorse.'],
    ['Doomscrolling and true crime', 'threat vigilance', 'Your brain prioritizes danger. The media supplies endless threats you can’t act on.']
  ];
  const ROUNDS = 7, TIME = 10;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function makeQuiz() {
    const qs = shuffle(TABLE).slice(0, ROUNDS).map(([vice, sys, why]) => {
      const others = shuffle(TABLE.filter(r => r[1] !== sys)).slice(0, 3).map(r => r[1]);
      return { q: `<b>${vice}</b> hacks which healthy system?`, a: sys, opts: shuffle([sys, ...others]), why };
    });
    qs.push({ q: '<b>Education</b> could hack which drive?', a: '*', opts: ['mastery', 'curiosity', 'belonging', 'all of the above'], trick: true });
    return qs;
  }
  const body = G.shell(el, 'Match the Hijack', 'quiz · combo x1', '#c78ff2', () => { clearInterval(timer); intro(); });
  const sub = el.querySelector('.gm-sub');
  let Q, i, score, combo, best, right, timer, left;

  function intro() {
    sub.textContent = 'quiz · combo x1';
    body.innerHTML = `<p class="gm-how">Every vice is a <b>supernormal stimulus</b>: it takes a healthy system that kept your ancestors alive and feeds it something bigger than nature ever made. Match each vice to the system it hijacks. ${ROUNDS + 1} questions. Answer fast for a time bonus, and chain right answers for a combo.</p>
      <div class="btn-row"><button class="btn" data-go>Start quiz</button></div>`;
    body.querySelector('[data-go]').onclick = () => { Q = makeQuiz(); i = 0; score = 0; combo = 0; best = 0; right = 0; ask(); };
  }

  function ask() {
    const q = Q[i];
    left = TIME;
    sub.textContent = `quiz · combo x${Math.max(1, combo)}`;
    body.innerHTML = `<div class="hj-top"><span>Q${i + 1}/${Q.length}</span><span>SCORE <b class="num">${score}</b></span>${combo > 1 ? `<span class="hj-combo">COMBO x${combo}</span>` : ''}</div>
      <div class="bar hj-time"><div class="bar-fill" style="width:100%"></div></div>
      <div class="hj-q">${q.q}</div>
      <div class="hj-opts">${q.opts.map(o => `<button class="hj-opt" data-o="${o}">${o}</button>`).join('')}</div>
      <div class="hj-fb"></div>`;
    body.querySelectorAll('.hj-opt').forEach(b => b.onclick = e => answer(b, e));
    clearInterval(timer);
    timer = setInterval(() => {
      left -= .1;
      const f = body.querySelector('.hj-time .bar-fill'); if (f) f.style.width = Math.max(0, left / TIME * 100) + '%';
      if (left <= 0) answer(null);
    }, 100);
  }

  function answer(b, e) {
    clearInterval(timer);
    const q = Q[i];
    body.querySelectorAll('.hj-opt').forEach(x => { x.disabled = true; if (x.dataset.o === q.a) x.classList.add('right'); });
    const fb = body.querySelector('.hj-fb');
    if (q.trick) {
      if (b) b.classList.add('right');
      combo++; best = Math.max(best, combo); right++;
      score += 100 * combo;
      G.blip([523, 659, 784, 1047], .08);
      if (e) G.confetti(e.clientX, e.clientY, 40);
      fb.innerHTML = `<p><b>Trick question.</b> Every answer counts, because the honest answer is “whichever one you design it to.” Education can hijack mastery, curiosity and belonging, the same drives games do. This essay has been doing it to you for the last ten minutes.</p>
        <div class="btn-row"><button class="btn" data-next>See your score</button></div>`;
    } else if (b && b.dataset.o === q.a) {
      combo++; best = Math.max(best, combo); right++;
      const pts = 100 * combo + Math.round(left * 10);
      score += pts;
      b.classList.add('right');
      G.blip([660 + combo * 80, 990 + combo * 80], .06);
      if (e) G.confetti(e.clientX, e.clientY, 10 + combo * 5);
      fb.innerHTML = `<div class="hj-pts">+${pts}${combo > 1 ? ` · COMBO x${combo}!` : ''}</div><p class="hj-quote">${q.why}</p>`;
      setTimeout(next, 2200);
      return;
    } else {
      combo = 0;
      if (b) b.classList.add('wrong');
      G.blip([220, 160], .09);
      fb.innerHTML = `<p class="hj-quote">${b ? 'Not quite.' : 'Time’s up.'} It hacks <b>${q.a}</b>. ${q.why}</p>
        <div class="btn-row"><button class="btn" data-next>Next</button></div>`;
    }
    fb.querySelector('[data-next]').onclick = next;
  }

  function next() { if (!Q || i >= Q.length) return; i++; i < Q.length ? ask() : end(); }

  function end() {
    sub.textContent = 'quiz · complete';
    body.innerHTML = `<div class="hj-end"><div>FINAL SCORE</div><b class="num">${score}</b><div>${right}/${Q.length} right · best combo x${best}</div></div>
      <p class="gm-out">Notice the pattern. Every one of these takes an instinct that once kept us alive and hands it something bigger than nature ever offered. Tinbergen’s birds sat on plaster eggs; we sit on our phones. The open question is whether we can build one that hijacks curiosity and mastery <i>for</i> us.</p>
      <div class="btn-row"><button class="btn alt" data-again>Play again</button></div>`;
    body.querySelector('[data-again]').onclick = intro;
    G.confettiAt(body.querySelector('.hj-end'));
    G.done('hijack', { score, right });
  }

  intro();
};
