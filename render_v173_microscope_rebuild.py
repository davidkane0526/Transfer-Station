#!/usr/bin/env python3
"""Render the V173 photo-rebuilt A microscope body and optical interfaces."""
from pathlib import Path
from tools_render_multiview import build_actors,draw
out=Path(__file__).resolve().parent/'visual_review'/'V173'
out.mkdir(parents=True,exist_ok=True)
actors=build_actors(['A18','A18VT','A18OP','A18CBL','A18T','A18N','A19','A19O1','A19O2'],'A')
draw(actors,'V173 A microscope front-oblique photo comparison',
     (55,245,360),(85,-100,-160),out/'A-microscope-front-oblique.png',
     zoom=1.35,size=(1400,1800))
draw(actors,'V173 A microscope right-side optical port',
     (235,235,220),(90,-100,-48),out/'A-microscope-side-port.png',
     zoom=1.8,size=(1200,900))
draw(actors,'V173 A microscope focus wheels and nosepiece',
     (260,160,120),(85,-48,180),out/'A-microscope-focus-and-nosepiece.png',
     zoom=1.7,size=(1200,900))
