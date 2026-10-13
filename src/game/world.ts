import { Building, Car, Door, Enemy, Gate, GoreDecal, Interior, NPC, PoliceUnit, TrafficRoute, Vector2, WeatherKind, WorldSave, WantedState } from '../types';
import { NPCS } from '../data/npcs';
import { BUILDINGS } from '../world/buildings';
import { GATES, INTERACTIVES } from '../world/interactives';
import { interiorFor } from '../world/interiors';
import { parkedCars, TRAFFIC_ROUTES, carSpec } from '../world/cars';
import { spawnEnemies, POLICE_SPEC } from '../world/enemies';
import { WeatherSystem } from '../world/weather';
import { SCHEDULES, NPC_ROUTINES } from './schedules';

/** Length of a full day/night cycle, in seconds. */
export const DAY_LENGTH = 180;

/** How far south of a wall base the door sensor sits, in pixels. */
const playerApproachOffset = 14;

/** Distance at which a hostile notices and chases the player. */
const AGGRO_RANGE = 270;
/** Distance from home beyond which the enemy gives up and returns. */
const LEASH_RANGE = 520;
/** Heat threshold for each successive wanted star. */
const STAR_HEAT = [0.12, 0.3, 0.5, 0.7, 0.88];
/** Police further than this from the player are despawned. */
const POLICE_DESPAWN_RANGE = 2600;

interface LiveNpc extends NPC {
  /** Current waypoint index on the assigned route. */
  wpIndex: number;
  /** Seconds still to wait at the current waypoint. */
  wait: number;
  /** 0..1 smoothly interpolated night fade for drawing. */
  nightFade: number;
}

interface RouteGeom {
  pts: Vector2[];
  /** Cumulative length at each point (last equals total). */
  cum: number[];
  total: number;
}

/**
 * Mutable runtime state for the living world: the clock, wandering NPCs, the
 * building door/interior registry, traffic, hostiles, weather and gate state.
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
  cars: Car[];
  enemies: Enemy[];
  police: PoliceUnit[] = [];
  wanted: WantedState = { level: 0, heat: 0, cooldown: 0 };
  /** Blood decals, persisted with the world. */
  gore: GoreDecal[] = [];
  weather = new WeatherSystem();
  /** Damage the player should take this frame from enemy contact. */
  pendingDamage = 0;
  /** True when a police bullet or baton landed this frame. */
  pendingPoliceHit = false;
  /** Crime events raised this frame, for the app to toast/score. */
  crimeEvents: string[] = [];
  /** Id of the parked car currently being driven, so it saves in place. */
  drivenCarId: string | null = null;
  /** Ids of fixtures already consumed (chests opened, levers pulled). */
  usedInteractives = new Set<string>();
  /** Lever/gate flags that have been activated, so they persist. */
  openGateFlags = new Set<string>();
  /** Enemy ids defeated, so they do not respawn on load. */
  private deadEnemies = new Set<string>();
  /** Building id -> the interiors of a zone, used for night occupancy. */
  private interiorByBuilding = new Map<string, Interior>();
  private buildingByZone = new Map<string, Building[]>();
  private routes = new Map<string, RouteGeom>();
  private viewport: Vector2 = { x: 1280, y: 720 };
  private policeSpawnTimer = 0;
  private nextPoliceId = 0;

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
    this.cars = [...parkedCars(), ...this.buildTraffic()];
    this.enemies = spawnEnemies();
    this.npcs = this.buildNpcs();
    for (const r of TRAFFIC_ROUTES) this.routes.set(r.id, this.geometryFor(r));
  }

  private geometryFor(route: TrafficRoute): RouteGeom {
    const pts = route.points.map((p) => ({ ...p }));
    const cum: number[] = [0];
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      total += Math.hypot(b.x - a.x, b.y - a.y);
      cum.push(total);
    }
    return { pts, cum, total };
  }

  private buildTraffic(): Car[] {
    const out: Car[] = [];
    for (const route of TRAFFIC_ROUTES) {
      for (let i = 0; i < route.count; i++) {
        const kind = route.id.includes('highway') ? (i % 2 ? 'truck' : 'sedan')
          : route.id.includes('east') ? 'van' : 'hatch';
        const s = carSpec(kind);
        out.push({
          id: `car_${route.id}_${i}`,
          name: kind,
          type: 'car',
          carKind: kind,
          pos: { x: 0, y: 0 },
          size: { x: s.w, y: s.h },
          color: s.body,
          angle: 0,
          speed: route.speed,
          routeId: route.id,
          routeDist: 0,
        });
      }
    }
    return out;
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

  setViewport(w: number, h: number) {
    this.viewport = { x: w, y: h };
  }

  update(dtSec: number, playerPos?: Vector2) {
    this.clock += dtSec;
    const t = this.timeOfDay;
    // Night from ~72% through the day until just after it wraps.
    this.night = t > 0.72 || t < 0.04;
    this.pendingDamage = 0;

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

    this.stepTraffic(dtSec);
    if (playerPos) {
      this.stepEnemies(dtSec, playerPos);
      this.stepWanted(dtSec, playerPos);
      this.stepPolice(dtSec, playerPos);
    }
    this.weather.update(dtSec, this.viewport.x, this.viewport.y, this.daylight);
  }

  /** Registers a crime, raising heat toward the matching star level. */
  commitCrime(kind: string, heat: number) {
    this.wanted.heat = Math.min(1, this.wanted.heat + heat);
    this.wanted.cooldown = 6;
    this.crimeEvents.push(kind);
  }

  private stepWanted(dtSec: number, playerPos: Vector2) {
    if (this.wanted.cooldown > 0) this.wanted.cooldown -= dtSec;
    // Heat cools only once the player has been out of trouble for a moment.
    if (this.wanted.cooldown <= 0 && this.wanted.heat > 0) {
      this.wanted.heat = Math.max(0, this.wanted.heat - dtSec * 0.05);
    }
    // Police in contact keep the chase hot.
    const seen = this.police.some(
      (p) => Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y) < 340
    );
    if (seen) this.wanted.heat = Math.min(1, this.wanted.heat + dtSec * 0.06);

    let level = 0;
    for (let i = 0; i < STAR_HEAT.length; i++) if (this.wanted.heat >= STAR_HEAT[i]) level = i + 1;
    this.wanted.level = level;
  }

  private stepPolice(dtSec: number, playerPos: Vector2) {
    // Spawn units while wanted, scaling with the star level.
    if (this.wanted.level > 0) {
      this.policeSpawnTimer -= dtSec;
      const target = this.wanted.level;
      if (this.policeSpawnTimer <= 0 && this.police.length < target) {
        this.policeSpawnTimer = 1.6;
        this.spawnPolice(playerPos);
      }
    } else if (this.police.length === 0) {
      this.policeSpawnTimer = 0;
    }

    for (const p of this.police) {
      if (p.cooldown && p.cooldown > 0) p.cooldown -= dtSec;
      const pcx = playerPos.x;
      const pcy = playerPos.y;
      const ecx = p.pos.x + p.size.x / 2;
      const ecy = p.pos.y + p.size.y / 2;
      const dx = pcx - ecx;
      const dy = pcy - ecy;
      const d = Math.hypot(dx, dy) || 1;
      const step = p.speed * dtSec;
      const nx = p.pos.x + (dx / d) * step;
      const ny = p.pos.y + (dy / d) * step;
      if (!this.insideBuilding(nx, ny, p.size)) {
        p.pos.x = nx;
        p.pos.y = ny;
      }
      // Baton contact damage, rate-limited.
      if (d < 28 + p.size.x / 2 && (!p.cooldown || p.cooldown <= 0)) {
        this.pendingDamage += p.damage;
        this.pendingPoliceHit = true;
        p.cooldown = 1.1;
      }
    }

    // Despawn units that fall far behind once the heat is down.
    if (this.wanted.level === 0) {
      this.police = this.police.filter(
        (p) => Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y) < POLICE_DESPAWN_RANGE
      );
    }
  }

  private spawnPolice(playerPos: Vector2) {
    // Spawn just off-screen in a random direction.
    const ang = Math.random() * Math.PI * 2;
    const dist = 700 + Math.random() * 300;
    const x = Math.max(0, Math.min(5600 - POLICE_SPEC.size.x, playerPos.x + Math.cos(ang) * dist));
    const y = Math.max(0, Math.min(4000 - POLICE_SPEC.size.y, playerPos.y + Math.sin(ang) * dist));
    this.police.push({
      id: `police_${this.nextPoliceId++}`,
      name: 'Police Cruiser',
      type: 'enemy',
      enemyKind: 'police',
      pos: { x, y },
      size: { ...POLICE_SPEC.size },
      color: POLICE_SPEC.color,
      hp: POLICE_SPEC.hp,
      maxHp: POLICE_SPEC.hp,
      damage: POLICE_SPEC.damage,
      speed: POLICE_SPEC.speed,
      home: { x, y },
      cooldown: 0,
    });
  }

  /** Adds a stylised blood decal at the given world point. */
  addGore(x: number, y: number, style: GoreDecal['style'] = 'splat', size = 1) {
    this.gore.push({ x, y, size, style });
    if (this.gore.length > 220) this.gore.splice(0, this.gore.length - 220);
  }

  /** True when any police unit can currently see the player. */
  policeVisible(playerPos: Vector2): boolean {
    return this.police.some(
      (p) => Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y) < 340
    );
  }

  private stepTraffic(dtSec: number) {
    for (const car of this.cars) {
      if (!car.routeId) continue;
      const geom = this.routes.get(car.routeId);
      if (!geom || geom.total <= 0) continue;
      car.routeDist = ((car.routeDist ?? 0) + (car.speed || 0) * dtSec) % geom.total;
      const d = car.routeDist;
      // Binary-search the segment containing `d` (cumulative lengths ascend).
      let lo = 0;
      let hi = geom.pts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (geom.cum[mid] <= d) lo = mid;
        else hi = mid - 1;
      }
      const i = lo;
      const a = geom.pts[i % geom.pts.length];
      const b = geom.pts[(i + 1) % geom.pts.length];
      const segLen = Math.max(1, geom.cum[i + 1] - geom.cum[i]);
      const f = (d - geom.cum[i]) / segLen;
      const cx = a.x + (b.x - a.x) * f;
      const cy = a.y + (b.y - a.y) * f;
      car.pos = { x: cx - car.size.x / 2, y: cy - car.size.y / 2 };
      car.angle = Math.atan2(b.y - a.y, b.x - a.x);
    }
  }

  private stepEnemies(dtSec: number, playerPos: Vector2) {
    for (const e of this.enemies) {
      if (e.cooldown && e.cooldown > 0) e.cooldown -= dtSec;
      const pcx = playerPos.x;
      const pcy = playerPos.y;
      const dist = Math.hypot(pcx - (e.pos.x + e.size.x / 2), pcy - (e.pos.y + e.size.y / 2));
      const homeDist = Math.hypot(e.home.x - (e.pos.x + e.size.x / 2), e.home.y - (e.pos.y + e.size.y / 2));

      let tx: number | null = null;
      let ty: number | null = null;
      if (dist < AGGRO_RANGE && homeDist < LEASH_RANGE) {
        tx = pcx;
        ty = pcy;
      } else if (homeDist > 12) {
        tx = e.home.x;
        ty = e.home.y;
      }
      if (tx !== null && ty !== null) {
        const ecx = e.pos.x + e.size.x / 2;
        const ecy = e.pos.y + e.size.y / 2;
        const dx = tx - ecx;
        const dy = ty - ecy;
        const d = Math.hypot(dx, dy) || 1;
        const step = e.speed * dtSec;
        const nx = e.pos.x + (dx / d) * step;
        const ny = e.pos.y + (dy / d) * step;
        // Crude building avoidance: refuse a step that lands inside a footprint.
        if (!this.insideBuilding(nx, ny, e.size)) {
          e.pos.x = nx;
          e.pos.y = ny;
        }
      }

      // Contact damage, rate-limited per enemy.
      const contact = Math.hypot(pcx - (e.pos.x + e.size.x / 2), pcy - (e.pos.y + e.size.y / 2));
      if (contact < 26 + e.size.x / 2 && (!e.cooldown || e.cooldown <= 0)) {
        this.pendingDamage += e.damage;
        e.cooldown = 0.9;
      }
    }
  }

  private insideBuilding(x: number, y: number, size: Vector2): boolean {
    for (const b of BUILDINGS) {
      if (x < b.pos.x + b.size.x && x + size.x > b.pos.x && y < b.pos.y + b.size.y && y + size.y > b.pos.y) {
        return true;
      }
    }
    return false;
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

  /** Live (non-parked) cars. */
  traffic(): Car[] {
    return this.cars.filter((c) => c.routeId);
  }

  /** The nearest parked car the player can commandeer. */
  drivableCarAt(pos: Vector2, size: Vector2, radius = 60): Car | null {
    let best: Car | null = null;
    let bestD = radius;
    for (const c of this.cars) {
      if (c.routeId) continue; // only parked cars are drivable
      const d = Math.hypot(pos.x + size.x / 2 - (c.pos.x + c.size.x / 2), pos.y + size.y / 2 - (c.pos.y + c.size.y / 2));
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  /** Finds a hostile the player is attacking. */
  enemyAt(pos: Vector2, size: Vector2, radius = 60): Enemy | null {
    let best: Enemy | null = null;
    let bestD = radius;
    for (const e of this.enemies) {
      const d = Math.hypot(pos.x + size.x / 2 - (e.pos.x + e.size.x / 2), pos.y + size.y / 2 - (e.pos.y + e.size.y / 2));
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  /** Applies damage to a hostile; removes it at zero hp. Returns true if slain. */
  damageEnemy(id: string, dmg: number): boolean {
    const e = this.enemies.find((x) => x.id === id);
    if (e) {
      e.hp -= dmg;
      if (e.hp <= 0) {
        this.deadEnemies.add(id);
        this.enemies = this.enemies.filter((x) => x.id !== id);
        this.addGore(e.pos.x + e.size.x / 2, e.pos.y + e.size.y / 2, 'splat', 1);
        // Killing a civilian is a serious crime.
        this.commitCrime('murder', 0.42);
        return true;
      }
      return false;
    }
    // Police are attackable too; striking one is "resisting arrest".
    const p = this.police.find((x) => x.id === id);
    if (p) {
      p.hp -= dmg;
      this.commitCrime('assault_officer', 0.3);
      if (p.hp <= 0) {
        this.addGore(p.pos.x + p.size.x / 2, p.pos.y + p.size.y / 2, 'splat', 1.2);
        this.police = this.police.filter((x) => x.id !== id);
        this.commitCrime('officer_down', 0.5);
        return true;
      }
      return false;
    }
    return false;
  }

  /** Nearest hostile OR police unit the player can strike. */
  anyTargetAt(pos: Vector2, size: Vector2, radius = 60): Enemy | PoliceUnit | null {
    return this.enemyAt(pos, size, radius) || this.policeAt(pos, size, radius);
  }

  /** Nearest police unit within radius. */
  policeAt(pos: Vector2, size: Vector2, radius = 60): PoliceUnit | null {
    let best: PoliceUnit | null = null;
    let bestD = radius;
    for (const p of this.police) {
      const d = Math.hypot(pos.x + size.x / 2 - (p.pos.x + p.size.x / 2), pos.y + size.y / 2 - (p.pos.y + p.size.y / 2));
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  /** Solid world rectangles for exterior collision (closed gates only). */
  exteriorSolids(): { pos: Vector2; size: Vector2 }[] {
    const solids: { pos: Vector2; size: Vector2 }[] = [];
    for (const g of this.gates) if (!g.open) solids.push({ pos: g.pos, size: g.size });
    return solids;
  }

  /** Everything the walking player collides with outdoors. */
  obstacleSolids(): { pos: Vector2; size: Vector2 }[] {
    return [...BUILDINGS, ...this.cars, ...this.exteriorSolids()];
  }

  isGateOpen(flag: string): boolean {
    return this.gates.some((g) => g.openFlag === flag && g.open);
  }

  openGateByFlag(flag: string) {
    for (const g of this.gates) if (g.openFlag === flag) g.open = true;
    this.openGateFlags.add(flag);
  }

  markUsed(id: string) {
    this.usedInteractives.add(id);
    const it = INTERACTIVES.find((x) => x.id === id);
    if (it) it.used = true;
  }

  /** Live NPCs visible in the exterior (night shelterers are hidden). */
  visibleNpcs(): LiveNpc[] {
    return this.npcs.filter((n) => !(this.night && n.nightBuildingId));
  }

  npcById(id: string): LiveNpc | undefined {
    return this.npcs.find((n) => n.id === id);
  }

  // ---- Persistence ---------------------------------------------------------

  /** Captures everything that changes during play. */
  save(): WorldSave {
    const npcPos: Record<string, Vector2> = {};
    for (const n of this.npcs) npcPos[n.id] = { ...n.pos };
    return {
      clock: this.clock,
      npcPos,
      openedChestIds: [...this.usedInteractives],
      usedLeverIds: [...this.usedInteractives],
      openGateFlags: [...this.openGateFlags],
      killedEnemyIds: [...this.deadEnemies],
      weather: this.weather.weather,
      gore: this.gore.slice(-120),
      wantedHeat: this.wanted.heat,
      drivingCarId: this.drivenCarId || undefined,
      drivingCarPos: this.drivenCarId
        ? (() => {
            const c = this.cars.find((car) => car.id === this.drivenCarId);
            return c ? { ...c.pos } : undefined;
          })()
        : undefined,
      drivingCarAngle: this.drivenCarId
        ? this.cars.find((car) => car.id === this.drivenCarId)?.angle
        : undefined,
    };
  }

  /** Applies a previously captured world save. */
  restore(s: WorldSave | undefined | null) {
    if (!s) return;
    if (typeof s.clock === 'number') this.clock = s.clock;
    if (s.npcPos) {
      for (const n of this.npcs) {
        const p = s.npcPos[n.id];
        if (p) n.pos = { ...p };
      }
    }
    const used = new Set([...(s.openedChestIds || []), ...(s.usedLeverIds || [])]);
    this.usedInteractives = used;
    for (const it of INTERACTIVES) it.used = used.has(it.id);
    for (const flag of s.openGateFlags || []) this.openGateByFlag(flag);
    if (s.killedEnemyIds) {
      this.deadEnemies = new Set(s.killedEnemyIds);
      this.enemies = this.enemies.filter((e) => !this.deadEnemies.has(e.id));
    }
    if (s.weather) this.weather.setWeather(s.weather as WeatherKind);
    if (s.gore) this.gore = s.gore.map((g) => ({ ...g }));
    if (typeof s.wantedHeat === 'number') {
      this.wanted.heat = s.wantedHeat;
      let level = 0;
      for (let i = 0; i < STAR_HEAT.length; i++) if (this.wanted.heat >= STAR_HEAT[i]) level = i + 1;
      this.wanted.level = level;
    }
    // A commandeered car is left where it was parked when the run was saved.
    if (s.drivingCarId && s.drivingCarPos) {
      const car = this.cars.find((c) => c.id === s.drivingCarId);
      if (car) {
        car.pos = { ...s.drivingCarPos };
        if (typeof s.drivingCarAngle === 'number') car.angle = s.drivingCarAngle;
      }
    }
  }

  /** Records the car currently being driven so its position survives a save. */
  setDrivenCar(id: string | null) {
    this.drivenCarId = id;
  }
}
