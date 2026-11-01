// Surface enhancements are illustrative, not a reconstruction of current weather.
window.SOLAR_FRAGMENT=`precision highp float;
varying vec3 vWorld,vNormal,vLocal;varying vec2 vUV;
uniform sampler2D uTexture,uNight,uRingMap;
uniform vec3 uColor,uEye,uCenter,uRingNormal;
uniform vec2 uTexel;
uniform float uTextured,uLit,uMaterial,uBodyRadius,uTime,uGlow;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 float lo=mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y);
 float hi=mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y);
 return mix(lo,hi,f.z);
}
float fbm(vec3 p){return .53*noise(p)+.27*noise(p*2.03)+.13*noise(p*4.09)+.07*noise(p*8.11);}
float luma(vec3 p){return dot(p,vec3(.2126,.7152,.0722));}
void main(){
 vec4 tex=texture2D(uTexture,vUV);
 // A restrained unsharp sample restores fine contrast without inventing image data.
 if(uTextured>0.5&&uMaterial!=4.0&&uMaterial!=2.0){vec3 adjacent=(texture2D(uTexture,vUV+vec2(uTexel.x,0)).rgb+texture2D(uTexture,vUV-vec2(uTexel.x,0)).rgb+texture2D(uTexture,vUV+vec2(0,uTexel.y)).rgb+texture2D(uTexture,vUV-vec2(0,uTexel.y)).rgb)*.25;tex.rgb=clamp(tex.rgb+(tex.rgb-adjacent)*.23,0.0,1.0);}
 vec3 base=mix(uColor,tex.rgb,uTextured);
 vec3 N=normalize(vNormal),L=normalize(-vWorld),V=normalize(uEye-vWorld),P=normalize(vLocal);
 float mu=max(dot(N,V),0.0),nl=dot(N,L),diffuse=max(nl,0.0),alpha=1.0;
 // Modest multi-scale detail enriches cloudy worlds without adding rocky terrain.
 if(uMaterial>=6.0&&uMaterial<=9.0){
  float turbulence=fbm(P*vec3(9.0,22.0,9.0)+vec3(uTime*.008,0.0,0.0));
  float bands=sin(P.y*52.0+(turbulence-.5)*3.0);
  if(uMaterial==6.0){float billows=fbm(P*vec3(7.0,15.0,7.0)+turbulence*2.0);base=mix(base,vec3(.89,.77,.52),.18);base*=.83+.28*billows+.045*bands;}
  if(uMaterial==7.0){base*=.94+.08*bands+.07*(turbulence-.5);}
  if(uMaterial==8.0){float cap=smoothstep(.55,.97,abs(P.y));base=mix(base,vec3(.52,.80,.81),.25);base*=.97+.025*bands+.06*(turbulence-.5);base=mix(base,vec3(.68,.85,.83),cap*.19);}
  if(uMaterial==9.0){base=mix(base,vec3(.16,.41,.70),.30);base*=.94+.045*bands+.10*(turbulence-.5);
   float jet=exp(-pow((P.y-.27)/.025,2.0))*smoothstep(.54,.76,fbm(P*vec3(18.0,6.0,18.0)));
   jet+=exp(-pow((P.y+.40)/.018,2.0))*smoothstep(.48,.72,fbm(P*vec3(22.0,8.0,22.0)));
   base=mix(base,vec3(.74,.85,.94),jet*.55);
  }
 }
 // Object-space grain avoids UV seams and remains fixed as the belt rotates.
 if(uMaterial==13.0){float seed=floor(vUV.x/2.0)*.73;vec3 q=vLocal*95.0;
  float mineral=fbm(q),grain=noise(q*17.0),shade=hash(vec3(seed,2.0,4.0));
  base=mix(vec3(.24,.23,.22),vec3(.48,.41,.33),shade)*(.72+.5*mineral+.12*grain);
  vec3 perturb=vec3(noise(q*12.0),noise(q*12.0+7.0),noise(q*12.0+17.0))-.5;
  N=normalize(N+.14*(perturb-N*dot(perturb,N)));nl=dot(N,L);diffuse=max(nl,0.0);
 }
 vec3 color=pow(max(base,vec3(0.0)),vec3(2.2))*mix(1.0,.045+.955*diffuse,uLit);
 if(uMaterial==1.0){float ocean=smoothstep(.02,.15,base.b-base.r)*smoothstep(0.0,.08,base.b-base.g);
  color+=vec3(.55,.68,.8)*pow(max(dot(N,normalize(L+V)),0.0),90.0)*ocean*diffuse*.45;
  color+=pow(texture2D(uNight,vUV).rgb,vec3(2.2))*(1.0-smoothstep(-.18,.12,nl))*.65;}
 if(uMaterial==2.0){alpha=smoothstep(.12,.85,tex.r)*.88;color=vec3(.84,.9,1.0)*(.12+.88*diffuse);}
 if(uMaterial==3.0){float rim=pow(1.0-mu,3.4);alpha=rim*.28*smoothstep(0.0,.18,mu)*(.18+.82*diffuse);color=pow(uColor,vec3(2.2));}
 if(uMaterial==4.0){alpha=tex.a;float b=dot(vWorld-uCenter,L),c=dot(vWorld-uCenter,vWorld-uCenter)-uBodyRadius*uBodyRadius;
  float hit=b*b-c;float shadow=(hit>0.0&&-b-sqrt(max(hit,0.0))>0.0)?.20:1.0;
  color=pow(base,vec3(2.2))*(.30+.70*abs(nl))*shadow;if(alpha<.015)discard;}
 if(uMaterial==5.0){alpha=pow(mu,3.5)*.095;color=vec3(1.0,.25,.018);}
 // Ring-plane intersection casts an annular shadow on Saturn itself.
 if(uMaterial==7.0){float denom=dot(L,uRingNormal);if(abs(denom)>.0001){float t=dot(uCenter-vWorld,uRingNormal)/denom;
  vec3 q=vWorld+t*L-uCenter;float r=length(q)/uBodyRadius;
  if(t>0.001&&r>1.24&&r<2.3){float a=texture2D(uRingMap,vec2((r-1.24)/1.06,.5)).a;color*=1.0-.68*a;}}}
 if(uMaterial==10.0){
  float lum=luma(tex.rgb),granule=noise(P*320.0);
  vec3 warm=mix(vec3(.58,.16,.012),vec3(1.0,.72,.26),smoothstep(.08,.92,lum));
  warm=mix(warm,vec3(1.0,.90,.64),smoothstep(.75,1.0,lum)*.35);
  warm*=.88+.12*granule+.08*fbm(P*95.0);warm*=.67+.33*pow(mu,.5);
  color=pow(warm,vec3(2.2));
 }
 // Very thin Uranian rings; widths exaggerated for a classroom-sized viewport.
 if(uMaterial==11.0){float r=vUV.x;float lines=exp(-pow((r-.30)/.008,2.0))+exp(-pow((r-.46)/.006,2.0))+exp(-pow((r-.64)/.006,2.0))+exp(-pow((r-.81)/.008,2.0))+exp(-pow((r-.88)/.012,2.0));alpha=lines*.38;color=vec3(.19,.17,.14)*(.4+.6*abs(nl));if(alpha<.01)discard;}
 // Camera-facing corona stays outside the opaque solar disc, with no white core.
 if(uMaterial==12.0){float radius=length(vLocal.xy)*1.75;if(radius<1.0||radius>1.75)discard;
  float edge=radius-1.0;alpha=uGlow*(.55*exp(-edge*12.0)+.17*exp(-edge*4.5))*(1.0-smoothstep(1.35,1.75,radius));
  color=pow(vec3(1.0,.48,.11),vec3(2.2));}
 gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(1.0/2.2)),alpha);
}`;
