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
def stage(sys,key,x,y,z):
    add(sys,key,'stage_fixed',box(65,65,11.6,x,y,z),'C')
    add(sys,key+'A','stage_moving',box(62.4,61.1,8.4,x,y,z+11.6),'C')
    add(sys,key+'B','micrometer',vx(6,40,x+32.5,y,z+10))
    add(sys,key+'C','micrometer_knob',vx(9,12,x+72.5,y,z+10))
def rot(sys,key,x,y,z,grade):
    add(sys,key,'rotary_lower',vz(47,23,x,y,z),grade)
    top=vz(47,10.2,x,y,z+23)
    top=cut(top,[(x+dx,y+dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,8,z+25.2)
    add(sys,key+'A','rotary_top_9_M6_25',top,grade)
    add(sys,key+'B','rotary_micrometer',vx(8,30,x+47,y,z+12))
def heater(cx=82,cy=0,z=86.2):
    corners=[(cx+dx,cy+dy) for dx in (-25,25) for dy in (-25,25)]
    metal=box(65,65,12,cx,cy,z)
    # Bottom milled pocket + lead side route + bead contact shallow relief.
    metal=metal.cut(box(38.6,38.6,5.4,cx,cy,z))
    metal=metal.cut(box(14,5,3,cx-26,cy+12,z))
    metal=metal.cut(box(5,2,.8,cx+6,cy,z+5.4))
    metal=cut(metal,corners,6.6,12,z)
    metal=cut(metal,corners,11,6.5,z+5.5)
    metal=metal.cut(vz(.7,3,cx,cy,z+9))
    metal=metal.cut(vx(1.4,32.6,cx-32.6,cy,z+9.3))
    add('B','B11','milled_chuck_single_vacuum_hole',metal,'U')
    add('B','B12','ceramic_heater_38x38x5_NEW_CANDIDATE',box(38,38,5,cx,cy,z+.3))
    ins=cut(box(65,65,10,cx,cy,z-10),corners,6.8,10,z-10)
    add('B','B10','insulator_10mm_CANDIDATE',ins,'U')
    add('B','B13','thermocouple_bead_CANDIDATE',vz(.4,.8,cx+6,cy,z+5.35))
    add('B','B15','vacuum_fitting_PROXY',vx(2.4,9,cx-41.5,cy,z+9.3))
    for i,(x,y) in enumerate(corners,1):
        shaft=vz(3,25,x,y,z+12-6.5-25)
        head=vz(5,6,x,y,z+12-6)
        add('B','B14_'+str(i),'M6x25_candidate_'+str(i),shaft.fuse(head),'I')
def make_b():
    board('B')
    ax,cx=-112,82
    mag=box(65,65,20,ax,0,20)
    for pitch,dia in [(50,5),(40,3.3),(32,2.5)]:
        mag=cut(mag,[(ax+dx,dy) for dx in (-pitch/2,pitch/2) for dy in (-pitch/2,pitch/2)],dia,10,30)
    add('B','B02','GCM420302M_magnet',mag,'D')
    stage('B','B03',ax,0,40)
    add('B','B04','GCMV25M_flange',box(65,66,8,ax,0,60),'D')
    add('B','B04A','GCMV25M_body_PROXY',box(52,53,46,ax,0,68))
    add('B','B04B','GCMV25M_top',box(65,66,8,ax,0,114))
    add('B','B05','post',vz(6.35,155,ax,0,136))
    add('B','B05A','post_clamp',box(35,31,27,ax,0,251))
    add('B','B05B','horizontal_rod',vx(6.35,249,ax,0,265))
    add('B','B05C','hanging_rod',vz(5,90,cx+52,0,175))
    add('B','B06','film_clamp',box(52,21,13,cx+52,0,165))
    add('B','B07','glass_slide',box(76,26,1,cx,0,138.5))
    add('B','B07A','pdms',box(20,20,1,cx+20,0,137))
    rot('B','B08',cx,0,20,'D')
    corners=[(cx+dx,dy) for dx in (-25,25) for dy in (-25,25)]
    lo=cut(box(65,65,11,cx,0,53.2),corners,6.5,11,53.2)
    add('B','B09','NFP1462C_lower_ENVELOPE',lo,'D')
    top=box(65,65,12,cx,0,64.2)
    top=cut(top,[(cx+dx,dy) for dx in (-25,0,25) for dy in (-25,0,25)],5,7,69.2)
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
    add('B','B18','objective',vz(12.5,38,cx,0,167.5))
    add('B','B18A','objective_tip',vz(7,12,cx,0,155.5))
    add('B','B17','digital_camera',box(47,48,48,cx,0,276))
    add('B','B19','temperature_box',box(125,87,85,265,-95,25))
    add('B','B20','vacuum_pump',box(135,80,65,265,75,20))
    add('B','B21','MeanWell_power_supply_247x127x63p5',box(247,127,63.5,245,-195,25),'D')
def make_a():
    board('A')
    ax,cx=-116,78
    stage('A','A02',ax,0,20)
    add('A','A03','VC13M_ENVELOPE',box(65,65,51,ax,0,40))
    add('A','A04','G40M60L_ENVELOPE',box(40,40,20,ax,0,91),'D')
    add('A','A05','slide',box(76,26,1,cx,0,134))
    add('A','A05A','slide_arm',box(151,12,8,cx-71,0,163))
    rot('A','A06',cx,0,20,'I')
    add('A','A07','heater_proxy',box(65,65,18,cx,0,53.2))
    add('A','A10','imaging_column',vz(13,225,cx,-112,32))
    add('A','A10A','imaging_boom',box(34,125,25,cx,-50,243))
    add('A','A08','TTL200A',vz(21,85,cx,0,170),'P')
    add('A','A09','Daheng_camera',box(50,44,45,cx,0,258),'P')
    add('A','A11','MWWHL4',vz(13,33,155,60,184),'P')
    add('A','A12','LEDD1B',box(60,73,104,262,-80,20),'P')
    add('A','A13','DELIXI_SSR',box(75,64,33,260,72,20),'P')
def export(sys):
    assembly=cq.Assembly(name='Transfer_Station_'+sys+'_V16')
    for key,name,grade,shape in PARTS[sys]: assembly.add(shape,name=key+'__'+name)
    target=OUT/('platform_'+sys)/('platform_'+sys+'_complete_V16.step')
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
