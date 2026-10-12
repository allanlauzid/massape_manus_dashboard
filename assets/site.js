/* Massapê — painel estratégico · comportamento compartilhado */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var KEY = 'massape-scale';
  var STEPS = [0.9, 1, 1.12, 1.25, 1.4];

  function store(get, value) {
    try {
      if (get) return localStorage.getItem(KEY);
      localStorage.setItem(KEY, value);
    } catch (e) { return null; }
  }

  /* ---------- Tamanho do texto ---------- */
  function currentIndex() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--scale')) || 1;
    var best = 1;
    STEPS.forEach(function (s, i) { if (Math.abs(s - v) < Math.abs(STEPS[best] - v)) best = i; });
    return best;
  }
  var status = document.getElementById('textsize-status');
  function setIndex(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    root.style.setProperty('--scale', STEPS[i]);
    store(false, STEPS[i]);
    if (status) status.textContent = 'Tamanho do texto: ' + Math.round(STEPS[i] * 100) + '%';
  }
  document.querySelectorAll('.textsize button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var a = btn.getAttribute('data-size');
      if (a === 'up') setIndex(currentIndex() + 1);
      else if (a === 'down') setIndex(currentIndex() - 1);
      else setIndex(1);
    });
  });

  /* ---------- Destaque ao chegar numa seção ---------- */
  function headingFor(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    if (/^H[1-6]$/.test(el.tagName)) return el;
    return el.querySelector('h2');
  }
  function arrive(id) {
    if (reduce.matches) return;
    var h = headingFor(id);
    if (!h) return;
    h.classList.remove('arrive');
    void h.offsetWidth;
    h.classList.add('arrive');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id || id === 'conteudo') return;
    var toc = a.closest('details');
    if (toc) toc.removeAttribute('open');
    setTimeout(function () { arrive(id); }, reduce.matches ? 0 : 350);
  });
  if (location.hash) setTimeout(function () { arrive(decodeURIComponent(location.hash.slice(1))); }, 300);

  /* ---------- Seção atual na barra ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy] a[href^="#"]'));
  var chips = document.querySelector('.chips');
  var tocCurrent = document.querySelector('.toc-current');
  var byId = {};
  navLinks.forEach(function (a) { byId[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
  var targets = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var active = null;

  function setActive(id) {
    if (id === active) return;
    active = id;
    navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
    var link = byId[id];
    if (!link) return;
    link.setAttribute('aria-current', 'true');
    if (tocCurrent) tocCurrent.textContent = link.textContent;
    if (chips && chips.contains(link)) {
      var left = link.offsetLeft - chips.clientWidth / 2 + link.offsetWidth / 2;
      chips.scrollTo({ left: left, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }

  if (targets.length && 'IntersectionObserver' in window) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < targets.length; i++) {
        if (visible[targets[i].id]) { setActive(targets[i].id); return; }
      }
    }, { rootMargin: '-15% 0px -70% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Etapas em sequência (o conteúdo já é visível sem isto) ---------- */
  if (!reduce.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    var flows = document.querySelectorAll('.flow');
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        fio.unobserve(en.target);
        Array.prototype.forEach.call(en.target.children, function (li, i) {
          li.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 300, delay: i * 60, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }
          );
        });
      });
    }, { threshold: 0.35 });
    flows.forEach(function (f) { fio.observe(f); });
  }
})();
