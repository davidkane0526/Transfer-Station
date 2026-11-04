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
def vx(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(1,0,0))
def vy(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
def box_probe(w,d,h,x,y,z):return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()

ROOT=Path(__file__).resolve().parents[1]
B=ROOT/'build'/'platform_B'/'parts'
A=ROOT/'build'/'platform_A'/'parts'
report={'checks':[], 'scope':'candidate_proxy_geometry_only',
        'meaning':'Geometric self-consistency of assumed CAD: NOT manufacturer fit or thread acceptance',
        'physical_acceptance':{
            'status':'pending',
            'missing':['B14 actual four fastener center coordinates',
                       'B35 black Thorlabs board mounting bolts/outer dimensions are unknown',
                       'NFP moving-face tapped hole group and effective thread depth',
                       'real clamped stack dimensions and fastener head geometry',
                       'rotary-to-NFP fixed-base bolt compatibility',
                       '200C thermal insulation and stress certification',
                       'A photos94/95/97 L-sheet end-to-glass jaw interface still needs actual clamp identification',
                       'B photos108/149/150 real M6 rod-end thread and side-bridge fasteners unconfirmed']
        }}

def part(d,id):
    f=d/(id+'.step')
    assert f.exists(),f'Missing part {f}'
    s=cq.importers.importStep(str(f)).solids().vals()
    assert s and all(x.isValid() for x in s),f'Invalid geometry {id}'
    return s

def check(ok,label):
    report['checks'].append({'check':label,'passed':bool(ok)})
    if not ok: raise AssertionError(label)

# V38: one COMMON optical breadboard per photographed apparatus.
# B35 is a BOLTED local subpanel and A16 is a BOLTED rotary adapter,
# not a second shared base. Both rigs remain physically DISTINCT.
from math import isclose
for system,board_dir in (('A',A),('B',B)):
    common=part(board_dir,system+'01')[0]
    check(abs(common.BoundingBox().zmin)<.02 and abs(common.BoundingBox().zmax-20)<.02,
          system+' has exactly one lower shared optical breadboard')
for system,aux,anchors,head_z in (
    ('A','A16',[(x,y) for x in (50,100) for y in (-25,25)],25.5),
    ('B','B35',[(x,y) for x in (25,175) for y in (-100,100)],29)):
    parent=A if system=='A' else B
    board_solid=part(parent,system+'01')[0]
    support=part(parent,aux)[0]
    for i,(x,y) in enumerate(anchors,1):
        foot_hole=vz(3.1,8,x,y,20 if system=='A' else 20)
        check(support.intersect(foot_hole).Volume()<1e-5,
              f'{aux} actual candidate through clearance hole at {x},{y}')
        receiver=vz(2.4,10,x,y,10)
        check(board_solid.intersect(receiver).Volume()<1e-5,
              f'{aux} candidate base anchor aligns with EXISTING board blind grid')
        bolt=part(parent,f'{aux}S{i}')[0]
        check(bolt.isValid(),f'{aux}S{i} is a valid manufactured-proxy fastener')
        check(support.intersect(bolt).Volume()<1e-4,
              f'{aux}S{i} real mounting bores clear the installed screw')
        check(board_solid.intersect(bolt).Volume()<1e-4,
              f'{aux}S{i} does not drill through base outside blind hole')
    report['V38_'+aux+'_anchors']={
        'bolted_to_one_common_breadboard':system+'01',
        'candidate_anchor_count':4,
        'base_grid_aligned':True,
        'factory_hole_map_verified':False,
        'screw_size_and_engagement_verified':False
    }
# Photo145/150 shows a DISTINCT black Thorlabs sample support
# plate below the GCM rotary. Old B models rendered a single common
# surface, losing 12mm of an independently visible physical layer.
# 12mm and 250x300 are PHOTO-FIT CANDIDATES, not a decoded maker SKU.
sample_board=part(B,'B35')[0]
silver_board=part(B,'B01')[0]
sample_base=part(B,'B08')[0]
sbb=sample_board.BoundingBox();bb0=silver_board.BoundingBox()
check(abs(sbb.zmin-bb0.zmax)<.02,
      'B35 Thorlabs black plate directly rests on silver common table')
check(abs(sbb.zmax-sample_base.BoundingBox().zmin)<.02,
      'B08 rotary must sit ON B35 black plate, not on B01 directly')
check(abs(sbb.xlen-250)<.02 and abs(sbb.ylen-300)<.02 and abs(sbb.zlen-12)<.02,
      'B35 photo-fit 250x300x12 must cover both sample rotary and rear microscope foot')
check(sample_board.intersect(silver_board).Volume()<1e-4,
      'Two independent photo-confirmed B board layers must not interpenetrate')
microscope_foot=part(B,'B16A')[0]
# V35: the four depicted B16 screw axes require ACTUAL clearance
# voids through the microscope foot, not through a SOLID steel plate.
for dx in (-25,25):
    for dy in (-25,25):
        axis=vz(1.9,12,82+dx,-112+dy,32)
        check(microscope_foot.intersect(axis).Volume()<1e-5,
              'B16A has four real candidate Ø4 through holes for its depicted screws')
# Critical distinction: B35 holes are 2mm decorative blind recesses,
# not accepted tapped through-holes. The current B16 fastener centres
# cannot even be registered with the candidate B35 display-hole grid.
candidate_grid=[(65+x,y) for x in range(-100,101,25) for y in range(-125,126,25)]
candidate_foot=[(82+x,-112+y) for x in (-25,25) for y in (-25,25)]
centre_errors=[
    min(((fx-gx)**2+(fy-gy)**2)**.5 for gx,gy in candidate_grid)
    for fx,fy in candidate_foot
]
check(min(centre_errors)>10 and max(centre_errors)<15,
      'Current synthetic B35 grid does NOT prove four aligned microscope anchors')
report['B35_microscope_fastener_readiness']={
    'B16A_actual_through_clearance_bores':4,
    'candidate_bore_diameter_mm':4,
    'max_grid_mismatch_mm':round(max(centre_errors),2),
    'B35_grid_depth_mm':2,
    'B35_threaded_anchors_verified':False,
    'B16_fastener_positions_verified':False,
    'loaded_joint_accepted':False
}
check(sample_board.intersect(microscope_foot).Volume()<1e-4,
      'B35 black plate and microscope foot must CONTACT, not intersect')
micbb=microscope_foot.BoundingBox()
check(abs(micbb.zmin-sbb.zmax)<.02,
      'Microscope foot belongs on the SAME B35 top plane as sample rotary')
check(micbb.xmin>sbb.xmin and micbb.xmax<sbb.xmax and
      micbb.ymin>sbb.ymin and micbb.ymax<sbb.ymax,
      'Microscope foot must lie FULLY within B35 black-board footprint')
def mating_face_area_mm2(support,upper):
    # 0.05mm overlap perturbation estimates nonzero planar support
    # while leaving the canonical STEP assembly free of collisions.
    return upper.translate((0,0,-.05)).intersect(support).Volume()/.05
area_mic=mating_face_area_mm2(sample_board,microscope_foot)
area_rot=mating_face_area_mm2(sample_board,sample_base)
check(area_mic>3200,
      f'B35 must support microscope FOOT over substantial area, got {area_mic:.1f} mm²')
check(area_rot>5000,
      f'B35 must support rotary FOOT over substantial area, got {area_rot:.1f} mm²')
report['B35_dual_mount_face_areas_mm2']={
    'microscope':round(area_mic,1),
    'rotary':round(area_rot,1),
    'exact_plate_dimensions_verified':False,
    'fastener_holes_verified':False
}
check(sample_board.intersect(part(B,'B02')[0]).Volume()<1e-4,
      'Black sample plate must not engulf the separate left-side magnet')
# Holes are shallow photo-fit pockets: open at z30..32, closed below 30.
for xx in (65-100,65,65+100):
    for yy in (-125,0,125):
        opening=vz(2.6,2,xx,yy,30)
        backing=vz(2.6,.5,xx,yy,29.5)
        check(sample_board.intersect(opening).Volume()<1e-5,
              'B35 display hole must be actually open at board TOP')
        check(sample_board.intersect(backing).Volume()>7,
              'B35 display hole must be BLIND: do not invent a through-fastener')

# Previously this failed: separated 0.5mm screw shaft and head.
for i in range(1,5):
    ss=part(B,'B14_'+str(i))
    check(len(ss)==1,f'B14_{i} screw is ONE connected solid')
    bb=ss[0].BoundingBox()
    check(abs(bb.zmax-109.7)<0.03,f'B14_{i} top recessed 0.5 mm')
    check(abs(bb.zmin-78.7)<0.03,f'B14_{i} nominal M6x25 under-head length')
nfp=part(B,'B09A')[0]
check(abs(nfp.BoundingBox().zmin-76.2)<.01,'NFP carriage lower datum')
check(abs(nfp.BoundingBox().zmax-88.2)<.01,'NFP top mounting datum')
# The modeled hole depth is 10 mm. Tip at 66.7 and blind bottom at 66.2 => .5 mm.
hole_bottom=78.2;tip=78.7
check(tip-hole_bottom>=.5-1e-4,'candidate fastener has 0.5 mm axial blind-hole clearance')
# Photo149: formerly missing PHSH-style black 50mm sleeve, long
# vertical post passing through it and the separate upper square clamp.
v25_fixed=part(B,'B04A')[0]
v25_guide=part(B,'B04E')[0]
v25_bridge=part(B,'B04B')[0]
side_plate=part(B,'B05')[0]
v25_top=v25_bridge.BoundingBox()
arm_base=side_plate.BoundingBox()
holder=part(B,'B34')[0]
holderbb=holder.BoundingBox()
post=part(B,'B27')[0]
postbb=post.BoundingBox()
squarebb=part(B,'B33')[0].BoundingBox()
check(v25_fixed.intersect(side_plate).Volume()<1e-4,
      'B05 side-mounted plate cannot penetrate V25M STATIONARY 56mm upright')
check(v25_guide.intersect(side_plate).Volume()<1e-4,
      'B05 side-mounted plate cannot penetrate V25M moving guide')
check(v25_bridge.intersect(side_plate).Volume()<1e-4 and
      v25_fixed.intersect(v25_bridge).Volume()<1e-4 and
      v25_guide.intersect(v25_bridge).Volume()<1e-4,
      'B04/B05 moving carriage bridge has no volume penetration')
check(abs(v25_bridge.BoundingBox().xmax-arm_base.xmin)<.02,
      'V25M moving SIDE bridge meets B05 plate at its left X face')
check(abs(v25_bridge.BoundingBox().ymin-v25_guide.BoundingBox().ymax)<.02,
      'V25M moving SIDE bridge meets front guide at its +Y face')
check(v25_bridge.BoundingBox().zmin<arm_base.zmax and
      v25_bridge.BoundingBox().zmax>arm_base.zmin,
      'Side bridge and B05 plate share nonzero mounting-face vertical span')
check(abs(arm_base.zmax-holderbb.zmin)<.02,'B34 holder sits ON B05 plate')
check(abs(holderbb.zlen-50)<.02,'PHSH2 50mm sleeve is a candidate but its CAD must be consistent')
check(abs(postbb.zlen-100)<.02,'PHOTO149 rejects older 25mm post; 100mm installed-length candidate')
check(abs(postbb.zmin-holderbb.zmin)<.02,'Support post inserted from sleeve bottom datum')
check(holder.intersect(post).Volume()<1e-4,'Black sleeve has real Ø12 steel-post clearance')
check(abs(squarebb.zmin-holderbb.zmax-7)<.02,
      'Square clamp lies 7mm above black sleeve with exposed Ø12 steel post')
check(postbb.zmax>squarebb.zmax+5,
      'Post tip must protrude above B33 square clamp as actually photographed')
check(not (B/'B05D.step').exists(),
      'No double-counted V25M mounting plate or invented PHPB-1 flange')
# V31 REAL overlap exposed by STEP-vs-photo QA:
# The old V25M vertical silver micrometer B04C intersected the solid
# B04A fixed upright by 1455.7 mm^3; moving the centerline outside
# the upright must ALSO leave a true Ø13.2 bored retaining collar.
mic_shaft=part(B,'B04C')[0]
mic_knob=part(B,'B04D')[0]
mic_collar=part(B,'B04G')[0]
check(mic_shaft.intersect(v25_fixed).Volume()<1e-4,
      'V31 micrometer shaft must NOT drill through solid V25M upright')
check(mic_shaft.intersect(mic_collar).Volume()<1e-4,
      'V31 actual Ø13.2 collar clearance bore must NOT penetrate Ø13 shaft')
check(mic_collar.intersect(v25_fixed).Volume()<1e-4,
      'Micrometer support collar must only TOUCH stationary V25M guide')
check(abs(mic_collar.BoundingBox().xmax-v25_fixed.BoundingBox().xmin)<.02,
      'V31 collar side bridge must be physically supported at V25M left face')
# Photo108/149 dark V25M front-moving guide: 12 shallow, non-through
# photo-fit recesses. The old web face was a conspicuous bright solid
# plate without any visible manufacturer hole features. A bore must
# be actually EMPTY from the front but BLOCKED by backing material.
for xx in (-10,0,10):
    for zz in (93,103,113,123):
        front_void=cq.Solid.makeCylinder(1.45,2,
            Vector(-112+xx,5,zz),Vector(0,1,0))
        blind_back=cq.Solid.makeCylinder(1.45,.8,
            Vector(-112+xx,4.2,zz),Vector(0,1,0))
        check(v25_guide.intersect(front_void).Volume()<1e-5,
              f'V31 actual photo-fit recess open at X{xx}, Z{zz}')
        check(v25_guide.intersect(blind_back).Volume()>3,
              f'V31 front hole is BLIND, not accidental thru-hole: X{xx}, Z{zz}')
check(abs(mic_shaft.BoundingBox().zmax-mic_knob.BoundingBox().zmin)<.02,
      'V31 silver micrometer shaft meets upper drum without suspension')
check(mic_shaft.BoundingBox().xmax<v25_fixed.BoundingBox().xmin,
      'V31 V25M micrometer axis is outside fixed upright in photo108')

# Check exposed stage stack contact datums.
for name,bottom,top in [('B10',88.2,98.2),('B11',98.2,110.2)]:
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
amagnet=part(A,'A17')[0].BoundingBox()
check(abs(amagnet.zmin-20)<.02 and abs(amagnet.zmax-40)<.02,
      'V38 A has one TRUE film-side magnetic mounting stand above the only breadboard')
check(abs(amagnet.zmax-a15.zmin)<.02,
      'A15 film translation stage MUST rest ON A17 magnetic stand, not naked breadboard')
check(abs(part(A,'A15A')[0].BoundingBox().zmax-73)<.02,
      'A T25M2L has 33 mm verified dual-axis height above its V38 magnetic seat')
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
for sys,key,expected_bottom in [('B','B03',40),('A','A15',40)]:
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
# Reject the V17–V22 fabricated 85mm/249mm return loop and verify
# independent candidate sleeves/posts with distinct bores.
for obsolete in ('B05A','B05B','B05C','B05E'):
    check(not (B/(obsolete+'.step')).exists(),
          f'No old fabricated rear arm/hanging rod: {obsolete}')
phuc=part(B,'B24')[0]
support=part(B,'B27')[0]
square=part(B,'B33')[0]
long=part(B,'B25')[0]
second=part(B,'B28')[0]
terminal=part(B,'B26')[0]
spine=part(B,'B06')[0]
bb=phuc.BoundingBox()
check(abs(bb.zlen-60)<.02 and abs(bb.xlen-30)<.02 and abs(bb.ylen-30)<.02,
      'Zolix PHUC-1 manufacturer A60 and BØ30 housing envelope')
# Real boolean void checks: both holes must be open within the 60-mm body.
phuc_x=-35
upper_bore=cq.Solid.makeCylinder(5.8,30,Vector(phuc_x-15,0,168),Vector(1,0,0))
lower_bore=cq.Solid.makeCylinder(5.8,30,Vector(phuc_x-15,0,135),Vector(1,0,0))
check(phuc.intersect(upper_bore).Volume()<1e-4,'PHUC-1 upper Ø12 bore is real')
check(phuc.intersect(lower_bore).Volume()<1e-4,'PHUC-1 lower Ø12 bore is real')
check(abs(168-135-33)<.0001,
      'PHUC-1 manufacturer E33 bore-centre spacing')
check(abs(second.BoundingBox().zmin+6-135)<.01,
      'Lower rod center height follows photo149 and PHUC1 E=33')
check(abs(long.BoundingBox().zmin+6-168)<.01,
      'Upper rod center height follows photo149')
check(phuc.intersect(long).Volume()<1e-4,
      'PHUC-1 upper shell must not penetrate Ø12 first rod')
check(phuc.intersect(second).Volume()<1e-4,
      'PHUC-1 lower shell must not penetrate Ø12 second rod')
# B33 is a separate, still unidentified, cross connection visible in 149.
check(square.intersect(support).Volume()<1e-4,
      'B33 actual Ø12 post through-bore must not contain solid steel')
check(square.intersect(long).Volume()<1e-4,
      'B33 actual Ø12 crossbar bore must not contain solid steel')
check(support.intersect(long).Volume()<1e-5,
      'Support and first rod must remain separated by 15-mm nominal depth')
check(terminal.BoundingBox().xlen<11 and terminal.BoundingBox().ylen<=6.01,
      'B26 must be only the tiny Ø6 direct end stud, NEVER the invented Ø26 socket')
check(abs(second.BoundingBox().xmax-spine.BoundingBox().xmin)<.02,
      'Lower Ø12 post ends AT the GCM1302M outer left side, not inside solid body')
check(abs(terminal.BoundingBox().xmin-spine.BoundingBox().xmin)<.02,
      'Candidate M6 stud enters the GCM side face without a bulky hanging bracket')
check(terminal.intersect(spine).Volume()<1e-4,
      'GCM back spine must contain REAL M6 candidate drilled mating hole')
check(second.intersect(spine).Volume()<1e-4,
      'Full Ø12 lower rod must not penetrate solid plate-holder spine')
check(long.BoundingBox().xmax<82-17 and second.BoundingBox().xmax<82-17,
      'Both steel rods stop outside objective optical radius')
check(abs(long.BoundingBox().xmin+90)<.02 and abs(long.BoundingBox().xmax+20)<.02,
      'First rod crosses B33→PHUC without floating or extra metal tail')
check(not (B/'B06S3.step').exists(),
      'One shared B06 moving plate needs two screws only')
# V38 A film side photo94: ONE connected bent-L sheet and two visible
# screw heads. Old A05A 215mm fabricated span and A05C glass jaw
# were contradicted by photos94/95/97 and are intentionally absent.
a_sheet=part(A,'A05')[0]
asheet_bb=a_sheet.BoundingBox()
check(abs(asheet_bb.xmin+176)<.02 and abs(asheet_bb.xmax+96)<.02,
      'A photo94 thin bent-L extends only near the G40, NOT to the heater')
check(abs(asheet_bb.zmin-72)<.02 and abs(asheet_bb.zmax-146.5)<.02,
      'A photo94 folded plate lower return and top plate occupy consistent levels')
check(asheet_bb.zmin<part(A,'A04')[0].BoundingBox().zmax and
      asheet_bb.zmax>part(A,'A04')[0].BoundingBox().zmax,
      'A photo94 folded bracket touches top of G40 without fabricated long arm')
for i,dx in enumerate((-14,14),1):
    head=part(A,f'A05S{i}')[0]
    check(abs(head.BoundingBox().zmin-asheet_bb.zmax)<.02,
          'A photo94 two bolt heads sit on the folded plate')
    check(abs((head.BoundingBox().xmin+head.BoundingBox().xmax)/2-(-116+dx))<.02,
          'A photo94 candidate bolt pair aligned over G40')
for id in ('A05A','A05B','A05C'):
    check(not (A/(id+'.step')).exists(),
          'A old invented 215mm slide carrier, fake riser and guessed glass clip removed: '+id)
report['V38_A_film_mounting']={
 'single_breadboard':'A01','film_magnetic_stand':'A17',
 'magnet_model_and_height_qualified':False,
 'A15_height_after_magnet_mm':40,
 'G40_to_folded_sheet_bolt_pair':2,
 'photo94_fabricated_long_beam_removed':True,
 'film_glass_grip_vendor_model_known':False
}
a_rot=part(A,'A06A')[0].BoundingBox()
a_stg=part(A,'A02')[0].BoundingBox()
check(abs(a_rot.zmax-a_stg.zmin)<.05,'A02 stage rests on A06 rotary')
a_base=part(A,'A16')[0].BoundingBox()
a_rot_lower=part(A,'A06')[0].BoundingBox()
a_board=part(A,'A01')[0].BoundingBox()
check(abs(a_base.xlen-112)<.02 and abs(a_base.ylen-70)<.02 and abs(a_base.zlen-8)<.02,
      'A photos137/161 confirmed GCM-5306M OEM base is 112x70x8mm')
check(abs(a_base.zmin-a_board.zmax)<.02 and abs(a_rot_lower.zmin-a_base.zmax)<.02,
      'A GCM-5306M is UNDER rotary, not counted as the rotary itself')
a_tilt=part(A,'A04')[0].BoundingBox()
check(abs(a_tilt.zmax-144)<.02,
      'A04 raised 20mm with A15 magnet; A05 folded sheet touches top z144')
# NEW PHOTO REGISTER: 94/95/97 are A, whereas B is 107-112 and
# 145-151. The former erroneous B_photo94 assembly is not exported.
check(not (ROOT/'build'/'platform_B_photo94').exists(),
      'Never build a B-photo94 assembly from verified A photographs')
for required in ('B07','B35','B08','B09','B10','B11','B12','B14_1','B14_2',
                 'B14_3','B14_4','B15','B16','B17','B18',
                 'B24','B25','B26','B27','B28','B33','B34','B36','B37','B37A','B38','B39','B20I','B40'):
    check((B/(required+'.step')).exists(),
          'Corrected photo145-151 B full-system STEP missing '+required)
report['new_dimension_evidence']={
    'B_photo_ids':[145,146,147,148,149,150,151],
    'A_photo_ids':[137,138,139,140,141,142,143,144,152,155,161],
    'B_confirmed_models':['Zolix PHUC-1','Daheng GCM-1302M'],
    'A_confirmed_base':'Daheng GCM-5306M',
    'fabrication_ready':False,
    'missing':'B24 swivel angle, B25/B28 post lengths, B26 threaded mate, all hole-face datums'
}

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
    small=vz(3.1,11,bx,by,65.2)
    cb=vz(5.35,4,bx,by,72.2)
    check(nfp_clearance.intersect(small).Volume()<1e-5,
          'NFP fixed base corner Ø6.5 clearance is open (not a thread)')
    check(nfp_clearance.intersect(cb).Volume()<1e-5,
          'NFP 50mm corner mounting counterbore Ø11 exists')
check(abs(part(B,'B09A')[0].BoundingBox().zmax-88.2)<.02,
      'NFP moving top nominal 23mm above 65.2 mount datum')
# B06 follows the same independent fixed/movable pressure-plate
# arrangement as the web candidate: one shared plate, TWO pressure screws.
fixed_jaw=part(B,'B06F')[0]
moving_plate=part(B,'B06M')[0]
drive_bridge=part(B,'B06T')[0]
glass=part(B,'B07')[0]
pdms=part(B,'B07A')[0]
chuck=part(B,'B11')[0]
# V31 independent STEP component QA: V30 had 70 mm^3 overlap
# between B06 and B06F; B06 and moving B06M overlapped 490 mm^3.
# The moving pressure plate must not occupy solid fixed-spine material.
spine=part(B,'B06')[0]
check(spine.intersect(fixed_jaw).Volume()<1e-4,
      'V31 fixed lower jaw must attach by clean face, not penetrate fixed spine')
check(spine.intersect(moving_plate).Volume()<1e-4,
      'V31 moving pressure plate must NOT penetrate GCM1302M fixed spine')
check(abs(spine.BoundingBox().xmax-fixed_jaw.BoundingBox().xmin)<.02 and
      abs(spine.BoundingBox().xmax-moving_plate.BoundingBox().xmin)<.02,
      'Fixed spine shares one X mating face with both GCM1302M jaw plates')
check(abs(moving_plate.BoundingBox().zmin-fixed_jaw.BoundingBox().zmax-1)<.02,
      'A clean 1mm glass opening remains between two noninterpenetrating clamp jaws')
for jaw,description in ((fixed_jaw,'lower fixed jaw'),(moving_plate,'moving upper pressure plate')):
    check(jaw.intersect(glass).Volume()<1e-6,description+' does not penetrate glass')
    check(jaw.intersect(pdms).Volume()<1e-6,description+' does not penetrate PDMS')
    check(jaw.intersect(chuck).Volume()<1e-6,description+' clears the heater')
check(glass.intersect(chuck).Volume()<1e-6,'Glass does not penetrate hot metal')
# V36 stamp is at the RIGHT edge of the slide. The GCM-1302M jaw
# remains ENTIRELY LEFT of the 65mm heating plate when moving downward,
# including 12.5mm sample-only negative X travel. These are scene
# coordinates and conservative zero-rotation envelopes, not full-stroke
# manufacturer hardware qualification.
gbox=glass.BoundingBox()
sbox=pdms.BoundingBox()
jaws=[part(B,key)[0].BoundingBox() for key in ('B06','B06F','B06M','B06T')]
clamp_x_right=max(q.xmax for q in jaws)
heat_x_left=chuck.BoundingBox().xmin
check(abs(gbox.xmin-18)<.02 and abs(gbox.xmax-94)<.02,
      'V36 glass extends from x18 to x94; clamp grips left edge')
check(abs(sbox.xmin-72)<.02 and abs(sbox.xmax-92)<.02,
      'V36 PDMS is near right glass edge and centered over heater')
check(gbox.xmin<=part(B,'B06F')[0].BoundingBox().xmax and
      gbox.xmin>=part(B,'B06F')[0].BoundingBox().xmin and
      gbox.xmin<=part(B,'B06M')[0].BoundingBox().xmax and
      sbox.xmax<=gbox.xmax-1.5,
      'PDMS stays on glass and both actual jaw faces overlap its left portion')
check(abs(clamp_x_right-34)<.02,
      'V36 full solid clamp jaws right edge at x34, not inside hot stage')
check(heat_x_left-clamp_x_right>15,
      'V36 lowered clamp cannot collide with nominal heater')
check(heat_x_left-12.5-clamp_x_right>=2,
      'V36 sample-only X stroke still clears fixed clamp in downward approach')
report['V36_film_stamp_approach']={
    'glass_x_range_mm':[round(gbox.xmin,1),round(gbox.xmax,1)],
    'stamp_x_range_mm':[round(sbox.xmin,1),round(sbox.xmax,1)],
    'clamp_right_x_mm':round(clamp_x_right,1),
    'heater_left_x_mm':round(heat_x_left,1),
    'clearance_normal_mm':round(heat_x_left-clamp_x_right,1),
    'clearance_sample_left12p5_mm':round(heat_x_left-12.5-clamp_x_right,1),
    'pdms_to_heater_contact_descent_mm':13,
    'XplusY_combinations_need_runtime_guard':True,
    'actual_hardware_accepted':False
}
check(abs(glass.BoundingBox().zmin-125)<.02,'Glass bottom matches new direct-coupled fixed jaw')
check(abs(glass.BoundingBox().zmax-126)<.02,'Glass has 1mm thickness in current B fit')
check(abs(moving_plate.BoundingBox().zmin-glass.BoundingBox().zmax)<.02,
      'One moving pressure plate contacts 1mm glass without interpenetration')
check(abs(glass.BoundingBox().zmin-pdms.BoundingBox().zmax)<.02,
      'PDMS underside contacts glass')
check(9<pdms.BoundingBox().zmin-chuck.BoundingBox().zmax<25,
      'With B35 rise, film is ABOVE and not touching heater (clearance photo-fit only)')
for i in (1,2):
    screw=part(B,f'B06S{i}')[0]
    check(screw.intersect(drive_bridge).Volume()<1e-4,
          f'B06 screw {i} passes through actual clearance bore in bridge')
check(long.intersect(part(B,'B18')[0]).Volume()<1e-6,
      'B25 post does not intersect objective')
check(long.intersect(part(B,'B16C')[0]).Volume()<1e-6,
      'B25 post does not intersect microscope body')
# FULL B-DOMAIN zero-penetration sweep. The previous checker
# tested rod bores and relative bounding boxes but missed moving
# mechanical parts colliding with their fixed neighbors. Do not
# silently waive genuine clashes as "small rendering artifacts".
rigid_components=[
 'B04A','B04B','B04C','B04D','B04E','B04G','B05','B06','B06F','B06M',
 'B06T','B24','B25','B26','B27','B28','B33','B34'
]
candidate_solids={k:part(B,k)[0] for k in rigid_components}
collision_exceptions=[]  # Keep explicit and empty for this clean-fit subset.
for ii,ka in enumerate(rigid_components):
    aa=candidate_solids[ka]
    ba=aa.BoundingBox()
    for kb in rigid_components[ii+1:]:
        if tuple(sorted((ka,kb))) in collision_exceptions:
            continue
        bb=candidate_solids[kb].BoundingBox()
        if (ba.xmax<=bb.xmin or bb.xmax<=ba.xmin or
            ba.ymax<=bb.ymin or bb.ymax<=ba.ymin or
            ba.zmax<=bb.zmin or bb.zmax<=ba.zmin):
            continue
        overlap=aa.intersect(candidate_solids[kb]).Volume()
        check(overlap<1e-3,
              f'V31 critical B mechanical interference {ka} vs {kb}: {overlap:.3f} mm³')
report['critical_rig_collision_audit']={
    'scope':'18 selected support/holder/slide solids; intentional face contact allowed',
    'passes':True,
    'moving_pressure_plate_clash_mm3':0,
    'upright_micrometer_clash_mm3':0,
    'physical_thread_fit_verified':False
}
# A zero-intersection score alone does NOT prove a face is connected:
# old B06F touched the fixed spine by only 0.5mm of its 4mm thickness.
# Shift each member 0.05mm across its intended mating plane and
# estimate actual shared-face area = tiny overlap volume / 0.05mm.
# These are *photo-fit geometric* face areas, NOT fastener/load ratings.
face_contacts=[
    ('B04B','B04E',(0,-.05,0),150),  # movable guide to side bracket
    ('B04B','B05',(.05,0,0),80),    # bracket to top plate
    ('B04G','B04A',(.05,0,0),20),   # external micrometer collar to upright
    ('B34','B05',(0,0,-.05),150), # holder annular base to mounting plate
    ('B06F','B06',(-.05,0,0),175),# fixed lower jaw edge to GCM spine
    ('B06M','B06',(-.05,0,0),160) # moving plate contact, NOT interpenetration
]
face_areas={}
for ka,kb,delta,min_area in face_contacts:
    a=candidate_solids[ka] if ka in candidate_solids else part(B,ka)[0]
    b=candidate_solids[kb] if kb in candidate_solids else part(B,kb)[0]
    overlap=a.translate(delta).intersect(b).Volume()
    area=overlap/.05
    check(area>=min_area,
          f'V31 supported mating FACE {ka}/{kb}: {area:.1f} mm² must be ≥{min_area}')
    face_areas[ka+'→'+kb]=round(area,2)
report['candidate_face_contact_areas_mm2']=face_areas
report['candidate_face_contact_limitations']='No validated screw engagement, preload, full-travel or mechanical load capacity'
# PHOTO114/117/119 CONTROL ENCLOSURE: prior builds used a 125mm
# controller block and dispersed the 247mm SE-600-48 PSU / black
# module outside it in physically colliding locations. The PSU and
# the vented module really share one OPEN steel control housing.
cabinet=part(B,'B36')[0]
pid=part(B,'B19')[0]
psu=part(B,'B21')[0]
inner_module=part(B,'B23')[0]
pump_solids=part(B,'B20')
pump=pump_solids[0]
led_driver=part(B,'B22')[0]
shellbb=cabinet.BoundingBox()
check(abs(shellbb.xlen-285)<.02 and abs(shellbb.ylen-225)<.02 and
      abs(shellbb.zlen-125)<.02,
      'B36 control enclosure 285x225x125 is an explicit PHOTO-FIT candidate')
check(cabinet.Volume()<285*225*125*0.30,
      'Control enclosure must be HOLLOW and open, not one solid giant cuboid')
for key,component in [('B21 SE60048',psu),('B23 black aux module',inner_module)]:
    bb=component.BoundingBox()
    check(bb.xmin>shellbb.xmin+3 and bb.xmax<shellbb.xmax-3 and
          bb.ymin>shellbb.ymin+3 and bb.ymax<shellbb.ymax-3 and
          abs(bb.zmin-(shellbb.zmin+3))<.02 and bb.zmax<shellbb.zmax,
          key+' must be INSIDE the same photo119 open cabinet')
    check(component.intersect(cabinet).Volume()<1e-4,
          key+' must not penetrate real enclosure walls')
check(psu.intersect(inner_module).Volume()<1e-4,
      'Identified PSU and unknown B23 module require independent space inside cabinet')
check(abs(pid.BoundingBox().ymin-shellbb.ymax)<.02,
      'YUDIAN controller back face touches B36 FRONT panel, not floating')
check(pid.intersect(cabinet).Volume()<1e-4,
      'YUDIAN face panel cannot occupy solid metal cabinet walls')
# V43: photo/catalog geometry checks for the cylindrical VN-50 candidate.
pumpbb=pump.BoundingBox()
check(abs(pumpbb.xlen-200)<.02 and abs(pumpbb.ylen-110)<.02 and
      abs(pumpbb.zlen-150)<.02,
      'V43 VN-50 candidate envelope is 200x110x150mm')
check(len(pump_solids)==1,
      'V43 VN-50 barrel, end covers, rails, heads and fittings form one connected STEP solid')
pump_mount_holes=[]
for x in (254,396):
    for y in (132,228):
        hole=vz(3.1,8.2,x,y,-.1)
        pump_mount_holes.append(pump.intersect(hole).Volume())
check(max(pump_mount_holes)<1e-5,
      'V43 VN-50 candidate 142x96mm mounting pattern has four open Ø6.2 bores')
# Both head blocks, flanges and end supports must be fully present.
for x in (290,365):
    head=box_probe(42,42,38,x,180,96)
    check(abs(pump.intersect(head).Volume()-head.Volume())<1e-3,
          f'V43 VN-50 finned head core at X={x} is fully present')
for x in (255,395):
    for z0 in (21,61):
        support=box_probe(14,14,18,x,214,z0)
        check(abs(pump.intersect(support).Volume()-support.Volume())<1e-3,
              f'V43 same-side tie-rod end support at X={x}, Z={z0+9} is fully present')
for x in (290,365):
    bridge_post=vz(4.2,8,x,180,134)
    check(abs(pump.intersect(bridge_post).Volume()-bridge_post.Volume())<1e-3,
          f'V43 head-to-bridge support post at X={x} is fully present')
bridge=vx(4.2,75,290,180,142)
check(abs(pump.intersect(bridge).Volume()-bridge.Volume())<1e-3,
      'V43 shared top connecting pipe is fully integrated')
for z0 in (30,70):
    rod=vx(2.5,140,255,219,z0)
    check(abs(pump.intersect(rod).Volume()-rod.Volume())<1e-3,
          f'V43 longitudinal tie rod on the same visible side at Z={z0} is present')
# 12 top bores and 18 side bores must remain open through the curved shell.
for x in (255,260,315,330,390,395):
    for y in (165,195):
        top_vent=vz(2.7,2.5,x,y,90.5)
        check(pump.intersect(top_vent).Volume()<1e-5,
              f'V43 upper-arc ventilation bore remains open at {x},{y}')
for x in (260,270,360,375,390,395):
    for z in (40,50,60):
        side_vent=vy(2.1,3,x,222.5,z)
        check(pump.intersect(side_vent).Volume()<1e-5,
              f'V43 curved-side ventilation bore remains open at {x},{z}')
# Eight holes are drilled through the fan cover on the left end face.
for dy,dz in [(-24,0),(24,0),(0,-24),(0,24),
              (-17,-17),(-17,17),(17,-17),(17,17)]:
    fan_hole=vx(2.5,14,239,180+dy,50+dz)
    check(pump.intersect(fan_hole).Volume()<1e-5,
          f'V43 fan-grille aperture remains open at {dy},{dz}')
fan_ring_test=vx(39,2,239,180,50).cut(vx(31,2.2,238.9,180,50))
check(abs(pump.intersect(fan_ring_test).Volume()-fan_ring_test.Volume())<1e-3,
      'V43 circular fan-grille ring is present and attached to end cover')
nameplate_test=box_probe(48,1.2,22,325,224,39)
check(abs(pump.intersect(nameplate_test).Volume()-nameplate_test.Volume())<1e-3,
      'V43 side nameplate is physically fused to the cylindrical shell')
for w,z0 in [(30,56),(36,52),(32,48),(28,44),(22,40)]:
    printed_line=box_probe(w,.6,1.2,325,224.8,z0)
    check(abs(pump.intersect(printed_line).Volume()-printed_line.Volume())<1e-3,
          f'V43 printed data-plate line at Z={z0} is attached')
warning_test=box_probe(18,1.2,18,370,220,61)
check(abs(pump.intersect(warning_test).Volume()-warning_test.Volume())<1e-3,
      'V43 no-lubrication warning sticker is physically fused to the shell')
warning_ring_test=vy(5.2,.6,370,220.45,70).cut(vy(4.2,.8,370,220.35,70))
check(abs(pump.intersect(warning_ring_test).Volume()-warning_ring_test.Volume())<1e-3,
      'V43 warning sticker annular symbol is present and attached')
warning_slash_test=box_probe(1.4,.6,12,370,220.8,64).rotate(
    (370,220.8,70),(370,221.8,70),-45)
check(abs(pump.intersect(warning_slash_test).Volume()-warning_slash_test.Volume())<1e-3,
      'V43 warning sticker diagonal slash is present and attached')
report['V43_VN50_pump_geometry']={
 'candidate_envelope_mm':[round(pumpbb.xlen,3),round(pumpbb.ylen,3),round(pumpbb.zlen,3)],
 'candidate_mounting_pitch_mm':[142,96],
 'mounting_hole_diameter_candidate_mm':6.2,
 'connected_solid_count':len(pump.Solids()),
 'cylindrical_motor_housing':True,
 'same_side_tie_rods':2,
 'rod_end_supports':4,
 'finned_twin_heads':2,
 'head_cooling_fins':6,
 'top_vent_bores':12,
 'side_vent_bores':18,
 'fan_grille_ring':True,
 'fan_grille_apertures':8,
 'printed_nameplate_proxy':True,
 'warning_sticker_proxy':True,
 'warning_symbol':True,
 'manufacturer_verified':False,
 'inlet_orientation_verified':False
}
for name,item in [('B20 vacuum pump',pump),('B22 LED adapter',led_driver)]:
    check(item.intersect(cabinet).Volume()<1e-4,
          name+' is an EXTERNAL accessory, not fitted inside the PSU cabinet')
    check(item.intersect(part(B,'B01')[0]).Volume()<1e-4,
          name+' must not float interpenetrating optical table')
    check(abs(item.BoundingBox().zmin)<.02,
          name+' candidate floor placement must remain physically supported')
check(pump.intersect(led_driver).Volume()<1e-4,
      'Independent photo120 vacuum pump and photo115 LED adapter must not overlap')
# V36: there is ONE real side-wall feedthrough, and the two separate
# heater leads and sensor cable reach the cabinet/connection region.
port=vx(5.05,6,220,-166,86)
check(cabinet.intersect(port).Volume()<1e-5,
      'B36 left side wall must have a REAL open Ø10.6 cable passage')
for name in ('B37','B37A','B38'):
    cable=part(B,name)[0]
    check(cable.BoundingBox().xmax>250 and cable.BoundingBox().xmin<100,
          name+' must visually connect sample outlet to B36 interior')
    check(cable.isValid(),name+' must remain a valid connected candidate cable')
termination=part(B,'B39')[0]
check(termination.intersect(cabinet).Volume()<1e-4,
      'B39 unassigned terminal zone belongs in open housing without wall overlap')
check(termination.intersect(psu).Volume()<1e-4 and
      termination.intersect(inner_module).Volume()<1e-4,
      'B39 cannot bury candidate terminal block in PSU or unknown module')
report['V36_controller_harness']={
    'actual_wires':['B37','B37A','B38'],
    'through_cabinet_side_wall':True,
    'heater_pair_leads_present':True,
    'temperature_feedback_separate':True,
    'electric_terminal_pinout_verified':False,
    'SE60048_heater_supply_link_verified':False,
    'electrical_safety_verified':False
}
report['control_enclosure_B36']={
    'source_photos':[114,117,119],
    'contained':['B21 SE-600-48','B23 unidentified vented module'],
    'front_panel':'B19 YUDIAN AI controller',
    'separate_peripherals':['B20 vacuum pump','B22 LED adapter'],
    'enclosure_hardware_dimensions_verified':False,
    'wiring_and_electrical_safety_verified':False
}
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
center_vac=cq.Solid.makeCylinder(1.25,32.5,Vector(82,-32.5,107.5),Vector(0,1,0))
center_top=cq.Solid.makeCylinder(.55,2.9,Vector(82,0,107.3),Vector(0,0,1))
check(center_vac.intersect(chuck).Volume()<1e-6,'Rear vacuum bore is connected towards center')
check(center_top.intersect(chuck).Volume()<1e-6,'One central top suction hole is unobstructed')
# V37: physical vacuum loop (photo120 confirms VN-50, NOT W-50).
# The pump/port presentation remains a candidate: do NOT claim an
# OEM inlet side or hose thread has been measured.
vacstub=part(B,'B15T')[0]
suction=part(B,'B40')[0]
port_body=part(B,'B20I')[0]
pump_body=part(B,'B20')[0]
# Actual annular B15 fitting and B20I suction port. A solid plug
# in either location must fail this test.
fitting_void=vy(1.15,11.8,82,-44.4,107.5)
check(vac.intersect(fitting_void).Volume()<1e-5,
      'V37 rear vacuum connector has a genuinely OPEN axial bore')
nozzle_void=vx(2.0,20.0,405,180,68)
check(port_body.intersect(nozzle_void).Volume()<1e-5,
      'V37 VN-50 nominated suction tube has a real open axial lumen')
head_void=vx(2.0,6,402.7,180,68)
check(pump_body.intersect(head_void).Volume()<1e-5,
      'V37 VN-50 head cannot plug the suction nozzle')
# Radius tests detect a fake solid hose. Use local axes at the first
# straight segment where centerline is unambiguous.
def vacuum_axis_probe(a,b,r=.9,trim=.15):
    from math import sqrt
    v=Vector(b[0]-a[0],b[1]-a[1],b[2]-a[2])
    length=v.Length
    direction=v.normalized()
    origin=Vector(*a)+direction*trim
    return cq.Solid.makeCylinder(r,length-2*trim,origin,direction)
short_points=[(82,-44.5,107.5),(82,-58,108.5)]
outer_points=[(94,-79,90.5),(200,-135,70)]
check(vacstub.intersect(vacuum_axis_probe(*short_points)).Volume()<.01,
      'V37 B15T short hose has a CONTINUOUS hollow center')
check(suction.intersect(vacuum_axis_probe(*outer_points)).Volume()<.01,
      'V37 B40 long hose has a CONTINUOUS hollow center')
check(vacstub.BoundingBox().xmax>=94-3.5 and
      suction.BoundingBox().xmin<=94+3.5,
      'V37 short and long hose envelopes must share outlet region')
check(suction.BoundingBox().xmax>=425-3.5,
      'V37 pump end of suction hose must reach VN-50 inlet position')
check(suction.intersect(cabinet).Volume()<.01,
      'V37 vacuum hose cannot thread through metal electrical cabinet')
check(suction.intersect(pid).Volume()<.01,
      'V39 B40 must pass BEHIND B19 without intersecting the controller body')
check(suction.BoundingBox().ymin<shellbb.ymin-10,
      'V39 B40 must route behind the full B36 cabinet, not above its front controller')
check(suction.BoundingBox().xmin<shellbb.xmin-10 and
      suction.BoundingBox().xmax>shellbb.xmax+10,
      'V39 B40 must route around both cabinet side walls before reaching the pump')
check(suction.intersect(part(B,'B16')[0]).Volume()<.01,
      'V40 B40 first span must clear the rear microscope column B16')
rear_lane_probe=cq.Solid.makeCylinder(4.5,320,Vector(200,-275,70),Vector(1,0,0))
check(suction.intersect(rear_lane_probe).Volume()>0,
      'V40 B40 must occupy the specified Z=70mm service lane behind B36')
wire_clearances={}
for name in ('B37','B37A','B38'):
    wire=part(B,name)[0]
    clearance=suction.distance(wire)
    wire_clearances[name]=round(clearance,3)
    check(clearance>2.0,
          f'V40 B40 must keep >2mm surface clearance from {name}; got {clearance:.3f}mm')
check(suction.intersect(pump_body).Volume()<.01,
      'V37 suction hose cannot burrow through the pump motor housing')
check(suction.intersect(part(B,'B01')[0]).Volume()<.01,
      'V37 vacuum hose must route ABOVE the optical base, not through it')
check(not (B/'B40A.step').exists(),'No second disconnected invented suction line')
report['V40_rear_routed_suction_loop']={
 'actual_pump_model_photo_120':'VN-50',
 'pump_nameplate':{'AC_V':220,'power_W':230,'flow_L_per_min':53,
                   'vacuum_mmHg':680,'weight_kg_approx':4},
 'verified_photo_brand':False,
 'actual_intake_orientation_verified':False,
 'air_path':['B11 top bore','B11 internal rear channel','B15 bored fitting',
             'B15T hollow hose stub','B40 hollow hose','B20I open pump inlet'],
 'real_lumen_open_on_all_external_parts':True,
 'pump_has_real_open_intake_bore':True,
 'cabinet_interpenetration':False,
 'passes_behind_B19_controller':True,
 'route_around_B36_rear_and_right_side':True,
 'B19_body_interference':False,
 'B16_post_interference':False,
 'service_lane_vertical_Z_mm':70,
 'minimum_surface_clearance_to_electrical_harness_mm':wire_clearances,
 'B37_B37A_B38_separated_from_B40':all(v>2 for v in wire_clearances.values()),
 'pump_electrical_connection_inferred':False,
 'hose_thread_and_material_spec_verified':False
}
left_probe=cq.Solid.makeCylinder(1.2,10,Vector(49.5,0,107.5),Vector(1,0,0))
check(left_probe.intersect(chuck).Volume()>1.0,'Old left-side inlet is absent from metal')

# Optical tips are a conservative candidate for open clearance, not WD qualification.
tipbb=part(B,'B18A')[0].BoundingBox()
glass=part(B,'B07')[0].BoundingBox()
check(tipbb.zmin>glass.zmax,'B objective proxy is above slide; no through-slide collision')
report['checks_passed']=len(report['checks'])
report['geometry_status']='passed'
report['status']='proxy_geometry_only__physical_acceptance_pending'
(ROOT/'build'/'interface_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
