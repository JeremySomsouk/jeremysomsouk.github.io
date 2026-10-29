import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateEdition,assign,evaluate,shuffle} from '../public/qui-a-dit/engine.js';
const edition=JSON.parse(await readFile(new URL('../public/qui-a-dit/edition.json',import.meta.url)));
test('demo is valid; real editions require sources',()=>{validateEdition(edition);assert.throws(()=>validateEdition({...edition,demo:false}));const invalid=structuredClone(edition);invalid.rounds[0].statements[1].speakerId=invalid.rounds[0].statements[0].speakerId;assert.throws(()=>validateEdition(invalid));});
test('reassignment preserves one-to-one matching and does not mutate input',()=>{const original={q1:'a',q2:'b'};assert.deepEqual(assign(original,'q1','b'),{q1:'b'});assert.deepEqual(original,{q1:'a',q2:'b'});assert.deepEqual(assign(original,'q1',null),{q2:'b'});});
test('partial and duplicate submissions rejected; scoring exact',()=>{const r=edition.rounds[0];assert.throws(()=>evaluate(r,edition.speakers,{}));const perfect=Object.fromEntries(r.statements.map(q=>[q.id,q.speakerId]));assert.equal(evaluate(r,edition.speakers,perfect).filter(x=>x.correct).length,4);perfect[r.statements[0].id]=perfect[r.statements[1].id];assert.throws(()=>evaluate(r,edition.speakers,perfect));});
test('all demo rounds score independently and shuffle preserves content',()=>{for(const r of edition.rounds){const wrong=Object.fromEntries(r.statements.map((q,i)=>[q.id,r.statements[(i+1)%4].speakerId]));assert.equal(evaluate(r,edition.speakers,wrong).filter(x=>x.correct).length,0);assert.deepEqual(new Set(shuffle(r.statements,()=>0)),new Set(r.statements));}});
