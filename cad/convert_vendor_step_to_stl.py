"""Convert OEM STEP/IGES shells OR solids to a private STL viewer asset.

The official Zolix NFP-1462C.step file contains a Compound with 44 shells and
815 faces, but ZERO closed solids. This is still valuable as appearance CAD.
STL generated from shells may not be watertight; do not use it as a machining
solid or claim it validates hole-thread engagement.

Usage:
  python cad/convert_vendor_step_to_stl.py ./NFP-1462C.step ./vendor-local/NFP-1462C.stl --preset nfp1462c
  python cad/convert_vendor_step_to_stl.py my-supplier.stp ./vendor-local/other.stl
"""
from pathlib import Path
import argparse
import cadquery as cq

p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
p.add_argument('destination',type=Path)
p.add_argument('--preset',choices=['none','nfp1462c'],default='none')
p.add_argument('--tolerance',type=float,default=.06)
p.add_argument('--angularTolerance',type=float,default=.15)
args=p.parse_args()
if not args.source.is_file():p.error(f'File not found: {args.source}')
ext=args.source.suffix.lower()
if ext in ('.step','.stp'): model=cq.importers.importStep(str(args.source))
elif ext in ('.igs','.iges'): model=cq.importers.importIges(str(args.source))
else:p.error('Only STEP/STP/IGES/IGS supported')
shapes=model.objects
if not shapes or any(not sh.isValid() for sh in shapes):
    raise SystemExit('Source does not contain valid BREP shapes')
compound=cq.Compound.makeCompound(shapes)
faces=compound.Faces();solids=compound.Solids();shells=compound.Shells()
if not faces:raise SystemExit('Source has no tessellatable faces')
if args.preset=='nfp1462c':
    bb=compound.BoundingBox()
    dims=sorted((bb.xlen,bb.ylen,bb.zlen))
    # Native OEM STEP: 27.6 x 77.5 x 167.5 mm (height, width, micrometer).
    if abs(dims[0]-27.6)>3 or abs(dims[-1]-167.5)>10:
        raise SystemExit(f'Unexpected NFP-1462C source dimensions {dims}; check part/version')
    # Axis-cycle 120-degree rotation about (1,1,1):
    # OEM X vertical -> Web Y; OEM Y width -> Web Z;
    # OEM Z micrometer -> Web X. This is a ROTATION, not a mirror.
    shapes=[sh.rotate((0,0,0),(1,1,1),120) for sh in shapes]
    model=cq.Workplane('XY').newObject(shapes)
args.destination.parent.mkdir(parents=True,exist_ok=True)
cq.exporters.export(model,str(args.destination),exportType='STL',
                    tolerance=args.tolerance,angularTolerance=args.angularTolerance)
if args.destination.stat().st_size<1000:raise SystemExit('STL export suspiciously small')
print(f'OEM STEP imported: {len(solids)} closed solids, {len(shells)} shells, {len(faces)} faces')
print(f'Private STL saved to {args.destination} ({args.destination.stat().st_size} bytes).')
print('Important: surfaces are NOT closed solids and the body origin is NOT registered.')
print('In browser select NFP (B09) and use the OEM NFP import profile + manual datum offset.')
print('Do not commit or redistribute the native / tessellated OEM CAD without authorization.')
