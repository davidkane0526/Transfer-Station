"""Self-contained synthetic BREP fixtures. Never use as OEM geometry."""
import unittest
import cadquery as cq
from extract_oem_features import describe, extract_circles
from classify_oem_mounting import enrich_circles, cylinder_walls


class TopologyEvidenceTest(unittest.TestCase):
    def test_real_brep_counterbore_walls_not_certified_fasteners(self):
        block=(cq.Workplane('XY').box(65,65,23)
          .faces('>Z').workplane()
          .pushPoints([(-25,-25),(-25,25),(25,-25),(25,25)])
          .cboreHole(6.5,11,4).val())
        out=describe(block,'none')
        feats=out['candidate_features']
        small=[f for f in feats if abs(2*f['radius_mm']-6.5)<.01]
        large=[f for f in feats if abs(2*f['radius_mm']-11)<.01]
        self.assertGreaterEqual(len(small),8)
        self.assertGreaterEqual(len(large),8)
        self.assertTrue(any(f['stepped_coaxial_candidate'] for f in small))
        self.assertTrue(all(f['geometric_wall_kind']=='circle_only_unresolved'
                            or f['geometric_wall_kind']=='closed_solid_bore_wall_candidate'
                            for f in small+large))
        self.assertTrue(any(f['geometric_wall_kind']=='closed_solid_bore_wall_candidate'
                            for f in small+large))
        self.assertFalse(out['summary']['physical_interface_accepted'])
        self.assertFalse(any(f['mounting_hole_verified'] or f['thread_verified']
                             for f in feats))

    def test_external_cylindrical_shaft_not_misclassified_as_hole(self):
        pin=cq.Workplane('XY').circle(3.25).extrude(12).val()
        out=describe(pin)
        self.assertEqual(len(out['candidate_features']),2)
        self.assertTrue(all(f['geometric_wall_kind']=='closed_solid_external_wall_candidate'
                            for f in out['candidate_features']))
        self.assertTrue(all(not f['mounting_hole_verified'] for f in out['candidate_features']))

    def test_open_shell_has_no_certified_solid_orientation(self):
        solid=cq.Workplane('XY').circle(3.25).extrude(12).val()
        side=[f for f in solid.Faces() if f.geomType()=='CYLINDER'][0]
        # The vendor NFP source contains 0 enclosed solids; even a familiar
        # cylinder in a shell cannot imply an internal threaded bore.
        surface=cq.Compound.makeCompound([side])
        self.assertEqual(len(surface.Solids()),0)
        out=describe(surface)
        self.assertTrue(all(f['geometric_wall_kind']=='surface_shell_unresolved'
                            for f in out['candidate_features']))
        self.assertFalse(out['summary']['physical_interface_accepted'])

    def test_non_vertical_cylinders_not_used_as_vertical_bolt_holes(self):
        solid=cq.Workplane('YZ').circle(3.25).extrude(12).val()
        data=describe(solid)
        self.assertEqual(data['summary']['native_cylindrical_walls_vertical'],0)
        self.assertTrue(all(f['geometric_wall_kind']=='circle_only_unresolved'
                            for f in data['candidate_features']))


if __name__=='__main__':
    unittest.main()
