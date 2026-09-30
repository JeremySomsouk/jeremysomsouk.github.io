import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { playback } from '../public/ripple/engine.js';

test('playback pauses, steps visible decisions, completes once, and cancels stale searches', () => {
  const events = [{kind:0,node:0},{kind:2,node:0},{kind:1,node:0},{kind:3,node:0},{kind:7,node:0}];
  const applied = []; let finishes=0;
  const player=playback(events,e=>applied.push(e.kind),()=>finishes++);
  player.step(); assert.deepEqual(applied,[0,2,1]); assert.equal(finishes,0);
  player.pause(); player.step(); assert.deepEqual(applied,[0,2,1,3,7]); assert.equal(finishes,1);
  player.play(); player.step(); assert.equal(finishes,1);
  const stale=playback(events,()=>assert.fail('disposed search must not render'),()=>assert.fail());
  stale.dispose(); stale.play(); stale.step();
});
test('reduced motion completes without scheduling animation', () => {
  let count=0,finish=0;
  const p=playback([{kind:1},{kind:3},{kind:7}],()=>count++,()=>finish++,{reduced:true});
  p.play(); assert.equal(count,3); assert.equal(finish,1); assert.equal(p.running,false);
});
test('built Wasm ABI runs the same puzzle, undo, budgets and A* comparison', async () => {
  const bytes=await readFile(new URL('../target/ripple/engine.wasm',import.meta.url));
  const module=await WebAssembly.compile(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module),[]);
  const e=(await WebAssembly.instantiate(module,{})).exports;
  e.init(0,0x7f93a2); const before=e.info(6);
  assert.equal(before,10); assert.equal(e.info(8),0);
  assert.equal(e.change(24,0),1); assert.equal(e.info(6),8); assert.equal(e.info(8),1);
  const dijkstra=e.info(7); e.algorithm(1); assert.equal(e.info(6),8); assert.ok(e.info(7)<=dijkstra);
  e.undo(); assert.equal(e.info(6),before); assert.equal(e.info(5),0);
  e.init(1,0); assert.equal(e.info(6),5); e.change(3,0); assert.equal(e.info(6),3); assert.equal(e.info(8),1);
  assert.equal(e.change(2,0),0); e.reset(); assert.equal(e.info(8),0);
  e.init(0,0); e.change(10,1); e.change(24,1); assert.equal(e.info(6) >>> 0,0xffffffff);
  assert.equal(e.event(e.info(9)-1,0),8);
});

test('guided challenges offer a small choice, preserve edits, then unlock obstacles and free play', async () => {
  const { canEdit, routeEnergy } = await import('../public/ripple/lessons.js');
  const bytes=await readFile(new URL('../target/ripple/engine.wasm',import.meta.url));
  const {instance}=await WebAssembly.instantiate(bytes,{});const e=instance.exports;
  e.init(0,0x7f93a2);
  const snapshot=()=>({start:e.info(1),target:e.info(2),checkpoint:e.info(3),nodes:Array.from({length:e.info(0)},(_,i)=>({cost:e.node(i,0)>>>0,y:e.node(i,2),editable:Boolean(e.node(i,3))}))});
  const original=snapshot();
  assert.deepEqual(original.nodes.map((_,i)=>i).filter(i=>canEdit(original,i,'energy',original)),[10,24]);
  assert.equal(routeEnergy(original,1),10);assert.equal(routeEnergy(original,3),16);
  e.change(24,0);const changed=snapshot();
  assert.ok(canEdit(changed,24,'energy',original));assert.equal(routeEnergy(changed,3),8);assert.equal(e.info(8),1);
  e.reset();assert.equal(canEdit(original,24,'obstacle',original),false);
  assert.ok(canEdit(original,10,'obstacle',original));e.change(10,1);
  assert.equal(routeEnergy(snapshot(),1),null);assert.equal(routeEnergy(snapshot(),3),16);assert.equal(e.info(8),1);
  assert.ok(canEdit(original,24,'free',original));assert.equal(canEdit(original,original.start,'free',original),false);
});
