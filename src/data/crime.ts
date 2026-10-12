import { Interactive, NPC } from '../types';
import { APPEARANCES } from './appearances';

/**
 * Mature-flavoured establishments and characters. Power-level content only:
 * the "wink" is cleaner than the "nudge" — everything suggestive happens behind
 * a fade-to-black, and nothing explicit is ever rendered. Products are invented
 * satirical brands.
 */

/** Business NPCs that add crime/humour flavour to the world. */
export const CRIME_NPCS: NPC[] = [
  {
    id: 'bandit',
    name: 'Bandit',
    pos: { x: 2050, y: 300 },
    size: { x: 40, y: 40 },
    color: '#c0392b',
    appearance: APPEARANCES.xazikk,
    type: 'npc',
    dialogueId: 'bandit_main',
    homeLocation: 'narrow_list_hq',
  },
  {
    id: 'mixologist',
    name: 'Mixologist',
    pos: { x: 3100, y: 1350 },
    size: { x: 38, y: 38 },
    color: '#c9a0c0',
    appearance: APPEARANCES.aqprox,
    type: 'npc',
    dialogueId: 'mixologist_main',
    homeLocation: 'speedrun_track',
  },
  {
    id: 'goose',
    name: 'The Goose',
    pos: { x: 4300, y: 2300 },
    size: { x: 34, y: 34 },
    color: '#e8e0d0',
    appearance: APPEARANCES.goosey,
    type: 'npc',
    dialogueId: 'goose_main',
    homeLocation: 'docks',
  },
];

/**
 * Crime-flavoured fixtures: shops (laundering fronts), a drinks bar, an adult
 * establishment that fades to black, dumpsters to search, and an ad kiosk.
 */
export const CRIME_INTERACTIVES: Interactive[] = [
  // ---- Grand theft auto: a scrapyard counter that "sells" cars --------------
  {
    id: 'shop_scrapyard',
    name: 'Scrapyard Counter',
    type: 'object',
    interactiveKind: 'merchant',
    pos: { x: 2150, y: 1250 },
    size: { x: 34, y: 40 },
    color: '#7a6a4a',
    description: 'A scrapyard that "acquires" cars, no questions asked.',
    stock: [
      { itemId: 'arrow_ale', price: 10 },
      { itemId: 'meme_dust', price: 30 },
      { itemId: 'wrench', price: 35 },
    ],
  },
  // ---- Bar: alcohol ---------------------------------------------------------
  {
    id: 'bar_taps',
    name: 'Hellcat Taps',
    type: 'object',
    interactiveKind: 'merchant',
    pos: { x: 3050, y: 1300 },
    size: { x: 40, y: 44 },
    color: '#8b5a2a',
    description: 'A neon bar. The ale is warm and the decisions are worse.',
    stock: [
      { itemId: 'arrow_ale', price: 10 },
      { itemId: 'server_nectar', price: 25 },
    ],
  },
  // ---- Adult establishment: satirical, fade to black ------------------------
  {
    id: 'bordello_door',
    name: 'The Feather Bordello',
    type: 'object',
    interactiveKind: 'bordello',
    pos: { x: 3450, y: 1450 },
    size: { x: 46, y: 60 },
    color: '#8a2a5a',
    description: 'A neon-pink doorway. The jokes are cheap; the cover charge is not.',
  },
  // ---- Dumpsters: crime + loot ---------------------------------------------
  {
    id: 'dumpster_polish',
    name: 'Overflowing Dumpster',
    type: 'object',
    interactiveKind: 'dumpster',
    pos: { x: 430, y: 1050 },
    size: { x: 54, y: 40 },
    color: '#3a4a3a',
    description: 'Someone threw away a perfectly good crime scene.',
  },
  {
    id: 'dumpster_docks',
    name: 'Dock Dumpster',
    type: 'object',
    interactiveKind: 'dumpster',
    pos: { x: 3700, y: 2250 },
    size: { x: 54, y: 40 },
    color: '#3a4a3a',
    description: 'Smells like the lower decks. Might be loot in there.',
  },
  // ---- Grand theft auto: stealable parked cars are marked by the runtime ----
  {
    id: 'sign_crime',
    name: 'District Sign',
    type: 'object',
    interactiveKind: 'sign',
    pos: { x: 1960, y: 1820 },
    size: { x: 40, y: 56 },
    color: '#8b3a3a',
    text: 'DEAD ZONE. Crime is legal here until someone sees you. Then it is a chase.',
  },
  {
    id: 'sign_bordello',
    name: 'Marquee Sign',
    type: 'object',
    interactiveKind: 'sign',
    pos: { x: 3380, y: 1380 },
    size: { x: 40, y: 56 },
    color: '#a02a6a',
    text: 'THE FEATHER — "OPEN LATE. VERY LATE." Under 17 admitted only as a joke.',
  },
];
