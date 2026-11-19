import {BoxGeometry,BufferAttribute,BufferGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Heights in mm above the breadboard, shared by both preview paths.
export const A_FILM_LEVELS={vcTop:146,clamp:98};

// The A05 bracket uses only the registered fold from the private STL.
// Its installed shape was accepted before the photographic stage rebuild.
export function readAFoldedBracket(source){
  const positions=source.getAttribute('position');
  if(positions.count!==6332*3)throw Error('Unexpected micro_stage_v2 facet count');
  const vertices=[];
  for(let face=5632;face<5656;face++){
    for(let i=face*3;i<face*3+3;i++){
      const rawX=positions.getX(i);
      const x=face<5644?Math.min(rawX,41):Math.max(rawX,41);
      vertices.push(x,Math.min(positions.getY(i),179.5)+9,positions.getZ(i));
    }
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(Float32Array.from(vertices),3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export function buildAFoldedBracket(){
  const flange=new BoxGeometry(69,2.5,26).translate(6.5,187.25,0);
  const leg=new BoxGeometry(2.5,90.5,26).translate(42.25,143.25,0);
  const bracket=mergeGeometries([flange,leg]);
  flange.dispose();
  leg.dispose();
  bracket.computeBoundingBox();
  return bracket;
}
