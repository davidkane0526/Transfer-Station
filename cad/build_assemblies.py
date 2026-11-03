"""Two-platform parametric STEP generator (engineering candidate model).
All sizes in mm, breadboard bottom Z=0. See docs/engineering.md.
Run: pip install cadquery && python cad/build_assemblies.py
"""
from pathlib import Path
import cadquery as cq
from cadquery import Vector
import csv, json

OUT=Path(__file__).resolve().parents[1]/'build'
PARTS={'A':[],'B':[],'B_photo94':[]}
def box(w,d,h,x,y,z):
    return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()
def vz(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))
def vx(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(1,0,0))
def vy(r,h,x,y,z): return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
def cut(s,coords,diam,h,z):
    for x,y in coords:s=s.cut(vz(diam/2,h,x,y,z))
    return s
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
def heater(cx=82,cy=0,z=86.2):
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
    add('B','B15','rear_vacuum_fitting_PROXY',vy(2.4,12,cx,cy-44.5,z+9.3))
    add('B','B15T','rear_vacuum_hose_PROXY',vy(1.8,30,cx,cy-74.5,z+9.3))
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
    ax,cx=-102,82
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
    add('B','B04E','GCMV25M_moving_front_guide_PROXY',box(34,8,49,ax,3,81))
    add('B','B04B','GCMV25M_top',box(65,66,8,ax,0,127))
    # Photo 108: V25M micrometer is vertical, not an x-axis knob.
    add('B','B04C','vertical_micrometer_stem',vz(6.5,40,ax-24,0,102),'P')
    add('B','B04D','vertical_micrometer_knob',vz(9,17,ax-24,0,142),'P')
    # ARCHIVE 108/109 CANDIDATE ONLY. No 85-mm riser, 249-mm rear
    # return beam, suspended rod, or phantom rear hanger. These were
    # disproved by the user's photographs and removed from the web viewer.
    # CAD XY ground-plane corresponds to web X/Z; CAD Z is vertical.
    add('B','B05D','V25M_mount_6mm_CANDIDATE',
        box(65,66,6,ax,0,135))
    # PHPB-1-like post base: Ø12 shallow seat and separate Ø6.1
    # bottom bore. Body/seat depths are explicitly UNVERIFIED.
    foot=vz(18,6,ax+14,-15,141)
    foot=foot.cut(vz(3.05,6,ax+14,-15,141))
    foot=foot.cut(vz(6.05,3,ax+14,-15,144))
    add('B','B05','post_foot_PHPB1_approx_not_verified',foot,'C')
    add('B','B27','vertical_post_O12x25_PHSP12_1_CANDIDATE',
        vz(6,25,ax+14,-15,144),'C')
    # PHCP-2 sleeve candidate with TWO separate orthogonal Ø12.1
    # through-bores; 15 mm offset is a preview only. It guarantees
    # 3 mm solid-rod surface clearance, not an OEM bore-centre datum.
    v_ring=vz(12.5,16,ax+14,-15,147)
    h_ring=vx(13,16,ax+6,0,155)
    cross=v_ring.fuse(h_ring)
    cross=cross.cut(vz(6.05,16,ax+14,-15,147))
    cross=cross.cut(vx(6.05,16,ax+6,0,155))
    add('B','B24','PHCP2_twobore_SWIVEL_CANDIDATE',cross,'C')
    # PHSP12-5 Ø12x150mm is OEM length only; identity in user
    # photo, actual mounting and the yaw angle remain unverified.
    add('B','B25','horizontal_post_O12x150_CANDIDATE',
        vx(6,150,ax+2,0,155),'C')
    clamp_x=cx-42
    # Old B26 cuboid ended 8.5mm ABOVE B06; current supporting
    # stem ends exactly at the B06 spine top, while ending 1mm
    # BELOW the steel rod. Neither face is a verified bolted joint.
    socket=vx(13,16,clamp_x-8,0,155)
    stem=box(20,20,29,clamp_x,0,119)
    terminal=socket.fuse(stem)
    terminal=terminal.cut(vx(6.05,16,clamp_x-8,0,155))
    add('B','B26','unidentified_terminal_adapter_socket_CANDIDATE',
        terminal,'C')
    # Daheng GCM-13 mechanics: TWO adjusters push ONE moving plate.
    # 1mm glass thickness and the pressure-plate coordinates below
    # are display candidates, not OEM CAD or certified clamp forces.
    add('B','B06','GCM13_fixed_spine_CANDIDATE',
        box(17,56,15,clamp_x-7,0,104),'C')
    add('B','B06F','GCM13_one_fixed_jaw_CANDIDATE',
        box(22,56,4,clamp_x+10,0,100.5),'C')
    add('B','B06M','GCM13_one_moving_pressure_plate_CANDIDATE',
        box(22,56,3.5,clamp_x+10,0,105.5),'C')
    bridge=box(24,56,5,clamp_x+6,0,119)
    for yy in (-17,17):
        bridge=bridge.cut(vz(1.75,5,clamp_x+10,yy,119))
    add('B','B06T','GCM13_bridge_with_2_bores_CANDIDATE',bridge,'C')
    for i,yy in enumerate((-17,17),1):
        add('B',f'B06S{i}',
            'GCM13_one_of_two_pressure_screws_PROXY',
            vz(1.7,12,clamp_x+10,yy,109),'C')
    add('B','B07','glass_slide_UNVERIFIED_76x26x1',
        box(76,26,1,cx+5,0,104.5),'C')
    add('B','B07A','pdms_UNVERIFIED_transfer_tip',
        box(20,20,1.8,cx,0,102.7),'C')
    rot('B','B08',cx,0,20,'D')
    corners=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    # Manufacturer PDF (NFP-1462C) specifies four Ø6.5 clearance
    # holes with Ø11 counterbore on fixed-stage view (50mm square).
    # They are NOT M6 tapped holes and should not be modeled as threads.
    lo=cut(box(65,65,11,cx,0,53.2),corners,6.5,11,53.2)
    lo=cut(lo,corners,11,4,60.2)
    add('B','B09','NFP1462C_lower_4clearance_O6p5_counterbore_O11',lo,'D')
    # Opposite view shows 9-M6 / 4-M3 threaded-hole arrays on the moving plate.
    # Minor diameters and 10mm/7mm hole DEPTHS are candidates, not OEM data.
    top=box(65,65,12,cx,0,64.2)
    top=cut(top,[(cx+dx,dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,10,66.2)
    top=cut(top,[(cx+dx,dy) for dx in (-16,16) for dy in (-16,16)],2.5,7,69.2)
    add('B','B09A','NFP1462C_upper_9M6_4M3_candidates',top,'D')
    # OEM drawing: native micrometer left. The user photo110 shows right
    # after whole-stage installation yaw=180° relative to native plan.
    # OEM overall maker dimension: 155.5..180.5 mm along drive axis.
    add('B','B09B','NFP_micro_extended_world_RIGHT',vx(4,76,cx+33,0,64.5),'D')
    add('B','B09C','NFP_micro_drum_world_RIGHT',vx(10,25,cx+109,0,64.5),'D')
    heater()
    add('B','B16','microscope_column_PROXY',vz(13,240,cx,-112,32))
    add('B','B16A','microscope_base',box(65,65,12,cx,-112,20))
    add('B','B16B','microscope_boom',box(35,132,26,cx,-52,259))
    add('B','B16C','microscope_body',box(55,55,50,cx,0,224))
    add('B','B16D','objective_tube_mount',vz(17,44,cx,0,186))
    add('B','B18','objective',vz(12.5,38,cx,0,162.0))
    add('B','B18A','objective_tip',vz(7,12,cx,0,150.0))
    add('B','B17','digital_camera',box(47,48,48,cx,0,276))
    add('B','B19','temperature_box',box(125,87,85,265,-95,25))
    add('B','B20','vacuum_pump',box(135,80,65,265,75,20))
    add('B','B21','MeanWell_power_supply_247x127x63p5',box(247,127,63.5,245,-195,25),'D')
    add('B','B22','LED_lamp_adapter_proxy',box(65,72,48,280,-20,35),'P')
    add('B','B23','control_auxiliary_module_proxy',box(93,58,38,305,-110,35),'P')
def make_b_photo94():
    """Current user-requested B 94/95/97 glass-side reference ONLY.

    DO NOT silently combine this photo branch with the old 108/109 PHCP
    arm or claim that 110/111 NFP/sample-side evidence belongs to it.
    No slide jaw has been identified downstream of the photographed L
    sheet. Preserve that missing physical load path rather than building
    a fake cantilever to the optical axis.
    """
    sys='B_photo94'
    board(sys)
    ax=-102
    # Photo95: an unmarked support envelope, not an OEM base SKU.
    add(sys,'B29','unknown_65x65x20_SUPPORT_ENVELOPE_ONLY',
        box(65,65,20,ax,0,20),'C')
    stage(sys,'B03',ax,0,40,'+X',axes=2,depth_direction='+Y')
    # VC13M top 65x65, vertical 13 mm adjust; total outer geometry
    # is a photograph-constrained proxy, not original parametric CAD.
    upright=(box(65,60,8,ax,0,73)
             .fuse(box(45,16,38,ax,-8,81))
             .fuse(box(65,65,6,ax,0,118)))
    add(sys,'B30','GCM_VC13M_PHOTO_PROFILE_PROXY',upright,'C')
    # Keep a visible front-mounted vertical microdrive, not a
    # floating object through the G40 base.
    # Outer micrometer placement remains an envelope candidate.
    # Keep its drum completely OUTSIDE the 65mm upper flange rather
    # than allowing it to penetrate the solid G40 mounting plane.
    add(sys,'B30M','VC13M_vertical_micrometer_PROXY',
        vz(4,27,ax,39.5,89),'C')
    add(sys,'B30K','VC13M_micrometer_drum_PROXY',
        vz(6.8,18,ax,39.5,103),'C')
    add(sys,'B31','GCM_G40M60L_40x40x20_ENVELOPE',
        box(40,40,20,ax,0,124),'C')
    add(sys,'B31M','G40_right_micrometer_PROXY',
        vx(5.5,18,ax+20,0,134),'C')
    add(sys,'B31K','G40_right_micrometer_drum_PROXY',
        vx(8.3,20,ax+38,0,134),'C')
    # Photo94: ONE THIN folded L plate. CAD z is vertical, unlike the
    # web viewer's Y-up coordinates. Two top heads are visible in
    # the photo, but their thread/length/pitch are not identified.
    add(sys,'B32','photo94_thin_L_top_sheet_UNMEASURED',
        box(80,12,2.5,ax-20,13,144),'C')
    add(sys,'B32L','photo94_thin_L_downfold_UNMEASURED',
        box(2.5,12,72,ax-58.75,13,72),'C')
    for n,xx in enumerate((ax-14,ax+14),1):
        add(sys,f'B32H{n}',f'photo94_top_head_{n}_diameter_UNVERIFIED',
            vz(3,2.2,xx,13,146.5),'C')
    # Deliberately NO B06 / B07 / B24 etc. An unknown clamp would be
    # fabrication, and a photo-visible L sheet is not a glass holder.

def make_a():
    board('A')
    ax,cx=-116,78
    # A photo 100 shows sample-side T25M above rotary; A photo 97 shows a
    # SECOND T25M below VC13M. Both physically exist.
    stage('A','A02',cx,0,53.2,'+X')
    stage('A','A15',ax,0,20,'+X',axes=2,depth_direction='+Y')
    # Photo 97: vertical slide/upright carriage, not a solid block.
    vc13=(box(65,65,8,ax,0,53)
          .fuse(box(56,17,43,ax,-9,61))
          .fuse(box(65,65,7,ax,0,97)))
    add('A','A03','VC13M_upright_combined_PROXY',vc13)
    add('A','A03M','VC13M_vertical_micrometer',vz(5.5,35,ax,31,78),'P')
    add('A','A03K','VC13M_vertical_knob',vz(8.5,15,ax,31,113),'P')
    add('A','A04','G40M60L_ENVELOPE',box(40,40,20,ax,0,104),'D')
    add('A','A04M','G40M60L_right_micrometer',vx(5,22,ax+20,0,114),'P')
    add('A','A04K','G40M60L_right_knob',vx(8.5,15,ax+42,0,114),'P')
    add('A','A05','slide',box(76,26,1,cx,0,114))
    # A transfer beam must span from the left tilt-stage axis (ax) to
    # the slide center (cx); earlier 151 mm proxy stopped ~46 mm short.
    add('A','A05A','slide_arm_CANDIDATE',box(215,12,8,(ax+cx)/2,0,153))
    add('A','A05B','slide_arm_vertical_support_CANDIDATE',box(13,13,29,ax,0,124))
    add('A','A05C','slide_edge_clamp_CANDIDATE',box(12,12,39,cx+33,0,114))
    rot('A','A06',cx,0,20,'I')
    add('A','A07','heater_proxy',box(65,65,18,cx,0,73.2))
    add('A','A10','imaging_column',vz(13,225,cx,-112,32))
    add('A','A10A','imaging_boom',box(34,125,25,cx,-50,243))
    add('A','A08','TTL200A',vz(21,85,cx,0,170),'P')
    add('A','A09','Daheng_camera',box(50,44,45,cx,0,258),'P')
    add('A','A11','MWWHL4',vz(13,33,155,60,184),'P')
    add('A','A12','LEDD1B',box(60,73,104,262,-80,20),'P')
    add('A','A13','DELIXI_SSR',box(75,64,33,260,72,20),'P')
    add('A','A14','SM1_threaded_adapter_PROXY',vz(16,7,cx,0,248),'I')
def export(sys):
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_V27')
    for key,name,grade,shape in PARTS[sys]: assembly.add(shape,name=key+'__'+name)
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_V27.step')
    assembly.save(str(target))
    solids=cq.importers.importStep(str(target)).solids().vals()
    assert len(solids)>=len(PARTS[sys]) and all(s.isValid() for s in solids)
    with (target.parent/'part_levels.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['id','component','level'])
        for key,name,grade,_ in PARTS[sys]:w.writerow([key,name,grade])
    return dict(system=sys,assembly_components=len(PARTS[sys]),step_solids=len(solids),size_bytes=target.stat().st_size)
if __name__=='__main__':
    make_a();make_b();make_b_photo94()
    info=[export(x) for x in ('A','B','B_photo94')]
    (OUT/'verification.json').write_text(json.dumps(info,indent=2))
    print(info)
