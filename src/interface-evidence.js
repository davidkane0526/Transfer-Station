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
    id:'B-ROTARY-NFP',platform:'B',parts:['B08','B09'],status:'pending',
    known:'照片110/111显示NFP安装在旋转台上方；原厂图分别标注NFP固定面通孔和移动面螺纹孔。',
    missing:['GCM-1107M顶面与NFP固定面的孔心配准','NFP固定侧4×Ø6.5/Ø11沉孔的实际朝向及装配可达性','下层紧固件型号、头型与啮合深度','旋转台负载和全行程干涉'],
    evidence:'P:110/111；D:NFP-1462C/GCM-1107M机械图'
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
    id:'A-FILM',platform:'A',parts:['A15','A03','A04'],status:'pending',
    known:'照片95/97确认A15为双轴33 mm平移台，位于VC13M下方，摆角台更上层。',
    missing:['A15具体2L/2C后缀','A15/VC13M/G40M60L真实接合孔系','各层独立测微头空间包络与固定螺钉'],
    evidence:'P:94/95/97；D:大恒双轴组合机械图'
  },
  {
    id:'A-SAMPLE',platform:'A',parts:['A06','A02','A07'],status:'pending',
    known:'照片100确认样品侧另有一台与A15独立的T25M，位于旋转台与样品座之间。',
    missing:['A02单轴或双轴具体型号及行程','A06旋转台真实型号','样品座与A02的孔系、紧固和加热接口'],
    evidence:'P:100；C:现有样品加热座外形'
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
