import { normalizeDigit } from './preprocess.mjs';
// Handwritten-style stroke templates, not a trained model. Scores are similarities,
// not calibrated probabilities. Normalize templates and input identically.
const paths = [
  [[[50,10],[28,15],[20,40],[22,70],[35,88],[58,90],[75,70],[78,35],[65,13],[50,10]]],
  [[[50,10],[50,90]]],
  [[[20,28],[30,12],[58,10],[77,24],[73,40],[22,88],[80,88]]],
  [[[20,15],[55,10],[76,24],[60,45],[42,48],[62,48],[78,65],[66,86],[40,90],[20,80]]],
  [[[65,10],[18,62],[82,62]],[[65,10],[65,90]]],
  [[[78,12],[25,12],[22,48],[49,42],[73,52],[77,72],[60,89],[33,88],[19,78]]],
  [[[72,12],[47,14],[25,44],[20,70],[35,89],[58,88],[76,73],[70,52],[49,44],[23,57]]],
  [[[18,12],[80,12],[38,90]]],
  [[[48,10],[25,18],[25,36],[52,50],[76,67],[68,85],[46,91],[23,82],[22,65],[48,49],[71,33],[70,17],[48,10]]],
  [[[75,43],[53,51],[28,43],[23,25],[38,10],[61,12],[77,28],[73,64],[52,90]]],
];
const variants = paths.map((strokes, digit) => [{ digit, strokes }]);
variants[1].push({digit:1,strokes:[[[28,30],[50,10],[50,90]],[[28,90],[73,90]]]});
variants[4].push({digit:4,strokes:[[[25,10],[25,57],[80,57]],[[65,10],[65,90]]]});
variants[7].push({digit:7,strokes:[...paths[7],[[32,49],[65,49]]]});
function raster(strokes, width, slant) {
  const image = { width:112, height:112, data:new Uint8ClampedArray(112*112*4) };
  for (const stroke of strokes) for (let k=1;k<stroke.length;k++) {
    const [ax,ay] = stroke[k-1], [bx,by] = stroke[k];
    const count = Math.ceil(Math.hypot(bx-ax,by-ay)*2);
    for(let j=0;j<=count;j++) {
      const y=ay+(by-ay)*j/count+6, x=ax+(bx-ax)*j/count+6+(y-56)*slant;
      for(let py=Math.max(0,Math.floor(y-width));py<Math.min(112,y+width+1);py++) for(let px=Math.max(0,Math.floor(x-width));px<Math.min(112,x+width+1);px++) {
        if(Math.hypot(px-x,py-y)<=width) image.data[(py*112+px)*4+3]=255;
      }
    }
  }
  return normalizeDigit(image).pixels;
}
function blur(pixels) {
  const out = new Float32Array(784);
  for(let y=0;y<28;y++) for(let x=0;x<28;x++) {
    let sum=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(x+dx>=0&&x+dx<28&&y+dy>=0&&y+dy<28) sum+=pixels[(y+dy)*28+x+dx];
    out[y*28+x]=sum/9;
  }
  return out;
}
export async function loadRecognizer() {
  const templates=variants.flat().flatMap(({digit,strokes}) => [2.5,4.5].flatMap(width => [-0.12,0,0.12].map(slant => ({digit,pixels:blur(raster(strokes,width,slant))}))));
  for (const template of templates) template.norm = Math.hypot(...template.pixels);
  return { predict(pixels) {
    if(!pixels||pixels.length!==784||Array.from(pixels).some(v=>!Number.isFinite(v)||v<0||v>1)) throw new Error('Expected 784 normalized pixels');
    const input=blur(pixels), norm=Math.hypot(...input);
    if(norm<0.01) return {digit:0,confidence:0,confident:false,probabilities:Array(10).fill(0.1)};
    const scores=Array(10).fill(0);
    for(const template of templates) {
      let dot=0; for(let i=0;i<784;i++) dot+=input[i]*template.pixels[i];
      scores[template.digit]=Math.max(scores[template.digit],dot/(norm*template.norm));
    }
    const order=scores.map((score,digit)=>({score,digit})).sort((a,b)=>b.score-a.score);
    const weights=scores.map(s=>Math.exp((s-order[0].score)*12)), total=weights.reduce((a,b)=>a+b,0);
    return {digit:order[0].digit,confidence:order[0].score,confident:order[0].score>0.78&&order[0].score-order[1].score>0.05,probabilities:weights.map(w=>w/total)};
  }};
}
