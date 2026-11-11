// Structural evidence ledger. ONLY photo-visible direction and vertical order
// are treated as confirmed. Web X is left/right, Y vertical, Z back/front.
// Side-facing positive X means "right" in the consistent local front view.
// For uncertain mounting sides, dimensions are still proxies.
export const STACKS={
  B:{
    film:['B02','B03','B04','B05','B34','B27','B33','B25','B24','B28','B26','B06','B07'],
    sample:['B01','B35','B08','B41','B09','B10','B11'],
    external:['B36','B19','B21','B23','B22','B37','B38','B39','B15','B40','B20'],
    photo:['25.jpg','26.jpg','27.jpg','28.jpg','29.jpg','30.jpg','31.jpg','108.jpg','109.jpg','110.jpg','111.jpg','112.jpg','145.jpg','146.jpg','147.jpg','148.jpg','149.jpg','150.jpg','151.jpg'],
    confidence:'B02磁座→B03双轴T25M→B04升降台→B33方夹与杆→B24 PHUC-1万向杆夹（照片149可见铭牌）→B06 GCM-1302M夹板（照片150可见型号）；样品侧从下至上为B08无外伸手柄旋转台、B41前向单轴平移台、B09右向单轴NFP-1462C、B10隔热层和B11真空加热台。用户2026-11-05带尺照片147直接证明B08与B09之间还有一整级平移台，两个线性轴相互正交；B41精确型号及孔系待核，不擅自沿用NFP-1462C型号。照片25–28确认上层B09 NFP-1462C尺寸与侧面固定下层4孔、活动上层3孔，孔径/螺纹仍未知；照片29–31确认B02铭牌GCM-420302M及PHUC-1双杆夹持。照片145/150显示一个银色公共面包板 B01；其上螺栓安装局部黑色Thorlabs板 B35，承载B08与B16，B35不是第二个公共底座。B35板厚和孔距、杆长度与实际装配角度未验收。照片114/117/119另显示B19面板、B21电源和B23黑色模块同属一个金属控制箱B36，实拍120确认独立真空泵 B20 型号为 VN-50（旧版W-50识别错误）；B15/B40物理负压管线从样品气孔通往泵吸入口，LED驱动B22为另一独立外设；B36机壳外形和内部孔位均未量取。'
  },
  A:{
    film:['A17','A15','A03','A04L','A04','A05','A05C','A05CS','A05G'],
    sample:['A01','A16','A06','A02','A07'],
    external:['A10','A18','A19','A08','A14','A09','A20','A11','A12','A13','A21','A22','A23','A24','A25'],
    photo:['94.jpg','95.jpg','97.jpg','100.jpg','137.jpg','138.jpg','139.jpg','140.jpg','141.jpg','142.jpg','143.jpg','144.jpg','152.jpg','155.jpg','161.jpg','191.jpg','192.jpg','193.jpg','194.jpg','195.jpg','196.jpg'],
    confidence:'用户确认A15玻片双轴T25M经A17磁性固定座吸附在唯一A01面包板。V86重新统一证据归属：照片194/195确认银色横向长槽、中央控制件及两颗紧固件属于A15前侧，不属于A17；A17只保留位于最下层磁座侧面的独立磁力开关。CORZC PTDB65的65×65×20mm外形和侧面ON/OFF开关与A17高度相似，因此仅列外形/侧开关候选；实物品牌、32kg磁力和被A15遮挡的1-M6/8-M4/4-M3顶面孔系均未确认，13孔只作元数据且禁止建模。A17也不得套用B02/GCM-420302M身份。照片23四角沉孔属于A15顶板、围绕VC13M立柱。A15在A03 VC13M下；照片94高度比例支持另有一层A04L约20mm摆角台，V82以GCM-G40M40L作高可信配对候选但铭牌仍待核；上层A04铭牌确认GCM-G40M60L。照片194–196补充A15→A03→A04叠装视角；照片191–193补充显微镜头部、双物镜、相机线缆及样品侧A16→A06→A02→A07。A16底部GCM-5306M是112×70×8mm安装底座，不是旋转台。'
  }
};
export const HANDLES={
  B03:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'-X',secondaryDirection:'+Z',localDirection:'+X',installationYawDeg:180,brandedFace:'-Z',evidence:'108.jpg磁座铭牌面见手柄在左；109.jpg从相反的T25M铭牌面看手柄在右，是同一根手柄',confidence:'photo'},
  B04:{kind:'vertical',direction:'+Y',evidence:'108.jpg：移动臂侧面竖直银色测微头',confidence:'photo'},
  B08:{kind:'rotation-only',handles:0,evidence:'用户2026-11-05根据实物照片明确纠正：GCM-1107M旋转台没有外伸操作手柄',confidence:'user-correction'},
  B41:{kind:'horizontal',axes:1,handles:1,direction:'+Z',physicalAxis:'Y',evidence:'用户照片147：旋转台上方、NFP-1462C下方存在独立的前向测微头；型号未确认',confidence:'photo'},
  B09:{kind:'horizontal',axes:1,handles:1,direction:'+X',evidence:'110.jpg及147号带尺照片：上层NFP-1462C右侧银色测微头',confidence:'photo'},
  A15:{kind:'orthogonal-XY',axes:2,handles:2,thicknessMm:33,direction:'+X',secondaryDirection:'+Z',evidence:'95.jpg、97.jpg及194–196.jpg：VC13M下方T25M两根正交微分头',confidence:'photo'},
  A03:{kind:'vertical',direction:'+Y',evidence:'97.jpg及195.jpg：VC13M竖直导轨与正面竖直测微装置',confidence:'photo'},
  A04L:{kind:'tilt',direction:'+Z',evidence:'2026-11-08 两个观察方向：下层测微头端面朝向VC13M铭牌侧，和上层+X杆轴正交。+Z为场景配准候选，不将单图左右误当世界-X。下层具体型号未知',confidence:'inference'},
  A04:{kind:'tilt',direction:'+X',evidence:'194–196.jpg可辨GCM-G40M60L铭牌及右侧微分头；按该组近正面视角统一为+X，94号图的投影左右不单独作为全局轴向依据',confidence:'photo'},
  A06:{kind:'rotation-lock+fine-adjust',direction:'+Z',micrometerDirection:'+X',micrometerCount:1,evidence:'新上传照片17/18/20/21：下层圆台右侧长银色角度微调头，与前侧小锁紧杆分别可见；具体GCM-11后缀未知',confidence:'photo'},
  A02:{kind:'horizontal',axes:1,handles:1,thicknessMm:20,subtypeUnverified:true,direction:'-X',evidence:'照片17/18/20：银色台左侧有水平方向测微头；下层旋转台右侧另有角度调节测微头',confidence:'photo'}
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
