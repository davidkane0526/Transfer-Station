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
    add('B','B04L','V25M_branded_rear_face_PROXY',box(50,.6,7,ax,-33.3,127.5),'P')
    add('B','B04A','GCMV25M_upright_body_PROXY',box(56,18,52,ax,-10,81))
    add('B','B04E','GCMV25M_moving_front_guide_PROXY',box(34,8,49,ax,3,81))
    add('B','B04B','GCMV25M_top',box(65,66,8,ax,0,127))
    # Photo 108: V25M micrometer is vertical, not an x-axis knob.
    add('B','B04C','vertical_micrometer_stem',vz(6.5,40,ax-24,0,102),'P')
    add('B','B04D','vertical_micrometer_knob',vz(9,17,ax-24,0,142),'P')
    add('B','B05D','post_to_V25M_base_CANDIDATE',box(36,36,20,ax,0,139))
    add('B','B05','post',vz(6.35,85,ax,0,158.5))
    add('B','B05A','rear_offset_post_clamp',box(35,80,27,ax,-20,188.5))
    add('B','B05B','rear_horizontal_rod',vx(6.35,249,ax,-40,202))
    add('B','B05C','hanging_rod',vz(5,74,cx+55,0,128))
    clip=box(52,21,13,cx+52,0,115)
    clip=clip.fuse(box(48,14,4,cx+38,0,100.5)) # lower jaw
    clip=clip.fuse(box(48,14,4,cx+38,0,106))   # upper jaw
    clip=clip.fuse(box(8,14,15,cx+61,0,100.5)) # outside bridge
    assert len(clip.Solids())==1, 'Clamp should be one connected bracket'
    add('B','B06','clamp_1p5mm_open_slot_CANDIDATE',clip)
    add('B','B07','glass_slide',box(76,26,1,cx+5,0,104.5))
    add('B','B07A','pdms',box(20,20,1.8,cx,0,102.7))
    rot('B','B08',cx,0,20,'D')
    corners=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    lo=cut(box(65,65,11,cx,0,53.2),corners,6.5,11,53.2)
    add('B','B09','NFP1462C_lower_ENVELOPE',lo,'D')
    top=box(65,65,12,cx,0,64.2)
    # 10 mm drilled depth is a *candidate*, NOT vendor-confirmed tapping depth.
    # It clears the proposed 9.5 mm screw engagement with 0.5 mm axial margin.
    # Correct hole depth must be checked on the physical slide before purchase.
    top=cut(top,[(cx+dx,dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,10,66.2)
    top=cut(top,[(cx+dx,dy) for dx in (-16,16) for dy in (-16,16)],2.5,7,69.2)
    add('B','B09A','NFP1462C_upper_M6_M3_ENVELOPE',top,'D')
    add('B','B09B','NFP_micro',vx(6.5,62,cx+33,0,64.5))
    add('B','B09C','NFP_knob',vx(10,17,cx+95,0,64.5))
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
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_V21')
    for key,name,grade,shape in PARTS[sys]: assembly.add(shape,name=key+'__'+name)
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_V21.step')
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
