# V146 · A18 MGZ30 厂商族拓扑对照

日期：2026-11-12。

## 官方资料确认的特征

Thorlabs 官方目录明确说明：**每一台 Post-Mountable Focus Block（包括 MGZ30）本体均包含五物镜转换盘**，五个接口采用 M26×36 TPI，并随附五个 RMS 转接件。MGZ30 另有 30 mm Z 行程、粗调 40 mm/rev、2014 目录微调 250 µm/rev、Ø1.5 in（38.1 mm）立柱安装，上方 dovetail adapter 兼容 30 mm cage、SM1 和 SM2。完整 T-Scope 是独立系统，配套管镜为 ITL200；当前 A08 按 TTL200-A 建模，因此不能将现有整套光学组件认定为完整 T-Scope。

资料来源：
- https://www.thorlabs.com/focus-block-and-accessories
- https://www.thorlabs.com/catalogpages/v21/1739.pdf
- https://www.thorlabs.com/catalogpages/v21/1738.pdf

## 本轮修改

- 增加用户可见的“MGZ30候选对照”入口，允许在默认照片拟合 A18 与直接立柱安装拓扑之间切换。
- 对照组补充左右两侧粗/微调旋钮、上盖四枚螺钉、整体后桥和直接立柱夹环。
- 保留 Ø38.1 mm 夹环孔径与当前估计 Ø26 mm 立柱之间 12.1 mm 的直径差，不通过修改柱径掩盖接口冲突。
- **纠正此前错误归属**：五物镜转换盘是 MGZ30 单独调焦块本体的厂商确认配置，不是 T-Scope 专属。当前研究网格尚未重建五孔盘的精确载体、孔圆和转接件几何，因此该研究网格仍不属于原厂 CAD 复刻。默认照片拟合模型继续只绘制照片中可辨的两支物镜；这不代表已证明实机只有两个物镜孔。

## 证据边界

MGZ30 仍是候选型号，不是已确认实机。对照视图用于暴露其与现有装配的接口冲突，不代表原厂 CAD 的完整复刻。A18MGZ 仍为独立未安装研究零件，不进入平台 A 默认装配和正式 BOM 采购认定。
