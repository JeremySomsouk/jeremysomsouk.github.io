import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { Room } from './engine.mjs';

test('participant controller waits, preserves private drafts, guesses and restores reveal', async () => {
  const dom = new JSDOM('<div id="guess-app"></div><p id="guess-error"></p><p id="guess-connection"></p>', { url: 'http://localhost/guessr/', runScripts: 'outside-only' });
  const w = dom.window; w.matchMedia = () => ({ matches: false }); w.cancelAnimationFrame = () => {}; w.requestAnimationFrame = () => 1;
  w.HTMLElement.prototype.setPointerCapture = () => {}; w.HTMLElement.prototype.releasePointerCapture = () => {};
  let pointerTarget=null; w.document.elementFromPoint = () => pointerTarget;
  const pointer=(node,type,props={})=> { const event=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:1,pointerType:'touch',button:0,clientX:10,clientY:20,...props});node.dispatchEvent(event); };
  let room, connection;
  class MockTransport {
    constructor(onEvent) { this.onEvent=onEvent; connection=this; }
    connect(intent) {
      room=new Room('K9F4',intent.name,intent.questions);
      this.token=room.players[0].token;
      this.onEvent({type:'welcome',code:room.code,playerToken:this.token,hostToken:room.hostToken}); this.emit();
    }
    emit() { this.onEvent({type:'state',state:room.view(this.token)}); }
    send(intent) { room.command(this.token,room.hostToken,intent); this.emit(); }
    close() {}
  }
  w.transportClass=MockTransport; w.available=true;
  const source=(await readFile(new URL('../../public/guessr/game.js',import.meta.url),'utf8')).replace(/^import .*;\n/, '');
  const click = label => {
    const button=[...w.document.querySelectorAll('button')].find(b=>b.textContent===label);
    assert.ok(button,`Missing button ${label}`); button.click();
  };
  const type = (selector, value) => { const node=w.document.querySelector(selector); node.value=value; node.dispatchEvent(new w.Event('input',{bubbles:true})); };
  const command=(p,type,more)=>room.command(p.token,null,{type,questionId:room.questions[room.current].id,...more});
  try {
    w.eval(source); type('#host-name','Host');
    click('+ Add question'); assert.equal(w.document.querySelector('#host-name').value,'Host');
    type('#question-1','What is your talent?');
    assert.ok([...w.document.querySelector('#timer-1').options].some(o=>o.value==='15'));
    const timer=w.document.querySelector('#timer-1'); timer.value=''; timer.dispatchEvent(new w.Event('change')); assert.equal(w.document.querySelector('#custom-1'),null);
    click('Create room'); assert.equal(room.phase,'Lobby'); assert.equal(room.questions[1].seconds,null);
    assert.ok([...w.document.querySelectorAll('button')].find(b=>b.textContent==='Start game').disabled);
    room.join('Alice');room.join('Bob'); connection.emit();
    assert.equal(room.phase,'Lobby'); assert.ok(!w.document.body.textContent.includes('null'));
    connection.token=room.players[1].token;connection.emit();assert.ok(!w.document.body.textContent.includes('null'));
    connection.token=room.players[0].token;connection.emit();click('Start game');
    assert.ok(!w.document.body.textContent.includes('null'));
    type('#your-answer','<script>private</script>');
    const answer=w.document.querySelector('#your-answer'); answer.focus(); answer.setSelectionRange(4,4);
    command(room.players[1],'submit_answer',{text:'Other private answer'});connection.emit();
    assert.equal(w.document.querySelector('#your-answer').value,'<script>private</script>'); assert.equal(w.document.activeElement.id,'your-answer');
    assert.ok(!w.document.body.textContent.includes('Other private answer'));
    click('Submit answer'); assert.equal(room.answers.length,2);
    command(room.players[2],'submit_answer',{text:'Third answer'});connection.emit();
    assert.equal(room.phase,'Guessing'); assert.equal(w.document.querySelectorAll('script').length,0);
    const [first,second]=room.answers;
    const slot=id=>w.document.querySelector(`[data-answer-id="${id}"]`);
    const chipOwner=id=>slot(id).querySelector('[data-player-id]')?.dataset.playerId;
    let chip=w.document.getElementById(`name-${first.owner}`);
    pointerTarget=slot(first.id);pointer(chip,'pointerdown');pointer(chip,'pointermove',{clientX:50,clientY:50});
    assert.equal(w.document.querySelectorAll('.guess-drag-ghost').length,1);
    pointer(chip,'pointerup',{clientX:50,clientY:50});assert.equal(chipOwner(first.id),first.owner);
    w.document.getElementById(`name-${second.owner}`).click();w.document.getElementById(`match-${second.id}`).click();
    chip=w.document.getElementById(`name-${first.owner}`);pointerTarget=slot(second.id);
    pointer(chip,'pointerdown');pointer(chip,'pointermove',{clientX:50,clientY:50});pointer(chip,'pointerup',{clientX:50,clientY:50});
    assert.equal(chipOwner(first.id),second.owner);assert.equal(chipOwner(second.id),first.owner);
    chip=w.document.getElementById(`name-${first.owner}`);pointer(chip,'pointerdown');pointer(chip,'pointermove',{clientX:50,clientY:50});
    pointer(chip,'pointercancel',{pointerId:2});assert.ok(w.document.querySelector('.guess-drag-ghost'));
    pointer(chip,'pointercancel');assert.ok(!w.document.querySelector('.guess-drag-ghost'));assert.equal(chipOwner(second.id),first.owner);
    chip=w.document.getElementById(`name-${first.owner}`);pointerTarget=null;
    pointer(chip,'pointerdown');pointer(chip,'pointermove',{clientX:50,clientY:50});pointer(chip,'pointerup',{clientX:50,clientY:50});assert.equal(chipOwner(second.id),first.owner);
    // Clear the test swaps, then submit a complete mapping using keyboard/tap controls.
    for(const remove of [...w.document.querySelectorAll('.guess-unmatch')])remove.click();
    for(const a of room.answers) {
      w.document.getElementById(`name-${a.owner}`).click();
      w.document.getElementById(`match-${a.id}`).click();
    }
    click('Submit my guesses');assert.ok(w.document.body.textContent.includes('Guesses submitted'));
    for(const p of room.players.slice(1)) command(p,'submit_guesses',{assignments:room.answers.map(a=>({answerId:a.id,playerId:a.owner}))});connection.emit();
    assert.equal(room.phase,'Revealing');
    click('Reveal next answer');click('Reveal next answer');assert.ok(w.document.body.textContent.includes('Overall'));
    connection.emit();assert.equal(w.document.querySelectorAll('.guess-reveal').length,3);
    click('Finish round');click('Next question');assert.equal(room.current,1);assert.equal(room.deadline,null);
    assert.ok(w.document.querySelector('#guess-clock').textContent.includes('No timer'));
  } finally { dom.window.close(); }
});
