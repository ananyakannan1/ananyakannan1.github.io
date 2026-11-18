/* FLASHCARDS vs SPELLBOOK. Version A puts rewards on top of the learning:
   answer a vocab card, get coins. Version B bakes the learning into the
   mechanic: type a word to cast, and the rarer the word, the bigger the spell.
   Each word works once. And one word breaks the game entirely: GOODHART. */

window.GAMES = window.GAMES || {};
window.GAMES.spellbook = function (el, G) {
  const CARDS = [
    ['ephemeral', 'lasting a very short time', ['found everywhere', 'lasting a very short time', 'easily angered', 'very old']],
    ['ubiquitous', 'found everywhere', ['found everywhere', 'impossible to see', 'extremely loud', 'rare']],
    ['laconic', 'using very few words', ['very talkative', 'lazy', 'using very few words', 'made of milk']],
    ['quixotic', 'idealistic to an impractical degree', ['fast', 'idealistic to an impractical degree', 'quietly sad', 'easily fooled']],
    ['obfuscate', 'to make something unclear', ['to make something unclear', 'to explain clearly', 'to overeat', 'to delay']]
  ];
  const TIERS = {
    rare: [25, 'ephemeral ubiquitous eloquent meticulous resilient ambiguous benevolent candid diligent elusive empathy frugal gregarious immaculate inevitable lucid nostalgia obscure pragmatic profound serene tenacious vivid whimsical zealous ambivalent catalyst cynical nuance paradox solace tangible verbose wistful entropy milieu incentive intrinsic extrinsic novelty metric feedback curious literacy mastery'],
    arcane: [45, 'perspicacious obfuscate quixotic sycophant ineffable mellifluous petrichor serendipity ebullient laconic loquacious magnanimous obsequious pernicious recalcitrant sanguine vicissitude equanimity inexorable insouciant juxtaposition lugubrious nefarious onomatopoeia panacea parsimonious pusillanimous querulous sagacious solipsism teleological sisyphean neuroplastic dopaminergic supernormal verisimilitude epistemology hegemony zeitgeist schadenfreude defenestration'],
    legendary: [120, 'sesquipedalian antidisestablishmentarianism floccinaucinihilipilification pneumonoultramicroscopicsilicovolcanoconiosis honorificabilitudinitatibus hippopotomonstrosesquippedaliophobia supercalifragilisticexpialidocious pulchritudinous grandiloquent prestidigitation']
  };
  const TIER_OF = {};
  for (const [t, [, words]] of Object.entries(TIERS)) words.split(' ').forEach(w => TIER_OF[w] = t);
  const HP = 200;
  let gen = 0;
  const body = G.shell(el, 'Flashcards vs. Spellbook', 'two games, one skill', '#6fd3e8', () => intro());
  const sub = el.querySelector('.gm-sub');
  let coins, ci, hp, used, casts;

  /* ---------- A: flashcards with coins on top ---------- */
  function flash() {
    gen++;
    coins = 0; ci = 0;
    sub.textContent = 'version A · flashcards';
    card();
  }
  function card() {
    const [w, def, opts] = CARDS[ci];
    body.innerHTML = `<div class="sb-tabs"><span class="on">A · FLASHCARDS</span><span>B · SPELLBOOK</span></div>
      <div class="sb-part">PART 1 OF 2 · THE USUAL VERSION: pick the right meaning, earn coins</div>
      <div class="sb-flash">
        <div class="sb-coins">${coinSvg()} <b class="num">${coins}</b> coins</div>
        <div class="sb-card"><div class="sb-cn">card ${ci + 1} of ${CARDS.length}</div><div class="sb-word">${w}</div></div>
        <div class="hj-opts">${opts.map(o => `<button class="hj-opt" data-o="${o}">${o}</button>`).join('')}</div>
      </div>`;
    body.querySelectorAll('.hj-opt').forEach(b => b.onclick = e => {
      body.querySelectorAll('.hj-opt').forEach(x => { x.disabled = true; if (x.dataset.o === def) x.classList.add('right'); });
      if (b.dataset.o === def) { coins += 10; G.blip([988, 1319], .05); G.confetti(e.clientX, e.clientY, 8); }
      else { b.classList.add('wrong'); G.blip([220], .08); }
      const g = gen;
      setTimeout(() => { if (g !== gen) return; ci++; ci < CARDS.length ? card() : flashEnd(); }, 700);
    });
  }
  function flashEnd() {
    body.innerHTML = `<div class="sb-tabs"><span class="on">A · FLASHCARDS</span><span>B · SPELLBOOK</span></div>
      <div class="sb-done"><div>${coinSvg()} <b class="num">${coins}</b> coins</div></div>
      <p class="gm-out">You earned ${coins} coins. Coins buy nothing. The words were the chore and the coins were the bribe. This is how most ed-tech works.</p>
      <div class="btn-row"><button class="btn" data-b>Now try version B →</button></div>`;
    body.querySelector('[data-b]').onclick = spell;
  }
  function coinSvg() { return `<svg class="px" viewBox="0 0 6 6" style="width:16px;display:inline;vertical-align:-2px">${R(1, 0, 4, 6, '#f2c14e')}${R(0, 1, 6, 4, '#f2c14e')}${R(2, 1, 2, 4, '#ffe08a')}</svg>`; }

  /* ---------- B: the spellbook ---------- */
  function spell() {
    gen++;
    hp = HP; used = new Set(); casts = [];
    sub.textContent = 'version B · spellbook';
    body.innerHTML = `<div class="sb-tabs"><span>A · FLASHCARDS</span><span class="on">B · SPELLBOOK</span></div>
      <div class="sb-part">PART 2 OF 2 · THE GOOD VERSION</div>
      <ol class="sb-steps">
        <li>Type any word in the box below and press <b>Cast</b>.</li>
        <li>The rarer the word, the harder it hits. Each word works once.</li>
        <li>Knock the slime’s health down to zero to win.</li>
      </ol>
      <div class="sb-rules">
        <div><b style="color:var(--blue)">3–14</b>everyday words</div>
        <div><b style="color:var(--green)">25</b>rare words</div>
        <div><b style="color:var(--violet)">45</b>arcane words</div>
        <div><b style="color:var(--gold)">120</b>legendary words</div>
      </div>
      <div class="sb-hp"><span>SLIME OF BOREDOM</span><div class="bar"><div class="bar-fill"></div></div><span class="num sb-hpn">${hp}/${HP}</span></div>
      <div class="gm-stage sb-stage">
        <svg viewBox="0 0 160 64" shape-rendering="crispEdges">${R(0, 0, 160, 64, '#1b1442')}${R(0, 50, 160, 14, '#2f5248')}${R(0, 50, 160, 2, '#3f7a5c')}
          <g transform="translate(18,34) scale(1.6)">${rects(ART.wizard, PAL)}</g>
          <g class="sb-slime" transform="translate(98,22) scale(2)">${rects(ART.slime, PAL)}</g></svg>
        <div class="sb-bolt"></div><div class="sb-dmg"></div>
      </div>
      <form class="sb-cast"><input class="namebox" maxlength="50" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type a word…" aria-label="Spell word"><button class="btn">Cast</button></form>
      <div class="sb-try">Stuck? Tap one to try:${['ephemeral', 'serendipity', 'quixotic', 'perspicacious'].map(w => `<button data-try="${w}">${w}</button>`).join('')}</div>
      <div class="sb-log"></div>`;
    body.querySelectorAll('[data-try]').forEach(b => b.onclick = () => { cast(b.dataset.try); b.disabled = true; });
    hpBar();
    const f = body.querySelector('.sb-cast'), inp = f.querySelector('input');
    f.onsubmit = e => { e.preventDefault(); cast(inp.value); inp.value = ''; inp.focus(); };
  }
  function hpBar() {
    body.querySelector('.sb-hp .bar-fill').style.width = Math.max(0, hp / HP * 100) + '%';
    body.querySelector('.sb-hpn').textContent = Math.max(0, hp) + '/' + HP;
  }
  function wordy(w) { return /[aeiouy]/.test(w) && !/[^aeiouy]{5,}/.test(w); }
  function cast(raw) {
    const w = raw.toLowerCase().replace(/[^a-z]/g, '');
    if (!w || hp <= 0) return;
    const log = body.querySelector('.sb-log');
    let dmg, label;
    if (w === 'goodhart') { dmg = 9999; label = 'EXPLOIT'; }
    else if (used.has(w)) { return note(`<i>${w}</i> fizzles. You already used it.`); }
    else if (TIER_OF[w]) { const t = TIER_OF[w]; dmg = TIERS[t][0] + Math.floor(Math.random() * 6); label = t; }
    else if (w.length < 3 || !wordy(w)) { return note(`<i>${w}</i> fizzles. That doesn’t look like a word.`); }
    else { dmg = w.length <= 4 ? 3 : w.length <= 6 ? 6 : w.length <= 8 ? 10 : 14; label = 'common'; }
    used.add(w); casts.push([w, label, dmg]);
    hp -= dmg;
    const g = gen;
    // the bolt, the hit, the number
    const bolt = body.querySelector('.sb-bolt'), num = body.querySelector('.sb-dmg'), sl = body.querySelector('.sb-slime');
    bolt.className = 'sb-bolt go ' + label; void bolt.offsetWidth;
    setTimeout(() => {
      if (g !== gen) return;
      num.className = 'sb-dmg ' + label; num.textContent = (dmg > 999 ? '∞' : '-' + dmg) + (label !== 'common' ? ' ' + label.toUpperCase() : '');
      void num.offsetWidth; num.classList.add('pop');
      sl.classList.add('hit'); setTimeout(() => sl.classList.remove('hit'), 250);
      G.blip(label === 'common' ? [330] : label === 'rare' ? [523, 784] : label === 'arcane' ? [523, 784, 1047] : [392, 523, 784, 1047, 1319], .06);
      hpBar();
      log.insertAdjacentHTML('afterbegin', `<div><i>${w}</i> · ${label} · ${dmg > 999 ? '∞' : dmg}</div>`);
      if (w === 'goodhart') exploit();
      else if (hp <= 0) win();
    }, 380);
  }
  function note(html) { body.querySelector('.sb-log').insertAdjacentHTML('afterbegin', `<div class="sb-fizz">${html}</div>`); }

  function exploit() {
    const first = !G.S.eggs.goodhart;
    G.S.eggs.goodhart = 1;
    if (first) { G.award('egg:goodhart', 75, 'EXPLOITER'); G.stamp('goodhart'); }
    G.confetti(innerWidth / 2, innerHeight / 2, 70);
    setTimeout(() => {
      G.modal(`<h3>Achievement: Exploiter</h3>
        <p>You found the one word that one-shots the boss, and you used it. You beat the game. You also learned no vocabulary at all doing it.</p>
        <p>That’s <b>Goodhart’s law</b>: when a measure becomes a target, it ceases to be a good measure. Kids in a real spell game would do exactly this. They’d memorize the five most powerful words instead of building a vocabulary.</p>
        <div class="btn-row"><button class="btn" data-close>Guilty</button></div>`);
      win(true);
    }, 700);
  }

  function win(cheated) {
    const f = body.querySelector('.sb-cast'); if (f) f.remove();
    const tr = body.querySelector('.sb-try'); if (tr) tr.remove();
    const real = casts.filter(c => c[0] !== 'goodhart');
    const out = document.createElement('div');
    out.innerHTML = `<p class="gm-out">${cheated ? 'Slime defeated, by exploit.' : `<b>Slime defeated</b> with ${real.length} words.`}
      ${real.length ? ` You cast: ${real.map(c => `<i>${c[0]}</i>`).join(', ')}.` : ''} Nobody bribed you to use those words. Using them <i>was</i> the game.</p>
      <p class="gm-out">So which one would you keep playing?</p>
      <div class="btn-row"><button class="btn alt" data-v="flashcards">Flashcards for coins</button><button class="btn" data-v="spellbook">The spellbook</button></div>`;
    body.querySelector('.sb-log').before(out);
    out.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      out.querySelectorAll('[data-v]').forEach(x => x.disabled = true);
      out.insertAdjacentHTML('beforeend', `<p class="gm-out">${v === 'spellbook'
        ? 'Same words, no bribe. When the learning <i>is</i> the mechanic, the game doesn’t need coins. That’s the whole design principle.'
        : 'Honest, at least. Coins are easy to want. But nobody has ever stayed up late for flashcard coins.'}</p>
        <div class="btn-row"><button class="btn alt" data-again>Play again</button><button class="btn alt" data-spell>Just the spellbook</button></div>`);
      out.querySelector('[data-again]').onclick = flash;
      out.querySelector('[data-spell]').onclick = spell;
      G.done('spellbook', { vote: v, words: real.length });
    });
  }

  function intro() {
    gen++;
    sub.textContent = 'two games, one skill';
    body.innerHTML = `<p class="gm-how">Two ways to gamify the same vocabulary.</p>
      <ol class="sb-steps">
        <li><b>Flashcards:</b> answer 5 vocab cards, earn coins. Rewards stuck on top of the learning. (30 seconds)</li>
        <li><b>Spellbook:</b> type words to cast spells at a slime. The vocabulary <i>is</i> the weapon.</li>
        <li>Then pick the one you’d actually come back to.</li>
      </ol>
      <div class="btn-row"><button class="btn" data-a>Start with flashcards</button><button class="btn alt" data-b>Skip to the spellbook</button></div>`;
    body.querySelector('[data-a]').onclick = flash;
    body.querySelector('[data-b]').onclick = spell;
  }
  intro();
};
