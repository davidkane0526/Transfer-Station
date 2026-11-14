# V165 · 完整项目源码快照

## 已查实的问题

V164 的 Viewer artifact 虽然包含 `src/`、`cad/`、`tests/`、`assets/` 和文档，但上传清单中没有 `.github/workflows/` 和 `.gitignore`。用户希望下一次通过 ZIP 在独立云环境继续开发，缺少工作流会丢失原有自动测试、STEP 构建及 Pages 发布方式。

## 修复

在 Pages 工作流验证成功之后执行 `git archive HEAD`，直接打包当前 `main` 提交所追踪的文件。再检查 16 个关键文件、成员重复、CRC 和输出目录污染，并生成 `SHA-256` 文件。产物名为 `Transfer-Station-Complete-Source`；原 `Transfer-Station-Interactive-Viewer` 仍保留供网页预览。

同步网页和 CAD 修订号至 V165。CAD 模型几何在本次没有改变，修订号用于表明交付基线一致，并确保自动生成最新 STEP。

## 范围边界

源代码快照包含 CAD 生成器和检测工具；STEP 成品仍由独立 Generate editable STEP 工作流输出。不能将厂商候选尺寸视为实物已验证尺寸。

A18 显微镜的厂商身份以及 A10/A18 后支撑是否属于同一产品尚未证实。新源码包用于保留所有工程证据和能力，而不冒充已完成机械验收。
