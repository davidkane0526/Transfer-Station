import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CONFIG,PARTS,SOURCE_LINKS} from './parts.js';
import {enrichParts} from './details.js';
import {enriched,pricedSummary,csvExportRows} from './procurement.js';
import {stageLocalTranslation} from './kinematics.js';
import {STACKS,HANDLES,MAGNET_PLACEMENT} from './photo-evidence.js';

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
    filmShift=0,sampleShift=0,sampleAngle=0,showHoles=true,showLabels=true,showDimensions=true,wireframe=false,showAxes=false;
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
 const bounds=new THREE.Box3().setFromObject(active.g,true);
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
function screw(g,x,topY,z,length=25){
 // ISO-style M6 candidate: length measured under 6 mm head; top recess 0.5 mm.
 const headBottom=topY-6;
 add(g,cyl(3,length,mats.steel,x,headBottom-length/2,z));
 add(g,cyl(5,6,mats.silver,x,topY-3,z));
 const hex=add(g,cyl(2.8,.35,mats.ink,x,topY-.16,z,6));
 holes.push(hex);
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
function makeStageBlock(id,x,y,z,w,d,h,title,holesPattern=false,motion={},handleSide=1){
 addPart(id,x,y,z,g=>{
   add(g,cub(w,h*.55,d,mats.dark,0,h*.275,0));
   const carriage=new THREE.Group();g.add(carriage);g.userData.slidingTop=carriage;
   add(carriage,cub(w*.94,h*.45,d*.92,mats.steel,0,h*.78,0));
   // This is an *individual stage* micrometer. Never give every axis +X.
   const side=handleSide;
   add(g,cub(14,12,14,mats.dark,side*(w/2+6),h*.5,0));
   const v=add(g,cyl(6,24,mats.silver,side*(w/2+22),h*.5,0));v.rotation.z=Math.PI/2;
   add(g,cyl(9,12,mats.silver,side*(w/2+34),h*.5,0)).rotation.z=Math.PI/2;
   if(holesPattern)for(const xx of [-25,25])for(const zz of [-25,25])circleGuide(carriage,3,h+.5,xx,zz);
   label(g,title,0,h+11,0);
 },{explode:[0,id.endsWith('03')?15:10,0],...motion});
}
function filmB(){
 const ax=CONFIG.B.armX;
 addPart('B02',ax,20,0,g=>{
    add(g,cub(65,20,65,mats.dark,0,10,0));
    for(const pitch of [50,40,32])for(const x of [-pitch/2,pitch/2])for(const z of [-pitch/2,pitch/2])circleGuide(g,pitch===50?3:2,20.4,x,z);
    label(g,'GCM-420302M',0,38,0);
 },{explode:[-25,0,0]});
 // 108/109: magnet B02 touches board, T25M is ON magnet and handle faces -X.
 makeStageBlock('B03',ax,40,0,65,65,20,'GCM-T25M (micrometer -X)',false,{},-1);
 addPart('B04',ax,60,0,g=>{
  add(g,cub(65,8,66,mats.steel,0,4,0));
  // V25M is an UPRIGHT side-driven stage, not a solid stacked cube.
  add(g,cub(56,52,18,mats.dark,0,32,-10));
  add(g,cub(34,49,8,mats.steel,0,34,3));
  for(const x of [-22,22])add(g,cub(4,47,5,mats.silver,x,32,0));
  add(g,cub(65,8,66,mats.steel,0,58,0));
  // 108.jpg: V25M micrometer is VERTICAL (+Y), distinct from T25M.
  add(g,cub(16,14,18,mats.dark,-24,24,0));
  add(g,cyl(6.5,40,mats.silver,-24,46,0));
  add(g,cyl(9,17,mats.silver,-24,73,0));
  label(g,'GCM-V25M · 竖直测微头 +Y',0,89,0);
 },{explode:[-24,30,0],moveFilm:true});
 // Rear-offset bar avoids the microscope/optical axis. All dimensions here
 // are constrained candidate geometry, not measured from the original device.
 addPart('B05',ax,122,0,g=>{
  add(g,cub(36,20,36,mats.black,0,10,0));
  add(g,cyl(6.35,85,mats.steel,0,62,0));
  add(g,cub(30,28,80,mats.black,0,63,-20));
  const bar=add(g,cyl(6.35,249,mats.steel,124.5,63,-40));bar.rotation.z=Math.PI/2;
  add(g,cub(27,28,70,mats.black,249,63,-20));
  add(g,cyl(5,57,mats.steel,249,34.5,0));
  label(g,'玻片转移臂：后置横杆 / 悬挂夹具（尺寸候选）',20,102,-40);
 },{explode:[-30,55,-13],moveFilm:true});
 // The 1-mm glass occupies the 1.5-mm gap between actual upper/lower jaws.
 addPart('B06',CONFIG.B.sampleX+52,121.5,0,g=>{
  add(g,cub(52,13,21,mats.dark,0,0,0));
  add(g,cub(16,23,32,mats.steel,19,-9,0));
  add(g,cub(48,4,14,mats.silver,-14,-19,0));
  add(g,cub(48,4,14,mats.silver,-14,-13.5,0));
  add(g,cub(6,15,14,mats.dark,9,-13.5,0)); // outer rear jaw bridge
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
    label(g,'GCM-1107M · Ø94×33.2',0,46,0);
 },{explode:[12,0,0],rotateSample:false});
 addPart('B09',sx,53.2,0,g=>{
   add(g,cub(65,11,65,mats.dark,0,5.5,0));
   const slidingTop=new THREE.Group();g.add(slidingTop);g.userData.slidingTop=slidingTop;
   // A blind-hole proxy: two-mm solid bottom + ten-mm drilled top layer.
   // Thread minor diameters and depths are candidates, not manufacturer drawings.
   const nfpHoles=[
     ...[-25,0,25].flatMap(x=>[-25,0,25].map(z=>[x,z,2.5])),
     ...[-16,16].flatMap(x=>[-16,16].map(z=>[x,z,1.25]))
   ];
   const lower=plate(65,65,2,mats.steel);lower.position.y=11;add(slidingTop,lower);
   const drilled=plate(65,65,10,mats.steel,nfpHoles);drilled.position.y=13;add(slidingTop,drilled);
   const mic=add(g,cyl(7,32,mats.silver,46,12,0));mic.rotation.z=Math.PI/2;
   for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(slidingTop,2.8,23.4,x,z);
   for(const x of [-16,16])for(const z of [-16,16])circleGuide(slidingTop,1.6,23.42,x,z);
   label(g,'NFP-1462C · 65×65×23',0,42,0);
 },{explode:[0,16,0],rotateSample:true});
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
      screw(g,x,11.5,z,25);circleGuide(g,5.5,12.2,x,z);
   }
   label(g,'4 枚顶部齐平螺钉（M6×25 候选）',0,45,0);
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
 makeStageBlock('A15',ax,20,0,65,65,20,'载玻片侧 GCM-T25M (+X)',false,{},1);
 addPart('A03',ax,40,0,g=>{
    add(g,cub(65,8,65,mats.steel,0,4,0));
    // Photo 97: VC13M is a vertical face and slide, not a tall square box.
    add(g,cub(56,36,17,mats.dark,0,26,-9));
    add(g,cub(38,36,8,mats.steel,0,26,2));
    for(const x of [-22,22])add(g,cub(3,34,4,mats.silver,x,26,-1));
    add(g,cub(65,7,65,mats.steel,0,47.5,0));
    // 97.jpg: vertically directed measuring barrel on the VC13M face.
    add(g,cub(14,12,12,mats.dark,0,22,30));
    add(g,cyl(5.5,35,mats.silver,0,43,31));
    add(g,cyl(8.5,15,mats.silver,0,70,31));
    label(g,'GCM-VC13M / 竖直测微头',0,76,0);
 },{explode:[-15,18,0],moveFilm:true});
 addPart('A04',ax,91,0,g=>{
  add(g,cub(40,15,40,mats.dark,0,7.5,0));
  const top=add(g,cub(40,5,40,mats.steel,0,17.5,0));
  const screw=add(g,cyl(5,22,mats.silver,29,10,0));screw.rotation.z=Math.PI/2;
  add(g,cyl(8.5,15,mats.silver,43,10,0)).rotation.z=Math.PI/2;
  label(g,'GCM-G40M60L / 右侧测微头',0,45,0);
 },{explode:[-25,42,0],moveFilm:true});
 addPart('A05',sx,132,0,g=>{
   // Candidate structural closure: vertical riser on A04 and horizontal arm
   // from ax to sx. Photo does not prove exact rod length or mounting screws.
   const span=sx-ax,risey=(111+153)/2-132;
   add(g,cub(13,42,13,mats.steel,ax-sx,risey,0));
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
       sp.textContent='手柄 '+h.direction+' · '+h.evidence;b.append(sp);}
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
 el.innerHTML='<span class="status '+part.level+'">'+part.level+' · '+esc(levelMeaning[part.level])+'</span>'+
 '<h2>'+esc(part.name)+'</h2><p class="meta">'+esc(part.maker)+' · '+esc(part.model)+'</p>'+
 '<div class="field"><b>编号 / 分组</b>'+esc(part.id)+' · '+esc(groups[part.group].name)+'</div>'+
 '<div class="field"><b>外形/尺寸/孔位（mm）</b><p>'+esc(part.dims)+'</p></div>'+
 '<div class="field"><b>几何及功能</b><p>'+esc(part.detail)+'</p></div>'+
 '<div class="field"><b>连接接口与制造限制</b><p>'+esc(part.interfaceNote)+'</p></div>'+
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
 parts.forEach(({g,base,part,explode,moveFilm,translateSample,rotateSample})=>{
  const off=explode||[0,0,0],fx=moveFilm?filmShift:0,sx=translateSample?sampleShift:0;
  // Translation in a rotating stage's LOCAL X basis, then rotation about Y.
  const travel=rotateSample?stageLocalTranslation(sx,angle):{x:sx,z:0};
  const dx=travel.x,dz=travel.z;
  g.position.set(base.x+off[0]*e+fx+dx,base.y+off[1]*e,base.z+off[2]*e+dz);
  g.rotation.y=rotateSample?angle:0;
  if(g.userData.slidingTop){
    g.userData.slidingTop.position.x=(part.id==='B03'||part.id==='A15')?filmShift:
      (part.id==='B09'||part.id==='A02')?sampleShift:0;
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
  '载玻片侧由下至上：B02磁吸底座（贴面包板最底层）→B03 T25M（手柄−X）→B04 V25M（竖直手柄+Y）→转移臂。样品侧：B08旋转台（锁止+Z）→B09 NFP（手柄+X）→隔热和加热台。照片108/109/110/111证实顺序，尺寸仍含候选。':
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
  platform=next;
  explosion=0;filmShift=0;sampleShift=0;sampleAngle=0;
  for(const [id,value] of [['explode','0'],['translate','0'],['sample-move','0'],['rotate-sample','0']])$(id).value=value;
  $('explode-value').textContent='0%';$('translate-value').textContent='0 mm';
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
$('btn-sample-stack').onclick=()=>focusMechanicalBranch('sample');
$('btn-home').onclick=()=>focus('home');$('btn-top').onclick=()=>focus('top');$('btn-front').onclick=()=>focus('front');$('btn-rear').onclick=()=>focus('rear');$('btn-iso').onclick=()=>focus('iso');
$('explode').oninput=e=>{explosion=Number(e.target.value);$('explode-value').textContent=explosion+'%';updateTransforms()};
$('translate').oninput=e=>{filmShift=Number(e.target.value);$('translate-value').textContent=filmShift.toFixed(1)+' mm';updateTransforms()};
$('sample-move').oninput=e=>{sampleShift=Number(e.target.value);$('sample-value').textContent=sampleShift.toFixed(1)+' mm';updateTransforms()};
$('rotate-sample').oninput=e=>{sampleAngle=Number(e.target.value);$('rotate-value').textContent=sampleAngle+'°';updateTransforms()};
$('toggle-holes').onclick=e=>{showHoles=!showHoles;e.currentTarget.classList.toggle('on',showHoles);holes.forEach(h=>h.visible=showHoles)};
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
   imported.scale.setScalar(sizeScale);
   imported.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(imported);
   if(bounds.isEmpty()||![bounds.min.x,bounds.max.x,bounds.min.y,bounds.max.y].every(Number.isFinite))throw Error('无法获取导入模型的有效边界');
   const w=bounds.max.x-bounds.min.x,h=bounds.max.y-bounds.min.y,d=bounds.max.z-bounds.min.z;
   if(Math.max(w,h,d)>2000||Math.min(w,h,d)<=0)throw Error('模型单位或方向不正确，请检查 STL/GLB 比例');
   const center=bounds.getCenter(new THREE.Vector3());
   imported.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
   // Keep original geometry in the scene but hide it (non-destructive).
   // Material renderers still use the correct parent group and measured mm.
   part.g.traverse(ob=>{if(ob.isMesh&&!ob.userData.vendorModel)ob.visible=false;});
   if(part.g.userData.vendorImport)part.g.remove(part.g.userData.vendorImport);
   part.g.add(imported);
   part.g.userData.vendorImport=imported;
   imported.traverse(ob=>{
     if(ob.isMesh){ob.castShadow=true;ob.receiveShadow=true;ob.userData.vendorModel=true;
      ob.userData.partId=part.part.id;hitMeshes.push(ob);}
   });
   $('import-status').textContent=part.part.id+' 已导入 '+file.name+' · '+[w,h,d].map(x=>x.toFixed(1)).join('×')+' mm（文件尺寸，不保证装配对位）';
   updateMeasurement();selectedLabels();
 }catch(e){console.error(e);$('import-status').textContent='导入失败：'+String(e?.message||e);}
}
$('import-cad').onclick=()=>{
 if(!active){$('import-status').textContent='请先点击3D中的零件，再导入其厂家模型。';return;}
 $('cad-file').click();
};
$('cad-file').onchange=ev=>importVendorMesh(ev.target.files?.[0]);
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
