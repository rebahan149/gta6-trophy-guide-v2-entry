// roadmap.js — the platinum roadmap: eight stages, in the order to play them.
// The order is built from the official trophy descriptions: the chapter and
// named-mission trophies fix the story spine, the stranger finales form their
// own block, and the counters and collectibles fill the stages after the
// finale. Each stage's cited notes live in data/trophies.json, beside the
// trophies they cite.

export const ROADMAP_STAGES = [
  {
    n: 1,
    title: 'Arrival — the opening hours',
    blurb:
      'Gone Fishing and the whole of Chapter 1. One flagged moment lives here: the Ocean Beach cocktail behind In The Beginning… — when the story puts you on the beach, take the moment instead of rushing the objective.',
  },
  {
    n: 2,
    title: 'The campaign — Chapters 2 to 4',
    blurb:
      'The story\u2019s main block: Chapters 2, 3 and 4 plus the six named missions (Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown, Operation Savage Glory). During VCIA Takedown, take the unscheduled departure at the airport for Catch Me If You Can.',
  },
  {
    n: 3,
    title: 'Endgame — the finale and its choices',
    blurb:
      'The final mission and the choice-driven trophies around it. Keep a manual save before big story decisions from Chapter 3 onward: Actions Speak Louder, Bad Luck, I Guess and Personal Best are all flagged from their descriptions as moments that may not come twice.',
  },
  {
    n: 4,
    title: 'Strangers & freaks — the side strands',
    blurb:
      'Finish the five named strands — Andy, Kenton, Billy, Randy and Tyrone — plus Bret\u2019s unique-animal hunt, then any further strands until eight are complete for the silver Strangers & Freaks.',
  },
  {
    n: 5,
    title: 'The collection sweep',
    blurb:
      'Card sets, WAiNK It spots, meditation spots, 100 discovered vehicles, and uncovering all 52 areas of Leonida. Do this after the story, when every district is open and the map can be swept in one pass.',
  },
  {
    n: 6,
    title: 'Activities, mastery and money',
    blurb:
      '250 stunts, gold in all 42 Shooting Range challenges, drone races at all 14 locations, 20 race wins, 50 challenges — and the money milestones: $250,000 laundered, $100,000 spent, every garage bought, 10 vehicles registered to the Scooter Bros app.',
  },
  {
    n: 7,
    title: 'Free-roam feats & robberies',
    blurb:
      'The sandbox trophies: the partner escape and the three-shop chain, the Rhino tank, the undetected jewelry robbery, five bank vaults, an armored truck, one illegal operation per gang, the showroom smash, the bowling feats and the strange event in the wilds.',
  },
  {
    n: 8,
    title: 'The last percent',
    blurb:
      'Close out 100% completion with the in-game completion screen as the checklist of what is left — and the platinum, Vice Got a Price!, lands the moment the 54th other trophy does.',
  },
];

export function stageByNumber(n) {
  return ROADMAP_STAGES.find((s) => s.n === n) ?? ROADMAP_STAGES[0];
}

export function trophiesInStage(trophies, n) {
  return trophies.filter((t) => t.stage === n);
}

// The cited notes a stage carries in the data file (possibly none).
export function notesForStage(data, n) {
  const entry = (data.roadmap ?? []).find((r) => r.stage === n);
  return entry?.notes ?? [];
}
