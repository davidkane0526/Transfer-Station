# V155 · Olympus BXFM-F 原厂尺寸图对照模型

日期：2026-11-13。

## 1. 来源与身份边界

- Olympus BXFM Instructions Manual，Main Dimension Diagram，Focusing Unit BXFM-F（第 23 页）。
- Evident 官方 BXFM 产品页与官方使用手册用于交叉核对产品用途和调焦规格。
- BXFM-F 是独立调焦模块，不等同于完整显微镜，也不意味着当前平台 A 的 A18 已确认是该型号。
- 当前没有取得原生 STEP / IGES；本次建立的是依据原厂四视图尺寸图的独立对照模型，不标记为 OEM CAD。

来源：
- [BXFM-F 原厂尺寸图手册（第 23 页）](https://arstek.ru/upload/medialibrary/documents/instruktsii-po-ekspluatatsii/olympus/BX-FM_GB_18.02.2010.pdf)
- [Evident 官方 BXFM 产品页](https://evidentscientific.com/zh/products/upright/bxfm)
- [Evident 官方 BXFM 使用手册](https://adobeassets.evidentscientific.com/content/dam/mis/bxfm/manuals/AX8562_07_BXFM_Inst_E.pdf)

## 2. 已从图纸/手册确认的参数

| 参数 | 厂商资料 |
|---|---:|
| 主体宽度 | 84 mm |
| 侧视主体高度 | 80 mm |
| 正视总包络高度 | 100 mm |
| 总深度 | 82 mm |
| 立柱安装孔 | Ø32H8（+0.039/0） |
| 后部安装孔 | 4-M8，深 8 mm |
| 后部辅助孔 | 4-M4，深 9 mm |
| 底部安装孔 | 4-M4，深 7 mm |
| 底部孔距 | 66.2 mm |
| Z 轴行程 | 30 mm |
| 粗调 | 36 mm/rev |
| 微调 | 0.2 mm/rev |
| 重量 | 1.9 kg |

## 3. 对照模型的几何边界

- 主体外廓按 84 × 80 × 82 mm 图纸尺寸构建；正视方向额外保留 100 mm 包络高度。
- 后部 4-M8 安装孔按图纸标注的 36 mm 水平间距建立示意孔位。
- 后部 4-M4 孔的孔位坐标没有完全映射，模型只保留示意布局。
- 底部 4-M4 孔按 66.2 mm 水平间距和图面边距关系布置；需原始矢量图/原生 CAD 再核。
- Ø32H8 立柱孔按标称孔径表示，但其相对 A10 立柱的位置尚未与实物照片配准。
- 前部光学孔径 28 mm、侧旋钮直径和旋钮外形不是图纸标注尺寸，均为视觉示意，不可作为加工尺寸。

## 4. 与当前平台 A 的关系

- 当前场景 A10 立柱直径候选为 Ø26 mm；BXFM-F 图纸的 Ø32H8 孔不能直接视为已完成配合，需要确认实际连接方式、夹紧件或转接套。
- BXFM-F 研究视图不自动连接 A10 横臂，也不与当前 A08、A19、A20 光学组件建立未经验证的装配关系。
- 研究视图不改变默认 A18/A19 照片拟合模型，不改变 BOM 的采购确认状态。
- FR5025CF 仍是优先结构候选；MGZ30 仍是条件候选；BXFM-F 保留为次候选，尚无证据确认实机型号。

**V155 的目的，是提供一套可与照片直接比较的厂商图纸约束结构，而不是宣称已经完成实机识别或制造级复原。**
