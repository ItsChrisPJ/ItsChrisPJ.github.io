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
     AMBIENTE: lluvia, luces, vapor, neón y sonido
     ====================================================================== */
  var MODES = {
    high:     { rain: true,  bokeh: true,  steam: true,  neon: true,  glass: true },
    balanced: { rain: true,  bokeh: true,  steam: false, neon: true,  glass: false },
    low:      { rain: false, bokeh: false, steam: false, neon: false, glass: false }
  };
  var FX_KEYS = ["rain", "bokeh", "steam", "neon"];

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

  var state = { mode: REC, rain: true, bokeh: true, steam: true, neon: true, glass: true, sound: false };
  (function load() {
    var saved = null;
    try { saved = JSON.parse(safeGet("localStorage", "ambiente") || "null"); } catch (e) {}
    if (saved && saved.mode) {
      FX_KEYS.concat(["glass"]).forEach(function (k) { if (typeof saved[k] === "boolean") state[k] = saved[k]; });
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
    var o = { mode: state.mode };
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
    $$("[data-rec]").forEach(function (el) { el.hidden = el.getAttribute("data-rec") !== REC; });
    var sb = $("#sound-btn");
    if (sb) sb.setAttribute("aria-pressed", state.sound ? "true" : "false");
    syncRain();
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
