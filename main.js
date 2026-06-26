import * as THREE from 'three';

const SET={fov:82,sensScale:5,volume:0.85,fogFar:30,grain:true,vignette:true,bobbing:true};

/* ═══════ RENDERER ═══════ */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.domElement.id='three';
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a0800);
scene.fog=new THREE.FogExp2(0x0a0800,0.046);

const camera=new THREE.PerspectiveCamera(SET.fov,innerWidth/innerHeight,0.05,80);
camera.position.set(48,1.64,48); // Spawn in exact center of chunk 0,0

let gameState = 'menu'; // menu, playing, dead
let currentLevel = 0;
let levelTime = 0;


addEventListener('resize',()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

/* ═══════ GRAIN ═══════ */
const grainCv=document.getElementById('grain');
const grainCtx=grainCv.getContext('2d');
let grainF=0;
function tickGrain(){
  if(!SET.grain)return;
  if(++grainF%3!==0)return;
  const id=grainCtx.createImageData(320,180),d=id.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
  grainCtx.putImageData(id,0,0);
}

/* ═══════ AUDIO ═══════ */
class SFX{
  constructor(){this.ctx=null;this.master=null;this.stepCD=0;this.on=false;}
  init(){
    if(this.ctx)return;
    this.ctx=new AudioContext();
    this.master=this.ctx.createGain();this.master.gain.value=SET.volume;
    this.master.connect(this.ctx.destination);
    this._hum();this._drone();this._schedDist();this.on=true;
  }
  _noise(sec){
    const len=this.ctx.sampleRate*sec,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;return buf;
  }
  _hum(){
    [[60,.022],[120,.016],[180,.01],[240,.005]].forEach(([f,a])=>{
      const osc=this.ctx.createOscillator(),g=this.ctx.createGain();
      osc.frequency.value=f+(Math.random()-.5)*.4;osc.type='sine';g.gain.value=a;
      const lfo=this.ctx.createOscillator(),lg=this.ctx.createGain();
      lfo.frequency.value=.06+Math.random()*.12;lg.gain.value=a*.1;
      lfo.connect(lg);lg.connect(g.gain);lfo.start();
      osc.connect(g);g.connect(this.master);osc.start();
    });
  }
  _drone(){
    const src=this.ctx.createBufferSource();src.buffer=this._noise(4);src.loop=true;
    const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=60;
    const g=this.ctx.createGain();g.gain.value=.06;
    src.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  }
  _schedDist(){
    setTimeout(()=>{
      if(Math.random()<0.6) this._distant();
      else this._echoClank();
      this._schedDist();
    },6000+Math.random()*20000);
  }
  _distant(){
    if(!this.on)return;
    const dur=1.5+Math.random()*4,src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const bp=this.ctx.createBiquadFilter();bp.type='bandpass';
    bp.frequency.value=80+Math.random()*800;bp.Q.value=1.2+Math.random()*4;
    const pan=this.ctx.createStereoPanner();pan.pan.value=(Math.random()-.5)*1.8;
    const g=this.ctx.createGain();
    const vol=.05+Math.random()*.1,now=this.ctx.currentTime;
    g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(vol,now+.5);
    g.gain.setValueAtTime(vol,now+dur-.5);g.gain.linearRampToValueAtTime(0,now+dur);
    src.connect(bp);bp.connect(pan);pan.connect(g);g.connect(this.master);src.start();
  }
  _echoClank(){
    if(!this.on)return;
    const dur = 0.15 + Math.random()*0.25;
    const osc = this.ctx.createOscillator();
    osc.type = Math.random()>0.5 ? 'square' : 'sawtooth';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150 + Math.random()*800, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + dur);
    
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 300 + Math.random()*1500; bp.Q.value = 4 + Math.random()*4;
    
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(.12 + Math.random()*.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = 0.3 + Math.random()*0.5;
    
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.55 + Math.random()*0.15; // 55-70% echo volume
    
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = (Math.random()-.5)*1.6;
    
    osc.connect(bp); bp.connect(g);
    g.connect(pan); pan.connect(this.master);
    
    // Echo feedback loop
    g.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(pan);
    
    osc.start(now); osc.stop(now + dur);
  }
  step(dt,mv,sp){
    if(!this.on||!mv){this.stepCD=0;return;}
    this.stepCD-=dt;if(this.stepCD<=0){this.stepCD=sp?.26:.44;this._stp();}
  }
  _stp(){
    const len=this.ctx.sampleRate*.1,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.085));
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=130;
    const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=540;
    const g=this.ctx.createGain();g.gain.value=.36;
    src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  }
  buzz(dur=.12){
    if(!this.on)return;
    const osc=this.ctx.createOscillator(),g=this.ctx.createGain();
    osc.frequency.value=116+Math.random()*20;osc.type='sawtooth';
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(.024,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);
    osc.connect(g);g.connect(this.master);osc.start();osc.stop(now+dur);
  }
  growl(){
    if(!this.on)return;
    const dur=2.5+Math.random()*2;
    const src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const bp=this.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=60+Math.random()*80;bp.Q.value=3+Math.random()*4;
    const g=this.ctx.createGain();
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(.14+Math.random()*.06,now+.4);
    g.gain.linearRampToValueAtTime(0,now+dur);
    src.connect(bp);bp.connect(g);g.connect(this.master);src.start();
  }
}
const sfx=new SFX();

/* ═══════ TEXTURES ═══════ */
// Authentic wall texture
const texLoader = new THREE.TextureLoader();
const realWallTex = texLoader.load('wallpaper.png');
realWallTex.wrapS = realWallTex.wrapT = THREE.RepeatWrapping;
realWallTex.repeat.set(2, 2);

function mkFloorTextures(){
  const S=512;
  const cv=document.createElement('canvas');cv.width=cv.height=S;
  const cvR=document.createElement('canvas');cvR.width=cvR.height=S;
  const c=cv.getContext('2d'), cR=cvR.getContext('2d');
  
  c.fillStyle='#b5a642';c.fillRect(0,0,S,S);
  cR.fillStyle='#d9d9d9';cR.fillRect(0,0,S,S);

  for(let i=0;i<S*S*.4;i++){
    const x=Math.random()*S,y=Math.random()*S;
    const len=.8+Math.random()*2.2,a=Math.random()*Math.PI*2;
    const v=(Math.random()-.5)*38;
    c.strokeStyle=`rgba(${72+v|0},${56+v|0},${10+v|0},.24)`;
    c.lineWidth=.5;c.beginPath();c.moveTo(x,y);
    c.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();
  }

  for(let i=0;i<30;i++){
    const x=Math.random()*S,y=Math.random()*S,r=8+Math.random()*28;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(26,16,0,.12)');g.addColorStop(1,'rgba(26,16,0,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    
    const gR=cR.createRadialGradient(x,y,0,x,y,r);
    gR.addColorStop(0,'rgba(40,40,40,1)'); 
    gR.addColorStop(1,'rgba(217,217,217,0)');
    cR.fillStyle=gR;cR.fillRect(x-r,y-r,r*2,r*2);
  }
  
  const map=new THREE.CanvasTexture(cv); map.wrapS=map.wrapT=THREE.RepeatWrapping; map.repeat.set(6,6);
  const rough=new THREE.CanvasTexture(cvR); rough.wrapS=rough.wrapT=THREE.RepeatWrapping; rough.repeat.set(6,6);
  return {map, rough};
}

function mkCeil(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#d0c688';c.fillRect(0,0,S,S);
  const TL=128;
  for(let row=0;row<4;row++){
    for(let col=0;col<4;col++){
      const tx=col*TL,ty=row*TL;
      const vr=(Math.random()-.5)*12|0;
      c.fillStyle=`rgba(${145+vr},${133+vr},${82+vr},.11)`;
      c.fillRect(tx+2,ty+2,TL-4,TL-4);
      for(let py=9;py<TL-5;py+=9){
        for(let px=9;px<TL-5;px+=9){
          if(Math.random()<.58){
            c.fillStyle='rgba(52,40,12,.13)';
            c.beginPath();c.arc(tx+px,ty+py,.85,0,Math.PI*2);c.fill();
          }
        }
      }
    }
  }
  c.strokeStyle='rgba(0,0,0,.22)';c.lineWidth=2.5;
  for(let x=0;x<=S;x+=TL){c.beginPath();c.moveTo(x,0);c.lineTo(x,S);c.stroke();}
  for(let y=0;y<=S;y+=TL){c.beginPath();c.moveTo(0,y);c.lineTo(S,y);c.stroke();}
  for(let i=0;i<10;i++){
    const x=Math.random()*S,y=Math.random()*S,r=8+Math.random()*28;
    const g2=c.createRadialGradient(x,y,0,x,y,r);
    g2.addColorStop(0,'rgba(88,65,8,.24)');g2.addColorStop(.5,'rgba(68,50,5,.10)');g2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.8,1.8);return t;
}

function mkCardboard(){
  const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#a08040';c.fillRect(0,0,S,S);
  for(let y=0;y<S;y+=3){
    const a=.04+Math.random()*.04;c.strokeStyle=`rgba(60,40,10,${a})`;c.lineWidth=.8+Math.random()*.6;
    c.beginPath();c.moveTo(0,y+Math.random()*.5);c.lineTo(S,y+Math.random()*.5);c.stroke();
  }
  for(let i=0;i<S*S*.15;i++){
    const x=Math.random()*S|0,y=Math.random()*S|0,v=(Math.random()-.5)*24|0;
    c.fillStyle=`rgba(${90+v},${65+v},${20+v},.08)`;c.fillRect(x,y,1,1);
  }
  for(let i=0;i<2;i++){
    const horiz=Math.random()>.5,pos=S*.2+Math.random()*S*.6;
    c.strokeStyle='rgba(40,25,5,.12)';c.lineWidth=1.2;
    c.beginPath();if(horiz){c.moveTo(0,pos);c.lineTo(S,pos);}else{c.moveTo(pos,0);c.lineTo(pos,S);}c.stroke();
  }
  if(Math.random()<.6){
    const ty=S*.3+Math.random()*S*.4;
    c.fillStyle='rgba(180,165,110,.14)';c.fillRect(0,ty-6,S,12);
    c.strokeStyle='rgba(120,100,50,.08)';c.lineWidth=.5;c.strokeRect(0,ty-6,S,12);
  }
  for(let i=0;i<8;i++){
    const x=Math.random()*S,y=Math.random()*S,r=4+Math.random()*18;
    const g2=c.createRadialGradient(x,y,0,x,y,r);
    g2.addColorStop(0,'rgba(35,20,2,.15)');g2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  if(Math.random()<.5){
    c.save();c.globalAlpha=.06;c.font='bold 18px monospace';c.fillStyle='#2a1800';
    const words=['FRAGILE','THIS SIDE UP','LOT 4207','HANDLE WITH CARE','QTY: 12'];
    const word=words[Math.random()*words.length|0];
    c.translate(S*.5,S*.5);c.rotate((Math.random()-.5)*.3);
    c.fillText(word,-c.measureText(word).width/2,6);c.restore();
  }
  const edge=c.createLinearGradient(0,0,0,S);
  edge.addColorStop(0,'rgba(0,0,0,.06)');edge.addColorStop(.1,'rgba(0,0,0,0)');
  edge.addColorStop(.9,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,0,0,.08)');
  c.fillStyle=edge;c.fillRect(0,0,S,S);
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

const {map: floorMap, rough: floorRough} = mkFloorTextures();
const matW=new THREE.MeshLambertMaterial({map:realWallTex,side:THREE.DoubleSide});
const matF=new THREE.MeshStandardMaterial({map:floorMap, roughnessMap:floorRough, metalness:0.2, color:0xffffff});
const matC=new THREE.MeshLambertMaterial({map:mkCeil()});
const matWHWall=new THREE.MeshLambertMaterial({color:0x040405, side:THREE.DoubleSide});
const matWHFloor=new THREE.MeshStandardMaterial({color:0x060608, roughness: 0.9, metalness: 0.1});
const matWHCeil=new THREE.MeshLambertMaterial({color:0x020202});
const boxMat=new THREE.MeshLambertMaterial({map:mkCardboard()});
const pipeMat=new THREE.MeshLambertMaterial({color:0x707058});
const housingMat=new THREE.MeshLambertMaterial({color:0x555544});
const trimMat=new THREE.MeshLambertMaterial({color:0x090703});
const cabinetMat=new THREE.MeshStandardMaterial({color:0x6a6c6e, roughness:0.35, metalness:0.75});
const ventMat=new THREE.MeshLambertMaterial({color:0x050505});
// Level -1 warehouse props
const whPipeMat=new THREE.MeshStandardMaterial({color:0x2a2a2e, roughness:0.4, metalness:0.8});
const whShelfMat=new THREE.MeshStandardMaterial({color:0x1a1a1e, roughness:0.5, metalness:0.7});
const whCrateMat=new THREE.MeshLambertMaterial({color:0x0e0e10});
const whPendantMat=new THREE.MeshStandardMaterial({color:0x1a1a20, roughness:0.3, metalness:0.9});
const whPuddleMat=new THREE.MeshStandardMaterial({color:0x030308, roughness:0.05, metalness:0.9, transparent:true, opacity:0.6});
const whPillarMat=new THREE.MeshStandardMaterial({color:0x0c0c0e, roughness:0.85, metalness:0.1});

/* ═══════ PRNG ═══════ */
class PRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/* ═══════ INFINITE CHUNKING ═══════ */
const CSZ=24, CELL=4;
let WH=2.72;
const chunkData = new Map();
const activeChunks = new Map();
let globalFixtures = [];

function getChunkKey(cx, cz) { return `${cx},${cz}`; }

function generateChunkData(cx, cz) {
  const prng = new PRNG(Math.abs(cx * 10000 + cz) ^ 12345);
  const m = Array(CSZ).fill(0).map(() => Array(CSZ).fill(false));

  if (currentLevel === -1) {
    // Warehouse: huge open rooms with thick concrete pillars
    // Start by filling most of the chunk as open space
    for (let r = 0; r < CSZ; r++) {
      for (let c = 0; c < CSZ; c++) m[r][c] = true;
    }
    // Add thick concrete pillars in a grid pattern
    for (let r = 3; r < CSZ-2; r += 5) {
      for (let c = 3; c < CSZ-2; c += 5) {
        if (prng.next() < 0.7) {
          m[r][c] = false;
          // Some pillars are 2x2 for thick support columns
          if (prng.next() < 0.4 && r+1 < CSZ && c+1 < CSZ) {
            m[r+1][c] = false;
            m[r][c+1] = false;
            m[r+1][c+1] = false;
          }
        }
      }
    }
    // Cut some random walls/barriers to break up the open space
    for (let i = 0; i < 3; i++) {
      const horiz = prng.next() > 0.5;
      const pos = 2 + Math.floor(prng.next() * (CSZ - 4));
      const len = 3 + Math.floor(prng.next() * 6);
      const start = Math.floor(prng.next() * (CSZ - len));
      for (let j = start; j < Math.min(start + len, CSZ); j++) {
        if (horiz) { if(pos < CSZ) m[pos][j] = false; }
        else { if(j < CSZ) m[j][pos] = false; }
      }
    }
    // Ensure borders connect to adjacent chunks
    for (let i = 0; i < CSZ; i++) {
      m[0][i] = true; m[CSZ-1][i] = true;
      m[i][0] = true; m[i][CSZ-1] = true;
    }
    return { m, prng };
  }
  // Start solid (all false)

  function carve(x, y) {
    m[y][x] = true;
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => prng.next() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < CSZ-1 && ny > 0 && ny < CSZ-1 && !m[ny][nx]) {
        m[y + dy/2][x + dx/2] = true;
        carve(nx, ny);
      }
    }
  }

  // Carve maze from multiple starting points to ensure it covers the chunk well
  carve(2, 2);
  carve(CSZ-3, CSZ-3);

  // Wall degradation: Turn dead-ends into loops.
  // The user wants it dense, so only remove ~22% of separating walls.
  for (let y = 1; y < CSZ-1; y++) {
    for (let x = 1; x < CSZ-1; x++) {
      if (!m[y][x]) { // if it's a wall
        const horiz = m[y][x-1] && m[y][x+1] && !m[y-1][x] && !m[y+1][x];
        const vert = m[y-1][x] && m[y+1][x] && !m[y][x-1] && !m[y][x+1];
        if ((horiz || vert) && prng.next() < 0.22) {
          m[y][x] = true;
        }
      }
    }
  }

  // Ensure borders are open to connect chunks seamlessly.
  for (let i = 1; i < CSZ-1; i+=2) {
    m[0][i] = true; 
    m[CSZ-1][i] = true; 
    m[i][0] = true; 
    m[i][CSZ-1] = true; 
  }
  
  // Occasional scattered small rooms/pillars
  const numRooms = 1 + Math.floor(prng.next() * 2);
  for(let i=0; i<numRooms; i++) {
    const rx = 2 + Math.floor(prng.next() * (CSZ - 6));
    const ry = 2 + Math.floor(prng.next() * (CSZ - 6));
    for(let r=ry; r<ry+3; r++) {
      for(let c=rx; c<rx+3; c++) {
        m[r][c] = true; // Open room
      }
    }
    if (prng.next() < 0.6) m[ry+1][rx+1] = false; // Add central pillar
  }

  // Force spawn lobby if this is chunk (0,0)
  if (cx === 0 && cz === 0) {
    for(let y=10; y<=14; y++) {
      for(let x=10; x<=14; x++) {
        m[y][x] = true;
      }
    }
  }
  
  return { m, prng };
}

function mergeBatch(geos,mat){
  if(geos.length===0) return null;
  let n=0;for(const g of geos)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),IDX=[];
  let off=0;
  for(const g of geos){
    const cnt=g.attributes.position.count;
    P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);
    U.set(g.attributes.uv.array,off*2);
    const gi=g.index?.array;
    if(gi)for(let i=0;i<gi.length;i++)IDX.push(gi[i]+off);
    else for(let i=0;i<cnt;i++)IDX.push(i+off);
    off+=cnt;g.dispose();
  }
  const bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.BufferAttribute(P,3));
  bg.setAttribute('normal',new THREE.BufferAttribute(N,3));
  bg.setAttribute('uv',new THREE.BufferAttribute(U,2));
  bg.setIndex(IDX);return new THREE.Mesh(bg,mat);
}

function buildChunk(cx, cz) {
  const key = getChunkKey(cx, cz);
  if (!chunkData.has(key)) chunkData.set(key, generateChunkData(cx, cz));
  const {m, prng} = chunkData.get(key);

  const chunkGroup = new THREE.Group();
  const chunkFixtures = [];

  const wg=[], fg=[], cg=[], trg=[];
  const offsetX = cx * CSZ * CELL;
  const offsetZ = cz * CSZ * CELL;

  for(let row=0;row<CSZ;row++){
    for(let col=0;col<CSZ;col++){
      if(!m[row][col])continue;
      const lx = col*CELL+CELL/2, lz = row*CELL+CELL/2;
      const wx = offsetX + lx, wz = offsetZ + lz;

      // Floor & Ceiling
      const gf=new THREE.PlaneGeometry(CELL,CELL);gf.rotateX(-Math.PI/2);gf.translate(wx,0,wz);fg.push(gf);
      const gc=new THREE.PlaneGeometry(CELL,CELL);gc.rotateX(Math.PI/2);gc.translate(wx,WH,wz);cg.push(gc);

      // Walls
      const wall=(x,z,ry)=>{
        const g=new THREE.PlaneGeometry(CELL,WH);g.rotateY(ry);g.translate(x,WH/2,z);wg.push(g);
      };
      
      // Determine if neighbors in current chunk are walls. If on border, check adjacent chunk data (lazy init if needed).
      const getM = (r, c) => {
        if (r>=0 && r<CSZ && c>=0 && c<CSZ) return m[r][c];
        // Border checking
        const nx = cx + (c<0 ? -1 : (c>=CSZ ? 1 : 0));
        const nz = cz + (r<0 ? -1 : (r>=CSZ ? 1 : 0));
        const nk = getChunkKey(nx, nz);
        if (!chunkData.has(nk)) chunkData.set(nk, generateChunkData(nx, nz));
        const nm = chunkData.get(nk).m;
        return nm[(r+CSZ)%CSZ][(c+CSZ)%CSZ];
      };

      if(!getM(row-1,col)) wall(wx, wz-CELL/2, 0);
      if(!getM(row+1,col)) wall(wx, wz+CELL/2, Math.PI);
      if(!getM(row,col-1)) wall(wx-CELL/2, wz, Math.PI/2);
      if(!getM(row,col+1)) wall(wx+CELL/2, wz, -Math.PI/2);
    }
  }

  const mW = currentLevel === -1 ? matWHWall : matW;
  const mF = currentLevel === -1 ? matWHFloor : matF;
  const mC = currentLevel === -1 ? matWHCeil : matC;
  const mw=mergeBatch(wg,mW), mf=mergeBatch(fg,mF), mc=mergeBatch(cg,mC), mt=mergeBatch(trg,trimMat);
  if(mw) chunkGroup.add(mw);
  if(mf) chunkGroup.add(mf);
  if(mc) chunkGroup.add(mc);
  if(mt) chunkGroup.add(mt);

  /* — Props & Lights — */
  if (currentLevel === -1) {
    // WAREHOUSE LIGHTS: sparse hanging industrial pendants
    for(let row=2;row<CSZ;row+=5){
      for(let col=2;col<CSZ;col+=5){
        if(!m[row][col] || prng.next() < 0.35) continue;
        const wx = offsetX + col*CELL+CELL/2;
        const wz = offsetZ + row*CELL+CELL/2;
        const dead = prng.next() < 0.3; // 30% dead lights — very dark
        const swaying = !dead && prng.next() < 0.2;
        // Hanging chain/wire
        const chainLen = 1.5 + prng.next() * 2.5;
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,chainLen,4), whPipeMat);
        chain.position.set(wx, WH - chainLen/2, wz);
        chunkGroup.add(chain);
        // Pendant shade (cone)
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 8, 1, true), whPendantMat);
        shade.position.set(wx, WH - chainLen - 0.12, wz);
        shade.rotation.x = Math.PI; // flip upside down
        chunkGroup.add(shade);
        // Bulb
        const bulbColor = dead ? 0x020204 : 0x8899bb;
        const eMat = new THREE.MeshStandardMaterial({color:bulbColor, emissive:bulbColor, emissiveIntensity:dead?0.02:0.85, roughness:0.3});
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), eMat);
        bulb.position.set(wx, WH - chainLen - 0.08, wz);
        chunkGroup.add(bulb);
        if(!dead){
          chunkFixtures.push({
            pos: new THREE.Vector3(wx, WH - chainLen - 0.1, wz),
            eMat: eMat,
            base: .4+prng.next()*.3,
            wSpd: 0.8+prng.next()*1.5,
            wPha: prng.next()*Math.PI*2,
            wAmp: .12,
            doFlick: prng.next()<.35, // more flickering in warehouse
            flickOn: false,
            flickCD: 2+prng.next()*6,
            flickDur: 0,
            intensity: 0.9,
            swaying: swaying,
            swayParent: shade,
            swayBulb: bulb,
            swayChain: chain,
            swayBaseX: wx,
            swayBaseZ: wz,
            swaySpeed: 0.3+prng.next()*0.5,
            swayPhase: prng.next()*Math.PI*2
          });
        }
      }
    }
    // WAREHOUSE PROPS: concrete pillars (visual), metal shelving, pipes
    for(let row=3;row<CSZ-2;row+=5){
      for(let col=3;col<CSZ-2;col+=5){
        if(m[row][col]) continue; // this is a pillar cell (blocked)
        const wx = offsetX + col*CELL+CELL/2;
        const wz = offsetZ + row*CELL+CELL/2;
        // Visual concrete pillar
        const pH = WH;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, pH, 1.2), whPillarMat);
        pillar.position.set(wx, pH/2, wz);
        chunkGroup.add(pillar);
      }
    }
    // Metal shelving units along walls
    for(let i=0; i<4; i++) {
      const row = 1+Math.floor(prng.next()*(CSZ-2)), col = 1+Math.floor(prng.next()*(CSZ-2));
      if(!m[row][col]) continue;
      const wx = offsetX + col*CELL+CELL/2;
      const wz = offsetZ + row*CELL+CELL/2;
      // Shelf frame
      const shelfH = 2.0 + prng.next()*1.5;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, shelfH, 0.6), whShelfMat);
      shelf.position.set(wx, shelfH/2, wz);
      shelf.rotation.y = prng.next()*Math.PI;
      chunkGroup.add(shelf);
      // Shelf levels
      for(let s=0; s<3; s++){
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.55), whShelfMat);
        plank.position.set(wx, 0.5 + s*0.65, wz);
        plank.rotation.y = shelf.rotation.y;
        chunkGroup.add(plank);
      }
    }
    // Ceiling pipes running across
    for(let i=0; i<3; i++) {
      const row = Math.floor(prng.next()*CSZ);
      const wx1 = offsetX;
      const wx2 = offsetX + CSZ*CELL;
      const wz = offsetZ + row*CELL+CELL/2;
      const pipeR = 0.06 + prng.next()*0.06;
      const pLen = CSZ*CELL;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipeR,pipeR,pLen,6), whPipeMat);
      pipe.rotation.z = Math.PI/2;
      pipe.position.set(offsetX + pLen/2, WH - 0.3 - prng.next()*0.5, wz);
      chunkGroup.add(pipe);
    }
    // Floor puddles (reflective dark patches)
    for(let i=0; i<4; i++) {
      const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
      if(!m[row][col]) continue;
      const wx = offsetX + col*CELL+CELL/2;
      const wz = offsetZ + row*CELL+CELL/2;
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.8+prng.next()*1.2, 12), whPuddleMat);
      puddle.rotation.x = -Math.PI/2;
      puddle.position.set(wx + (prng.next()-.5)*2, 0.005, wz + (prng.next()-.5)*2);
      chunkGroup.add(puddle);
    }
  } else {
  // LEVEL 0 LIGHTS & PROPS (original)
  const tubeGeo=new THREE.BoxGeometry(1.2,0.04,0.10);
  for(let row=1;row<CSZ;row+=3){
    for(let col=1;col<CSZ;col+=3){
      if(!m[row][col] || prng.next() < 0.2) continue;
      const wx = offsetX + col*CELL+CELL/2;
      const wz = offsetZ + row*CELL+CELL/2;
      
      // Ceiling Vents
      if(prng.next() < 0.12) {
        const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), ventMat);
        vent.rotation.x = Math.PI/2;
        vent.position.set(wx, WH-0.005, wz);
        chunkGroup.add(vent);
        continue;
      }
      
      const dead = prng.next() < 0.12;
      const brokenHanging = !dead && prng.next() < 0.08;
      
      const housing=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.025,0.16),housingMat);
      housing.position.set(wx,WH-.005,wz); 
      
      const eMat=new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xfff6d0,emissiveIntensity:dead?0.03:0.92,roughness:.6});
      const tube=new THREE.Mesh(tubeGeo,eMat);tube.position.set(wx,WH-.025,wz);
      
      if(brokenHanging) {
        housing.rotation.z = Math.PI/5.5;
        housing.position.y -= 0.15;
        housing.position.x += 0.2;
        tube.rotation.z = Math.PI/5.5;
        tube.position.y -= 0.15;
        tube.position.x += 0.2;
      }
      
      chunkGroup.add(housing);
      chunkGroup.add(tube);
      
      if(!dead){
        const lightY = brokenHanging ? WH - 0.28 : WH - 0.13;
        chunkFixtures.push({
          pos: new THREE.Vector3(wx, lightY, wz),
          eMat: eMat,
          base: .88+prng.next()*.55,
          wSpd: 1.4+prng.next()*3.5,
          wPha: prng.next()*Math.PI*2,
          wAmp: .055,
          doFlick: prng.next()<.15,
          flickOn: false,
          flickCD: 3+prng.next()*10,
          flickDur: 0,
          intensity: 1.35
        });
      }
    }
  }

  // Cabinets
  for(let i=0; i<6; i++) {
    const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
    if(m[row][col] && prng.next() < 0.6) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.6), cabinetMat);
      cab.position.set(offsetX + col*CELL+CELL/2+(prng.next()-.5)*CELL*.6, 0.7, offsetZ + row*CELL+CELL/2+(prng.next()-.5)*CELL*.6);
      cab.rotation.y = prng.next()*Math.PI*2;
      chunkGroup.add(cab);
    }
  }

  // Boxes
  for(let i=0; i<5; i++) {
    const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
    if(m[row][col]) {
      const w=.35+prng.next()*.5, d=.3+prng.next()*.4, h=.25+prng.next()*.45;
      const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),boxMat);
      box.position.set(offsetX + col*CELL+CELL/2+(prng.next()-.5)*CELL*.6, h/2, offsetZ + row*CELL+CELL/2+(prng.next()-.5)*CELL*.6);
      box.rotation.y = prng.next()*Math.PI*2;
      chunkGroup.add(box);
    }
  }
  } // end level branch

  scene.add(chunkGroup);
  activeChunks.set(key, {group: chunkGroup, fixtures: chunkFixtures});
  globalFixtures.push(...chunkFixtures);
}

function updateChunks(playerX, playerZ) {
  const pChunkX = Math.floor(playerX / (CSZ * CELL));
  const pChunkZ = Math.floor(playerZ / (CSZ * CELL));
  const radius = 1; // load 3x3 chunks around player (fog is 30m, chunk is 96m)

  const needed = new Set();
  for(let dz=-radius; dz<=radius; dz++){
    for(let dx=-radius; dx<=radius; dx++){
      needed.add(getChunkKey(pChunkX+dx, pChunkZ+dz));
    }
  }

  // Unload old chunks
  for (const [key, chunk] of activeChunks.entries()) {
    if (!needed.has(key)) {
      scene.remove(chunk.group);
      globalFixtures = globalFixtures.filter(f => !chunk.fixtures.includes(f));
      activeChunks.delete(key);
    }
  }

  // Load new chunks
  for (const key of needed) {
    if (!activeChunks.has(key)) {
      const [cx, cz] = key.split(',').map(Number);
      buildChunk(cx, cz);
    }
  }
}

/* ═══════ AMBIENT & LIGHT POOL ═══════ */
scene.add(new THREE.AmbientLight(0xd4aa18,.30));
scene.add(new THREE.HemisphereLight(0xd4a010,0x5a4800,.20));

const lightPool = [];
for(let i=0; i<16; i++) {
  const pl = new THREE.PointLight(0xd4aa28, 0, 14, 1.7);
  pl._baseColor = new THREE.Color(0xd4aa28);
  scene.add(pl);
  lightPool.push(pl);
}

/* ═══════ ENTITY / MONSTER ═══════ */
class Entity{
  constructor(){
    this.group=new THREE.Group();
    scene.add(this.group);
    this.setVisuals(0);
    this.pos=new THREE.Vector2();
    this.dir=new THREE.Vector2(1,0);
    this.speed=1.8;
    this.chaseSpeed=4.5;
    this.state='wander';
    this.stateTimer=0;
    this.lastGrowl=0;
    setTimeout(() => this._spawn(camera.position), 500); // Spawn relatively to player
  }
    
  setVisuals(lvl) {
    while(this.group.children.length > 0){ 
      this.group.remove(this.group.children[0]); 
    }
    
    if (lvl === 0) {
      const bodyMat=new THREE.MeshLambertMaterial({color:0x0a0a0a});
      const shadowMat=new THREE.MeshLambertMaterial({color:0x0a0a0a,transparent:true,opacity:.85});
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.4,1.1,.25),bodyMat); torso.position.y=1.3;this.group.add(torso);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),bodyMat); head.position.y=2.05;head.scale.y=1.3;this.group.add(head);
      const eyeMat=new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff2200,emissiveIntensity:0.8});
      const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeL.position.set(-.06,2.08,.15);this.group.add(eyeL);
      const eyeR=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeR.position.set(.06,2.08,.15);this.group.add(eyeR);
      const armL=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armL.position.set(-.3,1.1,0);armL.rotation.z=.08;this.group.add(armL);
      const armR=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armR.position.set(.3,1.1,0);armR.rotation.z=-.08;this.group.add(armR);
      const legL=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legL.position.set(-.1,.4,0);this.group.add(legL);
      const legR=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legR.position.set(.1,.4,0);this.group.add(legR);
      this.glow=new THREE.PointLight(0xff1100,.3,8,2); this.glow.position.y=1.8;this.group.add(this.glow);
      this.arms=[armL,armR]; this.legs=[legL,legR];
    } else if (lvl === -1) {
      // The Smiler
      const cloudMat=new THREE.MeshLambertMaterial({color:0x000000, transparent:true, opacity:0.95});
      const cloud=new THREE.Mesh(new THREE.SphereGeometry(.5,16,16),cloudMat); cloud.position.y=1.8;
      this.group.add(cloud);
      const eyeMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1.0});
      const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eyeMat); eyeL.position.set(-.15,1.9,.45);this.group.add(eyeL);
      const eyeR=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eyeMat); eyeR.position.set(.15,1.9,.45);this.group.add(eyeR);
      const smile=new THREE.Mesh(new THREE.TorusGeometry(.2,.03,8,16,Math.PI),eyeMat);
      smile.position.set(0,1.7,.45); smile.rotation.z=Math.PI; this.group.add(smile);
      this.glow=new THREE.PointLight(0xffffff,.5,12,2); this.glow.position.y=1.8;this.group.add(this.glow);
      this.arms=[]; this.legs=[];
    }
  }
  _spawn(playerPos){
    if(!playerPos) return;
    for(let i=0; i<100; i++) {
      const dist = 30 + Math.random()*30; // 30-60m away
      const angle = Math.random() * Math.PI * 2;
      const nx = playerPos.x + Math.cos(angle) * dist;
      const nz = playerPos.z + Math.sin(angle) * dist;
      
      if(this._canWalk(nx, nz)){
        this.pos.set(nx, nz);
        this.group.position.set(this.pos.x, 0, this.pos.y);
        this.state = 'wander';
        this.dir.set(1, 0);
        return;
      }
    }
    // Fallback if no valid spot found in 100 tries
    this.pos.set(playerPos.x+10, playerPos.z+10);
    this.group.position.set(this.pos.x, 0, this.pos.y);
  }
  _canWalk(wx,wz){
    return isWalkable(wx, wz);
  }
  _pickWanderDir(){
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-.5);
    for(const[dx,dz]of dirs){
      if(this._canWalk(this.pos.x+dx*CELL,this.pos.y+dz*CELL)){this.dir.set(dx,dz);return;}
    }
  }
  update(dt,time,playerPos){
    const toPlayer=new THREE.Vector2(playerPos.x-this.pos.x,playerPos.z-this.pos.y);
    const dist=toPlayer.length();

    // If too far, despawn and respawn closer (keep up with player in infinite world)
    if (dist > 150) { this._spawn(playerPos); return dist; }

    if(dist<18&&this.state!=='chase'){this.state='chase';this.stateTimer=0;}
    else if(dist>28&&this.state==='chase'){this.state='wander';this.stateTimer=0;this._pickWanderDir();}
    if(dist<20&&time-this.lastGrowl>6){this.lastGrowl=time;sfx.growl();}

    this.stateTimer+=dt;
    let spd=0;
    if(this.state==='wander'){
      spd=this.speed;
      if(this.stateTimer>2+Math.random()*3){this.stateTimer=0;this._pickWanderDir();}
      const nx=this.pos.x+this.dir.x*spd*dt, nz=this.pos.y+this.dir.y*spd*dt;
      if(this._canWalk(nx,nz)){this.pos.set(nx,nz);}else{this._pickWanderDir();this.stateTimer=0;}
    }else if(this.state==='chase'){
      spd=this.chaseSpeed;
      if(dist>1){
        const d=toPlayer.normalize();
        const nx=this.pos.x+d.x*spd*dt, nz=this.pos.y+d.y*spd*dt;
        if(this._canWalk(nx,nz)){this.pos.set(nx,nz);}
        else{
          if(this._canWalk(nx,this.pos.y))this.pos.x=nx;
          else if(this._canWalk(this.pos.x,nz))this.pos.y=nz;
        }
      }
    }

    this.group.position.x=this.pos.x; this.group.position.z=this.pos.y;
    if(this.state==='chase'&&dist>1) this.group.rotation.y=Math.atan2(toPlayer.x,toPlayer.y);
    else if(this.dir.lengthSq()>0) this.group.rotation.y=Math.atan2(this.dir.x,this.dir.y);

    const walkCycle=Math.sin(time*8)*.25*(spd>0?1:0);
    if(this.arms.length>0){this.arms[0].rotation.x=walkCycle; this.arms[1].rotation.x=-walkCycle;}
    if(this.legs.length>0){this.legs[0].rotation.x=-walkCycle; this.legs[1].rotation.x=walkCycle;}
    this.group.children[0].rotation.z=Math.sin(time*3)*.02;
    this.glow.intensity=.2+Math.sin(time*2)*.1+(this.state==='chase'?.15:0);

    const warnEl=document.getElementById('warn');
    if(dist<12) warnEl.style.opacity=Math.min(1,(12-dist)/8)*.35;
    else warnEl.style.opacity='0';
    return dist;
  }
}
const entity=new Entity();

/* ═══════ COLLISION ═══════ */
const RAD=.36;
function isWalkable(wx, wz) {
  const cx = Math.floor(wx / (CSZ * CELL));
  const cz = Math.floor(wz / (CSZ * CELL));
  const key = getChunkKey(cx, cz);
  if (!chunkData.has(key)) chunkData.set(key, generateChunkData(cx, cz));
  const m = chunkData.get(key).m;
  const lx = Math.floor((wx - cx * CSZ * CELL) / CELL);
  const lz = Math.floor((wz - cz * CSZ * CELL) / CELL);
  if(lx>=0 && lx<CSZ && lz>=0 && lz<CSZ) return m[lz][lx];
  return false;
}

function slide(ox,oz,nx,nz){
  if(isWalkable(nx-RAD,nz)&&isWalkable(nx+RAD,nz)&&isWalkable(nx,nz-RAD)&&isWalkable(nx,nz+RAD))return[nx,nz];
  if(isWalkable(nx-RAD,oz)&&isWalkable(nx+RAD,oz))return[nx,oz];
  if(isWalkable(ox,nz-RAD)&&isWalkable(ox,nz+RAD))return[ox,nz];
  return[ox,oz];
}

/* ═══════ POINTER LOCK ═══════ */
const overlayEl=document.getElementById('overlay');
const pauseEl=document.getElementById('pause');
let locked=false,gameStarted=false,yaw=0,pitch=0;

function doLock(){renderer.domElement.requestPointerLock();}
document.getElementById('startBtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();gameStarted=true;gameState='playing';doLock();});
overlayEl.addEventListener('click',()=>{if(!gameStarted) return; sfx.init();gameStarted=true;gameState='playing';doLock();});
document.getElementById('resumeBtn').addEventListener('click',()=>{pauseEl.style.display='none';doLock();});
document.getElementById('menuBtn').addEventListener('click',()=>{pauseEl.style.display='none';gameStarted=false;overlayEl.style.display='flex';});
document.getElementById('respawnBtn').addEventListener('click',()=>{
  document.getElementById('deathScreen').style.display='none';
  document.body.classList.remove('is-dead');
  gameState='playing';
  loadLevel(currentLevel);
  doLock();
});
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===renderer.domElement;
  if(locked){overlayEl.style.display='none';pauseEl.style.display='none';if(sfx.ctx&&sfx.ctx.state==='suspended')sfx.ctx.resume();}
  else if(gameStarted){pauseEl.style.display='flex';}
});
document.addEventListener('mousemove',e=>{
  if(!locked)return;
  const sens=.001+SET.sensScale*.00025;
  yaw-=e.movementX*sens;pitch-=e.movementY*sens;
  pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));
});

const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});


/* ═══════ LEVEL LOGIC ═══════ */
function loadLevel(lvl) {
  if (lvl === -1) {
    flashOverlay.style.opacity = '1';
    setTimeout(() => { flashOverlay.style.opacity = '0'; }, 2000);
  }
  currentLevel = lvl;
  levelTime = 0;
  
  // Clear chunks
  for (const [key, chunk] of activeChunks.entries()) {
    scene.remove(chunk.group);
  }
  activeChunks.clear();
  chunkData.clear();
  globalFixtures = [];

  if (lvl === 0) {
    scene.fog.color.setHex(0x0a0800);
    scene.fog.density = 0.046; // Reset fog density
    scene.background.setHex(0x0a0800);
    scene.children.forEach(c => {
      if(c instanceof THREE.AmbientLight) c.color.setHex(0xd4aa18);
      if(c instanceof THREE.HemisphereLight) { c.color.setHex(0xd4a010); c.groundColor.setHex(0x5a4800); }
    });
    // Reset light pool colors to warm yellow
    lightPool.forEach(pl => pl.color.setHex(0xd4aa28));
    entity.speed = 1.8;
    entity.chaseSpeed = 4.6;
    WH = 2.72;
  } else if (lvl === -1) {
    scene.fog.color.setHex(0x010108);
    scene.fog.density = 0.04;
    scene.background.setHex(0x010108);
    scene.children.forEach(c => {
      if(c instanceof THREE.AmbientLight) c.color.setHex(0x0a0e18);
      if(c instanceof THREE.HemisphereLight) { c.color.setHex(0x0a1020); c.groundColor.setHex(0x020205); }
    });
    // Switch light pool to cold blue-white
    lightPool.forEach(pl => pl.color.setHex(0x6688aa));
    entity.speed = 2.5;
    entity.chaseSpeed = 5.2;
    WH = 8.0; // Tall warehouse ceiling
  }
  
  // Update entity visuals for the new level
  entity.setVisuals(lvl);
  
  // Reset player position
  camera.position.set(48, 1.64, 48);
  // Respawn entity far away, then let it find a valid spot
  entity.pos.set(-1000, -1000);
  entity.group.position.set(-1000, 0, -1000);
  entity.state = 'wander';
  entity._pickWanderDir();
  
  updateChunks(camera.position.x, camera.position.z);
  
  // Delayed respawn so chunks are loaded first
  setTimeout(() => entity._spawn(camera.position), 600);
}

/* ═══════ SETTINGS ═══════ */
function bindS(id,vid,init,suf,cb){
  const el=document.getElementById(id),vl=document.getElementById(vid);
  el.value=init;vl.textContent=init+suf;
  el.addEventListener('input',()=>{const v=+el.value;vl.textContent=v+suf;cb(v);});
}
bindS('sFov','vFov',82,'\u00b0',v=>{SET.fov=v;camera.fov=v;camera.updateProjectionMatrix();});
bindS('sFog','vFog',30,'m',v=>{SET.fogFar=v;scene.fog.density=.046*(30/v);});
bindS('sSens','vSens',5,'',v=>{SET.sensScale=v;});
bindS('sVol','vVol',85,'',v=>{SET.volume=v/100;if(sfx.master)sfx.master.gain.value=v/100;});
document.getElementById('tGrain').addEventListener('change',function(){SET.grain=this.checked;grainCv.style.opacity=SET.grain?'.032':'0';});
document.getElementById('tVig').addEventListener('change',function(){SET.vignette=this.checked;document.getElementById('vignette').style.opacity=SET.vignette?'1':'0';});
document.getElementById('tBob').addEventListener('change',function(){SET.bobbing=this.checked;});

/* ═══════ GAME LOOP ═══════ */
const cxEl=document.getElementById('cx'),czEl=document.getElementById('cz');
const clock=new THREE.Clock();
let bobT=0,bobA=0;
const _fwd=new THREE.Vector3(),_rgt=new THREE.Vector3(),_mv=new THREE.Vector3();

// Initial chunk update
updateChunks(camera.position.x, camera.position.z);

(function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;

  // Level -1 Timer
  if (locked) {
    levelTime += dt;
    if (currentLevel === 0) {
      const timeLimit = 180; // 3 minutes
      if (Math.floor(levelTime) > Math.floor(levelTime - dt)) {
        console.log(`Time until Level -1: ${timeLimit - Math.floor(levelTime)}s`);
      }
      if (levelTime >= timeLimit) {
        loadLevel(-1);
      }
    }
  }

  let moving=false,sprint=false;
  if(locked){
    sprint=keys['ShiftLeft']||keys['ShiftRight'];
    const spd=sprint?5.0:2.5;
    _fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));
    _rgt.set(Math.cos(yaw),0,-Math.sin(yaw));
    _mv.set(0,0,0);
    if(keys['KeyW']||keys['ArrowUp'])_mv.addScaledVector(_fwd,1);
    if(keys['KeyS']||keys['ArrowDown'])_mv.addScaledVector(_fwd,-1);
    if(keys['KeyA']||keys['ArrowLeft'])_mv.addScaledVector(_rgt,-1);
    if(keys['KeyD']||keys['ArrowRight'])_mv.addScaledVector(_rgt,1);
    if(_mv.lengthSq()>0){
      moving=true;_mv.normalize().multiplyScalar(spd*dt);
      const[rx,rz]=slide(camera.position.x,camera.position.z,camera.position.x+_mv.x,camera.position.z+_mv.z);
      camera.position.x=rx;camera.position.z=rz;
      
      // Infinite chunk loading updates
      updateChunks(camera.position.x, camera.position.z);
    }
  }

  if(moving&&SET.bobbing){bobT+=dt*(sprint?2.8:1.85);bobA=THREE.MathUtils.lerp(bobA,1,dt*10);}
  else{bobA=THREE.MathUtils.lerp(bobA,0,dt*8);}
  camera.position.y=1.64+Math.sin(bobT*Math.PI*2)*.036*bobA;
  camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));

  // Fixture flicker logic (update all fixtures)
  for(let i=0;i<globalFixtures.length;i++){
    const fd = globalFixtures[i];
    const base = fd.base + Math.sin(time*fd.wSpd+fd.wPha)*fd.wAmp;
    if(fd.doFlick){
      if(!fd.flickOn){
        fd.flickCD-=dt; fd.intensity=base;
        if(fd.flickCD<=0){fd.flickOn=true;fd.flickDur=.08+Math.random()*.55;sfx.buzz(Math.min(fd.flickDur*.5,.3));fd.flickCD=2.5+Math.random()*14;}
      } else {
        fd.intensity=(Math.random()<.45)?.03:base*.9;
        fd.flickDur-=dt;
        if(fd.flickDur<=0){fd.flickOn=false;fd.intensity=base;}
      }
    }else{fd.intensity=base;}
    if(fd.eMat) fd.eMat.emissiveIntensity = THREE.MathUtils.clamp(fd.intensity*.72, 0, 1);
    // Warehouse swaying lights
    if(fd.swaying && fd.swayParent){
      const sway = Math.sin(time*fd.swaySpeed+fd.swayPhase)*0.4;
      fd.swayParent.position.x = fd.swayBaseX + sway;
      fd.swayBulb.position.x = fd.swayBaseX + sway;
      fd.pos.x = fd.swayBaseX + sway;
    }
  }

  // Light Pool Management (bind lights to closest fixtures)
  globalFixtures.forEach(f => f.distSq = f.pos.distanceToSquared(camera.position));
  globalFixtures.sort((a,b) => a.distSq - b.distSq);
  
  for(let i=0; i<lightPool.length; i++) {
    const pl = lightPool[i];
    if (i < globalFixtures.length && globalFixtures[i].distSq < 900) { // Within 30m
      const f = globalFixtures[i];
      pl.position.copy(f.pos);
      pl.intensity = f.intensity;
    } else {
      pl.intensity = 0; // Turn off unused pool lights
    }
  }

  // Entity
  entity.update(dt,time,camera.position);

  sfx.step(dt,moving,sprint);
  tickGrain();
  const lvlTr = document.getElementById('hud-tr');
  if (currentLevel === 0) {
    const timeLeft = Math.max(0, 180 - Math.floor(levelTime));
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    lvlTr.textContent = `LEVEL 0 [${m}:${s.toString().padStart(2, '0')}]`;
  } else {
    lvlTr.textContent = `LEVEL -1`;
  }
  cxEl.textContent=camera.position.x.toFixed(1);
  czEl.textContent=camera.position.z.toFixed(1);
  renderer.render(scene,camera);
})();
