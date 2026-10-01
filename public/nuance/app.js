import { copy, phrase } from './copy.js';
import { SESSION_KEY, LANGUAGE_KEY, freshSession, readSession, saveSession, burnSession, exportPage } from './storage.js';
import { openEngine } from './engine.js';

const $ = id => document.getElementById(id);
const app = $('nuance-app');
let lang = 'en', session = freshSession(), analyze, active = false, burning = false, blocked = false, storageFailed = false;
const t = () => copy[lang];
// User writing is always inserted as text, never interpreted as markup.
function el(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text !== null) node.textContent = text;
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
function button(text, action, className = '') {
  const b = el('button', text, { type: 'button', class: className }); b.addEventListener('click', action); return b;
}
function status(text) { $('nuance-status').textContent = text; }
function persist() {
  if (burning || blocked) return;
  try { saveSession(localStorage, session); storageFailed = false; status(t().saved); }
  catch { storageFailed = true; status(t().saveError); }
}
function move(stage) { session.stage = stage; persist(); render(); }
function heading(text, hint) {
  const h = el('h2', text, { tabindex: '-1', id: 'nuance-section-title' });
  app.append(h); if (hint) app.append(el('p', hint, { class: 'nuance-hint' })); return h;
}
function actions(...buttons) { const row = el('div', null, { class: 'nuance-actions' }); row.append(...buttons); app.append(row); }
function textarea(label, field, max, rows) {
  const id = `nuance-${field}`; const input = el('textarea', null, { id, maxlength: max, rows, spellcheck: 'true' });
  input.value = session[field]; input.addEventListener('input', () => { session[field] = input.value; persist(); });
  app.append(el('label', label, { for: id, class: 'nuance-writing-label' }),input); return input;
}
function chrome() {
  document.documentElement.lang = lang;
  document.title = `Nuance — ${t().tagline}`;
  $('nuance-home').textContent = t().home; $('nuance-eyebrow').textContent = t().eyebrow;
  $('nuance-tagline').textContent = t().tagline; $('nuance-privacy').textContent = t().privacy;
  $('nuance-language').setAttribute('aria-label', t().language);
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  for (const [id, key] of Object.entries({ 'nuance-burn':'burn', 'nuance-confirm-title':'burnTitle', 'nuance-confirm-copy':'burnCopy', 'nuance-keep':'keep', 'nuance-destroy':'destroy' })) $(id).textContent = t()[key];
  $('nuance-burn').hidden = !active && !blocked;
}
function crumbs() {
  const nav = el('nav',null,{ 'aria-label': t().progress, class: 'nuance-crumbs' });
  t().stages.forEach((name,i) => {
    const b=button(name,() => move(i)); b.disabled = i > session.stage;
    if (i === session.stage) b.setAttribute('aria-current','step'); nav.append(b);
  }); app.append(nav);
}
function render(focus = true) {
  chrome(); app.replaceChildren();
  if (blocked) { heading(t().loadError); return; }
  if (!active) {
    heading(t().intro); app.append(el('p',t().introBody,{class:'nuance-intro'}),el('p',t().duration,{class:'nuance-hint'}));
    actions(button(t().begin,() => { active=true; persist(); render(); },'nuance-primary'));
  } else {
    crumbs();
    switch (session.stage) {
      case 0: {
        heading(t().question,t().questionHint); const input=textarea(t().question,'question',2000,5);
        const examples=el('details',null); examples.append(el('summary',t().examples),el('p',t().examplesText)); app.append(examples);
        actions(button(t().next,() => { if (!session.question.trim()) { status(t().required); input.focus(); return; } move(1); },'nuance-primary')); break;
      }
      case 1: collection('criteria',7,3); break;
      case 2: comparison(null); break;
      case 3: collection('options',4,2); break;
      case 4: comparison('tradeoff'); break;
      case 5: reflection(); break;
    }
  }
  if (storageFailed) status(t().saveError);
  if (focus) app.querySelector('h2')?.focus({ preventScroll: true });
}
function collection(field,max,min) {
  const isCriteria = field === 'criteria'; heading(isCriteria?t().matters:t().possibilities,isCriteria?t().mattersHint:t().possibilitiesHint);
  const list=el('ul',null,{class:'nuance-fragments'});
  session[field].forEach((value,i) => {
    const li=el('li',null,{class:'nuance-fragment'}); li.append(el('span',value),button('×',() => {
      session[field].splice(i,1);
      // A label's index changed: never retain answers about a different thought.
      session.comparisons = isCriteria ? [] : session.comparisons.filter(c => c.criterion === null);
      persist(); render(false); $('nuance-item').focus();
    },'nuance-remove'));
    li.lastChild.setAttribute('aria-label',`${t().remove}: ${value}`); list.append(li);
  }); app.append(list);
  const form=el('form',null,{class:'nuance-add'}),label=el('label',isCriteria?t().criterion:t().option,{for:'nuance-item'}),input=el('input',null,{id:'nuance-item',maxlength:80,autocomplete:'off'});
  form.append(label,input,el('button',t().add,{type:'submit'}));
  form.addEventListener('submit',event => {
    event.preventDefault(); const value=input.value.trim();
    if (!value) { status(t().required); input.focus(); return; }
    if (session[field].some(v => v.toLocaleLowerCase() === value.toLocaleLowerCase())) { status(t().duplicate); return; }
    if (session[field].length>=max) { status(t().limit); return; }
    session[field].push(value);
    if (!isCriteria) session.comparisons=session.comparisons.filter(c=>c.criterion===null);
    persist(); render(false); $('nuance-item').focus();
  }); app.append(form);
  if (isCriteria) app.append(el('p',t().criterionExamples,{class:'nuance-hint'}));
  const next=button(t().next,()=>move(isCriteria?2:4),'nuance-primary'); next.disabled=session[field].length<min;
  actions(button(t().back,()=>move(isCriteria?0:2)),next);
}
function comparison(kind) {
  const data=analyze(session),pair=kind===null?data.priority:data.tradeoff;
  if (!pair) {
    heading(t().comparisonDone);
    actions(button(t().back,()=>move(kind===null?1:3)),button(t().undo,()=>{
      const last=session.comparisons.findLastIndex(c=>kind===null?c.criterion===null:c.criterion!==null);
      if(last>=0)session.comparisons.splice(last,1);persist();render();
    }),button(kind===null?t().next:t().reflect,()=>move(kind===null?3:5),'nuance-primary'));
    return;
  }
  const labels=kind===null?session.criteria:session.options;
  heading(kind===null?t().priority:phrase(t().tradeoff,{value:session.criteria[pair.criterion]}),kind===null?t().priorityHint:t().tradeoffHint);
  const choose=answer=>{ session.comparisons.push({...pair,answer}); persist(); render(false); app.querySelector('h2')?.focus({preventScroll:true}); };
  const pairArea=el('div',null,{class:'nuance-pair'});
  pairArea.append(button(labels[pair.left],()=>choose('left'),'nuance-choice'),el('span',t().versus,{class:'nuance-or'}),button(labels[pair.right],()=>choose('right'),'nuance-choice'));
  app.append(pairArea);
  actions(button(t().same,()=>choose('equal')),button(t().unknown,()=>choose('unknown')));
  const undo=button(t().undo,()=>{
    const last=session.comparisons.findLastIndex(c=>kind===null?c.criterion===null:c.criterion!==null);
    if(last>=0)session.comparisons.splice(last,1); persist(); render();
  }); undo.disabled=!session.comparisons.some(c=>kind===null?c.criterion===null:c.criterion!==null);
  actions(button(t().back,()=>move(kind===null?1:3)),undo,button(t().skip,()=>move(kind===null?3:5)));
}
function observations(r) {
  const lines=[r.priorities.length?phrase(t().strong,{values:r.priorities.map(i=>session.criteria[i]).join(', ')}):t().noStrong];
  if(r.contradictory)lines.push(t().contradiction);
  if(r.uncertainty)lines.push(phrase(t().uncertainty,{count:r.uncertainty}));
  if(r.unexamined_priorities)lines.push(phrase(t().unexaminedPriority,{count:r.unexamined_priorities}));
  const expressed=r.affinities.filter(a=>a.protected.length===1);
  const first=expressed[0],second=first&&expressed.find(a=>a.protected[0]!==first.protected[0]);
  if(second)lines.push(phrase(t().tradeoffObservation,{a:session.options[first.protected[0]],x:session.criteria[first.criterion],b:session.options[second.protected[0]],y:session.criteria[second.criterion]}));
  return lines;
}
function affinityText(a) {
  const lines=a.protected.map(i=>phrase(t().protects,{option:session.options[i],value:session.criteria[a.criterion]}));
  for(const [pairs,key] of [[a.equal,'equalPair'],[a.uncertain,'unknownPair'],[a.unexamined,'unseen']]) {
    pairs.forEach(([i,j])=>lines.push(phrase(t()[key],{a:session.options[i],b:session.options[j]})));
  }
  if(a.contradictory)lines.push(t().affinityCycle);
  if(!lines.length)lines.push(t().noAffinity); return lines;
}
function constellation(r) {
  // Each priority is its own small constellation: it stacks naturally on a phone.
  const map=el('div',null,{class:'nuance-constellation','aria-label':t().mapLabel});
  r.affinities.forEach(a=>{
    const article=el('article',null,{class:'nuance-thread'}),h=el('h3',session.criteria[a.criterion]); article.append(h);
    const nodes=el('ul',null,{class:'nuance-option-nodes'});
    session.options.forEach((option,i)=>{
      const uncertain=a.uncertain.some(p=>p.includes(i)); const equal=a.equal.some(p=>p.includes(i));
      const node=el('li',option,{class:`nuance-node ${a.protected.includes(i)?'expressed':uncertain?'uncertain':equal?'equal':'open'}`}); nodes.append(node);
    }); article.append(nodes);
    const detail=el('ul',null,{class:'nuance-annotations'}); affinityText(a).forEach(line=>detail.append(el('li',line))); article.append(detail); map.append(article);
  });return map;
}
function reflection() {
  heading(t().reflection,t().reflectionHint);
  app.append(el('blockquote',session.question,{class:'nuance-question-echo'}));
  const r=analyze(session).reflection,lines=observations(r),notes=el('div',null,{class:'nuance-observations'}); lines.forEach(line=>notes.append(el('p',line))); app.append(notes,constellation(r),el('p',t().mapNote,{class:'nuance-hint'}));
  const prompts=el('aside',null,{class:'nuance-prompts'}); prompts.append(el('p',t().promptOne),el('p',t().promptTwo)); app.append(prompts); textarea(t().note,'note',4000,3);
  actions(button(t().back,()=>move(4)),button(t().export,()=>{
    const all=[...lines,...r.affinities.flatMap(affinityText)];
    const blob=new Blob([exportPage(session,all,t())],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a',null,{href:url,download:'nuance.txt'});
    a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  })); app.append(el('p',t().exportNotice,{class:'nuance-hint'}));
}
$('nuance-burn').addEventListener('click',()=>{ $('nuance-confirm').showModal(); $('nuance-keep').focus(); });
$('nuance-keep').addEventListener('click',()=> $('nuance-confirm').close());
$('nuance-destroy').addEventListener('click',async()=>{
  if(burning)return;
  burning=true;
  // Delete before the visual gesture, with no deferred writes that can resurrect it.
  try { session=burnSession(localStorage); analyze?.clear(); }
  catch { burning=false; $('nuance-confirm').close(); status(t().burnError); return; }
  $('nuance-confirm').close(); app.inert=true; $('nuance-language').inert=true; $('nuance-burn').disabled=true;
  $('nuance-sheet').classList.add('is-burning');
  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?100:650));
  $('nuance-sheet').classList.remove('is-burning'); app.inert=false; $('nuance-language').inert=false; $('nuance-burn').disabled=false;
  active=false; blocked=false; storageFailed=false; burning=false; status(''); render();
});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{
  if(burning)return; lang=b.dataset.lang;
  try { localStorage.setItem(LANGUAGE_KEY,lang); } catch { /* Language still works without storage. */ }
  render(false); status(storageFailed?t().saveError:'');
}));
// Keep two open tabs from resurrecting a page burned elsewhere.
window.addEventListener('storage',event=>{
  if(event.key!==SESSION_KEY && event.key!==null)return;
  if(event.newValue===null){analyze?.clear();session=freshSession();active=false;blocked=false;status('');$('nuance-confirm').close();render();}
  else { try { const incoming=JSON.parse(event.newValue);analyze(incoming);session=incoming;active=true;render(false); }catch {blocked=true;render();} }
});
try { const remembered=localStorage.getItem(LANGUAGE_KEY);lang=remembered==='fr'?'fr':remembered==='en'?'en':navigator.language.startsWith('fr')?'fr':'en'; } catch { lang=navigator.language.startsWith('fr')?'fr':'en'; }
chrome();
try {
  analyze=await openEngine();
  let stored;
  try { stored=readSession(localStorage); }
  catch(error) { if(error instanceof SyntaxError)blocked=true;else storageFailed=true; }
  if(stored) { try { analyze(stored);session=stored;active=true; } catch { blocked=true; } }
  render(false); if(active)status(t().resume);
} catch { app.replaceChildren(el('p',t().engineError)); }
