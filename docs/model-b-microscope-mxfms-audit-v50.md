# Platform B microscope audit — V50

## Evidence boundary

This reconstruction uses only B-specific evidence:
- Photo 108 and the associated video: focusing mechanism and objective changer.
- Photo 110: one objective marked 10× / 0.15 / DIC / WD10.8 and a separate OptoSigma-branded objective.
- Photo 113: SDPTOP Digital Microscope Camera.
- Photo 116: SDPTOP MXFMS microscope identification.
- Photos 145/150: B35 installation relationship and microscope foot location.

Photos 41, 71 and 72 are excluded from B. They show the separate A-rig microscope setup and must not be used to infer B dimensions, arm direction, camera position or component color.

## Manufacturer data used

The MXFMS product-family specification published by HuiGuang Technology lists:
- Post: Ø32 mm, height 280 mm.
- Coaxial coarse/fine focusing; coarse travel 32 mm; fine adjustment precision 0.002 mm.
- 30° inclined trinocular head.
- Five-hole inward nosepiece with DIC slot.
- Standard B5 base: 320 × 260 × 16 mm.

Reference: https://www.szhgo.cn/en/metallurgicalmicroscope/310.html

A second MXFMS product specification gives the same post and B5-base envelope:
https://www.jintuofeng.com.cn/jxxwj/145.html

The model uses the manufacturer post dimensions, but does **not** add the standard B5 base. The B-specific photographs place the microscope installation foot on the local B35 Thorlabs plate; the 65 × 65 × 12 mm foot remains a photo-fit mounting adapter candidate. Its hole pattern and threaded engagement are not physically verified.

## V50 model changes

- B16 post changed to Ø32 × 280 mm.
- Added a post clamp and the two-sided coaxial coarse/fine focus wheels. Wheel diameters remain visual candidates; the manufacturer specifies travel and precision, not wheel diameters.
- Added the offset nosepiece support and a five-port inward nosepiece. The five-port pitch/rotation datum is a visual candidate, not a measured OEM dimension.
- B17 now includes two stepped camera relay/CTV adapter sections below the SDPTOP camera. The exact camera model and C-mount/CTV interface remain unverified.
- B18 now represents five nosepiece ports and only two installed objective proxies: the photo110 10×/0.15/DIC/WD10.8 objective and a separate OptoSigma-branded objective with unknown model.

## WebGL / STEP consistency

The Three.js model and CadQuery STEP generator use the same main datums for the post, body, arm, camera and objective stack. Browser regression checks inspect the actual rendered mesh tags. STEP validation checks the post envelope, connected focus/camera/objective solids, five open nosepiece ports and the objective clearance above the slide.

## Not yet physically accepted

- Exact MXFMS variant (MXFMS vs MXFMS-BD) and whether all listed optional optical modules are fitted.
- Whether the installed B rig uses the full standard B5 base or a modified mounting arrangement; the current model follows the photographed B35 custom-foot arrangement.
- B35 and microscope-foot hole coordinates, screw sizes, thread engagement and clamp preload.
- Actual focus-wheel diameters, nosepiece pitch circle and angular detents.
- Camera model, sensor, CTV/relay magnification and objective-to-camera parfocal setup.
- Exact OptoSigma objective model and its NA / working distance.

The model is a reverse-engineering visualization and candidate interface model, not a machining drawing or an optical alignment certificate.
