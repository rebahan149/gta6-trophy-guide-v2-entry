// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// This entry (v2) writes every guide as cited steps: each step is one claim and names its sources beside it, the
// big-number trophies carry count trackers, and the header counts the citations from the data itself. The validation
// below proves the data before hand-in: exactly 55 trophies in the official grade split, a guide and cited steps for
// every one, and the citation totals the entry's title reports.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).

// Entry author's addition: validate the guide data before handing in, and count its citations the same way the
// app does at load. The official list holds exactly 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze), each
// with a non-blank guide and at least one cited step; every step's sources must resolve to the source registry,
// and the five missable flags are the ones derived from the official descriptions (ids 37, 44, 47, 48, 49). A
// truncated, emptied or miscited data file fails here, loudly, rather than at the gate. This reads only files
// beside this program and writes nothing, so both grader runs stay byte-identical.
const trophyData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyList = trophyData.trophies ?? [];
const sourceRegistry = trophyData.sources ?? {};
if (trophyList.length !== 55) throw new Error(`expected 55 trophies in app/data/trophies.json, found ${trophyList.length}`);

const gradeTally = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
const missableIds = [];
let claimTotal = 0;
let multiSourceTotal = 0;
const distinctSources = new Set();
const tallyClaim = (claim, where) => {
  if (typeof claim?.t !== 'string' || claim.t.trim() === '') throw new Error(`${where}: a claim with no text`);
  if (!Array.isArray(claim.s) || claim.s.length === 0) throw new Error(`${where}: a claim with no sources`);
  for (const key of claim.s) {
    if (!(key in sourceRegistry)) throw new Error(`${where}: claim cites unknown source "${key}"`);
    distinctSources.add(key);
  }
  claimTotal += 1;
  if (claim.s.length >= 2) multiSourceTotal += 1;
};
for (const trophy of trophyList) {
  gradeTally[trophy.grade] = (gradeTally[trophy.grade] ?? 0) + 1;
  if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
    throw new Error(`trophy ${trophy.id} (${trophy.name}) has no guide`);
  }
  if (!Array.isArray(trophy.steps) || trophy.steps.length === 0) {
    throw new Error(`trophy ${trophy.id} (${trophy.name}) has no cited steps`);
  }
  for (const step of trophy.steps) tallyClaim(step, `trophy ${trophy.id} (${trophy.name})`);
  if (trophy.missableNote) tallyClaim(trophy.missableNote, `trophy ${trophy.id} (${trophy.name}) flag note`);
  if (trophy.missable) missableIds.push(trophy.id);
}
for (const stage of trophyData.roadmap ?? []) {
  for (const note of stage.notes ?? []) tallyClaim(note, `roadmap stage ${stage.stage}`);
}
if (gradeTally.platinum !== 1 || gradeTally.gold !== 2 || gradeTally.silver !== 6 || gradeTally.bronze !== 46) {
  throw new Error(`grade split is ${JSON.stringify(gradeTally)}, expected 1 platinum / 2 gold / 6 silver / 46 bronze`);
}
if (JSON.stringify(missableIds) !== JSON.stringify([37, 44, 47, 48, 49])) {
  throw new Error(`missable flags are ${JSON.stringify(missableIds)}, expected [37, 44, 47, 48, 49]`);
}
console.log(
  `Leonida Trophy Ledger v2: ${trophyList.length} trophies with cited guides — ${claimTotal} claims cited, ` +
    `${multiSourceTotal} backed by 2+ sources, ${distinctSources.size} distinct sources — handing in to ${out}`,
);

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
