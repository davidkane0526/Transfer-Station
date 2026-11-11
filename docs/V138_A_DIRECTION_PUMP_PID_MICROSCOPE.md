# V138 | Platform A actual right-hand X actuator, external pump and controllers

Date: 2026-11-11.

## User evidence and non-negotiable changes

The user shared a front-view render showing the A02 X micrometer protruding on the **left**, and explicitly stated that it must be on the **right**. The forward-aimed micrometer belongs to the other A02 translation axis, not the rotary. A06 must retain exactly one short lock.

The user also rejected the toy pump, underspecified heating cabinet and inadequate microscope head. New parts must represent real mechanical topology where possible and otherwise clearly distinguish a visual family candidate from a verified actual OEM model.

## Implemented

| Part | V138 change | Evidence limit |
| --- | --- | --- |
| A02 | X micrometer +X/right; depth/Y micrometer +Z/front; two true independent carriages | exact T25M suffix/unseen mounting holes pending |
| A06 | rotating upper dial and fixed housing; one short lock and zero linear micrometers | rotary SKU pending |
| A12 | LEDD1B W60/H73/D104 orientation, top current knob/mode selector, front current limit and rear M8 output | LED electrical pinout not certified |
| A30 | twin-head electric vacuum pump model with motor, fan, feet, head manifold and hollow inlet; A29 now terminates at pump intake | VN-50 is only Platform B family **shape** reference; Platform A pump still unidentified |
| A33 | physically separate temperature-control cabinet with PID process/setpoint windows, controls, cooling vents, wiring service and A13 SSR inside | readouts illustrative only; no electrical wiring certification |
| A10/A18 | post clamp, screw pair, guide-rail details, dovetail/coupling structures | exact microscope body OEM geometry not verified |

The V138 WebGL and STEP geometries retain independent X/Y actuation. The 90mm sample-side stack nominal height is not changed. B platform must not change.

## Verification / outstanding

- Local JavaScript syntax and pure-data tests passed; CadQuery STEP export generated successfully with A02 right and A30/A33 parts in the package. Full CAD validator needs an uninterrupted full run.
- Browser QA asserts real scene object counts, X/Y actuator side, pump intake hose alignment, LED controller nominal envelope and no double rotary handle; GitHub Actions Pages is the authoritative final integration result.
- Keep identifying the true A pump, PID unit and microscope by *original photos and vendor mechanical drawings*, rather than claiming the new surrogate is the real photographed product.
