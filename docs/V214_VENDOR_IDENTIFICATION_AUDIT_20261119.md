# V214 零件厂商识别审计（2026-11-19）

## 1. 审计范围与基线

- 仓库：`davidkane0526/Transfer-Station`
- 分支：`main`（审计开始及提交前均只检测到 main；未创建其他分支）
- Git 基线：`V213`，`f2f3c199463872b5fd39024cd40e48e7a448233b`
- 本轮代码更新基线：`V214`，`62c816b92f3553fdd299d975a9cab1d95b34e432`
- 用户新增资料：`转移平台.zip`，共 59 张照片、2 段视频。
- 本轮重点照片：78、110、112–123、147、149–150、191–195。

本轮只把照片铭牌、可读文字、原厂技术资料和几何结构相互印证的内容写入零件记录。品牌可见不等于具体SKU确认；同一系列的兼容性也不等于实物必然来自该厂商。

## 2. 新增及强化的厂商识别

| 零件 | 厂商/型号判断 | 证据等级 | 结论 |
|---|---|---|---|
| A09 工业相机 | DAHENG IMAGING | 厂商确认，型号未知 | 照片78可读厂商标识；不能据外壳直接认定MERCURY2某一型号 |
| A19 左侧物镜 | JH-TOP | 品牌可读，SKU未知 | 照片191–193可辨JH-TOP字样；对应企业名称记录为Jinhua Top Optical Instrument Co., Ltd.，但尚无该物镜的完整原厂型号页 |
| A19 右侧物镜 | OLYMPUS / PlanFL | 品牌/系列文字可辨，SKU未知 | 照片191–193可见Olympus与PlanFL系列文字；倍率、NA、WD及螺纹仍未确认 |
| B16 显微镜 | SDPTOP / Ningbo Sunny Instruments Co., Ltd. | 品牌及企业关联确认 | 照片116可读SDPTOP MXFMS；舜宇原厂资料显示SDPTOP品牌并在页尾列出宁波舜宇仪器有限公司。该资料不是MXFMS的完整机械图 |
| B17 显微镜相机 | SDPTOP | 品牌确认，型号未知 | 照片113直接可读“SDPTOP Digital Microscope Camera”；结合B16及舜宇原厂资料，可将其归入SDPTOP品牌供应线索 |
| B18 物镜 | SUNNY LMPlan 50X/0.55、WD7.9 | 具体型号确认 | 照片147可读SUNNY、LMPlan、50X/0.55、∞/0、WD7.9；与舜宇原厂LMPlan表格一致 |
| B18 物镜 | LMPlan 5X/0.15、WD10.8 | 高置信度候选 | 照片110可读0.15、DIC、WD10.8，且物镜有红色倍率环；舜宇原厂LMPlan资料中5X/0.15的WD正好为10.80mm。倍率字符仍需高清照片复核 |
| B18 另一支物镜 | OptoSigma | 品牌确认，SKU未知 | 照片110可见OptoSigma标识，完整型号不可读 |
| B19 温控器 | Yudian AI-719 / AI-719P | 系列高置信度识别 | 照片114的PV/SV显示窗及MAN、PRG、MIO、COM、OP1、OP2、AL1、AL2、AU1、AU2指示灯排列与AI-719/AI-719P原厂手册匹配；P后缀、面板尺寸和模块配置仍未知 |
| B33 方形正交杆夹 | Zolix PHCP-1 | 高优先级候选，未见铭牌 | 照片149/150的方形正交夹体更接近原厂矩形PHCP-1；PHCP-2为圆柱式结构，与照片外形不如PHCP-1接近 |
| B34 圆柱杆套座 | Zolix PHSH-2，50mm | 高置信度候选，铭牌不完整 | 照片112标签被画面边缘截断，可见字符尾缀与H-2相符；照片149/150高度约4–5cm。原厂PHSH-2总高为50mm，并明确与PHSP12接杆配合 |
| B25/B27/B28 Ø12接杆 | Zolix PHSP12系列 | 系列候选，非实物型号确认 | 杆径及B34/PHSH系列的配套关系支持该产品族作为采购候选；具体长度、端部螺纹和实物制造商未确认 |

### 2.1 DAHENG IMAGING（A09）

照片78上的DAHENG IMAGING字样足以确认厂商品牌，故A09不再标记为“厂商未知”。大恒官网确有MERCURY、MERCURY2、MARS、VENUS等工业相机系列，并提供部分系列的3D图纸下载。

**当前不确认具体相机系列或SKU。** 现有50×45×44mm外壳、Ø24.4mm前端盲孔和C-mount接口仍是模型代理/待核参数。不得把MERCURY2手册或3D图纸当作实机型号证明。

### 2.2 JH-TOP与Olympus（A19）

照片191–193支持两支物镜分别出现JH-TOP及OLYMPUS/PlanFL文字。Jinhua Top Optical Instrument Co., Ltd.有官方企业网站，但目前没有找到能与实物完整倍率、NA、WD和螺纹全部对应的JH-TOP物镜SKU页面。

A19的物镜转换盘本体仍然**没有确认厂商**。不能因为物镜是Olympus或JH-TOP，就把转换盘本体也归到该厂商；Thorlabs MGZ30仍只是五工位结构对照候选。

### 2.3 Sunny / SDPTOP（B16–B18）

舜宇原厂CX40M产品资料末页列出“Ningbo Sunny Instruments Co., Ltd.”，正文展示SDPTOP品牌，并列出LMPlan系列物镜参数：

| LMPlan倍率 | NA | 原厂工作距离 |
|---|---:|---:|
| 5X | 0.15 | 10.80 mm |
| 10X | 0.30 | 10.00 mm |
| 20X | 0.45 | 4.00 mm |
| 50X | 0.55 | 7.90 mm |
| 100X | 0.80 | 2.10 mm |

这组数据与照片147的50X/0.55/WD7.9直接吻合，也解释了照片110中0.15/WD10.8物镜更可能是5X，而不是原记录误识别的10X。

注意：该原厂PDF介绍的是CX40M产品，不代表现场显微镜MXFMS就是CX40M。它用于确认舜宇/SDPTOP企业关联和LMPlan物镜参数，不能替代MXFMS原厂机械图。

### 2.4 Yudian AI-719 / AI-719P（B19）

宇电原厂AI-719/AI-719P手册第24页的前面板说明列出PV、SV双显示窗，以及MAN、PRG、MIO、OP1、OP2、AL1、AL2、AU1、AU2、COMM等指示灯，与照片114的面板布局匹配。

AI-719P在AI-719基础上增加50段时间程序功能。**照片只能识别到AI-719/AI-719P系列，不能区分P后缀，也不能确定96×96、160×80等面板尺寸变体或后部I/O模块。** 因此不得推断现场一定具备程序升温功能，也不得据面板外观推断SSR、热电偶或电源接线。

### 2.5 Zolix PHCP / PHSH / PHSP系统（B24、B25、B27、B28、B33、B34）

- B24 PHUC-1：照片149可直接读出Zolix PHUC-1，属于已确认型号。
- B34 PHSH-2：照片112可见不完整型号尾缀，且照片149/150的套座高度与原厂50mm规格匹配；升级为高置信度候选，但不写成已确认SKU。
- B33 PHCP-1：原厂PHCP-1为矩形正交杆夹，外形较PHCP-2更接近照片中的方形夹块。仍需核对两孔轴线、Ø12孔径、锁紧螺钉位置和底部安装方式。
- B25/B27/B28：PHSP12系列是合理的Ø12接杆候选，但照片没有显示杆体品牌或标准SKU。场景拟合长度不得伪装成原厂标准长度。
- 目前只能说这些零件**可能属于同一套Zolix Ø12杆系**，不能宣称已经证明原机整套采购自PHK12-20套件。

## 3. 仍未确认的厂商和型号

| 零件 | 当前候选 | 未确认原因 |
|---|---|---|
| A17 磁吸底座 | Oeabt MBS-65B/C；CORZC PTDB65；LBTEK MB65 | 顶面被A15遮挡，照片无法区分B/C孔阵，也没有清晰厂商铭牌 |
| A18 显微镜调焦单元 | LYLIGHT FR8425、FR5025CF、FR7625CF；Thorlabs MGZ30；Olympus BXFM-F | 照片外形可用于结构筛选，但未见完整型号铭牌，中心距、镜体环、立柱孔和一体式E-arm边界仍未实测 |
| A26 加热片 | 未识别 | 38×38×5mm为模型候选尺寸，电压、功率、材质和厂家未知 |
| A27 测温探头 | 热电偶/温度传感器候选 | 类型、线制、接点和接口未知 |
| A28 真空接头 | 后向中空接头候选 | 螺纹、密封方式、管径和耐温未知 |
| A30 A平台真空泵 | VN-50同族几何参考 | A平台实物铭牌未确认，不能用B20型号替代 |
| B20 真空泵 | VN-50；YCZX同型号族为供应线索；照片120疑似另有INWAVE标识 | 照片123确认VN-50及53L/min、220V、230W、680mmHg、约4kg。YCZX目录同族参数为-88kPa、4.45kg等，与实物680mmHg（约90.7kPa）存在差异；疑似INWAVE标识尚未对应到可核验企业 |
| B22 LED电源 | D1000 | 铭牌有型号和输出参数，但没有厂商标识 |
| B23 机箱内部模块 | 端子/散热孔模块 | 外形可见，无法唯一判断是SSR、驱动模块还是其他控制模块 |
| B41 下层第二平移台 | Zolix 65mm级单轴台为候选 | 有第二轴和测微头方向的照片证据，但无铭牌、孔距或原厂尺寸图 |

## 4. 下一轮需要的关键证据

1. **A09：** 相机侧面/底面铭牌、接口端正面和后端接口照片。先确定型号，再从大恒官网下载对应3D图纸，不再先套MERCURY2模型。
2. **A19：** 两支物镜各自完整铭牌近照；转换盘底面、侧面和安装孔近照。物镜品牌和转换盘厂商分开识别。
3. **B19：** 控制器上电启动时的型号显示，或侧面/后部完整铭牌；后部模块槽照片用于确定AI-719/719P订货代码。
4. **B33/B34：** 方形夹块两侧、顶面、底面近照；PHSH套座完整标签、侧锁紧螺钉及底面孔位。
5. **B20：** 真空泵完整铭牌和吸/排气口近照，尤其要看品牌全称、螺纹牙型和接口公母。
6. **A17：** 磁座顶面孔阵和正面铭牌无遮挡照片，用于区分MBS-65B与MBS-65C。

## 5. 原厂资料链接

- DAHENG IMAGING 相机产品系列：<https://en.daheng-imaging.com/list-2-1.html>
- DAHENG IMAGING 技术图纸下载：<https://en.daheng-imaging.com/list-61-1.html>
- Jinhua Top Optical Instrument Co., Ltd.：<https://en.topoptical.cn/>
- Ningbo Sunny Instruments / SDPTOP 原厂CX40M及LMPlan资料：<https://www.sunnyoptical.com/webfile/temps/2014098141512936_CX40M%E6%AD%A3%E7%BD%AE%E9%87%91%E7%9B%B8%E6%98%BE%E5%BE%AE%E9%95%9C.pdf>
- Yudian AI-719 / AI-719P原厂手册：<https://www.yudian.com/UserFiles/upload/file/20250327/S022-16%20%20AI-719%20719P%EF%BC%888.3%EF%BC%89%E4%B8%AD%E6%96%87%E8%AF%B4%E6%98%8E%E4%B9%A6-2022.8.19.pdf>
- Zolix PHCP系列：<https://www.zolix-group.com/product/detail/117.html>
- Zolix PHCP-1产品图：<https://www.zolix-group.com/public/storage/upload/images/Products/MirrorMount/PHCP-1.jpg>
- Zolix PHSH系列：<https://www.zolix-group.com/product/detail/225.html>
- YCZX VN系列泵参数表：<https://www.youchengzhixin.com/blog/yczx-oil-free-piston-vacuum-pumps-clean-quiet-compact-power-delivered-on-time>

## 6. 本轮代码变更边界

本轮只更新零件厂商、型号候选、采购资料和证据说明，没有据此替换未经确认的三维几何，也没有修改平台A/B装配结构。候选供应商不能作为实机型号确认，原厂参数不能替代实物测量。
