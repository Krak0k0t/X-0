import React from 'react';
import { BookOpen, Scissors, ArrowUpCircle, Maximize2, Minimize2, ArrowRight, X, Trophy } from 'lucide-react';
import { CAMPAIGN_STAGES } from '../game/data/campaign';
import { ALL_MUTATION_IDS, MUTATIONS } from '../game/data/mutations';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { calculateModuleCost } from '../game/rules';
import type { SaveState, UpgradeModules } from '../game/types';

interface GaragePanelProps {
  save: SaveState;
  strings: UiStrings;
  isFullscreen: boolean;
  onUpgradeModule: (key: keyof UpgradeModules) => void;
  onExciseTrait: (index: number) => void;
  onContinueCampaign: () => void;
  onOpenCodex: () => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
}

export const GaragePanel: React.FC<GaragePanelProps> = ({
  save,
  strings,
  isFullscreen,
  onUpgradeModule,
  onExciseTrait,
  onContinueCampaign,
  onOpenCodex,
  onClose,
  onToggleFullscreen,
}) => {
  const moduleSpecs: Array<{
    key: keyof UpgradeModules;
    label: string;
    bonusText: string;
  }> = [
    { key: 'engine', label: strings.engine, bonusText: '+4.2 Speed / lvl' },
    { key: 'chassis', label: strings.chassis, bonusText: '+7% Handling / lvl' },
    { key: 'grip', label: strings.grip, bonusText: '+1.8 Accel / lvl' },
    { key: 'armor', label: strings.armor, bonusText: '+10 Durability / lvl' },
  ];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-black/70">
      <div className="flux-panel rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-amber-500/25">
          <div>
            <h2 className="text-xl font-display text-amber-100">
              {strings.garage} · Dusk-9
            </h2>
            <div className="text-xs text-amber-200/75 mt-0.5 flex items-center gap-3 tabular-nums">
              <span className="text-amber-300 font-bold">◆ {save.fluxite} {strings.fluxite}</span>
              <span>·</span>
              <span>{strings.reputation}: {save.reputation}/100</span>
              <span>·</span>
              <span>{strings.traits}: {save.permanentTraits.length}/6</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCodex}
              className="flux-btn px-3 h-9 rounded text-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{strings.codex}</span>
            </button>
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

        {/* Content */}
        <div className="flux-scroll p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Chassis Upgrade Modules */}
          <div className="space-y-4">
            <h3 className="text-sm font-display text-amber-300 tracking-wider">
              {strings.modules}
            </h3>
            <div className="space-y-3">
              {moduleSpecs.map((spec) => {
                const lvl = save.modules[spec.key];
                const cost = calculateModuleCost(lvl);
                const isMax = lvl >= 5;
                const canAfford = save.fluxite >= cost;

                return (
                  <div
                    key={spec.key}
                    className="bg-[#121725] border border-amber-500/25 rounded-md p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-sm text-amber-50 font-bold">
                          {spec.label}
                        </span>
                        <span className="text-xs text-teal-300 tabular-nums">
                          Lv. {lvl}/5
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-100/60 mt-0.5">{spec.bonusText}</div>
                      {/* Pips */}
                      <div className="flex items-center gap-1 mt-2">
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 w-6 rounded-sm ${
                              idx < lvl ? 'bg-amber-400' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isMax || !canAfford}
                      onClick={() => onUpgradeModule(spec.key)}
                      className="flux-btn px-3 py-2 rounded text-xs font-display flex items-center gap-1.5 shrink-0 tabular-nums"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>{isMax ? strings.maxLevel : `◆ ${cost}`}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Artifacts & Trophy Shelf */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-sm font-display text-amber-300 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>
                  {strings.artifactsShelf} ({save.artifacts.length}/{CAMPAIGN_STAGES.filter((s) => Boolean(s.artifactId)).length})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto flux-scroll pr-1">
                {CAMPAIGN_STAGES.filter((s) => Boolean(s.artifactId)).map((st) => {
                  const unlocked = Boolean(st.artifactId && save.artifacts.includes(st.artifactId));
                  const bestTime = save.bestRunTimes?.[st.id];
                  return (
                    <div
                      key={st.id}
                      className={`p-2.5 rounded border text-xs ${
                        unlocked
                          ? 'bg-[#121927] border-amber-400/40 text-amber-100'
                          : 'bg-[#0b0e17] border-slate-800/70 opacity-50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold truncate">
                          {unlocked
                            ? pickLoc(save.language, st.artifactNameEn ?? st.titleEn, st.artifactNameRu ?? st.titleRu)
                            : `Stage ${st.stageNumber} · ???`}
                        </span>
                        {bestTime !== undefined && (
                          <span className="text-[10px] text-teal-300 tabular-nums shrink-0">
                            {bestTime.toFixed(1)}s
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-200/55 mt-0.5 truncate">
                        {pickLoc(save.language, st.titleEn, st.titleRu)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Permanent Traits (max 6) & Mutation Codex */}
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-display text-teal-300 tracking-wider">
                {strings.traits} ({save.permanentTraits.length}/6)
              </h3>
              {save.permanentTraits.length === 0 ? (
                <div className="bg-[#111522] border border-slate-700/40 rounded-md p-4 text-xs text-amber-100/55">
                  Drive through glowing Flux patches during races. Beneficial mutations have a ~40% chance to permanently bond to your chassis.
                </div>
              ) : (
                <div className="space-y-2">
                  {save.permanentTraits.map((traitId, idx) => {
                    const m = MUTATIONS[traitId];
                    return (
                      <div
                        key={`${traitId}-${idx}`}
                        className="bg-[#111924] border border-teal-500/35 rounded-md p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div
                            className="font-display text-sm font-bold"
                            style={{ color: m.colorHex }}
                          >
                            {pickLoc(save.language, m.nameEn, m.nameRu)}
                          </div>
                          <div className="text-xs text-amber-100/75 mt-0.5">
                            {pickLoc(save.language, m.descEn, m.descRu)}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={save.fluxite < 150}
                          onClick={() => onExciseTrait(idx)}
                          className="flux-btn px-2.5 py-1.5 rounded text-[11px] flex items-center gap-1 shrink-0 tabular-nums"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>{strings.excise}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 13 Mutation Codex */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-display text-amber-300 tracking-wider">
                {strings.mutations} ({save.discoveredMutations.length}/13)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto flux-scroll pr-1">
                {ALL_MUTATION_IDS.map((mId) => {
                  const m = MUTATIONS[mId];
                  const found = save.discoveredMutations.includes(mId);
                  return (
                    <div
                      key={mId}
                      className={`p-2.5 rounded border text-xs ${
                        found
                          ? 'bg-[#121725] border-amber-500/25'
                          : 'bg-[#0b0e17] border-slate-800/70 opacity-50'
                      }`}
                    >
                      <div className="font-display font-semibold" style={{ color: found ? m.colorHex : '#64748b' }}>
                        {found ? pickLoc(save.language, m.nameEn, m.nameRu) : '???'}
                      </div>
                      <div className="text-[11px] text-amber-100/65 mt-0.5">
                        {found ? pickLoc(save.language, m.descEn, m.descRu) : m.category.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-amber-500/25 bg-[#0c0f18]">
          <button type="button" onClick={onClose} className="flux-btn px-4 py-2 rounded-md text-xs">
            {strings.back}
          </button>
          <button
            type="button"
            onClick={onContinueCampaign}
            className="flux-btn-primary px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2"
          >
            <span>
              {save.unlockedChapters.includes('free_season')
                ? strings.freeSeason
                : `${strings.nextStage} · ${save.currentStageNumber}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
