"""Audit the OEM NFP CAD archive. Never commit or redistribute its extracted contents.
Usage: python cad/audit_vendor_archive.py --url URL --report build/vendor/NFP.json
       python cad/audit_vendor_archive.py --archive /path/NFP.rar --report report.json --export-local-stl vendor-local/NFP-1462C.stl
"""
import argparse, json, hashlib, shutil, subprocess, tempfile, urllib.request
from pathlib import Path
p=argparse.ArgumentParser()
g=p.add_mutually_exclusive_group(required=True)
g.add_argument('--url');g.add_argument('--archive',type=Path)
p.add_argument('--report',type=Path,required=True)
p.add_argument('--export-local-stl',type=Path,help='Local private STL; never commit')
a=p.parse_args()
if not shutil.which('7z'): raise SystemExit('Install 7zip/p7zip-full')
report={'url':a.url,'files':[],'step_solids':[],'distributes_vendor_cad':False,
        'warning':'OEM native CAD must not be republished without rights; metadata only'}
with tempfile.TemporaryDirectory() as tmp:
    tmp=Path(tmp);source=tmp/'archive.rar'
    if a.archive: shutil.copyfile(a.archive,source)
    else:
        req=urllib.request.Request(a.url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=120) as resp,source.open('wb') as out:
            shutil.copyfileobj(resp,out)
    report['sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
    report['archive_size_bytes']=source.stat().st_size
    if source.stat().st_size < 100:raise ValueError('Invalid OEM archive')
    dest=tmp/'extracted';dest.mkdir()
    proc=subprocess.run(['7z','x','-y','-bd',f'-o{dest}',str(source)],
                        text=True,capture_output=True,timeout=150)
    if proc.returncode:raise ValueError(proc.stderr[-700:]+' '+proc.stdout[-700:])
    steps=[]
    for file in sorted(dest.rglob('*')):
        if not file.is_file():continue
        report['files'].append({'name':str(file.relative_to(dest)),'bytes':file.stat().st_size,
                                'suffix':file.suffix.lower()})
        if file.suffix.lower() in ('.step','.stp','.iges','.igs'):steps.append(file)
    if steps:
        import cadquery as cq
        for file in steps:
            try:
                obj=cq.importers.importStep(str(file)) if file.suffix.lower() in ('.step','.stp') else cq.importers.importIges(str(file))
                solids=obj.solids().vals()
                shapes=obj.objects
                compound=cq.Compound.makeCompound(shapes)
                bb=compound.BoundingBox()
                faces=compound.Faces();shells=compound.Shells()
                report['step_solids'].append({
                  'filename':str(file.relative_to(dest)),
                  'top_level_shapes':len(shapes),
                  'shape_types':[sh.ShapeType() for sh in shapes[:12]],
                  'solids':len(solids),'shells':len(shells),'faces':len(faces),
                  'bbox_mm':[round(bb.xlen,2),round(bb.ylen,2),round(bb.zlen,2)],
                  'valid':all(sh.isValid() for sh in shapes),
                  'can_export_as_step':len(shapes)>0})
            except Exception as ex:
                report['step_solids'].append({'filename':str(file.relative_to(dest)),'error':str(ex)[:350]})
        if a.export_local_stl:
            import sys
            f=next((x for x in steps if x.suffix.lower() in ('.step','.stp')),None)
            if not f:raise ValueError('No STEP for STL conversion')
            a.export_local_stl.parent.mkdir(parents=True,exist_ok=True)
            subprocess.run([sys.executable,str(Path(__file__).with_name('convert_vendor_step_to_stl.py')),
                str(f),str(a.export_local_stl),'--preset','nfp1462c'],check=True,timeout=200)
            report['local_stl']=str(a.export_local_stl)
            report['local_stl_bytes']=a.export_local_stl.stat().st_size
            report['local_stl_orientation']='NFP source STEP OEM XYZ rotated into webpage X-horizontal/Y-vertical/Z-depth'
            report['local_stl_republished']=False
a.report.parent.mkdir(parents=True,exist_ok=True)
a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
