# V132 · 平台 A 三处异常结构纠错

## 用户反馈

2026-11-11 用户针对当前 Platform A 渲染指出：

1. 平台 A 的“照片参考”可以不要；
2. 总览图中 G40/VC13/T25 区域方向和结构错误；
3. MWWHL4/照明区域存在异常悬浮结构；
4. GCM-T25M 区域存在错误/悬空旋钮。

## 实际代码根因

### 1. A04L 错误朝向

旧 V130/V131 将 A04L 下层摆角台的微分头建成局部 +Z / 正对观察者的端视结构，因此正面出现一个不应存在的大圆盘。

V132 改为：

- 上层已确认 GCM-G40M60L 保持局部 +X 侧置微分头；
- 下层 A04L 使用相反侧的局部 -X 侧置微分头；
- support → stem → drum 保持实体连续；
- WebGL 与 STEP 同步；
- STEP 碰撞/接口验证必须通过。

A04L 的精确 SKU 仍未确认；GCM-G40M40L 只保留为厂家配对候选。

### 2. A11 悬浮圆片

A11/MWWHL4 本体已经在 `src/app.js` 按 Ø30.5 × 60.1 mm 横向外壳建模，但 `src/details.js` 又额外沿错误轴向增加了两片装饰圆盘。这正是截图中的悬浮圆片。

V132 删除这两片重复实体，只保留附着在真实 A11 本体上的品牌装饰。A11 的真实发光面仍由主几何负责，不再由 details 层重复生成。

### 3. A15 第三只悬空旋钮

`makeStageBlock()` 已经为 A15 GCM-T25M2L 建立两套真实正交微分头：

- support
- spindle
- collar
- drum

但 `src/details.js` 又额外生成一套 X 向滚花头和一套 depth 向 barrel/cap，形成截图中脱离实体的“第三只旋钮”。

V132 对 A15/A02 禁止 details 层再生成 actuator 实体，只允许视觉贴图/铭牌。A15 必须保持：

- 2 个 handle；
- 2 个 stem；
- 2 个 collar；
- 2 个 support；
- 两条机械链均连续；
- 不存在第三个装饰微分头。

## Platform A 照片参考 UI

平台 A 的照片参考、94/95/97 对照和 2026-11-08 三视图按钮不再出现在用户工作界面。

相关 DOM/相机函数暂时保留为内部自动 QA 钩子，以便继续用历史实拍证据防止几何回退，但普通用户不可见。

## 新增专用真实渲染

V132 新增：

- `Transfer-Station-A-V132-A11-No-Ghost-Closeup.png`
- `Transfer-Station-A-V132-A15-No-Ghost-Closeup.png`

A11 近景必须确认真实灯体和电缆可见，同时无装饰悬浮圆片。

A15 近景必须确认两个正交微分头均可见，并且 support → spindle → collar → drum 连续，不存在第三只悬空旋钮。
