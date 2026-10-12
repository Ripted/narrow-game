import { DialogueNode } from '../types';

export const DIALOGUE: Record<string, DialogueNode[]> = {
  ripted_main: [
    {
      id: 'ripted_1',
      text: '...',
      options: [
        { text: 'Hello, Ripted.', nextNodeId: 'ripted_2' },
        { text: 'Is the Narrow List okay?', nextNodeId: 'ripted_3' }
      ]
    },
    {
      id: 'ripted_2',
      text: 'lmao. welcome.'
    },
    {
      id: 'ripted_3',
      text: 'arrow ghost is a problem. talk to sam.'
    }
  ],
  champy_main: [
    {
      id: 'champy_1',
      text: 'bro i should be #1. ripted is just lucky.',
      options: [
        { text: 'You are #2 though.', nextNodeId: 'champy_2' },
        { text: 'Who is arrow_ghost?', nextNodeId: 'champy_3' },
        {
          text: 'You ARE arrow_ghost, Champy.',
          nextNodeId: 'champy_confront',
          condition: (state) => state.flags.read_kiwi_apology === true
        }
      ]
    },
    {
      id: 'champy_2',
      text: 'L. i deserve better.'
    },
    {
      id: 'champy_3',
      text: 'some hacker ngl. i could beat him easily if i tried.'
    },
    {
      id: 'champy_confront',
      text: '...what? no. NO. you have no proof.',
      options: [
        { text: 'The crying sprite gave it away.', nextNodeId: 'champy_confess' }
      ]
    },
    {
      id: 'champy_confess',
      text: 'fine. i wanted #1 so bad i made a second account. i am arrow_ghost. i am sorry.',
      onComplete: (state) => {
        state.flags.champy_exposed = true;
        state.flags.all_arcs_resolved = true;
        state.flags.game_ended = true;
        state.flags.champy_redeemed = true;
      }
    }
  ],
  sam_main: [
    {
      id: 'sam_1',
      text: 'hey. keeping the list clean is a full time job.',
      options: [
        { text: 'What is wrong with the list?', nextNodeId: 'sam_2' }
      ]
    },
    {
      id: 'sam_2',
      text: 'arrow_ghost appeared out of nowhere. check the meme archives for clues.'
    }
  ],
  kiwi_main: [
    {
      id: 'kiwi_1',
      text: 'COME TO POLAND OR ELSE.',
      options: [
        { text: 'Relax, Kiwi.', nextNodeId: 'kiwi_2' },
        {
          text: 'I will help you take over the server.',
          nextNodeId: 'kiwi_takeover',
          condition: (state) => state.flags.visited_dev_room === true
        }
      ]
    },
    {
      id: 'kiwi_2',
      text: 'L. i am the paprika king. my apology is on the board.'
    },
    {
      id: 'kiwi_takeover',
      text: 'FINALLY. a real one. poland rises tonight. the list is MINE.',
      onComplete: (state) => {
        state.flags.kiwi_took_over = true;
        state.flags.all_arcs_resolved = true;
        state.flags.game_ended = true;
      }
    }
  ],
  rimai_main: [
    {
      id: 'rimai_1',
      text: 'MY MAPS ARE PERFECT. WHY IS NOBODY PLAYING THEM??',
      options: [
        { text: 'They are a bit... chaotic.', nextNodeId: 'rimai_2' }
      ]
    },
    {
      id: 'rimai_2',
      text: 'SKILL ISSUE. LMAO.'
    }
  ],
  goosey_main: [
    {
      id: 'goosey_1',
      text: 'why are you looking at me? is this an attack?',
      options: [
        { text: 'Just saying hi.', nextNodeId: 'goosey_2' }
      ]
    },
    {
      id: 'goosey_2',
      text: 'L. leave the dead zone. it is for real ones only.'
    }
  ],
  esh_main: [
    {
      id: 'esh_1',
      text: '...',
      options: [
        { text: 'ESH?', nextNodeId: 'esh_2' },
        { text: 'I have the fragments.', nextNodeId: 'esh_3', condition: (state) => (state.flags.fragments_collected as number) === 3 }
      ]
    },
    {
      id: 'esh_2',
      text: 'soon.'
    },
    {
      id: 'esh_3',
      text: 'the update is ready. the game lives.',
      onComplete: (state) => {
        state.flags.all_arcs_resolved = true;
        state.flags.game_ended = true;
      }
    }
  ],
  hydo_main: [
    {
      id: 'hydo_1',
      text: 'welcome to the game. i am hydo. i am mid but i know the basics.',
      options: [
        { text: 'How do I move?', nextNodeId: 'hydo_2' },
        { text: 'Tell me about this world.', nextNodeId: 'hydo_3' }
      ]
    },
    {
      id: 'hydo_2',
      text: 'WASD to move. E to talk. Q for quests. I for inventory. dont be an L.'
    },
    {
      id: 'hydo_3',
      text: 'ten zones. everyone argues. arrow_ghost haunts the leaderboard. classic stuff.'
    }
  ],
  arrow_ghost_main: [
    {
      id: 'arrow_ghost_1',
      text: 'i am inevitable',
      options: [
        { text: 'Who are you?', nextNodeId: 'arrow_ghost_2' },
        { text: 'Fight me.', nextNodeId: 'arrow_ghost_fight' }
      ]
    },
    {
      id: 'arrow_ghost_2',
      text: 'i am the end of the game. or the beginning.'
    },
    {
      id: 'arrow_ghost_fight',
      text: 'finally. press E when close to strike. good luck.',
      onComplete: (state) => {
        state.flags.arrow_ghost_fight_started = true;
      }
    }
  ],
  xazikk_main: [
    {
      id: 'xazikk_1',
      text: 'zis baguette is too soft. mazyx knows nothing.',
    }
  ],
  mazyx_main: [
    {
      id: 'mazyx_1',
      text: 'non non non. xazikk is wrong as usual.',
    }
  ]
};
