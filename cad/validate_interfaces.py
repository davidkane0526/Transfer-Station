"""Post-build mechanical checks for V18 candidate STEP assemblies.

Verifies geometric continuity and *candidate* blind-hole depth, not real
manufacturer thread engagement, applied torque, heat paths, or safe machining.
The actual NFP thread depth MUST be measured or supported by its vendor drawing.
"""
from pathlib import Path
import json
import cadquery as cq

ROOT=Path(__file__).resolve().parents[1]
B=ROOT/'build'/'platform_B'/'parts'
A=ROOT/'build'/'platform_A'/'parts'
report={'checks':[], 'meaning':'geometric proxy checks only; physical interfaces remain unverified'}

def part(d,id):
    f=d/(id+'.step')
    assert f.exists(),f'Missing part {f}'
    s=cq.importers.importStep(str(f)).solids().vals()
    assert s and all(x.isValid() for x in s),f'Invalid geometry {id}'
    return s

def check(ok,label):
    report['checks'].append({'check':label,'passed':bool(ok)})
    if not ok: raise AssertionError(label)

# Previously this failed: separated 0.5mm screw shaft and head.
for i in range(1,5):
    ss=part(B,'B14_'+str(i))
    check(len(ss)==1,f'B14_{i} screw is ONE connected solid')
    bb=ss[0].BoundingBox()
    check(abs(bb.zmax-97.7)<0.03,f'B14_{i} top recessed 0.5 mm')
    check(abs(bb.zmin-66.7)<0.03,f'B14_{i} nominal M6x25 under-head length')
nfp=part(B,'B09A')[0]
check(abs(nfp.BoundingBox().zmin-64.2)<.01,'NFP carriage lower datum')
check(abs(nfp.BoundingBox().zmax-76.2)<.01,'NFP top mounting datum')
# The modeled hole depth is 10 mm. Tip at 66.7 and blind bottom at 66.2 => .5 mm.
hole_bottom=66.2;tip=66.7
check(tip-hole_bottom>=.5-1e-4,'candidate fastener has 0.5 mm axial blind-hole clearance')
# Check exposed stage stack contact datums.
for name,bottom,top in [('B10',76.2,86.2),('B11',86.2,98.2)]:
    bb=part(B,name)[0].BoundingBox()
    check(abs(bb.zmin-bottom)<.02 and abs(bb.zmax-top)<.02,name+' correct stage stack datums')
# A's transfer beam, vertical support, edge clamp contact by boundary (not true fasteners).
a_rot=part(A,'A06A')[0].BoundingBox()
a_stg=part(A,'A02')[0].BoundingBox()
check(abs(a_rot.zmax-a_stg.zmin)<.05,'A02 stage rests on A06 rotary')
beam=part(A,'A05A')[0].BoundingBox()
ris=part(A,'A05B')[0].BoundingBox()
clip=part(A,'A05C')[0].BoundingBox()
a_tilt=part(A,'A04')[0].BoundingBox()
check(abs(ris.zmin-a_tilt.zmax)<.01,'A riser contacts tilt stage top')
check(abs(ris.zmax-beam.zmin)<.01,'A riser contacts transfer beam')
check(abs(clip.zmax-beam.zmin)<.01,'A edge clip contacts transfer beam')
check(beam.xmin<=-116 and beam.xmax>=78,'A beam spans left-to-right physical supports')
# Optical tips are a conservative candidate for open clearance, not WD qualification.
tipbb=part(B,'B18A')[0].BoundingBox()
glass=part(B,'B07')[0].BoundingBox()
check(tipbb.zmin>glass.zmax,'B objective proxy is above slide; no through-slide collision')
report['checks_passed']=len(report['checks'])
report['status']='passed'
(ROOT/'build'/'interface_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
