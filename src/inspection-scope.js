import {explosionOffset,filmFan,stroke} from './explosion.js';

export const scopes={
  all:'整机',
  film:'玻璃片位移台',
  sample:'硅片位移台与加热控制',
  optics:'显微与光源',
};

const requiredA=['A01','A17','A15','A03','A04L','A04','A05','A05C','A05CS','A05G',
  'A16','A06','A02','A32','A31','A26','A27','A07','A28','A29','A30','A10','A11',
  'A12','A13','A33','A22','A23','A24','A25'];
const legacyA=['A07W','A21'];
const requiredB=['B01','B35','B03','B07','B08','B41','B09','B10','B11','B12','B13',
  'B14','B15','B16','B17','B18','B19','B20','B21','B22','B23','B36','B37','B38','B39','B40'];
const currentB=['B02','B04','B05','B06','B24','B25','B26','B27','B28','B33','B34'];
const photo94B=['B29','B30','B31','B32'];

export function requiredSceneParts(platform,{reviewA=false,photo94=false}={}){
  return platform==='A'?[...requiredA,...(reviewA?[]:legacyA)]:[...requiredB,...(photo94?photo94B:currentB)];
}

export function assemblyFor(part){
  if(part.group==='film')return 'film';
  if(['microscope','illumination'].includes(part.group))return 'optics';
  if(part.group!=='base'||part.id==='B-H01')return 'sample';
  return 'all';
}

// Span the entire local slider with the relevant steps from the full sequence.
export function assemblyTime(scope,progress){
  if(!progress)return 0;
  if(scope==='sample')return .28+.72*progress;
  return progress;
}

export function filmAxisSpread(scope,progress){
  return scope==='film'?stroke(progress,.35,1):filmFan(progress);
}

export function assemblyOffset(platform,id,scope,progress,filmHeight){
  if(!progress)return [0,0,0];
  if(scope==='film'){
    if(platform==='A'){
      const release=stroke(progress,0,.18);
      const slide=stroke(progress,.18,.35);
      return [id==='A05G'?38*slide:0,(filmHeight??0)*filmAxisSpread(scope,progress)+
        (id==='A05CS'?15*release:0),0];
    }
    // The glass and coaxial rod connections withdraw along their own axes
    // before the vertical stack is lifted. Keep the lower rod, stud and
    // holder together while the exact M6 joint remains unverified.
    const slide=stroke(progress,0,.18);
    const lower=stroke(progress,.18,.39);
    const upper=stroke(progress,.39,.57);
    const layers=stroke(progress,.57,1);
    if(id==='B07')return [46*slide+100*lower+61*upper,0,0];
    if(['B06','B26','B28'].includes(id))return [100*lower+61*upper,0,0];
    if(id==='B24')return [61*upper,0,0];
    if(id==='B25')return [-70*upper,0,0];
    if(id==='B33')return [0,189*layers,0];
    if(id==='B27')return [0,110*layers,0];
    if(id==='B34')return [0,40*layers,0];
    const height={B03:8,B04:20,B05:29,B29:0,B30:20,B31:40,B32:58};
    return [0,(height[id]??0)*layers,0];
  }
  if(scope==='optics'){
    const split=stroke(progress,.15,.8);
    const release=stroke(progress,.42,1);
    if(platform==='A'){
      if(id==='A11')return [49*split,0,0];
      if(id==='A19')return [0,-43*split,0];
      if(id==='A14')return [0,27*release,0];
      if(id==='A09')return [0,57*split+27*release,0];
    } else {
      if(id==='B17')return [0,55*split,0];
      if(id==='B18')return [0,-50*split,0];
    }
    return [0,0,0];
  }
  if(scope==='sample'&&platform==='A'){
    const service=stroke(progress,.19,.72);
    // Slide the SSR and terminal block out through the open rear of the case.
    if(id==='A13'||id==='A25')return [0,0,-112*service];
  }
  return explosionOffset(platform,id,assemblyTime(scope,progress),filmHeight);
}
