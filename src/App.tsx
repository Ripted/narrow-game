import { useEffect, useRef, useState, useCallback } from 'react';
import { Renderer } from './engine/renderer';
import { InputHandler } from './engine/input';
import { Camera } from './engine/camera';
import { CollisionSystem, MAP_WIDTH, MAP_HEIGHT } from './engine/collision';
import { Player } from './game/player';
import { NPCS } from './data/npcs';
import { WORLD_OBJECTS } from './world/objects';
import { LOCATIONS, LOCATION_MINIMAP_COLORS } from './data/locations';
import { DIALOGUE } from './data/characters';
import { ITEMS, STARTING_ITEM } from './data/items';
import { DialogueNode, GameState, Vector2, Achievement } from './types';
import { StoryManager } from './game/story';
import { StateManager, SLOT_COUNT } from './game/state';
import { AudioManager } from './audio';

const CHARACTERS = [
  { id: 'penguin', name: 'Penguin1NA', color: '#00ffff' },
  { id: 'ripted', name: 'Ripted', color: '#ffd700' },
  { id: 'champy', name: 'Champy', color: '#bf00ff' },
  { id: 'polar', name: 'Polar', color: '#add8e6' },
  { id: 'custom', name: 'Custom', color: '#ffffff' }
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
  const [showTouch, setShowTouch] = useState(false);
  const [saveSlots, setSaveSlots] = useState(() => StateManager.slots());

  const audioRef = useRef<AudioManager | null>(null);
  const playtimeRef = useRef(0);
  const lastAutosaveRef = useRef(0);
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
    setEquippedItemId(STARTING_ITEM);
    setGameState(newGameState(name, charId));
    getAudio().blip();
  };

  const loadState = (saved: GameState) => {
    engineRef.current = null;
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

  // Detect touch devices so the on-screen controls are available.
  useEffect(() => {
    const coarse = typeof window !== 'undefined' && (
      'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches
    );
    setShowTouch(coarse);
  }, []);

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
      const player = new Player(gameState.player.name, char.color, gameState.player.pos);
      const canvas = canvasRef.current;
      engineRef.current = {
        renderer: new Renderer(canvas),
        input: new InputHandler(),
        camera: new Camera(canvas.width, canvas.height),
        player,
      };
    }

    const { renderer, input, camera, player } = engineRef.current;

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
      const sx = w / MAP_WIDTH;
      const sy = h / MAP_HEIGHT;
      Object.values(LOCATIONS).forEach((loc: any) => {
        const b = loc.bounds;
        ctx.fillStyle = LOCATION_MINIMAP_COLORS[loc.id] || '#444';
        ctx.fillRect(b.x * sx, b.y * sy, b.width * sx, b.height * sy);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(b.x * sx, b.y * sy, b.width * sx, b.height * sy);
      });
      // NPC markers
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      NPCS.forEach(npc => {
        ctx.fillRect(npc.pos.x * sx - 1, npc.pos.y * sy - 1, 3, 3);
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

      const paused = isPaused || !!ending;
      if (!currentDialogue && !paused) {
        if (dt > 0) playtimeRef.current += dt;
        const movement = input.getMovement();
        player.update(movement);
        camera.update(player.pos);

        if (movement.x !== 0 || movement.y !== 0) {
          if (Math.random() < 0.08) getAudio().step();
        }

        // One-shot actions (edge-triggered, not held-key reads).
        if (input.consumePressed('q') || input.consumeAction() === 'quests') {
          setShowQuestLog(v => !v);
        }
        if (input.consumePressed('i') || input.consumeAction() === 'inventory') {
          setShowInventory(v => !v);
        }
        if (input.consumePressed('escape')) {
          setIsPaused(true);
        }
      }

      // Interaction / combat resolution.
      const boss = NPCS.find(n => n.id === 'arrow_ghost');
      const interactables = [...NPCS, ...WORLD_OBJECTS];
      let nearest: any = null;
      let nearestDist = Infinity;
      for (const obj of interactables) {
        const dist = Math.hypot(player.pos.x - obj.pos.x, player.pos.y - obj.pos.y);
        if (dist < INTERACT_RADIUS && dist < nearestDist) {
          nearestDist = dist;
          nearest = obj;
        }
      }

      const wantInteract = input.consumePressed('e') || input.consumeAction() === 'interact';
      const fighting = gameState.flags.arrow_ghost_fight_started === true &&
        gameState.flags.arrow_ghost_defeated !== true;

      if (nearest) {
        setInteractPrompt(
          nearest.id === 'arrow_ghost' && fighting
            ? 'Press E to ATTACK'
            : `Press E to interact with ${nearest.name}`
        );
      } else {
        setInteractPrompt(null);
      }

      if (wantInteract && !currentDialogue) {
        // Combat branch: strike the boss when the fight has begun.
        if (fighting && nearest && nearest.id === 'arrow_ghost') {
          strikeBoss();
        } else if (nearest) {
          applyInteract(nearest);
        }
      }

      // Boss retaliation.
      if (fighting && !paused && boss) {
        const dist = Math.hypot(player.pos.x - boss.pos.x, player.pos.y - boss.pos.y);
        if (dist < INTERACT_RADIUS + 20 && now - bossHitCooldownRef.current > 1200) {
          bossHitCooldownRef.current = now;
          getAudio().hurt();
          setGameState(prev => {
            if (!prev) return null;
            const hp = Math.max(0, prev.player.hp - 8);
            if (hp <= 0) {
              return {
                ...prev,
                player: { ...prev.player, hp: 0 },
                flags: { ...prev.flags, game_ended: true },
              };
            }
            return { ...prev, player: { ...prev.player, hp } };
          });
        }
      }

      // Area tracking + autosave / zone audio.
      const locId = CollisionSystem.locationAt(player.pos);
      if (locId) {
        const loc: any = Object.values(LOCATIONS).find((l: any) => l.id === locId);
        if (loc && loc.name !== currentArea) {
          setCurrentArea(loc.name);
        }
        if (locId !== lastZoneRef.current) {
          lastZoneRef.current = locId;
          getAudio().setZone(locId);
          if (locId === 'dev_room') {
            setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, visited_dev_room: true }, currentLocation: 'dev_room' }) : null);
          }
          // Autosave on area change.
          autosave(player.pos);
        }
      }

      if (now - lastAutosaveRef.current > 30000) {
        lastAutosaveRef.current = now;
        autosave(player.pos);
      }

      // Speedrun lap timing.
      if (speedrunStartRef.current !== null) {
        const elapsed = now - speedrunStartRef.current;
        setSpeedrun(prev => (prev.active ? { ...prev, elapsed } : prev));
      }

      // Render.
      renderer.clear();
      renderer.ctx.save();
      camera.apply(renderer.ctx);
      renderer.drawWorld(LOCATIONS, camera);
      WORLD_OBJECTS.forEach(obj => renderer.drawEntity(obj, camera));
      NPCS.forEach(npc => {
        const isBoss = npc.id === 'arrow_ghost';
        renderer.drawEntity(
          npc,
          camera,
          isBoss && fighting ? { hp: combat?.hp ?? 60, maxHp: combat?.maxHp ?? 60 } : undefined
        );
      });
      renderer.drawEntity(player, camera);
      renderer.ctx.restore();

      drawMinimap(camera);

      animationFrameId = requestAnimationFrame(loop);
    };

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

    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
    };
  }, [gameState?.player.characterType, currentDialogue, isPaused, ending, equippedItemId, combat?.hp]);

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
      <div className="character-select">
        <h1 className="text-5xl font-bold mb-4 text-neon-orange uppercase tracking-widest">Game Over</h1>
        <h2 className="text-2xl text-neon-cyan mb-3">{ending.title}</h2>
        <p className="text-gray-400 max-w-lg text-center mb-8">{ending.description}</p>
        <div className="ending-stats">
          <div>Character: {stats.player.name}</div>
          <div>Playtime: {mins}m {secs}s</div>
          <div>Fragments: {stats.flags.fragments_collected || 0}/3</div>
          <div>Achievements: {stats.unlockedAchievements.length}/11</div>
          <div>Quests completed: {stats.completedQuests.length}</div>
        </div>
        <button
          className="mt-8 px-12 py-4 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all text-2xl"
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
      <div className="character-select">
        <h1 className="text-4xl font-bold mb-4 text-neon-cyan uppercase tracking-widest">Narrow Arrow: The Game</h1>
        <p className="mb-6 text-gray-400">Select your character</p>
        <div className="flex flex-wrap justify-center max-w-4xl">
          {CHARACTERS.map(char => (
            <div key={char.id} className="flex flex-col items-center">
              <button
                className="char-option"
                style={{ color: char.color }}
                onClick={() => startGame(char.id)}
              >
                {char.name}
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
          <div className="save-slots mt-8">
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

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />

      <div className="mini-map-label text-neon-cyan">{currentArea}</div>
      <canvas ref={minimapRef} className="minimap" width={170} height={120} />

      <div className="hud-stats">
        <div>HP {Math.round((gameState.player.hp / gameState.player.maxHp) * 100)}%</div>
        <div className="hud-hp-bar">
          <div style={{ width: `${(gameState.player.hp / gameState.player.maxHp) * 100}%` }} />
        </div>
        {equippedItemId && ITEMS[equippedItemId] && (
          <div>Wpn: {ITEMS[equippedItemId].name}</div>
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
                      className="px-4 py-2 border border-neon-orange hover:bg-neon-orange hover:text-black transition-colors"
                      onClick={() => handleDialogueOption(opt.nextNodeId)}
                    >
                      {opt.text}
                    </button>
                  ))
              ) : (
                <button
                  className="px-4 py-2 border border-neon-cyan hover:bg-neon-cyan hover:text-black transition-colors"
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

      {showTouch && (
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

      <div className="controls-hint">
        WASD move · E interact · Q quests · I inventory · ESC pause
      </div>
      <span className="hidden-tick" data-tick={hudTick} />
    </div>
  );
}
