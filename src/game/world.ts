import { Building, Door, Gate, Interior, NPC, Vector2 } from '../types';
import { NPCS } from '../data/npcs';
import { BUILDINGS } from '../world/buildings';
import { GATES } from '../world/interactives';
import { interiorFor } from '../world/interiors';
import { SCHEDULES, NPC_ROUTINES } from './schedules';

/** Length of a full day/night cycle, in seconds. */
export const DAY_LENGTH = 180;

/** How far south of a wall base the door sensor sits, in pixels. */
const playerApproachOffset = 14;

interface LiveNpc extends NPC {
  /** Current waypoint index on the assigned route. */
  wpIndex: number;
  /** Seconds still to wait at the current waypoint. */
  wait: number;
  /** 0..1 smoothly interpolated night fade for drawing. */
  nightFade: number;
}

/**
 * Mutable runtime state for the living world: the clock, wandering NPCs, the
 * building door/interior registry and gate/lever state.
 *
 * The procedural generators stay pure; everything that changes as the player
 * plays lives here, so saves can capture it and the render loop can read it.
 */
export class WorldRuntime {
  /** Seconds since the world started. */
  clock = 24; // begin mid-morning
  night = false;
  npcs: LiveNpc[];
  doors: Door[] = [];
  interiors = new Map<string, Interior>();
  gates: Gate[];
  /** Building id -> the interiors of a zone, used for night occupancy. */
  private interiorByBuilding = new Map<string, Interior>();
  private buildingByZone = new Map<string, Building[]>();

  constructor() {
    for (const b of BUILDINGS) {
      const arr = this.buildingByZone.get(this.zoneOf(b.id)) || [];
      arr.push(b);
      this.buildingByZone.set(this.zoneOf(b.id), arr);

      const interior = interiorFor(b);
      if (interior) {
        this.interiors.set(interior.id, interior);
        this.interiorByBuilding.set(b.id, interior);
        this.doors.push({
          buildingId: b.id,
          interiorId: interior.id,
          // Sensor sits just south of the wall base so a walking player can
          // reach it (the footprint itself is solid).
          x: b.pos.x + b.size.x / 2,
          y: b.pos.y + b.size.y + playerApproachOffset,
        });
      }
    }

    this.gates = GATES.map((g) => ({ ...g }));

    this.npcs = this.buildNpcs();
  }

  private zoneOf(buildingId: string): string {
    // ids look like `building_<zone>_<n>`; zones never contain underscores in a
    // way that matters here because we match against the known zone list.
    const rest = buildingId.replace(/^building_/, '');
    return rest.replace(/_\d+$/, '');
  }

  private buildNpcs(): LiveNpc[] {
    return NPCS.map((n) => {
      const routine = NPC_ROUTINES[n.id] || {};
      return {
        ...n,
        pos: { ...n.pos },
        scheduleId: routine.scheduleId,
        nightBuildingId: routine.nightBuildingIdZone
          ? this.buildingByZone.get(routine.nightBuildingIdZone)?.[0]?.id
          : undefined,
        wpIndex: 0,
        wait: 0,
        nightFade: 0,
      } as LiveNpc;
    });
  }

  get timeOfDay(): number {
    return (this.clock % DAY_LENGTH) / DAY_LENGTH;
  }

  /** Warmth 0 (deep night) .. 1 (noon), for lighting. */
  get daylight(): number {
    const t = this.timeOfDay;
    // Daylight from 0.0-0.03 and 0.72-1.0 is night; ramp around the edges.
    const dawn = 0.04;
    const dusk = 0.72;
    if (t > dusk) return Math.max(0, 1 - (t - dusk) / 0.1);
    if (t < dawn) return Math.min(1, t / dawn);
    return 1;
  }

  update(dtSec: number) {
    this.clock += dtSec;
    const t = this.timeOfDay;
    // Night from ~72% through the day until just after it wraps.
    this.night = t > 0.72 || t < 0.04;

    for (const npc of this.npcs) {
      const target = this.night ? 0 : 1;
      npc.nightFade += (target - npc.nightFade) * Math.min(1, dtSec * 1.5);
      if (this.night) continue;
      this.stepNpc(npc, dtSec);
    }

    // Reset interior occupants each frame (cheap lists).
    for (const interior of this.interiors.values()) interior.occupants = [];
    if (this.night) {
      for (const npc of this.npcs) {
        if (!npc.nightBuildingId) continue;
        const interior = this.interiorByBuilding.get(npc.nightBuildingId);
        if (interior) interior.occupants.push(npc.id);
      }
    }
  }

  private stepNpc(npc: LiveNpc, dtSec: number) {
    const sched = npc.scheduleId ? SCHEDULES[npc.scheduleId] : null;
    if (!sched || sched.waypoints.length === 0) {
      // No route: drift gently around the spawn for a lived-in feel.
      npc.pos.x += Math.sin(this.clock * 0.6 + npc.pos.y) * 6 * dtSec;
      return;
    }
    if (npc.wait > 0) {
      npc.wait -= dtSec;
      return;
    }
    const wp = sched.waypoints[npc.wpIndex];
    const dx = wp.x - npc.pos.x;
    const dy = wp.y - npc.pos.y;
    const dist = Math.hypot(dx, dy);
    const step = sched.speed * dtSec;
    if (dist <= step) {
      npc.pos.x = wp.x;
      npc.pos.y = wp.y;
      npc.wpIndex = (npc.wpIndex + 1) % sched.waypoints.length;
      npc.wait = wp.wait ?? 0;
    } else {
      npc.pos.x += (dx / dist) * step;
      npc.pos.y += (dy / dist) * step;
    }
  }

  /** The interior behind a building, if it has one. */
  interiorForBuilding(buildingId: string): Interior | undefined {
    return this.interiorByBuilding.get(buildingId);
  }

  /** Finds a door the player is standing on, if any. */
  doorAt(pos: Vector2, playerSize: Vector2, radius = 40): Door | null {
    for (const d of this.doors) {
      const dist = Math.hypot(
        pos.x + playerSize.x / 2 - d.x,
        pos.y + playerSize.y / 2 - d.y
      );
      if (dist < radius) return d;
    }
    return null;
  }

  /** Solid world rectangles for exterior collision (buildings + closed gates). */
  exteriorSolids(): { pos: Vector2; size: Vector2 }[] {
    const solids: { pos: Vector2; size: Vector2 }[] = [];
    for (const g of this.gates) if (!g.open) solids.push({ pos: g.pos, size: g.size });
    return solids;
  }

  isGateOpen(flag: string): boolean {
    return this.gates.some((g) => g.openFlag === flag && g.open);
  }

  openGateByFlag(flag: string) {
    for (const g of this.gates) if (g.openFlag === flag) g.open = true;
  }

  /** Live NPCs visible in the exterior (night shelterers are hidden). */
  visibleNpcs(): LiveNpc[] {
    return this.npcs.filter((n) => !(this.night && n.nightBuildingId));
  }

  npcById(id: string): LiveNpc | undefined {
    return this.npcs.find((n) => n.id === id);
  }
}
