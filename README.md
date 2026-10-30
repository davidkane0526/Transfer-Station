# Transfer Station · 干法转移平台工程复原

两套二维材料干法转移平台的**可交互三维装配与逆向工程项目**。含显微镜/相机、载玻片移动臂、样品平移/旋转台、嵌入式陶瓷加热真空吸附台及光学面包板。

## 浏览三维模型
- 打开仓库根目录的 `index.html`（需网络加载 Three.js），建议通过 GitHub Pages 访问。
- GitHub Pages（启用后）：https://davidkane0526.github.io/Transfer-Station/
- 鼠标左键旋转、右键平移、滚轮缩放；可切换平台 A / B、装配/爆炸、零件显示、孔位、尺寸和样品/玻片移动量。
- 点击三维零件可查看型号、主要尺寸、接口及**证据等级**。

## 重要：真实尺寸 ≠ 真实 CAD
- **D（drawing）**：来源于原厂规格/机械图的标称尺寸或孔距。
- **P（photo）**：照片铭牌与外观确证的型号/结构。
- **U（user）**：实物使用者确认的装配方式。
- **I（inferred）**：根据已知接口约束推断。
- **C（candidate）**：工程候选几何，供碰撞检查/设计讨论，**不是厂家模型或可加工图纸**。

特别注意：
- 平台 B 的 **GCM-1107M Ø94×33.2 mm**、**NFP-1462C 65×65×23 mm** 及部分孔系有厂家资料支持；本项目的光机外轮廓仍可能是**几何代理**，不是厂家原生 3D CAD。
- 用户确认的加热台：**顶面一个中心吸附孔**；底部掏腔嵌入厚陶瓷加热块；探头压在加热块上方；约 10 mm 白色无机隔热层；**顶部四枚齐平螺钉固定到 NFP**；无独立过渡板；NFP 下方有 GCM-1107M 旋转台。
- 65×65×12 mm 金属吸附块、42×42×5 mm 陶瓷块、M6×25 螺钉、公称 50×50 mm 安装孔距等，除有来源明示之处，均为**候选参数**。
- 不得把这些候选模型直接用于 CNC 加工、采购定版、200°C 电气接线或人员安全决策。

## 项目结构
```
index.html              Web 交互入口
src/app.js              Three.js 装配交互和程序化几何
src/parts.js            两平台零件BOM、尺寸/证据状态
src/styles.css          界面样式
cad/build_assemblies.py 使用 CadQuery 生成可拆分 STEP 的脚本
docs/engineering.md     结构、坐标系、孔位、计算假设及待核查问题
```

## CAD 生成
```bash
pip install cadquery
python cad/build_assemblies.py
```
生成文件位于 `build/`。网页 3D 使用与 CAD 相同的主尺寸基准，但对不明确的光学系统使用外形近似。两者都明确显示候选状态，不能替代厂家制造图。

## 证据和来源
原始用户照片/视频不随公开仓库发布。证据文件名如 `108.jpg`、`109.jpg`、`110.jpg`、`114.jpg` 对应用户原始压缩包。详见 `docs/engineering.md`。如准备公开原始证据，请先检查个人信息和实验室保密要求。

原厂参考： [Zolix NFP-1462C](https://www.zolix-group.com/product/specification/179.html)、[Daheng GCM 目录](https://elektronik.tamser.com.tr/CDHC_catalog_VIII.pdf)。报价仅作为历史参考，不代表当前销售价格。
