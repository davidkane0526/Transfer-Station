#!/usr/bin/env python3
"""Inspect the actual V172 STEP nosepiece parts from above/below, no invented parts."""
from pathlib import Path
from tools_render_multiview import build_actors,draw
out=Path(__file__).resolve().parent/'visual_review'/'V172'
out.mkdir(parents=True,exist_ok=True)
sel=['A18N','A18SR','A18AD','A18VR','A19']
actors=build_actors(sel,'A')
# These viewpoints physically show the right vertical barrel lined up with X78
# and the second barrel displaced to the left X42 (OEM indexing unknown).
draw(actors,'V172 nosepiece underside', (66,0,152), (100,-100,-150),
     out/'A19-underside-alignment.png',zoom=1.9,size=(1100,800))
draw(actors,'V172 nosepiece above', (66,0,161), (100,-120,175),
     out/'A19-top-open-optical-channel.png',zoom=2,size=(1100,800))
