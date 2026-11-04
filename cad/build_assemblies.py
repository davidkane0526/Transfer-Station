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
def stage(sys,key,x,y,z,direction='+X',axes=1,depth_direction='+Y'):
    """Vendor-dimension constrained GCM-T25M stages. XY double stack = 33mm.
    2 orthogonal micrometer assemblies are mandatory for -T25M2L/-2C.
    Exact screw-boss detailing requires manufacturer's native CAD.
    """
    assert direction in ('+X','-X') and axes in (1,2)
    assert depth_direction in ('+Y','-Y')
    if axes==2:
        add(sys,key,'lower_fixed_11mm',box(65,65,11,x,y,z),'D')
        add(sys,key+'M','crossed_X_carriage_11mm',box(63,63,11,x,y,z+11),'D')
        add(sys,key+'A','crossed_Y_carriage_11mm',box(62,62,11,x,y,z+22),'D')
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
        if depth_direction=='+Y':
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y+32.5,z+5.5),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y+72.5,z+5.5),'D')
        else:
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y-72.5,z+5.5),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y-86.5,z+5.5),'D')
def rot(sys,key,x,y,z,grade):
    add(sys,key,'rotary_lower',vz(47,23,x,y,z),grade)
    top=vz(47,10.2,x,y,z+23)
    top=cut(top,[(x+dx,y+dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,8,z+25.2)
    add(sys,key+'A','rotary_top_9_M6_25',top,grade)
    # Operator-facing rotary lock shown in 111.jpg / 100.jpg.
    add(sys,key+'B','operator_side_rotary_lock',vy(8,30,x,y+47,z+12))
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
    stub=[(82,-44.5,107.5),(82,-58,108.5),
          (83,-70,104.5),(94,-79,90.5)]
    add('B','B15T','vacuum_short_flexible_hollow_stub_CANDIDATE',
        hollow_hose(stub),'C')
    for n,xx in enumerate((10,15),1):
        add('B',f'B12L{n}',f'rear_heater_wire_{n}_PROXY',vy(.55,40.5,cx+xx,cy-59.5,z+2.5))
    add('B','B13L','rear_thermocouple_wire_PROXY',vy(.34,59.5,cx+6,cy-59.5,z+5.85))
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
    post_len=100;holder_len=50
    upper_rod_z=168;lower_rod_z=135
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
    # The old PHSP12-1 25mm post cannot pass through BOTH the ~50mm
    # sleeve and the distinct upper square clamp. Try OEM 100mm size;
    # end thread and installed insertion depth remain photo candidates.
    add('B','B27','photo149_vertical_O12x100_PHSP12-4_candidate',
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
    phuc=vz(15,60,phuc_x,0,121.5)
    phuc=phuc.cut(vx(6.05,32,phuc_x-16,0,upper_rod_z))
    phuc=phuc.cut(vx(6.05,32,phuc_x-16,0,lower_rod_z))
    groove=vz(15.1,1,phuc_x,0,151.5).cut(vz(13,1,phuc_x,0,151.5))
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
    jaw_shift=20.5
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
    fixed_spine=box(14.5,56,18.5,clamp_x-8.25,0,121)
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
    # 250x300x12 remains a PHOTO-FIT candidate; MB2530/M standard
    # 250x300x12.7 cannot yet be asserted as the exact hardware.
    black=box(250,300,12,65,0,20)
    photo_holes=[(65+dx,dy) for dx in range(-100,101,25) for dy in range(-125,126,25)]
    black=cut(black,photo_holes,5.6,2,30)
    # B35 is NOT another shared optical breadboard. It is a
    # local Thorlabs accessory panel with FOUR candidate M5 anchors
    # into the already-existing B01 grid (25mm alignment). Exact OEM
    # mount centres, thread engagement and safety are unverified.
    bolts=[(x,y) for x in (25,175) for y in (-100,100)]
    black=cut(black,bolts,6.5,12,20)
    black=cut(black,bolts,9,3,29)
    add('B','B35','THORLABS_BLACK_BOLTED_AUXILIARY_PANEL_NOT_SECOND_BASE',black,'P')
    for i,(x,y) in enumerate(bolts,1):
        screw=vz(2.5,21,x,y,11).fuse(vz(4.25,2.6,x,y,29.4))
        add('B',f'B35S{i}','ONE_M5_BASEGRID_ALIGNED_ANCHOR_CANDIDATE',screw,'C')
    rot('B','B08',cx,0,32,'D')
    corners=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    # Manufacturer PDF (NFP-1462C) specifies four Ø6.5 clearance
    # holes with Ø11 counterbore on fixed-stage view (50mm square).
    # They are NOT M6 tapped holes and should not be modeled as threads.
    lo=cut(box(65,65,11,cx,0,65.2),corners,6.5,11,65.2)
    lo=cut(lo,corners,11,4,72.2)
    add('B','B09','NFP1462C_lower_4clearance_O6p5_counterbore_O11',lo,'D')
    # Opposite view shows 9-M6 / 4-M3 threaded-hole arrays on the moving plate.
    # Minor diameters and 10mm/7mm hole DEPTHS are candidates, not OEM data.
    top=box(65,65,12,cx,0,76.2)
    top=cut(top,[(cx+dx,dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,10,78.2)
    top=cut(top,[(cx+dx,dy) for dx in (-16,16) for dy in (-16,16)],2.5,7,81.2)
    add('B','B09A','NFP1462C_upper_9M6_4M3_candidates',top,'D')
    # OEM drawing: native micrometer left. The user photo110 shows right
    # after whole-stage installation yaw=180° relative to native plan.
    # OEM overall maker dimension: 155.5..180.5 mm along drive axis.
    add('B','B09B','NFP_micro_extended_world_RIGHT',vx(4,76,cx+33,0,76.5),'D')
    add('B','B09C','NFP_micro_drum_world_RIGHT',vx(10,25,cx+109,0,76.5),'D')
    heater()
    # Photo150: the rear microscope FOOT shares B35 with the rotary,
    # so it must be translated UP by the same 12mm support thickness.
    # Do not lift only the sample, leaving a floating microscope arm.
    microscope_rise=12
    add('B','B16','microscope_column_PROXY',
        vz(13,240,cx,-112,32+microscope_rise))
    # V35: four TRUE through-bores for the proposed microscope foot
    # fastener layout. 4mm diameter and 50mm pitch are CANDIDATES,
    # not photo-verified, and the B35 photo-fit blind holes do NOT
    # establish a working threaded anchor.
    microscope_foot=box(65,65,12,cx,-112,20+microscope_rise)
    foot_bores=[(cx+dx,-112+dy) for dx in (-25,25) for dy in (-25,25)]
    microscope_foot=cut(microscope_foot,foot_bores,4,12,20+microscope_rise)
    add('B','B16A','microscope_base_4_TRUE_O4_through_bores_CANDIDATE',
        microscope_foot,'C')
    add('B','B16B','microscope_boom',
        box(35,132,26,cx,-52,259+microscope_rise))
    add('B','B16C','microscope_body',
        box(55,55,50,cx,0,224+microscope_rise))
    add('B','B16D','objective_tube_mount',
        vz(17,44,cx,0,186+microscope_rise))
    add('B','B18','objective',
        vz(12.5,38,cx,0,162.0+microscope_rise))
    add('B','B18A','objective_tip',
        vz(7,12,cx,0,150.0+microscope_rise))
    add('B','B17','digital_camera',
        box(47,48,48,cx,0,276+microscope_rise))
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
       [(93,-60,98.5),(119,-92,104),(174,-140,100),
        (207,-165,94),(222.5,-168,84),
        (225,-168,84),(235,-154,72),(237,-125,44),
        (251,-117,25),(255,-116,19.7)]),
      ('B37A','heater_B_unverified_power_lead',1.1,
       [(98,-60,98.5),(119,-97,109),(174,-146,106),
        (207,-171,99),(222.5,-167,87),
        (225,-167,87),(235,-151,75),(237,-128,49),
        (252,-118,26),(265,-116,19.7)]),
      ('B38','temperature_feedback_unverified_pinout',.72,
       [(88,-51,100.35),(119,-102,114),(174,-152,112),
        (207,-177,104),(222.5,-163,89),
        (225,-163,89),(235,-150,103),(265,-120,108),
        (310,-83,100),(349,-43,78)])
    ]
    for key,name,radius,points in wiring:
        add('B',key,name,cable_path(points,radius),'C')
    # V41: rebuild the VN-50 silhouette from the user's photo120/123.
    # The physical nameplate confirms VN-50 / 220V / 230W / 53L/min /
    # 680mmHg / approx.4kg. The family brochure supplies only a
    # candidate 200x110x150mm envelope and 142x96mm mounting pattern;
    # it does NOT prove this unit's manufacturer or exact CAD.
    # One fused solid: floor base, perforated motor housing, exposed
    # rounded motor, end/fan cover, twin vertical heads, caps and tie rods.
    pump_shell=box(200,110,8,325,180,0)
    pump_shell=pump_shell.fuse(
        box(160,76,68,325,180,8),
        box(28,14,12,254,132,4),box(28,14,12,254,228,4),
        box(28,14,12,396,132,4),box(28,14,12,396,228,4),
        vx(34,130,245,180,40),
        vx(29,12,234,180,40),
        vz(24,8,290,180,75),vz(22,57,290,180,82.5),
        vz(24,8,290,180,139),
        vz(24,8,365,180,75),vz(22,57,365,180,82.5),
        vz(24,8,365,180,139),
        box(90,44,10,327.5,180,140),
        vx(2.5,150,250,141.5,77),
        vx(2.5,150,250,218.5,77))
    # Candidate 142x96 mounting footprint: four open Ø6.2 bores.
    for x in (254,396):
        for y in (132,228):
            pump_shell=pump_shell.cut(vz(3.1,16,x,y,0))
    # Photo-fit vent apertures on the upper motor face and long side faces.
    for x in (265,285,305,325,345,365,385):
        for y in (153,180,207):
            pump_shell=pump_shell.cut(vz(2.7,3,x,y,73))
    for x in (270,290,310,330,350,370,390):
        for z in (28,42,56):
            pump_shell=pump_shell.cut(vy(2.1,3,x,216,z))
            pump_shell=pump_shell.cut(vy(2.1,3,x,139,z))
    # The candidate suction port is on the +X face; its real side and
    # orientation are not established by the user's photographs.
    pump_shell=pump_shell.cut(vx(4.1,7,402.5,180,68))
    add('B','B20','photo120_VN50_pump_body_WITH_real_inlet_recess',
        pump_shell,'P')
    pump_inlet=vx(9,20,405,180,68).cut(vx(4.1,20.2,404.9,180,68))
    add('B','B20I','VN50_INTaKE_OPEN_nozzle_candidate_position',
        pump_inlet,'C')
    # V40: pass LEFT of B36, behind its rear wall (B19's back side),
    # then around the RIGHT side to the candidate VN-50 INTAKE.
    # Keep the long rear service lane at vertical Z=70mm to separate
    # B40 from the B37 heater pair and B38 sensor lead.
    # CAD (X, depth-Y, vertical-Z) maps to WebGL (X, vertical-Y, depth-Z).
    hose=[
        (94,-79,90.5),(200,-135,70),(200,-170,70),
        (200,-275,70),(350,-275,70),(520,-275,70),
        (520,140,70),(520,180,90),(465,180,69),(425,180,68)
    ]
    add('B','B40','B11_B15_rear_to_VN50_hollow_suction_hose',
        hollow_hose(hose),'C')
    add('B','B22','photo115_external_LED_adapter_CANDIDATE',
        box(65,72,48,335,65,0),'P')
def make_a():
    board('A')
    ax,cx=-116,78
    # A photo 100 shows sample-side T25M above rotary; A photo 97 shows a
    # SECOND T25M below VC13M. Both physically exist.
    stage('A','A02',cx,0,61.2,'+X')
    # User-confirmed mounting relationship, maker/height candidate:
    # A15 must rest on the actual magnetic base, not on naked board.
    add('A','A17','FILM_MAGNET_MOUNT_STAND_OEM_UNKNOWN',
        box(65,65,20,ax,0,20),'C')
    stage('A','A15',ax,0,40,'+X',axes=2,depth_direction='+Y')
    # Photo 97: vertical slide/upright carriage, not a solid block.
    vc13=(box(65,65,8,ax,0,73)
          .fuse(box(56,17,43,ax,-9,81))
          .fuse(box(65,65,7,ax,0,117)))
    add('A','A03','VC13M_upright_combined_PROXY',vc13)
    add('A','A03M','VC13M_vertical_micrometer',vz(5.5,35,ax,31,98),'P')
    add('A','A03K','VC13M_vertical_knob',vz(8.5,15,ax,31,133),'P')
    add('A','A04','G40M60L_ENVELOPE',box(40,40,20,ax,0,124),'D')
    add('A','A04M','G40M60L_right_micrometer',vx(5,22,ax+20,0,134),'P')
    add('A','A04K','G40M60L_right_knob',vx(8.5,15,ax+42,0,134),'P')
    # V38: source photo 94 shows ONE thin bent-L metal sheet on G40,
    # NOT a fabricated 215mm solid transfer beam / invented glass clip.
    # Match the existing Three.js A05 geometry; open glass attachment
    # is intentionally unresolved until more real photos are available.
    l_left=ax-60
    folded_sheet=box(80,12,2.5,ax-20,13,144).fuse(
        box(2.5,12,72,l_left+1.25,13,72),
        box(13,12,2.5,l_left+6.5,13,72))
    add('A','A05','photo94_ONE_CONNECTED_BENT_L_SHEET_CANDIDATE',
        folded_sheet,'P')
    for i,dx in enumerate((-14,14),1):
        add('A',f'A05S{i}','photo94_TOP_VISIBLE_SCREW_HEAD_CANDIDATE',
            vz(3.1,2,ax+dx,13,146.5),'P')
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
    rot('A','A06',cx,0,28,'I')
    add('A','A07','heater_proxy',box(65,65,18,cx,0,81.2))
    add('A','A10','imaging_column',vz(13,225,cx,-112,32))
    add('A','A10A','imaging_boom',box(34,125,25,cx,-50,243))
    add('A','A08','TTL200A',vz(21,85,cx,0,170),'P')
    add('A','A09','Daheng_camera',box(50,44,45,cx,0,258),'P')
    add('A','A11','MWWHL4',vz(13,33,155,60,184),'P')
    add('A','A12','LEDD1B',box(60,73,104,262,-80,20),'P')
    add('A','A13','DELIXI_SSR',box(75,64,33,260,72,20),'P')
    add('A','A14','SM1_threaded_adapter_PROXY',vz(16,7,cx,0,248),'I')
def export(sys):
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_V40')
    # The user's B photos distinguish the SILVER common table from the
    # independent BLACK THORLABS board below the sample stage. Preserve
    # that evidence as AP214 STEP assembly colors, not merely part names.
    # Other components retain neutral default STEP color until their
    # manufacturer finishes/geometry are verified.
    evidence_colors={
      'B01':cq.Color(0.73,0.76,0.79),
      'B35':cq.Color(0.10,0.12,0.15)
    }
    for key,name,grade,shape in PARTS[sys]:
        props={'name':key+'__'+name}
        if key in evidence_colors: props['color']=evidence_colors[key]
        assembly.add(shape,**props)
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_V40.step')
    assembly.save(str(target))
    solids=cq.importers.importStep(str(target)).solids().vals()
    assert len(solids)>=len(PARTS[sys]) and all(s.isValid() for s in solids)
    with (target.parent/'part_levels.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['id','component','level'])
        for key,name,grade,_ in PARTS[sys]:w.writerow([key,name,grade])
    return dict(system=sys,assembly_components=len(PARTS[sys]),step_solids=len(solids),size_bytes=target.stat().st_size)
if __name__=='__main__':
    make_a();make_b()
    info=[export(x) for x in ('A','B')]
    (OUT/'verification.json').write_text(json.dumps(info,indent=2))
    print(info)
