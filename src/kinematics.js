// Right-handed Three.js coordinate system (Y is up).
// A positive Y-axis rotation maps local +X into world (cos(theta), 0, -sin(theta)).
export function stageLocalTranslation(distanceMm, angleRad){
  if(!Number.isFinite(distanceMm)||!Number.isFinite(angleRad)){
    throw new TypeError('Stage travel and angle must be finite');
  }
  return {x:distanceMm*Math.cos(angleRad),z:-distanceMm*Math.sin(angleRad)};
}

// A second crossed stage uses local +Z as its travel axis. Under a
// positive Y rotation, local +Z maps to world (+sin(theta), 0, cos(theta)).
export function stageLocalDepthTranslation(distanceMm, angleRad){
  if(!Number.isFinite(distanceMm)||!Number.isFinite(angleRad)){
    throw new TypeError('Stage depth travel and angle must be finite');
  }
  return {x:distanceMm*Math.sin(angleRad),z:distanceMm*Math.cos(angleRad)};
}
