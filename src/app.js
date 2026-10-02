import { AUDIENCES, DURATION, PALETTES, RECIPES, applyDirection, calculateRhythmScore, createDefaultShow, createSequence, clamp, deleteEvent, duplicateEvent, evaluateAudience, formatTime, generateShow, parseShow, updateEvent } from "./model.js";
import { ShowEngine } from "./engine.js";

const $ = selector => document.querySelector(selector);
let show = createDefaultShow(), selectedId = null, history = [], loop = false, timelineZoom = 1;
try { if (localStorage.getItem("pyroworks.show")) show = parseShow(localStorage.getItem("pyroworks.show")); } catch { localStorage.removeItem("pyroworks.show"); }
const engine = new ShowEngine($("#stage")); engine.setShow(show);
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});

function persist() { localStorage.setItem("pyroworks.show", JSON.stringify(show)); $("#saveStatus").textContent="Salvo agora mesmo"; }
function commit(next, message) { history.push(show); show = next; engine.setShow(show); persist(); render(); toast(message); }
function toast(text) { const el=$("#toast");el.textContent=text;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),1800); }

function renderRecipes() {
  const accents=["#72efd5","#77c8ff","#f1ce80","#c891ff","#ff83a8"];
  $("#recipeList").innerHTML = Object.entries(RECIPES).map(([id,r],i)=>`<button class="recipe-card" data-recipe="${id}" style="--color:${accents[i%accents.length]}"><i>${r.icon}</i><b>${r.name}</b></button>`).join("");
  document.querySelectorAll("[data-recipe]").forEach(button=>button.onclick=()=>{const time=clamp(engine.time+.5,0,59);const id=`event-${Date.now()}`;commit({...show,events:[...show.events,{id,time,type:button.dataset.recipe,x:.5,y:.32,intensity:.7,duration:RECIPES[button.dataset.recipe].life}].sort((a,b)=>a.time-b.time)},"Forma adicionada à timeline");selectedId=id;render();});
}

function renderPalettes() {
  $("#paletteList").innerHTML=Object.entries(PALETTES).map(([id,p])=>`<button class="palette ${show.palette===id?"active":""}" data-palette="${id}"><span class="swatches">${p.colors.map(c=>`<i style="background:${c}"></i>`).join("")}</span><b>${p.name}</b>${show.palette===id?"<em>✓</em>":""}</button>`).join("");
  document.querySelectorAll("[data-palette]").forEach(b=>b.onclick=()=>commit({...show,palette:b.dataset.palette},`Paleta ${PALETTES[b.dataset.palette].name} aplicada`));
}

function renderTimeline() {
  const palette=PALETTES[show.palette];
  $("#eventTrack").innerHTML=show.events.map((event,index)=>`<button class="event ${selectedId===event.id?"selected":""}" data-id="${event.id}" style="left:${event.time/DURATION*100}%;width:${Math.max(1.6,event.duration/DURATION*100)}%;--event-color:${palette.colors[index%palette.colors.length]}" title="${RECIPES[event.type].name} · ${formatTime(event.time)}">${RECIPES[event.type].icon}</button>`).join("");
  $(".track-labels>div:nth-child(2) small").textContent=`${show.events.length} eventos`;
  document.querySelectorAll(".event").forEach(el=>{
    el.onclick=()=>{selectedId=el.dataset.id;render();};
    el.onpointerdown=e=>{e.preventDefault();selectedId=el.dataset.id;const startX=e.clientX,source=show.events.find(x=>x.id===selectedId),before=show,width=$("#eventTrack").clientWidth;el.setPointerCapture(e.pointerId);el.onpointermove=move=>{const time=clamp(source.time+(move.clientX-startX)/width*DURATION,0,DURATION-.1);show=updateEvent(show,selectedId,{time});engine.setShow(show);el.style.left=`${time/DURATION*100}%`;};el.onpointerup=()=>{history.push(before);persist();render();toast("Timing atualizado");};};
  });
}

function updateInspector() {
  const event=show.events.find(e=>e.id===selectedId);$("#emptyInspector").hidden=!!event;$("#eventInspector").hidden=!event;if(!event)return;
  const recipe=RECIPES[event.type];$("#selectedIcon").textContent=recipe.icon;$("#selectedName").textContent=recipe.name;$("#intensity").value=event.intensity*100;$("#intensityOutput").value=`${Math.round(event.intensity*100)}%`;$("#position").value=event.x*100;$("#positionOutput").value=`${Math.round(event.x*100)}%`;$("#height").value=event.y*100;$("#heightOutput").value=`${Math.round(event.y*100)}%`;
}

function render() {
  renderPalettes();renderTimeline();updateInspector();
  const score=calculateRhythmScore(show);$("#rhythmScore").textContent=score.total;$("#scoreNote").textContent=score.arc>80?"Arco forte · finale bem preparado":score.breathing>75?"Bom respiro · aumente o clímax":"Crie contraste antes do finale";
  $("#projectName").textContent=show.name;$("#atmosphereName").textContent={clear:"Céu claro · brisa leve",mist:"Névoa cênica · vento calmo",cloudy:"Nuvens altas · vento moderado",rain:"Chuva cênica · vento forte"}[show.atmosphere||"clear"];
  $("#audienceSelect").value=show.audience||"cinematic";
}

$("#ruler").innerHTML=Array.from({length:7},(_,i)=>`<span style="left:${i/6*100}%">${String(i*10).padStart(2,"0")}s</span>`).join("");
const waveRandom=()=>Math.random()*.65+.15;$("#waveform").innerHTML=Array.from({length:160},()=>`<i style="height:${waveRandom()*100}%"></i>`).join("");
renderRecipes();render();

engine.onTime=time=>{$("#timeDisplay").textContent=formatTime(time);$("#playhead").style.left=`${time/DURATION*100}%`;$("#cinematicProgress").style.width=`${time/DURATION*100}%`;$("#finaleCountdown").textContent=time<56?formatTime(56-time).slice(0,5):"AGORA";$("#heroMessage").classList.toggle("hidden",time>.2);$("#playButton").textContent=engine.playing?"Ⅱ":"▶";document.body.classList.toggle("performance-running",engine.playing);if(loop&&!engine.playing&&time>=60)engine.play(0);};
$("#playButton").onclick=()=>engine.playing?engine.pause():engine.play();
$("#backButton").onclick=()=>engine.seek(Math.max(0,engine.time-5));$("#forwardButton").onclick=()=>engine.seek(Math.min(DURATION,engine.time+5));
$("#timeline").onclick=e=>{if(e.target.closest(".event"))return;const rect=$("#timeline").getBoundingClientRect();engine.seek(clamp((e.clientX-rect.left)/rect.width*DURATION,0,DURATION));};
$("#intensity").oninput=e=>{show=updateEvent(show,selectedId,{intensity:e.target.value/100});engine.setShow(show);$("#intensityOutput").value=`${e.target.value}%`;};
$("#position").oninput=e=>{show=updateEvent(show,selectedId,{x:e.target.value/100});engine.setShow(show);$("#positionOutput").value=`${e.target.value}%`;};
$("#height").oninput=e=>{show=updateEvent(show,selectedId,{y:e.target.value/100});engine.setShow(show);$("#heightOutput").value=`${e.target.value}%`;};
["#intensity","#position","#height"].forEach(selector=>$(selector).onchange=()=>{persist();render();});
$("#duplicateButton").onclick=()=>commit(duplicateEvent(show,selectedId),"Evento duplicado");$("#deleteButton").onclick=()=>{commit(deleteEvent(show,selectedId),"Evento removido");selectedId=null;render();};
$("#sequenceButton").onclick=()=>{const source=show.events.find(event=>event.id===selectedId);if(source)commit(createSequence(show,{start:source.time+.5,type:source.type,count:7,spacing:.45}),"Sequência crescente criada");};
$("#undoButton").onclick=()=>{if(!history.length)return toast("Nada para desfazer");show=history.pop();engine.setShow(show);selectedId=null;render();toast("Alteração desfeita");};
$("#resetButton").onclick=()=>{history.push(show);show=createDefaultShow();engine.setShow(show);engine.seek(0);selectedId=null;render();toast("Show original restaurado");};
$("#loopButton").onclick=e=>{loop=!loop;e.currentTarget.style.color=loop?"var(--cyan)":"";toast(loop?"Repetição ativada":"Repetição desativada");};
$("#spectatorButton").onclick=()=>{document.body.classList.add("spectator");engine.play(0);toast("Pressione Esc para voltar ao editor");};
$("#hudButton").onclick=()=>document.body.classList.toggle("spectator");
$("#fullscreenButton").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
function cycleCamera(){const modes=["ground","aerial","director"],labels={ground:"Terrestre",aerial:"Aérea",director:"Director"};engine.cameraMode=modes[(modes.indexOf(engine.cameraMode)+1)%modes.length];toast(`Câmera ${labels[engine.cameraMode]}`);}
$("#cameraButton").onclick=cycleCamera;$("#cinematicCamera").onclick=cycleCamera;
$("#cinematicPlay").onclick=()=>engine.play(0);$("#openStudioButton").onclick=()=>{document.body.classList.remove("cinematic-home","performance-running");engine.pause();};$("#backToShow").onclick=()=>{document.body.classList.add("cinematic-home");engine.seek(0);};
$("#cinematicFullscreen").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();$("#cinematicSound").onclick=event=>{engine.musicMuted=!engine.musicMuted;engine.effectsMuted=engine.musicMuted;event.currentTarget.textContent=engine.musicMuted?"♩":"♪";toast(engine.musicMuted?"Som desativado":"Som ativado");};
function setTimelineZoom(value) { timelineZoom=clamp(value,1,3);$("#timeline").style.width=`${timelineZoom*100}%`;$(".zoom-track i").style.width=`${33+(timelineZoom-1)*33}%`;toast(`Zoom da timeline: ${Math.round(timelineZoom*100)}%`); }
$("#zoomIn").onclick=()=>setTimelineZoom(timelineZoom+.5);$("#zoomOut").onclick=()=>setTimelineZoom(timelineZoom-.5);
document.querySelectorAll("[data-mode]").forEach(button=>button.onclick=()=>{document.body.classList.toggle("pro",button.dataset.mode==="pro");document.querySelectorAll("[data-mode]").forEach(item=>item.classList.toggle("active",item===button));toast(button.dataset.mode==="pro"?"Ferramentas profissionais ativadas":"Modo Beginner ativado");});
$("#directorButton").onclick=()=>$("#directorDialog").showModal();
document.querySelectorAll(".prompt-chips button").forEach(button=>button.onclick=()=>{$("#directorPrompt").value=button.textContent;});
$("#applyDirectionButton").onclick=()=>{const result=applyDirection(show,$("#directorPrompt").value);if(result.actions[0]==="nenhuma intenção reconhecida"){$("#directionResult").textContent="Tente mencionar abertura, pausa, paleta, névoa ou finale.";return;}commit(result.show,"Direção aplicada");$("#directionResult").textContent=`Pronto: ${result.actions.join(" · ")}.`;engine.seek(0);};
$("#proceduralButton").onclick=()=>{commit(generateShow({palette:show.palette,seed:Date.now()}),"Nova composição criada");engine.seek(0);selectedId=null;render();$("#directionResult").textContent="Uma nova composição editável foi criada.";};
$("#atmosphereButton").onclick=()=>{const values=["clear","mist","cloudy","rain"],next=values[(values.indexOf(show.atmosphere||"clear")+1)%values.length];commit({...show,atmosphere:next},"Atmosfera atualizada");};
$("#audienceSelect").onchange=event=>commit({...show,audience:event.target.value},`Público ${AUDIENCES[event.target.value].name} selecionado`);
$("#shareButton").onclick=()=>{const blob=new Blob([JSON.stringify(show,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`${show.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.pyroworks.json`;link.click();URL.revokeObjectURL(url);toast("Performance exportada");};
$("#importButton").onclick=()=>$("#importInput").click();
$("#importInput").onchange=async event=>{try{const imported=parseShow(await event.target.files[0].text());commit(imported,"Performance importada");engine.seek(0);}catch(error){toast(error.message);}event.target.value="";};
function bindMute(selector, property, label) { $(selector).onclick=event=>{engine[property]=!engine[property];event.currentTarget.classList.toggle("muted",engine[property]);event.currentTarget.setAttribute("aria-pressed",String(engine[property]));toast(`${label} ${engine[property]?"silenciados":"ativados"}`);}; }
bindMute("#effectsMute","effectsMuted","Efeitos");bindMute("#musicMute","musicMuted","Música");
engine.onStats=stats=>{$("#telemetry").innerHTML=`<span>${stats.fps} FPS</span><span>${stats.particles.toLocaleString("pt-BR")} PARTÍCULAS</span><span>CÂMERA ${{ground:"TERRESTRE",aerial:"AÉREA",director:"DIRECTOR"}[stats.camera]}</span>`;};
engine.onComplete=()=>{document.body.classList.remove("performance-running");if(loop)return;const result=evaluateAudience(show);$("#audienceScore").textContent=result.overall;$("#resultTitle").textContent=result.overall>=85?"Uma noite memorável":result.overall>=70?"Uma composição promissora":"Uma ideia para lapidar";$("#resultAudience").textContent=`Avaliação do público ${result.audienceName.toLowerCase()}`;$("#resultTiming").textContent=result.timing;$("#resultColor").textContent=result.color;$("#resultFinale").textContent=result.finale;$("#resultRestraint").textContent=result.restraint;$("#resultHighlight").textContent=`“${result.highlights[0]}”`;$("#resultsDialog").showModal();};
$("#editResultButton").onclick=()=>$("#resultsDialog").close();$("#replayResultButton").onclick=()=>{$("#resultsDialog").close();document.body.classList.add("spectator");engine.play(0);};
document.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.target.matches("input")){e.preventDefault();engine.playing?engine.pause():engine.play();}if(e.key==="Escape")document.body.classList.remove("spectator");if((e.ctrlKey||e.metaKey)&&e.key==="z")$("#undoButton").click();if(e.key==="Delete"&&selectedId)$("#deleteButton").click();});
