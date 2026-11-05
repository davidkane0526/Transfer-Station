import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CONFIG,PARTS,SOURCE_LINKS} from './parts.js';
import {enrichParts} from './details.js';
import {enriched,pricedSummary,csvExportRows} from './procurement.js';
import {stageLocalTranslation} from './kinematics.js';
import {interfaceEvidence} from './interface-evidence.js';
import {parseXZ,fitRigidXZ} from './cad-registration.js';
import {STACKS,HANDLES,MAGNET_PLACEMENT} from './photo-evidence.js';
import {AXES,JOINTS} from './assembly-qa.js';
import {PHOTO_94_95_97,photo94BracketCandidate,getPhotoComparison,vc13PhotoScrewDatums,photo95FrontDriveDatums} from './photo-947-assembly.js';
import {getPlateHolderJawDatums} from './holder-mechanics.js';
import {auditBPhotoProfile} from './b-physical-audit.js';
import {V28_OEM_DIMENSIONS,DIMENSION_PHOTOS_V28} from './dimension-evidence.js';
import {B149,auditB149,auditBLoweringPose} from './b-photo149-geometry.js';
import {VN50,vacuumHosePath,electricalHarnessPaths,auditVacuumPath,auditVacuumEnvelope,polylineDistance} from './b-vacuum-routing.js';
import {auditBaseTopology,mountStatus} from './assembly-mounts.js';
import {suctionDimension,auditVacuumInterfaceFit} from './pneumatic-dimensions.js';
import {auditB35MicroscopeFasteners} from './b35-fastener-audit.js';
import {auditPlatformAAssembly} from './platform-a-assembly-audit.js';
import {V48_RULER_EVIDENCE,auditV48RulerRegistration} from './v48-ruler-registration.js';

const $=id=>document.getElementById(id), host=$('viewer');
const scene=new THREE.Scene();scene.background=new THREE.Color('#102034');scene.fog=new THREE.Fog('#102034',750,1500);
const camera=new THREE.PerspectiveCamera(39,1,0.1,3200);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
const labelRenderer=new CSS2DRenderer();labelRenderer.domElement.style.position='absolute';labelRenderer.domElement.style.top='0';labelRenderer.domElement.style.pointerEvents='none';host.append(labelRenderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.055;orbit.maxDistance=1450;orbit.minDistance=65;
scene.add(new THREE.HemisphereLight(0xd7ecff,0x304057,2.05));
const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(240,550,210);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-450;sun.shadow.camera.right=450;sun.shadow.camera.top=450;sun.shadow.camera.bottom=-450;scene.add(sun);
const rim=new THREE.DirectionalLight(0x60a9ed,.9);rim.position.set(-350,250,-180);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:'#112031',roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-3;floor.receiveShadow=true;scene.add(floor);
const mats={
board:new THREE.MeshStandardMaterial({color:'#353d45',metalness:.78,roughness:.43}),
steel:new THREE.MeshStandardMaterial({color:'#a9bccc',metalness:.75,roughness:.29}),
silver:new THREE.MeshStandardMaterial({color:'#b7c2c9',metalness:.8,roughness:.3}),
dark:new THREE.MeshStandardMaterial({color:'#313d4b',metalness:.65,roughness:.39}),
black:new THREE.MeshStandardMaterial({color:'#1a242e',metalness:.35,roughness:.48}),
microscope:new THREE.MeshStandardMaterial({color:'#d4dce2',metalness:.55,roughness:.38}),
white:new THREE.MeshStandardMaterial({color:'#f0ecde',roughness:.83}),
ceramic:new THREE.MeshStandardMaterial({color:'#e6d7be',roughness:.68}),
glass:new THREE.MeshPhysicalMaterial({color:'#b6def3',transparent:true,opacity:.55,roughness:.1,metalness:0,transmission:.28,depthWrite:false}),
blue:new THREE.MeshStandardMaterial({color:'#329edc',metalness:.2,roughness:.35}),
copper:new THREE.MeshStandardMaterial({color:'#d9a66b',metalness:.54,roughness:.35}),
rubber:new THREE.MeshStandardMaterial({color:'#444a4b',roughness:.85}),
ink:new THREE.MeshStandardMaterial({color:'#101922',roughness:.7}),
warningRed:new THREE.MeshStandardMaterial({color:'#b73c36',metalness:.12,roughness:.55}),
pump:new THREE.MeshStandardMaterial({color:'#8396a7',metalness:.48,roughness:.5})
};
const groups={
base:{name:'面包板 / 基座',color:'#7e92a4'},
film:{name:'载玻片运动台 / 转移臂',color:'#d8a96e'},
sample:{name:'样品平移与旋转',color:'#77baee'},
heat:{name:'真空吸附 / 陶瓷加热',color:'#e0bb83'},
microscope:{name:'显微镜 / 相机 / 物镜',color:'#a7c8f2'},
illumination:{name:'照明',color:'#ffdf80'},
vacuum:{name:'真空管路',color:'#64c7c0'},
external:{name:'温控 / 泵 / 电源',color:'#afa5d5'}};
let platform='B', bPhoto94Mode=false, currentRoot=new THREE.Group(), parts=new Map(), active=null, explosion=0,
    filmShift=0,filmShiftDepth=0,filmDrop=0,sampleShift=0,sampleAngle=0,showHoles=true,showLabels=true,showDimensions=true,wireframe=false,showAxes=false;
// Read-only platform state for automated browser QA.
window.__activePlatformProbe=()=>({platform,photoVariant:bPhoto94Mode?'archive':'current',partCount:parts.size});
let pointerDown=null;
const measurementOverlay=new THREE.Group();scene.add(measurementOverlay);
// Read-only diagnostic used by the real-browser assembly smoke test.
// Coordinate projection detects "component in BOM but outside viewport".
window.__modelBViewProbe=()=>{
 const g=parts.get('B36')?.g;
 if(!g)return {exists:false};
 camera.updateMatrixWorld(true);g.updateWorldMatrix(true,true);
 const center=new THREE.Vector3();
 g.getWorldPosition(center);
 center.y+=62.5;
 const ndc=center.clone().project(camera);
 return {
   exists:true,visible:g.visible&&g.parent?.visible,
   meshCount:g.children.filter(o=>o.isMesh).length,
   hiddenExternalParts:[...parts.values()].filter(v=>v.part.group==='external'&&!v.g.visible).map(v=>v.part.id),
   visibleExternalCount:[...parts.values()].filter(v=>v.part.group==='external'&&v.g.visible).length,
   worldCenter:center.toArray(),
   projectedCenter:ndc.toArray(),
   camera:camera.position.toArray(),target:orbit.target.toArray()
 };
};
// Browser-only, read-only mechanical validation of the ACTUAL rendered
// meshes, not just a BOM flag. Photos145/150 place the microscope foot
// and the sample rotary on the SAME black Thorlabs board B35.
window.__modelBSupportProbe=()=>{
 if(platform!=='B')return {available:false};
 const getMeshes=(id)=>{
   const g=parts.get(id)?.g;
   if(!g)return [];
   g.updateWorldMatrix(true,true);
   return g.children.filter(v=>v.isMesh);
 };
 const boardMeshes=getMeshes('B35'),scopeMeshes=getMeshes('B16'),rotMeshes=getMeshes('B08');
 if(boardMeshes.length<2||!scopeMeshes.length||!rotMeshes.length)
   return {available:false};
 const boardBox=new THREE.Box3().setFromObject(boardMeshes[0]);
 boardBox.union(new THREE.Box3().setFromObject(boardMeshes[1]));

 const scopeFootBox=new THREE.Box3().setFromObject(scopeMeshes[0]);
 const rotFootBox=new THREE.Box3().setFromObject(rotMeshes[0]);
  // V51: B16 foot bores are registered against the 12.5mm-phase B35 M6 grid.
  // B35's first two meshes are the board layers; following children are fasteners.
 const mountAudit=auditB35MicroscopeFasteners({
   boardCenterX:CONFIG.B.sampleBoardCenterX,
   microscopeCenterX:87.5,
   microscopeCenterZ:-112.5,
   boardThicknessMm:CONFIG.B.sampleBoardRiseMm
 });
 const footBoresOpen=mountAudit.candidateHolePairs.every(hole=>{
   const origin=new THREE.Vector3(hole.footWorldX,scopeFootBox.max.y+2,hole.footWorldZ);
   const ray=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0),0,16);
   return ray.intersectObject(scopeMeshes[0],false).length===0;
 });
 const overlaps2D=(a,b)=>a.min.x>=b.min.x&&a.max.x<=b.max.x&&
   a.min.z>=b.min.z&&a.max.z<=b.max.z;
 return {
   available:true,
   boardSizeMm:boardBox.getSize(new THREE.Vector3()).toArray(),
   microscopeFootBottomMm:scopeFootBox.min.y,
   rotaryFootBottomMm:rotFootBox.min.y,
   boardTopMm:boardBox.max.y,
   microscopeFullyOnBlackBoard:overlaps2D(scopeFootBox,boardBox),
   rotaryFullyOnBlackBoard:overlaps2D(rotFootBox,boardBox),
   originalThorlabsPartNumberConfirmed:false,
   microscopeFootFourTrueThroughBores:footBoresOpen,
   B16MountingScrewHeads:scopeMeshes.filter(m=>m.userData.B16MountingScrewHead).length,
   NFPMicrometerOverallLengthCandidateMm:parts.get('B09')?.g?.userData?.NFPMicrometerOverallLengthCandidateMm??null,
   NFPUpperPhotoSideHoleRowHeightMm:parts.get('B09')?.g?.userData?.NFPUpperPhotoSideHoleRowHeightMm??null,
   microscopeMountAudit:mountAudit
 };
};
// V50: B-specific MXFMS optical assembly audit. It deliberately uses
// photos108/110/113/116 and manufacturer MXFMS data, never A photos41/71/72.
window.__modelBOpticsProbe=()=>{
 if(platform!=='B')return {available:false};
 const roots={scope:parts.get('B16')?.g,camera:parts.get('B17')?.g,
              nosepiece:parts.get('B18')?.g};
 if(!roots.scope||!roots.camera||!roots.nosepiece)return {available:false};
 const collect=(root,flag)=>{
   const found=[];root.traverse(o=>{if(o.userData[flag])found.push(o)});return found;
 };
 const post=collect(roots.scope,'MXFMSPost')[0];
 const coarse=collect(roots.scope,'MXFMSFocusKnob').filter(o=>o.userData.MXFMSFocusKnob==='coarse');
 const fine=collect(roots.scope,'MXFMSFocusKnob').filter(o=>o.userData.MXFMSFocusKnob==='fine');
 return {
   available:true,
   postDiameterMm:post?.userData.MXFMSPost.diameterMm??null,
   postHeightMm:post?.userData.MXFMSPost.heightMm??null,
   coarseFocusKnobs:coarse.length,
   fineFocusKnobs:fine.length,
   cameraAdapterSections:collect(roots.camera,'cameraAdapterSection').length,
   fiveHoleNosepiece:collect(roots.nosepiece,'MXFMSFiveHoleNosepiece').length===1,
   objectivePorts:collect(roots.nosepiece,'nosepieceObjectivePort').length,
   installedObjectives:collect(roots.nosepiece,'objectiveBarrel').length,
   objectiveLabels:collect(roots.nosepiece,'objectiveBarrel').map(o=>o.userData.objectiveLabel)
 };
};
// V46 read-only first-rig kinematic witness: A03 fixed body does NOT
// move; its output plate plus A04L/A04/A05 must move together by the preview
// displacement. This is NOT a real glass-contact/collision certification.
window.__modelAKinematicProbe=()=>{
  if(platform!=='A')return {available:false};
  const vc=parts.get('A03')?.g,lowerTilt=parts.get('A04L')?.g,
        tilt=parts.get('A04')?.g,arm=parts.get('A05')?.g,magnet=parts.get('A17')?.g,
        microscopeFoot=parts.get('A10')?.g,
        silverSample=parts.get('A07')?.g,
        rotarySample=parts.get('A06')?.g;
  if(!vc||!lowerTilt||!tilt||!arm||!magnet||!microscopeFoot||!silverSample||!rotarySample)return {available:false};
  microscopeFoot.updateWorldMatrix(true,true);
  const footMesh=microscopeFoot.children.find(m=>m.isMesh);
  const a10Bores=[[-28,-13],[-28,37],[22,-13],[22,37]];
  const a10Open=Boolean(footMesh)&&a10Bores.every(([x,z])=>{
    const start=microscopeFoot.localToWorld(new THREE.Vector3(x,16,z));
    const ray=new THREE.Raycaster(start,new THREE.Vector3(0,-1,0),0,16);
    return ray.intersectObject(footMesh,false).length===0;
  });
  const a10Heads=microscopeFoot.children.filter(m=>
    m.isMesh&&m.userData.A10CandidateBoltHead).length;
  return {
    available:true,
    vStageStationaryBaseWorldY:vc.position.y,
    vStageMovingPlateOffsetY:vc.userData.verticalCarriage?.position.y??null,
    lowerGoniometerWorldBaseY:lowerTilt.position.y,
    g40WorldBaseY:tilt.position.y,
    bracketWorldBaseY:arm.position.y,
    filmDropMm:filmDrop,
    a17CandidateHoleCount:magnet.userData.candidateMountHoleMarkers?.length??0,
    a17SideSlotCount:magnet.userData.photo22SideSlotCount??0,
    a17FrontKnobCount:magnet.userData.photo22FrontKnobCount??0,
    a17TopCounterboreCount:magnet.userData.photo23TopCounterboreCount??0,
    a15TopCounterboreCount:parts.get('A15')?.g.userData.A15Photo23TopCounterboreCount??0,
    a15RecessedHeadCount:parts.get('A15')?.g.userData.A15Photo23RecessedHeadCount??0,
    a17OemComparisonSku:magnet.userData.oemComparisonSku??null,
    a10ActualFootBoresOpen:a10Open,
    a10CandidateBoltHeadCount:a10Heads,
    a10ActualManufacturerAnchorVerified:false,
    a17PhotographedSkuVerified:false,
    bMagnetPhotographedSkuVerified:true,
    bMagnetSkuMustNotBeAttributedToA:true,
    sampleTopAboveBoardMm:silverSample.userData.rulerSampleTopAboveBoardMm??null,
    sampleLayersMm:silverSample.userData.layerProxies??null,
    sampleRotaryDiameterMm:rotarySample.userData.photo48CandidateRotaryDiameterMm??null,
    sampleRotaryRightAngularMicrometerCount:rotarySample.userData.rightAngularMicrometerCount??0,
    sampleRotaryShortFrontLockCount:rotarySample.userData.shortFrontLockCount??0,
    sampleRulerWithinTolerance:auditV48RulerRegistration().sampleTopWithinVisibleRulerRange,
    samplePhotoRulerSource:V48_RULER_EVIDENCE.A.sampleTopHeightAboveBreadboardMm.photos,
    stageModel:'GCM-VC13M',
    knownProxyGeometryCollisionFree:false,
    glassClampedAndReachable:false,
    globalAssemblyAudit:auditPlatformAAssembly()
  };
};
// V36 read-only probes measure ACTUAL rendered Three.js meshes.
// A pure-datum pass alone does not prove the jaw stays outside the heater.
window.__modelBNfpSideHoleProbe=()=>{
 if(platform!=='B')return {available:false};
 const root=parts.get('B09')?.g;if(!root)return {available:false};
 const bores=[];
 root.traverse(o=>{if(o.userData.NFPPhoto25SideBore)bores.push(o.userData.NFPPhoto25SideBore)});
 return {
   available:true,sideHoleCount:bores.length,
   lowerRowCount:bores.filter(x=>x.row==='lower').length,
   upperRowCount:bores.filter(x=>x.row==='upper').length,
   candidateDiametersMm:bores.map(x=>x.diameterMm),
   exactHoleCoordinatesMeasured:false,threadSizesVerified:false,
   sourcePhotos:['25','26']
 };
};
window.__modelBContactProbe=()=>{
 if(platform!=='B'||bPhoto94Mode)return {available:false};
 const g=id=>parts.get(id)?.g;
 const meshBox=m=>{
   if(!m?.isMesh)return null;m.updateWorldMatrix(true,false);
   return new THREE.Box3().setFromObject(m);
 };
 const fullBox=id=>{
   const part=g(id);if(!part)return null;
   part.updateWorldMatrix(true,true);
   const b=new THREE.Box3();
   part.traverse(o=>{if(o.isMesh&&o.visible)b.union(new THREE.Box3().setFromObject(o));});
   return b.isEmpty()?null:b;
 };
 const glass=meshBox(g('B07')?.children.find(o=>o.isMesh));
 const stamp=meshBox(g('B07')?.children.filter(o=>o.isMesh)[1]);
 const holder=fullBox('B06'),chuck=fullBox('B11');
 if(!glass||!stamp||!holder||!chuck)return {available:false};
 return {
   available:true,
   glassX:[glass.min.x,glass.max.x],
   stampX:[stamp.min.x,stamp.max.x],
   stampRightInsetMm:glass.max.x-stamp.max.x,
   stampCenterOffsetFromHeaterMm:(stamp.min.x+stamp.max.x)/2-CONFIG.B.sampleX,
   clampRightMm:holder.max.x,
   chuckLeftMm:chuck.min.x,
   clampToHeaterClearanceMm:chuck.min.x-holder.max.x,
   stampBottomMm:stamp.min.y,
   chuckTopMm:chuck.max.y,
   stampToHeaterGapMm:stamp.min.y-chuck.max.y,
   clampFootprintOutsideHeater:holder.max.x<chuck.min.x
 };
};
window.__modelBHeatingHarnessProbe=()=>{
 if(platform!=='B')return {available:false};
 const heat=parts.get('B37')?.g,sensor=parts.get('B38')?.g,box=parts.get('B36')?.g;
 if(!heat||!sensor||!box)return {available:false};
 const activePaths=group=>{
   let n=0;group.traverse(o=>{if(o.isMesh&&o.userData.dynamicHarnessLead)n++});return n;
 };
 box.updateWorldMatrix(true,true);
 const leftWall=box.children[1];
 const ray=new THREE.Raycaster(
   new THREE.Vector3(215,86,-166),new THREE.Vector3(1,0,0),0,17);
 const holeFree=leftWall?.isMesh&&ray.intersectObject(leftWall,false).length===0;
 return {
   available:true,
   heatingLeads:activePaths(heat),
   temperatureFeedbackLeads:activePaths(sensor),
   realSideWallFeedthroughHole:!!holeFree,
   internalTerminationZoneExists:!!parts.get('B39'),
   heaterSupplyTopologyVerified:false,
   controllerTerminalPinoutVerified:false
 };
};
window.__modelBVacuumSplineEnvelopeProbe=()=>{
 if(platform!=='B')return {available:false};
 const shifts=Array.from({length:51},(_,i)=>-12.5+i*.5);
 const angles=Array.from({length:181},(_,i)=>-90+i);
 const sampleCurve=(points,segments)=>{
   const curve=new THREE.CatmullRomCurve3(points.map(p=>
     new THREE.Vector3(p.x,p.y,p.z)));
   return Array.from({length:segments+1},(_,i)=>{
     const p=curve.getPointAt(i/segments);
     return {x:p.x,y:p.y,z:p.z};
   });
 };
 const minima={B37A:Infinity,B37B:Infinity,B38:Infinity};
 const worst={};
 const hoseRadius=VN50.outerHoseRadiusMm;
 let posesChecked=0;
 for(const sampleShiftMm of shifts)for(const sampleAngleDeg of angles){
   const options={sampleShiftMm,sampleAngleDeg};
   const hose=sampleCurve(vacuumHosePath(options),48);
   const wires=electricalHarnessPaths(options);
   for(const wire of wires){
     const centerline=polylineDistance(hose,sampleCurve(wire.points,32));
     const surface=centerline-hoseRadius-wire.radiusMm;
     if(surface<minima[wire.id]){
       minima[wire.id]=surface;
       worst[wire.id]={sampleShiftMm,sampleAngleDeg};
     }
   }
   posesChecked++;
 }
 return {
   available:true,
   posesChecked,
   sampleShiftRangeMm:[-12.5,12.5],
   sampleAngleRangeDeg:[-90,90],
   shiftStepMm:.5,
   angleStepDeg:1,
   curveType:'THREE.CatmullRomCurve3 centripetal; getPointAt arc-length sampling',
   hoseCurveSegments:48,
   harnessCurveSegments:32,
   minimumSurfaceClearanceMm:minima,
   worstCasePoses:worst,
   requiredSurfaceClearanceMm:VN50.minimumHarnessSurfaceClearanceMm,
   fullStrokeSplineGridPass:Object.values(minima).every(v=>
     v>VN50.minimumHarnessSurfaceClearanceMm)
 };
};
window.__modelBVacuumProbe=()=>{
 if(platform!=='B')return {available:false};
 const pump=parts.get('B20')?.g;
 const hose=parts.get('B40')?.g;
 const fitting=parts.get('B15')?.g;
 if(!pump||!hose||!fitting)return {available:false};
 pump.updateWorldMatrix(true,true);
 fitting.updateWorldMatrix(true,true);
 const ring=pump.children.find(o=>o.userData.realSuctionInlet);
 const bored=fitting.children.find(o=>o.userData.trueVacuumAxialBore);
 if(!ring||!bored)return {available:false};
 const pumpBounds=new THREE.Box3().setFromObject(pump);
 const pumpEnvelopeMm=[
   pumpBounds.max.x-pumpBounds.min.x,
   pumpBounds.max.y-pumpBounds.min.y,
   pumpBounds.max.z-pumpBounds.min.z
 ];
 const pumpFeatures={basePlate:0,mountingFeet:0,motorHousing:0,motorCore:0,
   cylindricalHousing:0,housingBands:0,fanCover:0,fanGrilles:0,
   twinHeads:0,tieRods:0,rodSupports:0,headFlanges:0,headCaps:0,headFins:0,
   headBridges:0,headBridgeSupports:0,fanApertures:0,topPorts:0,filters:0,warningPlates:0,
   warningSymbols:0,nameplateTextLines:0,vents:0,topVents:0,sideVents:0,
   mountingFootCenters:[],nameplateCenters:[],tieRodCenters:[]};
 pump.traverse(o=>{
   if(o.userData.pumpBasePlate)pumpFeatures.basePlate++;
   if(o.userData.pumpMountingFoot){pumpFeatures.mountingFeet++;
     pumpFeatures.mountingFootCenters.push([o.position.x,o.position.y,o.position.z]);}
   if(o.userData.pumpNameplate){pumpFeatures.nameplateCenters.push([o.position.x,o.position.y,o.position.z]);}
   if(o.userData.pumpTieRodCandidate){pumpFeatures.tieRods++;pumpFeatures.tieRodCenters.push([o.position.x,o.position.y,o.position.z]);}
   if(o.userData.pumpCylindricalHousing)pumpFeatures.cylindricalHousing++;
   if(o.userData.pumpHousingBand)pumpFeatures.housingBands++;
   if(o.userData.pumpFanGrille)pumpFeatures.fanGrilles++;
   if(o.userData.pumpFanAperture)pumpFeatures.fanApertures++;
   if(o.userData.pumpHeadFin)pumpFeatures.headFins++;
   if(o.userData.pumpHeadBridge)pumpFeatures.headBridges++;
   if(o.userData.pumpHeadBridgeSupport)pumpFeatures.headBridgeSupports++;
   if(o.userData.pumpWarningPlate)pumpFeatures.warningPlates++;
   if(o.userData.pumpWarningSymbol)pumpFeatures.warningSymbols++;
   if(o.userData.pumpNameplateTextLine)pumpFeatures.nameplateTextLines++;
   if(o.userData.pumpTopVent)pumpFeatures.topVents++;
   if(o.userData.pumpSideVent)pumpFeatures.sideVents++;
   if(o.userData.pumpMotorHousing)pumpFeatures.motorHousing++;
   if(o.userData.pumpMotorCore)pumpFeatures.motorCore++;
   if(o.userData.pumpFanCover)pumpFeatures.fanCover++;
   if(o.userData.pumpTwinHead)pumpFeatures.twinHeads++;
   if(o.userData.pumpRodSupport)pumpFeatures.rodSupports++;
   if(o.userData.pumpHeadFlange)pumpFeatures.headFlanges++;
   if(o.userData.pumpHeadCap)pumpFeatures.headCaps++;
   if(o.userData.pumpTopPortCandidate)pumpFeatures.topPorts++;
   if(o.userData.pumpFilterCandidate)pumpFeatures.filters++;
   if(o.userData.ventCandidate)pumpFeatures.vents++;
 });
 const outlet=new THREE.Vector3(12,-17,-79)
   .applyMatrix4(fitting.matrixWorld);
 const inlet=new THREE.Vector3(90,68,0).applyMatrix4(pump.matrixWorld);
 const waypoints=hose.userData.lastRoute||vacuumHosePath();
 const first=waypoints[0],end=waypoints.at(-1);
 const interfaceFit=auditVacuumInterfaceFit();
 const poseAudit=hose.userData.audit||auditVacuumPath();
 const envelopeAudit=hose.userData.envelopeAudit||
   (hose.userData.envelopeAudit=auditVacuumEnvelope());
 const inletRay=new THREE.Raycaster(
   new THREE.Vector3(446,68,180),new THREE.Vector3(-1,0,0),0,43);
 const fittingRay=new THREE.Raycaster(
   new THREE.Vector3(82,107.5,-50),new THREE.Vector3(0,0,1),0,19);
 const boresOpen=inletRay.intersectObject(ring,false).length===0&&
   fittingRay.intersectObject(bored,false).length===0;
 const activeHoseMeshes=hose.children.filter(o=>o.isMesh&&o.userData.dynamicVacuumHose);
 const outerHose=activeHoseMeshes.find(o=>o.userData.dynamicVacuumHose==='outer');
 const curvePoints=mesh=>{
   const curve=mesh?.geometry?.parameters?.path;
   if(!curve?.getPointAt)return [];
   mesh.updateWorldMatrix(true,false);
   return Array.from({length:161},(_,i)=>
     curve.getPointAt(i/160).clone().applyMatrix4(mesh.matrixWorld));
 };
 const hoseCurve=curvePoints(outerHose);
 const splineClearance=(groupId,role,radius)=>{
   const group=parts.get(groupId)?.g;if(!group)return null;
   let mesh=null;group.traverse(o=>{
     if(o.isMesh&&o.userData.dynamicHarnessLead===role)mesh=o;
   });
   const wireCurve=curvePoints(mesh);
   if(hoseCurve.length<2||wireCurve.length<2)return null;
   return polylineDistance(hoseCurve,wireCurve)-
     VN50.outerHoseRadiusMm-radius;
 };
 const actualSplineHarnessClearancesMm={
   B37A:splineClearance('B37','heaterA',1.1),
   B37B:splineClearance('B37','heaterB',1.1),
   B38:splineClearance('B38','temperature',.72)
 };
 return {
   available:true,
   nameplateModel:pump.userData.nameplateModel,
   photoConfirmed:pump.userData.pumpModelReadFromPhoto120,
   geometryRevision:pump.userData.geometryRevision,
   pumpEnvelopeMm,
   pumpFeatures,
   fromPart:'B15',toPart:'B20',hosePart:'B40',
   hoseOuterRadiusMm:VN50.outerHoseRadiusMm,
   hoseLumenRadiusMm:VN50.innerBoreRadiusMm,
   hoseWallMeshes:activeHoseMeshes.length,
   actualSplineGeometryAvailable:Object.values(actualSplineHarnessClearancesMm).every(Number.isFinite),
   actualSplineHarnessClearancesMm,
   sourceCoordinateErrorMm:outlet.distanceTo(new THREE.Vector3(first.x,first.y,first.z)),
   pumpCoordinateErrorMm:inlet.distanceTo(new THREE.Vector3(end.x,end.y,end.z)),
   twoOpenPorts:boresOpen,
   sealedVacuumCircuitVerified:interfaceFit.sealedVacuumCircuitVerified,
   directPumpHoseFitVerified:interfaceFit.pumpEnd.directFitVerified,
   pumpSideAdapterUnresolved:interfaceFit.pumpEnd.matchingAdapterOrFittingUnresolved,
   hoseToPumpBoreDiametricGapMm:null,
   pumpPortThreadCandidate:interfaceFit.pumpEnd.threadCandidate,
   pumpPortMajorDiameterMm:interfaceFit.pumpEnd.threadMajorDiameterMm,
   pumpPortPitchMm:interfaceFit.pumpEnd.pitchMm,
   pumpPortFemaleTapDrillCandidateMm:interfaceFit.pumpEnd.femaleTapDrillCandidateMm,
   pumpPortGenderVerified:interfaceFit.pumpEnd.portGenderVerified,
   electricityCabinetNotVacuumDestination:true,
   passesBehindController:hose.userData.audit?.passesBehindController===true,
   serviceLane:hose.userData.audit?.serviceLane,
   cabinetClearanceMm:hose.userData.audit?.cabinetClearanceMm,
   controllerClearanceMm:hose.userData.audit?.controllerClearanceMm,
   microscopeClearanceMm:poseAudit.microscopeClearanceMm,
   harnessClearancesMm:Object.fromEntries(poseAudit.harnessClearances.map(v=>[v.id,v.surfaceMm])),
   minimumHarnessClearanceMm:poseAudit.minimumHarnessClearanceMm,
   minimumRequiredHarnessClearanceMm:poseAudit.minimumRequiredHarnessClearanceMm,
   fullStrokeGridPass:envelopeAudit.fullStrokeGridPass,
   envelopePosesChecked:envelopeAudit.posesChecked,
   envelopeMinimumClearancesMm:envelopeAudit.minimumClearancesMm,
   envelopeWorstCasePoses:envelopeAudit.worstCasePoses,
   continuousBetweenSamplesProven:envelopeAudit.continuousBetweenSamplesProven,
   actualInletThreadVerified:false,
   actualInletOrientationVerified:false,
   dynamicRoute:waypoints.map(p=>[p.x,p.y,p.z])
 };
};
window.__mountingProbe=()=>{
 const q=auditBaseTopology(platform);
 const physicalBaseParts=[...parts.values()].filter(v=>v.part?.group==='base').map(v=>v.part.id);
 const meshBox=(id)=>{
   const g=parts.get(id)?.g;
   if(!g)return null;
   g.updateWorldMatrix(true,true);
   const meshes=g.children.filter(x=>x.isMesh);
   if(!meshes.length)return null;
   const extent=new THREE.Box3().setFromObject(meshes[0]);
   // V46 A17 splits the solid magnet into a 17mm body and a 3mm
   // perforated top. Measuring only mesh 0 would falsely create a
   // 3mm gap to A15, despite both bodies meeting at world Y=40.
   if(id==='A17'&&meshes.length>=2)
     extent.union(new THREE.Box3().setFromObject(meshes[1]));
   return extent;
 };
 const mag=meshBox('A17'),stage=meshBox('A15');
 const board=meshBox('A01');
 const a16=parts.get('A16')?.g;
 const b35=parts.get('B35')?.g;
 return {
   ...q,
   sceneBaseParts:physicalBaseParts,
   singleBreadboardInScene:physicalBaseParts.length===1&&
     physicalBaseParts[0]===q.commonBase,
   A17TouchesA01:!!(mag&&board&&Math.abs(mag.min.y-board.max.y)<.1),
   A15OnA17:!!(mag&&stage&&Math.abs(stage.min.y-mag.max.y)<.1),
   A16CandidateAnchorHeads:a16?.children?.filter(x=>x.userData.A16CandidateAnchorHead).length||0,
   B35CandidateAnchorHeads:b35?.children?.filter(x=>x.userData.B35CandidateAnchorHead).length||0,
   B35IsAuxiliaryPlate:!!b35?.userData.boltedAuxiliaryPlate,
   A17OEMIdentityVerified:false,
    A17ModelCandidate:parts.get('A17')?.g?.userData?.oemModelCandidate||null,
    A17VisualMatchConfidence:parts.get('A17')?.g?.userData?.oemVisualMatchConfidence||null,
    A17CandidateTopHoleCount:parts.get('A17')?.g?.userData?.candidateMountHoleMarkers?.length||0
 };
};
const dimensionMaterial=new THREE.LineBasicMaterial({color:'#7ec8f4',transparent:true,opacity:.95});
function clearMeasurement(){
 if($('measurement-text'))$('measurement-text').textContent='坐标 X / Y(高度) / Z · 单位 mm';
 while(measurementOverlay.children.length){
    const o=measurementOverlay.children[0];measurementOverlay.remove(o);
    if(o.geometry)o.geometry.dispose();
 }
}
function selectedLabels(){
 labels.forEach(l=>l.visible=Boolean(showLabels&&active&&l.parent===active.g));
}
function updateMeasurement(){
 clearMeasurement();if(!showDimensions||!active)return;
 active.g.updateWorldMatrix(true,true);
 // A group-level bounding box includes hidden proxy meshes as well as OEM CAD.
 // Measure visible geometry only, never claim this is physical tolerance QA.
 const bounds=new THREE.Box3();
 active.g.traverse(o=>{
   if(!o.isMesh||!o.visible||!o.geometry)return;
   let parent=o.parent;
   while(parent&&parent!==active.g){if(!parent.visible)return;parent=parent.parent;}
   if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
   if(o.geometry.boundingBox)bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
 });
 if(bounds.isEmpty())return;
 const w=bounds.max.x-bounds.min.x,h=bounds.max.y-bounds.min.y,d=bounds.max.z-bounds.min.z;
 const helper=new THREE.Box3Helper(bounds,0x7ec8f4);measurementOverlay.add(helper);
 $('measurement-text').textContent='选中几何包络：'+[w,h,d].map(x=>x.toFixed(1)).join(' × ')+' mm';
}
scene.add(currentRoot);
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
const hitMeshes=[],holes=[],labels=[],axisObjects=[];
const levelMeaning={D:'原厂机械图/规格中的标称尺寸（但几何可能简化）',P:'照片识别出的型号/外观',U:'使用者确认的装配关系；具体加工尺寸未必确认',I:'由相邻件孔距/几何关系推断',C:'候选或代理尺寸；不可当成实物测绘'};
const mk=(geometry,material,shadow=true)=>{const o=new THREE.Mesh(geometry,material);o.castShadow=shadow;o.receiveShadow=true;return o};
const cub=(w,h,d,m,x=0,y=0,z=0)=>{const o=mk(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o};
const cyl=(r,h,m,x=0,y=0,z=0,segments=48)=>{const o=mk(new THREE.CylinderGeometry(r,r,h,segments),m);o.position.set(x,y,z);return o};
const torus=(r,t,m,x=0,y=0,z=0)=>{const o=mk(new THREE.TorusGeometry(r,t,9,64),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);return o};

// Actual concentric through-hole in display mesh; unlike opaque overlapping
// cylinders, a post is visible through the socket. Nominal Ø12 is from OEM
// PHCP-2/PHSP12 only, while housing wall and position remain candidates.
function sleeve(outerR,innerR,width,material,x=0,y=0,z=0,axis='x'){
 const ring=new THREE.Shape();
 ring.absarc(0,0,outerR,0,2*Math.PI,false);
 const voidPath=new THREE.Path();
 voidPath.absarc(0,0,innerR,0,2*Math.PI,true);
 ring.holes.push(voidPath);
 const geo=new THREE.ExtrudeGeometry(ring,{depth:width,bevelEnabled:false,curveSegments:48,steps:1});
 geo.translate(0,0,-width/2);
 if(axis==='x')geo.rotateY(Math.PI/2);
 else if(axis==='y')geo.rotateX(-Math.PI/2);
 else if(axis!=='z')throw Error('Unsupported clamp socket direction '+axis);
 const mesh=mk(geo,material);mesh.position.set(x,y,z);return mesh;
}
// Manufacturer-constrained PHUC-1 silhouette: ONE continuous vertical
// Ø30 x 60mm barrel with TWO transverse Ø12.1 rod bores spaced 33mm.
// This builds visible outer and INNER tunnel surfaces analytically;
// no solid cube crosses either Ø12 steel rod. It also fixes V30's
// obviously incorrect two detached horizontal rings. OEM-style external
// envelope is known; clamp slot, thread/knob placement remain proxies.
function phucContinuousTwoBores(outerR=15,height=60,throughR=6.05,pitch=33,material=mats.black){
 const pos=[],norm=[];
 const put=(p,n)=>{pos.push(...p);norm.push(...n);};
 const tri=(a,b,c)=>{for(const [p,n] of [a,b,c])put(p,n)};
 const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d)};
 const N=128, M=64, e=pitch/2;
 const outer=(theta,y)=>{
   const ca=Math.cos(theta),sa=Math.sin(theta);
   return [[outerR*ca,y,outerR*sa],[ca,0,sa]];
 };
 const aperture=(theta)=>{
   const z=outerR*Math.sin(theta);
   return Math.sqrt(Math.max(0,throughR*throughR-z*z));
 };
 for(let i=0;i<N;i++){
   const t0=2*Math.PI*i/N,t1=2*Math.PI*(i+1)/N;
   const w0=aperture(t0),w1=aperture(t1);
   // Three connected outer-wall bands: below, between, and above
   // the two bored tunnels. At Z beyond a bore's radius the
   // gap width becomes zero, closing that window smoothly.
   const bands0=[[-height/2,-e-w0],[-e+w0,e-w0],[e+w0,height/2]];
   const bands1=[[-height/2,-e-w1],[-e+w1,e-w1],[e+w1,height/2]];
   for(let k=0;k<3;k++){
     const lo0=outer(t0,bands0[k][0]),hi0=outer(t0,bands0[k][1]);
     const lo1=outer(t1,bands1[k][0]),hi1=outer(t1,bands1[k][1]);
     quad(lo0,hi0,hi1,lo1);
   }
 }
 for(const yc of [-e,e]){
   const bore=(phi,sign)=>{
     const zz=throughR*Math.sin(phi);
     const yy=yc+throughR*Math.cos(phi);
     const xx=sign*Math.sqrt(outerR*outerR-zz*zz);
     return [[xx,yy,zz],[0,-Math.cos(phi),-Math.sin(phi)]];
   };
   for(let i=0;i<M;i++){
     const f0=2*Math.PI*i/M,f1=2*Math.PI*(i+1)/M;
     quad(bore(f0,-1),bore(f0,1),bore(f1,1),bore(f1,-1));
   }
 }
 for(const yy of [-height/2,height/2]){
   const ny=yy>0?1:-1;
   for(let i=0;i<N;i++){
     const t0=2*Math.PI*i/N,t1=2*Math.PI*(i+1)/N;
     const a=[[0,yy,0],[0,ny,0]],b=outer(t0,yy),c=outer(t1,yy);
     b[1]=[0,ny,0];c[1]=[0,ny,0];
     if(ny>0)tri(a,c,b);else tri(a,b,c);
   }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));
 geometry.computeBoundingSphere();
 const mesh=mk(geometry,material);
 // Render-time geometric probe: rods pass through the two tunnel
 // axes WITHOUT first striking the Ø30 barrel. The central strip
 // must remain solid. This guards against wrong triangle winding,
 // accidental fake-through-holes, and future mesh regressions.
 const axialRay=(y)=>{
   const ray=new THREE.Raycaster(
     new THREE.Vector3(-outerR*3,y,0),new THREE.Vector3(1,0,0),
     0,outerR*6);
   return ray.intersectObject(mesh,false).length;
 };
 const openUpper=axialRay(pitch/2)===0;
 const openLower=axialRay(-pitch/2)===0;
 const solidCenter=axialRay(0)>0;
 if(!openUpper||!openLower||!solidCenter)
   throw Error('PHUC-1 3D barrel bore ray QA failed: open upper/lower and solid center required');
 mesh.userData.realSideBores=2;
 mesh.userData.boreCenterRayCheckPassed=true;
 mesh.userData.nominalOuterDiameterMm=outerR*2;
 mesh.userData.oemBoreCenterPitchMm=pitch;
 mesh.userData.photoFitGeometry=true;
 return mesh;
}

// Rectangular photo95 bearing block with a TRUE Ø8.7 through-hole along X.
// A solid cube traversed by a Ø8.6 steel rod was an actual mesh collision.
// Local shape X maps to -scene Z, local shape Y to world Y after yaw 90°.
function frontXRodBracket(width,height,depth,material,x,y,z,boreY,boreZ,boreRadius=4.35){
 const shape=new THREE.Shape();
 shape.moveTo(-depth/2,-height/2);
 shape.lineTo(depth/2,-height/2);
 shape.lineTo(depth/2,height/2);
 shape.lineTo(-depth/2,height/2);
 shape.closePath();
 const h=new THREE.Path();h.absarc(-(boreZ-z),boreY-y,boreRadius,0,2*Math.PI,true);
 shape.holes.push(h);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,steps:1,curveSegments:32});
 geo.translate(0,0,-width/2);geo.rotateY(Math.PI/2);
 const o=mk(geo,material);o.position.set(x,y,z);o.userData.trueThroughBore=true;return o;
}
function thumbKnob(parent,x,y,z,axis='z',r=5){
 const screw=add(parent,cyl(2.0,9,mats.steel,x,y,z,24));
 const knob=add(parent,cyl(r,5,mats.dark,x,y+(axis==='y'?7:0),z+(axis==='z'?7:0),36));
 const cap=add(parent,cyl(r*.82,.8,mats.ink,
 x,y+(axis==='y'?10:0),z+(axis==='z'?10:0),36));
 if(axis==='x'){screw.rotation.z=Math.PI/2;knob.rotation.z=Math.PI/2;cap.rotation.z=Math.PI/2;
  knob.position.set(x+7,y,z);cap.position.set(x+10,y,z);}
 if(axis==='z'){screw.rotation.x=Math.PI/2;knob.rotation.x=Math.PI/2;cap.rotation.x=Math.PI/2;}
 for(const obj of [screw,knob,cap]){obj.userData.candidateThumbscrew=true;}
}

function tube(points,r,m){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mk(new THREE.TubeGeometry(curve,Math.max(24,points.length*12),r,9,false),m,false)}
function shapeRect(w,d){const s=new THREE.Shape();s.moveTo(-w/2,-d/2);s.lineTo(w/2,-d/2);s.lineTo(w/2,d/2);s.lineTo(-w/2,d/2);s.closePath();return s}
function addHoles(s,circles=[],innerRect=null){
 for(const [x,z,r] of circles){const hole=new THREE.Path();hole.absarc(x,z,r,0,2*Math.PI,true);s.holes.push(hole)}
 if(innerRect){const [w,d]=innerRect,h=new THREE.Path();h.moveTo(-w/2,-d/2);h.lineTo(-w/2,d/2);h.lineTo(w/2,d/2);h.lineTo(w/2,-d/2);h.closePath();s.holes.push(h)}
}
function plate(w,d,h,material,holesArray=[],pocket=null){
 const s=shapeRect(w,d);addHoles(s,holesArray,pocket);
 const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:20,steps:1});
 geo.rotateX(-Math.PI/2);return mk(geo,material);
}
function addPart(id,x,y,z,make,meta={}){
 const part=PARTS[platform].find(p=>p.id===id);if(!part)throw new Error('Metadata not found: '+id);
 const g=new THREE.Group();g.position.set(x,y,z);g.userData={partId:id,group:part.group};
 currentRoot.add(g);make(g);
 parts.set(id,{g,base:new THREE.Vector3(x,y,z),part,...meta});
 g.traverse(obj=>{if(obj.isMesh){obj.userData.partId=id;hitMeshes.push(obj)}});
 return g;
}
function add(parent,object){parent.add(object);return object}
function label(parent,title,x,y,z){
 const el=document.createElement('div');el.textContent=title;el.style.cssText='color:#eaf5ff;font:600 11px system-ui;background:#0c1b2cd9;padding:4px 7px;border:1px solid #4a718d;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px #0005';
 const lbl=new CSS2DObject(el);lbl.position.set(x,y,z);parent.add(lbl);labels.push(lbl);return lbl;
}
function circleGuide(g,r,y,x=0,z=0){const o=add(g,torus(r,.55,mats.blue,x,y,z));holes.push(o);return o}
// Non-manufacturing visual screw heads for candidate mating locations.
function jointHead(g,x,topY,z,{headR=3.1,shankR=1.6,shankL=4.8}={}){
 const top=topY+.2,headH=2.2;
 const shaft=add(g,cyl(shankR,shankL,mats.steel,x,top-headH-shankL/2,z,16));
 const head=add(g,cyl(headR,headH,mats.silver,x,top-headH/2,z,32));
 head.userData.fastenerHead=true;
 const socket=add(g,cyl(headR*.43,.22,mats.ink,x,top-.06,z,6));
 for(const o of [shaft,head,socket]){o.userData.fastenerProxy=true;o.userData.verifiedFastener=false;}
 return head;
}
const GCM42_TOP_HOLES=[
  [-25,-25,2.5],[-25,25,2.5],[25,-25,2.5],[25,25,2.5],[0,0,2.5],
  [-20,-20,1.65],[-20,20,1.65],[20,-20,1.65],[20,20,1.65],
  [-16,-16,1.25],[-16,16,1.25],[16,-16,1.25],[16,16,1.25]
];
function addJointHeads(g,id,topY,locations,{headR=3.1}={}){
 const spec=JOINTS[id];
 if(!spec||locations.length!==spec.count)throw Error('Fastener display count mismatch '+id);
 for(const [x,z] of locations)jointHead(g,x,topY,z,{headR});
 g.userData.fastenerProxies=locations.length;
}
function screw(g,x,topY,z,length=25){
 // User-confirmed four flush heads, NOT verified M6x25 or hole pitch.
 const headH=6,headBottom=topY-headH;
 const shaft=add(g,cyl(3,length,mats.steel,x,headBottom-length/2,z,24));
 const head=add(g,cyl(5,headH,mats.silver,x,topY-headH/2,z,36));
 head.userData.fastenerHead=true;
 const socket=add(g,cyl(2.65,.26,mats.ink,x,topY-.08,z,6));
 const rim=add(g,torus(5.13,.25,mats.ink,x,topY-.02,z));
 for(const o of [shaft,head,socket,rim])o.userData.fastenerProxy=true;
 head.userData.confirmedHeadCount=true;
 return head;
}
function makeBoard(){
 addPart(platform+'01',0,0,0,g=>{
  const {width:w,depth:d,height:h,pitch:p}=CONFIG.board;const c=[];
  for(let x=-200;x<=200;x+=p)for(let z=-125;z<=125;z+=p)c.push([x,z,2.6]);
  // Photo150: left/common machine table is metallic silver; the
  // SAMPLE has an independent black Thorlabs board B35 on top.
  const slab=plate(w,d,h,platform==='B'?mats.silver:mats.board,c);add(g,slab);
  const grid=new THREE.GridHelper(425,17,0x586671,0x414b57);grid.position.y=h+.18;g.add(grid);grid.userData.partId=platform+'01';
  label(g,'光学面包板 · 25 mm 网格',-140,h+10,120);
 },{explode:[0,0,0]});
}
function makeStageBlock(id,x,y,z,w,d,h,title,holesPattern=false,motion={},handleSide=1,axes=1,depthHandleSide=1,actuatorZ=0){
 // Vendor GCM-T25M series: 1 axis = 20 mm; 2 axes (T25M2L/2C) = 33 mm.
 // The double-axis stage has orthogonal actuators and TWO coupled carriages.
 if(axes===2 && Math.abs(h-33)>0.01)throw Error('Official GCM-T25M two-axis thickness must be 33mm');
 addPart(id,x,y,z,g=>{
  const lowerH=axes===2?11:11.6;
  add(g,cub(w,lowerH,d,mats.dark,0,lowerH/2,0));
  const carriageX=new THREE.Group();g.add(carriageX);g.userData.slidingX=carriageX;
  if(axes===2){
   const middleH=11,topH=h-lowerH-middleH;
   add(carriageX,cub(w*.96,middleH,d*.94,mats.dark,0,lowerH+middleH/2,0));
   const carriageY=new THREE.Group();carriageX.add(carriageY);
   g.userData.slidingDepth=carriageY;g.userData.slidingTop=carriageY;
   if(id==='A15'){
    // Photo23: the four corner counterbores belong to the TOP of the
    // GCM-T25M2L stage, not to the lower A17 magnetic base.
    const holes=[[-25,-25,3],[-25,25,3],[25,-25,3],[25,25,3]];
    const topPlate=add(carriageY,plate(w*.94,d*.92,topH,mats.dark,holes));
    topPlate.position.y=lowerH+middleH;
    topPlate.userData.A15Photo23FourTopCounterbores=true;
    for(const [x,z] of [[-25,-25],[-25,25],[25,-25],[25,25]]){
      const head=add(carriageY,cyl(2.35,1.2,mats.silver,x,lowerH+middleH+topH-2.1,z,24));
      head.userData.A15Photo23RecessedFastenerCandidate=true;
      add(carriageY,cub(2.2,.18,.45,mats.ink,x,lowerH+middleH+topH-1.47,z));
    }
    g.userData.A15Photo23TopCounterboreCount=4;
    g.userData.A15Photo23RecessedHeadCount=4;
   }else{
    add(carriageY,cub(w*.94,topH,d*.92,mats.dark,0,lowerH+middleH+topH/2,0));
   }
   // Two REAL distinct crossed micrometer assemblies, per original 97/108 and GCM-T25M2L.
   const supportZ=depthHandleSide*(d/2+6);
   add(g,cub(14,11,14,mats.dark,0,lowerH*.5,supportZ));
   const yStem=add(g,cyl(6,27,mats.silver,0,lowerH*.5,depthHandleSide*(d/2+23)));yStem.rotation.x=Math.PI/2;
   const yDrum=add(g,cyl(9,14,mats.silver,0,lowerH*.5,depthHandleSide*(d/2+39)));yDrum.rotation.x=Math.PI/2;
   label(g,'机构Y / 场景Z：前后微调',0,lowerH+5,depthHandleSide*(d/2+55));
  }else{
   g.userData.slidingTop=carriageX;
   add(carriageX,cub(w*.94,h-lowerH,d*.92,mats.dark,0,lowerH+(h-lowerH)/2,0));
  }
  const side=handleSide;
  add(g,cub(14,12,14,mats.dark,side*(w/2+6),h-9,actuatorZ));
  const xStem=add(g,cyl(6,27,mats.silver,side*(w/2+24),h-9,actuatorZ));xStem.rotation.z=Math.PI/2;
  const xDrum=add(g,cyl(9,14,mats.silver,side*(w/2+43),h-9,actuatorZ));xDrum.rotation.z=Math.PI/2;
  label(g,'机构X / 场景X：左右微调',side*(w/2+62),h-1,actuatorZ);
  if(JOINTS[id]&&id!=='A15')addJointHeads(g.userData.slidingTop,id,h-.1,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:2.8});
  if(holesPattern)for(const xx of [-25,25])for(const zz of [-25,25])circleGuide(g.userData.slidingTop,3,h+.5,xx,zz);
  label(g,title,0,h+11,0);
 },{explode:[0,id==='B03'?15:10,0],...motion});
}
function filmB(){
 const ax=CONFIG.B.armX;
 if(bPhoto94Mode){
   // Photo95 visibly shows a rectangular bottom mounting pad, but no
   // legible maker/part number. Do not borrow B02's GCM magnetic SKU
   // from unrelated archive photos 108/109 as though verified here.
   addPart('B29',ax,20,0,g=>{
     // No maker or full geometry is legible in photo95. Show only an
     // unverified attachment envelope, not an invented solid OEM base.
     const proxy=add(g,cub(65,20,65,new THREE.MeshStandardMaterial({
       color:'#8a99aa',transparent:true,opacity:.16,depthWrite:false
     }),0,10,0));
     proxy.userData.unknownEnvelope=true;
     const edges=new THREE.LineSegments(
       new THREE.EdgesGeometry(new THREE.BoxGeometry(65,20,65)),
       new THREE.LineBasicMaterial({color:0xd8a35c}));
     edges.position.y=10;g.add(edges);
     label(g,'实拍95底座 · 规格/磁性均待识别',0,34,0);
   },{explode:[-25,0,0]});
 }else{
   addPart('B02',ax,20,0,g=>{
      add(g,cub(65,10,65,mats.dark,0,5,0));
      const top=add(g,plate(65,65,10,mats.dark,GCM42_TOP_HOLES));
      top.position.y=10;
      addJointHeads(g,'B02',19.95,[[-25,-25],[-25,25],[25,-25],[25,25]]);
      g.userData.oemModel='GCM-420302M';
      g.userData.oemTopHolePattern={M6:5,M4:4,M3:4,total:13};
      label(g,'GCM-420302M · 5-M6（含中心）/4-M4/4-M3',0,38,0);
    },{explode:[-25,0,0]});
 }
 // User-specified B photo comparison, REVERSIBLE: archival evidence had
 // numbered these 94/95/97 photographs as A, so do not infer that the
 // NFP sample-side branch is physically attached to this photographed arm.
 if(bPhoto94Mode){
   makeStageBlock('B03',ax,40,0,65,65,33,
      'GCM-T25M（用户照片95对照 · 2轴）',
      false,{},1,2,1,26); // front-offset X micrometer, as seen in user photo95
 // Photo95: polished push rod is visible through the front recessed opening.
 // A pair of black front clamp/stop plates and four front body screw heads
 // replace the earlier featureless three black cubes. Hole sizes unverified.
 const gT25=parts.get('B03').g;
 const drive=photo95FrontDriveDatums();
 gT25.userData.photo95DriveDatums=drive;
 const frontShaftY=23.4,frontShaftZ=drive.shaftCenterFrontZmm;
 const frontShaft=add(gT25,cyl(drive.shaftRadiusMm,drive.shaftLengthMm,mats.silver,
   drive.shaftCenterXmm,frontShaftY,frontShaftZ,32));
 frontShaft.rotation.z=Math.PI/2;
 frontShaft.userData.photo95FrontShaft=true;
 // Two true-bore black bearing blocks support the shaft ends. Brackets
 // overlap the stage face, while the shaft stays 1.7mm OUTSIDE its body.
 const leftSupport=add(gT25,frontXRodBracket(
   drive.leftBracketWidthMm,13,14,mats.black,drive.leftBracketCenterXmm,22,38,
   frontShaftY,frontShaftZ));
 const rightSupport=add(gT25,frontXRodBracket(
   drive.rightBracketWidthMm,15,14,mats.black,drive.rightBracketCenterXmm,22,38,
   frontShaftY,frontShaftZ));
 leftSupport.userData.photo95FrontBearing=true;
 rightSupport.userData.photo95FrontBearing=true;
 for(const x of [-21,-8,8,21]){
   const fastener=add(gT25,cyl(2,1.2,mats.steel,x,7.5,33.2,6));
   fastener.rotation.x=Math.PI/2;
   fastener.userData.fastenerProxy=true;
   fastener.userData.photo95FrontFastener=true;
   add(gT25,cyl(.85,.3,mats.ink,x,7.5,34.0,6)).rotation.x=Math.PI/2;
 }
 // B03 front fittings are added after makeStageBlock() created its
 // click-target list; register these meshes so front shaft and screws can
 // actually be selected as part of B03 in the 3D viewer.
 gT25.traverse(o=>{
   if(o.isMesh&&!hitMeshes.includes(o)){o.userData.partId='B03';hitMeshes.push(o);}
 });
 addPart('B30',ax,73,0,g=>{
   // Photo97 footprint has a much narrower upright body than the 65mm
   // lower T25M. The GCM-VC13M platform is 65×65 (VC10M is 45×45).
   add(g,cub(65,8,60,mats.black,0,4,0)); // bottom flange on A15 (Y=53)
   add(g,cub(45,38,16,mats.dark,0,27,-8)); // vertical rail housing
   add(g,cub(44,40,4,mats.black,0,27,5)); // black front face (photo97)
   for(const x of [-18,18]){
     add(g,cub(2.2,35,2,mats.ink,x,27,8));
     // Captured front-side retaining screw positions are approximate.
     for(const y of [15,28,42]){
       const h=add(g,cyl(2.1,1.3,mats.steel,x,y,7.65,12));
       h.rotation.x=Math.PI/2;h.userData.fastenerProxy=true;
       add(g,cub(1.9,.45,.15,mats.ink,x,y,8.36));
     }
   }
   add(g,cub(65,6,65,mats.dark,0,48,0)); // VC13M actual OEM 65×65 top, Y=104
   // VC13M vertical micrometer on face, NOT another horizontal rail.
   const micrometer=vc13PhotoScrewDatums();
   add(g,cub(14,10,10,mats.black,0,15,micrometer.frontZmm));
   add(g,cyl(2.8,micrometer.stemLengthMm,mats.steel,0,micrometer.stemCenterLocalYmm,micrometer.frontZmm,24));
   add(g,cyl(6.8,micrometer.drumLengthMm,mats.silver,0,micrometer.drumCenterLocalYmm,micrometer.frontZmm,48));
   for(let y=32;y<micrometer.drumTopLocalYmm;y+=3) add(g,torus(6.85,.22,mats.ink,0,y,micrometer.frontZmm));
   addJointHeads(g,'B30',7.9,[[-24,-24],[-24,24],[24,-24],[24,24]],{headR:2.6});
   label(g,'GCM-VC13M · 前置竖直测微头（照片97）',0,80,0);
 },{explode:[-15,18,0],moveFilm:true});
 addPart('B31',ax,124,0,g=>{
   // Vendor G40M60L: 40×40×20mm, rotation center R=60mm.
   // Photo94 front body has a LOWER cradle, a split rocker top, two
   // front fastener pairs, and a +X micrometer with a steel thimble.
   add(g,cub(40,7,40,mats.black,0,3.5,0));
   add(g,cub(40,7,37,mats.dark,0,10.5,0));
   for(const x of [-14.1,14.1]){
     const edge=add(g,cub(10,7,35,mats.black,x,15,0));
     edge.rotation.z=x<0?.07:-.07;
   }
   add(g,cub(40,3,40,mats.dark,0,18.5,0)); // nominal top at Y=20
   // Photo94: two upper screws in front notch and two front body screws
   // near right-hand actuator mount. None assigned an unverified thread.
   for(const x of [-5,5]){
     const hanging=add(g,cyl(2,8,mats.steel,x,10,21,20));
     hanging.userData.fastenerProxy=true;
     add(g,cyl(3,1.5,mats.silver,x,5.3,21,28));
   }
   for(const [x,y] of [[-7,5.4],[7,5.4],[-9,12],[9,12]]){
     const hd=add(g,cyl(2.6,1.4,mats.silver,x,y,21,6));hd.rotation.x=Math.PI/2;
     hd.userData.fastenerProxy=true;
     const inset=add(g,cyl(1.3,.2,mats.ink,x,y,22,6));inset.rotation.x=Math.PI/2;
   }
   add(g,cub(16,15,29,mats.black,24,8,0)); // outer end stop
   const stem=add(g,cyl(5.5,18,mats.steel,27,10,0,40));stem.rotation.z=Math.PI/2;
   const drum=add(g,cyl(8.3,20,mats.silver,43,10,0,48));drum.rotation.z=Math.PI/2;
   for(let x=35;x<52;x+=3){
     const ring=add(g,torus(8.35,.22,mats.ink,x,10,0));
     ring.rotation.y=Math.PI/2; // ring normal along X
   }
   addJointHeads(g,'B31',14.9,[[-14,-14],[14,14]],{headR:2.6});
   label(g,'GCM-G40M60L · R60 / 右侧测微（照片94）',-4,40,0);
 },{explode:[-25,42,0],moveFilm:true});
 const aBent=photo94BracketCandidate({stageCenterX:ax,stageTopY:144});
 addPart('B32',ax,144,0,g=>{
   // Photo94 unmistakably shows a BENT sheet, NOT an Ø12 post/rod
   // and not the 200mm square beam formerly rendered here.
   const localX=aBent.centerX-ax;
   const leftLocalX=aBent.leftX-ax+aBent.metalThickness/2;
   add(g,cub(aBent.topPlateWidth,aBent.metalThickness,aBent.topPlateDepth,
       mats.black,localX,aBent.metalThickness/2,aBent.sheetFrontZ));
   add(g,cub(aBent.metalThickness,aBent.verticalLegLength,
       aBent.topPlateDepth,mats.black,
       leftLocalX,-aBent.verticalLegLength/2,aBent.sheetFrontZ));
   // The top plate actually sits ON the G40 top, two photo-visible hex
   // heads near stage 40mm table; threads/length still unverified.
   for(const xx of aBent.topBoltWorldX){
     const hex=jointHead(g,xx-ax,aBent.metalThickness,aBent.sheetFrontZ,
       {headR:3.1,shankR:1.5,shankL:4});
     hex.userData.photo94Fastener=true;
     hex.material=mats.dark; // photo94 black bolt heads seated on black folded sheet
   }
   // The lower leg end only forms a slim return flange; the exact glass
   // jaw and optics beyond this photo are NOT modelled here.
   add(g,cub(13,2.5,aBent.topPlateDepth,mats.black,
       leftLocalX+6,-aBent.verticalLegLength+1.25,aBent.sheetFrontZ));
   g.userData.photo94BentSheet=true;
   g.userData.verifiedPhotoBentCorner=true;
   g.userData.photoBracketDatums=aBent;
   label(g,'94实拍：薄型L折弯片 / 上部2紧固件；玻片夹端待识别',
      -24,17,0);
 },{explode:[-13,65,0],moveFilm:true});

   // Keep the slide/transfer film visible in the COMPLETE B layout.
   // Photos 94/95/97 do not identify the missing jaw between B32 and B07.
   // This is an explicitly detached, translucent TARGET-LOCATION REFERENCE,
   // never a fabricated load-bearing connection.
   addPart('B07',CONFIG.B.sampleX+5,105,0,g=>{
     g.userData.connectionPending=true;
     const previewGlass=new THREE.MeshPhysicalMaterial({
       color:'#b6def3',transparent:true,opacity:.30,roughness:.1,
       metalness:0,depthWrite:false,side:THREE.DoubleSide
     });
     const plate=add(g,cub(76,1,26,previewGlass,0,0,0));
     plate.userData.unconnectedReference=true;
     const membrane=add(g,cub(20,1.8,20,mats.ceramic,-5,-1.4,0));
     membrane.material=new THREE.MeshStandardMaterial({
       color:'#e6d7be',transparent:true,opacity:.55,depthWrite:false
     });
     membrane.userData.unconnectedReference=true;
     label(g,'玻片/转移膜位置参考：B32至玻片夹接口缺失',0,18,0);
   },{explode:[0,80,15]});
   return;
 }

 // 108/109: magnet B02 touches board, T25M is ON magnet and handle faces -X.
 // Photo108 sees magnetic-base branded +Z, photo109 sees T25M branded -Z.
// T25M is yaw=180° relative to the magnetic base: the SAME X handle,
// appearing left in the former view and right in the latter.
makeStageBlock('B03',ax,40,0,65,65,33,'GCM-T25M2L (2 axes X/Y)',false,{facingYaw:Math.PI*HANDLES.B03.installationYawDeg/180},1,2,-1);
 addPart('B04',ax,73,0,g=>{
  add(g,cub(65,8,66,mats.dark,0,4,0));
  // Vertical stage stationary frame vs movable side carriage
  const movingCarriage=new THREE.Group();g.add(movingCarriage);
  g.userData.verticalCarriage=movingCarriage;
  // V25M is an UPRIGHT side-driven stage, not a solid stacked cube.
  // Photo149: V25M MOVABLE output surface sits lower than its stationary
  // upright, which continues above the horizontal sleeve mounting plate.
  // These relative heights are photo-fit only, not full OEM CAD.
  // The stationary V25M upright EXTENDS ABOVE its movable output plate.
  // Cutting the whole body to 32mm would remove the top rails seen in 149.
  // Align web and STEP B04A fixed guide at Y=81..133.
  add(g,cub(56,52,18,mats.dark,0,34,-10));
  // Photo108/149: the moving face is BLACK with small mounting holes,
  // not an unbroken silver slab. Backing is 6mm thick; its 2mm black
  // skin has real open geometry and exposes dark BLIND-hole bottoms.
  // 3x4 locations are visual PHOTO PROXIES, not certified OEM pitch.
  add(movingCarriage,cub(34,49,6,mats.dark,0,32.5,2));
  const face=shapeRect(34,49);
  const holePattern=[];
  for(const x of [-10,0,10])for(const yy of [-12.5,-2.5,7.5,17.5])
    holePattern.push([x,yy,1.55]);
  addHoles(face,holePattern);
  const faceGeo=new THREE.ExtrudeGeometry(face,{
    depth:2,steps:1,bevelEnabled:false,curveSegments:32
  });
  const blackFace=add(movingCarriage,mk(faceGeo,mats.black));
  blackFace.position.set(0,32.5,5);
  blackFace.userData.photoFitBlindBores=12;
  // Embedded face rails, not two disconnected steel posts.
  for(const x of [-17,17])add(movingCarriage,cub(2.5,38,1.2,mats.silver,x,31,7.5));
  // Photo108: small SIDE bridge connects the moving guide front
  // (Z=+7) to the B05 plate side face (X=stage+28). It must NOT be
  // the old 65x66 slab INSIDE the stationary 56x18 upright.
  const bracket=add(movingCarriage,cub(25,15,18,mats.dark,15.5,19.5,16));
  bracket.userData.movingSideBridge=true;
  // Photos108/149: V25M micrometer is vertical and OUTSIDE the
  // left upright, not penetrating its solid body. Old V30 micrometer
  // overlapped the stationary guide by ~1456 mm³ in STEP.
  // An annular Ø13.2 guide plus a small tangent bracket supports the
  // shaft. True coupling/thread is still a photo-fit candidate.
  const collar=add(g,sleeve(9,6.6,10,mats.dark,-39,36,0,'y'));
  collar.userData.realMicrometerClearanceBore=true;
  const support=add(g,cub(5,10,4,mats.dark,-30.5,36,-2));
  support.userData.micrometerGuideSupportCandidate=true;
  const verticalShaft=add(g,cyl(6.5,40,mats.silver,-39,49,0));
  verticalShaft.userData.micrometerOutsideUpright=true;
  add(g,cyl(9,17,mats.silver,-39,77.5,0));
  addJointHeads(g,'B04',7.95,[[-25,-24],[-25,24],[25,-24],[25,24]],{headR:2.5});
  label(g,'GCM-V25M · 竖直测微头 +Y',0,89,0);
 },{explode:[-24,30,0],moveFilm:true});
 // A direct cantilever replaces the unsupported 85mm vertical post,
 // rearward 249mm return bar and second hanging post. Attachment is
 // a candidate because the actual fixture screws are unmeasured.
 const rack=auditB149(B149);
 // The old V22 150mm straight cantilever/B26 hanger math is NOT
 // the photographed PHUC+two-bar structure. Keep only the clamp's
 // horizontal placement; derive all remaining datums from B149.
 const link={clampWorldX:rack.glassHolderWorldX,mountY:rack.supportPlateBottomY,
   loadPath:'B33→B25→PHUC-1→B28→side-M6-candidate→GCM-1302M',
   physicalAcceptance:false};
 // B05 is a side-mounted, photo-fit carriage plate. The load path is
 // decomposed into selected elements; B26 represents ONLY an unverified
 // direct M6 rod-end interface, never a floating connector block.
 // Photo149 has a BLACK thin plate with a long cylindrical sleeve
 // seated directly above it. No separate Ø36 PHPB-1 circular foot is
 // seen there: drawing that old flange would collide with the holder.
 addPart('B05',rack.b05CenterX,rack.supportPlateBottomY,0,g=>{
   g.userData.cantileverLink=link;
   g.userData.photo149FlatPlateOnly=true;
   add(g,cub(65,rack.supportPlateHeightMm,66,mats.black,
     0,rack.supportPlateHeightMm/2,0));
   addJointHeads(g,'B05',rack.supportPlateHeightMm-.05,
      [[-30,-30],[-30,30],[30,-30],[30,30]],{headR:2.6});
   label(g,'V30照片108：活动导轨侧装B05安装板，避开固定V25M机架',0,28,0);
 },{explode:[-30,55,-13],moveFilm:true,moveFilmVertical:true});
 // Photo149: steel post extends THROUGH a 50mm cylindrical holder
 // and THROUGH B33 square clamp with a threaded tip still exposed.
 // Previous 25mm rod was physically incapable of supporting B33.
 addPart('B27',rack.postAxisX,rack.supportPostBottomY,rack.postAxisZ,g=>{
   const rod=add(g,cyl(rack.postDiameterMm/2,rack.supportPostLengthMm,mats.steel,
     0,rack.supportPostLengthMm/2,0,56));
   rod.userData.candidate100mmFit=true;
   // Small M6-like terminal witness, not a verified thread pitch.
   add(g,cyl(3,3,mats.silver,0,rack.supportPostLengthMm+1.5,0,32));
   label(g,'竖向接杆 Ø12×100 mm（PHSP12-4 尺规候选）',0,114,0);
 },{explode:[-25,55,-13],moveFilm:true,moveFilmVertical:true});
 // Photo149: missing BLACK sleeve: ~4-5 cm tall; Zolix PHSH-2 50mm
 // is a series-length CANDIDATE, no photo-visible SKU.
 addPart('B34',rack.postAxisX,rack.postHolderBottomY,rack.postAxisZ,g=>{
   add(g,sleeve(rack.postHolderODmm/2,rack.postDiameterMm/2+.08,
      rack.postHolderHeightMm,mats.black,0,rack.postHolderHeightMm/2,0,'y'));
   add(g,torus(rack.postHolderODmm/2,.55,mats.dark,0,
      rack.postHolderHeightMm-.75,0));
   g.userData.photo149HolderDatums=rack;
   g.userData.modelConfirmed=false;
   label(g,'黑色立杆套筒 · PHSH-2 50mm仅候选',0,65,0);
 },{explode:[-23,55,-13],moveFilm:true,moveFilmVertical:true});
 // Photo149 additionally shows a SEPARATE small square connector
 // joining the support post to the first long horizontal Ø12 rod.
 // No identifiable OEM SKU is legible; shape is a two-hole proxy.
 addPart('B33',rack.postAxisX,rack.squareClampCenterY,-7.5,g=>{
   // Unlike the old pair of FLOATING ROUND rings, photo149 shows ONE
   // near-square body. Split its 30mm Z-depth into two contacting,
   // fully bored halves: rear has a vertical Ø12 hole and front has
   // an orthogonal horizontal Ø12 hole. The hole cylinders are
   // 15mm apart along Z, avoiding both rod/solid intersections.
   const rear=add(g,plate(28,15,30,mats.dark,[[0,0,6.05]]));
   rear.position.set(0,-15,-7.5);
   rear.userData.photo149TrueVerticalBore=true;
   const front=add(g,frontXRodBracket(28,30,15,mats.black,
     0,0,7.5,0,7.5,6.05));
   front.userData.photo149TrueHorizontalBore=true;
   thumbKnob(g,0,12,-7.5,'y',3.5);
   thumbKnob(g,13,0,7.5,'x',3.5);
   g.userData.unidentifiedModel=true;
   g.userData.squareBodyEnvelopeMm=[28,30,30];
   g.userData.separateRealThroughBores=2;
   label(g,'照片149：独立方夹 · 真Ø12立杆孔/横杆孔（型号待核）',0,27,0);
 },{explode:[-19,54,-12],moveFilm:true,moveFilmVertical:true});
 // Photos 149 and 150 show an actual Zolix PHUC-1, NOT the earlier
 // PHCP-2. Manufacturer drawing: A60, BØ30, C/DØ12, bore pitch E33.
 // Full housing, two rotatable barrel halves, and insertion datums are
 // not vendor-native CAD; the two orthogonal ring cutouts here are
 // presentation proxies until photo/part coordinate registration.
 addPart('B24',rack.phucCenterX,rack.phucCenterY,0,g=>{
   const oem=V28_OEM_DIMENSIONS.PHUC1;
   g.userData.phuc1OEM=oem;
   g.userData.photoMeasured=false;
   // Photo149 body is ONE continuous cylindrical swivel clamp with
   // a narrow horizontal assembly seam near mid-height. V30 wrongly
   // drew two disconnected thick tube rings. This analytic surface
   // has TWO open Ø12.1 bores with 33mm vertical pitch, matching STEP.
   const barrel=add(g,phucContinuousTwoBores(
      oem.outerDiameterBmm/2,oem.lengthAmm,oem.boreCmm/2+.05,
      oem.boreCenterSpacingEmm,mats.black));
   barrel.userData.manufacturerConstrainedEnvelope=true;
   const splitSeam=add(g,torus(oem.outerDiameterBmm/2-.15,.28,
      mats.ink,0,0,0));
   splitSeam.userData.unverifiedHousingSplitWidth=true;
   // Independent upper/lower thumb screws are both photographically visible.
   thumbKnob(g,0,31,13,'z',5);
   thumbKnob(g,16,-16.5,0,'x',5);
   g.userData.verifiedPhotoModel='Zolix PHUC-1';
   g.userData.oemHoleCenterSpacingMm=oem.boreCenterSpacingEmm;
   label(g,'PHUC-1 · 厂家 A60 / Ø30 / Ø12×2 / 中心距33mm',2,52,-7);
 },{explode:[-23,58,-13],moveFilm:true,moveFilmVertical:true});
 // First Ø12 rod connects B33 square clamp to PHUC upper hole only;
 // 100mm is a PHOTO FIT and not an identified PHSP part number.
 addPart('B25',rack.upperRodStartX,rack.upperRodY,0,g=>{
   const rod=add(g,cyl(6,rack.upperRodLengthMm,mats.steel,
     rack.upperRodLengthMm/2,0,0,60));
   rod.rotation.z=Math.PI/2;
   g.userData.photoFitNotOemLength=true;
   label(g,'首根横杆 Ø12×'+rack.upperRodLengthMm+'mm（照片空间拟合，非型号确认）',32,17,0);
 },{explode:[-20,64,-13],moveFilm:true,moveFilmVertical:true});
 // The second rod is visible through the other PHUC-1 opening in both
 // 149 and 150. Its end-to-end length and swivel yaw are still unknown.
 // Keep it separate in BOM and selection. The glass coupling is unverified.
 addPart('B28',rack.lowerRodStartX,rack.lowerRodY,0,g=>{
   const d=rack.lowerRodEndX-rack.lowerRodStartX;
   const output=add(g,cyl(6,d,mats.steel,d/2,0,0,48));
   output.rotation.z=Math.PI/2;
   g.userData.candidateLengthMm=d;
   g.userData.actualPhotoLengthVerified=false;
   label(g,'下层横杆 Ø12 · 端面抵达夹具侧壁，不穿透夹具',d/2,15,0);
 },{explode:[-14,62,20],moveFilm:true,moveFilmVertical:true});
 // Photo108/150: the lower Ø12 post terminates DIRECTLY at the left
 // side of GCM-1302M. The old large socket and vertical B26 block
 // are absent from the actual apparatus. Small M6 end-stud is a
 // CANDIDATE coupling, not a photo-identified separate adapter.
 addPart('B26',rack.glassHolderSpineLeftX,rack.lowerRodY,0,g=>{
   const stud=add(g,cyl(rack.threadStubDiameterMm/2,
      rack.threadStubLengthMm,mats.steel,rack.threadStubLengthMm/2,0,0,32));
   stud.rotation.z=Math.PI/2;
   g.userData.interfaceOnly=true;
   g.userData.photoConfirmedThread=false;
   label(g,'B26仅是M6接口候选，非可见大型转接件',3,14,0);
 },{explode:[-20,65,2],moveFilm:true,moveFilmVertical:true});
 // The 1-mm glass occupies the 1.5-mm gap between actual upper/lower jaws.
 // Place plate clamp at glass LEFT edge, away from the sample optical axis.
 // 180 degree yaw changes jaw engagement from leftward to rightward.
 addPart('B06',link.clampWorldX,rack.glassHolderOriginY,0,g=>{
  // Daheng GCM-13 (1302M candidate): ONE fixed face, ONE moving pressure
  // plate actuated by TWO screws. Do not create two separate U-shaped jaws.
  // Manufacturer: L=60, M6 attachment, thickness <=5 mm. Jaw offsets below
  // are 1mm glass / 1.5mm preview values, not OEM mechanical drawing.
  const jaw=getPlateHolderJawDatums({
    holderBaseWorldYmm:rack.glassHolderOriginY,
    slideCenterWorldYmm:rack.glassCenterWorldY
  });
  g.userData.gcmJawDatums=jaw;
  const sideBoreY=rack.lowerRodY-rack.glassHolderOriginY;
  // Spine right-side face and the jaw/pressure plate only TOUCH.
  // V30 fixed width=17mm penetrated B06F by 70mm³ and B06M by
  // 490mm³; shrink from 17 to 14.5 without shifting the M6 side face.
  const spine=add(g,frontXRodBracket(14.5,18.5,56,mats.dark,8.25,-11.75,0,
     sideBoreY,0,rack.threadStubDiameterMm/2+.06));
  spine.userData.trueM6SideHole=true;
  add(g,cub(24,5,56,mats.black,-6,-.2,0)); // shared upper screw bridge
  const lowerTop=jaw.fixedJawTopLocalY;
  const upperBottom=jaw.movableJawBottomLocalY;
  add(g,cub(22,4,56,mats.steel,-10,lowerTop-2,0)); // ONE lower fixed face
  add(g,cub(22,jaw.movablePlateThicknessMm,56,mats.silver,-10,
    upperBottom+jaw.movablePlateThicknessMm/2,0));
  // Two independent threaded adjusters push the SAME moving plate.
  for(const z of jaw.screwZmm){
    const drive=add(g,cyl(1.7,jaw.screwShaftLengthMm,mats.steel,
      -10,jaw.screwShaftCenterLocalY,z,24));
    drive.userData.plateHolderActuator=true;
    const knob=add(g,cyl(4.2,5,mats.silver,-10,2.8,z,36));
    knob.userData.plateHolderActuatorKnob=true;
    const cap=add(g,cyl(3.7,.6,mats.ink,-10,5.2,z,36));
    cap.userData.plateHolderActuatorKnob=true;
  }
  // Photo108: no bulky back-side adapter. Thread depth awaits OEM drawing.
  addJointHeads(g,'B06',2.25,[[-10,-6],[8,6]],{headR:2.6});
  label(g,'Daheng GCM-1302M · 共用活动压板 + 双调节螺杆',4,24,0);
 },{explode:[-20,65,5],moveFilm:true,moveFilmVertical:true,facingYaw:Math.PI});
 addPart('B07',rack.glassCenterWorldX,rack.glassCenterWorldY,0,g=>{
  const sheet=add(g,cub(76,1,26,mats.glass,0,0,0));
  sheet.userData.glassRightEdgeWorldX=rack.glassRightX;
  const stamp=add(g,cub(20,1.8,20,mats.ceramic,
    rack.stampOffsetFromGlassCenterX,-1.4,0));
  stamp.userData.rightEdgeStamp=true;
  label(g,'右侧印章对准样品中心；夹具完全位于热台左侧；玻片悬空'+rack.glassToHeaterGapMm.toFixed(1)+'mm / PDMS悬空'+rack.verticalContactDropMm.toFixed(1)+'mm',8,16,0);
 },{explode:[0,80,15],moveFilm:true,moveFilmVertical:true});
}
function rotaryB(){
 const sx=CONFIG.B.sampleX, rise=CONFIG.B.sampleBoardRiseMm;
 // The real apparatus has TWO distinct plate layers: metallic common
 // B01 below and a separate BLACK THORLABS hole-grid board under B08.
 // Photos 145 and 150 show the latter's Thorlabs label and edge.
 // 250×300×12 is a PHOTO-FIT coverage candidate, NOT the
 // identifiable 250×300×12.7mm Thorlabs MB2530/M OEM SKU.
 addPart('B35',CONFIG.B.sampleBoardCenterX,20,0,g=>{
   const w=CONFIG.B.sampleBoardWidthMm,d=CONFIG.B.sampleBoardDepthMm,rise=CONFIG.B.sampleBoardRiseMm;
   // MB2530/M comparison geometry: 10×12 M6 through-grid, 12.5mm edge phase.
   // Exact SKU remains unconfirmed; 12mm thickness is retained from ruler fit.
   const anchors=[[-100,-125],[-100,125],[100,-125],[100,125]];
   const grid=[];
   for(let x=-112.5;x<=112.5+1e-6;x+=25)
     for(let z=-137.5;z<=137.5+1e-6;z+=25)grid.push([x,z,2.5]);
   const lower=plate(w,d,8.5,mats.black,[...grid,...anchors.map(([x,z])=>[x,z,3.25])]);
   add(g,lower);
   const upper=plate(w,d,rise-8.5,mats.black,[...grid,...anchors.map(([x,z])=>[x,z,5.5])]);
   upper.position.y=8.5;add(g,upper);
   for(const [x,z] of anchors){
     const shaft=add(g,cyl(2.5,20,mats.silver,x,-1.5,z));
     shaft.userData.B35CandidateAnchor=true;
     const head=add(g,cyl(5,3.5,mats.steel,x,rise-1.75,z));
     add(g,cyl(2.2,.35,mats.ink,x,rise-.15,z,6));
     head.userData.B35CandidateAnchorHead=true;
   }
   g.userData.boltedAuxiliaryPlate=true;
   g.userData.candidateGridAlignedBolts=4;
   g.userData.independentSampleBoard=true;
   g.userData.boardSkuCandidate='Thorlabs MB2530/M';
   g.userData.boardSkuVerified=false;
   g.userData.gridHoleCount=120;
    g.userData.mountingCounterboreCount=4;
    g.userData.centralFifthCounterbore=false;
   g.userData.gridHolePitchMm=25;
   g.userData.gridEdgeOffsetMm=12.5;
   g.userData.boardThicknessPhotoFitMm=12;
   g.userData.officialCandidateThicknessMm=12.7;
   g.userData.mountingHoleInsetMm=25;
   g.userData.mountingHoleCount=4;
   g.userData.centralFifthCounterbore=false;
   g.userData.anchorHoleCoordinatesWorld=[[-25,-125],[-25,125],[175,-125],[175,125]];
   g.userData.threadGeometry='M6 through-tapped pattern represented by Ø5mm tap-drill holes';
   label(g,'B35 · Thorlabs MB2530/M孔系候选 · 250×300×12 photo-fit · M6/25mm贯通网格',0,rise+8,136);
  });
  addPart('B08',sx,20+rise,0,g=>{
    add(g,cyl(47,23,mats.dark,0,11.5,0));
    add(g,cyl(47,10.2,mats.steel,0,28.1,0));
    add(g,torus(45,1.0,mats.ink,0,33.35,0));
    for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(g,2.6,33.5,x,z);
    // 111.jpg rotary silver lock handle faces the operator (+Z), not +X.
    const knob=add(g,cyl(6,31,mats.silver,0,12,57));knob.rotation.x=Math.PI/2;
    addJointHeads(g,'B08',33.15,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:2.9});
    label(g,'GCM-1107M · Ø94×33.2',0,46,0);
 },{explode:[12,0,0],rotateSample:false});
 addPart('B09',sx,53.2+rise,0,g=>{
   // OEM dimension drawing distinguishes 4 x clearance Ø6.5 / Ø11 counterbore
   // on fixed base from 9-M6 / 4-M3 tapped hole array on moving stage.
   // The original native CAD download is not yet incorporated.
   const mounting=[[-25,-25,3.25],[-25,25,3.25],[25,-25,3.25],[25,25,3.25]];
   add(g,plate(65,65,6,mats.steel,mounting));
   add(g,plate(65,65,5,mats.steel,mounting.map(p=>[p[0],p[1],5.5]))).position.y=6;
   const slidingTop=new THREE.Group();g.add(slidingTop);g.userData.slidingTop=slidingTop;
   const tapped=[
     ...[-25,0,25].flatMap(x=>[-25,0,25].map(z=>[x,z,2.5])),
     ...[-16,16].flatMap(x=>[-16,16].map(z=>[x,z,1.25]))
   ];
   const lower=plate(65,65,2,mats.steel);lower.position.y=11;add(slidingTop,lower);
   const drilled=plate(65,65,10,mats.steel,tapped);drilled.position.y=13;add(slidingTop,drilled);
   // Photos25/26: NFP body side shows a lower 4-hole row on the fixed
   // base and an upper 3-hole row on the moving plate. Diameters/threads
   // are visual candidates only; keep the upper row coupled to the slider.
   const addNfpPhotoBore=(parent,x,y,r,row)=>{
     const rim=add(parent,sleeve(r+.45,r,.6,mats.silver,x,y,-32.2,'z'));
     rim.userData.NFPPhoto25SideBore={row,diameterMm:2*r};
     const bottom=add(parent,cyl(r,.2,mats.black,x,y,-31.3,24));
     bottom.rotation.x=Math.PI/2;
     bottom.userData.NFPPhoto25SideBoreBottom=true;
   };
   const nfpLowerSide=[[-18,7,1.6],[-4,7,2.0],[11,7,2.6],[22,7,1.6]];
   const nfpUpperSide=[[-22,17.5,1.8],[-8,17.5,1.8],[12,17.5,2.8]];
   for(const [x,y,r] of nfpLowerSide)addNfpPhotoBore(g,x,y,r,'lower');
   for(const [x,y,r] of nfpUpperSide)addNfpPhotoBore(slidingTop,x,y,r,'upper');
   g.userData.nfpPhotoSideHoleCount=7;
   g.userData.nfpPhotoSideHoleRows={lower:4,upper:3};
   g.userData.NFPUpperPhotoSideHoleRowHeightMm=17.5;
   g.userData.nfpPhotoSideHoleThreadsVerified=false;
   // NFP official local-coordinate micrometer is LEFT. In the actual photo
   // 110.jpg it points RIGHT due to stage installation at 180° about Y.
   // Maker dimension drawing indicates overall length 155.5--180.5mm.
   add(g,cub(24,15,30,mats.steel,-45,12,0));
   // Hollow face port, 82.5mm spindle, nested collar and drum match the
   // right-facing photo installation and the 155.5–180.5mm OEM envelope.
   add(g,sleeve(4.1,3.8,1,mats.ink,-57,12,0,'x'));
   const spindle=add(g,cyl(3.6,82.5,mats.silver,-89.25,12,0));spindle.rotation.z=Math.PI/2;
   const collar=add(g,sleeve(9,3.8,23,mats.steel,-119,12,0,'x'));
   const drum=add(g,sleeve(11,9.2,28,mats.silver,-131,12,0,'x'));
   g.userData.NFPMicrometerOverallLengthCandidateMm=177.5;
   for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(slidingTop,2.8,23.4,x,z);
   for(const x of [-16,16])for(const z of [-16,16])circleGuide(slidingTop,1.6,23.42,x,z);
   for(const x of [-25,25])for(const z of [-25,25])circleGuide(g,5.5,11.3,x,z);
   addJointHeads(g,'B09',10.9,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:4.2});
   label(g,'NFP 仅单轴 X / 一根测微头',-38,46,0);
   label(g,'NFP-1462C · 原厂65×65×23 · 正面安装180°候选',0,42,0);
 },{explode:[0,16,0],rotateSample:true,facingYaw:Math.PI});
 addPart('B10',sx,76.2+rise,0,g=>{
   const h=plate(65,65,10,mats.white,[[-25,-25,3.4],[-25,25,3.4],[25,-25,3.4],[25,25,3.4]]);add(g,h);
   label(g,'白色无机隔热层 ≈10mm',0,22,0);
 },{explode:[-7,36,-8],rotateSample:true,translateSample:true});
 addPart('B11',sx,86.2+rise,0,g=>{
   const corners=[[-25,-25,3.3],[-25,25,3.3],[25,-25,3.3],[25,25,3.3]];
   // Lower layer with real open underside ceramic pocket
   add(g,plate(65,65,5.4,mats.steel,corners,[38.6,38.6]));
   add(g,plate(65,65,.1,mats.steel,[...corners,[0,0,.7]])).position.y=5.4;
   const cb=corners.map(a=>[a[0],a[1],5.5]);cb.push([0,0,.7]);
   add(g,plate(65,65,6.5,mats.steel,cb)).position.y=5.5;
   // V36: the vacuum passage is an INTERNAL bore, not a glowing
   // hose or a turquoise nozzle protruding through the contact face.
   // Keep the true center Ø1.4 opening in the drilled upper plate;
   // the unverified buried duct is represented only by evidence notes.
   g.userData.vacuumPathInternalNotExternallyVisible=true;
   label(g,'单中心吸附孔 Ø1.4 mm（候选）/ 底面开腔 / 四沉孔',0,31,0);
 },{explode:[0,61,0],rotateSample:true,translateSample:true});
 addPart('B12',sx,86.5+rise,0,g=>{
   add(g,cub(38,5,38,mats.ceramic,0,2.5,0));
   // Pair of heater leads exiting the BACK (-Z) of the milled chuck.
   for(const x of [10,15]){
      add(g,cub(2,1.5,2,mats.copper,x,2.5,-18.5));
      add(g,tube([[x,2.5,-19],[x,2.5,-32.5],[x,2.5,-48],[x+1,0,-60]],.55,mats.copper));
   }
   label(g,'加热片后侧双引线（孔位候选）',0,12,-18);
 },{explode:[38,74,12],rotateSample:true,translateSample:true});
 addPart('B13',sx,91.35+rise,0,g=>{
    add(g,cyl(.6,1.2,mats.copper,6,.6,0));
    add(g,tube([[6,.6,0],[6,.6,-19.5],[6,.6,-33],[6,-3,-51]],.34,mats.blue));
 },{explode:[-17,70,0],rotateSample:true,translateSample:true});
 addPart('B14',sx,86.2+rise,0,g=>{
   for(const x of [-25,25])for(const z of [-25,25]){
      screw(g,x,12.03,z,25); // head surface flush at 12.03; do not mask by blue hole guide
   }
   g.userData.fastenerProxies=4;
   label(g,'4 枚顶部齐平螺钉（仅数量、齐平已确认）',0,45,0);
 },{explode:[0,88,0],rotateSample:true,translateSample:true});
 addPart('B15',sx,95.5+rise,0,g=>{
   // V37: B11's internal vacuum bore must terminate in an OPEN
   // tubular fitting. The former solid rod plugged the air passage.
   const fitting=add(g,sleeve(3,1.42,13,mats.silver,0,0,-39,'z'));
   fitting.userData.trueVacuumAxialBore=true;
   const shortHose=add(g,tube(
     [[0,0,-45.5],[0,1,-58],[1,-3,-70],[12,-17,-79]],1.8,mats.rubber));
   shortHose.userData.lastFlexiblePoint=[12,-17,-79];
   g.userData.rearVacuumBoreNotBlocked=true;
   label(g,'B15接头：OD Ø6.0 / 孔径 Ø2.84 / 长13 mm（均为候选）',4,12,-48);
 },{explode:[0,60,-20],rotateSample:true,translateSample:true});
 const substrate=cub(24,.6,24,mats.glass,0,98.5+rise,0);substrate.position.x=sx;currentRoot.add(substrate);
}
function microscopeB(){
 const sx=CONFIG.B.sampleX,sz=CONFIG.B.scopeZ,
    rise=CONFIG.B.sampleBoardRiseMm;
 // Photo150: microscope post FOOT occupies the BACK of B35.
 // It MUST NOT sit directly on lower silver B01 while the
 // adjacent sample rotary sits 12mm higher on B35.
 addPart('B16',87.5,20+rise,-112.5,g=>{
   // B-specific evidence: photos108/116 identify the SDPTOP MXFMS;
   // the 65x65 foot remains the photographed installation adapter,
   // NOT the manufacturer's separate 320x260 B5 base.
   const footHolePattern=[[-25,-25,3.25],[-25,25,3.25],[25,-25,3.25],[25,25,3.25]];
   const foot=add(g,plate(65,65,12,mats.dark,footHolePattern));
   foot.userData.trueCandidateMountBores=4;
   foot.userData.boardThreadedFixingVerified=false;
   foot.userData.B35GridRegistered=true;
   // Four M6x20 socket-head candidates: 12mm foot + 8mm nominal B35 engagement.
   for(const x of [-25,25])for(const z of [-25,25]){
     const head=screw(g,x,18,z,20);
     head.userData.B16MountingScrewHead=true;
   }
   g.userData.B16MountingScrewCount=4;
   g.userData.mountingFootCenterWorld=[87.5,-112.5];
   g.userData.mountingFootGridRegistered=true;
   // MXFMS maker specification: Ø32 x 280mm post. The custom foot,
   // post-to-board anchors and exact installed height remain candidates.
   const post=add(g,cyl(16,280,mats.steel,0,152,0));
   post.userData.MXFMSPost={diameterMm:32,heightMm:280,manufacturerDimension:true};
   add(g,sleeve(18.5,16.2,26,mats.dark,0,242,0,'y'));
   add(g,cub(80,34,34,mats.microscope,-1.5,242,23));
   const boom=add(g,cub(32,26,125,mats.microscope,-1.5,253,87.5));
   boom.userData.MXFMSBoomProxy=true;
   const body=add(g,cub(55,50,55,mats.microscope,-5.5,229,112.5));
   body.userData.MXFMSBody=true;
   // MXFMS coaxial coarse/fine focus. Paired controls on both sides;
   // knob diameters are visual proxies, not measured OEM dimensions.
   for(const side of [-1,1]){
     const shaftX=side===1?28:-39;
     const coarseX=side===1?38.5:-49.5;
     const fineX=side===1?45:-56;
     const rot=side*Math.PI/2;
     const shaft=add(g,cyl(5,12,mats.dark,shaftX,225,108.5));shaft.rotation.z=rot;
     shaft.userData.MXFMSFocusShaft=true;
     const coarse=add(g,cyl(28,9,mats.dark,coarseX,225,108.5));coarse.rotation.z=rot;
     coarse.userData.MXFMSFocusKnob='coarse';
     const fine=add(g,cyl(15,4,mats.silver,fineX,225,108.5));fine.rotation.z=rot;
     fine.userData.MXFMSFocusKnob='fine';
   }
   // Turret support is offset from the active objective optical axis.
   // Its exact offset is a photo-fit candidate; the 32mm MXFMS post is OEM.
   const mount=add(g,cyl(8,44,mats.dark,-23.5,188,112.5));
   mount.userData.MXFMSNosepieceMount=true;
   for(const x of [-25,25])for(const z of [-25,25]){
     const shank=add(g,cyl(3,18,mats.steel,x,3,z));
     shank.userData.B16CandidateM6Shank=true;
     const head=add(g,cyl(5,2.5,mats.silver,x,13.25,z));
     head.userData.B16CandidateFastenerHead=true;
   }
   g.userData.nominalFastenerGridAligned=true;
   g.userData.realThreadEngagementVerified=false;
   g.userData.MXFMS={model:'MXFMS',manufacturer:'SUNNY / SDPTOP',
     postDiameterMm:32,postHeightMm:280,coarseTravelMm:32,
     fineAdjustmentPrecisionMm:0.002,head:'30deg trinocular'};
   label(g,'SDPTOP MXFMS · Ø32立柱 · 粗/微同轴调焦（安装底座为候选）',-8,303,68);
 },{explode:[0,15,-42]});
 addPart('B17',sx,276+rise,0,g=>{
   // Photo113 identifies the SDPTOP digital microscope camera.
   // CTV/relay tube geometry is a generic adjustable adapter proxy.
   const lower=add(g,cyl(9,10,mats.dark,0,-23,0));
   lower.userData.cameraAdapterSection=true;
   const upper=add(g,cyl(12,18,mats.steel,0,-9,0));
   upper.userData.cameraAdapterSection=true;
   const camera=add(g,cub(47,48,48,mats.dark,0,24,0));
   camera.userData.SDPTOPCamera=true;
   g.userData.cameraAdapterSections=2;
   label(g,'SDPTOP Digital Microscope Camera · CTV/中继筒接口待核',0,77,0);
 },{explode:[0,95,0]});
 addPart('B18',sx,200+rise,0,g=>{
   // Photo108/video show the objective changer; OEM MXFMS data specifies
   // a five-hole inward nosepiece. Port pitch and exact rotation datum
   // are not measured, so this is a visual/photo-fit reconstruction.
   const ports=Array.from({length:5},(_,i)=>{
     const a=i*2*Math.PI/5;
     return {x:-18+18*Math.cos(a),z:18*Math.sin(a)};
   });
   const turretShape=new THREE.Shape();
   turretShape.absarc(-18,0,28,0,2*Math.PI,false);
   const centreBore=new THREE.Path();
   centreBore.absarc(-18,0,8.5,0,2*Math.PI,true);
   turretShape.holes.push(centreBore);
   for(const p of ports){
     const hole=new THREE.Path();
     hole.absarc(p.x,-p.z,8.5,0,2*Math.PI,true);
     turretShape.holes.push(hole);
   }
   const turretGeo=new THREE.ExtrudeGeometry(turretShape,{
     depth:13,bevelEnabled:false,curveSegments:48,steps:1
   });
   turretGeo.rotateX(-Math.PI/2);
   const turret=add(g,mk(turretGeo,mats.dark));
   turret.userData.MXFMSFiveHoleNosepiece=true;
   const hub=add(g,sleeve(8.5,8,13,mats.dark,-18,6.5,0,'y'));
   hub.userData.nosepieceCentralHub=true;
   for(const p of ports){
     const ring=add(g,sleeve(8.5,8,13,mats.dark,p.x,6.5,p.z,'y'));
     ring.userData.nosepieceObjectivePort=true;
   }
   // Photo110: one 10x / 0.15 / DIC / WD10.8 objective and a separate
   // OptoSigma-branded objective are visible; the latter's model is unknown.
   const tenX=add(g,cyl(8,38,mats.steel,0,-18.5,0));
   tenX.userData.objectiveBarrel=true;
   tenX.userData.objectiveLabel='10x / 0.15 / DIC / WD10.8';
   add(g,cyl(9.5,3,mats.dark,0,-1,0));
   add(g,cyl(6.5,12,mats.black,0,-43.5,0));
   add(g,cyl(5.2,1.2,mats.glass,0,-50,0));
   const opto=ports[1];
   const optoBarrel=add(g,cyl(7.5,36,mats.steel,opto.x,-18,opto.z));
   optoBarrel.userData.objectiveBarrel=true;
   optoBarrel.userData.objectiveLabel='OptoSigma · model unknown';
   add(g,cyl(8.8,3,mats.dark,opto.x,-1.5,opto.z));
   add(g,cyl(5.8,12,mats.black,opto.x,-42,opto.z));
   add(g,cyl(4.5,1.2,mats.glass,opto.x,-48.6,opto.z));
   g.userData.MXFMSObjectivePorts=5;
   g.userData.installedObjectiveCount=2;
   label(g,'MXFMS 五孔内倾转换器 · 10×/0.15/DIC/WD10.8 + OptoSigma',-18,27,0);
 },{explode:[16,26,0]});
}function externalB(){
 // Photos114/117/119 show ONE SILVER METAL CONTROL ENCLOSURE:
 // front YUDIAN PID panel B19, inside MEAN WELL SE-600-48 B21 and
 // an unidentified vented module B23. Earlier versions rendered
 // overlapping, floating stand-alone blocks, despite photo119
 // unambiguously showing a common open metal housing.
 // The enclosure 285×225×125mm, walls 3mm, and internal placements
 // are PHOTO-FIT CANDIDATES, not measured shop or wiring dimensions.
 const controlX=365,controlZ=-150;
 addPart('B36',controlX,0,controlZ,g=>{
   const w=285,d=225,h=125,t=3;
   add(g,cub(w,t,d,mats.silver,0,t/2,0));
   // LEFT feedthrough has a REAL clearance opening for the three
   // heater/thermocouple visual leads (port location remains candidate).
   add(g,frontXRodBracket(t,h-t,d,mats.silver,
     -w/2+t/2,(h+t)/2,0,86,-16,5.3));
   add(g,cub(t,h-t,d,mats.silver,w/2-t/2,(h+t)/2,0));
   for(const z of [-d/2+t/2,d/2-t/2])
     add(g,cub(w-2*t,h-t,t,mats.silver,0,(h+t)/2,z));
   g.userData.hollowOpenTop=true;
   g.userData.physicalManufacturerDimensionsKnown=false;
   label(g,'照片114/119：银色电控箱，内置B21/B23；外廓/配线待核',0,h+15,0);
 },{explode:[75,0,-65]});
 addPart('B19',controlX,20,-28.5,g=>{
   // Face of B19 touches the FRONT wall of B36 at Z=-37.5,
   // rather than floating in space as a second 87mm-deep box.
   add(g,cub(120,80,18,mats.dark,0,40,0));
   add(g,cub(82,46,2,mats.black,0,50,9.4));
   label(g,'YUDIAN AI · B36机箱前面板（真实开孔未核）',0,94,12);
 },{explode:[70,10,35]});
 addPart('B21',controlX,3,-190,g=>{
   // Photo117 clearly identifies this SE-600-48 PSU, and photo119
   // places it INSIDE the metal control box. Exact 247×127×63.5
   // is the source-listed hardware envelope.
   add(g,cub(247,63.5,127,mats.silver,0,31.75,0));
   for(let i=0;i<18;i++)add(g,cub(3,.5,90,mats.dark,-99+i*11,64,0));
   label(g,'MEAN WELL SE-600-48 · B36内部',0,91,0);
 },{explode:[85,75,-50]});
 addPart('B23',controlX,3,-77,g=>{
   // The black perforated module in photo119 is a separate INNER
   // component, but its function / exact SKU are unknown.
   add(g,cub(93,38,58,mats.dark,0,19,0));
   for(let i=-3;i<=3;i++)add(g,cub(4,2,41,mats.ink,i*10,39,0));
   // Prevent a decorative port from punching through the actual
   // front steel wall. Dimensions remain photo-fit candidates.
   add(g,cub(48,13,10,mats.steel,0,16,26));
   label(g,'照片119：控制箱内部黑色散热模块（型号未识别）',0,53,0);
 },{explode:[85,65,-38]});
 // Photo120 pump and photo115 LED adapter are distinct EXTERNAL devices,
 // not modules stacked in the controller's metal housing.
 addPart('B20',335,0,180,g=>{
  // V43: user photos 120/123 and the VN-50 family side views agree on a
  // horizontal cylindrical motor shell, not a rectangular box.
  // Two visible tie rods sit on the SAME side, above and below the plate.
  const pumpBase=add(g,cub(200,8,110,mats.black,-10,4,0));
  pumpBase.userData.pumpBasePlate=true;
  for(const x of [-81,61])for(const z of [-48,48]){
    const foot=add(g,cub(28,12,14,mats.dark,x,10,z));
    foot.userData.pumpMountingFoot=true;
    const footHole=add(g,cyl(3.1,2,mats.ink,x,16,z));
    footHole.userData.mountingHoleCandidate=true;
  }
  const motorHousing=add(g,cyl(44,150,mats.black,-10,50,0));
  motorHousing.rotation.z=Math.PI/2;
  motorHousing.userData.pumpMotorHousing=true;
  motorHousing.userData.pumpCylindricalHousing=true;
  const motor=add(g,cyl(28,118,mats.dark,-10,50,0));
  motor.rotation.z=Math.PI/2;
  motor.userData.pumpMotorCore=true;
  for(const x of [-51,7]){
    const band=add(g,sleeve(46,43,4,mats.silver,x,50,0,'x'));
    band.userData.pumpHousingBand=true;
  }
  const fan=add(g,cyl(42,12,mats.dark,-89,50,0));
  fan.rotation.z=Math.PI/2;
  fan.userData.pumpFanCover=true;
  const fanRing=add(g,sleeve(39,31,1.6,mats.silver,-95,50,0,'x'));
  fanRing.userData.pumpFanGrille=true;
  for(const [dy,dz] of [[-24,0],[24,0],[0,-24],[0,24],[-17,-17],[-17,17],[17,-17],[17,17]]){
    const aperture=add(g,cyl(2.5,14,mats.ink,-89,50+dz,dy,24));
    aperture.rotation.z=Math.PI/2;
    aperture.userData.pumpFanAperture=true;
  }
  // Two longitudinal tie rods on the same near side, framing the label.
  for(const y of [30,70]){
    const rod=add(g,cyl(2.5,140,mats.silver,-10,y,39));
    rod.rotation.z=Math.PI/2;
    rod.userData.pumpTieRodCandidate=true;
    for(const x of [-80,60]){
      const bracket=add(g,cub(14,18,14,mats.silver,x,y,34));
      bracket.userData.pumpRodSupport=true;
    }
  }
  // Two finned aluminium heads with a shared upper connecting pipe.
  for(const x of [-45,30]){
    const flange=add(g,cub(48,8,48,mats.dark,x,92,0));
    flange.userData.pumpHeadFlange=true;
    const head=add(g,cub(42,38,42,mats.pump,x,115,0));
    head.userData.pumpTwinHead=true;
    const cap=add(g,cub(44,4,44,mats.silver,x,136,0));
    cap.userData.pumpHeadCap=true;
    for(const y of [138.8,140.6,142.4]){
      const fin=add(g,cub(44,2,44,mats.silver,x,y,0));
      fin.userData.pumpHeadFin=true;
    }
    const bridgeSupport=add(g,cyl(4.2,8,mats.steel,x,138,0));
    bridgeSupport.userData.pumpHeadBridgeSupport=true;
  }
  const bridge=add(g,cyl(4.2,75,mats.silver,-7.5,142,0));
  bridge.rotation.z=Math.PI/2;
  bridge.userData.pumpHeadBridge=true;
  const outlet=add(g,cyl(7,14,mats.steel,-52,143,0));
  outlet.rotation.z=Math.PI/2;
  outlet.userData.pumpTopPortCandidate=true;
  const filterBlock=add(g,cub(18,16,18,mats.copper,50,133,0));
  filterBlock.userData.pumpFilterCandidate=true;
  const filterCollar=add(g,cyl(8,4,mats.silver,50,123,0));
  filterCollar.userData.pumpFilterCandidate=true;
  const filter=add(g,cyl(7,22,mats.glass,50,111,0));
  filter.userData.pumpFilterCandidate=true;
  for(const x of [-80,-75,-20,-5,55,60]){
    for(const z of [-15,15]){
      const y=50+Math.sqrt(44*44-z*z)+.25;
      const vent=add(g,cyl(2.7,1.5,mats.ink,x,y,z,24));
      vent.userData.ventCandidate=true;
      vent.userData.pumpTopVent=true;
    }
  }
  for(const x of [-75,-65,25,40,55,60]){
    for(const y of [40,50,60]){
      const vent=add(g,cyl(2.1,3,mats.ink,x,y,44,20));
      vent.rotation.x=Math.PI/2;
      vent.userData.ventCandidate=true;
      vent.userData.pumpSideVent=true;
    }
  }
  const nameplate=add(g,cub(48,22,1.2,mats.white,-10,50,44));
  nameplate.userData.pumpNameplate=true;
  for(const [y,w] of [[56,30],[52,36],[48,32],[44,28],[40,22]]){
    const line=add(g,cub(w,1.2,.6,mats.ink,-10,y,44.8));
    line.userData.pumpNameplateTextLine=true;
  }
  const warning=add(g,cub(18,18,1.2,mats.white,35,70,40));
  warning.userData.pumpWarningPlate=true;
  const warningRing=add(g,mk(new THREE.RingGeometry(4.2,5.2,32),mats.warningRed));
  warningRing.position.set(35,70,40.75);
  warningRing.userData.pumpWarningSymbol=true;
  const warningSlash=add(g,cub(1.4,12,.6,mats.warningRed,35,70,40.8));
  warningSlash.rotation.z=-Math.PI/4;
  warningSlash.userData.pumpWarningSymbol=true;
  label(g,'VN-50 · 220 V / 230 W · 53 L/min',-10,66,45.2);
  // G1/4 family thread-datum ring only: not a nozzle or mating adapter.
  // Ø13.157 major diameter and Ø11.8 female tap-drill are catalogue references;
  // actual thread gender, port position and seal are not verified on this specimen.
  const inlet=add(g,sleeve(6.5785,5.9,1.2,mats.silver,73.6,68,0,'x'));
  inlet.userData.G1QuarterThreadReference=true;
  inlet.userData.threadMajorDiameterMm=13.157;
  inlet.userData.femaleTapDrillCandidateMm=11.8;
  inlet.userData.threadProfileModelled=false;
  inlet.userData.actualPortSideUnverified=true;
  g.userData.nameplateModel='VN-50';
  g.userData.pumpModelReadFromPhoto120=true;
  g.userData.geometryRevision='V53_VN50_G14_thread_datum_not_a_hose_spigot';
  g.userData.dimensionsCandidateMm={length:200,width:110,height:150};
  label(g,'G1/4接口基准环 · Ø13.157 / P1.337 · 内外牙待实测',74,91,0);
 },{explode:[0,0,0]});
 addPart('B22',335,0,65,g=>{
   add(g,cub(65,48,72,mats.dark,0,24,0));
   add(g,cub(44,22,4,mats.steel,0,24,37));
   const plug=add(g,cyl(7,12,mats.steel,33,16,0));plug.rotation.z=Math.PI/2;
   label(g,'照片115：LED LAMP ADAPTOR（独立于B36机箱）',0,68,0);
 },{explode:[55,0,-20]});
}

// V36 heating harness: connectivity is VISUAL/MECHANICAL only.
// Photo119 shows visible braided cables; actual AI terminal pinout,
// heater supply route, PSU relationship and safety are not verified.
// A common left feedthrough passes a paired heater lead and one
// sensor sheath into the photo-fit cabinet, where they terminate
// at clearly unassigned internal connection zones.
// V40 pneumatic route: B40 passes behind B19/B36 on a lower service lane, outside the enclosure
// controller, PSU or unknown control cabinet electronics.
// Geometrical hose is two-sided wall skin: open lumen and fixed pump
// inlet; the actual hose diameter/G1/4 barb/thread are unverified.
function vacuumSupplyB(){
 const path=vacuumHosePath();
 addPart('B40',0,0,0,g=>{
   const points=path.map(p=>[p.x,p.y,p.z]);
   const outside=add(g,tube(points,VN50.outerHoseRadiusMm,mats.rubber));
   outside.userData.dynamicVacuumHose='outer';
   const innerMaterial=mats.ink.clone();innerMaterial.side=THREE.BackSide;
   const inside=add(g,tube(points,VN50.innerBoreRadiusMm,innerMaterial));
   inside.userData.dynamicVacuumHose='inner';
   g.userData.connectedSource='B15';
   g.userData.connectedPumpIntake='B20';
   g.userData.model='VN-50';
   g.userData.inletOrientationCandidate=true;
   g.userData.routeBehindControllerB19=true;
   g.userData.audit=auditVacuumPath();
   label(g,'B40：B19背后绕行 / 与B37、B38线束分层',350,82,-285);
 },{explode:[0,0,0]});
}
function refreshVacuumHoseB(){
 if(platform!=='B')return;
 const pipe=parts.get('B40')?.g;if(!pipe)return;
 const route=vacuumHosePath({sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle});
 const pts=route.map(p=>[p.x,p.y,p.z]);
 pipe.traverse(o=>{
   if(!o.isMesh||!o.userData.dynamicVacuumHose)return;
   const rad=o.userData.dynamicVacuumHose==='inner'?
     VN50.innerBoreRadiusMm:VN50.outerHoseRadiusMm;
   const next=tube(pts,rad,o.material);
   o.geometry.dispose();o.geometry=next.geometry;
 });
 const a=auditVacuumPath({sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle});
 pipe.userData.audit=a;
 pipe.userData.lastRoute=route;
}

function heatingControlHarnessB(){
 const red=new THREE.MeshStandardMaterial({color:'#bb6b4e',metalness:.26,roughness:.5});
 const pale=new THREE.MeshStandardMaterial({color:'#d0c4ab',metalness:.28,roughness:.56});
 const sensorMat=new THREE.MeshStandardMaterial({color:'#929a9e',metalness:.6,roughness:.35});
 addPart('B39',265,3,-116,g=>{
   add(g,cub(36,16,12,mats.dark,0,8,0));
   for(const x of [-10,0,10])add(g,cyl(2,1.2,mats.silver,x,16.6,0));
   g.userData.electricalFunctionUnverified=true;
   label(g,'箱内端子区域（照片119，端子功能和线序未核）',0,31,0);
 },{explode:[80,40,-35]});
 addPart('B37',0,0,0,g=>{
   for(const [role,mat,r] of [['heaterA',red,1.1],['heaterB',pale,1.1]]){
     const m=add(g,tube([[0,0,0],[1,0,0]],r,mat));
     m.userData.dynamicHarnessLead=role;
   }
   // Both leads pass through the SAME bore in the cabinet's left wall.
   const gland=add(g,sleeve(6.6,5.05,6,mats.black,222.5,86,-166,'x'));
   gland.userData.feedthroughPortCandidate=true;
   add(g,tube([[225,84,-168],[235,72,-154],[237,44,-125],
     [251,25,-117],[255,19.7,-116]],.95,red));
   add(g,tube([[225,87,-167],[235,75,-151],[237,49,-128],
     [252,26,-118],[265,19.7,-116]],.95,pale));
   g.userData.terminatesAtUnassignedTerminalZone=true;
   label(g,'加热双线：后侧并行线束，端子/供电均未核',185,127,-116);
 },{explode:[0,30,-40]});
 addPart('B38',0,0,0,g=>{
   const m=add(g,tube([[0,0,0],[1,0,0]],.72,sensorMat));
   m.userData.dynamicHarnessLead='temperature';
   add(g,tube([[225,89,-163],[235,103,-150],[265,108,-120],
     [310,100,-83],[349,78,-43]],.72,sensorMat));
   g.userData.backPanelTerminalsNotConfirmed=true;
   label(g,'测温反馈线：与加热功率线分支，输入端子未核',250,145,-140);
 },{explode:[0,40,-30]});
}
function refreshHeatingControlHarness(){
 if(platform!=='B')return;
 const angle=sampleAngle*Math.PI/180;
 const ca=Math.cos(angle),sa=Math.sin(angle);
 const travel=stageLocalTranslation(sampleShift,angle);
 const source=(x,y,z)=>new THREE.Vector3(
   CONFIG.B.sampleX+travel.x+x*ca+z*sa,
   y,-x*sa+z*ca+travel.z);
 const gland=new THREE.Vector3(222.5,86,-166);
 for(const id of ['B37','B38']){
   const g=parts.get(id)?.g;if(!g)continue;
   g.traverse(o=>{
     if(!o.isMesh||!o.userData.dynamicHarnessLead)return;
     let start,mid,end,rad;
     if(o.userData.dynamicHarnessLead==='temperature'){
       start=source(6,100.35,-51);mid=2;end=new THREE.Vector3(222.5,89,-163);rad=.72;
     }else{
       const second=o.userData.dynamicHarnessLead==='heaterB';
       start=source(second?16:11,98.5,-60);mid=second?1:0;
       end=new THREE.Vector3(222.5,second?87:84,second?-167:-168);rad=1.1;
     }
     // V40 B40 vacuum hose uses a lower 70mm service plane. The
     // three electric branches remain separate above it and are
     // checked against the hose over the complete sampled motion range.
     const pts=[
       start,
       new THREE.Vector3(119,104+mid*5,-92-mid*5),
       new THREE.Vector3(174,100+mid*6,-140-mid*6),
       new THREE.Vector3(207,94+mid*5,-165-mid*6),
       end
     ];
     // The duct is flexible: its first knot follows sample X/yaw.
     const curve=new THREE.CatmullRomCurve3(pts);
     const next=new THREE.TubeGeometry(curve,80,rad,10,false);
     o.geometry.dispose();o.geometry=next;
   });
 }
}

function platformA(){
 const ax=CONFIG.A.armX,sx=CONFIG.A.sampleX;
 // Photo 100: GCM-T25M is physically stacked ABOVE the rotary stage,
 // not the separate left transfer-arm adjustment stage.
 // New photos137/161 show the factory-marked GCM-5306M 8mm mount
 // below the A rotary. It is a BASE, not an additional rotary axis.
 addPart('A16',sx,20,0,g=>{
   const p=V28_OEM_DIMENSIONS.GCM5306M;
   // A16 outline OEM-known; these four anchor centers are candidates.
   const anchors=[[-28,-25,3.25],[-28,25,3.25],
                  [22,-25,3.25],[22,25,3.25]];
   add(g,plate(p.lengthMm,p.widthMm,p.thicknessMm,mats.black,anchors));
   for(const [x,z] of anchors){
     const shaft=add(g,cyl(2.5,16,mats.steel,x,0,z));
     shaft.userData.A16CandidateAnchor=true;
     const head=add(g,cyl(4.25,2.5,mats.silver,x,6.75,z));
     head.userData.A16CandidateAnchorHead=true;
   }
   g.userData.fourCandidateThreadedAnchors=true;
   label(g,'GCM-5306M 安装底座 · 112×70×8 mm（非旋转台）',0,24,0);
 },{explode:[0,-6,0]});
 // V38: the A FILM-side is magnetically mounted to ONE A01
 // optical breadboard. This magnetic stand is inferred from the user's
 // assembly rule; photos have NOT confirmed its exact maker or height.
 addPart('A17',ax,20,0,g=>{
    // A17 top/underside are not legible in the A-photo evidence.
    // Keep a neutral blank top-interface proxy; do NOT copy B02/GCM-420302M holes.
    add(g,cub(65,10,65,mats.dark,0,5,0));
    const top=add(g,plate(65,65,10,mats.dark,[]));
    top.position.y=10;
    // The front slotted panel sits on the body face. Do not add a false
    // solid front extension that would obstruct the front row of top holes.
    add(g,cub(42,10,1.5,mats.silver,0,13,33.25));
    add(g,cub(42,1.8,1.5,mats.silver,0,2.9,33.25));
    add(g,cub(8,4.2,1.5,mats.silver,-17,5.9,33.25));
    add(g,cub(8,4.2,1.5,mats.silver,17,5.9,33.25));
    g.userData.A17Photo22SlottedSidePanel=true;
    for(const x of [-17,17]){
      const screwHead=add(g,cyl(2.2,1.5,mats.silver,x,2.5,34.0,24));
      screwHead.rotation.x=Math.PI/2;
      screwHead.userData.A17Photo22PanelFastenerCandidate=true;
    }
    const shaft=add(g,cyl(1.8,8.75,mats.steel,0,5.9,36.875));
    shaft.rotation.x=Math.PI/2;
    const knob=add(g,cyl(5.2,9,mats.silver,0,5.9,38.5,40));
    knob.rotation.x=Math.PI/2;
    knob.userData.A17FrontSlottedControlKnob=true;
    g.userData.magneticFixture=true;
    g.userData.brandAndHolePatternNotVerified=true;
    g.userData.oemComparisonSku=null;
    g.userData.oemModelCandidate=null;
    g.userData.oemVisualMatchConfidence='unidentified';
    g.userData.topInterfaceModelled=false;
    g.userData.oemIdentityVerified=false;
    g.userData.candidateTopHolePattern=null;
    g.userData.photo22SideSlotCount=1;
    g.userData.photo22FrontKnobCount=1;
    g.userData.candidateMountHoleMarkers=[];
    g.userData.topCornerCounterbores=0;
    label(g,'A17 · 磁吸底座（型号/顶部孔系未知）',0,32,0);
  },{explode:[-10,0,0]});
 // A sample branch: GCM-5306M base -> A06 rotation -> A02 stage.
 makeStageBlock('A02',sx,61.2,0,65,65,20,'样品侧 GCM-T25M (照片17左向X测微)',true,{rotateSample:true},-1);
 // A film branch: 95.jpg/97.jpg show a DIFFERENT T25M below VC13M.
 makeStageBlock('A15',ax,40,0,65,65,33,'载玻片侧 GCM-T25M2L (2 axes)',false,{},1,2,1);
 // Actual photo 97: A15 dual-axis T25M below upright GCM-VC13M;
 // photo 94: GCM-G40M60L on VC13M, with a SINGLE THIN folded-L
 // plate bolted to G40's movable top. These three images are platform A,
 // not B. All geometries below are photographic silhouettes, not OEM solids.
 addPart('A03',ax,73,0,g=>{
   // Photo97 footprint has a much narrower upright body than the 65mm
   // lower T25M. The GCM-VC13M platform is 65×65 (VC10M is 45×45).
   add(g,cub(65,8,60,mats.black,0,4,0)); // bottom flange on A15 (Y=53)
   add(g,cub(45,36,16,mats.dark,0,26,-8)); // stationary body ends at output lower-limit local Y=44
   add(g,cub(44,36,4,mats.black,0,26,5)); // fixed guide ends at lower-limit local Y=44
   for(const x of [-18,18]){
     add(g,cub(2.2,35,2,mats.ink,x,27,8));
     // Captured front-side retaining screw positions are approximate.
     for(const y of [15,28,42]){
       const h=add(g,cyl(2.1,1.3,mats.steel,x,y,7.65,12));
       h.rotation.x=Math.PI/2;h.userData.fastenerProxy=true;
       add(g,cub(1.9,.45,.15,mats.ink,x,y,8.36));
     }
   }
   // V46: movable VC13M output; previous slider left A03/A04/A05 immobile.
   // Mechanical collision along the actual 13mm travel remains unqualified.
   const movingVC13=new THREE.Group();g.add(movingVC13);
   add(movingVC13,cub(65,7,65,mats.dark,0,47.5,0));
   g.userData.verticalCarriage=movingVC13;
   g.userData.nominalVerticalTravelMm=13;
   g.userData.motionProxyNotCollisionCertified=true;
   // VC13M vertical micrometer on face, NOT another horizontal rail.
   const micrometer=vc13PhotoScrewDatums();
   // V46: the vertical shaft must be OUTSIDE the 65mm travelling
   // output plate. Two side rails and a true-bore annular collar
   // hold the front drive without a solid bar passing through its shaft.
   for(const x of [-8,8])
     add(g,cub(3,10,38,mats.black,x,15,24));
   const frontCollar=add(g,sleeve(9,5.7,4,mats.black,
     0,15,micrometer.frontZmm,'y'));
   frontCollar.userData.vc13ExternalDriveSupportCandidate=true;
   add(g,cyl(2.8,micrometer.stemLengthMm,mats.steel,0,micrometer.stemCenterLocalYmm,micrometer.frontZmm,24));
   add(g,cyl(6.8,micrometer.drumLengthMm,mats.silver,0,micrometer.drumCenterLocalYmm,micrometer.frontZmm,48));
   for(let y=32;y<micrometer.drumTopLocalYmm;y+=3) add(g,torus(6.85,.22,mats.ink,0,y,micrometer.frontZmm));
   addJointHeads(g,'A03',7.9,[[-24,-24],[-24,24],[24,-24],[24,24]],{headR:2.6});
   label(g,'GCM-VC13M · 前置竖直测微头（照片97）',0,80,0);
 },{explode:[-15,18,0],moveFilm:true});
 // Photo94 front view shows TWO approximately 20mm-tall goniometer
 // modules, each with its own drive. Only the upper G40M60L model tag
 // is legible. Never identify the lower as G40M40L without OEM evidence.
 addPart('A04L',ax,124,0,g=>{
   // Vendor G40M60L: 40×40×20mm, rotation center R=60mm.
   // Photo94 front body has a LOWER cradle, a split rocker top, two
   // front fastener pairs, and a +X micrometer with a steel thimble.
   add(g,cub(40,7,40,mats.black,0,3.5,0));
   add(g,cub(40,7,37,mats.dark,0,10.5,0));
   for(const x of [-14.1,14.1]){
     const edge=add(g,cub(10,7,35,mats.black,x,15,0));
     edge.rotation.z=x<0?.07:-.07;
   }
   add(g,cub(40,3,40,mats.dark,0,18.5,0)); // nominal top at Y=20
   // Photo94: two upper screws in front notch and two front body screws
   // near right-hand actuator mount. None assigned an unverified thread.
   for(const x of [-5,5]){
     const hanging=add(g,cyl(2,8,mats.steel,x,10,21,20));
     hanging.userData.fastenerProxy=true;
     add(g,cyl(3,1.5,mats.silver,x,5.3,21,28));
   }
   for(const [x,y] of [[-7,5.4],[7,5.4],[-9,12],[9,12]]){
     const hd=add(g,cyl(2.6,1.4,mats.silver,x,y,21,6));hd.rotation.x=Math.PI/2;
     hd.userData.fastenerProxy=true;
     const inset=add(g,cyl(1.3,.2,mats.ink,x,y,22,6));inset.rotation.x=Math.PI/2;
   }
   add(g,cub(16,15,29,mats.black,24,8,0)); // outer end stop
   const stem=add(g,cyl(5.5,18,mats.steel,27,10,0,40));stem.rotation.z=Math.PI/2;
   const drum=add(g,cyl(8.3,20,mats.silver,43,10,0,48));drum.rotation.z=Math.PI/2;
   for(let x=35;x<52;x+=3){
     const ring=add(g,torus(8.35,.22,mats.ink,x,10,0));
     ring.rotation.y=Math.PI/2; // ring normal along X
   }
   addJointHeads(g,'A04L',14.9,[[-14,-14],[14,14]],{headR:2.6});
   g.userData.lowerGoniometerSkuUnverified=true;
   label(g,'照片94下层独立摆角机构 · 右侧测微 · 型号待核',-4,40,0);
 },{explode:[-25,32,0],moveFilm:true,moveFilmVertical:true});
 addPart('A04',ax,144,0,g=>{
   // Upper G40M60L label is visually legible in photo94.
   // Lower partner is not positively identified. G40M60L body:
   add(g,cub(40,7,40,mats.black,0,3.5,0));
   add(g,cub(40,7,37,mats.dark,0,10.5,0));
   for(const x of [-14.1,14.1]){
     const rocker=add(g,cub(10,7,35,mats.black,x,15,0));
     rocker.rotation.z=x<0?.07:-.07;
   }
   add(g,cub(40,3,40,mats.dark,0,18.5,0));
   // The upper visible drive appears leftward in the current photo
   // projection. This axis is still a candidate until ruler/orthoview.
   add(g,cub(16,15,29,mats.black,-24,8,0));
   const stem=add(g,cyl(5.5,18,mats.steel,-27,10,0,40));
   stem.rotation.z=Math.PI/2;
   const drum=add(g,cyl(8.3,20,mats.silver,-43,10,0,48));
   drum.rotation.z=Math.PI/2;
   for(let x=-52;x<-35;x+=3){
     const ring=add(g,torus(8.35,.22,mats.ink,x,10,0));
     ring.rotation.y=Math.PI/2;
   }
   addJointHeads(g,'A04',14.9,[[-14,-14],[14,14]],{headR:2.6});
   g.userData.upperConfirmedPhoto94='GCM-G40M60L';
   label(g,'94上层：GCM-G40M60L · 40×40×20mm',-4,40,0);
 },{explode:[-25,53,0],moveFilm:true,moveFilmVertical:true});
 const aBent=photo94BracketCandidate({stageCenterX:ax,stageTopY:164});
 addPart('A05',ax,164,0,g=>{
   // Photo94 unmistakably shows a BENT sheet, NOT an Ø12 post/rod
   // and not the 200mm square beam formerly rendered here.
   const localX=aBent.centerX-ax;
   const leftLocalX=aBent.leftX-ax+aBent.metalThickness/2;
   add(g,cub(aBent.topPlateWidth,aBent.metalThickness,aBent.topPlateDepth,
       mats.black,localX,aBent.metalThickness/2,aBent.sheetFrontZ));
   add(g,cub(aBent.metalThickness,aBent.verticalLegLength,
       aBent.topPlateDepth,mats.black,
       leftLocalX,-aBent.verticalLegLength/2,aBent.sheetFrontZ));
   // The top plate actually sits ON the G40 top, two photo-visible hex
   // heads near stage 40mm table; threads/length still unverified.
   for(const xx of aBent.topBoltWorldX){
     const hex=jointHead(g,xx-ax,aBent.metalThickness,aBent.sheetFrontZ,
       {headR:3.1,shankR:1.5,shankL:4});
     hex.userData.photo94Fastener=true;
     hex.material=mats.dark; // photo94 black bolt heads seated on black folded sheet
   }
   // The lower leg end only forms a slim return flange; the exact glass
   // jaw and optics beyond this photo are NOT modelled here.
   add(g,cub(13,2.5,aBent.topPlateDepth,mats.black,
       leftLocalX+6,-aBent.verticalLegLength+1.25,aBent.sheetFrontZ));
   g.userData.photo94BentSheet=true;
   g.userData.verifiedPhotoBentCorner=true;
   g.userData.photoBracketDatums=aBent;
   label(g,'94实拍：薄型L折弯片 / 上部2紧固件；玻片夹端待识别',
      -24,17,0);
 },{explode:[-13,65,0],moveFilm:true,moveFilmVertical:true});
 addPart('A06',sx,28,0,g=>{
  // Photos17/18/20: rotary cylinder does not exceed the 65mm upper
  // square plate. V47 Ø94 was geometrically disproportionate.
  // Candidate Ø66mm; actual vendor/SKU is still unreadable.
  add(g,cyl(33,33.2,mats.dark,0,16.6,0));
  add(g,torus(31,1,mats.steel,0,33.5,0));
  const lock=add(g,cyl(4.5,28,mats.steel,0,12,45));
  lock.rotation.x=Math.PI/2;
  lock.userData.A06ShortFrontLock=true;
  // Separate RIGHT-side angular micrometer, photo17/20/21.
  add(g,cub(14,14,16,mats.black,34,14,0));
  const angularStem=add(g,cyl(5.5,36,mats.silver,51,14,0));
  angularStem.rotation.z=Math.PI/2;
  const angularDrum=add(g,cyl(9,25,mats.silver,81.5,14,0,48));
  angularDrum.rotation.z=Math.PI/2;
  angularDrum.userData.A06RightAngularMicrometer=true;
  for(let x=71;x<92;x+=3){
    const ring=add(g,torus(9,.16,mats.ink,x,14,0));
    ring.rotation.y=Math.PI/2;
  }
  addJointHeads(g,'A06',33.15,[[-16,-16],[-16,16],[16,-16],[16,16]],{headR:2.5});
  g.userData.photo48CandidateRotaryDiameterMm=66;
  g.userData.rotaryManufacturerSkuConfirmed=false;
  g.userData.shortFrontLockCount=1;
  g.userData.rightAngularMicrometerCount=1;
  label(g,'A06旋转台 · 右侧角度测微+前侧锁杆 · Ø66候选',0,54,0);
 },{explode:[0,0,0]});
 addPart('A07',sx,81.2,0,g=>{
  // Original photos17–21 and a steel ruler show the silver top at
  // approximately 87–93mm above the BOARD TOP. Prior V47 single
  // cuboid left it only 79.2mm above the board and erased two seams.
  // Three stacked physical silhouettes: 9 dark + 7 gold + 12 silver.
  add(g,cub(65,9,65,mats.dark,0,4.5,0));
  add(g,cub(65,7,65,mats.copper,0,12.5,0));
  add(g,cub(65,9.5,65,mats.steel,0,20.75,0));
  const headHoles=[[-25,-25,3.25],[-25,25,3.25],
                   [25,-25,3.25],[25,25,3.25]];
  const top=plate(65,65,2.5,mats.steel,headHoles);
  top.position.y=25.5;add(g,top);
  for(const [x,z] of headHoles){
    const head=add(g,cyl(2.9,1.8,mats.dark,x,26.55,z,24));
    head.userData.A07VisibleHeadCandidate=true;
  }
  add(g,cub(28,1.4,28,mats.glass,0,28.7,0));
  g.userData.rulerSampleTopAboveBoardMm=89.2;
  g.userData.layerProxies=[9,7,12];
  g.userData.intermediateMaterialUnknown=true;
  g.userData.vendorHolePatternUnverified=true;
  label(g,'A07样品台 · 实拍三层 / 顶面高于面包板约89mm',0,40,0);
 },{explode:[0,26,0],translateSample:true,rotateSample:true});
 addPart('A10',sx,20,-112,g=>{
    // Four TRUE Ø5.5mm candidate mounting bores in an offset foot.
    // Centers world X50/100, Z-125/-75 match the candidate A01 grid.
    // This is not the identified OEM microscope post mount.
    const offsets=[[-28,-13,2.75],[-28,37,2.75],
                   [22,-13,2.75],[22,37,2.75]];
    const foot=plate(72,65,14,mats.dark,
      offsets.map(([x,z,r])=>[x+3,z-12,r]));
    foot.position.set(-3,0,12);add(g,foot);
    for(const [x,z] of offsets){
      const shaft=add(g,cyl(2.5,17.5,mats.steel,x,2.75,z));
      shaft.userData.A10CandidateBoltShaft=true;
      const head=add(g,cyl(4.25,2.5,mats.silver,x,12.75,z));
      head.userData.A10CandidateBoltHead=true;
    }
    add(g,cyl(13,225,mats.steel,0,126,0));
    add(g,cub(34,25,127,mats.dark,0,234,65));
    g.userData.fourTrueCandidateFootBores=true;
    g.userData.actualOEMFasteningVerified=false;
    label(g,'A10显微镜支架 · 底脚四孔及螺钉均为候选',0,267,60);
 },{explode:[0,15,-30]});
 addPart('A08',sx,170,0,g=>{
  // OEM TTL200-A housing is 28mm long; 200mm is focal length.
  // The older 85mm single filled cylinder was not a manufacturer body.
  add(g,cyl(26,28,mats.black,0,14,0));
  add(g,cyl(25.7,2,mats.silver,0,1,0));
  label(g,'Thorlabs TTL200-A · 28mm壳体 / SM2外螺纹',0,41,0);
 },{explode:[0,35,0]});
 addPart('A09',sx,258,0,g=>{
  add(g,cub(50,45,44,mats.dark,0,22.5,0));
  add(g,cyl(15,12,mats.silver,0,0,0));
  label(g,'Daheng Imaging 工业相机',0,72,0);
 },{explode:[0,92,0]});
 addPart('A11',155,184,60,g=>{
  add(g,cyl(13,33,mats.silver,0,16.5,0));add(g,cyl(11,8,mats.ceramic,0,35,0));
  const neck=add(g,cyl(5,80,mats.black,-25,-12,-12));neck.rotation.z=Math.PI/4;
  label(g,'Thorlabs MWWHL4 LED',0,59,0);
 },{explode:[22,20,22]});
 addPart('A12',262,20,-80,g=>{
  add(g,cub(60,104,73,mats.dark,0,52,0));
  add(g,cub(34,25,2,mats.blue,0,66,37));
  label(g,'Thorlabs LEDD1B',0,123,0);
 },{explode:[50,15,-20]});
 addPart('A13',260,20,72,g=>{
  add(g,cub(75,33,64,mats.dark,0,16.5,0));
  add(g,cub(40,15,4,mats.silver,0,16,34));
  label(g,'德力西 CDG1-1DD/25A',0,62,0);
 },{explode:[45,15,20]});
 addPart('A14',sx,192,0,g=>{
   // A transparent nominal SM2 seat: the open sleeve overlaps the
   // lens housing for 6mm at Y=192..198; top reaches the camera Y=258.
   // Neither sleeve length nor camera flange is OEM-confirmed.
   add(g,sleeve(28,26.1,66,mats.dark,0,33,0,'y'));
   label(g,'SM2接口候选镜筒 · 长66mm含6mm装配重叠 / 相机端未认证',0,80,0);
 },{explode:[0,25,0]});
}
function addAxis(){
 const axes=new THREE.AxesHelper(80);axes.position.set(-216,22,145);currentRoot.add(axes);axisObjects.push(axes);
}
function renderPhotoLedger(){
 const host=$('photo-ledger');if(!host)return;host.replaceChildren();
 const stack=STACKS[platform];
 const filmIds=platform==='B'&&bPhoto94Mode?['B29','B03','B30','B31','B32','B07']:
   platform==='B'?['B02','B03','B04','B05','B34','B27','B33','B25','B24','B28','B26','B06','B07']:stack.film;
 const sampleIds=stack.sample;
 const note=document.createElement('p');note.textContent=platform==='B'&&bPhoto94Mode?'照片94/95/97新结构：T25M→VC13M→G40M60L→L片；下方B29底座只辨认出轮廓，不能套用另一档案的磁吸底座型号。':stack.confidence;host.append(note);
 for(const [side,ids] of Object.entries({film:filmIds,sample:sampleIds,external:stack.external||[]})){
   if(!ids.length)continue;
   const heading=document.createElement('div');heading.className='key';
   heading.textContent=side==='external'?'温控控制箱及内部部件（相对位置仍为候选）':
     side==='film'?(platform==='B'&&bPhoto94Mode?
     '载玻片侧（机构顺序 + 未连接的玻片位置参考）':'载玻片侧（从下至上）'):
     '样品侧（从下至上；与玻片侧接口待核验）';
   host.append(heading);
   const list=document.createElement('div');list.className='list';
   for(const id of ids){
     const part=contextualPart(PARTS[platform].find(x=>x.id===id));if(!part)continue;
     const b=document.createElement('button');b.className='photo-part';
     b.textContent=id+' · '+part.model+' · '+part.name;
     const h=platform==='B'&&bPhoto94Mode&&id==='B03'?{...HANDLES.B03,direction:'+X',evidence:'用户实拍95，右向微分头；历史108/109为另一候选'}:HANDLES[id];
     if(h){const sp=document.createElement('span');sp.className='source-tag';
       sp.textContent=(h.axes===2?'双轴手柄 X:'+h.direction+' / Y:'+h.secondaryDirection+' · 厚'+h.thicknessMm+'mm':'手柄 '+h.direction)+' · '+h.evidence;b.append(sp);}
     b.onclick=()=>selectPart(id);list.append(b);
   }
   host.append(list);
 }
 const m=document.createElement('div');m.className='marked-note';
 m.textContent=platform==='B'&&bPhoto94Mode?'用户要求的B新照片对照配置：GCM-T25M→GCM-VC13M→GCM-G40M60L→L型薄板；此前A/B照片归档冲突未解决，不能以此证明NFP样品侧同机。':platform==='B'?
   'B02为GCM-420302M磁座；B35按Thorlabs MB2530/M候选孔相位重建120个M6贯通孔。B35中心X=75mm，四角安装孔与B01候选25mm网格对齐；B16脚座中心87.5/-112.5mm，四孔与B35网格零误差配准。板厚仍按照片拟合12mm，官方候选12.7mm，SKU和B01螺纹未确认。B36金属机箱包含前置B19温控器、内部B21电源及B23模块。B20真空泵/B22灯电源独立显示。':
   'A17磁吸底座位于A15双轴T25M下方（用户确认固定关系，型号及顶部孔系未知）；A16底座螺钉固定于A01，A02为另一台独立T25M。';
 host.append(m);
}
// Only show/export parts that are actually present in the selected assembly.
// Never add variant-exclusive prototypes to user-facing purchase totals.
function contextualPart(p){
 if(platform==='B'&&bPhoto94Mode&&p.id==='B07')return {
   ...p,
   name:'玻片及转移膜（透明位置参考，实际夹具缺失）',
   model:'76×26×1mm 玻片参考轮廓；未接入 B32',
   detail:'透明玻片和PDMS用于显示预计样品相对位置。当前B32的L形片距离玻片存在未闭合空间，不存在照片证实的夹紧机构和运动耦合。',
   interfaceNote:'在实际夹具、孔位、支杆及装配长度确定前，不把B07视为已经固定或可随B03机构运动。此件不是可加工的夹具CAD。',
   evidence:'B07参考照片107/108；B32来自94/95/97，关联未证实'
 };
 if(platform==='B'&&bPhoto94Mode&&p.id==='B03')return {
   ...p,
   name:'实拍95/97 · GCM-T25M 双轴平移台',
   model:'GCM-T25M（2L/2C后缀未实物确认）',
   detail:'本次实拍95可见GCM-T25M铭牌、右侧测微头和前侧银色推杆；97可见第二正交测微头。当前装配在B29未识别底座之上、B30 GCM-VC13M之下，不是旧108/109的B02磁座→B04 V25M链。',
   interfaceNote:'实拍95不显示确切2L/2C后缀，所有前侧螺丝/支撑孔、推杆接触和B29安装螺纹仍为几何候选。',
   evidence:'2026-11-03重新提供的实拍95/97'
 };
 return p;
}
function activeParts(){
 if(platform!=='B')return PARTS[platform];
 const hidden=bPhoto94Mode?
  new Set(['B02','B04','B05','B06','B24','B25','B26','B27']):
  new Set(['B29','B30','B31','B32']);
 // Never delete the sample stage, microscope, heater or peripherals when
 // switching which photo-constrained FILM arm is shown. They are full-system
 // layout candidates with explicit unverified cross-branch registration.
 return PARTS.B.filter(p=>!hidden.has(p.id)).map(contextualPart);
}
function populateGroups(){
 const list=$('group-list');list.replaceChildren();
 const meta=activeParts();for(const [key,cfg] of Object.entries(groups)){
   const subset=meta.filter(x=>x.group===key);if(!subset.length)continue;
   const line=document.createElement('label');line.className='group-row';
   const input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.group=key;
   input.onchange=()=>parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked});
   const dot=document.createElement('i');dot.className='dot';dot.style.background=cfg.color;
   const tx=document.createElement('span');tx.textContent=cfg.name;
   const count=document.createElement('span');count.className='count';count.textContent=subset.length+' 件';
   line.append(input,dot,tx,count);list.append(line);
   // Every checked category MUST be visible. An older optimization
   // silently hid all external objects while leaving its checkbox ON;
   // this made B36/B19/B21/B23 disappear despite valid STEP/BOM.
   parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked});
 }
}
function updateDetail(part){
 part=part?contextualPart(part):null;
 const el=$('part-detail');if(!part){el.className='select-placeholder';el.textContent='点击零件选中；再点空白取消。只显示被选中的零件标签，不遮挡模型。';return}
 el.className='';
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const reviews=interfaceEvidence(platform,part.id);
 const visibleHeadMeshes=[];
 parts.get(part.id)?.g.traverse(o=>{if(o.isMesh&&o.userData.fastenerHead)visibleHeadMeshes.push(o);});
 const joint=JOINTS[part.id];
 const hardwareHtml=joint?'<div class="field" id="selected-fastener-count" data-count="'+visibleHeadMeshes.length+'"><b>可见紧固件（非验收）</b><p>实际绘制 '+visibleHeadMeshes.length+' 个头部，图示位置 '+joint.count+' 个，'+esc(joint.name)+'。'+
   (joint.status==='candidate'?'具体数量、孔位、头型与螺杆尺寸均为显示候选。':
   '只有顶部四枚及齐平外观经使用者确认；孔距、螺纹和长度仍为候选。')+'</p></div>':'';
 const refPhoto=platform==='A'?PHOTO_94_95_97.imageToParts:null;
 const photoEvidenceBoltCount=[];
 if((platform==='A'&&part.id==='A05')||(platform==='B'&&bPhoto94Mode&&part.id==='B32')){
   parts.get(part.id)?.g.traverse(o=>{if(o.isMesh&&o.userData.photo94Fastener)photoEvidenceBoltCount.push(o)});
 }
 const photo94QAHtml=((platform==='A'&&part.id==='A05')||(platform==='B'&&bPhoto94Mode&&part.id==='B32'))?
   '<div class="field" id="photo-94-mechanics" data-folded="'+(!!parts.get(part.id)?.g.userData.photo94BentSheet)+
   '" data-top-fasteners="'+photoEvidenceBoltCount.length+
   '"><b>94号实物照片装配检查</b><p>单片L形折弯金属板；顶面照片可见两颗紧固件，模型已绘制 '+
   photoEvidenceBoltCount.length+' 个候选螺钉头。照片未展示的下端玻片夹不可据此指定型号。</p></div>':'';
 const photo95Count={frontShaft:0,frontFastener:0};
 if(platform==='B'&&bPhoto94Mode&&part.id==='B03'){
   parts.get('B03')?.g.traverse(o=>{
     if(o.isMesh&&o.userData.photo95FrontShaft)photo95Count.frontShaft++;
     if(o.isMesh&&o.userData.photo95FrontFastener)photo95Count.frontFastener++;
   });
 }
 const photo95Drive=parts.get('B03')?.g.userData.photo95DriveDatums;
 const photo95QAHtml=platform==='B'&&bPhoto94Mode&&part.id==='B03'?
   '<div class="field" id="photo-95-mechanics" data-shafts="'+photo95Count.frontShaft+
   '" data-front-fasteners="'+photo95Count.frontFastener+
   '" data-ends-supported="'+(!!photo95Drive?.supportConnected)+
   '"><b>95号实拍：T25M前部驱动</b><p>正面可见银色推杆，当前建模 '+
   photo95Count.frontShaft+' 根前置推杆和 '+photo95Count.frontFastener+
   ' 个正面候选螺丝头。实际轴承、导轨和孔距仍需厂家3D图纸核对。</p></div>':'';
 const selectedScenePart=parts.get(part.id)?.g;
 const xzDatums=selectedScenePart?.userData.crossClampDatums;
 const phucOem=selectedScenePart?.userData.phuc1OEM;
 const jawDatums=selectedScenePart?.userData.gcmJawDatums;
 let realScrewAxes=0;
 selectedScenePart?.traverse(o=>{if(o.isMesh&&o.userData.plateHolderActuator)realScrewAxes++});
 const holderQAHtml=part.id==='B24'&&phucOem?
   '<div class="field" id="holder-geometric-qa" data-model="PHUC-1" data-hole-spacing="'+phucOem.boreCenterSpacingEmm+
   '"><b>Zolix PHUC-1 厂家尺寸</b><p>照片149/150可确认型号。原厂尺寸：A='+
   phucOem.lengthAmm+'、外径 B='+phucOem.outerDiameterBmm+'、两孔 Ø'+
   phucOem.boreCmm+'、孔中心距 E='+phucOem.boreCenterSpacingEmm+
   ' mm。当前连接姿态、杆长与内部旋转接合仍是几何候选，不能据此声称已完成原厂CAD配准。</p></div>':
   part.id==='B06'&&jawDatums?
   '<div class="field" id="holder-geometric-qa" data-drive-count="'+realScrewAxes+
   '" data-pressure-plate-count="'+jawDatums.independentMovingPlates+
   '"><b>GCM-13 真实夹紧机构示意</b><p>已绘制 '+realScrewAxes+
   ' 根调节螺杆驱动 1 块共用活动压板；当前夹口 '+jawDatums.nominalJawGapMm+
   ' mm 是张开口；当前压板已移动 '+jawDatums.previewClosingTravelMm+' mm，与 '+jawDatums.contactJawGapMm+' mm 厚玻片处于名义接触。夹紧力、真实行程和夹口尺寸均未经验收。</p></div>':'';
 const b35FastenerAudit=(platform==='B'&&(part.id==='B16'||part.id==='B35'))?
   auditB35MicroscopeFasteners({boardCenterX:CONFIG.B.sampleBoardCenterX,
     microscopeCenterX:87.5,microscopeCenterZ:-112.5,
     boardThicknessMm:CONFIG.B.sampleBoardRiseMm}):null;
 const b35FastenerHtml=b35FastenerAudit?
   '<div class="field" id="b35-microscope-fastener-audit" data-bolt-align="'+
   b35FastenerAudit.boardBoltPatternAligned+'" data-mismatch-mm="'+
   b35FastenerAudit.maxMismatchMm.toFixed(2)+'"><b>B35↔B16孔系配准（V51）</b><p>'+
   'B16底座为4个Ø6.5 mm 候选M6通孔，B35对位4个Ø5×6 mm候选螺纹底孔，'+
   '25mm候选网格下孔中心偏差为 '+
   b35FastenerAudit.maxMismatchMm.toFixed(1)+' mm；其余网格仅为2mm装饰盲孔。'+
   '这只解决三维候选孔位相容问题，原机B16/B35型号、孔位原点、攻丝与螺栓有效啮合尚未验证，'+
   '不得据此采购、钻孔或安装承重显微镜。</p></div>':'';
 // The annotation is only in the selected part's detail view, not an
 // always-on 3D label covering the clamp/stamp/optics.
 const mount=mountStatus(platform,part.id);
 const installHtml='<div class="field" id="mounting-method" data-kind="'+
   esc(mount.kind)+'"><b>固定到面包板的方式</b><p>'+esc(mount.text)+
   '。'+(mount.verified?'固定方式可由照片或用户装配关系支持。':
       '螺纹、锚固孔位和磁座型号待核验。')+'</p></div>';
 const suction=suctionDimension(part.id);
 const vacuumFit=(platform==='B'&&['B15','B15T','B20','B20I','B40'].includes(part.id))
     ?auditVacuumInterfaceFit():null;
 const vacuumFitHtml=vacuumFit?
   '<div class="field" id="vacuum-interface-warning" data-status="unverified">'+
   '<b>真空接口装配尚未闭合</b><p>当前只确认了候选管路中心线及中空结构，不能据此认定软管与泵口已经机械连接或气密。热台端：B15接头外径Ø'+
   vacuumFit.heaterEnd.fittingOdMm+' / B40软管内径Ø'+
   vacuumFit.heaterEnd.hoseIdMm+' mm，名义扩张'+
   vacuumFit.heaterEnd.nominalHoseExpansionPct+
   '%，仍需确认软管材料、卡箍和耐温。泵端：VN-50同型号族目录标注G1/4；若按ISO 228-1 BSPP，其基本大径Ø'+
   vacuumFit.pumpEnd.threadMajorDiameterMm+' mm、螺距'+
   vacuumFit.pumpEnd.pitchMm+' mm（19TPI、55°）。若实物为内牙，Ø'+
   vacuumFit.pumpEnd.femaleTapDrillCandidateMm+
   ' mm仅是攻丝底孔候选，不是成品螺纹内径。相关系列安装说明提到在进气口安装PC接头并在螺纹处缠PTFE带，与G1/4平行牙通常采用端面垫片/O形圈的密封方式需要核对，不能排除变体或锥管牙。当前实物泵口内外牙、牙型、位置和密封座均未量取。B40软管OD Ø'+
   vacuumFit.pumpEnd.hoseOdMm+' / ID Ø'+vacuumFit.pumpEnd.hoseIdMm+
   ' mm，必须另配与实际软管外径匹配的G1/4转接件；不能把G1/4螺纹直径当作软管倒刺直径。转接件型号和密封方式未确认。</p></div>':'';

 const suctionHtml=suction?'<div class="field" id="suction-dimensions" '+
   'data-candidate="true"><b>吸气口 / 软管直径（mm，候选尺寸）</b><p>'+
   esc(suction.name)+'：'+esc(suction.nominal)+
   (suction.threadCandidate?'；泵端螺纹参考 '+esc(suction.threadCandidate):'')+
   '。以上尺寸来自当前三维候选模型，非实物量取；实际装配需测量内径、螺纹和密封件。</p></div>':'';
 const axis=AXES[part.id];
 const axisHtml=axis?'<div class="field"><b>独立运动轴与驱动</b><p>线性轴 '+axis.linear+
   '，线性测微头 '+axis.micrometers+'；厂商轴 '+esc(axis.makerAxes.join('/'))+
   '，三维场景轴 '+esc(axis.sceneAxes.join('/'))+'。'+
   (part.id==='B09'?'NFP 无第二根平移测微头；B08 是独立旋转轴。':'')+'</p></div>':'';

 const aRigAudit=(platform==='A'&&['A17','A15','A03','A04L','A04','A05','A07'].includes(part.id))?
    auditPlatformAAssembly():null;
 const aRigHtml=aRigAudit?'<div class="field" id="platform-a-unregistered-assembly" '+
   'data-accepted="false" data-gap-mm="'+aRigAudit.optimisticResidualHorizontalGapMm+'">'+
   '<b>平台A尚未完成全局装配配准（V48）</b><p>照片17/18样品台顶距面包板约87–93mm（模型89.2mm），但A05薄L片末端距A07样品台的场景X缺口仍是未校准的代理值；'+
   '即使将两侧X候选行程全部用于相向移动，仍有约 '+
   aRigAudit.optimisticResidualHorizontalGapMm+
    ' mm水平缺口；即便做未经实物支持的方向翻转，仍缺约 '+
   aRigAudit.mirroredOrientationResidualGapMm+
   ' mm。旧静态下限的折弯片下端比热台顶面低约 '+
   aRigAudit.verticalBracketBelowHeaterTopMm+
   ' mm。A05未识别玻片夹、A17磁座型号和真实整机相对位置均待核实。'+
   '这是当前错误代理坐标的诊断，不是实物间距；严禁据此拉长悬臂或宣称平台A可转移。</p></div>':'';
 const interfaceHtml=reviews.length?reviews.map(item=>'<p><b>'+esc(item.id)+' · 待核验</b> '+esc(item.known)+'<span class="marked-note">尚需确认：'+esc(item.missing.join('、'))+'</span></p>').join(''):'<p>当前未建立该部件的独立接口验收记录；外观与报价不代表装配验收。</p>'; 
 el.innerHTML='<span class="status '+part.level+'">'+part.level+' · '+esc(levelMeaning[part.level])+'</span>'+
 '<h2>'+esc(part.name)+'</h2><p class="meta">'+esc(part.maker)+' · '+esc(part.model)+'</p>'+
 '<div class="field"><b>编号 / 分组</b>'+esc(part.id)+' · '+esc(groups[part.group].name)+'</div>'+
 '<div class="field"><b>外形/尺寸/孔位（mm）</b><p>'+esc(part.dims)+'</p></div>'+
 '<div class="field"><b>几何及功能</b><p>'+esc(part.detail)+'</p></div>'+
 '<div class="field"><b>连接接口与制造限制</b><p>'+esc(part.interfaceNote)+'</p></div>'+
 '<div class="field" id="interface-review-panel"><b>物理装配接口验收</b>'+interfaceHtml+'</div>'+
 hardwareHtml+installHtml+suctionHtml+vacuumFitHtml+axisHtml+holderQAHtml+b35FastenerHtml+aRigHtml+photo94QAHtml+photo95QAHtml+
 '<div class="field"><b>照片证据编号</b>'+esc(part.evidence)+'</div>'+
 '<div class="field"><b>报价状态</b>'+esc(part.price)+'</div>'+
 '<div class="field"><b>工程状态</b><span class="marked-note">当前为照片与厂家规格约束下的三维工程复原；图中测量框为几何显示包络，不等于厂家公差检验结果。</span></div>'+
 '<div class="field"><b>原厂资料 / 采购链接</b><div id="selected-source-links" class="footlinks"></div></div>';
 const ex=enriched(platform,part);
 const refs=[
    ['原厂尺寸图',ex.drawing],['原厂 CAD',ex.cad],['型号规格',ex.datasheet],
    ['报价页面',ex.quote?.source]
 ];
 const linkBox=$('selected-source-links');
 for(const [name,url] of refs){if(!url?.startsWith('https://'))continue;
    const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=name;linkBox.append(a);}

}
function selectPart(id){
 if(active&&active.g)active.g.traverse(o=>{
   if(o.isMesh&&o.userData.originalMat){
      o.material=o.userData.originalMat;
      delete o.userData.originalMat;
   }
 });
 const v=id?parts.get(id):null;
 active=v||null;
 $('restore-cad').disabled=!Boolean(v?.g?.userData.vendorImport);
 if(!v){
   updateDetail(null);selectedLabels();clearMeasurement();
   $('hover-help').textContent='点击零件查看尺寸、来源和供应商；点击空白取消';
   return;
 }
 v.g.traverse(o=>{
   if(!o.isMesh||o.userData.originalMat)return;
   const m=o.material;
   if(m&&(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial)&&!m.transparent){
      o.userData.originalMat=m;
      const highlight=m.clone();highlight.emissive=new THREE.Color('#222d36');highlight.emissiveIntensity=.10;
      o.material=highlight;
   }
 });
 updateDetail(v.part);
 $('hover-help').textContent=v.part.id+' · '+contextualPart(v.part).name;
 selectedLabels();updateMeasurement();
}
function updateTransforms(){
 const e=explosion/100,angle=sampleAngle*Math.PI/180;
 const motionAudit=platform==='B'&&!bPhoto94Mode?
   auditBLoweringPose({filmShiftX:filmShift,sampleShiftX:sampleShift,
     sampleAngleDeg:sampleAngle,filmVerticalDropMm:filmDrop,filmDepthShiftMm:filmShiftDepth}):null;
 if(motionAudit?.possibleClash&&filmDrop>0){
   filmDrop=0;
   if($('film-drop'))$('film-drop').value='0';
   if($('film-drop-value'))$('film-drop-value').textContent='0.0 mm';
 }
 if($('lowering-clearance')){
   $('lowering-clearance').textContent=motionAudit?
     '夹具与热台X向保守间隙：'+motionAudit.planarGapMm.toFixed(1)+' mm'+
       (motionAudit.possibleClash?'；当前平移/旋转姿态下禁用下降':'；下降检查允许接触印章'):
     '平台 A · VC13M从候选抬升13mm位置向下运动至旧静态下限；A04L/A04/A05共同随动，玻片夹/整机位置未确认，禁止将其视为实物零位或安全接触';
 }
 parts.forEach(({g,base,part,explode,moveFilm,moveFilmVertical,translateSample,rotateSample,facingYaw=0})=>{
  const off=explode||[0,0,0],fx=moveFilm?filmShift:0,fz=moveFilm?filmShiftDepth:0,sx=translateSample?sampleShift:0;
  // Translation in a rotating stage's LOCAL X basis, then rotation about Y.
  const travel=rotateSample?stageLocalTranslation(sx,angle):{x:sx,z:0};
  const dx=travel.x,dz=travel.z;
  // Platform A default pose is a CANDIDATE 13mm-Raised VC13M output.
  // Downward preview approaches the original static STEP lower-limit
  // without forcing the output plate through the stationary upright.
  const aLift=platform==='A'?13:0;
  g.position.set(base.x+off[0]*e+fx+dx,
    base.y+off[1]*e+(moveFilmVertical?aLift-filmDrop:0),
    base.z+off[2]*e+dz+fz);
  g.rotation.y=(rotateSample?angle:0)+facingYaw;
  if(g.userData.verticalCarriage)
    g.userData.verticalCarriage.position.y=
      (platform==='A'&&part.id==='A03'?aLift:0)-filmDrop;
  if(g.userData.slidingX){
    // A physical X carriage carries a SECOND, nested depth carriage.
    // B03 has a yaw-180 installation; local negative X maps to world +X.
    g.userData.slidingX.position.x=part.id==='B03'&&!bPhoto94Mode?-filmShift:filmShift;
    if(g.userData.slidingDepth)g.userData.slidingDepth.position.z=part.id==='B03'&&!bPhoto94Mode?-filmShiftDepth:filmShiftDepth;
  }else if(g.userData.slidingTop){
    g.userData.slidingTop.position.x=part.id==='B09'?-sampleShift:part.id==='A02'?sampleShift:0;
  }
 
 });
 if(platform==='B'){refreshHeatingControlHarness();refreshVacuumHoseB();}
 if(active)updateMeasurement();
}
function resetScene(){
 // Each platform has its own independent BOM; prevent previous queries from hiding rows.
 if($('bom-query'))$('bom-query').value='';
 if($('priced-only'))$('priced-only').checked=false;
 active=null;clearMeasurement();
 $('hover-help').textContent='点击零件显示唯一标签及尺寸；点空白取消';
 $('axis-confidence-note').textContent=platform==='B'?
  'B：NFP-1462C 只有一个线性X轴，B03双轴T25M对应场景X/Z；照片149确认PHUC-1的33mm孔中心距，照片150确认GCM-1302M；其余接杆长度和安装螺纹为候选。':
  'A：照片94可见两层约20mm机构，上层G40M60L型号已识别，下层A04L型号未知。以G40的40mm比例估算A05上横板长约75mm、左伸48mm；照片95底座厚约18–19mm。原图94/95无直尺，145–151尺子原图仍在不可解包ZIP中，全局配准待验。';
 // CSS2DRenderer retains node references unless explicitly detached on platform switch.
 for(const oldLabel of labels){if(oldLabel.element?.isConnected)oldLabel.element.remove();}
 parts.clear();hitMeshes.length=0;holes.length=0;labels.length=0;axisObjects.length=0;
 $('restore-cad').disabled=true;
 $('sample-move').disabled=false;
 $('rotate-sample').disabled=false;
 $('btn-sample-stack').disabled=false;
 $('cad-motion-note').hidden=true;
 $('import-status').textContent='选中零件后可导入本地 STL / GLB；导入仅验证外观，接口仍需核实。';
 scene.remove(currentRoot);currentRoot=new THREE.Group();scene.add(currentRoot);
 makeBoard();
 if(platform==='B'){
   filmB();
   // Preserve all known subassemblies in the FULL B viewer regardless
   // of the chosen film-arm photo variant. Their relative placement
   // remains a candidate until the cross-branch photos are registered.
   rotaryB();
   microscopeB();
   externalB();
   heatingControlHarnessB();
   vacuumSupplyB();
   // Fail fast if a scene revision silently deletes a whole subsystem.
   const required=['B01','B35','B03','B07','B08','B09','B10','B11','B12',
     'B13','B14','B15','B16','B17','B18','B19','B20','B21','B22','B23','B36','B37','B38','B39','B40'];
   if(bPhoto94Mode)required.push('B29','B30','B31','B32');
   else required.push('B02','B04','B05','B06','B24','B25','B26','B27','B28','B33','B34');
   const missing=required.filter(id=>!parts.has(id));
   if(missing.length)throw new Error('Model B missing required scene components: '+missing.join(', '));
 }
 else {
   platformA();
   for(const id of ['A01','A17','A15','A03','A04L','A04','A05','A16','A06','A02','A07','A10']){
     if(!parts.has(id))throw Error('Model A missing: '+id);
   }
 }
 addAxis();axisObjects.forEach(a=>a.visible=showAxes);
 // Add detailed photo-informed finish, engraved markings, micrometer scales,
 // and a realistic multi-objective imaging head. All remain proxy geometries.
 enrichParts(parts,platform,mesh=>{
   let p=mesh.parent;
   while(p&&!p.userData.partId)p=p.parent;
   if(p?.userData.partId){mesh.userData.partId=p.userData.partId;hitMeshes.push(mesh)}
 });
 holes.forEach(h=>h.visible=showHoles);selectedLabels();
 populateGroups();renderPhotoLedger();updateDetail(null);updateTransforms();
 $('platform-caption').textContent=platform==='B'?(bPhoto94Mode?
   '平台 B · 全系统布局已恢复 / 玻片夹接口待验证':
   '平台 B · V51 / MB2530/M孔系候选 / B16脚座四孔配准 / MXFMS显微镜 / PHUC-1夹具 / B40后侧管路 / 145–151实拍'):
   '平台 A · V52 / A17磁座型号与孔系未知 / A05夹具待核 / 全局未配准';
 $('stack-note').textContent=platform==='B'?
  bPhoto94Mode?'94/95/97属于平台A，不用于B物理总装。':'平台B的B35按Thorlabs MB2530/M孔系候选重建：10×12共120个M6贯通孔，25mm节距、首孔距边12.5mm，四角沉孔距边25mm。板中心X=75mm后，四角安装孔(-25/175, ±125)落在B01候选25mm网格；B16脚座中心87.5/-112.5mm，四个50mm方形Ø6.5孔与B35网格零误差配准。厚度仍按照片拟合12mm，官方MB2530/M为12.7mm，精确SKU未确认；B01螺纹与承载连接仍待实测。B02→B03双轴台→B04 V25M→B05薄板→B34 50mm黑套筒候选→B27 100mm竖杆候选→B33方夹→B25首根横杆→B24 PHUC-1→B28第二横杆→B06 GCM-1302M夹具。B40从B36左侧绕至机箱后方（B19温控器背侧），再绕右侧连接VN-50；后侧管路降至70mm服务高度，与B37加热双线、B38测温线保持分层。杆长、孔位及VN-50泵端接口尚待验收。':
  '照片94/95/97: A膜侧 A15 T25M→A03 VC13M→A04L下层独立摆角台→A04上层G40M60L→A05折弯片。新实拍17–24: A样品侧GCM-5306M非旋转底座→A06Ø66候选旋转台（右侧角度调节）→A02 T25M（左侧银色直线测微头）→A07三层样品台；A17型号/孔系仍未知，B照片29–31的PHUC-1及GCM-420302M铭牌不属于A。';
 focus('iso');
 updateTable();
}
function focus(mode){
 const sampleX=platform==='B'?CONFIG.B.sampleX:CONFIG.A.sampleX;
 // Photo119 confirms a substantial cabinet at the right of the
 // optical rig. The B system now spans X=-215..508, Z=-263..220.
 // Full-system camera must show the cabinet as well as film/sample
 // rather than hiding most accessories outside the viewport.
 const fullB=platform==='B'&&(mode==='iso'||mode==='home');
 const rearB=platform==='B'&&mode==='rear';
 const target=mode==='optical'?new THREE.Vector3(sampleX-20,125,0):
   rearB?new THREE.Vector3(365,105,-155):
   fullB?new THREE.Vector3(115,135,-30):
   new THREE.Vector3(platform==='B'?-15:0,128,0);
 const dst=mode==='optical'?new THREE.Vector3(sampleX-20,460,0.01):
   mode==='top'?new THREE.Vector3(0,780,0.01):
   mode==='front'?new THREE.Vector3(0,185,760):
   rearB?new THREE.Vector3(700,270,-620):
   mode==='rear'?new THREE.Vector3(295,250,-380):
   mode==='iso'?(fullB?new THREE.Vector3(725,480,835):new THREE.Vector3(350,300,440)):
   fullB?new THREE.Vector3(805,515,965):new THREE.Vector3(425,365,505);
 camera.position.copy(dst);orbit.target.copy(target);camera.lookAt(target);orbit.update();
}

function buildLink(name,url){
 if(!url?.startsWith('https://'))return document.createTextNode('—');
 const a=document.createElement('a');a.href=url;a.target='_blank';
 a.rel='noopener noreferrer';a.textContent=name;return a;
}
function summaryBOM(rows){
 const dst=$('bom-summary');dst.replaceChildren();
 const sum=pricedSummary(rows);
 const card=(number,desc)=>{
   const b=document.createElement('div');b.className='bom-stat';
   const strong=document.createElement('strong');strong.textContent=number;
   const sm=document.createElement('span');sm.textContent=desc;b.append(strong,sm);dst.append(b);
 };
 card(String(rows.length),'当前平台零件类别 / 行数');
 card(String(sum.priced),'有公开参考价格');
 card(String(sum.unpriced),'待询价零件行数');
 for(const c of sum.currencies)card(c.currency+' '+c.amount.toFixed(2),'有价零件已知小计 · '+c.rows+' 行');
 const n=document.createElement('div');n.className='bom-note';
 n.textContent='没有不同币种混加；各小计仅覆盖已有公开报价，不代表整机总报价。历史参考价与新版现价混用时尤其需要重新询价。';
 dst.append(n);
}
function sortedBOM(rows){
 const sort=$('bom-sort').value;
 const list=[...rows];
 if(sort==='price-asc'||sort==='price-desc'){
   list.sort((a,b)=>{
      const ac=a.quote?.currency||'~',bc=b.quote?.currency||'~';
      if(ac!==bc)return ac.localeCompare(bc);
      const av=a.quote?.value,bv=b.quote?.value;
      if(av==null)return 1;if(bv==null)return -1;
      return sort==='price-desc'?bv-av:av-bv;
   });
 }else list.sort((a,b)=>String(a[sort]||'').localeCompare(String(b[sort]||''),'zh-CN',{numeric:true}));
 return list;
}
function visibleBOM(){
 const q=$('bom-query').value.trim().toLowerCase();
 const priceOnly=$('priced-only').checked;
 return sortedBOM(activeParts().map(p=>enriched(platform,p)).filter(p=>
    (!priceOnly||Boolean(p.quote?.value))&&
    (!q||[p.id,p.name,p.model,p.maker,p.category,p.note,
          ...(p.alternatives||[]).flatMap(a=>a.slice(0,2))]
     .join(' ').toLowerCase().includes(q))
 ));
}
function updateTable(){
 const tbody=$('bom-body');tbody.replaceChildren();
 const visible=visibleBOM();
 for(const part of visible){
  const tr=document.createElement('tr');tr.style.cursor='pointer';
  function cell(text='',cls=''){
    const td=document.createElement('td');td.textContent=text;td.className=cls;tr.append(td);return td;
  }
  cell(part.id);cell(groups[part.group].name);
  cell(part.name+'\n'+(part.category||''));cell(part.maker+' / '+part.model);
  cell(String(part.qty||1)+' '+(part.unit||'件'));cell(part.dims);
  const b=cell();const badge=document.createElement('span');
  badge.className='status '+part.level;badge.textContent=part.level;b.append(badge);
  const materialCell=cell(part.material||'未定');
  for(const alt of part.alternatives||[]){
    const sp=document.createElement('span');sp.className='bom-alt';
    sp.append('候选：',buildLink(alt[0],alt[2]),' · '+alt[1]);
    materialCell.append(sp);
  }
  const q=part.quote;
  cell(q?q.currency+' '+q.value.toFixed(2):'待询价','bom-price');
  cell(q?q.currency+' '+(q.value*(part.qty||1)).toFixed(2):'—','bom-price');
  const priceCell=cell(q?(q.type||'公开参考价')+'\n'+q.date:'—');
  if(q?.source)priceCell.append(' · ',buildLink('价格来源',q.source));
  const drawing=cell();
  drawing.append(buildLink('原厂图纸',part.drawing));
  if(part.cad)drawing.append(' · ',buildLink('CAD',part.cad));
  if(part.datasheet)drawing.append(' · ',buildLink('产品页',part.datasheet));
  cell(part.evidence||'未指定');
  tr.onclick=(ev)=>{
    if(ev.target.closest('a'))return;
    selectPart(part.id);$('bom-drawer').classList.remove('open');
  };
  tbody.append(tr);
 }
 summaryBOM(activeParts().map(x=>enriched(platform,x)));
 $('bom-heading').textContent='平台 '+platform+' · 原厂 BOM / 替代厂家 / 采购价格和总额';
}
function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function exportCSV(){
 const matrix=csvExportRows(activeParts().map(p=>enriched(platform,p)));
 const body='\\ufeff'+matrix.map(row=>row.map(csvEscape).join(',')).join('\\r\\n');
 const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='Transfer_Station_'+platform+'_Procurement_BOM.csv';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
renderer.domElement.addEventListener('pointerdown',ev=>{
 pointerDown={x:ev.clientX,y:ev.clientY};
});
renderer.domElement.addEventListener('pointerup',ev=>{
 if(!pointerDown||Math.hypot(ev.clientX-pointerDown.x,ev.clientY-pointerDown.y)>6)return;
 const bounds=renderer.domElement.getBoundingClientRect();pointer.set(((ev.clientX-bounds.left)/bounds.width)*2-1,-((ev.clientY-bounds.top)/bounds.height)*2+1);
 raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(hitMeshes.filter(x=>x.visible&&x.parent?.visible),false);
 let found=false;
 for(const hit of hits){let cur=hit.object;while(cur&&!cur.userData.partId)cur=cur.parent;
   if(cur?.userData.partId){selectPart(cur.userData.partId);found=true;break;}}
 if(!found)selectPart(null);
});
function updatePhotoScope(){
 const node=$('photo-scope-note');
 $('b-photo-profile').hidden=platform!=='B';
 $('btn-b-user-photos').classList.toggle('on',platform==='B');
 $('btn-b-archive').classList.remove('on');
 $('b-profile-note').textContent='照片149：B34黑色套筒、B27长立杆、B33方夹及PHUC-1双横杆。照片108/150：下杆直入GCM-1302M侧边，取消虚构B26大转接座。50mm套筒、100mm立杆和玻片高度仍为候选；PHUC孔距33mm、GCM夹具型号由原厂/铭牌支持。';
 const aCritical=$('a-physical-audit');
 aCritical.hidden=platform!=='A';
 if(platform==='A'){
   const aStatus=auditPlatformAAssembly();
   aCritical.textContent='平台A整体装配未通过：A05末端与A07候选样品台在最乐观X行程下仍有约 '+
     aStatus.optimisticResidualHorizontalGapMm+
     ' mm水平缺口；单纯镜像翻转后仍缺约 '+
     aStatus.mirroredOrientationResidualGapMm+
     ' mm。A05夹具、A17磁座、安装基准未验证。VC13M运动仅供演示，不能确认安全接触。';
 }
 const critical=$('b-physical-audit');
 critical.hidden=platform!=='B';
 if(platform==='B')critical.textContent='V30已消除B05与V25M固定机架此前6048mm³的几何穿透：活动导轨通过独立侧向支承桥接B05。B26巨大转接块删除，只剩可能的M6端面连接。真实螺钉孔距、移动全行程及玻片工作距离仍未认证，禁止加工。';
 node.dataset.refRig=platform==='A'?'A-94-95-97-137-144-152-155-161':'B-107-112-145-151';
 node.textContent=platform==='A'?
  '平台 A：94/95/97、137–144、152、155、161。新增照片137/161的 GCM-5306M 是 112×70×8 mm 安装底座，不是旋转台。':
  '平台 B：照片145/150确认B35黑色Thorlabs板覆盖旋转台及显微镜底座（250×300×12mm为候选），149确认PHUC-1，150确认GCM-1302M；照片114/117/119确认宇电面板B19与SE-600-48、黑色辅助模块同装在金属控制箱B36内。控制箱尺寸和线束仍待测。';
 $('btn-photo947').textContent='查看平台 A 的 94/95/97 实物构型';
}
function focusPhoto947(photo='94'){
 // 94/95/97 belong to platform A; the November ruler images
 // 145–151 and 108–112 jointly establish the distinct platform B.
 if(platform!=='A')switchPlatform('A');
 const isB=false;
 const x=isB?CONFIG.B.armX:CONFIG.A.armX;
 // Photos94/95/97 identify one mechanical film-side arm. In the new B
 // comparison this maps to B29/B03/B30/B31/B32; archival A uses A15/A03/A04/A05.
 // This camera choice alone does NOT verify attachment to B's sample branch.
 const dy=isB?20:0;
 const y=(photo==='94'?133:photo==='95'?48:80)+dy;
 const src=photo==='94'?new THREE.Vector3(x+30,y+43,218):
   photo==='95'?new THREE.Vector3(x+48,y+40,190):
   new THREE.Vector3(x+24,y+32,200);
 const target=new THREE.Vector3(x,y,0);
 camera.position.copy(src);orbit.target.copy(target);camera.lookAt(target);orbit.update();
}

function switchPlatform(next){
  clearCadFeatureCandidates();
  platform=next;
  explosion=0;filmShift=0;filmShiftDepth=0;filmDrop=0;sampleShift=0;sampleAngle=0;
  for(const [id,value] of [['explode','0'],['translate','0'],['translate-depth','0'],['sample-move','0'],['rotate-sample','0']])$(id).value=value;
  $('explode-value').textContent='0%';$('translate-value').textContent='0 mm';$('translate-depth-value').textContent='0 mm';
  $('sample-value').textContent='0 mm';$('rotate-value').textContent='0°';
  $('show-b').classList.toggle('on',next==='B');
  $('show-a').classList.toggle('on',next==='A');
  $('film-drop-label').textContent=next==='A'?
    '玻片竖直下降 · VC13M（13mm候选）':
    '玻片竖直下降 · V25M（13mm接触预览）';
  $('sample-move-label').textContent=next==='A'?
    '样品侧 T25M · X平移（轴型/行程待核）':
    '样品 NFP-1462C · 单轴 X平移';
  $('film-drop').min='-13';
  $('film-drop').max='0';
  $('film-drop').value='0';
  $('film-drop-value').textContent='0.0 mm';
  // Both A and B have photo-confirmed film-side T25M. Actual travel use remains candidate.
  $('translate').disabled=false;
  $('translate').title=next==='A'?'A15: 照片95/97证明存在载玻片侧 T25M':'B03: 照片108/109证明存在磁座上T25M';
  resetScene();updatePhotoScope();
}
$('show-b').onclick=()=>switchPlatform('B');
$('show-a').onclick=()=>switchPlatform('A');
$('btn-b-user-photos').onclick=()=>{bPhoto94Mode=false;switchPlatform('B');};
$('btn-b-archive').onclick=()=>{bPhoto94Mode=false;switchPlatform('A');};
$('btn-photo947').onclick=()=>focusPhoto947('94');
$('btn-photo94').onclick=()=>focusPhoto947('94');
$('btn-photo95').onclick=()=>focusPhoto947('95');
$('btn-photo97').onclick=()=>focusPhoto947('97');
function focusMechanicalBranch(which){
 const x=which==='film'?(platform==='B'?CONFIG.B.armX:CONFIG.A.armX):(platform==='B'?CONFIG.B.sampleX:CONFIG.A.sampleX);
 const fittedBFilm=which==='film'&&platform==='B';
 // Previous camera at y=85, distance~300mm CHOPPED OFF photo149's
 // B27 exposed top (world Y>205). Back camera up and target its
 // whole 0–215mm physical stack, not just the T25M at the bottom.
 const y=fittedBFilm?125:(which==='film'?85:79);
 const t=new THREE.Vector3(x,y,0);
 const handSide=which==='film'&&platform==='B'?-1:1;
 const horizontal=fittedBFilm?210:155;
 const above=fittedBFilm?135:100;
 const depth=fittedBFilm?325:235;
 camera.position.set(x+handSide*horizontal,y+above,depth);
 orbit.target.copy(t);camera.lookAt(t);orbit.update();
}
$('btn-film-stack').onclick=()=>focusMechanicalBranch('film');
function focusBFilmHolder(){
 if(platform!=='B')switchPlatform('B');
 const target=bPhoto94Mode?new THREE.Vector3(CONFIG.B.armX,134,0):new THREE.Vector3(-25,147,0);
 camera.position.set(bPhoto94Mode?CONFIG.B.armX+58:-72,bPhoto94Mode?187:196,192);
 orbit.target.copy(target);
 camera.lookAt(target);orbit.update();
}
$('btn-film-holder').onclick=focusBFilmHolder;

// Compare the same stage from opposing sides without changing any part geometry.
function focusBPhoto(photo){
 if(platform!=='B'||bPhoto94Mode){bPhoto94Mode=false;switchPlatform('B');}
 const x=CONFIG.B.armX, y=85, magnetView=photo==='108';
 camera.position.set(x+(magnetView?-90:90),y+60,magnetView?245:-245);
 orbit.target.set(x,y,0);camera.lookAt(orbit.target);orbit.update();
}
$('btn-photo108').onclick=()=>focusBPhoto('108');
$('btn-photo109').onclick=()=>focusBPhoto('109');
$('btn-sample-stack').onclick=()=>focusMechanicalBranch('sample');
 $('btn-control-cabinet').onclick=()=>{
   // The controller has a front YUDIAN panel and open-top internal
   // SE-600-48/B23 modules. A dedicated raised viewpoint exposes
   // both surfaces instead of treating the box as an opaque block.
   if(platform!=='B')switchPlatform('B');
   const target=new THREE.Vector3(365,65,-150);
   camera.position.set(590,470,130);
   orbit.target.copy(target);camera.lookAt(target);orbit.update();
 };
$('btn-home').onclick=()=>focus('home');$('btn-top').onclick=()=>focus('top');$('btn-optical').onclick=()=>focus('optical');$('btn-front').onclick=()=>focus('front');$('btn-rear').onclick=()=>focus('rear');$('btn-iso').onclick=()=>focus('iso');
$('explode').oninput=e=>{explosion=Number(e.target.value);$('explode-value').textContent=explosion+'%';updateTransforms()};
$('translate').oninput=e=>{filmShift=Number(e.target.value);$('translate-value').textContent=filmShift.toFixed(1)+' mm';updateTransforms()};
$('translate-depth').oninput=e=>{filmShiftDepth=Number(e.target.value);$('translate-depth-value').textContent=filmShiftDepth.toFixed(1)+' mm';updateTransforms()};
$('film-drop').oninput=e=>{filmDrop=Math.max(0,-Number(e.target.value));
 $('film-drop-value').textContent=(-filmDrop).toFixed(1)+' mm';updateTransforms()};
$('sample-move').oninput=e=>{sampleShift=Number(e.target.value);$('sample-value').textContent=sampleShift.toFixed(1)+' mm';updateTransforms()};
$('rotate-sample').oninput=e=>{sampleAngle=Number(e.target.value);$('rotate-value').textContent=sampleAngle+'°';updateTransforms()};
function proxyReplaced(o){
 let p=o.parent;
 while(p){if(p.userData.vendorImport)return true;p=p.parent;}
 return false;
}
$('toggle-holes').onclick=e=>{
 showHoles=!showHoles;e.currentTarget.classList.toggle('on',showHoles);
 holes.forEach(h=>h.visible=showHoles&&!proxyReplaced(h));
};
$('toggle-labels').onclick=e=>{showLabels=!showLabels;e.currentTarget.classList.toggle('on',showLabels);selectedLabels()};
$('toggle-dim').onclick=e=>{showDimensions=!showDimensions;e.currentTarget.classList.toggle('on',showDimensions);updateMeasurement()};
$('toggle-axes').onclick=e=>{showAxes=!showAxes;e.currentTarget.classList.toggle('on',showAxes);axisObjects.forEach(a=>a.visible=showAxes)};
$('toggle-wire').onclick=e=>{wireframe=!wireframe;e.currentTarget.classList.toggle('on',wireframe);parts.forEach(v=>v.g.traverse(o=>{if(o.isMesh&&o.material?.wireframe!==undefined)o.material.wireframe=wireframe}))};
$('search').oninput=e=>{
 const v=e.target.value.trim().toLowerCase();if(!v)return;
 const first=PARTS[platform].find(p=>[p.id,p.name,p.model,p.maker].some(s=>s.toLowerCase().includes(v)));
 if(first)selectPart(first.id);
};
$('open-bom').onclick=()=>$('bom-drawer').classList.add('open');
$('close-bom').onclick=()=>$('bom-drawer').classList.remove('open');
$('bom-drawer').onclick=e=>{if(e.target===$('bom-drawer'))$('bom-drawer').classList.remove('open')};
function syncVendorMotionLock(){
 const locked=platform==='B'&&Boolean(parts.get('B09')?.g.userData.vendorImport);
 $('cad-motion-note').hidden=!locked;
 $('sample-move').disabled=locked;
 if(locked){
   sampleShift=0;$('sample-move').value='0';$('sample-value').textContent='0 mm';
   // The entire OEM shell is a static mesh, not a movable carriage assembly.
   updateTransforms();
 }
}
function removeVendorMesh(v){
 const imported=v.g.userData.vendorImport;
 if(!imported)return false;
 const importedMeshes=new Set();
 const geometries=new Set(),materials=new Set();
 imported.traverse(o=>{
   if(!o.isMesh)return;
   importedMeshes.add(o);
   if(o.geometry)geometries.add(o.geometry);
   for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
     if(mat)materials.add(mat);
   }
 });
 for(let i=hitMeshes.length-1;i>=0;i--){
   if(importedMeshes.has(hitMeshes[i]))hitMeshes.splice(i,1);
 }
 v.g.remove(imported);
 geometries.forEach(geo=>geo.dispose());
 materials.forEach(mat=>mat.dispose());
 for(const [mesh,visible] of v.g.userData.proxyVisibility||[]){
   mesh.visible=holes.includes(mesh)?showHoles:visible;
 }
 delete v.g.userData.proxyVisibility;
 delete v.g.userData.vendorImport;
 delete v.g.userData.vendorImportBase;
 delete v.g.userData.vendorLandmarkRegistration;
 clearCadFeatureCandidates();
 if($('cad-registration-status'))$('cad-registration-status').textContent='已恢复候选几何；此前特征点配准不再应用。';
 syncVendorMotionLock();
 return true;
}
async function importVendorMesh(file){
 if(!active){$('import-status').textContent='请先在3D场景中点击要替换的零件。';return;}
 if(!file){return;}
 const part=active;
 const name=file.name.toLowerCase();
 if(!(name.endsWith('.stl')||name.endsWith('.glb'))){
   $('import-status').textContent='仅支持 STL / GLB，STEP 需先用 FreeCAD/CadQuery 转换。';return;
 }
 try{
   const raw=await file.arrayBuffer();
   let imported;
   if(name.endsWith('.stl')){
      const geometry=new STLLoader().parse(raw);
      const mat=new THREE.MeshStandardMaterial({color:0xb1becb,metalness:.68,roughness:.35,side:THREE.DoubleSide});
      imported=new THREE.Mesh(geometry,mat);
   }else{
      const gltf=await new Promise((resolve,reject)=>
        new GLTFLoader().parse(raw,'',resolve,reject));
      imported=gltf.scene;
   }
   const sizeScale=Number($('import-units').value||1);
   if(!Number.isFinite(sizeScale)||sizeScale<=0)throw Error('导入单位比例必须为有限正数');
   imported.scale.setScalar(sizeScale);
   imported.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(imported);
   if(bounds.isEmpty()||![bounds.min.x,bounds.max.x,bounds.min.y,bounds.max.y,bounds.min.z,bounds.max.z].every(Number.isFinite))throw Error('无法获取导入模型的有效边界');
   const w=bounds.max.x-bounds.min.x,h=bounds.max.y-bounds.min.y,d=bounds.max.z-bounds.min.z;
   if(Math.max(w,h,d)>2000||Math.min(w,h,d)<=0)throw Error('模型单位或方向不正确，请检查 STL/GLB 比例');
   const center=bounds.getCenter(new THREE.Vector3());
   const profile=$('cad-profile').value;
   let calibrationX=0;
   if(profile==='nfp1462c'){
     if(part.part.id!=='B09')throw Error('NFP 原厂预设仅适用于 B09');
     // Original Zolix shell STEP has [27.6,77.5,167.5] native bbox.
     // The CLI converter --preset nfp1462c permutes XYZ into [167.5,27.6,77.5].
     if(Math.abs(w-167.5)>10 || Math.abs(h-27.6)>5 || Math.abs(d-77.5)>7){
       throw Error('NFP 轴向不匹配。请先使用 --preset nfp1462c 转换官方 STEP；导入网格的外廓应约 167.5×27.6×77.5 mm。');
     }
     // OEM full envelope contains a long micrometer. Bounding-box center
     // is NOT the 65mm carriage center; register to maker body-end datum.
     // Stage body assumed at the short (+X) end: candidate, verify holes.
     calibrationX=-(w-65)/2;
   }
   // A file read / GLB parse may finish after selection or platform changed.
   // Never attach OEM geometry to an obsolete or unselected assembly.
   if(active!==part||parts.get(part.part.id)!==part)
     throw Error('读取期间已切换零件或平台，本次导入已取消');
   imported.position.set(-center.x+calibrationX,-bounds.min.y,-center.z);
   if(part.g.userData.vendorImport)removeVendorMesh(part);
   const proxyVisibility=new Map();
   part.g.traverse(ob=>{
     if(ob.isMesh&&!ob.userData.vendorModel){
       proxyVisibility.set(ob,ob.visible);
       ob.visible=false;
     }
   });
   part.g.userData.proxyVisibility=proxyVisibility;
   part.g.userData.vendorImportBase=imported.position.clone();
   part.g.add(imported);
   part.g.userData.vendorImport=imported;
   imported.traverse(ob=>{
     if(ob.isMesh){ob.castShadow=true;ob.receiveShadow=true;ob.userData.vendorModel=true;
      ob.userData.partId=part.part.id;hitMeshes.push(ob);}
   });
   syncVendorMotionLock();
   // Select again so the new visible mesh gets measured, not its hidden proxy.
   selectPart(part.part.id);
   clearCadFeatureCandidates();
   $('cad-registration-status').textContent='尚未按已知特征点配准；外形包络居中只用于粗略显示，不能作为安装基准。';
   $('import-status').textContent=part.part.id+' 导入 '+file.name+' · '+[w,h,d].map(x=>x.toFixed(1)).join('×')+' mm；预设 '+profile+'，尚未通过实际螺纹孔配准。';
 }catch(e){console.error(e);$('import-status').textContent='导入失败：'+String(e?.message||e);}
}
$('import-cad').onclick=()=>{
 if(!active){$('import-status').textContent='请先点击3D中的零件，再导入其厂家模型。';return;}
 $('cad-file').click();
};
$('cad-file').onchange=ev=>{
 const file=ev.target.files?.[0];
 ev.target.value=''; // allow loading the same local file again
 importVendorMesh(file);
};
$('restore-cad').onclick=()=>{
 if(!active||!removeVendorMesh(active))return;
 const id=active.part.id;
 selectPart(id);
 $('import-status').textContent=id+' 已恢复图纸/照片约束下的代理几何；运动与接口仍属工程候选。';
};
$('apply-cad-alignment').onclick=()=>{
 if(!active?.g?.userData.vendorImport){$('import-status').textContent='请先选中B09并导入原厂 STL。';return;}
 const parse=id=>{const x=Number($(id).value);if(!Number.isFinite(x)||Math.abs(x)>500)throw Error(id+' 数值超出可接受范围 ±500');return x;};
 try{
   const g=active.g, m=g.userData.vendorImport;
   const base=g.userData.vendorImportBase;
   if(!base)throw Error('导入模型缺少初始基准');
   m.position.copy(base).add(new THREE.Vector3(parse('cad-offset-x'),parse('cad-offset-y'),parse('cad-offset-z')));
   m.rotation.y=parse('cad-yaw')*Math.PI/180;
   delete g.userData.vendorLandmarkRegistration;
   $('cad-registration-status').textContent='已改用手动包络偏移；之前的特征点配准结果已取消。';
   updateMeasurement();
   $('import-status').textContent='已应用本地显示配准。偏移为相对于预设的增量，不代表孔系已验收。';
 }catch(e){$('import-status').textContent='配准参数错误：'+e.message;}
};
// Private BREP candidate geometry is read in-memory only. No network or
// persistence. A circular edge may be a shaft or cosmetic groove rather than a
// mechanical fastening hole; never infer thread or mounting face from this list.
let localCadFeatureCandidates=[];
function clearCadFeatureCandidates(){
 localCadFeatureCandidates=[];
 const list=$('cad-feature-list');list.replaceChildren();
 const option=document.createElement('option');option.value='';option.textContent='尚未载入特征数据';list.append(option);
 list.disabled=true;$('use-cad-feature').disabled=true;
 $('cad-feature-status').textContent='候选圆心已清空。导入新 CAD 时需要重新选择匹配的私有 JSON。';
}
$('load-cad-features').onclick=()=>{
 if(platform!=='B'||active?.part.id!=='B09'||!active.g.userData.vendorImport){
   $('cad-feature-status').textContent='请先在平台B选中B09并导入与候选圆心对应的NFP STL。';
   return;
 }
 $('cad-features-file').click();
};
$('cad-features-file').onchange=async ev=>{
 const file=ev.target.files?.[0];ev.target.value='';
 if(!file)return;
 try{
   if(!active||platform!=='B'||active.part.id!=='B09'||!active.g.userData.vendorImport)
      throw Error('必须先在平台B选中已导入原厂网格的B09');
   if(file.size>5_000_000)throw Error('候选 JSON 超过5 MB，请检查是否错误选择了CAD网格');
   const target=active,imported=target.g.userData.vendorImport;
   const data=JSON.parse(await file.text());
   if(active!==target||!target.g.userData.vendorImport||target.g.userData.vendorImport!==imported)
      throw Error('读取过程中原厂CAD或选中零件发生变化，已取消');
   if(data?.source?.preset!=='nfp1462c'||!Array.isArray(data?.candidate_features))
      throw Error('不是按nfp1462c原厂轴向生成的特征JSON');
   if(data.candidate_features.length>10000)
      throw Error('特征项过多，无法安全加载');
   const candidates=data.candidate_features.filter(item=>
      item?.horizontal_plane_candidate===true&&item.full_circle_candidate===true&&
      Array.isArray(item.center_mm)&&item.center_mm.length===3&&
      item.center_mm.every(Number.isFinite)&&Number.isFinite(item.radius_mm)&&item.radius_mm>0);
   if(!candidates.length)throw Error('没有法向朝竖直方向的完整候选圆边；不能凭空生成安装孔');
   const limit=Math.min(candidates.length,1200);
   const list=$('cad-feature-list');list.replaceChildren();
   const empty=document.createElement('option');empty.value='';empty.textContent='请选择原厂圆边候选（尚未确认为安装孔）';list.append(empty);
   localCadFeatureCandidates=candidates.slice(0,limit);
   localCadFeatureCandidates.forEach((p,i)=>{
     const opt=document.createElement('option');opt.value=String(i);
     const wallLabel=({closed_solid_bore_wall_candidate:'封闭实体内向孔壁候选',
       closed_solid_external_wall_candidate:'封闭实体外向轴壁候选',
       surface_shell_unresolved:'原厂开放壳体内外未决',
       circle_only_unresolved:'孤立圆边，未找到同轴壁'})[p.geometric_wall_kind]||'仅几何圆边未分型';
     opt.textContent='候选 '+(i+1)+' · Ø'+(2*p.radius_mm).toFixed(3)+
       ' · '+wallLabel+(p.stepped_coaxial_candidate?' · 同轴多级圆径候选':'')+
       ' · 原厂转换坐标 X='+p.center_mm[0].toFixed(3)+
       ', Y='+p.center_mm[1].toFixed(3)+', Z='+p.center_mm[2].toFixed(3);
     list.append(opt);
   });
   list.disabled=false;$('use-cad-feature').disabled=false;
   $('cad-feature-status').textContent='私有CAD候选圆边 '+candidates.length+
      ' 项，显示 '+limit+' 项；尚未认证孔位/面别/螺纹。确认实际同一安装面后才能用于配准。';
 }catch(error){
   clearCadFeatureCandidates();
   $('cad-feature-status').textContent='候选JSON未载入：'+String(error?.message||error);
 }
};
$('use-cad-feature').onclick=()=>{
 const selected=$('cad-feature-list').value;
 const index=Number(selected);
 if(selected===''||!Number.isInteger(index)||!localCadFeatureCandidates[index]){
   $('cad-feature-status').textContent='请先选择一个原厂圆形特征候选';
   return;
 }
 if(platform!=='B'||active?.part.id!=='B09'||!active.g.userData.vendorImport){
   $('cad-feature-status').textContent='原厂CAD已切换，候选点不能应用';
   return;
 }
 const feature=localCadFeatureCandidates[index],slot=$('cad-feature-slot').value;
 $('cad-src-'+slot).value=feature.center_mm[0]+','+feature.center_mm[2];
 $('cad-feature-status').textContent='已将候选圆心 X/Z 填入源点'+slot+
  '；几何类别：'+(feature.geometric_wall_kind||'未分型')+'。请独立确认实际安装面及目标点，不能据此认定螺孔已匹配。';
};

// Feature-point fitting uses coordinates extracted from the converted STL itself
// and the corresponding points in B09 *local* assembly coordinates. Nothing is
// auto-assumed about bolt pitch, hole face, material or thread engagement.
$('fit-cad-landmarks').onclick=()=>{
 try{
   if(platform!=='B'||active?.part.id!=='B09'||!active.g.userData.vendorImport)
     throw Error('请在平台 B 选中 B09，并先导入转换后的 NFP 原厂 STL');
   const pairs=[];
   for(let i=1;i<=3;i++){
     const source=$('cad-src-'+i).value.trim(),target=$('cad-dst-'+i).value.trim();
     if(!source&&!target)continue;
     if(!source||!target)throw Error('第'+i+'对特征点必须同时填写源坐标与目标坐标');
     pairs.push({source:parseXZ(source),target:parseXZ(target)});
   }
   const result=fitRigidXZ(pairs);
   const group=active.g, mesh=group.userData.vendorImport;
   // The points are millimetres AFTER the imported STL's unit scale has been
   // applied. Y remains the initial candidate vertical datum plus manual Y.
   const offsetY=Number($('cad-offset-y').value);
   if(!Number.isFinite(offsetY)||Math.abs(offsetY)>500)throw Error('高度偏移必须为 ±500 mm 内的有限数值');
   const base=group.userData.vendorImportBase;
   if(!base)throw Error('原厂导入基准不存在');
   // Commit only after every input has been validated; failed fit preserves mesh.
   mesh.rotation.y=result.yawRad;
   mesh.position.set(result.translationXmm,base.y+offsetY,result.translationZmm);
   group.userData.vendorLandmarkRegistration=result;
   updateMeasurement();
   $('cad-registration-status').textContent=
      result.pairCount+' 对点刚性配准预览：偏航 '+result.yawDeg.toFixed(3)+'°，局部 X='+
      result.translationXmm.toFixed(3)+' mm / Z='+result.translationZmm.toFixed(3)+
      ' mm，最大坐标残差 '+result.maxErrorMm.toFixed(3)+' mm（仅输入一致性，不是机械公差验收）。高度基准、孔面、螺纹和实物干涉仍待验证。';
   $('import-status').textContent='已应用特征点刚性配准预览；未缩放几何，亦未认证物理安装接口。';
 }catch(error){
   $('cad-registration-status').textContent='配准未应用：'+String(error?.message||error);
 }
};

$('export-csv').onclick=exportCSV;
for(const id of ['bom-query','bom-sort','priced-only']){
 const el=$(id);el.addEventListener(id==='bom-query'?'input':'change',updateTable);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('bom-drawer').classList.remove('open')});
function resize(){
 const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);labelRenderer.setSize(w,h);
}
window.addEventListener('resize',resize);new ResizeObserver(resize).observe(host);
resetScene();updatePhotoScope();resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);labelRenderer.render(scene,camera)});
