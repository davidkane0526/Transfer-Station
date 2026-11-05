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
        if depth_direction=='+Y':
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y+32.5,z+5.5),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y+72.5,z+5.5),'D')
        else:
            add(sys,key+'D','Y_micrometer_stem',vy(6,40,x,y-72.5,z+5.5),'D')
            add(sys,key+'E','Y_micrometer_knob',vy(9,14,x,y-86.5,z+5.5),'D')
def rot(sys,key,x,y,z,grade,radius=47,lock_radius=8):
    # B uses its historical Ø94 candidate. A photo17/20/21/23 ruler
    # silhouette is distinctly narrower than the 65mm top-plate.
    # V48 only A uses Ø66 candidate, bounded [55,75]mm; SKU unknown.
    add(sys,key,'rotary_lower_radius_'+str(radius),vz(radius,23,x,y,z),grade)
    pitch=25 if radius>=40 else 16
    top=vz(radius,10.2,x,y,z+23)
    top=cut(top,[(x+dx,y+dy) for dx in (-pitch,0,pitch) for dy in (-pitch,0,pitch)],5,8,z+25.2)
    add(sys,key+'A','rotary_top_nine_candidate_bores',top,grade)
    # Operator-facing side lock, actual rod profile unmeasured.
    add(sys,key+'B','operator_side_rotary_lock',vy(lock_radius,30,x,y+radius,z+12))
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
    rot('B','B08',cx,0,20+microscope_rise,'D',radius=47,lock_radius=6)
    # Zolix NFP-1462C: 65x65x23mm single-X stage, installed with its
    # micrometer pointing to the right as in photo110. The four base
    # holes are Ø6.5 clearance with Ø11 counterbores; the moving top
    # carries 9-M6 and 4-M3 tap-drill proxies.
    nfp_z=20+microscope_rise+33.2
    nfp_corners=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    nfp_fixed=box(65,65,11,cx,0,nfp_z)
    nfp_fixed=cut(nfp_fixed,nfp_corners,6.5,11,nfp_z)
    nfp_fixed=cut(nfp_fixed,nfp_corners,11,5,nfp_z+6)
    nfp_lower_side=[(-18,1.6),(-4,2.0),(11,2.6),(22,1.6)]
    nfp_upper_side=[(-22,1.8),(-8,1.8),(12,2.8)]
    for xoff,radius in nfp_lower_side:
        nfp_fixed=nfp_fixed.cut(vy(radius,2.5,cx+xoff,30.0,nfp_z+7))
    add('B','B09','Zolix_NFP1462C_fixed_base_65x65x11_O6p5_O11',nfp_fixed,'D')
    for i,(hx,hy) in enumerate(nfp_corners,1):
        screw=vz(2.45,18,hx,hy,nfp_z-7).fuse(vz(4.2,2.5,hx,hy,nfp_z+8.5))
        add('B',f'B09S{i}','NFP1462C_fixed_base_M6x18_candidate_'+str(i),screw,'C')
    nfp_slide_lower=box(65,65,2,cx,0,nfp_z+11)
    add('B','B09M','NFP1462C_moving_carriage_lower_2mm',nfp_slide_lower,'P')
    nfp_slide_top=box(65,65,10,cx,0,nfp_z+13)
    nfp_m6=[(cx+x,y) for x in (-25,0,25) for y in (-25,0,25)]
    nfp_m3=[(cx+x,y) for x in (-16,16) for y in (-16,16)]
    nfp_slide_top=cut(nfp_slide_top,nfp_m6,5,10,nfp_z+13)
    nfp_slide_top=cut(nfp_slide_top,nfp_m3,2.5,10,nfp_z+13)
    for xoff,radius in nfp_upper_side:
        nfp_slide_top=nfp_slide_top.cut(vy(radius,2.5,cx+xoff,30.0,nfp_z+17.5))
    add('B','B09A','NFP1462C_moving_top_9M6_4M3_10mm',nfp_slide_top,'D')
    # OEM micrometer points +X after the photographed 180-degree install.
    nfp_mic_z=nfp_z+12
    # Photo110 installation reverses the OEM micrometer direction to +X.
    # Housing has a blind Ø8 bore; the Ø7.2 shaft enters 9mm and extends
    # 82.5mm to the right. Collar and drum are nested hollow sleeves.
    nfp_housing=box(24,30,15,cx+45,0,nfp_mic_z)
    nfp_housing=nfp_housing.cut(vx(4,9,cx+48,0,nfp_mic_z))
    add('B','B09B','NFP1462C_micrometer_housing_24x30x15_blind_O8',nfp_housing,'P')
    add('B','B09C','NFP1462C_micrometer_spindle_O7p2x82p5',
        vx(3.6,82.5,cx+48,0,nfp_mic_z),'P')
    nfp_collar=vx(9,23,cx+107.5,0,nfp_mic_z).cut(
        vx(3.8,23,cx+107.5,0,nfp_mic_z))
    add('B','B09D','NFP1462C_micrometer_collar_O18x23_bore_O7p6',nfp_collar,'P')
    nfp_drum=vx(11,28,cx+117,0,nfp_mic_z).cut(
        vx(9.2,28,cx+117,0,nfp_mic_z))
    add('B','B09E','NFP1462C_micrometer_drum_O22x28_bore_O18p4',nfp_drum,'P')
    # B10/B11/B12/B13/B14 heater and vacuum-block stack sits directly
    # above the 23mm NFP-1462C stage; B14 M6x25 screws engage the
    # four corner M6 positions in the NFP moving top.
    heater(cx=cx,cy=0,z=98.2)
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
    pump_shell=pump_shell.cut(vx(4.1,7,402.5,180,68))
    add('B','B20','photo120_VN50_cylindrical_motor_twin_head_pump_candidate',
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
    stage('A','A02',cx,0,61.2,'-X')
    # User-confirmed mounting relationship, maker/height candidate:
    # A15 must rest on the actual magnetic base, not on naked board.
    # V51 A17: photos22/24 show front slot, central knurled control and
    # two lower panel screws. Photo23's four top counterbores belong to A15,
    # not A17. GCM-420302M is an independent visual candidate only.
    mag=box(65,65,20,ax,0,20)
    # A17 independently resembles GCM-420302M; candidate catalogue pattern only.
    for pitch,dia in [(50,5),(40,3.3),(32,2.5)]:
        pts=[(ax+dx,dy) for dx in (-pitch/2,pitch/2) for dy in (-pitch/2,pitch/2)]
        mag=cut(mag,pts,dia,10,30)
    mag=cut(mag,[(ax,0)],5,10,30)
    mag=mag.cut(vy(2.1,13,ax,19.5,25.9))
    add('A','A17','A17_GCM420302M_VISUAL_CANDIDATE_NOT_CONFIRMED',mag,'C')
    a17_panel=box(42,1.5,16,ax,33.25,22).cut(
        box(26,1.6,4.2,ax,33.25,23.8))
    add('A','A17P','FILM_MAGNET_FRONT_SLOTTED_PANEL_PHOTO22',a17_panel,'P')
    for i,xx in enumerate((ax-17,ax+17),1):
        add('A',f'A17S{i}','FILM_MAGNET_PANEL_LOWER_SCREW_HEAD_CANDIDATE',
            vy(2.2,1.5,xx,33.25,22.5),'C')
    a17_control=vy(1.8,14.5,ax,19.5,25.9).fuse(
        vy(5.2,9,ax,34,25.9))
    add('A','A17L','FILM_MAGNET_FRONT_SLOTTED_CONTROL_KNOB_UNKNOWN_FUNCTION',
        a17_control,'C')
    stage('A','A15',ax,0,40,'+X',axes=2,depth_direction='+Y',photo_top_bores=True)
    # Photo 97: vertical slide/upright carriage, not a solid block.
    # V46: relocate the VC13 vertical drive beyond the ±32.5mm
    # moving platform envelope. The front bracket spans the stationary
    # upright to y=40 and has a TRUE bored hole for the vertical shaft.
    front_drive_bracket=box(14,43,8,ax,19.5,96).cut(
        vz(5.8,8,ax,40,96))
    # Fixed rails end at Z117. The photo-fit moving output A03T
    # touches their upper face at its lowest proposed static pose,
    # but is NOT fused to the stationary upright. This is necessary
    # for motion-aware STEP assembly and future travel collision tests.
    vc13=(box(65,65,8,ax,0,73)
          .fuse(box(56,17,36,ax,-9,81))
          .fuse(front_drive_bracket))
    add('A','A03','VC13M_FIXED_UPRIGHT_front_support_CANDIDATE',vc13)
    add('A','A03T','VC13M_MOVING_OUTPUT_65x65x7_STATIC_LOWER_POSE_CANDIDATE',
        box(65,65,7,ax,0,117),'C')
    add('A','A03M','VC13M_vertical_micrometer',vz(5.5,35,ax,40,98),'P')
    add('A','A03K','VC13M_vertical_knob',vz(8.5,15,ax,40,133),'P')
    # Photo94: 40mm-wide front silhouette has TWO ~20mm thick
    # independent sections. Upper is visibly marked GCM-G40M60L.
    # Lower has its own rightward micrometer; G40M40L is a manufacturer
    # pairing comparison ONLY, not yet readable from the user photo.
    # The older one-piece A04 envelope was 20mm too short.
    add('A','A04L','LOWER_G40_GONIOMETER_SKU_UNKNOWN_20mm_PHOTO_CANDIDATE',
        box(40,40,20,ax,0,124),'C')
    add('A','A04LM','LOWER_G40_right_micrometer_CANDIDATE',
        vx(5,22,ax+20,0,134),'C')
    add('A','A04LK','LOWER_G40_right_knob_CANDIDATE',
        vx(8.5,15,ax+42,0,134),'C')
    add('A','A04','UPPER_G40M60L_LABEL_PHOTO94_40x40x20',
        box(40,40,20,ax,0,144),'P')
    add('A','A04M','UPPER_G40M60L_left_micrometer_ORIENTATION_CANDIDATE',
        vx(5,22,ax-42,0,154),'C')
    add('A','A04K','UPPER_G40M60L_left_knob_ORIENTATION_CANDIDATE',
        vx(8.5,15,ax-57,0,154),'C')
    # V38: source photo 94 shows ONE thin bent-L metal sheet on G40,
    # NOT a fabricated 215mm solid transfer beam / invented glass clip.
    # Match the existing Three.js A05 geometry; open glass attachment
    # is intentionally unresolved until more real photos are available.
    # V47: local x-span was calibrated from the G40 40mm photo94 front
    # projection (roughly 75mm total, 48mm left reach). NOT ruler metrology.
    l_left=ax-48
    # Second physical G40 layer lifts the folded plate by 20mm.
    folded_sheet=box(75,12,2.5,ax-10.5,13,164).fuse(
        box(2.5,12,72,l_left+1.25,13,92),
        box(13,12,2.5,l_left+6.5,13,92))
    add('A','A05','photo94_ONE_CONNECTED_BENT_L_SHEET_CANDIDATE',
        folded_sheet,'P')
    for i,dx in enumerate((-14,14),1):
        add('A',f'A05S{i}','photo94_TOP_VISIBLE_SCREW_HEAD_CANDIDATE',
            vz(3.1,2,ax+dx,13,166.5),'P')
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
    rot('A','A06',cx,0,28,'I',radius=33,lock_radius=4.5)
    # Photo17/18/20/21: RIGHT side of A06 has a LONG horizontal
    # silver angular micrometer, in addition to the SHORT front lock.
    # Do not mislabel either of these as A02's left linear micrometer.
    add('A','A06C','rotation_right_fine_adjust_stem_36mm_CANDIDATE',
        vx(5.5,36,cx+33,0,42),'C')
    add('A','A06D','rotation_right_fine_adjust_knob_25mm_CANDIDATE',
        vx(9,25,cx+69,0,42),'C')
    # V48 photos17/18 show the 65mm silver top at ~90mm ABOVE THE
    # 20mm-thick board TOP, not 90mm absolute from model origin.
    # Photos17–21 show three distinct vertical bands. Material of the
    # middle gold/tan layer remains unknown, not certified ceramic.
    # Current A02 ends at z81.2; lower9 + middle7 + top12 =>109.2.
    add('A','A07B','sample_lower_dark_support_65x65x9_CANDIDATE',
        box(65,65,9,cx,0,81.2),'C')
    add('A','A07I','sample_intermediate_goldtoned_65x65x7_MATERIAL_UNKNOWN',
        box(65,65,7,cx,0,90.2),'C')
    a07_top=box(65,65,12,cx,0,97.2)
    a07_holes=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    a07_top=cut(a07_top,a07_holes,6.5,2.5,106.7)
    add('A','A07','silver_sample_upper_plate_65x65x12_four_blind_head_recesses',
        a07_top,'C')
    for i,(xx,yy) in enumerate(a07_holes,1):
        # Heads only: do not claim unknown buried screw threads.
        add('A',f'A07S{i}','silver_top_four_VISIBLE_HEAD_only_CANDIDATE',
            vz(2.9,1.8,xx,yy,106.8),'C')
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
    microscope_a_post=vz(13,225,cx,-112,32)
    add('A','A10','imaging_column_WITH_4_M5_CANDIDATE_BORE_FOOT',
        microscope_a_foot.fuse(microscope_a_post))
    for i,(xx,yy) in enumerate(a10_anchors,1):
        screw=vz(2.5,17.5,xx,yy,14).fuse(vz(4.25,2.5,xx,yy,31.5))
        add('A',f'A10S{i}','A10_M5x17p5_GRID_ANCHOR_CANDIDATE',screw,'C')
    add('A','A10A','imaging_boom',box(34,125,25,cx,-50,243))
    # TTL200-A is a nominal 28 mm lens housing, NOT an 85 mm solid.
    # Additional optical tube is a separate unresolved A14 sleeve.
    add('A','A08','TTL200A_nominal_28mm_housing_CANDIDATE',
        vz(26,28,cx,0,170),'D')
    add('A','A09','Daheng_camera',box(50,44,45,cx,0,258),'P')
    add('A','A11','MWWHL4',vz(13,33,155,60,184),'P')
    add('A','A12','LEDD1B',box(60,73,104,262,-80,20),'P')
    add('A','A13','DELIXI_SSR',box(75,64,33,260,72,20),'P')
    # TTL200-A uses EXTERNAL SM2 both ends, whereas the previously
    # listed SM1CP2 is a CAP and cannot mate to that SM2 male thread.
    # A14 therefore becomes an OPEN mechanical illustration only:
    # nominal Ø56/Ø52.2 x66 sleeve overlapping A08 over Z192..198 and reaching A09 at Z258.
    sleeve_A14=vz(28,66,cx,0,192).cut(vz(26.1,66.2,cx,0,191.9))
    add('A','A14','UNKNOWN_SM2_MATING_OPTICAL_TUBE_66mm_CANDIDATE',
        sleeve_A14,'C')
CAD_REVISION='V51'
def export(sys):
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_'+CAD_REVISION)
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
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_'+CAD_REVISION+'.step')
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
