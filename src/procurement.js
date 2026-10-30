// Sourced BOM enrichments, 2026-10-30. A price record is a published listing,
// not a purchase commitment or a quote. Cross-currency totals are NEVER added.
export const REFERENCE_DATE='2026-10-30';
const base={
  B01:{qty:1,category:'机加工/标准光学基座',material:'铝合金黑色阳极氧化（待确定）',alternatives:[['Thorlabs','光学面包板系列（需同孔距）','https://www.thorlabs.com/'],['Newport','光学面包板系列（需同孔距）','https://www.newport.com/']],unit:'套',drawing:'',note:'430×300×20 目前为布局代理，25 mm 间距已用照片推断，真实板外形和螺纹标准待核实'},
  B02:{qty:1,category:'磁力固定件',material:'钢底座/铝合金台面（材料需厂商确认）',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學支撐件系列/底座/磁性表座/gcm-42系列-磁性表座/',quote:{value:1783,currency:'TWD',date:'2026-10-30',type:'经销商未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學支撐件系列/底座/磁性表座/gcm-42系列-磁性表座/'},alternatives:[['Thorlabs','磁力底座系列（孔位需对接）','https://www.thorlabs.com/'],['OptoSigma','磁性底座（仅功能替代）','https://www.optosigma.com/']],materialNote:'厂家给出 30kg 吸力，不能由吸力推导可靠安装承载力'},
  B03:{qty:1,category:'手动平移台',material:'黑色阳极氧化铝合金',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/',quote:{value:4485,currency:'TWD',date:'2026-10-30',type:'GCM-T25MC 版本的未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/'},alternatives:[['Zolix','交叉滚柱 25 mm 手动平移台','https://www.zolix-group.com/'],['OptoSigma','XY / 线性位移台，同等级替代','https://www.optosigma.com/']],note:'照片仅显示 GCM-T25M，未确认 MC 还是 ML；参考单价不等同精确 SKU 报价'},
  B04:{qty:1,category:'手动升降台',material:'铝合金与钢导轨',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',alternatives:[['Zolix','垂直位移台同负载系列','https://www.zolix-group.com/'],['Newport','手动垂直台，同负载系列','https://www.newport.com/']],note:'GCM-V25M 25mm 行程确认；完整外形高度与螺钉长度未确认'},
  B05:{qty:1,category:'光机连接/支撑',material:'不锈钢杆+黑色铝夹',alternatives:[['Thorlabs','Ø12.7mm posts / post holders','https://www.thorlabs.com/'],['OptoSigma','光学立柱与夹持件','https://www.optosigma.com/']],note:'108.jpg 可见多段横杆、Zolix 夹具和调节旋钮。V18将杆后偏40mm作为避开显微镜的候选，需测绘后定版'},
  B06:{qty:1,category:'载玻片夹具',material:'铝合金/不锈钢',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/',quote:{value:1150,currency:'TWD',date:'2026-10-30',type:'经销商未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/'},alternatives:[['Thorlabs','玻片/平板夹具（按厚度选型）','https://www.thorlabs.com/']],note:'GCM-1302M仍为辨识候选；V18以1mm玻片置入1.5mm夹口并消除默认位置穿模；实物高度待核实'},
  B07:{qty:1,category:'耗材/自制件',material:'玻璃载玻片/聚合物转移膜',alternatives:[['Fisher Scientific','实验室玻片','https://www.fishersci.com/'],['VWR','玻片/PDMS 类耗材','https://www.vwr.com/']],note:'76×26×1玻片标准候选；玻片底104.5mm、PDMS距热台4.5mm均为无穿模候选，不代表原设备实测'},
  B08:{qty:1,category:'手动旋转台',material:'黑色阳极氧化铝合金',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/',quote:{value:4600,currency:'TWD',date:'2026-10-30',type:'经销商未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/'},alternatives:[['Newport','精密手动旋转台 90mm 级（需查负载）','https://www.newport.com/'],['OptoSigma','手动旋转台 90mm 级','https://www.optosigma.com/']],note:'厂家标称中心载荷 4kg；固定用 4×Ø6.8 与 M6 顶孔方向要分开核对'},
  B09:{qty:1,category:'交叉滚柱平移台',material:'304 不锈钢喷砂',drawing:'https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.pdf',cad:'https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.rar',datasheet:'https://www.zolix-group.com/product/specification/179.html',quote:{value:325,currency:'USD',date:'2026-10-30',type:'厂家公开型号标价（美元）',source:'https://www.zolix.com.cn/en/prodcon_371_385_457_517.html'},alternatives:[['Newport','交叉滚柱 25mm 行程手动平移台','https://www.newport.com/'],['OptoSigma','交叉滚柱 25mm 行程平移台','https://www.optosigma.com/']],note:'原厂有独立 2D/3D CAD 下载；网页登录/许可条件请自行核实，不复制进公开仓库'},
  B10:{qty:1,category:'隔热材料/自制',material:'钙硅酸盐板 / 微孔无机板（未经鉴定）',alternatives:[['MICROSIL','微孔保温板（需要等级/压缩强度）','https://www.promat.com/'],['RS PRO','高温隔热板材料（待比对）','https://sg.rs-online.com/']],note:'约 10 mm 来自用户目测；照片显示白色、易开裂材料，需优先评估热压缩强度及粉尘安全'},
  B11:{qty:1,category:'CNC 定制',material:'铝合金优先候选，待确认牌号',alternatives:[['本地 CNC 加工商','按验证后的 STEP/DXF 询价',''],['国内光学机械加工商','真空腔/气道/端口定制','']],note:'用户确认后侧真空管与陶瓷加热片双引线。孔径、后侧通道、38.6mm凹腔均为工程候选；需核对密封和热应力'},
  B12:{qty:1,category:'电阻加热器',material:'氧化铝或氮化铝陶瓷（未经确认）',alternatives:[['Watlow','ULTRAMIC 陶瓷加热器，按面积/电压定制','https://www.watlow.com/'],['Backer','工业陶瓷加热模块','https://www.backergroup.com/']],note:'约200°C工况；陶瓷加热块从后侧出线已由用户确认。38×38×5和双线引出孔位仍是候选；需按铭牌选功率'},
  B13:{qty:1,category:'测温探头',material:'K型热电偶（候选）',alternatives:[['OMEGA','K型微型探头/热电偶','https://www.omega.com/'],['RS PRO','工业热电偶微型接点','https://sg.rs-online.com/']],note:'探头位于加热器上表面夹持，接触位置由用户确认；温控器输入模式待查'},
  B14:{qty:4,category:'紧固件',material:'不锈钢/合金钢（按热环境）',alternatives:[['MISUMI','ISO 4762 低头/圆柱头内六角','https://sg.misumi-ec.com/'],['RS PRO','M6 机械紧固件','https://sg.rs-online.com/']],note:'只有一组4枚靠四角顶部齐平螺钉；M6×25 只是假设，必须检查有效螺纹和沉孔方向'},
  B15:{qty:1,category:'真空气路',material:'耐温软管/金属快插接头',alternatives:[['SMC','真空接头和气管','https://www.smcworld.com/'],['Parker','真空管接头','https://www.parker.com/']],note:'用户明确后侧（−Z）真空管/加热片双引线，V17的左侧出口错误。接头直径、螺纹、软管材料和密封仍未知'},
  B16:{qty:1,category:'显微镜',material:'金属喷涂机身 / 光学玻璃',alternatives:[['Olympus Evident','金相显微镜（仅功能参考）','https://www.olympus-ims.com/'],['Nikon','金相显微镜（仅功能参考）','https://www.microscope.healthcare.nikon.com/']],note:'照片116表面可读 SDPTOP、MXFMS；调焦机构和物镜转盘在108与视频中可见，实际机身外廓仍欠原厂CAD'},
  B17:{qty:1,category:'数字相机',material:'金属相机壳',alternatives:[['Daheng Imaging','USB3 工业相机','https://en.daheng-imaging.com/'],['FLIR/Teledyne','工业显微相机','https://www.teledynevisionsolutions.com/']],note:'照片113显示 SDPTOP Digital Microscope Camera，型号细节不能完整读取'},
  B18:{qty:1,category:'显微物镜',material:'光学玻璃/金属',alternatives:[['Olympus Evident','对应倍率和工作距离的物镜（需机械适配）','https://www.olympus-lifescience.com/'],['OptoSigma','物镜及物镜转接件','https://www.optosigma.com/']],note:'照片110可见 10× / 0.15 / DIC / WD10.8 标注，同时另一支有 OptoSigma 品牌；不能将两支混成一个型号'},
  B19:{qty:1,category:'温控系统',material:'面板控制器/金属箱体',alternatives:[['Autonics','PID 控温器（需输入输出适配）','https://www.autonics.com/'],['Omron','温控器 E5 系列（电压/SSR 类型校核）','https://www.ia.omron.com/']],note:'照片114显示宇电 AI 系列面板；完整型号、SSR/热电偶接线未知'},
  B20:{qty:1,category:'真空泵',material:'电机/泵头',alternatives:[['KNF','实验室隔膜真空泵（负压/流量比对）','https://knf.com/'],['Pfeiffer Vacuum','桌面真空泵系列（仅功能替代）','https://www.pfeiffer-vacuum.com/']],note:'铭牌疑似 W-50，约680mmHg 53L/min 220V，不能凭模糊铭牌唯一确认品牌'},
  B21:{qty:1,category:'工业电源',material:'铝外壳，强制通风',drawing:'https://www.meanwell.com/Upload/PDF/SE-600/SE-600-SPEC.PDF',datasheet:'https://www.digikey.sg/zh/products/detail/mean-well-usa-inc/SE-600-48/7706618',quote:{value:150.19,currency:'SGD',date:'2026-10-30',type:'DigiKey Singapore 公开单件含税前标价',source:'https://www.digikey.sg/zh/products/detail/mean-well-usa-inc/SE-600-48/7706618'},alternatives:[['MEAN WELL','LRS-600-48（厂家推荐替代；安装尺寸不同）','https://www.digikey.sg/en/products/detail/mean-well-usa-inc/LRS-600-48/']],note:'SE-600-48 已标记 Not For New Designs；不代表其就是加热块电源'},
  B22:{qty:1,category:'显微镜照明供电',alternatives:[['Thorlabs','可调 LED 驱动器（需确认 LED 额定电流）','https://www.thorlabs.com/'],['Mightex','实验室 LED 电源','https://www.mightexsystems.com/']],note:'115.jpg 直接显示 ADAPTOR FOR LED LAMP，电气参数需解读铭牌；不可假定与 LEDD1B 相同'},
  B23:{qty:1,category:'控制箱内模块',alternatives:[['Omron','SSR/控制继电器相关型号，仅类别参考','https://www.ia.omron.com/']],note:'119/121/122 的黑色端子/散热孔模块未知，不能随意认定是电源或 SSR'}
};
const A={
 A01:base.B01,
 A02:{...base.B03,qty:1,note:'照片100：安装于样品旋转台上方的独立GCM-T25M，右侧测微头。不能与照片97所示载玻片侧A15合并'},
 A15:{...base.B03,qty:1,note:'照片95、97：载玻片支架最底层，VC13M正下方的第二台独立GCM-T25M，右侧测微头。应单独采购/计费'},
 A03:{qty:1,category:'精密垂直台',alternatives:[['Zolix','高精度垂直微调台','https://www.zolix-group.com/']],note:'A 组 95/97 可见 GCM-VC13M；外壳尺寸尚未由厂家图纸确认'},
 A04:{qty:1,category:'倾角平台',alternatives:[['Newport','双轴倾角平台','https://www.newport.com/'],['Thorlabs','Goniometer/tilt platform','https://www.thorlabs.com/']],note:'照片94 GCM-G40M60L 型号清晰，但完整机械孔位尚待厂家图确认'},
 A05:base.B07,
 A06:{qty:1,category:'手动旋转台',material:'黑色阳极氧化铝',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',alternatives:[['Daheng','GCM-11同系列按接口选型','https://www.daheng-optics.com/']],note:'照片100 旋转刻度台与上部 GCM-T25M 直接叠放；不能确认旋转台型号'},
 A07:{qty:1,category:'自制样品座',alternatives:[['本地CNC厂','按现场尺寸报价','']],note:'与 B 加热台不能直接等同，须单独测绘'},
 A08:{qty:1,category:'管镜',material:'精密光学玻璃、黑色金属镜筒',datasheet:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf',drawing:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf',quote:{value:468.18,currency:'USD',date:'2018-01-01',type:'2018 目录历史标价，不是现价',source:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf'},alternatives:[['Thorlabs','TTL200（螺纹与镀膜差异）','https://www.thorlabs.com/'],['Edmund Optics','200mm 管镜（须核对螺纹）','https://www.edmundoptics.com/']],note:'TTL200-A 光学焦距 200mm，外部 SM2 2.035-40 双面螺纹；图中实际壳长为代理，镜头不能按焦距做成长 200mm'},
 A09:{qty:1,category:'工业相机',alternatives:[['Daheng Imaging','工业相机同接口系列','https://en.daheng-imaging.com/'],['FLIR/Teledyne','工业相机同接口系列','https://www.teledynevisionsolutions.com/']],note:'照片78与82可看到相机/成像筒，具体芯片与 C-mount 接口未完全确认'},
 A10:{qty:1,category:'成像支架',alternatives:[['Thorlabs','60mm cage / optical posts','https://www.thorlabs.com/']],note:'立柱、横杆、安装夹具以照片为依据复原，长度待测'},
 A11:{qty:1,category:'照明LED',material:'金属LED套筒',datasheet:'https://www.thorlabs.de/newgrouppage9.cfm?objectgroup_id=2692&pn=M530L4',quote:{value:214.81,currency:'USD',date:'2026-10-30',type:'Thorlabs 挂牌价格快照；实际采购价格以订单为准',source:'https://www.thorlabs.de/newgrouppage9.cfm?objectgroup_id=2692&pn=M530L4'},alternatives:[['Thorlabs','3000K 兼容LED型号按驱动电流选','https://www.thorlabs.com/'],['Mightex','可调白光光源','https://www.mightexsystems.com/']],note:'MWWHL4 历史目录：3000K 570mW (min) 1000mA；按实际 LEDD1B 电流能力校核'},
 A12:{qty:1,category:'LED驱动器',material:'铝合金驱动器外壳',datasheet:'https://www.thorlabs.com/images/Catalog/Imaging/06_Optogenetics.pdf',quote:{value:284,currency:'USD',date:'2014-01-01',type:'历史目录参考价，不是现价',source:'https://www.thorlabs.com/images/Catalog/Imaging/06_Optogenetics.pdf'},alternatives:[['Thorlabs','DC2200 LED 控制器（非直换）','https://www.thorlabs.com/'],['Mightex','可调LED驱动（电气比对）','https://www.mightexsystems.com/']],note:'LEDD1B 单通道、最大电流约1.2A；原配 PSU 另计'},
 A13:{qty:1,category:'电气开关/SSR',alternatives:[['Omron','SSR 同负载等级','https://www.ia.omron.com/'],['Crydom','SSR 同控制电压等级','https://www.sensata.com/']],note:'照片91 为 DELIXI CDG1-1DD/25A；负载电压及接线方式需按铭牌'},
 A14:{qty:1,category:'光学螺纹适配',alternatives:[['Thorlabs','SM1/SM2 原厂转接环按真实接口选型','https://www.thorlabs.com/'],['OptoSigma','光学镜筒接口件','https://www.optosigma.com/']],note:'SM1CP2 尚须核对；重要：TTL200-A 是 SM2（非 SM1）连接，不能直接以 SM1CP2 替代 SM2 转接件'}
};
export const PURCHASE={A,B:base};
export function enriched(platform,part){
 const x=PURCHASE[platform][part.id]||{};
 return {...part,qty:1,unit:'件',category:'其他',alternatives:[],...x};
}
export function pricedSummary(rows){
 const sums=new Map();
 let quoted=0,missing=0;
 for(const p of rows){
   if(!p.quote?.value){missing++;continue;}
   quoted++;
   let cur=p.quote.currency;
   const old=sums.get(cur)||{amount:0,rows:0};
   old.amount+=p.quote.value*(p.qty||1);old.rows++;
   sums.set(cur,old);
 }
 return {priced:quoted,unpriced:missing,currencies:[...sums].map(([currency,o])=>({currency,...o})),complete:missing===0};
}
export function csvExportRows(rows){
 const fields=['id','name','maker','model','qty','unit','category','dims','level','material','price','currency','priceDate','priceType','priceSource','drawing','cad','datasheet','alternatives','note','evidence'];
 return [fields, ...rows.map(p=>fields.map(f=>({
    price:p.quote?.value||'',currency:p.quote?.currency||'',priceDate:p.quote?.date||'',priceType:p.quote?.type||'',priceSource:p.quote?.source||'',alternatives:(p.alternatives||[]).map(v=>v[0]+' '+v[1]+' '+v[2]).join(' | ')
  }[f]??p[f]??'')))];
}
