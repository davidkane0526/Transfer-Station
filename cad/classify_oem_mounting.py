"""Conservative BREP topology evidence for mounting-feature candidates.

This analyzes native circular edges and co-axial cylindrical walls. It never
asserts a thread or a usable joint. An OEM STEP containing only unclosed
surface shells has no trustworthy solid/outside orientation: return unresolved.

Call enrich_circles(shape, circles, preset) after extract_circles(). Results
remain private CAD-derived data and must not enter public GitHub artifacts.
"""
import math
from collections import Counter
from OCP.BRepAdaptor import BRepAdaptor_Surface


def _xyz(v):
    return [float(v.X()), float(v.Y()), float(v.Z())]


def _web(v,preset):
    if preset=='nfp1462c':
        return [v[2],v[0],v[1]]
    if preset=='none':
        return list(v)
    raise ValueError('Invalid CAD axis preset')


def _near(a,b,tol=.09):
    return abs(a-b)<=tol


def _xy_match(x,z,cx,cz,tol=.09):
    return math.hypot(x-cx,z-cz)<=tol


def cylinder_walls(shape,preset='none'):
    """Topological wall evidence, NOT proof of hole/threads.

    Inward/outward CAD face normals are interpreted only for a closed-solid
    input, never for the 44-shell manufacturer NFP source.
    """
    solids=shape.Solids()
    closed_solids=len(solids)>0 and all(s.isValid() for s in solids)
    walls=[]
    for face in shape.Faces():
        if face.geomType()!='CYLINDER':
            continue
        try:
            adapter=BRepAdaptor_Surface(face.wrapped)
            cylinder=adapter.Cylinder()
            axis=_web(_xyz(cylinder.Axis().Direction()),preset)
            if abs(axis[1])<.98:
                continue
            p=_web(_xyz(cylinder.Location()),preset)
            radius=float(cylinder.Radius())
            if radius<=0 or not math.isfinite(radius):
                continue
            bbox=face.BoundingBox()
            low=_web([bbox.xmin,bbox.ymin,bbox.zmin],preset)
            high=_web([bbox.xmax,bbox.ymax,bbox.zmax],preset)
            # Use an on-surface UV sample, not the centroid (which can
            # coincide with the axis of a full cylindrical face).
            point=face.positionAt(.32,.40)
            face_normal=face.normalAt(.32,.40)
            if isinstance(face_normal,tuple):
                face_normal=face_normal[0]
            radial=_xyz(point)
            origin=_xyz(cylinder.Location())
            n=_xyz(face_normal)
            radial_dot=sum((radial[k]-origin[k])*n[k] for k in range(3))
            if not math.isfinite(radial_dot):
                continue
            orientation='unresolved_shell'
            if closed_solids and abs(radial_dot)>radius*.2:
                orientation='inward' if radial_dot<0 else 'outward'
            walls.append({'x':p[0],'z':p[2],
                          'radius_mm':radius,
                          'y_min_mm':low[1],'y_max_mm':high[1],
                          'surface_orientation':orientation})
        except (ValueError,RuntimeError,TypeError,AttributeError):
            continue
    return walls


def enrich_circles(shape,circles,preset='none',tol_mm=.09):
    """Attach co-axial wall and stepped-radius evidence to circular edges."""
    if not 0<tol_mm<=.2:
        raise ValueError('Expected conservative positive grouping tolerance')
    walls=cylinder_walls(shape,preset)
    for ring in circles:
        x,y,z=ring['center_mm']
        radius=ring['radius_mm']
        co_rings=[f for f in circles if f.get('horizontal_plane_candidate') and
                  _xy_match(x,z,f['center_mm'][0],f['center_mm'][2],tol_mm)]
        radii=sorted(set(round(2*f['radius_mm'],3) for f in co_rings))
        levels=sorted(set(round(f['center_mm'][1],3) for f in co_rings
                          if _near(f['radius_mm'],radius,tol_mm)))
        matched=[w for w in walls if _xy_match(x,z,w['x'],w['z'],tol_mm) and
                 _near(radius,w['radius_mm'],tol_mm) and
                 w['y_min_mm']-tol_mm<=y<=w['y_max_mm']+tol_mm]
        evidence={m['surface_orientation'] for m in matched}
        if 'inward' in evidence and 'outward' not in evidence:
            kind='closed_solid_bore_wall_candidate'
        elif 'outward' in evidence and 'inward' not in evidence:
            kind='closed_solid_external_wall_candidate'
        elif matched:
            kind='surface_shell_unresolved'
        else:
            kind='circle_only_unresolved'
        ring['wall_evidence_count']=len(matched)
        ring['axial_circle_levels']=len(levels)
        ring['coaxial_diameters_mm']=radii
        ring['stepped_coaxial_candidate']=len(radii)>=2 and bool(matched)
        ring['geometric_wall_kind']=kind
        ring['mounting_hole_verified']=False
        ring['thread_verified']=False
    counts=Counter(f['geometric_wall_kind'] for f in circles)
    return {
        'native_cylindrical_walls_vertical':len(walls),
        'circle_wall_geometric_classes':dict(sorted(counts.items())),
        'stepped_coaxial_circle_candidates':sum(
            f['stepped_coaxial_candidate'] for f in circles),
        'physical_interface_accepted':False,
        'warning':'Inward solid walls are not proof of a mounting hole. OEM shell normal direction is untrusted; threads and access unverified.'
    }
