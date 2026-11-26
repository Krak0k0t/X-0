import React from 'react';
import { pickLoc } from '../game/data/i18n';
import { getPlanetaryLegMeta, PLANETARY_LEGS } from '../game/data/planetaryRoutes';
import type { BiomeId, LanguageCode } from '../game/types';

interface PlanetaryRouteMapProps {
  language: LanguageCode;
  unlockedChapters: string[];
  completedChapters: string[];
  activeStageNumber?: number;
  activeBiome?: BiomeId;
  compact?: boolean;
}

export const PlanetaryRouteMap: React.FC<PlanetaryRouteMapProps> = ({
  language,
  unlockedChapters,
  completedChapters,
  activeStageNumber,
  activeBiome = 'crystal',
  compact = false,
}) => {
  const legs = Object.values(PLANETARY_LEGS).sort((a, b) => a.stageNumber - b.stageNumber);
  const pathPoints = legs.map((l) => `${l.mapX},${l.mapY}`).join(' ');
  const focusNum = activeStageNumber && activeStageNumber <= 15
    ? activeStageNumber
    : Math.max(1, Math.min(15, completedChapters.length + 1));
  const focusMeta = getPlanetaryLegMeta(focusNum, activeBiome);

  const unlockedLegs = legs.filter(
    (l) =>
      unlockedChapters.includes(`1_${l.stageNumber}`) ||
      completedChapters.includes(`1_${l.stageNumber}`),
  );
  const unlockedPath = unlockedLegs.map((l) => `${l.mapX},${l.mapY}`).join(' ');

  return (
    <div
      className={`rounded-md border border-amber-500/25 bg-[#0c101b] ${
        compact ? 'px-3.5 py-2.5' : 'p-4'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[11px] font-display uppercase tracking-wider text-amber-300/90">
          {language === 'ru'
            ? 'Планетарная дуга Арх-9 · Кастра → Южный Полюс'
            : 'Arch-9 Planetary Route Arc · Kastra → South Pole'}
        </div>
        <div className="text-[11px] font-display text-teal-300/90 tabular-nums">
          {String(focusMeta.stageNumber).padStart(2, '0')}/15 ·{' '}
          {pickLoc(language, focusMeta.originEn, focusMeta.originRu)} →{' '}
          {pickLoc(language, focusMeta.destEn, focusMeta.destRu)} ({focusMeta.distanceKm}{' '}
          {language === 'ru' ? 'км' : 'km'})
        </div>
      </div>

      <svg
        viewBox="0 0 360 112"
        className={`w-full ${compact ? 'h-16' : 'h-24'} overflow-visible`}
        aria-label="Planetary Route Arc Map"
      >
        {/* Planet curvature horizon arcs */}
        <path
          d="M 10 92 Q 180 18 350 92"
          fill="none"
          stroke="rgba(212, 168, 83, 0.14)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <path
          d="M 18 104 Q 180 42 342 104"
          fill="none"
          stroke="rgba(45, 212, 191, 0.1)"
          strokeWidth="1"
        />

        {/* Full 15-leg route baseline */}
        <polyline
          points={pathPoints}
          fill="none"
          stroke="rgba(148, 163, 184, 0.28)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Unlocked expedition path */}
        {unlockedLegs.length > 1 && (
          <polyline
            points={unlockedPath}
            fill="none"
            stroke="rgba(245, 158, 11, 0.72)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        )}

        {/* Stage Nodes */}
        {legs.map((leg) => {
          const stId = `1_${leg.stageNumber}`;
          const isCompleted = completedChapters.includes(stId);
          const isUnlocked = unlockedChapters.includes(stId);
          const isActive = leg.stageNumber === focusNum;
          const fill = isCompleted
            ? '#2dd4bf'
            : isActive
              ? '#fbbf24'
              : isUnlocked
                ? '#f59e0b'
                : '#334155';

          return (
            <g key={leg.stageNumber}>
              {isActive && (
                <circle
                  cx={leg.mapX}
                  cy={leg.mapY}
                  r={7}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
              )}
              <circle
                cx={leg.mapX}
                cy={leg.mapY}
                r={isActive ? 4 : isUnlocked ? 3 : 2.3}
                fill={fill}
                stroke="#090b12"
                strokeWidth="1"
              />
              {(leg.stageNumber === 1 || leg.stageNumber === 8 || leg.stageNumber === 15 || isActive) && (
                <text
                  x={leg.mapX}
                  y={leg.mapY > 68 ? leg.mapY + 11 : leg.mapY - 8}
                  textAnchor="middle"
                  fill={isActive ? '#fef3c7' : '#94a3b8'}
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {String(leg.stageNumber).padStart(2, '0')}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!compact && (
        <p className="text-[11px] text-amber-100/70 mt-1.5 leading-snug">
          {pickLoc(language, focusMeta.standardEn, focusMeta.standardRu)}
        </p>
      )}
    </div>
  );
};
