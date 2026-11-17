# V197 · A18 照片拟合尺寸探针补全

日期：2026-11-17。

## V196 回归结果

- JavaScript 语法检查通过。
- A18 光学近景的真实表面可见性检查通过，并生成 V106 光学近景截图。
- 后续模型细节检查在 1734 行失败，原因是探针没有输出 A18 侧筒外径候选字段，测试读取到 undefined。

## V197 修改

将已经保存在 A18 组件 userData 中的以下字段加入 modelADetailMountProbe：

- A18SideOpticalPortMainOuterDiameterCandidateMm
- A18SideOpticalPortGripOuterDiameterCandidateMm
- A18SideOpticalPortDimensionsMeasured
- A18FrontFocusDialDiameterCandidateMm
- A18FrontFocusDialDiameterMeasured

本次仅修复数据探针与测试之间的字段缺失，不改变模型几何。候选尺寸仍明确标记为未实测。

## 左右方向

V194/V195 的 STEP 坐标镜像与左右几何验收保持不变；WebGL 正面仍为相机 +Z、屏幕右侧 +X。V197 不改变侧筒、线缆、刻度盘和调焦轮的物理左右位置。

