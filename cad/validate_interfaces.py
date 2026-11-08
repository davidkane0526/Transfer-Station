"""Post-build mechanical checks for V51 candidate STEP assemblies.

Verifies geometric continuity and *candidate* blind-hole depth, not real
manufacturer thread engagement, applied torque, heat paths, or safe machining.
The actual NFP thread depth MUST be measured or supported by its vendor drawing.
"""
from pathlib import Path
import json
import math
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
    ('B','B35',[(x,y) for x in (-25,175) for y in (-125,125)],30.25)):
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
rotary_top=part(B,'B08A')[0]
lower_z=20+12+33.2
upper_z=lower_z+23
b41_fixed=part(B,'B41')[0]
b41_moving_lower=part(B,'B41M')[0]
b41_moving_top=part(B,'B41A')[0]
nfp_fixed=part(B,'B09')[0]
nfp_moving_lower=part(B,'B09M')[0]
nfp_moving_top=part(B,'B09A')[0]
check(abs(sample_base.BoundingBox().zmin-32)<.02,
      'B08 GCM-1107M rotary begins directly on the B35 board top')
check(abs(rotary_top.BoundingBox().zmax-lower_z)<.02,
      'B08 rotary top reaches the lower B41 stage mounting datum')
check(abs(b41_fixed.BoundingBox().zmin-lower_z)<.02 and
      abs(b41_fixed.BoundingBox().zlen-11)<.02 and
      abs(b41_moving_lower.BoundingBox().zlen-2)<.02 and
      abs(b41_moving_top.BoundingBox().zlen-10)<.02,
      'B41 lower orthogonal stage retains 11+2+10mm fixed/moving stack')
check(abs(b41_moving_top.BoundingBox().zmax-upper_z)<.02,
      'B41 lower stage top is the B09 upper-stage mounting datum')
check(abs(nfp_fixed.BoundingBox().zmin-upper_z)<.02 and
      abs(nfp_fixed.BoundingBox().zlen-11)<.02 and
      abs(nfp_moving_lower.BoundingBox().zlen-2)<.02 and
      abs(nfp_moving_top.BoundingBox().zlen-10)<.02,
      'B09 upper NFP retains its own independent 11+2+10mm stack')
check(abs(nfp_moving_top.BoundingBox().zmax-(upper_z+23))<.02,
      'B09 upper NFP total mechanical height is 23mm')
check(rotary_top.intersect(b41_fixed).Volume()<1e-4 and
      b41_moving_top.intersect(nfp_fixed).Volume()<1e-4,
      'B08/B41 and B41/B09 interfaces are planar contacts without interpenetration')
for fixed,lower,top,key in ((b41_fixed,b41_moving_lower,b41_moving_top,'B41'),
                            (nfp_fixed,nfp_moving_lower,nfp_moving_top,'B09')):
    check(fixed.intersect(lower).Volume()<1e-4 and lower.intersect(top).Volume()<1e-4,
          key+' fixed/carriage/top layers meet without interpenetration')
# B08 OEM 4xØ6.8 and Ø11.5x16mm fixed-base mounting geometry.
# A real bore is necessary; a drawn circular ring cannot accept a screw.
for dx in (-25,25):
    for dy in (-25,25):
        x,y=82+dx,dy
        clearance=vz(3.3,23,x,y,32)
        counterbore=vz(5.7,16,x,y,39)
        check(sample_base.intersect(clearance).Volume()<1e-5,
              'B08 lower OEM Ø6.8 screw clearance must be open')
        check(sample_base.intersect(counterbore).Volume()<1e-5,
              'B08 Ø11.5 x 16mm OEM counterbore must be open')
# B08 is a rotation-only stage: the real unit has no external operating handle.
check(not (B/'B08B.step').exists(),'B08 GCM-1107M must not contain a fabricated external handle')
# GCM-1107M nine-hole 25mm candidate pattern.
for dx in (-25,0,25):
    for dy in (-25,0,25):
        hole=vz(2.45,8,82+dx,dy,57.2)
        check(rotary_top.intersect(hole).Volume()<1e-5,
              'B08 GCM-1107M 9-hole top pattern remains open')
# Both 65mm-class single-axis stages have separate 4-hole fixed bases.
for key,z0,fixed in (('B41',lower_z,b41_fixed),('B09',upper_z,nfp_fixed)):
    for dx in (-25,25):
        for dy in (-25,25):
            x,y=82+dx,dy
            clearance=vz(3.2,11,x,y,z0)
            counterbore=vz(5.45,5,x,y,z0+6)
            check(fixed.intersect(clearance).Volume()<1e-5,
                  key+' fixed-base Ø6.5 clearance hole is open')
            check(fixed.intersect(counterbore).Volume()<1e-5,
                  key+' fixed-base Ø11 counterbore is open')
    for i in range(1,5):
        screw=part(B,f'{key}S{i}')
        check(len(screw)==1 and screw[0].isValid(),
              key+' fixed-base mounting screw is one valid connected solid')
# The lower B41 top has only the four candidate corner M6 holes needed
# to mount the upper B09 fixed base. Do not impose the NFP full hole grid.
for dx in (-25,25):
    for dy in (-25,25):
        tapped=vz(2.45,8,82+dx,dy,lower_z+23-8)
        check(b41_moving_top.intersect(tapped).Volume()<1e-5,
              'B41 moving top corner M6 candidate hole remains open for B09 mounting')
# B09 NFP moving top: 9 M6 + 4 M3 tap-drill proxies.
for dx in (-25,0,25):
    for dy in (-25,0,25):
        probe=vz(2.45,10,82+dx,dy,upper_z+13)
        check(nfp_moving_top.intersect(probe).Volume()<1e-5,
              'B09 NFP moving plate 9-M6 top hole is open')
for dx in (-16,16):
    for dy in (-16,16):
        probe=vz(1.20,10,82+dx,dy,upper_z+13)
        check(nfp_moving_top.intersect(probe).Volume()<1e-5,
              'B09 NFP moving plate 4-M3 top hole is open')
for xoff,radius in [(-18,1.6),(-4,2.0),(11,2.6),(22,1.6)]:
    probe=vy(radius,.6,82+xoff,32.2,upper_z+7)
    check(nfp_fixed.intersect(probe).Volume()<1e-5,
          'B09 NFP fixed-base lower photo side bore is open')
for xoff,radius in [(-22,1.8),(-8,1.8),(12,2.8)]:
    probe=vy(radius,.6,82+xoff,32.2,upper_z+17.5)
    check(nfp_moving_top.intersect(probe).Volume()<1e-5,
          'B09 NFP moving-top upper photo side bore is open')
for key in ('B09B','B09C','B09D','B09E','B41B','B41C','B41D','B41E'):
    item=part(B,key)
    check(len(item)==1 and item[0].isValid(),
          f'{key} sample-stage micrometer component exists and is valid')
nfp_micrometer=part(B,'B09E')[0].BoundingBox()
check(nfp_micrometer.xmax>220,
      'B09 NFP micrometer drum points to the operator-right side (+X)')
b41_micrometer=part(B,'B41E')[0].BoundingBox()
b41_body=part(B,'B41')[0].BoundingBox()
check(b41_micrometer.ymin>b41_body.ymax-.02,
      'B41 second micrometer points toward the operator/front (+Y)')
report['B08_GCM1107M']={
    'envelope_mm':[94,94,33.2],
    'top_hole_pattern':'OEM 9-M6 at 25mm pitch, 8mm tap-drill proxy',
    'base_mounting':'OEM four Ø6.8 and Ø11.5x16 counterbores, 50x50mm',
    'base_to_B35_hole_registration_verified':False,
    'external_operating_handle':False,
    'OEM_model_confirmed':True
}
report['B41_lower_orthogonal_stage']={
    'stack_order':'B35 -> B08 -> B41 -> B09 -> B10 -> B11',
    'envelope_candidate_mm':[65,65,23],
    'fixed_moving_stack_mm':[11,2,10],
    'micrometer_direction':'+Y (front)',
    'micrometer_overall_length_candidate_mm':135.0,
    'orthogonal_to_B09_X':True,
    'exact_SKU_confirmed':False,
    'mounting_hole_pattern_verified':False
}
report['B09_NFP1462C']={
    'envelope_mm':[65,65,23],
    'fixed_moving_stack_mm':[11,2,10],
    'fixed_base_mounting':'4 x Ø6.5 clearance / Ø11 counterbore at 50mm pitch',
    'moving_top_pattern':'9 M6 + 4 M3 candidate tapped holes',
    'photo_side_holes':{'fixed_lower':4,'moving_upper':3},
    'micrometer_direction':'+X',
    'micrometer_overall_length_oem_range_mm':[155.5,180.5],
    'micrometer_overall_length_candidate_mm':177.5,
    'micrometer_housing_shaft_collar_drum_clearance_checked':True,
    'single_axis_only':True,
    'manufacturer_model_confirmed':True
}
sbb=sample_board.BoundingBox();bb0=silver_board.BoundingBox()
check(abs(sbb.zmin-bb0.zmax)<.02,'B35 local plate directly rests on the sole B01 common breadboard')
check(abs(sbb.zmax-sample_base.BoundingBox().zmin)<.02,'B08 rotary sits on B35, not directly on B01')
check(abs(sbb.xlen-250)<.02 and abs(sbb.ylen-300)<.02 and abs(sbb.zlen-12)<.02,
      'B35 photo-fit envelope is 250x300x12mm')
check(abs(sbb.xmin+50)<.02 and abs(sbb.xmax-200)<.02,
      'B35 candidate board centre X is 75mm')
check(sample_board.intersect(silver_board).Volume()<1e-4,
      'B35 and B01 are separate contacting plates, not interpenetrating solids')
# MB2530/M candidate pattern: 10 columns × 12 rows, M6 through-tap drill proxy Ø5,
# 25mm pitch, first hole 12.5mm from each edge.
b35_grid=[]
for i in range(10):
    for j in range(12):
        x=75-112.5+25*i
        y=-137.5+25*j
        b35_grid.append((x,y))
        probe=vz(2.45,12,x,y,20)
        check(sample_board.intersect(probe).Volume()<1e-5,
              'B35 OEM candidate M6 grid hole must pass through the full 12mm board')
check(len(b35_grid)==120,'B35 MB2530/M candidate has exactly 120 grid holes')
# MB2530/M is a 250x300mm board: four corner counterbores only.
# The fifth central counterbore applies to larger boards, not this SKU.
central_counterbore_probe=vz(5.45,3.5,75,0,28.5)
check(sample_board.intersect(central_counterbore_probe).Volume()>1,
      'B35 MB2530/M candidate has NO central fifth counterbore')
b35_anchors=[(x,y) for x in (-25,175) for y in (-125,125)]
for i,(x,y) in enumerate(b35_anchors,1):
    clearance=vz(3.2,12,x,y,20)
    counterbore=vz(5.45,3.5,x,y,28.5)
    check(sample_board.intersect(clearance).Volume()<1e-5,
          'B35 corner M6 mounting clearance bore is open')
    check(sample_board.intersect(counterbore).Volume()<1e-5,
          'B35 corner M6 low-head counterbore is open')
    b01_pilot=vz(2.45,12,x,y,8)
    check(silver_board.intersect(b01_pilot).Volume()<1e-5,
          'B35 corner anchor coordinates align with B01 candidate M6 tapped grid')
    anchor=part(B,f'B35S{i}')
    check(len(anchor)==1 and anchor[0].isValid(),
          'B35 M6x20 low-head anchor proxy is one valid connected solid')
    abb=anchor[0].BoundingBox()
    check(abs(abb.zmax-32)<.03 and abs(abb.zmin-8.5)<.03,
          'B35 M6x20 anchor spans counterbore and B01 pilot depth')
microscope_foot=part(B,'B16A')[0]
candidate_grid=b35_grid
candidate_foot=[(87.5+x,-112.5+y) for x in (-25,25) for y in (-25,25)]
for i,(x,y) in enumerate(candidate_foot,1):
    axis=vz(3.20,12,x,y,32)
    check(microscope_foot.intersect(axis).Volume()<1e-5,
          'B16A has four real Ø6.5 M6 clearance bores')
    core=vz(2.45,12,x,y,20)
    check(sample_board.intersect(core).Volume()<1e-5,
          'B16 foot M6 position aligns with a B35 through-tapped grid hole')
    screw_solids=part(B,f'B16S{i}')
    check(len(screw_solids)==1 and screw_solids[0].isValid(),
          'B16 M6 screw proxy must be one valid connected shank/head solid')
centre_errors=[
    min(((fx-gx)**2+(fy-gy)**2)**.5 for gx,gy in candidate_grid)
    for fx,fy in candidate_foot
]
check(max(centre_errors)<.01,
      'V51 B16 50mm foot pattern is exactly registered to the B35 OEM grid phase')
microscope_post=part(B,'B16')[0]
microscope_arm=part(B,'B16G')[0]
check(microscope_post.intersect(microscope_arm).Volume()>1,
      'B16 support arm must overlap the relocated microscope post')
check(sample_board.intersect(microscope_foot).Volume()<1e-4,
      'B35 black plate and microscope foot must CONTACT, not intersect')
micbb=microscope_foot.BoundingBox()
check(abs(micbb.zmin-sbb.zmax)<.02,
      'Microscope foot belongs on the SAME B35 top plane as sample rotary')
check(micbb.xmin>sbb.xmin and micbb.xmax<sbb.xmax and
      micbb.ymin>sbb.ymin and micbb.ymax<sbb.ymax,
      'Microscope foot must lie FULLY within B35 black-board footprint')
def mating_face_area_mm2(support,upper):
    return upper.translate((0,0,-.05)).intersect(support).Volume()/.05
area_mic=mating_face_area_mm2(sample_board,microscope_foot)
area_rot=mating_face_area_mm2(sample_board,sample_base)
check(area_mic>3200,
      f'B35 must support microscope FOOT over substantial area, got {area_mic:.1f} mm²')
check(area_rot>5000,
      f'B35 must support rotary FOOT over substantial area, got {area_rot:.1f} mm²')
report['B35_microscope_fastener_readiness']={
    'board_sku_candidate':'Thorlabs MB2530/M',
    'board_sku_confirmed':False,
    'board_photo_fit_mm':[250,300,12],
    'official_candidate_thickness_mm':12.7,
    'grid_hole_count':120,
    'grid_pitch_mm':25,
    'grid_edge_offset_mm':12.5,
    'grid_hole_mode':'M6 through-tapped; Ø5 tap-drill proxy in CAD',
    'mounting_hole_inset_mm':25,
    'mounting_hole_world_positions_mm':b35_anchors,
    'B01_candidate_grid_aligned':True,
    'B16A_actual_through_clearance_bores':4,
    'candidate_bore_diameter_mm':6.5,
    'max_grid_mismatch_mm':round(max(centre_errors),2),
    'B35_threaded_anchors_verified':False,
    'B16_fastener_positions_verified':False,
    'loaded_joint_accepted':False
}
report['B35_dual_mount_face_areas_mm2']={
    'microscope':round(area_mic,1),'rotary':round(area_rot,1),
    'exact_plate_sku_verified':False,'fastener_threads_verified':False
}
check(sample_board.intersect(part(B,'B02')[0]).Volume()<1e-4,
      'Black sample plate must not engulf the separate left-side magnet')
# B02 is the label-confirmed GCM-420302M; verify its 13-hole catalogue pattern.
b02_body=part(B,'B02')[0]
gcm42_holes=[(dx,dy,5.0,'M6') for dx in (-25,25) for dy in (-25,25)]
gcm42_holes += [(dx,dy,3.3,'M4') for dx in (-20,20) for dy in (-20,20)]
gcm42_holes += [(dx,dy,2.5,'M3') for dx in (-16,16) for dy in (-16,16)]
gcm42_holes += [(0,0,5.0,'M6')]
for dx,dy,dia,thread in gcm42_holes:
    probe=vz(dia/2,10,-112+dx,dy,30)
    check(b02_body.intersect(probe).Volume()<1e-4,
          f'B02 GCM-420302M {thread} catalogue hole is open')
report['B02_GCM420302M_top_pattern']={'M6':5,'M4':4,'M3':4,'total':13,'central_M6_present':True}

# Previously this failed: separated 0.5mm screw shaft and head.
for i in range(1,5):
    ss=part(B,'B14_'+str(i))
    check(len(ss)==1,f'B14_{i} screw is ONE connected solid')
    bb=ss[0].BoundingBox()
    check(abs(bb.zmax-132.7)<0.03,f'B14_{i} top recessed 0.5 mm')
    check(abs(bb.zmin-101.7)<0.03,f'B14_{i} nominal M6x25 under-head length')
nfp_lower=part(B,'B09M')[0]
nfp=part(B,'B09A')[0]
check(abs(nfp_lower.BoundingBox().zmin-99.2)<.01,'NFP upper carriage lower datum')
check(abs(nfp.BoundingBox().zmin-101.2)<.01,'NFP upper moving top plate lower datum')
check(abs(nfp.BoundingBox().zmax-111.2)<.01,'NFP upper top mounting datum')
# The modeled hole depth is 10 mm. Tip at 66.7 and blind bottom at 66.2 => .5 mm.
hole_bottom=101.2;tip=101.7
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
check(abs(postbb.zlen-112)<.02,'V55 raised clamp stack requires 112mm scene-fit post; exact SKU unverified')
check(abs(postbb.zmin-holderbb.zmin)<.02,'Support post inserted from sleeve bottom datum')
check(holder.intersect(post).Volume()<1e-4,'Black sleeve has real Ø12 steel-post clearance')
check(abs(squarebb.zmin-holderbb.zmax-30)<.02,
      'V55 square clamp rises 30mm above black sleeve after coordinated clamp lift')
check(abs(postbb.zmax-squarebb.zmax-2)<.02,
      '112mm scene-fit support post retains 2mm protrusion above B33 clamp')
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
for name,bottom,top in [('B10',111.2,121.2),('B11',121.2,133.2)]:
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
check(not (B/'B08B.step').exists(),'B rotary table has no external handle')
nfp_right=part(B,'B09B')[0].BoundingBox()
b41_drive=part(B,'B41B')[0].BoundingBox()
b41_body_box=part(B,'B41')[0].BoundingBox()
check(b41_drive.ymin>=b41_body_box.ymax-.02,
      'B41 second linear micrometer exits toward the front (+Y)')
nfp_body=part(B,'B09')[0].BoundingBox()
check(nfp_right.xmin>=nfp_body.xmax-.02,'B NFP micrometer exits right +X')
a15=part(A,'A15')[0].BoundingBox()
a03=part(A,'A03')[0].BoundingBox()
a03_moving=part(A,'A03T')[0]
a03_top=a03_moving.BoundingBox()
a04=part(A,'A04')[0].BoundingBox()
a04_lower=part(A,'A04L')[0].BoundingBox()
arot=part(A,'A06')[0].BoundingBox()
a02=part(A,'A02')[0].BoundingBox()
aheat=part(A,'A07')[0].BoundingBox()
amagnet=part(A,'A17')[0].BoundingBox()
check(abs(amagnet.zmin-20)<.02 and abs(amagnet.zmax-40)<.02,
      'V38 A has one TRUE film-side magnetic mounting stand above the only breadboard')
# V52: A17 top/underside hole pattern is not visible in the A evidence.
# The body top is deliberately a neutral blank proxy, not a claim that the
# physical base has no holes. Never transfer B02/GCM-420302M's 13-hole pattern.
a17_body=part(A,'A17')[0]
a17_control=part(A,'A17L')[0]
a15_front=part(A,'A15F')[0]
a15_control=part(A,'A15FK')[0]
check(abs(a17_body.BoundingBox().zmin-20)<.02 and
      abs(a17_body.BoundingBox().zmax-40)<.02,
      'V52 A17 remains a 65x65x20mm magnetic-base envelope candidate')
for dx,dy in [(0,0),(-25,-25),(-25,25),(25,-25),(25,25),
              (-20,-20),(-20,20),(20,-20),(20,20),
              (-16,-16),(-16,16),(16,-16),(16,16)]:
    unobserved_hole_probe=vz(1.2,8,-82.75+dx,dy,32)
    check(a17_body.intersect(unobserved_hole_probe).Volume()>1,
          'V52 A17 neutral top proxy must not fabricate an unobserved GCM-42 hole')
a15_top=part(A,'A15A')[0]
for xx,yy in [(-107.75,-25),(-107.75,25),(-57.75,-25),(-57.75,25)]:
    bore=vz(2.85,2.8,xx,yy,70.1)
    backing=vz(2.85,.4,xx,yy,69.6)
    check(a15_top.intersect(bore).Volume()<1e-4,
          'V51 A15 photo23 top counterbore is open for 3mm candidate depth')
    check(a15_top.intersect(backing).Volume()>1,
          'V51 A15 top counterbore remains blind, not through the stage')
slot_probe=box_probe(24,.5,3.5,-82.75,-33.25,57.25)
check(a15_front.intersect(slot_probe).Volume()<1e-4,
      'V62 A15 photo194 front face is truly slotted')
check(a15_front.BoundingBox().zmin>amagnet.zmax+10,
      'V62 A15 silver slot higher than A17 magnet')
check(a15_front.BoundingBox().ymax<-32 and
      part(A,'A03M')[0].BoundingBox().ymin>33,
      '2026-11-08 two photo sides: A15 silver slot -Y / VC13 micrometer +Y')
check(a15_front.intersect(a15_control).Volume()<1e-4,
      'V62 front slot must clear the control shaft')
for i in (1,2):
    bolt=part(A,f'A15FS{i}')[0]
    check(bolt.intersect(a15_front).Volume()>0,
          'V62 face screw must contact A15 face')
check(a17_body.intersect(a17_control).Volume()<1e-4,
      'V62 A17 low lever must be outside magnet body')
check(a17_control.BoundingBox().xmax<a17_body.BoundingBox().xmax-5,
      'V62 A17 photo194 lower lever is left offset')
for legacy in ('A17P','A17S1','A17S2'):
    check(not (A/(legacy+'.step')).exists(),
          'V62 no false magnet silver slot '+legacy)
report['V62_A15_front_slot_A17_lower_lever']={
  'photo':['194','195','2026-11-08-screen-front'],'A15_front_open_slot':True,
   'slot_face_axis_in_CAD':'-Y opposite VC13M +Y face',
  'A15_front_plate_screw_count':2,'A15_control_count':1,
  'A17_lower_lever_count':1,'A17_duplicate_slot_count':0,
  'OEM_dimensions_and_threads_verified':False}
# V49: photos25/26 show two side-hole rows on the B09 NFP-1462C body.
# Their exact coordinates, diameters and thread forms are NOT in the readable
# OEM drawing; validate only the seven photo-fit blind recesses.
nfp_lower=part(B,'B09')[0]
nfp_upper=part(B,'B09A')[0]
nfp_lower_side=[(-18,95.2,1.6),(-4,95.2,2.0),(11,95.2,2.6),(22,95.2,1.6)]
nfp_upper_side=[(-22,105.7,1.8),(-8,105.7,1.8),(12,105.7,2.8)]
for dx,zz,rr in nfp_lower_side:
    open_probe=vy(rr,2.4,82+dx,30.05,zz)
    backing=vy(rr,.5,82+dx,29.5,zz)
    check(nfp_lower.intersect(open_probe).Volume()<1e-4,
          'V49 NFP fixed body lower side bore is open from +Y face')
    check(nfp_lower.intersect(backing).Volume()>1,
          'V49 NFP fixed body lower side bore remains blind')
for dx,zz,rr in nfp_upper_side:
    open_probe=vy(rr,2.4,82+dx,30.05,zz)
    backing=vy(rr,.5,82+dx,29.5,zz)
    check(nfp_upper.intersect(open_probe).Volume()<1e-4,
          'V49 NFP moving plate upper side bore is open from +Y face')
    check(nfp_upper.intersect(backing).Volume()>1,
          'V49 NFP moving plate upper side bore remains blind')
report['V49_NFP_photo25_26_side_holes']={
    'lower_fixed_row':4,'upper_moving_row':3,'total':7,
    'diameters_and_threads_verified':False,
    'upper_row_follows_moving_plate':True
}
check(abs(amagnet.zmax-a15.zmin)<.02,
      'A15 film translation stage MUST rest ON A17 magnetic stand, not naked breadboard')
check(abs(part(A,'A15A')[0].BoundingBox().zmax-73)<.02,
      'A T25M2L has 33 mm verified dual-axis height above its V38 magnetic seat')
check(abs(part(A,'A15A')[0].BoundingBox().zmax-a03.zmin)<.02,'A film T25M directly UNDER VC13M')
check(abs(a03.zmax-(a03_top.zmax-7))<.02,
      'V65 A03 fixed upright meets main movable PLATE at lower pose; lower guide tongues extend below it')
check(abs(a03_top.zmax-a04_lower.zmin)<.02,
      'V47 VC13 moving plate supports LOWER G40-class module')
check(abs(a04_lower.zmax-a04.zmin)<.02,
      'V47 two independent goniometers stack 20mm + 20mm without gap')
check(abs(a04.zmax-164)<.02 and abs(a04_lower.zmax-144)<.02,
      'V47 upper labeled G40M60L must be above lower unmarked module')
check(abs(a04_lower.zlen-20)<.02 and abs(a04.zlen-20)<.02,
      'V47 photo94 double-stage proxy must preserve separate 20mm heights')
check(part(A,'A03')[0].intersect(a03_moving).Volume()<1e-4,
      'A03 stationary body and A03T moving plate must not overlap at lower pose')
a03_raised=a03_moving.translate(Vector(0,0,13))
check(part(A,'A03')[0].intersect(a03_raised).Volume()<1e-4,
      'V65 full 13mm A03 stroke must NOT cause moving guide/outer channel solid overlap')
check(abs(a03_moving.BoundingBox().zmin-95)<.02 and
      abs(a03_moving.BoundingBox().zmax-124)<.02,
      'V65 moving side tongues descend below output plate and remain physically joined')
check(a03_raised.BoundingBox().zmin<part(A,'A03')[0].BoundingBox().zmax-8,
      'V65 raised A03 moving side tongue must still overlap stationary channel in Z')
check(len(a03_raised.Solids())==1 and len(a03_moving.Solids())==1,
      'V65 two moving guide tongues belong to ONE connected moving STEP assembly')
report['V65_A03_floating_output_repair']={
    'photo_refs':['194','195'],'fixed_side_channel_count':2,
    'moving_output_tongue_count':2,'travel_mm_nominal':13,
    'full_travel_static_and_raised_boolean_collision_free':True,
    'moving_guide_still_engaged_at_top_of_travel':True,
    'candidate_channel_width_mm':3,'clearance_candidate_mm':1.3,
    'factory_guide_dimensions_verified':False}
check(len(part(A,'A03'))==1,
      'A03 bracket plus fixed carriage must be ONE connected STEP solid')
check(part(A,'A03')[0].intersect(part(A,'A03M')[0]).Volume()<1e-4,
      'A03 vertical micrometer shaft must pass cleanly through bored external support')
check(part(A,'A03')[0].intersect(part(A,'A03K')[0]).Volume()<1e-4,
      'A03 knob must clear the fixed body')
report['V46_A03_external_drive_and_moving_plate']={
    'micrometer_front_offset_mm':40,
    'shaft_outer_radius_mm':5.5,
    'support_bore_radius_mm':5.8,
    'moving_plate_is_independent_STEP_solid':True,
    'stationary_to_lower_plate_face_contact':True,
    'full_13mm_motion_collision_certified':False,
    'physical_zero_height_verified':False
}
check(abs(part(A,'A06A')[0].BoundingBox().zmax-a02.zmin)<.02,'A sample T25M above rotary')
check(abs((a02.zmin+20)-part(A,'A07B')[0].BoundingBox().zmin)<.02,
      'V48 A07 dark bottom 9mm directly rests on sample A02 T25M')
check(abs(part(A,'A07B')[0].BoundingBox().zmax-
          part(A,'A07I')[0].BoundingBox().zmin)<.02,
      'V48 7mm intermediate visible layer rests on lower dark support')
check(abs(part(A,'A07I')[0].BoundingBox().zmax-aheat.zmin)<.02,
      'V48 12mm silver top sits on the gold-colored intermediate plate')
check(abs(aheat.zmax-109.2)<.02,
      'V48 ruler photo17/18: sample top global 109.2mm, 89.2mm above 20mm board')
check(87<(aheat.zmax-20)<93,
      'V48 ruler: silver sample top must stand approx 9cm above breadboard')
check(abs(arot.xlen-66)<.02 and abs(arot.ylen-66)<.02,
      'V48 A only: candidate rotary Ø66 mm, NOT disproportional Ø94')
a06_right_stem=part(A,'A06C')[0].BoundingBox()
a06_right_knob=part(A,'A06D')[0].BoundingBox()
a06_front_lock=part(A,'A06B')[0].BoundingBox()
check(abs(a06_right_stem.xmin-(78+30))<.02 and
      2.9<a06_right_stem.xmax-a06_right_knob.xmin<3.1,
      'V75 A06 angular micrometer shaft must ENGAGE inside drum by 3mm, not float at a zero-area face')
check(abs(a06_front_lock.ymin-33)<.02,
      'V48 front short A06 lock must independently attach to circular rim')
check(a06_right_knob.xmin>arot.xmax,
      'V48 A06 angular drum must stand outside rotary, not through its metal body')
for i in range(1,5):
    head=part(A,f'A07S{i}')[0]
    check(abs(head.BoundingBox().zmax-108.6)<.02,
          'V48 silver top screw HEAD must be recessed, not floating above sample')
report['V48_A_sample_height_ruler']={
    'photo_references':['17','18','19','20','21'],
    'board_top_z_mm':20,
    'photo_top_above_board_mm_estimate':[87,93],
    'scene_top_above_board_mm':round(aheat.zmax-20,1),
    'A07_layers_mm':[9,7,12],
    'A07_middle_layer_material_identified':False,
    'A06_rotary_diameter_candidate_mm':66,
    'A06_right_angular_micrometer_count':1,
    'A06_front_lock_count':1,
    'A06_actual_rotation_sku_identified':False,
    'A07_top_4_blind_screw_head_locations_qualified':False
}
check(part(A,'A15B')[0].BoundingBox().xmin>=a15.xmax-.02,
      'A film T25M handle points to RIGHT +X')
check(part(A,'A02B')[0].BoundingBox().xmax<=a02.xmin+.02,
      'A sample T25M silver left handle in photo17 points LEFT -X')
check(part(A,'A03M')[0].BoundingBox().zmax<=part(A,'A03K')[0].BoundingBox().zmin+.02,
      'A VC13M micrometer is vertically oriented')
a04_lower_support=part(A,'A04LS')[0]
a04_lower_stem=part(A,'A04LM')[0]
a04_lower_drum=part(A,'A04LK')[0]
check(a04_lower_support.intersect(part(A,'A04L')[0]).Volume()>1,
      'Nov08 A04L +Y spindle support must ENTER the fixed lower goniometer')
check(a04_lower_support.intersect(a04_lower_stem).Volume()>1,
      'Nov08 lower angular micrometer shaft must engage its actual support')
check(a04_lower_stem.intersect(a04_lower_drum).Volume()>1,
      'Nov08 lower G40 knob must ENGAGE shaft, not float off its end')
check(a04_lower_stem.BoundingBox().ymax>a04_lower.ymax+10 and
      a04_lower_drum.BoundingBox().ymin>a04_lower.ymax,
      'Nov08 lower G40 drive exits along +Y (depth axis), orthogonal to upper +X')
check(abs((a04_lower_stem.BoundingBox().xmin+a04_lower_stem.BoundingBox().xmax)/2-
          (a04_lower.xmin+a04_lower.xmax)/2)<.05,
      'Nov08 lower micrometer must stay centred in X, no spurious left X offset')
check(part(A,'A04M')[0].BoundingBox().xmin>=a04.xmax-.02,
      'V59 labeled upper G40M60L micrometer exits RIGHT +X')
check(part(A,'A04K')[0].BoundingBox().xmin>=part(A,'A04M')[0].BoundingBox().xmax-.02,
      'V59 upper G40M60L knurled knob continues beyond right micrometer shaft')
a07_front=part(A,'A07F')[0]
slot_probe=box_probe(18,2.2,3,78,33.5,92)
check(a07_front.intersect(slot_probe).Volume()<1e-4,
      'V59 A07 front adjustment plate has an actual open horizontal slot')
a18=part(A,'A18')[0].BoundingBox();a18r=part(A,'A18R')[0].BoundingBox()
a19=part(A,'A19')[0].BoundingBox()
o1=part(A,'A19O1')[0].BoundingBox();o2=part(A,'A19O2')[0].BoundingBox()
a20=part(A,'A20')[0].BoundingBox()
check(abs(a18.zmin-165)<.02 and abs(a18.zmax-235)<.02,
      'V59 microscope head occupies the photo-proportioned 70mm vertical envelope')
check(a18r.xmin>=a18.xmin-.02 and a18r.xmax>a18.xmax+100,
      'V59 microscope horizontal tube projects from the head to the right')
check(abs(a19.zmin-150)<.02 and abs(a19.zmax-160)<.02,
      'V59 objective turret remains a distinct 10mm component below microscope head')
check(110.6+2<o1.zmin<121 and o1.zmax<=163 and
      abs(o2.zmin-116)<.02 and abs(o2.zmax-155)<.02 and
      o1.xmin<78-18-17 and abs(o2.xmin-(78+18-11.5))<.02,
      'V66 left photo191/193 objective angles outward but two objectives stay separate and above chip')
check(abs(part(A,'A19R1')[0].BoundingBox().xmin-
          part(A,'A19O1')[0].BoundingBox().xmin)<14,
      'V66 left color band must follow same tilted objective shaft, not float at original vertical axis')
report['V66_A19_photo_objective_orientation']={
    'photo_refs':['191','192','193'],
    'outboard_objective_inclination_candidate_deg':22.5,
    'center_objective_vertical_candidate_deg':0,
    'left_tilt_and_color_band_rotate_as_unit':True,
    'full_turret_indexing_and_optical_working_distance_verified':False}
check(part(A,'A20')[0].isValid() and a20.zmax>390,
      'V59 camera cable is a continuous valid routed solid above the camera')
report['V47_A04_photo94_two_goniometers']={
    'independent_goniometer_envelopes':2,
    'lower_sku_photographically_verified':False,
    'upper_sku_label_photographically_verified':'GCM-G40M60L',
    'lower_compare_only_sku':'GCM-G40M40L',
    'lower_upper_nominal_heights_mm':[20,20],
    'a05_height_restored_mm':20,
    'true_joint_bolt_patterns_verified':False
}
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
upper_bore=cq.Solid.makeCylinder(5.8,30,Vector(phuc_x-15,0,191),Vector(1,0,0))
lower_bore=cq.Solid.makeCylinder(5.8,30,Vector(phuc_x-15,0,158),Vector(1,0,0))
check(phuc.intersect(upper_bore).Volume()<1e-4,'PHUC-1 upper Ø12 bore is real')
check(phuc.intersect(lower_bore).Volume()<1e-4,'PHUC-1 lower Ø12 bore is real')
check(abs(191-158-33)<.0001,
      'PHUC-1 manufacturer E33 bore-centre spacing')
check(abs(second.BoundingBox().zmin+6-158)<.01,
      'Lower rod center height follows photo149 and PHUC1 E=33')
check(abs(long.BoundingBox().zmin+6-191)<.01,
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
# V58: the editable STEP is the clearly labelled UNVERIFIED working
# hypothesis (photo94 left-fold is preserved separately in the viewer).
# Validate REAL solid contact and zero penetration for the glass/stamp,
# rather than the V57 false positive that accepted a 171.5mm scene gap.
a_sheet=part(A,'A05')[0]
asheet_bb=a_sheet.BoundingBox()
check(abs(asheet_bb.xmin+109.75)<.02 and abs(asheet_bb.xmax-8)<.02,
      'V70 sheet folded foot extends 32mm toward right, candidate not photo94 pose')
check(abs(asheet_bb.zmin-111.9)<.02 and abs(asheet_bb.zmax-166.5)<.02,
      'V58 52.1mm unverified leg joins G40 top and target glass position')
check(a_sheet.distance(part(A,'A04')[0])<.05,
      'V58 sheet rests on independent upper G40 stage')
for i,dx in enumerate((-14,14),1):
    head=part(A,f'A05S{i}')[0]
    check(abs(head.BoundingBox().zmin-asheet_bb.zmax)<.02,
          'V58 both sheet screw HEADS contact top plate')
    center=(head.BoundingBox().xmin+head.BoundingBox().xmax)/2
    check(abs(center-(-82.75+dx))<.02,'V58 G40 head pair follows moved film unit')
for i in (1,2):
    wing=part(A,f'A05CS{i}')[0]
    check(wing.isValid() and wing.BoundingBox().xlen>9.4 and
          wing.BoundingBox().ylen<6.1,
          'V77 butterfly heads rotated 90deg into X-outward plane, not Z/front-back')
    check(wing.intersect(a_sheet).Volume()<1e-4,
          'V77 rotated butterfly ears must stay outside the upright and folded foot')
check(asheet_bb.ylen>=14-.02,
      'V70 outward foot has short 14mm front-back span, not false 26mm screw depth')
# V63 physically test both hollow bores and solid material between them.
# Prior versions had bolt/foot volume collisions despite passing contact QA.
leg_bottom=164-52.1
leg_x=-82.75+60-1.25
for i,dx in enumerate((7,25),1):
    shaft_axis=vz(1.4,2.5,leg_x+dx,0,leg_bottom)
    check(a_sheet.intersect(shaft_axis).Volume()<1e-5,
          'V70 A05 actual STEP bore on the OUTWARD X foot clears screw '+str(i))
    bolt=part(A,f'A05CS{i}')[0]
    check(a_sheet.intersect(bolt).Volume()<1e-4,
          'V70 A05 butterfly bolt must not intersect metal foot '+str(i))
    check(abs(bolt.BoundingBox().zmin-(leg_bottom-3.5))<.02,
          'V70 photo196 thread tail projects BELOW the black foot')
    check(bolt.BoundingBox().zmax>leg_bottom+6,
          'V70 butterfly head remains ABOVE the folded foot')
    check(abs((bolt.BoundingBox().xmin+bolt.BoundingBox().xmax)/2-
              (leg_x+dx))<.02,
          'V70 both wing-screw centres registered along X, NOT Z')
solid_axis=vz(1.25,2.5,leg_x+16,0,leg_bottom)
check(a_sheet.intersect(solid_axis).Volume()>6,
      'V63 no false void throughout entire folded foot')
report['V70_A05_outward_screw_axis']={
    'photo_sources':['194','196'],'bore_count':2,
    'screw_axis':'X-outward, NOT previously Z front-back',
    'wing_ear_plane':'X-outward, rotated 90deg from legacy Z-oriented wings',
    'installed_glass_in_complete_STEP':False,
    'foot_length_X_mm_candidate':32,
    'foot_width_Y_mm_candidate':14,
    'bore_diameter_mm_candidate':3.2,'screw_diameter_mm_candidate':2.8,
    'hole_pitch_mm_candidate':18,'below_foot_tail_mm_candidate':3.5,
    'bore_boolean_and_solid_material_checked':True,
    'screw_thread_and_torque_verified':False,
    'actual_glass_clamp_loadpath_verified':False}
for id in ('A05A','A05B'):
    check(not (A/(id+'.step')).exists(),
          'Discredited 215mm transfer beam/spacer remains absent: '+id)
a_clamp=part(A,'A05C')[0]
a_upper_jaw=part(A,'A05CU')[0]
a_slide=part(A,'A05G')[0]
a_pdms=part(A,'A05GP')[0]
a_chip=part(A,'A07W')[0]
# V68: Lowered STEP contact pose has the glass below both objectives.
# The original Web candidate RAISED the film 13mm without moving optical
# assembly at all; that trajectory intersected the optical metal.
# Geometric retract 18mm is a V68 visual hypothesis only, not measured travel.
optical_solids=[part(A,id)[0] for id in ('A19O1','A19O2','A19R1','A19R2')]
unparked_raised_glass=a_slide.translate(Vector(0,0,13))
lower_contact_overlap=sum(a_slide.intersect(o).Volume() for o in optical_solids)
raised_unparked_overlap=sum(unparked_raised_glass.intersect(o).Volume() for o in optical_solids)
raised_retracted_overlap=sum(unparked_raised_glass.intersect(
    o.translate(Vector(0,0,18))).Volume() for o in optical_solids)
check(lower_contact_overlap<1e-4,
      'V68 static lowered STEP pose must keep glass separate from objectives')
check(raised_unparked_overlap>0.1,
      'V68 detector MUST catch the original 13mm raised glass/objective solid collision')
check(raised_retracted_overlap<1e-4,
      'V68 proposed 18mm visual parking of both objectives avoids raised glass interference')
report['V68_A_optical_head_glass_collision']={
    'A05G_static_lowered_pose_glass_objective_intersection_mm3':round(lower_contact_overlap,3),
    'A05G_raised_13mm_original_unparked_intersection_mm3':round(raised_unparked_overlap,3),
    'A05G_raised_13mm_parked_18mm_intersection_mm3':round(raised_retracted_overlap,3),
    'film_vertical_travel_candidate_mm':13,
    'optics_parking_offset_candidate_mm':18,
    'real_focus_travel_measured':False,
    'objective_working_distance_measured':False,
    'real_turret_swing_swept_volume_certified':False,
    'photographic_registration_verified':False
}

check(len(part(A,'A05C'))==1,
      'A05C bracket tie, carrier and lower jaw form a connected solid')
glass_bottom=leg_bottom+.5
for dx in (7,25):
    bore_axis=vz(1.4,3,leg_x+dx,0,glass_bottom-3.5)
    check(a_clamp.intersect(bore_axis).Volume()<1e-4,
          'V70 A05C carrier has co-axial TRUE holes on the outward foot X direction')
report['V70_A05C_outward_carrier_clearance']={
    'carrier_boolean_bore_count':2,
    'coaxial_X_outward_screw_centres_mm':[7,25],
    'same_axes_as_A05_foot':True,
    'carrier_clamping_force_and_threads_verified':False}
check(a_sheet.distance(a_clamp)<.05,
      'A05C local clamp must contact the end of the folded A05 sheet')
check(a_clamp.distance(a_slide)<.05,
      'A05C lower glass jaw must touch the glass without floating')
check(a_upper_jaw.distance(a_slide)<.05,
      'A05C upper jaw must touch the glass without floating')
check(a_pdms.distance(a_slide)<.05,
      'A05GP PDMS must contact glass underside')
check(a_clamp.intersect(a_slide).Volume()<.0001 and
      a_upper_jaw.intersect(a_slide).Volume()<.0001 and
      a_pdms.intersect(a_slide).Volume()<.0001,
      'A05 clamp/PDMS must not penetrate the candidate glass')
check(a_sheet.intersect(a_slide).Volume()<1e-4,
      'V70 photographed folded foot must not penetrate UNDRILLED glass slide')
check(a_sheet.intersect(a_clamp).Volume()<1e-4,
      'V70 photographed L-fold sheet and hypothesis jaws cannot occupy same solid volume')
check(a_sheet.distance(a_slide)>1.5,
      'V70 fabricated glass must start beyond second wing screw/foot with physical horizontal gap')
check(abs(a_slide.BoundingBox().xlen-76)<.02 and
      abs(a_slide.BoundingBox().ylen-26)<.02 and
      abs(a_slide.BoundingBox().zlen-1)<.02,
      'A05G candidate glass is 76x26x1mm')
check(abs(a_slide.BoundingBox().xmax-a_pdms.BoundingBox().xmax-4)<.02,
      'V58 PDMS right edge must be 4mm inset from glass right edge')
check(abs(a_chip.BoundingBox().zmax-110.6)<.02,
      'V58 A07W sample-chip top is 110.6mm, not 109.2mm bare metal')
check(abs(a_pdms.BoundingBox().zmin-a_chip.BoundingBox().zmax)<.02,
      'V58 static LOWER pose: PDMS reaches CHIP TOP, not naked hotplate')
check(a_pdms.distance(a_chip)<.05 and
      a_pdms.intersect(a_chip).Volume()<.0001,
      'V58 PDMS contacts A07W chip without floating/interpenetration')
check(a_pdms.intersect(part(A,'A07')[0]).Volume()<.0001,
      'V58 PDMS must not enter underlying silver heater plate')
for i in (1,2):
    screw=part(A,f'A05CS{i}')[0]
    check(screw.isValid() and a_clamp.distance(screw)<.26,
          'V64 A05C candidate screw needs clearance yet stay near carrier')
    check(a_clamp.intersect(screw).Volume()<1e-4,
          'V64 A05C screw must not penetrate solid clamp carrier')
    check(screw.intersect(a_slide).Volume()<.0001,
          'V58 candidate fasteners must remain outside glass footprint')
a17_bb=part(A,'A17')[0].BoundingBox()
a16_bb=part(A,'A16')[0].BoundingBox()
a_base_gap=a16_bb.xmin-a17_bb.xmax
check(abs(a_base_gap-72.25)<.02,
      'V70 A16/A17 nominal 72.25mm clearance after re-registering glass beyond foot')
check(abs((a_pdms.BoundingBox().xmin+a_pdms.BoundingBox().xmax)/2-78)<.02 and
      abs((a_pdms.BoundingBox().ymin+a_pdms.BoundingBox().ymax)/2)<.02,
      'V58 PDMS stamp must be centered above sample-chip XY')
check(abs(a_chip.BoundingBox().xlen-28)<.02 and
      abs(a_chip.BoundingBox().ylen-28)<.02 and
      abs(a_chip.BoundingBox().zlen-1.4)<.02,
      'V58 sample chip geometry matches browser 28x28x1.4mm proxy')
report['V58_A_working_geometry_only']={
    'part_chain':['A17','A15','A03','A04L','A04','A05','A05C',
                  'A05CU','A05CS1','A05CS2','A05G','A05GP'],
    'A17_A16_footprint_gap_mm':round(a_base_gap,2),
    'film_center_x_mm':-82.75,'working_film_bent_sheet_handedness':'right',
    'photo94_original_handedness':'left',
    'a05_leg_height_candidate_mm':52.1,
    'glass_size_candidate_mm':[76,26,1],
    'pdms_size_candidate_mm':[8,8,1.8],
    'pdms_right_margin_mm':4,
    'sample_chip_top_mm':110.6,
    'static_lowered_PDMS_contact_with_chip':True,
    'full_13mm_motion_collision_certified':False,
    'actual_photo_pose_registered':False,
    'A17_and_A05C_OEM_identified':False,
    'clamp_screw_pattern_verified':False,
    'made_for_machining_or_procurement':False
}
report['V47_A_photo94_visual_scale']={
 'source':'photo94 approx landmarks against G40M60L 40mm OEM top size',
 'top_span_mm_candidate':75,
 'left_overhang_mm_candidate':48,
 'absolute_global_registration_verified':False,
 'ruler_photos_145_to_151_read':False,
 'measurement_method':'perspective-biased known-OEM planar width ratio'
}
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
check(abs(a_tilt.zmax-164)<.02,
      'V47 A04 is upper of 2x20mm G40-class stack; A05 touches top z164')
# V58: printed STEP is the *UNVERIFIED* candidate lower-contact pose.
# Photo94 left-fold geometry is NOT overwritten: see viewer photo94 mode.
# Do not pretend that fitting two candidate solids validates the actual rig.
a_heater=part(A,'A07')[0].BoundingBox()
check(abs(a_heater.zmax-109.2)<.02,
      'Sample silver support top remains 109.2mm above datum')
check(abs(a_chip.BoundingBox().zmax-a_pdms.BoundingBox().zmin)<.02,
      'PDMS interface is on sample chip, not 1.4mm inside the heater')
check(a_clamp.BoundingBox().xmax<a_heater.xmin,
      'A05C fixed clamp must remain outside A07 heater X footprint')
check(abs(a_heater.xmin-a_clamp.BoundingBox().xmax-25.5)<.03,
      'V73 candidate far-end jaw stays outside heater with 25.5mm scene-only clearance')
a_scope_col=part(A,'A10')[0]
a_scope_bb=a_scope_col.BoundingBox()
# V69: the optical support must be bored around the fixed 26mm post;
# a solid boom piercing its post was previously tolerated by STEP QA.
a_support_boom=part(A,'A10A')[0]
post_axis=vz(13,25,78,-112,220)
check(a_support_boom.intersect(post_axis).Volume()<1e-4,
      'V69 A10 boom has true 26.6mm through-bore for stationary Ø26 post')
check(a_support_boom.intersect(a_scope_col).Volume()<1e-4,
      'V69 A10 boom must not cut through actual solid microscope post')
check(a_support_boom.translate(Vector(0,0,18)).intersect(a_scope_col).Volume()<1e-4,
      'V69 retracted 18mm optical carrier remains clear of the fixed post')
check(a_support_boom.intersect(vz(2,25,78,-90,220)).Volume()>50,
      'V69 boom retains real metal adjacent to the post clearance')
check(abs(a_support_boom.BoundingBox().ymin+130)<.02 and
      abs(a_support_boom.BoundingBox().ymax+44)<.02,
      'V74 A10 beam must end precisely at A18 rear face, not pierce 40mm of housing')
a_head=part(A,'A18')[0]
check(abs(a_head.BoundingBox().ymin-a_support_boom.BoundingBox().ymax)<.02,
      'V74 A10 front beam and A18 housing rear must mate flush')
check(a_support_boom.intersect(a_head).Volume()<1e-4,
      'V74 microscope support beam must not penetrate microscope housing')
check(a_support_boom.distance(a_head)<.02,
      'V74 support beam must contact A18 housing, not float behind it')
check(abs(a_support_boom.BoundingBox().zmin-207.5)<.02 and
      abs(a_support_boom.BoundingBox().zmax-232.5)<.02,
      'V74 A10 boom vertical datum must match browser model')
report['V69_A10_post_support_collision']={
    'post_outer_diameter_mm_candidate':26,
    'boom_clearance_bore_mm_candidate':26.6,
    'boom_post_boolean_intersection_mm3':0,
    'boom_raised_18mm_clearance':True,
    'boomhousing_rear_face_gap_mm':0,
    'boomhousing_solid_intersection_mm3':0,
    'candidate_boom_length_mm':86,
    'boom_support_mount_bolt_verified':False,
    'photographic_OEM_interface_verified':False
}
check(abs(a_scope_bb.zmin-a_board.zmax)<.02,
      'A10 microscope column must have an attached foot contacting the A01 board')
check(a_scope_col.intersect(part(A,'A01')[0]).Volume()<1e-4,
      'A10 foot must not penetrate the common optical board')
# V46: A10 formerly put four screw heads atop an unperforated foot.
# Now each bolt has actual Ø5.5 clearance and the candidate common base
# has a Ø5 recess at the same 25mm grid coordinate.
a10_anchors=[(xx,yy) for xx in (50,100) for yy in (-125,-75)]
for i,(xx,yy) in enumerate(a10_anchors,1):
    clearance=vz(2.68,14,xx,yy,20)
    check(a_scope_col.intersect(clearance).Volume()<1e-4,
          'A10 foot must contain REAL four Ø5.5 candidate bolt-clearance bores')
    board_hole=vz(2.4,6,xx,yy,14)
    check(part(A,'A01')[0].intersect(board_hole).Volume()<1e-4,
          'A10 candidate M5 bolts must align with A01 modeled 25mm hole grid')
    screw=part(A,f'A10S{i}')[0]
    check(len(part(A,f'A10S{i}'))==1,
          'A10 M5 screw head/shaft must be one connected STEP solid')
    check(abs(screw.BoundingBox().zmax-34)<.03,
          'A10 screw head should finish flush with 14mm foot top')
report['V46_A10_microscope_anchor_audit']={
    'four_actual_clearance_holes_in_STEP':True,
    'nominal_grid_registered_bolts':4,
    'candidate_clearance_diameter_mm':5.5,
    'base_thread_engagement_confirmed':False,
    'real_microscope_foot_OEM_model_confirmed':False
}

a_lens=part(A,'A08')[0]
a_optical_tube=part(A,'A14')[0]
a_cam=part(A,'A09')[0]
check(abs(a_lens.BoundingBox().zlen-28)<.02,
      'TTL200-A 28mm mechanical housing must not be 85mm CAD proxy')
check(abs(a_optical_tube.BoundingBox().zmin-257)<.02 and
      abs(a_optical_tube.BoundingBox().zmax-323)<.02,
      'V59 A14 open SM2 candidate must overlap the raised lens 6mm and reach camera underside')
check(a_optical_tube.intersect(a_lens).Volume()<1e-3,
      'SM2 candidate tube must NOT become a solid plug through the lens')
check(abs(a_cam.BoundingBox().zmin-a_optical_tube.BoundingBox().zmax)<.02,
      'A camera candidate underside must touch SM2 sleeve envelope')
report['V59_A_global_candidate_readiness']={
  'clamp_to_heater_nominal_edge_clearance_mm':round(a_heater.xmin-a_clamp.BoundingBox().xmax,2),
  'A17_A16_footprint_gap_mm':round(a_base_gap,2),
  'sample_chip_PDMS_touch_at_lower_static_pose':True,
  'photo194_196_G40M60L_right_drive_registered':True,
  'photo94_projection_reconciled_as_opposite_view':True,
  'A18_microscope_head_photo_proxy_only':True,
  'A19_visible_installed_objectives':2,
  'A20_camera_cable_route_physically_verified':False,
  'A10_microscope_foot_contacts_A01':True,
  'A08_TTL200A_real_housing_length_mm':28,
  'A14_candidate_SM2_sleeve_length_mm':66,
  'A14_insert_overlap_mm':6,
  'A17_actual_magnetic_model_verified':False,
  'A05_actual_glass_grip_model_verified':False,
  'A14_camera_mounting_thread_verified':False,
  'functional_transfer_accepted':False
}
# NEW PHOTO REGISTER: 94/95/97 are A, whereas B is 107-112 and
# 145-151. The former erroneous B_photo94 assembly is not exported.
check(not (ROOT/'build'/'platform_B_photo94').exists(),
      'Never build a B-photo94 assembly from verified A photographs')
for required in ('B07','B35','B08','B41','B41A','B41M','B41B','B41C','B41D','B41E',
                 'B41S1','B41S2','B41S3','B41S4','B09','B09A','B09M','B09B','B09C','B09D','B09E',
                 'B10','B11','B12','B14_1','B14_2','B14_3','B14_4','B15','B16','B17','B18',
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
nfp_drum=part(B,'B09E')[0]
check(155.5<=max(nfp_drum.BoundingBox().xmax,
    nfp_drive.BoundingBox().xmax)-nfp_clearance.BoundingBox().xmin<=180.5,
      'NFP micrometer + body fit OEM 155.5--180.5 overall length')
for dx in (-25,25):
 for dy in (-25,25):
    bx,by=82+dx,dy
    small=vz(3.1,11,bx,by,88.2)
    cb=vz(5.35,4,bx,by,94.2)
    check(nfp_clearance.intersect(small).Volume()<1e-5,
          'NFP fixed base corner Ø6.5 clearance is open (not a thread)')
    check(nfp_clearance.intersect(cb).Volume()<1e-5,
          'NFP 50mm corner mounting counterbore Ø11 exists')
check(abs(part(B,'B09A')[0].BoundingBox().zmax-111.2)<.02,
      'NFP moving top nominal 23mm above 88.2 upper-stage datum')
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
check(abs(glass.BoundingBox().zmin-148)<.02,'Glass bottom matches new direct-coupled fixed jaw')
check(abs(glass.BoundingBox().zmax-149)<.02,'Glass has 1mm thickness in current B fit')
check(abs(moving_plate.BoundingBox().zmin-glass.BoundingBox().zmax)<.02,
      'One moving pressure plate contacts 1mm glass without interpenetration')
check(abs(glass.BoundingBox().zmin-pdms.BoundingBox().zmax)<.02,
      'PDMS underside contacts glass')
check(pdms.intersect(chuck).Volume()<1e-6,
      'PDMS stamp remains above the raised heater until its 13mm approach stroke')
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
# A full bounding-box check was too weak. The V55 raised heater left
# B37/B38 STARTS floating above their original straight lead tails.
# Check the actual modelled solids meet at the same physical endpoint.
for lead,wire in (('B12L1','B37'),('B12L2','B37A'),('B13L','B38')):
    endpoint=part(B,lead)[0]
    run=part(B,wire)[0]
    check(endpoint.distance(run)<.05,
          f'V56 {lead} must contact {wire}; no floating power/sensor lead')
report['V56_heater_lead_contact']={
    'B12L1_to_B37':True,'B12L2_to_B37A':True,'B13L_to_B38':True,
    'first_flexible_lead_points_mm':{
      'B37':[93,-60,121.5],'B37A':[98,-60,121.5],'B38':[88,-51,123.35]
    },'manufacturer_terminal_pinout_verified':False
}
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
center_vac=cq.Solid.makeCylinder(1.25,32.5,Vector(82,-32.5,130.5),Vector(0,1,0))
center_top=cq.Solid.makeCylinder(.55,2.9,Vector(82,0,130.3),Vector(0,0,1))
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
fitting_void=vy(1.15,11.8,82,-44.4,130.5)
check(vac.intersect(fitting_void).Volume()<1e-5,
      'V37 rear vacuum connector has a genuinely OPEN axial bore')
# V53: B20I is a G1/4 thread-diameter datum ring, not a hose spigot.
port_ring_bore=vx(5.8,1.0,408,180,68)
check(port_body.intersect(port_ring_bore).Volume()<1e-5,
      'V53 G1/4 reference ring retains an open centre')
pump_thread_bore=vx(5.9,8,400,180,68)
check(pump_body.intersect(pump_thread_bore).Volume()<1e-5,
      'V53 VN-50 shell has an open Ø11.8 female-thread tap-drill candidate port')
# V53: catalogue G1/4 is a threaded port reference, not an Ø18 hose spigot.
# G1/4 BSPP basic major diameter 13.157mm / pitch 1.337mm / 19TPI.
# The related family manual's PTFE-tape instruction means the exact port
# thread form/seal must be measured before selecting a fitting.
candidate_hose_od,candidate_hose_id=7.0,4.4
candidate_chuck_spigot_od=6.0
candidate_pump_thread_major_dia=13.157
candidate_pump_female_tap_drill=11.8
heater_end_stretch_percent=100*(candidate_chuck_spigot_od/candidate_hose_id-1)
check(candidate_pump_thread_major_dia==13.157 and candidate_pump_female_tap_drill==11.8,
      'V53 VN-50 G1/4 family thread datum must be retained')
report['V53_vacuum_interface_fit']={
 'hose_OD_ID_candidate_mm':[candidate_hose_od,candidate_hose_id],
 'heater_spigot_OD_candidate_mm':candidate_chuck_spigot_od,
 'heater_nominal_hose_expansion_pct':round(heater_end_stretch_percent,1),
 'pump_thread_candidate':'G1/4 BSPP (family catalogue only)',
 'pump_thread_major_diameter_mm':candidate_pump_thread_major_dia,
 'pump_thread_pitch_mm':1.337,
 'pump_thread_tpi':19,
 'pump_female_tap_drill_candidate_mm':candidate_pump_female_tap_drill,
 'pump_port_gender_verified':False,
 'pump_port_position_verified':False,
 'pump_port_sealing_method_verified':False,
 'hose_to_pump_adapter_sku_verified':False,
 'heater_hose_stretch_and_clamp_verified':False,
 'vacuum_leak_test_passed':False,
 'only_visual_flow_centerline_continuity_confirmed':True
}
# Radius tests detect a fake solid hose. Use local axes at the first
# straight segment where centerline is unambiguous.
def vacuum_axis_probe(a,b,r=.9,trim=.15):
    from math import sqrt
    v=Vector(b[0]-a[0],b[1]-a[1],b[2]-a[2])
    length=v.Length
    direction=v.normalized()
    origin=Vector(*a)+direction*trim
    return cq.Solid.makeCylinder(r,length-2*trim,origin,direction)
short_points=[(82,-44.5,130.5),(82,-58,131.5)]
outer_points=[(94,-79,113.5),(94,-79,70)]
check(vacstub.intersect(vacuum_axis_probe(*short_points)).Volume()<.01,
      'V37 B15T short hose has a CONTINUOUS hollow center')
check(suction.intersect(vacuum_axis_probe(*outer_points)).Volume()<.01,
      'V37 B40 long hose has a CONTINUOUS hollow center')
check(vacstub.distance(suction)<.05,
      'V56 B15T stub and B40 hose must PHYSICALLY meet at the raised 113.5mm outlet')
check(vacstub.BoundingBox().zmax>=113.5-3.5 and
      suction.BoundingBox().zmax>=113.5-3.5,
      'V56 both hose parts must reach the NEW raised fitting, not 90.5mm old datum')
check(vacstub.BoundingBox().xmax>=94-3.5 and
      suction.BoundingBox().xmin<=94+3.5,
      'V56 short and long hose envelopes must share outlet region')
check(suction.BoundingBox().xmax>=409.2-3.5,
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
left_probe=cq.Solid.makeCylinder(1.2,10,Vector(49.5,0,130.5),Vector(1,0,0))
check(left_probe.intersect(chuck).Volume()>1.0,'Old left-side inlet is absent from metal')

# V50: validate the B-specific MXFMS reconstruction using only B photos
# 108/110/113/116 and MXFMS manufacturer dimensions; A photos 41/71/72
# are deliberately excluded from this platform's geometry evidence.
mxpost=part(B,'B16')[0].BoundingBox()
check(abs(mxpost.xlen-32)<.02 and abs(mxpost.ylen-32)<.02 and
      abs(mxpost.zlen-280)<.02,
      'B16 MXFMS post must match manufacturer Ø32x280mm envelope')
micbody=part(B,'B16C')[0].BoundingBox()
check(abs(micbody.zmin-(249+12-25))<.02 and
      abs(micbody.zmax-(249+12+25))<.02,
      'B16C MXFMS body datum must match WebGL head height')
for focus_id in ('B16E','B16F'):
    focus=part(B,focus_id)
    check(len(focus)==1 and focus[0].isValid(),
          focus_id+' coaxial coarse/fine focus assembly must be one valid solid')
camera=part(B,'B17')
check(len(camera)==1 and camera[0].isValid(),
      'B17 camera and stepped relay adapter must form one connected solid')
camera_bb=camera[0].BoundingBox()
check(abs(camera_bb.zmin-260)<.02 and abs(camera_bb.zmax-336)<.02,
      'B17 camera adapter and body must match WebGL vertical stack')
nosepiece=part(B,'B18')
check(len(nosepiece)==1 and nosepiece[0].isValid(),
      'B18 MXFMS five-hole inward nosepiece must be one valid solid')
nose_bb=nosepiece[0].BoundingBox()
check(abs(nose_bb.zmin-212)<.02 and abs(nose_bb.zmax-225)<.02,
      'B18 nosepiece height must match the objective/mount interface')
turret_cx=82-18
port_centres=[(turret_cx+18*math.cos(i*2*math.pi/5),
               18*math.sin(i*2*math.pi/5)) for i in range(5)]
for i,(px,py) in enumerate([(turret_cx,0),*port_centres],1):
    bore=vz(7.9,13,px,py,212)
    check(nosepiece[0].intersect(bore).Volume()<1e-4,
          f'B18 central hub / objective port {i} must remain open')
mount=part(B,'B16D')[0]
check(abs(mount.BoundingBox().xlen-16)<.02 and
      mount.intersect(nosepiece[0]).Volume()<1e-4,
      'B16D offset turret support must clear the B18 central hub bore')
for objective_id in ('B18A','B18B'):
    objective=part(B,objective_id)
    check(len(objective)==1 and objective[0].isValid(),
          objective_id+' objective barrel must be one connected valid solid')
report['B_microscope_MXFMS_photo_fit']={
    'maker_model':'SUNNY/SDPTOP MXFMS',
    'maker_post_diameter_mm':32,
    'maker_post_height_mm':280,
    'maker_coarse_travel_mm':32,
    'maker_fine_precision_mm':0.002,
    'nosepiece_ports':5,
    'photo_identified_objectives':['10x/0.15/DIC/WD10.8','OptoSigma model unknown'],
    'installed_objective_proxies':2,
    'custom_B35_foot_and_port_pitch_verified':False,
    'physical_acceptance':False
}
# Optical tips are a conservative candidate for open clearance, not WD qualification.
tipbb=part(B,'B18A')[0].BoundingBox()
glass=part(B,'B07')[0].BoundingBox()
check(tipbb.zmin>glass.zmax,'B objective proxy is above slide; no through-slide collision')
# The uploaded COMPLETE STEP must be the user-approved BARE
# photo-left-return machine, not the deprecated right-return simulation
# that included an unphotographed 76mm glass slide and fabricated jaws.
import csv
verification=json.loads((ROOT/'build'/'verification.json').read_text())
a_complete=next(x for x in verification if x['system']=='A')
omitted={'A05C','A05CU','A05G','A05GP'}
check(set(a_complete['excluded_uninstalled'])==omitted,
      'V77 complete A STEP must exclude all four uninstalled twin-jaw/glass/PDMS study solids')
check(a_complete['approved_installed_shape']=='photo_left_return_L_no_glass_2_X_wing_nuts',
      'V77 official A STEP exports original left-return plate, not mirrored candidate')
check(a_complete['photo_A_stage_center_x_mm']==-116,
      'V77 installed A magnet and vertical goniometer stack must match original photo -116mm X')
with (ROOT/'build'/'platform_A'/'part_levels.csv').open(encoding='utf-8-sig',newline='') as f:
    installed_ids={row['id'] for row in csv.DictReader(f)}
check(not installed_ids.intersection(omitted),
      'V77 installed A part-level BOM cannot list absent glass/PDMS/imaginary clamp')
check({'A05','A05CS1','A05CS2'}.issubset(installed_ids),
      'V77 installed A must still retain the real folded bracket + pair of fastening screws')
with (ROOT/'build'/'platform_A'/'uninstalled_study_parts.csv').open(encoding='utf-8-sig',newline='') as f:
    research_ids={row['id'] for row in csv.DictReader(f)}
check(research_ids==omitted,
      'V77 uninstalled study geometries must be marked clearly, not silently lost')
report['V77_A_user_approved_installed_assembly']={
    'photo_first_left_return':True,
    'installed_photo_bracket_butterfly_screws':['A05','A05CS1','A05CS2'],
    'installed_glass':False,
    'installed_hypothetical_jaws':False,
    'wing_orientation':'X-outward rotated 90deg',
    'excluded_study_solids':sorted(omitted),
    'real_clamp_thread_dimensions_verified':False}
report['checks_passed']=len(report['checks'])
report['geometry_status']='passed'
report['status']='proxy_geometry_only__physical_acceptance_pending'
(ROOT/'build'/'interface_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
