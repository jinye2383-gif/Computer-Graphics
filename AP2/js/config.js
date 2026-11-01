// All distances, radii and periods are deliberately compressed for teaching.
window.BODIES = [
 {id:'mercury',name:'水星',radius:.28,distance:3.3,period:14,spin:15,tilt:.03,phase:20,color:[.45,.45,.45]},
 {id:'venus_surface',name:'金星',radius:.53,distance:4.8,period:23,spin:-28,tilt:2.6,phase:115,color:[.67,.48,.27]},
 {id:'earth_daymap',name:'地球',radius:.65,distance:6.6,period:36,spin:5,tilt:23.5,phase:245,color:[.25,.55,.8]},
 {id:'mars',name:'火星',radius:.40,distance:8.6,period:49,spin:5.2,tilt:25,phase:310,color:[.7,.35,.2]},
 {id:'jupiter',name:'木星',radius:1.28,distance:12.8,period:75,spin:2.1,tilt:3,phase:30,color:[.65,.51,.39]},
 {id:'saturn',name:'土星',radius:1.05,distance:17.5,period:105,spin:2.3,tilt:26.7,phase:155,color:[.68,.59,.40]},
 {id:'uranus',name:'天王星',radius:.76,distance:22,period:140,spin:-3.5,tilt:97.8,phase:260,color:[.35,.67,.7]},
 {id:'neptune',name:'海王星',radius:.72,distance:26.5,period:180,spin:3.2,tilt:28.3,phase:340,color:[.2,.35,.8]}
];
window.SYSTEM={sunRadius:1.8,moonRadius:.19,moonDistance:1.65,moonPeriod:8,moonInclination:5.1,tourPeriod:80,asteroidCount:850};

// Approximate polar/equatorial ratios for visual oblateness (not ephemeris data).
window.POLAR_RATIO={jupiter:.935,saturn:.902,uranus:.977,neptune:.983};
