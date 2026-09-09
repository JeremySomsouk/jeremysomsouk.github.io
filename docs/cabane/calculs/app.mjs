import { createDrawing } from '../chiffres/drawing.mjs';
import { normalizeDigit } from '../chiffres/preprocess.mjs';
import { createRound, readAnswer } from './game.mjs';
const $ = id => document.getElementById(id);
let recognizer;
let level = 1, round, index = 0, solved = false, pads = [], digits = [], pending = [], uncertain = [];
function updateAnswer() {
  const value = readAnswer(digits, level);
  $('recognized').textContent = value === null ? 'Ta réponse : …' : `Ta réponse : ${value}${uncertain.some(Boolean) ? ' — vérifie les chiffres reconnus.' : ''}`;
  $('validate').disabled = solved || pending.some(Boolean) || value === null;
}
function resetRound() {
  pads.forEach(p => p.drawing.setEnabled(false));
  level = Number($('level').value); round = createRound(level); index = 0;
  $('play').hidden = false; $('complete').hidden = true; showQuestion();
}
function showQuestion() {
  pads.forEach(p => p.drawing.setEnabled(false));
  pads = []; digits = Array(level === 1 ? 1 : 2).fill(null); pending = digits.map(() => false); uncertain = digits.map(() => false); solved = false;
  $('pads').replaceChildren(); $('feedback').textContent = ''; $('next').hidden = true; $('validate').hidden = false;
  const q = round[index];
  $('question').textContent = `${q.a} ${q.operator} ${q.b} = ?`;
  $('progress').textContent = `Niveau ${level} · Calcul ${index + 1} sur 5`; $('bar').value = index;
  $('instructions').textContent = level === 1 ? 'Dessine un chiffre, vérifie sa lecture puis valide.' : 'Un chiffre par case. Pour moins de 10, laisse les dizaines vides.';
  digits.forEach((_, i) => {
    const section = document.createElement('div'); section.className = 'pad';
    const name = level === 1 ? 'Mon chiffre' : i === 0 ? 'Dizaines' : 'Unités';
    section.innerHTML = `<label>${name}</label><canvas width="280" height="280" aria-label="Écrire : ${name}"></canvas><button class="quiet" type="button">Effacer</button><select aria-label="Chiffre reconnu, corriger : ${name}"><option value="">${name} : …</option>${Array.from({length:10},(_,n)=>`<option value="${n}">${n}</option>`).join('')}</select>`;
    $('pads').append(section);
    const select = section.querySelector('select');
    const clear = () => { digits[i] = null; pending[i] = false; uncertain[i] = false; select.value = ''; updateAnswer(); };
    const drawing = createDrawing(section.querySelector('canvas'), {
      onStart() { clear(); pending[i] = true; $('feedback').textContent = ''; updateAnswer(); },
      onReset: clear,
      onIdle() {
        pending[i] = false;
        try {
          const normalized = normalizeDigit(drawing.getImageData());
          if (normalized && recognizer) {
            const prediction = recognizer.predict(normalized.pixels);
            digits[i] = prediction.digit; uncertain[i] = !prediction.confident; select.value = String(prediction.digit);
          } else if (!recognizer) $('feedback').textContent = 'Reconnaissance indisponible. Choisis ton chiffre sous la case.';
        } catch { $('feedback').textContent = 'Tracé non reconnu. Efface ou choisis ton chiffre sous la case.'; }
        updateAnswer();
      },
    });
    select.addEventListener('change', () => { const value = select.value; drawing.reset(); select.value = value; digits[i] = value === '' ? null : Number(value); updateAnswer(); });
    section.querySelector('button').addEventListener('click', () => drawing.reset());
    pads.push({ drawing, section });
  });
  updateAnswer();
}
$('validate').addEventListener('click', () => {
  if ($('validate').disabled || solved) return;
  if (readAnswer(digits, level) !== round[index].answer) { $('feedback').textContent = 'Pas encore. Vérifie le calcul et les chiffres reconnus, puis réessaie.'; return; }
  solved = true; $('feedback').textContent = 'Bravo, tu as trouvé !'; $('bar').value = index + 1;
  pads.forEach(({ drawing, section }) => { drawing.setEnabled(false); section.querySelectorAll('button,select').forEach(el => el.disabled = true); });
  $('validate').hidden = true; $('next').hidden = false; $('next').textContent = index === 4 ? 'Terminer la série →' : 'Calcul suivant →'; $('next').focus();
});
$('next').addEventListener('click', () => {
  if (!solved) return;
  if (++index < round.length) { showQuestion(); $('question').focus(); }
  else { $('play').hidden = true; $('complete').hidden = false; $('summary').textContent = `Tu as résolu les 5 calculs du niveau ${level}.`; $('advance').hidden = level === 2; $('complete').querySelector('h2').focus(); }
});
$('level').addEventListener('change', resetRound);
$('replay').addEventListener('click', resetRound);
$('advance').addEventListener('click', () => { $('level').value = '2'; resetRound(); $('question').focus(); });
resetRound();
try { const { loadRecognizer } = await import('../chiffres/recognizer.mjs'); recognizer = await loadRecognizer(); pads.forEach(p => p.drawing.scheduleRecognition()); }
catch { $('feedback').textContent = 'Reconnaissance indisponible. Tu peux choisir tes chiffres sous les cases.'; }
