// Pure 2D rigid registration for web X/Z coordinates (Y is vertical).
// Input landmarks are measured CAD points, not invented bolt-hole positions.
// Both source and destination points must be expressed in millimetres.
// The transform is right-handed Three.js rotation about +Y, with NO scaling.
// Passing this fit checks input consistency only; it never certifies mating.
export function parseXZ(value){
  const fields=String(value??'').trim().split(/[,，]/);
  if(fields.length!==2)throw new Error('坐标必须为 X,Z 两个数，用英文或中文逗号隔开');
  if(fields.some(v=>v.trim()===''))throw new Error('X 和 Z 坐标不能为空');
  const [x,z]=fields.map(v=>Number(v.trim()));
  if(![x,z].every(Number.isFinite))throw new Error('X/Z 必须是有限数值');
  if(Math.max(Math.abs(x),Math.abs(z))>10000)throw new Error('坐标超出 10000 mm 范围');
  return {x,z};
}
function xyLength(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function fitRigidXZ(pairs,{maxResidualMm=0.25,minBaselineMm=5}={}){
  if(!Array.isArray(pairs)||pairs.length<2)throw new Error('至少提供两对已知的不同安装特征点');
  if(!Number.isFinite(maxResidualMm)||maxResidualMm<=0||!Number.isFinite(minBaselineMm)||minBaselineMm<=0)throw new Error('配准阈值设置错误');
  const n=pairs.length;
  const src=[],dst=[];
  for(const pair of pairs){
    if(!pair||!pair.source||!pair.target)throw new Error('每对点必须同时指定来源与目标坐标');
    const source=pair.source,target=pair.target;
    if(![source.x,source.z,target.x,target.z].every(Number.isFinite))
      throw new Error('所有特征点坐标必须为有限毫米数值');
    src.push(source);dst.push(target);
  }
  let baseline=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const a=xyLength(src[i],src[j]),b=xyLength(dst[i],dst[j]);
    if(a<minBaselineMm||b<minBaselineMm)throw new Error('配准点太近或重合，无法可靠判定转角');
    baseline=Math.max(baseline,a);
    if(Math.abs(a-b)>2*maxResidualMm)throw new Error('两套对应点的距离不一致；不能用缩放掩盖孔距或配对错误');
  }
  const mean=arr=>({
    x:arr.reduce((a,p)=>a+p.x,0)/n,
    z:arr.reduce((a,p)=>a+p.z,0)/n
  });
  const ps=mean(src),qs=mean(dst);
  let dot=0,rot=0;
  for(let i=0;i<n;i++){
    const px=src[i].x-ps.x,pz=src[i].z-ps.z;
    const qx=dst[i].x-qs.x,qz=dst[i].z-qs.z;
    dot+=px*qx+pz*qz;
    // For Three.js +Y, x' = cos*x + sin*z; z' = -sin*x + cos*z.
    rot+=pz*qx-px*qz;
  }
  if(Math.hypot(dot,rot)<1e-8)throw new Error('对应点退化，无法判定唯一刚性旋转');
  const yawRad=Math.atan2(rot,dot),c=Math.cos(yawRad),s=Math.sin(yawRad);
  const tx=qs.x-(c*ps.x+s*ps.z),tz=qs.z-(-s*ps.x+c*ps.z);
  const residuals=src.map((p,i)=>Math.hypot(
    c*p.x+s*p.z+tx-dst[i].x,
    -s*p.x+c*p.z+tz-dst[i].z
  ));
  const maxErrorMm=Math.max(...residuals),rmsErrorMm=Math.hypot(...residuals)/Math.sqrt(n);
  if(maxErrorMm>maxResidualMm+1e-8)throw new Error(
    '配准点残差 '+maxErrorMm.toFixed(3)+' mm 超出 '+maxResidualMm+' mm；检查孔位、坐标方向及点对应关系'
  );
  return {yawRad,yawDeg:yawRad*180/Math.PI,translationXmm:tx,
    translationZmm:tz,maxErrorMm,rmsErrorMm,baselineMm:baseline,pairCount:n,
    accepted:false,registrationKind:'coordinate_preview_only'};
}
