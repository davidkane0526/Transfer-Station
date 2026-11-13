# V154 · MGZ30 微调规格证据来源更正

日期：2026-11-13。

## 更正原因

V152 曾将“现行 Thorlabs 商品页与 2012 Rev C 工程图均标注 225 µm/rev”写入数据库。重新检查 Thorlabs 现行商品页后发现，该可访问页面列出产品型号、包装重量和 CAD 文档入口，但没有显示微调每转行程。因此不能将 225 µm/rev 归因于现行 Thorlabs 商品页。

## 证据分级

- Thorlabs 2012 Rev C 工程图：225 µm/rev。
- Volition 第三方 MGZ30 产品资料页：225 µm/rev。
- Thorlabs 2014 官方目录：250 µm/rev。
- Thorlabs 现行 MGZ30 商品页：未公布微调数值。

链接：
- [Thorlabs 现行商品页](https://www.thorlabs.com/thorproduct.cfm?partnumber=MGZ30)
- [2012 Rev C 工程图](https://oxxius.ru/upload/iblock/645/z5e9spl0ippo9o526roo4qt3zxyzg0bk/21618_E0W.pdf)
- [Volition 第三方资料页](https://www.govolition.com/product/V40-MGZ30)
- [Thorlabs 2014 官方目录](https://www.thorlabs.com/catalogpages/v21/1739.pdf)

## 修正后的数据处理

- 不再设置或展示“现行微调值 = 225 µm/rev”。
- 保留 Rev C 图纸值 225、Volition 第三方资料值 225、2014 官方目录值 250。
- fineAdjustmentOfficialCurrentPagePublishesValue = false。
- fineAdjustmentVersionResolved = false。
- 需取得 Thorlabs 对当前生产版本的书面确认后才能定值。
- 不修改默认 A18/A19 几何，也不把任何微调值用于模型尺寸约束。

**V154 更正 V152 的来源归属错误；V152 的原始提交记录保留，不覆盖历史。**
