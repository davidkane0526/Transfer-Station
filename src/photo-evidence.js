// Structural evidence ledger. ONLY photo-visible direction and vertical order
// are treated as confirmed. Web X is left/right, Y vertical, Z back/front.
// Side-facing positive X means "right" in the consistent local front view.
// For uncertain mounting sides, dimensions are still proxies.
export const STACKS={
  B:{
    film:['B02','B03','B04','B05','B06','B07'],
    sample:['B08','B09','B10','B11'],
    photo:['108.jpg','109.jpg','110.jpg','111.jpg','112.jpg'],
    confidence:'B02底部/B03双轴T25M2L(33mm,两根水平手柄)其上/B04竖直升降台再上：照片108、109及厂家GCM-901604M组合图'
  },
  A:{
    film:['A15','A03','A04','A05'],
    sample:['A06','A02','A07'],
    photo:['94.jpg','95.jpg','97.jpg','100.jpg'],
    confidence:'A15双轴T25M系列(33mm,两根水平手柄)在A03下，照片97；A02样品侧具体单/双轴后缀未证实，照片100'
  }
};
export const HANDLES={
  B03:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'-X',secondaryDirection:'+Z',localDirection:'+X',installationYawDeg:180,brandedFace:'-Z',evidence:'108.jpg磁座铭牌面见手柄在左；109.jpg从相反的T25M铭牌面看手柄在右，是同一根手柄',confidence:'photo'},
  B04:{kind:'vertical',direction:'+Y',evidence:'108.jpg：移动臂侧面竖直银色测微头',confidence:'photo'},
  B08:{kind:'rotation-lock',direction:'+Z',evidence:'111.jpg：刻度旋转台朝向观察者的银色调节杆',confidence:'photo'},
  B09:{kind:'horizontal',direction:'+X',evidence:'110.jpg：NFP-1462C右侧的银色微分头',confidence:'photo'},
  A15:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'+X',secondaryDirection:'+Z',evidence:'95.jpg、97.jpg：VC13M下方T25M右伸微分头',confidence:'photo'},
  A03:{kind:'vertical',direction:'+Y',evidence:'97.jpg：VC13M竖直导轨正面银色测微装置',confidence:'photo'},
  A04:{kind:'tilt',direction:'+X',evidence:'94.jpg：G40M60L右伸微分头',confidence:'photo'},
  A06:{kind:'rotation-lock',direction:'+Z',evidence:'100.jpg：圆刻度台前侧可见锁止件',confidence:'candidate'},
  A02:{kind:'horizontal',axes:1,handles:1,thicknessMm:20,subtypeUnverified:true,direction:'+X',evidence:'100.jpg：旋转台上方T25M右侧银色微分头',confidence:'photo'}
};
export const MAGNET_PLACEMENT={id:'B02',lowest:true,baseZmm:20,topZmm:40,
  evidence:'108.jpg/112.jpg：GCM-420302M底面接光学面包板，上面直接是T25M；不是中部支架'};

export const OEM_DRAWING_CONSTRAINTS={
  twoAxisT25M:{manufacturer:'Daheng',models:['GCM-T25M2L','GCM-T25M2C'],stageSizeMm:[65,65],heightMm:33,
    axisTravelMm:12.5,micrometerCount:2,axes:'X/Y perpendicular',
    officialAssembly:'GCM-901604M',drawingUrl:'https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323095702eFQBtxcrQgq7RZ9rgWIqSw.pdf',
    specifications:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/',
    note:'Manufacturer source only constrains nominal envelope and axis count; current web CAD remains an approximation, NOT the original STEP.'},
  verticalV25M:{manufacturer:'Daheng',model:'GCM-V25M',travelMm:25,
    officialAssembly:'GCM-901604M',micrometerCount:1,
    drawingUrl:'https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323095702eFQBtxcrQgq7RZ9rgWIqSw.pdf'}
};
