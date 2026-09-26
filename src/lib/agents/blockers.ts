// LOCKED BUYING BLOCKER CHECKLIST — Phase 1, before any fix prompt was written.
//
// This is the independent scorecard. Shopper personas score product pages
// against it. The fixer agent never sees this file. That separation is what
// makes "did the fix work?" a real question rather than AI grading itself.
//
// DO NOT EDIT AFTER THE PHASE 1 SYNC. The git commit timestamp is the proof.

import type { BlockerId } from './types';

export interface Blocker {
  id: BlockerId;
  label: string;
  /** What the shopper checks for on the page. */
  test: string;
}

export const BLOCKERS: Blocker[] = [
  {
    id: 'size_guide',
    label: 'No size information',
    test: 'The page gives no measurements, size chart, or fit guidance, so I cannot tell whether it will fit me.',
  },
  {
    id: 'materials',
    label: 'No material or composition',
    test: 'The page does not say what the item is made of, so I cannot judge quality, care, or whether I react to the fabric.',
  },
  {
    id: 'returns',
    label: 'Unclear returns',
    test: 'The page does not state a returns window or who pays return postage, so buying feels risky.',
  },
  {
    id: 'price_vs_comps',
    label: 'Price out of line',
    test: 'The price is noticeably higher than what I would expect to pay elsewhere for a comparable item.',
  },
  {
    id: 'lead_image',
    label: 'Weak lead image',
    test: 'The first image is missing, low quality, or does not show the actual product clearly enough to judge it.',
  },
];

export const BLOCKER_IDS = BLOCKERS.map((b) => b.id);
