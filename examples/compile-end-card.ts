import { example } from './end-card.ts';
import { compileScene } from '../packages/prompt-compiler/src/index.ts';
const result = compileScene(example);
console.log(JSON.stringify(result, null, 2));
