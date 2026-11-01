/* MV.js uses row arrays and column vectors; flatten transposes for WebGL. */
window.chain=(...matrices)=>matrices.reduce((a,b)=>mult(a,b),mat4());
window.centerOf=m=>[m[0][3],m[1][3],m[2][3]];
window.buildScene=function(orbitTime,spinTime,tilt){
 const root=mat4(), result={root,bodies:[]};
 for(const b of BODIES){
  const angle=b.phase+360*orbitTime/b.period;
  // Counter-rotation keeps the planet's axis orientation fixed in world space.
  const frame=chain(root,rotate(angle,[0,1,0]),translate(b.distance,0,0),rotate(-angle,[0,1,0]));
  const axis=mult(frame,rotate(b.id==='earth_daymap'?tilt:b.tilt,[0,0,1]));
  const model=chain(axis,rotate(360*spinTime/b.spin,[0,1,0]),scalem(b.radius,b.radius*(POLAR_RATIO[b.id]||1),b.radius));
  result.bodies.push({config:b,frame,axis,model,center:centerOf(frame)});
  if(b.id==='earth_daymap'){
   result.earthFrame=frame;result.earthAxis=axis;
   // Manual construction: earth position -> orbit-plane tilt -> revolution -> offset.
   const inclinedPlane=mult(mat4(),rotate(SYSTEM.moonInclination,[0,0,1]));
   result.moonPlane=mult(frame,inclinedPlane);
   result.moonFrame=chain(result.moonPlane,rotate(360*orbitTime/SYSTEM.moonPeriod,[0,1,0]),translate(SYSTEM.moonDistance,0,0));
   result.moonModel=mult(result.moonFrame,scalem(SYSTEM.moonRadius,SYSTEM.moonRadius,SYSTEM.moonRadius));
  }
 }
 return result;
};
