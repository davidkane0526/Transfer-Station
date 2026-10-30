// Right-handed Three.js coordinate system (Y is up).
// A positive Y-axis rotation maps local +X into world (cos(theta), 0, -sin(theta)).
export function stageLocalTranslation(distanceMm, angleRad){
  if(!Number.isFinite(distanceMm)||!Number.isFinite(angleRad)){
    throw new TypeError('Stage travel and angle must be finite');
  }
  return {x:distanceMm*Math.cos(angleRad),z:-distanceMm*Math.sin(angleRad)};
}
