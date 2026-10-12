import { useEffect, useRef, useState, useCallback } from 'react';
import { Renderer } from './engine/renderer';
import { InputHandler } from './engine/input';
import { Camera } from './engine/camera';
import { CollisionSystem, MAP_WIDTH, MAP_HEIGHT } from './engine/collision';
import { Player } from './game/player';
import { NPCS } from './data/npcs';
import { APPEARANCES } from './data/appearances';
import { WORLD_OBJECTS } from './world/objects';
import { ROADS, PROPS } from './world/props';
import { BUILDINGS } from './world/buildings';
import { LOCATIONS, LOCATION_MINIMAP_COLORS } from './data/locations';
import { DIALOGUE } from './data/characters';
import { ITEMS, STARTING_ITEM } from './data/items';
import { NPC as NpcType, DialogueNode, GameState, Vector2, Achievement, Interior } from './types';
import { StoryManager, QUEST_MARKERS } from './game/story';
import { StateManager, SLOT_COUNT } from './game/state';
import { WorldRuntime } from './game/world';
import { INTERACTIVES } from './world/interactives';
import { BUILDING_LABELS } from './types';
import { AudioManager } from './audio';
import { CharacterPreview } from './components/CharacterPreview';

const CHARACTERS = [
  { id: 'penguin', name: 'Penguin1NA', color: '#00ffff', appearance: APPEARANCES.penguin },
  { id: 'ripted', name: 'Ripted', color: '#ffd700', appearance: APPEARANCES.ripted },
  { id: 'champy', name: 'Champy', color: '#bf00ff', appearance: APPEARANCES.champy },
  { id: 'polar', name: 'Polar', color: '#add8e6', appearance: APPEARANCES.polar },
  { id: 'custom', name: 'Custom', color: '#ffffff', appearance: APPEARANCES.custom }
];

const INTERACT_RADIUS = 60;
const PLAYER_START: Vector2 = { x: 100, y: 100 };

interface Toast {
  id: number;
  title: string;
  description: string;
}

interface Ending {
  title: string;
  description: string;
}

function newGameState(name: string, characterType: string, pos: Vector2 = PLAYER_START): GameState {
  return {
    player: {
      name,
      characterType,
      pos,
      inventory: [STARTING_ITEM],
      hp: 100,
      maxHp: 100,
      gold: 0,
      playtime: 0,
    },
    flags: {},
    activeQuests: ['The Arrow_Ghost Mystery'],
    completedQuests: [],
    unlockedAchievements: [],
    currentLocation: 'newcomer_spawn',
  };
}

/** Fills in fields missing from saves written by older builds. */
function normalizeState(s: GameState): GameState {
  return {
    ...s,
    player: {
      pos: PLAYER_START,
      inventory: [STARTING_ITEM],
      hp: 100,
      maxHp: 100,
      gold: 0,
      playtime: 0,
      ...s.player,
    },
    activeQuests: s.activeQuests || [],
    completedQuests: s.completedQuests || [],
    unlockedAchievements: s.unlockedAchievements || [],
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [dialogueSpeaker, setDialogueSpeaker] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('Newcomer Spawn');
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [customName, setCustomName] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [equippedItemId, setEquippedItemId] = useState<string>(STARTING_ITEM);
  const [hudTick, setHudTick] = useState(0); // forces HUD refresh ~1/s
  const [combat, setCombat] = useState<{ active: boolean; hp: number; maxHp: number } | null>(null);
  const [speedrun, setSpeedrun] = useState<{ active: boolean; elapsed: number; best: number | null }>(
    { active: false, elapsed: 0, best: null }
  );
  const [inputMode, setInputMode] = useState<'keyboard' | 'touch'>('keyboard');
  const [saveSlots, setSaveSlots] = useState(() => StateManager.slots());

  const audioRef = useRef<AudioManager | null>(null);
  const playtimeRef = useRef(0);
  const lastAutosaveRef = useRef(0);
  // Latest dialogue for the animation loop, avoiding a loop restart per node.
  const dialogueRef = useRef<DialogueNode | null>(null);
  dialogueRef.current = currentDialogue;
  const lastZoneRef = useRef<string>('');
  const speedrunStartRef = useRef<number | null>(null);
  const bossHitCooldownRef = useRef(0);
  const toastIdRef = useRef(0);

  const engineRef = useRef<{
    renderer: Renderer;
    input: InputHandler;
    camera: Camera;
    player: Player;
  } | null>(null);

  // Living world: clock, wandering NPCs, doors, interiors and gates.
  const worldRef = useRef<WorldRuntime | null>(null);
  const getWorld = useCallback(() => {
    if (!worldRef.current) worldRef.current = new WorldRuntime();
    return worldRef.current;
  }, []);
  const activeInteriorRef = useRef<Interior | null>(null);
  const [insideName, setInsideName] = useState<string | null>(null);

  const addToast = useCallback((title: string, description: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, title, description }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioManager();
    return audioRef.current;
  }, []);

  const startGame = (charId: string) => {
    const char = CHARACTERS.find(c => c.id === charId)!;
    const name = charId === 'custom' ? (customName || 'Newcomer') : char.name;
    engineRef.current = null;
    worldRef.current = new WorldRuntime();
    activeInteriorRef.current = null;
    setInsideName(null);
    lastZoneRef.current = '';
    setEquippedItemId(STARTING_ITEM);
    setGameState(newGameState(name, charId));
    getAudio().blip();
  };

  const loadState = (saved: GameState) => {
    engineRef.current = null;
    worldRef.current = new WorldRuntime();
    activeInteriorRef.current = null;
    setInsideName(null);
    lastZoneRef.current = '';
    setGameState(normalizeState(saved));
    getAudio().blip();
  };

  // Quest / achievement / ending progression.
  useEffect(() => {
    if (!gameState) return;
    const { active, completed } = StoryManager.checkQuests(gameState);
    const newAchievements = StoryManager.checkAchievements(gameState);

    const questsChanged =
      active.length !== gameState.activeQuests.length ||
      completed.length !== gameState.completedQuests.length;
    const achievementsChanged = newAchievements.length > 0;

    if (questsChanged || achievementsChanged) {
      setGameState(prev => {
        if (!prev) return null;
        const unlocked = achievementsChanged
          ? [...prev.unlockedAchievements, ...newAchievements]
          : prev.unlockedAchievements;
        return {
          ...prev,
          activeQuests: active,
          completedQuests: completed,
          unlockedAchievements: unlocked,
        };
      });
    }

    for (const id of newAchievements) {
      const a: Achievement | undefined = StoryManager.achievementById(id);
      if (a) {
        addToast(`Achievement: ${a.name}`, a.description);
        getAudio().achievement();
      }
    }

    if (gameState.flags.all_arcs_resolved || gameState.flags.game_ended) {
      setEnding(StoryManager.getEnding(gameState));
    }
  }, [gameState, addToast, getAudio]);

  // Playtime clock: commit accumulated time to state once per second.
  useEffect(() => {
    if (!gameState || ending) return;
    const started = performance.now();
    let last = started;
    const interval = window.setInterval(() => {
      const now = performance.now();
      playtimeRef.current += now - last;
      last = now;
      setHudTick(t => t + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState?.player.characterType, ending]);

  useEffect(() => {
    if (!gameState || !canvasRef.current) return;

    if (!engineRef.current) {
      const char = CHARACTERS.find(c => c.id === gameState.player.characterType) || CHARACTERS[0];
      const player = new Player(gameState.player.name, char.color, gameState.player.pos, char.appearance);
      const canvas = canvasRef.current;
      engineRef.current = {
        renderer: new Renderer(canvas),
        input: new InputHandler(),
        camera: new Camera(canvas.width, canvas.height),
        player,
      };
    }

    const { renderer, input, camera, player } = engineRef.current;

    // Mirror the engine's live input mode (it sees every key and touch).
    const unsubscribeMode = input.onModeChange(setInputMode);
    setInputMode(input.getMode());

    const onResize = () => {
      renderer.resize();
      camera.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    camera.resize(window.innerWidth, window.innerHeight);

    const drawMinimap = (cam: Camera) => {
      const mm = minimapRef.current;
      if (!mm) return;
      const ctx = mm.getContext('2d');
      if (!ctx) return;
      const w = mm.width;
      const h = mm.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, w, h);

      // Inside a building: show a compact room plan instead of the world map.
      if (activeInteriorRef.current) {
        const room = activeInteriorRef.current;
        const pad = 14;
        const rw = w - pad * 2;
        const rh = h - pad * 2;
        const rs = Math.min(rw / room.width, rh / room.height);
        const ox = pad + (rw - room.width * rs) / 2;
        const oy = pad + (rh - room.height * rs) / 2;
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(ox, oy, room.width * rs, room.height * rs);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        room.furnitures.forEach(f => ctx.fillRect(ox + f.x * rs, oy + f.y * rs, Math.max(1, f.w * rs), Math.max(1, f.h * rs)));
        // Exit mat.
        ctx.fillStyle = 'rgba(255,208,112,0.7)';
        ctx.fillRect(ox + (room.exit.x - 30) * rs, oy + (room.height - 40) * rs, 60 * rs, 18 * rs);
        // Player.
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(ox + (player.pos.x + player.size.x / 2) * rs, oy + (player.pos.y + player.size.y / 2) * rs, 3, 0, Math.PI * 2);
        ctx.fill();
        void cam;
        return;
      }

      const sx = w / MAP_WIDTH;
      const sy = h / MAP_HEIGHT;
      Object.values(LOCATIONS).forEach((loc: any) => {
        const b = loc.bounds;
        ctx.fillStyle = LOCATION_MINIMAP_COLORS[loc.id] || '#444';
        ctx.fillRect(b.x * sx, b.y * sy, b.width * sx, b.height * sy);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(b.x * sx, b.y * sy, b.width * sx, b.height * sy);
      });
      // Roads
      ctx.fillStyle = 'rgba(140,130,100,0.5)';
      ROADS.forEach(r => {
        ctx.fillRect(r.x * sx, r.y * sy, Math.max(1, r.w * sx), Math.max(1, r.h * sy));
      });
      // Scenery (faint dots) so the world reads as populated.
      ctx.fillStyle = 'rgba(150,200,150,0.28)';
      PROPS.forEach(p => {
        ctx.fillRect((p.pos.x + p.size.x / 2) * sx - 0.5, (p.pos.y + p.size.y / 2) * sy - 0.5, 1, 1);
      });
      // Buildings (solid blocks with a roof accent).
      BUILDINGS.forEach(b => {
        ctx.fillStyle = 'rgba(210,200,180,0.55)';
        ctx.fillRect(b.pos.x * sx, b.pos.y * sy, Math.max(1.5, b.size.x * sx), Math.max(1.5, b.size.y * sy));
        ctx.fillStyle = b.roofColor;
        ctx.fillRect(b.pos.x * sx, b.pos.y * sy, Math.max(1, b.size.x * sx), Math.max(1, b.size.y * sy * 0.4));
      });
      // Fixtures: campfires/levers glow, chests read as gold ticks.
      INTERACTIVES.forEach(it => {
        const cx = (it.pos.x + it.size.x / 2) * sx;
        const cy = (it.pos.y + it.size.y / 2) * sy;
        ctx.fillStyle = it.interactiveKind === 'campfire' ? '#ff8a3a'
          : it.interactiveKind === 'lever' ? '#c9b06a'
          : it.interactiveKind === 'chest' ? '#ffd070'
          : 'rgba(200,200,200,0.6)';
        ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      });
      // Gates.
      (worldRef.current?.gates || []).forEach(g => {
        ctx.fillStyle = g.open ? 'rgba(120,220,120,0.7)' : 'rgba(255,90,60,0.85)';
        ctx.fillRect(g.pos.x * sx - 1, g.pos.y * sy - 1, Math.max(2, g.size.x * sx), Math.max(2, g.size.y * sy));
      });
      // NPC markers (live positions).
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      (worldRef.current?.visibleNpcs() || NPCS).forEach(npc => {
        ctx.fillRect(npc.pos.x * sx - 1, npc.pos.y * sy - 1, 3, 3);
      });
      // Quest markers, one pulse per active quest.
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 350);
      gameState.activeQuests.forEach(title => {
        const mk = QUEST_MARKERS[title];
        if (!mk) return;
        const mx = mk.x * sx;
        const my = mk.y * sy;
        ctx.strokeStyle = `rgba(255,170,0,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 4 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,170,0,0.9)';
        ctx.fillRect(mx - 1, my - 1, 2, 2);
      });
      // Player marker
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(player.pos.x * sx, player.pos.y * sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      void cam;
    };

    let animationFrameId: number;
    let lastFrame = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = now - lastFrame;
      lastFrame = now;
      const world = getWorld();
      world.update(Math.min(dt, 100) / 1000);

      const paused = isPaused || !!ending;
      const inDialogue = !!dialogueRef.current;
      const interior = activeInteriorRef.current;

      const fighting = gameState.flags.arrow_ghost_fight_started === true &&
        gameState.flags.arrow_ghost_defeated !== true;

      let nearest: any = null;
      let nearestDist = Infinity;

      if (interior) {
        // ---- Walking inside a building -------------------------------------
        // Night owner stands mid-room; that is the only thing to talk to inside.
        const occupant = interior.occupants.map(id => world.npcById(id)).find(Boolean);
        const occPos = { x: interior.width / 2, y: interior.height * 0.45 };

        if (!inDialogue && !paused) {
          if (dt > 0) playtimeRef.current += dt;
          const movement = input.getMovement();
          const roomSolids = interior.furnitures.map(f => ({ pos: { x: f.x, y: f.y }, size: { x: f.w, y: f.h } }));
          player.update(movement, roomSolids);
          player.clampToRoom(interior.width, interior.height);
          // Rooms are smaller than the viewport, so frame the room instead of
          // following the player.
          camera.pos = {
            x: (interior.width - camera.viewport.x) / 2,
            y: (interior.height - camera.viewport.y) / 2,
          };
          camera.target = { ...camera.pos };
          if (movement.x !== 0 || movement.y !== 0) {
            if (Math.random() < 0.08) getAudio().step();
          }
          if (input.consumePressed('q') || input.consumeAction() === 'quests') setShowQuestLog(v => !v);
          if (input.consumePressed('i') || input.consumeAction() === 'inventory') setShowInventory(v => !v);
          if (input.consumePressed('escape')) setIsPaused(true);
        }

        const onExitMat = atRoomExit(interior);
        const occNear = occupant && Math.hypot(player.pos.x - occPos.x, player.pos.y - occPos.y) < INTERACT_RADIUS;
        let prompt: string | null = null;
        if (onExitMat) prompt = 'Press E to leave';
        else if (occNear) prompt = `Press E to talk to ${occupant!.name}`;
        if (!inDialogue && !paused) setInteractPrompt(prompt);

        const act = !inDialogue && !paused ? (input.consumePressed('e') || input.consumeAction() === 'interact') : false;
        if (act) {
          if (onExitMat) exitInterior();
          else if (occNear) applyInteract({ ...(occupant as NpcType), pos: occPos });
        }

        // ---- Render the room ----
        renderer.clear();
        renderer.ctx.save();
        camera.apply(renderer.ctx);
        renderer.drawInteriorScene(interior, camera, world.timeOfDay);
        if (occupant) {
          renderer.drawEntity({ ...(occupant as NpcType), pos: occPos }, camera, undefined, dt);
        }
        renderer.drawEntity(player, camera, undefined, dt);
        renderer.ctx.restore();
      } else {
        // ---- Walking the exterior world ------------------------------------
        if (!inDialogue && !paused) {
          if (dt > 0) playtimeRef.current += dt;
          const movement = input.getMovement();
          const solids = [...WORLD_OBJECTS, ...world.visibleNpcs(), ...BUILDINGS, ...world.exteriorSolids()];
          player.update(movement, solids);
          player.clampToWorld();
          camera.update(player.pos);
          if (movement.x !== 0 || movement.y !== 0) {
            if (Math.random() < 0.08) getAudio().step();
          }
          if (input.consumePressed('q') || input.consumeAction() === 'quests') setShowQuestLog(v => !v);
          if (input.consumePressed('i') || input.consumeAction() === 'inventory') setShowInventory(v => !v);
          if (input.consumePressed('escape')) setIsPaused(true);
        }

        // Interactables: NPCs, world objects and fixtures.
        const interactables: any[] = [...world.visibleNpcs(), ...WORLD_OBJECTS, ...INTERACTIVES];
        for (const obj of interactables) {
          const cx = obj.pos.x + (obj.size?.x ?? 0) / 2;
          const cy = obj.pos.y + (obj.size?.y ?? 0) / 2;
          const dist = Math.hypot(
            player.pos.x + player.size.x / 2 - cx,
            player.pos.y + player.size.y / 2 - cy
          );
          if (dist < INTERACT_RADIUS && dist < nearestDist) {
            nearestDist = dist;
            nearest = obj;
          }
        }

        // Door prompt takes priority when standing on one.
        const door = world.doorAt(player.pos, player.size, 46);
        const wantInteract = input.consumePressed('e') || input.consumeAction() === 'interact';

        if (nearest) {
          const label = nearest.type === 'building'
            ? BUILDING_LABELS[nearest.buildingKind as keyof typeof BUILDING_LABELS]
            : nearest.name;
          if (nearest.id === 'arrow_ghost' && fighting) {
            setInteractPrompt('Press E to ATTACK');
          } else if (nearest.interactiveKind === 'chest') {
            setInteractPrompt(nearest.used ? 'Opened' : 'Press E to open chest');
          } else if (nearest.interactiveKind === 'campfire') {
            setInteractPrompt('Press E to rest');
          } else if (nearest.interactiveKind === 'lever') {
            setInteractPrompt(nearest.used ? 'Lever pulled' : 'Press E to pull lever');
          } else {
            setInteractPrompt(`Press E to interact with ${label}`);
          }
        } else if (door) {
          setInteractPrompt('Press E to enter');
        } else {
          setInteractPrompt(null);
        }

        if (wantInteract && !dialogueRef.current) {
          if (fighting && nearest && nearest.id === 'arrow_ghost') {
            strikeBoss();
          } else if (nearest) {
            applyInteract(nearest);
          } else if (door) {
            enterInterior(door.interiorId);
          }
        }

        // Boss retaliation.
        const boss = world.npcById('arrow_ghost');
        if (fighting && !paused && boss) {
          const dist = Math.hypot(player.pos.x - boss.pos.x, player.pos.y - boss.pos.y);
          if (dist < INTERACT_RADIUS + 20 && now - bossHitCooldownRef.current > 1200) {
            bossHitCooldownRef.current = now;
            getAudio().hurt();
            setGameState(prev => {
              if (!prev) return null;
              const hp = Math.max(0, prev.player.hp - 8);
              if (hp <= 0) {
                return { ...prev, player: { ...prev.player, hp: 0 }, flags: { ...prev.flags, game_ended: true } };
              }
              return { ...prev, player: { ...prev.player, hp } };
            });
          }
        }

        // Area tracking + autosave / zone audio.
        const locId = CollisionSystem.locationAt(player.pos);
        if (locId) {
          const loc: any = Object.values(LOCATIONS).find((l: any) => l.id === locId);
          if (loc && loc.name !== currentArea) setCurrentArea(loc.name);
          if (locId !== lastZoneRef.current) {
            lastZoneRef.current = locId;
            getAudio().setZone(locId);
            if (locId === 'dev_room') {
              setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, visited_dev_room: true }, currentLocation: 'dev_room' }) : null);
            }
            if (locId === 'dead_zone') {
              setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, visited_dead_zone: true }, currentLocation: 'dead_zone' }) : null);
            }
            autosave(player.pos);
          }
        }

        if (now - lastAutosaveRef.current > 30000) {
          lastAutosaveRef.current = now;
          autosave(player.pos);
        }

        // Record that the player has seen nightfall.
        if (world.night && gameState.flags.saw_night !== true) {
          setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, saw_night: true } }) : prev);
        }

        // ---- Render the exterior ----
        renderer.clear();
        renderer.ctx.save();
        camera.apply(renderer.ctx);
        renderer.drawWorld(LOCATIONS, camera, { gates: world.gates, daylight: world.daylight });
        WORLD_OBJECTS.forEach(obj => renderer.drawEntity(obj, camera, undefined, dt));
        for (const npc of world.visibleNpcs()) {
          const isBoss = npc.id === 'arrow_ghost';
          renderer.drawEntity(npc, camera, isBoss && fighting ? { hp: combat?.hp ?? 60, maxHp: combat?.maxHp ?? 60 } : undefined, dt);
        }
        renderer.drawEntity(player, camera, undefined, dt);
        renderer.drawWorldLights(camera);
        renderer.ctx.restore();
      }

      // Speedrun lap timing.
      if (speedrunStartRef.current !== null) {
        const elapsed = now - speedrunStartRef.current;
        setSpeedrun(prev => (prev.active ? { ...prev, elapsed } : prev));
      }

      drawMinimap(camera);

      animationFrameId = requestAnimationFrame(loop);
    };

    function atRoomExit(room: Interior): boolean {
      return Math.hypot(
        player.pos.x + player.size.x / 2 - room.exit.x,
        player.pos.y + player.size.y / 2 - room.exit.y
      ) < 34;
    }

    function enterInterior(interiorId: string) {
      const w = getWorld();
      const room = w.interiorForBuilding(
        w.doors.find(d => d.interiorId === interiorId)?.buildingId || ''
      ) || w.interiors.get(interiorId);
      if (!room) return;
      activeInteriorRef.current = room;
      setInsideName(room.name);
      // Interior spawn in local coordinates; camera follows the player.
      player.pos = { ...room.spawn };
      player.clampToRoom(room.width, room.height);
      camera.pos = { x: player.pos.x - camera.viewport.x / 2, y: player.pos.y - camera.viewport.y / 2 };
      camera.target = { ...camera.pos };
      getAudio().interact();
      setInteractPrompt(null);
      setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, entered_building: true } }) : prev);
    }

    function exitInterior() {
      const room = activeInteriorRef.current;
      activeInteriorRef.current = null;
      setInsideName(null);
      setInteractPrompt(null);
      if (!room) return;
      // Step the player just south of the building's door.
      const door = getWorld().doors.find(d => d.interiorId === room.id);
      if (door) player.pos = { x: door.x - player.size.x / 2, y: door.y + 8 };
      getAudio().blip();
    }

    /** Saves without disturbing React state. */
    function autosave(pos: Vector2) {
      setGameState(prev => {
        if (!prev) return prev;
        const snapshot: GameState = {
          ...prev,
          player: { ...prev.player, pos, playtime: playtimeRef.current },
        };
        StateManager.autosave(snapshot);
        return prev;
      });
    }

    function strikeBoss() {
      const item = ITEMS[equippedItemId];
      const dmg = item?.weapon ? (item.damage || 4) : 3;
      getAudio().hit();
      setCombat(prev => {
        const maxHp = prev?.maxHp ?? 60;
        const hp = Math.max(0, (prev?.hp ?? 60) - dmg);
        if (hp <= 0) {
          setGameState(gs => gs ? ({
            ...gs,
            flags: { ...gs.flags, arrow_ghost_defeated: true, all_arcs_resolved: true, game_ended: true },
          }) : null);
          getAudio().achievement();
        }
        return { active: true, hp, maxHp };
      });
    }

    function applyInteract(obj: any) {
      getAudio().interact();

      // Interactive fixtures (chest / sign / lever / campfire).
      if (obj.interactiveKind) {
        handleInteractive(obj);
        return;
      }

      if (obj.type === 'npc') {
        const npc = obj;
        const dialogue = DIALOGUE[npc.dialogueId];
        if (dialogue) {
          setCurrentDialogue(dialogue[0]);
          setDialogueSpeaker(npc.name);
          if (npc.id === 'sam') {
            setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, talked_to_sam: true } }) : null);
          }
          if (npc.id === 'hydo') {
            setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, talked_to_hydo: true } }) : null);
          }
          if (npc.id === 'arrow_ghost') {
            setCombat(prev => prev ?? { active: true, hp: 60, maxHp: 60 });
          }
        }
        return;
      }

      // World object.
      const worldObj = obj;
      setCurrentDialogue({
        id: 'obj_desc',
        text: worldObj.description || 'Nothing special.',
      });
      setDialogueSpeaker(worldObj.name);

      setGameState(prev => {
        if (!prev) return null;
        const flags = { ...prev.flags };
        const player = { ...prev.player, inventory: [...prev.player.inventory] };

        if (worldObj.id === 'kiwi_apology') flags.read_kiwi_apology = true;

        // Secret discovery.
        if (worldObj.secretId) {
          flags[worldObj.secretId] = true;
        }

        // Item pickup (once per object).
        const collectedIds: string[] = (flags.collected_object_ids as string[]) || [];
        if (worldObj.itemId && !collectedIds.includes(worldObj.id)) {
          if (worldObj.itemId === 'update_fragment') {
            const count = (flags.fragments_collected as number) || 0;
            flags.fragments_collected = count + 1;
          }
          if (!player.inventory.includes(worldObj.itemId)) {
            player.inventory.push(worldObj.itemId);
          }
          flags.collected_object_ids = [...collectedIds, worldObj.id];
          getAudio().pickup();
        }

        // Speedrun timer objects.
        if (worldObj.id === 'speedrun_timer_1') {
          speedrunStartRef.current = performance.now();
          setSpeedrun(prev2 => ({ ...prev2, active: true, elapsed: 0 }));
          addToast('Lap started', 'Run to the second timer in the Speedrun Track to finish.');
        }
        if (worldObj.id === 'speedrun_timer_2' && speedrunStartRef.current !== null) {
          const elapsed = performance.now() - speedrunStartRef.current;
          speedrunStartRef.current = null;
          flags.completed_speedrun = true;
          setSpeedrun(prev2 => ({ ...prev2, active: false, elapsed, best: prev2.best === null ? elapsed : Math.min(prev2.best, elapsed) }));
        }

        return { ...prev, flags, player };
      });
    }

    /** Chests, signs, levers and campfires. */
    function handleInteractive(it: any) {
      const kind = it.interactiveKind as string;
      if (kind === 'sign') {
        setCurrentDialogue({ id: 'sign_read', text: it.text || 'The writing has worn away.' });
        setDialogueSpeaker(it.name);
        return;
      }
      if (kind === 'campfire') {
        setCurrentDialogue({ id: 'campfire', text: it.description || 'A warm fire.' });
        setDialogueSpeaker(it.name);
        setGameState(prev => {
          if (!prev) return null;
          const hp = prev.player.maxHp;
          return { ...prev, player: { ...prev.player, hp }, flags: { ...prev.flags, rested_at_campfire: true } };
        });
        addToast('Rested', 'Your health is fully restored.');
        getAudio().pickup();
        return;
      }
      if (kind === 'chest') {
        if (it.used) {
          setCurrentDialogue({ id: 'chest_empty', text: 'The chest is empty.' });
          setDialogueSpeaker(it.name);
          return;
        }
        it.used = true;
        setGameState(prev => {
          if (!prev) return null;
          const player = { ...prev.player, inventory: [...prev.player.inventory] };
          const flags = { ...prev.flags, opened_chest: true };
          if (it.itemId && !player.inventory.includes(it.itemId)) player.inventory.push(it.itemId);
          if (it.gold) player.gold = (player.gold || 0) + it.gold;
          return { ...prev, player, flags };
        });
        const parts: string[] = [];
        if (it.itemId && ITEMS[it.itemId]) parts.push(ITEMS[it.itemId].name);
        if (it.gold) parts.push(`${it.gold} gold`);
        addToast('Chest opened', parts.length ? `Found: ${parts.join(', ')}` : 'It was empty.');
        getAudio().pickup();
        return;
      }
      if (kind === 'lever') {
        it.used = true;
        if (it.gateId) {
          getWorld().openGateByFlag(it.gateId);
          setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, [it.gateId]: true } }) : prev);
        }
        setCurrentDialogue({ id: 'lever', text: it.description || 'You pull the lever.' });
        setDialogueSpeaker(it.name);
        addToast('Lever pulled', 'A gate rumbles open somewhere.');
        getAudio().achievement();
        return;
      }
    }

    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      unsubscribeMode();
    };
  }, [gameState?.player.characterType, isPaused, ending, equippedItemId, combat?.hp]);

  const handleDialogueOption = (nextNodeId: string) => {
    const dialogueSet = DIALOGUE[
      Object.keys(DIALOGUE).find(k => DIALOGUE[k].some(n => n.id === currentDialogue?.id)) || ''
    ];
    const nextNode = dialogueSet?.find(n => n.id === nextNodeId);
    if (nextNode) {
      setCurrentDialogue(nextNode);
      if (nextNode.onComplete && gameState) {
        const newState = { ...gameState };
        nextNode.onComplete(newState);
        setGameState(newState);
      }
      return;
    }

    if (currentDialogue?.onComplete && gameState) {
      const newState = { ...gameState };
      currentDialogue.onComplete(newState);
      setGameState(newState);
    }
    setCurrentDialogue(null);
    setDialogueSpeaker(null);
  };

  // Stable handler for the animation loop's 1/2/E key reads.
  const dialogueOptionRef = useRef(handleDialogueOption);
  dialogueOptionRef.current = handleDialogueOption;

  // Keyboard dialogue control: number keys pick an option, E/Enter/Space close.
  useEffect(() => {
    if (!currentDialogue) return;
    const onKey = (e: KeyboardEvent) => {
      const options = currentDialogue.options?.filter(o => !o.condition || !gameState || o.condition(gameState));
      const key = e.key.toLowerCase();
      if (options && options.length > 0) {
        const idx = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
        if (idx >= 0 && idx < options.length) {
          e.preventDefault();
          dialogueOptionRef.current(options[idx].nextNodeId);
        }
      } else if (key === 'e' || key === 'enter' || key === ' ' || key === 'escape') {
        e.preventDefault();
        // Consume the key so the game loop doesn't immediately re-interact.
        dialogueOptionRef.current('');
        engineRef.current?.input.consumePressed('e');
        engineRef.current?.input.consumePressed('escape');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentDialogue, gameState]);

  const useItem = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return;
    if (item.weapon) {
      setEquippedItemId(itemId);
      addToast('Equipped', `${item.name} (+${item.damage} damage)`);
      getAudio().blip();
    }
  };

  const manualSave = (slot: number) => {
    if (!gameState) return;
    const engine = engineRef.current;
    const snapshot: GameState = {
      ...gameState,
      player: {
        ...gameState.player,
        pos: engine ? engine.player.pos : gameState.player.pos,
        playtime: playtimeRef.current,
      },
    };
    StateManager.saveSlot(slot, snapshot);
    setSaveSlots(StateManager.slots());
    addToast('Game Saved', `Saved to slot ${slot + 1}.`);
    getAudio().blip();
  };

  const equipBestWeapon = () => {
    if (!gameState) return;
    let best: string | null = null;
    let bestDmg = -1;
    for (const id of gameState.player.inventory) {
      const item = ITEMS[id];
      if (item?.weapon && (item.damage || 0) > bestDmg) {
        bestDmg = item.damage || 0;
        best = id;
      }
    }
    if (best) setEquippedItemId(best);
  };

  if (ending) {
    const stats = gameState!;
    const seconds = Math.floor(playtimeRef.current / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (
      <div className="select-screen">
        <h1 className="select-title" style={{ color: 'var(--color-neon-orange)' }}>Game Over</h1>
        <h2 className="text-2xl text-neon-cyan">{ending.title}</h2>
        <p className="text-gray-400 max-w-lg text-center">{ending.description}</p>
        <div className="ending-stats">
          <div>Character: {stats.player.name}</div>
          <div>Playtime: {mins}m {secs}s</div>
          <div>Fragments: {stats.flags.fragments_collected || 0}/3</div>
          <div>Achievements: {stats.unlockedAchievements.length}/11</div>
          <div>Quests completed: {stats.completedQuests.length}</div>
        </div>
        <button
          className="pause-button cyan"
          style={{ width: 'auto', padding: '14px 48px', fontSize: 20 }}
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!gameState) {
    const slots = saveSlots;
    const hasSave = StateManager.hasAnySave();
    return (
      <div className="select-screen">
        <h1 className="select-title">Narrow Arrow: The Game</h1>
        <p className="select-sub">Select your character</p>
        <div className="char-grid">
          {CHARACTERS.map(char => (
            <div key={char.id} className="char-card">
              <button
                className="char-option"
                style={{ color: char.color }}
                onClick={() => startGame(char.id)}
              >
                <CharacterPreview
                  name={char.id}
                  color={char.color}
                  appearance={char.appearance}
                />
                <span className="char-name">{char.name}</span>
              </button>
              {char.id === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter name..."
                  className="mt-2 bg-black border border-neon-cyan p-2 text-white text-center focus:outline-none focus:border-neon-orange"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        {hasSave && (
          <div className="save-slots">
            <div className="text-neon-gold mb-2 uppercase tracking-widest text-sm">Continue</div>
            <div className="flex flex-wrap justify-center gap-3">
              {StateManager.loadAutosave() && (
                <button
                  className="slot-button"
                  onClick={() => loadState(StateManager.loadAutosave() as GameState)}
                >
                  Autosave
                </button>
              )}
              {slots.map(slot => (
                <button
                  key={slot.index}
                  className="slot-button"
                  disabled={!slot.state}
                  onClick={() => slot.state && loadState(slot.state)}
                >
                  Slot {slot.index + 1}: {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const mode = inputMode === 'touch' ? 'touch' : 'keyboard';

  return (
    <div className={`game-shell mode-${mode}`}>
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="mini-map-label text-neon-cyan">{insideName ? `${currentArea} · ${insideName}` : currentArea}</div>
      <canvas ref={minimapRef} className="minimap" width={180} height={130} />

      <div className="hud-stats">
        <div className="hud-title">Status</div>
        <div className="hud-row">
          <span>HP</span>
          <span>{Math.round((gameState.player.hp / gameState.player.maxHp) * 100)}%</span>
        </div>
        <div className="hud-hp-bar">
          <div style={{ width: `${(gameState.player.hp / gameState.player.maxHp) * 100}%` }} />
        </div>
        {equippedItemId && ITEMS[equippedItemId] && (
          <div className="hud-row" style={{ marginTop: 4 }}>
            <span style={{ color: '#8b96a3' }}>Weapon</span>
            <span style={{ color: ITEMS[equippedItemId].color }}>{ITEMS[equippedItemId].name}</span>
          </div>
        )}
      </div>

      {combat && speedrun.active === false && gameState.flags.arrow_ghost_fight_started && (
        <div className="boss-bar">
          <div className="boss-label">arrow_ghost</div>
          <div className="hud-hp-bar boss">
            <div style={{ width: `${(combat.hp / combat.maxHp) * 100}%` }} />
          </div>
        </div>
      )}

      {speedrun.active && (
        <div className="speedrun-hud">
          Lap: {(speedrun.elapsed / 1000).toFixed(2)}s
          {speedrun.best !== null && <span> · best {(speedrun.best / 1000).toFixed(2)}s</span>}
        </div>
      )}

      {interactPrompt && <div className="interact-prompt">{interactPrompt}</div>}

      {currentDialogue && (
        <div className="dialogue-box">
          <canvas
            className="portrait-canvas"
            width={80}
            height={80}
            ref={(el) => {
              if (!el) return;
              const ctx = el.getContext('2d');
              if (!ctx) return;
              const speakerNpc = NPCS.find(n => n.name === dialogueSpeaker);
              const speakerObj = WORLD_OBJECTS.find(o => o.name === dialogueSpeaker);
              const entity = speakerNpc || speakerObj;
              if (entity) {
                const r = new Renderer(el);
                r.drawPortrait(ctx, entity, 0, 0, 80);
              } else {
                ctx.fillStyle = '#333';
                ctx.fillRect(0, 0, 80, 80);
                ctx.fillStyle = '#fff';
                ctx.font = '40px Inter';
                ctx.textAlign = 'center';
                ctx.fillText('?', 40, 55);
              }
            }}
          />
          <div className="dialogue-content">
            <div className="character-name text-neon-cyan">{dialogueSpeaker}</div>
            <div className="dialogue-text">{currentDialogue.text}</div>
            <div className="mt-4 flex gap-4 flex-wrap">
              {currentDialogue.options ? (
                currentDialogue.options
                  .filter(opt => !opt.condition || opt.condition(gameState))
                  .map((opt, i) => (
                    <button
                      key={i}
                      className="dialogue-option"
                      onClick={() => handleDialogueOption(opt.nextNodeId)}
                    >
                      {mode === 'keyboard' && <span className="option-key">{i + 1}</span>}
                      {opt.text}
                    </button>
                  ))
              ) : (
                <button
                  className="dialogue-option close"
                  onClick={() => handleDialogueOption('')}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuestLog && (
        <div className="quest-log">
          <h3 className="text-neon-orange font-bold mb-2">Active Quests</h3>
          <ul className="text-sm">
            {gameState.activeQuests.length === 0 && <li className="text-gray-500">None</li>}
            {gameState.activeQuests.map((q, i) => (
              <li key={i} className="mb-2 text-white">• {q}</li>
            ))}
          </ul>
          {gameState.completedQuests.length > 0 && (
            <>
              <h3 className="text-neon-green font-bold mt-3 mb-2">Completed</h3>
              <ul className="text-sm text-gray-400">
                {gameState.completedQuests.map((q, i) => (
                  <li key={i} className="mb-1 line-through">✓ {q}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {showInventory && (
        <div className="inventory-panel">
          <h3 className="text-neon-cyan font-bold mb-2">Inventory ({gameState.player.inventory.length})</h3>
          <ul className="text-sm">
            {gameState.player.inventory.length === 0 && <li className="text-gray-500">Empty</li>}
            {gameState.player.inventory.map((id, i) => {
              const item = ITEMS[id];
              if (!item) return null;
              return (
                <li
                  key={i}
                  className={`inventory-item ${equippedItemId === id ? 'equipped' : ''}`}
                  onClick={() => useItem(id)}
                >
                  <span className="inv-dot" style={{ background: item.color }} />
                  <div>
                    <div className="text-white">
                      {item.name} {equippedItemId === id && <span className="text-neon-orange">(equipped)</span>}
                    </div>
                    <div className="text-gray-500 text-xs">{item.description}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div className="toast-title">{t.title}</div>
            <div className="toast-desc">{t.description}</div>
          </div>
        ))}
      </div>

      {mode === 'touch' && !currentDialogue && !isPaused && (
        <div className="touch-controls">
          <div
            className="joystick"
            onPointerDown={(e) => {
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              const rect = el.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const move = (ev: { clientX: number; clientY: number }) => {
                const dx = (ev.clientX - cx) / (rect.width / 2);
                const dy = (ev.clientY - cy) / (rect.height / 2);
                engineRef.current?.input.setTouchMovement(
                  Math.max(-1, Math.min(1, dx)),
                  Math.max(-1, Math.min(1, dy))
                );
              };
              move(e);
              const onMove = (ev: PointerEvent) => move(ev);
              const onUp = () => {
                engineRef.current?.input.setTouchMovement(0, 0);
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
          />
          <div className="touch-buttons">
            <button onClick={() => engineRef.current?.input.setTouchAction('interact')}>E</button>
            <button onClick={() => engineRef.current?.input.setTouchAction('quests')}>Q</button>
            <button onClick={() => engineRef.current?.input.setTouchAction('inventory')}>I</button>
            <button onClick={() => setIsPaused(true)}>II</button>
          </div>
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <h2 className="text-4xl font-bold text-neon-orange mb-6 uppercase tracking-widest">Paused</h2>
          <button className="pause-button cyan" onClick={() => setIsPaused(false)}>Resume</button>
          {[0, 1, 2].slice(0, SLOT_COUNT).map(slot => (
            <button key={slot} className="pause-button gold" onClick={() => manualSave(slot)}>
              Save to Slot {slot + 1}
            </button>
          ))}
          <button className="pause-button purple" onClick={() => setShowInventory(v => !v)}>
            Toggle Inventory
          </button>
          <button className="pause-button purple" onClick={() => { equipBestWeapon(); addToast('Equipped', 'Best weapon equipped.'); }}>
            Equip Best Weapon
          </button>
          <button
            className="pause-button grey"
            onClick={() => { setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, game_ended: true } }) : null); }}
          >
            Quit to Ending
          </button>
          <button
            className="pause-button grey"
            onClick={() => { const a = getAudio(); a.setMuted(true); addToast('Audio', 'Muted.'); }}
          >
            Mute Audio
          </button>
        </div>
      )}

      {mode === 'keyboard' && (
        <div className="controls-hint">
          WASD move · E interact · Q quests · I inventory · ESC pause
        </div>
      )}

      {mode === 'keyboard' && currentDialogue && (
        <div className="key-hint">
          {currentDialogue.options ? (
            <>
              <span className="key-cap">1</span>
              <span className="key-cap">2</span>
              <span>choose an option</span>
            </>
          ) : (
            <>
              <span className="key-cap">E</span>
              <span>or</span>
              <span className="key-cap">ESC</span>
              <span>close</span>
            </>
          )}
        </div>
      )}

      <span className="hidden-tick" data-tick={hudTick} />
    </div>
  );
}
