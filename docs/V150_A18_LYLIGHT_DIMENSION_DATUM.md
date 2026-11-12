# V150 · FR5025CF 尺寸基准复核

日期：2026-11-12。

## 1. 原厂图面中的两项尺寸

LYLIGHT FR5025CF 厂商 PDF 同时展示产品结构图和完整支架示意：

- 产品结构图标注“中心距离 165mm”。
- 完整支架示意另标注 135mm。
- 产品资料还标注 Ø25mm 立柱孔、Ø50mm 镜体接口和 0.02mm 微调精度。

来源：
- [FR5025CF 厂商产品页](https://www.lylight.com/product/coarse-and-fine-focus-mount-50mm25mm-with-fine-adjustment-focusing-knob/)
- [FR5025CF 厂商产品图/规格 PDF](https://www.lylight.com/wp-content/uploads/2024/05/FR5025CF-coarse-and-fine-adjustment-focus-rack-LYLIGHT.pdf)

## 2. 尺寸解释约束

PDF 没有充分说明 165mm 与 135mm 两条尺寸线的起止基准。不得：
1. 将 165mm 直接解释为当前立柱中心至光轴距离。
2. 将 135mm 与 165mm 当作同一尺寸或相互替代。
3. 将任何一项直接写入默认模型的几何约束。

当前数据结构分别保存：
- centerDistanceMm: 165，仅代表产品结构图中的厂家标注。
- assemblyViewDimensionMm: 135，仅代表完整支架示意中的另一项标注。
- 两项 datum 字段均注明端点基准未在公开图面中明确。

## 3. 对 A10/A18 的影响

FR5025CF 仍是一体式 E-arm 的高优先级结构候选。它可能意味着 A10 横臂与 A18 调焦架属于同一组件，但这一点仍需高清实物分缝和安装接口确认。

当前照片拟合中的 Ø26mm 立柱、112mm 立柱至光轴距离和 A10/A18 后壳分界均未实测。FR5025CF 的 Ø25mm 立柱孔只能作为候选规格，不能因尺寸接近就确认型号。

MGZ30 仍是条件候选：其 Ø1.5in（38.1mm）立柱安装规格与当前 Ø26mm 场景柱径存在 12.1mm 差异。其五物镜转换盘为厂商确认配置，但研究网格尚未完成五孔载体和适配器的精确重建。

## 4. 当前模型决定

- 不修改默认 A10/A18 装配几何。
- 不将 165mm 或 135mm 写入默认模型约束。
- A10 横臂继续标记为边界未闭合，不单独采购或加工。
- FR5025CF、FR7625CF、MGZ30、BXFM-F 与 Boli 型号继续作为候选比较，不宣称任何一个已确认。

下一步只在获得明确尺寸基准或高清接口证据后，才更新实际装配模型。


## V151 补充：MGZ30 CAD 下载入口

Volition 的 MGZ30 产品资料页在 CAD Drawings & Models 栏列出 AutoCAD DXF、SolidWorks 和 STEP 格式。入口：
- [Volition MGZ30 CAD 下载页](https://www.govolition.com/product/V40-MGZ30)

该页面属于第三方产品平台，不是 Thorlabs 官方托管下载页。当前只确认其页面列出了这些文件格式，尚未下载具体文件，也未核对文件元数据、零件结构和 2012 Rev C 工程图的一致性。因此不能把它描述为已取得或已验证的原厂 STEP。
