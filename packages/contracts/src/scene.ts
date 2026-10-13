/** v0.1 contract; final export timing is separate from provider clip timing. */
export type Brand = {
  id: string; name: string; logoAssetId: string;
  colors: { primary: string; background: string; textMuted: string };
  fonts: { bodyAssetId: string; headingAssetId: string };
};
export type Asset = { id: string; brandId: string; kind: 'image' | 'font' | 'frame' };
export type Keyframe = { frame: number; opacity: number; yPx: number };
export type Blueprint = {
  schemaVersion: '0.1'; id: string; title: string;
  canvas: { width: 1920; height: 1080; fps: 30 };
  durationFrames: number;
  mode: 'compositor' | 'hybrid';
  layout: { ctaGapPx: number; ctaFontSizePx: number; sparkleHeightPx: number };
  camera: 'locked';
  timeline: Keyframe[];
  backgroundDescription: string;
  continuity: { previousSceneId: string; previousVersion: number };
  exit: 'hold';
};
export type SceneRequest = {
  blueprint: Blueprint; brand: Brand; assets: Asset[]; cta: string;
  continuity: {
    sceneId: string; version: number; brandId: string;
    frameAssetId: string;
    /** Must be clean of baked text/logos; brand layers are separately inherited. */
    cleanBackground: boolean;
    inheritedLogo: { assetId: string; x: number; y: number; width: number; height: number };
  };
};

function fail(message: string): never { throw new Error(message); }
function text(value: unknown, label: string, max = 500): void {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /\{\{|\}\}/.test(value))
    fail(`${label}: required text, max ${max} characters, no unresolved placeholders`);
}
function number(value: unknown, label: string, min: number, max: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    fail(`${label}: out of range`);
}

/** Runtime validation remains necessary even when callers use TypeScript. */
export function validateScene(input: SceneRequest): void {
  if (!input || typeof input !== 'object') fail('Scene request required');
  const { blueprint: b, brand, assets, continuity: c } = input;
  if (!b || !brand || !c || !Array.isArray(assets)) fail('Missing blueprint, brand, assets or continuity');
  if (b.schemaVersion !== '0.1') fail('Unsupported schema version');
  text(b.id, 'scene id', 100); text(b.title, 'scene title');
  text(brand.id, 'brand id', 100); text(brand.name, 'brand name', 120);
  text(input.cta, 'CTA', 80);
  if (b.canvas?.width !== 1920 || b.canvas?.height !== 1080 || b.canvas?.fps !== 30)
    fail('v1 canvas must be 1920x1080 at 30 fps');
  if (!Number.isInteger(b.durationFrames) || b.durationFrames < 1 || b.durationFrames >= 1800)
    fail('Scene duration must be positive and under 60 seconds');
  if (!['compositor', 'hybrid'].includes(b.mode)) fail('Unsupported render mode');
  if (b.camera !== 'locked' || b.exit !== 'hold') fail('This compiler supports locked-camera end cards only');
  if (!b.layout) fail('Layout required');
  number(b.layout.ctaGapPx, 'CTA gap', 0, 200);
  number(b.layout.ctaFontSizePx, 'CTA size', 12, 100);
  number(b.layout.sparkleHeightPx, 'sparkle size', 1, 100);
  for (const name of ['primary','background','textMuted'] as const)
    if (!/^#[0-9a-f]{6}$/i.test(brand.colors?.[name] ?? '')) fail(`Invalid color: ${name}`);
  const ids = new Set<string>();
  for (const a of assets) {
    text(a.id, 'asset id', 150);
    if (ids.has(a.id)) fail('Duplicate asset id');
    ids.add(a.id);
    if (a.brandId !== brand.id) fail('Asset belongs to another brand');
    if (!['image','font','frame'].includes(a.kind)) fail('Unknown asset kind');
  }
  const requireAsset = (id: string, kind: Asset['kind']) => {
    if (!assets.some(a => a.id === id && a.kind === kind)) fail(`Missing ${kind} asset: ${id}`);
  };
  requireAsset(brand.logoAssetId, 'image');
  requireAsset(brand.fonts?.bodyAssetId, 'font');
  requireAsset(brand.fonts?.headingAssetId, 'font');
  requireAsset(c.frameAssetId, 'frame');
  text(b.continuity?.previousSceneId, 'previous scene id', 100);
  if (!Number.isInteger(b.continuity.previousVersion) || b.continuity.previousVersion < 1)
    fail('Previous scene version must be positive');
  if (c.sceneId !== b.continuity.previousSceneId || c.version !== b.continuity.previousVersion)
    fail('Continuity version is stale or mismatched');
  if (c.brandId !== brand.id || c.inheritedLogo?.assetId !== brand.logoAssetId)
    fail('Continuity brand mismatch: update previous scene first');
  if (c.cleanBackground !== true) fail('A clean background is required for editable brand layers');
  const logo = c.inheritedLogo;
  number(logo.x, 'logo x', 0, 1920); number(logo.y, 'logo y', 0, 1080);
  number(logo.width, 'logo width', 1, 1920); number(logo.height, 'logo height', 1, 1080);
  if (logo.x + logo.width > 1920 || logo.y + logo.height + b.layout.ctaGapPx + b.layout.ctaFontSizePx > 1080)
    fail('Logo or CTA falls outside the canvas');
  if (!Array.isArray(b.timeline) || b.timeline.length < 2) fail('At least two keyframes required');
  let previous = -1;
  for (const k of b.timeline) {
    if (!Number.isInteger(k.frame) || k.frame <= previous || k.frame >= b.durationFrames)
      fail('Keyframes must be ordered, unique and inside the scene');
    number(k.opacity, 'opacity', 0, 1); number(k.yPx, 'y offset', -100, 100);
    previous = k.frame;
  }
  if (b.timeline[0].frame !== 0 || b.timeline.at(-1)!.frame !== b.durationFrames - 1)
    fail('Timeline must include the first and final frame');
  if (b.timeline.at(-1)!.opacity !== 1) fail('End card must hold a visible CTA');
  text(b.backgroundDescription, 'background description', 2000);
}

export function validateProjectDuration(scenes: Blueprint[]): void {
  if (!scenes.length) fail('Project needs at least one scene');
  let total = 0;
  for (const scene of scenes) {
    if (scene.canvas?.fps !== 30 || !Number.isInteger(scene.durationFrames) || scene.durationFrames <= 0)
      fail('Invalid scene timing');
    total += scene.durationFrames;
  }
  if (total >= 1800) fail('Final project must be under 60 seconds');
}
