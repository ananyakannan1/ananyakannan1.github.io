/* Pixel art, drawn as SVG rects. A sprite is a list of strings, one char per
   pixel, '.' for empty; the palette maps chars to colours. Rows are run-length
   encoded so a sprite is a few dozen rects rather than one per pixel. Shading
   follows Pixel Classroom: shadows drift violet, highlights drift warm. */

const R = (x, y, w, h, f, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${extra}/>`;

function rects(rows, pal, ox = 0, oy = 0) {
  let o = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || c === ' ' || !pal[c]) { x++; continue; }
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      o += R(ox + x, oy + y, w, 1, pal[c]);
      x += w;
    }
  });
  return o;
}

function sprite(rows, pal, cls = '', label = '') {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  return `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"
    shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${rects(rows, pal)}</svg>`;
}

const PAL = {
  k: '#2a1d3a', w: '#fbeaf1', p: '#f7b6c8', P: '#e07a9a', d: '#b8477a',
  o: '#f2c14e', O: '#c98a2a', y: '#ffe08a', g: '#8fd4a8', G: '#3f7a5c',
  b: '#7fb3f2', B: '#3d5a9e', r: '#ff5a6e', R: '#b8304a', c: '#fff6dc',
  s: '#d9c39a', S: '#9c7a52', n: '#8a5a3c', N: '#5c3a28', v: '#c78ff2',
  V: '#7a4fb0', t: '#6fd3e8', T: '#2e7f95', x: '#1a1526', e: '#3a2f4d',
  m: '#a99ac0', h: '#4a3226',
  A: '#f8cf68', D: '#d89c36', E: '#efb94a', L: '#6b3f12', X: '#c8283c', Y: '#ff7a6e', Z: '#8e1b2c', f: '#fbf3e4'
};

const ART = {
  bird: [
    '....kkkk......',
    '...kppppk.....',
    '..kppppppk....',
    '..kppkpppkoo..',
    '..kppppppkooo.',
    '.kppppppppk...',
    'kpppPPppppk...',
    'kppPPPPpppk...',
    'kpppPPPppk....',
    '.kppppppk.....',
    '..kkkkkk......',
    '...o..o.......'
  ],
  mate: [
    '....kkkk......',
    '...kbbbbk.....',
    '..kbbbbbbk....',
    '..kbbkbbbkoo..',
    '..kbbbbbbkooo.',
    '.kbbbbbbbbk...',
    'kbbbBBbbbbk...',
    'kbbBBBBbbbk...',
    'kbbbBBBbbk....',
    '.kbbbbbbk.....',
    '..kkkkkk......',
    '...o..o.......'
  ],
  chick: [
    '..kkkk..',
    '.kyyyyk.',
    'kyykyyko',
    'kyyyyyk.',
    'kyyyyyk.',
    '.kyyyk..',
    '..o.o...'
  ],
  realEgg: [
    '..kkk..',
    '.kccck.',
    'kccscck',
    'kccccck',
    'kcsccsk',
    'kccccck',
    '.kccck.',
    '..kkk..'
  ],
  crackedEgg: [
    '..kkk..',
    '.kmmmk.',
    'kmmkmmk',
    'kmkmkmk',
    'kmmmkmk',
    'kmmmmmk',
    '.kmmmk.',
    '..kkk..'
  ],
  student: [
    '..hhhh..',
    '.hhhhhh.',
    '.hcccch.',
    '.ckcckc.',
    '.cccccc.',
    '..cccc..',
    '.SSSSSS.',
    'SSSSSSSS'
  ],
  phone: ['kkk', 'ktk', 'ktk', 'kkk'],
  slime: [
    '.......kkkk.......',
    '.....kkvvvvkk.....',
    '....kvvvvvvvvk....',
    '...kvvwvvvvvvvk...',
    '..kvvwwvvvvvvvvk..',
    '..kvvvvvvvvvvvvk..',
    '.kvvvkkvvvvkkvvvk.',
    '.kvvvkwvvvvkwvvvk.',
    '.kvvvvvvvvvvvvvvk.',
    'kvvvvvvkkkkvvvvvvk',
    'kVvvvvvvvvvvvvvvVk',
    'kVVvvvvvvvvvvvvVVk',
    '.kVVVVVVVVVVVVVVk.',
    '..kkkkkkkkkkkkkk..'
  ],
  wizard: [
    '....kk....',
    '...kVVk...',
    '..kVVVVk..',
    '.kVVoVVVk.',
    'kkkkkkkkkk',
    '..kcckck..',
    '..kcccck..',
    '.kVVVVVVk.',
    'kVVVVVVVVk',
    '.kkkkkkkk.'
  ],
  avatar: [
    '..hhh..',
    '.hhhhh.',
    '.ckckc.',
    '.ccccc.',
    '..PPP..',
    '.PPPPP.',
    '..k.k..'
  ],
  avatarBack: [
    '..hhh..',
    '.hhhhh.',
    '.hhhhh.',
    '.hhhhh.',
    '..PPP..',
    '.PPPPP.',
    '..k.k..'
  ],
  sign: [
    'kkkkkkkkkkk',
    'ksssOsssssk',
    'ksssOOssssk',
    'ksssOOOsssk',
    'ksssOOssssk',
    'ksssOsssssk',
    'kkkkkkkkkkk',
    '....kSk....',
    '....kSk....'
  ],
  chest: [
    '.kkkkkkkk.',
    'knnnnnnnnk',
    'knnnoonnnk',
    'kkkkookkkk',
    'kNNNNNNNNk',
    'kNNNNNNNNk',
    'kkkkkkkkkk'
  ],
  chestOpen: [
    '.y.y..y.y.',
    'y.kkkkkk.y',
    '.kooooook.',
    'kkkkkkkkkk',
    'kNNNNNNNNk',
    'kNNNNNNNNk',
    'kkkkkkkkkk'
  ],
  bell: [
    '...kk...',
    '..krrk..',
    '.krrrrk.',
    '.krwrrk.',
    '.krrrrk.',
    'krrrrrrk',
    'kkkkkkkk',
    '...kk...'
  ],
  star: [
    '...o...',
    '...o...',
    '..ooo..',
    'ooooooo',
    '..ooo..',
    '.oo.oo.',
    'oo...oo'
  ],
  heart: [
    '.kk.kk.',
    'krrkrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...'
  ],
  // feed thumbnails, 10x10
  fyre: ['oooooooooo', 'oooooooooo', 'oowwwwwooo', 'oowooooooo', 'oowwwwoooo', 'oowooooooo', 'oowooooooo', 'oooooooooo', 'oooooooooo', 'OOOOOOOOOO'],
  coin: ['...kkkk...', '..koooOk..', '.kowwwoOk.', 'kooowoooOk', 'kooowwooOk', 'kooowoooOk', 'kooowwwoOk', '.kooooOOk.', '..kOOOOk..', '...kkkk...'],
  pill: ['..kkkkkk..', '..kwwwwk..', '..kkkkkk..', '.kbbbbbbk.', '.kbwwwwbk.', '.kbwrrwbk.', '.kbwwwwbk.', '.kbbbbbbk.', '.kbbbbbbk.', '..kkkkkk..'],
  dress: ['...k..k...', '...kkkk...', '..kpPpPk..', '..kPpPpk..', '..kpPpPk..', '.kpPpPpPk.', '.kPpPpPpk.', 'kpPpPpPpPk', 'kPpPpPpPpk', 'kkkkkkkkkk'],
  pad: ['..........', '..........', '.kkkkkkkk.', 'kmmmmmmmmk', 'kmkmmmmrmk', 'kkkkmmrmbk', 'kmkmmmmbmk', 'kmmmkkmmmk', '.kkk..kkk.', '..........'],
  tea: ['....g.....', '...gG.....', '...g......', '.kkkkkkk..', '.knnnnnkkk', '.knNnnnk.k', '.knnnnnkkk', '..knnnk...', 'kkkkkkkkk.', '..........'],
  wrapped: ['vvvvvvvvvv', 'vvVVVvvvvv', 'rrrrrrrrrr', 'rrRRRRrrrr', 'oooooooooo', 'ooOOoooooo', 'gggggggggg', 'ggGGGGgggg', 'bbbbbbbbbb', 'bbBBbbbbbb'],
  matcha: ['..........', '..g.g.....', '...g......', '.kkkkkkk..', '.kgggggkk.', '.kgGgggk.k', '.kgggggkk.', '..kgggk...', '..kkkkk...', '..........'],
  pan: ['..........', '..........', '..kkkkk...', '.kyyoyyk..', '.kyoyyykkk', '.kyyyoyk..', '..kkkkk...', '..........', '..........', '..........'],
  scrubs: ['..........', '..tttttt..', '.tttttttt.', '.ttwwwttt.', '.ttwttwtt.', '.ttwwwttt.', '.tttttttt.', '.ttt..ttt.', '.ttt..ttt.', '..........'],
  mushroom: ['..........', '...rrrr...', '..rwrrwr..', '.rrrrrrrr.', '.rrwrrrwr.', '...cccc...', '...cccc...', '...cccc...', '..........', '..........'],
  waterfall: ['GGGG..GGGG', 'GGG.tt.GGG', 'GG.ttwt.GG', 'GG.twtt.GG', 'G..ttwt..G', 'G..twtt..G', '..tttttt..', '.ttwttwtt.', 'tttttttttt', '..........'],
  books: ['..........', '.r........', '.r.b..g...', '.r.b.vg...', '.rkbkvgk..', '.r.b.vg.o.', '.r.b.vg.o.', '.r.b.vg.o.', 'kkkkkkkkkk', '..........'],
  cake: ['....o.....', '....y.....', '...kkk....', '..kpppk...', '.kpwpwpk..', '.kpppppk..', '.kPPPPPk..', '.kPwPwPk..', 'kkkkkkkkk.', '..........'],
  news: ['..........', 'kkkkkkkkk.', 'kwwwwwwwk.', 'kwrrrrrwk.', 'kwkkwmmwk.', 'kwkkwmmwk.', 'kwmmmmmwk.', 'kwmmmmmwk.', 'kkkkkkkkk.', '..........']
};

// The notification letter: sealed, then flap up, then the note rising out.
(function letterSprites() {
  const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const rows = g => g.map(r => r.join(''));
  function sealed() {
    const W = 18, H = 13, g = blank(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const m = Math.min(x, W - 1 - x), line = Math.round(m * 7 / 8.5), low = H - 1 - Math.round(m * 5 / 8.5);
      let c = y < line ? 'A' : y >= low ? 'E' : 'D';
      if (y === line || (y === low && y > line) || x === 0 || x === W - 1 || y === 0 || y === H - 1) c = 'L';
      g[y][x] = c;
    }
    [[8, 5], [9, 5], [7, 6], [8, 6], [9, 6], [10, 6], [7, 7], [8, 7], [9, 7], [10, 7], [8, 8], [9, 8]].forEach(([x, y]) => g[y][x] = 'X');
    g[6][8] = 'Y'; g[7][9] = 'Z';
    return rows(g);
  }
  function opened(paperTop) {
    const W = 18, H = 18, g = blank(W, H);
    for (let y = 0; y < 7; y++) {
      const half = Math.round(y * 1.42) + 1, l = Math.max(0, 9 - half), r = Math.min(W - 1, 8 + half);
      for (let x = l; x <= r; x++) g[y][x] = x === l || x === r || y === 0 ? 'L' : 'D';
    }
    for (let y = 7; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = x === 0 || x === W - 1 || y === H - 1 ? 'L' : 'D';
    if (paperTop != null) {
      for (let y = paperTop; y < 13; y++) for (let x = 3; x < 15; x++) g[y][x] = x === 3 || x === 14 || y === paperTop ? 'k' : 'f';
      const t = paperTop + 2;
      [[5, 0], [6, 0], [8, 0], [9, 0], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [6, 2], [7, 2], [8, 2], [7, 3]].forEach(([x, d]) => { if (t + d < 13) g[t + d][x] = 'X'; });
      [[11, 0], [12, 0], [11, 2], [12, 2]].forEach(([x, d]) => { if (t + d < 13) g[t + d][x] = 'k'; });
    }
    for (let y = 9; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const v = 9 + Math.round((8.5 - Math.abs(x - 8.5)) * .72);
      if (y > v) g[y][x] = 'E'; else if (y === v) g[y][x] = 'L';
    }
    return rows(g);
  }
  ART.letter = sealed();
  ART.letterFlap = opened(null);
  ART.letterHalf = opened(8);
  ART.letterOpen = opened(3);
})();

function art(name, cls = '', label = '') { return sprite(ART[name], PAL, cls, label); }

/* A pixel letter, used for the hidden READ. 3x5 glyphs. */
const GLYPH = {
  R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
  D: ['xx.', 'x.x', 'x.x', 'x.x', 'xx.']
};
function glyphRects(ch, ox, oy, fill) { return rects(GLYPH[ch], { x: fill }, ox, oy); }
