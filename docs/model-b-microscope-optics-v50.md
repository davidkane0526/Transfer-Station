# Platform B microscope reconstruction — V50

## Photo evidence

Photos 41, 71 and 72 are used together because they show the same microscope assembly from different viewpoints.

Visible features reconstructed:
- Black microscope head/housing and rear vertical support post.
- Round horizontal support boom between the rear post and optical head.
- Stepped side-facing cylindrical optical/tube assembly and focusing knob.
- Square digital camera at the top of the vertical optical axis.
- Five stepped coaxial tube/collar sections between the head and camera.
- Cable arching over the camera housing.
- Rotating nosepiece with three visible downward objective barrels.

The Thorlabs TTL200-A marking is partially visible on the microscope tube assembly. An Olympus marking is visible on at least one objective barrel. These observations do not identify the complete microscope or camera system.

## Model implementation

- WebGL groups: B16 support/head, B17 camera and vertical tube, B18 nosepiece/objectives.
- STEP parts: B16B round boom and end collars; B16C black head plus side tube; B16D objective-tube mount; B17 camera, stepped tube and cable loop; B18 fused three-objective nosepiece.
- Browser regression checks count the rendered tube sections, side tube segments, cable loop and objective barrels.
- CAD validation checks the STEP bounding boxes and connected solids.

## Dimensional status

All new optical and support dimensions are photo-fit candidates, not manufacturer CAD or measured dimensions. The 76 mm camera tube stack is a geometric reconstruction only. It must not be interpreted as a verified optical tube length, parfocal distance, flange focal distance, working distance or focus setting.

The exact camera model, camera interface, objective magnifications/NA, nosepiece model, side-tube function, thread forms and support-joint details remain unverified. The STEP geometry is for reverse-engineering visualization and interface planning, not direct machining or optical design.
