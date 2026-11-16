#!/usr/bin/env python3
"""Offscreen CAD tessellation review for A optics/light and A/B bare chucks.
Requires cadquery, vtk and Xvfb. Uses exact locally generated individual STEP files.
False-colour component family encoding is for structural inspection, not material certification.
"""
import sys, math, argparse
from pathlib import Path
import cadquery as cq
import vtk
from PIL import Image,ImageOps,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'visual_review'/'V171'
OUT.mkdir(parents=True,exist_ok=True)

def family(k):
 for pre in ['A10','A18','A19','A21','A11','A08','A09','A14','A20','A07','A31','A32','A26','A27','A28','B10','B11','B12','B13','B14','B15']:
  if k.startswith(pre):return pre
 return k[:3]
COLORS={
'A10':(.20,.28,.34),'A18':(.63,.71,.75),'A19':(.22,.26,.31),'A21':(.32,.43,.51),
'A11':(.13,.15,.17),'A08':(.27,.32,.37),'A09':(.40,.50,.59),'A14':(.29,.31,.35),
'A20':(.09,.12,.13),'A07':(.75,.81,.84),'A31':(.73,.50,.24),'A32':(.20,.24,.29),
'A26':(.82,.72,.52),'A27':(.86,.56,.28),'A28':(.52,.60,.64),
'B10':(.78,.60,.32),'B11':(.77,.84,.89),'B12':(.86,.75,.54),'B13':(.82,.5,.3),'B14':(.32,.33,.38),'B15':(.47,.58,.65),
}

def vtk_geom(shape):
 vertices,triangles=shape.tessellate(.85,.25)
 points=vtk.vtkPoints();points.SetDataTypeToFloat();points.SetNumberOfPoints(len(vertices))
 for i,v in enumerate(vertices):points.SetPoint(i,v.x,v.y,v.z)
 cells=vtk.vtkCellArray()
 for a,b,c in triangles:
  t=vtk.vtkTriangle();ids=t.GetPointIds();ids.SetId(0,a);ids.SetId(1,b);ids.SetId(2,c);cells.InsertNextCell(t)
 poly=vtk.vtkPolyData();poly.SetPoints(points);poly.SetPolys(cells)
 normals=vtk.vtkPolyDataNormals();normals.SetInputData(poly);normals.SplittingOff();normals.ConsistencyOn();normals.AutoOrientNormalsOn();normals.Update()
 return normals.GetOutput()

def build_actors(prefixes,system):
 folder=ROOT/'build'/f'platform_{system}'/'parts'
 actors=[]
 for path in sorted(folder.glob('*.step')):
  key=path.stem
  if not key.startswith(tuple(prefixes)):continue
  # Rendering must follow INSTALLED BOM: never resurrect optional sample.
  if key in {'A18MGZ','A05C1302','A06GCM1102','A07W'}:continue
  shape=cq.importers.importStep(str(path)).val()
  try: mesh=vtk_geom(shape)
  except Exception as e: print('tessellate failed',key,e,flush=True);continue
  mapper=vtk.vtkPolyDataMapper();mapper.SetInputData(mesh)
  actor=vtk.vtkActor();actor.SetMapper(mapper)
  actor.GetProperty().SetColor(*COLORS.get(family(key),(.5,.5,.5)))
  actor.GetProperty().SetAmbient(.38);actor.GetProperty().SetDiffuse(.64);actor.GetProperty().SetSpecular(.14)
  actor.GetProperty().SetSpecularPower(18)
  actors.append((key,actor))
  print('mesh',key,mesh.GetNumberOfPolys(),flush=True)
 return actors

def draw(actors,title,target,direction,output,zoom=1.0,size=(1280,880)):
 ren=vtk.vtkRenderer();ren.SetBackground(.083,.116,.16)
 ren.SetUseDepthPeeling(False)
 for _,a in actors:ren.AddActor(a)
 ren.ResetCamera()
 camera=ren.GetActiveCamera()
 cam=(target[0]+direction[0],target[1]+direction[1],target[2]+direction[2])
 camera.SetFocalPoint(*target);camera.SetPosition(*cam)
 camera.SetViewUp(0,0,1)
 if abs(direction[2])>abs(direction[0])+abs(direction[1]):camera.SetViewUp(0,1,0)
 camera.ParallelProjectionOn()
 radius=math.sqrt(sum(t*t for t in direction))
 # ParallelScale half height in mm; derive from camera distance as heuristic
 camera.SetParallelScale(radius*0.55/zoom)
 ren.ResetCameraClippingRange()
 win=vtk.vtkRenderWindow();win.AddRenderer(ren);win.SetSize(*size)
 win.SetOffScreenRendering(True);win.SetMultiSamples(4)
 try:win.Render()
 except Exception as e:print('render fail',e,flush=True);raise
 f=vtk.vtkWindowToImageFilter();f.SetInput(win);f.SetScale(1);f.SetInputBufferTypeToRGB();f.ReadFrontBufferOff();f.Update()
 writer=vtk.vtkPNGWriter();writer.SetFileName(str(output));writer.SetInputConnection(f.GetOutputPort());writer.Write()
 print('render',title,output.stat().st_size,flush=True)
 win.Finalize()

def run(which):
 if which in ('A','all'):
  # Selected true STEP components; this is the actual CAD, not abstract boxes.
  ps=['A10','A18','A19','A21','A11','A08','A09','A14','A20']
  actors=build_actors(ps,'A')
  # Callouts deliberately named by camera direction in XYZ/CAD right-handed coords.
  target=(112,-48,233)
  frames=[('A-front',(0,360,150),.90),('A-right',(330,170,160),.88),
          ('A-back',(40,-380,150),.85),('A-left',(-280,100,160),.88),
          ('A-top',(0,-10,410),.72)]
  for nm,vec,z in frames:draw(actors,nm,target,vec,OUT/f'{nm}.png',zoom=z)
 if which in ('heater','all'):
  aps=['A07','A31','A32','A26','A27','A28']
  bs=['B10','B11','B12','B13','B14','B15']
  for sys,ps,target in [('A',aps,(78,0,101)),('B',bs,(82,0,109))]:
   actors=build_actors(ps,sys)
   for nm,vec,z in [('top',(40,40,110),1.2),('front',(0,120,40),1.05),('oblique',(90,-75,80),1.00)]:
    draw(actors,sys+'-'+nm,target,vec,OUT/f'{sys}-heater-{nm}.png',zoom=z,size=(1000,760))

if __name__=='__main__':
 which=sys.argv[1] if len(sys.argv)>1 else 'all';run(which)
