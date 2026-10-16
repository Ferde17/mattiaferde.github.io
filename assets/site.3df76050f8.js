(function () {
'use strict';
var doc = document, root = doc.documentElement;
var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
var reduced = function () { return mqReduce.matches; };
var $ = function (s, c) { return (c || doc).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
var store = {
get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
var live = $('[data-live]');
var quietVT = function (vt) {
var quiet = function () {};
['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt[k] && vt[k].catch) vt[k].catch(quiet); });
};
window.addEventListener('pageswap', function (e) {
var vt = e.viewTransition;
if (!vt) return;
quietVT(vt);
var skip = true;
try {
var act = e.activation, to = act && act.entry && act.entry.url ? new URL(act.entry.url) : null;
skip = !to || /^\/(?:work|playground|recipes)\/[^/]+\/[^/]+\//.test(to.pathname);
} catch (err) {}
if (skip) { try { vt.skipTransition(); } catch (err) {} }
});
window.addEventListener('pagereveal', function (e) { if (e.viewTransition) quietVT(e.viewTransition); });
function legacyHash() {
if (location.hash.length < 2) return;
var LEGACY_RECIPES = ['tagliatelle-ragu', 'tortellini-brodo', 'lasagne-bolognese', 'cotoletta-petroniana', 'zuppa-inglese'];
var LEGACY_PAGES = { ricettario: '/recipes/', work: '/work/', 'work-detail': '/work/', play: '/playground/', 'play-detail': '/playground/', about: '/about/', basket: '/basketball/' };
var h = location.hash.slice(1), target = null;
try { h = decodeURIComponent(h); } catch (e) {}
if (h.indexOf('ricetta/') === 0 && LEGACY_RECIPES.indexOf(h.slice(8)) >= 0) target = '/recipes/' + h.slice(8) + '/';
else if (Object.prototype.hasOwnProperty.call(LEGACY_PAGES, h.split('/')[0])) target = LEGACY_PAGES[h.split('/')[0]];
if (target) location.replace((location.pathname.indexOf('/it/') === 0 ? '/it' : '') + target);
}
if (doc.body && doc.body.classList.contains('pg-home')) { legacyHash(); window.addEventListener('hashchange', legacyHash); }
try { if (window.top !== window.self) root.classList.add('is-framed'); } catch (e) { root.classList.add('is-framed'); }
function announce(msg) { if (!live) return; live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }
function syncTheme() {
var dark = root.getAttribute('data-theme') !== 'light';
$$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', dark ? 'true' : 'false'); });
}
syncTheme();
function followStoredTheme() {
var t = store.get('theme');
if ((t !== 'light' && t !== 'dark') || root.getAttribute('data-theme') === t) return;
root.setAttribute('data-theme', t);
syncTheme();
if (window.__particles) window.__particles.rebuild();
}
window.addEventListener('pageshow', function (e) { if (e.persisted) followStoredTheme(); });
window.addEventListener('storage', function (e) { if (e.key === 'theme') followStoredTheme(); });
doc.addEventListener('click', function (e) {
var b = e.target.closest('[data-theme-toggle]');
if (!b) return;
var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
root.setAttribute('data-theme', next);
store.set('theme', next);
syncTheme();
if (window.__particles) window.__particles.rebuild();
});
doc.addEventListener('click', function (e) {
var a = e.target.closest('[data-lang-switch]');
if (a) store.set('lang', a.getAttribute('data-lang-switch'));
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
var cur = $('.c-dot'), fol = $('.c-ring');
if (cur && fol) {
root.classList.add('cc');
var mx = 0, my = 0, fx = 0, fy = 0, raf = 0;
var step = function () {
fx += (mx - fx) * 0.14; fy += (my - fy) * 0.14;
fol.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
raf = (Math.abs(mx - fx) + Math.abs(my - fy) > 0.3) ? requestAnimationFrame(step) : 0;
};
doc.addEventListener('mousemove', function (e) {
mx = e.clientX; my = e.clientY;
if (!root.classList.contains('cc-live')) { root.classList.add('cc-live'); fx = mx; fy = my; }
cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
if (!raf) raf = requestAnimationFrame(step);
}, { passive: true });
doc.addEventListener('mouseover', function (e) {
root.classList.toggle('hov', !!e.target.closest('a,button,label,input,summary,[data-carousel] .car-wrap'));
}, { passive: true });
doc.addEventListener('mouseleave', function () { root.classList.remove('cc-live'); });
}
}
function copyText(t) {
if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacyCopy(t); });
}
return Promise.resolve(legacyCopy(t));
}
function legacyCopy(t) {
var ta = doc.createElement('textarea');
ta.value = t; ta.setAttribute('readonly', '');
ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
doc.body.appendChild(ta); ta.select();
var ok = false;
try { ok = doc.execCommand('copy'); } catch (e) {}
ta.remove();
return ok;
}
function showCopyField(b, text) {
var f = b._field;
if (!f) {
f = doc.createElement('input');
f.type = 'text'; f.readOnly = true; f.className = 'copy-field';
f.setAttribute('aria-label', b.getAttribute('data-fail') || '');
f.addEventListener('focus', function () { f.select(); });
b.insertAdjacentElement('afterend', f);
b._field = f;
}
f.value = text;
f.focus(); f.select();
}
doc.addEventListener('click', function (e) {
var b = e.target.closest('[data-copy]');
if (!b) return;
var text = b.getAttribute('data-copy');
var label = b.querySelector('span:last-child');
var tip = b.querySelector('.tooltip');
if (tip && !tip.hasAttribute('data-text-fail')) tip.setAttribute('data-text-fail', b.getAttribute('data-fail') || '');
copyText(text).then(function (ok) {
var msg = ok ? b.getAttribute('data-done') : b.getAttribute('data-fail');
b.classList.remove('copied', 'done', 'failed');
b.classList.add(ok ? (b.classList.contains('copy') ? 'copied' : 'done') : 'failed');
announce(msg);
if (!b.classList.contains('copy') && label) {
if (!label.hasAttribute('data-orig')) label.setAttribute('data-orig', label.textContent);
label.textContent = msg;
}
if (!ok && b.getAttribute('data-fallback')) { location.href = b.getAttribute('data-fallback'); }
else if (!ok) showCopyField(b, text);
clearTimeout(b._t);
b._t = setTimeout(function () {
b.classList.remove('copied', 'done', 'failed');
if (label && label.hasAttribute('data-orig')) label.textContent = label.getAttribute('data-orig');
}, ok ? 2200 : 4000);
});
});
doc.addEventListener('click', function (e) { if (e.target.closest('[data-print]')) window.print(); });
var btt = $('.btt');
var progress = $('.read-progress span');
var article = $('.post .pd-c') || $('.post');
var scrollQueued = false;
function onScroll() {
scrollQueued = false;
var y = window.scrollY || 0;
if (btt) btt.hidden = y < 700;
if (progress && article) {
var r = article.getBoundingClientRect();
var total = r.height - window.innerHeight * 0.6;
var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
}
}
window.addEventListener('scroll', function () { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();
if (btt) btt.addEventListener('click', function () {
window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
var m = $('#main'); if (m) m.focus({ preventScroll: true });
});
var toc = $('[data-toc]');
if (toc) {
var mqSmall = matchMedia('(max-width: 900px)');
if (mqSmall.matches) toc.removeAttribute('open');
toc.addEventListener('click', function (e) { if (e.target.closest('a') && mqSmall.matches) toc.removeAttribute('open'); });
var links = $$('a', toc);
var map = {};
links.forEach(function (a) { map[decodeURIComponent(a.hash.slice(1))] = a; });
var heads = $$('.pd-c h2[id]').filter(function (h) { return map[h.id]; });
if ('IntersectionObserver' in window && heads.length) {
var active = null;
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) { if (en.isIntersecting) active = en.target.id; });
var top = heads.filter(function (h) { return h.getBoundingClientRect().top < window.innerHeight * 0.35; }).pop();
var id = top ? top.id : active;
links.forEach(function (a) { if (map[id] === a) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}, { rootMargin: '0px 0px -60% 0px' });
heads.forEach(function (h) { io.observe(h); });
}
}
var lb = $('dialog.lb');
if (lb && typeof lb.showModal === 'function') {
var lbImg = $('.lb-img', lb), lbCap = $('.lb-cap', lb), lbCount = $('.lb-count', lb);
var prevB = $('.lb-prev', lb), nextB = $('.lb-next', lb), closeB = $('.lb-close', lb);
var items = [], idx = 0, opener = null;
var tpl = lb.getAttribute('data-count') || '{n} / {total}';
var show = function (i) {
idx = (i + items.length) % items.length;
var a = items[idx], im = a.querySelector('img'), fig = a.closest('figure');
var cap = fig && fig.querySelector('figcaption');
lbImg.removeAttribute('srcset');
lbImg.src = a.getAttribute('href');
lbImg.alt = im ? im.alt : '';
if (a.getAttribute('data-w')) { lbImg.width = +a.getAttribute('data-w'); lbImg.height = +a.getAttribute('data-h'); }
lbCap.textContent = cap ? cap.textContent : '';
lbCount.textContent = items.length > 1 ? tpl.replace('{n}', idx + 1).replace('{total}', items.length) : '';
prevB.hidden = nextB.hidden = items.length < 2;
};
doc.addEventListener('click', function (e) {
var a = e.target.closest('a.zoom');
if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
e.preventDefault();
items = $$('a.zoom');
opener = a;
show(items.indexOf(a));
lb.showModal();
});
prevB.addEventListener('click', function () { show(idx - 1); });
nextB.addEventListener('click', function () { show(idx + 1); });
closeB.addEventListener('click', function () { lb.close(); });
lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-fig')) lb.close(); });
lb.addEventListener('keydown', function (e) {
if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
});
lb.addEventListener('close', function () { lbImg.removeAttribute('src'); if (opener) opener.focus(); });
var sx = null;
lb.addEventListener('pointerdown', function (e) { sx = e.clientX; });
lb.addEventListener('pointerup', function (e) {
if (sx === null || items.length < 2) return;
var dx = e.clientX - sx; sx = null;
if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
});
}
$$('[data-filter]').forEach(function (group) {
var list = $(group.getAttribute('data-filter'));
if (!list) return;
var empty = list.nextElementSibling;
group.addEventListener('click', function (e) {
var b = e.target.closest('button[data-tag]');
if (!b) return;
var tag = b.getAttribute('data-tag');
$$('button[data-tag]', group).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
var shown = 0;
$$('li[data-tags]', list).forEach(function (li) {
var ok = !tag || li.getAttribute('data-tags').split('|').indexOf(tag) >= 0;
li.hidden = !ok; if (ok) shown++;
});
if (empty && empty.classList.contains('wl-empty')) empty.hidden = shown > 0;
});
});
var rbList = $('[data-rb-list]');
if (rbList) {
var rows = $$('.rb-row', rbList);
var search = $('[data-rb-search]');
var count = $('[data-count]');
var resetRow = $('.rb-reset-row');
var emptyR = $('.rb-empty');
var filters = {};
var fold = function (x) { x = (x || '').toLowerCase(); return x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x; };
rows.forEach(function (r) { r.setAttribute('data-search', fold(r.getAttribute('data-search'))); });
var apply = function () {
var q = fold((search && search.value || '').trim());
var n = 0;
rows.forEach(function (r) {
var ok = Object.keys(filters).every(function (k) { return !filters[k] || r.getAttribute('data-' + k) === filters[k]; });
if (ok && q) ok = q.split(/\s+/).every(function (w) { return r.getAttribute('data-search').indexOf(w) >= 0; });
r.hidden = !ok; if (ok) n++;
});
if (count) count.textContent = count.getAttribute('data-tpl').replace('{n}', n).replace('{total}', count.getAttribute('data-total'));
var active = q || Object.keys(filters).some(function (k) { return filters[k]; });
if (resetRow) resetRow.hidden = !active;
if (emptyR) emptyR.hidden = n > 0;
};
if (search) search.addEventListener('input', apply);
doc.addEventListener('click', function (e) {
var c = e.target.closest('.rb-chip');
if (c) {
var k = c.getAttribute('data-facet');
filters[k] = c.getAttribute('data-v');
$$('.rb-chip[data-facet="' + k + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
apply();
}
if (e.target.closest('[data-rb-reset]')) {
filters = {};
if (search) search.value = '';
$$('.rb-chip').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-v') ? 'false' : 'true'); });
apply();
if (search) search.focus();
}
});
}
$$('.bk-tl-wrap').forEach(function (wrap) {
var outer = $('.bk-slider-outer', wrap), cards = $$('.bk-card', wrap), dots = $$('.bk-dot', wrap);
var prev = $('[data-dir="-1"]', wrap), next = $('[data-dir="1"]', wrap);
if (!outer || !cards.length) return;
var stepW = function () { var a = cards[0].getBoundingClientRect(), b = cards[1] ? cards[1].getBoundingClientRect() : a; return (b.left - a.left) || a.width; };
var behavior = function () { return reduced() ? 'auto' : 'smooth'; };
var update = function () {
var i = Math.round(outer.scrollLeft / stepW());
var max = outer.scrollWidth - outer.clientWidth - 2;
if (outer.scrollLeft >= max) i = cards.length - 1;
dots.forEach(function (d, j) { d.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
if (prev) prev.disabled = outer.scrollLeft <= 2;
if (next) next.disabled = outer.scrollLeft >= max;
};
var q = false;
outer.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(function () { q = false; update(); }); } }, { passive: true });
wrap.addEventListener('click', function (e) {
var a = e.target.closest('[data-dir]');
if (a) outer.scrollBy({ left: +a.getAttribute('data-dir') * stepW(), behavior: behavior() });
var d = e.target.closest('.bk-dot');
if (d) outer.scrollTo({ left: cards[dots.indexOf(d)].offsetLeft - cards[0].offsetLeft, behavior: behavior() });
});
outer.addEventListener('keydown', function (e) {
if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); outer.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * stepW(), behavior: behavior() }); }
});
update();
});
$$('[data-carousel]').forEach(function (car) {
var slides = $$('.car-slide', car), dots = $$('.car-dot', car), pp = $('.car-pp', car);
var n = slides.length;
if (n < 2) return;
var i = 0, timer = 0, steps = 0, paused = reduced(), hover = false;
var render = function () {
slides.forEach(function (s, j) {
var o = ((j - i) % n + n) % n; if (o > n / 2) o -= n;
s.className = 'car-slide ' + (o === 0 ? 'cur' : o === -1 ? 'prv' : o === 1 ? 'nxt' : o < -1 ? 'prv2' : 'nxt2');
if (o === 0) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
});
dots.forEach(function (d, j) { d.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
};
var go = function (j) { i = (j + n) % n; render(); };
var stop = function () { clearInterval(timer); timer = 0; };
var setPaused = function (p) {
paused = p;
if (pp) { pp.classList.toggle('paused', p); pp.setAttribute('aria-label', pp.getAttribute(p ? 'data-l-play' : 'data-l-pause')); }
if (p) stop(); else start();
};
var start = function () {
stop();
if (paused || hover || doc.hidden || steps >= n) return;
timer = setInterval(function () {
go(i + 1); steps++;
if (steps >= n) setPaused(true);
}, 3500);
};
car.addEventListener('mouseenter', function () { hover = true; stop(); });
car.addEventListener('mouseleave', function () { hover = false; start(); });
car.addEventListener('focusin', function () { hover = true; stop(); });
car.addEventListener('focusout', function () { hover = false; start(); });
doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else start(); });
$('.car-wrap', car).addEventListener('click', function () { go(i + 1); setPaused(true); });
dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); setPaused(true); }); });
if (pp) pp.addEventListener('click', function () { if (paused) steps = 0; setPaused(!paused); });
if (reduced()) setPaused(true); else start();
});
doc.addEventListener('click', function (e) {
var b = e.target.closest('button.acc-hd');
if (!b) return;
var open = b.getAttribute('aria-expanded') === 'true';
var list = b.closest('.acc-list');
if (list) $$('button.acc-hd[aria-expanded="true"]', list).forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
b.setAttribute('aria-expanded', open ? 'false' : 'true');
});
(function () {
var els = $$('.eq, .table-wrap, pre[tabindex]');
if (!els.length) return;
var edges = function (el) {
var max = el.scrollWidth - el.clientWidth;
el.classList.toggle('ovf-l', max > 1 && el.scrollLeft > 1);
el.classList.toggle('ovf-r', max > 1 && el.scrollLeft < max - 1);
};
var check = function () {
els.forEach(function (el) {
var over = el.scrollWidth > el.clientWidth + 1;
el.classList.toggle('ovf', over);
if (over) el.setAttribute('tabindex', '0');
else if (el !== doc.activeElement) el.removeAttribute('tabindex');
edges(el);
});
};
els.forEach(function (el) { el.addEventListener('scroll', function () { edges(el); }, { passive: true }); });
var t;
window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(check, 120); });
check();
(doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(check);
})();
var wrap = $('[data-particles]');
if (wrap && window.HTMLCanvasElement) {
var sizer = $('.name-sizer', wrap);
var P = { pts: [], ctx: null, cvs: null, af: 0, hover: false, mx: 0, my: 0, r: 100, dpr: 1, pending: false };
var rand = function (max, min) { return min + Math.random() * (max - min); };
var draw = function () {
var c = P.ctx; if (!c) return;
c.clearRect(0, 0, P.cvs.width / P.dpr, P.cvs.height / P.dpr);
for (var k = 0; k < P.pts.length; k++) {
var p = P.pts[k];
c.fillStyle = p.c;
c.beginPath(); c.arc(p.cx, p.cy, p.cr, 0, 6.2832); c.fill();
}
};
var anim = function () {
if (!P.ctx) { P.af = 0; return; }
var moved = false;
for (var k = 0; k < P.pts.length; k++) {
var p = P.pts[k];
if (P.hover) {
var dx = p.cx - P.mx, dy = p.cy - P.my, dist = Math.sqrt(dx * dx + dy * dy);
if (dist < P.r && dist > 0) { var f = Math.min(p.f, ((P.r - dist) / dist) * 2); p.cx += (dx / dist) * f; p.cy += (dy / dist) * f; moved = true; }
}
var ox = p.ox - p.cx, oy = p.oy - p.cy, od = Math.sqrt(ox * ox + oy * oy);
if (od > 0.5) { var rs = Math.min(od * 0.1, 3); p.cx += (ox / od) * rs; p.cy += (oy / od) * rs; moved = true; } else { p.cx = p.ox; p.cy = p.oy; }
}
draw();
P.af = (moved || P.hover) ? requestAnimationFrame(anim) : 0;
};
var build = function () {
if (P.af) { cancelAnimationFrame(P.af); P.af = 0; }
var wr = wrap.getBoundingClientRect();
if (!wr.width || !wr.height) { P.pending = true; return; }
P.pending = false;
var old = $('canvas', wrap); if (old) old.remove();
wrap.classList.remove('ready');
var dpr = P.dpr = Math.min(window.devicePixelRatio || 1, 2);
var W = Math.round(wr.width * dpr), H = Math.round(wr.height * dpr);
var cvs = doc.createElement('canvas');
cvs.width = W; cvs.height = H;
cvs.style.width = wr.width + 'px'; cvs.style.height = wr.height + 'px';
cvs.setAttribute('aria-hidden', 'true');
var off = doc.createElement('canvas'); off.width = W; off.height = H;
var oc = off.getContext('2d', { willReadFrequently: true }); oc.scale(dpr, dpr);
var cs = getComputedStyle(sizer);
var fs = parseFloat(cs.fontSize) || 48;
P.r = Math.max(50, fs * 1.5);
oc.font = '900 ' + fs + 'px ' + cs.fontFamily;
if ('letterSpacing' in oc) oc.letterSpacing = '0px';
oc.textBaseline = 'alphabetic';
$$('span', sizer).forEach(function (s) {
var r = s.getBoundingClientRect();
var t = s.textContent.toUpperCase();
var m = oc.measureText(t);
var fA = m.fontBoundingBoxAscent || fs * 0.8, fD = m.fontBoundingBoxDescent || fs * 0.2;
oc.fillStyle = getComputedStyle(s).color;
oc.fillText(t, r.left - wr.left, r.top - wr.top + (r.height - (fA + fD)) / 2 + fA);
});
var data = oc.getImageData(0, 0, W, H).data;
var step = dpr >= 2 ? 5 : 3;
var pitch = step / dpr;
var rMin = Math.max(0.8, pitch * 0.38), rMax = Math.max(0.95, pitch * 0.46);
var pts = [];
for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
var i = (y * W + x) * 4;
if (data[i + 3] > 100) {
var v = function (c) { return Math.max(0, Math.min(255, c + rand(13, -13))) | 0; };
pts.push({ ox: x / dpr, oy: y / dpr, cx: x / dpr, cy: y / dpr, cr: rand(rMax, rMin), f: rand(95, 65), c: 'rgb(' + v(data[i]) + ',' + v(data[i + 1]) + ',' + v(data[i + 2]) + ')' });
}
}
if (!pts.length) return;
P.pts = pts; P.cvs = cvs; P.ctx = cvs.getContext('2d'); P.ctx.scale(dpr, dpr);
wrap.appendChild(cvs);
draw();
wrap.classList.add('ready');
};
var rebuild = function () { clearTimeout(P.t); P.t = setTimeout(build, 80); };
window.__particles = { rebuild: rebuild };
if (!reduced()) {
wrap.addEventListener('pointermove', function (e) {
if (!P.cvs) return;
var r = P.cvs.getBoundingClientRect();
P.hover = true; P.mx = e.clientX - r.left; P.my = e.clientY - r.top;
if (!P.af) P.af = requestAnimationFrame(anim);
});
wrap.addEventListener('pointerleave', function () { P.hover = false; if (!P.af) P.af = requestAnimationFrame(anim); });
}
var lastW = 0;
if ('ResizeObserver' in window) {
new ResizeObserver(function (en) {
var w = Math.round(en[0].contentRect.width);
if (w && (w !== lastW || P.pending)) { lastW = w; rebuild(); }
}).observe(wrap);
}
(doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { setTimeout(build, 120); });
}
})();