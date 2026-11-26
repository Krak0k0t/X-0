import React from 'react';
import { BookOpen, Maximize2, Minimize2, Settings, Wrench, Map } from 'lucide-react';
import type { AudioEngine } from '../game/audio/AudioEngine';
import { LANGUAGES, type UiStrings } from '../game/data/i18n';
import type { DifficultyLevel, GraphicsLevel, LanguageCode, SaveState } from '../game/types';
import { AudioMiniPlayer } from './AudioMiniPlayer';
import { TitleEmblem } from './TitleEmblem';

interface MainMenuProps {
  save: SaveState;
  strings: UiStrings;
  audio: AudioEngine;
  audioPlaying: boolean;
  audioTrackIndex: number;
  isFullscreen: boolean;
  onStartNewGame: () => void;
  onContinueGame: () => void;
  onOpenChapters: () => void;
  onOpenGarage: () => void;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
  onChangeDifficulty: (d: DifficultyLevel) => void;
  onChangeGraphics: (g: GraphicsLevel) => void;
  onChangeLanguage: (l: LanguageCode) => void;
  onToggleFullscreen: () => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  save,
  strings,
  audio,
  audioPlaying,
  audioTrackIndex,
  isFullscreen,
  onStartNewGame,
  onContinueGame,
  onOpenChapters,
  onOpenGarage,
  onOpenCodex,
  onOpenSettings,
  onChangeDifficulty,
  onChangeGraphics,
  onChangeLanguage,
  onToggleFullscreen,
  onTogglePlay,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
}) => {
  const hasProgress = save.completedChapters.length > 0 || save.currentStageNumber > 1;

  const difficulties: Array<{ id: DifficultyLevel; label: string; activeClass: string }> = [
    { id: 'story', label: strings.diffStory, activeClass: 'bg-teal-900/80 border-teal-400 text-teal-100' },
    { id: 'classic', label: strings.diffClassic, activeClass: 'bg-amber-900/80 border-amber-400 text-amber-100' },
    { id: 'apex', label: strings.diffApex, activeClass: 'bg-rose-900/80 border-rose-400 text-rose-100' },
  ];

  const graphicsLevels: GraphicsLevel[] = ['low', 'medium', 'high', 'ultra'];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-8">
      {/* Top utility row: Language, Audio Mini-Player, Fullscreen */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
        <div className="flex items-center gap-2">
          <label htmlFor="menu-lang-select" className="sr-only">
            {strings.language}
          </label>
          <select
            id="menu-lang-select"
            value={save.language}
            onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
            className="flux-panel-subtle rounded-md px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#0e121e] text-amber-100">
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flux-btn rounded-md px-2.5 sm:px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{strings.settings}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCodex}
            className="flux-btn rounded-md px-2.5 sm:px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{strings.codex}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 max-w-full">
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
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            title={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            className="flux-btn w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Left-third negative-space Title & Actions (leaves center-right 3D Dusk-9 showcase clear!) */}
      <div className="flex flex-col items-start gap-5 max-w-md pointer-events-auto my-auto">
        <TitleEmblem subtitle={strings.subtitle} />

        <div className="flux-panel rounded-lg p-5 w-full flex flex-col gap-3">
          {hasProgress ? (
            <button
              type="button"
              data-start="true"
              onClick={onContinueGame}
              className="flux-btn-primary w-full py-3 px-5 rounded-md text-base font-bold tracking-wider"
            >
              {strings.continueGame} · Stage {save.currentStageNumber}
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onStartNewGame}
              className="flux-btn-primary w-full py-3 px-5 rounded-md text-base font-bold tracking-wider"
            >
              {strings.newGame}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {hasProgress && (
              <button
                type="button"
                onClick={onStartNewGame}
                className="flux-btn py-2.5 px-3 rounded-md text-xs font-semibold col-span-2"
              >
                {strings.newGame}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenChapters}
              className="flux-btn py-2.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Map className="w-3.5 h-3.5" />
              <span>{strings.chapterSelect}</span>
            </button>
            <button
              type="button"
              onClick={onOpenGarage}
              className="flux-btn py-2.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{strings.garage}</span>
            </button>
          </div>

          {/* Difficulty Selector with smooth color transition */}
          <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-1.5">
            <span className="text-[11px] font-display tracking-wider text-amber-200/75">
              {strings.difficulty}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {difficulties.map((d) => {
                const active = save.difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChangeDifficulty(d.id)}
                    className={`py-1.5 px-1.5 rounded text-[11px] sm:text-xs font-display border transition-colors duration-300 leading-tight ${
                      active
                        ? d.activeClass
                        : 'bg-[#101420] border-amber-500/20 text-amber-100/65 hover:text-amber-100'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graphics Quality Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-display tracking-wider text-amber-200/75">
              {strings.graphics}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {graphicsLevels.map((lvl) => {
                const active = save.graphics === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeGraphics(lvl)}
                    className={`py-1.5 px-2 rounded text-xs font-display border transition-colors duration-200 uppercase ${
                      active
                        ? 'bg-amber-600/35 border-amber-400 text-amber-50'
                        : 'bg-[#101420] border-amber-500/20 text-amber-100/65 hover:text-amber-100'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom borderless inline control hint */}
      <div className="flex items-center justify-between text-xs text-amber-100/60 pointer-events-none">
        <span>{strings.controlHintLine}</span>
        <span className="tabular-nums hidden sm:inline">
          ◆ {save.fluxite} · {save.permanentTraits.length}/6
        </span>
      </div>
    </div>
  );
};
