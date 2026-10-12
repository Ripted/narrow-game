import { useEffect, useRef, useState } from 'react';
import { Renderer } from './engine/renderer';
import { InputHandler } from './engine/input';
import { Camera } from './engine/camera';
import { Player } from './game/player';
import { NPCS } from './data/npcs';
import { WORLD_OBJECTS } from './world/objects';
import { LOCATIONS } from './data/locations';
import { DIALOGUE } from './data/characters';
import { DialogueNode, GameState, Vector2 } from './types';
import { StoryManager } from './game/story';
import { StateManager } from './game/state';

const CHARACTERS = [
  { id: 'penguin', name: 'Penguin1NA', color: '#00ffff' },
  { id: 'ripted', name: 'Ripted', color: '#ffd700' },
  { id: 'champy', name: 'Champy', color: '#bf00ff' },
  { id: 'polar', name: 'Polar', color: '#add8e6' },
  { id: 'custom', name: 'Custom', color: '#ffffff' }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [dialogueSpeaker, setDialogueSpeaker] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('Newcomer Spawn');
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);

  useEffect(() => {
    if (gameState) {
      const updatedQuests = StoryManager.checkQuests(gameState);
      if (updatedQuests.length !== gameState.activeQuests.length) {
        setGameState(prev => prev ? ({ ...prev, activeQuests: updatedQuests }) : null);
      }
      
      if (gameState.flags.all_arcs_resolved || gameState.flags.game_ended) {
        setEnding(StoryManager.getEnding(gameState));
      }
    }
  }, [gameState?.flags]);

  const [customName, setCustomName] = useState('');

  const engineRef = useRef<{
    renderer: Renderer;
    input: InputHandler;
    camera: Camera;
    player: Player;
  } | null>(null);

  const startGame = (charId: string) => {
    const char = CHARACTERS.find(c => c.id === charId)!;
    const name = charId === 'custom' ? (customName || 'Newcomer') : char.name;

    // The canvas only exists in the gameplay view, so the engine is created
    // lazily in the effect below, after the canvas has mounted.
    engineRef.current = null;

    setGameState({
      player: {
        name,
        characterType: charId,
        pos: { x: 100, y: 100 },
        inventory: []
      },
      flags: {},
      activeQuests: ['The Arrow_Ghost Mystery'],
      currentLocation: 'newcomer_spawn'
    });
  };

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

    let animationFrameId: number;
    const { renderer, input, camera, player } = engineRef.current;

    const loop = () => {
      if (!currentDialogue && !isPaused) {
        const movement = input.getMovement();
        player.update(movement);
        camera.update(player.pos);
        
        if (input.isPressed('q')) {
          setShowQuestLog(prev => !prev);
        }

        if (input.isPressed('escape')) {
          setIsPaused(true);
        }
      }

      // 2. Check Intersections
      let foundInteractable = false;
      const interactables = [...NPCS, ...WORLD_OBJECTS];
      
      for (const obj of interactables) {
        const dist = Math.sqrt(
          Math.pow(player.pos.x - obj.pos.x, 2) + 
          Math.pow(player.pos.y - obj.pos.y, 2)
        );
        
        if (dist < 80) {
          setInteractPrompt(`Press E to interact with ${obj.name}`);
          foundInteractable = true;
          
          if (input.isPressed('e') && !currentDialogue) {
            if (obj.type === 'npc') {
              const npc = obj as any;
              const dialogue = DIALOGUE[npc.dialogueId];
              if (dialogue) {
                setCurrentDialogue(dialogue[0]);
                setDialogueSpeaker(npc.name);
                
                // Set flags based on who we talk to
                if (npc.id === 'sam') {
                  setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, talked_to_sam: true } }) : null);
                }
              }
            } else {
              const worldObj = obj as any;
              setCurrentDialogue({
                id: 'obj_desc',
                text: worldObj.description || 'Nothing special.'
              });
              setDialogueSpeaker(worldObj.name);
              
              if (worldObj.id === 'kiwi_apology') {
                setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, read_kiwi_apology: true } }) : null);
              }

              if (worldObj.id.startsWith('update_fragment')) {
                setGameState(prev => {
                  if (!prev) return null;
                  const collected = (prev.flags.fragments_collected as number || 0) + 1;
                  const collectedIds = (prev.flags.collected_fragment_ids as string[] || []);
                  if (collectedIds.includes(worldObj.id)) return prev;
                  
                  return {
                    ...prev,
                    flags: {
                      ...prev.flags,
                      fragments_collected: collected,
                      collected_fragment_ids: [...collectedIds, worldObj.id]
                    }
                  };
                });
              }
            }
          }
          break;
        }
      }
      if (!foundInteractable) setInteractPrompt(null);

      // 3. Update Area
      for (const loc of Object.values(LOCATIONS)) {
        const b = loc.bounds;
        if (player.pos.x >= b.x && player.pos.x <= b.x + b.width &&
            player.pos.y >= b.y && player.pos.y <= b.y + b.height) {
          if (currentArea !== loc.name) {
            setCurrentArea(loc.name);
            if (loc.id === 'dev_room') {
              setGameState(prev => prev ? ({ ...prev, flags: { ...prev.flags, visited_dev_room: true } }) : null);
            }
          }
          break;
        }
      }

      // 4. Render
      renderer.clear();
      renderer.ctx.save();
      camera.apply(renderer.ctx);
      
      renderer.drawWorld(LOCATIONS, camera);
      
      WORLD_OBJECTS.forEach(obj => renderer.drawEntity(obj, camera));
      NPCS.forEach(npc => renderer.drawEntity(npc, camera));
      renderer.drawEntity(player, camera);
      
      renderer.ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, currentDialogue]);

  const handleDialogueOption = (nextNodeId: string) => {
    const dialogueSet = DIALOGUE[Object.keys(DIALOGUE).find(k => DIALOGUE[k].some(n => n.id === currentDialogue?.id)) || ''];
    const nextNode = dialogueSet?.find(n => n.id === nextNodeId);
    if (nextNode) {
      setCurrentDialogue(nextNode);
      if (nextNode.onComplete && gameState) {
        const newState = { ...gameState };
        nextNode.onComplete(newState);
        setGameState(newState);
      }
    } else {
      if (currentDialogue?.onComplete && gameState) {
        const newState = { ...gameState };
        currentDialogue.onComplete(newState);
        setGameState(newState);
      }
      setCurrentDialogue(null);
      setDialogueSpeaker(null);
    }
  };

  if (ending) {
    return (
      <div className="character-select">
        <h1 className="text-6xl font-bold mb-8 text-neon-orange uppercase tracking-widest">Game Over</h1>
        <h2 className="text-3xl text-neon-cyan mb-12">{ending}</h2>
        <button
          className="px-12 py-4 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all text-2xl"
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="character-select">
        <h1 className="text-4xl font-bold mb-8 text-neon-cyan uppercase tracking-widest">Narrow Arrow: The Game</h1>
        <p className="mb-8 text-gray-400">Select your character</p>
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
        {StateManager.load() && (
          <button
            className="mt-12 px-8 py-3 border-2 border-neon-gold text-neon-gold hover:bg-neon-gold hover:text-black transition-all text-xl"
            onClick={() => {
              const saved = StateManager.load();
              if (saved) {
                // The engine is re-created lazily from saved state once the
                // gameplay canvas mounts.
                engineRef.current = null;
                setGameState(saved);
              }
            }}
          >
            Load Saved Game
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      <div className="mini-map-label text-neon-cyan">
        {currentArea}
      </div>

      {interactPrompt && (
        <div className="interact-prompt">
          {interactPrompt}
        </div>
      )}

      {currentDialogue && (
        <div className="dialogue-box">
          <div className="portrait border-2 border-neon-cyan" style={{ background: NPCS.find(n => n.name === dialogueSpeaker)?.color || '#333' }} />
          <div className="dialogue-content">
            <div className="character-name text-neon-cyan">{dialogueSpeaker}</div>
            <div className="dialogue-text">{currentDialogue.text}</div>
            <div className="mt-4 flex gap-4">
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
            {gameState.activeQuests.map((q, i) => (
              <li key={i} className="mb-1">• {q}</li>
            ))}
          </ul>
        </div>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[300]">
          <h2 className="text-4xl font-bold text-neon-orange mb-8 uppercase tracking-widest">Paused</h2>
          <button
            className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all mb-4 w-64 text-xl"
            onClick={() => setIsPaused(false)}
          >
            Resume
          </button>
          <button
            className="px-8 py-3 border-2 border-neon-gold text-neon-gold hover:bg-neon-gold hover:text-black transition-all mb-4 w-64 text-xl"
            onClick={() => {
              if (gameState) {
                StateManager.save({ ...gameState, player: { ...gameState.player, pos: engineRef.current!.player.pos } });
                alert('Game Saved!');
              }
            }}
          >
            Save Game
          </button>
          <button
            className="px-8 py-3 border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white transition-all w-64 text-xl"
            onClick={() => window.location.reload()}
          >
            Quit to Menu
          </button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        WASD to move • E to interact • Q for Quests • ESC to Pause
      </div>
    </div>
  );
}
