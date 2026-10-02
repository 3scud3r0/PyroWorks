import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rr = (a, b) => a + Math.random() * (b - a);

const TYPE = Object.freeze({
  peony: 0,
  crisântemo: 1,
  willow: 2,
  anel: 3,
  palmeira: 4,
  glitter: 5,
  strobo: 6,
  cometa: 7,
  coração: 8,
  crossette: 9,
  kamuro: 10,
  pistilo: 11,
  duplo: 12,
  reveillon: 13,
  cascata: 14,
  espiral: 15,
  saturno: 16,
});

const TYPE_CONFIG = {
  peony: { particles: 3600, speed: 70, life: 3.3, kind: 0, pattern: 0 },
  crisântemo: { particles: 4300, speed: 68, life: 3.7, kind: 1, pattern: 0 },
  willow: { particles: 5200, speed: 53, life: 7.2, kind: 2, pattern: 0 },
  anel: { particles: 3100, speed: 76, life: 3.3, kind: 3, pattern: 1 },
  palmeira: { particles: 3900, speed: 74, life: 5.0, kind: 4, pattern: 2 },
  glitter: { particles: 4700, speed: 58, life: 3.1, kind: 5, pattern: 0 },
  strobo: { particles: 5000, speed: 61, life: 4.1, kind: 6, pattern: 0 },
  cometa: { particles: 1700, speed: 82, life: 4.5, kind: 7, pattern: 3 },
  coração: { particles: 3600, speed: 5.2, life: 4.0, kind: 8, pattern: 4 },
  crossette: { particles: 3900, speed: 67, life: 3.2, kind: 9, pattern: 5 },
  kamuro: { particles: 6200, speed: 55, life: 8.2, kind: 10, pattern: 0 },
  pistilo: { particles: 5200, speed: 72, life: 4.0, kind: 11, pattern: 0 },
  duplo: { particles: 6100, speed: 78, life: 3.8, kind: 12, pattern: 0 },
  reveillon: { particles: 7600, speed: 78, life: 4.6, kind: 13, pattern: 0 },
  cascata: { particles: 5200, speed: 46, life: 4.6, kind: 14, pattern: 6 },
  espiral: { particles: 4400, speed: 67, life: 4.0, kind: 15, pattern: 7 },
  saturno: { particles: 5600, speed: 75, life: 4.0, kind: 16, pattern: 8 },
};

const PALETTES = Object.freeze({
  reveillon: [0.10, 0.11, 0.09, 0.58, 0.87, 0.02, 0.34],
  tradicional: [0.00, 0.06, 0.12, 0.34, 0.53, 0.65, 0.82, 0.93],
  neon: [0.49, 0.84, 0.12, 0.28, 0.72],
  dourado: [0.08, 0.10, 0.12, 0.07],
  prata: [0.56, 0.60, 0.10],
});

const positionShader = /* glsl */`
  uniform float uDelta;
  uniform float uSize;
  uniform float uSpawnStart;
  uniform float uSpawnCount;
  uniform vec3 uSpawnOrigin;
  uniform float uSpawnLife;

  float particleIndex() {
    return floor(gl_FragCoord.y - 0.5) * uSize + floor(gl_FragCoord.x - 0.5);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 p = texture2D(texturePosition, uv);
    vec4 v = texture2D(textureVelocity, uv);
    float idx = particleIndex();
    bool spawning = uSpawnCount > 0.5 && idx >= uSpawnStart && idx < (uSpawnStart + uSpawnCount);

    if (spawning) {
      p = vec4(uSpawnOrigin, uSpawnLife);
    } else if (p.w > 0.0) {
      p.xyz += v.xyz * uDelta;
      p.w -= uDelta;
      if (p.y < 0.0) {
        p.y = 0.0;
      }
    } else {
      p.w = -1.0;
    }

    gl_FragColor = p;
  }
`;

const velocityShader = /* glsl */`
  uniform float uTime;
  uniform float uDelta;
  uniform float uSize;
  uniform float uGravity;
  uniform vec3 uWind;
  uniform float uSpawnStart;
  uniform float uSpawnCount;
  uniform float uSpawnSpeed;
  uniform float uSpawnKind;
  uniform float uSpawnPattern;
  uniform float uSpawnHue;
  uniform float uSpawnSeed;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  vec3 hash31(float p) {
    return vec3(hash11(p + 17.0), hash11(p + 43.0), hash11(p + 91.0));
  }

  vec3 sphereDir(float id) {
    float a = hash11(id * 1.917 + uSpawnSeed) * 6.28318530718;
    float y = hash11(id * 2.731 + uSpawnSeed * 1.37) * 2.0 - 1.0;
    float r = sqrt(max(0.0, 1.0 - y * y));
    return vec3(cos(a) * r, y, sin(a) * r);
  }

  vec3 ringDir(float local, float count) {
    float a = (local / max(1.0, count)) * 6.28318530718;
    vec3 n = normalize(hash31(uSpawnSeed * 7.0) * 2.0 - 1.0);
    vec3 ref = abs(n.y) < 0.85 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    vec3 u = normalize(cross(n, ref));
    vec3 v = normalize(cross(n, u));
    return normalize(u * cos(a) + v * sin(a));
  }

  vec3 palmDir(float id) {
    float branches = 14.0;
    float raw = hash11(id * 1.31 + uSpawnSeed) * branches;
    float branch = floor(raw);
    float a = branch / branches * 6.28318530718 + hash11(branch + uSpawnSeed) * 0.18;
    float spread = 0.55 + hash11(id * 4.2) * 0.45;
    return normalize(vec3(cos(a) * spread, 0.68 + hash11(id) * 0.48, sin(a) * spread));
  }

  vec3 cometDir(float id) {
    vec3 d = sphereDir(id);
    d.y = abs(d.y) * 0.75 + 0.45;
    return normalize(d);
  }

  vec3 heartDir(float local, float count) {
    float t = (local / max(1.0, count)) * 6.28318530718;
    float x = 16.0 * pow(sin(t), 3.0);
    float y = 13.0*cos(t)-5.0*cos(2.0*t)-2.0*cos(3.0*t)-cos(4.0*t);
    vec3 d = normalize(vec3(x, y + 2.0, (hash11(local + uSpawnSeed)-0.5) * 1.8));
    return d;
  }

  vec3 crossDir(float id) {
    vec3 d = sphereDir(floor(id / 4.0));
    float arm = mod(id, 4.0);
    vec3 axis = arm < 1.0 ? vec3(1,0,0) : arm < 2.0 ? vec3(-1,0,0) : arm < 3.0 ? vec3(0,1,0) : vec3(0,-1,0);
    return normalize(d * 0.62 + axis * 0.75);
  }

  vec3 cascadeDir(float id) {
    vec3 d = sphereDir(id);
    d.y = abs(d.y) * 0.55 + 0.22;
    return normalize(d);
  }

  vec3 spiralDir(float local, float count) {
    float t = local / max(1.0, count);
    float y = 1.0 - 2.0 * t;
    float r = sqrt(max(0.0, 1.0-y*y));
    float a = t * 52.0;
    return normalize(vec3(cos(a)*r, y, sin(a)*r));
  }

  float particleIndex() {
    return floor(gl_FragCoord.y - 0.5) * uSize + floor(gl_FragCoord.x - 0.5);
  }

  float dragFor(float kind) {
    if (kind == 2.0 || kind == 10.0) return 0.40;
    if (kind == 4.0 || kind == 7.0) return 0.24;
    if (kind == 5.0 || kind == 6.0) return 0.72;
    if (kind == 14.0) return 0.31;
    return 0.54;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 p = texture2D(texturePosition, uv);
    vec4 state = texture2D(textureVelocity, uv);
    float idx = particleIndex();
    bool spawning = uSpawnCount > 0.5 && idx >= uSpawnStart && idx < (uSpawnStart + uSpawnCount);

    if (spawning) {
      float local = idx - uSpawnStart;
      vec3 dir = sphereDir(idx);
      if (uSpawnPattern < 0.5) dir = sphereDir(idx);
      else if (uSpawnPattern < 1.5) dir = ringDir(local, uSpawnCount);
      else if (uSpawnPattern < 2.5) dir = palmDir(idx);
      else if (uSpawnPattern < 3.5) dir = cometDir(idx);
      else if (uSpawnPattern < 4.5) dir = heartDir(local, uSpawnCount);
      else if (uSpawnPattern < 5.5) dir = crossDir(local);
      else if (uSpawnPattern < 6.5) dir = cascadeDir(idx);
      else if (uSpawnPattern < 7.5) dir = spiralDir(local, uSpawnCount);
      else dir = mix(sphereDir(idx), ringDir(local, uSpawnCount), step(0.54, hash11(local + uSpawnSeed)));

      float speedJitter = mix(0.78, 1.18, hash11(idx * 3.7 + uSpawnSeed));
      state.xyz = dir * uSpawnSpeed * speedJitter;
      state.w = floor(uSpawnKind + 0.5) + min(0.999, fract(uSpawnHue));
    } else if (p.w > 0.0) {
      float kind = floor(state.w + 0.001);
      float drag = dragFor(kind);
      vec3 curl = vec3(
        sin(p.y * 0.031 + uTime * 0.71),
        sin((p.x + p.z) * 0.019 + uTime * 0.47) * 0.22,
        cos(p.x * 0.027 - uTime * 0.63)
      );
      vec3 accel = vec3(0.0, -uGravity, 0.0) + uWind + curl * (0.26 + 0.16 * step(4.5, kind));
      state.xyz += accel * uDelta;
      state.xyz *= exp(-drag * uDelta);
      if (p.y <= 0.001 && state.y < 0.0) {
        state.y *= -0.16;
        state.xz *= 0.56;
      }
    } else {
      state.xyz = vec3(0.0);
    }

    gl_FragColor = state;
  }
`;

const particleVertexShader = /* glsl */`
  uniform sampler2D uPosition;
  uniform sampler2D uVelocity;
  uniform float uPointScale;
  uniform float uTime;
  attribute vec2 aStateUv;
  varying float vLife;
  varying float vKind;
  varying float vHue;
  varying float vSeed;

  float maxLife(float k) {
    if (k == 2.0) return 7.2;
    if (k == 10.0) return 8.2;
    if (k == 4.0) return 5.0;
    if (k == 14.0) return 4.6;
    if (k == 7.0) return 4.5;
    return 4.0;
  }

  void main() {
    vec4 p = texture2D(uPosition, aStateUv);
    vec4 vel = texture2D(uVelocity, aStateUv);
    float kind = floor(vel.w + 0.001);
    float hue = fract(vel.w);
    float life = p.w;
    vKind = kind;
    vHue = hue;
    vLife = clamp(life / maxLife(kind), 0.0, 1.0);
    vSeed = aStateUv.x * 97.13 + aStateUv.y * 231.7;

    vec4 mv = modelViewMatrix * vec4(p.xyz, 1.0);
    float base = kind == 6.0 ? 4.2 : kind == 5.0 ? 3.1 : kind == 7.0 ? 4.6 : 2.7;
    float heat = smoothstep(0.0, 0.38, vLife);
    gl_PointSize = life > 0.0 ? min(96.0, (base + heat * 2.7) * uPointScale / max(1.0, -mv.z)) : 0.0;
    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragmentShader = /* glsl */`
  uniform float uTime;
  varying float vLife;
  varying float vKind;
  varying float vHue;
  varying float vSeed;

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0*l-1.0));
  }

  float hash(float x) { return fract(sin(x) * 43758.5453123); }

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float r = length(q) * 2.0;
    if (r > 1.0 || vLife <= 0.0) discard;

    float flicker = 1.0;
    if (vKind == 5.0) flicker = step(0.30, hash(floor(uTime*34.0) + vSeed));
    if (vKind == 6.0) flicker = step(0.52, sin(uTime*58.0 + vSeed*11.0)*0.5+0.5);

    vec3 chroma = hsl2rgb(vHue, 0.92, 0.57);
    float whiteHot = smoothstep(0.56, 0.94, vLife);
    float ember = 1.0 - smoothstep(0.02, 0.28, vLife);
    vec3 color = mix(chroma, vec3(1.0,0.95,0.82), whiteHot * 0.92);
    color = mix(color, vec3(1.0,0.18,0.015), ember * 0.82);
    if (vKind == 2.0 || vKind == 10.0 || vKind == 14.0) color = mix(color, vec3(1.0,0.66,0.18), 0.42);

    float core = exp(-r*r*26.0);
    float halo = exp(-r*r*4.4) * 0.38;
    float alpha = (core + halo) * smoothstep(0.0,0.11,vLife) * flicker;
    gl_FragColor = vec4(color * (1.45 + core*1.8), alpha);
  }
`;

const trailVertexShader = /* glsl */`
  uniform sampler2D uPosition;
  uniform sampler2D uVelocity;
  uniform float uTrailScale;
  attribute vec2 aStateUv;
  attribute float aTrailT;
  varying float vAlpha;
  varying float vHue;
  varying float vKind;

  void main() {
    vec4 p = texture2D(uPosition, aStateUv);
    vec4 vel = texture2D(uVelocity, aStateUv);
    float kind = floor(vel.w + 0.001);
    float hue = fract(vel.w);
    float lengthScale = (kind == 2.0 || kind == 10.0) ? 0.42 : (kind == 4.0 || kind == 7.0) ? 0.30 : 0.18;
    vec3 wp = p.xyz - vel.xyz * uTrailScale * lengthScale * aTrailT;
    vAlpha = p.w > 0.0 ? (1.0-aTrailT) * clamp(p.w*0.8,0.0,1.0) : 0.0;
    vHue = hue;
    vKind = kind;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(wp,1.0);
  }
`;

const trailFragmentShader = /* glsl */`
  varying float vAlpha;
  varying float vHue;
  varying float vKind;
  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0*l-1.0));
  }
  void main() {
    vec3 c = hsl2rgb(vHue,0.88,0.58);
    if (vKind == 2.0 || vKind == 10.0 || vKind == 14.0) c = mix(c,vec3(1.0,.55,.12),.55);
    gl_FragColor = vec4(c*1.45, vAlpha*0.42);
  }
`;

const smokeVertex = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position,1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const smokeFragment = /* glsl */`
  uniform vec3 uCenter;
  uniform float uRadius;
  uniform float uDensity;
  uniform float uAge;
  uniform float uTime;
  uniform vec3 uTint;
  uniform vec3 uWind;
  uniform vec3 uFlashPos[4];
  uniform vec3 uFlashColor[4];
  uniform float uFlashPower[4];
  varying vec3 vWorld;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float n000=hash31(i+vec3(0,0,0)), n100=hash31(i+vec3(1,0,0));
    float n010=hash31(i+vec3(0,1,0)), n110=hash31(i+vec3(1,1,0));
    float n001=hash31(i+vec3(0,0,1)), n101=hash31(i+vec3(1,0,1));
    float n011=hash31(i+vec3(0,1,1)), n111=hash31(i+vec3(1,1,1));
    return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y),f.z);
  }

  float fbm(vec3 p) {
    float n=0.0, a=.52;
    for(int i=0;i<4;i++){n+=noise3(p)*a;p=p*2.03+vec3(7.1,3.4,5.6);a*=.48;}
    return n;
  }

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorld - ro);
    vec3 oc = ro - uCenter;
    float b = dot(oc,rd);
    float c = dot(oc,oc)-uRadius*uRadius;
    float h = b*b-c;
    if(h<0.0) discard;
    h=sqrt(h);
    float t0=max(0.0,-b-h), t1=-b+h;
    if(t1<=t0) discard;

    float span=t1-t0;
    float stepLen=span/14.0;
    float optical=0.0;
    vec3 scatter=vec3(0.0);
    for(int i=0;i<14;i++){
      float t=t0+(float(i)+.5)*stepLen;
      vec3 wp=ro+rd*t;
      vec3 lp=(wp-uCenter)/uRadius;
      float edge=smoothstep(1.0,.18,length(lp));
      vec3 adv=wp*.025-vec3(uWind.x,0.0,uWind.z)*uAge*.015+vec3(0.0,uTime*.025,0.0);
      float n=fbm(adv);
      float d=edge*smoothstep(.25,.78,n)*uDensity;
      optical+=d*stepLen*.045;
      vec3 light=vec3(.018,.022,.032);
      for(int j=0;j<4;j++){
        float dist=length(uFlashPos[j]-wp);
        light += uFlashColor[j] * uFlashPower[j] / (1.0 + dist*dist*.0025);
      }
      scatter += (uTint*.08 + light) * d * stepLen * .035 * exp(-optical*.22);
    }
    float alpha=1.0-exp(-optical*.72);
    vec3 smokeBase=mix(vec3(.020,.024,.032),vec3(.075,.082,.095),clamp(uAge*.04,0.0,1.0));
    vec3 color=smokeBase*alpha+scatter;
    gl_FragColor=vec4(color,alpha*.72);
  }
`;

const skyVertex = /* glsl */`
  varying vec3 vDir;
  void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const skyFragment = /* glsl */`
  uniform vec3 uGlow;
  uniform float uTime;
  varying vec3 vDir;
  void main(){
    vec3 n=normalize(vDir);float h=max(n.y,0.0);
    vec3 c=mix(vec3(.0012,.0022,.006),vec3(.002,.006,.016),pow(h,.45));
    float horizon=exp(-abs(n.y)*8.0);c+=vec3(.012,.018,.030)*horizon;
    c+=uGlow*(.035+.12*horizon);
    float m=dot(n,normalize(vec3(-.43,.33,-.84)));
    c+=vec3(.18,.19,.22)*(smoothstep(.99972,.99986,m)+pow(max(m,0.0),180.0)*.05);
    gl_FragColor=vec4(c,1.0);
  }
`;

const waterVertex = /* glsl */`
  uniform float uTime;
  varying vec3 vWorld;
  varying float vWave;
  void main(){
    vec3 p=position;
    p.z += sin(p.x*.018+uTime*.72)*.32 + sin(p.y*.026-uTime*.49)*.18 + sin((p.x+p.y)*.011+uTime*.31)*.13;
    vec4 w=modelMatrix*vec4(p,1.0);vWorld=w.xyz;vWave=p.z;gl_Position=projectionMatrix*viewMatrix*w;
  }
`;
const waterFragment = /* glsl */`
  uniform sampler2D uReflection;
  uniform mat4 uReflectVP;
  uniform float uTime;
  uniform float uReflectStrength;
  uniform vec3 uGlow;
  varying vec3 vWorld;
  varying float vWave;
  void main(){
    vec4 clip=uReflectVP*vec4(vWorld,1.0);vec2 uv=clip.xy/max(.0001,clip.w)*.5+.5;
    vec2 distort=vec2(sin(vWorld.z*.031+uTime*1.2),cos(vWorld.x*.027-uTime*.91))*.0045;
    vec3 refl=texture2D(uReflection,uv+distort).rgb;
    float fres=pow(1.0-clamp(abs(normalize(cameraPosition-vWorld).y),0.0,1.0),2.2);
    float sparkle=pow(max(0.0,sin(vWorld.x*.074+vWorld.z*.011+uTime*.6)),34.0)*.025;
    vec3 base=vec3(.0015,.006,.011)+uGlow*.018;
    vec3 c=mix(base,refl,uReflectStrength*(.25+.75*fres))+sparkle;
    gl_FragColor=vec4(c,.96);
  }
`;

const filmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uChromatic: { value: 0.0012 },
    uGrain: { value: 0.018 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse;uniform float uTime,uChromatic,uGrain;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec2 d=vUv-.5;float a=dot(d,d)*uChromatic;vec3 c=vec3(texture2D(tDiffuse,vUv+d*a).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-d*a).b);float vig=1.0-smoothstep(.32,.78,dot(d,d));c*=mix(.72,1.0,vig);c+=(hash(vUv*vec2(1920.,1080.)+uTime)-.5)*uGrain;gl_FragColor=vec4(c,1.0);}
  `,
};

class PyroAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.enabled = true;
    this.volume = 0.85;
  }

  async resume() {
    if (!this.ctx) this.#init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  #init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 8;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.5;

    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(compressor);
    compressor.connect(this.ctx.destination);

    const convolver = this.ctx.createConvolver();
    const ir = this.ctx.createBuffer(2, this.ctx.sampleRate * 4, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 2.2);
    }
    convolver.buffer = ir;
    const wet = this.ctx.createGain(); wet.gain.value = 0.22;
    this.master.connect(convolver); convolver.connect(wet); wet.connect(compressor);
  }

  setEnabled(v) { this.enabled = v; }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }

  #noise(t, dur, f0, f1, gain, pan = 0, type = 'lowpass') {
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer; src.loop = true;
    const filter = this.ctx.createBiquadFilter(); filter.type = type; filter.frequency.setValueAtTime(Math.max(20,f0),t); filter.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(Math.max(.0001,gain),t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan,-1,1);
    src.connect(filter); filter.connect(g); g.connect(p); p.connect(this.master); src.start(t,Math.random()); src.stop(t+dur+.08);
  }

  #tone(t, f0, f1, dur, gain, pan = 0) {
    const osc=this.ctx.createOscillator(),g=this.ctx.createGain(),p=this.ctx.createStereoPanner();
    osc.type='sine';osc.frequency.setValueAtTime(f0,t);osc.frequency.exponentialRampToValueAtTime(Math.max(18,f1),t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);p.pan.value=clamp(pan,-1,1);
    osc.connect(g);g.connect(p);p.connect(this.master);osc.start(t);osc.stop(t+dur+.08);
  }

  burst(position, camera, power=1) {
    if (!this.ctx || !this.enabled) return;
    const d=position.distanceTo(camera.position), delay=d/343, t=this.ctx.currentTime+delay, pan=clamp((position.x-camera.position.x)/500,-.9,.9), gain=Math.min(1.2,power*170/(d+90));
    this.#noise(t,.045,8000,2400,gain*.50,pan,'lowpass');
    this.#noise(t,.95,850,55,gain*.90,pan,'lowpass');
    this.#noise(t+.08,2.7,360,38,gain*.62,pan,'lowpass');
    this.#tone(t,rr(86,118),24,1.05,gain*.72,pan);
    if(Math.random()<.65)this.#noise(t+rr(.12,.28),.42,4200,900,gain*.22,pan,'bandpass');
  }

  launch(position, camera) {
    if (!this.ctx || !this.enabled) return;
    const d=position.distanceTo(camera.position), t=this.ctx.currentTime+d/343, pan=clamp((position.x-camera.position.x)/500,-.9,.9), gain=Math.min(.45,130/(d+70));
    this.#tone(t,155,44,.42,gain,pan);this.#noise(t,.45,950,120,gain*.7,pan,'bandpass');
  }
}

class SmokeVolumeSystem {
  constructor(scene) {
    this.scene = scene;
    this.geometry = new THREE.SphereGeometry(1, 18, 12);
    this.pool = [];
    this.flashPos = Array.from({length:4},()=>new THREE.Vector3());
    this.flashColor = Array.from({length:4},()=>new THREE.Color());
    this.flashPower = new Float32Array(4);
    for (let i=0;i<28;i++) this.pool.push(this.#makeCloud());
  }

  #makeCloud() {
    const material = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, depthTest:true, side:THREE.BackSide,
      blending:THREE.NormalBlending,
      uniforms:{
        uCenter:{value:new THREE.Vector3()}, uRadius:{value:1}, uDensity:{value:0}, uAge:{value:0}, uTime:{value:0},
        uTint:{value:new THREE.Color(.1,.1,.1)}, uWind:{value:new THREE.Vector3()},
        uFlashPos:{value:this.flashPos},uFlashColor:{value:this.flashColor},uFlashPower:{value:this.flashPower},
      },
      vertexShader:smokeVertex, fragmentShader:smokeFragment,
    });
    const mesh = new THREE.Mesh(this.geometry, material); mesh.visible=false; mesh.renderOrder=6; this.scene.add(mesh);
    return {mesh,material,active:false,age:0,life:0,center:new THREE.Vector3(),radius:1,density:0,tint:new THREE.Color()};
  }

  spawn(origin, color, intensity=1) {
    const count = Math.min(4, 2 + Math.round(intensity));
    for(let n=0;n<count;n++){
      let c=this.pool.find(x=>!x.active);if(!c)c=this.pool.reduce((a,b)=>a.age>b.age?a:b);
      c.active=true;c.age=0;c.life=rr(11,17);c.center.copy(origin).add(new THREE.Vector3(rr(-14,14),rr(-8,10),rr(-12,12)));c.radius=rr(16,26)*(1+.2*intensity);c.density=rr(.42,.70)*(1+.18*intensity);c.tint.copy(color).multiplyScalar(.34).addScalar(.025);c.mesh.visible=true;
    }
  }

  setFlashes(flashes) {
    for(let i=0;i<4;i++){
      const f=flashes[i];
      if(f){this.flashPos[i].copy(f.position);this.flashColor[i].copy(f.color);this.flashPower[i]=f.power;}
      else{this.flashPos[i].set(0,-10000,0);this.flashColor[i].setRGB(0,0,0);this.flashPower[i]=0;}
    }
  }

  update(dt,time,wind) {
    for(const c of this.pool){
      if(!c.active)continue;c.age+=dt;if(c.age>=c.life){c.active=false;c.mesh.visible=false;continue;}
      c.center.x+=wind.x*dt*.22;c.center.z+=wind.z*dt*.16;c.center.y+=dt*(.24+.18*c.age/c.life);c.radius+=dt*(2.2+1.5*c.age/c.life);c.density*=Math.exp(-dt*.055);
      c.mesh.position.copy(c.center);c.mesh.scale.setScalar(c.radius);
      const u=c.material.uniforms;u.uCenter.value.copy(c.center);u.uRadius.value=c.radius;u.uDensity.value=c.density;u.uAge.value=c.age;u.uTime.value=time;u.uTint.value.copy(c.tint);u.uWind.value.copy(wind);
    }
  }

  reset(){for(const c of this.pool){c.active=false;c.mesh.visible=false;}}
}

export class GPUPyroEngine {
  constructor(canvas, options={}) {
    this.canvas=canvas;
    this.config={gravity:12.8,wind:0.9,bloom:1.15,exposure:1.0,reflection:.62,smoke:1.0,trail:1.0,volume:.85,...options};
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',stencil:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=.92;
    this.scene=new THREE.Scene();
    this.scene.fog=new THREE.FogExp2(0x02040a,.00055);
    this.camera=new THREE.PerspectiveCamera(54,1,.5,4500);
    this.camera.position.set(0,2.2,270);
    this.cameraMode='ground';
    this.cameraYaw=0;this.cameraPitch=.19;this.cameraZoom=1;
    this.mirrorCamera=this.camera.clone();
    this.time=0;this.spawnHead=0;this.rockets=[];this.flashes=[];this.glow=new THREE.Color();this.autoExposure=.92;this.metrics={particles:0,fps:60,gpu:true};this._fpsClock=0;this._fpsFrames=0;
    this.audio=new PyroAudio();
    this.#initEnvironment();
    this.#initCompute();
    this.#initParticles();
    this.smoke=new SmokeVolumeSystem(this.scene);
    this.#initRockets();
    this.#initReflection();
    this.#initPost();
    this.resize();
  }

  #initEnvironment(){
    this.skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,uniforms:{uGlow:{value:new THREE.Color()},uTime:{value:0}},vertexShader:skyVertex,fragmentShader:skyFragment});
    this.sky=new THREE.Mesh(new THREE.SphereGeometry(3000,48,24),this.skyMaterial);this.sky.renderOrder=-10;this.scene.add(this.sky);

    const starCount=3200,pos=new Float32Array(starCount*3),col=new Float32Array(starCount*3);
    for(let i=0;i<starCount;i++){const a=Math.random()*TAU,y=rr(.08,.88),r=2450,s=Math.sqrt(1-y*y);pos[i*3]=Math.cos(a)*s*r;pos[i*3+1]=y*r;pos[i*3+2]=Math.sin(a)*s*r;const br=rr(.28,.8);col[i*3]=br*.72;col[i*3+1]=br*.8;col[i*3+2]=br;}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));sg.setAttribute('color',new THREE.BufferAttribute(col,3));this.stars=new THREE.Points(sg,new THREE.PointsMaterial({vertexColors:true,size:1.45,sizeAttenuation:false,transparent:true,opacity:.62,depthWrite:false,fog:false}));this.scene.add(this.stars);

    const ground=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshStandardMaterial({color:0x010203,roughness:.96,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=false;this.scene.add(ground);

    const ridge=(seed,z,base,amp,color)=>{let s=seed>>>0,rand=()=>((s=(s*1664525+1013904223)>>>0)/4294967296),sh=new THREE.Shape();sh.moveTo(-1500,-50);for(let i=0;i<=64;i++){const x=-1500+i*(3000/64),y=base+Math.pow(rand(),1.7)*amp+Math.sin(i*.61)*amp*.12;sh.lineTo(x,y)}sh.lineTo(1500,-50);sh.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color,fog:true}));mesh.position.z=z;mesh.renderOrder=-3;this.scene.add(mesh);};
    ridge(981,-1180,35,170,0x010309);ridge(1771,-1090,20,115,0x020611);ridge(8821,-1000,8,72,0x030814);

    const lightsN=1300,lp=new Float32Array(lightsN*3),lc=new Float32Array(lightsN*3);
    for(let i=0;i<lightsN;i++){const u=i/lightsN;lp[i*3]=(u-.5)*2100;lp[i*3+1]=Math.random()<.35?rr(1,9):rr(8,58);lp[i*3+2]=-980-Math.pow(Math.abs(u-.52)*2,2)*110+rr(-8,8);const warm=Math.random();lc[i*3]=warm<.76?1:.45;lc[i*3+1]=warm<.76?rr(.62,.92):.72;lc[i*3+2]=warm<.76?rr(.24,.55):1;}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));lg.setAttribute('color',new THREE.BufferAttribute(lc,3));this.cityLights=new THREE.Points(lg,new THREE.PointsMaterial({vertexColors:true,size:2.3,sizeAttenuation:false,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));this.scene.add(this.cityLights);

    const ambient=new THREE.HemisphereLight(0x17213a,0x010102,.18);this.scene.add(ambient);
  }

  #initCompute(){
    this.computeSize=512;this.capacity=this.computeSize*this.computeSize;
    this.gpuCompute=new GPUComputationRenderer(this.computeSize,this.computeSize,this.renderer);
    this.gpuCompute.setDataType(THREE.HalfFloatType);
    const posTex=this.gpuCompute.createTexture(),velTex=this.gpuCompute.createTexture();
    for(let i=0;i<posTex.image.data.length;i+=4){posTex.image.data[i]=0;posTex.image.data[i+1]=0;posTex.image.data[i+2]=0;posTex.image.data[i+3]=-1;velTex.image.data[i]=0;velTex.image.data[i+1]=0;velTex.image.data[i+2]=0;velTex.image.data[i+3]=0;}
    this.initialPosition=posTex;this.initialVelocity=velTex;
    this.positionVariable=this.gpuCompute.addVariable('texturePosition',positionShader,posTex);
    this.velocityVariable=this.gpuCompute.addVariable('textureVelocity',velocityShader,velTex);
    this.gpuCompute.setVariableDependencies(this.positionVariable,[this.positionVariable,this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable,[this.positionVariable,this.velocityVariable]);
    const common=(m)=>{m.uniforms.uDelta={value:0};m.uniforms.uSize={value:this.computeSize};m.uniforms.uSpawnStart={value:0};m.uniforms.uSpawnCount={value:0};};
    common(this.positionVariable.material);common(this.velocityVariable.material);
    Object.assign(this.positionVariable.material.uniforms,{uSpawnOrigin:{value:new THREE.Vector3()},uSpawnLife:{value:1}});
    Object.assign(this.velocityVariable.material.uniforms,{uTime:{value:0},uGravity:{value:this.config.gravity},uWind:{value:new THREE.Vector3()},uSpawnSpeed:{value:1},uSpawnKind:{value:0},uSpawnPattern:{value:0},uSpawnHue:{value:.1},uSpawnSeed:{value:1}});
    const err=this.gpuCompute.init();if(err)throw new Error(`GPU compute init failed: ${err}`);
  }

  #stateTextures(){return {position:this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture,velocity:this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture};}

  #initParticles(){
    const uv=new Float32Array(this.capacity*2),dummy=new Float32Array(this.capacity*3);
    for(let i=0;i<this.capacity;i++){uv[i*2]=(i%this.computeSize+.5)/this.computeSize;uv[i*2+1]=(Math.floor(i/this.computeSize)+.5)/this.computeSize;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(dummy,3));g.setAttribute('aStateUv',new THREE.BufferAttribute(uv,2));
    this.particleMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,uniforms:{uPosition:{value:null},uVelocity:{value:null},uPointScale:{value:900},uTime:{value:0}},vertexShader:particleVertexShader,fragmentShader:particleFragmentShader});
    this.particles=new THREE.Points(g,this.particleMaterial);this.particles.frustumCulled=false;this.particles.renderOrder=5;this.scene.add(this.particles);

    const trailUv=new Float32Array(this.capacity*4),trailT=new Float32Array(this.capacity*2),trailDummy=new Float32Array(this.capacity*2*3);
    for(let i=0;i<this.capacity;i++){const ux=uv[i*2],uy=uv[i*2+1],j=i*4;trailUv[j]=ux;trailUv[j+1]=uy;trailUv[j+2]=ux;trailUv[j+3]=uy;trailT[i*2]=0;trailT[i*2+1]=1;}
    const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(trailDummy,3));tg.setAttribute('aStateUv',new THREE.BufferAttribute(trailUv,2));tg.setAttribute('aTrailT',new THREE.BufferAttribute(trailT,1));
    this.trailMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,uniforms:{uPosition:{value:null},uVelocity:{value:null},uTrailScale:{value:this.config.trail}},vertexShader:trailVertexShader,fragmentShader:trailFragmentShader});
    this.trails=new THREE.LineSegments(tg,this.trailMaterial);this.trails.frustumCulled=false;this.trails.renderOrder=4;this.scene.add(this.trails);
  }

  #initRockets(){
    this.maxRockets=96;const pos=new Float32Array(this.maxRockets*2*3);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
    this.rocketGeometry=g;this.rocketLines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xffd26e,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));this.rocketLines.frustumCulled=false;this.rocketLines.renderOrder=7;this.scene.add(this.rocketLines);
  }

  #initReflection(){
    this.reflectionTarget=new THREE.WebGLRenderTarget(640,360,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    this.waterMaterial=new THREE.ShaderMaterial({transparent:false,depthWrite:true,depthTest:true,uniforms:{uReflection:{value:this.reflectionTarget.texture},uReflectVP:{value:new THREE.Matrix4()},uTime:{value:0},uReflectStrength:{value:this.config.reflection},uGlow:{value:new THREE.Color()}},vertexShader:waterVertex,fragmentShader:waterFragment});
    this.water=new THREE.Mesh(new THREE.PlaneGeometry(4400,4400,96,96),this.waterMaterial);this.water.rotation.x=-Math.PI/2;this.water.position.y=.01;this.water.renderOrder=1;this.scene.add(this.water);
  }

  #initPost(){
    const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false});
    this.composer=new EffectComposer(this.renderer,rt);this.renderPass=new RenderPass(this.scene,this.camera);this.bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),this.config.bloom,.72,.78);this.filmPass=new ShaderPass(filmShader);this.outputPass=new OutputPass();this.composer.addPass(this.renderPass);this.composer.addPass(this.bloomPass);this.composer.addPass(this.filmPass);this.composer.addPass(this.outputPass);
  }

  resize(){
    const w=Math.max(1,this.canvas.clientWidth||window.innerWidth),h=Math.max(1,this.canvas.clientHeight||window.innerHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.composer.setSize(w,h);this.bloomPass.setSize(w,h);const scale=.52*this.renderer.getPixelRatio();this.reflectionTarget.setSize(Math.max(320,Math.floor(w*scale)),Math.max(180,Math.floor(h*scale)));this.particleMaterial.uniforms.uPointScale.value=h*this.renderer.getPixelRatio()/(2*Math.tan(this.camera.fov*Math.PI/360));
  }

  setCameraMode(mode){if(['ground','drone','director'].includes(mode))this.cameraMode=mode;}
  orbit(dx,dy){this.cameraYaw+=dx*.0035;this.cameraPitch=clamp(this.cameraPitch+dy*.0035,-.08,1.15);}
  zoom(delta){this.cameraZoom=clamp(this.cameraZoom+delta*.001,0.48,1.55);this.camera.fov=54*this.cameraZoom;this.camera.updateProjectionMatrix();}

  setConfig(next){Object.assign(this.config,next);this.bloomPass.strength=this.config.bloom;this.waterMaterial.uniforms.uReflectStrength.value=this.config.reflection;this.trailMaterial.uniforms.uTrailScale.value=this.config.trail;this.audio.setVolume(this.config.volume);}

  async enableAudio(){await this.audio.resume();}
  setSound(v){this.audio.setEnabled(v);}

  #pickHue(palette='reveillon'){const p=PALETTES[palette]||PALETTES.reveillon;return p[Math.floor(Math.random()*p.length)] + rr(-.015,.015);}

  #applySpawn(start,count,params){
    const pU=this.positionVariable.material.uniforms,vU=this.velocityVariable.material.uniforms;
    pU.uSpawnStart.value=vU.uSpawnStart.value=start;pU.uSpawnCount.value=vU.uSpawnCount.value=count;pU.uSpawnOrigin.value.copy(params.origin);pU.uSpawnLife.value=params.life;
    vU.uSpawnSpeed.value=params.speed;vU.uSpawnKind.value=params.kind;vU.uSpawnPattern.value=params.pattern;vU.uSpawnHue.value=params.hue;vU.uSpawnSeed.value=params.seed;
    pU.uDelta.value=vU.uDelta.value=0;vU.uTime.value=this.time;this.gpuCompute.compute();pU.uSpawnCount.value=vU.uSpawnCount.value=0;
  }

  #spawnParticles(count,params){
    count=Math.min(this.capacity,Math.max(1,Math.floor(count)));let remaining=count;
    while(remaining>0){const chunk=Math.min(remaining,this.capacity-this.spawnHead);this.#applySpawn(this.spawnHead,chunk,params);this.spawnHead=(this.spawnHead+chunk)%this.capacity;remaining-=chunk;}
    this.metrics.particles=Math.min(this.capacity,this.metrics.particles+count);
  }

  burst(origin,type='peony',options={}){
    const cfg=TYPE_CONFIG[type]||TYPE_CONFIG.peony,intensity=clamp(options.intensity??1,.25,2.3),palette=options.palette||'reveillon',hue=options.hue??this.#pickHue(palette),color=new THREE.Color().setHSL((hue%1+1)%1,.92,.59);
    this.#spawnParticles(cfg.particles*intensity,{origin,life:cfg.life*lerp(.9,1.16,intensity/2.3),speed:cfg.speed*lerp(.92,1.18,intensity/2.3),kind:cfg.kind,pattern:cfg.pattern,hue,seed:Math.random()*999});
    if(type==='pistilo'||type==='duplo'||type==='saturno')this.#spawnParticles(Math.floor(cfg.particles*.42*intensity),{origin,life:cfg.life*.78,speed:cfg.speed*.48,kind:cfg.kind,pattern:type==='saturno'?1:0,hue:this.#pickHue(palette),seed:Math.random()*999});
    this.flashes.unshift({position:origin.clone(),color,power:3.2*intensity,life:.75,age:0});this.flashes.length=Math.min(this.flashes.length,8);this.smoke.spawn(origin,color,this.config.smoke*intensity);this.audio.burst(origin,this.camera,intensity);
  }

  launch(type='peony',options={}){
    const height=options.height??rr(110,230),x=options.x??rr(-410,410),z=options.z??rr(-430,-215),vy=Math.sqrt(2*9.81*height),flight=vy/9.81,targetX=options.targetX??x+rr(-35,35),targetZ=options.targetZ??z+rr(-25,25),origin=new THREE.Vector3(x,.4,z);
    this.rockets.push({type,position:origin.clone(),previous:origin.clone(),velocity:new THREE.Vector3((targetX-x)/flight,vy,(targetZ-z)/flight),intensity:options.intensity??1,palette:options.palette||'reveillon'});if(this.rockets.length>this.maxRockets)this.rockets.shift();this.audio.launch(origin,this.camera);
  }

  finale(){
    const waves=[
      ['cometa',0,9],['peony',900,12],['anel',1900,7],['pistilo',2800,10],['willow',3900,8],['strobo',5200,12],['reveillon',6400,16],['kamuro',8000,12],['duplo',9800,16],['reveillon',11600,22]
    ];
    for(const [type,delay,count] of waves)for(let i=0;i<count;i++)setTimeout(()=>this.launch(type,{x:lerp(-430,430,(i+.5)/count)+rr(-22,22),height:rr(120,245),intensity:delay>9000?1.5:1}),delay+i*rr(45,120));
  }

  reset(){
    this.gpuCompute.renderTexture(this.initialPosition,this.gpuCompute.getCurrentRenderTarget(this.positionVariable));this.gpuCompute.renderTexture(this.initialPosition,this.gpuCompute.getAlternateRenderTarget(this.positionVariable));this.gpuCompute.renderTexture(this.initialVelocity,this.gpuCompute.getCurrentRenderTarget(this.velocityVariable));this.gpuCompute.renderTexture(this.initialVelocity,this.gpuCompute.getAlternateRenderTarget(this.velocityVariable));this.spawnHead=0;this.rockets.length=0;this.flashes.length=0;this.smoke.reset();this.metrics.particles=0;
  }

  #updateRockets(dt){
    const arr=this.rocketGeometry.attributes.position.array;arr.fill(0);for(let i=this.rockets.length-1;i>=0;i--){const r=this.rockets[i];r.previous.copy(r.position);r.velocity.y-=9.81*dt;r.position.addScaledVector(r.velocity,dt);if(r.velocity.y<3.5){this.burst(r.position,r.type,{intensity:r.intensity,palette:r.palette});this.rockets.splice(i,1);continue;}}
    for(let i=0;i<this.rockets.length;i++){const r=this.rockets[i],j=i*6;arr[j]=r.previous.x;arr[j+1]=r.previous.y;arr[j+2]=r.previous.z;arr[j+3]=r.position.x;arr[j+4]=r.position.y;arr[j+5]=r.position.z;}this.rocketGeometry.setDrawRange(0,this.rockets.length*2);this.rocketGeometry.attributes.position.needsUpdate=true;
  }

  #updateCamera(dt){
    if(this.cameraMode==='ground'){
      const target=new THREE.Vector3(0,105,-260),radius=270;const desired=new THREE.Vector3(Math.sin(this.cameraYaw)*radius,2.05+Math.sin(this.time*.7)*.025,260+Math.cos(this.cameraYaw)*18);this.camera.position.lerp(desired,1-Math.exp(-dt*4));target.y+=Math.sin(this.cameraPitch)*160;this.camera.lookAt(target);
    } else if(this.cameraMode==='drone'){
      const a=this.time*.055+this.cameraYaw,desired=new THREE.Vector3(Math.sin(a)*420,150+Math.sin(this.time*.11)*35,Math.cos(a)*420-140),target=new THREE.Vector3(0,105,-330);this.camera.position.lerp(desired,1-Math.exp(-dt*1.2));this.camera.lookAt(target);
    } else {
      const a=this.time*.075,desired=new THREE.Vector3(Math.sin(a)*lerp(170,430,.5+.5*Math.sin(this.time*.043)),55+70*(.5+.5*Math.sin(this.time*.061)),120+Math.cos(a)*260),target=new THREE.Vector3(Math.sin(this.time*.037)*90,120+Math.sin(this.time*.07)*25,-330);this.camera.position.lerp(desired,1-Math.exp(-dt*.85));this.camera.lookAt(target);
    }
    this.camera.updateMatrixWorld();
  }

  #updateReflection(){
    const dir=new THREE.Vector3();this.camera.getWorldDirection(dir);dir.y*=-1;this.mirrorCamera.copy(this.camera,false);this.mirrorCamera.position.copy(this.camera.position);this.mirrorCamera.position.y*=-1;this.mirrorCamera.up.set(0,-1,0);this.mirrorCamera.lookAt(this.mirrorCamera.position.clone().add(dir));this.mirrorCamera.updateMatrixWorld();this.mirrorCamera.matrixWorldInverse.copy(this.mirrorCamera.matrixWorld).invert();this.waterMaterial.uniforms.uReflectVP.value.multiplyMatrices(this.mirrorCamera.projectionMatrix,this.mirrorCamera.matrixWorldInverse);
    const previous=this.renderer.getRenderTarget();this.water.visible=false;this.renderer.setRenderTarget(this.reflectionTarget);this.renderer.clear();this.renderer.render(this.scene,this.mirrorCamera);this.renderer.setRenderTarget(previous);this.water.visible=true;
  }

  update(dt){
    dt=Math.min(.05,Math.max(0,dt));this.time+=dt;this.#updateCamera(dt);this.#updateRockets(dt);
    const wind=new THREE.Vector3((Math.sin(this.time*.071)*.6+.75)*this.config.wind,0,Math.cos(this.time*.053)*.18*this.config.wind);
    const pU=this.positionVariable.material.uniforms,vU=this.velocityVariable.material.uniforms;pU.uDelta.value=vU.uDelta.value=dt;vU.uTime.value=this.time;vU.uGravity.value=this.config.gravity;vU.uWind.value.copy(wind);pU.uSpawnCount.value=vU.uSpawnCount.value=0;this.gpuCompute.compute();
    const tex=this.#stateTextures();this.particleMaterial.uniforms.uPosition.value=tex.position;this.particleMaterial.uniforms.uVelocity.value=tex.velocity;this.particleMaterial.uniforms.uTime.value=this.time;this.trailMaterial.uniforms.uPosition.value=tex.position;this.trailMaterial.uniforms.uVelocity.value=tex.velocity;

    let energy=0;for(let i=this.flashes.length-1;i>=0;i--){const f=this.flashes[i];f.age+=dt;f.power*=Math.exp(-dt*4.6);energy+=f.power;if(f.age>f.life||f.power<.02)this.flashes.splice(i,1);}const top=this.flashes.slice(0,4);this.smoke.setFlashes(top);this.smoke.update(dt,this.time,wind);
    this.glow.setRGB(0,0,0);for(const f of top)this.glow.add(f.color.clone().multiplyScalar(Math.min(.35,f.power*.065)));this.skyMaterial.uniforms.uGlow.value.copy(this.glow);this.skyMaterial.uniforms.uTime.value=this.time;this.waterMaterial.uniforms.uGlow.value.copy(this.glow);this.waterMaterial.uniforms.uTime.value=this.time;
    const targetExposure=this.config.exposure/(1+energy*.055),rate=targetExposure<this.autoExposure?9:.72;this.autoExposure=lerp(this.autoExposure,targetExposure,1-Math.exp(-dt*rate));this.renderer.toneMappingExposure=this.autoExposure;
    this.bloomPass.strength=this.config.bloom;this.filmPass.uniforms.uTime.value=this.time;
    this.#updateReflection();this.composer.render();

    this._fpsClock+=dt;this._fpsFrames++;if(this._fpsClock>.5){this.metrics.fps=Math.round(this._fpsFrames/this._fpsClock);this._fpsClock=0;this._fpsFrames=0;}
  }
}

export const FIREWORK_TYPES=Object.keys(TYPE_CONFIG);
export const PYRO_PALETTES=Object.keys(PALETTES);
