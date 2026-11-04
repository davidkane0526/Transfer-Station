// V47 manual image-landmark calibration, based on readable standalone
// user photos 94 and 95. These images DO NOT contain a ruler.
// All pixel landmarks were estimated visually at the rendered original
// image resolution. Do not promote to precise photo metrology.
// Critical source images 145-151 remain inside unavailable ZIP.
export const PLATFORM_A_PHOTO_SCALE = Object.freeze({
  photo94: Object.freeze({
    image:'微信图片_20261028102154_94_344.jpg',
    calibrationPart:'GCM-G40M60L',
    nominalReferenceWidthMm:40,
    referenceFaceLeftPx:433,
    referenceFaceRightPx:970,
    foldedSheetLeftPx:62,
    foldedSheetRightPx:1064,
    sheetPlaneIsSameAsReferenceFace:false,
    notes:'approximate x-landmarks only; top sheet is closer to camera, perspective not removed'
  }),
  photo95: Object.freeze({
    image:'微信图片_20261028102154_95_344.jpg',
    calibrationPart:'GCM-T25M',
    nominalReferenceWidthMm:65,
    referenceFaceLeftPx:455,
    referenceFaceRightPx:1265,
    underlyingBlackBaseTopPx:1020,
    underlyingBlackBaseBottomPx:1250,
    nominalReferenceFaceIsCoplanarWithBase:false,
    notes:'bottom block silhouette might include an adapter or magnet trim, not a confirmed magnetic SKU'
  }),
  unavailableRulerPhotos:['145','146','147','148','149','150','151'],
  rulerImagesReadInCurrentSession:false
});

function round(value){return Number(value.toFixed(1))}
export function inferAProxyDimensionsFromOriginalPhotos({
  photo94=PLATFORM_A_PHOTO_SCALE.photo94,
  photo95=PLATFORM_A_PHOTO_SCALE.photo95,
  sheetPerspectiveRelativeError=0.20,
  basePerspectiveRelativeError=0.25
}={}){
  for(const error of [sheetPerspectiveRelativeError,basePerspectiveRelativeError]){
    if(!Number.isFinite(error)||error<0||error>=1)throw RangeError('Invalid perspective error bound');
  }
  const widthPx=photo94.referenceFaceRightPx-photo94.referenceFaceLeftPx;
  const stageCenterPx=(photo94.referenceFaceLeftPx+photo94.referenceFaceRightPx)/2;
  const topWidthPx=photo94.foldedSheetRightPx-photo94.foldedSheetLeftPx;
  const scaleMmPx=photo94.nominalReferenceWidthMm/widthPx;
  const sheetWidth=topWidthPx*scaleMmPx;
  const leftOverhang=(stageCenterPx-photo94.foldedSheetLeftPx)*scaleMmPx;
  const rightOverhang=(photo94.foldedSheetRightPx-stageCenterPx)*scaleMmPx;
  const baseWidthPx=photo95.referenceFaceRightPx-photo95.referenceFaceLeftPx;
  const baseHeightPx=photo95.underlyingBlackBaseBottomPx-photo95.underlyingBlackBaseTopPx;
  if(!(widthPx>0&&baseWidthPx>0&&topWidthPx>0&&baseHeightPx>0&&
      photo94.nominalReferenceWidthMm>0&&photo95.nominalReferenceWidthMm>0))
    throw RangeError('Bad source photo landmark scale');
  const baseHeight=baseHeightPx*photo95.nominalReferenceWidthMm/baseWidthPx;
  const band=(val,frac)=>[round(val*(1-frac)),round(val*(1+frac))];
  return Object.freeze({
    sourceImages:['94','95'],
    calibrationMethod:'known-product-projected-size ratio, NOT ruler read',
    photo94PixelsPerMm:round(1/scaleMmPx),
    sheetTopWidthMm:round(sheetWidth),
    sheetTopWidthUncertaintyMm:band(sheetWidth,sheetPerspectiveRelativeError),
    sheetLeftOverhangMm:round(leftOverhang),
    sheetLeftOverhangUncertaintyMm:band(leftOverhang,sheetPerspectiveRelativeError),
    sheetRightOverhangMm:round(rightOverhang),
    sheetRightOverhangUncertaintyMm:band(rightOverhang,sheetPerspectiveRelativeError),
    baseHeightSilhouetteMm:round(baseHeight),
    baseHeightSilhouetteUncertaintyMm:band(baseHeight,basePerspectiveRelativeError),
    a17Height20WithinPhotoSilhouetteBand:band(baseHeight,basePerspectiveRelativeError)[0]<=20&&20<=band(baseHeight,basePerspectiveRelativeError)[1],
    photo94LegLengthMeasured:false,
    photo95MagneticBaseIdentityConfirmed:false,
    commonGlobalFilmToSampleDatumMeasured:false,
    rulerPhotosMeasured:false,
    componentPlanePerspectiveCorrected:false,
    validForMachiningOrOEMBolting:false
  });
}
