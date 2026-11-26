import * as THREE from 'three';
import type {
  RadiationPatch,
  ResonanceVent,
  SplitForkZone,
  TrackArchMarker,
  TrackPoint2D,
  WeatherFrontZone,
} from '../rules';
import type { BiomeId, GraphicsLevel, MemoryBeacon } from '../types';
import type { ProceduralTextureSet } from './textures';

export interface BuiltTrackScene {
  group: THREE.Group;
  patchMeshes: Array<{
    mesh: THREE.Mesh;
    light?: THREE.PointLight;
    data: RadiationPatch;
  }>;
  ventMeshes: Array<{
    group: THREE.Group;
    data: ResonanceVent;
  }>;
  beaconMeshes: Array<{
    group: THREE.Group;
    crystal: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    data: MemoryBeacon;
  }>;
  repairPadMesh: THREE.Mesh | null;
  weatherMeshes: THREE.Mesh[];
  whaleCenter: { x: number; z: number };
  whaleShips: Array<{
    group: THREE.Group;
    baseAng: number;
    orbitRad: number;
    baseY: number;
    speed: number;
  }>;
  whalePodInst: THREE.InstancedMesh | null;
  whalePodData: Array<{
    baseAng: number;
    orbitRad: number;
    baseY: number;
    speed: number;
    scale: number;
  }>;
  whisperCrystalMat: THREE.MeshPhysicalMaterial;
  skyBaseHex: number;
  glowHex: number;
  lods: THREE.LOD[];
  godRays: THREE.Mesh[];
  drones: THREE.Group[];
  dustInstanced: THREE.InstancedMesh;
  dustBasePositions: Float32Array;
  needleSpire: THREE.Group | null;
  dispose: () => void;
}

export function createWhisperCrystalShardGeometry(seedOffset = 0): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.18, 0.92, 3.2, 5, 4);
  geo.translate(0, 1.6, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const hNorm = Math.max(0, y / 3.2);
    // Asymmetric diagonal cleavage near tip + organic mineral growth bulge
    const bulge = 1 + Math.sin(hNorm * Math.PI * 1.4 + seedOffset) * 0.16;
    const shearX = hNorm * (0.28 + Math.sin(seedOffset * 2.1) * 0.18);
    const shearZ = hNorm * (0.16 * Math.cos(seedOffset * 1.7));
    if (hNorm > 0.75) {
      y += (x * 0.42 + z * 0.25) * (hNorm - 0.75) * 2.1;
    }
    x = x * bulge + shearX + Math.sin(y * 3.1 + z * 2.2 + seedOffset) * 0.08;
    z = z * bulge + shearZ + Math.cos(y * 2.7 + x * 2.5 + seedOffset) * 0.08;
    pos.setXYZ(i, x, Math.max(0, y), z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createBasaltCollarGeometry(seedOffset = 0): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(1.15, 1.78, 0.85, 8, 2);
  geo.translate(0, 0.38, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const jag = 0.82 + 0.24 * Math.sin(ang * 3 + seedOffset) + 0.14 * Math.cos(ang * 5 - seedOffset);
    x *= jag;
    z *= jag;
    if (y > 0.2) {
      y += Math.sin(ang * 2 + seedOffset) * 0.16;
    }
    pos.setXYZ(i, x, Math.max(0, y), z);
  }
  geo.computeVertexNormals();
  return geo;
}

function sculptBiomeFormation(biome: BiomeId, variantIdx: number): THREE.BufferGeometry {
  const seed = variantIdx * 2.37 + 0.7;
  if (biome === 'crystal') {
    // Salt Toros & Buckled Crust Slabs (zero bare octahedrons)
    const geo = new THREE.BoxGeometry(3.4, 2.8, 2.2, 4, 5, 4);
    geo.translate(0, 1.25, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      const z = pos.getZ(i);
      const h = Math.max(0, y / 2.8);
      // Terraced salt ridges + windward shear
      const strata = Math.round(h * 5) / 5;
      const taper = 1.0 - h * 0.36;
      const tilt = h * (0.45 + variantIdx * 0.18);
      x = x * taper + tilt + Math.sin(strata * 6 + z * 0.9 + seed) * 0.32;
      const nz = z * taper + Math.cos(x * 0.8 + seed) * 0.24;
      y += Math.sin(x * 0.9 + seed) * 0.28 * h;
      pos.setXYZ(i, x, Math.max(0, y), nz);
    }
    geo.computeVertexNormals();
    return geo;
  }

  if (biome === 'canyon') {
    // Stratified Erosion Buttes & Hoodoos
    const geo = new THREE.CylinderGeometry(1.15, 2.35, 5.2, 9, 6);
    geo.translate(0, 2.4, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let y = pos.getY(i);
      const z = pos.getZ(i);
      const h = Math.max(0, y / 5.2);
      const ang = Math.atan2(z, x);
      // Sedimentary overhang ledges at discrete heights
      const ledge = 1.0 + 0.24 * Math.sin(h * Math.PI * 5 + seed);
      const noise = 0.88 + 0.2 * Math.sin(ang * 3 + h * 3 + seed);
      const nx = x * ledge * noise + h * 0.22 * Math.sin(seed);
      const nz = z * ledge * noise;
      if (h > 0.85) y -= (Math.sin(ang * 2 + seed) * 0.25);
      pos.setXYZ(i, nx, Math.max(0, y), nz);
    }
    geo.computeVertexNormals();
    return geo;
  }

  if (biome === 'spore') {
    // Organic Silicon Reef Stalks & Shelf Plates
    const geo = new THREE.CylinderGeometry(0.95, 1.75, 4.6, 9, 6);
    geo.translate(0, 2.1, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const h = Math.max(0, y / 4.6);
      const ang = Math.atan2(z, x);
      // Flared organic cap + ribbed stalk
      const flare = h > 0.62 ? 1 + (h - 0.62) * 1.85 : 0.78 + 0.22 * Math.cos(h * 4 + seed);
      const sway = Math.sin(h * Math.PI + seed) * 0.35;
      const lobe = 1 + 0.16 * Math.sin(ang * 4 + seed);
      pos.setXYZ(i, x * flare * lobe + sway, Math.max(0, y), z * flare * lobe);
    }
    geo.computeVertexNormals();
    return geo;
  }

  if (biome === 'storm') {
    // Wind-Sheared Basalt Escarpments & Dune Crests
    const geo = new THREE.BoxGeometry(4.2, 2.6, 2.6, 5, 4, 4);
    geo.translate(0, 1.15, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const h = Math.max(0, y / 2.6);
      // Swept dune crest profile: gradual windward rise, steep leeward cut
      x += h * 0.95;
      z *= 1 - h * 0.52;
      y *= 0.7 + 0.42 * Math.cos((x / 2.4) + seed);
      pos.setXYZ(i, x, Math.max(0, y), z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // needle / epicenter: Tilted Fractured Buki-Buki Ruin Slabs
  const geo = new THREE.BoxGeometry(2.6, 4.8, 1.4, 3, 5, 2);
  geo.translate(0, 2.1, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const h = Math.max(0, y / 4.8);
    // Stepped bevelled monolith with one broken top corner
    if (h > 0.78 && x > 0) {
      y -= x * 0.55;
    }
    x += h * (0.28 * Math.sin(seed));
    z += Math.sin(h * 6 + seed) * 0.08;
    pos.setXYZ(i, x, Math.max(0, y), z);
  }
  geo.computeVertexNormals();
  return geo;
}

const BIOME_ATMOSPHERE: Record<
  BiomeId,
  { skyHex: number; fogDensity: number; propColorA: number; propColorB: number; glowHex: number }
> = {
  crystal: {
    skyHex: 0x152238,
    fogDensity: 0.0028,
    propColorA: 0x7dd3fc,
    propColorB: 0xe0f2fe,
    glowHex: 0x2dd4bf,
  },
  canyon: {
    skyHex: 0x1e100c,
    fogDensity: 0.0032,
    propColorA: 0xc2410c,
    propColorB: 0x78350f,
    glowHex: 0xf59e0b,
  },
  spore: {
    skyHex: 0x091918,
    fogDensity: 0.0036,
    propColorA: 0x14b8a6,
    propColorB: 0x84cc16,
    glowHex: 0x34d399,
  },
  storm: {
    skyHex: 0x090c16,
    fogDensity: 0.0048,
    propColorA: 0x475569,
    propColorB: 0x6366f1,
    glowHex: 0x818cf8,
  },
  needle: {
    skyHex: 0x110d1e,
    fogDensity: 0.0034,
    propColorA: 0x4c1d95,
    propColorB: 0xd4a853,
    glowHex: 0xe6ba63,
  },
  epicenter: {
    skyHex: 0x14081c,
    fogDensity: 0.004,
    propColorA: 0x9333ea,
    propColorB: 0xf0abfc,
    glowHex: 0xf0abfc,
  },
};

export function buildTrackEnvironment(params: {
  scene: THREE.Scene;
  biome: BiomeId;
  sampledPoints: TrackPoint2D[];
  patches: RadiationPatch[];
  vents: ResonanceVent[];
  arches: TrackArchMarker[];
  beacons: MemoryBeacon[];
  cautionMarkers: TrackArchMarker[];
  forkZone?: SplitForkZone | null;
  weatherFronts?: WeatherFrontZone[];
  textures: ProceduralTextureSet;
  graphics: GraphicsLevel;
  isSoftwareGl: boolean;
  closed?: boolean;
  denseFog?: boolean;
  orderDrones?: boolean;
}): BuiltTrackScene {
  const {
    scene,
    biome,
    sampledPoints,
    patches,
    vents,
    arches,
    beacons,
    cautionMarkers,
    forkZone = null,
    weatherFronts = [],
    textures,
    graphics,
    isSoftwareGl,
    closed = true,
    denseFog,
    orderDrones,
  } = params;

  const atmo = BIOME_ATMOSPHERE[biome];
  const fogDensity = denseFog ? atmo.fogDensity * 1.35 : atmo.fogDensity;
  scene.background = new THREE.Color(atmo.skyHex);
  scene.fog = new THREE.FogExp2(atmo.skyHex, fogDensity);

  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  // Compute dynamic route bounding box so overland planetary legs have full terrain coverage
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const pt of sampledPoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.z > maxZ) maxZ = pt.z;
  }
  const centerX = (minX + maxX) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;
  const spanX = Math.max(400, maxX - minX);
  const spanZ = Math.max(400, maxZ - minZ);
  const terrW = spanX + 620;
  const terrH = spanZ + 620;
  const maxSpan = Math.max(spanX, spanZ);

  // 1. Extended organic terrain ground kept cleanly below track corridor
  const terrainGeo = new THREE.PlaneGeometry(terrW, terrH, 48, 48);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(centerX, 0, centerZ);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    let minD2 = Infinity;
    let nearestY = 0;
    for (let s = 0; s < sampledPoints.length; s += 6) {
      const sp = sampledPoints[s];
      const dx = vx - sp.x;
      const dz = vz - sp.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < minD2) {
        minD2 = d2;
        nearestY = sp.y;
      }
    }
    const distFromTrack = Math.sqrt(minD2);
    const rim = Math.max(0, distFromTrack - 52) * 0.16;
    const wave = Math.sin(vx * 0.035) * Math.cos(vz * 0.035) * (distFromTrack < 28 ? 0.25 : 1.5);
    posAttr.setY(i, nearestY - 1.25 + rim + wave);
  }
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshPhysicalMaterial({
    map: textures.terrainAlbedo,
    normalMap: textures.terrainNormal,
    normalScale: new THREE.Vector2(0.42, 0.42),
    color: 0xffffff,
    roughness: biome === 'crystal' ? 0.48 : biome === 'spore' ? 0.56 : 0.88,
    metalness: biome === 'crystal' ? 0.18 : 0.08,
    clearcoat: biome === 'crystal' ? 0.28 : biome === 'spore' ? 0.22 : 0,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.52,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isSoftwareGl && graphics !== 'low';
  group.add(terrainMesh);
  disposables.push(terrainGeo, terrainMat);

  // 2. Track Ribbon BufferGeometry (width = 17m -> half-width 8.5m)
  const n = sampledPoints.length;
  const halfW = 8.5;
  const roadVerts: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  let accumDist = 0;
  const endVertIdx = closed ? n : n - 1;
  for (let i = 0; i <= endVertIdx; i++) {
    const p = closed ? sampledPoints[i % n] : sampledPoints[Math.min(n - 1, i)];
    const prev = closed ? sampledPoints[(i - 1 + n) % n] : sampledPoints[Math.max(0, i - 1)];
    const next = closed ? sampledPoints[(i + 1) % n] : sampledPoints[Math.min(n - 1, i + 1)];
    if (i > 0) {
      accumDist += Math.hypot(p.x - prev.x, p.z - prev.z);
    }
    let tx = !closed && i >= n - 1 ? p.x - prev.x : next.x - p.x;
    let tz = !closed && i >= n - 1 ? p.z - prev.z : next.z - p.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const nx = -tz;
    const nz = tx;

    roadVerts.push(p.x - nx * halfW, p.y + 0.04, p.z - nz * halfW);
    roadVerts.push(p.x + nx * halfW, p.y + 0.04, p.z + nz * halfW);

    const vCoord = accumDist * 0.06;
    roadUvs.push(0, vCoord, 1, vCoord);

    if (i < endVertIdx) {
      const base = i * 2;
      roadIndices.push(base, base + 2, base + 1);
      roadIndices.push(base + 1, base + 2, base + 3);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshPhysicalMaterial({
    map: textures.trackAlbedo,
    roughnessMap: textures.trackRoughness,
    bumpMap: textures.trackBump,
    bumpScale: 0.08,
    color: 0xffffff,
    roughness: biome === 'crystal' ? 0.46 : 0.72,
    metalness: biome === 'crystal' ? 0.18 : 0.16,
    clearcoat: biome === 'crystal' ? 0.26 : 0,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = !isSoftwareGl && graphics !== 'low';
  group.add(roadMesh);
  disposables.push(roadGeo, roadMat);

  // 3. Start Pylons & (for Point-to-Point) Natural Destination Airlock Gate
  const startGridIdx = closed ? 0 : 12;
  const startPt = sampledPoints[startGridIdx];
  const nextPt = sampledPoints[Math.min(n - 1, startGridIdx + 1)];
  const startYaw = Math.atan2(nextPt.x - startPt.x, nextPt.z - startPt.z);

  const archGroup = new THREE.Group();
  archGroup.position.set(startPt.x, startPt.y, startPt.z);
  archGroup.rotation.y = startYaw;

  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x222636,
    roughness: 0.62,
    metalness: 0.48,
  });
  const brassCollarMat = new THREE.MeshStandardMaterial({
    color: 0xd4a853,
    roughness: 0.34,
    metalness: 0.78,
  });
  const lanternMat = new THREE.MeshPhysicalMaterial({
    color: atmo.glowHex,
    emissive: atmo.glowHex,
    emissiveIntensity: 0.88,
    roughness: 0.2,
    transparent: true,
    opacity: 0.88,
  });
  const pylonGeo = new THREE.CylinderGeometry(0.32, 1.1, 8.8, 6);
  const collarGeo = new THREE.CylinderGeometry(0.68, 0.78, 0.42, 6);
  const bulbGeo = new THREE.OctahedronGeometry(0.9, 0);

  for (const sx of [-9.4, 9.4]) {
    const pylonWrap = new THREE.Group();
    pylonWrap.position.set(sx, 0, 0);
    pylonWrap.rotation.z = sx > 0 ? 0.09 : -0.09;

    const pylon = new THREE.Mesh(pylonGeo, pylonMat);
    pylon.position.y = 4.4;
    pylonWrap.add(pylon);

    const collar = new THREE.Mesh(collarGeo, brassCollarMat);
    collar.position.y = 6.2;
    pylonWrap.add(collar);

    const bulb = new THREE.Mesh(bulbGeo, lanternMat);
    bulb.position.y = 9.4;
    bulb.scale.set(0.85, 1.5, 0.85);
    pylonWrap.add(bulb);

    archGroup.add(pylonWrap);
  }

  // Brass start strip
  const lineStripGeo = new THREE.PlaneGeometry(16.6, 1.4);
  const lineStripMat = new THREE.MeshStandardMaterial({
    color: 0xe6ba63,
    emissive: 0xb8822e,
    emissiveIntensity: 0.4,
    roughness: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const lineStrip = new THREE.Mesh(lineStripGeo, lineStripMat);
  lineStrip.rotation.x = -Math.PI / 2;
  lineStrip.position.y = 0.08;
  archGroup.add(lineStrip);

  group.add(archGroup);
  disposables.push(
    pylonGeo,
    collarGeo,
    bulbGeo,
    pylonMat,
    brassCollarMat,
    lanternMat,
    lineStripGeo,
    lineStripMat,
  );

  // Destination Outpost Airlock Gate at Point B (zero circular podiums — v3.3 §5.4)
  if (!closed) {
    const endPt = sampledPoints[n - 1];
    const prevEndPt = sampledPoints[n - 2];
    const endYaw = Math.atan2(endPt.x - prevEndPt.x, endPt.z - prevEndPt.z);

    const finishGate = new THREE.Group();
    finishGate.position.set(endPt.x, endPt.y, endPt.z);
    finishGate.rotation.y = endYaw;

    const bulkheadGeo = new THREE.BoxGeometry(2.6, 12.5, 4.4);
    const lintelGeo = new THREE.BoxGeometry(24.0, 2.2, 4.8);
    const beaconStripGeo = new THREE.BoxGeometry(19.5, 0.45, 0.65);

    for (const sx of [-10.4, 10.4]) {
      const wing = new THREE.Mesh(bulkheadGeo, pylonMat);
      wing.position.set(sx, 6.25, 0);
      finishGate.add(wing);

      const trim = new THREE.Mesh(collarGeo, brassCollarMat);
      trim.position.set(sx, 9.6, 0);
      trim.scale.set(2.2, 1.2, 2.2);
      finishGate.add(trim);
    }

    const lintel = new THREE.Mesh(lintelGeo, pylonMat);
    lintel.position.set(0, 12.4, 0);
    finishGate.add(lintel);

    const glowStrip = new THREE.Mesh(beaconStripGeo, lanternMat);
    glowStrip.position.set(0, 10.9, 0);
    finishGate.add(glowStrip);

    const finishLine = new THREE.Mesh(lineStripGeo, lineStripMat);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.y = 0.09;
    finishGate.add(finishLine);

    group.add(finishGate);
    disposables.push(bulkheadGeo, lintelGeo, beaconStripGeo);
  }

  // 4. Whisper Fissures (calibrated emissive & point lights so bloom never over-saturates)
  const patchMeshes: BuiltTrackScene['patchMeshes'] = [];
  const patchCoreGeo = new THREE.CylinderGeometry(0.82, 0.94, 0.07, 16);
  const patchCoreMat = new THREE.MeshPhysicalMaterial({
    color: atmo.glowHex,
    emissive: atmo.glowHex,
    emissiveIntensity: 0.62,
    roughness: 0.28,
    metalness: 0.12,
    transparent: true,
    opacity: 0.66,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // Batched basalt fracture rims for every radiation fissure
  const rimGeo = new THREE.TorusGeometry(0.95, 0.14, 6, 16);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x171b26,
    roughness: 0.88,
    metalness: 0.22,
  });
  const rimInst = new THREE.InstancedMesh(rimGeo, rimMat, Math.max(1, patches.length));
  const dummy = new THREE.Object3D();

  patches.forEach((p, idx) => {
    const mesh = new THREE.Mesh(patchCoreGeo, patchCoreMat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.radius, 1, p.radius);
    group.add(mesh);

    dummy.position.set(p.x, p.y + 0.04, p.z);
    dummy.rotation.set(0, idx * 0.85, 0);
    dummy.scale.set(p.radius, 1, p.radius);
    dummy.updateMatrix();
    rimInst.setMatrixAt(idx, dummy.matrix);

    let light: THREE.PointLight | undefined;
    if (graphics !== 'low' && idx < 4) {
      light = new THREE.PointLight(atmo.glowHex, 1.35, 12, 2.0);
      light.position.set(p.x, p.y + 1.4, p.z);
      group.add(light);
    }
    patchMeshes.push({ mesh, light, data: p });
  });
  rimInst.instanceMatrix.needsUpdate = true;
  rimInst.computeBoundingSphere();
  group.add(rimInst);
  disposables.push(patchCoreGeo, patchCoreMat, rimGeo, rimMat);

  // 4b. Resonance Boost Vents
  const ventMeshes: BuiltTrackScene['ventMeshes'] = [];
  const ventPadGeo = new THREE.PlaneGeometry(3.2, 4.4);
  const ventBarGeo = new THREE.BoxGeometry(2.6, 0.08, 0.35);
  const ventMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.82,
    roughness: 0.26,
    metalness: 0.52,
    transparent: true,
    opacity: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  disposables.push(ventPadGeo, ventBarGeo, ventMat);

  for (const v of vents) {
    const vg = new THREE.Group();
    vg.position.set(v.x, v.y, v.z);
    vg.rotation.y = v.yaw;

    const pad = new THREE.Mesh(ventPadGeo, ventMat);
    pad.rotation.x = -Math.PI / 2;
    vg.add(pad);

    for (const zOff of [-1.1, 0, 1.1]) {
      const chev = new THREE.Mesh(ventBarGeo, ventMat);
      chev.position.set(0, 0.05, zOff);
      vg.add(chev);
    }
    group.add(vg);
    ventMeshes.push({ group: vg, data: v });
  }

  // 4b-2. Mid-Route Repair Service Fork Lane & Flux Shortcut (v3.3+ gameplay choice)
  let repairPadMesh: THREE.Mesh | null = null;
  if (forkZone && forkZone.repairBranchPoints.length >= 2) {
    const bp = forkZone.repairBranchPoints;
    const bn = bp.length;
    const bVerts: number[] = [];
    const bUvs: number[] = [];
    const bIndices: number[] = [];
    const bHalfW = 4.6;
    let bDist = 0;

    for (let i = 0; i < bn; i++) {
      const cur = bp[i];
      const prev = bp[Math.max(0, i - 1)];
      const next = bp[Math.min(bn - 1, i + 1)];
      if (i > 0) bDist += Math.hypot(cur.x - prev.x, cur.z - prev.z);
      let tx = i >= bn - 1 ? cur.x - prev.x : next.x - cur.x;
      let tz = i >= bn - 1 ? cur.z - prev.z : next.z - cur.z;
      const bLen = Math.hypot(tx, tz) || 1;
      tx /= bLen;
      tz /= bLen;
      const bnx = -tz;
      const bnz = tx;
      bVerts.push(cur.x - bnx * bHalfW, cur.y + 0.035, cur.z - bnz * bHalfW);
      bVerts.push(cur.x + bnx * bHalfW, cur.y + 0.035, cur.z + bnz * bHalfW);
      bUvs.push(0, bDist * 0.08, 1, bDist * 0.08);
      if (i < bn - 1) {
        const base = i * 2;
        bIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }

    const forkRoadGeo = new THREE.BufferGeometry();
    forkRoadGeo.setAttribute('position', new THREE.Float32BufferAttribute(bVerts, 3));
    forkRoadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bUvs, 2));
    forkRoadGeo.setIndex(bIndices);
    forkRoadGeo.computeVertexNormals();
    const forkRoadMat = new THREE.MeshStandardMaterial({
      map: textures.trackAlbedo,
      color: 0x99f6e4,
      roughness: 0.62,
      metalness: 0.22,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const forkRoadMesh = new THREE.Mesh(forkRoadGeo, forkRoadMat);
    forkRoadMesh.receiveShadow = !isSoftwareGl && graphics !== 'low';
    group.add(forkRoadMesh);

    // Glowing Teal Repair Airlock Pad in the center of the service fork
    const repGeo = new THREE.CylinderGeometry(forkZone.repairPad.radius, forkZone.repairPad.radius * 1.1, 0.14, 24);
    const repMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.45,
      transparent: true,
      opacity: 0.86,
    });
    repairPadMesh = new THREE.Mesh(repGeo, repMat);
    repairPadMesh.position.set(forkZone.repairPad.x, forkZone.repairPad.y, forkZone.repairPad.z);
    group.add(repairPadMesh);

    // Repair Service Gantry Ring over Repair Pad
    const repArchGeo = new THREE.TorusGeometry(5.2, 0.28, 8, 18, Math.PI);
    const repArch = new THREE.Mesh(repArchGeo, pylonMat);
    repArch.position.set(forkZone.repairPad.x, forkZone.repairPad.y, forkZone.repairPad.z);
    const rMid = bp[Math.floor(bn / 2)];
    const rNext = bp[Math.min(bn - 1, Math.floor(bn / 2) + 1)];
    repArch.rotation.y = Math.atan2(rNext.x - rMid.x, rNext.z - rMid.z);
    group.add(repArch);

    // Split Signpost Gantry before fork entrance
    const signGroup = new THREE.Group();
    signGroup.position.set(forkZone.signpost.x, forkZone.signpost.y, forkZone.signpost.z);
    signGroup.rotation.y = forkZone.signpost.yaw;
    const armGeo = new THREE.BoxGeometry(10.5, 0.45, 0.45);
    const leftSignalMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.78,
    });
    const rightSignalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.78,
    });
    const armMesh = new THREE.Mesh(armGeo, pylonMat);
    armMesh.position.set(0, 6.2, 0);
    signGroup.add(armMesh);
    const leftSign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.0, 0.24), leftSignalMat);
    leftSign.position.set(-3.2, 5.4, 0);
    const rightSign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.0, 0.24), rightSignalMat);
    rightSign.position.set(3.2, 5.4, 0);
    signGroup.add(leftSign, rightSign);
    group.add(signGroup);

    disposables.push(
      forkRoadGeo,
      forkRoadMat,
      repGeo,
      repMat,
      repArchGeo,
      armGeo,
      leftSignalMat,
      rightSignalMat,
    );
  }

  // 4c. Memory Beacons ("Имена на болтах" — roadside stamped brass memorial steles, v3.1 §2.4 & §10)
  const beaconMeshes: BuiltTrackScene['beaconMeshes'] = [];
  const beaconPedGeo = new THREE.CylinderGeometry(0.32, 0.48, 1.5, 6);
  const beaconBoltGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.26, 6);
  const beaconCrystalGeo = new THREE.OctahedronGeometry(0.46, 0);
  const beaconMetalMat = new THREE.MeshStandardMaterial({
    color: 0x332a1d,
    metalness: 0.72,
    roughness: 0.38,
  });
  disposables.push(beaconPedGeo, beaconBoltGeo, beaconCrystalGeo, beaconMetalMat);

  for (const b of beacons) {
    const bg = new THREE.Group();
    bg.position.set(b.x, b.y, b.z);
    bg.rotation.y = b.yaw;

    const ped = new THREE.Mesh(beaconPedGeo, beaconMetalMat);
    ped.position.y = 0.75;
    bg.add(ped);

    const boltRing = new THREE.Mesh(beaconBoltGeo, brassCollarMat);
    boltRing.position.y = 1.56;
    bg.add(boltRing);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.22,
    });
    const crystal = new THREE.Mesh(beaconCrystalGeo, crystalMat);
    crystal.position.y = 2.35;
    crystal.scale.set(0.85, 1.45, 0.85);
    bg.add(crystal);

    group.add(bg);
    disposables.push(crystalMat);
    beaconMeshes.push({ group: bg, crystal, material: crystalMat, data: b });
  }

  // 5. Biome Natural Landform Catalog (v3.2 §2.4.1: 3 distinct sculpted geological silhouettes in InstancedMesh pools!)
  const totalProps = graphics === 'low' ? 60 : graphics === 'medium' ? 114 : 174;
  const variantCount = 3;
  const perVariantCount = Math.ceil(totalProps / variantCount);

  const propMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: biome === 'crystal' ? 0.68 : 0.82,
    metalness: biome === 'needle' || biome === 'epicenter' ? 0.42 : 0.12,
    emissive: biome === 'spore' || biome === 'epicenter' ? atmo.glowHex : 0x000000,
    emissiveIntensity: biome === 'spore' ? 0.16 : 0.08,
  });
  disposables.push(propMat);

  const cA = new THREE.Color(atmo.propColorA);
  const cB = new THREE.Color(atmo.propColorB);
  const cMix = new THREE.Color();

  const variantInsts: THREE.InstancedMesh[] = [];
  for (let v = 0; v < variantCount; v++) {
    const vGeo = sculptBiomeFormation(biome, v);
    const vInst = new THREE.InstancedMesh(vGeo, propMat, perVariantCount);
    vInst.castShadow = !isSoftwareGl && graphics === 'ultra';
    vInst.receiveShadow = !isSoftwareGl && graphics !== 'low';
    variantInsts.push(vInst);
    disposables.push(vGeo);
  }

  for (let i = 0; i < totalProps; i++) {
    const vIdx = i % variantCount;
    const instIdx = Math.floor(i / variantCount);
    if (instIdx >= perVariantCount) continue;

    const sampleIdx = Math.floor((i / totalProps) * n) % n;
    const pt = sampledPoints[sampleIdx];
    const next = sampledPoints[(sampleIdx + 1) % n];
    const tx = next.x - pt.x;
    const tz = next.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;

    const side = i % 2 === 0 ? 1 : -1;
    const offset = 16.5 + ((i * 37) % 52);
    const px = pt.x + nx * side * offset;
    const pz = pt.z + nz * side * offset;
    const baseScale = 0.85 + ((i * 19) % 100) / 48;
    const jitterW = 0.86 + ((i * 7) % 30) / 100; // ±15% width variation

    // Grounded bottom-center pivot so formations never float
    dummy.position.set(px, pt.y - 0.55, pz);
    dummy.rotation.set(
      ((i % 7) - 3) * 0.04,
      (i * 1.49) % (Math.PI * 2),
      ((i % 5) - 2) * 0.05,
    );
    dummy.scale.set(
      baseScale * jitterW,
      baseScale * (0.92 + (i % 3) * 0.24),
      baseScale * (1.88 - jitterW),
    );
    dummy.updateMatrix();
    variantInsts[vIdx].setMatrixAt(instIdx, dummy.matrix);

    cMix.copy(cA).lerp(cB, ((i * 13) % 10) / 10);
    variantInsts[vIdx].setColorAt(instIdx, cMix);
  }
  for (const vInst of variantInsts) {
    vInst.instanceMatrix.needsUpdate = true;
    if (vInst.instanceColor) vInst.instanceColor.needsUpdate = true;
    vInst.computeBoundingSphere();
    group.add(vInst);
  }

  // 5a. Derelict Wreckage Ribs ("История" — corroded hull frames embedded along outer corners, InstancedMesh)
  const wreckCount = 24;
  const wreckGeo = new THREE.TorusGeometry(2.1, 0.24, 5, 10, Math.PI * 0.85);
  const wreckMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c25,
    roughness: 0.78,
    metalness: 0.58,
  });
  const wreckInst = new THREE.InstancedMesh(wreckGeo, wreckMat, wreckCount);
  for (let i = 0; i < wreckCount; i++) {
    const sampleIdx = Math.floor(((i + 0.5) / wreckCount) * n) % n;
    const pt = sampledPoints[sampleIdx];
    const next = sampledPoints[(sampleIdx + 1) % n];
    const tx = next.x - pt.x;
    const tz = next.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(pt.x + nx * side * 12.2, pt.y - 0.1, pt.z + nz * side * 12.2);
    dummy.rotation.set(0.25, Math.atan2(tx, tz) + side * 0.6, side * 0.32);
    const sc = 0.85 + (i % 4) * 0.14;
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    wreckInst.setMatrixAt(i, dummy.matrix);
  }
  wreckInst.instanceMatrix.needsUpdate = true;
  wreckInst.computeBoundingSphere();
  group.add(wreckInst);
  disposables.push(wreckGeo, wreckMat);

  // 5b. Navigation Pennant Steles (v3.1 §2.4: sculpted steles + fluttering pennant blades replacing bare posts)
  const steleCount = 64;
  const steleGeo = new THREE.CylinderGeometry(0.14, 0.26, 2.2, 6);
  const pennantGeo = new THREE.BoxGeometry(0.06, 0.65, 1.05);
  const steleMat = new THREE.MeshStandardMaterial({
    color: 0x1e2433,
    roughness: 0.5,
    metalness: 0.65,
    emissive: atmo.glowHex,
    emissiveIntensity: 0.35,
  });
  const pennantMat = new THREE.MeshStandardMaterial({
    map: textures.pennantAlbedo,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.15,
  });
  const steleInst = new THREE.InstancedMesh(steleGeo, steleMat, steleCount);
  const pennantInst = new THREE.InstancedMesh(pennantGeo, pennantMat, steleCount);
  for (let i = 0; i < steleCount; i++) {
    const sampleIdx = Math.floor((i / steleCount) * n) % n;
    const pt = sampledPoints[sampleIdx];
    const next = sampledPoints[(sampleIdx + 1) % n];
    const tx = next.x - pt.x;
    const tz = next.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const side = i % 2 === 0 ? 1 : -1;
    const yaw = Math.atan2(tx, tz);

    dummy.position.set(pt.x + nx * side * 9.8, pt.y + 1.05, pt.z + nz * side * 9.8);
    dummy.rotation.set(0, yaw, side * -0.08);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    steleInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(
      pt.x + nx * side * 9.75 - tx / len * 0.45,
      pt.y + 1.85,
      pt.z + nz * side * 9.75 - tz / len * 0.45,
    );
    dummy.rotation.set(0, yaw + Math.sin(i) * 0.12, 0);
    dummy.updateMatrix();
    pennantInst.setMatrixAt(i, dummy.matrix);
  }
  steleInst.instanceMatrix.needsUpdate = true;
  pennantInst.instanceMatrix.needsUpdate = true;
  steleInst.computeBoundingSphere();
  pennantInst.computeBoundingSphere();
  group.add(steleInst, pennantInst);
  disposables.push(steleGeo, pennantGeo, steleMat, pennantMat);

  // 5b-2. Sharp Corner Caution Chevrons (v3.2 §3.2 п.6 braking readability before tight bends)
  if (cautionMarkers.length > 0) {
    const chevBoardGeo = new THREE.BoxGeometry(2.1, 0.82, 0.14);
    const chevMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.58,
      roughness: 0.38,
      metalness: 0.35,
    });
    const chevInst = new THREE.InstancedMesh(chevBoardGeo, chevMat, cautionMarkers.length);
    const chevPostInst = new THREE.InstancedMesh(steleGeo, beaconMetalMat, cautionMarkers.length);
    cautionMarkers.forEach((cm, idx) => {
      dummy.position.set(cm.x, cm.y + 1.05, cm.z);
      dummy.rotation.set(0, cm.yaw, 0);
      dummy.scale.set(0.8, 0.95, 0.8);
      dummy.updateMatrix();
      chevPostInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(cm.x, cm.y + 2.05, cm.z);
      dummy.rotation.set(0, cm.yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      chevInst.setMatrixAt(idx, dummy.matrix);
    });
    chevPostInst.instanceMatrix.needsUpdate = true;
    chevInst.instanceMatrix.needsUpdate = true;
    chevPostInst.computeBoundingSphere();
    chevInst.computeBoundingSphere();
    group.add(chevPostInst, chevInst);
    disposables.push(chevBoardGeo, chevMat);
  }

  // 5c. Section Milestone Arches ("Память места" — 4 THREE.LOD Buki-Buki / Salvage Gateways)
  const lods: THREE.LOD[] = [];
  const archPillarGeo = new THREE.BoxGeometry(1.15, 7.2, 1.15);
  const archBeamGeo = new THREE.BoxGeometry(20.6, 1.05, 1.35);
  const archLowSpanGeo = new THREE.BoxGeometry(20.4, 0.9, 1.1);
  const archStoneMat = new THREE.MeshStandardMaterial({
    color: biome === 'needle' || biome === 'epicenter' ? 0x2a233d : 0x262936,
    roughness: 0.65,
    metalness: 0.45,
  });
  disposables.push(archPillarGeo, archBeamGeo, archLowSpanGeo, archStoneMat);

  for (const arch of arches) {
    const lod = new THREE.LOD();
    lod.position.set(arch.x, arch.y, arch.z);
    lod.rotation.y = arch.yaw;

    // High detail (<80m): sculpted 2-pillar Buki-Buki gateway + gold collar + beacon strip
    const highGrp = new THREE.Group();
    for (const sx of [-9.6, 9.6]) {
      const pil = new THREE.Mesh(archPillarGeo, archStoneMat);
      pil.position.set(sx, 3.6, 0);
      highGrp.add(pil);

      const trim = new THREE.Mesh(collarGeo, brassCollarMat);
      trim.position.set(sx, 5.9, 0);
      trim.scale.set(1.3, 0.9, 1.3);
      highGrp.add(trim);
    }
    const beam = new THREE.Mesh(archBeamGeo, archStoneMat);
    beam.position.set(0, 7.2, 0);
    highGrp.add(beam);

    const glowBar = new THREE.Mesh(ventBarGeo, lanternMat);
    glowBar.position.set(0, 6.65, 0);
    glowBar.scale.set(5.5, 1.6, 1.2);
    highGrp.add(glowBar);
    lod.addLevel(highGrp, 0);

    // Mid detail (80..185m): single overhead lintel span
    const midBeam = new THREE.Mesh(archLowSpanGeo, archStoneMat);
    midBeam.position.set(0, 7.0, 0);
    lod.addLevel(midBeam, 80);

    lod.addLevel(new THREE.Group(), 185);
    group.add(lod);
    lods.push(lod);
  }

  // 5d. THREE.LOD Whisper Crystal Outcrops (v3.2 §2.4.1: mineral shards embedded in dark basalt sockets pulsing with Whisper zones!)
  const crystalShardGeoA = createWhisperCrystalShardGeometry(0.4);
  const crystalShardGeoB = createWhisperCrystalShardGeometry(2.1);
  const basaltSocketGeo = createBasaltCollarGeometry(1.1);
  const whisperCrystalMat = new THREE.MeshPhysicalMaterial({
    color: atmo.propColorA,
    emissive: atmo.glowHex,
    emissiveIntensity: 0.42,
    roughness: 0.34,
    metalness: 0.25,
    clearcoat: 0.72,
  });
  const basaltSocketMat = new THREE.MeshStandardMaterial({
    color: 0x181c28,
    roughness: 0.9,
    metalness: 0.16,
  });
  disposables.push(
    crystalShardGeoA,
    crystalShardGeoB,
    basaltSocketGeo,
    whisperCrystalMat,
    basaltSocketMat,
  );

  const clusterCount = graphics === 'low' ? 8 : 14;
  for (let i = 0; i < clusterCount; i++) {
    const sampleIdx = Math.floor(((i + 0.25) / clusterCount) * n) % n;
    const pt = sampledPoints[sampleIdx];
    const next = sampledPoints[(sampleIdx + 1) % n];
    const tx = next.x - pt.x;
    const tz = next.z - pt.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const side = i % 2 === 0 ? -1 : 1;

    const lod = new THREE.LOD();
    lod.position.set(pt.x + nx * side * 13.8, pt.y - 0.15, pt.z + nz * side * 13.8);
    lod.rotation.y = (i * 1.1) % (Math.PI * 2);

    const highGrp = new THREE.Group();
    const socket = new THREE.Mesh(basaltSocketGeo, basaltSocketMat);
    highGrp.add(socket);

    const mainSpire = new THREE.Mesh(crystalShardGeoA, whisperCrystalMat);
    mainSpire.scale.set(0.95, 1.45, 0.95);
    mainSpire.rotation.z = 0.08 * side;
    highGrp.add(mainSpire);
    for (const ang of [0.4, 2.5]) {
      const sub = new THREE.Mesh(crystalShardGeoB, whisperCrystalMat);
      sub.scale.set(0.6, 0.85, 0.6);
      sub.position.set(Math.cos(ang) * 0.72, 0.12, Math.sin(ang) * 0.72);
      sub.rotation.z = 0.28 * Math.cos(ang);
      sub.rotation.x = 0.18 * Math.sin(ang);
      highGrp.add(sub);
    }
    lod.addLevel(highGrp, 0);

    const midGrp = new THREE.Group();
    midGrp.add(new THREE.Mesh(basaltSocketGeo, basaltSocketMat));
    const midShard = new THREE.Mesh(crystalShardGeoA, whisperCrystalMat);
    midShard.scale.set(0.95, 1.35, 0.95);
    midGrp.add(midShard);
    lod.addLevel(midGrp, 75);
    lod.addLevel(new THREE.Group(), 170);

    group.add(lod);
    lods.push(lod);
  }

  // 5e. Biome Scene Standard Landmarks (v3.3 §2.6: zero race furniture; pure world architecture via InstancedMesh)
  if (biome === 'canyon') {
    // Towering overhanging terracotta canyon cliffs + suspended Khet sky-bridges
    const cliffGeo = new THREE.BoxGeometry(8.5, 22, 18, 2, 4, 2);
    cliffGeo.translate(0, 10.5, 0);
    const cPos = cliffGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const y = cPos.getY(i);
      const h = y / 22;
      cPos.setX(i, cPos.getX(i) * (1 - h * 0.25) - h * 2.8);
    }
    cliffGeo.computeVertexNormals();
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x8b3416,
      roughness: 0.9,
      metalness: 0.08,
    });
    const cliffCount = 32;
    const cliffInst = new THREE.InstancedMesh(cliffGeo, cliffMat, cliffCount);
    for (let i = 0; i < cliffCount; i++) {
      const sampleIdx = Math.min(n - 2, Math.floor(((i + 0.5) / cliffCount) * (n - 1)));
      const pt = sampledPoints[sampleIdx];
      const next = sampledPoints[Math.min(n - 1, sampleIdx + 1)];
      const tx = next.x - pt.x;
      const tz = next.z - pt.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = -tz / len;
      const nz = tx / len;
      const side = i % 2 === 0 ? 1 : -1;
      dummy.position.set(pt.x + nx * side * 21.5, pt.y - 1.5, pt.z + nz * side * 21.5);
      dummy.rotation.set(0, Math.atan2(tx, tz) + (side > 0 ? 0 : Math.PI), 0);
      dummy.scale.set(1, 0.85 + (i % 4) * 0.22, 1.15);
      dummy.updateMatrix();
      cliffInst.setMatrixAt(i, dummy.matrix);
    }
    cliffInst.instanceMatrix.needsUpdate = true;
    cliffInst.computeBoundingSphere();
    group.add(cliffInst);

    // 5 Suspended Khet Sky-Bridges spanning high over the canyon
    const bridgeGeo = new THREE.BoxGeometry(44, 1.4, 3.2);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.72,
      metalness: 0.35,
    });
    const bridgeInst = new THREE.InstancedMesh(bridgeGeo, bridgeMat, 5);
    for (let i = 0; i < 5; i++) {
      const sIdx = Math.min(n - 2, Math.floor(((i + 0.7) / 5.5) * (n - 1)));
      const pt = sampledPoints[sIdx];
      const next = sampledPoints[Math.min(n - 1, sIdx + 1)];
      dummy.position.set(pt.x, pt.y + 13.5, pt.z);
      dummy.rotation.set(0, Math.atan2(next.x - pt.x, next.z - pt.z), ((i % 2) * 2 - 1) * 0.04);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      bridgeInst.setMatrixAt(i, dummy.matrix);
    }
    bridgeInst.instanceMatrix.needsUpdate = true;
    bridgeInst.computeBoundingSphere();
    group.add(bridgeInst);
    disposables.push(cliffGeo, cliffMat, bridgeGeo, bridgeMat);
  } else if (biome === 'spore') {
    // Ocean Seabed (§2.6): Tilted sunken mine masts + giant spiral shells
    const mastGeo = new THREE.CylinderGeometry(0.18, 0.42, 18, 6);
    mastGeo.translate(0, 8.5, 0);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.72,
      metalness: 0.58,
    });
    const mastInst = new THREE.InstancedMesh(mastGeo, mastMat, 14);
    const shellGeo = new THREE.TorusGeometry(2.2, 0.85, 7, 14, Math.PI * 1.55);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x99f6e4,
      roughness: 0.42,
      metalness: 0.12,
      clearcoat: 0.45,
    });
    const shellInst = new THREE.InstancedMesh(shellGeo, shellMat, 14);
    for (let i = 0; i < 14; i++) {
      const sIdx = Math.min(n - 2, Math.floor(((i + 0.4) / 14) * (n - 1)));
      const pt = sampledPoints[sIdx];
      const next = sampledPoints[Math.min(n - 1, sIdx + 1)];
      const tx = next.x - pt.x;
      const tz = next.z - pt.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = -tz / len;
      const nz = tx / len;
      const side = i % 2 === 0 ? 1 : -1;

      dummy.position.set(pt.x + nx * side * 16.5, pt.y - 0.8, pt.z + nz * side * 16.5);
      dummy.rotation.set(0.18, i * 0.9, side * 0.34);
      dummy.scale.setScalar(0.9 + (i % 3) * 0.25);
      dummy.updateMatrix();
      mastInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pt.x - nx * side * 14.5, pt.y + 0.4, pt.z - nz * side * 14.5);
      dummy.rotation.set(Math.PI * 0.38, i * 1.3, 0);
      dummy.scale.setScalar(0.75 + (i % 3) * 0.25);
      dummy.updateMatrix();
      shellInst.setMatrixAt(i, dummy.matrix);
    }
    mastInst.instanceMatrix.needsUpdate = true;
    shellInst.instanceMatrix.needsUpdate = true;
    mastInst.computeBoundingSphere();
    shellInst.computeBoundingSphere();
    group.add(mastInst, shellInst);
    disposables.push(mastGeo, mastMat, shellGeo, shellMat);
  } else if (biome === 'needle') {
    // Ruins of Buki-Buki (§2.6): Ultra-geometric 90-degree flat corridor slabs & dead lift towers
    const slabGeo = new THREE.BoxGeometry(2.2, 6.2, 16.0);
    slabGeo.translate(0, 3.1, 0);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x262138,
      roughness: 0.45,
      metalness: 0.55,
    });
    const slabInst = new THREE.InstancedMesh(slabGeo, slabMat, 28);
    for (let i = 0; i < 28; i++) {
      const sIdx = Math.min(n - 2, Math.floor(((i + 0.5) / 28) * (n - 1)));
      const pt = sampledPoints[sIdx];
      const next = sampledPoints[Math.min(n - 1, sIdx + 1)];
      const tx = next.x - pt.x;
      const tz = next.z - pt.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = -tz / len;
      const nz = tx / len;
      const side = i % 2 === 0 ? 1 : -1;
      dummy.position.set(pt.x + nx * side * 12.6, pt.y - 0.1, pt.z + nz * side * 12.6);
      dummy.rotation.set(0, Math.atan2(tx, tz), 0);
      dummy.scale.set(1, 0.7 + (i % 3) * 0.45, 1);
      dummy.updateMatrix();
      slabInst.setMatrixAt(i, dummy.matrix);
    }
    slabInst.instanceMatrix.needsUpdate = true;
    slabInst.computeBoundingSphere();
    group.add(slabInst);
    disposables.push(slabGeo, slabMat);
  } else if (biome === 'storm' || biome === 'epicenter') {
    // Shaft / Storm Tunnel Ribs & Overhead Working Spotlights (§2.6)
    const ribArchGeo = new THREE.TorusGeometry(13.8, 0.75, 6, 12, Math.PI);
    const ribArchMat = new THREE.MeshStandardMaterial({
      color: 0x1e2230,
      roughness: 0.88,
      metalness: 0.35,
    });
    const ribCount = 16;
    const ribInst = new THREE.InstancedMesh(ribArchGeo, ribArchMat, ribCount);
    const lampConeGeo = new THREE.CylinderGeometry(0.4, 4.2, 10.5, 10, 1, true);
    const lampConeMat = new THREE.MeshBasicMaterial({
      color: atmo.glowHex,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lampConeInst = new THREE.InstancedMesh(lampConeGeo, lampConeMat, ribCount);
    for (let i = 0; i < ribCount; i++) {
      const sIdx = Math.min(n - 2, Math.floor(((i + 0.5) / ribCount) * (n - 1)));
      const pt = sampledPoints[sIdx];
      const next = sampledPoints[Math.min(n - 1, sIdx + 1)];
      const yaw = Math.atan2(next.x - pt.x, next.z - pt.z);
      dummy.position.set(pt.x, pt.y, pt.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ribInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pt.x, pt.y + 7.2, pt.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      lampConeInst.setMatrixAt(i, dummy.matrix);
    }
    ribInst.instanceMatrix.needsUpdate = true;
    lampConeInst.instanceMatrix.needsUpdate = true;
    ribInst.computeBoundingSphere();
    lampConeInst.computeBoundingSphere();
    group.add(ribInst, lampConeInst);
    disposables.push(ribArchGeo, ribArchMat, lampConeGeo, lampConeMat);
  }

  // 6. Central/Horizon Tall Landmark: "The Needle" spire
  let needleSpire: THREE.Group | null = null;
  if (biome === 'needle' || biome === 'epicenter' || biome === 'crystal' || biome === 'storm') {
    needleSpire = new THREE.Group();
    const spireGeo = new THREE.ConeGeometry(10, 76, 7);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b2e,
      metalness: 0.72,
      roughness: 0.36,
      emissive: atmo.glowHex,
      emissiveIntensity: biome === 'epicenter' ? 0.45 : 0.18,
    });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.y = 36;
    needleSpire.add(spireMesh);

    const crownGeo = new THREE.OctahedronGeometry(3.6, 0);
    const crownMesh = new THREE.Mesh(crownGeo, lanternMat);
    crownMesh.position.y = 76;
    needleSpire.add(crownMesh);

    if (closed) {
      needleSpire.position.set(centerX, -1, centerZ);
    } else {
      const endPt = sampledPoints[n - 1];
      const prevPt = sampledPoints[n - 2];
      const dx = endPt.x - prevPt.x;
      const dz = endPt.z - prevPt.z;
      const dLen = Math.hypot(dx, dz) || 1;
      needleSpire.position.set(
        endPt.x + (dx / dLen) * 145,
        endPt.y - 2,
        endPt.z + (dz / dLen) * 145,
      );
    }
    group.add(needleSpire);
    disposables.push(spireGeo, spireMat, crownGeo);
  }

  // 6b. Occupied Horizon Skyline (Leviathan Whale-Ships & Ruined Megoliths framed around route)
  const skylineMat = new THREE.MeshStandardMaterial({
    color: 0x191d2b,
    roughness: 0.85,
    metalness: 0.25,
    emissive: atmo.glowHex,
    emissiveIntensity: 0.08,
  });
  const megolithGeo = new THREE.CylinderGeometry(3.2, 7.5, 48, 6);
  const leviathanBodyGeo = new THREE.ConeGeometry(8.2, 54, 6);
  leviathanBodyGeo.rotateX(Math.PI / 2);
  disposables.push(skylineMat, megolithGeo, leviathanBodyGeo);

  const skyRad = Math.max(245, maxSpan * 0.56 + 150);
  const megolithInst = new THREE.InstancedMesh(megolithGeo, skylineMat, 14);
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + 0.18;
    const rad = skyRad + (i % 3) * 32;
    const hScale = 0.85 + (i % 4) * 0.28;
    dummy.position.set(centerX + Math.cos(ang) * rad, 18 * hScale, centerZ + Math.sin(ang) * rad);
    dummy.rotation.set(0, ang + 0.4, ((i % 3) - 1) * 0.08);
    dummy.scale.set(1 + (i % 2) * 0.35, hScale, 1);
    dummy.updateMatrix();
    megolithInst.setMatrixAt(i, dummy.matrix);
  }
  megolithInst.instanceMatrix.needsUpdate = true;
  megolithInst.computeBoundingSphere();
  group.add(megolithInst);

  // 3 Animated Leviathan Whale-Ships patrolling the outer clouds + InstancedMesh Migrating Pod
  const whaleShips: BuiltTrackScene['whaleShips'] = [];
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.9;
    const orbitRad = skyRad + 20 + i * 18;
    const baseY = 64 + i * 12;
    const ship = new THREE.Group();
    const hull = new THREE.Mesh(leviathanBodyGeo, skylineMat);
    const fin = new THREE.Mesh(ventBarGeo, lanternMat);
    fin.scale.set(0.4, 24, 16);
    fin.position.set(0, 6.5, -4);
    ship.add(hull, fin);
    ship.position.set(
      centerX + Math.cos(ang) * orbitRad,
      baseY,
      centerZ + Math.sin(ang) * orbitRad,
    );
    ship.rotation.y = -ang;
    group.add(ship);
    whaleShips.push({
      group: ship,
      baseAng: ang,
      orbitRad,
      baseY,
      speed: 0.018 + i * 0.005,
    });
  }

  const whalePodCount = graphics === 'low' ? 6 : 14;
  const whalePodGeo = new THREE.ConeGeometry(3.4, 22, 5);
  whalePodGeo.rotateX(Math.PI / 2);
  const whalePodInst = new THREE.InstancedMesh(whalePodGeo, skylineMat, whalePodCount);
  const whalePodData: BuiltTrackScene['whalePodData'] = [];
  for (let i = 0; i < whalePodCount; i++) {
    const baseAng = (i / whalePodCount) * Math.PI * 2;
    const orbitRad = skyRad * 0.72 + (i % 4) * 34;
    const baseY = 48 + (i % 5) * 9;
    const speed = 0.022 + (i % 3) * 0.006;
    const scale = 0.65 + (i % 3) * 0.25;
    whalePodData.push({ baseAng, orbitRad, baseY, speed, scale });
    dummy.position.set(
      centerX + Math.cos(baseAng) * orbitRad,
      baseY,
      centerZ + Math.sin(baseAng) * orbitRad,
    );
    dummy.rotation.set(0, -baseAng, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    whalePodInst.setMatrixAt(i, dummy.matrix);
  }
  whalePodInst.instanceMatrix.needsUpdate = true;
  whalePodInst.computeBoundingSphere();
  group.add(whalePodInst);
  disposables.push(whalePodGeo);

  // 6c. Dynamic Weather Front Ribbons (crosswind / spore tide zones along the route)
  const weatherMeshes: THREE.Mesh[] = [];
  if (weatherFronts.length > 0) {
    const frontGeo = new THREE.RingGeometry(16, 22, 24);
    frontGeo.rotateX(-Math.PI / 2);
    const frontMat = new THREE.MeshBasicMaterial({
      color: biome === 'spore' ? 0x2dd4bf : biome === 'canyon' ? 0xf59e0b : 0x7dd3fc,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    disposables.push(frontGeo, frontMat);
    for (const wf of weatherFronts) {
      const fm = new THREE.Mesh(frontGeo, frontMat);
      fm.position.set(wf.x, wf.y + 0.18, wf.z);
      group.add(fm);
      weatherMeshes.push(fm);
    }
  }

  // 7. Volumetric God Ray cones (Ultra / High — subtle & placed downrange away from start grid)
  const godRays: THREE.Mesh[] = [];
  if (!isSoftwareGl && (graphics === 'high' || graphics === 'ultra')) {
    const rayGeo = new THREE.CylinderGeometry(1.5, 9.5, 52, 14, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: atmo.glowHex,
      transparent: true,
      opacity: graphics === 'ultra' ? 0.042 : 0.025,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(rayGeo, rayMat);
    for (let i = 0; i < 4; i++) {
      const ray = new THREE.Mesh(rayGeo, rayMat);
      const frac = 0.18 + (i / 4) * 0.72;
      const sp = sampledPoints[Math.min(n - 1, Math.floor(frac * (n - 1)))];
      ray.position.set(sp.x, sp.y + 24, sp.z);
      ray.rotation.z = 0.16 * (i % 2 === 0 ? 1 : -1);
      group.add(ray);
      godRays.push(ray);
    }
  }

  // 8. Order of Purity Patrol Drones
  const drones: THREE.Group[] = [];
  if (orderDrones) {
    const droneBodyGeo = new THREE.OctahedronGeometry(1.2, 0);
    const droneRingGeo = new THREE.TorusGeometry(1.6, 0.1, 6, 16);
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0xef4444,
      emissiveIntensity: 0.75,
    });
    disposables.push(droneBodyGeo, droneRingGeo, droneMat);

    for (let i = 0; i < 4; i++) {
      const d = new THREE.Group();
      const body = new THREE.Mesh(droneBodyGeo, droneMat);
      const ring = new THREE.Mesh(droneRingGeo, droneMat);
      ring.rotation.x = Math.PI / 2;
      d.add(body, ring);
      const pt = sampledPoints[Math.floor((i / 4) * n)];
      d.position.set(pt.x, pt.y + 7.5, pt.z);
      d.userData.trackT = i / 4;
      group.add(d);
      drones.push(d);
    }
  }

  // 9. InstancedMesh Floating Dust Motes distributed along full track spline
  const dustCount = graphics === 'low' ? 36 : graphics === 'medium' ? 96 : 190;
  const dustGeo = new THREE.PlaneGeometry(0.44, 0.44);
  const dustMat = new THREE.MeshBasicMaterial({
    map: textures.sparkSprite,
    color: biome === 'crystal' ? 0xe0f2fe : biome === 'spore' ? 0x6ee7b7 : 0xfde68a,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const dustInstanced = new THREE.InstancedMesh(dustGeo, dustMat, dustCount);
  dustInstanced.frustumCulled = false;
  const dustBasePositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const pt = sampledPoints[Math.floor((i / dustCount) * n) % n];
    const x = pt.x + (Math.random() - 0.5) * 44;
    const y = pt.y + 1.5 + Math.random() * 14;
    const z = pt.z + (Math.random() - 0.5) * 44;
    dustBasePositions[i * 3] = x;
    dustBasePositions[i * 3 + 1] = y;
    dustBasePositions[i * 3 + 2] = z;
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    dustInstanced.setMatrixAt(i, dummy.matrix);
  }
  dustInstanced.instanceMatrix.needsUpdate = true;
  group.add(dustInstanced);
  disposables.push(dustGeo, dustMat);

  scene.add(group);

  return {
    group,
    patchMeshes,
    ventMeshes,
    beaconMeshes,
    repairPadMesh,
    weatherMeshes,
    whaleCenter: { x: centerX, z: centerZ },
    whaleShips,
    whalePodInst,
    whalePodData,
    whisperCrystalMat,
    skyBaseHex: atmo.skyHex,
    glowHex: atmo.glowHex,
    lods,
    godRays,
    drones,
    dustInstanced,
    dustBasePositions,
    needleSpire,
    dispose: () => {
      scene.remove(group);
      disposables.forEach((d) => d.dispose());
    },
  };
}
