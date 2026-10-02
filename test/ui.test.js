import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("main experience uses the HDR Three.js renderer",()=>{assert.match(html,/three\.js\/r128\/three\.min\.js/);assert.match(html,/PYROWORKS \/\/ AURORA HDR/);assert.match(html,/const N=220000/)});
test("sparks and smoke render in separate passes",()=>{assert.match(html,/const smokeMat=new THREE\.ShaderMaterial/);assert.match(html,/if\(vK>6\.5\)discard/);assert.match(html,/blending:THREE\.NormalBlending/)});
test("bloom extracts highlights before blur",()=>{assert.match(html,/smoothstep\(th,th\+\.35,l\)/);assert.match(html,/blurM\.uniforms\.th\.value=i===0\?\.62:0/)});
test("environment has shader water and distance-delayed sound",()=>{assert.match(html,/const waterM=new THREE\.ShaderMaterial/);assert.match(html,/distanceTo\(cam\.position\),t=AC\.currentTime\+d\/343/)});
