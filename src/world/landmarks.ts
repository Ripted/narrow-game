import { Prop, WorldObject } from '../types';

/** Builds a landmark prop from its ground point and footprint. */
function prop(id: string, kind: Prop['propKind'], gx: number, gy: number, w: number, h: number, color: string): Prop {
  return {
    id,
    name: kind,
    type: 'prop',
    propKind: kind,
    pos: { x: gx - w / 2, y: gy - h },
    size: { x: w, y: h },
    color,
  };
}

/**
 * Hand-placed Chiltown landmarks. The procedural passes cover the bulk of the
 * city; these are the few set pieces that have to sit in an exact spot — the
 * mirrored Kidney Bean, the pier ferris wheel, the River Ward gateway and the
 * elevated-train pylons that thread the Loop.
 */
export const LANDMARK_PROPS: Prop[] = [
  prop('landmark_bean', 'bean', 820, 4440, 140, 96, '#c9d8e4'),
  prop('landmark_ferris', 'ferris', 2320, 4240, 160, 150, '#e0e0e8'),
  prop('landmark_pagoda', 'pagoda', 4680, 3780, 110, 90, '#c93a2a'),

  // The elevated train, running the length of the Loop's mid-town avenue.
  prop('landmark_pylon_1', 'pylon', 420, 4860, 44, 130, '#7a7a84'),
  prop('landmark_pylon_2', 'pylon', 1020, 4860, 44, 130, '#7a7a84'),
  prop('landmark_pylon_3', 'pylon', 2020, 4860, 44, 130, '#7a7a84'),
  prop('landmark_pylon_4', 'pylon', 3420, 4860, 44, 130, '#7a7a84'),
  prop('landmark_pylon_5', 'pylon', 4620, 4860, 44, 130, '#7a7a84'),
  prop('landmark_pylon_6', 'pylon', 5420, 4860, 44, 130, '#7a7a84'),
];

/** Signs that name the new districts, so the city reads as navigable. */
export const LANDMARK_OBJECTS: WorldObject[] = [
  {
    id: 'sign_chiltown', name: 'Chiltown Sign', pos: { x: 180, y: 3640 },
    size: { x: 40, y: 56 }, color: '#c9a84a', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'WELCOME TO CHILTOWN. Population: enough. Home of the Bean, the L, and the worst traffic east of the river.',
  },
  {
    id: 'sign_bean', name: 'Bean Plaque', pos: { x: 880, y: 4420 },
    size: { x: 40, y: 40 }, color: '#c9d8e4', type: 'object', propKind: 'plaque',
    interactable: true,
    description: 'THE KIDNEY BEAN. A giant mirrored bean. Locals call it "the Bean". Tourists call it "the big silver bean". It reflects everything, including your mistakes.',
  },
  {
    id: 'sign_ferris', name: 'Pier Ticket Booth', pos: { x: 2400, y: 4260 },
    size: { x: 40, y: 40 }, color: '#e08a2a', type: 'object', propKind: 'plaque',
    interactable: true,
    description: 'PIER FERRIS WHEEL. Rides $8. The wheel has never once stopped at the top when you asked it to.',
  },
  {
    id: 'sign_pagoda', name: 'River Ward Gate', pos: { x: 4560, y: 3760 },
    size: { x: 40, y: 56 }, color: '#c93a2a', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'THE RIVER WARD. Lanterns, dumplings and a riverwalk that smells like the river. Mind the eels.',
  },
  {
    id: 'sign_l', name: 'L Platform Sign', pos: { x: 1480, y: 4840 },
    size: { x: 40, y: 56 }, color: '#4a90d0', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'THE L. An elevated train that runs all night and rattles your fillings out. Next train: whenever.',
  },
  {
    id: 'sign_steelworks', name: 'Steelworks Gate', pos: { x: 6420, y: 6080 },
    size: { x: 40, y: 56 }, color: '#b05a2a', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'THE STEELWORKS. Hot metal, hotter tempers. Hard hats required, shirts optional.',
  },
  {
    id: 'sign_airport', name: 'Airport Sign', pos: { x: 6420, y: 3240 },
    size: { x: 40, y: 56 }, color: '#3a7ab0', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'GRAND LAKE AIRPORT. Two runways. Security is a guy named Dale who mostly checks the weather.',
  },
  {
    id: 'sign_northshore', name: 'North Shore Sign', pos: { x: 6420, y: 1560 },
    size: { x: 40, y: 56 }, color: '#7a9a6a', type: 'object', propKind: 'sign',
    interactable: true,
    description: 'NORTH SHORE HEIGHTS. Cross the Chiltown Bridge and keep going. Yes, the houses really are that big.',
  },
];
