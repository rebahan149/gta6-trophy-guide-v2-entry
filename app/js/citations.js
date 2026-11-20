// citations.js — the citation engine of the Leonida Trophy Ledger (v2).
//
// Every guide in this entry is a list of cited claims. A claim is one step of
// a trophy's guide, one missable-flag note, or one roadmap note; each claim
// names its sources beside it, as keys into the source registry that ships in
// data/trophies.json. The numbers the app shows in its header — claims cited,
// claims backed by 2+ sources, distinct sources, trophies covered — are
// computed here from the shipped data, never typed in by hand, so the strip
// can only ever report what the data file actually holds.

// The claims a single trophy carries: its guide steps, plus its missable-flag
// note when it has one.
export function claimsOfTrophy(trophy) {
  const claims = [...(trophy.steps ?? [])];
  if (trophy.missableNote) claims.push(trophy.missableNote);
  return claims;
}

// The claims the roadmap carries, across every stage's notes.
export function claimsOfRoadmap(roadmap) {
  const claims = [];
  for (const stage of roadmap ?? []) {
    for (const note of stage.notes ?? []) claims.push(note);
  }
  return claims;
}

// Resolve a claim's source keys to the registry entries they name.
export function sourcesOfClaim(claim, registry) {
  return (claim.s ?? []).map((key) => registry[key]).filter(Boolean);
}

// Count the citation statistics over the whole data file: every trophy's
// claims plus the roadmap's, how many of them name two or more sources, how
// many distinct sources are cited anywhere, and how many trophies carry at
// least one claim.
export function citationStats(data) {
  const registry = data.sources ?? {};
  let claims = 0;
  let multiSource = 0;
  let covered = 0;
  const distinct = new Set();
  const tally = (claim) => {
    claims += 1;
    if ((claim.s ?? []).length >= 2) multiSource += 1;
    for (const key of claim.s ?? []) distinct.add(key);
  };
  for (const trophy of data.trophies ?? []) {
    const own = claimsOfTrophy(trophy);
    if (own.length > 0) covered += 1;
    for (const claim of own) tally(claim);
  }
  for (const claim of claimsOfRoadmap(data.roadmap)) tally(claim);
  return {
    claims,
    multiSource,
    distinctSources: distinct.size,
    trophiesCovered: covered,
    trophiesTotal: (data.trophies ?? []).length,
  };
}

// The short label a source chip shows, e.g. "Exophase" for the Exophase
// registry entry: the part of the source's name before its first dash.
export function sourceShortName(source) {
  const name = source?.name ?? '';
  const cut = name.indexOf(' — ');
  return cut === -1 ? name : name.slice(0, cut);
}
