import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({window: {}, Float32Array, RangeError, Math, Number});
vm.runInContext(readFileSync(new URL('../js/geometry.js', import.meta.url), 'utf8'), context);
const {TRIANGLE,subdivide,triangleBuffer,chaosGame,chaosRatio,polygonVertices} = context.window.FractalLab.geometry;
const area=([a,b,c])=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(let depth=0;depth<=6;depth++)test(`Depth ${depth}: count, area, modes, finite coordinates`,()=>{
  const leaves=subdivide(TRIANGLE,depth);assert.equal(leaves.length,3**depth);near(leaves.reduce((s,t)=>s+area(t),0),area(TRIANGLE)*(.75**depth));
  const solid=triangleBuffer(leaves,'solid'),points=triangleBuffer(leaves,'points'),lines=triangleBuffer(leaves,'lines');assert.deepEqual(points,solid);assert.equal(solid.length,6*3**depth);assert.equal(lines.length,12*3**depth);assert.ok([...lines].every(Number.isFinite));
  assert.deepEqual([...lines.slice(0,12)],[...points.slice(0,4),...points.slice(2,6),...points.slice(4,6),...points.slice(0,2)]);
});
test('Depth 1 removes the central triangle',()=>{const leaves=subdivide(TRIANGLE,1);assert.ok(leaves.every(t=>!t.every(p=>TRIANGLE.every(v=>p!==v))));near(area(leaves[0]),area(TRIANGLE)/4);});
test('Chaos follows the specified midpoint recurrence with random initial point and burn-in',()=>{
  const points=chaosGame(5000,3,()=>0);assert.equal(points.length,10000);near(points[0],0);assert.ok(Math.abs(points[1]-TRIANGLE[0][1])<1e-6);
});
for(const n of [3,5,6])test(`Chaos n=${n}: 100000 finite points inside polygon`,()=>{
  let seed=12345;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const points=chaosGame(100000,n,random),vertices=polygonVertices(n);assert.equal(points.length,200000);
  for(let i=0;i<points.length;i+=2){const p=[points[i],points[i+1]];assert.ok(p.every(Number.isFinite));let signs=[];for(let j=0;j<n;j++){const a=vertices[j],b=vertices[(j+1)%n];signs.push((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));}assert.ok(signs.every(v=>v>=-1e-6)||signs.every(v=>v<=1e-6));}
  assert.ok(chaosRatio(n)>0&&chaosRatio(n)<=.5);
});
test('Reject invalid geometry inputs',()=>{for(const d of [-1,7,NaN,1.5])assert.throws(()=>subdivide(TRIANGLE,d),RangeError);assert.throws(()=>chaosGame(0),RangeError);assert.throws(()=>chaosGame(100001),RangeError);assert.throws(()=>polygonVertices(4),RangeError);assert.throws(()=>triangleBuffer([],'bad'),RangeError);});
