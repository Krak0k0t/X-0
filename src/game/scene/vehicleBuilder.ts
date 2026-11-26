import * as THREE from 'three';
import { CHARACTERS } from '../data/characters';
import type { CharacterId, MutationId } from '../types';
import type { ProceduralTextureSet } from './textures';

export interface VehicleVisualRig {
  root: THREE.Group;
  bodyGroup: THREE.Group; // For squash & stretch and chassis pitch/roll
  wheels: THREE.Object3D[];
  frontWheelSteerGroups: THREE.Group[];
  exhaustPlumes: THREE.Mesh[];
  hullMaterial: THREE.MeshPhysicalMaterial;
  accentMaterial: THREE.MeshPhysicalMaterial;
  sailFinGroup: THREE.Group;
  acidExhaustGroup: THREE.Group;
  synapseVeinsGroup: THREE.Group;
  tendrilsGroup: THREE.Group;
  holoGhostGroup: THREE.Group;
  baseColor: THREE.Color;
  heroHeadGroup?: THREE.Group;
  steeringWheelGroup?: THREE.Group;
  headlightCones?: THREE.Mesh[];
  headlightSpot?: THREE.SpotLight;
  headlightTarget?: THREE.Object3D;
}

function enableShadows(obj: THREE.Object3D, cast: boolean, receive = true): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function safeComputeTangents(geo: THREE.BufferGeometry): void {
  if (geo.index && geo.attributes.position && geo.attributes.normal && geo.attributes.uv) {
    geo.computeTangents();
  }
}

function createLatheTireGeometry(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.24, -0.2),
    new THREE.Vector2(0.36, -0.2),
    new THREE.Vector2(0.435, -0.155),
    new THREE.Vector2(0.445, 0.0),
    new THREE.Vector2(0.435, 0.155),
    new THREE.Vector2(0.36, 0.2),
    new THREE.Vector2(0.24, 0.2),
  ];
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.rotateZ(Math.PI / 2);
  geo.computeVertexNormals();
  safeComputeTangents(geo);
  return geo;
}

function createBellNozzleGeometry(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.11, 0.0),
    new THREE.Vector2(0.145, 0.12),
    new THREE.Vector2(0.195, 0.34),
    new THREE.Vector2(0.218, 0.48),
    new THREE.Vector2(0.185, 0.48),
    new THREE.Vector2(0.15, 0.32),
    new THREE.Vector2(0.1, 0.06),
  ];
  const geo = new THREE.LatheGeometry(pts, 22);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildHeroPilotAndCockpit(
  bodyGroup: THREE.Group,
  textures: ProceduralTextureSet,
  accentMaterial: THREE.MeshPhysicalMaterial,
  carbonMaterial: THREE.MeshPhysicalMaterial,
  castShadows: boolean,
): { heroHeadGroup: THREE.Group; steeringWheelGroup: THREE.Group } {
  const pilotGroup = new THREE.Group();
  pilotGroup.position.set(0, 0.98, 0.14);

  const suitMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.12,
    roughness: 0.68,
    normalMap: textures.pilotSuitNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    sheen: 0.72,
    sheenRoughness: 0.48,
    sheenColor: new THREE.Color(0x38bdf8),
  });

  const harnessMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd97706,
    metalness: 0.22,
    roughness: 0.46,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xfde68a),
  });

  const gloveMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.15,
    roughness: 0.52,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x94a3b8),
  });

  const helmetShellMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.48,
    roughness: 0.16,
    roughnessMap: textures.hullMicroScratchRoughness,
    normalMap: textures.hullNormal,
    normalScale: new THREE.Vector2(0.2, 0.2),
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    anisotropy: 0.3,
  });

  const visorGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0891b2,
    metalness: 0.2,
    roughness: 0.06,
    iridescence: 0.72,
    iridescenceIOR: 1.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.58,
  });

  const hudDisplayMat = new THREE.MeshStandardMaterial({
    map: textures.cockpitHudTexture,
    emissiveMap: textures.cockpitHudTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.15,
  });

  // Sculpted carbon bucket seat + side bolsters
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.08), carbonMaterial);
  seatBack.position.set(0, 0.24, -0.34);
  seatBack.rotation.x = -0.22;
  pilotGroup.add(seatBack);

  for (const sx of [-0.21, 0.21]) {
    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.22), suitMaterial);
    bolster.position.set(sx, 0.18, -0.24);
    bolster.rotation.y = sx < 0 ? 0.24 : -0.24;
    pilotGroup.add(bolster);
  }

  // Headrest cushion
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.09), suitMaterial);
  headrest.position.set(0, 0.44, -0.34);
  headrest.rotation.x = -0.18;
  pilotGroup.add(headrest);

  // Armored Torso + Shoulder Pauldrons
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.34, 14), suitMaterial);
  torso.scale.set(1.18, 1, 0.82);
  torso.position.set(0, 0.18, -0.1);
  torso.rotation.x = 0.14;
  pilotGroup.add(torso);

  // Chest Telemetry Core Plate + Fluxite Indicator
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), carbonMaterial);
  chestPlate.position.set(0, 0.2, 0.05);
  chestPlate.rotation.x = 0.14;
  pilotGroup.add(chestPlate);

  const chestCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.035, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  chestCore.position.set(0, 0.22, 0.082);
  pilotGroup.add(chestCore);

  // 4-Point Racing Harness Straps + Center Buckle
  for (const sx of [-0.1, 0.1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.28, 0.04), harnessMaterial);
    strap.position.set(sx, 0.24, 0.02);
    strap.rotation.z = sx < 0 ? -0.14 : 0.14;
    strap.rotation.x = 0.15;
    pilotGroup.add(strap);
  }
  const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), accentMaterial);
  buckle.rotation.x = Math.PI / 2;
  buckle.position.set(0, 0.12, 0.075);
  pilotGroup.add(buckle);

  // Ribbed HANS Titanium Neck Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.038, 10, 20), accentMaterial);
  collar.rotation.x = Math.PI / 2 + 0.1;
  collar.position.set(0, 0.34, -0.07);
  pilotGroup.add(collar);

  // Dual Corrugated Oxygen & Coolant Tubes (TubeGeometry curving behind shoulders)
  for (const sx of [-1, 1]) {
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.14, 0.38, -0.02),
      new THREE.Vector3(sx * 0.22, 0.32, -0.14),
      new THREE.Vector3(sx * 0.18, 0.26, -0.32),
    ]);
    const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 12, 0.02, 8, false), carbonMaterial);
    pilotGroup.add(hose);
  }

  // Articulated Shoulder Pauldrons, Upper Arms & Forearms reaching to F1 Steering Yoke
  for (const sx of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), helmetShellMat);
    pauldron.scale.set(1.0, 0.85, 1.15);
    pauldron.position.set(sx * 0.24, 0.29, -0.06);
    pilotGroup.add(pauldron);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.16, 4, 8), suitMaterial);
    upperArm.position.set(sx * 0.24, 0.21, 0.04);
    upperArm.rotation.x = 0.85;
    upperArm.rotation.z = sx * 0.18;
    pilotGroup.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.16, 4, 8), suitMaterial);
    forearm.position.set(sx * 0.19, 0.18, 0.2);
    forearm.rotation.x = 1.32;
    forearm.rotation.z = sx * -0.22;
    pilotGroup.add(forearm);

    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.09), gloveMat);
    glove.position.set(sx * 0.145, 0.21, 0.31);
    pilotGroup.add(glove);
  }

  // Articulated Hero Head & Helmet Group (animates smoothly on cursor/steering!)
  const heroHeadGroup = new THREE.Group();
  heroHeadGroup.position.set(0, 0.37, -0.05);

  const helmetBase = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 18), helmetShellMat);
  helmetBase.scale.set(0.95, 1.02, 1.18);
  helmetBase.position.set(0, 0.11, 0);
  heroHeadGroup.add(helmetBase);

  // Aero chin guard + brow ridge spoiler
  const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.095, 0.14), helmetShellMat);
  chinGuard.position.set(0, 0.035, 0.11);
  chinGuard.rotation.x = 0.15;
  heroHeadGroup.add(chinGuard);

  const browSpoiler = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.09), accentMaterial);
  browSpoiler.position.set(0, 0.195, 0.11);
  browSpoiler.rotation.x = 0.22;
  heroHeadGroup.add(browSpoiler);

  const helmetSpineFin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.22), accentMaterial);
  helmetSpineFin.position.set(0, 0.265, -0.06);
  helmetSpineFin.rotation.x = -0.18;
  heroHeadGroup.add(helmetSpineFin);

  // Curved Panoramic HUD Visor + Glowing Inner Eye-Slit Bar
  const visorShield = new THREE.Mesh(
    new THREE.CylinderGeometry(0.172, 0.168, 0.095, 18, 1, true, -Math.PI * 0.38, Math.PI * 0.76),
    visorGlassMat,
  );
  visorShield.position.set(0, 0.115, 0.045);
  heroHeadGroup.add(visorShield);

  const innerHudSlit = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.018, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
  );
  innerHudSlit.position.set(0, 0.115, 0.18);
  heroHeadGroup.add(innerHudSlit);

  // Twin side comm pods + micro-antenna
  for (const sx of [-1, 1]) {
    const commPod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), carbonMaterial);
    commPod.rotation.z = Math.PI / 2;
    commPod.position.set(sx * 0.165, 0.1, -0.02);
    heroHeadGroup.add(commPod);
  }
  const commAnt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.14, 6), accentMaterial);
  commAnt.position.set(-0.17, 0.18, -0.04);
  commAnt.rotation.z = 0.12;
  heroHeadGroup.add(commAnt);

  pilotGroup.add(heroHeadGroup);

  // Steering Column + F1 Butterfly Steering Yoke with Live Digital HUD Canvas Screen
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.24, 10), carbonMaterial);
  column.rotation.x = Math.PI / 2 - 0.35;
  column.position.set(0, 0.16, 0.38);
  pilotGroup.add(column);

  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(0, 0.21, 0.31);
  steeringWheelGroup.rotation.x = -0.35;

  const yokeBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.035), carbonMaterial);
  steeringWheelGroup.add(yokeBody);

  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.15, 0.048), accentMaterial);
    grip.position.set(sx * 0.14, 0, 0);
    steeringWheelGroup.add(grip);
  }

  const yokeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.085), hudDisplayMat);
  yokeScreen.position.set(0, 0.006, -0.021);
  yokeScreen.rotation.y = Math.PI;
  steeringWheelGroup.add(yokeScreen);

  pilotGroup.add(steeringWheelGroup);
  enableShadows(pilotGroup, castShadows, true);
  bodyGroup.add(pilotGroup);

  return { heroHeadGroup, steeringWheelGroup };
}

export function createVehicleMesh(
  characterId: CharacterId,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): VehicleVisualRig {
  const char = CHARACTERS[characterId];
  const isHero = characterId === 'taka';
  const castShadows = !isSoftwareGl;

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const baseColor = new THREE.Color(char.primaryColor);
  const accentColor = new THREE.Color(char.accentColor);

  // 1. Complex Multi-Layer PBR Materials
  const hullMaterial = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    metalness: isHero ? 0.62 : 0.5,
    roughness: isHero ? 0.3 : 0.38,
    roughnessMap: textures.hullMicroScratchRoughness,
    normalMap: textures.hullNormal,
    normalScale: new THREE.Vector2(isHero ? 0.72 : 0.55, isHero ? 0.72 : 0.55),
    clearcoat: isHero ? 0.86 : 0.55,
    clearcoatRoughness: isHero ? 0.12 : 0.18,
    anisotropy: isHero ? 0.45 : 0.15,
    envMapIntensity: 0.78,
    reflectivity: 0.9,
  });

  const carbonMaterial = new THREE.MeshPhysicalMaterial({
    map: textures.carbonAlbedo,
    roughnessMap: textures.hullMicroScratchRoughness,
    color: 0xffffff,
    metalness: 0.28,
    roughness: 0.48,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
  });

  const matteChassisMat = new THREE.MeshStandardMaterial({
    color: 0x13161f,
    metalness: 0.4,
    roughness: 0.8,
    bumpMap: textures.metalBump,
    bumpScale: 0.015,
  });

  const accentMaterial = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    metalness: 0.94,
    roughness: 0.18,
    anisotropy: 0.84,
    clearcoat: 0.72,
    clearcoatRoughness: 0.12,
    bumpMap: textures.metalBump,
    bumpScale: 0.012,
    emissive: accentColor,
    emissiveIntensity: 0.1,
  });

  const canopyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa5f3fc,
    metalness: 0.04,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.82,
    transparent: true,
    opacity: isSoftwareGl ? 0.36 : 1.0,
    ior: 1.54,
    thickness: 0.38,
    attenuationColor: new THREE.Color(0x0ea5e9),
    attenuationDistance: 1.8,
    iridescence: 0.42,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false,
  });

  // Grounded contact shadow disc
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(isHero ? 2.65 : 2.35, 28),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  // 2. Carbon Fiber Aero Floor, Splitter & Rear Venturi Diffuser
  const floorShape = new THREE.Shape();
  if (char.archetype === 'crawler') {
    floorShape.moveTo(-1.42, -2.35);
    floorShape.lineTo(1.42, -2.35);
    floorShape.lineTo(1.5, 1.0);
    floorShape.lineTo(1.05, 2.35);
    floorShape.lineTo(-1.05, 2.35);
    floorShape.lineTo(-1.5, 1.0);
  } else {
    floorShape.moveTo(-1.14, -2.28);
    floorShape.lineTo(1.14, -2.28);
    floorShape.lineTo(1.22, -0.2);
    floorShape.lineTo(0.88, 1.78);
    floorShape.lineTo(0.54, 2.54);
    floorShape.lineTo(-0.54, 2.54);
    floorShape.lineTo(-0.88, 1.78);
    floorShape.lineTo(-1.22, -0.2);
  }
  floorShape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  floorGeo.rotateX(Math.PI / 2);
  safeComputeTangents(floorGeo);
  const floorMesh = new THREE.Mesh(floorGeo, carbonMaterial);
  floorMesh.position.y = 0.34;
  enableShadows(floorMesh, castShadows, true);
  bodyGroup.add(floorMesh);

  // Rear Venturi Diffuser Strakes (5 carbon blades)
  for (let i = -2; i <= 2; i++) {
    const strake = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.25, 0.6), carbonMaterial);
    strake.position.set(i * 0.24, 0.3, -2.2);
    strake.rotation.x = 0.22;
    bodyGroup.add(strake);
  }

  // 3. Sculpted Primary Monocoque Hull
  const hullShape = new THREE.Shape();
  if (char.archetype === 'crawler') {
    hullShape.moveTo(-1.32, -2.25);
    hullShape.lineTo(1.32, -2.25);
    hullShape.lineTo(1.4, 0.85);
    hullShape.lineTo(0.92, 2.2);
    hullShape.lineTo(-0.92, 2.2);
    hullShape.lineTo(-1.4, 0.85);
  } else if (char.archetype === 'sail') {
    hullShape.moveTo(-0.88, -2.18);
    hullShape.lineTo(0.88, -2.18);
    hullShape.lineTo(0.62, 1.2);
    hullShape.lineTo(0.14, 2.45);
    hullShape.lineTo(-0.14, 2.45);
    hullShape.lineTo(-0.62, 1.2);
  } else {
    // Sleek sculpted Dusk-9 arrow fuselage with hourglass coke-bottle waist
    hullShape.moveTo(-0.96, -2.16);
    hullShape.lineTo(0.96, -2.16);
    hullShape.lineTo(1.08, -0.96);
    hullShape.lineTo(0.74, 0.28);
    hullShape.lineTo(0.64, 1.56);
    hullShape.lineTo(0.32, 2.44);
    hullShape.lineTo(-0.32, 2.44);
    hullShape.lineTo(-0.64, 1.56);
    hullShape.lineTo(-0.74, 0.28);
    hullShape.lineTo(-1.08, -0.96);
  }
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: char.archetype === 'crawler' ? 0.88 : 0.42,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.1,
    bevelSegments: 3,
  });
  hullGeo.rotateX(Math.PI / 2);
  safeComputeTangents(hullGeo);
  const hullMesh = new THREE.Mesh(hullGeo, hullMaterial);
  hullMesh.position.y = char.archetype === 'crawler' ? 1.32 : 0.94;
  enableShadows(hullMesh, castShadows, true);
  bodyGroup.add(hullMesh);

  // Sculpted Upper Dorsal Spine & Aero Hood Cowling
  const spineShape = new THREE.Shape();
  spineShape.moveTo(-0.42, -1.98);
  spineShape.lineTo(0.42, -1.98);
  spineShape.lineTo(0.5, -0.2);
  spineShape.lineTo(0.28, 1.44);
  spineShape.lineTo(0.0, 2.25);
  spineShape.lineTo(-0.28, 1.44);
  spineShape.lineTo(-0.5, -0.2);
  spineShape.closePath();

  const spineGeo = new THREE.ExtrudeGeometry(spineShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  spineGeo.rotateX(Math.PI / 2);
  safeComputeTangents(spineGeo);
  const spineMesh = new THREE.Mesh(spineGeo, hullMaterial);
  spineMesh.position.y = char.archetype === 'crawler' ? 1.54 : 1.13;
  enableShadows(spineMesh, castShadows, true);
  bodyGroup.add(spineMesh);

  // Hero Dusk-9 Exclusive Dorsal Airbox Snorkel, Louver Ribs, & Nose Pitot Sensors
  if (isHero) {
    const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.95), carbonMaterial);
    airbox.position.set(0, 1.34, -0.78);
    airbox.rotation.x = 0.08;
    enableShadows(airbox, castShadows, true);
    bodyGroup.add(airbox);

    const airboxRim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.1), accentMaterial);
    airboxRim.position.set(0, 1.36, -0.3);
    bodyGroup.add(airboxRim);

    const airboxIntake = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.19, 0.08), matteChassisMat);
    airboxIntake.position.set(0, 1.36, -0.26);
    bodyGroup.add(airboxIntake);

    // Titanium Spine Trim Strakes & Cooling Louvers on Engine Deck
    for (const sx of [-0.28, 0.28]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 1.45), accentMaterial);
      trim.position.set(sx, 1.24, -1.15);
      trim.rotation.y = sx * -0.05;
      bodyGroup.add(trim);
    }
    for (let lv = 0; lv < 5; lv++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.09), matteChassisMat);
      louver.position.set(0, 1.22, -1.15 - lv * 0.17);
      louver.rotation.x = 0.28;
      bodyGroup.add(louver);
    }

    // Twin Nose Pitot / Flux Telemetry Probes + Titanium Hood Latch Pins
    const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.38, 8), accentMaterial);
    pitot.rotation.x = Math.PI / 2;
    pitot.position.set(0, 0.88, 2.52);
    bodyGroup.add(pitot);

    for (const sx of [-0.22, 0.22]) {
      const hoodPin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 6), accentMaterial);
      hoodPin.position.set(sx, 1.18, 1.42);
      bodyGroup.add(hoodPin);
    }
  }

  // Flared Sculpted Sidepods with Finned Radiator Intercoolers & Titanium Intake Lips
  for (const side of [-1, 1]) {
    const podGroup = new THREE.Group();
    const podGeo = new THREE.BoxGeometry(0.44, 0.36, 1.78);
    const pod = new THREE.Mesh(podGeo, hullMaterial);
    pod.position.set(side * 0.96, 0.66, -0.45);
    pod.rotation.y = side * -0.08;
    podGroup.add(pod);

    const intakeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.14), accentMaterial);
    intakeFrame.position.set(side * 0.99, 0.66, 0.42);
    intakeFrame.rotation.y = side * -0.08;
    podGroup.add(intakeFrame);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.08), matteChassisMat);
    grille.position.set(side * 0.99, 0.66, 0.47);
    grille.rotation.y = side * -0.08;
    podGroup.add(grille);

    if (isHero) {
      // Intercooler radiator slats + side bargeboard aero vane
      for (let r = -1; r <= 1; r++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.05), accentMaterial);
        fin.position.set(side * 0.99, 0.66 + r * 0.065, 0.49);
        fin.rotation.y = side * -0.08;
        podGroup.add(fin);
      }
      const bargeboard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.46), carbonMaterial);
      bargeboard.position.set(side * 1.18, 0.56, 0.68);
      bargeboard.rotation.y = side * 0.22;
      podGroup.add(bargeboard);
    }

    // Side Aero Skirt Blade
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 2.24), accentMaterial);
    skirt.position.set(side * 1.14, 0.34, -0.35);
    podGroup.add(skirt);

    enableShadows(podGroup, castShadows, true);
    bodyGroup.add(podGroup);
  }

  // 4. Recessed Cockpit Tub + Detailed Articulated Pilot
  const cockpitTub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.48, 0.24, 18),
    matteChassisMat,
  );
  cockpitTub.scale.set(0.95, 1, 1.55);
  cockpitTub.position.set(0, 1.04, 0.16);
  bodyGroup.add(cockpitTub);

  let heroHeadGroup: THREE.Group | undefined;
  let steeringWheelGroup: THREE.Group | undefined;

  if (isHero) {
    const heroCockpit = buildHeroPilotAndCockpit(
      bodyGroup,
      textures,
      accentMaterial,
      carbonMaterial,
      castShadows,
    );
    heroHeadGroup = heroCockpit.heroHeadGroup;
    steeringWheelGroup = heroCockpit.steeringWheelGroup;
  } else if (char.archetype === 'racer' || char.archetype === 'sail') {
    const pilotGroup = new THREE.Group();
    pilotGroup.position.set(0, 1.06, 0.12);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.12), carbonMaterial);
    headrest.position.set(0, 0.22, -0.32);
    headrest.rotation.x = -0.15;
    pilotGroup.add(headrest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.26, 12), matteChassisMat);
    torso.position.set(0, 0.12, -0.05);
    pilotGroup.add(torso);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), accentMaterial);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.24, -0.04);
    pilotGroup.add(collar);

    const helmetMat = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      metalness: 0.45,
      roughness: 0.22,
      clearcoat: 1.0,
    });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), helmetMat);
    helmet.scale.set(0.95, 1.0, 1.12);
    helmet.position.set(0, 0.37, -0.02);
    pilotGroup.add(helmet);

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.9,
      roughness: 0.12,
      metalness: 0.8,
    });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.14), visorMat);
    visor.position.set(0, 0.38, 0.08);
    pilotGroup.add(visor);

    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.04), accentMaterial);
    yoke.position.set(0, 0.18, 0.26);
    yoke.rotation.x = -0.35;
    pilotGroup.add(yoke);

    bodyGroup.add(pilotGroup);
  }

  // Sculpted Canopy Halo Frame + Transparent Iridescent Glass Canopy
  const canopyFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.042, 10, 26),
    carbonMaterial,
  );
  canopyFrame.rotation.x = Math.PI / 2;
  canopyFrame.scale.set(0.92, 1.56, 1);
  canopyFrame.position.set(0, char.archetype === 'crawler' ? 1.48 : 1.14, 0.14);
  bodyGroup.add(canopyFrame);

  if (isHero) {
    // Central Titanium Halo Aero Spine Pillar in front of windscreen
    const haloCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.15, 0.94),
      new THREE.Vector3(0, 1.46, 0.56),
      new THREE.Vector3(0, 1.44, -0.24),
    ]);
    const haloBar = new THREE.Mesh(new THREE.TubeGeometry(haloCurve, 14, 0.028, 8, false), carbonMaterial);
    bodyGroup.add(haloBar);
  }

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 16), canopyMaterial);
  canopy.scale.set(0.92, 0.54, 1.55);
  canopy.position.set(0, char.archetype === 'crawler' ? 1.52 : 1.18, 0.14);
  canopy.renderOrder = 4;
  bodyGroup.add(canopy);

  // 5. Multi-Element Front Splitter Wing, Canards & Projectors
  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.075, 0.54),
    carbonMaterial,
  );
  splitter.position.set(0, 0.34, 2.28);
  enableShadows(splitter, castShadows, true);
  bodyGroup.add(splitter);

  const splitterLip = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.04, 0.12), accentMaterial);
  splitterLip.position.set(0, 0.36, 2.52);
  bodyGroup.add(splitterLip);

  if (isHero) {
    // Upper front wing element + vertical aero endplates
    const frontFlap = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.045, 0.22), hullMaterial);
    frontFlap.position.set(0, 0.44, 2.24);
    frontFlap.rotation.x = 0.18;
    bodyGroup.add(frontFlap);

    for (const sx of [-1.06, 1.06]) {
      const fEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.58), carbonMaterial);
      fEndplate.position.set(sx, 0.42, 2.28);
      bodyGroup.add(fEndplate);
    }
  }

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: isHero ? 0x67e8f9 : accentColor,
    emissiveIntensity: 1.05,
    roughness: 0.16,
  });

  const headlightCones: THREE.Mesh[] = [];
  const beamMat = isHero
    ? new THREE.MeshBasicMaterial({
        color: 0xa5f3fc,
        alphaMap: textures.beamAlphaMap,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    : null;

  for (const sx of [-1, 1]) {
    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.24), accentMaterial);
    canard.position.set(sx * 0.72, 0.58, 1.95);
    canard.rotation.z = sx * 0.18;
    canard.rotation.y = sx * -0.22;
    bodyGroup.add(canard);

    const lampHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.18), matteChassisMat);
    lampHousing.position.set(sx * 0.52, 0.74, 2.02);
    lampHousing.rotation.y = sx * 0.2;
    bodyGroup.add(lampHousing);

    const lampLed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.08), headlightMat);
    lampLed.position.set(sx * 0.52, 0.74, 2.09);
    lampLed.rotation.y = sx * 0.2;
    bodyGroup.add(lampLed);

    if (isHero && beamMat) {
      // Forward volumetric headlight cone
      const coneGeo = new THREE.ConeGeometry(1.45, 11.5, 16, 1, true);
      coneGeo.translate(0, -5.75, 0);
      coneGeo.rotateX(-Math.PI / 2);
      const beam = new THREE.Mesh(coneGeo, beamMat);
      beam.position.set(sx * 0.52, 0.72, 2.15);
      beam.rotation.y = sx * 0.05;
      beam.renderOrder = 5;
      bodyGroup.add(beam);
      headlightCones.push(beam);
    }
  }

  let headlightSpot: THREE.SpotLight | undefined;
  let headlightTarget: THREE.Object3D | undefined;
  if (isHero && !isSoftwareGl) {
    headlightSpot = new THREE.SpotLight(0xcffafe, 0.0, 48, Math.PI / 5.2, 0.55, 1.4);
    headlightSpot.castShadow = false; // Zero shadow-budget overhead
    headlightSpot.position.set(0, 1.05, 2.2);
    headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, 20);
    bodyGroup.add(headlightSpot);
    bodyGroup.add(headlightTarget);
    headlightSpot.target = headlightTarget;
  }

  // 6. Swan-Neck Multi-Element Rear GT Wing + Rear LED Tail Lightbar
  const wingGroup = new THREE.Group();
  for (const sx of [-0.58, 0.58]) {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.64, 0.36), carbonMaterial);
    pylon.position.set(sx, 1.25, -1.78);
    pylon.rotation.x = -0.18;
    wingGroup.add(pylon);
  }
  const mainPlane = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 0.42), carbonMaterial);
  mainPlane.position.set(0, 1.52, -1.88);
  mainPlane.rotation.x = 0.14;
  wingGroup.add(mainPlane);

  const upperFlap = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.045, 0.22), accentMaterial);
  upperFlap.position.set(0, 1.61, -2.02);
  upperFlap.rotation.x = 0.28;
  wingGroup.add(upperFlap);

  for (const sx of [-1.15, 1.15]) {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.68), hullMaterial);
    endplate.position.set(sx, 1.5, -1.9);
    wingGroup.add(endplate);
  }
  enableShadows(wingGroup, castShadows, true);
  bodyGroup.add(wingGroup);

  const tailBarMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.0,
    roughness: 0.22,
  });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.08), tailBarMat);
  tailBar.position.set(0, 0.88, -2.2);
  bodyGroup.add(tailBar);

  // 7. Multi-Stage Lathe Bell Exhaust Thrusters + Stator Cones + Plasma Plume Cones
  const bellGeo = createBellNozzleGeometry();
  const nozzleMat = new THREE.MeshPhysicalMaterial({
    color: 0x334155,
    metalness: 0.96,
    roughness: 0.18,
    anisotropy: 0.85,
    iridescence: isHero ? 0.8 : 0.2,
    iridescenceIOR: 1.38,
    bumpMap: textures.metalBump,
    bumpScale: 0.015,
  });
  const plumeMat = new THREE.MeshBasicMaterial({
    color: isHero ? 0x38bdf8 : accentColor,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const exhaustPlumes: THREE.Mesh[] = [];

  for (const sx of [-0.42, 0.42]) {
    const nozzle = new THREE.Mesh(bellGeo, nozzleMat);
    nozzle.position.set(sx, 0.64, -2.02);
    enableShadows(nozzle, castShadows, true);
    bodyGroup.add(nozzle);

    if (isHero) {
      // Inner glowing turbine stator cone
      const stator = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 12), accentMaterial);
      stator.rotation.x = -Math.PI / 2;
      stator.position.set(sx, 0.64, -2.18);
      bodyGroup.add(stator);
    }

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.032, 8, 18), accentMaterial);
    collar.position.set(sx, 0.64, -2.29);
    bodyGroup.add(collar);

    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 12), plumeMat);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(sx, 0.64, -2.62);
    bodyGroup.add(plume);
    exhaustPlumes.push(plume);
  }

  // 8. Archetype-specific distinct silhouette features
  if (char.archetype === 'sail') {
    const fixedSail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.55, 1.15), accentMaterial);
    fixedSail.position.set(0, 1.82, -0.9);
    fixedSail.rotation.x = -0.25;
    enableShadows(fixedSail, castShadows, true);
    bodyGroup.add(fixedSail);
  } else if (char.archetype === 'swarm') {
    const swarmRing = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.08, 10, 24), accentMaterial);
    swarmRing.position.set(0, 1.44, -0.35);
    enableShadows(swarmRing, castShadows, true);
    bodyGroup.add(swarmRing);
  } else if (char.archetype === 'crawler') {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.42, 2.25), matteChassisMat);
    plate.position.set(0, 1.38, -0.3);
    enableShadows(plate, castShadows, true);
    bodyGroup.add(plate);
  }

  // 9. Articulated Pushrod Suspension, Coilover Springs, Cross-Drilled Brakes & Wheels
  const wheels: THREE.Object3D[] = [];
  const frontWheelSteerGroups: THREE.Group[] = [];

  const tireGeo = createLatheTireGeometry();
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.9,
    metalness: 0.08,
    normalMap: textures.tireNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: textures.tireRoughness,
  });
  const rotorMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    metalness: 0.94,
    roughness: 0.34,
    roughnessMap: textures.brakeDiscRoughness,
    anisotropy: 0.7,
  });
  const caliperMat = new THREE.MeshPhysicalMaterial({
    color: isHero ? 0xe11d48 : accentColor,
    metalness: 0.55,
    roughness: 0.26,
    clearcoat: 0.75,
    emissive: isHero ? 0x9f1239 : accentColor,
    emissiveIntensity: 0.2,
  });

  const wheelConfigs: Array<{ pos: [number, number, number]; isFront: boolean; side: number }> = [
    { pos: [-1.24, 0.44, 1.44], isFront: true, side: -1 },
    { pos: [1.24, 0.44, 1.44], isFront: true, side: 1 },
    { pos: [-1.28, 0.44, -1.38], isFront: false, side: -1 },
    { pos: [1.28, 0.44, -1.38], isFront: false, side: 1 },
  ];

  for (const cfg of wheelConfigs) {
    const [wx, wy, wz] = cfg.pos;

    // Upper & Lower A-arms + Diagonal Pushrod + Helical Coilover Spring
    const armUpper = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.042, 0.085), matteChassisMat);
    armUpper.position.set(wx - cfg.side * 0.34, wy + 0.14, wz);
    armUpper.rotation.z = cfg.side * -0.18;
    bodyGroup.add(armUpper);

    const armLower = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.12), matteChassisMat);
    armLower.position.set(wx - cfg.side * 0.34, wy - 0.06, wz);
    armLower.rotation.z = cfg.side * 0.08;
    bodyGroup.add(armLower);

    if (isHero) {
      const pushrod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 8), carbonMaterial);
      pushrod.position.set(wx - cfg.side * 0.34, wy + 0.12, wz + 0.08);
      pushrod.rotation.z = cfg.side * 0.92;
      bodyGroup.add(pushrod);

      for (let sp = 0; sp < 4; sp++) {
        const coilRing = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.013, 6, 12), accentMaterial);
        const offset = (sp - 1.5) * 0.052;
        coilRing.position.set(
          wx - cfg.side * 0.34 + Math.sin(cfg.side * 0.52) * offset,
          wy + 0.18 + Math.cos(cfg.side * 0.52) * offset,
          wz,
        );
        coilRing.rotation.x = Math.PI / 2;
        coilRing.rotation.y = cfg.side * 0.52;
        bodyGroup.add(coilRing);
      }
    }

    const coilover = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.36, 8), accentMaterial);
    coilover.position.set(wx - cfg.side * 0.34, wy + 0.18, wz);
    coilover.rotation.z = cfg.side * 0.52;
    bodyGroup.add(coilover);

    const steerGroup = new THREE.Group();
    steerGroup.position.set(wx, wy, wz);
    root.add(steerGroup);
    if (cfg.isFront) frontWheelSteerGroups.push(steerGroup);

    const wheelSpinGroup = new THREE.Group();
    steerGroup.add(wheelSpinGroup);

    if (char.archetype === 'buggy') {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.58, 0.22, 18), accentMaterial);
      pod.position.y = -0.12;
      wheelSpinGroup.add(pod);
    } else {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = castShadows;
      tire.receiveShadow = true;
      wheelSpinGroup.add(tire);

      // Slotted cross-drilled brake rotor + 4-piston caliper (stationary inside steerGroup!)
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 18), rotorMat);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = -cfg.side * 0.06;
      steerGroup.add(rotor);

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.15, 0.13), caliperMat);
      caliper.position.set(-cfg.side * 0.06, 0.13, -0.12);
      steerGroup.add(caliper);

      // 6-Spoke Forged Alloy Rim + Center Lock Nut
      const rimBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.265, 0.265, 0.33, 18, 1, true),
        accentMaterial,
      );
      rimBarrel.rotation.z = Math.PI / 2;
      wheelSpinGroup.add(rimBarrel);

      for (let sp = 0; sp < 3; sp++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.48, 0.052), accentMaterial);
        spoke.rotation.x = (sp / 3) * Math.PI;
        wheelSpinGroup.add(spoke);
      }

      const centerNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.072, 0.42, 6),
        matteChassisMat,
      );
      centerNut.rotation.z = Math.PI / 2;
      wheelSpinGroup.add(centerNut);
    }

    wheels.push(wheelSpinGroup);
  }

  // 10. Dynamic Mutation Visual Morph Attachments (hidden until mutated!)
  const sailFinGroup = new THREE.Group();
  const finMat = new THREE.MeshPhysicalMaterial({
    color: 0x2dd4bf,
    emissive: 0x14b8a6,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.4,
    clearcoat: 0.8,
  });
  const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 1.05), finMat);
  finMesh.position.set(0, 1.85, -1.25);
  finMesh.rotation.x = -0.32;
  sailFinGroup.add(finMesh);
  sailFinGroup.visible = false;
  bodyGroup.add(sailFinGroup);

  const acidExhaustGroup = new THREE.Group();
  const acidMat = new THREE.MeshStandardMaterial({
    color: 0xa3e635,
    emissive: 0x84cc16,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  for (const sx of [-0.42, 0.42]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 10), acidMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(sx, 0.64, -2.78);
    acidExhaustGroup.add(cone);
  }
  acidExhaustGroup.visible = false;
  bodyGroup.add(acidExhaustGroup);

  const synapseVeinsGroup = new THREE.Group();
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0xa78bfa,
    emissive: 0x8b5cf6,
    emissiveIntensity: 1.15,
    roughness: 0.25,
  });
  for (const sx of [-0.66, 0.66]) {
    const vein = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 3.1), veinMat);
    vein.position.set(sx, 1.04, 0.05);
    synapseVeinsGroup.add(vein);
  }
  synapseVeinsGroup.visible = false;
  bodyGroup.add(synapseVeinsGroup);

  const tendrilsGroup = new THREE.Group();
  const tendrilMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.85,
    roughness: 0.5,
  });
  for (const sx of [-1.06, 1.06]) {
    const tendril = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.2), tendrilMat);
    tendril.position.set(sx, 0.35, 0);
    tendrilsGroup.add(tendril);
  }
  tendrilsGroup.visible = false;
  bodyGroup.add(tendrilsGroup);

  const holoGhostGroup = new THREE.Group();
  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.95,
    transparent: true,
    opacity: 0.34,
    wireframe: true,
  });
  const holoShell = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 3.8), holoMat);
  holoShell.position.set(1.6, 0.85, -0.6);
  holoGhostGroup.add(holoShell);
  holoGhostGroup.visible = false;
  bodyGroup.add(holoGhostGroup);

  return {
    root,
    bodyGroup,
    wheels,
    frontWheelSteerGroups,
    exhaustPlumes,
    hullMaterial,
    accentMaterial,
    sailFinGroup,
    acidExhaustGroup,
    synapseVeinsGroup,
    tendrilsGroup,
    holoGhostGroup,
    baseColor,
    heroHeadGroup,
    steeringWheelGroup,
    headlightCones: headlightCones.length > 0 ? headlightCones : undefined,
    headlightSpot,
    headlightTarget,
  };
}

export function createGhostTelemetryMesh(): THREE.Group {
  const ghostGroup = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.32,
    wireframe: true,
    depthWrite: false,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.56, 4.1), shellMat);
  body.position.set(0, 0.74, 0);
  ghostGroup.add(body);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 8), shellMat);
  canopy.scale.set(0.92, 0.54, 1.55);
  canopy.position.set(0, 1.16, 0.14);
  ghostGroup.add(canopy);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.08, 0.42), shellMat);
  wing.position.set(0, 1.52, -1.88);
  ghostGroup.add(wing);

  const wire = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.62, 4.18), wireMat);
  wire.position.set(0, 0.74, 0);
  ghostGroup.add(wire);

  return ghostGroup;
}

export function applyMutationVisualsToRig(
  rig: VehicleVisualRig,
  mutations: MutationId[],
  timeSec: number,
  speedRatio = 0.2,
): void {
  const has = (id: MutationId) => mutations.includes(id);
  rig.sailFinGroup.visible = has('sail_fins');
  rig.acidExhaustGroup.visible = has('acid_exhaust');
  rig.synapseVeinsGroup.visible = has('synapse');
  rig.tendrilsGroup.visible = has('sticky_core');
  rig.holoGhostGroup.visible = has('holo_decoy');

  if (has('chromophore')) {
    const hue = (timeSec * 0.18) % 1;
    rig.hullMaterial.color.setHSL(hue, 0.65, 0.42);
  } else {
    rig.hullMaterial.color.copy(rig.baseColor);
  }

  if (has('holo_decoy')) {
    rig.holoGhostGroup.position.x = Math.sin(timeSec * 4) * 0.6;
  }

  // Dynamic plasma thruster plume length based on speed
  const plumeScaleZ = 0.45 + Math.min(1.6, speedRatio * 1.4) + Math.sin(timeSec * 28) * 0.1;
  for (const plume of rig.exhaustPlumes) {
    plume.scale.set(1, plumeScaleZ, 1);
  }
}
