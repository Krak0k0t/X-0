import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, X } from 'lucide-react';
import type { AudioEngine } from '../game/audio/AudioEngine';
import { LANGUAGES, type UiStrings } from '../game/data/i18n';
import { DEFAULT_BINDINGS } from '../game/rules';
import type {
  ControlBindings,
  DifficultyLevel,
  GraphicsLevel,
  LanguageCode,
  RebindableAction,
  SaveState,
} from '../game/types';
import { AudioMiniPlayer } from './AudioMiniPlayer';

interface SettingsModalProps {
  save: SaveState;
  strings: UiStrings;
  audio: AudioEngine;
  audioPlaying: boolean;
  audioTrackIndex: number;
  isFullscreen: boolean;
  onChangeGraphics: (g: GraphicsLevel) => void;
  onChangeDifficulty: (d: DifficultyLevel) => void;
  onChangeLanguage: (l: LanguageCode) => void;
  onUpdateBindings: (b: ControlBindings) => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  save,
  strings,
  audio,
  audioPlaying,
  audioTrackIndex,
  isFullscreen,
  onChangeGraphics,
  onChangeDifficulty,
  onChangeLanguage,
  onUpdateBindings,
  onTogglePlay,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onClose,
}) => {
  const [capturing, setCapturing] = useState<RebindableAction | null>(null);

  useEffect(() => {
    if (!capturing) return;

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdateBindings({ ...save.bindings, [capturing]: e.code });
      setCapturing(null);
    };

    const handleMouse = (e: MouseEvent) => {
      // Allow LMB (0) only if clicking outside? Better: capture Right/Middle/Aux mouse buttons cleanly
      if (e.button === 0) return;
      e.preventDefault();
      e.stopPropagation();
      onUpdateBindings({ ...save.bindings, [capturing]: `Mouse${e.button}` });
      setCapturing(null);
    };

    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('mousedown', handleMouse, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('mousedown', handleMouse, true);
    };
  }, [capturing, save.bindings, onUpdateBindings]);

  const actions: Array<{ key: RebindableAction; label: string }> = [
    { key: 'throttle', label: 'Throttle' },
    { key: 'brake', label: 'Brake / Reverse' },
    { key: 'steerLeft', label: 'Steer Left' },
    { key: 'steerRight', label: 'Steer Right' },
    { key: 'drift', label: strings.drift },
    { key: 'hop', label: strings.hop },
    { key: 'ability', label: strings.fluxSurge },
    { key: 'resetCamera', label: strings.resetCamera },
    { key: 'pause', label: strings.pause },
  ];

  const formatCode = (code: string) => {
    if (code === 'Mouse2') return 'Right Click';
    if (code === 'Mouse1') return 'Middle Click';
    return code.replace('Key', '').replace('Arrow', '');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
      <div className="flux-panel rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/25">
          <h2 className="text-xl font-display text-amber-100">{strings.settings}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
              className="flux-btn w-9 h-9 rounded flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.close}
              className="flux-btn w-9 h-9 rounded flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flux-scroll p-6 space-y-6">
          {/* Language & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="settings-lang" className="text-xs font-display text-amber-200/80">
                {strings.language}
              </label>
              <select
                id="settings-lang"
                value={save.language}
                onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
                className="w-full flux-panel-subtle rounded px-3 py-2 text-sm text-amber-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0e121e] text-amber-100">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-display text-amber-200/80">{strings.difficulty}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['story', 'classic', 'apex'] as DifficultyLevel[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChangeDifficulty(d)}
                    className={`py-2 px-2 rounded text-xs font-display border capitalize transition-colors ${
                      save.difficulty === d
                        ? 'bg-amber-700/50 border-amber-400 text-amber-50'
                        : 'bg-[#101420] border-amber-500/20 text-amber-100/65'
                    }`}
                  >
                    {d === 'story' ? strings.diffStory : d === 'classic' ? strings.diffClassic : strings.diffApex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-1.5">
            <span className="text-xs font-display text-amber-200/80">{strings.graphics}</span>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'ultra'] as GraphicsLevel[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChangeGraphics(g)}
                  className={`py-2 px-3 rounded text-xs font-display uppercase border transition-colors ${
                    save.graphics === g
                      ? 'bg-teal-900/60 border-teal-400 text-teal-100'
                      : 'bg-[#101420] border-amber-500/20 text-amber-100/65'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Player */}
          <div className="space-y-2">
            <span className="text-xs font-display text-amber-200/80">{strings.audio}</span>
            <AudioMiniPlayer
              audio={audio}
              isPlaying={audioPlaying}
              trackIndex={audioTrackIndex}
              volume={save.audioVolume}
              muted={save.audioMuted}
              strings={strings}
              onTogglePlay={onTogglePlay}
              onNextTrack={onNextTrack}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
            />
          </div>

          {/* Key & Mouse Rebinding */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-display text-amber-200/80">{strings.controls}</div>
                <div className="text-[11px] text-amber-100/55">{strings.rebindHint}</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateBindings({ ...DEFAULT_BINDINGS })}
                className="flux-btn px-2.5 py-1.5 rounded text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{strings.resetDefaults}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((act) => {
                const isListening = capturing === act.key;
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => setCapturing(act.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                      isListening
                        ? 'bg-teal-900/50 border-teal-300 text-teal-100'
                        : 'bg-[#121725] border-amber-500/20 text-amber-100 hover:border-amber-400/50'
                    }`}
                  >
                    <span>{act.label}</span>
                    <span className="font-display font-bold text-amber-300">
                      {isListening ? 'Press Key / RMB...' : formatCode(save.bindings[act.key])}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
