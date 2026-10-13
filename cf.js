(function () {
  var svg = document.querySelector('#cf svg');
  var cap = document.getElementById('cfcap');
  function draw(rows) {
    var r = rows.map(function (x) { return x.newRating; });
    var t = rows.map(function (x) { return x.ratingUpdateTimeSeconds; });
    var lo = Math.min.apply(null, r) - 50, hi = Math.max.apply(null, r) + 50;
    var t0 = t[0], t1 = t[t.length - 1] || t0 + 1;
    var X = function (v) { return 40 + (v - t0) / (t1 - t0 || 1) * 580; };
    var Y = function (v) { return 150 - (v - lo) / (hi - lo) * 130; };
    var out = '';
    [1200, 1400, 1600].forEach(function (g) {
      if (g > lo && g < hi) out += '<line class="grid" x1="40" x2="620" y1="' + Y(g) + '" y2="' + Y(g) + '"/><text class="cap" x="34" y="' + (Y(g) + 4) + '" text-anchor="end">' + g + '</text>';
    });
    out += '<polyline class="ln" points="' + rows.map(function (x) { return X(x.ratingUpdateTimeSeconds).toFixed(1) + ',' + Y(x.newRating).toFixed(1); }).join(' ') + '"/>';
    var mi = r.indexOf(Math.max.apply(null, r));
    out += '<circle class="pk" cx="' + X(t[mi]) + '" cy="' + Y(r[mi]) + '" r="4"/><text class="cap" x="' + X(t[mi]) + '" y="' + (Y(r[mi]) - 9) + '" text-anchor="middle">peak ' + r[mi] + '</text>';
    var d0 = new Date(t0 * 1000), d1 = new Date(t1 * 1000);
    out += '<text class="cap" x="40" y="172">' + d0.toLocaleString('en', { month: 'short', year: 'numeric' }) + '</text><text class="cap" x="620" y="172" text-anchor="end">' + d1.toLocaleString('en', { month: 'short', year: 'numeric' }) + '</text>';
    svg.innerHTML = out;
    cap.textContent = rows.length + ' rated contests, current rating ' + r[r.length - 1] + ', peak ' + r[mi] + '. Pulled live from the Codeforces API. Handle: Levi0p.';
  }
  fetch('https://codeforces.com/api/user.rating?handle=Levi0p')
    .then(function (x) { return x.json(); })
    .then(function (j) { if (j.status === 'OK' && j.result.length > 1) draw(j.result); else throw 0; })
    .catch(function () { svg.innerHTML = '<text x="320" y="95" text-anchor="middle" class="cap">peak rating 1546 (could not load live graph)</text>'; });
})();
