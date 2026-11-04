// Structural evidence ledger. ONLY photo-visible direction and vertical order
// are treated as confirmed. Web X is left/right, Y vertical, Z back/front.
// Side-facing positive X means "right" in the consistent local front view.
// For uncertain mounting sides, dimensions are still proxies.
export const STACKS={
  B:{
    film:['B02','B03','B04','B05','B34','B27','B33','B25','B24','B28','B26','B06','B07'],
    sample:['B01','B35','B08','B09','B10','B11'],
    external:['B36','B19','B21','B23','B22','B37','B38','B39','B15','B40','B20'],
    photo:['108.jpg','109.jpg','110.jpg','111.jpg','112.jpg','145.jpg','146.jpg','147.jpg','148.jpg','149.jpg','150.jpg','151.jpg'],
    confidence:'B02磁座→B03双轴T25M→B04升降台→B33方夹与杆→B24 PHUC-1万向杆夹（照片149可见铭牌）→B06 GCM-1302M夹板（照片150可见型号）；照片145/150显示一个银色公共面包板 B01；其上螺栓安装局部黑色Thorlabs板 B35，承载B08与B16，B35不是第二个公共底座；B08/NFP样品台由145–148支持。B35板厚和孔距、杆长度与实际装配角度未验收。照片114/117/119另显示B19面板、B21电源和B23黑色模块同属一个金属控制箱B36，实拍120确认独立真空泵 B20 型号为 VN-50（旧版W-50识别错误）；B15/B40物理负压管线从样品气孔通往泵吸入口，LED驱动B22为另一独立外设；B36机壳外形和内部孔位均未量取。'
  },
  A:{
    film:['A17','A15','A03','A04L','A04','A05'],
    sample:['A01','A16','A06','A02','A07'],
    photo:['94.jpg','95.jpg','97.jpg','100.jpg','137.jpg','138.jpg','139.jpg','140.jpg','141.jpg','142.jpg','143.jpg','144.jpg','152.jpg','155.jpg','161.jpg'],
    confidence:'用户确认A15玻片双轴T25M经A17磁座吸附在唯一A01面包板，照片未确认磁座型号/尺寸。A15在A03 VC13M下；照片94高度比例强烈指向另有一层A04L约20mm摆角台（型号仍待核），上层铭牌确认A04 G40M60L，上接L薄片，照片94/95/97、137–144；A16底部GCM-5306M是112×70×8mm底座，不是旋转台，见137/161。'
  }
};
export const HANDLES={
  B03:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'-X',secondaryDirection:'+Z',localDirection:'+X',installationYawDeg:180,brandedFace:'-Z',evidence:'108.jpg磁座铭牌面见手柄在左；109.jpg从相反的T25M铭牌面看手柄在右，是同一根手柄',confidence:'photo'},
  B04:{kind:'vertical',direction:'+Y',evidence:'108.jpg：移动臂侧面竖直银色测微头',confidence:'photo'},
  B08:{kind:'rotation-lock',direction:'+Z',evidence:'111.jpg：刻度旋转台朝向观察者的银色调节杆',confidence:'photo'},
  B09:{kind:'horizontal',direction:'+X',evidence:'110.jpg：NFP-1462C右侧的银色微分头',confidence:'photo'},
  A15:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'+X',secondaryDirection:'+Z',evidence:'95.jpg、97.jpg：VC13M下方T25M右伸微分头',confidence:'photo'},
  A03:{kind:'vertical',direction:'+Y',evidence:'97.jpg：VC13M竖直导轨正面银色测微装置',confidence:'photo'},
  A04L:{kind:'tilt',direction:'+X',evidence:'94.jpg下层独立微分头向右；具体G40型号无法读出',confidence:'photo-proxy'},
  A04:{kind:'tilt',direction:'-X',evidence:'94.jpg上层标G40M60L，另一侧向左微分头/螺纹机构方向待照片校正',confidence:'photo-candidate'},
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
