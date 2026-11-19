// Each record identifies the mating interface and what still has to be
// measured. A matching catalog envelope alone never certifies interchange.
const connections={
  A01:'磁座需要钢制可吸附面。孔距模型为 25 mm；板厚、孔牙与有效深度需量。卓立 NTBK345-50 是吸磁替代候选，50 mm 总厚需复核架高和孔阵原点。',
  A02:'GCM-T25M2L/2C：65×65×33 mm，双轴 ±12.5 mm。A32 到滑台的四角孔距、丝牙、有效牙深待量。',
  A03:'GCM-VC13M：65×65 mm，13 mm 行程。上面板与 A04L 及底座对 A15 的孔位分开测量。',
  A04:'GCM-G40M60L：40×40×20 mm，R60、±5°。用 A05 实测孔位决定短螺钉；不得顶到活动滑轨。',
  A04L:'GCM-G40M40L：40×40×20 mm，R40、±7°。大恒组合图证实可配对；先确认实机下层铭牌及紧固方向。',
  A05:'按夹片、摆角台实测孔心定制折弯件；模型板厚 2.5 mm。保持玻片夹紧面平整，切边去毛刺。',
  A05C:'与 A05 夹板相同的 30×26 mm 外廓，模型厚 1.5 mm。双孔模型距 13 mm；实测孔距后配做。',
  A05CS:'两枚沿玻片短边并列；模型按 M3 级通孔。先核原螺纹和夹紧方式，替换仅用同牙距及有效长度的蝶形件。',
  A05G:'夹在两片金属之间；按 76×26×1 mm 候选询价。实测夹持端长度和厚度。',
  A06:'GCM-1102M 为低矮锁紧型参考；确认外形、A16 安装孔及 A02 台面中心，再决定是否需转接板。',
  A07:'与 A31/A32/A02 四孔同轴。模型建议 50×50 四孔、Ø6.5–6.6 通孔、Ø11×6 沉孔；实机顶面孔系及真空密封需验收。',
  A07W:'演示件，采购按实验样品定义。',
  A08:'TTL200-A 双端 SM2 外牙 2.035″-40，f=200 mm。选 SM2 内牙支承，另校到传感器的轴向距离。',
  A09:'先测摄像面外螺纹/内螺纹与法兰距。确认 C 接口后才可选 Daheng MERCURY2 C-mount 相机和相应转接。',
  A10:'柱径、固定脚孔型及光轴中心距待测。柱径 Ø25 可比 FR5025CF，Ø38.1 可比 MGZ30；两套孔径不能互换。',
  A11:'MWWHL4 Ø30.5×60.1 mm，端面 SM1 内牙为接合基准；核侧筒外牙、功率和驱动限流。',
  A12:'LEDD1B 单路 0–1.2 A，15 V 外部供电。M8 LED 插口和电源插头均须同版本匹配。',
  A13:'CDG1-1DD/25A 为直流控制直流。按负载类别、散热及底座孔位比对德力西同型号。',
  A14:'TTL200-A 与 SM2A55 均为 SM2 外牙，用同轴 SM2 内牙镜筒接合；相机端须是 1″-32 C 口母牙。按传感器像面选择镜筒有效长，复核焦距。',
  A15:'GCM-T25M 双轴系列；原厂 65×65×33 mm。底座按 50×50 候选孔组核对，与磁座实际顶牙相同才可安装。',
  A16:'GCM-5306M，112×70×8 mm；按板底实际孔组与 A01 配合，再测 A06 固定孔位。',
  A17:'MBS-65B/C 均 65.2×65.2×20。若 A15 确认为 4×M6@50，选有 25 mm M6 网格的 B 型；C 型只有一个 M6。',
  A18:'光轴中心距、后夹持壳体和一体式支撑边界待量。FR5025CF/FR8425 仅按柱径、镜环径及轴距比对。',
  A19:'MGZ30 五工位 M26×36 TPI 与 RMS 转接为比对件。现盘的孔数及螺纹待测；校物镜端工作距离。',
  A20:'确认相机端插头、电脑端接口、锁紧方式与带宽。仅确认 USB3 Vision 后再按原厂型号配线。',
  A21:'独立灯架属旧工程候选；照片装配按 A11 接入侧筒。',
  A22:'LEDD1B 端核对 M8 四针插头、性别和针位；优先用灯头配套原线。',
  A23:'与 A26 电压、电流、耐温及绝缘等级配套，端子和线长按实测选。',
  A24:'与 A27 属同一传感链。热电偶延长线须与型别、插头和极性匹配，避免重复采购。',
  A25:'端子位置占位记录；测开孔、端子节距及导线截面后选择实际端子。',
  A26:'模型 38×38×5 mm，按电压、功率、耐温、安装方式与凹槽尺寸向 Watlow ULTRAMIC 询定制。',
  A27:'确认热电偶/RTD 类型与控制器输入；K 型确认后可按探头尺寸用 OMEGA SA1-K 类贴片探头对照。',
  A28:'测后开口牙径、牙距及密封座；确认为 M5×0.8 母牙且管外径 Ø6 后可选 SMC KQ2H06-M5A1，另核近热源温度。',
  A29:'模型管 OD7/ID4.4 mm；按吸气接头的管接结构及实际管径配整条耐负压管，选温度与弯曲半径均合格的材料。',
  A30:'VN-50 同族候选；测供电、极限负压、流量、接孔牙型和底脚，确认后按型号询价。',
  A31:'模型 65×65×7 mm，四通孔与 A07/A32 共基准；木材等级、热暴露和蠕变待核。按热工实测选择隔热料。',
  A32:'模型 65×65×9 mm；与 A07/A31 共 50×50 孔系候选。按滑台接合面测绘定制。',
  A33:'面板开孔、供电、传感器类型、输出和箱体接地待核。可按端子与开孔匹配宇电 AI-518 相应版本。',

  B01:'确定台面材质、面包板螺纹与 25 mm 节距。卓立 NTBK345-50 有 SUS430 吸磁台面；复核 50 mm 厚度、M6@25 孔系与 B35 四角孔。',
  B02:'GCM-420302M 铭牌确认；50×50 四 M6 加中央 M6，另有 M3/M4 孔。只使用与 B03 实测底孔对得上的孔组。',
  B03:'GCM-T25M 两轴 65×65×33 mm。下部磁座孔、上部 V25M 孔和实际 2L/2C 后缀分别核对。',
  B04:'GCM-V25M；确认输出板孔心、薄底座厚和有效牙深后选 B05 安装件。',
  B05:'B04 输出面 → Ø12 支承；B34 与 B05 固定接口不可用杆架外形反推，孔位不合时定制底板。',
  B06:'大恒 GCM-1302M；L60 mm，M6 安装接口，厂商用于厚度不超过 5 mm 的片件。核 B28 杆端 M6 及插入长度。',
  B07:'玻片 76×26×1 mm 候选；PDMS 按夹持宽度和有效接触面积单独选。',
  B08:'GCM-1107M，机上外伸微分头按实物缺省；需核 B35 支撑孔、B41 底孔及定位偏差。',
  B09:'NFP-1462C，65×65×23 mm，25 mm 总行程。原厂下孔 Ø6.5/沉孔 Ø11，上孔组需与 B14 的四孔对证。',
  B10:'65×65×10 mm 候选，四通孔与 B11/NFP 共基准；材料等级、压缩和耐温需实测。',
  B11:'定制吸附块。四沉孔、凹槽、中心气孔和后口在同一套验收图中标注；须核孔表、密封和实际装配。',
  B12:'38×38×5 mm 为凹槽候选，电压、功率、绝缘和引线方向确认后用 Watlow ULTRAMIC 等定制。',
  B13:'接点进入后向槽并贴住热端；确认控制器输入、热电偶类型和槽深后选 OMEGA SA1-K 类。',
  B14:'4 枚齐平；模型候选 M6×1×25 内六角圆柱头，配 Ø11 沉孔；确认 NFP 牙深及热堆厚度后定长。',
  B15:'核实加热台后口牙型、密封及软管直径；M5 母牙＋Ø6 管时可选 SMC KQ2H06-M5A1，另核温度。',
  B16:'MXFMS 系列，原厂柱径 Ø32。当前模型已对齐候选 B35 网格，实物底脚孔距和板孔原点仍待量；实测不合时配双孔系转接板。',
  B17:'SDPTOP 相机型号未读清；确认镜筒实际接口、传感器规格和中继镜倍率后向汇光询价。',
  B18:'五工位内倾式；OptoSigma 标识与各物镜倍率需逐个抄铭牌；选替代时核对转盘螺纹、齐焦距、匹配管镜和工作距离。',
  B19:'宇电 AI 系列；按真实面板开孔、传感器输入、SSR 控制输出、电源后缀确认，AI-518 是选型起点。',
  B20:'VN-50 实物铭牌 220 V、230 W、53 L/min。厂家同族 G1/4 仅候选，螺纹型式与吸口性别需实测。',
  B21:'MEAN WELL SE-600-48，48 V/12.5 A、600 W；核官方底部孔图、散热净空和接线空间。',
  B22:'D1000 按物镜照明灯具原接口；先确认铭牌输出、插头和极性，向 SDPTOP 询同款。',
  B23:'型号未读清，先抄铭牌和端子；若为 SSR 再按负载及散热接口从 Omron 选型。',
  B24:'PHUC-1，两孔 Ø12、孔心距 33 mm。以旋转关节和杆的夹持长度确定实际锁紧位置。',
  B25:'确认 Ø12 后配 B33/PHUC。按有效插入与跨距选 PHSP12 系列；当前 70 mm 只能作为布局参考。',
  B26:'端部螺柱接口记录。若 B28 含端牙则与杆一起下单；另装时核 M6 牙距、杆端母牙和有效牙长。',
  B27:'确认 Ø12 后配 PHSH 套座；长度、伸出量和端牙核实后从 PHSP12-4/4C 附图选型。',
  B28:'Ø12 配 PHUC 的第二孔；末端应与 GCM-1302M M6 同轴且可靠锁紧，可据杆图选或定制。',
  B29:'旧照片分支平底安装块；核磁性和上下孔组后选低矮磁座或按实物定制，采购数量按装配方案择一。',
  B30:'GCM-VC13M。旧照片分支按 65 mm 台面与上/下孔组分别核；候选安装螺钉见紧固件行。',
  B31:'GCM-G40M60L。旧照片分支用原厂图对 B32 安装实际孔位及螺丝深度。',
  B32:'旧照片分支折弯板，实测后定制；按 B31 顶面和夹持端出孔表。',
  B33:'独立 Ø12×Ø12 正交夹块。PHUC-1 是可调关节类备选；要保持正交刚性时按两通孔与夹缝定制。',
  B34:'PHSH-2（Ø12，50 mm）候选。核套筒插深及底端接口与 B05。',
  B35:'MB2530/M 候选，250×300×12.7，M6@25，四角沉孔。分别核 B01 底板固定和 B08/B16 顶侧孔组。',
  B36:'箱体按前面板与底盘开孔定制；Hammond 1456 系列可按实测尺寸询价，核 PSU 散热与接地空间。',
  B37:'双芯高温导线；核 B12 电流、绝缘、截面、端子以及防拉脱。',
  B38:'核 B13 类型、B19 输入型别和端子；温度延长线与探头合并采购时避免重复。',
  B39:'端子区占位；按实际导线截面、安装轨与电气等级配置端子。',
  B40:'B15→泵吸口；OD7/ID4.4 是模型。实测接头的推入外径或倒钩内径后选耐负压管和端接。',
  B41:'测 B08/B09 两侧孔组和行程包络；65×65×23 mm 的 NFP-1462SR 为条件备选，需确认安装方向及前向测微头净空。'
};

const ref={
  stock:'https://www.thorlabs.com/images/Catalog/V19_09_Kits.pdf',
  cap:'https://www.thorlabs.com/catalogpages/obsolete/2018/EDU-MINT1.pdf',
  smc:'https://www.smcworld.com/webcatalog/s3s/ja-jp/detail/?partNumber=KQ2H06-M5A1',
  pump:'https://www.youchengzhixin.com/blog/yczx-oil-free-piston-vacuum-pumps-clean-quiet-compact-power-delivered-on-time',
  heat:'https://www.watlow.com/products/heaters/ceramic-heaters/ultramic-advanced-ceramic-heaters',
  controller:'https://yudian.com/en/down/10041.html?current=4',
  tube:'https://www.thorlabs.com/images/Catalog/V21/V21_1_Optomechanics.pdf',
  scope:'https://www.szhgo.cn/en/metallurgicalmicroscope/310.html',
  board:'https://www.zolix-group.com/index.php/product/detail/212.html',
  tubeVac:'https://www.smcworld.com/assets/pg/en-jp/files/sp013x-035e.pdf',
  sensor:'https://assets.omega.com/pdf/test-and-measurement-equipment/temperature/sensors/thermocouple-probes/SA1.pdf',
  slide:'https://www.marienfeld-superior.com/microscope-slides-thickness-approx-1-mm.html',
  gland:'https://www.phoenixcontact.com/en-us/products/full-screw-connection-g-ins-m16-m68l-pepds-lg-1424514',
  led:'https://www.thorlabs.com/catalogpages/Obsolete/2025/M700L4.pdf'
};
const quote=(value,currency,date,type,source)=>({value,currency,date,type,source});
const conditional=(maker,model,datasheet)=>({alternatives:[[maker,model,datasheet]],datasheet});
const surfaceProbeQuote={
  ...quote(150.96,'USD','2026-11-19','DigiKey 公开包装价 · OMEGA SA1-K 备选','https://www.digikey.com/en/products/detail/omega/SA1-K/25629276'),
  packSize:5,candidate:true
};
const glandQuote={
  ...quote(11.49,'USD','2026-11-19','DigiKey 公开单件价 · Phoenix Contact 1424514 备选','https://www.digikey.com/en/products/detail/phoenix-contact/1424514/17940996'),
  candidate:true
};

const additions={
  A01:conditional('Zolix','NTBK345-50，SUS430 台面，450×300×50 mm，M6@25；核孔原点与台高',ref.board),
  A05G:conditional('Marienfeld','1000412，磨边，约 76×26×1 mm（厚度 ±0.05）',ref.slide),
  A02:{drawing:'https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323095702eFQBtxcrQgq7RZ9rgWIqSw.pdf'},
  A05CS:{qty:2,unit:'枚',model:'蝶形螺栓 · M3×0.5×10 候选',datasheet:ref.stock},
  A06:{datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/',
    quote:{...quote(3105,'TWD','2026-11-18','经销商未税参考 · GCM-1102M 候选','https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/'),candidate:true}},
  A08:{quote:quote(572.99,'USD','2026-11-19','GSS 经销商公开单件价 · TTL200-A','https://www.govsci.com/product-detail/Thorlabs/TTL200-A/EA/')},
  A11:{datasheet:'https://www.thorlabs.com/catalogpages/Obsolete/2022/M810L4.pdf',
    quote:quote(214.81,'USD','2025-07-16','原厂历史目录 · MWWHL4',ref.led)},
  A19:{datasheet:'https://www.thorlabs.com/catalogpages/Obsolete/2015/MGZ30-MOT.pdf'},
  A13:{datasheet:'https://www.delixi-electric.com/u/cms/delixi/202204/21094042w6d8.pdf'},
  A14:{datasheet:'https://www.thorlabs.de/newgrouppage9.cfm?objectgroup_id=8210&pn=SM2A55',
    alternatives:[
      ['Thorlabs','SM2A55，SM2 外牙＋C-mount 外牙；相机须为 C 口母牙','https://www.thorlabs.de/newgrouppage9.cfm?objectgroup_id=8210&pn=SM2A55'],
      ['Thorlabs','SM2M20 / SM2M30：两端可接 SM2 外牙，50.8 / 76.2 mm；依据实测光程选',ref.tube]
    ]},
  A17:{quote:{...quote(288,'CNY','2026-11-19','厂家网页标价 · MBS-65B/C 候选','https://www.oeabt.com/show.php?id=89'),candidate:true}},
  A24:{qty:0,unit:'接口'},
  A25:{qty:0,unit:'接口'},
  A22:{datasheet:ref.led},
  'A-H11':{quote:{...quote(37.66,'USD','2022','原厂历史目录 · KPS101 备件','https://www.thorlabs.com/catalogpages/Obsolete/2022/KPS101.pdf'),candidate:true}},
  'A-H13':{quote:glandQuote},
  A26:conditional('Watlow','ULTRAMIC 陶瓷加热器，按凹槽、电压及功率定制',ref.heat),
  A27:{...conditional('OMEGA','SA1-K，13×19 mm 感温贴、长期 175°C；只在型别、贴装空间和温度都匹配时采用',ref.sensor),quote:surfaceProbeQuote},
  A29:conditional('SMC','TU0604，Ø6×Ø4；需把两个管端一并选成 Ø6，并核热端温度',ref.tubeVac),
  A28:conditional('SMC','KQ2H06-M5A1，M5×0.8 → Ø6，接口吻合后采用',ref.smc),
  A30:conditional('YCZX','VN-50，仅在 A 泵铭牌及工作点核实后采用',ref.pump),
  A33:conditional('Yudian','AI-518 相应 I/O 与开孔后缀，箱体另定制',ref.controller),
  B01:conditional('Zolix','NTBK345-50，SUS430 台面，450×300×50 mm，M6@25；核 B35 四角锚固',ref.board),
  B07:conditional('Marienfeld','1000412 只作玻片备选；转移膜按所用工艺另配',ref.slide),
  B13:{...conditional('OMEGA','SA1-K 贴片候选；13×19 mm、长期 175°C，核实际接点形式后决定',ref.sensor),quote:surfaceProbeQuote},
  B14:{qty:4,unit:'枚',datasheet:ref.stock},
  B40:conditional('SMC','TU0604，Ø6×Ø4；只有同时更换两端为 Ø6 时采用',ref.tubeVac),
  'B-H11':{quote:glandQuote},
  B35:{quote:{...quote(165,'USD','目录日期未标注','Thorlabs 历史目录 · MB2530/M 候选','https://www.thorlabs.com/catalogPages/1101.pdf'),candidate:true}},
  B09:{datasheet:'https://www.zolix-group.com/product/specification/179.html',
    quote:quote(325,'USD','2026-11-19','原厂旧站历史参考 · NFP-1462 系列标价，核单型号','https://www.zolix.com.cn/en/prodcon_371_385_457_517.html')},
  B26:{qty:0,unit:'接口'},
  B12:conditional('Watlow','ULTRAMIC，按凹槽、热负载和电气参数定制',ref.heat),
  B15:conditional('SMC','KQ2H06-M5A1，M5 母牙与 Ø6 管确认后使用',ref.smc),
  B16:{datasheet:ref.scope},
  B17:{datasheet:ref.scope},
  B18:{datasheet:ref.scope},
  B19:conditional('Yudian','AI-518 系列按开孔、供电和 I/O 复核',ref.controller),
  B20:{datasheet:ref.pump},
  B22:{datasheet:ref.scope},
  B36:conditional('Hammond','1456 系列斜面机箱；按实际开孔、净深及散热尺寸选', 'https://www.hammfg.com/es/electronics/small-case/general-purpose/1456.pdf'),
  B39:{qty:0,unit:'接口'},
  B41:conditional('Zolix','NFP-1462SR，右驱动，65×65×23 mm；与 B09 垂直安装后核孔位和两轴净空','https://www.zolix-group.com/product/specification/181.html')
};

const nameplate=new Set(['A03','A04','A08','A11','A12','A13','A16','B02','B06','B08','B09','B16','B20','B21','B22','B24','B30','B31']);
const custom=new Set(['A05','A05C','A07','A31','A32','B05','B10','B11','B32','B33','B36']);

export function auditPurchase(part){
  const x={...part,...additions[part.id]};
  x.alternatives=x.alternatives.filter(([,model,url])=>model&&/^https:\/\/[^/]+\/.+/.test(url));

  const isHardware=Boolean(part.hardware);
  const basis=x.qty===0?'接口记录':isHardware?'接合规格候选':nameplate.has(x.id)?'铭牌 / 原厂资料':custom.has(x.id)?'按实物测绘定制':'照片 / 型号候选';
  return {
    ...x,
    traceability:basis,
    connection:connections[x.id]||x.connection||'按相邻接合面核对',
    quoteStatus:x.quote?(x.quote.type||'公开价'):x.qty===0?'随所属件核对':'公开价待核 / 询价'
  };
}

function item(id,group,name,qty,model,dims,evidence,connection,datasheet=ref.cap,maker='标准件'){
  return {id,group,name,qty,model,dims,evidence,connection,datasheet,maker,unit:'件',hardware:true,category:'待核配件',alternatives:[]};
}
export const HARDWARE={
  A:[
    item('A-H01','film','磁座至 XY 底座螺钉',4,'ISO 4762 / M6×12 或 16','M6×1；长 12–16 mm 候选','A17/A15；大恒组合图 50×50','仅当 A17 为 MBS-65B 且底座 4 孔匹配时选，核实际牙深。',ref.stock),
    item('A-H02','film','XY 台至升降台底板螺钉',4,'ISO 4762 / M6×12 候选','M6×1；12 mm 候选','A15/A03；照片 194、195','模型 Ø6.6 通孔；以 A15 实际攻丝、底板和沉孔厚度定长。'),
    item('A-H03','film','升降输出端至下摆角台螺钉',2,'ISO 4762 / M3×6 或 8','M3×0.5；6–8 mm 候选','A03/A04L；大恒摆角组合图','请确认接合面孔距、M2/M3 牙型、头部及活动台净空。'),
    item('A-H04','film','两层摆角台间紧固件',2,'ISO 4762 / M3×6 候选','M3×0.5；6 mm 候选','A04L/A04；原厂组合图','按两台实测螺孔选；螺钉不得进入导轨运动范围。'),
    item('A-H05','film','折弯片顶部安装螺钉',2,'ISO 4762 / M3×6 或 8','M3×0.5；6–8 mm 候选','A04/A05；照片 94','实际螺纹类型、折弯片厚度、可用牙深确认后定长。'),
    item('A-H06','sample','吸附块沉孔内六角螺钉',4,'ISO 4762 / M6×30','M6×1；30 mm；头径 Ø10，高 6 mm','A07→A31→A32→A02；V209 孔轴','通孔最小 Ø6.5，沉孔 Ø11×6 mm。头下堆厚约 22 mm，名义入台约 8 mm；实测牙深再定长。','https://eshop.wuerth.com.mt/hexagon-socket-head-cap-screw-253'),
    item('A-H07','sample','样品底座固定螺钉',4,'ISO 4762 / M5×16 候选','M5×0.8；16 mm 候选','A16/A01；四角模型','核对面包板螺孔实际 M5 或 M6，按头部座面和有效牙深选，必要时改底座孔。'),
    item('A-H08','microscope','显微镜脚座固定螺钉',4,'ISO 4762 / M5×16 或 18','M5×0.8；16–18 mm 候选','A10/A01；模型 Ø5.5','模型 Ø5.5 通孔及四角图示；面包板牙型待测。'),
    item('A-H09','sample','旋转台与适配底板紧固件',4,'ISO 4762 / M5×10 候选','M5×0.8；10 mm 候选','A06/A16','须确认 A06 的锁角和孔位；若孔组不合需转接板。'),
    item('A-H10','sample','旋转台至双轴台紧固件',4,'ISO 4762 / M6×10 候选','M6×1；10 mm 候选','A06/A02','先测旋转台顶面攻丝与 XY 底面孔心；有效牙长不足时重选。'),
    item('A-H11','illumination','LED 驱动器外置电源',1,'KPS101 / 同接口替代','15 VDC，2.4 A，3.5 mm 插头','A12；Thorlabs K/T-Cube 电源资料','确认 LEDD1B 具体版本的 DC 接口，已有电源时采购量归零。','https://www.thorlabs.com/catalogpages/Obsolete/2022/KPS101.pdf','Thorlabs'),
    item('A-H12','vacuum','吸气口接头及密封件',1,'按泵端实测接口','G1/4 候选；另一端按软管径','A30/A29；VN-50 同族目录','区分平行 G、锥牙及密封面；核实实际入口再选接头与垫。',ref.pump),
    item('A-H13','external','箱体进线固定件',2,'Phoenix Contact 1424514 压盖候选','M16×1.5；适用电缆外径 4.5–10 mm','A23/A24/A33 后出线','按实际每路线径和箱体开孔选，保持测温线与动力线分开。',ref.gland,'Phoenix Contact')
  ],
  B:[
    item('B-H01','base','局部孔板至台板螺钉',4,'ISO 7380-1 / M6×16 或 20','M6×1；16–20 mm；头高约 3.3 mm','B35/B01；MB2530/M 候选','用低圆头配模型 Ø11×3.5 沉孔；核实物座面、板厚、网格原点、牙深及承载。',ref.stock),
    item('B-H02','film','磁座至 XY 台底座螺钉',4,'ISO 4762 / M6×12 或 16','M6×1；12–16 mm 候选','B02/B03；Daheng 50×50 孔组','测量两部件共同孔组及实际牙深。'),
    item('B-H03','film','XY 台至竖直台螺钉',4,'ISO 4762 / M6×12 候选','M6×1；12 mm 候选','B03/B04；原厂组合图','根据上下孔配准、沉孔与有效牙深定长。'),
    item('B-H04','film','竖直台至杆架支承底板螺钉',4,'ISO 4762 / M4×10 候选','M4×0.7；10 mm 候选','B04/B05；支承底板','型号及孔位置未验收；按实测牙型取 M4 或其它长度。'),
    item('B-H05','film','下杆至玻片夹端部螺柱',1,'M6×1 螺柱或原厂带牙杆','M6×1；有效长度待实测','B26/B28/B06；GCM-1302M 本体','确认两侧牙型和啮合量；杆端已含螺柱时采购量归零。',ref.stock),
    item('B-H06','sample','旋转台至黑色孔板紧固件',4,'ISO 4762 / M6×16 候选','M6×1；16 mm 候选','B08/B35','确定固定脚的过孔与孔板实测网格；偏位使用转接板。'),
    item('B-H07','sample','旋转台至下层滑台紧固件',4,'ISO 4762 / M6×12 候选','M6×1；12 mm 候选','B08/B41；B41 型号待核','明确实际孔组和运动轴；需保留工具及行程净空。'),
    item('B-H08','sample','下层滑台至 NFP 底座紧固件',4,'ISO 4762 / M6×16 候选','M6×1；16 mm 候选','B41/B09；NFP 底孔图','确认 Ø6.5/Ø11 沉孔、下台顶牙、轴向插入余量。'),
    item('B-H09','microscope','显微镜底脚转接板及固定件',1,'双孔系定制板；M4/M6 各 4 枚候选','上组按实际底脚，下组按 B35 网格','B16/B35；模型按 M6 网格对齐','先测绘两组孔及光轴位置。实物对齐可直接评估 M6×20，偏位才定制双孔系转接板，分别按两侧牙型定长。'),
    item('B-H10','vacuum','泵端转接及密封件',1,'按实测吸口匹配','G1/4 候选；与实测软管相配','B20/B40；厂商 VN-50 族','核并行/锥牙、径向密封与负压等级，按入口性别选接头。',ref.pump),
    item('B-H11','external','箱体进线固定件',2,'Phoenix Contact 1424514 压盖候选','M16×1.5；适用电缆外径 4.5–10 mm','B36/B37/B38','按实物后侧进线孔、线径与耐热等级选；已有配件时减量。',ref.gland,'Phoenix Contact'),
    item('B-H12','film','旧折弯片顶部螺钉',2,'ISO 4762 / M3×6 候选','M3×0.5；6 mm 候选','B31/B32；照片 94','仅旧照片方案使用；核摆角台顶孔牙及板厚。')
  ]
};
