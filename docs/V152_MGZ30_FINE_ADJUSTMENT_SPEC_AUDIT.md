# V152 · MGZ30 微调规格来源审计（更正后）

日期：2026-11-13。

## 1. 可核验来源

| 资料 | 微调值 | 来源等级与处理 |
|---|---:|---|
| Thorlabs 2012 Rev C 工程图 | 225 µm/rev | Thorlabs 原厂图纸，标题栏标明 Rev C、2012-08-14 |
| Volition MGZ30 产品资料页 | 225 µm/rev | 第三方产品资料页，作为交叉核对，不等同于 Thorlabs 现行官方规格 |
| Thorlabs 2014 官方目录 | 250 µm/rev | Thorlabs 官方历史目录 |
| Thorlabs 现行 MGZ30 商品页 | 未公布 | 可访问页面列出产品、包装重量及 CAD 文档入口，但未显示微调数值 |

来源：
- [Thorlabs MGZ30 现行商品页](https://www.thorlabs.com/thorproduct.cfm?partnumber=MGZ30)
- [Thorlabs 2012 Rev C 工程图](https://oxxius.ru/upload/iblock/645/z5e9spl0ippo9o526roo4qt3zxyzg0bk/21618_E0W.pdf)
- [Volition MGZ30 产品资料页](https://www.govolition.com/product/V40-MGZ30)
- [Thorlabs 2014 官方目录](https://www.thorlabs.com/catalogpages/v21/1739.pdf)

## 2. 当前结论

**MGZ30 微调规格的现行值尚未核定。**

2012 Rev C 工程图与 Volition 第三方资料页均列出 225 µm/rev；2014 Thorlabs 官方目录列出 250 µm/rev。Thorlabs 现行商品页没有公布微调数值，因此不能据其商品页认定 225 µm/rev 为现行规格，也不能把 250 µm/rev 直接判定为过时规格。

当前不推测差异原因，不取平均值，不在模型中指定单一现行值。

## 3. 数据结构处理

- fineAdjustmentRevCUmPerRev = 225
- fineAdjustmentVolitionListingUmPerRev = 225
- fineAdjustment2014CatalogUmPerRev = 250
- fineAdjustmentOfficialCurrentPagePublishesValue = false
- fineAdjustmentVersionResolved = false

候选数据、A18 说明、BOM 备注和自动化探针均保留上述来源及未决状态。任何一项都不作为默认装配的几何约束。

## 4. 后续核实方式

需由 Thorlabs 针对 MGZ30 当前生产版本确认微调每转行程，并说明 2012 Rev C 图纸与 2014 目录数值差异。未取得厂商确认前，保持规格未决。

**本审计只修正来源归属，不改变 A18/A19 默认几何。**
