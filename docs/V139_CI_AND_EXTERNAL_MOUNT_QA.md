# V139 · 平台 A 控制器、泵及网页构建阻塞复核

## 实际阻塞根因（2026-11-11）
GitHub `main` 在 V138 源码之后出现多个失败：
1. `tests/photo-assembly.mjs` 的旧照片方向假设仍对 A02 X 轴要求 `-X`，而用户明确更正为 `+X`；现源码与测试已经统一 `+X`，不回退。
2. `.github/workflows/pages.yml` 用强制 `apt-get update/install fonts-noto-cjk`，GitHub 运行器无法解析 security.ubuntu.com 导致 CI 停在字体下载。字体安装属截图增强，不应阻断机械/几何验收；改为仅在缺 CJK 字体时限时尝试，失败记录警告。
3. STEP 的 `cad/validate_interfaces.py` 从 V133 遗留断言要求 A12（LEDD1B 主机）直接接地。但 V138 已按控制器结构增加 A12F 安装底板，A12 主机底面在3mm，正好贴合 A12F 顶面。新的验收检查支撑接触、零实体交叉、独立地面支撑，以及 A13 SSR、A30泵底座和A33温控箱底板均为0mm地面。

## 保留的机械需求
A02 X测微头在右（+X）、Y测微头在前（+Z）；A06只能有短锁柄。V138新增A30泵体候选、A33温控箱与A10/A18显微镜连接仍作为候选结构，不能据外形代理做实物型号结论。平台B零件拓扑不变。

## 验证
在容器中运行独立的 CadQuery 实体样例：A12底板与主机无实体穿模且接触、A13/A30/A33各自接地，均通过；源项目中 `tests/test_a139_external_mounts.py` 重复这一验证。完整 STEP `cad/build_assemblies.py` + `cad/validate_interfaces.py` 和真实浏览器回归仍必须由完整CI分别验证，并以成功发布为验收依据。
