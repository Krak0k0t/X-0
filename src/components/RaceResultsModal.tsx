import React from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { MUTATIONS } from '../game/data/mutations';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { SPONSOR_CONTRACTS } from '../game/rules';
import type { LanguageCode, RaceFinishResult } from '../game/types';

interface RaceResultsModalProps {
  result: RaceFinishResult;
  language: LanguageCode;
  strings: UiStrings;
  onRetry: () => void;
  onContinue: () => void;
}

export const RaceResultsModal: React.FC<RaceResultsModalProps> = ({
  result,
  language,
  strings,
  onRetry,
  onContinue,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="flux-panel rounded-lg w-full max-w-lg p-6 space-y-5">
        <div className="border-b border-amber-500/25 pb-3 flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-display text-amber-100">
            {result.dnf ? strings.dnfTitle : strings.victory}
          </h2>
          <span className="font-display text-lg text-amber-300 tabular-nums">
            #{result.placement} / {result.totalRacers}
          </span>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-[#111624] border border-amber-500/20 rounded p-2.5">
            <div className="text-[10px] font-display text-amber-200/70">{strings.stageReward}</div>
            <div className="text-base font-display font-bold text-amber-100 tabular-nums mt-0.5">
              ◆ {result.stageReward}
            </div>
          </div>
          <div className="bg-[#111624] border border-amber-500/20 rounded p-2.5">
            <div className="text-[10px] font-display text-amber-200/70">{strings.placementReward}</div>
            <div className="text-base font-display font-bold text-amber-100 tabular-nums mt-0.5">
              ◆ {result.placementReward}
            </div>
          </div>
          <div className="bg-[#111624] border border-teal-500/25 rounded p-2.5">
            <div className="text-[10px] font-display text-teal-300/80">{strings.doseReward}</div>
            <div className="text-base font-display font-bold text-teal-200 tabular-nums mt-0.5">
              ◆ {result.doseReward}
            </div>
          </div>
        </div>

        {result.questTitleEn && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
              result.questCompleted
                ? 'bg-[#101c22] border-teal-500/35 text-teal-200'
                : 'bg-[#111522] border-slate-700/40 text-amber-100/60'
            }`}
          >
            <span>
              {strings.fieldQuest}: {pickLoc(language, result.questTitleEn, result.questTitleRu ?? result.questTitleEn)}
            </span>
            <span className="font-display font-bold tabular-nums">
              {result.questCompleted ? `+◆ ${result.questBonusFluxite}` : '—'}
            </span>
          </div>
        )}

        {result.beaconsCollected !== undefined && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
              result.beaconsCollected > 0
                ? 'bg-[#101c22] border-amber-400/35 text-amber-200'
                : 'bg-[#111522] border-slate-700/40 text-amber-100/60'
            }`}
          >
            <span>
              {strings.memoryBeacons}: {result.beaconsCollected}/3
            </span>
            <span className="font-display font-bold tabular-nums">
              {result.beaconBonusFluxite ? `+◆ ${result.beaconBonusFluxite}` : '—'}
            </span>
          </div>
        )}

        {(result.nearMissCount ?? 0) > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded border text-xs bg-[#101c22] border-sky-400/35 text-sky-200">
            <span>
              {strings.nearMisses}: {result.nearMissCount}
            </span>
            <span className="font-display font-bold tabular-nums">
              +◆ {result.nearMissBonusFluxite ?? 0}
            </span>
          </div>
        )}

        {result.sponsorId && SPONSOR_CONTRACTS[result.sponsorId] && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
              result.sponsorCompleted
                ? 'bg-[#101c22] border-teal-400/45 text-teal-200'
                : 'bg-[#111522] border-slate-700/40 text-amber-100/60'
            }`}
          >
            <span>
              {strings.sponsorContract}:{' '}
              {pickLoc(
                language,
                SPONSOR_CONTRACTS[result.sponsorId].factionEn,
                SPONSOR_CONTRACTS[result.sponsorId].factionRu,
              )}
            </span>
            <span className="font-display font-bold tabular-nums">
              {result.sponsorCompleted
                ? `+◆ ${result.sponsorBonusFluxite ?? 0} · +${result.sponsorBonusReputation ?? 0} Rep`
                : '—'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2.5 rounded bg-[#141928] border border-amber-500/30 text-sm">
          <span className="font-display text-amber-200">{strings.totalEarned}</span>
          <span className="font-display font-bold text-amber-300 tabular-nums">
            +◆ {result.totalFluxiteEarned}
          </span>
        </div>

        {/* Fixated Permanent Traits */}
        {result.newlyFixatedTraits.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-display text-teal-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{strings.fixatedTraits}</span>
            </div>
            <div className="space-y-1.5">
              {result.newlyFixatedTraits.map((id) => {
                const m = MUTATIONS[id];
                return (
                  <div
                    key={id}
                    className="bg-[#101c22] border border-teal-500/35 rounded px-3 py-2 text-xs"
                  >
                    <span className="font-display font-bold" style={{ color: m.colorHex }}>
                      {pickLoc(language, m.nameEn, m.nameRu)}
                    </span>
                    <span className="text-amber-100/75 ml-2">
                      {pickLoc(language, m.descEn, m.descRu)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Damage Report Summary */}
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] text-amber-100/75 tabular-nums">
          <div className="bg-[#0e121d] rounded py-1.5 px-1">
            {strings.engine}: {Math.round(result.damageReport.engine)}%
          </div>
          <div className="bg-[#0e121d] rounded py-1.5 px-1">
            {strings.steering}: {Math.round(result.damageReport.steering)}%
          </div>
          <div className="bg-[#0e121d] rounded py-1.5 px-1">
            {strings.suspension}: {Math.round(result.damageReport.suspension)}%
          </div>
          <div className="bg-[#0e121d] rounded py-1.5 px-1">
            {strings.armor}: {Math.round(result.damageReport.armor)}%
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="flux-btn px-4 py-2.5 rounded-md text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{strings.restartStage}</span>
          </button>

          {!result.dnf && (
            <button
              type="button"
              data-start="true"
              onClick={onContinue}
              className="flux-btn-primary px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2"
            >
              <span>{strings.continueGame}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
