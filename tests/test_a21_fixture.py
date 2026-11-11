import cadquery as cq
from cadquery import Vector
def box(w,d,h,x,y,z):
    return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()
def vz(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,0,1))
def vx(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(1,0,0))
def vy(r,h,x,y,z):return cq.Solid.makeCylinder(r,h,Vector(x,y,z),Vector(0,1,0))
for lift in (0,9,18):
 foot=box(36,36,8,187.5,-87.5,20)
 for x in (175,200):
  for y in (-100,-75):
   foot=foot.cut(vz(2.7,8,x,y,20))
 post=vz(6,191,187.5,-87.5,28)
 support=foot.fuse(post)
 ring=vx(18,6,184.5,0,220+lift).cut(
     vx(15.35,6.2,184.4,0,220+lift)).cut(
     vz(1.8,5,187.5,0,235.25+lift))
 collar=vz(10,14,187.5,-87.5,187+lift).cut(
     vz(6.1,14.2,187.5,-87.5,186.9+lift)).cut(
     vx(2.1,8,193.5,-87.5,194+lift))
 bridge=vy(5,87.5,187.5,-87.5,198+lift)
 lug=box(10,12,12,187.5,0,199+lift)
 lock=vx(2,12,193.5,-87.5,194+lift).fuse(
     vx(4.5,4,203.5,-87.5,194+lift))
 ring_lock=vz(1.6,9,187.5,0,235.25+lift).fuse(
     vz(4,3,187.5,0,243.5+lift))
 lamp=vx(15.25,60.1,180,0,220+lift)
 assert all(x.isValid() for x in (support,ring,collar,bridge,lug,lock,ring_lock,lamp))
 assert abs(support.BoundingBox().zmin-20)<1e-4
 assert abs(support.BoundingBox().zmax-219)<1e-4
 assert bridge.intersect(collar).Volume()>1
 assert bridge.intersect(lug).Volume()>1
 assert lug.intersect(ring).Volume()>1
 assert lock.intersect(collar).Volume()<1e-5
 assert ring_lock.intersect(ring).Volume()<1e-5
 assert lock.distance(post)<1e-4
 assert ring_lock.distance(lamp)<1e-4
 assert post.BoundingBox().zmax>=collar.BoundingBox().zmax-1e-4
print('V134 A21 realistic radial through-bores and physical support engagement: PASS')
