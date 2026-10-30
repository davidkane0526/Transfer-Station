import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Photo-informed appearance pass. This does not turn a proxy into certified vendor CAD.
// All added geometries are visual subcomponents; nominal mechanical datums remain in parts.js.
export function enrichParts(partMap, platform, onMesh){
  const aluminum=new THREE.MeshPhysicalMaterial({color:0xb4bec7,metalness:.88,roughness:.27,clearcoat:.16,clearcoatRoughness:.26}),
    graphite=new THREE.MeshPhysicalMaterial({color:0x242a32,metalness:.62,roughness:.33,clearcoat:.12}),
    matte=new THREE.MeshStandardMaterial({color:0x11151b,metalness:.26,roughness:.58}),
    gunmetal=new THREE.MeshStandardMaterial({color:0x49535e,metalness:.72,roughness:.39}),
    ring=new THREE.MeshStandardMaterial({color:0x9ba6b2,metalness:.92,roughness:.23}),
    gold=new THREE.MeshStandardMaterial({color:0xe1b16a,metalness:.8,roughness:.34}),
    dialFace=new THREE.MeshStandardMaterial({color:0xe8e2d6,metalness:.45,roughness:.43}),
    green=new THREE.MeshPhysicalMaterial({color:0x173e45,transparent:true,opacity:.9,metalness:.25,roughness:.1}),
    offwhite=new THREE.MeshPhysicalMaterial({color:0xe1e1dd,metalness:.26,roughness:.36,clearcoat:.32}),
    blue=new THREE.MeshStandardMaterial({color:0x1e5a89,metalness:.5,roughness:.34});
  const extras=[];
  function add(g,mesh){mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);extras.push(mesh);return mesh}
  const box=(g,w,h,d,x,y,z,m,r=.8)=>{
    const rad=Math.max(.08,Math.min(r,w/5,h/5,d/5));const ob=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,rad),m);
    ob.position.set(x,y,z);return add(g,ob);
  };
  const cyl=(g,r,h,x,y,z,m,s=40)=>{
    const ob=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,s),m);ob.position.set(x,y,z);return add(g,ob);
  };
  const pipe=(g,coords,r,m)=>{
    const curve=new THREE.CatmullRomCurve3(coords.map(v=>new THREE.Vector3(...v)));
    return add(g,new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(25,coords.length*12),r,9,false),m));
  };
  function decal(g,text,w,h,x,y,z,face='front',fg='#e2edf3',bg='transparent'){
    // Text is a surface marking, not a floating label: it never occludes the model.
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);}
    ctx.fillStyle=fg;ctx.font='bold 54px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,256,63,500);
    const tx=new THREE.CanvasTexture(canvas);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
    const ob=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    ob.position.set(x,y,z);
    if(face==='top')ob.rotation.x=-Math.PI/2;
    if(face==='back')ob.rotation.y=Math.PI;
    if(face==='right')ob.rotation.y=Math.PI/2;
    if(face==='left')ob.rotation.y=-Math.PI/2;
    add(g,ob);return ob;
  }
  function screwHead(g,x,y,z,r=2.4,mode='top'){
    const head=cyl(g,r,1.3,x,y,z,graphite,24);
    const recess=cyl(g,r*.48,.16,x,y+.73,z,matte,6);
    if(mode==='front'){head.rotation.x=Math.PI/2;recess.rotation.x=Math.PI/2;recess.position.set(x,y,z+.74);}
  }
  function knurl(g,x,y,z,r=8,length=24,axis='x',num=42){
    const group=new THREE.Group();group.position.set(x,y,z);g.add(group);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,48),ring);
    if(axis==='x')barrel.rotation.z=Math.PI/2;
    group.add(barrel);extras.push(barrel);
    const edge=new THREE.Mesh(new THREE.TorusGeometry(r-.5,.58,7,48),graphite);
    if(axis==='x')edge.rotation.y=Math.PI/2;else edge.rotation.x=Math.PI/2;
    group.add(edge);extras.push(edge);
    // Fine longitudinal knurl, symmetric about the shaft axis
    const stripeMat=new THREE.MeshStandardMaterial({color:0x69737d,metalness:1,roughness:.4});
    for(let i=0;i<num;i++){
       const a=2*Math.PI*i/num;
       const tooth=new THREE.Mesh(new THREE.BoxGeometry(.35,length*.84,.5),stripeMat);
       if(axis==='x'){tooth.position.set(0,r*Math.sin(a),r*Math.cos(a));tooth.rotation.x=a;}
       else {tooth.geometry.dispose();tooth.geometry=new THREE.BoxGeometry(.35,.5,length*.84);tooth.position.set(r*Math.sin(a),r*Math.cos(a),0);tooth.rotation.z=a}
       group.add(tooth);extras.push(tooth);
    }
    return group;
  }
  function analogScale(g,x,y,z,r,height=2){
    // Vertical engraved tick marks around cylindrical rotary skirt (photo 100/110).
    for(let i=0;i<180;i++){
      const ang=(i/180)*Math.PI*2;
      const major=i%10===0,minor=i%5===0;
      const len=major?6:minor?4:2;
      const tick=box(g,.45,len,.45,Math.sin(ang)*r,y+len*.5,Math.cos(ang)*r,dialFace,.05);
      tick.rotation.y=ang;
    }
    for(const [k,a] of [[0,-Math.PI/2],[90,0],[180,Math.PI/2],[270,Math.PI]]){
      const x1=Math.sin(a)*(r+1),z1=Math.cos(a)*(r+1);
      const t=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({color:0xe8d0a2,transparent:true,opacity:.95,depthWrite:false}));
      t.position.set(x1,y+10,z1);t.rotation.y=a;add(g,t);
    }
  }
  function drilled(g,positions,y,r=2.7){
     for(const [x,z] of positions){
       const q=cyl(g,r,.24,x,y,z,matte,28);
       const inner=cyl(g,r*.52,.22,x,y+.15,z,gunmetal,12);
     }
  }
  function stageHardware(part,frontLabel){
    const g=part.g;
    const movingTop=g.userData.slidingTop||g;
    const stageType=part.part.id;
    const topY=stageType==='B09'?23:['B03','A02','A15'].includes(stageType)?20:65;
    box(g,51,1.2,5,0,stageType==='B09'?11.5:10.4,31,graphite,.1);
    box(g,51,1.2,5,0,stageType==='B09'?11.5:10.4,-31,graphite,.1);
    for(let x of [-21,21])for(let z of [-24,24])screwHead(movingTop,x,topY+.7,z,2.1);
    for(let i=-2;i<=2;i++) box(movingTop,3,2.4,18,i*10,topY-1.5,0,gunmetal,.3);
    // Black crossed roller bearing carrier, side cover screws and engraved branding
    if(stageType==='B09'){
      for(let x of [-26,-15,16,27])screwHead(g,x,11.5,33,2.7,'front');
      decal(g,'Zolix  NFP-1462C',54,9,0,15,33.4,'front','#20262b');
      decal(g,'NFP-1462C',47,8,0,5.2,-33.3,'back','#ebedf3');
      knurl(g,73,12,0,8.8,27,'x',48);
    } else {
      decal(g,frontLabel,54,8,0,14,33.4,'front','#e8eef4');
      // Photo 109: B03 points LEFT, while A02/A15 point RIGHT.
      const handX=stageType==='B03'?-63:63;
      knurl(g,handX,10,0,8.4,26,'x',48);
    }
  }
  function microscopeHardware(g){
    // White rigid angular support, focus shaft, binocular/vision system, objective revolver.
    box(g,43,95,38,-3,184,18,offwhite,3);
    const neck=box(g,38,94,44,-5,226,67,offwhite,3);neck.rotation.x=.26;
    box(g,56,31,62,0,224,111,offwhite,3);
    const turret=cyl(g,24,9,0,189,112,graphite,64);
    for(let i=0;i<4;i++){
       const a=2*Math.PI*i/4,px=15*Math.cos(a),pz=112+15*Math.sin(a);
       cyl(g,9.2,19,px,172,pz,ring,28);
       cyl(g,7.4,20,px,157,pz,graphite,28);
       cyl(g,5.4,5,px,144,pz,ring,28);
       cyl(g,4.1,1.7,px,141,pz,green,28);
       // Coarse barrel rings
       cyl(g,7.7,1,px,160.5,pz,matte,28);
    }
    for(let x of [-45,45]){
       const shaft=cyl(g,18,16,x,222,108,graphite,64);shaft.rotation.z=Math.PI/2;
       const outer=cyl(g,21,3.7,x+(x>0?9:-9),222,108,gunmetal,64);outer.rotation.z=Math.PI/2;
       for(let i=0;i<36;i++){
         const a=2*Math.PI*i/36;
         box(g,.85,1.2,4.8,x+(x>0?12.5:-12.5),222+18*Math.sin(a),108+18*Math.cos(a),ring,.2);
       }
    }
    decal(g,'SDPTOP  MXFMS',48,9,0,243,140.1,'front','#283038');
    decal(g,'MXFMS',37,8,0,248,40,'front','#4b5157');
  }
  function boardHardware(g){
    const base=box(g,420,1.1,4,0,8,150,graphite,.5);
    for(const x of [-200,-175,-150,-125,125,150,175,200])screwHead(g,x,20.4,125,3.3);
  }
  function decoration(id,fn){const p=partMap.get(id);if(p)fn(p.g,p)}
  decoration(platform+'01',(g)=>boardHardware(g));
  if(platform==='B'){
    decoration('B02',(g)=>{
       box(g,65,1.8,65,0,20,0,graphite,.7);
       decal(g,'GCM-420302M',52,9,0,9.5,33.3,'front','#f1f4f5');
       decal(g,'OFF   •   ON',47,6,0,2,33.6,'front','#fff');
       box(g,15,8,16,-24,10,34,ring,1);
       knurl(g,-35,10,38,3.9,10,'x',22);
       drilled(g,[[-25,-25],[-25,25],[25,-25],[25,25]],21.1);
    });
    for(const [id,brand] of [['B03','GCM-T25M'],['B09','Zolix NFP-1462C']]){
      const p=partMap.get(id);if(p)stageHardware(p,brand);
    }
    decoration('B04',(g)=>{
       for(let z of [-24,24]){box(g,3,34,7,-28,31,z,aluminum,.5);for(let y of [13,47])screwHead(g,-28,y,z,2.1);}
       decal(g,'GCM-V25M',50,9,0,27,27.6,'front','#ebedf2');
       // 108.jpg: this knob is the VERTICAL Z-axis adjuster, not another +X.
       knurl(g,-24,73,0,8.5,16,'y',44);
       for(let x of [-24,24])for(let z of [-23,23])screwHead(g,x,66.2,z,2.8);
    });
    decoration('B05',(g)=>{
       // Photo 108 shows Zolix black coupler and a clamped rear-offset rod.
       // These are visual proxies, NOT measured crossbar dimensions.
       cyl(g,19,41,72,63,-40,graphite);
       cyl(g,18,2,72,83,-40,ring);
       cyl(g,18,2,72,42,-40,ring);
       pipe(g,[[72,63,-53],[72,70,-63]],3,graphite);
       box(g,31,29,65,0,63,-20,graphite,1.8);
       knurl(g,27,63,-40,5.5,7,'x',24);
       decal(g,'Zolix',22,7,72,63,-20,'front','#d5d5d5');
       box(g,30,12,36,190,63,-18,graphite,1);
       for(const x of [185,202])knurl(g,x,79,-18,3.5,10,'y',18);
    });
    decoration('B06',(g)=>{
       // Do not place decorative block into the actual 1.5-mm slide gap.
       box(g,32,1.1,13,-8,-11.0,0,graphite,.3);
       for(const x of [-16,6])screwHead(g,x,6.5,0,2.4);
       knurl(g,29,3,5,4.3,15,'y',28);
       decal(g,'CLAMP',30,6,0,7,11.5,'front','#dce3e9');
    });
    decoration('B08',(g)=>{
       analogScale(g,46.7,16,0);
       for(let a of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
          const x=43*Math.cos(a),z=43*Math.sin(a);
          box(g,6,3,9,x,9,z,gunmetal,.5);
       }
       drilled(g,[[-25,-25],[-25,25],[25,-25],[25,25],[0,0]],33.3,2.75);
       // 111.jpg: rotary stage's operator-facing lock/drive along +Z.
       const collar=cyl(g,7.2,22,0,12,77,ring,40);collar.rotation.x=Math.PI/2;
       decal(g,'GCM-1107M',44,9,0,9,46.5,'front','#e1e6ea');
    });
    decoration('B10',(g)=>{
      // Subtle layered grain represents unidentified *white* high-temp insulator.
      // No fake brittle fractures: those would falsely assert exact breakage.
      for(let z of [-31,31])box(g,63,.55,1,0,9.1,z,offwhite,.15);
    });
    decoration('B11',(g)=>{
      // Brushed top plate / wear marks / four recessed heads.
      for(let t=-23;t<=23;t+=5)box(g,57,.06,.17,0,12.06,t,aluminum,.02);
      for(let x of [-25,25])for(let z of [-25,25]){
          cyl(g,5.4,.17,x,11.89,z,graphite,36);
          cyl(g,4.9,.13,x,11.95,z,ring,36);
      }
      const vac=cyl(g,.8,.7,0,12.06,0,matte);
      decal(g,'VACUUM  CHUCK',40,4,0,12.09,-23.5,'top','#596472');
    });
    decoration('B12',(g)=>{
      for(let x of [-15,15])box(g,5,.3,35,x,5.13,0,offwhite,.12);
    });
    decoration('B16',(g)=>microscopeHardware(g));
    decoration('B17',(g)=>{
       box(g,47,49,49,0,24,0,graphite,2.3);
       for(let i=0;i<8;i++)box(g,30,.35,.6,0,4+i*5,-25.2,gunmetal,.1);
       decal(g,'SDPTOP',36,9,0,32,24.9,'front','#e9eef4');
       decal(g,'DIGITAL CAMERA',37,5,0,19,24.9,'front','#9eafbe');
       const port=box(g,11,8,11,25,35,0,matte,.8);
       pipe(g,[[30,35,0],[55,39,-30],[65,31,-70]],2.1,matte);
    });
    decoration('B18',(g)=>{
       for(let y of [-2,-18,-31])cyl(g,12.8,1.7,0,y,0,graphite);
       cyl(g,7,2.8,0,-49.9,0,green);
       decal(g,'10×/0.15  WD10.8',22,4,0,2,12.6,'front','#36414b');
    });
    decoration('B19',(g)=>{
       decal(g,'YUDIAN  AI',75,12,0,79,44,'front','#d7dde5');
       box(g,70,50,4,0,53,43.5,graphite,2);
       box(g,55,14,4,0,61,46,matte,.5);
       decal(g,'19.3    PV',54,11,0,62,48.1,'front','#eb5362');
       decal(g,'0.0     SV',54,10,0,46,48.1,'front','#73d580');
       for(let x of [-25,-12,12,25])box(g,7,5,2,x,32,46,gunmetal,.5);
    });
    decoration('B20',(g)=>{
       box(g,40,8,64,0,15,0,graphite,.6);
       for(let t=-52;t<=52;t+=8)cyl(g,36.7,1.3,t,54,0,gunmetal).rotation.z=Math.PI/2;
       box(g,42,42,43,50,48,0,graphite,2);
       decal(g,'VACUUM PUMP',68,9,0,77,40.3,'front','#f0f3f7');
    });
    decoration('B21',(g)=>{
       for(let z of [-60,-40,-20,0,20,40,60])box(g,4,1.0,10,-107,64,z,graphite,.1);
       decal(g,'MEAN WELL  SE-600-48',146,18,0,31,64,'front','#283e53');
    });
  }else {
     for(const id of ['A02','A15']){const p=partMap.get(id);if(p)stageHardware(p,'GCM-T25M')}
     decoration('A03',(g)=>{
       knurl(g,0,70,31,8.5,15,'y',44);
       decal(g,'GCM-VC13M',53,8,0,30,33,'front','#e6ebf1');
    });
    decoration('A04',(g)=>{
       knurl(g,42,10,0,7.5,19,'x',42);
       decal(g,'GCM-G40M60L',38,6,0,10,20.5,'front','#e3e5e9');
    });
    decoration('A06',(g)=>{analogScale(g,46.2,12);
       const c=cyl(g,7,24,0,12,69,ring);c.rotation.x=Math.PI/2;});
     decoration('A08',(g)=>{
        for(let y of [2,73,84])cyl(g,21.5,2,0,y,0,ring);
        decal(g,'THORLABS TTL200-A',31,8,0,37,21.4,'front','#dce5f1');
        cyl(g,12,2,0,0,0,green);
     });
     decoration('A09',(g)=>{
        for(let y of [2,43])cyl(g,17,2.2,0,y,0,ring);
        decal(g,'DAHENG IMAGING',42,9,0,24,23,'front','#c5e3fa');
        box(g,12,8,12,26,22,0,matte,.5);
     });
     decoration('A11',(g)=>{
       cyl(g,13.8,3,0,33,0,ring);cyl(g,8,3,0,36,0,green);
       decal(g,'THORLABS',20,5,0,22,13,'front','#e2e7e9');
     });
     decoration('A12',(g)=>{
       const front=box(g,58,102,1.8,0,52,37,graphite,2);
       knurl(g,0,45,41,14,8,'y',60);
       decal(g,'LEDD1B',42,9,0,82,38.5,'front','#d9e4eb');
     });
  }
  if(onMesh)for(const m of extras)onMesh(m);
  return {addedMeshes:extras.length,visualPrecision:'photo-informed only'};
}
