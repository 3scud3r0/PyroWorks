export const DURATION = 60;

export const PALETTES = {
  aurora: { name: "Aurora", colors: ["#70ffd1", "#65a7ff", "#c778ff"] },
  gold: { name: "Ouro", colors: ["#fff2a6", "#ffc44f", "#ff7a3d"] },
  cyber: { name: "Cyberpunk", colors: ["#25e6ff", "#ff43c5", "#8d67ff"] },
};

export const AUDIENCES = {
  artistic: { name: "Artístico", rhythm: .3, variety: .3, arc: .25, restraint: .15 },
  family: { name: "Família", rhythm: .25, variety: .2, arc: .35, restraint: .2 },
  festival: { name: "Festival", rhythm: .35, variety: .15, arc: .4, restraint: .1 },
  cinematic: { name: "Cinematográfico", rhythm: .25, variety: .2, arc: .4, restraint: .15 },
};

export const RECIPES = {
  peony: { name: "Peônia", icon: "✦", particles: 120, gravity: 26, drag: 0.986, life: 2.5 },
  comet: { name: "Cometa", icon: "╱", particles: 46, gravity: 15, drag: 0.992, life: 2.1 },
  willow: { name: "Salgueiro", icon: "⌇", particles: 150, gravity: 18, drag: 0.991, life: 4.2 },
  ring: { name: "Anel", icon: "○", particles: 96, gravity: 10, drag: 0.989, life: 2.8 },
  chrysanthemum: { name: "Crisântemo", icon: "✺", particles: 190, gravity: 22, drag: 0.984, life: 3.2 },
  palm: { name: "Palmeira", icon: "♨", particles: 110, gravity: 25, drag: 0.991, life: 3.7 },
  spiral: { name: "Espiral", icon: "◎", particles: 130, gravity: 12, drag: 0.989, life: 3.1 },
  glitter: { name: "Glitter", icon: "⁙", particles: 175, gravity: 17, drag: 0.981, life: 2.4 },
  fountain: { name: "Fonte", icon: "♒", particles: 90, gravity: 34, drag: 0.994, life: 2.2 },
  waterfall: { name: "Cascata", icon: "⋮", particles: 145, gravity: 29, drag: 0.995, life: 3.8 },
};

const rawEvents = [
  [2.6, "comet", .22, .55, .7], [5.1, "peony", .35, .42, .75],
  [9.0, "ring", .28, .36, .62], [11.1, "peony", .68, .4, .66],
  [14.0, "comet", .48, .52, .62], [16.0, "comet", .60, .48, .62],
  [19.2, "willow", .5, .33, .72], [23.0, "ring", .25, .35, .76],
  [24.2, "ring", .75, .35, .76], [27.4, "peony", .38, .3, .85],
  [30.0, "peony", .63, .3, .85], [34.0, "willow", .5, .25, .95],
  [40.5, "comet", .18, .48, .55], [42.0, "comet", .82, .48, .55],
  [45.0, "peony", .28, .33, .75], [47.0, "ring", .7, .28, .75],
  [49.0, "peony", .5, .22, .9], [51.0, "willow", .25, .2, .9],
  [52.0, "willow", .75, .2, .9], [54.0, "ring", .5, .16, 1],
  [56.0, "peony", .2, .25, 1], [56.45, "peony", .5, .16, 1],
  [56.9, "peony", .8, .25, 1], [58.0, "willow", .35, .16, 1],
  [58.25, "willow", .65, .16, 1],
];

export function createDefaultShow() {
  return {
    name: "Noite no Lago",
    palette: "aurora",
    seed: 74821,
    atmosphere: "clear",
    audience: "cinematic",
    events: rawEvents.map(([time, type, x, y, intensity], index) => ({
      id: `event-${index + 1}`, time, type, x, y, intensity, duration: RECIPES[type].life,
    })),
  };
}

export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function formatTime(seconds) {
  const safe = clamp(seconds, 0, DURATION);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(Math.floor(safe % 60)).padStart(2, "0")}.${Math.floor((safe % 1) * 10)}`;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function updateEvent(show, id, changes) {
  return { ...show, events: show.events.map(event => event.id === id ? { ...event, ...changes } : event) };
}

export function duplicateEvent(show, id) {
  const source = show.events.find(event => event.id === id);
  if (!source) return show;
  const copy = { ...source, id: `event-${Date.now()}`, time: clamp(source.time + 1, 0, DURATION - .1) };
  return { ...show, events: [...show.events, copy].sort((a, b) => a.time - b.time) };
}

export function deleteEvent(show, id) {
  return { ...show, events: show.events.filter(event => event.id !== id) };
}

export function createSequence(show, { start = 0, type = "peony", count = 5, spacing = .5, direction = "alternate" } = {}) {
  if (!RECIPES[type]) return show;
  const events = Array.from({ length: clamp(Math.round(count), 1, 24) }, (_, index) => {
    const ratio = count === 1 ? .5 : index / (count - 1);
    const x = direction === "left" ? .85 - ratio * .7 : direction === "right" ? .15 + ratio * .7 : index % 2 ? .72 - ratio * .15 : .28 + ratio * .15;
    return { id: `sequence-${Date.now()}-${index}`, type, time: clamp(start + index * spacing, 0, DURATION - .1),
      x, y: .25 + Math.sin(ratio * Math.PI) * .12, intensity: .55 + ratio * .35, duration: RECIPES[type].life };
  });
  return { ...show, events: [...show.events, ...events].sort((a, b) => a.time - b.time) };
}

export function calculateRhythmScore(show) {
  const events = [...show.events].sort((a, b) => a.time - b.time);
  if (events.length < 2) return { total: 20, timing: 20, variety: 0, arc: 0, breathing: 0 };
  const gaps = events.slice(1).map((event, i) => event.time - events[i].time);
  const closeToBeat = events.filter(event => Math.abs(event.time * 2 - Math.round(event.time * 2)) < .14).length / events.length;
  const uniqueTypes = new Set(events.map(event => event.type)).size / Object.keys(RECIPES).length;
  const early = events.filter(event => event.time < 20).reduce((sum, e) => sum + e.intensity, 0) / Math.max(1, events.filter(e => e.time < 20).length);
  const late = events.filter(event => event.time >= 45).reduce((sum, e) => sum + e.intensity, 0) / Math.max(1, events.filter(e => e.time >= 45).length);
  const longestGap = Math.max(...gaps);
  const timing = Math.round(55 + closeToBeat * 45);
  const variety = Math.round(45 + uniqueTypes * 55);
  const arc = Math.round(50 + Math.max(0, Math.min(.5, late - early)) * 100);
  const breathing = Math.round(45 + Math.min(1, longestGap / 6) * 55);
  return { total: Math.round(timing * .3 + variety * .2 + arc * .3 + breathing * .2), timing, variety, arc, breathing };
}

export function evaluateAudience(show) {
  const profile = AUDIENCES[show.audience] || AUDIENCES.cinematic;
  const rhythm = calculateRhythmScore(show);
  const finale = show.events.filter(event => event.time >= 50);
  const finaleEnergy = finale.reduce((sum, event) => sum + event.intensity, 0) / Math.max(1, finale.length);
  const density = show.events.length / DURATION;
  const restraint = Math.round(100 - Math.max(0, density - .65) * 90);
  const arc = Math.round((rhythm.arc + finaleEnergy * 100) / 2);
  const overall = Math.round(rhythm.timing * profile.rhythm + rhythm.variety * profile.variety + arc * profile.arc + restraint * profile.restraint);
  const highlights = [];
  if (rhythm.breathing >= 75) highlights.push("A pausa criou expectativa antes do clímax.");
  if (arc >= 80) highlights.push("O finale resolveu o arco com confiança.");
  if (rhythm.variety >= 75) highlights.push("A variedade visual manteve o céu legível.");
  if (restraint < 60) highlights.push("A plateia sentiu saturação em alguns trechos.");
  if (!highlights.length) highlights.push("A composição foi coerente, mas pode assumir mais contraste.");
  return { overall: clamp(overall, 0, 100), timing: rhythm.timing, color: show.palette === "gold" ? 92 : 86,
    finale: clamp(arc, 0, 100), restraint: clamp(restraint, 0, 100), audienceName: profile.name, highlights };
}

export function generateShow({ palette = "cyber", density = 1, seed = Date.now() } = {}) {
  const random = seededRandom(seed);
  const events = [];
  for (let time = 2; time < 59;) {
    const progress = time / DURATION;
    const inPause = time > 38 && time < 44;
    if (!inPause) {
      const voices = progress > .9 ? 3 : random() > .7 ? 2 : 1;
      for (let voice = 0; voice < voices; voice++) {
        const types = Object.keys(RECIPES), type = types[Math.floor(random() * types.length)];
        events.push({ id: `generated-${events.length}-${seed}`, time: Math.min(59, time + voice * .22), type,
          x: .14 + random() * .72, y: .18 + random() * .34, intensity: .48 + progress * .45,
          duration: RECIPES[type].life });
      }
    }
    time += (2.7 - progress * 1.35) / density + random() * 1.2;
  }
  return { name: "Horizonte Gerado", palette, seed, atmosphere: "clear", audience: "cinematic", events: events.sort((a, b) => a.time - b.time) };
}

export function parseShow(json) {
  const value = typeof json === "string" ? JSON.parse(json) : json;
  if (!value || !Array.isArray(value.events) || !PALETTES[value.palette]) throw new Error("Performance inválida");
  const events = value.events.filter(event => RECIPES[event.type] && Number.isFinite(event.time)).map((event, index) => ({
    id: String(event.id || `imported-${index}`), type: event.type, time: clamp(event.time, 0, DURATION - .1),
    x: clamp(Number(event.x) || .5, .05, .95), y: clamp(Number(event.y) || .35, .1, .65),
    intensity: clamp(Number(event.intensity) || .7, .2, 1), duration: RECIPES[event.type].life,
  }));
  if (!events.length) throw new Error("A performance não contém eventos válidos");
  return { name: String(value.name || "Performance importada").slice(0, 60), palette: value.palette,
    seed: Number(value.seed) || 1, atmosphere: ["clear", "mist", "cloudy", "rain"].includes(value.atmosphere) ? value.atmosphere : "clear",
    audience: AUDIENCES[value.audience] ? value.audience : "cinematic",
    events: events.sort((a, b) => a.time - b.time) };
}

export function applyDirection(show, prompt) {
  const intent = prompt.toLocaleLowerCase("pt-BR");
  let next = { ...show, events: show.events.map(event => ({ ...event })) };
  const actions = [];
  if (/azul|dourad|ouro/.test(intent)) { next.palette = "gold"; actions.push("paleta Ouro aplicada"); }
  else if (/cyber|neon|rosa/.test(intent)) { next.palette = "cyber"; actions.push("paleta Cyberpunk aplicada"); }
  else if (/aurora|verde/.test(intent)) { next.palette = "aurora"; actions.push("paleta Aurora aplicada"); }
  if (/abertura lenta|minimalista|comece devagar/.test(intent)) {
    let index = 0;
    next.events = next.events.filter(event => event.time >= 18 || index++ % 2 === 0)
      .map(event => event.time < 18 ? { ...event, intensity: Math.max(.35, event.intensity * .72) } : event);
    actions.push("abertura simplificada");
  }
  if (/pausa|respiro|silêncio|silencio/.test(intent)) {
    next.events = next.events.filter(event => event.time < 38 || event.time > 45);
    actions.push("respiro criado antes do finale");
  }
  if (/finale|clímax|climax|gigantesco/.test(intent)) {
    next.events = next.events.map(event => event.time >= 50 ? { ...event, intensity: 1 } : event);
    ["ring", "peony", "willow"].forEach((type, index) => next.events.push({ id: `directed-${Date.now()}-${index}`, type,
      time: 56 + index * .55, x: .25 + index * .25, y: .16 + index * .05, intensity: 1, duration: RECIPES[type].life }));
    actions.push("finale ampliado em três vozes");
  }
  if (/névoa|nevoa|atmosfera/.test(intent)) { next.atmosphere = "mist"; actions.push("névoa cênica ativada"); }
  next.events.sort((a, b) => a.time - b.time);
  return { show: next, actions: actions.length ? actions : ["nenhuma intenção reconhecida"] };
}
