
import pathlib

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>The Backrooms — Level 0</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:'Courier New',monospace;user-select:none}
canvas#three{display:block;position:fixed;inset:0}

/* ── vignette ── */
#vignette{
  position:fixed;inset:0;pointer-events:none;z-index:2;transition:opacity .4s;
  background:radial-gradient(ellipse at 50% 50%,transparent 34%,rgba(0,0,0,0.76) 100%);
}

/* ── grain ── */
canvas#grain{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;image-rendering:pixelated}

/* ── hud ── */
#hud{position:fixed;inset:0;pointer-events:none;z-index:4;color:#c8b040}
#xhair{
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);width:14px;height:14px;
}
#xhair::before,#xhair::after{content:'';position:absolute;background:rgba(200,175,60,0.55);border-radius:1px}
#xhair::before{width:2px;height:100%;left:50%;transform:translateX(-50%)}
#xhair::after{height:2px;width:100%;top:50%;transform:translateY(-50%)}
#hud-tr{position:absolute;top:14px;right:16px;font-size:10px;color:rgba(200,175,60,0.3);letter-spacing:.2em}
#hud-bl{position:absolute;bottom:14px;left:16px;font-size:10px;color:rgba(200,175,60,0.38);line-height:1.9}

/* ── main overlay ── */
#overlay{
  position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  background:linear-gradient(160deg,#0c0900,#060400);color:#c8b040;gap:8px;
}
#overlay h1{
  font-size:clamp(28px,5vw,54px);letter-spacing:.4em;text-transform:uppercase;
  text-shadow:0 0 60px rgba(200,176,64,.35);animation:hflk 14s infinite;
}
@keyframes hflk{0%,84%,86%,90%,100%{opacity:1}85%,88%{opacity:.18}}
.sub{font-size:11px;opacity:.4;letter-spacing:.28em;margin-top:4px}
.cgrid{
  margin-top:18px;display:grid;grid-template-columns:auto 1fr;
  gap:5px 22px;font-size:11px;opacity:.42;
}
.cgrid .k{color:#fff;text-align:right}
.enter-btn{
  margin-top:26px;padding:11px 42px;
  border:1px solid rgba(200,176,64,.42);background:transparent;
  color:#c8b040;font-family:inherit;font-size:12px;
  letter-spacing:.26em;cursor:pointer;transition:all .3s;
}
.enter-btn:hover{border-color:#c8b040;background:rgba(200,176,64,.07);box-shadow:0 0 28px rgba(200,176,64,.12)}
.lore{
  margin-top:18px;font-size:10px;color:rgba(200,175,60,.6);
  letter-spacing:.06em;max-width:400px;text-align:center;line-height:1.85;
}

/* ── pause overlay ── */
#pause{
  position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;
  background:rgba(4,3,0,.72);backdrop-filter:blur(8px);
}
.pcard{
  background:#090700;border:1px solid rgba(200,176,64,.18);
  min-width:370px;max-width:420px;width:90%;padding:34px 38px;color:#c8b040;
}
.pcard h2{font-size:20px;letter-spacing:.42em;text-align:center;margin-bottom:26px;text-shadow:0 0 18px rgba(200,176,64,.2)}
.pcard h3{font-size:9px;letter-spacing:.3em;opacity:.35;margin:12px 0 14px;
  border-bottom:1px solid rgba(200,176,64,.07);padding-bottom:7px}
.srow{display:flex;align-items:center;margin-bottom:13px;font-size:10px;letter-spacing:.07em}
.srow .sl{min-width:128px;opacity:.65}
.srow .sv{min-width:30px;text-align:right;opacity:.48;font-size:9px}
.srow input[type=range]{
  flex:1;margin:0 10px;height:2px;background:rgba(200,176,64,.15);
  outline:none;-webkit-appearance:none;border-radius:1px;cursor:pointer;
}
.srow input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:11px;height:11px;
  background:#c8b040;border-radius:50%;cursor:pointer;
}
.trow{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:13px;font-size:10px;letter-spacing:.07em;opacity:.68;
}
.tog{position:relative;width:34px;height:18px;flex-shrink:0;cursor:pointer}
.tog input{opacity:0;width:0;height:0;position:absolute}
.tog-track{
  position:absolute;inset:0;
  background:rgba(200,176,64,.1);border:1px solid rgba(200,176,64,.22);
  border-radius:18px;transition:background .22s;
}
.tog input:checked+.tog-track{background:rgba(200,176,64,.42)}
.tog-track::before{
  content:'';position:absolute;width:12px;height:12px;left:2px;top:2px;
  background:#c8b040;border-radius:50%;transition:transform .18s;
}
.tog input:checked+.tog-track::before{transform:translateX(16px)}
.pbtns{display:flex;gap:10px;margin-top:22px}
.pbtn{
  flex:1;padding:10px;border:1px solid rgba(200,176,64,.28);background:transparent;
  color:#c8b040;font-family:inherit;font-size:10px;letter-spacing:.2em;cursor:pointer;transition:all .22s;
}
.pbtn:hover{background:rgba(200,176,64,.08);border-color:#c8b040}
.pbtn.pri{border-color:rgba(200,176,64,.48)}
</style>
</head>
<body>

<!-- MAIN OVERLAY -->
<div id="overlay">
  <h1>The Backrooms</h1>
  <div class="sub">LEVEL 0 &mdash; THE LOBBY</div>
  <div class="cgrid">
    <span class="k">W A S D</span><span>move</span>
    <span class="k">Mouse</span><span>look</span>
    <span class="k">Shift</span><span>sprint</span>
    <span class="k">ESC</span><span>pause</span>
  </div>
  <button class="enter-btn" id="startBtn">ENTER THE BACKROOMS</button>
  <p class="lore">
    If you're not careful and you noclip out of reality in the wrong areas,<br>
    you'll end up in the Backrooms &mdash; where it smells of moist carpet,<br>
    the mono-yellow walls stretch endlessly, and fluorescent lights hum forever.
  </p>
</div>

<!-- PAUSE OVERLAY -->
<div id="pause">
  <div class="pcard">
    <h2>PAUSED</h2>

    <h3>DISPLAY</h3>
    <div class="srow"><span class="sl">Field of View</span>
      <input type="range" id="sFov" min="60" max="110" value="82">
      <span class="sv" id="vFov">82&deg;</span></div>
    <div class="srow"><span class="sl">Fog Distance</span>
      <input type="range" id="sFog" min="8" max="55" value="30">
      <span class="sv" id="vFog">30m</span></div>

    <h3>CONTROLS</h3>
    <div class="srow"><span class="sl">Mouse Sensitivity</span>
      <input type="range" id="sSens" min="1" max="20" value="5">
      <span class="sv" id="vSens">5</span></div>

    <h3>AUDIO</h3>
    <div class="srow"><span class="sl">Master Volume</span>
      <input type="range" id="sVol" min="0" max="100" value="85">
      <span class="sv" id="vVol">85</span></div>

    <h3>EFFECTS</h3>
    <div class="trow"><span>Film Grain</span>
      <label class="tog"><input type="checkbox" id="tGrain" checked><div class="tog-track"></div></label></div>
    <div class="trow"><span>Vignette</span>
      <label class="tog"><input type="checkbox" id="tVig" checked><div class="tog-track"></div></label></div>
    <div class="trow"><span>Head Bobbing</span>
      <label class="tog"><input type="checkbox" id="tBob" checked><div class="tog-track"></div></label></div>

    <div class="pbtns">
      <button class="pbtn pri" id="resumeBtn">RESUME</button>
      <button class="pbtn" id="menuBtn">MAIN MENU</button>
    </div>
  </div>
</div>

<!-- HUD -->
<div id="hud">
  <div id="xhair"></div>
  <div id="hud-tr">LEVEL 0</div>
  <div id="hud-bl"><div>X <span id="cx">0.0</span></div><div>Z <span id="cz">0.0</span></div></div>
</div>

<!-- Post-process -->
<div id="vignette"></div>
<canvas id="grain" width="320" height="180"></canvas>

<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

/* ═══════════ SETTINGS ═══════════ */
const SET = { fov:82, sensScale:5, volume:0.85, fogFar:30, grain:true, vignette:true, bobbing:true };

/* ═══════════ RENDERER ═══════════ */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.domElement.id = 'three';
document.body.prepend(renderer.domElement);

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x100d00);
scene.fog = new THREE.FogExp2(0x100d00, 0.046);

const camera = new THREE.PerspectiveCamera(SET.fov, innerWidth/innerHeight, 0.05, 80);
camera.position.set(6, 1.64, 6);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

/* ═══════════ GRAIN ═══════════ */
const grainCv  = document.getElementById('grain');
const grainCtx = grainCv.getContext('2d');
let   grainF   = 0;
function tickGrain() {
  if (++grainF % 3 !== 0) return;
  const id = grainCtx.createImageData(320, 180);
  const d  = id.data;
  for (let i=0; i<d.length; i+=4) { const v=Math.random()*255|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; }
  grainCtx.putImageData(id, 0, 0);
}

const vigEl = document.getElementById('vignette');

/* ═══════════ AUDIO ═══════════ */
class AudioSystem {
  constructor() { this.ctx=null; this.master=null; this.stepCD=0; this.on=false; }

  init() {
    if (this.ctx) return;
    this.ctx    = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = SET.volume;
    this.master.connect(this.ctx.destination);
    this._hum(); this._drone(); this._scheduleDistant();
    this.on = true;
  }

  _mkNoise(sec) {
    const len=this.ctx.sampleRate*sec, buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    return buf;
  }

  _hum() {
    [[60,.021],[120,.015],[180,.009],[240,.004]].forEach(([f,a]) => {
      const osc=this.ctx.createOscillator(), g=this.ctx.createGain();
      osc.frequency.value = f + (Math.random()-.5)*.4;
      osc.type='sine'; g.gain.value=a;
      const lfo=this.ctx.createOscillator(), lg=this.ctx.createGain();
      lfo.frequency.value = .07+Math.random()*.12; lg.gain.value = a*.09;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      osc.connect(g); g.connect(this.master); osc.start();
    });
  }

  _drone() {
    const src=this.ctx.createBufferSource(); src.buffer=this._mkNoise(4); src.loop=true;
    const lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=65;
    const g=this.ctx.createGain(); g.gain.value=.055;
    src.connect(lp); lp.connect(g); g.connect(this.master); src.start();
  }

  _scheduleDistant() {
    setTimeout(() => { this._distant(); this._scheduleDistant(); }, 10000+Math.random()*40000);
  }

  _distant() {
    if (!this.on) return;
    const dur=2+Math.random()*3, src=this.ctx.createBufferSource();
    src.buffer=this._mkNoise(dur);
    const bp=this.ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value=100+Math.random()*700; bp.Q.value=1.5+Math.random()*3;
    const pan=this.ctx.createStereoPanner(); pan.pan.value=(Math.random()-.5)*1.8;
    const g=this.ctx.createGain();
    const vol=.06+Math.random()*.09, now=this.ctx.currentTime;
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(vol,now+.6);
    g.gain.setValueAtTime(vol,now+dur-.6);
    g.gain.linearRampToValueAtTime(0,now+dur);
    src.connect(bp); bp.connect(pan); pan.connect(g); g.connect(this.master); src.start();
  }

  step(dt, moving, sprint) {
    if (!this.on||!moving) { this.stepCD=0; return; }
    this.stepCD -= dt;
    if (this.stepCD <= 0) { this.stepCD=sprint?.27:.45; this._step(); }
  }

  _step() {
    const len=this.ctx.sampleRate*.1, buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.09));
    const src=this.ctx.createBufferSource(); src.buffer=buf;
    const hp=this.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=140;
    const lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=560;
    const g=this.ctx.createGain(); g.gain.value=.38;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.master); src.start();
  }

  buzz(dur=.12) {
    if (!this.on) return;
    const osc=this.ctx.createOscillator(), g=this.ctx.createGain();
    osc.frequency.value=118+Math.random()*18; osc.type='sawtooth';
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(.022,now); g.gain.exponentialRampToValueAtTime(.001,now+dur);
    osc.connect(g); g.connect(this.master); osc.start(); osc.stop(now+dur);
  }
}
const sfx = new AudioSystem();

/* ═══════════ TEXTURES (512px procedural) ═══════════ */
function mkWall() {
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const c=cv.getContext('2d');

  // Warm amber-yellow base
  c.fillStyle='#c0a030'; c.fillRect(0,0,S,S);

  // Subtle gradient overlay
  let g=c.createLinearGradient(0,0,S,S);
  g.addColorStop(0,'rgba(255,235,110,.07)'); g.addColorStop(1,'rgba(0,0,0,.09)');
  c.fillStyle=g; c.fillRect(0,0,S,S);

  // Wallpaper brick pattern (offset rows)
  const PW=76, PH=58;
  for (let row=-1; row<S/PH+1; row++) {
    const off=(row&1)?PW/2:0;
    for (let col=-1; col<S/PW+1; col++) {
      const x=col*PW+off, y=row*PH;
      // Outer shadow
      c.strokeStyle='rgba(52,32,0,.25)'; c.lineWidth=1.5;
      c.strokeRect(x+2.5, y+2.5, PW-5, PH-5);
      // Inner highlight (emboss)
      c.strokeStyle='rgba(255,245,150,.06)'; c.lineWidth=1;
      c.strokeRect(x+3.5, y+3.5, PW-8, PH-8);
      // Subtle fill variation
      const v=(Math.random()-.5)*10;
      c.fillStyle=`rgba(${100+v|0},${78+v|0},${2+v|0},.04)`;
      c.fillRect(x+2,y+2,PW-4,PH-4);
    }
  }

  // Fine grain noise
  for (let i=0; i<S*S*.20; i++) {
    const x=Math.random()*S|0, y=Math.random()*S|0, v=(Math.random()-.5)*28|0;
    c.fillStyle=`rgba(${90+v},${68+v},${0+v},.12)`; c.fillRect(x,y,1,1);
  }

  // Stain patches
  for (let i=0; i<18; i++) {
    const x=Math.random()*S, y=Math.random()*S, r=4+Math.random()*32;
    const gr=c.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(48,28,0,.13)'); gr.addColorStop(1,'rgba(48,28,0,0)');
    c.fillStyle=gr; c.fillRect(x-r,y-r,r*2,r*2);
  }

  // Baseboard darkening (bottom 20%)
  const bot=c.createLinearGradient(0,S*.8,0,S);
  bot.addColorStop(0,'rgba(0,0,0,0)'); bot.addColorStop(1,'rgba(0,0,0,.25)');
  c.fillStyle=bot; c.fillRect(0,S*.8,S,S*.2);

  // Top edge shadow
  const top=c.createLinearGradient(0,0,0,S*.06);
  top.addColorStop(0,'rgba(0,0,0,.18)'); top.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=top; c.fillRect(0,0,S,S*.06);

  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1.6,1.0);
  return t;
}

function mkFloor() {
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const c=cv.getContext('2d');

  c.fillStyle='#8a7a3c'; c.fillRect(0,0,S,S);

  // Carpet fiber strokes (directional, mostly along axes)
  for (let i=0; i<S*S*.42; i++) {
    const x=Math.random()*S, y=Math.random()*S;
    const len=.8+Math.random()*2.2, a=Math.random()*Math.PI*2;
    const v=(Math.random()-.5)*38;
    c.strokeStyle=`rgba(${72+v|0},${56+v|0},${10+v|0},.24)`;
    c.lineWidth=.5; c.beginPath(); c.moveTo(x,y);
    c.lineTo(x+Math.cos(a)*len, y+Math.sin(a)*len); c.stroke();
  }

  // Slight center worn path
  const wk=c.createLinearGradient(S*.2,0,S*.8,0);
  wk.addColorStop(0,'rgba(0,0,0,0)'); wk.addColorStop(.5,'rgba(210,180,70,.05)'); wk.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=wk; c.fillRect(0,0,S,S);

  // Stains
  for (let i=0; i<22; i++) {
    const x=Math.random()*S, y=Math.random()*S, r=2+Math.random()*14;
    const gr=c.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(26,16,0,.22)'); gr.addColorStop(1,'rgba(26,16,0,0)');
    c.fillStyle=gr; c.fillRect(x-r,y-r,r*2,r*2);
  }

  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,6);
  return t;
}

function mkCeil() {
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const c=cv.getContext('2d');

  c.fillStyle='#d0c688'; c.fillRect(0,0,S,S);

  const TL=128; // 4 tiles across
  for (let row=0; row<4; row++) {
    for (let col=0; col<4; col++) {
      const tx=col*TL, ty=row*TL;
      const vr=(Math.random()-.5)*12|0;
      c.fillStyle=`rgba(${145+vr},${133+vr},${82+vr},.11)`;
      c.fillRect(tx+2,ty+2,TL-4,TL-4);
      // Perforation dots
      for (let py=9; py<TL-5; py+=9) {
        for (let px=9; px<TL-5; px+=9) {
          if (Math.random()<.58) {
            c.fillStyle='rgba(52,40,12,.13)';
            c.beginPath(); c.arc(tx+px,ty+py,.85,0,Math.PI*2); c.fill();
          }
        }
      }
    }
  }

  // Grout lines
  c.strokeStyle='rgba(0,0,0,.22)'; c.lineWidth=2.5;
  for (let x=0;x<=S;x+=TL) { c.beginPath();c.moveTo(x,0);c.lineTo(x,S);c.stroke(); }
  for (let y=0;y<=S;y+=TL) { c.beginPath();c.moveTo(0,y);c.lineTo(S,y);c.stroke(); }

  // Water stains
  for (let i=0; i<10; i++) {
    const x=Math.random()*S, y=Math.random()*S, r=8+Math.random()*28;
    const gr=c.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(88,65,8,.24)'); gr.addColorStop(.5,'rgba(68,50,5,.10)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=gr; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  }

  // Fine grain
  for (let i=0; i<S*S*.05; i++) {
    const x=Math.random()*S|0, y=Math.random()*S|0, v=(Math.random()-.5)*14|0;
    c.fillStyle=`rgba(${115+v},${105+v},${65+v},.08)`; c.fillRect(x,y,1,1);
  }

  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1.8,1.8);
  return t;
}

/* ═══════════ MATERIALS ═══════════ */
// DoubleSide on walls guards against any remaining normal oddities
const matW = new THREE.MeshLambertMaterial({ map:mkWall(),  side:THREE.DoubleSide });
const matF = new THREE.MeshLambertMaterial({ map:mkFloor() });
const matC = new THREE.MeshLambertMaterial({ map:mkCeil()  });

/* ═══════════ MAZE (recursive backtracker) ═══════════ */
const GRID=32, CELL=4, WH=2.72;
function buildMaze(G) {
  const m=Array.from({length:G},()=>new Array(G).fill(false));
  function carve(cx,cy) {
    m[cy][cx]=true;
    const dirs=[[0,-2],[0,2],[-2,0],[2,0]].sort(()=>Math.random()-.5);
    for (const[dx,dy]of dirs) {
      const nx=cx+dx,ny=cy+dy;
      if(nx>=0&&nx<G&&ny>=0&&ny<G&&!m[ny][nx]) { m[cy+dy/2][cx+dx/2]=true; carve(nx,ny); }
    }
  }
  carve(1,1);
  const open=(cx,cy,w,h)=>{for(let y=cy;y<cy+h&&y<G;y++)for(let x=cx;x<cx+w&&x<G;x++)m[y][x]=true;};
  open(2,2,6,6);                          // spawn room
  open(G/2-3|0, G/2-2|0, 6,4);           // mid room
  open(G-7, G-7, 5,5);                    // far room
  open(4, G-6, 4,4);                      // side room
  return m;
}
const maze=buildMaze(GRID);

/* ═══════════ GEOMETRY ═══════════ */
function mergeBatch(geos, mat) {
  let n=0; for(const g of geos) n+=g.attributes.position.count;
  const P=new Float32Array(n*3), N=new Float32Array(n*3), U=new Float32Array(n*2), IDX=[];
  let off=0;
  for (const g of geos) {
    const cnt=g.attributes.position.count;
    P.set(g.attributes.position.array,off*3);
    N.set(g.attributes.normal.array,off*3);
    U.set(g.attributes.uv.array,off*2);
    const gi=g.index?.array;
    if(gi) for(let i=0;i<gi.length;i++) IDX.push(gi[i]+off);
    else   for(let i=0;i<cnt;i++)       IDX.push(i+off);
    off+=cnt; g.dispose();
  }
  const bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.BufferAttribute(P,3));
  bg.setAttribute('normal',  new THREE.BufferAttribute(N,3));
  bg.setAttribute('uv',      new THREE.BufferAttribute(U,2));
  bg.setIndex(IDX);
  return new THREE.Mesh(bg,mat);
}

const WG=[], FG=[], CG=[];
const G=GRID, C=CELL, H=WH;

for (let row=0; row<G; row++) {
  for (let col=0; col<G; col++) {
    if (!maze[row][col]) continue;
    const cx=col*C+C/2, cz=row*C+C/2;

    // Floor
    const gf=new THREE.PlaneGeometry(C,C); gf.rotateX(-Math.PI/2); gf.translate(cx,0,cz); FG.push(gf);
    // Ceiling
    const gc=new THREE.PlaneGeometry(C,C); gc.rotateX(Math.PI/2); gc.translate(cx,H,cz); CG.push(gc);

    // Walls  — KEY FIX: correct rotations so normals face INTO the corridor
    // A PlaneGeometry default normal = +Z. rotateY(θ) makes normal = (sinθ, 0, cosθ)
    // North wall (z=cz-C/2): normal must be +Z → rotateY(0)
    // South wall (z=cz+C/2): normal must be -Z → rotateY(π)
    // West  wall (x=cx-C/2): normal must be +X → rotateY(+π/2)
    // East  wall (x=cx+C/2): normal must be -X → rotateY(-π/2)
    const wall=(x,z,ry)=>{const g=new THREE.PlaneGeometry(C,H);g.rotateY(ry);g.translate(x,H/2,z);WG.push(g);};
    if(row===0   ||!maze[row-1][col]) wall(cx,       cz-C/2,  0);
    if(row===G-1 ||!maze[row+1][col]) wall(cx,       cz+C/2,  Math.PI);
    if(col===0   ||!maze[row][col-1]) wall(cx-C/2,   cz,      Math.PI/2);   // FIXED (was -π/2)
    if(col===G-1 ||!maze[row][col+1]) wall(cx+C/2,   cz,      -Math.PI/2);  // FIXED (was +π/2)
  }
}

scene.add(mergeBatch(WG, matW));
scene.add(mergeBatch(FG, matF));
scene.add(mergeBatch(CG, matC));

/* ═══════════ FLUORESCENT TUBE FIXTURES ═══════════ */
const tubeGeo = new THREE.BoxGeometry(1.2, 0.04, 0.10);
const lights=[], flickData=[];

for (let row=1; row<G; row+=4) {
  for (let col=1; col<G; col+=4) {
    if (!maze[row][col] || lights.length>=80) continue;
    const lx=col*C+C/2, lz=row*C+C/2;
    const dead = Math.random()<.11;

    const eMat=new THREE.MeshStandardMaterial({
      color:0xfff6d0, emissive:0xfff6d0,
      emissiveIntensity: dead?0.04:0.92, roughness:.6,
    });
    const tube=new THREE.Mesh(tubeGeo, eMat);
    tube.position.set(lx, H-.01, lz);
    scene.add(tube);

    if (!dead) {
      const pl=new THREE.PointLight(0xd4aa28, 1.35, 14, 1.7);
      pl.position.set(lx, H-.12, lz);
      scene.add(pl);
      pl.userData.eMat = eMat;
      lights.push(pl);
      flickData.push({
        base:    .88 + Math.random()*.55,
        wSpd:    1.4 + Math.random()*3.5,
        wPha:    Math.random()*Math.PI*2,
        wAmp:    .055,
        doFlick: Math.random()<.13,    // 13% of alive lights flicker
        flickOn: false,
        flickCD: 3 + Math.random()*10, // seconds until next flicker event
        flickDur: 0,
        lastBuzz: -99,
      });
    }
  }
}

/* ═══════════ AMBIENT + HEMISPHERE ═══════════ */
scene.add(new THREE.AmbientLight(0xd4aa18, .28));
// Hemisphere: warm yellow above, slightly cooler below for subtle gradient
scene.add(new THREE.HemisphereLight(0xd4a010, 0x5a4800, .18));

/* ═══════════ PROPS ═══════════ */
const boxMat=new THREE.MeshLambertMaterial({color:0x9a7830});
function scatterBoxes(row0,col0,rows,cols,count) {
  for (let i=0;i<count;i++) {
    const row=row0+Math.random()*rows|0, col=col0+Math.random()*cols|0;
    if (!maze[row][col]) continue;
    const w=.4+Math.random()*.5, d=.35+Math.random()*.4, h=.28+Math.random()*.45;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), boxMat);
    mesh.position.set(
      col*C+C/2+(Math.random()-.5)*C*.5,
      h/2,
      row*C+C/2+(Math.random()-.5)*C*.5
    );
    mesh.rotation.y=Math.random()*Math.PI*2;
    scene.add(mesh);
  }
}
scatterBoxes(2,2,5,5,8);
scatterBoxes(G-6,G-6,4,4,6);

/* ═══════════ COLLISION ═══════════ */
const RAD=.36;
const walkable=(wx,wz)=>{const col=Math.floor(wx/C),row=Math.floor(wz/C);return col>=0&&col<G&&row>=0&&row<G&&maze[row][col];};
function slide(ox,oz,nx,nz) {
  if(walkable(nx-RAD,nz)&&walkable(nx+RAD,nz)&&walkable(nx,nz-RAD)&&walkable(nx,nz+RAD))return[nx,nz];
  if(walkable(nx-RAD,oz)&&walkable(nx+RAD,oz))return[nx,oz];
  if(walkable(ox,nz-RAD)&&walkable(ox,nz+RAD))return[ox,nz];
  return[ox,oz];
}

/* ═══════════ POINTER LOCK ═══════════ */
const overlayEl=document.getElementById('overlay');
const pauseEl  =document.getElementById('pause');
let locked=false, gameStarted=false, yaw=0, pitch=0;

function lock() { renderer.domElement.requestPointerLock(); }
function unlock() { document.exitPointerLock?.(); }

function showPause()    { pauseEl.style.display='flex'; }
function hidePause()    { pauseEl.style.display='none'; }
function showOverlay()  { overlayEl.style.display='flex'; }
function hideOverlay()  { overlayEl.style.display='none'; }

document.getElementById('startBtn').addEventListener('click', e=>{
  e.stopPropagation(); sfx.init(); gameStarted=true; lock();
});
overlayEl.addEventListener('click', ()=>{ sfx.init(); gameStarted=true; lock(); });

document.getElementById('resumeBtn').addEventListener('click', ()=>{ hidePause(); lock(); });
document.getElementById('menuBtn').addEventListener('click', ()=>{
  hidePause(); gameStarted=false; showOverlay();
});

document.addEventListener('pointerlockchange', ()=>{
  locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    hideOverlay(); hidePause();
    sfx.ctx?.resume && sfx.ctx.resume();
  } else if (gameStarted) {
    showPause();   // ESC while playing → pause menu
  }
});

document.addEventListener('mousemove', e=>{
  if (!locked) return;
  const sens = .001 + SET.sensScale * .00025;
  yaw   -= e.movementX * sens;
  pitch -= e.movementY * sens;
  pitch  = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, pitch));
});

/* ═══════════ KEYBOARD ═══════════ */
const keys={};
addEventListener('keydown', e=>(keys[e.code]=true));
addEventListener('keyup',   e=>(keys[e.code]=false));

/* ═══════════ SETTINGS BINDINGS ═══════════ */
function bindSlider(id, vidId, min, max, initial, suffix, cb) {
  const el=document.getElementById(id), vl=document.getElementById(vidId);
  el.value=initial; vl.textContent=initial+suffix;
  el.addEventListener('input', ()=>{
    const v=+el.value; vl.textContent=v+suffix; cb(v);
  });
}
bindSlider('sFov','vFov',60,110,82,'°',    v=>{ SET.fov=v; camera.fov=v; camera.updateProjectionMatrix(); });
bindSlider('sFog','vFog',8,55,30,'m',     v=>{ SET.fogFar=v; scene.fog.density=.046*(30/v); });
bindSlider('sSens','vSens',1,20,5,'',     v=>{ SET.sensScale=v; });
bindSlider('sVol','vVol',0,100,85,'',     v=>{ SET.volume=v/100; if(sfx.master) sfx.master.gain.value=v/100; });

const tGrain=document.getElementById('tGrain');
const tVig  =document.getElementById('tVig');
const tBob  =document.getElementById('tBob');
tGrain.addEventListener('change', ()=>{ SET.grain=tGrain.checked; grainCv.style.opacity=SET.grain?'.04':'0'; });
tVig.addEventListener('change',   ()=>{ SET.vignette=tVig.checked; vigEl.style.opacity=SET.vignette?'1':'0'; });
tBob.addEventListener('change',   ()=>{ SET.bobbing=tBob.checked; });

/* ═══════════ GAME LOOP ═══════════ */
const cxEl=document.getElementById('cx'), czEl=document.getElementById('cz');
const clock=new THREE.Clock();
let bobT=0, bobA=0;
const _fwd=new THREE.Vector3(), _rgt=new THREE.Vector3(), _mv=new THREE.Vector3();

(function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05), time=clock.elapsedTime;

  /* — Movement — */
  let moving=false, sprint=false;
  if (locked) {
    sprint = keys['ShiftLeft']||keys['ShiftRight'];
    const spd = (sprint?8.4:4.2);
    _fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));
    _rgt.set( Math.cos(yaw),0,-Math.sin(yaw));
    _mv.set(0,0,0);
    if(keys['KeyW']||keys['ArrowUp'])    _mv.addScaledVector(_fwd, 1);
    if(keys['KeyS']||keys['ArrowDown'])  _mv.addScaledVector(_fwd,-1);
    if(keys['KeyA']||keys['ArrowLeft'])  _mv.addScaledVector(_rgt,-1);
    if(keys['KeyD']||keys['ArrowRight']) _mv.addScaledVector(_rgt, 1);
    if (_mv.lengthSq()>0) {
      moving=true; _mv.normalize().multiplyScalar(spd*dt);
      const[rx,rz]=slide(camera.position.x,camera.position.z,camera.position.x+_mv.x,camera.position.z+_mv.z);
      camera.position.x=rx; camera.position.z=rz;
    }
  }

  /* — Head bob — */
  if (moving&&SET.bobbing) { bobT+=dt*(sprint?2.8:1.85); bobA=THREE.MathUtils.lerp(bobA,1,dt*10); }
  else                      { bobA=THREE.MathUtils.lerp(bobA,0,dt*8); }
  camera.position.y = 1.64 + Math.sin(bobT*Math.PI*2)*.036*bobA;

  /* — Camera — */
  camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));

  /* — Flickering lights (state machine) — */
  for (let i=0; i<lights.length; i++) {
    const fd=flickData[i], l=lights[i];
    const base = fd.base + Math.sin(time*fd.wSpd+fd.wPha)*fd.wAmp;

    if (fd.doFlick) {
      if (!fd.flickOn) {
        fd.flickCD -= dt;
        l.intensity = base;
        if (fd.flickCD<=0) {
          fd.flickOn  = true;
          fd.flickDur = .08 + Math.random()*.55;
          sfx.buzz(Math.min(fd.flickDur*.5,.3));
          fd.flickCD  = 2.5 + Math.random()*14;
        }
      } else {
        // Rapid random on/off during flicker event
        l.intensity = (Math.random()<.45) ? .03 : base*.9;
        fd.flickDur -= dt;
        if (fd.flickDur<=0) { fd.flickOn=false; l.intensity=base; }
      }
    } else {
      l.intensity = base;
    }

    if (l.userData.eMat) {
      l.userData.eMat.emissiveIntensity = THREE.MathUtils.clamp(l.intensity*.72, 0, 1);
    }
  }

  /* — Audio — */
  sfx.step(dt, moving, sprint);

  /* — Grain — */
  tickGrain();

  /* — HUD — */
  cxEl.textContent = camera.position.x.toFixed(1);
  czEl.textContent = camera.position.z.toFixed(1);

  renderer.render(scene, camera);
})();
</script>
</body>
</html>"""

p = pathlib.Path('/Users/2013mbp4gb128gb/Documents/antigravity/proud-hypatia/index.html')
p.write_text(HTML)
print(f"Written {len(HTML)} bytes to {p}")
