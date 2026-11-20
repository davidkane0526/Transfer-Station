# V216 零件厂商与型号识别审计（2026-11-19）

## 1. 基线与证据来源

- 仓库：davidkane0526/Transfer-Station
- 基线分支：main
- 基线提交：642055de246b22032f5e677e8bd9ae742accee02（V215）
- 本次审核分支：vendor-audit-2026-11-19
- 用户原始资料：转移平台(1).zip
- 压缩包大小：150,550,253 bytes
- 原始压缩包 SHA-256：1a47b90db7da9da83d126512e7f0ef7d774da0939ece3e0201b0c13cdf60b0a9
- 内容：59 张照片、2 段视频
- 识别范围严格限制为：卓立汉光 Zolix、大恒光电 Daheng、Thorlabs。

本轮直接检查了原始照片中的铭牌、标尺、孔阵、杆径、接口及部件相互连接关系，并用三家厂商的产品页、目录或机械图交叉核对。视频只用于补充装配关系，不以单帧外观代替型号铭牌。

## 2. 本轮直接型号确认

### 2.1 Thorlabs

| 零件 | 原图证据 | 识别结果 | 状态 |
|---|---|---|---|
| A08 | 照片82 | TTL200-A 管镜。铭牌可读 f=200 mm、400–700 nm、ØEP 22 mm、WD 148 mm；原厂目录说明两端为外SM2螺纹 | 型号确认 |
| A34（新增） | 照片82 | SM1CP2 外螺纹端盖。端盖正面直接刻有 THORLABS / SM1CP2，螺纹为SM1 1.035"-40 | 型号确认 |
| A11 | 照片84、85 | MWWHL4 mounted LED。背面铭牌可读 THORLABS / MWWHL4 | 型号确认 |
| A12 | 照片86 | LEDD1B T-Cube LED Driver。正面型号和LED Driver面板标识清晰 | 型号确认 |
| B35 | 照片145、146、150 | 黑色局部面包板可见 THORLABS 标志；品牌确认，具体SKU仍是候选 | 厂商确认，型号候选 |

LEDD1B 使用 15 VDC 电源，输出 0–1.2 A，带载顺应电压最低 11 V、典型 12 V，空载可达 14 V。配用 MWWHL4 时，连续电流限值为 1.0 A。

MWWHL4 原厂规格：3000 K 暖白光，最低/典型输出功率 570/640 mW，最大连续电流 1000 mA，典型正向电压 3.0 V。原厂资料将 LEDD1B 列为兼容驱动器。照片84/85还显示灯体被环形夹座固定；原厂资料展示 MWWHL4 安装在 SM1RC slip ring 中，因此 A21 的 SM1RC 是兼容候选，但实物夹座没有可读型号标记，不能升级为确认。

A35（新增候选）：照片82显示A34端盖装在方盒可见端口上，照片83显示方盒与A08管镜处于同一光路。方盒本体的品牌与型号待核。C4W原厂裸件尺寸为50.8×50.8×39.6 mm，四侧有SM1口与4-40杆螺纹孔。C6W两相对侧改用Ø6 mm通孔。实物三向尺寸、对侧杆孔及与TTL200-A外SM2之间的接续件仍待复核。BOM各记录一件可见的端盖和方盒，方盒的具体选型待定。

B35 的 MB2530/M 是尺寸与孔系候选，不是已确认型号。Thorlabs原厂规格明确：MB2530/M尺寸为250×300×12.7 mm，M6-1.0/25 mm孔距，边缘距首孔12.5 mm，标准型号只有四角沉孔；中央第五沉孔是其他较大规格的配置，不能套用到MB2530/M。照片确认Thorlabs品牌，但实物中心被装配遮挡，无法独立查看中心有无沉孔，尺寸和厚度也尚未全部实测。因此B35仍为候选；若实物有中央第五沉孔，应否定标准MB2530/M匹配。本轮不修改三维模型。

### 2.2 大恒光电 Daheng

| 零件 | 原图证据 | 识别结果 | 状态 |
|---|---|---|---|
| B08 | 照片111 | GCM-1107M，侧壁标记直接可读。外伸银色件可见，功能待核 | 型号确认 |
| B02 | 照片108、112及原视频约40秒 | GCM-420302M，磁性底座铭牌直接可读，含OFF/ON开关 | 型号确认 |
| B06 | 照片107、150及视频 | GCM-1302M，夹体铭牌直接可读 | 型号确认 |
| B31 | 照片94 | GCM-G40M60L，铭牌直接可读 | 型号确认 |
| B03 | 照片108、109及原视频约46秒 | 本构型可读GCM-T25M，双轴后缀2L/2C待核。照片95属于B29→B03→B30构型，照片100属于A样品侧的同系列参考 | 基础型号确认，后缀待核 |
| B04 | 照片109 | GCM-V25M，铭牌直接可读 | 型号确认 |
| B30 | 照片97 | GCM-VC13M，铭牌直接可读 | 型号确认 |
| A16 | 照片137、138、161 | GCM-5306M，底部铭牌可读 | 型号确认 |

其中，B08 GCM-1107M 原厂目录参数包括Ø94×33.2 mm外形、顶面9-M6孔阵及底面4×Ø6.8/Ø11.5沉孔。B02 GCM-420302M原厂资料给出65×65×20 mm外形。A16 GCM-5306M原厂资料给出112×70×8 mm、150 g。以上规格用于型号交叉核对，不代替对现场孔位和装配尺寸的实测。

### 2.3 卓立汉光 Zolix

| 零件 | 原图证据 | 识别结果 | 状态 |
|---|---|---|---|
| B09 | 照片110 | NFP-1462C，侧面铭牌直接可读 | 型号确认 |
| B24 | 照片149、150 | PHUC-1，实物标签直接可读 | 型号确认 |
| B33 | 照片149、150 | 方形交叉杆夹与PHCP系列外形相符，照片中的两杆夹角约90°，但无实物铭牌 | 高置信度候选 |
| B34 | 照片149、150及原视频约28–32秒 | 套座本体可读 Zolix，可见侧向锁紧件。具体型号未读出 | 厂家确认，PHSH-2候选 |
| B25、B27、B28 | 照片149、150及标尺 | Ø12 mm杆系与PHSP12系列相符；照片长度不能唯一确定标准SKU | 系列候选 |

PHCP-1候选依据：Zolix原厂明确PHCP-1采用两个固定正交的Ø12夹持孔，专用于90°连接；PHCP-2才允许两孔相对360°旋转。照片108、149/150的方形夹块确实把一根立杆与一根横杆近90°连接，外形优先支持PHCP-1，但没有实物铭牌，B33仍为候选。杆径Ø12 mm来自与B24 PHUC-1及PHSP12杆系的关联推断，并非B33自身的直接量孔。

PHSH-2候选依据：原厂资料给出约50 mm高度，并与PHSP12系列接杆配套。照片149/150可见的圆筒套座与该外形相符。视频可见侧向锁紧件，仍需核对其规格、内部防转结构、底部接口和完整高度。

PHSP12系列长度候选：原厂目录中的PHSP12-3为75 mm、PHSP12-4为100 mm。当前场景拟合长度约70 mm和112 mm，均不能直接当成原厂标准长度或SKU。应以实际插入长度、端部螺纹和总长再次核实。

## 3. 对此前结论的纠正

1. A04L：GCM-G40M40L只有组合图/配对关系支持，照片没有读出下层铭牌。保持候选，不升级为确认。照片94可直接确认的是B31的GCM-G40M60L，不能把该铭牌移用到A04L。
2. B41：照片110只能确认一台NFP-1462C（B09）。B41是独立的第二级正交平移台，尚无铭牌证据，不能认定为第二台NFP-1462C，也不能据此宣称整组为NFP-2462CC。
3. A17：照片112的GCM-420302M铭牌属于B02磁性底座，不能移用到A17。A17不在本轮三家厂商的已确认结果中，保持未识别。
4. B34：照片112实际拍到的是B02的GCM-420302M磁性底座，不是PHSH-2套座。B34采用照片149/150及原视频约28–32秒的独立证据，PHSH-2仍为候选。
5. B35：原厂MB2530/M标准型号是四角安装沉孔，没有中央第五沉孔；此前泛化的大板第五沉孔说明不能套用到MB2530/M。照片中心被机构遮挡，无法独立验证实物是否满足此SKU，故候选状态不变。

## 4. 本轮GitHub变更

- 新增A34：Thorlabs SM1CP2，型号直接确认。
- 新增A35：Thorlabs C4W/C6W 30mm Cage Cube系列候选，具体变体待核。
- A11 MWWHL4、A12 LEDD1B：补入照片84–86的直接铭牌证据，沿用已有的确认状态。
- B08、B02、B03、B06、B33、B34、B35：补充或修正照片证据、候选等级及规格说明。B08实物型号已确认，历史报价仍单列为待询价。
- B35纠正中央第五沉孔判断。
- 未改动任何三维几何、装配层级、UI、渲染、采购价格或其他非识别数据。
- 本报告记录 V216 的识别工作，发布状态以 PR #1 为准。

## 5. 原厂资料

### Thorlabs
- TTL200-A tube lens：https://www.thorlabs.com/catalogpages/obsolete/2018/TL200-2P2.pdf
- SM1CP2 end caps：https://www.thorlabs.com/catalogpages/Obsolete/2017/SM1EC2.pdf
- C4W/C6W 30mm cage cubes：https://www.thorlabs.com/catalogpages/V21/182.PDF
- C4W 裸件图 0198-E0W Rev E（Thorlabs 原图存档）：https://storage.mtender.gov.md/get/02ab27fa-458f-41c9-954d-574137a9d32b-1653901411592
- MB solid aluminum breadboards：https://www.thorlabs.com/catalogpages/223.pdf
- MWWHL4 mounted LED / SM1RC / LEDD1B compatibility：https://www.thorlabs.com/catalogpages/obsolete/2022/MWWHLP1.pdf

### Daheng
- Daheng Optics GCM目录：https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf
- GCM-901604M组合机械图：https://cdhoptics.ks3-cn-beijing.ksyun.com/jjwdz/1612323095702eFQBtxcrQgq7RZ9rgWIqSw.pdf
- GCM-13 plate holder资料：https://www.directindustry.com/prod/daheng-new-epoch-technology-inc-cdhc/product-57930-2484661.html

### Zolix
- NFP-1462C原厂产品资料：https://www.zolix-group.com/product/specification/179.html
- NFP机械图：https://www.zolix.com.cn/filespath/files/ManualControl/ManualStages-en/NFP.pdf
- PHCP Series Crossing Post Clamp：https://www.zolix-group.com/product/detail/117.html
- PHSH-2 Post Holder：https://www.zolix-group.com/product/detail/225.html
- PHSP12 Ø12 mm Post：https://www.zolix-group.com/product/detail/220.html

## 6. 审核结论

本轮直接新增的型号确认是A34 Thorlabs SM1CP2；同时确认了原BOM中多个已有型号的铭牌证据，并新增A35 Cage Cube系列候选。B35的Thorlabs品牌已确认，但MB2530/M仍是候选。B33、B34、A21、A35均未冒充实物铭牌确认。

原始压缩包SHA-256已记录，可用于后续复核资料是否为同一版本。
