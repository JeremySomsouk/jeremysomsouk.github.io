import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room, TTL } from './engine.mjs';
import worker, { GuessRoom } from './worker.mjs';

function socket(attachment) {
  return { attachment, messages: [], serializeAttachment(v) { this.attachment=structuredClone(v); }, deserializeAttachment() { return structuredClone(this.attachment); }, send(raw) { this.messages.push(JSON.parse(raw)); }, close() { this.closed=true; } };
}
async function object(data, sockets=[]) {
  const storage = new Map(data ? [['room', structuredClone(data)]] : []);
  const ctx = {
    sockets, getWebSockets() { return this.sockets; },
    blockConcurrencyWhile(fn) { this.ready=fn(); },
    storage: {
      async get(key) { return structuredClone(storage.get(key)); },
      async put(key,value) { storage.set(key,structuredClone(value)); },
      async setAlarm(when) { ctx.alarm=when; },
      async deleteAll() { storage.clear(); }, async deleteAlarm() { ctx.alarm=null; },
    },
  };
  const roomObject=new GuessRoom(ctx); await ctx.ready;
  return { roomObject,ctx,storage };
}
test('Worker only allows configured browser origins and exposes a neutral health check', async () => {
  const env={ ALLOWED_ORIGINS: 'https://www.somsouk.fr,https://somsouk.fr,http://localhost:8787' };
  for(const path of ['/', '/health']) assert.equal((await worker.fetch(new Request('https://api.test'+path),env)).status,200);
  for(const origin of [undefined,'https://evil.test','https://somsouk.fr.evil.test']) {
    const headers={Upgrade:'websocket'};if(origin)headers.Origin=origin;
    assert.equal((await worker.fetch(new Request('https://api.test/create',{headers}),env)).status,403);
  }
  let calls=0;
  env.ROOMS={idFromName:code=>code,get:code=>({fetch:async request=>{calls++; assert.match(code,/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/); assert.equal(request.headers.get('X-Create-Room'),'yes');return new Response('reserved',{status:calls===1?409:200});}})};
  assert.equal((await worker.fetch(new Request('https://api.test/create',{headers:{Upgrade:'websocket',Origin:'https://somsouk.fr'}}),env)).status,200);
  assert.equal(calls,2);
});
test('Durable Object persists private identity, deadlines, answers and guesses through reconstruction', async () => {
  const room=new Room('K9F4','Host',[{text:'First question?',seconds:60},{text:'Next question?',seconds:null}]);
  room.join('Alice');room.join('Bob');
  const host=room.players[0], peer=socket({token:host.token,hostToken:room.hostToken,count:0,window:Date.now()});
  let saved=await object({...room},[peer]);
  await saved.roomObject.webSocketMessage(peer,JSON.stringify({type:'start_game'}));
  const deadline=saved.roomObject.room.deadline;
  const qid=room.questions[0].id;
  await saved.roomObject.webSocketMessage(peer,JSON.stringify({type:'submit_answer',questionId:qid,text:'Private host answer'}));
  saved=await object(saved.storage.get('room'),[peer]);
  assert.equal(saved.roomObject.room.deadline,deadline);
  assert.equal(saved.roomObject.room.players.length,3);
  assert.equal(saved.roomObject.room.player(host.token).id,host.id);
  assert.equal(saved.roomObject.room.answers[0].text,'Private host answer');
  assert.equal(saved.roomObject.room.players[0].connected,true);
  assert.equal(saved.roomObject.room.players[1].connected,false);
  const otherView=saved.roomObject.room.view(room.players[1].token);
  assert.ok(!JSON.stringify(otherView).includes('Private host answer'));
  for(const p of room.players.slice(1)) saved.roomObject.room.command(p.token,null,{type:'submit_answer',questionId:qid,text:p.name});
  saved.roomObject.room.command(host.token,room.hostToken,{type:'submit_guesses',questionId:qid,assignments:saved.roomObject.room.answers.map(a=>({answerId:a.id,playerId:a.owner}))});
  await saved.roomObject.persist();
  saved=await object(saved.storage.get('room'),[peer]);
  assert.equal(saved.roomObject.room.phase,'Guessing');assert.ok(saved.roomObject.room.guesses[host.id]);
  assert.equal(saved.roomObject.room.view(room.players[1].token).guesses,null);
  assert.ok(saved.roomObject.room.view(host.token).answers.every(a=>!Object.hasOwn(a,'owner')));
  for(const p of room.players.slice(1)) saved.roomObject.room.command(p.token,null,{type:'submit_guesses',questionId:qid,assignments:saved.roomObject.room.answers.map(a=>({answerId:a.id,playerId:a.owner}))});
  saved.roomObject.room.command(host.token,room.hostToken,{type:'advance_reveal',questionId:qid});await saved.roomObject.persist();
  saved=await object(saved.storage.get('room'),[peer]);assert.equal(saved.roomObject.room.revealCount,2);assert.ok(saved.roomObject.room.players.every(p=>p.score===2));
});
test('alarms expire answering and clean up old temporary rooms', async () => {
  const room=new Room('K9F4','Host',[{text:'Question?',seconds:15}]);room.join('Alice');room.join('Bob');
  room.startQuestion(Date.now()-16000);
  const peer=socket({token:room.players[0].token});
  const saved=await object({...room},[peer]);await saved.roomObject.alarm();
  assert.equal(saved.roomObject.room.phase,'Revealing');assert.equal(saved.ctx.alarm,room.expiresAt);
  saved.roomObject.room.expiresAt=Date.now()-1;await saved.roomObject.alarm();
  assert.equal(saved.storage.size,0);assert.equal(saved.ctx.alarm,null);assert.ok(peer.closed);
});
test('malformed, oversized and unauthorized websocket commands do not mutate state', async () => {
  const room=new Room('K9F4','Host',[{text:'Question?',seconds:30}]);room.join('Alice');room.join('Bob');
  const peer=socket({token:room.players[1].token,count:0,window:Date.now()});
  const {roomObject}=await object({...room},[peer]);
  for(const raw of ['{broken','x'.repeat(16385),'界'.repeat(6000),JSON.stringify({type:'start_game'})]) await roomObject.webSocketMessage(peer,raw);
  assert.equal(roomObject.room.phase,'Lobby');assert.equal(peer.messages.filter(m=>m.type==='error').length,4);
  for(const message of peer.messages) assert.ok(!JSON.stringify(message).includes(room.hostToken));
});
