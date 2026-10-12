import { Substance, SubstanceKind } from '../types';

/**
 * Fictional intoxicants. Everything here is invented for satire — there is no
 * real drug or brand behind any of it. Each substance is modelled as a timed
 * status effect (speed / camera wobble / screen tint) rather than an explicit
 * depiction of use.
 */
export const SUBSTANCES: Record<SubstanceKind, Substance> = {
  ale: {
    id: 'ale',
    name: 'Arrow Ale',
    tagline: '"THE OFFICIAL DRINK OF BAD DECISIONS." Brewed in the Dead Zone.',
    duration: 22,
    speedMul: 0.9,
    wobble: 6,
    tint: 'rgba(120, 80, 20, 0.16)',
    hpDelta: 5,
    comeDown: 'The room stops spinning. Mostly.',
  },
  dust: {
    id: 'dust',
    name: 'Meme Dust',
    tagline: '"ONE PUFF AND YOU SEE THE WHOLE TIMELINE." Not FDA-rated. Not rated at all.',
    duration: 16,
    speedMul: 1.35,
    wobble: 14,
    tint: 'rgba(120, 40, 160, 0.2)',
    hpDelta: -6,
    comeDown: 'You come down. The timeline looks worse now.',
  },
  nectar: {
    id: 'nectar',
    name: 'Server Nectar',
    tagline: '"PURE UNCUT UPTIME." Bottled from a warm server rack near the Docks.',
    duration: 28,
    speedMul: 1.15,
    wobble: 8,
    tint: 'rgba(40, 180, 160, 0.18)',
    hpDelta: 8,
    comeDown: 'The uptime ends. So does the feeling.',
  },
};

/** Inventory item ids that map to a substance when used. */
export const SUBSTANCE_ITEM: Record<string, SubstanceKind> = {
  arrow_ale: 'ale',
  meme_dust: 'dust',
  server_nectar: 'nectar',
};
