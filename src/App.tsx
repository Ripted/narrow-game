import { useEffect, useRef, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
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
import { WATER_SOLIDS } from './world/terrain';
import { LOCATIONS, LOCATION_MINIMAP_COLORS, LAND_FEATURES, WATER_FEATURES } from './data/locations';
import { DIALOGUE } from './data/characters';
import { ITEMS, STARTING_ITEM } from './data/items';
import { NPC as NpcType, DialogueNode, GameState, Vector2, Achievement, Interior, ShopEntry, Enemy, Car, SubstanceEffect, Appearance, BossSpec } from './types';
import { StoryManager, QUEST_MARKERS, BOSSES, BOSS_BY_NPC, ACHIEVEMENTS } from './game/story';
import { StateManager, SLOT_COUNT, SAVE_VERSION, migrateSave } from './game/state';
import { SettingsStore, DEFAULT_SETTINGS } from './game/settings';
import { carSpec } from './world/cars';
import { WorldRuntime } from './game/world';
import { INTERACTIVES } from './world/interactives';
import { drawGore } from './world/enemies';
import { BUILDING_LABELS } from './types';
import { AudioManager } from './audio';
import { SUBSTANCES, SUBSTANCE_ITEM } from './data/substances';
import { RADIO_STATIONS, applyLanguageFilter, GRAFFITI } from './data/humor';
import { CharacterPreview } from './components/CharacterPreview';
import { SaveMenu } from './components/SaveMenu';
import { AchievementsPanel } from './components/AchievementsPanel';

interface PlayableChar {
  id: string;
  name: string;
  color: string;
  appearance: Appearance;
  group: 'Originals' | 'New Blood';
  role: string;
  blurb: string;
}

const CHARACTERS: PlayableChar[] = [
  { id: 'penguin', name: 'Penguin1NA', color: '#00ffff', appearance: APPEARANCES.penguin, group: 'Originals', role: 'The original', blurb: 'Started this whole mess. Still here.' },
  { id: 'ripted', name: 'Ripted', color: '#ffd700', appearance: APPEARANCES.ripted, group: 'Originals', role: 'Founder energy', blurb: 'Built the list. Regrets the list.' },
  { id: 'champy', name: 'Champy', color: '#bf00ff', appearance: APPEARANCES.champy, group: 'Originals', role: 'League veteran', blurb: 'Number one, by any means available.' },
  { id: 'polar', name: 'Polar', color: '#add8e6', appearance: APPEARANCES.polar, group: 'Originals', role: 'Speedrunner', blurb: 'Does not stop. Does not explain.' },
  { id: 'custom', name: 'Custom', color: '#ffffff', appearance: APPEARANCES.custom, group: 'Originals', role: 'Your own legend', blurb: 'Name yourself. Face the void.' },
  { id: 'vex', name: 'Vex', color: '#8a7a6a', appearance: APPEARANCES.vex, group: 'New Blood', role: APPEARANCES.vex.role!, blurb: APPEARANCES.vex.blurb! },
  { id: 'marla', name: 'Marla', color: '#e46aa0', appearance: APPEARANCES.marla, group: 'New Blood', role: APPEARANCES.marla.role!, blurb: APPEARANCES.marla.blurb! },
  { id: 'bruno', name: 'Bruno', color: '#7a9a4a', appearance: APPEARANCES.bruno, group: 'New Blood', role: APPEARANCES.bruno.role!, blurb: APPEARANCES.bruno.blurb! },
  { id: 'kaya', name: 'Kaya', color: '#39c0b0', appearance: APPEARANCES.kaya, group: 'New Blood', role: APPEARANCES.kaya.role!, blurb: APPEARANCES.kaya.blurb! },
  { id: 'don_orso', name: 'Don Orso', color: '#b09ad0', appearance: APPEARANCES.don_orso, group: 'New Blood', role: APPEARANCES.don_orso.role!, blurb: APPEARANCES.don_orso.blurb! },
  { id: 'stitch', name: 'Stitch', color: '#d45aff', appearance: APPEARANCES.stitch, group: 'New Blood', role: APPEARANCES.stitch.role!, blurb: APPEARANCES.stitch.blurb! },
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
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    player: {
      name,
      characterType,
      pos,
      inventory: [STARTING_ITEM],
      equipped: STARTING_ITEM,
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
  const migrated = migrateSave(s);
  if (!migrated) return newGameState(s?.player?.name || 'Newcomer', s?.player?.characterType || 'penguin');
  // Keep the saved position/hp/etc. but guarantee every field exists.
  return {
    ...migrated,
    player: {
      ...migrated.player,
      inventory: migrated.player.inventory.length ? migrated.player.inventory : [STARTING_ITEM],
      equipped: migrated.player.equipped || STARTING_ITEM,
    },
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
  const [shop, setShop] = useState<{ id: string; name: string; stock: ShopEntry[] } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [customName, setCustomName] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('penguin');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [equippedItemId, setEquippedItemId] = useState<string>(STARTING_ITEM);
  const [hudTick, setHudTick] = useState(0); // forces HUD refresh ~1/s
  const [combat, setCombat] = useState<{ active: boolean; hp: number; maxHp: number } | null>(null);
  const [speedrun, setSpeedrun] = useState<{ active: boolean; elapsed: number; best: number | null }>(
    { active: false, elapsed: 0, best: null }
  );
  const [inputMode, setInputMode] = useState<'keyboard' | 'touch'>('keyboard');
  const [saveSlots, setSaveSlots] = useState(() => StateManager.slots());
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [bossFight, setBossFight] = useState<string | null>(null);
  // Bumped whenever a run starts or a save loads, so the render loop rebuilds
  // its engine even when the character type is unchanged.
  const [runId, setRunId] = useState(0);

  const audioRef = useRef<AudioManager | null>(null);
  const playtimeRef = useRef(0);
  const lastAutosaveRef = useRef(0);
  // Mirrors of React state the animation loop reads without re-subscribing.
  const bossFightRef = useRef<string | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const combatRef = useRef<{ active: boolean; hp: number; maxHp: number } | null>(null);
  gameStateRef.current = gameState;
  bossFightRef.current = bossFight;
  combatRef.current = combat;
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

  // Drivable-car state and transient tire effects.
  const activeCarRef = useRef<Car | null>(null);
  const carVelRef = useRef(0);
  const carSteerRef = useRef(0);
  const skidRef = useRef<{ x: number; y: number; a: number; life: number }[]>([]);
  const dustRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const shakeRef = useRef(0);
  const enemyHitRef = useRef(0);
  const pedHitRef = useRef(0);
  /** 0..1 red damage vignette, decays each frame. */
  const hurtFlashRef = useRef(0);
  const [drivingName, setDrivingName] = useState<string | null>(null);
  const [carSpeed, setCarSpeed] = useState(0);
  const carSpeedRef = useRef(0);
  const lastEngineRef = useRef(0);
  // ---- Mature-content state -------------------------------------------------
  // Preferences load from the settings store so they survive across runs.
  const initialSettings = useRef(SettingsStore.load());
  const [strongLanguage, setStrongLanguage] = useState(initialSettings.current.strongLanguage);
  const [radioOn, setRadioOn] = useState(initialSettings.current.radioOn);
  const [audioVolume, setAudioVolume] = useState(initialSettings.current.volume);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [radioIdx, setRadioIdx] = useState(0);
  const [radioLine, setRadioLine] = useState(0);
  const [substance, setSubstance] = useState<SubstanceEffect | null>(null);
  const substanceRef = useRef<SubstanceEffect | null>(null);
  const radioTimerRef = useRef(0);
  const wantedRef = useRef(0);
  const [wantedLevel, setWantedLevel] = useState(0);
  const strongLanguageRef = useRef(false);
  strongLanguageRef.current = strongLanguage;

  const addToast = useCallback((title: string, description: string) => {
    const id = ++toastIdRef.current;
    // Keep the stack short: a crime spree can log several events in a frame,
    // and unbounded toasts march off the top of the screen.
    setToasts(prev => [...prev, { id, title, description }].slice(-3));
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioManager();
    return audioRef.current;
  }, []);

  // Apply persisted audio preferences once, then persist any later change.
  useEffect(() => {
    const a = getAudio();
    a.setVolume(initialSettings.current.volume);
    a.setMuted(initialSettings.current.muted);
  }, [getAudio]);

  useEffect(() => {
    SettingsStore.save({
      strongLanguage,
      radioOn,
      muted: getAudio().muted,
      volume: getAudio().getVolume(),
    });
  }, [strongLanguage, radioOn, audioVolume, getAudio]);

  // Fullscreen is a browser-level concern; mirror its state so the pause menu
  // label stays correct when the player leaves with Esc or F11.
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Denied (e.g. an iframe without allowfullscreen); leave the state as-is.
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const resetRunRefs = () => {
    engineRef.current = null;
    worldRef.current = new WorldRuntime();
    activeInteriorRef.current = null;
    activeCarRef.current = null;
    carVelRef.current = 0;
    carSteerRef.current = 0;
    carSpeedRef.current = 0;
    setCarSpeed(0);
    setDrivingName(null);
    setInsideName(null);
    lastZoneRef.current = '';
    lastAutosaveRef.current = performance.now();
    setBossFight(null);
    setCombat(null);
    setSpeedrun({ active: false, elapsed: 0, best: null });
    pedHitRef.current = 0;
    hurtFlashRef.current = 0;
    shakeRef.current = 0;
    skidRef.current = [];
    dustRef.current = [];
    setRunId(n => n + 1);
  };

  const startGame = (charId: string) => {
    const char = CHARACTERS.find(c => c.id === charId)!;
    const name = charId === 'custom' ? (customName || 'Newcomer') : char.name;
    resetRunRefs();
    playtimeRef.current = 0;
    setEquippedItemId(STARTING_ITEM);
    setGameState(newGameState(name, charId));
    getAudio().blip();
  };

  const loadState = (saved: GameState) => {
    resetRunRefs();
    const normalized = normalizeState(saved);
    // Restore playtime and equipment so a loaded run continues where it left off.
    playtimeRef.current = normalized.player.playtime || 0;
    setEquippedItemId(normalized.player.equipped || STARTING_ITEM);
    worldRef.current!.restore(normalized.worldSave);
    setGameState(normalized);
    // Re-arm an in-progress boss fight that was saved mid-encounter.
    const activeBoss = BOSSES.find(
      b => normalized.flags[b.startFlag] === true && normalized.flags[b.defeatedFlag] !== true,
    );
    if (activeBoss) {
      setBossFight(activeBoss.npcId);
      setCombat({ active: true, hp: activeBoss.maxHp, maxHp: activeBoss.maxHp });
    }
    // If the run was saved mid-drive, put the player back behind the wheel so
    // they do not spawn inside the car's collision box.
    const savedCarId = normalized.worldSave?.drivingCarId;
    const savedCar = savedCarId ? worldRef.current!.cars.find(c => c.id === savedCarId) : undefined;
    if (savedCar) {
      activeCarRef.current = savedCar;
      carVelRef.current = 0;
      carSteerRef.current = 0;
      carSpeedRef.current = 0;
      setCarSpeed(0);
      setDrivingName(savedCar.name);
      // The engine is rebuilt from this state, so seed the player at the car.
      setGameState(prev => prev ? {
        ...prev,
        player: {
          ...prev.player,
          pos: {
            x: savedCar.pos.x + savedCar.size.x / 2 - 15,
            y: savedCar.pos.y + savedCar.size.y / 2 - 15,
          },
        },
      } : prev);
    }
    getAudio().blip();
  };

  /** Clears every saved slot and starts a fresh run from the menu. */
  const newGame = (charId: string) => {
    StateManager.clear();
    setSaveSlots(StateManager.slots());
    startGame(charId);
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

  // Start a boss encounter as soon as its dialogue sets the start flag, and
  // stop it once the boss is defeated (so talking again does not re-arm it).
  useEffect(() => {
    if (!gameState) return;
    const active = BOSSES.find(
      b => gameState.flags[b.startFlag] === true && gameState.flags[b.defeatedFlag] !== true,
    );
    setBossFight(prev => {
      if (active) return active.npcId;
      return prev;
    });
  }, [gameState?.flags]);

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
      const renderer = new Renderer(canvas);
      engineRef.current = {
        renderer,
        input: new InputHandler(),
        camera: new Camera(renderer.cssWidth, renderer.cssHeight),
        player,
      };
    }

    const { renderer, input, camera, player } = engineRef.current;

    // Mirror the engine's live input mode (it sees every key and touch).
    const unsubscribeMode = input.onModeChange(setInputMode);
    setInputMode(input.getMode());

    const onResize = () => {
      renderer.resize();
      camera.resize(renderer.cssWidth, renderer.cssHeight);
    };
    window.addEventListener('resize', onResize);
    camera.resize(renderer.cssWidth, renderer.cssHeight);

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

      // Ocean base, then the landmasses, then the rivers and lakes.
      ctx.fillStyle = '#0b2430';
      ctx.fillRect(0, 0, w, h);
      LAND_FEATURES.forEach(l => {
        ctx.fillStyle = '#3a4038';
        ctx.fillRect(l.x * sx, l.y * sy, l.width * sx, l.height * sy);
      });
      WATER_FEATURES.forEach(wf => {
        ctx.fillStyle = '#123a4a';
        ctx.fillRect(wf.x * sx, wf.y * sy, wf.width * sx, wf.height * sy);
      });

      Object.values(LOCATIONS).forEach((loc: any) => {
        const b = loc.bounds;
        ctx.fillStyle = LOCATION_MINIMAP_COLORS[loc.id] || '#444';
        ctx.globalAlpha = 0.55;
        ctx.fillRect(b.x * sx, b.y * sy, b.width * sx, b.height * sy);
        ctx.globalAlpha = 1;
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
          : it.interactiveKind === 'merchant' ? '#7ac0d0'
          : 'rgba(200,200,200,0.6)';
        ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      });
      // Traffic runs (live car positions).
      (worldRef.current?.cars || []).forEach(c => {
        ctx.fillStyle = c.routeId ? 'rgba(240,240,240,0.7)' : 'rgba(180,170,150,0.5)';
        ctx.fillRect((c.pos.x + c.size.x / 2) * sx - 1.5, (c.pos.y + c.size.y / 2) * sy - 1.5, 3, c.routeId ? 2 : 3);
      });
      // Hostiles, drawn as red pips.
      (worldRef.current?.enemies || []).forEach(e => {
        ctx.fillStyle = '#ff4030';
        ctx.fillRect((e.pos.x + e.size.x / 2) * sx - 1.5, (e.pos.y + e.size.y / 2) * sy - 1.5, 3, 3);
      });
      // Police, drawn as flashing blue pips so a chase is readable at a glance.
      const policeFlash = Math.sin(performance.now() / 140) > 0;
      (worldRef.current?.police || []).forEach(p => {
        ctx.fillStyle = policeFlash ? '#4080ff' : '#ffffff';
        ctx.fillRect((p.pos.x + p.size.x / 2) * sx - 2, (p.pos.y + p.size.y / 2) * sy - 2, 4, 4);
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

      // Waypoint arrow toward the nearest active quest.
      let bestMk: any = null;
      let bestD = Infinity;
      gameState.activeQuests.forEach(title => {
        const mk = QUEST_MARKERS[title];
        if (!mk) return;
        const d = Math.hypot(mk.x - player.pos.x, mk.y - player.pos.y);
        if (d < bestD) { bestD = d; bestMk = mk; }
      });
      if (bestMk) {
        const px = player.pos.x * sx;
        const py = player.pos.y * sy;
        const ang = Math.atan2(bestMk.y * sy - py, bestMk.x * sx - px);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(255,170,0,0.95)';
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(3, -5);
        ctx.lineTo(3, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      void cam;
    };

    let animationFrameId: number;
    let lastFrame = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = now - lastFrame;
      lastFrame = now;
      const world = getWorld();
      world.setViewport(renderer.cssWidth, renderer.cssHeight);
      const dtSec = Math.min(dt, 100) / 1000;
      const exteriorNow = !activeInteriorRef.current;
      world.update(dtSec, exteriorNow ? { x: player.pos.x + player.size.x / 2, y: player.pos.y + player.size.y / 2 } : undefined);
      const driving = !!activeCarRef.current;
      const shake = shakeRef.current;
      if (shake > 0) shakeRef.current = Math.max(0, shake - dt * 0.004);

      // Hostile contact damage (ignored mid-dodge, which is the counterplay).
      if (world.pendingDamage > 0 && exteriorNow && !player.dodging) {
        const dmg = world.pendingDamage;
        getAudio().hurt();
        hurtFlashRef.current = Math.min(1, hurtFlashRef.current + dmg / 30 + 0.25);
        setGameState(prev => {
          if (!prev) return null;
          const hp = Math.max(0, prev.player.hp - dmg);
          if (hp <= 0) return { ...prev, player: { ...prev.player, hp: 0 }, flags: { ...prev.flags, game_ended: true } };
          return { ...prev, player: { ...prev.player, hp } };
        });
      }
      const inDialogue = !!dialogueRef.current;
      const interior = activeInteriorRef.current;
      const paused = isPaused || !!ending || !!shop;

      // ---- Crime / wanted feedback: toast new crimes, track the top star ----
      if (world.crimeEvents.length) {
        const events = world.crimeEvents.splice(0, world.crimeEvents.length);
        for (const ev of events) {
          // A low blip, not the damage sting: committing a crime is a log
          // entry, and the hurt sound reads as "you just got hit".
          if (getAudio) getAudio().blip();
          const label = ev.replace(/_/g, ' ');
          if (wantedRef.current < world.wanted.level) {
            addToast(`Wanted ★${world.wanted.level}`, `You committed: ${label}.`);
          } else {
            addToast('Crime logged', `You committed: ${label}.`);
          }
        }
      }
      if (world.wanted.level !== wantedRef.current) {
        wantedRef.current = world.wanted.level;
        setWantedLevel(world.wanted.level);
        setGameState(prev => prev ? ({
          ...prev,
          flags: {
            ...prev.flags,
            max_wanted_level: Math.max((prev.flags.max_wanted_level as number) || 0, world.wanted.level),
          },
        }) : prev);
        if (world.wanted.level === 0) addToast('Lost the cops', 'You are no longer wanted.');
      }

      // ---- Substance effect burn-off ---------------------------------------
      const eff = substanceRef.current;
      if (eff && exteriorNow) {
        eff.remaining -= dtSec;
        if (eff.remaining <= 0) {
          substanceRef.current = null;
          setSubstance(null);
          const spec = SUBSTANCES[eff.kind];
          addToast('Coming down', spec.comeDown);
        }
      }

      // ---- Radio chatter: cycles DJ patter across the stations -------------
      if (radioOn && exteriorNow && !paused) {
        radioTimerRef.current += dtSec;
        if (radioTimerRef.current > 9) {
          radioTimerRef.current = 0;
          setRadioLine(prev => {
            const station = RADIO_STATIONS[radioIdx % RADIO_STATIONS.length];
            const next = prev + 1;
            if (next >= station.lines.length) {
              setRadioIdx(i => (i + 1) % RADIO_STATIONS.length);
              return 0;
            }
            return next;
          });
        }
      }

      // A boss is active once its dialogue set the start flag and it is not yet
      // defeated. The spec tells us which NPC, how hard it hits, and the reward.
      const bossSpec: BossSpec | undefined = bossFightRef.current
        ? BOSS_BY_NPC[bossFightRef.current]
        : undefined;
      const fighting = !!bossSpec;

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
          player.update(movement, roomSolids, dtSec);
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
      } else if (driving) {
        // ---- Driving a commandeered car -----------------------------------
        const car = activeCarRef.current!;
        const movement = (!inDialogue && !paused) ? input.getMovement() : { x: 0, y: 0 };
        if (!inDialogue && !paused) {
          if (dt > 0) playtimeRef.current += dt;

          // getMovement() returns x = left/right (A/D, arrow keys) and
          // y = up/down (W/S), with y already negated for "up". Driving needs
          // the opposite mapping: W/S is throttle and A/D is steering.
          const throttle = -movement.y;         // W: forward, S: reverse
          const steerInput = movement.x;        // A: left, D: right
          const speed = carVelRef.current;

          // Longitudinal: engine force, rolling drag and a speed cap. Reverse
          // tops out lower than forward so it is a manoeuvre, not a shortcut.
          const spec = carSpec(car.carKind);
          const maxFwd = spec.maxSpeed;
          const maxRev = spec.maxSpeed * 0.4;
          const accel = spec.accel;
          carVelRef.current += throttle * accel * dtSec;
          carVelRef.current -= speed * 1.1 * dtSec;            // drag
          if (throttle === 0) carVelRef.current *= (1 - Math.min(1, dtSec * 2.2)); // engine braking
          carVelRef.current = Math.max(-maxRev, Math.min(maxFwd, carVelRef.current));

          // Steering eases toward the input so the wheel does not snap.
          const targetSteer = steerInput * spec.handling;
          carSteerRef.current += (targetSteer - carSteerRef.current) * Math.min(1, dtSec * 7);

          // Turn rate scales with speed (no turning while parked) and flips in
          // reverse, so the car steers like a real one instead of a turret.
          const speedRatio = Math.min(1, Math.abs(carVelRef.current) / maxFwd);
          const direction = carVelRef.current >= 0 ? 1 : -1;
          car.angle += carSteerRef.current * speedRatio * 2.6 * dtSec * direction;

          const vx = Math.cos(car.angle) * carVelRef.current * dtSec;
          const vy = Math.sin(car.angle) * carVelRef.current * dtSec;

          // Buildings, other cars and closed gates stop the car hard. Pedestrians
          // are deliberately excluded: clipping one shoves them aside instead of
          // bringing a two-tonne vehicle to a dead stop.
          const blockers = [...BUILDINGS, ...world.cars.filter(c => c !== car), ...world.exteriorSolids(), ...WATER_SOLIDS];
          let hit = false;
          if (!CollisionSystem.checkCollision({ x: car.pos.x + vx, y: car.pos.y }, car.size, blockers)) car.pos.x += vx;
          else hit = true;
          if (!CollisionSystem.checkCollision({ x: car.pos.x, y: car.pos.y + vy }, car.size, blockers)) car.pos.y += vy;
          else hit = true;
          if (hit && Math.abs(carVelRef.current) > 40) {
            shakeRef.current = Math.min(1, Math.abs(carVelRef.current) / maxFwd);
            carVelRef.current *= -0.25;
            carSteerRef.current = 0;
            getAudio().hurt();
          }
          car.pos = {
            x: Math.max(0, Math.min(MAP_WIDTH - car.size.x, car.pos.x)),
            y: Math.max(0, Math.min(MAP_HEIGHT - car.size.y, car.pos.y)),
          };

          // Player rides along.
          player.pos = { x: car.pos.x + car.size.x / 2 - player.size.x / 2, y: car.pos.y + car.size.y / 2 - player.size.y / 2 };

          // Clipping a pedestrian knocks them out of the way. A fast hit is a
          // crime (and messy); a slow nudge just staggers them.
          const bumped = Math.abs(carVelRef.current) > 35 ? world.pedestrianHitBy(car.pos, car.size) : null;
          if (bumped && now - pedHitRef.current > 500) {
            pedHitRef.current = now;
            const fastHit = Math.abs(carVelRef.current) > 150;
            world.shoveNpc(
              bumped.id,
              car.pos.x + car.size.x / 2,
              car.pos.y + car.size.y / 2,
              220 + Math.abs(carVelRef.current) * 1.1,
              fastHit ? 1.1 : 0.6
            );
            getAudio().hurt();
            shakeRef.current = Math.max(shakeRef.current, fastHit ? 0.5 : 0.25);
            if (fastHit) {
              world.addGore(bumped.pos.x + bumped.size.x / 2, bumped.pos.y + bumped.size.y / 2, 'smear', 1);
              world.commitCrime('vehicular assault', 0.34);
              addToast('Hit and run', `You clipped ${bumped.name} and kept driving.`);
              setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, did_roadkill: true } }) : prev);
            }
          }

          // Tire marks and dust while moving fast.
          const fast = Math.abs(carVelRef.current) > 90;
          const hardTurn = Math.abs(carSteerRef.current) > 0.55;
          if (hardTurn && fast) skidRef.current.push({ x: car.pos.x + car.size.x / 2, y: car.pos.y + car.size.y / 2, a: car.angle, life: 1.4 });
          if (fast) dustRef.current.push({ x: car.pos.x + car.size.x / 2 - Math.cos(car.angle) * car.size.x / 2, y: car.pos.y + car.size.y / 2 - Math.sin(car.angle) * car.size.y / 2, vx: -Math.cos(car.angle) * 20 + (Math.random() - 0.5) * 20, vy: -Math.sin(car.angle) * 20 + (Math.random() - 0.5) * 20, life: 0.6 });
          skidRef.current = skidRef.current.filter(s => (s.life -= dtSec) > 0);
          dustRef.current = dustRef.current.filter(d => { d.x += d.vx * dtSec; d.y += d.vy * dtSec; return (d.life -= dtSec) > 0; });

          // Ramming a hostile kills it.
          const victim = world.enemyAt(car.pos, car.size, 46);
          if (victim && Math.abs(carVelRef.current) > 120 && now - enemyHitRef.current > 350) {
            enemyHitRef.current = now;
            world.addGore(victim.pos.x + victim.size.x / 2, victim.pos.y + victim.size.y / 2, 'smear', 1.2);
            world.damageEnemy(victim.id, 999);
            addToast('Roadkill', `You flattened a ${victim.enemyKind}.`);
            getAudio().hit();
            setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, did_roadkill: true } }) : prev);
          }

          // Engine note follows speed; the HUD speed readout follows too.
          const kmh = Math.round(Math.abs(carVelRef.current) * 0.4);
          if (kmh !== carSpeedRef.current) {
            carSpeedRef.current = kmh;
            setCarSpeed(kmh);
          }
          const snd = getAudio();
          const pitch = 70 + speedRatio * 180;
          if (Math.abs(carVelRef.current) > 15 && now - lastEngineRef.current > 110) {
            lastEngineRef.current = now;
            snd.engine(pitch);
          }

          camera.update(player.pos, dtSec);
          // E exits the car; ESC pauses, as it does on foot. Exit-to-car on ESC
          // was inconsistent and left no way to pause while driving.
          if (input.consumePressed('e') || input.consumeAction() === 'interact') exitCar();
          if (input.consumePressed('escape')) setIsPaused(true);
        }
        // Recover from a destroyed car.
        if ((gameStateRef.current?.player.hp ?? 0) <= 0 && activeCarRef.current) exitCar();

        setInteractPrompt(driving ? 'W/S to drive · E to exit' : null);

        // ---- Render while driving ----
        renderer.clear();
        renderer.ctx.save();
        camera.apply(renderer.ctx);
        renderer.drawWorld(LOCATIONS, camera, { gates: world.gates, daylight: world.daylight });
        for (const g of world.gore) drawGore(renderer.ctx, g);
        drawSkids(renderer.ctx);
        WORLD_OBJECTS.forEach(obj => renderer.drawEntity(obj, camera, undefined, dt));
        for (const npc of world.visibleNpcs()) renderer.drawEntity(npc, camera, undefined, dt);
        for (const c of world.cars) if (c !== car) renderer.drawCar(c, camera, now / 1000);
        for (const e of world.enemies) renderer.drawEnemy(e, camera, now / 1000);
        for (const p of world.police) renderer.drawEnemy(p, camera, now / 1000);
        renderer.drawCarWithDriver(car, camera, now / 1000, player);
        drawDust(renderer.ctx);
        renderer.drawWorldLights(camera);
        renderer.ctx.restore();
      } else {
        // ---- Walking the exterior world ------------------------------------
        if (!inDialogue && !paused) {
          if (dt > 0) playtimeRef.current += dt;
          const movement = input.getMovement();
          // Intoxicants alter movement speed and steadiness.
          const subSpec = substanceRef.current ? SUBSTANCES[substanceRef.current.kind] : null;
          const mul = subSpec ? subSpec.speedMul : 1;
          if (mul !== 1) { movement.x *= mul; movement.y *= mul; }
          const solids = [...WORLD_OBJECTS, ...world.visibleNpcs(), ...world.obstacleSolids()];
          if (input.consumePressed('shift') && player.tryDodge(movement)) getAudio().step();
          player.update(movement, solids, dtSec);
          player.clampToWorld();
          // A sprinting dodge shoulder-barges bystanders out of the way.
          if (player.dodging) {
            const near = world.pedestrianHitBy(player.pos, player.size);
            if (near && now - pedHitRef.current > 400) {
              pedHitRef.current = now;
              world.shoveNpc(near.id, player.pos.x + player.size.x / 2, player.pos.y + player.size.y / 2, 190, 0.5);
            }
          }
          camera.update(player.pos, dtSec);
          if (subSpec && subSpec.wobble > 0) {
            camera.pos.x += Math.sin(now / 180) * subSpec.wobble;
            camera.pos.y += Math.cos(now / 140) * subSpec.wobble;
          }
          if (movement.x !== 0 || movement.y !== 0) {
            if (Math.random() < 0.08) getAudio().step();
          }
          if (input.consumePressed('q') || input.consumeAction() === 'quests') setShowQuestLog(v => !v);
          if (input.consumePressed('i') || input.consumeAction() === 'inventory') setShowInventory(v => !v);
          if (input.consumePressed('escape')) setIsPaused(true);
        }

        // Interactables: NPCs, world objects, fixtures and hostiles.
        const interactables: any[] = [...world.visibleNpcs(), ...WORLD_OBJECTS, ...INTERACTIVES, ...world.enemies, ...world.police];
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
        // Parked car the player can commandeer.
        const carNear = !nearest ? world.drivableCarAt(player.pos, player.size, 70) : null;
        const wantInteract = input.consumePressed('e') || input.consumeAction() === 'interact';

        if (nearest) {
          const label = nearest.type === 'building'
            ? BUILDING_LABELS[nearest.buildingKind as keyof typeof BUILDING_LABELS]
            : nearest.name;
          if (nearest.id === bossSpec?.npcId) {
            setInteractPrompt('Press E to ATTACK');
          } else if (nearest.type === 'enemy') {
            setInteractPrompt(nearest.enemyKind === 'police' ? 'Press E to resist arrest' : 'Press E to attack');
          } else if (nearest.interactiveKind === 'chest') {
            setInteractPrompt(nearest.used ? 'Opened' : 'Press E to open chest');
          } else if (nearest.interactiveKind === 'campfire') {
            setInteractPrompt('Press E to rest');
          } else if (nearest.interactiveKind === 'lever') {
            setInteractPrompt(nearest.used ? 'Lever pulled' : 'Press E to pull lever');
          } else if (nearest.interactiveKind === 'merchant') {
            setInteractPrompt(`Press E to trade with ${label}`);
          } else if (nearest.interactiveKind === 'bordello') {
            setInteractPrompt('Press E to step inside (fade to black)');
          } else if (nearest.interactiveKind === 'dumpster') {
            setInteractPrompt(nearest.used ? 'Searched' : 'Press E to search');
          } else {
            setInteractPrompt(`Press E to interact with ${label}`);
          }
        } else if (carNear) {
          setInteractPrompt('Press E to steal this car');
        } else if (door) {
          setInteractPrompt('Press E to enter');
        } else {
          setInteractPrompt(null);
        }

        if (wantInteract && !dialogueRef.current) {
          if (nearest && nearest.type === 'enemy') {
            const item = ITEMS[equippedItemId];
            const dmg = item?.weapon ? (item.damage || 4) : 3;
            getAudio().hit();
            const slain = world.damageEnemy(nearest.id, dmg);
            if (slain) {
              addToast('Hostile down', `You defeated a ${nearest.enemyKind}.`);
              getAudio().achievement();
              setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, killed_hostile: true } }) : prev);
            }
          } else if (fighting && nearest && nearest.id === bossSpec!.npcId) {
            strikeBoss();
          } else if (nearest) {
            applyInteract(nearest);
          } else if (carNear) {
            enterCar(carNear);
          } else if (door) {
            enterInterior(door.interiorId);
          }
        }

        // Boss retaliation.
        const boss = bossSpec ? world.npcById(bossSpec.npcId) : undefined;
        if (fighting && !paused && boss && bossSpec) {
          const dist = Math.hypot(player.pos.x - boss.pos.x, player.pos.y - boss.pos.y);
          if (dist < INTERACT_RADIUS + 20 && now - bossHitCooldownRef.current > 1200) {
            bossHitCooldownRef.current = now;
            getAudio().hurt();
            hurtFlashRef.current = Math.min(1, hurtFlashRef.current + bossSpec.damage / 30 + 0.3);
            shakeRef.current = Math.max(shakeRef.current, 0.3);
            setGameState(prev => {
              if (!prev) return null;
              const hp = Math.max(0, prev.player.hp - bossSpec.damage);
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
        if (world.night && gameStateRef.current?.flags.saw_night !== true) {
          setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, saw_night: true } }) : prev);
        }

        // ---- Render the exterior ----
        renderer.clear();
        renderer.ctx.save();
        // Screen shake on a hard car impact.
        if (shakeRef.current > 0.01) {
          const s = shakeRef.current * 9;
          renderer.ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
        }
        camera.apply(renderer.ctx);
        renderer.drawWorld(LOCATIONS, camera, { gates: world.gates, daylight: world.daylight });
        for (const g of world.gore) drawGore(renderer.ctx, g);
        drawSkids(renderer.ctx);
        WORLD_OBJECTS.forEach(obj => renderer.drawEntity(obj, camera, undefined, dt));
        for (const npc of world.visibleNpcs()) {
          const isBoss = npc.id === bossSpec?.npcId;
          renderer.drawEntity(npc, camera, isBoss && fighting ? { hp: combat?.hp ?? bossSpec!.maxHp, maxHp: combat?.maxHp ?? bossSpec!.maxHp } : undefined, dt);
        }
        for (const c of world.cars) renderer.drawCar(c, camera, now / 1000);
        for (const e of world.enemies) renderer.drawEnemy(e, camera, now / 1000);
        for (const p of world.police) renderer.drawEnemy(p, camera, now / 1000);
        renderer.drawEntity(player, camera, undefined, dt);
        drawDust(renderer.ctx);
        renderer.drawWorldLights(camera);
        renderer.ctx.restore();

        // Weather and intoxicant tint paint over the viewport in screen space.
        world.weather.draw(renderer.ctx);
        const subEff = substanceRef.current;
        if (subEff) {
          const spec = SUBSTANCES[subEff.kind];
          renderer.ctx.save();
          renderer.ctx.globalAlpha = Math.max(0, Math.min(1, subEff.remaining / 2));
          renderer.ctx.fillStyle = spec.tint;
          renderer.ctx.fillRect(0, 0, renderer.cssWidth, renderer.cssHeight);
          renderer.ctx.restore();
        }
      }

      // Speedrun lap timing.
      if (speedrunStartRef.current !== null) {
        const elapsed = now - speedrunStartRef.current;
        setSpeedrun(prev => (prev.active ? { ...prev, elapsed } : prev));
      }

      // Damage vignette and its decay, applied over whatever was drawn.
      if (hurtFlashRef.current > 0.01) {
        const vw = renderer.cssWidth;
        const vh = renderer.cssHeight;
        const grad = renderer.ctx.createRadialGradient(
          vw / 2, vh / 2, Math.min(vw, vh) * 0.3,
          vw / 2, vh / 2, Math.max(vw, vh) * 0.62
        );
        grad.addColorStop(0, 'rgba(180,0,0,0)');
        grad.addColorStop(1, `rgba(190,10,10,${0.6 * hurtFlashRef.current})`);
        renderer.ctx.save();
        renderer.ctx.fillStyle = grad;
        renderer.ctx.fillRect(0, 0, vw, vh);
        renderer.ctx.restore();
        hurtFlashRef.current = Math.max(0, hurtFlashRef.current - dt * 0.0022);
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

    /** Enters the nearest parked car. */
    function enterCar(car: Car) {
      activeCarRef.current = car;
      carVelRef.current = 0;
      carSteerRef.current = 0;
      carSpeedRef.current = 0;
      setCarSpeed(0);
      setDrivingName(car.name);
      setInteractPrompt('W/S to drive · E to exit');
      getAudio().interact();
      const w = getWorld();
      w.setDrivenCar(car.id);
      // Grand theft auto: commandeering any car is a crime.
      if (!car.id.startsWith('car_stolen')) {
        w.commitCrime('grand theft auto', 0.22);
        setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, car_stolen: true } }) : prev);
      }
    }

    /**
     * Leaves the current car. The player steps out to whichever side has room,
     * so exiting against a wall does not eject them into a building.
     */
    function exitCar() {
      const car = activeCarRef.current;
      activeCarRef.current = null;
      carVelRef.current = 0;
      carSteerRef.current = 0;
      carSpeedRef.current = 0;
      setCarSpeed(0);
      setDrivingName(null);
      setInteractPrompt(null);
      if (!car) return;
      worldRef.current!.setDrivenCar(null);

      const solids = [...BUILDINGS, ...worldRef.current!.visibleNpcs(), ...worldRef.current!.obstacleSolids()];
      const centreX = car.pos.x + car.size.x / 2 - player.size.x / 2;
      const centreY = car.pos.y + car.size.y / 2 - player.size.y / 2;
      const candidates = [
        { x: centreX, y: car.pos.y + car.size.y + 12 },  // south
        { x: centreX, y: car.pos.y - player.size.y - 12 }, // north
        { x: car.pos.x + car.size.x + 12, y: centreY },    // east
        { x: car.pos.x - player.size.x - 12, y: centreY }, // west
      ];
      const spot = candidates.find(c =>
        !CollisionSystem.checkCollision(c, player.size, solids)
      ) || candidates[0];
      player.pos = {
        x: Math.max(0, Math.min(MAP_WIDTH - player.size.x, spot.x)),
        y: Math.max(0, Math.min(MAP_HEIGHT - player.size.y, spot.y)),
      };
      getAudio().blip();
    }

    /** Fading tire marks left by hard cornering. */
    function drawSkids(ctx: CanvasRenderingContext2D) {
      for (const s of skidRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life / 1.4) * 0.5;
        ctx.fillStyle = '#0a0a0a';
        ctx.translate(s.x, s.y);
        ctx.rotate(s.a);
        ctx.fillRect(-carHalf().x, -carHalf().y * 0.4, carHalf().x * 2, carHalf().y * 0.8);
        ctx.restore();
      }
    }

    /** Dust kicked up behind a moving car. */
    function drawDust(ctx: CanvasRenderingContext2D) {
      for (const d of dustRef.current) {
        ctx.globalAlpha = Math.max(0, d.life / 0.6) * 0.4;
        ctx.fillStyle = '#c8c0a8';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function carHalf(): Vector2 {
      const car = activeCarRef.current;
      return car ? { x: car.size.x / 2, y: car.size.y / 2 } : { x: 30, y: 16 };
    }

    /** Saves without disturbing React state. */
    function autosave(pos: Vector2) {
      setGameState(prev => {
        if (!prev) return prev;
        const snapshot: GameState = {
          ...prev,
          player: { ...prev.player, pos, playtime: playtimeRef.current, equipped: equippedItemId },
          worldSave: getWorld().save(),
        };
        StateManager.autosave(snapshot);
        return prev;
      });
    }

    function strikeBoss() {
      const spec = bossFightRef.current ? BOSS_BY_NPC[bossFightRef.current] : undefined;
      if (!spec) return;
      const item = ITEMS[equippedItemId];
      const dmg = item?.weapon ? (item.damage || 4) : 3;
      getAudio().hit();
      const prev = combatRef.current;
      const maxHp = prev?.maxHp ?? spec.maxHp;
      const hp = Math.max(0, (prev?.hp ?? spec.maxHp) - dmg);
      const next = { active: true, hp, maxHp };
      combatRef.current = next;
      setCombat(next);
      if (hp <= 0) {
        // Victory: flag it, grant the reward, and end the fight. Guard on the
        // boss still being active so a double-invoked update cannot double-pay.
        getAudio().achievement();
        if (bossFightRef.current === spec.npcId) {
          bossFightRef.current = null;
          setBossFight(null);
          setGameState(gs => {
            if (!gs || gs.flags[spec.defeatedFlag] === true) return gs;
            const flags: Record<string, any> = {
              ...gs.flags,
              [spec.defeatedFlag]: true,
            };
            if (spec.resolvesArcs) {
              flags.all_arcs_resolved = true;
              flags.game_ended = true;
            }
            const inventory = spec.rewardItem && !gs.player.inventory.includes(spec.rewardItem)
              ? [...gs.player.inventory, spec.rewardItem]
              : gs.player.inventory;
            return {
              ...gs,
              flags,
              player: { ...gs.player, inventory, gold: gs.player.gold + (spec.rewardGold || 0) },
            };
          });
          if (spec.rewardItem) {
            addToast('Boss defeated', `${spec.name} dropped the ${ITEMS[spec.rewardItem]?.name || spec.rewardItem}.`);
          } else {
            addToast('Boss defeated', `${spec.name} is down.`);
          }
        }
      }
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
          if (BOSS_BY_NPC[npc.id]) {
            const spec = BOSS_BY_NPC[npc.id];
            setCombat(prev => prev ?? { active: true, hp: spec.maxHp, maxHp: spec.maxHp });
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

    /** Chests, signs, levers, campfires and merchants. */
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
      if (kind === 'merchant') {
        if (!it.stock || it.stock.length === 0) {
          setCurrentDialogue({ id: 'merchant_empty', text: 'Nothing in stock today.' });
          setDialogueSpeaker(it.name);
          return;
        }
        setCurrentDialogue(null);
        setDialogueSpeaker(null);
        setShop({ id: it.id, name: it.name, stock: it.stock });
        getAudio().blip();
        return;
      }
      if (kind === 'dumpster') {
        if (it.used) {
          setCurrentDialogue({ id: 'dumpster_empty', text: 'Nothing but terrible smells remain.' });
          setDialogueSpeaker(it.name);
          return;
        }
        it.used = true;
        // Dumpster diving is petty crime with petty rewards.
        getWorld().commitCrime('dumpster diving', 0.08);
        const roll = Math.random();
        const itemId = roll < 0.4 ? 'stolen_watch' : roll < 0.7 ? 'bootleg_film' : 'energy_drink';
        const gold = 5 + Math.floor(Math.random() * 20);
        setGameState(prev => {
          if (!prev) return null;
          const inventory = [...prev.player.inventory];
          if (!inventory.includes(itemId) || itemId === 'energy_drink') inventory.push(itemId);
          return { ...prev, player: { ...prev.player, inventory, gold: (prev.player.gold || 0) + gold } };
        });
        setCurrentDialogue({ id: 'dumpster_loot', text: `You dig through the trash and find ${ITEMS[itemId]?.name || 'junk'} and ${gold} gold.` });
        setDialogueSpeaker(it.name);
        addToast('Dumpster looted', `Found ${ITEMS[itemId]?.name || 'junk'} and ${gold} gold.`);
        getAudio().pickup();
        return;
      }
      if (kind === 'bordello') {
        setCurrentDialogue({
          id: 'bordello_fade',
          text: 'The neon curtain swings shut. Defiantly rude music plays. The screen fades to black for a tasteful, entirely implied amount of time.',
        });
        setDialogueSpeaker(it.name);
        getWorld().commitCrime('public indecency', 0.06);
        setGameState(prev => {
          if (!prev) return null;
          const inventory = [...prev.player.inventory];
          if (!inventory.includes('feather_token')) inventory.push('feather_token');
          return {
            ...prev,
            player: { ...prev.player, inventory, hp: Math.min(prev.player.maxHp, prev.player.hp + 10) },
            flags: { ...prev.flags, bordello_visited: true },
          };
        });
        addToast('A night at The Feather', 'Fade to black. You feel inexplicably rested.');
        getAudio().achievement();
        return;
      }
    }

    // Zone changes trigger an autosave, but roaming inside one zone does not.
    // A periodic save means a closed tab or a crash costs at most this window.
    const autosaveInterval = window.setInterval(() => autosave(player.pos), 20000);

    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.clearInterval(autosaveInterval);
      window.removeEventListener('resize', onResize);
      unsubscribeMode();
    };
  }, [gameState?.player.characterType, runId, isPaused, ending, equippedItemId, combat?.hp]);

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

  // ESC resumes from the pause overlay, matching the key that opened it. The
  // guard keeps it from closing a panel stacked on top; ESC there closes the
  // panel instead.
  useEffect(() => {
    if (!isPaused || showSaveMenu || showAchievements) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        engineRef.current?.input.consumePressed('escape');
        setIsPaused(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPaused, showSaveMenu, showAchievements]);

  // Close the shop on E / Escape.
  useEffect(() => {
    if (!shop) return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'e' || key === 'escape' || key === 'enter') {
        e.preventDefault();
        engineRef.current?.input.consumePressed('e');
        engineRef.current?.input.consumePressed('escape');
        setShop(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shop]);

  const useItem = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return;
    if (item.weapon) {
      setEquippedItemId(itemId);
      addToast('Equipped', `${item.name} (+${item.damage} damage)`);
      getAudio().blip();
      return;
    }
    // Fictional intoxicants: apply a timed status effect.
    const subKind = SUBSTANCE_ITEM[itemId];
    if (subKind) {
      const spec = SUBSTANCES[subKind];
      const effect: SubstanceEffect = { kind: subKind, remaining: spec.duration, total: spec.duration };
      substanceRef.current = effect;
      setSubstance(effect);
      removeInventoryItem(itemId, 1);
      addToast(spec.name, spec.tagline);
      getAudio().blip();
      if (gameState) {
        const nextHp = Math.max(0, Math.min(gameState.player.maxHp, gameState.player.hp + spec.hpDelta));
        setGameState(prev => prev ? ({
          ...prev,
          player: { ...prev.player, hp: nextHp },
          flags: { ...prev.flags, used_a_substance: true },
        }) : prev);
      }
      return;
    }
    if (itemId === 'energy_drink') {
      setGameState(prev => {
        if (!prev) return prev;
        const inventory = [...prev.player.inventory];
        const idx = inventory.indexOf(itemId);
        if (idx >= 0) inventory.splice(idx, 1);
        return { ...prev, player: { ...prev.player, hp: prev.player.maxHp, inventory } };
      });
      addToast('Energy Drink', 'Health restored.');
      getAudio().pickup();
    }
  };

  /** Removes up to `count` copies of an item from the inventory. */
  const removeInventoryItem = (itemId: string, count = 1) => {
    setGameState(prev => {
      if (!prev) return prev;
      const inventory = [...prev.player.inventory];
      for (let n = 0; n < count; n++) {
        const idx = inventory.indexOf(itemId);
        if (idx >= 0) inventory.splice(idx, 1);
      }
      return { ...prev, player: { ...prev.player, inventory } };
    });
  };

  // ---- Shop -----------------------------------------------------------------

  const buyFromShop = (entry: ShopEntry) => {
    if (!gameState) return;
    const item = ITEMS[entry.itemId];
    if (!item) return;
    if ((gameState.player.gold || 0) < entry.price) {
      addToast('Not enough gold', `${item.name} costs ${entry.price} gold.`);
      getAudio().hurt();
      return;
    }
    if (item.id === 'energy_drink' && gameState.player.inventory.filter(i => i === 'energy_drink').length >= 5) {
      addToast('Stocked up', 'You are carrying enough drinks already.');
      return;
    }
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        player: {
          ...prev.player,
          gold: Math.max(0, (prev.player.gold || 0) - entry.price),
          inventory: [...prev.player.inventory, entry.itemId],
        },
      };
    });
    addToast('Purchased', `Bought ${item.name} for ${entry.price} gold.`);
    getAudio().pickup();
  };

  const buildSnapshot = (): GameState | null => {
    if (!gameState) return null;
    const engine = engineRef.current;
    return {
      ...gameState,
      saveVersion: SAVE_VERSION,
      player: {
        ...gameState.player,
        pos: engine ? engine.player.pos : gameState.player.pos,
        playtime: playtimeRef.current,
        equipped: equippedItemId,
      },
      // Manual saves must persist the living world too, not just autosave.
      worldSave: getWorld().save(),
    };
  };

  const manualSave = (slot: number) => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    const ok = StateManager.saveSlot(slot, snapshot);
    if (!ok) {
      addToast('Save failed', 'Browser storage is full or unavailable.');
      getAudio().hurt();
      return;
    }
    setSaveSlots(StateManager.slots());
    addToast('Game Saved', `Saved to slot ${slot + 1}.`);
    getAudio().blip();
  };

  const deleteSlot = (slot: number) => {
    StateManager.clearSlot(slot);
    setSaveSlots(StateManager.slots());
    addToast('Slot Cleared', `Slot ${slot + 1} is now empty.`);
  };

  const exportSave = () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return '';
    const text = StateManager.exportState(snapshot);
    // Best-effort copy to the clipboard for convenience.
    navigator.clipboard?.writeText(text).catch(() => {});
    addToast('Save Exported', 'Current run copied to the text box (and clipboard).');
    return text;
  };

  const importSave = (text: string) => {
    const imported = StateManager.importState(text);
    if (!imported) {
      addToast('Import failed', 'That is not a valid save.');
      return false;
    }
    loadState(imported);
    addToast('Save Imported', 'Loaded the pasted run.');
    return true;
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
    const unlockedCount = stats.unlockedAchievements.length;
    return (
      <div className="select-screen">
        <h1 className="select-title" style={{ color: 'var(--color-neon-orange)' }}>Game Over</h1>
        <h2 className="text-2xl text-neon-cyan">{ending.title}</h2>
        <p className="text-gray-400 max-w-lg text-center">{ending.description}</p>
        <div className="ending-stats">
          <div>Character: {stats.player.name}</div>
          <div>Playtime: {mins}m {secs}s</div>
          <div>Fragments: {stats.flags.fragments_collected || 0}/3</div>
          <div>Achievements: {unlockedCount}/{ACHIEVEMENTS.length}</div>
          <div>Quests completed: {stats.completedQuests.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="pause-button cyan"
            style={{ width: 'auto', padding: '14px 48px', fontSize: 20 }}
            onClick={() => window.location.reload()}
          >
            Play Again
          </button>
          <button
            className="pause-button purple"
            style={{ width: 'auto', padding: '14px 32px', fontSize: 20 }}
            onClick={() => setShowAchievements(true)}
          >
            Achievements
          </button>
        </div>
        {showAchievements && (
          <AchievementsPanel state={stats} onClose={() => setShowAchievements(false)} />
        )}
      </div>
    );
  }

  if (!gameState) {
    const slots = saveSlots;
    const hasSave = StateManager.hasAnySave();
    const originals = CHARACTERS.filter(c => c.group === 'Originals');
    const newBlood = CHARACTERS.filter(c => c.group === 'New Blood');
    const preview = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];
    const beginRun = () => startGame(preview.id);

    const renderCard = (char: PlayableChar) => (
      <button
        key={char.id}
        className={`char-tile ${char.id === selectedCharId ? 'selected' : ''}`}
        style={{ '--accent': char.color } as CSSProperties}
        onClick={() => {
          setSelectedCharId(char.id);
          getAudio().blip();
        }}
        onDoubleClick={() => startGame(char.id)}
      >
        <span className="char-tile-preview">
          <CharacterPreview name={char.id} color={char.color} appearance={char.appearance} size={64} />
        </span>
        <span className="char-tile-name">{char.name}</span>
      </button>
    );

    return (
      <div className="menu-screen">
        <div className="menu-header">
          <h1 className="menu-title">Narrow Arrow</h1>
          <p className="menu-tagline">The Game · an open-world crime sandbox in the Narrow Arrow universe</p>
        </div>

        <div className="menu-body">
          <div className="menu-roster">
            <div className="roster-group-label">Originals</div>
            <div className="roster-grid">{originals.map(renderCard)}</div>
            <div className="roster-group-label">New Blood</div>
            <div className="roster-grid">{newBlood.map(renderCard)}</div>
          </div>

          <aside className="menu-inspect" style={{ '--accent': preview.color } as CSSProperties}>
            <div className="inspect-portrait">
              <CharacterPreview name={preview.id} color={preview.color} appearance={preview.appearance} size={168} />
            </div>
            <div className="inspect-name">{preview.name}</div>
            <div className="inspect-role">{preview.role}</div>
            <p className="inspect-blurb">{preview.blurb}</p>

            {preview.id === 'custom' && (
              <input
                type="text"
                placeholder="Enter name..."
                className="inspect-name-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') beginRun(); }}
              />
            )}

            <button className="menu-play" onClick={beginRun}>Play as {preview.name}</button>
            <button className="menu-newgame" onClick={() => newGame(preview.id)}>
              New Game (clears saves)
            </button>
            <div className="menu-hint">Double-click any card to jump straight in</div>
          </aside>
        </div>

        {hasSave && (
          <div className="menu-continue">
            <div className="continue-label">Continue</div>
            <div className="continue-slots">
              {StateManager.loadAutosave() && (
                <button className="slot-button" onClick={() => loadState(StateManager.loadAutosave() as GameState)}>
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

        <div className="menu-footnote">
          Satire only. Every brand, substance and product in this game is invented for the joke.
        </div>
      </div>
    );
  }

  const mode = inputMode === 'touch' ? 'touch' : 'keyboard';

  return (
    <div className={`game-shell mode-${mode}`}>
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="mini-map-label text-neon-cyan">
        {insideName ? `${currentArea} · ${insideName}` : currentArea}
        {drivingName ? ` · driving ${drivingName}` : ''}
        {!insideName && worldRef.current ? ` · ${worldRef.current.night ? 'Night' : 'Day'}${worldRef.current.weather.weather !== 'clear' ? ` · ${worldRef.current.weather.weather}` : ''}` : ''}
      </div>
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

      {combat && bossFight && BOSS_BY_NPC[bossFight] && (
        <div className="boss-bar">
          <div className="boss-label">{BOSS_BY_NPC[bossFight].name}</div>
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

      {drivingName && (
        <div className="drive-hud">
          <div className="drive-speed">{carSpeed}<span className="drive-unit">km/h</span></div>
          <div className="drive-gear">{carVelRef.current < -1 ? 'R' : carSpeed < 1 ? 'N' : 'D'}</div>
        </div>
      )}

      {wantedLevel > 0 && (
        <div className="wanted-stars" title="Wanted level">
          {[0, 1, 2, 3, 4].map(i => (
            <span key={i} className={i < wantedLevel ? 'star on' : 'star'}>★</span>
          ))}
        </div>
      )}

      {substance && (
        <div className="substance-hud">
          <span className="substance-name">{SUBSTANCES[substance.kind].name}</span>
          <div className="substance-bar"><div style={{ width: `${(substance.remaining / substance.total) * 100}%` }} /></div>
        </div>
      )}

      {interactPrompt && <div className="interact-prompt">{interactPrompt}</div>}

      {radioOn && !insideName && RADIO_STATIONS[radioIdx % RADIO_STATIONS.length] && (
        <div className="radio-ticker">
          <span className="radio-dial">{RADIO_STATIONS[radioIdx % RADIO_STATIONS.length].name}</span>
          <span>{RADIO_STATIONS[radioIdx % RADIO_STATIONS.length].lines[radioLine % RADIO_STATIONS[radioIdx % RADIO_STATIONS.length].lines.length]}</span>
        </div>
      )}

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
            <div className="dialogue-text">{applyLanguageFilter(currentDialogue.text, strongLanguage)}</div>
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
                      {applyLanguageFilter(opt.text, strongLanguage)}
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

      {shop && (
        <div className="shop-panel">
          <h3 className="text-neon-cyan font-bold mb-1">{shop.name}</h3>
          <div className="text-xs text-gray-400 mb-2">Gold: <span className="text-neon-orange font-bold">{gameState?.player.gold || 0}</span></div>
          <ul className="text-sm">
            {shop.stock.map((entry, i) => {
              const item = ITEMS[entry.itemId];
              if (!item) return null;
              const afford = (gameState?.player.gold || 0) >= entry.price;
              return (
                <li key={i} className="inventory-item" onClick={() => buyFromShop(entry)} style={{ opacity: afford ? 1 : 0.5 }}>
                  <span className="inv-dot" style={{ background: item.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="text-white">{item.name}</div>
                    <div className="text-gray-500 text-xs">{item.description}</div>
                  </div>
                  <span className={afford ? 'text-neon-orange' : 'text-gray-600'}>{entry.price}g</span>
                </li>
              );
            })}
          </ul>
          <button className="shop-close" onClick={() => setShop(null)}>Leave (E)</button>
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
          <button className="pause-button gold" onClick={() => setShowSaveMenu(true)}>
            Save / Load Slots
          </button>
          {[0, 1, 2].slice(0, SLOT_COUNT).map(slot => (
            <button key={slot} className="pause-button gold" onClick={() => manualSave(slot)}>
              Quick Save → Slot {slot + 1}
            </button>
          ))}
          <button className="pause-button purple" onClick={() => setShowAchievements(true)}>
            Achievements ({gameState.unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </button>
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
            onClick={() => {
              if (window.confirm('Start a new game? This clears all save slots.')) {
                setShowSaveMenu(false);
                setIsPaused(false);
                newGame(gameState.player.characterType);
              }
            }}
          >
            New Game (clears saves)
          </button>
          <button
            className="pause-button grey"
            onClick={() => {
              const a = getAudio();
              const next = !a.muted;
              a.setMuted(next);
              addToast('Audio', next ? 'Muted.' : 'Unmuted.');
            }}
          >
            Audio: {getAudio().muted ? 'Muted' : 'On'}
          </button>
          <div className="volume-row">
            <span className="volume-label">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audioVolume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                const a = getAudio();
                a.setVolume(v);
                if (v > 0 && a.muted) a.setMuted(false);
                setAudioVolume(v);
              }}
            />
            <span className="volume-value">{Math.round(audioVolume * 100)}%</span>
          </div>
          <button
            className="pause-button grey"
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            className="pause-button purple"
            onClick={() => setStrongLanguage(v => !v)}
          >
            Strong Language: {strongLanguage ? 'On' : 'Bleeped'}
          </button>
          <button
            className="pause-button purple"
            onClick={() => setRadioOn(v => !v)}
          >
            Radio: {radioOn ? 'On' : 'Off'}
          </button>
        </div>
      )}

      {isPaused && showSaveMenu && (
        <SaveMenu
          slots={saveSlots}
          current={gameState}
          onSave={manualSave}
          onLoad={loadState}
          onDelete={deleteSlot}
          onExport={exportSave}
          onImport={importSave}
          onClose={() => setShowSaveMenu(false)}
        />
      )}

      {isPaused && showAchievements && (
        <AchievementsPanel state={gameState} onClose={() => setShowAchievements(false)} />
      )}

      {mode === 'keyboard' && (
        <div className="controls-hint">
          {drivingName
            ? 'W/S throttle · A/D steer · E exit car · ESC pause'
            : 'WASD move · E interact · Q quests · I inventory · ESC pause'}
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
