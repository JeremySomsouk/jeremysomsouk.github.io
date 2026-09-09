// Model weights derived from procedural templates. This module exports weights and biases
// so the TF.js-backed recognizer can be hosted entirely with site assets and requires no
// external model-hosting service. The weights are small: 784*10 floats (≈31 KB).

const SIZE = 28;

function makeEmpty() { return new Float32Array(SIZE * SIZE); }
function forEachPixel(cb) { for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) cb(x, y, y * SIZE + x); }
function gaussian(x, y, cx, cy, sigma) { const dx = x - cx, dy = y - cy; return Math.exp(-(dx*dx + dy*dy)/(2*sigma*sigma)); }
function lineValue(x, y, x0, y0, x1, y1, width) { const lx = x1-x0, ly = y1-y0, l2 = lx*lx + ly*ly; let t=0; if (l2>0) t = ((x-x0)*lx + (y-y0)*ly)/l2; t = Math.max(0, Math.min(1, t)); const px = x0 + t*lx, py = y0 + t*ly; const dx = x-px, dy = y-py; const d2 = dx*dx + dy*dy; return Math.exp(-d2/(2*(width*width))); }

function makeTemplates() {
  const T = [];
  const cx = (SIZE - 1) / 2, cy = (SIZE - 1) / 2;
  // 0
  let t0 = makeEmpty(); forEachPixel((x,y,i)=>{ const dx=(x-cx)/(SIZE*0.45), dy=(y-cy)/(SIZE*0.6); const r=Math.sqrt(dx*dx+dy*dy); t0[i]=Math.max(0,1-Math.abs((r-1)*6)); }); T.push(t0);
  //1
  let t1 = makeEmpty(); forEachPixel((x,y,i)=>{ t1[i]=gaussian(x,y,cx+2,cy,1.5); }); T.push(t1);
  //2
  let t2 = makeEmpty(); forEachPixel((x,y,i)=>{ const v = Math.max(Math.exp(-((y-6)*(y-6))/8)*Math.exp(-((x-cx)*(x-cx))/200), lineValue(x,y,SIZE-5,10,5,18,1.8), Math.exp(-((y-22)*(y-22))/8)*Math.exp(-((x-cx)*(x-cx))/200)); t2[i]=v; }); T.push(t2);
  //3
  let t3 = makeEmpty(); forEachPixel((x,y,i)=>{ const a = Math.hypot(x-(cx+4), y-9); const b = Math.hypot(x-(cx+4), y-19); t3[i] = Math.max(Math.exp(-((a-5)*(a-5))/6), Math.exp(-((b-5)*(b-5))/6)); }); T.push(t3);
  //4
  let t4 = makeEmpty(); forEachPixel((x,y,i)=>{ const v = Math.max(lineValue(x,y,6,6,6,22,1.8), lineValue(x,y,6,14,22,14,1.8), lineValue(x,y,22,6,14,22,1.8)); t4[i]=v; }); T.push(t4);
  //5
  let t5 = makeEmpty(); forEachPixel((x,y,i)=>{ const v = Math.max(Math.exp(-((y-6)*(y-6))/8), lineValue(x,y,6,6,6,14,1.8), Math.exp(-((y-22)*(y-22))/8)); t5[i]=v*Math.exp(-((x-cx-2)*(x-cx-2))/40); }); T.push(t5);
  //6
  let t6 = makeEmpty(); forEachPixel((x,y,i)=>{ const a = Math.hypot(x-(cx+1), y-13); t6[i] = Math.max(Math.exp(-((a-6)*(a-6))/8), lineValue(x,y,18,22,12,16,1.8)); }); T.push(t6);
  //7
  let t7 = makeEmpty(); forEachPixel((x,y,i)=>{ const v = Math.max(Math.exp(-((y-6)*(y-6))/8), lineValue(x,y,6,6,22,22,1.8)); t7[i]=v; }); T.push(t7);
  //8
  let t8 = makeEmpty(); forEachPixel((x,y,i)=>{ const a=Math.hypot(x-(cx-2), y-9); const b=Math.hypot(x-(cx-2), y-19); t8[i]=Math.max(Math.exp(-((a-4)*(a-4))/6), Math.exp(-((b-4)*(b-4))/6)); }); T.push(t8);
  //9
  let t9 = makeEmpty(); forEachPixel((x,y,i)=>{ const a=Math.hypot(x-(cx+1), y-9); t9[i]=Math.max(Math.exp(-((a-5)*(a-5))/8), lineValue(x,y,6,10,12,18,1.8)); }); T.push(t9);
  // normalize
  for (const t of T) { let max=0; for (let i=0;i<t.length;i++) if (t[i]>max) max=t[i]; if (max>0) for (let i=0;i<t.length;i++) t[i] = t[i]/max; }
  return T;
}

const templates = makeTemplates();
// weights matrix shape [784, 10] where column j is template j
const weights = new Float32Array(784 * 10);
for (let t = 0; t < 10; t++) for (let i = 0; i < 784; i++) weights[i * 10 + t] = templates[t][i];
const biases = new Float32Array(10);

export { weights, biases };
