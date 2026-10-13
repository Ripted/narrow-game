import { useState } from 'react';
import { GameState } from '../types';
import { SaveSlot, formatPlaytime, formatSavedAt } from '../game/state';

interface Props {
  slots: SaveSlot[];
  current: GameState;
  onSave: (index: number) => void;
  onLoad: (state: GameState) => void;
  onDelete: (index: number) => void;
  onExport: () => string;
  onImport: (text: string) => boolean;
  onClose: () => void;
}

/**
 * Save-slot manager: overwrite with confirmation, load, delete, and
 * export/import the current run as JSON for backup or sharing.
 */
export function SaveMenu({ slots, current, onSave, onLoad, onDelete, onExport, onImport, onClose }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null);
  const [ioText, setIoText] = useState('');
  const [ioError, setIoError] = useState<string | null>(null);

  const runExport = () => {
    setIoText(onExport());
    setIoError(null);
  };

  const runImport = () => {
    if (!ioText.trim()) {
      setIoError('Paste a save string first.');
      return;
    }
    if (!onImport(ioText)) {
      setIoError('That is not a valid save.');
      return;
    }
    setIoError(null);
  };

  return (
    <div className="overlay-panel save-panel">
      <div className="overlay-head">
        <h3 className="text-neon-gold font-bold">Save Slots</h3>
        <button className="overlay-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="overlay-scroll">
        {slots.map((slot) => (
          <div key={slot.index} className={`slot-row ${slot.state ? '' : 'empty'}`}>
            <div className="slot-info">
              <div className="slot-title">
                Slot {slot.index + 1}{slot.state ? ` · ${slot.state.player.name}` : ' · Empty'}
              </div>
              {slot.state ? (
                <div className="slot-meta">
                  {slot.state.currentLocation} · {formatPlaytime(slot.playtime)} · {slot.gold}g
                  {slot.savedAt ? ` · ${formatSavedAt(slot.savedAt)}` : ''}
                </div>
              ) : (
                <div className="slot-meta">No data</div>
              )}
            </div>
            <div className="slot-actions">
              {confirming === slot.index ? (
                <>
                  <button className="mini-button danger" onClick={() => { onSave(slot.index); setConfirming(null); }}>
                    Overwrite
                  </button>
                  <button className="mini-button" onClick={() => setConfirming(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button
                    className="mini-button"
                    onClick={() => (slot.state ? setConfirming(slot.index) : onSave(slot.index))}
                  >
                    Save
                  </button>
                  <button
                    className="mini-button"
                    disabled={!slot.state}
                    onClick={() => slot.state && onLoad(slot.state)}
                  >
                    Load
                  </button>
                  <button
                    className="mini-button danger"
                    disabled={!slot.state}
                    onClick={() => { onDelete(slot.index); setConfirming(null); }}
                  >
                    Del
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="io-block">
          <div className="io-label">Export / Import (JSON)</div>
          <textarea
            className="io-text"
            value={ioText}
            placeholder="Export writes the current run here. Paste a save string and press Import."
            onChange={(e) => { setIoText(e.target.value); setIoError(null); }}
            spellCheck={false}
          />
          {ioError && <div className="io-error">{ioError}</div>}
          <div className="io-actions">
            <button className="mini-button" onClick={runExport}>Export current</button>
            <button className="mini-button" onClick={runImport}>Import</button>
            <button className="mini-button" onClick={() => { setIoText(''); setIoError(null); }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="save-panel-foot">
        Current run: {current.player.name} · {formatPlaytime(current.player.playtime)} · {current.player.gold}g
      </div>
    </div>
  );
}
