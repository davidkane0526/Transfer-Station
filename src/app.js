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
import {AXES,JOINTS,filmCantileverB} from './assembly-qa.js';

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
let platform='B', currentRoot=new THREE.Group(), parts=new Map(), active=null, explosion=0,
    filmShift=0,filmShiftDepth=0,sampleShift=0,sampleAngle=0,showHoles=true,showLabels=true,showDimensions=true,wireframe=false,showAxes=false;
let pointerDown=null;
const measurementOverlay=new THREE.Group();scene.add(measurementOverlay);
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
 const socket=add(g,cyl(headR*.43,.22,mats.ink,x,top-.06,z,6));
 for(const o of [shaft,head,socket]){o.userData.fastenerProxy=true;o.userData.verifiedFastener=false;}
 return head;
}
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
 const socket=add(g,cyl(2.65,.26,mats.ink,x,topY-.08,z,6));
 const rim=add(g,torus(5.13,.25,mats.ink,x,topY-.02,z));
 for(const o of [shaft,head,socket,rim])o.userData.fastenerProxy=true;
 head.userData.confirmedHeadCount=true;
}
function makeBoard(){
 addPart(platform+'01',0,0,0,g=>{
  const {width:w,depth:d,height:h,pitch:p}=CONFIG.board;const c=[];
  for(let x=-200;x<=200;x+=p)for(let z=-125;z<=125;z+=p)c.push([x,z,2.6]);
  const slab=plate(w,d,h,mats.board,c);add(g,slab);
  const grid=new THREE.GridHelper(425,17,0x586671,0x414b57);grid.position.y=h+.18;g.add(grid);grid.userData.partId=platform+'01';
  label(g,'光学面包板 · 25 mm 网格',-140,h+10,120);
 },{explode:[0,0,0]});
}
function makeStageBlock(id,x,y,z,w,d,h,title,holesPattern=false,motion={},handleSide=1,axes=1,depthHandleSide=1){
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
   add(carriageY,cub(w*.94,topH,d*.92,mats.dark,0,lowerH+middleH+topH/2,0));
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
  add(g,cub(14,12,14,mats.dark,side*(w/2+6),h-9,0));
  const xStem=add(g,cyl(6,27,mats.silver,side*(w/2+24),h-9,0));xStem.rotation.z=Math.PI/2;
  const xDrum=add(g,cyl(9,14,mats.silver,side*(w/2+43),h-9,0));xDrum.rotation.z=Math.PI/2;
  label(g,'机构X / 场景X：左右微调',side*(w/2+62),h-1,0);
  if(JOINTS[id])addJointHeads(g,id,h-.1,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:2.8});
  if(holesPattern)for(const xx of [-25,25])for(const zz of [-25,25])circleGuide(g.userData.slidingTop,3,h+.5,xx,zz);
  label(g,title,0,h+11,0);
 },{explode:[0,id==='B03'?15:10,0],...motion});
}
function filmB(){
 const ax=CONFIG.B.armX;
 addPart('B02',ax,20,0,g=>{
    add(g,cub(65,20,65,mats.dark,0,10,0));
    for(const pitch of [50,40,32])for(const x of [-pitch/2,pitch/2])for(const z of [-pitch/2,pitch/2])circleGuide(g,pitch===50?3:2,20.4,x,z);
    addJointHeads(g,'B02',19.95,[[-25,-25],[-25,25],[25,-25],[25,25]]);
    label(g,'GCM-420302M',0,38,0);
 },{explode:[-25,0,0]});
 // 108/109: magnet B02 touches board, T25M is ON magnet and handle faces -X.
 // Photo108 sees magnetic-base branded +Z, photo109 sees T25M branded -Z.
// T25M is installed yaw=180° relative to the magnetic base: ONE handle,
// appearing left in the former view and right in the latter.
makeStageBlock('B03',ax,40,0,65,65,33,'GCM-T25M2L (2 axes X/Y)',false,{facingYaw:Math.PI*HANDLES.B03.installationYawDeg/180},1,2,-1);
 addPart('B04',ax,73,0,g=>{
  add(g,cub(65,8,66,mats.dark,0,4,0));
  // V25M is an UPRIGHT side-driven stage, not a solid stacked cube.
  add(g,cub(56,52,18,mats.dark,0,32,-10));
  add(g,cub(34,49,8,mats.steel,0,34,3));
  // Embedded face rails, not two disconnected steel posts.
  for(const x of [-17,17])add(g,cub(2.5,38,1.2,mats.silver,x,31,7.5));
  add(g,cub(65,8,66,mats.dark,0,58,0));
  // 108.jpg: V25M micrometer is VERTICAL (+Y), distinct from T25M.
  add(g,cub(16,14,18,mats.dark,-24,24,0));
  add(g,cyl(6.5,40,mats.silver,-24,46,0));
  add(g,cyl(9,17,mats.silver,-24,73,0));
  addJointHeads(g,'B04',7.95,[[-25,-24],[-25,24],[25,-24],[25,24]],{headR:2.5});
  label(g,'GCM-V25M · 竖直测微头 +Y',0,89,0);
 },{explode:[-24,30,0],moveFilm:true});
 // A direct cantilever replaces the unsupported 85mm vertical post,
 // rearward 249mm return bar and second hanging post. Attachment is
 // a candidate because the actual fixture screws are unmeasured.
 const link=filmCantileverB({armX:ax,sampleX:CONFIG.B.sampleX});
 addPart('B05',ax,139,0,g=>{
   add(g,cub(47,6,45,mats.black,0,3,0)); // seats on B04 top at Y=139
   add(g,cub(28,18,22,mats.dark,12,14,0));
   const rod=add(g,cyl(6.35,link.rodLength,mats.steel,
     link.rodCenterX,link.rodCenterY,link.rodZ));
   rod.rotation.z=Math.PI/2;
   // The only terminal clamp attaches directly to B06 at Y=128.
   add(g,cub(23,link.terminalHeight+3,22,mats.dark,
     link.rodEndX,link.terminalCenterY+1,0));
   addJointHeads(g,'B05',5.95,[[-18,-16],[-18,16],[18,-16],[18,16]],{headR:2.6});
   label(g,'直线悬臂和末端玻片夹（候选）',80,39,0);
 },{explode:[-30,55,-13],moveFilm:true});
 // The 1-mm glass occupies the 1.5-mm gap between actual upper/lower jaws.
 addPart('B06',CONFIG.B.sampleX+52,121.5,0,g=>{
  add(g,cub(52,13,21,mats.dark,0,0,0));
  add(g,cub(16,23,32,mats.steel,19,-9,0));
  add(g,cub(48,4,14,mats.silver,-14,-19,0));
  add(g,cub(48,4,14,mats.silver,-14,-13.5,0));
  add(g,cub(6,15,14,mats.dark,9,-13.5,0)); // outer rear jaw bridge
  addJointHeads(g,'B06',6.35,[[-10,-6],[8,6]],{headR:2.6});
  label(g,'玻片夹：1.5-mm 夹口（候选）',0,24,0);
 },{explode:[-20,65,5],moveFilm:true});
 addPart('B07',CONFIG.B.sampleX+5,105,0,g=>{
  add(g,cub(76,1,26,mats.glass,0,0,0));
  add(g,cub(20,1.8,20,mats.ceramic,-5,-1.4,0));
  label(g,'玻片与转移膜：默认热台间距4.5mm（候选）',2,16,0);
 },{explode:[0,80,15],moveFilm:true});
}
function rotaryB(){
 const sx=CONFIG.B.sampleX;
 addPart('B08',sx,20,0,g=>{
    add(g,cyl(47,23,mats.dark,0,11.5,0));
    add(g,cyl(47,10.2,mats.steel,0,28.1,0));
    add(g,torus(45,1.0,mats.ink,0,33.35,0));
    for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(g,2.6,33.5,x,z);
    // 111.jpg rotary silver lock handle faces the operator (+Z), not +X.
    const knob=add(g,cyl(6,31,mats.silver,0,12,57));knob.rotation.x=Math.PI/2;
    addJointHeads(g,'B08',33.15,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:2.9});
    label(g,'GCM-1107M · Ø94×33.2',0,46,0);
 },{explode:[12,0,0],rotateSample:false});
 addPart('B09',sx,53.2,0,g=>{
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
   // NFP official local-coordinate micrometer is LEFT. In the actual photo
   // 110.jpg it points RIGHT due to stage installation at 180° about Y.
   // Maker dimension drawing indicates overall length 155.5--180.5mm.
   add(g,cub(24,15,30,mats.steel,-45,12,0));
   const spindle=add(g,cyl(3.6,74,mats.silver,-85,12,0));spindle.rotation.z=Math.PI/2;
   const collar=add(g,cyl(9,23,mats.steel,-119,12,0));collar.rotation.z=Math.PI/2;
   const drum=add(g,cyl(11,28,mats.silver,-131,12,0));drum.rotation.z=Math.PI/2;
   for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(slidingTop,2.8,23.4,x,z);
   for(const x of [-16,16])for(const z of [-16,16])circleGuide(slidingTop,1.6,23.42,x,z);
   for(const x of [-25,25])for(const z of [-25,25])circleGuide(g,5.5,11.3,x,z);
   addJointHeads(g,'B09',10.9,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:4.2});
   label(g,'NFP 仅单轴 X / 一根测微头',-38,46,0);
   label(g,'NFP-1462C · 原厂65×65×23 · 正面安装180°候选',0,42,0);
 },{explode:[0,16,0],rotateSample:true,facingYaw:Math.PI});
 addPart('B10',sx,76.2,0,g=>{
   const h=plate(65,65,10,mats.white,[[-25,-25,3.4],[-25,25,3.4],[25,-25,3.4],[25,25,3.4]]);add(g,h);
   label(g,'白色无机隔热层 ≈10mm',0,22,0);
 },{explode:[-7,36,-8],rotateSample:true,translateSample:true});
 addPart('B11',sx,86.2,0,g=>{
   const corners=[[-25,-25,3.3],[-25,25,3.3],[25,-25,3.3],[25,25,3.3]];
   // Lower layer with real open underside ceramic pocket
   add(g,plate(65,65,5.4,mats.steel,corners,[38.6,38.6]));
   add(g,plate(65,65,.1,mats.steel,corners)).position.y=5.4;
   const cb=corners.map(a=>[a[0],a[1],5.5]);cb.push([0,0,.7]);
   add(g,plate(65,65,6.5,mats.steel,cb)).position.y=5.5;
   // Visual channel inside metal; confirmed route is not known
   const ch=tube([[0,9.3,-32.5],[0,9.3,-18],[0,9.3,0]],1.4,mats.blue);
   ch.material= new THREE.MeshStandardMaterial({color:'#4bc9e8',transparent:true,opacity:.78,depthTest:false});
   add(g,ch);holes.push(ch);
   const top=tube([[0,9.3,0],[0,12.3,0]],.72,mats.blue);add(g,top);holes.push(top);
   label(g,'单中心孔 / 底面开腔 / 4×沉孔',0,31,0);
 },{explode:[0,61,0],rotateSample:true,translateSample:true});
 addPart('B12',sx,86.5,0,g=>{
   add(g,cub(38,5,38,mats.ceramic,0,2.5,0));
   // Pair of heater leads exiting the BACK (-Z) of the milled chuck.
   for(const x of [10,15]){
      add(g,cub(2,1.5,2,mats.copper,x,2.5,-18.5));
      add(g,tube([[x,2.5,-19],[x,2.5,-32.5],[x,2.5,-48],[x+1,0,-60]],.55,mats.copper));
   }
   label(g,'加热片后侧双引线（孔位候选）',0,12,-18);
 },{explode:[38,74,12],rotateSample:true,translateSample:true});
 addPart('B13',sx,91.35,0,g=>{
    add(g,cyl(.6,1.2,mats.copper,6,.6,0));
    add(g,tube([[6,.6,0],[6,.6,-19.5],[6,.6,-33],[6,-3,-51]],.34,mats.blue));
 },{explode:[-17,70,0],rotateSample:true,translateSample:true});
 addPart('B14',sx,86.2,0,g=>{
   for(const x of [-25,25])for(const z of [-25,25]){
      screw(g,x,12.03,z,25); // head surface flush at 12.03; do not mask by blue hole guide
   }
   g.userData.fastenerProxies=4;
   label(g,'4 枚顶部齐平螺钉（仅数量、齐平已确认）',0,45,0);
 },{explode:[0,88,0],rotateSample:true,translateSample:true});
 addPart('B15',sx,95.5,0,g=>{
   const fitting=add(g,cyl(3,13,mats.silver,0,0,-39));fitting.rotation.x=Math.PI/2;
   add(g,tube([[0,0,-45.5],[0,1,-58],[1,-3,-70],[12,-17,-79]],1.8,mats.rubber));
 },{explode:[0,60,-20],rotateSample:true,translateSample:true});
 const substrate=cub(24,.6,24,mats.glass,0,98.5,0);substrate.position.x=sx;currentRoot.add(substrate);
}
function microscopeB(){
 const sx=CONFIG.B.sampleX,sz=CONFIG.B.scopeZ;
 addPart('B16',sx,20,sz,g=>{
   add(g,cub(65,12,65,mats.dark,0,6,0));
   add(g,cyl(13,238,mats.steel,0,131,0));
   add(g,cub(80,34,34,mats.microscope,0,242,23));
   const boom=add(g,cub(32,26,125,mats.microscope,0,253,75));
   add(g,cub(55,50,55,mats.microscope,0,229,112));
   add(g,cyl(17,44,mats.dark,0,188,112));
   const knob=add(g,cyl(15,13,mats.dark,45,225,108));knob.rotation.z=Math.PI/2;
   addJointHeads(g,'B16',11.9,[[-25,-25],[-25,25],[25,-25],[25,25]],{headR:2.8});
   label(g,'MXFMS 显微镜本体 / 支架（包络代理）',0,303,80);
 },{explode:[0,15,-42]});
 addPart('B17',sx,276,0,g=>{
   add(g,cub(47,48,48,mats.dark,0,24,0));
   add(g,cub(30,18,30,mats.steel,0,3,0));
   label(g,'SDPTOP 相机 · 型号待核',0,77,0);
 },{explode:[0,95,0]});
 addPart('B18',sx,200,0,g=>{
   add(g,cyl(17,13,mats.dark,0,6.5,0));
   add(g,cyl(12.5,38,mats.steel,0,-18.5,0));
   add(g,cyl(10,12,mats.black,0,-43.5,0));
   add(g,cyl(7,2,mats.glass,0,-50,0));
   label(g,'OptoSigma 物镜（型号待确认）',0,24,0);
 },{explode:[16,26,0]});
}
function externalB(){
 addPart('B19',265,25,-95,g=>{
  add(g,cub(125,85,87,mats.pump,0,42.5,0));
  add(g,cub(72,52,2,mats.dark,0,53,45));
  add(g,cub(34,29,3,mats.ink,-18,58,47));
  add(g,cub(15,13,4,mats.blue,-18,61,49));
  label(g,'宇电 AI / 温控控制箱（代理）',0,110,0);
 },{explode:[45,0,-30]});
 addPart('B20',265,20,75,g=>{
  add(g,cub(135,15,80,mats.dark,0,7.5,0));
  add(g,cyl(37,112,mats.pump,0,54,0)).rotation.z=Math.PI/2;
  add(g,cub(48,50,50,mats.dark,50,48,0));
  const nozzle=add(g,cyl(9,20,mats.steel,80,68,0));nozzle.rotation.z=Math.PI/2;
  label(g,'真空泵（参数来自照片，机壳代理）',0,113,0);
 },{explode:[55,0,35]});
 addPart('B21',245,25,-195,g=>{
   add(g,cub(247,63.5,127,mats.silver,0,31.75,0));
   for(let i=0;i<18;i++)add(g,cub(3,.5,90,mats.dark,-99+i*11,64,0));
   label(g,'Mean Well SE-600-48',0,91,0);
 },{explode:[70,10,-25]});
 addPart('B22',280,35,-20,g=>{
   add(g,cub(65,48,72,mats.dark,0,24,0));
   add(g,cub(44,22,4,mats.steel,0,24,37));
   const plug=add(g,cyl(7,12,mats.steel,33,16,0));plug.rotation.z=Math.PI/2;
   label(g,'LED LAMP ADAPTOR / 115.jpg',0,68,0);
 },{explode:[55,0,-20]});
 addPart('B23',305,35,-110,g=>{
   add(g,cub(93,38,58,mats.dark,0,19,0));
   for(let i=-3;i<=3;i++)add(g,cub(4,2,41,mats.ink,i*10,39,0));
   add(g,cub(48,13,10,mats.steel,0,16,32));
   label(g,'CONTROL MODULE / 119.jpg',0,53,0);
 },{explode:[50,0,-30]});
}
function platformA(){
 const ax=CONFIG.A.armX,sx=CONFIG.A.sampleX;
 // Photo 100: GCM-T25M is physically stacked ABOVE the rotary stage,
 // not the separate left transfer-arm adjustment stage.
 // A sample branch: 100.jpg rotation -> sample-side T25M.
 makeStageBlock('A02',sx,53.2,0,65,65,20,'样品侧 GCM-T25M (+X)',true,{rotateSample:true},1);
 // A film branch: 95.jpg/97.jpg show a DIFFERENT T25M below VC13M.
 makeStageBlock('A15',ax,20,0,65,65,33,'载玻片侧 GCM-T25M2L (2 axes)',false,{},1,2,1);
 addPart('A03',ax,53,0,g=>{
    add(g,cub(65,8,65,mats.dark,0,4,0));
    // Photo 97: VC13M is a vertical face and slide, not a tall square box.
    add(g,cub(56,36,17,mats.dark,0,26,-9));
    add(g,cub(38,36,8,mats.steel,0,26,2));
    for(const x of [-22,22])add(g,cub(3,34,4,mats.silver,x,26,-1));
    add(g,cub(65,7,65,mats.dark,0,47.5,0));
    // 97.jpg: vertically directed measuring barrel on the VC13M face.
    add(g,cub(14,12,12,mats.dark,0,22,30));
    add(g,cyl(5.5,35,mats.silver,0,43,31));
    add(g,cyl(8.5,15,mats.silver,0,70,31));
    label(g,'GCM-VC13M / 竖直测微头',0,76,0);
 },{explode:[-15,18,0],moveFilm:true});
 addPart('A04',ax,104,0,g=>{
  add(g,cub(40,15,40,mats.dark,0,7.5,0));
  const top=add(g,cub(40,5,40,mats.dark,0,17.5,0));
  const screw=add(g,cyl(5,22,mats.silver,29,10,0));screw.rotation.z=Math.PI/2;
  add(g,cyl(8.5,15,mats.silver,43,10,0)).rotation.z=Math.PI/2;
  label(g,'GCM-G40M60L / 右侧测微头',0,45,0);
 },{explode:[-25,42,0],moveFilm:true});
 addPart('A05',sx,132,0,g=>{
   // Candidate structural closure: vertical riser on A04 and horizontal arm
   // from ax to sx. Photo does not prove exact rod length or mounting screws.
   const span=sx-ax,risey=(124+153)/2-132;
   add(g,cub(13,29,13,mats.steel,ax-sx,risey,0));
   add(g,cub(span+20,8,12,mats.steel,(ax-sx)/2,25,0));
   add(g,cub(12,39,12,33,1.5,0));
   add(g,cub(52,13,20,mats.dark,-4,-8,0));
   add(g,cub(76,1,26,mats.glass,0,-18,0));
   label(g,'载玻片转移台 / 夹具 · 自制连接件候选',0,34,0);
 },{explode:[-13,65,0],moveFilm:true});
 addPart('A06',sx,20,0,g=>{
  add(g,cyl(47,33.2,mats.dark,0,16.6,0));
  add(g,torus(44,1,mats.steel,0,33.5,0));
  const lock=add(g,cyl(6,28,mats.steel,0,12,59));lock.rotation.x=Math.PI/2;
  label(g,'A 套旋转台：前侧锁止杆候选',0,54,0);
 },{explode:[0,0,0]});
 addPart('A07',sx,73.2,0,g=>{
  add(g,cub(65,18,65,mats.steel,0,9,0));
  add(g,cub(28,1.4,28,mats.glass,0,19.1,0));
  label(g,'A 套样品加热座（形状候选）',0,38,0);
 },{explode:[0,26,0],translateSample:true,rotateSample:true});
 addPart('A10',sx,20,-112,g=>{
    add(g,cub(72,14,65,mats.dark,0,7,0));
    add(g,cyl(13,225,mats.steel,0,126,0));
    add(g,cub(34,25,127,mats.dark,0,234,65));
    label(g,'A 套成像支架',0,267,60);
 },{explode:[0,15,-30]});
 addPart('A08',sx,170,0,g=>{
  add(g,cyl(21,85,mats.black,0,42.5,0));
  add(g,cyl(17,9,mats.silver,0,0,0));
  label(g,'Thorlabs TTL200-A 管镜',0,103,0);
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
 addPart('A14',sx,248,0,g=>{
   add(g,cyl(16,7,mats.dark,0,3.5,0));
   add(g,cyl(14.5,2,mats.silver,0,7.7,0));
   label(g,'SM1/SM2 光学接口待核实',0,20,0);
 },{explode:[0,25,0]});
}
function addAxis(){
 const axes=new THREE.AxesHelper(80);axes.position.set(-216,22,145);currentRoot.add(axes);axisObjects.push(axes);
}
function renderPhotoLedger(){
 const host=$('photo-ledger');if(!host)return;host.replaceChildren();
 const stack=STACKS[platform];
 const note=document.createElement('p');note.textContent=stack.confidence;host.append(note);
 for(const [side,ids] of Object.entries({film:stack.film,sample:stack.sample})){
   const heading=document.createElement('div');heading.className='key';
   heading.textContent=side==='film'?'载玻片侧（从下至上）':'样品侧（从下至上）';
   host.append(heading);
   const list=document.createElement('div');list.className='list';
   for(const id of ids){
     const part=PARTS[platform].find(x=>x.id===id);if(!part)continue;
     const b=document.createElement('button');b.className='photo-part';
     b.textContent=id+' · '+part.model+' · '+part.name;
     const h=HANDLES[id];
     if(h){const sp=document.createElement('span');sp.className='source-tag';
       sp.textContent=(h.axes===2?'双轴手柄 X:'+h.direction+' / Y:'+h.secondaryDirection+' · 厚'+h.thicknessMm+'mm':'手柄 '+h.direction)+' · '+h.evidence;b.append(sp);}
     b.onclick=()=>selectPart(id);list.append(b);
   }
   host.append(list);
 }
 const m=document.createElement('div');m.className='marked-note';
 m.textContent=platform==='B'?
   'B02 GCM-420302M 必须直接接触面包板并位于 B03 T25M 下面；中部圆柱是 Zolix 夹持器，不是第二个磁吸底座。':
   'A15 与 A02 为两台不同 T25M：照片97所示 A15 在 VC13M 下；照片100所示 A02 在旋转台上。';
 host.append(m);
}
function populateGroups(){
 const list=$('group-list');list.replaceChildren();
 const meta=PARTS[platform];for(const [key,cfg] of Object.entries(groups)){
   const subset=meta.filter(x=>x.group===key);if(!subset.length)continue;
   const line=document.createElement('label');line.className='group-row';
   const input=document.createElement('input');input.type='checkbox';input.checked=key!=='external';input.dataset.group=key;
   input.onchange=()=>parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked});
   const dot=document.createElement('i');dot.className='dot';dot.style.background=cfg.color;
   const tx=document.createElement('span');tx.textContent=cfg.name;
   const count=document.createElement('span');count.className='count';count.textContent=subset.length+' 件';
   line.append(input,dot,tx,count);list.append(line);
   if(key==='external')parts.forEach(v=>{if(v.part.group==='external')v.g.visible=false});
 }
}
function updateDetail(part){
 const el=$('part-detail');if(!part){el.className='select-placeholder';el.textContent='点击零件选中；再点空白取消。只显示被选中的零件标签，不遮挡模型。';return}
 el.className='';
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const reviews=interfaceEvidence(platform,part.id);
 const interfaceHtml=reviews.length?reviews.map(item=>'<p><b>'+esc(item.id)+' · 待核验</b> '+esc(item.known)+'<span class="marked-note">尚需确认：'+esc(item.missing.join('、'))+'</span></p>').join(''):'<p>当前未建立该部件的独立接口验收记录；外观与报价不代表装配验收。</p>'; 
 el.innerHTML='<span class="status '+part.level+'">'+part.level+' · '+esc(levelMeaning[part.level])+'</span>'+
 '<h2>'+esc(part.name)+'</h2><p class="meta">'+esc(part.maker)+' · '+esc(part.model)+'</p>'+
 '<div class="field"><b>编号 / 分组</b>'+esc(part.id)+' · '+esc(groups[part.group].name)+'</div>'+
 '<div class="field"><b>外形/尺寸/孔位（mm）</b><p>'+esc(part.dims)+'</p></div>'+
 '<div class="field"><b>几何及功能</b><p>'+esc(part.detail)+'</p></div>'+
 '<div class="field"><b>连接接口与制造限制</b><p>'+esc(part.interfaceNote)+'</p></div>'+
 '<div class="field" id="interface-review-panel"><b>物理装配接口验收</b>'+interfaceHtml+'</div>'+
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
      const highlight=m.clone();highlight.emissive=new THREE.Color('#12405b');highlight.emissiveIntensity=.42;
      o.material=highlight;
   }
 });
 updateDetail(v.part);
 $('hover-help').textContent=v.part.id+' · '+v.part.name;
 selectedLabels();updateMeasurement();
}
function updateTransforms(){
 const e=explosion/100,angle=sampleAngle*Math.PI/180;
 parts.forEach(({g,base,part,explode,moveFilm,translateSample,rotateSample,facingYaw=0})=>{
  const off=explode||[0,0,0],fx=moveFilm?filmShift:0,fz=moveFilm?filmShiftDepth:0,sx=translateSample?sampleShift:0;
  // Translation in a rotating stage's LOCAL X basis, then rotation about Y.
  const travel=rotateSample?stageLocalTranslation(sx,angle):{x:sx,z:0};
  const dx=travel.x,dz=travel.z;
  g.position.set(base.x+off[0]*e+fx+dx,base.y+off[1]*e,base.z+off[2]*e+dz+fz);
  g.rotation.y=(rotateSample?angle:0)+facingYaw;
  if(g.userData.slidingX){
    // A physical X carriage carries a SECOND, nested depth carriage.
    // B03 has a yaw-180 installation; local negative X maps to world +X.
    g.userData.slidingX.position.x=part.id==='B03'?-filmShift:filmShift;
    if(g.userData.slidingDepth)g.userData.slidingDepth.position.z=part.id==='B03'?-filmShiftDepth:filmShiftDepth;
  }else if(g.userData.slidingTop){
    g.userData.slidingTop.position.x=part.id==='B09'?-sampleShift:part.id==='A02'?sampleShift:0;
  }
 
 });
 if(active)updateMeasurement();
}
function resetScene(){
 // Each platform has its own independent BOM; prevent previous queries from hiding rows.
 if($('bom-query'))$('bom-query').value='';
 if($('priced-only'))$('priced-only').checked=false;
 active=null;clearMeasurement();
 // CSS2DRenderer retains node references unless explicitly detached on platform switch.
 for(const oldLabel of labels){if(oldLabel.element?.isConnected)oldLabel.element.remove();}
 parts.clear();hitMeshes.length=0;holes.length=0;labels.length=0;axisObjects.length=0;
 $('restore-cad').disabled=true;
 $('sample-move').disabled=false;
 $('cad-motion-note').hidden=true;
 $('import-status').textContent='选中零件后可导入本地 STL / GLB；导入仅验证外观，接口仍需核实。';
 scene.remove(currentRoot);currentRoot=new THREE.Group();scene.add(currentRoot);
 makeBoard();
 if(platform==='B'){filmB();rotaryB();microscopeB();externalB();}
 else platformA();
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
 $('platform-caption').textContent=platform==='B'?'平台 B · MXFMS / 双运动分支 / 真空加热吸附台':'平台 A · Daheng 成像相机 / TTL200-A / 多轴调整';
 $('stack-note').textContent=platform==='B'?
  'B03在照片108的磁座铭牌观察面看手柄在左；照片109从相反的T25M铭牌面看手柄在右，这是同一根手柄。模型以T25M局部+X安装、绕高度轴旋转180°，从磁座铭牌面对应全局−X。B04竖直测微头另设；A套两台T25M不合并。':
  '照片95/97: A载玻片侧由下至上独立 A15 T25M（右手柄）→ A03 VC13M（竖直测微头）→ A04 G40M60L（右手柄）。照片100: A样品侧 A06旋转台→另一台 A02 T25M（右手柄）→样品加热块。两个T25M不可合并。';
 focus('iso');
 updateTable();
}
function focus(mode){
 const target=new THREE.Vector3(platform==='B'?-15:0,128,0);
 const dst=mode==='top'?new THREE.Vector3(0,780,0.01):
  mode==='front'?new THREE.Vector3(0,185,760):
  mode==='rear'?new THREE.Vector3(295,250,-380):mode==='iso'?new THREE.Vector3(350,300,440):new THREE.Vector3(425,365,505);
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
 return sortedBOM(PARTS[platform].map(p=>enriched(platform,p)).filter(p=>
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
 summaryBOM(PARTS[platform].map(x=>enriched(platform,x)));
 $('bom-heading').textContent='平台 '+platform+' · 原厂 BOM / 替代厂家 / 采购价格和总额';
}
function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function exportCSV(){
 const matrix=csvExportRows(PARTS[platform].map(p=>enriched(platform,p)));
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
function switchPlatform(next){
  clearCadFeatureCandidates();
  platform=next;
  explosion=0;filmShift=0;filmShiftDepth=0;sampleShift=0;sampleAngle=0;
  for(const [id,value] of [['explode','0'],['translate','0'],['translate-depth','0'],['sample-move','0'],['rotate-sample','0']])$(id).value=value;
  $('explode-value').textContent='0%';$('translate-value').textContent='0 mm';$('translate-depth-value').textContent='0 mm';
  $('sample-value').textContent='0 mm';$('rotate-value').textContent='0°';
  $('show-b').classList.toggle('on',next==='B');
  $('show-a').classList.toggle('on',next==='A');
  // Both A and B have photo-confirmed film-side T25M. Actual travel use remains candidate.
  $('translate').disabled=false;
  $('translate').title=next==='A'?'A15: 照片95/97证明存在载玻片侧 T25M':'B03: 照片108/109证明存在磁座上T25M';
  resetScene();
}
$('show-b').onclick=()=>switchPlatform('B');
$('show-a').onclick=()=>switchPlatform('A');
function focusMechanicalBranch(which){
 const x=which==='film'?(platform==='B'?CONFIG.B.armX:CONFIG.A.armX):(platform==='B'?CONFIG.B.sampleX:CONFIG.A.sampleX);
 const y=which==='film'?85:79;
 const t=new THREE.Vector3(x,y,0);
 // A front / side oblique perspective showing installed handles and base height.
 const handSide=which==='film'&&platform==='B'?-1:1;
 camera.position.set(x+handSide*155,y+100,235);
 orbit.target.copy(t);camera.lookAt(t);orbit.update();
}
$('btn-film-stack').onclick=()=>focusMechanicalBranch('film');
// Compare the same stage from opposing sides without changing any part geometry.
function focusBPhoto(photo){
 if(platform!=='B')switchPlatform('B');
 const x=CONFIG.B.armX, y=85, magnetView=photo==='108';
 camera.position.set(x+(magnetView?-90:90),y+60,magnetView?245:-245);
 orbit.target.set(x,y,0);camera.lookAt(orbit.target);orbit.update();
}
$('btn-photo108').onclick=()=>focusBPhoto('108');
$('btn-photo109').onclick=()=>focusBPhoto('109');
$('btn-sample-stack').onclick=()=>focusMechanicalBranch('sample');
$('btn-home').onclick=()=>focus('home');$('btn-top').onclick=()=>focus('top');$('btn-front').onclick=()=>focus('front');$('btn-rear').onclick=()=>focus('rear');$('btn-iso').onclick=()=>focus('iso');
$('explode').oninput=e=>{explosion=Number(e.target.value);$('explode-value').textContent=explosion+'%';updateTransforms()};
$('translate').oninput=e=>{filmShift=Number(e.target.value);$('translate-value').textContent=filmShift.toFixed(1)+' mm';updateTransforms()};
$('translate-depth').oninput=e=>{filmShiftDepth=Number(e.target.value);$('translate-depth-value').textContent=filmShiftDepth.toFixed(1)+' mm';updateTransforms()};
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
resetScene();resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);labelRenderer.render(scene,camera)});
