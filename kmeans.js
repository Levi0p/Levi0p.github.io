(function () {
  var cv = document.getElementById('km');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var info = document.getElementById('kminfo');
  var COLORS = ['#3e8ef7', '#2fb36d', '#a45fd6', '#14b8c4', '#d6409f'];
  var pts = [], cents = [], assign = [], timer = null, iter = 0;
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'; };
  var K = function () { return +document.getElementById('kmk').value; };

  function init() {
    cents = [];
    for (var i = 0; i < K(); i++) {
      var p = pts.length ? pts[Math.floor(Math.random() * pts.length)] : [Math.random() * 640, Math.random() * 320];
      cents.push([p[0], p[1]]);
    }
    assign = pts.map(function () { return -1; });
    iter = 0;
  }
  function dist2(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); }
  function step() {
    if (!pts.length) { info.textContent = 'add some points first'; return false; }
    if (cents.length !== K()) init();
    var changed = false;
    pts.forEach(function (p, i) {
      var best = 0;
      for (var c = 1; c < cents.length; c++) if (dist2(p, cents[c]) < dist2(p, cents[best])) best = c;
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    });
    cents.forEach(function (ct, c) {
      var sx = 0, sy = 0, n = 0;
      pts.forEach(function (p, i) { if (assign[i] === c) { sx += p[0]; sy += p[1]; n++; } });
      if (n) { ct[0] = sx / n; ct[1] = sy / n; }
    });
    iter++;
    var inertia = 0;
    pts.forEach(function (p, i) { inertia += dist2(p, cents[assign[i]]); });
    info.textContent = 'iteration ' + iter + ', inertia ' + Math.round(inertia / pts.length) + (changed ? '' : ' (converged)');
    draw();
    return changed;
  }
  function draw() {
    ctx.clearRect(0, 0, 640, 320);
    ctx.fillStyle = css('--code-bg');
    ctx.fillRect(0, 0, 640, 320);
    pts.forEach(function (p, i) {
      ctx.fillStyle = assign[i] >= 0 ? COLORS[assign[i]] : css('--dim');
      ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.2832); ctx.fill();
    });
    cents.forEach(function (c, i) {
      if (!iter) return;
      ctx.strokeStyle = css('--text'); ctx.lineWidth = 2; ctx.fillStyle = COLORS[i];
      ctx.beginPath(); ctx.arc(c[0], c[1], 8, 0, 6.2832); ctx.fill(); ctx.stroke();
    });
    if (!pts.length) {
      ctx.fillStyle = css('--dim'); ctx.font = '14px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('click here to add points', 320, 160);
    }
  }
  function stop() { clearInterval(timer); timer = null; document.getElementById('kmrun').textContent = 'run'; }
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect();
    pts.push([(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 320 / r.height]);
    assign.push(-1); iter = 0; cents = []; info.textContent = pts.length + ' points'; draw();
  });
  document.getElementById('kmstep').onclick = function () { stop(); step(); };
  document.getElementById('kmrun').onclick = function () {
    if (timer) return stop();
    this.textContent = 'stop';
    timer = setInterval(function () { if (!step()) stop(); }, 450);
  };
  document.getElementById('kmclear').onclick = function () { stop(); pts = []; cents = []; assign = []; iter = 0; info.textContent = ''; draw(); };
  document.getElementById('kmrand').onclick = function () {
    stop(); pts = []; assign = []; cents = []; iter = 0;
    for (var g = 0; g < 3; g++) {
      var cx = 100 + Math.random() * 440, cy = 70 + Math.random() * 180;
      for (var i = 0; i < 35; i++) {
        pts.push([Math.min(630, Math.max(10, cx + (Math.random() + Math.random() + Math.random() - 1.5) * 90)), Math.min(310, Math.max(10, cy + (Math.random() + Math.random() + Math.random() - 1.5) * 90))]);
        assign.push(-1);
      }
    }
    info.textContent = pts.length + ' points'; draw();
  };
  document.getElementById('kmk').onchange = function () { stop(); cents = []; assign = pts.map(function () { return -1; }); iter = 0; draw(); };
  document.getElementById('kmrand').click();
})();
