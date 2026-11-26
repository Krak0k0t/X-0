import React from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { MUSIC_TRACKS, type AudioEngine } from '../game/audio/AudioEngine';
import type { UiStrings } from '../game/data/i18n';

interface AudioMiniPlayerProps {
  audio: AudioEngine;
  isPlaying: boolean;
  trackIndex: number;
  volume: number;
  muted: boolean;
  strings: UiStrings;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
}

export const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({
  isPlaying,
  trackIndex,
  volume,
  muted,
  strings,
  onTogglePlay,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
}) => {
  const track = MUSIC_TRACKS[trackIndex % MUSIC_TRACKS.length];

  return (
    <div className="flux-panel-subtle rounded-md px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2.5 text-xs max-w-full">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? strings.pause : strings.play}
        title={isPlaying ? strings.pause : strings.play}
        className="flux-btn w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button
        type="button"
        onClick={onNextTrack}
        aria-label={strings.nextTrack}
        title={strings.nextTrack}
        className="flux-btn w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center shrink-0"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      <div className="min-w-0 max-w-[92px] sm:max-w-[140px] truncate text-amber-100/90 font-display text-[10px] sm:text-[11px] tracking-wide">
        {track.title}
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="text-amber-200/80 hover:text-amber-100 p-1 shrink-0"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={muted ? 0 : volume}
        aria-label={strings.volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-12 sm:w-20 accent-amber-400 shrink-0"
      />
    </div>
  );
};
