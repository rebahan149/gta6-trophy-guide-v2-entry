// tracker.js — progress state for the Leonida Trophy Ledger (v2).
// Progress lives in the browser's localStorage: the earned checklist, the
// per-trophy count trackers, and the reader's settings. It can be exported
// to a JSON file and imported back, and a share link can seed both the
// earned list (?earned=2,3,8) and the counters (?counts=15:120,17:42).

export const STORAGE_KEY = 'leonida-trophy-ledger-v2';

// PlayStation trophy point values, used for the points total in the header.
export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };

export function emptyState() {
  return { earned: [], counts: {}, spoilers: true, hideEarned: false };
}

// Keep only sane counter entries: a known trophy id mapped to a whole
// number between 0 and that trophy's target.
function cleanCounts(raw, trophiesById) {
  const counts = {};
  if (!raw || typeof raw !== 'object') return counts;
  for (const [key, value] of Object.entries(raw)) {
    const id = Number.parseInt(key, 10);
    const trophy = trophiesById?.get(id);
    if (!trophy || typeof trophy.target !== 'number') continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    counts[id] = Math.min(trophy.target, Math.max(0, Math.trunc(value)));
  }
  return counts;
}

export function loadState(trophiesById) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : [],
      counts: cleanCounts(parsed.counts, trophiesById),
      spoilers: parsed.spoilers !== false,
      hideEarned: parsed.hideEarned === true,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the tracker still works in memory.
  }
}

// Points and per-grade counts for the trophies the player has earned.
export function progressSummary(trophies, earnedIds) {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let points = 0;
  let earnedCount = 0;
  for (const t of trophies) {
    if (!earnedIds.has(t.id)) continue;
    earnedCount += 1;
    byGrade[t.grade] += 1;
    points += GRADE_POINTS[t.grade] ?? 0;
  }
  const totalPoints = trophies.reduce((sum, t) => sum + (GRADE_POINTS[t.grade] ?? 0), 0);
  return {
    earnedCount,
    total: trophies.length,
    percent: trophies.length ? Math.round((earnedCount / trophies.length) * 100) : 0,
    byGrade,
    points,
    totalPoints,
  };
}

// Where the count trackers stand: how many trophies carry a counter, how
// many counters are full, and the summed progress across all of them.
export function counterSummary(trophies, counts) {
  let tracked = 0;
  let complete = 0;
  let done = 0;
  let total = 0;
  for (const t of trophies) {
    if (typeof t.target !== 'number') continue;
    tracked += 1;
    const value = Math.min(t.target, Math.max(0, counts[t.id] ?? 0));
    done += value;
    total += t.target;
    if (value >= t.target) complete += 1;
  }
  return { tracked, complete, done, total };
}

// Download the current progress as a JSON file the reader keeps.
export function exportProgress(state) {
  const payload = {
    app: 'leonida-trophy-ledger',
    version: 2,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    counts: state.counts,
    spoilers: state.spoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Read an imported file's text back into clean progress: valid earned ids
// and valid counter values, checked against the trophy list.
export function parseImportedProgress(text, trophiesById) {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) throw new Error('No earned list in that file.');
  return {
    earned: list.filter((n) => Number.isInteger(n) && trophiesById.has(n)),
    counts: cleanCounts(Array.isArray(parsed) ? {} : parsed.counts, trophiesById),
  };
}

// A share link can carry progress: ?earned=2,3,8 returns those ids.
export function idsFromShareLink(search) {
  const raw = new URLSearchParams(search).get('earned');
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => Number.parseInt(part, 10))
    .filter((n) => Number.isInteger(n) && n > 0);
}

// A share link can carry counters too: ?counts=15:120,17:42 returns a map
// of trophy id to counted value, cleaned against the trophy list.
export function countsFromShareLink(search, trophiesById) {
  const raw = new URLSearchParams(search).get('counts');
  if (!raw) return {};
  const parsed = {};
  for (const pair of raw.split(',')) {
    const [idPart, valuePart] = pair.split(':');
    const id = Number.parseInt(idPart, 10);
    const value = Number.parseInt(valuePart, 10);
    if (Number.isInteger(id) && Number.isInteger(value)) parsed[id] = value;
  }
  return cleanCounts(parsed, trophiesById);
}
