import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist', root), {recursive:true});
await cp(new URL('web', root), new URL('dist', root), {recursive:true});
for (const [source, target] of [
  ['packages/contracts/src/scene.ts','scene.js'],
  ['packages/prompt-compiler/src/content.ts','content.js'],
  ['examples/end-card.ts','example.js']
]) {
  let code = stripTypeScriptTypes(await readFile(new URL(source,root),'utf8'));
  code = code.replaceAll('../../contracts/src/scene.ts','./scene.js');
  await writeFile(new URL(`dist/${target}`,root), code);
}
console.log('Built browser prototype in dist/');
