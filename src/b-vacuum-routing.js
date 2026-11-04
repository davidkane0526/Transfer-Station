// V39 — route the vacuum line around the REAR of the YUDIAN AI
// temperature-controller panel B19 and the B36 cabinet, not over the
// controller face or through the electrical enclosure.
// Three.js axes: X horizontal, Y up, Z front/back. Units: mm.
// CAD maps the same route to (X,Z,Y).
export const VN50=Object.freeze({
  model:'VN-50',
  physicalNameplate:true,
  photo:120,
  plate:{voltageV:220,powerW:230,openFlowLpm:53,vacuumMmHg:680,weightKg:4},
  publishedProductForm:{portThread:'G1/4 (product-family candidate)',
    lengthMm:200,widthMm:110,heightMm:150},
  oemBrandUnverified:true,
  inletPositionUnverified:true,
  pumpIntakeCandidate:Object.freeze({x:425,y:68,z:180}),
  chuckRearHoseEndNominal:Object.freeze({x:94,y:90.5,z:-79}),
  innerBoreRadiusMm:2.2,
  outerHoseRadiusMm:3.5,
  pumpInletVisualBoreRadiusMm:4.1,
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
  })
});
function point(x,y,z){return {x,y,z};}
export function movingVacuumOutlet({
  sampleShiftMm=0,sampleAngleDeg=0
}={}){
  const rad=sampleAngleDeg*Math.PI/180;
  const c=Math.cos(rad),s=Math.sin(rad);
  const dx=12,dz=-79;
  return point(
    82+(dx+sampleShiftMm)*c+dz*s,
    VN50.chuckRearHoseEndNominal.y,
    -(dx+sampleShiftMm)*s+dz*c
  );
}
export function vacuumHosePath({
  sampleShiftMm=0,sampleAngleDeg=0
}={}){
  const moving=movingVacuumOutlet({sampleShiftMm,sampleAngleDeg});
  // The first span stays to the right of the B16 microscope post.
  // The tube then passes LEFT of B36, BEHIND its rear wall, and
  // around the cabinet's RIGHT side before approaching the pump's
  // candidate INTAKE. It never enters the electrical enclosure.
  const path=[
    moving,
    point(175,102,-135),
    point(190,102,-170),
    point(190,102,-275),
    point(350,102,-275),
    point(520,102,-275),
    point(520,102,140),
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
  const segmentsCrossCabinet=cabinetClearanceMm<0;
  const verify=near(end.x,p.x)&&near(end.y,p.y)&&near(end.z,p.z)
    &&distinct&&cabinetClearanceMm>0&&controllerClearanceMm>0
    &&microscopeClearanceMm>0&&passesBehindController
    &&VN50.innerBoreRadiusMm>0
    &&VN50.innerBoreRadiusMm<VN50.outerHoseRadiusMm;
  if(!verify)throw Error('VN-50 rear-routed hose disconnects or collides with B16/B19/B36');
  return Object.freeze({
    pumpModel:VN50.model,
    photoConfirmedPumpModel:VN50.physicalNameplate,
    airPath:['B11 central Ø1.4 suction hole','B11 rear vacuum bore',
      'B15 bored fitting','B15T short flexible hose',
      'B40 rear-routed continuous hollow hose','B20I VN-50 suction inlet (position candidate)'],
    hoseWaypointCount:points.length,
    serviceLane:'B19 controller rear / B36 cabinet rear exterior',
    passesBehindController,
    cabinetClearanceMm,
    controllerClearanceMm,
    microscopeClearanceMm,
    start,end,
    nominalSourceMatches:near(start.x,94)&&near(start.y,90.5)&&near(start.z,-79),
    inletMatches:true,
    independentFromElectricController:true,
    visuallyContinuous:true,
    actualHoseDiameterVerified:false,
    actualPumpIntakePositionVerified:false,
    verifiedFullStrokeCollisionFree:false,
    segmentsCrossCabinet,
    points
  });
}
