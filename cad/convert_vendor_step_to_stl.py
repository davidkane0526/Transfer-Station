"""Convert a manufacturer's STEP/IGES CAD to local STL for Transfer Station viewer.
Never publish third-party proprietary CAD to a public repository without permission.
Usage:
  python cad/convert_vendor_step_to_stl.py input.step output.stl
  python cad/convert_vendor_step_to_stl.py input.iges output.stl --tolerance 0.08
All exported mesh coordinates retain source CAD units (normally millimetres).
"""
from pathlib import Path
import argparse
import cadquery as cq

p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
p.add_argument('destination',type=Path)
p.add_argument('--tolerance',type=float,default=.08,
               help='STL linear triangulation tolerance, in CAD model units')
p.add_argument('--angularTolerance',type=float,default=.15,
               help='STL angular tolerance in radians')
args=p.parse_args()
if not args.source.is_file():
    p.error(f'source does not exist: {args.source}')
ext=args.source.suffix.lower()
if ext in {'.step','.stp'}:
    model=cq.importers.importStep(str(args.source))
elif ext in {'.iges','.igs'}:
    model=cq.importers.importIges(str(args.source))
else:
    p.error('Supported input: STEP / STP / IGES / IGS')
solids=model.solids().vals()
if not solids or any(not s.isValid() for s in solids):
    raise SystemExit('No valid solids in source. Inspect input in FreeCAD first.')
args.destination.parent.mkdir(parents=True,exist_ok=True)
cq.exporters.export(model,str(args.destination),exportType='STL',
                    tolerance=args.tolerance,angularTolerance=args.angularTolerance)
print(f'Exported {len(solids)} solids to {args.destination}')
print('Notes: original assembly boundaries may be flattened in STL.')
print('In the viewer select the placeholder part and import this STL as mm.')
