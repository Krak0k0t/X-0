import React, { useState } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  Zap,
  Shield,
  Cog,
  Compass,
  Activity,
  Radar,
} from 'lucide-react';
import { MUTATIONS } from '../game/data/mutations';
import { pickLoc, type UiStrings } from '../game/data/i18n';
import { SPONSOR_CONTRACTS } from '../game/rules';
import type { LanguageCode, RaceHudSnapshot, SponsorId, StageConfig } from '../game/types';
import { RacePortrait } from './RacePortrait';

interface RaceHUDProps {
  stage: StageConfig;
  hud: RaceHudSnapshot;
  activeSponsor?: SponsorId | null;
  language: LanguageCode;
  strings: UiStrings;
  muted: boolean;
  isFullscreen: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onResetCamera: () => void;
  onToggleRadar: () => void;
  onTouchSteer: (steer: number) => void;
  onTouchThrottle: (throttle: number) => void;
  onTouchDrift: (drift: boolean) => void;
  onTouchHop: () => void;
  onTouchAbility: () => void;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  stage,
  hud,
  activeSponsor,
  language,
  strings,
  muted,
  isFullscreen,
  onPause,
  onToggleMute,
  onToggleFullscreen,
  onResetCamera,
  onToggleRadar,
  onTouchSteer,
  onTouchThrottle,
  onTouchDrift,
  onTouchHop,
  onTouchAbility,
}) => {
  const [hoveredTip, setHoveredTip] = useState<string | null>(null);
  const etaMins = Math.floor(hud.etaSec / 60);
  const etaRemSec = hud.etaSec % 60;
  const etaText = hud.etaSec > 0 ? `~${etaMins}:${String(etaRemSec).padStart(2, '0')} ${strings.etaLabel}` : '';
  const sponsorDef = activeSponsor ? SPONSOR_CONTRACTS[activeSponsor] : null;

  const hullPct = Math.max(0, Math.min(100, (hud.durability / Math.max(1, hud.maxDurability)) * 100));
  const dosePct = Math.max(0, Math.min(100, hud.dose));

  // Minimap projection bounding box
  let minX = -100, maxX = 100, minZ = -100, maxZ = 100;
  if (hud.minimapPoints.length > 0) {
    minX = Infinity; maxX = -Infinity; minZ = Infinity; maxZ = -Infinity;
    for (const pt of hud.minimapPoints) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
    }
    const pad = 16;
    minX -= pad; maxX += pad; minZ -= pad; maxZ += pad;
  }
  const mapSpan = Math.max(1, maxX - minX, maxZ - minZ);
  const toMapX = (x: number) => ((x - minX) / mapSpan) * 86 + 7;
  const toMapY = (z: number) => ((z - minZ) / mapSpan) * 86 + 7;

  const subsystemColor = (val: number) =>
    val > 65 ? '#2dd4bf' : val > 35 ? '#fbbf24' : '#ef4444';

  const subsystemList = [
    {
      id: 'engine',
      label: strings.engine,
      val: Math.round(hud.subsystems.engine),
      icon: <Cog className="w-3.5 h-3.5" />,
      tip: `${strings.engine}: ${Math.round(hud.subsystems.engine)}% · Affects top speed & acceleration`,
    },
    {
      id: 'steering',
      label: strings.steering,
      val: Math.round(hud.subsystems.steering),
      icon: <Compass className="w-3.5 h-3.5" />,
      tip: `${strings.steering}: ${Math.round(hud.subsystems.steering)}% · Side impacts cause steering pull`,
    },
    {
      id: 'suspension',
      label: strings.suspension,
      val: Math.round(hud.subsystems.suspension),
      icon: <Activity className="w-3.5 h-3.5" />,
      tip: `${strings.suspension}: ${Math.round(hud.subsystems.suspension)}% · Affects corner grip & bounce`,
    },
    {
      id: 'armor',
      label: strings.armor,
      val: Math.round(hud.subsystems.armor),
      icon: <Shield className="w-3.5 h-3.5" />,
      tip: `${strings.armor}: ${Math.round(hud.subsystems.armor)}% · Absorbs collision force`,
    },
  ];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Subtle critical hull screen vignette */}
      {hullPct < 30 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.45)',
          }}
        />
      )}

      {/* Stage 15 brief non-blocking VOICELESS STATIC telemetry interference */}
      {hud.hudStaticActive && (
        <div
          className="fixed inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(15, 23, 42, 0.28) 0px, rgba(15, 23, 42, 0.28) 1px, transparent 1px, transparent 4px)',
          }}
        />
      )}

      {/* TOP BAR CORNERS */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Position, Lap, Stage & Compact Field Quest */}
        <div className="flex flex-col items-start gap-2">
          <div className="flux-panel-subtle rounded-md px-3.5 py-2.5 flex items-center gap-4">
            <div>
              <div className="text-[10px] font-display text-amber-200/70 tracking-wider">
                {strings.position}
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-amber-300 tabular-nums leading-none">
                {hud.position}
                <span className="text-sm text-amber-100/55">/{hud.totalRacers}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-amber-500/20" />

            <div>
              <div className="text-[10px] font-display text-amber-200/70 tracking-wider">
                {hud.isPointToPoint ? strings.segment : strings.lap}
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-amber-50 tabular-nums leading-none">
                {hud.isPointToPoint ? hud.segment : hud.lap}
                <span className="text-sm text-amber-100/55">
                  /{hud.isPointToPoint ? hud.totalSegments : hud.totalLaps}
                </span>
              </div>
            </div>

            <div className="hidden md:block h-8 w-px bg-amber-500/20" />
            <div className="hidden md:block max-w-[220px]">
              <div className="text-[10px] font-display text-teal-300/80 truncate">
                {pickLoc(language, stage.titleEn, stage.titleRu)}
              </div>
              <div className="text-[11px] text-amber-100/65 tabular-nums flex items-center gap-2">
                <span>
                  {hud.isPointToPoint
                    ? `${hud.distanceKm}/${hud.totalDistanceKm} KM · ×${stage.intensity.toFixed(1)}`
                    : `×${stage.intensity.toFixed(1)} FLUX`}
                </span>
                {etaText && <span className="text-teal-300/85 font-semibold">{etaText}</span>}
              </div>
              {sponsorDef && (
                <div className="text-[10px] text-amber-300/80 truncate">
                  {pickLoc(language, sponsorDef.factionEn, sponsorDef.factionRu)}
                </div>
              )}
            </div>
          </div>

          {hud.quest && (
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                className={`flux-panel-subtle rounded px-3 py-1.5 flex items-center gap-2.5 text-[11px] border ${
                  hud.quest.status === 'completed'
                    ? 'border-teal-400/60 text-teal-200'
                    : hud.quest.status === 'failed'
                      ? 'border-rose-400/45 text-rose-200/80'
                      : 'border-amber-500/30 text-amber-100'
                }`}
              >
                <span className="font-display text-[10px] tracking-wider uppercase text-amber-300/80">
                  {strings.fieldQuest}
                </span>
                <span className="font-semibold">
                  {pickLoc(language, hud.quest.titleEn, hud.quest.titleRu)}
                </span>
                <span className="tabular-nums opacity-85">
                  {hud.quest.target > 0
                    ? `${hud.quest.current}/${hud.quest.target}`
                    : hud.quest.status === 'failed'
                      ? '✕'
                      : '✓'}
                </span>
              </div>

              {hud.beaconsTotal > 0 && (
                <div
                  className={`flux-panel-subtle rounded px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] border tabular-nums ${
                    hud.beaconsCollected >= hud.beaconsTotal
                      ? 'border-teal-400/60 text-teal-200'
                      : 'border-amber-500/30 text-amber-200/90'
                  }`}
                >
                  <span className="font-display text-[10px] tracking-wider uppercase opacity-80">
                    {strings.memoryBeacons}
                  </span>
                  <span className="font-bold">
                    {hud.beaconsCollected}/{hud.beaconsTotal}
                  </span>
                </div>
              )}

              {hud.nearMissCount > 0 && (
                <div className="flux-panel-subtle rounded px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] border border-sky-400/45 text-sky-200 tabular-nums">
                  <span className="font-display text-[10px] tracking-wider uppercase opacity-80">
                    {strings.nearMisses}
                  </span>
                  <span className="font-bold">{hud.nearMissCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Center: Floating Callouts & Voice Transmission */}
        <div className="flex flex-col items-center gap-2 max-w-md">
          {hud.cursorMoveActive && (
            <div className="bg-teal-950/90 border border-teal-400/70 px-3 py-1 rounded text-[11px] font-display text-teal-200 tracking-wider">
              {strings.cursorDriveActive}
            </div>
          )}
          {hud.hudStaticActive && (
            <div className="bg-fuchsia-950/90 border border-fuchsia-400/70 px-3 py-1 rounded text-[11px] font-display text-fuchsia-200 tracking-wider">
              VOICELESS STATIC · RADAR ONLY
            </div>
          )}
          {hud.isOffTrack && (
            <div className="bg-amber-950/90 border border-amber-400/70 px-3 py-1 rounded text-xs font-display text-amber-200 tracking-wider">
              {strings.offTrackWarning}
            </div>
          )}

          {hud.voiceTransmission && (
            <div className="flux-panel rounded-md p-2.5 flex items-center gap-3 border-fuchsia-400/60">
              <RacePortrait characterId="voice" size={44} />
              <div className="text-xs text-fuchsia-100 font-display leading-snug">
                {pickLoc(language, hud.voiceTransmission.textEn, hud.voiceTransmission.textRu)}
              </div>
            </div>
          )}

          {hud.floatingEvents.map((ev) => (
            <div
              key={ev.id}
              className={`px-3 py-1 rounded text-xs font-display font-bold shadow-md ${
                ev.tone === 'damage'
                  ? 'bg-rose-950/90 border border-rose-400/60 text-rose-100'
                  : ev.tone === 'boon'
                    ? 'bg-teal-950/90 border border-teal-400/60 text-teal-100'
                    : 'bg-purple-950/90 border border-purple-400/60 text-purple-100'
              }`}
            >
              {ev.text}
            </div>
          ))}
        </div>

        {/* Top-Right: Compact Square Utility Icon Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleRadar();
            }}
            aria-label={`${strings.whisperRadar} [Tab]`}
            title={`${strings.whisperRadar} [Tab]`}
            className={`flux-btn h-9 rounded flex items-center justify-center gap-1 px-2 ${
              hud.radar.active ? 'border-teal-400 text-teal-200 bg-teal-950/60' : ''
            }`}
          >
            <Radar className="w-4 h-4" />
            {hud.radar.active && (
              <span className="text-[10px] font-display tabular-nums">
                {hud.radar.distance}m
              </span>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onResetCamera();
            }}
            aria-label={`${strings.resetCamera} [C]`}
            title={`${strings.resetCamera} [C]`}
            className={`flux-btn w-9 h-9 rounded flex items-center justify-center ${
              hud.cameraInspecting ? 'border-teal-400 text-teal-200' : ''
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label="Mute [M]"
            title="Mute [M]"
            className="flux-btn w-9 h-9 rounded flex items-center justify-center"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleFullscreen();
            }}
            aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            title={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
            className="flux-btn w-9 h-9 rounded flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label={`${strings.pause} [Esc]`}
            title={`${strings.pause} [Esc]`}
            className="flux-btn w-9 h-9 rounded flex items-center justify-center"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM BAR CORNERS */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
        {/* Bottom-Left: Minimap + Hull & 4 Subsystem Damage Sockets + Mobile Speed/Dose */}
        <div className="flex items-end justify-between sm:justify-start gap-2 sm:gap-3">
          {/* Minimap */}
          <div className="flux-panel-subtle rounded-md p-1.5 hidden sm:block">
            <svg width="100" height="100" viewBox="0 0 100 100" aria-label="Track Minimap">
              {hud.minimapPoints.length > 2 &&
                (hud.isPointToPoint ? (
                  <>
                    <polyline
                      points={hud.minimapPoints
                        .map((pt) => `${toMapX(pt.x).toFixed(1)},${toMapY(pt.z).toFixed(1)}`)
                        .join(' ')}
                      fill="none"
                      stroke="rgba(212, 168, 83, 0.55)"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {hud.minimapForkPoints && hud.minimapForkPoints.length > 1 && (
                      <polyline
                        points={hud.minimapForkPoints
                          .map((pt) => `${toMapX(pt.x).toFixed(1)},${toMapY(pt.z).toFixed(1)}`)
                          .join(' ')}
                        fill="none"
                        stroke="rgba(45, 212, 191, 0.68)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* Point A (Start) & Point B (Destination Outpost) */}
                    <rect
                      x={toMapX(hud.minimapPoints[0].x) - 2.6}
                      y={toMapY(hud.minimapPoints[0].z) - 2.6}
                      width="5.2"
                      height="5.2"
                      fill="#fbbf24"
                      stroke="#090b12"
                      strokeWidth="0.9"
                    />
                    <polygon
                      points={`${toMapX(hud.minimapPoints[hud.minimapPoints.length - 1].x)},${toMapY(hud.minimapPoints[hud.minimapPoints.length - 1].z) - 4} ${toMapX(hud.minimapPoints[hud.minimapPoints.length - 1].x) + 4},${toMapY(hud.minimapPoints[hud.minimapPoints.length - 1].z)} ${toMapX(hud.minimapPoints[hud.minimapPoints.length - 1].x)},${toMapY(hud.minimapPoints[hud.minimapPoints.length - 1].z) + 4} ${toMapX(hud.minimapPoints[hud.minimapPoints.length - 1].x) - 4},${toMapY(hud.minimapPoints[hud.minimapPoints.length - 1].z)}`}
                      fill="#2dd4bf"
                      stroke="#090b12"
                      strokeWidth="0.9"
                    />
                  </>
                ) : (
                  <polygon
                    points={hud.minimapPoints
                      .map((pt) => `${toMapX(pt.x).toFixed(1)},${toMapY(pt.z).toFixed(1)}`)
                      .join(' ')}
                    fill="none"
                    stroke="rgba(212, 168, 83, 0.45)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                ))}
              {hud.minimapBeacons.map((b, idx) => (
                <circle
                  key={`mb-${idx}`}
                  cx={toMapX(b.x)}
                  cy={toMapY(b.z)}
                  r={b.collected ? 1.8 : 2.6}
                  fill={b.collected ? '#2dd4bf' : '#fbbf24'}
                  stroke="#090b12"
                  strokeWidth="0.8"
                />
              ))}
              {hud.radar.active && (() => {
                const playerDot = hud.minimapRacers.find((r) => r.isPlayer);
                if (!playerDot) return null;
                const tx = toMapX(hud.radar.x);
                const ty = toMapY(hud.radar.z);
                return (
                  <g>
                    <line
                      x1={toMapX(playerDot.x)}
                      y1={toMapY(playerDot.z)}
                      x2={tx}
                      y2={ty}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="2.5 2"
                    />
                    <circle
                      cx={tx}
                      cy={ty}
                      r={4.5}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                  </g>
                );
              })()}
              {hud.minimapRacers.map((r) => (
                <circle
                  key={r.id}
                  cx={toMapX(r.x)}
                  cy={toMapY(r.z)}
                  r={r.isPlayer ? 4 : 2.8}
                  fill={r.color}
                  stroke="#090b12"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Hull + Subsystem Sockets */}
          <div className="flux-panel-subtle rounded-md px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-w-[175px] sm:min-w-[205px] pointer-events-auto relative">
            {hoveredTip && (
              <div className="absolute bottom-full left-0 mb-2 w-60 flux-panel rounded px-2.5 py-1.5 text-[11px] text-amber-100 pointer-events-none z-20">
                {hoveredTip}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-display mb-1">
              <span className="text-amber-200/80">{strings.hull}</span>
              <span className="tabular-nums text-amber-50 font-bold">
                {hud.durability}/{hud.maxDurability}
              </span>
            </div>
            <div className="h-1.5 sm:h-2 bg-slate-900 rounded-sm overflow-hidden border border-amber-500/20">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${hullPct}%`,
                  backgroundColor: hullPct > 55 ? '#2dd4bf' : hullPct > 28 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            {/* 4 Subsystem Status Sockets */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {subsystemList.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setHoveredTip(sub.tip)}
                  onMouseLeave={() => setHoveredTip(null)}
                  onFocus={() => setHoveredTip(sub.tip)}
                  onBlur={() => setHoveredTip(null)}
                  className="bg-[#0b0e17] border border-amber-500/20 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] tabular-nums"
                >
                  <span style={{ color: subsystemColor(sub.val) }}>{sub.icon}</span>
                  <span className="text-amber-100/85">{sub.val}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Compact Speedometer & Dose */}
          <div className="flex sm:hidden flux-panel-subtle rounded-md px-2.5 py-2 flex-col justify-between min-w-[122px]">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-[9px] font-display text-amber-200/70">
                  {strings.speed} · {strings.speedStep} {hud.speedStep}/8
                </div>
                <div className="text-xl font-display font-bold text-amber-50 tabular-nums leading-none">
                  {hud.speedKmh}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-display text-teal-300/80">{strings.dose}</div>
                <div className="text-sm font-display font-bold text-teal-300 tabular-nums leading-none">
                  {dosePct}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-0.5 mt-1.5" aria-label={`${strings.speedStep} ${hud.speedStep}/8`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-xs ${
                    step <= hud.speedStep
                      ? step >= 7
                        ? 'bg-teal-300'
                        : 'bg-amber-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="h-1.5 bg-slate-900 rounded-sm overflow-hidden border border-teal-500/25 mt-1">
              <div
                className="h-full bg-teal-400 transition-all duration-100"
                style={{ width: `${dosePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Touch Controls (pointer-capture safe so releasing outside never sticks) */}
        <div className="flex sm:hidden items-center justify-between w-full gap-1.5 pointer-events-auto touch-none">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onTouchSteer(1);
              }}
              onPointerUp={() => onTouchSteer(0)}
              onPointerCancel={() => onTouchSteer(0)}
              onLostPointerCapture={() => onTouchSteer(0)}
              className="flux-btn w-11 h-11 rounded-md font-display font-bold text-base select-none"
            >
              ◀
            </button>
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onTouchSteer(-1);
              }}
              onPointerUp={() => onTouchSteer(0)}
              onPointerCancel={() => onTouchSteer(0)}
              onLostPointerCapture={() => onTouchSteer(0)}
              className="flux-btn w-11 h-11 rounded-md font-display font-bold text-base select-none"
            >
              ▶
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTouchAbility();
              }}
              aria-label={strings.fluxSurge}
              className={`flux-btn w-10 h-11 rounded-md flex items-center justify-center select-none ${
                hud.abilityCooldown <= 0 ? 'border-teal-400/70 text-teal-200' : 'opacity-65'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onTouchDrift(true);
              }}
              onPointerUp={() => onTouchDrift(false)}
              onPointerCancel={() => onTouchDrift(false)}
              onLostPointerCapture={() => onTouchDrift(false)}
              className="flux-btn px-2 h-11 rounded-md text-[10px] select-none"
            >
              {strings.drift}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTouchHop();
              }}
              className="flux-btn px-2 h-11 rounded-md text-[10px] select-none"
            >
              {strings.hop}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onTouchThrottle(1);
              }}
              onPointerUp={() => onTouchThrottle(0)}
              onPointerCancel={() => onTouchThrottle(0)}
              onLostPointerCapture={() => onTouchThrottle(0)}
              className="flux-btn-primary px-3.5 h-11 rounded-md font-display text-xs font-bold select-none"
            >
              GAS
            </button>
          </div>
        </div>

        {/* Bottom-Right (Desktop): Speedometer, Dosimeter, Active Mutations & Flux Surge Skill */}
        <div className="hidden sm:flex items-end gap-3">
          {/* Active Mutation Buffs */}
          {hud.activeBuffs.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              {hud.activeBuffs.slice(0, 4).map((b) => {
                const def = MUTATIONS[b.id];
                return (
                  <div
                    key={b.id}
                    className="flux-panel-subtle rounded px-2.5 py-1 text-[11px] flex items-center gap-2"
                  >
                    <span className="font-display font-semibold" style={{ color: def.colorHex }}>
                      {pickLoc(language, def.nameEn, def.nameRu)}
                    </span>
                    {b.durationSec < 900 && (
                      <span className="tabular-nums text-amber-100/75">
                        {b.remainingSec.toFixed(1)}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Flux Surge Skill Slot with Tooltip */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTouchAbility();
            }}
            onMouseEnter={() =>
              setHoveredTip(`${strings.fluxSurge} [E]: Temporary high-speed radiation surge`)
            }
            onMouseLeave={() => setHoveredTip(null)}
            className={`pointer-events-auto flux-panel-subtle rounded-md w-16 h-16 flex flex-col items-center justify-center gap-0.5 ${
              hud.abilityCooldown <= 0 ? 'border-teal-400/70 text-teal-200' : 'opacity-65 text-slate-400'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-display tabular-nums">
              {hud.abilityCooldown > 0 ? `${hud.abilityCooldown}s` : '[E]'}
            </span>
          </button>

          {/* Dosimeter & 8-Step Speedometer Cluster */}
          <div className="flux-panel-subtle rounded-md px-4 py-2.5 min-w-[205px]">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[10px] font-display text-amber-200/70 tabular-nums">
                  {strings.speed} · {strings.speedStep} {hud.speedStep}/8
                </div>
                <div className="text-3xl font-display font-bold text-amber-50 tabular-nums leading-none">
                  {hud.speedKmh}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-display text-teal-300/80">{strings.dose}</div>
                <div className="text-xl font-display font-bold text-teal-300 tabular-nums leading-none">
                  {dosePct}
                  <span className="text-xs text-teal-200/60">/100</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1 mt-2" aria-label={`${strings.speedStep} ${hud.speedStep}/8`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-xs transition-colors duration-75 ${
                    step <= hud.speedStep
                      ? step >= 7
                        ? 'bg-teal-300'
                        : 'bg-amber-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="h-2 bg-slate-900 rounded-sm overflow-hidden border border-teal-500/25 mt-1.5">
              <div
                className="h-full bg-teal-400 transition-all duration-100"
                style={{ width: `${dosePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
