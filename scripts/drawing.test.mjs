import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrawing } from '../docs/cabane/chiffres/drawing.mjs';
test('multi-stroke input cancels stale recognition, ignores other fingers, and reset cancels work', t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const handlers = {}, captures = new Set(); let starts=0, idle=0, resets=0, moves=0;
  const canvas = {
    width:280,height:280,
    getContext:()=>({beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){moves++;},stroke(){},clearRect(){},getImageData(){return 'image';}}),
    getBoundingClientRect:()=>({left:0,top:0,width:140,height:140}),
    addEventListener:(name,fn)=>handlers[name]=fn,
    setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id),
  };
  const drawing=createDrawing(canvas,{onStart:()=>starts++,onIdle:()=>idle++,onReset:()=>resets++});
  const event={pointerId:1,isPrimary:true,button:0,clientX:40,clientY:50,preventDefault(){}};
  handlers.pointerdown(event); handlers.pointerdown({...event,pointerId:2,isPrimary:false}); assert.equal(starts,1);
  handlers.pointermove({...event,getCoalescedEvents:()=>[]}); assert.equal(moves,1);
  handlers.pointerup(event); t.mock.timers.tick(300); assert.equal(idle,0);
  handlers.pointerdown(event); t.mock.timers.tick(500); assert.equal(idle,0);
  handlers.pointerup(event); t.mock.timers.tick(450); assert.equal(idle,1);
  drawing.scheduleRecognition(); drawing.reset(); t.mock.timers.tick(500); assert.equal(idle,1); assert.equal(resets,1);
  handlers.pointerdown(event); drawing.setEnabled(false); handlers.pointerup(event); t.mock.timers.tick(500); assert.equal(idle,1);
  handlers.pointerdown(event); assert.equal(starts,3);
});
