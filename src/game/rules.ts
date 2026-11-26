import { ALL_MUTATION_IDS, MUTATIONS } from './data/mutations';
import { CAMPAIGN_STAGES } from './data/campaign';
import type {
  BiomeId,
  ControlBindings,
  DifficultyLevel,
  FieldQuest,
  GhostSample,
  MemoryBeacon,
  MutationId,
  SaveState,
  SponsorContract,
  SponsorId,
  StoryFlags,
  SubsystemDamage,
  UpgradeModules,
} from './types';

export const DEFAULT_BINDINGS: ControlBindings = {
  throttle: 'KeyW',
  brake: 'KeyS',
  steerLeft: 'KeyA',
  steerRight: 'KeyD',
  drift: 'Space',
  hop: 'Mouse2', // Right Click
  ability: 'KeyE',
  resetCamera: 'KeyC',
  pause: 'Escape',
};

export const PLACEMENT_REWARDS = [500, 360, 260, 180, 140, 120, 100];

export const SAVE_STORAGE_KEY = 'flux_gp_save_v3';

export function createInitialSaveState(): SaveState {
  return {
    fluxite: 350,
    reputation: 50,
    unlockedChapters: ['1_1'],
    completedChapters: [],
    currentStageNumber: 1,
    modules: {
      engine: 0,
      chassis: 0,
      grip: 0,
      armor: 0,
    },
    permanentTraits: [],
    discoveredMutations: [],
    artifacts: [],
    storyFlags: {
      sold: null,
      collider: null,
      ending: null,
    },
    totalDose: 0,
    freeSeasonWins: 0,
    difficulty: 'classic',
    graphics: 'high',
    language: 'en', // English by default per All in one.txt
    bindings: { ...DEFAULT_BINDINGS },
    audioMuted: false,
    audioVolume: 0.55,
    activeSponsor: null,
    bestRunTimes: {},
    bestRunGhosts: {},
  };
}

export function loadSaveState(): SaveState {
  const fallback = createInitialSaveState();
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      ...fallback,
      ...parsed,
      modules: { ...fallback.modules, ...(parsed.modules ?? {}) },
      storyFlags: { ...fallback.storyFlags, ...(parsed.storyFlags ?? {}) },
      bindings: { ...fallback.bindings, ...(parsed.bindings ?? {}) },
      unlockedChapters: Array.isArray(parsed.unlockedChapters) && parsed.unlockedChapters.length > 0
        ? Array.from(new Set(['1_1', ...parsed.unlockedChapters]))
        : ['1_1'],
      completedChapters: Array.isArray(parsed.completedChapters) ? parsed.completedChapters : [],
      permanentTraits: Array.isArray(parsed.permanentTraits) ? parsed.permanentTraits.slice(0, 6) : [],
      discoveredMutations: Array.isArray(parsed.discoveredMutations) ? parsed.discoveredMutations : [],
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
      activeSponsor: parsed.activeSponsor ?? null,
      bestRunTimes: parsed.bestRunTimes && typeof parsed.bestRunTimes === 'object' ? parsed.bestRunTimes : {},
      bestRunGhosts: parsed.bestRunGhosts && typeof parsed.bestRunGhosts === 'object' ? parsed.bestRunGhosts : {},
    };
  } catch {
    return fallback;
  }
}

export function persistSaveState(state: SaveState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function calculateModuleCost(currentLevel: number): number {
  // Scenario §5: Стоимость уровня: 260 × (уровень + 1)
  return 260 * (currentLevel + 1);
}

export function upgradeModule(
  state: SaveState,
  moduleKey: keyof UpgradeModules,
): { nextState: SaveState; upgraded: boolean } {
  const currentLvl = state.modules[moduleKey];
  if (currentLvl >= 5) return { nextState: state, upgraded: false };
  const cost = calculateModuleCost(currentLvl);
  if (state.fluxite < cost) return { nextState: state, upgraded: false };
  return {
    upgraded: true,
    nextState: {
      ...state,
      fluxite: state.fluxite - cost,
      modules: {
        ...state.modules,
        [moduleKey]: currentLvl + 1,
      },
    },
  };
}

export function exciseTrait(
  state: SaveState,
  traitIndex: number,
): { nextState: SaveState; excised: boolean } {
  const cost = 150;
  if (traitIndex < 0 || traitIndex >= state.permanentTraits.length) {
    return { nextState: state, excised: false };
  }
  if (state.fluxite < cost) return { nextState: state, excised: false };
  const updated = state.permanentTraits.filter((_, idx) => idx !== traitIndex);
  return {
    excised: true,
    nextState: {
      ...state,
      fluxite: state.fluxite - cost,
      permanentTraits: updated,
    },
  };
}

export interface ComputedVehicleStats {
  maxSpeed: number;     // world units/s (42..75)
  acceleration: number; // world units/s^2
  handling: number;     // rad/s turn factor
  maxDurability: number;
  steeringBias: number; // asymmetric pull from damage
  suspensionBounce: number;
  hasSailFin: boolean;
  hasAcidTrail: boolean;
  hasSynapseGlow: boolean;
  hasChromophore: boolean;
  hasTendrils: boolean;
  hasHoloGhost: boolean;
  gravitySlip: boolean;
  coreLockout: boolean;
  steeringSpasm: boolean;
}

export function createPristineSubsystems(): SubsystemDamage {
  return {
    engine: 100,
    steering: 100,
    suspension: 100,
    armor: 100,
    steeringBias: 0,
  };
}

export function computeVehicleStats(
  modules: UpgradeModules,
  permanentTraits: MutationId[],
  activeTempMutations: MutationId[],
  subsystems: SubsystemDamage,
): ComputedVehicleStats {
  // Base stats calibrated to scenario AI speed = 30 + skill * 36 (~53..62.4)
  let maxSpeed = 48 + modules.engine * 4.2;
  let acceleration = 18 + modules.grip * 1.8;
  let handlingMult = 1 + modules.chassis * 0.07;
  const maxDurability = 100 + modules.armor * 10;

  let gravitySlip = false;
  let coreLockout = false;
  let steeringSpasm = false;

  const allTraits = [...permanentTraits, ...activeTempMutations];
  for (const id of allTraits) {
    const def = MUTATIONS[id];
    if (!def) continue;
    maxSpeed += def.speedDelta;
    acceleration += def.accelDelta;
    handlingMult += def.handlingPctDelta;
    if (def.gravitySlip) gravitySlip = true;
    if (def.coreLockout) coreLockout = true;
    if (def.steeringSpasm) steeringSpasm = true;
  }

  // Apply physical subsystem damage penalties
  const engineFactor = 0.55 + 0.45 * (subsystems.engine / 100);
  const steeringFactor = 0.50 + 0.50 * (subsystems.steering / 100);
  const suspensionGrip = 0.65 + 0.35 * (subsystems.suspension / 100);

  maxSpeed = Math.max(20, maxSpeed * engineFactor);
  acceleration = Math.max(8, acceleration * engineFactor);
  const handling = Math.max(0.45, 2.35 * handlingMult * steeringFactor * suspensionGrip);

  const hasFlag = (id: MutationId) => allTraits.includes(id);

  return {
    maxSpeed,
    acceleration,
    handling,
    maxDurability,
    steeringBias: subsystems.steeringBias * (1 - subsystems.steering / 100) * 0.85,
    suspensionBounce: (1 - subsystems.suspension / 100) * 0.6,
    hasSailFin: hasFlag('sail_fins'),
    hasAcidTrail: hasFlag('acid_exhaust'),
    hasSynapseGlow: hasFlag('synapse'),
    hasChromophore: hasFlag('chromophore'),
    hasTendrils: hasFlag('sticky_core'),
    hasHoloGhost: hasFlag('holo_decoy'),
    gravitySlip,
    coreLockout,
    steeringSpasm,
  };
}

export function applyImpactDamage(
  currentDurability: number,
  subsystems: SubsystemDamage,
  impactSpeed: number,
  massRatio: number, // attackerMass / playerMass
  sideOffset: number, // -1 = left side hit, 0 = front/rear, +1 = right side hit
  difficulty: DifficultyLevel,
): {
  nextDurability: number;
  nextSubsystems: SubsystemDamage;
  hullDamage: number;
} {
  const diffMult = difficulty === 'story' ? 0.65 : difficulty === 'apex' ? 1.3 : 1.0;
  const rawForce = Math.max(0, impactSpeed - 4) * 0.55 * Math.min(2.4, Math.max(0.5, massRatio)) * diffMult;
  if (rawForce <= 0.5) {
    return { nextDurability: currentDurability, nextSubsystems: subsystems, hullDamage: 0 };
  }

  // Armor absorbs up to 45% of internal subsystem damage while intact
  const armorIntegrity = subsystems.armor / 100;
  const armorMitigation = 1 - 0.45 * armorIntegrity;
  const hullDamage = Math.round(rawForce * armorMitigation * 10) / 10;

  const nextArmor = Math.max(0, subsystems.armor - rawForce * 1.45);
  const internalLeak = rawForce * (1.1 - armorIntegrity * 0.55);

  const isFront = Math.abs(sideOffset) < 0.4;
  const engineDmg = isFront ? internalLeak * 1.15 : internalLeak * 0.45;
  const steeringDmg = Math.abs(sideOffset) > 0.25 ? internalLeak * 1.25 : internalLeak * 0.5;
  const suspensionDmg = internalLeak * 0.9;

  const biasPush = sideOffset * 0.16;
  const nextBias = Math.max(-1, Math.min(1, subsystems.steeringBias + biasPush));

  return {
    nextDurability: Math.max(0, currentDurability - hullDamage),
    hullDamage,
    nextSubsystems: {
      engine: Math.max(10, subsystems.engine - engineDmg),
      steering: Math.max(10, subsystems.steering - steeringDmg),
      suspension: Math.max(10, subsystems.suspension - suspensionDmg),
      armor: nextArmor,
      steeringBias: nextBias,
    },
  };
}

export function repairSubsystemPartial(
  subsystems: SubsystemDamage,
  amount: number,
): SubsystemDamage {
  return {
    engine: Math.min(100, subsystems.engine + amount),
    steering: Math.min(100, subsystems.steering + amount),
    suspension: Math.min(100, subsystems.suspension + amount),
    armor: Math.min(100, subsystems.armor + amount * 0.8),
    steeringBias: subsystems.steeringBias * 0.5,
  };
}

export function rollMutationFromDose(
  stageNumber: number,
  intensity: number,
  rng: () => number = Math.random,
): MutationId {
  // Incidents become slightly more common at high intensity, boons ~58%, wild ~14%, flat ~8%, incident ~20%
  const incidentBoost = Math.min(0.12, Math.max(0, (intensity - 1.0) * 0.05));
  const roll = rng();

  const boons: MutationId[] = [
    'chromophore',
    'synapse',
    'sticky_core',
    'sail_fins',
    'acid_exhaust',
    'self_repair',
    'holo_decoy',
  ];
  const wilds: MutationId[] =
    stageNumber >= 5 ? ['grav_inversion', 'metal_whisper'] : ['grav_inversion'];
  const incidents: MutationId[] = ['core_overheat', 'steering_spasm', 'short_circuit'];

  if (roll < 0.58 - incidentBoost) {
    return boons[Math.floor(rng() * boons.length)];
  }
  if (roll < 0.72 - incidentBoost * 0.5) {
    return wilds[Math.floor(rng() * wilds.length)];
  }
  if (roll < 0.80 - incidentBoost * 0.5) {
    return 'panel_molt';
  }
  return incidents[Math.floor(rng() * incidents.length)];
}

export function rollPermanentTraits(
  sessionBoons: MutationId[],
  currentTraits: MutationId[],
  forceFirstChromophore = false,
  rng: () => number = Math.random,
): {
  nextTraits: MutationId[];
  newlyFixated: MutationId[];
  displaced: MutationId[];
} {
  const nextTraits = [...currentTraits];
  const newlyFixated: MutationId[] = [];
  const displaced: MutationId[] = [];

  for (const boonId of sessionBoons) {
    if (MUTATIONS[boonId]?.category !== 'boon') continue;
    const guaranteed = forceFirstChromophore && boonId === 'chromophore' && !nextTraits.includes('chromophore');
    const chance = guaranteed ? 1.0 : 0.4;
    if (rng() <= chance && !nextTraits.includes(boonId)) {
      if (nextTraits.length >= 6) {
        const removed = nextTraits.shift();
        if (removed) displaced.push(removed);
      }
      nextTraits.push(boonId);
      newlyFixated.push(boonId);
    }
  }

  return { nextTraits, newlyFixated, displaced };
}

export function calculateRaceRewards(params: {
  stageBaseReward: number;
  placement: number;
  dose: number;
  doubleDoseBonus?: boolean;
  dnf: boolean;
  difficulty: DifficultyLevel;
}): {
  stageReward: number;
  placementReward: number;
  doseReward: number;
  totalFluxiteEarned: number;
  reputationDelta: number;
} {
  if (params.dnf) {
    return {
      stageReward: 0,
      placementReward: 0,
      doseReward: 0,
      totalFluxiteEarned: 0,
      reputationDelta: -2,
    };
  }
  const idx = Math.max(0, Math.min(PLACEMENT_REWARDS.length - 1, params.placement - 1));
  const placementReward = PLACEMENT_REWARDS[idx];
  const baseDoseBonus = Math.min(400, Math.round(params.dose * 2));
  const doseReward = params.doubleDoseBonus ? baseDoseBonus * 2 : baseDoseBonus;
  const diffMult = params.difficulty === 'story' ? 1.1 : params.difficulty === 'apex' ? 1.25 : 1.0;

  const totalFluxiteEarned = Math.round(
    (params.stageBaseReward + placementReward + doseReward) * diffMult,
  );
  const reputationDelta = params.placement <= 3 ? 4 - params.placement : 0;

  return {
    stageReward: params.stageBaseReward,
    placementReward,
    doseReward,
    totalFluxiteEarned,
    reputationDelta,
  };
}

export function completeChapterProgression(
  state: SaveState,
  completedStageId: string,
  nextStageId: string | null,
  artifactId?: string,
): SaveState {
  // Never regress unlockedChapters or completedChapters on replay!
  const completedChapters = state.completedChapters.includes(completedStageId)
    ? state.completedChapters
    : [...state.completedChapters, completedStageId];

  const unlockedSet = new Set(state.unlockedChapters);
  unlockedSet.add(completedStageId);
  if (nextStageId) unlockedSet.add(nextStageId);

  const artifacts =
    artifactId && !state.artifacts.includes(artifactId)
      ? [...state.artifacts, artifactId]
      : state.artifacts;

  return {
    ...state,
    completedChapters,
    unlockedChapters: Array.from(unlockedSet),
    artifacts,
  };
}

export function getNextStageId(stageId: string): string | null {
  if (stageId === 'free_season') return 'free_season';
  const idx = CAMPAIGN_STAGES.findIndex((s) => s.id === stageId);
  if (idx === -1) return null;
  if (idx === CAMPAIGN_STAGES.length - 1) return 'free_season';
  return CAMPAIGN_STAGES[idx + 1].id;
}

export function prepareChapterEntryState(state: SaveState, stageId: string): SaveState {
  const unlockedSet = new Set(state.unlockedChapters);
  unlockedSet.add(stageId);
  const stage = CAMPAIGN_STAGES.find((s) => s.id === stageId);
  return {
    ...state,
    unlockedChapters: Array.from(unlockedSet),
    currentStageNumber: stage ? stage.stageNumber : 16,
  };
}

export function computeAiTargetSpeed(
  skill: number,
  playerProgress: number,
  aiProgress: number,
  difficulty: DifficultyLevel,
  playerHasHoloDecoy: boolean,
): number {
  // Scenario §8: Base AI speed = 30 + skill * 36, rubber-band ±16%
  const base = 30 + skill * 36;
  const diffScale = difficulty === 'story' ? 0.88 : difficulty === 'apex' ? 1.06 : 1.0;
  const gap = playerProgress - aiProgress;
  // Positive gap = player ahead -> AI speeds up up to +16%; negative = AI ahead -> slows down up to -16%
  const rubberBand = Math.max(-0.16, Math.min(0.16, gap * 2.2));
  const decoyPenalty = playerHasHoloDecoy ? 0.82 : 1.0;
  return base * diffScale * (1 + rubberBand) * decoyPenalty;
}

// ==========================================
// Procedural Track Spline & Geometry Math
// ==========================================

export interface TrackPoint2D {
  x: number;
  z: number;
  y: number;
}

export interface RadiationPatch {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  t: number; // 0..1 spline param
  lateralOffset: number;
  pulsePhase: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTrackControlPoints(
  seed: number,
  biome: BiomeId,
  stageNumber: number,
): TrackPoint2D[] {
  const rng = mulberry32(seed * 7919 + stageNumber * 131);
  const numPts = 14;
  // Compact scale for tight thrilling laps (approx 75-95m radius)
  const baseRadius = biome === 'epicenter' ? 92 : 76 + Math.min(18, stageNumber * 1.1);
  const points: TrackPoint2D[] = [];

  for (let i = 0; i < numPts; i++) {
    const angle = (i / numPts) * Math.PI * 2;
    // Keep start/finish straight clean around i=0, 1, numPts-1
    const isStartZone = i === 0 || i === 1 || i === numPts - 1;
    // v3.2 §3.2 p.6: Bounded curvature jitter to guarantee wide sweepable turns
    const radialJitter = isStartZone ? 1.0 : 0.78 + rng() * 0.44;
    const r = baseRadius * radialJitter;
    const elev =
      biome === 'needle' || biome === 'epicenter'
        ? Math.sin(angle * 2) * 3.8 + (isStartZone ? 0 : (rng() - 0.5) * 2.5)
        : biome === 'canyon'
          ? Math.cos(angle * 3) * 2.2
          : Math.sin(angle * 2) * 1.1;

    points.push({
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      y: isStartZone ? 0 : elev,
    });
  }

  // Smooth non-start control points with neighbors so curvature never spikes abruptly
  const smoothed = points.map((p, i) => {
    const isStartZone = i === 0 || i === 1 || i === numPts - 1;
    if (isStartZone) return { ...p };
    const prev = points[(i - 1 + numPts) % numPts];
    const next = points[(i + 1) % numPts];
    return {
      x: prev.x * 0.18 + p.x * 0.64 + next.x * 0.18,
      y: prev.y * 0.18 + p.y * 0.64 + next.y * 0.18,
      z: prev.z * 0.18 + p.z * 0.64 + next.z * 0.18,
    };
  });

  return smoothed;
}

export function generatePointToPointControlPoints(
  seed: number,
  biome: BiomeId,
  stageNumber: number,
): TrackPoint2D[] {
  const rng = mulberry32(seed * 6151 + stageNumber * 277);
  const numPts = 18;
  const stepDist = biome === 'epicenter' ? 78 : 68 + Math.min(10, stageNumber * 0.6);
  const phase = rng() * Math.PI * 2;
  const raw: TrackPoint2D[] = [];

  let curX = 0;
  let curZ = 0;
  for (let i = 0; i < numPts; i++) {
    const t = i / (numPts - 1);
    const isStartApron = i <= 2;
    const isFinishApron = i >= numPts - 2;

    if (i > 0) {
      curZ += stepDist;
      if (!isStartApron && !isFinishApron) {
        const sweep =
          Math.sin(t * Math.PI * 3.1 + phase) * 34 +
          Math.cos(t * Math.PI * 1.6 - phase) * 18 +
          (rng() - 0.5) * 20;
        curX += sweep;
      }
    }

    let elev = 0;
    if (!isStartApron && !isFinishApron) {
      if (biome === 'canyon') {
        elev = -Math.sin(t * Math.PI) * 7.5 + Math.sin(t * Math.PI * 3) * 2.2;
      } else if (biome === 'needle' || biome === 'epicenter') {
        elev = -t * 10.5 + Math.sin(t * Math.PI * 2.5) * 3.2;
      } else if (biome === 'spore') {
        elev = -Math.sin(t * Math.PI) * 5.2 + Math.cos(t * Math.PI * 4) * 1.4;
      } else {
        elev = Math.sin(t * Math.PI * 2) * 2.4;
      }
    } else if (isFinishApron && (biome === 'needle' || biome === 'epicenter')) {
      elev = -10.5;
    }

    raw.push({ x: curX, y: elev, z: curZ });
  }

  // Two-pass smoothing on interior points to enforce wide sweepable curvature (v3.2/v3.3 §3.2 п.6)
  let pts = raw.map((p) => ({ ...p }));
  for (let pass = 0; pass < 2; pass++) {
    pts = pts.map((p, i) => {
      if (i <= 2 || i >= numPts - 2) return { ...p };
      const prev = pts[i - 1];
      const next = pts[i + 1];
      return {
        x: prev.x * 0.22 + p.x * 0.56 + next.x * 0.22,
        y: prev.y * 0.22 + p.y * 0.56 + next.y * 0.22,
        z: prev.z * 0.22 + p.z * 0.56 + next.z * 0.22,
      };
    });
  }
  return pts;
}

export function sampleOpenCatmullRom(
  controlPoints: TrackPoint2D[],
  samples = 340,
): TrackPoint2D[] {
  const n = controlPoints.length;
  const out: TrackPoint2D[] = [];
  if (n < 2) return out;
  const segCount = n - 1;

  for (let i = 0; i < samples; i++) {
    const u = (i / Math.max(1, samples - 1)) * segCount;
    const idx = Math.min(segCount - 1, Math.floor(u));
    const t = Math.max(0, Math.min(1, u - idx));
    const p0 = controlPoints[Math.max(0, idx - 1)];
    const p1 = controlPoints[idx];
    const p2 = controlPoints[Math.min(n - 1, idx + 1)];
    const p3 = controlPoints[Math.min(n - 1, idx + 2)];

    const t2 = t * t;
    const t3 = t2 * t;
    const interp = (a: number, b: number, c: number, d: number) =>
      0.5 *
      (2 * b +
        (-a + c) * t +
        (2 * a - 5 * b + 4 * c - d) * t2 +
        (-a + 3 * b - 3 * c + d) * t3);

    out.push({
      x: interp(p0.x, p1.x, p2.x, p3.x),
      y: interp(p0.y, p1.y, p2.y, p3.y),
      z: interp(p0.z, p1.z, p2.z, p3.z),
    });
  }
  return out;
}

export function sampleClosedCatmullRom(
  controlPoints: TrackPoint2D[],
  samples = 240,
): TrackPoint2D[] {
  const n = controlPoints.length;
  const out: TrackPoint2D[] = [];
  for (let i = 0; i < samples; i++) {
    const u = (i / samples) * n;
    const idx = Math.floor(u);
    const t = u - idx;
    const p0 = controlPoints[(idx - 1 + n) % n];
    const p1 = controlPoints[idx % n];
    const p2 = controlPoints[(idx + 1) % n];
    const p3 = controlPoints[(idx + 2) % n];

    const t2 = t * t;
    const t3 = t2 * t;

    const interp = (a: number, b: number, c: number, d: number) =>
      0.5 *
      (2 * b +
        (-a + c) * t +
        (2 * a - 5 * b + 4 * c - d) * t2 +
        (-a + 3 * b - 3 * c + d) * t3);

    out.push({
      x: interp(p0.x, p1.x, p2.x, p3.x),
      y: interp(p0.y, p1.y, p2.y, p3.y),
      z: interp(p0.z, p1.z, p2.z, p3.z),
    });
  }
  return out;
}

export function projectPointToTrack(
  px: number,
  pz: number,
  sampledPoints: TrackPoint2D[],
  trackHalfWidth = 8.5,
  closed = true,
): {
  nearestIndex: number;
  progress: number;
  distanceFromCenter: number;
  signedLateral: number;
  offTrack: boolean;
  trackY: number;
  tangentX: number;
  tangentZ: number;
} {
  let bestIdx = 0;
  let bestDistSq = Infinity;
  const len = sampledPoints.length;

  for (let i = 0; i < len; i++) {
    const p = sampledPoints[i];
    const dx = px - p.x;
    const dz = pz - p.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestIdx = i;
    }
  }

  const cur = sampledPoints[bestIdx];
  const prev = !closed && bestIdx >= len - 1 ? sampledPoints[Math.max(0, len - 2)] : cur;
  const next = closed
    ? sampledPoints[(bestIdx + 1) % len]
    : sampledPoints[Math.min(len - 1, bestIdx + 1)];
  let tx = next.x - prev.x;
  let tz = next.z - prev.z;
  const tLen = Math.hypot(tx, tz) || 1;
  tx /= tLen;
  tz /= tLen;

  // Right normal in XZ plane
  const nx = -tz;
  const nz = tx;
  const dx = px - cur.x;
  const dz = pz - cur.z;
  const signedLateral = dx * nx + dz * nz;
  const dist = Math.sqrt(bestDistSq);

  return {
    nearestIndex: bestIdx,
    progress: closed ? bestIdx / len : bestIdx / Math.max(1, len - 1),
    distanceFromCenter: dist,
    signedLateral,
    offTrack: Math.abs(signedLateral) > trackHalfWidth,
    trackY: cur.y,
    tangentX: tx,
    tangentZ: tz,
  };
}

export function generateRadiationPatches(
  sampledPoints: TrackPoint2D[],
  seed: number,
  intensity: number,
  closed = true,
): RadiationPatch[] {
  const rng = mulberry32(seed * 3571 + 99);
  const count = Math.round((closed ? 14 : 22) + intensity * 6);
  const patches: RadiationPatch[] = [];
  const n = sampledPoints.length;

  for (let i = 0; i < count; i++) {
    const rawT = (i + 0.35 + rng() * 0.4) / count;
    const t = closed ? rawT : 0.09 + rawT * 0.85;
    const idx = closed ? Math.floor(t * n) % n : Math.min(n - 2, Math.floor(t * (n - 1)));
    const cur = sampledPoints[idx];
    const next = closed ? sampledPoints[(idx + 1) % n] : sampledPoints[Math.min(n - 1, idx + 1)];
    const tx = next.x - cur.x;
    const tz = next.z - cur.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const lateral = (rng() - 0.5) * 11.5;

    patches.push({
      id: i,
      x: cur.x + nx * lateral,
      y: cur.y + 0.06,
      z: cur.z + nz * lateral,
      radius: 2.8 + rng() * 1.6,
      t,
      lateralOffset: lateral,
      pulsePhase: rng() * Math.PI * 2,
    });
  }
  return patches;
}

export interface ResonanceVent {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  radius: number;
}

export function generateResonanceVents(
  sampledPoints: TrackPoint2D[],
  seed: number,
  closed = true,
): ResonanceVent[] {
  const rng = mulberry32(seed * 9137 + 53);
  const count = closed ? 6 : 8;
  const n = sampledPoints.length;
  const vents: ResonanceVent[] = [];

  for (let i = 0; i < count; i++) {
    const rawT = (i + 0.5) / count;
    const t = closed ? rawT : 0.1 + rawT * 0.84;
    const idx = closed ? Math.floor(t * n) % n : Math.min(n - 2, Math.floor(t * (n - 1)));
    const cur = sampledPoints[idx];
    const next = closed ? sampledPoints[(idx + 1) % n] : sampledPoints[Math.min(n - 1, idx + 1)];
    const tx = next.x - cur.x;
    const tz = next.z - cur.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const lateral = (rng() - 0.5) * 8.0;

    vents.push({
      id: i,
      x: cur.x + nx * lateral,
      y: cur.y + 0.08,
      z: cur.z + nz * lateral,
      yaw: Math.atan2(tx, tz),
      radius: 2.8,
    });
  }
  return vents;
}

export function generateStageFieldQuest(stageNumber: number, intensity: number): FieldQuest {
  const mod = stageNumber % 3;
  if (mod === 1) {
    const targetDose = Math.round(90 + intensity * 40);
    return {
      kind: 'flux_conduit',
      titleEn: 'Flux Conduit',
      titleRu: 'Проводник Флукса',
      descEn: `Absorb ${targetDose} total radiation dose during the heat.`,
      descRu: `Поглотите не менее ${targetDose} дозы излучения за заезд.`,
      bonusFluxite: 120 + stageNumber * 10,
      bonusReputation: 4,
      targetValue: targetDose,
    };
  }
  if (mod === 2) {
    return {
      kind: 'clean_line',
      titleEn: 'Clean Racing Line',
      titleRu: 'Чистая траектория',
      descEn: 'Finish the heat without ramming any rival.',
      descRu: 'Завершите заезд, не тараня соперников.',
      bonusFluxite: 140 + stageNumber * 10,
      bonusReputation: 6,
      targetValue: 0,
    };
  }
  return {
    kind: 'iron_chassis',
    titleEn: 'Iron Chassis',
    titleRu: 'Целый каркас',
    descEn: 'Finish with at least 75% hull durability remaining.',
    descRu: 'Финишируйте с прочностью корпуса не ниже 75%.',
    bonusFluxite: 130 + stageNumber * 10,
    bonusReputation: 5,
    targetValue: 75,
  };
}

export function evaluateFieldQuest(
  quest: FieldQuest,
  stats: {
    dnf: boolean;
    totalDose: number;
    ramsCommitted: number;
    hullPercent: number;
  },
): { completed: boolean; status: 'active' | 'completed' | 'failed'; current: number } {
  if (stats.dnf) {
    return { completed: false, status: 'failed', current: 0 };
  }
  if (quest.kind === 'flux_conduit') {
    const cur = Math.round(stats.totalDose);
    const done = cur >= quest.targetValue;
    return { completed: done, status: done ? 'completed' : 'active', current: cur };
  }
  if (quest.kind === 'clean_line') {
    const failed = stats.ramsCommitted > 0;
    return {
      completed: !failed,
      status: failed ? 'failed' : 'completed',
      current: stats.ramsCommitted,
    };
  }
  const curHull = Math.round(stats.hullPercent);
  const intact = curHull >= quest.targetValue;
  return {
    completed: intact,
    status: intact ? 'completed' : 'failed',
    current: curHull,
  };
}

export interface TrackArchMarker {
  x: number;
  y: number;
  z: number;
  yaw: number;
  sectionIndex: number;
}

export function generateTrackSectionArches(
  sampledPoints: TrackPoint2D[],
  closed = true,
): TrackArchMarker[] {
  const n = sampledPoints.length;
  const arches: TrackArchMarker[] = [];
  // Segment gateways (v3.3 §5.3/5.4: 33% & 67% segment transitions + 86% approach gate)
  const fractions = closed ? [0.2, 0.45, 0.68, 0.88] : [0.33, 0.66, 0.86];
  fractions.forEach((f, idx) => {
    const ptIdx = closed ? Math.floor(f * n) % n : Math.min(n - 2, Math.floor(f * (n - 1)));
    const pt = sampledPoints[ptIdx];
    const next = closed ? sampledPoints[(ptIdx + 1) % n] : sampledPoints[Math.min(n - 1, ptIdx + 1)];
    arches.push({
      x: pt.x,
      y: pt.y,
      z: pt.z,
      yaw: Math.atan2(next.x - pt.x, next.z - pt.z),
      sectionIndex: idx,
    });
  });
  return arches;
}

export function generateSharpCornerMarkers(
  sampledPoints: TrackPoint2D[],
  closed = true,
): TrackArchMarker[] {
  const n = sampledPoints.length;
  const markers: TrackArchMarker[] = [];
  let lastPlacedIdx = -20;
  const startIdx = closed ? 8 : 14;
  const endIdx = closed ? n - 8 : n - 12;

  for (let i = startIdx; i < endIdx; i++) {
    if (i - lastPlacedIdx < 16) continue;
    const prev = closed ? sampledPoints[(i - 4 + n) % n] : sampledPoints[Math.max(0, i - 4)];
    const cur = sampledPoints[i];
    const next = closed ? sampledPoints[(i + 4) % n] : sampledPoints[Math.min(n - 1, i + 4)];

    const ax = cur.x - prev.x;
    const az = cur.z - prev.z;
    const bx = next.x - cur.x;
    const bz = next.z - cur.z;
    const lenA = Math.hypot(ax, az) || 1;
    const lenB = Math.hypot(bx, bz) || 1;
    const dot = Math.max(-1, Math.min(1, (ax * bx + az * bz) / (lenA * lenB)));
    const turnAngle = Math.acos(dot);

    if (turnAngle > 0.22) {
      const entryIdx = closed ? (i - 5 + n) % n : Math.max(4, i - 5);
      const ep = sampledPoints[entryIdx];
      const epNext = closed
        ? sampledPoints[(entryIdx + 1) % n]
        : sampledPoints[Math.min(n - 1, entryIdx + 1)];
      const tx = epNext.x - ep.x;
      const tz = epNext.z - ep.z;
      const tLen = Math.hypot(tx, tz) || 1;
      const nx = -tz / tLen;
      const nz = tx / tLen;
      const cross = ax * bz - az * bx;
      const outerSide = cross >= 0 ? -1 : 1;

      markers.push({
        x: ep.x + nx * outerSide * 9.8,
        y: ep.y,
        z: ep.z + nz * outerSide * 9.8,
        yaw: Math.atan2(tx, tz),
        sectionIndex: markers.length,
      });
      lastPlacedIdx = i;
    }
  }
  return markers;
}

export function computeSpeedStep(speed: number, maxSpeed: number): number {
  const abs = Math.abs(speed);
  if (abs <= 0.6 || maxSpeed <= 0) return 0;
  const ratio = Math.min(1, abs / maxSpeed);
  return Math.min(8, Math.max(1, Math.ceil(ratio * 8)));
}

export function calculateNearMissBonus(nearMissCount: number): number {
  if (nearMissCount <= 0) return 0;
  return Math.min(180, Math.round(nearMissCount) * 15);
}

const MEMORY_BEACON_ENTRIES = [
  {
    nameEn: 'Bolt #07 · Mira Vane',
    nameRu: 'Болт №07 · Мира Вэйн',
    loreEn: 'Stamped inside an oxidized gearbox: "She drove an unshielded bucket forty laps and listened to the sand sing."',
    loreRu: 'Выбито на окисленной шестерне: «Она прошла сорок кругов на ржавом корыте и слышала песню песков».',
  },
  {
    nameEn: 'Bolt #19 · Khet Twins',
    nameRu: 'Болт №19 · Близнецы Кхет',
    loreEn: 'Welded beside the outer berm: "Two hulls fused at the second turn; one finished first, neither argued."',
    loreRu: 'Приварено на внешнем отвале: «Два корпуса срослись на втором вираже; один пришёл первым, никто не спорил».',
  },
  {
    nameEn: 'Bolt #44 · Old Kotyl',
    nameRu: 'Болт №44 · Старый Котыл',
    loreEn: 'Engraved by the Artisan Guild: "Every bolt remembers the hand that tightened it—and the turn it survived."',
    loreRu: 'Гравировка Цеха Мастеров: «Каждый болт помнит руку механика и поворот, который пережил».',
  },
  {
    nameEn: 'Bolt #62 · First Finisher',
    nameRu: 'Болт №62 · Первый Финишер',
    loreEn: 'Found near a crystalline split: "Before the League kept lap times, the planet was already keeping score."',
    loreRu: 'Найдено у кристаллического разлома: «Ещё до Лиги сама планета уже вела счёт кругам».',
  },
  {
    nameEn: 'Bolt #88 · Vella’s Spar',
    nameRu: 'Болт №88 · Рей Веллы',
    loreEn: 'Salt-bleached spar bolt: "Wind remembers no brakes, only open sails at apex."',
    loreRu: 'Соляной болт-флюгер: «Ветер не знает тормозов — только открытый парус на апексе».',
  },
];

export function generateMemoryBeacons(
  sampledPoints: TrackPoint2D[],
  seed: number,
  stageNumber: number,
  closed = true,
): MemoryBeacon[] {
  const n = sampledPoints.length;
  const beacons: MemoryBeacon[] = [];
  const count = 3;
  for (let i = 0; i < count; i++) {
    const t = 0.18 + i * 0.28 + (((seed * (i + 3)) % 7) - 3) * 0.015;
    const idx = closed
      ? Math.floor((((t % 1) + 1) % 1) * n)
      : Math.min(n - 4, Math.max(8, Math.floor(t * (n - 1))));
    const pt = sampledPoints[idx];
    const next = closed ? sampledPoints[(idx + 1) % n] : sampledPoints[Math.min(n - 1, idx + 1)];
    const tx = next.x - pt.x;
    const tz = next.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const side = i % 2 === 0 ? 1 : -1;
    const latOffset = side * 5.6;
    const entry = MEMORY_BEACON_ENTRIES[(stageNumber + i) % MEMORY_BEACON_ENTRIES.length];
    beacons.push({
      id: i,
      x: pt.x + nx * latOffset,
      y: pt.y,
      z: pt.z + nz * latOffset,
      yaw: Math.atan2(tx, tz),
      collected: false,
      nameEn: entry.nameEn,
      nameRu: entry.nameRu,
      loreEn: entry.loreEn,
      loreRu: entry.loreRu,
    });
  }
  return beacons;
}

export interface HeraldDispatch {
  id: string;
  headlineEn: string;
  headlineRu: string;
  bodyEn: string;
  bodyRu: string;
  tag: 'league' | 'rumor' | 'anomaly';
}

export function buildHeraldDispatches(
  completedChapters: string[],
  reputation: number,
  storyFlags: StoryFlags,
): HeraldDispatch[] {
  const items: HeraldDispatch[] = [
    {
      id: 'herald_open',
      headlineEn: 'SEASON BULLETIN · QUALIFIERS UNDERWAY',
      headlineRu: 'ВЕСТНИК СЕЗОНА · СТАРТ КВАЛИФИКАЦИИ',
      bodyEn: 'Judge Call reminds crews: surface mutations remain legally ambiguous, yet telemetry proves Dusk-9’s chassis adapts faster than Guild blueprints allow.',
      bodyRu: 'Судья Калл напоминает экипажам: поверхностные мутации юридически не определены, но телеметрия «Сумрака-9» показывает адаптацию быстрее чертежей Цеха.',
      tag: 'league',
    },
    {
      id: 'herald_bolts',
      headlineEn: 'ARTISAN NOTICE · NAMES ON THE BOLTS',
      headlineRu: 'ЗАМЕТКА ЦЕХА · ИМЕНА НА БОЛТАХ',
      bodyEn: 'Salvage crews report dozens of stamped brass memorial beacons glowing along apex shoulders. Pilots who salute them gain League standing and salvage credits.',
      bodyRu: 'Разборщики сообщают о десятках латунных памятных маяков на внешних виражах. Пилоты, отмечающие их по ходу заезда, получают репутацию и флюксит.',
      tag: 'rumor',
    },
  ];

  if (completedChapters.length >= 2) {
    items.push({
      id: 'herald_spore',
      headlineEn: 'ANOMALY DESK · WHISPER FISSURE SURGE',
      headlineRu: 'СВОДКА АНОМАЛИЙ · ВСПЛЕСК ШЁПОТА',
      bodyEn: 'Seismic cracks along the basin are venting ionized fluxite crystals. Engineers urge pilots to trigger Whisper Radar [Tab] before cutting blind apexes.',
      bodyRu: 'В разломах бассейна отмечены выбросы ионизированного флюксита. Инженеры советуют включать Радар Шёпота [Tab] перед слепыми виражами.',
      tag: 'anomaly',
    });
  }

  if (storyFlags.sold === true) {
    items.push({
      id: 'herald_sold',
      headlineEn: 'MARKET WIRE · DIK-7 ACQUIRES BIO-LOGS',
      headlineRu: 'БИРЖА · ДИК-7 ВЫКУПИЛ ТЕЛЕМЕТРИЮ',
      bodyEn: 'Frangi brokers celebrate fresh mutation data sold directly from Dusk-9 telemetry, while Nomad crews whisper of unhonored paddock codes.',
      bodyRu: 'Брокеры франги отмечают покупку свежих данных мутаций у команды «Сумрака-9», тогда как Кочевницы Пыли сдержанно молчат в паддоке.',
      tag: 'rumor',
    });
  }

  if (reputation >= 65) {
    items.push({
      id: 'herald_rep',
      headlineEn: 'PADDOCK STANDINGS · CLEAN LINE RESPECT',
      headlineRu: 'РЕЙТИНГ ПАДДОКА · УВАЖЕНИЕ ТРАССЫ',
      bodyEn: `With League Reputation at ${reputation}/100, Marshal patrols clear priority lanes and Stone Matriarchs grant open passage near quarry bends.`,
      bodyRu: `При репутации Лиги ${reputation}/100 маршалы открывают приоритетные коридоры, а Каменные Матриархи уступают внутренний радиус.`,
      tag: 'league',
    });
  }

  if (completedChapters.includes('1_15')) {
    items.push({
      id: 'herald_finale',
      headlineEn: storyFlags.ending === 'asleep'
        ? 'SPECIAL EDITION · SILENCE ACROSS THE NEEDLE'
        : 'SPECIAL EDITION · THE PLANET ANSWERS BACK',
      headlineRu: storyFlags.ending === 'asleep'
        ? 'ЭКСТРЕННЫЙ ВЫПУСК · ТИШИНА НАД ИГЛОЙ'
        : 'ЭКСТРЕННЫЙ ВЫПУСК · ПЛАНЕТА ОТВЕТИЛА',
      bodyEn: storyFlags.ending === 'asleep'
        ? 'Forty seasons of mutagenic dust fade into cold basalt stillness. The Free Season remains open for archival runs.'
        : 'Every radio tower along the equator relays harmonic telemetry from the Root. The Free Season welcomes awakened hulls.',
      bodyRu: storyFlags.ending === 'asleep'
        ? 'Сорок сезонов мутагенной пыли стихают в холодном базальте. Вольный сезон открыт для архивных заездов.'
        : 'Все радиовышки экватора транслируют гармонический сигнал Корня. Вольный сезон открыт для пробуждённых болидов.',
      tag: 'anomaly',
    });
  }

  return items;
}

export function discoverMutation(state: SaveState, mutationId: MutationId): SaveState {
  if (state.discoveredMutations.includes(mutationId)) return state;
  return {
    ...state,
    discoveredMutations: [...state.discoveredMutations, mutationId],
  };
}

export const ALL_DISCOVERABLE_MUTATIONS = ALL_MUTATION_IDS;

// ==========================================
// v3.3+ Mid-Route Service Fork & Weather Fronts
// ==========================================

export interface SplitForkZone {
  startT: number;
  endT: number;
  repairBranchPoints: TrackPoint2D[];
  repairPad: { x: number; y: number; z: number; radius: number };
  signpost: { x: number; y: number; z: number; yaw: number };
  fluxVents: ResonanceVent[];
}

export function generateSplitForkZone(
  sampledPoints: TrackPoint2D[],
  closed: boolean,
): SplitForkZone | null {
  if (closed || sampledPoints.length < 40) return null;
  const n = sampledPoints.length;
  const startT = 0.43;
  const endT = 0.57;
  const startIdx = Math.floor(startT * (n - 1));
  const endIdx = Math.min(n - 2, Math.floor(endT * (n - 1)));
  if (endIdx - startIdx < 8) return null;

  const repairBranchPoints: TrackPoint2D[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const u = (i - startIdx) / Math.max(1, endIdx - startIdx);
    const cur = sampledPoints[i];
    const next = sampledPoints[Math.min(n - 1, i + 1)];
    const tx = next.x - cur.x;
    const tz = next.z - cur.z;
    const len = Math.hypot(tx, tz) || 1;
    // Left normal (-tz/len, tx/len is right normal when yaw=atan2(tx,tz)? Wait:
    // Let's match rules.ts convention: nx = -tz/len, nz = tx/len.
    // Side offset -17 * sin(u * PI) swings cleanly to the opposite shoulder of main road!
    const nx = -tz / len;
    const nz = tx / len;
    const lateral = -16.5 * Math.sin(u * Math.PI);
    repairBranchPoints.push({
      x: cur.x + nx * lateral,
      y: cur.y,
      z: cur.z + nz * lateral,
    });
  }

  const midIdx = Math.floor(repairBranchPoints.length / 2);
  const repairMid = repairBranchPoints[midIdx];

  const signIdx = Math.max(4, startIdx - 6);
  const sPt = sampledPoints[signIdx];
  const sNext = sampledPoints[Math.min(n - 1, signIdx + 1)];

  const fluxVents: ResonanceVent[] = [0.35, 0.68].map((u, idx) => {
    const fIdx = Math.min(n - 2, startIdx + Math.floor(u * (endIdx - startIdx)));
    const pt = sampledPoints[fIdx];
    const nxPt = sampledPoints[fIdx + 1];
    const tx = nxPt.x - pt.x;
    const tz = nxPt.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    return {
      id: 100 + idx,
      x: pt.x + nx * 2.4,
      y: pt.y + 0.08,
      z: pt.z + nz * 2.4,
      yaw: Math.atan2(tx, tz),
      radius: 3.1,
    };
  });

  return {
    startT,
    endT,
    repairBranchPoints,
    repairPad: {
      x: repairMid.x,
      y: repairMid.y + 0.08,
      z: repairMid.z,
      radius: 3.6,
    },
    signpost: {
      x: sPt.x,
      y: sPt.y,
      z: sPt.z,
      yaw: Math.atan2(sNext.x - sPt.x, sNext.z - sPt.z),
    },
    fluxVents,
  };
}

export function projectPointToForkTrack(
  px: number,
  pz: number,
  sampledPoints: TrackPoint2D[],
  trackHalfWidth = 8.5,
  closed = true,
  forkZone: SplitForkZone | null = null,
) {
  const mainProj = projectPointToTrack(px, pz, sampledPoints, trackHalfWidth, closed);
  if (!forkZone || closed || forkZone.repairBranchPoints.length < 2) {
    return { ...mainProj, onRepairBranch: false };
  }

  const branchProj = projectPointToTrack(px, pz, forkZone.repairBranchPoints, 4.8, false);
  // If closer to the Repair Service Lane and within its 9.6m corridor
  if (branchProj.distanceFromCenter < mainProj.distanceFromCenter && branchProj.distanceFromCenter <= 5.4) {
    // Interpolate global progress cleanly within [forkZone.startT, forkZone.endT]
    const globalProgress =
      forkZone.startT + branchProj.progress * (forkZone.endT - forkZone.startT);
    return {
      ...branchProj,
      progress: globalProgress,
      offTrack: branchProj.distanceFromCenter > 4.8,
      onRepairBranch: true,
    };
  }
  return { ...mainProj, onRepairBranch: false };
}

export interface WeatherFrontZone {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  radius: number;
  crosswindForce: number;
}

export function generateWeatherFronts(
  sampledPoints: TrackPoint2D[],
  seed: number,
  closed: boolean,
): WeatherFrontZone[] {
  const n = sampledPoints.length;
  if (n < 20) return [];
  const rng = mulberry32(seed * 4999 + 17);
  const fractions = closed ? [0.32, 0.74] : [0.27, 0.72];
  return fractions.map((f, idx) => {
    const pIdx = closed ? Math.floor(f * n) % n : Math.min(n - 2, Math.floor(f * (n - 1)));
    const pt = sampledPoints[pIdx];
    const next = closed ? sampledPoints[(pIdx + 1) % n] : sampledPoints[Math.min(n - 1, pIdx + 1)];
    const sign = idx % 2 === 0 ? 1 : -1;
    return {
      id: idx,
      x: pt.x,
      y: pt.y,
      z: pt.z,
      yaw: Math.atan2(next.x - pt.x, next.z - pt.z),
      radius: 22,
      crosswindForce: sign * (1.8 + rng() * 0.9),
    };
  });
}

export function computeWeatherFrontEffect(
  biome: BiomeId,
  hasSailFin: boolean,
  crosswindForce: number,
): { speedBonus: number; lateralPush: number } {
  const biomeScale =
    biome === 'storm' || biome === 'canyon'
      ? 1.15
      : biome === 'spore' || biome === 'crystal'
        ? 0.95
        : 0.75;
  return {
    speedBonus: hasSailFin ? 6.5 * biomeScale : 0,
    lateralPush: hasSailFin ? crosswindForce * 0.25 : crosswindForce * biomeScale,
  };
}

// ==========================================
// Faction Sponsor Contracts, Cursor Drive & Ghost Telemetry
// ==========================================

export const SPONSOR_CONTRACTS: Record<SponsorId, SponsorContract> = {
  league: {
    id: 'league',
    factionEn: 'League Marshals',
    factionRu: 'Маршалы Лиги',
    titleEn: 'Clean Podium Mandate',
    titleRu: 'Чистый подиум',
    descEn: 'Finish Top 3 with zero rival rams (+160 ◆, +5 Rep).',
    descRu: 'Финиш в топ-3 без таранов соперников (+160 ◆, +5 Реп).',
    bonusFluxite: 160,
    bonusReputation: 5,
  },
  nomads: {
    id: 'nomads',
    factionEn: 'Dust Nomads',
    factionRu: 'Кочевницы Пыли',
    titleEn: 'Wild Pulse Runner',
    titleRu: 'Бегун импульса',
    descEn: 'Absorb >= 110 Dose and collect >= 1 Bolt Memorial (+190 ◆, +4 Rep).',
    descRu: 'Набрать >= 110 дозы и отметить >= 1 памятный болт (+190 ◆, +4 Реп).',
    bonusFluxite: 190,
    bonusReputation: 4,
  },
  artisan: {
    id: 'artisan',
    factionEn: 'Artisan Guild',
    factionRu: 'Цех Мастеров',
    titleEn: 'Precision Chassis Showcase',
    titleRu: 'Эталонная сохранность',
    descEn: 'Finish with >= 70% hull and >= 2 Near-Misses (+175 ◆, +5 Rep).',
    descRu: 'Финиш с корпусом >= 70% и >= 2 опасными обгонами (+175 ◆, +5 Реп).',
    bonusFluxite: 175,
    bonusReputation: 5,
  },
};

export function evaluateSponsorContract(
  sponsorId: SponsorId | null | undefined,
  stats: {
    dnf: boolean;
    placement: number;
    ramsCommitted: number;
    totalDose: number;
    beaconsCollected: number;
    hullPercent: number;
    nearMissCount: number;
  },
): { completed: boolean; bonusFluxite: number; bonusReputation: number } {
  if (!sponsorId || stats.dnf) {
    return { completed: false, bonusFluxite: 0, bonusReputation: 0 };
  }
  const spec = SPONSOR_CONTRACTS[sponsorId];
  if (!spec) return { completed: false, bonusFluxite: 0, bonusReputation: 0 };

  let met = false;
  if (sponsorId === 'league') {
    met = stats.placement <= 3 && stats.ramsCommitted === 0;
  } else if (sponsorId === 'nomads') {
    met = stats.totalDose >= 110 && stats.beaconsCollected >= 1;
  } else if (sponsorId === 'artisan') {
    met = stats.hullPercent >= 70 && stats.nearMissCount >= 2;
  }

  return met
    ? { completed: true, bonusFluxite: spec.bonusFluxite, bonusReputation: spec.bonusReputation }
    : { completed: false, bonusFluxite: 0, bonusReputation: 0 };
}

export function computeCursorDriveInput(
  px: number,
  pz: number,
  pyaw: number,
  targetX: number,
  targetZ: number,
): { throttle: number; steer: number } {
  const dx = targetX - px;
  const dz = targetZ - pz;
  const dist = Math.hypot(dx, dz);
  if (!Number.isFinite(dist) || dist < 1.8) {
    return { throttle: 0, steer: 0 };
  }
  const desiredYaw = Math.atan2(dx, dz);
  let diff = desiredYaw - pyaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const steer = Math.max(-1, Math.min(1, diff / 0.55));
  const throttle = Math.abs(diff) > 2.25 ? 0.55 : 1.0;
  return { throttle, steer };
}

export function sampleGhostPose(
  samples: GhostSample[] | undefined,
  elapsedSec: number,
): GhostSample | null {
  if (!samples || samples.length === 0) return null;
  if (elapsedSec <= samples[0].t) return samples[0];
  const last = samples[samples.length - 1];
  if (elapsedSec >= last.t) return last;

  let lo = 0;
  let hi = samples.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= elapsedSec) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = Math.max(0.0001, b.t - a.t);
  const alpha = Math.max(0, Math.min(1, (elapsedSec - a.t) / span));

  let dyaw = b.yaw - a.yaw;
  while (dyaw > Math.PI) dyaw -= Math.PI * 2;
  while (dyaw < -Math.PI) dyaw += Math.PI * 2;

  return {
    t: elapsedSec,
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
    z: a.z + (b.z - a.z) * alpha,
    yaw: a.yaw + dyaw * alpha,
  };
}


