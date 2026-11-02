"""Synthetic BREP QA, not original NFP measurement."""
from pathlib import Path
import unittest
import cadquery as cq
from extract_oem_features import describe,extract_circles,rotate_into_web,square_pitches_by_diameter


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

    def test_nominal_diameter_separates_counterbore_from_threadlike_grid(self):
        block=(cq.Workplane('XZ').box(65,65,23).faces('>Y').workplane()
               .pushPoints([(-25,-25),(-25,25),(25,-25),(25,25)])
               .cboreHole(6.5,11,4).val())
        by=describe(block)['summary']['square_pitch_by_diameter']
        self.assertGreaterEqual(by['Ø6.5mm']['square_layouts']['50mm'],1)
        self.assertGreaterEqual(by['Ø11mm']['square_layouts']['50mm'],1)
        self.assertEqual(by['Ø6.5mm']['square_layouts']['25mm'],0)
        self.assertEqual(by['Ø11mm']['square_layouts']['25mm'],0)
        self.assertEqual(by['Ø6mm']['ring_candidates'],0)

    def test_25mm_m6like_grid_outer_50mm_is_not_counterbore_evidence(self):
        # Two distinct sets can BOTH make a 50mm square. This is the
        # geometric ambiguity on the manufacturer's mounting drawing.
        points=[
            {'center_mm':[x,12.,z],'radius_mm':3.,
             'horizontal_plane_candidate':True,'full_circle_candidate':True}
            for x in (-25.,0.,25.) for z in (-25.,0.,25.)]
        points.extend(
            {'center_mm':[x,0.,z],'radius_mm':3.25,
             'horizontal_plane_candidate':True,'full_circle_candidate':True}
            for x in (-25.,25.) for z in (-25.,25.))
        by=square_pitches_by_diameter(points)
        self.assertEqual(by['Ø6mm']['square_layouts']['50mm'],1)
        self.assertEqual(by['Ø6mm']['square_layouts']['25mm'],4)
        self.assertEqual(by['Ø6.5mm']['square_layouts']['50mm'],1)
        self.assertEqual(by['Ø6.5mm']['square_layouts']['25mm'],0)

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
