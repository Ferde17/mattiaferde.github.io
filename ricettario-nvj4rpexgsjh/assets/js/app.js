/* ==========================================================================
   Ricettario — app a pagina singola, nessuna dipendenza.
   Rotte (hash):  #/            → elenco ricette con filtri
                  #/prep        → sezione Meal prep (ricette con "sezione": "prep")
                  #/<id>        → scheda della singola ricetta
   Dati:          data/ricette.json
   ========================================================================== */
(() => {
  'use strict';

  const DATA_URL = 'data/ricette.json';
  const FILTERS_KEY = 'ricettario:filtri';
  const THEME_KEY = 'ricettario:tema';

  // Tappe dello slider del tempo (minuti): fitte sui tempi brevi, larghe su quelli lunghi.
  const TIME_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120, 150, 180, 210, 240,
    300, 360, 420, 480, 600, 720, 960, 1200, 1440, 2160, 2880, 4320];

  const SORTS = [
    { id: 'categoria', nome: 'Per categoria' },
    { id: 'az', nome: 'A → Z' },
    { id: 'tempo', nome: 'Più veloci' },
    { id: 'recenti', nome: 'Aggiunte di recente' },
    { id: 'proteine', nome: 'Più proteine' },
    { id: 'densita', nome: 'Più proteine per kcal' },
    { id: 'kcal', nome: 'Meno calorie' },
  ];

  /* Filtri a faccette per le ricette con dati nutrizionali e tag (proteina, base, cucina…).
     `all: true` = la ricetta deve avere tutte le voci scelte; altrimenti basta una. */
  const FACETS = {
    collezioni: { title: 'Raccolta', get: (r) => r.collezioni || [] },
    proteine: { title: 'Proteina', get: (r) => (r.proteina ? [r.proteina] : []) },
    basi: { title: 'Base', get: (r) => (r.base ? [r.base] : []) },
    cucine: { title: 'Cucina', get: (r) => r.cucina || [] },
    stili: { title: 'Stile', get: (r) => r.stile || [] },
    caratt: { title: 'Caratteristiche', get: (r) => r.caratt || [], all: true },
    kcal: { title: 'Calorie a porzione', get: (r) => (r.fasciaKcal ? [r.fasciaKcal] : []) },
  };
  const FACET_KEYS = Object.keys(FACETS);

  /* Riquadro colorato al posto della foto: colore dalla proteina, disegno dalla base. */
  const BASE_ICON = {
    riso: '<path d="M3 12h18a9 9 0 0 1-18 0Z"/><path d="M8 8c0-1.6 1-2 1-3.5M12 8c0-1.6 1-2 1-3.5M16 8c0-1.6 1-2 1-3.5"/>',
    pasta: '<path d="M8 3v8M12 3v8M16 3v8"/><path d="M8 11c0 3.2 8 3.2 8 0M12 14v7"/>',
    noodles: '<path d="M3 7c3-3 6 3 9 0s6 3 9 0M3 13c3-3 6 3 9 0s6 3 9 0M3 19c3-3 6 3 9 0s6 3 9 0"/>',
    legumi: '<ellipse cx="8.5" cy="9" rx="3.2" ry="5" transform="rotate(-30 8.5 9)"/><ellipse cx="15.5" cy="15" rx="3.2" ry="5" transform="rotate(-30 15.5 15)"/>',
    pane: '<path d="M4 19V11a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8Z"/><path d="M9 7v4M14 7v4"/>',
    patate: '<path d="M5 13c0-4 4-8 9-7s6 6 3 10-9 5-11 2c-1-1-1-3-1-5Z"/><path d="M10 11h.01M14 14h.01M9 16h.01"/>',
    nessuna: '<path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14Z"/><path d="M5 19 14 10"/>',
    impasto: '<path d="M3 15a9 5 0 0 1 18 0v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M8 12.5v1.5M12 12v2M16 12.5v1.5"/>',
  };
  const tile = (r, big = false) => (r.proteina
    ? `<span class="tile${big ? ' tile-big' : ''}" data-p="${esc(r.proteina)}" aria-hidden="true"><svg viewBox="0 0 24 24">${BASE_ICON[r.base] || BASE_ICON.nessuna}</svg></span>`
    : '');

  const ICON = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ahead: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 12h18"/><path d="M8 8V5h8v3"/></svg>',
    fridge: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 10h14M8.5 6v1.5M8.5 13v3"/></svg>',
    snow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>',
  };

  const SECTIONS = {
    ricette: { hash: '#/', nome: 'Ricette', back: 'Tutte le ricette' },
    prep: { hash: '#/prep', nome: 'Meal prep', back: 'Meal prep' },
  };

  const app = document.getElementById('app');
  const brand = document.getElementById('brand');
  const topbarActions = document.getElementById('topbar-actions');

  let db = null;          // { categorie, pasti, difficolta, costo, fonti, ricette }
  let steps = [0, 60];    // tappe effettive dello slider (in base ai dati)
  let filters = null;     // filtri della sezione corrente (ogni sezione ha i suoi)
  let section = 'ricette'; // 'ricette' | 'prep'
  let view = null;        // 'list' | 'recipe'
  let listScrollY = 0;
  let lastFocus = null;

  /* ---------------------------------------------------------------- utilità */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const $ = (sel, root = app) => root.querySelector(sel);
  const $$ = (sel, root = app) => Array.from(root.querySelectorAll(sel));

  const storage = {
    get(key, area = 'localStorage') {
      try { return JSON.parse(window[area].getItem(key)); } catch { return null; }
    },
    set(key, value, area = 'localStorage') {
      try { window[area].setItem(key, JSON.stringify(value)); } catch { /* storage non disponibile */ }
    },
  };

  function fmtTime(min, { zero = false } = {}) {
    if (min == null || Number.isNaN(min)) return '';
    if (min === 0) return zero ? '0 min' : '';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  const byId = (list, id) => (list || []).find((x) => x.id === id);
  const catName = (id) => byId(db.categorie, id)?.nome ?? '';
  const pastoName = (id) => byId(db.pasti, id)?.nome ?? id;
  const diff = (id) => byId(db.difficolta, id);
  const cost = (id) => byId(db.costo, id);
  const fonte = (id) => byId(db.fonti, id);

  /** Costo come scala di €: pieni fino al livello, gli altri sbiaditi. */
  function euros(level, max) {
    if (!level) return '';
    return `<span class="euros" aria-hidden="true"><b>${'€'.repeat(level)}</b><i>${'€'.repeat(Math.max(0, max - level))}</i></span>`;
  }
  const costMax = () => Math.max(1, ...(db.costo || []).map((c) => c.livello || 0));
  const sourceBadge = (r) => {
    const f = fonte(r.fonte);
    return f ? `<span class="tag-src" title="Ricetta tratta da ${esc(f.nome)}">${esc(f.sigla || f.nome)}</span>` : '';
  };

  function dots(level, max = 3) {
    let out = '<span class="dots" aria-hidden="true">';
    for (let i = 1; i <= max; i++) out += `<i class="${i <= level ? 'on' : ''}"></i>`;
    return out + '</span>';
  }

  function totalTime(r) {
    const t = r.tempi || {};
    if (Number.isFinite(t.totale)) return t.totale;
    const parts = [t.preparazione, t.cottura, t.riposo].filter(Number.isFinite);
    return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
  }

  function slugFileName(title) {
    return String(title).replace(/[\\/:*?"<>|]+/g, '').trim() || 'ricetta';
  }

  /* ---------------------------------------------------------------- dati */
  function prepareData(raw) {
    const data = {
      categorie: raw.categorie || [],
      pasti: raw.pasti || [],
      difficolta: raw.difficolta || [],
      costo: raw.costo || [],
      fonti: raw.fonti || [],
      prepRegole: Array.isArray(raw.prepRegole) ? raw.prepRegole : [],
      ricette: (raw.ricette || []).filter((r) => r && r.id && r.titolo),
    };
    for (const k of FACET_KEYS) data[k] = Array.isArray(raw[k]) ? raw[k] : [];
    for (const r of data.ricette) {
      r._section = r.sezione === 'prep' && r.prep ? 'prep' : 'ricette';
      r.pasti = Array.isArray(r.pasti) ? r.pasti : [];
      r.ingredienti = Array.isArray(r.ingredienti) ? r.ingredienti : [];
      r.procedimento = Array.isArray(r.procedimento) ? r.procedimento : [];
      r._tot = totalTime(r);
      const ingr = r.ingredienti.map((i) => (typeof i === 'string' ? i : i?.sezione || '')).join(' ');
      const src = byId(data.fonti, r.fonte);
      const facetNames = FACET_KEYS.flatMap((k) => FACETS[k].get(r).map((v) => byId(data[k], v)?.nome || v));
      r._search = norm([r.titolo, r.descrizione, ingr, byId(data.categorie, r.categoria)?.nome, src?.nome, src?.sigla, ...facetNames].join(' '));
    }
    return data;
  }

  function buildSteps() {
    const max = Math.max(0, ...db.ricette.map((r) => r._tot ?? 0));
    const out = TIME_STEPS.filter((s) => s < max);
    out.push(TIME_STEPS.find((s) => s >= max) ?? Math.ceil(max / 60) * 60);
    if (out.length < 2) return [0, 60];
    return out;
  }

  /** Le ricette della sezione corrente: le meal prep stanno in una sezione a parte. */
  const pool = () => db.ricette.filter((r) => r._section === section);

  /* ---------------------------------------------------------------- filtri */
  const defaultFilters = () => ({
    q: '', pasti: [], categorie: [], difficolta: [], costo: [], fonti: [],
    ...Object.fromEntries(FACET_KEYS.map((k) => [k, []])),
    anticipo: 'tutte', congela: 'tutte', tmin: 0, tmax: null, ordina: 'categoria',
  });

  const filtersByKey = {};
  const filtersKey = (s) => (s === 'ricette' ? FILTERS_KEY : `${FILTERS_KEY}:${s}`);
  function loadFilters(s = section) {
    if (filtersByKey[s]) return filtersByKey[s];
    const saved = storage.get(filtersKey(s), 'sessionStorage');
    const f = { ...defaultFilters(), ...(saved && typeof saved === 'object' ? saved : {}) };
    for (const k of ['pasti', 'categorie', 'difficolta', 'costo', 'fonti', ...FACET_KEYS]) if (!Array.isArray(f[k])) f[k] = [];
    if (!SORTS.some((x) => x.id === f.ordina)) f.ordina = 'categoria';
    filtersByKey[s] = f;
    return f;
  }
  function setSection(s) {
    section = s;
    filters = loadFilters(s);
  }
  const saveFilters = () => { filtersByKey[section] = filters; storage.set(filtersKey(section), filters, 'sessionStorage'); };

  const timeActive = (f) => f.tmin > 0 || f.tmax != null;
  const activeCount = (f) => f.pasti.length + f.categorie.length + f.difficolta.length + f.costo.length + f.fonti.length
    + FACET_KEYS.reduce((n, k) => n + f[k].length, 0)
    + (f.anticipo !== 'tutte' ? 1 : 0) + (f.congela !== 'tutte' ? 1 : 0) + (timeActive(f) ? 1 : 0);

  function hasValue(r, group, value) {
    if (group === 'pasti') return r.pasti.includes(value);
    if (group === 'categorie') return r.categoria === value;
    if (group === 'difficolta') return r.difficolta === value;
    if (group === 'costo') return r.costo === value;
    if (group === 'fonti') return r.fonte === value;
    if (FACETS[group]) return FACETS[group].get(r).includes(value);
    return false;
  }

  /** La ricetta rispetta i filtri? `skip` esclude un gruppo (per i conteggi a faccette). */
  function matches(r, f, skip) {
    if (skip !== 'q' && f.q.trim()) {
      const terms = norm(f.q).split(/\s+/).filter(Boolean);
      if (!terms.every((t) => r._search.includes(t))) return false;
    }
    if (skip !== 'pasti' && f.pasti.length && !f.pasti.some((p) => r.pasti.includes(p))) return false;
    if (skip !== 'categorie' && f.categorie.length && !f.categorie.includes(r.categoria)) return false;
    if (skip !== 'difficolta' && f.difficolta.length && !f.difficolta.includes(r.difficolta)) return false;
    if (skip !== 'costo' && f.costo.length && !f.costo.includes(r.costo)) return false;
    if (skip !== 'fonti' && f.fonti.length && !f.fonti.includes(r.fonte)) return false;
    for (const k of FACET_KEYS) {
      if (skip === k || !f[k].length) continue;
      const have = FACETS[k].get(r);
      if (!(FACETS[k].all ? f[k].every((v) => have.includes(v)) : f[k].some((v) => have.includes(v)))) return false;
    }
    if (skip !== 'anticipo' && f.anticipo !== 'tutte' && (f.anticipo === 'si') !== (r.anticipo === true)) return false;
    if (skip !== 'congela' && f.congela !== 'tutte' && (f.congela === 'si') !== (r.prep?.congelabile === true)) return false;
    if (skip !== 'tempo' && timeActive(f)) {
      if (r._tot == null) return false;
      if (r._tot < f.tmin) return false;
      if (f.tmax != null && r._tot > f.tmax) return false;
    }
    return true;
  }

  function sortRecipes(list, mode) {
    const az = (a, b) => a.titolo.localeCompare(b.titolo, 'it', { sensitivity: 'base' });
    const arr = list.slice();
    if (mode === 'tempo') return arr.sort((a, b) => (a._tot ?? Infinity) - (b._tot ?? Infinity) || az(a, b));
    const by = (get, dir) => arr.sort((a, b) => {
      const x = get(a); const y = get(b);
      if (x == null && y == null) return az(a, b);
      if (x == null) return 1;
      if (y == null) return -1;
      return (dir === 'desc' ? y - x : x - y) || az(a, b);
    });
    if (mode === 'proteine') return by((r) => r.macro?.proteine, 'desc');
    if (mode === 'densita') return by((r) => r.macro?.proteine100kcal, 'desc');
    if (mode === 'kcal') return by((r) => r.macro?.kcal, 'asc');
    if (mode === 'recenti') return arr.sort((a, b) => String(b.aggiunta || '').localeCompare(String(a.aggiunta || '')) || az(a, b));
    if (mode === 'categoria') {
      const order = new Map(db.categorie.map((c, i) => [c.id, i]));
      return arr.sort((a, b) => (order.get(a.categoria) ?? 999) - (order.get(b.categoria) ?? 999) || az(a, b));
    }
    return arr.sort(az);
  }

  const currentList = () => sortRecipes(pool().filter((r) => matches(r, filters)), filters.ordina);

  /* ---------------------------------------------------------------- barra superiore */
  function setTopbar(mode, r) {
    if (mode === 'recipe') {
      const sec = SECTIONS[r._section];
      brand.href = sec.hash;
      brand.innerHTML = `${ICON.back}<span>${sec.back}</span>`;
      brand.setAttribute('aria-label', `Torna a ${sec.back.toLocaleLowerCase('it')}`);
      topbarActions.innerHTML = r.pdf
        ? `<a class="btn btn-sm btn-pdf" href="${esc(r.pdf)}" download="${esc(slugFileName(r.titolo))}.pdf">${ICON.download}<span class="lbl-long">Scarica PDF</span><span class="lbl-short">PDF</span></a>`
        : '';
    } else {
      brand.href = '#/';
      brand.textContent = 'Ricettario';
      brand.removeAttribute('aria-label');
      topbarActions.innerHTML = '';
    }
  }

  /* ================================================================ ELENCO */
  function usedOptions(list, group) {
    const items = pool();
    return list.filter((o) => items.some((r) => hasValue(r, group, o.id)));
  }

  function chipGroup(group, title, options, withDots = false, withEuros = false) {
    if (!options.length) return '';
    return `
      <fieldset class="fgroup">
        <legend class="flabel">${title}</legend>
        <div class="chips">
          ${options.map((o) => `
            <button type="button" class="chip" data-group="${group}" data-value="${esc(o.id)}" aria-pressed="false">
              ${withDots ? dots(o.livello || 0) : ''}${withEuros ? euros(o.livello || 0, costMax()) : ''}${esc(o.nome)}<span class="chip-n"></span>
            </button>`).join('')}
        </div>
      </fieldset>`;
  }

  function sectionTabs() {
    const count = (s) => db.ricette.filter((r) => r._section === s).length;
    if (!count('prep')) return '';
    return `
      <nav class="sec-tabs" aria-label="Sezioni del ricettario">
        ${Object.entries(SECTIONS).map(([id, s]) => `
          <a href="${s.hash}" class="sec-tab"${id === section ? ' aria-current="page"' : ''}>${id === 'prep' ? ICON.box : ''}${s.nome}<span>${count(id)}</span></a>`).join('')}
      </nav>`;
  }

  function prepRulesHtml() {
    if (!db.prepRegole.length) return '';
    return `
      <details class="prep-rules">
        <summary>Le regole del meal prep <span>conservare, scongelare, riscaldare</span></summary>
        <ol>${db.prepRegole.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      </details>`;
  }

  function renderList() {
    view = 'list';
    const isPrep = section === 'prep';
    document.title = isPrep ? 'Meal prep · Ricettario' : 'Ricettario';
    setTopbar('list');

    const items = pool();
    const n = items.length;
    const nCat = new Set(items.map((r) => r.categoria).filter(Boolean)).size;
    const nAhead = items.filter((r) => r.anticipo === true).length;
    const nFreeze = items.filter((r) => r.prep?.congelabile === true).length;
    const last = steps.length - 1;

    app.innerHTML = `
      <div class="wrap">
        <header class="hero">
          <p class="hero-desc">${isPrep
            ? 'Piatti da preparare in anticipo, conservare e ravvivare nei giorni successivi.'
            : 'La raccolta personale di ricette di Mattia Ferdeghini.'}</p>
          <h1 class="hero-title">${isPrep ? 'Meal prep' : 'Ricettario'}</h1>
          <span class="rule" aria-hidden="true"></span>
          <p class="meta-line">
            <span><b>Ricette</b>${n}</span>
            <span><b>Categorie</b>${nCat}</span>
            ${isPrep ? `<span><b>Congelabili</b>${nFreeze}</span>` : `<span><b>In anticipo</b>${nAhead}</span>`}
          </p>
          <span class="rule" aria-hidden="true"></span>
          ${sectionTabs()}
          ${isPrep ? prepRulesHtml() : ''}
        </header>

        <div class="layout">
          <div class="panel-backdrop" data-action="close-panel"></div>
          <aside class="panel" id="filtri" aria-label="Filtri">
            <div class="panel-head">
              <h2>Filtri</h2>
              <button type="button" class="icon-btn" data-action="close-panel" aria-label="Chiudi filtri">${ICON.close}</button>
            </div>
            <div class="panel-body">
              ${chipGroup('pasti', 'Pasto', usedOptions(db.pasti, 'pasti'))}
              ${chipGroup('categorie', 'Categoria', usedOptions(db.categorie, 'categorie'))}
              ${FACET_KEYS.map((k) => chipGroup(k, FACETS[k].title, usedOptions(db[k], k))).join('')}
              <fieldset class="fgroup">
                <legend class="flabel">Tempo totale</legend>
                <p class="range-value" id="tval" aria-live="polite"></p>
                <div class="range">
                  <div class="range-track"></div>
                  <div class="range-fill" id="tfill"></div>
                  <input type="range" id="tmin" min="0" max="${last}" step="1" value="0" aria-label="Tempo minimo">
                  <input type="range" id="tmax" min="0" max="${last}" step="1" value="${last}" aria-label="Tempo massimo">
                </div>
                <div class="range-scale"><span>${fmtTime(steps[0], { zero: true })}</span><span>${fmtTime(steps[last])}</span></div>
              </fieldset>
              ${chipGroup('difficolta', 'Difficoltà', db.difficolta, true)}
              ${chipGroup('costo', 'Costo', usedOptions(db.costo, 'costo'), false, true)}
              ${chipGroup('fonti', 'Fonte', usedOptions(db.fonti, 'fonti'))}
              ${isPrep ? `
              <fieldset class="fgroup">
                <legend class="flabel">Si congela</legend>
                <div class="seg">
                  <button type="button" data-congela="tutte" aria-pressed="true">Tutte</button>
                  <button type="button" data-congela="si" aria-pressed="false">Sì</button>
                  <button type="button" data-congela="no" aria-pressed="false">No</button>
                </div>
              </fieldset>` : `
              <fieldset class="fgroup">
                <legend class="flabel">Preparazione in anticipo</legend>
                <div class="seg">
                  <button type="button" data-anticipo="tutte" aria-pressed="true">Tutte</button>
                  <button type="button" data-anticipo="si" aria-pressed="false">Sì</button>
                  <button type="button" data-anticipo="no" aria-pressed="false">No</button>
                </div>
              </fieldset>`}
              <button type="button" class="link-btn panel-reset" data-action="reset">Azzera filtri</button>
            </div>
            <div class="panel-foot">
              <button type="button" class="btn btn-ghost" data-action="reset">Azzera</button>
              <button type="button" class="btn" data-action="close-panel" id="show-btn">Mostra</button>
            </div>
          </aside>

          <section class="results" aria-labelledby="results-title">
            <h2 class="sr-only" id="results-title">Ricette</h2>
            <div class="toolbar">
              <label class="search">
                <span class="sr-only">Cerca</span>
                ${ICON.search}
                <input type="search" id="q" placeholder="Cerca ricetta o ingrediente" autocomplete="off" enterkeyhint="search">
              </label>
              <button type="button" class="btn btn-filters" data-action="open-panel" aria-controls="filtri" aria-expanded="false" aria-label="Filtri">
                ${ICON.filter}<span class="btn-label">Filtri</span><span class="badge" id="fbadge"></span>
              </button>
            </div>
            <div class="results-head">
              <p class="count" id="count" aria-live="polite"></p>
              <label class="sort">Ordina
                <select id="sort">${SORTS.map((s) => `<option value="${s.id}">${s.nome}</option>`).join('')}</select>
              </label>
              <div class="pills" id="pills"></div>
            </div>
            <div id="results"></div>
          </section>
        </div>
      </div>`;

    $('#q').value = filters.q;
    $('#sort').value = filters.ordina;
    syncSliderFromFilters();
    updateResults();
  }

  /* ---- slider del tempo ---- */
  const nearestIndex = (min) => {
    let best = 0;
    steps.forEach((s, i) => { if (Math.abs(s - min) < Math.abs(steps[best] - min)) best = i; });
    return best;
  };

  function syncSliderFromFilters() {
    const last = steps.length - 1;
    const lo = nearestIndex(filters.tmin);
    const hi = filters.tmax == null ? last : nearestIndex(filters.tmax);
    $('#tmin').value = Math.min(lo, hi);
    $('#tmax').value = Math.max(lo, hi);
    paintSlider();
  }

  function paintSlider() {
    const last = steps.length - 1;
    const lo = +$('#tmin').value;
    const hi = +$('#tmax').value;
    const fill = $('#tfill');
    fill.style.left = `${(lo / last) * 100}%`;
    fill.style.right = `${100 - (hi / last) * 100}%`;
    // Se i cursori si sovrappongono a fine corsa, quello minimo deve restare afferrabile.
    $('#tmin').style.zIndex = lo === last ? 3 : 2;
    $('#tmin').setAttribute('aria-valuetext', fmtTime(steps[lo], { zero: true }));
    $('#tmax').setAttribute('aria-valuetext', fmtTime(steps[hi], { zero: true }));

    let label;
    if (lo === 0 && hi === last) label = 'Qualsiasi durata';
    else if (lo === 0) label = `Fino a ${fmtTime(steps[hi])}`;
    else if (hi === last) label = `Almeno ${fmtTime(steps[lo])}`;
    else if (lo === hi) label = `Esattamente ${fmtTime(steps[lo], { zero: true })}`;
    else label = `Da ${fmtTime(steps[lo])} a ${fmtTime(steps[hi])}`;
    $('#tval').textContent = label;
  }

  function onSlider(e) {
    const last = steps.length - 1;
    const min = $('#tmin');
    const max = $('#tmax');
    let lo = +min.value;
    let hi = +max.value;
    if (lo > hi) {
      if (e.target === min) { lo = hi; min.value = lo; } else { hi = lo; max.value = hi; }
    }
    filters.tmin = steps[lo];
    filters.tmax = hi === last ? null : steps[hi];
    paintSlider();
    changed();
  }

  /* ---- aggiornamento risultati (senza ridisegnare il pannello) ---- */
  function changed() {
    saveFilters();
    updateResults();
  }

  function updateResults() {
    const list = currentList();

    for (const chip of $$('.chip')) {
      const { group, value } = chip.dataset;
      const on = filters[group].includes(value);
      const n = pool().filter((r) => hasValue(r, group, value) && matches(r, filters, group)).length;
      chip.setAttribute('aria-pressed', String(on));
      chip.querySelector('.chip-n').textContent = n;
      chip.classList.toggle('is-empty', !on && n === 0);
    }
    for (const b of $$('.seg button')) {
      const key = 'congela' in b.dataset ? 'congela' : 'anticipo';
      b.setAttribute('aria-pressed', String(b.dataset[key] === filters[key]));
    }

    const nActive = activeCount(filters);
    $('#fbadge').textContent = nActive || '';
    const tot = pool().length;
    $('#count').textContent = list.length === tot
      ? `${tot} ${tot === 1 ? 'ricetta' : 'ricette'}`
      : `${list.length} di ${tot} ${tot === 1 ? 'ricetta' : 'ricette'}`;
    $('#show-btn').textContent = list.length === 1 ? 'Mostra 1 ricetta' : `Mostra ${list.length} ricette`;
    $('#pills').innerHTML = pillsHtml();

    const results = $('#results');
    if (!tot) {
      results.innerHTML = `<div class="empty"><p>Il ricettario è ancora vuoto.</p></div>`;
      return;
    }
    if (!list.length) {
      results.innerHTML = `<div class="empty"><p>Nessuna ricetta corrisponde ai filtri scelti.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-action="reset">Azzera filtri</button></div>`;
      return;
    }

    if (filters.ordina === 'categoria') {
      const groups = [];
      for (const r of list) {
        const key = r.categoria || '';
        if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] });
        groups[groups.length - 1].items.push(r);
      }
      results.innerHTML = groups.map((g) => `
        <section class="group" aria-label="${esc(catName(g.key) || 'Altre')}">
          <h3 class="group-title">${esc(catName(g.key) || 'Altre')} <span>${g.items.length}</span></h3>
          <div class="grid">${g.items.map((r) => card(r, 'h4')).join('')}</div>
        </section>`).join('');
    } else {
      results.innerHTML = `<div class="grid">${list.map((r) => card(r)).join('')}</div>`;
    }
  }

  function pillsHtml() {
    const pills = [];
    const add = (label, action, value) => pills.push(
      `<button type="button" class="pill" data-action="${action}" data-value="${esc(value)}" aria-label="Rimuovi filtro ${esc(label)}">${esc(label)}${ICON.close}</button>`);
    filters.pasti.forEach((v) => add(pastoName(v), 'rm-pasti', v));
    filters.categorie.forEach((v) => add(catName(v), 'rm-categorie', v));
    filters.difficolta.forEach((v) => add(diff(v)?.nome ?? v, 'rm-difficolta', v));
    filters.costo.forEach((v) => add(`Costo ${(cost(v)?.nome ?? v).toLocaleLowerCase('it')}`, 'rm-costo', v));
    filters.fonti.forEach((v) => add(fonte(v)?.nome ?? v, 'rm-fonti', v));
    FACET_KEYS.forEach((k) => filters[k].forEach((v) => add(byId(db[k], v)?.nome ?? v, `rm-${k}`, v)));
    if (timeActive(filters)) add($('#tval').textContent, 'rm-tempo', '');
    if (filters.anticipo !== 'tutte') add(filters.anticipo === 'si' ? 'In anticipo' : 'Non in anticipo', 'rm-anticipo', '');
    if (filters.congela !== 'tutte') add(filters.congela === 'si' ? 'Si congela' : 'Non si congela', 'rm-congela', '');
    return pills.join('');
  }

  function card(r, h = 'h3') {
    const d = diff(r.difficolta);
    const pasti = r.pasti.map(pastoName).join(' · ');
    const p = r._section === 'prep' ? r.prep : null;
    return `
      <a class="card${p ? ' card-prep' : ''}" href="#/${encodeURIComponent(r.id)}">
        ${tile(r)}
        <span class="card-top">
          <span class="card-cat">${esc(catName(r.categoria))}</span>
          <span class="card-tags">
            ${p ? `<span class="tag-ahead" title="Meal prep">${ICON.box}Prep</span>`
              : r.anticipo === true ? `<span class="tag-ahead" title="Si prepara in anticipo">${ICON.ahead}In anticipo</span>` : ''}
            ${sourceBadge(r)}
          </span>
        </span>
        <${h} class="card-title">${esc(r.titolo)}</${h}>
        ${r.descrizione ? `<p class="card-desc">${esc(r.descrizione)}</p>` : ''}
        <span class="rule" aria-hidden="true"></span>
        <span class="card-meta">
          ${r._tot != null ? `<span class="m">${ICON.clock}${fmtTime(r._tot, { zero: true })}</span>` : ''}
          ${d ? `<span class="m">${dots(d.livello || 0)}${esc(d.nome)}</span>` : ''}
          ${r.macro ? `<span class="m m-macro" title="Per porzione"><b>${r.macro.kcal}</b> kcal · <b>${String(r.macro.proteine).replace('.', ',')} g</b> proteine</span>` : ''}
          ${cost(r.costo) ? `<span class="m" title="Costo ${esc(cost(r.costo).nome.toLocaleLowerCase('it'))}${r.costoStimato ? ' (stima)' : ''}">${euros(cost(r.costo).livello, costMax())}<span class="sr-only">Costo ${esc(cost(r.costo).nome)}</span></span>` : ''}
        </span>
        ${p ? `<span class="card-prep-line">
          <span title="In frigo">${ICON.fridge}${p.frigoGiorni} ${p.frigoGiorni === 1 ? 'giorno' : 'giorni'}</span>
          <span class="${p.congelabile ? '' : 'off'}" title="${esc(p.freezer)}">${ICON.snow}${p.congelabile ? 'Si congela' : 'Non si congela'}</span>
        </span>` : ''}
        ${pasti ? `<span class="card-pasti">${esc(pasti)}</span>` : ''}
      </a>`;
  }

  /* ---- pannello filtri su mobile ---- */
  const isMobile = () => window.matchMedia('(max-width: 899px)').matches;

  function openPanel() {
    if (!isMobile()) return;
    lastFocus = document.activeElement;
    document.body.classList.add('panel-anim');
    void document.body.offsetWidth; // applica la transizione prima di aprire
    document.body.classList.add('panel-open');
    const panel = $('#filtri');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    $('.btn-filters').setAttribute('aria-expanded', 'true');
    setTimeout(() => panel.querySelector('.panel-head .icon-btn')?.focus(), 50);
  }

  function closePanel() {
    if (!document.body.classList.contains('panel-open')) return;
    document.body.classList.remove('panel-open');
    const panel = $('#filtri');
    if (panel) { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); }
    $('.btn-filters')?.setAttribute('aria-expanded', 'false');
    lastFocus?.focus?.();
  }

  /* ================================================================ RICETTA */
  function renderRecipe(id) {
    const r = db.ricette.find((x) => x.id === id);
    if (!r) return renderNotFound();

    view = 'recipe';
    document.title = `${r.titolo} · Ricettario`;
    setTopbar('recipe', r);

    const d = diff(r.difficolta);
    const t = r.tempi || {};
    const meta = [
      ['Porzioni', r.porzioni],
      ['Preparazione', fmtTime(t.preparazione)],
      ['Cottura', fmtTime(t.cottura)],
      ['Riposo', fmtTime(t.riposo)],
      ['Difficoltà', d?.nome],
      ['Costo', cost(r.costo) && `${cost(r.costo).nome}${r.costoStimato ? ' (stima)' : ''}`],
    ].filter(([, v]) => v !== '' && v != null);

    const fm = (n) => String(n).replace('.', ',');
    const mc = r.macro;
    const macroHtml = mc ? `
              <dl class="r-macro" aria-label="Valori per porzione">
                ${[['Calorie', `${mc.kcal} kcal`], ['Proteine', `${fm(mc.proteine)} g`], ['Carboidrati', `${fm(mc.carboidrati)} g`],
    ['Grassi', `${fm(mc.grassi)} g`], ['Fibre', mc.fibre != null ? `${fm(mc.fibre)} g` : '']]
    .filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
              </dl>
              <p class="r-macro-note">Valori per porzione.</p>` : '';

    const tags = [];
    FACET_KEYS.filter((k) => k !== 'kcal').forEach((k) => FACETS[k].get(r).forEach((v) => {
      tags.push(`<a class="r-tag r-facet" href="#/" data-goto="${k}" data-value="${esc(v)}">${esc(byId(db[k], v)?.nome ?? v)}</a>`);
    }));
    if (r.categoria) tags.push(`<a class="r-tag" href="#/" data-goto="categorie" data-value="${esc(r.categoria)}">${esc(catName(r.categoria))}</a>`);
    r.pasti.forEach((p) => tags.push(`<a class="r-tag" href="#/" data-goto="pasti" data-value="${esc(p)}">${esc(pastoName(p))}</a>`));
    if (r._tot != null) tags.push(`<span class="r-tag">${ICON.clock}Totale ${fmtTime(r._tot, { zero: true })}</span>`);
    const p = r._section === 'prep' ? r.prep : null;
    if (p) tags.push(`<a class="r-tag solid" href="#/prep">${ICON.box}Meal prep</a>`);
    else if (r.anticipo === true) tags.push(`<span class="r-tag solid">${ICON.ahead}Si prepara in anticipo</span>`);
    const src = fonte(r.fonte);
    if (src) {
      const label = `<b class="src-sigla">${esc(src.sigla || '')}</b>${esc(src.nome)}`;
      tags.push(r.fonteUrl
        ? `<a class="r-tag r-src" href="${esc(r.fonteUrl)}" target="_blank" rel="noopener noreferrer" title="Apri la ricetta originale">${label}</a>`
        : `<span class="r-tag r-src">${label}</span>`);
    }

    const pdfBtn = r.pdf
      ? `<a class="btn" href="${esc(r.pdf)}" download="${esc(slugFileName(r.titolo))}.pdf">${ICON.download}Scarica PDF</a>`
      : '';

    let ingrIdx = 0;
    const ingredients = r.ingredienti.map((it) => {
      if (it && typeof it === 'object') return `<li class="r-sec">${esc(it.sezione)}</li>`;
      const idx = ingrIdx++;
      return `<li><label><input type="checkbox" data-ingr="${idx}"><span class="tick" aria-hidden="true"></span><span class="txt">${esc(it)}</span></label></li>`;
    }).join('');

    const method = r.procedimento.map((it) => (it && typeof it === 'object'
      ? `<li class="r-sec">${esc(it.sezione)}</li>`
      : `<li class="r-step">${esc(it)}</li>`)).join('');

    const notes = (Array.isArray(r.note) ? r.note : [r.note]).filter(Boolean)
      .map((n) => `<p class="r-note">${esc(n)}</p>`).join('');

    // Blocco meal prep: conservazione e ravvivamento
    const plist = (title, items, cls) => (items?.length
      ? `<div class="prep-col ${cls}"><h3>${title}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');
    const prepHtml = p ? `
            <section class="r-prep" aria-labelledby="h-prep">
              <h2 class="r-label" id="h-prep">Conservazione e ravvivamento</h2>
              <dl class="prep-facts">
                <div><dt>${ICON.fridge}Frigo</dt><dd>${esc(p.frigo)}</dd></div>
                <div><dt>${ICON.snow}Freezer</dt><dd>${esc(p.freezer)}</dd></div>
              </dl>
              <div class="prep-cols">
                ${plist('Conservare', p.conservazione, 'c-store')}
                ${plist('Ravvivare', p.ravvivare, 'c-revive')}
                ${plist('Al momento', p.alMomento, 'c-finish')}
              </div>
              ${p.ricettaBase ? '<p class="r-note">Ricetta base: ingredienti e dosi sono una proposta da adattare, perché le pagine delle fonti non erano leggibili.</p>' : ''}
              ${p.fonti?.length ? `<p class="prep-src">Fonti: ${p.fonti.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.nome)}</a>`).join(' · ')}</p>` : ''}
            </section>` : '';

    // Ricetta precedente/successiva (nella stessa sezione) secondo i filtri e l'ordinamento correnti
    if (r._section !== section) setSection(r._section);
    let list = currentList();
    if (!list.some((x) => x.id === r.id)) list = sortRecipes(pool(), filters.ordina);
    const i = list.findIndex((x) => x.id === r.id);
    const prev = list[i - 1];
    const next = list[i + 1];

    app.innerHTML = `
      <div class="wrap recipe-wrap">
        <article class="sheet">
          <div class="r-grid">
            <header class="r-head">
              ${tile(r, true)}
              ${r.descrizione ? `<p class="r-desc">${esc(r.descrizione)}</p>` : ''}
              <h1 class="r-title" tabindex="-1">${esc(r.titolo)}</h1>
              <span class="rule" aria-hidden="true"></span>
              ${meta.length ? `<dl class="r-meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
              ${macroHtml}
              <span class="rule" aria-hidden="true"></span>
              ${tags.length ? `<div class="r-tags">${tags.join('')}</div>` : ''}
              ${r.anticipo === true && r.notaAnticipo ? `<p class="r-ahead-note">${esc(r.notaAnticipo)}</p>` : ''}
              ${r.mealprepNota ? `<p class="r-ahead-note">Meal prep: meglio fresca. ${esc(r.mealprepNota)}</p>` : ''}
              ${pdfBtn ? `<div class="r-actions">${pdfBtn}</div>` : ''}
            </header>

            <section class="r-ingr" aria-labelledby="h-ingr">
              <h2 class="r-label" id="h-ingr">Ingredienti</h2>
              <ul>${ingredients}</ul>
            </section>

            <section class="r-steps" aria-labelledby="h-steps">
              <h2 class="r-label" id="h-steps">Procedimento</h2>
              <ol>${method}</ol>
              ${notes}
            </section>
            ${prepHtml}
          </div>

          <footer class="r-foot">
            <a class="btn btn-ghost btn-sm" href="${SECTIONS[r._section].hash}">${ICON.back}${SECTIONS[r._section].back}</a>
            <span class="r-actions" style="margin:0">
              <button type="button" class="btn btn-ghost btn-sm" data-action="print">${ICON.print}Stampa</button>
              ${r.pdf ? `<a class="btn btn-sm" href="${esc(r.pdf)}" download="${esc(slugFileName(r.titolo))}.pdf">${ICON.download}Scarica PDF</a>` : ''}
            </span>
          </footer>
        </article>
        ${prev || next ? `
        <nav class="r-pager" aria-label="Altre ricette">
          ${prev ? `<a href="#/${encodeURIComponent(prev.id)}"><small>← Precedente</small><span>${esc(prev.titolo)}</span></a>` : ''}
          ${next ? `<a class="next" href="#/${encodeURIComponent(next.id)}"><small>Successiva →</small><span>${esc(next.titolo)}</span></a>` : ''}
        </nav>` : ''}
      </div>`;

    window.scrollTo(0, 0);
    $('.r-title').focus({ preventScroll: true });
  }

  function renderNotFound() {
    view = 'missing';
    document.title = 'Ricetta non trovata · Ricettario';
    setTopbar('list');
    app.innerHTML = `
      <div class="error-box">
        <h1>Ricetta non trovata</h1>
        <p>Il link potrebbe essere cambiato o la ricetta non è più nel ricettario.</p>
        <a class="btn" href="#/">Vai a tutte le ricette</a>
      </div>`;
    window.scrollTo(0, 0);
  }

  function renderError(err) {
    app.innerHTML = `
      <div class="error-box">
        <h1>Impossibile caricare</h1>
        <p>Il database delle ricette non è raggiungibile.${location.protocol === 'file:' ? ' Apri il ricettario tramite un server (vedi README), non con doppio clic.' : ' Riprova tra poco.'}</p>
        <button type="button" class="btn" onclick="location.reload()">Riprova</button>
      </div>`;
    console.error(err);
  }

  /* ================================================================ ROUTING */
  function route() {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim();
    closePanel();
    if (!id || id === 'prep') {
      const target = id === 'prep' ? 'prep' : 'ricette';
      const fromRecipe = (view === 'recipe' || view === 'missing') && section === target;
      setSection(target);
      renderList();
      window.scrollTo(0, fromRecipe ? listScrollY : 0);
    } else {
      if (view === 'list') listScrollY = window.scrollY;
      renderRecipe(id);
    }
  }

  /* ================================================================ EVENTI */
  function onClick(e) {
    const t = e.target.closest('[data-action], .chip, .seg button, [data-goto]');
    if (!t) return;

    if (t.matches('.chip')) {
      const { group, value } = t.dataset;
      const arr = filters[group];
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1); else arr.push(value);
      return changed();
    }
    if (t.matches('.seg button')) {
      if ('congela' in t.dataset) filters.congela = t.dataset.congela;
      else filters.anticipo = t.dataset.anticipo;
      return changed();
    }
    if (t.dataset.goto) {
      // Tag nella scheda ricetta: porta all'elenco (della stessa sezione) filtrato su quel valore
      e.preventDefault();
      filters = { ...defaultFilters(), ordina: filters.ordina, [t.dataset.goto]: [t.dataset.value] };
      saveFilters();
      view = null;
      const hash = SECTIONS[section].hash;
      if (location.hash === hash) route(); else location.hash = hash;
      return;
    }

    const action = t.dataset.action;
    const value = t.dataset.value;
    switch (action) {
      case 'open-panel': return openPanel();
      case 'close-panel': return closePanel();
      case 'print': return window.print();
      case 'reset':
        filters = { ...defaultFilters(), ordina: filters.ordina };
        $('#q').value = '';
        syncSliderFromFilters();
        return changed();
      case 'rm-pasti': case 'rm-categorie': case 'rm-difficolta': case 'rm-costo': case 'rm-fonti':
      case 'rm-collezioni': case 'rm-proteine': case 'rm-basi': case 'rm-cucine': case 'rm-stili': case 'rm-caratt': case 'rm-kcal': {
        const g = action.slice(3);
        filters[g] = filters[g].filter((v) => v !== value);
        return changed();
      }
      case 'rm-tempo':
        filters.tmin = 0; filters.tmax = null;
        syncSliderFromFilters();
        return changed();
      case 'rm-anticipo':
        filters.anticipo = 'tutte';
        return changed();
      case 'rm-congela':
        filters.congela = 'tutte';
        return changed();
      default:
    }
  }

  let searchTimer;
  function onInput(e) {
    if (e.target.id === 'q') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { filters.q = e.target.value; changed(); }, 120);
    } else if (e.target.id === 'tmin' || e.target.id === 'tmax') {
      onSlider(e);
    }
  }

  function onChange(e) {
    if (e.target.id === 'sort') { filters.ordina = e.target.value; changed(); }
  }

  function onKey(e) {
    if (e.key === 'Escape' && document.body.classList.contains('panel-open')) { closePanel(); return; }
    // "/" porta alla ricerca (desktop)
    if (e.key === '/' && view === 'list' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
      e.preventDefault();
      $('#q')?.focus();
    }
    // Trappola del focus nel pannello filtri aperto
    if (e.key === 'Tab' && document.body.classList.contains('panel-open')) {
      const f = $$('#filtri button, #filtri input').filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  }

  function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark());
    const sync = () => {
      const dark = isDark();
      btn.setAttribute('aria-label', dark ? 'Passa al tema chiaro' : 'Passa al tema scuro');
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = dark ? '#0E0E0E' : '#F4F2EC'; });
    };
    btn.addEventListener('click', () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch { /* storage non disponibile */ }
      sync();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', sync);
    sync();
  }

  /* ================================================================ AVVIO */
  async function init() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    initTheme();
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      db = prepareData(await res.json());
    } catch (err) {
      renderError(err);
      return;
    }
    steps = buildSteps();
    setSection('ricette');

    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', route);
    window.matchMedia('(max-width: 899px)').addEventListener?.('change', (m) => {
      if (!m.matches) closePanel();
      document.body.classList.remove('panel-anim');
    });

    route();
  }

  init();
})();
