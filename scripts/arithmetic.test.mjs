import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, readAnswer } from '../docs/cabane/calculs/game.mjs';
import { normalizeDigit } from '../docs/cabane/chiffres/preprocess.mjs';
import { loadRecognizer } from '../docs/cabane/chiffres/recognizer.mjs';
test('rounds obey level bounds, mix operations and include a two-digit level-2 answer', () => {
  for (const level of [1,2]) for (let n=0;n<100;n++) {
    const questions=createRound(level), max=level===1?9:20;
    assert.equal(questions.length,5); assert.equal(new Set(questions.map(q=>`${q.a}${q.operator}${q.b}`)).size,5);
    for(const q of questions) { assert.ok(q.a>=0&&q.a<=max&&q.b>=0&&q.b<=max); assert.ok(q.answer>=0&&q.answer<=max); assert.equal(q.answer,q.operator==='+'?q.a+q.b:q.a-q.b); }
    assert.equal(new Set(questions.map(q=>q.operator)).size,2);
    if(level===2) assert.ok(questions.some(q=>q.answer>=10));
  }
});
test('zero, blank tens, missing units, and two-digit composition',()=>{
  assert.equal(readAnswer([null],1),null); assert.equal(readAnswer([0],1),0);
  assert.equal(readAnswer([null,null],2),null); assert.equal(readAnswer([1,null],2),null);
  assert.equal(readAnswer([null,5],2),5); assert.equal(readAnswer([1,2],2),12); assert.equal(readAnswer([2,0],2),20);
  assert.equal(readAnswer([0,0],2),0); assert.equal(readAnswer([1,NaN],2),null);
});
function image(strokes, offset=0, scale=1) {
  const data=new Uint8ClampedArray(160*160*4);
  for(const stroke of strokes) for(let i=1;i<stroke.length;i++) {
    const [ax,ay]=stroke[i-1],[bx,by]=stroke[i];
    for(let j=0;j<=200;j++) {
      const x=(ax+(bx-ax)*j/200)*scale+offset,y=(ay+(by-ay)*j/200)*scale+offset;
      for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++) { const px=Math.round(x+dx),py=Math.round(y+dy); if(px>=0&&px<160&&py>=0&&py<160) data[(py*160+px)*4+3]=255; }
    }
  }
  return {width:160,height:160,data};
}
test('blank ink is rejected and translated/scaled strokes remain centered',()=>{
  assert.equal(normalizeDigit(image([])),null);
  for(const [offset,scale] of [[0,1],[30,0.7]]) {
    const {pixels}=normalizeDigit(image([[[50,15],[50,90]]],offset,scale));
    let cx=0,cy=0,m=0; pixels.forEach((v,i)=>{m+=v;cx+=i%28*v;cy+=Math.floor(i/28)*v;});
    assert.ok(Math.abs(cx/m-13.5)<=0.6&&Math.abs(cy/m-13.5)<=0.6);
  }
});
test('independent simple 0, 1 and 7 strokes classify across size and position',async()=>{
  const model=await loadRecognizer();
  const fixtures=[{digit:0,strokes:[Array.from({length:65},(_,i)=>[50+25*Math.cos(i*Math.PI/32),50+38*Math.sin(i*Math.PI/32)])]},{digit:1,strokes:[[[50,15],[50,90]]]},{digit:7,strokes:[[[20,15],[80,15],[40,90]]]}];
  for(const {digit,strokes} of fixtures) for(const [offset,scale] of [[0,1],[30,0.7]]) assert.equal(model.predict(normalizeDigit(image(strokes,offset,scale)).pixels).digit,digit);
});
