import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';

import type { AudioEngine } from '../audio/AudioEngine';
import { CHARACTERS } from '../data/characters';
import { MUTATIONS } from '../data/mutations';
import { getPlanetaryLegMeta, isPointToPointStage } from '../data/planetaryRoutes';
import {
  applyImpactDamage,
  calculateNearMissBonus,
  computeAiTargetSpeed,
  computeCursorDriveInput,
  computeSpeedStep,
  computeVehicleStats,
  computeWeatherFrontEffect,
  createPristineSubsystems,
  evaluateFieldQuest,
  generateMemoryBeacons,
  generatePointToPointControlPoints,
  generateRadiationPatches,
  generateResonanceVents,
  generateSharpCornerMarkers,
  generateSplitForkZone,
  generateStageFieldQuest,
  generateTrackControlPoints,
  generateTrackSectionArches,
  generateWeatherFronts,
  projectPointToForkTrack,
  repairSubsystemPartial,
  rollMutationFromDose,
  sampleClosedCatmullRom,
  sampleGhostPose,
  sampleOpenCatmullRom,
  type RadiationPatch,
  type ResonanceVent,
  type SplitForkZone,
  type TrackPoint2D,
  type WeatherFrontZone,
} from '../rules';
import type {
  ActiveMutationBuff,
  CharacterId,
  ControlBindings,
  DifficultyLevel,
  FieldQuest,
  GhostSample,
  GraphicsLevel,
  MemoryBeacon,
  MutationId,
  RaceFinishResult,
  RaceHudSnapshot,
  StageConfig,
  SubsystemDamage,
  UpgradeModules,
} from '../types';
import {
  createProceduralTextureSet,
  disposeProceduralTextureSet,
  type ProceduralTextureSet,
} from './textures';
import {
  buildTrackEnvironment,
  createBasaltCollarGeometry,
  createWhisperCrystalShardGeometry,
  type BuiltTrackScene,
} from './trackBuilder';
import {
  applyMutationVisualsToRig,
  createGhostTelemetryMesh,
  createVehicleMesh,
  type VehicleVisualRig,
} from './vehicleBuilder';

interface RacerEntity {
  id: CharacterId | 'player';
  isPlayer: boolean;
  x: number;
  y: number;
  vy: number;
  z: number;
  yaw: number;
  speed: number;
  lateralVel: number;
  massKg: number;
  lap: number;
  passedHalfway: boolean;
  progress: number; // 0..1 on current lap
  totalProgress: number; // lap + progress
  lastProgress: number;
  skill: number;
  lateralTarget: number;
  incidentCooldown: number;
  squashScaleY: number;
  squashScaleXZ: number;
  rig: VehicleVisualRig;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export interface RaceEngineCallbacks {
  onHudUpdate: (hud: RaceHudSnapshot) => void;
  onRaceFinish: (result: RaceFinishResult) => void;
  onMutationDiscovered: (id: MutationId) => void;
  onPauseRequested: () => void;
}

// Pre-allocated scratch math helpers (Zero-GC render loop)
const _v3A = new THREE.Vector3();
const _v3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scaleVec = new THREE.Vector3();
const _euler = new THREE.Euler();
const _cSkyBase = new THREE.Color();
const _cSkyMid = new THREE.Color();
const _cSkyEnd = new THREE.Color();
const _cSkyMix = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _ndcVec2 = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _cursorWorld = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

export class RaceEngine3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private isSoftwareGl: boolean;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  private audio: AudioEngine;
  private callbacks: RaceEngineCallbacks;

  private graphics: GraphicsLevel = 'high';
  private difficulty: DifficultyLevel = 'classic';
  private bindings: ControlBindings;

  private frameId = 0;
  private lastTimeMs = performance.now();
  private elapsedSec = 0;
  private hudEmitAccum = 0;
  private disposed = false;

  // Active mode: 'showcase' (Main Menu / Garage) vs 'race'
  private mode: 'showcase' | 'race' = 'showcase';
  private paused = false;

  // Showcase state
  private showcaseGroup: THREE.Group | null = null;
  private showcaseRig: VehicleVisualRig | null = null;
  private showcaseDust: THREE.InstancedMesh | null = null;
  private showcaseTextures: ProceduralTextureSet | null = null;
  private showcaseTraits: MutationId[] = [];
  private cursorNdcX = 0;
  private cursorNdcY = 0;

  // Race state
  private activeStage: StageConfig | null = null;
  private activeQuest: FieldQuest | null = null;
  private trackBuilt: BuiltTrackScene | null = null;
  private trackTextures: ProceduralTextureSet | null = null;
  private sampledPoints: TrackPoint2D[] = [];
  private cachedMinimapPoints: Array<{ x: number; z: number }> = [];
  private cachedForkMinimapPoints: Array<{ x: number; z: number }> = [];
  private forkZone: SplitForkZone | null = null;
  private forkRepairUsed = false;
  private weatherFronts: WeatherFrontZone[] = [];
  private weatherCooldown = 0;
  private patches: RadiationPatch[] = [];
  private vents: ResonanceVent[] = [];
  private beacons: MemoryBeacon[] = [];
  private beaconsCollected = 0;
  private beaconRepBonus = 0;
  private nearMissCount = 0;
  private nearMissCooldowns = new Map<string, number>();
  private radarActive = false;
  private ventBoostCooldown = 0;
  private finalLapRadioFired = false;
  private isTrackClosed = true;
  private legDistanceKm = 180;
  private segmentRadioStage = 1;
  private mutationSweepTimer = 0;
  private mutationSweepDir = 1;
  private racers: RacerEntity[] = [];
  private playerRacer: RacerEntity | null = null;

  // Player mechanics state
  private modules: UpgradeModules = { engine: 0, chassis: 0, grip: 0, armor: 0 };
  private permanentTraits: MutationId[] = [];
  private activeBuffs: ActiveMutationBuff[] = [];
  private sessionBoons: MutationId[] = [];
  private discoveredInRace: Set<MutationId> = new Set();
  private subsystems: SubsystemDamage = createPristineSubsystems();
  private durability = 100;
  private maxDurability = 100;
  private currentMaxSpeed = 48;
  private dose = 0;
  private totalDose = 0;
  private raceElapsedSec = 0;
  private ramsCommitted = 0;
  private ramReputationPenalty = 0;
  private hitstopSec = 0;
  private cameraTrauma = 0;
  private abilityCooldown = 0;
  private abilitySurgeSec = 0;
  private scriptedFired = false;
  private voiceLine: StageConfig['postDialogue'][number] | null = null;
  private voiceTimerSec = 0;
  private lastMutationEvent: { id: MutationId; timestamp: number } | null = null;
  private floatingEvents: RaceHudSnapshot['floatingEvents'] = [];
  private nextEventId = 1;
  private raceFinished = false;

  // Camera orbit override during race (moves with car and auto-returns!)
  private cameraInspecting = false;
  private orbitAutoReturnTimer = 0;
  private pointerDownPos = { x: 0, y: 0 };
  private isPointerDown = false;
  private prevPlayerPos = { x: 0, y: 0, z: 0 };

  // Pooled Particle Ring Buffer (InstancedMesh)
  private particleCount = 160;
  private particleMesh: THREE.InstancedMesh;
  private particlePool: PooledParticle[] = [];
  private particleCursor = 0;

  // Unified Input State
  private keysHeld = new Set<string>();
  private mouseHeld = new Set<number>();
  private cursorMoveActive = false;
  private touchSteer = 0; // -1..1
  private touchThrottle = 0; // -1..1
  private touchDrift = false;

  // Adaptive DPR Scaling
  private adaptiveDpr = 1.5;
  private smoothedFrameDt = 0.016;
  private dprAdjustCooldown = 0;

  // Personal Best Ghost Telemetry & Stage 15 Beat
  private bestGhostFrames: GhostSample[] = [];
  private recordedGhostFrames: GhostSample[] = [];
  private ghostRecordTimer = 0;
  private ghostMesh: THREE.Group | null = null;
  private hudStaticTimer = 0;
  private stage15StaticTriggered = false;

  constructor(
    container: HTMLElement,
    audio: AudioEngine,
    bindings: ControlBindings,
    graphics: GraphicsLevel,
    callbacks: RaceEngineCallbacks,
  ) {
    this.container = container;
    this.audio = audio;
    this.bindings = bindings;
    this.graphics = graphics;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.94;
    this.adaptiveDpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.adaptiveDpr);
    this.renderer.setSize(container.clientWidth || 1280, container.clientHeight || 720);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && graphics !== 'low' && graphics !== 'medium';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090b12);
    this.scene.fog = new THREE.FogExp2(0x090b12, 0.012);

    // Mandatory RoomEnvironment IBL on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const w = container.clientWidth || 1280;
    const h = container.clientHeight || 720;
    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.25, 950);
    this.camera.position.set(5.5, 3.1, 6.2);

    // 3-Point Warm/Cool Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x6382b8, 0x261d14, 0.55);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffe1b0, 1.45);
    this.keyLight.position.set(28, 42, 22);
    this.keyLight.castShadow = !this.isSoftwareGl && (graphics === 'high' || graphics === 'ultra');
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 140;
    const d = 48;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    this.rimLight.position.set(-22, 16, -26);
    this.scene.add(this.rimLight);

    // OrbitControls (Left drag = Orbit, Middle or Shift+Left = Pan, Wheel = Zoom, Right Click = Hop/Action)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 36;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: null as unknown as THREE.MOUSE, // Reserved for Jump/Hop!
    };
    this.controls.addEventListener('change', () => {
      // Only enter manual camera inspect when dragging with a single button (not LMB+RMB cursor drive)
      if (this.mode === 'race' && this.isPointerDown && !this.cursorMoveActive) {
        const dx = this.cursorNdcX - this.pointerDownPos.x;
        const dy = this.cursorNdcY - this.pointerDownPos.y;
        if (Math.hypot(dx, dy) > 0.02) {
          this.cameraInspecting = true;
          this.orbitAutoReturnTimer = 2.4;
        }
      }
    });

    // Pooled InstancedMesh Particle Ring Buffer
    const pGeo = new THREE.OctahedronGeometry(0.22, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.particleCount);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);
    for (let i = 0; i < this.particleCount; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0,
        color: new THREE.Color(0xffffff),
      });
      _mat4.makeTranslation(0, -999, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, this.particlePool[i].color);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;

    this.setupPostProcessing();
    this.setupShowcaseScene();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.applyShowcaseCamera();
    this.update(0.016);
    this.render();
    this.startLoop();
  }

  private applyShowcaseCamera(): void {
    const w = this.container.clientWidth || window.innerWidth || 1280;
    // Offset camera target slightly left on wide screens so the car sits in the clear right-center
    const offsetX = w >= 768 ? -1.45 : 0;
    this.camera.position.set(4.8 + offsetX, 2.7, 6.2);
    this.controls.target.set(offsetX, 0.85, 0);
    this.controls.update();
  }

  private setupPostProcessing(): void {
    if (this.isSoftwareGl) {
      this.composer = null;
      this.bloomPass = null;
      return;
    }
    const w = this.container.clientWidth || 1280;
    const h = this.container.clientHeight || 720;
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomStrength = this.graphics === 'ultra' ? 0.2 : this.graphics === 'high' ? 0.14 : 0;
    const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), bloomStrength, 0.22, 1.12);
    composer.addPass(bloom);

    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms['offset'].value = 1.05;
    vignette.uniforms['darkness'].value = 0.88;
    composer.addPass(vignette);

    composer.addPass(new OutputPass());

    this.composer = composer;
    this.bloomPass = bloom;
  }

  public setGraphicsLevel(level: GraphicsLevel): void {
    this.graphics = level;
    document.body.dataset.graphics = level;
    const useShadows = !this.isSoftwareGl && (level === 'high' || level === 'ultra');
    this.renderer.shadowMap.enabled = useShadows;
    this.keyLight.castShadow = useShadows;
    if (this.bloomPass) {
      this.bloomPass.strength = level === 'ultra' ? 0.2 : level === 'high' ? 0.14 : 0;
      this.bloomPass.radius = 0.22;
      this.bloomPass.threshold = 1.12;
    }
    this.adaptiveDpr =
      this.isSoftwareGl || level === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.adaptiveDpr);
    this.applyHeadlampIntensity();
    // Rebuild active showcase or track if needed for instance density
    if (this.mode === 'showcase') {
      this.setupShowcaseScene();
    }
  }

  private applyHeadlampIntensity(): void {
    const p = this.playerRacer;
    if (!p || !this.activeStage) return;
    const darkBiome =
      this.activeStage.biome === 'storm' ||
      this.activeStage.biome === 'needle' ||
      this.activeStage.biome === 'epicenter';
    const isLow = this.graphics === 'low';
    if (p.rig.headlightSpot) {
      p.rig.headlightSpot.intensity = isLow ? 0 : darkBiome ? 2.6 : 1.1;
    }
    if (p.rig.headlightCones) {
      const op = isLow ? 0 : darkBiome ? 0.12 : 0.05;
      for (const cone of p.rig.headlightCones) {
        cone.visible = !isLow;
        const mat = cone.material as THREE.MeshBasicMaterial;
        mat.opacity = op;
      }
    }
  }

  public setDifficulty(diff: DifficultyLevel): void {
    this.difficulty = diff;
  }

  public setBindings(bindings: ControlBindings): void {
    this.bindings = bindings;
  }

  public clearAllInputs(): void {
    this.keysHeld.clear();
    this.mouseHeld.clear();
    this.cursorMoveActive = false;
    this.touchSteer = 0;
    this.touchThrottle = 0;
    this.touchDrift = false;
    this.isPointerDown = false;
    if (this.controls) {
      this.controls.enabled = true;
    }
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.audio.updateEngineHum(false, 0);
      this.clearAllInputs();
    }
  }

  public setTouchSteer(steer: number): void {
    this.touchSteer = steer;
  }

  public setTouchThrottle(throttle: number): void {
    this.touchThrottle = throttle;
  }

  public setTouchDrift(drift: boolean): void {
    this.touchDrift = drift;
  }

  public triggerTouchHop(): void {
    if (this.mode === 'race' && !this.paused) this.performHop();
  }

  public triggerTouchAbility(): void {
    if (this.mode === 'race' && !this.paused) this.performFluxSurge();
  }

  public resetCamera(): void {
    this.cameraInspecting = false;
    if (this.mode === 'showcase') {
      this.applyShowcaseCamera();
    }
  }

  public toggleRadar(): void {
    this.radarActive = !this.radarActive;
    this.audio.playUiClick(this.radarActive ? 1.25 : 0.85);
    this.emitHudSnapshot();
  }

  public updateShowcaseTraits(traits: MutationId[]): void {
    this.showcaseTraits = traits;
  }

  public enterShowcaseMode(traits: MutationId[]): void {
    this.cleanupRaceScene();
    this.mode = 'showcase';
    this.paused = false;
    this.showcaseTraits = traits;
    this.audio.updateEngineHum(false, 0);
    this.setupShowcaseScene();
    this.applyShowcaseCamera();
    this.controls.enabled = true;
    this.render();
  }

  private cleanupShowcaseScene(): void {
    if (this.showcaseGroup) {
      this.scene.remove(this.showcaseGroup);
      this.showcaseGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      this.showcaseGroup = null;
      this.showcaseRig = null;
      this.showcaseDust = null;
    }
    if (this.showcaseTextures) {
      disposeProceduralTextureSet(this.showcaseTextures);
      this.showcaseTextures = null;
    }
  }

  private setupShowcaseScene(): void {
    this.cleanupShowcaseScene();
    this.scene.background = new THREE.Color(0x090b12);
    this.scene.fog = new THREE.FogExp2(0x090b12, 0.022);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.showcaseTextures = createProceduralTextureSet('crystal', maxAniso);

    const group = new THREE.Group();
    this.showcaseGroup = group;

    // Grounded Dark Obsidian Pit Pad
    const padGeo = new THREE.CylinderGeometry(7.5, 8.2, 0.5, 32);
    const padMat = new THREE.MeshStandardMaterial({
      map: this.showcaseTextures.trackAlbedo,
      roughnessMap: this.showcaseTextures.trackRoughness,
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.4,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -0.25;
    pad.receiveShadow = !this.isSoftwareGl;
    group.add(pad);

    // Outer sculpted basalt crystal outcrops (zero bare octahedrons!)
    const crystalCount = this.graphics === 'low' ? 12 : 26;
    const crysGeo = createWhisperCrystalShardGeometry(0.8);
    const socketGeo = createBasaltCollarGeometry(0.5);
    const crysMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.42,
      roughness: 0.34,
      metalness: 0.28,
      clearcoat: 0.72,
    });
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x171b26,
      roughness: 0.9,
      metalness: 0.16,
    });
    const crysInst = new THREE.InstancedMesh(crysGeo, crysMat, crystalCount);
    const socketInst = new THREE.InstancedMesh(socketGeo, socketMat, crystalCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < crystalCount; i++) {
      const ang = (i / crystalCount) * Math.PI * 2;
      const rad = 11.2 + (i % 3) * 3.4;
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const s = 0.75 + (i % 5) * 0.32;

      dummy.position.set(px, -0.1, pz);
      dummy.rotation.set(0, ang, 0);
      dummy.scale.set(s * 0.85, s * 0.9, s * 0.85);
      dummy.updateMatrix();
      socketInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(px, 0.05, pz);
      dummy.rotation.set(0.08 * (i % 3), ang, 0.12 * ((i % 2) * 2 - 1));
      dummy.scale.set(s * 0.78, s * 1.35, s * 0.78);
      dummy.updateMatrix();
      crysInst.setMatrixAt(i, dummy.matrix);
    }
    crysInst.instanceMatrix.needsUpdate = true;
    socketInst.instanceMatrix.needsUpdate = true;
    group.add(socketInst, crysInst);

    // Volumetric God Rays over showcase vehicle
    if (!this.isSoftwareGl && (this.graphics === 'high' || this.graphics === 'ultra')) {
      const rayGeo = new THREE.CylinderGeometry(0.8, 4.5, 18, 12, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: this.graphics === 'ultra' ? 0.08 : 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(1.2, 8.5, -0.5);
      ray.rotation.z = 0.22;
      group.add(ray);
    }

    // Floating Golden Dust Motes (InstancedMesh)
    const dustCount = this.graphics === 'low' ? 16 : 64;
    const dustGeo = new THREE.PlaneGeometry(0.16, 0.16);
    const dustMat = new THREE.MeshBasicMaterial({
      map: this.showcaseTextures.sparkSprite,
      color: 0xfde68a,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const dustInst = new THREE.InstancedMesh(dustGeo, dustMat, dustCount);
    for (let i = 0; i < dustCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 12,
        0.5 + Math.random() * 5,
        (Math.random() - 0.5) * 12,
      );
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      dustInst.setMatrixAt(i, dummy.matrix);
    }
    dustInst.instanceMatrix.needsUpdate = true;
    this.showcaseDust = dustInst;
    group.add(dustInst);

    // Hero Dusk-9 Vehicle
    this.showcaseRig = createVehicleMesh(
      'taka',
      this.showcaseTextures,
      this.isSoftwareGl,
    );
    if (this.showcaseRig.headlightCones) {
      for (const cone of this.showcaseRig.headlightCones) {
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.035;
      }
    }
    group.add(this.showcaseRig.root);

    this.scene.add(group);
  }

  public startRace(params: {
    stage: StageConfig;
    modules: UpgradeModules;
    permanentTraits: MutationId[];
    difficulty: DifficultyLevel;
    bestRunGhost?: GhostSample[];
  }): void {
    this.cleanupShowcaseScene();
    this.cleanupRaceScene();

    this.bestGhostFrames = params.bestRunGhost ? [...params.bestRunGhost] : [];
    this.recordedGhostFrames = [];
    this.ghostRecordTimer = 0;
    this.hudStaticTimer = 0;
    this.stage15StaticTriggered = false;

    this.mode = 'race';
    this.paused = false;
    this.raceFinished = false;
    this.activeStage = params.stage;
    this.activeQuest = generateStageFieldQuest(params.stage.stageNumber, params.stage.intensity);
    this.modules = { ...params.modules };
    this.permanentTraits = [...params.permanentTraits];
    this.difficulty = params.difficulty;
    this.activeBuffs = [];
    this.sessionBoons = [];
    this.discoveredInRace.clear();
    this.subsystems = createPristineSubsystems();
    this.maxDurability = 100 + params.modules.armor * 10;
    this.durability = this.maxDurability;
    this.dose = 0;
    this.totalDose = 0;
    this.raceElapsedSec = 0;
    this.ventBoostCooldown = 0;
    this.beaconsCollected = 0;
    this.beaconRepBonus = 0;
    this.nearMissCount = 0;
    this.nearMissCooldowns.clear();
    this.finalLapRadioFired = false;
    this.isTrackClosed = !isPointToPointStage(params.stage.id, params.stage.stageNumber);
    this.legDistanceKm = getPlanetaryLegMeta(params.stage.stageNumber, params.stage.biome).distanceKm;
    this.segmentRadioStage = 1;
    this.mutationSweepTimer = 0;
    this.ramsCommitted = 0;
    this.ramReputationPenalty = 0;
    this.hitstopSec = 0;
    this.cameraTrauma = 0;
    this.abilityCooldown = 0;
    this.abilitySurgeSec = 0;
    this.scriptedFired = false;
    this.voiceLine = this.isTrackClosed
      ? {
          speaker: 'taka',
          textEn: 'Telemetry linked. Hit Resonance Vents and watch for glowing Bolt Memorials along the outer apex.',
          textRu: 'Телеметрия активна. Берите резонанс-ускорители и отмечайте памятные болты на виражах.',
        }
      : {
          speaker: 'taka',
          textEn: `Overland route locked (${this.legDistanceKm} km). Ride the vents and clear all three segments to the Destination Airlock!`,
          textRu: `Перегон А → Б (${this.legDistanceKm} км). Держите темп по ускорителям к шлюзу назначения!`,
        };
    this.voiceTimerSec = 5.5;
    this.lastMutationEvent = null;
    this.floatingEvents = [];
    this.cameraInspecting = false;
    this.orbitAutoReturnTimer = 0;
    this.clearAllInputs();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.trackTextures = createProceduralTextureSet(params.stage.biome, maxAniso);

    const seed = params.stage.stageNumber * 173 + 41;
    const ctrl = this.isTrackClosed
      ? generateTrackControlPoints(seed, params.stage.biome, params.stage.stageNumber)
      : generatePointToPointControlPoints(seed, params.stage.biome, params.stage.stageNumber);
    this.sampledPoints = this.isTrackClosed
      ? sampleClosedCatmullRom(ctrl, 240)
      : sampleOpenCatmullRom(ctrl, 340);
    this.cachedMinimapPoints = [];
    const minimapStep = this.isTrackClosed ? 5 : 6;
    for (let i = 0; i < this.sampledPoints.length; i += minimapStep) {
      this.cachedMinimapPoints.push({ x: this.sampledPoints[i].x, z: this.sampledPoints[i].z });
    }
    if (!this.isTrackClosed && this.sampledPoints.length > 0) {
      const lastPt = this.sampledPoints[this.sampledPoints.length - 1];
      this.cachedMinimapPoints.push({ x: lastPt.x, z: lastPt.z });
    }

    this.patches = generateRadiationPatches(
      this.sampledPoints,
      seed,
      params.stage.intensity,
      this.isTrackClosed,
    );
    const baseVents = generateResonanceVents(this.sampledPoints, seed, this.isTrackClosed);
    this.forkRepairUsed = false;
    this.weatherCooldown = 0;
    this.forkZone = generateSplitForkZone(this.sampledPoints, this.isTrackClosed);
    this.weatherFronts = generateWeatherFronts(this.sampledPoints, seed, this.isTrackClosed);
    this.vents = this.forkZone ? [...baseVents, ...this.forkZone.fluxVents] : baseVents;
    this.cachedForkMinimapPoints = [];
    if (this.forkZone && this.forkZone.repairBranchPoints.length >= 2) {
      const bp = this.forkZone.repairBranchPoints;
      for (let i = 0; i < bp.length; i += 3) {
        this.cachedForkMinimapPoints.push({ x: bp[i].x, z: bp[i].z });
      }
      const lastBp = bp[bp.length - 1];
      this.cachedForkMinimapPoints.push({ x: lastBp.x, z: lastBp.z });
    }

    const arches = generateTrackSectionArches(this.sampledPoints, this.isTrackClosed);
    this.beacons = generateMemoryBeacons(
      this.sampledPoints,
      seed,
      params.stage.stageNumber,
      this.isTrackClosed,
    );
    const cautionMarkers = generateSharpCornerMarkers(this.sampledPoints, this.isTrackClosed);

    this.trackBuilt = buildTrackEnvironment({
      scene: this.scene,
      biome: params.stage.biome,
      sampledPoints: this.sampledPoints,
      patches: this.patches,
      vents: this.vents,
      arches,
      beacons: this.beacons,
      cautionMarkers,
      forkZone: this.forkZone,
      weatherFronts: this.weatherFronts,
      textures: this.trackTextures,
      graphics: this.graphics,
      isSoftwareGl: this.isSoftwareGl,
      closed: this.isTrackClosed,
      denseFog: params.stage.denseFog,
      orderDrones: params.stage.orderDrones,
    });

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Spawn Player + Opponents on clear open track starting straight facing tangent direction
    const startGridIdx = this.isTrackClosed ? 0 : 12;
    const startPt = this.sampledPoints[startGridIdx];
    const nextPt = this.sampledPoints[Math.min(this.sampledPoints.length - 1, startGridIdx + 1)];
    const tx = nextPt.x - startPt.x;
    const tz = nextPt.z - startPt.z;
    const len = Math.hypot(tx, tz) || 1;
    const fx = tx / len;
    const fz = tz / len;
    const nx = -fz;
    const nz = fx;
    const startYaw = Math.atan2(fx, fz);

    this.racers = [];
    const totalGrid = 1 + params.stage.opponents.length;
    const initProgress = this.isTrackClosed
      ? 0
      : startGridIdx / Math.max(1, this.sampledPoints.length - 1);

    const spawnRacer = (id: CharacterId | 'player', gridSlot: number) => {
      const charId = id === 'player' ? 'taka' : id;
      const char = CHARACTERS[charId];
      const row = Math.floor(gridSlot / 2);
      const col = gridSlot % 2 === 0 ? -2.8 : 2.8;
      const backDist = row * 6.5;

      const rig = createVehicleMesh(
        charId,
        this.trackTextures!,
        this.isSoftwareGl,
      );
      this.scene.add(rig.root);

      const t = gridSlot / Math.max(1, totalGrid - 1);
      const skill =
        params.stage.skillMin +
        (params.stage.skillMax - params.stage.skillMin) * (1 - t * 0.5) +
        char.baseSkillOffset;

      const racer: RacerEntity = {
        id,
        isPlayer: id === 'player',
        x: startPt.x - fx * backDist + nx * col,
        y: startPt.y,
        vy: 0,
        z: startPt.z - fz * backDist + nz * col,
        yaw: startYaw,
        speed: 0,
        lateralVel: 0,
        massKg: char.massKg,
        lap: 1,
        passedHalfway: false,
        progress: initProgress,
        totalProgress: this.isTrackClosed ? 1 + initProgress : initProgress,
        lastProgress: initProgress,
        skill,
        lateralTarget: col,
        incidentCooldown: 6 + Math.random() * 10,
        squashScaleY: 1,
        squashScaleXZ: 1,
        rig,
      };
      rig.root.position.set(racer.x, racer.y, racer.z);
      rig.root.rotation.y = racer.yaw;
      this.racers.push(racer);
      if (racer.isPlayer) this.playerRacer = racer;
    };

    params.stage.opponents.forEach((oppId, idx) => {
      spawnRacer(oppId, idx);
    });
    spawnRacer('player', params.stage.opponents.length);
    this.applyHeadlampIntensity();

    if (this.bestGhostFrames.length >= 2) {
      this.ghostMesh = createGhostTelemetryMesh();
      const firstPose = this.bestGhostFrames[0];
      this.ghostMesh.position.set(firstPose.x, firstPose.y + 0.08, firstPose.z);
      this.ghostMesh.rotation.y = firstPose.yaw;
      this.scene.add(this.ghostMesh);
    }

    // Snap chase camera cleanly behind player facing forward along track
    if (this.playerRacer) {
      this.prevPlayerPos = {
        x: this.playerRacer.x,
        y: this.playerRacer.y,
        z: this.playerRacer.z,
      };
      this.camera.position.set(
        this.playerRacer.x - fx * 9.5,
        this.playerRacer.y + 4.3,
        this.playerRacer.z - fz * 9.5,
      );
      this.controls.target.set(
        this.playerRacer.x + fx * 5.2,
        this.playerRacer.y + 1.15,
        this.playerRacer.z + fz * 5.2,
      );
      this.controls.enabled = true;
      this.controls.update();
      this.keyLight.position.set(
        this.playerRacer.x + 28,
        this.playerRacer.y + 42,
        this.playerRacer.z + 22,
      );
      this.keyLight.target.position.set(
        this.playerRacer.x,
        this.playerRacer.y,
        this.playerRacer.z,
      );
      this.keyLight.target.updateMatrixWorld();
    }

    this.audio.setContext(params.stage.stageNumber >= 14 ? 'finale' : params.stage.intensity >= 1.3 ? 'race_intense' : 'race_calm');
    this.emitHudSnapshot();
    this.render();
  }

  private cleanupRaceScene(): void {
    this.racers.forEach((r) => {
      this.scene.remove(r.rig.root);
    });
    this.racers = [];
    this.playerRacer = null;
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      this.ghostMesh = null;
    }
    this.forkZone = null;
    this.cachedForkMinimapPoints = [];
    this.weatherFronts = [];
    if (this.trackBuilt) {
      this.trackBuilt.dispose();
      this.trackBuilt = null;
    }
    if (this.trackTextures) {
      disposeProceduralTextureSet(this.trackTextures);
      this.trackTextures = null;
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('pointerup', this.onGlobalPointerUp);
    window.addEventListener('pointercancel', this.onGlobalPointerUp);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('mousedown', this.onMouseDown);
    dom.addEventListener('mouseup', this.onMouseUp);
    dom.addEventListener('contextmenu', this.onContextMenu);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
    if (this.mode === 'showcase') {
      this.applyShowcaseCamera();
    }
    this.render();
  };

  private onWindowBlur = (): void => {
    this.clearAllInputs();
  };

  private onGlobalPointerUp = (): void => {
    this.isPointerDown = false;
    this.mouseHeld.clear();
    this.cursorMoveActive = false;
    this.controls.enabled = true;
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearAllInputs();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.cursorNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.cursorNdcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.isPointerDown = true;
    this.pointerDownPos.x = this.cursorNdcX;
    this.pointerDownPos.y = this.cursorNdcY;
    const lmbWasHeld = this.mouseHeld.has(0);
    this.mouseHeld.add(e.button);
    if (this.mode === 'race' && !this.paused && !this.raceFinished) {
      if (this.mouseHeld.has(0) && this.mouseHeld.has(2)) {
        this.cursorMoveActive = true;
        this.cameraInspecting = false;
        this.controls.enabled = false;
      }
      const code = `Mouse${e.button}`;
      if (code === this.bindings.hop && !(e.button === 2 && lmbWasHeld)) {
        this.performHop();
      } else if (code === this.bindings.ability) {
        this.performFluxSurge();
      }
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.mouseHeld.delete(e.button);
    if (this.mouseHeld.size === 0) {
      this.isPointerDown = false;
    }
    if (!(this.mouseHeld.has(0) && this.mouseHeld.has(2))) {
      this.cursorMoveActive = false;
      this.controls.enabled = true;
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (this.mode !== 'race') return;

    if (
      e.code === 'Space' ||
      e.code === 'Tab' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight'
    ) {
      e.preventDefault();
    }

    const wasHeld = this.keysHeld.has(e.code);

    if (!wasHeld) {
      if (e.code === this.bindings.pause || e.code === 'KeyP' || e.code === 'Escape') {
        this.callbacks.onPauseRequested();
        return;
      }
      if (e.code === 'Tab') {
        this.toggleRadar();
        return;
      }
    }

    if (this.paused || this.raceFinished) return;

    this.keysHeld.add(e.code);

    if (!wasHeld) {
      if (e.code === this.bindings.hop) {
        this.performHop();
      } else if (e.code === this.bindings.ability) {
        this.performFluxSurge();
      } else if (e.code === this.bindings.resetCamera || e.code === 'KeyV') {
        this.resetCamera();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private isActionHeld(actionCode: string, altCode?: string): boolean {
    if (this.keysHeld.has(actionCode)) return true;
    if (altCode && this.keysHeld.has(altCode)) return true;
    if (actionCode.startsWith('Mouse')) {
      const btn = Number(actionCode.replace('Mouse', ''));
      if (this.mouseHeld.has(btn)) return true;
    }
    return false;
  }

  private performHop(): void {
    const p = this.playerRacer;
    if (!p) return;
    // Grounded check relative to track surface (including service fork)
    const proj = projectPointToForkTrack(
      p.x,
      p.z,
      this.sampledPoints,
      8.5,
      this.isTrackClosed,
      this.forkZone,
    );
    if (p.y <= proj.trackY + 0.15) {
      p.vy = 7.4;
      p.squashScaleY = 1.2;
      p.squashScaleXZ = 0.86;
      this.audio.playHop();
      this.spawnParticles(p.x, p.y + 0.2, p.z, 8, 0x2dd4bf, 5);
    }
  }

  private performFluxSurge(): void {
    if (this.abilityCooldown > 0 || !this.playerRacer) return;
    if (this.dose < 15 && this.playerRacer.speed < 10) return;
    this.abilityCooldown = 6.5;
    this.abilitySurgeSec = 2.0;
    this.playerRacer.speed += 14;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.3);
    this.audio.playMutationSound(false);
    this.pushFloatingEvent('FLUX SURGE!', 'boon');
    this.spawnParticles(this.playerRacer.x, this.playerRacer.y + 0.7, this.playerRacer.z, 18, 0x38bdf8, 11);
  }

  private pushFloatingEvent(
    text: string,
    tone: 'boon' | 'damage' | 'dose' | 'wild',
  ): void {
    this.floatingEvents.push({
      id: this.nextEventId++,
      text,
      tone,
      timestamp: performance.now(),
    });
    if (this.floatingEvents.length > 4) {
      this.floatingEvents.shift();
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    count: number,
    colorHex: number,
    speed: number,
  ): void {
    const budget = this.graphics === 'low' ? Math.ceil(count * 0.25) : this.graphics === 'medium' ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < budget; i++) {
      const p = this.particlePool[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particleCount;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 1.1;
      p.y = y + Math.random() * 0.6;
      p.z = z + (Math.random() - 0.5) * 1.1;
      p.vx = (Math.random() - 0.5) * speed;
      p.vy = 1.5 + Math.random() * speed * 0.6;
      p.vz = (Math.random() - 0.5) * speed;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.45;
      p.scale = 0.7 + Math.random() * 0.9;
      p.color.setHex(colorHex);
    }
  }

  private triggerMutation(id: MutationId): void {
    const def = MUTATIONS[id];
    if (!def) return;
    this.discoveredInRace.add(id);
    this.callbacks.onMutationDiscovered(id);
    this.lastMutationEvent = { id, timestamp: performance.now() };

    if (def.category === 'boon') {
      if (!this.sessionBoons.includes(id)) {
        this.sessionBoons.push(id);
      }
      if (id === 'self_repair') {
        this.durability = Math.min(this.maxDurability, this.durability + def.durabilityDelta);
        this.subsystems = repairSubsystemPartial(this.subsystems, 20);
      }
      this.audio.playMutationSound(false);
      this.pushFloatingEvent(`+ ${def.nameEn}`, 'boon');
      if (this.playerRacer) {
        this.spawnParticles(this.playerRacer.x, this.playerRacer.y + 0.8, this.playerRacer.z, 16, 0x2dd4bf, 9);
      }
      this.mutationSweepTimer = 1.25;
      this.mutationSweepDir *= -1;
    } else if (def.category === 'incident') {
      this.durability = Math.max(0, this.durability + def.durabilityDelta);
      if (id === 'short_circuit') {
        this.subsystems.engine = Math.max(10, this.subsystems.engine - 10);
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.5);
      }
      this.audio.playMutationSound(true);
      this.pushFloatingEvent(`! ${def.nameEn}`, 'damage');
      if (this.playerRacer) {
        this.spawnParticles(this.playerRacer.x, this.playerRacer.y + 0.8, this.playerRacer.z, 18, 0xef4444, 12);
      }
    } else {
      this.audio.playMutationSound(false);
      this.pushFloatingEvent(def.nameEn, 'wild');
      this.mutationSweepTimer = 1.25;
      this.mutationSweepDir *= -1;
    }

    if (def.durationSec > 0) {
      this.activeBuffs = this.activeBuffs.filter((b) => b.id !== id);
      this.activeBuffs.push({
        id,
        remainingSec: def.durationSec,
        durationSec: def.durationSec,
      });
    } else if (def.category === 'boon' && id !== 'self_repair') {
      // Passive boon remains active for entire race
      if (!this.activeBuffs.some((b) => b.id === id)) {
        this.activeBuffs.push({ id, remainingSec: 999, durationSec: 999 });
      }
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTimeMs) / 1000;
      this.lastTimeMs = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      this.update(dt);
      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number): void {
    this.elapsedSec += dt;

    // Adaptive Dynamic Resolution Scaling on real GPUs
    if (!this.isSoftwareGl && this.graphics !== 'low') {
      this.smoothedFrameDt = THREE.MathUtils.lerp(this.smoothedFrameDt, dt, 0.08);
      this.dprAdjustCooldown -= dt;
      if (this.dprAdjustCooldown <= 0) {
        this.dprAdjustCooldown = 1.5;
        const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
        let nextDpr = this.adaptiveDpr;
        if (this.smoothedFrameDt > 0.024 && nextDpr > 0.85) {
          nextDpr = Math.max(0.85, Number((nextDpr - 0.15).toFixed(2)));
        } else if (this.smoothedFrameDt < 0.0155 && nextDpr < maxDpr) {
          nextDpr = Math.min(maxDpr, Number((nextDpr + 0.1).toFixed(2)));
        }
        if (Math.abs(nextDpr - this.adaptiveDpr) >= 0.05) {
          this.adaptiveDpr = nextDpr;
          this.renderer.setPixelRatio(this.adaptiveDpr);
        }
      }
    }

    if (this.mode === 'showcase') {
      this.updateShowcase(dt);
      return;
    }

    if (this.paused || this.raceFinished || !this.activeStage || !this.playerRacer) {
      return;
    }

    // Sim-level hitstop ticks camera/particles in real dt while freezing vehicle motion
    if (this.hitstopSec > 0) {
      this.hitstopSec = Math.max(0, this.hitstopSec - dt);
      this.updateParticles(dt);
      this.updateRaceCamera(dt);
      return;
    }

    this.raceElapsedSec += dt;
    if (this.abilityCooldown > 0) this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    if (this.abilitySurgeSec > 0) this.abilitySurgeSec = Math.max(0, this.abilitySurgeSec - dt);
    if (this.ventBoostCooldown > 0) this.ventBoostCooldown = Math.max(0, this.ventBoostCooldown - dt);
    if (this.weatherCooldown > 0) this.weatherCooldown = Math.max(0, this.weatherCooldown - dt);
    if (this.mutationSweepTimer > 0) this.mutationSweepTimer = Math.max(0, this.mutationSweepTimer - dt);
    if (this.hudStaticTimer > 0) this.hudStaticTimer = Math.max(0, this.hudStaticTimer - dt);
    if (this.voiceTimerSec > 0) {
      this.voiceTimerSec -= dt;
      if (this.voiceTimerSec <= 0) this.voiceLine = null;
    }
    this.nearMissCooldowns.forEach((rem, key) => {
      if (rem <= dt) this.nearMissCooldowns.delete(key);
      else this.nearMissCooldowns.set(key, rem - dt);
    });

    // Update active buffs timers
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      const b = this.activeBuffs[i];
      if (b.durationSec < 900) {
        b.remainingSec -= dt;
        if (b.remainingSec <= 0) {
          this.activeBuffs.splice(i, 1);
        }
      }
    }

    // 1. Update Player Physics & Mutation State
    const activeIds = this.activeBuffs.map((b) => b.id);
    const stats = computeVehicleStats(
      this.modules,
      this.permanentTraits,
      activeIds,
      this.subsystems,
    );
    this.currentMaxSpeed = stats.maxSpeed;

    const p = this.playerRacer;

    // Weather front zones: subtle crosswind force + sail_fins speed boost
    let weatherSpeedBonus = 0;
    for (const wf of this.weatherFronts) {
      const dx = p.x - wf.x;
      const dz = p.z - wf.z;
      if (dx * dx + dz * dz <= wf.radius * wf.radius) {
        const wfEff = computeWeatherFrontEffect(
          this.activeStage.biome,
          stats.hasSailFin,
          wf.crosswindForce,
        );
        weatherSpeedBonus = wfEff.speedBonus;
        p.lateralVel += wfEff.lateralPush * dt * 0.45;
        if (this.weatherCooldown <= 0) {
          this.weatherCooldown = 4.5;
          this.pushFloatingEvent(
            stats.hasSailFin ? 'TAILWIND +SAIL' : 'CROSSWIND FRONT',
            stats.hasSailFin ? 'boon' : 'wild',
          );
        }
        break;
      }
    }

    let throttleInput =
      this.touchThrottle !== 0
        ? this.touchThrottle
        : (this.isActionHeld(this.bindings.throttle, 'ArrowUp') ? 1 : 0) -
          (this.isActionHeld(this.bindings.brake, 'ArrowDown') ? 1 : 0);

    let steerInput =
      this.touchSteer !== 0
        ? this.touchSteer
        : (this.isActionHeld(this.bindings.steerLeft, 'ArrowLeft') ? 1 : 0) -
          (this.isActionHeld(this.bindings.steerRight, 'ArrowRight') ? 1 : 0);

    const bothMouseHeld = this.mouseHeld.has(0) && this.mouseHeld.has(2);
    if (bothMouseHeld && this.touchThrottle === 0 && this.touchSteer === 0) {
      this.cursorMoveActive = true;
      this.controls.enabled = false;
      this.cameraInspecting = false;
      _ndcVec2.set(this.cursorNdcX, this.cursorNdcY);
      _raycaster.setFromCamera(_ndcVec2, this.camera);
      _groundPlane.set(_upAxis, -p.y);
      if (_raycaster.ray.intersectPlane(_groundPlane, _cursorWorld)) {
        const cd = computeCursorDriveInput(p.x, p.z, p.yaw, _cursorWorld.x, _cursorWorld.z);
        throttleInput = cd.throttle;
        steerInput = cd.steer;
      }
    } else {
      this.cursorMoveActive = false;
      this.controls.enabled = true;
    }

    const isDrifting =
      this.touchDrift || this.isActionHeld(this.bindings.drift);

    // Core Overheat stutters throttle; Steering Spasm adds chaotic sway
    const overheatMult = stats.coreLockout ? 0.35 + 0.45 * Math.sin(this.elapsedSec * 18) : 1;
    const surgeBonus = this.abilitySurgeSec > 0 ? 14 : 0;
    const effectiveMaxSpeed = stats.maxSpeed + surgeBonus + weatherSpeedBonus;

    if (throttleInput > 0) {
      const launchBoost = p.speed < 22 ? 1.65 : 1.0;
      p.speed += stats.acceleration * launchBoost * throttleInput * overheatMult * dt;
    } else if (throttleInput < 0) {
      p.speed += stats.acceleration * 1.45 * throttleInput * dt;
    } else {
      // Natural rolling + aero drag
      p.speed *= Math.exp(-1.75 * dt);
    }

    // Off-track drag (Scenario §9: выезд за обочину тормозит; respects Repair Service Fork!)
    const proj = projectPointToForkTrack(
      p.x,
      p.z,
      this.sampledPoints,
      8.5,
      this.isTrackClosed,
      this.forkZone,
    );
    if (proj.offTrack) {
      const dragFactor = Math.exp(-2.1 * dt);
      p.speed *= dragFactor;
      if (Math.abs(proj.signedLateral) > 13.5 && !proj.onRepairBranch) {
        // Smooth guardrail rebound without snagging steering
        const pushBack = (Math.abs(proj.signedLateral) - 13.5) * Math.sign(proj.signedLateral);
        const nx = -proj.tangentZ;
        const nz = proj.tangentX;
        p.x -= nx * pushBack * 0.85;
        p.z -= nz * pushBack * 0.85;
        p.lateralVel *= 0.4;
        p.speed *= 0.88;
        const tangentYaw = Math.atan2(proj.tangentX, proj.tangentZ);
        let yDiff = tangentYaw - p.yaw;
        while (yDiff > Math.PI) yDiff -= Math.PI * 2;
        while (yDiff < -Math.PI) yDiff += Math.PI * 2;
        p.yaw += yDiff * 0.16;
      }
    }

    p.speed = Math.max(-16, Math.min(effectiveMaxSpeed, p.speed));

    // Steering + Asymmetric Damage Pull + Spasm + Gravity Slip
    const rawSpeedRatio = Math.min(1, Math.abs(p.speed) / 14);
    const speedRatio = throttleInput !== 0 ? Math.max(0.32, rawSpeedRatio) : rawSpeedRatio;
    const driftTurnMult = isDrifting ? 1.38 : 1.0;
    const spasmWave = stats.steeringSpasm ? Math.sin(this.elapsedSec * 9.5) * 1.4 : 0;
    const effectiveSteer = steerInput * stats.handling * driftTurnMult + stats.steeringBias + spasmWave;

    if (Math.abs(p.speed) > 0.35 || throttleInput !== 0) {
      const dirSign = p.speed >= -0.2 ? 1 : -1;
      p.yaw += effectiveSteer * speedRatio * dirSign * dt;
    }

    // Lateral velocity & drift slip (v3.2 §3.2 п.7: ZERO involuntary drift unless handbrake/drift button held!)
    if (isDrifting || stats.gravitySlip) {
      const slipRate = isDrifting ? 0.26 : 0.09;
      p.lateralVel = THREE.MathUtils.lerp(
        p.lateralVel,
        steerInput * p.speed * slipRate,
        Math.min(1, dt * 7),
      );
    } else {
      p.lateralVel *= Math.exp(-16 * dt);
    }

    const fx = Math.sin(p.yaw);
    const fz = Math.cos(p.yaw);
    const rx = fz;
    const rz = -fx;

    p.x += (fx * p.speed + rx * p.lateralVel * 0.35) * dt;
    p.z += (fz * p.speed + rz * p.lateralVel * 0.35) * dt;

    // Vertical Hop & Suspension Grounding
    p.vy -= 20 * dt;
    p.y += p.vy * dt;
    if (p.y <= proj.trackY) {
      if (p.vy < -3.2) {
        p.squashScaleY = 0.78;
        p.squashScaleXZ = 1.18;
      }
      p.y = proj.trackY;
      p.vy = 0;
    }
    p.squashScaleY = THREE.MathUtils.damp(p.squashScaleY, 1, 10, dt);
    p.squashScaleXZ = THREE.MathUtils.damp(p.squashScaleXZ, 1, 10, dt);

    // Suspension damage subtle bounce
    const bounceOffset =
      stats.suspensionBounce > 0.05 && p.speed > 10
        ? Math.sin(this.elapsedSec * 22) * stats.suspensionBounce * 0.14
        : 0;

    // Update player progress & laps
    this.updateRacerProgress(p, proj.progress);

    // Update player rig visuals
    p.rig.root.position.set(p.x, p.y + bounceOffset, p.z);
    p.rig.root.rotation.y = p.yaw;
    p.rig.bodyGroup.scale.set(p.squashScaleXZ, p.squashScaleY, p.squashScaleXZ);
    p.rig.bodyGroup.rotation.z = THREE.MathUtils.damp(
      p.rig.bodyGroup.rotation.z,
      -steerInput * 0.09 * speedRatio,
      10,
      dt,
    );
    p.rig.wheels.forEach((w) => {
      w.rotation.x += p.speed * dt * 0.65;
    });
    p.rig.frontWheelSteerGroups.forEach((wg) => {
      wg.rotation.y = THREE.MathUtils.damp(wg.rotation.y, steerInput * 0.36, 14, dt);
    });
    if (p.rig.steeringWheelGroup) {
      p.rig.steeringWheelGroup.rotation.z = THREE.MathUtils.damp(
        p.rig.steeringWheelGroup.rotation.z,
        -steerInput * 0.55,
        12,
        dt,
      );
    }
    if (p.rig.heroHeadGroup) {
      p.rig.heroHeadGroup.rotation.y = THREE.MathUtils.damp(
        p.rig.heroHeadGroup.rotation.y,
        steerInput * 0.28,
        8,
        dt,
      );
    }
    applyMutationVisualsToRig(
      p.rig,
      [...this.permanentTraits, ...activeIds],
      this.elapsedSec,
      Math.abs(p.speed) / 55,
    );

    // Damaged engine emits dark smoke
    if (this.subsystems.engine < 55 && Math.random() < dt * 8) {
      this.spawnParticles(p.x, p.y + 0.8, p.z, 1, 0x475569, 3);
    }
    // Acid exhaust glowing particles
    if (stats.hasAcidTrail && p.speed > 12 && Math.random() < dt * 16) {
      this.spawnParticles(p.x - fx * 2.2, p.y + 0.5, p.z - fz * 2.2, 1, 0xa3e635, 3);
    }
    // Speed-step reactive rear-tire dust/salt/spore plumes & drift sparks (v3.3 §2.5)
    if (Math.abs(p.speed) > 8 && p.y <= proj.trackY + 0.15) {
      const step = computeSpeedStep(p.speed, stats.maxSpeed);
      if (Math.random() < dt * (4 + step * 1.8)) {
        const dustHex =
          this.activeStage.biome === 'crystal'
            ? 0xe2e8f0
            : this.activeStage.biome === 'canyon'
              ? 0xd97706
              : this.activeStage.biome === 'spore'
                ? 0x2dd4bf
                : 0x94a3b8;
        const sideSign = Math.random() < 0.5 ? -0.9 : 0.9;
        this.spawnParticles(
          p.x - fx * 1.9 + rx * sideSign,
          p.y + 0.25,
          p.z - fz * 1.9 + rz * sideSign,
          1,
          isDrifting ? 0xfbbf24 : dustHex,
          isDrifting ? 6.5 : 3.5,
        );
      }
    }

    // Audio engine hum & speed-step harmonic pitch
    const speedStepNorm = computeSpeedStep(p.speed, stats.maxSpeed) / 8;
    this.audio.updateEngineHum(true, Math.max(Math.abs(p.speed) / 60, speedStepNorm));

    // 2. Resonance Boost Vents + Repair Service Lock + Memory Beacons + Radiation Accumulation
    if (this.forkZone && !this.forkRepairUsed) {
      const rp = this.forkZone.repairPad;
      const dx = p.x - rp.x;
      const dz = p.z - rp.z;
      if (dx * dx + dz * dz <= (rp.radius + 1.1) * (rp.radius + 1.1)) {
        this.forkRepairUsed = true;
        this.durability = Math.min(this.maxDurability, this.durability + 18);
        this.subsystems = repairSubsystemPartial(this.subsystems, 16);
        if (this.trackBuilt?.repairPadMesh) {
          const mat = this.trackBuilt.repairPadMesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.2;
          mat.opacity = 0.35;
        }
        this.audio.playMutationSound(false);
        this.pushFloatingEvent('REPAIR LOCK +18 HULL', 'boon');
        this.spawnParticles(p.x, p.y + 0.6, p.z, 18, 0x2dd4bf, 9);
      }
    }

    if (this.ventBoostCooldown <= 0) {
      for (const v of this.vents) {
        const dx = p.x - v.x;
        const dz = p.z - v.z;
        if (dx * dx + dz * dz <= (v.radius + 0.8) * (v.radius + 0.8)) {
          this.ventBoostCooldown = 1.4;
          p.speed = Math.min(effectiveMaxSpeed + 12, p.speed + 12);
          this.dose += 10;
          this.totalDose += 10;
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.2);
          this.audio.playMutationSound(false);
          this.pushFloatingEvent('RESONANCE BOOST!', 'boon');
          this.spawnParticles(p.x, p.y + 0.6, p.z, 14, 0xf59e0b, 10);
          break;
        }
      }
    }

    if (this.trackBuilt) {
      for (const bm of this.trackBuilt.beaconMeshes) {
        if (bm.data.collected) continue;
        const dx = p.x - bm.data.x;
        const dz = p.z - bm.data.z;
        if (dx * dx + dz * dz <= 14.5) {
          bm.data.collected = true;
          this.beaconsCollected += 1;
          this.beaconRepBonus += 2;
          bm.material.color.setHex(0x2dd4bf);
          bm.material.emissive.setHex(0x0f766e);
          bm.material.emissiveIntensity = 0.45;
          this.audio.playStartResonance();
          this.pushFloatingEvent(`+35◆ ${bm.data.nameEn}`, 'boon');
          this.spawnParticles(bm.data.x, bm.data.y + 2.0, bm.data.z, 16, 0xe6ba63, 9);
          this.voiceLine = {
            speaker: 'taka',
            textEn: `${bm.data.nameEn} — ${bm.data.loreEn}`,
            textRu: `${bm.data.nameRu} — ${bm.data.loreRu}`,
          };
          this.voiceTimerSec = 6.2;
        }
      }
    }

    if (this.isTrackClosed) {
      if (!this.finalLapRadioFired && p.lap === this.activeStage.laps && this.activeStage.laps > 1) {
        this.finalLapRadioFired = true;
        this.voiceLine = {
          speaker: 'vella',
          textEn: 'Final lap! Open the throttle and hold your line through the fissures!',
          textRu: 'Финальный круг! Не сбрасывай газ и держи траекторию между разломами!',
        };
        this.voiceTimerSec = 5.0;
      }
    } else {
      if (this.segmentRadioStage < 2 && p.progress >= 0.33) {
        this.segmentRadioStage = 2;
        this.voiceLine = {
          speaker: 'vella',
          textEn: 'Segment 2/3 cleared — corridor opens ahead, keep pushing through the vents!',
          textRu: 'Участок 2/3 — перегон набирает темп, держите траекторию!',
        };
        this.voiceTimerSec = 4.5;
      } else if (this.segmentRadioStage < 3 && p.progress >= 0.66) {
        this.segmentRadioStage = 3;
        this.voiceLine = {
          speaker: 'taka',
          textEn: 'Final segment 3/3! Destination airlock beacon is locked on the horizon!',
          textRu: 'Финальный участок 3/3! Маяк шлюза назначения уже на горизонте!',
        };
        this.voiceTimerSec = 4.8;
      }
    }

    let insidePatch = false;
    for (const patch of this.patches) {
      const dx = p.x - patch.x;
      const dz = p.z - patch.z;
      if (dx * dx + dz * dz <= (patch.radius + 1.1) * (patch.radius + 1.1)) {
        insidePatch = true;
        break;
      }
    }

    // Dose gain: fast in glowing patches, slow background leak outside
    const doseRate = insidePatch ? 34 : 2.8;
    const doseGain = doseRate * this.activeStage.intensity * dt;
    this.dose += doseGain;
    this.totalDose += doseGain;

    if (insidePatch && Math.random() < dt * 10) {
      this.spawnParticles(p.x, p.y + 0.4, p.z, 1, 0x2dd4bf, 4);
    }

    if (this.dose >= 100) {
      this.dose -= 100;
      const mutId = rollMutationFromDose(
        this.activeStage.stageNumber,
        this.activeStage.intensity,
      );
      this.triggerMutation(mutId);
    }

    // Scripted Stage Events (Stage 2 35% Chromophore, Stage 8 & 10 50% Whisper of Metal)
    const overallProgress = this.isTrackClosed
      ? Math.min(1, Math.max(0, (p.totalProgress - 1) / this.activeStage.laps))
      : Math.min(1, Math.max(0, p.progress));
    if (
      this.activeStage.scriptedEvent &&
      !this.scriptedFired &&
      overallProgress >= this.activeStage.scriptedEvent.atProgress
    ) {
      this.scriptedFired = true;
      this.triggerMutation(this.activeStage.scriptedEvent.mutationId);
      if (this.activeStage.scriptedEvent.voiceLine) {
        this.voiceLine = this.activeStage.scriptedEvent.voiceLine;
        this.voiceTimerSec = 7.5;
      }
    }

    // Stage 15 dramatic 80% 5.5s non-blocking HUD Static beat
    if (
      this.activeStage.id === '1_15' &&
      !this.stage15StaticTriggered &&
      overallProgress >= 0.8
    ) {
      this.stage15StaticTriggered = true;
      this.hudStaticTimer = 5.5;
      this.voiceLine = {
        speaker: 'voice',
        textEn: 'TELEMETRY SILENCE — FOLLOW THE ROOT PULSE.',
        textRu: 'РАДИОТИШИНА — ИДИ НА ПУЛЬС КОРНЯ.',
      };
      this.voiceTimerSec = 5.5;
    }

    // Record Personal Best Ghost & Update Ghost Playback
    this.ghostRecordTimer += dt;
    if (this.ghostRecordTimer >= 0.25 && this.recordedGhostFrames.length < 1200) {
      this.ghostRecordTimer = 0;
      this.recordedGhostFrames.push({
        t: Number(this.raceElapsedSec.toFixed(2)),
        x: Number(p.x.toFixed(2)),
        y: Number(p.y.toFixed(2)),
        z: Number(p.z.toFixed(2)),
        yaw: Number(p.yaw.toFixed(3)),
      });
    }
    if (this.ghostMesh && this.bestGhostFrames.length >= 2) {
      const gPose = sampleGhostPose(this.bestGhostFrames, this.raceElapsedSec);
      if (gPose) {
        this.ghostMesh.visible = true;
        this.ghostMesh.position.set(gPose.x, gPose.y + 0.08, gPose.z);
        this.ghostMesh.rotation.y = gPose.yaw;
      }
    }

    // 3. Update AI Racers (rubber-band ±16%, random incidents)
    const playerHasHolo = activeIds.includes('holo_decoy');
    for (const r of this.racers) {
      if (r.isPlayer) continue;
      this.updateAiRacer(r, dt, playerHasHolo);
    }

    // 4. Vehicle-to-Vehicle Collisions & Subsystem Damage Physics
    this.resolveCollisions();

    // 5. Animate Track Environment (patches, drones, dust)
    this.updateTrackVisuals(dt, overallProgress);

    // 6. Update Pooled Particles & Camera
    this.updateParticles(dt);
    this.updateRaceCamera(dt);

    // 7. Check Race Finish or DNF (Hull = 0)
    if (this.durability <= 0) {
      this.finishRace(true);
      return;
    }
    if (this.isTrackClosed ? p.lap > this.activeStage.laps : p.progress >= 0.988) {
      this.finishRace(false);
      return;
    }

    // 8. Throttle React HUD updates to ~10 Hz
    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.1) {
      this.hudEmitAccum = 0;
      this.emitHudSnapshot();
    }
  }

  private updateRacerProgress(r: RacerEntity, newProgress: number): void {
    if (!this.isTrackClosed) {
      r.lastProgress = newProgress;
      r.progress = newProgress;
      r.totalProgress = newProgress;
      r.lap = Math.min(3, Math.floor(newProgress * 3) + 1);
      return;
    }
    if (newProgress >= 0.35 && newProgress <= 0.68) {
      r.passedHalfway = true;
    }
    // Wrap around finish line only after clearing the halfway checkpoint
    if (r.lastProgress > 0.78 && newProgress < 0.22 && r.passedHalfway) {
      r.lap += 1;
      r.passedHalfway = false;
    }
    r.lastProgress = newProgress;
    r.progress = newProgress;
    const effectiveProgress = !r.passedHalfway && newProgress > 0.78 ? newProgress - 1 : newProgress;
    r.totalProgress = r.lap + effectiveProgress;
  }

  private updateAiRacer(r: RacerEntity, dt: number, playerHasHolo: boolean): void {
    const n = this.sampledPoints.length;
    const proj = projectPointToForkTrack(
      r.x,
      r.z,
      this.sampledPoints,
      8.5,
      this.isTrackClosed,
      null,
    );
    const lookIdx = this.isTrackClosed
      ? (proj.nearestIndex + 7) % n
      : Math.min(n - 1, proj.nearestIndex + 7);
    const lookPt = this.sampledPoints[lookIdx];
    const nextPt = this.isTrackClosed
      ? this.sampledPoints[(lookIdx + 1) % n]
      : this.sampledPoints[Math.min(n - 1, lookIdx + 1)];
    const prevLookPt =
      !this.isTrackClosed && lookIdx >= n - 1
        ? this.sampledPoints[Math.max(0, n - 2)]
        : lookPt;

    let tx = nextPt.x - prevLookPt.x;
    let tz = nextPt.z - prevLookPt.z;
    const tLen = Math.hypot(tx, tz) || 1;
    tx /= tLen;
    tz /= tLen;
    const nx = -tz;
    const nz = tx;

    const targetX = lookPt.x + nx * r.lateralTarget;
    const targetZ = lookPt.z + nz * r.lateralTarget;

    const desiredYaw = Math.atan2(targetX - r.x, targetZ - r.z);
    let diff = desiredYaw - r.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    r.yaw += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff * 4.5 * dt));

    r.incidentCooldown -= dt;
    let incidentSlow = 1.0;
    if (r.incidentCooldown <= 0) {
      r.incidentCooldown = 14 + Math.random() * 14;
      this.spawnParticles(r.x, r.y + 0.9, r.z, 8, 0xf97316, 7);
    } else if (r.incidentCooldown > 12.5) {
      incidentSlow = 0.75; // brief incident wobble
    }

    const targetSpeed =
      computeAiTargetSpeed(
        r.skill,
        this.playerRacer?.totalProgress ?? 1,
        r.totalProgress,
        this.difficulty,
        playerHasHolo,
      ) * incidentSlow;

    r.speed = THREE.MathUtils.damp(r.speed, targetSpeed, 2.5, dt);
    r.x += Math.sin(r.yaw) * r.speed * dt;
    r.z += Math.cos(r.yaw) * r.speed * dt;
    r.y = proj.trackY;

    this.updateRacerProgress(r, proj.progress);

    r.rig.root.position.set(r.x, r.y, r.z);
    r.rig.root.rotation.y = r.yaw;
    r.rig.wheels.forEach((w) => {
      w.rotation.x += r.speed * dt * 0.65;
    });
  }

  private resolveCollisions(): void {
    const minDist = 2.75;
    for (let i = 0; i < this.racers.length; i++) {
      for (let j = i + 1; j < this.racers.length; j++) {
        const a = this.racers[i];
        const b = this.racers[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001 && dist < minDist) {
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = minDist - dist;

          const totalMass = a.massKg + b.massKg;
          const shareA = b.massKg / totalMass;
          const shareB = a.massKg / totalMass;

          a.x -= nx * overlap * shareA;
          a.z -= nz * overlap * shareA;
          b.x += nx * overlap * shareB;
          b.z += nz * overlap * shareB;

          const relSpeed = Math.abs(a.speed - b.speed) + 8;

          if (a.isPlayer || b.isPlayer) {
            const player = a.isPlayer ? a : b;
            const other = a.isPlayer ? b : a;
            // Determine side offset relative to player forward
            const pRightX = Math.cos(player.yaw);
            const pRightZ = -Math.sin(player.yaw);
            const toOtherX = (other.x - player.x) / dist;
            const toOtherZ = (other.z - player.z) / dist;
            const sideOffset = toOtherX * pRightX + toOtherZ * pRightZ;

            const impact = applyImpactDamage(
              this.durability,
              this.subsystems,
              relSpeed,
              other.massKg / player.massKg,
              sideOffset,
              this.difficulty,
            );

            if (impact.hullDamage > 0.5) {
              this.durability = impact.nextDurability;
              this.subsystems = impact.nextSubsystems;
              this.hitstopSec = 0.04;
              this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.45);
              this.audio.playImpact(Math.min(1.4, impact.hullDamage / 10));
              this.spawnParticles(
                (a.x + b.x) * 0.5,
                player.y + 0.8,
                (a.z + b.z) * 0.5,
                16,
                0xfbbf24,
                12,
              );
              this.pushFloatingEvent(`-${Math.round(impact.hullDamage)} HULL`, 'damage');

              // Ramming reputation penalty if player rear-ended/rammed
              if (player.speed > other.speed + 5) {
                this.ramsCommitted += 1;
                this.ramReputationPenalty += 1;
              }
            }
            player.speed *= 0.84;
          }
        } else if (dist >= minDist && dist <= 4.75 && (a.isPlayer || b.isPlayer)) {
          // v3.2 §2.5 Near-Miss Showmanship: high-speed close pass without colliding!
          const player = a.isPlayer ? a : b;
          const other = a.isPlayer ? b : a;
          if (Math.abs(player.speed) > 16 && (this.nearMissCooldowns.get(other.id) ?? 0) <= 0) {
            this.nearMissCooldowns.set(other.id, 4.0);
            this.nearMissCount += 1;
            this.dose += 8;
            this.totalDose += 8;
            this.abilityCooldown = Math.max(0, this.abilityCooldown - 1.2);
            this.audio.playUiClick(1.45);
            this.pushFloatingEvent('NEAR MISS +15◆', 'boon');
            this.spawnParticles(
              (a.x + b.x) * 0.5,
              player.y + 0.8,
              (a.z + b.z) * 0.5,
              10,
              0x38bdf8,
              9,
            );
          }
        }
      }
    }
  }

  private updateTrackVisuals(dt: number, overallProgress: number): void {
    if (!this.trackBuilt) return;

    // Animate radiation patches (Stage 9 metronome pulse; Stage 7 leader-seeking drift!)
    const metronome = this.activeStage?.metronomePatches
      ? 0.65 + 0.35 * Math.sin(this.elapsedSec * Math.PI * 2)
      : 1.0;

    for (const pm of this.trackBuilt.patchMeshes) {
      const pulse = 1 + 0.08 * Math.sin(this.elapsedSec * 3.5 + pm.data.pulsePhase);
      pm.mesh.scale.set(pm.data.radius * pulse, 1, pm.data.radius * pulse);
      if (pm.light) {
        pm.light.intensity = 1.35 * metronome * pulse;
      }

      if (this.activeStage?.leaderSeekingPatches && this.playerRacer) {
        const dx = this.playerRacer.x - pm.data.x;
        const dz = this.playerRacer.z - pm.data.z;
        const d = Math.hypot(dx, dz);
        if (d > 2 && d < 26) {
          pm.data.x += (dx / d) * dt * 2.2;
          pm.data.z += (dz / d) * dt * 2.2;
          pm.mesh.position.set(pm.data.x, pm.data.y, pm.data.z);
          if (pm.light) pm.light.position.set(pm.data.x, pm.data.y + 1.5, pm.data.z);
        }
      }
    }

    // Patrol drones orbit overhead
    const n = this.sampledPoints.length;
    for (const d of this.trackBuilt.drones) {
      d.userData.trackT = (d.userData.trackT + dt * 0.04) % 1;
      const idx = Math.floor(d.userData.trackT * n) % n;
      const pt = this.sampledPoints[idx];
      d.position.set(pt.x, pt.y + 8 + Math.sin(this.elapsedSec * 2 + idx) * 1.2, pt.z);
      d.rotation.y += dt * 1.6;
    }

    // Floating dust motes
    const dustCount = this.trackBuilt.dustInstanced.count;
    const base = this.trackBuilt.dustBasePositions;
    for (let i = 0; i < dustCount; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1] + Math.sin(this.elapsedSec * 1.2 + i) * 0.6;
      const bz = base[i * 3 + 2];
      _v3A.set(bx, by, bz);
      _scaleVec.setScalar(1);
      _quat.identity();
      _mat4.compose(_v3A, _quat, _scaleVec);
      this.trackBuilt.dustInstanced.setMatrixAt(i, _mat4);
    }
    this.trackBuilt.dustInstanced.instanceMatrix.needsUpdate = true;

    // Update LOD distances from active camera
    for (const lod of this.trackBuilt.lods) {
      lod.update(this.camera);
    }

    // Pulse Whisper crystal outcrops in lockstep with fissures
    this.trackBuilt.whisperCrystalMat.emissiveIntensity =
      0.34 + 0.24 * (0.5 + 0.5 * Math.sin(this.elapsedSec * 3.2));

    // Rotate uncollected Memory Beacon crystals
    for (const bm of this.trackBuilt.beaconMeshes) {
      bm.crystal.rotation.y += dt * (bm.data.collected ? 0.45 : 2.1);
    }

    // Animate Leviathan Whale-Ships + Migrating Sky-Whale Pod (InstancedMesh)
    const wc = this.trackBuilt.whaleCenter;
    for (const ws of this.trackBuilt.whaleShips) {
      const ang = ws.baseAng + this.elapsedSec * ws.speed;
      ws.group.position.set(
        wc.x + Math.cos(ang) * ws.orbitRad,
        ws.baseY + Math.sin(this.elapsedSec * 0.7 + ws.baseAng) * 3.2,
        wc.z + Math.sin(ang) * ws.orbitRad,
      );
      ws.group.rotation.y = -ang;
      ws.group.rotation.x = Math.sin(this.elapsedSec * 0.55 + ws.baseAng) * 0.06;
    }

    if (this.trackBuilt.whalePodInst && this.trackBuilt.whalePodData.length > 0) {
      const pod = this.trackBuilt.whalePodInst;
      const podData = this.trackBuilt.whalePodData;
      for (let i = 0; i < podData.length; i++) {
        const w = podData[i];
        const ang = w.baseAng + this.elapsedSec * w.speed;
        _v3A.set(
          wc.x + Math.cos(ang) * w.orbitRad,
          w.baseY + Math.sin(this.elapsedSec * 0.9 + w.baseAng * 2) * 2.4,
          wc.z + Math.sin(ang) * w.orbitRad,
        );
        _euler.set(Math.sin(this.elapsedSec * 0.6 + i) * 0.05, -ang, 0);
        _quat.setFromEuler(_euler);
        _scaleVec.setScalar(w.scale);
        _mat4.compose(_v3A, _quat, _scaleVec);
        pod.setMatrixAt(i, _mat4);
      }
      pod.instanceMatrix.needsUpdate = true;
    }

    for (const wm of this.trackBuilt.weatherMeshes) {
      wm.rotation.y += dt * 0.4;
    }

    // Needle spire gentle glow pulse in Stage 15
    if (this.trackBuilt.needleSpire && overallProgress > 0.1) {
      this.trackBuilt.needleSpire.rotation.y = this.elapsedSec * 0.08;
    }

    // v3.2 §2.5 & §14: Dynamic Race Lighting Arc (shifts sky, fog & rim across stage progress!)
    const prog = Math.max(0, Math.min(1, overallProgress));
    _cSkyBase.setHex(this.trackBuilt.skyBaseHex);
    _cSkyMid.setHex(this.trackBuilt.glowHex).lerp(_cSkyBase, 0.72);
    _cSkyEnd.setHex(0xf59e0b).lerp(_cSkyBase, 0.78);
    if (prog < 0.55) {
      _cSkyMix.copy(_cSkyBase).lerp(_cSkyMid, prog / 0.55);
    } else {
      _cSkyMix.copy(_cSkyMid).lerp(_cSkyEnd, (prog - 0.55) / 0.45);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(_cSkyMix);
    }
    if (this.scene.fog) {
      this.scene.fog.color.copy(_cSkyMix);
    }
    this.rimLight.intensity = 0.6 + prog * 0.25;
  }

  private updateParticles(dt: number): void {
    let anyChanged = false;
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      anyChanged = true;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        _v3A.set(0, -999, 0);
        _scaleVec.setScalar(0);
        _quat.identity();
        _mat4.compose(_v3A, _quat, _scaleVec);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 14 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const alpha = 1 - p.life / p.maxLife;
      _v3A.set(p.x, p.y, p.z);
      _scaleVec.setScalar(p.scale * alpha);
      _euler.set(p.life * 4, p.life * 3, 0);
      _quat.setFromEuler(_euler);
      _mat4.compose(_v3A, _quat, _scaleVec);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, p.color);
    }
    if (anyChanged) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private updateRaceCamera(dt: number): void {
    const p = this.playerRacer;
    if (!p) return;

    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.8);
    const shakeAmt = this.cameraTrauma * this.cameraTrauma * 0.55;

    // Delta-translate camera & target even when inspecting so the camera ALWAYS follows the car!
    const dx = p.x - this.prevPlayerPos.x;
    const dy = p.y - this.prevPlayerPos.y;
    const dz = p.z - this.prevPlayerPos.z;
    this.prevPlayerPos.x = p.x;
    this.prevPlayerPos.y = p.y;
    this.prevPlayerPos.z = p.z;

    if (this.cameraInspecting) {
      this.camera.position.x += dx;
      this.camera.position.y += dy;
      this.camera.position.z += dz;
      this.controls.target.x += dx;
      this.controls.target.y += dy;
      this.controls.target.z += dz;

      if (!this.isPointerDown) {
        this.orbitAutoReturnTimer -= dt;
        if (this.orbitAutoReturnTimer <= 0) {
          this.cameraInspecting = false;
        }
      }
    } else {
      // Non-blocking mutation highlight camera sweep (v3.2 §2.5)
      const sweepAngle =
        this.mutationSweepTimer > 0
          ? Math.sin((1 - this.mutationSweepTimer / 1.25) * Math.PI) *
            0.52 *
            this.mutationSweepDir
          : 0;
      const camYaw = p.yaw + sweepAngle;
      const fx = Math.sin(camYaw);
      const fz = Math.cos(camYaw);
      const lookFx = Math.sin(p.yaw);
      const lookFz = Math.cos(p.yaw);
      const speedNorm = Math.min(1.2, Math.abs(p.speed) / Math.max(1, this.currentMaxSpeed));

      const desiredPos = _v3A.set(
        p.x - fx * (9.5 + speedNorm * 1.9),
        p.y + 4.3 + speedNorm * 0.35,
        p.z - fz * (9.5 + speedNorm * 1.9),
      );
      const desiredTarget = _v3B.set(
        p.x + lookFx * (sweepAngle !== 0 ? 1.8 : 5.2),
        p.y + 1.15,
        p.z + lookFz * (sweepAngle !== 0 ? 1.8 : 5.2),
      );

      const alpha = 1 - Math.exp(-8.5 * dt);
      this.camera.position.lerp(desiredPos, alpha);
      this.controls.target.lerp(desiredTarget, alpha);

      const targetFov = 56 + speedNorm * 12 + (this.abilitySurgeSec > 0 ? 5 : 0);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
      this.camera.updateProjectionMatrix();
    }

    this.controls.update();

    // Keep shadow-casting key light centered around player across full circuit
    this.keyLight.position.set(p.x + 28, p.y + 42, p.z + 22);
    this.keyLight.target.position.set(p.x, p.y, p.z);
    this.keyLight.target.updateMatrixWorld();

    if (shakeAmt > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }
  }

  private updateShowcase(dt: number): void {
    if (this.showcaseRig) {
      // Idle breathing + subtle cursor parallax tilt
      const breath = Math.sin(this.elapsedSec * 2.1) * 0.04;
      this.showcaseRig.bodyGroup.position.y = breath;
      this.showcaseRig.root.rotation.y = THREE.MathUtils.damp(
        this.showcaseRig.root.rotation.y,
        this.cursorNdcX * 0.25 + Math.sin(this.elapsedSec * 0.35) * 0.15,
        3.5,
        dt,
      );
      this.showcaseRig.bodyGroup.rotation.x = THREE.MathUtils.damp(
        this.showcaseRig.bodyGroup.rotation.x,
        -this.cursorNdcY * 0.05,
        4,
        dt,
      );
      if (this.showcaseRig.heroHeadGroup) {
        this.showcaseRig.heroHeadGroup.rotation.y = THREE.MathUtils.damp(
          this.showcaseRig.heroHeadGroup.rotation.y,
          this.cursorNdcX * 0.35,
          4.5,
          dt,
        );
        this.showcaseRig.heroHeadGroup.rotation.x = THREE.MathUtils.damp(
          this.showcaseRig.heroHeadGroup.rotation.x,
          -this.cursorNdcY * 0.14,
          4.5,
          dt,
        );
      }
      if (this.showcaseRig.steeringWheelGroup) {
        this.showcaseRig.steeringWheelGroup.rotation.z = THREE.MathUtils.damp(
          this.showcaseRig.steeringWheelGroup.rotation.z,
          -this.cursorNdcX * 0.28,
          4.5,
          dt,
        );
      }
      applyMutationVisualsToRig(this.showcaseRig, this.showcaseTraits, this.elapsedSec);
    }

    if (this.showcaseDust) {
      const count = this.showcaseDust.count;
      for (let i = 0; i < count; i++) {
        this.showcaseDust.getMatrixAt(i, _mat4);
        _mat4.decompose(_v3A, _quat, _scaleVec);
        _v3A.y += dt * 0.28;
        if (_v3A.y > 5.5) _v3A.y = 0.4;
        _mat4.compose(_v3A, _quat, _scaleVec);
        this.showcaseDust.setMatrixAt(i, _mat4);
      }
      this.showcaseDust.instanceMatrix.needsUpdate = true;
    }

    this.controls.update();
  }

  private finishRace(dnf: boolean): void {
    if (this.raceFinished || !this.activeStage || !this.playerRacer) return;
    this.raceFinished = true;
    this.audio.updateEngineHum(false, 0);
    this.clearAllInputs();

    const sorted = [...this.racers].sort((a, b) => b.totalProgress - a.totalProgress);
    const placement = dnf ? sorted.length : sorted.findIndex((r) => r.isPlayer) + 1;
    const hullPct = (this.durability / Math.max(1, this.maxDurability)) * 100;
    const questEval = this.activeQuest
      ? evaluateFieldQuest(this.activeQuest, {
          dnf,
          totalDose: this.totalDose,
          ramsCommitted: this.ramsCommitted,
          hullPercent: hullPct,
        })
      : null;
    const questCompleted = Boolean(questEval?.completed);
    const questBonusFluxite = questCompleted && this.activeQuest ? this.activeQuest.bonusFluxite : 0;
    const questBonusRep = questCompleted && this.activeQuest ? this.activeQuest.bonusReputation : 0;
    const beaconBonusFluxite = this.beaconsCollected * 35;
    const nearMissBonusFluxite = calculateNearMissBonus(this.nearMissCount);

    this.callbacks.onRaceFinish({
      stageId: this.activeStage.id,
      stageNumber: this.activeStage.stageNumber,
      dnf,
      placement,
      totalRacers: this.racers.length,
      elapsedSec: this.raceElapsedSec,
      totalDose: Math.round(this.totalDose),
      ramsCommitted: this.ramsCommitted,
      reputationDelta: -this.ramReputationPenalty + questBonusRep + this.beaconRepBonus,
      stageReward: this.activeStage.baseReward,
      placementReward: 0,
      doseReward: 0,
      questBonusFluxite,
      questCompleted,
      questTitleEn: this.activeQuest?.titleEn,
      questTitleRu: this.activeQuest?.titleRu,
      beaconsCollected: this.beaconsCollected,
      beaconBonusFluxite,
      nearMissCount: this.nearMissCount,
      nearMissBonusFluxite,
      totalFluxiteEarned: 0,
      sessionBoons: [...this.sessionBoons],
      newlyFixatedTraits: [],
      displacedTraits: [],
      discoveredMutations: Array.from(this.discoveredInRace),
      damageReport: { ...this.subsystems },
      recordedGhost:
        !dnf && this.recordedGhostFrames.length >= 2 ? [...this.recordedGhostFrames] : undefined,
    });
  }

  private emitHudSnapshot(): void {
    if (!this.activeStage || !this.playerRacer) return;
    const p = this.playerRacer;
    const sorted = [...this.racers].sort((a, b) => b.totalProgress - a.totalProgress);
    const pos = sorted.findIndex((r) => r.isPlayer) + 1;
    const proj = projectPointToForkTrack(
      p.x,
      p.z,
      this.sampledPoints,
      8.5,
      this.isTrackClosed,
      this.forkZone,
    );
    const speedKmh = Math.round(Math.abs(p.speed) * 4.2);
    const speedStep = computeSpeedStep(p.speed, this.currentMaxSpeed);
    const gear = Math.min(8, Math.max(1, speedStep || 1));
    const overallProgress = this.isTrackClosed
      ? Math.min(1, Math.max(0, (p.totalProgress - 1) / this.activeStage.laps))
      : Math.min(1, Math.max(0, p.progress));
    const segment = this.isTrackClosed ? 1 : Math.min(3, Math.floor(overallProgress * 3) + 1);
    const totalSegments = this.isTrackClosed ? 1 : 3;
    const distanceKm = Math.round(overallProgress * this.legDistanceKm);
    const startProgress = this.isTrackClosed
      ? 0
      : 12 / Math.max(1, this.sampledPoints.length - 1);
    const drivenProgress = Math.max(0, overallProgress - startProgress);
    const etaSec =
      drivenProgress > 0.015 && this.raceElapsedSec > 1.8 && overallProgress < 0.999
        ? Math.min(
            599,
            Math.max(1, Math.round((this.raceElapsedSec / drivenProgress) * (1 - overallProgress))),
          )
        : 0;

    const minimapRacers = this.racers.map((r) => {
      const charId = r.isPlayer ? 'taka' : (r.id as CharacterId);
      return {
        id: r.id,
        x: r.x,
        z: r.z,
        color: r.isPlayer ? '#2dd4bf' : CHARACTERS[charId].accentColor,
        isPlayer: r.isPlayer,
      };
    });

    // Compute nearest Whisper Radar target when active
    let radarTargetX = p.x;
    let radarTargetZ = p.z;
    let radarKind: 'vent' | 'patch' | 'beacon' = 'vent';
    let radarDist = Infinity;
    if (this.radarActive) {
      for (const b of this.beacons) {
        if (b.collected) continue;
        const d = Math.hypot(b.x - p.x, b.z - p.z);
        if (d < radarDist) {
          radarDist = d;
          radarTargetX = b.x;
          radarTargetZ = b.z;
          radarKind = 'beacon';
        }
      }
      if (!Number.isFinite(radarDist)) {
        for (const v of this.vents) {
          const d = Math.hypot(v.x - p.x, v.z - p.z);
          if (d < radarDist) {
            radarDist = d;
            radarTargetX = v.x;
            radarTargetZ = v.z;
            radarKind = 'vent';
          }
        }
      }
    }

    const now = performance.now();
    this.floatingEvents = this.floatingEvents.filter((e) => now - e.timestamp < 2400);

    const hullPct = (this.durability / Math.max(1, this.maxDurability)) * 100;
    const questEval = this.activeQuest
      ? evaluateFieldQuest(this.activeQuest, {
          dnf: false,
          totalDose: this.totalDose,
          ramsCommitted: this.ramsCommitted,
          hullPercent: hullPct,
        })
      : null;

    this.callbacks.onHudUpdate({
      speedKmh,
      speedStep,
      gear,
      lap: Math.min(this.activeStage.laps, p.lap),
      totalLaps: this.activeStage.laps,
      isPointToPoint: !this.isTrackClosed,
      segment,
      totalSegments,
      distanceKm,
      totalDistanceKm: this.legDistanceKm,
      etaSec,
      position: pos,
      totalRacers: this.racers.length,
      durability: Math.round(this.durability),
      maxDurability: this.maxDurability,
      subsystems: { ...this.subsystems },
      dose: Math.round(this.dose),
      totalDose: Math.round(this.totalDose),
      progress: overallProgress,
      activeBuffs: this.activeBuffs.map((b) => ({ ...b })),
      sessionBoons: [...this.sessionBoons],
      abilityCooldown: Number(this.abilityCooldown.toFixed(1)),
      abilityMaxCooldown: 6.5,
      isDrifting: this.touchDrift || this.isActionHeld(this.bindings.drift),
      isOffTrack: proj.offTrack,
      cursorMoveActive: this.cursorMoveActive,
      hudStaticActive: this.hudStaticTimer > 0,
      cameraInspecting: this.cameraInspecting,
      radar: {
        active: this.radarActive,
        x: radarTargetX,
        z: radarTargetZ,
        kind: radarKind,
        distance: Number.isFinite(radarDist) ? Math.round(radarDist) : 0,
      },
      beaconsCollected: this.beaconsCollected,
      beaconsTotal: this.beacons.length,
      nearMissCount: this.nearMissCount,
      voiceTransmission: this.voiceLine,
      lastMutationEvent: this.lastMutationEvent,
      floatingEvents: [...this.floatingEvents],
      quest: this.activeQuest && questEval
        ? {
            titleEn: this.activeQuest.titleEn,
            titleRu: this.activeQuest.titleRu,
            current: questEval.current,
            target: this.activeQuest.targetValue,
            status: questEval.status,
          }
        : null,
      minimapPoints: this.cachedMinimapPoints,
      minimapForkPoints:
        this.cachedForkMinimapPoints.length > 1 ? this.cachedForkMinimapPoints : undefined,
      minimapBeacons: this.beacons.map((b) => ({ x: b.x, z: b.z, collected: b.collected })),
      minimapRacers,
    });
  }

  private render(): void {
    if (
      !this.isSoftwareGl &&
      this.composer &&
      (this.graphics === 'high' || this.graphics === 'ultra')
    ) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('pointerup', this.onGlobalPointerUp);
    window.removeEventListener('pointercancel', this.onGlobalPointerUp);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('mousedown', this.onMouseDown);
    dom.removeEventListener('mouseup', this.onMouseUp);
    dom.removeEventListener('contextmenu', this.onContextMenu);

    this.cleanupShowcaseScene();
    this.cleanupRaceScene();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    this.controls.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
