import React from 'react';
import { Maximize2, Minimize2, ArrowRight } from 'lucide-react';
import { CHARACTERS } from '../game/data/characters';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { SPONSOR_CONTRACTS } from '../game/rules';
import type {
  BiomeId,
  DialogueLine,
  LanguageCode,
  SponsorId,
  StageChoiceOption,
  StoryFlags,
} from '../game/types';
import { PlanetaryRouteMap } from './PlanetaryRouteMap';
import { RacePortrait } from './RacePortrait';

interface DialogueOverlayProps {
  title: string;
  subtitle: string;
  lines: DialogueLine[];
  language: LanguageCode;
  flags: StoryFlags;
  strings: UiStrings;
  isFullscreen: boolean;
  routeContext?: {
    stageNumber: number;
    biome: BiomeId;
    unlockedChapters: string[];
    completedChapters: string[];
  };
  choicePrompt?: string;
  choiceOptions?: StageChoiceOption[];
  selectedChoiceId?: string | null;
  activeSponsor?: SponsorId | null;
  onSelectSponsor?: (id: SponsorId | null) => void;
  primaryActionLabel: string;
  onSelectChoice?: (opt: StageChoiceOption) => void;
  onPrimaryAction: () => void;
  onBack?: () => void;
  onToggleFullscreen: () => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  title,
  subtitle,
  lines,
  language,
  flags,
  strings,
  isFullscreen,
  routeContext,
  choicePrompt,
  choiceOptions,
  selectedChoiceId,
  activeSponsor,
  onSelectSponsor,
  primaryActionLabel,
  onSelectChoice,
  onPrimaryAction,
  onBack,
  onToggleFullscreen,
}) => {
  const visibleLines = lines.filter((l) => {
    if (l.condition === 'sold') return flags.sold === true;
    if (l.condition === 'not_sold') return flags.sold !== true;
    if (l.condition === 'collider') return flags.collider === true;
    if (l.condition === 'not_collider') return flags.collider !== true;
    return true;
  });

  const needsChoice = Boolean(choiceOptions && choiceOptions.length > 0 && !selectedChoiceId);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 sm:p-8 bg-black/65">
      <div className="flux-panel rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/25">
          <div>
            <div className="text-xs font-display text-amber-300/85 tracking-wider">
              {subtitle}
            </div>
            <h2 className="text-xl sm:text-2xl font-display text-amber-50 mt-0.5">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            className="flux-btn w-9 h-9 rounded flex items-center justify-center shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Story Dialogue Feed */}
        <div className="flux-scroll p-6 space-y-4">
          {routeContext && (
            <PlanetaryRouteMap
              language={language}
              unlockedChapters={routeContext.unlockedChapters}
              completedChapters={routeContext.completedChapters}
              activeStageNumber={routeContext.stageNumber}
              activeBiome={routeContext.biome}
              compact
            />
          )}

          {visibleLines.map((line, idx) => {
            const char = CHARACTERS[line.speaker];
            const isVoice = line.speaker === 'voice';
            return (
              <div
                key={idx}
                className={`flex items-start gap-4 p-3.5 rounded-md border ${
                  isVoice
                    ? 'bg-purple-950/50 border-fuchsia-400/50'
                    : 'bg-[#111624] border-amber-500/20'
                }`}
              >
                <RacePortrait characterId={line.speaker} size={64} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      className="font-display text-sm font-bold"
                      style={{ color: char.accentColor }}
                    >
                      {pickLoc(language, char.nameEn, char.nameRu)}
                    </span>
                    <span className="text-[11px] text-amber-100/55">
                      {pickLoc(language, char.factionEn, char.factionRu)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-amber-50/95 max-w-[65ch]">
                    {pickLoc(language, line.textEn, line.textRu)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Narrative Decision Block (Stage 3, Stage 13, Stage 15 Finale) */}
          {choiceOptions && choiceOptions.length > 0 && (
            <div className="pt-3 border-t border-amber-500/25 space-y-3">
              {choicePrompt && (
                <p className="text-sm font-display text-amber-200">{choicePrompt}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {choiceOptions.map((opt) => {
                  const chosen = selectedChoiceId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectChoice?.(opt)}
                      className={`text-left p-3.5 rounded-md border transition-colors ${
                        chosen
                          ? 'bg-amber-900/50 border-amber-300 text-amber-50'
                          : 'bg-[#141a29] border-amber-500/30 hover:border-amber-400 text-amber-100'
                      }`}
                    >
                      <div className="font-display text-sm font-bold">
                        {pickLoc(language, opt.labelEn, opt.labelRu)}
                      </div>
                      <div className="text-xs text-amber-100/70 mt-1">
                        {pickLoc(language, opt.descEn, opt.descRu)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Faction Sponsor Contract Selector (Pre-Race Briefing) */}
          {onSelectSponsor && (
            <div className="pt-3 border-t border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display text-teal-300 tracking-wider uppercase">
                  {strings.sponsorContract}
                </span>
                {activeSponsor && (
                  <button
                    type="button"
                    onClick={() => onSelectSponsor(null)}
                    className="text-[11px] text-amber-200/70 hover:text-amber-100 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['league', 'nomads', 'artisan'] as SponsorId[]).map((sid) => {
                  const sp = SPONSOR_CONTRACTS[sid];
                  const selected = activeSponsor === sid;
                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => onSelectSponsor(selected ? null : sid)}
                      className={`text-left p-2.5 rounded-md border transition-colors ${
                        selected
                          ? 'bg-teal-950/60 border-teal-400 text-amber-50'
                          : 'bg-[#121725] border-amber-500/25 hover:border-amber-400/60 text-amber-100/85'
                      }`}
                    >
                      <div className="text-[10px] font-display text-teal-300 uppercase tracking-wider">
                        {pickLoc(language, sp.factionEn, sp.factionRu)}
                      </div>
                      <div className="font-display text-xs font-bold mt-0.5">
                        {pickLoc(language, sp.titleEn, sp.titleRu)}
                      </div>
                      <div className="text-[11px] text-amber-100/70 mt-1 leading-snug">
                        {pickLoc(language, sp.descEn, sp.descRu)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-amber-500/25 bg-[#0c0f18]">
          {onBack ? (
            <button type="button" onClick={onBack} className="flux-btn px-4 py-2 rounded-md text-xs">
              {strings.back}
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            data-start="true"
            disabled={needsChoice}
            onClick={onPrimaryAction}
            className="flux-btn-primary px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2"
          >
            <span>{primaryActionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
