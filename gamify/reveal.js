/* The reveal: every hook this essay used on the reader, which ones they fell
   for, and a card to share. It re-renders whenever progress changes, so it is
   always current when the reader arrives. */

(function () {
  const G = window.G, S = G.S;
  const $ = s => document.querySelector(s);

  function hooks() {
    const g = S.games, nBadges = Object.keys(S.badges).length, stamps = Object.keys(S.stamps).length;
    const nest = g.nest;
    return [
      { name: 'Endowed progress', st: 'used', txt: 'Your progress bar started at 10% when you had only read the title. Head starts make people finish.' },
      { name: 'XP & levels', st: 'used', txt: `You became a <b>${G.titleFor()}</b>. Titles cost nothing to give and feel great to get.` },
      { name: 'The quest map', st: 'used', txt: 'An unfinished path nags at you. Psychologists call it the Zeigarnik effect.' },
      { name: 'Notifications', st: nBadges ? 'fell' : 'caught', txt: `You clicked <b>${nBadges} of ${G.BADGE_TOTAL}</b>. Two of them changed this essay. One opened a secret room and the other unlocked a cheat code. Four were real footnotes. The rest were trivia about where words come from. You couldn’t tell which was which until you clicked. That’s the whole trick. If every notification were useless, you’d stop checking. If every one mattered, you’d check calmly. It’s the <i>unpredictable</i> mix, sometimes gold and usually nothing, that keeps your thumb moving. Psychologists call it a <b>variable reward schedule</b>, and it’s the same one slot machines run on. Your phone works the same way. Most notifications are nothing. Just often enough, one is your crush, your job offer, your friend in trouble. So you check every single one.` },
      { name: 'Mystery rewards', st: nBadges ? 'fell' : 'caught', txt: nBadges ? 'Every notification paid a random amount of XP, from 2 to 15. You never knew which you’d get. That’s a loot box.' : 'Each notification paid a random amount of XP. You never opened one to find out.' },
      { name: 'Save files', st: S.visits.length > 1 ? 'fell' : 'used', txt: 'The essay saved your progress and offered to let you continue. Sunk cost is a powerful reason to come back.' },
      { name: 'The bribe', st: S.got.overjust ? 'used' : 'missed', txt: 'You got 25 XP for reading the over-justification paragraph. Did that make it feel more worth reading, or less?' },
      { name: 'Collections', st: 'used', txt: `You have <b>${stamps} of ${G.STAMPS.length}</b> eggs. The empty slots exist to bother you.` },
      { name: 'Rare drops', st: 'used', txt: S.foil ? 'One reader in twenty gets a foil egg, and you were one. Did you feel lucky?' : 'One reader in twenty gets a foil egg. You didn’t. Did you check?' },
      { name: 'Supernormal stimulus', st: nest ? (nest.lastHatched ? 'caught' : 'fell') : 'missed', txt: nest ? `You tapped <b>${nest.fake}</b> shiny eggs and went back to your own egg <b>${nest.real}</b> times. ${nest.lastHatched ? 'It hatched, and the family has been flying with you since.' : 'It went cold.'}` : 'You skipped the nest.' },
      { name: 'Goodhart’s law', st: S.hunt ? 'fell' : 'missed', txt: S.hunt ? `You found ${S.hunt} of 5 hidden keys. To find them you skimmed, hunting keywords instead of reading. The measure (keys found) replaced the goal (understanding). That’s Goodhart’s law, and you just did it.` : 'You never started the word hunt, so you never had the chance to skim for keys instead of reading.' },
      { name: 'The grey dot', st: S.eggs.dot ? 'found' : 'missed', txt: S.eggs.dot ? 'You found the secret room.' : 'A one-pixel grey dot opened a secret room. It’s still there.' },
      { name: 'The cheat code', st: S.eggs.konami ? 'found' : 'missed', txt: S.eggs.konami ? 'You used the Konami code on the classroom.' : 'There was a cheat code. A notification told you what it was.' },
      { name: 'Streaks', st: S.comeback ? 'fell' : 'missed', txt: S.comeback ? 'You came back on another day, and the essay rewarded you for it.' : 'Come back tomorrow and the essay will notice.' }
    ];
  }

  const GROUPS = [
    ['fell', 'You fell for these', 'var(--l-red)'],
    ['used', 'These work on everyone', 'var(--l-gold)'],
    ['found', 'You found these', 'var(--l-green)'],
    ['caught', 'You resisted these', 'var(--l-blue)'],
    ['missed', 'You missed these', 'var(--text-dim)']
  ];

  function counts(hs) {
    return {
      total: hs.length,
      found: G.eggCount(),
      everyone: hs.filter(h => h.st === 'used').length,
      fell: hs.filter(h => h.st === 'fell' || h.st === 'used').length
    };
  }

  function render() {
    const body = $('#revealBody'); if (!body) return;
    const hs = hooks(), c = counts(hs);
    const notRead = S.xp - S.xpRead, pct = S.xp ? Math.round(100 * notRead / S.xp) : 0;

    body.innerHTML = `
      <h2 style="border-top:0;margin-top:10px">This essay used ${c.total} hooks on you</h2>
      <p>You found <b style="color:var(--l-green)">${c.found} of ${G.EGGS.length}</b> easter eggs. You fell for <b style="color:var(--l-red)">${c.fell}</b> hooks, and ${c.everyone} of those work on everyone, so don’t feel too bad.</p>
      <div class="hooks">${GROUPS.map(([st, title, col]) => {
        const g = hs.filter(h => h.st === st);
        return g.length ? `<div class="hgroup"><h4 style="color:${col}">${title} · ${g.length}</h4>${g.map(h => `
          <div class="hook" style="border-left:5px solid ${col}"><span class="hook-name">${h.name}</span>${h.txt}</div>`).join('')}</div>` : '';
      }).join('')}</div>

      <h2>Where your XP came from</h2>
      <p>You earned <b style="color:var(--l-gold)">${S.xp} XP</b>. Only <b style="color:var(--l-gold)">${S.xpRead}</b> of it was for reading. The other <b style="color:var(--l-red)">${pct}%</b> came from clicking, collecting and hunting. In this game, like most, farming pays better than reading.</p>

      <h2>Your card</h2>
      <canvas id="endCard" width="600" height="800" style="width:min(100%,360px);display:block;margin:6px auto 14px"></canvas>
      <div class="btn-row" style="justify-content:center">
        <a class="btn pink" id="shareX" target="_blank" rel="noopener">Share on X</a>
        <button class="btn alt" id="saveCard">Save image</button>
      </div>`;

    $('#saveCard').onclick = () => {
      const a = document.createElement('a');
      a.download = 'gamified-card.png';
      a.href = $('#endCard').toDataURL('image/png');
      a.click();
    };
    const text = `I read @ananyaspilled's gamified essay on gamifying education. It used ${c.total} hooks on me and I fell for ${c.fell}. I'm a ${G.titleFor()}. How many will you catch?`;
    $('#shareX').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent('https://ananya.ink/gamify');
    drawCard(c);
  }

  /* The shareable card, drawn on a canvas so it can be saved as a PNG. */
  function drawCard(c) {
    const cv = $('#endCard'); if (!cv) return;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    const box = (a, b, w, h, f) => { x.fillStyle = f; x.fillRect(a, b, w, h); };
    const sprite = (name, ox, oy, sc) => {
      ART[name].forEach((row, r) => [...row].forEach((ch, k) => { if (PAL[ch]) box(ox + k * sc, oy + r * sc, sc, sc, PAL[ch]); }));
    };
    const draw = () => {
      box(0, 0, 600, 800, '#ff6ba3'); box(8, 8, 584, 784, '#110c28'); box(14, 14, 572, 772, '#1d1740');
      box(14, 14, 572, 6, '#2a2259');
      // stepped sky header
      ['#1b1442', '#241a52', '#2f2160', '#3d2a6c', '#553578', '#74437f', '#9a5486', '#c26a8c'].forEach((col, i) => box(30, 34 + i * 22, 540, 22, col));
      const rnd = (s => () => (s = s * 16807 % 2147483647) / 2147483647)(5);
      for (let i = 0; i < 40; i++) box(30 + Math.floor(rnd() * 540), 34 + Math.floor(rnd() * 100), 4, 4, '#fbeaf1');
      const nest = S.games.nest;
      if (nest && nest.hatched) sprite('chick', 250, 90, 12); else sprite(nest ? 'crackedEgg' : 'realEgg', 258, 92, 12);
      x.textAlign = 'center';
      x.fillStyle = '#ff6ba3'; x.font = '20px Silkscreen'; x.fillText('GAMIFIED', 300, 240);
      x.fillStyle = '#cfc3e8'; x.font = '19px DotGothic16'; x.fillText('gamification is the future of education', 300, 272);
      x.fillStyle = '#f2c14e'; x.font = '50px Silkscreen'; x.fillText(G.titleFor().toUpperCase(), 300, 352);
      x.fillStyle = '#f5ecfa'; x.font = '44px "Jersey 10"'; x.fillText(S.xp + ' XP', 300, 410);
      const stat = (label, val, col, y) => {
        box(70, y, 460, 64, '#0f0b24'); box(70, y, 460, 4, '#171234');
        x.textAlign = 'left'; x.fillStyle = '#cfc3e8'; x.font = '22px DotGothic16'; x.fillText(label, 92, y + 42);
        x.textAlign = 'right'; x.fillStyle = col; x.font = '44px "Jersey 10"'; x.fillText(val, 508, y + 46);
      };
      stat('hooks used on me', c.total, '#f2c14e', 446);
      stat('hooks I fell for', c.fell, '#ff5a6e', 522);
      stat('eggs I found', c.found + ' / ' + G.EGGS.length, '#8fd4a8', 598);
      x.textAlign = 'center'; x.fillStyle = '#958ab8'; x.font = '18px Silkscreen'; x.fillText('HOW MANY WILL YOU CATCH?', 300, 712);
      x.fillStyle = '#f2c14e'; x.font = '24px Silkscreen'; x.fillText('ananya.ink/gamify', 300, 750);
    };
    if (document.fonts && document.fonts.load) {
      Promise.all(['20px Silkscreen', '20px DotGothic16', '20px "Jersey 10"'].map(f => document.fonts.load(f))).then(draw, draw);
    } else draw();
  }

  let pending = null;
  G.onChange(() => { clearTimeout(pending); pending = setTimeout(render, 150); });
  render();
})();
