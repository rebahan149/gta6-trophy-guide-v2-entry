[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank · rebahan149/gta6-trophy-guide-v2-entry](https://make.fun/badge/gta6-trophy-guide-01/rebahan149/gta6-trophy-guide-v2-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01/rebahan149/gta6-trophy-guide-v2-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# The Leonida Trophy Ledger — GTA VI trophy guide & tracker, every claim cited

A static, fully offline guide and tracker for the 55 Grand Theft Auto VI
PlayStation 5 trophies. Every trophy keeps its official name, description and
grade exactly as published — 1 platinum, 2 gold, 6 silver, 46 bronze, 1,350
trophy points in all — and every guide is written as **cited steps**: each
step is one claim, with the sources it came from shown beside it.

## The citations, counted

The header of the app counts these from the shipped data at load; the same
count runs in `main.ts` before hand-in:

- **328 claims cited** — every trophy step, every missable flag note and
  every roadmap note in the guide.
- **328 of them backed by 2+ sources** — each claim names at least two of the
  guide's sources, and the app badges the ones that do.
- **3 distinct sources** — the official trophy lists as published by
  Exophase and PSNProfiles, plus Rockstar's official GTA VI page. The same
  three are the only pages this guide cites; nothing is invented.
- **55 of 55 trophies covered**, each with its own guide, 4–7 cited steps,
  and a closing listing check against both published lists.

## What's inside

- **Checklist & guides** — all 55 trophies with earned checkboxes, search,
  kind chips (story / missable / collectibles / activities), a grade filter,
  and a per-row count of cited claims. Clicking a trophy opens its full
  guide: official description, the cited steps with source chips, a missable
  warning where flagged, and its sources.
- **Count trackers** — the 22 trophies whose official descriptions name a
  number (250 stunts, 42 range golds, $250,000 earned, …) carry a − / +
  counter in the list and in the guide, with a progress bar; counters are
  saved with the rest of your progress and ride along in share links
  (`?counts=15:120,17:42`).
- **Trophy focus** — one trophy full-width: description, facts, missable
  warning, guide, every cited step and every source.
- **Platinum roadmap** — eight stages in play order, each with its own cited
  notes (chapter structure, the missable windows, the endgame split) and the
  trophies that belong to it.
- **Missables** — five flags (ids 37, 44, 47, 48, 49), each derived from its
  official description, each flag carrying its own cited "flag basis" note
  and the trophy's full cited steps.
- **Sources** — the three cited pages, with a live count of how many claims
  cite each.
- **Tracker** — progress is kept in `localStorage`: checklist, counters,
  spoiler shield (on by default — story trophies stay hidden until earned),
  hide-earned, export/import as a JSON file, and share links
  (`?earned=2,3,8,9`).

## Run it

Open `app/index.html` in a browser, or serve the folder:

```
node serve.ts        # then http://localhost:8080
```

`node main.ts` validates the data (exactly 55 trophies in the official grade
split, a guide and cited steps for each, the five missable flags, and the
citation totals) and writes the hand-in dossier. No build step, no network:
the app loads only its own files.

Original guide text and presentation; no Rockstar artwork or logos. Trophy
names and descriptions are the official published ones.
