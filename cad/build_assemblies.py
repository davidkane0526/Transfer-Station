"""Two-platform parametric STEP generator (engineering candidate model).
All sizes in mm, breadboard bottom Z=0. See docs/engineering.md.
Run: pip install cadquery && python cad/build_assemblies.py
"""
from pathlib import Path
import cadquery as cq
from cadquery import Vector
import csv, json

OUT=Path(__file__).resolve().parents[1]/'build'
PARTS={'A':[],'B':[]}
def box(w,d,h,x,y,z):
    return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()
def vz(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))
def vx(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(1,0,0))
def vy(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
def cut(s,coords,diam,h,z):
    for x,y in coords:s=s.cut(vz(diam/2,h,x,y,z))
    return s
def cable_path(points, radius):
    """One continuous candidate 3-D cable as swept straight chords and rounded bends.
    Geometry is for enclosure routing ONLY; no electrical circuit claim.
    """
    segments=[]
    for a,b in zip(points[:-1],points[1:]):
        dx,dy,dz=(b[i]-a[i] for i in range(3))
        length=(dx*dx+dy*dy+dz*dz)**.5
        assert length>1e-4
        segments.append(cq.Solid.makeCylinder(radius,length,Vector(*a),
                          Vector(dx/length,dy/length,dz/length)))
    for point in points[1:-1]:
        segments.append(cq.Solid.makeSphere(radius,Vector(*point)))
    combined=segments[0].fuse(*segments[1:])
    assert combined.isValid()
    return combined

def hollow_hose(points,outer_r=3.5,inner_r=2.2):
    """Actual annular candidate hose. Both ends are left OPEN,
    allowing visual and CAD void tests. This is a geometric proxy,
    NOT validation of real hose material or pump-port thread."""
    assert outer_r>inner_r>0
    shell=cable_path(points,outer_r).cut(cable_path(points,inner_r))
    assert shell.isValid(), 'Pipe wall with true continuous lumen must be valid'
    return shell

def add(sys,key,name,solid,grade='C'):
    assert solid.isValid(),(sys,key)
    PARTS[sys].append((key,name,grade,solid))
    dest=OUT/('platform_'+sys)/'parts'
    dest.mkdir(parents=True,exist_ok=True)
    cq.exporters.export(solid,str(dest/(key+'.step')))
def board(sys):
    s=box(430,300,20,0,0,0)
    holes=[(x,y) for x in range(-200,201,25) for y in range(-125,126,25)]
    s=cq.Workplane('XY').add(s).faces('>Z').workplane().pushPoints(holes).hole(5,12).val()
    add(sys,sys+'01','breadboard_430x300_25mm_grid_CANDIDATE',s,'I')
def stage(sys,key,x,y,z,direction='+X',axes=1,depth_direction='+Y',photo_top_bores=False):
    """Vendor-dimension constrained GCM-T25M stages. XY double stack = 33mm.
    2 orthogonal micrometer assemblies are mandatory for -T25M2L/-2C.
    Exact screw-boss detailing requires manufacturer's native CAD.
    """
    assert direction in ('+X','-X') and axes in (1,2)
    assert depth_direction in ('+Y','-Y')
    if axes==2:
        add(sys,key,'lower_fixed_11mm',box(65,65,11,x,y,z),'D')
        add(sys,key+'M','crossed_X_carriage_11mm',box(63,63,11,x,y,z+11),'D')
        top=box(62,62,11,x,y,z+22)
        if photo_top_bores:
            corners=[(x+dx,y+dy) for dx in (-25,25) for dy in (-25,25)]
            top=cut(top,corners,6,3,z+30)
            for i,(xx,yy) in enumerate(corners,1):
                # Photo23: recessed screw heads inside four corner counterbores.
                add(sys,f'{key}S{i}','photo23_recessed_top_fastener_candidate',
                    vz(2.35,1.2,xx,yy,z+30.5),'C')
        add(sys,key+'A','crossed_Y_carriage_11mm_photo_top_counterbores' if photo_top_bores else 'crossed_Y_carriage_11mm',top,'P' if photo_top_bores else 'D')
        h=33
    else:
        add(sys,key,'single_fixed_11p6mm',box(65,65,11.6,x,y,z),'D')
        add(sys,key+'A','single_moving_8p4mm',box(62.4,61.1,8.4,x,y,z+11.6),'D')
        h=20
    if direction=='+X':
        add(sys,key+'B','X_micrometer_stem',vx(6,40,x+32.5,y,z+h-9))
        add(sys,key+'C','X_micrometer_knob',vx(9,14,x+72.5,y,z+h-9))
    else:
        add(sys,key+'B','X_micrometer_stem',vx(6,40,x-72.5,y,z+h-9))
        add(sys,key+'C','X_micrometer_knob',vx(9,14,x-86.5,y,z+h-9))
    if axes==2:
        # Place A02 second micrometer at mid-carriage height: a 9mm-radius
        # drum at only 5.5mm above bottom would intersect the rotary.
        z_y=z+(16.5 if key=='A02' else 5.5)
        if depth_direction=='+Y':
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y+32.5,z_y),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y+72.5,z_y),'D')
        else:
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y-72.5,z_y),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y-86.5,z_y),'D')
def rot(sys,key,x,y,z,grade,radius=47,lock_radius=8):
    # B uses its historical Ø94 candidate. A photo17/20/21/23 ruler
    # silhouette is distinctly narrower than the 65mm top-plate.
    # V48 only A uses Ø66 candidate, bounded [55,75]mm; SKU unknown.
    if key=='A06':
        # User V137: circular rotary is lock-only; no translational micrometer.
        # 21mm OEM-derived envelope closes the previous false 12.2mm gap
        # only after A02 becomes a REAL 33mm crossed XY stage.
        lower=vz(radius,17.5,x,y,z)
        top=vz(radius-.4,3.5,x,y,z+17.5)
        holes=[(x+dx,y+dy) for dx in (-16,16) for dy in (-16,16)]
        top=cut(top,holes,4.5,3.5,z+17.5)
        add(sys,key,'A06_USER_CONFIRMED_LOCK_ONLY_FIXED_17p5mm_HOUSING',lower,grade)
        add(sys,key+'A','A06_ROTATING_TOP_3p5mm_CANDIDATE_HOLES',top,grade)
        # One short locking lever on the front (+Y), not a drive shaft.
        lock=box(10,8,8,x,y+31.4,z+4.6).fuse(vy(3.3,18,x,y+32,z+8.6))
        add(sys,key+'B','A06_ONE_FRONT_LOCK_NO_MICROMETER',lock,'U')
        return
    lower=vz(radius,23,x,y,z)
    if key=='B08':
        # GCM-1107M OEM: four Ø6.8 clearance bores on 50mm square,
        # four Ø11.5 x 16 deep counterbores. Orientation of the
        # counterbore entry remains an installation proxy.
        base_four=[(x+dx,y+dy) for dx in (-25,25) for dy in (-25,25)]
        lower=cut(lower,base_four,6.8,23,z)
        lower=cut(lower,base_four,11.5,16,z+7)
    add(sys,key,'rotary_lower_radius_'+str(radius),lower,grade)
    pitch=25 if radius>=40 else 16
    top=vz(radius,10.2,x,y,z+23)
    top=cut(top,[(x+dx,y+dy) for dx in (-pitch,0,pitch) for dy in (-pitch,0,pitch)],5,8,z+25.2)
    add(sys,key+'A','rotary_top_nine_candidate_bores',top,grade)
    # A lock/handle is emitted only for rotary models whose real hardware
    # includes one. B08's user-confirmed GCM-1107M has no external handle.
    if lock_radius and lock_radius>0:
        add(sys,key+'B','operator_side_rotary_lock',vy(lock_radius,30,x,y+radius,z+12))

def rotate_about_vertical(shape,cx,cy,z0,degrees):
    """Rotate a local sample-stage component about its own vertical centre."""
    if not degrees:
        return shape
    return shape.rotate(Vector(cx,cy,z0),Vector(cx,cy,z0+1),degrees)

def nfp_single_axis(sys,key,cx,cy,z0,yaw_deg=0,model_confirmed=False):
    """65x65x23mm one-axis stage proxy. Local micrometer points +X.
    yaw_deg=90 turns its micrometer toward the operator (+Y in STEP /
    +Z in the WebGL scene), creating the lower orthogonal sample axis.
    """
    place=lambda shape: rotate_about_vertical(shape,cx,cy,z0,yaw_deg)
    corners=[(cx+dx,cy+dy) for dx in (-25,25) for dy in (-25,25)]
    fixed=box(65,65,11,cx,cy,z0)
    fixed=cut(fixed,corners,6.5,11,z0)
    fixed=cut(fixed,corners,11,5,z0+6)
    lower_side=[(-18,1.6),(-4,2.0),(11,2.6),(22,1.6)]
    upper_side=[(-22,1.8),(-8,1.8),(12,2.8)]
    if model_confirmed:
        for xoff,radius in lower_side:
            fixed=fixed.cut(vy(radius,2.5,cx+xoff,cy+30,z0+7))
    add(sys,key,'NFP1462C_fixed_base_65x65x11_O6p5_O11' if model_confirmed
        else '65mm_class_lower_orthogonal_stage_fixed_base_SKU_UNVERIFIED',
        place(fixed),'D' if model_confirmed else 'P')
    for i,(hx,hy) in enumerate(corners,1):
        screw=vz(2.45,18,hx,hy,z0-7).fuse(vz(4.2,2.5,hx,hy,z0+8.5))
        add(sys,f'{key}S{i}','single_axis_stage_fixed_base_M6x18_candidate_'+str(i),
            place(screw),'C')
    moving_lower=box(65,65,2,cx,cy,z0+11)
    add(sys,key+'M','single_axis_stage_moving_carriage_lower_2mm',place(moving_lower),'P')
    moving_top=box(65,65,10,cx,cy,z0+13)
    if model_confirmed:
        m6=[(cx+x,cy+y) for x in (-25,0,25) for y in (-25,0,25)]
        m3=[(cx+x,cy+y) for x in (-16,16) for y in (-16,16)]
        moving_top=cut(moving_top,m6,5,10,z0+13)
        moving_top=cut(moving_top,m3,2.5,10,z0+13)
        top_pattern='9 M6 + 4 M3 OEM pattern'
    else:
        # Only the four corner mating holes required by the upper B09
        # fixed-base pattern are represented. B41's complete top pattern
        # is not inferred from the similar-looking shell.
        corner_m6=[(cx+x,cy+y) for x in (-25,25) for y in (-25,25)]
        moving_top=cut(moving_top,corner_m6,4.9,10,z0+13)
        top_pattern='4 M6 corner mounting holes (candidate; full pattern unknown)'
    if model_confirmed:
        for xoff,radius in upper_side:
            moving_top=moving_top.cut(vy(radius,2.5,cx+xoff,cy+30,z0+17.5))
    top_name='NFP1462C_moving_top_9M6_4M3' if model_confirmed else 'unidentified_lower_stage_moving_top_4M6_candidate'
    add(sys,key+'A',top_name,place(moving_top),'D' if model_confirmed else 'P')
    # Local -X is the micrometer side on the OEM model. Yaw 90 makes it
    # point to the front while preserving the upper stage's independent +X.
    housing=box(24,30,15,cx+45,cy,z0+12)
    housing=housing.cut(vx(4,9,cx+48,cy,z0+12))
    add(sys,key+'B','single_axis_micrometer_housing_24x30x15_blind_O8',
        place(housing),'P')
    spindle_len=82.5 if model_confirmed else 40.0
    collar_len=23.0 if model_confirmed else 18.0
    collar_center=cx+(107.5 if model_confirmed else 79.0)
    drum_center=cx+(117.0 if model_confirmed else 88.5)
    add(sys,key+'C','single_axis_micrometer_spindle_O7p2_'+str(spindle_len),
        place(vx(3.6,spindle_len,cx+48+spindle_len/2,cy,z0+12)),'P')
    collar=vx(9,collar_len,collar_center,cy,z0+12).cut(
        vx(3.8,collar_len,collar_center,cy,z0+12))
    add(sys,key+'D','single_axis_micrometer_collar_candidate_'+str(collar_len),
        place(collar),'P')
    drum=vx(11,28,drum_center,cy,z0+12).cut(
        vx(9.2,28,drum_center,cy,z0+12))
    add(sys,key+'E','single_axis_micrometer_drum_O22x28_bore_O18p4',
        place(drum),'P')
    report_name='B09_NFP1462C' if key=='B09' else 'B41_lower_orthogonal_stage'
    return {'fixed_base_z_mm':z0,'top_z_mm':z0+23,
            'micrometer_world_direction':'+X' if yaw_deg==0 else '+Y',
            'model_confirmed':model_confirmed,
            'envelope_candidate_mm':[65,65,23],
            'fixed_hole_pitch_mm':50,
            'moving_top_pattern':top_pattern,
            'micrometer_length_candidate_mm':177.5 if model_confirmed else 135.0}

def heater(cx=82,cy=0,z=98.2):
    corners=[(cx+dx,cy+dy) for dx in (-25,25) for dy in (-25,25)]
    metal=box(65,65,12,cx,cy,z)
    # Bottom milled pocket + lead side route + bead contact shallow relief.
    metal=metal.cut(box(38.6,38.6,5.4,cx,cy,z))
    # BACK is -Y in the CadQuery XY ground plane, equivalent to web -Z.
    # Heater wires pass through the rear wall towards the ceramic heater pocket.
    for lead_x in (10,15):
        metal=metal.cut(vy(1.2,13.5,cx+lead_x,cy-32.5,z+2.5))
    # Thermocouple groove in the underside of cavity roof exits BACK.
    metal=metal.cut(box(1.6,32.5,.9,cx+6,cy-16.25,z+5.4))
    metal=metal.cut(box(5,2,.8,cx+6,cy,z+5.4))
    metal=cut(metal,corners,6.6,12,z)
    metal=cut(metal,corners,11,6.5,z+5.5)
    metal=metal.cut(vz(.7,3,cx,cy,z+9))
    metal=metal.cut(vy(1.4,32.6,cx,cy-32.6,z+9.3))
    add('B','B11','milled_chuck_single_vacuum_hole',metal,'U')
    add('B','B12','ceramic_heater_38x38x5_NEW_CANDIDATE',box(38,38,5,cx,cy,z+.3))
    ins=cut(box(65,65,10,cx,cy,z-10),corners,6.8,10,z-10)
    add('B','B10','insulator_10mm_CANDIDATE',ins,'U')
    add('B','B13','thermocouple_bead_CANDIDATE',vz(.4,.8,cx+6,cy,z+5.35))
    # V37: actual B11 rear horizontal bore meets an ANNULAR B15
    # fitting. The V36 solid cylinder would seal the outlet shut.
    fitting=vy(2.4,12,cx,cy-44.5,z+9.3)
    fitting=fitting.cut(vy(1.42,12.2,cx,cy-44.6,z+9.3))
    add('B','B15','rear_vacuum_fitting_OPEN_AXIAL_BORE',fitting,'C')
    # Rear stub follows browser B15 to exactly the same datum as B40.
    stub=[(82,-44.5,130.5),(82,-58,131.5),
          (83,-70,127.5),(94,-79,113.5)]
    add('B','B15T','vacuum_short_flexible_hollow_stub_CANDIDATE',
        hollow_hose(stub),'C')
    # Follow the actual flexible lead trajectories shown in the
    # interactive B12/B13 subassemblies, including their LOWERED
    # free tails. Previous straight cylinders stopped 2–4 mm ABOVE
    # the real cable starts, despite passing broad bounding-box tests.
    for n,xx in enumerate((10,15),1):
        tail=[(cx+xx,cy-19,z+2.8),
              (cx+xx,cy-32.5,z+2.8),
              (cx+xx,cy-48,z+2.8),
              (cx+xx+1,cy-60,z+0.3)]
        add('B',f'B12L{n}',f'rear_heater_wire_{n}_PHOTO_FIT',
            cable_path(tail,.55),'C')
    thermocouple=[(cx+6,cy,z+5.75),
                  (cx+6,cy-19.5,z+5.75),
                  (cx+6,cy-33,z+5.75),
                  (cx+6,cy-51,z+2.15)]
    add('B','B13L','rear_thermocouple_wire_PHOTO_FIT',
        cable_path(thermocouple,.34),'C')
    for i,(x,y) in enumerate(corners,1):
        # M6×25 length is specified *under the head*. Head sits 0.5 mm below the
        # top plane in a 6.5 mm counterbore. Join shaft/head with zero axial gap.
        head_bottom=z+12-6.5
        shaft=vz(3,25,x,y,head_bottom-25)
        head=vz(5,6,x,y,head_bottom)
        screw=shaft.fuse(head)
        assert len(screw.Solids())==1, 'Disconnected screw head/shaft'
        add('B','B14_'+str(i),'M6x25_candidate_'+str(i),screw,'I')
def make_b():
    board('B')
    ax,cx=-112,82
    mag=box(65,65,20,ax,0,20)
    for pitch,dia in [(50,5),(40,3.3),(32,2.5)]:
        mag=cut(mag,[(ax+dx,dy) for dx in (-pitch/2,pitch/2) for dy in (-pitch/2,pitch/2)],dia,10,30)
    mag=cut(mag,[(ax,0)],5,10,30)
    add('B','B02','GCM420302M_magnet_LOWEST',mag,'D')
    # The OFF/ON lever and front sticker identify the magnetic base at the bottom.
    add('B','B02L','magnet_OFF_ON_lever',vy(3,12,ax-23,32.5,27),'P')
    add('B','B02P','magnet_front_label_plate',box(50,1,8,ax,33,26),'P')
    # 108/109: T25M atop magnet, silver micrometer exits the LEFT.
    stage('B','B03',ax,0,40,'-X',axes=2,depth_direction='+Y')
    # Opposing photographic views: magnet OFF/ON plate is at front(+Y),
    # both T25M and V25M logo plates on rear(-Y). Label plaques are proxies.
    add('B','B03L','T25M_branded_rear_face_PROXY',box(51,.6,7,ax,-33.1,44),'P')
    add('B','B04','GCMV25M_flange',box(65,66,8,ax,0,73),'D')
    add('B','B04L','V25M_branded_rear_face_PROXY',box(50,.6,7,ax,-33.3,134.5),'P')
    add('B','B04A','GCMV25M_upright_body_PROXY',box(56,18,52,ax,-10,81))
    # Photo108/149: the V25M moving plate FRONT is dark metal,
    # with a visible array of small mounting bores, NOT a huge
    # featureless silver rectangle. Cut only 2mm-deep display
    # recesses at PHOTO-FIT positions; factory tapped hole coordinates
    # have not been verified.
    front_guide=box(34,8,49,ax,3,81)
    for xx in (-10,0,10):
        for zz in (93,103,113,123):
            front_guide=front_guide.cut(vy(1.55,2,ax+xx,5,zz))
    add('B','B04E','GCMV25M_dark_moving_front_guide_12_BLIND_BORE_photo_proxy',
        front_guide,'C')
    # SIDE output: the fixed upright lies at X=ax±28, Y=-19..-1.
    # The moving guide front face ends Y=+7. A 25x18x15 mm
    # photo-fit bridge meets that guide at Y=+7 and touches B05
    # at X=ax+28, without any volumetric overlap.
    add('B','B04B','GCMV25M_SIDE_moving_bridge_photo108',
        box(25,18,15,ax+15.5,16,85))
    # Photo108/149: the vertical micrometer runs ALONG THE LEFT
    # OUTSIDE face of the V25M upright. In V30 the 40mm silver stem
    # wrongly penetrated solid B04A by ~1455.7 mm^3.
    # Move it to the outer edge and support it in an actual Ø13.2
    # clearance collar whose SHORT bridge meets the upright's side.
    # This bracket is only a geometric photo-fit, not OEM catalog CAD.
    mic_x=ax-39
    collar=vz(9,10,mic_x,0,104)
    collar=collar.fuse(box(5,4,10,ax-30.5,-2,104))
    collar=collar.cut(vz(6.6,10,mic_x,0,104))
    add('B','B04G','V25M_external_micrometer_collared_side_brace_CANDIDATE',collar,'C')
    add('B','B04C','vertical_micrometer_stem',vz(6.5,40,mic_x,0,102),'P')
    add('B','B04D','vertical_micrometer_knob',vz(9,17,mic_x,0,142),'P')
    # B ruler photo149: upper MOVABLE V25M output flange is below
    # the top of the stationary upright shell. The source images show
    # a flat black 65x66mm mount followed by a distinct 50mm CYLINDRICAL
    # holder and a ~100mm steel post. Neither exact post/holder model
    # is identified from an engraved label.
    plate_z=90;plate_h=6
    holder_z=plate_z+plate_h
    post_len=112;holder_len=50
    upper_rod_z=191;lower_rod_z=158
    assert upper_rod_z-lower_rod_z==33  # PHUC-1 OEM E
    add('B','B05','photo108_V25M_side_mount_plate_PROXY',
        box(65,66,plate_h,ax+60.5,0,plate_z),'C')
    # V36 shifts the clamp and glass left while keeping the PDMS over sample.
    # The square bracket is still supported by the SAME B05 plate.
    post_x=ax+45
    # Photo149: missing black post sleeve. PHSH-2=50mm is a catalogue
    # candidate, not a photo-identified exact model. True Ø12.16 bore.
    sleeve=vz(10,holder_len,post_x,-15,holder_z)
    sleeve=sleeve.cut(vz(6.08,holder_len,post_x,-15,holder_z))
    add('B','B34','photo149_black_sleeve_PHSH2_50mm_candidate',sleeve,'C')
    # B41 raises the heater by 23mm. Lift the PHUC/rod/clamp/glass
    # branch by the same amount to preserve the 14.8mm glass gap and
    # 13mm PDMS approach. 112mm is the resulting scene-fit post length,
    # NOT a claimed Zolix standard SKU.
    add('B','B27','photo149_vertical_O12x112_scene_fit_SKU_unverified',
        vz(6,post_len,post_x,-15,holder_z),'C')
    # Separate, currently unidentified, little BLACK SQUARE clamp.
    # Both bores cut THROUGH the actual box so two steel rods do not
    # occupy unrelieved solid wall. X transverse vs vertical Z.
    cube=box(28,30,30,post_x,-7.5,upper_rod_z-15)
    cube=cube.cut(vz(6.05,30,post_x,-15,upper_rod_z-15))
    cube=cube.cut(vx(6.05,28,post_x-14,0,upper_rod_z))
    add('B','B33','photo149_unknown_square_cross_clamp_two_real_bores',cube,'C')
    # Zolix PHUC-1 OEM: 60mm long × Ø30 outer envelope, two
    # Ø12 through bores, center spacing=33mm. Both physical rods
    # appear HORIZONTAL from the same photo149 side view.
    phuc_x=-35
    phuc=vz(15,60,phuc_x,0,144.5)
    phuc=phuc.cut(vx(6.05,32,phuc_x-16,0,upper_rod_z))
    phuc=phuc.cut(vx(6.05,32,phuc_x-16,0,lower_rod_z))
    groove=vz(15.1,1,phuc_x,0,174.5).cut(vz(13,1,phuc_x,0,174.5))
    phuc=phuc.cut(groove)
    add('B','B24','Zolix_PHUC1_OEM_A60_B30_2X12_E33_photo149',phuc,'D')
    # Candidate first/second Ø12 rods. PHUC's 33mm pitch and the
    # TWO independently supported bars are preserved. Rod lengths
    # and end coupling remain an engineering-fit hypothesis.
    add('B','B25','first_O12x70_LENGTH_CANDIDATE',
        vx(6,70,-90,0,upper_rod_z),'C')
    add('B','B28','second_O12x57p5_LENGTH_CANDIDATE',
        vx(6,57.5,-60,0,lower_rod_z),'C')
    clamp_x=cx-69
    # Photo108/150: second Ø12 rod ends directly at the LEFT face of
    # GCM-1302M's vertical back spine, rather than running into a
    # fabricated Ø26 socket and 27mm hanging solid. Only a tiny Ø6
    # END STUD (B26) is hypothesized because GCM1302M lists an M6 mount.
    # An unverified M6 thread must NOT be treated as a proven fastener.
    # V36: the rod stops at the repositioned GCM1302M spine x=-2.5.
    # This is a candidate side interface; actual M6 coupling unverified.
    add('B','B26','unknown_M6_direct_end_stud_INTERFACE_ONLY',
        vx(3,10,-2.5,0,lower_rod_z),'C')
    # Shift the GCM-1302M jaw and glass to a plausible aligned height.
    # Only the interconnection hierarchy is photographed; this 20.5mm
    # change is a geometry fit, NOT a confirmed measured clearance.
    jaw_shift=43.5
    # The moving pressure plate B06M must NOT penetrate the fixed
    # spine. The old 17mm wide spine overlapped B06M by 490mm^3,
    # and B06F by 70mm^3 in separate STEP parts.
    # A 14.5mm spine ends at X=39 where both jaws BEGIN, so they
    # share a guided side FACE rather than occupying the same metal.
    # Keep the fixed lower jaw mechanically supported over its FULL
    # 4mm vertical thickness. The old spine touched only its upper
    # 0.5mm edge: zero collision did not mean a viable joining face.
    # Now spine Z=121..139.5, meeting both fixed/moving jaw plates
    # by planar side contact without penetration.
    fixed_spine=box(14.5,56,18.5,clamp_x-8.25,0,144)
    fixed_spine=fixed_spine.cut(vx(3.06,10,-2.5,0,lower_rod_z))
    add('B','B06','GCM13_fixed_spine_with_REAL_M6_candidate_side_bore',
        fixed_spine,'C')
    add('B','B06F','GCM13_one_fixed_jaw_CANDIDATE',
        box(22,56,4,clamp_x+10,0,100.5+jaw_shift),'C')
    add('B','B06M','GCM13_one_moving_pressure_plate_CANDIDATE',
        box(22,56,3.5,clamp_x+10,0,105.5+jaw_shift),'C')
    bridge=box(24,56,5,clamp_x+6,0,119+jaw_shift)
    for yy in (-17,17):
        bridge=bridge.cut(vz(1.75,5,clamp_x+10,yy,119+jaw_shift))
    add('B','B06T','GCM13_bridge_with_2_bores_CANDIDATE',bridge,'C')
    for i,yy in enumerate((-17,17),1):
        add('B',f'B06S{i}',
            'GCM13_one_of_two_pressure_screws_PROXY',
            vz(1.7,12,clamp_x+10,yy,109+jaw_shift),'C')
    add('B','B07','glass_slide_UNVERIFIED_76x26x1',
        box(76,26,1,cx-26,0,104.5+jaw_shift),'C')
    add('B','B07A','pdms_UNVERIFIED_transfer_tip',
        box(20,20,1.8,cx,0,102.7+jaw_shift),'C')
    # Photos145/150: sample rotary is NOT directly seated on the silver
    # table B01. A separate BLACK THORLABS perforated optical board
    # is plainly visible under the rotary, with its own front edge
    # and vendor plaque. Photo150 shows this black board ALSO runs
    # under the rear microscope upright base, not just the rotary.
    # V51: MB2530/M is a high-confidence hole-pattern candidate only.
    # Retain 12mm photo-fit thickness; OEM candidate is 12.7mm.
    black=box(250,300,12,75,0,20)
    photo_holes=[(75-112.5+25*i,-137.5+25*j) for i in range(10) for j in range(12)]
    black=cut(black,photo_holes,5,12,20)  # M6 through-tap drill proxy, threads omitted
    bolts=[(x,y) for x in (-25,175) for y in (-125,125)]
    black=cut(black,bolts,6.5,12,20)
    black=cut(black,bolts,11,3.5,28.5)
    add('B','B35','Thorlabs MB2530/M HOLE-PHASE CANDIDATE / 250x300x12 PHOTO-FIT AUXILIARY PLATE',black,'P')
    for i,(x,y) in enumerate(bolts,1):
        screw=vz(2.5,20,x,y,8.5).fuse(vz(5,3.5,x,y,28.5))
        add('B',f'B35S{i}',f'M6x20 LOW-HEAD ANCHOR CANDIDATE {i}',screw,'C')
    # MB2530/M at 250x300mm has FOUR corner counterbores, no central fifth.
    # The four B16 foot bores are a subset of the 120-hole B35 OEM grid.
    mic_foot_x=87.5
    mic_foot_y=-112.5
    microscope_b35_centres=[(x,y) for x in (mic_foot_x-25,mic_foot_x+25)
                            for y in (mic_foot_y-25,mic_foot_y+25)]
    microscope_rise=12
    # V51: restore the two sample-side components that were present in
    # WebGL/BOM but absent from the STEP builder.
    # GCM-1107M: Ø94 x 33.2mm rotary stage, nine-hole 25mm top pattern.
    rot('B','B08',cx,0,20+microscope_rise,'D',radius=47,lock_radius=0)
    # Photo147 reveals TWO stacked orthogonal single-axis sample stages.
    # B41 is the lower, front-facing stage (exact SKU unverified);
    # B09 is the upper Zolix NFP-1462C, with its drive to the right.
    nfp_lower_z=20+microscope_rise+33.2
    nfp_upper_z=nfp_lower_z+23
    nfp_b41=nfp_single_axis('B','B41',cx,0,nfp_lower_z,yaw_deg=90,model_confirmed=False)
    nfp_b09=nfp_single_axis('B','B09',cx,0,nfp_upper_z,yaw_deg=0,model_confirmed=True)
    # The 10mm insulator sits on the upper B09 moving top. The chuck,
    # heater and vacuum fitting are therefore raised by the second 23mm stage.
    heater(cx=cx,cy=0,z=nfp_upper_z+33.0)
    # Photo116 identifies SDPTOP MXFMS. Manufacturer data specifies
    # a Ø32 x 280mm post; the actual B35 adapter foot is a custom
    # installation proxy, not the standard 320x260x16mm B5 base.
    add('B','B16','MXFMS_column_O32x280_OEM_dimension_candidate',
        vz(16,280,mic_foot_x,mic_foot_y,32+microscope_rise),'D')
    microscope_foot=box(65,65,12,mic_foot_x,mic_foot_y,20+microscope_rise)
    foot_bores=[(mic_foot_x+dx,mic_foot_y+dy)
                for dx in (-25,25) for dy in (-25,25)]
    microscope_foot=cut(microscope_foot,foot_bores,6.5,12,20+microscope_rise)
    add('B','B16A','microscope_B35_custom_mount_foot_O6p5_candidate',
        microscope_foot,'C')
    # Shank O6 crosses O6.5 clearance and enters the O5 nominal
    # tapped-core proxy for 6mm. The simplified cylindrical thread
    # engagement is NOT a collision-free representation of M6 flanks.
    for i,(hx,hy) in enumerate(foot_bores,1):
        screw=vz(3,20,hx,hy,24).fuse(vz(5,6,hx,hy,44))
        add('B',f'B16S{i}','B16_to_B35_M6x20_socket_head_CANDIDATE',screw,'C')
    # Main column-to-head arm and forward boom, mapped to the Three.js datums.
    add('B','B16G','MXFMS_column_to_head_support_arm',
        box(80,34,34,86,mic_foot_y+23,245+microscope_rise),'P')
    add('B','B16B','MXFMS_forward_head_support_boom',
        box(32,125,26,86,-25,260+microscope_rise),'P')
    # MXFMS coaxial coarse/fine focusing wheels on both sides of the body.
    # Their diameters are visual candidates; maker data gives travel/precision,
    # not the handwheel diameters.
    body=box(55,55,50,cx,0,224+microscope_rise)
    add('B','B16C','MXFMS_microscope_body_with_focus_carriage',body,'P')
    right_focus=vx(5,12,cx+27.5,-4,257).fuse(
        vx(28,9,cx+39.5,-4,257),vx(15,4,cx+48.5,-4,257)).clean()
    left_focus=vx(5,12,cx-39.5,-4,257).fuse(
        vx(28,9,cx-48.5,-4,257),vx(15,4,cx-52.5,-4,257)).clean()
    add('B','B16E','MXFMS_right_coaxial_coarse_fine_focus',right_focus,'P')
    add('B','B16F','MXFMS_left_coaxial_coarse_fine_focus',left_focus,'P')
    # Five-position inward nosepiece support sits on an offset hub.
    # The 18mm port radius is a photo-fit, not an OEM dimension.
    add('B','B16D','MXFMS_five_position_nosepiece_support_tube',
        vz(8,44,cx-18,0,186+microscope_rise),'P')
    # SDPTOP camera plus two stepped CTV/relay adapter sections.
    camera=box(47,48,48,cx,0,276+microscope_rise)
    camera=camera.fuse(vz(12,18,cx,0,270),vz(9,10,cx,0,260)).clean()
    add('B','B17','SDPTOP_digital_camera_with_CTV_relay_adapter',camera,'P')
    # MXFMS five-hole inward nosepiece: central hub bore plus five
    # objective ports. Two photo110 objective types are represented.
    import math
    turret_cx=cx-18
    ports=[(turret_cx+18*math.cos(i*2*math.pi/5),
            18*math.sin(i*2*math.pi/5)) for i in range(5)]
    nosepiece=vz(28,13,turret_cx,0,212)
    nosepiece=nosepiece.cut(vz(8.5,13,turret_cx,0,212))
    for px,py in ports:
        nosepiece=nosepiece.cut(vz(8.5,13,px,py,212))
    # Leave the five ports and central hub as true open bores. The
    # matching sleeves are visual details in WebGL; the STEP disk itself
    # stays a single clean solid with 0.5mm candidate radial clearance.
    add('B','B18','MXFMS_five_hole_inward_nosepiece',nosepiece.clean(),'P')
    # Photo110: 10x / 0.15 / DIC / WD10.8 objective.
    objective_10x=vz(8,38,cx,0,174)
    objective_10x=objective_10x.fuse(
        vz(9.5,3,cx,0,209),vz(6.5,12,cx,0,162)).clean()
    add('B','B18A','10x_015_DIC_WD10p8_objective_candidate',objective_10x,'P')
    # Separate OptoSigma marking; exact model, NA and working distance unknown.
    opto_x,opto_y=ports[1]
    objective_opto=vz(7.5,36,opto_x,opto_y,176)
    objective_opto=objective_opto.fuse(
        vz(8.8,3,opto_x,opto_y,209),vz(5.8,12,opto_x,opto_y,164)).clean()
    add('B','B18B','OptoSigma_objective_model_unknown',objective_opto,'P')
# Photo114 front YUDIAN PID; photo119 opened metal cabinet with
    # SE-600-48 PSU and separate BLACK vented internal module. V32
    # incorrectly overlapped these three as free-standing boxes, and
    # its proxy B19 was smaller than the OEM 247mm-long power supply.
    # This hollow enclosure remains a PHOTO-FIT candidate. Real wall
    # thickness, fastener locations and electrical safety are unknown.
    control_x,control_y=365,-150
    shell=box(285,225,125,control_x,control_y,0)
    shell=shell.cut(box(279,219,126,control_x,control_y,3))
    # One real Ø10.6 feedthrough in the LEFT wall: the three shown
    # external wires cannot visually pass through an unperforated wall.
    shell=shell.cut(vx(5.3,6,220,-166,86))
    add('B','B36','PHOTO119_OPEN_STEEL_CONTROL_HOUSING_285x225x125_CANDIDATE',
        shell,'C')
    # B19 is ONLY a front-mounted panel controller. Its back face
    # meets B36's outer front wall at world Y=-37.5, without overlap.
    add('B','B19','YUDIAN_AI_PID_photo114_front_panel_CANDIDATE',
        box(120,18,80,365,-28.5,20),'P')
    add('B','B21','MeanWell_SE60048_photo117_INSIDE_B36',
        box(247,127,63.5,365,-190,3),'D')
    add('B','B23','photo119_BLACK_VENTED_INTERNAL_MODULE_CANDIDATE',
        box(93,58,38,365,-77,3),'C')
    # The 36x12x16 block is a visual termination zone, not a verified
    # terminal device or wiring diagram; photo119 only shows cable ends.
    add('B','B39','photo119_UNASSIGNED_terminal_zone_CANDIDATE',
        box(36,12,16,265,-116,3),'C')
    wiring=[
      ('B37','heater_A_unverified_power_lead',1.1,
       [(93,-60,121.5),(119,-92,135),(174,-140,130),
        (207,-165,120),(222.5,-168,84),
        (225,-168,84),(235,-154,72),(237,-125,44),
        (251,-117,25),(255,-116,19.7)]),
      ('B37A','heater_B_unverified_power_lead',1.1,
       [(98,-60,121.5),(119,-97,140),(174,-146,136),
        (207,-171,126),(222.5,-167,87),
        (225,-167,87),(235,-151,75),(237,-128,49),
        (252,-118,26),(265,-116,19.7)]),
      ('B38','temperature_feedback_unverified_pinout',.72,
       [(88,-51,123.35),(119,-102,138),(174,-146,136),
        (207,-171,130),(222.5,-163,89),
        (225,-163,89),(235,-150,103),(265,-120,108),
        (310,-83,100),(349,-43,78)])
    ]
    for key,name,radius,points in wiring:
        add('B',key,name,cable_path(points,radius),'C')
    # V43: photos120/123 and VN-50 family side views show a horizontal
    # cylindrical motor barrel, two SAME-SIDE tie rods, finned twin heads,
    # a side nameplate, warning sticker and an end fan grille.
    # Product-family dimensions remain candidates, not measured OEM CAD.
    pump_shell=box(200,110,8,325,180,0)
    band_a=vx(46,4,282,180,50).cut(vx(43,4.2,281.9,180,50))
    band_b=vx(46,4,340,180,50).cut(vx(43,4.2,339.9,180,50))
    fan_ring=vx(39,2,239,180,50).cut(vx(31,2.2,238.9,180,50))
    warning_ring=vy(5.2,.6,370,220.45,70).cut(vy(4.2,.8,370,220.35,70))
    warning_slash=box(1.4,.6,12,370,220.8,64).rotate(
        (370,220.8,70),(370,221.8,70),-45)
    pump_shell=pump_shell.fuse(
        # Four candidate feet on the baseplate.
        box(28,14,12,254,132,4),box(28,14,12,254,228,4),
        box(28,14,12,396,132,4),box(28,14,12,396,228,4),
        # Horizontal cylindrical black motor barrel and end covers.
        vx(44,150,250,180,50),vx(42,12,240,180,50),
        vx(42,8,400,180,50),band_a,band_b,
        # Motor core is fused inside the barrel and exposed through vent bores.
        vx(28,118,266,180,50),
        # Two longitudinal tie rods on the same visible side, above/below plate.
        vx(2.5,140,255,219,30),vx(2.5,140,255,219,70),
        box(14,14,18,255,214,21),box(14,14,18,395,214,21),
        box(14,14,18,255,214,61),box(14,14,18,395,214,61),
        # Two finned aluminium heads, each on a separate flange.
        box(48,48,8,290,180,88),box(42,42,38,290,180,96),
        box(44,44,4,290,180,134),
        box(48,48,8,365,180,88),box(42,42,38,365,180,96),
        box(44,44,4,365,180,134),
        # Three cooling fins per head.
        box(44,44,2,290,180,137.8),
        box(44,44,2,290,180,139.6),
        box(44,44,2,290,180,141.4),
        box(44,44,2,365,180,137.8),
        box(44,44,2,365,180,139.6),
        box(44,44,2,365,180,141.4),
        # Shared upper connecting pipe, outlet silencer and filter assembly.
        vx(4.2,75,290,180,142),
        vz(4.2,8,290,180,134),vz(4.2,8,365,180,134),
        vx(7,14,276,180,143),
        box(18,18,16,385,180,125),
        vz(8,22,385,180,100),vz(9,4,385,180,121),
        # Photo-like side nameplate and separate no-lubrication warning plate.
        box(48,1.2,22,325,224,39),
        box(18,1.2,18,370,220,61),
        box(30,.6,1.2,325,224.8,56),
        box(36,.6,1.2,325,224.8,52),
        box(32,.6,1.2,325,224.8,48),
        box(28,.6,1.2,325,224.8,44),
        box(22,.6,1.2,325,224.8,40),
        warning_ring,warning_slash,
        # Circular fan grille ring on the left end cover.
        fan_ring)
    # Four open candidate mounting bores (142x96mm family pattern).
    for x in (254,396):
        for y in (132,228):
            pump_shell=pump_shell.cut(vz(3.1,16,x,y,0))
    # 12 bores on exposed upper arcs, away from both pump heads.
    for x in (255,260,315,330,390,395):
        for y in (165,195):
            pump_shell=pump_shell.cut(vz(2.7,2.5,x,y,90.5))
    # 18 side bores above/below the nameplate; rods occupy z=30 and z=70.
    for x in (260,270,360,375,390,395):
        for z in (40,50,60):
            pump_shell=pump_shell.cut(vy(2.1,3,x,222.5,z))
    # Eight end-face fan apertures through the end cover.
    for dy,dz in [(-24,0),(24,0),(0,-24),(0,24),
                  (-17,-17),(-17,17),(17,-17),(17,17)]:
        pump_shell=pump_shell.cut(vx(2.5,14,239,180+dy,50+dz))
    # The +X suction nozzle remains a separate candidate interface.
    pump_shell=pump_shell.cut(vx(5.9,8,400,180,68))
    add('B','B20','photo120_VN50_cylindrical_motor_twin_head_pump_candidate',
        pump_shell,'P')
    # Thin annular datum ring records the VN-50 family G1/4 major diameter.
    # Ø11.8 is a female-thread tap-drill candidate only; no helical thread,
    # port gender, sealing seat or hose adapter is claimed as verified.
    pump_port_datum=vx(6.5785,1.2,408,180,68).cut(
        vx(5.9,1.4,407.9,180,68))
    add('B','B20I','VN50_G1_4_THREAD_REFERENCE_RING_NOT_THREADED_OR_VERIFIED',
        pump_port_datum,'C')
    # V40: pass LEFT of B36, behind its rear wall (B19's back side),
    # then around the RIGHT side to the candidate VN-50 INTAKE.
    # Keep the long rear service lane at vertical Z=70mm to separate
    # B40 from the B37 heater pair and B38 sensor lead.
    # CAD (X, depth-Y, vertical-Z) maps to WebGL (X, vertical-Y, depth-Z).
    hose=[
        (94,-79,113.5),
        (94,-79,70),(94,-49,70),(200,-49,70),
        (200,-135,70),(200,-170,70),
        (200,-275,70),(350,-275,70),(520,-275,70),
        (520,140,70),(520,180,90),(465,180,69),(409.2,180,68)
    ]
    add('B','B40','B11_B15_rear_to_VN50_hollow_suction_hose',
        hollow_hose(hose),'C')
    add('B','B22','photo115_external_LED_adapter_CANDIDATE',
        box(65,72,48,335,65,0),'P')
def make_a():
    board('A')
    ax,cx=-60.75,78
    # V80 uses Daheng's GCM-901602M catalog only as an additive height
    # cross-check for the same GCM-T25M2L + GCM-VC13M pair. The user's
    # installed order is reversed relative to the stock 901602M image, so
    # this does NOT claim that the user's assembly is a stock GCM-901602M.
    # A photo 100 shows sample-side T25M above rotary; A photo 97 shows a
    # SECOND T25M below VC13M. Both physically exist.
    stage('A','A02',cx,0,49,'+X',axes=2,depth_direction='+Y')
    # User-confirmed mounting relationship, maker/height candidate:
    # A15 must rest on the actual magnetic base, not on naked board.
    # Photo194: face slot is on A15, not the lowest A17 magnet.
    mag=box(65,65,20,ax,0,20)
    # V94: photo194 front face shows a light OFF/ON-style plaque and a
    # left silver switch. Oeabt MBS-65B/C is the strongest FAMILY match:
    # 65.2x65.2x20mm with the same plaque/switch topology. The top face is
    # hidden by A15, so neither B nor C hole pattern may be fabricated.
    add('A','A17','65x65x20_MAGNET_BASE_OEABT_MBS65_FAMILY_PHOTO_FIT_NO_TOP_HOLES',mag,'C')
    front_label=box(40,.8,7,ax+5,32.9,30)
    add('A','A17LBL','PHOTO194_FRONT_OFF_ON_LABEL_PLAQUE_TEXT_UNREADABLE',front_label,'P')
    side_switch=vy(2.2,10,ax-23,32.5,27).fuse(vz(3.2,9,ax-23,39.5,24))
    add('A','A17L','MBS65_FAMILY_LEFT_SILVER_SWITCH_CANDIDATE_IDENTITY_UNVERIFIED',side_switch,'C')
    stage('A','A15',ax,0,40,'+X',axes=2,depth_direction='+Y',photo_top_bores=True)
    # Nov 08 screen-behind view shows A15 silver slot on the -Y
    # side of the XY stage, OPPOSITE the +Y VC13M front spindle.
    # WebGL: -Z; STEP: -Y (its Z axis denotes height).
    front=box(42,1.5,12,ax,-33.25,53).cut(box(26,1.6,4,ax,-33.25,57))
    add('A','A15F','photo194_A15_front_slotted_plate_candidate',front,'P')
    for i,xx in enumerate((ax-17,ax+17),1):
        add('A',f'A15FS{i}','photo194_A15_front_face_fastener_candidate',
            vy(2.2,1.5,xx,-33.25,55),'C')
    # V79: remove the detached A15FK cylinder. The photograph supports
    # the slotted face and two fasteners; the old free-standing control had
    # no verified mechanical linkage and produced the persistent floating knob.
    # V83: Daheng GCM-VC13M vendor topology. The catalog fixes 65x65mm
    # platform, 13mm travel, crossed-roller guide class and a CENTRAL
    # vertical micrometer. Preserve V80's 126mm T25M2L+VC13M additive
    # envelope check, but replace the old solid-wall silhouette with an
    # open two-upright frame matching the manufacturer product image.
    vc13_lower_top=40+119.5
    fixed_top=vc13_lower_top-7
    base=box(65,65,8,ax,0,73)
    # Two side towers + rear spine form one connected stationary frame.
    left=box(8,40,fixed_top-81,ax-20,-2,81)
    right=box(8,40,fixed_top-81,ax+20,-2,81)
    rear=box(44,8,fixed_top-81,ax,-18,81)
    # External guide rails are display/kinematic proxies; exact crossed-
    # roller internal cross-section is not published in readable evidence.
    guide_l=box(3.4,8,fixed_top-81,ax-24,6,81)
    guide_r=box(3.4,8,fixed_top-81,ax+24,6,81)
    # Central micrometer support bridge at the front. Bore axis is Z.
    drive_support=box(40,12,6,ax,18,119).cut(vz(4.4,6.2,ax,22,118.9))
    vc13=base.fuse(left,right,rear,guide_l,guide_r,drive_support).clean()
    add('A','A03','GCM_VC13M_VENDOR_OPEN_FRAME_65x65_13mm_CROSSED_ROLLER',vc13,'D')

    moving=box(65,65,7,ax,0,fixed_top)
    for sign in (-1,1):
        moving=moving.fuse(box(3.4,8,28,ax+sign*27.7,6,vc13_lower_top-28))
    add('A','A03T','VC13M_OUTPUT_LOWER_ENDPOINT_119p5mm_PAIR_HEIGHT',
        moving.clean(),'C')

    # Central vertical spindle and drum stay within the 65mm footprint
    # (scene local depth +22mm), unlike the old +40mm invented external wall.
    add('A','A03M','VC13M_CENTRAL_VERTICAL_MICROMETER_STEM_VENDOR_TOPOLOGY',
        vz(2.8,24,ax,22,109),'P')
    add('A','A03K','VC13M_CENTRAL_VERTICAL_MICROMETER_DRUM_VENDOR_TOPOLOGY',
        vz(6.8,20,ax,22,133),'P')
    # Photo94: 40mm-wide front silhouette has TWO ~20mm thick
    # independent sections. Upper is visibly marked GCM-G40M60L.
    # Lower has its own rightward micrometer; G40M40L is a manufacturer
    # pairing comparison ONLY, not yet readable from the user photo.
    # The older one-piece A04 envelope was 20mm too short.
    add('A','A04L','GCM_G40M40L_VENDOR_PAIRING_CANDIDATE_R40_PM7_NOT_PHOTO_CONFIRMED',
        box(40,40,20,ax,0,159.5),'C')
    # Photos195/196: lower angular drive is on the opposite lateral
    # side from the upper labelled G40M60L. Reject the previous +Y/depth
    # end-on proxy that rendered as a false front circular knob.
    add('A','A04LS','LOWER_G40_LEFT_SIDE_DRIVE_SUPPORT_PHOTO195_196',
        box(16,29,15,ax-24,0,167.5),'C')
    # vx() uses its x coordinate as the START of the +X cylinder,
    # so a physical -X drive is created by starting further left and ending
    # at the engaged support/body interface.
    add('A','A04LM','LOWER_G40_MINUS_X_MICROMETER_PHOTO195_196',
        vx(5.5,18,ax-36,0,169.5),'C')
    add('A','A04LK','LOWER_G40_MINUS_X_KNOB_PHOTO195_196',
        vx(8.3,20,ax-53,0,169.5),'C')
    add('A','A04','UPPER_G40M60L_LABEL_PHOTO94_40x40x20',
        box(40,40,20,ax,0,179.5),'P')
    add('A','A04M','UPPER_G40M60L_right_micrometer_photo191_196',
        vx(5,22,ax+20,0,189.5),'P')
    add('A','A04K','UPPER_G40M60L_right_knob_photo191_196',
        vx(8.5,15,ax+42,0,189.5),'P')
    # V130: photo 1 fixes the canonical installed orientation. Build one
    # left-handed local transfer end; the complete film branch is rigid-yawed
    # 180 degrees for the installed STEP. Photo 5 replaces the old GCM-13
    # side-pressure guess with a short upper plate, lower blade and TWO
    # vertical wing screws whose centre line follows the 26mm glass short edge.
    leg_len=85.3
    leg_bottom=199.5-leg_len
    bracket_leg_x=ax-60+1.25
    screw_x=bracket_leg_x-8
    screw_y=(-6.5,6.5)

    # Upper folded foot: 32 x 26 x 2.5, with two real vertical clearance bores.
    foot=box(32,26,2.5,bracket_leg_x-16,0,leg_bottom)
    foot=cut(foot,[(screw_x,yy) for yy in screw_y],3.6,2.5,leg_bottom)
    sheet=box(87,12,2.5,ax-16.5,0,199.5).fuse(
        box(2.5,12,leg_len,bracket_leg_x,0,leg_bottom),foot)
    add('A','A05','PHOTO1_CANONICAL_LEFT_LOCAL_BENT_SHEET_WITH_VERTICAL_WING_BORES',
        sheet,'C')
    for n,dx in enumerate((-14,14),1):
        add('A',f'A05S{n}','two_candidate_sheet_top_fastener_heads',
            vz(3.1,2,ax+dx,0,202.0),'C')

    # Glass inserts 12mm beyond the folded leg and is sandwiched between
    # the upper foot and a thin lower clamp blade. Local -X becomes world +X
    # after the canonical 180° installation, so the PDMS work end faces right.
    glass_near=bracket_leg_x-12
    glass_center_x=glass_near-38
    glass_bottom=leg_bottom-1
    clamp_center_x=glass_near-14
    lower_blade=box(40,26,1.5,bracket_leg_x-20,0,leg_bottom-2.5)
    add('A','A05C','PHOTO5_LOWER_CLAMP_BLADE_UNIDENTIFIED_OEM',
        lower_blade,'C')

    # Two VERTICAL screw shafts: STEP Z == viewer Y. Their centres differ
    # along STEP Y == viewer Z, parallel to the 26mm glass short edge.
    for n,yy in enumerate(screw_y,1):
        shank=vz(1.4,10,screw_x,yy,leg_bottom-4.5)
        hub=vz(3.0,3,screw_x,yy,leg_bottom+5.5)
        wings=[]
        for sgn in (-1,1):
            ear=box(6.5,3.2,2.2,screw_x+sgn*3.25,yy,leg_bottom+7.4)
            # User fig.5: butterfly ears rise away from the vertical shaft.
            ear=ear.rotate(
                (screw_x,yy,leg_bottom+8.5),
                (screw_x,yy+1,leg_bottom+8.5),
                -sgn*33.2)
            wings.append(ear)
        add('A',f'A05CS{n}',
            'PHOTO5_VERTICAL_WING_SCREW_RAISED_BUTTERFLY_EARS_PAIR_LINE_PARALLEL_GLASS_SHORT_EDGE',
            shank.fuse(hub,*wings),'C')

    # Hidden comparison study only. It is excluded from the installed STEP.
    study_z=glass_bottom-12
    g1302_fixed=box(60,14,24,clamp_center_x,-6,study_z)
    g1302_moving=box(60,7,24,clamp_center_x,9.5,study_z)
    g1302_solids=[g1302_fixed,g1302_moving]
    for xx in (clamp_center_x-15,clamp_center_x+15):
        g1302_solids.append(vy(2.5,29,xx,12,glass_bottom))
        g1302_solids.append(vy(5,10,xx,40,glass_bottom))
    g1302_study=cq.Compound.makeCompound(g1302_solids)
    add('A','A05C1302',
        'GCM_1302M_VENDOR_SILHOUETTE_STUDY_NOT_INSTALLED_AFTER_PHOTO5',
        g1302_study,'C')

    add('A','A05G','installed_standard_76x26x1mm_glass_CANDIDATE',
        box(76,26,1,glass_center_x,0,glass_bottom),'C')
    add('A','A05GP','PDMS_8x8x1p8_transfer_stamp_installed',
        box(8,8,1.8,glass_near-68,0,glass_bottom-1.8),'C')
    # Photos137/161 show a separate Daheng GCM-5306M 8mm mounting base.
    base=box(112,70,8,cx,0,20)
    # Real Ø6.5 clearance holes, four grid-aligned M5 candidate bolts.
    # The 112x70x8 OEM outline is genuine; this bolt pattern is NOT
    # asserted to be the manufacturer's hole map.
    abolt=[(x,y) for x in (50,100) for y in (-25,25)]
    base=cut(base,abolt,6.5,8,20)
    base=cut(base,abolt,9,2.5,25.5)
    add('A','A16','GCM5306M_112x70x8_BASE_TRUE_CLEARANCE_BORE_CANDIDATE',base,'D')
    for i,(x,y) in enumerate(abolt,1):
        screw=vz(2.5,16,x,y,12).fuse(vz(4.25,2.5,x,y,25.5))
        add('A',f'A16S{i}','A16_to_single_A01_grid_anchor_CANDIDATE',screw,'C')
    # V137: user confirmed A02 crossed XY, A06 lock-only rotary.
    # Combined height = 8 + 21 + 33 + 28 = 90mm above board.
    rot('A','A06',cx,0,28,'I',radius=33,lock_radius=4.5)
    # V116: uninstalled GCM-1102M vendor-envelope study. The published
    # Ø66 x 21 mm stage is placed on the same A16 top plane as A06.
    # A 32 x 32 x 2 mm top platform is embedded flush within the 21 mm
    # envelope. No adapter/spacer is fabricated; the resulting 12.2 mm
    # air gap to the existing A02 exposes the unresolved stack conflict.
    g1102=vz(33,21,cx,0,28).fuse(box(32,32,2,cx,0,47))
    add('A','A06GCM1102',
        'GCM_1102M_VENDOR_ENVELOPE_STUDY_O66_H21_PLATFORM32_NOT_INSTALLED',
        g1102,'C')
    # Removed A06C/A06D. The second long micrometer is A02 Y, not A06.
    # V48 photos17/18 show the 65mm silver top at ~90mm ABOVE THE
    # 20mm-thick board TOP, not 90mm absolute from model origin.
    # V136 user-confirmed: the central gold/tan 7mm layer is WOOD
    # insulation, separate from the upper silver metal and heater.
    # A02 crossed XY ends at z82; lower9 + wood7 + top12 =>110mm.
    add('A','A32','LOWER_SUPPORT_SEPARATE_PART_65x65x9',
        box(65,65,9,cx,0,82.0),'C')
    add('A','A31','WOOD_INSULATING_BOARD_65x65x7_USER_CONFIRMED',
        box(65,65,7,cx,0,91.0),'C')
    # V136: A07 is ONLY the upper metal. A26/A27 sit between A31 WOOD
    # and the underside pocket; suction bore is an immobile void in A07.
    # V135: a real bored chuck, not a solid silver ornament.
    # Underside Ø38.6-square heater pocket, two power through-galleries,
    # separate sensing gallery and an intersecting vertical-to-rear
    # vacuum duct. All dimensions are candidates inherited from B function.
    a07_top=box(65,65,12,cx,0,98.0)
    a07_pocket=box(38.6,38.6,5.4,cx,0,98.0)
    vacuum_vertical=vz(.7,5.5,cx,0,104.6)
    vacuum_lateral=vy(1.1,33.5,cx,-33,105.5)
    heater_bores=[vy(1.25,13.6,cx+x,-32.5,100.2) for x in (10,16)]
    sensor_bore=vy(.75,13.6,cx-10,-32.5,103.1)
    a07_top=a07_top.cut(a07_pocket,vacuum_vertical,vacuum_lateral,
                        sensor_bore,*heater_bores)
    a07_holes=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    a07_top=cut(a07_top,a07_holes,6.5,2.5,107.5)
    add('A','A07','CHUCK_REAL_VERTICAL_SUCTION_BORE_TO_REAR_AND_HEATER_POCKET_CANDIDATE',
        a07_top,'C')
    for i,(xx,yy) in enumerate(a07_holes,1):
        # Heads only: do not claim unknown buried screw threads.
        add('A',f'A07S{i}','silver_top_four_VISIBLE_HEAD_only_CANDIDATE',
            vz(2.9,1.8,xx,yy,107.6),'C')
    # Bore outlets are aligned with actual modeled heater/probe paths;
    # no copper wires should emerge from a monolithic solid wall.
    for i,(xx,zz,bore) in enumerate(((cx+10,100.2,1.25),
        (cx+16,100.2,1.25),(cx-10,103.1,.75)),1):
        ring=vy(3.1,3,xx,-35.5,zz).cut(vy(bore,3.2,xx,-35.6,zz))
        add('A',f'A07P{i}','A07_DRILLED_REAR_ELECTRICAL_FEEDTHROUGH_CANDIDATE',ring,'C')
    # Embedded heater is physically constrained by the pocket and retains
    # a small 0.2mm underside/top-wall fit; wattage remains unknown.
    add('A','A26','CERAMIC_HEATER_EMBEDDED_IN_A07_38x38x5_CANDIDATE',
        box(38,38,5,cx,0,98.2),'C')
    for i,x in enumerate((10,16),1):
        add('A',f'A26T{i}','HEATER_TERMINAL_AT_POCKET_REAR',
            box(1.6,1.4,1,cx+x,-19.7,99.7),'C')
        add('A',f'A26L{i}','HEATER_INTERNAL_LEAD_THROUGH_REAR_BORE',
            vy(.55,13.5,cx+x,-32.5,100.2),'C')
    add('A','A27','SEPARATE_TEMPERATURE_CONTACT_CANDIDATE',
        vz(.45,.18,cx-10,0,103.21),'C')
    add('A','A27L','SENSOR_LEAD_IN_MILLED_REAR_BORE',
        vy(.45,32.5,cx-10,-32.5,103.1),'C')
    # Real open annular rear fitting mates to the upper transverse duct.
    a28=vy(3.5,11,cx,-43.5,105.5).cut(vy(1.1,11.2,cx,-43.6,105.5))
    add('A','A28','REAR_OPEN_VACUUM_FITTING_UNVERIFIED_THREAD_SEAL',a28,'C')
    # Photo191/193: front slotted adjustment plate and visible screws.
    a07_front=box(36,2,18,cx,33.5,91).cut(box(18,2.2,3,cx,33.5,92))
    add('A','A07F','sample_stage_front_slotted_adjust_plate_photo191_candidate',a07_front,'C')
    add('A','A07FA','sample_stage_front_adjustment_shaft_candidate',vy(2.4,5,cx,34.5,92),'C')
    add('A','A07FB','sample_stage_front_adjustment_knob_candidate',vy(4.5,2,cx,39.5,92),'C')
    for i,xx in enumerate((cx-12,cx+12),1):
        add('A',f'A07FS{i}','sample_stage_front_plate_lower_screw_candidate',vy(2.1,2,xx,34.5,84),'C')
    # V58: viewer always contains this 28x28x1.4mm sample-chip proxy;
    # prior STEP omitted it and would falsely put the PDMS into metal.
    add('A','A07W','sample_chip_28x28x1p4_THICKNESS_UNVERIFIED',
        box(28,28,1.4,cx,0,110.0),'C')
    # V45: previous STEP A10 post started at Z=32 and floated 12mm
    # above the only A01 board top (Z=20). A single connected base
    # and post now match the web viewer mounting arrangement.
    # V46: four physically pierced Ø5.5mm clearance holes in A10 FOOT
    # and matching M5 candidate bolts into the 25mm A01 *photo-fit*
    # board grid. Unlike the V45 foot, bolt heads are not drawn on
    # undrilled solid metal. Foot and post centers need not coincide.
    # OEM support SKU, thread engagement and capacity remain unverified.
    a10_foot_center=(75,-100)
    a10_anchors=[(xx,yy) for xx in (50,100) for yy in (-125,-75)]
    microscope_a_foot=box(72,65,14,*a10_foot_center,20)
    microscope_a_foot=cut(microscope_a_foot,a10_anchors,5.5,14,20)
    microscope_a_foot=cut(microscope_a_foot,a10_anchors,9,2.5,31.5)
    microscope_a_post=vz(13,372,cx,-112,33)
    add('A','A10','imaging_column_WITH_4_M5_CANDIDATE_BORE_FOOT',
        microscope_a_foot.fuse(microscope_a_post))
    for i,(xx,yy) in enumerate(a10_anchors,1):
        screw=vz(2.5,17.5,xx,yy,14).fuse(vz(4.25,2.5,xx,yy,31.5))
        add('A',f'A10S{i}','A10_M5x17p5_GRID_ANCHOR_CANDIDATE',screw,'C')
    # V69: A10 stationary Ø26 post previously pierced the solid boom.
    # Candidate Ø26.6 real clearance through-hole: center registered to post.
    # V74: after registering the post Ø26.6 through-bore, the old
    # 125mm forward boom still penetrated 37.5mm into the A18 casing.
    # Terminate the support at its rear face (Y=-44). A10 column
    # remains at Y=-112 with a through hole; these are scene candidates.
    boom=box(34,38,25,cx,-111,207.5).cut(vz(13.3,25.2,cx,-112,207.4))
    # V142: candidate split clamp carries radial screws outside the Ø26 post.
    boom_collar=vz(19.5,15,cx,-112,211.5).cut(vz(13.3,15.2,cx,-112,211.4))
    boom=boom.fuse(boom_collar).clean()
    for dz in (-8,8):
        boom=boom.cut(vx(2.6,8.5,cx+13.5,-112+dz,219))
    boom=boom.clean()
    add('A','A10A','imaging_boom_WITH_POST_BORE_AND_RADIAL_CLAMP',boom,'C')
    for i,dz in enumerate((-8,8),1):
        clamp_bolt=vx(2.5,9,cx+14,-112+dz,219).fuse(
            vx(4,2.6,cx+22.9,-112+dz,219)).clean()
        add('A',f'A10K{i}','RADIAL_CLAMP_FASTENER_CANDIDATE',clamp_bolt,'C')
    # V59: photo191–193 show a taller camera/microscope stack; no ruler is present.
    add('A','A08','TTL200A_nominal_28mm_housing_CANDIDATE',
        vz(26,28,cx,0,235),'D')
    add('A','A09','Daheng_camera',box(50,44,45,cx,0,323),'P')
    # V79: Thorlabs MWWHL4. Use vendor-constrained Ø30.5mm finned
    # housing and SM1 mounting interface; REMOVE the invented gooseneck
    # that made a black cylinder appear to hang below the microscope.
    # V89: shift the complete MWWHL4 + optional SM1RC-style ring 22mm
    # outboard. This removes the V87-detected solid overlap with the right
    # focus controls without inventing an unsupported mechanical bracket.
    # Exact mounting hardware and final physical offset remain unverified.
    led_root_x=cx+96
    led_z=220
    # V133: assign the SM1RC-compatible slip ring to the physical A21 mount,
    # not to the light emitter itself. OEM ring compatibility is grounded;
    # its installation position is a candidate.
    slip_outer=vx(18,6,led_root_x+10.5,0,led_z)
    slip_inner=vx(15.35,6.2,led_root_x+10.4,0,led_z)
    a21_ring=slip_outer.cut(slip_inner).cut(vz(1.8,5,187.5,0,235.25))
    add('A','A21R','SM1RC_RING_WITH_REAL_RADIAL_CLAMP_BORE_CANDIDATE',a21_ring,'C')
    add('A','A21RK','RING_RADIAL_SET_SCREW_AND_HEAD_UNVERIFIED',
        vz(1.6,9,187.5,0,235.25).fuse(vz(4,3,187.5,0,243.5)),'C')
    # Thorlabs MWWHL4 drawing MTN006388: Ø30.5 x 60.1 mm total envelope.
    led=vx(15.25,60.1,led_root_x+6,0,led_z)
    for q in [10+4.8*i for i in range(11)]:
        led=led.fuse(vx(15.75,1.1,led_root_x+q-.55,0,led_z))
    add('A','A11','MWWHL4_OEM_O30p5_x_60p1_SM1_DEPTH6',
        led,'D')
    # Emitter face stays inside the documented 60.1mm housing envelope.
    add('A','A11E','MWWHL4_emitter_face_WITHIN_OEM_ENVELOPE',
        vx(10.8,.2,led_root_x+65.9,0,led_z),'C')
    led_cable=cable_path([
        (led_root_x+43,0,led_z-14),
        (led_root_x+44,3,led_z-22),
        (led_root_x+48,8,led_z-30),
        (led_root_x+55,12,led_z-38)],2.2)
    add('A','A11C','MWWHL4_ELECTRICAL_CABLE_NOT_MECHANICAL_SUPPORT',
        led_cable,'C')
    # V133 external controls stand on the common floor datum (Z=0),
    # not floating 20mm above a board that does not reach their X.
    # LEDD1B OEM height/depth are 73/104 mm (not reversed).
    add('A','A12','LEDD1B_OEM_60_W_104_D_73_H',
        box(60,104,70,262,-80,3),'D')
    add('A','A12F','LEDD1B_SLOTTED_BASE_CANDIDATE',
        box(80,124,3,262,-80,0),'C')
    add('A','A12K','LEDD1B_TOP_INTENSITY_KNOB',
        vz(14,12,262,-79,74),'D')
    add('A','A12L','LEDD1B_FRONT_CURRENT_LIMIT_DIAL',
        vy(8,2.5,262,-29.2,43),'D')
    a12_socket=vy(5,5,262,-135,42).cut(vy(2.2,5.2,262,-135.1,42))
    add('A','A12LED','LEDD1B_REAR_M8_LED_PORT_HOUSING_CANDIDATE',a12_socket,'C')
    # V141: PID cabinet + all enclosed/service electrical interfaces move
    # +80mm along global X. Pump and LEDD1B remain untouched.
    pid_dx=80
    add('A','A13','DELIXI_SSR',box(75,64,33,260+pid_dx,72,0),'P')
    for idx,x in enumerate((253,271),1):
        a13_shell=vy(3.4,4,x+pid_dx,36,18).cut(vy(1.4,4.2,x+pid_dx,35.9,18))
        add('A',f'A13P{idx}','SSR_REAR_SERVICE_REGION_NOT_WIRING_TERMINAL',a13_shell,'C')
    # Independently grounded LED holder: four real candidate base bores,
    # post and bridge, telescoping collar and one SM1RC-type ring.
    a21_foot=box(36,36,8,187.5,-87.5,20)
    a21_anchors=[(x,y) for x in (175,200) for y in (-100,-75)]
    a21_foot=cut(a21_foot,a21_anchors,5.4,8,20)
    a21_base=a21_foot.fuse(vz(6,191,187.5,-87.5,28))
    add('A','A21','LED_STAND_FOOT_AND_POST_UNVERIFIED_RECONSTRUCTION',a21_base,'C')
    for i,(xx,yy) in enumerate(a21_anchors,1):
        bolt=vz(2.5,14,xx,yy,14).fuse(vz(4.25,2.5,xx,yy,28))
        add('A',f'A21S{i}','FOUR_CANDIDATE_FOOT_M5_ANCHORS_ON_A01_GRID',bolt,'C')
    a21_collar=vz(10,14,187.5,-87.5,187).cut(
        vz(6.1,14.2,187.5,-87.5,186.9)).cut(vx(2.1,8,193.5,-87.5,194))
    add('A','A21C','LED_STAND_COLLAR_WITH_REAL_RADIAL_LOCK_BORE',a21_collar,'C')
    add('A','A21CK','RADIAL_POST_LOCK_SCREW_AND_HEAD_CANDIDATE',
        vx(2,12,193.5,-87.5,194).fuse(vx(4.5,4,203.5,-87.5,194)),'C')
    # Before V134 the bar merely touched the lug at z=199, zero area overlap.
    add('A','A21B','LED_STAND_ENGAGED_RIGID_BRIDGE_CANDIDATE',
        vy(5,87.5,187.5,-87.5,198),'C')
    add('A','A21L','LED_RING_BRIDGE_LUG_CANDIDATE',box(10,12,12,187.5,0,199),'C')
    add('A','A22','MWWHL4_TO_LEDD1B_FLEXIBLE_SERVICE_CABLE',
        cable_path([(229,12,182),(232,-14,184),(235,-64,163),
                    (240,-120,104),(261,-142,54),(262,-133,42)],2.2),'C')
    add('A','A23H1','A26_HEATER_LEAD_1_TO_SSR_NEIGHBOURHOOD_UNWIRED',
        cable_path([(88,-32.5,100.2),(88,-43,100.2),(106,-59,124.2),
                    (162,-41,120),(306,-24,120),(333,40,18)],1.2),'C')
    add('A','A23H2','A26_HEATER_LEAD_2_TO_RETURN_NEIGHBOURHOOD_UNWIRED',
        cable_path([(94,-32.5,100.2),(94,-44,100.2),(112,-61,128.2),
                    (171,-36,127),(313,-18,122),(351,40,18)],1.2),'C')
    add('A','A24','A27_TEMPERATURE_FEEDBACK_NOT_ASSUMED_K_TYPE',
        cable_path([(68,-32.5,103.1),(68,-43,103.1),(102,-62,132.2),
                    (181,-31,136),(337,-6,123),(385,25,14)],.78),'C')
    add('A','A25','TEMPERATURE_SERVICE_TERMINAL_NOT_A_CONTROLLER',
        box(28,20,14,305+pid_dx,25,0),'C')
    a25_port=vz(3,2,305+pid_dx,25,14).cut(vz(1,2.2,305+pid_dx,25,13.9))
    add('A','A25P','TEMPERATURE_SERVICE_TERMINAL_ENTRY_CANDIDATE',a25_port,'C')
    # V138 actual pump BODY instead of a fake endpoint box; use B20
    # VN-50 only as a generic reference, never a confirmed Platform A SKU.
    vacuum_path_A=[(78,-43.5,105.5),(78,-55,108),(116,-75,114),
                   (166,-162,88),(280,-215,88),(356,-219,77),
                   (423.6,-190,68)]
    add('A','A29','A28_TO_A30_PUMP_REFERENCE_HOLLOW_HOSE',
        hollow_hose(vacuum_path_A,3.5,2.2),'C')
    pump_base=box(200,110,8,340,-190,0)
    pump_motor=vx(44,150,265,-190,50)
    add('A','A30','VN50_FAMILY_PUMP_SHAPE_REFERENCE_ACTUAL_A_SKU_UNKNOWN',
        pump_base.fuse(pump_motor).clean(),'C')
    for i,x in enumerate((305,380),1):
        add('A',f'A30H{i}','A_PUMP_TWIN_HEAD_CANDIDATE',
            box(42,42,36,x,-190,96),'C')
    for i,x in enumerate((269,411),1):
        for j,y in enumerate((-238,-142),1):
            add('A',f'A30F{i}{j}','A_PUMP_MOUNT_FOOT_CANDIDATE',
                box(28,14,12,x,y,8),'C')
    add('A','A30P','UNVERIFIED_G1_4_REFERENCE_HOLLOW_PUMP_INLET',
        vx(6.58,2.2,422.5,-190,68).cut(
            vx(5.9,2.4,422.4,-190,68)),'C')
    # A33 external PID cabinet. OEM controller and wiring remain unknown.
    cabinet_bottom=box(154,148,5,260+pid_dx,95,0)
    cabinet_l=box(4,142,154,185+pid_dx,95,5)
    cabinet_r=box(4,142,154,335+pid_dx,95,5)
    cabinet_top=box(154,148,4,260+pid_dx,95,156)
    cabinet_face=box(150,4,150,260+pid_dx,168,5)
    add('A','A33','TEMP_CABINET_HOUSING_UNVERIFIED_OEM',
        cabinet_bottom.fuse(cabinet_l,cabinet_r,cabinet_top,cabinet_face).clean(),'C')
    add('A','A33PID','TWO_READOUT_PID_CONTROLLER_FACE_CANDIDATE',
        box(102,5,96,260+pid_dx,172,60),'C')
    add('A','A33PV','PROCESS_READOUT_DISPLAY_PROXY',
        box(76,1.6,22,260+pid_dx,176,113),'C')
    add('A','A33SV','SETPOINT_READOUT_DISPLAY_PROXY',
        box(76,1.6,18,260+pid_dx,176,88),'C')
    # TTL200-A uses EXTERNAL SM2 both ends. A14 remains an OPEN
    # candidate mating sleeve until the real adapter stack is identified.
    sleeve_A14=vz(28,66,cx,0,257).cut(vz(26.1,66.2,cx,0,256.9))
    add('A','A14','UNKNOWN_SM2_MATING_OPTICAL_TUBE_66mm_CANDIDATE',sleeve_A14,'C')

    # V92 A18: photos191/193 show the optical axis lies near the LEFT side
    # of the black housing rather than at its geometric center. Keep optical
    # collars/turret/objectives at cx and shift only housing/focus controls
    # +24 mm in X. This is a photo-ratio candidate, not a ruler measurement.
    # The rear Y=-44 mounting plane still mates to A10 over a real overlap.
    # MGZ30 is comparison-only; MCT-LMP2 direct identity is rejected by its
    # 211.5x130x58.8mm vendor envelope and dense front-hole pattern.
    # A 34mm-wide continuous internal/rear spine overlaps all three
    # stepped shells. This prevents STEP export from degenerating into three
    # merely face-touching solids while leaving the external silhouette unchanged.
    a18_body_x=cx+24
    a18_core=box(34,88,70,a18_body_x,-48,165)
    a18_body=(a18_core
              .fuse(box(70,88,18,a18_body_x,-48,165),
                    box(84,88,38,a18_body_x,-48,179),
                    box(76,88,14,a18_body_x,-48,221)).clean())
    # Real open Ø20 vertical optical clearance (unmeasured candidate).
    # V144: axial light path is IN FRONT OF, not THROUGH, the focus gearbox.
    # Do not put a fabricated Ø20 bore through an unidentified focus block.
    # Open front-edge notch, NOT an invented closed axial hole through drive
    # mechanics. Its 24mm span clears an illustrative Ø20 optical cylinder
    # centred on sample X=78, lateral Y=0. Geometry remains candidate only.
    # V145: unlike V144's incorrect narrow relief at the mechanical side,
    # open the LOWER body's front-left quadrant to the actual 58mm yoke
    # outline. Mid/upper focus housing stays closed and visually box-like.
    a18_body=a18_body.cut(box(92,32,18,cx-14.5,-20,165)).clean()
    # Full-height narrow shaft clearance, independent of the lower
    # 58mm nosepiece yoke. This is an OPEN FRONT notch, not a gearbox bore.
    a18_body=a18_body.cut(box(21,13,70,cx,-7.5,165)).clean()
    add('A','A18','MICROSCOPE_STEPPED_FOCUS_BODY_84x88x70_PHOTO_CANDIDATE',
        a18_body,'C')
    # V145: two STATIONARY cast side webs engage rear gearbox and fixed
    # guides; the lower ONE-PIECE yoke belongs to the MOVING objective slide.
    # No artificial four-bar forest is present in installed STEP geometry.
    add('A','A18FW1','FIXED_LEFT_FOCUS_SIDE_GUSSET_CANDIDATE',
        box(14,70,40,cx-19,18,180),'C')
    add('A','A18FW2','FIXED_RIGHT_FOCUS_SIDE_GUSSET_CANDIDATE',
        box(34,70,36,cx+48,19,185),'C')
    add('A','A18SB','MOVING_NOSEPIECE_YOKE_SPINE_CANDIDATE',
        box(38,56,7,cx+36,27,165),'C')
    saddle_ring=vz(29,7,cx,0,165).cut(vz(18.2,7.2,cx,0,164.9))
    add('A','A18SR','MOVING_NOSEPIECE_BORED_RING_CANDIDATE',
        saddle_ring,'C')
    add('A','A18VR','MOVING_OPTICAL_UPRIGHT_CANDIDATE',
        box(8,10,70,cx+26,8,164),'C')
    add('A','A18UL','MOVING_TOP_INTERFACE_EAR_CANDIDATE',
        box(12,10,8,cx+25,5,226),'C')
    add('A','A18F','RECESSED_FOCUS_FRONT_COVER_CANDIDATE',
        box(32,1.4,44,cx+43,44.7,179),'C')
    # Two guides and wear strips on stationary body, with distinct moving shoes.
    for i,dx in enumerate((-11,59),1):
        x=cx+dx
        add('A',f'A18G{i}','FOCUS_FIXED_GUIDE_RAIL_CANDIDATE',
            box(4,3,47,x,45.5,170.5),'C')
        add('A',f'A18W{i}','FOCUS_GUIDE_WEAR_STRIP_CANDIDATE',
            box(2,1,43,x,47.2,172.5),'C')
    add('A','A18C','FOCUS_MOVING_CARRIAGE_CANDIDATE',
        box(54,7,15,a18_body_x,49,167.5),'C')
    add('A','A18CB','FOCUS_CARRIAGE_OPTICAL_BRIDGE_CANDIDATE',
        box(42,8,12,cx+3,43.5,165),'C')
    add('A','A18AD','FOCUS_OPTICAL_NOSEPIECE_ADAPTER_CANDIDATE',
        box(44,37,5,cx+3,23,163.5),'C')
    for i,dx in enumerate((-7.6,55.6),1):
        add('A',f'A18CW{i}','FOCUS_SLIDING_SHOE_CANDIDATE',
            box(11,2,28,cx+dx,49.4,167),'C')
    add('A','A18T','HOLLOW_TOP_OPTICAL_COUPLER_CANDIDATE',
        vz(22,8,cx,0,227).cut(vz(13.1,8.2,cx,0,226.9)),'C')
    add('A','A18N','HOLLOW_NOSEPIECE_SOCKET_CANDIDATE',
        vz(24,8,cx,0,165).cut(vz(18.1,8.2,cx,0,164.9)),'C')
    # Continuous left/right focus chains: body -> hub -> coarse -> fine.
    add('A','A18HL','LEFT_FOCUS_HUB_PHOTO_CANDIDATE',vx(9,12,a18_body_x-51,-48,200),'C')
    add('A','A18HR','RIGHT_FOCUS_HUB_PHOTO_CANDIDATE',vx(9,12,a18_body_x+39,-48,200),'C')
    add('A','A18FL','LEFT_COARSE_FOCUS_DRUM_PHOTO_CANDIDATE',vx(18,14,a18_body_x-63,-48,200),'C')
    add('A','A18FR','RIGHT_COARSE_FOCUS_DRUM_PHOTO_CANDIDATE',vx(18,14,a18_body_x+49,-48,200),'C')
    add('A','A18FLL','LEFT_FINE_FOCUS_KNOB_PHOTO_CANDIDATE',vx(11,8,a18_body_x-71,-48,200),'C')
    add('A','A18FRL','RIGHT_FINE_FOCUS_KNOB_PHOTO_CANDIDATE',vx(11,8,a18_body_x+63,-48,200),'C')

    # V111: separate, NOT-installed MGZ30 family-topology study.
    # Reuse the current photo-fit main-body envelope and current post center,
    # but replace the independent A10 boom concept with an integral rear bridge
    # and a direct vertical Ø38.1mm post clamp. This is topology comparison,
    # not exact MGZ30 CAD and not evidence that the real post is Ø38.1mm.
    mgz_study_body=box(84,88,70,a18_body_x,0,165)
    # Bilateral coarse/fine focus drums from the official MGZ30 family
    # topology. Detailed knurl/thread profiles remain simplified.
    mgz_knobs=[]
    for sign in (-1,1):
        mgz_knobs.extend((
            vx(9,12,cx+sign*30,0,200),
            vx(18,14,cx+sign*42,0,200),
            vx(11,8,cx+sign*56,0,200)))
    mgz_study_bridge=box(60,43,38,cx+12,-65,181)
    mgz_study_ring=vz(26,18,cx,-112,191).cut(
        vz(19.05,18.2,cx,-112,190.9))
    mgz_cover_screws=[vz(2.2,1.6,cx+dx,dy,234) for dx in (-29,29) for dy in (-29,29)]
    mgz_study=(mgz_study_body.fuse(*mgz_knobs,mgz_study_bridge,
        mgz_study_ring,*mgz_cover_screws).clean())
    add('A','A18MGZ',
        'MGZ30_FAMILY_INTEGRAL_REAR_POST_CLAMP_TOPOLOGY_STUDY_NOT_INSTALLED',
        mgz_study,'C')

    # Only two installed objectives are photo-supported. Do not invent empty ports.
    turret=vz(36,10,cx,0,155)
    for xx in (cx-18,cx+18):
        turret=turret.cut(vz(11.8,10.2,xx,0,154.9))
    add('A','A19','PHOTO_TWO_PORT_NOSEPIECE_REAL_BORE_CANDIDATE',turret.clean(),'C')
    for i,xx in enumerate((cx-18,cx+18),1):
        seat=vz(13.5,3,xx,0,154).cut(vz(11.65,3.2,xx,0,153.9))
        add('A',f'A19P{i}','HOLLOW_OBJECTIVE_SOCKET_CANDIDATE',seat,'C')
    add('A','A19N','MICROSCOPE_OBJECTIVE_TURRET_NECK_PROXY',
        vz(18,5,cx,0,163),'C')
    objective_pivot=Vector(cx-18,0,155)
    objective_axis=Vector(cx-18,1,155)
    left_tilt=lambda sh:sh.rotate(objective_pivot,objective_axis,22.5)
    add('A','A19M1','LEFT_OBJECTIVE_MOUNT_NECK_CANDIDATE',
        left_tilt(vz(10.9,4,cx-18,0,154)),'C')
    add('A','A19M2','CENTER_OBJECTIVE_MOUNT_NECK_CANDIDATE',
        vz(10.9,4,cx+18,0,154),'C')
    left_obj=vz(11.5,14,cx-18,0,141).fuse(
        vz(10,16,cx-18,0,125),
        vz(8.2,9,cx-18,0,116))
    center_obj=vz(11.5,14,cx+18,0,141).fuse(
        vz(10,16,cx+18,0,125),
        vz(8.2,9,cx+18,0,116))
    add('A','A19O1','JHTOP_MPLAN_FAMILY_LEFT_INCLINED_PHOTO_CANDIDATE',
        left_tilt(left_obj),'C')
    add('A','A19O2','PLANFL_FAMILY_CENTER_VERTICAL_TEXT_READING_UNVERIFIED',
        center_obj,'C')
    add('A','A19R1','LEFT_INCLINED_OBJECTIVE_COLOR_BAND_PROXY',
        left_tilt(vz(12.4,2,cx-18,0,124)),'C')
    add('A','A19R2','CENTER_VERTICAL_OBJECTIVE_COLOR_BAND_PROXY',
        vz(12.4,2,cx+18,0,124),'C')
    camera_cable=cable_path([(cx+18,0,368),(cx+22,-18,385),(cx+40,-38,395),
        (cx+62,-40,382),(cx+76,-26,355),(cx+80,-5,330),(cx+76,15,305)],2.4)
    add('A','A20','CAMERA_CABLE_LOOP_ROUTE_PHOTO191_192_CANDIDATE',camera_cable,'C')
CAD_REVISION='V146'
UNINSTALLED_A_STUDY_IDS=frozenset({'A18MGZ','A05C1302','A06GCM1102'})
A_INSTALLED_FILM_CENTER_X=-60.75
def _installed_a_solid(key,shape):
    """V132 installed A: user-facing work geometry excludes hidden vendor studies.
    STEP Z is height, so rotation is around the vertical axis through A15/A17.
    Sample-side A16/A06/A02/A07 and microscope remain stationary.
    """
    if key.startswith(('A17','A15','A03','A04','A05')):
        return shape.rotate(
            Vector(A_INSTALLED_FILM_CENTER_X,0,0),
            Vector(A_INSTALLED_FILM_CENTER_X,0,1),180)
    return shape

def export(sys):
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_'+CAD_REVISION)
    published=[p for p in PARTS[sys] if sys!='A' or p[0] not in UNINSTALLED_A_STUDY_IDS]
    excluded=[p for p in PARTS[sys] if sys=='A' and p[0] in UNINSTALLED_A_STUDY_IDS]
    # The user's B photos distinguish the SILVER common table from the
    # independent BLACK THORLABS board below the sample stage. Preserve
    # that evidence as AP214 STEP assembly colors, not merely part names.
    # Other components retain neutral default STEP color until their
    # manufacturer finishes/geometry are verified.
    evidence_colors={
      'B01':cq.Color(0.73,0.76,0.79),
      'B35':cq.Color(0.10,0.12,0.15)
    }
    for key,name,grade,shape in published:
        props={'name':key+'__'+name}
        if key in evidence_colors: props['color']=evidence_colors[key]
        installed=_installed_a_solid(key,shape) if sys=='A' else shape
        if key=='A05':
            props['name']='A05__photo1_canonical_bent_sheet_vertical_wing_clamp'
        if key.startswith('A05CS'):
            props['name']=key+'__vertical_wing_screw_pair_line_parallel_glass_short_edge'
        assembly.add(installed,**props)
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_'+CAD_REVISION+'.step')
    assembly.save(str(target))
    solids=cq.importers.importStep(str(target)).solids().vals()
    assert len(solids)>=len(published) and all(s.isValid() for s in solids)
    with (target.parent/'part_levels.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['id','component','level'])
        for key,name,grade,_ in published:w.writerow([key,name,grade])
    if excluded:
        with (target.parent/'uninstalled_study_parts.csv').open('w',encoding='utf-8-sig',newline='') as f:
            w=csv.writer(f);w.writerow(['id','description','reason'])
            for key,name,_,_ in excluded:
                w.writerow([key,name,'not installed on user-approved bare A bracket'])
    return dict(system=sys,assembly_components=len(published),
                excluded_uninstalled=[p[0] for p in excluded],
                approved_installed_shape='photo1_canonical_rigid180_with_photo5_vertical_wing_clamp' if sys=='A' else 'manufacturer_and_photo_B',
                photo_A_stage_center_x_mm=A_INSTALLED_FILM_CENTER_X if sys=='A' else None,
                study_solids_available=len(PARTS[sys]),step_solids=len(solids),
                size_bytes=target.stat().st_size)
if __name__=='__main__':
    make_a();make_b()
    info=[export(x) for x in ('A','B')]
    (OUT/'verification.json').write_text(json.dumps(info,indent=2))
    print(info)
