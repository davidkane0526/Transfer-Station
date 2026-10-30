import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {CONFIG,PARTS,SOURCE_LINKS} from './parts.js';

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
board:new THREE.MeshStandardMaterial({color:'#586b7b',metalness:.72,roughness:.35}),
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
    filmShift=0,sampleShift=0,sampleAngle=0,showHoles=true,showLabels=true,wireframe=false,showAxes=false;
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
function screw(g,x,y,z,length=25){add(g,cyl(3,length,mats.steel,x,y-length/2,z));add(g,cyl(5,6,mats.silver,x,y-3,z));const hex=add(g,cyl(2.8,.35,mats.ink,x,y-.16,z,6));holes.push(hex)}
function makeBoard(){
 addPart(platform+'01',0,0,0,g=>{
  const {width:w,depth:d,height:h,pitch:p}=CONFIG.board;const c=[];
  for(let x=-200;x<=200;x+=p)for(let z=-125;z<=125;z+=p)c.push([x,z,2.6]);
  const slab=plate(w,d,h,mats.board,c);add(g,slab);
  const grid=new THREE.GridHelper(425,17,0x92a8b8,0x5e7180);grid.position.y=h+.18;g.add(grid);grid.userData.partId=platform+'01';
  label(g,'光学面包板 · 25 mm 网格',-140,h+10,120);
 },{explode:[0,0,0]});
}
function makeStageBlock(id,x,y,z,w,d,h,title,holesPattern=false){
 addPart(id,x,y,z,g=>{
   add(g,cub(w,h*.55,d,mats.dark,0,h*.275,0));add(g,cub(w*.94,h*.45,d*.92,mats.steel,0,h*.78,0));
   add(g,cub(14,12,14,mats.dark,w/2+6,h*.5,0));
   const v=add(g,cyl(6,24,mats.silver,w/2+22,h*.5,0));v.rotation.z=Math.PI/2;
   add(g,cyl(9,12,mats.silver,w/2+34,h*.5,0)).rotation.z=Math.PI/2;
   if(holesPattern)for(const xx of [-25,25])for(const zz of [-25,25])circleGuide(g,3,h+.5,xx,zz);
   label(g,title,0,h+11,0);
 },{explode:[0,id.endsWith('03')?15:10,0]});
}
function filmB(){
 const ax=CONFIG.B.armX;
 addPart('B02',ax,20,0,g=>{
    add(g,cub(65,20,65,mats.dark,0,10,0));
    for(const pitch of [50,40,32])for(const x of [-pitch/2,pitch/2])for(const z of [-pitch/2,pitch/2])circleGuide(g,pitch===50?3:2,20.4,x,z);
    label(g,'GCM-420302M',0,38,0);
 },{explode:[-25,0,0]});
 makeStageBlock('B03',ax,40,0,65,65,20,'GCM-T25M');
 addPart('B04',ax,60,0,g=>{
  add(g,cub(65,8,66,mats.steel,0,4,0));
  add(g,cub(52,46,53,mats.dark,0,31,0));
  add(g,cub(65,8,66,mats.steel,0,58,0));
  const sc=add(g,cyl(7,44,mats.silver,27,31,0));sc.rotation.z=Math.PI/2;
  label(g,'GCM-V25M · Z行程25',0,83,0);
 },{explode:[-24,30,0],moveFilm:true});
 addPart('B05',ax,126,0,g=>{
  add(g,cub(36,20,36,mats.black,0,10,0));
  add(g,cyl(6.35,155,mats.steel,0,97,0));
  add(g,cub(30,28,30,mats.black,0,136,0));
  const rod=add(g,cyl(6.35,249,mats.steel,124.5,139,0));rod.rotation.z=Math.PI/2;
  add(g,cub(27,28,30,mats.black,249,139,0));
  add(g,cyl(5,90,mats.steel,249,94,0));
  label(g,'玻片转移臂：立柱 / 横杆',20,201,0);
 },{explode:[-30,55,-13],moveFilm:true});
 addPart('B06',CONFIG.B.sampleX+52,167,0,g=>{
  add(g,cub(52,13,21,mats.dark,0,0,0));
  add(g,cub(16,23,32,mats.steel,19,-9,0));
  const jaw=add(g,cub(48,4,14,mats.silver,-14,-19,0));
  jaw.rotation.z=-.03;
  label(g,'GCM-1302M 玻片夹',0,31,0);
 },{explode:[-20,65,5],moveFilm:true});
 addPart('B07',CONFIG.B.sampleX+5,139,0,g=>{
  add(g,cub(76,1,26,mats.glass,0,0,0));
  add(g,cub(20,1.8,20,mats.ceramic,20,-2,0));
  label(g,'载玻片 / 转移膜',2,16,0);
 },{explode:[0,80,15],moveFilm:true});
}
function rotaryB(){
 const sx=CONFIG.B.sampleX;
 addPart('B08',sx,20,0,g=>{
    add(g,cyl(47,23,mats.dark,0,11.5,0));
    add(g,cyl(47,10.2,mats.steel,0,28.1,0));
    add(g,torus(45,1.0,mats.ink,0,33.35,0));
    for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(g,2.6,33.5,x,z);
    const knob=add(g,cyl(8,31,mats.silver,54,12,0));knob.rotation.z=Math.PI/2;
    label(g,'GCM-1107M · Ø94×33.2',0,46,0);
 },{explode:[12,0,0],rotateSample:false});
 addPart('B09',sx,53.2,0,g=>{
   add(g,cub(65,11,65,mats.dark,0,5.5,0));
   add(g,cub(65,12,65,mats.steel,0,17,0));
   const mic=add(g,cyl(7,32,mats.silver,46,12,0));mic.rotation.z=Math.PI/2;
   for(const x of [-25,0,25])for(const z of [-25,0,25])circleGuide(g,2.8,23.4,x,z);
   for(const x of [-16,16])for(const z of [-16,16])circleGuide(g,1.6,23.42,x,z);
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
   const ch=tube([[-32,9.3,0],[-18,9.3,0],[0,9.3,0]],1.4,mats.blue);
   ch.material= new THREE.MeshStandardMaterial({color:'#4bc9e8',transparent:true,opacity:.78,depthTest:false});
   add(g,ch);holes.push(ch);
   const top=tube([[0,9.3,0],[0,12.3,0]],.72,mats.blue);add(g,top);holes.push(top);
   label(g,'单中心孔 / 底面开腔 / 4×沉孔',0,31,0);
 },{explode:[0,61,0],rotateSample:true,translateSample:true});
 addPart('B12',sx,86.5,0,g=>{
   add(g,cub(38,5,38,mats.ceramic,0,2.5,0));
   add(g,cub(6,2,1,mats.copper,-24,2.5,12));
   add(g,tube([[-25,2.5,12],[-39,2.5,16],[-55,-2,17]],.85,mats.copper));
   label(g,'陶瓷加热块 38×38×5（优化候选）',0,12,0);
 },{explode:[38,74,12],rotateSample:true,translateSample:true});
 addPart('B13',sx,91.35,0,g=>{
   add(g,cyl(.6,1.2,mats.copper,6,.6,0));
   add(g,tube([[6,.8,0],[-20,.8,2],[-35,-4,10],[-55,-10,15]],.52,mats.blue));
 },{explode:[-17,70,0],rotateSample:true,translateSample:true});
 addPart('B14',sx,86.2,0,g=>{
   for(const x of [-25,25])for(const z of [-25,25]){
      screw(g,x,12,z,25);circleGuide(g,5.5,12.2,x,z);
   }
   label(g,'4 枚顶部齐平螺钉（M6×25 候选）',0,45,0);
 },{explode:[0,88,0],rotateSample:true,translateSample:true});
 addPart('B15',sx,95.5,0,g=>{
   add(g,cyl(3,13,mats.silver,-37,-0.1,0)).rotation.z=Math.PI/2;
   add(g,tube([[-44,0,0],[-63,2,0],[-73,-13,-11],[-91,-45,-35]],1.8,mats.rubber));
 },{explode:[-25,60,-20],rotateSample:true,translateSample:true});
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
 addPart('B18',sx,205,0,g=>{
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
}
function platformA(){
 const ax=CONFIG.A.armX,sx=CONFIG.A.sampleX;
 makeStageBlock('A02',ax,20,0,65,65,20,'GCM-T25M',true);
 addPart('A03',ax,40,0,g=>{
    add(g,cub(65,8,65,mats.steel,0,4,0));add(g,cub(55,32,45,mats.dark,0,24,0));add(g,cub(65,7,65,mats.steel,0,44,0));
    label(g,'GCM-VC13M',0,65,0);
 },{explode:[-15,18,0],moveFilm:true});
 addPart('A04',ax,91,0,g=>{
  add(g,cub(40,20,40,mats.dark,0,10,0));
  const top=add(g,cub(40,5,40,mats.steel,0,25,0));top.rotation.z=.06;
  label(g,'GCM-G40M60L 摆角台',0,45,0);
 },{explode:[-25,42,0],moveFilm:true});
 addPart('A05',sx,152,0,g=>{
   add(g,cub(12,12,60,mats.dark,-55,0,0));
   add(g,cub(155,8,12,mats.steel,-71,25,0));
   add(g,cub(52,13,20,mats.dark,-4,-8,0));
   add(g,cub(76,1,26,mats.glass,0,-18,0));
   label(g,'载玻片转移台 / 夹具',0,34,0);
 },{explode:[-13,65,0],moveFilm:true});
 addPart('A06',sx,20,0,g=>{
  add(g,cyl(47,33.2,mats.dark,0,16.6,0));add(g,torus(44,1,mats.steel,0,33.5,0));
  label(g,'A 套旋转台：GCM-11 系列疑似',0,54,0);
 },{explode:[0,0,0]});
 addPart('A07',sx,53.2,0,g=>{
  add(g,cub(65,18,65,mats.steel,0,9,0));
  add(g,cub(28,1.4,28,mats.glass,0,19.1,0));
  label(g,'A 套样品加热座（形状候选）',0,38,0);
 },{explode:[0,26,0],translateSample:true});
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
}
function addAxis(){
 const axes=new THREE.AxesHelper(80);axes.position.set(-216,22,145);currentRoot.add(axes);axisObjects.push(axes);
}
function populateGroups(){
 const list=$('group-list');list.replaceChildren();
 const meta=PARTS[platform];for(const [key,cfg] of Object.entries(groups)){
   const subset=meta.filter(x=>x.group===key);if(!subset.length)continue;
   const line=document.createElement('label');line.className='group-row';
   const input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.group=key;
   input.onchange=()=>parts.forEach(v=>{if(v.part.group===key)v.g.visible=input.checked});
   const dot=document.createElement('i');dot.className='dot';dot.style.background=cfg.color;
   const tx=document.createElement('span');tx.textContent=cfg.name;
   const count=document.createElement('span');count.className='count';count.textContent=subset.length+' 件';
   line.append(input,dot,tx,count);list.append(line);
 }
}
function updateDetail(part){
 const el=$('part-detail');if(!part){el.className='select-placeholder';el.textContent='点击模型中的任一实体，读取对应厂家、型号、尺寸、孔位证据及当前待核实信息。';return}
 el.className='';
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 el.innerHTML='<span class="status '+part.level+'">'+part.level+' · '+esc(levelMeaning[part.level])+'</span>'+
 '<h2>'+esc(part.name)+'</h2><p class="meta">'+esc(part.maker)+' · '+esc(part.model)+'</p>'+
 '<div class="field"><b>编号 / 分组</b>'+esc(part.id)+' · '+esc(groups[part.group].name)+'</div>'+
 '<div class="field"><b>外形/尺寸/孔位（mm）</b><p>'+esc(part.dims)+'</p></div>'+
 '<div class="field"><b>几何及功能</b><p>'+esc(part.detail)+'</p></div>'+
 '<div class="field"><b>连接接口与制造限制</b><p>'+esc(part.interfaceNote)+'</p></div>'+
 '<div class="field"><b>照片证据编号</b>'+esc(part.evidence)+'</div>'+
 '<div class="field"><b>报价状态</b>'+esc(part.price)+'</div>';
}
function selectPart(id){
 const v=parts.get(id);if(!v)return;
 if(active&&active.g)active.g.traverse(o=>{if(o.isMesh&&o.userData.restoreEmissive!==undefined){o.material=o.userData.originalMat;delete o.userData.originalMat;delete o.userData.restoreEmissive;}});
 active=v;
 v.g.traverse(o=>{if(o.isMesh){const m=o.material;if(m&&m.isMeshStandardMaterial&&!m.transparent){o.userData.originalMat=m;const newmat=m.clone();newmat.emissive=new THREE.Color('#134769');newmat.emissiveIntensity=.65;o.material=newmat;o.userData.restoreEmissive=true;}}});
 updateDetail(v.part);$('hover-help').textContent=v.part.id+' · '+v.part.name;
}
function updateTransforms(){
 const e=explosion/100,angle=sampleAngle*Math.PI/180;
 parts.forEach(({g,base,part,explode,moveFilm,translateSample,rotateSample})=>{
  const off=explode||[0,0,0],fx=moveFilm?filmShift:0,sx=translateSample?sampleShift:0;
  g.position.set(base.x+off[0]*e+fx+sx,base.y+off[1]*e,base.z+off[2]*e);
  g.rotation.y=rotateSample?angle:0;
 });
}
function resetScene(){
 if(active){active=null}parts.clear();hitMeshes.length=0;holes.length=0;labels.length=0;axisObjects.length=0;
 scene.remove(currentRoot);currentRoot=new THREE.Group();scene.add(currentRoot);
 makeBoard();
 if(platform==='B'){filmB();rotaryB();microscopeB();externalB();}
 else platformA();
 addAxis();axisObjects.forEach(a=>a.visible=showAxes);
 holes.forEach(h=>h.visible=showHoles);labels.forEach(l=>l.visible=showLabels);
 populateGroups();updateDetail(null);updateTransforms();
 $('platform-caption').textContent=platform==='B'?'平台 B · MXFMS / 双运动分支 / 真空加热吸附台':'平台 A · Daheng 成像相机 / TTL200-A / 多轴调整';
 $('stack-note').textContent=platform==='B'?
  '样品：光学面包板 → GCM-1107M 旋转 → NFP-1462C 平移 → 10mm 隔热板 → 开腔金属吸附块（内部嵌入陶瓷加热块）。另一分支：磁座 → T25M → V25M → 立柱/横杆 → 玻片夹持。显微镜独立安装。':
  '样品和玻片运动台与成像系统为独立分支。此套系统的显微成像路径含 Thorlabs TTL200-A 和 Daheng 工业相机。A 套样品加热台内部结构未经确认，因此未复制 B 套真空气孔。';
 focus('iso');
 updateTable();
}
function focus(mode){
 const target=new THREE.Vector3(platform==='B'?20:0,130,0);
 const dst=mode==='top'?new THREE.Vector3(0,780,0.01):
  mode==='front'?new THREE.Vector3(0,185,760):
  mode==='iso'?new THREE.Vector3(470,395,505):new THREE.Vector3(520,400,570);
 camera.position.copy(dst);orbit.target.copy(target);camera.lookAt(target);orbit.update();
}
function updateTable(){
 const tbody=$('bom-body');tbody.replaceChildren();
 for(const part of PARTS[platform]){
  const tr=document.createElement('tr');const fields=[part.id,groups[part.group].name,part.name,part.maker+' / '+part.model,part.dims,part.level,part.price,part.evidence];
  for(let i=0;i<fields.length;i++){const td=document.createElement('td');td.textContent=fields[i];if(i===5){const badge=document.createElement('span');badge.className='status '+part.level;badge.textContent=part.level;td.replaceChildren(badge)}tr.append(td)}
  tr.onclick=()=>{selectPart(part.id);$('bom-drawer').classList.remove('open')};tr.style.cursor='pointer';tbody.append(tr)
 }
 $('bom-heading').textContent='平台 '+platform+' · BOM 零件规格与证据';
}
function csvEscape(s){const v=String(s||'');return '"'+v.replaceAll('"','""')+'"'}
function exportCSV(){
 const fields=['id','group','name','maker','model','dims','level','detail','interfaceNote','evidence','price'];
 const body='\ufeff'+[fields.join(','),...PARTS[platform].map(o=>fields.map(f=>csvEscape(o[f])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Transfer_Station_'+platform+'_BOM.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
renderer.domElement.addEventListener('pointerup',ev=>{
 if(Math.abs(ev.movementX)>5||Math.abs(ev.movementY)>5)return;
 const bounds=renderer.domElement.getBoundingClientRect();pointer.set(((ev.clientX-bounds.left)/bounds.width)*2-1,-((ev.clientY-bounds.top)/bounds.height)*2+1);
 raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(hitMeshes.filter(x=>x.visible&&x.parent?.visible),false);
 for(const hit of hits){let cur=hit.object;while(cur&&!cur.userData.partId)cur=cur.parent;if(cur?.userData.partId){selectPart(cur.userData.partId);break}}
});
$('show-b').onclick=()=>{platform='B';$('show-b').classList.add('on');$('show-a').classList.remove('on');resetScene()};
$('show-a').onclick=()=>{platform='A';$('show-a').classList.add('on');$('show-b').classList.remove('on');resetScene()};
$('btn-home').onclick=()=>focus('home');$('btn-top').onclick=()=>focus('top');$('btn-front').onclick=()=>focus('front');$('btn-iso').onclick=()=>focus('iso');
$('explode').oninput=e=>{explosion=Number(e.target.value);$('explode-value').textContent=explosion+'%';updateTransforms()};
$('translate').oninput=e=>{filmShift=Number(e.target.value);$('translate-value').textContent=filmShift.toFixed(1)+' mm';updateTransforms()};
$('sample-move').oninput=e=>{sampleShift=Number(e.target.value);$('sample-value').textContent=sampleShift.toFixed(1)+' mm';updateTransforms()};
$('rotate-sample').oninput=e=>{sampleAngle=Number(e.target.value);$('rotate-value').textContent=sampleAngle+'°';updateTransforms()};
$('toggle-holes').onclick=e=>{showHoles=!showHoles;e.currentTarget.classList.toggle('on',showHoles);holes.forEach(h=>h.visible=showHoles)};
$('toggle-labels').onclick=e=>{showLabels=!showLabels;e.currentTarget.classList.toggle('on',showLabels);labels.forEach(h=>h.visible=showLabels)};
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
$('export-csv').onclick=exportCSV;document.addEventListener('keydown',e=>{if(e.key==='Escape')$('bom-drawer').classList.remove('open')});
function resize(){
 const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);labelRenderer.setSize(w,h);
}
window.addEventListener('resize',resize);new ResizeObserver(resize).observe(host);
resetScene();resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);labelRenderer.render(scene,camera)});
