# Transfer Station · 二维材料干法转移平台工程复原（V17）

基于两套实物平台照片/视频、厂家手册与经使用者确认的装配结构，持续复原显微镜、载玻片移动臂、样品平移/旋转台、真空陶瓷加热台、光学面包板、LED驱动与温控气路。**V17 是图纸/照片约束下的交互工程数字样机，并非所有部件均为厂家原生 CAD。**

## 在线使用

启用 GitHub Pages 后访问 https://davidkane0526.github.io/Transfer-Station/ 。当前仓库是否已经开启 Pages，可检查 [Actions](https://github.com/davidkane0526/Transfer-Station/actions)。

未开启 Pages 时，可从 Actions 的 **Transfer-Station-Interactive-Viewer** artifact 下载网页包；在本地目录执行：

```bash
python -m http.server 8765
```

然后打开 `http://localhost:8765`，依赖联网加载 Three.js。不能直接双击 index.html 在 `file://` 下打开，因为 ES Modules 与浏览器 CORS 限制可能阻止加载。

## V17 相对 V16 的重点修改

- **模型真实性**：细化阳极氧化台、微分头滚花、交叉导轨、旋转刻度、M6 沉孔、Zolix 夹具、双横杆、显微镜物镜转盘、调焦旋钮、LED 驱动面板与控制箱。照片能支持的形状优先；不可测内部结构标记候选。
- **标签遮挡**：初始化不显示任何浮动标签，只有**单击部件时**才显示当前选中零件标签；可通过“仅选中标签”切换彻底关闭；再点背景取消选择。
- **选中尺寸**：选中后显示该零件在交互场景中的包络尺寸；它不等于厂家的尺寸公差。可以切换关闭。
- **机构自由度**：爆炸、玻片平移、样品平移与旋转独立调节；平移台上部移动块与固定底座按运动关系分离。
- **照片复核纠错**：B 套补充 D1000 LED adapter（100–240 VAC / DC 0–3.4 V、0–400 mA）、未知电气辅助模块；A 套的 GCM-T25M **改到旋转台上方**，不再放到无关的左侧机构。
- **采购 BOM**：增加数量、原厂型号、材料、尺寸、等级、单价、日期、价格来源 URL、原厂图纸、原厂 CAD 链接、候选替代厂商；支持搜索、筛选公开价、排序及 CSV 导出。
- **价格统计**：分别计算 TWD/USD/SGD 的已知小计，并显示缺价行数；历史公开价不当作 2026 年实际采购价。
- **质量检查**：浏览器自动检查场景加载、A/B 切换、零件选取、标签/尺寸显示、BOM筛选与排序；CadQuery 工作流检查 STEP 可重新导入。

## 交互使用

1. 默认打开 **B 套**。左栏 A/B 切换。
2. 左键旋转视图、右键平移、滚轮缩放；选择轴测/俯视/正视。
3. 单击零件查看其右侧材料、型号、尺寸来源和采购/图纸链接。选中时显示一个局部标签及包络尺寸；点空白可清除。
4. 用分组复选框隐藏显微镜、载玻片移动臂、样品台、外部电源等；外部设备默认隐藏，保持机械装配视野。
5. 点击“零件 BOM / 证据”可排序、按价格过滤、查询供应商与产品型号。CSV 包括所有材料价格与来源链接。

## 项目文件

```
index.html                    前端入口
src/app.js                    Three.js 主装配、运动约束、选择和 BOM
src/details.js                写实细节模型、PBR 材质、刻度、滚花、金属印字
src/parts.js                  两套平台的部件与证据等级
src/procurement.js            公开报价、替代供应商、来源网址、汇总
src/styles.css                响应式页面
cad/build_assemblies.py       可拆分 STEP 生成脚本（以 mm 为单位）
docs/engineering.md           机械基准、孔位与碰撞风险
docs/forensics-v17.md         对原照片/视频逐项核对
tests/smoke.mjs               Playwright 浏览器交互测试
.github/workflows/            STEP 构建、UI测试与 GitHub Pages 部署
```

## 三维尺寸证据分类

- **D**：厂家机械图和产品规格 *中的某些标称尺寸* 已验证，但当前外轮廓可能仍是简化形状。
- **P**：照片铭牌或直接可见结构已验证；不能据此说内部尺寸已验证。
- **U**：使用者确认的实物关系，如四角齐平螺钉、中心吸附孔、底面预挖槽、白色隔热板和无过渡板。
- **I**：通过已知孔距推导，如 50 mm 方孔距与 M6 安装候选。
- **C**：外观/连接位置候选，不能直接加工、接线或采购。

**对于关键件**：
- NFP-1462C 官方有 [2D机械图](https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.pdf) 和 [3D CAD 包](https://www.zolix-group.com/public/storage/upload/files/Motioncontrol3D/NFP-1462C.rar)，请按厂商许可使用。
- GCM-1107M 的 Ø94×33.2 mm 标称尺寸与 M6/固定沉孔来自 [Daheng 光机目录](https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf)。
- 自制加热块尺寸 **38×38×5 mm** / 凹腔 **38.6×38.6×5.4 mm** 是因原来 42.6 mm 方腔可能与四角 Ø11 沉孔干涉而提出的安全净距候选，**不是原设备实测尺寸**。
- 图片 110 中能读出的一支物镜为 10×/NA0.15/DIC/WD10.8；另一支有 OptoSigma 品牌，尚未完全识别具体型号。
- **LED D1000**（图片115）与 **Mean Well SE-600-48**（图片117）为两个不同电源，勿混接。

## 使用真正的原厂 STEP/IGES 替换代理模型

现有网页提供 **“为选中零件导入 STL / GLB”**：可以把厂家的机械 CAD 网格导入本地浏览器，从而显著提高该单件的外形准确度。导入前先点击目标零件，选择文件尺寸单位为 mm 或 m。导入不会上传服务器，也不会改写仓库。

厂家如果提供 STEP/IGES 而不是 STL，可以在本地安装 CadQuery 后执行：

```bash
pip install cadquery
python cad/convert_vendor_step_to_stl.py ./manufacturer_nfp.step ./nfp_for_viewer.stl
```

然后在交互网页中点选 NFP-1462C，选择 `nfp_for_viewer.stl`。**注意：网页在导入时居中和底面归零，不会自动知道原厂坐标基准与机台的装配变换；真实孔位对齐仍需由CAD原始坐标与安装变换复核。** 原厂 CAD 权利归属厂商，请勿未经许可公开转载。

## 发布和保密

仓库公开，故不把用户原始 88MB ZIP 中的全部照片、视频公开上传；照片编号与所见信息在 `docs/forensics-v17.md` 留有证据索引。凡是电气连接、200°C 加热、真空密封、螺钉受力和光学工作距离，必须在实际设备上复测并完成安全审查。

**图纸/价格资料**：见网页采购表。价格未做跨币种求和，替代品牌仅为可询价的功能候选，不保证孔距、法兰、负载或电气参数直接兼容。
