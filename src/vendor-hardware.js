// Public OEM product catalog data; identifiers and dimensions sourced from
// vendor product pages. MODEL MATCH TO USER'S UNMARKED PHYSICAL HARDWARE IS NOT
// VERIFIED. Geometry orientation and junctions are layout candidates only.
export const OPTICAL_HARDWARE={
  B24:{
    maker:'Zolix',model:'PHUC-1',name:'万向旋转双杆夹（照片149实物铭牌确认）',
    known:{postDiameterMm:12,holes:2,relativeRotationDeg:360,
      weightKg:0.12,lengthAmm:60,outerDiameterBmm:30,
      boreCenterSpacingEmm:33},
    oemDrawing:'https://www.zolix-group.com/public/storage/upload/files/MirrorMount/PHUC.pdf',
    bodyKind:'phuc_universal_two_clamp_bodies',
    confidence:'photo149-model-confirmed/OEM-dimensions-confirmed/assembly-angles-pending',
    url:'https://www.zolix-group.com/product/detail/121.html',
    alternative:{maker:'Zolix',model:'PHCP-2',postDiameterMm:12,
      note:'Different two-part clamp; NOT the pictured PHUC-1',
      url:'https://www.zolix.com.cn/prodcon_371_399_467_729.html'}
  },
  B25:{
    maker:'Zolix',model:'PHSP12系列（后缀未确认）',name:'第一根Ø12×85mm杆（场景拟合）',
    known:{diameterMm:12,overallLengthMm:85,overallLengthMeasured:false},
    confidence:'manufacturer-product-exists/photo-length-not-confirmed',
    url:'https://www.zolix-group.com/product/detail/220.html',
    alternative:{maker:'Daheng',series:'GCM-0301',diameterMm:12.7,
      url:'https://www.spl-tech.cn/productinfo/3312217.html'}
  },
  B27:{
    maker:'Zolix',model:'PHSP12-4',name:'不锈钢 Ø12×100 mm 立杆（照片尺规候选）',
    known:{diameterMm:12,overallLengthMm:100,middleCrossHoleOffsetMm:30,weightKg:0.10},
    confidence:'manufacturer-product-exists/photo149-length-fit-not-confirmed',
    url:'https://www.zolix.com.cn/prodcon_371_399_467_664.html'
  },
  B34:{
    maker:'Zolix',model:'PHSH-2',name:'黑色 Ø12 杆套筒，50 mm（照片尺规候选）',
    known:{postDiameterMm:12,overallHeightMm:50,weightKg:0.04},
    confidence:'manufacturer-product-exists/photo149-sleeve-SKU-not-confirmed',
    url:'https://www.zolix-group.com/product/detail/225.html'
  },
  B06:{
    maker:'Daheng',model:'GCM-1302M',name:'薄板夹持器（照片150确认型号）',
    known:{acceptsPlateThicknessUpToMm:5,thread:'M6',modelLmm:60,weightG:105},
    confidence:'photo150-model-confirmed/OEM-plate-dimensions-confirmed/jaw-fit-pending',
    mechanism:{adjustmentScrewCount:2,movingPressurePlates:1,documentedBy:'Daheng GCM-13 product description'},
    url:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/',
    alternative:{maker:'Daheng',model:'GCSM-680010',mountingPitchMm:[50,25],
      note:'专用显微镜载玻片架，中央镂空；平移台直装而非横杆侧夹',
      url:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcsm-680010載玻片夾持架/'}
  }
};
export const HOLDER_CONNECTIVITY=[
 {id:'V25M-side-carriage-to-base',from:'B04',to:'B05',status:'photo108-side-mount/candidate-bolting'},
 {id:'base-to-holder',from:'B05',to:'B34',status:'photo-height-fit/bolted-connection-pending'},
 {id:'holder-to-post',from:'B34',to:'B27',status:'photo-exposed-post/rod-length-candidate'},
 {id:'support-post-to-square-clamp',from:'B27',to:'B33',status:'photo-body-model-pending'},
 {id:'square-clamp-to-first-rod',from:'B33',to:'B25',status:'photo-body-model-pending'},
 {id:'first-rod-to-PHUC',from:'B25',to:'B24',status:'photo-model-confirmed/joint-angle-pending'},
 {id:'PHUC-to-second-rod',from:'B24',to:'B28',status:'photo-model-confirmed/rod-length-pending'},
 {id:'second-rod-to-M6-face',from:'B28',to:'B26',status:'photo108-direct-side-contact/thread-unverified'},
 {id:'M6-face-to-plate-holder',from:'B26',to:'B06',status:'interface-only/zero-purchase-quantity'},
 {id:'plate-holder-to-slide',from:'B06',to:'B07',status:'photo-only'}
];
export function checkSourcedHolderPath(){
 const out=new Map(HOLDER_CONNECTIVITY.map(x=>[x.from,x.to]));
 const seen=new Set();let id='B04';
 while(id!=='B07'){
  if(seen.has(id)||!out.has(id))throw Error('Missing or looping plate-holder load path: '+id);
  seen.add(id);id=out.get(id);
 }
 for(const key of ['B24','B25','B27','B34','B06']){
  if(!OPTICAL_HARDWARE[key]?.url)throw Error('Unsourced OEM model '+key);
 }
 return {connected:true,links:HOLDER_CONNECTIVITY.length,
   photoConfirmedModels:['B24:PHUC-1','B06:GCM-1302M'],
   realHardwareIdentityAccepted:true,
   fullAssemblyAccepted:false,physicalFastenersAccepted:false};
}
