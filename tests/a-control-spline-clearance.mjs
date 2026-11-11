import assert from 'node:assert/strict';
import {aControlRoutes} from '../src/a-control-interfaces.js';
// Centripetal Catmull-Rom interpolation like Three.js r164, with endpoint
// extrapolation; engineering AABB tests, not final electrical certification.
const D=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function cubicBetween(points,i,t){
 const p1=points[i],p2=points[i+1];
 const p0=i===0?p1.map((v,k)=>2*v-p2[k]):points[i-1];
 const p3=i+2===points.length?p2.map((v,k)=>2*v-p1[k]):points[i+2];
 let dt0=Math.sqrt(D(p0,p1)),dt1=Math.sqrt(D(p1,p2)),dt2=Math.sqrt(D(p2,p3));
 if(dt1<1e-4)dt1=1;
 if(dt0<1e-4)dt0=dt1;
 if(dt2<1e-4)dt2=dt1;
 return p1.map((v,k)=>{
   const a=dt1*((v-p0[k])/dt0-(p2[k]-p0[k])/(dt0+dt1)+(p2[k]-v)/dt1);
   const b=dt1*((p2[k]-v)/dt1-(p3[k]-v)/(dt1+dt2)+(p3[k]-p2[k])/dt2);
   return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*a
     +(-2*t*t*t+3*t*t)*p2[k]+(t*t*t-t*t)*b;
 });
}
function distanceBox(p,half){
 return Math.hypot(...p.map((v,i)=>Math.max(Math.abs(v)-half[i],0)));
}
let minStage=Infinity,minDriver=Infinity;
for(const shift of [-12.5,-8,0,8,12.5])for(let angle=-180;angle<=180;angle+=5){
 const paths=aControlRoutes({sampleShiftMm:shift,sampleAngleDeg:angle}).paths;
 const rad=angle*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad);
 for(const [role,radius] of [['heaterA',1.2],['heaterB',1.2],['temperature',.78]]){
   const pts=paths[role];let travelled=0;
   for(let i=0;i<pts.length-1;i++){
     const count=Math.ceil(D(pts[i],pts[i+1])*4);let prev=pts[i];
     for(let k=1;k<=count;k++){
       const t=k/count,p=cubicBetween(pts,i,t);
       travelled+=D(prev,p);prev=p;
       const dx=p[0]-78,dz=p[2];
       const local=[cs*dx-sn*dz-shift,p[1]-95.2,sn*dx+cs*dz];
       const stageGap=distanceBox(local,[32.5,14,32.5])-radius;
       if(travelled>3)minStage=Math.min(minStage,stageGap);
       const driverGap=distanceBox([p[0]-262,p[1]-52,p[2]+80],
         [30,52,36.5])-radius;
       minDriver=Math.min(minDriver,driverGap);
     }
   }
 }
}
assert(minStage>0,'Moving heater or sensor tube penetrates A07 outside inlet');
assert(minDriver>0,'Heater or sensor tube penetrates A12 controller shell');
console.log('V134 365-pose spline clearances (mm):',
  {heaterMin:Number(minStage.toFixed(3)),driverMin:Number(minDriver.toFixed(3))});
