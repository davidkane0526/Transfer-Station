# Transfer Station 云端数据库配置

GitHub Pages 公开显示装配、BOM、人工确认、修订历史和低清素材。管理员在 Cloudflare Worker 的登录页输入账号密码。编辑、人工确认、恢复历史、导入本机记录和读取原件密钥都需要会话。D1 保留零件版本、迁移历史和会话有效期。

## 配置部署

1. 在仓库 **Settings → Secrets and variables → Actions** 确认已有 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。Token 限定到 `dk-weather.workers.dev` 对应账户，授予 Workers Scripts 和 D1 编辑权限，以及 Account Settings 读取权限。 [源仓库设置](https://github.com/davidkane0526/Transfer-Station/settings/secrets/actions)
2. 在 Cloudflare 中选择现有 `transfer-station-api` Worker，打开 **Settings → Variables and Secrets → Add**，添加类型为 **Secret** 的 `ADMIN_CREDENTIAL`。用下面的命令在本机生成值，然后把输出的 JSON 录入该 Secret。使用密码管理器生成至少 20 字符的随机密码并保存。以前的 `TRANSFER_STATION_WRITE_TOKEN` 和 `WRITE_TOKEN` 在这一版本已经停用。

   Windows PowerShell 7（在仓库目录执行）：

   ```powershell
   $account = Read-Host "管理员账号"
   Read-Host "管理员密码" -MaskInput |
     node tools/prepare-admin-credential.mjs $account |
     Set-Clipboard
   ```

   Bash（在仓库目录执行）：

   ```bash
   read -r -p '管理员账号：' transfer_admin
   read -r -s -p '管理员密码：' transfer_password
   printf '\n'
   printf '%s' "$transfer_password" | node tools/prepare-admin-credential.mjs "$transfer_admin"
   unset transfer_password
   ```

3. 给同一个 Worker 添加 **Secret** `MEDIA_KEY`，填入加密素材时使用的 64 字符十六进制密钥。删除凭据剪贴板内容前，确认管理员密码和媒体密钥都备份到了你的密码管理器。源码、GitHub 和 GitHub Actions 仅需部署凭据，管理员凭据和媒体密钥均直接存入 Cloudflare Worker。
4. 推送加密素材到 `transfer-station-media`，将代码与低清预览发布到 `main`。GitHub Actions 会复用现有 D1 并应用新增会话表。必要时手动运行部署工作流，确认数据库 schema、Worker 部署和健康检查步骤都执行成功。 [部署工作流](https://github.com/davidkane0526/Transfer-Station/actions/workflows/deploy-cloud-api.yml)
5. 检查 [生产健康检查](https://transfer-station-api.dk-weather.workers.dev/api/health) 和 [零件 API](https://transfer-station-api.dk-weather.workers.dev/api/parts)。打开 V220 验证游客能读、只能看低清图，管理员可登录并解密一张图和一个视频，退出后恢复只读。检查新版本发布时保留已有的 D1 记录。本机尚未同步的记录，按下节处理。

## 本机备份和首次迁移

在原先编辑零件的浏览器和原网址打开页面，登录后选择任意零件，在右侧展开 **云端数据库与同步**。先导出本机备份，再把本机修改迁移到云端。相同编号已有不同的云端记录时，当前迁移接口会报告冲突，保留备份并逐项核对。离线暂存和历史仍保留在原浏览器，恢复网络后重新打开页面检查连接。预览服务器的 SQLite 只在本机使用。

## 素材发布

此批素材的低清图和静音视频片段在 `assets/media`，最长边最多 256 像素，视频最多 12 秒。原件使用 AES-256-GCM 加密，每个文件的密文含随机 IV 和完整性标签。GitHub 的 `transfer-station-media` 分支仅保存密文，文件路径为 `<keyId>/<assetId>.bin`。在同一标签页登录后，可在素材库查看原图和同分辨率的 H.264 视频播放版，也可下载逐字节保留的原件。

新增素材可以在本机运行 `tools/prepare-media.py`。需要 Python 的 `pillow`、`cryptography` 和 `imageio-ffmpeg`，输入为原始 ZIP、公开预览输出目录、独立密文输出目录和 `--key-file`。将密钥文件单独保存在密码管理器或本机的受限目录。更新素材时用生成的清单和预览替换公开文件，确保同批密文在素材分支能取到。
