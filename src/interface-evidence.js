// Physical-interface acceptance ledger. Photo geometry and maker envelope do not
// certify fastener compatibility, thread engagement, thermal safety or machining.
// 'pending' is deliberate: none of these joins has been physically accepted.
export const INTERFACES=[
  {
    id:'B-FILM',platform:'B',parts:['B02','B03','B04'],status:'pending',
    known:'照片108/109确定磁座在下、33 mm双轴平移台居中、V25M在上。',
    missing:['B03实际2L/2C后缀','磁座与双轴台的真实孔位/安装面','B03与V25M的连接螺钉规格及有效啮合深度'],
    evidence:'P:108/109；D:GCM-901604M组合图'
  },
  {
    id:'B-ROTARY-CROSSED-XY',platform:'B',parts:['B08','B41','B09'],status:'pending',
    known:'照片147带尺可见B08无外伸手柄旋转台上依次安装B41前向单轴台、B09右向NFP-1462C。两台平移台分别有独立测微头，不得将B09直接接在B08上。',
    missing:['B08顶面与B41固定面的实际孔心配准','B41确切SKU、固定面孔系、23mm场景候选高度和行程','B41移动面与B09固定面4×Ø6.5/Ø11沉孔的螺钉可达性','两组紧固件规格、沉孔和螺纹有效啮合深度','双轴同时运动及旋转时的实际干涉'],
    evidence:'P:147；U:B08无手柄；D:NFP-1462C外形与单轴机构；C:B41候选几何'
  },
  {
    id:'B-CHUCK-FASTENERS',platform:'B',parts:['B09','B10','B11','B14'],status:'pending',
    known:'用户确认金属吸附块四枚顶部齐平螺钉、约四角位置、无金属过渡板；NFP厂家图另列9-M6与4-M3孔系。',
    missing:['四枚螺钉的实测孔中心距及相对中心孔坐标','NFP移动面实际选用的攻丝孔组与安装面法向','孔有效螺纹深度与螺钉有效啮合长度','螺钉头型、沉孔直径、热膨胀与夹紧材料','隔热层实际厚度及螺钉穿孔直径'],
    evidence:'U:四枚齐平/无过渡板；D:NFP孔系；I:M6×25和50mm仅旧候选'
  },
  {
    id:'B-THERMAL-VACUUM',platform:'B',parts:['B11','B12','B13','B15'],status:'pending',
    known:'用户确认底面嵌入陶瓷加热片、单中心吸附孔，软管/两根加热线由后侧引出。',
    missing:['陶瓷加热片实测长宽厚及电压功率','热电偶实际类型和安装槽尺寸','真空接头规格与密封方法','200°C条件下绝缘、热应力与线束固定'],
    evidence:'U:加热与走线关系；C:38×38×5mm腔体方案'
  },
  {
    id:'A-MAGNET-T25M',platform:'A',parts:['A17','A15'],status:'pending',
    known:'V97综合照片194/195与厂家资料：银色长槽和前侧两枚紧固件属于上方A15双轴T25M；A17是最下层独立薄型磁座，照片可见正面浅色长方形铭牌和左侧银色ON/OFF开关。Oeabt MBS-65B/C以65.2×65.2×20mm、正面OFF…ON铭牌和左侧开关成为主候选族，但当前官方产品页保持力为132N，而2024/2025目录为158N，存在厂家版本差异。A17顶面被A15完全遮挡；大恒GCM-901604M组合图的4-M6等孔只能证明标准组合接口，不能证明实机A15底面或A17顶面。',
    missing:['A17正面铭牌可读品牌/完整SKU','A17顶面真实孔阵以区分MBS-65B与MBS-65C','A15底面真实安装孔型与孔距','A17顶面至A15底座的紧固件规格、可达性与有效啮合深度','A17底面磁吸工作面与面包板实际接触面积','保持力厂家版本对应的具体产品修订号/生产批次'],
    evidence:'P:194/195确认A15/A17层级、A17正面铭牌与左开关；D:Oeabt当前产品页132N；D:Oeabt 2024/2025目录158N；D:Daheng GCM-901604M仅作标准组合接口边界；C:PTDB65/MB65次候选；A17厂商与B/C后缀仍未确认'
  },
  {
    id:'A-FILM',platform:'A',parts:['A15','A03','A04L','A04','A05'],status:'pending',
    known:'照片95/97确认A15为33mm双轴平移台，A03为竖直VC13M，A04L和A04为两层独立摆角机构，上层G40M60L型号可读，最上方A05为薄L形连接片。',
    missing:['A15具体2L/2C后缀','A15/VC13M/双摆角机构接合孔系','下层A04L准确型号及上下接口','A05薄片与G40顶部两颗固定螺钉的实际孔距、尺寸及啮合','A03纵向移动全程的手柄与A04L干涉','A05下端玻片夹具的真实机械连接'],
    evidence:'P:94/95/97；D:GCM-VC13M/GCM-G40M60L外形；C:A05薄片比例估算'
  },
  {
    id:'A-GLASS-END',platform:'A',parts:['A05','A05C','A05G'],status:'pending',
    known:'V79后A05C已作为当前转移装配中的几何候选参与模型：玻片由支撑台承托，固定侧挡与活动压紧条约束26mm短边，两枚手拧螺杆的轴线平行玻片短边并从同侧推动压紧条；A05G玻片作为转移必需件保留。大恒GCM-13系列仅作功能机理对照，其“两枚手拧调节螺纹推动中间活动压板、夹持厚度≤5mm板件”与当前受力逻辑相近，但照片194/196尚不能证明A05C采用GCM-1302M/1311M。',
    missing:['A05折边下端至真实夹具的连接孔/连接面','A05C实物厂商与SKU','两枚手拧螺杆牙型、直径、间距和有效行程','活动压紧条真实形状与玻片实际夹持长度','实物载玻片长宽厚及PDMS位置','下降全程相对A07/显微镜的实物避让'],
    evidence:'P:194/196确认两枚手拧紧固件；U:螺杆轴线应平行26mm玻片短边；C:A05C为已安装几何候选而非已确认商品；D:GCM-13只作夹持机理对照'
  },
  {
    id:'A-SAMPLE',platform:'A',parts:['A01','A16','A06','A02','A07'],status:'pending',
    known:'照片17/20/100显示A16 GCM-5306M固定底座、A06刻度旋转台、A02独立T25M平移台、A07三层样品座自下而上组合。A16并非另一套公共底板，也不是旋转机构。V85将Daheng GCM-1102M提升为A06最高优先级候选：厂家Ø66与照片/尺图外径完全吻合；但其约21mm厂家高度若直接替换当前33.2mm堆栈贡献，会把样品顶面由尺照吻合的89.2mm降至77mm，因此厂家几何禁止直接应用。',
    missing:['A16原厂孔图到A01网格的真实螺栓定位','A16至A06底面真实孔系/是否存在额外转接层','A06侧面总高实测与铭牌','若A06为GCM-1102M，缺失约10–16mm接口层的真实位置','A02单/双轴具体型号和固定面朝向','A07中间棕色层材料/实际厚度及孔系','A05与A07真实装配的全局X/Y/Z位置'],
    evidence:'P:17–21/100/137/161；R:17/18样品顶面87–93mm；D:GCM-5306M；D:GCM-1102M Ø66×约21mm，仅作高优先级候选；C:当前A06 33.2mm高度保持至冲突闭合'
  }
];
export function interfaceEvidence(platform,partId){
  return INTERFACES.filter(item=>item.platform===platform&&item.parts.includes(partId));
}
export function procurementInterfaceFields(platform,partId){
  const items=interfaceEvidence(platform,partId);
  return {
    interfaceReview:items.length?'待核验（不可据此直接加工/采购）':'未建立独立接口验收记录',
    interfaceGaps:items.flatMap(item=>item.missing.map(gap=>item.id+': '+gap)).join(' | ')
  };
}
