// Physical-photo evidence added 2026-11-03.
// Source IDs are image basenames in the user-supplied ZIP, not web assets.
// OEM numerical dimensions and photo-measured proportions are separate.
export const DIMENSION_PHOTOS_V28=Object.freeze({
  B:{
    sampleSide:['145','146','147','148'],
    filmSide:['149','150','151'],
    evidence:{
      B02:{images:['149','151'],observedModel:'GCM-420302M',
        claim:'Magnet base below the B03 / B04 stack; side OFF/ON label visible'},
      B24:{images:['149','150'],observedModel:'Zolix PHUC-1',
        claim:'Black two-part cylindrical universal post clamp with thumbscrews; NOT PHCP-2'},
      B06:{images:['150'],observedModel:'Daheng GCM-1302M',
        claim:'Two adjusting screws on plate holder; stem on its underside'},
      B08:{images:['145','146','147'],observedModel:'GCM-11 rotation stage, subtype from photo111 GCM-1107M',
        claim:'Rotation stage below the silver NFP translation stage'},
      B09:{images:['145','146','147','148'],observedModel:'Zolix NFP-1462C',
        claim:'Single-axis translation stage immediately on rotary stage'},
      B10:{images:['145','146'],observedModel:null,
        claim:'White brittle insulating blocks below metal heating plate'},
      B11:{images:['145','146','147','148'],observedModel:null,
        claim:'Upper metal chuck over the insulating layer'}
    }
  },
  A:{
    sampleSide:['137','138','139','140','141','143','144'],
    filmSide:['142','152'],
    overall:['155','161'],
    evidence:{
      A16:{images:['137','138','161'],observedModel:'Daheng GCM-5306M',
        claim:'112 x 70 x 8mm mounting BASE under A rotary, NOT rotation stage'},
      A03:{images:['142','161'],observedModel:'Daheng GCM-VC13M',
        claim:'Separate vertical motion stage on film side'},
      A04:{images:['142','161'],observedModel:'Daheng GCM-G40M60L',
        claim:'Upper film-side goniometer with separate micrometer'}
    }
  }
});
export const V28_OEM_DIMENSIONS=Object.freeze({
  PHUC1:{manufacturer:'Zolix',lengthAmm:60,outerDiameterBmm:30,
    boreCmm:12,boreDmm:12,boreCenterSpacingEmm:33,massKg:0.12,
    drawing:'https://www.zolix-group.com/public/storage/upload/files/MirrorMount/PHUC.pdf',
    note:'The maker drawing gives two distinct post axes. Relative swivel angle set by installer, not a fixed 90° requirement.'},
  GCM1302M:{manufacturer:'Daheng',mountThread:'M6',Lmm:60,
    massG:105,maximumPlateThicknessMm:5,
    note:'The L dimension does not specify jaw gap or all screw coordinates.'},
  GCM5306M:{manufacturer:'Daheng',lengthMm:112,widthMm:70,
    thicknessMm:8,massG:150,kind:'post/mounting base',
    note:'Do not count the 5306M as the rotary stage itself.'}
});
export const V28_MEASUREMENT_RULES=Object.freeze({
  ruler:'Steel rulers in user photos constrain approximate projected distance only; perspective and non-coplanarity prevent manufacturing tolerance claims',
  trust:'Photo-identified names P; numerical manufacturer dimensions D; photographic ruler approximations I',
  noAutoMerge:'A 94/95/97/137-144/152/155/161 is distinct from B 107-112/145-151',
  fullB:'Do not remove B sample stage, microscope, heater or glass when correcting B film-side parts'
});
export function validateDimensionArchive(){
 const a=new Set(Object.values(DIMENSION_PHOTOS_V28.A).flatMap(x=>Array.isArray(x)?x:Object.values(x).flatMap(y=>y.images)));
 const b=new Set(Object.values(DIMENSION_PHOTOS_V28.B).flatMap(x=>Array.isArray(x)?x:Object.values(x).flatMap(y=>y.images)));
 const overlap=[...a].filter(x=>b.has(x));
 if(overlap.length)throw Error('Same photograph assigned to both rigs: '+overlap.join(','));
 const p=V28_OEM_DIMENSIONS.PHUC1;
 if(p.lengthAmm!==60||p.outerDiameterBmm!==30||p.boreCenterSpacingEmm!==33||p.boreCmm!==12||p.boreDmm!==12)
   throw Error('PHUC-1 must match manufacturer drawing');
 return {platforms:2,newPhotos:18,oem:'PHUC-1/GCM-1302M/GCM-5306M',overlap};
}
