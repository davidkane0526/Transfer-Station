# Transfer Station：Cloudflare D1 云端数据库配置

## 架构

- 静态三维网页继续由 GitHub Pages 托管。
- worker/index.mjs 是云端 API，部署为 https://transfer-station-api.dk-weather.workers.dev。
- worker/schema.sql 在 Cloudflare D1 中建立零件版本表和本机历史迁移表。
- 公开读取零件记录；新增、修改、人工确认和本机数据迁移必须携带写入密钥。
- 浏览器密钥保存在当前浏览器的 localStorage。其他电脑需要输入同一密钥。不要将密钥写入网页源码或公开仓库。

## 一次性配置

### 1. 创建 Cloudflare API Token

在 Cloudflare Dashboard 打开 My Profile → API Tokens → Create Token → Custom token。只授予部署所需权限，并将 Account Resources 限定到部署此 Worker 的账号：

- Account / Workers Scripts / Edit
- Account / D1 / Edit
- Account / Account Settings / Read（若当前账号的 Wrangler/API 查询要求）

创建后复制 Token。不要把 Token 发到聊天或提交到 GitHub 文件。

### 2. 获取 Account ID

在 Cloudflare Dashboard 选择账号，在 Overview 页面复制 Account ID。它应为 32 位十六进制字符串。

### 3. 生成独立写入密钥

在 Windows PowerShell 运行以下命令，生成 256-bit 随机密钥：

    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $TRANSFER_STATION_WRITE_TOKEN = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    $TRANSFER_STATION_WRITE_TOKEN

将生成值保存在密码管理器中。它既要作为 GitHub Actions Secret，也要在每台需要编辑的浏览器中输入。

### 4. 添加 GitHub Actions Secrets

打开仓库 Settings → Secrets and variables → Actions → New repository secret，添加：

| Secret 名称 | 内容 |
|---|---|
| CLOUDFLARE_API_TOKEN | 上一步创建的 Cloudflare API Token |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare Account ID |
| TRANSFER_STATION_WRITE_TOKEN | 生成的 64 位十六进制写入密钥 |

不要把这三个值放入仓库文件、Issue 或公开日志。

### 5. 部署

保存 Secrets 后，在 GitHub 仓库 Actions → Deploy Transfer Station Cloud Database API → Run workflow 手动运行。工作流会：

1. 创建或复用 D1 数据库 transfer-station-records。
2. 应用 worker/schema.sql。
3. 部署 transfer-station-api Worker。
4. 将写入密钥作为 Worker Secret WRITE_TOKEN 配置。
5. 检查 /api/health 是否返回数据库就绪。

工作流未检测到三个 Secrets 时会安全跳过，不影响 GitHub Pages 的三维页面部署。

## 首次迁移本机数据

1. 打开 GitHub Pages，选择任意零件。
2. 展开右侧“云端数据库与同步”。
3. 输入 TRANSFER_STATION_WRITE_TOKEN，点击“保存密钥”，再点击“验证密钥”。
4. 如果显示本机有未同步记录，先点击“导出本机备份”保存 JSON 文件。
5. 点击“迁移本机修改到云端”。只有服务器确认接收后，浏览器才会清空待同步区；迁移前的本机 JSON 会另存为 localStorage 备份。
6. 在另一台设备打开同一网页，输入同一写入密钥。云端零件数据和修改历史即可共享。

迁移接口采用保护性策略：若云端已经存在不同版本的同编号零件，会返回冲突编号并拒绝覆盖；本机数据保持不变。需要先人工处理冲突，不能用本机快照盲目覆盖云端。

## 保存与离线行为

- 在线且密钥有效：字段修改和人工确认写入 D1，服务器返回版本号。
- 在线但未输入/密钥错误：拒绝云端写入并提示验证密钥，不会假装保存成功。
- 网络中断或 API 暂不可用：修改保存在当前浏览器，并明确显示“本机暂存／尚未同步”。
- 公开访问者可以读取零件记录，但没有写入密钥不能修改或迁移数据。
- 本机预览仍可使用 tools/inspection_server.py 和 SQLite；本地 SQLite 不会自动同步到云端。

## API 地址

- 健康检查：https://transfer-station-api.dk-weather.workers.dev/api/health
- 零件记录：https://transfer-station-api.dk-weather.workers.dev/api/parts
- 单个零件历史：https://transfer-station-api.dk-weather.workers.dev/api/parts/A01/history
