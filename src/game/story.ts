import { GameState } from '../types';

export class StoryManager {
  static checkQuests(state: GameState): string[] {
    const quests = [...state.activeQuests];
    
    // Arc 1: Arrow_Ghost
    if (state.flags.talked_to_sam && !quests.includes('Investigate Meme Archives')) {
      quests.push('Investigate Meme Archives');
    }

    // Arc 2: Kiwi Crisis
    if (state.flags.read_kiwi_apology && !quests.includes('Talk to Kiwi about Poland')) {
      quests.push('Talk to Kiwi about Poland');
    }

    // Arc 3: Save ESH
    if (state.flags.visited_dev_room && !quests.includes('Collect Update Fragments')) {
      quests.push('Collect Update Fragments');
    }

    if (state.flags.fragments_collected === 3 && !quests.includes('Bring Fragments to ESH')) {
      quests.push('Bring Fragments to ESH');
    }

    return quests;
  }

  static getEnding(state: GameState): string {
    if (state.flags.all_arcs_resolved) return 'A - The Game Lives';
    if (state.flags.kiwi_took_over) return 'C - Kiwi Wins';
    if (state.flags.champy_exposed) return 'D - Champy Was Arrow_Ghost';
    return 'B - Glorious Death';
  }
}
