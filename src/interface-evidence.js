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
    known:'照片22/24可见A17前侧狭槽、滚花控制件和两枚面板紧固件；A15为上方独立双轴T25M。A17顶面/底面均不可见，型号不能照搬B02。',
    missing:['A17铭牌与确切型号','A17顶面和底面孔系与螺纹','A17顶面至A15底座的螺钉数量和可达性','磁吸接触面积、额定负载及锁定方式'],
    evidence:'P:22/23/24；U:只有玻片侧磁吸固定；A17厂商型号未知'
  },
  {
    id:'A-FILM',platform:'A',parts:['A15','A03','A04L','A04','A05'],status:'pending',
    known:'照片95/97确认A15为33mm双轴平移台，A03为竖直VC13M，A04L和A04为两层独立摆角机构，上层G40M60L型号可读，最上方A05为薄L形连接片。',
    missing:['A15具体2L/2C后缀','A15/VC13M/双摆角机构接合孔系','下层A04L准确型号及上下接口','A05薄片与G40顶部两颗固定螺钉的实际孔距、尺寸及啮合','A03纵向移动全程的手柄与A04L干涉','A05下端玻片夹具的真实机械连接'],
    evidence:'P:94/95/97；D:GCM-VC13M/GCM-G40M60L外形；C:A05薄片比例估算'
  },
  {
    id:'A-GLASS-END',platform:'A',parts:['A05','A05C','A05G'],status:'pending',
    known:'A05薄L形片在照片94可见；独立玻片夹具型号没有证据，A05C只是采购比对候选，当前三维场景没有已确认夹具。',
    missing:['A05折边下端的连接孔与实体夹具','实际夹口宽度、夹持厚度和玻片边缘伸出量','载玻片/PDMS样品相对于加热台的垂直与水平对齐','夹具下降时在热台外缘的完整空间避让'],
    evidence:'P:94；C:A05C未安装，A05G为标准玻片尺寸候选'
  },
  {
    id:'A-SAMPLE',platform:'A',parts:['A01','A16','A06','A02','A07'],status:'pending',
    known:'照片17/20/100显示A16 GCM-5306M固定底座、A06刻度旋转台、A02独立T25M平移台、A07三层样品座自下而上组合。A16并非另一套公共底板，也不是旋转机构。',
    missing:['A16原厂孔图到A01网格的真实螺栓定位','A16至A06底面孔系','A02单轴或双轴具体型号、行程及固定面朝向','A06旋转台真实型号','A07上部金属块/中间棕色层的材料、孔系和加热接口','A05与A07真实装配的全局X/Y/Z位置'],
    evidence:'P:17–21/100/137/161；D:GCM-5306M名义外形；C:A07三层厚度候选'
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
