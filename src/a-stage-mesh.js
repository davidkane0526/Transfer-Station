import {BufferAttribute,BufferGeometry,Color} from 'three';

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
  const body=new Color('#303840'),metal=new Color('#b8babc');
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
