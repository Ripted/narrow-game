import { GameState, Quest, Achievement, BossSpec } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', name: 'Newcomer No More', description: 'Talk to Hydo and learn the basics.' },
  { id: 'talked_to_sam', name: 'Clean List Duty', description: 'Hear Sam out about the leaderboard.' },
  { id: 'found_poop_plaque', name: '20000 Years of History', description: 'Find the poop video plaque.' },
  { id: 'read_20000_carving', name: 'Archaeologist', description: 'Read the floor carving.' },
  { id: 'leaked_the_ip', name: 'OpSec Failure', description: 'Locate Ripted\'s leaked IP graffiti.' },
  { id: 'zu_zahlen', name: 'Just 0.01', description: 'Discover the mysterious zahlen graffiti.' },
  { id: 'fragment_hunter', name: 'Fragment Hunter', description: 'Collect all three update fragments.' },
  { id: 'found_admin_key', name: 'Key Holder', description: 'Dig up the rusty key in the Dead Zone.' },
  { id: 'speedrunner', name: 'Speedrunner', description: 'Finish a lap of the speedrun track.' },
  { id: 'ghost_buster', name: 'Ghost Buster', description: 'Defeat arrow_ghost in combat.' },
  { id: 'polar_slain', name: 'Speedrun Denied', description: 'Defeat the Polar Shade in combat.' },
  { id: 'all_endings', name: 'Completionist', description: 'Reach any of the four endings.' },
  { id: 'interior_designer', name: 'Interior Designer', description: 'Step inside a building.' },
  { id: 'gatekeeper', name: 'Gatekeeper', description: 'Open the sealed gate in the Dead Zone.' },
  { id: 'night_owl', name: 'Night Owl', description: 'Be awake when the world turns to night.' },
  { id: 'well_rested', name: 'Well Rested', description: 'Rest at a campfire.' },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Open a chest.' },
  { id: 'wanted_man', name: 'Wanted Man', description: 'Reach a four-star wanted level.' },
  { id: 'roadkill', name: 'Roadkill', description: 'Flatten a hostile with a car.' },
  { id: 'sharp_tongue', name: 'Sharp Tongue', description: 'Hear a character swear. Loudly.' },
  { id: 'night_shift', name: 'Night Shift', description: 'Visit The Feather Bordello.' },
  { id: 'buzzed', name: 'Buzzed', description: 'Use a fictional intoxicant.' },
  { id: 'goose_chase', name: 'Wild Goose Chase', description: 'Follow the goose to the docks.' },
];

export const QUEST_DEFS: Record<string, Quest> = {
  'The Arrow_Ghost Mystery': {
    id: 'arrow_ghost',
    title: 'The Arrow_Ghost Mystery',
    description: 'Someone is haunting the Narrow List. Start by talking to Sam.',
    isCompleted: false,
  },
  'Investigate Meme Archives': {
    id: 'meme_archives',
    title: 'Investigate Meme Archives',
    description: 'Search the back alley for clues about arrow_ghost.',
    isCompleted: false,
  },
  'Talk to Kiwi about Poland': {
    id: 'kiwi',
    title: 'Talk to Kiwi about Poland',
    description: 'Kiwi left an apology. See what he actually wants.',
    isCompleted: false,
  },
  'Collect Update Fragments': {
    id: 'fragments',
    title: 'Collect Update Fragments',
    description: 'Gather three fragments to help ESH ship the update.',
    isCompleted: false,
  },
  'Bring Fragments to ESH': {
    id: 'bring_fragments',
    title: 'Bring Fragments to ESH',
    description: 'Deliver the fragments in the Dev Room.',
    isCompleted: false,
  },
  'Open the Sealed Gate': {
    id: 'sealed_gate',
    title: 'Open the Sealed Gate',
    description: 'A sealed gate blocks the east side of the Dead Zone. Find the old lever.',
    isCompleted: false,
  },
  'Warm Up at a Campfire': {
    id: 'campfire_rest',
    title: 'Warm Up at a Campfire',
    description: 'Find a campfire and rest to restore your health.',
    isCompleted: false,
  },
  'Step Inside a Building': {
    id: 'explore_interior',
    title: 'Step Inside a Building',
    description: 'Walk into a building door to see inside. Try the taverns and towers.',
    isCompleted: false,
  },
  'Track Down the Shrine Key': {
    id: 'shrine_key',
    title: 'Track Down the Shrine Key',
    description: 'The shrine gate is sealed. The rusty key is buried somewhere in the Dead Zone.',
    isCompleted: false,
  },
  'Shake Down the Scrapyard': {
    id: 'scrapyard',
    title: 'Shake Down the Scrapyard',
    description: 'A scrapyard in the Speedrun Zone "sells" cars. Buy something stolen.',
    isCompleted: false,
  },
  'A Night at The Feather': {
    id: 'bordello',
    title: 'A Night at The Feather',
    description: 'The bordello has a cover charge and a mystery. Step inside. Fade to black.',
    isCompleted: false,
  },
  'Follow the Goose': {
    id: 'goose',
    title: 'Follow the Goose',
    description: 'A goose at the docks owes someone money. Follow it and see where it waddles.',
    isCompleted: false,
  },
};

/**
 * Where each active quest points the player. Drawn on the minimap so objectives
 * route you across the world rather than leaving you to wander.
 */
export const QUEST_MARKERS: Record<string, { x: number; y: number; label: string }> = {
  'The Arrow_Ghost Mystery': { x: 2200, y: 300, label: 'Sam, Narrow List HQ' },
  'Investigate Meme Archives': { x: 1200, y: 2000, label: 'Meme Archives' },
  'Talk to Kiwi about Poland': { x: 400, y: 1200, label: 'Polish District' },
  'Collect Update Fragments': { x: 3100, y: 900, label: 'Dev Room' },
  'Bring Fragments to ESH': { x: 3100, y: 900, label: 'ESH, Dev Room' },
  'Open the Sealed Gate': { x: 2600, y: 2250, label: 'Old Lever, Dead Zone' },
  'Warm Up at a Campfire': { x: 480, y: 480, label: 'Campfire, Spawn' },
  'Step Inside a Building': { x: 300, y: 300, label: 'Nearest building' },
  'Track Down the Shrine Key': { x: 3250, y: 2150, label: 'Rusty Key, Dead Zone' },
  'Shake Down the Scrapyard': { x: 2150, y: 1250, label: 'Scrapyard, Speedrun Zone' },
  'A Night at The Feather': { x: 3450, y: 1450, label: 'The Feather Bordello' },
  'Follow the Goose': { x: 4300, y: 2300, label: 'The Goose, Docks' },
};

/**
 * Boss-style encounters. Each is a regular NPC in the world that only starts
 * fighting once its dialogue sets `startFlag`. The first is the story boss; the
 * second is an optional speedrun-zone challenge that grants its own reward.
 */
export const BOSSES: BossSpec[] = [
  {
    npcId: 'arrow_ghost',
    name: 'arrow_ghost',
    maxHp: 60,
    damage: 8,
    startFlag: 'arrow_ghost_fight_started',
    defeatedFlag: 'arrow_ghost_defeated',
    achievementId: 'ghost_buster',
    resolvesArcs: true,
  },
  {
    npcId: 'polar',
    name: 'The Polar Shade',
    maxHp: 90,
    damage: 10,
    startFlag: 'polar_fight_started',
    defeatedFlag: 'polar_defeated',
    achievementId: 'polar_slain',
    rewardItem: 'wrench',
    rewardGold: 150,
  },
];

export const BOSS_BY_NPC: Record<string, BossSpec> = Object.fromEntries(
  BOSSES.map((b) => [b.npcId, b]),
);

export class StoryManager {
  /**
   * Applies quest progression based on flags and returns the updated
   * active/completed quest titles.
   */
  static checkQuests(state: GameState): { active: string[]; completed: string[] } {
    const active = [...state.activeQuests];
    const completed = [...(state.completedQuests || [])];

    const add = (title: string) => {
      if (!active.includes(title) && !completed.includes(title)) active.push(title);
    };
    const complete = (title: string) => {
      const idx = active.indexOf(title);
      if (idx !== -1) active.splice(idx, 1);
      if (!completed.includes(title)) completed.push(title);
    };

    if (state.flags.talked_to_sam) add('Investigate Meme Archives');
    if (state.flags.read_kiwi_apology) add('Talk to Kiwi about Poland');
    if (state.flags.visited_dev_room) add('Collect Update Fragments');
    if (state.flags.entered_building) add('Step Inside a Building');
    if (state.flags.rested_at_campfire) add('Warm Up at a Campfire');
    if (state.flags.visited_dead_zone) add('Open the Sealed Gate');
    if (state.flags.visited_dev_room && !state.flags.found_admin_key) add('Track Down the Shrine Key');
    if (state.flags.visited_scrapyard) add('Shake Down the Scrapyard');
    if (state.flags.visited_bordello) add('A Night at The Feather');
    if (state.flags.met_goose) add('Follow the Goose');

    if (state.flags.fragments_collected === 3) {
      complete('Collect Update Fragments');
      add('Bring Fragments to ESH');
    }

    // Once the player is inside a building, that objective is done.
    if (state.flags.entered_building) complete('Step Inside a Building');
    if (state.flags.rested_at_campfire) complete('Warm Up at a Campfire');
    if (state.flags.gate_deadzone_open) complete('Open the Sealed Gate');
    if (state.flags.found_admin_key) complete('Track Down the Shrine Key');
    if (state.flags.used_a_substance) complete('Shake Down the Scrapyard');
    if (state.flags.bordello_visited) complete('A Night at The Feather');
    if (state.flags.goose_followed) complete('Follow the Goose');

    if (state.flags.all_arcs_resolved) {
      complete('Bring Fragments to ESH');
      complete('Investigate Meme Archives');
      complete('Talk to Kiwi about Poland');
    }

    return { active, completed };
  }

  static getEnding(state: GameState): { title: string; description: string } {
    if (state.flags.champy_exposed) {
      return {
        title: 'D - Champy Was Arrow_Ghost',
        description: 'You exposed the alt account. Champy logs off in disgrace, and the list is honest again.',
      };
    }
    if (state.flags.kiwi_took_over) {
      return {
        title: 'C - Kiwi Wins',
        description: 'Poland rises. Kiwi rules the Narrow List with an iron paprika.',
      };
    }
    if (state.flags.all_arcs_resolved) {
      return {
        title: 'A - The Game Lives',
        description: 'ESH ships the update. The server breathes again. That is why we arrow.',
      };
    }
    return {
      title: 'B - Glorious Death',
      description: 'The game fades to black. You died the way you lived: spectating.',
    };
  }

  /** Returns achievement ids newly unlocked by the current state. */
  static checkAchievements(state: GameState): string[] {
    const unlocked = new Set(state.unlockedAchievements || []);
    const newly: string[] = [];

    const unlock = (id: string, condition: boolean) => {
      if (condition && !unlocked.has(id)) {
        unlocked.add(id);
        newly.push(id);
      }
    };

    unlock('first_steps', state.flags.talked_to_hydo === true);
    unlock('talked_to_sam', state.flags.talked_to_sam === true);
    unlock('found_poop_plaque', state.flags.found_poop_plaque === true);
    unlock('read_20000_carving', state.flags.read_20000_carving === true);
    unlock('leaked_the_ip', state.flags.leaked_the_ip === true);
    unlock('zu_zahlen', state.flags.zu_zahlen === true);
    unlock('fragment_hunter', (state.flags.fragments_collected as number) === 3);
    unlock('found_admin_key', state.flags.found_admin_key === true);
    unlock('speedrunner', state.flags.completed_speedrun === true);
    unlock('ghost_buster', state.flags.arrow_ghost_defeated === true);
    unlock('polar_slain', state.flags.polar_defeated === true);
    unlock('all_endings', state.flags.game_ended === true);
    unlock('interior_designer', state.flags.entered_building === true);
    unlock('gatekeeper', state.flags.gate_deadzone_open === true);
    unlock('night_owl', state.flags.saw_night === true);
    unlock('well_rested', state.flags.rested_at_campfire === true);
    unlock('treasure_hunter', state.flags.opened_chest === true);
    unlock('wanted_man', ((state.flags.max_wanted_level as number) || 0) >= 4);
    unlock('roadkill', state.flags.did_roadkill === true);
    unlock('sharp_tongue', state.flags.heard_strong_language === true);
    unlock('night_shift', state.flags.bordello_visited === true);
    unlock('buzzed', state.flags.used_a_substance === true);
    unlock('goose_chase', state.flags.goose_followed === true);

    return newly;
  }

  static achievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id);
  }
}
