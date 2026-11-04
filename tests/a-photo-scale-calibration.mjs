import assert from 'node:assert/strict';
import {PLATFORM_A_PHOTO_SCALE,inferAProxyDimensionsFromOriginalPhotos} from '../src/a-photo-scale-calibration.js';
const x=inferAProxyDimensionsFromOriginalPhotos();
assert.deepEqual(x.sourceImages,['94','95']);
assert(x.sheetTopWidthMm>=74&&x.sheetTopWidthMm<=75);
assert(x.sheetLeftOverhangMm>=47&&x.sheetLeftOverhangMm<=49);
assert(x.sheetRightOverhangMm>=26&&x.sheetRightOverhangMm<=28);
assert(x.baseHeightSilhouetteMm>=18&&x.baseHeightSilhouetteMm<=19.5);
assert.equal(x.a17Height20WithinPhotoSilhouetteBand,true);
assert.equal(x.photo94LegLengthMeasured,false);
assert.equal(x.photo95MagneticBaseIdentityConfirmed,false);
assert.equal(x.commonGlobalFilmToSampleDatumMeasured,false);
assert.equal(x.rulerPhotosMeasured,false);
assert.equal(x.componentPlanePerspectiveCorrected,false);
assert.equal(x.validForMachiningOrOEMBolting,false);
assert.equal(PLATFORM_A_PHOTO_SCALE.rulerImagesReadInCurrentSession,false);
assert.deepEqual(PLATFORM_A_PHOTO_SCALE.unavailableRulerPhotos,
 ['145','146','147','148','149','150','151']);
assert.throws(()=>inferAProxyDimensionsFromOriginalPhotos({sheetPerspectiveRelativeError:1}),/Invalid/);
assert.throws(()=>inferAProxyDimensionsFromOriginalPhotos({
 photo94:{...PLATFORM_A_PHOTO_SCALE.photo94,referenceFaceRightPx:433}
}),/Bad source/);
console.log('V47 original A photo94/95 metric ratios and honest ruler-data provenance: PASS');
