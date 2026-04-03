import { WorldObject } from '../types';

export const WORLD_OBJECTS: WorldObject[] = [
  {
    id: 'unfinished_map_1',
    name: 'Terrible Map',
    pos: { x: 1000, y: 1200 },
    size: { x: 40, y: 40 },
    color: '#ffaa00',
    type: 'object',
    interactable: true,
    description: 'A floating unfinished map. It looks unplayable. Rimai is screaming in the distance.'
  },
  {
    id: 'unfinished_map_2',
    name: 'Another Terrible Map',
    pos: { x: 1400, y: 1300 },
    size: { x: 50, y: 30 },
    color: '#ffaa00',
    type: 'object',
    interactable: true,
    description: 'This map has 20000 spikes in one tile. "PERFECTION" - Rimai.'
  },
  {
    id: 'arrow_banner',
    name: 'Banner',
    pos: { x: 1400, y: 100 },
    size: { x: 200, y: 40 },
    color: '#00ffff',
    type: 'object',
    interactable: true,
    description: '"THAT\'S WHY WE ARROW!" is written in glowing neon letters.'
  },
  {
    id: 'notice_board_discord',
    name: 'Notice Board',
    pos: { x: 1000, y: 200 },
    size: { x: 60, y: 80 },
    color: '#8b4513',
    type: 'object',
    interactable: true,
    description: 'Current drama: ripted leaked his own IP again. lmao.'
  },
  {
    id: 'champy_crying_sprite',
    name: 'Champy (Crying)',
    pos: { x: 2450, y: 150 },
    size: { x: 30, y: 30 },
    color: '#bf00ff',
    type: 'object',
    interactable: true,
    description: 'Champy is literally crying next to the leaderboard. "i should be #1" he sobbed.'
  },
  {
    id: 'leaderboard_narrow',
    name: 'Leaderboard',
    pos: { x: 2400, y: 100 },
    size: { x: 100, y: 150 },
    color: '#ffd700',
    type: 'object',
    interactable: true,
    description: '#1 Ripted\n#2 Champy (crying)\n#3 arrow_ghost (GLITCHING)'
  },
  {
    id: 'poop_video_plaque',
    name: 'Golden Plaque',
    pos: { x: 1200, y: 2000 },
    size: { x: 40, y: 40 },
    color: '#ffd700',
    type: 'object',
    interactable: true,
    description: 'Commemorating the poop video incident. 20000 years ago.'
  },
  {
    id: 'carving_20000',
    name: 'Floor Carving',
    pos: { x: 900, y: 2100 },
    size: { x: 100, y: 20 },
    color: '#333333',
    type: 'object',
    interactable: true,
    description: '"20000 years ago" is carved into the floor here.'
  },
  {
    id: 'update_fragment_3',
    name: 'Fragment',
    pos: { x: 1600, y: 2200 },
    size: { x: 20, y: 20 },
    color: '#ffffff',
    type: 'object',
    interactable: true,
    description: 'The final update fragment. It smells like 20000 years of development.'
  },
  {
    id: 'ripted_ip',
    name: 'Wall Graffiti',
    pos: { x: 1500, y: 1900 },
    size: { x: 80, y: 30 },
    color: '#ff0000',
    type: 'object',
    interactable: true,
    description: "It's Ripted's IP leak date. Nobody knows how it got here."
  },
  {
    id: 'zu_zahlen_graffiti',
    name: 'Graffiti',
    pos: { x: 100, y: 1500 },
    size: { x: 120, y: 40 },
    color: '#ffffff',
    type: 'object',
    interactable: true,
    description: '"Zu zahlen 0.01" is spray-painted here.'
  },
  {
    id: 'kiwi_apology',
    name: 'Kiwi Apology',
    pos: { x: 200, y: 1000 },
    size: { x: 50, y: 70 },
    color: '#ffffff',
    type: 'object',
    interactable: true,
    description: 'i am sorry for threatening poland. i will do it again.'
  },
  {
    id: 'speedrun_timer_1',
    name: 'Timer',
    pos: { x: 2000, y: 1100 },
    size: { x: 80, y: 40 },
    color: '#00ffff',
    type: 'object',
    interactable: true,
    description: 'A glowing timer. It shows 0.01. Polar is unimpressed.'
  },
  {
    id: 'speedrun_timer_2',
    name: 'Timer',
    pos: { x: 2400, y: 1200 },
    size: { x: 80, y: 40 },
    color: '#00ffff',
    type: 'object',
    interactable: true,
    description: 'This timer is counting up to 20000 years.'
  },
  {
    id: 'dead_zone_sign',
    name: 'Sign',
    pos: { x: 2000, y: 1900 },
    size: { x: 100, y: 60 },
    color: '#444444',
    type: 'object',
    interactable: true,
    description: 'A sign that says "Population: decreasing. Last active player: 20000 years ago."'
  },
  {
    id: 'update_fragment_1',
    name: 'Fragment',
    pos: { x: 2900, y: 700 },
    size: { x: 20, y: 20 },
    color: '#ffffff',
    type: 'object',
    interactable: true,
    description: 'A glowing update fragment. It contains code for a new level.'
  },
  {
    id: 'update_fragment_2',
    name: 'Fragment',
    pos: { x: 3200, y: 800 },
    size: { x: 20, y: 20 },
    color: '#ffffff',
    type: 'object',
    interactable: true,
    description: 'A glowing update fragment. It contains a bug fix for Champy.'
  },
  {
    id: 'baguette_table',
    name: 'Baguette',
    pos: { x: 3050, y: 350 },
    size: { x: 30, y: 10 },
    color: '#f5deb3',
    type: 'object',
    interactable: true,
    description: 'A very hard baguette. Could be used as a weapon.'
  }
];
