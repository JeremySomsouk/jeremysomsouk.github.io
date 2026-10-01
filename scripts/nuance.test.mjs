import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { copy, phrase } from '../public/nuance/copy.js';
import { SESSION_KEY, LANGUAGE_KEY, freshSession, readSession, saveSession, burnSession, exportPage } from '../public/nuance/storage.js';
import { connectEngine } from '../public/nuance/engine.js';
const storage = () => {
  const map = new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
};
test('both languages have complete copy and matching interpolation fields',()=>{
  assert.deepEqual(Object.keys(copy.en).sort(),Object.keys(copy.fr).sort());
  for (const key of Object.keys(copy.en)) {
    assert.ok(copy.fr[key].length,key);
    if(typeof copy.en[key]==='string')assert.deepEqual(copy.en[key].match(/\{\w+\}/g),copy.fr[key].match(/\{\w+\}/g),key);
  }
  assert.equal(phrase(copy.fr.tradeoff,{value:'la famille'}),'Pour la famille, qu’est-ce qui semble préférable ?');
});
test('one page round trips; burn removes session but keeps language and unrelated data',()=>{
  const s=storage(),page=freshSession();page.question='Private <script> ✎';
  s.setItem(LANGUAGE_KEY,'fr');s.setItem('other','untouched');saveSession(s,page);
  assert.deepEqual(readSession(s),page);assert.deepEqual(burnSession(s),freshSession());
  assert.equal(readSession(s),null);assert.equal(s.getItem(LANGUAGE_KEY),'fr');assert.equal(s.getItem('other'),'untouched');
});
test('burn failures are observable and cannot claim success',()=>{
  const s=storage();saveSession(s,freshSession());s.removeItem=()=>{};assert.throws(()=>burnSession(s));
  s.removeItem=()=>{throw Error('disabled');};assert.throws(()=>burnSession(s));
});
test('readable export includes question, possibilities, observations and margin note',()=>{
  const s={...freshSession(),question:'Move?',criteria:['Family'],options:['Stay','Move'],note:'Think tomorrow.'};
  const text=exportPage(s,['A trade-off remains.'],copy.en);
  for(const v of ['Move?','Family','Stay','A trade-off remains.','Think tomorrow.'])assert.ok(text.includes(v));
});
test('actual Rust/Wasm ABI handles equality, uncertainty, incomplete and hostile sessions',async()=>{
  const bytes=await readFile(new URL('../target/nuance/engine.wasm',import.meta.url));
  const {instance}=await WebAssembly.instantiate(bytes,{});const analyze=connectEngine(instance);
  const privatePage={...freshSession(),question:'unique-private-writing-marker'};
  analyze(privatePage);
  const memoryText=()=>new TextDecoder().decode(new Uint8Array(instance.exports.memory.buffer));
  assert.ok(!memoryText().includes(privatePage.question));analyze.clear();
  assert.ok(!memoryText().includes(privatePage.question));
  assert.deepEqual(analyze(freshSession()).reflection.priorities,[]);
  const s={...freshSession(),criteria:['Time','Family','Freedom'],options:['Stay','Move']};
  const first=analyze(s).priority;s.comparisons.push({...first,answer:'equal'});
  assert.deepEqual(analyze(s).reflection.priorities,[]);
  s.comparisons.push({criterion:0,left:0,right:1,answer:'unknown'});
  assert.equal(analyze(s).reflection.uncertainty,1);
  assert.deepEqual(analyze(s).reflection.affinities[0].uncertain,[[0,1]]);
  assert.throws(()=>analyze({...s,version:99}));
  assert.throws(()=>analyze({...s,comparisons:[{criterion:null,left:99,right:0,answer:'left'}]}));
});
test('browser controller has no outgoing content channel or unsafe HTML insertion',async()=>{
  const sources=await Promise.all(['app.js','storage.js','engine.js'].map(p=>readFile(new URL(`../public/nuance/${p}`,import.meta.url),'utf8')));
  const all=sources.join('\n');
  for(const forbidden of ['innerHTML','sendBeacon','XMLHttpRequest','WebSocket','location.search','history.pushState'])assert.ok(!all.includes(forbidden),forbidden);
  assert.deepEqual(all.match(/fetch\([^\n]+/g),["fetch('./engine.wasm');"]);
  assert.ok(all.includes("window.addEventListener('storage'"));
});
