import { Schedule } from '../types';

/**
 * Named patrol routes. Waypoints are hand-placed in open ground (clear of the
 * generated buildings) so NPCs walk believable paths without needing the full
 * collision system. Any NPC that references one of these strolls it by day.
 */
export const SCHEDULES: Record<string, Schedule> = {
  spawn_loop: {
    id: 'spawn_loop',
    speed: 42,
    waypoints: [
      { x: 360, y: 560 },
      { x: 640, y: 620, wait: 1.5 },
      { x: 660, y: 760 },
      { x: 460, y: 820, wait: 2 },
    ],
  },
  hub_walk: {
    id: 'hub_walk',
    speed: 55,
    waypoints: [
      { x: 1000, y: 420 },
      { x: 1500, y: 420, wait: 1 },
      { x: 1750, y: 700 },
      { x: 1100, y: 780, wait: 2 },
    ],
  },
  hq_patrol: {
    id: 'hq_patrol',
    speed: 48,
    waypoints: [
      { x: 2150, y: 250 },
      { x: 2450, y: 250, wait: 1.5 },
      { x: 2600, y: 480 },
      { x: 2200, y: 560, wait: 1 },
    ],
  },
  polish_march: {
    id: 'polish_march',
    speed: 40,
    waypoints: [
      { x: 250, y: 800 },
      { x: 250, y: 1300, wait: 2 },
      { x: 600, y: 1500 },
      { x: 400, y: 1000, wait: 1 },
    ],
  },
  editor_pace: {
    id: 'editor_pace',
    speed: 46,
    waypoints: [
      { x: 1000, y: 1150 },
      { x: 1600, y: 1150, wait: 1.5 },
      { x: 1600, y: 1600 },
      { x: 1050, y: 1650, wait: 1 },
    ],
  },
  track_run: {
    id: 'track_run',
    speed: 70,
    waypoints: [
      { x: 1900, y: 1150 },
      { x: 2700, y: 1150, wait: 0.5 },
      { x: 2700, y: 1650 },
      { x: 1900, y: 1650, wait: 0.5 },
    ],
  },
  cafe_stroll: {
    id: 'cafe_stroll',
    speed: 44,
    waypoints: [
      { x: 2900, y: 200 },
      { x: 3250, y: 250, wait: 1.5 },
      { x: 3250, y: 500 },
      { x: 2900, y: 480, wait: 1 },
    ],
  },
  archives_search: {
    id: 'archives_search',
    speed: 42,
    waypoints: [
      { x: 900, y: 1980 },
      { x: 1650, y: 2000, wait: 2 },
      { x: 1650, y: 2250 },
      { x: 950, y: 2250, wait: 1 },
    ],
  },
  dead_drift: {
    id: 'dead_drift',
    speed: 34,
    waypoints: [
      { x: 1900, y: 2050 },
      { x: 2600, y: 2050, wait: 2.5 },
      { x: 2600, y: 2250 },
      { x: 1950, y: 2250, wait: 2 },
    ],
  },
  shrine_linger: {
    id: 'shrine_linger',
    speed: 30,
    waypoints: [
      { x: 2950, y: 800 },
      { x: 3200, y: 800, wait: 3 },
      { x: 3200, y: 1050 },
      { x: 2950, y: 1050, wait: 2 },
    ],
  },
};

/** Per-NPC route + overnight shelter assignment. */
export const NPC_ROUTINES: Record<string, { scheduleId?: string; nightBuildingIdZone?: string }> = {
  hydo: { scheduleId: 'spawn_loop', nightBuildingIdZone: 'newcomer_spawn' },
  ripted: { scheduleId: 'hub_walk' },
  sam: { scheduleId: 'hq_patrol' },
  champy: { scheduleId: 'hq_patrol', nightBuildingIdZone: 'narrow_list_hq' },
  kiwi: { scheduleId: 'polish_march', nightBuildingIdZone: 'polish_district' },
  rimai: { scheduleId: 'editor_pace', nightBuildingIdZone: 'level_editor' },
  aqprox: { scheduleId: 'track_run' },
  polar: { scheduleId: 'track_run' },
  xazikk: { scheduleId: 'cafe_stroll', nightBuildingIdZone: 'french_cafe' },
  mazyx: { scheduleId: 'cafe_stroll' },
  goosey: { scheduleId: 'dead_drift', nightBuildingIdZone: 'dead_zone' },
  esh: { scheduleId: 'shrine_linger', nightBuildingIdZone: 'dev_room' },
};
