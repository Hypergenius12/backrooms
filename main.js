import * as THREE from 'three';

const SET={fov:82,sensScale:5,volume:0.85,fogFar:30,grain:true,vignette:true,bobbing:true};

/* ═══════ RENDERER ═══════ */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.domElement.id='three';
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x100d00);
scene.fog=new THREE.FogExp2(0x100d00,0.046);

const camera=new THREE.PerspectiveCamera(SET.fov,innerWidth/innerHeight,0.05,80);
camera.position.set(6,1.64,6);

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
  _schedDist(){setTimeout(()=>{this._distant();this._schedDist();},8000+Math.random()*35000);}
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

function mkFloor(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#8a7a3c';c.fillRect(0,0,S,S);
  for(let i=0;i<S*S*.4;i++){
    const x=Math.random()*S,y=Math.random()*S;
    const len=.8+Math.random()*2.2,a=Math.random()*Math.PI*2;
    const v=(Math.random()-.5)*38;
    c.strokeStyle=`rgba(${72+v|0},${56+v|0},${10+v|0},.24)`;
    c.lineWidth=.5;c.beginPath();c.moveTo(x,y);
    c.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();
  }
  for(let i=0;i<22;i++){
    const x=Math.random()*S,y=Math.random()*S,r=2+Math.random()*14;
    const g2=c.createRadialGradient(x,y,0,x,y,r);
    g2.addColorStop(0,'rgba(26,16,0,.22)');g2.addColorStop(1,'rgba(26,16,0,0)');
    c.fillStyle=g2;c.fillRect(x-r,y-r,r*2,r*2);
  }
  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,6);return t;
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

const matW=new THREE.MeshLambertMaterial({map:realWallTex,side:THREE.DoubleSide});
const matF=new THREE.MeshLambertMaterial({map:mkFloor()});
const matC=new THREE.MeshLambertMaterial({map:mkCeil()});
const boxMat=new THREE.MeshLambertMaterial({map:mkCardboard()});
const pipeMat=new THREE.MeshLambertMaterial({color:0x707058});
const housingMat=new THREE.MeshLambertMaterial({color:0x555544});

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
const CSZ=24, CELL=4, WH=2.72; // 24x24 cells per chunk
const chunkData = new Map();
const activeChunks = new Map();
let globalFixtures = [];

function getChunkKey(cx, cz) { return `${cx},${cz}`; }

function generateChunkData(cx, cz) {
  const prng = new PRNG((cx * 73856093 ^ cz * 19349663) >>> 0);
  const m = Array.from({length: CSZ}, () => new Array(CSZ).fill(false));
  
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
  
  // Starting points for carving
  carve(2, 2);
  carve(CSZ-3, CSZ-3);

  const open=(rx,ry,w,h)=>{for(let y=ry;y<ry+h&&y<CSZ;y++)for(let x=rx;x<rx+w&&x<CSZ;x++)if(y>0&&x>0&&y<CSZ-1&&x<CSZ-1)m[y][x]=true;};
  
  // Add large rooms randomly
  for(let i=0; i<6; i++) {
    let rw = 5 + Math.floor(prng.next() * 6);
    let rh = 5 + Math.floor(prng.next() * 6);
    let rx = 1 + Math.floor(prng.next() * (CSZ - rw - 2));
    let ry = 1 + Math.floor(prng.next() * (CSZ - rh - 2));
    open(rx, ry, rw, rh);
  }

  // Widen passages
  const copy=m.map(r=>[...r]);
  for(let y=1;y<CSZ-1;y++){
    for(let x=1;x<CSZ-1;x++){
      if(copy[y][x] && prng.next() < 0.4){
        if(x+1<CSZ-1)m[y][x+1]=true;
        if(y+1<CSZ-1)m[y+1][x]=true;
      }
    }
  }

  // Add isolated pillars
  for(let y=2;y<CSZ-2;y+=3){
    for(let x=2;x<CSZ-2;x+=3){
      let open_count=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(m[y+dy][x+dx])open_count++;
      if(open_count>=8 && prng.next()<.25) m[y][x]=false;
    }
  }

  // Guarantee openings on borders so chunks always connect!
  const mid = Math.floor(CSZ/2);
  for(let i=-2; i<=2; i++) {
    m[0][mid+i] = true; m[1][mid+i] = true; // North
    m[CSZ-1][mid+i] = true; m[CSZ-2][mid+i] = true; // South
    m[mid+i][0] = true; m[mid+i][1] = true; // West
    m[mid+i][CSZ-1] = true; m[mid+i][CSZ-2] = true; // East
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

  const chunkFixtures = [];

  const wg=[], fg=[], cg=[];
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
      const wall=(x,z,ry)=>{const g=new THREE.PlaneGeometry(CELL,WH);g.rotateY(ry);g.translate(x,WH/2,z);wg.push(g);};
      
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

  const mw=mergeBatch(wg,matW), mf=mergeBatch(fg,matF), mc=mergeBatch(cg,matC);
  if(mw) chunkGroup.add(mw);
  if(mf) chunkGroup.add(mf);
  if(mc) chunkGroup.add(mc);

  /* — Props & Lights — */
  const tubeGeo=new THREE.BoxGeometry(1.2,0.04,0.10);
  for(let row=1;row<CSZ;row+=3){
    for(let col=1;col<CSZ;col+=3){
      if(!m[row][col] || prng.next() < 0.2) continue;
      const wx = offsetX + col*CELL+CELL/2;
      const wz = offsetZ + row*CELL+CELL/2;
      
      const dead = prng.next() < 0.12;
      const housing=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.025,0.16),housingMat);
      housing.position.set(wx,WH-.005,wz); chunkGroup.add(housing);

      const eMat=new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xfff6d0,emissiveIntensity:dead?0.03:0.92,roughness:.6});
      const tube=new THREE.Mesh(tubeGeo,eMat);tube.position.set(wx,WH-.025,wz);chunkGroup.add(tube);
      
      if(!dead){
        chunkFixtures.push({
          pos: new THREE.Vector3(wx, WH-.13, wz),
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

  // Boxes
  for(let i=0; i<4; i++) {
    const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
    if(m[row][col]) {
      const w=.35+prng.next()*.5, d=.3+prng.next()*.4, h=.25+prng.next()*.45;
      const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),boxMat);
      box.position.set(offsetX + col*CELL+CELL/2+(prng.next()-.5)*CELL*.5, h/2, offsetZ + row*CELL+CELL/2+(prng.next()-.5)*CELL*.5);
      box.rotation.y = prng.next()*Math.PI*2;
      chunkGroup.add(box);
    }
  }

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
  scene.add(pl);
  lightPool.push(pl);
}

/* ═══════ ENTITY / MONSTER ═══════ */
class Entity{
  constructor(){
    this.group=new THREE.Group();
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
    scene.add(this.group);
    
    this.pos=new THREE.Vector2();
    this.dir=new THREE.Vector2(1,0);
    this.speed=1.8;
    this.chaseSpeed=4.5;
    this.state='wander';
    this.stateTimer=0;
    this.lastGrowl=0;
    this._spawn();
  }
  _spawn(){
    // Spawn somewhat far from player
    this.pos.set(6 + (Math.random()>0.5?40:-40), 6 + (Math.random()>0.5?40:-40));
    this.group.position.set(this.pos.x,0,this.pos.y);
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
    if (dist > 150) { this._spawn(); return dist; }

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
    this.arms[0].rotation.x=walkCycle; this.arms[1].rotation.x=-walkCycle;
    this.legs[0].rotation.x=-walkCycle; this.legs[1].rotation.x=walkCycle;
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
document.getElementById('startBtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();gameStarted=true;doLock();});
overlayEl.addEventListener('click',()=>{sfx.init();gameStarted=true;doLock();});
document.getElementById('resumeBtn').addEventListener('click',()=>{pauseEl.style.display='none';doLock();});
document.getElementById('menuBtn').addEventListener('click',()=>{pauseEl.style.display='none';gameStarted=false;overlayEl.style.display='flex';});
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

  let moving=false,sprint=false;
  if(locked){
    sprint=keys['ShiftLeft']||keys['ShiftRight'];
    const spd=sprint?8.4:4.2;
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
  cxEl.textContent=camera.position.x.toFixed(1);
  czEl.textContent=camera.position.z.toFixed(1);
  renderer.render(scene,camera);
})();
