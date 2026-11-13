# V151 · MGZ30 CAD 来源与验证状态

日期：2026-11-12。

## 1. CAD 来源

Volition 的 MGZ30 产品资料页在 “CAD Drawings & Models” 栏列出以下格式：
- AutoCAD DXF
- SolidWorks
- STEP

链接：[Volition MGZ30 产品与 CAD 下载入口](https://www.govolition.com/product/V40-MGZ30)

页面同时标明制造商为 Thorlabs、型号为 MGZ30。该页面属于第三方产品平台，不是 Thorlabs 官方托管下载页。

## 2. 当前验证状态

- 已确认网页列出上述 CAD 文件格式。
- 尚未下载具体 CAD 文件。
- 尚未检查文件的来源元数据、版本、完整零件树、五物镜转换盘、后部立柱夹持结构及与 Thorlabs 2012 Rev C 工程图的一致性。
- 因此目前不能把该下载入口等同于已取得或已验证的原厂 STEP。

## 3. 对模型工作的约束

MGZ30 仍然只是条件候选。其 Ø1.5in（38.1mm）立柱接口与当前照片拟合中的 Ø26mm 立柱存在明显差异。即使后续取得 STEP，也必须先核对实机立柱直径、A10/A18 后壳分缝和五孔转盘结构，不能直接替换默认装配。

FR5025CF 仍为高优先级结构候选，但当前只有产品页与产品图/规格 PDF，没有找到可直接下载的原生 STEP 或完整尺寸工程图。

**V151 只增加 CAD 下载来源和验证状态，不修改任何默认几何。**


## V152 补充：微调规格版本复核

- 现行 Thorlabs MGZ30 产品页：225 µm/rev。
- 2012 Rev C 工程图：225 µm/rev。
- 2014 官方目录：250 µm/rev。
- Volition 产品资料页：225 µm/rev。
- 当前候选数据以 225 µm/rev 作为现行规格参考；250 µm/rev 只保留为历史目录差异，不将其混入现行参数。
- [V152 微调规格审计记录](V152_MGZ30_FINE_ADJUSTMENT_SPEC_AUDIT.md)
