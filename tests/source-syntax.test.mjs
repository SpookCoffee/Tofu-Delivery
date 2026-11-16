import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
function collect(d){return readdirSync(d,{withFileTypes:true}).flatMap(f=>f.isDirectory()?collect(join(d,f.name)):[join(d,f.name)]).filter(n=>n.endsWith('.js'));}
test('every game JavaScript module parses successfully',()=>{
  const files=collect(new URL('../src/',import.meta.url).pathname);
  assert.ok(files.length>=7);
  for(const file of files)assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',file]),file);
});
