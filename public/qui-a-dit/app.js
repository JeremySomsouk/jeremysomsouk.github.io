import {validateEdition, assign, evaluate, shuffle} from './engine.js';
const app=document.querySelector('#political-app');
let edition, roundIndex=0, matches={}, selected=null, revealed=false, results=[], order=[];
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action,cls)=>{const n=el('button',text,cls);n.type='button';n.onclick=action;return n;};
const speaker=id=>edition.speakers.find(s=>s.id===id);
function announce(text){document.querySelector('#political-status').textContent=text;}
function start(){roundIndex=0;results=[];prepare();}
function prepare(){matches={};selected=null;revealed=false;order=shuffle(edition.rounds[roundIndex].statements);render();}
function match(q,s){if(revealed)return;matches=assign(matches,q,s);selected=null;render();announce('Association enregistrée.');}
function render(){
 app.replaceChildren();const r=edition.rounds[roundIndex];
 app.append(el('p',`MANCHE ${roundIndex+1} / ${edition.rounds.length}`,'eyebrow'),el('h2',r.topic));
 app.append(el('p',revealed?'Découvrez les auteurs et le contexte.':'Sélectionnez une déclaration, puis son auteur. Vous pouvez aussi la faire glisser.','instruction'));
 const grid=el('div',undefined,'board'),quotes=el('section'),people=el('section');quotes.setAttribute('aria-label','Déclarations');people.setAttribute('aria-label','Auteurs');
 for(const q of order){
  const card=el('article',undefined,'quote');
  if(revealed){const ok=matches[q.id]===q.speakerId;card.classList.add(ok?'correct':'incorrect');card.append(el('p',q.text),el('strong',`${ok?'✓':'✕'} ${speaker(q.speakerId).name}`));if(!ok)card.append(el('p',`Votre réponse : ${speaker(matches[q.id]).name}`));const details=el('details'),summary=el('summary','Source et contexte');details.append(summary,el('p',q.source.context),el('p',q.source.date||'Démonstration fictive'));if(q.source.url){const a=el('a',q.source.title);a.href=q.source.url;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}else details.append(el('p',q.source.title));card.append(details);}
  else {const pick=button(q.text,()=>{selected=q.id;render();announce('Déclaration sélectionnée. Choisissez un auteur.');},'quote-pick');pick.setAttribute('aria-pressed',String(selected===q.id));pick.draggable=true;pick.ondragstart=e=>{selected=q.id;e.dataTransfer.setData('text/plain',q.id);};card.append(pick);if(matches[q.id])card.append(button(`${speaker(matches[q.id]).name} · Retirer`,()=>{matches=assign(matches,q.id,null);render();} ,'assignment'));}
  quotes.append(card);
 }
 for(const s of edition.speakers){const q=r.statements.find(q=>matches[q.id]===s.id);const b=button(s.name,()=>{if(selected)match(selected,s.id);},'person');b.disabled=revealed;b.setAttribute('aria-disabled',String(!selected));b.append(el('span',q?'Déclaration associée':'À associer'));b.ondragover=e=>{if(!revealed)e.preventDefault();};b.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(r.statements.some(q=>q.id===id))match(id,s.id);};people.append(b);}
 grid.append(quotes,people);app.append(grid);
 if(!revealed){const reveal=button('Révéler les auteurs',()=>{try{const scores=evaluate(r,edition.speakers,matches);results.push(scores);revealed=true;render();announce(`${scores.filter(x=>x.correct).length} bonnes réponses sur ${scores.length}.`);}catch(e){announce(e.message);}},'primary');reveal.disabled=Object.keys(matches).length!==r.statements.length;app.append(el('p',`${Object.keys(matches).length} / ${r.statements.length} déclarations associées`),reveal);}
 else app.append(button(roundIndex+1===edition.rounds.length?'Voir mon résultat':'Manche suivante',()=>{if(++roundIndex===edition.rounds.length)finish();else prepare();},'primary'));
 app.querySelector('h2').tabIndex=-1;app.querySelector('h2').focus();
}
function finish(){
 const score=results.flat().filter(x=>x.correct).length,total=results.flat().length;
 app.replaceChildren(el('p','ÉDITION TERMINÉE','eyebrow'),el('h2',`${score} / ${total}`),el('p','Vous avez retrouvé les auteurs de ces déclarations. Ce score ne mesure pas vos préférences politiques.'));
 results.forEach((scores,i)=>app.append(el('p',`${edition.rounds[i].topic} : ${scores.filter(s=>s.correct).length} / ${scores.length}`)));
 app.append(button('Copier mon résultat',async()=>{try{await navigator.clipboard.writeText(`Qui a dit ? · ${edition.title} · ${score}/${total}${edition.demo?' · Déclarations fictives':''}\n${location.origin}${location.pathname}`);announce('Résultat copié.');}catch{announce('Copie indisponible. Votre score : '+score+'/'+total);}}),button('Rejouer',start,'primary'));
}
try {const response=await fetch('./edition.json');if(!response.ok)throw new Error('Édition indisponible');edition=validateEdition(await response.json());start();}
catch(error){app.replaceChildren(el('h2','Impossible de charger cette édition'),el('p',error.message),button('Réessayer',()=>location.reload()));}
