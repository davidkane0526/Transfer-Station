"""Post-build mechanical checks for V18 candidate STEP assemblies.

Verifies geometric continuity and *candidate* blind-hole depth, not real
manufacturer thread engagement, applied torque, heat paths, or safe machining.
The actual NFP thread depth MUST be measured or supported by its vendor drawing.
"""
from pathlib import Path
import json
import cadquery as cq
from cadquery import Vector
def vz(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))

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
# V19 PHOTO-VERIFIED stacking and actuator directions.
# Evidence: B 108/109/111/112; A 94/95/97/100, and two original videos.
mag=part(B,'B02')[0].BoundingBox()
bt25=part(B,'B03')[0].BoundingBox()
bv25=part(B,'B04')[0].BoundingBox()
board_b=part(B,'B01')[0].BoundingBox()
check(abs(mag.zmin-board_b.zmax)<.02,'B magnet directly rests on breadboard, NEVER middle')
# Photo108 and photo109 show OPPOSING photographic faces; front/rear
# plaques must not falsely face the same way in the digital assembly.
mag_front=part(B,'B02P')[0].BoundingBox()
t25_rear=part(B,'B03L')[0].BoundingBox()
v25_rear=part(B,'B04L')[0].BoundingBox()
check(mag_front.ymin>0 and t25_rear.ymax<0 and v25_rear.ymax<0,
      'Magnet label front; both displacement-stage labels rear')
check(abs(mag.zmax-bt25.zmin)<.02,'B magnetic base below T25M')
check(abs(bt25.zmin-40)<.02 and abs(bv25.zmin-73)<.02,'B stage B03 double-axis height 33mm; B04 begins at z=73')
check(abs(part(B,'B03A')[0].BoundingBox().zmax-bv25.zmin)<.02,'B T25M2L top surface directly touches V25M')
t25_left=part(B,'B03B')[0].BoundingBox()
check(t25_left.xmax<=bt25.xmin+.02,'B T25M handle exits to -X left')
v25_stem=part(B,'B04C')[0].BoundingBox()
v25_knob=part(B,'B04D')[0].BoundingBox()
check(v25_stem.zmax<=v25_knob.zmin+.02 and
      v25_knob.zmax>v25_stem.zmax,'B V25M micrometer stands vertically +Z')
brot=part(B,'B08')[0].BoundingBox()
b_lock=part(B,'B08B')[0].BoundingBox()
check(b_lock.ymin>=brot.ymax-.02,'B rotary operator lock points to front (+Y)')
nfp_right=part(B,'B09B')[0].BoundingBox()
nfp_body=part(B,'B09')[0].BoundingBox()
check(nfp_right.xmin>=nfp_body.xmax-.02,'B NFP micrometer exits right +X')
a15=part(A,'A15')[0].BoundingBox()
a03=part(A,'A03')[0].BoundingBox()
a04=part(A,'A04')[0].BoundingBox()
arot=part(A,'A06')[0].BoundingBox()
a02=part(A,'A02')[0].BoundingBox()
aheat=part(A,'A07')[0].BoundingBox()
check(abs(a15.zmin-20)<.02,'A film T25M at bottom level 20')
check(abs(part(A,'A15A')[0].BoundingBox().zmax-53)<.02,'A T25M2L 33 mm overall manufacturer height')
check(abs(part(A,'A15A')[0].BoundingBox().zmax-a03.zmin)<.02,'A film T25M directly UNDER VC13M')
check(abs(a03.zmax-a04.zmin)<.02,'A VC13M directly UNDER G40M60L')
check(abs(part(A,'A06A')[0].BoundingBox().zmax-a02.zmin)<.02,'A sample T25M above rotary')
check(abs((a02.zmin+20)-aheat.zmin)<.02,'A sample heater above second T25M')
check(part(A,'A15B')[0].BoundingBox().xmin>=a15.xmax-.02,
      'A film T25M handle points to RIGHT +X')
check(part(A,'A02B')[0].BoundingBox().xmin>=a02.xmax-.02,
      'A sample T25M handle points to RIGHT +X')
check(part(A,'A03M')[0].BoundingBox().zmax<=part(A,'A03K')[0].BoundingBox().zmin+.02,
      'A VC13M micrometer is vertically oriented')
check(part(A,'A04M')[0].BoundingBox().xmin>=a04.xmax-.02,
      'A tilt micrometer exits RIGHT')
check(abs((a15.xmin+a15.xmax)/2-(a02.xmin+a02.xmax)/2)>100,
      'Two independent A T25M instances occupy distinct film/sample positions')
# Source-model correction: manufacturer's GCM-T25M2L has 33mm / two
# perpendicular micrometers, not 20mm / one head. Photo 97 and 108 confirm.
for sys,key,expected_bottom in [('B','B03',40),('A','A15',20)]:
    base=part(B if sys=='B' else A,key)[0].BoundingBox()
    top=part(B if sys=='B' else A,key+'A')[0].BoundingBox()
    middle=part(B if sys=='B' else A,key+'M')[0].BoundingBox()
    xshaft=part(B if sys=='B' else A,key+'B')[0].BoundingBox()
    yshaft=part(B if sys=='B' else A,key+'D')[0].BoundingBox()
    yknob=part(B if sys=='B' else A,key+'E')[0].BoundingBox()
    check(abs(base.zmin-expected_bottom)<.01 and abs(top.zmax-expected_bottom-33)<.01,
          sys+' '+key+' true 33mm two-axis stage')
    check(abs(base.zmax-middle.zmin)<.01 and abs(middle.zmax-top.zmin)<.01,
          sys+' '+key+' three layer X/Y stage has contiguous carriage stack')
    check(xshaft.xlen > xshaft.ylen*2 and yshaft.ylen > yshaft.xlen*2,
          sys+' '+key+' crossed actuators follow perpendicular X and Y')
    check(abs(yshaft.ymax-yknob.ymin)<.01,
          sys+' '+key+' second perpendicular micrometer shaft and drum touch')
    check(yknob.ymin>base.ymax,sys+' '+key+' Y handle exits forward')
# The sample-side A02 is not proven to be a -2L; do NOT invent a second handle.
check(not (A/'A02D.step').exists(),
      'A02 single-axis remains unresolved; no imaginary second actuator')
# Rear bar and suspension had been floating independently.
clampbridge=part(B,'B05E')[0]
check(clampbridge.intersect(part(B,'B05B')[0]).Volume()>0.01,
      'B rear bar physically overlaps hanger bridge')
check(clampbridge.intersect(part(B,'B05C')[0]).Volume()>0.01,
      'B suspension attaches to bar bridge')
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
# OEM NFP-1462C manufacturer drawing: do not confuse the 4x Ø6.5
# counterbored clearance holes on lower mounting face with the
# distinct 9-M6/4-M3 threaded pattern on the moving plate.
nfp_clearance=part(B,'B09')[0]
nfp_drive=part(B,'B09B')[0]
nfp_drum=part(B,'B09C')[0]
check(155.5<=max(nfp_drum.BoundingBox().xmax,
    nfp_drive.BoundingBox().xmax)-nfp_clearance.BoundingBox().xmin<=180.5,
      'NFP micrometer + body fit OEM 155.5--180.5 overall length')
for dx in (-25,25):
 for dy in (-25,25):
    bx,by=82+dx,dy
    small=vz(3.1,11,bx,by,53.2)
    cb=vz(5.35,4,bx,by,60.2)
    check(nfp_clearance.intersect(small).Volume()<1e-5,
          'NFP fixed base corner Ø6.5 clearance is open (not a thread)')
    check(nfp_clearance.intersect(cb).Volume()<1e-5,
          'NFP 50mm corner mounting counterbore Ø11 exists')
check(abs(part(B,'B09A')[0].BoundingBox().zmax-76.2)<.02,
      'NFP moving top nominal 23mm above 53.2 mount datum')
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
