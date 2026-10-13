import { createHash } from 'node:crypto';
import { compileSceneContent } from './content.ts';
import type { SceneRequest } from '../../contracts/src/scene.ts';

/** Pure preparation only. No provider calls, billing, storage or arbitrary code execution. */
export function compileScene(input: SceneRequest) {
  const {manifest, masterPrompt, aiPrompt} = compileSceneContent(input);
  // Hash every output-affecting field, including prompts, for stable per-tenant cache keys.
  const snapshotHash = createHash('sha256').update(JSON.stringify({manifest,masterPrompt,aiPrompt})).digest('hex');
  return { manifest, masterPrompt, aiPrompt, snapshotHash, requiresPaidGeneration: aiPrompt !== null };
}
