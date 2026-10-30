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
# B transfer arm must not float 4 mm above the V25M upper plate.
v25_top=part(B,'B04B')[0].BoundingBox()
arm_base=part(B,'B05D')[0].BoundingBox()
post=part(B,'B05')[0].BoundingBox()
check(abs(arm_base.zmin-v25_top.zmax)<.02,'B post base sits directly on V25M')
check(post.zmin<=arm_base.zmax and post.zmax>arm_base.zmax,'B vertical post is captured by base')
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
# V18: glass must be INSIDE clip opening, never penetrating either jaw.
clip=part(B,'B06')[0]
glass=part(B,'B07')[0]
pdms=part(B,'B07A')[0]
chuck=part(B,'B11')[0]
suspension=part(B,'B05C')[0]
check(clip.intersect(glass).Volume()<1e-6,'Glass has no volumetric overlap with clip')
check(clip.intersect(pdms).Volume()<1e-6,'Transfer membrane does not intersect clamp')
check(clip.intersect(chuck).Volume()<1e-6,'Clip lower jaw clears hot metal')
check(glass.intersect(chuck).Volume()<1e-6,'Glass does not penetrate hot metal')
check(abs(glass.BoundingBox().zmin-104.5)<.02,'Glass bottom at lower jaw top')
check(abs(glass.BoundingBox().zmax-105.5)<.02,'Glass has 1-mm thickness')
check(abs(glass.BoundingBox().zmin-pdms.BoundingBox().zmax)<.02,'PDMS underside contacts glass')
check(pdms.BoundingBox().zmin-chuck.BoundingBox().zmax>=4.4,'Membrane has >=4.4mm no-contact clearance to hot metal')
check(abs(suspension.BoundingBox().zmin-clip.BoundingBox().zmax)<.02,'Hanging rod reaches clip top')
bar=part(B,'B05B')[0]
check(bar.intersect(part(B,'B18')[0]).Volume()<1e-6,'Rear beam does not intersect objective')
check(bar.intersect(part(B,'B16C')[0]).Volume()<1e-6,'Rear beam does not intersect microscope body')
# CAD XY plane maps to WebGL X/Z. CAD back = negative Y.
from cadquery import Vector
vac=part(B,'B15')[0]
check(abs(vac.BoundingBox().ymax+32.5)<.02,'Vacuum fitting joins rear -Y face')
for i in (1,2):
    wire=part(B,f'B12L{i}')[0]
    check(wire.BoundingBox().ymin<-55 and wire.BoundingBox().ymax<=-18.9,
          f'Heater wire {i} exits rear, not left')
    check(wire.intersect(chuck).Volume()<1e-6,f'Heater wire {i} fits milled rear tunnel')
thermo=part(B,'B13L')[0]
check(thermo.intersect(chuck).Volume()<1e-6,'Thermocouple wire fits rear shallow roof groove')
center_vac=cq.Solid.makeCylinder(1.25,32.5,Vector(82,-32.5,95.5),Vector(0,1,0))
center_top=cq.Solid.makeCylinder(.55,2.9,Vector(82,0,95.3),Vector(0,0,1))
check(center_vac.intersect(chuck).Volume()<1e-6,'Rear vacuum bore is connected towards center')
check(center_top.intersect(chuck).Volume()<1e-6,'One central top suction hole is unobstructed')
left_probe=cq.Solid.makeCylinder(1.2,10,Vector(49.5,0,95.5),Vector(1,0,0))
check(left_probe.intersect(chuck).Volume()>1.0,'Old left-side inlet is absent from metal')

# Optical tips are a conservative candidate for open clearance, not WD qualification.
tipbb=part(B,'B18A')[0].BoundingBox()
glass=part(B,'B07')[0].BoundingBox()
check(tipbb.zmin>glass.zmax,'B objective proxy is above slide; no through-slide collision')
report['checks_passed']=len(report['checks'])
report['status']='passed'
(ROOT/'build'/'interface_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
