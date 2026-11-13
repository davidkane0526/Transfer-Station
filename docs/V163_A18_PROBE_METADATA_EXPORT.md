# V163 · A18 调焦尺寸审计字段补全

## 问题

V161 的真实网格表面射线检测通过了 A18 粗调轮可见性检查。后续回归在 `tests/model-b-visible-smoke.mjs` 第 1628 行失败，实际值为 `undefined`，预期值为 28。

检查发现，模型组 `A18.userData` 已保存：
- `A18CoarseKnobDiameterCandidateMm = 28`
- `A18FineKnobDiameterCandidateMm = 16`
- `A18KnobDimensionsMeasured = false`

但 `window.__modelADetailMountProbe` 返回对象未映射这三个字段，导致回归无法读取。

## 修改

在探针返回对象中直接映射三个既有模型字段。没有改变旋钮尺寸、几何位置、候选/实测状态，也没有放宽测试断言。

## 验收

原有断言继续检查：
- 粗调轮候选直径为 28 mm；
- 微调轮候选直径为 16 mm；
- 尺寸尚未实测。

A18 型号识别仍未完成，候选尺寸不可用于制造。
