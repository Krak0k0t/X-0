import * as THREE from 'three';
import type { BiomeId } from '../types';

export interface ProceduralTextureSet {
  trackAlbedo: THREE.CanvasTexture;
  trackRoughness: THREE.CanvasTexture;
  trackBump: THREE.CanvasTexture;
  terrainAlbedo: THREE.CanvasTexture;
  terrainNormal: THREE.CanvasTexture;
  pennantAlbedo: THREE.CanvasTexture;
  metalBump: THREE.CanvasTexture;
  hullNormal: THREE.CanvasTexture;
  hullMicroScratchRoughness: THREE.CanvasTexture;
  carbonAlbedo: THREE.CanvasTexture;
  pilotSuitNormal: THREE.CanvasTexture;
  cockpitHudTexture: THREE.CanvasTexture;
  brakeDiscRoughness: THREE.CanvasTexture;
  tireNormal: THREE.CanvasTexture;
  tireRoughness: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  sparkSprite: THREE.CanvasTexture;
  beamAlphaMap: THREE.CanvasTexture;
}

const BIOME_PALETTES: Record<
  BiomeId,
  { roadBase: string; roadVein: string; curb: string; groundA: string; groundB: string }
> = {
  crystal: {
    roadBase: '#1b2336',
    roadVein: '#38bdf8',
    curb: '#d4a853',
    groundA: '#0e1424',
    groundB: '#1c2944',
  },
  canyon: {
    roadBase: '#2c1e1a',
    roadVein: '#ea580c',
    curb: '#f59e0b',
    groundA: '#1c110d',
    groundB: '#422318',
  },
  spore: {
    roadBase: '#162825',
    roadVein: '#2dd4bf',
    curb: '#a3e635',
    groundA: '#0b1815',
    groundB: '#19352f',
  },
  storm: {
    roadBase: '#161b26',
    roadVein: '#818cf8',
    curb: '#cbd5e1',
    groundA: '#0b0e16',
    groundB: '#1c2438',
  },
  needle: {
    roadBase: '#201e2b',
    roadVein: '#e6ba63',
    curb: '#f43f5e',
    groundA: '#12101a',
    groundB: '#2d263e',
  },
  epicenter: {
    roadBase: '#23162b',
    roadVein: '#f0abfc',
    curb: '#fde68a',
    groundA: '#120a18',
    groundB: '#331c42',
  },
};

function createNormalMapFromHeight(
  heightData: Float32Array,
  size: number,
  strength: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const sample = (x: number, y: number) => {
    const sx = ((x % size) + size) % size;
    const sy = ((y % size) + size) % size;
    return heightData[sy * size + sx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createProceduralTextureSet(
  biome: BiomeId,
  maxAnisotropy: number,
): ProceduralTextureSet {
  const pal = BIOME_PALETTES[biome];

  // 1. Track Albedo (512x512)
  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = 512;
  trackCanvas.height = 512;
  const tctx = trackCanvas.getContext('2d')!;
  tctx.fillStyle = pal.roadBase;
  tctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 2 + Math.random() * 14;
    const h = 2 + Math.random() * 4;
    tctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)';
    tctx.fillRect(x, y, w, h);
  }

  tctx.fillStyle = pal.curb;
  tctx.fillRect(0, 0, 20, 512);
  tctx.fillRect(492, 0, 20, 512);

  tctx.fillStyle = 'rgba(0,0,0,0.45)';
  for (let y = 0; y < 512; y += 64) {
    tctx.fillRect(0, y, 20, 28);
    tctx.fillRect(492, y, 20, 28);
  }

  tctx.fillStyle = pal.roadVein;
  tctx.globalAlpha = 0.38;
  for (let y = 16; y < 512; y += 64) {
    tctx.fillRect(251, y, 10, 32);
  }
  tctx.globalAlpha = 1;

  const trackAlbedo = new THREE.CanvasTexture(trackCanvas);
  trackAlbedo.colorSpace = THREE.SRGBColorSpace;
  trackAlbedo.wrapS = THREE.RepeatWrapping;
  trackAlbedo.wrapT = THREE.RepeatWrapping;
  trackAlbedo.anisotropy = maxAnisotropy;

  // 2. Track Roughness + Bump (linear space)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rctx = roughCanvas.getContext('2d')!;
  rctx.fillStyle = '#9a9a9a';
  rctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 3 + Math.random() * 14;
    rctx.fillStyle = i % 5 === 0 ? 'rgba(40,40,40,0.45)' : 'rgba(220,220,220,0.18)';
    rctx.beginPath();
    rctx.arc(x, y, r, 0, Math.PI * 2);
    rctx.fill();
  }
  const trackRoughness = new THREE.CanvasTexture(roughCanvas);
  trackRoughness.wrapS = THREE.RepeatWrapping;
  trackRoughness.wrapT = THREE.RepeatWrapping;
  trackRoughness.anisotropy = maxAnisotropy;

  const trackBump = new THREE.CanvasTexture(roughCanvas);
  trackBump.wrapS = THREE.RepeatWrapping;
  trackBump.wrapT = THREE.RepeatWrapping;

  // 3. Terrain Albedo
  const terrCanvas = document.createElement('canvas');
  terrCanvas.width = 256;
  terrCanvas.height = 256;
  const gctx = terrCanvas.getContext('2d')!;
  const grad = gctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, pal.groundA);
  grad.addColorStop(1, pal.groundB);
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    gctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)';
    gctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 10, 4 + Math.random() * 10);
  }
  const terrainAlbedo = new THREE.CanvasTexture(terrCanvas);
  terrainAlbedo.colorSpace = THREE.SRGBColorSpace;
  terrainAlbedo.wrapS = THREE.RepeatWrapping;
  terrainAlbedo.wrapT = THREE.RepeatWrapping;
  terrainAlbedo.repeat.set(28, 28);
  terrainAlbedo.anisotropy = maxAnisotropy;

  // 3b. Terrain Dune & Basalt Crack Normal Map (linear, tiled)
  const terrSize = 128;
  const terrHeight = new Float32Array(terrSize * terrSize);
  for (let y = 0; y < terrSize; y++) {
    for (let x = 0; x < terrSize; x++) {
      const ridge = Math.sin((x + y * 0.5) * 0.22) * 0.18 + Math.cos(y * 0.35) * 0.1;
      const crack = ((x * 7 + y * 13) % 41 === 0) ? -0.25 : 0;
      terrHeight[y * terrSize + x] = 0.5 + ridge + crack;
    }
  }
  const terrainNormal = createNormalMapFromHeight(terrHeight, terrSize, 2.2);
  terrainNormal.repeat.set(28, 28);
  terrainNormal.anisotropy = maxAnisotropy;

  // 3c. Pennant Cloth Albedo with biome trim stripe (SRGB)
  const penCanvas = document.createElement('canvas');
  penCanvas.width = 64;
  penCanvas.height = 64;
  const pctx = penCanvas.getContext('2d')!;
  pctx.fillStyle = pal.roadBase;
  pctx.fillRect(0, 0, 64, 64);
  pctx.fillStyle = pal.curb;
  pctx.fillRect(0, 18, 64, 14);
  pctx.fillStyle = pal.roadVein;
  pctx.fillRect(0, 44, 64, 10);
  const pennantAlbedo = new THREE.CanvasTexture(penCanvas);
  pennantAlbedo.colorSpace = THREE.SRGBColorSpace;
  pennantAlbedo.anisotropy = maxAnisotropy;

  // 4. Brushed Metal Bump
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 128;
  metalCanvas.height = 128;
  const mctx = metalCanvas.getContext('2d')!;
  mctx.fillStyle = '#808080';
  mctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    const shade = 110 + Math.floor(Math.random() * 36);
    mctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    mctx.fillRect(0, y, 128, 1);
  }
  const metalBump = new THREE.CanvasTexture(metalCanvas);
  metalBump.wrapS = THREE.RepeatWrapping;
  metalBump.wrapT = THREE.RepeatWrapping;

  // 5. High-Detail Vehicle Hull Normal Map (512x512): panel seams, flush latches, rivets, aero louvers, micro-grain
  const hullSize = 512;
  const hullHeight = new Float32Array(hullSize * hullSize);
  hullHeight.fill(0.55);

  for (let y = 0; y < hullSize; y++) {
    for (let x = 0; x < hullSize; x++) {
      let h = 0.55 + Math.sin(x * 0.38) * 0.006 + Math.cos(y * 0.72) * 0.004;
      // Primary & secondary recessed panel seam channels with beveled lip
      const nearSeamX = Math.min(
        Math.abs(x - 128),
        Math.abs(x - 256),
        Math.abs(x - 384),
      );
      const nearSeamY = Math.min(
        Math.abs(y - 110),
        Math.abs(y - 256),
        Math.abs(y - 392),
      );
      if (nearSeamX < 3 || nearSeamY < 3) {
        h -= 0.34;
      } else if (nearSeamX < 5 || nearSeamY < 5) {
        h += 0.04;
      }
      // Twin aero cooling louver banks
      if (
        ((x > 165 && x < 238) || (x > 274 && x < 347)) &&
        y > 180 &&
        y < 330 &&
        y % 18 < 7
      ) {
        h -= 0.25;
      }
      // Precision hex fastener dimples flanking seams
      if (
        (Math.abs(x - 142) < 4 || Math.abs(x - 370) < 4 || Math.abs(x - 242) < 4 || Math.abs(x - 270) < 4) &&
        y % 36 >= 15 &&
        y % 36 <= 21
      ) {
        const dx = Math.min(
          Math.abs(x - 142),
          Math.abs(x - 370),
          Math.abs(x - 242),
          Math.abs(x - 270),
        );
        const dy = Math.abs((y % 36) - 18);
        if (dx * dx + dy * dy <= 10) {
          h += 0.18;
        }
      }
      hullHeight[y * hullSize + x] = h;
    }
  }
  // Micro-scratches etched into 512x512 heightmap
  for (let i = 0; i < 320; i++) {
    const sx = Math.floor(Math.random() * hullSize);
    const sy = Math.floor(Math.random() * hullSize);
    const len = 12 + Math.floor(Math.random() * 38);
    const dx = Math.random() > 0.5 ? 1 : -1;
    const dy = (Math.random() - 0.5) * 0.55;
    for (let s = 0; s < len; s++) {
      const px = (((sx + Math.round(s * dx)) % hullSize) + hullSize) % hullSize;
      const py = (((sy + Math.round(s * dy)) % hullSize) + hullSize) % hullSize;
      hullHeight[py * hullSize + px] -= 0.075;
    }
  }
  const hullNormal = createNormalMapFromHeight(hullHeight, hullSize, 3.6);
  hullNormal.anisotropy = maxAnisotropy;

  // 6. Micro-Scratch & Brushed Wear Roughness Map (512x512, linear)
  const scratchCanvas = document.createElement('canvas');
  scratchCanvas.width = 512;
  scratchCanvas.height = 512;
  const scCtx = scratchCanvas.getContext('2d')!;
  scCtx.fillStyle = '#363636'; // smooth lacquered metallic base
  scCtx.fillRect(0, 0, 512, 512);

  // Fine horizontal brushed titanium grain
  for (let y = 0; y < 512; y += 2) {
    const v = 44 + Math.floor(Math.random() * 26);
    scCtx.fillStyle = `rgb(${v},${v},${v})`;
    scCtx.fillRect(0, y, 512, 1);
  }
  // Seam edge wear highlights
  scCtx.fillStyle = 'rgba(180,180,180,0.22)';
  scCtx.fillRect(125, 0, 6, 512);
  scCtx.fillRect(381, 0, 6, 512);
  scCtx.fillRect(0, 108, 512, 5);
  scCtx.fillRect(0, 390, 512, 5);

  // Micro-scratches & gravel sand-blasting wear
  scCtx.lineWidth = 1;
  for (let i = 0; i < 480; i++) {
    const x1 = Math.random() * 512;
    const y1 = Math.random() * 512;
    const ang = (Math.random() - 0.5) * 0.65;
    const len = 8 + Math.random() * 44;
    scCtx.strokeStyle = i % 4 === 0 ? 'rgba(215,215,215,0.42)' : 'rgba(148,148,148,0.26)';
    scCtx.beginPath();
    scCtx.moveTo(x1, y1);
    scCtx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
    scCtx.stroke();
  }
  const hullMicroScratchRoughness = new THREE.CanvasTexture(scratchCanvas);
  hullMicroScratchRoughness.wrapS = THREE.RepeatWrapping;
  hullMicroScratchRoughness.wrapT = THREE.RepeatWrapping;
  hullMicroScratchRoughness.anisotropy = maxAnisotropy;

  // 7. Carbon Fiber Weave Albedo (128x128, SRGB)
  const carbonCanvas = document.createElement('canvas');
  carbonCanvas.width = 128;
  carbonCanvas.height = 128;
  const cCtx = carbonCanvas.getContext('2d')!;
  cCtx.fillStyle = '#11141c';
  cCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    for (let x = 0; x < 128; x += 8) {
      const diag = ((x + y) / 8) % 2 === 0;
      cCtx.fillStyle = diag ? '#1e2432' : '#0c0f15';
      cCtx.fillRect(x, y, 7, 4);
      cCtx.fillStyle = diag ? '#151924' : '#262d3d';
      cCtx.fillRect(x, y + 4, 7, 4);
    }
  }
  const carbonAlbedo = new THREE.CanvasTexture(carbonCanvas);
  carbonAlbedo.colorSpace = THREE.SRGBColorSpace;
  carbonAlbedo.wrapS = THREE.RepeatWrapping;
  carbonAlbedo.wrapT = THREE.RepeatWrapping;
  carbonAlbedo.repeat.set(4, 4);
  carbonAlbedo.anisotropy = maxAnisotropy;

  // 7b. Ribbed Kevlar/Nomex Pilot Suit Normal Map (128x128, linear)
  const suitSize = 128;
  const suitHeight = new Float32Array(suitSize * suitSize);
  for (let y = 0; y < suitSize; y++) {
    for (let x = 0; x < suitSize; x++) {
      const weave = Math.sin(x * 0.85) * Math.cos(y * 0.85) * 0.14;
      const rib = y % 16 < 3 ? -0.18 : 0.05;
      suitHeight[y * suitSize + x] = 0.5 + weave + rib;
    }
  }
  const pilotSuitNormal = createNormalMapFromHeight(suitHeight, suitSize, 2.5);
  pilotSuitNormal.repeat.set(3, 3);
  pilotSuitNormal.anisotropy = maxAnisotropy;

  // 7c. Cockpit Steering Yoke Digital Telemetry Display (256x128, SRGB)
  const hudCanvas = document.createElement('canvas');
  hudCanvas.width = 256;
  hudCanvas.height = 128;
  const hctx = hudCanvas.getContext('2d')!;
  hctx.fillStyle = '#060c14';
  hctx.fillRect(0, 0, 256, 128);
  hctx.strokeStyle = '#1e293b';
  hctx.lineWidth = 4;
  hctx.strokeRect(4, 4, 248, 120);
  // Tachometer arc
  hctx.strokeStyle = '#2dd4bf';
  hctx.lineWidth = 8;
  hctx.beginPath();
  hctx.arc(82, 82, 46, Math.PI * 0.85, Math.PI * 1.85);
  hctx.stroke();
  hctx.strokeStyle = '#f59e0b';
  hctx.beginPath();
  hctx.arc(82, 82, 46, Math.PI * 1.85, Math.PI * 2.15);
  hctx.stroke();
  // Digital telemetry bars & label
  hctx.fillStyle = '#38bdf8';
  hctx.font = 'bold 20px monospace';
  hctx.fillText('DUSK-9', 146, 38);
  hctx.fillStyle = '#e6ba63';
  hctx.font = 'bold 24px monospace';
  hctx.fillText('FLUX', 146, 70);
  for (let b = 0; b < 6; b++) {
    hctx.fillStyle = b < 4 ? '#2dd4bf' : '#f59e0b';
    hctx.fillRect(146 + b * 15, 86, 11, 20);
  }
  const cockpitHudTexture = new THREE.CanvasTexture(hudCanvas);
  cockpitHudTexture.colorSpace = THREE.SRGBColorSpace;
  cockpitHudTexture.anisotropy = maxAnisotropy;

  // 7d. Cross-Drilled Brake Disc Roughness Map (128x128, linear)
  const discCanvas = document.createElement('canvas');
  discCanvas.width = 128;
  discCanvas.height = 128;
  const dctx = discCanvas.getContext('2d')!;
  dctx.fillStyle = '#525252';
  dctx.fillRect(0, 0, 128, 128);
  for (let r = 18; r < 60; r += 4) {
    dctx.strokeStyle = r % 8 === 0 ? '#787878' : '#3a3a3a';
    dctx.lineWidth = 1.5;
    dctx.beginPath();
    dctx.arc(64, 64, r, 0, Math.PI * 2);
    dctx.stroke();
  }
  dctx.fillStyle = '#141414';
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    for (let rad = 28; rad <= 52; rad += 11) {
      dctx.beginPath();
      dctx.arc(64 + Math.cos(ang + rad * 0.03) * rad, 64 + Math.sin(ang + rad * 0.03) * rad, 2.2, 0, Math.PI * 2);
      dctx.fill();
    }
  }
  const brakeDiscRoughness = new THREE.CanvasTexture(discCanvas);
  brakeDiscRoughness.anisotropy = maxAnisotropy;

  // 8. Tire Chevron Tread Normal + Roughness Map (128x128)
  const tireSize = 128;
  const tireHeight = new Float32Array(tireSize * tireSize);
  const tireRoughCanvas = document.createElement('canvas');
  tireRoughCanvas.width = tireSize;
  tireRoughCanvas.height = tireSize;
  const trCtx = tireRoughCanvas.getContext('2d')!;
  trCtx.fillStyle = '#d4d4d4';
  trCtx.fillRect(0, 0, tireSize, tireSize);

  for (let y = 0; y < tireSize; y++) {
    for (let x = 0; x < tireSize; x++) {
      const cx = Math.abs(x - tireSize * 0.5);
      const chevron = (y + Math.floor(cx * 0.9)) % 16;
      const groove = chevron < 5 || cx < 4;
      tireHeight[y * tireSize + x] = groove ? 0.15 : 0.85;
      if (groove) {
        trCtx.fillStyle = '#ffffff';
        trCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  const tireNormal = createNormalMapFromHeight(tireHeight, tireSize, 2.8);
  const tireRoughness = new THREE.CanvasTexture(tireRoughCanvas);
  tireRoughness.wrapS = THREE.RepeatWrapping;
  tireRoughness.wrapT = THREE.RepeatWrapping;

  // 9. Soft radial contact shadow disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const sg = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  sg.addColorStop(0, 'rgba(0,0,0,0.78)');
  sg.addColorStop(0.55, 'rgba(0,0,0,0.38)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  // 10. Soft particle glow sprite
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.width = 64;
  sparkCanvas.height = 64;
  const spCtx = sparkCanvas.getContext('2d')!;
  const spGrad = spCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  spGrad.addColorStop(0, 'rgba(255,255,255,1)');
  spGrad.addColorStop(0.4, 'rgba(255,230,170,0.75)');
  spGrad.addColorStop(1, 'rgba(255,200,100,0)');
  spCtx.fillStyle = spGrad;
  spCtx.fillRect(0, 0, 64, 64);
  const sparkSprite = new THREE.CanvasTexture(sparkCanvas);
  sparkSprite.colorSpace = THREE.SRGBColorSpace;

  // 11. Longitudinal fade alpha map for volumetric headlight cones (apex v=1 bright -> base v=0 zero)
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 16;
  beamCanvas.height = 64;
  const bCtx = beamCanvas.getContext('2d')!;
  const bGrad = bCtx.createLinearGradient(0, 0, 0, 64);
  bGrad.addColorStop(0.0, 'rgb(255,255,255)');
  bGrad.addColorStop(0.28, 'rgb(190,190,190)');
  bGrad.addColorStop(0.7, 'rgb(65,65,65)');
  bGrad.addColorStop(0.96, 'rgb(0,0,0)');
  bGrad.addColorStop(1.0, 'rgb(0,0,0)');
  bCtx.fillStyle = bGrad;
  bCtx.fillRect(0, 0, 16, 64);
  const beamAlphaMap = new THREE.CanvasTexture(beamCanvas);
  beamAlphaMap.wrapS = THREE.ClampToEdgeWrapping;
  beamAlphaMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    trackAlbedo,
    trackRoughness,
    trackBump,
    terrainAlbedo,
    terrainNormal,
    pennantAlbedo,
    metalBump,
    hullNormal,
    hullMicroScratchRoughness,
    carbonAlbedo,
    pilotSuitNormal,
    cockpitHudTexture,
    brakeDiscRoughness,
    tireNormal,
    tireRoughness,
    contactShadow,
    sparkSprite,
    beamAlphaMap,
  };
}

export function disposeProceduralTextureSet(set: ProceduralTextureSet): void {
  set.trackAlbedo.dispose();
  set.trackRoughness.dispose();
  set.trackBump.dispose();
  set.terrainAlbedo.dispose();
  set.terrainNormal.dispose();
  set.pennantAlbedo.dispose();
  set.metalBump.dispose();
  set.hullNormal.dispose();
  set.hullMicroScratchRoughness.dispose();
  set.carbonAlbedo.dispose();
  set.pilotSuitNormal.dispose();
  set.cockpitHudTexture.dispose();
  set.brakeDiscRoughness.dispose();
  set.tireNormal.dispose();
  set.tireRoughness.dispose();
  set.contactShadow.dispose();
  set.sparkSprite.dispose();
  set.beamAlphaMap.dispose();
}
