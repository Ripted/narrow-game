import { NPC } from '../types';
import { APPEARANCES } from './appearances';
import { CRIME_NPCS } from './crime';

export const NPCS: NPC[] = [
  {
    id: 'ripted',
    name: 'Ripted',
    pos: { x: 1400, y: 500 },
    size: { x: 40, y: 40 },
    color: '#ffd700', // Gold
    appearance: APPEARANCES.ripted,
    type: 'npc',
    dialogueId: 'ripted_main',
    homeLocation: 'discord_hub'
  },
  {
    id: 'champy',
    name: 'Champy',
    pos: { x: 2400, y: 400 },
    size: { x: 35, y: 35 },
    color: '#bf00ff', // Purple
    appearance: APPEARANCES.champy,
    type: 'npc',
    dialogueId: 'champy_main',
    homeLocation: 'narrow_list_hq'
  },
  {
    id: 'sam',
    name: 'Sam',
    pos: { x: 2200, y: 300 },
    size: { x: 35, y: 35 },
    color: '#00ff00', // Green
    appearance: APPEARANCES.sam,
    type: 'npc',
    dialogueId: 'sam_main',
    homeLocation: 'narrow_list_hq'
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    pos: { x: 400, y: 1200 },
    size: { x: 40, y: 40 },
    color: '#ff0000', // Red
    appearance: APPEARANCES.kiwi,
    type: 'npc',
    dialogueId: 'kiwi_main',
    homeLocation: 'polish_district'
  },
  {
    id: 'esh',
    name: 'ESH',
    pos: { x: 3100, y: 900 },
    size: { x: 50, y: 50 },
    color: 'rgba(255, 255, 255, 0.3)', // White glow
    appearance: APPEARANCES.esh,
    type: 'npc',
    dialogueId: 'esh_main',
    homeLocation: 'dev_room'
  },
  {
    id: 'rimai',
    name: 'Rimai',
    pos: { x: 1300, y: 1400 },
    size: { x: 35, y: 35 },
    color: '#ff4500', // Orange-red
    appearance: APPEARANCES.rimai,
    type: 'npc',
    dialogueId: 'rimai_main',
    homeLocation: 'level_editor'
  },
  {
    id: 'goosey',
    name: 'Goosey',
    pos: { x: 2300, y: 2100 },
    size: { x: 35, y: 35 },
    color: '#8b0000', // Dark red
    appearance: APPEARANCES.goosey,
    type: 'npc',
    dialogueId: 'goosey_main',
    homeLocation: 'dead_zone'
  },
  {
    id: 'aqprox',
    name: 'Aqprox',
    pos: { x: 2300, y: 1400 },
    size: { x: 35, y: 35 },
    color: 'rgba(0, 255, 255, 0.2)', // Faded cyan
    appearance: APPEARANCES.aqprox,
    type: 'npc',
    dialogueId: 'aqprox_main',
    homeLocation: 'speedrun_track'
  },
  {
    id: 'hydo',
    name: 'Hydo',
    pos: { x: 400, y: 300 },
    size: { x: 35, y: 35 },
    color: '#808080', // Mid grey
    appearance: APPEARANCES.hydo,
    type: 'npc',
    dialogueId: 'hydo_main',
    homeLocation: 'newcomer_spawn'
  },
  {
    id: 'xazikk',
    name: 'Xazikk',
    pos: { x: 3000, y: 300 },
    size: { x: 30, y: 30 },
    color: '#708090', // Blue-grey
    appearance: APPEARANCES.xazikk,
    type: 'npc',
    dialogueId: 'xazikk_main',
    homeLocation: 'french_cafe'
  },
  {
    id: 'mazyx',
    name: 'Mazyx',
    pos: { x: 3100, y: 300 },
    size: { x: 30, y: 30 },
    color: '#778899', // Grey-blue
    appearance: APPEARANCES.mazyx,
    type: 'npc',
    dialogueId: 'mazyx_main',
    homeLocation: 'french_cafe'
  },
  {
    id: 'arrow_ghost',
    name: 'arrow_ghost',
    pos: { x: 2600, y: 200 },
    size: { x: 30, y: 30 },
    color: '#ffffff', // White
    appearance: APPEARANCES.arrow_ghost,
    type: 'npc',
    dialogueId: 'arrow_ghost_main',
    homeLocation: 'narrow_list_hq',
    boss: true,
    hp: 60
  },
  {
    id: 'polar',
    name: 'Polar',
    pos: { x: 2100, y: 1400 },
    size: { x: 35, y: 35 },
    color: '#add8e6', // Light blue
    appearance: APPEARANCES.polar,
    type: 'npc',
    dialogueId: 'polar_main',
    homeLocation: 'speedrun_track'
  },
  ...CRIME_NPCS
];
