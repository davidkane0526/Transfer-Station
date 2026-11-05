// V40 — B40 passes behind the B19 YUDIAN controller and B36 cabinet.
// It is deliberately routed on a lower service plane to stay separated
// from B37 heater leads and B38 temperature-feedback wiring.
// Three.js axes: X horizontal, Y vertical, Z front/back. Units: mm.
// CAD maps the same route to (X, depth-Y, vertical-Z).
export const VN50=Object.freeze({
  model:'VN-50',
  physicalNameplate:true,
  photo:120,
  plate:{voltageV:220,powerW:230,openFlowLpm:53,vacuumMmHg:680,weightKg:4},
  publishedProductForm:{portThread:'G1/4 (product-family candidate)',
    lengthMm:200,widthMm:110,heightMm:150,
    mountingLengthMm:142,mountingWidthMm:96,weightKg:4.45},
  oemBrandUnverified:true,
  inletPositionUnverified:true,
  pumpIntakeCandidate:Object.freeze({x:409.2,y:68,z:180}),
  chuckRearHoseEndNominal:Object.freeze({x:94,y:113.5,z:-79}),
  innerBoreRadiusMm:2.2,
  outerHoseRadiusMm:3.5,
  pumpPortMajorDiameterMm:13.157,
  pumpPortPitchMm:1.337,
  pumpPortFemaleTapDrillCandidateMm:11.8,
  pumpPortGenderCandidate:'female (family manual hint only)',
  pumpPortGenderVerified:false,
  pumpPortPositionVerified:false,
  controlCabinetBox:Object.freeze({
    xmin:222.5,xmax:507.5,ymin:0,ymax:125,
    zmin:-262.5,zmax:-37.5
  }),
  temperatureControllerBox:Object.freeze({
    xmin:305,xmax:425,ymin:20,ymax:100,
    zmin:-37.5,zmax:-19.5
  }),
  microscopePost:Object.freeze({
    x:82,z:-112,radiusMm:13,ymin:44,ymax:282
  }),
  minimumHarnessSurfaceClearanceMm:2
});
function point(x,y,z){return {x,y,z};}
export function movingVacuumOutlet({
  sampleShiftMm=0,sampleDepthShiftMm=0,sampleAngleDeg=0
}={}){
  const rad=sampleAngleDeg*Math.PI/180;
  const c=Math.cos(rad),s=Math.sin(rad);
  const localX=12+sampleShiftMm,localZ=-79+sampleDepthShiftMm;
  return point(
    82+localX*c+localZ*s,
    VN50.chuckRearHoseEndNominal.y,
    -localX*s+localZ*c
  );
}
// These paths mirror refreshHeatingControlHarness() in app.js exactly.
// They are mechanical routing proxies, not verified electrical pinouts.
export function electricalHarnessPaths({
  sampleShiftMm=0,sampleDepthShiftMm=0,sampleAngleDeg=0
}={}){
  const rad=sampleAngleDeg*Math.PI/180;
  const c=Math.cos(rad),s=Math.sin(rad);
  const source=(x,y,z)=>point(
    82+(sampleShiftMm+x)*c+(sampleDepthShiftMm+z)*s,
    y+23,
    -(sampleShiftMm+x)*s+(sampleDepthShiftMm+z)*c
  );
  return [
    {id:'B37A',radiusMm:1.1,points:[
      source(11,98.5,-60),point(119,104,-92),
      point(174,100,-140),point(207,94,-165),
      point(222.5,84,-168)
    ]},
    {id:'B37B',radiusMm:1.1,points:[
      source(16,98.5,-60),point(119,109,-97),
      point(174,106,-146),point(207,99,-171),
      point(222.5,87,-167)
    ]},
    {id:'B38',radiusMm:.72,points:[
      source(6,100.35,-51),point(119,104,-102),
      point(174,106,-146),point(207,104,-171),
      point(222.5,89,-163)
    ]}
  ];
}
export function vacuumHosePath({
  sampleShiftMm=0,sampleDepthShiftMm=0,sampleAngleDeg=0
}={}){
  const moving=movingVacuumOutlet({sampleShiftMm,sampleDepthShiftMm,sampleAngleDeg});
  // The hose passes to the LEFT of B36, behind its rear wall at
  // Z=-275 mm, then around its RIGHT side. The lower Y=70 mm service
  // plane provides separation from B37/B38 while remaining outside B36.
  const path=[
    moving,
    point(200,70,-135),
    point(200,70,-170),
    point(200,70,-275),
    point(350,70,-275),
    point(520,70,-275),
    point(520,70,140),
    point(520,90,180),
    point(465,69,180),
    point(VN50.pumpIntakeCandidate.x,
          VN50.pumpIntakeCandidate.y,
          VN50.pumpIntakeCandidate.z)
  ];
  return path;
}
function routeSamples(points,stepMm=2){
  const out=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];
    const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    const n=Math.max(1,Math.ceil(length/stepMm));
    for(let j=0;j<=n;j++){
      if(i&&j===0)continue;
      const t=j/n;
      out.push(point(a.x+(b.x-a.x)*t,
        a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t));
    }
  }
  return out;
}
function distanceToBox(p,b){
  const dx=Math.max(b.xmin-p.x,0,p.x-b.xmax);
  const dy=Math.max(b.ymin-p.y,0,p.y-b.ymax);
  const dz=Math.max(b.zmin-p.z,0,p.z-b.zmax);
  return Math.hypot(dx,dy,dz);
}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function sub(a,b){return point(a.x-b.x,a.y-b.y,a.z-b.z);}
function segmentDistance(p1,q1,p2,q2){
  const u=sub(q1,p1),v=sub(q2,p2),w=sub(p1,p2);
  const a=dot(u,u),b=dot(u,v),c=dot(v,v);
  const d=dot(u,w),e=dot(v,w),D=a*c-b*b,eps=1e-12;
  let sN,sD=D,tN,tD=D;
  if(D<eps){sN=0;sD=1;tN=e;tD=c;}
  else{
    sN=b*e-c*d;tN=a*e-b*d;
    if(sN<0){sN=0;tN=e;tD=c;}
    else if(sN>sD){sN=sD;tN=e+b;tD=c;}
  }
  if(tN<0){
    tN=0;
    if(-d<0)sN=0;
    else if(-d>a)sN=sD;
    else{sN=-d;sD=a;}
  }else if(tN>tD){
    tN=tD;
    if(-d+b<0)sN=0;
    else if(-d+b>a)sN=sD;
    else{sN=-d+b;sD=a;}
  }
  const sc=Math.abs(sN)<eps?0:sN/sD;
  const tc=Math.abs(tN)<eps?0:tN/tD;
  const delta=point(w.x+sc*u.x-tc*v.x,
    w.y+sc*u.y-tc*v.y,w.z+sc*u.z-tc*v.z);
  return Math.hypot(delta.x,delta.y,delta.z);
}
export function polylineDistance(a,b){
  let minimum=Infinity;
  for(let i=0;i<a.length-1;i++){
    for(let j=0;j<b.length-1;j++){
      minimum=Math.min(minimum,
        segmentDistance(a[i],a[i+1],b[j],b[j+1]));
    }
  }
  return minimum;
}
export function auditVacuumPath(options={}){
  const points=vacuumHosePath(options);
  const samples=routeSamples(points);
  const {pumpIntakeCandidate:p,controlCabinetBox:b,
    temperatureControllerBox:c,microscopePost:m}=VN50;
  const start=points[0],end=points.at(-1);
  const near=(a,v,eps=.01)=>Math.abs(a-v)<eps;
  const distinct=points.every((v,i)=>!i||Math.hypot(
    v.x-points[i-1].x,v.y-points[i-1].y,v.z-points[i-1].z)>1);
  const cabinetClearanceMm=Math.min(...samples.map(v=>
    distanceToBox(v,b)-VN50.outerHoseRadiusMm));
  const controllerClearanceMm=Math.min(...samples.map(v=>
    distanceToBox(v,c)-VN50.outerHoseRadiusMm));
  const microscopeClearanceMm=Math.min(...samples.map(v=>
    v.y>=m.ymin&&v.y<=m.ymax?
      Math.hypot(v.x-m.x,v.z-m.z)-m.radiusMm-VN50.outerHoseRadiusMm:
      Math.hypot(Math.max(m.radiusMm-Math.hypot(v.x-m.x,v.z-m.z),0),
        v.y<m.ymin?m.ymin-v.y:v.y-m.ymax)-VN50.outerHoseRadiusMm));
  const passesBehindController=points.some(v=>
    v.x>c.xmin&&v.x<c.xmax&&v.z<b.zmin-VN50.outerHoseRadiusMm);
  const routeAroundCabinetLeft=points.some(v=>
    v.x<b.xmin-VN50.outerHoseRadiusMm);
  const routeAroundCabinetRight=points.some(v=>
    v.x>b.xmax+VN50.outerHoseRadiusMm);
  const harnessClearances=electricalHarnessPaths(options).map(h=>{
    const centerlineMm=polylineDistance(points,h.points);
    return {id:h.id,centerlineMm,
      surfaceMm:centerlineMm-VN50.outerHoseRadiusMm-h.radiusMm};
  });
  const minimumHarnessClearanceMm=Math.min(
    ...harnessClearances.map(v=>v.surfaceMm));
  const verify=near(end.x,p.x)&&near(end.y,p.y)&&near(end.z,p.z)
    &&distinct&&cabinetClearanceMm>0&&controllerClearanceMm>0
    &&microscopeClearanceMm>0&&passesBehindController
    &&routeAroundCabinetLeft&&routeAroundCabinetRight
    &&minimumHarnessClearanceMm>VN50.minimumHarnessSurfaceClearanceMm
    &&VN50.innerBoreRadiusMm>0
    &&VN50.innerBoreRadiusMm<VN50.outerHoseRadiusMm;
  if(!verify)throw Error('VN-50 rear hose route collides with B16/B19/B36 or B37/B38');
  return Object.freeze({
    pumpModel:VN50.model,
    photoConfirmedPumpModel:VN50.physicalNameplate,
    airPath:['B11 central Ø1.4 suction hole','B11 internal rear bore',
      'B15 bored fitting','B15T short flexible hose',
      'B40 rear-routed continuous hollow hose','B20I VN-50 suction inlet (position candidate)'],
    hoseWaypointCount:points.length,
    serviceLane:'B19 controller rear / B36 cabinet rear exterior · Y=70 mm',
    routeHeightMm:70,
    passesBehindController,
    routeAroundCabinetLeft,routeAroundCabinetRight,
    cabinetClearanceMm,
    controllerClearanceMm,
    microscopeClearanceMm,
    harnessClearances,
    minimumHarnessClearanceMm,
    minimumRequiredHarnessClearanceMm:VN50.minimumHarnessSurfaceClearanceMm,
    start,end,
    nominalSourceMatches:near(start.x,94)&&near(start.y,113.5)&&near(start.z,-79),
    inletMatches:true,
    independentFromElectricController:true,
    visuallyContinuous:true,
    actualHoseDiameterVerified:false,
    actualPumpIntakePositionVerified:false,
    fullStrokeGridPass:false,
    continuousBetweenSamplesProven:false,
    points
  });
}
function axisSamples(min,max,step){
  const count=Math.floor((max-min)/step+1e-9);
  const values=Array.from({length:count+1},(_,i)=>min+i*step);
  if(values.at(-1)<max-1e-8)values.push(max);
  return values;
}
export function auditVacuumEnvelope({
  sampleShiftMinMm=-12.5,sampleShiftMaxMm=12.5,
  sampleDepthShiftMinMm=-12.5,sampleDepthShiftMaxMm=12.5,
  sampleAngleMinDeg=-90,sampleAngleMaxDeg=90,
  shiftStepMm=.5,depthStepMm=.5,angleStepDeg=1,
  crossAxisAngleStepDeg=5
}
