import cadquery as cq
from cadquery import Vector
def box(w,d,h,x,y,z):
 return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()
def vz(r,h,x,y,z):
 return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))
def vy(r,h,x,y,z):
 return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
wood=box(65,65,7,78,0,90.2)
base=box(65,65,9,78,0,81.2)
upper=box(65,65,12,78,0,97.2)
pocket=box(38.6,38.6,5.4,78,0,97.2)
bore=vz(.7,5.5,78,0,103.8)
duct=vy(1.1,33.5,78,-33,104.7)
leads=[vy(1.25,13.6,78+x,-32.5,99.4) for x in (10,16)]
sensor_groove=vy(.75,13.6,68,-32.5,102.3)
upper=upper.cut(pocket,bore,duct,sensor_groove,*leads)
heater=box(38,38,5,78,0,97.4)
sensor=vz(.45,.18,68,0,102.41)
assert all(s.isValid() for s in (wood,base,upper,heater,sensor))
assert abs(base.BoundingBox().zmax-wood.BoundingBox().zmin)<1e-6
assert abs(wood.BoundingBox().zmax-upper.BoundingBox().zmin)<1e-6
assert wood.intersect(upper).Volume()<1e-5
assert wood.intersect(heater).Volume()<1e-5
assert upper.intersect(heater).Volume()<1e-5
assert upper.intersect(sensor).Volume()<1e-5
assert heater.BoundingBox().zmin>wood.BoundingBox().zmax
assert heater.BoundingBox().zmax<upper.BoundingBox().zmax
assert bore.intersect(duct).Volume()>0
assert upper.intersect(bore).Volume()<1e-5
assert upper.intersect(duct).Volume()<1e-5
# Exploded vertical offsets are display-only; a rigid duct belongs to
# the metal body and cannot acquire an independent transform.
offset={'A32':0,'A31':18,'A26':34,'A27':38,'A07':68,'A28':68,'A07W':92}
for ratio in (.5,.75,1):
 layers={
 'base':(base.BoundingBox().zmin,base.BoundingBox().zmax,offset['A32']),
 'wood':(wood.BoundingBox().zmin,wood.BoundingBox().zmax,offset['A31']),
 'heater':(heater.BoundingBox().zmin,heater.BoundingBox().zmax,offset['A26']),
 'sensor':(sensor.BoundingBox().zmin,sensor.BoundingBox().zmax,offset['A27']),
 'metal':(upper.BoundingBox().zmin,upper.BoundingBox().zmax,offset['A07'])}
 actual={key:(low+off*ratio,high+off*ratio) for key,(low,high,off) in layers.items()}
 assert actual['base'][1]<actual['wood'][0]
 assert actual['wood'][1]<actual['heater'][0]
 assert actual['heater'][1]<actual['sensor'][0]
 assert actual['sensor'][1]<actual['metal'][0]
assert offset['A07']==offset['A28']
print('V136 physical wood-heater-metal sandwich, rigid suction duct, exploded ordering: PASS')
