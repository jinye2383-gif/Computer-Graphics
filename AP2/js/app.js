(async function(){
'use strict';
const $=id=>document.getElementById(id), canvas=$('space');
try{
const gl=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
if(!gl)throw Error('此浏览器无法创建 WebGL 上下文，请启用硬件加速后重试。');
const vertex=`attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uModel,uView,uProjection; uniform float uPointSize;
uniform mat3 uNormal; varying vec3 vWorld,vNormal,vLocal; varying vec2 vUV;
void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=uNormal*aNormal;vLocal=aPosition;vUV=aUV;
gl_Position=uProjection*uView*w;gl_PointSize=uPointSize;}`;
const fragment=SOLAR_FRAGMENT;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const loc={};for(const name of ['uModel','uView','uProjection','uPointSize','uTexture','uColor','uTextured','uLit','uMaterial','uEye','uNight','uCenter','uBodyRadius','uNormal','uRingMap','uRingNormal','uTime','uTexel','uGlow'])loc[name]=gl.getUniformLocation(program,name);
const attrs=['aPosition','aNormal','aUV'].map(n=>gl.getAttribLocation(program,n));
const uintIndices=gl.getExtension('OES_element_index_uint');
function mesh(vertices,indices,mode){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);let index=null,indexType=gl.UNSIGNED_SHORT;if(indices){index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);const wide=vertices.length/8>65535;if(wide&&!uintIndices)throw Error("32-bit mesh index unavailable");indexType=wide?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,wide?new Uint32Array(indices):new Uint16Array(indices),gl.STATIC_DRAW);}return {buffer,index,indexType,count:indices?indices.length:vertices.length/8,mode};}
function sphere(){const v=[],idx=[],rows=uintIndices?256:192,cols=uintIndices?512:320;for(let y=0;y<=rows;y++){const t=y/rows*Math.PI;for(let x=0;x<=cols;x++){const p=x/cols*2*Math.PI,n=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];v.push(...n,...n,x/cols,1-y/rows);}}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}return mesh(v,idx,gl.TRIANGLES);}
function circle(){const v=[];for(let i=0;i<256;i++){const a=i/256*Math.PI*2;v.push(Math.cos(a),0,Math.sin(a),0,1,0,0,0);}return mesh(v,null,gl.LINE_LOOP);}
function ring(){const v=[],idx=[];for(let i=0;i<=2048;i++){const a=i/2048*Math.PI*2;for(const r of [1.24,2.3])v.push(r*Math.cos(a),0,r*Math.sin(a),0,1,0,(r-1.24)/1.06,.5);}for(let i=0;i<2048;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}return mesh(v,idx,gl.TRIANGLES);}
let seed=127;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const stars=[],belt=[];for(let i=0;i<1800;i++){const y=random()*2-1,a=random()*Math.PI*2,r=130,s=Math.sqrt(1-y*y);stars.push(r*s*Math.cos(a),r*y,r*s*Math.sin(a),0,1,0,0,0);}for(let i=0;i<SYSTEM.asteroidCount;i++){const a=random()*Math.PI*2,r=10+random()*1.5;belt.push(r*Math.cos(a),(random()-.5)*.5,r*Math.sin(a),0,1,0,0,0);}
// Indexed, smoothly shaded displaced rocks. Each batch stays below WebGL1's 16-bit limit.
const unitPoints=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],rockFaces=[];
function subdivide(a,b,c,depth){if(!depth){rockFaces.push([a,b,c]);return;}const ab=normalize(add(a,b)),bc=normalize(add(b,c)),ca=normalize(add(c,a));subdivide(a,ab,ca,depth-1);subdivide(ab,b,bc,depth-1);subdivide(ca,bc,c,depth-1);subdivide(ab,bc,ca,depth-1);}
for(const face of [[2,0,4],[2,4,1],[2,1,5],[2,5,0],[3,4,0],[3,1,4],[3,5,1],[3,0,5]])subdivide(...face.map(j=>unitPoints[j]),4);
const beltMeshes=[];let rockVertices=[],rockIndices=[];
for(let i=0;i<belt.length;i+=8){
 const center=belt.slice(i,i+3),size=.012+Math.pow(random(),2)*.065,phase=random()*30,stretch=[.65+random()*.7,.65+random()*.7,.65+random()*.7];
 const pits=Array.from({length:5},()=>({direction:normalize([random()*2-1,random()*2-1,random()*2-1]),width:.14+random()*.19,depth:.035+random()*.065}));
 function surface(p){let r=1+.13*Math.sin(p[0]*3+phase)*Math.cos(p[1]*4-phase)+.055*Math.sin(p[2]*9+phase)*Math.cos(p[0]*8);
  for(const pit of pits){const d=Math.sqrt(Math.max(0,2-2*dot(p,pit.direction)))/pit.width;r-=pit.depth*Math.exp(-d*d*2);r+=pit.depth*.22*Math.exp(-Math.pow((d-1)*5,2));}
  return p.map((v,j)=>v*r*size*stretch[j]);}
 const cache=new Map();
 for(const face of rockFaces)for(const direction of face){const key=direction.map(x=>x.toFixed(7)).join(',');let index=cache.get(key);
  if(index===undefined){const p=surface(direction),t=normalize(cross(direction,Math.abs(direction[1])<.9?[0,1,0]:[1,0,0])),b=cross(direction,t),eps=.001;
   const dt=subtract(surface(normalize(add(direction,scale(eps,t)))),surface(normalize(add(direction,scale(-eps,t)))));
   const db=subtract(surface(normalize(add(direction,scale(eps,b)))),surface(normalize(add(direction,scale(-eps,b)))));
   let n=normalize(cross(dt,db));if(dot(n,direction)<0)n=negate(n);
   index=rockVertices.length/8;cache.set(key,index);rockVertices.push(...add(center,p),...n,.5+Math.atan2(direction[2],direction[0])/(2*Math.PI)+Math.floor(phase)*2,.5+Math.asin(direction[1])/Math.PI);
  }rockIndices.push(index);
 }
 if((i/8+1)%40===0||i+8===belt.length){beltMeshes.push(mesh(rockVertices,rockIndices,gl.TRIANGLES));rockVertices=[];rockIndices=[];}
}
const ball=sphere(),orbit=circle(),rings=ring(),starMesh=mesh(stars,null,gl.POINTS),axisMesh=mesh([0,-1.5,0,0,1,0,0,0,0,1.5,0,0,1,0,0,0],null,gl.LINES);
const halo=mesh([-1,-1,0,0,0,1,0,0,1,-1,0,0,0,1,1,0,1,1,0,0,0,1,1,1,-1,1,0,0,0,1,0,1],[0,1,2,0,2,3],gl.TRIANGLES);
const textures={},textureInfo={};let loaded=0;
const anisotropic=gl.getExtension('EXT_texture_filter_anisotropic');
let closeTexture=null,textureRequest=0,textureUpgradePending=false;
function detailLabel(){const id=state.focus==='earth'?'earth_daymap':state.focus;const size=closeTexture?.id===id?closeTexture.size:textureInfo[id]?.gpu;
 $('textureQuality').textContent=state.focus==='belt'?'不规则岩体 · 凹坑与矿物颗粒':textureUpgradePending?'正在加载近景细节…':size?`当前贴图 ${size[0]} × ${size[1]} · ${state.focus==='sun'?'柔和自发光':'表面细节'}`:'全景模式 · 按需加载近景贴图';}
async function upgradeTexture(focus){const request=++textureRequest;textureUpgradePending=false;if(closeTexture){gl.deleteTexture(closeTexture.texture);closeTexture=null;}const id=focus==='earth'?'earth_daymap':focus,info=textureInfo[id],limit=Math.min(8192,gl.getParameter(gl.MAX_TEXTURE_SIZE));
 if(!info||Math.min(info.source[0],limit)<=info.gpu[0]){detailLabel();return;}
 textureUpgradePending=true;detailLabel();
 try{const img=new Image();img.src=`assets/${id}.jpg`;await img.decode();if(request!==textureRequest)return;
 let source=img;if(img.width>limit){source=document.createElement('canvas');source.width=limit;source.height=Math.round(img.height*limit/img.width);source.getContext('2d').drawImage(img,0,0,source.width,source.height);}
 const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(anisotropic)gl.texParameterf(gl.TEXTURE_2D,anisotropic.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(16,gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));closeTexture={id,texture:t,size:[source.width,source.height]};
 }catch(error){console.warn('近景贴图加载失败，继续使用基础贴图',error.message);}finally{if(request===textureRequest){textureUpgradePending=false;detailLabel();}}
}
async function texture(id){const image=new Image();image.src=`assets/${id}.${id==='ring'?'png':'jpg'}`;await image.decode();const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
 const limit=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),id==='ring'?8192:4096);let source=image;
 if(image.width>limit||image.height>limit||id==='ring'){source=document.createElement('canvas');const scale=limit/Math.max(image.width,image.height);source.width=Math.round(image.width*scale);source.height=id==='ring'?512:Math.max(1,Math.round(image.height*scale));source.getContext('2d').drawImage(image,0,0,source.width,source.height);}
 // Image top is north; flipped upload maps north to sphere v=1.
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const pot=n=>(n&(n-1))===0;if(pot(source.width)&&pot(source.height)){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(anisotropic)gl.texParameterf(gl.TEXTURE_2D,anisotropic.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(16,gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));textures[id]=t;textureInfo[id]={source:[image.width,image.height],gpu:[source.width,source.height]};loaded++;}
await Promise.all(['sun','moon','ring','clouds','earth_night',...BODIES.map(b=>b.id)].map(texture));
gl.enable(gl.DEPTH_TEST);gl.clearColor(.018,.028,.048,1);
const state={orbitTime:0,spinTime:0,orbitSpeed:1,spinSpeed:1,tilt:23.5,paused:false,tour:true,projection:'perspective',focus:'system',orbits:true,axis:true,names:true,yaw:.5,pitch:.62,distance:72,tourClock:0,glow:35};
let last=performance.now(),scene,view,projection,eye,frames=0;
const labelNodes={};for(const [id,name] of [['sun','太阳'],...BODIES.map(b=>[b.id,b.name]),['moon','月球']]){const e=document.createElement('span');e.className='planet-label'+(id==='earth_daymap'?' earth':'');e.textContent=name;$('labels').appendChild(e);labelNodes[id]=e;}
function ui(){ $('perspective').classList.toggle('active',state.projection==='perspective');$('orthographic').classList.toggle('active',state.projection==='orthographic');$('projectionTag').textContent=state.projection==='perspective'?'PERSPECTIVE / 透视投影':'ORTHOGRAPHIC / 正交投影';$('pause').textContent=state.paused?'继续':'暂停';$('tour').textContent=state.tour?'漫游中':'继续漫游';$('cameraMode').textContent=state.tour?'自动环绕':'手动接管';$('status').textContent=state.paused?'● 时间已暂停':'● 实时模拟';$('viewName').textContent=$('focus').selectedOptions[0].textContent;}
function setProjection(value){state.projection=value;ui();}
for(const [id,name] of [['sun','太阳 · 日面细节'],['moon','月球 · 陨石坑'],...BODIES.filter(b=>!['earth_daymap','saturn'].includes(b.id)).map(b=>[b.id,b.name+' · 表面细节']),['belt','小行星带 · 岩块']]){const option=document.createElement('option');option.value=id;option.textContent=name;$('focus').appendChild(option);}
function focusPoint(value){if(value==='earth')return centerOf(scene.earthFrame);if(value==='moon')return centerOf(scene.moonFrame);if(value==='belt')return [10.6,0,0];const body=scene.bodies.find(b=>b.config.id===value);return body?body.center:[0,0,0];}
function focusRadius(value){return value==='moon'?SYSTEM.moonRadius:value==='sun'?SYSTEM.sunRadius:(BODIES.find(b=>b.id===value)?.radius||.65);}
function setFocus(value){state.focus=value;$('focus').value=value;state.distance=value==='system'?72:value==='earth'?7:value==='saturn'?9:value==='belt'?3.5:focusRadius(value)*(value==='uranus'?7.5:5.5);if(value!=='system'&&scene){const p=focusPoint(value);state.yaw=Math.atan2(-p[0],-p[2])+.45;state.pitch=value==='saturn'?.8:.3;}ui();upgradeTexture(value);}
for(const [id,key,out,suffix] of [['orbitSpeed','orbitSpeed','orbitValue','×'],['spinSpeed','spinSpeed','spinValue','×'],['tilt','tilt','tiltValue','°']])$(id).addEventListener('input',()=>{state[key]=Number($(id).value);$(out).value=state[key].toFixed(1)+suffix;$('readout').textContent=`EARTH / ${state.tilt.toFixed(1)}° AXIAL TILT`;});
$('glow').addEventListener('input',()=>{state.glow=Number($('glow').value);$('glowValue').value=state.glow+'%';});
for(const id of ['orbits','axis','names'])$(id).addEventListener('change',()=>state[id]=$(id).checked);
$('perspective').onclick=()=>setProjection('perspective');$('orthographic').onclick=()=>setProjection('orthographic');$('focus').onchange=()=>setFocus($('focus').value);
$('pause').onclick=()=>{state.paused=!state.paused;ui();};$('tour').onclick=()=>{state.tour=!state.tour;ui();};
$('reset').onclick=()=>{Object.assign(state,{orbitTime:0,spinTime:0,orbitSpeed:1,spinSpeed:1,tilt:23.5,paused:false,tour:true,yaw:.5,pitch:.62,tourClock:0,glow:35,orbits:true,axis:true,names:true});for(const id of ['orbitSpeed','spinSpeed','tilt']){$(id).value=state[id];$(id).dispatchEvent(new Event('input'));}for(const id of ['orbits','axis','names'])$(id).checked=true;$('glow').value=35;$('glowValue').value='35%';setProjection('perspective');setFocus('system');};
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;if(e.code==='KeyO'){e.preventDefault();setProjection(state.projection==='perspective'?'orthographic':'perspective');}if(e.code==='Space'){e.preventDefault();$('pause').click();}});
let drag=null;canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];state.tour=false;canvas.setPointerCapture(e.pointerId);ui();});canvas.addEventListener('pointermove',e=>{if(!drag)return;state.yaw-=(e.clientX-drag[0])*.006;state.pitch=Math.max(-1.35,Math.min(1.35,state.pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();state.tour=false;state.distance=Math.max(state.focus==='system'?12:focusRadius(state.focus)*2.8,Math.min(110,state.distance*Math.exp(e.deltaY*.001)));ui();},{passive:false});
function draw(m,model,color,tex,lit=false,size=1,material=0){gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);for(let i=0;i<3;i++){gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);}gl.uniformMatrix4fv(loc.uModel,false,flatten(model));gl.uniformMatrix3fv(loc.uNormal,false,flatten(normalMatrix(model,true)));gl.uniform3fv(loc.uColor,color);gl.uniform1f(loc.uLit,lit?1:0);gl.uniform1f(loc.uTextured,tex?1:0);gl.uniform1f(loc.uMaterial,material);gl.uniform1f(loc.uPointSize,size);gl.activeTexture(gl.TEXTURE0);const activeTexture=closeTexture?.id===tex?closeTexture:null;gl.bindTexture(gl.TEXTURE_2D,activeTexture?activeTexture.texture:textures[tex||'sun']);const textureSize=activeTexture?activeTexture.size:textureInfo[tex||'sun'].gpu;gl.uniform2f(loc.uTexel,1/textureSize[0],1/textureSize[1]);gl.uniform1i(loc.uTexture,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures.earth_night);gl.uniform1i(loc.uNight,1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,textures.ring);gl.uniform1i(loc.uRingMap,2);if(m.index){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.index);gl.drawElements(m.mode,m.count,m.indexType,0);}else gl.drawArrays(m.mode,0,m.count);}
function visibleBody(id){return ['system','earth','belt'].includes(state.focus)||id===state.focus;}
function label(id,pos,r){const e=labelNodes[id],clip=mult(mult(projection,view),[...pos,1]);if(!visibleBody(id)||!state.names||clip[3]<=0){e.hidden=true;return;}const x=clip[0]/clip[3],y=clip[1]/clip[3],z=clip[2]/clip[3];e.hidden=Math.abs(x)>1||Math.abs(y)>1||z < -1||z>1;if(!e.hidden){const dist=Math.hypot(...pos.map((p,i)=>p-eye[i]));const px=r/(state.projection==='perspective'?dist:state.distance)*canvas.clientHeight*1.3;e.style.left=`${(x*.5+.5)*canvas.clientWidth+Math.max(8,px)}px`;e.style.top=`${(-y*.5+.5)*canvas.clientHeight-8}px`;}}
function render(){const dpr=Math.min(devicePixelRatio,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);scene=buildScene(state.orbitTime,state.spinTime,state.tilt);
const target=focusPoint(state.focus);
const aspect=w/h, cameraDistance=state.distance/(state.focus==="system"?Math.min(1,aspect):1);eye=[target[0]+cameraDistance*Math.cos(state.pitch)*Math.sin(state.yaw),target[1]+cameraDistance*Math.sin(state.pitch),target[2]+cameraDistance*Math.cos(state.pitch)*Math.cos(state.yaw)];view=lookAt(eye,target,[0,1,0]);const half=cameraDistance*Math.tan(radians(42)/2);projection=state.projection==='perspective'?perspective(42,aspect,.1,400):ortho(-half*aspect,half*aspect,-half,half,.1,400);gl.uniformMatrix4fv(loc.uView,false,flatten(view));gl.uniformMatrix4fv(loc.uProjection,false,flatten(projection));
gl.uniform1f(loc.uGlow,state.glow/100);gl.uniform1f(loc.uTime,state.spinTime);const saturnFrame=scene.bodies.find(b=>b.config.id==='saturn');gl.uniform3fv(loc.uCenter,saturnFrame.center);gl.uniform3fv(loc.uRingNormal,[saturnFrame.axis[0][1],saturnFrame.axis[1][1],saturnFrame.axis[2][1]]);gl.uniform1f(loc.uBodyRadius,saturnFrame.config.radius);gl.uniform3fv(loc.uEye,eye);gl.depthMask(false);draw(starMesh,mat4(),[.41,.47,.59],null,false,dpr*1.4);gl.depthMask(true);
if(state.orbits){for(const b of BODIES)draw(orbit,scalem(b.distance,b.distance,b.distance),b.id==='earth_daymap'?[.22,.40,.52]:[.14,.20,.28]);draw(orbit,mult(scene.moonPlane,scalem(SYSTEM.moonDistance,SYSTEM.moonDistance,SYSTEM.moonDistance)),[.28,.4,.49]);}
if(state.focus==='system'||state.focus==='belt')beltMeshes.forEach(m=>draw(m,rotate(state.orbitTime*.7,[0,1,0]),[.46,.42,.37],null,true,1,13));
if(visibleBody('sun'))draw(ball,chain(rotate(state.spinTime*3,[0,1,0]),scalem(SYSTEM.sunRadius,SYSTEM.sunRadius,SYSTEM.sunRadius)),[1,1,1],'sun',false,1,10);label('sun',[0,0,0],SYSTEM.sunRadius);
for(const b of scene.bodies){if(visibleBody(b.config.id))draw(ball,b.model,[1,1,1],b.config.id,true,1,({earth_daymap:1,venus_surface:6,saturn:7,uranus:8,neptune:9})[b.config.id]||0);label(b.config.id,b.center,b.config.radius);}
if(visibleBody('moon'))draw(ball,scene.moonModel,[1,1,1],'moon',true);label('moon',centerOf(scene.moonFrame),SYSTEM.moonRadius);if(state.axis&&visibleBody('earth_daymap'))draw(axisMesh,scene.earthAxis,[.50,.83,1]);
// Transparent shells follow opaque geometry; no depth writes hide the surface beneath.
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
const saturn=scene.bodies.find(b=>b.config.id==='saturn');gl.uniform3fv(loc.uCenter,saturn.center);gl.uniform1f(loc.uBodyRadius,saturn.config.radius);
if(visibleBody('saturn'))draw(rings,mult(saturn.axis,scalem(saturn.config.radius,saturn.config.radius,saturn.config.radius)),[1,1,1],'ring',true,1,4);
gl.enable(gl.CULL_FACE);gl.frontFace(gl.CW);gl.cullFace(gl.BACK);
const earth=scene.bodies.find(b=>b.config.id==='earth_daymap');
if(visibleBody('earth_daymap'))draw(ball,chain(earth.axis,rotate(360*state.spinTime/earth.config.spin+state.spinTime*.5,[0,1,0]),scalem(.659,.659,.659)),[1,1,1],'clouds',true,1,2);
gl.blendFunc(gl.SRC_ALPHA,gl.ONE);if(visibleBody('earth_daymap'))draw(ball,mult(earth.model,scalem(1.035,1.035,1.035)),[.25,.58,1.0],null,false,1,3);
for(const b of scene.bodies){const tint=({venus_surface:[.95,.78,.46],jupiter:[.70,.73,.78],saturn:[.84,.75,.52],uranus:[.43,.81,.85],neptune:[.24,.51,.96]})[b.config.id];if(tint&&visibleBody(b.config.id))draw(ball,mult(b.model,scalem(1.018,1.018,1.018)),tint,null,false,1,3);}
gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);const uranus=scene.bodies.find(b=>b.config.id==='uranus');if(visibleBody('uranus'))draw(rings,mult(uranus.axis,scalem(uranus.config.radius*.87,uranus.config.radius*.87,uranus.config.radius*.87)),[1,1,1],null,true,1,11);gl.enable(gl.CULL_FACE);
gl.disable(gl.CULL_FACE);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
if(visibleBody('sun')&&state.glow>0){const billboard=mat4(),size=SYSTEM.sunRadius*1.75;for(let i=0;i<3;i++){billboard[i][0]=view[0][i]*size;billboard[i][1]=view[1][i]*size;billboard[i][2]=view[2][i]*size;}draw(halo,billboard,[1,1,1],null,false,1,12);}
gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);frames++;
}
function tick(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!state.paused){state.orbitTime+=dt*state.orbitSpeed;state.spinTime+=dt*state.spinSpeed;if(state.tour){state.tourClock+=dt;state.yaw+=dt*2*Math.PI/SYSTEM.tourPeriod;const desired=.55+.14*Math.sin(state.tourClock*2*Math.PI/SYSTEM.tourPeriod);state.pitch+=(desired-state.pitch)*(1-Math.exp(-dt*.8));}}render();requestAnimationFrame(tick);}
// Read-only diagnostics plus deterministic presets for reproducible evidence capture.
window.solar={state,render,setFocus,setProjection,ready:true,inspect:()=>({loadedTextures:loaded,textureInfo,textureUpgradePending,closeTexture:closeTexture?{id:closeTexture.id,size:closeTexture.size}:null,sphereTriangles:ball.count/3,uintIndices:!!uintIndices,ringTriangles:rings.count/3,asteroidTriangles:beltMeshes.reduce((sum,m)=>sum+m.count/3,0),anisotropy:!!anisotropic,frames,glError:gl.getError(),scene,eye,view,projection,width:canvas.width,height:canvas.height}),preset:(values)=>{Object.assign(state,values);$('focus').value=state.focus;ui();render();}};
ui();detailLabel();requestAnimationFrame(tick);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error').textContent='图形上下文已丢失，请刷新页面。';});
}catch(error){$('error').hidden=false;$('error').textContent='加载失败：'+error.message;$('status').textContent='需要检查';console.error(error);}
})();


