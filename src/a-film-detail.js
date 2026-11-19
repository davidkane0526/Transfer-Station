import * as THREE from 'three';
import {A_FILM_LEVELS} from './a-stage-mesh.js?v=V212';

// Photo 2 defines the front (eye on -X); photo 1 is the left (eye on +Z).
// Coordinates are mm from the center of the magnetic base, Y above the table.
// The 65 mm deck and the already registered assembly planes supply the scale.
export const A_FILM_DRIVES={
  A15Y:{axis:[0,0,1],seat:[-26,34.5,32.5],length:63,radius:8.7},
  A15X:{axis:[-1,0,0],seat:[-32.5,46,-15],length:46,radius:7.8},
  A03:{axis:[0,1,0],seat:[-21,61,6],length:53,radius:5.8},
  A04L:{axis:[-1,0,0],seat:[-20,155,-13],length:33,radius:6.6},
  A04:{axis:[0,0,1],seat:[-15,176,20],length:40,radius:6.7}
};
export const A_FILM_PHOTO_VIEWS={front:[-1,.16,.12],left:[.06,.15,1]};

const material=(color,metalness=.22,roughness=.48)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const black=material('#262d34');
const edge=material('#39434b');
const rail=material('#4b565e',.6);
const steel=material('#b9c3cb',.72,.31);
const polished=material('#d1d8dc',.8,.23);
const dark=material('#0f151b',.16,.66);
let dialMaterial,knurlMaterial,angleMaterial,vcNameplate;

function mesh(group,geometry,surface,x=0,y=0,z=0){
  const object=new THREE.Mesh(geometry,surface);
  object.position.set(x,y,z);
  object.castShadow=true;
  object.receiveShadow=true;
  group.add(object);
  return object;
}
function box(g,w,h,d,x,y,z,surface=black){
  return mesh(g,new THREE.BoxGeometry(w,h,d),surface,x,y,z);
}
function shaft(g,r,a,b,surface=steel){
  return mesh(g,new THREE.CylinderGeometry(r,r,b-a,48),surface,0,(a+b)/2,0);
}
function profile(width,height,thickness,holes=[]){
  const outline=new THREE.Shape();
  outline.moveTo(-width/2,-height/2);outline.lineTo(width/2,-height/2);
  outline.lineTo(width/2,height/2);outline.lineTo(-width/2,height/2);outline.closePath();
  for(const hole of holes){
    const path=new THREE.Path();
    if(hole.length===3)path.absarc(...hole,0,Math.PI*2,true);
    else{
      const [x,y,w,h]=hole;
      path.moveTo(x-w/2,y-h/2);path.lineTo(x-w/2,y+h/2);
      path.lineTo(x+w/2,y+h/2);path.lineTo(x+w/2,y-h/2);path.closePath();
    }
    outline.holes.push(path);
  }
  return new THREE.ExtrudeGeometry(outline,{depth:thickness,bevelEnabled:false,curveSegments:12});
}
function deck(g,w,d,a,b,holes=[],surface=black){
  const solid=mesh(g,profile(w,d,b-a,holes),surface,0,a,0);
  solid.rotation.x=-Math.PI/2;
}
function fastener(g,x,y,z,axis,radius=2,surface=steel){
  const head=new THREE.Group();
  head.position.set(x,y,z);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...axis));
  g.add(head);
  shaft(head,radius,-.24,.7,surface);
  const socket=mesh(head,new THREE.CircleGeometry(radius*.52,6),dark,0,.705,0);
  socket.rotation.x=-Math.PI/2;
}

function texture(width,height,draw){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'));
  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=THREE.RepeatWrapping;
  map.anisotropy=4;
  return map;
}
function driveFinishes(){
  if(dialMaterial)return;
  const scale=texture(1024,128,ctx=>{
    ctx.fillStyle='#cbd1d2';ctx.fillRect(0,0,1024,128);
    ctx.strokeStyle='#4a5154';ctx.fillStyle='#4a5154';ctx.lineWidth=2;
    ctx.font='22px sans-serif';ctx.textAlign='center';
    // 50 thimble divisions; the displayed reading is illustrative.
    for(let i=0;i<50;i++){
      const x=(i+.5)*1024/50;
      ctx.beginPath();ctx.moveTo(x,127);ctx.lineTo(x,i%5?112:102);ctx.stroke();
      if(i%5===0)ctx.fillText((50-i)%50,x,94);
    }
  });
  scale.colorSpace=THREE.SRGBColorSpace;
  dialMaterial=material('#ffffff',.69,.37);
  dialMaterial.map=scale;
  const bump=texture(512,192,ctx=>{
    ctx.fillStyle='#333';ctx.fillRect(0,0,512,192);
    for(let row=0;row<16;row++)for(let col=-1;col<64;col++){
      const x=(col+(row%2)*.5)*8,y=row*12;
      ctx.fillStyle='#999';ctx.beginPath();
      ctx.moveTo(x,y-6);ctx.lineTo(x+4,y);ctx.lineTo(x,y+6);ctx.lineTo(x-4,y);ctx.fill();
      ctx.fillStyle='#eee';ctx.beginPath();
      ctx.moveTo(x,y-3);ctx.lineTo(x+2,y);ctx.lineTo(x,y+3);ctx.lineTo(x-2,y);ctx.fill();
    }
  });
  knurlMaterial=material('#a9b4bd',.65,.4);
  knurlMaterial.bumpMap=bump;
  knurlMaterial.bumpScale=.35;
  const angle=texture(256,112,ctx=>{
    ctx.fillStyle='#c8cdd0';ctx.fillRect(0,0,256,112);
    ctx.strokeStyle='#252c31';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(128,-166,234,.94,2.20);ctx.stroke();
    for(let tick=-10;tick<=10;tick++){
      const theta=Math.PI/2+tick*.044;
      const end=tick%5===0?263:251;
      ctx.beginPath();ctx.moveTo(128+234*Math.cos(theta),-166+234*Math.sin(theta));
      ctx.lineTo(128+end*Math.cos(theta),-166+end*Math.sin(theta));ctx.stroke();
    }
  });
  angle.colorSpace=THREE.SRGBColorSpace;
  angleMaterial=material('#ffffff',.60,.46);
  angleMaterial.map=angle;
  const nameplate=texture(512,80,ctx=>{
    ctx.fillStyle='#22292f';ctx.fillRect(0,0,512,80);
    ctx.fillStyle='#ccd0cc';ctx.font='bold 34px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('DHC  GCM-VC13M',256,40);
  });
  nameplate.colorSpace=THREE.SRGBColorSpace;
  vcNameplate=material('#ffffff',.12,.58);
  vcNameplate.map=nameplate;
}

function micrometer(part,id){
  const {axis,seat,length,radius}=A_FILM_DRIVES[id];
  const drive=new THREE.Group();
  drive.name='film-micrometer';
  drive.position.set(...seat);
  drive.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...axis));
  part.add(drive);

  const stem=length*.26, collarEnd=length*.36, scaleEnd=length*.69, gripEnd=length-2.8;
  shaft(drive,radius*.46,-3,stem,polished);
  shaft(drive,radius*.67,stem,collarEnd,steel);
  shaft(drive,radius*.88,collarEnd,scaleEnd,dialMaterial);
  shaft(drive,radius,scaleEnd,gripEnd,knurlMaterial);
  const cap=shaft(drive,radius*.72,gripEnd,length,polished);
  cap.name='film-micrometer-cap';
  const tip=new THREE.Object3D();
  tip.position.y=length;
  tip.name='film-micrometer-tip';
  drive.add(tip);

  // The real mount is an off-center clamp with a fastener below the spindle.
  const collar=new THREE.Group();
  collar.position.y=stem*.70;drive.add(collar);
  if(id==='A03'){
    box(collar,16,8,13,2,0,0);
    fastener(collar,-3,0,6.5,[0,0,1],1.9);
  }else{
    const half=stem*.32;
    const center=(half-stem*.70-2)/2;
    box(collar,radius*1.45,half+stem*.70+2,radius*1.52,0,center,0);
    fastener(collar,0,0,radius*.76,[0,0,1],1.7);
  }
  drive.userData.photoFittedDrive=id;
}

const cornerHoles=[[-25,-25,3.25],[-25,25,3.25],[25,-25,3.25],[25,25,3.25]];
const recessHoles=cornerHoles.map(([x,z])=>[x,z,4.6]);
const screwRows=[-16,16];

function frontPanel(g,y,depth,w,h){
  mesh(g,profile(w,h,1.1,[[0,1,w*.72,2.8]]),steel,0,y,depth);
  for(const x of [-w*.31,w*.31])fastener(g,x,y-h*.32,depth+1.09,[0,0,1],1.45);
  const lock=mesh(g,new THREE.CylinderGeometry(2.9,2.9,4.6,28),knurlMaterial,0,y+1,depth+3.4);
  lock.rotation.x=Math.PI/2;
  fastener(g,0,y+1,depth+5.6,[0,0,1],1.55,edge);
}

function buildXY(base,depth,transverse){
  deck(base,65,65,20,29,cornerHoles,black);
  deck(depth,65,65,29,33,cornerHoles,edge);
  deck(depth,62,62,33,41,cornerHoles,black);
  deck(transverse,65,65,41,45,cornerHoles,black);
  deck(transverse,65,65,45,53,cornerHoles,black);
  box(depth,55,.6,1.2,0,32.5,32.3,dark);
  box(transverse,55,.6,1.2,0,44.8,32.3,dark);
  const face=mesh(depth,profile(58,7,1.8,[[0,0,16,4]]),edge,0,35.8,31);
  face.name='xy-guide-window';
  for(const x of [-5,5])mesh(depth,new THREE.CylinderGeometry(1.2,1.2,4,16),polished,x,35.2,33);
  for(const x of [-21,-15,15,21])fastener(depth,x,36,32.8,[0,0,1],1.9);
  for(const z of [-22,-10,11,21])fastener(transverse,-32.5,48,z,[-1,0,0],1.7);
  frontPanel(transverse,45.5,32.5,35,9.5);
  box(depth,1.8,4,6,-33.3,34.5,-11,edge);
  box(transverse,6,5,4,-24,46,-33,edge);
  micrometer(depth,'A15Y');
  micrometer(transverse,'A15X');
}

function buildVertical(g){
  deck(g,65,65,53,58.5,cornerHoles);
  deck(g,65,65,58.5,61,recessHoles);
  deck(g,65,65,133.5,136,recessHoles);
  deck(g,65,65,136,A_FILM_LEVELS.vcTop,cornerHoles);
  mesh(g,new THREE.PlaneGeometry(35,5.47),vcNameplate,-32.51,56.8,4).rotation.y=-Math.PI/2;
  box(g,11.5,72.5,38,2.25,97.25,0);
  box(g,9,68.5,38,-8,98.25,0,edge);
  box(g,4,69,4,-7,99,-18,rail);
  box(g,4,69,4,-7,99,18,rail);
  box(g,2,69.5,31,9,98,0,dark);
  box(g,9,7,23,3,130.5,0,black);
  for(const z of [-12,12])for(const y of [71,91,110,125])fastener(g,-12.5,y,z,[-1,0,0],2.5,dark);
  for(const x of [-4,4])for(const y of [75,121])fastener(g,x,y,19,[0,0,1],1.6,edge);
  micrometer(g,'A03');
}

function buildAngle(g,id,y){
  deck(g,40,40,y,y+4,[],black);
  deck(g,40,40,y+17,y+20,[],edge);
  box(g,36,14,32,0,y+10,0);
  box(g,34,1.4,37,0,y+10,0,dark);
  const cutout=mesh(g,profile(36,12,2,[[0,-.7,13,6]]),black,0,y+9,18);
  cutout.name='goniometer-guide-window';
  for(const x of [-3.2,3.2])mesh(g,new THREE.CylinderGeometry(1,1,5,20),polished,x,y+7.5,19);
  for(const x of screwRows)for(const h of [6.8,14.4])fastener(g,x,y+h,20,[0,0,1],1.8);
  if(id==='A04L'){
    box(g,26,9,.8,0,y+7.5,20.4,steel);
    mesh(g,new THREE.PlaneGeometry(25,8.3),angleMaterial,0,y+7.5,20.81);
    for(const x of [-10,10])fastener(g,x,y+4.4,20.8,[0,0,1],1.3,dark);
    fastener(g,0,y+12.5,21,[0,0,1],2.6,steel);
  }else{
    for(const y0 of [y+7,y+14])for(const z of [-7,-2])fastener(g,-20,y0,z,[-1,0,0],1.75);
  }
  box(g,4,6,7,21,y+9,7,edge);
  const lock=mesh(g,new THREE.CylinderGeometry(2.7,2.7,4.2,28),knurlMaterial,24,y+9,7);
  lock.rotation.z=Math.PI/2;
  micrometer(g,id);
}

export function buildPhotographicFilmStage(){
  driveFinishes();
  const parts=Object.fromEntries(Object.keys(A_FILM_DRIVES).concat('A15').map(id=>[id,new THREE.Group()]));
  buildXY(parts.A15,parts.A15Y,parts.A15X);
  buildVertical(parts.A03);
  buildAngle(parts.A04L,'A04L',A_FILM_LEVELS.vcTop);
  buildAngle(parts.A04,'A04',A_FILM_LEVELS.vcTop+20);
  return parts;
}

export function addAFoldMountingHeads(bracket){
  for(const [x,z] of [[-16,-7.5],[10,7.5]])fastener(bracket,x,188.5,z,[0,1,0],2.1,dark);
}
