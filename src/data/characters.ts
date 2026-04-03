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
        { text: 'Who is arrow_ghost?', nextNodeId: 'champy_3' }
      ]
    },
    {
      id: 'champy_2',
      text: 'L. i deserve better.'
    },
    {
      id: 'champy_3',
      text: 'some hacker ngl. i could beat him easily if i tried.'
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
        { text: 'Relax, Kiwi.', nextNodeId: 'kiwi_2' }
      ]
    },
    {
      id: 'kiwi_2',
      text: 'L. i am the paprika king. my apology is on the board.'
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
        { text: 'How do I move?', nextNodeId: 'hydo_2' }
      ]
    },
    {
      id: 'hydo_2',
      text: 'WASD to move. E to talk. dont be an L.'
    }
  ],
  arrow_ghost_main: [
    {
      id: 'arrow_ghost_1',
      text: 'i am inevitable',
      options: [
        { text: 'Who are you?', nextNodeId: 'arrow_ghost_2' }
      ]
    },
    {
      id: 'arrow_ghost_2',
      text: 'i am the end of the game. or the beginning.',
      onComplete: (state) => {
        state.flags.game_ended = true;
        state.flags.all_arcs_resolved = true;
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
