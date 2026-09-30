import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

class Client {
  constructor(socket) {
    this.socket = socket; this.messages = []; this.waiters = [];
    socket.on('message', raw => {
      const message = JSON.parse(raw);
      this.messages.push(message);
      for (const wake of this.waiters.splice(0)) wake();
    });
  }
  send(message) { this.socket.send(JSON.stringify(message)); }
  async wait(predicate, milliseconds = 4000) {
    const timeout = setTimeout(() => { for (const wake of this.waiters.splice(0)) wake(); }, milliseconds);
    const deadline = Date.now()+milliseconds;
    try {
      while (true) {
        const index = this.messages.findIndex(predicate);
        if (index >= 0) return this.messages.splice(index, 1)[0];
        if (Date.now() >= deadline) throw Error('Timed out waiting for game state');
        await new Promise(resolve => this.waiters.push(resolve));
      }
    } finally { clearTimeout(timeout); }
  }
  state(phase, current) { return this.wait(m => m.type === 'state' && m.state.phase === phase && (current === undefined || m.state.current === current)).then(m => m.state); }
}
test('four real WebSocket clients complete five rounds and reconnect privately', { timeout: 120000 }, async () => {
  const port = 18787;
  const runWorker = globalThis.process.env.GUESS_WORKER_TEST === '1';
  const workerUrl = globalThis.process.env.GUESS_WORKER_TEST_URL ?? (runWorker ? 'ws://127.0.0.1:18788' : null);
  let workerCode = '';
  const process = runWorker ? spawn('node', ['node_modules/wrangler/bin/wrangler.js', 'dev', '--ip', '127.0.0.1', '--port', '18788'], { cwd: new URL('.', import.meta.url), env: { ...globalThis.process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore','pipe','pipe'] }) : workerUrl ? null : spawn('node', ['local.mjs'], { cwd: new URL('.', import.meta.url), env: { ...globalThis.process.env, PORT: String(port) }, stdio: ['ignore','pipe','pipe'] });
  const clients=[];
  try {
    if (process) await new Promise((resolve,reject)=> {
      let output=''; const timeout=setTimeout(()=>reject(Error('Server did not become ready: '+output)),25000);
      process.stdout.on('data',data=> { output+=data; if(output.includes(runWorker ? 'Ready on' : 'Guess locally:')) {clearTimeout(timeout);resolve();} });
      process.stderr.on('data',data=> { output+=data; });
      process.on('exit',code=> {clearTimeout(timeout);reject(Error('Server exited: '+code+' '+output));});
    });
    async function connect() {
      const socket=new WebSocket(workerUrl ? `${workerUrl}/${workerCode ? 'room?room='+workerCode : 'create'}` : `ws://localhost:${port}/api/guess`,{origin:workerUrl ? 'http://localhost:8787' : `http://localhost:${port}`});
      const client=new Client(socket); clients.push(client); await once(socket,'open'); return client;
    }
    let host=await connect();
    host.send({type:'create_room',name:'Host',questions:Array.from({length:5},(_,i)=>({text:`Question ${i+1}?`,seconds:i%2===0?30:null}))});
    const credentials=await host.wait(m=>m.type==='welcome');
    workerCode=credentials.code;
    for(const name of ['Alice','Bob','Sarah']) {
      const client=await connect(); client.send({type:'join_room',code:credentials.code.toLowerCase(),name}); client.credentials=await client.wait(m=>m.type==='welcome');
    }
    for(const client of clients) await client.state('Lobby');
    clients[1].send({type:'start_game'}); assert.match((await clients[1].wait(m=>m.type==='error')).message,/host/);
    host.socket.close(); await once(host.socket,'close');
    const reconnect=await connect(); reconnect.send({type:'join_room',code:credentials.code,playerToken:credentials.playerToken,hostToken:credentials.hostToken});
    await reconnect.wait(m=>m.type==='welcome');
    const lobby=await reconnect.state('Lobby'); assert.equal(lobby.players.length,4); assert.equal(lobby.me,credentials.playerId);
    host=reconnect; host.credentials=credentials; const active=[host,...clients.slice(1,4)];
    async function refresh(index, phase) {
      const old=active[index], credentials=old.credentials; old.socket.close(); await once(old.socket,'close');
      const fresh=await connect(); fresh.credentials=credentials;
      fresh.send({type:'join_room',code:workerCode,playerToken:credentials.playerToken,hostToken:credentials.hostToken});
      await fresh.wait(m=>m.type==='welcome'); const view=await fresh.state(phase);
      assert.equal(view.me,credentials.playerId);assert.equal(view.players.length,4);
      active[index]=fresh; if(index===0)host=fresh; return view;
    }
    host.send({type:'start_game'});
    for(let round=0;round<5;round++) {
      // Exercise normal human pacing within the server's per-socket rate limit.
      await new Promise(resolve => setTimeout(resolve, 1050));
      const states=await Promise.all(active.map(c=>c.state('Answering',round)));
      assert.ok(states.every(s=>s.current===round));
      assert.equal(states[0].deadline===null,round%2===1);
      if(round===0) { const restored=await refresh(0,'Answering');assert.equal(restored.deadline,states[0].deadline); }
      for(let i=0;i<4;i++) {
        active[i].send({type:'submit_answer',questionId:states[i].question.id,text:`Player ${i} round ${round}`});
        if(round===0 && i===0) {
          await active[0].wait(m=>m.type==='state'&&m.state.ownAnswer===`Player 0 round 0`);
          const restored=await refresh(0,'Answering');assert.equal(restored.ownAnswer,'Player 0 round 0');
        }
      }
      const anonymous=await Promise.all(active.map(c=>c.state('Guessing',round)));
      if(round===0) { const restored=await refresh(1,'Guessing');assert.equal(restored.guesses,null);assert.ok(restored.answers.every(a=>!a.owner)); }
      for(let i=0;i<4;i++) {
        assert.ok(anonymous[i].answers.every(a=>!Object.hasOwn(a,'owner')));
        assert.equal(anonymous[i].guesses,null);
        active[i].send({type:'submit_guesses',questionId:states[i].question.id,assignments:anonymous[i].answers.map(a=>({answerId:a.id,playerId:states[Number(a.text.match(/^Player (\d)/)[1])].me}))});
        if(round===0 && i===0) { await active[0].wait(m=>m.type==='state'&&m.state.guesses!==null);const restored=await refresh(0,'Guessing');assert.equal(restored.guesses.length,4); }
      }
      const revealed=await Promise.all(active.map(c=>c.state('Revealing',round)));
      assert.ok(revealed[0].leaderboard.every(p=>p.score===3*(round+1)));
      for(let i=1;i<4;i++) { host.send({type:'advance_reveal',questionId:states[0].question.id}); await host.wait(m=>m.type==='state'&&m.state.current===round&&m.state.revealCount===i+1); }
      host.send({type:'finish_reveal',questionId:states[0].question.id});
      if(round<4) { await host.state('QuestionComplete',round); host.send({type:'next_question',questionId:states[0].question.id}); }
      else { const final=await host.state('Finished'); assert.ok(final.leaderboard.every(p=>p.score===15&&p.rank===1)); }
    }
    // New room: one player times out and still guesses, with only three authors.
    workerCode=''; const timedHost=await connect();
    timedHost.send({type:'create_room',name:'Host',questions:[{text:'Timed question?',seconds:15}]});
    const timedCredentials=await timedHost.wait(m=>m.type==='welcome');workerCode=timedCredentials.code;
    const timedClients=[timedHost];
    for(const name of ['Alice','Bob','Sarah']) {
      const client=await connect();client.send({type:'join_room',code:workerCode,name});await client.wait(m=>m.type==='welcome');timedClients.push(client);
    }
    timedHost.send({type:'start_game'});
    const answering=await Promise.all(timedClients.map(c=>c.state('Answering')));
    for(let i=0;i<3;i++)timedClients[i].send({type:'submit_answer',questionId:answering[i].question.id,text:`Timed player ${i}`});
    const guessing=await Promise.all(timedClients.map(c=>c.wait(m=>m.type==='state'&&m.state.phase==='Guessing',20000).then(m=>m.state)));
    assert.equal(guessing[3].authors.length,3);assert.ok(!guessing[3].authors.includes(answering[3].me));
    timedClients[3].send({type:'submit_answer',questionId:answering[3].question.id,text:'Too late'});
    assert.match((await timedClients[3].wait(m=>m.type==='error')).message,/closed/);
    for(let i=0;i<4;i++)timedClients[i].send({type:'submit_guesses',questionId:answering[i].question.id,assignments:guessing[i].answers.map(a=>({answerId:a.id,playerId:answering[Number(a.text.match(/(\d)$/)[1])].me}))});
    const result=await timedHost.state('Revealing');
    assert.equal(result.leaderboard.find(p=>p.id===answering[3].me).score,3);
    assert.ok(result.leaderboard.filter(p=>p.id!==answering[3].me).every(p=>p.score===2));
  } finally { for(const client of clients) client.socket.terminate(); process?.kill(); }
});
