import { GameState, Quest, Achievement } from '../types';

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
  { id: 'all_endings', name: 'Completionist', description: 'Reach any of the four endings.' },
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
};

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

    if (state.flags.fragments_collected === 3) {
      complete('Collect Update Fragments');
      add('Bring Fragments to ESH');
    }

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
    unlock('all_endings', state.flags.game_ended === true);

    return newly;
  }

  static achievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id);
  }
}
