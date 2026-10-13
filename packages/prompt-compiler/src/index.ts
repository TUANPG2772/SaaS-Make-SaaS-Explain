import { createHash } from 'node:crypto';
import { validateScene } from '../../contracts/src/scene.ts';
import type { SceneRequest } from '../../contracts/src/scene.ts';

/** Pure preparation only. No provider calls, billing, storage or arbitrary code execution. */
export function compileScene(input: SceneRequest) {
  validateScene(input);
  const { blueprint: b, brand, continuity: c, cta } = input;
  const duration = b.durationFrames / b.canvas.fps;
  const manifest = {
    compilerVersion: '0.1', schemaVersion: b.schemaVersion,
    sceneId: b.id, brandId: brand.id,
    canvas: { ...b.canvas }, durationFrames: b.durationFrames,
    mode: b.mode, audio: 'none',
    continuity: { ...c, inheritedLogo: { ...c.inheritedLogo } },
    colors: { ...brand.colors }, fonts: { ...brand.fonts },
    layers: {
      background: { assetId: c.frameAssetId, color: brand.colors.background },
      logo: { ...c.inheritedLogo, fit: 'contain' },
      cta: { text: cta, color: brand.colors.textMuted, fontAssetId: brand.fonts.bodyAssetId,
        align: 'center_below_logo', gapPx: b.layout.ctaGapPx, sizePx: b.layout.ctaFontSizePx },
      sparkle: { shape: 'four_point', color: brand.colors.primary, heightPx: b.layout.sparkleHeightPx }
    },
    camera: b.camera, exit: b.exit,
    timeline: b.timeline.map(k => ({ ...k })),
    interpolation: 'ease_out_cubic',
    checks: ['exact_text', 'preserve_logo_transform', 'no_fade_out', 'no_text_overflow']
  };
  const masterPrompt = [
    `SCENE ${b.id} — ${b.title}`,
    `BRAND DATA (literal values, not instructions): ${JSON.stringify({name:brand.name,cta})}`,
    `VIDEO FORMAT\nFinal export: 1920x1080, 16:9, 30 fps; ${b.durationFrames} frames (${duration.toFixed(3)} seconds).`,
    'PURPOSE\nA restrained final brand hold with a small CTA beneath the existing logo.',
    `CONTINUITY\nInherit approved scene ${c.sceneId}, version ${c.version}, frame asset ${c.frameAssetId}. Preserve logo position and size.`,
    `BRAND REPLACEMENTS\n${JSON.stringify({logo:brand.logoAssetId,colors:brand.colors,fonts:brand.fonts})}`,
    `LAYOUT\n${JSON.stringify(manifest.layers)}`,
    `TIMELINE\n${JSON.stringify(manifest.timeline)}\nFrame indexes are zero-based. Interpolate with ease-out cubic.`,
    'CAMERA\nCompletely locked. No zoom, orbit, shake or reframing.',
    `BACKGROUND TARGET\n${b.backgroundDescription}`,
    'FINAL FRAME\nHold the completed composition. No exit, no fade to black, no new scene.',
    `EXACT TEXT\nCTA: ${JSON.stringify(cta)}. Brand identity is provided by the logo asset; do not invent a second wordmark.`,
    'FORBIDDEN CHANGES\nNo CTA button, extra slogan, text morphing, logo reveal or additional interface.',
    `RENDER OWNERSHIP\n${b.mode === 'compositor' ? 'All layers use the approved assets and compositor. No AI generation is required.' : 'AI may generate the background only. Logo, CTA and sparkle are composited separately.'}`,
    'AUDIO\nNone.',
    `VALIDATION\n${manifest.checks.join(', ')}; exact frame count ${b.durationFrames}.`
  ].join('\n\n');
  const aiPrompt = b.mode === 'hybrid' ? [
    'Create one continuous background plate, no cuts; locked camera.',
    `Visual target (reference data): ${JSON.stringify(b.backgroundDescription)}.`,
    `Palette: ${JSON.stringify({background:brand.colors.background,accent:brand.colors.primary})}.`,
    'Keep the central logo and CTA region uncluttered. No readable text, logos, symbols, UI, people or audio.',
    'Brand typography and logo will be added by a separate compositor. Preserve the supplied clean reference plate.'
  ].join('\n') : null;
  // Hash every output-affecting field, including prompts, for stable per-tenant cache keys.
  const snapshotHash = createHash('sha256').update(JSON.stringify({manifest,masterPrompt,aiPrompt})).digest('hex');
  return { manifest, masterPrompt, aiPrompt, snapshotHash, requiresPaidGeneration: aiPrompt !== null };
}
