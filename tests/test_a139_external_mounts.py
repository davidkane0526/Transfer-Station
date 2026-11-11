import cadquery as cq
from cadquery import Vector

def box(w,d,h,x,y,z):
    return cq.Workplane('XY').box(w,d,h,centered=(True,True,False)).translate((x,y,z)).val()

def near(a,b,tol=1e-4):return abs(a-b)<=tol

def check(a,msg):
    assert a,msg

# These are the exact A12/A12F, A13, A30 and A33 lower-solid coordinates
# from cad/build_assemblies.py. Kept independent of STEP exports so a change
# to either the geometry or these datums needs explicit review.
base=box(80,124,3,262,-80,0)
driver=box(60,104,70,262,-80,3)
ssr=box(75,64,33,260,72,0)
pump=box(200,110,8,340,-190,0)
cabinet=box(154,148,5,260,95,0)
check(all(x.isValid() for x in [base,driver,ssr,pump,cabinet]),
      'Control and pump solid meshes must be valid')
check(near(base.BoundingBox().zmin,0),'LEDD1B mounting foot must rest on ground')
check(near(base.BoundingBox().zmax,driver.BoundingBox().zmin),
      'LEDD1B driver MUST rest on its 3mm mounting foot, not float')
check(driver.intersect(base).Volume()<1e-5,
      'LEDD1B case must not penetrate its mounting foot')
for label,solid in [('SSR',ssr),('vacuum pump',pump),('PID cabinet',cabinet)]:
    check(near(solid.BoundingBox().zmin,0),label+' grounded datum violated')
print('V139 grounded LEDD1B foot/chassis, SSR, pump and PID cabinet: PASS')
