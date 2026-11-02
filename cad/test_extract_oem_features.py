"""Synthetic BREP QA, not original NFP measurement."""
from pathlib import Path
import unittest
import cadquery as cq
from extract_oem_features import describe,extract_circles,rotate_into_web


class CandidateBrepFeatureTest(unittest.TestCase):
    def setUp(self):
        # Artificial vertical Y-axis hole array, dimensions only for QA.
        self.example=(cq.Workplane('XZ').box(65,65,23).faces('>Y').workplane()
                      .pushPoints([(-25,-25),(-25,25),(25,-25),(25,25)])
                      .hole(6.5).val())

    def test_circle_coordinates_and_counter(self):
        out=describe(self.example)
        holes=[x for x in out['candidate_features'] if
               x['diameter_hint']=='nominal Ø6.5 geometry']
        self.assertEqual(len(holes),8)
        self.assertTrue(all(x['full_circle_candidate'] for x in holes))
        self.assertTrue(all(x['horizontal_plane_candidate'] for x in holes))
        self.assertEqual(out['summary']['vertical_axis_cylindrical_faces'],4)
        self.assertFalse(out['summary']['physical_interface_accepted'])
        self.assertGreaterEqual(out['summary']['square_pitch_layout_candidates']['50mm'],1)
        self.assertEqual(out['summary']['square_pitch_layout_candidates']['32mm'],0)
        self.assertTrue(all(not x['thread_verified'] for x in holes))

    def test_axis_permutation_and_handedness(self):
        self.assertEqual(rotate_into_web([1,2,3],'nfp1462c'),[3,1,2])
        out=describe(self.example,preset='nfp1462c')
        self.assertEqual(out['summary']['horizontal_plane_circular_candidates'],0)
        self.assertEqual(out['summary']['vertical_axis_cylindrical_faces'],0)

    def test_duplicate_edges_are_grouped_and_not_threads(self):
        shape=cq.Workplane('XY').circle(5.5).extrude(10).val()
        circles=extract_circles(shape)
        self.assertEqual(len(circles),2)
        self.assertTrue(all(f['diameter_hint']=='nominal Ø11 geometry' for f in circles))
        self.assertTrue(all(not f['mounting_hole_verified'] for f in circles))


if __name__=='__main__':
    unittest.main()
