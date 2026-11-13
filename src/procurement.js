import {procurementInterfaceFields} from './interface-evidence.js';
import {photoRefsForPart} from './photo-library.js';
// Sourced BOM enrichments, 2026-10-30. A price record is a published listing,
// not a purchase commitment or a quote. Cross-currency totals are NEVER added.
export const REFERENCE_DATE='2026-10-30';
const base={
  B01:{qty:1,category:'机加工/标准光学基座',material:'铝合金黑色阳极氧化（待确定）',alternatives:[['Thorlabs','光学面包板系列（需同孔距）','https://www.thorlabs.com/'],['Newport','光学面包板系列（需同孔距）','https://www.newport.com/']],unit:'套',drawing:'',note:'430×300×20 目前为布局代理，25 mm 间距已用照片推断，真实板外形和螺纹标准待核实'},
  B35:{qty:1,category:'样品旋转台下的独立黑色Thorlabs光学孔板',material:'黑色阳极氧化铝合金（实物材质待确认）',
    drawing:'https://www.thorlabs.com/solid-aluminum-optical-breadboards',
    alternatives:[['Thorlabs','MB2530/M 标准250×300×12.7mm对照候选；并非已识别实物型号','https://www.thorlabs.com/solid-aluminum-optical-breadboards']],
    note:'照片145/150显示THORLABS黑色局部板。MB2530/M仅作为高可信度孔系候选：250×300×12.7mm、M6贯通网格25mm、首孔距边12.5mm、四角M6沉孔共4个且无中央第五孔。模型按尺图保留12mm厚度，故SKU未确认。板中心X=75mm，四角孔世界坐标(-25/175, ±125)，与B01候选25mm网格对齐；B16脚座中心87.5/-112.5mm，四个Ø6.5mm孔与B35网格零误差配准。B01螺纹、沉孔方向和承载连接未验收。'},
  B02:{qty:1,category:'大恒GCM-420302M磁性底座',material:'钢底座/铝合金台面（具体材质待厂商确认）',
    drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',
    datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學支撐件系列/底座/磁性表座/gcm-42系列-磁性表座/',
    quote:{value:1783,currency:'TWD',date:'2026-10-30',type:'经销商未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學支撐件系列/底座/磁性表座/gcm-42系列-磁性表座/'},
    alternatives:[['Daheng','GCM-420302M同型号替换（型号已由B照片铭牌确认）','https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學支撐件系列/底座/磁性表座/gcm-42系列-磁性表座/'],['Thorlabs','磁力底座系列（功能替代，孔位需重新核对）','https://www.thorlabs.com/'],['OptoSigma','磁性底座（功能替代，需核孔位）','https://www.optosigma.com/']],
    note:'照片31铭牌确认GCM-420302M。顶面孔系为5-M6（50×50方形四孔+中央M6）、4-M4@40及4-M3@32。磁性开关结构依铭牌/照片复原；厂商标称吸力不等于本机装配承载验证。'},
  B03:{qty:1,category:'二维正交手动平移台',material:'黑色阳极氧化铝合金',drawing:'https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323095702eFQBtxcrQgq7RZ9rgWIqSw.pdf',datasheet:'https://datasheets.globalspec.com/ds/daheng-new-epoch-technology/gcm-t25m2l/7960a676-cd6f-4f03-bca2-97a2b7c1f184',quote:{value:8740,currency:'TWD',date:'2026-10-31',type:'GCM-T25M2L双轴版本经销商未税参考价（型号后缀未实物确证）',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/'},alternatives:[['Daheng','GCM-T25M2C 另一测微头装法（NT$8,453）','https://www.anjun.com.tw/'],['Zolix','二维叠加式交叉滚柱台（须验孔距）','https://www.zolix-group.com/']],note:'原图108/97均可见两正交驱动。大恒正式GCM-901604M组装示例使用T25M2L，65×65×33mm；2L后缀仍属组合图匹配候选，不是原铭牌完全读出。'},
  B04:{qty:1,category:'手动升降台',material:'铝合金与钢导轨',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',alternatives:[['Zolix','垂直位移台同负载系列','https://www.zolix-group.com/'],['Newport','手动垂直台，同负载系列','https://www.newport.com/']],note:'GCM-V25M 25mm 行程确认；完整外形高度与螺钉长度未确认'},
  B05:{qty:1,category:'B04输出侧安装底座',material:'阳极氧化铝合金/钢（待核）',
    alternatives:[['Zolix','PHPB-1 标准杆架底座：可作Ø12支撑杆的产品候选，需核对输出安装面','https://www.zolix.com.cn/prodcon_371_399_467_669.html'],['Daheng','GCM-AB系列直角转接件，连接孔需验证','https://www.spl-tech.cn/productinfo/3312390.html']],
    note:'不是标准Zolix整套支架的唯一型号。B05在本模型中仅指B04安装底座；B24交叉夹、B25接杆、B26末端转接和B27短接杆分别列项。安装孔全未验收。'},
  B29:{qty:1,category:'照片95底部安装座，型号未识别',
    material:'黑色金属本体，底部亮色薄层；合金及磁性均待鉴别',
    alternatives:[['Daheng','GCM-42系列磁性底座，仅历史108/109的另一方案参考，不代表本次照片已经识别','https://www.kryptronic.de/images/catalog/catalog-download-daheng-optics.pdf']],
    note:'本次实拍95中可见平底黑色支撑块，但无法从当前局部照片识别厂家、紧固孔位置、吸磁属性或接触面。严禁因历史108/109用过GCM-420302M就把本件当磁性座。65×65×20仅视觉布局代理。'},
  B30:{qty:1,category:'手动竖直精密平移台',material:'铝合金；交叉滚柱导轨（厂家产品系列）',
    drawing:'https://www.kryptronic.de/images/catalog/catalog-download-daheng-optics.pdf',
    datasheet:'https://www.directindustry.com/prod/daheng-new-epoch-technology-inc-cdhc/product-57930-2161925.html',
    alternatives:[['Daheng','GCM-VC10M为45×45、10mm行程的不同产品，不能在65×65安装面直接当同型号替换','https://www.kryptronic.de/images/catalog/catalog-download-daheng-optics.pdf']],
    note:'用户97号铭牌可读GCM-VC13M；厂家目录给出65×65mm台面、13mm行程、交叉滚柱导轨。模型外立板、前面螺钉和顶面孔距并非厂家CAD测绘。'},
  B31:{qty:1,category:'精密手动摆角台',material:'铝合金燕尾式摆角滑台',
    drawing:'https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323887513CGyEqPOTSg2dALlTmtGkqw.pdf',
    datasheet:'https://m.rympo.com/h-pd-3809.html',
    alternatives:[['Daheng','GCM-G40M40L虽为40×40×20mm但旋转中心R40、行程±7°，不是G40M60L','https://m.rympo.com/h-pd-3809.html']],
    note:'照片94可见GCM-G40M60L铭牌、右侧测微螺杆与上方L片。厂家参数40×40×20mm、R60、±5°。未获取完整G40M60L原生CAD，滑台侧面凹槽与螺丝位置仍为外观代理。'},
  B32:{qty:1,category:'自制折弯连接件',material:'黑色表面处理薄金属板，具体牌号/厚度待测',
    alternatives:[], // no verified shop/quote; do not point a local custom plate to Thorlabs
    note:'94号实物照片明确只有一片L型薄板以及顶面两枚可见紧固件，绝非150mm圆杆。当前顶板80×12、板厚2.5、左折边72mm均为候选轮廓，不能据此下加工单。夹具下端连接未知。'},
  B24:{qty:1,category:'万向双旋转杆夹（新实物铭牌确认）',material:'黑色表面处理金属',
    drawing:'https://www.zolix-group.com/public/storage/upload/files/MirrorMount/PHUC.pdf',
    datasheet:'https://www.zolix-group.com/product/detail/121.html',
    alternatives:[['Zolix','PHUC-1 同型号原厂替换（型号已确认）','https://www.zolix-group.com/product/detail/121.html'],
      ['Zolix','PHCP-2 外形/孔轴不同，不可作为相同实物','https://www.zolix.com.cn/prodcon_371_399_467_729.html'],
      ['Daheng','GCM-55 系列多为Ø12.7mm夹持，与Ø12mm杆不兼容','https://www.anjun.com.tw/']],
    note:'新照片149可读 PHUC-1，150显示同机装配。PHUC-1 原厂A=60/B=Ø30/C=D=Ø12/E孔心距33mm、重120g。取消以前PHCP-2的USD10报价，PHUC-1本体需正式询价。实际铰接角、接杆位置及锁紧螺纹仍待核实。'},
  B25:{qty:1,category:'首根Ø12水平金属杆（场景85mm候选）',material:'不锈钢',
    datasheet:'https://www.zolix-group.com/product/detail/220.html',
    alternatives:[['Zolix','PHSP12系列，按实际两夹紧块间距选长','https://www.zolix-group.com/']],
    note:'照片108/149第一根杆仅连接B33方夹与PHUC上孔，旧150mm长尾为多画。场景拟合85mm不等于已确认的具体原厂零件。'},
  B26:{qty:0,unit:'接口',category:'下杆到GCM1302M的M6同轴端面（非采购实体）',
    alternatives:[],
    note:'真实照片108/150不存在早期建模的Ø26粗大套筒与垂直悬挂块。B26仅是待核实的M6端部连接/孔轴记号，在BOM中数量为0，不应列入采购总价。配合深度与螺纹尚未识别。'},
  B27:{qty:1,category:'竖直Ø12精磨接杆（照片标定长度候选）',material:'不锈钢',
    datasheet:'https://www.zolix.com.cn/prodcon_371_399_467_664.html',
    alternatives:[['Zolix','PHSP12-4 100mm（照片比例候选）','https://www.zolix.com.cn/prodcon_371_399_467_664.html'],
      ['Zolix','PHSP12-3 75mm（必须重新核对套筒插入深度）','https://www.zolix.com.cn/prodcon_371_399_467_664.html']],
    note:'照片149展示立杆穿过长圆柱套筒并高出方夹，旧25mm短杆与实物严重冲突。100mm为PHSP12-4标准长度的照片拟合候选，不是原机型号验证。'},

  B34:{qty:1,category:'Ø12竖直接杆的筒形高度调节套座',material:'黑色表面处理金属',
    datasheet:'https://www.zolix-group.com/product/detail/225.html',
    alternatives:[['Zolix','PHSH-2 50mm（照片比例候选，非已认明SKU）','https://www.zolix-group.com/product/detail/225.html'],
      ['Zolix','PHSH-1 25mm（高度不符，不能随意替换）','https://www.zolix-group.com/']],
    note:'149号尺规照片中约4–5cm高黑色圆柱套筒，旧B模型完全漏画。50mm仅与Zolix PHSH-2原厂标称高度相符，圆孔Ø12、外径、内部V槽、侧锁紧杆及底部连接尚未实物测定。'},
  B28:{qty:1,category:'PHUC-1 另一连接端的独立Ø12金属接杆',material:'不锈钢（待核）',
    datasheet:'https://www.zolix-group.com/product/detail/121.html',
    alternatives:[['Zolix','PHSP12 系列按实测长度选择','https://www.zolix-group.com/']],
    note:'照片149/150能确认PHUC-1输出端有第二根横杆，杆体止于GCM-1302M侧面。当前场景54.5mm长度仅为相对位置拟合，末端M6连接形式尚未确认。'},
  B33:{qty:1,category:'立杆到第一横杆的独立方形连接夹',material:'金属（待核）',
    alternatives:[['Zolix','正交Ø12夹持件，必须逐孔比对原厂图','https://www.zolix-group.com/']],
    note:'照片149可见PHUC-1以外的方形夹体，不能省略或替换为PHUC-1。厂家与内孔结构尚未识别。'},
  B06:{qty:1,category:'薄板/载玻片夹持器（型号实拍确认）',material:'阳极氧化铝及钢螺钉',
    datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/',
    quote:{value:1150,currency:'TWD',date:'2026-10-30',type:'GCM-1302M 经销商历史未税参考（型号由照片150确认）',
      source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/'},
    alternatives:[['Daheng','GCM-1311M M6/L52（不同夹头形式）','https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcm-13系列-底片架/'],
      ['Daheng','GCSM-680010专用载玻片架，中空台面50×25mm孔距，不适用边夹直装','https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/夾持器/其他光學元件夾持器件/gcsm-680010載玻片夾持架/']],
    note:'厂家GCM-13系列采用两枚调节螺钉共同推动一块活动压板，GCM-1302M标称M6、L60mm、105g、夹持厚≤5mm。现3D已按该功能关系重建，但两螺钉实际坐标、活动夹板轮廓、安装方向仍未从原照片或机械图确认。GCSM-680010中空直装夹是另一装配方案。'},
  B07:{qty:1,category:'耗材/自制件',material:'玻璃载玻片/聚合物转移膜',alternatives:[['Fisher Scientific','实验室玻片','https://www.fishersci.com/'],['VWR','玻片/PDMS 类耗材','https://www.vwr.com/']],note:'76×26×1玻片标准候选；玻片底104.5mm、PDMS距热台4.5mm均为无穿模候选，不代表原设备实测'},
  B08:{qty:1,category:'手动旋转台',material:'黑色阳极氧化铝合金',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/',quote:{value:4600,currency:'TWD',date:'2026-10-30',type:'经销商未税参考价',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/旋轉台-2/gcm-11系列旋轉台/'},alternatives:[['Newport','精密手动旋转台 90mm 级（需查负载）','https://www.newport.com/'],['OptoSigma','手动旋转台 90mm 级','https://www.optosigma.com/']],note:'厂家标称中心载荷 4kg；固定用 4×Ø6.8 与 M6 顶孔方向要分开核对'},
  B09:{qty:1,category:'交叉滚柱平移台',material:'304 不锈钢喷砂',drawing:'https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.pdf',cad:'https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.rar',datasheet:'https://www.zolix-group.com/product/specification/179.html',quote:{value:325,currency:'USD',date:'2026-10-30',type:'厂家公开型号标价（美元）',source:'https://www.zolix.com.cn/en/prodcon_371_385_457_517.html'},alternatives:[['Newport','交叉滚柱 25mm 行程手动平移台','https://www.newport.com/'],['OptoSigma','交叉滚柱 25mm 行程平移台','https://www.optosigma.com/']],note:'已成功解析厂家RAR：原生NFP-1462C.step 2.41MB及.x_b 654KB；STEP是44个壳体/815个曲面、0封闭实体。官方图4×Ø6.5沉孔Ø11、9M6/4M3为不同接口；下载仅供本地配准，不公开重分发'},
  B10:{qty:1,category:'隔热材料/自制',material:'钙硅酸盐板 / 微孔无机板（未经鉴定）',alternatives:[['MICROSIL','微孔保温板（需要等级/压缩强度）','https://www.promat.com/'],['RS PRO','高温隔热板材料（待比对）','https://sg.rs-online.com/']],note:'约 10 mm 来自用户目测；照片显示白色、易开裂材料，需优先评估热压缩强度及粉尘安全'},
  B11:{qty:1,category:'CNC 定制',material:'铝合金优先候选，待确认牌号',alternatives:[['本地 CNC 加工商','按验证后的 STEP/DXF 询价',''],['国内光学机械加工商','真空腔/气道/端口定制','']],note:'用户确认后侧真空管与陶瓷加热片双引线。孔径、后侧通道、38.6mm凹腔均为工程候选；需核对密封和热应力'},
  B12:{qty:1,category:'电阻加热器',material:'氧化铝或氮化铝陶瓷（未经确认）',alternatives:[['Watlow','ULTRAMIC 陶瓷加热器，按面积/电压定制','https://www.watlow.com/'],['Backer','工业陶瓷加热模块','https://www.backergroup.com/']],note:'约200°C工况；陶瓷加热块从后侧出线已由用户确认。38×38×5和双线引出孔位仍是候选；需按铭牌选功率'},
  B13:{qty:1,category:'测温探头',material:'K型热电偶（候选）',alternatives:[['OMEGA','K型微型探头/热电偶','https://www.omega.com/'],['RS PRO','工业热电偶微型接点','https://sg.rs-online.com/']],note:'探头位于加热器上表面夹持，接触位置由用户确认；温控器输入模式待查'},
  B14:{qty:4,category:'紧固件',material:'不锈钢/合金钢（按热环境）',alternatives:[['MISUMI','ISO 4762 低头/圆柱头内六角','https://sg.misumi-ec.com/'],['RS PRO','M6 机械紧固件','https://sg.rs-online.com/']],note:'4枚靠近吸附块四角的齐平紧固件是用户确认；M6×25及连接方式未得到实测证实。NFP原厂4×Ø6.5沉孔是通孔而非内螺纹，绝不可按M6攻丝孔采购'},
  B15:{qty:1,category:'真空气路',material:'耐温软管/金属快插接头',alternatives:[['SMC','真空接头和气管','https://www.smcworld.com/'],['Parker','真空管接头','https://www.parker.com/']],note:'用户明确后侧（−Z）真空管/加热片双引线，V17的左侧出口错误。接头直径、螺纹、软管材料和密封仍未知'},
  B16:{qty:1,category:'显微镜',material:'金属喷涂机身 / 光学玻璃',alternatives:[['Olympus Evident','金相显微镜（仅功能参考）','https://www.olympus-ims.com/'],['Nikon','金相显微镜（仅功能参考）','https://www.microscope.healthcare.nikon.com/']],note:'照片116表面可读 SDPTOP、MXFMS；调焦机构和物镜转盘在108与视频中可见，实际机身外廓仍欠原厂CAD'},
  B17:{qty:1,category:'数字相机',material:'金属相机壳',alternatives:[['Daheng Imaging','USB3 工业相机','https://en.daheng-imaging.com/'],['FLIR/Teledyne','工业显微相机','https://www.teledynevisionsolutions.com/']],note:'照片113显示 SDPTOP Digital Microscope Camera，型号细节不能完整读取'},
  B18:{qty:1,category:'显微物镜',material:'光学玻璃/金属',alternatives:[['Olympus Evident','对应倍率和工作距离的物镜（需机械适配）','https://www.olympus-lifescience.com/'],['OptoSigma','物镜及物镜转接件','https://www.optosigma.com/']],note:'照片110可见 10× / 0.15 / DIC / WD10.8 标注，同时另一支有 OptoSigma 品牌；不能将两支混成一个型号'},
  B36:{qty:1,category:'银色金属电气控制机箱，内部包含B21和B23',material:'金属薄板（牌号待核）',
    alternatives:[['Hammond','尺寸/材质/安装孔均须按实物验证的金属控制箱类别','https://www.hammfg.com/']],
    note:'照片114正面宇电面板、照片119揭盖内有SE-600-48与黑色模块。285×225×125mm及3mm板厚全部是容纳内部元件的布局候选；不允许编造品牌型号、孔距或走线。'},
  B19:{qty:1,category:'温控系统前置面板',material:'YUDIAN宇电面板控制器（非整个机箱）',alternatives:[['Autonics','PID 控温器（需输入输出适配）','https://www.autonics.com/'],['Omron','温控器 E5 系列（电压/SSR 类型校核）','https://www.ia.omron.com/']],note:'照片114显示宇电 AI 系列面板；完整型号、SSR/热电偶接线未知'},
  B20:{qty:1,category:'VN-50无油真空泵（照片铭牌型号）',material:'电机/泵头',alternatives:[['YCZX','VN-50产品族规格参考；品牌与实物OEM对应关系未确认','https://www.youchengzhixin.com/vn-50-220v-230w-65lmin--88kpa-oil-free-piston-electric-vacuum-pump']],note:'照片120/123铭牌读数：VN-50、220V、230W、53L/min、680mmHg、约4kg。YCZX同型号族目录标G1/4、200×110×150mm、142×96mm安装孔距、4.45kg；实物品牌、泵口性别/牙型/方向和转接件未核。G1/4不是软管倒刺尺寸，采购前需实测接口并确认BSPP/R牙及密封方式。'},
  B21:{qty:1,category:'工业电源',material:'铝外壳，强制通风',drawing:'https://www.meanwell.com/Upload/PDF/SE-600/SE-600-SPEC.PDF',datasheet:'https://www.digikey.sg/zh/products/detail/mean-well-usa-inc/SE-600-48/7706618',quote:{value:150.19,currency:'SGD',date:'2026-10-30',type:'DigiKey Singapore 公开单件含税前标价',source:'https://www.digikey.sg/zh/products/detail/mean-well-usa-inc/SE-600-48/7706618'},alternatives:[['MEAN WELL','LRS-600-48（厂家推荐替代；安装尺寸不同）','https://www.digikey.sg/en/products/detail/mean-well-usa-inc/LRS-600-48/']],note:'SE-600-48由照片117/119确认为B36金属机箱内部电源；已标记Not For New Designs，不代表其就是加热块电源'},
  B22:{qty:1,category:'显微镜照明供电',alternatives:[['Thorlabs','可调 LED 驱动器（需确认 LED 额定电流）','https://www.thorlabs.com/'],['Mightex','实验室 LED 电源','https://www.mightexsystems.com/']],note:'115.jpg 直接显示 ADAPTOR FOR LED LAMP，电气参数需解读铭牌；不可假定与 LEDD1B 相同'},
  B23:{qty:1,category:'控制箱内模块',alternatives:[['Omron','SSR/控制继电器相关型号，仅类别参考','https://www.ia.omron.com/']],note:'119/121/122 的黑色端子/散热孔模块未知，不能随意认定是电源或 SSR'}
};
const A={
 A01:base.B01,
 A02:{...base.B03,qty:1,category:'X/Y 双轴精密平移台',drawing:'https://www.kryptronic.de/images/catalog/catalog-download-daheng-optics.pdf',datasheet:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/',quote:{value:8740,currency:'TWD',date:'2026-10-31',type:'GCM-T25M2L 双轴候选参考价，实物型号后缀待核',source:'https://www.anjun.com.tw/光學元件/光學元件、儀器銷售/dhc大恆光電/光學調整架系列/移動台/平移台/gcm-t13m-gcm-t25m系列-精密平移台/'},note:'用户2026-11-11确认样品侧A02为X/Y双轴，原厂GCM-T25M2L厚33mm、2C为另一安装方向；价格为2L未税历史参考，不代表实机后缀已确认。'},
 A15:{...base.B03,qty:1,note:'照片97明确显示两根相互垂直的水平测微头。厂家双轴33mm，2L参考NT$8,740 / 2C参考NT$8,453；确切尾缀需实物确认。'},
 A03:{qty:1,category:'精密垂直台',alternatives:[['Zolix','高精度垂直微调台','https://www.zolix-group.com/']],note:'A 组 95/97 可见 GCM-VC13M；外壳尺寸尚未由厂家图纸确认'},
 A04:{qty:1,category:'倾角平台',alternatives:[['Newport','双轴倾角平台','https://www.newport.com/'],['Thorlabs','Goniometer/tilt platform','https://www.thorlabs.com/']],note:'照片94 GCM-G40M60L 型号清晰，但完整机械孔位尚待厂家图确认'},
 A05:{qty:1,category:'L形薄金属折弯连接片',material:'黑色薄金属板（牌号/厚度待测）',alternatives:[['本地CNC加工商','按照片94和实物尺寸测绘加工','']],note:'A05是照片94可见的L形折弯连接片，不是玻片夹具，也不是玻片耗材。板厚、折边和下端连接未实测。'},
 A05C:{qty:1,category:'独立玻片夹持器候选',material:'铝合金本体/钢紧固件',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',alternatives:[['Daheng','GCM-1302M（M6、L60mm）功能/外形候选',''],['Daheng','GCM-1311M（M6、L52mm）功能/外形候选','']],note:'A平台照片未见可读夹具铭牌，GCM-1302M/1311M仅作为GCM-13系列比对候选。不得把B06已确认的GCM-1302M身份直接移植到A05C；未确认前不作为已安装几何或采购定型。'},
 A05G:{qty:1,category:'玻璃载玻片耗材（尺寸候选）',material:'玻璃',alternatives:[['Fisher Scientific','76×26×1mm标准显微载玻片（尺寸候选）','https://www.fishersci.com/'],['VWR','标准显微载玻片（需按实物尺寸选）','https://www.vwr.com/']],note:'与A05折弯片、A05C夹具分别列项。76×26×1mm为标准尺寸候选，尚未由A平台实物尺图确认。'},
 A17:{qty:1,category:'磁吸固定座（A照片可见特征，型号未识别）',material:'未知，需实物确认',note:'照片22/24仅确认前侧滑槽、中央滚花旋钮及两颗面板螺钉；A17没有可读铭牌，顶面/底面孔系未见。不得把B02/GCM-420302M的13孔型、磁吸开关或承载参数套用到A17。外廓65×65×20mm仅为模型候选，采购前需补拍A17正面、顶面、底面及铭牌。'},
 A06:{qty:1,category:'手动旋转台',material:'黑色阳极氧化铝',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',alternatives:[['Daheng','GCM-11同系列按接口选型','https://www.daheng-optics.com/']],note:'照片100 旋转刻度台与上部 GCM-T25M 直接叠放；不能确认旋转台型号'},
 A16:{qty:1,category:'精密安装底座',material:'金属',drawing:'https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf',
    alternatives:[['Daheng','GCM-5306M原厂同型号安装底座','https://www.anjun.com.tw/']],
    note:'照片137、161确认GCM-5306M，原厂112×70×8mm、150g；位于A旋转台下方，不增加旋转自由度。安装孔距仍待厂家机械图。'},
 A07:{qty:1,category:'自制样品座',alternatives:[['本地CNC厂','按现场尺寸报价','']],note:'与 B 加热台不能直接等同，须单独测绘'},
 A08:{qty:1,category:'管镜',material:'精密光学玻璃、黑色金属镜筒',datasheet:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf',drawing:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf',quote:{value:468.18,currency:'USD',date:'2018-01-01',type:'2018 目录历史标价，不是现价',source:'https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf'},alternatives:[['Thorlabs','TTL200（螺纹与镀膜差异）','https://www.thorlabs.com/'],['Edmund Optics','200mm 管镜（须核对螺纹）','https://www.edmundoptics.com/']],note:'TTL200-A 光学焦距 200mm，外部 SM2 2.035-40 双面螺纹；图中实际壳长为代理，镜头不能按焦距做成长 200mm'},
 A09:{qty:1,category:'工业相机',alternatives:[['Daheng Imaging','工业相机同接口系列','https://en.daheng-imaging.com/'],['FLIR/Teledyne','工业相机同接口系列','https://www.teledynevisionsolutions.com/']],note:'照片78与82可看到相机/成像筒，具体芯片与 C-mount 接口未完全确认'},
 A10:{qty:1,category:'显微镜立柱/支架与E-arm候选',material:'金属，具体材质与表面处理待确认',datasheet:'https://www.lylight.com/product/coarse-and-fine-focus-mount-50mm25mm-with-fine-adjustment-focusing-knob/',drawing:'https://www.lylight.com/wp-content/uploads/2024/05/FR5025CF-coarse-and-fine-adjustment-focus-rack-LYLIGHT.pdf',alternatives:[['LYLIGHT','FR5025CF一体式E-arm候选：Ø25mm立柱孔、Ø50mm镜体接口；产品图标注165mm中心距，整机示意另标135mm，端点基准待核','https://www.lylight.com/product/coarse-and-fine-focus-mount-50mm25mm-with-fine-adjustment-focusing-knob/'],['Thorlabs','MGZ30直接立柱安装调焦块，Ø1.5in立柱；可能将后夹持并入A18','https://www.thorlabs.com/item/MGZ30']],note:'当前A10是照片拟合的立柱/横臂，长度与Ø26mm柱径均未实测。LYLIGHT FR5025CF显示E-arm与调焦块为一体，Thorlabs MGZ30也有一体式后夹持。A10/A18边界确认前不得将A10作为独立已确认采购件。'},
 A18:{qty:1,category:'显微镜调焦块与一体式支架候选',material:'黑色金属/涂层（以实机为准）',datasheet:'https://www.lylight.com/product/coarse-and-fine-focus-mount-50mm25mm-with-fine-adjustment-focusing-knob/',drawing:'https://www.lylight.com/wp-content/uploads/2024/05/FR5025CF-coarse-and-fine-adjustment-focus-rack-LYLIGHT.pdf',alternatives:[['LYLIGHT','FR5025CF：Ø25mm立柱孔、Ø50mm镜体接口、0.02mm微调精度；产品图标注165mm中心距，整机示意另标135mm，端点基准待核','https://www.lylight.com/product/coarse-and-fine-focus-mount-50mm25mm-with-fine-adjustment-focusing-knob/'],['LYLIGHT','FR7625CF：Ø25mm立柱孔、Ø76mm镜体环，中心距与微调精度待核','https://www.lylight.com/product/focus-bracket-coarse-fine-adjustment-knob-focusing-rack-76mm25mm/'],['Thorlabs','MGZ30：Ø1.5in立柱安装、30mm Z行程、内置五物镜盘','https://www.thorlabs.com/item/MGZ30'],['Volition CAD catalog','MGZ30 CAD download listing: AutoCAD DXF / SolidWorks / STEP; file not yet retrieved or verified','https://www.govolition.com/product/V40-MGZ30'],['Olympus/Evident','BXFM-F：84mm机身宽度及Ø32H8立柱孔候选','https://evidentscientific.com/en/products/upright/bx53m']],note:'FR5025CF/FR7625CF与MGZ30均为结构候选，不是已确认实机。FR5025CF只有产品图和部分规格，未找到完整尺寸工程图或原生STEP；其产品图165mm中心距与整机示意135mm标注的尺寸基准待核；FR7625CF的中心距与微调精度未从公开产品页核实；MGZ30现行Thorlabs产品页与2012 Rev C工程图均标注225µm/rev，2014目录标注250µm/rev，作为历史版本差异保留。现行规格参考采用225µm/rev。MGZ30 Rev C图纸另列4×4-40 UNC、5×M26×36 TPI和未映射的外廓尺寸，且明确不可用于制造；图纸约重4.55kg与现行产品页包装重量1.79kg定义不同。MGZ30五位置转盘与A19当前两个可见通孔仍存在未解决差异。现有A18默认几何未使用任何候选厂家尺寸，采购前必须核对高清实物、柱径、镜体环内径、中心距、后壳分缝和物镜盘底视图。'},
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
   // B26 is a zero-quantity UNVERIFIED M6 interface, not a physical
   // procurement line. It stays visible for traceability, but must
   // never be counted as one missing priced component or a purchased SKU.
   if((p.qty??1)===0)continue;
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
 const fields=['id','name','maker','model','qty','unit','category','dims','level','material','price','currency','priceDate','priceType','priceSource','drawing','cad','datasheet','alternatives','note','evidence','interfaceReview','interfaceGaps','photoIds','embeddedPhotos','missingPhotoOriginals'];
 return [fields, ...rows.map(p=>fields.map(f=>({
    price:p.quote?.value||'',currency:p.quote?.currency||'',priceDate:p.quote?.date||'',priceType:p.quote?.type||'',priceSource:p.quote?.source||'',alternatives:(p.alternatives||[]).map(v=>v[0]+' '+v[1]+' '+v[2]).join(' | '),
    ...procurementInterfaceFields(p.id.startsWith('A')?'A':'B',p.id)
    ,photoIds:photoRefsForPart(p.id[0],p.id).map(r=>r.id).join(' / '),
    embeddedPhotos:photoRefsForPart(p.id[0],p.id).filter(r=>r.src).map(r=>r.src).join(' | '),
    missingPhotoOriginals:photoRefsForPart(p.id[0],p.id).filter(r=>!r.src).map(r=>r.id).join(' / ')
  }[f]??p[f]??'')))];
}
