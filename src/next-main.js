import * as THREE from 'three';
import { GPUPyroEngine, FIREWORK_TYPES, PYRO_PALETTES } from './gpu-engine.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rr = (a,b) => a + Math.random()*(b-a);
const DURATION = 60;

const canvas = $('#stage');
const overlay = $('#entry');
const status = $('#gpuStatus');
let engine;
try {
  engine = new GPUPyroEngine(canvas);
  status.textContent = 'GPU COMPUTE · 512²';
  status.classList.add('ok');
} catch (error) {
  console.error(error);
  status.textContent = 'GPU INDISPONÍVEL';
  status.classList.add('bad');
  $('#entryError').textContent = 'Este modo requer WebGL2 + render targets float/half-float. Tente um navegador/driver atualizado.';
  $('#enter').disabled = true;
  throw error;
}

const defaultEvents = [
  [1.0,'cometa',-260,145,.8],[2.2,'cometa',260,155,.8],[4.0,'peony',-165,155,.85],[5.1,'peony',170,160,.9],
  [7.2,'anel',0,180,1.0],[9.0,'crisântemo',-245,175,1.05],[10.2,'crisântemo',235,175,1.05],[12.8,'pistilo',0,200,1.12],
  [15.0,'palmeira',-230,180,1.0],[16.4,'palmeira',220,185,1.0],[18.5,'coração',0,175,.95],[21.0,'willow',-145,210,1.08],
  [22.4,'willow',155,215,1.08],[25.0,'saturno',0,205,1.15],[27.3,'glitter',-280,160,1.0],[28.0,'glitter',0,170,1.0],[28.7,'glitter',280,165,1.0],
  [31.0,'espiral',-150,190,1.12],[32.0,'espiral',155,195,1.12],[34.5,'crossette',-260,175,1.15],[35.0,'crossette',0,190,1.15],[35.5,'crossette',260,178,1.15],
  [38.5,'kamuro',-200,220,1.18],[39.5,'kamuro',205,225,1.18],[42.5,'strobo',-280,180,1.2],[43.0,'strobo',0,205,1.25],[43.5,'strobo',275,185,1.2],
  [46.0,'duplo',-210,210,1.3],[46.8,'duplo',205,215,1.3],[49.0,'reveillon',-300,205,1.35],[49.5,'reveillon',0,230,1.45],[50.0,'reveillon',300,210,1.35],
  [53.0,'cascata',-260,115,1.15],[53.4,'cascata',-90,125,1.2],[53.8,'cascata',90,125,1.2],[54.2,'cascata',260,115,1.15],
  [56.0,'reveillon',-330,220,1.55],[56.35,'reveillon',-165,235,1.55],[56.7,'reveillon',0,250,1.7],[57.05,'reveillon',165,235,1.55],[57.4,'reveillon',330,220,1.55],
  [58.4,'kamuro',-180,240,1.45],[58.7,'kamuro',180,240,1.45],[59.1,'strobo',0,255,1.7]
];
let events = defaultEvents.map((e,i)=>({id:`e${i+1}`,time:e[0],type:e[1],x:e[2],height:e[3],intensity:e[4],palette:'reveillon'}));
let selectedType='peony',selectedPalette='reveillon',selectedEvent=null,playing=false,showTime=0,cursor=0,last=performance.now(),draggingView=false,moved=0,lx=0,ly=0,sound=true;

const typeGlyph = {peony:'✺','crisântemo':'✹',willow:'⌁',anel:'◉',palmeira:'✦',glitter:'⋆',strobo:'✧',cometa:'╱',coração:'♥',crossette:'✣',kamuro:'☄',pistilo:'⊙',duplo:'◎',reveillon:'✺',cascata:'⌇',espiral:'◌',saturno:'⊖'};

function buildLibrary(){
  const root=$('#shellLibrary');root.innerHTML='';
  for(const type of FIREWORK_TYPES){const b=document.createElement('button');b.className='shell-card';b.dataset.type=type;b.innerHTML=`<i>${typeGlyph[type]||'✦'}</i><span>${type}</span>`;b.onclick=()=>{selectedType=type;$$('.shell-card').forEach(x=>x.classList.toggle('active',x.dataset.type===type));};root.append(b);}root.querySelector('[data-type="peony"]').classList.add('active');
  const palettes=$('#paletteList');palettes.innerHTML='';for(const p of PYRO_PALETTES){const b=document.createElement('button');b.className='palette-chip';b.textContent=p;b.onclick=()=>{selectedPalette=p;$$('.palette-chip').forEach(x=>x.classList.toggle('active',x.textContent===p));};palettes.append(b);}palettes.firstElementChild.classList.add('active');
}

function formatTime(t){const s=Math.max(0,t);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}.${String(Math.floor((s%1)*10))}`;}

function renderTimeline(){
  const track=$('#eventTrack');track.querySelectorAll('.timeline-event').forEach(n=>n.remove());
  for(const ev of events){const el=document.createElement('button');el.className='timeline-event';el.dataset.id=ev.id;el.style.left=`${ev.time/DURATION*100}%`;el.style.setProperty('--energy',ev.intensity);el.title=`${ev.type} · ${ev.time.toFixed(1)}s`;el.innerHTML=`<span>${typeGlyph[ev.type]||'✦'}</span><b>${ev.type}</b>`;el.onclick=()=>selectEvent(ev.id);el.addEventListener('pointerdown',startEventDrag);track.append(el);}
}

function selectEvent(id){selectedEvent=events.find(e=>e.id===id)||null;$$('.timeline-event').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));const p=$('#eventInspector');if(!selectedEvent){p.classList.add('empty');return;}p.classList.remove('empty');$('#eventName').textContent=selectedEvent.type;$('#eventTime').value=selectedEvent.time;$('#eventHeight').value=selectedEvent.height;$('#eventIntensity').value=selectedEvent.intensity;syncInspectorOutputs();}

function syncInspectorOutputs(){if(!selectedEvent)return;$('#eventTimeOut').textContent=`${(+$('#eventTime').value).toFixed(1)} s`;$('#eventHeightOut').textContent=`${Math.round(+$('#eventHeight').value)} m`;$('#eventIntensityOut').textContent=(+$('#eventIntensity').value).toFixed(2);}

function updateSelected(){if(!selectedEvent)return;selectedEvent.time=+$('#eventTime').value;selectedEvent.height=+$('#eventHeight').value;selectedEvent.intensity=+$('#eventIntensity').value;syncInspectorOutputs();events.sort((a,b)=>a.time-b.time);renderTimeline();selectEvent(selectedEvent.id);resetCursor();}

function startEventDrag(e){e.stopPropagation();const id=e.currentTarget.dataset.id,ev=events.find(x=>x.id===id);if(!ev)return;selectEvent(id);const track=$('#eventTrack'),rect=track.getBoundingClientRect();e.currentTarget.setPointerCapture(e.pointerId);const move=me=>{ev.time=clamp((me.clientX-rect.left)/rect.width*DURATION,0,DURATION-.1);e.currentTarget.style.left=`${ev.time/DURATION*100}%`;$('#eventTime').value=ev.time;syncInspectorOutputs();};const up=()=>{e.currentTarget.removeEventListener('pointermove',move);e.currentTarget.removeEventListener('pointerup',up);events.sort((a,b)=>a.time-b.time);resetCursor();renderTimeline();selectEvent(ev.id);};e.currentTarget.addEventListener('pointermove',move);e.currentTarget.addEventListener('pointerup',up);}

function resetCursor(){cursor=events.findIndex(e=>e.time>showTime);if(cursor<0)cursor=events.length;}

function seek(t,preview=true){showTime=clamp(t,0,DURATION);engine.reset();cursor=0;while(cursor<events.length&&events[cursor].time<=showTime)cursor++;if(preview){for(const ev of events.filter(e=>e.time>showTime-1.25&&e.time<=showTime)){engine.burst(new THREE.Vector3(ev.x,ev.height,-340),ev.type,{intensity:ev.intensity,palette:ev.palette});}}syncTimeUI();}

function syncTimeUI(){const pct=showTime/DURATION*100;$('#scrub').value=showTime;$('#playhead').style.left=`${pct}%`;$('#timecode').textContent=formatTime(showTime);$('#heroProgress').style.width=`${pct}%`;}

function fireEvent(ev){engine.launch(ev.type,{x:ev.x,height:ev.height,intensity:ev.intensity,palette:ev.palette});}

function addEvent(){const id=`e${Date.now()}`;const ev={id,time:clamp(showTime+.5,0,DURATION-.1),type:selectedType,x:rr(-260,260),height:rr(145,220),intensity:1,palette:selectedPalette};events.push(ev);events.sort((a,b)=>a.time-b.time);renderTimeline();selectEvent(id);resetCursor();}

function deleteEvent(){if(!selectedEvent)return;events=events.filter(e=>e.id!==selectedEvent.id);selectedEvent=null;renderTimeline();selectEvent(null);resetCursor();}

function setPlaying(v){playing=v;$('#play').classList.toggle('active',playing);$('#play').textContent=playing?'❚❚':'▶';document.body.classList.toggle('running',playing);}

function hookUI(){
  $('#enter').onclick=async()=>{await engine.enableAudio();overlay.classList.add('hidden');setTimeout(()=>overlay.remove(),500);setPlaying(true);};
  $('#play').onclick=()=>setPlaying(!playing);$('#restart').onclick=()=>{seek(0,false);setPlaying(true);};$('#finale').onclick=async()=>{await engine.enableAudio();engine.finale();};
  $('#scrub').oninput=e=>{setPlaying(false);seek(+e.target.value,true);};
  $('#addEvent').onclick=addEvent;$('#deleteEvent').onclick=deleteEvent;
  ['eventTime','eventHeight','eventIntensity'].forEach(id=>$('#'+id).addEventListener('input',updateSelected));
  $('#sound').onclick=async e=>{await engine.enableAudio();sound=!sound;engine.setSound(sound);e.currentTarget.classList.toggle('active',sound);};
  $$('.camera-button').forEach(b=>b.onclick=()=>{$$('.camera-button').forEach(x=>x.classList.remove('active'));b.classList.add('active');engine.setCameraMode(b.dataset.camera);});
  const controls={wind:'wind',bloom:'bloom',smoke:'smoke',reflection:'reflection',exposure:'exposure',trail:'trail'};
  for(const [id,key] of Object.entries(controls)){$('#'+id).addEventListener('input',e=>{engine.setConfig({[key]:+e.target.value});$('#'+id+'Out').textContent=(+e.target.value).toFixed(2);});}
  $('#quality').onchange=e=>{const v=e.target.value;if(v==='cinema'){engine.renderer.setPixelRatio(Math.min(devicePixelRatio,2));engine.bloomPass.radius=.72;}else if(v==='balanced'){engine.renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));engine.bloomPass.radius=.62;}else{engine.renderer.setPixelRatio(1);engine.bloomPass.radius=.48;}engine.resize();};

  canvas.addEventListener('pointerdown',e=>{draggingView=true;moved=0;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!draggingView)return;const dx=e.clientX-lx,dy=e.clientY-ly;moved+=Math.abs(dx)+Math.abs(dy);engine.orbit(dx,dy);lx=e.clientX;ly=e.clientY;});
  canvas.addEventListener('pointerup',async e=>{if(draggingView&&moved<7){await engine.enableAudio();const rect=canvas.getBoundingClientRect(),nx=(e.clientX-rect.left)/rect.width*2-1;engine.launch(selectedType,{x:nx*420,height:rr(145,225),intensity:1.05,palette:selectedPalette});}draggingView=false;});
  canvas.addEventListener('wheel',e=>{engine.zoom(e.deltaY);e.preventDefault();},{passive:false});
  addEventListener('resize',()=>engine.resize());
}

function updateMetrics(){const m=engine.metrics;$('#fps').textContent=m.fps;$('#particleCount').textContent=m.particles.toLocaleString('pt-BR');$('#cameraMode').textContent=engine.cameraMode.toUpperCase();}

function frame(now){
  requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(playing){const prev=showTime;showTime+=dt;if(showTime>=DURATION){showTime=DURATION;setPlaying(false);}while(cursor<events.length&&events[cursor].time<=showTime){if(events[cursor].time>=prev-.01)fireEvent(events[cursor]);cursor++;}syncTimeUI();}
  engine.update(dt);updateMetrics();
}

buildLibrary();renderTimeline();hookUI();syncTimeUI();resetCursor();requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker:', error)));
}
