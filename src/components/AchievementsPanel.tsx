import { GameState, Achievement } from '../types';
import { ACHIEVEMENTS } from '../game/story';

interface Props {
  state: GameState;
  onClose: () => void;
}

/**
 * Full achievement list with unlocked/locked state, so the 23 tracked
 * achievements are browsable instead of only surfacing as toast popups.
 */
export function AchievementsPanel({ state, onClose }: Props) {
  const unlocked = new Set(state.unlockedAchievements || []);
  const count = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;

  return (
    <div className="overlay-panel achievements-panel">
      <div className="overlay-head">
        <h3 className="text-neon-gold font-bold">
          Achievements {count}/{ACHIEVEMENTS.length}
        </h3>
        <button className="overlay-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="overlay-bar">
        <div style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} />
      </div>
      <ul className="overlay-scroll achievements-list">
        {ACHIEVEMENTS.map((a: Achievement) => {
          const got = unlocked.has(a.id);
          return (
            <li key={a.id} className={`achievement-row ${got ? 'got' : 'locked'}`}>
              <span className="achievement-mark">{got ? '★' : '☆'}</span>
              <div>
                <div className="achievement-name">{a.name}</div>
                <div className="achievement-desc">{got ? a.description : 'Locked'}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
