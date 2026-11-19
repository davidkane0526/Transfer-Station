import {BoxGeometry,BufferAttribute,BufferGeometry,Color,CylinderGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Triangle runs of the supplied binary micro_stage_v2.stl. The exporter
// writes each solid contiguously, including both faces of shared deck seams.
const modules={
  A15:[[664,676]],
  A15Y:[[676,1364]],
  A15X:[[1364,1376],[2656,3136]],
  A03:[[1376,2656],[3136,4464]],
  A05:[[5632,5656]]
};

// Heights above the breadboard. The stage decks follow the manufacturer's
// 20 mm magnet + 33 mm XY envelope. Keep the actual drive drums circular.
export const A_FILM_LEVELS={vcTop:146,clamp:98};
const body=new Color('#303840'),metal=new Color('#b8babc');

function registeredHeight(face,y){
  if(face<676)return 20+(y-11)*9/11;
  if(face<688)return 29+(y-22)*5/11;
  if(face<1352)return y+7;
  if(face<1364)return 34+(y-33)*6/14;
  if(face<1376)return 40+(y-47)*13/24.5;
  if(face>=2656&&face<3136)return y-4;
  if(face<4464)return 61+(y-71.5)*(A_FILM_LEVELS.vcTop-61)/(142-71.5);
  return y+9;
}

export function splitAStageMesh(source){
  const positions=source.getAttribute('position');
  const normals=source.getAttribute('normal');
  if(positions.count!==6332*3||normals.count!==positions.count)
    throw Error('Unexpected micro_stage_v2 facet count');
  return Object.fromEntries(Object.entries(modules).map(([name,ranges])=>{
    const vertices=[],colors=[];
    for(const [start,end] of ranges){
      for(let face=start;face<end;face++){
        const color=(face>=872&&face<1352)||(face>=2656&&face<3136)||
          (face>=3172&&face<3812)?metal:body;
        for(let i=face*3;i<face*3+3;i++){
          let x=positions.getX(i);
          let y=positions.getY(i);
          let z=positions.getZ(i);
          // Seat the fold, guide blocks and depth spindle on their mating
          // faces. The source solids overlap at these three joints.
          if(face>=5632&&face<5644&&x>41)x=41;
          if(face>=5644&&face<5656&&x<41)x=41;
          if(face>=5632&&face<5656&&y>179.5)y=179.5;
          if(face>=3148&&face<3160&&x< -1.5)x=-1.5;
          if(face>=872&&face<1032&&z<32.5)z=32.5;
          vertices.push(x,registeredHeight(face,y),z);
          colors.push(color.r,color.g,color.b);
        }
      }
    }
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new BufferAttribute(Float32Array.from(vertices),3));
    geometry.computeVertexNormals();
    geometry.setAttribute('color',new BufferAttribute(Float32Array.from(colors),3));
    geometry.computeBoundingBox();
    return [name,geometry];
  }));
}


// Parametric preview in the same monitor-relative coordinates as the registered
// STL. Publish the mounting datums and primitive geometry only.
export function buildRegisteredAStageMesh(){
  function box(x0,x1,y0,y1,z0,z1,color=body){
    const geometry=new BoxGeometry(x1-x0,y1-y0,z1-z0);
    geometry.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
    return paint(geometry,color);
  }
  function shaft(axis,from,to,radius,x,y,z){
    const geometry=new CylinderGeometry(radius,radius,to-from,40);
    const middle=(from+to)/2;
    if(axis==='x')geometry.rotateZ(Math.PI/2);
    if(axis==='z')geometry.rotateX(Math.PI/2);
    geometry.translate(axis==='x'?middle:x,axis==='y'?middle:y,axis==='z'?middle:z);
    return paint(geometry,metal);
  }
  function paint(geometry,color){
    const positions=geometry.getAttribute('position');
    const values=new Float32Array(positions.count*3);
    for(let i=0;i<values.length;i+=3)values.set([color.r,color.g,color.b],i);
    geometry.setAttribute('color',new BufferAttribute(values,3));
    return geometry;
  }
  const deck=(a,b)=>box(-32.5,32.5,a,b,-32.5,32.5);
  const vertical=y=>registeredHeight(3172,y);
  const shapes={
    A15:[deck(20,29)],
    A15Y:[
      deck(29,34),deck(34,40),box(-18,18,19,37,32.5,33.8),box(-15.5,3.5,22,43,32.5,42.5),
      shaft('z',33.8,39.5,4.3,0,29,0),
      shaft('z',32.5,52,7.6,-6,34,0),shaft('z',52,74,9.7,-6,34,0),shaft('z',74,77,6.79,-6,34,0)
    ],
    A15X:[
      deck(40,53),shaft('x',-43.5,-32.5,6.5,0,46,5),
      shaft('x',-56.5,-43.5,8.1,0,46,5),shaft('x',-59.5,-56.5,5.67,0,46,5)
    ],
    A03:[
      box(-8.5,-1.5,61,vertical(130),-12,12),
      box(-1.5,10.3,vertical(72.5),vertical(127),-10.75,10.75),
      box(-23,1,vertical(76),vertical(85.5),1,12),
      shaft('y',vertical(104),vertical(119),4.6,-18.4,0,10.8),
      shaft('y',vertical(87),vertical(104),5.6,-18.4,0,10.8),
      shaft('y',vertical(84),vertical(87),3.92,-18.4,0,10.8),
      shaft('y',vertical(71.6),vertical(84),2.2,-18.4,0,10.8),
      deck(vertical(130),A_FILM_LEVELS.vcTop)
    ],
    A05:[box(-28,41,186,188.5,-13,13),box(41,43.5,98,188.5,-13,13)]
  };
  return Object.fromEntries(Object.entries(shapes).map(([id,pieces])=>{
    const geometry=mergeGeometries(pieces);
    for(const p of pieces)p.dispose();
    geometry.computeBoundingBox();
    return [id,geometry];
  }));
}
