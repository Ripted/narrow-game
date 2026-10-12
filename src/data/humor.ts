/**
 * Mature-humour content: in-world radio, advertising, graffiti and the
 * strong-language filter. Everything is satirical and aimed at the game's own
 * invented brands and characters — never at real people or groups.
 */

export interface RadioStation {
  id: string;
  name: string;
  /** Dial position, purely for flavour. */
  dial: string;
  /** DJ patter cycled while the station is on. */
  lines: string[];
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'arrow_fm',
    name: 'ARROW FM 101.5',
    dial: '101.5',
    lines: [
      '"That was three minutes of hard swearing, bleeped for your protection. You\'re welcome."',
      '"Traffic on the highway is moving like the update queue. That is to say, not."',
      '"Remember: if a cop is behind you, you are not stuck in traffic. You ARE traffic."',
      '"Coming up next: an ad for a product that definitely does not exist."',
    ],
  },
  {
    id: 'dead_zone_radio',
    name: 'DEAD ZONE RADIO',
    dial: '66.6',
    lines: [
      '"Welcome back to the zone. The zone is dead. We are legally required to say that."',
      '"Tonight\'s sponsor is Meme Dust: illegal in four districts, legal in this one."',
      '"If you can hear this, you are either lost or exactly where you should be."',
    ],
  },
  {
    id: 'docks_am',
    name: 'DOCKS AM',
    dial: '770',
    lines: [
      '"Fog advisory: the docks are still legally fog. Drive accordingly."',
      '"A reminder that petty crime is still crime. Grand crime is still an achievement."',
      '"Nectar: for the uptime you can taste."',
    ],
  },
];

/** Fake radio/board ads. The joke is the pitch, never anything explicit. */
export const AD_SLOGANS: string[] = [
  'ARROW ALE — "DRINK RESPONSIBLY. OR AT LEAST MEMORABLY."',
  'MEME DUST — "SEE THE WHOLE TIMELINE. REGRET THE WHOLE TIMELINE."',
  'SERVER NECTAR — "PURE UNCUT UPTIME."',
  'CHAMPY\'S RAGE QUIT HOTLINE — "ASK YOURSELF: ARE YOU #1 YET?"',
  'PAPRIKA PLUS — "SPICY ENOUGH TO START A DISTRICT."',
  'BIG RIMAI MAPS — "20000 SPIKES. ZERO MERCY."',
  'THE BORDELLO — "OPEN LATE. VERY LATE. FADE TO BLACK."',
  'KIWI\'S EMPIRE — "POLAND DELIVERS. PAPRIKA RULES."',
];

/** Graffiti and signage scattered around the world, satirical and rude. */
export const GRAFFITI: string[] = [
  '"RIPTED LEAKED HIS OWN IP AGAIN"',
  '"ARROW_GHAST WAS HERE"',
  '"CHAMPY = #2 FOREVER"',
  '"THE LIST IS A LIE"',
  '"FREE THE FRAGMENTS"',
  '"Z A H L E N"',
  '"DON\'T MENTION THE PAPRIKA"',
  '"WASD OR DIE"',
];

/**
 * Characters whose dialogue uses hard language. The runtime keeps the real word
 * in data and swaps in asterisks at draw time; the "Strong Language" setting
 * toggles whether the bleeped or the "as written" form is shown, exactly like a
 * TV bleep toggle. No slurs are ever included.
 */
export const STRONG_LANGUAGE: Record<string, string> = {
  'f***ing': 'fucking',
  'f***': 'fuck',
  's**t': 'shit',
  's**tty': 'shitty',
  'b******t': 'bullshit',
  'a**': 'ass',
  'a**hole': 'asshole',
  'd*mn': 'damn',
  'b***h': 'bitch',
  'p*ssed': 'pissed',
  'd**k': 'dick',
};

/** Applies the strong-language setting to a line of dialogue. */
export function applyLanguageFilter(text: string, allowStrong: boolean): string {
  if (allowStrong) {
    // Data stores the bleeped form; reveal the real word when allowed.
    let out = text;
    for (const [bleeped, real] of Object.entries(STRONG_LANGUAGE)) {
      out = out.split(bleeped).join(real);
    }
    return out;
  }
  return text;
}
