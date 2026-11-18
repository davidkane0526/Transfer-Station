const aOptics=new Set(['A08','A09','A11','A14','A18','A19']);
const aFilm=new Set(['A17','A15','A03','A04L','A04','A05','A05C','A05CS','A05G']);
const bOptics=new Set(['B16','B17','B18']);
const bFilm=new Set(['B02','B03','B04','B05','B06','B07','B24','B25','B26','B27','B28','B29','B30','B31','B32','B33','B34']);

export function stroke(t,from,to){
  return Math.min(1,Math.max(0,(t-from)/(to-from)));
}

export const opticalRelease=t=>stroke(t,0,.27);
export const filmFan=t=>stroke(t,.59,1);

export function explosionOffset(platform,id,t,filmHeight){
  const clear=opticalRelease(t);
  const f=filmFan(t);
  const sensor=stroke(t,.28,.44);
  const cover=stroke(t,.44,.63);
  const deck=stroke(t,.63,1);

  if(platform==='A'){
    if(aOptics.has(id)){
      const lift=170*clear;
      const free=stroke(t,.29,.53);
      // A08 stays with A18: the fitted pipe and cover capture it from both ends.
      if(id==='A11')return [45*free,lift,0];
      if(id==='A19')return [0,lift-28*free,0];
      if(id==='A14')return [0,lift+28*free,0];
      if(id==='A09')return [0,lift+58*free,0];
      return [0,lift,0];
    }
    if(aFilm.has(id)){
      const takeoff=stroke(t,.27,.31);
      const moveLeft=stroke(t,.31,.43);
      const bolts=id==='A05CS'?15*stroke(t,.43,.49):0;
      const slide=id==='A05G'?25*stroke(t,.49,.59):0;
      // The slide leaves along its face only after both clamp screws retract.
      return [-54*moveLeft+slide,8*takeoff+filmHeight*f+bolts,0];
    }
    if(id==='A27')return [0,0,-45*sensor];
    if(id==='A28')return [0,53*cover+52*deck,-24*sensor];
    if(id==='A07')return [0,53*cover+52*deck,0];
    if(id==='A26')return [0,65*deck,0];
    if(id==='A31')return [0,49*deck,0];
    if(id==='A32')return [0,34*deck,0];
    if(id==='A02')return [0,20*deck,0];
    if(id==='A06')return [0,10*deck,0];
    return [0,0,0];
  }

  if(bOptics.has(id)){
    const fine=stroke(t,.29,.53);
    return [0,155*stroke(t,.06,.27)+(id==='B17'?40*fine:0),0];
  }
  if(bFilm.has(id)){
    const safeLift=stroke(t,.27,.40);
    const carry=stroke(t,.40,.57);
    // Keep the rod/collet chain joined until its release axes are measured.
    return [-55*carry,40*safeLift,0];
  }
  if(id==='B14')return [0,35*sensor+100*cover,0];
  if(id==='B13')return [0,0,-55*sensor];
  if(id==='B15')return [0,55*cover+48*deck,-30*sensor];
  if(id==='B11')return [0,55*cover+48*deck,0];
  if(id==='B12')return [0,65*deck,0];
  if(id==='B10')return [0,49*deck,0];
  if(id==='B09')return [0,34*deck,0];
  if(id==='B41')return [0,20*deck,0];
  if(id==='B08')return [0,10*deck,0];
  if(id==='B19')return [0,0,48*stroke(t,.62,.81)];
  if(['B21','B23','B39'].includes(id))return [0,140*stroke(t,.62,.95),0];
  return [0,0,0];
}

export function explosionStep(t,platform){
  if(t===0)return '装配位';
  if(platform==='B'&&t<=.06)return '退出显微镜底脚螺钉';
  if(t<=.27)return '抬开光学组件';
  if(t<=.44)return '退出探头、接头及吸附块螺钉';
  if(t<=.63)return platform==='A'?'推出玻片 · 抬开吸附块':'移开玻片组件 · 抬开吸附块';
  return '逐层分解';
}
