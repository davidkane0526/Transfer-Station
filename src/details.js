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
    // Physically consistent micrometer drum: each groove runs ALONG the
    // cylinder axis. V17-V21 placed "X" grooves along Y, causing black spikes.
    if(!['x','y','z'].includes(axis))throw Error('Invalid knurl axis');
    const group=new THREE.Group();group.position.set(x,y,z);g.add(group);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,48),ring);
    if(axis==='x')barrel.rotation.z=Math.PI/2;
    if(axis==='z')barrel.rotation.x=Math.PI/2;
    group.add(barrel);extras.push(barrel);
    const stripeMat=new THREE.MeshStandardMaterial({color:0x66727d,metalness:.85,roughness:.42});
    for(let i=0;i<num;i++){
      const a=2*Math.PI*i/num;
      let o,offset=r+.02;
      if(axis==='x'){
        o=new THREE.Mesh(new THREE.BoxGeometry(length*.86,.22,.32),stripeMat);
        o.position.set(0,offset*Math.sin(a),offset*Math.cos(a));o.rotation.x=a;
      }else if(axis==='y'){
        o=new THREE.Mesh(new THREE.BoxGeometry(.22,length*.86,.32),stripeMat);
        o.position.set(offset*Math.sin(a),0,offset*Math.cos(a));o.rotation.y=a;
      }else{
        o=new THREE.Mesh(new THREE.BoxGeometry(.22,.32,length*.86),stripeMat);
        o.position.set(offset*Math.sin(a),offset*Math.cos(a),0);o.rotation.z=a;
      }
      group.add(o);extras.push(o);
    }
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r-.45,.5,8,48),graphite);
    if(axis==='x')rim.rotation.y=Math.PI/2;
    if(axis==='y')rim.rotation.x=Math.PI/2;
    group.add(rim);extras.push(rim);
    return group;
  }
  function analogScale(g,r,y,height=2){
    // V67: radius must be explicitly supplied. The old 5-argument
    // signature received only 2-3 values and created NaN-position ticks.
    // Vertical engraved tick marks around cylindrical rotary skirt (photo 100/110).
    for(let i=0;i<180;i++){
      const ang=(i/180)*Math.PI*2;
      const major=i%10===0,minor=i%5===0;
      const len=major?6:minor?4:2;
      const tick=box(g,.45,len,.45,Math.sin(ang)*r,y+len*.5,Math.cos(ang)*r,dialFace,.05);
      tick.userData.AuxAngularTick=true;
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
    const topY=['B09','B41'].includes(stageType)?23:['B03','A15'].includes(stageType)?33:stageType==='A02'?33:65;
    box(g,51,1.2,5,0,['B09','B41'].includes(stageType)?11.5:10.4,31,graphite,.1);
    box(g,51,1.2,5,0,['B09','B41'].includes(stageType)?11.5:10.4,-31,graphite,.1);
    for(let x of [-21,21])for(let z of [-24,24])screwHead(movingTop,x,topY+.7,z,2.1);
    for(let i=-2;i<=2;i++) box(movingTop,3,2.4,18,i*10,topY-1.5,0,gunmetal,.3);
    // Black crossed roller bearing carrier, side cover screws and engraved branding
    if(stageType==='B09'){
      // The maker drawing looks at the native drive on -X, while photo110
      // sees the complete stage turned 180°: drive becomes world +X.
      // The actual photo shows Zolix branding toward the camera.
      for(let x of [-26,-15,16,27])screwHead(g,x,11.5,-33,2.7,'back');
      decal(g,'Zolix  NFP-1462C',54,9,0,15,-33.4,'back','#20262b');
      // Small scene-only band at the LOWER edge of the upper X stage,
      // intentionally separated from the genuine OEM side branding.
      const xAxisTag=decal(g,'上层 X · B09',43,5.0,0,6.2,-33.6,'back','#eaf6ff','#24445c');
      xAxisTag.userData.modelOnlyAxisAnnotation='upper-X';
      knurl(g,-131,12,0,10.5,27,'x',48);
    } else if(stageType==='B41'){
      // Unidentified lower 65mm-class linear stage: preserve its own
      // forward-facing micrometer after the 90-degree crossed install.
      // No manufacturer logo or exact NFP model is asserted.
      knurl(g,-88.5,12,0,10.5,27,'x',48);
      // The lower Y stage faces a different direction. Put the
      // photo-review-only badge on its exposed near face (local -X).
      const yAxisTag=decal(g,'Y轴 · B41',21,5.0,-33.6,17,20,'left','#edf7ff','#334a5d');
      yAxisTag.userData.modelOnlyAxisAnnotation='lower-Y';
    } else {
      decal(g,frontLabel,54,8,0,14,33.4,'front','#e8eef4');
      // A15/A02 actuator solids are already constructed in app.js as
      // support -> spindle -> collar -> drum chains. Re-adding decorative
      // knurls here created the detached third knob seen in the user's
      // 2026-11-11 screenshot. Keep decorations visual-only.
      if(stageType==='A15'||stageType==='A02'){
        g.userData.noDuplicateDecorativeStageActuators=true;
      }else{
        // Stage B03 is installed yaw=180° relative to magnet. From its
        // own branded face (photo109), the handwheel is local +X/right.
        const handX=63;
        knurl(g,handX,topY-9,0,8.4,26,'x',48);
        if(stageType==='B03'){
          const sign=-1;
          const depth=sign*72;
          const barrel=cyl(g,8.6,24,0,6,depth,ring,48);
          barrel.rotation.x=Math.PI/2;
          for(let n=0;n<32;n++){
            const a=n*Math.PI/16;
            box(g,.34,.34,20,8.6*Math.cos(a),6+8.6*Math.sin(a),depth,graphite,.1);
          }
          const cap=cyl(g,9.1,4,0,6,depth+sign*13,graphite,48);cap.rotation.x=Math.PI/2;
        }
      }
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
    decoration('B35',(g)=>{
       // The black sample-side plate is independently visible in
       // photos145/150. Only THORLABS logo and black finish are verified.
       // The exact length, hole pitch and fixing bolts remain candidates.
       // Extend the true FRONT edge decal to candidate Z=+150.
       // Keep label on the plate's front side, not floating in mid-board.
       box(g,67,8,.6,0,6,150.25,matte,.2);
       decal(g,'THORLABS',62,6,0,6,150.68,'front','#f2f5f6');
    });
    decoration('B02',(g)=>{
       box(g,65,1.8,65,0,20,0,graphite,.7);
       decal(g,'GCM-420302M',52,9,0,9.5,33.3,'front','#f1f4f5');
       decal(g,'OFF   •   ON',47,6,0,2,33.6,'front','#fff');
       box(g,15,8,16,-24,10,34,ring,1);
       knurl(g,-35,10,38,3.9,10,'x',22);
       drilled(g,[[-25,-25],[-25,25],[25,-25],[25,25]],21.1);
    });
    for(const [id,brand] of [['B03','GCM-T25M'],['B09','Zolix NFP-1462C'],['B41','']]){
      const p=partMap.get(id);if(p)stageHardware(p,brand);
    }
    decoration('B04',(g)=>{
       // Do not recreate the two apparent floating steel rods on the
       // V25M front/side. A single integrated flush face cover remains.
       // Do not bury a separate opaque plate in the stationary body.
       // A narrow side cover sits externally, with no floating rails.
       box(g,1.2,36,34,-28.8,31,0,gunmetal,.3);
       // Screw heads are normal to the -X side cover, not the front Z face.
       for(const z of [-16,16])for(const y of [15,47]){
         const head=cyl(g,2.1,1.1,-29.3,y,z,aluminum,24);
         head.rotation.z=Math.PI/2;
         const socket=cyl(g,1.0,.14,-30.0,y,z,matte,6);
         socket.rotation.z=Math.PI/2;
       }
       // V25M branded flange is visible from the SAME rear view as T25M (109).
       decal(g,'GCM-V25M',50,9,0,60,-33.5,'back','#ebedf2');
       // The single V25M micrometer at local X=-39 is already
       // explicitly modeled in app.js. The previous decorative knurl
       // at X=-24 made an unconnected SECOND vertical micrometer.
       // Similarly 4 old heads at Y66.2/Z±23 floated ABOVE the
       // stationary guide (Y60 top) and are intentionally deleted.
    });
    decoration('B05',(g)=>{
       // OEM hardware was decomposed into B24/B25/B27. Do not add a
       // second terminal block at the old invalid 140mm geometry.
       decal(g,'MOUNT · UNVERIFIED',38,5,0,6,22.7,'front','#c5ccd4');
    });
    decoration('B24',(g)=>{
       // 149 clearly shows the actual model, not a vendor series guess.
       decal(g,'PHUC-1',23,5,0,3.2,13.15,'front','#e5eaf0');
    });
    // B26 is ONLY a tiny unverified M6 interface at the rod end.
    // No separate visible sticker, adapter or floating bracket.
    decoration('B06',(g)=>{
       // Geometry and actual two Y-axis adjustment screws live in app.js.
       // Extra side-facing screws would create a fake third/fourth drive.
       // Keep only shallow machined rail detail and a small candidate label.
       box(g,10,.45,51,6,-5.8,0,gunmetal,.2);
       decal(g,'GCM-1302M',34,5,0,2.55,30.4,'front','#dce3e9');
    });
    decoration('B08',(g)=>{
       analogScale(g,46.7,16);
       for(let a of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
          const x=43*Math.cos(a),z=43*Math.sin(a);
          box(g,6,3,9,x,9,z,gunmetal,.5);
       }
       drilled(g,[[-25,-25],[-25,25],[25,-25],[25,25],[0,0]],33.3,2.75);
       // User-confirmed rotary stage has NO external operating handle.
       decal(g,'GCM-1107M',44,9,0,9,46.5,'front','#e1e6ea');
    });
    decoration('B10',(g)=>{
      // Subtle layered grain represents unidentified *white* high-temp insulator.
      // No fake brittle fractures: those would falsely assert exact breakage.
      for(let z of [-31,31])box(g,63,.55,1,0,9.1,z,offwhite,.15);
    });
    decoration('B11',(g)=>{
      // Brushed top plate / wear marks / four recessed heads.
      for(let t=-23;t<=23;t+=5)box(g,57,.06,.17,0,11.96,t,aluminum,.02);
      for(let x of [-25,25])for(let z of [-25,25]){
          cyl(g,5.4,.17,x,11.89,z,graphite,36);
          cyl(g,4.9,.10,x,11.93,z,ring,36);
      }
      // Actual vacuum center is an OPEN bore; never add a fake raised plug.
      decal(g,'VACUUM  CHUCK',40,4,0,11.99,-23.5,'top','#596472');
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
       // Yudian AI front panel physically mounts ON the B36 enclosure,
       // photo114. Previous V32 decals were still floating ~35mm in
       // front of the slim controller because B19 used to be a box.
       decal(g,'YUDIAN  AI',75,10,0,75,11.1,'front','#d7dde5');
       box(g,70,48,3,0,53,10.2,graphite,2);
       box(g,55,14,3,0,61,11.4,matte,.5);
       decal(g,'19.3    PV',54,11,0,62,13.2,'front','#eb5362');
       decal(g,'0.0     SV',54,10,0,46,13.2,'front','#73d580');
       for(let x of [-25,-12,12,25])box(g,7,5,2,x,32,11.6,gunmetal,.5);
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
     decoration('A17',(g)=>{
       // V94: photo194 visibly contains a light front OFF/ON-style plaque,
       // but the 128×170 repository preview cannot resolve the brand/SKU.
       // Render the photographed label topology without inventing text.
       const plaque=decal(g,'OFF       OEM ?       ON',40,6,5,10,33.35,'front','#dfe6ec');
       plaque.userData.A17Photo194FrontPlaqueDecoration=true;
       g.userData.A17BrandTextIntentionallyUnresolved=true;
     });
     for(const id of ['A02','A15']){const p=partMap.get(id);if(p)stageHardware(p,'GCM-T25M')}
     decoration('A03',(g)=>{
       // A03 already has ONE physical micrometer at local Y39/Z40.
       // Previous knurl(Y70/Z31) was an unsupported floating SECOND drum.
       g.userData.noDuplicateDecorativeMicrometer=true;
       const nameplate=decal(g,'GCM-VC13M',40,8,0,30,7.5,'front','#e6ebf1');
       nameplate.userData.A03LabelOnStationaryFace=true;
    });
    decoration('A04',(g)=>{
       // One right-hand micrometer already exists in app.js (with rings).
       g.userData.noDuplicateDecorativeG40Drum=true;
       decal(g,'GCM-G40M60L',38,6,0,10,20.5,'front','#e3e5e9');
    });
    decoration('A06',(g)=>{analogScale(g,31.8,8); g.userData.A06NoFalseMicrometerDecoration=true;});
     decoration('A08',(g)=>{
        // A08 TTL200-A housing nominal local Y=0..28mm only.
        // Rings Y73 and Y84 were disconnected ghost geometry.
        for(const y of [2,12,20]){
          const rim=cyl(g,26.5,1.2,0,y,0,ring);
          rim.userData.A08HousingCollarCandidate=true;
        }
        g.userData.A08HousingCollarsConfinedToNominal28mm=true;
        decal(g,'THORLABS TTL200-A',31,8,0,14,26.4,'front','#dce5f1');
        cyl(g,12,2,0,0,0,green);
     });
     decoration('A09',(g)=>{
        for(let y of [2,43])cyl(g,17,2.2,0,y,0,ring);
        decal(g,'DAHENG IMAGING',42,9,0,24,23,'front','#c5e3fa');
        box(g,12,8,12,26,22,0,matte,.5);
     });
     decoration('A11',(g)=>{
       // The MWWHL4 body/emitter already exist in app.js along local X.
       // Old Y-axis decorative discs floated above the lamp (user Fig.2).
       // Keep only a side marking attached to the actual cylindrical body.
       const tag=decal(g,'THORLABS',20,5,36,0,15.45,'front','#e2e7e9');
       tag.userData.A11BodyAttachedBrandDecoration=true;
       g.userData.noDuplicateDecorativeEmitterDiscs=true;
     });
     decoration('A13',(g)=>{
       // CDG1 family appearance, not a verified wiring diagram. The
       // aluminium spreader and side fins are candidate thermal hardware.
       box(g,80,3,70,0,6.5,0,aluminum,.5);
       box(g,72,28,60,0,24,0,graphite,1.4);
       for(const side of [-1,1])for(let z=-22;z<=22;z+=11){
         const fin=box(g,3,17,2.2,side*39,20,z,aluminum,.2);
         fin.userData.A13HeatSinkFinCandidate=true;
       }
       for(const x of [-25,25])for(const z of [-21,21]){
         box(g,10,5,9,x,43.5,z,graphite,.6);
         const terminal=cyl(g,2.6,2.2,x,47,z,ring,6);
         terminal.userData.A13TerminalScrewCandidate=true;
       }
       const led=cyl(g,2,1.2,0,27,32.7,green,24);led.rotation.x=Math.PI/2;
       led.userData.A13StatusLEDProxy=true;
       decal(g,'DELIXI  CDG1',46,5.5,0,16,36.1,'front','#e8edf2');
       g.userData.A13HeatSinkCandidate=true;
       g.userData.A13TerminalScrewCount=4;
       g.userData.A13VariantAndPinoutUnverified=true;
     });
     decoration('A30',(g)=>{
       // VN-50-family appearance reference only; Platform A pump SKU remains
       // unverified. Details follow the official twin-head / motor / filter
       // product silhouette without claiming exact internal construction.
       box(g,48,18,1.4,-10,50,45,graphite,.5);
       decal(g,'OIL-FREE PUMP',42,5.5,-10,50,45.8,'front','#e5ebf0');
       for(const x of [-28,8])screwHead(g,x,50,45.9,1.5,'front');
       const fanRing=new THREE.Mesh(new THREE.TorusGeometry(34,1.2,8,48),aluminum);
       fanRing.rotation.y=Math.PI/2;fanRing.position.set(-96,50,0);add(g,fanRing);
       fanRing.userData.A30FanGuardRing=true;
       for(let i=0;i<4;i++){
         const spoke=box(g,1.8,64,1.5,-96.2,50,0,ring,.2);
         spoke.rotation.x=i*Math.PI/4;
         spoke.userData.A30FanGuardSpoke=true;
       }
       const hub=cyl(g,8,2,-97.2,50,0,graphite,32);
       hub.rotation.z=Math.PI/2;hub.userData.A30FanHub=true;
       for(const x of [-45,30]){
         for(const z of [-22.1,22.1])for(let y=100;y<=128;y+=5){
           const rib=box(g,42,1.2,1.3,x,y,z,aluminum,.15);
           rib.userData.A30HeadCoolingRib=true;
         }
         for(const side of [-1,1])for(let y=102;y<=126;y+=6){
           const rib=box(g,1.3,1.2,40,x+side*21.3,y,0,aluminum,.15);
           rib.userData.A30HeadSideCoolingRib=true;
         }
         for(const dx of [-15,15])for(const dz of [-15,15])
           screwHead(g,x+dx,136.3,dz,1.6);
       }
       cyl(g,8.2,2,50,128,0,graphite,40).userData.A30FilterTopCap=true;
       cyl(g,8.2,2,50,106,0,graphite,40).userData.A30FilterBottomCap=true;
       for(let i=0;i<8;i++){
         const a=i*Math.PI/4;
         const rib=box(g,.65,15,.7,50+8*Math.cos(a),117,8*Math.sin(a),ring,.08);
         rib.userData.A30FilterPleat=true;
       }
       for(const x of [76,79,82]){
         const barb=new THREE.Mesh(new THREE.TorusGeometry(5.8,.65,8,32),ring);
         barb.rotation.y=Math.PI/2;barb.position.set(x,68,0);add(g,barb);
         barb.userData.A30InletBarbRingCandidate=true;
       }
       g.userData.A30OEMFamilyDetailsAdded=true;
       g.userData.A30ExactPumpSKUStillUnverified=true;
     });
     decoration('A33',(g)=>{
       // Generic 96mm-class panel PID candidate. The real controller make,
       // keypad legend and readout values are not identified.
       const redLED=new THREE.MeshBasicMaterial({color:0xff3948});
       const greenLED=new THREE.MeshBasicMaterial({color:0x55ef88});
       const patterns={
         '0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc',
         '5':'afgcd','6':'afgcde','7':'abc','8':'abcdefg','9':'abfgcd'
       };
       const drawDigit=(x,y,z,value,material,tag)=>{
         const spec={
           a:[5.2,1.05,0,5.1],b:[1.05,4.2,2.55,2.6],
           c:[1.05,4.2,2.55,-2.6],d:[5.2,1.05,0,-5.1],
           e:[1.05,4.2,-2.55,-2.6],f:[1.05,4.2,-2.55,2.6],
           g:[5.2,1.05,0,0]
         };
         for(const key of patterns[value]||''){
           const [w,h,dx,dy]=spec[key];
           const seg=box(g,w,h,.85,x+dx,y+dy,z,material,.12);
           seg.userData[tag]=true;
         }
       };
       for(const [row,y,material,tag] of [
         ['PV',124,redLED,'A33PVSegment'],['SV',96,greenLED,'A33SVSegment']
       ]){
         decal(g,row,8,3.2,-29,y,81,'front','#cbd4dd');
         const xs=[-9,1,11];
         ['2','5','0'].forEach((digit,i)=>drawDigit(xs[i],y,81,digit,material,tag));
         const dot=cyl(g,.9,.8,7,y-4.7,81.1,material,20);
         dot.rotation.x=Math.PI/2;dot.userData[tag]=true;
       }
       for(const [x,word] of [[-30,'SET'],[-10,'▲'],[10,'▼'],[30,'ENT']]){
         const cap=box(g,7.5,4.2,1.4,x,71,80.3,ring,.7);
         cap.userData.A33PIDKeyCap=true;
         decal(g,word,7,2.6,x,64.5,80.9,'front','#dce4ea');
       }
       for(const [x,material] of [[-43,redLED],[43,greenLED]]){
         const led=cyl(g,1.5,1.2,x,62,80.4,material,24);
         led.rotation.x=Math.PI/2;led.userData.A33StatusIndicator=true;
       }
       for(const x of [-48,48])for(const y of [64,151])
         screwHead(g,x,y,80.1,2.1,'front');
       // Rear wall pass-throughs: three distinct cable glands, not one
       // oversized decorative grommet floating on an open enclosure.
       for(const [x,y] of [[-7,18],[11,18],[45,14]]){
         const ringMesh=new THREE.Mesh(new THREE.TorusGeometry(5.7,1.0,8,32),rubber);
         ringMesh.position.set(x,y,-73.2);add(g,ringMesh);
         ringMesh.userData.A33RearGlandRing=true;
       }
       decal(g,'TEMP CONTROL · MODEL UNVERIFIED',112,8,0,35,77.9,'front','#bbc3cc');
       g.userData.A33ReadoutValuesAreVisualPlaceholders=true;
       g.userData.A33PIDKeyCount=4;
       g.userData.A33RearGlandCount=3;
     });
     decoration('A12',(g)=>{
       decal(g,'LED - DRIVER   LEDD1B',46,6,0,74.2,-29,'top','#dce4ed');
       decal(g,'THORLABS',39,6,0,74.2,36,'top','#d6e4ed');
       decal(g,'CW   TRIG   MOD',38,4.5,-9,74.2,-40,'top','#e0e5eb');
       decal(g,'CURRENT LIMIT',47,5,0,56.5,51.1,'front','#d6e4ed');
       decal(g,'0.2   0.5   1.2 A',44,5,0,30,51.1,'front','#ccd3df');
       // OEM top intensity scale and front current-limit graduations.
       for(let i=0;i<32;i++){
         const a=i*Math.PI*2/32,r=19.1;
         const tick=box(g,.75,.65,i%4===0?3.2:2.1,r*Math.cos(a),74.35,1+r*Math.sin(a),dialFace,.08);
         tick.rotation.y=-a;tick.userData.A12TopScaleTick=true;
       }
       for(let i=0;i<24;i++){
         const a=i*Math.PI*2/24,r=10.4;
         const tick=box(g,i%4===0?1.5:1,.65,.55,r*Math.cos(a),43+r*Math.sin(a),52.65,dialFace,.08);
         tick.rotation.z=a;tick.userData.A12FrontLimitTick=true;
       }
       // Knurled side grip on the actual top control, not a second knob.
       for(let i=0;i<24;i++){
         const a=i*Math.PI*2/24,r=13.7;
         const grip=box(g,.7,7,.7,r*Math.cos(a),80,1+r*Math.sin(a),ring,.08);
         grip.rotation.y=-a;grip.userData.A12KnobGripRib=true;
       }
       const lever=cyl(g,1.25,4.5,-20,81,-29,ring,24);
       lever.userData.A12ModeLever=true;
       const cap=cyl(g,2.1,1.6,-20,83.7,-29,graphite,24);
       cap.userData.A12ModeLeverCap=true;
       const shell=new THREE.Mesh(new THREE.TorusGeometry(4.4,.65,8,32),ring);
       shell.position.set(0,42,-133);add(g,shell);shell.userData.A12M8ShellRing=true;
       for(const x of [-1.15,1.15])for(const y of [40.85,43.15]){
         const pin=cyl(g,.62,1.2,x,y,-133.3,gold,20);
         pin.rotation.x=Math.PI/2;pin.userData.A12M8ContactProxy=true;
       }
       const dcShell=new THREE.Mesh(new THREE.TorusGeometry(3.1,.55,8,32),ring);
       dcShell.position.set(-18,17,-132);add(g,dcShell);dcShell.userData.A12DCJackShell=true;
       g.userData.A12OEMControlSurfaceDetailed=true;
       g.userData.A12M8ContactCount=4;
     });
  }
  if(onMesh)for(const m of extras)onMesh(m);
  return {addedMeshes:extras.length,visualPrecision:'photo-informed only'};
}
