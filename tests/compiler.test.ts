import test from 'node:test';
import assert from 'node:assert/strict';
import { compileScene } from '../packages/prompt-compiler/src/index.ts';
import { validateProjectDuration } from '../packages/contracts/src/scene.ts';
import { example } from '../examples/end-card.ts';
const fresh = () => structuredClone(example);
test('approved end card produces 66-frame manifest with no AI charge',()=>{
  const r=compileScene(fresh()); assert.equal(r.manifest.durationFrames,66);
  assert.equal(r.aiPrompt,null);assert.equal(r.requiresPaidGeneration,false);
});
test('CTA replacement retains layout and motion; compilation does not mutate source',()=>{
  const a=fresh(), before=structuredClone(a), r1=compileScene(a);
  assert.deepEqual(a,before);const b=fresh();b.cta='Start creating';const r2=compileScene(b);
  assert.deepEqual(r1.manifest.timeline,r2.manifest.timeline);
  assert.deepEqual(r1.manifest.layers.logo,r2.manifest.layers.logo);
  assert.notEqual(r1.snapshotHash,r2.snapshotHash);
});
test('manifest is detached from future mutable request changes',()=>{
  const a=fresh();const r=compileScene(a);a.blueprint.timeline[0].opacity=1;a.brand.colors.primary='#FFFFFF';
  assert.equal(r.manifest.timeline[0].opacity,0);assert.equal(r.manifest.colors.primary,'#00C889');
});
test('stale continuity blocks preparation',()=>{
  const a=fresh();a.continuity.version=2;assert.throws(()=>compileScene(a),/stale/);
});
test('changing brand without updating preceding frame is rejected',()=>{
  const a=fresh();a.continuity.brandId='other';assert.throws(()=>compileScene(a),/brand mismatch/);
});
test('cross-brand assets are rejected',()=>{
  const a=fresh();a.assets[0].brandId='other';assert.throws(()=>compileScene(a),/another brand/);
});
test('flattened background with baked brand is rejected',()=>{
  const a=fresh();a.continuity.cleanBackground=false;assert.throws(()=>compileScene(a),/clean background/);
});
test('unresolved placeholders and missing font are rejected',()=>{
  const a=fresh();a.cta='{{CTA}}';assert.throws(()=>compileScene(a),/placeholders/);
  const b=fresh();b.assets=b.assets.filter(x=>x.kind!=='font');assert.throws(()=>compileScene(b),/Missing font/);
});
test('invalid timing and final state are rejected',()=>{
  const a=fresh();a.blueprint.timeline[2].frame=3;assert.throws(()=>compileScene(a),/ordered/);
  const b=fresh();b.blueprint.timeline[3].opacity=0;assert.throws(()=>compileScene(b),/visible CTA/);
});
test('whole project, not just each scene, stays under one minute',()=>{
  const a=fresh().blueprint;a.durationFrames=900;
  assert.throws(()=>validateProjectDuration([a,a]),/under 60/);
  a.durationFrames=899;assert.doesNotThrow(()=>validateProjectDuration([a,a]));
});
test('hybrid background prompt excludes literal brand and CTA',()=>{
  const a=fresh();a.blueprint.mode='hybrid';const r=compileScene(a);
  assert.equal(r.requiresPaidGeneration,true);assert.ok(r.aiPrompt);
  assert.ok(!r.aiPrompt.includes(a.brand.name));assert.ok(!r.aiPrompt.includes(a.cta));
});
test('compilation is deterministic',()=>{
  assert.deepEqual(compileScene(fresh()),compileScene(fresh()));
});
