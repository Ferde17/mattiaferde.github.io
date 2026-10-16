/* Trial build only: Italian label + link to the Italian case study when the visitor
   came from the Italian page (?lang=it) or chose Italian on the portfolio (localStorage
   "lang", same origin). The default markup is English and works without this file. */
(function () {
  var a = document.querySelector('[data-trial-link]');
  if (!a) return;
  var lang = null;
  try { lang = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (lang !== 'it' && lang !== 'en') { try { lang = localStorage.getItem('lang'); } catch (e) {} }
  if (lang !== 'it') return;
  var nav = document.querySelector('[data-trial-nav]');
  (nav || a).setAttribute('lang', 'it');
  if (nav) nav.setAttribute('aria-label', 'Caso studio');
  var t = a.querySelectorAll('[data-it]');
  for (var i = 0; i < t.length; i++) t[i].textContent = t[i].getAttribute('data-it');
  // /work/frame-design/try/ -> /it/work/frame-design/ (kept relative, like the EN "../")
  if (/\/work\/frame-design\/try\/(index\.html)?$/.test(location.pathname)) a.setAttribute('href', '../../../it/work/frame-design/');
})();
