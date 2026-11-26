import React from 'react';
import { Lock, CheckCircle2, Play, Award, Maximize2, Minimize2, X } from 'lucide-react';
import { CAMPAIGN_STAGES } from '../game/data/campaign';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { getPlanetaryLegMeta, isPointToPointStage } from '../game/data/planetaryRoutes';
import type { SaveState } from '../game/types';
import { PlanetaryRouteMap } from './PlanetaryRouteMap';

interface ChapterSelectModalProps {
  save: SaveState;
  strings: UiStrings;
  isFullscreen: boolean;
  onSelectChapter: (stageId: string) => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  save,
  strings,
  isFullscreen,
  onSelectChapter,
  onClose,
  onToggleFullscreen,
}) => {
  const acts: Array<{ act: 1 | 2 | 3; label: string }> = [
    { act: 1, label: strings.act1 },
    { act: 2, label: strings.act2 },
    { act: 3, label: strings.act3 },
  ];

  const freeUnlocked = save.unlockedChapters.includes('free_season');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="flux-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/25">
          <div>
            <h2 className="text-xl font-display text-amber-100 tracking-wide">
              {strings.chapterSelect}
            </h2>
            <p className="text-xs text-amber-200/65 mt-0.5 tabular-nums">
              {save.completedChapters.length} / 15 · ◆ {save.fluxite} · {strings.reputation}: {save.reputation}/100
            </p>
          </div>
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

        {/* Body */}
        <div className="flux-scroll p-6 space-y-6">
          <PlanetaryRouteMap
            language={save.language}
            unlockedChapters={save.unlockedChapters}
            completedChapters={save.completedChapters}
            activeStageNumber={save.currentStageNumber}
          />

          {acts.map((actGroup) => {
            const stages = CAMPAIGN_STAGES.filter((s) => s.act === actGroup.act);
            return (
              <section key={actGroup.act} className="space-y-3">
                <h3 className="text-sm font-display text-amber-300 tracking-wider border-b border-amber-500/15 pb-1.5">
                  {actGroup.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stages.map((st) => {
                    const isUnlocked = save.unlockedChapters.includes(st.id);
                    const isCompleted = save.completedChapters.includes(st.id);
                    const hasArtifact = st.artifactId && save.artifacts.includes(st.artifactId);
                    const p2p = isPointToPointStage(st.id, st.stageNumber);
                    const legMeta = getPlanetaryLegMeta(st.stageNumber, st.biome);

                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => onSelectChapter(st.id)}
                        className={`text-left rounded-md p-3.5 border transition-all flex flex-col justify-between gap-2 ${
                          isUnlocked
                            ? 'bg-[#141928] border-amber-500/35 hover:border-amber-300 hover:bg-[#1a2034]'
                            : 'bg-[#0c0f18] border-slate-700/40 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-display text-amber-400/90 tabular-nums">
                            {String(st.stageNumber).padStart(2, '0')} · {p2p ? strings.routePointToPoint : strings.routeQualifier}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                          ) : isUnlocked ? (
                            <Play className="w-4 h-4 text-amber-300 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-display text-amber-50 leading-snug">
                            {isUnlocked
                              ? pickLoc(save.language, st.titleEn, st.titleRu)
                              : `${strings.locked} · Stage ${st.stageNumber}`}
                          </div>
                          {isUnlocked ? (
                            <div className="text-[11px] text-amber-100/60 mt-1 tabular-nums">
                              {p2p ? `${legMeta.distanceKm} km · 3 ${strings.segment}` : `${st.laps} Laps`} · ×{st.intensity.toFixed(1)} · ◆ {st.baseReward}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 mt-1">
                              {strings.locked}
                            </div>
                          )}
                        </div>

                        {hasArtifact && st.artifactNameEn && (
                          <div className="pt-1.5 border-t border-amber-500/15 flex items-center gap-1.5 text-[11px] text-teal-300/90">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {pickLoc(save.language, st.artifactNameEn, st.artifactNameRu ?? st.artifactNameEn)}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Free Season Unlockable */}
          <section className="space-y-3 pt-2 border-t border-amber-500/20">
            <h3 className="text-sm font-display text-teal-300 tracking-wider">
              {strings.freeSeason}
            </h3>
            <button
              type="button"
              disabled={!freeUnlocked}
              onClick={() => onSelectChapter('free_season')}
              className={`w-full text-left rounded-md p-4 border flex items-center justify-between ${
                freeUnlocked
                  ? 'bg-[#111e24] border-teal-400/50 hover:border-teal-300'
                  : 'bg-[#0c0f18] border-slate-700/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="text-sm font-display text-teal-100">
                  {freeUnlocked ? `${strings.freeSeason} · Heat ${save.freeSeasonWins + 1}` : strings.locked}
                </div>
                <div className="text-xs text-teal-200/70 mt-0.5">
                  {freeUnlocked
                    ? 'Procedural high-intensity circuits · The Conversation continues'
                    : 'Complete Stage 15 to unlock the Free Season'}
                </div>
              </div>
              {freeUnlocked ? (
                <Play className="w-5 h-5 text-teal-300 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-slate-500 shrink-0" />
              )}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
