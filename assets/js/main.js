/* ==========================================================================
   Portafolio — Chris Toloza
   Sin dependencias. Todo lo "extra" es mejora progresiva: la página
   funciona y se lee igual con JavaScript desactivado.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL = "chris.toloza.dev@gmail.com";

  function safeGet(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function safeSet(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }

  /* ---------- Año del pie y reloj (hora de Chile) ---------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  var clock = $("#clock");
  function tick() {
    if (!clock) return;
    var opts = { hour: "2-digit", minute: "2-digit", hour12: false };
    try { clock.textContent = new Date().toLocaleTimeString("es-CL", Object.assign({ timeZone: "America/Santiago" }, opts)); }
    catch (e) { clock.textContent = new Date().toLocaleTimeString([], opts); }
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Barra de progreso de scroll ---------- */
  var bar = $("#progress");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = root;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ")";
      root.classList.toggle("scrolled", h.scrollTop > window.innerHeight * .45);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll-spy ---------- */
  var links = $$(".links a");
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("data-sec")); }).filter(Boolean);
  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("data-sec") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Filtros de proyectos ---------- */
  var chips = $$(".chip");
  var projects = $$("#project-grid .project");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      projects.forEach(function (p) {
        var show = f === "all" || (p.getAttribute("data-cat") || "").split(" ").indexOf(f) !== -1;
        p.hidden = !show;
      });
    });
  });

  /* ---------- Aviso + copiar email ---------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }
  var copyBtn = $("#copy-mail");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var done = function () { toast("Email copiado: " + EMAIL); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { window.location.href = "mailto:" + EMAIL; });
    } else {
      window.location.href = "mailto:" + EMAIL;
    }
  });

  /* ======================================================================
     AMBIENTE: lluvia, ciudad, luces, vapor, neón y sonido
     ====================================================================== */
  var MODES = {
    high:     { rain: true,  bokeh: true,  steam: true,  neon: true,  glass: true,  city: true },
    balanced: { rain: true,  bokeh: true,  steam: false, neon: true,  glass: false, city: true },
    low:      { rain: false, bokeh: false, steam: false, neon: false, glass: false, city: false }
  };
  var FX_KEYS = ["rain", "bokeh", "steam", "neon", "city"];

  function recommendedMode() {
    if (reduceMotion) return "low";
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var small = window.matchMedia && matchMedia("(max-width: 760px)").matches;
    if (cores <= 2 || mem <= 2) return "low";
    if (cores <= 4 || mem <= 4 || small) return "balanced";
    return "high";
  }
  var REC = recommendedMode();

  var state = { mode: REC, rain: true, bokeh: true, steam: true, neon: true, glass: true, city: true, cityStyle: "pixel", sound: false };
  (function load() {
    var saved = null;
    try { saved = JSON.parse(safeGet("localStorage", "ambiente") || "null"); } catch (e) {}
    if (saved && saved.mode) {
      FX_KEYS.concat(["glass"]).forEach(function (k) { if (typeof saved[k] === "boolean") state[k] = saved[k]; });
      if (typeof saved.city !== "boolean" && MODES[saved.mode]) state.city = MODES[saved.mode].city;
      if (saved.cityStyle === "pixel" || saved.cityStyle === "anime") state.cityStyle = saved.cityStyle;
      state.mode = saved.mode;
    } else {
      applyMode(REC, true);
    }
  })();

  function applyMode(m, silent) {
    var cfg = MODES[m] || MODES.balanced;
    state.mode = m;
    FX_KEYS.concat(["glass"]).forEach(function (k) { state[k] = cfg[k]; });
    if (!silent) refresh();
  }

  function persist() {
    var o = { mode: state.mode, cityStyle: state.cityStyle };
    FX_KEYS.concat(["glass"]).forEach(function (k) { o[k] = state[k]; });
    safeSet("localStorage", "ambiente", JSON.stringify(o));
  }

  function refresh() {
    FX_KEYS.concat(["glass"]).forEach(function (k) { root.classList.toggle("fx-" + k, !!state[k]); });
    // reflejar en los controles
    $$("input[data-mode]").forEach(function (i) { i.checked = i.getAttribute("data-mode") === state.mode; });
    $$("input[data-fx]").forEach(function (i) {
      var k = i.getAttribute("data-fx");
      i.checked = k === "sound" ? state.sound : !!state[k];
    });
    $$("input[data-city]").forEach(function (i) { i.checked = i.getAttribute("data-city") === state.cityStyle; });
    $$("[data-rec]").forEach(function (el) { el.hidden = el.getAttribute("data-rec") !== REC; });
    var sb = $("#sound-btn");
    if (sb) sb.setAttribute("aria-pressed", state.sound ? "true" : "false");
    syncRain();
    syncCity();
    persist();
  }

  /* ---------- Lluvia en el vidrio (canvas) ---------- */
  var canvas = $("#rain");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  var drops = [], cw = 0, ch = 0, raf = 0;

  function sizeRain() {
    if (!canvas || !ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var density = state.mode === "high" ? 9000 : 16000;
    var n = Math.max(40, Math.min(170, Math.round((cw * ch) / density)));
    drops = [];
    for (var i = 0; i < n; i++) drops.push(makeDrop(true));
  }
  function makeDrop(anywhere) {
    var len = 10 + Math.random() * 22;
    return { x: Math.random() * (cw + 80), y: anywhere ? Math.random() * ch : -len - Math.random() * 120, len: len, v: 9 + Math.random() * 9, a: Math.random() < .25 ? 1 : 0 };
  }
  function frame() {
    raf = 0;
    if (!state.rain || document.hidden) return;
    ctx.clearRect(0, 0, cw, ch);
    ctx.lineWidth = 1;
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? "rgba(200, 224, 240, .5)" : "rgba(160, 196, 220, .22)";
      ctx.beginPath();
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        if (d.a !== pass) continue;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * .14, d.y + d.len);
      }
      ctx.stroke();
    }
    for (var j = 0; j < drops.length; j++) {
      var p = drops[j];
      p.y += p.v; p.x -= p.v * .14;
      if (p.y > ch + 10 || p.x < -20) drops[j] = makeDrop(false);
    }
    raf = requestAnimationFrame(frame);
  }
  function syncRain() {
    if (!canvas || !ctx) return;
    if (state.rain && !reduceMotion && !document.hidden) {
      if (!drops.length) sizeRain();
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (raf) {
      cancelAnimationFrame(raf); raf = 0;
      ctx.clearRect(0, 0, cw, ch);
    }
  }
  document.addEventListener("visibilitychange", syncRain);
  var rz;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { sizeRain(); syncRain(); }, 200); });

  /* ======================================================================
     CIUDAD QUE PASA: parallax horizontal en dos estilos (pixel o anime)
     La ciudad se genera una vez con semilla fija y se pinta en capas que
     solo se desplazan. Es la misma ciudad en ambos estilos.
     ====================================================================== */
  var cityCv = $("#city");
  var cc = cityCv && cityCv.getContext ? cityCv.getContext("2d") : null;
  var city = null, cityRaf = 0, cityT = 0, cityPrev = 0;
  var LIT = ["#ffb547", "#ffd58f", "#ff6f8e", "#8ec5e6", "#ffb547"];
  var NEON = ["#ff6f8e", "#8ec5e6", "#ffb547", "#b69bff"];
  var PAL = {
    far:  { wall: "#1a2d44", top: "#2a4260", bot: "#182a40", rim: "#2f4d6b", dark: "#1f3550", win: .55, mist: .32 },
    mid:  { wall: "#122434", top: "#1a2f46", bot: "#0f2030", rim: "#27455f", dark: "#173047", win: .7, mist: .18 },
    near: { wall: "#0b1822", top: "#112636", bot: "#08131c", rim: "#1f3a50", dark: "#10202c", win: .85, mist: 0 }
  };
  var CAR_COL = ["#34506a", "#5d3346", "#2f5650", "#6a5530"];

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function mod(n, m) { return ((n % m) + m) % m; }
  function rint(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }

  /* ----- geometría (en unidades "u": 1 u = 1 pixel del arte) ----- */
  function genSkyline(rng, d, W, H, g) {
    var out = { def: d, b: [], beacons: [], dyn: [] }, x = 0;
    while (x < W) {
      var left = W - x;
      var w = rint(rng, d.wMin, d.wMax);
      if (left - w < d.wMin) w = left;
      var h = Math.round(H * (d.hMin + rng() * (d.hMax - d.hMin)));
      var y = H - h;
      var b = { x: x, y: y, w: w, h: h, rects: [], lit: [], dark: [], signs: [] };
      var r = rng();
      if (r < .42) { /* azotea plana */ }
      else if (r < .64) {
        var sw = Math.max(5, Math.round(w * (.4 + rng() * .3))), sh = rint(rng, 3, 8);
        b.rects.push([x + Math.floor((w - sw) * rng()), y - sh, sw, sh]);
      } else if (r < .80) {
        var ah = rint(rng, 5, 13), ax = x + 2 + Math.floor(rng() * Math.max(1, w - 4));
        b.rects.push([ax, y - ah, 1, ah]);
        if (rng() < .75) out.beacons.push({ x: ax, y: y - ah - 1, ph: rng() });
      } else if (r < .90 && w >= 11 && d.id !== "far") {
        var tx = x + 2 + Math.floor(rng() * (w - 9));
        b.rects.push([tx, y - 7, 6, 4], [tx + 1, y - 8, 4, 1], [tx + 1, y - 3, 1, 3], [tx + 4, y - 3, 1, 3]);
      } else if (w >= 12) {
        b.rects.push([x + 2, y - 2, 3, 2], [x + 7, y - 3, 3, 3]);
      }
      if (d.id !== "far" && !b.rects.length) {
        if (w >= 14 && rng() < .24) {
          b.rects.push([x + w - 5, y - 4, 2, 4]);
          out.dyn.push({ t: "smoke", x: x + w - 4, y: y - 4, ph: rng() });
        } else if (w >= 18 && rng() < .22) {
          var cl = { x1: x + 2, x2: x + w - 3, cols: [] };
          for (var q2 = cl.x1 + 3; q2 < cl.x2 - 1; q2 += 4) cl.cols.push(Math.floor(rng() * 4));
          b.cloth = cl;
        }
      }
      var cols = Math.floor((w - 1) / 4);
      if (cols > 0) {
        var span = cols * 4 - 2, x0 = x + Math.floor((w - span) / 2), occ = .3 + rng() * 1.5;
        for (var yy = y + 3; yy + 3 <= H - g - 2; yy += 5) {
          for (var k = 0; k < cols; k++) {
            var q = rng(), wx = x0 + k * 4;
            if (q < d.p * occ) {
              b.lit.push([wx, yy, Math.floor(rng() * LIT.length)]);
              if (d.id !== "far" && rng() < .1) out.dyn.push({ t: "tv", x: wx, y: yy, ph: rng() });
            }
            else if (q < d.p * occ + .35) b.dark.push([wx, yy]);
          }
        }
      }
      if (d.sign && x > 2 && x + w < W - 2 && w >= 14 && h > 26 && rng() < d.sign) {
        var sh2 = rint(rng, 8, 15);
        var room = Math.max(1, Math.min(Math.round(h * .25), H - g - y - sh2 - 6));
        b.signs.push({ x: rng() < .5 ? x - 1 : x + w - 2, y: y + 4 + Math.floor(rng() * room), w: 3, h: sh2, c: NEON[Math.floor(rng() * NEON.length)] });
      }
      out.b.push(b);
      var gap = (rng() < .22 && left - w - 3 >= d.wMin) ? rint(rng, 1, 3) : 0;
      x += w + gap;
    }
    if (d.id !== "far") {
      var cand = out.b.filter(function (b) { return !b.rects.length && !b.cloth && b.w >= 14 && b.x > 10 && b.x + b.w < W - 10; });
      var picks = d.id === "near" ? [cand[1], cand[Math.floor(cand.length * .7)]] : [cand[Math.floor(cand.length * .4)]];
      picks.forEach(function (b) {
        if (!b || b.cat) return;
        b.cat = { x: b.x + 3 + Math.floor(rng() * (b.w - 10)), y: b.y };
        out.dyn.push({ t: "cat", x: b.cat.x, y: b.cat.y, ph: rng() });
      });
    }
    return out;
  }

  function genStreet(rng, W, H, g) {
    var s = { lamps: [], trees: [], kiosk: { x: Math.round(W * .5), w: 26, h: 15 } };
    var x = 24 + Math.floor(rng() * 20);
    while (x < W - 30) {
      s.lamps.push(x);
      var nx = x + 70 + Math.floor(rng() * 50);
      if (rng() < .55 && nx < W - 20) {
        var r = rint(rng, 5, 7), dots = [];
        for (var i = 0; i < 6; i++) { var a = rng() * 6.283, rr = rng() * (r - 1.5); dots.push([Math.round(Math.cos(a) * rr), Math.round(Math.sin(a) * rr)]); }
        s.trees.push({ x: x + 30 + Math.floor(rng() * ((nx - x) - 60)), r: r, dots: dots });
      }
      x = nx;
    }
    var kx = s.kiosk.x, kw = s.kiosk.w;
    s.vend = { x: Math.round(W * .2) }; s.bench = { x: Math.round(W * .8) };
    var spots = [[kx - 8, kx + kw + 8], [s.vend.x - 9, s.vend.x + 15], [s.bench.x - 9, s.bench.x + 18]];
    function free(px0, m) { return spots.every(function (sp) { return px0 < sp[0] + (m ? 2 : 0) || px0 > sp[1] - (m ? 2 : 0); }); }
    s.lamps = s.lamps.filter(function (lx) { return free(lx, 0); });
    s.trees = s.trees.filter(function (t) { return free(t.x, 1); });
    return s;
  }

  /* ----- pintores ----- */
  function discPx(c, cx, cy, r, col) {
    c.fillStyle = col;
    cx = Math.round(cx); cy = Math.round(cy);
    for (var dy = -r; dy <= r; dy++) {
      var hw = Math.floor(Math.sqrt(r * r - dy * dy) + .5);
      c.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    }
  }
  function disc(c, px, cx, cy, r, col) {
    if (px) { discPx(c, cx, cy, Math.round(r), col); return; }
    c.fillStyle = col; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
  }
  function newCv(w, h) { var cv = document.createElement("canvas"); cv.width = w; cv.height = h; return cv; }

  function paintSky(geo, px, S) {
    var cv = newCv(geo.wp * S, geo.H * S), c = cv.getContext("2d"), H = geo.H, wp = geo.wp, rng = mulberry(77);
    if (!px) c.scale(S, S);
    if (px) {
      var bands = [[.46, .03, "255,111,142"], [.56, .04, "255,111,142"], [.66, .05, "255,111,142"], [.76, .06, "255,150,100"], [.86, .07, "255,181,71"], [.93, .07, "255,181,71"]];
      bands.forEach(function (b) { var y0 = Math.round(H * b[0]); c.fillStyle = "rgba(" + b[2] + "," + b[1] + ")"; c.fillRect(0, y0, wp, H - y0); });
    } else {
      var gr = c.createLinearGradient(0, H * .3, 0, H);
      gr.addColorStop(0, "rgba(255,111,142,0)"); gr.addColorStop(.6, "rgba(255,111,142,.11)"); gr.addColorStop(1, "rgba(255,181,71,.14)");
      c.fillStyle = gr; c.fillRect(0, 0, wp, H);
    }
    var tw = [], n = Math.round(wp / 9);
    for (var i = 0; i < n; i++) {
      var sx = Math.floor(rng() * wp), sy = Math.floor(rng() * H * .4), a = .22 + rng() * .5;
      if (i < 9) tw.push({ x: sx, y: sy, ph: rng() * 6.28 });
      c.fillStyle = "rgba(226,238,246," + a.toFixed(2) + ")";
      if (px) c.fillRect(sx, sy, 1, 1); else { c.beginPath(); c.arc(sx + .5, sy + .5, .32, 0, 6.2832); c.fill(); }
    }
    var R = Math.max(6, Math.round(H * .085)), mx = Math.round(wp * .93), my = Math.round(H * .2);
    if (geo.moon) {
      if (px) {
        discPx(c, mx, my, R + 5, "rgba(255,214,150,.035)");
        discPx(c, mx, my, R + 3, "rgba(255,214,150,.05)");
        c.fillStyle = "#ffe7b8";
        for (var dy = -R; dy <= R; dy++) for (var dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > R * R) continue;
          var ex = dx - R * .52, ey = dy + R * .16;
          if (ex * ex + ey * ey <= R * R * .8) continue;
          c.fillRect(mx + dx, my + dy, 1, 1);
        }
      } else {
        var hg = c.createRadialGradient(mx, my, R * .4, mx, my, R * 4.2);
        hg.addColorStop(0, "rgba(255,225,170,.26)"); hg.addColorStop(1, "rgba(255,225,170,0)");
        c.fillStyle = hg; c.fillRect(mx - R * 5, my - R * 5, R * 10, R * 10);
        var mg = c.createLinearGradient(mx - R, my - R, mx + R, my + R);
        mg.addColorStop(0, "#fff3d9"); mg.addColorStop(1, "#ffd18a");
        c.save();
        c.beginPath(); c.arc(mx, my, R, 0, 6.2832); c.clip();
        c.fillStyle = mg; c.beginPath();
        c.rect(mx - R - 2, my - R - 2, R * 2 + 4, R * 2 + 4);
        c.arc(mx + R * .52, my - R * .16, R * .89, 0, 6.2832);
        c.fill("evenodd");
        c.restore();
      }
    }
    return { cv: cv, tw: tw };
  }

  function paintSkyline(sl, px, S, W, H, g) {
    var cv = newCv(W * S, H * S), c = cv.getContext("2d"), P = PAL[sl.def.id];
    if (!px) c.scale(S, S);
    sl.b.forEach(function (b) {
      if (px) c.fillStyle = P.wall;
      else { var gr = c.createLinearGradient(0, b.y, 0, H); gr.addColorStop(0, P.top); gr.addColorStop(1, P.bot); c.fillStyle = gr; }
      c.fillRect(b.x, b.y, b.w, H - b.y);
      b.rects.forEach(function (r) { c.fillRect(r[0], r[1], r[2], r[3]); });
      if (b.cloth) {
        var cth = b.cloth, CL = ["#ff6f8e", "#e8ebe6", "#8ec5e6", "#ffb547"];
        c.fillStyle = "#2b3f52";
        c.fillRect(cth.x1, b.y - 4, 1, 4); c.fillRect(cth.x2, b.y - 4, 1, 4);
        c.fillRect(cth.x1, b.y - 4, cth.x2 - cth.x1 + 1, 1);
        cth.cols.forEach(function (ci, i) { c.fillStyle = CL[ci]; c.fillRect(cth.x1 + 3 + i * 4, b.y - 3, 2, 2); });
      }
      if (b.cat) {
        var ct = b.cat;
        c.fillStyle = "#03070a";
        c.fillRect(ct.x, ct.y - 4, 4, 4); c.fillRect(ct.x + 1, ct.y - 6, 3, 2);
        c.fillRect(ct.x + 1, ct.y - 7, 1, 1); c.fillRect(ct.x + 3, ct.y - 7, 1, 1);
      }
      c.fillStyle = P.rim;
      if (px) c.fillRect(b.x, b.y, b.w, 1); else { c.globalAlpha = .7; c.fillRect(b.x, b.y, b.w, .35); c.globalAlpha = 1; }
      c.fillStyle = P.dark;
      b.dark.forEach(function (w) { if (px) c.fillRect(w[0], w[1], 2, 3); else c.fillRect(w[0] + .2, w[1] + .2, 1.6, 2.6); });
      c.globalAlpha = P.win;
      b.lit.forEach(function (w) {
        c.fillStyle = LIT[w[2]];
        if (px) c.fillRect(w[0], w[1], 2, 3);
        else { c.shadowColor = LIT[w[2]]; c.shadowBlur = S * 2.4; c.fillRect(w[0] + .2, w[1] + .2, 1.6, 2.6); }
      });
      c.shadowBlur = 0; c.globalAlpha = 1;
      b.signs.forEach(function (s) {
        c.fillStyle = s.c;
        if (px) {
          c.globalAlpha = .2; c.fillRect(s.x - 1, s.y - 1, s.w + 2, s.h + 2);
          c.globalAlpha = 1; c.fillRect(s.x, s.y, s.w, s.h);
          c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(s.x + 1, s.y + 1, 1, s.h - 2);
        } else {
          c.shadowColor = s.c; c.shadowBlur = S * 6;
          c.fillRect(s.x + .3, s.y, s.w - .6, s.h); c.fillRect(s.x + .3, s.y, s.w - .6, s.h);
          c.shadowBlur = 0; c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(s.x + 1.1, s.y + .8, .8, s.h - 1.6);
        }
      });
    });
    if (!px && P.mist) {
      c.globalCompositeOperation = "source-atop";
      var mg = c.createLinearGradient(0, H * .3, 0, H);
      mg.addColorStop(0, "rgba(120,150,195,0)"); mg.addColorStop(1, "rgba(120,150,195," + P.mist + ")");
      c.fillStyle = mg; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = "source-over";
    }
    return cv;
  }

  function paintStreet(st, px, S, W, H, g) {
    var cv = newCv(W * S, H * S), c = cv.getContext("2d"), gy = H - g;
    if (!px) c.scale(S, S);
    var offs = [-W, 0, W];
    // calzada y vereda
    if (px) {
      c.fillStyle = "#090f15"; c.fillRect(0, gy, W, g);
      c.fillStyle = "#17242f"; c.fillRect(0, gy, W, 2);
      c.fillStyle = "#26394a"; c.fillRect(0, gy, W, 1);
      c.fillStyle = "#5c4d33";
      for (var dx = 0; dx < W; dx += 10) c.fillRect(dx, H - 3, 5, 1);
    } else {
      var rg = c.createLinearGradient(0, gy, 0, H); rg.addColorStop(0, "#0d1821"); rg.addColorStop(1, "#05090d");
      c.fillStyle = rg; c.fillRect(0, gy, W, g);
      c.fillStyle = "rgba(120,160,190,.22)"; c.fillRect(0, gy, W, .4);
      c.fillStyle = "#16242f"; c.fillRect(0, gy + .4, W, 1.6);
      c.fillStyle = "rgba(255,213,143,.34)";
      for (var d2 = 0; d2 < W; d2 += 10) c.fillRect(d2, H - 3, 5, .5);
    }
    // árboles
    st.trees.forEach(function (t) {
      offs.forEach(function (o) {
        var cx = t.x + o, cy = gy - 5 - t.r;
        c.fillStyle = "#0a141c"; c.fillRect(cx, gy - 6, 1, 6);
        disc(c, px, cx, cy, t.r, "#0a1a20");
        if (px) { c.fillStyle = "#12303a"; c.fillRect(cx - 2, cy - t.r + 1, 3, 1); c.fillRect(cx - t.r + 1, cy - 1, 1, 2); }
        t.dots.forEach(function (d) {
          c.fillStyle = "#ffb547";
          if (px) c.fillRect(cx + d[0], cy + d[1], 1, 1);
          else { c.shadowColor = "#ffb547"; c.shadowBlur = S * 2.5; c.fillRect(cx + d[0], cy + d[1], .8, .8); c.shadowBlur = 0; }
        });
      });
    });
    // kiosco-café encendido
    var k = st.kiosk, ky = gy - k.h;
    offs.forEach(function (o) {
      var kx = k.x + o;
      c.fillStyle = "#14222d"; c.fillRect(kx, ky, k.w, k.h);
      c.fillStyle = "#ffb547";
      if (!px) { c.shadowColor = "#ffb547"; c.shadowBlur = S * 5; }
      c.fillRect(kx + 3, ky + 5, k.w - 6, 7);
      c.shadowBlur = 0;
      c.fillStyle = "#0a141c"; c.fillRect(kx + 8, ky + 8, 2, 4); c.fillRect(kx + 8, ky + 6, 2, 2);
      c.fillRect(kx + 14, ky + 9, 3, 3);
      for (var i = 0; i < k.w; i += 3) { c.fillStyle = (i / 3) % 2 ? "#e8ebe6" : "#ff6f8e"; c.fillRect(kx + i, ky, Math.min(3, k.w - i), 3); }
      c.fillStyle = "rgba(255,181,71,.16)"; c.fillRect(kx - 2, gy, k.w + 4, 1);
    });
    // cables entre farolas
    var lt = gy - Math.round(H * .27), ls = st.lamps.slice().sort(function (a, b) { return a - b; });
    c.fillStyle = "#0a141c"; c.strokeStyle = "#0a141c"; c.lineWidth = .35;
    ls.forEach(function (a, i) {
      var b2 = i < ls.length - 1 ? ls[i + 1] : ls[0] + W;
      offs.forEach(function (o) {
        if (px) { for (var xx = a; xx <= b2; xx++) { var tt = (xx - a) / (b2 - a); c.fillRect(xx + o, lt + Math.round(3 * 4 * tt * (1 - tt)), 1, 1); } }
        else { c.beginPath(); c.moveTo(a + o, lt); c.quadraticCurveTo((a + b2) / 2 + o, lt + 6, b2 + o, lt); c.stroke(); }
      });
    });
    // máquina expendedora y banca
    offs.forEach(function (o) {
      var vx = st.vend.x + o;
      c.fillStyle = px ? "rgba(142,197,230,.10)" : "rgba(142,197,230,.12)"; c.fillRect(vx - 2, gy - 12, 10, 12);
      c.fillStyle = "#16303c"; c.fillRect(vx, gy - 10, 6, 10);
      c.fillStyle = "#8ec5e6";
      if (!px) { c.shadowColor = "#8ec5e6"; c.shadowBlur = S * 4; }
      c.fillRect(vx + 1, gy - 9, 4, 5); c.shadowBlur = 0;
      c.fillStyle = "#16303c"; c.fillRect(vx + 1, gy - 7, 4, 1); c.fillRect(vx + 3, gy - 9, 1, 5);
      c.fillStyle = "#ffb547"; c.fillRect(vx + 1, gy - 3, 2, 1);
      var bx = st.bench.x + o;
      c.fillStyle = "#26405a";
      c.fillRect(bx, gy - 3, 9, 1); c.fillRect(bx, gy - 6, 9, 1); c.fillRect(bx, gy - 6, 1, 3); c.fillRect(bx + 8, gy - 6, 1, 3);
      c.fillRect(bx + 1, gy - 2, 1, 2); c.fillRect(bx + 7, gy - 2, 1, 2);
    });
    // farolas
    st.lamps.forEach(function (lx) {
      offs.forEach(function (o) {
        var x = lx + o, top = gy - Math.round(H * .27), hx = x + 4, hy = top + 1;
        if (px) {
          discPx(c, hx, hy, 11, "rgba(255,181,71,.045)");
          discPx(c, hx, hy, 7, "rgba(255,181,71,.07)");
          discPx(c, hx, hy, 4, "rgba(255,200,120,.11)");
          for (var dy = 0; dy < 3; dy++) { var hw = 16 - dy * 4; c.fillStyle = "rgba(255,181,71,.10)"; c.fillRect(hx - hw, gy + dy, hw * 2, 1); }
          c.fillStyle = "rgba(255,200,120,.20)";
          c.fillRect(hx - 1, gy + 4, 3, 1); c.fillRect(hx, gy + 6, 2, 1); c.fillRect(hx - 1, gy + 8, 3, 1); c.fillRect(hx, gy + 10, 1, 1);
        } else {
          var lg = c.createRadialGradient(hx, hy, 0, hx, hy, 22);
          lg.addColorStop(0, "rgba(255,205,125,.40)"); lg.addColorStop(.35, "rgba(255,181,71,.14)"); lg.addColorStop(1, "rgba(255,181,71,0)");
          c.fillStyle = lg; c.fillRect(hx - 24, hy - 24, 48, 48);
          c.save(); c.translate(hx, gy + 1); c.scale(1, .16);
          var pg = c.createRadialGradient(0, 0, 0, 0, 0, 20);
          pg.addColorStop(0, "rgba(255,190,100,.55)"); pg.addColorStop(1, "rgba(255,190,100,0)");
          c.fillStyle = pg; c.beginPath(); c.arc(0, 0, 20, 0, 6.2832); c.fill(); c.restore();
        }
        c.fillStyle = "#0a141c"; c.fillRect(x, top, 1, gy - top); c.fillRect(x, top, 5, 1);
        c.fillStyle = "#ffd58f";
        if (!px) { c.shadowColor = "#ffd58f"; c.shadowBlur = S * 4; }
        c.fillRect(x + 3, top + 1, 2, 1);
        c.shadowBlur = 0;
      });
    });
    return cv;
  }

  function genClouds(rng, W, H) {
    var list = [], n = Math.round(W / 120);
    for (var i = 0; i < n; i++) list.push({ x: Math.floor(rng() * W), y: Math.round(H * (.08 + rng() * .26)), w: rint(rng, 24, 48), h: rint(rng, 3, 6) });
    return list;
  }
  function paintClouds(list, px, S, W, H) {
    var cv = newCv(W * S, H * S), c = cv.getContext("2d");
    if (!px) c.scale(S, S);
    list.forEach(function (k) {
      [0, -W].forEach(function (o) {
        var x = k.x + o;
        if (px) {
          var a = Math.round(k.w * .25), b = Math.round(k.w * .45), m = Math.round(k.w * .1);
          c.fillStyle = "rgba(44,66,94,.6)";
          c.fillRect(x + a, k.y, b, 1);
          c.fillRect(x + m, k.y + 1, k.w - m * 2, Math.max(1, k.h - 2));
          c.fillRect(x, k.y + k.h - 1, k.w, 1);
          c.fillStyle = "rgba(255,190,150,.16)"; c.fillRect(x + a, k.y, b, 1);
        } else {
          c.fillStyle = "rgba(44,66,94,.5)"; c.beginPath();
          [[.5, .62, .5, .38], [.3, .5, .3, .34], [.68, .46, .3, .38]].forEach(function (e) {
            var cx = x + k.w * e[0], cy = k.y + k.h * e[1], rx = k.w * e[2], ry = k.h * e[3] + 1;
            c.moveTo(cx + rx, cy); c.ellipse(cx, cy, rx, ry, 0, 0, 6.2832);
          });
          c.fill();
        }
      });
    });
    return cv;
  }

  function genCity(wp, H, px, S, P) {
    var rng = mulberry(20241110), g = Math.round(H * .11);
    var W = Math.max(Math.round(wp * 1.5 / 10) * 10, 480);
    var defs = [
      { id: "far",  speed: 1.4, hMin: .15, hMax: .30, wMin: 10, wMax: 24, p: .08, sign: 0 },
      { id: "mid",  speed: 4,   hMin: .18, hMax: .36, wMin: 12, wMax: 28, p: .15, sign: .12 },
      { id: "near", speed: 9,   hMin: .22, hMax: .42, wMin: 14, wMax: 32, p: .20, sign: .30 }
    ];
    var c = { W: W, H: H, g: g, wp: wp, px: px, S: S, moon: P > 3, style: state.cityStyle, cars: [], nextCar: 3 + Math.random() * 3, rng: Math.random, streetSpeed: 22 };
    c.sky = paintSky(c, px, S);
    var clouds = { def: { id: "clouds", speed: .7 }, beacons: [], dyn: [], cv: paintClouds(genClouds(rng, W, H), px, S, W, H) };
    c.layers = [clouds].concat(defs.map(function (d) {
      var sl = genSkyline(rng, d, W, H, g);
      sl.cv = paintSkyline(sl, px, S, W, H, g);
      return sl;
    }));
    c.birds = []; c.nextBird = 5 + Math.random() * 6; c.star = null; c.nextStar = 12 + Math.random() * 14;
    var st = genStreet(rng, W, H, g);
    st.cv = paintStreet(st, px, S, W, H, g);
    c.street = st;
    return c;
  }

  function buildCity() {
    if (!cityCv || !cc) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var P = vw < 620 ? 3 : (vw < 1500 ? 4 : 5);
    var chPx = Math.max(260, Math.min(620, Math.round(vh * .55)));
    var wp = Math.ceil(vw / P) + 1, hp = Math.ceil(chPx / P);
    var px = state.cityStyle === "pixel", S = px ? 1 : P;
    cityCv.width = wp * S; cityCv.height = hp * S;
    cityCv.style.width = (wp * P) + "px"; cityCv.style.height = (hp * P) + "px";
    cityCv.classList.toggle("is-pixel", px);
    cc.imageSmoothingEnabled = !px;
    city = genCity(wp, hp, px, S, P);
  }

  /* ----- animación ----- */
  function stepCars(dt) {
    var c = city;
    if (cityT >= c.nextCar && c.cars.length < 3) {
      var d = Math.random() < .5 ? 1 : -1, r = Math.random();
      var kind = r < .45 ? "car" : (r < .8 ? "ped" : "bus");
      var v = kind === "ped" ? d * 9 : (kind === "bus" ? (d > 0 ? 24 : -50) : (d > 0 ? 30 : -64));
      c.cars.push({ kind: kind, x: d > 0 ? -34 : c.wp + 34, v: v, col: CAR_COL[Math.floor(Math.random() * CAR_COL.length)], um: NEON[Math.floor(Math.random() * 3)] });
      c.nextCar = cityT + 5 + Math.random() * 9;
    }
    for (var i = c.cars.length - 1; i >= 0; i--) {
      var car = c.cars[i]; car.x += car.v * dt;
      if (car.x < -40 || car.x > c.wp + 40) c.cars.splice(i, 1);
    }
  }

  function paintCarSprite(c, px, car, H) {
    var x = Math.round(car.x), y = H - 2, d = car.v > 0 ? 1 : -1, fx = d > 0 ? x + 12 : x - 1, bx = d > 0 ? x : x + 11;
    if (px) {
      c.fillStyle = "rgba(255,231,184,.15)"; c.fillRect(d > 0 ? x + 12 : x - 9, y - 2, 9, 2);
      c.fillStyle = car.col; c.fillRect(x, y - 3, 12, 3); c.fillRect(x + 3, y - 5, 6, 2);
      c.fillStyle = "#7fa6c0"; c.fillRect(x + 4, y - 5, 4, 1);
      c.fillStyle = "#04080b"; c.fillRect(x + 2, y - 1, 2, 1); c.fillRect(x + 8, y - 1, 2, 1);
      c.fillStyle = "#fff1cf"; c.fillRect(d > 0 ? x + 11 : x, y - 2, 1, 1);
      c.fillStyle = "#ff4d5e"; c.fillRect(d > 0 ? x : x + 11, y - 2, 1, 1);
    } else {
      var bg = c.createLinearGradient(fx, 0, fx + d * 14, 0);
      bg.addColorStop(0, "rgba(255,231,184,.32)"); bg.addColorStop(1, "rgba(255,231,184,0)");
      c.fillStyle = bg; c.fillRect(Math.min(fx, fx + d * 14), y - 2.6, 14, 2.2);
      c.fillStyle = car.col; c.fillRect(x, y - 3, 12, 2.6); c.fillRect(x + 3, y - 5, 6, 2.1);
      c.fillStyle = "rgba(160,200,225,.8)"; c.fillRect(x + 4, y - 4.7, 4, 1.4);
      c.fillStyle = "#04080b"; disc(c, false, x + 3, y - .6, 1.1, "#04080b"); disc(c, false, x + 9, y - .6, 1.1, "#04080b");
      c.shadowColor = "#fff1cf"; c.shadowBlur = 8; c.fillStyle = "#fff6dc"; c.fillRect(fx - (d > 0 ? 1 : 0), y - 2.4, 1, .9);
      c.shadowColor = "#ff4d5e"; c.fillStyle = "#ff4d5e"; c.fillRect(bx, y - 2.4, 1, .9); c.shadowBlur = 0;
    }
  }

  function paintBus(c, px, a, H) {
    var x = Math.round(a.x), y = H - 2, d = a.v > 0 ? 1 : -1, fx = d > 0 ? x + 26 : x - 1;
    if (px) { c.fillStyle = "rgba(255,231,184,.14)"; c.fillRect(d > 0 ? x + 26 : x - 11, y - 3, 11, 3); }
    else {
      var bg = c.createLinearGradient(fx, 0, fx + d * 16, 0);
      bg.addColorStop(0, "rgba(255,231,184,.3)"); bg.addColorStop(1, "rgba(255,231,184,0)");
      c.fillStyle = bg; c.fillRect(Math.min(fx, fx + d * 16), y - 3.4, 16, 3);
    }
    c.fillStyle = "#2f6f66"; c.fillRect(x, y - 8, 26, 6);
    c.fillStyle = "#3f8f84"; c.fillRect(x, y - 8, 26, 1);
    c.fillStyle = "#cfe3df"; c.fillRect(x, y - 3, 26, 1);
    c.fillStyle = "#ffd58f";
    if (!px) { c.shadowColor = "#ffd58f"; c.shadowBlur = 6; }
    for (var i = 0; i < 5; i++) c.fillRect(x + 2 + i * 4, y - 7, 3, 2);
    c.shadowBlur = 0;
    c.fillStyle = "#04080b"; c.fillRect(x + 4, y - 2, 3, 2); c.fillRect(x + 19, y - 2, 3, 2);
    c.fillStyle = "#fff1cf"; c.fillRect(d > 0 ? x + 25 : x, y - 4, 1, 1);
    c.fillStyle = "#ff4d5e"; c.fillRect(d > 0 ? x : x + 25, y - 4, 1, 1);
  }
  function paintPed(c, px, a) {
    var x = Math.round(a.x), y = city.H - city.g + 2, fr = Math.floor(cityT * 6) % 2;
    c.fillStyle = a.um; c.fillRect(x - 3, y - 10, 8, 1); c.fillRect(x - 2, y - 11, 6, 1);
    c.fillStyle = "#1b2a38"; c.fillRect(x + 1, y - 9, 1, 3);
    c.fillStyle = "#e0b89a"; c.fillRect(x, y - 8, 2, 2);
    c.fillStyle = a.col; c.fillRect(x, y - 6, 2, 3);
    c.fillStyle = "#0a1219"; c.fillRect(x + fr, y - 3, 1, 3); c.fillRect(x + 1 - fr, y - 3, 1, 3);
  }
  function paintCar(c, px, car, H) {
    if (car.kind === "bus") paintBus(c, px, car, H);
    else if (car.kind === "ped") paintPed(c, px, car);
    else paintCarSprite(c, px, car, H);
  }

  /* cielo vivo: pájaros y estrellas fugaces */
  function stepSky(dt) {
    var c = city;
    if (cityT >= c.nextBird) {
      var n = rint(Math.random, 2, 4), by = c.H * (.12 + Math.random() * .2), v = 10 + Math.random() * 4;
      for (var i = 0; i < n; i++) c.birds.push({ x: -8 - i * 7, y: Math.round(by + (i % 2 ? 3 : -3) * (i ? 1 : 0)), v: v, ph: Math.random() * 4 });
      c.nextBird = cityT + 16 + Math.random() * 18;
    }
    for (var j = c.birds.length - 1; j >= 0; j--) { c.birds[j].x += c.birds[j].v * dt; if (c.birds[j].x > c.wp + 10) c.birds.splice(j, 1); }
    if (!c.star && cityT >= c.nextStar) {
      c.star = { x: Math.random() * c.wp * .6, y: c.H * (.05 + Math.random() * .15), age: 0 };
      c.nextStar = cityT + 25 + Math.random() * 30;
    }
    if (c.star) { c.star.age += dt; if (c.star.age > .9) c.star = null; }
  }
  function drawSkyLife(c, px) {
    var cy = city;
    cy.birds.forEach(function (b) {
      var up = Math.floor(cityT * 5 + b.ph) % 2, x = Math.round(b.x), y = b.y;
      c.fillStyle = "#6a8cad";
      c.fillRect(x, y, 1, 1);
      c.fillRect(x - 1, y + (up ? -1 : 1), 1, 1); c.fillRect(x + 1, y + (up ? -1 : 1), 1, 1);
    });
    if (cy.star) {
      var s2 = cy.star, k;
      for (k = 0; k < 7; k++) {
        var a = (1 - k / 7) * (1 - s2.age / .9);
        c.fillStyle = "rgba(255,240,215," + a.toFixed(2) + ")";
        var sx = s2.x + s2.age * 40 - k * 1.6, sy = s2.y + s2.age * 17 - k * .7;
        if (px) c.fillRect(Math.round(sx), Math.round(sy), 1, 1); else c.fillRect(sx, sy, 1.1, .8);
      }
    }
  }

  /* detalles animados de las capas: humo, TV, gato */
  var TVC = ["#7fc4ff", "#4a8fd8", "#bfe0ff", "#3a6fb0", "#1d3550"];
  function drawDyn(c, px, d, bx) {
    if (d.t === "smoke") {
      for (var i = 0; i < 4; i++) {
        var a = (cityT * .3 + d.ph + i / 4) % 1, sx = bx - a * 5 + Math.sin(a * 7 + d.ph * 6) * 1.2, sy = d.y - a * 16, sz = a < .5 ? 1 : 2;
        c.fillStyle = "rgba(176,196,212," + ((1 - a) * .4).toFixed(2) + ")";
        if (px) c.fillRect(Math.round(sx), Math.round(sy), sz, sz);
        else { c.beginPath(); c.arc(sx, sy, sz * .7, 0, 6.2832); c.fill(); }
      }
    } else if (d.t === "tv") {
      var k = (Math.floor(cityT * 3 + d.ph * 10) * 7 + Math.floor(d.ph * 100)) % 5;
      c.fillStyle = TVC[k];
      if (px) c.fillRect(bx, d.y, 2, 3);
      else { c.shadowColor = TVC[k]; c.shadowBlur = 8; c.fillRect(bx + .2, d.y + .2, 1.6, 2.6); c.shadowBlur = 0; }
    } else if (d.t === "cat") {
      var bl = ((cityT * .3 + d.ph) % 1) > .94, fr = Math.floor(cityT * 1.4 + d.ph * 3) % 2;
      c.fillStyle = "#03070a";
      if (fr) { c.fillRect(bx + 4, d.y - 1, 2, 1); c.fillRect(bx + 5, d.y - 2, 1, 1); }
      else { c.fillRect(bx + 4, d.y - 2, 1, 2); c.fillRect(bx + 5, d.y - 3, 1, 1); }
      if (!bl) {
        c.fillStyle = "#ffe28a";
        if (!px) { c.shadowColor = "#ffe28a"; c.shadowBlur = 4; }
        c.fillRect(bx + 1, d.y - 5, 1, 1); c.fillRect(bx + 3, d.y - 5, 1, 1); c.shadowBlur = 0;
      }
    }
  }

  function drawCity() {
    var c = city; if (!c) return;
    var W = c.W, H = c.H, px = c.px, S = c.S, wp = c.wp;
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.clearRect(0, 0, cityCv.width, cityCv.height);
    cc.drawImage(c.sky.cv, 0, 0);
    cc.setTransform(px ? 1 : S, 0, 0, px ? 1 : S, 0, 0);
    c.sky.tw.forEach(function (s) {
      var a = .15 + .55 * (.5 + .5 * Math.sin(cityT * 1.5 + s.ph));
      cc.fillStyle = "rgba(240,246,250," + a.toFixed(2) + ")";
      if (px) cc.fillRect(s.x, s.y, 1, 1); else { cc.beginPath(); cc.arc(s.x + .5, s.y + .5, .45, 0, 6.2832); cc.fill(); }
    });
    drawSkyLife(cc, px);
    var all = c.layers.concat([{ cv: c.street.cv, def: { speed: c.streetSpeed }, beacons: [], dyn: [] }]);
    all.forEach(function (l, i) {
      var off = mod(cityT * l.def.speed, W);
      if (px) off = Math.floor(off);
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.drawImage(l.cv, -off * S, 0);
      cc.drawImage(l.cv, (W - off) * S, 0);
      cc.setTransform(px ? 1 : S, 0, 0, px ? 1 : S, 0, 0);
      l.dyn.forEach(function (d) {
        for (var k = 0; k < 2; k++) {
          var bx = d.x - off + k * W;
          if (bx < -8 || bx > wp + 8) continue;
          drawDyn(cc, px, d, bx);
        }
      });
      l.beacons.forEach(function (b) {
        if (((cityT * .8 + b.ph) % 1) > .35) return;
        for (var k = 0; k < 2; k++) {
          var bx = b.x - off + k * W;
          if (bx < -2 || bx > wp + 2) continue;
          cc.fillStyle = "#ff4d5e";
          if (px) cc.fillRect(Math.round(bx), b.y, 1, 1);
          else { cc.shadowColor = "#ff4d5e"; cc.shadowBlur = S * 3.5; cc.beginPath(); cc.arc(bx + .5, b.y + .5, .6, 0, 6.2832); cc.fill(); cc.shadowBlur = 0; }
        }
      });
    });
    c.cars.forEach(function (car) { paintCar(cc, px, car, H); });
    cc.setTransform(1, 0, 0, 1, 0, 0);
  }

  function cityFrame(ts) {
    cityRaf = 0;
    if (!state.city || document.hidden || !city) return;
    var gap = state.mode === "balanced" ? 32 : 15;
    if (cityPrev && ts - cityPrev < gap) { cityRaf = requestAnimationFrame(cityFrame); return; }
    var dt = cityPrev ? Math.min(.1, (ts - cityPrev) / 1000) : 0;
    cityPrev = ts; cityT += dt;
    stepCars(dt);
    stepSky(dt);
    drawCity();
    cityRaf = requestAnimationFrame(cityFrame);
  }

  function syncCity() {
    if (!cityCv || !cc) return;
    if (!state.city) {
      if (cityRaf) { cancelAnimationFrame(cityRaf); cityRaf = 0; }
      cityPrev = 0; city = null;
      cc.clearRect(0, 0, cityCv.width, cityCv.height);
      return;
    }
    if (document.hidden) {
      if (cityRaf) { cancelAnimationFrame(cityRaf); cityRaf = 0; }
      cityPrev = 0;
      return;
    }
    if (!city || city.style !== state.cityStyle) buildCity();
    if (reduceMotion) drawCity();
    else if (!cityRaf) { cityPrev = 0; cityRaf = requestAnimationFrame(cityFrame); }
  }
  document.addEventListener("visibilitychange", syncCity);
  var cz;
  window.addEventListener("resize", function () { clearTimeout(cz); cz = setTimeout(function () { city = null; syncCity(); }, 250); });

  /* ---------- Sonido de lluvia (generado con Web Audio, sin archivos) ---------- */
  var audio = { ctx: null, gain: null };
  function ensureAudio() {
    if (audio.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      var c = new AC();
      var len = c.sampleRate * 3;
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 700;
      var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6200;
      var g = c.createGain(); g.gain.value = 0;
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(c.destination);
      src.start();
      audio.ctx = c; audio.gain = g;
      return true;
    } catch (e) { return false; }
  }
  function setSound(on) {
    if (on) {
      if (!ensureAudio()) { state.sound = false; toast("Tu navegador no permite reproducir sonido"); refresh(); return; }
      if (audio.ctx.resume) audio.ctx.resume();
      audio.gain.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.gain.gain.linearRampToValueAtTime(.075, audio.ctx.currentTime + 1.2);
    } else if (audio.ctx) {
      audio.gain.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.gain.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + .5);
    }
    state.sound = on;
    refresh();
  }

  /* ---------- Controles de ambiente (se reflejan entre sí) ---------- */
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches("input[data-mode]")) {
      applyMode(t.getAttribute("data-mode"));
    } else if (t.matches("input[data-city]")) {
      state.cityStyle = t.getAttribute("data-city");
      if (!state.city) { state.city = true; state.mode = "custom"; }
      refresh();
    } else if (t.matches("input[data-fx]")) {
      var k = t.getAttribute("data-fx");
      if (k === "sound") { setSound(t.checked); return; }
      state[k] = t.checked;
      state.mode = "custom";
      refresh();
    }
  });

  var ambient = $("#ambient");
  var ambientBtn = $("#open-ambient");
  if (ambient && ambientBtn) {
    ambientBtn.addEventListener("click", function () {
      refresh();
      if (ambient.showModal) ambient.showModal(); else ambient.setAttribute("open", "");
    });
    ambient.addEventListener("click", function (e) { if (e.target === ambient) ambient.close(); });
  }
  var soundBtn = $("#sound-btn");
  if (soundBtn) soundBtn.addEventListener("click", function () { setSound(!state.sound); });

  /* ---------- Comanda: contadores al terminar de imprimirse ---------- */
  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion || end <= 1) { el.textContent = end; return; }
    var start = null, dur = 900;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function startTicket() {
    var delay = reduceMotion ? 0 : 2500;
    setTimeout(function () { $$("[data-count]").forEach(countUp); }, delay);
  }
  function ready() {
    if (root.classList.contains("ready")) return;
    root.classList.add("ready");
    startTicket();
  }

  /* ---------- Entrada: el letrero pasa de Cerrado a Abierto ---------- */
  var intro = $("#intro");
  var introForm = $("#intro-form");
  var shell = $$("header.bar, main, footer, .skip-link");

  function setInert(on) {
    shell.forEach(function (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
  }

  if (root.classList.contains("entered") || !intro || !introForm) {
    refresh();
    sizeRain(); syncRain();
    ready();
  } else {
    setInert(true);
    refresh();
    var first = $("input[data-mode]:checked", intro) || $("input", intro);
    if (first) first.focus({ preventScroll: true });

    introForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("button[type=submit]", introForm);
      if (btn) btn.disabled = true;
      var soundWanted = $("input[data-fx=sound]", intro);
      if (soundWanted && soundWanted.checked) setSound(true);
      root.classList.add("opening");
      var flip = reduceMotion ? 0 : 950;
      setTimeout(function () {
        intro.classList.add("leaving");
        sizeRain(); syncRain();
        setTimeout(function () {
          root.classList.add("entered");
          safeSet("sessionStorage", "abierto", "1");
          setInert(false);
          window.scrollTo(0, 0);
          ready();
        }, reduceMotion ? 0 : 600);
      }, flip);
    });
  }
})();
