import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyImpactDamage,
  buildHeraldDispatches,
  calculateModuleCost,
  calculateNearMissBonus,
  calculateRaceRewards,
  completeChapterProgression,
  computeAiTargetSpeed,
  computeSpeedStep,
  computeVehicleStats,
  createInitialSaveState,
  createPristineSubsystems,
  evaluateFieldQuest,
  exciseTrait,
  generateMemoryBeacons,
  generatePointToPointControlPoints,
  generateRadiationPatches,
  generateResonanceVents,
  generateSharpCornerMarkers,
  generateStageFieldQuest,
  generateTrackControlPoints,
  generateTrackSectionArches,
  projectPointToTrack,
  rollMutationFromDose,
  rollPermanentTraits,
  sampleClosedCatmullRom,
  sampleOpenCatmullRom,
  upgradeModule,
} from './rules';
import { getPlanetaryLegMeta, isPointToPointStage } from './data/planetaryRoutes';

test('module upgrade costs follow 260 * (level + 1) and deduct fluxite', () => {
  assert.equal(calculateModuleCost(0), 260);
  assert.equal(calculateModuleCost(1), 520);
  assert.equal(calculateModuleCost(4), 1300);

  let state = createInitialSaveState();
  assert.equal(state.fluxite, 350);
  const res1 = upgradeModule(state, 'engine');
  assert.equal(res1.upgraded, true);
  assert.equal(res1.nextState.fluxite, 90);
  assert.equal(res1.nextState.modules.engine, 1);

  // Insufficient funds for level 2 (520)
  const res2 = upgradeModule(res1.nextState, 'engine');
  assert.equal(res2.upgraded, false);
});

test('permanent trait fixation caps at 6 traits and excision costs 150 fluxite', () => {
  const existing = ['chromophore', 'synapse', 'sticky_core', 'sail_fins', 'acid_exhaust', 'self_repair'] as const;
  const roll = rollPermanentTraits(['holo_decoy'], [...existing], false, () => 0.1);
  assert.equal(roll.nextTraits.length, 6);
  assert.deepEqual(roll.newlyFixated, ['holo_decoy']);
  assert.deepEqual(roll.displaced, ['chromophore']);

  let state = createInitialSaveState();
  state = { ...state, fluxite: 200, permanentTraits: [...roll.nextTraits] };
  const excised = exciseTrait(state, 0);
  assert.equal(excised.excised, true);
  assert.equal(excised.nextState.fluxite, 50);
  assert.equal(excised.nextState.permanentTraits.length, 5);
});

test('subsystem impact damage reduces durability, armor, engine, and creates steering bias', () => {
  const subs = createPristineSubsystems();
  const res = applyImpactDamage(100, subs, 32, 2.0, 0.8, 'classic');
  assert.ok(res.hullDamage > 0);
  assert.ok(res.nextDurability < 100);
  assert.ok(res.nextSubsystems.armor < 100);
  assert.ok(res.nextSubsystems.steering < 100);
  assert.ok(res.nextSubsystems.steeringBias > 0);

  const statsDamaged = computeVehicleStats(
    { engine: 0, chassis: 0, grip: 0, armor: 0 },
    [],
    [],
    res.nextSubsystems,
  );
  const statsPristine = computeVehicleStats(
    { engine: 0, chassis: 0, grip: 0, armor: 0 },
    [],
    [],
    subs,
  );
  assert.ok(statsDamaged.maxSpeed < statsPristine.maxSpeed);
  assert.ok(statsDamaged.handling < statsPristine.handling);
});

test('race rewards compute placement + capped dose bonus (doubled on stage 7)', () => {
  const normal = calculateRaceRewards({
    stageBaseReward: 380,
    placement: 1,
    dose: 250, // > 200 cap => 400
    doubleDoseBonus: false,
    dnf: false,
    difficulty: 'classic',
  });
  assert.equal(normal.placementReward, 500);
  assert.equal(normal.doseReward, 400);
  assert.equal(normal.totalFluxiteEarned, 1280);

  const doubled = calculateRaceRewards({
    stageBaseReward: 380,
    placement: 1,
    dose: 250,
    doubleDoseBonus: true,
    dnf: false,
    difficulty: 'classic',
  });
  assert.equal(doubled.doseReward, 800);
  assert.equal(doubled.totalFluxiteEarned, 1680);

  const dnf = calculateRaceRewards({
    stageBaseReward: 380,
    placement: 1,
    dose: 100,
    dnf: true,
    difficulty: 'classic',
  });
  assert.equal(dnf.totalFluxiteEarned, 0);
});

test('chapter completion never regresses unlocked chapters or artifacts', () => {
  let state = createInitialSaveState();
  state = completeChapterProgression(state, '1_1', '1_2', 'art_1_1');
  state = completeChapterProgression(state, '1_2', '1_3', 'art_1_2');
  // Replaying 1_1 must keep 1_2 and 1_3 unlocked
  state = completeChapterProgression(state, '1_1', '1_2', 'art_1_1');
  assert.ok(state.unlockedChapters.includes('1_1'));
  assert.ok(state.unlockedChapters.includes('1_2'));
  assert.ok(state.unlockedChapters.includes('1_3'));
  assert.equal(state.artifacts.length, 2);
});

test('procedural track spline, radiation patches, and resonance vents generate valid circuit', () => {
  const ctrl = generateTrackControlPoints(42, 'crystal', 1);
  const sampled = sampleClosedCatmullRom(ctrl, 180);
  assert.equal(sampled.length, 180);

  const p0 = sampled[0];
  const proj = projectPointToTrack(p0.x, p0.z, sampled);
  assert.equal(proj.offTrack, false);
  assert.ok(proj.distanceFromCenter < 0.01);

  const patches = generateRadiationPatches(sampled, 42, 1.2);
  assert.ok(patches.length >= 16);

  const vents = generateResonanceVents(sampled, 42);
  assert.equal(vents.length, 6);
});

test('AI rubber-band, mutation roll, and field quests obey rules', () => {
  const fastAi = computeAiTargetSpeed(0.8, 0.9, 0.5, 'classic', false);
  const slowAi = computeAiTargetSpeed(0.8, 0.5, 0.9, 'classic', false);
  assert.ok(fastAi > slowAi);

  const m = rollMutationFromDose(8, 1.5, () => 0.65);
  assert.ok(m === 'grav_inversion' || m === 'metal_whisper');

  const q1 = generateStageFieldQuest(1, 0.6);
  assert.equal(q1.kind, 'flux_conduit');
  assert.equal(
    evaluateFieldQuest(q1, { dnf: false, totalDose: 150, ramsCommitted: 0, hullPercent: 90 }).completed,
    true,
  );
  const q2 = generateStageFieldQuest(2, 0.8);
  assert.equal(q2.kind, 'clean_line');
  assert.equal(
    evaluateFieldQuest(q2, { dnf: false, totalDose: 50, ramsCommitted: 1, hullPercent: 90 }).completed,
    false,
  );
});

test('memory beacons, section arches, and herald dispatches scale cleanly', () => {
  const ctrl = generateTrackControlPoints(101, 'canyon', 3);
  const sampled = sampleClosedCatmullRom(ctrl, 180);

  const arches = generateTrackSectionArches(sampled);
  assert.equal(arches.length, 4);

  const beacons = generateMemoryBeacons(sampled, 101, 3);
  assert.equal(beacons.length, 3);
  assert.ok(beacons.every((b) => !b.collected && b.nameEn.length > 0));

  const baseHerald = buildHeraldDispatches([], 50, { sold: null, collider: null, ending: null });
  const richHerald = buildHeraldDispatches(['1_1', '1_2', '1_15'], 75, {
    sold: true,
    collider: null,
    ending: 'awake',
  });
  assert.ok(richHerald.length > baseHerald.length);
  assert.ok(richHerald.some((d) => d.id === 'herald_finale'));
});

test('v3.2 speed steps, near-miss bonus, and smooth corner caution markers work accurately', () => {
  assert.equal(computeSpeedStep(0, 50), 0);
  assert.equal(computeSpeedStep(5, 50), 1);
  assert.equal(computeSpeedStep(25, 50), 4);
  assert.equal(computeSpeedStep(60, 50), 8);

  assert.equal(calculateNearMissBonus(0), 0);
  assert.equal(calculateNearMissBonus(4), 60);
  assert.equal(calculateNearMissBonus(99), 180);

  const ctrl = generateTrackControlPoints(77, 'canyon', 4);
  const sampled = sampleClosedCatmullRom(ctrl, 240);
  const cautions = generateSharpCornerMarkers(sampled);
  assert.ok(Array.isArray(cautions));
});

test('v3.3 planetary point-to-point overland routes keep 1_1 closed and 1_2..1_15 open A->B', () => {
  assert.equal(isPointToPointStage('1_1', 1), false);
  assert.equal(isPointToPointStage('1_2', 2), true);
  assert.equal(isPointToPointStage('1_15', 15), true);
  assert.equal(isPointToPointStage('free_season', 16), true);

  const leg3 = getPlanetaryLegMeta(3, 'canyon');
  assert.equal(leg3.isPointToPoint, true);
  assert.ok(leg3.distanceKm >= 320 && leg3.distanceKm <= 500);

  const openCtrl = generatePointToPointControlPoints(560, 'canyon', 3);
  const openSampled = sampleOpenCatmullRom(openCtrl, 340);
  assert.equal(openSampled.length, 340);

  const first = openSampled[0];
  const last = openSampled[openSampled.length - 1];
  const endpointDist = Math.hypot(last.x - first.x, last.z - first.z);
  assert.ok(endpointDist > 800, 'Overland point-to-point route should span > 800m A->B');

  const projStart = projectPointToTrack(first.x, first.z, openSampled, 8.5, false);
  const projEnd = projectPointToTrack(last.x, last.z, openSampled, 8.5, false);
  assert.equal(projStart.progress, 0);
  assert.equal(projEnd.progress, 1);

  const openArches = generateTrackSectionArches(openSampled, false);
  assert.equal(openArches.length, 3);

  const openVents = generateResonanceVents(openSampled, 560, false);
  assert.equal(openVents.length, 8);

  const openBeacons = generateMemoryBeacons(openSampled, 560, 3, false);
  assert.equal(openBeacons.length, 3);
});

import {
  computeCursorDriveInput,
  computeWeatherFrontEffect,
  evaluateSponsorContract,
  generateSplitForkZone,
  generateWeatherFronts,
  projectPointToForkTrack,
  sampleGhostPose,
} from './rules';

test('v3.3+ mid-route repair fork keeps player on-track and weather fronts reward sail_fins', () => {
  const closedCtrl = generateTrackControlPoints(42, 'crystal', 1);
  const closedSampled = sampleClosedCatmullRom(closedCtrl, 180);
  assert.equal(generateSplitForkZone(closedSampled, true), null);

  const openCtrl = generatePointToPointControlPoints(560, 'storm', 6);
  const openSampled = sampleOpenCatmullRom(openCtrl, 340);
  const fork = generateSplitForkZone(openSampled, false);
  assert.ok(fork !== null);
  assert.ok(fork.repairBranchPoints.length > 10);
  assert.equal(fork.fluxVents.length, 2);

  // Driving on the Repair Pad center must register as onRepairBranch & NOT offTrack
  const projRepair = projectPointToForkTrack(
    fork.repairPad.x,
    fork.repairPad.z,
    openSampled,
    8.5,
    false,
    fork,
  );
  assert.equal(projRepair.onRepairBranch, true);
  assert.equal(projRepair.offTrack, false);
  assert.ok(projRepair.progress >= fork.startT && projRepair.progress <= fork.endT);

  const fronts = generateWeatherFronts(openSampled, 560, false);
  assert.equal(fronts.length, 2);
  const noSail = computeWeatherFrontEffect('storm', false, 2.0);
  const withSail = computeWeatherFrontEffect('storm', true, 2.0);
  assert.equal(noSail.speedBonus, 0);
  assert.ok(withSail.speedBonus > 5);
  assert.ok(Math.abs(withSail.lateralPush) < Math.abs(noSail.lateralPush));
});

test('RMB+LMB cursor drive steers left/right toward target and stops in deadzone', () => {
  // Car facing +Z (yaw = 0) at origin
  const straight = computeCursorDriveInput(0, 0, 0, 0, 20);
  assert.equal(straight.throttle, 1);
  assert.ok(Math.abs(straight.steer) < 0.01);

  // Screen left is +X when facing +Z
  const leftTurn = computeCursorDriveInput(0, 0, 0, 10, 10);
  assert.equal(leftTurn.throttle, 1);
  assert.ok(leftTurn.steer > 0.7);

  // Screen right is -X when facing +Z
  const rightTurn = computeCursorDriveInput(0, 0, 0, -10, 10);
  assert.equal(rightTurn.throttle, 1);
  assert.ok(rightTurn.steer < -0.7);

  // Inside deadzone (< 1.8m) stops throttle
  const deadzone = computeCursorDriveInput(0, 0, 0, 0.5, 0.5);
  assert.equal(deadzone.throttle, 0);
  assert.equal(deadzone.steer, 0);
});

test('faction sponsor contracts evaluate conditions accurately and ghost interpolation wraps yaw', () => {
  const leaguePass = evaluateSponsorContract('league', {
    dnf: false,
    placement: 2,
    ramsCommitted: 0,
    totalDose: 50,
    beaconsCollected: 0,
    hullPercent: 80,
    nearMissCount: 0,
  });
  assert.equal(leaguePass.completed, true);
  assert.equal(leaguePass.bonusFluxite, 160);

  const leagueFail = evaluateSponsorContract('league', {
    dnf: false,
    placement: 1,
    ramsCommitted: 1,
    totalDose: 50,
    beaconsCollected: 0,
    hullPercent: 80,
    nearMissCount: 0,
  });
  assert.equal(leagueFail.completed, false);

  const artisanPass = evaluateSponsorContract('artisan', {
    dnf: false,
    placement: 4,
    ramsCommitted: 0,
    totalDose: 40,
    beaconsCollected: 0,
    hullPercent: 78,
    nearMissCount: 2,
  });
  assert.equal(artisanPass.completed, true);
  assert.equal(artisanPass.bonusFluxite, 175);

  const ghost = sampleGhostPose(
    [
      { t: 0, x: 0, y: 0, z: 0, yaw: Math.PI - 0.1 },
      { t: 2, x: 10, y: 2, z: 20, yaw: -Math.PI + 0.1 },
    ],
    1.0,
  );
  assert.ok(ghost !== null);
  assert.ok(Math.abs(ghost.x - 5) < 0.01);
  assert.ok(Math.abs(ghost.z - 10) < 0.01);
  assert.ok(Math.abs(Math.abs(ghost.yaw) - Math.PI) < 0.05);
});

