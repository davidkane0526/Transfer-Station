import {mountPhotoEvidence,mountPhotoBOMCell,photoEvidenceProbe} from './photo-gallery.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CONFIG,PARTS,SOURCE_LINKS} from './parts.js';
import {enrichParts} from './details.js';
import {enriched,pricedSummary,csvExportRows} from './procurement.js';
import {stageLocalTranslation,stageLocalDepthTranslation} from './kinematics.js';
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
import {auditB35MicroscopeFasteners,auditB08ToB35Mount} from './b35-fastener-audit.js';
import {auditPlatformAAssembly} from './platform-a-assembly-audit.js';
import {A_WORKING_LAYOUT,auditAWorkingLayout} from './a-working-layout.js';
import {aPhotoCameraPose,aPhotoOrientationEvidence} from './a-photo-angle-registration.js';
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
lowerStage:new THREE.MeshStandardMaterial({color:'#7d8d9c',metalness:.77,roughness:.37}),
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
let platform='B', bPhoto94Mode=false, aWorkingPoseMode=false, currentRoot=new THREE.Group(), parts=new Map(), active=null, explosion=0,
    filmShift=0,filmShiftDepth=0,filmDrop=0,sampleShift=0,sampleShiftDepth=0,sampleAngle=0,showHoles=true,showLabels=true,showDimensions=true,wireframe=false,showAxes=false;
// Read-only platform state for automated browser QA.
window.__activePlatformProbe=()=>({platform,photoVariant:bPhoto94Mode?'archive':'current',
 aPose:platform==='A'?(aWorkingPoseMode?'installed180':'photo-reference'):null,partCount:parts.size});
 // Photo-referenced A is the default view, not an unverified mirror.
 window.__platformAPhotoTruthProbe=()=>{
  if(platform!=='A')return {available:false};
  currentRoot.updateWorldMatrix(true,true);
  const vc13=parts.get('A03')?.g;
  const slider=vc13?.userData.verticalCarriage;
  const output=slider?.children.find(x=>x.userData.A03MovingOutputPlate);
  const lowerGoniometer=parts.get('A04L')?.g;
  const upperGoniometer=parts.get('A04')?.g;
  const lSheet=parts.get('A05')?.g.children.find(o=>o.isMesh);
  const a17=parts.get('A17')?.g;
  const a15=parts.get('A15')?.g;
  const a15MountBase=a15?.children.find(o=>o.userData.A15StationaryMountingBase);
  // The Ø18 A15 depth micrometer overhangs OUTSIDE the 65mm magnetic
  // base. Its drum dips below the mounting plane by 3.5mm, but has
  // no physical volume collision with A17. Never use the entire
  // stage AABB to judge the mounting face.
  const magnetBox=a17?new THREE.Box3().setFromObject(a17):null;
  const actuatorMagnetOverlap=magnetBox&&a15?(()=>{
    let collision=0;
    a15.children.filter(o=>o.userData.stageActuatorHandle).forEach(o=>{
      const intersect=magnetBox.clone().intersect(new THREE.Box3().setFromObject(o));
      if(!intersect.isEmpty()){
        const size=new THREE.Vector3();intersect.getSize(size);
        collision+=size.x*size.y*size.z;
      }
    });
    return Number(collision.toFixed(3));
  })():null;
  const round=x=>Number(x.toFixed(3));
  const gap=(lower,upper)=>lower&&upper?
    round(new THREE.Box3().setFromObject(upper).min.y-
      new THREE.Box3().setFromObject(lower).max.y):null;
  const vc13ToGoniometer=output&&lowerGoniometer?
    round(new THREE.Box3().setFromObject(lowerGoniometer).min.y-
      new THREE.Box3().setFromObject(output).max.y):null;
  return {available:true,photoMode:!aWorkingPoseMode,
   filmStageX:activeAFilmX(),VC13InitialLiftMm:aWorkingPoseMode?13:0,
   vc13CarriageMeshLiftMm:slider?round(slider.position.y):null,
   vc13OutputToGoniometerGapMm:vc13ToGoniometer,
   goniometerToUpperGapMm:gap(lowerGoniometer,upperGoniometer),
   upperGoniometerToSheetTopGapMm:gap(upperGoniometer,lSheet),
   magnetToXyBaseGapMm:gap(a17,a15MountBase),
   a15DrumsVsMagnetOverlapMm3:actuatorMagnetOverlap,
   falseAabbGapFromWholeA15Mm:gap(a17,a15),
   bracketMirroredFromPhoto:aWorkingPoseMode,
   fabricatedClampVisible:Boolean(parts.get('A05C')?.g.visible),
   unphotographedGlassVisible:Boolean(parts.get('A05G')?.g.visible),
   actualClampManufacturerConfirmed:false,photographicMountsAccepted:false,
   directPhotoIds:['191','192','193','194','195','196']};
 };
const activeAFilmX=()=>aWorkingPoseMode?A_WORKING_LAYOUT.filmStageX:CONFIG.A.armX;
window.__platformAWorkingPoseProbe=()=>platform==='A'?{
 available:true,mode:aWorkingPoseMode?'candidate':'photo94',
 ...auditAWorkingLayout({filmShiftMm:filmShift,filmDepthShiftMm:filmShiftDepth,
   sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle,filmDropMm:filmDrop})
}:{available:false};
let sampleSubstrate=null;
let pointerDown=null;
const measurementOverlay=new THREE.Group();scene.add(measurementOverlay);
// Read-only diagnostic used by the real-browser assembly smoke test.
// Coordinate projection detects "component in BOM but outside viewport".
window.__sceneFiniteGeometryProbe=()=>{
 const invalid=[],pos=new THREE.Vector3();let meshCount=0;
 currentRoot.updateWorldMatrix(true,true);
 currentRoot.traverse(node=>{
  if(!node.isMesh)return;
  meshCount++;node.getWorldPosition(pos);
  if(!Number.isFinite(pos.x)||!Number.isFinite(pos.y)||!Number.isFinite(pos.z)){
    invalid.push(node.userData.partId||'?');
  }
 });
 const rotor=parts.get(platform==='A'?'A06':'B08')?.g;
 const ticks=rotor?.children.filter(o=>o.userData.AuxAngularTick)??[];
 const distances=ticks.map(o=>Math.hypot(o.position.x,o.position.z));
 return {available:true,meshCount,invalidMeshes:invalid.length,
   invalidParts:invalid.slice(0,6),tickCount:ticks.length,
   minRadiusMm:distances.length?Math.min(...distances):null,
   maxRadiusMm:distances.length?Math.max(...distances):null};
};
window.__platformADetailTopologyProbe=()=>{
 if(platform!=='A')return {available:false};
 const vertical=parts.get('A03')?.g,gonio=parts.get('A04')?.g,tube=parts.get('A08')?.g;
 if(!vertical||!gonio||!tube)return {available:false};
 const bigSubgroups=g=>g.children.filter(o=>o.isGroup&&o.children.length>=30).length;
 const rings=tube.children.filter(o=>o.userData.A08HousingCollarCandidate);
 return {available:true,ghostVerticalKnurlGroups:bigSubgroups(vertical),
   duplicateGoniometerKnurlGroups:bigSubgroups(gonio),
   nominalTubeCollarHeightsMm:rings.map(o=>o.position.y),
   verticalNameplateMounted:vertical.children.some(o=>o.userData.A03LabelOnStationaryFace)};
};
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
// V54: inspect actual rendered actuator meshes and independent carriage motion.
// The result is derived from visible handle meshes and live group transforms,
// not from BOM labels or photo-evidence metadata alone.
window.__photoEvidenceProbe=(partId,rig=platform)=>photoEvidenceProbe(rig,partId);
window.__platformACompletenessProbe=()=>{
 if(platform!=='A')return {available:false};
 const clamp=parts.get('A05C')?.g,screws=parts.get('A05CS')?.g,slide=parts.get('A05G')?.g,bracket=parts.get('A05')?.g;
 if(!clamp||!screws||!slide||!bracket)return {available:false};
 const stamp=slide.children.find(o=>o.userData.A05GStampRightMarginMm!==undefined);
 const glass=slide.children.find(o=>Array.isArray(o.userData.candidateStandardSlide));
 return {
  available:true,
  separateClampAndGlassParts:clamp!==slide,
  clampProxyUnverified:Boolean(clamp.userData.unverifiedClampMechanism),
  actualClampOEMConfirmed:Boolean(clamp.userData.actualClampOEM),
  glassSizeMm:glass?.userData.candidateStandardSlide??null,
  stampRightMarginMm:stamp?.userData.A05GStampRightMarginMm??null,
  stampAtRightEdge:Boolean(slide.userData.stampAtRightGlassEdge),
  aPose:aWorkingPoseMode?'candidate':'photo94',
  sheetHandedness:bracket.userData.photoBracketDatums?.handedness??null,
  sheetLegLengthMm:bracket.userData.photoBracketDatums?.verticalLegLength??null,
  clampScrewProxyCount:screws.children.filter(m=>m.userData.photo194WingFastenerCandidate).length,
  clampRelativeToHeaterNotRegistered:Boolean(slide.userData.unregisteredGlobalPose),
  clampWorldY:clamp.position.y,glassWorldY:slide.position.y,bracketWorldY:bracket.position.y
 };
};
// Physical mesh-based photo195/196 test: do NOT trust metadata alone.
// Projection QA uses real rendered geometries, not hard-coded pixel placement.
window.__platformAFramingProbe=()=>{
 if(platform!=='A')return {available:false};
 const cable=parts.get('A20')?.g,board=parts.get('A01')?.g;
 if(!cable||!board)return {available:false};
 camera.updateMatrixWorld(true);
 const topBox=new THREE.Box3().setFromObject(cable);
 const bottomBox=new THREE.Box3().setFromObject(board);
 const cableTop=new THREE.Vector3((topBox.min.x+topBox.max.x)/2,topBox.max.y,
   (topBox.min.z+topBox.max.z)/2).project(camera);
 const baseBottom=new THREE.Vector3((bottomBox.min.x+bottomBox.max.x)/2,bottomBox.min.y,
   (bottomBox.min.z+bottomBox.max.z)/2).project(camera);
 return {available:true,topNdcY:Number(cableTop.y.toFixed(3)),
   boardBottomNdcY:Number(baseBottom.y.toFixed(3)),
   topVisible:Math.abs(cableTop.y)<.95,
   boardVisible:Math.abs(baseBottom.y)<.95,
   topWorldYmm:Number(topBox.max.y.toFixed(1)),
   mode:aWorkingPoseMode?'candidate':'photo94'};
};
window.__platformAStageFrontProbe=()=>{
 if(platform!=='A')return {available:false};
 const stage=parts.get('A15')?.g,mag=parts.get('A17')?.g;
 const slider=stage?.userData.slidingX;
 const plate=slider?.children.find(m=>m.userData.A15Photo194FrontSlottedPlate);
 const knob=slider?.children.find(m=>m.userData.A15Photo194SlotControlKnob);
 const lever=mag?.children.find(m=>m.userData.A17Photo194LowerLeverCandidate);
 if(!stage||!mag||!plate||!knob||!lever)return {available:false};
 stage.updateWorldMatrix(true,true);mag.updateWorldMatrix(true,true);
 const p=new THREE.Vector3(),m=new THREE.Vector3();
 plate.getWorldPosition(p);mag.getWorldPosition(m);
 return {available:true,frontPlateAboveMagnet:p.y>m.y+20,
  frontPlateFollowsA15X:plate.parent===slider,
  A15FrontKnobCount:slider.children.filter(x=>x.userData.A15Photo194SlotControlKnob).length,
  A15FrontScrewCount:slider.children.filter(x=>x.userData.A15Photo194FrontPlateScrewCandidate).length,
  A17LowerLeverCount:mag.children.filter(x=>x.userData.A17Photo194LowerLeverCandidate).length,
  noDuplicateA17Slot:!mag.userData.A17Photo22SlottedSidePanel,
  manufacturerHolePatternVerified:false,slotDimensionsVerified:false};
};
window.__platformABareClampProbe=()=>{
   if(platform!=='A')return {available:false};
   const sheet=parts.get('A05')?.g,screw=parts.get('A05CS')?.g;
   const foot=sheet?.children.find(o=>o.userData.A05OutwardFootCandidate);
   const web=sheet?.children.find(o=>o.userData.A05VerticalSheetWeb);
   const heads=screw?.children.filter(o=>o.userData.A05CSFootSeatedHead)??[];
   const ears=screw?.children.filter(o=>o.userData.A05CSWingEarPlane)??[];
   if(!foot||!web||heads.length!==2||ears.length!==4)return {available:false};
   sheet.updateWorldMatrix(true,true);screw.updateWorldMatrix(true,true);
   const bounds=o=>new THREE.Box3().setFromObject(o);
   const fb=bounds(foot),wb=bounds(web);
   const centers=heads.map(h=>h.getWorldPosition(new THREE.Vector3()));
   const r=x=>{const n=Number(x.toFixed(3));return Object.is(n,-0)?0:n;};
   const overlap=ears.reduce((sum,o)=>{
     const intrude=bounds(o).clone().intersect(wb);
     if(intrude.isEmpty())return sum;
     const size=new THREE.Vector3();intrude.getSize(size);
     return sum+size.x*size.y*size.z;
   },0);
   return {available:true,visibleGlass:Boolean(parts.get('A05G')?.g.visible),
    visibleFabricatedJaws:Boolean(parts.get('A05C')?.g.visible),
    visibleWingScrewCount:heads.length,wingEarCount:ears.length,
    actualFootBores:foot.userData.A05ActualThroughBoreCount,
    wingPairPitchXMm:r(Math.abs(centers[1].x-centers[0].x)),
    wingPairPitchZMm:r(Math.abs(centers[1].z-centers[0].z)),
    wingEarPlane:screw.userData.wingHeadPlane,
    wingToUprightOverlapMm3:r(overlap),
    headFootMaxGapMm:r(Math.max(...heads.map(h=>bounds(h).min.y-fb.max.y))),
    approvedDisplay:'A05 folded sheet + bare foot + two screws without glass',
    actualWingNutOEMVerified:false};
 };
 window.__modelA05PhotoEvidenceProbe=()=>{
 if(platform!=='A')return {available:false};
 const sheet=parts.get('A05')?.g,fasteners=parts.get('A05CS')?.g;
 const candidateGrip=parts.get('A05C')?.g,candidateGlass=parts.get('A05G')?.g;
 const foot=sheet?.children.find(m=>m.userData.A05OutwardFootCandidate);
 const heads=fasteners?.children.filter(m=>m.userData.photo194WingFastenerCandidate);
 if(!foot||heads?.length!==2||!candidateGrip||!candidateGlass)return {available:false};
 sheet.updateWorldMatrix(true,true);fasteners.updateWorldMatrix(true,true);
 const positions=heads.map(m=>m.getWorldPosition(new THREE.Vector3()));
 const bb=new THREE.Box3().setFromObject(foot);
 const slide=candidateGlass.children.find(m=>m.userData.candidateStandardSlide);
 const slideBounds=slide?new THREE.Box3().setFromObject(slide):null;
 const shafts=fasteners.children.filter(m=>m.userData.A05CSCandidateShank);
 const fastenerGlassCollisions=slideBounds?
   shafts.filter(m=>new THREE.Box3().setFromObject(m).intersectsBox(slideBounds)).length:null;
 return {available:true,pose:aWorkingPoseMode?'candidate':'photo94',
   visibleFastenerCount:heads.length,
   fastenerAxis:'X-outward',
   screwPitchXmm:Number(Math.abs(positions[1].x-positions[0].x).toFixed(2)),
   screwPitchZmm:Number(Math.abs(positions[1].z-positions[0].z).toFixed(2)),
   footSpanXmm:Number((bb.max.x-bb.min.x).toFixed(2)),
   footSpanZmm:Number((bb.max.z-bb.min.z).toFixed(2)),
   glassCandidateLeftXmm:slideBounds?Number(slideBounds.min.x.toFixed(2)):null,
   footCandidateRightXmm:Number(bb.max.x.toFixed(2)),
   fastenerGlassCollisionCount:fastenerGlassCollisions,
   foldedFootOutsideGlass:slideBounds?bb.max.x<slideBounds.min.x:false,
   glassCandidateVisible:candidateGlass.visible,
   fabricatedJawsVisible:candidateGrip.visible,
   photo194196ActuallyShowsMountedSlide:false,
   glassClampOEMVerified:false,
   physicalClampLoadPathVerified:false};
};
window.__modelA05FootBoreProbe=()=>{
 if(platform!=='A')return {available:false};
 const sheet=parts.get('A05')?.g,screws=parts.get('A05CS')?.g;
 const foot=sheet?.children.find(m=>m.userData.A05OutwardFootCandidate);
 const shafts=screws?.children.filter(m=>m.userData.A05CSCandidateShank);
 if(!foot||!screws||shafts?.length!==2)return {available:false};
 sheet.updateWorldMatrix(true,true);screws.updateWorldMatrix(true,true);
 const footBox=new THREE.Box3().setFromObject(foot);
 const hit=(x,z)=>new THREE.Raycaster(
   new THREE.Vector3(x,footBox.min.y-1,z),new THREE.Vector3(0,1,0),0,6
 ).intersectObject(foot,false).length;
 const centers=shafts.map(m=>{const v=new THREE.Vector3();m.getWorldPosition(v);return v});
 const mid=new THREE.Vector3();foot.getWorldPosition(mid);
 const carrier=parts.get('A05C')?.g.children.find(m=>
   m.userData.A05CActualThroughBores!==undefined);
 const carrierBox=carrier?new THREE.Box3().setFromObject(carrier):null;
 const carrierOpen=Boolean(carrier)&&centers.every(v=>new THREE.Raycaster(
   new THREE.Vector3(v.x,carrierBox.min.y-1,v.z),
   new THREE.Vector3(0,1,0),0,6
 ).intersectObject(carrier,false).length===0);
 return {available:true,actualBoresOpen:centers.every(v=>hit(v.x,v.z)===0),
   solidMaterialBetweenBores:hit(mid.x,mid.z)>0,
   boreCount:foot.userData.A05ActualThroughBoreCount,
   carrierActualBoreCount:carrier?.userData.A05CActualThroughBores??null,
   carrierScrewAxesOpen:carrierOpen,
   independentFastenerPart:sheet!==screws&&parts.get('A05C')?.g!==screws,
   shaftCount:shafts.length,
   tipBelowFootMm:Number((footBox.min.y-Math.min(...shafts.map(m=>
     new THREE.Box3().setFromObject(m).min.y))).toFixed(2)),
   diameterMmCandidate:foot.userData.A05BoreDiameterCandidateMm,
   actualOEMThreadsVerified:false};
};
window.__modelAObjectiveOrientationProbe=()=>{
 if(platform!=='A')return {available:false};
 const root=parts.get('A19')?.g;
 if(!root)return {available:false};
 root.updateWorldMatrix(true,true);
 const inspect=side=>{
   const pivot=root.children.find(m=>m.userData.A19ObjectivePivot===side);
   const barrel=pivot?.children.find(m=>m.userData.A19ObjectiveBarrel===side);
   const lens=pivot?.children.find(m=>m.userData.objectiveOpticProxy);
   if(!pivot||!barrel||!lens)return null;
   const q=new THREE.Quaternion();pivot.getWorldQuaternion(q);
   const axis=new THREE.Vector3(0,-1,0).applyQuaternion(q);
   const center=new THREE.Vector3();lens.getWorldPosition(center);
   return {side,
     axisTiltDeg:Number((Math.atan2(axis.x,-axis.y)*180/Math.PI).toFixed(2)),
     lensCenterWorldMm:center.toArray().map(x=>Number(x.toFixed(2))),
     barrelAndLensSamePivot:barrel.parent===pivot&&lens.parent===pivot};
 };
 const left=inspect('left'),center=inspect('center');
 return {available:!!left&&!!center,left,center,
   independentObjectivePivots:root.children.filter(o=>o.userData.A19ObjectivePivot).length===2,
   photoRefs:['191','192','193'],
   actualTurretIndexAnglesVerified:false};
};
window.__modelAOpticalClearanceProbe=()=>{
 if(platform!=='A')return {available:false};
 const obj=parts.get('A19')?.g,slide=parts.get('A05G')?.g;
 const opticIDs=['A08','A09','A14','A18','A19','A20'];
 const opticalRoots=opticIDs.map(id=>({id,root:parts.get(id)?.g,base:parts.get(id)?.base}));
 const glass=slide?.children.find(o=>o.userData.candidateStandardSlide);
 if(!obj||!glass||opticalRoots.some(x=>!x.root))return {available:false};
 obj.updateWorldMatrix(true,true);slide.updateWorldMatrix(true,true);
 const glassBox=new THREE.Box3().setFromObject(glass);
 const optics=[];
 for(const node of obj.children){
   if(!node.userData.A19ObjectivePivot)continue;
   for(const m of node.children){
     if(!(m.userData.A19ObjectiveBarrel||m.userData.A19ObjectiveBand||m.userData.objectiveOpticProxy))continue;
     const box=new THREE.Box3().setFromObject(m);
     const planarOverlap=box.min.x<glassBox.max.x&&box.max.x>glassBox.min.x&&
       box.min.z<glassBox.max.z&&box.max.z>glassBox.min.z;
     optics.push({side:node.userData.A19ObjectivePivot,
       type:m.userData.A19ObjectiveBarrel?'barrel':m.userData.A19ObjectiveBand?'band':'lens',
       planarOverlap,conservativeCollision:box.intersectsBox(glassBox),
       lowerYmm:Number(box.min.y.toFixed(2))});
   }
 }
 const parked=aWorkingPoseMode?A_WORKING_LAYOUT.opticalParkingLiftMm:0;
 const headOffset=opticalRoots.map(({id,root,base})=>({
   id,offsetMm:Number((root.position.y-base.y).toFixed(2))
 }));
 const fixedPost=parts.get('A10')?.g;
 const movingBoom=fixedPost?.userData.opticsMovingBoom;
 const boomMatched=Boolean(movingBoom)&&Math.abs(movingBoom.position.y-parked)<.02;
 const boomShell=movingBoom?.children.find(m=>m.userData.A10BoomTruePostThroughBore);
 let boomBoreOpen=false,boomNearbyMetal=false;
 if(boomShell){
   fixedPost.updateWorldMatrix(true,true);
   const bb=new THREE.Box3().setFromObject(boomShell);
   const boreRay=(x,z)=>new THREE.Raycaster(
     new THREE.Vector3(x,bb.min.y-1,z),new THREE.Vector3(0,1,0),0,27
   ).intersectObject(boomShell,false).length;
   const postPos=new THREE.Vector3();fixedPost.getWorldPosition(postPos);
   boomBoreOpen=boreRay(postPos.x,postPos.z)===0;
   boomNearbyMetal=boreRay(postPos.x,postPos.z+22)>0;
 }
 const headRoot=parts.get('A18')?.g;
  const headHousing=headRoot?.children.find(o=>o.isMesh);
  const boomBounds=boomShell?new THREE.Box3().setFromObject(boomShell):null;
  const housingBounds=headHousing?new THREE.Box3().setFromObject(headHousing):null;
  const boomFrontGapMm=boomBounds&&housingBounds?
    Number((housingBounds.min.z-boomBounds.max.z).toFixed(3)):null;
  const boomFaceAreaMm2=boomBounds&&housingBounds?
    Number((Math.max(0,Math.min(boomBounds.max.x,housingBounds.max.x)-
      Math.max(boomBounds.min.x,housingBounds.min.x))*
      Math.max(0,Math.min(boomBounds.max.y,housingBounds.max.y)-
      Math.max(boomBounds.min.y,housingBounds.min.y))).toFixed(3)):null;
  const boomHousingOverlapMm3=boomBounds&&housingBounds?(()=>{
    const shared=boomBounds.clone().intersect(housingBounds);
    if(shared.isEmpty())return 0;
    const sz=new THREE.Vector3();shared.getSize(sz);
    return Number((sz.x*sz.y*sz.z).toFixed(3));
  })():null;
  const minOpticalBottom=Math.min(...optics.map(x=>x.lowerYmm));
 const minVerticalGap=Number((minOpticalBottom-glassBox.max.y).toFixed(2));
 const hypotheticalUnparkedMinGap=Number((minVerticalGap-parked).toFixed(2));
 return {available:true,mode:aWorkingPoseMode?'candidate':'photo94',
   opticPartIds:[...opticIDs,'A10:movable-boom'],
   coherentOpticOffsets:headOffset.every(x=>Math.abs(x.offsetMm-parked)<.02)&&boomMatched,
   supportBoomMovesWhilePostFixed:boomMatched&&Math.abs(fixedPost.position.y-parts.get('A10').base.y)<.02,
   supportBoomRealPostBore:boomBoreOpen,
   supportBoomNearbySolidMetal:boomNearbyMetal,
    boomLengthCandidateMm:boomShell?.userData.A10BoomLengthCandidateMm??null,
    boomHousingFrontGapMm:boomFrontGapMm,
    boomHousingMatingFaceAreaMm2:boomFaceAreaMm2,
    boomHousingOverlapMm3,
   supportBoomCandidatePostBoreDiameterMm:boomShell?.userData.A10BoreDiameterCandidateMm??null,
   actualParkingLiftMm:parked,
   glassTopWorldYmm:Number(glassBox.max.y.toFixed(2)),
   closestObjectiveBottomYmm:minOpticalBottom,
   verticalGapMm:minVerticalGap,
   withoutParkingGapMm:hypotheticalUnparkedMinGap,
   planarOverlapExists:optics.some(x=>x.planarOverlap),
   currentBroadphaseCollisions:optics.filter(x=>x.conservativeCollision),
   allOpticSolidsAboveSlide:minVerticalGap>0,
   OEMFocusStrokeVerified:false,
   actualWorkingDistanceVerified:false,
   physicalCollisionCertification:false};
};
window.__modelAVerticalGuideProbe=()=>{
 if(platform!=='A')return {available:false};
 const stage=parts.get('A03')?.g;
 const fixed=stage?.children.filter(m=>m.userData.A03StationarySideGuide);
 const moving=stage?.userData.verticalCarriage?.children
   .filter(m=>m.userData.A03MovingGuideTongue);
 const plate=stage?.userData.verticalCarriage?.children
   .find(m=>m.userData.A03MovingOutputPlate);
 if(!stage||fixed?.length!==2||moving?.length!==2||!plate)return {available:false};
 stage.updateWorldMatrix(true,true);
 const box=m=>new THREE.Box3().setFromObject(m);
 const pairs=[-1,1].map(sign=>{
   const f=box(fixed.find(m=>m.userData.A03StationarySideGuide===sign));
   const t=box(moving.find(m=>m.userData.A03MovingGuideTongue===sign));
   const clearance=sign>0?t.min.x-f.max.x:f.min.x-t.max.x;
   const axialOverlap=Math.min(t.max.y,f.max.y)-Math.max(t.min.y,f.min.y);
   return {side:sign,clearanceMm:Number(clearance.toFixed(2)),
     axialOverlapMm:Number(axialOverlap.toFixed(2)),
     noGuideClash:clearance>0,engaged:axialOverlap>0};
 });
 const plateBox=box(plate);
 const tonguePlateOverlapMm=moving.map(t=>{
   const bb=box(t);
   return Number((Math.min(bb.max.y,plateBox.max.y)-
     Math.max(bb.min.y,plateBox.min.y)).toFixed(2));
 });
 const tonguesTouchPlate=tonguePlateOverlapMm.every(x=>x>=5);
 return {available:true,stationaryGuideCount:fixed.length,
   movingTongueCount:moving.length,pairs,
   tonguesTouchMovingPlate:tonguesTouchPlate,
   tonguePlateOverlapMm,
   travelMm:stage.userData.nominalVerticalTravelMm,
   outputLiftMm:stage.userData.verticalCarriage.position.y,
   actualTravelInGuideEnvelope:pairs.every(p=>p.noGuideClash&&p.engaged),
   manufacturerGuideProfileVerified:false};
};
window.__modelAPhoto194Probe=()=>{
 if(platform!=='A')return {available:false};
 const lower=parts.get('A04L')?.g,upper=parts.get('A04')?.g;
 const clamp=parts.get('A05C')?.g,screws=parts.get('A05CS')?.g,bracket=parts.get('A05')?.g;
 const driveSide=(group,tag)=>{
   const drum=group?.children.find(m=>m.userData[tag]);
   if(!drum)return null;
   group.updateWorldMatrix(true,true);drum.updateWorldMatrix(true,false);
   const origin=new THREE.Vector3(),center=new THREE.Vector3();
   group.getWorldPosition(origin);drum.getWorldPosition(center);
   return center.x>origin.x?'+X':'-X';
 };
 return {available:Boolean(lower&&upper&&clamp&&screws&&bracket),
   upperDrive:driveSide(upper,'A04DriveDrum'),
   lowerDrive:driveSide(lower,'A04LDriveDrum'),
   wingFastenerCount:screws?.children.filter(m=>m.userData.photo194WingFastenerCandidate).length??0,
   outwardFootCount:bracket?.children.filter(m=>m.userData.A05OutwardFootCandidate).length??0,
   fastenerThreadVerified:false,photoRegisteredGlobalPose:false,
   clampSkuVerified:false};
};
// Real-mesh contact chain for platform A's suspended glass.
 // Zero clearance on a designed mating plane is intentional.
 // Solid-solid overlap elsewhere is not accepted as mechanical support.
 window.__modelAClampChainProbe=()=>{
   if(platform!=='A')return {available:false};
   const get=(id,tag)=>parts.get(id)?.g.children.find(o=>o.userData[tag]);
   const sheet=get('A05','A05VerticalSheetWeb');
   const foot=get('A05','A05OutwardFootCandidate');
   const carrier=get('A05C','A05CActualThroughBores');
   const spine=get('A05C','A05CBackSpineProxy');
   const upper=get('A05C','A05CUpperJaw');
   const lower=get('A05C','A05CLowerJaw');
   const glass=get('A05G','candidateStandardSlide');
   if(![sheet,foot,carrier,spine,upper,lower,glass].every(Boolean))
     return {available:false};
   currentRoot.updateWorldMatrix(true,true);
   const bb=o=>new THREE.Box3().setFromObject(o);
   const b={sheet:bb(sheet),foot:bb(foot),carrier:bb(carrier),
     spine:bb(spine),upper:bb(upper),lower:bb(lower),glass:bb(glass)};
   const v=(boxA,boxB)=>{
     const overlap=boxA.clone().intersect(boxB),sz=new THREE.Vector3();
     if(overlap.isEmpty())return 0;
     overlap.getSize(sz);
     return Number((sz.x*sz.y*sz.z).toFixed(4));
   };
   const rnd=x=>{const mm=Number(x.toFixed(3));return Object.is(mm,-0)?0:mm;};
   const faceXZ=(a,c)=>Math.min(a.max.x,c.max.x)-Math.max(a.min.x,c.min.x)>1&&
     Math.min(a.max.z,c.max.z)-Math.max(a.min.z,c.min.z)>1;
   const faceYZ=(a,c)=>Math.min(a.max.y,c.max.y)-Math.max(a.min.y,c.min.y)>1&&
     Math.min(a.max.z,c.max.z)-Math.max(a.min.z,c.min.z)>0.2;
   const overlapXY=(a,c)=>Math.min(a.max.x,c.max.x)-Math.max(a.min.x,c.min.x)>1&&
     Math.min(a.max.y,c.max.y)-Math.max(a.min.y,c.min.y)>0.2;
   const footCarrierGapMm=rnd(b.foot.min.y-b.carrier.max.y);
   const carrierSpineGapMm=rnd(b.spine.min.x-b.carrier.max.x);
   const spineUpperGapMm=rnd(b.spine.min.z-b.upper.max.z);
   const spineLowerGapMm=rnd(b.spine.min.z-b.lower.max.z);
   const upperGlassGapMm=rnd(b.upper.min.y-b.glass.max.y);
   const lowerGlassGapMm=rnd(b.glass.min.y-b.lower.max.y);
   const metalOverlapMm3=v(b.sheet,b.carrier)+v(b.foot,b.carrier);
   const jawGlassOverlapMm3=v(b.upper,b.glass)+v(b.lower,b.glass)+v(b.spine,b.glass);
   const gripXmm=rnd(Math.min(b.upper.max.x,b.glass.max.x)-
     Math.max(b.upper.min.x,b.glass.min.x));
   const workingChainContinuous=
     Math.abs(footCarrierGapMm)<.02&&faceXZ(b.foot,b.carrier)&&
     Math.abs(carrierSpineGapMm)<.02&&faceYZ(b.carrier,b.spine)&&
     Math.abs(spineUpperGapMm)<.02&&overlapXY(b.spine,b.upper)&&
     Math.abs(spineLowerGapMm)<.02&&overlapXY(b.spine,b.lower)&&
     Math.abs(upperGlassGapMm)<.02&&Math.abs(lowerGlassGapMm)<.02&&gripXmm>=9.9&&
     metalOverlapMm3<.01&&jawGlassOverlapMm3<.01;
   return {available:true,pose:aWorkingPoseMode?'candidate':'photo94',
     clampRendered:parts.get('A05C')?.g.visible??false,
     glassRendered:parts.get('A05G')?.g.visible??false,
     footCarrierGapMm,carrierSpineGapMm,
     spineUpperGapMm,spineLowerGapMm,
     upperGlassGapMm,lowerGlassGapMm,
     metalOverlapMm3,jawGlassOverlapMm3,
     gripXmm,workingChainContinuous,
     actualManufacturerClampVerified:false,
     physicalTransferAssemblyAccepted:false};
 };
 // V75 photographic-detail regression: inspect ACTUAL mesh surfaces
 // of the five previously floating/clipping features, independent of
 // BOM presence, labels or screenshot camera angle.
 window.__modelADetailMountProbe=()=>{
   if(platform!=='A')return {available:false};
   const root=id=>parts.get(id)?.g;
   const mesh=(id,tag)=>root(id)?.children.find(o=>o.isMesh&&o.userData[tag]);
   const gA11=root('A11'),gA18=root('A18');
   const lamp=gA11?.children.find(o=>o.isMesh);
   const housing=gA18?.children.find(o=>o.isMesh);
   const bend=mesh('A05','A05VerticalSheetWeb');
   const drum=mesh('A04','A04DriveDrum');
   const foot=mesh('A05','A05OutwardFootCandidate');
   const screws=root('A05CS')?.children.filter(o=>o.userData.A05CSFootSeatedHead);
   const sampleStem=mesh('A06','A06CoupledMicrometerStem');
   const sampleDrum=mesh('A06','A06RightAngularMicrometer');
   const support=mesh('A11','A11PhysicallyConnectedSupportProxy');
   const mount=mesh('A11','A11A18SideMountProxy');
   if(![lamp,housing,bend,drum,foot,sampleStem,sampleDrum,support,mount].every(Boolean)||
      screws?.length!==2)return {available:false};
   currentRoot.updateWorldMatrix(true,true);
   const box=o=>new THREE.Box3().setFromObject(o);
   const d=(v)=>{const n=Number(v.toFixed(3));return Object.is(n,-0)?0:n;};
   const a=box(mesh('A11','A11OEMSlipRingCandidate')??lamp),h=box(housing),b=box(bend),m=box(drum);
   const f=box(foot),shaft=box(sampleStem),knob=box(sampleDrum);
   const mountBox=box(mount);
   const lampMountStart=gA11.localToWorld(new THREE.Vector3(-24,17,-35));
   const lampMountEnd=gA11.localToWorld(new THREE.Vector3(0,30,-20.5));
   const opticalParkA11=d(gA11.position.y-parts.get('A11').base.y);
   const opticalParkA18=d(gA18.position.y-parts.get('A18').base.y);
   return {available:true,pose:aWorkingPoseMode?'candidate':'photo94',
     lampSupportPresent:true,lampMountMethodVerified:false,
     lampMountToHeadSideGapMm:d(mountBox.min.x-h.max.x),
     lampSupportStartSurfaceGapMm:d(lampMountStart.x-h.max.x-3),
     lampSupportToBulbRearGapMm:d(a.min.z-lampMountEnd.z-3), // support->SM1RC rear face
     lampOpticsParkingOffsetDifferenceMm:d(opticalParkA11-opticalParkA18),
     g40RightDrumToBendWebClearanceMm:d(b.min.x-m.max.x),
     g40DrumBendOverlapVolumeAabbMm3:(()=>{
       const shared=b.clone().intersect(m);
       if(shared.isEmpty())return 0;
       const sz=new THREE.Vector3();shared.getSize(sz);
       return d(sz.x*sz.y*sz.z);
     })(),
     sampleMicrometerStemDrumEngagementMm:d(shaft.max.x-knob.min.x),
     sampleMicrometerStemOuterBlockVerified:false,
     wingFastenerCount:screws.length,
     maxWingHeadFloatGapMm:d(Math.max(...screws.map(o=>box(o).min.y-f.max.y))),
     A03TonguePlateOverlapMm:window.__modelAVerticalGuideProbe?.().tonguePlateOverlapMm??null,
     physicalPhotoFitCertified:false};
 };
 window.__modelAContactProbe=()=>{
 if(platform!=='A')return {available:false};
 const child=(id,tag)=>parts.get(id)?.g.children.find(o=>o.isMesh&&o.userData[tag]);
 const slide=child('A05G','candidateStandardSlide');
 const stamp=child('A05G','A05GStampRightMarginMm');
 const sample=child('A07W','A07SampleChipProxy');
 const clamp=parts.get('A05C')?.g;
 const heater=parts.get('A07')?.g.children.find(o=>o.isMesh);
 const magnet=parts.get('A17')?.g.children.find(o=>o.isMesh);
 const sampleFoot=parts.get('A16')?.g.children.find(o=>o.isMesh);
 if(!slide||!stamp||!sample||!clamp||!heater||!magnet||!sampleFoot)
   return {available:false};
 const bounds=o=>{o.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(o);};
 const glass=bounds(slide),pdms=bounds(stamp),chip=bounds(sample);
 const heaterBox=bounds(heater),jaw=bounds(clamp);
 const magnetBox=bounds(magnet),sampleFootBox=bounds(sampleFoot);
 const overlapX=(a,b)=>a.min.x<=b.max.x&&b.min.x<=a.max.x;
 const overlapZ=(a,b)=>a.min.z<=b.max.z&&b.min.z<=a.max.z;
 const allInside=(inner,outer)=>inner.min.x>=outer.min.x-.01&&
   inner.max.x<=outer.max.x+.01&&inner.min.z>=outer.min.z-.01&&
   inner.max.z<=outer.max.z+.01;
 const clearance=heaterBox.min.x-jaw.max.x;
 return {
   available:true,mode:aWorkingPoseMode?'candidate':'photo94',
   A17ToA16XFootprintGapMm:Number((sampleFootBox.min.x-magnetBox.max.x).toFixed(3)),
   clampToHeaterEdgeMm:Number(clearance.toFixed(3)),
   clampOutsideHeater:clearance>0,
   sampleChipTopWorldYmm:Number(chip.max.y.toFixed(3)),
   pdmsBottomWorldYmm:Number(pdms.min.y.toFixed(3)),
   pdmsToChipGapMm:Number((pdms.min.y-chip.max.y).toFixed(3)),
   stampRightInsetMm:Number((glass.max.x-pdms.max.x).toFixed(3)),
   stampFullyInsideChipXY:allInside(pdms,chip),
   glassAndChipOverlapXY:overlapX(glass,chip)&&overlapZ(glass,chip),
   clampFastenerProxyCount:parts.get('A05CS')?.g.children.filter(m=>m.userData.photo194WingFastenerCandidate).length??0,
   allComponentsPhotoConfirmed:false,
   dimensionsForFabricationValidated:false
 };
};
// Inspect B08's actual 3D hole topology, not decorative circle markers.
window.__modelBRotaryTopBoreProbe=()=>{
 if(platform!=='B')return {available:false};
 const g=parts.get('B08')?.g;
 const deck=g?.userData.rotatingDeck;
 const upper=deck?.children.find(o=>o.userData.B08TrueTopNineBores);
 if(!upper)return {available:false};
 upper.updateWorldMatrix(true,false);
 const caster=new THREE.Raycaster();
 const test=(x,z)=>{
   const start=upper.localToWorld(new THREE.Vector3(x,11,z));
   caster.set(start,new THREE.Vector3(0,-1,0));
   caster.far=11.1;
   return caster.intersectObject(upper,false).length>0;
 };
 const holes=[...[-25,0,25].flatMap(x=>[-25,0,25].map(z=>[x,z]))];
 const worldHoles=holes.map(([x,z])=>
   upper.localToWorld(new THREE.Vector3(x,8,z)));
 const mountHeads=parts.get('B41')?.g.children.filter(o=>
   o.userData.stageBaseRecessedHead)??[];
 const mountingMisalignmentMm=mountHeads.length===4?
   Math.max(...mountHeads.map(head=>{
     const p=head.getWorldPosition(new THREE.Vector3());
     return Math.min(...worldHoles.map(h=>Math.hypot(h.x-p.x,h.z-p.z)));
   })):null;
 return {available:true,
   deckYawDeg:Number((deck.rotation.y*180/Math.PI).toFixed(3)),
   B41MountHeadCount:mountHeads.length,
   mountingMisalignmentMm,
   baseMountBoreCount:g.userData.B08BaseMountBoreCount,
   baseMountPitchMm:g.userData.B08BaseMountPitchMm,
   baseClearanceDiaMm:g.userData.B08BaseMountClearanceDiaMm,
   baseCounterboreDiaMm:g.userData.B08BaseCounterboreDiaMm,
   baseCounterboreDepthMm:g.userData.B08BaseCounterboreDepthMm,
   baseFaceOrientationVerified:Boolean(g.userData.B08CounterboreFaceOrientationVerified),
   baseBoreMeshes:g.children.filter(o=>o.userData.B08FixedLowerClearanceHoles||
     o.userData.B08FixedUpperCounterbores).length,
   baseFourClearanceBoresOpen:(()=>{
     const m=g.children.find(o=>o.userData.B08FixedLowerClearanceHoles);
     if(!m)return false;
     const ray=new THREE.Raycaster();
     return [-25,25].every(x=>[-25,25].every(z=>{
       ray.set(m.localToWorld(new THREE.Vector3(x,8,z)),new THREE.Vector3(0,-1,0));
       ray.far=9;
       return ray.intersectObject(m,false).length===0;
     }));
   })(),
   baseFourCounterboresOpen:(()=>{
     const m=g.children.find(o=>o.userData.B08FixedUpperCounterbores);
     if(!m)return false;
     const ray=new THREE.Raycaster();
     return [-25,25].every(x=>[-25,25].every(z=>{
       ray.set(m.localToWorld(new THREE.Vector3(x,17,z)),new THREE.Vector3(0,-1,0));
       ray.far=18;
       return ray.intersectObject(m,false).length===0;
     }));
   })(),
   duplicateB41MountHeadsOnB08:g.userData.B08DuplicateB41Fasteners,
   nineBoreCount:g.userData.B08TopTrueBoreCount,
   allNineBoresOpen:holes.every(([x,z])=>!test(x,z)),
   metalBetweenBores:test(12.5,12.5),
   makerMountPatternVerified:Boolean(g.userData.B08TopBorePatternOEMVerified),
   topHolePitchMm:g.userData.B08TopHolePitchMm,
   blindDepthCandidateMm:g.userData.B08TopBlindDepthCandidateMm,
   oemThreadDepthVerified:Boolean(g.userData.B08TopThreadDepthOEMVerified),
   remainingBlindFloorMm:2.2,
   blindFloorIsSolid:Boolean(deck.children.find(o=>o.userData.B08BlindBoreFloorCandidate))};
};
window.__modelBActuatorProbe=()=>{
 if(platform!=='B')return {available:false};
 const inspect=(id)=>{
   const root=parts.get(id)?.g;
   if(!root)return {available:false};
   root.updateWorldMatrix(true,true);
   const origin=new THREE.Vector3();root.getWorldPosition(origin);
   const handles=[];
   root.traverse(o=>{
     const meta=o.userData.stageActuatorHandle;
     if(!meta)return;
     const p=new THREE.Vector3();o.getWorldPosition(p);
     const rel=p.sub(origin);
     const axis=Math.abs(rel.x)>=Math.abs(rel.z)?'X':'Z';
     const direction=axis==='X'?(rel.x>=0?'+X':'-X'):(rel.z>=0?'+Z':'-Z');
     handles.push({kind:meta.kind,axis,direction});
   });
   return {
     available:true,
     handles,
     linearHandleCount:handles.filter(h=>h.kind==='linear').length,
     rotaryLockHandleCount:handles.filter(h=>h.kind==='rotary-lock').length,
     axes:[...new Set(handles.filter(h=>h.kind==='linear').map(h=>h.axis))].sort(),
     directions:handles.map(h=>h.direction).sort(),
     xCarriageLocalMm:root.userData.slidingX?.position.x??null,
     depthCarriageLocalMm:root.userData.slidingDepth?.position.z??null,
     singleCarriageLocalMm:root.userData.slidingTop?.position.x??null,
     sideHoleRowsCandidate:root.userData.sideHoleRowsCandidate??null,
     nfpPhotoSideHoleCount:root.userData.nfpPhotoSideHoleCount??0,
     B41TopFourM6MountPatternCandidate:Boolean(root.userData.B41TopFourM6MountPatternCandidate),
     stageBoundaryMarkerCount:root.userData.stageBoundaryMarkerCount??0,
     fixedBaseHeightMm:root.userData.fixedBaseHeightMm??null,
     movingStageHeightMm:root.userData.movingStageHeightMm??null,
     stageRole:root.userData.stageRole??null,
     recessedBaseHeadCount:root.children.filter(o=>o.userData.stageBaseRecessedHead).length,
     fixedBaseFastenerTopMm:root.userData.fixedBaseFastenerTopMm??null,
     belowBaseScrewEngagementMm:root.userData.belowBaseScrewEngagementMm??null,
     screwInterfacingHoleRegistrationVerified:Boolean(root.userData.stageScrewInterfacingHoleRegistrationVerified),
     movingUndersideToFastenerClearanceMm:(()=>{
       const heads=root.children.filter(o=>o.userData.stageBaseRecessedHead);
       const face=root.userData.slidingTop?.children.find(o=>o.userData.sampleStageMovingUnderside);
       if(!heads.length||!face)return null;
       const headTop=Math.max(...heads.map(h=>new THREE.Box3().setFromObject(h).max.y));
       const movingBottom=new THREE.Box3().setFromObject(face).min.y;
       return Number((movingBottom-headTop).toFixed(3));
     })(),
     modelOnlyAxisAnnotations:(()=>{
       const tags=[];root.traverse(obj=>{
         if(obj.userData.modelOnlyAxisAnnotation)tags.push(obj.userData.modelOnlyAxisAnnotation);
       });
       return tags;
     })(),
     worldPosition:origin.toArray()
   };
 };
 return {available:true,B03:inspect('B03'),B08:inspect('B08'),B41:inspect('B41'),B09:inspect('B09'),B10:inspect('B10')};
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
     A02SampleCarriageLocalXmm:parts.get('A02')?.g.userData.slidingX?.position.x??null,
     A15FilmCarriageLocalXmm:parts.get('A15')?.g.userData.slidingX?.position.x??null,
     sampleHeaterWorldXmm:silverSample.position.x,
    sampleLayersMm:silverSample.userData.layerProxies??null,
    sampleRotaryDiameterMm:rotarySample.userData.photo48CandidateRotaryDiameterMm??null,
    sampleRotaryRightAngularMicrometerCount:rotarySample.userData.rightAngularMicrometerCount??0,
    sampleRotaryShortFrontLockCount:rotarySample.userData.shortFrontLockCount??0,
    sampleRulerWithinTolerance:auditV48RulerRegistration().sampleTopWithinVisibleRulerRange,
    samplePhotoRulerSource:V48_RULER_EVIDENCE.A.sampleTopHeightAboveBreadboardMm.photos,
    stageModel:'GCM-VC13M',
    knownProxyGeometryCollisionFree:false,
    glassClampedAndReachable:false,
    globalAssemblyAudit:aWorkingPoseMode?auditAWorkingLayout({
      filmShiftMm:filmShift,filmDepthShiftMm:filmShiftDepth,
      sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle,filmDropMm:filmDrop
    }):auditPlatformAAssembly()
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
 // A 3D sample of BOTH crossed translation axes and B08 yaw. Include
 // travel limits; the higher-resolution straight-segment audit runs
 // separately in src/b-vacuum-routing.js. This is not a continuous proof.
 const shifts=Array.from({length:9},(_,i)=>-12.5+i*3.125);
 const depths=Array.from({length:9},(_,i)=>-12.5+i*3.125);
 const angles=Array.from({length:37},(_,i)=>-90+i*5);
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
 for(const sampleShiftMm of shifts)
 for(const sampleDepthShiftMm of depths)
 for(const sampleAngleDeg of angles){
   const options={sampleShiftMm,sampleDepthShiftMm,sampleAngleDeg};
   const hose=sampleCurve(vacuumHosePath(options),48);
   const wires=electricalHarnessPaths(options);
   for(const wire of wires){
     const centerline=polylineDistance(hose,sampleCurve(wire.points,32));
     const surface=centerline-hoseRadius-wire.radiusMm;
     if(surface<minima[wire.id]){
       minima[wire.id]=surface;
       worst[wire.id]=options;
     }
   }
   posesChecked++;
 }
 return {
   available:true,posesChecked,
   sampleShiftRangeMm:[-12.5,12.5],
   sampleDepthShiftRangeMm:[-12.5,12.5],
   sampleAngleRangeDeg:[-90,90],
   shiftStepMm:3.125,depthStepMm:3.125,angleStepDeg:5,
   curveType:'THREE.CatmullRomCurve3 centripetal; getPointAt arc-length sampling',
   hoseCurveSegments:48,harnessCurveSegments:32,
   minimumSurfaceClearanceMm:minima,worstCasePoses:worst,
   requiredSurfaceClearanceMm:VN50.minimumHarnessSurfaceClearanceMm,
   fullStrokeSplineGridPass:Object.values(minima).every(v=>
     v>VN50.minimumHarnessSurfaceClearanceMm),
   continuousBetweenSamplesProven:false
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
 const ring=pump.children.find(o=>o.userData.G1QuarterThreadReference);
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
 const inlet=new THREE.Vector3(74.2,68,0).applyMatrix4(pump.matrixWorld);
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
// Round stage face with real cut-through mounting holes. A painted
// circle/torus is not a mechanical bore and cannot accept an engaged screw.
function drilledDisc(radius,height,material,bores){
 const shape=new THREE.Shape();
 shape.absarc(0,0,radius,0,2*Math.PI,false);
 addHoles(shape,bores);
 const geo=new THREE.ExtrudeGeometry(shape,{
  depth:height,bevelEnabled:false,curveSegments:96,steps:1
 });
 geo.rotateX(-Math.PI/2);
 return mk(geo,material);
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
// B41/B09 mount through the FIXED 11mm base, beneath a travelling carriage.
// Former screw heads protruded into the translating lower plate.
// Recess the candidate heads inside the base counterbores.
function stageBaseRecessedFasteners(g,id,locations){
 if(!JOINTS[id]||JOINTS[id].count!==locations.length)
  throw Error('Stage base fastening count mismatch '+id);
 const headTopMm=10.85,headH=2.8;
 for(const [x,z] of locations){
  // Head remains recessed, but the shank must traverse the 11mm
  // stationary stage base and engage the lower part by 7mm.
  // -7..8.05 is a display candidate, matching STEP's -7mm engagement.
  const insertionBelowBaseMm=7;
  const shankTopMm=headTopMm-headH;
  const shankLengthMm=shankTopMm+insertionBelowBaseMm;
  const shank=add(g,cyl(2.4,shankLengthMm,mats.steel,
   x,(shankTopMm-insertionBelowBaseMm)/2,z,24));
  shank.userData.stageBelowBaseEngagementMm=insertionBelowBaseMm;
  const head=add(g,cyl(4.2,headH,mats.silver,x,headTopMm-headH/2,z,32));
  const socket=add(g,cyl(1.65,.12,mats.ink,x,headTopMm-.06,z,6));
  head.userData.fastenerHead=true;
  head.userData.stageBaseRecessedHead=true;
  for(const o of [shank,head,socket]){
   o.userData.fastenerProxy=true;o.userData.verifiedFastener=false;
  }
 }
 g.userData.fixedBaseFastenerTopMm=headTopMm;
 g.userData.belowBaseScrewEngagementMm=7;
 g.userData.stageScrewInterfacingHoleRegistrationVerified=false;
 g.userData.fixedBaseNominalTopMm=11;
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
  const stationaryBase=add(g,cub(w,lowerH,d,mats.dark,0,lowerH/2,0));
  if(id==='A15')stationaryBase.userData.A15StationaryMountingBase=true;
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
    // 2026-11-08 two complementary user photographs:
     // SCREEN-FACING photo sees A15 silver slot and (+X) large knob to
     // its LEFT, whereas monitor-left photo sees the VC13M front and
     // both right/left orthogonal knobs. These are two OPPOSING camera
     // sides, NOT a mirror of the platform. Put A15 slot on local -Z,
     // opposite the VC13M positive-Z micrometer face.
     // The slot still moves with its OWN carriage, never with A17.
    const stageFace=carriageX;
    const bar=(x,y,w,h)=>add(stageFace,cub(w,h,1.5,mats.silver,x,y,-33.25));
    const topBar=bar(0,23,42,4);
    bar(0,15,42,4);bar(-17,19,8,4);bar(17,19,8,4);
    topBar.userData.A15Photo194FrontSlottedPlate=true;
    for(const x of [-17,17]){
      const bolt=add(stageFace,cyl(2.2,1.5,mats.steel,x,15,-34.3,24));
      bolt.rotation.x=Math.PI/2;
      bolt.userData.A15Photo194FrontPlateScrewCandidate=true;
    }
    // V79: the old free-standing cylindrical "central control" was not
    // mechanically justified by the photos and is the long-standing floating
    // handle visible in the user's screenshot. Keep the observed slotted plate
    // and its two fasteners, but delete that invented detached knob until its
    // actual linkage/model can be identified.
     g.userData.A15SilverSlotFaceLocalZ=-1;
     g.userData.A15XYActuatorAxes={X:'+X',Y:'+Z'};
    g.userData.A15Photo194SlotDimensionsVerified=false;
    g.userData.A15Photo23TopCounterboreCount=4;
    g.userData.A15Photo23RecessedHeadCount=4;
   }else{
    add(carriageY,cub(w*.94,topH,d*.92,mats.dark,0,lowerH+middleH+topH/2,0));
   }
   // Two REAL distinct crossed micrometer assemblies, per original 97/108 and GCM-T25M2L.
   // V79: continuous support -> spindle -> collar -> drum chain.
   const supportZ=depthHandleSide*(d/2+7);
   const ySupport=add(g,cub(14,11,14,mats.dark,0,lowerH*.5,supportZ));
   ySupport.userData.stageActuatorSupport={kind:'linear',localAxis:'depth'};
   const yStem=add(g,cyl(4.2,30,mats.silver,0,lowerH*.5,depthHandleSide*(d/2+27.5)));yStem.rotation.x=Math.PI/2;
   const yCollar=add(g,cyl(6.4,7,mats.dark,0,lowerH*.5,depthHandleSide*(d/2+43)));yCollar.rotation.x=Math.PI/2;
   const yDrum=add(g,cyl(9,18,mats.silver,0,lowerH*.5,depthHandleSide*(d/2+49.5)));yDrum.rotation.x=Math.PI/2;
   for(let q=0;q<6;q++){const ring=add(g,torus(9.04,.18,mats.ink,0,lowerH*.5,
     depthHandleSide*(d/2+43+q*2.2)));ring.rotation.x=Math.PI/2;}
   yDrum.userData.stageActuatorHandle={kind:'linear',localAxis:'depth'};
   yStem.userData.stageActuatorStem={kind:'linear',localAxis:'depth'};
   yCollar.userData.stageActuatorCollar={kind:'linear',localAxis:'depth'};
   label(g,'机构Y / 场景Z：前后微调',0,lowerH+5,depthHandleSide*(d/2+55));
  }else{
   g.userData.slidingTop=carriageX;
   add(carriageX,cub(w*.94,h-lowerH,d*.92,mats.dark,0,lowerH+(h-lowerH)/2,0));
  }
  const side=handleSide;
  const xSupport=add(g,cub(14,12,14,mats.dark,side*(w/2+7),h-9,actuatorZ));
  xSupport.userData.stageActuatorSupport={kind:'linear',localAxis:'X'};
  const xStem=add(g,cyl(4.2,30,mats.silver,side*(w/2+27.5),h-9,actuatorZ));xStem.rotation.z=Math.PI/2;
  const xCollar=add(g,cyl(6.4,7,mats.dark,side*(w/2+43),h-9,actuatorZ));xCollar.rotation.z=Math.PI/2;
  const xDrum=add(g,cyl(9,18,mats.silver,side*(w/2+49.5),h-9,actuatorZ));xDrum.rotation.z=Math.PI/2;
  for(let q=0;q<6;q++){const ring=add(g,torus(9.04,.18,mats.ink,
    side*(w/2+43+q*2.2),h-9,actuatorZ));ring.rotation.y=Math.PI/2;}
  xDrum.userData.stageActuatorHandle={kind:'linear',localAxis:'X'};
  xStem.userData.stageActuatorStem={kind:'linear',localAxis:'X'};
  xCollar.userData.stageActuatorCollar={kind:'linear',localAxis:'X'};
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
 },{explode:[-15,18,0],moveFilm:true,facingYaw:aFilmYaw});
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
 const aBent=photo94BracketCandidate({stageCenterX:ax,stageTopY:164,
   topPlateWidth:aWorkingPoseMode?A_WORKING_LAYOUT.lBracketTopWidthMm:undefined,
   leftOverhangMm:aWorkingPoseMode?A_WORKING_LAYOUT.lBracketOverhangMm:undefined,
   // V79: retain ONE physical left-handed sheet definition and rotate the
   // complete film branch 180° for the installed transfer orientation.
   // Do not mirror only the bracket while leaving the stages backwards.
   handedness:'left',
   verticalLegLength:aWorkingPoseMode?A_WORKING_LAYOUT.lLegLengthMm:72,
   sheetFrontZmm:aWorkingPoseMode?0:13});
 const outwardSign=-1;
 addPart('A05',ax,164,az,g=>{
   const localX=aBent.centerX-ax;
   const legLocalX=aBent.legX-ax+aBent.metalThickness/2;
   add(g,cub(aBent.topPlateWidth,aBent.metalThickness,aBent.topPlateDepth,
       mats.black,localX,aBent.metalThickness/2,aBent.sheetFrontZ));
   const verticalSheet=add(g,cub(aBent.metalThickness,aBent.verticalLegLength,
       aBent.topPlateDepth,mats.black,
       legLocalX,-aBent.verticalLegLength/2,aBent.sheetFrontZ));
   verticalSheet.userData.A05VerticalSheetWeb=true;
   for(const xx of aBent.topBoltWorldX){
     const hex=jointHead(g,xx-ax,aBent.metalThickness,aBent.sheetFrontZ,
       {headR:3.1,shankR:1.5,shankL:4});
     hex.userData.photo94Fastener=true;hex.material=mats.dark;
   }
   // V79: the foot is a plain folded support. The previous two VERTICAL
   // through-bores were an invented consequence of a wrong screw axis.
   const footX=legLocalX+outwardSign*16;
   const foot=add(g,plate(32,14,2.5,mats.black,[]));
   foot.position.set(footX,-aBent.verticalLegLength,aBent.sheetFrontZ);
   foot.userData.A05OutwardFootCandidate=true;
   foot.userData.A05ActualThroughBoreCount=0;
   foot.userData.A05NoVerticalClampScrewBores=true;
   g.userData.photo94BentSheet=true;
   g.userData.verifiedPhotoBentCorner=true;
   g.userData.photoBracketDatums=aBent;
   g.userData.installedYawDeg=aWorkingPoseMode?180:0;
   label(g,aWorkingPoseMode?
     'A05 · 整套载玻片支路旋转180°后的转移朝向':
     'A05 · 照片参考朝向（仅用于实拍比对）',-24,17,0);
 },{explode:[-13,65,0],moveFilm:true,moveFilmVertical:true,facingYaw:aFilmYaw});

 const bracketLegLocalX=aBent.legX-ax+aBent.metalThickness/2;
 // In LOCAL photo coordinates the slide extends farther to -X. The whole
 // installed film branch is then yawed 180°, placing the PDMS toward +X /
 // the sample stage. This is a rigid-body rotation, not a mirrored part.
 const glassNearX=bracketLegLocalX+outwardSign*34;
 const glassCenterX=glassNearX+outwardSign*38;
 const glassCenterY=-aBent.verticalLegLength+1.0;
 const clampLengthX=28;
 const clampCenterX=glassNearX+outwardSign*14;

 addPart('A05C',ax,164,az,g=>{
   const footBottomY=-aBent.verticalLegLength;
   // Unverified but mechanically coherent side clamp: a support ledge carries
   // the slide while opposite side rails constrain its two long edges.
   const neck=add(g,cub(5,2.5,14,mats.dark,
     bracketLegLocalX+outwardSign*32.5,footBottomY-1.25,aBent.sheetFrontZ));
   neck.userData.A05CBracketNeck=true;
   const ledge=add(g,cub(clampLengthX,1,30,mats.dark,
     clampCenterX,glassCenterY-1,aBent.sheetFrontZ));
   ledge.userData.A05CSupportLedge=true;
   const fixedRail=add(g,cub(clampLengthX,3,2,mats.dark,
     clampCenterX,glassCenterY,aBent.sheetFrontZ-14));
   fixedRail.userData.A05CFixedSideRail=true;
   const pressureRail=add(g,cub(clampLengthX,3,2,mats.silver,
     clampCenterX,glassCenterY,aBent.sheetFrontZ+14));
   pressureRail.userData.A05CPressureRail=true;
   // Two threaded bosses receive screws whose AXES run along scene Z,
   // exactly parallel to the 26mm glass short edge.
   const screwXOffsets=[5,23];
   for(const q of screwXOffsets){
     const sxLocal=glassNearX+outwardSign*q;
     const boss=add(g,cub(7,7,7,mats.dark,
       sxLocal,glassCenterY,aBent.sheetFrontZ+18.5));
     boss.userData.A05CSideScrewBoss=true;
   }
   g.userData.A05CClampingStackType='support ledge + fixed rail + moving pressure rail';
   g.userData.unverifiedClampMechanism=true;
   g.userData.glassGripLengthMmCandidate=clampLengthX;
   g.userData.screwAxisParallelToGlassShortEdge=true;
   g.userData.actualClampOEM=false;
   label(g,'A05C · 侧向压紧结构：螺杆轴线 ∥ 玻片26mm短边（尺寸待实测）',
     clampCenterX,18,aBent.sheetFrontZ);
 },{explode:[-13,65,0],moveFilm:true,moveFilmVertical:true,facingYaw:aFilmYaw});

 addPart('A05CS',ax,164,az,g=>{
   const screwXOffsets=[5,23];
   for(const q of screwXOffsets){
     const screwX=glassNearX+outwardSign*q;
     // Shaft runs along local Z / glass short-edge direction. Its inner end
     // engages the pressure rail; it never passes vertically through A05.
     const shaft=add(g,cyl(1.4,20,mats.steel,
       screwX,glassCenterY,aBent.sheetFrontZ+24));
     shaft.rotation.x=Math.PI/2;
     shaft.userData.A05CSCandidateShank=true;
     shaft.userData.A05CSShaftAxis='glass-short-edge-Z';
     shaft.userData.A05CSContactsPressureRail=true;
     const hub=add(g,cyl(3.0,3,mats.silver,
       screwX,glassCenterY,aBent.sheetFrontZ+35.5));
     hub.rotation.x=Math.PI/2;
     hub.userData.A05CSScrewHead=true;
     hub.userData.photo194WingFastenerCandidate=true;
     for(const wingSide of [-1,1]){
       const wing=add(g,cub(5,2.8,1.6,mats.steel,
         screwX+wingSide*3.0,glassCenterY,aBent.sheetFrontZ+37));
       wing.rotation.z=wingSide*.3;
       wing.userData.A05CSWingEarPlane='perpendicular-to-Z-shaft';
     }
   }
   g.userData.visibleWingFastenerCount=2;
   g.userData.screwShaftAxis='scene-Z / parallel to 26mm glass short edge';
   g.userData.screwPitchAlongGlassLengthMmCandidate=18;
   g.userData.realOEMThreadVerified=false;
   label(g,'A05CS · 2枚侧向夹紧螺钉 · 轴线平行玻片短边',clampCenterX,16,aBent.sheetFrontZ+38);
 },{explode:[-13,65,0],moveFilm:true,moveFilmVertical:true,facingYaw:aFilmYaw});

 addPart('A05G',ax,164,az,g=>{
   const slide=add(g,cub(76,1,26,mats.glass,
     glassCenterX,glassCenterY,aBent.sheetFrontZ));
   slide.userData.candidateStandardSlide=[76,26,1];
   slide.userData.glassShortEdgeAxisLocal='Z';
   const pdmsX=glassNearX+outwardSign*68;
   const stamp=add(g,cub(8,1.8,8,mats.ceramic,
     pdmsX,glassCenterY-1.4,aBent.sheetFrontZ));
   stamp.userData.A05GStampRightMarginMm=4;
   stamp.userData.A05GTransferTarget='A07W';
   g.userData.stampAtRightGlassEdge=true;
   g.userData.clampLeftOutsideHeaterCandidate=true;
   g.userData.glassToHolderPhysicallyVerified=false;
   g.userData.unregisteredGlobalPose=false;
   g.userData.requiredInstalledTransferElement=true;
   label(g,aWorkingPoseMode?
     'A05G · 76×26×1mm玻片候选 · 180°整机转向后PDMS朝向样品':
     'A05G · 实物装配必需玻片；当前为照片参考朝向',
     glassCenterX,15,aBent.sheetFrontZ);
 },{explode:[-13,65,0],moveFilm:true,moveFilmVertical:true,facingYaw:aFilmYaw});
 // V79: glass is part of the installed transfer mechanism. Exact clamp SKU,
 // thread and slide dimensions remain pending physical measurement.
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
  // Overlap stem into both knob and actuator blocks. Previously the
   // stem and drum merely met on a mathematically zero-area end face.
   const angularStem=add(g,cyl(5.5,42,mats.silver,51,14,0));
   angularStem.userData.A06CoupledMicrometerStem=true;
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
  // Photo191/193: separate front slotted adjustment plate and fasteners.
  const frontPlate=add(g,cub(36,16,2,mats.silver,0,14,33.4));
  frontPlate.userData.A07FrontSlottedPlateCandidate=true;
  add(g,cub(18,2.6,.8,mats.ink,0,14,34.55));
  const adjustStem=add(g,cyl(2.7,5,mats.steel,0,14,37.2));adjustStem.rotation.x=Math.PI/2;
  const adjustKnob=add(g,cyl(5.2,3,mats.silver,0,14,41));adjustKnob.rotation.x=Math.PI/2;
  for(const x of [-12,12]){
    const screw=add(g,cyl(2.2,2,mats.steel,x,7,35));screw.rotation.x=Math.PI/2;
  }
  g.userData.rulerSampleTopAboveBoardMm=89.2;
  g.userData.layerProxies=[9,7,12];
  g.userData.intermediateMaterialUnknown=true;
  g.userData.vendorHolePatternUnverified=true;
  label(g,'A07样品台 · 实拍三层 / 顶面高于面包板约89mm',0,40,0);
 },{explode:[0,26,0],translateSample:true,rotateSample:true});
 addPart('A07W',sx,109.2,0,g=>{
    const sampleChip=add(g,cub(28,1.4,28,mats.glass,0,.7,0));
    sampleChip.userData.A07SampleChipProxy=true;
    sampleChip.userData.A07SampleChipThicknessUnverified=true;
    g.userData.sampleMaterialAndThicknessUnverified=true;
    label(g,'A07W · 独立样品片28×28×1.4mm几何候选，非厂家尺寸',0,14,0);
 },{explode:[0,45,0],translateSample:true,rotateSample:true});
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
    // V59: taller photographed camera/microscope stack; post length remains candidate.
    add(g,cyl(13,372,mats.steel,0,199,0)); // fixed optical post
    const movingBoom=new THREE.Group();g.add(movingBoom);
    // V69: old solid support penetrated A10 Ø26 stationary column.
    // Make an actual Ø26.6 axial clearance bore around the post.
    // Match the REAR face of the microscope housing at world Z=-44.
    // Previously 127mm boom ended at Z=-3.5, penetrating the solid
    // A18 head by 40.5mm. Shorten to 86mm (world Z -130..-44).
    // plate() rotates shape +Y into scene -Z, so the stationary Ø26
    // support post at local Z=0 has a genuine Ø26.6 bore at shape Y=25.
    const boomShell=add(movingBoom,plate(34,86,25,mats.dark,
      [[0,25,13.3]]));
    boomShell.position.set(0,187.5,25);
    boomShell.userData.A10BoomFrontFaceJointToA18=true;
    boomShell.userData.A10BoomLengthCandidateMm=86;
    boomShell.userData.A10BoomTruePostThroughBore=true;
    boomShell.userData.A10BoreDiameterCandidateMm=26.6;
    movingBoom.userData.A10AdjustableBoomCandidate=true;
    g.userData.opticsMovingBoom=movingBoom;
    g.userData.fourTrueCandidateFootBores=true;
    g.userData.actualOEMFasteningVerified=false;
    label(g,'A10显微镜支架 · 底脚四孔及螺钉均为候选',0,267,60);
 },{explode:[0,15,-30]});
 addPart('A08',sx,235,0,g=>{
  // OEM TTL200-A housing is 28mm long; 200mm is focal length.
  // The older 85mm single filled cylinder was not a manufacturer body.
  add(g,cyl(26,28,mats.black,0,14,0));
  add(g,cyl(25.7,2,mats.silver,0,1,0));
  label(g,'Thorlabs TTL200-A · 28mm壳体 / SM2外螺纹',0,41,0);
 },{explode:[0,35,0]});
 addPart('A09',sx,323,0,g=>{
  add(g,cub(50,45,44,mats.dark,0,22.5,0));
  add(g,cyl(15,12,mats.silver,0,0,0));
  label(g,'Daheng Imaging 工业相机',0,72,0);
 },{explode:[0,92,0]});
 addPart('A11',155,184,60,g=>{
  // Thorlabs MWWHL4 actual heat-sink housing Ø30.5mm, SM1 female port.
  // SM1RC slip ring is a vendor-supported mounting OPTION, not yet
  // identified in the user's actual installed photograph.
  const ledBody=add(g,cyl(15.25,33,mats.dark,0,16.5,0));
  ledBody.userData.A11OEMHousingDiameterMm=30.5;
  add(g,cyl(11,8,mats.ceramic,0,35,0));
  const slipRing=add(g,sleeve(17.5,15.35,8,mats.black,0,30,0,'y'));
  slipRing.userData.A11OEMSlipRingCandidate=true;
  g.userData.A11RingModel='SM1RC (vendor-supported option, NOT photographed confirmation)';
  // V75: former 80mm slanted rod ended without an actual mount.
  // Keep the lamp attached to the A18 housing-side surface through
  // a continuous flexible support proxy (real fixing remains UNKNOWN).
  // A18 right face is world x=128; root at x=131 with a
  // Ø6 flexible rod makes TANGENT solid contact (no deep penetration).
  // Lamp rear face is world z=47; rod ends z=44 with radius 3.
  const lampMountPoints=[[-24,17,-35],[-19,20,-30],[-10,27,-26],
    [-3,29,-23],[0,30,-20.5]];
  const gooseneck=add(g,tube(lampMountPoints,3,mats.steel));
  gooseneck.userData.A11PhysicallyConnectedSupportProxy=true;
  const rootCollar=add(g,cyl(5,1.2,mats.black,-26.4,17,-35,28));
  rootCollar.rotation.z=Math.PI/2;
  rootCollar.userData.A11A18SideMountProxy=true;
  g.userData.A11MountingMethodVerified=false;
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
 addPart('A14',sx,257,0,g=>{
   // V59: 66mm open sleeve overlaps A08 by 6mm and meets camera A09.
   // Thread engagement and camera flange remain unverified.
   add(g,sleeve(28,26.1,66,mats.dark,0,33,0,'y'));
   label(g,'SM2接口候选镜筒 · 长66mm含6mm装配重叠 / 相机端未认证',0,80,0);
 },{explode:[0,25,0]});
 addPart('A18',sx,200,0,g=>{
   // Photo191/192: black microscope head, horizontal tube and bilateral focus drums.
   // Dimensions are photo-proportioned candidates, not OEM data.
   add(g,cub(100,70,88,mats.dark,0,0,0));
   add(g,cub(86,4,78,mats.black,0,-31,0));
   add(g,cyl(22,18,mats.black,0,44,0));
   const opticalArm=add(g,cyl(16,160,mats.black,80,40,0));opticalArm.rotation.z=Math.PI/2;
   opticalArm.userData.A18HorizontalTubeCandidate=true;
   for(const x of [20,115,135]){
     const collar=add(g,torus(16.4,.65,mats.ink,x,40,0));collar.rotation.y=Math.PI/2;
   }
   for(const sign of [-1,1]){
     const coarse=add(g,cyl(25,18,mats.black,sign*59,-2,0));coarse.rotation.z=Math.PI/2;
     coarse.userData.A18CoarseFocusKnob=true;
     const fine=add(g,cyl(16,6,mats.silver,sign*71,-2,0));fine.rotation.z=Math.PI/2;
     fine.userData.A18FineFocusKnob=true;
     for(let i=0;i<8;i++){
       const groove=add(g,torus(25,.35,mats.ink,sign*(52+i*2),-2,0));groove.rotation.y=Math.PI/2;
     }
   }
   const lockLever=add(g,cyl(3.5,24,mats.black,68,20,0));lockLever.rotation.z=-Math.PI/5;
   g.userData.microscopeHeadModelUnverified=true;g.userData.focusKnobPairCount=2;
   label(g,'A18 显微镜主机头 / 双侧调焦 · 型号待识别',0,48,0);
 },{explode:[0,35,0]});
 addPart('A19',sx,160,0,g=>{
   // Only the two photographed installed objectives are drawn.
   add(g,cyl(36,10,mats.black,0,0,0));
   add(g,torus(34,1,mats.steel,0,0,0));
   add(g,cyl(18,5,mats.dark,0,7.5,0));
   // V66 photo191-193: the LEFT installed objective projects obliquely
   // toward the left; the central/right working objective is near vertical.
   // The old pair of parallel vertical tubes was visually/optically wrong.
   // 22.5° is a photo-proportioned display candidate, NOT OEM turret indexing.
   const objective=(x,angle,labelText,bandMat,side)=>{
     const pivot=new THREE.Group();pivot.position.set(x,-5,0);
     pivot.rotation.z=angle;g.add(pivot);
     pivot.userData.A19ObjectivePivot=side;
     const barrel=add(pivot,cyl(11.5,39,mats.black,0,-19.5,0));
     barrel.userData.objectiveLabel=labelText;
     barrel.userData.A19ObjectiveBarrel=side;
     const band=add(pivot,cyl(12.8,2,bandMat,0,-38,0));
     band.userData.A19ObjectiveBand=side;
     const lens=add(pivot,cyl(7.5,1.2,mats.glass,0,-39.5,0));
     lens.userData.objectiveOpticProxy=true;
     return pivot;
   };
   objective(-18,-Math.PI/8,'JH-TOP MPLAN 5x/0.10?',mats.copper,'left');
   objective(18,0,'Olympus PlanFL 10x/0.40?',mats.silver,'center');
   g.userData.installedObjectiveCount=2;g.userData.objectiveTurretPortCountUnverified=true;
   label(g,'A19 物镜转换盘 · 5×与10×物镜（铭牌待复核）',0,22,0);
 },{explode:[0,22,0]});
 addPart('A20',sx,323,0,g=>{
   const points=[[18,44,0],[22,65,-12],[40,80,-24],[60,72,-22],[74,50,-8],[80,22,8],[76,-18,18]];
   const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
   const cable=add(g,new THREE.Mesh(new THREE.TubeGeometry(curve,80,2.4,10,false),mats.black));
   cable.userData.A20CameraCableRouteCandidate=true;g.userData.electricalInterfaceVerified=false;
   label(g,'A20 相机线缆 · 走线路径候选',82,24,18);
 },{explode:[0,45,20]});
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
   input.onchange=()=>parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked&&!v.g.userData.hiddenBecauseNotPhotographed});
   const dot=document.createElement('i');dot.className='dot';dot.style.background=cfg.color;
   const tx=document.createElement('span');tx.textContent=cfg.name;
   const count=document.createElement('span');count.className='count';count.textContent=subset.length+' 件';
   line.append(input,dot,tx,count);list.append(line);
   // Every checked category MUST be visible. An older optimization
   // silently hid all external objects while leaving its checkbox ON;
   // this made B36/B19/B21/B23 disappear despite valid STEP/BOM.
   parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked&&!v.g.userData.hiddenBecauseNotPhotographed});
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
 const b08Fit=(platform==='B'&&(part.id==='B08'||part.id==='B35'))?
   auditB08ToB35Mount({rotaryCenterX:CONFIG.B.sampleX,
     boardCenterX:CONFIG.B.sampleBoardCenterX}):null;
 const b08RegistrationText=b08Fit?.gridPossibleAfterRigidTranslation?
   '仅从孔网相位计算，整台旋转台平移至少 '+
   b08Fit.minimumRigidTranslationMm.toFixed(2)+' mm，才能使4个底孔同时落在网格上。'+
   '两个最近的等距候选中心分别为 '+
   b08Fit.nearestFullFourHoleRegistrations.slice(0,2).map(c=>
     '(X='+c.centerMm[0].toFixed(1)+', Z='+c.centerMm[1].toFixed(1)+
     ') mm [ΔX='+c.translationMm[0].toFixed(1)+
     ', ΔZ='+c.translationMm[1].toFixed(1)+' mm]').join(' 和 ')+
   '。它们只是数学上可行的平移，不代表真实安装位置。':
   '当前候选孔网不存在能让4孔同时对位且Ø94mm底座完整留在板内的平移方案。';
 const b08FitHtml=b08Fit?
   '<div class="field" id="b08-b35-mount-fit" data-direct-fit="'+
   b08Fit.candidateGridDirectFit+'" data-mismatch-mm="'+
   b08Fit.maxMismatchMm+'" data-minimum-rigid-translation-mm="'+
   (b08Fit.minimumRigidTranslationMm??'unknown')+
   '"><b>B08↔B35 四孔整体配准校核（V78）</b><p>'+
   '按照GCM-1107M原厂4孔50×50mm和B35候选25mm孔网进行比较。'+
   '当前四个孔与各自最近网格孔的最大中心偏差为 '+
   b08Fit.maxMismatchMm.toFixed(2)+' mm，表面接触不能等同于螺接。'+
   b08RegistrationText+
   'B35真实孔系原点、B08安装位置、显微镜光轴及邻接零件干涉尚未实测，'+
   '因此模型不会自动移动旋转台，也不会擅自添加螺丝或转接板。</p></div>':'';
 const b35FastenerAudit=(platform==='B'&&(part.id==='B16'||part.id==='B35'))?
   auditB35MicroscopeFasteners({boardCenterX:CONFIG.B.sampleBoardCenterX,
     microscopeCenterX:87.5,microscopeCenterZ:-112.5,
     boardThicknessMm:CONFIG.B.sampleBoardRiseMm}):null;
 const b35FastenerHtml=b35FastenerAudit?
   '<div class="field" id="b35-microscope-fastener-audit" data-bolt-align="'+
   b35FastenerAudit.boardBoltPatternAligned+'" data-mismatch-mm="'+
   b35FastenerAudit.maxMismatchMm.toFixed(2)+'"><b>B35↔B16孔系配准（V51）</b><p>'+
   'B16底座为4个Ø6.5mm候选M6间隙通孔，对位B35上25mm间距的Ø5mm候选M6攻丝底孔。'+
   'B35的120个候选网格孔已按全厚贯通孔建模，非旧版2mm装饰盲孔；螺纹本体未建模。'+
   '当前四孔中心最大偏差为 '+
   b35FastenerAudit.maxMismatchMm.toFixed(1)+' mm。'+
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

 const isAPart=platform==='A'&&['A17','A15','A03','A04L','A04',
   'A05','A05C','A05G','A16','A06','A02','A07'].includes(part.id);
 const aRigAudit=isAPart?(aWorkingPoseMode?
   auditAWorkingLayout({filmShiftMm:filmShift,filmDepthShiftMm:filmShiftDepth,
     sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle,filmDropMm:filmDrop}):
   auditPlatformAAssembly()):null;
 const aRigHtml=aRigAudit?(aWorkingPoseMode?
   '<div class="field" id="platform-a-unregistered-assembly" data-accepted="false"'+
   ' data-gap-mm="'+aRigAudit.clampHeaterClearanceMm+'">'+
   '<b>A操作位置候选 · 非实物配准</b><p>这是一种假设A05折边向右、折腿缩为52.1mm、膜侧磁座中心X=-82.75mm的工程构型。'+
   'A17与A16底座平面间隔 '+aRigAudit.footprintGapMm+
   'mm；夹具到加热台X向边缘间隔 '+aRigAudit.clampHeaterClearanceMm+
   'mm；右端PDMS与A07样品片表面Y向间隙 '+aRigAudit.verticalStampGapMm+
   'mm。可切换照片94原始左折边作对比；此构型不能证明真实A17孔系、A05夹具、光学工作距离、完整碰撞安全或可加工性。</p></div>':
   '<div class="field" id="platform-a-unregistered-assembly" data-accepted="false"'+
   ' data-gap-mm="'+aRigAudit.optimisticResidualHorizontalGapMm+'">'+
   '<b>照片94左折边 · 全局位置未配准</b><p>原始局部方向下，薄L片末端至A07样品台仍有约 '+
   aRigAudit.optimisticResidualHorizontalGapMm+
   'mm的场景X缺口（不是实物测量），翻转假设也未证实。'+
   'A05C夹具、A17磁座型号/孔位及绝对位置均未知；不能据此加工。</p></div>'):'';
 const interfaceHtml=reviews.length?reviews.map(item=>'<p><b>'+esc(item.id)+' · 待核验</b> '+esc(item.known)+'<span class="marked-note">尚需确认：'+esc(item.missing.join('、'))+'</span></p>').join(''):'<p>当前未建立该部件的独立接口验收记录；外观与报价不代表装配验收。</p>'; 
 el.innerHTML='<span class="status '+part.level+'">'+part.level+' · '+esc(levelMeaning[part.level])+'</span>'+
 '<h2>'+esc(part.name)+'</h2><p class="meta">'+esc(part.maker)+' · '+esc(part.model)+'</p>'+
 '<div class="field"><b>编号 / 分组</b>'+esc(part.id)+' · '+esc(groups[part.group].name)+'</div>'+
 '<div class="field"><b>外形/尺寸/孔位（mm）</b><p>'+esc(part.dims)+'</p></div>'+
 '<div class="field"><b>几何及功能</b><p>'+esc(part.detail)+'</p></div>'+
 '<div class="field"><b>连接接口与制造限制</b><p>'+esc(part.interfaceNote)+'</p></div>'+
 '<div class="field" id="interface-review-panel"><b>物理装配接口验收</b>'+interfaceHtml+'</div>'+
 hardwareHtml+installHtml+suctionHtml+vacuumFitHtml+axisHtml+holderQAHtml+b35FastenerHtml+b08FitHtml+aRigHtml+photo94QAHtml+photo95QAHtml+
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
 // Selection from either the 3D meshes or BOM must show the corresponding
 // ACTUAL photo thumbnails, and clearly mark unavailable originals.
 mountPhotoEvidence(el,platform,part.id);
}
function selectPart(id){
 if(active&&active.g)active.g.traverse(o=>{
   if(o.isMesh&&o.userData.originalMat){
      o.material=o.userData.originalMat;
      delete o.userData.originalMat;
   }
 });
 const v=id?parts.get(id):null;
 const metadata=id?activeParts().find(p=>p.id===id):null;
 active=v||null;
 $('restore-cad').disabled=!Boolean(v?.g?.userData.vendorImport);
 if(!v){
   // A05C/A05G are BOM-only provisional components; selecting them
   // must show their evidence instead of opening an empty detail pane.
   updateDetail(metadata??null);selectedLabels();clearMeasurement();
   $('hover-help').textContent=metadata?
     id+' · 当前仅有BOM或待验证装配，查看实物照片与接口清单':
     '点击零件查看尺寸、来源和供应商；点击空白取消';
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
 let aPoseAudit=platform==='A'&&aWorkingPoseMode?auditAWorkingLayout({
   filmShiftMm:filmShift,filmDepthShiftMm:filmShiftDepth,
   sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle,filmDropMm:filmDrop
 }):null;
 if(aPoseAudit&&filmDrop>0&&!aPoseAudit.candidateCanLower){
   filmDrop=0;
   $('film-drop').value='0';$('film-drop-value').textContent='0.0 mm';
   aPoseAudit=auditAWorkingLayout({filmShiftMm:filmShift,
     filmDepthShiftMm:filmShiftDepth,sampleShiftMm:sampleShift,
     sampleAngleDeg:sampleAngle,filmDropMm:0});
 }
 if($('a-working-metrics')&&aPoseAudit){
   $('a-working-metrics').textContent='磁座/样品底座分离 '+aPoseAudit.footprintGapMm.toFixed(1)+
     ' mm；夹具距热台边缘 '+aPoseAudit.clampHeaterClearanceMm.toFixed(1)+
     ' mm；印章竖直间隙 '+aPoseAudit.verticalStampGapMm.toFixed(1)+' mm。'+
     (aPoseAudit.candidateCanLower?'当前姿态允许几何下降预览。':
       '当前旋转/平移姿态不允许下降；须先调整夹具/印章位置。')+
     ' 以上皆为场景候选尺寸，非照片测量或实际设备安全认证。';
 }
 const motionAudit=platform==='B'&&!bPhoto94Mode?
   auditBLoweringPose({filmShiftX:filmShift,sampleShiftX:sampleShift,
     sampleDepthShiftMm:sampleShiftDepth,sampleAngleDeg:sampleAngle,
     filmVerticalDropMm:filmDrop,filmDepthShiftMm:filmShiftDepth}):null;
 if(motionAudit?.possibleClash&&filmDrop>0){
   filmDrop=0;
   if($('film-drop'))$('film-drop').value='0';
   if($('film-drop-value'))$('film-drop-value').textContent='0.0 mm';
 }
 if($('lowering-clearance')){
   $('lowering-clearance').textContent=motionAudit?
     '夹具与热台X向保守间隙：'+motionAudit.planarGapMm.toFixed(1)+' mm'+
       (motionAudit.possibleClash?'；当前平移/旋转姿态下禁用下降':'；下降检查允许接触印章'):
     aPoseAudit?
       'A操作位置仅为几何假设：夹具至热台 '+aPoseAudit.clampHeaterClearanceMm.toFixed(1)+
         ' mm；PDMS垂直间隙 '+aPoseAudit.verticalStampGapMm.toFixed(1)+' mm；'+
         (aPoseAudit.candidateCanLower?'允许运动预览':'当前姿态禁止继续下降')+
         '。实物夹具、磁座和安装朝向未验证。':
     '平台 A · 照片94原始左折边姿态，全局位置未配准；VC13M升降仅供演示，不可据此认为可转移';
 }
 parts.forEach(({g,base,part,explode,moveFilm,moveFilmVertical,translateSample,translateSampleDepth,rotateSample,facingYaw=0})=>{
  const off=explode||[0,0,0],fx=moveFilm?filmShift:0,fz=moveFilm?filmShiftDepth:0;
  const sx=translateSample?sampleShift:0,sz=translateSampleDepth?sampleShiftDepth:0;
  // The two sample axes remain independent and rotate together with B08.
  const travelX=rotateSample?stageLocalTranslation(sx,angle):{x:sx,z:0};
  const travelZ=rotateSample?stageLocalDepthTranslation(sz,angle):{x:0,z:sz};
  const dx=travelX.x+travelZ.x,dz=travelX.z+travelZ.z;
  // Only selected unverified working pose has a 13mm raised VC13M output.
  // Downward preview approaches the original static STEP lower-limit
  // without forcing the output plate through the stationary upright.
  const aLift=platform==='A'&&aWorkingPoseMode?13:0;
  // V68: the original raised A05G slide intersects the modelled A19
  // objectives. Retract the COMPLETE optical stack, including the
  // microscope carriage, as a conservative visual parking hypothesis.
  // Do not mistake 18mm for measured/OEM focus travel or actual working distance.
  const parkOptics=platform==='A'&&aWorkingPoseMode&&
    ['A08','A09','A11','A14','A18','A19','A20'].includes(part.id);
  const opticsLift=parkOptics?A_WORKING_LAYOUT.opticalParkingLiftMm:0;
  g.position.set(base.x+off[0]*e+fx+dx,
    base.y+off[1]*e+(moveFilmVertical?aLift-filmDrop:0)+opticsLift,
    base.z+off[2]*e+dz+fz);
  g.rotation.y=(rotateSample?angle:0)+facingYaw;
  if(platform==='A'&&part.id==='A10'&&g.userData.opticsMovingBoom){
    // Only the horizontal imaging-arm clamp follows the optical head.
    // A10 breadboard foot and 372mm column remain FIXED.
    g.userData.opticsMovingBoom.position.y=
      aWorkingPoseMode?A_WORKING_LAYOUT.opticalParkingLiftMm:0;
  }
  if(g.userData.verticalCarriage)
    g.userData.verticalCarriage.position.y=
      (platform==='A'&&part.id==='A03'?aLift:0)-filmDrop;
  if(g.userData.slidingX){
    // A physical X carriage carries a SECOND, nested depth carriage.
    // B03 has a yaw-180 installation; local negative X maps to world +X.
    // A02 is the SAMPLE-side X carriage. It must follow the sample
     // slider, not the unrelated film-side A15 slider. The previous
     // shared filmShift branch physically disconnected A02 from A07.
     g.userData.slidingX.position.x=part.id==='A02'?sampleShift:
       part.id==='B03'&&!bPhoto94Mode?-filmShift:filmShift;
    if(g.userData.slidingDepth)g.userData.slidingDepth.position.z=part.id==='B03'&&!bPhoto94Mode?-filmShiftDepth:filmShiftDepth;
  }else if(g.userData.slidingTop){
    g.userData.slidingTop.position.x=part.id==='B09'?-sampleShift:
      part.id==='B41'?-sampleShiftDepth:part.id==='A02'?sampleShift:0;
  }
 });
 if(platform==='A'&&aWorkingPoseMode){
   const o=window.__modelAOpticalClearanceProbe?.();
   if(o?.available){
     if(o.currentBroadphaseCollisions.length){
       if($('lowering-clearance'))$('lowering-clearance').textContent=
         '物镜与玻片候选包络相交，当前运动预览不得作为可用装配！';
     }else if($('lowering-clearance')){
       $('lowering-clearance').textContent+='；物镜最低端至玻片上表面名义垂直间隙 '+o.verticalGapMm.toFixed(1)+
         ' mm（整组光学部件退避 '+o.actualParkingLiftMm+' mm 仅供避碰演示，非实物调焦行程）。';
     }
     if($('a-working-metrics'))$('a-working-metrics').textContent+=
       ' 光学退避 '+o.actualParkingLiftMm+'mm：'+
       (o.currentBroadphaseCollisions.length?'包络冲突':'场景包络未冲突')+
       '；未经实物工作距离和对焦行程验证。';
   }
 }
 if(sampleSubstrate&&platform==='B'){
   const tx=stageLocalTranslation(sampleShift,angle);
   const tz=stageLocalDepthTranslation(sampleShiftDepth,angle);
   sampleSubstrate.position.set(CONFIG.B.sampleX+tx.x+tz.x,
     121.5+CONFIG.B.sampleBoardRiseMm,tx.z+tz.z);
   sampleSubstrate.rotation.y=angle;
 }
 if(platform==='B'){
   // B08 fixed body remains still; its top face rotates with B41.
   const deck=parts.get('B08')?.g.userData.rotatingDeck;
   if(deck)deck.rotation.y=angle;
   refreshHeatingControlHarness();refreshVacuumHoseB();
 }
 if(active)updateMeasurement();
}
function resetScene(){
 // Each platform has its own independent BOM; prevent previous queries from hiding rows.
 if($('bom-query'))$('bom-query').value='';
 if($('priced-only'))$('priced-only').checked=false;
 active=null;clearMeasurement();sampleSubstrate=null;
 $('hover-help').textContent='点击零件显示唯一标签及尺寸；点空白取消';
 $('axis-confidence-note').textContent=platform==='B'?
  'B：样品侧为B08无外伸手柄旋转台 + B41下层Y（前后） + B09上层X（左右）单轴NFP-1462C。两级台体用视觉色差、接合线和X/Y字样区分（非实物铭牌/材质差异）；B41精确型号、孔系和行程待核。B03载玻片侧为另一套双轴T25M。':
  'A：照片94左折边的G40M60L上摆角及A04L下摆角是历史实拍约束；当前'+
   (aWorkingPoseMode?'在单独的V58工程候选中镜像为右折边、改用52.1mm场景腿长，并将磁座重新配准到-82.75mm，均未由实物证实。':'显示照片94原局部朝向。')+
   'A05C夹具、A17磁座型号与孔系未知；操作姿态不等于设备可靠性认证。';
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
   const required=['B01','B35','B03','B07','B08','B41','B09','B10','B11','B12',
     'B13','B14','B15','B16','B17','B18','B19','B20','B21','B22','B23','B36','B37','B38','B39','B40'];
   if(bPhoto94Mode)required.push('B29','B30','B31','B32');
   else required.push('B02','B04','B05','B06','B24','B25','B26','B27','B28','B33','B34');
   const missing=required.filter(id=>!parts.has(id));
   if(missing.length)throw new Error('Model B missing required scene components: '+missing.join(', '));
 }
 else {
   platformA();
   for(const id of ['A01','A17','A15','A03','A04L','A04','A05','A05C','A05G','A16','A06','A02','A07','A07W','A10']){
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
   '平台 B · V57 / B41下层Y+B09上层X分界清楚 / B08无外伸手柄 / 实拍147可点击 / MB2530/M孔系候选 / B16脚座四孔配准 / MXFMS显微镜 / PHUC-1夹具 / B40后侧管路 / 145–151实拍'):
   '平台 A · V77 / '+(aWorkingPoseMode?
    '右折边操作位置候选（未实物验证）/ 玻片印章对准A07 / 夹具避开热台 / A17型号未知':
    '照片94左折边 / 蝶翼转90° / 无玻片 / VC13零位 / 全局未配准');
 $('stack-note').textContent=platform==='B'?
  bPhoto94Mode?'94/95/97属于平台A，不用于B物理总装。':'平台B样品侧从下至上为B35→B08（无外伸手柄）→B41（前向Z单轴、型号待核）→B09（右向X单轴NFP-1462C）→B10隔热层→B11真空加热台。B41与B09分别具有独立活动滑块和测微头，构成正交XY平移。B35按Thorlabs MB2530/M孔系候选重建：10×12共120个M6贯通孔，25mm节距、首孔距边12.5mm，四角沉孔距边25mm。板中心X=75mm后，四角安装孔(-25/175, ±125)落在B01候选25mm网格；B16脚座中心87.5/-112.5mm，四个50mm方形Ø6.5孔与B35网格零误差配准。厚度仍按照片拟合12mm，官方MB2530/M为12.7mm，精确SKU未确认；B01螺纹与承载连接仍待实测。B02→B03双轴台→B04 V25M→B05薄板→B34 50mm黑套筒候选→B27 Ø12×112mm场景拟合立杆（实物长度待核）→B33方夹→B25首根横杆→B24 PHUC-1→B28第二横杆→B06 GCM-1302M夹具。B40从B36左侧绕至机箱后方（B19温控器背侧），再绕右侧连接VN-50；后侧管路降至70mm服务高度，与B37加热双线、B38测温线保持分层。杆长、孔位及VN-50泵端接口尚待验收。':
  '平台A当前安装：A01面包板→A17未知磁座→A15双轴T25M→A03 VC13M→A04L/A04双摆角台→A05照片原方向L形折弯板→A05CS两枚独立蝶形螺钉（沿X外伸方向排列，蝶翼旋转90°）。无A05G玻片、PDMS和未经识别的双夹爪。样品侧：A16 GCM-5306M底座→A06旋转台→A02平移台→A07三层样品台。A05C/A05G仅作为独立研究模型保留，不计入V77完整STEP；真正孔距、牙型和全局安装配准仍待核对。';
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
 // V61: the original A iso camera clipped the upper 403mm microscope/camera
 // stack, visually implying missing optical parts. Fit the WHOLE A system.
 const fullA=platform==='A'&&(mode==='iso'||mode==='home');
 const rearB=platform==='B'&&mode==='rear';
 const target=mode==='optical'?new THREE.Vector3(sampleX-20,125,0):
   rearB?new THREE.Vector3(365,105,-155):
   fullB?new THREE.Vector3(115,135,-30):
   fullA?new THREE.Vector3(0,188,0):
   new THREE.Vector3(platform==='B'?-15:0,128,0);
 const dst=mode==='optical'?new THREE.Vector3(sampleX-20,460,0.01):
   mode==='top'?new THREE.Vector3(0,780,0.01):
   mode==='front'?new THREE.Vector3(0,185,760):
   rearB?new THREE.Vector3(700,270,-620):
   mode==='rear'?new THREE.Vector3(295,250,-380):
   mode==='iso'?(fullB?new THREE.Vector3(725,480,835):
                 fullA?new THREE.Vector3(535,465,655):new THREE.Vector3(350,300,440)):
   fullB?new THREE.Vector3(805,515,965):
   fullA?new THREE.Vector3(585,500,735):new THREE.Vector3(425,365,505);
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
  const photoCell=cell();
  mountPhotoBOMCell(photoCell,platform,part.id);
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
 $('a-pose-selector').hidden=platform!=='A';
  $('a-photo-20261108').hidden=platform!=='A';
 $('btn-a-working-pose').classList.toggle('on',platform==='A'&&aWorkingPoseMode);
 $('btn-a-photo-pose').classList.toggle('on',platform==='A'&&!aWorkingPoseMode);
 $('btn-a-working-pose').setAttribute('aria-pressed',String(platform==='A'&&aWorkingPoseMode));
 $('btn-a-photo-pose').setAttribute('aria-pressed',String(platform==='A'&&!aWorkingPoseMode));
 $('btn-b-user-photos').classList.toggle('on',platform==='B');
 $('btn-b-archive').classList.remove('on');
 $('b-profile-note').textContent='照片149：B34黑色套筒、B27长立杆、B33方夹及PHUC-1双横杆。照片108/150：下杆直入GCM-1302M侧边，取消虚构B26大转接座。50mm套筒、Ø12×112mm场景拟合立杆及玻片高度仍为候选；PHUC孔距33mm、GCM夹具型号由原厂/铭牌支持。';
 const aCritical=$('a-physical-audit');
 aCritical.hidden=platform!=='A';
 if(platform==='A'){
   if(aWorkingPoseMode){
     const a=auditAWorkingLayout({filmShiftMm:filmShift,filmDepthShiftMm:filmShiftDepth,
       sampleShiftMm:sampleShift,sampleAngleDeg:sampleAngle,filmDropMm:filmDrop});
     aCritical.textContent='A操作位置为独立的工程几何假设，未经实物照片支持：磁座中心X '+
       a.filmStageX+' mm；折边方向由照片94的左折改为右折，竖腿长度改用'+
       a.bracketVerticalLegMm+' mm候选；初始印章/热台间隙约'+
       a.initialVerticalStampGapMm+' mm，夹具/热台X向间隔约'+
       a.clampHeaterClearanceMm+' mm，磁座/样品底座平面分离'+a.footprintGapMm+
       ' mm。夹具真实型号及螺丝、A17孔系、A02/A16孔位、折边朝向、显微镜工作距离都没有认证。可以用按钮切回照片94原朝向，禁止将候选视为可制造的转移平台。';
   }else{
     const aStatus=auditPlatformAAssembly();
     aCritical.textContent='A照片94原始局部构型未做全局配准：A05末端至A07在最乐观X行程下仍缺约 '+
       aStatus.optimisticResidualHorizontalGapMm+
       ' mm。按确认参考图保留左折L板、两枚沿X方向排列的蝶形螺钉，蝶翼转90°；不安装透明玻片及未识别双夹爪。螺纹参数与全局配准仍待验证。';
   }
 }
 const critical=$('b-physical-audit');
 critical.hidden=platform!=='B';
 if(platform==='B')critical.textContent='V30已消除B05与V25M固定机架此前6048mm³的几何穿透：活动导轨通过独立侧向支承桥接B05。B26巨大转接块删除，只剩可能的M6端面连接。真实螺钉孔距、移动全行程及玻片工作距离仍未认证，禁止加工。';
 node.dataset.refRig=platform==='A'?'A-94-95-97-137-144-152-155-161':'B-107-112-145-151';
 node.textContent=platform==='A'?
  '平台 A：94/95/97、137–144、152、155、161、191–196。新增照片137/161的 GCM-5306M 是 112×70×8 mm 安装底座，不是旋转台。':
  '平台 B：照片145/150确认B35黑色Thorlabs板覆盖旋转台及显微镜底座（250×300×12mm为候选），149确认PHUC-1，150确认GCM-1302M；照片114/117/119确认宇电面板B19与SE-600-48、黑色辅助模块同装在金属控制箱B36内。控制箱尺寸和线束仍待测。';
 $('btn-photo947').textContent='查看平台 A 的 94/95/97 实物构型';
}
function focusPhoto947(photo='94'){
 // Photo94 must show its ORIGINAL left-return pose, never V58 mirrored engineering pose.
 if(platform==='A'&&aWorkingPoseMode){aWorkingPoseMode=false;switchPlatform('A');}
 else if(platform!=='A')aWorkingPoseMode=false;
 // 94/95/97 belong to platform A; the November ruler images
 // 145–151 and 108–112 jointly establish the distinct platform B.
 if(platform!=='A')switchPlatform('A');
 const isB=false;
 const x=isB?CONFIG.B.armX:activeAFilmX();
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
  explosion=0;filmShift=0;filmShiftDepth=0;filmDrop=0;sampleShift=0;sampleShiftDepth=0;sampleAngle=0;
  for(const [id,value] of [['explode','0'],['translate','0'],['translate-depth','0'],['sample-move','0'],['sample-move-depth','0'],['rotate-sample','0']])$(id).value=value;
  $('explode-value').textContent='0%';$('translate-value').textContent='0 mm';$('translate-depth-value').textContent='0 mm';
  $('sample-value').textContent='0 mm';$('sample-depth-value').textContent='0 mm';$('rotate-value').textContent='0°';
  $('show-b').classList.toggle('on',next==='B');
  $('show-a').classList.toggle('on',next==='A');
  $('film-drop-label').textContent=next==='A'?
    'VC13M竖直台（无玻片，接触预览禁用）':
    '玻片竖直下降 · V25M（13mm接触预览）';
  $('sample-move-label').textContent=next==='A'?
    '样品侧 A02 · GCM-T25M（后缀待核）· X平移':
    '样品上层 B09 · X平移';
  $('sample-move-depth-label').textContent='样品下层 B41 · Y平移（前后，场景+Z）';
  $('sample-move-depth').disabled=next!=='B';
  $('film-drop').min='-13';
  $('film-drop').max='0';
  $('film-drop').value='0';
  $('film-drop-value').textContent='0.0 mm';
  // Photo-only A has no verified glass/jaws or contact datum: disabling
  // vertical descent prevents a false transfer simulation through the
  // photograph-supported static machine. Movement is only possible in
  // the explicitly marked and collision-tested operation hypothesis.
  $('film-drop').disabled=next==='A'&&!aWorkingPoseMode;
  $('film-drop').title=next==='A'&&!aWorkingPoseMode?
    '实拍朝向未配准玻片与夹具，禁止按假设的13mm行程执行下降':'仅几何预览，不是实际硬件控制';
  // Both A and B have photo-confirmed film-side T25M. Actual travel use remains candidate.
  $('translate').disabled=false;
  $('translate').title=next==='A'?'A15: 照片95/97证明存在载玻片侧 T25M':'B03: 照片108/109证明存在磁座上T25M';
  resetScene();updatePhotoScope();
}
$('show-b').onclick=()=>switchPlatform('B');
$('show-a').onclick=()=>{aWorkingPoseMode=true;switchPlatform('A');};
$('btn-a-working-pose').onclick=()=>{
 aWorkingPoseMode=true;switchPlatform('A');
};
$('btn-a-photo-pose').onclick=()=>{
 aWorkingPoseMode=false;switchPlatform('A');
};
$('btn-b-user-photos').onclick=()=>{bPhoto94Mode=false;switchPlatform('B');};
$('btn-b-archive').onclick=()=>{bPhoto94Mode=false;aWorkingPoseMode=false;switchPlatform('A');};
$('btn-photo947').onclick=()=>focusPhoto947('94');
$('btn-photo94').onclick=()=>focusPhoto947('94');
$('btn-photo95').onclick=()=>focusPhoto947('95');
$('btn-photo97').onclick=()=>focusPhoto947('97');
// Two new user photos are side views of ONE unchanged mechanism.
 // Only camera.position/target change. No stage/micrometer is mirrored.
 let currentA20261108PhotoAngle=null;
 function focus20261108APhoto(mode){
   if(platform!=='A'||aWorkingPoseMode){
     aWorkingPoseMode=false;switchPlatform('A');
   }
   const c=aPhotoCameraPose(mode,activeAFilmX());
   camera.position.set(...c.position);
   orbit.target.set(...c.target);
   camera.up.set(0,1,0);
   camera.lookAt(orbit.target);
   orbit.update();
   currentA20261108PhotoAngle=mode;
 }
 $('btn-a-photo-monitor-front').onclick=()=>focus20261108APhoto('monitorBehind');
 $('btn-a-photo-monitor-side').onclick=()=>focus20261108APhoto('monitorLeft');
 window.__a20261108PhotoViewProbe=()=>{
   if(platform!=='A'||!currentA20261108PhotoAngle)return {available:false};
   currentRoot.updateWorldMatrix(true,true);
   camera.updateMatrixWorld(true);
   const pos=o=>o?.getWorldPosition(new THREE.Vector3())??null;
   const part=(id)=>parts.get(id)?.g;
   const stage=part('A15');
   const g40=part('A04');
   const lower=part('A04L');
   const sheet=part('A05');
   const stageX=stage?.children.find(o=>o.userData.stageActuatorHandle?.localAxis==='X');
   const stageZ=stage?.children.find(o=>o.userData.stageActuatorHandle?.localAxis==='depth');
   const upperX=g40?.children.find(o=>o.userData.A04DriveDrum);
   const lowerX=lower?.children.find(o=>o.userData.A04LDriveDrum);
   const sheetLeg=sheet?.children.find(o=>o.userData.A05VerticalSheetWeb);
   const carriage=stage?.userData.slidingX;
   const slot=carriage?.children.find(o=>o.userData.A15Photo194FrontSlottedPlate);
   const vc=part('A03');
   if(![stage,g40,lower,sheet,stageX,stageZ,upperX,lowerX,sheetLeg,slot,vc].every(Boolean))
      return {available:false,missingGeometry:true};
   const sx=p=>p.project(camera).x;
   const delta=(o,c)=>Number((sx(pos(o))-sx(pos(c))).toFixed(4));
   const frontSide=camera.position.z<stage.position.z?'negative-Z':'positive-Z';
   return {
     available:true,mode:currentA20261108PhotoAngle,
     cameraWorldPosition:camera.position.toArray().map(x=>Number(x.toFixed(2))),
     cameraTarget:orbit.target.toArray().map(x=>Number(x.toFixed(2))),
     actualA15XKnobRelativeNdc:delta(stageX,stage),
     actualA15ZKnobRelativeNdc:delta(stageZ,stage),
     actualA04XKnobRelativeNdc:delta(upperX,g40),
     actualA04LowerPlusZKnobRelativeNdc:delta(lowerX,lower),
     lowerG40DriveAxisCandidate:lower.userData.photo20261108LowerDriveAxisCandidate,
     actualA05LegRelativeNdc:delta(sheetLeg,g40),
     silverSlotFaceLocalZ:stage.userData.A15SilverSlotFaceLocalZ,
     slotWorldZ:Number(pos(slot).z.toFixed(2)),
     vc13FrontMicrometerZ:Number((vc.position.z+40).toFixed(2)),
     viewedStageFace:frontSide,
     scenePartCount:parts.size,
     photoConstraints:aPhotoOrientationEvidence(),
     cameraFittedToActualLensAndMonitor:false
   };
 };
 function focusPhoto196(){
 if(platform!=='A'||aWorkingPoseMode){
  aWorkingPoseMode=false;switchPlatform('A');
 }
 const x=activeAFilmX();
 // Compare the opposite/drive side of photo196: camera is shifted
 // toward +X to make G40M60L RIGHT-hand micrometer and A05 return
 // visible as distinct solids, instead of duplicating photo94 camera.
 const target=new THREE.Vector3(x+7,153,0);
 camera.position.set(x+127,190,155);
 orbit.target.copy(target);camera.lookAt(target);orbit.update();
}
$('btn-photo196').onclick=focusPhoto196;
function focusMechanicalBranch(which){
 const x=which==='film'?(platform==='B'?CONFIG.B.armX:activeAFilmX()):(platform==='B'?CONFIG.B.sampleX:CONFIG.A.sampleX);
 const fittedBFilm=which==='film'&&platform==='B';
 // Previous camera at y=85, distance~300mm CHOPPED OFF photo149's
 // B27 exposed top (world Y>205). Back camera up and target its
 // whole 0–215mm physical stack, not just the T25M at the bottom.
 const y=fittedBFilm?125:(which==='film'?85:92);
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
$('sample-move-depth').oninput=e=>{sampleShiftDepth=Number(e.target.value);$('sample-depth-value').textContent=sampleShiftDepth.toFixed(1)+' mm';updateTransforms()};
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
