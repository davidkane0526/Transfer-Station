# V133 · 平台 A 优先级 04：照明安装与加热测温连接

日期：2026-11-11

## 需求与任务边界
用户在比较 A/B 后要求**记录全部机械缺口，并立刻完成排序第 04 项**：照明与加热控制实体连接，包含 LED 支架、供电线束、加热引线、测温传感器以及控制端终点。其余 P01/P02/P03/P05 排入同日的 `V133_A_AUDIT_AND_PRIORITY_04.md` 问题账本。

### V133 已建模的候选实体

| 编号 | 位置 | WebGL/STEP 实施 | 证据边界 |
|---|---|---|---|
| A21 | LED机械支撑 | 独立底脚、四个真实候选贯孔、四个锚固螺钉、固定立柱、滑动安装套、刚性横杆和 SM1RC 兼容安装环 | **只有 MWWHL4 与 SM1RC 可组合有厂商资料；真实支架/底脚不是已识别 OEM** |
| A22 | LED电缆 | A11 灯体既有尾线至 A12 LEDD1B 背面 LED 接口连续柔性线束，灯头随假设的光学停车升降而改变走线 | LEDD1B 支持 M8×1 四针 LED 接口；极性和确切引线未知 |
| A07 后侧 | 加热与传感引出口 | 两个加热功率线端、一个独立测温端，共三个外置空心绝缘护套/应力释放圈 | 不代表已确认钻孔或具体内置热源 |
| A23 | 两根加热功率线 | 各自从 A07 后缘出线，沿分开的候选柔性路径至 A13 后侧服务接线区域 | A13 仅被识别为固态继电器，不冒充电源或温控器 |
| A24 | 测温反馈 | 独立于功率线束，A07 后缘至 A25 独立服务接口 | 不指定热电偶类型，不照搬 B 平台的 K 型假设 |
| A25 | 未识别测温控制端接口 | 小型外置端子代理，使 A24 不会凭空悬空 | **不是已确认安装的控制器，不能代表闭环控温系统** |

## 结构和运动关键约束
- 坐标：WebGL `Y` 为高度、`Z` 为前后；STEP `Z` 为高度、`Y` 为前后。所有候选尺寸单位为 mm。
- A21 的底脚中心世界 X=187.5、Z=−87.5，36×36 mm，四个候选锚孔位于 X=(175, 200)、Z=(−100, −75)，与**模型中候选** 25 mm 面包板阵列配准。实际 A01 孔径、螺纹和锚固强度未验收。
- A21 底脚/立柱固定；其上方滑动套、横杆和 LED 安装环与 A11 一起随假定的 18 mm 光学停车位移同步，但不可当成真实调焦行程。
- A22 的灯尾起点随 A11 升降，LEDD1B 端固定；A23/A24 热台端随 A02 单轴样品平移及 A06 旋转，服务端固定。改变姿态时重新计算柔性几何，不直接刚体平移整根线束。
- A12、A13 处于面包板外侧，其底面在世界 Y=0，以免两台外设无支撑地漂浮在 Y=20。
- A07 三个线束端自后侧 −Z 引出；功率线与测温线独立显示，**不连接任何真空泵，不向 A07 虚构平台 B 的真空吸附孔**。
- STEP 导出静态基准姿态；网页运动姿态不被错误写成已验证的动态 STEP。

## 代码与回归
- `src/a-control-interfaces.js`：线束端点、随动位姿、错误输入拒绝、工程未确认标志与运动拓扑 QA。
- `src/app.js`：A21–A25 几何、A07/A12/A13 实体端口、可随动线束和 `window.__modelAControlInterfaceProbe`。
- `src/parts.js`：五个新 BOM 项，所有新零件明确候选与厂家证据等级。
- `src/assembly-mounts.js`、`src/photo-evidence.js`：记录新模块装配/证据关系。
- `tests/a-control-interfaces.mjs`：LED/加热/测温各自端点、样品 X/yaw、光学 18mm 位移、越界拒绝。
- `tests/model-b-visible-smoke.mjs`：真实网页场景中固定立柱/单安装环/四颗锚头、背面端口、双功率线、单反馈线与动态位置断言，并生成 `Transfer-Station-A-V133-Control-Routes.png`。
- `cad/build_assemblies.py`：静态 STEP 版本升为 V133，加入 A21 安装结构、A07 背侧线束护套、A12 LED端子壳、A13服务口、A22/A23/A24线束与 A25 接口。
- `cad/validate_interfaces.py`：新增 STEP 完整性、底脚高度、独立线束及外设落地校验。
- `.github/workflows/pages.yml`、`build-cad.yml`：自动测试、截图证据和 V133 STEP 工件。

## 不可声称“已完成真实电气接线”
尚未获得：A07内部加热元件额定功率/供电电压、温度传感器类型与安装方式、真正的温控器型号、A13输入/负载端子定义、A12与A11实物线束长度和极性，以及 A21支架真实安装照片。**V133 完成的是可检验的外部机械支撑及物理线束候选链；不是接通电源即可运行的安全电气图**。这些缺证不能通过在模型中虚构设备来消除。

## 厂商资料
- [Thorlabs MWWHL4](https://www.thorlabs.com/item.cfm?partnumber=MWWHL4) 与 Mounted LEDs 产品材料展示 SM1RC 滑环安装方式。
- [Thorlabs LEDD1B 说明书](https://www.manualslib.com/manual/3021078/Thorlabs-Ledd1b.html)：LED 输出口为 M8×1 四针接口，实际 LED 导线仅使用 1、2 两脚；本项目不据此指定未知线束的正负极。
- A13 的具体开关/电源电路必须由实物电气原理图确认。


## 2026-11-11 本轮实际验证结果
- 已在当前会话读取 GitHub 上的完整 `src/app.js` / `src/a-control-interfaces.js` / `src/parts.js` / `src/assembly-mounts.js` / `src/photo-evidence.js`，剔除静态 ES import/export 声明后交给 V8 JavaScript 语法解析：**均通过语法解析**。
- 已实际在 V8 中执行 `aControlRoutes()`、`aControlRoutes({sampleShiftMm:4})`、`aControlRoutes({opticalLiftMm:18})` 与 `auditAControlRoutes()`：加热/测温线前端 X 位移均为 4 mm，LED 前端随光学升高 18 mm，各终端坐标不变，路径 QA 为通过，`fullElectricalAcceptance=false`。
- 为避免几何与元数据脱节，后续补充了真实 WebGL 网格级钩子：从 `TubeGeometry.parameters.path.points` 读取四条线束各自的**实际渲染端点**，并检查 A21 安装环是否与 A11 灯体同轴、A21 底脚是否贴合面包板、A07/A12/A13/A25 实体接口与电缆起/终点间隙。Playwright 测试已同步增加约束。
- 修正 V132 遗留的 `__modelADetailMountProbe`：安装环从原本 A11 灯头装饰子件改由 A21 的真正支撑组件检索，杜绝无故新增装饰悬浮环。
- **尚未执行或取得确认：** 完整 GitHub Actions Playwright 浏览器回归、CadQuery STEP 构建及 `cad/validate_interfaces.py` 物理干涉审计。目前不能声称这些构建全部通过，更不能声称电气回路达到真实接线安全要求。
