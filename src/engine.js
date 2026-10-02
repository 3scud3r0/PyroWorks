import { PALETTES, RECIPES, seededRandom } from "./model.js";

const hexRgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));

export class ShowEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.particles = [];
    this.ripples = [];
    this.flashes = [];
    this.smoke = [];
    this.launched = new Set();
    this.show = null;
    this.time = 0;
    this.last = performance.now();
    this.playing = false;
    this.audio = null;
    this.musicMuted = false;
    this.effectsMuted = false;
    this.lastBeat = -1;
    this.cameraMode = "ground";
    this.fps = 60;
    this.statElapsed = 0;
    this.onTime = () => {};
    this.onStats = () => {};
    this.onComplete = () => {};
    this.completed = false;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    requestAnimationFrame(now => this.frame(now));
  }

  setShow(show) { this.show = show; }
  play(from = this.time) {
    if (from >= 59.9) from = 0;
    this.seek(from);
    this.initAudio();
    this.lastBeat = Math.floor(from * 2) - 1;
    this.completed = false;
    this.playing = true;
  }
  pause() { this.playing = false; }
  seek(time) {
    this.time = time; this.particles.length = 0; this.flashes.length = 0; this.smoke.length = 0; this.launched.clear();
    if (this.show) this.show.events.filter(e => e.time <= time).forEach(e => {
      this.launched.add(e.id);
      if (e.time > time - 4.5) this.launch(e, time - e.time, true);
    });
    this.onTime(this.time);
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, rect.width * ratio); this.canvas.height = Math.max(1, rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0); this.width = rect.width; this.height = rect.height;
  }

  initAudio() {
    if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audio.state === "suspended") this.audio.resume();
  }

  playSound(event) {
    if (!this.audio || this.effectsMuted) return;
    const now = this.audio.currentTime + .025 + Math.abs(event.x - .5) * .035;
    const duration = event.type === "willow" ? 1.8 : .85;
    const noise = this.audio.createBuffer(1, this.audio.sampleRate * duration, this.audio.sampleRate);
    const channel = noise.getChannelData(0), random = seededRandom(this.show.seed + event.time * 100);
    for (let i = 0; i < channel.length; i++) channel[i] = (random() * 2 - 1) * Math.exp(-i / channel.length * (event.type === "willow" ? 3 : 7));
    const source = this.audio.createBufferSource(), filter = this.audio.createBiquadFilter(), gain = this.audio.createGain(), pan = this.audio.createStereoPanner();
    source.buffer = noise; filter.type = "lowpass"; filter.frequency.setValueAtTime(900 + event.intensity * 1600, now);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.08 + event.intensity * .12, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    pan.pan.value = (event.x - .5) * 1.4; source.connect(filter).connect(gain).connect(pan).connect(this.audio.destination); source.start(now);
  }

  playBeat(beat) {
    if (!this.audio || this.musicMuted) return;
    const now = this.audio.currentTime + .015;
    const root = [110, 146.83, 164.81, 130.81][Math.floor(beat / 8) % 4];
    const oscillator = this.audio.createOscillator(), gain = this.audio.createGain(), filter = this.audio.createBiquadFilter();
    oscillator.type = beat % 8 === 0 ? "sine" : "triangle";
    oscillator.frequency.value = root * (beat % 4 === 2 ? 1.5 : 1);
    filter.type = "lowpass"; filter.frequency.value = beat % 8 === 0 ? 900 : 520;
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(beat % 8 === 0 ? .075 : .025, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + .22);
    oscillator.connect(filter).connect(gain).connect(this.audio.destination); oscillator.start(now); oscillator.stop(now + .24);
  }

  launch(event, age = 0, silent = false) {
    const recipe = RECIPES[event.type];
    const colors = PALETTES[this.show.palette].colors.map(hexRgb);
    const random = seededRandom(this.show.seed + Number(event.id.replace(/\D/g, "")) * 997);
    const cx = event.x * this.width, cy = event.y * this.height * .8;
    const count = Math.floor(recipe.particles * (.65 + event.intensity * .5));
    for (let i = 0; i < count; i++) {
      let angle = ["ring", "spiral"].includes(event.type) ? i / count * Math.PI * 2 : random() * Math.PI * 2;
      if (event.type === "palm") angle = Math.floor(random() * 9) / 9 * Math.PI * 2 + (random() - .5) * .08;
      const shaped = event.type === "willow" ? .55 + random() * .55 : event.type === "spiral" ? .3 + i / count : .7 + random() * .5;
      const speed = (34 + event.intensity * 52) * shaped;
      let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
      if (event.type === "comet") { vx = (random() - .5) * 22; vy = -55 - random() * 45; }
      if (event.type === "fountain") { vx = (random() - .5) * 44; vy = -75 - random() * 70; }
      if (event.type === "waterfall") { vx = (random() - .5) * 38; vy = 8 + random() * 32; }
      const color = colors[Math.floor(random() * colors.length)];
      const originY = ["comet", "fountain"].includes(event.type) ? this.height * .78 : event.type === "waterfall" ? this.height * .15 : cy;
      const particle = { x: cx, y: originY, px: cx, py: originY,
        vx, vy, age: 0, life: recipe.life * (.78 + random() * .36), drag: recipe.drag,
        gravity: recipe.gravity, color, size: .7 + random() * 1.8, twinkle: random() * 10,
        flickerRate: event.type === "glitter" ? 46 : 22, z: (random() - .5) * 1.4, vz: (random() - .5) * .22 };
        flickerRate: event.type === "glitter" ? 46 : 22 };
      if (age) this.advance(particle, age);
      if (particle.age < particle.life) this.particles.push(particle);
    }
    this.flashes.push({ x: cx, y: cy, age, life: .32, color: colors[0], power: event.intensity });
    this.ripples.push({ x: cx, age, life: 2.8, color: colors[0] });
    for (let i = 0; i < 7; i++) this.smoke.push({ x: cx + (random() - .5) * 28, y: cy + (random() - .5) * 18,
      radius: 12 + random() * 24, vx: 3 + random() * 8, vy: -2 - random() * 4, age, life: 5 + random() * 3 });
    if (!silent && age === 0) this.playSound(event);
  }

  advance(p, dt) {
    const steps = Math.ceil(dt / .03), step = dt / steps;
    const wind = { clear: 1.5, mist: .5, cloudy: 4, rain: 7 }[this.show?.atmosphere] || 0;
    for (let i = 0; i < steps; i++) { p.px = p.x; p.py = p.y; p.vx = p.vx * p.drag ** (step * 60) + wind * step; p.vy = p.vy * p.drag ** (step * 60) + p.gravity * step; p.x += p.vx * step; p.y += p.vy * step; p.z += p.vz * step; p.age += step; }
    for (let i = 0; i < steps; i++) { p.px = p.x; p.py = p.y; p.vx = p.vx * p.drag ** (step * 60) + wind * step; p.vy = p.vy * p.drag ** (step * 60) + p.gravity * step; p.x += p.vx * step; p.y += p.vy * step; p.age += step; }
  }

  update(dt) {
    this.fps += ((1 / Math.max(.001, dt)) - this.fps) * .08;
    this.statElapsed += dt;
    if (this.statElapsed > .5) { this.statElapsed = 0; this.onStats({ fps: Math.round(this.fps), particles: this.particles.length, smoke: this.smoke.length, camera: this.cameraMode }); }
    if (this.playing) {
      this.time += dt;
      const beat = Math.floor(this.time * 2);
      if (beat > this.lastBeat) { this.lastBeat = beat; this.playBeat(beat); }
      if (this.time >= 60) { this.time = 60; this.playing = false; if (!this.completed) { this.completed = true; setTimeout(() => this.onComplete(), 900); } }
      this.show?.events.forEach(event => { if (event.time <= this.time && !this.launched.has(event.id)) { this.launched.add(event.id); this.launch(event); } });
      this.onTime(this.time);
    }
    this.particles.forEach(p => this.advance(p, dt));
    this.particles = this.particles.filter(p => p.age < p.life);
    this.flashes.forEach(f => f.age += dt); this.flashes = this.flashes.filter(f => f.age < f.life);
    this.ripples.forEach(r => r.age += dt); this.ripples = this.ripples.filter(r => r.age < r.life);
    this.smoke.forEach(s => { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.radius += dt * 3; });
    this.smoke = this.smoke.filter(s => s.age < s.life);
  }

  drawBackground() {
    const { ctx, width: w, height: h } = this;
    const horizon = h * .67;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#02030d"); sky.addColorStop(.55, "#071228"); sky.addColorStop(1, "#11273c");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    if (this.show?.atmosphere === "cloudy") {
      ctx.fillStyle = "rgba(76,88,112,.12)";
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(w * (i * .24 + .04), h * (.14 + (i % 2) * .09), w * .19, h * .07, -.1, 0, Math.PI * 2); ctx.fill(); }
    }
    if (this.show?.atmosphere === "rain") {
      ctx.strokeStyle = "rgba(137,179,204,.18)"; ctx.lineWidth = 1;
      const rain = seededRandom(Math.floor(this.time * 8));
      for (let i = 0; i < 90; i++) { const x = rain() * w, y = rain() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y + 18); ctx.stroke(); }
    }
    const glow = ctx.createRadialGradient(w * .52, h * .45, 0, w * .52, h * .45, w * .55);
    glow.addColorStop(0, "rgba(39,75,119,.16)"); glow.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#060a13"; ctx.beginPath(); ctx.moveTo(0, horizon);
    [[0,.62],[.12,.53],[.25,.64],[.38,.56],[.52,.63],[.67,.5],[.78,.59],[.9,.52],[1,.63]].forEach(([x,y]) => ctx.lineTo(x*w,y*h));
    ctx.lineTo(w,horizon); ctx.closePath(); ctx.fill();
    const moon = ctx.createRadialGradient(w*.82,h*.16,0,w*.82,h*.16,h*.055);moon.addColorStop(0,"rgba(238,247,255,.82)");moon.addColorStop(.18,"rgba(201,224,242,.28)");moon.addColorStop(1,"rgba(110,166,205,0)");ctx.fillStyle=moon;ctx.fillRect(w*.72,h*.05,w*.2,h*.22);
    const city=seededRandom(771);for(let i=0;i<46;i++){const x=city()*w,building=4+city()*15;ctx.fillStyle=`rgba(2,5,10,${.7+city()*.25})`;ctx.fillRect(x,horizon-building,4+city()*10,building);if(city()>.38){ctx.fillStyle=city()>.75?"rgba(255,205,128,.7)":"rgba(132,208,231,.62)";ctx.fillRect(x+2,horizon-building+3,1.2,1.2);}}
    const water = ctx.createLinearGradient(0, horizon, 0, h); water.addColorStop(0,"#071725"); water.addColorStop(1,"#02060c"); ctx.fillStyle=water;ctx.fillRect(0,horizon,w,h-horizon);
    ctx.strokeStyle="rgba(81,150,182,.1)";ctx.lineWidth=1;
    for(let y=horizon+8;y<h;y+=12){ctx.beginPath();ctx.moveTo(w*.05,y);ctx.lineTo(w*.95,y);ctx.stroke();}
    ctx.fillStyle="rgba(209,228,255,.55)";
    const seed=seededRandom(42);for(let i=0;i<45;i++){const x=seed()*w,y=seed()*h*.48;ctx.globalAlpha=.2+seed()*.65;ctx.fillRect(x,y,seed()> .85?1.5:1,seed()> .9?1.5:1);}ctx.globalAlpha=1;
  }

  draw() {
    const { ctx, width: w, height: h } = this; this.drawBackground();
    ctx.save();
    const scale = this.cameraMode === "aerial" ? .88 : this.cameraMode === "director" ? 1.025 + Math.sin(this.time * .08) * .02 : 1;
    const pan = this.cameraMode === "director" ? Math.sin(this.time * .13) * w * .025 : 0;
    ctx.translate(w / 2, h / 2); ctx.scale(scale, scale); ctx.translate(-w / 2 + pan, -h / 2);
    this.smoke.forEach(s => { const alpha = Math.sin(Math.min(1, s.age) * Math.PI / 2) * Math.max(0, 1 - s.age / s.life) * .075;
      const cloud = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius); cloud.addColorStop(0, `rgba(145,159,178,${alpha})`); cloud.addColorStop(1, "rgba(100,120,145,0)"); ctx.fillStyle = cloud; ctx.fillRect(s.x-s.radius,s.y-s.radius,s.radius*2,s.radius*2); });
    ctx.globalCompositeOperation = "lighter";
    this.flashes.forEach(f => { const a = 1-f.age/f.life, g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,100*f.power); g.addColorStop(0,`rgba(${f.color.join()},${a*.5})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(f.x-120,f.y-120,240,240); });
    this.particles.forEach(p => { const fade=Math.max(0,1-p.age/p.life),depth=1/(1+p.z*.16),sx=w/2+(p.x-w/2)*depth,sy=h/2+(p.y-h/2)*depth,spx=w/2+(p.px-w/2)*depth,spy=h/2+(p.py-h/2)*depth; const flicker=.55+.45*Math.sin((p.age*p.flickerRate+p.twinkle)); const alpha=fade*flicker; ctx.strokeStyle=`rgba(${p.color.join()},${alpha*.72})`;ctx.lineWidth=p.size*fade*depth;ctx.beginPath();ctx.moveTo(spx,spy);ctx.lineTo(sx,sy);ctx.stroke();ctx.shadowColor=`rgb(${p.color.join()})`;ctx.shadowBlur=5*fade;ctx.fillStyle=`rgba(255,255,235,${alpha})`;ctx.fillRect(sx-.7*depth,sy-.7*depth,1.4*depth,1.4*depth);ctx.shadowBlur=0; });
    this.particles.forEach(p => { const fade=Math.max(0,1-p.age/p.life); const flicker=.55+.45*Math.sin((p.age*p.flickerRate+p.twinkle)); const alpha=fade*flicker; ctx.strokeStyle=`rgba(${p.color.join()},${alpha*.75})`;ctx.lineWidth=p.size*fade;ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=`rgba(255,255,235,${alpha})`;ctx.fillRect(p.x-0.65,p.y-0.65,1.3,1.3); });
    // Reflections are deliberately blurred vertical impressions, not duplicate particles.
    ctx.globalAlpha=.18; this.particles.filter((_,i)=>i%4===0).forEach(p=>{const y=h*.67+(h*.67-p.y)*.22;ctx.strokeStyle=`rgb(${p.color.join()})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-4,y);ctx.lineTo(p.x+4,y);ctx.stroke();});
    ctx.globalCompositeOperation="screen";this.ripples.forEach(r=>{const a=Math.max(0,1-r.age/r.life)*.18;ctx.strokeStyle=`rgba(${r.color.join()},${a})`;ctx.beginPath();ctx.ellipse(r.x,h*.71,18+r.age*44,2+r.age*3,0,0,Math.PI*2);ctx.stroke();});ctx.restore();
    const mist=ctx.createLinearGradient(0,h*.53,0,h*.75);mist.addColorStop(0,"rgba(130,181,205,0)");mist.addColorStop(.55,"rgba(130,181,205,.055)");mist.addColorStop(1,"rgba(130,181,205,0)");ctx.fillStyle=mist;ctx.fillRect(0,h*.5,w,h*.28);
    if (this.show?.atmosphere === "mist") { ctx.fillStyle="rgba(143,178,194,.075)";ctx.fillRect(0,h*.35,w,h*.5); }
  }

  frame(now) { const dt=Math.min(.033,(now-this.last)/1000);this.last=now;this.update(dt);this.draw();requestAnimationFrame(next=>this.frame(next)); }
}
