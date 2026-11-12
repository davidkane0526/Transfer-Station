# V146 · A18 MGZ30 厂商族拓扑对照

日期：2026-11-12。

## 官方资料确认的特征

Thorlabs 官方目录列出 MGZ30 手动调焦块具有 30 mm Z 行程、粗调 40 mm/rev、微调 250 µm/rev、Ø1.5 in 立柱安装，以及 M26×36 TPI 物镜转接接口；上方 dovetail adapter 兼容 30 mm cage、SM1 和 SM2 系统。五物镜转换盘属于完整 T-Scope 系统，其配套管镜为 ITL200。当前 A08 按 TTL200-A 建模，因此不能将当前整套光学组件认定为完整 T-Scope。

资料来源：
- https://www.thorlabs.com/focus-block-and-accessories
- https://www.thorlabs.com/catalogpages/v21/1739.pdf
- https://www.thorlabs.com/catalogpages/v21/1738.pdf

## 本轮修改

- 增加用户可见的“MGZ30候选对照”入口，允许在默认照片拟合 A18 与直接立柱安装拓扑之间切换。
- 对照组补充左右两侧粗/微调旋钮、上盖四枚螺钉、整体后桥和直接立柱夹环。
- 保留 Ø38.1 mm 夹环孔径与当前估计 Ø26 mm 立柱之间 12.1 mm 的直径差，不通过修改柱径掩盖接口冲突。
- 五物镜转换盘是完整 T-Scope 系统的厂商确认特征，不等同于 MGZ30 单独调焦块的已确认配置。由于当前 A08 为 TTL200-A 而 T-Scope 配套为 ITL200，且现有照片拟合仅支持两支可见物镜，本版不在照片拟合模型中补造五孔盘。

## 证据边界

MGZ30 仍是候选型号，不是已确认实机。对照视图用于暴露其与现有装配的接口冲突，不代表原厂 CAD 的完整复刻。A18MGZ 仍为独立未安装研究零件，不进入平台 A 默认装配和正式 BOM 采购认定。
