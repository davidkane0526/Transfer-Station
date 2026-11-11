import assert from 'node:assert/strict';
import {aVacuumRoute} from '../src/a-thermal-datums.js';
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

const gap=(p,c,h)=>Math.hypot(...p.map((v,i)=>Math.max(Math.abs(v-c[i])-h[i],0)));
let stage=Infinity,post=Infinity,driver=Infinity,stand=Infinity;
for(const x of [-12.5,-8,0,8,12.5])for(let angle=-5;angle<=5;angle++){
 const pts=aVacuumRoute({sampleShiftMm:x,sampleAngleDeg:angle}).path;
 const a=angle*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);let length=0;
 for(let i=0;i<pts.length-1;i++){
  const n=Math.ceil(D(pts[i],pts[i+1])*3);let last=pts[i];
  for(let j=1;j<=n;j++){
   const p=cubicBetween(pts,i,j/n);length+=D(p,last);last=p;
   const dx=p[0]-78,dz=p[2];
   const local=[cs*dx-sn*dz-x,p[1]-95.2,sn*dx+cs*dz];
   if(length>5)stage=Math.min(stage,gap(local,[0,0,0],[32.5,14,32.5])-3.5);
   post=Math.min(post,gap(p,[78,219,-112],[13,186,13])-3.5);
   driver=Math.min(driver,gap(p,[262,52,-80],[30,52,36.5])-3.5);
   stand=Math.min(stand,gap(p,[187.5,123.5,-87.5],[6,95.5,6])-3.5);
  }
 }
}
assert(stage>0&&post>0&&driver>0&&stand>0,'A29 candidate hose collision');
assert.equal(aVacuumRoute({sampleAngleDeg:90}).withinCandidateAngularTravel,false);
console.log('V135 55 sample travel/yaw poses: vacuum hose clear',{stage,post,driver,stand});
