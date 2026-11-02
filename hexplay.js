(function () {
  var svg = document.getElementById('hx');
  if (!svg || !window.AZ) return;
  var info = document.getElementById('hxinfo');
  var NS = 'http://www.w3.org/2000/svg';
  var YOU = '#3e8ef7';
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'; };
  var models = {}, n = 5, humanBlack = true, sims = 400;
  var real, canon, blackToMove, over, last, thinking, gameId = 0, estimate = null;

  var S = 20, W = Math.sqrt(3) * S, PAD = 26;
  function centre(r, c) { return [PAD + W / 2 + (c + r / 2) * W, PAD + S + r * 1.5 * S]; }
  function corner(x, y, k) { var a = Math.PI / 180 * (60 * k - 90); return [x + S * Math.cos(a), y + S * Math.sin(a)]; }
  // The agent sees the board from the side to move, transposed when White is to move.
  function toCanon(i) { return blackToMove ? i : (i % n) * n + Math.floor(i / n); }

  function model(cb) {
    if (models[n]) return cb(models[n]);
    if (window.AZ_MODELS && window.AZ_MODELS[n]) { models[n] = AZ.loadModel(window.AZ_MODELS[n]); return cb(models[n]); }
    info.textContent = 'loading the ' + n + 'x' + n + ' model...';
    var s = document.createElement('script');
    s.src = 'hex/models/hex' + n + '.js';
    s.onload = function () { model(cb); };
    document.body.appendChild(s);
  }

  function newGame() {
    gameId++;
    real = new Int8Array(n * n); canon = new Int8Array(n * n);
    blackToMove = true; over = null; last = -1; thinking = false; estimate = null;
    draw();
    model(function () {
      if (humanBlack) say('your move. you connect top and bottom.');
      else agentMove();
    });
  }

  function play(i) {
    var res = AZ.step(canon, n, toCanon(i));
    real[i] = blackToMove ? 1 : -1;
    canon = res.board; last = i;
    if (res.won) over = blackToMove ? 'b' : 'w';
    blackToMove = !blackToMove;
  }

  function agentMove() {
    thinking = true; say('AlphaZero is thinking...');
    var id = gameId;
    setTimeout(function () {
      if (id !== gameId) return;
      var r = AZ.search(models[n], canon, sims);
      estimate = r.rootValue;
      play(toCanon(r.move));
      thinking = false;
      after();
    }, 40);
  }

  function after() {
    draw();
    if (over) {
      var youWon = (over === 'b') === humanBlack;
      say(youWon ? 'you won. nicely done.' : 'AlphaZero wins. try again?');
      return;
    }
    if (blackToMove === humanBlack) {
      var goal = humanBlack ? 'top and bottom' : 'left and right';
      say('your move. you connect ' + goal + '.' + (estimate === null ? '' : '  AlphaZero is ' + Math.round((estimate + 1) * 50) + '% sure it wins.'));
    } else agentMove();
  }

  function say(t) { info.textContent = t; }

  function chain() {
    if (!over) return {};
    var col = over === 'b' ? 1 : -1, seen = {};
    function flood(start) {
      var out = {}, st = [];
      for (var i = 0; i < n * n; i++) if (real[i] === col && start(Math.floor(i / n), i % n)) { out[i] = 1; st.push(i); }
      while (st.length) {
        var i = st.pop(), r = Math.floor(i / n), c = i % n;
        [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]].forEach(function (d) {
          var rr = r + d[0], cc = c + d[1], j = rr * n + cc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && real[j] === col && !out[j]) { out[j] = 1; st.push(j); }
        });
      }
      return out;
    }
    var a = flood(function (r, c) { return col === 1 ? r === 0 : c === 0; });
    var b = flood(function (r, c) { return col === 1 ? r === n - 1 : c === n - 1; });
    for (var k in a) if (b[k]) seen[k] = 1;
    return seen;
  }

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    svg.appendChild(e);
    return e;
  }

  function draw() {
    var ink = css('--text'), bg = css('--bg'), cell = css('--code-bg'), line = css('--border');
    var blackCol = humanBlack ? YOU : ink, whiteCol = humanBlack ? ink : YOU;
    var xr = centre(n - 1, n - 1)[0];
    svg.setAttribute('viewBox', '0 0 ' + (xr + W / 2 + PAD) + ' ' + (PAD * 2 + S * 2 + (n - 1) * 1.5 * S));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    function edge(p, q, col) { el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }); }
    for (var c = 0; c < n; c++) {
      var t = centre(0, c), b = centre(n - 1, c);
      edge(corner(t[0], t[1], 5), corner(t[0], t[1], 0), blackCol); edge(corner(t[0], t[1], 0), corner(t[0], t[1], 1), blackCol);
      edge(corner(b[0], b[1], 2), corner(b[0], b[1], 3), blackCol); edge(corner(b[0], b[1], 3), corner(b[0], b[1], 4), blackCol);
    }
    for (var r = 0; r < n; r++) {
      var L = centre(r, 0), R = centre(r, n - 1);
      edge(corner(L[0], L[1], 3), corner(L[0], L[1], 4), whiteCol); edge(corner(L[0], L[1], 4), corner(L[0], L[1], 5), whiteCol);
      edge(corner(R[0], R[1], 0), corner(R[0], R[1], 1), whiteCol); edge(corner(R[0], R[1], 1), corner(R[0], R[1], 2), whiteCol);
    }

    var win = chain();
    for (var i = 0; i < n * n; i++) {
      var p = centre(Math.floor(i / n), i % n), pts = [];
      for (var k = 0; k < 6; k++) pts.push(corner(p[0], p[1], k).join(','));
      var hexEl = el('polygon', { points: pts.join(' '), fill: cell, stroke: line, 'stroke-width': 1, 'data-i': i });
      var open = real[i] === 0 && !over && !thinking;
      hexEl.setAttribute('class', open ? 'hxcell open' : 'hxcell');
      if (real[i] !== 0) {
        var colour = real[i] === 1 ? blackCol : whiteCol;
        el('circle', { cx: p[0], cy: p[1], r: S * 0.66, fill: colour, 'pointer-events': 'none' });
        if (win[i]) el('circle', { cx: p[0], cy: p[1], r: S * 0.78, fill: 'none', stroke: colour, 'stroke-width': 2, 'pointer-events': 'none' });
        else if (i === last) el('circle', { cx: p[0], cy: p[1], r: S * 0.16, fill: bg, 'pointer-events': 'none' });
      }
    }
  }

  svg.addEventListener('click', function (e) {
    var i = e.target.getAttribute && e.target.getAttribute('data-i');
    if (i === null || i === undefined) return;
    i = +i;
    if (over || thinking || real[i] !== 0 || blackToMove !== humanBlack) return;
    play(i); after();
  });
  document.getElementById('hxnew').onclick = newGame;
  document.getElementById('hxsize').onchange = function () { n = +this.value; newGame(); };
  document.getElementById('hxside').onchange = function () { humanBlack = this.value === 'first'; newGame(); };
  document.getElementById('hxlevel').onchange = function () { sims = +this.value; };
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addListener(draw);
  newGame();
})();
