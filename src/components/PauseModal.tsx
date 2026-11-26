import React, { useState } from 'react';
import { Maximize2, Minimize2, Play, RotateCcw, Settings, Map, Home } from 'lucide-react';
import type { UiStrings } from '../game/data/i18n';

interface PauseModalProps {
  strings: UiStrings;
  isFullscreen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onConfirmChapterSelect: () => void;
  onReturnMenu: () => void;
  onToggleFullscreen: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  strings,
  isFullscreen,
  onResume,
  onRestart,
  onOpenSettings,
  onConfirmChapterSelect,
  onReturnMenu,
  onToggleFullscreen,
}) => {
  const [confirmingChapter, setConfirmingChapter] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="flux-panel rounded-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-3">
          <h2 className="text-xl font-display text-amber-100">{strings.pause}</h2>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            className="flux-btn w-9 h-9 rounded flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {confirmingChapter ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-amber-100/90 leading-relaxed">
              {strings.confirmChapterLeave}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmingChapter(false)}
                className="flux-btn py-2.5 rounded text-xs font-display"
              >
                {strings.confirmNo}
              </button>
              <button
                type="button"
                onClick={onConfirmChapterSelect}
                className="flux-btn-primary py-2.5 rounded text-xs font-display font-bold"
              >
                {strings.confirmYes}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flux-btn-primary py-2.5 px-4 rounded text-sm font-bold flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{strings.resume}</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="flux-btn py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{strings.restartStage}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="flux-btn py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{strings.settings}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmingChapter(true)}
              className="flux-btn py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2"
            >
              <Map className="w-3.5 h-3.5" />
              <span>{strings.chapterSelect}</span>
            </button>

            <button
              type="button"
              onClick={onReturnMenu}
              className="flux-btn py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{strings.returnMenu}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
