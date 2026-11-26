export type GraphicsLevel = 'low' | 'medium' | 'high' | 'ultra';

export type DifficultyLevel = 'story' | 'classic' | 'apex';

export type LanguageCode =
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'zh'
  | 'ar'
  | 'uk'
  | 'ru'
  | 'ja'
  | 'pl'
  | 'it'
  | 'vi'
  | 'fa'
  | 'elvish'
  | 'orcish';

export type BiomeId =
  | 'crystal'
  | 'canyon'
  | 'spore'
  | 'storm'
  | 'needle'
  | 'epicenter';

export type CharacterId =
  | 'taka'
  | 'call'
  | 'kresh'
  | 'vella'
  | 'gaol'
  | 'dik7'
  | 'omm'
  | 'nikol'
  | 'nullie'
  | 'voice';

export type MutationId =
  | 'chromophore'
  | 'synapse'
  | 'sticky_core'
  | 'sail_fins'
  | 'acid_exhaust'
  | 'self_repair'
  | 'holo_decoy'
  | 'grav_inversion'
  | 'metal_whisper'
  | 'panel_molt'
  | 'core_overheat'
  | 'steering_spasm'
  | 'short_circuit';

export type MutationCategory = 'boon' | 'wild' | 'flat' | 'incident';

export interface MutationDefinition {
  id: MutationId;
  category: MutationCategory;
  nameEn: string;
  nameRu: string;
  descEn: string;
  descRu: string;
  durationSec: number; // 0 = instant/passive during race
  speedDelta: number;
  accelDelta: number;
  handlingPctDelta: number; // e.g. -0.05 = -5%
  durabilityDelta: number;
  enemySlowSec: number;
  gravitySlip: boolean;
  coreLockout: boolean;
  steeringSpasm: boolean;
  storyTrigger?: boolean;
  visualTag:
    | 'color_shift'
    | 'synapse_glow'
    | 'tendrils'
    | 'sail_fin'
    | 'acid_trail'
    | 'repair_weave'
    | 'holo_ghost'
    | 'grav_aura'
    | 'whisper_wave'
    | 'panel_molt'
    | 'overheat_smoke'
    | 'spasm_jitter'
    | 'arc_sparks';
  colorHex: string;
}

export interface SubsystemDamage {
  engine: number;     // 0..100 (100 = pristine, 0 = critical)
  steering: number;   // 0..100
  suspension: number; // 0..100
  armor: number;      // 0..100
  steeringBias: number; // -1..1 asymmetric pull from left/right front hits
}

export interface UpgradeModules {
  engine: number;  // 0..5 (+4.2 top speed / lvl)
  chassis: number; // 0..5 (+7% handling / lvl)
  grip: number;    // 0..5 (+1.8 accel / lvl)
  armor: number;   // 0..5 (+10 durability / lvl)
}

export interface DialogueLine {
  speaker: CharacterId;
  textEn: string;
  textRu: string;
  condition?: 'sold' | 'not_sold' | 'collider' | 'not_collider';
}

export interface StageChoiceOption {
  id: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  fluxiteDelta: number;
  reputationDelta: number;
  setsFlag: { key: 'sold' | 'collider' | 'ending'; value: boolean | 'awake' | 'asleep' };
}

export interface StageConfig {
  id: string; // '1_1' .. '1_15' or 'free_season'
  stageNumber: number; // 1..15, or 16+ for free season
  act: 1 | 2 | 3 | 4;
  titleEn: string;
  titleRu: string;
  biome: BiomeId;
  laps: number;
  intensity: number;
  opponents: CharacterId[];
  baseReward: number;
  skillMin: number;
  skillMax: number;
  denseFog?: boolean;
  doubleDoseBonus?: boolean;
  orderDrones?: boolean;
  leaderSeekingPatches?: boolean;
  metronomePatches?: boolean;
  duelMode?: boolean;
  scriptedEvent?: {
    atProgress: number; // 0.35 or 0.50
    mutationId: MutationId;
    voiceLine?: DialogueLine;
  };
  preDialogue: DialogueLine[];
  preChoice?: {
    promptEn: string;
    promptRu: string;
    options: StageChoiceOption[];
  };
  postDialogue: DialogueLine[];
  artifactId?: string;
  artifactNameEn?: string;
  artifactNameRu?: string;
}

export type RebindableAction =
  | 'throttle'
  | 'brake'
  | 'steerLeft'
  | 'steerRight'
  | 'drift'
  | 'hop'
  | 'ability'
  | 'resetCamera'
  | 'pause';

export interface ControlBindings {
  throttle: string;
  brake: string;
  steerLeft: string;
  steerRight: string;
  drift: string;
  hop: string; // 'Mouse2' (Right Click) or Key code
  ability: string;
  resetCamera: string;
  pause: string;
}

export interface StoryFlags {
  sold: boolean | null;
  collider: boolean | null;
  ending: 'awake' | 'asleep' | null;
}

export type SponsorId = 'league' | 'nomads' | 'artisan';

export interface SponsorContract {
  id: SponsorId;
  factionEn: string;
  factionRu: string;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  bonusFluxite: number;
  bonusReputation: number;
}

export interface GhostSample {
  t: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface SaveState {
  fluxite: number;
  reputation: number;
  unlockedChapters: string[];
  completedChapters: string[];
  currentStageNumber: number;
  modules: UpgradeModules;
  permanentTraits: MutationId[];
  discoveredMutations: MutationId[];
  artifacts: string[];
  storyFlags: StoryFlags;
  totalDose: number;
  freeSeasonWins: number;
  difficulty: DifficultyLevel;
  graphics: GraphicsLevel;
  language: LanguageCode;
  bindings: ControlBindings;
  audioMuted: boolean;
  audioVolume: number;
  activeSponsor?: SponsorId | null;
  bestRunTimes?: Record<string, number>;
  bestRunGhosts?: Record<string, GhostSample[]>;
}

export type AppScreen =
  | 'title'
  | 'chapters'
  | 'pre_dialogue'
  | 'race'
  | 'post_dialogue'
  | 'finale_choice'
  | 'epilogue'
  | 'garage';

export interface ActiveMutationBuff {
  id: MutationId;
  remainingSec: number;
  durationSec: number;
}

export type FieldQuestKind = 'clean_line' | 'flux_conduit' | 'iron_chassis';

export interface FieldQuest {
  kind: FieldQuestKind;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  bonusFluxite: number;
  bonusReputation: number;
  targetValue: number;
}

export interface MemoryBeacon {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  collected: boolean;
  nameEn: string;
  nameRu: string;
  loreEn: string;
  loreRu: string;
}

export interface RadarTargetInfo {
  active: boolean;
  x: number;
  z: number;
  kind: 'vent' | 'patch' | 'beacon';
  distance: number;
}

export interface RaceHudSnapshot {
  speedKmh: number;
  speedStep: number; // 0..8 discrete speed step
  gear: number;
  lap: number;
  totalLaps: number;
  isPointToPoint: boolean;
  segment: number; // 1..3 for overland point-to-point stages
  totalSegments: number;
  distanceKm: number;
  totalDistanceKm: number;
  etaSec: number;
  position: number;
  totalRacers: number;
  durability: number;
  maxDurability: number;
  subsystems: SubsystemDamage;
  dose: number; // 0..100 current cycle
  totalDose: number;
  progress: number; // 0..1 overall race progress
  activeBuffs: ActiveMutationBuff[];
  sessionBoons: MutationId[];
  abilityCooldown: number; // seconds left for Flux Surge
  abilityMaxCooldown: number;
  isDrifting: boolean;
  isOffTrack: boolean;
  cursorMoveActive: boolean;
  hudStaticActive: boolean;
  cameraInspecting: boolean;
  radar: RadarTargetInfo;
  beaconsCollected: number;
  beaconsTotal: number;
  nearMissCount: number;
  voiceTransmission: DialogueLine | null;
  lastMutationEvent: { id: MutationId; timestamp: number } | null;
  floatingEvents: Array<{
    id: number;
    text: string;
    tone: 'boon' | 'damage' | 'dose' | 'wild';
    timestamp: number;
  }>;
  quest: {
    titleEn: string;
    titleRu: string;
    current: number;
    target: number;
    status: 'active' | 'completed' | 'failed';
  } | null;
  minimapPoints: Array<{ x: number; z: number }>;
  minimapForkPoints?: Array<{ x: number; z: number }>;
  minimapBeacons: Array<{ x: number; z: number; collected: boolean }>;
  minimapRacers: Array<{
    id: CharacterId | 'player';
    x: number;
    z: number;
    color: string;
    isPlayer: boolean;
  }>;
}

export interface RaceFinishResult {
  stageId: string;
  stageNumber: number;
  dnf: boolean;
  placement: number; // 1..N
  totalRacers: number;
  elapsedSec: number;
  totalDose: number;
  ramsCommitted: number;
  reputationDelta: number;
  stageReward: number;
  placementReward: number;
  doseReward: number;
  questBonusFluxite: number;
  questCompleted: boolean;
  questTitleEn?: string;
  questTitleRu?: string;
  sponsorId?: SponsorId | null;
  sponsorCompleted?: boolean;
  sponsorBonusFluxite?: number;
  sponsorBonusReputation?: number;
  beaconsCollected?: number;
  beaconBonusFluxite?: number;
  nearMissCount?: number;
  nearMissBonusFluxite?: number;
  totalFluxiteEarned: number;
  sessionBoons: MutationId[];
  newlyFixatedTraits: MutationId[];
  displacedTraits: MutationId[];
  discoveredMutations: MutationId[];
  damageReport: SubsystemDamage;
  recordedGhost?: GhostSample[];
}
