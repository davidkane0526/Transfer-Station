"""Extract *candidate* circular CAD features from local private STEP/IGES.

This does not distinguish holes from pins or prove threads/assembly fit.
The detailed JSON is derived geometry: do not distribute third-party OEM data.
Usage:
  python cad/extract_oem_features.py NFP-1462C.step --preset nfp1462c --output private/nfp-feature-candidates.json
"""
import argparse
import json
import math
from collections import Counter
from pathlib import Path

import cadquery as cq
from OCP.BRepAdaptor import BRepAdaptor_Curve, BRepAdaptor_Surface


def rotate_into_web(v, preset):
    if preset == 'nfp1462c':
        return [v[2], v[0], v[1]]  # OEM (X,Y,Z) -> web (Z,X,Y), proper rotation
    if preset == 'none':
        return list(v)
    raise ValueError('Unknown preset: '+str(preset))


def extract_circles(shape, preset='none', quantum_mm=0.02):
    """Coincident circular BREP edges grouped solely for visual deduplication."""
    if not 0 < quantum_mm <= 0.1:
        raise ValueError('Grouping quantum must be in (0, 0.1] mm')
    groups={}
    for edge in shape.Edges():
        if edge.geomType() != 'CIRCLE':
            continue
        try:
            circle=BRepAdaptor_Curve(edge.wrapped).Circle()
            p=circle.Location()
            n=circle.Axis().Direction()
            radius=float(circle.Radius())
            length=float(edge.Length())
            if not all(map(math.isfinite,(radius,length))) or radius <= 0.01:
                continue
            center=rotate_into_web([p.X(),p.Y(),p.Z()],preset)
            normal=rotate_into_web([n.X(),n.Y(),n.Z()],preset)
            if next((v for v in normal if abs(v)>1e-8),1.)<0:
                normal=[-v for v in normal]
            key=(tuple(round(v/quantum_mm) for v in center),
                 round(radius/quantum_mm),tuple(round(v,3) for v in normal))
            degrees=min(360.,max(0.,360.*length/(2*math.pi*radius)))
            rec=groups.setdefault(key,{
                'center_mm':[round(v,4) for v in center],
                'normal':[round(v,4) for v in normal],
                'radius_mm':round(radius,4),
                'arc_degrees':0.,'edges':0})
            rec['arc_degrees']+=degrees
            rec['edges']+=1
        except Exception:
            # Unprocessable individual edges cannot certify any physical hole.
            continue
    results=list(groups.values())
    hints=[(6.5,'nominal Ø6.5 geometry'),(11.,'nominal Ø11 geometry'),
           (6.,'nominal Ø6 geometry'),(3.,'nominal Ø3 geometry')]
    for f in results:
        f['arc_degrees']=round(f['arc_degrees'],2)
        f['full_circle_candidate']=f['arc_degrees']>=359.
        f['horizontal_plane_candidate']=abs(f['normal'][1])>=.98
        d=2*f['radius_mm']
        f['diameter_hint']=next((label for target,label in hints if abs(d-target)<.08),'other')
        f['mounting_hole_verified']=False
        f['thread_verified']=False
    return sorted(results,key=lambda f:(
        -int(f['horizontal_plane_candidate']),f['radius_mm'],f['center_mm']))


def count_cylinders(shape,preset='none'):
    count=vertical=0
    for face in shape.Faces():
        if face.geomType()!='CYLINDER':
            continue
        count+=1
        try:
            n=BRepAdaptor_Surface(face.wrapped).Cylinder().Axis().Direction()
            web=rotate_into_web([n.X(),n.Y(),n.Z()],preset)
            if abs(web[1])>=.98:
                vertical+=1
        except Exception:
            pass
    return {'cylindrical_faces':count,
            'vertical_axis_cylindrical_faces':vertical}


def candidate_square_pitches(circles, pitches_mm=(25.,32.,50.), tolerance_mm=0.2):
    """Count co-planar, equal-radius axis-aligned square circle layouts.

    These are potential geometric signatures only, not mounting-hole or
    thread verification. No private feature coordinates leave the local run.
    """
    vertical=[f for f in circles if
              f['horizontal_plane_candidate'] and f['full_circle_candidate']]
    groups={}
    for f in vertical:
        x,y,z=f['center_mm']
        key=(round(y/tolerance_mm),round(f['radius_mm']/tolerance_mm))
        groups.setdefault(key,set()).add((round(x/tolerance_mm),round(z/tolerance_mm)))
    result={}
    for pitch in pitches_mm:
        p=round(pitch/tolerance_mm)
        count=0
        for coords in groups.values():
            for x,z in coords:
                if (x+p,z) in coords and (x,z+p) in coords and (x+p,z+p) in coords:
                    count+=1
        result[str(int(pitch))+'mm']=count
    return result


def describe(shape,preset='none'):
    circles=extract_circles(shape,preset)
    vertical=[f for f in circles if f['horizontal_plane_candidate']]
    summary={
        'candidate_circular_features':len(circles),
        'horizontal_plane_circular_candidates':len(vertical),
        'full_circle_candidates':sum(f['full_circle_candidate'] for f in vertical),
        'nominal_diameter_hints':dict(sorted(Counter(
            f['diameter_hint'] for f in vertical).items())),
        'square_pitch_layout_candidates':candidate_square_pitches(circles),
        'physical_interface_accepted':False,
        'warning':'Circular geometry does not prove a mounting hole, thread or engagement length',
        **count_cylinders(shape,preset)}
    return {
        'source':{'preset':preset,'units':'mm',
                  'coordinates':('web X=OEM Z, Y=OEM X, Z=OEM Y'
                                 if preset=='nfp1462c' else 'original'),
                  'feature_origin':'BREP circular edges, not overall AABB'},
        'summary':summary,'candidate_features':circles}


def read_step(path):
    if path.suffix.lower() in ('.step','.stp'):
        obj=cq.importers.importStep(str(path))
    elif path.suffix.lower() in ('.iges','.igs'):
        obj=cq.importers.importIges(str(path))
    else:
        raise ValueError('Only STEP/STP/IGES/IGS BREP supported')
    if not obj.objects:
        raise ValueError('No CAD geometry found')
    return cq.Compound.makeCompound(obj.objects)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path)
    p.add_argument('--preset',choices=['none','nfp1462c'],default='none')
    p.add_argument('--output',required=True,type=Path,help='Private JSON - do not publish')
    a=p.parse_args()
    if not a.source.is_file():
        p.error('Source file not found')
    result=describe(read_step(a.source),a.preset)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
    print(json.dumps(result['summary'],indent=2,ensure_ascii=False))
    print('PRIVATE feature JSON saved; it is not proof of a bolt-hole interface.')


if __name__=='__main__':
    main()
