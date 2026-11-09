# V86 · 平台 A 的 A17 证据账本统一

## 1. 为什么需要 V86

V82 已经把 A17 收敛为“65 mm级磁吸底座 + 侧面磁力开关”，并将 CORZC PTDB65 作为外形/开关候选，同时明确禁止把被 A15 遮挡的顶面孔系直接复制到模型。

但仓库中较早的 V48 证据账本仍保留旧判断：把银色长槽、中央控制件和两颗前侧紧固件归给 A17，并把 A17 型号状态写成完全未知。该旧记录与照片194/195之后的层级辨认、WebGL模型和BOM发生冲突。

V86 的目标不是改变 A17 三维实体，而是把所有证据源统一成同一结论，防止后续厂商识别再次被过时账本污染。

## 2. 当前统一后的层级关系

照片194/195支持：

- **A15**：双轴 GCM-T25M，前侧有银色横向长槽/框架、中央控制位置以及两颗前侧紧固件；
- **A17**：位于 A15 下方的独立磁吸底座；
- A17 可见的操作特征是**侧面磁力开关**，而不是 A15 的银色长槽；
- 照片23四角沉孔属于 A15 顶板，不属于 A17；
- B平台照片31确认的 GCM-420302M 仍不得移植到 A17。

因此 V48 账本中的 `sideSlotVisible:true` / `frontKnurledControlVisible:true` 已撤销。

## 3. PTDB65 的证据等级

CORZC PTDB65 当前只作为 A17 的**外形/侧开关候选**：

- 候选外廓：65 × 65 × 20 mm；
- 候选特征：侧面 ON/OFF 磁力开关；
- 厂家资料中的磁力：32 kg；
- 厂家顶面孔系：1-M6、8-M4、4-M3，共13孔。

但 A17 实物顶面被 A15 遮挡，因此：

1. PTDB65 品牌/SKU 未确认；
2. 32 kg 磁力不作为实机参数；
3. 13孔只作为候选元数据；
4. WebGL/STEP 当前 A17 顶孔数继续为0；
5. `candidateHolePatternAppliedToModel=false`；
6. 侧面开关代理必须与磁座主体接触，禁止再次悬空。

## 4. V86 修改

### src/v48-ruler-registration.js

A17 证据字段更新为：

- `sideSlotVisibleOnA17=false`
- `silverSlotReassignedToA15=true`
- `frontKnurledControlVisibleOnA17=false`
- `lowerSideSwitchVisible=true`
- `modelCandidate='CORZC PTDB65'`
- `modelCandidateConfidence='envelope-and-side-switch-only'`
- `candidateEnvelopeMm=[65,65,20]`
- 候选13孔保留为元数据但 `candidateHolePatternAppliedToModel=false`

### src/photo-evidence.js

平台 A 的总证据说明同步写明 A15/A17 的层级归属，以及 PTDB65 仅为候选。

### src/app.js

照片证据面板、平台说明和安装链均改为：
`A01 → A17（PTDB65外形/侧开关候选） → A15 → A03 → A04L/A04 → A05`

不再显示“A17完全未知”或暗示银色长槽属于 A17。

## 5. 防倒退

自动测试要求：

- A17 不得重新出现银色长槽；
- A17 不得重新出现 A15 的前中央控制件；
- A17 侧开关必须存在；
- PTDB65 只能是候选；
- 顶面13孔不得应用到模型；
- B02/GCM-420302M 仍不得归到 A17。

V86 是证据一致性修复，不改变 V79–V85 已验证的机械装配关系。
