// V140 pure peripheral camera framing in millimetres.
export const A_EXTERNAL_FOCUS_IDS=Object.freeze(['A07','A12','A29','A30','A33']);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const d=Math.hypot(...a);if(d<1e-6)throw new RangeError('Zero camera direction');return a.map(x=>x/d)};
export function calculateAExternalCamera(points,{fovDeg=39,aspect=1.35,direction=[1,.58,1.25],padding=.82}={}){
 if(!Array.isArray(points)||!points.length||!points.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)))throw new TypeError('Finite bbox corners required');
 if(!(fovDeg>10&&fovDeg<120&&aspect>.2&&aspect<10&&padding>.35&&padding<1))throw new RangeError('Invalid camera settings');
 const lo=[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...points.map(p=>p[k])));
 const target=lo.map((x,k)=>(x+hi[k])/2),back=norm(direction),right=norm(cross([0,1,0],back)),up=norm(cross(back,right));
 const tanV=Math.tan(fovDeg*Math.PI/360),tanH=tanV*aspect;
 const coords=points.map(p=>{const v=p.map((n,k)=>n-target[k]);return {x:dot(v,right),y:dot(v,up),z:dot(v,back)}});
 const distance=1.08*Math.max(120,...coords.map(p=>Math.max(p.z+Math.abs(p.x)/(padding*tanH),p.z+Math.abs(p.y)/(padding*tanV))));
 const position=target.map((n,k)=>n+back[k]*distance);
 const ndc=coords.map(p=>[p.x/((distance-p.z)*tanH),p.y/((distance-p.z)*tanV)]);
 const bound={x:Math.max(...ndc.map(p=>Math.abs(p[0]))),y:Math.max(...ndc.map(p=>Math.abs(p[1])))};
 return {target,position,distance,bound,allWithinFrame:bound.x<=.95&&bound.y<=.95};
}