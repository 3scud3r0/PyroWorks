import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../src/gpu-engine.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/next-main.js', import.meta.url), 'utf8');

test('uses current modular Three.js and GPUComputationRenderer', () => {
  assert.match(html, /three@0\.186\.1\/build\/three\.module\.js/);
  assert.match(engine, /GPUComputationRenderer/);
  assert.match(engine, /computeSize=512/);
  assert.match(engine, /capacity=this\.computeSize\*this\.computeSize/);
});

test('particle state lives in GPU ping-pong render targets', () => {
  assert.match(engine, /addVariable\('texturePosition'/);
  assert.match(engine, /addVariable\('textureVelocity'/);
  assert.match(engine, /setVariableDependencies/);
  assert.match(engine, /gpuCompute\.compute\(\)/);
  assert.match(engine, /uSpawnStart/);
});

test('trails derive from simulated velocity instead of screen afterimage', () => {
  assert.match(engine, /p\.xyz - vel\.xyz \* uTrailScale/);
  assert.match(engine, /new THREE\.LineSegments/);
  assert.doesNotMatch(engine, /AfterimagePass/);
});

test('combustion shader transitions white-hot stars into embers', () => {
  assert.match(engine, /whiteHot/);
  assert.match(engine, /ember/);
  assert.match(engine, /vec3\(1\.0,0\.18,0\.015\)/);
});

test('volumetric smoke raymarches density and receives spatial flash lighting', () => {
  assert.match(engine, /for\(int i=0;i<14;i\+\+\)/);
  assert.match(engine, /uFlashPos\[4\]/);
  assert.match(engine, /1\.0-exp\(-optical/);
  assert.match(engine, /SmokeVolumeSystem/);
});

test('water samples a half-float HDR reflection target', () => {
  assert.match(engine, /reflectionTarget=new THREE\.WebGLRenderTarget/);
  assert.match(engine, /THREE\.HalfFloatType/);
  assert.match(engine, /uReflectVP/);
  assert.match(engine, /texture2D\(uReflection/);
});

test('editor timeline directly schedules the new GPU engine', () => {
  assert.match(html, /id="eventTrack"/);
  assert.match(html, /id="eventInspector"/);
  assert.match(app, /engine\.launch\(ev\.type/);
  assert.match(app, /startEventDrag/);
  assert.match(app, /engine\.setConfig/);
});

test('distance delayed audio is preserved', () => {
  assert.match(engine, /d\/343/);
  assert.match(engine, /createStereoPanner/);
  assert.match(engine, /createConvolver/);
});
