// app.js — The Leonida Trophy Ledger (v2): an offline guide & tracker for
// the 55 GTA VI PlayStation 5 trophies. Loads the trophy data from
// data/trophies.json (a file of this app), renders the checklist with its
// count trackers, the cited step guides, the trophy focus view, the platinum
// roadmap and the missable flags, and keeps the reader's progress locally.
//
// New in v2: every guide is a list of cited steps (one claim, its sources
// beside it), the header counts the citations from the data itself, and the
// big-number trophies carry per-trophy count trackers.

import {
  GRADE_POINTS,
  countsFromShareLink,
  counterSummary,
  exportProgress,
  idsFromShareLink,
  loadState,
  parseImportedProgress,
  progressSummary,
  saveState,
} from './js/tracker.js';
import { ROADMAP_STAGES, notesForStage, stageByNumber, trophiesInStage } from './js/roadmap.js';
import { citationStats, claimsOfTrophy, sourceShortName, sourcesOfClaim } from './js/citations.js';

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const registry = data.sources ?? {};
const trophyById = new Map(trophies.map((t) => [t.id, t]));
const validIds = new Set(trophies.map((t) => t.id));
const stats = citationStats(data);

const state = loadState(trophyById);
const earned = new Set(state.earned.filter((id) => validIds.has(id)));
const counts = { ...state.counts };
for (const id of idsFromShareLink(location.search)) {
  if (validIds.has(id)) earned.add(id);
}
Object.assign(counts, countsFromShareLink(location.search, trophyById));

const params = new URLSearchParams(location.search);
if (params.get('spoilers') === 'off') state.spoilers = false;
if (params.get('spoilers') === 'on') state.spoilers = true;
const filters = {
  kind: params.get('kind') || 'all',
  grade: params.get('grade') || 'all',
  query: '',
};
let currentView = params.get('view') || 'checklist';
let selectedId = Number.parseInt(params.get('open') || '', 10);
if (!validIds.has(selectedId)) selectedId = 37; // Catch Me If You Can: a missable with a counter-free, citation-dense guide.

const els = {
  claims: document.getElementById('stat-claims'),
  multi: document.getElementById('stat-multi'),
  sources: document.getElementById('stat-sources'),
  covered: document.getElementById('stat-covered'),
  percent: document.getElementById('progress-percent'),
  count: document.getElementById('progress-count'),
  points: document.getElementById('progress-points'),
  counters: document.getElementById('progress-counters'),
  bar: document.getElementById('progress-bar'),
  fill: document.getElementById('progress-fill'),
  list: document.getElementById('trophy-list'),
  listSummary: document.getElementById('list-summary'),
  detail: document.getElementById('detail'),
  detailFull: document.getElementById('detail-full'),
  search: document.getElementById('search'),
  gradeFilter: document.getElementById('grade-filter'),
  kindChips: document.getElementById('kind-chips'),
  spoilerToggle: document.getElementById('spoiler-toggle'),
  hideEarnedToggle: document.getElementById('hide-earned-toggle'),
  importNote: document.getElementById('import-note'),
  roadmap: document.getElementById('roadmap-stages'),
  missables: document.getElementById('missable-cards'),
  sourceList: document.getElementById('source-list'),
};

function persist() {
  state.earned = [...earned];
  state.counts = counts;
  state.spoilers = els.spoilerToggle.checked;
  state.hideEarned = els.hideEarnedToggle.checked;
  saveState(state);
}

function isMasked(trophy) {
  return state.spoilers && trophy.kind === 'story' && !earned.has(trophy.id);
}

function displayName(trophy) {
  return isMasked(trophy) ? 'Hidden story trophy' : trophy.name;
}

function displayDescription(trophy) {
  return isMasked(trophy)
    ? 'Spoiler shield is on: this story trophy reveals itself once you earn it.'
    : trophy.description;
}

function gradeBadge(trophy) {
  const span = document.createElement('span');
  span.className = `badge badge-${trophy.grade}`;
  span.textContent = trophy.grade;
  return span;
}

function flagBadge(text, cls) {
  const span = document.createElement('span');
  span.className = `flag ${cls}`;
  span.textContent = text;
  return span;
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

// A trophy's claims that name two or more sources.
function multiSourceClaims(trophy) {
  return claimsOfTrophy(trophy).filter((claim) => (claim.s ?? []).length >= 2).length;
}

// The − value / target + count tracker for one trophy. step is the jump the
// buttons move by: 1 for small targets, a rounder step for the money totals.
function counterControl(trophy, big) {
  const wrap = document.createElement('span');
  wrap.className = big ? 'counter-big' : '';
  const control = document.createElement('span');
  control.className = 'counter';
  const value = Math.min(trophy.target, Math.max(0, counts[trophy.id] ?? 0));
  if (value >= trophy.target) control.classList.add('is-full');
  const step = trophy.target >= 100000 ? 5000 : trophy.target >= 1000 ? 50 : trophy.target >= 100 ? 10 : 1;

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Count fewer for ${trophy.name}`);
  minus.addEventListener('click', (event) => {
    event.stopPropagation();
    setCount(trophy, (counts[trophy.id] ?? 0) - step);
  });

  const readout = document.createElement('span');
  readout.className = 'counter-value';
  readout.textContent = formatNumber(value);
  const target = document.createElement('span');
  target.className = 'counter-target';
  target.textContent = `/ ${formatNumber(trophy.target)}`;

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Count more for ${trophy.name}`);
  plus.addEventListener('click', (event) => {
    event.stopPropagation();
    setCount(trophy, (counts[trophy.id] ?? 0) + step);
  });

  control.append(minus, readout, target, plus);
  wrap.append(control);
  if (big) {
    const bar = document.createElement('div');
    bar.className = 'counter-bar';
    const fill = document.createElement('span');
    fill.style.width = `${Math.round((value / trophy.target) * 100)}%`;
    bar.append(fill);
    const outer = document.createElement('div');
    outer.append(wrap, bar);
    return outer;
  }
  return wrap;
}

function setCount(trophy, value) {
  counts[trophy.id] = Math.min(trophy.target, Math.max(0, Math.trunc(value)));
  persist();
  renderProgress();
  renderList();
  renderDetails();
}

function renderStats() {
  els.claims.textContent = String(stats.claims);
  els.multi.textContent = String(stats.multiSource);
  els.sources.textContent = String(stats.distinctSources);
  els.covered.textContent = `${stats.trophiesCovered}/${stats.trophiesTotal}`;
}

function renderProgress() {
  const s = progressSummary(trophies, earned);
  const c = counterSummary(trophies, counts);
  els.percent.textContent = `${s.percent}%`;
  els.count.textContent = `${s.earnedCount} of ${s.total} trophies earned`;
  els.points.textContent = `${formatNumber(s.points)} of ${formatNumber(s.totalPoints)} trophy points`;
  els.counters.textContent = `${c.complete} of ${c.tracked} count trackers complete`;
  els.fill.style.width = `${s.percent}%`;
  els.bar.setAttribute('aria-valuenow', String(s.earnedCount));
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === grade).length;
    document.getElementById(`count-${grade}`).textContent = `${s.byGrade[grade]}/${total}`;
  }
}

function matchesFilters(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (state.hideEarned && earned.has(trophy.id)) return false;
  if (filters.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.query)) return false;
  }
  return true;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  els.list.replaceChildren();
  els.listSummary.textContent = `Showing ${shown.length} of ${trophies.length} trophies — click one to read its cited steps.`;
  for (const trophy of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row';
    if (earned.has(trophy.id)) li.classList.add('is-earned');
    if (trophy.id === selectedId) li.classList.add('is-selected');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      persist();
      renderAll();
    });

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'row-main';
    main.addEventListener('click', () => {
      selectedId = trophy.id;
      renderList();
      renderDetails();
    });
    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = displayName(trophy);
    const desc = document.createElement('span');
    desc.className = 'row-desc';
    desc.textContent = displayDescription(trophy);
    const claims = document.createElement('span');
    claims.className = 'row-claims';
    const total = claimsOfTrophy(trophy).length;
    claims.textContent = isMasked(trophy)
      ? 'Guide hidden by the spoiler shield'
      : `${total} cited claims · ${multiSourceClaims(trophy)} with 2+ sources`;
    main.append(name, desc, claims);

    const meta = document.createElement('span');
    meta.className = 'row-meta';
    meta.append(gradeBadge(trophy));
    if (trophy.missable) meta.append(flagBadge('Missable', 'flag-missable'));
    if (typeof trophy.target === 'number') meta.append(counterControl(trophy, false));

    li.append(box, main, meta);
    els.list.append(li);
  }
}

// One claim's source chips: a chip per source, linked to the source, plus a
// "2+ sources" badge when the claim names at least two.
function claimSources(claim) {
  const wrap = document.createElement('span');
  wrap.className = 'step-sources';
  for (const source of sourcesOfClaim(claim, registry)) {
    const a = document.createElement('a');
    a.className = 'source-chip';
    a.href = source.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = sourceShortName(source);
    wrap.append(a);
  }
  if ((claim.s ?? []).length >= 2) wrap.append(flagBadge('2+ sources', 'flag-multi'));
  return wrap;
}

// The cited step list for a trophy: an ordered list, each step one claim
// with its source chips under it.
function stepList(trophy) {
  const ol = document.createElement('ol');
  ol.className = 'step-list';
  for (const step of trophy.steps ?? []) {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = step.t;
    li.append(text, claimSources(step));
    ol.append(li);
  }
  return ol;
}

function sourceList(trophy) {
  const ul = document.createElement('ul');
  ul.className = 'detail-sources';
  const seen = new Set();
  for (const claim of claimsOfTrophy(trophy)) {
    for (const source of sourcesOfClaim(claim, registry)) {
      if (seen.has(source.url)) continue;
      seen.add(source.url);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = source.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = source.name;
      li.append(a);
      ul.append(li);
    }
  }
  return ul;
}

// Render one trophy's full guide into a container: used by the checklist's
// side panel and by the Trophy focus view alike.
function renderDetailInto(panel, trophy) {
  panel.replaceChildren();
  const masked = isMasked(trophy);

  const head = document.createElement('div');
  head.className = 'detail-head';
  const title = document.createElement('h3');
  title.textContent = displayName(trophy);
  head.append(title, gradeBadge(trophy));
  if (trophy.missable) head.append(flagBadge('Missable', 'flag-missable'));
  if (!masked && multiSourceClaims(trophy) === claimsOfTrophy(trophy).length) {
    head.append(flagBadge('Every claim 2+ sources', 'flag-multi'));
  }
  panel.append(head);

  const official = document.createElement('p');
  official.className = 'detail-official';
  official.textContent = masked
    ? 'Official description: hidden by the spoiler shield until this trophy is earned.'
    : `Official description: \u201C${trophy.description}\u201D`;
  panel.append(official);

  const facts = document.createElement('p');
  facts.className = 'detail-facts';
  const stage = stageByNumber(trophy.stage);
  facts.textContent =
    `Kind: ${trophy.kind} · Roadmap stage ${trophy.stage} — ${stage.title}` +
    ` · Worth ${GRADE_POINTS[trophy.grade]} points` +
    (typeof trophy.target === 'number' ? ` · Tracked target: ${formatNumber(trophy.target)}` : '') +
    (masked ? '' : ` · ${claimsOfTrophy(trophy).length} cited claims`);
  panel.append(facts);

  if (trophy.missable && !masked) {
    const warning = document.createElement('div');
    warning.className = 'missable-warning';
    const strong = document.createElement('strong');
    strong.textContent = 'Missable — plan around it. ';
    const note = document.createElement('span');
    note.textContent = trophy.missableNote ? trophy.missableNote.t : '';
    warning.append(strong, note);
    if (trophy.missableNote) warning.append(claimSources(trophy.missableNote));
    panel.append(warning);
  }

  if (typeof trophy.target === 'number') {
    const counterHead = document.createElement('h4');
    counterHead.textContent = 'Count tracker';
    panel.append(counterHead, counterControl(trophy, true));
  }

  const guideHead = document.createElement('h4');
  guideHead.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  guide.textContent = masked
    ? 'The spoiler shield hides this guide until the trophy is earned. Tick it off in the checklist to reveal it — or switch the shield off above.'
    : trophy.guide;
  panel.append(guideHead, guide);

  if (!masked) {
    const stepsHead = document.createElement('h4');
    stepsHead.textContent = 'Cited steps';
    panel.append(stepsHead, stepList(trophy));

    const srcHead = document.createElement('h4');
    srcHead.textContent = 'Sources';
    panel.append(srcHead, sourceList(trophy));
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'detail-toggle';
  toggle.textContent = earned.has(trophy.id) ? 'Earned — undo' : 'Mark as earned';
  toggle.addEventListener('click', () => {
    if (earned.has(trophy.id)) earned.delete(trophy.id);
    else earned.add(trophy.id);
    persist();
    renderAll();
  });
  panel.append(toggle);
}

function renderDetails() {
  const trophy = trophyById.get(selectedId) ?? trophies[0];
  renderDetailInto(els.detail, trophy);
  renderDetailInto(els.detailFull, trophy);
}

function roadmapCard(trophy) {
  const li = document.createElement('li');
  li.className = 'roadmap-item';
  if (earned.has(trophy.id)) li.classList.add('is-earned');
  const name = document.createElement('span');
  name.className = 'roadmap-name';
  name.textContent = displayName(trophy);
  li.append(name, gradeBadge(trophy));
  if (trophy.missable) li.append(flagBadge('Missable', 'flag-missable'));
  return li;
}

function renderRoadmap() {
  els.roadmap.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const section = document.createElement('section');
    section.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `Stage ${stage.n} — ${stage.title}`;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    section.append(h, blurb);
    const notes = notesForStage(data, stage.n);
    if (notes.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'stage-notes';
      for (const note of notes) {
        const li = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = note.t;
        li.append(text, claimSources(note));
        ul.append(li);
      }
      section.append(ul);
    }
    const ul = document.createElement('ul');
    ul.className = 'roadmap-list';
    for (const trophy of trophiesInStage(trophies, stage.n)) ul.append(roadmapCard(trophy));
    section.append(ul);
    els.roadmap.append(section);
  }
}

function renderMissables() {
  els.missables.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  document.getElementById('missable-count').textContent = String(flagged.length);
  for (const trophy of flagged) {
    const card = document.createElement('article');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = trophy.name;
    const quote = document.createElement('blockquote');
    quote.textContent = `\u201C${trophy.description}\u201D — official description`;
    card.append(h, quote);
    if (trophy.missableNote) {
      const basis = document.createElement('p');
      basis.textContent = trophy.missableNote.t;
      basis.append(claimSources(trophy.missableNote));
      card.append(basis);
    }
    card.append(stepList(trophy));
    const meta = document.createElement('p');
    meta.className = 'detail-facts';
    const stage = stageByNumber(trophy.stage);
    meta.textContent = `Roadmap stage ${trophy.stage} — ${stage.title} · ${claimsOfTrophy(trophy).length} cited claims`;
    card.append(meta, sourceList(trophy));
    els.missables.append(card);
  }
}

function renderSources() {
  // Count how many claims cite each source, from the data itself.
  const citeCounts = new Map();
  const tally = (claim) => {
    for (const key of claim.s ?? []) citeCounts.set(key, (citeCounts.get(key) ?? 0) + 1);
  };
  for (const trophy of trophies) for (const claim of claimsOfTrophy(trophy)) tally(claim);
  for (const stage of data.roadmap ?? []) for (const note of stage.notes ?? []) tally(note);

  els.sourceList.replaceChildren();
  for (const [key, source] of Object.entries(registry)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = source.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = source.name;
    const span = document.createElement('span');
    span.className = 'source-url';
    span.textContent = source.url;
    const cites = document.createElement('span');
    cites.className = 'source-cites';
    cites.textContent = `Cited by ${citeCounts.get(key) ?? 0} claims in this guide`;
    li.append(a, span, cites);
    els.sourceList.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetails();
  renderRoadmap();
  renderMissables();
}

function showView(view) {
  currentView = view;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('is-active', section.id === `view-${view}`);
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}

els.gradeFilter.value = filters.grade;
els.gradeFilter.addEventListener('change', () => {
  filters.grade = els.gradeFilter.value;
  renderList();
});

for (const chip of els.kindChips.querySelectorAll('.chip')) {
  chip.classList.toggle('is-active', chip.dataset.kind === filters.kind);
  chip.addEventListener('click', () => {
    filters.kind = chip.dataset.kind;
    for (const c of els.kindChips.querySelectorAll('.chip')) {
      c.classList.toggle('is-active', c === chip);
    }
    renderList();
  });
}

els.search.addEventListener('input', () => {
  filters.query = els.search.value.trim().toLowerCase();
  renderList();
});

els.spoilerToggle.checked = state.spoilers;
els.spoilerToggle.addEventListener('change', () => {
  persist();
  renderAll();
});

els.hideEarnedToggle.checked = state.hideEarned;
els.hideEarnedToggle.addEventListener('change', () => {
  persist();
  renderList();
});

document.getElementById('export-button').addEventListener('click', () => {
  persist();
  exportProgress(state);
});

document.getElementById('import-input').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = parseImportedProgress(await file.text(), trophyById);
    earned.clear();
    for (const id of imported.earned) earned.add(id);
    for (const key of Object.keys(counts)) delete counts[key];
    Object.assign(counts, imported.counts);
    persist();
    renderAll();
    els.importNote.hidden = false;
    els.importNote.textContent = `Imported progress: ${imported.earned.length} trophies marked as earned, counters restored.`;
  } catch {
    els.importNote.hidden = false;
    els.importNote.textContent = 'That file could not be read as a progress export — nothing was changed.';
  }
  event.target.value = '';
});

renderStats();
renderSources();
renderAll();
showView(['checklist', 'detail', 'roadmap', 'missables', 'sources'].includes(currentView) ? currentView : 'checklist');
persist();

const scrollTarget = Number.parseInt(params.get('scroll') || '', 10);
if (Number.isInteger(scrollTarget) && scrollTarget > 0) {
  requestAnimationFrame(() => window.scrollTo(0, scrollTarget));
}
