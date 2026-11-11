import cadquery as cq
from cadquery import Vector
def box(w,d,h,x,y,z):
 return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()
def vz(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))
def vy(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
cx=78
pocket=box(38.6,38.6,5.4,cx,0,97.2)
vertical=vz(.7,5.5,cx,0,103.8)
side=vy(1.1,33.5,cx,-33,104.7)
bores=[vy(1.25,13.6,cx+x,-32.5,99.4) for x in (10,16)]
probe=vy(.75,13.6,cx-10,-32.5,102.3)
upper=box(65,65,12,cx,0,97.2).cut(pocket,vertical,side,probe,*bores)
for x in (-25,25):
 for y in (-25,25):upper=upper.cut(vz(3.25,2.5,cx+x,y,106.7))
heater=box(38,38,5,cx,0,97.4)
junction=vz(.45,.18,cx-10,0,102.41)
assert all(x.isValid() for x in (upper,heater,junction))
assert len(upper.Solids())==1
assert upper.intersect(heater).Volume()<1e-5
assert upper.intersect(junction).Volume()<1e-5
assert abs(upper.BoundingBox().zmin-97.2)<1e-5
assert abs(upper.BoundingBox().zmax-109.2)<1e-5
assert upper.intersect(vertical).Volume()<1e-5
assert upper.intersect(side).Volume()<1e-5
assert vertical.intersect(side).Volume()>0
assert heater.BoundingBox().zmax<102.6
print('V135 A07 metal vacuum bore+rear passage, embedded heater and separate sensor groove: PASS')
