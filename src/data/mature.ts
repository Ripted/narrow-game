import { ContentAdvisory } from '../types';

/**
 * The in-universe content advisory, styled after a real age-rating card. Every
 * descriptor below maps to a system that actually runs in the game; the wording
 * stays satirical and the content itself stays stylised (no explicit imagery).
 */
export const CONTENT_ADVISORY: ContentAdvisory = {
  rating: 'M — MATURE 17+',
  summary:
    'Narrow Arrow: The Game is a satirical open-world crime sandbox set in the ' +
    'Narrow Arrow universe. It includes stylised violence, on-screen crime with a ' +
    'wanted system, crude humour, implied nudity, strong language, suggestive ' +
    'content and the use of fictional intoxicants. This is a parody; all products, ' +
    'people and substances are invented for the joke.',
  descriptors: [
    {
      tag: 'violence',
      label: 'Violence',
      blurb: 'Melee brawls, road rage and a five-star police chase across the map.',
    },
    {
      tag: 'blood_gore',
      label: 'Blood and Gore',
      blurb: 'Stylised, pixel-scale splatters and skid smears. No realism, no close-ups.',
    },
    {
      tag: 'crime',
      label: 'Crime',
      blurb: 'Grand theft auto, brawling, vandalism, resisting arrest and dumpster diving.',
    },
    {
      tag: 'humor',
      label: 'Mature Humor',
      blurb: 'Crude in-universe ads, DJ patter, graffitied statues and toilet signage.',
    },
    {
      tag: 'nudity',
      label: 'Nudity',
      blurb: 'Topless statues and a tasteful mosaic over the tavern mural. Italics implied.',
    },
    {
      tag: 'language',
      label: 'Strong Language',
      blurb: 'Hard-swearing characters, bleeped. A settings toggle restores the bleeps.',
    },
    {
      tag: 'sexual',
      label: 'Strong Sexual Content',
      blurb: 'The Bordello quest line, all innuendo and fade-to-black. Nothing is shown.',
    },
    {
      tag: 'substances',
      label: 'Use of Drugs and Alcohol',
      blurb: 'Ale, "Dust" and Nectar — fictional intoxicants with wobbly status effects.',
    },
  ],
};

/** Shown once, before the world loads, so the player opts in knowingly. */
export const ADVISORY_ACCEPT_KEY = 'narrow_arrow_advisory_ok';
