from tools_render_multiview import build_actors, draw,OUT
actors=build_actors(['A11','A21R','A21RK','A21L','A22'],'A')
for name,target,direction,zoom in [
 ('A11-led-front-true-pcb',(187,0,220),(-140,0,35),2.25),
 ('A11-led-front-threequarter',(200,0,220),(-135,110,80),2.0),
 ('A11-led-side',(209,0,220),(0,160,75),2.1),
 ('A11-led-rear',(213,0,220),(140,0,35),2.2)]:
 draw(actors,name,target,direction,OUT/f'{name}.png',zoom=zoom,size=(980,720))
