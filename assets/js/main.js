/* ==========================================================================
   Portafolio — Chris Toloza
   Sin dependencias. Todo lo "extra" es mejora progresiva: la página
   funciona y se lee igual con JavaScript desactivado.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL = "chris.toloza.dev@gmail.com";
  var GH_USER = "ItsChrisPJ";

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Año del footer ---------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Reloj de la waybar (hora de Chile) ---------- */
  var clock = $("#clock");
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Santiago"
      });
    } catch (e) {
      clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
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
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ")";
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal al hacer scroll + contadores ---------- */
  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var out = function (n) { el.innerHTML = n + (suffix ? "<small>" + suffix + "</small>" : ""); };
    if (reduceMotion || end <= 1) { out(end); return; }
    var start = null, dur = 900;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      out(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        var n = $("[data-count]", e.target);
        if (n) countUp(n);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
    $$("[data-count]").forEach(countUp);
  }

  /* ---------- Scroll-spy: workspaces de la waybar ---------- */
  var links = $$(".ws a");
  var wbPath = $("#wb-path");
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("data-sec")); }).filter(Boolean);
  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("data-sec") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    if (wbPath) wbPath.textContent = id;
  }
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Texto que se escribe solo ---------- */
  var typedEl = $("#typed");
  var phrases = [
    "estudiante de Ingeniería en Informática",
    "desarrollador de apps con IA y agentes",
    "construyendo sistemas para negocios reales",
    "usuario de Arch Linux + Hyprland",
    "curioso por naturaleza"
  ];
  if (typedEl && !reduceMotion) {
    var pi = 0, ci = phrases[0].length, deleting = false;
    var run = function () {
      var full = phrases[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = full.slice(0, ci);
      var delay = deleting ? 28 : 55;
      if (!deleting && ci === full.length) { deleting = true; delay = 1900; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 380; }
      setTimeout(run, delay);
    };
    setTimeout(run, 2200);
  }

  /* ---------- Spotlight que sigue al mouse en las tarjetas ---------- */
  if (window.matchMedia && matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
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
        if (show) p.classList.add("in");
      });
    });
  });

  /* ---------- Temas ---------- */
  var THEMES = [
    { id: "tokyo", name: "Tokyo Night", color: "#1a1b26" },
    { id: "mocha", name: "Catppuccin", color: "#1e1e2e" },
    { id: "gruvbox", name: "Gruvbox", color: "#282828" },
    { id: "latte", name: "Claro", color: "#eff1f5" }
  ];
  var themeBtn = $("#theme-btn");
  var themeName = $("#theme-name");
  var metaTheme = $('meta[name="theme-color"]');

  function currentThemeIndex() {
    var id = document.documentElement.dataset.theme;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return i;
    return 0;
  }
  function applyTheme(id, persist) {
    var t = THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0];
    document.documentElement.dataset.theme = t.id;
    if (themeName) themeName.textContent = t.name;
    if (metaTheme) metaTheme.setAttribute("content", t.color);
    if (persist) safeSet("theme", t.id);
  }
  applyTheme(THEMES[currentThemeIndex()].id, false);
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = THEMES[(currentThemeIndex() + 1) % THEMES.length];
    applyTheme(next.id, true);
    toast("Tema: " + next.name);
  });

  /* ---------- Toast + copiar email ---------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  function copyEmail() {
    var done = function () { toast("Email copiado: " + EMAIL); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { window.location.href = "mailto:" + EMAIL; });
    } else {
      window.location.href = "mailto:" + EMAIL;
    }
  }
  var copyBtn = $("#copy-mail");
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* ---------- Paleta de comandos (estilo rofi) ---------- */
  var pal = $("#palette"), palQ = $("#pal-q"), palList = $("#pal-list"), openBtn = $("#open-palette");
  var lastFocus = null, results = [], sel = 0;

  function go(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#" + id);
  }
  var ACTIONS = [
    { l: "Ir a Inicio", h: "1", k: "inicio home", run: function () { go("inicio"); } },
    { l: "Ir a Sobre mí", h: "2", k: "sobre mi about perfil", run: function () { go("sobre-mi"); } },
    { l: "Ir a Proyectos", h: "3", k: "proyectos projects axioma orgpro sushi planner invernadero agenda", run: function () { go("proyectos"); } },
    { l: "Ir a Stack", h: "4", k: "stack habilidades skills tecnologias", run: function () { go("stack"); } },
    { l: "Ir a Trayectoria", h: "5", k: "trayectoria experiencia formacion estudios", run: function () { go("trayectoria"); } },
    { l: "Ir a Contacto", h: "6", k: "contacto contact email", run: function () { go("contacto"); } },
    { l: "Abrir GitHub", h: "abrir ↗", k: "github repos codigo", run: function () { window.open("https://github.com/" + GH_USER, "_blank", "noopener"); } },
    { l: "Abrir Axioma en GitHub", h: "abrir ↗", k: "axioma repo juego debate", run: function () { window.open("https://github.com/" + GH_USER + "/AXIOMA", "_blank", "noopener"); } },
    { l: "Abrir Smart Planner en GitHub", h: "abrir ↗", k: "planner smart agenda supabase repo", run: function () { window.open("https://github.com/" + GH_USER + "/PlannerApp", "_blank", "noopener"); } },
    { l: "Abrir Happy Sushi en GitHub", h: "abrir ↗", k: "happy sushi pwa repo", run: function () { window.open("https://github.com/" + GH_USER + "/Happy-Sushi-Prototype", "_blank", "noopener"); } },
    { l: "Abrir Invernadero IoT en GitHub", h: "abrir ↗", k: "invernadero iot kotlin android repo", run: function () { window.open("https://github.com/" + GH_USER + "/ti3042-u2-invernadero-iot", "_blank", "noopener"); } },
    { l: "Abrir API de agenda en GitHub", h: "abrir ↗", k: "agenda django drf jwt api repo", run: function () { window.open("https://github.com/" + GH_USER + "/ti3041-es03-agenda", "_blank", "noopener"); } },
    { l: "Copiar email", h: "copiar", k: "copiar correo mail", run: copyEmail },
    { l: "Cambiar al siguiente tema", h: "tema", k: "tema color theme", run: function () { themeBtn && themeBtn.click(); } }
  ].concat(THEMES.map(function (t) {
    return { l: "Tema: " + t.name, h: "tema", k: "tema theme " + t.id, run: function () { applyTheme(t.id, true); toast("Tema: " + t.name); } };
  }));

  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function render() {
    var q = norm(palQ.value.trim());
    results = ACTIONS.filter(function (a) { return !q || norm(a.l + " " + a.k).indexOf(q) !== -1; });
    sel = Math.min(sel, Math.max(0, results.length - 1));
    palList.innerHTML = "";
    if (!results.length) {
      var empty = document.createElement("div");
      empty.className = "pal-empty";
      empty.textContent = "command not found: " + palQ.value;
      palList.appendChild(empty);
      palQ.removeAttribute("aria-activedescendant");
      return;
    }
    results.forEach(function (a, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pal-item"; b.id = "pal-opt-" + i;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", i === sel ? "true" : "false");
      var s1 = document.createElement("span"); s1.textContent = a.l;
      var s2 = document.createElement("small"); s2.textContent = a.h;
      b.appendChild(s1); b.appendChild(s2);
      b.addEventListener("mousemove", function () { if (sel !== i) { sel = i; mark(); } });
      b.addEventListener("click", function () { choose(i); });
      palList.appendChild(b);
    });
    palQ.setAttribute("aria-activedescendant", "pal-opt-" + sel);
  }
  function mark() {
    $$(".pal-item", palList).forEach(function (el, i) {
      el.setAttribute("aria-selected", i === sel ? "true" : "false");
      if (i === sel) el.scrollIntoView({ block: "nearest" });
    });
    palQ.setAttribute("aria-activedescendant", "pal-opt-" + sel);
  }
  function openPal() {
    if (!pal) return;
    lastFocus = document.activeElement;
    pal.classList.add("open");
    pal.setAttribute("aria-hidden", "false");
    palQ.value = ""; sel = 0; render();
    palQ.focus();
  }
  function closePal() {
    if (!pal) return;
    pal.classList.remove("open");
    pal.setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function choose(i) {
    var a = results[i];
    if (!a) return;
    closePal();
    setTimeout(a.run, 60);
  }

  if (openBtn) openBtn.addEventListener("click", openPal);
  if (pal) {
    pal.addEventListener("mousedown", function (e) { if (e.target === pal) closePal(); });
    palQ.addEventListener("input", function () { sel = 0; render(); });
    palQ.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, results.length); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(1, results.length); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(sel); }
      else if (e.key === "Tab") { e.preventDefault(); }
    });
  }
  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      pal.classList.contains("open") ? closePal() : openPal();
    } else if (e.key === "/" && !typing && !(pal && pal.classList.contains("open"))) {
      e.preventDefault(); openPal();
    } else if (e.key === "Escape" && pal && pal.classList.contains("open")) {
      closePal();
    }
  });
})();
